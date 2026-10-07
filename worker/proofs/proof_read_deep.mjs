/**
 * proof_read_deep.mjs  --  EX17 THE DEEP RECON: search and measure (SEAM:READ_DEEP).
 * Runs the shipped read engine and the shipped Claude lane on fakes. Run from the repo root: node worker/proofs/proof_read_deep.mjs
 *   A  the ledger: the recon tier, the commission ceiling, the reset caps, the room
 *   P  the plan                      S  the lake by meaning           G  the gathers and the counter pass
 *   V  the voices                    R  reading in full               C  the evidence cards
 *   L  coding and counting comments  M  views and the kinds of outlet  E  the evidence file and the stage machine
 *   W  the batches back              K  the deep pack                 X  the laws know C (and never a plan id)
 *   T  the tick, the compile, the hold                                Q  the commission, the release, the revision
 *   Z  migration, page, gate, Method
 * Every finding of the EX17 review has its check here (marked "review:"). EX18 (SEAM:READ_THINK) changed what the compile sends: the
 * first of four passes, the analysis, where EX17 sent one compile; the checks below say so, and proof_read_think proves the passes.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0037_recon_deep.sql', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const quiet = () => { const o = console.log; console.log = () => {}; return () => { console.log = o; }; };
const clone = o => JSON.parse(JSON.stringify(o));
const badText = v => typeof v === 'string' ? /\u0000|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(v) : Array.isArray(v) ? v.some(badText) : v && typeof v === 'object' ? Object.keys(v).some(k => badText(k) || badText(v[k])) : false;   // what jsonb refuses

// ── the shipped bytes ─────────────────────────────────────────────────
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const lane = w.slice(w.indexOf('/* SEAM:CLAUDE_ROUTE: the paid lane'), w.indexOf('/* A COMPLETE SENTENCE UNDER EVERY HEADLINE'));
const L = new Function('sbRest', 'logEvent', 'json', 'callerIsAdmin', 'fetch', 'excQuiet', lane + '; return { CLAUDE, claudeParams, claudeEstimate, claudeCost, claudeCap };')(
  async () => [], () => Promise.resolve(), (o, s) => Object.assign({ _status: s }, o), async () => true, async () => ({ ok: false }), () => () => null);
const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
const frameClean = helper('excFrameClean', 'function excFrameWhole(');
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));

// ── fakes ──────────────────────────────────────────────────────────────
let sb = [], fixtures = {}, ev = [], evId = 0, patches = [], submitted = [], claudeCalls = [], claudeAnswers = [], gathers = [], captured = [], fetches = [], ytCalls = [], mastCalls = [], jobs = [];
let casFail = false, casFailAt = -1, casWrites = 0, rowVer = 0, ytCap = Infinity, submitRefuse = null, estBoost = 0, casLost = false, lastAt = {};
const live = {};   // rows readRow serves, kept in step with every PATCH
const resetAll = () => { sb = []; ev = []; evId = 0; patches = []; submitted = []; claudeCalls = []; gathers = []; captured = []; fetches = []; ytCalls = []; mastCalls = []; jobs = [];
  casFail = false; casFailAt = -1; casWrites = 0; ytCap = Infinity; submitRefuse = null; estBoost = 0; casLost = false; lastAt = {}; for (const k of Object.keys(live)) delete live[k]; };
const sbRest = async (env, path, opts) => {
  sb.push({ path, opts });
  if (path.startsWith('recon_evidence')) {
    const q = path.split('?')[1] || '', rid = /read_id=eq\.(\d+)/.exec(q), kinds = /kind=in\.\(([^)]*)\)/.exec(q), kindEq = /kind=eq\.(\w+)/.exec(q), ordGte = /ord=gte\.(\d+)/.exec(q);
    const match = r => (!rid || r.read_id === +rid[1]) && (!kinds || kinds[1].split(',').includes(r.kind)) && (!kindEq || r.kind === kindEq[1]) && (!ordGte || r.ord >= +ordGte[1]);
    if (opts && opts.method === 'POST') { for (const r of opts.body) { if (badText(r)) throw new Error('an evidence row Postgres would refuse: ' + JSON.stringify(r).slice(0, 80)); ev.push(Object.assign({ id: ++evId }, clone(r))); } return null; }
    if (opts && opts.method === 'DELETE') { ev = ev.filter(r => !match(r)); return null; }
    const off = parseInt((/offset=(\d+)/.exec(q) || [0, 0])[1], 10), lim = parseInt((/limit=(\d+)/.exec(q) || [0, 1000])[1], 10);
    return ev.filter(match).sort((a, b) => a.kind.localeCompare(b.kind) || a.ord - b.ord || a.id - b.id).slice(off, off + lim).map(clone);
  }
  if (path.startsWith('claude_jobs?meta->>recon_read_id=eq.')) {
    const rid = +/recon_read_id=eq\.(\d+)/.exec(path)[1], kinds = /kind=in\.\(([^)]*)\)/.exec(path);
    return jobs.filter(j => (j.read_id || 41) === rid && (!kinds || kinds[1].split(',').includes(j.kind))).map(clone);
  }
  const rr = /^house_reads\?id=eq\.(\d+)&select=\*$/.exec(path);
  if (rr) return live[rr[1]] ? [clone(live[rr[1]])] : (fixtures['house_reads?id=eq.' + rr[1]] ? fixtures['house_reads?id=eq.' + rr[1]](path, opts) : []);
  const look = /^house_reads\?id=eq\.(\d+)&select=updated_at$/.exec(path);
  if (look) return lastAt[look[1]] ? [{ updated_at: lastAt[look[1]] }] : [];
  const pr = /^house_reads\?id=eq\.(\d+)/.exec(path);
  if (pr && opts && opts.method === 'PATCH') {
    if (/updated_at=eq\./.test(path)) { casWrites++; if (casFail || casWrites === casFailAt) return []; }   // someone else wrote the row first
    patches.push(clone(opts.body));
    if (opts.body && opts.body.updated_at) lastAt[pr[1]] = opts.body.updated_at;
    if (casLost && /updated_at=eq\./.test(path)) return [];   // it landed; the answer was lost and the replay found nothing
    if (live[pr[1]]) Object.assign(live[pr[1]], clone(opts.body));
    return /select=id,updated_at/.test(path) ? [{ id: +pr[1], updated_at: '2026-10-06T00:00:00.' + String(++rowVer).padStart(3, '0') + 'Z' }] : null;
  }
  for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts);
  return [];
};
const callClaude = async (env, tier, req) => {
  claudeCalls.push({ tier, req, params: L.claudeParams(tier, req) });
  const a0 = claudeAnswers.shift(), a = typeof a0 === 'function' ? a0(req) : a0 || { ok: false, error: 'no_answer' };
  if (a.ok && req.meta && req.meta.recon_read_id) jobs.push({ read_id: req.meta.recon_read_id, kind: req.kind, status: 'done', cost_usd: a.cost_usd || 0 });   // what claudeRecord writes
  return a;
};
const claudeBatchSubmit = async (env, tier, kind, items) => {
  if (submitRefuse) return { ok: false, error: submitRefuse };
  submitted.push({ tier, kind, items }); const id = 'b' + submitted.length;
  for (const it of items) if (it.meta && it.meta.recon_read_id) jobs.push({ read_id: it.meta.recon_read_id, batch_id: id, kind, custom_id: it.custom_id, status: 'submitted', est_usd: 0.01, meta: it.meta });
  return { ok: true, batch_id: id, n: items.length, est_usd: 0.5 };
};
let gatherAnswer = q => ({ ok: true, items: [], rails: [] });
const gatherOpenSignals = async (env, q, opts) => { gathers.push({ q, opts }); return gatherAnswer(q, opts); };
const lakeCapture = async (env, items, prov) => { captured.push(prov); return (items || []).length; };
const railFetch = async (url) => { fetches.push(url);
  if (/youtube\/v3\/videos\?/.test(url)) return { items: [{ id: 'vid00001', statistics: { viewCount: '1200', likeCount: '30', commentCount: '40' }, snippet: { title: 'Glasses review', publishedAt: '2026-08-01T00:00:00Z' } }, { id: 'vid00002', statistics: { viewCount: '800', likeCount: '10', commentCount: '12' }, snippet: { title: 'Day one', publishedAt: '2026-08-02T00:00:00Z' } }] };
  return null; };
let fetchImpl = async () => ({ ok: false, status: 404, headers: { get: () => '' }, text: async () => '', json: async () => null });
const fetchFake = async (url, init) => { fetches.push(url); return fetchImpl(url, init); };
const RAIL_FNS = {
  async youtube(env, q, ctx) {
    if (ytCalls.length >= ytCap) { ctx.meta.yt_capped = true; return []; }   // the RECON's allowance is spent for the day
    ytCalls.push({ q, lane: ctx.ytLane, since: ctx.since || null, before: ctx.before || null, max: ctx.voiceMax });
    const v = ctx.meta.voices || (ctx.meta.voices = { sources: [], quotes: [] }); const id = 'yt:vid' + String(ytCalls.length).padStart(5, '0');
    v.sources.push({ id, source: 'YouTube', title: 'Video ' + ytCalls.length, url: 'https://www.youtube.com/watch?v=x', published_at: '2026-08-01', n: 3 });
    for (let i = 0; i < 3; i++) v.quotes.push({ src: id, text: 'Comment ' + ytCalls.length + '-' + i + ' about smart glasses', likes: 10 - i, when: ctx.since ? '2026-08-0' + (i + 1) : '2024-05-01', self: null, share: null });
    if (ctx.since && ytCalls.length === 1) v.quotes.push({ src: id, text: 'Late comment about smart glasses', likes: 50, when: '2026-10-20', self: null, share: null });   // posted after the period
  },
  async mastodon(env, q, ctx) { mastCalls.push({ q, before: ctx.before || null, srcTag: ctx.srcTag || null });
    const v = ctx.meta.voices || (ctx.meta.voices = { sources: [], quotes: [] }); v.sources.push({ id: 'mast:glasses:' + ctx.srcTag, source: 'Mastodon', title: '#glasses', url: 'https://mastodon.social/tags/glasses', n: 1 });
    v.quotes.push({ src: 'mast:glasses:' + ctx.srcTag, text: 'A shared story theguardian.com/tech/2026/aug/01/x', likes: 1, when: '2026-08-03', share: { outlet: 'The Guardian', headline: 'Smart glasses are coming for your face' } }); }
};
const RAIL_BY_ID = { youtube: { id: 'youtube', tier: 3 }, mastodon: { id: 'mastodon', tier: 3 } };
const estFn = (p, b) => L.claudeEstimate(p, b) + estBoost;
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'excFrameFor', 'gatherOpenSignals', 'lakeCapture', 'excTerritoryOf', 'sha256hex', 'RAILS', 'RAIL_FNS', 'excFrameLabel', 'railFetch',
  'callClaude', 'claudeEstimate', 'claudeParams', 'KB_EMBED_MODEL', 'BGE_QUERY_PREFIX', 'RAIL_BY_ID', 'fetch',
  trim + pmj + ej + frameClean + voiceSrc + block + '; return { READ_DEEP, READ_DEEP_LAW, READ_CONTRACT, HOUSE_READ, deepOf, deepSpent, deepRoom, deepStr, deepSafe, deepNums, deepNumsIn, deepPlanClean, deepPhrases, deepGatherQueries, deepVoiceQueries, deepMerge, deepKeep, deepRailCost, deepReadable, deepPickSources, deepHtmlText, deepHtmlDate, deepBodyCapped, deepExtract, deepNorm, deepQuoteFound, deepCardClean, deepLabelsClean, deepVoiceBand, deepCountComments, deepViewsOf, deepViews, deepOutletRule, deepOutletTypes, deepStoriesInPeriod, deepCountTypes, deepSItems, deepCInStories, deepFile, deepAdvance, deepCompile, deepPlanBlock, deepCardLine, deepCountsBlock, deepPickVoices, deepPackInputs, deepStatsOf, deepLakeMerge, deepFitPack, readReportPack, readReportExtraIds, readReportVoiceLine, readReconStats, readSupports, readValidate, readReceipts, readReaderVoice, readTick, readRoute, readReconOf, readReconBriefText, readSubmit, readReportLaws, readFail };')(
  sbRest, claudeBatchSubmit, async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async () => clone(frame), gatherOpenSignals, lakeCapture, () => 'technology-innovation', async s => 'abc123def4567890' + s.length, [], RAIL_FNS, () => '', railFetch,
  callClaude, estFn, L.claudeParams, '@cf/baai/bge-small-en-v1.5', 'Represent this sentence for searching relevant passages: ', RAIL_BY_ID, fetchFake);
const D = R.READ_DEEP;

const frame = { entity: 'FIELD', category: 'smart glasses', audience: 'early adopters', market: 'US', competitors: ['Meta Ray-Ban', 'Snap Spectacles'], question: 'Who is wearing smart glasses?',
  anchors: ['smart glasses', 'wearable', 'ray-ban meta'], exclude: ['reading glasses'], queries: { news: 'smart glasses news', research: 'wearable adoption', discourse: 'are smart glasses worth it', web: 'best smart glasses 2026' } };
const planJson = { question: 'Where does a culture-first wearable enter?',
  sub_questions: [{ id: 'SQ1', ask: 'Who wears smart glasses now?', why: 'w', lake: ['smart glasses wearers', 'who buys ai glasses'], web: 'smart glasses owners survey', voice: 'my smart glasses review', measure: 'sales' },
    { id: 'SQ2', ask: 'Who refuses them?', why: 'w', lake: ['smart glasses bans venues'], web: 'smart glasses banned', voice: 'smart glasses creepy', measure: 'bans' },
    { id: 'SQ3', ask: 'Who is absent?', why: 'w', lake: ['smart glasses accessibility'], web: 'smart glasses blind users', voice: 'blind smart glasses', measure: 'adoption' },
    { id: 'SQ4', ask: 'What would make the brief wrong?', why: 'w', lake: ['smart glasses sales decline'], web: 'smart glasses sales figures', voice: 'returned my glasses', measure: 'returns' }],
  hypotheses: [{ id: 'HYP1', q: 'SQ1', claim: 'Wellness buyers lead.', proves: 'p', breaks: 'b', counter: 'smart glasses sales record' }, { id: 'HYP2', q: 'SQ2', claim: 'Venues decide.', proves: 'p', breaks: 'b', counter: 'venues allow smart glasses' }],
  segments: [{ who: 'blind and low vision wearers', why: 'they depend on the camera', q: 'SQ3' }],
  decisions: [{ n: 1, decision: 'Who is the first wearer?', q: ['SQ1', 'SQ3'] }],
  themes: ['privacy', 'price', 'style', 'battery', 'u.s. made'] };
const WIN = { start: '2026-07-08', end: '2026-10-05' };

// ── A: the ledger ──────────────────────────────────────────────────────
ok(L.CLAUDE.TIERS.recon && L.CLAUDE.TIERS.recon.exact === true && L.CLAUDE.TIERS.recon.cap === 150 && L.CLAUDE.TIERS.recon.env === 'CLAUDE_RECON_MONTHLY' && L.claudeCap({ EVOLUTION_MODE: '1' }, 'recon') === 150 &&
  L.CLAUDE.TIERS.doc.cap === 50 && L.CLAUDE.TIERS.live.cap === 30 && L.CLAUDE.RECON_TIMEOUT_MS === 300000 && /const ceiling = tier === 'recon' \? CLAUDE\.RECON_TIMEOUT_MS : CLAUDE\.LIVE_TIMEOUT_MS;/.test(w),
  'A1 the recon tier: $150 a month, exact under evolution mode, its own secret; a research plan may think five minutes; the written caps reset to doc $50 and live $30');
ok(R.HOUSE_READ.KINDS.weekly.max_tokens === 40000 && R.HOUSE_READ.KINDS.monthly.max_tokens === 56000, 'A2 the weekly and monthly have room again: 40,000 and 56,000 output tokens');
ok(D.BUDGET_USD === 30 && D.BUDGET_MIN === 20 && D.COMPILE_RESERVE === 13 && D.REVISE_RESERVE === 4 && R.deepSpent({ spend: { plan: 1.25, rails: 0.5 } }) === 1.75 && R.deepRoom({ budget_usd: 2, spend: { plan: 1.5 } }, 0.5) && !R.deepRoom({ budget_usd: 2, spend: { plan: 1.5 } }, 0.51) && R.deepRoom({ spend: {} }, 29.9),
  'A3 the commission ceiling: $30 by default, $20 at the least (a whole RECON and its four passes fit); every stage asks whether its worst case still fits');
ok(/meta: Object\.assign\(\{\}, \(req && req\.meta\) \|\| \{\}, \{ msg_id: j\.id \|\| null \}\)/.test(w) && /PPLX_RECON_DAILY_DOLLARS: 0\.5,/.test(w) && /SIGNAL_RECON_DAILY_DOLLARS: 1\.0,/.test(w) && /dk = \(recon \? 'pplxr:' : 'pplxd:'\) \+ day/.test(w) && /dk = \(recon \? 'sigr:' : 'sigd:'\) \+ day/.test(w) && /pplx_recon, exa_recon, caps/.test(w),
  'A4 review: a live call carries its caller\'s tags (a RECON\'s id) onto its row; a RECON\'s gathers spend on Perplexity\'s and Exa\'s own RECON lanes, never the house\'s day, and the daily rail ledger records both');

// ── P: the plan ────────────────────────────────────────────────────────
const plan = R.deepPlanClean(Object.assign({}, planJson, { sub_questions: [{ id: 'QX', ask: 'Odd id first?', lake: [], web: 'w' }].concat(planJson.sub_questions), hypotheses: planJson.hypotheses.concat([{ id: 'HYP9', q: 'SQ99', claim: 'Orphan.' }]) }), ['Who is the first wearer?', 'Audio now or camera later?']);
ok(plan && plan.sub_questions.length === 5 && plan.sub_questions[0].id === 'SQ1' && plan.sub_questions[0].lake[0] === 'Odd id first?' && plan.sub_questions[1].id === 'SQ2' && plan.hypotheses[0].id === 'HYP1' && plan.hypotheses[0].q === 'SQ2' && plan.hypotheses[2].q === null &&
  plan.decisions.length === 2 && plan.decisions[0].q.join() === 'SQ2,SQ4' && plan.decisions[1].q.length === 0 && plan.themes.includes('us made') && !plan.themes.some(t => /\./.test(t)),
  'P1 review: the plan renumbers SQ1..SQn and HYP1..HYPn (ids no reader\'s prose carries, unlike a quarter\'s Q3 or a half\'s H1) and maps the model\'s ids to them; a reference to nothing is dropped; every listed decision is kept; themes carry no dots');
ok(R.deepPlanClean({ sub_questions: planJson.sub_questions.slice(0, 3), themes: planJson.themes }, []) === null && R.deepPlanClean(Object.assign({}, planJson, { themes: ['a', 'b'] }), []) === null && R.deepPlanClean(null, []) === null,
  'P2 fewer than four sub-questions or three themes is no plan');
const clean = R.deepPlanClean(planJson, ['Who is the first wearer?']);
const phrases = R.deepPhrases(clean);
ok(phrases.length === 6 && phrases[0].q === 'SQ1' && phrases.some(p => p.text === 'blind and low vision wearers' && p.q === 'SQ3'), 'P3 the lake is searched with every sub-question\'s phrasings and every group the brief might miss, once each');
const gq = R.deepGatherQueries(clean, frame);
ok(gq.length === 12 && gq.slice(0, 4).every(g => !g.counter && g.q) && gq.slice(6).every(g => !g.q && !g.counter) && gq.filter(g => g.counter).map(g => g.h).join() === 'HYP1,HYP2' && gq.filter(g => g.counter)[0].text === 'smart glasses sales record',
  'P4 the gathers: one per sub-question, then one per hypothesis for what would break it, then the brief\'s own queries');
const many = Object.assign({}, clean, { sub_questions: Array.from({ length: 10 }, (_, i) => ({ id: 'SQ' + (i + 1), web: 'web ' + i, lake: ['l' + i] })), hypotheses: Array.from({ length: 8 }, (_, i) => ({ id: 'HYP' + (i + 1), q: 'SQ1', counter: 'counter ' + i })) });
const gm = R.deepGatherQueries(many, frame);
ok(gm.length === D.GATHER.MAX && gm.filter(g => g.counter).length === 8, 'P5 the cap never cuts the counter pass: twenty searches, all eight counter searches among them');
const vq = R.deepVoiceQueries(clean, frame);
ok(vq.length <= D.VOICE.QUERIES && vq[0].text === 'my smart glasses review' && vq[0].q === 'SQ1' && vq.some(v => v.q === null), 'P6 the voices are asked every sub-question in the words people use, then the brief\'s own voice queries');
ok(!/—/.test(w.slice(w.indexOf('const DEEP_PLAN_SYS'), w.indexOf('function deepPlanPrompt('))) && /looking across occupation, age, income, place, culture and ability/.test(w) && /one asks what would prove the brief wrong/.test(w) && /"id": "SQ1"/.test(w) && /"id": "HYP1"/.test(w),
  'P7 the plan asks who the brief might miss across six plain dimensions, never naming a group; one sub-question asks what would prove the brief wrong; its ids are SQ and HYP; no em dash');

// ── S: the lake by meaning ─────────────────────────────────────────────
const m = new Map();
R.deepMerge(m, [{ id: 'u1', title: 'Glasses sold', similarity: 0.71, source_tier: 2, edition_item_id: 77 }, { id: 'u2', title: 'Reading glasses sale', summary: 'drugstore', similarity: 0.9 }, { id: 'u3', title: 'Thin', similarity: 0.5 }], 'SQ1');
R.deepMerge(m, [{ id: 'u1', title: 'Glasses sold', similarity: 0.65 }, { id: 'u4', title: 'Far', similarity: 0.3 }], 'SQ2');
const kept = R.deepKeep(Array.from(m.values()), frame, 10);
ok(m.get('u1').qs.join() === 'SQ1,SQ2' && m.get('u1').sim === 0.71 && m.get('u1').edition_item_id === 77 && kept[0].id === 'u1' && !kept.some(r => r.id === 'u2') && kept.some(r => r.id === 'u3') && !kept.some(r => r.id === 'u4'),
  'S1 a line found by two sub-questions keeps both and its best score and leads (and whether DAILY published it); the frame\'s excludes never pass; each sub-question keeps its closest above the floor; nothing below it');
resetAll();
let embedOk = true;
const env = { AI: { run: async (model, inp) => { embedOk = embedOk && model === '@cf/baai/bge-small-en-v1.5' && inp.text.every(t => /^Represent this sentence for searching relevant passages: /.test(t)); return { data: inp.text.map(() => [0.1, 0.2]) }; } } };
fixtures = { 'rpc/match_signals_span': (p, o) => o.body.p_since ? [{ id: 'n' + o.body.p_query.length, title: 'In the period', similarity: 0.8, source_tier: 1, url: 'https://a.com/1', published_at: '2026-08-01' }, { id: 'pub1', title: 'Smart glasses story DAILY ran', similarity: 0.7, source_tier: 1, url: 'https://wired.com/run', published_at: '2026-08-03', edition_item_id: 501 }] : [{ id: 'b1', title: 'Before it', similarity: 0.7, source_tier: 1, url: 'https://b.com/1', published_at: '2024-01-01' }] };
const row = { id: 41, kind: 'recon', status: 'queued', version: 1, window_start: '2026-07-08', window_end: '2026-10-05', label: 'RECON 001: FIELD, smart glasses', meta: { plan: 'recon', recon_no: 1, brief: { text: 'FIELD: smart glasses as a cultural object.', hash: 'h1', frame, days: 90, decisions: ['Who is the first wearer?'] },
  deep: { v: 1, stage: 'search', budget_usd: 30, hold: true, spend: { plan: 1.1 }, counts: {}, log: [], plan: clean } } };
gatherAnswer = (q, opts) => ({ ok: true, rails: [{ id: 'pplx', ok: true, n: 3 }, { id: 'exa', ok: true, n: 6 }, { id: 'gdelt', ok: true, n: 9 }, { id: 'pplx', ok: true, n: 0 }],
  items: [{ url: 'https://news.com/' + encodeURIComponent(q), title: 'Story on ' + q + ' smart glasses', text: 'snippet', source_name: 'News', source_tier: 1, published_at: '2026-08-15', rail: 'gdelt', kind: 'news' },
    { url: 'https://news.com/' + encodeURIComponent(q), title: 'dup', source_tier: 1 }, { url: 'https://against.com/x', title: 'A smart glasses ban', source_tier: 2, published_at: '2026-09-01', stance: 'against', rail: 'counter', kind: 'news' }] });
const un1 = quiet();
const a1 = await R.deepAdvance(env, row, { ms: 60000 });
un1();
const spans = sb.filter(x => x.path === 'rpc/match_signals_span');
ok(embedOk && spans.length === 12 && spans.filter(x => x.opts.body.p_since === '2026-07-08' && x.opts.body.p_until === '2026-10-06' && x.opts.body.p_min_tier === 3).length === 6 && spans.filter(x => x.opts.body.p_since === null && x.opts.body.p_until === '2026-07-08' && x.opts.body.p_min_tier === 2).length === 6,
  'S2 the phrasings are embedded with the lake\'s model and its query prefix; every one searches the period (tier 3 and stronger, through the day after it ends) and the years before it (tier 2 and stronger)');
ok(ev.filter(r => r.kind === 'lake').length === 2 && ev.filter(r => r.kind === 'record').length === 1 && ev.find(r => r.kind === 'lake' && r.payload.id === 'pub1').payload.edition_item_id === 501 &&
  a1.steps[0] === 'search>gather' && row.meta.deep.counts.lake_found === 2 && row.meta.deep.counts.record_found === 1 && row.meta.deep.counts.phrases === 6 && row.meta.deep.counts.searches_failed === 0 && row.meta.deep.queue.gathers.length === 12,
  'S3 the finds land in the evidence store (the period as lake, the years before as record, DAILY\'s own marked), counted, and the gather queue is written from the plan');
resetAll();
const srow = clone(row); srow.meta.deep = Object.assign(srow.meta.deep, { stage: 'search', tries: {} });
let spanN = 0;
fixtures = { 'rpc/match_signals_span': () => { spanN++; if (spanN % 3) throw new Error('504'); return []; } };
const unS = quiet();
await R.deepAdvance(env, srow, { ms: 0 });
unS();
ok(srow.meta.deep.stage === 'search' && /^search_failed_8_of_12$/.test(srow.meta.deep.last_error) && srow.meta.deep.tries.search === 1 && !ev.length,
  'S4 review: when most of the archive\'s answers fail, the search is tried again, never passed on as a thin plan');

// ── G: the gathers and the counter pass ───────────────────────────────
ok(row.meta.deep.stage === 'gather' && a1.steps[1] === 'gather>gather', 'G1 the first tick ran the search and the plan\'s first gathers, and yielded');
resetAll();
const grow = clone(row); grow.meta.deep = Object.assign(grow.meta.deep, { stage: 'gather', queue: { gathers: R.deepGatherQueries(clean, frame), done: 0 }, counts: { lake_found: 2 }, spend: { plan: 1.1 }, tries: {} });
const g0 = clone(grow.meta.deep);
const unG = quiet();
await R.deepAdvance({}, grow, { ms: 0 });
unG();
ok(gathers.length === 8 && gathers.every(g => g.opts.skip.join() === 'youtube,mastodon' && g.opts.frame.entity === 'FIELD' && g.opts.lane === 'recon'),
  'G2 a tick runs eight gathers with the frame, on the paid rails\' RECON lanes, the voice rails left to the voice pass');
ok(captured.some(c => c.provenance === 'recon_counter') && captured.some(c => c.provenance === 'recon_gather') && captured.every(c => c.territory === 'technology-innovation') && grow.meta.deep.queue.done === 8,
  'G3 every gather is captured into the lake with provenance (recon_gather, recon_counter for what would break a hypothesis) and the stage yields after PER_TICK');
ok(R.deepRailCost([{ id: 'pplx', ok: true, n: 3 }, { id: 'exa', ok: true, n: 6 }, { id: 'gdelt', ok: true, n: 9 }, { id: 'pplx', ok: true, n: 0 }, { id: 'exa', ok: true, n: 2, skipped: 'cap' }]) === 0.021 && grow.meta.deep.spend.rails === 0.168,
  'G4 the paid rails go on the receipt: Perplexity and Exa per call that answered, nothing for a free rail, a skipped or an empty call');
const webRows = ev.filter(r => r.kind === 'web');
ok(webRows.length === 9 && new Set(webRows.map(r => r.payload.url)).size === 9 && webRows.find(r => r.payload.url === 'https://against.com/x').payload.stance === 'against', 'G5 gathered stories land once each by page, with their sub-question, hypothesis and stance');
grow.meta.deep = clone(g0);   // the end of that tick was never written: the next run starts from the same cursor
const unG2 = quiet();
await R.deepAdvance({}, grow, { ms: 0 });
unG2();
ok(ev.filter(r => r.kind === 'web').length === 9 && gathers.length === 16, 'G6 review: a tick run again from the same cursor replaces what it wrote, never doubles it');
const unG3 = quiet();
await R.deepAdvance({}, grow, { ms: 0 });
unG3();
ok(grow.meta.deep.queue.done === 12 && grow.meta.deep.stage === 'voices' && grow.meta.deep.counts.searches === 12 && grow.meta.deep.counts.counter_searches === 2 && ev.filter(r => r.kind === 'web').length === 9 + 5,
  'G7 the next tick finishes the queue from its cursor and moves on; the tick\'s clock stops the machine between stages, never inside one');
resetAll();
const hgrow = clone(row); hgrow.meta.deep = Object.assign(hgrow.meta.deep, { stage: 'gather', queue: { gathers: R.deepGatherQueries(clean, frame), done: 0 }, counts: {}, spend: { plan: 1 }, budget_usd: 1.08, tries: {} });
const unG4 = quiet();
await R.deepAdvance({}, hgrow, { ms: 0 });
unG4();
ok(gathers.length === 2 && hgrow.meta.deep.stage === 'hold' && hgrow.meta.deep.hold_reason === 'budget' && hgrow.meta.deep.held_from === 'gather' && hgrow.meta.deep.queue.done === 2 && hgrow.meta.deep.counts.searches === 2 &&
  ev.filter(r => r.kind === 'web').length === 3 && hgrow.meta.deep.spend.rails === 0.042,
  'G8 review: the ceiling stops the pass between two gathers, and what was gathered before it is kept, counted and paid for on the receipt');

// ── V: the voices ──────────────────────────────────────────────────────
resetAll();
const vrow = clone(grow); vrow.meta.deep = Object.assign(vrow.meta.deep, { stage: 'voices', tries: {} });
const unV = quiet();
await R.deepAdvance({}, vrow, { ms: 0 });
unV();
const vqs = R.deepVoiceQueries(clean, frame).length;
ok(ytCalls.length === vqs * 2 && ytCalls.every(c => c.lane === 'recon' && c.max === 300) && ytCalls.filter(c => c.since === '2026-07-08' && c.before === '2026-10-06').length === vqs && ytCalls.filter(c => !c.since && c.before === '2026-07-08').length === vqs &&
  mastCalls.filter(c => c.srcTag === 'now' && c.before === '2026-10-06').length === vqs && mastCalls.filter(c => c.srcTag === 'before' && c.before === '2026-07-08').length === vqs,
  'V1 review: every voice query is asked of the period (videos published inside it, posts up to its end) and of the years before it, on the RECON\'s own YouTube allowance, up to 300 comments a pass; the two passes are their own threads');
const chunks = ev.filter(r => r.kind === 'comments');
const allItems = chunks.flatMap(c => c.payload.items);
ok(vrow.meta.deep.stage === 'read' && allItems.length === vqs * 2 * 3 + 2 && chunks.every(c => c.payload.items.length <= 40) && chunks[0].payload.items[0].i === 1 && allItems.some(i => i.share) && allItems.some(i => i.band === 'earlier') &&
  allItems.find(i => /^Late comment/.test(i.text)).band === 'after' && vrow.meta.deep.voices.sources.length > 0 && ev.filter(r => r.kind === 'voice').length === vqs * 2,
  'V2 every comment is kept (each once), numbered within chunks of 40, banded by date (one posted after the period is marked after); a shared headline is marked; each pass\'s comments are filed as it runs');
ok(/const lane = ctx && ctx\.ytLane === 'recon' \? 'yt_recon' : 'yt_search', capN = lane === 'yt_recon' \? GATHER\.YT_RECON_CAP : GATHER\.YT_SEARCH_CAP;/.test(w) && /YT_SEARCH_CAP: 60, YT_RECON_CAP: 30,/.test(w) && /\(\(ctx && ctx\.voiceMax\) \|\| VOICES\.MAX\)/.test(w) && /!\(opts\.skip \|\| \[\]\)\.includes\(r\.id\)/.test(w) &&
  /const day = ytQuotaDay\(new Date\(\)\);/.test(w) && /if \(used >= capN\) \{ if \(ctx && ctx\.meta\) ctx\.meta\.yt_capped = true; return \[\]; \}/.test(w) && /timeZone: 'America\/Los_Angeles'/.test(w),
  'V3 review: a RECON\'s searches count on their own daily allowance (30, beside the house\'s 60, inside 10,000 units), counted on YouTube\'s own Pacific day; a spent allowance says so; a pass may keep more comments; a gather may skip rails');
resetAll();
const crow0 = clone(grow); crow0.meta.deep = Object.assign(crow0.meta.deep, { stage: 'voices', tries: {} });
ytCap = 3;
const unV2 = quiet();
const av = await R.deepAdvance({}, crow0, { ms: 0 });
unV2();
ok(crow0.meta.deep.stage === 'voices' && crow0.meta.deep.queue.voices.done === 3 && crow0.meta.deep.waiting === 'youtube_allowance' && ev.filter(r => r.kind === 'voice').length === 3 && !ev.some(r => r.kind === 'comments') && av.steps[0] === 'voices>voices',
  'V4 review: when YouTube\'s allowance is spent mid-pass, the pass stops before the step it could not finish, files what it has and waits for YouTube\'s next day');
ytCap = Infinity; const before = ytCalls.length;
const unV3 = quiet();
await R.deepAdvance({}, crow0, { ms: 0 });
unV3();
ok(crow0.meta.deep.stage === 'read' && ytCalls.length - before === vqs * 2 - 3 && ev.filter(r => r.kind === 'voice').length === vqs * 2 && !crow0.meta.deep.waiting,
  'V5 review: the next day the pass resumes where it stopped (no step asked twice) and pools every step\'s comments');
ok(R.deepVoiceBand('2026-10-20', WIN) === 'after' && R.deepVoiceBand('2026-10-05', WIN) === 'now' && R.deepVoiceBand('2025-09-01', WIN) === 'before' && R.deepVoiceBand('2020-01-01', WIN) === 'earlier' && R.deepVoiceBand(null, WIN) === 'undated',
  'V6 review: a comment is the period\'s only when dated inside it; after its last day it is counted apart');

// ── R: reading in full ─────────────────────────────────────────────────
ok(R.deepReadable({ url: 'https://www.theverge.com/2026/8/1/glasses' }) && !R.deepReadable({ url: 'https://www.youtube.com/watch?v=1' }) && !R.deepReadable({ url: 'http://127.0.0.1/x' }) && !R.deepReadable({ url: 'https://localhost/x' }) &&
  !R.deepReadable({ url: 'https://efts.sec.gov/LATEST/search-index?q=x' }) && !R.deepReadable({ url: 'https://x.com/a/status/1' }) && !R.deepReadable({ url: 'https://news.com/a', rail: 'hn' }) && !R.deepReadable({ url: 'https://news.com/a', kind: 'discourse' }),
  'R1 only a public article is read: never a video, a post, a private address, a search page, a forum thread or a discourse aggregate');
const cand = [{ kind: 'web', payload: { url: 'https://a.com/1', title: 'A1', source_name: 'A', source_tier: 1, q: 'SQ1', published_at: '2026-08-01' } }, { kind: 'web', payload: { url: 'https://a.com/2', title: 'A2', source_tier: 1, q: 'SQ1', published_at: '2026-08-01' } },
  { kind: 'web', payload: { url: 'https://a.com/3', title: 'A3', source_tier: 1, q: 'SQ2', published_at: '2026-08-01' } }, { kind: 'web', payload: { url: 'https://a.com/4', title: 'A4', source_tier: 1, q: 'SQ2', published_at: '2026-08-01' } },
  { kind: 'web', payload: { url: 'https://a.com/5', title: 'A5', source_tier: 1, q: 'SQ3', published_at: '2026-08-01' } }, { kind: 'web', payload: { url: 'https://weak.com/c', title: 'Breaks HYP2', source_tier: 4, q: 'SQ2', h: 'HYP2', counter: true, published_at: '2026-08-01' } },
  { kind: 'lake', payload: { url: 'https://b.com/1?utm=1', title: 'B1', source_tier: 2, qs: ['SQ3', 'SQ4'], sim: 0.8, published_at: '2026-08-02' } }, { kind: 'web', payload: { url: 'https://b.com/1', title: 'B1 again', source_tier: 2, q: 'SQ1' } },
  { kind: 'record', payload: { url: 'https://old.com/1', title: 'Old', source_tier: 1, qs: ['SQ4'], sim: 0.7, published_at: '2023-01-01' } }];
const picks = R.deepPickSources(cand, clean, WIN, 8);
ok(picks.length === 7 && picks[0].url === 'https://weak.com/c' && picks.filter(p => p.host === 'a.com').length === 4 && !picks.some(p => p.url === 'https://a.com/5') && picks.some(p => p.url === 'https://b.com/1?utm=1' && p.q.join() === 'SQ3,SQ4,SQ1') && picks.find(p => p.url === 'https://old.com/1').band === 'before',
  'R2 the strongest page that could break each hypothesis is read first, whatever its outlet\'s strength; then every sub-question\'s best; one page is one source (its sub-questions merge); never more than four from one outlet');
const html = '<html><head><script>var x=1</script><style>.a{}</style></head><body><nav>Home News Sport Weather and more links here for nav</nav><article><h1>Smart glasses sold out at 1,200 stores this week</h1><p>Meta said on Tuesday that it sold 2 million pairs &mdash; double the year before, according to the company&#8217;s filing.</p><p>Short.</p><p>Meta said on Tuesday that it sold 2 million pairs &mdash; double the year before, according to the company&#8217;s filing.</p>' + '<p>' + 'Padding sentence that makes the article long enough to be an article for the extractor. '.repeat(20) + '</p></article><footer>Copyright notice footer text that is long enough to count</footer></body></html>';
const text = R.deepHtmlText(html);
ok(/Smart glasses sold out at 1,200 stores this week/.test(text) && /sold 2 million pairs - double the year before, according to the company’s filing\./.test(text) && !/var x|Copyright|Home News|Short\./.test(text) && text.split('Meta said on Tuesday').length === 2 && !/—/.test(text),
  'R3 a page becomes its article: scripts, navigation and footers gone, entities decoded, any dash a hyphen, short and repeated lines dropped');
const teaser = '<article class="teaser">' + '<a class="x" data-a="' + 'z'.repeat(1700) + '" href="/r">Related</a><p>A related story teaser line here.</p></article>';
const html2 = '<html><body><form id="aspnetForm">' + teaser + '<article><p>' + 'The real story about smart glasses in schools, told at length for the reader. '.repeat(30) + '</p></article></form></body></html>';
ok(/The real story about smart glasses in schools/.test(R.deepHtmlText(html2)) && /The real story about smart glasses/.test(R.deepHtmlText('<html><body><form id="f"><div>' + 'The real story about smart glasses in schools, told at length for the reader. '.repeat(30) + '</div></form></body></html>')),
  'R4 review: the article with the most text wins (a teaser before the story never does), and a page wrapped in one form keeps its text');
ok(R.deepHtmlDate('<meta property="article:published_time" content="2026-08-14T09:00:00Z">') === '2026-08-14' && R.deepHtmlDate('<script type="application/ld+json">{"datePublished":"2026-07-30T10:00:00Z"}</script>') === '2026-07-30' &&
  R.deepHtmlDate('<time datetime="2026-08-01">x</time>') === null && R.deepHtmlDate('<meta name="date" content="2099-01-01">') === null,
  'R5 review: a page read by the worker says its own date from its metadata (never a time tag, never a date in the future)');
let cancelled = false, pulls = 0;
const chunk = new Uint8Array(400000).fill(97);
const fakeBody = { getReader: () => ({ read: async () => { pulls++; return pulls <= 5 ? { done: false, value: chunk } : { done: true }; }, cancel: async () => { cancelled = true; } }) };
const capped = await R.deepBodyCapped({ body: fakeBody }, D.READ.FETCH_BYTES);
ok(cancelled && pulls === 3 && capped.length === 1200000, 'R6 review: a body is read only as far as it is used (900 KB, then the rest left on the wire), never whole into memory');
resetAll();
fetchImpl = async (url, init) => {
  if (/api\.tavily\.com\/extract/.test(url)) { const b = JSON.parse(init.body); fetches.push({ tavily: b });
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ results: [{ url: b.urls[0], raw_content: 'Tavily text. '.repeat(80) + '\u0000' + '\ud83d' }], failed_results: [{ url: b.urls[1], error: 'x' }], usage: { credits: 1 } }) }; }
  if (/b\.com/.test(url)) return { ok: true, status: 200, headers: { get: k => /length/i.test(k) ? '' : 'text/html; charset=utf-8' }, text: async () => html };
  return { ok: false, status: 403, headers: { get: () => 'text/html' }, text: async () => '' }; };
const un4 = quiet();
const ex = await R.deepExtract({ FIELD_API_KEY: 'tv-key' }, ['https://a.com/1', 'https://b.com/1', 'https://c.com/1']);
un4();
const tv = fetches.find(f => f && f.tavily);
ok(tv && tv.tavily.extract_depth === 'basic' && tv.tavily.format === 'text' && tv.tavily.urls.length <= 20 && ex.texts.get('https://a.com/1').via === 'tavily' && !/\u0000|\ud83d/.test(ex.texts.get('https://a.com/1').text) && ex.texts.get('https://b.com/1').via === 'fetch' &&
  !ex.texts.has('https://c.com/1') && ex.stats.credits === 1 && ex.stats.tavily === 1 && ex.stats.fetched === 1 && ex.stats.failed === 1,
  'R7 each page once: Tavily first (basic, text, 20 a call), the worker\'s own fetch for what Tavily could not read; a page that answers neither is no source; the text is one Postgres keeps; the credits are counted');

// ── C: the evidence cards ──────────────────────────────────────────────
const T = R.deepNorm('Meta said on Tuesday that it sold 2 million pairs - double the year before, according to the company’s filing. Ray-Ban owner EssilorLuxottica reported revenue of €7.2 billion.');
const T2 = R.deepNorm('alpha beta gamma delta epsilon.' + ' filler words go here'.repeat(40) + ' omega psi chi phi.');
ok(R.deepQuoteFound(T, 'Meta said on Tuesday that it sold 2 million pairs — double the year before') && R.deepQuoteFound(T, '“META SAID on Tuesday” ... according to the company\'s filing') &&
  !R.deepQuoteFound(T, 'Meta said on Wednesday that it sold 2 million pairs') && !R.deepQuoteFound(T, 'sold 2') && !R.deepQuoteFound(T, 'according to the company\'s filing ... Meta said on Tuesday') &&
  !R.deepQuoteFound(T, 'Meta said on Tuesday that it sold ... 47%') && !R.deepQuoteFound(T2, 'alpha beta gamma delta ... omega psi chi') && R.deepQuoteFound(T, 'Meta said on Tuesday ... 2 million pairs'),
  'C1 review: a quote is found when the page carries every part of it, in order, each near the last (an ellipsis skips words, never whole passages, and a short tail is checked like any part); case, curly quotes, dashes and spacing set aside');
ok(R.deepNums('Sales rose 3,200 to 47% (0.5 of 2026)').join() === '3200,47,0.5,2026' && R.deepNumsIn('sold 2 million', 'it sold 2 million pairs') && !R.deepNumsIn('5%', 'rose 15% in the quarter') && !R.deepNumsIn('3', 'under 35 years') && R.deepNumsIn('no number', 'x'),
  'C2 review: a number is read the way the landing law reads it, whole: 5% is not inside 15%, nor 3 inside 35');
const src = { url: 'https://a.com/1', title: 'Glasses', outlet: 'A', tier: 1, published_at: null, band: 'undated', text: 'Meta said on Tuesday that it sold 2 million pairs - double the year before. Venues in London banned the glasses at 14 theaters this summer. Prices rose 15% in the quarter.' };
const card = R.deepCardClean({ relevant: true, q: ['SQ1', 'SQ9'], kind: 'reporting', claims: [{ claim: 'Sales doubled to 2 million pairs.', quote: 'it sold 2 million pairs - double the year before', h: 'HYP1', stance: 'supports' }, { claim: 'Invented.', quote: 'Meta sold 5 million pairs', h: 'HYP1', stance: 'supports' },
  { claim: 'Bans.', quote: 'Venues in London banned the glasses at 14 theaters', h: 'hyp2', stance: 'breaks' }, { claim: 'Odd h.', quote: 'Venues in London banned the glasses', h: 'HYP7', stance: 'breaks' }, { claim: 'Sales rose 47% last year.', quote: 'Meta said on Tuesday that it sold 2 million pairs', h: null }],
  figures: [{ figure: '2 million', quote: 'Meta said on Tuesday that it sold 2 million pairs', measures: 'pairs sold' }, { figure: '3 million', quote: 'Meta said on Tuesday that it sold 2 million pairs', measures: 'x' }, { figure: '14', quote: 'banned the glasses at 14 theaters this summer', measures: 'theaters in 2026' },
    { figure: 'many', quote: 'Venues in London banned the glasses', measures: 'x' }, { figure: '5%', quote: 'Prices rose 15% in the quarter.', measures: 'prices' }, { figure: '47%', quote: 'Prices rose sharply ... 47%', measures: 'prices' }],
  who: ['Meta'], dated: '2026-08-01' }, src, clean);
ok(card.claims.length === 3 && card.claims[1].h === 'HYP2' && card.claims[1].stance === 'breaks' && card.claims[2].h === null && card.claims[2].stance === 'context' && card.figures.length === 2 && card.figures.map(f => f.figure).join() === '2 million,14' &&
  card.figures[1].measures === '' && card.dropped === 6 && card.q.join() === 'SQ1' && card.relevant && card.url === 'https://a.com/1' && card.published_at === null,
  'C3 review: a card keeps only what the page carries: an invented quote, a claim with a number its quote lacks, a figure not whole in its quote are dropped and counted; a "measures" keeps no number of its own; the model\'s date never dates the source; a hypothesis that does not exist is context');
ok(!R.deepCardClean({ relevant: true, claims: [{ claim: 'x', quote: 'nothing like it at all here' }] }, src, clean).relevant && R.deepCardClean({ relevant: false, claims: [] }, src, clean).relevant === false && R.deepCardClean(null, src, clean) === null,
  'C4 a card with nothing the page carries is not relevant; an unparsable answer is no card');
ok(/claude-sonnet-5-5/.test(JSON.stringify(D.CARD)) && /copy every quote exactly as it appears in the source/.test(w) && /a source that cuts against a hypothesis is the most valuable thing you can find, so mark it breaks/.test(w) && /an ellipsis may skip words inside one passage, never between passages/.test(w),
  'C5 Sonnet 5.5 reads the cards under the copy-exactly rule, is told an ellipsis never joins passages, and to look hardest for what breaks the plan');

// ── L: coding and counting comments ────────────────────────────────────
const lab = R.deepLabelsClean({ labels: [{ i: 1, on: true, themes: ['Privacy', 'made up'], stance: 'against' }, { i: 2, on: false, themes: [], stance: 'odd' }, { i: 1, on: false }, { i: 9, on: true }] }, [{ i: 1 }, { i: 2 }, { i: 3 }], clean.themes);
ok(lab.length === 2 && lab[0].themes.join() === 'privacy' && lab[0].stance === 'against' && lab[1].stance === 'none' && !lab.some(l => l.i === 9),
  'L1 a label keeps only the plan\'s themes, one of five stances, one per comment the chunk carried; the coder never describes the speaker');
const mkItems = (n, band, share) => Array.from({ length: n }, (_, k) => ({ i: k + 1, src: 'yt:v' + (k % 3), text: 't', band, share: share && k === 0 ? { outlet: 'x', headline: 'h' } : null }));
const chunkNow = { ord: 0, payload: { items: mkItems(40, 'now', true) } }, chunkThen = { ord: 1, payload: { items: mkItems(40, 'earlier') } }, chunkAfter = { ord: 2, payload: { items: mkItems(4, 'after') } };
const labelsOf = (ord, items, theme) => ({ ref: String(ord), payload: { labels: items.filter(x => !x.share).map(x => ({ i: x.i, on: x.i % 4 !== 0, themes: x.i % 2 ? [theme] : ['price'], stance: x.i % 3 ? 'against' : 'for' })) } });
const counts = R.deepCountComments([chunkNow, chunkThen, chunkAfter], [labelsOf(0, chunkNow.payload.items, 'privacy'), labelsOf(1, chunkThen.payload.items, 'style'), labelsOf(2, chunkAfter.payload.items, 'battery')], clean.themes);
ok(counts.read === 84 && counts.shares === 1 && counts.coded === 83 && counts.on_subject === 59 && counts.on_now === 29 && counts.on_then === 30 && counts.after === 4 && counts.on_after === 3 && counts.by_theme.battery === 0 &&
  counts.by_theme.price + counts.by_theme.privacy + counts.by_theme.style === 59 && counts.by_theme_pct.price === Math.round(counts.by_theme.price / 59 * 100) && counts.by_theme_now_pct === null && counts.by_stance.for + counts.by_stance.against === 59 && counts.sources === 3,
  'L2 review: the counts: every comment kept, shares set aside, coded, on the subject, by theme and stance as whole percents; one posted after the period is counted apart and in nothing else; then and now needs 30 on each side (29 here, so none)');

// ── M: views and the kinds of outlet ───────────────────────────────────
const vw = R.deepViewsOf([{ views: 10, likes: 1, comments: 2 }, { views: 30, likes: 2, comments: 1 }]);
ok(vw.videos === 2 && vw.views === 40 && vw.top_views === 30 && vw.likes === 3 && R.deepViewsOf([]) === null, 'M1 the videos measured: how many, their views between them, the most watched');
ok(R.deepOutletRule('edition.cnn.com') === 'news' && R.deepOutletRule('techcrunch.com') === 'tech' && R.deepOutletRule('ftc.gov') === 'government' && R.deepOutletRule('city.gov.uk') === 'government' && R.deepOutletRule('mit.edu') === 'research' &&
  R.deepOutletRule('someone.substack.com') === 'community' && R.deepOutletRule('afb.org') === 'health' && R.deepOutletRule('unknown-blog.io') === null, 'M2 an outlet\'s kind by the registry (subdomains too) and plain rules; an outlet no rule knows is asked');
resetAll();
const kvm = { 'otypes:v1': JSON.stringify({ 'cached.com': 'trade' }) }, kvOps = [];
const kv = { get: async k => { kvOps.push('get:' + k); return kvm[k] || null; }, put: async (k, v) => { kvOps.push('put:' + k); kvm[k] = v; } };
claudeAnswers = [{ ok: true, text: '{"mystery.net": "health", "odd.io": "bogus"}', cost_usd: 0.004 }];
const ot = await R.deepOutletTypes({ RATE_LIMIT: kv }, ['techcrunch.com', 'cached.com', 'mystery.net', 'odd.io'], 41);
ok(ot.types['techcrunch.com'] === 'tech' && ot.types['cached.com'] === 'trade' && ot.types['mystery.net'] === 'health' && ot.types['odd.io'] === 'unclassified' && ot.cost === 0.004 && JSON.parse(kvm['otypes:v1'])['mystery.net'] === 'health' && !JSON.parse(kvm['otypes:v1'])['odd.io'] &&
  kvOps.join() === 'get:otypes:v1,put:otypes:v1' && claudeCalls.length === 1 && claudeCalls[0].tier === 'recon' && claudeCalls[0].params.model === 'claude-haiku-4-5-20251001' && claudeCalls[0].req.prompt === 'mystery.net\nodd.io' && claudeCalls[0].req.meta.recon_read_id === 41,
  'M3 review: the registry first, then the learned map (one KV read, one write), then a Haiku call on the recon tier tagged to this RECON; an answer outside the kinds is unclassified (never "other"), and only real answers are learned');
resetAll();
claudeAnswers = [{ ok: false, error: 'claude_cap' }];
const ot2 = await R.deepOutletTypes({}, ['mystery.net', 'techcrunch.com'], 41);
ok(ot2.types['mystery.net'] === 'unclassified' && ot2.types['techcrunch.com'] === 'tech', 'M4 review: a classifier that could not answer leaves its outlets unclassified, never a false "other"');
const stories = R.deepStoriesInPeriod([{ kind: 'lake', payload: { url: 'https://techcrunch.com/a', title: 'x', sim: 0.7, published_at: '2026-08-01' } }, { kind: 'lake', payload: { url: 'https://far.com/a', title: 'far', sim: 0.4, published_at: '2026-08-01' } },
  { kind: 'web', payload: { url: 'https://afb.org/a', title: 'Smart glasses for blind users', published_at: '2026-09-01' } }, { kind: 'web', payload: { url: 'https://off.com/a', title: 'Unrelated', published_at: '2026-09-01' } },
  { kind: 'card', payload: { url: 'https://techcrunch.com/a', relevant: true, published_at: '2026-08-01' } }, { kind: 'web', payload: { url: 'https://old.com/a', title: 'smart glasses', published_at: '2025-01-01' } },
  { kind: 'lake', payload: { url: 'https://wired.com/run', title: 'Smart glasses story DAILY ran', sim: 0.9, published_at: '2026-08-03', edition_item_id: 501 } }], WIN, R.readReconOf(row).match, [{ id: 501, source_url: 'https://www.dailyfoo.com/run' }]);
const ct = R.deepCountTypes(stories, { 'techcrunch.com': 'tech', 'afb.org': 'health' });
ok(stories.length === 3 && ct.stories.tech === 1 && ct.stories.health === 1 && ct.stories.lifestyle === 0 && Object.keys(ct.stories).length === 13 && ct.outlets.tech === 1 && ct.unclassified === 1 && ct.unclassified_outlets === 1,
  'M5 review: the stories found in the period, once each by page (DAILY\'s own counted as DAILY\'s), by kind with every kind present; a story whose outlet is not sorted is counted apart');

// ── E: the evidence file and the stage machine ─────────────────────────
const card2 = Object.assign({}, card, { q: ['SQ2'], claims: [{ claim: 'c', quote: 'q', h: 'HYP2', stance: 'breaks' }], figures: [] });
const file = R.deepFile({ plan: clean }, [card, card2]);
ok(file.cards === 2 && file.by_q.SQ1 === 1 && file.by_q.SQ2 === 1 && file.by_h.HYP1.supports === 1 && file.by_h.HYP2.breaks === 2 && file.breaking.length === 2 && file.top[0].figures.length === 2,
  'E1 the evidence file: cards per sub-question, claims for and against each hypothesis, what cuts against the plan, the richest cards first');
resetAll();
const prow = clone(row); prow.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [] };
claudeAnswers = [{ ok: true, text: JSON.stringify(planJson), cost_usd: 0.97 }];
fixtures = {};
const un5 = quiet();
const a5 = await R.deepAdvance({ AI: { run: async (m2, i) => ({ data: i.text.map(() => [0.1]) }) } }, prow, { ms: 0 });
un5();
ok(claudeCalls[0].tier === 'recon' && claudeCalls[0].params.model === 'claude-fable-5-1' && claudeCalls[0].params.output_config.effort === 'high' && claudeCalls[0].params.thinking.type === 'adaptive' && claudeCalls[0].req.timeout_ms === 300000 && claudeCalls[0].req.meta.recon_read_id === 41 &&
  /DECISIONS THE CLIENT MUST MAKE:\n1\. Who is the first wearer\?/.test(claudeCalls[0].req.prompt) && /THE PERIOD: 2026-07-08 to 2026-10-05\./.test(claudeCalls[0].req.prompt) &&
  prow.meta.deep.stage === 'search' && prow.meta.deep.spend.plan === 0.97 && prow.meta.deep.plan.sub_questions.length === 4 && a5.steps.join() === 'plan>search' && prow.meta.deep.log[0].stage === 'plan' && prow.meta.deep.tries.plan === 0 && !prow.meta.deep.lease,
  'E2 the plan stage: Fable 5.1 live on the recon tier, high effort, five minutes of room, tagged to its RECON; the brief with its decisions and the period; its cost read back from its job onto the receipt; the log keeps the step; the lease is let go');
ok(patches[0].meta.deep.lease && patches[0].meta.deep.lease.stage === 'plan' && patches[0].meta.deep.tries.plan === 1, 'E3 review: before a stage runs its lease is written and its try counted, so a run that dies still counts');
resetAll();
const frow = clone(row); frow.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [], tries: { plan: 2 } };
claudeAnswers = [{ ok: true, text: 'not json at all', cost_usd: 0.5 }];
const un6 = quiet();
await R.deepAdvance({}, frow, { ms: 60000 });
un6();
const fp = patches[patches.length - 1];
ok(frow.meta.deep.stage === 'failed' && frow.meta.deep.failed_stage === 'plan' && fp.status === 'failed' && /^deep_plan:plan_unparsable$/.test(fp.error) && frow.meta.deep.spend.plan === 0.5,
  'E4 a stage that fails three times stops the RECON plainly, with the stage and the reason; what it spent stays on the receipt');
resetAll();
const drow = clone(row); drow.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [], tries: { plan: 3 }, lease: { stage: 'plan', at: new Date(Date.now() - 20 * 60000).toISOString() } };
const unD0 = quiet();
await R.deepAdvance({}, drow, { ms: 60000 });
unD0();
ok(drow.meta.deep.stage === 'failed' && !claudeCalls.length && /^deep_plan:died$/.test(patches[patches.length - 1].error),
  'E5 review: three runs that died (the CPU limit, a deploy, a lost write) fail the RECON plainly instead of paying for the stage every half hour');
resetAll();
const lrow0 = clone(row); lrow0.updated_at = 'v0'; lrow0.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [], lease: { stage: 'plan', at: new Date().toISOString() } };
const unL0 = quiet();
const busy1 = await R.deepAdvance({}, lrow0, { ms: 60000 });
lrow0.meta.deep.lease = null; casFail = true;
const busy2 = await R.deepAdvance({}, lrow0, { ms: 60000 });
unL0();
ok(busy1.busy && busy2.busy && busy1.idle && !claudeCalls.length && !patches.length,
  'E6 review: a row another runner holds (a fresh lease, or a write that lands first) is left alone: one runner a stage, never two plans paid for');
resetAll();
const wrow0 = clone(row); wrow0.updated_at = 'v0'; wrow0.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [] };
claudeAnswers = [{ ok: true, text: JSON.stringify(planJson), cost_usd: 0.9 }]; casFailAt = 2;
const unW0 = quiet();
const lost = await R.deepAdvance({}, wrow0, { ms: 60000 });
unW0();
ok(lost.busy && claudeCalls.length === 1 && patches.length === 1 && patches[0].meta.deep.tries.plan === 1, 'E7 review: a stage whose result could not be written leaves its counted try and its lease, so the next run after the lease counts again');
const safe = R.deepSafe({ a: 'ok\u0000x', b: ['\ud83d', 'pair 😀'], c: { 'k\u0000': 'end\udc00' } });
ok(safe.a === 'okx' && safe.b[0] === '' && safe.b[1] === 'pair 😀' && safe.c.k === 'end' && R.deepStr('x'.repeat(299) + '😀', 300).length === 299,
  'E8 review: text Postgres keeps: no NUL, no half of a surrogate pair (a cut emoji), whole pairs kept');
resetAll();
const brow = clone(row); brow.meta.deep = { v: 1, stage: 'plan', budget_usd: 1, spend: { rails: 0.2 }, counts: {}, log: [] };
const un7 = quiet();
await R.deepAdvance({}, brow, { ms: 60000 });
un7();
ok(brow.meta.deep.stage === 'hold' && brow.meta.deep.hold_reason === 'budget' && brow.meta.deep.held_from === 'plan' && !claudeCalls.length, 'E9 a stage whose worst case would cross the ceiling holds before it spends, and remembers where it stopped');
resetAll();
const krow = clone(row); krow.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [] };
claudeAnswers = [{ ok: false, error: 'claude_cap' }];
const unK0 = quiet();
const ka = await R.deepAdvance({}, krow, { ms: 60000 });
unK0();
ok(krow.meta.deep.stage === 'plan' && krow.meta.deep.waiting === 'ledger_cap' && krow.meta.deep.tries.plan === 0 && ka.idle, 'E10 review: a ledger at its cap (or switched off) is waited out, never counted toward failing the RECON');
ok(/if \(Date\.now\(\) \+ READ_DEEP\.STAGE_MS > deadline\) \{ out\.late = true; break; \}/.test(w) && /readTick\(env, \{ deep: true, t0 \}\)/.test(w) && D.WALL_MS === 780000 && D.STAGE_MS === 330000,
  'E11 review: no stage starts with too little of the invocation left to finish (the half-hour cron hands its own clock down)');

// ── R (cont.): the read stage submits the cards and the coding ─────────
const seedRead = (rowId, comments) => cand.map((c, i) => ({ id: i + 1, read_id: rowId, kind: c.kind, ord: i, ref: c.payload.url, payload: c.payload })).concat(comments);
resetAll();
const rrow = clone(row); rrow.meta.deep = { v: 1, stage: 'read', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, [{ id: 50, read_id: 41, kind: 'comments', ord: 0, ref: null, payload: { items: mkItems(40, 'now', true) } }, { id: 51, read_id: 41, kind: 'comments', ord: 1, ref: null, payload: { items: [{ i: 1, text: 'only a share', share: { headline: 'h' } }] } }]); evId = 60;
fetchImpl = async () => ({ ok: true, status: 200, headers: { get: k => /length/i.test(k) ? '' : 'text/html' }, text: async () => html });
const un8 = quiet();
await R.deepAdvance({}, rrow, { ms: 60000 });
un8();
const cardsB = submitted.find(s => s.kind === 'recon_card'), labB = submitted.find(s => s.kind === 'recon_labels');
ok(rrow.meta.deep.stage === 'wait' && cardsB.tier === 'recon' && cardsB.items.every(it => it.model === 'claude-sonnet-5-5' && /^rc-41-\d+$/.test(it.custom_id) && it.meta.recon_read_id === 41 && /THE PLAN\nQUESTION: /.test(it.system) && /TEXT:\n/.test(it.prompt)) &&
  labB.tier === 'recon' && labB.items.length === 1 && labB.items[0].model === 'claude-haiku-4-5-20251001' && /THE THEMES:\nprivacy/.test(labB.items[0].system) && !/only a share/.test(labB.items[0].prompt) && rrow.meta.deep.batches.length === 2 &&
  ev.filter(r => r.kind === 'source').length === cardsB.items.length && submitted.indexOf(cardsB) < submitted.indexOf(labB) && rrow.meta.deep.spend.inflight > 0,
  'R8 the read stage stores every page it read and submits the cards first (Sonnet 5.5, the plan in the cached system), then the coding (Haiku, the themes in the system; a chunk of shares only is never coded), on the recon tier; a batch still out is on the receipt at its reservation');
ok(patches.some(p => p.meta && p.meta.deep && p.meta.deep.batches && p.meta.deep.batches.length === 1 && p.meta.deep.stage === 'read'),
  'R9 review: each batch is written to the row the moment it is sent, before the next one goes');
resetAll();
const arow = clone(row); arow.meta.deep = { v: 1, stage: 'read', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, [{ id: 50, read_id: 41, kind: 'comments', ord: 0, ref: null, payload: { items: mkItems(40, 'now') } }]).concat([{ id: 70, read_id: 41, kind: 'source', ord: 0, ref: src.url, payload: Object.assign({}, src, { text: src.text }) }]); evId = 80;
jobs = [{ read_id: 41, batch_id: 'bOLD', kind: 'recon_card', custom_id: 'rc-41-0', status: 'submitted', est_usd: 0.02, meta: { recon_read_id: 41, ord: 0 } }];
const unR2 = quiet();
await R.deepAdvance({}, arow, { ms: 60000 });
unR2();
ok(!submitted.some(s => s.kind === 'recon_card') && submitted.filter(s => s.kind === 'recon_labels').length === 1 && !fetches.length && arow.meta.deep.batches.some(b => b.id === 'bOLD' && b.adopted) && arow.meta.deep.stage === 'wait',
  'R10 review: a read stage that died after sending its cards adopts that batch (never sends it again), reads no page twice, and sends only what is missing');
resetAll();
const lrow1 = clone(row); lrow1.meta.deep = { v: 1, stage: 'read', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, [{ id: 50, read_id: 41, kind: 'comments', ord: 0, ref: null, payload: { items: mkItems(40, 'now') } }]); evId = 60;
submitRefuse = 'claude_cap';
const unR3 = quiet();
const ra = await R.deepAdvance({}, lrow1, { ms: 60000 });
unR3();
const fetched1 = fetches.length;
submitRefuse = null;
const unR4 = quiet();
await R.deepAdvance({}, lrow1, { ms: 60000 });
unR4();
ok(ra.idle && lrow1.meta.deep.stage === 'wait' && submitted.length === 2 && submitted[0].kind === 'recon_card' && fetches.length === fetched1 && lrow1.meta.deep.tries.read === 0,
  'R11 review: a ledger that refuses the cards is waited out (nothing coded without its cards, no failure counted); the next tick sends them from the pages already read, never fetching a page twice');
resetAll();
const trow = clone(row); trow.meta.deep = { v: 1, stage: 'read', budget_usd: 14.2, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, []); evId = 60;
const unR5 = quiet();
await R.deepAdvance({}, trow, { ms: 60000 });
unR5();
ok(trow.meta.deep.stage === 'hold' && trow.meta.deep.held_from === 'read' && !fetches.length && !submitted.length,
  'R12 review: before a page is fetched the ceiling must hold the pages\' credits, a working set of cards, the compile and the desk; a RECON that cannot afford them holds without paying Tavily');
resetAll();
const t2row = clone(row); t2row.meta.deep = { v: 1, stage: 'read', budget_usd: 14.83, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, Array.from({ length: 30 }, (_, k) => ({ id: 100 + k, read_id: 41, kind: 'comments', ord: k, ref: null, payload: { items: mkItems(40, 'now') } }))); evId = 200;
const unR6 = quiet();
await R.deepAdvance({}, t2row, { ms: 60000 });
unR6();
const lb2 = submitted.find(s => s.kind === 'recon_labels');
ok(submitted.find(s => s.kind === 'recon_card').items.length === 7 && (!lb2 || lb2.items.length < 30), 'R13 a tight ceiling trims the batches before anything is submitted: the comment coding gives way first, the cards last, room kept for the compile and the desk');
resetAll();
const nrow = clone(row); nrow.meta.deep = { v: 1, stage: 'read', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [], plan: clean, tries: {} };
ev = seedRead(41, [{ id: 50, read_id: 41, kind: 'comments', ord: 0, ref: null, payload: { items: mkItems(40, 'now') } }]); evId = 60;
fetchImpl = async () => ({ ok: false, status: 403, headers: { get: () => 'text/html' }, text: async () => '' });
const unR7 = quiet();
await R.deepAdvance({}, nrow, { ms: 60000 });
const firstErr = nrow.meta.deep.last_error;
nrow.meta.deep.tries = { read: 2 };
await R.deepAdvance({}, nrow, { ms: 60000 });
unR7();
ok(firstErr === 'read_none' && nrow.meta.deep.stage === 'wait' && !submitted.some(s => s.kind === 'recon_card') && submitted.some(s => s.kind === 'recon_labels'),
  'R14 review: no readable source is a failure to try again (never a false budget hold); the last try goes on without cards');
resetAll();
const prow2 = clone(row); prow2.meta.deep = { v: 1, stage: 'read', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [], plan: clean };
ev = seedRead(41, []); evId = 60;
fetchImpl = async (url, init) => /api\.tavily\.com/.test(url) ? { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ results: JSON.parse(init.body).urls.map(u => ({ url: u, raw_content: 'Text of the page. '.repeat(60) })) }) } : { ok: false, status: 404, headers: { get: () => '' } };
const unR8 = quiet();
await R.deepAdvance({ FIELD_API_KEY: 'k' }, prow2, { ms: 60000 });
unR8();
ok(prow2.meta.deep.spend.tavily === 0.016 && prow2.meta.deep.counts.tavily_credits === 2 && /api\\\.tavily\\\.com/.test(gate) && /'deepExtract': '/.test(gate) && /'fieldRail': '/.test(gate),
  'R15 review: Tavily is a spender: its credits (counted by its rule when it does not say) go on the receipt, and the gate knows both doors that spend them');

// ── W: the batches back ────────────────────────────────────────────────
resetAll();
const wrow = clone(row); wrow.meta.deep = { v: 1, stage: 'wait', budget_usd: 30, hold: true, spend: { plan: 1 }, counts: {}, log: [], plan: clean, batches: [{ id: 'bA', kind: 'recon_card' }, { id: 'bB', kind: 'recon_labels' }], batched_at: new Date().toISOString() };
const srcDated = Object.assign({}, src, { published_at: '2026-08-01', band: 'now' });
ev = [{ id: 1, read_id: 41, kind: 'source', ord: 0, ref: src.url, payload: srcDated }, { id: 2, read_id: 41, kind: 'comments', ord: 0, ref: null, payload: { items: [{ i: 1, text: 'love them', band: 'now' }, { i: 2, text: 'hate them', band: 'now' }] } }]; evId = 10;
jobs = [{ id: 1, read_id: 41, custom_id: 'rc-41-0', kind: 'recon_card', status: 'submitted', est_usd: 0.02, meta: { ord: 0 } }];
const unA = quiet();
const aw = await R.deepAdvance({}, wrow, { ms: 60000 });
unA();
ok(wrow.meta.deep.stage === 'wait' && aw.steps.length === 1 && aw.idle && wrow.meta.deep.spend.inflight === 0.02 && wrow.meta.deep.log.length === 0, 'W1 the wait stage waits while any job is still out (idle: no log line, the reservation on the receipt)');
jobs = [{ id: 2, read_id: 41, custom_id: 'rc-41-0', kind: 'recon_card', status: 'done', cost_usd: 0.012, result: JSON.stringify({ relevant: true, q: ['SQ1'], claims: [{ claim: 'Sales doubled.', quote: 'it sold 2 million pairs - double the year before', h: 'HYP1', stance: 'supports' }], figures: [{ figure: '14', quote: 'banned the glasses at 14 theaters this summer', measures: 'theaters' }] }), meta: { ord: 0 } },
  { id: 1, read_id: 41, custom_id: 'rc-41-0', kind: 'recon_card', status: 'failed', cost_usd: 0, meta: { ord: 0 } },
  { id: 3, read_id: 41, custom_id: 'rl-41-0', kind: 'recon_labels', status: 'done', cost_usd: 0.002, result: '{"labels":[{"i":1,"on":true,"themes":["style"],"stance":"for"},{"i":2,"on":true,"themes":["price"],"stance":"against"}]}', meta: { ord: 0 } }];
const unB = quiet();
await R.deepAdvance({ GOOGLE_API_KEY: 'g', RATE_LIMIT: kv }, wrow, { ms: 60000 });
unB();
ok(ev.filter(r => r.kind === 'card').length === 1 && ev.find(r => r.kind === 'card').payload.claims.length === 1 && ev.filter(r => r.kind === 'labels').length === 1 && wrow.meta.deep.spend.cards === 0.012 && wrow.meta.deep.spend.labels === 0.002 && wrow.meta.deep.spend.inflight === 0 &&
  wrow.meta.deep.counts.cards === 1 && wrow.meta.deep.comments.on_subject === 2 && wrow.meta.deep.comments.by_theme.style === 1,
  'W2 when every job is back the cards are cleaned against their pages (an answer over a failure, one per id), the coding is kept, and what each batch really cost goes on the receipt; the measure stage counts what the comments raised');
ok(wrow.meta.deep.stage === 'hold' && wrow.meta.deep.hold_reason === 'evidence' && wrow.meta.deep.file.cards === 1 && wrow.meta.deep.outlet_types.types && wrow.meta.deep.outlet_types.stories,
  'W3 a commission with hold stops at its evidence file, written for the desk, with every outlet the compile may count already sorted');
resetAll();
const ncrow = clone(row); ncrow.meta.deep = { v: 1, stage: 'evidence', budget_usd: 30, hold: false, spend: {}, counts: {}, log: [], plan: clean };
ev = [{ id: 1, read_id: 41, kind: 'card', ord: 0, ref: 'x', payload: { relevant: false } }]; evId = 5;
const unNC = quiet();
await R.deepAdvance({}, ncrow, { ms: 60000 });
unNC();
ok(ncrow.meta.deep.stage === 'hold' && ncrow.meta.deep.hold_reason === 'no_cards', 'W4 review: a RECON with no source read in full that bore on the question holds for the desk, never compiles on its own');

// ── K: the deep pack ───────────────────────────────────────────────────
const pv = R.deepPickVoices([{ ord: 0, payload: { items: [{ i: 1, src: 'yt:a', text: 'privacy worries me', likes: 9, band: 'now' }, { i: 2, src: 'yt:a', text: 'too pricey', likes: 8, band: 'now' }, { i: 3, src: 'yt:b', text: 'off topic', likes: 99, band: 'now' }, { i: 4, src: 'yt:c', text: 'back in 2014', likes: 5, band: 'earlier' },
    { i: 5, text: 'share', share: { headline: 'h' } }, { i: 6, src: 'yt:d', text: 'later on', likes: 500, band: 'after' }] } }],
  [{ ref: '0', payload: { labels: [{ i: 1, on: true, themes: ['privacy'], stance: 'against' }, { i: 2, on: true, themes: ['price'], stance: 'against' }, { i: 3, on: false, themes: [] }, { i: 4, on: true, themes: ['privacy'], stance: 'mixed' }, { i: 6, on: true, themes: ['price'], stance: 'for' }] } }],
  { voices: { sources: [{ id: 'yt:a', source: 'YouTube', title: 'T', n: 2 }], queries: ['q'] } }, { start: '2026-07-08', end: '2026-10-05' });
ok(pv.quotes.length === 3 && !pv.quotes.some(q => q.text === 'off topic' || q.text === 'share' || q.text === 'later on') && pv.quotes[pv.quotes.length - 1].band === 'earlier' && pv.quotes[0].coded.themes[0] === 'privacy' && pv.quotes[0].source === 'YouTube' && pv.sources.length === 1,
  'K1 review: the voices for the writer: only comments coded on the subject, never a share, never one posted after the period, most liked first theme by theme, the years before kept apart; each carries its code');
const vline = R.readReportVoiceLine(1, Object.assign({ title: 'T' }, pv.quotes[0]));
ok(/ \| coded: privacy; against$/.test(vline) && !/YouTube/.test(vline), 'K2 a coded voice line says what we coded it as and never names the platform');
const cardD = Object.assign({}, card, { published_at: '2026-08-01' });
const cl = R.deepCardLine(3, cardD);
ok(/^C3 \| 2026-08-01 \| A \| read in full \| reporting \| SQ1 \| TITLE: Glasses \| CLAIMS: \(1\) Sales doubled to 2 million pairs\. \[supports HYP1\] "it sold 2 million pairs - double the year before"/.test(cl) && /FIGURES: 2 million \(pairs sold\): "Meta said on Tuesday that it sold 2 million pairs" 14: "banned/.test(cl) &&
  /^C1 \| undated \| /.test(R.deepCardLine(1, card)),
  'K3 a card line: the source (dated by itself, else undated), read in full, its sub-questions, each checked claim with the hypothesis it supports or breaks, each checked figure with its sentence');
const cb = R.deepCountsBlock({ comments: counts, videos: vw }, ct);
ok(/^COUNTED BY US \(exact counts; STATS\.recon carries the same figures\):\n84 comments and posts kept from 3 videos and tags and read; 1 shared headline set aside; 83 coded; 59 on the subject \(29 from the period, 30 from before it\); 4 comments posted after the period, counted apart and nowhere else\./.test(cb) &&
  /By theme, of the comments on the subject \(a comment can raise two\): /.test(cb) && /The videos the comments came from: 2 videos, 40 views between them, the most watched 30 views\./.test(cb) && /technology 1;/.test(cb) && /health and accessibility 1;/.test(cb) &&
  /fashion and lifestyle 0;/.test(cb) && /not yet sorted 1 \(so no zero here is a silence\)/.test(cb) && !/every outlet sorted/.test(cb) && !/Then and now/.test(cb),
  'K4 review: the counts block carries only counts the worker made, on the subject, with one count of one in the singular; a zero is a silence only when every outlet was sorted; then and now only with enough on both sides');
const ctAll = R.deepCountTypes([{ host: 'techcrunch.com' }], { 'techcrunch.com': 'tech' });
ok(/\(every outlet sorted, so a kind at zero is a silence\): /.test(R.deepCountsBlock({}, ctAll)) && R.deepCountsBlock({}, null) === '', 'K5 when every outlet is sorted the block may call a zero a silence');
ok(/^THE RESEARCH PLAN \(our structure for this RECON, never evidence; its ids, SQ<n> and HYP<n>, never appear in the read\):\nQUESTION: /.test(R.deepPlanBlock(clean)) && /WHO THE BRIEF MIGHT MISS: blind and low vision wearers/.test(R.deepPlanBlock(clean)) && /DECISIONS: Decision 1: Who is the first wearer\?/.test(R.deepPlanBlock(clean)) && R.deepPlanBlock(null) === '',
  'K6 the plan block names itself as structure, never evidence, with who the brief might miss and the decisions');
resetAll();
fixtures = { 'signals?status=neq.rejected&edition_item_id=is.null': () => [{ id: 900, title: 'Smart glasses anchor story', summary: 's', source_name: 'Wired', source_tier: 1, territory: 'technology-innovation', published_at: '2026-08-05', url: 'https://www.wired.com/a' }, { id: 901, title: 'Smart glasses page also read in full', url: 'https://a.com/1', source_tier: 1, published_at: '2026-08-02' }],
  'signals?status=neq.rejected&source_tier=lte.1': () => [{ id: 902, title: 'Smart glasses old page read in full', url: 'https://a.com/1', source_tier: 1, published_at: '2024-02-01' }], 'door_reads?': () => [], 'reads?created_at': () => [] };
const sItems = [{ id: 501, signal_id: 'pub1', source_url: 'https://wired.com/run', source_name: 'Wired', date: '2026-08-03', headline: 'DAILY ran it', territory: 'technology-innovation' }];
const deepIn = { lake: [{ id: 'm1', title: 'Meaning story', source_name: 'Verge', source_tier: 1, published_at: '2026-08-02', url: 'https://verge.com/m', sim: 0.8, qs: ['SQ1', 'SQ2'] }, { id: 'pub1', title: 'Smart glasses story DAILY ran', source_tier: 1, published_at: '2026-08-03', url: 'https://wired.com/run', edition_item_id: 501, qs: ['SQ1'] }],
  record: [{ id: 'r1', title: 'Old report', source_tier: 1, published_at: '2023-02-01', url: 'https://old.com/r', qs: ['SQ4'] }],
  cards: [cardD], voices: pv, plan: R.deepPlanBlock(clean), meta: { comments: counts, videos: vw, outlet_types: { types: { 'verge.com': 'tech', 'wired.com': 'tech', 'a.com': 'news' } } }, items: sItems, lake_ids: new Set(['m1', 'pub1']) };
const reconObj = R.readReconOf(row);
const unK = quiet();
const pk = await R.readReportPack({}, row, { themes: [] }, reconObj, deepIn);
unK();
ok(pk.ids.C === 1 && pk.lines.C[0].outlet === 'A' && pk.lines.C[0].figures === 2 && pk.ids.L.length === 2 && pk.ids.L.join() === 'm1,900' && pk.ids.R.join() === 'r1' && /L1 \| 2026-08-02 \| unassigned \| T1 \| Meaning story .* \| answers SQ1,SQ2/.test(pk.text) &&
  /SOURCES READ IN FULL \(1 evidence cards: every quote and figure checked against the page; cite as C ids\):\nC1 \| /.test(pk.text) && pk.text.indexOf('COUNTED BY US') < pk.text.indexOf('CONSUMER VOICES (') && pk.text.indexOf('CONSUMER VOICES (') > pk.text.indexOf('C1 |') &&
  !/THE RESEARCH PLAN/.test(pk.text) && pk.plan === deepIn.plan && pk.counts.cards === 1 && pk.voices === pv && R.readReportExtraIds(pk).includes('C1') && /answers SQ4/.test(pk.text) && pk.win.start === '2026-07-08',
  'K7 review: the deep pack carries each story once: DAILY\'s own is its S line (never also an L line), a page read in full is its C line (never also an L or R line); the meaning search and the brief\'s words merge; the counts before the voices; the plan beside the text and never in it; C ids are citable');
const rs = R.readReconStats(reconObj, sItems, pk, null);
const otSum = Object.values(pk.outlet_types.stories).reduce((a, b) => a + b, 0) + (pk.outlet_types.unclassified || 0);
ok(rs.stories_all === 2 + 1 + 1 && otSum === rs.stories_all && pk.outlet_types.stories.tech === 3 && pk.outlet_types.stories.news === 1 && !pk.outlet_types.unclassified,
  'K8 review: the stories on the question count every page once (lake lines, DAILY\'s stories, sources read in full dated in the period), and the kinds of outlet are counted over exactly those stories');
const ds = R.deepStatsOf({ plan: clean, counts: { lake_found: 7, searches: 9, counter_searches: 2, read_full: 31 }, comments: counts, videos: vw }, pk);
ok(ds.deep === true && ds.read_full === 31 && ds.cards === 1 && ds.figures === 2 && ds.lake_found === 7 && ds.searches === 9 && ds.comments.read === 84 && ds.voices_read === 84 && ds.videos.views === 40 && ds.outlet_types.tech === 3 &&
  !('sub_questions' in ds) && !('hypotheses' in ds) && pk.counts.voices_read === 84 && /84 comments and posts read to find them/.test(pk.text),
  'K9 review: STATS.recon carries every deep count (what was read in full, and what of it bore on the question), one figure for the comments read wherever it appears, and never the plan\'s own counts');
const bigLake = Array.from({ length: 260 }, (_, i) => ({ id: 'l' + i, title: 'Lake line ' + i + ' ' + 'x'.repeat(250), source_tier: 2, published_at: '2026-08-01', url: 'https://l' + i + '.com/a', qs: ['SQ1'] }));
const bigCards = Array.from({ length: 48 }, (_, i) => Object.assign({}, cardD, { title: 'Card ' + i, claims: Array.from({ length: 5 }, () => ({ claim: 'c'.repeat(200), quote: 'q'.repeat(300), h: null, stance: 'context' })) }));
const fit1 = R.deepFitPack(bigLake, bigCards, [], 200000, D.PACK.CHARS), fit2 = R.deepFitPack(bigLake, bigCards, [], 330000, D.PACK.CHARS), fit0 = R.deepFitPack(bigLake, bigCards, [], 60000, D.PACK.CHARS);
ok(fit0.lake.length === 260 && fit0.cards.length === 48 && fit1.lake.length < 260 && fit1.lake.length >= D.PACK.LAKE_MIN && fit1.cards.length === 48 && fit2.cards.length < 48 && fit2.lake.length < fit1.lake.length && fit1.lake[0].id === 'l0',
  'K10 review: the pack fits its size without ever cutting the voices: lake lines give way first, then cards, each from its weakest end');

// ── X: the laws know C, and never a plan id ────────────────────────────
const sup = R.readSupports({ findings: [{ evidence: ['C1', 'L1'], confidence: 'high' }, { evidence: ['C2'], confidence: 'high' }] }, id => id === 'C1' ? 'A' : id === 'L1' ? 'Verge' : 'B', id => id !== 'C2', null, null);
ok(sup.read.findings[0].supports.lines === 2 && sup.read.findings[0].supports.outlets === 2 && sup.read.findings[0].strength !== 'signal' && sup.read.findings[1].strength === 'signal', 'X1 a source read in full, dated inside the period, supports a finding like any story');
const lrow = { window_start: '2026-07-08', window_end: '2026-10-05', meta: { pack: { lines: { C: [{ title: 'Glasses', outlet: 'A', published_at: '2026-08-01', url: 'https://wired.com/run' }, { title: 'Old', outlet: 'Z', published_at: '2025-01-01' }], L: [{ title: 'x', source_name: 'Wired', published_at: '2026-08-04', url: 'https://www.wired.com/run' }] }, voices: { quotes: [] } } }, stats: {} };
const laws = R.readReportLaws({ findings: [{ evidence: ['C1', 'C2'], confidence: 'high' }, { evidence: ['S501', 'C1', 'L1'], confidence: 'high' }] }, lrow, [{ id: 501, date: '2026-08-03', source_name: 'Wired', source_url: 'https://wired.com/run' }]);
ok(laws.read.findings[0].supports.lines === 1 && laws.read.findings[0].supports.outlets === 1 && laws.read.findings[0].strength === 'signal' && laws.read.findings[1].supports.lines === 1,
  'X2 review: the report laws read a C line\'s outlet and date from the pack (a card from before the period never supports), and one page is one support however many lines carry it');
const rc = await R.readReceipts({}, { findings: [{ evidence: ['C1'] }] }, { meta: { pack: { lines: { C: [{ title: 'Glasses', outlet: 'A', url: 'https://a.com/1', tier: 1, published_at: '2026-08-01T00:00:00Z' }] } } } });
ok(rc.C1 && rc.C1.kind === 'card' && rc.C1.headline === 'Glasses' && rc.C1.source_name === 'A' && rc.C1.date === '2026-08-01' && rc.C1.source_url === 'https://a.com/1', 'X3 a C id resolves to its source on the page: the headline, the outlet, the date, the link');
const val = R.readValidate('recon', { title: 't', thesis: 'x', findings: [{ evidence: ['C1', 'C9'] }] }, '', [], ['C1']);
ok(val.read.findings[0].evidence.join() === 'C1' && val.notes.some(n => /evidence_ids_dropped:1/.test(n)), 'X4 the landing law keeps a C id the pack gave and drops one it did not');
ok(R.readReaderVoice({ thesis: 'As C3 shows, it grew.' }, { c: true }).notes.some(n => /^id_in_prose:thesis:C3$/.test(n)) && !R.readReaderVoice({ thesis: 'C3 Presents booked the tour; a C8 Corvette led it.' }).notes.length &&
  /readReaderVoice\(b\.read, \{ c: \(ln\.C \|\| \[\]\)\.length > 0 \}\)/.test(w),
  'X5 review: a C id in prose is caught where the read has sources read in full; elsewhere "C3 Presents" is a name');
ok(R.readReaderVoice({ thesis: 'SQ3 is settled: HYP2 breaks.' }).notes.some(n => /^plan_id_in_prose:thesis:SQ3$/.test(n)) && !R.readReaderVoice({ thesis: 'Sales rose in Q3 and H1.' }).notes.some(n => /plan_id/.test(n)) && /house_word\|id_in_prose\|plan_id_in_prose\|register/.test(w),
  'X6 review: a plan id in prose is caught (and holds the sale), while a quarter or a half year is plain prose');

// ── T: the tick, the compile, the hold ─────────────────────────────────
resetAll();
const crow = clone(row); crow.meta.deep = { v: 1, stage: 'compile', budget_usd: 30, spend: { plan: 1, cards: 0.6 }, counts: { lake_found: 1, read_full: 3 }, log: [], plan: clean, comments: counts, attention: null, outlet_types: { types: { 'a.com': 'news' } } };
const seedCompile = () => { ev = [{ id: 1, read_id: 41, kind: 'lake', ord: 0, ref: 'm', payload: Object.assign({}, deepIn.lake[0]) }, { id: 2, read_id: 41, kind: 'card', ord: 0, ref: cardD.url, payload: cardD }]; evId = 5;
  for (let k = 0; k < 14; k++) ev.push({ id: 10 + k, read_id: 41, kind: 'lake', ord: 1 + k, ref: 'x' + k, payload: { id: 'x' + k, title: 'Smart glasses line ' + k, source_name: 'O' + k, source_tier: 2, published_at: '2026-08-1' + (k % 9), url: 'https://o' + k + '.com/a', qs: ['SQ1'], sim: 0.7 } }); };
seedCompile();
const queued = [crow, { id: 42, kind: 'recon', status: 'queued', version: 1, window_start: '2026-07-08', window_end: '2026-10-05', meta: { brief: { text: 'x', frame }, deep: { stage: 'hold', hold_reason: 'evidence' } } }];
const compileFx = () => ({ 'house_reads?status=eq.queued': () => clone(queued), 'rpc/house_report_stats': () => ({ lake: { signals: 500, outlets: 60, by_territory: {} }, themes: [], window: { days: 90 } }),
  'editions?': () => [], 'edition_items?': () => [], 'signals?status=neq.rejected': () => [], 'door_reads?': () => [], 'reads?created_at': () => [], 'house_desk?': () => [] });
fixtures = compileFx();
const unC = quiet();
const tk = await R.readTick({}, { deep: true });
unC();
const job = submitted.find(s => s.kind === 'recon_analysis');
ok(tk.submitted === 1 && job && job.tier === 'recon' && job.items[0].custom_id === 'ra-41-v1' && /^You are the lead analyst at Unsurfaced/.test(job.items[0].system) && /^THE BRIEF \(the question this RECON answers\):[\s\S]*DECISIONS THE CLIENT MUST MAKE:\n1\. Who is the first wearer\?[\s\S]*THE RESEARCH PLAN \(our structure/.test(job.items[0].prompt) &&
  job.items[0].prompt.indexOf('THE RESEARCH PLAN') < job.items[0].prompt.indexOf('STATS (exact') && /C1 \| 2026-08-01 \| A \| read in full/.test(job.items[0].prompt) && patches.some(p => p.meta && p.meta.deep && p.meta.deep.stage === 'compiling') && !submitted.some(s => s.kind === 'house_recon'),
  'T1 a deep RECON at its compile is claimed (compile to compiling, written only if no one else did), then its first pass, the analysis, goes to the recon ledger: the brief with its decisions, the plan before the stats, the cards in the pack (EX18: never one compile)');
const cp = patches.find(p => p.stats && p.meta && p.meta.pack && !p.status), cq = patches.find(p => p.status === 'queued' && p.meta && p.meta.deep && p.meta.deep.stage === 'analysis');
ok(cp && cp.stats.recon.deep === true && cp.stats.recon.cards === 1 && cp.stats.recon.read_full === 3 && cp.stats.recon.comments.read === 84 && cp.meta.pack.plan && !/THE RESEARCH PLAN/.test(cp.meta.pack.text) && cp.meta.pack.ids.C === 1 &&
  cp.meta.pack.win && cp.meta.pack.outlet_types && cq && cq.meta.deep.think.analysis.sends === 1 && cq.meta.deep.think.analysis.batch_id === 'b1' && cq.meta.deep.tries.compile === 0 && tk.waiting >= 1,
  'T2 the compile writes STATS.recon with the deep counts, keeps the plan, the period and the counted kinds beside the pack (never ground), and the RECON waits on its analysis, still queued for the tick; a held RECON waits');
resetAll();
const lowRow = clone(crow); lowRow.meta.deep.budget_usd = 3; lowRow.meta.deep.spend = { plan: 1 };
fixtures = compileFx(); fixtures['house_reads?status=eq.queued'] = () => [clone(lowRow)];
const unD = quiet();
await R.readTick({}, { deep: true });
unD();
ok(!submitted.length && patches.some(p => p.meta && p.meta.deep && p.meta.deep.stage === 'hold' && p.meta.deep.hold_reason === 'budget' && p.meta.deep.held_from === 'compile'), 'T3 a compile that could not fit with its desk holds before a pack is built, for the desk to raise the ceiling');
resetAll(); seedCompile();
const estRow = clone(crow); estRow.meta.deep.budget_usd = 16;   // the floor fits ($1.60 spent and $13.60 kept); the four passes' own worst case does not
fixtures = compileFx(); fixtures['house_reads?status=eq.queued'] = () => [clone(estRow)];
estBoost = 3.5;
const unD2 = quiet();
const tkE = await R.readTick({}, { deep: true });
unD2();
estBoost = 0;
ok(!submitted.length && patches.some(p => p.meta && p.meta.deep && p.meta.deep.stage === 'hold' && p.meta.deep.held_from === 'compile' && p.meta.deep.compile_est > 14) && tkE.waiting >= 1,
  'T4 review: the ceiling is checked again on the worst case of all four passes over this evidence, with the copy desk after them, never a flat reserve');
resetAll();
const two = [clone(Object.assign({}, row, { id: 43, meta: Object.assign({}, row.meta, { deep: { stage: 'gather', budget_usd: 30, spend: {}, counts: {}, log: [], plan: clean, queue: { gathers: [{ text: 'a' }], done: 0 } } }) })),
  clone(Object.assign({}, row, { id: 44, meta: Object.assign({}, row.meta, { deep: { stage: 'gather', budget_usd: 30, spend: {}, counts: {}, log: [], plan: clean, queue: { gathers: [{ text: 'b' }], done: 0 } } }) }))];
fixtures = { 'house_reads?status=eq.queued': () => clone(two) };
const unE = quiet();
const tk2 = await R.readTick({}, { deep: true });
unE();
ok(gathers.length === 1 && gathers[0].q === 'a' && tk2.deep.length === 1 && tk2.deep[0].id === 43 && tk2.waiting >= 1, 'T5 one deep RECON with work to do advances a tick; the next waits its turn');
resetAll();
const pair = [clone(Object.assign({}, row, { id: 46, meta: Object.assign({}, row.meta, { deep: { stage: 'wait', budget_usd: 30, spend: {}, counts: {}, log: [], plan: clean, batched_at: new Date().toISOString() } }) })),
  clone(Object.assign({}, row, { id: 47, meta: Object.assign({}, row.meta, { deep: { stage: 'gather', budget_usd: 30, spend: {}, counts: {}, log: [], plan: clean, queue: { gathers: [{ text: 'c' }], done: 0 } } }) }))];
jobs = [{ read_id: 46, custom_id: 'rc-46-0', kind: 'recon_card', status: 'submitted', est_usd: 0.01, meta: { ord: 0 } }];
fixtures = { 'house_reads?status=eq.queued': () => clone(pair) };
const unE2 = quiet();
const tk3 = await R.readTick({}, { deep: true });
unE2();
ok(gathers.length === 1 && gathers[0].q === 'c' && tk3.deep.length === 2 && tk3.deep[0].idle && !tk3.deep[1].idle, 'T6 review: a RECON only waiting on its batches looks in without taking the tick\'s slot; a RECON with work advances the same tick');
resetAll();
fixtures = { 'house_reads?status=eq.queued': () => clone(two) };
const unE3 = quiet();
const tk4 = await R.readTick({});
unE3();
ok(!gathers.length && !tk4.deep && tk4.waiting === 2 && /out\.tick = await readTick\(env\);/.test(w), 'T7 review: the daily cadence and the record never move a deep RECON (they may overlap the half-hour tick); only the tick and the admin\'s collect do');
resetAll();
live['41'] = Object.assign(clone(row), { status: 'compiling', meta: Object.assign(clone(row.meta), { deep: { stage: 'compiled', budget_usd: 30, spend: {}, counts: {}, log: [] } }) });
const unF = quiet();
await R.readFail({}, 41, 'expired');
const f1 = clone(live['41']);
await R.readFail({}, 41, 'expired'); await R.readFail({}, 41, 'expired');
unF();
ok(f1.status === 'queued' && f1.meta.deep.stage === 'compile' && f1.meta.deep.compile_fails === 1 && /^compile_retry: expired/.test(f1.error) && live['41'].status === 'failed' && live['41'].meta.deep.stage === 'failed' && live['41'].meta.deep.failed_stage === 'compile',
  'T8 review: a compile batch that errored or expired is sent again from the same evidence (its research never paid twice), and the third time the RECON stops where the desk can release it');
resetAll(); seedCompile();
const stale = clone(crow); stale.meta.deep.stage = 'compiling'; stale.meta.deep.compiling_at = new Date(Date.now() - 20 * 60000).toISOString();
fixtures = compileFx(); fixtures['house_reads?status=eq.queued'] = () => [clone(stale)];
const unF2 = quiet();
const tk5 = await R.readTick({}, { deep: true });
unF2();
ok(tk5.submitted === 1 && patches.some(p => p.meta && p.meta.deep && p.meta.deep.stage === 'compile' && p.meta.deep.tries.compile === 1), 'T9 review: a compile claimed by a run that died is counted and taken again, never stuck');

// ── F: the second review (verifier's findings) ─────────────────────────
const T3 = R.deepNorm('Prices rose 15% in the quarter, the company said. It runs 350 venues across the country.');
ok(!R.deepQuoteFound(T3, '5% in the quarter, the company said') && !R.deepQuoteFound(T3, '50 venues across the country') && R.deepQuoteFound(T3, '15% in the quarter, the company said') && R.deepQuoteFound(T3, 'It runs 350 venues'),
  'F1 review 2: a quote never starts or ends inside a number: "5% in the quarter" is not in "15% in the quarter", nor "50 venues" in "350 venues"');
ok(/real story about smart glasses/.test(R.deepHtmlText('<html><body><svg-icon name="x"></svg-icon><article><p>' + 'The real story about smart glasses in schools, told at length for the reader. '.repeat(30) + '</p></article><footer><svg><path/></svg></footer></body></html>')),
  'F2 review 2: a custom element (<svg-icon>) is not the page\'s furniture: the article survives');
resetAll();
const rrw = clone(row); rrw.updated_at = 'v0'; rrw.meta.deep = { v: 1, stage: 'plan', budget_usd: 30, spend: {}, counts: {}, log: [] };
claudeAnswers = [{ ok: true, text: JSON.stringify(planJson), cost_usd: 0.9 }]; casLost = true;
const unY0 = quiet();
const rw = await R.deepAdvance({}, rrw, { ms: 0 });
unY0();
ok(!rw.busy && rrw.meta.deep.stage === 'search' && claudeCalls.length === 1, 'F3 review 2: a write that landed but whose answer was lost (a replayed request) is known as ours by the row\'s own stamp, never mistaken for another runner');
resetAll();
const rsr = clone(row); rsr.meta.deep = { v: 1, stage: 'read', budget_usd: 17.6, spend: { plan: 1 }, counts: {}, log: [], plan: clean };   // without the sent cards counted, 1 + 0.33 + 13.6 fits; with them, nothing more does
ev = seedRead(41, Array.from({ length: 30 }, (_, k) => ({ id: 100 + k, read_id: 41, kind: 'comments', ord: k, ref: null, payload: { items: mkItems(40, 'now') } }))).concat(Array.from({ length: 7 }, (_, k) => ({ id: 300 + k, read_id: 41, kind: 'source', ord: k, ref: 'https://s' + k + '.com/a', payload: Object.assign({}, src, { url: 'https://s' + k + '.com/a' }) }))); evId = 400;
jobs = Array.from({ length: 7 }, (_, k) => ({ read_id: 41, batch_id: 'bOLD', kind: 'recon_card', custom_id: 'rc-41-' + k, status: 'submitted', est_usd: 0.6, meta: { recon_read_id: 41, ord: k } }));
const unY1 = quiet();
await R.deepAdvance({}, rsr, { ms: 0 });
unY1();
ok(!submitted.some(s => s.kind === 'recon_card') && !submitted.some(s => s.kind === 'recon_labels'), 'F4 review 2: a resumed read stage counts the batches its earlier run already sent against the ceiling before it sizes the rest');
resetAll(); seedCompile();
const adopt = clone(crow); adopt.meta.pack = { text: 'ground', ids: { C: 1 } };
jobs = [{ read_id: 0, custom_id: 'hr-41-v1', kind: 'house_recon', batch_id: 'bSENT', status: 'submitted' }];
fixtures = compileFx(); fixtures['house_reads?status=eq.queued'] = () => [clone(adopt)]; fixtures['claude_jobs?custom_id=eq.hr-41-v1'] = () => clone(jobs);
const unY2 = quiet();
const tka = await R.readTick({}, { deep: true });
unY2();
ok(tka.submitted === 1 && !submitted.length && patches.some(p => p.status === 'compiling' && p.meta.batch_id === 'bSENT' && p.meta.deep.stage === 'compiled' && p.meta.deep.adopted === 'bSENT'),
  'F5 review 2: a compile a run that died already sent is adopted (it lands when the drain collects it), never paid for again');
resetAll(); seedCompile();
fixtures = compileFx(); fixtures['house_reads?status=eq.queued'] = () => [clone(crow)];
const unY3 = quiet();
await R.readTick({}, { deep: true });
unY3();
const iPre = patches.findIndex(p => p.meta && p.meta.pack && !p.status), iPost = patches.findIndex(p => p.status === 'queued' && p.meta && p.meta.deep && p.meta.deep.stage === 'analysis');
ok(iPre >= 0 && iPost > iPre && sb.findIndex(x => x.path.startsWith('claude_jobs?custom_id=eq.hr-41-v1')) >= 0 && /const sliceN = deep \? \(stats\.recon\.stories_all \|\| 0\)/.test(w),
  'F6 review 2: a deep compile writes its ground before it is paid for (so its first pass, or a compile sent before the passes, can be adopted), and its slice counts every story it stands on, pages read in full among them');
resetAll();
live['41'] = Object.assign(clone(row), { status: 'failed', error: 'expired' }); live['41'].meta.deep = { stage: 'compiled', budget_usd: 30, spend: { plan: 1 }, counts: {}, log: [] };
const unY4 = quiet();
const fr = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
unY4();
ok(fr.stage === 'compile' && patches.some(p => p.status === 'queued' && p.meta && p.meta.deep && p.meta.deep.stage === 'compile'), 'F7 review 2: a compile that failed before its row could say so (status failed, stage compiled) can still be released from its evidence');
ok(/carry\.deep = Object\.assign\(\{\}, dd, \{ budget_usd: ddBudget, stage: 'revising', lease: null \}\)/.test(w) && /revising: "A revision, from the same evidence"/.test(page) && /if \(Number\.isFinite\(readN\)\) vc\.read = readN;/.test(w) &&
  /readPackVoicesRefresh\(\(prior\.meta && prior\.meta\.pack\) \|\| null, \{ start: prior\.window_start, end: prior\.window_end \}, dEarly && dEarly\.comments \? dEarly\.comments\.read : null\)/.test(w),
  'F8 review 2: a revision says it is one in the library, and its ground carries the same comments-read figure as its stats');

// ── Q: the commission, the release, the revision ───────────────────────
resetAll();
fixtures = { 'house_reads?kind=eq.recon&select=meta': () => [], 'house_reads?kind=eq.recon&window_start': () => [], 'house_reads?select=*': (p, o) => [Object.assign({ id: 41, version: 1 }, o.body[0])] };
const q1 = await R.readRoute('/reads/commission', { brief: 'FIELD: smart glasses as a cultural object, who wears them and where a culture-first wearable enters.', end: '2026-10-05', budget: 500,
  decisions: ['Who is FIELD\'s first wearer?', 'Audio-only glasses now, or wait for a camera shell?', 'x', 12345678, { evil: 'object' }, 'What must Capture never do to be welcome in a room?', 'Which frames and which store make it credible?', 'A sixth decision is one too many', 'A seventh'],
  audience: 'blind and low-vision <b>wearers</b> who rely on audio description every day', competitors: ['Meta Ray-Ban', 'Xreal', '', 7], hold: true }, {}, '', { id: 'admin', email: 'fresco@x.com' });
const qins = sb.find(x => x.opts && x.opts.method === 'POST' && /house_reads\?select=\*/.test(x.path)).opts.body[0];
const aud = qins.meta.brief.frame.audience;
ok(q1.ok && q1.waiting === 'tick' && q1.deep.budget_usd === 100 && q1.deep.hold === true && q1.deep.decisions === 5 && qins.meta.deep.stage === 'plan' && qins.meta.deep.budget_usd === 100 && qins.meta.deep.by === 'fresco' &&
  qins.meta.brief.decisions.length === 5 && !qins.meta.brief.decisions.includes('x') && !qins.meta.brief.decisions.some(d => /12345678|object/.test(d)) && aud.length <= 40 && /^blind and low-vision bwearers\/b who/.test(aud) && !/\s$/.test(aud) && 'blind and low-vision bwearers/b who rely on audio description every day'.startsWith(aud) &&
  qins.meta.brief.frame.competitors.join() === 'Meta Ray-Ban,Xreal',
  'Q1 review: a commission is deep by default: up to five decisions in the client\'s own words (a stub, a number or an object is dropped: they would be ground), the audience cut at a word as the frame keeps it, the competitors as named, the ceiling clamped, the hold kept');
