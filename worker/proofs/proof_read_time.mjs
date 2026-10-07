/**
 * proof_read_time.mjs  --  EX16 THE HOUSE STYLE AND THE TIME LAW.
 * Drives the shipped blocks on fakes. Run from the repo root: node worker/proofs/proof_read_time.mjs
 *   R  the rails ask the years before the period      L  the voice law with time: then and now
 *   S  the copy desk's mechanical style checks         W  the walkers treat then and now as id arrays
 *   C  the contracts and the Method (4.0, the house style)
 *   P  the page: voices credited to people, once; then and now; three years of attention; the numbers after the findings
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const voiceSrc = between(w, 'const VOICES = {', 'function voiceOnFrame(') + between(w, 'function stripHtml(', 'function hintsOf(');
const dateSrc = between(w, 'function readIso(', 'function readWindow(');
const reportConst = between(w, 'const READ_REPORT = {', '/* SEAM:READ_RECON: a RECON is a report');
const bandSrc = between(w, '/* SEAM:READ_TIME PURE: where a dated thing sits against the period.', '/* SEAM:VOICE_LAW PURE: a voice line names no platform');

// ── R: the rails ──────────────────────────────────────────────────────
const railsSrc = between(w, '  async mastodon(env, q, ctx, rail) {', '  async sec_edgar(env, q, ctx, rail) {') + between(w, '  async youtube(env, q, ctx, rail) {', '  async kg(env, q, ctx, rail) {');
let fetched = [];
const ytQuotaDay = new Function(between(w, 'function ytQuotaDay(', '\n/* ═') + '; return ytQuotaDay;')();   // EX17: YouTube's own day
const RF = new Function('railFetch', 'envelope', 'voiceAdd', 'GATHER', 'looksEnglish', 'voiceOnFrame', 'ytQuotaDay', voiceSrc + 'const RAIL_FNS = {' + railsSrc + '}; return RAIL_FNS;')(
  async url => { fetched.push(url); return /search\?/.test(url) ? { items: [] } : []; }, (r, o) => o, () => {}, { YT_SEARCH_CAP: 60 }, () => true, () => null, ytQuotaDay);
const kv = {}; const envYT = { GOOGLE_API_KEY: 'k', RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
await RF.youtube(envYT, 'smart glasses', { meta: {}, before: '2026-07-08' }, {});
await RF.youtube(envYT, 'smart glasses', { meta: {}, since: '2026-07-08' }, {});
await RF.mastodon({}, 'smart glasses', { meta: {}, before: '2026-07-08' }, {});
await RF.mastodon({}, 'smart glasses', { meta: {} }, {});
const maxId = String(BigInt(Date.parse('2026-07-08T00:00:00Z')) << 16n);
ok(/&publishedBefore=2026-07-08T00%3A00%3A00Z&q=smart%20glasses/.test(fetched[0]) && !/publishedAfter/.test(fetched[0]) && /&publishedAfter=2026-07-08T00%3A00%3A00Z&q=/.test(fetched[1]) && !/publishedBefore/.test(fetched[1]),
  'R1 YouTube asks the period (published after it began) or the years before it (published before it began), never both in one search');
ok(fetched[2].endsWith('&local=false&max_id=' + maxId) && /tag\/smartglasses\?limit=\d+&local=false$/.test(fetched[3]) && maxId.length > 15,
  'R2 Mastodon pages back to the years before the period by the time in a status id (milliseconds shifted 16 bits); the period pass reads the newest posts');

// ── L: the voice law with time ────────────────────────────────────────
const lawSrc = between(w, '/* SEAM:VOICE_LAW PURE: at landing the voice law is enforced, not hoped for.', '/* SEAM:VOICE_LAW PURE: the register law, checked.');
const L = new Function(voiceSrc + dateSrc + reportConst + bandSrc + lawSrc + '; return { readVoiceLaw, readVoiceBand };')();
const vq = [
  { text: 'I wear mine to walk the dog every single day', when: '2026-09-02', band: 'now' },                  // V1
  { text: 'If someone walks in wearing Glass I am walking out', when: '2014-04-16', band: 'earlier' },          // V2
  { text: 'Last year I explained the recording light to my class', when: '2025-11-03', band: 'before' },       // V3
  { text: 'I returned the camera pair and kept the display one', when: '2026-09-29', band: 'now' },             // V4
  { text: 'The law will not save us | Jonathan Liew theguardian.com/commentisfree/2026/aug/31/x', when: '2026-08-31' },   // V5, a shared story
  { text: 'A voice with no date at all from somewhere', band: 'undated' },                                       // V6
  { text: 'My kids ask me if the glasses are filming them now', when: '2026-09-10', band: 'now' },             // V7
  { text: 'In 2013 the bar down the street banned them outright', when: '2013-03-11', band: 'earlier' } ];      // V8
const read = { findings: [{ name: 'a', voices: ['V2', 'V1'], evidence: ['S1'] }, { name: 'b', voices: ['V3'], evidence: ['S2'] }],
  consumer_voice: { line: 'l', quotes: ['V7', 'V1'], groups: [],
    then_and_now: [{ line: 'walked out then, asks now', then: ['V2', 'V8'], now: ['V4'] }, { line: 'one-sided', then: ['V3'], now: ['V6'] }, { line: 'wrong way round', then: ['V4'], now: ['V2'] }, { line: 'the share', then: ['V5'], now: ['V7'] }] } };
const lv = L.readVoiceLaw(JSON.parse(JSON.stringify(read)), vq);
ok(lv.read.findings[0].voices.join() === 'V1,V2' && lv.read.findings[1].voices.join() === 'V3' && lv.notes.includes('time_law:voices_only_then:findings[1]') && !lv.notes.includes('time_law:voices_only_then:findings[0]'),
  'L1 a finding\'s voice from the period speaks before its older one; a finding that quotes only older voices is noted for the desk');
const tn = lv.read.consumer_voice.then_and_now;
ok(tn.length === 1 && tn[0].then.join() === 'V8' && tn[0].now.join() === 'V4' && lv.notes.includes('voice_law:quoted_twice:then_and_now[0].then:V2') && lv.notes.includes('voice_law:quoted_twice:then_and_now[1].then:V3'),
  'L2 then and now pairs voices from before the period with voices from it; a voice a finding quotes is not quoted again (each voice once)');
ok(lv.notes.includes('time_law:wrong_side:then_and_now[1].now:V6') && lv.notes.includes('time_law:one_sided:then_and_now[1]') && lv.notes.includes('time_law:wrong_side:then_and_now[2].then:V4') && lv.notes.includes('time_law:wrong_side:then_and_now[2].now:V2') && lv.notes.includes('voice_law:not_a_voice:then_and_now[3].then:V5') && lv.notes.includes('time_law:one_sided:then_and_now[3]'),
  'L3 an undated voice is never now; a pair the wrong way round, a shared story or a side left empty is dropped and noted');
ok(lv.read.consumer_voice.quotes.join() === 'V7' && lv.notes.includes('voice_law:quoted_twice:consumer_voice:V1') && L.readVoiceLaw({ consumer_voice: { quotes: [] } }, vq).read.consumer_voice.then_and_now === undefined,
  'L4 the voices in their own words are the ones no finding quoted; a read without then and now gets none invented');

// ── S: the copy desk's mechanical style checks ───────────────────────
const styleSrc = between(w, 'const READ_STYLE = {', '/* SEAM:READ_REPORT PURE: the reader law, checked.');
const S = new Function(styleSrc + '; return readStyle;')();
const sn = S({ title: 'Bystanders, not wearers, decide what glasses mean', subtitle: 'Who will wear them?', thesis: 'This means the camera lost. It might pass. Early signal only, and signals everywhere!',
  findings: [{ name: 'Hosts decide where camera glasses may go', dek: 'A launch that asks venues first wins the room.', why_it_matters: 'A product, not a toy. A tool, not a camera. "We leverage it, not them," one wrote.', what_happened: 'Venues moved, which means more. Retail followed, which means less.' },
    { name: 'n', why_it_matters: 'A pair, not a camera.' }], glossary: [{ term: 'Signal', definition: 'One source.' }], by_the_numbers: [{ stat: 'recon.signals', line: '16 stories ran in May.' }],
  consumer_voice: { then_and_now: [{ line: 'x', then: ['V1'], now: ['V2'] }] } }).notes;
ok(sn.includes('style:x_not_y_headline:title') && sn.includes('style:question_headline:subtitle') && sn.includes('style:banned:thesis:might') && sn.includes('style:opener:thesis:this means') && sn.includes('style:exclamation:thesis'),
  'S1 X-not-Y in a headline, a headline that asks, a hedge, a "This means" opener and an exclamation mark are each noted by path');
ok(sn.includes('style:x_not_y_twice:findings[0]') && !sn.includes('style:x_not_y_twice:findings[1]') && sn.includes('style:which_means_twice:findings[0]') && sn.includes('style:opener:by_the_numbers[0].line:numeral') && !sn.some(n => /glossary\[0\]\.term|by_the_numbers\[0\]\.stat|then_and_now/.test(n)) && !sn.some(n => /leverage/.test(n)),
  'S2 X-not-Y and the which-means hinge are allowed once per section (a finding is its own section); a sentence never opens on a numeral; terms, stat paths, id arrays and words inside quotes are not checked');
ok(!S({ title: 'People accept the glasses and refuse the camera', thesis: 'In May, the venues moved. An early signal held.' }).notes.length && /function readStyle\(read\)/.test(w) && /readStyle\(c\.read\)/.test(w) && /readReaderVoice\(v\.read\)\.notes, readStyle\(v\.read\)\.notes/.test(w),
  'S3 a clean read draws no note ("May" the month and "early signal" pass); the checks run on every landing, reports and weeklies alike');
const sellSrc = between(w, 'function readSellable(', '\n}\n') + '\n}\n';
ok(/\^\(\?:house_word\|id_in_prose\|plan_id_in_prose\|register\):/.test(sellSrc) && !/style:/.test(sellSrc), 'S4 a style note never holds a sale; the editors fix it in the desk (a plan id in prose does, EX17)');

// ── W: the walkers ────────────────────────────────────────────────────
ok(/if \(\/\(\?:evidence\|quotes\|voices\)\$\|\\\.\(\?:then\|now\)\$\/\.test\(path\)\) \{   \/\/ SEAM:READ_TIME/.test(w) && /\/\(\?:evidence\|quotes\|voices\)\$\|\^\(\?:then\|now\)\$\/\.test\(key \|\| ''\)\) v\.forEach\(add\)/.test(w),
  'W1 the number law keeps then and now as voice-id arrays (V only), and receipts resolve a finding\'s voices and both sides of then and now');
const rvSrc = between(w, '/* SEAM:READ_REPORT PURE: the reader law, checked.', 'async function readTick(');
const RV = new Function(rvSrc + '; return readReaderVoice;')();
ok(!RV({ consumer_voice: { then_and_now: [{ line: 'People changed', then: ['V12'], now: ['V3'] }] } }).notes.length, 'W2 the ids in then and now are not prose: the reader law never flags them');

// ── C: the contracts and the Method ───────────────────────────────────
const C = new Function(between(w, 'const READ_CONTRACT = {', 'function readIso(') + '; return READ_CONTRACT;')();
ok(/"then_and_now": 0 to 3 objects \{"line": one sentence naming what changed/.test(C.report) && /THE TIME LAW: the period leads every section/.test(C.report) && /says then, not now when it is from before the period/.test(C.report) && /stands only beside a voice from the period/.test(C.report) && /THE TIME LAW/.test(C.recon) && /then_and_now/.test(C.recon),
  'C1 the report and RECON contracts ask for then and now and carry the time law: older evidence is read as then, never presented as now');
ok(/Say stories, posts, outlets, sources, coverage, the period, consumers, comments\./.test(C.report) && /never signal except as early signal/.test(C.report) && /the evidence that pushes back on the findings/.test(C.report) && !/counter-signal/.test(C.report) && !/counter-signal/.test(C.weekly) && !/the signal count/.test(C.report),
  'C2 the reader law speaks in stories, posts and outlets; "signal" survives only as early signal; the pushback replaces the counter-signal');
ok(/^Version 4\.\d, the house style\./m.test(method) && /17\. \*\*The time law\.\*\*/.test(method) && /## The house style on the page/.test(method) && /\*\*Headlines\.\*\* A title is 5 to 10 words/.test(method) && /\*\*Named ideas\.\*\*/.test(method) && /\*\*Count the silence\.\*\*/.test(method) && /\*\*Conventions\.\*\* Numerals for 10 and above/.test(method) && /never "signal" except as "early signal"/.test(method) && /arguably/.test(method) && /game-changer/.test(method),
  'C3 Method 4 is the house style: the time law, headlines, named ideas, counting the silence, the conventions, the banned words');
