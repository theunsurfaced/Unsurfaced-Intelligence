/**
 * proof_memory.mjs  --  EX20 THE MEMORY (SEAM:MEMORY): every subject's weeks counted exactly by the database, what we said filed
 * beside them, every call graded on its own counts, the reads handed what we said before, a timeline per subject, the record, the
 * case windows in shadow. Runs the shipped code on fakes (the migration itself is proved on Postgres by supabase/tests/0040_memory).
 * Run from the repo root: node worker/proofs/proof_memory.mjs
 *   W  weeks and the counting rule   G  calls and grades   C  the case windows   S  what we said   B  the brief   T  the timeline
 *   R  the record   H  history and the daily run   K  brands   Z  wiring, migration, seams
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0040_memory.sql', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const fnOf = name => { const a = w.indexOf('async function ' + name + '('), i = a >= 0 ? a : w.indexOf('function ' + name + '('); const j = w.indexOf('\n}\n', i); return w.slice(i, j + 3); };
const quiet = () => { const o = console.log; const logs = []; console.log = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; } }; };
const NOW = Date.parse('2026-10-07T12:00:00Z'), day = 864e5;
class FixedDate extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }
const memSrc = between(w, '/* ═══ SEAM:MEMORY (EX20)', '/* ═══════════════════════════════════════════════════════════════════════════\n * SEAM:EXC_DOOR v2');
const pureSrc = fnOf('ledgerWeek') + fnOf('ledgerVoiceCounts') + fnOf('ledgerDoorRows') + fnOf('lakeKey') + fnOf('trackMatch');
const NAMES = 'MEMORY, memoryAll, memoryWatch, memoryAddWeeks, memoryMondays, memoryDay, sweepWhen, memoryPostedState, memorySeries, memoryCalls, gradeCall, gradeAll, caseState, caseLive, memoryCount, memoryStart, memoryCounted, memoryCountSpan, memoryBackfill, memoryDoorBackfill, memoryCallsBackfill, ledgerPutBoardOnly, memoryReadItems, memoryItemSubjects, memorySaid, memoryRows, memoryGrade, memoryGradeWords, memoryBriefLine, memoryBrief, memoryDoorBriefs, memoryReadKeys, memoryReadBrief, memoryCaseStates, memoryDaily, excavateTimeline, timelineOf, memoryWindows, memoryRecord, ledgerWeek, ledgerDoorRows';
const mk = (deps) => new Function('Date', 'sbRest', 'excQuiet', 'loadTracks', 'ledgerPut', 'LEDGER', 'excFrameLabel', 'json', 'DOOR_EXTRAS', pureSrc + memSrc + '; return { ' + NAMES + ' };')(
  FixedDate, deps.sbRest || (async () => []), (where, v) => () => v, deps.loadTracks || (async () => []), deps.ledgerPut || (async (e, col, r) => r.length), { TABLE: 'subject_weeks', KINDS: ['theme', 'track', 'cohort', 'field', 'territory'] },
  f => (f && (f.entity || f.category)) || null, (o, s) => Object.assign({ _status: s }, o), { KEY: 'door:extras:v4' });
const M = mk({});

// ── W: weeks and the counting rule ─────────────────────────────────────────
ok(M.ledgerWeek() === '2026-10-05' && M.memoryAddWeeks('2026-10-05', -2) === '2026-09-21' && M.memoryMondays('2026-09-16', '2026-10-07').join(',') === '2026-09-14,2026-09-21,2026-09-28,2026-10-05' && M.memoryDay('2026-09-28', false) === 'Sep 28',
  'W1 weeks are Mondays (UTC), the same Monday the database and the ledger use');
const sw = r => M.sweepWhen(r);
ok(sw({ published_at: '2026-10-06T12:00:00Z', captured_at: '2026-10-07T09:00:00Z' }) === '2026-10-06T12:00:00Z' && sw({ published_at: null, captured_at: '2026-10-04T23:00:00Z' }) === '2026-10-04T23:00:00Z'
   && sw({ published_at: '2026-10-09T12:00:00Z', captured_at: '2026-10-07T09:00:00Z' }) === null && sw({ published_at: '2026-09-01T12:00:00Z', captured_at: '2026-10-07T09:00:00Z' }) === null
   && sw({ published_at: '2026-09-08T12:00:00Z', captured_at: '2026-10-07T09:00:00Z' }) === '2026-09-08T12:00:00Z' && /when p_published > p_captured \+ interval '24 hours' then null/.test(mig) && /when p_published < p_captured - interval '720 hours' then null/.test(mig),
  'W2 the counting rule is one rule in the worker and the database: the published week when the sweep found it within a month; dated after it was found, or found later than a month, it speaks for no week');
const rowsA = [{ week: '2026-09-14', counts: { n: 2, outlets: 2, outlets_4w: 2 } }, { week: '2026-09-28', counts: { n: 5, outlets: 3 }, door: { state: 'ACCELERATING', claim: 'x' } }];
const serA = M.memorySeries(rowsA, '2026-08-31', '2026-10-05', '2026-09-07');
ok(serA.length === 6 && serA[0].n === null && serA[1].n === 0 && serA[2].n === 2 && serA[3].n === 0 && serA[4].n === 5 && serA[4].outlets_4w === 3 && serA[4].state === 'ACCELERATING' && serA[5].n === 0,
  'W3 a subject\'s run has every Monday: a counted week with no row is zero, a week before the sweep counted is not watched (null), never zero');

const gapSer = M.memorySeries(rowsA, '2026-08-31', '2026-10-05', '2026-09-07', new Set(['2026-09-21']));
const never = M.memorySeries([{ week: '2026-09-28', door: { state: 'EMERGING', claim: 'x' } }], '2026-09-07', '2026-10-05', '2026-07-06');
ok(gapSer[3].n === null && gapSer[1].n === 0 && never.every(x => x.n === null) && never[3].state === 'EMERGING',
  'W4 a week inside a span the history fill had to skip is not watched (null); a subject never counted is unknown in every week, never a run of zeros');
let pgAsk = [];
const MP = mk({ sbRest: async (e, p) => { pgAsk.push(p); const off = parseInt((/offset=(\d+)/.exec(p) || [])[1], 10); return off === 0 ? Array(1000).fill({ a: 1 }) : off === 1000 ? Array(1000).fill({ a: 2 }) : Array(7).fill({ a: 3 }); } });
const all = await new Function('Date', 'sbRest', 'MEMORY', fnOf('memoryAll') + '; return memoryAll;')(FixedDate, async (e, p) => { pgAsk.push(p); const off = parseInt((/offset=(\d+)/.exec(p) || [])[1], 10); return off < 2000 ? Array(1000).fill(1) : Array(7).fill(1); }, M.MEMORY)({}, 'subject_weeks?x=1&order=week.asc', 20000);
ok(all.length === 2007 && pgAsk.length === 3 && /&limit=1000&offset=2000$/.test(pgAsk[2]), 'W5 a read that could pass a thousand rows is paged to the end');

// ── G: calls and grades ────────────────────────────────────────────────────
const S = (ns, states) => ns.map((n, i) => ({ week: M.memoryAddWeeks('2026-03-02', i), n, outlets: n, outlets_4w: n, state: (states || {})[i] || null, door: (states || {})[i] ? { state: states[i] } : null }));
const runs = S([1, 1, 1, 1, 1], { 1: 'EMERGING', 2: 'EMERGING', 3: 'ACCELERATING', 4: 'EMERGING' });
ok(M.memoryCalls(runs).join(',') === '1,3,4' && M.memoryCalls(S([1, 1], { 0: 'STEADY', 1: 'CONTESTED' })).length === 0, 'G1 a call is the first week of a run of the same posted state, for emerging, accelerating, structural and cooling only');
// 22 weeks from May 4: nowWeek Oct 5 is far ahead, so every horizon is in
const accel = S([2, 2, 2, 2, 2, 2, 2, 2, 5, 8, 10, 12, 14, 12, 13, 15, 9, 9, 8, 9, 9, 9, 9, 9, 9], { 11: 'ACCELERATING' });
const gA = M.gradeCall(accel, 11, 'ACCELERATING', 4, '2026-10-05'), gA90 = M.gradeCall(accel, 11, 'ACCELERATING', 13, '2026-10-05');
ok(gA.verdict === 'held' && gA.before === 2 && gA.after === 13.5 && gA90.verdict === 'held',
  'G2 accelerating holds when the pace after is at least one and a half times the pace of the eight weeks before its rise (13.5 a week against 2)');
const accelF = S([4, 4, 4, 4, 4, 4, 4, 4, 9, 12, 14, 16, 4, 5, 4, 3], { 11: 'ACCELERATING' });
ok(M.gradeCall(accelF, 11, 'ACCELERATING', 4, '2026-10-05').verdict === 'faded', 'G3 and fades when the pace falls back toward where it rose from (4 a week against 4)');
const em = S([0, 0, 0, 0, 3, 2, 0, 1, 0, 0], { 4: 'EMERGING' }), emF = S([0, 0, 0, 0, 3, 1, 0, 0, 0, 0], { 4: 'EMERGING' });
ok(M.gradeCall(em, 4, 'EMERGING', 4, '2026-10-05').verdict === 'held' && M.gradeCall(emF, 4, 'EMERGING', 4, '2026-10-05').verdict === 'faded' && M.gradeCall(em, 4, 'EMERGING', 4, '2026-10-05').active === 2,
  'G4 emerging holds with stories in at least half the weeks after; structural needs two thirds');
const st = S([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 2, 2, 0], { 12: 'STRUCTURAL' });
ok(M.gradeCall(st, 12, 'STRUCTURAL', 4, '2026-10-05').verdict === 'faded' && M.gradeCall(S([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 2, 2, 0], { 12: 'STRUCTURAL' }), 12, 'STRUCTURAL', 4, '2026-10-05').verdict === 'held',
  'G5 structural: three of four weeks after holds, two of four fades');
const cool = S([6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 2, 2, 1, 1, 2], { 11: 'COOLING' });
ok(M.gradeCall(cool, 11, 'COOLING', 4, '2026-10-05').verdict === 'held' && M.gradeCall(S([6, 6, 6, 6, 6, 6, 6, 6, 6, 4, 3, 2, 9, 9, 9, 9], { 11: 'COOLING' }), 11, 'COOLING', 4, '2026-10-05').verdict === 'faded',
  'G6 cooling holds when the pace after stays below its twelve-week average up to the call');
const recent = S([2, 2, 2, 2], { 2: 'EMERGING' }).map((x, i) => Object.assign(x, { week: M.memoryAddWeeks('2026-09-14', i) }));
const unw = S([null, null, null, null, null, null, null, null, 9, 9, 12, 14, 14, 15, 16, 14], { 11: 'ACCELERATING' });
ok(M.gradeCall(recent, 2, 'EMERGING', 4, '2026-10-05').verdict === 'open' && M.gradeCall(unw, 11, 'ACCELERATING', 4, '2026-10-05').verdict === 'unmeasured'
   && M.gradeCall(S([2, 2, 2, 2, 2, 2], { 1: 'EMERGING' }), 1, 'EMERGING', 4, '2026-03-30').verdict === 'open',
  'G7 a call is open until all its weeks after are counted and over (the current week never counts), and unmeasured when the weeks it needs were not watched');
const ga = M.gradeAll(accel, 11, '2026-10-05');
ok(ga.state === 'ACCELERATING' && ga.from === 'tile' && ga.d30.w === 4 && ga.d60.w === 9 && ga.d90.w === 13 && ga.week === accel[11].week, 'G8 a call is graded at 30, 60 and 90 days (4, 9 and 13 weeks after), and says whether a tile or the board made it');
ok(M.memoryGradeWords(ga) === 'at 90 days it held (' + ga.d90.after + ' stories a week after, 2 before)' && M.memoryGradeWords({ d30: { verdict: 'open' } }) === 'not yet graded' && M.memoryGradeWords({ d30: { verdict: 'faded', active: 1, of: 4 } }) === 'at 30 days it faded (stories in 1 of 4 weeks after)',
  'G9 a grade in words, at the furthest horizon that is in, with the numbers it stands on');

// ── C: the case windows ────────────────────────────────────────────────────
const W = (ns, o4) => ns.map((n, i) => ({ week: M.memoryAddWeeks('2026-06-15', i), n, outlets: n, outlets_4w: o4 == null ? n : o4 }));
const cE = M.caseState(W([0, 0, 0, 0, 0, 2, 1], 3), 6);
ok(cE.state === 'EMERGING' && /first seen the week of/.test(cE.why) && M.caseState(W([null, null, 0, 0, 2, 1], 3), 5).state !== 'EMERGING' && M.caseState(W([0, 0, 0, 0, 0, 2, 1], 2), 6).state !== 'EMERGING',
  'C1 emerging: first seen within four weeks, after four weeks we watched without it, with three outlets; a subject we only started watching is never called new');
const cA = M.caseState(W([1, 1, 2, 1, 1, 2, 1, 1, 4, 5, 6, 7], 5), 11);
ok(cA.state === 'ACCELERATING' && M.caseState(W([1, 1, 2, 1, 1, 2, 1, 1, 4, 5, 6, 7], 3), 11).state !== 'ACCELERATING' && M.caseState(W([1, 1, 2, 1, 1, 2, 1, 1, 2, 3, 3, 3], 5), 11).state !== 'ACCELERATING',
  'C2 accelerating: twelve or more stories in four weeks across four outlets, at least double the weekly pace of the eight before');
ok(M.caseState(W([1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1]), 11).state === 'STRUCTURAL' && M.caseState(W([1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1]), 11).state !== 'STRUCTURAL',
  'C3 structural: stories in eight of the last twelve weeks');
ok(M.caseState(W([6, 6, 6, 6, 0, 0, 6, 0, 0, 0, 1, 1]), 11).state === 'COOLING' && M.caseState(W([5, 5, 5, 5, 0, 0, 5, 0, 5, 1, 1, 1]), 11).state === 'STRUCTURAL' && M.caseState(W([0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0]), 11).state === 'STEADY',
  'C4 cooling: below its own twelve-week average three weeks running, from at least one story a week');
ok(M.caseState(W([null, null, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 11).why === 'waiting for twelve weeks watched' && M.caseState(W([null]), 0).state === null,
  'C5 a rule that needs weeks we did not watch does not call: the subject waits');
ok(M.caseLive({ CASE_WINDOWS: 'live' }) === true && M.caseLive({}) === false && M.caseLive({ CASE_WINDOWS: 'shadow' }) === false, 'C6 the windows stay in shadow until CASE_WINDOWS is set to live');

const yr = W([3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], 3);
const last = yr.length - 1;
ok(M.caseState(yr, last).state === 'EMERGING' && M.caseState(yr.slice(-16), 15).state === 'EMERGING' && M.caseState(yr.slice(-40), 39).state === 'EMERGING',
  'C7 "first seen" looks back a year from the week judged, whatever run the caller holds: the live board and the calibration call the same subject the same way');
ok(M.caseState(W([null, null, null, 1, 1, 1, 1]), 6).state === null && M.caseState(W([1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0]), 11).state === 'STEADY',
  'C8 while it waits for twelve weeks watched the windows make no call (the board keeps its own state); with the weeks in, "none of the windows" is steady');
const MCS = mk({ sbRest: async (e, p) => { if (p === 'rpc/memory_start') return '2026-01-05'; if (/^subject_weeks\?subject_key=in\./.test(p)) return [{ subject_key: 'theme:a', week: '2026-09-28', counts: { n: 2, outlets: 2, outlets_4w: 3 } }, { subject_key: 'theme:a', week: '2026-09-21', counts: { n: 2, outlets: 2, outlets_4w: 3 } }, { subject_key: 'theme:b', week: '2026-09-28', board: { state: 'EMERGING' } }]; return []; } });
const notDone = await MCS.memoryCaseStates({ RATE_LIMIT: { get: async () => JSON.stringify({ next: '2026-08-03' }), put: async () => {} } }, ['theme:a']);
const done = await MCS.memoryCaseStates({ RATE_LIMIT: { get: async k => k === 'memory:cursor:v1' ? JSON.stringify({ done: true }) : null, put: async () => {} } }, ['theme:a', 'theme:b']);
ok(notDone.size === 0 && done.get('theme:a') && done.get('theme:a').state === 'EMERGING' && !done.has('theme:b'), 'C9 the live windows call nothing until the history is filled, and never a subject that was never counted');

// ── S: what we said ────────────────────────────────────────────────────────
const items = M.memoryReadItems({ patterns: [{ name: 'Commuters buy glasses for work', dek: 'A work tool now', strength: 'signal', evidence: ['S10', 'S11', 'S12', 'x9', 'L1'] }, { name: '' }] }, 'weekly');
ok(items.length === 1 && items[0].strength === 'signal' && items[0].evidence.join(',') === 'S10,S11,S12,L1' && M.memoryReadItems({ findings: [{ name: 'F', evidence: ['T2'] }] }, 'report')[0].evidence[0] === 'T2' && M.memoryReadItems({ patterns: [{ name: 'x' }] }, 'recon').length === 0,
  'S1 the items a read says something in: the weekly\'s patterns, the monthly\'s features, the report\'s findings; a RECON has none here');
const tracksF = [{ id: 'tk1', name: 'Ray-Ban', aliases: ['Meta glasses'] }, { id: 'tk2', name: 'H&M', aliases: [] }, { id: 'tk3', name: 'LG', aliases: [] }];
const sigKey = new Map([['S10', 'th1'], ['S11', 'th1'], ['S12', 'th2'], ['L1', 'th2']]);
const subj = M.memoryItemSubjects({ name: 'Ray-Ban and H&M sell the commute', dek: 'Meta glasses at work; LG absent', evidence: ['S10', 'S11', 'S12', 'L1', 'T1'] }, sigKey, ['th9'], tracksF);
ok(subj.sort().join(',') === ['theme:th1', 'theme:th2', 'theme:th9', 'track:tk1', 'track:tk2'].sort().join(',') && M.memoryItemSubjects({ name: 'n', dek: '', evidence: ['S10', 'S12'] }, sigKey, [], []).length === 0,
  'S2 an item speaks to a theme two or more of its stories belong to, or one it cites by its T line, and to a tracked brand it names (H&M yes; a two-letter name never)');
let sPaths = [], saidPut = [], saidArgs = [];
const reads = [{ id: 31, kind: 'weekly', label: 'Week of Sep 28', version: 2, window_start: '2026-09-28', window_end: '2026-10-04' }, { id: 30, kind: 'weekly', label: 'Week of Sep 28', version: 1, window_start: '2026-09-28', window_end: '2026-10-04' }];
const MS = mk({ loadTracks: async () => tracksF, sbRest: async (e, p, o) => { sPaths.push(p);
  if (/^house_reads\?kind=in\.\(weekly,monthly,report\)&status=eq\.published&/.test(p)) return reads;
  if (/^house_reads\?id=eq\.31/.test(p)) return [{ id: 31, kind: 'weekly', label: 'Week of Sep 28', version: 2, window_start: '2026-09-28', window_end: '2026-10-04', read: { patterns: [{ name: 'Ray-Ban owns the commute', dek: 'd', strength: 'pattern', evidence: ['S10', 'S11', 'S12'] }] }, ids: null }];
  if (/^edition_items\?id=in\.\(10,11,12\)/.test(p)) return [{ id: 10, signal_id: 'aaaaaaaa-0000-0000-0000-000000000001' }, { id: 11, signal_id: 'aaaaaaaa-0000-0000-0000-000000000002' }, { id: 12, signal_id: 'aaaaaaaa-0000-0000-0000-000000000003' }];
  if (/^signals\?id=in\./.test(p)) return [{ id: 'aaaaaaaa-0000-0000-0000-000000000001', theme_id: 'th1' }, { id: 'aaaaaaaa-0000-0000-0000-000000000002', theme_id: 'th1' }, { id: 'aaaaaaaa-0000-0000-0000-000000000003', cluster_id: 'cl1' }];
  if (p === 'rpc/ledger_said_put') { saidPut.push(o.body.p_rows); saidArgs.push(o.body); return 1; }
  return []; } });
const said = await MS.memorySaid({});
const put = saidPut[0] || [];
ok(said.reads === 1 && !sPaths.some(p => /house_reads\?id=eq\.30/.test(p)) && !sPaths.some(p => /recon/.test(p)) && put.length === 2 && put.map(r => r.subject_key).sort().join(',') === 'theme:th1,track:tk1'
   && saidArgs[0].p_entry === 'weekly:2026-09-28' && saidArgs[0].p_week === '2026-09-28' && !sPaths.some(p => /status=in\.\(ready/.test(p))
   && put[0].week === '2026-09-28' && put[0].said['weekly:2026-09-28'].read_id === 31 && put[0].said['weekly:2026-09-28'].items[0].name === 'Ray-Ban owns the commute' && put.find(r => r.kind === 'track').title === 'Ray-Ban',
  'S3 what a published read said is filed under each subject\'s week, keyed by the read so a new version replaces its own entry and leaves the subjects it dropped; only the newest published version is read (never a draft), and a RECON is never asked for');

// ── B: the brief a read is handed ─────────────────────────────────────────
const bRows = [{ subject_key: 'theme:th1', week: '2026-09-14', title: 'Glasses at work', counts: { n: 4 } }, { subject_key: 'theme:th1', week: '2026-09-21', counts: { n: 9 }, door: { label: 'Smart glasses at work', state: 'ACCELERATING', claim: 'Commuters are buying glasses for the office.' }, grade: { state: 'ACCELERATING', d30: { verdict: 'open' } } },
  { subject_key: 'theme:th1', week: '2026-09-28', counts: { n: 14 }, said: { 'weekly:2026-09-28': { kind: 'weekly', label: 'Week of Sep 28', items: [{ name: 'Ray-Ban owns the commute' }] } } }];
const line = M.memoryBriefLine(1, 'theme:th1', bRows, '2026-07-06', '2026-10-05');
ok(/^M1 \| Smart glasses at work \| stories a week from the week of Jul 13, oldest first \(exact\): 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 9, 14 \| we said: the Weekly Read, Week of Sep 28: "Ray-Ban owns the commute" \/ on the board the week of Sep 21 \(accelerating\): "Commuters are buying glasses for the office\."; not yet graded$/.test(line) && line.length <= 620,
  'B1 an M line: the subject, its exact stories a week (the last twelve complete weeks), what we said newest first, and how each call graded');
let bAsk = [];
const MB = mk({ sbRest: async (e, p) => { bAsk.push(p); if (p === 'rpc/memory_start') return '2026-07-06'; if (/^subject_weeks\?subject_key=in\./.test(p)) return bRows; return []; } });
const benv = { RATE_LIMIT: { get: async k => k === 'memory:cursor:v1' ? JSON.stringify({ done: true }) : null, put: async () => {} } };
const brief = await MB.memoryBrief(benv, ['theme:th1', 'cohort:self:gen:gen_z', 'theme:th1', 'track:none']);
ok(/^WHAT WE SAID \(1 M lines: our own earlier lines on the subjects in this pack, with their exact stories a week and how each call graded; our record, never evidence for a fact\):\nM1 \| Smart glasses at work \| stories a week/.test(brief) && brief.length <= 4200 && bAsk.filter(p => /^subject_weeks/.test(p)).length === 1 && !bAsk.some(p => /cohort/.test(decodeURIComponent(p))),
  'B2 the brief: one line per subject that has a record (at most eight, at most 4,200 characters), themes and brands only, in one read of the ledger');
const db = await MB.memoryDoorBriefs(benv, ['theme:th1']);
ok(/^stories a week from the week of Jul 13/.test(db.get('theme:th1')) && !/^M1/.test(db.get('theme:th1')), 'B3 a tile read gets its own subject\'s line, unnumbered');
const keysAsk = [];
const MK = mk({ loadTracks: async () => [{ id: 'tk1', name: 'Nike', aliases: [] }], sbRest: async (e, p) => { keysAsk.push(p); return /^signals\?id=in\./.test(p) ? [{ id: 'a', theme_id: 't1' }, { id: 'b', theme_id: 't1' }, { id: 'c', theme_id: 't2' }] : []; } });
const rk = await MK.memoryReadKeys({}, [{ signal_id: 'aaaaaaaa-0000-0000-0000-00000000000a', headline: 'Nike runs' }, { signal_id: 'aaaaaaaa-0000-0000-0000-00000000000b', headline: 'Nike again' }, { signal_id: 'aaaaaaaa-0000-0000-0000-00000000000c', headline: 'x' }], { themes: [{ id: 'r1' }] });
ok(rk.join(',') === 'theme:r1,theme:t1,track:tk1', 'B4 a read\'s subjects: the report\'s own themes, then the themes two or more of its stories belong to, then a brand two of its headlines name');

// ── T: the timeline ────────────────────────────────────────────────────────
const tl = M.timelineOf('theme:th1', bRows, '2026-07-06', '2026-10-05');
ok(tl.ok && tl.title === 'Smart glasses at work' && tl.first === '2026-09-14' && tl.weeks[0].week === '2026-08-31' && tl.weeks.length === 6 && tl.weeks[2].board === null && tl.weeks[3].board.state === 'ACCELERATING' && tl.weeks[3].posted.claim === 'Commuters are buying glasses for the office.'
   && tl.weeks[4].said[0].name === 'Ray-Ban owns the commute' && tl.weeks[5].partial === true && tl.weeks[5].n === 0 && tl.stories === 27 && tl.board_weeks === 1 && tl.weeks[3].grade.d30.verdict === 'open',
  'T1 a timeline: from two weeks before the first story to now, every week its exact stories, the weeks on the board with what the tile said, what our reads said, how the call graded; the current week marked as partial');
ok(M.timelineOf('theme:th1', [], '2026-07-06', '2026-10-05').empty === true, 'T2 a subject with no record says so');
let tlKv = {}, tlAsk = [];
const MT = mk({ sbRest: async (e, p) => { tlAsk.push(p); if (p === 'rpc/memory_start') return '2026-07-06'; if (/^subject_weeks\?subject_key=eq\./.test(p)) return bRows; return []; } });
const tenv = { RATE_LIMIT: { get: async k => tlKv[k] || null, put: async (k, v) => { tlKv[k] = v; }, delete: async () => {} } };
tlAsk = []; const tFill = await MT.excavateTimeline(new Request('https://x/excavate/timeline?key=theme:aaaaaaaa-0000-0000-0000-000000000001'), tenv, '');
const filling = tFill.ok && !tFill.empty && !Object.keys(tlKv).some(k => /^tl:/.test(k));   // the history is still filling: answered, not kept
tlKv['memory:cursor:v1'] = JSON.stringify({ done: true, weeks: 13 });
const tBad = await MT.excavateTimeline(new Request('https://x/excavate/timeline?key=cohort:self:gen:gen_z'), tenv, '');
const t1 = await MT.excavateTimeline(new Request('https://x/excavate/timeline?key=THEME:AAAAAAAA-0000-0000-0000-000000000001'), tenv, '');
tlAsk = []; const t2 = await MT.excavateTimeline(new Request('https://x/excavate/timeline?key=theme:aaaaaaaa-0000-0000-0000-000000000001'), tenv, '');
ok(filling && tBad.error === 'bad_key' && t1.ok && !t1.cached && t2.cached === true && tlAsk.length === 0 && tlKv['tl:v1:theme:aaaaaaaa-0000-0000-0000-000000000001'],
  'T3 GET /excavate/timeline takes a theme or a brand (never an audience group or anything else), kept six hours once the history is filled, never while it fills');

const paid = M.timelineOf('theme:th1', [{ week: '2026-09-28', counts: { n: 3 }, said: { 'report:2026-09-01': { kind: 'report', label: 'September 2026', items: [{ name: 'Paid finding', dek: 'Paid dek' }, { name: 'Two' }] }, 'weekly:2026-09-28': { kind: 'weekly', label: 'Week of Sep 28', items: [{ name: 'Free pattern', dek: 'd' }] } } }], '2026-07-06', '2026-10-05');
const pw = paid.weeks.find(x => x.week === '2026-09-28'), pj = JSON.stringify(paid);
ok(!/Paid finding|Paid dek/.test(pj) && pw.said.some(x => x.kind === 'report' && x.name === null && x.findings === 2 && x.label === 'September 2026') && pw.said.some(x => x.name === 'Free pattern') && paid.title === 'Free pattern',
  'T4 a history names a paid issue and how many of its findings speak to the subject, never their words; the free weekly\'s words are shown, and name the subject when nothing else does');
let eKv = {};
const ME = mk({ sbRest: async (e, p) => p === 'rpc/memory_start' ? '2026-07-06' : [] });
const te = await ME.excavateTimeline(new Request('https://x/excavate/timeline?key=theme:aaaaaaaa-0000-0000-0000-00000000000f'), { RATE_LIMIT: { get: async k => eKv[k] || null, put: async (k, v) => { eKv[k] = v; } } }, '');
ok(te.ok && te.empty && !Object.keys(eKv).some(k => /^tl:/.test(k)), 'T5 a subject with no record is answered, and the answer is not kept (a made-up id costs one read, never a stored copy)');
let nKv = {}, nAsk = [];
const MN = mk({ sbRest: async (e, p) => { nAsk.push(p); return p === 'rpc/memory_start' ? null : []; } });
const tn = await MN.excavateTimeline(new Request('https://x/excavate/timeline?key=theme:aaaaaaaa-0000-0000-0000-00000000000e'), { RATE_LIMIT: { get: async k => nKv[k] || null, put: async (k, v) => { nKv[k] = v; } } }, '');
const pageSrc = fs.readFileSync('intelligence/index.html', 'utf-8');
ok(tn.ok === false && tn.error === 'not_counted' && !nAsk.some(p => /^subject_weeks/.test(p)) && !Object.keys(nKv).some(k => /^tl:/.test(k))
   && /j && j\.error === 'not_counted' \? 'This history is still being filled\. Look again later today\.'/.test(pageSrc) && /tl && tl\.error === 'not_counted' \? 'This record is still being filled\. Look again later today\.'/.test(pageSrc),
  'T6 before the memory has run, a history says it is being filled (never "did not answer", never an empty record), reads nothing and keeps nothing');
ok(M.memoryBriefLine(1, 'theme:x', [{ week: '2026-09-28', counts: { n: 3 } }], '2026-07-06', '2026-10-05') === '' && /^M1 \| Free pattern \|/.test(M.memoryBriefLine(1, 'theme:x', [{ week: '2026-09-21', counts: { n: 3 } }, { week: '2026-09-28', counts: { n: 3 }, said: { w: { kind: 'weekly', label: 'L', items: [{ name: 'Free pattern' }] } } }], '2026-07-06', '2026-10-05')),
  'B5 a subject we never named is left out of the brief (never a headline, never an id); one our weekly named takes that name');

// ── R: the record ──────────────────────────────────────────────────────────
const recRows = [
  { subject_key: 'theme:a', week: '2026-08-17', label: 'Presales clear first', grade: { state: 'EMERGING', d30: { verdict: 'held', active: 3, of: 4 }, d60: { verdict: 'held' }, d90: { verdict: 'open' } } },
  { subject_key: 'theme:b', week: '2026-08-24', title: 'Ad fatigue', grade: { state: 'ACCELERATING', d30: { verdict: 'faded', after: 2, before: 3 }, d60: { verdict: 'faded' } } },
  { subject_key: 'theme:c', week: '2026-09-28', label: 'Glasses at work', grade: { state: 'ACCELERATING', d30: { verdict: 'open' } } },
  { subject_key: 'theme:d', week: '2026-09-21', grade: { state: 'STRUCTURAL', d30: { verdict: 'open' } } },
  { subject_key: 'theme:e', week: '2026-08-10', label: 'x', grade: { state: 'EMERGING', d30: { verdict: 'unmeasured' } } },
  { subject_key: 'theme:f', week: '2026-08-10', label: 'y', grade: { state: 'STEADY', d30: { verdict: 'held' } } }];
const MR = mk({ sbRest: async (e, p) => /^subject_weeks\?grade=not\.is\.null/.test(p) ? recRows : [] });
const rec = await MR.memoryRecord({});
ok(rec.counts.held === 1 && rec.counts.faded === 1 && rec.counts.open === 2 && rec.counts.unmeasured === 1 && rec.held[0].title === 'Presales clear first' && rec.faded[0].title === 'Ad fatigue' && rec.open.length === 1 && rec.d60.held === 1 && rec.d60.faded === 1 && rec.next_due === '2026-10-26',
  'R1 the record: every call of the last 150 days at 30 days (held, faded, open), how many held at 60 and 90 days, when the next one comes due; an untitled call is counted, not shown; an unmeasured call is set apart');

// ── H: grades written, history filled, the daily run ──────────────────────
const gRows = accel.map(x => ({ subject_key: 'theme:g1', week: x.week, counts: { n: x.n, outlets: x.n }, door: x.state ? { state: x.state } : null })).map(r => Object.assign(r, { week: r.week }));
// move the run so the call sits inside the last 150 days: weeks ending Oct 5
const shift = gRows.map((r, i) => Object.assign({}, r, { week: M.memoryAddWeeks('2026-04-20', i) }));
shift.push({ subject_key: 'theme:g1', week: '2026-10-05', counts: { n: 3 } });
shift[3] = Object.assign({}, shift[3], { grade: { state: 'EMERGING', d30: { verdict: 'held' } } });   // a stale grade on a week that is no longer a call
let gPut = [];
const MG = mk({ sbRest: async (e, p) => { if (p === 'rpc/memory_start') return '2026-03-02'; if (/^subject_weeks\?week=gte\./.test(p)) return [{ subject_key: 'theme:g1' }, { subject_key: 'cohort:x' }]; if (/^subject_weeks\?subject_key=in\./.test(p)) return shift; return []; },
  ledgerPut: async (e, col, r) => { gPut.push({ col, r }); return r.length; } });
const genv = { RATE_LIMIT: { get: async k => k === 'memory:cursor:v1' ? JSON.stringify({ done: true }) : null, put: async () => {} } };
const gr = await MG.memoryGrade(genv);
const gw = gPut[0] ? gPut[0].r : [];
ok(/or=\(door->>state\.in\.\(' \+ st \+ '\),board->>state\.in\.\(' \+ st \+ '\),grade\.not\.is\.null\)/.test(fnOf('memoryGrade')) && gr.calls === 1 && gPut[0].col === 'grade' && gw.find(r => r.week === shift[11].week).data.state === 'ACCELERATING' && gw.find(r => r.week === shift[11].week).data.d30.verdict === 'held' && gw.find(r => r.week === shift[3].week).data === null,
  'G10 the grader writes each recent call\'s grades (only when they changed) and takes the grade off a week that is no longer a call');
const s2 = shift.map(r => r.week === shift[11].week ? Object.assign({}, r, { grade: gw.find(x => x.week === shift[11].week).data }) : r.week === shift[3].week ? Object.assign({}, r, { grade: null }) : r);
gPut = []; const MG2 = mk({ sbRest: async (e, p) => { if (p === 'rpc/memory_start') return '2026-03-02'; if (/^subject_weeks\?week=gte\./.test(p)) return [{ subject_key: 'theme:g1' }]; if (/^subject_weeks\?subject_key=in\./.test(p)) return s2; return []; }, ledgerPut: async (e, col, r) => { gPut.push({ col, r }); return r.length; } });
const gr2 = await MG2.memoryGrade(genv);
ok(gr2.graded === 0 && !gPut.length, 'G11 a grade that did not change is not written again');
// history: newest first, in spans, a failing span retried then skipped, a cursor that resumes
let hKv = {}, hCalls = [], failFrom = null, hTries = 0;
const MH = mk({ loadTracks: async () => [{ id: 'k1' }, { id: 'k2' }], sbRest: async (e, p, o) => { if (p === 'rpc/memory_start') return '2026-07-06';
  if (p === 'rpc/memory_count_weeks') { hCalls.push(o.body); if (failFrom && o.body.p_from === failFrom) { hTries++; throw new Error('sb_500'); } return 3; } return []; } });
const henv = { RATE_LIMIT: { get: async k => hKv[k] || null, put: async (k, v) => { hKv[k] = v; } } };
const h1 = await MH.memoryBackfill(henv, 60000);
const spans = hCalls.filter(c => c.p_kind === 'theme').map(c => c.p_from + '..' + c.p_to);
ok(h1.done && spans.join(' ') === '2026-08-31..2026-09-21 2026-08-03..2026-08-24 2026-07-06..2026-07-27' && h1.weeks === 12 && hCalls.filter(c => c.p_kind === 'track').every(c => c.p_ids.length === 2) && hCalls.every(c => /^\d{4}-\d{2}-\d{2}$/.test(c.p_from)),
  'H1 history is filled newest first in four-week spans, back to the first week the sweep counted (theme, territory and brands, forty brands a call); the last two weeks are the daily run\'s');
hKv = {}; hCalls = []; failFrom = '2026-08-03'; hTries = 0;
const h2 = await MH.memoryBackfill(henv, 60000), c2 = JSON.parse(hKv['memory:cursor:v1']);
ok(!h2.done && c2.next === '2026-08-24' && c2.tries === 1, 'H2 a span that fails is tried again on the next run, from where it stopped');
await MH.memoryBackfill(henv, 60000); const h4 = await MH.memoryBackfill(henv, 60000), c4 = JSON.parse(hKv['memory:cursor:v1']);
ok(h4.done && c4.skipped.join(',') === '2026-08-03..2026-08-24' && c4.done === true, 'H3 a span that keeps failing is skipped after three runs, and the skip is kept on the cursor');
ok((await MH.memoryCounted(henv)) === '2026-07-06' && (await mk({ sbRest: async (e, p) => p === 'rpc/memory_start' ? '2026-07-06' : [] }).memoryCounted({ RATE_LIMIT: { get: async () => null, put: async () => {} } })) === '2026-09-28',
  'H4 a week with no row counts as zero only once it was counted: all of history when the fill is done, the last two weeks before it starts');
hKv = { 'memory:cursor:v1': JSON.stringify({ done: true, next: '2026-06-29', weeks: 12, skipped: ['2026-08-03..2026-08-24', '2026-07-06..2026-07-27'] }) }; hCalls = []; failFrom = null;
const hr = await MH.memoryBackfill(henv, 60000), cr = JSON.parse(hKv['memory:cursor:v1']);
const watch = await MH.memoryWatch(henv);
ok(hr.retried === '2026-08-03..2026-08-24' && hr.filled && cr.skipped.join(',') === '2026-07-06..2026-07-27' && watch.done && watch.gaps.has('2026-07-13') && !watch.gaps.has('2026-08-10'),
  'H10 once the rest is in, a skipped span is tried again, one a run, and leaves the gaps when it is counted');

// the tiles before the ledger, once
let dPut = [], dKv = {};
const MD = mk({ sbRest: async (e, p) => { if (/^door_reads\?status=in\.\(ready,reused\)&select=night/.test(p)) return [{ night: '2026-09-15' }, { night: '2026-09-17' }, { night: '2026-09-23' }];
  if (/^door_reads\?status=in\.\(ready,reused\)&night=gte\./.test(p)) return [
    { id: 'd1', frame_key: 'theme:t1', night: '2026-09-15', status: 'ready', frame: { entity: 'Glasses' }, measures: { recent_7d: 3, state: 'EMERGING' }, claim: 'old claim', move: 'm', question: 'q', voices: [] },
    { id: 'd2', frame_key: 'theme:t2', night: '2026-09-15', status: 'ready', frame: { entity: 'Presales' }, measures: { recent_7d: 9, state: 'ACCELERATING' }, claim: 'c2', voices: [] },
    { id: 'd3', frame_key: 'theme:t1', night: '2026-09-17', status: 'reused', frame: { entity: 'Glasses' }, measures: { recent_7d: 4, state: 'ACCELERATING' }, claim: 'new claim', voices: [{ self: { generation: 'Gen Z' } }] },
    { id: 'd4', frame_key: 'track:k1', night: '2026-09-23', status: 'ready', frame: { entity: 'Nike' }, measures: { recent_7d: 1 }, claim: 'nike', voices: [] }];
  return []; }, ledgerPut: async (e, col, r) => { dPut.push({ col, r }); return r.length; } });
const denv = { RATE_LIMIT: { get: async k => dKv[k] || null, put: async (k, v) => { dKv[k] = v; } } };
const d1 = await MD.memoryDoorBackfill(denv), dr = dPut[0].r;
const t1w = dr.find(r => r.subject_key === 'theme:t1' && r.week === '2026-09-14');
ok(d1.done && dPut[0].col === 'door' && dr.length === 3 && t1w.data.claim === 'new claim' && t1w.data.state === 'ACCELERATING' && t1w.data.voices.n === 1 && dr.find(r => r.subject_key === 'theme:t2').data.rank === 1 && dr.find(r => r.subject_key === 'track:k1').kind === 'track' && dr.find(r => r.subject_key === 'track:k1').data.state === 'STEADY',
  'H5 the board\'s tiles before the ledger, from the stored tile reads: each subject\'s last tile of each week, ranked as that night\'s board ranked it, with its state, claim and voice counts');
dPut = []; const d2 = await MD.memoryDoorBackfill(denv);
ok(d2.skipped && !dPut.length, 'H6 and only once');
let cPut = [];
const MC = mk({ sbRest: async (e, p, o) => { if (/^cluster_calls\?/.test(p)) return [{ cluster_id: 'c1', state: 'EMERGING', called_at: '2026-08-12T00:00:00Z' }, { cluster_id: 'c2', state: 'ACCELERATING', called_at: '2026-08-19T00:00:00Z' }];
  if (/^subject_weeks\?subject_key=in\./.test(p)) return [{ subject_key: 'theme:c2', week: '2026-08-17' }];
  if (/^subject_weeks\?on_conflict=subject_key,week/.test(p)) { cPut.push(o.body); return null; } return []; } });
const cb = await MC.memoryCallsBackfill({ RATE_LIMIT: { get: async () => null, put: async () => {} } });
ok(cb.weeks === 1 && cPut[0].length === 1 && cPut[0][0].subject_key === 'theme:c1' && cPut[0][0].week === '2026-08-10' && cPut[0][0].board.from === 'scoreboard' && !('title' in cPut[0][0]),
  'H7 the scoreboard\'s earlier calls become the board column of their week, never over a week the board already wrote, never touching a title');
// the daily run
let yAsk = [];
const MY = mk({ loadTracks: async () => [{ id: 'k1', created_at: '2026-01-01T00:00:00Z' }, { id: 'k9', created_at: '2026-10-06T00:00:00Z' }], sbRest: async (e, p, o) => { yAsk.push({ p, b: o && o.body });
  if (p === 'rpc/memory_start') return '2026-07-06'; if (p === 'rpc/memory_count_weeks') return 1;
  if (/^subject_weeks\?kind=eq\.theme&first_at=gte\./.test(p)) return [{ subject_key: 'theme:aaaaaaaa-0000-0000-0000-000000000001' }, { subject_key: 'theme:bad' }];
  if (/^themes\?updated_at=gte\./.test(p)) return [{ id: 'gr0wn000-0000-0000-0000-000000000001' }];
  return []; } });
const yenv = { RATE_LIMIT: { get: async k => k === 'memory:door:v1' || k === 'memory:calls:v1' || k === 'memory:said:v1' ? 'x' : k === 'memory:cursor:v1' ? JSON.stringify({ done: true }) : null, put: async () => {}, delete: async () => {} } };
const y = await MY.memoryDaily(yenv);
const yc = yAsk.filter(a => a.p === 'rpc/memory_count_weeks').map(a => a.b);
ok(yc.filter(b => b.p_kind === 'theme' && !b.p_ids).map(b => b.p_from + '..' + b.p_to).join(' ') === '2026-07-20..2026-08-10 2026-08-17..2026-09-07 2026-09-14..2026-10-05' && yc.some(b => b.p_kind === 'track' && b.p_from === '2026-09-07' && b.p_to === '2026-10-05' && b.p_ids.join(',') === 'k1,k9')
   && yc.filter(b => b.p_kind === 'track' && b.p_ids.join(',') === 'k9').map(b => b.p_from + '..' + b.p_to).join(' ') === '2026-07-06..2026-08-31'
   && yc.filter(b => b.p_kind === 'theme' && b.p_ids).map(b => b.p_from + '..' + b.p_to + ':' + b.p_ids.join('+')).join(' ') === '2026-07-06..2026-07-13:aaaaaaaa-0000-0000-0000-000000000001+gr0wn000-0000-0000-0000-000000000001'
   && yAsk.some(a => /^themes\?updated_at=gte\.[^&]+&n=eq\.3&/.test(a.p)) && y.history.done && y.grades && y.said,
  'H8 the daily run: themes and territories recounted twelve weeks back, every brand five, and a whole history (ten weeks a call, up to the weeks the daily count holds) for a brand added in the last three days, a theme the board showed and a theme that just reached three stories; then what the reads said, history and grades');
ok((await mk({ sbRest: async () => null }).memoryDaily({ RATE_LIMIT: { get: async () => null, put: async () => {} } })).error === 'no_start', 'H9 before migration 0040 the daily run does nothing and says why');

// ── K: brands, exact ───────────────────────────────────────────────────────
const roomSrc = between(w, 'const BRAND_ROOM = {', 'async function excavateTrackAdd(');
const cf = new Function(roomSrc.replace(/async function[\s\S]*$/, '') + '; return brandCoverageFrom;')();
const cv = cf({ weeks: [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5], outlets: [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3], outlets84: 6 }, NOW);
ok(cv.exact && cv.at_least === false && cv.this_week === 5 && cv.prior_week === 4 && cv.total === 15 && cv.outlets === 6 && cv.weeks[11].outlets === 3 && cv.weeks[0].start === new Date(NOW - 84 * day).toISOString().slice(0, 10),
  'K1 a brand room\'s twelve weeks come from the database, exact: never "at least"');
const br = fnOf('brandRoom'), tr = fnOf('tracksRefresh');
ok(/rpc\/track_rollup', \{ method: 'POST', body: \{ p_ids: \[t\.id\] \}/.test(br) && /if \(!cov && rows\) cov = brandCoverage\(rows, now\);/.test(br) && /\(cov \? BRAND_ROOM\.STORY_ROWS : BRAND_ROOM\.ROWS\)/.test(br) && /rpc\/track_rollup/.test(tr) && !/'signals\?select=/.test(tr) && /const w = lakeWhen\(r\) \? sweepWhen\(r\) : null;/.test(fnOf('brandWeeks')),
  'K2 the room asks the database for its weeks and reads only the latest stories (the capped read is the fallback); the brand list never scans a brand; the fallback follows the same counting rule');

// ── Z: wiring, migration, seams ────────────────────────────────────────────
ok(/\.then\(\(\) => memoryDaily\(env\)\)   \/\/ SEAM:MEMORY/.test(w) && /which === 'memory' \? await memoryDaily\(env, \{ budgetMs: 60000 \}\) : which === 'windows' \? await memoryWindows\(env\)/.test(w) && /if \(path === '\/excavate\/timeline' && request\.method === 'GET'\) return excavateTimeline\(request, env, origin\);/.test(w),
  'Z1 the daily run after the board\'s pass, the desk\'s {run: memory} and {run: windows}, the timeline\'s door');
ok(/\(memo \? '\\n\\n' \+ memo : ''\) \+   \/\/ SEAM:MEMORY/.test(w) && /memoryReadBrief\(env, items, stats\)/.test(w) && /prompt: excDoorPrompt\(frame, evidence, measures, memo\.get\(cand\.key\) \|\| ''\)/.test(w) && /WHAT WE SAID BEFORE \(our own earlier lines on this subject/.test(fnOf('excDoorPrompt')),
  'Z2 every read and every tile read is handed what we said before on its subjects, after its evidence and never as evidence');
ok(/- \*\*WHAT WE SAID\*\* \(M\), when given: our own earlier lines/.test(method) && /Version 4\.2, the house style\./.test(method) && /stands on eight weeks or more of these counts/.test(method) && !/[\u2014\u2013]/.test(method.split('- **WHAT WE SAID**')[1].split('\n')[0]),
  'Z3 the Method (4.2) reads the M lines: our record, never evidence; say plainly when we changed our mind; a direction stands on eight weeks or more');
ok(/typeof caseLive === 'function' && caseLive\(env\) && themes\.length/.test(w) && /typeof caseLive === 'function' && caseLive\(env\) && tiles\.length/.test(w) && /t\.state !== 'CONTESTED'/.test(w),
  'Z4 the case windows reach the board and the tiles only when live; a contested subject stays contested');
ok(/try \{ out\.record = await memoryRecord\(env\); \}/.test(fnOf('doorExtras')) && !/cluster_calls\?called_at/.test(fnOf('doorExtras')), 'Z5 the arrival\'s record is the graded calls, never the board-presence outcomes');
ok(/set lock_timeout = '5s';/.test(mig) && (mig.match(/s\.research = false and s\.status <> 'rejected'/g) || []).length === 4 && /cross join \(values \(0\), \(7\), \(14\), \(21\)\) as g\(d\)/.test(mig) && /case when a\.kind = 'theme' then null else left\(a\.title, 160\) end/.test(mig) && /revoke all on function public\.memory_count_weeks\(date, date, text, uuid\[\]\) from public, anon, authenticated;/.test(mig) && /grant execute on function public\.track_rollup\(uuid\[\], timestamptz\) to service_role;/.test(mig)
   && /check \(kind in \('theme', 'track', 'cohort', 'field', 'territory'\)\)/.test(mig) && /on conflict \(subject_key, week\) do update\s+set said = coalesce\(public\.subject_weeks\.said, '\{\}'::jsonb\) \|\| excluded\.said/.test(mig) && fs.existsSync('supabase/tests/0040_memory.test.mjs'),
  'Z6 the migration counts the sweep only and never a rejected story (all four reads) in one linear pass, never names a theme by a headline, is the service role\'s alone, waits five seconds at most for a lock and merges what reads said; a Postgres test ships beside it (supabase/tests, run by hand: it needs PGlite)');
ok(seams.registry['SEAM:MEMORY'] && seams.registry['SEAM:MEMORY'].file === 'worker/src/index.js' && /never a RECON/.test(seams.registry['SEAM:MEMORY'].purpose), 'Z7 the seam is registered');
const memVisible = memSrc.match(/'[^'\n]*'/g).join(' ');
ok(!/[\u2014\u2013]/.test(memSrc) && !/\b(lake|overnight|signal)\b/i.test((fnOf('memoryBriefLine') + fnOf('memoryGradeWords')).match(/'[^'\n]*'/g).join(' ')), 'Z8 no dash in the section, no machinery word in what a read is told');
console.log('\nproof_memory: ' + pass + ' checks PASS');
