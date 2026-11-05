/**
 * proof_frame_fit.mjs  --  NT3d THE FRAME: SEAM:FRAME_FIT. The page fits to the reader's frame. GET /excavate/yours (signed in, below
 * the sign-in line, ahead of the meter) says which readings on the record and in the morning are on the reader's frame and why, by the
 * push's own matching, with the brands and markets a live read can start from. A read on a frame the reader changed is kept under its own
 * key. The record gets a Your frame lens; a reading on the frame says so; a live read offers the frame one tap at a time. Run from the
 * repo root.
 */
import fs from 'fs';
import crypto from 'crypto';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DASH = /[—–]/;
const sha = async s => crypto.createHash('sha256').update(String(s)).digest('hex');

// ── A: the worker ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const fb = between(w, '/* ═══ SEAM:FRAME_FIT (NT3d THE FRAME)', '/* ═══ end SEAM:FRAME_FIT ═══ */');
const pm = between(w, 'function pushMatches(tile, prof) {', 'async function pushBrief(');
const fc = between(w, 'function excFrameClean(f) {', 'function excFrameWhole(f)');
const fwl = w.slice(w.indexOf('function excFrameWhole(f)'), w.indexOf('\n', w.indexOf('function excFrameWhole(f)')) + 1);
const REV = (/const EXC_FRAME = \{[^}]*REV: '([^']+)'/.exec(w) || [])[1];
let PROF = null, REC = null, DOOR = null; const asked = [];
const F = new Function('sbRest', 'excQuiet', 'json', 'doorRecord', 'doorSet', 'sha256hex', 'EXC_FRAME',
  pm + fc + fwl + fb + '; return { frameHas, frameMatches, yoursRoute, frameFitSig, frameFit, FRAME_FIT };')(
  async (env, p) => { asked.push(p); return PROF ? [PROF] : []; }, () => () => null, (o, status) => ({ status, body: o }), async () => REC, async () => DOOR, sha, { REV });
const T = (id, o) => Object.assign({ id, claim: 'Claim ' + id, title: 'T ' + id, question: null, frame: { entity: null, category: null, audience: null, market: 'US', competitors: [] }, measures: { territory: null } }, o || {});
ok(!F.frameHas(null) && !F.frameHas({}) && !F.frameHas({ tracked_brands: [], markets: [] }) && F.frameHas({ keywords: ['retro'] }) && F.frameHas({ tracked_brands: ['Nike'] }),
  'A1 a reader has a frame when any of its lists holds something');
const prof = { tracked_brands: ['Nike', 'Hoka'], follows: [{ kind: 'category', value: 'smart glasses' }], industries: ['luxury'], audiences: [], keywords: ['thrift'], markets: ['UK'] };
REC = { tiles: [T('r1', { frame: { entity: 'Nike', competitors: [] } }), T('r2', { frame: { entity: 'Adidas', competitors: ['Hoka', 'Puma'] } }), T('r3', { measures: { territory: 'luxury' } }), T('r4', { claim: 'Holiday thrift leads' }), T('r5'), T('r6', { frame: { category: 'smart glasses', competitors: [] } })] };
DOOR = { tiles: [T('d1', { frame: { entity: 'hoka', competitors: [] } }), T('r5'), T('d2')] };
const mm = F.frameMatches(prof, [REC, DOOR]);
ok(mm.r1 === 'brand' && mm.r2 === 'competitor' && mm.r3 === 'industry' && mm.r4 === 'keyword' && mm.r6 === 'category' && mm.d1 === 'brand' && !('r5' in mm) && !('d2' in mm) && Object.keys(F.frameMatches({}, [REC])).length === 0,
  'A2 the readings on the frame and why, by the push\'s own matching: a brand they watch, a competitor, a category they follow, their industry, their words; none for a reader without a frame');
PROF = prof;
const y1 = await F.yoursRoute({}, 'o', { id: 'u1' });
ok(y1.status === 200 && y1.body.ok && y1.body.has_frame === true && y1.body.matches.r2 === 'competitor' && y1.body.frame.tracked_brands.join() === 'Nike,Hoka' && y1.body.frame.markets.join() === 'UK' && !('keywords' in y1.body.frame) && !('follows' in y1.body.frame)
  && asked[0] === 'client_profile?user_id=eq.u1&select=tracked_brands,follows,industries,audiences,keywords,markets',
  'A3 GET /excavate/yours: the reader\'s matches, and only the brands and markets a live read starts from; the profile is read, never made');
