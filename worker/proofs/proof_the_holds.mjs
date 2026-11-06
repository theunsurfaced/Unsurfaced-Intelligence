/**
 * proof_the_holds.mjs  --  IQ2d THE HOLDS: SEAM:THE_HOLDS. What the dry run and the record pass of Nov 6 showed, fixed in the code that
 * decides: the house's own words off a read, a dek that names the measure rescued from a finding's fact, a long takeaway cut to its first
 * sentence, the dry run in lanes with one retry, the pass page showing the carried bet and the held readings. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8')).registry;
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const hush = async fn => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };

// ── the pure parts, as the proof of the lens builds them, plus the rescue ─────────────────────────────────────────────────────────
const measureSrc = between(w, 'function excMeasureLine(m) {', '/* PURE: the lines of a compiled reading that name the measure') + between(w, 'function excMeasureClaims(read) {', '\n}\n') + '\n}\n';
const rescueSrc = between(w, 'function excMeasureRescue(read, named) {', '\n}\n') + '\n}\n';
const groundSrc = between(w, 'const EXC_MONTH = ', 'function excGround(') + between(w, 'function excGround(text, evidence) {', '/* SEAM:EXC_FRAME: a query is turned');
const compileSrc = between(w, 'function excLensParts(parsed, merged, pool, read, names) {', '/* SEAM:TERRITORIES (EX39)');
const C = new Function('excBand', 'excWhen', 'excEarned', 'excTier', 'excClip', 'excShort', 'doorWatchOf', 'excWindow',
  measureSrc + rescueSrc + groundSrc + compileSrc + '; return { doorCompileRead, excLensParts, excHouseWord, excMeasureClaim, excMeasureClaims, excMeasureRescue };')(
  () => 'NOW', c => (c && c.published_at ? new Date(c.published_at) : null), () => 'Medium', () => 2, (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n), v => String(v || ''), x => (x && x.claim ? { claim: x.claim, by: x.by || null } : null), () => ({}));

// ── A: the house's words, the measure's line, the rescue ──────────────────────────────────────────────────────────────────────────
ok(C.excHouseWord('This signals a shift to optical retail') && C.excHouseWord('Mentions fell, per the lake') && C.excHouseWord('a signal of intent') && C.excHouseWord('what the move signaled') && C.excHouseWord('Signaling to rivals')
  && !C.excHouseWord('the house of Dior dressed the squad') && !C.excHouseWord('new signage in the store') && !C.excHouseWord('Lake Tahoe retreat') && !C.excHouseWord('an early signal of the turn') && !C.excHouseWord('a walk in the Lake District') && !C.excHouseWord('the lake house sold') && !C.excHouseWord(''),
  'A1 excHouseWord: signal in every form and the lake; not a fashion house, not signage, not a lake with a name, not the house\'s own "early signal"');
const named = C.excMeasureClaims({ read: ['Buyers learn about new glasses from an earnings call', 'Warby Parker leaked the launch as signals fell 67% week over week, per the lake.'], insights: [{ title: 'clean' }], ideas: [] });
ok(named.length === 1 && named[0].where === 'read' && named[0].line === 1 && C.excMeasureClaims({ read: ['Signals fell this week', 'dek'], insights: [], ideas: [] })[0].line === 0,
  'A2 excMeasureClaims names the line a claim sits on (the headline is 0, the dek 1)');
const mk = () => ({ read: ['Tech buyers learn about new smart glasses from an earnings call', 'Warby Parker leaked the launch as signals fell 67% week over week, per the lake.'],
  insights: [{ title: 'The debut', excerpt: 'Warby Parker hinted the glasses launch within a week.' }, { title: 'The price', excerpt: 'Xreal\'s Aura starts at $1,279 on Qualcomm\'s chip, shipping first in the US.' }, { title: 'Trust', excerpt: 'One tester published a hands-on with the glasses.' }], ideas: [] });
const r1 = mk(), n1 = C.excMeasureClaims(r1);
ok(C.excMeasureRescue(r1, n1) === true && r1.read[0] === 'Tech buyers learn about new smart glasses from an earnings call' && r1.read[1] === 'Xreal\'s Aura starts at $1,279 on Qualcomm\'s chip, shipping first in the US.' && r1.dek_from === 'finding 2' && C.excMeasureClaims(r1).length === 0,
  'A3 a claim in the dek alone: the headline stays, the dek becomes the first finding\'s fact that carries a figure and no claim, the read says which, and nothing names the measure any more');
const r2 = mk(); r2.read[0] = 'Signals fell 67% this week'; const n2 = C.excMeasureClaims(r2);
const r3 = mk(); r3.insights = r3.insights.map(x => Object.assign({}, x, { excerpt: x.excerpt.replace(/\d/g, '') })); const n3 = C.excMeasureClaims(r3);
const r4 = mk(); r4.insights[0].title = 'The signal count is flat'; const n4 = C.excMeasureClaims(r4);
const r5 = mk(); r5.insights[1].excerpt = 'Coverage reads 12 signals this week per the lake'; r5.insights[2].excerpt = 'The signal count hit 12'; const n5 = C.excMeasureClaims(r5);
const r6 = mk(); r6.insights[1].checks = { ungrounded: ['$1,279'] }; r6.insights[2].excerpt = 'One tester published a hands-on with 3 pairs.'; r6.insights[2].checks = { ungrounded: [] }; const n6 = C.excMeasureClaims(r6);
ok(C.excMeasureRescue(r2, n2) === false && r2.read[0] === 'Signals fell 67% this week' && !r2.dek_from && C.excMeasureRescue(r3, n3) === false && !r3.dek_from && C.excMeasureRescue(r4, n4) === false && C.excMeasureRescue(r5, n5) === false && C.excMeasureRescue(null, n1) === false && C.excMeasureRescue(mk(), []) === false,
  'A4 no rescue when the claim is the headline, when a finding names the measure too, when no fact carries a figure, when the only facts with figures are claims themselves, or when nothing is named: the hold stands');
ok(C.excMeasureRescue(r6, n6) === true && r6.dek_from === 'finding 3' && r6.read[1] === 'One tester published a hands-on with 3 pairs.',
  'A5 a fact whose figure the lines do not carry (its checks name it ungrounded) is never the dek; the next fact that carries its figure is');

// ── B: the takeaway's length, the house's words on a takeaway, a pushback, a read ─────────────────────────────────────────────────
const lines = [
  { title: 'Costco raises its fee', text: 'Costco raised the Gold Star fee to $65 on September 1 and renewals held at 92%.', source: 'WWD', url: 'https://wwd.example/a', published_at: '2026-10-30' },
  { title: 'Gold bars sell out', text: 'Costco sold out of one-ounce gold bars within hours, Reuters reported; members bought up to $100 million a month.', source: 'Reuters', url: 'https://reuters.example/b', published_at: '2026-10-29' },
  { title: 'The counter view', text: 'Sam\'s Club undercut the fee at $50 and said its renewals rose.', source: 'Bloomberg', url: 'https://bloomberg.example/c', published_at: '2026-10-28' }
];
const read2 = ['Members treat the Costco card like a savings account.', 'Renewals held at 92% after the fee rose, per WWD.'];
const LP = (t, pb) => C.excLensParts({ takeaway: t, pushback: pb || null, level: 'brand', lens: [] }, lines, [], read2, ['Costco']);
const long34 = 'For luxury marketers, the repeated-athlete playbook has one visible operator right now: the house holds both the locker room and the front row, unanswered by its rivals in this evidence this season.';
const twoSent = 'Sam\'s Club cannot win renewal season on the price of the card. The card has to say something about who holds it, and renewal season is when that gets tested, which is a long second sentence that runs past the limit.';
const oneLong = 'Sam\'s Club cannot win renewal season on the price of the card because the card has to say something about who holds it and renewal season is when that gets tested by every member.';
ok(long34.split(' ').length > 28 && LP(long34).takeaway === null && LP(twoSent).takeaway === 'Sam\'s Club cannot win renewal season on the price of the card.' && LP(oneLong).takeaway === null && LP('Sam\'s Club cannot win renewal season on the price of the card.').takeaway === 'Sam\'s Club cannot win renewal season on the price of the card.',
  'B1 a takeaway past 28 words keeps its first sentence when that is a sentence of 8 words or more; one long sentence comes off; one under the limit stands');
ok(LP('Short. Then a second sentence that is long enough to count as a sentence on its own, running well past the twenty-eight word limit of the takeaway law here.').takeaway === null,
  'B2 a first sentence under 8 words is not a takeaway: it comes off rather than standing as a fragment');
const abbrev = 'Sam\'s Club, ranked No. 2 behind Costco Inc. in the U.S. warehouse trade, cannot win renewal season on the price of the card. The card has to say something about who holds it, and renewal season is when that gets tested by every member.';
ok(abbrev.split(' ').length > 28 && LP(abbrev).takeaway === 'Sam\'s Club, ranked No. 2 behind Costco Inc. in the U.S. warehouse trade, cannot win renewal season on the price of the card.',
  'B2b a sentence ends where a sentence does: an abbreviation (No., Inc., U.S.) never cuts the first sentence short');
ok(LP('This signals that Sam\'s Club cannot win renewal season on the price of the card.').takeaway === null && LP('The card has to say something about who holds it, per the lake.').takeaway === null
  && LP('Sam\'s Club cannot win on price.', { line: 3, text: 'Bloomberg says a signal of rising renewals at Sam\'s Club argues the other way.' }).pushback === null && LP('Sam\'s Club cannot win on price.', { line: 3, text: 'Bloomberg says Sam\'s Club\'s renewals rose after it undercut the fee.' }).pushback.line === 3,
  'B3 a takeaway or a pushback in the house\'s own words comes off; a clean pushback on a line of the evidence stands');
const parsed = { level: 'brand', lens: [], read: read2, takeaway: 'Sam\'s Club cannot win renewal season on the price of the card.',
  insights: [
    { category: 'brand', title: 'Members paid more and kept buying', fact: 'Renewals held at 92% after the fee rose to $65.', read: 'The fee is a test of trust the members passed, so the next adjacent move is permitted.', evidence: [1] },
    { category: 'consumer', title: 'Gold as a savings habit', fact: 'Members bought up to $100 million of gold bars a month.', read: 'This signals the card has become a savings account for its members.', evidence: [2] },
    { category: 'market', title: 'Sam\'s Club undercuts', fact: 'Sam\'s Club undercut the fee at $50.', read: 'Price is the lever the rival pulls, per the lake, and it is not the one that decides renewals.', evidence: [3] }
  ], ideas: [{ type: 'Strategy', for: 'Costco', headline: 'Hold the fee', body: 'Keep the fee at $65 through renewal season.', evidence: [1] }], brief: 'Hold.', watch: { claim: 'Renewals stay above 90% through March', by: '2027-03-01' } };
const c1 = C.doorCompileRead(JSON.parse(JSON.stringify(parsed)), lines, { entity: 'Costco' }, null, '2026-11-06');
ok(c1.insights.length === 3 && c1.insights[0].implication && c1.insights[1].implication === null && c1.insights[2].implication === null && c1.insights[1].excerpt === 'Members bought up to $100 million of gold bars a month.' && c1.takeaway === parsed.takeaway,
  'B4 a finding whose read is in the house\'s words keeps its fact and loses its read; the clean read and the takeaway stand');

// ── C: the holds, where they are decided ──────────────────────────────────────────────────────────────────────────────────────────
const land = between(w, 'async function doorLand(', 'async function doorPublish(');
const passLand = between(w, 'async function recordPassLand(', 'async function recordPassAfter(');
const spaceLandSrc = between(w, 'async function spaceLand(', '\n}\n');
const rescueLine = /const rescued = named\.length && typeof excMeasureRescue === 'function' \? excMeasureRescue\(read, named\) : false;/;
ok(rescueLine.test(land) && /if \(named\.length && !rescued\) \{ await sbRest\(env, 'door_reads\?id=eq\.' \+ id/.test(land) && land.indexOf('const named = typeof excMeasureClaims') < land.indexOf('const rescued =') && land.indexOf('const rescued =') < land.indexOf("status: 'ready', read, cost_usd: cost, error: null"),
  'C1 the night: after the measure\'s claims are named, the dek is rescued where it can be, and the hold is only for what is not rescued, before the reading is ready');
ok(rescueLine.test(passLand) && /if \(named\.length && !rescued\) return keep\('measure_claim: ' \+ named\[0\]\.where \+ \(named\[0\]\.where === 'read' \? \(named\[0\]\.line === 1 \? ' \(dek\)' : ' \(headline\)'\) : ''\)\);/.test(passLand), 'C2 the pass: the same rescue, the same hold, its reason naming the line');
ok(rescueLine.test(spaceLandSrc) && /if \(named\.length && !rescued\) \{ await sbRest\(env, 'space_reads\?id=eq\.' \+ id/.test(spaceLandSrc), 'C3 a private space: the same rescue, the same hold');
// the pass's landing, run: a dek that names the measure lands with a finding's fact as its dek
const passSrc = between(w, 'const RECORD_PASS = ', 'async function doorFail(');
const T = { rows: [], patches: [], published: 0, events: [], claims: [] };
const sbRest = async (e, path, opts) => {
  if (/^door_reads\?status=eq\.ready/.test(path)) return T.rows.map(r => JSON.parse(JSON.stringify(r)));
  if (/^door_reads\?frame_key=eq\./.test(path)) return [];
  if (/^door_reads\?id=eq\./.test(path) && opts && opts.method === 'PATCH') { const id = path.match(/id=eq\.([^&]+)/)[1]; const row = T.rows.find(r => r.id === id); if (row) Object.assign(row, opts.body); T.patches.push({ id, body: opts.body }); return []; }
  return [];
};
const env = { DESK_API_KEY: 'desk-secret', RATE_LIMIT: { delete: async () => {}, put: async () => {}, get: async () => null } };
const R = new Function('DOOR', 'DOOR_LAW', 'RECORD', 'sbRest', 'excQuiet', 'json', 'authenticate', 'callerIsAdmin', 'claudeBatchDrain', 'claudeBatchSubmit', 'excLine', 'excDoorPrompt', 'doorPeopleBlock', 'doorCompileRead', 'excVoiceNotes', 'doorPublish', 'logEvent', 'claimsWrite', 'claimsOf', 'doorPeople',
  measureSrc + rescueSrc + passSrc + '; return { recordPassLand, recordPassStatus, recordPassHeld, recordPassPage, recordPassRoute, recordPassMerge, recordPassState };')(
  { VOICE: '6.0', MAX_TOKENS: 16000 }, { PEOPLE: 8 }, { KEY: 'record:v1', SINCE: '2026-10-08' }, sbRest, (where, v) => e => v, (d, s) => ({ status: s, body: d }), async () => null, async () => false, async () => ({ done: 0 }), async () => ({ ok: true, batch_id: 'b1', n: 0 }),
  (c, i) => '[' + (i + 1) + '] ' + c.title, () => 'PROMPT', () => '', C.doorCompileRead, read => ({ notes: [] }), async () => { T.published++; }, async (e, p, s, ev, sid, meta) => T.events.push({ ev, meta }), async (e, rows) => T.claims.push(rows), () => [], m => (m && m.voices) || []);
const oldRead = { read: ['Costco quiet this month', 'Coverage held at seven stories.'], insights: [{ title: 'old one', excerpt: 'x' }, { title: 'old two', excerpt: 'y' }], ideas: [], brief: 'old', watch: { claim: 'Renewals stay above 90% through March', by: '2027-03-01' } };
const freshRow = id => ({ id, frame_key: 'brand:costco', night: '2026-11-04', status: 'ready', frame: { entity: 'Costco', category: 'retail' }, measures: null, read: JSON.parse(JSON.stringify(oldRead)), evidence: lines.map(l => Object.assign({ tier: 1 }, l)), meta: { voices: [] }, stamp: 'v5.0~s1#2026-10-30', cost_usd: 0.1 });
T.rows = [freshRow('a1')];
const measuredDek = JSON.parse(JSON.stringify(parsed)); measuredDek.read = ['Members treat the Costco card like a savings account.', 'Coverage held at seven stories as signals fell, per the lake.'];
const landed = await hush(() => R.recordPassLand(env, T.rows[0], { read: measuredDek }, 0.05, 'end_turn', { preview: false, voice: '6.0' }, lines));
ok(landed.status === 'landed' && T.rows[0].read.read[0] === 'Members treat the Costco card like a savings account.' && T.rows[0].read.read[1] === 'Renewals held at 92% after the fee rose to $65.' && T.rows[0].read.dek_from === 'finding 1' && T.rows[0].read.watch.claim === 'Renewals stay above 90% through March' && T.rows[0].meta.pass.status === 'landed',
  'C4 run: a new read whose dek names the measure lands with the first finding\'s figure as its dek, the bet carried, the row marked landed, not kept');
const measuredHead = JSON.parse(JSON.stringify(parsed)); measuredHead.read = ['Signals fell 67% this week', 'dek'];
T.rows = [freshRow('a2')];
const kept = await hush(() => R.recordPassLand(env, T.rows[0], { read: measuredHead }, 0.05, 'end_turn', { preview: false, voice: '6.0' }, lines));
ok(kept.status === 'kept' && kept.why === 'measure_claim: read (headline)' && T.rows[0].read.read[0] === 'Costco quiet this month', 'C5 run: a claim in the headline is still held, the reason naming the line; the old read stands');

// ── D: the dry run in lanes, one retry ────────────────────────────────────────────────────────────────────────────────────────────
const tb = between(w, '/* ═══ SEAM:TAKEAWAY_TEST', '/* ═══ end SEAM:TAKEAWAY_TEST ═══ */');
const K = (/const TAKEAWAY_TEST = (\{[\s\S]*?\});\n\/\/ PURE/.exec(tb) || [])[1];
const fnChecks = (/(function takeawayChecks[\s\S]*?\n\})\nasync function takeawayTest/.exec(tb) || [])[1];
const fnRun = (/(async function takeawayTest[\s\S]*\n\})\s*$/.exec(tb) || [])[1];
ok(K && /LANES: 3, RETRY_MS: 1500/.test(K) && /const lanes = Math\.max\(1, TAKEAWAY_TEST\.LANES \|\| 3\)/.test(fnRun) && /rows\.slice\(i, i \+ lanes\)/.test(fnRun) && /\/claude_\(\?:network\|429\|5\\d\\d\)\|network\|fetch\|timeout\/i/.test(fnRun) && !/Promise\.all\(rows\.map\(one\)\)/.test(fnRun),
  'D1 the dry run writes LANES readings at a time (three), and a call the network dropped, timed out, or answered 429 or 5xx is tried once more after RETRY_MS');
