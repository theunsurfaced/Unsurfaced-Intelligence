/**
 * proof_net_arrival.mjs  --  NT3 THE ARRIVAL: SEAM:NET_ARRIVAL. The home is the passed set. The box keeps its place and still runs a read
 * for a seat and the house; without a subscription it says what a live pulse is and runs nothing. The rail leads with netSetOf's lead;
 * the morning carries the night's other deployments in the house's order, in the record's row shape, with the house's note and the
 * room; the record leaves them out; a seat's spaces come first, under the box; the day's frames show only when the house made them, a
 * photograph only where its record clears the web; the territories are read from the state, never typed. Run from the repo root.
 */
import fs from 'fs';
import crypto from 'crypto';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the day's frames, public ─────────────────────────────────────────────────────────────────────────────────────
const blk = between(w, '/* ═══ SEAM:NET_ARRIVAL (NT3 THE ARRIVAL)', '/* SEAM:ARCHIVE');
const DF = between(w, 'const DAY_FRAMES = {', 'const DAY_FRAMES_CONTRACT');
const RC = between(w, 'function rightsClears(rec, ctx) {', 'async function rightsInsert(');
const HU = between(w, 'function houseAssetUrl(rec) {', '/* PURE: which reads point at which record');
const kv = new Map(), calls = [];
let ED = null, RECS = [];
const env = { RATE_LIMIT: { get: async k => kv.get(k) || null, put: async (k, v) => { kv.set(k, v); } } };
const fakeSb = async (e, path) => { calls.push(path); if (path.startsWith('editions?')) return ED ? [ED] : []; if (path.startsWith('media_rights?')) return RECS; return []; };
const A = new Function('sbRest', 'json', 'excQuiet', DF + RC + HU + blk + '; return { ARRIVAL_DAY, arrivalDayOf, arrivalDayRoute, DAY_FRAMES };')(
  fakeSb, (o, status) => ({ status, body: o }), (l, fb) => () => fb);
const R1 = '11111111-1111-4111-8111-111111111111', R2 = '22222222-2222-4222-8222-222222222222', R3 = '33333333-3333-4333-8333-333333333333';
const frames = [
  { item: 1, kicker: 'Retail', headline: 'Costco shoppers buy the card for the gas', line: 'The warehouse sold memberships at the pump all week.' },
  { item: 2, kicker: 'Sneakers', headline: 'Fans saw the 990v7 before New Balance named a price', line: 'Freshgoods posted it twice on his Story.' },
  { item: 3, kicker: 'Music', headline: 'The tour sold out in the cities it skipped last year', line: 'Three new dates went in a morning.' },
  { item: 4, kicker: 'Food', headline: 'The spice aisle moved to the front of the store', line: 'Two grocers put blends at the door.' }];
const readySet = () => ({ v: 1, status: 'ready', cover_line: 'The shelf decides before the ad does', frames: frames.map(f => Object.assign({}, f)), caption: 'The day in three sentences.', cost_usd: 0.04, model: 'claude-fable-5-1', by: 'cron', hold: null, voice: 'Method 5.0',
  slots: { cover: { rights_id: R1, kind: 'house', ref: 'make/cover.png' }, 'frames[0]': { rights_id: R2, kind: 'press', ref: 'https://press.example/costco.jpg' }, 'frames[1]': { rights_id: R3, kind: 'play', ref: 'play/take.png' } } });
RECS = [{ id: R1, kind: 'house', ref: 'make/cover.png', credit: 'Unsurfaced, AI illustration', contexts: ['weekly_pdf', 'web', 'social'] },
  { id: R2, kind: 'press', ref: 'https://press.example/costco.jpg', credit: 'Costco press room', contexts: ['web', 'card'] },
  { id: R3, kind: 'play', ref: 'play/take.png', credit: 'Unsurfaced PLAY', contexts: [] }];
