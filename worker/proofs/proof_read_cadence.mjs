/**
 * proof_read_cadence.mjs  --  arcs 5 + 6: the cadence and the once-law.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
let sb = [], fixtures = {};
const sbRest = async (env, path, opts) => { sb.push({ path, opts });
  for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts);
  if (opts && opts.method === 'POST' && path.startsWith('house_reads')) return opts.body.map((r, i) => Object.assign({ id: 700 + i }, r));
  return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent',
  trim + pmj + block + '; return { readCadence, readQueueOnce, readRoute };')(
  sbRest, async () => ({ ok: true, batch_id: 'b' }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve());
const inserts = () => sb.filter(x => x.opts && x.opts.method === 'POST' && x.path.startsWith('house_reads')).map(x => x.opts.body[0]);

sb = []; fixtures = {};
const mon = await R.readCadence({}, new Date('2026-09-28T06:10:00Z'));
const q1 = inserts();
ok(q1.length === 1 && q1[0].kind === 'weekly' && q1[0].window_start === '2026-09-21' && q1[0].window_end === '2026-09-27', 'C1 Monday Sep 28 queues the week of Sep 21 to 27');
ok(mon.tick && typeof mon.tick.queued === 'number', 'C2 the cadence ticks the queue');
sb = [];
await R.readCadence({}, new Date('2026-10-01T06:10:00Z'));
const q2 = inserts();
ok(q2.length === 1 && q2[0].kind === 'monthly' && q2[0].window_start === '2026-09-01' && q2[0].window_end === '2026-09-30', 'C3 Oct 1 queues September, the full month');
sb = [];
const tue = await R.readCadence({}, new Date('2026-09-29T06:10:00Z'));
ok(inserts().length === 0 && !tue.weekly && !tue.monthly, 'C4 any other day queues nothing');

sb = []; fixtures = { 'house_reads?kind=eq.weekly&window_start=eq.2026-09-21': () => [{ id: 5, status: 'ready' }] };
const again = await R.readCadence({}, new Date('2026-09-28T06:10:00Z'));
ok(inserts().length === 0 && again.weekly.skipped === 'ready', 'C5 once-law: a window with a ready read is never queued again');
sb = []; fixtures = {};
const failedRetry = await R.readQueueOnce({}, 'weekly', { start: '2026-09-21', end: '2026-09-27', label: 'W' }, {});
ok(failedRetry.queued, 'C6 a window with only failed reads is retried');

sb = [];
fixtures = { 'editions?status=eq.published&select=date&order=date.asc': () => [{ date: '2026-07-08' }],
             'editions?status=eq.published&select=date&order=date.desc': () => [{ date: '2026-09-25' }],
             'house_reads?kind=eq.weekly&window_start=eq.2026-09-14': () => [{ id: 3, status: 'ready' }] };
const rec = await R.readRoute('/reads/record', {}, {}, '', { id: 'admin' });
ok(rec.ok && rec.queued.weekly === 10 && rec.queued.kept === 1 && rec.queued.monthly === 3 && rec.queued.record === 1,
  'C7 THE RECORD keeps the ready Sep 14 week and queues the other 10');

const sched = w.slice(w.indexOf('async scheduled('), w.indexOf('async fetch('));
ok(/runDailyPipeline\(env\)[\s\S]*readCadence\(env\)[\s\S]*railSpendLedger\(env\)/.test(sched), 'C8 cadence runs on the 06:10 cron, after DAILY composes');
console.log(`\nproof_read_cadence: ${pass} checks PASS`);
