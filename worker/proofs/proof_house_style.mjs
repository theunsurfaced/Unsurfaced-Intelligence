/**
 * proof_house_style.mjs  --  NT3c THE HOUSE STYLE: SEAM:HOUSE_STYLE. The moves are for members: the record, its cross-currents, the
 * feed's door set, one insight, a permalink page and an embed card answer a visitor without the move; GET /excavate/moves gives a
 * signed-in page the moves, below the sign-in line and ahead of the meter. A seat's spaces carry their latest readings. The arrival is
 * drawn in the work's own type: the ask and the box in one row, a seat's spaces first, the lead and the week's read as one spread, the
 * morning as cards that open their move in a pop-out (the X, Close and Escape close it), a visitor's band on what an account opens, the
 * record lighter with no score, the territories and the voices under it. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DASH = /[—–]/;

// ── A: the worker ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const wb = between(w, '/* ═══ SEAM:HOUSE_STYLE (NT3c THE HOUSE STYLE): the moves are for members.', '/* ═══ end SEAM:HOUSE_STYLE ═══ */');
let REC = null, DOOR = null;
const W = new Function('doorRecord', 'doorSet', 'json', 'excQuiet', wb + '; return { withoutMoves, movesOf, movesRoute };')(
  async () => REC, async () => DOOR, (o, status) => ({ status, body: o }), () => () => null);
const tile = (id, move, extra) => Object.assign({ id, key: 'theme:' + id, claim: 'Claim ' + id, dek: 'Copy ' + id, move, watch: { claim: 'A bet', by: '2026-12-01' }, measures: { recent_7d: 4 } }, extra || {});
REC = { built_at: 'b1', tiles: [tile('r1', 'Ship the small pack first'), tile('r2', null), tile('r3', 'Price the bundle under the single')], positions: [], counts: { open: 2 },
  currents: { at: '2026-11-01', currents: [{ title: 'Comfort is the new status', body: 'Across three readings.', move: 'Lead with the fit', subjects: ['A', 'B'] }] } };
DOOR = { night: '2026-11-01', tiles: [tile('d1', 'Book the second drop now'), tile('r1', 'Ship the small pack first')] };
const stripped = W.withoutMoves(REC);
ok(!/"move"/.test(JSON.stringify(stripped)) && stripped.tiles.length === 3 && stripped.tiles[0].claim === 'Claim r1' && stripped.tiles[0].dek === 'Copy r1' && stripped.tiles[0].watch.claim === 'A bet'
  && stripped.currents.currents[0].title === 'Comfort is the new status' && stripped.currents.at === '2026-11-01' && REC.tiles[0].move === 'Ship the small pack first' && REC.currents.currents[0].move === 'Lead with the fit'
  && W.withoutMoves(null) === null && W.withoutMoves({ night: 'n' }).night === 'n',
  'A1 withoutMoves: no move anywhere in a record or a door set, every other field kept, the cached set itself untouched');
const mv = W.movesOf(REC, DOOR);
ok(mv.moves.r1 === 'Ship the small pack first' && mv.moves.r3 === 'Price the bundle under the single' && mv.moves.d1 === 'Book the second drop now' && !('r2' in mv.moves) && mv.currents['Comfort is the new status'] === 'Lead with the fit' && W.movesOf(null, null).moves && Object.keys(W.movesOf(null, null).moves).length === 0,
  'A2 movesOf: the record\'s and the door set\'s moves by reading id, the currents\' by title; a reading with no move has none');
const mr = await W.movesRoute({}, 'o');
ok(mr.status === 200 && mr.body.ok && mr.body.moves.d1 === 'Book the second drop now' && mr.body.currents['Comfort is the new status'] === 'Lead with the fit', 'A3 GET /excavate/moves answers from the same cached sets the public routes read');
const iAuth = w.indexOf('// Everything below requires a signed-in user'), iMoves = w.indexOf("if (path === '/excavate/moves' && request.method === 'GET') return movesRoute(env, origin);"), iMeter = w.indexOf('const _aiPath = ');
ok(iAuth > 0 && iMoves > iAuth && iMoves < iMeter && !/callClaude|callModel|claudeBatchSubmit|env\.AI\.run|meterCharge|underLimit/.test(wb) && !DASH.test(wb),
  'A4 the moves are read below the sign-in line and ahead of the meter: a visitor gets 401, a member never spends; no model, no dash');