ED = { id: 'ed1', issue_no: 123, date: '2026-10-31', frames: readySet() };
const day = A.arrivalDayOf(ED, RECS);
ok(day && day.issue_no === 123 && day.date === '2026-10-31' && day.cover_line === 'The shelf decides before the ad does' && day.frames.length === 4 && day.frames[0].kicker === 'Retail' && day.frames[3].line === 'Two grocers put blends at the door.',
  'A1 a ready set: the cover line and every frame\'s kicker, headline and line as written');
ok(day.cover && day.cover.url === '/media/make/cover.png' && day.frames[0].photo && day.frames[0].photo.url === 'https://press.example/costco.jpg' && day.frames[0].photo.credit === 'Costco press room' && day.frames[1].photo === null && day.frames[2].photo === null,
  'A2 a photograph only where the slot\'s record clears the web: the house\'s and the press kit\'s show, an unchecked PLAY render and an empty slot do not');
ok(!/cost_usd|claude|cron|Method 5\.0|caption|hold/.test(JSON.stringify(day)), 'A3 never the cost, the model, who wrote it, the voice, the caption or the hold');
const held = Object.assign({}, ED, { frames: Object.assign(readySet(), { status: 'held', hold: ['figure'] }) }), feedOnly = Object.assign({}, ED, { frames: Object.assign(readySet(), { status: 'feed_only' }) });
const thin = Object.assign({}, ED, { frames: Object.assign(readySet(), { frames: frames.slice(0, A.DAY_FRAMES.MIN_FRAMES - 1) }) });
ok(A.arrivalDayOf(held, RECS) === null && A.arrivalDayOf(feedOnly, RECS) === null && A.arrivalDayOf(thin, RECS) === null && A.arrivalDayOf({ issue_no: 9, frames: null }, RECS) === null && A.arrivalDayOf(null, []) === null,
  'A4 a held set, a set the feed started alone, a set under the minimum and a day with none show nothing');
calls.length = 0;
const r1 = await A.arrivalDayRoute(env, ''), n1 = calls.length, r2 = await A.arrivalDayRoute(env, '');
ok(r1.status === 200 && r1.body.ok && r1.body.day && r1.body.day.frames.length === 4 && n1 === 2 && /^editions\?status=eq\.published&order=date\.desc&limit=1/.test(calls[0]) && calls[1].includes(R1) && calls[1].includes(R2) && calls[1].includes(R3)
  && calls.length === 2 && r2.body.day.frames.length === 4 && kv.get(A.ARRIVAL_DAY.KEY) && A.ARRIVAL_DAY.TTL === 600,
  'A5 the route reads one edition row and one batch of rights records, then answers from KV for ten minutes');
kv.clear(); calls.length = 0; ED = held;
const r3 = await A.arrivalDayRoute(env, '');
ok(r3.body.ok && r3.body.day === null && calls.length === 1, 'A6 a held day answers day null and reads no rights');
ok(w.indexOf("if (path === '/excavate/day-frames' && request.method === 'GET') return arrivalDayRoute(env, origin);") > 0
  && w.indexOf("if (path === '/excavate/day-frames' && request.method === 'GET')") < w.indexOf('// Everything below requires a signed-in user'),
  'A7 GET /excavate/day-frames is public, beside the state');
ok(!/callClaude|callModel|claudeBatchSubmit|env\.AI\.run|fetch\(/.test(blk) && !/[—–]/.test(blk), 'A8 no model, no outside call, no dash');

// ── B: the page's block, with fakes ─────────────────────────────────────────────────────────────────────────────────
const nb = between(page, '/* ═══ SEAM:NET_ARRIVAL (NT3 THE ARRIVAL): the home is the passed set.', '/* ═══ end SEAM:NET_ARRIVAL ═══ */');
const els = {};
const mkEl = id => ({ id, innerHTML: '', textContent: '', style: {}, attrs: {}, getAttribute(k) { return this.attrs[k] || null; },
  classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, toggle(c, on) { if (on === undefined ? !this.s.has(c) : on) this.s.add(c); else this.s.delete(c); }, contains(c) { return this.s.has(c); } } });
