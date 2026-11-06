/**
 * proof_scorecard.mjs  --  EX54 THE SCORECARD: calibration as the engine's feedback loop and its public headline. A graded claim on the
 * record is a call, counted under the band we said; the record prints it in the clean sheet's sentences at the twenty-call floor and
 * the count below it, the plain hit rate beside, never a count of readings or subjects; the room and the writers read their subjects'
 * calls; confidence learns, floor-gated, outside every hashed slice; the house scores its own readings; THE SCORE room shows it all.
 * Run from the repo root: node worker/proofs/proof_scorecard.mjs
 */
import fs from 'fs';
import { writerHash } from '../../tools/bench/writer_hash.mjs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const rp = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0062_scores.sql', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i + a.length); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };
const DASH = new RegExp('[' + String.fromCharCode(0x2014, 0x2013) + ']|' + String.fromCharCode(92, 92) + 'u201[34]|&mdash;');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── the slice: the scorecard block with the database, the cache and the graph faked ─────────────────────────────────────────
const block = between(w, '/* ═══ SEAM:SCORECARD (EX54 THE SCORECARD)', '/* ═══ SEAM:CLAIMS (EX53): findings as rows.');
let calls = [], kv = new Map(), puts = [], rpc = {}, throwOn = null, logged = [], ents = {};
const sbRest = async (env, path, opts) => {
  calls.push({ path, opts: opts || {} });
  if (throwOn && throwOn.test(path)) throw new Error('sb_500');
  const k = Object.keys(rpc).find(p => path.startsWith(p));
  return k ? (typeof rpc[k] === 'function' ? rpc[k](path, opts) : rpc[k]) : [];
};
const excQuiet = (where, v) => () => { logged.push(where); return v; };
const json = (body, status) => ({ status: status || 200, body });
const entityResolveName = async (env, name) => ents[String(name).toLowerCase()] || null;
const M = new Function('sbRest', 'excQuiet', 'json', 'entityResolveName', block +
  '; return { CALIB, calibCat, calibBand, calibRate, calibrationCounts, calibrationExamplesOf, calibrationShape, calibrationOfClaims, calibrationFor, calibrationSay, calibrationPublic, calibrationAdjust, calibrationLoad, calibrationForKey, calibrationScorecard, calibAdjust, calibrationSubjectLines, calibrationFrameLine, calibrationRoomLine, scoreRoute, scoreIdOk, scoreWeek, scoreCalibration, scoreWeeks, scoreNotes, scoreVoice, scoreTables };')(sbRest, excQuiet, json, entityResolveName);
const env = { RATE_LIMIT: { get: async k => (kv.has(k) ? kv.get(k) : null), put: async (k, v, o) => { kv.set(k, v); puts.push({ k, o }); }, delete: async k => { kv.delete(k); } } };

