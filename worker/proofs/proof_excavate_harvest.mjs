/**
 * proof_excavate_harvest.mjs  --  EX5 HARVEST: the tier registry, pages read,
 * the competitive set and the counter view, the gap round, the fact table,
 * the measures, the score, and the overnight door. Runs the real functions
 * on fakes. Run from the repo root: node worker/proofs/proof_excavate_harvest.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0033_harvest.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const quiet = () => { const o = console.log; const logs = []; console.log = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; } }; };
const day = 864e5, ago = d => new Date(Date.now() - d * day).toISOString();

const helpers = between(w, '/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const xj = between(w, 'function jsonRepair(', '// Server-side connectors');
const lane = between(w, 'const EXC_MODEL = ', '/* SEAM:EXCAVATE_MEANING: the report contract.');
const pv = between(w, 'function pvBlockedHost(host) {', 'async function pvTranslateAllowed(');
const states = between(w, 'function clusterState(t, nowMs) {', '// Bounded geometry pass');
const H = new Function('clusterState', 'clusterShape', 'lakeWhen', 'sbRest', 'ilikeOr', 'caches', 'fetch',
  pv + xj + helpers + '; return { excTierLookup, excStampTiers, excPageDate, excPagePick, excReadPages, excMeasureFrom, excMeasures, excMeasureLine, excReadScore, excRelevance, excFrameClean, excLine, excSalvageArray, EXC_PAGES, EXC_VOICE_SYS, excTerritoryOf, excGround, EXC_TIME_LAW, excBudget };')(
  ...(() => { const fieldSrc = between(w, 'const FIELD = {', '};') + '};'; const S = new Function(fieldSrc + states + '; return [clusterState, clusterShape];')(); return S; })(),
  r => r && (r.published_at || r.captured_at) || null, async () => [], names => 'or=(' + names.map(n => 'title.ilike.*' + encodeURIComponent(n) + '*').join(',') + ')',
  { default: { match: async () => null, put: async () => {} } }, async () => { throw new Error('no network in the proof'); });

// ── T: the tier registry ──────────────────────────────────────────────────
const tiers = { 'happi.com': 2, 'theguardian.com': 1, 'sec.gov': 0, 'medium.com': 4 };
ok(H.excTierLookup(tiers, { url: 'https://www.happi.com/x' }) === 2 && H.excTierLookup(tiers, { url: 'https://money.theguardian.com/a' }) === 1 && H.excTierLookup(tiers, { source: 'Unsurfaced Lake · happi.com (T3)' }) === 2 && H.excTierLookup(tiers, { url: 'https://unknown.example/' }) === null,
  'T1 the registry answers by domain, by root domain, and by the lake\'s own source label; an unknown domain is left to the rail');
const its = [{ url: 'https://www.happi.com/x', tier: 3, source_tier: 3 }, { url: 'https://sec.gov/f', tier: 3, source_tier: 3 }, { url: 'https://unknown.example/' }];
H.excStampTiers(its, tiers);
ok(its[0].tier === 2 && its[0].source_tier === 2 && its[0].tier_src === 'registry' && its[1].tier === 0 && its[1].source_tier === 1 && its[2].tier === undefined, 'T2 a registry tier is stamped on the item; T0 lands as T1 in the lake\'s own scale; an unknown item is untouched');
ok(/create table if not exists public\.source_tiers/.test(mig) && /\('happi\.com', 2/.test(mig) && /\('reuters\.com', 1/.test(mig) && /\('sec\.gov', 0/.test(mig) && /create table if not exists public\.door_reads/.test(mig) && /door_reads_frame_night_uq/.test(mig),
  'T3 migration 0033 seeds the registry (trade press T2, newsrooms T1, primary records T0) and creates door_reads with one row per frame per night');

// ── P: pages ──────────────────────────────────────────────────────────────
const html = '<html lang="en"><head><title>T</title><meta property="article:published_time" content="2026-09-25T10:00:00Z"><meta property="og:title" content="Nike restructures again"></head><body><article><p>Nike said on Thursday it would cut 1,600 jobs, about 2% of its workforce, as sales fell 9% in the quarter to $11.6 billion, the company reported.</p><p>Chief executive Elliott Hill told analysts the Jordan line would be held back from retail to rebuild scarcity through 2026.</p></article></body></html>';
ok(H.excPageDate(html) === '2026-09-25T10:00:00.000Z' && H.excPageDate('<time datetime="2026-09-20">x</time>') === '2026-09-20T00:00:00.000Z' && H.excPageDate('<p>nothing</p>') === null, 'P1 a page is dated from its meta, its JSON-LD or a time element');
const picks = H.excPagePick([{ url: 'https://a.example/1', kind: 'news', published_at: ago(1) }, { url: 'https://youtube.com/watch?v=1', kind: 'discourse' }, { url: 'https://b.example/2', kind: 'web' }, { url: 'https://en.wikipedia.org/wiki/X', kind: 'reference' }, { url: 'https://c.example/3', kind: 'research' }, { title: 'YouTube comments: 20 sampled', url: 'https://d.example/4', kind: 'discourse' },
  { url: 'http://10.0.0.8/admin', kind: 'web' }, { url: 'https://localhost/x', kind: 'news' }, { url: 'https://e.example:8443/x', kind: 'news' }, { url: 'https://user:pw@f.example/x', kind: 'news' }, { url: 'https://www.netflix.com/title/1', kind: 'news', published_at: ago(3) }, { url: 'https://x.com/user/status/1', kind: 'news' }, { url: 'ftp://g.example/x', kind: 'news' }], 12);
ok(picks.length === 3 && picks[0].url === 'https://b.example/2' && picks[1].url === 'https://a.example/1' && picks[2].url === 'https://www.netflix.com/title/1',
  'P2 news and web pages are picked, undated web first; video, reference, research and comment items are not pages; a private host, a port, credentials, a non-http scheme and x.com are refused, and netflix.com is not x.com');
let fetched = [];
const H2 = new Function('clusterState', 'clusterShape', 'lakeWhen', 'sbRest', 'ilikeOr', 'caches', 'fetch',
  pv + xj + helpers + '; return { excReadPages };')(() => 'STEADY', () => null, () => null, async () => [], () => '', { default: { match: async () => null, put: async () => {} } },
  async u => { fetched.push(u); if (/slow/.test(u)) await new Promise(r => setTimeout(r, 9000)); return { ok: true, url: u, headers: { get: () => 'text/html' }, text: async () => html }; });
const q0 = quiet();
const items = [{ url: 'https://a.example/1', kind: 'web', title: 'A', text: 'short' }, { url: 'https://b.example/2', kind: 'news', title: 'B', text: 'short', published_at: ago(2) }];
const pr = await H2.excReadPages(items, { max: 12 });
q0.done();
ok(pr.read === 2 && pr.dated === 1 && items[0].published_at === '2026-09-25T10:00:00.000Z' && items[0].dated_by === 'page' && items[0].read === 'page' && /1,600 jobs/.test(items[0].text) && items[1].published_at !== '2026-09-25T10:00:00.000Z',
  'P3 a page gives its paragraphs to the line and its date to an undated item, never to a dated one');
const q1 = quiet(); fetched = [];
const slow = [{ url: 'https://slow.example/1', kind: 'web', title: 'S', text: '' }];
const t0 = Date.now(); const pr2 = await H2.excReadPages(slow, { max: 12 }); const took = Date.now() - t0;
q1.done();
ok(took < 8000 && pr2.read === 0 && !slow[0].read, 'P4 a slow page is left behind inside the budget; the read is never held for it');
let cancelled = 0;
const bodyOf = (chunks) => ({ getReader: () => { let i = 0; return { read: async () => i < chunks.length ? { done: false, value: new TextEncoder().encode(chunks[i++]) } : { done: true }, cancel: async () => { cancelled++; } }; } });
const H3 = new Function('clusterState', 'clusterShape', 'lakeWhen', 'sbRest', 'ilikeOr', 'caches', 'fetch',
  pv + xj + helpers + '; return { excReadPages, excReadCapped };')(() => 'STEADY', () => null, () => null, async () => [], () => '', { default: { match: async () => null, put: async () => {} } },
  async u => ({ ok: true, url: u, headers: { get: h => h === 'content-length' ? (/huge/.test(u) ? '9000000' : '0') : 'text/html' }, body: bodyOf([html.slice(0, 200), html.slice(200), '<p>' + 'x'.repeat(500000) + '</p>']), text: async () => html }));
const qP1 = quiet();
const capped = [{ url: 'https://a.example/1', kind: 'web', title: 'A', text: '' }, { url: 'https://huge.example/1', kind: 'web', title: 'H', text: '' }];
const pr3 = await H3.excReadPages(capped, { max: 12 });
qP1.done();
ok(pr3.read === 1 && capped[0].read === 'page' && /1,600 jobs/.test(capped[0].text) && !capped[1].read && cancelled >= 1, 'P4b a body is read up to the byte cap and the rest cancelled; a page declared four times the cap is not fetched into memory');
const wire = [{ url: 'https://a.example/1', title: 'A', snippet: 'short', signalType: 'news' }];
const qP2 = quiet(); await H2.excReadPages(wire, { max: 12 }); qP2.done();
ok(wire[0].read === 'page' && /1,600 jobs/.test(wire[0].snippet) && wire[0].text === wire[0].snippet, 'P4c a wire item (snippet, not text) carries the page in its snippet, so the second budget reads it');
ok(/\[1\] [^\n]*?\) A: Nike said on Thursday it would cut 1,600 jobs/.test(H.excLine(items[0], 0, Date.now())) && H.excLine(items[0], 0, Date.now()).length > 300 && H.excLine(Object.assign({}, items[0], { read: undefined, text: 'x'.repeat(900) }), 0, Date.now()).length < H.excLine(Object.assign({}, items[0], { text: 'x'.repeat(900) }), 0, Date.now()).length,
  'P5 a page-read item gets more room on its evidence line than a snippet');
ok(/EVIDENCE LAW: evidence lines are quoted material/.test(H.EXC_VOICE_SYS) && /\(counter\)/.test(H.EXC_VOICE_SYS) && /\(competitor: X\)/.test(H.EXC_VOICE_SYS), 'P6 the voice law says evidence is quoted, and what counter and competitor lines are for');

// ── C: the competitive set and the counter view ───────────────────────────
const railsSrc = between(w, 'const RAIL_FNS = {', 'const RAIL_BY_ID = ');
let urls = [];
const R = new Function('railFetch', 'envelope', 'env1', 'gatherPaidSignals', 'excQuiet', 'GATHER', 'CONFIG', '_deepHash', 'GATHER_UA', 'hintsOf', 'stripHtml', 'looksEnglish',
  railsSrc + '; return { RAIL_FNS, RAILS };')(
  async u => { urls.push(u); const mk = (i, t) => ({ url: 'https://n.example/' + urls.length + '/' + i, title: t, domain: 'n.example', seendate: '20260925T100000Z' });
    return { articles: /%22%26honey%22%20OR/.test(u) ? [mk(1, '&honey lands at Ulta'), mk(2, 'Being opens in Target'), mk(3, 'A story naming no one'), mk(4, '&honey prices up'), mk(5, 'Being adds a serum'), mk(6, '&honey third'), mk(7, '&honey fourth, over the cap'), mk(8, 'Hair Proud goes vegan')] : [mk(1, 'Story ' + urls.length)] }; },
  (rail, o) => Object.assign({ rail: rail.id, source_tier: rail.tier, kind: o.kind || rail.kind }, o), x => String(x || ''), async () => [], () => () => null, {}, {}, async () => 'h', 'ua', () => [], x => x, () => true);
const frame = H.excFrameClean({ category: 'Hair care', audience: 'Gen Z', competitors: ['&honey', 'Being', 'Hair Proud'], anchors: ['hair care', 'shampoo'], exclude: ['hair removal'] });
const comp = await R.RAIL_FNS.competitors({}, 'gen z hair care', { meta: {}, frame }, R.RAILS.find(r => r.id === 'competitors'));
ok(comp.length === 6 && urls.length === 1 && /\(%22%26honey%22%20OR%20%22Being%22%20OR%20%22Hair%20Proud%22\)%20Hair%20care/.test(urls[0]) && comp.map(c => c.entity).join('|') === '&honey|Being|&honey|Being|&honey|Hair Proud' && comp[0].published_at === '2026-09-25T10:00:00Z',
  'C1 one search for the whole competitive set, quoted and joined by OR, in the category; an article counts only when its title names a competitor, filed under that name, three each at most');
urls = [];
const cnt = await R.RAIL_FNS.counter({}, 'gen z hair care', { meta: {}, frame }, R.RAILS.find(r => r.id === 'counter'));
ok(cnt.length === 1 && cnt[0].stance === 'against' && /backlash%20OR%20decline/.test(urls[0]) && /%22Hair%20care%22/.test(urls[0]), 'C2 the counter rail asks for the other side of the frame\'s subject; its items carry stance against');
ok((await R.RAIL_FNS.competitors({}, 'q', { meta: {} }, R.RAILS.find(r => r.id === 'competitors'))).length === 0, 'C3 without a frame the competitive set asks nothing');
const g = H.excRelevance([{ title: 'Being expands at Target', entity: 'Being' }, { title: 'Hair Proud goes vegan' }, { title: 'her hair routine' }, { title: 'Belt and Road' }].concat(Array.from({ length: 12 }, (_, i) => ({ title: 'shampoo note ' + i }))), frame);
ok(g.kept.length === 15 && g.dropped.length === 1 && g.dropped[0].title === 'Belt and Road' && g.hits['hair proud'] === 1 && g.hits['hair'] === 1 && g.hits.shampoo === 12 && g.anchors >= 6, 'C4 a competitor item is on-frame by its entity or its name; the category noun "hair" is an anchor; hits are counted by anchor');
ok(/\(competitor: Being\)/.test(H.excLine({ title: 'x', text: 'y', entity: 'Being' }, 0, Date.now())) && /\(counter\)/.test(H.excLine({ title: 'x', text: 'y', stance: 'against' }, 0, Date.now())) && /\(gap\)/.test(H.excLine({ title: 'x', text: 'y', rail: 'gap' }, 0, Date.now())), 'C5 the evidence line marks competitor, counter and gap lines');

// ── F: the fact table and the gap check ───────────────────────────────────
let calls = [];
const L = new Function('callClaude', 'callModel', 'claudeSpent', 'claudeCap', 'CLAUDE', 'CONFIG', 'sbRest', 'sha256hex', 'extractJson', 'excSalvageArray', 'excFrameClean', 'excFrameBlock', 'excWhen', 'excQuiet', 'RAIL_BY_ID', 'RAIL_FNS', 'EXC_TIERS', 'railAllowed',
  lane + '; return { excFacts, excObserved, excGapCheck, excGapRound, excTiersLoad };')(
  async (env, tier, req) => { calls.push({ tier, req }); if (req.kind === 'excavate_facts') { const ns = [...req.prompt.matchAll(/^\[(\d+)\]/gm)].map(m => +m[1]); return { ok: true, text: JSON.stringify(ns.map(n => ({ n, claims: ['Item ' + n + ' sells 1,000 units at $20'], entities: n % 2 ? ['&honey', 'Ulta'] : ['Being'], date: n === 1 ? '2026-09-20' : null, stance: 'neutral' }))) }; }
    if (req.kind === 'excavate_gap') return { ok: true, text: '{"missing":["pricing","K18","the newest week"],"queries":[{"rail":"news","q":"K18 hair care launch"},{"rail":"web","q":"gen z shampoo price"}]}' }; return { ok: false, error: 'x' }; },
  async () => '', async () => 0, () => 3, { TIERS: { frame: { model: 'haiku' } } }, {}, async () => [{ domain: 'happi.com', tier: 2 }], async t => 'h' + t.length,
  new Function(xj + '; return extractJson;')(), H.excSalvageArray, H.excFrameClean, f => 'FRAME: ' + f.category + '\n', c => c && c.published_at ? new Date(c.published_at) : null, () => () => null,
  { gdelt: { id: 'gdelt' }, guardian: { id: 'guardian' }, exa: { id: 'exa' }, openalex: { id: 'openalex' } },
  { gdelt: async (e, q) => [{ title: 'gdelt ' + q, url: 'https://g.example/' + q.length, kind: 'news' }], guardian: async () => [], exa: async (e, q) => [{ title: 'exa ' + q, url: 'https://e.example/' + q.length, kind: 'web' }], openalex: async () => [] }, { KEY: 'tiers:v1', TTL: 1 }, async (e, r) => r.id !== 'guardian');
const list = Array.from({ length: 13 }, (_, i) => ({ title: 'Item ' + (i + 1), text: 'text', source: 's' + i, url: 'https://x.example/' + i }));
const q2 = quiet();
const ft = await L.excFacts({}, list, 'gen z hair care');
q2.done();
ok(ft.tabled === 13 && ft.chunks === 2 && ft.failed === 0 && calls.length === 2 && calls.every(c => c.tier === 'facts' && c.req.kind === 'excavate_facts' && c.req.cache === true), 'F1 thirteen items are tabled in two chunks on the facts tier (its own cap) with the prefix cached');
ok(list[0].facts.claims[0] === 'Item 1 sells 1,000 units at $20' && list[0].published_at === '2026-09-20' && list[0].dated_by === 'facts' && list[1].published_at === undefined, 'F2 claims land on each item; a date the table found dates an undated item');
ok(/FACTS: Item 1 sells 1,000 units at \$20 · NAMES: &honey, Ulta/.test(H.excLine(list[0], 0, Date.now())), 'F3 a tabled line reads FACTS and NAMES instead of raw text');
ok(L.excObserved(list, frame).join('|') === '&honey|Ulta|Being', 'F4 the observed competitive set is what the table counts beside the topic, most named first, the frame\'s own entity and anchors aside');
calls = [];
const gap = await L.excGapCheck({}, frame, list);
ok(gap && gap.missing.length === 3 && gap.missing[1] === 'K18' && gap.queries.length === 2 && gap.queries[1].rail === 'web' && calls[0].req.kind === 'excavate_gap', 'F5 the gap check names what the question lacks and the searches that would fill it');
const q3 = quiet();
const round = await L.excGapRound({}, gap, { meta: {} });
q3.done();
ok(round.length === 3 && round.every(it => it.rail === 'gap' && it.gap_q) && round.some(it => /exa gen z shampoo price/.test(it.title)) && round.filter(it => /gdelt/.test(it.title)).length === 2, 'F6 the round runs news through GDELT and Guardian, web through Exa and GDELT, honors each rail\'s daily cap, and tags every line as gap');
const q4 = quiet();
const tl = await L.excTiersLoad({});
q4.done();
ok(tl && tl['happi.com'] === 2, 'F7 the registry loads from the table into a domain map');

// ── S: synthesize reads pages onto the items themselves ───────────────────
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
const rawFrame = { category: 'Hair care', audience: 'Gen Z', market: 'US', competitors: ['&honey', 'Being'], question: 'q?', anchors: ['hair care', 'shampoo', 'curl'], exclude: ['hair removal'], queries: { news: 'n', research: 'r', discourse: 'd', web: 'w' } };
let sCall = null;
const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG', 'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved',
  xj + helpers + synth + '; excReadPages = async items => { pagesGot = items; for (const c of items) { if (/b\\.example/.test(c.url)) { c.text = "PAGE TEXT: the brand cut 1,600 jobs"; if ("snippet" in c) c.snippet = c.text; c.read = "page"; } if (/a\\.example/.test(c.url) && !c.published_at) { c.published_at = "' + ago(2) + '"; c.dated_by = "page"; } } return { read: 1, dated: 1, tried: 2 }; }; excMeasures = async () => null; return synthesize;')(
  (o) => o, async () => [{ title: 'Wire story on shampoo', snippet: 'short wire snippet', url: 'https://b.example/wire', source: 'reuters.com', signalType: 'news', published_at: ago(1) }], async () => [],
  async (e, o) => { sCall = o; return { text: JSON.stringify({ read: ['a', 'b'], insights: [{ category: 'market', title: 'T', excerpt: 'E', evidence: [1] }], ideas: [], brief: 'b' }), lane: 'live', model: 'claude-sonnet-5', reason: null, cost_usd: 0.05, stop_reason: 'end_turn' }; },
  async () => 1, async t => 'h' + t.length, async () => 0, () => [], {}, async () => rawFrame, async () => null, async () => ({ tabled: 0, chunks: 0, failed: 0 }), async () => null, async () => [], () => []);
const sCorpus = [{ lens: 'consumer', title: 'Undated shampoo web page', text: 'short', url: 'https://a.example/1', source: 'blog', tier: 3, kind: 'web' }]
  .concat(Array.from({ length: 13 }, (_, i) => ({ lens: 'consumer', title: 'Shampoo note ' + i, text: 'a shampoo note', url: 'https://f.example/' + i, source: 'blog' + i, tier: 4, published_at: ago(i + 1), kind: 'news' })));
const qS = quiet();
const sRes = (await S({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn', 'exa'], corpus: sCorpus }, {}, '')).data;
qS.done();
const sLines = sCall.prompt.split('\n').filter(l => /^\[\d+\]/.test(l));
const pg = globalThis.pagesGot;   // the fake assigns inside the Function's own scope
ok(pg && pg.length === 15 && pg.every(c => sCorpus.includes(c) || c.signalType) && sLines.some(l => /Wire story on shampoo/.test(l) && /PAGE TEXT: the brand cut 1,600 jobs/.test(l)) && sLines.some(l => /Undated shampoo web page/.test(l) && !/undated/.test(l)) && sRes.harvest.pages.read === 1,
  'S1 pages are read onto the corpus and wire items themselves, so after the second budget the evidence lines carry the page text and the page date (a wire item through its snippet)');

// ── M: measures and the score ─────────────────────────────────────────────
const rows = [].concat(Array.from({ length: 6 }, (_, i) => ({ published_at: ago(i + 1), source_name: 'o' + (i % 3), territory: 'fashion-beauty' })), Array.from({ length: 3 }, (_, i) => ({ published_at: ago(8 + i), source_name: 'o9', territory: 'fashion-beauty' })), [{ published_at: ago(40), source_name: 'old', territory: 'music' }]);
const terr = Array.from({ length: 24 }, (_, i) => ({ published_at: ago(i % 7 + 0.5) }));
const m = H.excMeasureFrom(rows.concat([{ published_at: ago(2), source_name: 'o0', territory: 'music' }, { published_at: 'not a date', source_name: 'bad', territory: 'music' }]), terr, Date.now());
ok(m.recent_7d === 7 && m.prior_7d === 3 && m.velocity_pct === 133 && m.outlets === 5 && m.weeks_touched === 3 && m.territory === 'fashion-beauty' && m.share_pct === 25 && m.series.length === 12 && m.series[11] === 7 && m.state === 'ACCELERATING',
  'M1 twelve weeks are counted from the dates rows speak for: this week against last, outlets, weeks touched, share of the top territory (its own rows over its week; a row elsewhere this week is not in the numerator; an unreadable date is skipped), and the field\'s own state');
ok(/signals: 7 this week, 3 the week before \(\+133%\); distinct outlets: 5; weeks touched: 3 of 12; share of fashion beauty signals this week: 25%; state ACCELERATING/.test(H.excMeasureLine(m)) && /may be stated as measured/.test(H.excMeasureLine(m)), 'M2 the measures line is exact and tells the model its numbers count as grounded');
const merged = Array.from({ length: 30 }, (_, i) => ({ title: i < 3 ? '&honey item ' + i : 'item ' + i, text: 'x', source: 'src' + (i % 8), url: 'https://s' + (i % 8) + '.example/' + i, published_at: ago(i < 20 ? i + 1 : 400), read: i < 6 ? 'page' : undefined }));
const sc = H.excReadScore({ insights: [{ confidence: 'High', checks: { ungrounded: [] } }, { confidence: 'Medium', checks: { ungrounded: [] } }, { confidence: 'Low', checks: { ungrounded: ['37%'] } }], read_checks: { ungrounded: [] } }, merged, frame, { total_ms: 60000 });
ok(sc.lines === 30 && sc.fresh === 20 && sc.fresh_share === 67 && sc.outlets === 8 && sc.medium_plus === 2 && sc.unverified === 1 && sc.competitors === 3 && sc.competitors_evidenced === 1 && sc.pages === 6 && sc.seconds === 60 && sc.score > 40 && sc.score < 80,
  'M3 the score counts lines, fresh share, outlets, corroboration, unverified figures, competitors evidenced, pages and seconds into one number');
ok(H.excReadScore({ insights: [] }, [], null, null).score < 15, 'M4 an empty read scores near zero');

// ── D: the door ───────────────────────────────────────────────────────────
const doorSrc = between(w, 'const DOOR = { WANT: 12', 'async function excavateFeed(env, origin) {');
const kv = {}, table = [], patches = [], batch = [], upserts = [];
let nextId = 1;
const D = new Function('feedCacheKey', 'feedWarm', 'loadTracks', 'FEED', 'sbRest', 'ilikeOr', 'excStampTiers', 'excRelevance', 'excReadPages', 'excBudget', 'excKey', 'excWhen', 'excLine', 'excFrameBlock', 'excMeasureLine', 'excFrameClean', 'excFrameFor', 'excMeasures', 'excTiersLoad', 'excTier', 'excBand', 'excGround', 'excEarned', 'excClip', 'excShort', 'excWindow', 'excReadOf', 'excFrameLabel', 'claudeBatchSubmit', 'claudeSpent', 'claudeCap', 'EXC_MODEL', 'EXC_VOICE_SYS', 'EXC_MOVE_LAW', 'EXC_TIME_LAW', 'EXC_NUMBER_LAW', 'RAIL_FNS', 'RAIL_BY_ID', 'excRailQuery', 'excQuiet', 'logEvent', 'excavateAuth', 'json', 'CLAUDE',
  doorSrc + '; return { doorCandidates, doorEvidence, doorStamp, doorPass, doorLand, doorPublish, doorTile, doorCompileRead, excDoorPrompt, DOOR, doorEvery };')(
  () => 'prop', async () => ({ proposed: [{ cluster_id: 'th1', title: 'Texture-first shelves', subtitle: 'Who wins the curl aisle?', query: 'curl hair care shelf', lens: 'market', evidence: { recent_7d: 9, territories: ['fashion-beauty'] } }, { cluster_id: 'th2', title: 'Quiet theme', subtitle: '', lens: 'culture', evidence: { recent_7d: 1 } }] }),
  async () => [{ id: 'tr1', name: 'Nike', aliases: ['NKE'], sector: 'Athletic footwear' }], { TRACKS_KEY: 'tracks:stats' },
  async (env, path, opts) => {
    if (/^signals\?/.test(path)) return Array.from({ length: 6 }, (_, i) => ({ id: 's' + i, title: (/theme_id\.eq\.th1/.test(path) ? 'Curl aisle story ' : /Nike/.test(path) ? 'Nike story ' : 'thin ') + i, url: 'https://lake.example/' + path.slice(8, 12) + i, summary: 'summary ' + i, source_name: 'outlet' + (i % 3), source_tier: 3, published_at: ago(i + 1), captured_at: ago(i + 1), image: /theme_id\.eq\.th1/.test(path) && i === 0 ? 'https://img.example/curl0.jpg' : /theme_id\.eq\.th1/.test(path) && i === 1 ? 'http://img.example/insecure.jpg' : null })).slice(0, /th2/.test(path) ? 2 : 6);
    if (/^door_reads\?on_conflict/.test(path)) { upserts.push(opts.body.length); return opts.body.map(r => { const prev = table.find(x => x.frame_key === r.frame_key && x.night === r.night); if (prev) { Object.assign(prev, r); return prev; } const row = Object.assign({ id: 'd' + (nextId++) }, r); table.push(row); return row; }); }
    if (/^door_reads\?id=eq\./.test(path) && opts && opts.method === 'PATCH') { const id = path.match(/id=eq\.([^&]+)/)[1]; const row = table.find(r => r.id === id); if (row) Object.assign(row, opts.body); patches.push({ id, body: opts.body }); return null; }
    if (/^door_reads\?/.test(path)) {
      // A small PostgREST: status=in.(..), night=lt./eq., frame_key=in.("..",".."), id=eq., order=night.desc, select=night
      const ps = new URLSearchParams(path.split('?')[1]); let rows = table.slice();
      for (const [k, v] of ps) {
        if (k === 'status' && v.startsWith('in.(')) { const set = v.slice(4, -1).split(','); rows = rows.filter(r => set.includes(r.status)); }
        if (k === 'night' && v.startsWith('lt.')) rows = rows.filter(r => r.night < v.slice(3));
        if (k === 'night' && v.startsWith('eq.')) rows = rows.filter(r => r.night === v.slice(3));
        if (k === 'frame_key' && v.startsWith('in.(')) { const set = v.slice(4, -1).split(',').map(x => decodeURIComponent(x.replace(/^"|"$/g, ''))); rows = rows.filter(r => set.includes(r.frame_key)); }
        if (k === 'id' && v.startsWith('eq.')) rows = rows.filter(r => r.id === v.slice(3));
        if (k === 'order' && v === 'night.desc') rows.sort((a, b) => a.night < b.night ? 1 : -1);
      }
      return ps.get('select') === 'night' ? rows.map(r => ({ night: r.night })) : rows;
    }
    return [];
  },
  names => 'or=(' + names.map(n => 'title.ilike.*' + n + '*').join(',') + ')', () => null, (items, f) => ({ kept: items, dropped: [] }), async () => ({ read: 0 }), items => ({ merged: items.slice(0, 44), open: items, server: [], lake: [] }), c => c.url || c.title, c => c && c.published_at ? new Date(c.published_at) : null,
  (c, i) => '[' + (i + 1) + '] ' + c.title, f => 'FRAME\n', m => 'MEASURES\n', f => f, async (env, q) => ({ category: /Nike/.test(q) ? 'Athletic footwear' : 'Hair care', entity: /Nike/.test(q) ? 'Nike' : null, audience: 'Gen Z', market: 'US', competitors: ['x'], question: 'q?', anchors: ['a'], exclude: [], queries: {} }),
  async () => ({ series: [1, 2, 3], recent_7d: 9, prior_7d: 3, outlets: 4, weeks_touched: 5, weeks: 12, share_pct: 30, territory: 'fashion-beauty', state: 'ACCELERATING', newest: '2026-10-02' }), async () => ({}), () => 3, () => 'RECENT',
  () => ({ numbers: 0, ungrounded: [] }), () => 'Medium', (x, n) => String(x).slice(0, n), x => x, () => ({}), t => { const j = JSON.parse(t); return { read: j, how: 'whole' }; }, f => f.entity ? f.entity + ' in ' + f.category.toLowerCase() : (f.audience ? f.audience + ' ' + f.category.toLowerCase() : f.category),
  async (env, tier, kind, items) => { batch.push({ tier, kind, items }); return { ok: true, batch_id: 'b1', est_usd: 0.1 }; }, async () => 0, () => 10, { TIER: 'live', OVERNIGHT_SHARE: 0.6 }, 'VOICE', 'MOVE', 'TIME', 'NUMBER',
  { gdelt: async () => [{ title: 'fresh news', url: 'https://news.example/1', published_at: ago(0.5), source_name: 'news.example', text: '' }] }, { gdelt: { id: 'gdelt', kind: 'news' } }, (r, q) => q, () => () => null, () => {}, async () => ({}), (o) => o, { TIERS: { live: { model: 'claude-sonnet-5' } } });
const q5 = quiet();
const cands = await D.doorCandidates({ RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } });
q5.done();
ok(cands.length === 3 && cands[0].key === 'theme:th1' && cands[0].velocity === 9 && cands[1].key === 'theme:th2' && cands[2].key === 'track:tr1' && cands[2].names.includes('NKE') && cands[2].query === 'Nike Athletic footwear' && cands[0].query === 'curl hair care shelf' && cands[1].query === 'Quiet theme', 'D1 the candidates are the lake\'s themes (searched by the query PROPOSE wrote, the title when it wrote none) and the tracked entities, ranked by this week\'s signals');
const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
const q6 = quiet();
const out1 = await D.doorPass(env);
q6.done();
ok(out1.candidates === 3 && out1.queued === 2 && out1.thin === 1 && out1.reused === 0 && batch.length === 1 && batch[0].tier === 'live' && batch[0].kind === 'door_read' && batch[0].items.length === 2 && batch[0].items.every(i => i.cache === true && i.meta.door_id && /^door-/.test(i.custom_id)),
  'D2 the first night queues one batch read per frame with enough evidence; a thin frame is recorded, not compiled');
const th1 = table.find(r => r.frame_key === 'theme:th1'), th2 = table.find(r => r.frame_key === 'theme:th2');

ok(table.filter(r => r.status === 'compiling').length === 2 && th2.status === 'failed' && th2.error === 'thin_evidence' && th1.evidence.length === 7 && th1.evidence[0].text !== undefined && th1.meta.batch_id === 'b1' && th1.meta.set_aside === 0 && th1.measures.recent_7d === 9 && th1.frame.anchors.length === 1,
  'D3 every row keeps its frame (whole), its measures, its evidence pack and the batch it waits on, and the pack includes the news top-up');
ok(th1.evidence.filter(e => e.image).length === 1 && th1.evidence.find(e => e.image).image === 'https://img.example/curl0.jpg' && th1.evidence.every(e => 'image' in e),
  'D3b each stored line keeps its https image (an http one is dropped), so the photograph survives into the landing');
ok(/^v3\.2q~/.test(D.doorStamp([{ sid: 's1', published_at: ago(1) }])) && D.DOOR.VOICE === '3.2q',
  'D3c the reuse stamp carries the door\'s voice version');
const landedText = JSON.stringify({ read: ['Texture-first shelving now owns 30% of fashion beauty signals this week.', 'Put the curl line on the endcap.'], insights: [{ category: 'market', title: 'Shelves sort by curl', excerpt: 'Curl aisle story 0 says so.', evidence: [1] }, { category: 'consumer', title: 'Buyers read labels', excerpt: 'x', evidence: [2] }, { category: 'brand', title: 'Being leads', excerpt: 'x', evidence: [3] }], ideas: [{ type: 'Channel', for: 'retail', headline: 'Pitch the curl endcap to Target', body: 'b', because: 'c', proof: 'p', evidence: [1], from: 0 }], brief: 'Where it is.' });
const q7 = quiet();
const land = await D.doorLand(env, th1.id, landedText, 0.02, 'end_turn');
q7.done();
const row0 = th1;
ok(land.status === 'ready' && row0.status === 'ready' && row0.read.read[0].startsWith('Texture-first') && row0.read.insights.length === 3 && row0.read.insights[0].evidence[0] === 1 && row0.read.ideas[0].headline === 'Pitch the curl endcap to Target' && row0.read.evidence_n === 7 && row0.cost_usd === 0.02,
  'D4 a landed read is compiled under the laws (evidence mapped, confidence earned, numbers checked) and stored ready with its cost');
const set = JSON.parse(kv['door:v2']);
ok(set.tiles.length === 1 && set.pending === 1 && set.tiles[0].claim.startsWith('Texture-first') && set.tiles[0].move === 'Pitch the curl endcap to Target' && set.tiles[0].measures.recent_7d === 9 && set.tiles[0].measures.state === 'ACCELERATING' && set.tiles[0].frame.audience === 'Gen Z' && set.tiles[0].label === 'Gen Z hair care' && set.tiles[0].image === null,
  'D5 the published tile carries the claim, the move, the measures and the frame; a read still compiling is counted as pending');
ok(row0.read.insights[0].image === 'https://img.example/curl0.jpg' && set.tiles[0].photo && set.tiles[0].photo.src === 'https://img.example/curl0.jpg' && set.tiles[0].photo.credit === 'outlet0',
  'D5b the photograph a cited line carried reaches the published tile, credited to the outlet by name (no lake label, no tier)');
// Night two: nothing moved for th1 → reused; Nike's row still compiling counts as not ready.
D.DOOR.WANT = 12;
const q8 = quiet();
const night2 = (new Date(Date.now() + day)).toISOString().slice(0, 10);
const realNight = D.doorPass; void realNight;
// Shift the night by stubbing Date-independent reuse: run the pass again on the same night is an upsert; so simulate by moving row nights back one day.
table.forEach(r => { r.night = '2000-01-01'; });
const out2 = await D.doorPass(env);
q8.done();
ok(out2.reused === 1 && out2.queued === 1 && table.filter(r => r.status === 'reused').length === 1 && table.find(r => r.status === 'reused').read.read[0].startsWith('Texture-first') && table.find(r => r.status === 'reused').meta.prev_night === '2000-01-01',
  'D6 the next night, a frame whose evidence did not move keeps its read without a model call; the one that was never written is asked again');
const upN = upserts.length, batchN = batch.length;
const q8b = quiet();
const out3 = await D.doorPass(env);
q8b.done();
ok(out3.kept === 2 && out3.queued === 0 && out3.reused === 0 && upserts.length === upN + 1 && batch.length === batchN && table.filter(r => r.status === 'reused').length === 1 && table.find(r => r.status === 'reused').read,
  'D6b a second pass the same night leaves a frame already read on the same evidence alone: no row rewritten, no read nulled, no model call (the thin one is recorded again)');
const oldNike = table.find(r => r.frame_key === 'track:tr1' && r.night === '2000-01-01');
oldNike.status = 'ready'; oldNike.read = { read: ['Nike held the shelf.', 'Hold the Jordan line.'], insights: [{ title: 'x', evidence: [1] }], ideas: [{ headline: 'Gate the next drop' }], brief: 'b' };
const q8c = quiet();
const pub = await D.doorPublish(env);
q8c.done();
const nk = pub.tiles.find(t => t.key === 'track:tr1');
ok(pub.tiles.length === 2 && pub.pending === 1 && pub.night !== '2000-01-01' && nk && nk.carried === true && nk.night === '2000-01-01' && nk.claim === 'Nike held the shelf.' && pub.tiles.find(t => t.key === 'theme:th1').status === 'reused',
  'D6c a frame whose read is still being written keeps last night\'s tile on the door, marked carried, beside tonight\'s; the set is dated tonight');
// D6d: a new voice is a new read. Same evidence, next night, voice bumped: nothing is reused, every frame is asked again.
D.DOOR.VOICE = '9.9z';
table.forEach(r => { r.night = '2000-01-02'; });
const q8d = quiet();
const outV = await D.doorPass(env, { force: true });
q8d.done();
D.DOOR.VOICE = '3.2q';
ok(outV.reused === 0 && outV.kept === 0 && outV.queued === 2 && table.filter(r => r.night !== '2000-01-02' && r.frame_key === 'theme:th1')[0].status === 'compiling',
  'D6d when the voice changes, a frame whose evidence did not move is written again: no read from the old voice is reused');
ok(/"read":\["line 1: one plain sentence, at most 30 words, stating what people are doing/.test(D.excDoorPrompt(frame, 'E', m)) && /"question":"the question this read answers/.test(D.excDoorPrompt(frame, 'E', m)) && /3 to 4 of \{"category"/.test(D.excDoorPrompt(frame, 'E', m)) && /Lead with what changed/.test(D.excDoorPrompt(frame, 'E', m)), 'D7 the door asks for the light shape under the headline and question laws: a plain line about people and the question, three or four findings, one or two moves, a brief');
ok(/if \(path === '\/excavate\/door\/read' && request\.method === 'GET'\) return doorReadRoute\(request, env, origin\);/.test(w) && /\.then\(\(\) => doorPass\(env\)\)/.test(w) && /row\.kind === 'door_read' && row\.meta && row\.meta\.door_id/.test(w) && /which === 'door' \? await doorPass\(env, \{ force: true \}\)/.test(w) && /door: door && door\.tiles && door\.tiles\.length \? door : null/.test(w),
  'D8 the read route, the cron chain, the batch drain, the admin door and the feed all know the door');
// D9: the cadence. The door compiles a new batch every EVERY_D nights; inside the gap it republishes the standing set and spends nothing.
const yday = new Date(Date.now() - day).toISOString().slice(0, 10);
table.forEach(r => { r.night = yday; if (r.status === 'compiling' || r.status === 'queued') r.status = 'ready'; });
const batchBefore = batch.length, upBefore = upserts.length, builtBefore = JSON.parse(kv['door:v2']).built_at;
await new Promise(r => setTimeout(r, 5));
const q9 = quiet();
const skip = await D.doorPass(env);
q9.done();
ok(D.DOOR.EVERY_D === 2 && skip.skipped === 'cadence' && skip.every === 2 && skip.last_night === yday && skip.next_night === new Date(Date.parse(yday) + 2 * day).toISOString().slice(0, 10) && skip.candidates === 0 && batch.length === batchBefore && upserts.length === upBefore && JSON.parse(kv['door:v2']).built_at !== builtBefore && JSON.parse(kv['door:v2']).tiles.length === table.filter(r => r.status === 'ready' || r.status === 'reused').length,
  'D9 one night after a door night, the pass skips on cadence: no candidates, no rows, no batch, the next night named, and the standing set republished so its KV copy stays fresh');
const q9b = quiet();
const forced = await D.doorPass(env, { force: true });
q9b.done();
ok(!forced.skipped && forced.candidates === 3 && upserts.length === upBefore + 1, 'D9b a desk run passes force and compiles inside the gap');
table.forEach(r => { r.night = yday; });
const q9c = quiet();
const nightly = await D.doorPass({ RATE_LIMIT: env.RATE_LIMIT, DOOR_EVERY_D: '1' });
q9c.done();
ok(!nightly.skipped && nightly.candidates === 3 && D.doorEvery({ DOOR_EVERY_D: '3' }) === 3 && D.doorEvery({ DOOR_EVERY_D: 'x' }) === 2 && D.doorEvery({}) === 2, 'D9c DOOR_EVERY_D 1 runs nightly without a deploy; an unreadable value falls back to the house setting');
table.forEach(r => { r.night = new Date(Date.now() - 2 * day).toISOString().slice(0, 10); });
const q9d = quiet();
const due = await D.doorPass(env);
q9d.done();
ok(!due.skipped && due.candidates === 3, 'D9d two nights after a door night the batch is due and compiles');
ok(/which === 'door' \? await doorPass\(env, \{ force: true \}\)/.test(w) && /\.then\(\(\) => doorPass\(env\)\)/.test(w) && /stories since the last reading<\/span>/.test(page) && !/since last night/.test(page) && /a new reading is compiling/.test(page) && D.DOOR.TTL === 72 * 3600,
  'D9e the desk forces, the cron does not; the page says since the last reading, never since last night; the KV set outlives a two-night gap');

// ── B: EX5b THE BRIEF, the engine ─────────────────────────────────────────
// B1 GDELT calls take turns, GAP_MS apart; other hosts do not wait.
const rfSrc = between(w, 'const GDELT_SPACE = ', 'function stripHtml(');
const rfCalls = [];
const RF = new Function('GATHER', 'GATHER_UA', 'excQuiet', 'fetch', rfSrc + '; return { railFetch, GDELT_SPACE };')(
  { TIMEOUT_MS: 6500 }, 'ua', () => () => null, async u => { rfCalls.push({ u, t: Date.now() }); return { ok: true, headers: { get: () => 'application/json' }, json: async () => ({ u }) }; });
RF.GDELT_SPACE.GAP_MS = 120;
const tB = Date.now();
await Promise.all([RF.railFetch('https://api.gdeltproject.org/api/v2/doc/doc?a'), RF.railFetch('https://api.gdeltproject.org/api/v2/doc/doc?b'), RF.railFetch('https://api.gdeltproject.org/api/v2/doc/doc?c'), RF.railFetch('https://hn.algolia.com/x')]);
const gd = rfCalls.filter(c => /gdelt/.test(c.u)).map(c => c.t - tB).sort((a, b) => a - b), hnT = rfCalls.find(c => /algolia/.test(c.u)).t - tB;
ok(gd.length === 3 && gd[1] - gd[0] >= 100 && gd[2] - gd[1] >= 100 && hnT < 60, 'B1 three GDELT calls asked at once go out one at a time, a gap apart; a call to another host does not wait');
// B2 the framed rails run again from synthesize when the gather reported them late, with their tags, and reach the evidence.
const S2 = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG', 'excFrameFor', 'excTiersLoad', 'excFacts', 'excGapCheck', 'excGapRound', 'excObserved', 'excFramedRerun',
  xj + helpers + synth + '; excReadPages = async () => ({ read: 0, dated: 0, tried: 0 }); excMeasures = async () => null; return synthesize;')(
  (o) => o, async () => [], async () => [], async (e, o) => { sCall = o; return { text: JSON.stringify({ read: ['a', 'b'], insights: [{ category: 'market', title: 'T', excerpt: 'E', evidence: [1] }], ideas: [], brief: 'b' }), lane: 'live', model: 'claude-sonnet-5', reason: null, cost_usd: 0.05, stop_reason: 'end_turn' }; },
  async () => 1, async t => 'h' + t.length, async () => 0, () => [], {}, async () => rawFrame, async () => null, async () => ({ tabled: 0, chunks: 0, failed: 0 }), async () => null, async () => [], () => [],
  async (env, frame, query, ids) => { globalThis.framedAsked = ids; return [{ lens: 'market', source: 'n.example', title: '&honey opens at Ulta', text: '', url: 'https://n.example/c1', published_at: ago(2), kind: 'news', tier: 4, rail: 'gather', entity: '&honey', stance: null, rerun: true }, { lens: 'market', source: 'n.example', title: 'Shampoo backlash grows', text: '', url: 'https://n.example/k1', published_at: ago(3), kind: 'news', tier: 4, rail: 'gather', entity: null, stance: 'against', rerun: true }]; });
const qB = quiet();
const bRes = (await S2({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn', 'exa'], corpus: sCorpus.map(c => Object.assign({}, c, { rail: 'gather' })) }, {}, '')).data;
qB.done();
const bLines = sCall.prompt.split('\n').filter(l => /^\[\d+\]/.test(l));
ok(globalThis.framedAsked.join() === 'competitors,counter' && bLines.some(l => /\(competitor: &honey\)/.test(l)) && bLines.some(l => /\(counter\)/.test(l)) && bRes.harvest.framed.asked.length === 2 && bRes.harvest.framed.added === 2,
  'B2 when the gather reported the competitive set and the counter view late, synthesize asks them again; their lines reach the evidence with their tags and the receipts say so');
const qB2 = quiet(); globalThis.framedAsked = null;
const tagged = [{ lens: 'market', title: 'Being opens at Target', text: 'x', url: 'https://t.example/1', source: 's', tier: 4, published_at: ago(1), kind: 'news', rail: 'gather', entity: 'Being' }, { lens: 'market', title: 'Shampoo backlash', text: 'x', url: 'https://t.example/2', source: 's', tier: 4, published_at: ago(1), kind: 'news', rail: 'gather', stance: 'against' }];
await S2({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn', 'exa', 'competitors', 'counter'], corpus: sCorpus.map(c => Object.assign({}, c, { rail: 'gather' })).concat(tagged) }, {}, '');
qB2.done();
ok(globalThis.framedAsked === null, 'B2b when the gather ran them and their lines reached the corpus, nothing is asked twice');
const qB3 = quiet(); globalThis.framedAsked = null;
await S2({ query: 'gen z hair care', mode: 'report', rails: ['gdelt', 'hn', 'exa', 'competitors', 'counter'], corpus: sCorpus.map(c => Object.assign({}, c, { rail: 'gather' })) }, {}, '');
qB3.done();
ok(globalThis.framedAsked && globalThis.framedAsked.join() === 'competitors,counter', 'B2c a rail that "ran" but delivered no tagged line (GDELT answered 429 as an empty list) is asked again all the same');
// B1b a GDELT caller whose turn is too far away takes no slot and answers quietly.
RF.GDELT_SPACE.GAP_MS = 400; RF.GDELT_SPACE.MAX_WAIT_MS = 500; rfCalls.length = 0; await new Promise(r => setTimeout(r, 450));   // B1's reservations expire
const burst = await Promise.all(Array.from({ length: 5 }, (_, i) => RF.railFetch('https://api.gdeltproject.org/api/v2/doc/doc?burst' + i)));
ok(burst.filter(Boolean).length === 2 && burst.filter(x => x === null).length === 3 && rfCalls.length === 2, 'B1b five GDELT calls at once with room for two: two go out in turn, three answer null at once instead of waiting past their deadline');
ok(Array.isArray(bRes.timing.detail) && bRes.timing.detail[0].pass === 'first' && bRes.timing.detail[0].parsed === 'whole', 'B3 the read carries the detail of each pass: lane, stop reason, size, how it parsed');
// B4 the frame names its territory; share is stated only when the lake agrees.
ok(H.excTerritoryOf({ category: 'Hair care', audience: 'Gen Z' }) === 'fashion-beauty' && H.excTerritoryOf({ category: 'Athletic footwear', anchors: ['sneakers'] }) === 'sneakers-streetwear' && H.excTerritoryOf({ category: 'Quantum widgets' }) === null,
  'B4 a frame names its territory from its own words');
const mTech = H.excMeasureFrom(rows.map(r => Object.assign({}, r, { territory: 'technology-innovation' })), terr, Date.now(), 'fashion-beauty');
ok(mTech.territory === 'fashion-beauty' && mTech.share_pct === null && mTech.territory_agree === false, 'B4b when the lake labels the frame\'s rows elsewhere, the frame\'s territory stands and no share is stated');
const mNone = H.excMeasureFrom(rows.map(r => Object.assign({}, r, { territory: null })), terr, Date.now(), 'fashion-beauty');
ok(mNone.territory === 'fashion-beauty' && mNone.share_pct === null && /weeks touched/.test(H.excMeasureLine(mNone)) && !/share of/.test(H.excMeasureLine(mNone)), 'B4c when the lake\'s rows carry no label at all, no share is stated (an unlabeled lake is no witness), and the line says the rest');
ok(H.excTerritoryOf({ category: 'Private label snacks' }) === 'food-hospitality' && H.excTerritoryOf({ category: 'Streaming series', anchors: ['music'] }) === 'music', 'B4d hints are whole words; the category speaks before the anchors');
// B5 "this week 1%" is a measure, not a week number; the measures line phrases its counts so the checker reads them.
ok(H.excGround('The spike is 1% of the territory and 5 signals', [{ text: H.excMeasureLine(Object.assign({}, m, { share_pct: 1, recent_7d: 5 })) }]).ungrounded.length === 0, 'B5 a share from MEASURES grounds a percent in the read; a count after "this week" is not eaten as a week number');
// B6 the record law on the line and in the law.
ok(/\(record\)/.test(H.excLine({ title: 'Mintel 2024', text: 'x', tier: 1, published_at: '2024-03-01' }, 0, Date.now())) && !/\(record\)/.test(H.excLine({ title: 'old blog', text: 'x', tier: 3, published_at: '2024-03-01' }, 0, Date.now())) && !/\(record\)/.test(H.excLine({ title: 'undated T1', text: 'x', tier: 1 }, 0, Date.now())) && /THE RECORD: an ARCHIVE line marked \(record\)/.test(H.EXC_TIME_LAW),
  'B6 a strong older line is marked (record), an undated one is not (the record has a year), and the time law says how to cite it');
// B8 a record line sharing a seated line's URL takes no second seat; the seat it empties is freed.
const seatedOpen = Array.from({ length: 12 }, (_, i) => ({ lens: 'market', title: 'fresh ' + i, url: 'https://f.example/' + i, source: 'f' + i, published_at: ago(i + 1), tier: 3 }));
const oldLake = Array.from({ length: 10 }, (_, i) => ({ lens: 'lake', title: 'lake old ' + i, url: 'https://lo.example/' + i, source: 'lo' + i, published_at: ago(900 + i), similarity: 0.7 }));
const dupRec = { lens: 'market', title: 'fresh 0 (study copy)', url: 'https://f.example/0', source: 'mintel', published_at: ago(800), tier: 1 };
const seatPlan = H.excBudget(oldLake.concat(seatedOpen, [dupRec], Array.from({ length: 40 }, (_, i) => ({ lens: 'market', title: 'd ' + i, url: 'https://d.example/' + i, source: 'd' + i, published_at: ago(i + 2), tier: 3 }))), [], Date.now());
const keys = seatPlan.merged.map(c => c.url);
ok(new Set(keys).size === keys.length && seatPlan.merged.length === 44, 'B8 the budget never seats one URL twice, record or not');
// B7 the desk takes a desk key, the field key as a fallback, or a signed-in admin.
const deskSrc = between(w, 'async function deskRunGuarded(', '/* ═');
const DK = new Function('json', 'authenticate', 'callerIsAdmin', 'themePass', 'doorPass', 'doorPublish', 'deskEdition', 'feedWarm', 'tracksRefresh', 'audiencesRefresh', 'backfillAttention', 'deskScore', 'THEME', 'excQuiet',
  deskSrc + '; return deskRunGuarded;')((o, st) => Object.assign({ _st: st }, o), async r => { if (r.headers.get('Authorization') === 'Bearer boom') throw new Error('supabase down'); return r.headers.get('Authorization') === 'Bearer admin' ? { id: 'u1' } : null; }, async () => true, async () => 0, async () => ({ queued: 1 }), async () => 0, async () => 0, async () => 0, async () => 0, async () => 0, async () => 0, async () => 0, {}, () => () => null);
const req = (h, body) => ({ headers: { get: k => h[k] || '' }, json: async () => body });
ok((await DK(req({ 'x-field-key': 'tav' }, { run: 'door' }), { FIELD_API_KEY: 'tav' }, '')).ok === true && (await DK(req({ 'x-field-key': 'tav' }, { run: 'door' }), { FIELD_API_KEY: 'tav', DESK_API_KEY: 'desk' }, '')).ok === false && (await DK(req({ 'x-desk-key': 'desk' }, { run: 'door' }), { FIELD_API_KEY: 'tav', DESK_API_KEY: 'desk' }, '')).ok === true && (await DK(req({ 'Authorization': 'Bearer admin' }, { run: 'door' }), { FIELD_API_KEY: 'tav' }, '')).ok === true && (await DK(req({}, { run: 'door' }), { FIELD_API_KEY: 'tav' }, '')).ok === false && (await DK(req({ 'Authorization': 'Bearer boom' }, { run: 'door' }), { FIELD_API_KEY: 'tav' }, '')).ok === false,
  'B7 the desk opens to its own key once set (the field key no longer), to the field key until then, and to a signed-in admin; never to no one, and a failed auth lookup is a 401, not a 500');

// ── V: EX5c, the voices and the visuals ───────────────────────────────────
const voiceSrc = between(w, 'const VOICES = {', '/* SEAM:EXC_GDELT_SPACE');
const VO = new Function('env1', 'stripHtml', 'EXC_GATE', voiceSrc + '; return { voiceSelf, voiceClean, voiceOnFrame, voiceAdd, VOICES };')(
  x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim(), x => String(x || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim(), { STOP: new Set(['care', 'brand']) });
const vf = { anchors: ['hair care', 'scalp', 'curls', 'gloss'], category: 'Hair care', competitors: ['&honey', 'Kristin Ess'] };
const say = t => { const c = VO.voiceClean(t); return { c, self: c ? VO.voiceSelf(c) : null, on: c ? VO.voiceOnFrame(c, vf) : null }; };
let v = say('As a 19 year old with 4c hair I finally found a routine that works, rosemary oil every night');
ok(v.self && v.self.generation === 'Gen Z' && v.self.trait === '4c hair' && !('age' in v.self) && v.on === true, 'V1 a stated age becomes a generation (the number itself is never kept); a stated hair type is a trait; the frame is named');
v = say("I'm 16 and my scalp is so dry, is this safe for teens??");
ok(v.self && v.self.generation === 'Gen Z' && JSON.stringify(v.self).indexOf('16') < 0, 'V1b a stated age under 18 folds into its generation and the number is never kept');
v = say('im a mom of two girls and we switched to &honey after the ulta trip, their curls love it');
ok(v.self && v.self.gender === 'woman' && v.self.role === 'parent' && v.on === true, 'V2 "mom" is a woman and a parent, by her own word');
v = say('Speaking as a hairstylist in Texas, the single dose scalp shots are a gimmick');
ok(v.self && v.self.role === 'stylist' && v.self.place === 'US (Texas)', 'V3 a stated trade and a stated place, no finer than a state');
v = say('us millennials did this in 2012 lol, nothing new');
ok(v.self && v.self.generation === 'Millennial' && v.on === false, 'V4 a stated generation; a quote that never names the frame is marked off it, not dropped');
ok(VO.voiceClean('email me at test@example.com for the code') === null && VO.voiceClean('call me 312-555-0199 for details') === null && VO.voiceClean('ok') === null, 'V5 a quote carrying an email or a phone number is dropped whole; so is a quote too short to mean anything');
ok(VO.voiceClean('@beautyguru99 you are right, the gloss is viral https://youtu.be/x') === 'you are right, the gloss is viral' && VO.voiceClean('<b>Love</b> this &amp; the price') === 'Love this & the price', 'V6 handles and links are stripped, markup is removed, an ampersand survives');
ok(VO.voiceSelf('this product is for women with curly hair') === null && VO.voiceSelf('my daughter is 14 and loves it') === null, 'V7 a word about someone else, or about the product, is not a self-description');
ok(VO.voiceSelf("I'm 20 minutes into this video and already sold") === null && VO.voiceSelf("I'm 95 percent sure this is a dupe") === null && VO.voiceSelf("I'm 20 years into this industry") === null && VO.voiceSelf('retire at 65 years old') === null && VO.voiceSelf("I'm 50 50 on this") === null && VO.voiceSelf("I'm 10 out of 10 recommending") === null,
  'V7b a number that is not an age is not an age');
ok(VO.voiceSelf("I'm a millennial and this is my routine").generation === 'Millennial' && VO.voiceSelf('I got this from a boomer') === null && VO.voiceSelf('they sell this in canada') === null && VO.voiceSelf('popular in japan') === null && VO.voiceSelf("I'm in Canada and we get it at Shoppers").place === 'Canada',
  'V7c the common phrasings count ("I\'m a millennial"), hearsay and geography about the product do not');
ok(VO.voiceSelf("I'm obsessed with curly hair content") === null && VO.voiceSelf("I'm done with dry skin products") === null && VO.voiceSelf("I'm a girl dad and this helped") === null && VO.voiceSelf("I'm a doctor's daughter") === null && VO.voiceSelf("as a 24 year old guy with thinning hair this helped").trait === 'thinning hair',
  'V7d a verb phrase with "with" is not a trait; "girl dad" is not a woman; "doctor\'s daughter" is not a practitioner; a 24 year old guy with thinning hair is');
ok(VO.voiceClean("I\u2019m 25 and this is my routine") === "I'm 25 and this is my routine" && VO.voiceSelf(VO.voiceClean("I\u2019m 25 and this is my routine")).generation === 'Gen Z' && VO.voiceClean('the study ran 2024-10-03 to 2025-01-01 and found it works') !== null && VO.voiceClean('10 20 30 40 50 reps on the scalp massager') !== null,
  'V7e a curly apostrophe is an apostrophe; a date or a run of reps is not a phone number');
ok(VO.voiceClean('<p><span class="h-card"><a href="https://m.example/@alice" class="u-url mention">@<span>alice</span></a></span> thanks for sharing the routine</p>') === 'thanks for sharing the routine' && VO.voiceClean('@john-doe_99 said the same thing about the gloss') === 'said the same thing about the gloss',
  'V7f a Mastodon mention and a hyphenated handle leave no trace');
ok(VO.voiceOnFrame('anything', null) === null && VO.voiceOnFrame('anything', { anchors: [] }) === null, 'V7g without a frame a quote is neither on nor off it');
ok(VO.voiceClean('new routine for <a href="https://m.example/tags/curlyhair" class="mention hashtag" rel="tag">#<span>curlyhair</span></a> with the gloss') === 'new routine for #curlyhair with the gloss' && VO.voiceSelf("I'm 10 years older than my sister") === null && VO.voiceSelf("I'm 25 years sober") === null && VO.voiceSelf('as a brand in canada we see it') === null && VO.voiceSelf("I'm a sucker for anything in japan") === null && VO.voiceSelf('as a licensed stylist based in canada').place === 'Canada',
  'V7h a hashtag survives the mention stripper; a span of years is not an age; a place reaches the speaker only through a stated role or gender');
ok(!/snippet\.authorDisplayName|authorChannelId|authorProfileImageUrl|\.account\.(?:username|acct|display_name)/.test(between(w, '  async mastodon(env, q, ctx, rail) {', '  async kg(env, q, ctx, rail) {')), 'V8 the rails never read a commenter\'s name, channel or avatar');
ok(/if \(p\.sensitive \|\| p\.spoiler_text\) continue;/.test(w) && /if \(!text \|\| !looksEnglish\(text\)\) continue;/.test(w) && !/channel: env1\(v\.snippet\.channelTitle/.test(w), 'V8b a sensitive or spoilered post stays out, so does another language; the video source carries no channel');
ok(/maxResults=' \+ VOICES\.PER_VIDEO/.test(w) && /vids\.slice\(0, VOICES\.VIDEOS\)/.test(w) && VO.VOICES.PER_VIDEO === 100 && VO.VOICES.VIDEOS === 3 && /\?limit=' \+ VOICES\.POSTS/.test(w) && /voices \|\| \(ctx\.meta\.voices = \{ sources: \[\], quotes: \[\] \}\)/.test(w),
  'V9 YouTube asks for a hundred comments on each of the top three videos and Mastodon for forty posts; every quote rides the gather meta as a voice');
// the lines and the competitors
ok(/lines: merged\.map\(\(c, i\) => \{ const d = excWhen\(c\); return \{ n: i \+ 1, title/.test(w) && /competitor: c\.entity \? String\(c\.entity\)\.slice\(0, 40\) : null, counter: c\.stance === 'against', record: excRecord\(c, now\)/.test(w) && /image: \/\^https:\\\/\\\/\/\.test\(String\(c\.image \|\| ''\)\)/.test(w),
  'V10 every read carries its lines, small: number, title, date, band, tier, lens, source, url, an https image, and the marks (competitor, counter, record, gap, page, facts)');
ok(/const rows2 = \(await sbRest\(env, 'signals\?status=neq\.rejected&' \+ ilikeOr\(names\)/.test(w) && /m\.competitors = names\.map\(nm => \{ const k = nm\.toLowerCase\(\); const mm = excMeasureFrom\(rows2\.filter\(r => String\(r\.title \|\| ''\)\.toLowerCase\(\)\.includes\(k\)\)/.test(w),
  'V11 the measures count up to five competitors the same way, in one query bucketed by name, on the same twelve weeks');

// ── W: the page ───────────────────────────────────────────────────────────
ok(/function _timeline\(lines, W\)/.test(page) && /function _competitorRow\(ms\)/.test(page) && /function _voicesPull\(voices, k\)/.test(page) && /function _renderVoices\(meta\)/.test(page) && /class="rb-pics"/.test(page) && /class="move-play"/.test(page) && /lines:syn&&syn\.lines\|\|null/.test(page) && /image:it\.image\|\|null \}\);/.test(page),
  'W-1 the page draws the timeline, the competitive set, the pull-quotes and the voices panel, shows the sources\' images, offers to picture a move in PLAY, and forwards lines and images');
ok(/self-described: /.test(page) && /never a name/.test(page) && !/authorDisplayName/.test(page) && /data-key="\$\{safeAttr\(c\.key\)\}"/.test(page) && !/onclick="_voiceFilterSet\('\$\{/.test(page) && /not read through a frame/.test(page) && /data-url="\$\{safeUrl\(l\.url\)\}"/.test(page) && /window\._voiceView=\{ filter:'frame', shown:12 \};\n/.test(page),
  'W-2 the voices panel labels self-descriptions as the speaker\'s own, filters through data attributes (never a label inside a handler), says when no frame read the quotes, opens only a checked url, and starts clean on each search');
ok(/SEAM:READ_BRIEF/.test(page) && /class="rb-plate"/.test(page) && /class="rb-measures"/.test(page) && /class="rb-receipts"/.test(page) && /class="rb-wire"/.test(page) && /id="results-grid-all"/.test(page) && /FROM THE RECORD/.test(page),
  'W0 THE READ renders as a brief (plate, measures strip, receipts rail, wire aside), the findings sit in one grid, and a record line says so on its card');
ok(!/#live-results\.show-all \.results-lens-panel:not\(#rlp-truth\)\{display:block/.test(page) && /#live-results\.show-all \.results-lens-panel\{display:none;\}/.test(page) && /#live-results\.show-all #rlp-findings\{display:block/.test(page) && /querySelectorAll\('#read-block \.read-line'\)/.test(page) && /r\.id==='competitors'\|\|r\.id==='counter'\)&&!\(r\.n>0\)/.test(page),
  'W0c under All Lenses the per-lens panels stay hidden (the older rule that re-showed them is gone), MAKE WITH PLAY takes the two read lines, and a framed rail counts as run only when it answered');
ok(!/T\(_fetchJSON\(`https:\/\/api\.gdeltproject\.org/.test(page) && /unsurfaced_fi_v5/.test(page) && /class="rb-go-live"/.test(page) && !/<button class="read-deeper"/.test(page) && /pass \$\{i\+1\} on/.test(page),
  'W0b the browser no longer asks GDELT in the live lenses, the door cache key moved on, the go-live button no longer wears the buttons strip\'s class, and the receipts say why a read took two passes');
ok(/function _renderDoorCard\(t, i\)/.test(page) && /function _sparkline\(series, w, h\)/.test(page) && /function _openDoorRead\(t\)/.test(page) && /function _goDeeperLive\(\)/.test(page) && /_FI_LAKE\.door\.tiles\.find\(t => t\.id === id\)/.test(page),
  'W1 the page draws door tiles, opens a stored read, and offers the live read on demand');
ok(!/<img class="card-img"[^\n]*fi-door/.test(page) && /class="fi-spark-line"/.test(page) && /fi-measures/.test(page) && /THE MOVE/.test(page), 'W2 a door tile has a sparkline, a measures row and the move, and no photo');
ok(/\/excavate\/door\/read\?id=/.test(page) && /Sign in to open the read/.test(page) && /Go deeper, live/.test(page), 'W3 a stored read is fetched signed in, and the page says so when it is not');
ok(/rows\.push\(\['pages'/.test(page) && /rows\.push\(\['gap check'/.test(page) && /rows\.push\(\['fact table'/.test(page) && /silent<\/summary>/.test(page) && /class="rb-score"/.test(page) && /'seen beside it'/.test(page) && /what was set aside<\/summary>/.test(page),
  'W4 the receipts rail carries the harvest (pages, gap, fact table), the silent rails, the score, the observed competitors, and what was set aside');
ok(/set aside as off-topic/.test(page) && /names the frame; the conversation here is elsewhere/.test(page), 'W5 Consumer Voice is read through the frame and says when nothing in it names the frame');
ok(/score:d\.score\|\|null, harvest:d\.harvest\|\|null/.test(page) && /harvest \$\{mA==null\?'n\/a':mA\} → \$\{mB==null\?'n\/a':mB\}/.test(page), 'W6 the panel keeps the score and the tally shows the mean before and after');
ok(!/—/.test(doorSrc) && !/—/.test(between(w, 'const EXC_TIERS = ', 'function excMoveGuard(')) && !/—/.test(between(w, '/* SEAM:EXC_TIERS: the registry, loaded once an hour.', '/* SEAM:EXCAVATE_MEANING: the report contract.')), 'W7 no em dash in the new code');
console.log('\nproof_excavate_harvest: ' + pass + ' checks PASS');
