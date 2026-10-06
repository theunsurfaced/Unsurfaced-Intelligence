/**
 * proof_read_report.mjs  --  EX7 THE REPORT: the research-grade read.
 * Drives the shipped blocks on fakes. Run from the repo root: node worker/proofs/proof_read_report.mjs
 *   M  migration 0034: the kind, the stats function
 *   K  the kind, the contract, the window
 *   L  the pack lines, the spread, the extra ids
 *   V  the landing law with lake ids; the supports law; the momentum law
 *   P  the pack is fetched and kept on the row; receipts resolve every id kind
 *   R  the route, the tick, the ground, the desk
 *   G  the page: the research layout from a fixture
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0034_report.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const quiet = () => { const o = console.log; const logs = []; console.log = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; } }; };

// ── M: the migration ──────────────────────────────────────────────────
ok(/check \(kind in \('weekly', 'monthly', 'record', 'report'\)\)/.test(mig) && /create or replace function public\.house_report_stats\(p_start date, p_end date\)/.test(mig),
  'M1 0034 adds the report kind and the report stats function');
ok(/'daily', public\.house_read_stats\(p_start, p_end\)/.test(mig) && /'momentum'/.test(mig) && /'by_territory_week'/.test(mig) && /'by_week'/.test(mig) && /'record', \(select count\(\*\) from sig, win where sig\.at < win\.s and sig\.source_tier <= 1\)/.test(mig),
  'M2 the stats carry the weekly numbers inside, momentum per territory, the weekly series, and the record count');
ok(/>= '2001-01-01'/.test(mig) && /revoke all on function public\.house_report_stats/.test(mig), 'M3 undated placeholders stay out of every count; the function is service-role only');
ok(!/—/.test(mig), 'M4 no em dash in the migration');

// ── K: kind, contract, window ─────────────────────────────────────────
const engine = between(w, 'const HOUSE_READ = {', '/* Called by claudeBatchDrain when a house_* job lands. */');
const helpers = between(w, 'function readIso(', 'function readWindow(');
const trim = between(w, 'function studioTrimClean(', 'function studioComplete(');
let sb = [], fixtures = {};
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
let ytCalls = [], maCalls = [];
const RAILS = [{ id: 'youtube', name: 'YouTube', tier: 3, kind: 'discourse' }, { id: 'mastodon', name: 'Mastodon', tier: 3, kind: 'discourse' }];
const RAIL_FNS = {
  youtube: async (env, q, ctx, rail) => { ytCalls.push(q); const v = ctx.meta.voices || (ctx.meta.voices = { sources: [], quotes: [] }); v.sources.push({ id: 'yt:' + q, source: 'YouTube', title: 'video on ' + q, url: 'https://www.youtube.com/watch?v=' + q.replace(/\W/g, ''), published_at: '2026-09-10', n: 2 });
    v.quotes.push({ src: 'yt:' + q, text: 'As a 22 year old woman my curls finally behave with ' + q, likes: 40, when: '2026-09-11', self: { generation: 'Gen Z', gender: 'woman' }, on_frame: null });
    v.quotes.push({ src: 'yt:' + q, text: 'Same quote text repeated', likes: 9, when: '2026-09-12', self: null, on_frame: null }); return []; },
  mastodon: async (env, q, ctx, rail) => { maCalls.push(q); const v = ctx.meta.voices || (ctx.meta.voices = { sources: [], quotes: [] }); v.sources.push({ id: 'mast:' + q, source: 'Mastodon', title: '#' + q, url: 'https://mastodon.social/tags/' + q, published_at: '2026-09-10', n: 1 });
    v.quotes.push({ src: 'mast:' + q, text: 'Posted about ' + q + ' from Texas as a dad', likes: 3, when: '2026-09-13', self: { role: 'parent', place: 'Texas' }, on_frame: null }); return []; }
};
const E = new Function('sbRest', 'RAILS', 'RAIL_FNS', 'excFrameLabel', 'claudeBatchSubmit', 'logEvent',
  'const READ_METHOD = "METHOD";' + trim + helpers + engine + '; return { HOUSE_READ, READ_REPORT, READ_CONTRACT, readReportWindow, readWindow, readReportLakeLine, readReportRecordLine, readReportThemeLine, readReportFrameLine, readReportReadLine, readReportVoiceLine, readReportSpread, readReportVoices, readReportPack, readReportExtraIds, readSupports, readMomentum, readValidate, readSubmit, readReportShape, READ_BASELINE, readReportVoiceQueries, readReportVoiceKeep };')(
  sbRest, RAILS, RAIL_FNS, f => f.entity ? f.entity + ' in ' + String(f.category || '').toLowerCase() : (f.title || ''), async () => ({ ok: true, batch_id: 'b9', est_usd: 1.2 }), () => {});
ok(/MAX_TOKENS: 128000,/.test(w) && E.HOUSE_READ.KINDS.report && E.HOUSE_READ.KINDS.report.max_tokens === 120000 && E.HOUSE_READ.KINDS.report.effort === 'high' && E.HOUSE_READ.KINDS.report.child === 'monthly',
  'K1 the report kind has room for a long write with its thinking (120000, and the lane ceiling is 128000 so nothing clamps it) at high effort and builds on the monthlies');
const C = E.READ_CONTRACT.report;
ok(['"title"', '"subtitle"', '"thesis"', '"executive_summary"', '"method"', '"by_the_numbers"', '"cover_image"', '"findings"', '"what_the_data_shows"', '"means"', '"confidence"', '"strength"', '"trigger"', '"territories"', '"competitive_sets"', '"consumer_voice"', '"the_record"', '"cross_currents"', '"contradiction"', '"whitespace"', '"advertising_read"', '"outlook"', '"next_30"', '"next_90"', '"glossary"', '"social"', '"ground_line"'].every(k => C.includes(k)),
  'K2 the contract asks for every section of a research report');
ok(/at least 2 lines from 2 different outlets/.test(C) && /momentum is set by the database/.test(C) && /Cite only ids given/.test(C) && !/—/.test(C), 'K3 the contract states the supports law, leaves momentum to the database, forbids invented ids and em dashes');
const win = E.readReportWindow('2026-07-08', '2026-10-03');
ok(win.start === '2026-07-08' && win.end === '2026-10-03' && win.label === 'Jul 8 to Oct 3, 2026' && E.readReportWindow('2026-10-03', '2026-07-08') === null && E.readReportWindow('x', '2026-07-08') === null && E.readWindow('report', '2026-07-08') === null,
  'K4 the report window is explicit, both ends inclusive, labeled; a backwards or unreadable window is refused; readWindow has no default for it');
