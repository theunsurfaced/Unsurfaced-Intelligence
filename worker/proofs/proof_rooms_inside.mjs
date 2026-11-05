/**
 * proof_rooms_inside.mjs  --  NT3b THE ROOMS INSIDE: SEAM:ROOMS_INSIDE. Signed out, a visitor sees the main page and the Library.
 * Brands, Audiences, the brand and subject rooms and a subject's History are for a signed-in reader: the worker asks for a session
 * before it serves them, the page hides their tabs and lenses from a visitor, and any way into them raises the gate with what was asked
 * for kept. Downloads are signed in. The LIVE PULSES box says what an account opens and never how the engine works.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the worker ───────────────────────────────────────────────────────────────────────────────────────────────────
const authAt = w.indexOf('// Everything below requires a signed-in user'), meterAt = w.indexOf('const _aiPath = ', authAt);
const at = p => w.indexOf("path === '" + p + "' && request.method === 'GET'");
const inside = ['/excavate/tracks', '/excavate/brand', '/excavate/rooms', '/excavate/room', '/excavate/people', '/excavate/audiences', '/excavate/timeline'];
ok(authAt > 0 && meterAt > authAt && inside.every(p => at(p) > authAt && at(p) < meterAt && w.indexOf("path === '" + p + "' && request.method === 'GET'", at(p) + 1) < 0),
  'A1 the brands, the brand and subject rooms, the people, the audiences and History are served only to a signed-in reader, once each, ahead of the AI meter');
const open = ['/excavate/feed', '/excavate/record', '/excavate/state', '/excavate/day-frames', '/excavate/pulse', '/excavate/insight', '/daily/lake'];
ok(open.every(p => at(p) > 0 && at(p) < authAt) && /path\.startsWith\('\/api\/weekly\/'\)/.test(w.slice(0, authAt)) && /path\.startsWith\('\/api\/report\/'\)/.test(w.slice(0, authAt)),
  'A2 the main page and the Library stay open: the feed, the record, the state, the day\'s frames, the pulse, one insight, the lake, the stand and the Report');
ok(w.indexOf("case '/excavate/pdf':") > authAt && /SEAM:ROOMS_INSIDE \(NT3b\)/.test(w.slice(authAt, meterAt)), 'A3 a reading\'s PDF stays signed in; the move is marked where it lands');

// ── B: the page asks those routes with the reader's session ─────────────────────────────────────────────────────────
const calls = [...page.matchAll(/fetch\([^\n]*?\/excavate\/(tracks|brand\?|rooms|room\?|people|timeline\?)[^\n]*?\{ cache: 'no-store'([^}]*)\}/g)];
ok(calls.length === 7 && calls.every(m => /headers: await _authHeader\(\)/.test(m[2])), 'B1 every page call to those routes carries the reader\'s session (7 calls)');

// ── C: the door's ways in, with fakes ──────────────────────────────────────────────────────────────────────────────
const asked = [], did = [];
const mkEl = () => ({ classList: { add() {}, remove() {}, contains: () => false }, style: {} });
const nv = between(page, 'function navTo(section) {', '// ══ REPORT DOWNLOAD ENGINE ══');
const navWin = { _signedOut: true, scrollTo: () => {} };
let ACTIVE = null, HASH = null;
const navDoc = { querySelectorAll: () => [], getElementById: () => null, querySelector: sel => (sel === '.page-section.active' ? ACTIVE : null) };
const NAV = new Function('window', 'document', 'history', 'location', '_brandHash', '_brands', '_navMenuName', 'navMenuClose', 'initFeaturedInsights', 'initBrandsPage', 'initAudiencesPage', 'initLibraryPage', '_doorAsk', '_roomHash',
  nv + '; return navTo;')(navWin, navDoc, { replaceState() {} }, { pathname: '/', search: '' }, () => '', {}, () => {}, () => {}, () => did.push('init:explore'), () => did.push('init:brands'), () => did.push('init:audiences'), () => did.push('init:library'),
  d => asked.push(d), () => HASH);
NAV('brands'); NAV('audiences'); HASH = { id: '7e7e7e7e-7e7e-47e7-87e7-7e7e7e7e7e7e', by: 'track' }; ACTIVE = mkEl(); NAV('brands'); NAV('library');
ok(asked.length === 3 && asked[0].kind === 'section' && asked[0].section === 'brands' && asked[1].section === 'audiences' && asked[2].kind === 'room' && asked[2].by === 'track'
  && did.filter(x => x === 'init:explore').length === 2 && !did.includes('init:brands') && !did.includes('init:audiences') && did.includes('init:library'),
  'C1 a visitor\'s Brands and Audiences raise the gate, a room\'s address kept, on the main page; the Library opens');
navWin._signedOut = false; asked.length = 0; did.length = 0; NAV('brands'); NAV('audiences');
ok(asked.length === 0 && did.includes('init:brands') && did.includes('init:audiences'), 'C2 signed in, Brands and Audiences open as before');
ok(/async function _openRoom\(id, fromAddress, by\) \{\n  id = _uuid\(id\);\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(\{ kind: 'room', id, by \}\);/.test(page)
  && /async function _galRoom\(id\) \{\n  const t = _galTile\(id\), r = _galRoomOf\(t\); if \(!r\) return;\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(r\.by === 'track' \? \{ kind: 'room', id: r\.id, by: 'track' \} : \{ kind: 'find', name: r\.name \}\);/.test(page)
  && /if \(!k \|\| !room \|\| !body\) return;\n  if \(window\._signedOut === true && typeof _doorAsk === 'function'\) return _doorAsk\(\{ kind: 'history', key: k \}\);/.test(between(page, 'async function openTimeline(key, opener, fromHistory) {', 'body.innerHTML')),
  'C3 a room from any list or card, the morning\'s subject links and a subject\'s History raise the gate for a visitor before anything is asked of the worker');
const dl = between(page, 'function _dlFile(content, filename) {', 'function downloadReport(id) {');
let blobs = 0; const dlWin = { _signedOut: true }, dlAsked = [];
const DL = new Function('window', 'document', 'Blob', 'URL', 'setTimeout', '_doorAsk', dl + '; return _dlFile;')(dlWin, { createElement: () => ({ click() {} }), body: { appendChild() {}, removeChild() {} } },
  function () { blobs++; }, { createObjectURL: () => 'blob:x', revokeObjectURL() {} }, () => {}, d => dlAsked.push(d));
DL('<p>x</p>', 'x.html'); dlWin._signedOut = false; DL('<p>x</p>', 'x.html');
ok(dlAsked.length === 1 && dlAsked[0].kind === 'page' && blobs === 1, 'C4 a download raises the gate for a visitor and nothing is made; signed in, it downloads');
ok(/enterSpace\('excavate'\);\n  if \(d\.room && window\._signedOut === true && typeof _roomRoute === 'function'\) setTimeout\(/.test(between(page, 'function _doorDeep() {', 'function _doorAsk(dest) {')),
  'C5 a room\'s address read at the hub takes a visitor to the gate with the room kept');

// ── D: once signed in, on to what was asked for ─────────────────────────────────────────────────────────────────────
const nb = between(page, '/* ═══ SEAM:OPEN_DOOR (NT3a THE OPEN DOOR)', '/* ═══ end SEAM:OPEN_DOOR ═══ */');
const store = new Map(), went = [];
const sessionStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const document = { body: { style: {} }, getElementById: id => (id === 'brand-find' ? { value: '' } : null), querySelector: () => null, createTreeWalker: () => ({ nextNode: () => null }), addEventListener() {} };
const win = { _signedOut: false };
const D = new Function('window', 'document', 'location', 'sessionStorage', 'matchMedia', 'setTimeout', 'requestAnimationFrame', 'MutationObserver', 'NodeFilter', 'enterSpace', '_navRecord', '_gateForDoor', 'goHub',
  'openFeaturedCard', '_recordLoad', '_playRecord', '_recLensSet', 'navTo', '_roomFind', '_openRoom', 'openTimeline', '_roomRoute',
  nb + '; return { _DOOR, _doorResume, _doorLabelText };')(
  win, document, { search: '', hash: '' }, sessionStorage, () => ({ matches: true }), f => f(), f => f(), function () { this.observe = () => {}; }, { SHOW_TEXT: 4 }, () => {}, () => {}, () => {}, () => {},
  () => {}, () => Promise.resolve(), () => {}, () => {}, s => went.push('nav:' + s), () => went.push('find'), (id, a, by) => went.push('room:' + id + ':' + (by || 'id')), k => went.push('history:' + k), () => {});