PROF = null; const y0 = await F.yoursRoute({}, 'o', { id: 'u2' });
ok(y0.body.ok && y0.body.has_frame === false && Object.keys(y0.body.matches).length === 0 && y0.body.frame.tracked_brands.length === 0, 'A4 a reader without a frame is told so; nothing else is read');
const base = { entity: 'Nike', category: 'athletic footwear', audience: 'runners', market: 'US', competitors: ['Adidas', 'Hoka'], question: 'Where does Nike win runners?', anchors: ['nike', 'running shoes'], task: 'brand', threads: ['Nike in trail', 'Nike on the road'] };
const sigB = F.frameFitSig(base), alt = o => F.frameFitSig(Object.assign({}, base, o));
ok(sigB === alt({ entity: ' NIKE ', competitors: ['hoka', 'adidas'], threads: ['nike on the road', 'Nike in trail'], anchors: ['x'] }) && sigB !== alt({ market: 'UK' }) && sigB !== alt({ competitors: ['Adidas', 'Hoka', 'On'] })
  && sigB !== alt({ threads: ['Nike in trail'] }) && sigB !== alt({ question: 'Another question' }) && F.frameFitSig(null) === '',
  'A5 a frame\'s line for the cache is what the writer is given: the market, the set, the threads and the question count; case, spacing and the order of a list do not');
const store = {}, env = { RATE_LIMIT: { get: async k => (k in store ? store[k] : null) } };
store['xfr:' + REV + ':' + (await sha('nike running'))] = JSON.stringify(base);
const fSame = await F.frameFit(env, ' Nike  Running ', Object.assign({}, base, { competitors: ['Hoka', 'Adidas'] })), fNone = await F.frameFit(env, 'nike running', null);
const fUK = await F.frameFit(env, 'nike running', Object.assign({}, base, { market: 'UK' })), fThread = await F.frameFit(env, 'nike running', Object.assign({}, base, { threads: [] }));
const fBare = await F.frameFit(env, 'nike running', { entity: 'Nike', market: 'UK' }), fNoBase = await F.frameFit(env, 'an unframed query', base), fNothing = await F.frameFit(env, 'an unframed query', null);
ok(fSame.key === '' && fNone.key === '' && fSame.sig === fNone.sig && /^[0-9a-f]{24}$/.test(fSame.sig) && /^f:[0-9a-f]{16}$/.test(fUK.key) && fUK.sig !== fSame.sig && /^f:[0-9a-f]{16}$/.test(fThread.key)
  && fBare.key === '' && fBare.sig === fSame.sig && /^f:[0-9a-f]{16}$/.test(fNoBase.key) && fNothing.key === '' && fNothing.sig === '',
  'A6 the plain read keeps the key it always had; a frame changed in its market, its set or its threads is kept under its own; a frame sent without its anchors is the framer\'s, as the read takes it');
const syn = between(w, 'async function synthesize(body, env, origin, hooks) {', '\nasync function ');
const iFit = syn.indexOf("const fit = typeof frameFit === 'function' ? await frameFit(env, query, body.frame) : { key: '', sig: '' };"), iQ0 = syn.indexOf("const qhash0 = await sha256hex(query.toLowerCase().trim() + '|' + String(body.mode || '') + (quick ? '|quick' : '') + '|' + EXC_READ.REV);"), iQ = syn.indexOf("const qhash = fit.key ? await sha256hex(qhash0 + '|' + fit.key) : qhash0;"), iHit = syn.indexOf('const hit = await env.RATE_LIMIT.get(excCacheKey(qhash))');
ok(iFit > 0 && iFit < iQ0 && iQ0 < iQ && iQ < iHit && /\(!j\.partial \|\| body\.cache_only\) && \(!fit\.sig \|\| !j\.frame_sig \|\| j\.frame_sig === fit\.sig\)\)/.test(syn) && /if \(fit && fit\.sig\) data\.frame_sig = fit\.sig;/.test(syn)
  && syn.indexOf('if (fit && fit.sig) data.frame_sig') < syn.indexOf('await env.RATE_LIMIT.put(excCacheKey(qhash)') && syn.indexOf('meterCharge(env, body._m.uid', iHit) > 0,
  'A7 a read keeps the line of the frame it was compiled on, and a cached read compiled on another (an Underneath-it take rewrites the framer\'s frame) is not served; the cache still answers before the meter');
const usr = F.frameMatches({ markets: ['US'], keywords: [] }, [{ tiles: [T('m1', { frame: { market: 'US', competitors: [] } })] }]), uk = F.frameMatches({ markets: ['UK'] }, [{ tiles: [T('m2', { frame: { market: 'UK', competitors: [] } })] }]);
ok(Object.keys(usr).length === 0 && uk.m2 === 'market' && F.FRAME_FIT.PLAIN_MARKET.test('United States') && F.FRAME_FIT.PLAIN_MARKET.test('U.S.') && !F.FRAME_FIT.PLAIN_MARKET.test('UK'),
  'A7a on the page, US marks no reading as the reader\'s (the framer sets it on any reading that names no market); another market does');