const rr = between(w, 'async function doorRecordRoute(request, env, origin) {', '/* SEAM:RECORD_ROUTE: one insight');
const RR = new Function('doorRecord', 'json', 'withoutMoves', rr + '; return doorRecordRoute;')(async () => REC, (o, s) => ({ status: s, body: o }), W.withoutMoves);
const pubRec = await RR({}, {}, 'o');
ok(pubRec.status === 200 && pubRec.body.ok && pubRec.body.tiles.length === 3 && !/"move"/.test(JSON.stringify(pubRec.body)) && /Lead with the fit/.test(JSON.stringify(REC)),
  'A5 the public record carries no move, in its readings or its cross-currents');
ok(/door: door && door\.tiles && door\.tiles\.length \? withoutMoves\(door\) : null/.test(between(w, 'async function excavateFeed(env, origin) {', '/* ═══ SEAM:TRACKS'))
  && /const pub = Object\.assign\(\{\}, t\); delete pub\.move;/.test(between(w, 'async function doorInsightRoute(request, env, origin) {', '/* SEAM:RECORD_ROUTE: the permalink.')),
  'A6 the feed\'s door set and one insight answer without the move');
const sp = between(w, 'async function insightSharePage(path, env, embed) {', '/* ═══ SEAM:SCORECARD (EX54 THE SCORECARD)');
const SP = new Function('doorInsightPublic', 'esc', 'excQuiet', sp + '; return insightSharePage;')(async () => tile('11111111-1111-4111-8111-111111111111', 'The secret move', { deployed: '2026-11-01', photo: null, frame: { entity: 'Acme' } }), s => esc(s), () => () => null);
const share = await (await SP('/i/11111111-1111-4111-8111-111111111111', { APP_URL: 'https://u.example' }, false)).text();
const embed = await (await SP('/i/11111111-1111-4111-8111-111111111111', { APP_URL: 'https://u.example' }, true)).text();
ok(!/The secret move|The move:/.test(share) && !/The secret move|The move:/.test(embed) && /Copy 11111111/.test(share) && /Copy 11111111/.test(embed) && /Deployed 2026-11-01/.test(share) && !/t\.move/.test(sp),
  'A7 a shared link\'s preview and its embed card carry the claim, the copy and the date, never the move');
const sl = between(w, "/* SEAM:HOUSE_STYLE (NT3c): a seat's spaces, each with its latest reading:", 'async function spaceRoute(request, env, origin, user) {');
const asked = [];
const SL = new Function('sbRest', 'excQuiet', 'doorTile', 'spacePublicRow', 'SPACES', sl + '; return { spaceLatest, spaceWithLatest };')(
  async (env, p) => { asked.push(p); if (p.startsWith('door_reads?')) return [{ id: 'aaaaaaaa-0000-4000-8000-000000000001', read: { r: 1 } }]; if (p.startsWith('space_reads?')) return [{ id: 'bbbbbbbb-0000-4000-8000-000000000002', read: { r: 2 } }, { id: 'aaaaaaaa-0000-4000-8000-000000000001', read: { r: 3 } }]; return []; },
  () => () => null, r => ({ id: r.id, claim: 'c' + r.read.r, move: 'm' + r.read.r, voices: [{ text: 'v' }] }), s => (s ? { id: s.id, name: s.name, last_read_id: s.last_read_id || null } : null), { IDS: 100 });
const lat = await SL.spaceLatest({}, [{ id: 's1', last_read_id: 'aaaaaaaa-0000-4000-8000-000000000001' }, { id: 's2', last_read_id: 'bbbbbbbb-0000-4000-8000-000000000002' }, { id: 's3', last_read_id: 'not-an-id' }, { id: 's4' }]);
const s1 = SL.spaceWithLatest({ id: 's1', name: 'Acme', last_read_id: 'aaaaaaaa-0000-4000-8000-000000000001' }, lat), s2 = SL.spaceWithLatest({ id: 's2', name: 'Nike', last_read_id: 'bbbbbbbb-0000-4000-8000-000000000002' }, lat), s4 = SL.spaceWithLatest({ id: 's4', name: 'Quiet' }, lat);
ok(asked.length === 2 && asked.every(p => p.includes('in.(aaaaaaaa-0000-4000-8000-000000000001,bbbbbbbb-0000-4000-8000-000000000002)')) && s1.latest.claim === 'c1' && s1.latest.private === false && s2.latest.claim === 'c2' && s2.latest.private === true && s2.latest.move === 'm2' && !('voices' in s1.latest) && s4.latest === null
  && (await SL.spaceLatest({}, [{ id: 'x' }])).size === 0,
  'A8 a seat\'s spaces carry their latest readings: the record\'s first, else the holder\'s own (marked private), one read each; no voices\' pool; a space not yet read has none');
