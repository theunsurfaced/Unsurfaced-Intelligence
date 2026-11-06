/**
 * proof_door_closed.mjs  --  AC1 THE DOOR CLOSED: EXCAVATE is for a signed-in reader again. The hub gates it as it gates PLAY and MINE;
 * an address into it keeps what it named and resumes after the sign-in; the six reads NT3a served signed out sit below the worker's
 * sign-in line, ahead of the meter, and the page asks for them with the reader's session; the permalink and the embed card carry
 * nothing of a reading. The Library's stands and DAILY keep their own doors. No hashed slice moves.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('anchor missing: ' + b); return s.slice(i, j); };

// ── A. The page: the hub gates EXCAVATE; an address into it is kept and resumed ──
const es = between(page, 'function enterSpace(name){', '\n}\n');
ok(/if \(window\._signedOut\) \{ _gateForDoor\(name\); return; \}/.test(es) && !/name !== 'excavate'/.test(es), 'A1 the hub gates every space for a visitor, EXCAVATE too');
const nb = between(page, '/* ═══ SEAM:OPEN_DOOR (NT3a THE OPEN DOOR)', '/* ═══ end SEAM:OPEN_DOOR ═══ */');
const store = new Map(), did = [];
const sessionStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const els = {}, mk = id => ({ id, value: '', textContent: '', classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); } }, style: {}, scrollIntoView() { did.push('scroll:' + id); }, focus() { did.push('focus:' + id); } });
const el = id => els[id] || (els[id] = mk(id));
const document = { body: { style: {} }, getElementById: el, querySelector: () => null, createTreeWalker: () => ({ nextNode: () => null }), addEventListener: () => {} };
const dest = () => { try { return JSON.parse(store.get('uai_door_dest') || 'null'); } catch (e) { return null; } };
const make = (search, hash, signedOut, roomHash) => {
  const win = { _signedOut: signedOut, scrollTo: () => did.push('top') };
  const D = new Function('window', 'document', 'location', 'sessionStorage', 'matchMedia', 'setTimeout', 'requestAnimationFrame', 'MutationObserver', 'NodeFilter', 'enterSpace', '_navRecord', '_gateForDoor', 'goHub',
    'openFeaturedCard', '_recordLoad', '_playRecord', '_recLensSet', 'navTo', '_roomFind', '_openRoom', '_roomHash',
    nb + '; return { _DOOR, _doorAt, _doorDeep, _doorAsk, _doorResume };')(
    win, document, { search, hash }, sessionStorage, () => ({ matches: true }), (f) => f(), f => f(), function () { this.observe = () => {}; }, { SHOW_TEXT: 4 },
    n => did.push('enter:' + n), () => did.push('record'), n => did.push('gate:' + n), () => did.push('hub'), id => did.push('open:' + id), () => Promise.resolve(), id => did.push('play:' + id),
    (k, v) => did.push('lens:' + k + '=' + v), s => did.push('nav:' + s), () => did.push('find'), (id, q, by) => did.push('room:' + id + ':' + (by || '')), () => roomHash || null);
  return { D, win };
};
const reset = () => { did.length = 0; store.clear(); };
reset(); let T = make('?insight=aaaaaaaa-0000-4000-8000-000000000001', '', true);
ok(T.D._doorDeep() === true && did.join() === 'gate:excavate' && dest().kind === 'reading' && dest().id === 'aaaaaaaa-0000-4000-8000-000000000001' && T.D._doorDeep() === false,
  'A2 ?insight= for a visitor: the reading is kept, the gate rises, nothing enters, once');