const el = id => els[id] || (els[id] = mkEl(id));
const document = { getElementById: el, querySelector: () => null };
const U = { email: '' };
let TOKEN = null, PLAN = null, ADMIN = false, SPACES = null, DAYJ = null, ROOMS = [];
const fetched = [];
const fakeFetch = async (url, o) => {
  const p = new URL(url).pathname; fetched.push({ p, o: o || {} });
  const body = p === '/plan' ? PLAN : p === '/excavate/space' ? SPACES : p === '/excavate/day-frames' ? DAYJ : p === '/excavate/rooms' ? { ok: true, rooms: ROOMS } : null;
  if (body === 'fail') throw new Error('network');
  return { ok: !!body, json: async () => body };
};
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const seen = { live: [], gate: [], toasts: [], opened: [], rooms: [], nav: [], terr: [], refresh: 0 };
let RS = null;
const TERR = { territories: [{ territory: 'finance-fintech', name: 'Finance', state: 'rising' }, { territory: 'music', name: 'Music', state: 'steady' }, { territory: 'luxury', name: 'Luxury', state: 'quiet' }] };
const N = new Function('API_BASE', 'fetch', '_authHeader', '_isAdmin', '_currentUser', 'safe', 'safeAttr', '_recDay', '_renderScrollRow', '_drawPulses', 'document', 'window', 'navTo', '_openRoom', '_rooms', '_uuid',
  'showToast', 'openFeaturedCard', 'runSearch', '_TERR', '_terrName', '_terrOpen', '_FI_CACHE_KEY', '_checkAndRefreshFeatured', 'localStorage', '_FI_LAKE', '_FI_RECORD', '_renderScroll', '_leadBuilt', '_gateForDoor', '_profileOpen', 'setTimeout', '_hsCard', '_hsLine', '_hsMoveOpen',
  nb + '; return { _gal, _GAL, _whoLoad, _pulseWho, _pulseGate, _pulseShow, _galFeed, _galPick, _galRender, _galCal, _galLensRender, _galDayRender, _galDayLoad, _mineLoad, _mineRender, _mineMove, _galMorningAt, _galNoteHtml, _houseNoteShow, _galRoomOf, _galRoom, _galBoot, _galFresh, _mineOpen };')(
  'https://api.example', fakeFetch, async () => (TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}), async () => ADMIN, U, esc, esc, d => (d ? String(d).slice(5, 10) : ''),
  (t, s) => `<article class="row rec" data-row="${t.id}">${esc(t.claim)}</article>`, () => {}, document, {}, s => seen.nav.push(s), (id, a, by) => seen.rooms.push([id, by || 'id']), { list: [], at: 0 },
  id => (/^[0-9a-f-]{36}$/.test(String(id)) ? String(id) : ''), m => seen.toasts.push(m), id => seen.opened.push(id), () => RS && RS(), TERR, s => s, s => seen.terr.push(s), 'fi_key',
  () => { seen.refresh++; }, { getItem: () => null }, null, null, () => {}, 'x', d => seen.gate.push(d), () => seen.opened.push('profile'), f => f(),
  (t, s) => `<article class="hs-card" data-card="${t.id}">${esc(t.claim)}</article>`, t => 'Deployed ' + esc(t.deployed || ''), id => seen.opened.push('move:' + id));