ok(w.indexOf("/* SEAM:HOUSE_STYLE (NT3c): a seat's spaces, each with its latest reading:") > w.indexOf('/* ═══ SEAM:SPACES (NT1 THE SPACES)') && w.indexOf("/* SEAM:HOUSE_STYLE (NT3c): a seat's spaces, each with its latest reading:") < w.indexOf('/* ═══ SEAM:ENTITY_ROOM (RM1): the rooms on the graph.')
  && /const latest = await spaceLatest\(env, held\.concat\(granted\)\);/.test(between(w, 'async function spaceRoute(request, env, origin, user) {', 'async function spaceGrantRoute(')) && !DASH.test(sl),
  'A9 the spaces\' latest readings are read in the spaces\' own code, for the signed-in list only');

// ── B: the page's block, with fakes ─────────────────────────────────────────────────────────────────────────────────────────────
const hs = between(page, '/* ═══ SEAM:HOUSE_STYLE (NT3c THE HOUSE STYLE): the arrival in the work', '/* ═══ end SEAM:HOUSE_STYLE ═══ */');
const mkNode = tag => ({ tagName: tag, id: '', className: '', innerHTML: '', style: {}, attrs: {},
  classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); }, toggle(c, on) { if (on === undefined ? !this.s.has(c) : on) this.s.add(c); else this.s.delete(c); } },
  setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
  remove() { delete doc.byId[this.id]; doc.removed.push(this.id); }, focus() { doc.focused = this.id || this.tagName; },
  querySelector(sel) { return sel === '.hs-pop-x' && /class="hs-pop-x"/.test(this.innerHTML) ? { focus() { doc.focused = 'x'; } } : null; } });
const doc = { byId: {}, removed: [], focused: null, listeners: {}, activeElement: null,
  createElement: mkNode, getElementById(id) { return this.byId[id] || null; },
  body: { classList: mkNode('body').classList, appendChild(n) { doc.byId[n.id] = n; }, contains() { return true; } },
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }, removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); } };
const win = {}, gal = { pick: null, set: null, mineLatest: [] }, seen = { door: [], opened: [], played: [], rooms: [], toasts: [], redraw: 0, fetched: [] };
let FETCH = null;
const FI_RECORD = { tiles: [tile('r1', null, { deployed: '2026-11-01', photo: { src: 'https://p.example/1.jpg', credit: 'WWD' }, frame: { entity: 'Acme' } }), tile('r2', null, { deployed: '2026-10-31', called: { verdict: 'held' }, frame: { entity: 'Nike' } }), tile('r3', null, { deployed: '2026-10-30', private: true, frame: {} })],
  currents: { currents: [{ title: 'Comfort is the new status', body: 'Across three readings.' }] } };
