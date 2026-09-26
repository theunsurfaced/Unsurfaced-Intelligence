/**
 * proof_excavate_wire.mjs  --  EX1 + EX1b: EXCAVATE does what it was built to do,
 * and the lake's numbers can be trusted. Runs the real functions on fake wires.
 * v2 (EX1d): report mode has room for meanings and briefs (3600); test moves meet the move law.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0027_lake_truth.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };
const helpers = between('/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const H = new Function(helpers + '; return { excBudget, looksEnglish, gatherOrder, lakeWhen, LIVE_KINDS, EXC_BUDGET };')();

// ── W1 GDELT arrives ──────────────────────────────────────────────────────
const gss = between('async function gatherServerSignals(', 'function serverConnectors(');
const fakeNet = async (url) => {
  if (/gdeltproject/.test(url)) return new Response(JSON.stringify({ articles: [
    { title: 'Stadium tour adds dates', url: 'https://news.example/a', domain: 'news.example', seendate: '20260920', language: 'English' },
    { title: 'Merch line sells out', url: 'https://news.example/b', domain: 'news.example', seendate: '20260921', language: 'English' }] }), { status: 200 });
  if (/algolia/.test(url)) return new Response(JSON.stringify({ hits: [{ title: 'HN thread on fandom', objectID: '1', points: 40, num_comments: 9, url: 'https://hn.example/1' }] }), { status: 200 });
  return new Response('{}', { status: 404 });
};
const gatherServerSignals = new Function('fetch', gss + '; return gatherServerSignals;')(fakeNet);
const wire = await gatherServerSignals('fan access');
ok(wire.filter(x => x.signalType === 'news').length === 2 && wire.some(x => x.source === 'Hacker News'), 'W1 GDELT news reaches the wire again (and HN still does)');
ok(!/from: Number\.isInteger\(x\.from\)[^\n]*\}\)\);\s*$/m.test(gss), 'W1b the stray `from:` line is gone from the GDELT push');

// ── W2 the evidence budget ────────────────────────────────────────────────
const open40 = Array.from({ length: 40 }, (_, i) => ({ lens: 'market', title: 'open ' + i, url: 'https://open.example/' + i }));
const lake10 = Array.from({ length: 12 }, (_, i) => ({ lens: 'lake', title: 'lake ' + i, url: 'https://lake.example/' + i }));
const added8 = Array.from({ length: 8 }, (_, i) => ({ signalType: 'web', source: 'exa.example', title: 'paid ' + i, snippet: 's', url: 'https://paid.example/' + i }));
const dup = { lens: 'market', title: 'same story', url: 'https://lake.example/0?utm=x' };
const plan = H.excBudget(open40.concat([dup], lake10), added8);
ok(plan.lake.length === 10 && plan.server.length === 8 && plan.merged.length === 44, 'W2 lake keeps its 10, all 8 paid items are read, open data fills to 44');
ok(plan.merged[0].lens === 'lake' && !plan.merged.some(c => c._a), 'W3 the lake leads the evidence; no internal fields leak');
ok(plan.open.every(c => c.url !== 'https://lake.example/0?utm=x'), 'W4 a URL already in the lake is not read twice');
const thin = H.excBudget(open40.slice(0, 5), []);
ok(thin.merged.length === 5 && thin.server.length === 0, 'W5 a thin corpus is not padded');

// ── W6 synthesize end to end ─────────────────────────────────────────────
const synth = between('async function synthesize(', '// Robust JSON extraction');
const xj = between('function jsonRepair(', '// Server-side connectors');
let modelCall = null, ledger = null, captured = null;
const modelOut = JSON.stringify({ read: ['Access outsold the object.', 'Price the room.'],
  insights: [
    { category: 'culture', title: 'Rooms beat reach', excerpt: 'x', implication: 'y', evidence: [1, 12, 13, 99, 'x'], source: 'made up', sourceUrl: 'https://made.up' },
    { category: 'market', title: 'One source only', excerpt: 'x', evidence: [15], source: 'a', sourceUrl: '' },
    { category: 'brand', title: 'No citation', excerpt: 'x', source: 's', sourceUrl: 'https://ok.example' }],
  ideas: [{ type: 'Campaign', headline: 'Gate the merch drop behind Ticketmaster stubs', body: 'Sell the tour capsule at the 3 stadium dates only.', proof: 'Billboard reported the sell-out.', evidence: [1], from: 0 },
          { type: 'Product', headline: 'Price the room at $40 for Live Nation buyers', body: 'A members table at each show.', evidence: [2], from: 42 }],
  brief: 'b' });
const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'callModel', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG',
  helpers + xj + synth + '; return synthesize;')(
  (o, st) => ({ o, st }), async () => [{ signalType: 'news', source: 'news.example', title: 'Stadium tour adds dates', snippet: 'English news about fans and the tour', url: 'https://news.example/a' },
    { signalType: 'web', source: 'es.example', title: 'La gira de los artistas en la ciudad y el precio de las entradas', snippet: 'para los fans que están en la ciudad', url: 'https://es.example/x' }],
  async () => [{ signalType: 'web', source: 'exa.example', title: 'Paid find', snippet: 'paid', url: 'https://paid.example/0' }],
  async (env, tier, msgs, opts) => { modelCall = { tier, msgs, opts }; return modelOut; },
  async (env, row) => { ledger = row; return 77; }, async () => 'h', async (env, items) => { captured = items; }, (a) => a.map(x => x.source), {});
const res = await S({ query: 'fan access', mode: 'report', corpus: lake10.slice(0, 10).concat(open40) }, {}, '');
const d = res.o.data;
ok(modelCall.opts.max_tokens === 3600 && modelCall.tier === 't3', 'W6 report mode has room for a whole report (3600)');
ok(/"evidence":\[the 1-based numbers/.test(modelCall.msgs[1].content), 'W7 the model is asked which evidence each insight stands on');
ok(d.evidence_n === 44 && /\[1\] \(lake\)/.test(modelCall.msgs[1].content), 'W8 the model reads 44 items, lake first');
ok(d.signals.length === 2 && !d.signals.some(s => /es\.example/.test(s.url)), 'W9 the server wire is read, and a Spanish item is stopped at the door');
const i0 = d.insights[0], i1 = d.insights[1], i2 = d.insights[2];
ok(i0.evidence.join() === '1,12,13' && i0.confidence === 'High' && i0.sourceUrl === 'https://lake.example/0', 'W10 cited evidence is validated; source and link come from it; 3 sources = High');
ok(i1.confidence === 'Low' && i2.confidence === 'Low' && i2.evidence.length === 0, 'W11 one source = Low; no citation = Low, never High by category');
ok(d.ideas[0].from === 0 && d.ideas[1].from === null, 'W12 ideas carry `from` again, validated');
ok(ledger.meta.lake === 10 && ledger.meta.added === 2 && ledger.meta.offered === 2, 'W13 the ledger records what was read, not what was offered');

// ── W14 English law ──────────────────────────────────────────────────────
ok(H.looksEnglish('The stadium tour sold out in a day and added two more dates for fans'), 'W14 English passes');
ok(!H.looksEnglish('La gira de los artistas en la ciudad y el precio de las entradas para los fans'), 'W15 Spanish is stopped');
ok(!H.looksEnglish('東京のファンがチケットを求めて行列を作った'), 'W16 non-Latin script is stopped');
ok(H.looksEnglish('Nike x Sacai') && H.looksEnglish(''), 'W17 short or empty text passes (no false alarms on names)');

// ── W18 gather order and gate ─────────────────────────────────────────────
const ord = H.gatherOrder([{ id: 'a', source_tier: 3, rail: 'openalex' }, { id: 'b', source_tier: 3, rail: 'exa' }, { id: 'c', kind: 'entity', source_tier: 1 }, { id: 'd', source_tier: 1, rail: 'guardian' }]);
ok(ord.map(x => x.id).join('') === 'dbac', 'W18 strongest tier first, paid rails first within a tier, entities last');
const gat = between('async function excavateGather(', '/* ═══ SEAM:READ_LEDGER');
const G = new Function('excavateAuth', 'gatherOpenSignals', 'lakeCapture', 'json', gat + '; return excavateGather;')(
  async () => ({ err: 'AUTH_REQUIRED' }), async () => { throw new Error('must not gather'); }, async () => 0, (o) => o);
ok(await G({ json: async () => ({ query: 'x' }) }, {}, '') === 'AUTH_REQUIRED', 'W19 gather refuses without a signed-in user, before spending anything');
ok(/items = gatherOrder\(english\)\.slice\(0, GATHER\.MAX_ITEMS\)/.test(w) && /ctx\.meta\.non_english/.test(w), 'W20 the envelope is English-filtered and ordered before its cap');
ok(/field: body\.field === true \? await fieldRail\(env, q\)/.test(w), 'W21 Tavily runs only on request');

// ── T lake truth ──────────────────────────────────────────────────────────
const now = Date.parse('2026-09-26T12:00:00Z'), day = 864e5, iso = t => new Date(t).toISOString();
ok(H.lakeWhen({ published_at: '2026-01-01T00:00:00Z', captured_at: iso(now), momentum: { provenance: 'live_read' } }) === '2026-01-01T00:00:00Z', 'T1 a row speaks for its publish date');
ok(H.lakeWhen({ captured_at: iso(now), momentum: { provenance: 'live_gather' } }) === null, 'T2 a live capture with no publish date speaks for no date');
ok(H.lakeWhen({ captured_at: iso(now), momentum: null }) === iso(now), 'T3 a house capture falls back to capture time');
const cbs = between('function computeBrandSignal(', 'async function brandSignal(');
const CB = new Function('lakeWhen', cbs + '; return computeBrandSignal;')(H.lakeWhen);
const searches = Array.from({ length: 6 }, () => ({ similarity: 0.8, captured_at: iso(now - day), momentum: { provenance: 'live_read' }, source_tier: 3 }));
ok(CB(searches, now).thin === true, 'T4 six search captures with no dates do not make a brand signal');
const real = [{ similarity: 0.8, published_at: iso(now - 5 * day), source_tier: 1 }, { similarity: 0.8, published_at: iso(now - 10 * day), source_tier: 2 },
  { similarity: 0.8, published_at: iso(now - 40 * day), source_tier: 1 }, { similarity: 0.8, published_at: iso(now - 200 * day), captured_at: iso(now), momentum: { provenance: 'live_read' } }];
const bs = CB(real, now);
ok(bs.recent_30d === 2 && bs.momentum_pct === 100, 'T5 momentum counts by publish date: an old article captured today is not "recent"');
const lc = between('async function lakeCapture(', 'async function ledgerWrite(');
let rows = null;
const LC = new Function('sha256hex', 'hashInput', 'territoryGuess', 'sbRest', 'LIVE_KINDS', lc + '; return lakeCapture;')(
  async (x) => x, (a, b) => a + b, () => null, async (env, path, o) => { rows = o.body; return o.body; }, H.LIVE_KINDS);
await LC({}, [{ url: 'https://n.example/1', title: 'news', kind: 'news' }, { url: 'https://p.example/1', title: 'paper', kind: 'research' },
  { url: 'https://w.example/1', title: 'wiki', kind: 'reference' }, { url: 'https://c.example/1', title: 'lens', kind: 'consumer' }], { provenance: 'live_gather' });
ok(rows.length === 1 && rows[0].title === 'news', 'T6 live searches write news to the lake, not papers, reference pages or lens copies');
await LC({}, [{ url: 'https://p.example/2', title: 'paper', kind: 'research' }], { provenance: 'spine' });
ok(rows.length === 1 && rows[0].title === 'paper', 'T7 the house spine still captures every kind it chooses');
ok(/'rpc\/match_signals_read'/.test(between('async function brandSignal(', 'async function excavateLake(')) &&
   /'rpc\/match_signals_read'/.test(between('async function excavateLake(', 'async function fieldRail(')), 'T8 brand signal and the lake search read match_signals_read');
ok((w.match(/'rpc\/match_signals'/g) || []).length >= 3, 'T9 DAILY keeps its own match_signals: its ranking does not move');
ok(/status <> 'rejected'/.test(mig) && /coalesce\(s\.published_at, s\.captured_at\) >= p_since/.test(mig) && /published_at timestamptz/.test(mig), 'T10 0027: no rejected rows, publish dates returned and windowed');
ok(/check \(source_tier between 0 and 4\)/.test(mig) && /pg_get_constraintdef\(oid\) ilike '%source_tier%'/.test(mig), 'T11 0027: tier 0 (MINE) allowed, whatever the old check was named');
ok(/p_query     vector\(384\),\s+p_count     int default 12,\s+p_territory text default null,\s+p_min_tier  int default 4,\s+p_since     timestamptz default null/.test(mig) &&
   /p_query: vec, p_count: 24, p_territory: null, p_min_tier: 4,/.test(w), 'T12 the callers pass exactly the named arguments match_signals_read takes');
ok(/momentum: Object\.assign\(\{\}, r\.momentum, \{ echo_of: echo\.id \}\)/.test(w) && /momentum: Object\.assign\(\{\}, r\.momentum, \{ novelty, announcement: true \}\)/.test(w), 'T13 rejection merges momentum, never erases it');
ok(/api-key=' \+ encodeURIComponent\(env\.GUARDIAN_KEY \|\| 'test'\)/.test(w), 'T14 the Guardian reads its key from env');
ok(/Date\.parse\(lakeWhen\(r\)\) >= Date\.parse\(d7\)/.test(w) && /const rows = fetched\.filter\(r => \{ const w = lakeWhen\(r\)/.test(w), 'T15 track and audience counts use the date each row speaks for');

// ── C the page ────────────────────────────────────────────────────────────
ok(/'\/excavate\/gather',\{method:'POST',headers:Object\.assign\(\{'Content-Type':'application\/json'\},await _authHeader\(\)\)/.test(page), 'C1 the page signs its gather call');
ok(/const ordered=corpus\.filter\(c=>c\.rail==='gather'\)\.concat\(corpus\.filter\(c=>c\.rail!=='gather'\)\);/.test(page), 'C2 the server ranked gather leads the corpus');
console.log(`\nproof_excavate_wire: ${pass} checks PASS`);
