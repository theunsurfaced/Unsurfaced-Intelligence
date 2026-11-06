/**
 * proof_open_door.mjs  --  NT3a THE OPEN DOOR: SEAM:OPEN_DOOR. EXCAVATE opens to a visitor; PLAY and MINE keep their gate; an address
 * into EXCAVATE lands a visitor inside it once; what the worker keeps signed in, or what would spend or write, raises the gate with what
 * was asked for kept, and signed in the page takes the reader on to it; a sign-in message for a visitor is the gate, never a toast; the
 * way back returns a visitor to the page they were on; every read a visitor's page asks for is served signed out by the worker.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the door on the hub ──────────────────────────────────────────────────────────────────────────────────────────
const es = between(page, 'function enterSpace(name){', '// ── Hub signature');
const run = (signedOut, name) => {
  const did = [], win = { _signedOut: signedOut };
  const E = new Function('window', 'document', '_gateForDoor', '_uaiHide', 'navTo', '_brandHash', '_doorResume', 'setTimeout', es + '; return enterSpace;')(
    win, { body: { style: {} }, getElementById: () => null }, n => did.push('gate:' + n), () => did.push('hide'), s => did.push('nav:' + s), () => '', () => did.push('resume'), f => f());
  win.scrollTo = () => {}; E(name); return did;
};
const vx = run(true, 'excavate'), vp = run(true, 'play'), vm = run(true, 'mine'), sx = run(false, 'excavate');
ok(vx.join() === 'gate:excavate' && vp.join() === 'gate:play' && vm.join() === 'gate:mine' && sx.join() === 'hide,nav:explore,resume',
  'A1 a visitor choosing EXCAVATE meets the gate as PLAY and MINE do (SEAM:DOOR_CLOSED, AC1); signed in, EXCAVATE goes on to what was asked for');

// ── B: the door's block, with fakes ─────────────────────────────────────────────────────────────────────────────────
const nb = between(page, '/* ═══ SEAM:OPEN_DOOR (NT3a THE OPEN DOOR)', '/* ═══ end SEAM:OPEN_DOOR ═══ */');
const store = new Map(), did = [];
const sessionStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const els = {}, mk = id => ({ id, value: '', textContent: '', classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); } }, style: {}, scrollIntoView() { did.push('scroll:' + id); }, focus() { did.push('focus:' + id); } });
const el = id => els[id] || (els[id] = mk(id));
let FOUND = null;
const listeners = [];
const document = { body: { style: {} }, getElementById: el, querySelector: () => FOUND, createTreeWalker: () => ({ nextNode: () => null }), addEventListener: (t, f, c) => listeners.push([t, f, c]) };
const win = { _signedOut: true, scrollTo: () => did.push('top') };
const loc = { search: '?insight=aaaaaaaa-0000-4000-8000-000000000001', hash: '' };
const D = new Function('window', 'document', 'location', 'sessionStorage', 'matchMedia', 'setTimeout', 'requestAnimationFrame', 'MutationObserver', 'NodeFilter', 'enterSpace', '_navRecord', '_gateForDoor', 'goHub',
  'openFeaturedCard', '_recordLoad', '_playRecord', '_recLensSet', 'navTo', '_roomFind',
  nb + '; return { _DOOR, _doorAt, _doorDeep, _doorAsk, _doorBoxKeep, _doorRead, _doorToast, _doorBack, _doorResume, _doorLabelText, _doorHubShown };')(
  win, document, loc, sessionStorage, () => ({ matches: true }), (f) => f(), f => f(), function () { this.observe = () => {}; }, { SHOW_TEXT: 4 },
  n => did.push('enter:' + n), () => did.push('record'), n => did.push('gate:' + n), () => did.push('hub'), id => did.push('open:' + id), () => Promise.resolve(), id => did.push('play:' + id),
  (k, v) => did.push('lens:' + k + '=' + v), s => did.push('nav:' + s), () => did.push('find'));
ok(D._doorAt.insight === 'aaaaaaaa-0000-4000-8000-000000000001' && D._doorDeep() === true && !did.includes('enter:excavate') && did.includes('gate:excavate') && JSON.parse(store.get(D._DOOR.DEST) || '{}').kind === 'reading' && JSON.parse(store.get(D._DOOR.DEST) || '{}').id === 'aaaaaaaa-0000-4000-8000-000000000001' && D._doorDeep() === false,
  'B1 an address into EXCAVATE (here ?insight=) keeps the reading it named and raises the gate for a visitor, once (SEAM:DOOR_CLOSED, AC1)');