const FI_LAKE = { door: { tiles: [tile('d1', null)] } };
gal.set = { tiles: [tile('d1', null), tile('r1', null)] };
const H = new Function('document', 'window', '_gal', '_FI_RECORD', '_FI_LAKE', 'safe', 'safeAttr', '_recDay', '_leadBet', '_leadDays', '_galRoomOf', '_galRoom', '_galNoteHtml', 'openFeaturedCard', '_playRecord', '_doorAsk', '_authHeader', '_galApi', 'fetch', 'showToast', 'API_BASE', 'navigator', '_renderScroll', 'setTimeout',
  hs + '; return { _HS, _hsMoves, _hsMoveOf, _hsTile, _hsMineIds, _hsLine, _hsPhoto, _hsMoveBlock, _hsCard, _hsGrade, _hsRow, _hsTry, _hsMovesLoad, _hsMovesMerge, _hsMovesApply, _hsWeekPhoto, _hsMovesForget, _hsMovesSync, _hsMoveOpen, _hsMoveDraw, _hsMoveClose, _hsMoveKey, _hsRoles, _hsMoveResume };')(
  doc, win, gal, FI_RECORD, FI_LAKE, esc, esc, d => (d ? String(d).slice(5, 10) : ''), t => (t.watch ? `<div class="rec-watch open"><i>The bet</i> ${esc(t.watch.claim)}</div>` : ''), by => (by === '2026-12-01' ? 29 : null),
  t => (t.frame && t.frame.entity ? { by: 'name', name: t.frame.entity } : null), id => seen.rooms.push(id), n => (n && n.text ? `<p class="gal-note">${esc(n.text)}</p>` : ''),
  id => seen.opened.push(id), id => seen.played.push(id), d => { seen.door.push(d); return false; }, async () => ({ Authorization: 'Bearer t' }), p => 'https://api.example' + p,
  async (u, o) => { seen.fetched.push(u); const b = FETCH ? FETCH(u) : null; return { ok: !!b, json: async () => b }; }, m => seen.toasts.push(m), 'https://api.example', { clipboard: { writeText: async () => {} } },
  () => { seen.redraw++; }, f => f());
win._scrollDrawn = true;
// the card, the row, the lead's block: never the move text; a visitor sees there is one
const withMove = tile('m1', 'The quiet move', { deployed: '2026-11-01', photo: { src: 'https://p.example/m.jpg', credit: 'BoF' }, frame: { entity: 'Acme' }, measures: { territory: 'fashion-beauty' } });
const seenSet = new Set();
const card = H._hsCard(withMove, seenSet), card2 = H._hsCard(Object.assign({}, withMove, { id: 'm2' }), seenSet);
ok(/class="hs-card" data-id="m1"/.test(card) && /Claim m1/.test(card) && /Copy m1/.test(card) && /The bet/.test(card) && /onclick="_hsMoveOpen\('m1'\)">Open the move<\/button>/.test(card) && /class="hs-lockrow"/.test(card) && !/The quiet move/.test(card)
  && /<img src="https:\/\/p\.example\/m\.jpg"/.test(card) && /Photo: BoF/.test(card) && !/<img/.test(card2) && /hs-face/.test(card2) && /Acme/.test(card2) && /Deployed 11-01 · fashion beauty · Acme/.test(card),
  'B1 a morning card: the photograph once and credited (else the subject set large, never a chart), the line, the claim, its copy, the bet, the lock and the move behind its button; the move\'s words never on the card');
const row = H._hsRow(FI_RECORD.tiles[1], new Set());
ok(/class="hs-row" data-id="r2"/.test(row) && /The bet · Held/.test(row) && /openFeaturedCard\('r2'\);return false/.test(row) && /Open the move/.test(row) && /The bet · Checked in 29 days/.test(H._hsRow(FI_RECORD.tiles[0], new Set())) && H._hsGrade({}) === '' && /Missed/.test(H._hsGrade({ watch: { by: 'x' }, called: { verdict: 'missed' } })),
  'B2 the record\'s row: the claim opens the reading; the bet\'s state in a word (when it is checked, or held, or missed); the move behind its link');
win._signedOut = true; const blockVM = H._hsMoveBlock(withMove);
win._signedOut = false; const blockV = H._hsMoveBlock(Object.assign({}, withMove, { move: null })), blockM = H._hsMoveBlock(withMove);
ok(!/The quiet move/.test(blockVM) && /hs-lockwrap/.test(blockVM) && /hs-lockwrap/.test(blockV) && /Members get the move on every reading\./.test(blockV) && /hs-signin/.test(blockV) && !/Play it/.test(blockV) && /The quiet move/.test(blockM) && /Play it/.test(blockM) && /hs-member/.test(blockM) && /_galRoom\('m1'\)/.test(blockM),
  'B3 the lead\'s move: a member reads it with Play it and the room; a visitor sees the lock, a line and the door, even when the page holds a move from an older copy');