const who = async (tok, plan, admin) => { TOKEN = tok; PLAN = plan; ADMIN = !!admin; N._gal.who = null; fetched.length = 0; const x = await N._whoLoad(); return Object.assign({ fetched: fetched.map(f => f.p) }, x); };
const out = await who(null, null), seat = await who('t', { ok: true, plan: 'engine', status: 'active', sell: true }), member = await who('t', { ok: true, plan: 'member', group: null, sell: true });
const house = await who('t', { ok: true, plan: 'member', group: null }, true), paused = await who('t', { ok: true, plan: 'partner', status: 'paused' }), unknown = await who('t', 'fail');
ok(out.kind === 'out' && out.pulses === false && out.fetched.length === 0 && seat.kind === 'seat' && seat.pulses && member.kind === 'member' && !member.pulses && member.sell
  && house.kind === 'house' && house.pulses && paused.kind === 'paused' && !paused.pulses && unknown.kind === 'unknown' && unknown.pulses,
  'B1 the viewer: signed out asks nothing; a seat and the house have pulses; a Member and a paused team do not; a plan that does not answer lets the read run, the meter deciding');

// the box, through the page's own runSearch
const rsSrc = between(page, 'function runSearch(){', '//  LIVE SEARCH');
RS = new Function('document', '_pulseGate', 'runLiveSearch', 'closeInsightDashboard', 'closePDFPreview', '_dashShow', rsSrc + '; return runSearch;')(
  { getElementById: id => (id === 'search-input' ? { value: '  Costco and the gas card  ' } : el(id)) }, () => N._pulseGate(), q => seen.live.push(q), () => {}, () => {}, () => {});
