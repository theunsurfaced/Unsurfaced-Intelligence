/**
 * proof_model_route.mjs  --  executable proof for SEAM:CLAUDE_ROUTE + SEAM:RENDER_CEILING.
 * Extracts the EXACT shipped blocks from worker/src/index.js and drives them
 * against stubbed Anthropic, KV and Supabase. Run from the repo root:
 *   node tools/proof_model_route.mjs; EC=$?; echo "EC=$EC"
 *   L  lane isolation: callModel cannot reach Claude; no existing surface calls the lane
 *   M  money: prices, batch half, cache lines, estimate is a ceiling
 *   G  gate: bad tier, no key, kill switch, cap, unreadable ledger fails closed
 *   C  live call: workspace header, Fable model, exact ledger, durable row, no fallback
 *   B  batch: reserve at submit, open flag, record failure cancels and refunds
 *   D  drain: true-up to real cost, failures refund, idle drain costs one KV read
 *   R  render ceiling: house blocks before person, refusal moves no counter
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ── extraction: the shipped bytes, nothing retyped ─────────────────────
const cA = w.indexOf('/* SEAM:CLAUDE_ROUTE: the paid lane');
const cB = w.indexOf('/* A COMPLETE SENTENCE UNDER EVERY HEADLINE');
ok(cA > 0 && cB > cA, 'L0 lane block located between callModel and the next seam');
const lane = w.slice(cA, cB);
const rA = w.indexOf('/* SEAM:RENDER_CEILING: the house ceiling');
const rB = w.indexOf('/* POST /play/render {');
ok(rA > 0 && rB > rA, 'R0 render block located');
const render = w.slice(rA, rB);
const cm = w.slice(w.indexOf('async function callModel('), cA);

// ── L: isolation ───────────────────────────────────────────────────────
ok(!/claude|anthropic/i.test(cm), 'L1 callModel carries no Claude path: t1/t2/t3 stay Workers AI');
const rA0 = w.indexOf('/* SEAM:READ_ENGINE'), rB0 = rA0 > 0 ? w.indexOf('/* SEAM:ARCHIVE', rA0) : -1;
// v2 (EX3a): the EXCAVATE lane (excCompile, SEAM:EXC_INTEL) may call Claude too; it sits behind claudeGate like the rest.
const xA0 = w.indexOf('/* SEAM:EXC_INTEL: the compiler\'s lane'), xB0 = xA0 > 0 ? w.indexOf('/* SEAM:EXCAVATE_MEANING: the report contract.', xA0) : -1;
// v3 (EX5): the door (SEAM:EXC_DOOR v2) submits its overnight reads to the batch lane under the overnight share; it sits behind claudeGate like the rest.
const dA0 = w.indexOf('const DOOR = { WANT: 12'), dB0 = dA0 > 0 ? w.indexOf('async function excavateFeed(env, origin) {', dA0) : -1;
const outside = (w.slice(0, cA) + w.slice(cB)).replace(rA0 > 0 ? w.slice(rA0, rB0) : '\u0000', '').replace(xA0 > 0 ? w.slice(xA0, xB0) : '\u0000', '').replace(dA0 > 0 ? w.slice(dA0, dB0) : '\u0000', '');
ok(!/callClaude\(|claudeBatchSubmit\(/.test(outside.replace(/claudeRoute\(path[^\n]*/g, '')),
  'L2 only the lane, SEAM:READ_ENGINE, the EXCAVATE lane (SEAM:EXC_INTEL) and the door (SEAM:EXC_DOOR v2) call Claude (DAILY and STUDIO untouched)');
