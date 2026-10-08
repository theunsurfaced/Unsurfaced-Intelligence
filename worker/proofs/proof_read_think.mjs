/**
 * proof_read_think.mjs  --  EX18 THE THINK: four passes, the new sections, the drawings (SEAM:READ_THINK).
 * Runs the shipped read engine and the shipped Claude lane on fakes. Run from the repo root: node worker/proofs/proof_read_think.mjs
 *   A  the passes, the prompts, the contract          B  the ceiling over the passes        C  a pass's answer
 *   D  the compile sends the analysis                 E  the pass stages: wait, send, adopt, resend, stop, hold
 *   F  the tick                                       G  a failed editor's pass, the release  H  the landing and the drawings
 *   I  the laws: exemptions, the think contract, the editor's notes, the sell law
 *   J  revisions and releases                         K  the receipt                         Z  page, seams, gate, migration
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const quiet = () => { const o = console.log; console.log = () => {}; return () => { console.log = o; }; };
const clone = o => JSON.parse(JSON.stringify(o));

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
let sb = [], fixtures = {}, ev = [], patches = [], submitted = [], jobs = [], jobId = 0, aiCalls = [], puts = [], landed = [];
let submitRefuse = null, estBoost = 0, rowVer = 0, aiFail = false, onPatch = null;
const live = {};
const resetAll = () => { sb = []; fixtures = {}; ev = []; patches = []; submitted = []; jobs = []; jobId = 0; aiCalls = []; puts = []; landed = []; submitRefuse = null; estBoost = 0; aiFail = false; onPatch = null; for (const k of Object.keys(live)) delete live[k]; };
const addJob = (o) => { const j = Object.assign({ id: ++jobId, created_at: new Date(Date.now() + jobId).toISOString() }, o); jobs.push(j); return j; };
const sbRest = async (env, path, opts) => {
  sb.push({ path, opts });
  if (path.startsWith('recon_evidence')) {
    const q = path.split('?')[1] || '', rid = /read_id=eq\.(\d+)/.exec(q), kinds = /kind=in\.\(([^)]*)\)/.exec(q);
    const match = r => (!rid || r.read_id === +rid[1]) && (!kinds || kinds[1].split(',').includes(r.kind));
    if (opts && opts.method === 'DELETE') { ev = ev.filter(r => !match(r)); return null; }
    if (opts && opts.method === 'POST') { for (const r of opts.body) ev.push(clone(r)); return null; }
    return ev.filter(match).map(clone);
  }
  const cj = /^claude_jobs\?custom_id=eq\.([\w-]+)&kind=eq\.(\w+)/.exec(path);
  if (cj) {
    const st = /status=in\.\(([^)]*)\)/.exec(path);
    return jobs.filter(j => j.custom_id === cj[1] && j.kind === cj[2] && (!st || st[1].split(',').includes(j.status))).sort((a, b) => b.id - a.id).slice(0, 12).map(clone);
  }
  if (path.startsWith('claude_jobs?meta->>recon_read_id=eq.')) {
    const rid = +/recon_read_id=eq\.(\d+)/.exec(path)[1], kinds = /kind=in\.\(([^)]*)\)/.exec(path);
    return jobs.filter(j => j.meta && j.meta.recon_read_id === rid && (!kinds || kinds[1].split(',').includes(j.kind))).map(clone);
  }
  const rr = /^house_reads\?id=eq\.(\d+)&select=\*$/.exec(path);
  if (rr) return live[rr[1]] ? [clone(live[rr[1]])] : [];
  const look = /^house_reads\?id=eq\.(\d+)&select=updated_at$/.exec(path);
  if (look) return live[look[1]] ? [{ updated_at: live[look[1]].updated_at }] : [];
  const pr = /^house_reads\?id=eq\.(\d+)/.exec(path);
  if (pr && opts && opts.method === 'PATCH') {
    patches.push(clone(opts.body));
    if (live[pr[1]]) Object.assign(live[pr[1]], clone(opts.body));
    if (onPatch) { const f = onPatch; onPatch = null; f(); }   // something that happens while this write is in flight (the drain, say)
    return /select=id,updated_at/.test(path) ? [{ id: +pr[1], updated_at: opts.body.updated_at || ('2026-10-06T00:00:00.' + String(++rowVer).padStart(6, '0') + 'Z') }] : null;
  }
  for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts);
  return [];
};
const callClaude = async () => ({ ok: false, error: 'no_answer' });   // the copy desk's live calls: it never blocks a landing
const claudeBatchSubmit = async (env, tier, kind, items) => {
  if (submitRefuse) return { ok: false, error: submitRefuse };
  submitted.push({ tier, kind, items: clone(items) }); const id = 'b' + submitted.length;
  for (const it of items) addJob({ batch_id: id, kind, custom_id: it.custom_id, status: 'submitted', est_usd: 1, meta: clone(it.meta || {}) });
  return { ok: true, batch_id: id, n: items.length, est_usd: 1 };
};
const estFn = (p, b) => L.claudeEstimate(p, b) + estBoost;
const sha = async s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(16).padStart(16, '0'); };
const CONFIG = { IMAGE_MODEL: '@cf/black-forest-labs/flux-1-schnell' };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'excFrameFor', 'gatherOpenSignals', 'lakeCapture', 'excTerritoryOf', 'sha256hex', 'RAILS', 'RAIL_FNS', 'excFrameLabel', 'railFetch',
  'callClaude', 'claudeEstimate', 'claudeParams', 'KB_EMBED_MODEL', 'BGE_QUERY_PREFIX', 'RAIL_BY_ID', 'fetch', 'CONFIG', 'CLAUDE',
  trim + pmj + ej + frameClean + voiceSrc + block + '; return { READ_DEEP, READ_THINK, READ_DEEP_LAW, READ_THINK_CONTRACT, READ_WRITER_LAW, READ_EDITOR_LAW, DEEP_ANALYST_SYS, DEEP_STRATEGIST_SYS, DEEP_THINK_KEY, READ_METHOD, READ_CONTRACT, DEEP_STAGE, DEEP_SPENDS, ' +
  'deepThinkCid, deepThinkReads, deepThinkSystem, deepThinkChain, deepThinkEvidence, deepThinkPrompt, deepThinkReq, deepThinkOut, deepThinkUsable, deepThinkRestore, deepThinkLaws, deepDraftNotesOf, deepBrandNames, deepImageRisk, deepRenderPrompt, deepRenders, deepJobsSpend, ' +
  'deepAdvance, deepCompile, readTick, readFail, readLand, readValidate, readSellable, readStyle, readRoute, readSubmitRevision, readReportExtraIds };')(
  sbRest, claudeBatchSubmit, async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async () => null, async () => ({ ok: true, items: [], rails: [] }), async () => 0, () => 'technology-innovation', sha, [], {}, () => '', async () => null,
  callClaude, estFn, L.claudeParams, '@cf/baai/bge-small-en-v1.5', 'Represent this sentence for searching relevant passages: ', {}, async () => ({ ok: false }), CONFIG, L.CLAUDE);
const T = R.READ_THINK, D = R.READ_DEEP;

// ── a RECON at its passes ──────────────────────────────────────────────
const frame = { entity: 'FIELD', category: 'smart glasses', audience: 'early adopters', market: 'US', competitors: ['Meta Ray-Ban', 'Snap Spectacles'], question: 'Who is wearing smart glasses?',
  anchors: ['smart glasses', 'wearable'], exclude: [], queries: {} };
const plan = { question: 'Where does a culture-first wearable enter?', sub_questions: [{ id: 'SQ1', ask: 'Who wears them?', lake: ['x'] }, { id: 'SQ2', ask: 'Who refuses them?', lake: ['y'] }],
  hypotheses: [{ id: 'HYP1', q: 'SQ1', claim: 'Wellness buyers lead.', proves: 'p', breaks: 'b' }, { id: 'HYP2', q: 'SQ2', claim: 'Venues decide.', proves: 'p', breaks: 'b' }], segments: [], decisions: [{ n: 1, decision: 'Who is the first wearer?', q: ['SQ1'] }, { n: 2, decision: 'Audio now or camera later?', q: ['SQ2'] }], themes: ['privacy', 'price', 'style'] };
const packText = 'LAKE (2):\nL1 | 2026-08-02 | Verge | tier 1 | Meta sold 2 million pairs of glasses, double the year before\nL2 | 2026-08-09 | Wired | tier 1 | Venues in London banned the glasses at 14 theaters\n' +
  'SOURCES READ IN FULL (1 evidence cards):\nC1 | 2026-08-01 | A | read in full | news | SQ1 | TITLE: Glasses | FIGURES: 15%: "Prices rose 15% in the quarter."';
const pack = { text: packText, plan: 'THE RESEARCH PLAN (our structure for this RECON, never evidence; its ids, SQ<n> and HYP<n>, never appear in the read):\nSQ1: Who wears them?', desk: 'Say wearers, never users.',
  ids: { L: ['m1', 'm2'], C: 1, V: 0 }, lines: { L: [{ title: 'Meta sold 2 million pairs', source_name: 'Verge', published_at: '2026-08-02', url: 'https://verge.com/m' }, { title: 'Venues banned the glasses', source_name: 'Wired', published_at: '2026-08-09', url: 'https://wired.com/v' }],
    C: [{ title: 'Glasses', outlet: 'A', url: 'https://a.com/1', tier: 1, published_at: '2026-08-01', q: ['SQ1'], kind: 'news', breaks: false, figures: 1 }] }, voices: { quotes: [] }, win: { start: '2026-07-08', end: '2026-10-05' } };
const stats = { lake: { signals: 500, outlets: 60, by_territory: {}, shape: {}, prior_comparable: false }, recon: { deep: true, stories_all: 40, outlets: 12, read_full: 3, cards: 1 }, window: { days: 90 } };
const baseRow = (stage, deepX) => ({ id: 41, kind: 'recon', status: 'queued', version: 1, window_start: '2026-07-08', window_end: '2026-10-05', label: 'RECON 001: FIELD, smart glasses', pack_ids: [], stats: clone(stats), updated_at: '2026-10-06T00:00:00.000001Z',
  meta: { plan: 'recon', recon_no: 1, brief: { text: 'FIELD: smart glasses as a cultural object.', hash: 'h1', frame, days: 90, decisions: ['Who is the first wearer?', 'Audio now or camera later?'] }, pack: clone(pack),
    deep: Object.assign({ v: 1, stage, budget_usd: 30, spend: { plan: 1, cards: 0.6 }, counts: {}, log: [], plan, tries: {} }, deepX || {}) } });
const analysisOut = { answer: 'Wearers lead where they can hear.', hypotheses: [{ id: 'HYP1', verdict: 'broken', why: 'w', evidence: ['C1'] }, { id: 'HYP2', verdict: 'supported', why: 'w', evidence: ['L2'] }],
  decisions: [{ n: 1, answer: 'a', why: 'w', confidence: 'medium', would_change: 'x', evidence: ['L1'] }], findings: [{ claim: 'People buy audio first.', figures: [{ figure: '2 million', from: 'L1' }], evidence: ['L1', 'C1'] }],
  segments: [], market: { how_it_works: 'h', drivers: [], unknowns: 'u' }, competitors: [], tensions: [], silences: 's', gaps: 'g' };
const strategyOut = { position: 'p', decisions: [{ n: 1, recommendation: 'r' }], futures: [{ name: 'a' }, { name: 'b' }, { name: 'c' }], concept_territories: [{ name: 't', image_prompt: 'p' }], product_concepts: [], plan_90: { phases: [] }, moves: [] };
const finding = { name: 'People buy audio first', dek: 'd', what_the_data_shows: 'Meta sold 2 million pairs.', what_happened: 'w', why_it_matters: 'y', means: { culture: 'c', category: 'c', consumer: 'c' }, advantage: 'a', against: { line: 'l', evidence: ['L2'] },
  reach: 'category', horizon: 'now', voices: [], evidence: ['L1', 'L2'], confidence: 'medium', strength: 'pattern', moves: { creative: 'c', marketer: 'm', founder: 'f', exec: 'e', talent: 't' }, trigger: 't' };
const fullRead = () => ({ title: 'Wearers lead with their ears', subtitle: 's', thesis: 'The answer is audio.', brief_answer: 'Start with audio.', ground_line: 'g', executive_summary: [{ line: 'x', evidence: ['L1'] }], findings: [clone(finding)],
  for_the_brief: { who_is_in: 'i', who_is_absent: 'a', where_to_enter: 'e', evidence: ['L1'] },
  decisions: [{ n: 1, decision: 'Who is the first wearer?', answer: 'Audio-first wearers.', why: 'w', confidence: 'medium', would_change: 'If 30% of returns cite the camera.', evidence: ['L1'] }, { n: 2, decision: 'Audio now or camera later?', answer: 'Audio now.', why: 'w', confidence: 'high', would_change: 'w', evidence: ['C1'] }],
  hypotheses: [{ claim: 'Wellness buyers lead.', verdict: 'broken', line: 'l', evidence: ['C1'] }, { claim: 'Venues decide.', verdict: 'supported', line: 'l', evidence: ['L2'] }],
  market_model: { line: 'l', drivers: [{ name: 'Price', figure: '15%', line: 'l', evidence: ['C1'] }], unknowns: 'u' }, competitive_map: [{ name: 'Meta Ray-Ban', position: 'p', likely_move: 'm', answer: 'a', evidence: ['L1'] }],
  futures: [{ name: 'Audio wins', kind: 'expected', story: 's', signposts: ['Returns under 10% by spring'], move: 'm', evidence: [] }, { name: 'Cameras win', kind: 'faster', story: 's', signposts: [], move: 'm' }, { name: 'Nobody wins', kind: 'stalled', story: 's', signposts: [], move: 'm' }],
  concept_territories: [{ name: 'Heard not seen', idea: 'i', why_now: 'w', audience: 'a', tone: 't', image_prompt: 'A FIELD wearer at a Meta Ray-Ban counter, a field at dusk, warm light.', evidence: ['L1'] }, { name: 'Second', idea: 'i', image_prompt: '', evidence: [] }],
  product_concepts: [{ name: 'Audio frames', what: 'w', for_whom: 'f', job: 'j', proof: 'p', risk: 'r', first_test: 'Sell 200 pairs in 30 days.', evidence: ['C1'] }],
  plan_90: { line: 'l', phases: [{ window: 'Days 1 to 30', moves: ['Recruit 40 wearers (research lead)'], measure: 'm' }, { window: 'Days 31 to 60', moves: ['m'], measure: 'm' }, { window: 'Days 61 to 90', moves: ['m'], measure: 'm' }] } });
const env0 = { AI: { run: async (model, inp) => { aiCalls.push({ model, inp }); if (aiFail) throw new Error('ai down'); return { image: Buffer.from('jpegbytes').toString('base64') }; } }, MEDIA: { put: async (k, b, o) => { puts.push({ k, n: b.length, o }); } } };
const fx = () => ({ 'editions?status=eq.published': () => [], 'house_desk?': () => [] });

// ── A: the passes, the prompts, the contract ───────────────────────────
ok(T.ORDER.join() === 'analysis,strategy,write,edit' && T.PASS.analysis.kind === 'recon_analysis' && T.PASS.strategy.kind === 'recon_strategy' && T.PASS.write.kind === 'recon_write' && T.PASS.edit.kind === 'house_recon' && T.PASS.edit.cid === 'hr' &&
  T.MODEL === 'claude-fable-5-1' && L.CLAUDE.TIERS.recon.models.includes(T.MODEL) && T.PASS.write.max_tokens <= L.CLAUDE.MAX_TOKENS && T.PASS.edit.max_tokens <= L.CLAUDE.MAX_TOKENS && Object.values(T.PASS).every(p => p.effort === 'high'),
  'A1 four Fable passes on the recon ledger: the analyst, the strategist, the writer, the editor; the editor\'s is a house_recon job, so the drain lands it like any compile');
const r0 = baseRow('analysis');
ok(R.deepThinkCid(r0, 'analysis') === 'ra-41-v1' && R.deepThinkCid(r0, 'strategy') === 'rs-41-v1' && R.deepThinkCid(r0, 'write') === 'rw-41-v1' && R.deepThinkCid(r0, 'edit') === 'hr-41-v1' &&
  R.deepThinkCid(Object.assign({}, r0, { id: 77, version: 3 }), 'write') === 'rw-77-v3' && R.deepThinkReads('analysis').length === 0 && R.deepThinkReads('write').join() === 'analysis,strategy' && R.deepThinkReads('edit').join() === 'write',
  'A2 each pass has one custom id a row and version (a revision is its own); the strategist reads the analysis, the writer both, the editor the draft');
const sysA = R.deepThinkSystem('analysis'), sysS = R.deepThinkSystem('strategy'), sysW = R.deepThinkSystem('write'), sysE = R.deepThinkSystem('edit');
ok(sysA.startsWith(R.DEEP_ANALYST_SYS) && sysA.endsWith(R.DEEP_THINK_KEY) && !sysA.includes(R.READ_METHOD) && sysS.startsWith(R.DEEP_STRATEGIST_SYS) &&
  sysW.startsWith(R.READ_METHOD) && sysW.includes(R.READ_CONTRACT.recon) && sysW.includes(R.READ_DEEP_LAW) && sysW.includes(R.READ_THINK_CONTRACT) && sysW.endsWith(R.READ_WRITER_LAW) && sysE.endsWith(R.READ_EDITOR_LAW) && !sysE.includes(R.READ_WRITER_LAW),
  'A3 the analyst and the strategist work from the evidence key, not the house style; the writer and the editor write under the Method, the RECON contract, the deep law and the think contract');
const allPrompts = [R.DEEP_ANALYST_SYS, R.DEEP_STRATEGIST_SYS, R.DEEP_THINK_KEY, R.READ_THINK_CONTRACT, R.READ_WRITER_LAW, R.READ_EDITOR_LAW];
ok(allPrompts.every(p => !/—|–/.test(p)) && ['"decisions"', '"hypotheses"', '"market_model"', '"competitive_map"', '"futures"', '"concept_territories"', '"product_concepts"', '"plan_90"'].every(k => R.READ_THINK_CONTRACT.includes(k)) &&
  /exactly 3 objects \{"name": 3 to 6 words, "kind": "expected", "faster" or "stalled"/.test(R.READ_THINK_CONTRACT) && /never a figure of your own arithmetic/.test(R.READ_THINK_CONTRACT) && /never a year or a figure the evidence does not give/.test(R.READ_THINK_CONTRACT) &&
  /no text, no logos, no brand or product names, no real or famous people, no real place, and no screen, sign or packaging/.test(R.READ_THINK_CONTRACT) && /The page prints the data appendix from STATS itself; never write one\./.test(R.READ_THINK_CONTRACT) &&
  /plan_90\.line among them, comes from STATS/.test(R.READ_THINK_CONTRACT) && /these keys join the report's keys, brief_answer and for_the_brief, and the object has exactly all of them/.test(R.READ_THINK_CONTRACT),
  'A4 the think contract asks for the decisions, what was tested, the market (never our own arithmetic), the response map, three futures (time in words), concept territories with an illustrator\'s brief (no text, logos, brands or real people), product concepts and a 90-day plan; no em dash anywhere');
ok(/never compute, convert or round a figure of your own/.test(R.DEEP_ANALYST_SYS) && /Weigh the counter-evidence the plan searched for before anything else/.test(R.DEEP_ANALYST_SYS) && /supported when at least two sources from different outlets carry it, and open otherwise/.test(R.DEEP_ANALYST_SYS) &&
  /the groups the brief might miss among them/.test(R.DEEP_STRATEGIST_SYS) && /targets and thresholds appear only in signposts, first_test and plan_90/.test(R.DEEP_STRATEGIST_SYS) && /never evidence themselves/.test(R.READ_WRITER_LAW) && /never repeats the decisions/.test(R.READ_WRITER_LAW) &&
  /Fix every note/.test(R.READ_EDITOR_LAW) && /never add a figure the evidence does not give\. Return the whole edited object\./.test(R.READ_EDITOR_LAW) && /in the decisions key when the contract asks for one, otherwise in where_to_enter/.test(R.READ_DEEP_LAW),
  'A5 the analyst copies figures and weighs what would break the plan first; the strategist serves the people the brief might miss and keeps targets out of the facts; the writer treats the thinking as thinking; the editor fixes every note and adds no figure');
ok(/"findings": 5 to 8 objects \{"claim"/.test(R.DEEP_ANALYST_SYS) && /"findings": 5 to 8 objects/.test(R.READ_CONTRACT.recon) && /\{"finding": its claim, word for word, "creative"/.test(R.DEEP_STRATEGIST_SYS) && /each names the finding it serves/.test(R.READ_WRITER_LAW) &&
  /its segments feed for_the_brief/.test(R.READ_WRITER_LAW) && /its gaps feed method\.limits/.test(R.READ_WRITER_LAW) && /the strategy\'s risk shapes would_change/.test(R.READ_WRITER_LAW) && /where_to_enter is one paragraph/.test(R.READ_WRITER_LAW) &&
  [R.DEEP_ANALYST_SYS, R.DEEP_STRATEGIST_SYS].every(p => /name a source by its outlet and date, never by its id/.test(p)) && [R.DEEP_ANALYST_SYS, R.DEEP_STRATEGIST_SYS, R.READ_WRITER_LAW].every(p => /en dash/.test(p)) &&
  /its targets and thresholds, where the contract allows them, are ours/.test(R.READ_EDITOR_LAW) && /finding_downgraded/.test(R.READ_EDITOR_LAW) && /house_voice/.test(R.READ_EDITOR_LAW) && /a brand, a real person or place, or a sign, screen, label or anything bearing words/.test(R.READ_EDITOR_LAW) && /every proper name in it lower case or gone/.test(R.READ_EDITOR_LAW) &&
  /never a real place, a famous person, a screen, a sign, packaging or anything bearing words or a mark/.test(R.DEEP_STRATEGIST_SYS) && /coded by us wherever our coding came back \(comments\.coded; a shared headline is never coded/.test(R.READ_DEEP_LAW),
  'A7 review: the passes agree: five to eight findings, moves named by the finding they serve, every part of the analysis given a home, sources named by outlet in prose, no en dash, an editor allowed its targets and told every note, comments read and coded counted apart');
ok(R.DEEP_STAGE.analysis && R.DEEP_STAGE.strategy && R.DEEP_STAGE.write && !R.DEEP_STAGE.edit && R.DEEP_SPENDS.analysis && R.DEEP_SPENDS.strategy && R.DEEP_SPENDS.write && D.BUDGET_MIN === 20 && D.COMPILE_RESERVE === 13,
  'A6 the passes are stages of the machine (the editor\'s lands through the drain); their spend is read back after each; a commission starts at $20');

// ── B: the ceiling over the passes ─────────────────────────────────────
const full = D.PACK.CHARS + 40000;
const chain = R.deepThinkChain('analysis', full, {}), fromW = R.deepThinkChain('write', full, {}), fromE = R.deepThinkChain('edit', full, {}), known = R.deepThinkChain('write', full, { analysis: 20000, strategy: 20000 });
ok(chain > fromW && fromW > fromE && fromE > 0 && known < fromW && chain <= D.COMPILE_RESERVE && chain > 10,
  'B1 the worst case of the passes still to come, at their real input when it exists: the four on a full pack ($' + chain.toFixed(2) + ') fit inside the reserve the read stage keeps ($' + D.COMPILE_RESERVE + ')');

// ── C: a pass's answer ─────────────────────────────────────────────────
ok(R.deepThinkOut('analysis', { status: 'done', result: JSON.stringify(analysisOut) }) && !R.deepThinkOut('analysis', { status: 'done', result: JSON.stringify(analysisOut), stop_reason: 'max_tokens' }) &&
  !R.deepThinkOut('analysis', { status: 'done', result: '{"answer":"x"}' }) && !R.deepThinkOut('analysis', { status: 'failed' }) && !R.deepThinkOut('write', { status: 'done', result: '{"title":"t","findings":[]}' }) &&
  R.deepThinkOut('write', { status: 'done', result: '```json\n' + JSON.stringify(fullRead()) + '\n```' }) && R.deepThinkOut('strategy', { status: 'done', result: JSON.stringify(strategyOut) }) && !R.deepThinkOut('strategy', { status: 'done', result: '[1]' }),
  'C1 a pass\'s answer counts only when it is done, whole (never cut at its ceiling) and one object carrying what the next pass needs');

// ── D: the compile sends the analysis ──────────────────────────────────
resetAll();
{ const row = baseRow('compile'); delete row.meta.pack; row.stats = null;
  const lakeRows = Array.from({ length: 15 }, (_, k) => ({ read_id: 41, kind: 'lake', ord: k, ref: 'x' + k, payload: { id: 'x' + k, title: 'Smart glasses line ' + k, source_name: 'O' + k, source_tier: 2, published_at: '2026-08-1' + (k % 9), url: 'https://o' + k + '.com/a', qs: ['SQ1'], sim: 0.7 } }));
  ev = lakeRows.concat([{ read_id: 41, kind: 'card', ord: 0, ref: 'https://a.com/1', payload: { url: 'https://a.com/1', title: 'Glasses', outlet: 'A', tier: 1, published_at: '2026-08-01', relevant: true, kind: 'news', q: ['SQ1'], claims: [{ claim: 'Prices rose.', quote: 'Prices rose 15% in the quarter.', h: 'HYP1', stance: 'breaks' }], figures: [{ figure: '15%', quote: 'Prices rose 15% in the quarter.' }] } }]);
  fixtures = Object.assign(fx(), { 'house_reads?status=eq.queued': () => [clone(row)], 'rpc/house_report_stats': () => ({ lake: { signals: 500, outlets: 60, by_territory: {} }, themes: [], window: { days: 90 } }),
    'editions?': () => [], 'edition_items?': () => [], 'signals?status=neq.rejected': () => [], 'door_reads?': () => [], 'reads?created_at': () => [], 'house_desk?': () => [{ kind: 'all', inputs: 'Say wearers, never users.' }] });
  const un = quiet(); const tk = await R.readTick({}, { deep: true }); un();
  const a = submitted.find(s => s.kind === 'recon_analysis'), it = a && a.items[0];
  const ground = patches.find(p => p.meta && p.meta.pack && !p.status), q = patches.find(p => p.status === 'queued' && p.meta && p.meta.deep && p.meta.deep.stage === 'analysis');
  ok(tk.submitted === 1 && submitted.length === 1 && it && it.custom_id === 'ra-41-v1' && it.model === T.MODEL && it.max_tokens === 64000 && it.thinking.type === 'adaptive' && it.output_config.effort === 'high' && it.meta.recon_read_id === 41 && it.meta.pass === 'analysis' && !it.meta.house_read_id &&
    /^THE BRIEF \(the question this RECON answers\):/.test(it.prompt) && /HOUSE DESK[\s\S]*Say wearers, never users\./.test(it.prompt) && /C1 \| 2026-08-01 \| A \| read in full/.test(it.prompt) && /Write the analysis for RECON 001/.test(it.prompt),
    'D1 the compile sends the first pass, the analysis, on the recon ledger: the brief, the desk\'s inputs, the plan, STATS and the pack; nothing else is sent');
  ok(ground && ground.meta.pack.desk === 'Say wearers, never users.' && q && q.meta.deep.think.analysis.sends === 1 && q.meta.deep.think.analysis.batch_id === 'b1' && q.meta.deep.log.slice(-1)[0].to === 'analysis' && patches.indexOf(ground) < patches.indexOf(q),
    'D2 the ground (the desk\'s inputs as they stood among it) is written before the pass is paid for; the RECON waits on its analysis, still queued for the tick, the pass on its log');
  const rowNow = Object.assign(baseRow('analysis'), { stats: ground.stats, pack_ids: ground.pack_ids }); rowNow.meta.pack = ground.meta.pack;
  const evA = await R.deepThinkEvidence({}, rowNow), evB = await R.deepThinkEvidence({}, rowNow);
  ok(evA === evB && it.prompt.startsWith(evA) && it.prompt.length === evA.length + R.deepThinkPrompt('analysis', rowNow, '', {}).length,
    'D3 every pass reads the same evidence, rebuilt from the ground the compile wrote');
}
resetAll();
{ const row = baseRow('compile'); delete row.meta.pack;
  addJob({ batch_id: 'bRA', kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'submitted', meta: { recon_read_id: 41 } });
  row.meta.pack = clone(pack);
  live['41'] = clone(row);
  fixtures = fx();
  const un = quiet(); const r = await R.deepCompile({}, clone(row)); un();
  ok(r.ok && r.adopted && !submitted.length && live['41'].meta.deep.stage === 'analysis' && live['41'].meta.deep.think.analysis.adopted === true && live['41'].status === 'queued',
    'D4 review: an analysis a run that died already sent is adopted at the compile, never paid for again');
}

// ── E: the pass stages ─────────────────────────────────────────────────
const advance = async (row, extra) => { const un = quiet(); try { return await R.deepAdvance(Object.assign({}, env0, extra || {}), row, { ms: 0 }); } finally { un(); } };
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { think: { analysis: { sends: 1 } } });
  addJob({ batch_id: 'b0', kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'submitted', est_usd: 2.1, meta: { recon_read_id: 41, pass: 'analysis' } });
  const a = await advance(row);
  ok(a.idle && !submitted.length && row.meta.deep.stage === 'analysis' && row.meta.deep.waiting === 'pass_analysis' && (row.meta.deep.tries.analysis || 0) === 0 && row.meta.deep.spend.inflight === 2.1,
    'E1 a pass in the batch is waited on, idle (the tick\'s slot goes to work), its reservation on the receipt');
  jobs[0].status = 'done'; jobs[0].result = JSON.stringify(analysisOut); jobs[0].cost_usd = 1.2;
  const b = await advance(row);
  const s = submitted[0], sit = s && s.items[0];
  ok(!b.idle && s && s.kind === 'recon_strategy' && sit.custom_id === 'rs-41-v1' && sit.system.startsWith(R.DEEP_STRATEGIST_SYS) && /THE ANALYSIS \(our analyst's, from this evidence; our thinking, never evidence\):\n\{"answer":"Wearers lead/.test(sit.prompt) && /Write the strategy for/.test(sit.prompt) &&
    row.meta.deep.stage === 'strategy' && row.meta.deep.think.strategy.sends === 1 && row.meta.deep.spend.analysis === 1.2 && row.meta.deep.spend.inflight === 1,
    'E2 the analysis back, the strategy goes at once with the analysis beside the evidence; the analysis lands on the receipt as it cost');
  jobs[1].status = 'done'; jobs[1].result = JSON.stringify(strategyOut); jobs[1].cost_usd = 1.3;
  await advance(row);
  const wj = submitted[1], wit = wj && wj.items[0];
  ok(wj && wj.kind === 'recon_write' && wit.custom_id === 'rw-41-v1' && wit.system.endsWith(R.READ_WRITER_LAW) && wit.max_tokens === 120000 && wit.prompt.indexOf('THE ANALYSIS') < wit.prompt.indexOf('THE STRATEGY') && /Write the RECON RECON 001: FIELD, smart glasses \(2026-07-08 to 2026-10-05\), answering the brief\./.test(wit.prompt) &&
    row.meta.deep.stage === 'write' && row.meta.deep.spend.strategy === 1.3,
    'E3 the strategy back, the writer goes with the evidence, the analysis and the strategy, under the Method and every law');
  const draft = fullRead(); draft.findings[0].what_the_data_shows = 'Meta sold 2 million pairs, up 41% on the year.'; draft.thesis = 'HYP2 holds: venues decide.'; draft.decisions = draft.decisions.slice(0, 1); delete draft.findings[0].advantage;
  jobs[2].status = 'done'; jobs[2].result = JSON.stringify(draft); jobs[2].cost_usd = 2.2;
  await advance(row);
  const ej = submitted[2], eit = ej && ej.items[0], notes = (eit && eit.prompt.split("THE LAWS' NOTES")[1]) || '';
  ok(ej && ej.kind === 'house_recon' && eit.custom_id === 'hr-41-v1' && eit.meta.house_read_id === 41 && eit.meta.recon_read_id === 41 && eit.system.endsWith(R.READ_EDITOR_LAW) && /THE DRAFT \(the RECON as our writer wrote it; the object you edit\):\n\{"title":"Wearers lead/.test(eit.prompt) &&
    /number_not_in_evidence:findings\[0\]\.what_the_data_shows:41\n/.test(notes) && /voices:0_of_2/.test(notes) && !/style:opener:findings\[0\]\.supports|style:[^\n]*\.figure/.test(notes) && /plan_id_in_prose:thesis:HYP2/.test(notes) && /think:decisions:1_of_2/.test(notes) && /finding_1:edge/.test(notes) && /think:image_prompt_names:concept_territories\[0\]:FIELD/.test(notes) &&
    !/em_dashes_replaced/.test(notes) && !/number_not_in_evidence:[^\n]*(?:plan_90|signposts|would_change|first_test|image_prompt)/.test(notes),
    'E4 the draft back, our laws read it as the landing would and the editor gets the draft and every note: a figure in no line, a plan id in prose, a decision unanswered, a finding without its edge, a brand in an image brief (never a target or a threshold)');
  ok(row.status === 'compiling' && row.meta.batch_id === 'b3' && row.meta.deep.stage === 'compiled' && row.meta.deep.think.edit.notes >= 5 && row.meta.deep.spend.write === 2.2 && row.meta.deep.spend.inflight === 1,
    'E5 the editor\'s pass makes the RECON compiling with its batch, as every compile; the drain lands it');
}
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { think: { analysis: { sends: 1 } } });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'failed', meta: { recon_read_id: 41 } });
  await advance(row);
  ok(submitted.length === 1 && submitted[0].kind === 'recon_analysis' && submitted[0].items[0].max_tokens === 64000 && row.meta.deep.think.analysis.sends === 2 && row.meta.deep.stage === 'analysis' && row.status === 'queued',
    'E6 a pass that failed or expired is sent again from the same evidence');
  jobs[jobs.length - 1].status = 'done'; jobs[jobs.length - 1].result = JSON.stringify(analysisOut); jobs[jobs.length - 1].stop_reason = 'max_tokens';
  await advance(row);
  ok(submitted.length === 2 && submitted[1].kind === 'recon_analysis' && submitted[1].items[0].max_tokens === 128000 && submitted[1].items[0].output_config.effort === 'high' && row.meta.deep.think.analysis.sends === 3 &&
    R.deepThinkReq('write', row, 'p', true).max_tokens === 128000 && R.deepThinkReq('write', row, 'p', true).output_config.effort === 'medium' && R.deepThinkReq('write', row, 'p', false).output_config.effort === 'high',
    'E7 review: a pass cut at its token ceiling is asked again with room (128,000); the writer, already near the model\'s ceiling, is asked to think less instead');
  jobs[jobs.length - 1].status = 'failed';
  await advance(row);
  ok(submitted.length === 2 && row.status === 'failed' && row.meta.deep.stage === 'failed' && row.meta.deep.failed_stage === 'analysis' && /^deep_analysis:analysis_failed/.test(row.error),
    'E8 a pass sent all its times stops the RECON at once, plainly, where the desk can release it');
}
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { think: { analysis: { sends: 1 } } });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'done', result: '{"answer":"x","findings":[]}', meta: { recon_read_id: 41 } });
  await advance(row);
  ok(submitted.length === 1 && submitted[0].kind === 'recon_analysis' && row.meta.deep.think.analysis.sends === 2, 'E9 an answer the next pass cannot use (no findings) is asked for again');
}
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { think: { analysis: { sends: 1 } } });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'done', result: JSON.stringify(analysisOut), meta: { recon_read_id: 41 } });
  addJob({ batch_id: 'bRS', kind: 'recon_strategy', custom_id: 'rs-41-v1', status: 'submitted', meta: { recon_read_id: 41 } });
  await advance(row);
  ok(!submitted.length && row.meta.deep.stage === 'strategy' && row.meta.deep.think.strategy.adopted === true && row.meta.deep.think.strategy.batch_id === 'bRS',
    'E10 review: a pass a run that died already sent is adopted, never sent twice');
}
resetAll(); fixtures = fx();
{ const row = baseRow('write', { think: { write: { sends: 1 } } }); live['41'] = clone(row);
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  addJob({ batch_id: 'bHR', kind: 'house_recon', custom_id: 'hr-41-v1', status: 'done', result: JSON.stringify(fullRead()), cost_usd: 2.5, stop_reason: 'end_turn', meta: { recon_read_id: 41, house_read_id: 41 } });
  await advance(row);
  ok(!submitted.length && row.meta.deep.stage === 'compiled' && row.meta.batch_id === 'bHR' && live['41'].status === 'ready' && live['41'].read && live['41'].read.title === 'Wearers lead with their ears' && live['41'].meta.deep.spend.compile_v1 === 2.5,
    'E11 review: an editor\'s pass already back when a run died is adopted and lands at once; nothing is paid twice');
}
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { budget_usd: 20, spend: { plan: 1, cards: 10, inflight: 2.1 }, think: { analysis: { sends: 1 } } });   // the analysis still at its reservation on the row
  addJob({ kind: 'recon_plan', status: 'done', cost_usd: 1, meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_card', status: 'done', cost_usd: 10, meta: { recon_read_id: 41 } });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'done', result: JSON.stringify(analysisOut), cost_usd: 1.2, meta: { recon_read_id: 41 } });
  await advance(row);
  ok(!submitted.length && row.meta.deep.stage === 'hold' && row.meta.deep.hold_reason === 'budget' && row.meta.deep.held_from === 'analysis' && row.meta.deep.think_need > 8 && row.meta.deep.spend.inflight === 0 && row.meta.deep.spend.analysis === 1.2,
    'E12 the next pass goes only if it fits the ceiling (the passes before read back at their price) with every pass after it and the desk; otherwise the RECON holds where it stood, the room it needs on the row');
  const roomy = baseRow('analysis', { budget_usd: Math.round((12.2 + row.meta.deep.think_need + 0.05) * 100) / 100, spend: { plan: 1, cards: 10, inflight: 2.1 }, think: { analysis: { sends: 1 } } });   // fits at the analysis's price, not at its reservation
  await advance(roomy);
  ok(submitted.length === 1 && roomy.meta.deep.stage === 'strategy', 'E13 review: a pass just back counts at its price, not its reservation, so a tight ceiling that fits is never held');
  submitted = []; jobs = jobs.filter(j => j.kind !== 'recon_strategy');
  live['41'] = Object.assign(clone(row), { status: 'queued' });
  const r1 = await R.readRoute('/reads/release', { id: 41, budget: 20 }, {}, '', { id: 'admin' });
  const r2 = await R.readRoute('/reads/release', { id: 41, budget: 30 }, {}, '', { id: 'admin' });
  ok(r1.error === 'budget_too_low' && r1.need === row.meta.deep.think_need && r2.ok && r2.stage === 'analysis' && live['41'].meta.deep.stage === 'analysis' && live['41'].meta.deep.budget_usd === 30,
    'E14 a pass held at the ceiling is released only with the room it named, and resumes where it stood');
  const rr = clone(live['41']);
  await advance(rr);
  ok(submitted.length === 1 && submitted[0].kind === 'recon_strategy' && rr.meta.deep.stage === 'strategy', 'E15 released, the next pass goes on the next tick');
}
resetAll(); fixtures = fx();
{ const row = baseRow('analysis', { think: { analysis: { sends: 1 } } });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'done', result: JSON.stringify(analysisOut), meta: { recon_read_id: 41 } });
  submitRefuse = 'claude_cap';
  const a = await advance(row);
  ok(a.idle && row.meta.deep.stage === 'analysis' && row.meta.deep.waiting === 'ledger_cap' && (row.meta.deep.tries.analysis || 0) === 0 && row.status === 'queued', 'E16 a ledger at its monthly cap is waited out, never counted as a failure');
}
resetAll(); fixtures = fx();
{ const row = baseRow('strategy', { think: { strategy: { sends: 1 } } });
  addJob({ kind: 'recon_strategy', custom_id: 'rs-41-v1', status: 'failed', meta: { recon_read_id: 41 } });
  await advance(row);
  const back = row.meta.deep.stage === 'analysis' && !submitted.length;
  await advance(row);
  ok(back && submitted.length === 1 && submitted[0].kind === 'recon_analysis' && row.meta.deep.stage === 'analysis', 'E17 a pass whose input is gone goes back to the pass that writes it');
}

resetAll(); fixtures = fx();
{ const row = baseRow('write', { think: { write: { sends: 1 }, edit: { sends: 1 } } }); live['41'] = clone(row);
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  const hj = addJob({ batch_id: 'bHR', kind: 'house_recon', custom_id: 'hr-41-v1', status: 'submitted', meta: { recon_read_id: 41, house_read_id: 41 } });
  onPatch = () => { onPatch = () => { Object.assign(hj, { status: 'done', result: JSON.stringify(fullRead()), cost_usd: 2.4, stop_reason: 'end_turn' }); }; };   // the drain ends it while the tick writes the row (and finds it queued)
  await advance(row);
  ok(!submitted.length && live['41'].status === 'ready' && live['41'].read && live['41'].read.title === 'Wearers lead with their ears' && live['41'].meta.deep.spend.compile_v1 === 2.4,
    'E12b review: an editor\'s pass adopted while still out, and finished by the drain before the row said compiling, is landed by the tick, never left stuck');
}

resetAll(); fixtures = fx();
{ const row = baseRow('write', { think: { write: { sends: 1 }, edit: { sends: 1 } } }); live['41'] = clone(row);
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  const hj = addJob({ batch_id: 'bHR', kind: 'house_recon', custom_id: 'hr-41-v1', status: 'submitted', meta: { recon_read_id: 41, house_read_id: 41 } });
  onPatch = () => { onPatch = () => { Object.assign(hj, { status: 'done', result: JSON.stringify(fullRead()), cost_usd: 2.4, stop_reason: 'end_turn', ended_at: new Date(Date.now() + 60000).toISOString() }); }; };   // the drain ends it after the row said compiling: the drain lands it
  await advance(row);
  ok(!submitted.length && live['41'].status === 'compiling' && !live['41'].read, 'E12c review: an adopted editor\'s pass the drain finished after the row said compiling is left to the drain, never landed twice');
}

// ── F: the tick ────────────────────────────────────────────────────────
resetAll();
{ const a = baseRow('analysis', { think: { analysis: { sends: 1 } } }), b = Object.assign(baseRow('gather', { queue: { gathers: [{ text: 'g' }], done: 0 } }), { id: 42 }), c = Object.assign(baseRow('write', { think: { write: { sends: 1 } } }), { id: 43 });
  addJob({ kind: 'recon_analysis', custom_id: 'ra-41-v1', status: 'submitted', meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_write', custom_id: 'rw-43-v1', status: 'submitted', meta: { recon_read_id: 43 } });
  fixtures = Object.assign(fx(), { 'house_reads?status=eq.queued': () => [clone(b), clone(a), clone(c)] });
  const un = quiet(); const tk = await R.readTick(env0, { deep: true }); un();
  ok(tk.deep && tk.deep.length === 3 && tk.deep.find(x => x.id === 42 && !x.idle) && tk.deep.filter(x => x.idle).length === 2 && tk.waiting === 3,
    'F1 a RECON whose pass is in the batch looks in every tick without taking the slot of a RECON with work');
}

// ── G: a failed editor's pass ──────────────────────────────────────────
resetAll(); fixtures = fx();
{ live['41'] = Object.assign(baseRow('compiled', { think: { write: { sends: 1 }, edit: { sends: 1 } } }), { status: 'compiling' });
  const un = quiet(); await R.readFail({}, 41, 'expired'); const f1 = clone(live['41']); await R.readFail({}, 41, 'expired'); await R.readFail({}, 41, 'expired'); un();
  ok(f1.status === 'queued' && f1.meta.deep.stage === 'write' && f1.meta.deep.compile_fails === 1 && live['41'].status === 'failed' && live['41'].meta.deep.failed_stage === 'write',
    'G1 an editor\'s pass that errored or expired is sent again from the writer\'s stage (the analysis, the strategy and the draft never paid twice); the third time the RECON stops there');
  const rel = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
  ok(rel.ok && rel.stage === 'write' && live['41'].status === 'queued' && live['41'].meta.deep.think.write.sends === 0 && live['41'].meta.deep.compile_fails === 0, 'G2 released, the writer\'s stage runs again with its sends cleared');
  const rw = clone(live['41']);
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  addJob({ kind: 'house_recon', custom_id: 'hr-41-v1', status: 'failed', meta: { recon_read_id: 41, house_read_id: 41 } });
  await advance(rw);
  ok(submitted.length === 1 && submitted[0].kind === 'house_recon' && rw.status === 'compiling' && rw.meta.deep.stage === 'compiled', 'G3 at the writer\'s stage a failed editor\'s pass is never adopted: it is sent again from the draft');
  live['41'] = Object.assign(baseRow('compiled', { think: { edit: { sends: 1 } } }), { status: 'failed', error: 'x' });
  const rel2 = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
  ok(rel2.ok && rel2.stage === 'write', 'G4 review: a RECON written in passes whose last pass failed before its row could say so is released at the writer\'s stage, never a fresh compile');
}

resetAll(); fixtures = fx();
{ live['41'] = Object.assign(baseRow('compiled', { budget_usd: 28, think: { write: { sends: 1 }, edit: { sends: 1 } }, compile_fails: 2, spend: { plan: 1, cards: 10, analysis: 2, strategy: 3, write: 6.5, inflight: 3.9 } }), { status: 'compiling' });
  addJob({ kind: 'recon_plan', status: 'done', cost_usd: 1, meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_card', status: 'done', cost_usd: 10, meta: { recon_read_id: 41 } });
  addJob({ kind: 'recon_analysis', status: 'done', cost_usd: 2, meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_strategy', status: 'done', cost_usd: 3, meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_write', status: 'done', cost_usd: 6.5, meta: { recon_read_id: 41 } });
  addJob({ kind: 'house_recon', custom_id: 'hr-41-v1', status: 'failed', est_usd: 3.9, meta: { recon_read_id: 41, house_read_id: 41 } });
  const un = quiet(); await R.readFail({}, 41, 'expired'); un();
  const f = clone(live['41']);
  const rel = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
  ok(f.status === 'failed' && f.meta.deep.stage === 'failed' && f.meta.deep.failed_stage === 'write' && f.meta.deep.spend.inflight === 0 && rel.ok && rel.stage === 'write' && live['41'].status === 'queued',
    'G5 review: an editor\'s pass that failed leaves the receipt (no longer reserved), so a release with room is never refused: $22.50 spent and $4.60 needed fit in $28');
  live['41'].status = 'failed'; live['41'].meta.deep = Object.assign(live['41'].meta.deep, { stage: 'failed', failed_stage: 'write', spend: Object.assign({}, live['41'].meta.deep.spend, { inflight: 3.9 }) });
  const rel2 = await R.readRoute('/reads/release', { id: 41 }, {}, '', { id: 'admin' });
  ok(rel2.ok && rel2.stage === 'write', 'G6 review: a release reads the receipt back from the jobs before it weighs the ceiling, so a reservation left on the row never refuses it');
}

// ── H: the landing and the drawings ────────────────────────────────────
resetAll(); fixtures = fx();
{ live['41'] = Object.assign(baseRow('compiled', { think: { edit: { sends: 1 } }, spend: { plan: 1, inflight: 2.5 } }), { status: 'compiling' });
  addJob({ kind: 'house_recon', custom_id: 'hr-41-v1', status: 'done', cost_usd: 2.5, meta: { recon_read_id: 41, house_read_id: 41 } });
  const un = quiet(); const out = await R.readLand(env0, 41, JSON.stringify(fullRead()), 2.5, 'end_turn'); un();
  const x = live['41'];
  ok(out.status === 'ready' && x.read.decisions.length === 2 && x.read.plan_90.phases.length === 3 && x.meta.deep.spend.compile_v1 === 2.5 && x.meta.deep.spend.inflight === 0 && typeof x.meta.deep.spend.desk_v1 === 'number',
    'H1 the editor\'s read lands as any compile (the copy desk after it); the receipt reads the passes back, nothing left reserved');
  ok(aiCalls.length === 1 && aiCalls[0].model === CONFIG.IMAGE_MODEL && !/FIELD|Meta|Ray-Ban|brand/.test(aiCalls[0].inp.prompt.split('. ')[1] || '') && /A wearer at a counter, a field at dusk, warm light\./.test(aiCalls[0].inp.prompt) &&
    /^Editorial illustration for a cultural research report, an imagined scene: anonymous people, plain unmarked objects and blank surfaces/.test(aiCalls[0].inp.prompt) && /there is no writing, signage, screen, packaging, logo or brand mark anywhere, and no real or famous person or place\.$/.test(aiCalls[0].inp.prompt) &&
    puts.length === 1 && /^reads\/renders\/[0-9a-f]{32}\.jpg$/.test(puts[0].k) && puts[0].o.httpMetadata.contentType === 'image/jpeg' && x.meta.renders.list.length === 2 && x.meta.renders.list[0].key === puts[0].k && x.meta.renders.list[1] === null && x.meta.renders.version === 1,
    'H2 the concept territories are drawn after the landing: the brief\'s own brands taken out of the brief (FIELD, never "a field"), no text, logos or real people, kept under a key no one can guess, one place a territory');
  const un2 = quiet(); x.status = 'compiling'; await R.readLand(env0, 41, JSON.stringify(fullRead()), 2.5, 'end_turn'); un2();
  ok(aiCalls.length === 1 && live['41'].meta.renders.list[0].key === puts[0].k, 'H3 a brief already drawn for this RECON is never drawn again');
}
resetAll(); fixtures = fx();
{ live['41'] = Object.assign(baseRow('compiled', { think: { edit: { sends: 1 } } }), { status: 'compiling' });
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  aiFail = true;
  const un = quiet(); const out = await R.readLand(env0, 41, '{"title": "cut off mid', 3.1, 'max_tokens'); un();
  ok(out.status === 'ready' && live['41'].read.title === 'Wearers lead with their ears' && live['41'].violations.includes('think:edit_truncated:the_draft_landed') && live['41'].meta.renders.list.every(x => x === null) && aiCalls.length === 1,
    'H4 an editor\'s answer cut short never loses the draft: the writer\'s lands, noted for the desk; a drawing that fails never holds the read');
}
resetAll(); fixtures = fx();
{ live['41'] = Object.assign(baseRow('compiled', { think: { edit: { sends: 1 } } }), { status: 'compiling' });
  addJob({ kind: 'recon_write', custom_id: 'rw-41-v1', status: 'done', result: JSON.stringify(fullRead()), meta: { recon_read_id: 41 } });
  const un = quiet(); const out = await R.readLand(env0, 41, JSON.stringify({ read: fullRead() }), 3.1, 'end_turn'); un();
  ok(out.status === 'ready' && live['41'].read.title === 'Wearers lead with their ears' && live['41'].violations.includes('think:edit_unusable:the_draft_landed'),
    'H6 review: an editor\'s answer that is JSON but no read (a wrapped object, no title) never lands: the draft does, noted');
  const thin = fullRead(); delete thin.decisions; thin.findings = thin.findings.slice(0, 1); thin.futures = []; thin.title = 'Tightened title';
  live['41'].status = 'compiling'; delete live['41'].read;
  const un2 = quiet(); await R.readLand(env0, 41, JSON.stringify(thin), 3.1, 'end_turn'); un2();
  const x = live['41'];
  ok(x.read.title === 'Tightened title' && x.read.decisions.length === 2 && x.read.futures.length === 3 && x.violations.includes('think:edit_dropped:decisions:the_draft_kept') && x.violations.includes('think:edit_dropped:futures:the_draft_kept') && !x.violations.some(n => /edit_dropped:findings/.test(n)),
    'H7 review: an editor that drops a section the contract asks for gets the writer\'s back, named for the desk; what it tightened stands');
  const r1 = R.deepThinkRestore({ title: 't', cross_currents: [] }, { title: 'x', cross_currents: [{ thread: 'a' }], plan_90: { line: 'l' } });
  ok(r1.read.title === 't' && r1.read.cross_currents.length === 0 && r1.read.plan_90.line === 'l' && r1.back.join() === 'plan_90', 'H8 the editor may still cut what the contract leaves optional (the cross-currents)');
}
resetAll(); fixtures = fx();
{ const rv = Object.assign(baseRow('revising', { think: { edit: { sends: 1 } } }), { id: 50, version: 2, status: 'compiling' });
  rv.meta.plan = 'revise'; rv.meta.revised_from = 41; rv.meta.renders = { version: 1, list: [{ i: 0, h: 'old', key: 'reads/renders/old.jpg' }] }; live['50'] = rv;
  aiFail = true;
  const swapped = fullRead(); swapped.concept_territories = [{ name: 'New idea', image_prompt: 'A quiet library at noon.' }, swapped.concept_territories[0]];
  const un = quiet(); await R.readLand(env0, 50, JSON.stringify(swapped), 1.9, 'end_turn'); un();
  const rl = live['50'].meta.renders;
  ok(rl.version === 2 && rl.list.length === 2 && rl.list.every(x => x === null) && !JSON.stringify(rl).includes('old.jpg'),
    'H9 review: a revision that rewrites or reorders its territories never shows an old drawing under a new idea; drawings are each version\'s own');
}

resetAll(); fixtures = fx();
{ const rv = Object.assign(baseRow('revising', { think: { edit: { sends: 1 } }, spend: { plan: 1, cards: 0.6, analysis: 1.2, strategy: 1.3, write: 2.2, compile_v1: 2.5 } }), { id: 50, version: 2, status: 'compiling' });
  rv.meta.plan = 'revise'; rv.meta.revised_from = 41; live['50'] = rv;
  const un = quiet(); await R.readLand(env0, 50, JSON.stringify(fullRead()), 1.9, 'end_turn'); un();
  const sp = live['50'].meta.deep.spend;
  ok(sp.plan === 1 && sp.analysis === 1.2 && sp.write === 2.2 && sp.compile_v1 === 2.5 && sp.compile_v2 === 1.9 && !submitted.length,
    'H5 review: a revision lands on the receipt it carried (its row has no passes of its own, so nothing is read back as zero)');
}

// ── I: the laws ────────────────────────────────────────────────────────
{ const row = baseRow('compiled', { think: {} });
  const ground = JSON.stringify(stats) + '\n' + packText;
  const v = R.readValidate('recon', fullRead(), ground, [], R.readReportExtraIds(pack));
  const lined = fullRead(); lined.plan_90.line = 'Win the 7,300 wearers first.'; lined.plan_90.phases[0].window = 'Days 1\u201330';
  const vl = R.readValidate('recon', lined, ground, [], R.readReportExtraIds(pack));
  const vr = R.readValidate('recon', { title: 't', thesis: 'Prices rose 15%\u201320% and $10\u2013$20 from Q1\u2013Q2, Paris\u2013London \u2013 a long way.' }, '15 20 10 20 1 2', [], []);
  ok(!v.fatal.length && vl.fatal.some(f => /^number_not_in_evidence:plan_90\.line:7,300/.test(f)) && vl.read.plan_90.phases[0].window === 'Days 1 to 30' && vl.notes.some(n => /^em_dashes_replaced:1/.test(n)) &&
    vr.read.thesis === 'Prices rose 15% to 20% and $10 to $20 from Q1 to Q2, Paris to London, a long way.',
    'I1 review: a target or a threshold is not a fact (a plan\'s phases, a signpost, what would change a decision, a first test, an illustrator\'s brief), but the plan\'s own line is held to the evidence; an en dash in a range reads "to"');
  const vs = R.readValidate('recon', Object.assign(fullRead(), { decisions: [Object.assign(fullRead().decisions[0], { evidence: 'C1' })], futures: [Object.assign(fullRead().futures[0], { evidence: { id: 'L1' } })] }), ground, [], R.readReportExtraIds(pack));
  ok(Array.isArray(vs.read.decisions[0].evidence) && vs.read.decisions[0].evidence.join() === 'C1' && Array.isArray(vs.read.futures[0].evidence) && !vs.read.futures[0].evidence.length && vs.notes.some(n => /^evidence_ids_dropped:1/.test(n)),
    'I1b review: a lone id where a list belongs becomes a list of one; anything else is no list (the page reads lists)');
  const bad = fullRead(); bad.market_model.drivers[0].figure = '38%'; bad.futures[0].story = 'By 2028 the category doubles.';
  const vb = R.readValidate('recon', bad, ground, [], R.readReportExtraIds(pack));
  ok(vb.fatal.some(f => /^number_not_in_evidence:market_model\.drivers\[0\]\.figure:38$/.test(f)) && vb.fatal.some(f => /^number_not_in_evidence:futures\[0\]\.story:2028/.test(f)),
    'I2 every other number in the new sections is the evidence\'s: a market figure no line gives, or a year in a future, holds the read');
  const n0 = R.deepThinkLaws(fullRead(), row);
  const thin = fullRead(); thin.decisions = [thin.decisions[0]]; thin.hypotheses = [{ claim: 'x', verdict: 'maybe' }]; thin.futures = thin.futures.slice(0, 2); delete thin.product_concepts; thin.plan_90.phases = thin.plan_90.phases.slice(0, 2);
  const n1 = R.deepThinkLaws(thin, row);
  ok(n0.length === 1 && n0[0] === 'think:image_prompt_names:concept_territories[0]:FIELD' && ['think:decisions:1_of_2', 'think:hypotheses:0_of_2', 'think:futures:2_of_3', 'think:missing:product_concepts', 'think:plan_90_phases:2_of_3'].every(k => n1.includes(k)) &&
    R.deepBrandNames({ frame }).map(b => b.name).join() === 'FIELD,Meta Ray-Ban,Snap Spectacles' && !R.deepBrandNames({ frame }).some(b => b.rx.test('a field at dusk')) && R.deepBrandNames({ frame }).some(b => b.rx.test('a meta ray-ban counter')) &&
    R.deepBrandNames({ frame }, { words: true }).map(b => b.name).join() === 'FIELD,Meta Ray-Ban,Snap Spectacles,Meta,Ray-Ban,Snap,Spectacles' && !R.deepBrandNames({ frame }, { words: true }).some(b => b.rx.test('a woman in round spectacles, a snap of the fingers')) &&
    R.deepBrandNames({ frame }, { words: true }).some(b => b.rx.test('a Field pair')) && R.deepBrandNames({ frame: { entity: 'Glow', competitors: ['The Ordinary'] } }, { words: true }).every(b => !b.rx.test('an ordinary shelf with a soft glow')) &&
    !/Ray-Ban|Snap|Meta|FIELD/i.test(R.deepRenderPrompt({ image_prompt: 'Ray-Ban Meta frames beside a Snap kiosk, a FIELD pair.' }, { frame }).replace(/^[^.]*\. /, '').replace(/ Every surface[\s\S]*$/, '')),
    R.deepRenderPrompt({ image_prompt: 'Taylor Swift on stage, warm light.' }, { frame }) === '' && R.deepRenderPrompt({ image_prompt: 'Rihanna in Paris at dusk.' }, { frame }) === '' && R.deepRenderPrompt({ image_prompt: 'A man holds a phone.' }, { frame }) === '' &&
    R.deepRenderPrompt({ image_prompt: 'A FIELD-branded pair on a cafe table. Warm amber light.' }, { frame }).includes('A branded pair on a cafe table. Warm amber light.') && R.deepImageRisk('Warm amber tones. Soft golden light. "Quiet," she says. I see a park.') === null &&
    R.deepThinkLaws(Object.assign(fullRead(), { concept_territories: [{ name: 'x', image_prompt: 'A crowd in Times Square at night.' }] }), row).includes('think:image_prompt_proper_name:concept_territories[0]:Times') &&
    R.deepThinkLaws(Object.assign(fullRead(), { concept_territories: [{ name: 'x', image_prompt: 'a billboard over a quiet street.' }] }), row).includes('think:image_prompt_text_surface:concept_territories[0]:billboard'),
    'I3 review: the think contract is checked on landing: every decision answered, every expectation judged, three futures, every section, a plan in three phases; no brand in an illustrator\'s brief (a competitor\'s own words too, in any case, FIELD only as written), and a brief that still names a person or a place is never drawn');
  const sold = r => R.readSellable(Object.assign(baseRow('compiled', { think: {} }), { status: 'ready', read: r, violations: [], meta: Object.assign(baseRow('compiled', { think: {} }).meta, { proof: { lane: 'live' } }) })).fails;
  const fThin = sold(thin), fOk = sold(Object.assign(fullRead(), { findings: [Object.assign(clone(finding), { supports: { outlets: 2 }, voices: ['V1'] }), Object.assign(clone(finding), { supports: { outlets: 2 }, voices: ['V2'] })] }));
  const dup = fullRead(); dup.decisions = [Object.assign({}, dup.decisions[1], { n: 2 }), Object.assign({}, dup.decisions[1], { n: 2, decision: undefined })]; dup.hypotheses = [{ verdict: 'supported' }, dup.hypotheses[1]]; dup.plan_90.phases = ['Days 1 to 30: do it', dup.plan_90.phases[1], dup.plan_90.phases[2]];
  const nd = R.deepThinkLaws(dup, row);
  ok(nd.includes('think:decisions:1_of_2') && nd.includes('think:hypotheses:1_of_2') && nd.includes('think:plan_90_phases:2_of_3'),
    'I3b review: the law counts as the page prints: each decision once (by where its words sit in the brief, else its number), a verdict only with its claim, a phase only as an object');
  ok(fThin.includes('decisions:1_of_2') && fThin.includes('hypotheses:0_of_2') && fThin.includes('plan_90_phases:2_of_3') && !fOk.some(f => /^(?:decisions|hypotheses|plan_90|missing)/.test(f)) &&
    !R.readSellable(Object.assign(baseRow('compiled'), { status: 'ready', read: thin, violations: [], meta: Object.assign(baseRow('compiled').meta, { proof: { lane: 'live' } }) })).fails.some(f => /^decisions/.test(f)),
    'I4 the sell law: a RECON thought through is sold only with every decision answered, every expectation judged and its plan in three phases (a RECON from before the passes is not asked)');
  const many = fullRead(); many.title = 'Grew ' + '1'.repeat(300) + ' times'; many.findings = Array.from({ length: 90 }, () => Object.assign(clone(finding), { advantage: '' }));
  const nn = R.deepDraftNotesOf(baseRow('write'), [], many);
  ok(nn.length === T.NOTES_MAX && nn.every(n => n.length <= T.NOTE_CHARS) && nn.some(n => /^number_not_in_evidence:title:1+$/.test(n) && n.length === T.NOTE_CHARS) && nn.filter(n => /^finding_\d+:edge/.test(n)).length > 40,
    'I5 the editor gets at most ' + T.NOTES_MAX + ' notes, each cut to ' + T.NOTE_CHARS + ' characters');
  const st = R.readStyle({ concept_territories: [{ image_prompt: 'A scene, not a photo, might leverage 3 lights!' }], hypotheses: [{ verdict: 'supported' }], plan_90: { phases: [{ window: 'Days 1 to 30' }] } });
  ok(!st.notes.length, 'I6 the house style reads our prose, never an illustrator\'s brief, a verdict or a plan\'s window');
}

// ── J: revisions and releases ──────────────────────────────────────────
resetAll();
{ const prior = Object.assign(baseRow('compiled', { think: { edit: { sends: 1 } } }), { status: 'ready', read: fullRead(), stats: clone(stats) });
  prior.meta.renders = { version: 1, list: [{ i: 0, h: 'abc', key: 'reads/renders/x.jpg' }] }; prior.meta.notes = [{ n: 1, text: 'Tighten the answer.', status: 'open' }]; prior.meta.deep.spend = { plan: 1, analysis: 1.2, strategy: 1.3, write: 2.2, compile_v1: 2.5, desk_v1: 0.5, cards: 1 };
  live['41'] = clone(prior);
  fixtures = Object.assign(fx(), { 'house_reads?kind=eq.recon&window_start': () => [], 'house_reads?select=*': (p, o) => { const r = Object.assign({ id: 50, version: 2, kind: 'recon', status: 'queued' }, clone(o.body[0])); live['50'] = r; return [clone(r)]; } });
  const un = quiet(); const rv = await R.readRoute('/reads/revise', { id: 41 }, {}, '', { id: 'admin' }); un();
  const sub = submitted.find(s => s.kind === 'house_recon');
  ok(rv.ok && sub && sub.items[0].system.includes(R.READ_THINK_CONTRACT) && sub.items[0].system.includes(R.READ_DEEP_LAW) && live['50'].meta.renders.list[0].key === 'reads/renders/x.jpg',
    'J1 a revision of a RECON thought through keeps every section the passes wrote (the think contract rides it) and keeps the drawings already made');
  live['41'] = clone(prior); live['41'].meta.deep.budget_usd = 14;   // $9.70 spent: one pass and the desk ($4.60) do not fit
  const rv3 = await R.readRoute('/reads/revise', { id: 41 }, {}, '', { id: 'admin' });
  live['41'] = clone(prior); live['41'].meta.deep.budget_usd = 14.5;   // they fit; the four passes ($13.60) never would
  const un2 = quiet(); const rv2 = await R.readRoute('/reads/revise', { id: 41 }, {}, '', { id: 'admin' }); un2();
  ok(rv3.error === 'budget_too_low' && rv3.spent === 9.7 && rv2.error !== 'budget_too_low' && rv2.id === 50, 'J2 a revision is one pass: it needs room for one pass and the desk, never the four');
}

// ── K: the receipt ─────────────────────────────────────────────────────
resetAll();
{ addJob({ kind: 'recon_analysis', status: 'done', cost_usd: 1.2, meta: { recon_read_id: 41 } }); addJob({ kind: 'recon_strategy', status: 'done', cost_usd: 1.3, meta: { recon_read_id: 41 } });
  addJob({ kind: 'recon_write', status: 'submitted', est_usd: 3.7, meta: { recon_read_id: 41 } }); addJob({ kind: 'house_recon', status: 'done', cost_usd: 2.5, meta: { recon_read_id: 41, house_read_id: 41 } });
  const js = await R.deepJobsSpend({}, 41);
  ok(js.analysis === 1.2 && js.strategy === 1.3 && js.write === 0 && js.inflight === 3.7 && !('house_recon' in js) && !('edit' in js),
    'K1 the receipt reads each pass back from its jobs (a pass in the batch at its reservation); the editor\'s lands as compile_v<n>, never twice');
}

// ── Z: page, seams, gate ───────────────────────────────────────────────
ok(/if \(decs\.length\) contents\.push\(\["The decisions"/.test(page) && /if \(hyps\.length\) contents\.push\(\["What we tested"/.test(page) && /if \(mm\) contents\.push\(\["The market"/.test(page) && /if \(cmap\.length\) contents\.push\(\[cut \? "The competitive page" : "The response map"/.test(page) &&
  /contents\.push\(\[futs\.length === 3 \? "Three futures" : "The futures"/.test(page) && /if \(terrs\.length\) contents\.push\(\["Concept territories"/.test(page) && /if \(prods\.length\) contents\.push\(\["Product concepts"/.test(page) && /if \(p90\) contents\.push\(\["The first 90 days"/.test(page) &&
  /if \(appx && !cut\) contents\.push\(\["The data appendix"/.test(page),
  'Z1 the page lists every new section in its contents, each only when the read has it');
ok(/<figcaption>Imagined · a concept drawing, not a photograph<\/figcaption>/.test(page) && /The drawings are imagined: no product, place or person in them is real\./.test(page) && /var rf = el\.closest\("\.rp-render-fig"\); if \(rf\) \{ rf\.remove\(\); return; \}/.test(page) &&
  /'<span class="fig none">Not measured<\/span>'/.test(page) && /nothing here is written by a model/.test(page) && /tbl\("What we read and counted"/.test(page) && /Sources read in full and carried into this read<\/div><table class="rp-appx">/.test(page) && /\["Comments and posts read", cmA\.read\], \["Shared headlines among them, set aside", cmA\.shares\], \["Coded by theme and stance", cmA\.coded\]/.test(page) &&
  /row\.meta\.renders\.version === row\.version \? arrOf\(row\.meta\.renders\.list\) : \[\]/.test(page) && /function refs\(list\) \{ list = Array\.isArray\(list\) \? list : typeof list === "string" \? \[list\] : \[\];/.test(page) &&
  /except the targets and thresholds we set in the plans, the tests, the signposts and what would change an answer\. Nothing else is estimated\./.test(page) && /var at = typeof d\.decision === "string" \? listed\.indexOf\(d\.decision\) : -1/.test(page) && /esc\(c\.published_at \? fmtDate/.test(page),
  'Z2 a drawing is labeled imagined and a missing one leaves no empty frame; a market driver the evidence does not size says so; the data appendix prints the worker\'s counts and every source read in full');
ok(/analysis: "Thinking: the analysis", strategy: "Thinking: the strategy and the concepts", write: "Writing the RECON"/.test(page) && /pass_analysis: "the analyst's pass is in the batch"/.test(page) && /var TH = d\.think \|\| \{\}, PASSES = /.test(page) &&
  /analysis: "The analysis", strategy: "The strategy and the concepts", write: "The writing"/.test(page) && /m\[2\] !== "1" \? "The revision" : d\.think \? "The editor's pass" : "The compile"/.test(page) && /d\.failed_stage === "write" && d\.think && d\.think\.edit \? "the editor's pass"/.test(page) && /Math\.max\(20, Math\.ceil/.test(page) && /return m\[1\] \+ " of the brief's " \+ m\[2\] \+ " decisions answered"/.test(page) && /min="20" max="100"/.test(page),
  'Z3 the desk sees each pass, its wait, its line on the receipt; the sell line names what is missing; a ceiling starts at $20');
ok(/'deepThinkSend': '/.test(gate) && /'deepRenders': '/.test(gate) && seams.registry['SEAM:READ_THINK'] && seams.registry['SEAM:READ_THINK@read'] && /SEAM:READ_THINK/.test(page),
  'Z4 the new spenders are registered with their guards; the seam is registered for the worker and the page');
ok(!/—/.test(w.slice(w.indexOf('/* ── EX18 THE THINK'), w.indexOf('/* PURE: the supports law and the momentum law'))), 'Z5 no em dash in the passes\' code or prompts');

console.log('\nproof_read_think: ' + pass + ' checks PASS');