const iAuth = w.indexOf('// Everything below requires a signed-in user'), iY = w.indexOf("if (path === '/excavate/yours' && request.method === 'GET') return yoursRoute(env, origin, user);"), iMeter = w.indexOf('const _aiPath = ');
ok(iAuth > 0 && iY > iAuth && iY < iMeter && !/callClaude|callModel|meterCharge|underLimit|method: 'POST'|method: 'PATCH'/.test(fb) && !DASH.test(fb),
  'A8 the frame is read below the sign-in line and ahead of the meter: a visitor gets 401, a reader never spends; no model, no write, no dash');

// ── B: the page's block, with fakes ─────────────────────────────────────────────────────────────────────────────────────────────
const fj = between(page, '/* ═══ SEAM:FRAME_FIT (NT3d THE FRAME): the page fits', '/* ═══ end SEAM:FRAME_FIT ═══ */');
const win = {}, seen = { fetched: [], redraw: 0, inRender: 0 }; let FETCH = null;
const H = new Function('window', 'safe', 'safeAttr', '_galApi', '_authHeader', 'fetch', '_hsRedraw', '_inRender', '_leadBuilt', '_recLens',
  fj + '; return { _YOURS, _yours, _yoursLoad, _yoursForget, _yoursSync, _yoursTag, _yoursFilter, _yoursLens, _inFit, _inFitRow, get leadBuilt() { return _leadBuilt; }, get recLens() { return _recLens; }, setLens(x) { _recLens = x; } };')(
  win, esc, esc, p => 'https://api.example' + p, async () => ({ Authorization: 'Bearer t' }), async u => { seen.fetched.push(u); const b = FETCH ? FETCH(u) : null; return { ok: !!b, json: async () => b }; },
  () => { seen.redraw++; }, () => { seen.inRender++; }, 'stamp', { kind: 'all', value: null });
win._signedOut = true;
ok((await H._yoursLoad()) === null && !seen.fetched.length && H._yoursLens(() => 'B') === '', 'B1 a visitor asks for no frame and sees no lens');
win._signedOut = false; FETCH = u => (/\/excavate\/yours$/.test(u) ? { ok: true, has_frame: true, matches: { r2: 'competitor', r4: 'keyword' }, frame: { tracked_brands: ['Nike', 'Hoka', 'On'], markets: ['UK'] } } : null);
await H._yoursLoad();
ok(seen.fetched.filter(u => /\/excavate\/yours$/.test(u)).length === 1 && H._yours.has && H._yours.matches.r2 === 'competitor' && seen.redraw === 1 && H.leadBuilt === null, 'B2 signed in, the frame is read once and the page drawn again, the morning with it');
await H._yoursLoad();
ok(seen.fetched.length === 1, 'B3 kept ten minutes; no second read');
const tag = H._yoursTag({ id: 'r2' });
ok(tag === '<span class="hs-yours">Your frame · a competitor you watch</span>' && H._yoursTag({ id: 'r9' }) === '' && H._yoursTag(null) === '' && H._yoursFilter([{ id: 'r2' }, { id: 'r3' }, { id: 'r4' }, null]).map(t => t.id).join() === 'r2,r4',
  'B4 a reading on the frame says so and why; the lens keeps only those');
const btn = (kind, value, label, n) => `B:${kind}:${value}:${label}:${n}`;
ok(H._yoursLens(btn) === 'B:yours:null:Your frame:null', 'B5 a reader with a frame gets the Your frame lens, with no count');
// the live read: offered, one tap each, only in the reader's space
const f1 = { entity: 'Nike', market: 'US', competitors: ['Adidas'] }, fr = { tracked_brands: ['Nike', 'Hoka', 'On'], markets: ['UK'] };
const x1 = H._inFit(f1, fr), x2 = H._inFit({ entity: null, category: 'running', market: 'US', competitors: ['hoka', 'Brooks'] }, fr), x3 = H._inFit({ entity: 'Costco', market: 'UK', competitors: ['Sam\'s Club'] }, fr);
const x4 = H._inFit({ entity: 'Nike', market: 'US', competitors: ['A', 'B', 'C', 'D'] }, fr), x5 = H._inFit(f1, { tracked_brands: [], markets: [] });
ok(x1.against.join() === 'Hoka,On' && x1.market === 'UK' && x2.against.join() === 'Nike,On' && x3.against.length === 0 && x3.market === null && x4.against.join() === 'Hoka' && x5.against.length === 0 && x5.market === null && H._inFit(null, fr).against.length === 0,
  'B6 a read in the reader\'s space offers the other brands they watch, up to five against; their market when the read is set elsewhere; nothing outside their space');