ok(E.readReportWindow('2025-12-20', '2026-01-05').label === 'Dec 20, 2025 to Jan 5, 2026', 'K5 a window across years names both');

// ── L: the lines ──────────────────────────────────────────────────────
const lk = E.readReportLakeLine(3, { title: 'Curl aisle  grows', summary: 'Shelf space up', source_name: 'Reuters', source_tier: 1, territory: 'fashion-beauty', published_at: '2026-09-12T08:00:00Z' });
ok(lk === 'L3 | 2026-09-12 | fashion-beauty | T1 | Curl aisle grows | Shelf space up | Reuters', 'L1 a lake line: id, date, territory, tier, title, summary, source');
ok(/^R1 \| 2024-06-01 \| fashion-beauty \| T1 \| McKinsey beauty report \| McKinsey \| \(record: older than the window\)$/.test(E.readReportRecordLine(1, { title: 'McKinsey beauty report', source_name: 'McKinsey', source_tier: 1, territory: 'fashion-beauty', published_at: '2024-06-01' })),
  'L2 a record line says it is older than the window');
ok(E.readReportThemeLine(2, { title: 'Texture-first shelves', territory: 'fashion-beauty', n: 15, n_prior: 4, n_total: 31, first: '2026-09-02', last: '2026-09-30', weeks: [3, 3, 4, 3, 2] }) === 'T2 | Texture-first shelves | fashion-beauty | 15 signals in the window, 4 in the prior window, 31 all time | first 2026-09-02, last 2026-09-30 | by week: 3,3,4,3,2',
  'L3 a theme line carries the counts and the weekly series from STATS');
ok(/^D1 \| 2026-09-20 \| Nike in athletic footwear \| CLAIM: Nike held the shelf\. \| MOVE: Gate the drop \| MEASURED: 9 signals this week, 3 the week before, 4 outlets, 5 of 12 weeks touched$/.test(
  E.readReportFrameLine(1, { night: '2026-09-20', frame: { entity: 'Nike', category: 'Athletic footwear' }, measures: { recent_7d: 9, prior_7d: 3, outlets: 4, weeks_touched: 5, weeks: 12 }, read: { read: ['Nike held the shelf.', 'x'], ideas: [{ headline: 'Gate the drop' }] } })),
  'L4 a frame line carries the label, the claim, the move and the measured counts');
ok(E.readReportReadLine(1, { created_at: '2026-10-03T01:00:00Z', query: 'gen z hair care', read: ['Curls win.', 'Put it on the endcap.'], insights: [{ title: 'Shelves sort by curl' }, { title: 'Labels are read' }] }) === 'X1 | 2026-10-03 | QUERY: gen z hair care | READ: Curls win. Put it on the endcap. | FINDINGS: Shelves sort by curl; Labels are read',
  'L5 a read line carries the query, the two lines and the finding titles');
ok(E.readReportVoiceLine(4, { source: 'YouTube', likes: 40, when: '2026-09-11', self: { generation: 'Gen Z', gender: 'woman', place: 'Texas' }, text: 'my curls finally behave' }) === 'V4 | YouTube | 40 likes | 2026-09-11 | Gen Z, woman, Texas | "my curls finally behave"' &&
  /no self-description/.test(E.readReportVoiceLine(5, { source: 'Mastodon', text: 'x', self: null })), 'L6 a voice line carries only what the speaker said about themselves, never a name or a handle');
const spread = E.readReportSpread([
  { id: 'a', territory: 'music', source_tier: 3, published_at: '2026-09-01' }, { id: 'b', territory: 'music', source_tier: 1, published_at: '2026-08-01' },
  { id: 'c', territory: 'fashion-beauty', source_tier: 2, published_at: '2026-09-05' }, { id: 'd', territory: 'music', source_tier: 1, published_at: '2026-09-09' },
  { id: 'e', territory: null, source_tier: 2, published_at: '2026-09-02' }], 4);
ok(spread.map(r => r.id).join() === 'd,c,e,b', 'L7 the lake is spread across territories round robin, best tier then newest inside each, the unassigned bucket included');
ok(E.readReportExtraIds({ ids: { L: ['u1', 'u2'], R: ['u3'], T: [], D: ['u4'], X: [], V: 2 } }).join() === 'L1,L2,R1,D1,V1,V2' && E.readReportExtraIds(null).length === 0, 'L8 every extra id the read may cite is enumerated from the pack');

// ── V: the laws on landing ───────────────────────────────────────────
const ground = JSON.stringify({ lake: { signals: 812, by_territory: { music: 140 } } }) + '\nS11 Sabrina sold 2,400 tickets 2026-09-21\nL1 | 2026-09-12 | music | T1 | Tour grosses 48 million | Reuters';
const read = { title: 'Proximity is the product', thesis: 'People pay to be near.', findings: [
  { name: 'A', evidence: ['S11', 'L1', 'L9'], what_the_data_shows: 'Music carried 140 signals of 812.', confidence: 'high', strength: 'pattern', trigger: 'More than 200 music signals in a week', moves: { creative: 'a 15-second cut' } },
  { name: 'B', evidence: ['S11', 'S12'], what_the_data_shows: '2,400 tickets.', confidence: 'high', strength: 'pattern' },
  { name: 'C', evidence: ['R1', 'L1'], confidence: 'medium', strength: 'pattern' }],
  consumer_voice: { line: 'x', quotes: ['V1', 'V7'], by_generation: [{ generation: 'Gen Z', line: 'y', quotes: ['V1'] }] },
  territories: [{ territory: 'music', headline: 'h', line: 'l', evidence: ['L1'], momentum: 'cooling' }, { territory: 'nowhere', headline: 'h', line: 'l' }],
  glossary: [{ term: 'Gen Z', definition: 'Born 1997 to 2012.' }], the_record: { line: 'r', evidence: ['R1', 'R5'] } };
const v = E.readValidate('report', JSON.parse(JSON.stringify(read)), ground, [11, 12], ['L1', 'R1', 'V1', 'D1']);
ok(v.fatal.length === 0 && v.read.findings[0].evidence.join() === 'S11,L1' && v.read.consumer_voice.quotes.join() === 'V1' && v.read.consumer_voice.by_generation[0].quotes.join() === 'V1' && v.read.the_record.evidence.join() === 'R1' && v.notes.includes('evidence_ids_dropped:3'),
  'V1 lake, record and voice ids ride beside the S-ids; unknown ids drop from evidence and from quotes; the numbers read from STATS and the lines pass');