ok(!/\bthe house\b(?! style)/i.test(method.replace(/"the house"/g, '')) && /\*\*ATTENTION\*\* \(RECON only/.test(method) && /a voice from before the period says then, not now/.test(method) && w.includes(JSON.stringify(method).slice(1, -1)),
  'C4 the Method never calls us "the house" (the house style is the style\'s name); it explains the attention series and the dated voices; the worker carries the exact text');

ok(/Depth is earned, never padded: when the evidence on the question is thin, widen it before you cut/.test(method) && /It is the deepest read we make, commissioned for significant value: it keeps its depth/.test(method) && !/a thin slice makes a short RECON|the read is short: fewer findings/.test(method) && /SEAM:READ_DEPTH/.test(w),
  'C5 SEAM:READ_DEPTH a RECON keeps its depth: thin evidence is widened before anything is cut, an early signal is kept and labeled, and nothing is padded');

// ── P: the page ───────────────────────────────────────────────────────
const pageSrc = between(page, 'function rpNum(', '/* ── Library');
const P = new Function('KIND', pageSrc + '; return { reportDoc, rpVoiceWho, rpAttn, rpAttnLine, rpAttnRivals, rpStatOk, rpStatFmt, rpStatLabel, rpMonth, rpKind };')({ report: 'Cultural Intelligence Report' });
ok(P.rpVoiceWho({ self: { generation: 'Gen Z', gender: 'woman', trait: '4c hair', place: 'US (Texas)' } }) === 'Gen Z woman with 4c hair in Texas' && P.rpVoiceWho({ self: { role: 'parent', place: 'UK' } }) === 'Parent in the UK' && P.rpVoiceWho({}) === 'Consumer' &&
  P.rpVoiceWho({ band: 'earlier', date: '2014-04-16' }) === 'Consumer, 2014' && P.rpVoiceWho({ band: 'earlier', date: '2014-04-16' }, true) === 'Consumer' && P.rpVoiceWho({ band: 'now', date: '2026-09-01' }) === 'Consumer',
  'P1 a voice is credited to a person by what they said about themselves, never a platform; a voice from before the period carries its year');
ok(P.rpStatOk('recon.stories_all', true) && !P.rpStatOk('lake.signals', true) && !P.rpStatOk('recon.anchors', true) && !P.rpStatOk('recon.competitors', true) && !P.rpStatOk('calls.made', false) && !P.rpStatOk('lake.shape.music.n', false) && P.rpStatOk('lake.signals', false) &&
  P.rpStatFmt('recon.attention.yoy_pct', 38) === '+38%' && P.rpStatFmt('recon.attention.yoy_pct', -12) === '-12%' && P.rpStatFmt('recon.voices_since', 2014) === '2014' && P.rpStatFmt('recon.voices_read', 1840) === '1,840' &&
  P.rpStatLabel('recon.attention.yoy_pct') === 'change in Wikipedia readers on the year before' && P.rpStatLabel('recon.by_outlet.TechCrunch') === 'stories on the question from TechCrunch' && P.rpStatLabel('lake.signals') === 'stories and posts read',
  'P2 the numbers law on the page: a RECON prints the question\'s own counts, never the machinery; a change prints with its sign, a year as a year, every path in reader words');
ok(P.rpKind({ kind: 'lake', tier: 1 }) === 'story' && P.rpKind({ kind: 'lake', tier: 3 }) === 'post' && P.rpKind({ kind: 'lake', tier: 0 }) === 'primary record' && P.rpKind({ kind: 'shared' }) === 'story', 'P3 a story is a story wherever it ran; a post is a post; a shared headline is its outlet\'s story');
const months = []; for (let y = 2023, m = 10; months.length < 36; m++) { if (m > 12) { m = 1; y++; } months.push(y + '-' + String(m).padStart(2, '0')); }
const att = { article: 'Smartglasses', months, views: months.map((m, i) => 1000 + i * 100), recent_3m: 13200, year_ago_3m: 9600, two_years_ago_3m: 6000, yoy_pct: 38, two_year_pct: 120, recent_months: months.slice(-3),
  rivals: [{ article: 'Ray-Ban Meta', views: months.map((m, i) => i < 4 ? null : 500), recent_3m: 1500, yoy_pct: 0, two_year_pct: null }] };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = P.rpAttn(att, esc);
ok(/<svg viewBox="0 0 680 180" role="img" aria-label="Smartglasses: monthly Wikipedia readers, Oct 2023 to Sep 2026">/.test(svg) && (svg.match(/<polyline/g) || []).length === 1 && /stroke="#C41230"/.test(svg) && />A YEAR BEFORE</.test(svg) && />NOW</.test(svg) && (svg.match(/<title>/g) || []).length === 36 && /<title>Smartglasses, Sep 2026: 4,500 readers<\/title>/.test(svg) && />Oct 2023</.test(svg) && />2025</.test(svg) && !/>2024</.test(svg),
  'P4 the subject is charted alone on its own axis, in red, with now and the same months a year before shaded; every month carries its figure on hover; a year label never crowds the first month');
ok(P.rpAttnLine(att) === 'Jul to Sep 2026: 13,200 readers of “Smartglasses”, up 38 percent on the same months a year before and up 120 percent on the same months two years before.' &&
  (P.rpAttnRivals(att, esc).match(/<polyline/g) || []).length === 1 && /stroke="#141414"/.test(P.rpAttnRivals(att, esc)) && /Ray-Ban Meta/.test(P.rpAttnRivals(att, esc)) && P.rpAttn({ months: months.slice(0, 6), views: [1] }, esc) === '',
  'P5 the comparison is a sentence computed from the same figures (percent in prose); a competitor gets its own small chart on its own axis, its gap unbridged; under a year draws nothing');
// a RECON, rendered: cover, answer, findings, then the numbers; voices once; then and now
const rc = { S1: { headline: 'Meta introduces a display pair without a camera', source_name: 'TechCrunch', has_image: false, date: '2026-09-24' }, L1: { kind: 'lake', headline: 'London pubs ban camera glasses', source_name: 'The Guardian', tier: 1, date: '2026-09-12', has_image: false },
  V1: { kind: 'voice', headline: 'As a mom I do not want a stranger filming my kids', source_name: 'YouTube', title: 'Are camera glasses legal?', likes: 1904, date: '2026-08-28', band: 'now', self: { role: 'parent' }, has_image: false },
  V2: { kind: 'voice', headline: 'If someone walks in wearing Glass I am walking out', source_name: 'YouTube', title: 'Glass hands on', likes: 3120, date: '2014-04-16', band: 'earlier', self: null, has_image: false },
  V3: { kind: 'voice', headline: 'Now my dad wears a pair to fish and nobody blinks', source_name: 'YouTube', title: 'Why they are back', likes: 2201, date: '2026-09-11', band: 'now', self: null, has_image: false },
  V4: { kind: 'voice', headline: 'I use the glasses to read a menu', source_name: 'Mastodon', title: '#smartglasses', likes: 52, date: '2026-09-07', band: 'now', self: null, has_image: false } };
const cited = {}, used = {};
const Hp = { esc, inner: h => '<section class="page inner">' + h + '</section>', band: (n, name, t) => '<div class="band"><div class="no">' + n + '</div><h2>' + esc(name) + '</h2><p>' + esc(t) + '</p></div>',
  photo: () => '', evline: () => '', pickImage: () => null, img: () => null, credit: () => '', real: s => rc[s] ? s : null, uniq: list => (list || []).filter(a => rc[a]),
  stat: (st, path) => { let v = st; String(path || '').split('.').forEach(k => { v = v == null ? undefined : v[k]; }); return typeof v === 'number' ? v : null; },
  fmtDate: d => String(d), pad: n => String(n).padStart(2, '0'), firstSentence: t => { const m = String(t || '').match(/^.+?[.!?](\s|$)/); return m ? m[0].trim() : String(t || ''); }, mark: () => '', capHtml: () => '', ROLES: ['creative', 'marketer', 'founder', 'exec', 'talent'], cited, used };
const x = { title: 'People accept the glasses and refuse the camera', thesis: 'The camera is the problem.', brief_answer: 'Enter with a pair that cannot record.', executive_summary: [{ line: 'Hosts decided first.', evidence: ['L1'] }],
  by_the_numbers: [{ stat: 'recon.stories_all', line: 'Sixteen stories covered it.' }, { stat: 'recon.anchors', line: 'MACHINERY' }, { stat: 'lake.signals', line: 'WHOLE PERIOD' }, { stat: 'recon.attention.yoy_pct', line: 'Readers rose.' }],
  findings: [{ name: 'Hosts decide where camera glasses may go', evidence: ['S1', 'L1'], voices: ['V1'], strength: 'pattern', confidence: 'high', supports: { outlets: 2 } }],
  for_the_brief: { who_is_in: 'Meta and the opticians.', where_to_enter: 'Optical retail.', evidence: ['S1'] },
  consumer_voice: { line: 'Wearers describe tools.', quotes: ['V4', 'V1'], then_and_now: [{ line: 'In 2014 people walked out; in 2026 they shrug.', then: ['V2'], now: ['V3'] }] } };
const cs = { stories_all: 16, outlets: 10, voices: 22, voices_read: 1840, voices_then: 7, signals: 9, stories: 7, stories_weeks: ['2026-09-07', '2026-09-14', '2026-09-21'], stories_by_week: [2, 3, 4], by_outlet: { TechCrunch: 3, 'The Guardian': 2 }, by_territory: { 'technology-innovation': 6 }, stories_by_territory: { 'technology-innovation': 3 }, attention: att, anchors: 15 };
const st = { lake: { signals: 21126, outlets: 737, prior_comparable: false }, window: { start: '2026-07-08', end: '2026-10-05', days: 90 }, recon: cs };
const g = P.reportDoc(x, st, rc, { kind: 'recon', status: 'ready', label: 'RECON 001', window_start: '2026-07-08', window_end: '2026-10-05', meta: { recon_no: 1, brief: { text: 'Smart glasses as a cultural object.' }, pack: { counts: { voices: 22, voices_read: 1840 } } } }, Hp);
const h = g.html, text = h.replace(/<[^>]+>/g, ' ');
ok(/class="kind">Unsurfaced RECON 001</.test(h) && /<b>16<\/b><span>Stories<\/span><\/div><div><b>10<\/b><span>Outlets<\/span><\/div><div><b>90<\/b><span>Days/.test(h) && !/RECON · RECON/.test(h) && !/21,126<\/b><span>Stories and posts read<\/span><\/div><div><b>737/.test(h.slice(0, h.indexOf('How to read'))),
  'P6 a RECON\'s cover names it once and carries the question\'s own figures (16 stories, 10 outlets, 90 days); the size of everything read is not a cover figure');
ok(h.indexOf('<h2>The answer</h2>') < h.indexOf('>The findings.<') && h.indexOf('>The findings.<') < h.indexOf('<h2>For the brief</h2>') && h.indexOf('<h2>For the brief</h2>') < h.indexOf('<h2>The period in numbers</h2>') && h.indexOf('<h2>The period in numbers</h2>') < h.indexOf('<h2>In their own words</h2>') &&
  /The answer<small>1 things to act on/.test(h) && h.indexOf('For the brief<small>') < h.indexOf('The period in numbers<small>'),
  'P7 the answer comes first, the findings next, the brief, then the numbers: nothing stands between the answer and the first finding');
ok(/Stories on the question, by week/.test(h) && /<b>16<\/b><span>Stories on the question<\/span><small>from 10 outlets<\/small>/.test(h) && /<b>1,840<\/b><span>Comments and posts read<\/span><small>22 consumer voices kept, 7 of them from before the period<\/small>/.test(h) && /<b>21,126<\/b><span>Stories and posts read in the period<\/span>/.test(h) &&
  /Interest over three years: “Smartglasses” on Wikipedia/.test(h) && /Who covered it/.test(h) && /Where it ran, by territory/.test(h) && /\+38% · change in Wikipedia readers on the year before/.test(h) && /16 · stories on the question/.test(h) && !/MACHINERY|WHOLE PERIOD/.test(h),
  'P8 the numbers page proves the work and measures the question: stories, comments read, the whole period once, three years of attention, stories by week, who covered it; machinery and whole-period lines never print');
const once = s => (h.match(new RegExp(s, 'g')) || []).length;
ok(once('stranger filming my kids') === 1 && once('read a menu') === 1 && /Parent · 1,904 likes/.test(h) && /Consumer, 2014 · 3,120 likes/.test(h) && !/YouTube|Mastodon/.test(text) && /<div class="kicker">Then and now<\/div>/.test(h) && /<div class="lbl">Then · 2014<\/div>/.test(h) && /In 2014 people walked out; in 2026 they shrug\./.test(h) && /What consumers said, then and now/.test(h),
  'P9 every voice prints once, credited to a person, never a platform; the older voice carries its year; Then and now sets the 2014 voice beside the period\'s');
const src = h.slice(h.lastIndexOf('<h2>Sources</h2>'));
ok(/A comment on “Are camera glasses legal\?”<\/div><div class="src">Parent · 2026-08-28 · consumer comment/.test(src) && /Consumer · 2014-04-16 · consumer comment/.test(src) && !/stranger filming|class="rp-ref"|issue \d/.test(src),
  'P10 the sources list a comment by who said it, where and when, never its words a second time; no internal id, no issue number');
ok(/<title>Unsurfaced Intelligence · The Read<\/title>/.test(page) && /row\.kind === "report" \|\| row\.kind === "recon" \? "Unsurfaced-Intelligence-" : "Unsurfaced-DAILY-"/.test(page) && /Every read we have compiled, newest first/.test(page) && /"The pushback and the whitespace"/.test(page) && !/counter-signal/i.test(pageSrc) && !/the house's answer/.test(page),
  'P11 a RECON or a report downloads as Unsurfaced Intelligence\'s; the library and the bands speak as we; the pushback replaces the counter-signal');

// ── F: the review's fixes ─────────────────────────────────────────────
const VO = new Function(voiceSrc + '; return { voiceShare, voiceDisplay, voiceClean, voiceFlat };')();
const masto = '<p>Meta smart glasses sales triple as privacy fears grow <a href="https://www.theguardian.com/technology/2026/sep/02/x"><span class="invisible">https://www.</span><span class="ellipsis">theguardian.com/technology/202</span><span class="invisible">6/sep/02/x</span></a></p>';
const sh = VO.voiceShare(VO.voiceFlat(masto));
ok(sh && sh.outlet === 'The Guardian' && sh.headline === 'Meta smart glasses sales triple as privacy fears grow' && sh.date === '2026-09-02' && VO.voiceClean(masto) === 'Meta smart glasses sales triple as privacy fears grow',
  'F1 a Mastodon link whose "https://www." stands apart is still read as the outlet\'s story: the headline carries no link piece, the date is read from the path');
ok(VO.voiceShare('Loved it.Best/worst purchase I made all year honestly') === null && VO.voiceShare('I wrote about my pair here myblog.substack.com/p/glasses') === null && VO.voiceDisplay('I love these https://www. theguardian.com/tech nology/2026/sep/02/x #glasses #meta') === 'I love these',
  'F2 a sentence with a slash is a voice, not a link (the domain must end in a real top-level domain); a person who links while speaking for themselves is a voice; link pieces and trailing tags leave the words');
const t0 = Date.now(); VO.voiceClean('a.'.repeat(6000) + ' end'); VO.voiceShare('a.'.repeat(6000)); VO.voiceDisplay('a.'.repeat(6000));
ok(Date.now() - t0 < 400, 'F3 a long dotted run costs no real CPU: the link scan reads at most the first 2,000 characters');
const supSrc = between(w, 'function readSupports(', 'function readMomentum(');
const SUP = new Function('READ_REPORT', supSrc + '; return readSupports;')({ SUPPORTS_MIN: 2, OUTLETS_MIN: 2 });
const sp = SUP({ findings: [{ name: 'x', evidence: ['L1', 'L2', 'V1', 'V2'], strength: 'pattern', confidence: 'high' }] }, id => ({ L1: 'Wired', L2: 'Wired', V1: 'The Verge' })[id] || null, id => ['L1', 'L2', 'V1'].includes(id));
ok(sp.read.findings[0].supports.lines === 3 && sp.read.findings[0].supports.outlets === 2 && sp.read.findings[0].strength === 'pattern' && !sp.notes.length,
  'F4 a shared story dated inside the period counts as its outlet\'s support; a consumer voice never dates in, so never counts');
const ev = L.readVoiceLaw({ findings: [{ name: 'a', evidence: ['S1', 'V4'], voices: ['V1'] }], consumer_voice: { quotes: ['V4'], then_and_now: { line: 'not a list', then: ['V2'], now: ['V7'] } } }, vq);
ok(ev.read.findings[0].evidence.join() === 'S1' && ev.read.findings[0].voices.join() === 'V1,V4' && ev.notes.includes('voice_law:voice_out_of_evidence:findings[0]:V4') && ev.read.consumer_voice.quotes.length === 0 && Array.isArray(ev.read.consumer_voice.then_and_now) && !ev.read.consumer_voice.then_and_now.length && ev.notes.includes('time_law:then_and_now_not_a_list'),
  'F5 a consumer voice cited as evidence moves to the finding\'s voices (it prints once, quoted); then and now that is not a list lands as an empty list, noted');
const bad = Object.assign({}, x, { consumer_voice: { line: 'l', quotes: ['V4', 'V3'], then_and_now: [{ line: 'Changed.', then: ['V2'], now: ['V3'] }, { line: 'Broken', then: 'V2', now: null }] } });
let gb = null; try { gb = P.reportDoc(bad, st, rc, { kind: 'recon', status: 'ready', label: 'RECON 001', window_start: '2026-07-08', window_end: '2026-10-05', meta: { recon_no: 1, brief: { text: 'b' } } }, Object.assign({}, Hp, { cited: {}, used: {} })); } catch (e) { gb = null; }
let gc = null; try { gc = P.reportDoc(Object.assign({}, x, { consumer_voice: { line: 'l', quotes: ['V4'], then_and_now: { line: 'x' } } }), st, rc, { kind: 'recon', status: 'ready', label: 'R', window_start: '2026-07-08', window_end: '2026-10-05', meta: { recon_no: 1 } }, Object.assign({}, Hp, { cited: {}, used: {} })); } catch (e) { gc = null; }
ok(gb && gc && (gb.html.match(/nobody blinks/g) || []).length === 1 && !/<div class="kicker">Then and now<\/div>/.test(gb.html),
  'F6 a malformed then and now never breaks the page or the PDF; a voice the quotes print is not printed again in then and now, and a pair left one-sided is not shown');
const gv = P.reportDoc(Object.assign({}, x, { findings: [Object.assign({}, x.findings[0], { evidence: ['S1', 'L1', 'V4'], voices: [] })], consumer_voice: null }), st, rc, { kind: 'recon', status: 'ready', label: 'R', window_start: '2026-07-08', window_end: '2026-10-05', meta: { recon_no: 1 } }, Object.assign({}, Hp, { cited: {}, used: {} }));
ok(/<li><span>\d+<\/span><div>A comment on “#smartglasses”<i>Consumer · 2026-09-07 · consumer comment<\/i>/.test(gv.html) && !/read a menu/.test(gv.html) && !/Mastodon/.test(gv.html),
  'F7 a voice in a finding\'s source list is credited to a person and never quoted there');
const terrX = Object.assign({}, x, { territories: [{ territory: 'technology-innovation', headline: 'The camera argument lived here', line: 'Most stories ran in technology outlets.', evidence: ['S1'], n: 6300, momentum: 'rising', share_pct: 30 }] });
const gt = P.reportDoc(terrX, st, rc, { kind: 'recon', status: 'ready', label: 'R', window_start: '2026-07-08', window_end: '2026-10-05', meta: { recon_no: 1 } }, Object.assign({}, Hp, { cited: {}, used: {} }));
ok(/<span>9 stories on the question<\/span>/.test(gt.html) && !/6,300|30% of|rp-chip rising/.test(gt.html.slice(gt.html.indexOf('<h2>The territories</h2>'))),
  'F8 a RECON\'s territory cards count the question\'s stories there, never the whole period\'s volume, share or momentum');
ok(/const recordAsk = async q => \{ try \{/.test(w) && /catch \(e\) \{ console\.log\('read_record_ask'/.test(w) && /id: 'mast:' \+ tag \+ \(ctx\.srcTag \? ':' \+ ctx\.srcTag : maxId \? ':before' : ''\)/.test(w),
  'F9 a slow record ask never stalls the tick; the history pass\'s posts are their own thread for the per-thread cap');
const arrival = fs.readFileSync('intelligence/index.html', 'utf-8');
ok(/voices\.quotes\.filter\(q=>q&&!q\.share&&q\.on_frame!==false/.test(arrival) && /v\.quotes\.filter\(q=>q&&q\.text&&!q\.share\)/.test(arrival),
  'F10 EXCAVATE\'s consumer voice panel and pull quotes never show a shared headline as a consumer');

const DN = new Function('KIND', 'esc', pageSrc + '; return deskNotesHtml;')({}, esc);
const dn = DN({ violations: ['style:banned:findings[2].why_it_matters:might', 'style:opener:executive_summary[0].line:numeral', 'register:findings[0].what_happened:pervs', 'evidence_ids_dropped:3', 'time_law:voices_only_then:findings[1]', 'proofread:4'] });
ok(/class="desknotes noprint"><b>THE COPY DESK · 4 notes/.test(dn) && /<li>Finding 3, why it matters: a word we never use \(might\)<\/li>/.test(dn) && /<li>Answer line 1, line: a sentence opens on a numeral<\/li>/.test(dn) && /Finding 1, what happened: a loaded label in our own sentence \(pervs\)/.test(dn) && /Finding 2: quotes only voices from before the period/.test(dn) && !/evidence_ids|proofread/.test(dn) && DN({ violations: ['proofread:2'] }) === '' &&
  /\(RT \? "" : deskNotesHtml\(row\)\)/.test(page) && /\.desknotes \{/.test(page),
  'F11 the copy desk\'s notes show on screen for the editor\'s last pass, in reader terms (Finding 3, why it matters), never in print or the PDF');

console.log('\nproof_read_time: ' + pass + ' checks PASS');