reset(); T = make('', '#room=bbbbbbbb-0000-4000-8000-000000000002', true, { id: 'bbbbbbbb-0000-4000-8000-000000000002', by: 'track' });
ok(T.D._doorDeep() === true && did.join() === 'gate:excavate' && dest().kind === 'room' && dest().id === 'bbbbbbbb-0000-4000-8000-000000000002' && dest().by === 'track', 'A3 #room= for a visitor: the room is kept with its way in');
reset(); T = make('', '#record', true);
ok(T.D._doorDeep() === true && did.join() === 'gate:excavate' && dest().kind === 'record', 'A4 #record for a visitor: the record is kept');
reset(); T = make('', '#explore', true);
ok(T.D._doorDeep() === true && did.join() === 'gate:excavate' && dest().kind === 'explore', 'A5 #explore for a visitor: the gate, and the arrival after it');
reset(); T = make('?insight=aaaaaaaa-0000-4000-8000-000000000001', '', false);
ok(T.D._doorDeep() === true && did.join() === 'enter:excavate' && T.win._doorDeepId === 'aaaaaaaa-0000-4000-8000-000000000001' && !store.size, 'A6 signed in, an address lands inside as before');
reset(); T = make('', '', false); T.win._signedOut = false;
store.set('uai_door_dest', JSON.stringify({ kind: 'record', at: Date.now() })); T.D._doorResume();
const r1 = did.join(); store.set('uai_door_dest', JSON.stringify({ kind: 'reading', id: 'aaaaaaaa-0000-4000-8000-000000000001', at: Date.now() })); did.length = 0; T.D._doorResume();
const r2 = did.join(); store.set('uai_door_dest', JSON.stringify({ kind: 'explore', at: Date.now() })); did.length = 0; T.D._doorResume();
ok(r1 === 'record' && r2 === 'open:aaaaaaaa-0000-4000-8000-000000000001' && did.join() === '' && !store.size, 'A7 after the sign-in the record, the reading or the arrival asked for opens, and the ask is spent');
ok(/function _roomRoute\(\) \{\n  if \(window\._signedOut === true\) \{ const hv = _roomHash\(\); if \(hv && hv\.id && typeof _doorAsk === 'function'\) _doorAsk\(\{ kind: 'room', id: hv\.id, by: hv\.by \}\); return; \}/.test(page), 'A8 a room\'s hash for a visitor goes to the gate with the room kept; a hash with no room is nothing for a visitor');

// ── B. The worker: the six reads inside, the permalink empty, the spenders as they were ──
const authAt = w.indexOf('// Everything below requires a signed-in user'), meterAt = w.indexOf("const _aiPath = path === '/play/generate'");
const six = ['/excavate/pulse', '/excavate/feed', '/excavate/record', '/excavate/state', '/excavate/day-frames', '/excavate/insight'];
const at = p => w.indexOf("path === '" + p + "' && request.method === 'GET'");
ok(authAt > 0 && meterAt > authAt && six.every(p => at(p) > authAt && at(p) < meterAt && w.indexOf("path === '" + p + "' && request.method === 'GET'", at(p) + 1) < 0),
  'B1 the pulse, the feed, the record, the state, the day\'s frames and one insight are served signed in, once each, ahead of the AI meter');
ok(!/\/excavate\/(?:pulse|feed|record|state|day-frames|insight)' && request\.method === 'GET'/.test(w.slice(0, authAt)), 'B2 none of the six is served above the sign-in line');
const above = w.slice(0, authAt);
ok(/path\.startsWith\('\/api\/weekly\/'\)/.test(above) && /path\.startsWith\('\/api\/report\/'\)/.test(above) && /path === '\/api\/edition\/today'/.test(above) && /path === '\/daily\/lake' && request\.method === 'GET'/.test(above) && /path === '\/excavate\/door\/read' && request\.method === 'GET'/.test(above),
  'B3 the Library\'s stands, DAILY\'s edition and lake, and the deep dive (signed in inside its own route) stay where they were');
const sp = between(w, 'async function insightSharePage(path, env, embed) {', '/* ═══ SEAM:SCORECARD (EX54 THE SCORECARD)');
let asked = 0;
const SP = new Function('doorInsightPublic', 'esc', 'excQuiet', sp + '; return insightSharePage;')(async () => { asked++; return { id: 'x', claim: 'The secret move', dek: 'The dek', deployed: '2026-11-01' }; }, s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), () => () => null);
const share = await (await SP('/i/11111111-1111-4111-8111-111111111111', { APP_URL: 'https://u.example' }, false)).text();
const embed = await (await SP('/i/11111111-1111-4111-8111-111111111111', { APP_URL: 'https://u.example' }, true)).text();
const odd = await (await SP('/i/<b>"x', { APP_URL: 'https://u.example' }, false)).text();
ok(asked === 0 && !/secret|dek|2026-11-01/.test(share + embed) && /EXCAVATE by Unsurfaced/.test(share) && /Sign in to read/.test(share) && /Sign in to read/.test(embed) && /og:image" content="https:\/\/api\.unsurfaced-intelligence\.com\/media\/og\/study-default\.png"/.test(share),
  'B4 the permalink reads nothing and says nothing of the reading: EXCAVATE by Unsurfaced, the house image, Sign in to read; the embed card the same');
ok(/content="0;url=https:\/\/u\.example\/intelligence\/\?insight=11111111-1111-4111-8111-111111111111"/.test(share) && /href="https:\/\/u\.example\/intelligence\/\?insight=11111111-1111-4111-8111-111111111111" target="_top"/.test(embed) && !/<b>/.test(odd) && /insight=%3Cb%3E%22x/.test(odd),
  'B5 both land on the site with the reading named, which gates and resumes it; an odd id is encoded, never written raw');
const fnOf = (name) => { const i = w.indexOf('async function ' + name + '('); if (i < 0) throw new Error('missing ' + name); return w.slice(i, w.indexOf('\n}\n', i)); };
ok(['excavateLake', 'excavateGather', 'excavateSuggest', 'excavateReading', 'excavateInterpret', 'excavateVoice'].every(n => /const gate = await excavateAuth\(request, env, origin\);\n  if \(gate\.err\) return gate\.err;/.test(fnOf(n))),
  'B6 what spends (the lake, the gather, suggestions, a reading, the probe, the voice) is signed in and metered inside its own route, as it was');

// ── C. The page asks with the reader's session, and a visitor's page asks for nothing ──
const calls = { feed: /fetch\(API_BASE\.replace\(\/\\\/\$\/, ''\) \+ '\/excavate\/feed', \{ cache: 'no-store', headers: await _authHeader\(\) \}\)/, record: /'\/excavate\/record', \{ cache: 'no-store', headers: await _authHeader\(\) \}/, state: /'\/excavate\/state', \{ cache: 'no-store', headers: await _authHeader\(\) \}/,
  pulse: /'\/excavate\/pulse',\{cache:'no-store',headers:await _authHeader\(\)\}/, trending: /_authHeader\(\)\.then\(h => fetch\(API_BASE\.replace\(\/\\\/\$\/, ''\) \+ '\/excavate\/feed', \{ cache: 'no-store', headers: h \}\)\)/, day: /_galApi\('\/excavate\/day-frames'\), \{ cache: 'no-store', headers: await _authHeader\(\) \}/ };
ok(Object.values(calls).every(re => re.test(page)), 'C1 the feed (the field and trending), the record, the state, the pulse and the day\'s frames carry the reader\'s session');
ok(!/fetch\(API_BASE\.replace\(\/\\\/\$\/, ''\) \+ '\/excavate\/(?:feed|record|state)'(?:\)|, \{ cache: 'no-store' \}\))/.test(page) && !/'\/excavate\/pulse',\{cache:'no-store'\}\)/.test(page) && !/_galApi\('\/excavate\/day-frames'\), \{ cache: 'no-store' \}\)/.test(page),
  'C2 no call to them without the session remains');
