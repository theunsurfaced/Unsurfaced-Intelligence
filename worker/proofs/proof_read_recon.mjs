/**
 * proof_read_core.mjs  --  EX14a THE BRIEF: the RECON, a commissioned report that starts from a brief.
 * Runs the shipped module on fakes. Run from the repo root: node worker/proofs/proof_read_core.mjs
 *   K  the kind and readIsReport          M  migration 0036
 *   B  the brief: match, text, queries    S  STATS.recon from the slice
 *   C  the contract                       R  /reads/commission and the numbering
 *   T  the tick: gather, then submit; thin slices fail plainly
 *   L  the sell law on a RECON             F  footer and window
 *   P  the page                           G  the Method
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0036_recon.sql', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
const frameClean = helper('excFrameClean', 'function excFrameWhole(');
let sb = [], fixtures = {}, gathers = [], captured = [], submitted = [], frameAnswer = null, rails = [];
// SEAM:VOICE_LAW: the slice's voices are counted through the voice helpers; SEAM:READ_TIME: the attention rail is faked by month
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));
const months36 = (() => { const out = []; for (let y = 2023, m = 10; out.length < 36; m++) { if (m > 12) { m = 1; y++; } out.push(y + String(m).padStart(2, '0') + '0100'); } return out; })();
const railFetch = async url => { rails.push(url);
  if (/list=search/.test(url)) { const q = decodeURIComponent(url.split('srsearch=')[1]); return { query: { search: q === 'FIELD' ? [{ title: 'Field hockey', snippet: 'a team sport played with <span class="searchmatch">field</span> sticks' }] : q === 'smart glasses' ? [{ title: 'Smartglasses', snippet: 'wearable computer glasses' }]
    : q === 'Meta Ray-Ban' ? [{ title: 'Ray-Ban Meta', snippet: 'a line of smart glasses made by Meta' }] : [{ title: 'Snapchat', snippet: 'a messaging app with smart glasses' }] } }; }
  if (/pageviews/.test(url)) { const a = decodeURIComponent(url.split('/user/')[1].split('/')[0]); return { items: months36.map((t, i) => ({ timestamp: t, views: a === 'Smartglasses' ? 1000 + i * 100 : 500 })) }; }
  return null; };
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'excFrameFor', 'gatherOpenSignals', 'lakeCapture', 'excTerritoryOf', 'sha256hex', 'RAILS', 'RAIL_FNS', 'excFrameLabel', 'railFetch',
  trim + pmj + ej + frameClean + voiceSrc + block + '; return { HOUSE_READ, READ_RECON, READ_CONTRACT, readIsReport, readWindow, readRoute, readTick, readSellable, readPdfFooter, readReconMatch, readReconOf, readReconBriefText, readReconVoiceQueries, readReconGatherQueries, readReconStats, readReconLabel, readReconIssue, readGroundOf, readReconAttention, readAttnStats, readAttnMatch, readAttnMonths, readReconRecordQuery, readRecordSpread };')(
  sbRest, async (env, tier, kind, jobs) => { submitted.push(jobs[0]); return { ok: true, batch_id: 'b1', est_usd: 2.4 }; }, async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async (env, q) => frameAnswer, async (env, q, opts) => { gathers.push({ q, frame: !!(opts && opts.frame) }); return { ok: true, items: [{ url: 'https://x.y/' + gathers.length, title: 'FIELD glasses ' + gathers.length }] }; },
  async (env, items, prov) => { captured.push(prov); return items.length; }, () => 'technology-innovation', async s => 'abc123def4567890' + s.length, [], {}, () => '', railFetch);

// ── K ─────────────────────────────────────────────────────────────────
const K = R.HOUSE_READ.KINDS.recon;
ok(K && K.max_tokens === 120000 && K.effort === 'high' && K.child === null && R.readIsReport('recon') && R.readIsReport('report') && !R.readIsReport('monthly'),
  'K1 the recon kind rides the report\'s room and effort, waits on no child; readIsReport names report and recon only');
ok(R.READ_RECON.DAYS === 90 && R.READ_RECON.GATHERS === 6 && R.READ_RECON.MIN_SLICE === 12, 'K2 READ_RECON: 90 days back, six gathers, a slice under 12 lines is thin');

// ── M ─────────────────────────────────────────────────────────────────
ok(/check \(kind in \('weekly', 'monthly', 'record', 'report', 'recon'\)\)/.test(mig) && /drop constraint %I/.test(mig), 'M1 0036 admits kind recon the way 0034 admitted report');

// ── B ─────────────────────────────────────────────────────────────────
const frame = { entity: 'FIELD', category: 'smart glasses', audience: 'early adopters', market: 'US', competitors: ['Meta Ray-Ban', 'Snap Spectacles'], question: 'Who is wearing smart glasses, who refuses, and where does a culture-first wearable enter?',
  anchors: ['smart glasses', 'wearable', 'ai glasses', 'ray-ban meta', 'face computer'], exclude: ['sunglasses fashion week', 'reading glasses'], queries: { news: 'smart glasses adoption news', research: 'wearable computing adoption', discourse: 'why I returned my smart glasses', web: 'best smart glasses 2026' } };
const m = R.readReconMatch(frame);
ok(m('Meta sold more smart glasses this quarter') && m('FIELD announces a prototype') && m('Snap Spectacles return') && !m('A sunglasses fashion week show in Milan') && !m('Reading glasses sales rise') && !m('The band said hello') && !m('Nothing about eyewear here'),
  'B1 match: an anchor, the entity or a competitor as whole words lets a line in; an exclude keeps it out; "ai glasses" never matches "said"');
const recon = R.readReconOf({ meta: { brief: { text: 'FIELD: smart glasses as a cultural object.', frame, days: 90 } } });
ok(recon.text === 'FIELD: smart glasses as a cultural object.' && recon.frame.entity === 'FIELD' && recon.days === 90 && typeof recon.match === 'function' && recon.match('smart glasses in the wild'),
  'B2 readReconOf: the brief, the cleaned frame, the days and the matcher');
const bare = R.readReconOf({ meta: { brief: { text: 'A brief with no frame' } } });
ok(bare.frame.question === 'A brief with no frame' && bare.days === 90 && !bare.match('anything'), 'B3 a brief without a frame still reads; nothing matches until it is framed');
const bt = R.readReconBriefText(recon);
ok(/^BRIEF: FIELD: smart glasses as a cultural object\.\n/.test(bt) && /ENTITY: FIELD\n/.test(bt) && /COMPETITORS: Meta Ray-Ban, Snap Spectacles\n/.test(bt) && /QUESTION: Who is wearing/.test(bt) && /ANCHORS: smart glasses, wearable/.test(bt),
  'B4 the brief is written out for the pack and the ground: brief, entity, category, audience, market, competitors, question, anchors');
const vq = R.readReconVoiceQueries(frame), gq = R.readReconGatherQueries(frame);
ok(vq[0] === 'FIELD smart glasses' && vq[1] === 'why I returned my smart glasses' && vq[2] === frame.question && vq[3] === 'smart glasses' && vq.includes('Meta Ray-Ban smart glasses') && vq.length <= 10,
  'B5 voice queries: the entity in its category, how people say it, the question, the category, then the competitors');
ok(gq[0] === 'FIELD smart glasses' && gq[1] === 'smart glasses adoption news' && gq[2] === 'best smart glasses 2026' && gq[3] === frame.question && gq.length === 6 && gq[5] === 'Snap Spectacles smart glasses',
  'B6 gather queries: the entity, the news and web phrasings, the question, the competitors; at most six');

// ── S ─────────────────────────────────────────────────────────────────
const vqs = []; for (let i = 0; i < 5; i++) vqs.push({ text: 'I wear mine every day number ' + i, when: '2026-09-1' + i, band: 'now' });
vqs.push({ text: 'Back in 2014 I walked out on a wearer', when: '2014-04-16', band: 'earlier' }, { text: 'Last year I returned my pair', when: '2025-11-03', band: 'before' }, { text: 'The law will not save us | Jonathan Liew theguardian.com/commentisfree/2026/aug/31/x', when: '2026-08-31' });
const pack = { lines: { L: [{ territory: 'technology-innovation', source_name: 'The Verge', published_at: '2026-09-22' }, { territory: 'technology-innovation', source_name: 'the verge', published_at: '2026-09-23' }, { territory: 'fashion-beauty', source_name: 'Vogue', published_at: '2026-09-30' }], R: [{ published_at: '2019-03-01' }, { published_at: '2013-03-11' }] }, voices: { quotes: vqs, sources: [{ n: 40 }, { n: 12 }] } };
const items = [{ territory: 'technology-innovation', source_name: 'Wired' }, { territory: 'music', source_name: 'Vogue' }];
const cs = R.readReconStats(recon, items, pack);
ok(cs.signals === 3 && cs.record === 2 && cs.stories === 2 && cs.outlets === 3 && cs.voices === 7 && cs.by_territory['technology-innovation'] === 2 && cs.by_territory['fashion-beauty'] === 1 && cs.stories_by_territory.music === 1 &&
  cs.weeks.join(',') === '2026-09-21,2026-09-28' && cs.by_week.join(',') === '2,1' && cs.week_high === 2 && cs.week_low === 1 && cs.anchors === 5 && cs.competitors === 2,
  'S1 STATS.recon counts the slice: signals, record, stories, distinct outlets (case folded), consumer voices from the pack\'s quotes, by territory, Monday weeks, high and low week');
ok(cs.shares === 1 && cs.voices_read === 52 && cs.voices_now === 5 && cs.voices_then === 2 && cs.voices_since === 2014 && cs.record_since === 2013 && cs.stories_all === 5 && !('attention' in cs),
  'S2 SEAM:READ_TIME the voices count the period and the years before (and since when); a shared headline is a story, not a voice; the record says how far back it reaches; no attention is claimed when none was gathered');

// ── C ─────────────────────────────────────────────────────────────────
const C = R.READ_CONTRACT.recon;
ok(/^CONTRACT \(recon\)\. This is a commissioned research report, a RECON, that answers one brief/.test(C) && /THE BRIEF LAW/.test(C) && /"brief_answer": 2 to 3 sentences/.test(C) && /"for_the_brief": \{"who_is_in"/.test(C) && /"where_to_enter"/.test(C) &&
  /"findings": 5 to 8 objects, each standing on its own evidence \(a finding that rests on one source is kept and labeled strength "signal"\),/.test(C) && /"executive_summary": 6 to 8 objects/.test(C) && /THE DEPTH LAW: a RECON is the deepest read we make/.test(C) && /"by_the_numbers": 5 to 10 objects/.test(C) && /8 to 16 consumer voices on the brief/.test(C) && !/fewer when the brief's slice is thin|a thin slice makes a short/.test(C) && /"competitive_sets": 1 to 6 objects, the brief's competitors first,/.test(C) && /STATS\.recon\.attention, when present/.test(C) && /"recon\.attention\.yoy_pct"/.test(C) && /THE TIME LAW/.test(C) && /STATS\.recon counts that slice/.test(C) && !/CONTRACT \(report\)/.test(C) && !/—/.test(C),
  'C1 the RECON contract is the report\'s, answering the brief: brief law, brief_answer, for_the_brief, the depth law (5 to 8 findings, an early signal kept and labeled, never a short read for a thin slice), competitors first, STATS.recon first, the attention series read for growth under the time law; no em dash');

// ── R ─────────────────────────────────────────────────────────────────
let cores = [];
fixtures = { 'house_reads?kind=eq.recon&select=meta': () => cores, 'house_reads?kind=eq.recon&window_start': () => [], 'house_reads?select=*': (p, o) => [Object.assign({ id: 41, version: 1 }, o.body[0])] };
frameAnswer = frame; sb = [];
const r1 = await R.readRoute('/reads/commission', { brief: 'FIELD: smart glasses as a cultural object. Who is wearing them, who is refusing, who is absent, and where does a culture-first wearable enter?', end: '2026-10-04' }, {}, '', { id: 'admin' });
ok(r1.ok && r1.id === 41 && r1.kind === 'recon' && r1.recon_no === 1 && r1.window.start === '2026-07-07' && r1.window.end === '2026-10-04' && r1.waiting === 'tick' && r1.frame.entity === 'FIELD' && /^RECON 001: FIELD, smart glasses \(Jul 7 to Oct 4, 2026\)$/.test(r1.window.label),
  'R1 /reads/commission frames the brief, numbers it RECON 001, queues a 90-day window ending on the day given, and waits for the tick');
const ins = sb.find(x => x.opts && x.opts.method === 'POST' && /house_reads\?select=\*/.test(x.path)).opts.body[0];
ok(ins.kind === 'recon' && ins.status === 'queued' && ins.meta.plan === 'recon' && ins.meta.recon_no === 1 && ins.meta.brief.text.startsWith('FIELD:') && ins.meta.brief.hash.length === 16 && ins.meta.brief.frame.entity === 'FIELD' && ins.meta.brief.days === 90,
  'R2 the row carries the brief: text, hash, frame and days under meta.brief, the plan and the number');