ok(!v.fatal.length && E.readValidate('report', { title: 't', thesis: 't', findings: [{ name: 'x', what_the_data_shows: 'Music carried 999 signals.' }] }, ground, [], []).fatal[0] === 'number_not_in_evidence:findings[0].what_the_data_shows:999',
  'V2 a trigger threshold and a glossary year are not data; a number in what_the_data_shows must be in the ground');
const outletOf = id => ({ S11: 'Billboard', S12: 'Billboard', L1: 'Reuters' })[id] || null, datedIn = id => ['S11', 'S12', 'L1'].includes(id);
const sup = E.readSupports(v.read, outletOf, datedIn);
ok(v.read.findings[0].strength === 'pattern' && v.read.findings[0].confidence === 'high' && v.read.findings[0].supports.lines === 2 && v.read.findings[0].supports.outlets === 2,
  'V3 a finding on two dated lines from two outlets stands as a pattern');
ok(v.read.findings[1].strength === 'signal' && v.read.findings[1].confidence === 'medium' && sup.notes.includes('finding_downgraded:2:2_lines_1_outlets'), 'V4 two lines from one outlet is a signal; high confidence steps down to medium; the note names it');
ok(v.read.findings[2].strength === 'signal' && v.read.findings[2].supports.lines === 1 && v.read.findings[2].supports.record === 1 && sup.notes.includes('finding_downgraded:3:1_lines_1_outlets'), 'V5 the record never counts as a support');
const mo = E.readMomentum(v.read, { momentum: { music: 'rising' }, lake: { by_territory: { music: 140 }, by_territory_prior: { music: 90 } } });
ok(v.read.territories.length === 1 && v.read.territories[0].momentum === 'rising' && v.read.territories[0].n === 140 && v.read.territories[0].n_prior === 90 && mo.notes.includes('territory_unknown:nowhere'),
  'V6 momentum is the database\'s word, never the writer\'s; a territory the stats do not know is dropped and noted');
// ── B: the baseline law and the shape of the period ───────────────────
const serial = '{"lake":{"signals":20729,"signals_prior":89,"by_territory":{"music":3632},"by_territory_week":{"music":[120,273,336,301,290,310,60]}}}';
ok(!E.readValidate('report', { title: 't', thesis: 't', findings: [{ name: 'x', what_the_data_shows: 'Music held between 273 and 336 a week, 20,729 in all.' }] }, serial, [], []).fatal.length
  && E.readValidate('report', { title: 't', thesis: 't', findings: [{ name: 'x', what_the_data_shows: 'Music held at 999 a week.' }] }, serial, [], []).fatal[0] === 'number_not_in_evidence:findings[0].what_the_data_shows:999'
  && E.readValidate('report', { title: 't', thesis: 't', findings: [{ name: 'x', what_the_data_shows: 'Music held at 729 a week.' }] }, 'Signals: 20,729 in all. [120,273]', [], []).fatal[0] === 'number_not_in_evidence:findings[0].what_the_data_shows:729',
  'B1 every member of a serialized series is a real number ([273,336] admits 273 and 336); an invented figure is still held; a figure in prose never admits its own tail (20,729 is not 729)');
const sh = E.readReportShape(JSON.parse(serial));
ok(sh.lake.prior_comparable === false && sh.lake.shape.music.n === 3632 && sh.lake.shape.music.share_pct === 18 && sh.lake.shape.music.weeks === 5 && sh.lake.shape.music.week_high === 336 && sh.lake.shape.music.week_low === 273 && sh.lake.shape.music.direction === 'holding',
  'B2 a period before thinner than a fifth is no baseline; the shape reads the interior weeks: share, high, low, direction');
const sh2 = E.readReportShape({ lake: { signals: 20729, signals_prior: 6000, by_territory: { music: 3632, unassigned: 5 }, by_territory_week: { music: [100, 200, 300] } } });
ok(sh2.lake.prior_comparable === true && !sh2.lake.shape.unassigned && sh2.lake.shape.music.weeks === 3 && sh2.lake.shape.music.direction === 'rising' && E.readReportShape({ lake: { by_territory: {} } }).lake.prior_comparable === undefined && E.readReportShape(null) && E.READ_BASELINE.MIN === 50,
  'B3 a real prior is a baseline; three weeks read whole; rising when the second half beats the first by a seventh; no count, no verdict; unassigned is no territory');
const mt = E.readMomentum({ territories: [{ territory: 'music', line: 'x' }] }, { momentum: { music: 'new' }, lake: { signals: 20729, signals_prior: 89, by_territory: { music: 3632 }, by_territory_prior: { music: 1 }, by_territory_week: { music: [120, 273, 336, 301, 290, 310, 60] } } });
ok(mt.read.territories[0].momentum === 'holding' && mt.read.territories[0].n === 3632 && mt.read.territories[0].n_prior === null && mt.read.territories[0].share_pct === 18 && mt.read.territories[0].week_high === 336 && mt.read.territories[0].week_low === 273,
  'B4 without a baseline the direction is the momentum (never new), the prior is withheld, share and the high and low week ride on the territory');
ok(/The baseline law: when STATS\.lake\.prior_comparable is false, the period before is not a baseline/.test(E.READ_CONTRACT.report) && /never from your own arithmetic/.test(E.READ_CONTRACT.report) && /STATS\.lake\.shape/.test(E.READ_CONTRACT.report),
  'B5 the report contract carries the baseline law and sends the writer to the shape for every weekly figure');
ok(/if \(report\) stats = readReportShape\(stats\);/.test(w) && /function rpComparable\(lake\)/.test(page) && /function rpShape\(t\)/.test(page) && /the record begins with this period/.test(page) && /SEAM:READ_BASELINE/.test(page) && /SEAM:READ_BASELINE/.test(w),
  'B6 the shape is written at submit; the page judges the baseline and prints the shape instead of a delta; the seam is tagged on both');

// ── E: the brief: recurrence, the counter-reading, reach and horizon, voices on purpose ──
const vq = E.readReportVoiceQueries({ lake: { by_territory: { music: 3632, 'art-design': 2586, unassigned: 5, 'food-hospitality': 43 } },
  themes: [{ title: 'Rogue agents', territory: 'technology-innovation' }, { title: 'Curl shelves', territory: 'art-design' }, { title: 'Presales', territory: 'music' }, { title: 'Second presale theme', territory: 'music' }, { title: 'Pop-ups', territory: 'food-hospitality' }] });