ok(/if \(!_fiInitPending && window\._signedOut !== true && typeof initFeaturedInsights === 'function'\)/.test(page) && /if\(window\._signedOut===true\) return;   \/\/ SEAM:DOOR_CLOSED/.test(between(page, 'async function renderPulse(){', '\n}')) && /DOMContentLoaded',\(\)=>\{ setInterval\(renderPulse,60\*1000\); \}\);/.test(page) && !/DOMContentLoaded',\(\)=>\{ renderPulse\(\);/.test(page),
  'C3 a visitor\'s page loads nothing: the backup load skips it, and the pulse is never read before the session is known (no call at DOMContentLoaded; the sign-in reads it, then its minute)');
ok(/initFeaturedInsights\(\);\n  window\._signedOut = false; _navAuth\(\);\n  if \(typeof renderPulse === 'function'\) renderPulse\(\);/.test(between(page, 'function _enterPlatform() {', '\n}\n')), 'C4 the sign-in loads it all: the arrival, the record, the state, the day\'s frames and the pulse');

// ── D. The seam and the house's hand ──
ok(seams.registry['SEAM:DOOR_CLOSED'] && seams.registry['SEAM:DOOR_CLOSED'].file === 'worker/src/index.js' && seams.registry['SEAM:DOOR_CLOSED@intelligence'] && seams.registry['SEAM:DOOR_CLOSED@intelligence'].file === 'intelligence/index.html', 'D1 the seam is registered for the worker and the page');
const added = (w + page).split('\n').filter(l => /SEAM:DOOR_CLOSED|\(signed in: AC1\)/.test(l));
ok(added.length >= 20 && added.every(l => !/[\u2014\u2013]/.test(l)), 'D2 every line of the cut carries its seam and no dash');
console.log('proof_door_closed: ' + pass + ' checks passed');
