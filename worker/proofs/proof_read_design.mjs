/**
 * proof_read_design.mjs  --  arc 7: the image relay's laws, image ids in receipts
 * and validation, contract v2, and the magazine page.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const fn = (name, next) => { const a = w.indexOf('function ' + name + '('); return w.slice(w.lastIndexOf('\n', a) + 1, w.indexOf(next, a)); };

// ---- the relay, run against a fake edge, Supabase and web
const relaySrc = w.slice(w.indexOf('const READ_IMG = '), w.indexOf('async function readRoute('));
const pvSrc = fn('pvBlockedHost', 'function pvDecode(') + fn('pvDecode', 'function pvMeta(') + fn('pvMeta', 'function pvExtract(');
let store, rows, web, fetched, sbCalls;
const reset = () => { store = new Map(); rows = []; web = {}; fetched = []; sbCalls = []; };
const caches = { default: { match: async k => { const r = store.get(k.url); return r ? r.clone() : undefined; }, put: async (k, r) => { store.set(k.url, r); } } };
const sbRest = async (env, path) => { sbCalls.push(path); return rows; };
const fakeFetch = async (href) => { fetched.push(href); const h = web[href]; if (!h) throw new Error('offline');
  return new Response(h.body, { status: h.status || 200, headers: Object.assign({ 'content-type': h.type }, h.headers || {}) }); };
const R = new Function('sbRest', 'caches', 'fetch', 'console', pvSrc + relaySrc + '; return { readImageRelay, readImgUrl };')(
  sbRest, caches, fakeFetch, { log: () => {} });
const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]);

reset();
rows = [{ image_url: 'http://cdn.example.com/small.jpg', source_url: 'https://news.example.com/story' }];
web['https://news.example.com/story'] = { type: 'text/html', body: '<meta property="og:image" content="/big.jpg">' };
web['https://news.example.com/big.jpg'] = { type: 'image/jpeg', body: png };
let r = await R.readImageRelay('/img/s/727', {});
ok(r.status === 200 && r.headers.get('content-type') === 'image/jpeg', 'I1 the source page og:image is served first, full size');
ok(/editions!inner\(status\)&editions\.status=eq\.published/.test(sbCalls[0]), 'I2 only a story in a published edition is reachable');
ok(r.headers.get('access-control-allow-origin') === '*' && /max-age=604800/.test(r.headers.get('cache-control')), 'I3 CORS open for the canvas, cached 7 days');
const n = fetched.length; r = await R.readImageRelay('/img/s/727', {});
ok(r.status === 200 && fetched.length === n && sbCalls.length === 1, 'I4 a second view is an edge hit: no Supabase, no fetch');

reset();
rows = [{ image_url: 'http://cdn.example.com/small.jpg', source_url: 'https://gone.example.com/x' }];
web['https://cdn.example.com/small.jpg'] = { type: 'image/png', body: png };
r = await R.readImageRelay('/img/s/728', {});
ok(r.status === 200 && fetched.includes('https://cdn.example.com/small.jpg') && !fetched.some(f => f.startsWith('http:')), 'I5 falls back to the stored image, upgraded to https');

reset();
rows = [{ image_url: 'https://cdn.example.com/page.html', source_url: null }];
web['https://cdn.example.com/page.html'] = { type: 'text/html', body: '<html>' };
r = await R.readImageRelay('/img/s/729', {});
ok(r.status === 404 && /max-age=86400/.test(r.headers.get('cache-control')), 'I6 a non-image is refused; the miss is cached one day');

reset();
rows = [{ image_url: 'https://cdn.example.com/huge.jpg', source_url: null }];
web['https://cdn.example.com/huge.jpg'] = { type: 'image/jpeg', body: png, headers: { 'content-length': '9000000' } };
r = await R.readImageRelay('/img/s/730', {});
ok(r.status === 404, 'I7 over 6 MB is refused');

reset(); rows = [];
r = await R.readImageRelay('/img/s/731', {});
ok(r.status === 404 && fetched.length === 0, 'I8 an unpublished or unknown story fetches nothing');
reset();
r = await R.readImageRelay('/img/s/../../secrets', {});
ok(r.status === 404 && sbCalls.length === 0, 'I9 only a numeric id is accepted');
ok(R.readImgUrl('https://127.0.0.1/a.jpg') === null && R.readImgUrl('https://localhost/a.jpg') === null &&
   R.readImgUrl('https://x.com:8443/a.jpg') === null && R.readImgUrl('ftp://x.com/a.jpg') === null &&
   R.readImgUrl('http://x.com/a.jpg') === 'https://x.com/a.jpg', 'I10 private hosts, ports and non-web schemes refused; http upgraded');
ok(!/env\.AI|callModel|callClaude/.test(relaySrc), 'I11 the relay spends nothing on AI');
ok(/path\.startsWith\('\/img\/s\/'\)\) return readImageRelay\(path, env\)/.test(w.slice(w.indexOf('async fetch('), w.indexOf('// Everything below requires a signed-in user'))),
  'I12 the relay is routed before sign-in (an img tag carries no session)');

// ---- receipts resolve image ids
const ra = w.indexOf('async function readReceipts('), rb = w.indexOf('const READ_IMG = ');
let q = [];
const readReceipts = new Function('sbRest', w.slice(ra, rb) + '; return readReceipts;')(async (e, p) => { q.push(p);
  return [{ id: 5, headline: 'h', source_name: 's', source_url: 'https://s', image_url: null, editions: { date: '2026-09-14', issue_no: 70 } },
          { id: 6, headline: 'h', source_name: 's', source_url: null, image_url: null, editions: null }]; });
const rc = await readReceipts({}, { cover_image: 'S5', patterns: [{ lead_image: 'S6', evidence: ['S5'] }] });
ok(/id=in\.\(5,6\)/.test(q[0]) && /image_url/.test(q[0]), 'R1 cover_image and lead_image ids are resolved with the evidence');
ok(rc.S5.has_image === true && rc.S6.has_image === false, 'R2 each receipt says whether a photograph can be tried');

// ---- validation: an image id must come from the pack
const va = w.indexOf('function readValidate('), vb = w.indexOf('async function readRow(');
const readValidate = new Function(w.slice(va, vb) + '; return readValidate;')();
const v = readValidate('weekly', { title: 't', thesis: 'x', cover_image: 'S999',
  patterns: [{ name: 'p', lead_image: 'S5', evidence: ['S5'] }, { name: 'q', lead_image: 'S404', evidence: ['S5'] }] }, '', [5]);
ok(v.read.patterns[0].lead_image === 'S5' && v.read.patterns[1].lead_image === undefined && v.read.cover_image === undefined &&
   v.notes.some(x => /evidence_ids_dropped:2/.test(x)) && !v.fatal.length, 'V1 an image id outside the pack is dropped, never fatal');

// ---- contract v2
const ca = w.indexOf('const READ_CONTRACT = {'), cb = w.indexOf('function readIso(');
const C = new Function(w.slice(ca, cb) + '; return READ_CONTRACT;')();
for (const k of ['weekly', 'monthly', 'record'])
  ok(/"cover_image"/.test(C[k]) && /"dek"/.test(C[k]) && /"lead_image"/.test(C[k]) && !/—/.test(C[k]), 'K ' + k + ' contract asks for cover_image, dek, lead_image');

// ---- the magazine page
ok(/\/img\/s\//.test(page) && /has_image !== false/.test(page), 'M1 photographs come through the closed relay only');
ok(/crossOrigin = "anonymous"/.test(page), 'M2 social frames draw the photographs (CORS)');
for (const k of ['rough', 'read', 'move', 'cross', 'tension', 'ad', 'ret', 'nums', 'receipts'])
  ok(new RegExp('\\b' + k + ': "').test(page.slice(page.indexOf('var EXPLAIN'), page.indexOf('var EXPLAIN') + 4000)), 'M3 section explainer: ' + k);
ok(/onerror=/.test(page), 'M4 a photograph that fails removes its frame instead of breaking the page');
ok(/x\.cover_image/.test(page) && /p\.lead_image/.test(page) && /p\.dek/.test(page), 'M5 the page honors cover_image, lead_image, dek, and falls back without them');
ok(!/—/.test(page.replace(/<style>[\s\S]*?<\/style>/, '')), 'M6 no em dash in the page copy');
console.log(`\nproof_read_design: ${pass} checks PASS`);