store.delete(D._DOOR.DEST); win._doorDeepId = 'aaaaaaaa-0000-4000-8000-000000000001';   // AC1: the id a signed-in arrival would hold, for B2
did.length = 0; FOUND = { classList: { add: c => did.push('flash:' + c), remove() {} }, scrollIntoView: () => did.push('scroll') };
D._doorRead({ id: 'aaaaaaaa-0000-4000-8000-000000000001' });
ok(did.join() === 'scroll,flash:door-here' && !store.has(D._DOOR.DEST) && win._doorDeepId === null, 'B2 the reading an address named is shown where the page holds it, with no gate');
did.length = 0; FOUND = null; D._doorRead({ id: 'bbbbbbbb-0000-4000-8000-000000000002' });
const dest = JSON.parse(store.get(D._DOOR.DEST) || '{}');
ok(did.join() === 'gate:excavate' && dest.kind === 'reading' && dest.id === 'bbbbbbbb-0000-4000-8000-000000000002' && dest.at > 0, 'B3 opening a reading as a visitor raises the gate, the reading kept for after');
did.length = 0;
ok(D._doorToast('Sign in to watch a brand') === true && did.join() === 'gate:excavate' && D._doorToast('Link copied') === false, 'B4 a sign-in message for a visitor is the gate, never a toast; any other toast stands');
win._signedOut = false; did.length = 0;
ok(D._doorToast('Sign in to watch a brand') === false && did.length === 0, 'B5 signed in, a toast is a toast');
win._signedOut = true;
const back = el('uai-gate-back'), hub = el('uai-hub'), gate = el('login-gate');
D._doorBack('excavate'); const inLabel = back.textContent; did.length = 0; back.onclick();
ok(inLabel === '← Back to EXCAVATE' && gate.classList.contains('hidden') && !did.includes('hub'), 'B6 risen inside EXCAVATE, the way back returns a visitor to the page they were on');
hub.classList.add('show'); D._doorBack('excavate'); const hubLabel = back.textContent; did.length = 0; back.onclick(); D._doorBack('play'); const playLabel = back.textContent; hub.classList.remove('show');
ok(hubLabel === '← Back to spaces' && did.includes('hub') && playLabel === '← Back to spaces', 'B7 risen on the hub, or for PLAY or MINE, the way back is the hub, as before');
// resume, signed in
const put = d => store.set(D._DOOR.DEST, JSON.stringify(d));
win._signedOut = false;
put({ kind: 'reading', id: 'r1', at: Date.now() }); did.length = 0; D._doorResume();
const r1 = did.slice();
put({ kind: 'ask', q: 'What did Costco do with gas?', at: Date.now() }); did.length = 0; D._doorResume();
const r2 = did.slice(), askVal = el('ask-q').value;
put({ kind: 'follow', lens: 'brand', value: 'Costco', at: Date.now() }); did.length = 0; D._doorResume();
const r3 = did.slice();
put({ kind: 'reading', id: 'r9', at: Date.now() - D._DOOR.TTL - 1000 }); did.length = 0; D._doorResume();
const r4 = did.slice();
ok(r1.includes('open:r1') && askVal === 'What did Costco do with gas?' && r2.includes('focus:ask-q') && r3.includes('lens:brand=Costco') && !r4.some(x => /open/.test(x)) && !store.has(D._DOOR.DEST),
  'B8 signed in, the page takes the reader on to what they asked for (the reading, the question, the lens); a stale ask is dropped');
win._signedOut = true; put({ kind: 'reading', id: 'r2', at: Date.now() }); did.length = 0; D._doorResume();
ok(!did.includes('open:r2') && store.has(D._DOOR.DEST), 'B9 a visitor is never resumed: what was asked for waits for the sign-in');
ok(D._doorLabelText('Open the reading', true) === 'Sign in to open the reading' && D._doorLabelText(' Opening it writes the reading now. ', true) === 'Sign in to open it.'
  && D._doorLabelText('Sign in to open the reading', false) === 'Open the reading' && D._doorLabelText('Open the reading', false) === null && D._doorLabelText('Play it', true) === null,
  'B10 a link into a signed-in section says so for a visitor, and says it plainly again once signed in');