const put = d => store.set(D._DOOR.DEST, JSON.stringify(Object.assign({ at: Date.now() }, d)));
put({ kind: 'section', section: 'audiences' }); D._doorResume();
put({ kind: 'room', id: '7e7e7e7e-7e7e-47e7-87e7-7e7e7e7e7e7e', by: 'track' }); D._doorResume();
put({ kind: 'room', id: '8f8f8f8f-8f8f-48f8-88f8-8f8f8f8f8f8f' }); D._doorResume();
put({ kind: 'history', key: 'theme:aaaaaaaa-0000-4000-8000-000000000001' }); D._doorResume();
put({ kind: 'find', name: 'Jordan Brand' }); D._doorResume();
put({ kind: 'section', section: 'play' }); D._doorResume();
ok(went.join() === 'nav:audiences,nav:brands,room:7e7e7e7e-7e7e-47e7-87e7-7e7e7e7e7e7e:track,nav:brands,room:8f8f8f8f-8f8f-48f8-88f8-8f8f8f8f8f8f:id,history:theme:aaaaaaaa-0000-4000-8000-000000000001,nav:brands,find',
  'D1 signed in, the reader goes on to the section, the room, the subject\'s History or the subject by name; nothing else is reached this way');
ok(D._doorLabelText(' Opening it writes the reading now. ', true) === 'Sign in to open it.' && D._doorLabelText('Sign in to open it.', false) === 'Opening it writes the reading now.',
  'D2 a visitor reads what an account opens, and the label reads as before once signed in');

