/**
 * proof_read_print.mjs  --  arc 8: the platform-rendered PDF, its ticket, its
 * keep-and-reuse, and the page's render mode.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const src = w.slice(w.indexOf('const READ_PRINT = '), w.indexOf('async function readRoute('));
let kv, r2, patches, calls, answer;
const reset = () => { kv = new Map(); r2 = new Map(); patches = []; calls = []; };
const env = { CF_ACCOUNT_ID: 'acct', CF_BROWSER_TOKEN: 'tok',
  RATE_LIMIT: { get: async k => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); } },
  MEDIA: { get: async k => r2.has(k) ? { arrayBuffer: async () => r2.get(k) } : null, put: async (k, v) => { r2.set(k, v); }, delete: async k => { r2.delete(k); } } };
const fakeFetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body), ticketLive: [...kv.keys()].length });
  return new Response(answer.body, { status: answer.status || 200, headers: { 'content-type': answer.type } }); };
const readRow = async (e, id) => ({ id: 3, read: { title: 'T' }, status: 'published', meta: {} });
const P = new Function('fetch', 'readRow', 'readReceipts', 'readPatch', 'json', 'safeJson', 'console',
  src + '; return { readPdf, readRenderTicket, readStamp };')(
  fakeFetch, readRow, async () => ({ S1: {} }), async (e, id, p) => { patches.push(p); }, (o, s) => ({ o, s }), async r => r, { log: () => {} });
const pdf = new TextEncoder().encode('%PDF-1.7 fake');

reset(); answer = { body: pdf, type: 'application/pdf' };
const row = { id: 3, read: { title: 'Neutrality' }, status: 'published', meta: {} };
let out = await P.readPdf(env, row);
const c = calls[0];
ok(c.url === 'https://api.cloudflare.com/client/v4/accounts/acct/browser-rendering/pdf', 'R1 renders through the Browser Rendering REST API');
ok(c.body.pdfOptions.format === 'letter' && c.body.pdfOptions.printBackground === true && c.body.pdfOptions.displayHeaderFooter === false &&
   c.body.pdfOptions.margin.top === '0', 'R2 letter pages, backgrounds on, no headers or footers, no margins');
ok(c.body.waitForSelector.selector === 'html[data-print-ready="1"]', 'R3 waits for the page to say every photo has settled');
ok(/\/intelligence\/read\/\?id=3&rt=[0-9a-f]{64}$/.test(c.body.url) && c.ticketLive === 1, 'R4 the page opens with a live 32-byte ticket');
ok(kv.size === 0, 'R5 the ticket is spent after the render');
const key = patches[0].meta.pdf.key;
ok(out.fresh && r2.has(key) && /^reads\/pdf\/3\/[0-9a-f]{32}\.pdf$/.test(key), 'R6 the PDF is kept in R2 under an unguessable key');

const kept = Object.assign({}, row, { meta: patches[0].meta });
out = await P.readPdf(env, kept);
ok(!out.fresh && calls.length === 1, 'R7 the same read downloads the kept file: no second render');
out = await P.readPdf(env, Object.assign({}, kept, { status: 'ready' }));
ok(!out.fresh && calls.length === 1, 'R8 publishing alone does not re-render');
out = await P.readPdf(env, Object.assign({}, kept, { read: { title: 'Changed' } }));
ok(out.fresh && calls.length === 2 && !r2.has(key), 'R9 a changed read renders fresh and the old file is removed');

reset(); answer = { body: '{"success":false,"errors":[{"message":"Timeout"}]}', type: 'application/json', status: 422 };
let err = null; try { await P.readPdf(env, row); } catch (e) { err = String(e.message); }
ok(err && /render_failed 422/.test(err) && /Timeout/.test(err) && r2.size === 0, 'L1 a failed render is an error, never a stored file');
err = null; try { await P.readPdf({ MEDIA: env.MEDIA, RATE_LIMIT: env.RATE_LIMIT }, row); } catch (e) { err = String(e.message); }
ok(err && /print_not_configured/.test(err), 'L2 missing secrets fail loud');

reset(); kv.set('rpt:' + 'a'.repeat(64), '3');
let t = await P.readRenderTicket({ rt: 'a'.repeat(64) }, env, '');
ok(t.s === 200 && t.o.ok && t.o.read.id === 3 && t.o.receipts, 'T1 a live ticket trades for its one read and receipts');
t = await P.readRenderTicket({ rt: 'b'.repeat(64) }, env, '');
ok(t.s === 403 && t.o.error === 'ticket_expired', 'T2 an unknown or expired ticket is refused');
t = await P.readRenderTicket({ rt: 'x' }, env, '');
ok(t.s === 403 && t.o.error === 'bad_ticket', 'T3 a malformed ticket is refused before KV');

const pub = w.slice(w.indexOf('async fetch('), w.indexOf('// Everything below requires a signed-in user'));
ok(/'\/reads\/render' && request\.method === 'POST'\) return readRenderTicket/.test(pub), 'T4 the ticket door is the only public read door');
ok(/case '\/reads\/pdf':\s+return readRoute/.test(w), 'T5 /reads/pdf sits behind the admin door');

ok(/RT \? fetch\(API \+ "\/reads\/render"/.test(page) && /setAttribute\("data-print-ready", "1"\)/.test(page), 'G1 render mode reads by ticket and raises data-print-ready');
ok(/fetch\(API \+ "\/reads\/pdf"/.test(page) && !/window\.print\(\)/.test(page), 'G2 Download PDF fetches the platform file; the print dialog is gone');
ok(/PDF failed: /.test(page), 'G3 a failed render shows on the button');
console.log(`\nproof_read_print: ${pass} checks PASS`);