const row = H._inFitRow({ entity: 'Nike', market: 'US', competitors: [] });
ok(/class="in-vs in-fit"><span class="intent-lead">From your frame<\/span>/.test(row) && /data-v="Hoka" onclick="_inListAdd\('competitors',this\.dataset\.v\)">\+ Hoka<\/button>/.test(row) && /data-v="UK" onclick="_inEdit\('market',this\.dataset\.v\)">Read it in UK<\/button>/.test(row)
  && H._inFitRow({ entity: 'Costco', market: 'UK', competitors: [] }) === '',
  'B7 the offers sit with the chips, each a tap that changes the frame the read runs on, and nothing is applied unasked');
H._yours.frame = { tracked_brands: ['Nike', 'O"Brien <x>'], markets: [] };
ok(/data-v="O&quot;Brien &lt;x&gt;"/.test(H._inFitRow({ entity: 'Nike', market: 'US', competitors: [] })) && !/<x>/.test(H._inFitRow({ entity: 'Nike', market: 'US', competitors: [] })), 'B8 a brand\'s name is escaped where it is shown and where it is kept');
H.setLens({ kind: 'yours', value: null }); win._signedOut = true; H._yoursSync();
ok(H._yours.at === 0 && !H._yours.has && Object.keys(H._yours.matches).length === 0 && H._yours.frame === null && H.recLens.kind === 'all' && H._yoursLens(btn) === '', 'B9 signing out forgets the frame and puts the record back to everything');
win._signedOut = false; FETCH = () => ({ ok: true, has_frame: false, matches: {}, frame: { tracked_brands: [], markets: [] } }); await H._yoursLoad(true);
ok(/onclick="_profileOpen\(\)">Set your frame<\/button>/.test(H._yoursLens(btn)), 'B10 a reader without a frame is asked to set it');
ok(!DASH.test(fj) && !/method:\s*'POST'|callClaude|\bapi\(/.test(fj), 'B11 GET only, no model, no dash');

// ── C: the wiring ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/if \(L\.kind === 'yours'\) return typeof _yoursFilter === 'function' \? _yoursFilter\(tiles\) : tiles;/.test(between(page, 'function _recFilter(tiles) {', 'function _recDay(d)'))
  && /btn\('all', null, 'Everything', tiles\.length\) \+ \(typeof _yoursLens === 'function' \? _yoursLens\(btn\) : ''\)/.test(page),
  'C1 the record\'s lens row offers the frame and the record keeps to it');
ok(/<div class="hs-card-text"><div class="hs-line">\$\{_hsLine\(t\)\}\$\{typeof _yoursTag === 'function' \? _yoursTag\(t\) : ''\}<\/div>/.test(page) && /<div class="hs-row-text"><div class="hs-line">\$\{_hsLine\(t\)\}\$\{typeof _yoursTag === 'function' \? _yoursTag\(t\) : ''\}<\/div>/.test(page),
  'C2 the morning\'s cards and the record\'s rows carry the line');
const inr = between(page, 'function _inRender() {', '/* SEAM:EXC_PROBE (EX42): the reader takes one of the underneath readings.');
ok(inr.indexOf("html += typeof _inFitRow === 'function' ? _inFitRow(f) : '';") > inr.indexOf('<span class="intent-lead">Against</span>') && inr.indexOf("html += typeof _inFitRow === 'function' ? _inFitRow(f) : '';") < inr.indexOf('<span class="intent-lead">Threads</span>'),
  'C3 the offers sit under Against, before the threads');
ok(/if \(d && d\.ok\) \{ window\._profile = d\.profile; if \(typeof _yoursLoad === 'function'\) _yoursLoad\(true\); return d\.profile; \}/.test(page)
  && /_hsMovesSync\(\);[^\n]*\n  if \(typeof _yoursSync === 'function'\) _yoursSync\(\);/.test(between(page, 'function _navAuth() {', '/* SEAM:EXC_NAV: the dropdown.')),
  'C4 a saved frame is read again; the frame follows the sign-in');
const css = between(page, '<style id="frame-fit">', '</style>');
ok(/\.hs-yours\{/.test(css) && /@media \(max-width:640px\)/.test(css) && !/z-index/.test(css) && !DASH.test(css) && page.indexOf('<style id="frame-fit">') > page.indexOf('<style id="house-style">') && page.indexOf('/* ═══ SEAM:FRAME_FIT') > page.indexOf('/* ═══ end SEAM:HOUSE_STYLE ═══ */'),
  'C5 the style and the script follow the house style\'s; a phone layout; no dash');
console.log(`\nproof_frame_fit: ${pass} checks PASS`);