ok((await R.readRoute('/reads/commission', { brief: 'too short' }, {}, '', { id: 'admin' })).error === 'brief_too_short' && (await R.readRoute('/reads/commission', { brief: 'a long enough brief' }, {}, '', { id: 'x' }))._status === 403,
  'R3 a brief under 12 characters is refused; admin only');
frameAnswer = null;
ok((await R.readRoute('/reads/commission', { brief: 'a brief the framer cannot frame at all' }, {}, '', { id: 'admin' })).error === 'unframeable', 'R4 a brief the framer cannot frame is refused before anything is queued');
cores = [{ meta: { recon_no: 1, brief: { hash: 'h1' } } }, { meta: { recon_no: 1, brief: { hash: 'h1' } } }, { meta: { recon_no: 2, brief: { hash: 'h2' } } }];
ok((await R.readReconIssue({}, 'h1')) === 1 && (await R.readReconIssue({}, 'h2')) === 2 && (await R.readReconIssue({}, 'h3')) === 3, 'R5 numbers count briefs: the same brief keeps its number, a new brief takes the next');
ok(/case '\/reads\/commission':/.test(w) && /if \(path === '\/reads\/commission'\) \{/.test(w), 'R6 the door is dispatched to readRoute');
ok(R.readReconLabel(7, { entity: null, category: 'oat milk' }, { label: 'Jan 1 to Mar 31, 2027' }) === 'RECON 007: oat milk (Jan 1 to Mar 31, 2027)', 'R7 a brief with no entity is labeled by its category');

// ── T ─────────────────────────────────────────────────────────────────
const reconRow = { id: 41, kind: 'recon', status: 'queued', version: 1, window_start: '2026-07-07', window_end: '2026-10-04', label: 'RECON 001: FIELD, smart glasses (Jul 7 to Oct 4, 2026)', meta: { plan: 'recon', recon_no: 1, brief: { text: 'FIELD: smart glasses as a cultural object.', hash: 'h1', frame, days: 90 } } };
const lakeFx = n => Array.from({ length: n }, (_, i) => ({ id: 100 + i, title: 'Smart glasses story ' + i, summary: 'people wear them', source_name: 'Outlet ' + (i % 5), source_tier: 2, territory: 'technology-innovation', published_at: '2026-09-0' + (1 + (i % 9)), url: 'https://o/' + i }));
const stories = [{ id: 1, edition_id: 1, ord: 1, headline: 'Meta smart glasses sell out', take: 'take', apply: 'apply', territory: 'technology-innovation', source_name: 'Wired' }, { id: 2, edition_id: 1, ord: 2, headline: 'A sneaker drop in Paris', take: 't', apply: 'a', territory: 'sneakers-streetwear', source_name: 'Complex' }];
let patches = [];
const tickFx = lakeN => { patches = []; gathers = []; captured = []; submitted = []; fixtures = {
  'house_reads?status=eq.queued': () => [JSON.parse(JSON.stringify(reconRow))],
  'house_reads?id=eq.41': (p, o) => { if (o && o.method === 'PATCH') patches.push(o.body); return []; },
  'rpc/house_report_stats': () => ({ lake: { signals: 500, outlets: 60, by_territory: { 'technology-innovation': 300 }, by_week: [1, 2, 3], by_territory_week: {} }, themes: [{ id: 9, title: 'smart glasses everywhere', territory: 'technology-innovation', n: 4 }, { id: 10, title: 'oat milk', territory: 'food-hospitality', n: 2 }], window: { days: 90 } }),
  'editions?': () => [{ id: 1, issue_no: 50, date: '2026-09-10' }], 'edition_items?': () => stories,
  'signals?status=neq.rejected&edition_item_id=is.null': () => lakeFx(lakeN), 'signals?status=neq.rejected&source_tier=lte.1': () => [], 'door_reads?': () => [], 'reads?created_at': () => [] }; };
tickFx(30);
const t1 = await R.readTick({});
ok(t1.submitted === 1 && gathers.length === 6 && gathers.every(g => g.frame) && gathers[0].q === 'FIELD smart glasses' && captured.length === 6 && captured[0].provenance === 'recon_gather' && captured[0].territory === 'technology-innovation',
  'T1 the tick gathers on the brief\'s six queries with the frame, captures with provenance recon_gather in the frame\'s territory, then submits');
const gp = patches.find(p => p.meta && p.meta.gather);
ok(gp && gp.meta.gather.queries.length === 6 && gp.meta.gather.captured === 6 && gp.meta.gather.failed.length === 0, 'T2 the gather leaves its receipt on the row (queries, captured, failed)');
const at = gp.meta.gather.attention;
ok(at && at.months.length === 36 && at.months[0] === '2023-10' && at.months[35] === '2026-09' && at.series.length === 2 && at.series[0].role === 'subject' && at.series[0].article === 'Smartglasses' && at.series[0].label === 'smart glasses' && at.series[1].article === 'Ray-Ban Meta' && !at.series.some(x => x.article === 'Field hockey' || x.article === 'Snapchat') && rails.some(u => /monthly\/2023100100\/2026093000$/.test(u)),
  'T2b SEAM:READ_TIME the gather measures three years of readers: the 36 complete months before the period ends; the entity\'s search landed on another subject, so the category stands as the subject; a competitor whose search shares no word with it measures nothing');
const job = submitted[0], cp = patches.find(p => p.status === 'compiling');
ok(job && /^THE BRIEF \(the question this RECON answers\):\nBRIEF: FIELD: smart glasses as a cultural object\./.test(job.prompt) && /STATS\.recon counts the brief's slice/.test(job.prompt) && /STORIES \(1, published by DAILY, the brief's slice\):/.test(job.prompt) && /S1 \|/.test(job.prompt) && !/S2 \|/.test(job.prompt) &&
  /LAKE SIGNALS \(30, the window, not published by DAILY, the brief's slice\):/.test(job.prompt) && /THEMES \(1, from STATS\)/.test(job.prompt) && /Write the RECON RECON 001: FIELD/.test(job.prompt) && job.system.endsWith(R.READ_CONTRACT.recon) && job.max_tokens === 120000,
  'T3 the prompt opens with the brief; stories, lake and themes are the slice (the sneaker story and the oat milk theme are out); the RECON contract rides the Method');
ok(cp && cp.stats.recon && cp.stats.recon.signals === 30 && cp.stats.recon.stories === 1 && cp.stats.recon.outlets === 6 && cp.stats.lake.signals === 500 && cp.pack_ids.join(',') === '1' && cp.meta.pack.counts.lake === 30,
  'T4 STATS.recon is written from the slice beside the whole period\'s lake; pack_ids are the slice\'s stories');
const ca = cp.stats.recon.attention;
ok(ca && ca.article === 'Smartglasses' && ca.recent_3m === 4300 + 4400 + 4500 && ca.year_ago_3m === 3100 + 3200 + 3300 && ca.two_years_ago_3m === 1900 + 2000 + 2100 && ca.yoy_pct === 38 && ca.two_year_pct === 120 && ca.peak_month === '2026-09' && ca.recent_months.join() === '2026-07,2026-08,2026-09' && ca.rivals.length === 1 && ca.rivals[0].yoy_pct === 0,
  'T4b the attention lands in STATS.recon read for the reader: the last three months against the same months one and two years before, the change in whole percent, the peak; every figure a sum of the series');
const recQ = decodeURIComponent(R.readReconRecordQuery(frame));
ok(/^\(title\.ilike\.\*field\*,summary\.ilike\.\*field\*,title\.ilike\.\*smart\*glasses\*/.test(recQ) && /ray\*ban\*meta/.test(recQ) && /meta\*ray\*ban/.test(recQ) && R.readReconRecordQuery({}) === null && /&or=/.test(sb.map(x => x.path).find(p => /source_tier=lte\.1/.test(p)) || '') && /order=published_at\.desc/.test(sb.map(x => x.path).find(p => /source_tier=lte\.1/.test(p)) || ''),
  'T4c SEAM:READ_TIME a RECON\'s record is asked by the brief\'s own words across every year before the period, newest first, every mark between letters a wildcard');
const spr = R.readRecordSpread([{ id: 1, published_at: '2026-05-01' }, { id: 2, published_at: '2026-04-01' }, { id: 3, published_at: '2026-03-01' }, { id: 4, published_at: '2019-02-01' }, { id: 5, published_at: '2013-03-11' }, { id: 6, published_at: '2013-01-01' }], 4);
ok(spr.map(r => r.id).join() === '1,4,5,2', 'T4d the record is spread by year, newest year first, one line a year a round, so it reaches back instead of stopping at last spring');
ok(R.readAttnStats({ months: ['2026-01'], series: [{ role: 'rival', views: [1] }] }) === null && R.readAttnStats(null) === null && R.readAttnMatch('Meta Ray-Ban', 'Ray-Ban Meta') && !R.readAttnMatch('Snap Spectacles', 'Snapchat'),
  'T4e no subject, no attention: a competitor never stands in for the subject; a title must share a word with what was asked, and its summary must name the brief (FIELD never measures field hockey)');
tickFx(4);
const t2 = await R.readTick({});
const fp = patches.find(p => p.status === 'failed');
ok(t2.refused === 1 && fp && /^thin_slice:4\+1$/.test(fp.error) && !submitted.length, 'T5 a slice under MIN_SLICE fails as thin_slice with its counts, and nothing is submitted or spent');
ok(/if \(row\.kind === 'recon' && !\(row\.meta && row\.meta\.gather\)\)/.test(w), 'T6 a recon row that already carries its gather receipt is not gathered twice');

// ── L ─────────────────────────────────────────────────────────────────
const finding = { name: 'n', advantage: 'a', trigger: 't', against: { line: 'x' }, reach: 'category', horizon: 'now', voices: ['V1'], supports: { outlets: 2 }, moves: { creative: 1, marketer: 1, founder: 1, exec: 1, talent: 1 } };
const sellRow = { kind: 'recon', status: 'ready', version: 1, window_start: '2026-07-07', window_end: '2026-10-04', violations: [], stats: { lake: { shape: {}, prior_comparable: false } },
  meta: { recon_no: 1, brief: { text: 'FIELD' }, proof: { lane: 'live' } }, read: { title: 't', thesis: 'th', brief_answer: 'yes', for_the_brief: { who_is_in: 'a', who_is_absent: 'b', where_to_enter: 'c' }, findings: [finding, finding] } };
ok(R.readSellable(sellRow).ok, 'L1 a RECON with the report\'s receipts plus the brief, its number and its answer is sellable');
const noAns = JSON.parse(JSON.stringify(sellRow)); delete noAns.read.brief_answer;
const noBrief = JSON.parse(JSON.stringify(sellRow)); delete noBrief.meta.brief;
ok(R.readSellable(noAns).fails.includes('no_brief_answer') && R.readSellable(noBrief).fails.includes('no_brief') && !R.readSellable(sellRow).fails.includes('no_issue_no'),
  'L2 without the brief or without its answer a RECON carries no price; a RECON is never asked for an issue number');
const g = R.readGroundOf({ kind: 'recon', stats: { recon: { signals: 30 } }, meta: { brief: { text: 'FIELD sold 462 pairs', frame } } }, [{ headline: 'h 7', take: '', apply: '', date: '2026-09-01', issue_no: 1 }]);
ok(/"signals":30/.test(g) && /BRIEF: FIELD sold 462 pairs/.test(g) && /h 7 /.test(g) && !/"counts"/.test(g), 'L3 the ground of a RECON is its stats, the brief in its own words, and the stories; no derived counts');

// ── F ─────────────────────────────────────────────────────────────────
ok(/UNSURFACED™ RECON · 001: FIELD, SMART GLASSES \(JUL 7 TO OCT 4, 2026\) · V1/.test(R.readPdfFooter({ kind: 'recon', label: 'RECON 001: FIELD, smart glasses (Jul 7 to Oct 4, 2026)', version: 1 })) && R.readWindow('recon', '2026-09-01') === null,
  'F1 the footer says RECON; a RECON\'s window is explicit, never derived from a start date');
ok(/if \(row\.kind !== 'report'\) return json\(\{ ok: false, error: 'not_a_report' \}/.test(w), 'F2 the public stand still takes reports only; a RECON is delivered, not staged');

// ── P ─────────────────────────────────────────────────────────────────
ok(/recon: "RECON" \}/.test(page) && /var groups = \{ recon: \[\], report: \[\], weekly: \[\], monthly: \[\], record: \[\] \};/.test(page) && /row\.kind === "report" \|\| row\.kind === "recon"/.test(page) && /"For the brief", "Who is in, who is absent, where to enter"/.test(page) && /esc\("Unsurfaced " \+ \(issue \|\| "RECON"\)\)/.test(page) && /The brief: ' \+ esc\(recon\.text\)/.test(page) &&
  /\[\[allS, "Stories"\], \[cs\.outlets, "Outlets"\], \[win\.days, "Days"\]\]/.test(page) && /recon && x\.brief_answer \? x\.brief_answer : x\.thesis/.test(page) && /a RECON is delivered, never staged: no stand bar/.test(page) && /\.rp-rec2 > div \{ break-inside: avoid; \}/.test(page) && !/Signals on the brief/.test(page),
  'P1 the page renders a RECON in the report layout: the brief on the cover and the one-page section, the question\'s own figures (stories, outlets, days), the answer in place of the thesis, For the brief after the findings, no stand bar');

// ── G ─────────────────────────────────────────────────────────────────
ok(/^Version (?:3\.[1-9]|4\.\d)/m.test(method) && /- \*\*The RECON\*\*: one brief, to depth\./.test(method) && /12\. \*\*The question law\.\*\*/.test(method) && w.includes(JSON.stringify(method).slice(1, -1).slice(0, 400)) && !/—/.test(method),
  'G1 the Method names the RECON and the question law, and the worker carries the exact text');

console.log('\nproof_read_recon: ' + pass + ' checks PASS');