ok(JSON.stringify(vq) === JSON.stringify(['Presales', 'Curl shelves', 'Pop-ups', 'Rogue agents', 'Second presale theme']), 'E1 the voices are asked per territory first (the biggest theme in each of the largest territories), then by theme, without repeats');
const vk = E.readReportVoiceKeep([{ src: 'a', text: '1', when: '2026-09-01' }, { src: 'a', text: '2', when: '2023-05-01' }, { src: 'a', text: '3' }, { src: 'a', text: '4', when: '2026-07-01' }, { src: 'a', text: '5', when: '2026-08-01' }, { src: 'a', text: '6', when: '2026-08-02' }, { src: 'b', text: '7', when: '2026-04-05' }], '2026-10-03');
ok(vk.map(q => q.text).join(',') === '1,3,4,5' && !vk.some(q => q.text === '2') && !vk.some(q => q.text === '7'), 'E2 a voice older than six months before the period ends is dropped (2023 and April go), undated stays, at most four per thread');
const whereOf = id => ({ S11: { date: '2026-09-14', week: '2026-09-14', territory: 'music' }, S12: { date: '2026-09-22', week: '2026-09-21', territory: 'fashion-beauty' }, L1: { date: '2026-09-12', week: '2026-09-07', territory: 'music' } })[id] || null;
const rec = E.readSupports({ findings: [{ name: 'x', evidence: ['S11', 'S12', 'L1', 'R1'], strength: 'pattern', confidence: 'high' }] }, id => ({ S11: 'Billboard', S12: 'Retail Dive', L1: 'Reuters' })[id] || null, id => id !== 'R1', null, whereOf);
const sp = rec.read.findings[0].supports;
ok(sp.lines === 3 && sp.outlets === 3 && sp.weeks === 3 && JSON.stringify(sp.territories) === JSON.stringify(['fashion-beauty', 'music']) && JSON.stringify(sp.dates) === JSON.stringify(['2026-09-12', '2026-09-14', '2026-09-22']) && sp.record === 1,
  'E3 recurrence is computed from the cited evidence: outlets, weeks spanned, territories spanned, and the dated sources for the strip');