const calls = [], asked = [];
const ROWS = [1, 2, 3, 4].map(i => ({ id: 'r' + i, frame_key: 'track:' + i, night: '2026-11-02', frame: { entity: 'Costco', category: 'warehouse retail' }, measures: {}, evidence: [{ title: 'Gas lines grow', text: 'Members queue for fuel.', source: 'Outlet', published_at: '2026-11-01' }], read: { read: ['A', 'B'] }, meta: {} }));
const sb2 = async (e, path) => { calls.push(path); return ROWS; };
let flaky = 0;
const callClaude = async (env2, tier, req) => { asked.push(req.meta.reading); if (req.meta.reading === 'r2' && flaky++ === 0) return { ok: false, error: 'claude_network' }; if (req.meta.reading === 'r4') return { ok: false, error: 'claude_529' }; return { ok: true, cost_usd: 0.05, text: JSON.stringify({ level: 'brand', lens: [], read: ['Costco members renew for the fuel', 'Fuel lines led, per Outlet.'], takeaway: 'Members who renew for fuel have made the warehouse a utility, so price rises elsewhere strengthen the card.', insights: [{ title: 'one', fact: 'f1', read: 'a read', evidence: [1] }, { title: 'two', fact: 'f2 at $5', read: 'another', evidence: [1] }], watch: { claim: 'x' }, ideas: [{ headline: 'Sell the pump' }] }) }; };
const order = [];
const run = new Function('sbRest', 'excQuiet', 'logEvent', 'excLine', 'EXC_VOICE_SYS', 'EXC_MOVE_LAW', 'EXC_TIME_LAW', 'EXC_NUMBER_LAW', 'EXC_HEADLINE_LAW', 'EXC_LENS_LAW', 'excDoorPrompt', 'callClaude', 'doorPeopleBlock', 'excReadOf', 'doorCompileRead', 'excMeasureClaims', 'excMeasureRescue', 'setTimeout',
  'const TAKEAWAY_TEST = ' + K + ';\n' + fnChecks + '\n' + fnRun + '\nreturn { takeawayTest, TAKEAWAY_TEST };')(sb2, () => () => null, () => {}, (c, i) => '[' + (i + 1) + '] ' + c.title, 'V', 'M', 'T', 'N', 'H', 'L', () => 'PROMPT', callClaude, () => '', s => { try { return { read: JSON.parse(s) }; } catch (e) { return null; } },
  (p) => ({ read: p.read, takeaway: p.takeaway, level: p.level, lens: [], pushback: null, insights: (p.insights || []).map(x => ({ title: x.title, excerpt: x.fact, implication: x.read || null })), ideas: p.ideas || [], watch: p.watch || null, brief: null }), () => [], () => false, (fn, ms) => { order.push('wait ' + ms); fn(); });