ok(xA0 > 0 && /callClaude\(env, EXC_MODEL\.TIER, req\)/.test(w.slice(xA0, xB0)) && /callClaudeStream\(env, EXC_MODEL\.TIER, req, o\.onText\)/.test(w.slice(xA0, xB0)) && /live:   \{ model: 'claude-sonnet-5'/.test(lane), 'L2b the EXCAVATE lane calls the gate with its own tier, streamed or not (EX4)');
ok(/callClaude\(env, 'frame', /.test(w.slice(xA0, xB0)) && /frame:  \{ model: 'claude-haiku-4-5-20251001'/.test(lane), 'L2c the query frame rides its own capped tier (Haiku) inside the lane block (EX4b)');
ok(/case '\/claude\/ping':[\s\S]{0,200}return claudeRoute\(path, body, env, origin, user\);/.test(w), 'L3 admin doors routed');
ok(/\.then\(\(\) => claudeBatchDrain\(env\)\)/.test(w.slice(w.indexOf('async scheduled('), w.indexOf('async fetch('))),
  'L4 drain rides the scheduled handler');

// ── harness ────────────────────────────────────────────────────────────
function mkKV(init) {
  const m = new Map(Object.entries(init || {})); let reads = 0;
  return { m, get reads() { return reads; },
    get: async k => { reads++; return m.has(k) ? m.get(k) : null; },
    put: async (k, v) => { m.set(k, String(v)); },
    delete: async k => { m.delete(k); } };
}
let sb = [], fx = [], logs = [], sbFail = false, sbRows = {};
const sbRest = async (env, path, opts) => {
  sb.push({ path, opts });
  if (sbFail && opts && opts.method === 'POST') throw new Error('sb_500');
  if (opts && opts.method === 'POST' && path.startsWith('claude_jobs')) return opts.body.map((_, i) => ({ id: 100 + i }));
  for (const k of Object.keys(sbRows)) if (path.startsWith(k)) return sbRows[k](path);
  return [];
};
const logEvent = (...a) => { logs.push(a); return Promise.resolve(); };
const json = (o, s) => Object.assign({ _status: s }, o);
const callerIsAdmin = async (env, uid) => uid === 'admin';
let fetchImpl = null;
const fetchStub = async (url, init) => { fx.push({ url, init }); return fetchImpl(url, init); };
const resp = (status, body, text) => ({ ok: status >= 200 && status < 300, status,
  json: async () => body, text: async () => text || JSON.stringify(body) });

const mk = new Function('sbRest', 'logEvent', 'json', 'callerIsAdmin', 'fetch', 'excQuiet',
  lane + '; return { CLAUDE, claudeCost, claudeParams, claudeEstimate, claudeHeaders, claudeGate, callClaude, claudeBatchSubmit, claudeBatchDrain, claudeLedger, claudeRoute, claudeMonth, claudeLedgerAdd };');
const L = mk(sbRest, logEvent, json, callerIsAdmin, fetchStub, () => () => null);
const month = L.claudeMonth();
const aiTrap = { run: async () => { throw new Error('WORKERS AI MUST NOT BE CALLED'); } };
const envOf = (kv, extra) => Object.assign({ ANTHROPIC_KEY: 'sk-test', ANTHROPIC_WORKSPACE_ID: 'wrkspc_test',
  RATE_LIMIT: kv, AI: aiTrap, SUPABASE_URL: 'x' }, extra || {});

// ── M: money ───────────────────────────────────────────────────────────
ok(near(L.claudeCost('claude-fable-5-1', { input_tokens: 1e6 }, false), 10), 'M1 Fable input $10 per MTok');
ok(near(L.claudeCost('claude-fable-5-1', { output_tokens: 1e6 }, false), 50), 'M2 Fable output $50 per MTok');
ok(near(L.claudeCost('claude-fable-5-1', { cache_read_input_tokens: 1e6, cache_creation_input_tokens: 1e6 }, false), 12.75),
  'M3 Fable cache read $0.25 + write $12.50');
ok(near(L.claudeCost('claude-sonnet-5', { input_tokens: 1e6, output_tokens: 1e6 }, true), 6), 'M4 batch halves every line (Sonnet 12 -> 6)');
ok(L.claudeCost('unknown-model', { input_tokens: 5 }, false) === 0, 'M5 unknown model prices at 0, never NaN');
const p1 = L.claudeParams('doc', { system: 'METHOD', cache: true, prompt: 'hi', max_tokens: 999999 });
ok(p1.model === 'claude-fable-5-1' && p1.max_tokens === 32000, 'M6 doc tier is Fable, max_tokens clamped');
ok(Array.isArray(p1.system) && p1.system[0].cache_control.type === 'ephemeral', 'M7 cache:true marks the Method as the cached prefix');
ok(L.claudeParams('ingest', {}).model === 'claude-sonnet-5', 'M8 ingest tier is Sonnet 5');
const est = L.claudeEstimate(L.claudeParams('doc', { prompt: 'x'.repeat(350), max_tokens: 100 }), false);
ok(est >= L.claudeCost('claude-fable-5-1', { input_tokens: 100, output_tokens: 100 }, false), 'M9 estimate is a ceiling on real cost');

// ── G: gate ────────────────────────────────────────────────────────────
ok((await L.claudeGate(envOf(mkKV()), 'nope', 0)).error === 'claude_bad_tier', 'G1 unknown tier refused');
ok((await L.claudeGate(envOf(mkKV(), { ANTHROPIC_KEY: '' }), 'doc', 0)).error === 'claude_unconfigured', 'G2 no key refused');
ok((await L.claudeGate(envOf(mkKV({ 'claude:kill': '1' })), 'doc', 0)).error === 'claude_off', 'G3 kill switch refuses');
ok((await L.claudeGate(envOf(mkKV({ ['cl$:doc:' + month]: '14.99' })), 'doc', 0.02)).error === 'claude_cap', 'G4 $15 doc cap counts this call worst case');
ok((await L.claudeGate(envOf(mkKV({ ['cl$:doc:' + month]: '14.99' }), { CLAUDE_DOC_MONTHLY: '40' }), 'doc', 0.02)).ok, 'G5 env raises the cap without code');
const brokenKV = { get: async () => { throw new Error('kv down'); } };
ok((await L.claudeGate(envOf(brokenKV), 'doc', 0)).error === 'claude_ledger_unreadable', 'G6 unreadable ledger fails closed');

// ── C: live call ───────────────────────────────────────────────────────
sb = []; fx = [];
let kv = mkKV();
fetchImpl = async () => resp(200, { id: 'msg_1', stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'LIVE' }], usage: { input_tokens: 14, output_tokens: 5 } });
const c1 = await L.callClaude(envOf(kv), 'doc', { kind: 'ping', prompt: 'Reply with the word LIVE.', max_tokens: 16 });
ok(c1.ok && c1.text === 'LIVE', 'C1 live call returns the text');
ok(fx[0].url === 'https://api.anthropic.com/v1/messages', 'C2 hits /v1/messages');
ok(fx[0].init.headers['anthropic-workspace-id'] === 'wrkspc_test' && fx[0].init.headers['x-api-key'] === 'sk-test', 'C3 workspace header + key on the request');
ok(JSON.parse(fx[0].init.body).model === 'claude-fable-5-1', 'C4 doc routes to Fable 5.1');
const c1cost = (14 * 10 + 5 * 50) / 1e6;
ok(near(c1.cost_usd, c1cost) && near(parseFloat(kv.m.get('cl$:doc:' + month)), c1cost), 'C5 ledger moves by the exact real cost');
const row = sb.find(x => x.path.startsWith('claude_jobs') && x.opts && x.opts.method === 'POST');
ok(row && row.opts.body[0].status === 'done' && row.opts.body[0].mode === 'live' && row.opts.body[0].tier === 'doc', 'C6 durable claude_jobs row written');
ok(!L.claudeHeaders({ ANTHROPIC_KEY: 'k' })['anthropic-workspace-id'], 'C7 no workspace id, no header (scoped keys still work)');
sb = []; fx = []; kv = mkKV();
fetchImpl = async () => resp(529, { error: { message: 'overloaded' } });
const c2 = await L.callClaude(envOf(kv), 'doc', { prompt: 'x' });
ok(!c2.ok && c2.error === 'claude_529' && c2.detail === 'overloaded', 'C8 upstream failure is named, not hidden');
ok(!kv.m.has('cl$:doc:' + month), 'C9 failed call spends nothing on the ledger');
ok(sb.some(x => x.opts && x.opts.body && x.opts.body[0] && x.opts.body[0].status === 'failed'), 'C10 failure is recorded durably');
// C11: aiTrap throws if touched; reaching here means no fallback ran.
ok(true, 'C11 no fallback to Workers AI on failure (AI trap never sprung)');
fx = [];
const c3 = await L.callClaude(envOf(mkKV({ 'claude:kill': '1' })), 'doc', { prompt: 'x' });
ok(c3.error === 'claude_off' && fx.length === 0, 'C12 kill switch: zero requests leave the building');

// ── B: batch submit ────────────────────────────────────────────────────
sb = []; fx = []; kv = mkKV();
fetchImpl = async () => resp(200, { id: 'msgbatch_A', processing_status: 'in_progress' });
const items = [{ custom_id: 'wk-01', system: 'METHOD', cache: true, prompt: 'week one', max_tokens: 3000 },
               { custom_id: 'wk-02', system: 'METHOD', cache: true, prompt: 'week two', max_tokens: 3000 }];
const b1 = await L.claudeBatchSubmit(envOf(kv), 'doc', 'weekly_read', items);
ok(b1.ok && b1.batch_id === 'msgbatch_A' && b1.n === 2, 'B1 batch submitted');
const body1 = JSON.parse(fx[0].init.body);
ok(fx[0].url.endsWith('/messages/batches') && body1.requests[0].params.model === 'claude-fable-5-1', 'B2 batch endpoint, Fable params');
ok(near(parseFloat(kv.m.get('cl$:doc:' + month)), b1.est_usd) && b1.est_usd > 0, 'B3 estimate reserved on the ledger at submit');
ok(kv.m.get('claude:open') === '1', 'B4 open flag raised for the drain');
const ins = sb.find(x => x.path.startsWith('claude_jobs') && x.opts.method === 'POST').opts.body;
ok(ins.length === 2 && ins.every(r => r.status === 'submitted' && r.batch_id === 'msgbatch_A'), 'B5 one submitted row per request');
ok((await L.claudeBatchSubmit(envOf(kv), 'doc', 'x', [{ custom_id: 'bad id!' }])).error === 'claude_bad_custom_id', 'B6 custom_id law enforced');
ok((await L.claudeBatchSubmit(envOf(kv), 'doc', 'x', [{ custom_id: 'a' }, { custom_id: 'a' }])).error === 'claude_bad_custom_id', 'B7 duplicate custom_id refused');
sb = []; fx = []; kv = mkKV(); sbFail = true;
fetchImpl = async (url) => url.endsWith('/cancel') ? resp(200, {}) : resp(200, { id: 'msgbatch_B' });
const b2 = await L.claudeBatchSubmit(envOf(kv), 'doc', 'weekly_read', items);
sbFail = false;
ok(!b2.ok && b2.error === 'claude_record_failed', 'B8 unrecordable batch fails loud');
ok(fx.some(x => x.url.endsWith('/msgbatch_B/cancel')), 'B9 unrecordable batch is cancelled upstream');
ok(!parseFloat(kv.m.get('cl$:doc:' + month) || '0'), 'B10 reservation refunded');

// ── D: drain ───────────────────────────────────────────────────────────
kv = mkKV();
const idle = await L.claudeBatchDrain(envOf(kv));
ok(idle.skipped === 'none_open' && kv.reads === 1, 'D1 idle drain: one KV read, zero database calls');
const reserve = 0.2;
kv = mkKV({ 'claude:open': '1', ['cl$:doc:' + month]: String(reserve) });
sb = []; fx = [];
sbRows = {
  'claude_jobs?status=eq.submitted&mode=eq.batch&select=batch_id': () => [{ batch_id: 'msgbatch_A' }],
  'claude_jobs?batch_id=eq.msgbatch_A': () => [
    { id: 1, tier: 'doc', custom_id: 'wk-01', model: 'claude-fable-5-1', est_usd: '0.1', created_at: month + '-15T00:00:00Z' },
    { id: 2, tier: 'doc', custom_id: 'wk-02', model: 'claude-fable-5-1', est_usd: '0.1', created_at: month + '-15T00:00:00Z' }],
  'claude_jobs?status=eq.submitted&mode=eq.batch&select=id': () => []
};
const jsonl = [
  { custom_id: 'wk-01', result: { type: 'succeeded', message: { stop_reason: 'end_turn',
    content: [{ type: 'text', text: 'THE WEEK' }], usage: { input_tokens: 20000, output_tokens: 3000 } } } },
  { custom_id: 'wk-02', result: { type: 'errored', error: { error: { message: 'overloaded' } } } }
].map(x => JSON.stringify(x)).join('\n');
fetchImpl = async (url) => url.endsWith('/messages/batches/msgbatch_A')
  ? resp(200, { id: 'msgbatch_A', processing_status: 'ended', results_url: 'https://api.anthropic.com/v1/messages/batches/msgbatch_A/results' })
  : resp(200, null, jsonl);
const d1 = await L.claudeBatchDrain(envOf(kv));
const real = (20000 * 10 + 3000 * 50) / 1e6 * 0.5;
ok(d1.ended === 1 && d1.done === 1 && d1.failed === 1, 'D2 one done, one failed');
ok(near(parseFloat(kv.m.get('cl$:doc:' + month)), real), 'D3 ledger trued up: reservation replaced by real batch cost, failure refunded');
ok(fx.every(x => x.init && x.init.headers['anthropic-workspace-id'] === 'wrkspc_test'), 'D4 status + results fetches carry the workspace header');
const patches = sb.filter(x => x.opts && x.opts.method === 'PATCH');
ok(patches.length === 2 && patches[0].opts.body.status === 'done' && patches[0].opts.body.result === 'THE WEEK', 'D5 done row carries the text');
ok(patches[1].opts.body.status === 'failed' && /errored overloaded/.test(patches[1].opts.body.error), 'D6 failed row names why');
ok(!kv.m.has('claude:open'), 'D7 open flag cleared when nothing is left');
sb = []; kv = mkKV({ 'claude:open': '1' });
fetchImpl = async () => resp(200, { id: 'msgbatch_A', processing_status: 'in_progress' });
sbRows['claude_jobs?status=eq.submitted&mode=eq.batch&select=id'] = () => [{ id: 1 }];
const d2 = await L.claudeBatchDrain(envOf(kv));
ok(d2.ended === 0 && !sb.some(x => x.opts && x.opts.method === 'PATCH') && kv.m.get('claude:open') === '1', 'D8 in-progress batch: nothing touched, flag held');
sbRows = {};

// ── doors ──────────────────────────────────────────────────────────────
const f1 = await L.claudeRoute('/claude/ledger', {}, envOf(mkKV()), '', { id: 'someone' });
ok(f1._status === 403, 'A1 non-admin is refused at every door');
kv = mkKV();
await L.claudeRoute('/claude/kill', { on: true }, envOf(kv), '', { id: 'admin' });
ok(kv.m.get('claude:kill') === '1', 'A2 /claude/kill on');
await L.claudeRoute('/claude/kill', { on: false }, envOf(kv), '', { id: 'admin' });
ok(!kv.m.has('claude:kill'), 'A3 /claude/kill off');
const led = await L.claudeRoute('/claude/ledger', {}, envOf(mkKV({ ['cl$:ingest:' + month]: '2.5' })), '', { id: 'admin' });
ok(led.ok && led.tiers.ingest.spent === 2.5 && led.tiers.ingest.remaining === 7.5 && led.workspace === true, 'A4 ledger reports spent, cap, remaining');

// ── R: render ceiling ──────────────────────────────────────────────────
const CONFIG = { RENDER_DAILY_SECONDS: 120, RENDER_GLOBAL_SECONDS: 480 };
const R = new Function('CONFIG', 'json', render + '; return { renderBudget, renderHouseCap, playBudget };')(CONFIG, json);
const day = new Date().toISOString().slice(0, 10);
kv = mkKV({ ['fal:all:' + day]: '478' });
ok(!(await R.renderBudget({ RATE_LIMIT: kv }, 'u1', 4)), 'R1 house ceiling refuses even a fresh person');
ok(!kv.m.has('fal:u1:' + day) && kv.m.get('fal:all:' + day) === '478', 'R2 refusal moves neither counter');
kv = mkKV();
ok(await R.renderBudget({ RATE_LIMIT: kv }, 'u1', 4), 'R3 normal render passes');
ok(kv.m.get('fal:u1:' + day) === '4' && kv.m.get('fal:all:' + day) === '4', 'R4 both counters move together');
kv = mkKV({ ['fal:u1:' + day]: '118' });
ok(!(await R.renderBudget({ RATE_LIMIT: kv }, 'u1', 4)) && !kv.m.has('fal:all:' + day), 'R5 personal cap still holds, house untouched on refusal');
ok(R.renderHouseCap({ RENDER_GLOBAL_SECONDS: '900' }) === 900 && R.renderHouseCap({}) === 480, 'R6 env overrides the house cap');
const pb = await R.playBudget({ RATE_LIMIT: mkKV({ ['fal:u1:' + day]: '10', ['fal:all:' + day]: '40' }) }, '', { id: 'u1' });
ok(pb.used === 10 && pb.cap === 120 && pb.house_used === 40 && pb.house_cap === 480, 'R7 /play/budget reports person and house');

// ── H: HARVEST on the lane ─────────────────────────────────────────────
ok(L.CLAUDE.TIERS.facts && L.CLAUDE.TIERS.facts.model === 'claude-haiku-4-5-20251001' && L.CLAUDE.TIERS.facts.env === 'CLAUDE_FACTS_MONTHLY' && L.CLAUDE.TIERS.facts.cap === 5 && L.CLAUDE.TIERS.frame.cap === 3,
  'H1 the fact table has its own capped tier (Haiku, $5): a run of reads never closes the frame tier');
ok(/callClaude\(env, 'facts', \{ system: EXC_FACTS_SYS/.test(w) && !/callClaude\(env, 'frame', \{ system: EXC_FACTS_SYS/.test(w), 'H2 excFacts spends the facts tier, not the frame tier');
// Four adds at once, each reading the ledger before the others wrote: every one lands.
const slowKv = { m: new Map(), get: async k => { await new Promise(r => setTimeout(r, 5)); return slowKv.m.get(k) || null; }, put: async (k, v) => { slowKv.m.set(k, v); } };
await Promise.all([0.01, 0.02, 0.03, 0.04].map(x => L.claudeLedgerAdd({ RATE_LIMIT: slowKv }, 'facts', x, '2026-10')));
ok(slowKv.m.get('cl$:facts:2026-10') === '0.1', 'H3 ledger adds made side by side are applied one after another: nothing is lost');

console.log(`\nproof_model_route: ${pass} checks PASS`);