const signIn = { target: { closest: sel => (sel === '#pulse-invite .btn-go-deeper' ? {} : null) } }, elsewhere = { target: { closest: () => null } };
const capture = listeners.some(([t, f, c]) => t === 'click' && f === D._doorBoxKeep && c === true);
store.clear(); did.length = 0; el('search-input').value = '  Costco and the gas card  ';
const kept = D._doorBoxKeep(signIn), keptDid = did.length, bx = JSON.parse(store.get(D._DOOR.DEST) || '{}');
store.clear(); const notThere = D._doorBoxKeep(elsewhere) === false && !store.has(D._DOOR.DEST);
el('search-input').value = ''; const empty = D._doorBoxKeep(signIn) === false && !store.has(D._DOOR.DEST);
win._signedOut = false; el('search-input').value = 'x y z w'; const signedIn = D._doorBoxKeep(signIn) === false && !store.has(D._DOOR.DEST);
el('search-input').value = ''; put({ kind: 'box', q: 'Costco and the gas card', at: Date.now() }); did.length = 0; D._doorResume();
const boxBack = el('search-input').value, boxDid = did.slice(); win._signedOut = true;
ok(capture && kept && bx.kind === 'box' && bx.q === 'Costco and the gas card' && keptDid === 0 && notThere && empty && signedIn
  && boxBack === 'Costco and the gas card' && boxDid.includes('focus:search-input') && !boxDid.some(x => /open|play|nav/.test(x)),
  'B11 the pulse door\'s Sign in keeps the box\'s question (heard first, on the capture); signed in, it is back in the box, to run when the reader asks');

