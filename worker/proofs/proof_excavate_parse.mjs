/**
 * proof_excavate_parse.mjs  --  SEAM:EXC_PARSE: a read the model wrote is a read
 * the client gets. Reproduces the Oct 2 failure (every live search answered
 * {"ok":false,"error":"synthesis_unparsable"}) and proves the fix on fakes.
 * Run from the repo root: node worker/proofs/proof_excavate_parse.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };

const helpers = between('/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const xj = between('function jsonRepair(', '// Server-side connectors');
const synth = between('async function synthesize(', '// Robust JSON extraction');
const lane = between('const EXC_MODEL = ', '/* SEAM:EXCAVATE_MEANING: the report contract.');
const X = new Function(xj + '; return { extractJson, excSalvage, excReadOf, EXC_ROOM };')();

// A full report as Sonnet writes it: 7 findings with three meanings, 4 moves with seven fields.
const finding = i => ({ category: ['consumer', 'market', 'culture', 'brand'][i % 4], title: 'Finding ' + i + ' names a real thing',
  excerpt: 'Evidence ' + (i + 1) + ' shows a dated, specific change in "texture-first" shelving at Ulta in September.',
  evidence: [i + 1, i + 2], meaning: { culture: 'Culture line ' + i + ', with a comma, and a "quote".', category: 'Category line ' + i + '.', consumer: 'Consumer line ' + i + '.' } });
const move = i => ({ type: 'Product', for: 'retail', headline: 'Stock the curl kit at Ulta by week ' + (i + 2), body: 'Put the $18 kit on the Ulta endcap.',
  because: 'Evidence 3 shows the tension.', proof: 'Ulta reported it in evidence 3.', measure: 'Endcap sell-through in 60 days.', risk: 'Price cuts at Target.', evidence: [3], from: i });
const report = { frame: { category: 'Hair care', audience: 'Gen Z' }, read: ['Texture outsold the brand.', 'Shelve by curl pattern.'],
  insights: Array.from({ length: 7 }, (_, i) => finding(i)), ideas: Array.from({ length: 4 }, (_, i) => move(i)), brief: 'Where the conversation is and what to do first.' };
const full = JSON.stringify(report);
const cutInMoves = full.slice(0, full.indexOf('"ideas"') + 300);            // the Oct 2 failure: max_tokens hit while writing moves
const cutInFindings = full.slice(0, full.indexOf('"title":"Finding 2') + 40); // cut so early only two findings finished

// ── the harvest ───────────────────────────────────────────────────────────
ok(X.extractJson(cutInMoves) === null, 'P1 reproduces the bug: a reply cut at its token limit does not parse whole');
const sv = X.excSalvage(cutInMoves);
ok(sv && sv.insights.length === 7 && sv.insights[6].meaning.consumer === 'Consumer line 6.' && sv.frame.category === 'Hair care' && sv.read.length === 2,
  'P2 the cut reply keeps every finding it finished, its meanings, the frame and the two-line read');
const cutMidMove = full.slice(0, full.indexOf('"headline":"Stock the curl kit at Ulta by week 3') + 30);
const sv2 = X.excSalvage(cutMidMove);
ok(sv2 && sv2.ideas.length === 1 && sv2.ideas[0].risk === 'Price cuts at Target.' && sv2.insights.length === 7 && (!sv.ideas || sv.ideas.every(m => m.risk)),
  'P3 finished moves are kept whole; a move cut mid-object is dropped, never half-written into the read');
ok(X.excSalvage(cutInFindings) === null, 'P4 a reply cut before three findings finished is not passed off as a read');
ok(X.excReadOf('Here is the read:\n```json\n' + full + '\n```').how === 'whole' && X.excReadOf(cutInMoves).how === 'salvaged' && X.excReadOf('not json at all') === null,
  'P5 fenced or prose-wrapped replies parse whole; cut ones are salvaged; prose alone is a miss');
ok(X.excSalvage('{"insights":[{"title":"a \\"quoted\\" } brace","excerpt":"x"},{"title":"b"},{"title":"c"},{"title":"d","excerpt":"cut her').insights.map(x => x.title).join('|') === 'a "quoted" } brace|b|c',
  'P6 braces and escaped quotes inside strings never fool the bracket count');
ok(X.EXC_ROOM.report === 8000 && X.EXC_ROOM.plain === 4000 && X.EXC_ROOM.ceiling === 12000, 'P7 a report has 8000 tokens of room, a plain read 4000, a second pass at most 12000');

// ── the lane ──────────────────────────────────────────────────────────────
let lcalls = [];
const mkLane = seq => new Function('callClaude', 'callModel', 'claudeSpent', 'claudeCap', 'CLAUDE', 'CONFIG', lane + '; return { excCompile };')(
  async (env, tier, req) => { lcalls.push({ tier, req }); return seq.shift() || { ok: false, error: 'claude_cap' }; },
  async (env, tier, msgs, o) => { lcalls.push({ reserve: tier, o }); return 'R'; },
  async () => 0, () => 10, { TIERS: { live: { model: 'claude-sonnet-5' } } }, { TEXT_MODEL: '@cf/meta/llama-4-scout-17b-16e-instruct' }).excCompile;
let ec = mkLane([{ ok: true, text: 'x', stop_reason: 'max_tokens', truncated: true }]);
let r = await ec({}, { system: 'S', prompt: 'P', max_tokens: 8000 });
ok(r.lane === 'live' && r.stop_reason === 'max_tokens' && r.truncated === true, 'P8 the live lane reports why it stopped');
lcalls = []; ec = mkLane([{ ok: true, text: 'never called' }]);
r = await ec({}, { system: 'S', prompt: 'P', max_tokens: 12000, reserve: 't3', reserveOnly: 'parse_failed' });
ok(r.lane === 'reserve' && r.reason === 'parse_failed' && lcalls.length === 1 && lcalls[0].reserve === 't3' && lcalls[0].o.max_tokens === 4000,
  'P9 reserveOnly skips Claude, says why, and keeps the reserve model inside its own room');

// ── synthesize end to end ─────────────────────────────────────────────────
const corpus = Array.from({ length: 12 }, (_, i) => ({ lens: 'consumer', title: 't' + i, url: 'https://e.example/' + i, source: 's' + i, published_at: new Date(Date.now() - (i + 1) * 864e5).toISOString() }));
const logs = [];
const origLog = console.log;
const run = async replies => {
  const calls = [];
  const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG',
    helpers + xj + synth + '; return synthesize;')(
    (o, st) => ({ o, st }), async () => [], async () => [],
    async (env, o) => { calls.push(o); const x = replies.shift(); return Object.assign({ lane: o.reserveOnly ? 'reserve' : 'live', model: 'm', reason: o.reserveOnly || null, cost_usd: 0 }, x); },
    async () => 1, async () => 'h', async () => 0, () => [], {});
  console.log = (...a) => logs.push(a.join(' '));
  try { return { res: await S({ query: 'gen z hair care', mode: 'report', corpus }, {}, ''), calls }; } finally { console.log = origLog; }
};

let t = await run([{ text: full }]);
ok(t.res.o.ok === true && t.calls.length === 1 && t.calls[0].max_tokens === 8000 && t.res.o.data.insights.length === 7 && t.res.o.data.model.reason === null,
  'S1 a whole reply is one call at 8000 tokens of room and a full read');
t = await run([{ text: cutInMoves, stop_reason: 'max_tokens', truncated: true }]);
ok(t.res.o.ok === true && t.calls.length === 1 && t.res.o.data.insights.length === 7 && /salvaged_cut/.test(t.res.o.data.model.reason),
  'S2 the Oct 2 failure now returns the seven finished findings on the first call, labeled salvaged, with nothing spent twice');
logs.length = 0;
t = await run([{ text: 'I cannot comply with JSON today.' }, { text: '```json\n' + full + '\n```' }]);
ok(t.res.o.ok === true && t.calls.length === 2 && t.calls[1].max_tokens === 12000 && /ROOM LAW/.test(t.calls[1].prompt) && t.calls[1].kind === 'excavate_report_retry' && !t.calls[1].reserveOnly,
  'S3 an unreadable reply earns one tighter second pass on the live lane with double the room');
ok(logs.some(l => /^exc_parse_miss /.test(l) && /"pass":"first"/.test(l) && /"tail":/.test(l)), 'S4 the miss is logged with its pass, lane, stop reason and the tail of what came back');
t = await run([{ text: 'nope' }, { text: 'still nope' }, { text: full }]);
ok(t.res.o.ok === true && t.calls.length === 3 && t.calls[2].reserveOnly && t.res.o.data.model.lane === 'reserve',
  'S5 two unreadable live replies fall to the reserve model, and the read says which lane wrote it');
t = await run([{ text: 'a' }, { text: 'b' }, { text: 'c' }]);
ok(t.res.o.ok === false && t.res.o.error === 'synthesis_unparsable' && t.res.o.passes.length === 3 && t.res.o.passes.map(p => p.pass).join() === 'first,second,reserve',
  'S6 only three unreadable replies end in a miss, and the miss names every pass');
t = await run([{ text: 'a', lane: 'reserve', reason: 'claude_cap' }, { text: full }]);
ok(t.calls.length === 2 && t.calls[1].reserveOnly === 'claude_cap' && t.res.o.ok === true, 'S7 when the live lane was already closed (cap), no second live call is attempted');

ok(!/—/.test(between('/* SEAM:EXC_PARSE: the room a read gets', '// Server-side connectors')), 'S8 no em dash in the new code or its laws');
console.log('\nproof_excavate_parse: ' + pass + ' checks PASS');
