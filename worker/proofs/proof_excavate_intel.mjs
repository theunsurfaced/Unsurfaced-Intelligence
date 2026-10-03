/**
 * proof_excavate_intel.mjs  --  EX3a: the intelligent lane, time as a weight,
 * everything placed. Runs the real functions on fakes.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0029_reference.sql', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };
const day = 864e5, now = Date.parse('2026-09-28T12:00:00Z'), ago = d => new Date(now - d * day).toISOString();

// ── time as a weight ──────────────────────────────────────────────────────
const helpers = between('/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const H = new Function(helpers + '; return { EXC_TIME, EXC_TIME_LAW, excWhen, excBand, excAgeLabel, excTier, excWeight, excScore, excWindow, excLine, excBudget, EXC_BUDGET, REF_KINDS, LIVE_KINDS };')();
ok(H.excBand(H.excWhen({ published_at: ago(0.5) }), now) === 'NOW' && H.excBand(H.excWhen({ published_at: ago(20) }), now) === 'RECENT' &&
   H.excBand(H.excWhen({ published_at: ago(80) }), now) === 'CURRENT' && H.excBand(H.excWhen({ published_at: ago(600) }), now) === 'CONTEXT' &&
   H.excBand(H.excWhen({ published_at: ago(800) }), now) === 'ARCHIVE' && H.excBand(H.excWhen({}), now) === 'ARCHIVE', 'T1 five bands: NOW 24h, RECENT 30d, CURRENT 90d, CONTEXT 2y, ARCHIVE older or undated');
ok(H.excWhen({ published_at: '2024' }).getFullYear() === 2024 && H.excWhen({ text: '2019 · Journal of Hair · 12 citations' }).getFullYear() === 2019 &&
   H.excWhen({ text: 'reported on 2026-09-21 by the desk' }).toISOString().slice(0, 10) === '2026-09-21' && H.excWhen({ published_at: '2031-01-01' }) === null, 'T2 a year alone, a year in the text, a date in the text all date an item; a future date does not');
const wFast = H.excWeight({ published_at: ago(120), kind: 'news' }, now), wSlow = H.excWeight({ published_at: ago(120), kind: 'research' }, now);
ok(Math.abs(wFast - 0.5) < 0.01 && wSlow > 0.79 && wSlow < 0.8, 'T3 news halves in 120 days; a paper halves in 365');
ok(H.excWeight({ published_at: ago(900) }, now) === 0.05 && H.excWeight({}, now) === 0.05 && H.excWeight({ published_at: ago(700), kind: 'news' }, now) === 0.05, 'T4 ARCHIVE and the very old sit at the floor, never at zero');
ok(H.excScore({ published_at: ago(1), tier: 1 }, 0, 10, now) > H.excScore({ published_at: ago(1), tier: 4 }, 0, 10, now) &&
   H.excScore({ published_at: ago(1), similarity: 0.9 }, 5, 10, now) > H.excScore({ published_at: ago(1), similarity: 0.4 }, 0, 10, now), 'T5 tier and relevance weigh with time');
ok(/^\[3\] 2026-09-21 · RECENT · 7d · T1 · \(lake\) Title: text \{source:Guardian\|url:https:\/\/g\.example\/1\}$/.test(
   H.excLine({ published_at: ago(7), tier: 1, lens: 'lake', title: 'Title', text: 'text', source: 'Guardian', url: 'https://g.example/1' }, 2, now)) &&
   /^\[1\] undated · ARCHIVE · undated · T3 · \(general\)/.test(H.excLine({ title: 'x' }, 0, now)), 'T6 an evidence line opens with its date, band, age and tier');
ok(/NOW is under 24 hours old/.test(H.EXC_TIME_LAW) && /never presented as news/.test(H.EXC_TIME_LAW) && !/—/.test(H.EXC_TIME_LAW), 'T7 the time law is stated, without an em dash');

// ── the budget ranks and keeps the archive at four ────────────────────────
const dated = n => Array.from({ length: n }, (_, i) => ({ lens: 'market', title: 'dated ' + i, url: 'https://d.example/' + i, source: 'src' + i, published_at: ago(i + 1) }));
const arch = n => Array.from({ length: n }, (_, i) => ({ lens: 'market', title: 'old ' + i, url: 'https://o.example/' + i, source: 'old' + i, published_at: ago(1000 + i) }));
const lake = Array.from({ length: 6 }, (_, i) => ({ lens: 'lake', title: 'lake ' + i, url: 'https://l.example/' + i, source: 'lake' + i, published_at: ago(i * 5 + 2), tier: 2, similarity: 0.8 }));
const lakeOld = Array.from({ length: 10 }, (_, i) => ({ lens: 'lake', title: 'lake old ' + i, url: 'https://lo.example/' + i, source: 'lo' + i, published_at: ago(900 + i), similarity: 0.7 }));
const plan = H.excBudget(lakeOld.concat(dated(40)), [], now);
const bands = plan.merged.map(c => H.excBand(H.excWhen(c), now));
ok(plan.merged.length === 44 && bands.filter(b => b === 'ARCHIVE').length === 6 && plan.lake.length === 6 && plan.widened === false, 'B1 dated evidence waiting in one lane displaces archive lines in another, down to six kept for context');
// SEAM:EXC_RECORD: strong older sources hold their seats; weaker archive lines are the ones displaced.
const record = Array.from({ length: 3 }, (_, i) => ({ lens: 'market', title: 'study ' + i, url: 'https://r.example/' + i, source: 'mintel' + i, published_at: ago(800 + i), tier: 1, kind: 'research' }));
const plan2 = H.excBudget(lakeOld.concat(record, dated(40)), [], now);
ok(plan2.merged.filter(c => /^study/.test(c.title)).length === 3 && plan2.merged.filter(c => H.excBand(H.excWhen(c), now) === 'ARCHIVE').length === 6 && plan2.merged.filter(c => /^lake old/.test(c.title)).length === 3,
  'B1b three T1 studies from the record keep their seats among the six archive lines; the old lake blogs are the ones displaced');
ok(bands.slice(0, 38).every(b => b !== 'ARCHIVE') && bands.slice(38).every(b => b === 'ARCHIVE') && plan.merged[0].title === 'dated 0', 'B2 the evidence is ranked: freshest first, archive last');
const thin = H.excBudget(arch(20).concat(dated(5)), [], now);
ok(thin.merged.length === 25 && thin.widened === true && thin.dated === 5, 'B3 thin dated evidence widens the window instead of leaving the read short, and says so');
const full = H.excBudget(lake.concat(arch(30), dated(30)), Array.from({ length: 12 }, (_, i) => ({ signalType: 'news', source: 'wire' + i, title: 'wire ' + i, snippet: 's', url: 'https://w.example/' + i, published_at: ago(i + 1) })), now);
ok(full.merged.length === 44 && full.lake.length === 6 && full.server.length === 10 && full.merged.filter(c => H.excBand(H.excWhen(c), now) === 'ARCHIVE').length <= 4, 'B4 lake, wire and open fill 44 lines by rank, the archive capped');
ok(H.excBand(H.excWhen(full.merged[0]), now) === 'NOW' && full.merged.slice(0, 6).some(c => c.lens === 'lake') && full.merged.every(c => !c._a && !c._s) && full.server.every(a => a.signalType === 'news'), 'B5 the freshest line leads whatever its lane; no internal fields leak; the wire returns as it came');
const win = H.excWindow(full.merged, now);
ok(win.NOW + win.RECENT + win.CURRENT + win.CONTEXT + win.ARCHIVE === 44 && win.newest === ago(1).slice(0, 10) && win.ARCHIVE === full.merged.filter(c => H.excBand(H.excWhen(c), now) === 'ARCHIVE').length, 'B6 the window counts every line once and names the newest');

// ── the lane ──────────────────────────────────────────────────────────────
const lane = between('const EXC_MODEL = ', '/* SEAM:EXCAVATE_MEANING: the report contract.');
let calls = [];
const mk = (claudeSeq, spent) => new Function('callClaude', 'callModel', 'claudeSpent', 'claudeCap', 'CLAUDE', 'CONFIG', lane + '; return { excCompile, EXC_MODEL, excCacheKey };')(
  async (env, tier, req) => { calls.push({ tier, req }); return claudeSeq.shift() || { ok: false, error: 'claude_cap' }; },
  async (env, tier, msgs, o) => { calls.push({ reserve: tier, o }); return 'RESERVE:' + msgs[1].content; },
  async () => spent || 0, () => 10, { TIERS: { live: { model: 'claude-sonnet-5' } } }, { TEXT_MODEL: '@cf/meta/llama-4-scout-17b-16e-instruct' });
let L = mk([{ ok: true, text: 'LIVE', cost_usd: 0.04 }]);
let r = await L.excCompile({}, { system: 'S', prompt: 'P', max_tokens: 3600, kind: 'excavate_report', reserve: 't3' });
ok(r.lane === 'live' && r.text === 'LIVE' && r.model === 'claude-sonnet-5' && r.cost_usd === 0.04 && calls[0].tier === 'live' && calls[0].req.cache === true && calls[0].req.max_tokens === 3600 && calls[0].req.kind === 'excavate_report', 'L1 a read compiles on the live tier with the prefix cached and its kind in the ledger');
calls = []; L = mk([{ ok: false, error: 'claude_529' }, { ok: true, text: 'LIVE2' }]);
L.EXC_MODEL.RETRY_MS = 1;
r = await L.excCompile({}, { system: 'S', prompt: 'P' });
ok(r.lane === 'live' && r.text === 'LIVE2' && calls.length === 2, 'L2 an overloaded lane is retried once and then answers');
calls = []; L = mk([{ ok: false, error: 'claude_cap', spent: 10, cap: 10 }]);
r = await L.excCompile({}, { system: 'S', prompt: 'P', reserve: 't1' });
ok(r.lane === 'reserve' && r.text === 'RESERVE:P' && r.reason === 'claude_cap' && r.model === '@cf/meta/llama-4-scout-17b-16e-instruct' && calls.length === 2 && calls[1].reserve === 't1', 'L3 at the cap the reserve model compiles the same prompt and the read says why: a call never fails');
calls = []; L = mk([{ ok: false, error: 'claude_400' }]);
r = await L.excCompile({}, { system: 'S', prompt: 'P' });
ok(r.lane === 'reserve' && calls.length === 2 && r.reason === 'claude_400', 'L4 a bad request is not retried; the reserve answers');
calls = []; L = mk([{ ok: true, text: 'LIVE' }], 6.5);
r = await L.excCompile({}, { system: 'S', prompt: 'P', overnight: true });
ok(r.lane === 'reserve' && r.reason === 'overnight_share' && calls.length === 1 && calls[0].reserve, 'L5 overnight work past 60% of the cap steps aside for the reserve; the live lane is kept for a client in the room');
calls = []; L = mk([{ ok: true, text: 'LIVE' }], 5.9);
r = await L.excCompile({}, { system: 'S', prompt: 'P', overnight: true });
ok(r.lane === 'live' && calls.length === 1, 'L6 overnight work under the share rides the live lane');
ok(L.excCacheKey('abc') === 'excr:i4:abc' && L.EXC_MODEL.CACHE_TTL === 86400, 'L7 a live read is kept a day under its query');
ok(/live:   \{ model: 'claude-sonnet-5',  cap: 10, env: 'CLAUDE_LIVE_MONTHLY' \}/.test(w), 'L8 the live tier: Sonnet 5, $10 a month, CLAUDE_LIVE_MONTHLY to change');

// ── synthesize: cache, lane, dated findings ───────────────────────────────
const synth = between('async function synthesize(', '// Robust JSON extraction');
const xj = between('function jsonRepair(', '// Server-side connectors');
let kv = {}, compiled = null, ledger = null;
const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
const modelOut = JSON.stringify({ frame: { category: 'Hair care', audience: 'Gen Z' }, read: ['a', 'b'],
  insights: [{ category: 'consumer', title: 'Fresh', excerpt: 'x', evidence: [1, 2, 3], meaning: { culture: 'c' } },
             { category: 'market', title: 'Old only', excerpt: 'x', evidence: [6] },
             { category: 'culture', title: 'Context only', excerpt: 'x', evidence: [4, 5] }],
  ideas: [{ type: 'Campaign', headline: 'Gate the drop behind Ticketmaster stubs', body: 'At the 3 stadium dates.', proof: 'Billboard reported the sell-out.', evidence: [1], from: 0 }], brief: 'b' });
const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG', 'excCacheKey', 'EXC_MODEL',
  'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved', helpers + xj + synth + '; excReadPages = async () => ({ read: 0, dated: 0, tried: 0 }); excMeasures = async () => null; excFramedRerun = async () => []; return synthesize;')(
  (o) => o, async () => [], async () => [], async (e, o) => { compiled = o; return { text: modelOut, lane: o.prompt.includes('reserve-me') ? 'reserve' : 'live', model: 'claude-sonnet-5', reason: null, cost_usd: 0.04 }; },
  async (e, row) => { ledger = row; return 5; }, async (t) => 'h' + t.length, async () => 0, () => [], {}, L.excCacheKey, L.EXC_MODEL, async () => null, async () => null, async () => ({ tabled: 0, chunks: 0, failed: 0 }), async () => null, async () => [], () => []);
const agoR = d => new Date(Date.now() - d * day).toISOString();   // synthesize dates against the real clock
const corpus = [
  { lens: 'consumer', title: 'one', url: 'https://a.example/1', source: 'A', published_at: agoR(0.5), tier: 1 },
  { lens: 'consumer', title: 'two', url: 'https://b.example/2', source: 'B', published_at: agoR(2), tier: 2 },
  { lens: 'consumer', title: 'three', url: 'https://c.example/3', source: 'C', published_at: agoR(3) },
  { lens: 'market', title: 'four', url: 'https://d.example/4', source: 'D', published_at: agoR(400) },
  { lens: 'market', title: 'five', url: 'https://e.example/5', source: 'E', published_at: agoR(500) },
  { lens: 'market', title: 'six', url: 'https://f.example/6', source: 'F', published_at: agoR(3000) }];
const d = (await S({ query: 'Gen Z hair care', mode: 'report', corpus }, env, '')).data;
ok(/TIME LAW/.test(compiled.system) && /MOVE LAW/.test(compiled.system) && compiled.kind === 'excavate_report' && compiled.reserve === 't3', 'S1 the report compiles under the move law and the time law on the lane');
ok(/^\[1\] \d{4}-\d{2}-\d{2} · NOW · (?:today|1d) · T1 · \(consumer\) one/m.test(compiled.prompt) && /\[6\] \d{4}-\d{2}-\d{2} · ARCHIVE · 8\.2y/.test(compiled.prompt), 'S2 the model reads dated lines, freshest first, the archive last');
ok(d.insights[0].confidence === 'High' && d.insights[0].dated.band === 'NOW' && d.insights[0].dated.dated === 3, 'S3 three dated outlets under 90 days with tier weight 2 or more earn High (EX4a), and the finding says when it stands');
ok(d.insights[1].confidence === 'Low' && d.insights[1].dated.archive_only === true, 'S4 an archive-only finding is Low and says so');
ok(d.insights[2].confidence === 'Medium' && d.insights[2].dated.band === 'CONTEXT', 'S5 two outlets in CONTEXT earn Medium, never High');
ok(d.ideas[0].dated && d.ideas[0].dated.band === 'NOW' && d.model.lane === 'live' && d.model.cached === false && d.window.NOW === 1 && d.window.ARCHIVE === 1 && d.window.widened === true && d.compiled_at, 'S6 a move knows the date of its proof; the read carries its window, its widening and its lane');
ok(ledger.meta.window.NOW === 1 && ledger.meta.model.lane === 'live' && ledger.meta.widened === true, 'S7 the ledger keeps the window and the lane');
const keys = Object.keys(kv);
ok(keys.length === 1 && /^excr:i4:h/.test(keys[0]), 'S8 a live read is kept under its query');
compiled = null;
const again = (await S({ query: 'gen z hair care', mode: 'report', corpus: [] }, env, '')).data;
ok(compiled === null && again.model.cached === true && again.insights[0].title === 'Fresh', 'S9 the same query the same day is served as it was: nothing gathered, nothing spent');
kv = {};
const res2 = (await S({ query: 'reserve-me', mode: 'report', corpus }, env, '')).data;
ok(res2.model.lane === 'reserve' && Object.keys(kv).length === 0, 'S10 a reserve read is not kept: the next attempt gets the live lane');

// ── PROPOSE and the capture ───────────────────────────────────────────────
ok(/kind: 'excavate_propose',   \/\/ SEAM:EXC_INTEL[^\n]*\n\s+overnight: internal === true, reserve: 't3', max_tokens: 2400 \}\);/.test(w) && !/const reply = await callModel\(env, 't3', \[\n        \{ role: 'system', content: sys \},\n        \{ role: 'user', content: brief \}/.test(w), 'P1 PROPOSE names the field on the lane; warmed overnight it keeps to the share');
ok(H.REF_KINDS.has('research') && H.REF_KINDS.has('filing') && H.REF_KINDS.has('reference') && H.REF_KINDS.has('truth') && !H.REF_KINDS.has('entity') && !H.REF_KINDS.has('consumer'), 'P2 reference kinds: papers, filings, reference pages, fact-checks; never entities or lens copies');
ok(/status: reference \? 'reference' : 'raw'/.test(w) && /signals\?status=in\.\(raw,reference\)&embedding=is\.null/.test(w), 'P3 reference rows are placed as reference and the drain embeds them; they keep their status');
ok(/status=in\.\(connected,published\)&cluster_id=not\.is\.null/.test(w) && /status=in\.\(connected,filtered\)&captured_at=gte\./.test(w), 'P4 DAILY compose and the field still read connected, filtered and published rows only');
ok(/published_at: x\.publishedDate \|\| null/.test(w) && /published_at: h\.created_at \|\| null/.test(w) && /published_at: a\.seendate \? String\(a\.seendate\)\.replace/.test(w), 'P5 Exa, HN and GDELT carry their dates onto the wire');
ok(/filter=from_publication_date:' \+ railSince\(730\)/.test(w) && /from-date=' \+ railSince\(730\)/.test(w) && /numericFilters=created_at_i>' \+ Math\.floor/.test(w) && /filter=from-pub-date:' \+ railSince\(730\)/.test(w), 'P6 OpenAlex, Guardian, HN and CrossRef gather a recent slice');
const gss = between('async function gatherServerSignals(', 'function serverConnectors(');
const _net = async (url) => {
  if (/gdeltproject/.test(url)) return new Response(JSON.stringify({ articles: [{ title: 'A', url: 'https://n.example/a', domain: 'n.example', seendate: '20260920T131500Z', language: 'English' }, { title: 'B', url: 'https://n.example/b', domain: 'n.example', seendate: '20260921', language: 'English' }] }), { status: 200 });
  return new Response('{}', { status: 404 });
};
const GSS = new Function('fetch', 'railFetch', gss + '; return gatherServerSignals;')(_net, async u => { const r = await _net(u); return r.ok ? r.json() : null; });
const wire = await GSS('x');
ok(wire[0].published_at === '2026-09-20T13:15:00Z' && wire[1].published_at === '2026-09-21', 'P7 a GDELT seendate becomes a date the ranker can read');

// ── the migration, the gate, the seam ────────────────────────────────────
ok(/check \(status in \('raw', 'filtered', 'connected', 'published', 'rejected', 'reference'\)\)/.test(mig) && /pg_get_constraintdef\(oid\) ilike '%status%'/.test(mig), 'M1 0029 adds the reference state, whatever the old check was named');
ok(/check \(tier in \('doc', 'ingest', 'live'\)\)/.test(mig) && /'public\.claude_jobs'::regclass/.test(mig), 'M2 0029 lets the Claude ledger record the live tier');
ok(/'excCompile': 'the EXCAVATE lane/.test(gate) && !/'excavatePropose':/.test(gate), 'G1 the lane is the registered spender; PROPOSE no longer spends on its own');
ok(JSON.parse(fs.readFileSync('seams.json', 'utf-8')).registry['SEAM:EXC_INTEL'].file === 'worker/src/index.js', 'G2 SEAM:EXC_INTEL is registered');

// ── the page ──────────────────────────────────────────────────────────────
ok(/published_at: s\.published_at \|\| null, kind: \(s\.momentum && s\.momentum\.kind\) \|\| 'news', tier: s\.source_tier, similarity: s\.similarity/.test(page) && /count: 16 \}\)/.test(page), 'C1 the lake lane carries dates, kinds, tiers and similarity; sixteen candidates for ten seats');
ok(/rail:'gather', published_at:it\.published_at\|\|null, kind:it\.kind\|\|null, tier:it\.source_tier\|\|null/.test(page), 'C2 gathered items carry their dates and kinds into the corpus');
ok(/function _whenChip\(d\)/.test(page) && /\$\{_whenChip\(ins\.dated\)\}/.test(page) && /ARCHIVE ONLY/.test(page), 'C3 every finding shows the band and date it stands on; archive-only says so');
ok(/class="move-when \$\{safe\(m\.dated\.band\|\|''\)\}">EVIDENCE/.test(page), 'C4 every move shows when its evidence stands');
ok(/rows\.push\(\['window'/.test(page) && /widened: dated evidence was thin/.test(page) && /rows\.push\(\['compiled',`\$\{n\(mdl\.model\|\|''\)\}/.test(page) && /reserve model/.test(page), 'C5 the read shows its window and its model in the receipts, and says when the window widened or the reserve compiled');
ok(/const EXC_PANEL_QUERIES = \[/.test(page) && /async function excPanelRun\(label\)/.test(page) && /function excPanelCompare\(\)/.test(page) && /panel=\(before\|after\|compare\)/.test(page), 'C6 the panel: before, after, compare');
ok(/\.exc-panel\{position:fixed;inset:0;z-index:var\(--z-board\)/.test(page), 'C7 the panel sits on a stacking token');
ok(/function _epUnwrap\(j\)/.test(page) && /res\(_epUnwrap\(JSON\.parse\(r\.result\)\)\)/.test(page), 'C8 the compare page reads a panel file as the object itself or as the SQL editor exports it');
console.log(`\nproof_excavate_intel: ${pass} checks PASS`);