// the moves: a member's page takes them, a visitor's holds none
win._signedOut = true;
ok((await H._hsMovesLoad()) === null && !seen.fetched.length, 'B4 a visitor asks for no moves');
win._signedOut = false; FETCH = u => (/\/excavate\/moves$/.test(u) ? { ok: true, moves: { r1: 'Move one', d1: 'Door move' }, currents: { 'Comfort is the new status': 'Lead with the fit' } } : null);
await H._hsMovesLoad();
ok(seen.fetched.some(u => /\/excavate\/moves$/.test(u)) && FI_RECORD.tiles[0].move === 'Move one' && gal.set.tiles[0].move === 'Door move' && gal.set.tiles[1].move === 'Move one' && FI_LAKE.door.tiles[0].move === 'Door move' && FI_RECORD.currents.currents[0].move === 'Lead with the fit' && seen.redraw === 1 && win._hsMovesAt,
  'B5 signed in, the moves are fetched once and merged into the record, the door set and the currents; the arrival is drawn again');
const n0 = seen.fetched.length; await H._hsMovesLoad();
ok(seen.fetched.length === n0, 'B6 the moves are kept ten minutes; no second fetch');
const late = tile('r1', null), lateCur = { title: 'Comfort is the new status', body: 'b' }, keepRec = FI_RECORD.tiles, keepCur = FI_RECORD.currents;
FI_RECORD.tiles = [late]; FI_RECORD.currents = { currents: [lateCur] };
ok(H._hsMovesMerge() === true && late.move === 'Move one' && lateCur.move === 'Lead with the fit' && H._hsMovesMerge() === false
  && /  if \(typeof _hsMovesMerge === 'function'\) _hsMovesMerge\(\);[^\n]*\n  window\._scrollDrawn = true; _leadRender\(rec\);/.test(between(page, 'function _renderScroll(rec, data) {', 'function _renderLakeGrid(data) {')),
  'B6a a record or door set that arrives after the moves takes them when it is drawn');
FI_RECORD.tiles = keepRec; FI_RECORD.currents = keepCur;
// the pop-out
win._signedOut = true; H._hsMoveOpen('r1');
ok(seen.door.length === 1 && seen.door[0].kind === 'move' && seen.door[0].id === 'r1' && !doc.byId['hs-pop'], 'B7 a visitor\'s Open the move raises the door with the reading kept; nothing opens');
win._signedOut = false; doc.activeElement = { id: 'from', focus() { doc.focused = 'from'; } };
FETCH = u => (/insight\/roles/.test(u) ? { ok: true, role: 'Brand strategist', implications: [{ title: 'Price the bundle', body: 'Lead with the price.' }, { title: 'Two', body: 'b' }, { title: 'Three', body: 'c' }] } : null);
H._hsMoveOpen('r1');
const pop = doc.byId['hs-pop'];
ok(pop && /role="dialog" aria-modal="true" aria-labelledby="hs-pop-h"/.test(pop.innerHTML) && /aria-label="Close the move"/.test(pop.innerHTML) && /<h2 id="hs-pop-h">Move one<\/h2>/.test(pop.innerHTML) && /The read: Claim r1/.test(pop.innerHTML)
  && /_playRecord\('r1'\)">Play it/.test(pop.innerHTML) && /openFeaturedCard\('r1'\)">Open the reading/.test(pop.innerHTML) && /_galRoom\('r1'\)">The room/.test(pop.innerHTML) && /Copy link/.test(pop.innerHTML) && /hs-close/.test(pop.innerHTML)
  && doc.body.classList.contains('hs-pop-open') && doc.focused === 'x' && (doc.listeners.keydown || []).length === 1,
  'B8 a member\'s move opens: a dialog with its X, the read, the move, Play it, the reading, the room, its link and Close; the X takes focus; Escape is listened for');
doc.byId['hs-pop-role'] = Object.assign(mkNode('div'), { id: 'hs-pop-role' }); doc.byId['hs-pop-role'].attrs['data-id'] = 'r1';
await H._hsRoles('r1');
ok(/For your role/.test(doc.byId['hs-pop-role'].innerHTML) && /for Brand strategist/.test(doc.byId['hs-pop-role'].innerHTML) && (doc.byId['hs-pop-role'].innerHTML.match(/class="hs-imp"/g) || []).length === 3 && doc.byId['hs-pop-role'].style.display === '',
  'B9 the lines for the reader\'s role, three, written ahead of time');
