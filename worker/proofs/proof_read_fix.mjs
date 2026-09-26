/**
 * proof_read_fix.mjs  --  arc 3.1: room, tolerant landing, truncation label, reland.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
let sb = [], fixtures = {};
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent',
  trim + pmj + ej + block + '; return { HOUSE_READ, readLand, readRoute };')(
  sbRest, async () => ({ ok: true }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve());

const K = R.HOUSE_READ.KINDS;
ok(K.weekly.max_tokens === 20000 && K.monthly.max_tokens === 28000 && K.record.max_tokens === 32000, 'F1 room: 20k weekly, 28k monthly, 32k record');
ok(K.weekly.effort === 'medium' && K.monthly.effort === 'medium' && K.record.effort === 'high', 'F1b effort: medium weekly and monthly, high record');
ok(/MAX_TOKENS: 32000,/.test(w), 'F2 lane ceiling admits the record');

const row = (status) => [{ id: 1, kind: 'weekly', status, window_start: '2026-09-14', window_end: '2026-09-20', stats: { stories: 2 }, pack_ids: [11], label: 'Week' }];
function fx(status) { fixtures = { 'house_reads?id=eq.': () => row(status), 'editions?': () => [], 'edition_items?': () => [] }; }
const patchOf = () => sb.filter(x => x.opts && x.opts.method === 'PATCH').pop().opts.body;

fx('compiling'); sb = [];
const fenced = '```json\n{"title":"Proximity sells","thesis":"Tickets moved fast.",}\n```';
const r1 = await R.readLand({}, 1, fenced, 0.3, 'end_turn');
ok(r1.status === 'ready', 'F3 fenced JSON with a trailing comma lands ready (extractJson)');
fx('compiling'); sb = [];
const r2 = await R.readLand({}, 1, '{"title":"Proximity sells","thesis":"Tickets mo', 0.3, 'max_tokens');
ok(r2.status === 'held' && patchOf().error === 'truncated_max_tokens', 'F4 a cut-off read is labeled truncated_max_tokens');
fx('compiling'); sb = [];
await R.readLand({}, 1, 'not json at all', 0.3, 'end_turn');
ok(patchOf().error === 'unparsable', 'F5 real garbage is still unparsable');

fx('held'); sb = [];
fixtures['claude_jobs?kind=eq.house_weekly'] = () => [{ result: '{"title":"Proximity sells","thesis":"Tickets moved fast."}', cost_usd: '0.29', stop_reason: 'end_turn' }];
const r3 = await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'admin' });
ok(r3.ok && r3.status === 'ready', 'F6 /reads/reland salvages a held read from stored text');
ok(sb.some(x => /meta->>house_read_id=eq\.1/.test(x.path)), 'F7 reland reads the stored job, spends nothing');
fx('ready');
ok((await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'admin' })).error === 'not_held', 'F8 only held reads can be re-landed');
ok((await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'x' }))._status === 403, 'F9 admin only');
ok(/readLand\(env, row\.meta\.house_read_id, patch\.result, patch\.cost_usd, patch\.stop_reason\)/.test(w), 'F10 the drain passes stop_reason');
ok(/case '\/reads\/reland':/.test(w), 'F11 reland routed');

// estimate: cached prefix priced at the cache-write rate
const lane = w.slice(w.indexOf('/* SEAM:CLAUDE_ROUTE: the paid lane'), w.indexOf('/* A COMPLETE SENTENCE UNDER EVERY HEADLINE'));
const L = new Function('sbRest', 'logEvent', 'json', 'callerIsAdmin', 'fetch', lane + '; return { claudeEstimate, claudeParams };')(sbRest, () => {}, (o) => o, async () => false, async () => ({}));
const sys = 'M'.repeat(35000);
const cached = L.claudeEstimate(L.claudeParams('doc', { system: sys, cache: true, prompt: 'p', max_tokens: 10 }), false);
const plain = L.claudeEstimate(L.claudeParams('doc', { system: sys, prompt: 'p', max_tokens: 10 }), false);
ok(cached > plain, 'F12 a cached system prompt is estimated at the cache-write rate');

ok(/thinking: \{ type: 'adaptive' \}, output_config: \{ effort: K\.effort \}/.test(w) && !/type: 'enabled'/.test(w), 'F13 every read asks for adaptive thinking at its effort, never enabled');
const pa = L.claudeParams('doc', { prompt: 'p', thinking: { type: 'adaptive' }, output_config: { effort: 'high' } });
ok(pa.thinking.type === 'adaptive' && pa.output_config.effort === 'high', 'F14 the lane passes adaptive thinking and effort through');
ok(/error: txt \? null : 'no_text:'/.test(w), 'F15 a job that returns no text records its block types');

console.log(`\nproof_read_fix: ${pass} checks PASS`);