// ── A: the count, at claim granularity ──────────────────────────────────────────────────────────────────────────────────────
const E1 = 'e1111111-1111-4111-8111-111111111111', E2 = 'e2222222-2222-4222-8222-222222222222', E3 = 'e3333333-3333-4333-8333-333333333333';
const C = o => Object.assign({ src: 'door', reading_id: 'r1', idx: 0, claim: 'A claim', confidence: 'High', grade: 'held', on_record: true, lens: 'consumer', frame_key: 'track:a', night: '2026-10-12', graded_at: '2026-10-20T06:00:00Z', frame: { category: 'Athletic  Footwear ' }, entities: [{ id: E1, name: 'Nike' }] }, o);
const rows = [
  C({ idx: 0, claim: 'Nike buyers wait for the restock' }),
  C({ idx: 1, claim: 'The second finding of r1' }),
  C({ idx: 2, claim: 'A Medium finding of r1', confidence: 'Medium' }),
  C({ reading_id: 'r2', claim: 'The retro calendar sells out', grade: 'missed', night: '2026-09-28', graded_at: '2026-10-06T06:00:00Z', lens: 'market', frame_key: 'track:b', frame: { category: 'athletic footwear' }, entities: [{ id: E1, name: 'Nike' }, { id: E2, name: 'Adidas' }] }),
  C({ reading_id: 'r3', claim: 'An unmeasured call', grade: 'unmeasured' }),
  C({ reading_id: 'r4', claim: 'An ungraded call', grade: null }),
  C({ reading_id: 'r5', claim: 'A call off the record', on_record: false }),
  C({ reading_id: 'r6', claim: 'A finding of no known band', confidence: 'Maybe', grade: 'missed', frame: { category: '' }, lens: null, frame_key: null, entities: [] }),
  C({ reading_id: 'r7', idx: 1, claim: 'A finding shown one band lower', confidence: 'Medium', grade: 'missed', calibrated: { from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' } })];
const cal = M.calibrationOfClaims(rows);
ok(cal.v === 1 && cal.floor === 20 && cal.overall.n === 6 && cal.overall.held === 3 && same(cal.bands, { High: { n: 3, held: 2 }, Medium: { n: 2, held: 1 }, Low: { n: 1, held: 0 } }),
  'A1 a call is a claim graded held or missed on the record, filed under the band we said: unmeasured, ungraded and off-record claims are not calls; an unknown band is Low');
const cat = cal.by.category;
ok(cat.length === 1 && cat[0].key === 'athletic footwear' && cat[0].n === 5 && cat[0].held === 3 && same(cat[0].bands, { High: { n: 3, held: 2 }, Medium: { n: 2, held: 1 }, Low: { n: 0, held: 0 } }) && M.calibCat('  Athletic   Footwear ') === 'athletic footwear' && M.calibBand('Maybe') === 'Low',
  'A2 by category: the frame\'s category in one spelling (one space, lower case), the same key claim_calibration counts');
ok(cal.engine.category.length === 1 && same(cal.engine.category[0].bands, { High: { n: 4, held: 2 }, Medium: { n: 1, held: 1 }, Low: { n: 0, held: 0 } }),
  'A3 the category on the engine\'s band: a finding shown Medium that the engine scored High counts under High there, so a corrected band keeps learning');
ok(cal.by.lens.map(x => x.key + ':' + x.n).join(',') === 'consumer:4,market:1' && cal.by.space.map(x => x.key + ':' + x.n).join(',') === 'track:a:4,track:b:1' && cal.by.month.map(x => x.key + ':' + x.n).join(',') === '2026-10:5,2026-09:1',
  'A4 by lens and by space (the door\'s frame_key), most calls first; by month, newest first');
const e1 = cal.by.entity.find(x => x.key === E1), e2 = cal.by.entity.find(x => x.key === E2);
ok(e1 && e1.label === 'Nike' && e1.n === 5 && e1.held === 3 && same(e1.bands.High, { n: 3, held: 2 }) && same(e1.bands.Medium, { n: 2, held: 1 }) && e2 && e2.label === 'Adidas' && e2.n === 1 && e2.held === 0 && cal.by.entity[0].key === E1,
  'A5 by entity: every link a claim has (claim_entities), named');
ok(same(cal.examples.High.map(x => x.claim), ['Nike buyers wait for the restock', 'The retro calendar sells out']) && same(cal.examples.Medium.map(x => x.claim), ['A Medium finding of r1', 'A finding shown one band lower']) && same(cal.examples.Low.map(x => x.claim), ['A finding of no known band']) &&
  cal.examples.High[0].night === '2026-10-12' && cal.examples.High[0].grade === 'held' && cal.examples.High[1].grade === 'missed' && Object.keys(cal.examples.High[0]).join(',') === 'night,claim,grade',
  'A6 the graded calls behind a band: one a reading (its first finding in the band), newest graded first, then the night, then the reading; each its date, claim and verdict');
const all = M.calibrationOfClaims(rows, { all: true }), one = M.calibrationOfClaims(rows, { entity: { id: E3, name: 'Costco' } });
ok(all.overall.n === 7 && one.by.entity.length === 1 && one.by.entity[0].key === E3 && one.by.entity[0].n === 6 && one.by.entity[0].label === 'Costco',
  'A7 opts.all counts the calls off the record too; opts.entity files every row under one subject (a room\'s own claims)');
const sqlRows = M.calibrationCounts(rows).map(r => Object.assign({}, r, { n: String(r.n), held: String(r.held) }));
ok(same(M.calibrationShape(sqlRows, M.calibrationExamplesOf(rows)), cal) && M.calibrationCounts(rows).every(r => ['all', 'category', 'category_engine', 'lens', 'space', 'month', 'entity'].includes(r.dim) && ['High', 'Medium', 'Low'].includes(r.band)),
  'A8 one shape whether the count comes from Postgres (rows of dim, key, label, band, n, held; numbers as text) or from rows in the worker');

// ── B: the scorecard the record publishes ───────────────────────────────────────────────────────────────────────────────────
const pub = M.calibrationPublic(cal);
ok(same(pub.lines, ['High: 2 of 3 held so far.', 'Medium: 1 of 2 held so far.', 'Low: 0 of 1 held so far.', 'Overall, 3 of 6 calls held.']) && pub.bands.High.below_floor === true && !('rate' in pub.bands.High) && pub.overall.below_floor === true && !('rate' in pub.overall),
  'B1 under the floor a band is its count, held so far; no rate is printed below twenty graded calls');
ok(pub.examples.length === 5 && pub.examples.every(e => ['High', 'Medium', 'Low'].includes(e.band) && e.claim && /^(held|missed)$/.test(e.grade) && 'night' in e) && pub.examples[0].band === 'High',
  'B2 the newest graded calls ride under a band below the floor: date, claim, verdict');
const mk = (n, held, conf, category, cb, base) => Array.from({ length: n }, (_, i) => C({ reading_id: (base || 'a') + i, idx: 0, claim: 'Call ' + i, confidence: conf, grade: i < held ? 'held' : 'missed', frame: { category }, calibrated: cb || undefined }));
const p20 = M.calibrationPublic(M.calibrationOfClaims(mk(20, 16, 'High', 'retail').concat(mk(4, 3, 'Medium', 'retail', null, 'm'))));
ok(p20.lines[0] === 'When we said High, the call held 16 of 20.' && p20.bands.High.rate === 0.8 && !p20.bands.High.below_floor && p20.lines[1] === 'Medium: 3 of 4 held so far.' && p20.lines[2] === 'Overall, 19 of 24 calls held.' && p20.overall.rate === 0.792 && !p20.examples.some(e => e.band === 'High'),
  'B3 at twenty graded calls the band speaks in the clean sheet\'s sentence, "When we said High, the call held 16 of 20.", with its rate, and its examples step aside');
const p19 = M.calibrationPublic(M.calibrationOfClaims(mk(19, 15, 'High', 'retail')));
ok(p19.lines[0] === 'High: 15 of 19 held so far.' && p19.bands.High.below_floor === true && M.calibrationPublic(M.calibrationOfClaims([])) === null && M.calibrationPublic(M.calibrationOfClaims(mk(1, 1, 'Low', 'x'))).lines.slice(-1)[0] === 'Overall, 1 of 1 call held.',
  'B4 at nineteen the count stands, not the rate; nothing graded publishes nothing; one call is one call');
ok([pub, p20, p19].every(s => s.lines.every(l => !/reading|subject|deploy|night/i.test(l) && !DASH.test(l))),
  'B5 the line never counts readings or subjects (the quiet-engine law: a bet, its date and its grade are intelligence about the world, and so is their aggregate)');

// ── C: confidence learns, floor-gated ───────────────────────────────────────────────────────────────────────────────────────
const fresh = () => [{ title: 'a', confidence: 'High' }, { title: 'b', confidence: 'Medium' }, { title: 'c', confidence: 'Low' }];
const c20 = M.calibrationOfClaims(mk(20, 9, 'High', 'Athletic footwear'));
let xs = fresh();
ok(M.calibrationAdjust(xs, c20, 'athletic  Footwear') === 1 && xs[0].confidence === 'Medium' && same(xs[0].calibrated, { from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' }) && xs[1].confidence === 'Medium' && !xs[1].calibrated && xs[2].confidence === 'Low' && !xs[2].calibrated,
  'C1 twenty graded High calls in a category held 9 (0.45, under 0.7): a new High finding there is shown Medium and says so, {from, to, held, n, category}');
xs = fresh();
ok(M.calibrationAdjust(xs, M.calibrationOfClaims(mk(19, 9, 'High', 'athletic footwear')), 'athletic footwear') === 0 && xs[0].confidence === 'High' && !xs[0].calibrated,
  'C2 at nineteen graded calls nothing moves: the floor gates the learning as it gates the sentence');
xs = fresh(); const at70 = M.calibrationAdjust(xs, M.calibrationOfClaims(mk(20, 14, 'High', 'x')), 'x');
let ys = fresh(); const at65 = M.calibrationAdjust(ys, M.calibrationOfClaims(mk(20, 13, 'High', 'x')), 'x');
ok(at70 === 0 && xs[0].confidence === 'High' && at65 === 1 && ys[0].confidence === 'Medium', 'C3 held 14 of 20 (0.7) keeps High; 13 of 20 (0.65) moves it');
xs = fresh();
ok(M.calibrationAdjust(xs, M.calibrationOfClaims(mk(20, 9, 'Medium', 'x')), 'x') === 1 && xs[1].confidence === 'Low' && same(xs[1].calibrated, { from: 'Medium', to: 'Low', held: 9, n: 20, category: 'x' }) && xs[0].confidence === 'High',
  'C4 Medium under 0.5 at twenty calls goes Low; High in a category with no High calls stands');
xs = fresh();
ok(M.calibrationAdjust(xs, M.calibrationOfClaims(mk(20, 0, 'Low', 'x')), 'x') === 0 && xs[2].confidence === 'Low' && M.calibrationAdjust(fresh(), c20, 'skate shoes') === 0 && M.calibrationAdjust(fresh(), c20, '') === 0 && M.calibrationAdjust(fresh(), null, 'athletic footwear') === 0,
  'C5 Low has no floor; another category, no category or no count moves nothing');
xs = [{ title: 'kept', confidence: 'Medium', calibrated: { from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' } }];
ok(M.calibrationAdjust(xs, c20, 'athletic footwear') === 0 && xs[0].confidence === 'Medium', 'C6 one band at most: a finding already calibrated is left as it is');
const shownLower = mk(20, 9, 'Medium', 'athletic footwear', { from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' });
const cLearn = M.calibrationOfClaims(shownLower), cLift = M.calibrationOfClaims(shownLower.concat(mk(20, 20, 'High', 'athletic footwear', null, 'h')));
xs = fresh(); ys = fresh();
ok(cLearn.bands.Medium.n === 20 && cLearn.bands.High.n === 0 && M.calibrationAdjust(xs, cLearn, 'athletic footwear') === 1 && xs[0].confidence === 'Medium' && M.calibrationAdjust(ys, cLift, 'athletic footwear') === 0 && ys[0].confidence === 'High',
  'C7 the rule counts the band the engine earned: calls shown one band lower still count under High there, and when High calls hold again (29 of 40) the band lifts');
ok(M.CALIB.ADJUST === true && M.CALIB.FLOOR === 20 && M.CALIB.BAND_FLOOR.High === 0.7 && M.CALIB.BAND_FLOOR.Medium === 0.5 && !('Low' in M.CALIB.BAND_FLOOR) && same(M.CALIB.BANDS, ['High', 'Medium', 'Low']),
  'C8 the switch is on; the floor is twenty; the band floors are High 0.7 and Medium 0.5; the words stay High, Medium and Low');

// ── D: the count is read once in ten minutes ────────────────────────────────────────────────────────────────────────────────
const sqlOf = rs => M.calibrationCounts(rs).map(r => Object.assign({}, r, { n: String(r.n), held: String(r.held) }));
rpc = { 'rpc/claim_calibration_examples': () => M.calibrationExamplesOf(rows), 'rpc/claim_calibration': () => sqlOf(rows) };
calls = []; kv = new Map(); puts = [];
let got = await M.calibrationLoad(env);
const rc = calls.filter(c => /^rpc\//.test(c.path));
ok(rc.length === 2 && rc.some(c => c.path === 'rpc/claim_calibration' && c.opts.method === 'POST' && same(c.opts.body, { p_on_record: true })) && rc.some(c => c.path === 'rpc/claim_calibration_examples' && same(c.opts.body, { p_per: 3, p_on_record: true })) &&
  puts.length === 1 && puts[0].k === 'calib:v1' && puts[0].o.expirationTtl === 600 && got.overall.n === 6 && /^\d{4}-\d{2}-\d{2}T/.test(got.built_at),
  'D1 a miss asks Postgres twice (the count and its examples, on the record), shapes it and keeps it ten minutes under calib:v1');
calls = []; got = await M.calibrationLoad(env);
ok(calls.length === 0 && got.overall.n === 6, 'D2 a hit asks nothing');
calls = []; await M.calibrationLoad(env, { fresh: true });
ok(calls.filter(c => /^rpc\//.test(c.path)).length === 2, 'D3 THE SCORE room reads it fresh');
throwOn = /^rpc\/claim_calibration/; kv = new Map(); let threw = false;
try { await M.calibrationLoad(env); } catch (e) { threw = true; }
const roomFallback = await M.calibrationRoomLine(env, { id: E3, name: 'Costco' }, mk(4, 3, 'High', 'retail').map(r => Object.assign({}, r, { entities: undefined })));
throwOn = null;
ok(threw && roomFallback && roomFallback.n === 4 && roomFallback.held === 3 && roomFallback.line === 'On Costco, our calls held 3 of 4 (High 3 of 4).' && logged.includes('room_calib'),
  'D4 when the count cannot be read the load throws for its caller to catch; the room falls back to its own claims');

// ── E: a subject's calls, for the room and the writers ──────────────────────────────────────────────────────────────────────
const costco = [C({ reading_id: 'c1', claim: 'c1' }), C({ reading_id: 'c2', claim: 'c2' }), C({ reading_id: 'c3', claim: 'c3', confidence: 'Medium' }), C({ reading_id: 'c4', claim: 'c4', confidence: 'Medium', grade: 'missed' })].map(r => Object.assign(r, { entities: [{ id: E3, name: 'Costco' }], frame: { category: 'warehouse retail' } }));
const lose = [C({ reading_id: 'l1', claim: 'l1', grade: 'held' }), C({ reading_id: 'l2', claim: 'l2', grade: 'missed' }), C({ reading_id: 'l3', claim: 'l3', grade: 'missed', confidence: 'Low' }), C({ reading_id: 'l4', claim: 'l4', grade: 'missed', confidence: 'Low' })].map(r => Object.assign(r, { entities: [{ id: E2, name: 'Adidas' }], frame: { category: 'running' } }));
const ce = M.calibrationOfClaims(costco.concat(lose));
const fc = M.calibrationFor(ce, E3, 'entity');
ok(fc.n === 4 && fc.held === 3 && fc.rate === null && fc.bands.High.n === 2 && fc.bands.High.rate === null && M.calibrationSay('Costco', fc) === 'On Costco our calls have held 3 of 4 (High 2 of 2, Medium 1 of 2).' && M.calibrationSay('Costco', fc, true) === 'On Costco, our calls held 3 of 4 (High 2 of 2, Medium 1 of 2).',
  'E1 the writer\'s line and the room\'s, verbatim: "On Costco our calls have held 3 of 4 (High 2 of 2, Medium 1 of 2)."');
const two = M.calibrationFor(M.calibrationOfClaims(costco.slice(0, 2)), E3, 'entity');
ok(M.calibrationSay('Costco', two) === '' && M.calibrationSay('Costco', two, true) === 'On Costco, our calls held 2 of 2 (High 2 of 2).' && M.calibrationFor(ce, 'nobody', 'entity').n === 0 && M.calibrationFor(ce, 'Warehouse  Retail', 'category').n === 4,
  'E2 the writer hears a subject at three calls; the room says any call; a category is looked up in its one spelling');
kv = new Map(); kv.set('calib:v1', JSON.stringify(ce)); ents = { costco: { id: E3, name: 'Costco' }, adidas: { id: E2, name: 'Adidas' } };
const lHeld = await M.calibrationFrameLine(env, { entity: 'Costco', category: 'warehouse retail' }), lLose = await M.calibrationFrameLine(env, { entity: 'Adidas' }), lCat = await M.calibrationFrameLine(env, { entity: 'Unknown Co', category: 'Running' }), lNone = await M.calibrationFrameLine(env, {});
ok(lHeld === 'On Costco our calls have held 3 of 4 (High 2 of 2, Medium 1 of 2).' && lLose === 'On Adidas our calls have held 1 of 4 (High 1 of 2, Low 0 of 2). ' + M.CALIB.LAW && lCat === 'On Running our calls have held 1 of 4 (High 1 of 2, Low 0 of 2). ' + M.CALIB.LAW && lNone === '',
  'E3 EXCAVATE\'s line: the frame\'s entity, or its category when the graph has none; where the calls missed more than they held the law rides the line');
const sl = await M.calibrationSubjectLines(env, [{ id: E3, name: 'Costco' }, { id: E2, name: 'Adidas' }, { id: E1, name: 'Nike' }], 'retail'), slCat = await M.calibrationSubjectLines(env, [], 'warehouse retail');
ok(same(sl, ['On Costco our calls have held 3 of 4 (High 2 of 2, Medium 1 of 2).', 'On Adidas our calls have held 1 of 4 (High 1 of 2, Low 0 of 2).']) && same(slCat, ['On warehouse retail our calls have held 3 of 4 (High 2 of 2, Medium 1 of 2).']),
  'E4 READ\'s lines: one a subject the block names at three calls (Nike has none here); the category only when the graph named no entity');
const room = await M.calibrationRoomLine(env, { id: E3, name: 'Costco' }, []);
ok(room && room.line === 'On Costco, our calls held 3 of 4 (High 2 of 2, Medium 1 of 2).' && room.n === 4 && room.bands.High.rate === null && (await M.calibrationRoomLine(env, { id: E1, name: 'Nike' }, [])) === null,
  'E5 the room\'s line from the house\'s whole count, no rate under the floor; a subject with no calls says nothing');
const sp = M.calibrationFor(cal, 'track:a'), sp20 = M.calibrationFor(M.calibrationOfClaims(mk(20, 15, 'High', 'x').map(r => Object.assign(r, { frame_key: 'brand:nike' }))), 'brand:nike');
ok(sp.dim === 'space' && sp.n === 4 && sp.rate === null && sp20.n === 20 && sp20.rate === 0.75 && sp20.bands.High.rate === 0.75 && (await M.calibrationForKey(env, 'nope')).n === 0,
  'E6 calibrationFor(cal, key): a space\'s calls by its frame_key for the pass and the front, a rate only at the floor');

// ── F: the house's own score ────────────────────────────────────────────────────────────────────────────────────────────────
const U = { id: 'u-admin' }, D1 = 'd1111111-1111-4111-8111-111111111111';
const bad = await Promise.all([M.scoreRoute('/reads/score', { src: 'x', id: D1 }, env, null, U), M.scoreRoute('/reads/score', { src: 'house', id: 'abc' }, env, null, U), M.scoreRoute('/reads/score', { src: 'door', id: '42' }, env, null, U), M.scoreRoute('/reads/score', { src: 'door', id: D1, score: 6 }, env, null, U), M.scoreRoute('/reads/score', { src: 'read', id: D1, score: 'x' }, env, null, U)]);
ok(bad.slice(0, 3).every(r => r.status === 400 && r.body.error === 'bad_reading') && bad.slice(3).every(r => r.status === 400 && r.body.error === 'bad_score') && M.scoreIdOk('house', '41') && M.scoreIdOk('read', D1) && !M.scoreIdOk('house', D1),
  'F1 a reading is named by its table: a door row or a live read by uuid, a house read by its number; a score is 1 to 5');
let store = [];
rpc = { 'reading_scores?on_conflict': (p, o) => { for (const r of o.body) { store = store.filter(x => !(x.src === r.src && x.reading_id === r.reading_id && x.by === r.by)).concat([r]); } return null; },
  'reading_scores?src=eq.': () => store.slice().reverse() };
calls = [];
const s1 = await M.scoreRoute('/reads/score', { src: 'door', id: D1, score: 4, note: '  The bet  was sharp.  ' }, env, null, U);
const post = calls.find(c => c.path === 'reading_scores?on_conflict=src,reading_id,by');
ok(s1.status === 200 && s1.body.ok && post && post.opts.method === 'POST' && /resolution=merge-duplicates/.test(post.opts.headers.Prefer) && post.opts.body.length === 1 && post.opts.body[0].src === 'door' && post.opts.body[0].reading_id === D1 && post.opts.body[0].score === 4 && post.opts.body[0].note === 'The bet was sharp.' && post.opts.body[0].by === 'u-admin' && /^\d{4}-/.test(post.opts.body[0].at) &&
  s1.body.mine.score === 4 && s1.body.all.n === 1 && s1.body.all.mean === 4,
  'F2 a score is kept as one row a reading and scorer (an upsert on src, reading_id, by), the note on one line');
await M.scoreRoute('/reads/score', { src: 'door', id: D1, score: 2 }, env, null, { id: 'u-other' });
calls = [];
const s2 = await M.scoreRoute('/reads/score', { src: 'door', id: D1, score: 5 }, env, null, U), s3 = await M.scoreRoute('/reads/score', { src: 'door', id: D1 }, env, null, { id: 'u-third' });
ok(s2.body.mine.score === 5 && s2.body.mine.note === null && s2.body.all.n === 2 && s2.body.all.mean === 3.5 && s3.body.mine === null && s3.body.all.n === 2 && calls.filter(c => /on_conflict/.test(c.path)).length === 1,
  'F3 a second press replaces the first; a read without a score keeps nothing and says the mean');
throwOn = /^reading_scores/; logged = [];
const s4 = await M.scoreRoute('/reads/score', { src: 'house', id: '41', score: 3 }, env, null, U); throwOn = null;
ok(s4.status === 200 && s4.body.ok === false && s4.body.error === 'score_failed' && logged.includes('score'), 'F4 a database failure says so (before 0062 runs: the table is missing) and is logged');
ok(M.scoreWeek('2026-10-31') === '2026-10-26' && M.scoreWeek('2026-11-01') === '2026-10-26' && M.scoreWeek('2026-10-26T03:00:00Z') === '2026-10-26' && M.scoreWeek('2026-11-02') === '2026-11-02' && M.scoreWeek(null) === null && M.scoreWeek('nope') === null,
  'F5 a week is its Monday, UTC');
const sw = M.scoreWeeks([{ src: 'door', reading_id: D1, score: 5, note: 'Sharp', at: '2026-10-30T10:00:00Z' }, { src: 'door', reading_id: 'x', score: 3, at: '2026-10-27T10:00:00Z' }, { src: 'house', reading_id: '41', score: 2, note: 'Too long', at: '2026-10-28T10:00:00Z' }, { src: 'read', reading_id: 'y', score: 4, at: '2026-10-20T10:00:00Z' }, { src: 'door', reading_id: 'z', score: 9, at: '2026-10-30T10:00:00Z' }], { 41: 'weekly' });
ok(same(sw.weeks, [{ week: '2026-10-26', kind: 'door', n: 2, mean: 4 }, { week: '2026-10-26', kind: 'house:weekly', n: 1, mean: 2 }, { week: '2026-10-19', kind: 'read', n: 1, mean: 4 }]) && sw.notes.length === 2 && sw.notes[0].note === 'Sharp' && sw.notes[1].kind === 'house:weekly',
  'F6 the scores by week and kind: the mean and the count; a house read under its kind; a score out of range is not counted; the notes newest first');
const sv = M.scoreVoice({ house: [{ id: 41, kind: 'weekly', created_at: '2026-10-28T10:00:00Z', violations: ['style:long_sentence:read.0:31', 'style:edge_template:read.1', 'number_not_in_evidence: 40%', 'style:long_sentence:p.2:28'] }],
  door: [{ night: '2026-10-29', voice: ['voice:long_sentence:dek:30', 'voice:semicolon_chain:finding 2'] }, { night: '2026-10-30', voice: [] }],
  live: [{ created_at: '2026-10-29T12:00:00Z', voice: { n: 1, notes: ['voice:edge_template:move 1 body'] } }], editions: [{ date: '2026-10-30', voice: { n: 2, notes: ['voice:long_sentence:item 3:31', 'voice:long_sentence:item 4:27'], at: 'x' } }] });
const vk = Object.fromEntries(sv.map(r => [r.writer, r]));
ok(sv.length === 4 && sv.every(r => r.week === '2026-10-26') && vk['house:weekly'].notes === 3 && vk['house:weekly'].pieces === 1 && same(vk['house:weekly'].top, [['long_sentence', 2], ['edge_template', 1]]) && vk.door.pieces === 2 && vk.door.notes === 2 && vk.door.per === 1 && vk.live.notes === 1 && vk.daily.notes === 2 && same(vk.daily.top, [['long_sentence', 2]]),
  'F7 the voice notes by week and writer: a house read\'s style notes only (a hold is not a note), the door\'s and the live read\'s voice notes, an edition\'s; pieces, notes, notes a piece, the faults named most');
const scal = M.scoreCalibration(Object.assign(M.calibrationOfClaims(mk(20, 9, 'High', 'athletic footwear').concat(mk(3, 2, 'Medium', 'retail', null, 'r'))), { built_at: '2026-10-31T00:00:00Z' }));
ok(scal.overall.n === 23 && scal.overall.bands.High.rate === 0.45 && scal.overall.bands.High.below_floor === false && scal.overall.bands.Medium.rate === 0.667 && scal.overall.bands.Medium.below_floor === true && same(scal.adjusting, [{ category: 'athletic footwear', from: 'High', to: 'Medium', n: 20, held: 9, rate: 0.45 }]) && scal.by.category.length === 2,
  'F8 THE SCORE\'s calibration: every rate at any count, flagged below the floor, and where the adjustment is live');
const many = Array.from({ length: 300 }, (_, i) => ({ id: 1000 + i, kind: 'weekly', created_at: '2026-10-28T10:00:00Z', violations: [] }));
rpc = { 'rpc/claim_calibration_examples': () => M.calibrationExamplesOf(rows), 'rpc/claim_calibration': () => sqlOf(rows), 'reading_scores?at=gte.': [{ src: 'house', reading_id: '7', score: 4, at: '2026-10-29T10:00:00Z' }], 'house_reads?created_at=gte.': many, 'house_reads?id=in.': [{ id: 7, kind: 'recon' }],
  'reads?created_at=gte.': [{ created_at: '2026-10-29T12:00:00Z', voice: { n: 1, notes: ['voice:long_sentence:dek:30'] } }], 'editions?date=gte.': [] };
throwOn = /^door_reads/; calls = [];
const tb = await M.scoreRoute('/reads/scorecard', {}, env, null, U); throwOn = null;
const tq = calls.map(c => c.path);
ok(tb.status === 200 && tb.body.ok && tb.body.calibration && tb.body.calibration.overall.n === 6 && same(tb.body.lines, pub.lines) && tb.body.scores.weeks[0].kind === 'house:recon' && same(tb.body.voice.partial, ['door']) && same(tb.body.voice.capped, ['house']) && tb.body.voice.weeks.some(r => r.writer === 'live') &&
  tq.some(p => /^reading_scores\?at=gte\.\d{4}-\d{2}-\d{2}T00:00:00Z&select=src,reading_id,score,note,at&order=at\.desc&limit=1000$/.test(p)) && tq.some(p => /^door_reads\?night=gte\.\d{4}-\d{2}-\d{2}&status=eq\.ready&select=night,voice:read->voice/.test(p)) && tq.some(p => /^editions\?date=gte\..+&select=date,voice:meta->voice/.test(p)) && tq.includes('house_reads?id=in.(7)&select=id,kind') && tb.body.since.length === 10,
  'F9 THE SCORE\'s tables: the calibration fresh with the record\'s own sentences, the scores by week and kind (a house read\'s kind looked up), the voice by writer; a source that fails is named, a source read to its cap says so');

// ── G: the wiring ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const rec = between(w, 'async function doorRecord(env) {', 'async function doorRecordRoute(');
ok(/  set\.scorecard = typeof calibrationScorecard === 'function' \? await calibrationScorecard\(env\)\.catch\(excQuiet\('scorecard', null\)\) : null;/.test(rec) && rec.indexOf('set.scorecard = ') < rec.indexOf('await env.RATE_LIMIT.put(RECORD.KEY') && rec.indexOf('set.scorecard = ') > rec.indexOf('const set = {') && /tiles, positions, currents, calibration, counts:/.test(rec),
  'G1 the record carries the scorecard, cached with it ten minutes; its old reading-level calibration stays computed beside it');
const called = between(w, 'async function doorCalled(env) {', 'async function doorRecord(env) {');
ok(/if \(out\.checked && env\.RATE_LIMIT\) \{ try \{ await env\.RATE_LIMIT\.delete\(CALIB\.KEY\); \} catch \(e\) \{ excQuiet\('calib_bust'\)\(e\); \} \}/.test(called) && called.indexOf('delete(CALIB.KEY)') > called.indexOf('delete(RECORD.KEY)'),
  'G2 the nightly grade drops the count with the record, so tonight\'s grades count on the next read');
const synth = between(w, "    const house = typeof excHouseLines === 'function'", '    // SEAM:READ_LEDGER');
const iAdj = synth.indexOf("if (!body.bench && typeof calibAdjust === 'function') await calibAdjust(env, insights, frame0 && frame0.category).catch(excQuiet('calib_adjust', 0));");
ok(iAdj > synth.indexOf("const bad = typeof excMeasureClaim === 'function' && excMeasureClaim(x.title)") && iAdj > synth.indexOf("confidence: ground.ungrounded.length ? 'Low' : earned(ns),") && iAdj < synth.indexOf('excMovesPass(env, {') && iAdj < synth.indexOf('excVoiceNotes({ read, insights, ideas, brief })') && w.indexOf('await calibAdjust(env, insights, frame0') < w.indexOf("claimsWrite(env, claimsOf('read', readId,"),
  'G3 the live read: after the engine scores the findings and drops a measure claim, before the moves pass reads the bands and before the claims are written; never on the bench');
ok(/const houseCalib = house\.length && !body\.bench && typeof calibrationFrameLine === 'function' \? await calibrationFrameLine\(env, frame0\)\.catch\(excQuiet\('calib_line', ''\)\) : '';/.test(synth) && /\.join\('\\n'\) \+ \(houseCalib \? '\\n' \+ houseCalib : ''\) \+ '\\n\\n' : '';/.test(synth) && synth.indexOf('const houseCalib') < synth.indexOf('const houseBlock') &&
  /const houseBlock = house\.length \? 'WHAT THE HOUSE DEPLOYED \(our own dated insights on this subject; context for continuity, never evidence/.test(synth) && /excMeasureLine\(measures\) \+ houseBlock \+ believesBlock \+ \(isReport/.test(synth),
  'G4 EXCAVATE\'s house block ends with the subject\'s calls when the house deployed on it; the block\'s head and its place in the prompt unchanged; the bench reads none');
const land = between(w, 'async function doorLand(', 'async function doorFail('), sland = between(w, 'async function spaceLand(', 'async function spaceFail(');
const adjLine = "if (typeof calibAdjust === 'function') await calibAdjust(env, read.insights, row.frame && row.frame.category).catch(excQuiet('calib_adjust', 0));";
ok(land.includes(adjLine) && land.indexOf(adjLine) > land.indexOf('const read = doorCompileRead(') && land.indexOf(adjLine) < land.indexOf("status: 'ready', read,") && land.indexOf(adjLine) < land.indexOf("claimsWrite(env, claimsOf('door', id, read,") &&
  sland.includes(adjLine) && sland.indexOf(adjLine) > sland.indexOf('const read = doorCompileRead(') && sland.indexOf(adjLine) < sland.indexOf("status: 'ready', read,"),
  'G5 the door\'s landing and a space\'s: after the compile scores the findings, before the row is written ready and before its claims');
const lawSrc = between(w, 'const READ_HOUSE_LAW = ', '   // SEAM:HOUSE_CORPUS (EX53b)\n');
const LAW = new Function(lawSrc + '; return READ_HOUSE_LAW;')();
ok(LAW.includes(M.CALIB.LAW) && LAW.indexOf(M.CALIB.LAW) > LAW.indexOf('why the evidence now reads the other way.') && /When the house holds nothing on the subject, the read says nothing about its history\.$/.test(LAW) && !DASH.test(LAW) && M.CALIB.LAW === 'Where our calls on a subject have missed more than they held, the read says so where it bears and does not lean on our earlier view.',
  'G6 THE HOUSE LAW carries one more sentence, the same EXCAVATE\'s line carries: where our calls on a subject have missed more than they held, the read says so where it bears and does not lean on our earlier view');
const hcf = between(w, 'async function houseClaimsFor(env, kind, row, items, recon) {', '\n}\n');
ok(/const calib = kept\.length && typeof calibrationSubjectLines === 'function' \? await calibrationSubjectLines\(env, ents, category\)\.catch\(excQuiet\('calib_lines', \[\]\)\) : \[\];/.test(hcf) && /text: houseCorpusBlock\(kept, subjects\) \+ \(calib\.length \? '\\n' \+ calib\.join\('\\n'\) : ''\)/.test(hcf) && /calib\.length \? \{ calibration: calib \} : \{\}/.test(hcf),
  'G7 READ\'s house block: the subjects\' calls after the claims, only where the house holds claims (nothing is said of a history it does not have); the lines ride the meta');
const cs = between(w, 'function claimsOf(src, readingId, read, lines, frame, night, measures, frameKey, writtenAt) {', "/* The reading's grade and marks, carried onto its claims. */");
let posted = null;
const CW = new Function('RECORD', 'DOOR', 'CLAIMS', 'sbRest', cs + '; return { claimsOf, claimsWrite };')({ SINCE: '2026-10-08' }, { MIN_EVIDENCE: 3 }, { LINES: 8, TEXT: 120, EXCERPT: 400 },
  async (e, path, opts) => { if (/^claims\?on_conflict=/.test(path)) { posted = opts.body; return opts.body.map((r, i) => ({ id: 'c' + i })); } return [{ links_made: 0 }]; });
const crow = CW.claimsOf('door', 'd9', { insights: [{ title: 'A calibrated finding', confidence: 'Medium', calibrated: { from: 'High', to: 'Medium', held: '9', n: 20, category: 'athletic footwear' } }, { title: 'A plain finding', confidence: 'Low' }] }, [], { category: 'Athletic footwear' }, '2026-10-20', { recent_7d: 3 }, 'k', null);
await CW.claimsWrite({}, crow);
const postedA = posted;
await CW.claimsWrite({}, CW.claimsOf('door', 'd8', { insights: [{ title: 'Plain', confidence: 'High' }] }, [], {}, '2026-10-20', {}, 'k', null));
ok(crow[0].confidence === 'Medium' && same(crow[0].calibrated, { from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' }) && !('calibrated' in crow[1]) && postedA.length === 2 && postedA.every(r => 'calibrated' in r) && postedA[1].calibrated === null && !('calibrated' in posted[0]),
  'G8 a claim says the band we said and keeps the band the engine earned (claims.calibrated); a batch carries the key on every row or on none, so claims keep writing before 0062 runs');
ok(/        case '\/reads\/score':         \/\/ SEAM:SCORECARD \(EX54\)/.test(w) && /        case '\/reads\/scorecard':\n/.test(w) && /if \(path === '\/reads\/score' \|\| path === '\/reads\/scorecard'\) return scoreRoute\(path, body, env, origin, user\);/.test(between(w, 'async function readRoute(path, body, env, origin, user) {', "if (path === '/reads/list')")) &&
  between(w, 'async function readRoute(path, body, env, origin, user) {', "if (path === '/reads/list')").indexOf('callerIsAdmin') < between(w, 'async function readRoute(path, body, env, origin, user) {', "if (path === '/reads/list')").indexOf('scoreRoute'),
  'G9 the score and THE SCORE\'s tables are admin routes, behind readRoute\'s gate');
const ro = between(w, 'async function roomOf(env, e) {', '\n}\n');
ok(/const scorecard = typeof calibrationRoomLine === 'function' \? await calibrationRoomLine\(env, e, claims\)\.catch\(excQuiet\('room_scorecard', null\)\) : null;/.test(ro) && /record, readings: roomReadingsOf\(cl\), scorecard,/.test(ro) && !/space_reads/.test(ro),
  'G10 a room carries its subject\'s calls, from the house\'s count, never a private reading');

// ── H: the pages ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PL = new Function('safe', between(page, 'function _scoreLine(sc) {', '/* SEAM:SCORECARD (EX54): a finding the record moved one band lower') + '; return { _scoreLine, _scoreDay };')(esc);
const html = PL._scoreLine(pub), html20 = PL._scoreLine(p20);
ok((html.match(/<span class="rec-score">/g) || []).length === 4 && html.includes('<span class="rec-score">High: 2 of 3 held so far.</span>') && /<details class="rec-score-ex"><summary>The graded calls so far<\/summary>/.test(html) && (html.match(/class="rec-score-row"/g) || []).length === 5 && html.includes('Oct 12, 2026') &&
  html20.includes('When we said High, the call held 16 of 20.') && PL._scoreLine(null) === '' && PL._scoreLine({ lines: [] }) === '' && !/reading|subject/i.test(html.replace(/<[^>]+>/g, ' ').replace(/Nike buyers wait for the restock|The retro calendar sells out|A Medium finding of r1|A finding shown one band lower|A finding of no known band/g, '')),
  'H1 the record\'s head: one sentence a band and the plain hit rate as the worker wrote them, the graded calls so far under a band below the floor; no count of readings or subjects');
const calibText = new Function(between(page, 'function _calibText(c) {', '\n') + '; return _calibText;')();
ok(calibText({ from: 'High', to: 'Medium', held: 9, n: 20, category: 'athletic footwear' }) === 'Calibrated: our High calls in athletic footwear have held 9 of 20.' && calibText(null) === '',
  'H2 a calibrated finding says so under its band: "Calibrated: our High calls in athletic footwear have held 9 of 20."');
ok(/counts\.innerHTML = ''; counts\.style\.display = 'none';/.test(page) && !/_scoreLine\(rec\.scorecard\)/.test(page) && /calibrated: ins\.calibrated&&ins\.calibrated\.from\?ins\.calibrated:null,/.test(page) && /source ↗<\/a>`:''\}<\/div>\$\{typeof _calibLine==='function'\?_calibLine\(ins\.calibrated\):''\}/.test(page) && /\$\{ins\.calibrated&&typeof _calibText==='function'\?`<div class="modal-sub"/.test(page),
  'H3 NT3c: the arrival prints no score (READ\'s SCORE room keeps it); a finding carries its calibration from the reading to its card and its detail');
ok(/<button class="btn-new-search" id="btn-score-read" style="display:none" onclick="_scoreOpen\(\)">Score<\/button>/.test(page) && /_cmAdmin\(\)\.then\(a=>\{ const s=document\.getElementById\('btn-score-read'\); if\(s\) s\.style\.display=a\?'':'none';/.test(page) && /_cmApi\('\/reads\/score', t\)/.test(page) && /const door = syn\.overnight && window\._doorOpen && window\._doorOpen\.id \? window\._doorOpen\.id : null;\n  const id = door \|\| syn\.read_id \|\| null;/.test(page) &&
  /\$\{j\.scorecard && j\.scorecard\.line \? `<p class="room-more room-calls">\$\{safe\(j\.scorecard\.line\)\}<\/p>` : ''\}/.test(page),
  'H4 the score on a reading is an admin\'s (hidden until the house says so), by its door row or its ledger id; a room says its subject\'s calls');
ok(/HOUSE_ROOMS\.score = \{ name: "The score", door: "The score",/.test(rp) && /HOUSE_ORDER\.push\("score"\);\n  var ROOM = /.test(rp) && /if \(room === "score"\) return scoreRoom\(\);/.test(rp) && /call\("\/reads\/scorecard", \{\}\)/.test(rp) && /btns\.push\('<button class="btn" id="score-read">Score<\/button>'\);/.test(rp) && /if \(scb\) scb\.onclick = function \(\) \{ scoreOpen\(row\); \};/.test(rp) && /call\("\/reads\/score", \{ src: "house", id: String\(row\.id\), score: pick,/.test(rp) && /below the floor/.test(rp),
  'H5 READ: THE SCORE is the eleventh door, its tables from the admin route; an open read is scored beside the desk, as a house read');
const pBlock = between(page, '/* SEAM:SCORECARD (EX54 THE SCORECARD): the record', 'function _renderScroll(rec, data) {'), rBlock = between(rp, '/* SEAM:SCORECARD (EX54 THE SCORECARD): THE SCORE', 'function deskPanel(html) {');
ok(!DASH.test(pBlock) && !DASH.test(rBlock) && !/space_reads|callClaude|env\.AI/.test(pBlock + rBlock), 'H6 no dash in the pages\' new scripts, no private table, no model');

// ── I: the migration ────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/alter table public\.claims add column if not exists calibrated jsonb;/.test(sql) && /create or replace function public\.claim_calibration\(p_on_record boolean default true\)\nreturns table \(dim text, key text, label text, band text, n int, held int\)/.test(sql) && /create or replace function public\.claim_calibration_examples\(p_per int default 3, p_on_record boolean default true\)/.test(sql) &&
  /create table if not exists public\.reading_scores \(/.test(sql) && /src         text not null check \(src in \('door', 'read', 'house'\)\)/.test(sql) && /score       int not null check \(score between 1 and 5\)/.test(sql) && /create unique index if not exists reading_scores_uq on public\.reading_scores \(src, reading_id, by\);/.test(sql) &&
  /alter table public\.reading_scores enable row level security;/.test(sql) && /revoke all on public\.reading_scores from anon, authenticated;/.test(sql) && /grant select, insert, update, delete on public\.reading_scores to service_role;/.test(sql) && (sql.match(/revoke all on function public\.claim_calibration[_a-z]*\([a-z, ]+\) from public, anon, authenticated;/g) || []).length === 2 && (sql.match(/grant execute on function public\.claim_calibration[_a-z]*\([a-z, ]+\) to service_role;/g) || []).length === 2 && !/\bdrop\b/i.test(sql),
  'I1 0062 is idempotent (if not exists, or replace), the service role\'s only (RLS on; the functions revoked from public, anon and authenticated), one score a reading and scorer, 1 to 5');
ok(/where c\.grade in \('held', 'missed'\) and \(not coalesce\(p_on_record, true\) or c\.on_record\)/.test(sql) && /nullif\(left\(lower\(btrim\(regexp_replace\(coalesce\(c\.frame->>'category', ''\), '\\s\+', ' ', 'g'\)\)\), 60\), ''\) as cat/.test(sql) && /when c\.calibrated->>'from' in \('High', 'Medium', 'Low'\) then c\.calibrated->>'from'/.test(sql) &&
  ['all', 'category', 'category_engine', 'lens', 'space', 'month', 'entity'].every(d => sql.includes("'" + d + "'")) && /distinct on \(b\.band, c\.src, c\.reading_id\)/.test(sql) && /order by y\.graded_at desc nulls last, y\.night desc nulls last, y\.reading_id collate "C" asc/.test(sql),
  'I2 the SQL counts as calibrationCounts counts: held or missed on the record, the category in one spelling, the engine\'s band from calibrated.from, the same seven dimensions, the same examples order');

// ── J: the house discipline ─────────────────────────────────────────────────────────────────────────────────────────────────
const SPM = /env\.AI\.run\(|env\.AI\.toMarkdown\(|callModel\(|callClaude\(|claudeBatchSubmit\(|queue\.fal\.run|api\.perplexity\.ai|api\.exa\.ai|api\.tavily\.com|CLAUDE\.API \+/;
ok(!SPM.test(block) && !DASH.test(block) && !/space_reads/.test(block) && !/catch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(block) && !/\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(?:\{\s*\}|null|undefined|\[\]|''|false)\s*\)/.test(block),
  'J1 the block asks no model and spends nothing, carries no dash, names no private table and swallows nothing');
const last = JSON.parse(fs.readFileSync('tools/bench/last.json', 'utf-8'));
ok(writerHash(w).slice(0, 12) === String(last.writer_hash || '').slice(0, 12) && writerHash(w).slice(0, 12) === '79c343cdc281', 'J2 the EXCAVATE writer\'s hash is the bench\'s (' + writerHash(w).slice(0, 12) + '; VX3 THE VOICE BEHIND moved it by one field): the line, the law and the adjustment ride outside every hashed slice');
const reg = seams.registry;
ok(reg['SEAM:SCORECARD'] && reg['SEAM:SCORECARD'].file === 'worker/src/index.js' && reg['SEAM:SCORECARD@intelligence'] && reg['SEAM:SCORECARD@intelligence'].tag === 'SEAM:SCORECARD' && reg['SEAM:SCORECARD@intelligence'].file === 'intelligence/index.html' && reg['SEAM:SCORECARD@read'] && reg['SEAM:SCORECARD@read'].file === 'intelligence/read/index.html' &&
  (w.match(/SEAM:SCORECARD/g) || []).length >= 14 && (page.match(/SEAM:SCORECARD/g) || []).length >= 6 && (rp.match(/SEAM:SCORECARD/g) || []).length >= 5,
  'J3 the seam is registered for the worker, the Intelligence page and READ, and tagged where it acts');
console.log('proof_scorecard: ' + pass + ' checks passed');