doc.listeners.keydown[0]({ key: 'Escape', preventDefault() {} });
ok(!doc.byId['hs-pop'] && !doc.body.classList.contains('hs-pop-open') && doc.focused === 'from' && !(doc.listeners.keydown || []).length, 'B10 Escape closes it and gives focus back to what opened it');
H._hsMoveOpen('r3');
ok(/No move was written for this reading\./.test(doc.byId['hs-pop'].innerHTML) && !/Copy link/.test(doc.byId['hs-pop'].innerHTML) && !/Play it/.test(doc.byId['hs-pop'].innerHTML), 'B11 a reading with no move says so plainly; a private reading has no public link');
H._hsMoveClose();
H._hsMoveOpen('nowhere');
ok(seen.opened[seen.opened.length - 1] === 'nowhere', 'B12 a reading the page does not hold opens as a reading');
// after the door: the move opens once the page holds it
seen.door.length = 0; doc.byId = {}; H._hsMoveResume('r1', 0);
ok(doc.byId['hs-pop'] && /Move one/.test(doc.byId['hs-pop'].innerHTML), 'B13 signed in from the door, the move asked for opens');
H._hsMoveClose();
// signing out forgets the moves
win._signedOut = true; H._hsMovesSync();
ok(!('move' in FI_RECORD.tiles[0]) && !('move' in gal.set.tiles[0]) && !('move' in FI_RECORD.currents.currents[0]) && H._hsMoves.at === 0, 'B14 signing out forgets every move the page held');
gal.mineLatest = [tile('k1', null)];
ok(H._hsMineIds().join() === 'k1' && H._hsTile('k1').id === 'k1', 'B15 a seat\'s own latest readings are held for the move and kept from repeating below');
// this week's read stands beside the lead: never the lead's photograph
const wk = { src: 'https://p.example/1.jpg', getAttribute(k) { return k === 'src' ? this.src : null; } }, wfig = { style: { display: 'block' } }, wcap = { textContent: 'Photo: WWD' }, wsec = mkNode('section');
Object.assign(doc.byId, { 'week-img': wk, 'week-photo': wfig, 'week-credit': wcap, 'week-block': wsec });
const leadImg = src => { doc.querySelectorAll = sel => (sel === '#lead-rail .lead-reading img' ? [{ getAttribute: () => src }] : []); };
const keepSet = gal.set;
gal.set = { tiles: [tile('w1', null, { photo: { src: 'https://p.example/1.jpg', credit: 'WWD' }, measures: { recent_7d: 9 } }), tile('w2', null, { photo: { src: 'https://p.example/2.jpg', credit: 'BoF' }, measures: { recent_7d: 3 } }), tile('w3', null, { photo: { src: 'https://p.example/3.jpg', credit: 'Vogue' }, measures: { recent_7d: 7 } })] };
leadImg('https://p.example/1.jpg'); H._hsWeekPhoto();
const swapped = wk.src === 'https://p.example/3.jpg' && wcap.textContent === 'Photo: Vogue' && wfig.style.display === 'block';
wk.src = 'https://p.example/2.jpg'; leadImg('https://p.example/3.jpg'); H._hsWeekPhoto();
const kept = wk.src === 'https://p.example/2.jpg' && wfig.style.display === 'block';
gal.set = { tiles: [tile('w1', null, { photo: { src: 'https://p.example/3.jpg' } })] }; wk.src = 'https://p.example/3.jpg'; H._hsWeekPhoto();
ok(swapped && kept && wfig.style.display === 'none' && wsec.classList.contains('nophoto'),
  'B17 this week\'s read never repeats the lead\'s photograph: it takes the most covered of the set\'s others, or none');