resetAll();
fixtures = { 'house_reads?kind=eq.recon&select=meta': () => [], 'house_reads?kind=eq.recon&window_start': () => [], 'house_reads?select=*': (p, o) => [Object.assign({ id: 45, version: 1 }, o.body[0])] };
await R.readRoute('/reads/commission', { brief: 'A brief about smart glasses with a budget of nothing at all.', budget: 0 }, {}, '', { id: 'admin' });
const zins = sb.find(x => x.opts && x.opts.method === 'POST' && /house_reads\?select=\*/.test(x.path)).opts.body[0];
await R.readRoute('/reads/commission', { brief: 'A shallow brief about oat milk for the old path.', deep: false }, {}, '', { id: 'admin' });
const sins = sb.filter(x => x.opts && x.opts.method === 'POST' && /house_reads\?select=\*/.test(x.path))[1].opts.body[0];
ok(zins.meta.deep.budget_usd === 20 && !sins.meta.deep && !sins.meta.brief.decisions, 'Q2 review: a budget of zero is the least a RECON can do ($20), never the default; deep:false keeps the shallow path');
resetAll();
const hrow = clone(crow); hrow.meta.deep = Object.assign(hrow.meta.deep, { stage: 'hold', hold_reason: 'budget', held_from: 'read', budget_usd: 20, spend: { plan: 19.8 }, hold: true });
live['41'] = Object.assign(clone(hrow), { status: 'queued' }); jobs = [{ read_id: 41, kind: 'recon_plan', status: 'done', cost_usd: 19.8 }];   // the release reads the receipt back from the jobs
const q3 = await R.readRoute('/reads/release', { id: 41, budget: 1 }, {}, '', { id: 'admin' });
const q4 = await R.readRoute('/reads/release', { id: 41, budget: 40 }, {}, '', { id: 'admin', email: 'fresco@x.com' });
ok(q3.error === 'budget_too_low' && q4.ok && q4.stage === 'read' && q4.budget === 40 && q4.waiting === 'tick' && live['41'].meta.deep.stage === 'read' && live['41'].meta.deep.budget_usd === 40 && live['41'].meta.deep.hold === true && live['41'].meta.deep.released_by === 'fresco',
  'Q3 review: a RECON held at its ceiling takes a larger budget and resumes the stage it stopped at, the client\'s own hold for the evidence file still standing; a budget that still would not fit is refused');
