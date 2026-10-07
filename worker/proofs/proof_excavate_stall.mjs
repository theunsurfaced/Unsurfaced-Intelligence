/**
 * proof_excavate_stall.mjs  --  SEAM:EXC_STALL: no read waits forever.
 * Reproduces the Oct 7 03:49 read ("AI backlash labor displacement safety public trust"): the writer streamed seven
 * findings and four moves, then the stream from Anthropic went quiet. reader.read() had no deadline, no row was
 * written, the page waited on a silent connection, and the spinner ran for 40 minutes. Proves on fakes that the
 * stall is cut, the read lands, the row is written, the page hears a heartbeat and has a watchdog, and the browser
 * rails that only ever failed are gone.
 * Run from the repo root: node worker/proofs/proof_excavate_stall.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const enc = new TextEncoder();
const sse = evts => evts.map(e => 'event: ' + e.type + '\ndata: ' + JSON.stringify(e) + '\n\n').join('');

// The read as the writer had it at 03:49:47: seven findings, four moves, the brief not yet begun.
const finding = i => ({ category: ['consumer', 'market', 'culture', 'brand'][i % 4], title: 'Finding ' + i + ' names the trust gap', excerpt: 'Evidence ' + (i + 1) + ' shows it.', evidence: [i + 1],
  meaning: { culture: 'c' + i, category: 'k' + i, consumer: 'u' + i } });
const move = i => ({ type: 'Content', for: 'enterprise', headline: 'Publish the safety mechanics by week ' + (i + 2), body: 'Name the auditor and the steps.', because: 'Evidence 2.', proof: 'Evidence 2 names it.',
  measure: 'Opt-in rate in 60 days.', risk: 'Reads as defensive.', evidence: [2], from: i });
const report = { frame: { category: 'AI platforms', audience: 'enterprise buyers' }, read: ['Trust incidents drive the backlash.', 'Publish safety mechanics before pushing adoption.'],
  insights: Array.from({ length: 7 }, (_, i) => finding(i)), ideas: Array.from({ length: 4 }, (_, i) => move(i)), brief: 'The brief.' };
const full = JSON.stringify(report);
const atStall = full.slice(0, full.indexOf(',"brief"'));   // everything the writer had sent when it went quiet

// ── R: the failure, reproduced ─────────────────────────────────────────────────────────────────────────────────
const silent = new ReadableStream({ start(c) { c.enqueue(enc.encode('event: ping\ndata: {"type":"ping"}\n\n')); } });   // sends once, then nothing, never closes
const rd = silent.getReader(); await rd.read();
const raced = await Promise.race([rd.read().then(() => 'read'), wait(300).then(() => 'still waiting')]);
ok(raced === 'still waiting', 'R1 reproduces the hang: a bare reader.read() on a stream that goes quiet never returns (the old loop had nothing else to wake it)');
rd.cancel().catch(e => e);

// ── A: the live call ─────────────────────────────────────────────────────────────────────────────────────────
const streamSrc = between(w, 'async function callClaudeStream(', '/* Batch: half price');
ok(/claude_jobs\?status=eq\.submitted&mode=eq\.batch/.test(w) && !/claude_jobs\?status=eq\.submitted(?!&mode=eq\.batch)/.test(w),
  'A0 an opened live row (status submitted, mode live) can never be picked up by the batch drain, which asks only for mode=batch');
const mkCall = (CLAUDE, body, log) => new Function('CLAUDE', 'claudeParams', 'claudeEstimate', 'claudeGate', 'claudeHeaders', 'claudeCost', 'claudeLedgerAdd', 'claudeRecord', 'claudeRecordEnd', 'excQuiet', 'fetch',
  streamSrc + '; return callClaudeStream;')(CLAUDE, (t, r) => ({ model: 'claude-sonnet-5', max_tokens: r.max_tokens }), () => 0.4, async () => ({ ok: true }), () => ({}),
  (m, u) => ((u.output_tokens || 0) * 10 + (u.input_tokens || 0) * 2) / 1e6, async (env, tier, usd) => { log.ledger.push(usd); },
  async (env, rows) => { log.opened.push(rows[0]); return [77]; }, async (env, id, row) => { log.closed.push(Object.assign({ id }, row)); return id; }, () => () => null,
  async (url, o) => { log.signal = o.signal; return { ok: true, body: body(o.signal) }; });
const newLog = () => ({ ledger: [], opened: [], closed: [], signal: null });
const head = [{ type: 'message_start', message: { id: 'msg_s', usage: { input_tokens: 30000, output_tokens: 1 } } }];
const deltas = text => { const out = []; for (let i = 0; i < text.length; i += 400) out.push({ type: 'content_block_delta', delta: { type: 'text_delta', text: text.slice(i, i + 400) } }); return out; };
// A body that sends what it has, then holds the socket open and says nothing more. Cancel and abort are honored.
const stalls = evts => signal => { let ctl = null; const b = enc.encode(sse(evts)); return new ReadableStream({ start(c) { ctl = c; c.enqueue(b.slice(0, 500)); c.enqueue(b.slice(500)); signal.addEventListener('abort', () => { try { c.error(new Error('aborted')); } catch (e) { return e; } }); } }); };
const pings = (evts, every) => signal => { let iv = null; return new ReadableStream({ start(c) { c.enqueue(enc.encode(sse(evts))); iv = setInterval(() => c.enqueue(enc.encode(sse([{ type: 'ping' }]))), every); signal.addEventListener('abort', () => clearInterval(iv)); }, cancel() { clearInterval(iv); } }); };

let log = newLog(), heard = [];
let t0 = Date.now();
let res = await mkCall({ API: 'x', TIERS: { live: { model: 'claude-sonnet-5' } }, LIVE_TIMEOUT_MS: 5000, STREAM_IDLE_MS: 150 }, stalls(head.concat(deltas(atStall))), log)({}, 'live', { prompt: 'P', max_tokens: 16000, kind: 'excavate_report' }, t => heard.push(t.length));
let ms = Date.now() - t0;
ok(res.ok && res.text === atStall && res.stop_reason === 'stream_stall' && res.truncated === false && ms < 1500 && log.signal.aborted,
  'A1 the Oct 7 stall is cut after the stall window: the call returns the seven findings and four moves it had, stopped as stream_stall, and the socket is aborted (' + ms + ' ms)');
ok(log.opened.length === 1 && log.opened[0].status === 'submitted' && log.opened[0].meta.stream === true && log.closed.length === 1 && log.closed[0].id === 77 && log.closed[0].status === 'done'
  && log.closed[0].stop_reason === 'stream_stall' && log.closed[0].meta.cut === 'stall' && log.closed[0].result === atStall && res.job_id === 77,
  'A2 the row was opened before the first byte and closed with the outcome: a hang would have shown as a row still submitted, and this one closes as done, stream_stall');
ok(log.closed[0].usage.estimated === true && log.closed[0].usage.output_tokens === Math.ceil(atStall.length / 3.5) && log.ledger.length === 1 && log.ledger[0] > 0.06 && Math.abs(log.closed[0].cost_usd - log.ledger[0]) < 1e-12,
  'A3 a cut stream never sends its output count, so it is billed on what it wrote; the cap ledger and the row carry the same dollars');
log = newLog();
res = await mkCall({ API: 'x', TIERS: { live: { model: 'claude-sonnet-5' } }, LIVE_TIMEOUT_MS: 5000, STREAM_IDLE_MS: 150 }, stalls(head), log)({}, 'live', { prompt: 'P', max_tokens: 100, kind: 'excavate_report' });
ok(!res.ok && res.error === 'claude_stall' && log.closed[0].status === 'failed' && /^claude_stall stall/.test(log.closed[0].error),
  'A4 a stall before any text is a claude_stall failure, and its row closes as failed (excCompile retries it once)');
log = newLog(); t0 = Date.now();
res = await mkCall({ API: 'x', TIERS: { live: { model: 'claude-sonnet-5' } }, LIVE_TIMEOUT_MS: 400, STREAM_IDLE_MS: 150 }, pings(head.concat(deltas('{"read":["a","b"],"insights":[')), 40), log)({}, 'live', { prompt: 'P', max_tokens: 100, kind: 'excavate_report' });
ms = Date.now() - t0;
ok(res.ok && res.stop_reason === 'stream_deadline' && ms >= 380 && ms < 900 && log.closed[0].meta.cut === 'deadline',
  'A5 a stream that keeps pinging but never finishes hits the hard ceiling and returns what it wrote (' + ms + ' ms)');
log = newLog(); t0 = Date.now();
res = await mkCall({ API: 'x', TIERS: { live: { model: 'claude-sonnet-5' } }, LIVE_TIMEOUT_MS: 5000, STREAM_IDLE_MS: 150 }, pings(head.concat(deltas('{"read":["a"')), 40), log)({}, 'live', { prompt: 'P', max_tokens: 100, kind: 'excavate_report', timeout_ms: 250 });
ms = Date.now() - t0;
ok(res.ok && res.stop_reason === 'stream_deadline' && ms < 700, 'A6 a caller\'s timeout_ms below the ceiling is honored (' + ms + ' ms)');

// ── B: the lane ────────────────────────────────────────────────────────────────────────────────────────────
const lane = between(w, 'const EXC_MODEL = ', '/* SEAM:EXCAVATE_MEANING: the report contract.');
let lcalls = [];
const mkLane = seq => new Function('callClaude', 'callClaudeStream', 'callModel', 'claudeSpent', 'claudeCap', 'CLAUDE', 'CONFIG', lane + '; return { excCompile };')(
  async (env, tier, req) => { lcalls.push({ live: req }); return seq.shift() || { ok: false, error: 'claude_cap' }; },
  async (env, tier, req) => { lcalls.push({ stream: req }); return seq.shift() || { ok: false, error: 'claude_cap' }; },
  async () => { lcalls.push({ reserve: true }); return 'R'; }, async () => 0, () => 10, { TIERS: { live: { model: 'claude-sonnet-5' } } }, { TEXT_MODEL: 'm' }).excCompile;
lcalls = [];
let ec = await mkLane([{ ok: false, error: 'claude_stall' }, { ok: true, text: 'T' }])({}, { system: 'S', prompt: 'P', max_tokens: 100, onText: () => {} });
ok(ec.lane === 'live' && ec.text === 'T' && lcalls.length === 2 && lcalls.every(c => c.stream), 'B1 a stall with nothing written is retried once on the live lane');
lcalls = [];
ec = await mkLane([{ ok: false, error: 'claude_529' }, { ok: false, error: 'claude_529' }])({}, { system: 'S', prompt: 'P', max_tokens: 100, noReserve: true, timeout_ms: 9000 });
ok(ec.lane === 'none' && ec.text === '' && !lcalls.some(c => c.reserve) && lcalls[0].live.timeout_ms === 9000, 'B2 a completion call carries its deadline and never falls to the reserve model');

// ── C: synthesize, end to end ──────────────────────────────────────────────────────────────────────────────
const helpers = between(w, '/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const xj = between(w, 'function jsonRepair(', '// Server-side connectors');
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
const cacheSrc = w.slice(w.indexOf('const EXC_MODEL = '), w.indexOf('\n', w.indexOf('const EXC_MODEL = '))) + '\n' + between(w, 'function excCacheKey(h)', 'async function excCompile(');   // the real cache key and day
const corpus = Array.from({ length: 12 }, (_, i) => ({ lens: 'consumer', title: 't' + i, url: 'https://e.example/' + i, source: 's' + i, published_at: new Date(Date.now() - (i + 1) * 864e5).toISOString() }));
const logs = [], origLog = console.log;
const run = async (replies, o) => {
  o = o || {};
  const calls = [], stages = [];
  const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG',
    'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved', cacheSrc + helpers + (o.xj || xj) + synth + '; excReadPages = async () => ({ read: 0, dated: 0, tried: 0 }); excMeasures = async () => null; excFramedRerun = async () => []; return synthesize;')(
    (x, st) => ({ o: x, st }), async () => [], async () => [],
    async (env, c) => { calls.push(c); if (o.slow) await wait(o.slow); const x = replies.shift(); return Object.assign({ lane: c.reserveOnly ? 'reserve' : 'live', model: 'm', reason: c.reserveOnly || null, cost_usd: 0 }, x); },
    async () => 1, async () => 'h', async () => 0, () => [], {}, async () => null, async () => null, async () => ({ tabled: 0, chunks: 0, failed: 0 }), async () => null, async () => [], () => []);
  console.log = (...a) => logs.push(a.join(' '));
  try { return { res: await S(Object.assign({ query: 'AI backlash labor displacement safety public trust', mode: 'report', corpus }, o.body || {}), o.env || {}, '', { reply: x => ({ o: x }), onStage: st => stages.push(st) }), calls, stages }; }
  finally { console.log = origLog; }
};
let t = await run([{ text: atStall, stop_reason: 'stream_stall' }, { text: '{"brief":"Where the conversation is, what the evidence shows, and the one thing to do first."}' }]);
let d = t.res.o.data;
ok(t.res.o.ok && t.calls.length === 2 && t.calls[1].kind === 'excavate_report_complete' && t.calls[1].max_tokens === 6000 && t.calls[1].noReserve === true && t.calls[1].timeout_ms <= 60000
  && /YOU ALREADY WROTE THIS PART/.test(t.calls[1].prompt) && /Write ONLY what is missing: "brief"\./.test(t.calls[1].prompt) && t.calls[1].prompt.includes('Finding 6 names the trust gap'),
  'C1 the Oct 7 read, replayed: the stalled reply keeps its seven findings and four moves, and one short call is asked for the brief alone, with the finished work handed in');
ok(d.insights.length === 7 && /^Where the conversation is/.test(d.brief) && d.partial === null && /salvaged_cut\+completed/.test(d.model.reason)
  && d.timing.detail.map(p => p.pass + ':' + (p.parsed || '')).join() === 'first:salvaged,complete:filled:brief' && t.stages.some(s => s.stage === 'completing' && s.missing.join() === 'brief' && s.findings === 7),
  'C2 the read lands whole: seven findings, its moves and the brief, labeled salvaged and completed, the completion on the receipts, the page told what is being finished');
const puts = [];
const kv = hit => ({ get: async () => hit, put: async (k, v, opt) => { puts.push({ k, v: JSON.parse(v), ttl: opt.expirationTtl }); } });
t = await run([{ text: atStall, stop_reason: 'stream_stall' }, { text: 'not json' }], { env: { RATE_LIMIT: kv(null) } });
d = t.res.o.data;
ok(t.res.o.ok && d.insights.length === 7 && d.partial && d.partial.missing.join() === 'brief' && d.partial.stop === 'stream_stall' && puts.length === 1 && puts[0].ttl === 900 && puts[0].v.partial,
  'C3 when the completion fails the read still lands, labeled partial with what it lacks, and is cached for 15 minutes, not a day');
t = await run([{ text: full }], { env: { RATE_LIMIT: kv(JSON.stringify(puts[0].v)) } });
ok(t.calls.length === 1 && t.res.o.data.partial === null && !t.res.o.data.model.cached, 'C4 a partial read in the cache is never served to a fresh search: the read compiles again');
t = await run([], { env: { RATE_LIMIT: kv(JSON.stringify(puts[0].v)) }, body: { cache_only: true } });
ok(t.calls.length === 0 && t.res.o.ok && t.res.o.data.partial && t.res.o.data.model.cached === true, 'C5 the page that lost its stream (cache_only) is handed the partial read');
t = await run([{ text: full, stop_reason: 'end_turn' }]);
ok(t.calls.length === 1 && t.res.o.data.partial === null, 'C6 a whole reply is still one call: nothing is completed that was not cut');
const xjFast = xj.replace('WRITE_MS: 165000', 'WRITE_MS: 300');
ok(xjFast !== xj, 'C7a the wall clock is EXC_SPEED.WRITE_MS (165 s)');
t = await run([{ text: 'nothing readable' }, { text: full }], { xj: xjFast, slow: 350 });
ok(t.res.o.ok && t.calls.length === 2 && t.calls[1].reserveOnly && t.res.o.data.timing.detail.map(p => p.pass).join() === 'first,reserve',
  'C7 past the wall clock no second live pass starts: the read goes straight to the reserve lane and lands');

// ── D: the stream to the page ──────────────────────────────────────────────────────────────────────────────
const ssSrc = between(w, 'async function synthesizeStream(', 'function corsHeaders(');
const jobs = [];
const mkSS = (synthFn, speed) => new Function('synthesize', 'corsHeaders', 'excDraft', 'EXC_SPEED', 'excQuiet', ssSrc + '; return synthesizeStream;')(synthFn, () => new Headers(), () => null, speed, () => () => null);
logs.length = 0;
console.log = (...a) => logs.push(a.join(' '));
let resp = await mkSS(async (b, env, origin, hooks) => { hooks.onStage({ stage: 'writing', evidence: 40 }); await wait(260); return hooks.reply({ ok: true, data: { insights: [1] } }); }, { STREAM_EVERY_MS: 0, DRAFT_TRIES: 4, BEAT_MS: 50 })(
  { query: 'AI backlash' }, {}, '', { waitUntil: p => jobs.push(p) });
let text = await resp.text();
await Promise.all(jobs);
console.log = origLog;
const blocks = text.split('\n\n').filter(Boolean);
ok(blocks.filter(b => /^: beat \d+$/.test(b)).length >= 3 && /^event: final/.test(blocks[blocks.length - 1]) && blocks.filter(b => b.startsWith('event:')).length === 3,
  'D1 while the model writes, the worker beats every BEAT_MS as an SSE comment the reader skips, and the final event still closes the stream');
ok(logs.some(l => /^exc_stream_end /.test(l) && /"outcome":"ok"/.test(l) && /"client":true/.test(l)), 'D2 every stream ends with a line saying how it ended and how long it took');
logs.length = 0; jobs.length = 0;
console.log = (...a) => logs.push(a.join(' '));
resp = await mkSS(async (b, env, origin, hooks) => { await wait(200); return hooks.reply({ ok: true, data: { insights: [1], partial: { missing: ['brief'] } } }); }, { STREAM_EVERY_MS: 0, DRAFT_TRIES: 4, BEAT_MS: 40 })(
  { query: 'q' }, {}, '', { waitUntil: p => jobs.push(p) });
const rr = resp.body.getReader(); await rr.read(); await rr.cancel();   // the page goes away mid-read
await Promise.all(jobs);
console.log = origLog;
ok(logs.some(l => /^exc_stream_end /.test(l) && /"outcome":"partial"/.test(l) && /"client":false/.test(l)), 'D3 a page that leaves mid-read stops the beats, the job still finishes, and the end line says the client had gone');

// ── E: the page's watchdog ─────────────────────────────────────────────────────────────────────────────────
const pss = between(page, 'async function _synthesizeStream(payload, onEvent, state) {', 'async function _synthesizePlainAfterCut(');
const pageSse = evts => evts.map(e => 'event: ' + e[0] + '\ndata: ' + JSON.stringify(e[1]) + '\n\n').join('');
const mkPage = bodyFn => new Function('_authHeader', '_withLake', 'API_BASE', 'fetch', 'window', pss + '; return _synthesizeStream;')(async () => ({}), async p => p, 'https://api.example',
  async (url, o) => ({ ok: true, headers: { get: () => 'text/event-stream; charset=utf-8' }, body: bodyFn(o.signal) }), {});
const quietBody = signal => new ReadableStream({ start(c) { c.enqueue(enc.encode(pageSse([['stage', { stage: 'writing', evidence: 40 }], ['draft', { read: ['a', 'b'], insights: [{ title: 't' }], ideas: [] }]])));
  signal.addEventListener('abort', () => c.error(new Error('AbortError'))); } });
let st = { quiet_ms: 200, max_ms: 5000 }; const pheard = [];
t0 = Date.now();
let err = null; try { await mkPage(quietBody)({ query: 'q' }, (ev, x) => pheard.push(ev), st); } catch (e) { err = e; }
ms = Date.now() - t0;
ok(err && /stream quiet/.test(err.message) && st.why === 'quiet' && st.heard === true && pheard.join() === 'stage,draft' && ms < 1200,
  'E1 the page that heard the draft and then nothing gives up after its quiet window and hands over to the cut path, instead of waiting forever (' + ms + ' ms)');
const beatBody = (n, gap) => signal => { let i = 0, iv = null; return new ReadableStream({ start(c) { signal.addEventListener('abort', () => { clearInterval(iv); c.error(new Error('AbortError')); });
  iv = setInterval(() => { i++; if (i <= n) c.enqueue(enc.encode(': beat ' + i + '\n\n')); else { clearInterval(iv); c.enqueue(enc.encode(pageSse([['final', { ok: true, data: { insights: [1, 2] } }]]))); c.close(); } }, gap); } }); };
st = { quiet_ms: 200, max_ms: 5000 };
const fin = await mkPage(beatBody(6, 80))({ query: 'q' }, () => {}, st);
ok(fin.ok && fin.data.insights.length === 2 && st.why === null, 'E2 heartbeats keep a long quiet write alive: 480 ms with no event and only beats, past a 200 ms quiet window, and the read lands');
st = { quiet_ms: 200, max_ms: 400 }; err = null;
try { await mkPage(beatBody(1000, 50))({ query: 'q' }, () => {}, st); } catch (e) { err = e; }
ok(err && /too_long/.test(err.message) && st.why === 'too_long', 'E3 beats alone cannot hold a read open past its outer bound');
const cut = between(page, 'async function _synthesizePlainAfterCut(', 'function _loaderStage(');
ok(/waited < 90000/.test(cut) && /cache_only: true/.test(cut) && /setTimeout\(\(\) => ctl\.abort\(\), 300000\)/.test(cut) && /signal: ctl\.signal/.test(cut),
  'E4 after a cut the page waits for the worker\'s own read (a partial one included), and the fresh compile has a 5 minute deadline');
ok(/st\.stage === 'completing'/.test(page) && /else if\(synthesis\.partial\)\{/.test(page), 'E5 the loader names the completion step, and a partial read says what it lacks');

// ── F: the browser rails that only failed ──────────────────────────────────────────────────────────────────
const lens = between(page, 'async function _runLensPipeline(q, cat) {', '// ── ENRICHED _synthesiseLens');
const asked = [];
const rec = name => async (...a) => { asked.push(name + ' ' + a.join(' ')); return null; };
const LP = new Function('fetchWikiSummary', 'fetchWikiSearch', 'fetchPubMed', 'fetchCrossRef', 'fetchReddit', 'fetchWorldBank', 'fetchPatents', 'fetchArxiv', 'fetchOpenLibrary', 'fetchOpenAlexConcepts', 'fetchWikidata', 'fetchGuardian', '_fetchJSON', '_synthesiseLens',
  lens + '; return _runLensPipeline;')(rec('wikiSummary'), rec('wikiSearch'), rec('pubmed'), rec('crossref'), rec('reddit'), rec('worldbank'), rec('patents'), rec('arxiv'), rec('openlibrary'), rec('concepts'), rec('wikidata'), rec('guardian'),
  async url => { asked.push(url); return null; }, (q, cat, raw) => ({ cat, raw }));
const LENS_QUERY_AUGMENT = { consumer: q => q + ' consumer', market: q => q + ' market', culture: q => q + ' culture', brand: q => q + ' brand' };
globalThis.LENS_QUERY_AUGMENT = LENS_QUERY_AUGMENT;
for (const c of ['consumer', 'market', 'culture', 'brand']) await LP('AI backlash labor displacement safety public trust', c);
ok(asked.length > 10 && !asked.some(a => /semanticscholar|guardianapis|arxiv|patentsview|^wikiSummary|^patents|^arxiv|^guardian/.test(a)) && asked.some(a => /openalex/.test(a)) && asked.some(a => /^crossref/.test(a)),
  'F1 the four lenses no longer ask Semantic Scholar, the Guardian, arXiv, PatentsView or the Wikipedia summary; OpenAlex, Crossref and the rest still run (' + asked.length + ' calls)');
ok((lens.match(/Promise\.resolve\(null\),   \/\/ SEAM:EXC_STALL: retired/g) || []).length === 10, 'F2 ten retired calls, each holding its place so every lens still reads the same eight slots');

// ── G: the house laws ──────────────────────────────────────────────────────────────────────────────────────
const fresh = streamSrc + ssSrc + between(w, 'function excCut(', '// Server-side connectors') + between(w, 'async function claudeRecordEnd(', '/* Live: one request') + synth.split('\n').filter(l => /EXC_STALL|writeLeft|excMissing|excFill|filled|stillMissing|partial/.test(l)).join('\n');
ok(!/—/.test(fresh) && !/—/.test(page.split('\n').filter(l => /SEAM:EXC_STALL|EXC_STALL|QUIET_MS|lastByte|_pn=/.test(l)).join('\n')), 'G1 no em dash in the new code, its laws or its copy');
console.log('\nproof_excavate_stall: ' + pass + ' checks PASS');
process.exit(0);   // the wire's 6 s and the lenses' 10 s race timers (existing code) would otherwise hold the process open
