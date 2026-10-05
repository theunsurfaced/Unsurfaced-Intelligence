/**
 * proof_report_stand.mjs  --  EX7b THE COUNTER: the report shelf on the stand and the Stripe door.
 * Runs the shipped module on fakes. Run from the repo root: node worker/proofs/proof_report_stand.mjs
 *   M  migration 0035
 *   W  wiring: dispatch, media refusal, webhook branch, admin case
 *   S  the Checkout session the house asks for
 *   C  checkout: published issue only, honeypot, closed counter
 *   P  paid: verified with Stripe, recorded once, a signed link
 *   K  relink: by the email paid with
 *   F  file: signature, clock, per-link limit, the PDF with its name
 *   A  the shelf row from a read; pages counted from the PDF
 *   G  the page
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('weekly/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0035_report_stand.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const quiet = () => { const o = console.log, e = console.error; const logs = []; console.log = (...a) => logs.push(a.join(' ')); console.error = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; console.error = e; } }; };

// ── M ─────────────────────────────────────────────────────────────────
ok(/create table if not exists public\.report_issues/.test(mig) && /create table if not exists public\.report_orders/.test(mig) && /stripe_session_id\s+text not null unique/.test(mig) && (mig.match(/enable row level security/g) || []).length === 2 && (mig.match(/revoke all on public\.report_\w+ from anon, authenticated/g) || []).length === 2,
  'M1 0035 makes the shelf and the orders, the session id unique, both service-role only');

// ── W ─────────────────────────────────────────────────────────────────
ok(/if \(path\.startsWith\('\/api\/report\/'\)\) return handleReportStand\(request, url, env, origin/.test(w) && /if \(\/\^reads\\\/pdf\\\/\/i\.test\(key\)\) return json\(\{ ok: false, error: 'not found' \}, 404/.test(w),
  'W1 the stand is dispatched; a report PDF never leaves through /media/');
ok(/o\.metadata\.kind === 'report'\) \{[^]*?await rsRecordOrder\(env, o, 'webhook'\)/.test(w) && /case '\/reads\/stand':/.test(w) && /case '\/reads\/shelf':/.test(w) && /if \(path === '\/reads\/stand'\) \{/.test(w) && /if \(path === '\/reads\/shelf'\) \{/.test(w),
  'W2 the webhook records report orders; the admin doors /reads/stand and /reads/shelf exist');
ok(/status: body\.live === true \? 'published' : 'draft'/.test(w) && /if \(!\['published', 'draft', 'withdrawn'\]\.includes\(want\)\) return json\(\{ ok: false, error: 'bad_status' \}/.test(w) && /if \(want === 'published'\) patch\.published_at = new Date\(\)\.toISOString\(\);/.test(w),
  'W3 staging is the default and sending live is a separate, explicit act; the switch takes only the three states');

// ── the module on fakes ───────────────────────────────────────────────
const mod = w.slice(w.indexOf('/* SEAM:REPORT_STAND\n'));
const helpers = between(w, 'function wkStr(', 'async function wkVerifyTurnstile(');
const form = between(w, 'function encodeForm(', 'async function stripeApi(');
let stripeCalls = [], stripeFake = null, sbGets = [], sbFetches = [], gets = {}, fetches = {}, kv = {};
const env = { STRIPE_SECRET_KEY: 'sk_test', SUPABASE_SERVICE_ROLE_KEY: 'svc', RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } },
  MEDIA: { get: async key => key === 'reads/pdf/7/abc.pdf' ? { body: 'PDFBODY', size: 1234, httpEtag: '"e"' } : null } };
const S = new Function('wkPlainJson', 'wkSbGet', 'wkSbFetch', 'stripeApi', 'sbRest', 'readPdf', 'readRow', 'WK_MAX_FIELD', 'WK_SITE_ORIGIN_DEFAULT',
  helpers + form + mod + '; return { handleReportStand, rsSessionParams, rsIssues, rsCheckout, rsPaid, rsRelink, rsFile, rsRecordOrder, rsIssueFromRead, rsPdfPages, rsPublishFromRead, RS_LIMITS, encodeForm, rsPriceLaw, rsHousePrice, RS_PRICE };')(
  () => (o, st) => ({ _json: o, _status: st || 200 }),
  async (env, path) => { sbGets.push(path); for (const k of Object.keys(gets)) if (path.startsWith(k)) return gets[k](path); return []; },
  async (env, path, init) => { sbFetches.push({ path, init }); for (const k of Object.keys(fetches)) if (path.startsWith(k)) return fetches[k](path, init); return { ok: true, json: async () => [], text: async () => '' }; },
  async (env, path, method, params) => { stripeCalls.push({ path, method, params }); return stripeFake ? stripeFake(path, method, params) : null; },
  async () => [{ source_name: 'Billboard' }], async () => ({ body: new ArrayBuffer(8), fresh: true }), async () => null, 120, 'https://unsurfaced-intelligence.com');
const json = (o, st) => ({ _json: o, _status: st || 200 });
const req = (body, ip) => ({ method: 'POST', headers: { get: h => h === 'CF-Connecting-IP' ? (ip || '1.2.3.4') : '' }, json: async () => body });

// ── S ─────────────────────────────────────────────────────────────────
const params = S.rsSessionParams({ issue_no: 1, title: 'Culture paid for proximity', price_cents: 2000, currency: 'usd' }, 'https://unsurfaced-intelligence.com', 'buyer@example.com');
ok(params.mode === 'payment' && params.line_items[0].price_data.unit_amount === 2000 && params.line_items[0].price_data.product_data.name === 'Unsurfaced Cultural Intelligence Report, Issue 001' && params.metadata.kind === 'report' && params.metadata.issue_no === '1' &&
  params.success_url === 'https://unsurfaced-intelligence.com/weekly/?paid={CHECKOUT_SESSION_ID}#report' && /\/weekly\/\?paid=cancel#report$/.test(params.cancel_url) && params.customer_email === 'buyer@example.com' && !S.rsSessionParams({ issue_no: 1, price_cents: 2000 }, 'x', 'nope').customer_email,
  'S1 the session is one payment for the issue at its price, the issue in the metadata, the buyer sent back to the stand with the session id; an unreadable email is not prefilled');
const enc = S.encodeForm(params);
ok(/line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=2000/.test(enc) && /metadata%5Bkind%5D=report/.test(enc) && /success_url=https%3A%2F%2Funsurfaced-intelligence\.com%2Fweekly%2F%3Fpaid%3D%7BCHECKOUT_SESSION_ID%7D%23report/.test(enc),
  'S2 Stripe receives it form-encoded with the nested keys it expects');

// ── C ─────────────────────────────────────────────────────────────────
gets = { 'report_issues?issue_no=eq.1&status=eq.published': () => [{ issue_no: 1, title: 'Culture paid for proximity', price_cents: 2000, currency: 'usd', r2_key: 'reads/pdf/7/abc.pdf' }] };
stripeFake = (path, method) => path === 'checkout/sessions' && method === 'POST' ? { id: 'cs_test_abc123456789', url: 'https://checkout.stripe.com/c/pay/cs_test_abc123456789' } : null;
let q = quiet();
let r = await S.rsCheckout(req({ issue_no: 1 }), env, json);
q.done();
ok(r._status === 200 && r._json.ok && r._json.url === 'https://checkout.stripe.com/c/pay/cs_test_abc123456789' && stripeCalls.length === 1 && stripeCalls[0].params.metadata.issue_no === '1',
  'C1 a published issue opens a Checkout session and the stand sends the buyer to it');
r = await S.rsCheckout(req({ issue_no: 9 }), env, json);
ok(r._status === 404 && stripeCalls.length === 1, 'C2 an issue not on the shelf opens nothing');
r = await S.rsCheckout(req({ issue_no: 1, hp: 'bot' }), env, json);
ok(r._status === 200 && r._json.url === null && stripeCalls.length === 1, 'C3 the honeypot answers politely and opens nothing');
r = await S.rsCheckout(req({ issue_no: 1 }), { RATE_LIMIT: env.RATE_LIMIT }, json);
ok(r._status === 503 && /closed/.test(r._json.error), 'C4 without the Stripe key the counter says it is closed');

// ── P ─────────────────────────────────────────────────────────────────
const session = { id: 'cs_test_abc123456789', payment_status: 'paid', mode: 'payment', metadata: { kind: 'report', issue_no: '1' }, customer_details: { email: 'Buyer@Example.com' }, amount_total: 2000, currency: 'usd', payment_intent: 'pi_1' };
stripeFake = (path, method) => method === 'GET' && path === 'checkout/sessions/cs_test_abc123456789' ? session : (() => { throw new Error('no such session'); })();
let orders = [];
fetches = { 'report_orders?on_conflict=stripe_session_id': (path, init) => { const row = JSON.parse(init.body); if (orders.some(x => x.stripe_session_id === row.stripe_session_id)) return { ok: true, json: async () => [] }; const o = Object.assign({ id: '11111111-2222-4333-8444-555555555555' }, row); orders.push(o); return { ok: true, json: async () => [o] }; } };
gets['report_orders?stripe_session_id=eq.'] = path => orders.filter(x => path.includes(encodeURIComponent(x.stripe_session_id)));
q = quiet();
r = await S.rsPaid(req({ session: 'cs_test_abc123456789' }), env, json);
q.done();
const link = r._json.url;
ok(r._status === 200 && r._json.ok && r._json.issue_no === 1 && r._json.email === 'Buyer@Example.com' && /^\/api\/report\/file\?n=1&e=\d+&o=11111111-2222-4333-8444-555555555555&s=[0-9a-f]{64}$/.test(link) && orders.length === 1 && orders[0].email_norm === 'buyer@example.com' && orders[0].via === 'return' && orders[0].amount_cents === 2000,
  'P1 a paid session is verified with Stripe, the order recorded with the email normalized, and a signed link issued');
q = quiet();
r = await S.rsPaid(req({ session: 'cs_test_abc123456789' }), env, json);
q.done();
ok(r._status === 200 && orders.length === 1 && /o=11111111-2222-4333-8444-555555555555/.test(r._json.url), 'P2 the same session again records nothing new and links the same order');
r = await S.rsPaid(req({ session: 'bad id' }), env, json);
ok(r._status === 400, 'P3 a malformed session id is refused before Stripe is asked');
stripeFake = () => Object.assign({}, session, { payment_status: 'unpaid' });
r = await S.rsPaid(req({ session: 'cs_test_abc123456789' }), env, json);
ok(r._status === 402, 'P4 an unpaid session gets no link');
stripeFake = () => Object.assign({}, session, { metadata: { kind: 'study_funding' } });
r = await S.rsPaid(req({ session: 'cs_test_abc123456789' }), env, json);
ok(r._status === 402, 'P5 a session that is not a report purchase gets no report');
q = quiet();
const rec = await S.rsRecordOrder(env, session, 'webhook');
q.done();
ok(rec.id === '11111111-2222-4333-8444-555555555555' && orders.length === 1, 'P6 the webhook path records once too, and finds the kept order when the session is already there');

// ── K ─────────────────────────────────────────────────────────────────
gets['report_orders?email_norm=eq.'] = path => /email_norm=eq\.buyer%40example\.com&issue_no=eq\.1/.test(path) ? [{ id: '11111111-2222-4333-8444-555555555555', issue_no: 1 }] : [];
r = await S.rsRelink(req({ email: ' Buyer@Example.com ', issue_no: 1 }), env, json);
ok(r._status === 200 && /o=11111111-2222-4333-8444-555555555555/.test(r._json.url), 'K1 a buyer who comes back gets a fresh link by the email they paid with, however they type it');
r = await S.rsRelink(req({ email: 'stranger@example.com', issue_no: 1 }), env, json);
ok(r._status === 404, 'K2 an email with no order gets nothing');
r = await S.rsRelink(req({ email: 'not an email', issue_no: 1 }), env, json);
ok(r._status === 400, 'K3 a bad email is refused');
r = await S.rsRelink(req({ email: 'buyer@example.com', issue_no: 1, hp: 'x' }), env, json);
ok(r._status === 200 && r._json.url === null, 'K4 the honeypot on the relink door');

// ── F ─────────────────────────────────────────────────────────────────
const u = new URL('https://api.unsurfaced-intelligence.com' + link);
let res = await S.rsFile({ headers: { get: () => '' } }, u, env, json);
ok(res.status === 200 && res.headers.get('Content-Disposition') === 'attachment; filename="Unsurfaced-Cultural-Intelligence-Report-Issue-001.pdf"' && res.headers.get('Content-Type') === 'application/pdf' && res.headers.get('Cache-Control') === 'private, no-store',
  'F1 a good link streams the PDF from R2 under its own name, never cached');
const bad = new URL(u.href); bad.searchParams.set('s', 'f'.repeat(64));
res = await S.rsFile({ headers: { get: () => '' } }, bad, env, json);
ok(res.status === 302 && /\/weekly\/\?report=bad#report$/.test(res.headers.get('Location')), 'F2 a forged signature goes back to the stand with a reason');
const old = new URL(u.href); old.searchParams.set('e', '1000');
res = await S.rsFile({ headers: { get: () => '' } }, old, env, json);
ok(res.status === 302 && /report=expired/.test(res.headers.get('Location')), 'F3 a stale link goes back to the stand');
for (let i = 0; i < 5; i++) await S.rsFile({ headers: { get: () => '' } }, u, env, json);
res = await S.rsFile({ headers: { get: () => '' } }, u, env, json);
ok(res.status === 302 && /report=expired/.test(res.headers.get('Location')), 'F4 a link is good for six downloads, then it is spent');

// ── A ─────────────────────────────────────────────────────────────────
const row = { id: 7, kind: 'report', window_start: '2026-07-08', window_end: '2026-10-03', meta: { issue_no: 1 }, read: { title: 'Culture paid for proximity', subtitle: 'What people paid for', ground_line: 'Read from 18,400 signals', thesis: 'Three sentences.', cover_image: 'S11' } };
const issue = S.rsIssueFromRead(row, { key: 'reads/pdf/7/abc.pdf', bytes: 1234 }, 22, 'Billboard', NaN);
ok(issue.issue_no === 1 && issue.house_read_id === 7 && issue.cover_story_id === 11 && issue.cover_credit === 'Billboard' && issue.r2_key === 'reads/pdf/7/abc.pdf' && issue.byte_size === 1234 && issue.page_count === 22 && issue.price_cents === 2000 && issue.status === 'draft' && issue.published_at === null && issue.title === 'Culture paid for proximity' && S.rsIssueFromRead(row, null, null, null, 2500).price_cents === 2500 && S.rsIssueFromRead(row, null, null, null, 5).price_cents === 2000,
  'A1 the shelf row carries the read\'s claim, what it means, the ground line, the cover story and credit, the PDF and its size, pages, and the price (default $20, never under $1); it is staged as a draft');
ok(S.rsIssueFromRead(row, null, null, null, NaN, 'published').status === 'published' && typeof S.rsIssueFromRead(row, null, null, null, NaN, 'published').published_at === 'string' && S.rsIssueFromRead(row, null, null, null, NaN, 'anything').status === 'draft',
  'A1b only an explicit published lands live; any other word stages');
ok(S.rsPdfPages(new TextEncoder().encode('%PDF-1.4 1 0 obj << /Type /Pages /Kids [] >> 2 0 obj << /Type /Page /Parent 1 0 R >> 3 0 obj << /Type /Page >> 4 0 obj << /Type /Pattern >>').buffer) === 2, 'A2 pages are counted from the page objects, not the tree or a pattern');
const iss = await S.rsIssues(env, json);
gets['report_issues?status=eq.published'] = () => [{ issue_no: 1, title: 't', cover_story_id: 11, price_cents: 2000 }];
const iss2 = await S.rsIssues(env, json);
ok(iss._json.ok && Array.isArray(iss._json.issues) && iss2._json.issues[0].cover_url === '/img/s/11', 'A3 the shelf lists published reports with the cover through the public story relay');

// ── G ─────────────────────────────────────────────────────────────────
ok(/<section class="report" id="report" aria-labelledby="r-head" hidden>/.test(page) && /id="r-buy" type="button">Buy this report &middot; \$20<\/button>/.test(page) && /id="r-again" type="button">Bought it\? Get it again<\/button>/.test(page) && /<form class="r-door" id="r-relink" hidden novalidate>/.test(page) && /<div class="r-paid" id="r-paid" hidden>/.test(page),
  'G1 the stand carries the report shelf: the cover, the claim, the price, the buy button, the come-back door, the paid state');
ok(/loadReports\(\);   \/\/ SEAM:REPORT_STAND/.test(page) && /function reportReturn\(\)/.test(page) && /searchParams\.get\('paid'\)/.test(page) && /\/api\/report\/paid/.test(page) && /\/api\/report\/checkout/.test(page) && /\/api\/report\/relink/.test(page) && /\/api\/report\/issues/.test(page),
  'G2 the page loads the shelf, sends the buyer to Checkout, confirms the return, and relinks by email');
const sect = between(page, '<section class="report"', '<section class="counter"');
ok(!/free/i.test(sect) && /\$20/.test(sect) && /Paid through Stripe/.test(sect) && /ten minutes/.test(sect), 'G3 the report section says plainly that it is paid, and never calls itself free');
ok(/REPORT_NOTICES = \{[^]*?cancel: 'No charge\./.test(page) && /function reportNotice\(\)/.test(page) && /searchParams\.get\('report'\)/.test(page), 'G4 a cancelled checkout and a spent link each get a plain notice');
ok(/SEAM:REPORT_STAND/.test(page) && /SEAM:REPORT_STAND/.test(w), 'G5 the seam is tagged on the worker and the page');
const rpage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
ok(/function standShow\(row, issue, note\)/.test(rpage) && /id="stand-stage">Stage on the stand</.test(rpage) && /id="stand-live">Send live at /.test(rpage) && /id="stand-off">Take it off the stand</.test(rpage) && /if \(!confirm\("Send issue "/.test(rpage) && /go\(lb, "\/reads\/shelf", \{ issue_no: issueNo, status: "published" \}/.test(rpage) && /if \(\(row\.kind === "report" \|\| row\.kind === "weekly"\) && \(row\.status === "ready" \|\| row\.status === "published"\)\) standLoad\(row\)/.test(rpage),
  'G6 the house side carries the switch on a ready report: stage, send live (confirmed), take off; the stand page itself has no such door');

// ── SEAM:REPORT_PRICE: the price law ──
ok(S.rsPriceLaw(2500, null) === 2500 && S.rsPriceLaw('1999', null) === 1999 && S.rsPriceLaw(99, null) === null && S.rsPriceLaw(1000001, null) === null && S.rsPriceLaw('x', 2000) === 2000 && S.rsPriceLaw(NaN, 50) === null && S.rsPriceLaw(12.5, 2000) === 2000,
  'Q1 a price is whole cents between $1 and $10,000; otherwise the fallback, and a bad fallback is nothing');
ok(S.rsHousePrice({}) === 2000 && S.rsHousePrice({ REPORT_PRICE_CENTS: '3500' }) === 3500 && S.rsHousePrice({ REPORT_PRICE_CENTS: '5' }) === 2000 && S.RS_PRICE.DEFAULT === 2000,
  'Q2 the house price is REPORT_PRICE_CENTS when it obeys the law, else $20');
ok(S.rsIssueFromRead(row, null, null, null, 4500).price_cents === 4500 && S.rsIssueFromRead(row, null, null, null, 10).price_cents === 2000, 'Q3 the shelf row takes a lawful price and falls back to $20');
ok(/const keep = had && had\[0\] \? had\[0\]\.price_cents : null;/.test(w) && /rsPriceLaw\(body && body\.price_cents, rsPriceLaw\(keep, rsHousePrice\(env\)\)\)/.test(w),
  'Q4 a re-stage keeps the price the issue has; a given price wins; a new issue takes the house price');
ok(/if \(!want && body\.price_cents != null\)/.test(w) && /error: 'bad_price', min_cents: RS_PRICE\.MIN/.test(w) && /'shelf_price'/.test(w), 'Q5 /reads/shelf sets a price on its own, live or not, and refuses an unlawful one with the bounds');
const readPage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
ok(/id="stand-price"/.test(readPage) && /id="stand-price-set">Set price/.test(readPage) && /the next checkout pays this price/.test(readPage), 'Q6 the stand bar carries the price field and says what a change means when the issue is live');

console.log('proof_report_stand: ' + pass + ' checks PASS');