// ── E: the nav, the lenses and the box ─────────────────────────────────────────────────────────────────────────────
const css = between(page, '<style id="rooms-inside">', '</style>');
ok(['#nl-brands', '#nl-audiences', '#nav-brands', '#nav-audiences', '.rec-lens.room'].every(s => css.includes('body:not(.uai-in) ' + s)) && !/library/i.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))
  && /document\.body\.classList\.toggle\('uai-in', window\._signedOut === false\);/.test(between(page, 'function _navAuth() {', '/* SEAM:EXC_NAV: the dropdown.')),
  'E1 Brands, Audiences and the room lenses are hidden until the page knows the reader is signed in; the Library stays in the nav');
const ps = between(page, 'function _pulseShow(w, open) {', '/* The house\'s note on a reading');
const el = { style: {}, innerHTML: '', classList: { on: false, toggle(c, v) { this.on = !!v; }, remove() { this.on = false; } } };
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PS = new Function('document', 'safe', '_GAL', '_pulseWho', ps + '; return _pulseShow;')({ getElementById: () => el }, esc, { MAIL: 'mailto:x' }, () => null);
const shown = (kind, openIt) => { PS({ kind, pulses: false }, openIt); return el.innerHTML; };
const outOpen = shown('out', true), outLine = shown('out', false), memOpen = shown('member', true), memLine = shown('member', false), pausedOpen = shown('paused', true);
const how = /open web|what the house keeps|writes the answer|in minutes|every source attached/;
ok(/Ask it\. Get the reading\./.test(outOpen) && /Live pulses come with a subscription, and an account opens the moves, the rooms, the full readings and your downloads\. The readings below are open to everyone\./.test(outOpen) && /LIVE PULSES · SIGN IN TO ACCESS/.test(outOpen)
  && /Sign in<\/button>/.test(outOpen) && /Talk to us/.test(outOpen) && /Live pulses come with a subscription\./.test(outLine) && /What a pulse is/.test(outLine)
  && /Live pulses come with Engine/.test(memOpen) && /See what Engine adds/.test(memOpen) && /Live pulses come with Engine\./.test(memLine) && /paused/.test(pausedOpen)
  && ![outOpen, outLine, memOpen, memLine, pausedOpen].some(h => how.test(h)),
  'E2 the LIVE PULSES box says what an account and a subscription open, and nothing about how the engine works');
const added = [between(page, '<style id="rooms-inside">', '</style>'), ps, nv.slice(0, 900)].join('\n');
ok(!/[—–]/.test(added) && (page.match(/SEAM:ROOMS_INSIDE/g) || []).length >= 10, 'E3 no dash in what changed; every hook is marked');
console.log(`\nproof_rooms_inside: ${pass} checks PASS`);