const out = await run.takeawayTest({}, { n: 4 });
const r2o = out.readings.find(x => x.id === 'r2'), r4o = out.readings.find(x => x.id === 'r4');
ok(out.ok && out.n === 4 && out.written === 3 && r2o.now && r2o.retried === true && r4o.error === 'claude_529' && r4o.retried === true && asked.filter(x => x === 'r2').length === 2 && asked.filter(x => x === 'r4').length === 2 && asked.filter(x => x === 'r1').length === 1 && order.join() === 'wait 1500,wait 1500',
  'D2 run: a dropped call is tried once more after the wait and the reading is written (marked retried); one that drops twice answers with its error; a call that landed is never repeated');
ok(asked.slice(0, 3).join() === 'r1,r2,r3', 'D3 run: the first lane holds three readings; the fourth waits for the next');

// ── E: the holds on the page and in the status ────────────────────────────────────────────────────────────────────────────────────
const mkRow = (id, state, extra) => Object.assign({ id, frame_key: 'brand:' + id, night: '2026-11-0' + id.slice(1), status: 'ready', frame: { entity: 'Brand ' + id }, read: JSON.parse(JSON.stringify(oldRead)), evidence: [], stamp: 'v5.0~s1#2026-10-30', meta: { voices: [] } }, extra || {});
const rows = [
  mkRow('a1', 'previewed', { meta: { voices: [], pass: { voice: '6.0', status: 'previewed', cost_usd: 0.04 }, pass_read: { read: ['New headline', 'New dek from a fact'], dek_from: 'finding 2', takeaway: 't', insights: [{ title: 'n1', excerpt: 'f1' }, { title: 'n2', excerpt: 'f2' }], ideas: [], brief: 'b', watch: { claim: 'a new bet the writer wrote' } } } }),
  mkRow('a2', 'kept', { meta: { voices: [], pass: { voice: '6.0', status: 'kept', why: 'thin_read', at: '2026-11-06T12:00:00Z' } } }),
  mkRow('a3', 'kept', { meta: { voices: [], pass: { voice: '6.0', status: 'kept', why: 'measure_claim: read', at: '2026-11-06T12:01:00Z' } }, frame: { title: 'A theme' } }),
  mkRow('a4', 'landed', { meta: { voices: [], pass: { voice: '6.0', status: 'landed' } } }),
  mkRow('a5', 'kept', { meta: { voices: [], pass: { voice: '5.0', status: 'kept', why: 'old voice' } } })
];
const held = R.recordPassHeld(rows);
ok(held.length === 2 && held[0].id === 'a2' && held[0].subject === 'Brand a2' && held[0].why === 'thin_read' && held[0].at === '2026-11-06T12:00:00Z' && held[1].subject === 'A theme' && held[1].why === 'measure_claim: read',
  'E1 recordPassHeld: the readings held under this voice, each with its subject, its night, the check that held it and when; an older voice\'s hold does not count');