resetAll();
live['41'] = Object.assign(clone(crow), { status: 'queued' }); live['41'].meta.deep = Object.assign(live['41'].meta.deep, { stage: 'hold', hold_reason: 'evidence', held_from: 'evidence', budget_usd: 30, spend: { plan: 27 }, hold: true });
jobs = [{ read_id: 41, kind: 'recon_plan', status: 'done', cost_usd: 27 }];
const q5 = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
seedCompile(); fixtures = compileFx();
const unQ = quiet();
const q6 = await R.readRoute('/reads/release', { id: 41, budget: 45 }, {}, '', { id: 'admin' });
unQ();
ok(q5.error === 'budget_too_low' && q5.need === 13.6 && q6.stage === 'compile' && q6.ok && submitted.some(s => s.kind === 'recon_analysis') && live['41'].meta.deep.hold === false,
  'Q4 review: releasing an evidence file compiles at once only if the passes and the desk fit the ceiling; it is claimed like the tick\'s, and its analysis goes');
resetAll();
live['41'] = Object.assign(clone(row), { status: 'failed', error: 'deep_read:read_submit_claude_400' }); live['41'].meta.deep = { stage: 'failed', failed_stage: 'read', budget_usd: 30, spend: { plan: 1 }, tries: { read: 3 }, counts: {}, log: [] };
const q7 = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
ok(q7.ok && q7.stage === 'read' && live['41'].status === 'queued' && live['41'].meta.deep.stage === 'read' && live['41'].meta.deep.tries.read === 0 && !live['41'].meta.deep.failed_stage,
  'Q5 review: a RECON stopped at a stage can be released to run that stage again, its tries cleared, inside its ceiling');