const box = async (tok, plan, admin) => { await who(tok, plan, admin); seen.live.length = 0; seen.gate.length = 0; fetched.length = 0; RS(); await new Promise(r => setTimeout(r, 5)); return { live: seen.live.slice(), fetched: fetched.map(f => f.p), invite: el('pulse-invite').innerHTML, open: el('pulse-invite').classList.contains('open'), shown: el('pulse-invite').style.display }; };
const bSeat = await box('t', { ok: true, plan: 'engine', status: 'active' }), bHouse = await box('t', { ok: true, plan: 'member' }, true);
ok(bSeat.live.length === 1 && bSeat.live[0] === 'Costco and the gas card' && bSeat.shown === 'none' && bHouse.live.length === 1, 'B2 the box still runs a read: a seat and the house go to runLiveSearch with the question, as before');
const bMember = await box('t', { ok: true, plan: 'member', sell: true }), bOut = await box(null, null);
ok(bMember.live.length === 0 && bMember.open && /Ask it\. Get the reading\./.test(bMember.invite) && /See what Engine adds/.test(bMember.invite) && /_profileOpen\(\)/.test(bMember.invite) && bMember.fetched.length === 0
  && bOut.live.length === 0 && /Sign in/.test(bOut.invite) && /_gateForDoor\(&#39;excavate&#39;\)|_gateForDoor\('excavate'\)/.test(bOut.invite) && /Talk to us/.test(bOut.invite) && bOut.fetched.length === 0,
  'B3 without a subscription the box says what a live pulse is and where it opens (Engine for a Member, the door for a visitor); no read runs and nothing is fetched');
N._gal.who = null; TOKEN = 't'; PLAN = { ok: true, plan: 'engine', status: 'active' }; seen.live.length = 0; RS(); await new Promise(r => setTimeout(r, 5));
ok(seen.live.length === 1, 'B4 a viewer not yet read is read first, then the box goes on');
N._pulseShow({ kind: 'member', pulses: false }, false);
ok(/LIVE PULSES/.test(el('pulse-invite').innerHTML) && /Live pulses come with Engine\./.test(el('pulse-invite').innerHTML) && /What a pulse is/.test(el('pulse-invite').innerHTML) && !el('pulse-invite').classList.contains('open'),
  'B5 under the box, before any question, one line says pulses come with Engine');

// the passed set
const T = (id, o) => Object.assign({ id, key: 'theme:' + id, status: 'ready', claim: 'Claim ' + id, frame: { entity: null }, measures: { recent_7d: 5 }, photo: null, house_note: null }, o || {});
const ids = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map(x => x + '0000000-0000-4000-8000-000000000000'.slice(x.length));
const [I1, I2, I3, I4, I5, I6] = ids;
const setTiles = [T(I1), T(I2, { key: 'track:9b9b9b9b-9b9b-49b9-89b9-9b9b9b9b9b9b', frame: { entity: 'Costco' }, house_note: { text: 'Bulk is the week, not the shelf', at: '2026-10-31' } }), T(I3, { frame: { entity: 'Jordan Brand' } }), T(I4, { status: 'reused' }), T(I5, { carried: true }), T(I6)];
const rec = { tiles: [I1, I2, I3, I4, I5].map(id => ({ id, claim: 'Claim ' + id, position: id === I3 ? { held: 2 } : null })).concat([{ id: 'old', claim: 'Old' }]) };
const door = { night: '2026-10-31', built_at: '2026-10-31T12:00:00Z', tiles: setTiles, lead: I2, order: [I2, I3, I1, I6, I4, I5], pass: { by: 'house' } };
ok(N._galFeed(door) === true && N._galFeed(door) === false, 'B6 the set is taken once; the same set again changes nothing');
const g = N._galPick(rec);
ok(g && g.rail.length === 1 && g.rail[0].id === I2 && g.rows.map(t => t.id).join() === [I3, I1].join() && g.rows[0].position && g.rows[0].position.held === 2 && g.rail[0].house_note.text === 'Bulk is the week, not the shelf',
  'B7 the lead is netSetOf\'s; the rows follow in the house\'s order; the record\'s own tile is used; a reused, a carried and a reading the record does not hold are not the morning\'s');
N._galFeed(Object.assign({}, door, { built_at: 'b2', lead: null, order: [I3, I2, I1] }));
const g2 = N._galPick(rec);
N._galFeed(Object.assign({}, door, { built_at: 'b3', lead: I4, order: null }));
const g3 = N._galPick(rec);
N._galFeed(Object.assign({}, door, { built_at: 'b4', tiles: [T(I4, { status: 'reused' })] }));
const g4 = N._galPick(rec);
N._galFeed(null); const g5 = N._galPick(rec);
ok(g2.rail[0].id === I3 && g2.rows.map(t => t.id).join() === [I2, I1].join() && g3.rail[0].id === I1 && g3.rows.map(t => t.id).join() === [I2, I3].join() && g4 === null && g5 === null,
  'B8 no lead from the house: the order\'s first; no order: the set\'s own; a lead that is not a deployment is not the lead; no deployment or no set, no morning');
N._galFeed(door);
N._galRender(N._galPick(rec));
const rowsHtml = el('gal-rows').innerHTML;
ok(el('gal-block').style.display === '' && (rowsHtml.match(/class="hs-card"/g) || []).length === 2 && rowsHtml.indexOf('data-card="' + I3) < rowsHtml.indexOf('data-card="' + I1) && !/The room/.test(rowsHtml) && el('gal-sub').textContent === 'After the lead, the night\u2019s readings. Each opens its move.',
  'B9 the morning (NT3c): a card for each, in order; the note and the room open with its move');
const lead = N._galPick(rec).rail[0];
ok(/From the house, 10-31/.test(N._galNoteHtml(lead.house_note)) && /Bulk is the week, not the shelf/.test(N._galNoteHtml(lead.house_note)) && N._galNoteHtml(null) === '' && N._galNoteHtml({ text: '  ' }) === '',
  'B10 the house\'s note: its text and its date, never who; nothing when there is none');
N._houseNoteShow(lead.house_note); const shownNote = el('results-house-note').style.display; N._houseNoteShow(null);
ok(shownNote === '' && el('results-house-note').style.display === 'none' && el('results-house-note').innerHTML === '', 'B11 the deep dive shows the note under its band, and clears it for a reading without one');
ok(N._galRoomOf({ key: 'track:9b9b9b9b-9b9b-49b9-89b9-9b9b9b9b9b9b' }).by === 'track' && N._galRoomOf({ key: 'theme:x', frame: { entity: 'Jordan Brand' } }).name === 'Jordan Brand' && N._galRoomOf({ key: 'theme:x', frame: {} }) === null,
  'B12 the room: a watched brand\'s by its track, a named subject\'s by its name; a pattern has none');
ROOMS = [{ id: '7e7e7e7e-7e7e-47e7-87e7-7e7e7e7e7e7e', name: 'Jordan Brand', aliases: ['JB'] }];
await N._galRoom(I3); await N._galRoom(I2);
ok(seen.rooms[0][0] === '7e7e7e7e-7e7e-47e7-87e7-7e7e7e7e7e7e' && seen.rooms[1][0] === '9b9b9b9b-9b9b-49b9-89b9-9b9b9b9b9b9b' && seen.rooms[1][1] === 'track' && seen.nav.every(s => s === 'brands'), 'B13 opening the room goes to the subject\'s room');
ok(N._galCal('<span class="rec-score">When we said High, the call held 16 of 20.</span>') === true && /HOW OUR CALLS HELD/.test(el('gal-cal').innerHTML) && /16 of 20/.test(el('gal-cal').innerHTML), 'B14 how our calls held sits on the morning while a set is passed');
N._galRender(null);
ok(el('gal-block').style.display === 'none' && N._galCal('<span>x</span>') === false && el('gal-cal').style.display === 'none', 'B15 no passed set: no morning, and the scorecard stays on the record\'s head');
N._galRender(N._galPick(rec));
N._galLensRender();
const lens = el('gal-lenses').innerHTML;
ok(/READ BY TERRITORY/.test(lens) && /_terrOpen\(&#39;finance-fintech&#39;\)|_terrOpen\('finance-fintech'\)/.test(lens) && />Finance</.test(lens) && (lens.match(/class="gl /g) || []).length === 3 && !/advertising-marketing|sneakers-streetwear|technology-innovation|artificial-intelligence/.test(nb),
  'B16 the lenses are the state\'s territories, however many it names (a new one shows), and the block types none');

// a seat's spaces
SPACES = { ok: true, held: [{ id: 's1', key: 'brand:acme', kind: 'brand', name: 'Acme', status: 'active', cadence: 'nightly', last_compiled_at: '2026-10-30', last_read_id: 'r9', latest: { id: 'r9', claim: 'Acme owns the aisle', deployed: '2026-10-30', measures: {}, frame: { entity: 'Acme' } }, movement: { recent_7d: 9, velocity_pct: 40 } },
  { id: 's2', key: 'cat:smart-glasses', kind: 'category', name: 'smart glasses', status: 'active', cadence: 'every_2', movement: { night: '2026-10-30', measured: false }, last_considered: '2026-10-30' },
  { id: 's3', key: 'brand:old', kind: 'brand', name: 'Old', status: 'dormant' }], granted: [{ id: 's4', key: 'brand:nike', kind: 'brand', name: 'Nike', status: 'active', cadence: 'weekly', movement: { recent_7d: 1, velocity_pct: -50 } }] };
await who('t', { ok: true, plan: 'engine', status: 'active' }); await N._mineLoad();
const mine = el('my-spaces').innerHTML;
ok(el('my-spaces').style.display === '' && /YOUR SPACES/.test(mine) && (mine.match(/class="ms-card"/g) || []).length === 3 && /Acme owns the aisle/.test(mine) && /data-id="r9"/.test(mine) && /Its first reading comes on its next night\./.test(mine) && /Shared with you/.test(mine) && !/Old/.test(mine) && !/stories this week|nightly|every two nights/.test(mine) && N._gal.mineLatest.length === 1 && N._gal.mineLatest[0].id === 'r9',
  'B17 a seat\'s spaces lead (NT3c): each with its latest reading, or when its first comes; a granted one says so; a dormant one is not shown; no figures, no cadence');
seen.opened.length = 0; N._mineOpen('s1'); N._mineOpen('s2');
ok(seen.opened[0] === 'move:r9' && /smart glasses is read on its next night/.test(seen.toasts[seen.toasts.length - 1]), 'B18 opening a space opens its latest reading\'s move, or says when it is read');
await who(null, null); fetched.length = 0; await N._mineLoad();
ok(el('my-spaces').style.display === 'none' && !fetched.some(f => f.p === '/excavate/space'), 'B19 signed out: no spaces asked for, none shown');

// the day's frames
N._gal.day = { issue_no: 123, date: '2026-10-31', cover_line: 'The shelf decides before the ad does', cover: null,
  frames: [{ kicker: 'Retail', headline: 'Costco shoppers buy the card for the gas', line: 'All week.', photo: { url: '/media/make/x.png', credit: 'Unsurfaced, AI illustration' } }, { kicker: 'Music', headline: 'The tour sold out', line: 'In a morning.', photo: null }, { kicker: 'Food', headline: 'The spice aisle moved', line: 'Two grocers.', photo: null }] };
N._galDayRender();
const dayHtml = el('gal-day').innerHTML;
ok(/THE DAY IN FRAMES/.test(dayHtml) && (dayHtml.match(/class="gd-f[" ]/g) || []).length === 5 && /1 \/ 3/.test(dayHtml) && /https:\/\/api\.example\/media\/make\/x\.png/.test(dayHtml) && (dayHtml.match(/<img/g) || []).length === 1 && /Your hidden hand\./.test(dayHtml) && /UNSURFACED-INTELLIGENCE\.COM\/DAILY/.test(dayHtml) && /UNSURFACED™ DAILY/.test(dayHtml) && /href="\.\.\/daily\/"/.test(dayHtml),
  'B20 the day\'s frames: the cover, a frame a story, the closer with the name, Your hidden hand. and the url; a photograph only where the worker gave one');
N._gal.day = null; N._galDayRender();
ok(el('gal-day').style.display === 'none' && el('gal-day').innerHTML === '', 'B21 no frames made: nothing shown');
DAYJ = { ok: true, day: null }; N._gal.dayAt = 0; await N._galDayLoad();
ok(N._gal.day === null && el('gal-day').style.display === 'none', 'B22 a day the house has not made answers null and shows nothing');

// the morning, after the pass
const at = (iso) => new Date(N._galMorningAt(Date.parse(iso))).toISOString();
ok(at('2026-10-31T10:00:00Z') === '2026-10-30T12:00:00.000Z' && at('2026-10-31T13:00:00Z') === '2026-10-31T12:00:00.000Z' && at('2026-11-01T15:00:00Z') === '2026-11-01T13:00:00.000Z' && at('2026-11-02T12:30:00Z') === '2026-11-01T13:00:00.000Z',
  'B23 the last 07:00 in Chicago, in daylight time and after the clocks change on Nov 1');

// ── C: the page's wiring ────────────────────────────────────────────────────────────────────────────────────────────
const iBox = page.indexOf('id="search-input"'), iInv = page.indexOf('id="pulse-invite"'), iMine = page.indexOf('id="my-spaces"'), iWeek = page.indexOf('id="week-block"'), iGal = page.indexOf('id="gal-block"'), iRec = page.indexOf('id="board-block"');
ok(/<section class="hero">\s*<div class="hero-left">/.test(page) && iBox > 0 && iBox < iInv && iInv < iMine && iMine < iWeek && iWeek < iGal && iGal < iRec && /<div class="ask-sticky" id="ask-sticky"/.test(page),
  'C1 the box keeps its place at the top, the ask still follows; the pulse\'s door beside the box, after it in the markup (NT4), then a seat\'s spaces, then the spread; the morning before the record');
const rs = between(page, 'function runSearch(){', '//  LIVE SEARCH');
ok(/if\(!q\) return;\n  if \(typeof _pulseGate === 'function' && _pulseGate\(\)\) return;/.test(rs) && /runLiveSearch\(q\);   \/\/ SEAM:ONE_RAIL/.test(rs), 'C2 the door sits at the top of runSearch; the one rail is unchanged behind it');
const lr = between(page, 'function _leadRender(rec) {', 'function _leadCards() {');
ok(/const g = typeof _galPick === 'function' \? _galPick\(rec\) : null;/.test(lr) && /const pick = g \? g\.rail : rec\.tiles\.filter/.test(lr) && /window\._leadIds = new Set\(pick\.map\(t => t\.id\)\); if \(g\) g\.rows\.forEach\(t => window\._leadIds\.add\(t\.id\)\);/.test(lr)
  && /rail\.insertAdjacentHTML\('afterbegin'/.test(lr) && /\$\{g \? 'The lead · ' : ''\}Deployed/.test(lr) && /if \(typeof _galRender === 'function'\) _galRender\(g\);/.test(lr),
  'C3 the rail leads with the set\'s lead ahead of the week\'s read; the record leaves out the rail and the morning; with no set the rail is EX36b\'s');
const sr = between(page, 'function _renderScrollRow(t, seen) {', '/* SEAM:ASK_RECORD:');
ok(crypto.createHash('sha256').update(sr).digest('hex').slice(0, 16) === '01e5fde3071b50e8', 'C4 the record\'s row shape is kept as EX33 made it; the arrival draws its own lighter rows and cards (NT3c)');
ok(!/_scoreLine\(rec\.scorecard\)/.test(between(page, 'function _renderScroll(rec, data) {', 'function _renderLakeGrid(data) {')) && /counts\.innerHTML = ''; counts\.style\.display = 'none';/.test(page), 'C5 no score on the arrival (NT3c): the record\'s head prints none; every reading\'s bet carries its grade');
ok(/if \(typeof _galFeed === 'function'\) _galFeed\(data && data\.door\);/.test(between(page, 'function _renderLakeGrid(data) {', '// ── Background refresh logic'))
  && /if \(typeof _galBoot === 'function'\) _galBoot\(\);/.test(between(page, 'function initFeaturedInsights() {', 'renderTrendingNow();'))
  && /if \(typeof _houseNoteShow === 'function'\) _houseNoteShow\(j\.data\.house_note \|\| null\);/.test(between(page, 'async function _openDoorRead(t) {', '/* SEAM:CLIENT_PROFILE'))
  && /<div class="results-house-note" id="results-house-note" style="display:none"><\/div>/.test(page),
  'C6 the set from the feed, the boot beside the record, the note under the deep dive\'s band');
const tr = between(page, 'function _terrRender(st) {', 'function _terrOpen(slug) {');
ok(!/Twenty areas/.test(page) && /<div class="sub" id="terr-sub">/.test(page) && /tn \+ ' areas of culture\./.test(tr) && /_galLensRender\(\)/.test(tr), 'C7 the territories\' line counts them from the state; nothing types twenty');
const gets = [...nb.matchAll(/_galApi\('([^']+)'\)/g)].map(m => m[1]);
ok(gets.length && gets.every(p => ['/plan', '/excavate/space', '/excavate/day-frames', '/excavate/rooms'].includes(p)) && !/method:\s*'POST'|excavate\/(interpret|gather|synthesize)|\bapi\(/.test(nb) && !/[—–]/.test(nb),
  'C8 the block asks GET routes only (the plan, the spaces, the day\'s frames, the rooms), no model, no dash');
ok(/<section class="hub-block room-sec gal" id="gal-block" style="display:none" aria-label="The readings">/.test(page) && /<div class="gal-rows" id="gal-rows"><\/div>/.test(page) && !/id="gal-day"|id="gal-cal"/.test(page) && /<section class="hub-block room-sec hs-terr" id="hs-terr" aria-label="Read by territory"><div class="gal-lenses" id="gal-lenses"/.test(page),
  'C9 the morning\'s markup is its cards (NT3c); the lenses stand under the record; no day\'s frames and no score on the arrival');
console.log(`\nproof_net_arrival: ${pass} checks PASS`);