T.rows = rows;
const st = await R.recordPassStatus(env), st2 = await R.recordPassStatus(env, rows.slice(0, 2));
ok(st.readings === 5 && st.kept === 2 && st.previewed === 1 && st2.readings === 2 && st2.kept === 1, 'E2 the status reads the rows itself, or counts the rows it is handed');
const reqOf = (key, body) => ({ headers: { get: h => (h === 'x-desk-key' ? key : '') }, json: async () => body });
const stR = await R.recordPassRoute(reqOf('desk-secret', { status: true }), env, '*');
ok(stR.status === 200 && stR.body.ok && stR.body.kept === 2 && Array.isArray(stR.body.held) && stR.body.held.length === 2 && stR.body.held[1].why === 'measure_claim: read', 'E3 {status:true} answers with the held readings and why');
const html = R.recordPassPage(rows.filter(r => r.meta.pass_read), held);
ok(/THE NEW READ<\/div><h3>New headline<\/h3>/.test(html) && /The bet: Renewals stay above 90% through March \(carried\)/.test(html) && !/a new bet the writer wrote/.test(html) && /ON THE RECORD<\/div><h3>Costco quiet this month<\/h3>/.test(html) && /The bet: Renewals stay above 90% through March<\/p>/.test(html),
  'E4 the page shows on the new side the bet publish carries (the old one), never the writer\'s draft; the old side shows its bet plain');