fixtures = { 'house_reads?id=eq.41': () => [Object.assign(clone(crow), { meta: Object.assign({}, crow.meta, { deep: Object.assign({}, crow.meta.deep, { stage: 'gather' }) }) })] };
ok((await R.readRoute('/reads/release', { id: 99 }, {}, '', { id: 'admin' })).error === 'not_found' && (await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'x' }))._status === 403 && /case '\/reads\/release':/.test(w),
  'Q6 only a held or stopped RECON is released; admin only; the door is dispatched');
resetAll();
live['41'] = Object.assign(clone(row), { status: 'ready', read: { title: 't', thesis: 'x' } }); live['41'].meta = Object.assign(live['41'].meta, { notes: [{ n: 1, text: 'fix', status: 'open' }], deep: { stage: 'compiled', budget_usd: 10, spend: { plan: 2, compile_v1: 4, desk_v1: 0.5, cards: 1 }, counts: {}, log: [] } });
fixtures = { 'house_desk?': () => [] };
const q8 = await R.readRoute('/reads/revise', { id: 41 }, {}, '', { id: 'admin' });
ok(q8.error === 'budget_too_low' && q8.spent === 7.5 && !sb.some(x => x.opts && x.opts.method === 'POST' && /house_reads\?select=\*/.test(x.path)) &&
  /'compile_v' \+ row\.version\]: Number\(cost\) \|\| 0, \['desk_v' \+ row\.version\]/.test(w) && /a revision is paid inside the commission's ceiling too/.test(w),
  'Q7 review: a revision of a deep RECON is paid inside its ceiling (the research, every compile and desk before it, each landing on the receipt by version); one that would not fit is refused before a row is queued');

