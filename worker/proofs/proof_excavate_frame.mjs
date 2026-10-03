/**
 * proof_excavate_frame.mjs  --  EX4a + EX4b: accuracy laws, the frame, the
 * relevance gate, the deadline-bound gather, the wire not run twice, the
 * timings, and the stream. Runs the real functions on fakes.
 * Run from the repo root: node worker/proofs/proof_excavate_frame.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };
const quiet = () => { const o = console.log; const logs = []; console.log = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; } }; };

const helpers = between('/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const xj = between('function jsonRepair(', '// Server-side connectors');
const synth = between('async function synthesize(', '// Robust JSON extraction');
const lane = between('const EXC_MODEL = ', '/* SEAM:EXCAVATE_MEANING: the report contract.');
const H = new Function(xj + helpers + '; return { excNumbers, excGround, excEarned, excClip, excRelevance, excFrameClean, excFrameWhole, excRailQuery, excFrameBlock, excDraft, excBudget, excOutletKey, EXC_GATE, EXC_NUMBER_LAW, EXC_FRAME_SYS };')();

// ── A: accuracy ───────────────────────────────────────────────────────────
ok(H.excClip('One sentence here. Two sentence there. Three.', 40) === 'One sentence here. Two sentence there.' && H.excClip('short', 420) === 'short' &&
   /…$/.test(H.excClip('a very long clause without any stop at all in it that runs and runs past the limit', 40)), 'A1 THE READ is clipped at a sentence end, never mid-clause');
const nums = H.excNumbers('84% check INCI (Mintel, reported Sep 15, 2026), &honey at Ulta (Sep 25), priced at $20, 1,000 CVS stores, week 3, Q3, 2.5 million, evidence 12 and 3, 7 ingredients');
ok(nums.map(n => n.text).join('|') === '84%|$20|1,000|2.5 million', 'A2 percents, money, counts and decimals are claims; dates, weeks, quarters, evidence numbers and single digits are not');
const g = H.excGround('84% check INCI and 11x citations', [{ title: 'Mintel: 84% of Gen Z consult INCI databases', text: '61% reject more than 7 ingredients' }]);
ok(g.numbers === 2 && g.ungrounded.length === 1 && g.ungrounded[0] === '11', 'A3 a number not in the cited evidence is named; one that is passes');
ok(H.excGround('no numbers here', []).numbers === 0 && H.excGround('1,000 stores', [{ text: 'into 1000 CVS stores' }]).ungrounded.length === 0, 'A4 1,000 and 1000 are the same number; text without numbers has nothing to check');
ok(H.excNumbers('COVID-19 era, B2B, FY25, 18-24 year olds, 90s nostalgia').length === 0 && H.excNumbers('ranked 10th, the 12th drop').map(n => n.v).join() === '10,12' && H.excGround('84% of buyers', [{ text: '84 stores' }]).ungrounded[0] === '84%' && H.excGround('84 per cent of buyers', [{ text: '84%' }]).ungrounded.length === 0,
  'A4b letters glued to digits, decades, fiscal years and age ranges are not claims; a ranking is; a percent is grounded only by a percent, however it is spelled');
ok(H.excOutletKey({ source: 'Unsurfaced Lake · Guardian (T1)' }) === 'guardian' && H.excOutletKey({ source: 'The Guardian' }) === 'guardian' && H.excOutletKey({ url: 'https://www.theguardian.com/x' }) === 'guardian' && H.excOutletKey({ source: 'theguardian.com' }) === 'guardian' && H.excOutletKey({ source: 'beautynexuspro.com' }) === 'beautynexuspro',
  'A4c one outlet is one outlet however it arrived: lake copy, wire copy and URL share a key');
ok(H.excEarned([{ source: 'blog', tier: 3 }], true) === 'Low' && H.excEarned([{ source: 'a', tier: 3 }, { source: 'b', tier: 3 }, { source: 'c', tier: 3 }], true) === 'Medium' &&
   H.excEarned([{ source: 'a', tier: 1 }, { source: 'b', tier: 2 }, { source: 'c', tier: 3 }], true) === 'High' && H.excEarned([{ source: 'a', tier: 1 }, { source: 'b', tier: 1 }, { source: 'c', tier: 1 }], false) === 'Medium',
   'A5 confidence is weighed by tier: one blog is Low, three blogs are Medium, a T1 + T2 + T3 under 90 days is High, nothing stale is High');
ok(/as reported by/.test(H.EXC_NUMBER_LAW) && /never leads THE READ/.test(H.EXC_NUMBER_LAW) && /name the market/.test(H.EXC_NUMBER_LAW) && !/—/.test(H.EXC_NUMBER_LAW), 'A6 the number law asks for "as reported by", keeps T3 figures off the headline and names a foreign market');

// ── F: the frame ──────────────────────────────────────────────────────────
const raw = { entity: 'null', category: 'Hair care', audience: 'Gen Z', market: '', competitors: ['&honey', 'Being', 'Hair Proud', 'x', 'y', 'z'],
  question: 'Which formulation cue wins the under-25 shelf?', anchors: ['hair care', 'haircare', 'shampoo', 'conditioner', 'curl', 'Scalp'], exclude: ['hair removal', 'laser'],
  queries: { news: 'gen z hair care brands', research: 'adolescent hair product purchase intention', discourse: 'gen z hair routine', web: 'gen z haircare trends 2026' } };
const f = H.excFrameClean(raw);
ok(f.entity === null && f.market === 'US' && f.competitors.length === 5 && f.anchors.includes('scalp') && f.exclude[0] === 'hair removal' && f.queries.research === 'adolescent hair product purchase intention',
  'F1 a frame is cleaned: null strings are null, no market means US, lists are capped and lowercased');
ok(H.excFrameClean({}) === null && H.excFrameClean('x') === null && H.excFrameClean({ entity: 'Nike' }).entity === 'Nike', 'F2 a frame with neither entity nor category is no frame');
ok(H.excRailQuery({ kind: 'research' }, 'gen z hair care', f) === 'adolescent hair product purchase intention' && H.excRailQuery({ kind: 'news' }, 'q', f) === 'gen z hair care brands' &&
   H.excRailQuery({ kind: 'entity' }, 'q', f) === 'q' && H.excRailQuery({ kind: 'research' }, 'q', null) === 'q', 'F3 research, news, discourse and web rails ask in their own register; entity rails keep the query; no frame, no change');
ok(/FRAME: category Hair care; audience Gen Z; market US; competitive set &honey, Being/.test(H.excFrameBlock(f)) && /The question: Which formulation/.test(H.excFrameBlock(f)) && H.excFrameBlock(null) === '',
  'F4 the frame heads the prompt with market, competitive set and the question');
ok(/STRICT JSON only/.test(H.EXC_FRAME_SYS) && /"anchors"/.test(H.EXC_FRAME_SYS) && /"exclude"/.test(H.EXC_FRAME_SYS) && !/—/.test(H.EXC_FRAME_SYS), 'F5 the frame contract asks for anchors, excludes and per-rail queries, without an em dash');

// ── R: the relevance gate ─────────────────────────────────────────────────
const item = (t, x) => Object.assign({ title: t, text: '' }, x || {});
const pool = [item('Gen Z hair care routines go scalp-first'), item('Why Gen Z is losing hair: laser hair removal trends'), item('Understanding China Belt and Road'),
  item('Strategic management', { kind: 'entity' }), item('Pageviews series', { kind: 'attention' }), item('A lake row about curl patterns', { similarity: 0.7 }), item('A far lake row', { similarity: 0.2 })];
const r = H.excRelevance(pool, f);
ok(r.kept.length === 6 && r.dropped.length === 1 && r.dropped[0].why === 'exclude:hair removal' && r.restored === 2 && r.kept.slice(0, 4).every(c => !/Belt|far lake/.test(c.title)),
  'R1 an excluded neighbor is set aside for good; entities, attention and close lake rows pass first; below the floor, the no-anchor items come back behind them, counted');
const many = Array.from({ length: 20 }, (_, i) => item('off topic ' + i));
const r2 = H.excRelevance(many.concat([item('laser hair removal')]), f);
ok(r2.kept.length === H.EXC_GATE.MIN && r2.restored === H.EXC_GATE.MIN && r2.dropped.length === 9 && !r2.kept.some(c => /laser/.test(c.title)),
  'R2 the gate never starves a read: set-aside items return up to the floor, but an excluded neighbor never returns');
ok(H.excRelevance(pool, null).kept.length === 7 && H.excRelevance(pool, { category: 'x', anchors: [] }).dropped.length === 0, 'R3 without a frame, or without anchors, nothing is gated');
ok(H.excRelevance([item("Nike's new drop sells out"), item('Nike, Inc. restructures')], { category: 'x', anchors: ['nike'], exclude: [] }).dropped.length === 0, 'R4 a possessive or a comma after the entity still counts as a mention');
ok(H.excFrameWhole({ category: 'x' }) === null && H.excFrameWhole(f).anchors.length === 6 && H.excFrameClean({ category: 'x', market: '<img src=x onerror=1>' }).market === 'US' && H.excFrameClean({ category: 'x', market: "Côte d'Ivoire" }).market === "Côte d'Ivoire" && H.excFrameClean({ category: '<b>Hair</b> care' }).category === 'Hair care', 'R5 a frame is whole only with its anchors; a market that is not a place name is not a market');

// ── G: the gather pool ────────────────────────────────────────────────────
const gatherSrc = between('async function gatherOpenSignals(', 'async function excavateGather(');
const mkGather = (railMs, opts) => {
  const calls = [];
  const RAILS = [
    { id: 'kg', kind: 'entity', classes: ['behavior'], name: 'KG' }, { id: 'wikipedia', kind: 'reference', classes: ['behavior'], name: 'Wikipedia' },
    { id: 'wikimedia_pageviews', kind: 'attention', classes: ['behavior'], name: 'Pageviews' }, { id: 'openalex', kind: 'research', classes: ['behavior'], name: 'OpenAlex' },
    { id: 'gdelt', kind: 'news', classes: ['behavior'], name: 'GDELT' }, { id: 'slow', kind: 'web', classes: ['behavior'], name: 'Slow' }, { id: 'exa', kind: 'web', classes: ['behavior'], name: 'Exa' }];
  const fn = id => async (env, q, ctx, rail) => { calls.push({ id, q, at: Date.now() }); if (id === 'wikipedia') ctx.meta.wiki_title = 'Hair care';
    await new Promise(res => setTimeout(res, railMs[id] || 10)); if (id === 'wikimedia_pageviews') calls.push({ id: 'pv_saw_title', q: ctx.meta.wiki_title }); return [{ title: id + ' item', url: 'https://' + id + '.example/1', rail: id, source_tier: 3, kind: rail.kind }]; };
  const RAIL_FNS = Object.fromEntries(RAILS.map(r => [r.id, fn(r.id)]));
  const G = new Function('RAILS', 'RAIL_BY_ID', 'RAIL_FNS', 'railAllowed', 'classifyQuery', 'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved', 'excFrameClean', 'excFrameWhole', 'excRailQuery', 'GATHER', 'looksEnglish', 'gatherOrder', 'bumpYield', 'excQuiet', 'excStampTiers',
    gatherSrc + '; return gatherOpenSignals;')(RAILS, Object.fromEntries(RAILS.map(r => [r.id, r])), RAIL_FNS, async () => true, () => 'behavior',
    async () => { await new Promise(res => setTimeout(res, (opts && opts.frameMs) || 20)); return (opts && opts.frame) ? H.excFrameClean(opts.frame) : null; }, async () => null, async () => ({ tabled: 0 }), async () => null, async () => [], () => [], H.excFrameClean, H.excFrameWhole, H.excRailQuery,
    { PAR: 3, MAX_ITEMS: 60, BUDGET_MS: (opts && opts.budget) || 800, RAIL_MS: (opts && opts.railMs) || 400, KG_MS: 100, FRAME_WAIT_MS: 150 }, () => true, x => x, async () => {}, () => () => null, () => null);
  return { G, calls };
};
let { G, calls } = mkGather({}, { frame: raw });
let out = await G({}, 'gen z hair care', {});
ok(out.ok && out.items.length === 7 && out.meta.frame && out.meta.frame.category === 'Hair care' && Number.isFinite(out.meta.gather_ms) && out.rails.every(x => x.ok && !x.skipped),
  'G1 every rail answers, the frame rides out in meta, the gather knows its own time');
const idx = id => calls.findIndex(c => c.id === id);
ok(idx('kg') === 0 && idx('wikipedia') === 1 && idx('exa') < idx('gdelt') && idx('exa') < idx('openalex') && idx('exa') < idx('slow'), 'G1b the entity lookup, then Wikipedia, then the paid rail before the free ones, never last');
ok(calls.find(c => c.id === 'openalex').q === 'adolescent hair product purchase intention' && calls.find(c => c.id === 'gdelt').q === 'gen z hair care brands' && calls.find(c => c.id === 'wikipedia').q === 'gen z hair care',
  'G2 research and news rails asked with the frame\'s own queries; the reference rail asked with the plain query');
const pv = calls.find(c => c.id === 'pv_saw_title');
ok(pv && pv.q === 'Hair care' && calls.find(c => c.id === 'wikipedia').at <= calls.find(c => c.id === 'wikimedia_pageviews').at, 'G3 Pageviews still reads the title Wikipedia found');
({ G, calls } = mkGather({ slow: 2000 }, { railMs: 300, budget: 900 }));
const t0 = Date.now(); out = await G({}, 'gen z hair care', {}); const took = Date.now() - t0;
const slow = out.rails.find(x => x.id === 'slow');
ok(took < 1500 && slow && !slow.ok && slow.skipped === 'late' && out.items.length === 6 && out.rails.filter(x => x.ok).length === 6,
  'G4 a slow rail is counted late and the gather answers with the rest inside its budget');
({ G, calls } = mkGather({ wikipedia: 1500, exa: 1500, openalex: 1500 }, { railMs: 2000, budget: 700 }));
calls.length = 0; out = await G({}, 'gen z hair care', {}); await new Promise(res => setTimeout(res, 1800));
ok(out.rails.filter(x => x.skipped === 'late').length >= 3 && !calls.some(c => c.id === 'slow' || c.id === 'gdelt'), 'G4b once the budget is spent, no further rail is dispatched behind the answer');
({ G, calls } = mkGather({}, { frameMs: 5000 }));
out = await G({}, 'gen z hair care', {});
ok(out.ok && !out.meta.frame && calls.find(c => c.id === 'openalex').q === 'gen z hair care', 'G5 a slow frame never holds the gather: rails ask with the plain query and the read runs unframed');
({ G, calls } = mkGather({}, {}));
out = await G({}, 'gen z hair care', { frame: raw });
ok(out.meta.frame.category === 'Hair care' && calls.find(c => c.id === 'gdelt').q === 'gen z hair care brands', 'G6 a frame handed in is used as is, with no second Haiku call');

// ── S: synthesize with the frame, the gate, the wire and the timings ──────
const corpus = [
  { lens: 'consumer', title: 'Gen Z hair care: 84% check INCI', text: '84% of Gen Z consult INCI databases; 61% reject products with more than 7 ingredients', url: 'https://a.example/1', source: 'beautynexuspro.com', tier: 3, published_at: new Date(Date.now() - 864e5).toISOString(), rail: 'gather' },
  { lens: 'market', title: '&honey brings six hair care products to Ulta', text: 'Japanese moisture brand lands on US shelves', url: 'https://b.example/2', source: 'trendhunter.com', tier: 3, published_at: new Date(Date.now() - 5 * 864e5).toISOString(), rail: 'gather' },
  { lens: 'market', title: 'Shampoo shelves sort by curl pattern at Target', text: 'Target planogram adds five collections', url: 'https://c.example/3', source: 'The Guardian', tier: 1, published_at: new Date(Date.now() - 9 * 864e5).toISOString(), rail: 'gather' },
  { lens: 'culture', title: 'Why Gen Z is losing hair: laser hair removal', text: 'premature baldness explainer', url: 'https://d.example/4', source: 'YouTube', tier: 3, published_at: new Date(Date.now() - 2 * 864e5).toISOString(), rail: 'gather' },
  { lens: 'brand', title: 'Understanding China Belt and Road Initiative', text: 'infrastructure paper', url: 'https://e.example/5', source: 'OpenAlex', tier: 1, published_at: '2022-01-01', rail: 'gather' }]
  .concat(Array.from({ length: 12 }, (_, i) => ({ lens: 'consumer', title: 'Shampoo note ' + i, text: 'an older shampoo note', url: 'https://f.example/' + i, source: 'blog' + i, tier: 4, published_at: new Date(Date.now() - (400 + i) * 864e5).toISOString(), rail: 'gather' })));
// Evidence numbers follow the budget's own order, so the fixture asks the budget where each item landed.
const keptPlan = H.excBudget(H.excRelevance(corpus, H.excFrameClean(raw)).kept, []);
const at = t => keptPlan.merged.findIndex(c => c.title.startsWith(t)) + 1;
const N = { nexus: at('Gen Z hair care: 84%'), honey: at('&honey'), guardian: at('Shampoo shelves') };
const modelOut = JSON.stringify({ frame: { category: 'Hair care', audience: 'Gen Z' }, read: ['Gen Z hair care became a spec sheet: 84% check INCI before buying, per Mintel as reported by Beauty Nexus.', 'Shrink the ingredient deck and publish it.'],
  insights: [{ category: 'consumer', title: 'Ingredient literacy gates the purchase', excerpt: '84% check INCI and 61% reject over 7 ingredients.', evidence: [N.nexus], meaning: { culture: 'c' } },
             { category: 'market', title: 'Japanese moisture brands land at once', excerpt: '&honey brought six products to Ulta while Target added five collections.', evidence: [N.honey, N.guardian] },
             { category: 'brand', title: 'Made-up number', excerpt: 'Brand loyalty rose 37% this quarter.', evidence: [N.honey, N.guardian] }],
  ideas: [{ type: 'Product', headline: 'Cap the formula at 7 ingredients and print the INCI list', body: 'Reformulate the hero shampoo to 7 or fewer ingredients, the threshold 61% of Gen Z enforce.', proof: 'Beauty Nexus reports 61% reject over 7 ingredients.', evidence: [N.nexus], from: 0 }], brief: 'Where it is and what to do first.' });
let wireCalls = 0, call = null, stages = [];
const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG', 'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved',
  xj + helpers + synth + '; excReadPages = async () => ({ read: 0, dated: 0, tried: 0 }); excMeasures = async () => null; return synthesize;')(
  (o) => o, async () => { wireCalls++; return []; }, async () => { wireCalls++; return []; },
  async (e, o) => { call = o; if (o.onText) { o.onText(modelOut.slice(0, 400)); o.onText(modelOut); } return { text: modelOut, lane: 'live', model: 'claude-sonnet-5', reason: null, cost_usd: 0.05, stop_reason: 'end_turn' }; },
  async () => 1, async t => 'h' + t.length, async () => 0, () => [], {}, async () => raw, async () => null, async () => ({ tabled: 0, chunks: 0, failed: 0 }), async () => null, async () => [], () => []);
const q1 = quiet();
let res = (await S({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn', 'exa'], corpus }, {}, '', { onStage: st => stages.push(st) })).data;
q1.done();
ok(wireCalls === 0 && res.timing.wire_skipped === true && Number.isFinite(res.timing.model_ms) && Number.isFinite(res.timing.total_ms), 'S1 when the gather already ran the wire, synthesize does not run GDELT, HN or Exa again, and the read carries its timings');
ok(/^FRAME: category Hair care; audience Gen Z; market US/.test(call.prompt) && /NUMBER LAW/.test(call.system), 'S2 the frame heads the prompt and the number law rides the system prompt');
ok(N.nexus > 0 && N.honey > 0 && N.guardian > 0 && res.relevance.framed && res.relevance.kept === 15 && res.relevance.set_aside === 2 && res.relevance.sample.some(d => /exclude:hair removal/.test(d.why)) && !/Belt and Road/.test(call.prompt),
  'S3 the read stands on framed evidence only: the hair-removal video and the Belt and Road paper are set aside and named');
ok(res.frame.market === 'US' && res.frame.competitors.length === 5 && res.frame.category === 'Hair care' && !res.frame.anchors && !res.frame.queries, 'S4 the read carries market and competitive set, not the frame\'s working lists');
ok(res.read[0].length > 90 && /Beauty Nexus\.$/.test(res.read[0]) && res.read_checks.numbers === 1 && res.read_checks.ungrounded.length === 0, 'S5 THE READ keeps its whole first sentence and its number is grounded');
ok(res.insights[0].confidence === 'Low' && res.insights[0].checks.ungrounded.length === 0, 'S6 a finding on one T3 blog is Low however fresh it is');
ok(res.insights[1].confidence === 'Medium' && res.insights[2].confidence === 'Low' && res.insights[2].checks.ungrounded[0] === '37%', 'S7 a T1 + T3 pair is Medium; a finding stating a number its evidence does not carry is named and drops to Low');
ok(res.ideas[0].checks.numbers === 1 && res.ideas[0].checks.ungrounded.length === 0, 'S8 a move\'s numbers are checked against its proof');
ok(stages.map(s => s.stage).join() === 'reading,tabling,writing' && stages[2].evidence === 15 && stages[2].dropped === 2, 'S9 the stages are announced in order: reading pages, tabling facts, writing; the last says what the read stands on');
const q2 = quiet(); wireCalls = 0;
res = (await S({ query: 'gen z hair care', mode: 'report', corpus: corpus.map(c => Object.assign({}, c, { rail: null })) }, {}, '')).data;
q2.done();
ok(wireCalls === 2 && res.timing.wire_skipped === false, 'S10 without a gather, the free wire and the paid rail still run, together');
const q3 = quiet(); wireCalls = 0;
res = (await S({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn'], corpus }, {}, '')).data;
q3.done();
ok(wireCalls === 1 && res.timing.wire_skipped === false, 'S11 a gather that ran GDELT and HN but not Exa spares the free wire and still asks the paid rail');
const q4 = quiet(); wireCalls = 0;
const co = await S({ query: 'never compiled', mode: 'report', cache_only: true, corpus }, {}, '');
q4.done();
ok(co.ok === false && co.error === 'not_cached' && wireCalls === 0, 'S12 cache_only asks for a read that already landed and compiles nothing');

// ── D: the live draft ─────────────────────────────────────────────────────
const half = modelOut.slice(0, modelOut.indexOf('"ideas"') - 1);
const d = H.excDraft(half);
ok(d && d.read.length === 2 && d.insights.length === 3 && d.insights[0].title === 'Ingredient literacy gates the purchase' && d.ideas.length === 0, 'D1 a half-written reply already shows its two lines and its finished findings');
ok(H.excDraft('{"frame":{"category":"Hair') === null && H.excDraft('prose') === null, 'D2 nothing to show is nothing shown');

// ── C: the stream ─────────────────────────────────────────────────────────
const streamSrc = between('async function callClaudeStream(', '/* Batch: half price');
const sse = evts => evts.map(e => 'event: ' + e.type + '\ndata: ' + JSON.stringify(e) + '\n\n').join('');
const body = sse([{ type: 'message_start', message: { id: 'msg_1', usage: { input_tokens: 1000, cache_read_input_tokens: 800 } } },
  { type: 'content_block_delta', delta: { type: 'text_delta', text: '{"read":["a"' } }, { type: 'ping' },
  { type: 'content_block_delta', delta: { type: 'text_delta', text: ',"b"]}' } }, { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 20 } }]);
const chunks = [], recorded = [];
const CS = new Function('CLAUDE', 'claudeParams', 'claudeEstimate', 'claudeGate', 'claudeHeaders', 'claudeCost', 'claudeLedgerAdd', 'claudeRecord', 'excQuiet', 'fetch',
  streamSrc + '; return callClaudeStream;')({ API: 'x', TIERS: { live: { model: 'claude-sonnet-5' } }, LIVE_TIMEOUT_MS: 5000 }, (t, r) => ({ model: 'claude-sonnet-5', max_tokens: r.max_tokens }), () => 0.01,
  async () => ({ ok: true }), () => ({}), (m, u) => (u.output_tokens || 0) * 1e-5, async () => {}, async (env, rows) => { recorded.push(rows[0]); return [9]; }, () => () => null,
  async (url, o) => { const p = JSON.parse(o.body); chunks.push(p); const enc = new TextEncoder(); const b = enc.encode(body);
    return { ok: true, body: new ReadableStream({ start(c) { c.enqueue(b.slice(0, 40)); c.enqueue(b.slice(40)); c.close(); } }) }; });
const heard = [];
const sr = await CS({}, 'live', { prompt: 'P', max_tokens: 100, kind: 'excavate_report' }, t => heard.push(t));
ok(sr.ok && sr.text === '{"read":["a","b"]}' && sr.stop_reason === 'end_turn' && sr.truncated === false && heard.length === 2 && heard[0] === '{"read":["a"' && chunks[0].stream === true,
  'C1 the live call streams: each delta is heard with the text so far, the stop reason and the whole text come back');
ok(recorded[0].status === 'done' && recorded[0].meta.stream === true && recorded[0].usage.output_tokens === 20 && Math.abs(recorded[0].cost_usd - 0.0002) < 1e-9, 'C2 a streamed call lands in the same ledger with its usage and cost');
const ssSrc = between('async function synthesizeStream(', 'function corsHeaders(');
const SS = new Function('synthesize', 'corsHeaders', 'excDraft', 'EXC_SPEED', 'excQuiet', ssSrc + '; return synthesizeStream;')(
  async (b, env, origin, hooks) => { hooks.onStage({ stage: 'writing', evidence: 3 }); hooks.onText(half); await new Promise(res => setTimeout(res, 20)); hooks.onText(modelOut); return hooks.reply({ ok: true, data: { insights: [1] } }); },
  () => new Headers(), H.excDraft, { STREAM_EVERY_MS: 0, DRAFT_TRIES: 4 }, () => () => null);
const resp = await SS({ query: 'q', corpus: [] }, {}, '', { waitUntil: () => {} });
const text = await resp.text();
const events = text.split('\n\n').filter(Boolean).map(e => ({ type: e.match(/^event: (\w+)/)[1], data: JSON.parse(e.match(/\ndata: (.*)$/s)[1]) }));
ok(resp.headers.get('Content-Type').startsWith('text/event-stream') && events[0].type === 'stage' && events[0].data.stage === 'reading' && events[1].type === 'stage' && events[1].data.stage === 'writing',
  'C3 the stream opens with the reading stage and announces the writing stage');
const drafts = events.filter(e => e.type === 'draft');
ok(drafts.length >= 1 && drafts[0].data.insights.length === 3 && events[events.length - 1].type === 'final' && events[events.length - 1].data.ok === true && events[events.length - 1].data.data.insights.length === 1,
  'C4 drafts arrive as findings finish, and the final event is the plain door\'s own payload');
const seen = w.slice(w.indexOf("case '/excavate/synthesize':"), w.indexOf("case '/excavate/synthesize':") + 160);
ok(/body && body\.stream \? synthesizeStream\(body, env, origin, ctx\) : synthesize\(body, env, origin\)/.test(seen) && /async fetch\(request, env, ctx\)/.test(w) && /wctx\.waitUntil\(write\)/.test(w),
  'C5 the door streams on request, the plain door is unchanged, and the gather\'s lake write rides waitUntil');
ok(!/\u2014/.test(helpers + lane + streamSrc + ssSrc + gatherSrc) && !/\u2014/.test(synth.split('\n').filter(l => /EXC_(?:ACCURACY|FRAME|RELEVANCE|SPEED|STREAM)/.test(l)).join('\n')), 'C6 no em dash in the new code or its laws');
console.log('\nproof_excavate_frame: ' + pass + ' checks PASS');