ok(/The dek is the fact of finding 2: the writer’s dek named the measure\./.test(html), 'E5 the page says where a rescued dek came from');
ok(/<div class="k">HELD · 2<\/div>/.test(html) && /<li><b>Brand a2<\/b> · 2026-11-02 · thin_read <span class="q">a2<\/span><\/li>/.test(html) && /<b>A theme<\/b> · 2026-11-03 · measure_claim: read/.test(html) && html.indexOf('HELD') > html.indexOf('THE NEW READ') && /The night tries again as the evidence moves\./.test(html),
  'E6 the page lists the held readings after the previews: subject, night, the check, the id');
ok(!/HELD/.test(R.recordPassPage(rows.filter(r => r.meta.pass_read))) && !/HELD/.test(R.recordPassPage(rows.filter(r => r.meta.pass_read), [])), 'E7 nothing held, nothing listed; the page still takes one argument as before');
const shR = await R.recordPassRoute(reqOf('desk-secret', { show: true }), env, '*');
const shHtml = await shR.text();
ok(shR.status === 200 && /HELD · 2/.test(shHtml) && /\(carried\)/.test(shHtml), 'E8 {show:true} builds the page with the holds from the record');
ok(/function recordPassPage\(rows, held\)/.test(w) && /recordPassPage\(await recordPassPreviews\(env\), recordPassHeld\(await recordPassRows\(env\)\)\)/.test(w), 'E9 the route hands the page the holds');

