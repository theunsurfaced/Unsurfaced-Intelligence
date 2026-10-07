/**
 * proof_read_engine.mjs  --  executable proof for SEAM:READ_ENGINE + SEAM:PROMPT_SYNC.
 * Drives the EXACT shipped block with stubbed Supabase and the doc tier.
 *   W  window law: weekly snaps Mon-Sun, monthly snaps to the month, archive spans
 *   V  landing law: numbers only from evidence, evidence ids from the pack, em dashes out
 *   S  submit: Method as cached system prompt, contract per kind, pack as S-ids, lifecycle
 *   L  land: valid read is ready, invented number is held
 *   C  children first: a monthly waits while a weekly inside it is busy
 *   D  wiring: drain lands house jobs, cron ticks, router, Method in sync
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const a = w.indexOf('/* SEAM:READ_ENGINE: the house read compiler');
const b = w.indexOf('/* SEAM:ARCHIVE');
ok(a > 0 && b > a, 'D0 engine block located before the archive seam');
const block = w.slice(a, b);
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';

let sb = [], fixtures = {}, submits = [], subResult = null;
const sbRest = async (env, path, opts) => {
  sb.push({ path, opts });
  for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts);
  if (opts && opts.method === 'POST' && path.startsWith('house_reads')) return opts.body.map((r, i) => Object.assign({ id: 500 + i }, r));
  return [];
};
const claudeBatchSubmit = async (env, tier, kind, items) => { submits.push({ tier, kind, items }); return subResult || { ok: true, batch_id: 'msgbatch_T', n: 1, est_usd: 0.3 }; };
const claudeBatchDrain = async () => ({ skipped: 'none_open' });
const json = (o, s) => Object.assign({ _status: s }, o);
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent',
  trim + pmj + block + '; return { READ_METHOD, READ_CONTRACT, HOUSE_READ, readWindow, readWeeksBetween, readMonthsBetween, readPackLine, readValidate, readSubmit, readLand, readTick, readChildrenSettled, readRoute };')(
  sbRest, claudeBatchSubmit, claudeBatchDrain, async (e, u) => u === 'admin', json, () => Promise.resolve());

// ── W: windows ─────────────────────────────────────────────────────────
const now = new Date('2026-09-25T15:00:00Z');   // a Friday
const wk = R.readWindow('weekly', null, now);
ok(wk.start === '2026-09-14' && wk.end === '2026-09-20' && wk.label === 'Week of Sep 14, 2026', 'W1 default weekly is the last completed Monday-Sunday week');
const w2 = R.readWindow('weekly', '2026-09-24');
ok(w2.start === '2026-09-21' && w2.end === '2026-09-27', 'W2 any date snaps to its Monday');
const mo = R.readWindow('monthly', null, now);
ok(mo.start === '2026-08-01' && mo.end === '2026-08-31' && mo.label === 'August 2026', 'W3 default monthly is the last completed month');
ok(R.readWindow('monthly', '2026-02').end === '2026-02-28', 'W4 month end is real (February)');
const weeks = R.readWeeksBetween('2026-07-08', '2026-09-25'), months = R.readMonthsBetween('2026-07-08', '2026-09-25');
ok(weeks.length === 12 && weeks[0].start === '2026-07-06' && weeks[11].start === '2026-09-21', 'W5 archive spans 12 weeks, first Jul 6, last Sep 21');
ok(months.length === 3 && months.map(m => m.label).join('|') === 'July 2026|August 2026|September 2026', 'W6 archive spans July, August, September');

// ── V: landing law ─────────────────────────────────────────────────────
const ground = JSON.stringify({ stories: 84, by_territory: { music: 14 } }) + '\nSabrina sold 2,400 tickets in 9 minutes 2026-09-21';
const good = { title: 'Fans pay for proximity', thesis: 'Music led with 14 stories.', patterns: [{ name: 'Proximity', what_happened: 'She sold 2,400 tickets (S11, S12).',
  evidence: ['S11', 'S99'], moves: { creative: 'Cut a 15-second vertical.' } }], note: 'x — y' };
const v1 = R.readValidate('weekly', good, ground, [11, 12]);
ok(v1.fatal.length === 0, 'V1 numbers present in stats or stories pass (84, 14, 2,400)');
ok(v1.read.patterns[0].evidence.join() === 'S11' && v1.notes.includes('evidence_ids_dropped:1'), 'V2 evidence ids outside the pack are dropped and noted');
ok(v1.read.note === 'x: y' && v1.notes.includes('em_dashes_replaced:1'), 'V3 em dashes replaced and noted');
ok(!v1.fatal.some(f => /moves/.test(f)), 'V4 moves may carry craft numbers ("15-second")');
const v2 = R.readValidate('weekly', { title: 't', thesis: 'Streaming grew 47% this week.' }, ground, []);
ok(v2.fatal.some(f => /number_not_in_evidence:thesis:47/.test(f)), 'V5 an invented number is fatal');
ok(R.readValidate('weekly', { thesis: 'x' }, ground, []).fatal.includes('missing_title_or_thesis'), 'V6 missing title is fatal');
ok(R.readValidate('weekly', null, ground, []).fatal.includes('unparsable'), 'V7 unparsable output is fatal');

// ── S: submit ──────────────────────────────────────────────────────────
const stats = { stories: 2, issues: { first: 70, last: 71 }, by_territory: { music: 2 } };
const items = [{ id: 11, edition_id: 1, headline: 'Tour sells out', take: 'Proximity sells. It sells fast.', apply: '[marketer] Price the room.', territory: 'music', source_name: 'Billboard' },
               { id: 12, edition_id: 2, headline: 'Merch drop', take: 'Merch is the ticket now.', apply: null, territory: 'music', source_name: 'Pitchfork' }];
function setFixtures(rowStatus) {
  fixtures = {
    'rpc/house_read_stats': () => stats,
    'editions?status=eq.published&date=': () => [{ id: 1, issue_no: 70, date: '2026-09-14' }, { id: 2, issue_no: 71, date: '2026-09-15' }],
    'edition_items?edition_id=in.': () => items.map(x => Object.assign({}, x)),
    'house_reads?id=eq.': () => [{ id: 9, kind: 'weekly', status: rowStatus, window_start: '2026-09-14', window_end: '2026-09-20', stats, pack_ids: [11, 12], label: 'Week of Sep 14, 2026', meta: {} }],
  };
}
setFixtures('queued'); sb = []; submits = [];
const row = { id: 9, kind: 'weekly', version: 1, window_start: '2026-09-14', window_end: '2026-09-20', label: 'Week of Sep 14, 2026', meta: {} };
const s1 = await R.readSubmit({}, row);
ok(s1.ok && s1.stories === 2, 'S1 weekly submitted with its stories');
const it = submits[0].items[0];
ok(submits[0].tier === 'doc' && submits[0].kind === 'house_weekly', 'S2 doc tier (Fable), kind house_weekly');
ok(it.cache === true && it.system.startsWith(R.READ_METHOD) && it.system.includes('CONTRACT (weekly)'), 'S3 Method is the cached system prompt, weekly contract follows');
ok(/^[a-zA-Z0-9_-]{1,64}$/.test(it.custom_id) && it.meta.house_read_id === 9, 'S4 custom_id is batch-legal and carries the read id');
ok(it.prompt.includes('STATS (exact, computed by the database)') && it.prompt.includes('S11 | 2026-09-14 | #070 | music | Tour sells out'), 'S5 pack cites stories as S-ids with date, issue, territory');
const patch1 = sb.find(x => x.opts && x.opts.method === 'PATCH');
ok(patch1.opts.body.status === 'compiling' && patch1.opts.body.pack_ids.join() === '11,12', 'S6 row moves to compiling with its pack ids');
fixtures['edition_items?edition_id=in.'] = () => []; fixtures['editions?status=eq.published&date='] = () => []; sb = []; submits = [];
const s2 = await R.readSubmit({}, row);
ok(!s2.ok && s2.error === 'empty_window' && submits.length === 0 && sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body.status === 'failed', 'S7 empty window: failed, nothing spent');
setFixtures('queued'); sb = []; subResult = { ok: false, error: 'claude_cap' };
const s3 = await R.readSubmit({}, row);
subResult = null;
ok(!s3.ok && sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body.status === 'queued', 'S8 refused by the cap: stays queued, retried by the tick');

// ── L: land ────────────────────────────────────────────────────────────
setFixtures('compiling'); sb = [];
const L1 = await R.readLand({}, 9, JSON.stringify({ title: 'Proximity is the product', thesis: 'Music carried 2 stories this week.', patterns: [{ name: 'n', evidence: ['S11'] }] }), 0.21);
ok(L1.status === 'ready' && sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body.cost_usd === 0.21, 'L1 a clean read lands ready with its real cost');
sb = [];
const L2 = await R.readLand({}, 9, '{"title":"t","thesis":"Tours grew 312 percent."}', 0.2);
const p2 = sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body;
ok(L2.status === 'held' && p2.error === 'held_for_review' && p2.violations.some(v => /312/.test(v)), 'L2 an invented number holds the read for review');
setFixtures('ready'); sb = [];
ok((await R.readLand({}, 9, '{}', 0)).skipped === 'not_compiling', 'L3 a landed read is never overwritten by a replay');

// ── C: children first ──────────────────────────────────────────────────
const monthRow = { id: 20, kind: 'monthly', window_start: '2026-09-01', window_end: '2026-09-30' };
fixtures = { 'house_reads?kind=eq.weekly&status=in.(queued,compiling)': () => [{ id: 1 }] };
ok(!(await R.readChildrenSettled({}, monthRow)), 'C1 a monthly waits while a weekly inside it is busy');
fixtures = {};
ok(await R.readChildrenSettled({}, monthRow), 'C2 a monthly goes once its weeklies settle');
fixtures = { 'house_reads?kind=eq.weekly&status=in.(queued,compiling)': () => [{ id: 1 }] };
ok(!(await R.readChildrenSettled({}, { id: 30, kind: 'record', window_start: '2026-07-08', window_end: '2026-09-25' })), 'C3 the record waits on weeklies too');
fixtures = {};

// ── D: doors and wiring ────────────────────────────────────────────────
ok((await R.readRoute('/reads/list', {}, {}, '', { id: 'x' }))._status === 403, 'D1 non-admin refused');
ok(/select=id,tier,kind,meta,custom_id/.test(w) && /readLand\(env, row\.meta\.house_read_id, patch\.result, patch\.cost_usd, patch\.stop_reason\)/.test(w), 'D2 the drain lands house_* jobs into house_reads');
const sched = w.slice(w.indexOf('async scheduled('), w.indexOf('async fetch('));
ok(/claudeBatchDrain\(env\)[\s\S]{0,400}readTick\(env, \{ deep: true, t0 \}\)/.test(sched), 'D3 the 30-minute cron ticks the queue after the drain (and moves the deep RECONs on its own clock)');
ok(["'/reads/compile'", "'/reads/record'", "'/reads/collect'", "'/reads/publish'"].every(x => w.includes('case ' + x)), 'D4 admin doors routed');
ok(R.READ_METHOD === fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8'), 'D5 READ_METHOD is byte-identical to the template');
ok(!/—/.test(R.READ_METHOD) && !/—/.test(Object.values(R.READ_CONTRACT).join('')), 'D6 Method and contracts carry no em dash');

// ── R: THE RECORD plan ─────────────────────────────────────────────────
sb = [];
fixtures = { 'editions?status=eq.published&select=date&order=date.asc': () => [{ date: '2026-07-08' }],
             'editions?status=eq.published&select=date&order=date.desc': () => [{ date: '2026-09-25' }] };
const rec = await R.readRoute('/reads/record', {}, {}, '', { id: 'admin' });
const queued = sb.filter(x => x.opts && x.opts.method === 'POST' && x.path.startsWith('house_reads')).map(x => x.opts.body[0]);
ok(rec.ok && rec.queued.weekly === 11 && rec.queued.monthly === 3 && rec.queued.record === 1, 'R1 THE RECORD queues 11 completed weeks, 3 months, 1 record');
ok(!queued.some(q => q.kind === 'weekly' && q.window_start === '2026-09-21'), 'R2 the unfinished week is left for Monday');
const sep = queued.find(q => q.kind === 'monthly' && q.window_start === '2026-09-01');
ok(sep && sep.window_end === '2026-09-25' && sep.label === 'September 2026 (through Sep 25, 2026)', 'R3 the unfinished month is read to date and says so');
ok(queued.find(q => q.kind === 'record').window_end === '2026-09-25', 'R4 the record spans issue 001 to the latest');
fixtures = {};

console.log(`\nproof_read_engine: ${pass} checks PASS`);
