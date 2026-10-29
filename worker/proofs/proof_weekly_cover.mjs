/**
 * proof_weekly_cover.mjs  --  SEAM:WEEKLY_COVER: the stand's cover is the issue's own first page, rendered through
 * Browser Rendering from the print page, with the PDF's ticket; the raw photograph is only the fallback.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const fn = w.slice(w.indexOf('/* SEAM:WEEKLY_COVER: the stand'), w.indexOf('/* SEAM:WEEKLY_SHELF: put a ready weekly'));
const rp = w.slice(w.indexOf('const READ_PRINT = '), w.indexOf('\n', w.indexOf('const READ_PRINT = ')));
const hx = w.slice(w.indexOf('function readHex('), w.indexOf('\n', w.indexOf('function readHex(')));
let kv, r2, calls, answer, logs;
const reset = () => { kv = new Map(); r2 = new Map(); calls = []; logs = []; };
const env = { CF_ACCOUNT_ID: 'acct', CF_BROWSER_TOKEN: 'tok',
  RATE_LIMIT: { get: async k => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); } },
  MEDIA: { put: async (k, v, o) => { r2.set(k, { v, o }); } } };
const fakeFetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body), ticketLive: kv.size });
  if (answer.throws) throw new Error('network');
  return new Response(answer.body, { status: answer.status || 200, headers: { 'content-type': answer.type } }); };
const C = new Function('fetch', 'console', rp + '\n' + hx + '\n' + fn + '; return { wkCoverRender, WK_COVER };')(fakeFetch, { log: (...a) => logs.push(a) });
const jpeg = n => { const b = new Uint8Array(n); b[0] = 0xFF; b[1] = 0xD8; b[2] = 0xFF; return b; };

reset(); answer = { body: jpeg(400000), type: 'image/jpeg' };
const key = await C.wkCoverRender(env, { id: 41 }, 5);
const c = calls[0];
ok(c.url === 'https://api.cloudflare.com/client/v4/accounts/acct/browser-rendering/screenshot', 'C1 renders through the Browser Rendering screenshot endpoint');
ok(c.body.selector === 'section.page.cover' && /<section class="page cover' \+ \(coverSlot && coverSlot\.kind === "type" \? " type" : ""\) \+ '">/.test(page), 'C2 captures exactly the print page\'s cover section, the PDF\'s page one (the class carries the typographic mark on both layouts since ED2)');
ok(c.body.viewport.width === 816 && c.body.viewport.height === 1056 && c.body.viewport.deviceScaleFactor === 2, 'C3 letter size at 96 px a inch, twice the pixels');
ok(c.body.screenshotOptions.type === 'jpeg' && c.body.screenshotOptions.quality === 86, 'C4 a JPEG at quality 86');
ok(c.body.addStyleTag[0].content.includes('.bar,.social,.noprint{display:none!important}') && c.body.addStyleTag[0].content.includes('.page.cover{min-height:11in!important}'),
  'C5 the print rules are added (no desk bar, no social frame, the full 11 in cover)');
ok(c.body.waitForSelector.selector === 'html[data-print-ready="1"]' && c.body.waitForSelector.timeout <= 60000 && c.body.gotoOptions.timeout <= 60000, 'C6 waits for every photo to settle, inside the 60 s limits');
ok(/\/intelligence\/read\/\?id=41&rt=[0-9a-f]{64}$/.test(c.body.url) && c.ticketLive === 1 && kv.size === 0, 'C7 the page opens on a live 32-byte ticket, spent after the render');
ok(/^weekly\/cover-005-p[0-9a-f]{8}\.jpg$/.test(key) && r2.get(key).o.httpMetadata.contentType === 'image/jpeg' && r2.get(key).v.byteLength === 400000, 'C8 kept in R2 under a fresh key for the issue, as image/jpeg');

reset(); answer = { body: JSON.stringify({ errors: [{ message: 'timeout' }] }), type: 'application/json', status: 500 };
let err = null; try { await C.wkCoverRender(env, { id: 41 }, 5); } catch (e) { err = e.message; }
ok(/^cover_render_failed 500/.test(err) && r2.size === 0 && kv.size === 0, 'C9 a failed render throws, keeps nothing, and spends the ticket');
reset(); answer = { body: jpeg(900), type: 'image/jpeg' };
err = null; try { await C.wkCoverRender(env, { id: 41 }, 5); } catch (e) { err = e.message; }
ok(err && r2.size === 0, 'C10 a near-empty image is refused');
reset(); answer = { throws: true };
err = null; try { await C.wkCoverRender(env, { id: 41 }, 5); } catch (e) { err = e.message; }
ok(err === 'network' && kv.size === 0, 'C11 the ticket is spent even when the call itself fails');
err = null; try { await C.wkCoverRender({}, { id: 41 }, 5); } catch (e) { err = e.message; }
ok(/^print_not_configured/.test(err), 'C12 refuses without the Browser Rendering credentials');

const stand = w.slice(w.indexOf('async function wkStandNew('), w.indexOf('/* SEAM:READ_PRUNE PURE: may this version go?'));
ok(stand.indexOf('coverKey = await wkCoverRender(env, row, n)') > 0 && stand.indexOf('coverKey = await wkCoverRender(env, row, n)') < stand.indexOf('if (sid && !coverKey) {') &&
   stand.indexOf('if (sid && !coverKey) {') < stand.indexOf("readImageRelay('/img/s/'"), 'C13 a new issue tries its first page before the photograph; the photograph is only the fallback');
ok(/cover_page: \/-p\[0-9a-f\]\{8\}\\\.jpg\$\/\.test\(coverKey \|\| ''\)/.test(stand), 'C14 the door says whether the cover is the page');
const rep = w.slice(w.indexOf("if (path === '/reads/weekly-stand') {"), w.indexOf("if (path === '/reads/shelf') {"));
ok(/try \{ patch\.cover_key = await wkCoverRender\(env, row, n\); \}/.test(rep), 'C15 a recut renders its cover again, so the cover follows the cut');
const door = w.slice(w.indexOf("if (path === '/reads/weekly-cover') {"), w.indexOf("if (path === '/reads/weekly-stand') {"));
ok(/case '\/reads\/weekly-cover':/.test(w) && /issues\[0\]\.week_start !== row\.window_start/.test(door) && /body: \{ cover_key: key \}/.test(door) && !/r2_key|page_count|lead:/.test(door),
  'C16 the re-render door is routed, checks the cut is that issue\'s week, and moves only the cover key');
ok(/id="stand-weekly-cover">Render issue /.test(page) && /call\("\/reads\/weekly-cover", \{ id: row\.id, issue_no: wk\.issue_no \}\)/.test(page), 'C17 the cut on the stand offers to render its issue\'s cover');
console.log(`\nproof_weekly_cover: ${pass} checks passed`);