// ── F: the writer and the seam ────────────────────────────────────────────────────────────────────────────────────────────────────
const slices = [['const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '], ['const EXC_MOVE_LAW = ', 'function excReportPrompt('], ['function excReportPrompt(', 'function excAnchors('], ['function excDoorPrompt(', '// The compiled text becomes']].map(([a, b]) => between(w, a, b));
ok(slices.every(s => !/THE_HOLDS|excHouseWord|excMeasureRescue/.test(s)), 'F1 no hashed slice carries this cut: the writer is unchanged, the bench stands');
ok(seams['SEAM:THE_HOLDS'] && seams['SEAM:THE_HOLDS'].file === 'worker/src/index.js' && /excMeasureRescue/.test(seams['SEAM:THE_HOLDS'].purpose) && /excHouseWord/.test(seams['SEAM:THE_HOLDS'].purpose) && /recordPassHeld/.test(seams['SEAM:THE_HOLDS'].purpose) && /LANES/.test(seams['SEAM:THE_HOLDS'].purpose),
  'F2 the seam is registered and names what moved');
ok(!/—/.test(between(w, 'function excHouseWord(', 'function weekCoverOk(')) && !/—/.test(between(w, 'function excMeasureRescue(', '/* SEAM:EXC_SCORE')) && !/—/.test(between(w, 'function recordPassHeld(', 'async function recordPassQueue(')),
  'F3 no em dash in the cut\'s own text');
console.log('proof_the_holds: ' + pass + ' checks passed');