gal.set = keepSet; ['week-img', 'week-photo', 'week-credit', 'week-block'].forEach(k => delete doc.byId[k]); delete doc.querySelectorAll;
ok(!DASH.test(hs) && !/method:\s*'POST'|excavate\/(interpret|gather|synthesize)|\bapi\(/.test(hs), 'B16 the block asks GET routes only, no model, no dash');
H._hsMoves.ids = { z1: 'Held move' };
ok(H._hsMoveOf({ id: 'z1' }) === 'Held move' && H._hsMoveOf({ id: 'z1', move: 'Its own' }) === 'Its own' && H._hsMoveOf({ id: 'z2' }) === null && H._hsMoveOf(null) === null,
  'B18 a reading\'s move is the one the page took, whichever copy of the reading it is: a record loaded again does not lose it');
win._signedOut = false; doc.byId = {}; seen.fetched.length = 0;
H._hsMoveDraw({ id: 'z1', claim: 'Claim z1', frame: {} });
const firstFocus = doc.focused, popZ = doc.byId['hs-pop'];
doc.byId['hs-pop-role'] = Object.assign(mkNode('div'), { id: 'hs-pop-role', innerHTML: 'THE ROLE LINES' }); doc.byId['hs-pop-role'].style.display = ''; doc.focused = 'elsewhere';
const nFetch = seen.fetched.length; H._hsMoveDraw({ id: 'z1', claim: 'Claim z1', frame: {} }, true);
ok(popZ.getAttribute('data-id') === 'z1' && /<h2 id="hs-pop-h">Held move<\/h2>/.test(popZ.innerHTML) && doc.byId['hs-pop-role'].innerHTML === 'THE ROLE LINES' && doc.focused === 'elsewhere' && seen.fetched.length === nFetch && firstFocus === 'x'
  && /el\.getAttribute\('data-id'\) === String\(id\)\) _hsMoveDraw\(u, true\);/.test(hs),
  'B19 a move that arrives late goes into its own reading\'s pop-out only, keeping the reader\'s place and the role lines');
H._hsMoveClose(); H._hsMoves.ids = {};
ok(/if \(e\.key !== 'Tab'/.test(hs) && /else if \(e\.shiftKey && at === first\) \{ e\.preventDefault\(\); last\.focus\(\); \}/.test(hs) && /else if \(!e\.shiftKey && at === last\) \{ e\.preventDefault\(\); first\.focus\(\); \}/.test(hs)
  && /\[data-id="' \+ fid \+ '"\] \.hs-movebtn/.test(hs) && /\^\[0-9a-f-\]\{36\}\$\/\.test\(fid\)/.test(hs),
  'B20 Tab stays inside the open move; when the button that opened it was drawn again, its reading\'s own button takes focus back');

// ── C: the page's markup, style and wiring ──────────────────────────────────────────────────────────────────────────────────────
const iH1 = page.indexOf('<h1 class="hero-title">Ask culture a question.</h1>'), iInv = page.indexOf('id="pulse-invite"'), iBox = page.indexOf('id="search-input"'), iTry = page.indexOf('id="hs-try"'), iMine = page.indexOf('id="my-spaces"'),
  iWeek = page.indexOf('id="week-block"'), iGal = page.indexOf('id="gal-block"'), iInvite = page.indexOf('id="hs-invite"'), iRec = page.indexOf('id="board-block"'), iTerr = page.indexOf('id="hs-terr"'), iVoices = page.indexOf('id="voices-block"');
ok(iH1 > 0 && iH1 < iInv && iInv < iBox && iBox < iTry && iTry < iMine && iMine < iWeek && iWeek < iGal && iGal < iInvite && iInvite < iRec && iRec < iTerr && iTerr < iVoices && (page.match(/id="pulse-invite"/g) || []).length === 1,
  'C1 the order: the ask, its words and the box in one row; the suggestions; a seat\'s spaces; the spread; the morning; the visitor\'s band; the record; the territories; the voices');
ok(/EXCAVATE is your cultural intelligence engine\. Ask about any brand, category or behavior and get the reading: what people are doing, how much, and the move to make\. Sign in and it fits to you: your brands, your competitors, your role\./.test(page)
  && /k: 'LIVE PULSES · SIGN IN TO ACCESS'/.test(page) && /k: 'LIVE PULSES · WITH ENGINE'/.test(page) && /k: 'LIVE PULSES · PAUSED'/.test(page) && /an account opens the moves, the rooms, the full readings and your downloads/.test(page)
  && /Start with a question\. Stay for the loop\./.test(page) && /The move on every reading, and what it means for your role\./.test(page) && /Ask anything, live\./.test(page) && /This page, built around your brand, your competitors and your questions\./.test(page)
  && /Every reading, by date\./.test(page) && /placeholder="What have we seen on retro silhouettes\?"/.test(page) && /\['Open the move', 'Sign in for the move'\], \['Ask', 'Sign in to ask'\]/.test(page),
  'C2 the words: the description, the box by state, the visitor\'s band, the record\'s line and example, the labels a visitor reads');
const css = between(page, '<style id="house-style">', '</style>');
ok(/body\.uai-in \.hs-signin,body\.uai-in \.hs-lockwrap,body\.uai-in \.hs-lockrow\{display:none!important\}/.test(css) && /body:not\(\.uai-in\) \.hs-member\{display:none!important\}/.test(css) && /body\.uai-in \.hs-invite\{display:none\}/.test(css)
  && /#sec-explore #rec-counts,#sec-explore #board-more\{display:none!important\}/.test(css) && /#sec-explore #terr-block,#sec-explore #record-block\{display:none!important\}/.test(css) && /\.room-voices \.track\{animation:none;/.test(css) && /#sec-explore \.rec-lens small\{display:none\}/.test(css) && /#sec-explore \.room-head\.rec-head \.rec-ask-row\{width:100%;max-width:calc\(680px\*var\(--k\)\)/.test(css)
  && (css.match(/z-index:([^;}]+)/g) || []).every(z => /var\(--z-[a-z-]+\)/.test(z)) && /@media \(max-width:640px\)/.test(css) && !DASH.test(css),
  'C3 the style: the lock for a visitor and the move for a member; no band for a member; no score, no foot, no grid, no track record, still voices; every z-index a token; a phone layout; no dash');