// ── Z: migration, page, gate, Method ───────────────────────────────────
ok(/create function public\.match_signals_span\(\s*p_query\s+vector\(384\),\s*p_count\s+int default 24,\s*p_since\s+timestamptz default null,\s*p_until\s+timestamptz default null,\s*p_min_tier\s+int default 4,\s*p_territory text default null\s*\)/.test(mig) &&
  /drop function if exists public\.match_signals_span\(vector, int, timestamptz, timestamptz, int, text\);/.test(mig) && /with win as materialized \(/.test(mig) && /perform set_config\('hnsw\.ef_search', '1000', true\);/.test(mig) && /order by \(s\.embedding <=> p_query\) \+ 0/.test(mig) && /union all/.test(mig) &&
  /create index if not exists signals_when_idx on public\.signals \(\(coalesce\(published_at, captured_at\)\)\);/.test(mig) && /edition_item_id bigint, similarity float/.test(mig) && /s\.status <> 'rejected'/.test(mig) && /to service_role;/.test(mig) && /from public, anon, authenticated;/.test(mig),
  'Z1 review: 0037 searches a period by filtering first and ranking exactly (a date index serves it), the years before through the vector index looking wider, and says which rows DAILY published; service role only');
ok(/create table if not exists public\.recon_evidence/.test(mig) && /references public\.house_reads\(id\) on delete cascade/.test(mig) && /check \(kind in \('lake', 'record', 'web', 'voice', 'source', 'card', 'comments', 'labels', 'video'\)\)/.test(mig) &&
  /revoke all on public\.recon_evidence from anon, authenticated;/.test(mig) && /check \(tier in \('doc', 'ingest', 'live', 'frame', 'facts', 'recon'\)\)/.test(mig) && !/—/.test(mig),
  'Z2 0037: the evidence store (the voice pass step by step among it), its rows leaving with their read, service role only; the Claude ledger accepts the recon tier');
ok(/var IDK = .*"SLRTDXVC" : "SLRTDXV";/.test(page) && /if \(r\.kind === "card"\) return "read in full";/.test(page) && /function deepShow\(row\)/.test(page) && /el\.className = "noprint"/.test(page) && /call\("\/reads\/release", body\)\.then\([\s\S]{0,900}\.catch\(function \(\) \{ back\(/.test(page) &&
  /deepStageLabel\(\{ stage: r\.deep_stage, hold_reason: r\.deep_hold, waiting: r\.deep_waiting \}\)/.test(page) && /\[\[allS, "Stories"\], \[readFull, "Read in full"\], \[deepC\.read, "Comments read"\], \[win\.days, "Days"\]\]/.test(page) && /if \(!RT\) deepShow\(row\);/.test(page),
  'Z3 review: the page: C ids are sources only where the read has them; the evidence file is on screen only, and its release button never hangs; the library shows the stage and any wait; a deep RECON\'s cover carries what it read in full');
ok(/<div class="two rp-two-charts"/.test(page) && /\.rp-two-charts \{ break-inside: avoid;/.test(page) && /'<div class="rp-chart"><div class="kicker">What the comments raised<\/div>'/.test(page) && /'<div class="rp-chart"><div class="kicker">Who covered it, by kind of outlet<\/div>'/.test(page) &&
  /var themesOk = deepC && deepC\.by_theme && deepC\.on_subject, kindsOk = deepC && cs\.outlet_types/.test(page) && /\(r\[1\] > 0 \? Math\.max\(3, Math\.round\(r\[1\] \/ mx \* 100\)\) : 0\)/.test(page) && /function rpPl\(n, one, many\)/.test(page) &&
  /un \? " " \+ rpPl\(un, "story", "stories"\) \+ " from outlets not yet sorted are not shown\." : " A kind at zero is a silence\."/.test(page),
  'Z4 review: the deep charts carry their captions in the chart style and print on one page; each stands on its own data; a zero draws no bar; a count of one is singular; a zero is a silence only when every outlet was sorted');
const statOk = new Function(page.slice(page.indexOf('  function rpStatOk('), page.indexOf('  /* SEAM:READ_DEEP: the kinds of outlet, in reader words')) + '; return rpStatOk;')();
ok(statOk('recon.comments.read', true) && statOk('recon.comments.by_theme_pct.privacy', true) && statOk('recon.outlet_types.trade', true) && statOk('recon.read_full', true) && statOk('recon.stories_all', true) &&
  !statOk('recon.sub_questions', true) && !statOk('recon.hypotheses', true) && !statOk('recon.comments.sources', true) && !statOk('recon.comments.now', true) && !statOk('recon.videos.likes', true),
  'Z5 review: the numbers page prints a deep count only with a reader\'s label, and never the plan\'s own counts');
ok(/deep_stage:meta->deep->>stage,deep_hold:meta->deep->>hold_reason,deep_waiting:meta->deep->>waiting/.test(w) && ['deepEmbed', 'deepPlanStage', 'deepReadStage', 'deepOutletTypes', 'deepExtract', 'fieldRail'].every(n => new RegExp("'" + n + "': '").test(gate)),
  'Z6 the library reads a deep RECON\'s stage and any wait; every spender is registered with its guard');
ok(/THE DEEP LAW: this RECON was researched to a plan\./.test(R.READ_DEEP_LAW) && /its ids never appear in the read/.test(R.READ_DEEP_LAW) && /\(SQ<n>\)/.test(R.READ_DEEP_LAW) && /a hypothesis is never written as a finding/.test(R.READ_DEEP_LAW) &&
  /A figure from a C line is quoted as the source wrote it and cited to that C id\./.test(R.READ_DEEP_LAW) && /only when STATS\.recon\.outlet_types_unclassified is absent is a kind at zero a silence the read may name/.test(R.READ_DEEP_LAW) &&
  /naming the decision in words \(never opening a sentence on a numeral\)/.test(R.READ_DEEP_LAW) && /one posted after the period is counted apart/.test(R.READ_DEEP_LAW) && !/—/.test(R.READ_DEEP_LAW),
  'Z7 review: the deep law: the plan is structure, never evidence; every hypothesis ends supported, broken or open; a card\'s figure is quoted as written; a silence only when every outlet was sorted; the decisions answered in order and in words');

console.log('\nproof_read_deep: ' + pass + ' checks PASS');
