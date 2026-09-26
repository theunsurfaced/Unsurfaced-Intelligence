/**
 * proof_recovery.mjs  --  executable proof for arc 2 (RECOVERY).
 * Drives the EXACT shipped /preview block against stubbed fetch, cache, KV
 * and Workers AI. Run from the repo root (the gate runs it on every pass).
 *   V  voice: studio captions and selection reasons carry no em dash
 *   T  throttle: per-IP hourly and house daily meters, fail closed
 *   E  English law: a foreign article is served translated or not at all;
 *      busy and failed states carry no foreign text and are never cached;
 *      meta withholds foreign titles; lang cannot opt out; both readers
 *      show the English catching-up state instead of opening the original
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

// ── V: voice in the strings people read ────────────────────────────────
const sel = w.slice(w.indexOf('function studioSelect('), w.indexOf('function studioSlate('));
ok(sel.length > 100 && !/—|\\u2014/.test(sel), 'V1 STUDIO selection reasons carry no em dash');
const safe = w.slice(w.indexOf('function studioSafeCaption('), w.indexOf('function studioAngle('));
ok(/String\(item\.headline \|\| ''\) \+ '\. '/.test(safe), 'V2 fallback caption joins headline and take with a sentence break');
const sv0 = w.indexOf('const STUDIO_VOICE');
const sv = w.slice(sv0, w.indexOf(';\n', sv0));
ok(sv.length > 200 && !/\\u2014|—/.test(sv), 'V3 STUDIO_VOICE teaches no em dash');

// ── extraction ─────────────────────────────────────────────────────────
const a = w.indexOf('const PV_LANG_CODES');
const z = w.lastIndexOf('/*', w.indexOf(' * DAILY PIPELINE + SEAM:MODEL_POOL'));
ok(a > 0 && z > a, 'P0 preview block located');
const block = w.slice(a, z);
ok(block.includes('const PV_THROTTLE') && block.includes('async function pvTranslateAllowed('), 'T0 throttle ships inside the preview seam');

function mkKV(init, broken) {
  const m = new Map(Object.entries(init || {}));
  return { m, get: async k => { if (broken) throw new Error('kv'); return m.has(k) ? m.get(k) : null; },
    put: async (k, v) => { m.set(k, String(v)); } };
}
let aiCalls = 0, puts = 0, fetches = 0;
const cacheStore = new Map();
const caches = { default: {
  match: async (req) => cacheStore.has(req.url) ? new Response(cacheStore.get(req.url)) : undefined,
  put: async (req, res) => { puts++; cacheStore.set(req.url, await res.text()); } } };
const html = '<html lang="fr"><head><meta property="og:title" content="Le titre"></head><body><article>' +
  '<p>Premier paragraphe assez long pour passer le filtre de longueur minimale.</p>' +
  '<p>Second paragraphe assez long pour passer le filtre de longueur minimale.</p></article></body></html>';
const fetchStub = async () => { fetches++; return { ok: true, url: 'https://example.fr/a',
  headers: { get: () => 'text/html; charset=utf-8' }, text: async () => html }; };
const json = (o) => o;
let failAll = false;
const callModel = async () => { aiCalls++; if (failAll) throw new Error('down'); return 'EN'; };
const mk = new Function('json', 'fetch', 'caches', 'callModel', block +
  '; return { PV_THROTTLE, pvTranslateAllowed, previewRoute };');
const P = mk(json, fetchStub, caches, callModel);
const AI = { run: async () => { aiCalls++; if (failAll) throw new Error('down'); return { translated_text: 'EN' }; } };
const req = (url, ip) => ({ url, headers: { get: h => h === 'CF-Connecting-IP' ? (ip || '1.2.3.4') : null } });
const hour = new Date().toISOString().slice(0, 13), day = new Date().toISOString().slice(0, 10);

// ── T: the meters ──────────────────────────────────────────────────────
let kv = mkKV();
let allowed = 0;
for (let i = 0; i < P.PV_THROTTLE.IP_HOURLY + 1; i++) if (await P.pvTranslateAllowed({ RATE_LIMIT: kv }, req('x'))) allowed++;
ok(P.PV_THROTTLE.IP_HOURLY === 60 && allowed === 60, 'T1 one IP gets 60 translations an hour, the 61st is refused');
ok(await P.pvTranslateAllowed({ RATE_LIMIT: kv }, req('x', '9.9.9.9')), 'T2 another IP is unaffected');
kv = mkKV({ ['pvt:all:' + day]: String(P.PV_THROTTLE.HOUSE_DAILY) });
ok(!(await P.pvTranslateAllowed({ RATE_LIMIT: kv }, req('x', '5.5.5.5'))), 'T3 house daily ceiling refuses everyone');
ok(!(await P.pvTranslateAllowed({ RATE_LIMIT: mkKV({}, true) }, req('x'))), 'T4 unreadable meter fails closed');
ok(await P.pvTranslateAllowed({}, req('x')), 'T5 no KV bound: allowed (dev only, as renderBudget)');

// ── E: the English law on the route ────────────────────────────────────
const U = 'https://api.unsurfaced-intelligence.com/preview?lang=en&url=' + encodeURIComponent('https://example.fr/a');
const FR = /Premier|Second|Le titre/;
kv = mkKV({ ['pvt:1.2.3.4:' + hour]: String(P.PV_THROTTLE.IP_HOURLY) });
aiCalls = 0; puts = 0;
const r1 = await P.previewRoute(req(U), { RATE_LIMIT: kv, AI }, '');
ok(r1.ok === false && r1.error === 'translation_busy', 'E1 over the line: translation_busy, an English state');
ok(!FR.test(JSON.stringify(r1)), 'E2 busy answer carries no foreign text');
ok(aiCalls === 0 && puts === 0, 'E3 busy answer spends nothing and is not cached');
kv = mkKV(); failAll = true; aiCalls = 0; puts = 0;
const rf = await P.previewRoute(req(U), { RATE_LIMIT: kv, AI }, '');
failAll = false;
ok(rf.ok === false && rf.error === 'translation_failed' && !FR.test(JSON.stringify(rf)), 'E4 translator down: translation_failed, original never passed through');
ok(puts === 0, 'E5 failed translation is not cached');
kv = mkKV(); aiCalls = 0; puts = 0;
const r2 = await P.previewRoute(req(U), { RATE_LIMIT: kv, AI }, '');
ok(r2.ok && r2.translated === true && r2.title === 'EN' && !FR.test(JSON.stringify(r2.paragraphs)), 'E6 allowed read is fully English');
ok(aiCalls === 3 && puts === 1, 'E7 one translation per text, then cached');
ok(kv.m.get('pvt:1.2.3.4:' + hour) === '1' && kv.m.get('pvt:all:' + day) === '1', 'E8 both meters move by one');
aiCalls = 0; fetches = 0;
const r3 = await P.previewRoute(req(U), { RATE_LIMIT: kv, AI }, '');
ok(r3.translated === true && aiCalls === 0 && fetches === 0 && kv.m.get('pvt:all:' + day) === '1', 'E9 cache hit: free, unmetered');
cacheStore.clear(); aiCalls = 0;
const UO = 'https://api.unsurfaced-intelligence.com/preview?lang=fr&url=' + encodeURIComponent('https://example.fr/b');
const r4 = await P.previewRoute(req(UO), { RATE_LIMIT: mkKV(), AI }, '');
ok(r4.translated === true && !FR.test(JSON.stringify(r4.paragraphs)), 'E10 lang=fr cannot opt out of English');
const UM = 'https://api.unsurfaced-intelligence.com/preview?meta=1&url=' + encodeURIComponent('https://example.fr/c');
const r5 = await P.previewRoute(req(UM), { RATE_LIMIT: mkKV(), AI }, '');
ok(r5.ok && r5.title === null && aiCalls === 3, 'E11 meta mode withholds a foreign title and spends nothing');
for (const [pf, closer] of [['daily/index.html', 'close()'], ['intelligence/index.html', 'closePv()']]) {
  const ph = fs.readFileSync(pf, 'utf-8');
  const i1 = ph.indexOf('d.error === "translation_busy" || d.error === "translation_failed"');
  const i2 = ph.indexOf('if (!d || !d.ok || !d.paragraphs || !d.paragraphs.length) { window.open(url, "_blank", "noopener"); ' + closer + '; return; }');
  ok(i1 > 0 && i2 > i1 && /TRANSLATION IS CATCHING UP\. TRY THIS STORY AGAIN IN A MINUTE\./.test(ph.slice(i1, i2)),
    'E12 ' + pf + ' shows the English state before any fallback to the original');
}

console.log(`\nproof_recovery: ${pass} checks PASS`);
