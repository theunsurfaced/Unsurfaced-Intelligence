/**
 * proof_breadth.mjs  --  LK1 THE BREADTH: SEAM:BREADTH. The lake reads twenty-seven territories, each named, with a lens, a beat, two
 * GDELT lanes and three or more feeds across two tiers; TERRITORY_SLUGS is the registry's. The round is the night's seventh compile, for
 * the territory the record has read least recently, keeping the stamp rule and the evidence floor and reading past the movement threshold.
 * The pull brings a named set's last three months into the lake as research, on the free rails, with no model. Aim lanes give each held
 * category its own GDELT search inside today's twenty calls a slice. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const readPage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const literal = (src, head) => { const i = src.indexOf(head); if (i < 0) throw new Error('literal ' + head); let j = src.indexOf('{', i), d = 0; for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return new Function('return ' + src.slice(j, k + 1))(); } } throw new Error('unclosed ' + head); };

const DAILY_POV = literal(w, 'const DAILY_POV = ');
const INDUSTRY_NAMES = literal(w, 'const INDUSTRY_NAMES = ');
const LENS_OF_TERRITORY = literal(w, 'const LENS_OF_TERRITORY = ');
const SPACES = literal(w, 'const SPACES = ');
const DOOR = literal(w, 'const DOOR = { WANT: 30');
const BOARD_SWEEP = literal(w, 'const BOARD_SWEEP = ');
const blockSrc = w.slice(w.indexOf('/* ═══ SEAM:BREADTH (LK1 THE BREADTH'));
const OLD20 = ['advertising-marketing', 'technology-innovation', 'artificial-intelligence', 'business-economics', 'entrepreneurship-creator', 'music', 'fashion-beauty', 'sneakers-streetwear', 'art-design', 'architecture-cities',
  'entertainment-gaming', 'food-hospitality', 'sustainability-impact', 'global-diaspora', 'sports-culture', 'wellness-fitness', 'retail-dtc', 'luxury', 'travel-experiences', 'media-platforms'];

// The block, with fakes for what it asks of the house.
let KV = {}, calls = [], DB = {}, gathered = [], capturedRows = [], logged = [];
const env = { RATE_LIMIT: { get: async k => (k in KV ? KV[k] : null), put: async (k, v) => { KV[k] = v; } } };
const fakeSb = async (e, path, o) => { calls.push({ path, o: o || {} }); for (const k of Object.keys(DB)) if (path.startsWith(k)) return typeof DB[k] === 'function' ? DB[k](path, o) : DB[k]; return []; };
const quiet = (label, fb) => (fb === undefined ? () => undefined : () => fb);
let NIGHT = '2026-11-01';
const fakeGather = async (e, q, opts) => { gathered.push({ q, opts }); return { ok: true, cls: 'brand', items: [{ title: q + ' story', url: 'https://x.test/' + encodeURIComponent(q), kind: 'news' }] }; };
const fakeCapture = async (e, items, prov) => { capturedRows.push({ items, prov }); return items.length; };
const B = new Function('DAILY_POV', 'INDUSTRY_NAMES', 'LENS_OF_TERRITORY', 'SPACES', 'DOOR', 'BOARD_SWEEP', 'FEED', 'LEDGER', 'sbRest', 'excQuiet', 'loadTracks', 'doorNight', 'doorCandidates', 'gatherOpenSignals', 'lakeCapture', 'logEvent',
  blockSrc + '; return { LAKE, lakeSectorTerritory, lakeRowTerritory, lakeLanePlan, lakeAimQueries, lakeAimLanes, lakeRoundOrder, lakeTerritoryLines, lakeRoundTheme, lakeRoundTrack, lakeRoundPick, lakeRoundOutcome, lakeRoundNote, lakeRoundTonight, lakeRoundPreview, lakePullFrame, lakePullItems, lakePullQueue, lakePullStep, lakePullDesk, lakePullLoad, lakeAddedReport };')(
  DAILY_POV, INDUSTRY_NAMES, LENS_OF_TERRITORY, SPACES, DOOR, BOARD_SWEEP, { TRACKS_KEY: 'tracks:stats' }, { TABLE: 'subject_weeks' }, fakeSb, quiet, async () => TRACKS, () => NIGHT, async () => [], fakeGather, fakeCapture, async (...a) => { logged.push(a); });
let TRACKS = [];

// ── A: the twenty-seven ─────────────────────────────────────────────────────────────────────────────────────────────────
const T = DAILY_POV.territories;
ok(T.length === 27 && OLD20.every((t, i) => T[i] === t) && B.LAKE.ADDED.every((t, i) => T[20 + i] === t) && new Set(T).size === 27, 'A1 twenty-seven territories: the twenty in their order, then the seven LK1 added');
const BEATS = ['advertising', 'tech', 'ai', 'culture', 'creativity'], LENSES = ['consumer', 'market', 'culture', 'brand', 'truth'];
ok(T.every(t => INDUSTRY_NAMES[t] && BEATS.includes(DAILY_POV.beat_map[t]) && Array.isArray(DAILY_POV.lanes[t]) && DAILY_POV.lanes[t].length >= 2 && LENSES.includes(LENS_OF_TERRITORY[t] || 'culture'))
  && B.LAKE.ADDED.every(t => ['market', 'consumer'].includes(LENS_OF_TERRITORY[t])), 'A2 every territory is named, beated, laned twice and lensed; the seven each carry a lens of their own');
const src = DAILY_POV.sources, gate = t => { const s = src.filter(x => x.territories.includes(t)); return { n: s.length, tiers: new Set(s.map(x => x.tier)).size }; };
const NEW = ['CoinDesk', 'Banking Dive', 'Finextra', 'Payments Dive', 'The Financial Brand', 'Insurance Journal', 'Fintech Business Weekly', 'Car and Driver', 'Electrek', 'InsideEVs', 'Carscoops', 'Fierce Pharma', 'STAT', 'Endpoints News',
  'Healthcare Dive', 'Fierce Pharma Marketing', 'MedCity News', 'The Real Deal', 'HousingWire', 'Inman', 'Realtor.com News', 'Redfin', 'Light Reading', 'Fierce Network', 'RCR Wireless News', 'Total Telecom', 'TeleGeography', 'Supermarket News',
  'Shanken News Daily', 'Grocery Dive', 'The Spirits Business', 'Nosh', 'VinePair', 'Legal Sports Report', 'Sports Handle', 'Sports Betting Dime'];
const added = src.filter(s => NEW.includes(s.name));
ok(B.LAKE.ADDED.every(t => gate(t).n >= 3 && gate(t).tiers >= 2) && T.every(t => gate(t).n >= 3 && gate(t).tiers >= 2), 'A3 the gate: every territory, the seven included, has three or more feeds across two or more tiers');
ok(added.length === NEW.length && added.every(s => s.verified === false && /^https:\/\//.test(s.feed) && [1, 2, 3].includes(s.tier) && s.territories.some(t => B.LAKE.ADDED.includes(t)))
  && new Set(src.map(s => s.name)).size === src.length && new Set(src.map(s => s.feed)).size === src.length && src.length === 111 + NEW.length,
  'A4 thirty-six new feeds, each a candidate until its first capture, https, tiered; every name and every feed once in the registry');
ok(['Curbed', 'Food Dive', 'Front Office Sports', 'Sportico'].every(n => { const s = src.find(x => x.name === n); return s && s.territories.some(t => B.LAKE.ADDED.includes(t)); }), 'A5 four feeds the lake already reads join a new territory too (Curbed, Food Dive, Front Office Sports, Sportico)');
ok(B.LAKE.ADDED.every(t => DAILY_POV.lanes[t].every(q => /^[A-Za-z0-9 ]+$/.test(q) && q.split(' ').length >= 2 && q.split(' ').length <= 4 && q.split(' ').every(x => x.length >= 3))), 'A6 the seven lanes are short phrases in the lanes\' register: two to four words of three letters or more, no quotes or brackets');
ok(/const TERRITORY_SLUGS = \(typeof DAILY_POV === 'object' && DAILY_POV \? DAILY_POV\.territories : \[\]\)\.slice\(\);/.test(w) && !/const TERRITORY_SLUGS = \[/.test(w) && !/'subject_weeks\?/.test(w), 'A7 TERRITORY_SLUGS is the registry\'s own list, so the two never drift');
const meth = between(w, 'function excavateMethod() {', 'async function excavateMethodRoute(');
ok(/KEY: 'state:v5'/.test(w) && /KEY: 'method:v2'/.test(w) && /id: 'round', say: 'One more reading a night goes to the territory the record has read least recently, where the lake holds ' \+ DOOR\.MIN_EVIDENCE \+ ' lines or more over ' \+ DOOR\.SINCE_D \+ ' days/.test(meth),
  'A8 the state and the method are keyed anew for the twenty-seven; the method says the round, from the constants that make it');
ok(/text: \(typeof LAKE === 'object' && typeof INDUSTRY_NAMES === 'object' && LAKE\.ADDED\.includes\(sl\) && INDUSTRY_NAMES\[sl\]\) \|\| sl\.split\('-'\)/.test(w), 'A9 the search box suggests the seven by their names (the twenty as before)');

// ── B: where a sector belongs ───────────────────────────────────────────────────────────────────────────────────────────────
const S = B.lakeSectorTerritory;
ok(S('Finance') === 'finance-fintech' && S('Lifestyle & Apparel') === 'fashion-beauty' && S('smart glasses') === 'technology-innovation' && S('seasonings and spice blends') === 'packaged-goods-beverage' && S('Media & Entertainment') === 'entertainment-gaming'
  && S('Retail') === 'retail-dtc' && S('Technology') === 'technology-innovation' && S('Real estate and home') === 'real-estate-home' && S('betting') === 'betting' && S('Health and pharma') === 'health-pharma' && S('') === null && S('Wallpaper') === null && S('scarface') === null,
  'B1 a sector or a category lands in its territory by its own name or by its words (whole words, never inside one); a sector with no words lands nowhere');
ok(B.lakeRowTerritory({ round: { territory: 'betting' } }, [{ territory: 'music' }]) === 'betting' && B.lakeRowTerritory({ kind: 'theme', territories: ['music'] }, [{ territory: 'luxury' }, { territory: 'luxury' }, { territory: 'music' }, { territory: null }]) === 'luxury'
  && B.lakeRowTerritory({ kind: 'theme', territories: ['music'] }, [{ title: 'gdelt line' }]) === 'music' && B.lakeRowTerritory({ kind: 'track', subtitle: 'Finance' }, []) === 'finance-fintech' && B.lakeRowTerritory({ kind: 'category', category: 'smart glasses' }, []) === 'technology-innovation',
  'B2 a row\'s territory: the round\'s own; else where most of its lake lines were placed; else its theme\'s; else its sector\'s or its category\'s');

// ── C: the lanes inside today's GDELT calls ────────────────────────────────────────────────────────────────────────────────
const lanes20 = Object.fromEntries(OLD20.map(t => [t, DAILY_POV.lanes[t]]));
const old = h => Object.keys(lanes20).map(t => ({ beat: t, territory: t, q: lanes20[t][h % lanes20[t].length] }));
ok([0, 1, 2, 7, 4321].every(h => JSON.stringify(B.lakeLanePlan(lanes20, [], h, 20)) === JSON.stringify(old(h))), 'C1 with room for every territory the plan is today\'s, exactly: one lane per territory, the phrase by the half hour');
const aim2 = [{ key: 'cat:smart-glasses', territory: 'technology-innovation', qs: ['A1', 'A2'] }, { key: 'cat:seasonings', territory: 'packaged-goods-beverage', qs: ['B1'] }];
const p0 = B.lakeLanePlan(DAILY_POV.lanes, aim2, 1000, 20), p1 = B.lakeLanePlan(DAILY_POV.lanes, aim2, 1001, 20);
const seen2 = new Set(p0.concat(p1).filter(x => !x.aim).map(x => x.territory));
ok(p0.length === 20 && p0[0].aim === 'cat:smart-glasses' && p0[0].q === 'A1' && p1[0].q === 'A2' && p0[1].q === 'B1' && p0.slice(2).every(x => !x.aim) && T.every(t => seen2.has(t)), 'C2 twenty calls a slice: the aim lanes first (each alternating its forms), then the territory lanes; across two slices every one of the twenty-seven is asked');
const aim6 = Array.from({ length: 6 }, (_, i) => ({ key: 'a' + i, qs: ['q' + i] }));
const phr = new Map(); for (let h = 500; h < 512; h++) for (const x of B.lakeLanePlan(DAILY_POV.lanes, aim6, h, 20)) if (!x.aim) { const s = phr.get(x.territory) || new Set(); s.add(x.q); phr.set(x.territory, s); }
const two = (h0) => new Set(B.lakeLanePlan(DAILY_POV.lanes, aim6, h0, 20).concat(B.lakeLanePlan(DAILY_POV.lanes, aim6, h0 + 1, 20)).filter(x => !x.aim).map(x => x.territory));
ok(B.lakeLanePlan(DAILY_POV.lanes, aim6, 500, 20).length === 20 && [500, 501, 777].every(h => T.every(t => two(h).has(t))) && T.every(t => phr.get(t) && phr.get(t).size === 2),
  'C3 at six aim lanes, fourteen territory lanes a slice still reach all twenty-seven every two slices, and each territory\'s two phrases take turns');
ok(B.LAKE.LANES === 20 && OLD20.length === B.LAKE.LANES && B.LAKE.AIM_MAX === SPACES.HAND_MAX, 'C4 the slice keeps today\'s twenty GDELT calls (one a territory over the twenty); aim lanes are the house\'s hand, six at most');
const cap = between(w, 'async function spineCapture(env, opts) {', 'async function runDailySpine(env, opts) {');
ok(/const aim = nLanes === 'all' && typeof lakeAimLanes === 'function' \? await lakeAimLanes\(env\)\.catch\(excQuiet\('aim_lanes', \[\]\)\) : \[\];/.test(cap) && /lakeLanePlan\(DAILY_POV\.lanes, aim, hours, LAKE\.LANES\)/.test(cap)
  && /const sig = await gatherServerSignals\(lane\.q, lane\.aim \? \{ hn: false \} : null\);/.test(cap) && /async function gatherServerSignals\(q, opts\) \{/.test(w) && /  if \(!\(opts && opts\.hn === false\)\) try \{\n    const r = await fetch\(`https:\/\/hn\.algolia\.com/.test(w) && /territory: lane\.territory \|\| null/.test(cap),
  'C5 the intake reads the house\'s aim lanes and plans inside LAKE.LANES; an aim lane asks GDELT alone; its rows are placed as every lane\'s are');

// ── D: the aim lanes ───────────────────────────────────────────────────────────────────────────────────────────────────────
const glasses = { key: 'cat:smart-glasses', name: 'Smart glasses', category: 'smart glasses', frame: { members: [{ id: 'e1', name: 'Ray-Ban Meta' }, { id: 'e2', name: 'Xreal' }, { id: 'e3', name: 'Snap Spectacles' }, { id: 'e4', name: 'Android XR' }] } };
const ents = [{ id: 'e3', name: 'Snap Spectacles', ambiguous: true, context: ['snap', 'glasses', 'ar', 'augmented reality', 'smart glasses'] }];
const g = B.lakeAimQueries(glasses, ents);
ok(g && g.qs.length === 2 && g.qs[0] === '("smart glasses" OR "Ray-Ban Meta" OR Xreal OR "Android XR")' && g.qs[1] === '"Snap Spectacles" (snap OR glasses OR "augmented reality" OR "smart glasses")' && g.territory === 'technology-innovation' && g.qs.every(q => q.length <= B.LAKE.AIM_CHARS),
  'D1 a held category\'s search: its phrase and its plain members in one OR block; a member in ordinary use with one of its context words required (a word under three letters dropped); each form within the wire\'s cut');
const many = { key: 'cat:x', name: 'Seasonings and spice blends', category: 'seasonings and spice blends', frame: { members: Array.from({ length: 14 }, (_, i) => ({ id: 'm' + i, name: 'Spice Brand Number ' + i })) } };
const m = B.lakeAimQueries(many, []), bare = B.lakeAimQueries({ key: 'cat:y', name: 'Luxury resale', category: 'luxury resale', frame: {} }, []), none = B.lakeAimQueries({ key: 'cat:z', name: 'A very long category name here', category: 'a very long category name here', frame: {} }, []);
ok(m.qs.length === 1 && m.qs[0].length <= B.LAKE.AIM_CHARS && !/\(.*\(/.test(m.qs[0]) && m.qs[0].endsWith(')') && m.territory === 'packaged-goods-beverage' && bare.qs[0] === '"luxury resale"' && none === null,
  'D2 the members fit the cut whole (never a broken bracket, never nested); a category with no set searches its own phrase; a long name with no set has no lane');
DB = { 'spaces?kind=eq.category&held_by=eq.house&status=eq.active': Array.from({ length: 9 }, (_, i) => ({ key: 'cat:c' + i, name: 'Cat ' + i, category: 'cat ' + i, frame: { members: [{ id: 'x' + i, name: 'Member ' + i }] } })), 'entities?id=in.': [] };
calls = [];
const al = await B.lakeAimLanes(env);
ok(al.length === 6 && /spaces\?kind=eq\.category&held_by=eq\.house&status=eq\.active&select=key,name,category,frame&order=since\.asc&limit=6/.test(calls[0].path) && /^entities\?id=in\./.test(calls[1].path), 'D3 the house\'s held categories only, six at most, oldest first; two reads a slice');

// ── E: the round's order ───────────────────────────────────────────────────────────────────────────────────────────────────
const terrs = ['a-one', 'b-two', 'c-three', 'd-four', 'e-five'];
const lines = { 'a-one': 50, 'b-two': 9, 'c-three': 30, 'd-four': 2, 'e-five': 30 };
const ord = B.lakeRoundOrder(terrs, { 'a-one': '2026-10-31', 'c-three': '2026-10-01' }, { 'e-five': { night: '2026-10-20', outcome: 'reused' } }, lines, '2026-11-01', 4);
ok(ord.map(o => o.territory).join() === 'b-two,c-three,e-five,a-one' && ord[0].last === null && ord[1].read === '2026-10-01', 'E1 never touched first, then the oldest touch (a reading or the round\'s own try); under the floor, no place');
ok(B.lakeRoundOrder(terrs, {}, {}, {}, '2026-11-01', 4).length === 5 && B.lakeRoundOrder(['p', 'q', 'r'], {}, {}, { p: 5, q: 9, r: 9 }, '2026-11-01', 4).map(o => o.territory).join() === 'q,r,p', 'E2 with no counts on record every territory may try; a tie goes to the one with more lines, then the slug');
const thin = { 'b-two': { night: '2026-10-28', outcome: 'thin' } };
ok(!B.lakeRoundOrder(terrs, {}, thin, lines, '2026-11-01', 4).some(o => o.territory === 'b-two') && B.lakeRoundOrder(terrs, {}, thin, lines, '2026-11-05', 4).some(o => o.territory === 'b-two'), 'E3 a territory the round found thin waits seven nights');
ok(JSON.stringify(B.lakeTerritoryLines([{ subject_key: 'territory:music', counts: { n: 3 } }, { subject_key: 'territory:music', counts: { n: 4 } }, { subject_key: 'theme:x', counts: { n: 9 } }, { subject_key: 'territory:luxury', counts: null }])) === '{"music":7,"luxury":0}',
  'E4 a territory\'s lines are the memory\'s own weekly counts, summed');

// ── F: the round's subject ─────────────────────────────────────────────────────────────────────────────────────────────────
const now = Date.parse('2026-11-01T06:10:00Z'), ago = d => new Date(now - d * 864e5).toISOString();
const rows = [].concat(Array.from({ length: 5 }, (_, i) => ({ theme_id: 'T1', cluster_id: 'C1', title: 'Older theme ' + i, captured_at: ago(20 + i) })), Array.from({ length: 4 }, (_, i) => ({ theme_id: null, cluster_id: 'C2', title: 'Fresh theme ' + i, captured_at: ago(i + 1) })),
  Array.from({ length: 6 }, (_, i) => ({ theme_id: 'T3', cluster_id: 'C3', title: 'Board theme ' + i, captured_at: ago(1) })), [{ theme_id: 'T4', cluster_id: 'C4', title: 'Thin', captured_at: ago(1) }]);
const th = B.lakeRoundTheme(rows, new Set(['theme:C3']), now, 4);
ok(th && th.id === 'C2' && th.n7 === 4 && th.title === 'Fresh theme 0' && B.lakeRoundTheme(rows, new Set(['theme:C3', 'theme:C2']), now, 4).id === 'T1' && B.lakeRoundTheme(rows.slice(-1), new Set(), now, 4) === null,
  'F1 the territory\'s loudest theme this week, then over the window; never one already on tonight\'s board (by either id); four lines at least');
const tracks = [{ id: 'r1', name: 'Robinhood', sector: 'Finance', aliases: ['HOOD'] }, { id: 'v1', name: 'Visa', sector: 'Finance', aliases: [] }, { id: 'n1', name: 'Nike', sector: 'Lifestyle & Apparel' }];
const tk = B.lakeRoundTrack(tracks, { r1: { n7: 2 }, v1: { n7: 5 } }, new Set(), 'finance-fintech');
ok(tk && tk.key === 'track:v1' && tk.kind === 'track' && tk.names.join() === 'Visa' && tk.lens === 'brand' && B.lakeRoundTrack(tracks, { r1: { n7: 2 }, v1: { n7: 5 } }, new Set(['track:v1']), 'finance-fintech').key === 'track:r1' && B.lakeRoundTrack(tracks, {}, new Set(), 'betting') === null,
  'F2 failing a theme, the territory\'s loudest tracked brand by its sector, in the board\'s own track shape; never one on tonight\'s board');
KV = {}; calls = []; TRACKS = tracks; NIGHT = '2026-11-01';
DB = { 'door_reads?status=eq.ready': [{ night: '2026-10-31', territory: 'fashion-beauty' }, { night: '2026-10-30', territory: 'music' }],
  'subject_weeks?kind=eq.territory': [{ subject_key: 'territory:finance-fintech', counts: { n: 30 } }, { subject_key: 'territory:betting', counts: { n: 12 } }, { subject_key: 'territory:fashion-beauty', counts: { n: 900 } }, { subject_key: 'territory:music', counts: { n: 400 } }],
  'signals?territory=eq.finance-fintech': rows.map(r => Object.assign({}, r, { captured_at: new Date(Date.now() - (now - Date.parse(r.captured_at))).toISOString() })), 'signals?territory=eq.betting': [] };
const pick = await B.lakeRoundPick(env, '2026-11-01', [{ key: 'theme:C3' }]);
const asked = calls.map(c => c.path);
ok(pick.cand && pick.cand.key === 'theme:C2' && pick.cand.round.territory === 'finance-fintech' && pick.cand.round.name === 'Finance' && pick.cand.round.why === 'no_recent_reading' && pick.cand.lens === 'market' && pick.cand.territories.join() === 'finance-fintech'
  && /^door_reads\?status=eq\.ready&night=gte\.2026-08-03&select=night,territory:meta->>territory/.test(asked[0]) && /^subject_weeks\?kind=eq\.territory&week=gte\./.test(asked[1]) && /^signals\?territory=eq\.finance-fintech&research=is\.false&status=neq\.rejected/.test(asked[2]),
  'F3 the pick: the record\'s tagged readings, the memory\'s counts, then the first territory in line (finance, never read, thirty lines) and its loudest theme not on tonight\'s board');
KV['round:v1'] = JSON.stringify({ territories: {}, tonight: { night: '2026-11-01', cand: pick.cand } }); calls = [];
const again = await B.lakeRoundPick(env, '2026-11-01', []);
ok(again.again === true && again.cand.key === 'theme:C2' && calls.length === 0, 'F4 a second pass the same night reads tonight\'s round again, asking nothing (the stamp then keeps the read)');
KV = { 'tracks:stats': JSON.stringify({ stats: { v1: { n7: 5 }, r1: { n7: 2 } } }) }; calls = [];
DB['signals?territory=eq.finance-fintech'] = [];
const fb = await B.lakeRoundPick(env, '2026-11-01', []);
ok(fb.cand && fb.cand.key === 'track:v1' && fb.cand.round.territory === 'finance-fintech' && fb.tried[0].found === 'track', 'F5 a territory with no theme to read is read through its loudest tracked brand');
TRACKS = [];
const none2 = await B.lakeRoundPick(env, '2026-11-01', []);
ok(none2.cand === null && none2.order.length === 4 && none2.tried.length === B.LAKE.ROUND.TRIES && none2.tried.every(t => t.found === null), 'F6 nothing to read in any territory in line: no round tonight, TRIES at most asked');

// ── G: the round in the pass ───────────────────────────────────────────────────────────────────────────────────────────────
const dp = between(w, 'async function doorPass(env, opts) {', 'async function doorLand(');
ok(/  if \(!cands\.length\) return out;\n  const round = typeof lakeRoundPick === 'function' \? await lakeRoundPick\(env, night, cands\)\.catch\(excQuiet\('lake_round', null\)\) : null;/.test(dp) && /  if \(round && round\.cand\) cands\.push\(round\.cand\);/.test(dp)
  && dp.indexOf('cands.push(round.cand)') < dp.indexOf('const memo = ') && dp.indexOf('cands.push(round.cand)') > dp.indexOf('out.candidates = cands.length;'),
  'G1 the round is picked before the pass reads its subjects, so it is framed, gathered, quoted, measured and stamped as every subject is; the board\'s count stays the board\'s');
ok(/base\.meta\.territory = lakeRowTerritory\(cand, ev\.merged\); if \(cand\.round\) base\.meta\.round = cand\.round;/.test(dp) && /rail: 'lake', sid: r\.id, territory: r\.territory \|\| null, similarity: 0\.9 \};/.test(w),
  'G2 every row the door writes carries its territory (its lake lines keep theirs), and the round\'s row its reason');
ok(/if \(ev\.merged\.length < DOOR\.MIN_EVIDENCE\) \{ out\.thin\+\+;/.test(dp) && /if \(prev && prev\.stamp === stamp && prev\.read\) \{ out\.reused\+\+;/.test(dp) && /if \(prev && prev\.read && size === 0 && !cand\.round\) \{ out\.reused\+\+;/.test(dp)
  && dp.indexOf('if (ev.merged.length < DOOR.MIN_EVIDENCE)') < dp.indexOf('prev.stamp === stamp && prev.read') && dp.indexOf('prev.stamp === stamp && prev.read') < dp.indexOf('size === 0 && !cand.round'),
  'G3 the round keeps the evidence floor and the stamp rule (the same evidence is reused, nothing spent) and reads past the movement threshold alone');
ok(/prev, size, round: !!cand\.round, system:/.test(dp) && /  const roundJobs = jobs\.filter\(j => j\.round\); jobs = jobs\.filter\(j => !j\.round\);/.test(dp) && dp.indexOf('const roundJobs') < dp.indexOf('jobs.sort((a, b) =>')
  && /  out\.earned = jobs\.length; out\.cap = DOOR_LAW\.CAP;\n  if \(roundJobs\.length\) \{ roundJobs\.forEach\(j => \{ j\.base\.meta\.move = \{ rank: null, size: null \}; \}\); jobs = jobs\.concat\(roundJobs\.slice\(0, LAKE\.ROUND\.MAX\)\); \}/.test(dp) && B.LAKE.ROUND.MAX === 1,
  'G4 the seventh: set apart before the six are ranked and capped, never ranked (so never the default lead), joined after the cap, one a night; the pass still reports earned and cap as the six');
ok(dp.indexOf('jobs = jobs.concat(roundJobs') < dp.indexOf("claudeBatchSubmit(env, 'live', 'door_read', items)") && /open = \(await claudeSpent\(env, EXC_MODEL\.TIER\)\) < claudeCap\(env, EXC_MODEL\.TIER\) \* EXC_MODEL\.OVERNIGHT_SHARE;/.test(dp)
  && /out\.round = await lakeRoundNote\(env, night, round, lakeRoundOutcome\(round\.cand\.key, rowsOut, jobs, out\.queued, tonightBy\)\)/.test(dp),
  'G5 the round rides the night\'s one batch, under the overnight share of the cap like every door read, counted in the batch\'s estimate; what became of it is noted for the rotation');
const tb = new Map([['theme:K', {}]]);
ok(B.lakeRoundOutcome('theme:X', [], [{ round: true, base: { frame_key: 'theme:X' } }], 1) === 'queued' && B.lakeRoundOutcome('theme:X', [], [{ round: true, base: { frame_key: 'theme:X' } }], 0) === 'failed'
  && B.lakeRoundOutcome('theme:X', [{ frame_key: 'theme:X', status: 'reused' }], [], 0) === 'reused' && B.lakeRoundOutcome('theme:X', [{ frame_key: 'theme:X', status: 'failed', error: 'thin_evidence' }], [], 0) === 'thin'
  && B.lakeRoundOutcome('theme:K', [], [], 0, tb) === 'kept' && B.lakeRoundOutcome('theme:Z', [], [], 0, tb) === 'error', 'G6 the outcome: queued, failed with the batch, reused, thin, kept from earlier tonight, or an error');
KV = {};
const note = await B.lakeRoundNote(env, '2026-11-01', { cand: pick.cand, tried: [{ territory: 'finance-fintech', found: 'theme' }] }, 'queued');
const led = JSON.parse(KV['round:v1']);
ok(note.outcome === 'queued' && note.territory === 'finance-fintech' && led.territories['finance-fintech'].night === '2026-11-01' && led.tonight.key === 'theme:C2' && led.tonight.q === pick.cand.query && (await B.lakeRoundTonight(env)).key === 'theme:C2',
  'G7 the ledger keeps the round\'s try for the rotation, and tonight\'s subject for the sweep');
NIGHT = '2026-11-02';
ok((await B.lakeRoundTonight(env)) === null, 'G8 last night\'s round is not tonight\'s');
NIGHT = '2026-11-01';
const rerun = await B.lakeRoundNote(env, '2026-11-01', { cand: pick.cand, again: true }, 'kept');
ok(rerun.outcome === 'queued' && JSON.parse(KV['round:v1']).territories['finance-fintech'].outcome === 'queued', 'G8b a rerun the same night that finds tonight\'s read standing leaves the night\'s record as it was');
NIGHT = '2026-11-01';
const sw = between(w, 'async function boardSweep(env) {', 'async function doorSet(env) {');
ok(/const rt = typeof lakeRoundTonight === 'function' \? await lakeRoundTonight\(env\)\.catch\(excQuiet\('sweep_round', null\)\) : null;/.test(sw) && /if \(rt && rt\.q\) subs\.unshift\(\{ key: rt\.key, kind: rt\.kind, query: rt\.q, title: rt\.title \}\);/.test(sw)
  && sw.indexOf('subs.unshift') < sw.indexOf('for (const s of subs)'), 'G9 the board sweep gives the round\'s subject its first research slot that night (on the free rails, as every board subject)');

// ── H: the pull ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const seed = [{ name: 'McCormick', aliases: ['McCormick & Company'], context: ['spice', 'seasoning'] }, { name: 'Spiceology' }, 'Diaspora Co'];
const items = B.lakePullItems({ key: 'cat:seasonings', category: 'seasonings and spice blends' }, [{ id: 'm1', name: 'McCormick' }, { id: 'm2', name: 'Spiceology' }, { id: 'm3', name: 'Diaspora Co' }, { name: 'no id' }], seed, 'packaged-goods-beverage');
ok(items.length === 3 && items[0].q === 'McCormick spice' && items[0].aliases.join() === 'McCormick & Company' && items[1].q === 'Spiceology' && items.every(i => i.territory === 'packaged-goods-beverage' && i.space === 'cat:seasonings'),
  'H1 each member is queued by its name, with its first context word when it is a word in ordinary use; a member with no entity is not');
const fr = B.lakePullFrame(items[0]);
ok(fr.entity === 'McCormick' && fr.anchors.join() === 'mccormick,mccormick & company' && fr.queries.news === 'McCormick spice' && fr.task === 'read', 'H2 the frame is the house\'s, whole (entity and anchors), so the gather reads it as a brand and asks no model for one');
const trig = fs.readFileSync('supabase/migrations/0038_sweep_ledger.sql', 'utf-8'), re = /new\.momentum->>'provenance', ''\) ~ '([^']+)'/.exec(trig);
ok(re && new RegExp(re[1]).test(B.LAKE.PULL.PROVENANCE) && B.LAKE.PULL.PROVENANCE === 'recon_set', 'H3 the pull\'s provenance is one 0038\'s trigger marks research: evidence a reading may cite, never a count');
KV = {};
const q1 = await B.lakePullQueue(env, { key: 'cat:seasonings', category: 'seasonings and spice blends' }, [{ id: 'm1', name: 'McCormick' }, { id: 'm2', name: 'Spiceology' }], seed);
const q2 = await B.lakePullQueue(env, { key: 'cat:seasonings', category: 'seasonings and spice blends' }, [{ id: 'm1', name: 'McCormick' }, { id: 'm2', name: 'Spiceology' }], seed);
ok(q1.queued === 2 && q1.territory === 'packaged-goods-beverage' && q2.queued === 0 && q2.already === 2 && q2.waiting === 2, 'H4 the seed queues each member once; a second seed queues nothing new');
gathered = []; capturedRows = []; logged = [];
const st = await B.lakePullStep(env, 60000);
ok(st.pulled === 2 && st.left === 0 && gathered.length === 2 && gathered.every(x => x.opts.skip === BOARD_SWEEP.SKIP && x.opts.frame && x.opts.frame.anchors.length) && capturedRows.every(c => c.prov.provenance === 'recon_set' && c.prov.territory === 'packaged-goods-beverage')
  && logged.length === 1 && logged[0][3] === 'lake_pull', 'H5 a step gathers each member on the free rails (the board sweep\'s skips) with the house\'s frame and captures the rows as research, placed in the category\'s territory');
const q3 = await B.lakePullQueue(env, { key: 'cat:seasonings', category: 'seasonings and spice blends' }, [{ id: 'm1', name: 'McCormick' }], seed), q4 = await B.lakePullQueue(env, { key: 'cat:seasonings', category: 'seasonings and spice blends' }, [{ id: 'm1', name: 'McCormick' }], seed, true);
gathered = [];
ok(q3.queued === 0 && q4.queued === 1, 'H6 a member pulled within thirty days is not pulled again unless the house asks again');
await B.lakePullStep(env, 60000); KV = {}; calls = [];
ok((await B.lakePullStep(env, 60000)) === null && calls.length === 0, 'H7 with nothing waiting, a slice\'s step reads one key and returns');
const failingGather = new Function('DAILY_POV', 'INDUSTRY_NAMES', 'LENS_OF_TERRITORY', 'SPACES', 'DOOR', 'BOARD_SWEEP', 'FEED', 'LEDGER', 'sbRest', 'excQuiet', 'loadTracks', 'doorNight', 'doorCandidates', 'gatherOpenSignals', 'lakeCapture', 'logEvent',
  blockSrc + '; return { lakePullQueue, lakePullStep, lakePullLoad };')(DAILY_POV, INDUSTRY_NAMES, LENS_OF_TERRITORY, SPACES, DOOR, BOARD_SWEEP, {}, { TABLE: 'subject_weeks' }, fakeSb, quiet, async () => [], () => NIGHT, async () => [], async () => ({ ok: false }), fakeCapture, async () => {});
await failingGather.lakePullQueue(env, { key: 'k', category: 'betting' }, [{ id: 'f1', name: 'Failing Book' }], []);
for (let i = 0; i < 4; i++) await failingGather.lakePullStep(env, 60000);
ok((await failingGather.lakePullLoad(env)).items.length === 0 && !((await failingGather.lakePullLoad(env)).done.f1), 'H8 a member whose gather fails is tried again on later slices, three times in all, then let go (never marked pulled)');
DB = { 'spaces?kind=eq.category&held_by=eq.house&status=eq.active': [{ key: 'cat:smart-glasses', name: 'Smart glasses', category: 'smart glasses', frame: {} }] };
ok((await B.lakePullDesk(env, { category: 'nothing held' })).error === 'no_category' && (await B.lakePullDesk(env, { category: 'smart glasses' })).error === 'no_members', 'H9 the desk\'s pull names a held category or says it holds none; a category with no set is told to seed it first');
ok(/if \(typeof lakePullQueue === 'function'\) out\.pull = \(out\.pull \|\| \[\]\)\.concat\(\[await lakePullQueue\(env, \{ key: r\.key, name: r\.name, category: r\.name \}, got\.members, h\.members\)/.test(w)
  && /\.then\(\(\) => \(typeof lakePullStep === 'function' \? lakePullStep\(env, LAKE\.PULL\.SLICE_MS\) : null\)\)/.test(w) && w.indexOf('lakePullStep(env, LAKE.PULL.SLICE_MS)') < w.indexOf(".then(() => themePass(env, 1, THEME.DRAIN_BATCH))") && w.indexOf('lakePullStep(env, LAKE.PULL.SLICE_MS)') < w.indexOf('.then(() => entityResolvePass(env))')
  && /which === 'pull' \? await lakePullDesk\(env, body\) : which === 'round' \? await lakeRoundPreview\(env\) :/.test(w),
  'H10 the seed queues the pull; each half-hour slice takes a step before the resolver links the new rows; the desk can pull a held category and preview the round');

// ── I: the surfaces ────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/round: r\.meta && r\.meta\.round && r\.meta\.round\.territory \? \{ territory: String\(r\.meta\.round\.territory\)\.slice\(0, 40\), name: String\(r\.meta\.round\.name \|\| r\.meta\.round\.territory\)\.slice\(0, 60\), last_read: r\.meta\.round\.last_read \|\| null \} : null,/.test(w)
  && /\(r\.round \? '<small class="hs-round">the round: ' \+ esc\(r\.round\.name\) \+ \(r\.round\.last_read \? ", last read " \+ esc\(String\(r\.round\.last_read\)\) : ", no recent reading"\) \+ "<\/small>" : ""\)/.test(readPage),
  'I1 THE NIGHTS: a round\'s row says so, with its territory and when the record last read it');
const gt = Object.fromEntries(T.map(t => [t, { sources: gate(t).n, tiers: [1, 2], under: false }])), rep = B.lakeAddedReport(gt, [{ by_territory: { 'finance-fintech': 4 } }, { by_territory: { 'finance-fintech': 3, betting: 1 } }]);
ok(rep.length === 7 && rep[0].name === 'Finance' && rep[0].captured === 7 && rep[6].captured === 1 && /return \{ sources: DAILY_POV\.sources\.length, lanes: Object\.keys\(DAILY_POV\.lanes \|\| \{\}\)\.length, gate_under: under, gate, dead, never_tried: never, yield: days, today, added, pacing \};/.test(w),
  'I2 the intake desk shows the seven, their gate and what each captured, the pacing and the aim lanes');

// ── K: DAILY's paper ───────────────────────────────────────────────────────────────────────────────────────────────────────
const paperFn = new Function('LAKE', between(blockSrc, 'function lakePaperOut() {', '\n// PURE: the territory a sector') + '; return lakePaperOut;');
const compose = between(w, 'async function composeFromLake(env, today) {', 'async function spineAdvance(');
ok(paperFn(B.LAKE)() === '&territory=not.in.(' + B.LAKE.ADDED.join(',') + ')' && paperFn({ PAPER_OUT: [] })() === '' && JSON.stringify(B.LAKE.PAPER_OUT) === JSON.stringify(B.LAKE.ADDED)
  && /`signals\?status=in\.\(connected,filtered\)&captured_at=gte\.\$\{since\}` \+ sw \+ \(typeof lakePaperOut === 'function' \? lakePaperOut\(\) : ''\) \+/.test(compose) && DAILY_POV.edition.quotas.guaranteed_groups.every(g => g.every(t => OLD20.includes(t))),
  'K1 DAILY\'s paper keeps its twenty: its pool leaves the seven out (one line opens one), its guaranteed groups are the twenty\'s; the lake keeps every row');

// ── J: the house's laws ────────────────────────────────────────────────────────────────────────────────────────────────────
const SPM = /env\.AI\.run\(|env\.AI\.toMarkdown\(|callModel\(|callClaude\(|claudeBatchSubmit\(|queue\.fal\.run|api\.perplexity\.ai|api\.exa\.ai|api\.tavily\.com|CLAUDE\.API \+/;
ok(!SPM.test(blockSrc) && !/[—–]/.test(blockSrc) && !/catch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(blockSrc) && !/\.catch\(\(\) => (?:\{\}|null|undefined|\[\]|''|false)\)/.test(blockSrc),
  'J1 the block asks no model and no paid rail, carries no dash and swallows no error');
ok(seams.registry['SEAM:BREADTH'] && seams.registry['SEAM:BREADTH'].file === 'worker/src/index.js' && seams.registry['SEAM:BREADTH@read'] && seams.registry['SEAM:BREADTH@read'].tag === 'SEAM:BREADTH', 'J2 SEAM:BREADTH is registered, the worker and READ');

console.log(`\nproof_breadth: ${pass} checks PASS`);