ok(!/id="gal-day"|id="gal-cal"/.test(page) && /<section class="hub-block room-sec hs-terr" id="hs-terr" aria-label="Read by territory"><div class="gal-lenses" id="gal-lenses"/.test(page) && !/_galDayLoad\(\);\n  _whoLoad/.test(page)
  && /_pulseShow\(w && !w\.pulses \? w : null, true\)/.test(page), 'C4 the day\'s frames and the scorecard leave the arrival; the territories stand under the record; the box opens beside the ask');
ok(/else if \(d\.kind === 'move' && d\.id && typeof _hsMoveResume === 'function'\) _hsMoveResume\(d\.id, 0\);/.test(between(page, 'function _doorResume() {', '/* PURE: a label as a visitor reads it'))
  && /\.hs-row\[data-id="' \+ id \+ '"\]/.test(page) && /if \(typeof _hsMovesSync === 'function'\) _hsMovesSync\(\);/.test(between(page, 'function _navAuth() {', '/* SEAM:EXC_NAV: the dropdown.')),
  'C5 the door keeps the move for after sign-in; an address finds a reading on the record\'s new rows; the moves follow the sign-in');
const gr = between(page, 'function _galRender(g) {', '/* How our calls held: the record\'s scorecard');
ok(/_hsCard\(t, seen\)/.test(gr) && /list = g\.rows\.filter\(t => !mine\.has\(t\.id\)\)/.test(gr) && !/_renderScrollRow|_galAfter|_galDayRender/.test(gr) && /list\.innerHTML = rows\.map\(t => _hsRow\(t, seen\)\)\.join\(''\)|rows\.map\(t => _hsRow\(t, seen\)\)/.test(between(page, 'function _renderScroll(rec, data) {', 'function _renderLakeGrid(data) {'))
  && !/_renderLakeRow|Also moving, not yet read/.test(between(page, 'function _renderScroll(rec, data) {', 'function _renderLakeGrid(data) {')),
  'C6 the morning draws cards and leaves out a seat\'s own readings; the record draws its lighter rows and none of the lake\'s unread patterns');
ok(/if \(j && j\.ok && Array\.isArray\(j\.tiles\)\) \{ _FI_RECORD = j; if \(typeof _hsMovesMerge === 'function'\) _hsMovesMerge\(\); return j; \}/.test(page)
  && /function _playRecord\(id\) \{/.test(page) && /if \(arguments\[1\] !== true && window\._signedOut === false && typeof _hsMoves !== 'undefined' && !_hsMoves\.at && typeof _hsMovesLoad === 'function'\) \{ _hsMovesLoad\(\)\.then\(\(\) => _playRecord\(id, true\)\); return; \}/.test(page)
  && /move: mv \? \{ headline: mv,/.test(page) && /\$\{c\.move && window\._signedOut === false \? `<div class="move">/.test(page),
  'C7 a record loaded again keeps a member\'s moves; Play it after the door waits once for the move; a current\'s move shows to a member only');
console.log(`\nproof_house_style: ${pass} checks PASS`);