// ── C: the hooks ────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/if \(window\._signedOut\) \{ _gateForDoor\(name\); return; \}/.test(es) && !/name !== 'excavate'/.test(es) && /if \(typeof _doorResume === 'function'\) setTimeout\(_doorResume, 450\);/.test(es), 'C1 the hub\'s door: every space gated for a visitor, EXCAVATE too (SEAM:DOOR_CLOSED, AC1); the resume stands');
ok(/goHub\(\);\n  if \(typeof _doorDeep === 'function'\) _doorDeep\(\);/.test(between(page, 'function _showHubSignedOut() {', 'function _dashShow(on) {')), 'C2 an address into EXCAVATE is read where the hub becomes the ground state');
ok(/if \(typeof _doorBack === 'function'\) _doorBack\(name\);[^\n]*\n\}/.test(between(page, 'function _gateForDoor(name) {', 'function _authShowGate() {')), 'C3 the gate\'s way back is set each time it rises');
ok(/function _roomRoute\(\) \{\n  if \(window\._signedOut === true\) \{ const hv = _roomHash\(\); if \(hv && hv\.id && typeof _doorAsk === 'function'\) _doorAsk\(\{ kind: 'room', id: hv\.id, by: hv\.by \}\); return; \}/.test(page) && /h && h\.id \? \{ kind: 'room', id: h\.id, by: h\.by \}/.test(between(page, 'function _doorDeep() {', 'function _doorAsk(dest) {')),
  'C4 a room\'s address takes a visitor to the gate with the room kept, from the hub and from the hash (SEAM:DOOR_CLOSED, AC1)');
const od = between(page, 'async function _openDoorRead(t) {', '/* SEAM:CLIENT_PROFILE');
ok(/^async function _openDoorRead\(t\) \{\n  if \(window\._signedOut === true && typeof _doorRead === 'function'\) return _doorRead\(t\);/.test(od), 'C5 a reading\'s deep dive: a visitor goes to the door before anything is fetched');
ok(/function _playRecord\(id\) \{\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(\{ kind: 'play', id \}\);/.test(page)
  && /if \(q\.length < 4\) return false;\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(\{ kind: 'ask', q \}\);/.test(page)
  && /async function _followLens\(\) \{\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(\{ kind: 'follow'/.test(page)
  && /if \(!hh\.Authorization\) \{ if \(typeof _doorAsk === 'function'\) \{ _doorAsk\(\{ kind: 'watch', name \}\); return; \}/.test(page),
  'C6 Play it, Ask the record, Follow and Watch raise the gate for a visitor before anything is asked of the worker');
ok(/function _sgInput\(v\) \{\n  toggleClearBtn\(\);\n  if \(window\._signedOut === true\) \{/.test(page) && /if \(window\._signedOut !== false\) \{ setTimeout\(function \(\) \{ reveal\(tries \+ 1\); \}, 2500\); return; \}[^\n]*\n    api\("whoami"/.test(page)
  && /function showToast\(msg\)\{if\(window\._signedOut===true&&typeof _doorToast==='function'&&_doorToast\(msg\)\)return;/.test(page),
  'C7 a visitor\'s box asks no suggestions; the Feed reveal asks the base only signed in; a sign-in toast for a visitor is the gate');
ok(/if \(typeof _pulseGate === 'function' && _pulseGate\(\)\) return;/.test(page), 'C8 the box keeps NT3\'s door: a visitor\'s question runs nothing');
ok(/out: \{ k: 'LIVE PULSES · SIGN IN TO ACCESS', line: [^\n]*go: `<button type="button" class="btn-go-deeper" onclick="_gateForDoor\('excavate'\)">Sign in<\/button>` \},/.test(page) && /document\.addEventListener\('click', _doorBoxKeep, true\)/.test(nb),
  'C9 NT3\'s pulse door is left as NT3 made it; its Sign in keeps the box\'s question through the door\'s own listener');
ok(/#kbOpen\[hidden\]\{display:none!important\}/.test(between(page, '<style id="open-door">', '</style>')) && /style="[^"]*display:inline-block" id="kbOpen"[^>]* hidden>/.test(page),
  'C10 the hub\'s Feed link stays hidden until the base says admin (its inline display no longer overrides hidden)');

// ── D: the worker serves a visitor's reads signed out ──────────────────────────────────────────────────────────────
const authAt = w.indexOf('// Everything below requires a signed-in user');
const body = name => { const i = w.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); if (i < 0) return null; const rest = w.slice(i + 1), j = rest.search(/\n(?:async )?function /); return rest.slice(0, j < 0 ? undefined : j); };
const reads = { '/excavate/feed': 'excavateFeed', '/excavate/record': 'doorRecordRoute', '/excavate/state': 'excavateStateRoute', '/excavate/day-frames': 'arrivalDayRoute', '/excavate/pulse': 'excavatePulse',
  '/excavate/insight': 'doorInsightRoute' };   // NT3b: the rooms, the brands, History, the people and the audiences moved inside (proof_rooms_inside A1)
const meterAt0 = w.indexOf("const _aiPath = path === '/play/generate'");
const inside = Object.entries(reads).filter(([p, fn]) => { const at = w.indexOf("path === '" + p + "' && request.method === 'GET'"); return at > authAt && at < meterAt0 && w.indexOf("path === '" + p + "' && request.method === 'GET'", at + 1) < 0; });
ok(inside.length === Object.keys(reads).length && /path\.startsWith\('\/api\/weekly\/'\)/.test(w.slice(0, authAt)) && /path\.startsWith\('\/api\/report\/'\)/.test(w.slice(0, authAt)),
  'D1 every read the page asks for (the feed, the record, the state, the day\'s frames, the pulse, one insight) is served signed in, once each, ahead of the meter (SEAM:DOOR_CLOSED, AC1); the Library\'s stands keep their own sign-in');
const gated = { '/excavate/door/read': 'doorReadRoute', '/excavate/suggest': 'excavateSuggest', '/excavate/track': 'excavateTrackAdd' };
ok(Object.values(gated).every(fn => /authenticate\(|excavateAuth\(/.test(body(fn) || '')) && w.indexOf("case '/ask':") > authAt && w.indexOf("case '/play/handoff':") > authAt,
  'D2 what the door holds back is signed in on the worker: a reading\'s deep dive, suggestions, a watch, Ask the record, PLAY');
ok(!/fetch\(|\bapi\(/.test(nb) && !/[\u2014\u2013]/.test(nb), 'D3 the door\'s block asks the worker nothing of its own, and carries no dash');
console.log(`\nproof_open_door: ${pass} checks PASS`);