ok(/"against": \{"line": one sentence naming the strongest evidence that cuts against this finding/.test(E.READ_CONTRACT.report) && /"reach": "category"/.test(E.READ_CONTRACT.report) && /"horizon": "now", "quarter" or "year"/.test(E.READ_CONTRACT.report)
  && /"voices": \["V<id>", \.\.\.\] at most 2/.test(E.READ_CONTRACT.report) && /"groups": 2 to 4 objects \{"label"/.test(E.READ_CONTRACT.report) && /three to five sentences of figures only/.test(E.READ_CONTRACT.report) && /what a call is/.test(E.READ_CONTRACT.report)
  && /"against": one sentence naming the strongest evidence that cuts against this pattern/.test(E.READ_CONTRACT.weekly) && /"against": one sentence/.test(E.READ_CONTRACT.monthly),
  'E4 the contracts ask for the counter-reading, reach and horizon, voices on the finding, the voice groups, figures-only data, and what a call is; the weekly and monthly ask for the counter-reading too');
const vv = E.readValidate('report', { title: 't', thesis: 't', findings: [{ name: 'x', voices: ['V1', 'V9', 'S11'], evidence: ['S11'] }] }, 'g', [11], ['V1']);
ok(JSON.stringify(vv.read.findings[0].voices) === JSON.stringify(['V1']) && vv.notes.includes('evidence_ids_dropped:2'), 'E5 a voices array keeps only voices the pack gave');
ok(/function rpDots\(dates, win\)/.test(page) && /class="rp-recur">Recurrence/.test(page) && /WHAT CUTS AGAINST IT/.test(page) && /class="rp-pull"/.test(page) && /"The brief"/.test(page) && /class="rp-rec2"/.test(page)
  && /shown = ev\.slice\(0, 10\)/.test(page) && /seenImg\[u\] = 1/.test(page) && /CAP_NUM = function/.test(page) && /under 1%/.test(page) && !/\.rp-trig \{ font-family: var\(--mono\)/.test(page) && /\.cover-pick/.test(page) && /sellHtml\(\)/.test(page),
  'E6 the page prints the brief, the recurrence line, the dot strip, what cuts against, the pull quotes, ten sources then the rest at the back, distinct images, captions by number, under 1%, the trigger in body type, the cover pick and the sell verdict');
ok(/displayHeaderFooter: true, headerTemplate: '<span><\/span>', footerTemplate: readPdfFooter\(row\)/.test(w) && /REV: 'p3'/.test(w) && /@page \{ size: letter; margin: 0 0 0\.42in 0; \}/.test(page) && /@page :first \{ margin: 0; \}/.test(page),
  'E7 the PDF carries a running footer on every page but the cover, and the print revision moved so kept PDFs render again');

const lawsSrc = between(w, 'function readGroundOf(', 'async function readTick(');
const LAWS = new Function('readSupports', 'readMomentum', lawsSrc + '; return { readReportLaws, readReaderVoice };')(E.readSupports, E.readMomentum);
const rv = LAWS.readReaderVoice({ title: 'The lake moved', findings: [{ name: 'n', what_the_data_shows: 'The overnight frame measured it (D1).', evidence: ['D1'], moves: { exec: 'x' } }], by_the_numbers: [{ stat: 'lake.signals', line: 'ok' }], cover_image: 'S11' });
ok(rv.notes.includes('house_word:title:The lake') && rv.notes.includes('house_word:findings[0].what_the_data_shows:overnight frame') && rv.notes.includes('id_in_prose:findings[0].what_the_data_shows:D1') && rv.read.findings[0].what_the_data_shows === 'The overnight frame measured it (D1).' && rv.read.findings[0].evidence[0] === 'D1' && !rv.notes.some(n => /by_the_numbers\[0\]\.stat|cover_image/.test(n)),
  'V7 the reader law notes a house word or an id in prose by path and changes nothing; stat paths, ids in arrays and image ids are not prose');

// ── P: the pack, fetched and kept ────────────────────────────────────
const stats = { lake: { signals: 812 }, themes: [{ id: 'th1', title: 'Texture-first shelves', territory: 'fashion-beauty', n: 15, n_prior: 4, n_total: 31, first: '2026-09-02', last: '2026-09-30', weeks: [3, 3, 4, 3, 2] }, { id: 'th2', title: 'Proximity tours', territory: 'music', n: 12, n_prior: 12, n_total: 20, weeks: [2, 2, 4, 2, 2] }], momentum: { music: 'holding', 'fashion-beauty': 'rising' } };
fixtures = {
  'rpc/house_report_stats': () => stats,
  'editions?': () => [{ id: 1, issue_no: 70, date: '2026-09-14' }],
  'edition_items?': () => [{ id: 11, edition_id: 1, ord: 0, headline: 'Sabrina sells out', take: 'She sold 2,400 tickets.', territory: 'music', source_name: 'Billboard' }],
  'signals?status=neq.rejected&edition_item_id=is.null': path => { sb.lake = path; return [
    { id: 'u1', title: 'Tour grosses 48 million', summary: 's', source_name: 'Reuters', source_tier: 1, territory: 'music', published_at: '2026-09-12T08:00:00Z', url: 'https://r/1' },
    { id: 'u2', title: 'Curl aisle grows', summary: 's', source_name: 'Vogue', source_tier: 2, territory: 'fashion-beauty', published_at: '2026-09-05T08:00:00Z', url: 'https://v/2' },
    { id: 'u3', title: 'No title row', summary: 's', source_name: 'x', source_tier: 2, territory: 'music', published_at: '2026-09-06', url: 'https://x' }].map(r => r.id === 'u3' ? Object.assign(r, { title: null }) : r); },
  'signals?status=neq.rejected&source_tier=lte.1': path => { sb.record = path; return [{ id: 'u9', title: 'McKinsey beauty report', summary: 'The state of beauty', source_name: 'McKinsey', source_tier: 1, territory: 'fashion-beauty', published_at: '2024-06-01', url: 'https://m' }]; },
  'door_reads?': () => [{ id: 'd1', frame_key: 'theme:th1', night: '2026-09-20', frame: { entity: 'Nike', category: 'Athletic footwear' }, measures: { recent_7d: 9, prior_7d: 3, outlets: 4, weeks_touched: 5, weeks: 12 }, read: { read: ['Nike held the shelf.', 'x'], ideas: [{ headline: 'Gate the drop' }] } }],
  'reads?': () => [{ id: 'x1', query: 'gen z hair care', read: ['Curls win.', 'Endcap.'], insights: [{ title: 'Shelves sort by curl' }], created_at: '2026-10-03T01:00:00Z' }],
  'house_reads?kind=eq.monthly': () => [{ id: 40, label: 'September 2026', read: { title: 'Sept', thesis: 't', features: [{ name: 'f', what_happened: 'w', evidence: ['S11'] }], watch: 'w' }, version: 1 }],
  'house_reads?kind=eq.weekly': () => [],
  'house_reads?id=eq.': () => []
};
const row = { id: 77, kind: 'report', window_start: '2026-07-08', window_end: '2026-10-03', version: 1, label: 'Cultural Intelligence Report, Issue 001 (Jul 8 to Oct 3, 2026)', meta: { plan: 'manual', issue_no: 1 } };
sb = []; ytCalls = []; maCalls = [];
const q1 = quiet();
const sub = await E.readSubmit({}, row);
q1.done();
const patch = sb.find(x => x.opts && x.opts.method === "PATCH").opts.body;
const pk = patch.meta.pack;
ok(sub.ok && sub.pack.lake === 2 && sub.pack.record === 1 && sub.pack.themes === 2 && sub.pack.frames === 1 && sub.pack.reads === 1 && sub.pack.voices === 5 && sub.children === 1,
  'P1 the report submits with its lake, record, themes, frames, reads, voices and child reads counted');
ok(/published_at=gte\.2026-07-08&published_at=lt\.2026-10-04/.test(sb.lake) && /source_tier=lte\.3/.test(sb.lake) && /published_at=gte\.2001-01-01&published_at=lt\.2026-07-08/.test(sb.record) && sb.some(x => /rpc\/house_report_stats/.test(x.path)),
  'P2 the lake is the window (tier 3 and better, not published by DAILY); the record is before it and dated; the numbers come from house_report_stats');
ok(pk.ids.L.join() === 'u1,u2' && pk.ids.R.join() === 'u9' && pk.ids.T.join() === 'th1,th2' && pk.ids.D.join() === 'd1' && pk.ids.X.join() === 'x1' && pk.ids.V === 5 && pk.lines.L[0].source_name === 'Reuters' && pk.lines.D[0].label === 'Nike in athletic footwear' && pk.lines.D[0].claim === 'Nike held the shelf.',
  'P3 the row keeps every id and the lines behind them, so landing and receipts never gather again');
ok(ytCalls.join('|') === 'Texture-first shelves|Proximity tours' && maCalls.length === 2 && pk.voices.quotes.length === 5 && pk.voices.quotes[0].likes === 40 && pk.voices.quotes[0].source === 'YouTube' && pk.voices.quotes[0].url && !/@/.test(JSON.stringify(pk.voices)) && pk.voices.quotes.every(q => !q.name && !q.handle),
  'P4 voices are gathered on the biggest themes through the live rails, deduped by text across queries, ranked by likes, and carry no name or handle');
const prompt = sb.length ? null : null; void prompt;
ok(/LAKE SIGNALS \(2, the window, not published by DAILY\):\nL1 \| 2026-09-12 \| music \| T1 \| Tour grosses 48 million/.test(pk.text) && /THE RECORD \(1, older prominent sources/.test(pk.text) && /THEMES \(2, from STATS\):\nT1 \| Texture-first shelves/.test(pk.text) && /FRAMES \(1, the door's overnight reads\):\nD1 \| 2026-09-20/.test(pk.text) && /EXCAVATE READS \(1\):\nX1 \| 2026-10-03/.test(pk.text) && /CONSUMER VOICES \(5, verbatim, on: Texture-first shelves; Proximity tours\):\nV1 \| YouTube \| 40 likes/.test(pk.text),
  'P5 the pack text names every section with its count, and the ids count from one inside each');
ok(pk.text.length <= E.READ_REPORT.PACK_CHARS && patch.status === 'compiling' && patch.pack_ids.join() === '11', 'P6 the pack text is capped; the S-ids are kept as before');
const receiptsSrc = between(w, 'async function readReceipts(', '/* SEAM:READ_DESIGN image relay');
const RR = new Function('sbRest', receiptsSrc + '; return readReceipts;')(async (env, path) => /edition_items\?id=in\.\(11\)/.test(path) ? [{ id: 11, headline: 'Sabrina sells out', source_name: 'Billboard', source_url: 'https://b', editions: { date: '2026-09-14', issue_no: 70 } }] : []);
const rc = await RR({}, { findings: [{ evidence: ['S11', 'L1', 'R1', 'T2', 'D1', 'X1'] }], consumer_voice: { quotes: ['V1'], by_generation: [{ quotes: ['V3'] }] } }, { meta: { pack: pk } });
ok(rc.S11.headline === 'Sabrina sells out' && rc.L1.kind === 'lake' && rc.L1.headline === 'Tour grosses 48 million' && rc.L1.tier === 1 && rc.L1.date === '2026-09-12' && rc.R1.kind === 'record' && rc.R1.date === '2024-06-01' && rc.T2.kind === 'theme' && rc.T2.headline === 'Proximity tours' && rc.D1.kind === 'frame' && /Nike in athletic footwear: Nike held the shelf\./.test(rc.D1.headline) && rc.X1.kind === 'read' && rc.X1.headline === 'Analysis: gen z hair care' && rc.D1.source_name === 'Unsurfaced Intelligence' && rc.V1.kind === 'voice' && rc.V1.likes === 40 && rc.V1.self.generation === 'Gen Z' && rc.V3 && rc.V1.has_image === false,
  'P7 receipts resolve every id kind from the row\'s pack: lake and record with tier and date, theme, frame with its claim, read, voice with likes and self-description; quotes arrays are walked');

// ── R: route, tick, ground, desk ──────────────────────────────────────
ok(/body\.kind === 'report' \? 'report'/.test(w) && /readReportWindow\(body\.start, body\.end\)/.test(w) && /issue_no: issue/.test(w) && /'Cultural Intelligence Report, Issue ' \+ String\(issue\)\.padStart\(3, '0'\)/.test(w),
  'R1 /reads/compile takes kind report with an explicit window and numbers the issue by distinct windows');
ok(/const order = \{ weekly: 0, monthly: 1, record: 2, report: 3, recon: 4 \};/.test(w) && /for \(const ck of \(row\.kind === 'report' \? \['monthly', 'weekly'\]/.test(w), 'R2 the tick runs the report after the monthlies and the RECON last; the report builds on every monthly and weekly inside it');
ok(/const laws = readReportLaws\(v\.read, row, items\);/.test(w) && /row\.meta && row\.meta\.pack && row\.meta\.pack\.text \? '\\n' \+ row\.meta\.pack\.text : ''/.test(w) && /readProofRun\(env, row\.kind, row\.read, readGroundOf\(row, items\), row\.pack_ids \|\| \[\], readReportExtraIds\(row\.meta && row\.meta\.pack\)\)/.test(w),
  'R3 landing applies the report laws; the pack lines are ground for the number law; the copy desk knows the extra ids on a recut');
ok(/Math\.max\(READ_PROOF\.MAX_TOKENS, Math\.min\(40000, Math\.ceil\(body\.length \/ 2\.5\) \+ 4000\)\)/.test(w), 'R4 the copy desk\'s room scales with the read, so a report is not cut');
const LW = LAWS.readReportLaws;
const r2 = JSON.parse(JSON.stringify(read)); r2.findings[0].evidence = ['S11', 'L1']; r2.findings[1].evidence = ['S11', 'L2'];
const out = LW(r2, { window_start: '2026-07-08', window_end: '2026-10-03', stats: { momentum: { music: 'rising' }, lake: { by_territory: { music: 140 }, by_territory_prior: {} } }, meta: { pack: { lines: { L: [{ source_name: 'Reuters', published_at: '2026-09-12' }, { source_name: 'Reuters', published_at: '2026-06-12' }] } } } },
  [{ id: 11, source_name: 'Billboard', date: '2026-09-14' }]);
ok(out.read.findings[0].strength === 'pattern' && out.read.findings[1].strength === 'signal' && out.notes.includes('finding_downgraded:2:1_lines_1_outlets') && out.read.territories[0].momentum === 'rising' && out.read.territories[0].n_prior === 0,
  'R5 on the row, a lake line dated before the window is not a support; momentum lands from the stats');

// ── G: the page ───────────────────────────────────────────────────────
ok(/report: "Cultural Intelligence Report"/.test(page) && /\["recon", "report", "record", "monthly", "weekly"\]\.forEach/.test(page) && /if \(row\.kind === "report" \|\| row\.kind === "recon"\) \{   \/\/ SEAM:READ_REPORT/.test(page), 'G1 the library shelves commissioned work, then reports; a report or RECON row takes the research layout');
const pageSrc = between(page, 'function rpNum(', '/* ── Library');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rcP = { S11: { headline: 'Sabrina sells out', source_name: 'Billboard', has_image: true, date: '2026-09-14', issue_no: 70 }, L1: { kind: 'lake', headline: 'Tour grosses 48 million', source_name: 'Reuters', tier: 1, date: '2026-09-12', has_image: false },
  R1: { kind: 'record', headline: 'McKinsey beauty report', source_name: 'McKinsey', tier: 1, date: '2024-06-01', has_image: false }, V1: { kind: 'voice', headline: 'my curls finally behave', source_name: 'YouTube', likes: 40, self: { generation: 'Gen Z', gender: 'woman' }, has_image: false },
  V2: { kind: 'voice', headline: 'second voice', source_name: 'Mastodon', likes: 3, self: null, has_image: false }, D1: { kind: 'frame', headline: 'Gen Z hair care: Texture-first shelving owns the aisle', source_name: 'Unsurfaced Intelligence', date: '2026-10-03', has_image: false } };
const cited = {}, used = {};
const Hp = { esc, inner: h => '<section class="page inner">' + h + '</section>', band: (n, name, t) => '<div class="band"><div class="no">' + n + '</div><h2>' + esc(name) + '</h2><p>' + esc(t) + '</p></div>',
  photo: (s, slot) => '<img data-s="' + s + '" data-slot="' + slot + '">', evline: list => { list = (list || []).filter(s => rcP[s]); list.forEach(s => { cited[s] = 1; }); return list.length ? '<div class="ev">RECEIPTS · ' + list.join(' · ') + '</div>' : ''; },
  pickImage: list => (list || []).find(s => rcP[s] && rcP[s].has_image) || null, img: s => rcP[s] && rcP[s].has_image ? '/img/s/' + s.slice(1) : null, credit: s => 'Photo: ' + rcP[s].source_name, real: s => rcP[s] ? s : null,
  uniq: list => { const seen = {}; return (list || []).filter(a => { if (!a || seen[a] || !rcP[a]) return false; seen[a] = 1; return true; }); },
  stat: (st, path) => { let v = st; String(path || '').split('.').forEach(k => { v = v == null ? undefined : v[k]; }); return typeof v === 'number' ? v : null; },
  fmtDate: d => String(d), pad: n => String(n).padStart(2, '0'), firstSentence: t => { const m = String(t || '').match(/^.+?[.!?](\s|$)/); return m ? m[0].trim() : String(t || ''); }, mark: () => '<svg class="rp-mark"></svg>', capHtml: () => 'cap', ROLES: ['creative', 'marketer', 'founder', 'exec', 'talent'], cited, used };
const P = new Function('KIND', pageSrc + '; return { reportDoc, rpSpark, rpLine, rpDelta, rpWho, rpBars };')({ report: 'Cultural Intelligence Report' });
const xr = { title: 'Culture paid for proximity', subtitle: 'What people paid for, and why', ground_line: 'Read from 812 signals across 90 sources, Jul 8 to Oct 3, 2026', thesis: 'Three sentences. Of thesis. Here.', cover_image: 'S11',
  executive_summary: [{ line: 'Put the curl line on the endcap.', evidence: ['S11', 'L1'] }], method: { what_was_read: 'The lake.', how_to_read: 'Carefully.', limits: 'No sales data.' },
  by_the_numbers: [{ stat: 'lake.signals', line: 'Up on the prior window.' }, { stat: 'lake.nope', line: 'x' }],
  findings: [{ name: 'Proximity is the product', dek: 'd', lead_image: 'S11', what_the_data_shows: 'Music carried 140 of 812 signals.', what_happened: 'wh', why_it_matters: 'wm', means: { culture: 'c', category: 'k', consumer: 'u' }, evidence: ['S11', 'L1'], confidence: 'high', strength: 'pattern', supports: { lines: 2, outlets: 2, record: 0 }, moves: { creative: 'cut it', exec: 'fund it' }, trigger: 'two more tours sell out in under ten minutes' },
    { name: 'A signal', evidence: ['L1'], confidence: 'medium', strength: 'signal', supports: { lines: 1, outlets: 1, record: 1 } }],
  territories: [{ territory: 'music', headline: 'Music led', line: 'l', evidence: ['L1'], momentum: 'rising', n: 140, n_prior: 90 }, { territory: 'fashion-beauty', headline: 'Beauty held', line: 'l', momentum: 'holding', n: 50, n_prior: 0 }],
  competitive_sets: [{ category: 'Hair care', names: ['&honey', 'Being'], line: 'They play here.', evidence: ['L1'] }],
  consumer_voice: { line: 'People said it plainly.', quotes: ['V1', 'V2', 'V9'], by_generation: [{ generation: 'Gen Z', line: 'z', quotes: ['V1'] }] },
  the_record: { line: 'The 2024 report still holds.', evidence: ['R1'] }, cross_currents: [{ thread: 'thread', evidence: ['S11'] }], contradiction: 'Counter one. More.', whitespace: 'White one. More.', advertising_read: 'Ad one. More.',
  outlook: { next_30: [{ line: 'Watch the endcap.', trigger: 'a second retailer resets', evidence: ['L1'] }], next_90: 'Ninety.' }, glossary: [{ term: 'Gen Z', definition: 'Born 1997 to 2012.' }] };
const stP = { lake: { signals: 812, signals_prior: 600, outlets: 90, outlets_prior: 70, by_territory: { music: 140, 'fashion-beauty': 50 }, by_territory_prior: { music: 90 }, by_tier: { tier_1: 200, tier_2: 500, tier_3: 112 }, by_week: [{ week: '2026-07-06', n: 40 }, { week: '2026-07-13', n: 55 }, { week: '2026-07-20', n: 70 }], by_territory_week: { music: [10, 20, 30], 'fashion-beauty': [5, 5, 6] }, top_outlets: [{ source: 'Reuters', n: 80 }], record: 12 },
  daily: { stories: 964, editions: 81 }, frames: { door_reads: 1, excavate_reads: 6 }, window: { start: '2026-07-08', end: '2026-10-03', days: 88, prior_start: '2026-04-11', prior_end: '2026-07-07' }, momentum: { music: 'rising', 'fashion-beauty': 'holding' } };
const g = P.reportDoc(xr, stP, rcP, { kind: 'report', status: 'ready', label: 'Cultural Intelligence Report, Issue 001', window_start: '2026-07-08', window_end: '2026-10-03', meta: { issue_no: 1, pack: { counts: { voices: 4 } } } }, Hp);
const html = g.html;
ok(/class="kind">Cultural Intelligence Report · Issue 001</.test(html) && /<h1>Culture paid for proximity<\/h1>/.test(html) && /rp-dek">What people paid for, and why/.test(html) && /rp-sub">Read from 812 signals across 90 sources, Jul 8 to Oct 3, 2026/.test(html) && /<b>812<\/b><span>Signals read/.test(html) && /<b>90<\/b><span>Sources/.test(html) && /<b>88<\/b><span>Days/.test(html) && g.coverPool[0] === 'S11',
  'G2 the cover speaks to the reader: the claim, what it means, the thesis, one ground line, and four counts a reader understands');
ok(/In this report/.test(html) && /What this means for you<small>1 things to act on/.test(html) && /The period in numbers/.test(html) && /The findings<small>2 patterns in what people did/.test(html) && /In their own words/.test(html) && /What the older reports say/.test(html) && /About this report/.test(html) && /Sources<small>Every source, numbered/.test(html) && html.indexOf('About this report<small>') > html.indexOf('Glossary<small>'),
  'G3 the contents lead with what it means and end with the method and the sources; no machinery up front');
ok(/<ol class="rp-exec" style="grid-template-rows:repeat\(\d+,auto\)"><li><span>01<\/span><div>Put the curl line on the endcap\.<span class="rp-refs"><sup>1<\/sup><sup>2<\/sup><\/span><\/div>/.test(html) && !/RECEIPTS · S11/.test(html),
  'G4 the executive lines carry numbered sources, never house ids');
ok(/<b>812<\/b><span>Signals tracked<\/span><small>\+35% vs prior 600<\/small>/.test(html) && /Signals tracked, by week/.test(html) && /PRIOR WINDOW, WEEKLY AVERAGE 48</.test(html) && /812 · signals tracked<\/div><p class="body">Up on the prior window\./.test(html) && !/lake\.nope/.test(html) && /Most-cited sources/.test(html),
  'G5 the period in numbers reads in plain words: signals tracked, sources, the weekly line; a stat path is labeled, never printed raw');
ok(/Finding 1 of 2/.test(html) && /<span class="rp-chip">Pattern<\/span> <span class="rp-chip high">high confidence<\/span> <span class="rp-chip">2 sources agree<\/span> /.test(html) && /What the data shows<\/div>Music carried 140 of 812 signals\./.test(html) && /<b>For the culture<\/b>c</.test(html) && /<b>WHAT WOULD PROVE IT<\/b>two more tours sell out/.test(html) && /<li><span>2<\/span><div>Tour grosses 48 million<i>Reuters · 2026-09-12 · source<\/i>/.test(html) && !/· T1 ·/.test(html),
  'G6 a finding spread: pattern, confidence, how many sources agree, the data card, what it means, the move, what would prove it, and sources by number with no tier codes');
ok(/<span class="rp-chip">Early signal<\/span> <span class="rp-chip medium">medium confidence<\/span> <span class="rp-chip">1 source<\/span>/.test(html) && /<span class="signal"[^>]*>Early signal<\/span>/.test(html) && !/dated lines/.test(html), 'G7 a signal is called an early signal, on the opener and on its spread');
ok(/<span>music<\/span><span class="rp-chip rising">rising<\/span>/.test(html) && /<svg class="rp-spark"[^>]*><polyline fill="none" vector-effect="non-scaling-stroke" stroke="#C41230"/.test(html) && /<span>140 signals<\/span><span>\+56% vs prior 90<\/span>/.test(html) && /<span>50 signals<\/span><span>new this window<\/span>/.test(html) && /stroke="#141414"/.test(html),
  'G8 every territory carries the database\'s momentum, its count against the prior, and its weekly line');
ok(/<div class="cat">Hair care<\/div><div class="names">&amp;honey<br>Being<\/div>/.test(html), 'G9 competitive sets name their players');
ok(/<div class="rp-q">my curls finally behave<div class="who"><sup>\d+<\/sup> YouTube comment · 40 likes · <i>Gen Z · woman<\/i><\/div>/.test(html) && /<div class="rp-q">second voice<div class="who"><sup>\d+<\/sup> Mastodon comment · 3 likes<\/div>/.test(html) && !/V9/.test(html) && !/V1 · YouTube/.test(html),
  'G10 voices print word for word with only the speaker\'s own description, numbered like every other source; no handle, no house id');
ok(/The 2024 report still holds\./.test(html) && /<li><span>\d+<\/span><div>McKinsey beauty report<i>McKinsey · 2024-06-01<\/i>/.test(html) && /What the older reports say/.test(html), 'G11 the older reports are named for what they are, with their dates');
ok(/<li><span>01<\/span><div>Watch the endcap\.<span class="rp-refs">/.test(html) && /<b>WATCH FOR<\/b> · a second retailer resets/.test(html) && /<b>Gen Z<\/b><p>Born 1997 to 2012\.<\/p>/.test(html), 'G12 the outlook says what to watch for; the glossary defines');
ok(/About this report/.test(html) && /<b>4<\/b><span>Consumer comments read/.test(html) && /<b>12<\/b><span>Older reports consulted/.test(html) && /Newsrooms and research/.test(html) && /What it cannot tell you/.test(html) && html.indexOf('About this report') > html.indexOf('The outlook'),
  'G13 the method sits at the back as About this report, in reader words, with where the signals came from');
const srcAt = html.indexOf('>Sources<');
ok(srcAt > 0 && /<div class="rc"><b>2<\/b><div><div class="hl">Tour grosses 48 million<\/div><div class="src">Reuters · 2026-09-12 · source<span class="rp-ref">L1<\/span>/.test(html) && /<div class="rc"><b>1<\/b><div><div class="hl">Sabrina sells out<\/div><div class="src">Billboard · 2026-09-14 · story · issue 070<span class="rp-ref">S11<\/span>/.test(html) && /consumer comment<span class="rp-ref">V1<\/span>/.test(html) && html.indexOf('"src">Billboard') < html.indexOf('"src">Reuters') && !/class="rp-rec"/.test(html),
  'G14 sources are numbered in order of first mention, named for what they are, in two compact columns without thumbnails; the house id survives only as a tiny reference beside each source');
ok(!/undefined|NaN|\[object/.test(html) && /unsurfaced-intelligence\.com\/read · Issue 001/.test(html) && !/—/.test(html), 'G15 nothing undefined on the page; the closer names the issue; no em dash');
const body = html.slice(0, srcAt);
const text = body.replace(/<[^>]+>/g, ' ');
ok(!/\b[SLRTDXV]\d+\b/.test(text) && !/\blake\b|\bframe\b|\btier\b|\bSTATS\b/.test(text), 'G16 before the sources page, no house id and no house word reaches the reader (markup aside)');
const g2 = P.reportDoc(Object.assign({}, xr, { findings: [Object.assign({}, xr.findings[0], { what_the_data_shows: 'Music led (L1, S11) and the frame measured it (D1).' })] }), stP, rcP, { kind: 'report', status: 'ready', label: 'x', window_start: '2026-07-08', window_end: '2026-10-03', meta: { issue_no: 1 } }, Object.assign({}, Hp, { cited: {}, used: {} }));
ok(/Music led<span class="rp-refs"><sup>\d+<\/sup><sup>\d+<\/sup><\/span> and the frame measured it<span class="rp-refs"><sup>\d+<\/sup><\/span>\./.test(g2.html) && !/\(L1, S11\)/.test(g2.html) && /Unsurfaced Intelligence · 2026-10-03 · Unsurfaced analysis<span class="rp-ref">D1<\/span>/.test(g2.html), 'G17 an id that slips into prose is turned into a numbered source on the page, and a house analysis is named as one in the sources');
ok(P.rpSpark([1]) === '' && P.rpLine([{ week: '2026-07-06', n: 1 }], 0, esc) === '' && P.rpDelta(10, 0) === 'new this window' && P.rpDelta(0, 0) === 'none either window' && P.rpDelta(90, 100) === '-10% vs prior 100' && P.rpWho({ generation: 'Gen Z', place: 'Texas' }) === 'Gen Z · Texas' && P.rpWho(null) === '',
  'G16 a one-point line draws nothing; deltas read against a zero prior; who-lines are only self-stated markers');
ok(/SEAM:READ_REPORT/.test(page) && /SEAM:READ_REPORT/.test(w), 'G17 the seam is tagged on the worker and the page');

console.log('proof_read_report: ' + pass + ' checks PASS');
