/**
 * proof_the_lens.mjs  --  IQ2 THE LENS: SEAM:THE_LENS. The intelligence pass, built into the writer. The level and its lens (industry,
 * category, brand, talent: six questions each, an example each, the eight tests) ride the night's system prompt inside the hashed
 * slice; the headline is a claim about people, never a company's news; a finding is a title, a fact and a read; the takeaway says what
 * changes, for whom and why now; the pushback only where a line carries it; the people's own lines reach the writer. The code checks
 * what the writer claims: a read that is its fact again comes off, a figure the lines do not carry comes off, a claim about the measure
 * comes off, fewer than two findings waits, one outlet is never interpreted. The record pass reads the whole record again from each
 * reading's kept evidence, previewed first, the bets carried, the stamp under the new voice, a failing read keeping the old. The page:
 * the ask on one line; the takeaway where the dek stood; no bet on the card or the lead; a member's move on the card; the deep dive
 * shows the takeaway, the pushback and each finding's read.
 * Run from the repo root: node worker/proofs/proof_the_lens.mjs
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8'), w = fs.readFileSync('worker/src/index.js', 'utf-8'), seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const DASH = /[\u2014\u2013]/;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hush = async f => { const o = console.log; console.log = () => {}; try { return await f(); } finally { console.log = o; } };

// ── A: the laws ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const hashed = between(w, 'const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = ');
const lens = between(w, 'const EXC_LENS_LAW = ', 'const EXC_ROOM = ');
ok(hashed.includes('const EXC_LENS_LAW = ') && hashed.indexOf('const EXC_DISAGREE_LAW') < hashed.indexOf('const EXC_LENS_LAW') && /_WRITER_SLICES = \[\('const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '\)/.test(gate),
  'A1 the lens law sits inside the writer\'s hashed slice (after the disagree law, before the room), so the bench proves it and the gate sees it move');
const q = /\(1\)[^]*?\(2\)[^]*?\(3\)[^]*?\(4\)[^]*?\(5\)[^]*?\(6\)/;
const levels = ['INDUSTRY, for a reader inside the trade', 'CATEGORY, for a reader who makes, prices or sells the thing', 'BRAND, for the brand, its agency or its rival', 'TALENT, for the person\\\'s team or a brand deciding on them'];
ok(levels.every(l => lens.includes(l)) && levels.every((l, i) => q.test(lens.slice(lens.indexOf(l), i + 1 < levels.length ? lens.indexOf(levels[i + 1]) : lens.indexOf('THE EXAMPLES')))) && (lens.match(/It fails when/g) || []).length === 4 && (lens.match(/The read (?:names|says|separates)/g) || []).length === 4,
  'A2 four levels, six numbered questions each, each with what its read names and when it fails');
ok(/THE EXAMPLES, the explanation and the read it should have been\. Industry: "Several luxury houses raised entry prices again this season" becomes "Luxury is pricing out the buyer who made it grow\./.test(lens) && /Category: "Several tech companies launched smart glasses this quarter" becomes/.test(lens) && /Brand: "Costco drew coverage for selling gold bars and raising its fee" becomes/.test(lens) && /Talent: "A rapper\\\'s surprise album drew reviews, then a sneaker collaboration" becomes/.test(lens),
  'A3 one example a level: the explanation, then the read it should have been (the pass\'s own, until Sharp readings take their place)');
const tests = ['EARNED', 'INTERPRETS', 'AT THE LEVEL', 'NOT OBVIOUS', 'CONSEQUENCE', 'SPECIFIC', 'THE OTHER SIDE', 'MOVES FOLLOW'];
ok(/THE EIGHT TESTS every read, the takeaway and every move must pass before you write it:/.test(lens) && tests.every(t => lens.includes(t + ',')) && tests.every((t, i) => i === 0 || lens.indexOf(t + ',') > lens.indexOf(tests[i - 1] + ',')) && /PEOPLE lines \(P1, P2\) are what people said, as written: cite them for a job, a comparison, a trust or a permission; never as coverage\./.test(lens),
  'A4 the eight tests in the pass\'s order, and the people\'s lines named as what people say, never coverage');
ok(/MEASURES count press, never people, sales or sentiment\./.test(lens) && /a number comes from a cited line or MEASURES, never an estimate/.test(lens) && /coverage is never read as what people do/.test(lens) && /more stories is not a win/.test(lens) && /press volume is read as audience size/.test(lens),
  'A5 the instrument stays the instrument: the measures count press, a number comes from a line, coverage is never behavior, volume is never audience');
const head = between(w, 'const EXC_HEADLINE_LAW = ', 'const EXC_DISAGREE_LAW = ');
ok(/its subject is people \(buyers, members, fans, parents, the trade\) or what they choose, do or pay, never the signal, the count, the coverage or the measure, /.test(head) && /and never a company, a deal, a launch, a funding round or a figure: when the evidence is a company\\\'s news, the headline says what that news changes for the people it serves/.test(head) && /it is proof under the headline, never a second headline and never the news restated/.test(head),
  'A6 the headline law: people or what they choose, never a company\'s news; a company\'s news becomes what it changes for the people it serves; the dek is proof under it');
const VS = new Function(between(w, 'const EXC_VOICE_SYS = ', 'const EXC_TIME_LAW') + '; return EXC_VOICE_SYS;')();
ok(/THE SHAPE: a finding's title is a sentence a person would say, with the names in it; its fact \(the excerpt\) is what happened, short, from the evidence; its read \(the implication, the meaning\) is what that means at the subject's level, one sentence the fact alone does not say\. A move's headline is the action/.test(VS),
  'A7 the voice\'s shape: a finding is a title, a fact and a read');
ok(!DASH.test(lens) && !DASH.test(head) && !/\bAhni\b/i.test(lens + head), 'A8 no em dash in the laws');

// ── B: the prompt ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const P = new Function('excFrameBlock', 'excMeasureLine', 'DOOR_LAW', between(w, 'function excDoorPrompt(frame, evidence, measures, memory, night) {', '// The compiled text becomes') + '; return excDoorPrompt;')(f => 'FRAME ' + (f && f.entity), m => (m ? 'MEASURE LINE' : ''), { WATCH_MIN_D: 14, WATCH_MAX_D: 45 });
const prompt = P({ entity: 'Costco' }, '[1] 2026-11-01 · NOW · a line {source:WWD|url:https://x}', { series: [1] }, 'WE SAID', '2026-11-04');
ok(/Decide its level and answer the level's lens first, then write\. Return JSON exactly shaped as:\n\{"level"/.test(prompt) && prompt.indexOf('"level":"industry|category|brand|talent"') < prompt.indexOf('"lens":[') && prompt.indexOf('"lens":[') < prompt.indexOf('"read":[') && /"lens":\["six short answers in the level's order, each with the line numbers it stands on, or no evidence"\]/.test(prompt),
  'B1 the prompt opens on the level and the lens, before the read');
ok(/"takeaway":"one sentence under 28 words for the professional the frame serves: what changes, for whom and why now, at the level; never the headline or the dek again, never a figure the lines do not carry"/.test(prompt) && prompt.indexOf('"takeaway":') > prompt.indexOf('"read":[') && prompt.indexOf('"takeaway":') < prompt.indexOf('"question":'),
  'B2 the takeaway: what changes, for whom and why now, at the level, after the two lines');
ok(/"insights":\[2 to 3 of \{"category":"consumer\|market\|culture\|brand","title":"one sentence about people under the HEADLINE LAW, 6 to 13 words, no figure unless it is the point, no colon","fact":"what happened, one short sentence with the names in it, from the lines","read":"what it means at the level, one sentence the fact alone does not say, under THE EIGHT TESTS","evidence":\[1-based numbers of the lines it stands on\]\}\]/.test(prompt),
  'B3 two to three findings, each a title, a fact and a read');
ok(/"pushback":\{"line":<1-based number of the line that argues the other side>,"text":"one sentence naming what it says against the read"\} or null when no line pushes back; never by rule,/.test(prompt) && /Every read passes THE EIGHT TESTS before you write it\. JSON only\./.test(prompt) && /"watch":\{/.test(prompt) && /"ideas":\[1 to 2/.test(prompt),
  'B4 the pushback only where a line carries it, never by rule; the moves, the bet and the brief as before; the prompt closes on the tests');
ok(prompt.includes('WE SAID') && prompt.includes('[1] 2026-11-01') && prompt.includes('FRAME Costco') && !DASH.test(prompt), 'B5 the frame, the memory and the evidence ride as before; no em dash');

// ── C: the compile ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const measureSrc = between(w, 'function excMeasureLine(m) {', '/* PURE: the lines of a compiled reading that name the measure') + between(w, 'function excMeasureClaims(read) {', '\n}\n') + '\n}\n';
const groundSrc = between(w, 'const EXC_MONTH = ', 'function excGround(') + between(w, 'function excGround(text, evidence) {', '/* SEAM:EXC_FRAME: a query is turned');
const compileSrc = between(w, 'function excLensParts(parsed, merged, pool, read, names) {', '/* SEAM:TERRITORIES (EX39)');
const C = new Function('excBand', 'excWhen', 'excEarned', 'excTier', 'excClip', 'excShort', 'doorWatchOf', 'excWindow',
  measureSrc + groundSrc + compileSrc + '; return { doorCompileRead, excRestates, excMeasureClaim, excMeasureClaims, RESTATE_SHARE, excLensParts };')(
  () => 'NOW', c => (c && c.published_at ? new Date(c.published_at) : null), () => 'Medium', () => 2, (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n), v => String(v || ''), x => (x && x.claim ? { claim: x.claim, by: x.by || null } : null), () => ({}));
const lines = [
  { title: 'Costco raises its fee', text: 'Costco raised the Gold Star fee to $65 on September 1 and renewals held at 92%.', source: 'WWD', url: 'https://wwd.example/a', published_at: '2026-10-30' },
  { title: 'Gold bars sell out', text: 'Costco sold out of one-ounce gold bars within hours, Reuters reported; members bought up to $100 million a month.', source: 'Reuters', url: 'https://reuters.example/b', published_at: '2026-10-29' },
  { title: 'The counter view', text: 'Sam\'s Club undercut the fee at $50 and said its renewals rose.', source: 'Bloomberg', url: 'https://bloomberg.example/c', published_at: '2026-10-28' }
];
ok(C.excRestates('Members treat the card like a savings account', 'Members treat the Costco card like a savings account and keep buying') && !C.excRestates('Sam\'s Club cannot win this on the price of the card', 'Members paid the higher fee and kept buying gold') && !C.excRestates('', 'anything') && C.RESTATE_SHARE === 0.6
  && C.excRestates('Costco members treat the Costco card like a savings account', 'Members treat the card like a savings account', ['Costco']) && !C.excRestates('Sam\'s Club cannot win on price', 'Sam\'s Club undercut the fee at $50 and said its renewals rose on price', ['Costco', 'Sam\'s Club']) && !C.excRestates('Costco Costco wins', 'Costco wins again', ['Costco']),
  'C1 excRestates: a read made of its fact\'s own content words is the fact again; a read with its own words is not; an empty read is nothing; the subject\'s names count for nothing, and fewer than three content words are never judged');
const parsed = { level: 'brand', lens: ['a savings account (1, 2)', 'renewals held at 92% (1)', '  wins on trust (1,2) ', 'no evidence', 'gold (2)', 'a staircase (1)', 'a seventh answer'],
  read: ['Members treat the Costco card like a savings account.', 'Renewals held at 92% after the fee rose to $65 on September 1, per WWD.'],
  takeaway: 'Sam\'s Club cannot win renewal season on the price of the card; the card has to say something about who holds it.',
  question: 'What does the card mean now?',
  insights: [
    { category: 'brand', title: 'Members paid more and kept buying', fact: 'Renewals held at 92% after the fee rose to $65.', read: 'The fee is a test of trust the members passed, so the next adjacent move (a Costco credit product) is permitted.', evidence: [1] },
    { category: 'consumer', title: 'Gold is a membership benefit now', fact: 'Members bought up to $100 million of gold a month and the bars sold out in hours.', read: 'Members bought up to $100 million of gold a month; the bars sold out within hours.', evidence: [2] },
    { category: 'market', title: 'Sam\'s Club is fighting on the wrong line', fact: 'Sam\'s Club undercut the fee at $50.', read: 'A 40% share of members will defect to the cheaper card by spring.', evidence: [3] },
    { category: 'culture', title: 'A fourth finding past the cap', fact: 'x', read: 'y', evidence: [1] }
  ],
  pushback: { line: 3, text: 'Sam\'s Club says its own renewals rose at the lower fee.' },
  ideas: [{ type: 'Strategy', for: 'Sam\'s Club', headline: 'Make the card say something', body: 'b', because: 'c', proof: 'p', evidence: [3], from: 2 }],
  watch: { claim: 'Costco renewals stay above 90% through March', by: '2027-03-01' }, brief: 'Where it is.' };
const r = C.doorCompileRead(parsed, lines, { entity: 'Costco', competitors: ['Sam\'s Club'] }, null, '2026-11-04');
ok(r.insights.length === 3 && r.insights[0].excerpt === 'Renewals held at 92% after the fee rose to $65.' && r.insights[0].implication === 'The fee is a test of trust the members passed, so the next adjacent move (a Costco credit product) is permitted.',
  'C2 three findings at most; a finding keeps its fact as its excerpt (the page reads it as before) and its read as its implication when the read holds');
ok(r.insights[1].implication === null && r.insights[2].implication === null, 'C3 a read that is its fact again comes off; a read carrying a figure the lines do not (40%) comes off; the finding stays');
ok(r.takeaway === 'Sam\'s Club cannot win renewal season on the price of the card; the card has to say something about who holds it.' && r.pushback && r.pushback.line === 3 && r.pushback.text === 'Sam\'s Club says its own renewals rose at the lower fee.' && r.level === 'brand' && r.lens.length === 6 && r.lens[2] === 'wins on trust (1,2)' && r.lens[3] === 'no evidence',
  'C4 the takeaway, the pushback with its line, the level and six lens answers (trimmed, the seventh dropped) ride the compiled read');
ok(r.read[0] === 'Members treat the Costco card like a savings account.' && r.watch && r.watch.claim === 'Costco renewals stay above 90% through March' && r.ideas[0].headline === 'Make the card say something' && r.question === 'What does the card mean now?' && r.brief === 'Where it is.',
  'C5 the two lines, the bet, the moves, the question and the brief as before');
const r2 = C.doorCompileRead(Object.assign({}, parsed, { takeaway: 'Members treat the Costco card like a savings account now.', pushback: { line: 9, text: 'out of range' }, level: 'planet', lens: 'not a list' }), lines, {}, null, '2026-11-04');
ok(r2.takeaway === null && r2.pushback === null && r2.level === null && Array.isArray(r2.lens) && r2.lens.length === 0, 'C6 a takeaway that is the headline again comes off; a pushback whose line is not in the evidence comes off; a level not of the four is none; a lens that is not a list is empty');
const r3 = C.doorCompileRead(Object.assign({}, parsed, { takeaway: 'Signal tracking shows 12 mentions this week for Costco.' }), lines, {}, null, '2026-11-04');
const r4 = C.doorCompileRead(Object.assign({}, parsed, { takeaway: 'Seven in ten members would pay $90 for the card.' }), lines, {}, null, '2026-11-04');
ok(r3.takeaway === null && r4.takeaway === null && C.excMeasureClaims({ read: ['a', 'b'], takeaway: 'Coverage reads 0 this week', insights: [], ideas: [] }).some(x => x.where === 'takeaway'),
  'C7 a takeaway that names the measure comes off, and so does one carrying a figure the lines do not; excMeasureClaims names the takeaway as a place a measure claim can sit');
const r5 = C.doorCompileRead({ read: ['a', 'b'], insights: [{ category: 'brand', title: 'Old shape', excerpt: 'An excerpt, as the old voice wrote it.', evidence: [1] }], ideas: [], brief: '' }, lines, {}, null, '2026-11-04');
ok(r5.insights.length === 1 && r5.insights[0].excerpt === 'An excerpt, as the old voice wrote it.' && r5.insights[0].implication === null && r5.takeaway === null && r5.pushback === null && r5.level === null,
  'C8 a reading in the old shape (excerpt, no read, no takeaway) still compiles: the page and the record keep reading it');

// ── D: the night ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const L = new Function('excOutletKey', 'DOOR', between(w, 'const DOOR_LAW = ', 'function excDoorPrompt(') + '; return { DOOR_LAW, doorEvidenceBar, doorPeopleBlock, doorReuseStamp };')(
  new Function(between(w, 'function excOutletKey(c) {', '// SEAM:EXC_RECORD: a strong older source') + '; return excOutletKey;')(), { VOICE: '6.0' });
ok(L.doorReuseStamp({ stamp: 'v5.0~a|b#2026-10-30' }, 'v6.0~c|d#2026-11-04') === 'v5.0~c|d#2026-11-04' && L.doorReuseStamp({ stamp: null }, 'v6.0~c#2026-11-04') === 'v6.0~c#2026-11-04' && L.doorReuseStamp(null, '') === 'v6.0~' && L.doorReuseStamp({ stamp: 'v6.0~a#d' }, 'v6.0~a#d') === 'v6.0~a#d',
  'D0 doorReuseStamp: a row that keeps an older read carries that read\'s voice over tonight\'s evidence, so the night still reads it again for the voice the first night it has room; a read already under the voice is unchanged');
ok(L.DOOR_LAW.BAR_OUTLETS === 2 && L.DOOR_LAW.PEOPLE === 8 && !L.doorEvidenceBar([{ source: 'Unsurfaced Lake · The Guardian (T1)' }, { source: 'The Guardian' }, { source: 'guardian.com' }]) && L.doorEvidenceBar([{ source: 'Unsurfaced Lake · Guardian (T1)' }, { source: 'WWD' }]) && !L.doorEvidenceBar([{ source: '' }, { source: '' }, { title: 'x' }]) && !L.doorEvidenceBar([]),
  'D1 the evidence bar: two outlets by the house\'s own key (the lake\'s copy, the wire\'s and the domain are one), sourceless lines are one unknown, never two');
const pb = L.doorPeopleBlock([{ text: 'I  switched from\nthe Prime card   to Costco', likes: 12, self: { generation: 'Gen X', role: 'a nurse' } }, { text: 'x'.repeat(300), likes: 0, self: null }, { text: '' }, null].concat(Array.from({ length: 9 }, (_, i) => ({ text: 'voice ' + i, likes: 1 }))));
ok(pb.startsWith('\n\nPEOPLE (comments as written; what people say, never coverage):\nP1 "I switched from the Prime card to Costco" (Gen X, a nurse, 12 likes)\nP2 "' + 'x'.repeat(240) + '" (a consumer)\nP3 "voice 0" (a consumer, 1 likes)') && (pb.match(/\nP\d+ /g) || []).length === 8 && L.doorPeopleBlock([]) === '' && L.doorPeopleBlock(null) === '',
  'D2 the people\'s lines: numbered P1, P2 for a read to cite, as written (whitespace collapsed, 240 characters), who said it and the likes; at most eight; nothing when the night heard none');
const dp = between(w, 'async function doorPass(env, opts) {', 'async function doorLand(');
const iBar = dp.indexOf('if (!doorEvidenceBar(ev.merged)) {'), iUnmoved = dp.indexOf('out.unmoved = (out.unmoved || 0) + 1;'), iEv = dp.indexOf('const evidence = ev.merged.map((c, i) => excLine(c, i, now)).join(\'\\n\') + doorPeopleBlock(base.meta.voices);');
ok(iBar > iUnmoved && iEv > iBar && /if \(prev && prev\.read\) \{ out\.reused\+\+; rowsOut\.push\(Object\.assign\(base, \{ status: 'reused', stamp: doorReuseStamp\(prev, stamp\), read: prev\.read \}\)\); \} else \{ out\.thin\+\+; rowsOut\.push\(Object\.assign\(base, \{ status: 'failed', error: 'thin_evidence' \}\)\); \}\n        continue;/.test(dp)
  && (dp.match(/stamp: doorReuseStamp\(j\.prev, j\.base\.stamp\), read: j\.prev\.read/g) || []).length === 2,
  'D3 the night: after the reuse rules and before any spend, a subject under the bar keeps its last read (under its own voice) or waits (thin_evidence); a row kept past the cap or a seat\'s allowance keeps its read\'s voice too; the people\'s lines ride the evidence string, so the pinned prompt call stands');
ok(/system: EXC_VOICE_SYS \+ ' ' \+ EXC_MOVE_LAW \+ ' ' \+ EXC_TIME_LAW \+ ' ' \+ EXC_NUMBER_LAW \+ ' ' \+ EXC_HEADLINE_LAW \+ ' ' \+ EXC_LENS_LAW, prompt: excDoorPrompt\(frame, evidence, measures, memo\.get\(cand\.key\) \|\| '', night\)/.test(dp) && /VOICE: '6\.0'/.test(between(w, 'const DOOR = {', '\n')),
  'D4 the lens law closes the night\'s system prompt (cached, so it costs little a reading); the voice is 6.0, so the night reads every subject once more under it');
const land = between(w, 'async function doorLand(', 'async function recordPassAllowed(');
ok(/if \(\(read\.insights \|\| \[\]\)\.length < 2\) \{ await sbRest\(env, 'door_reads\?id=eq\.' \+ id, \{ method: 'PATCH', body: \{ status: 'failed', read, cost_usd: cost, error: 'thin_read'/.test(land) && land.indexOf("error: 'thin_read'") > land.indexOf('calibAdjust') && land.indexOf("error: 'thin_read'") < land.indexOf('const named = typeof excMeasureClaims'),
  'D5 a reading left with fewer than two findings is held (thin_read, the read kept on the row for the desk), after the scorecard learns and before the measure check, as EX52a holds a claim about the instrument');
ok(/if \(pass\) return recordPassLand\(env, row, got, cost, stopReason, pass, merged\);/.test(land) && land.indexOf('if (pass) return recordPassLand(') < land.indexOf("error: stopReason === 'max_tokens'") && /&select=id,frame_key,frame,measures,evidence,status,night,meta,read,stamp,cost_usd'/.test(land),
  'D6 the pass lands beside the nightly: the row\'s read and stamp are read, and a pass job never fails a reading that stands');
ok(/await doorLand\(env, row\.meta\.door_id, patch\.result, patch\.cost_usd, patch\.stop_reason, row\.meta\.pass \|\| null\)/.test(w) && /else if \(row\.meta\.pass\) await recordPassFail\(env, row\.meta\.door_id, patch\.error\)/.test(w),
  'D7 the drain hands a pass job its note; a batch failure on a pass job marks the row kept, never failed');

// ── E: the record pass ────────────────────────────────────────────────────────────────────────────────────────────────────────
const passSrc = between(w, 'const RECORD_PASS = ', 'async function doorFail(');
const T = { rows: [], patches: [], submits: [], kv: {}, published: 0, drained: 0, events: [], paths: [], copies: [], trims: [], claims: [] };
const env = { DESK_API_KEY: 'desk-secret', RATE_LIMIT: { delete: async k => { T.kv[k] = 'deleted'; }, put: async () => {}, get: async () => null } };
const sbRest = async (e, path, opts) => {
  T.paths.push((opts && opts.method) || 'GET', path);
  if (/^door_reads\?status=eq\.ready/.test(path)) return T.rows.map(r => JSON.parse(JSON.stringify(r)));
  if (/^door_reads\?frame_key=eq\./.test(path)) { const k = decodeURIComponent(path.match(/frame_key=eq\.([^&]+)/)[1]), night = path.match(/night=gt\.([^&]+)/)[1]; return T.copies.filter(c => c.frame_key === k && c.night > night).sort((a, b) => a.night.localeCompare(b.night)).map(r => JSON.parse(JSON.stringify(r))); }
  if (/^claims\?/.test(path) && opts && opts.method === 'DELETE') { T.trims.push(path); return []; }
  if (/^door_reads\?id=eq\./.test(path) && opts && opts.method === 'PATCH') { const id = path.match(/id=eq\.([^&]+)/)[1]; const row = T.rows.find(r => r.id === id) || T.copies.find(r => r.id === id); if (row) Object.assign(row, opts.body); T.patches.push({ id, body: opts.body }); return []; }
  if (/^door_reads\?id=eq\./.test(path)) { const id = path.match(/id=eq\.([^&]+)/)[1]; return T.rows.filter(r => r.id === id).map(r => JSON.parse(JSON.stringify(r))); }
  return [];
};
let ADMIN = false, USER = null;
const R = new Function('DOOR', 'DOOR_LAW', 'RECORD', 'EXC_VOICE_SYS', 'EXC_MOVE_LAW', 'EXC_TIME_LAW', 'EXC_NUMBER_LAW', 'EXC_HEADLINE_LAW', 'EXC_LENS_LAW', 'sbRest', 'excQuiet', 'json', 'authenticate', 'callerIsAdmin', 'claudeBatchDrain', 'claudeBatchSubmit', 'excLine', 'excDoorPrompt', 'doorPeopleBlock', 'doorCompileRead', 'excVoiceNotes', 'excMeasureClaims', 'doorPublish', 'logEvent', 'claimsWrite', 'claimsOf',
  passSrc + '; return { RECORD_PASS, recordPassAllowed, recordPassRoute, recordPassState, recordPassRows, recordPassStatus, recordPassQueue, recordPassMerge, recordPassLand, recordPassFail, recordPassFresh, recordPassPreviews, recordPassApply, recordPassDiscard, recordPassPage, recordPassAfter };')(
  { VOICE: '6.0', MAX_TOKENS: 16000 }, L.DOOR_LAW, { KEY: 'record:v1', SINCE: '2026-10-08' }, 'VOICE', 'MOVE', 'TIME', 'NUMBER', 'HEADLINE', 'LENS', sbRest, (where, v) => e => v, (d, s) => ({ status: s, body: d }),
  async () => USER, async () => ADMIN, async () => { T.drained++; return { done: 1 }; }, async (e, tier, kind, items) => { T.submits.push({ tier, kind, items }); return { ok: true, batch_id: 'b9', n: items.length, est_usd: 0.07 * items.length }; },
  (c, i) => '[' + (i + 1) + '] ' + c.title + ': ' + c.text, (frame, evidence, measures, memory, night) => 'PROMPT ' + night + '\n' + evidence, L.doorPeopleBlock, C.doorCompileRead, read => ({ notes: [] }), C.excMeasureClaims, async () => { T.published++; }, async (e, p, s, ev, sid, meta) => T.events.push({ ev, meta }), async (e, rows) => { T.claims.push(rows); return { wrote: rows.length }; }, (src, id, read, lines, frame, night) => (read.insights || []).map((x, i) => ({ src, reading_id: id, idx: i, claim: x.title, night, lines: lines.length })));
const oldRead = { read: ['Costco quiet this month', 'Coverage held at seven stories, per the lake.'], insights: [{ title: 'old one', excerpt: 'x' }, { title: 'old two', excerpt: 'y' }], ideas: [{ headline: 'Old move' }], brief: 'old', watch: { claim: 'Costco renewals stay above 90% through March', by: '2027-03-01' } };
const mkRow = (id, night, extra) => Object.assign({ id, frame_key: 'brand:costco' + id, night, status: 'ready', frame: { entity: 'Costco', category: 'retail' }, measures: null, read: JSON.parse(JSON.stringify(oldRead)), evidence: lines.map(l => Object.assign({ quoted: false, place: null, tier: 1 }, l)), meta: { voices: [{ text: 'I switched to the Costco card for the gas alone', likes: 8, self: null }], called: null }, stamp: 'v5.0~s1|s2#2026-10-30', cost_usd: 0.3 }, extra || {});
const reqOf = (key, body) => ({ headers: { get: h => (h === 'x-desk-key' ? key : '') }, json: async () => body });
ok(await R.recordPassAllowed(reqOf('desk-secret'), env) && !(await R.recordPassAllowed(reqOf('wrong'), env)) && !(await R.recordPassAllowed(reqOf(''), env)) && (USER = { id: 'u1' }, ADMIN = true, await R.recordPassAllowed(reqOf(''), env)) && (ADMIN = false, !(await R.recordPassAllowed(reqOf(''), env))),
  'E1 the pass opens to the desk key or an admin, never to a member');
const r401 = await R.recordPassRoute(reqOf('wrong', { queue: 6 }), env, '*');
ok(r401.status === 401 && r401.body.error === 'unauthorized' && T.submits.length === 0, 'E2 an unauthorized ask queues nothing');
T.rows = [mkRow('a1', '2026-11-04'), mkRow('a2', '2026-11-03'), mkRow('a3', '2026-11-02', { meta: { voices: [], pass: { voice: '5.0', status: 'landed' } } }), mkRow('a4', '2026-11-01', { meta: { voices: [], pass: { voice: '6.0', status: 'queued', at: new Date(Date.now() - 27 * 3600 * 1000).toISOString() } } }), mkRow('a5', '2026-10-31', { meta: { voices: [], pass: { voice: '6.0', status: 'landed' } } }), mkRow('a6', '2026-10-30', { meta: { voices: [], pass: { voice: '6.0', status: 'queued', at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() } } }), mkRow('a7', '2026-10-29', { meta: { voices: [], pass: { voice: '6.0', status: 'kept', why: 'batch: expired' } } }), mkRow('a8', '2026-10-28', { meta: { voices: [], pass: { voice: '6.0', status: 'kept', why: 'thin_read' } } })];
ok(R.recordPassState(T.rows[0]) === 'unread' && R.recordPassState(T.rows[2]) === 'unread' && R.recordPassState(T.rows[3]) === 'queued' && R.recordPassState(T.rows[4]) === 'landed',
  'E3 a row\'s state: unread until a pass under this voice touched it (an older voice\'s pass does not count), then queued, previewed, landed or kept');
const st = await R.recordPassStatus(env);
ok(st.voice === '6.0' && st.readings === 8 && st.unread === 3 && st.queued === 2 && st.landed === 1 && st.kept === 2, 'E4 the status counts the record by state');
const qd = await hush(() => R.recordPassQueue(env, 2, true));
ok(qd.ok && qd.queued === 2 && qd.preview === true && qd.ids.join() === 'a1,a2' && T.submits.length === 1 && T.submits[0].tier === 'live' && T.submits[0].kind === 'door_read' && T.submits[0].items.length === 2,
  'E5 queue 2 in preview: the two newest unread readings go to the overnight batch as door_read jobs, nothing gathered');
const it = T.submits[0].items[0];
ok(/^pass-[0-9a-f]{2}-\d{8}$/.test(it.custom_id) && it.system === 'VOICE MOVE TIME NUMBER HEADLINE LENS' && it.cache === true && it.max_tokens === 16000 && it.meta.door_id === 'a1' && it.meta.pass.voice === '6.0' && it.meta.pass.preview === true && it.prompt.startsWith('PROMPT 2026-11-04\n[1] Costco raises its fee: ') && /PEOPLE \(comments as written/.test(it.prompt) && /P1 "I switched to the Costco card for the gas alone" \(a consumer, 8 likes\)/.test(it.prompt),
  'E6 each job: the writer\'s system with the lens law, the stored evidence as the night saw it (its own date, its people\'s lines), the row and the pass on its meta');
ok(T.rows[0].meta.pass.status === 'queued' && T.rows[0].meta.pass.batch_id === 'b9' && T.rows[0].meta.voices.length === 1 && T.rows[0].read.read[0] === 'Costco quiet this month' && T.events.some(e => e.ev === 'record_pass_queued' && e.meta.n === 2),
  'E7 a queued row keeps its reading and its voices; the pass rides its meta with the batch; the ledger logs it');
const qd2 = await hush(() => R.recordPassQueue(env, 10, false));
ok(qd2.ok && qd2.queued === 3 && qd2.ids.join() === 'a3,a4,a7' && T.submits[1].items.every(x => x.meta.pass.preview === false),
  'E8 queued again: a1 and a2 wait on their batch, a3 (passed under the old voice), a4 (queued 27 hours ago, past the batch\'s own day) and a7 (kept for a batch error) go; a6 (queued two hours ago) waits, a8 (kept on the writer\'s judgment) and a5 (landed) never twice');
const m = R.recordPassMerge(oldRead, { read: ['New headline', 'New dek'], watch: { claim: 'a new bet' }, takeaway: 't' }, 'v5.0~s1|s2#2026-10-30');
ok(m.read.read[0] === 'New headline' && m.read.watch.claim === 'Costco renewals stay above 90% through March' && m.read.takeaway === 't' && m.stamp === 'v6.0~s1|s2#2026-10-30' && R.recordPassMerge(null, { read: ['a', 'b'] }, null).stamp === 'v6.0~' && R.recordPassMerge({ watch: null }, { watch: { claim: 'n' } }, 'v5.0~k#d').read.watch === null,
  'E9 the merge: the new read with the old bet carried (it is being graded), never a new one (it would be dated from an old night and graded at once); the stamp under the new voice over the same evidence, so the night never reads it again for the voice alone');
// the landings
const newText = JSON.stringify(parsed);
const landP = await hush(() => R.recordPassLand(env, T.rows[0], { read: JSON.parse(newText) }, 0.06, 'end_turn', { preview: true, voice: '6.0' }, lines));
ok(landP.status === 'previewed' && T.rows[0].meta.pass.status === 'previewed' && T.rows[0].meta.pass.cost_usd === 0.06 && T.rows[0].meta.pass_read && T.rows[0].meta.pass_read.read[0] === 'Members treat the Costco card like a savings account.' && T.rows[0].read.read[0] === 'Costco quiet this month' && T.rows[0].stamp === 'v5.0~s1|s2#2026-10-30' && T.published === 0,
  'E10 a preview lands on the row beside the reading (meta.pass_read); the record, the stamp and the cache are untouched');
T.copies = [{ id: 'c31', frame_key: 'brand:costcoa3', night: '2026-11-03', status: 'reused', read: JSON.parse(JSON.stringify(oldRead)), stamp: 'v5.0~s3#2026-11-03' }, { id: 'c32', frame_key: 'brand:costcoa3', night: '2026-11-04', status: 'reused', read: JSON.parse(JSON.stringify(oldRead)), stamp: 'v5.0~s4#2026-11-04' }, { id: 'c33', frame_key: 'brand:costcoa3', night: '2026-11-05', status: 'reused', read: { read: ['A later reading took over', 'd'] }, stamp: 'v6.0~s5#2026-11-05' }, { id: 'c34', frame_key: 'brand:costcoa3', night: '2026-11-06', status: 'reused', read: JSON.parse(JSON.stringify(oldRead)), stamp: 'v5.0~s6#2026-11-06' }];
const landD = await hush(() => R.recordPassLand(env, T.rows[2], { read: JSON.parse(newText) }, 0.05, 'end_turn', { preview: false, voice: '6.0' }, lines));
ok(landD.status === 'landed' && T.rows[2].read.read[0] === 'Members treat the Costco card like a savings account.' && T.rows[2].read.watch.claim === 'Costco renewals stay above 90% through March' && T.rows[2].read.takeaway && T.rows[2].read.insights.length === 3 && T.rows[2].stamp === 'v6.0~s1|s2#2026-10-30' && T.rows[2].cost_usd === 0.35 && T.rows[2].meta.pass.status === 'landed' && T.rows[2].meta.pass_was.read[0] === 'Costco quiet this month' && T.rows[2].meta.pass_read === null && T.kv['record:v1'] === 'deleted' && T.published === 1,
  'E11 a direct landing takes the record\'s place: the new read with the bet carried, the stamp under the new voice, the cost added, what stood before kept on the row; the record cache dropped and the night\'s set republished');
ok(T.copies[0].read.read[0] === 'Members treat the Costco card like a savings account.' && T.copies[0].stamp === 'v6.0~s3#2026-11-03' && T.copies[1].read.takeaway && T.copies[1].stamp === 'v6.0~s4#2026-11-04' && T.copies[2].read.read[0] === 'A later reading took over' && T.copies[3].read.read[0] === 'Costco quiet this month' && T.copies[3].stamp === 'v5.0~s6#2026-11-06',
  'E11b the reused rows that copied the reading forward take the new read and the new voice on their stamp (the night\'s set and the next night read the newest row), stopping where a later reading took over');
ok(T.claims.length === 1 && T.claims[0].length === 3 && T.claims[0][0].reading_id === 'a3' && T.claims[0][0].claim === 'Members paid more and kept buying' && T.claims[0][0].lines === 3 && T.trims.length === 1 && /^claims\?src=eq\.door&reading_id=eq\.a3&idx=gte\.3$/.test(T.trims[0]),
  'E11c the claims rows are written again for the new findings (the upsert keeps the reading\'s grade and marks), and a finding past the new count is removed');
const thin = JSON.stringify(Object.assign({}, parsed, { insights: parsed.insights.slice(0, 1) }));
const landK = await hush(() => R.recordPassLand(env, T.rows[3], { read: JSON.parse(thin) }, 0.05, 'end_turn', { preview: false, voice: '6.0' }, lines));
const landU = await hush(() => R.recordPassLand(env, T.rows[1], null, 0.01, 'max_tokens', { preview: true, voice: '6.0' }, lines));
const measured = JSON.stringify(Object.assign({}, parsed, { read: ['Signal tracking shows 12 mentions this week.', 'dek'] }));
const landM = await hush(() => R.recordPassLand(env, T.rows[4], { read: JSON.parse(measured) }, 0.05, 'end_turn', { preview: false, voice: '6.0' }, lines));
ok(landK.status === 'kept' && landK.why === 'thin_read' && T.rows[3].read.read[0] === 'Costco quiet this month' && T.rows[3].stamp === 'v5.0~s1|s2#2026-10-30' && T.rows[3].meta.pass.status === 'kept' && landU.why === 'truncated' && T.rows[1].read.read[0] === 'Costco quiet this month' && !T.rows[1].meta.pass_read && landM.why === 'measure_claim: read' && T.rows[4].read.read[0] === 'Costco quiet this month',
  'E12 a new read that fails a check (fewer than two findings, nothing parsable, a claim about the measure) leaves the old read standing, the reason on the row; the pass never empties the record');
await hush(() => R.recordPassFail(env, 'a2', 'batch_expired'));
ok(T.rows[1].meta.pass.status === 'kept' && /^batch: batch_expired/.test(T.rows[1].meta.pass.why) && T.rows[1].read.read[0] === 'Costco quiet this month', 'E13 a batch that fails marks the row kept with the batch\'s reason');
// the previews, shown and applied
T.rows[1].meta.pass = { voice: '6.0', status: 'previewed', cost_usd: 0.04 }; T.rows[1].meta.pass_read = JSON.parse(JSON.stringify(T.rows[0].meta.pass_read)); T.rows[1].meta.pass_read.read[0] = '<b>Second</b> & new';
const pv = await R.recordPassPreviews(env);
const html = R.recordPassPage(pv);
ok(pv.length === 2 && /<!doctype html>/.test(html) && /2 readings in preview/.test(html) && /ON THE RECORD · brand/.test(html) === false && /THE NEW READ · brand/.test(html) && /ON THE RECORD<\/div><h3>Costco quiet this month<\/h3>/.test(html) && /&lt;b&gt;Second&lt;\/b&gt; &amp; new/.test(html) && !/<b>Second<\/b>/.test(html) && /The bet: Costco renewals stay above 90% through March \(carried\)/.test(html) && /Pushback, line 3: Sam&#39;s Club says its own renewals rose/.test(html) === false && /Pushback, line 3: /.test(html) && /<i>The fee is a test of trust/.test(html),
  'E14 the preview page: every previewed reading, the record beside the new read (its level, takeaway, findings with their reads, pushback, moves, the bet marked carried), escaped; nothing on it spends');
const sh = await R.recordPassRoute(reqOf('desk-secret', { show: true }), env, '*');
ok(sh instanceof Response && sh.status === 200 && /text\/html/.test(sh.headers.get('Content-Type')) && sh.headers.get('Cache-Control') === 'no-store', 'E15 {show:true} answers the page itself, uncached');
T.published = 0; T.kv = {};
const ap = await hush(() => R.recordPassApply(env, ['a1']));
ok(ap.ok && ap.applied === 1 && T.rows[0].read.read[0] === 'Members treat the Costco card like a savings account.' && T.rows[0].read.watch.claim === 'Costco renewals stay above 90% through March' && T.rows[0].stamp === 'v6.0~s1|s2#2026-10-30' && T.rows[0].meta.pass.status === 'landed' && T.rows[0].meta.pass.applied_at && T.rows[0].meta.pass_read === null && Math.abs(T.rows[0].cost_usd - 0.36) < 1e-9 && T.claims.length === 2 && T.claims[1][0].reading_id === 'a1' && T.rows[1].meta.pass.status === 'previewed' && T.rows[1].read.read[0] === 'Costco quiet this month' && T.kv['record:v1'] === 'deleted' && T.published === 1,
  'E16 apply by id publishes that preview alone: the merge, the stamp, the cost, the cache dropped; the other preview waits');
const dc = await R.recordPassDiscard(env);
ok(dc.ok && dc.discarded === 1 && T.rows[1].meta.pass === null && T.rows[1].meta.pass_read === null && T.rows[1].read.read[0] === 'Costco quiet this month' && R.recordPassState(T.rows[1]) === 'unread', 'E17 discard drops the previews; the readings stand as they were and may be queued again');
const cl = await R.recordPassRoute(reqOf('desk-secret', { collect: true }), env, '*');
ok(cl.status === 200 && cl.body.ok && cl.body.drain.done === 1 && T.drained === 1 && typeof cl.body.status.unread === 'number', 'E18 {collect:true} drains the batches now and answers with the status');
const stOnly = await R.recordPassRoute(reqOf('desk-secret', {}), env, '*');
ok(stOnly.status === 200 && stOnly.body.ok && stOnly.body.voice === '6.0' && stOnly.body.readings === 8, 'E19 an empty body answers the status');
ok(/if \(path === '\/reads\/record-pass' && request\.method === 'POST'\) return recordPassRoute\(request, env, origin\);/.test(w) && w.indexOf("path === '/reads/record-pass'") < w.indexOf('const user = await authenticate(request, env);') && w.indexOf("path === '/reads/record-pass'") > w.indexOf("path === '/bench/run'"),
  'E20 the route is dispatched beside the bench, ahead of the member routes; it checks its own key');
ok(/RECORD_PASS = \{ MAX: 100, DEFAULT: 6, STALE_MS: 26 \* 3600 \* 1000 \}/.test(w) && /const PASS_SEL = 'select=id,frame_key,night,status,frame,measures,read,evidence,meta,stamp,cost_usd';/.test(w) && /doorCompileRead\(got\.read, merged, row\.frame, row\.measures, row\.night, Date\.parse\(String\(row\.night \|\| ''\)\.slice\(0, 10\) \+ 'T06:00:00Z'\) \|\| undefined\)/.test(passSrc) && /order=night\.desc,created_at\.desc&limit=' \+ RECORD_PASS\.MAX/.test(passSrc) && /night=gte\.' \+ RECORD\.SINCE/.test(passSrc) && !DASH.test(passSrc) && !/\bAhni\b/i.test(passSrc) && !/space_reads/.test(passSrc),
  'E21 the pass reads the record\'s own rows (ready, since the earned law, at most a hundred, newest first, with their cost) and never a private reading; a queued row is never written twice inside the batch\'s day; the pass compiles as of its night; no em dash');

// ── F: the tile ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const TL = new Function('excFrameLabel', 'excMeasureClaim', 'doorPhoto', 'doorPlaceOf', 'DOOR_VOICES', 'doorVoicePublic', 'voiceBarred', between(w, 'function doorTile(r) {', '\n}\n') + '\n}; return doorTile;')(
  f => f.entity || '', C.excMeasureClaim, () => null, () => null, { KEEP: 6 }, v => v, () => false);
const t1 = TL({ id: 'x', frame_key: 'k', night: '2026-11-04', status: 'ready', frame: { entity: 'Costco' }, measures: {}, read: Object.assign({}, oldRead, { takeaway: 'Sam\'s Club cannot win this on the price of the card.', level: 'brand' }), evidence: [], meta: {} });
const t2 = TL({ id: 'y', frame_key: 'k', night: '2026-11-04', status: 'ready', frame: {}, measures: {}, read: Object.assign({}, oldRead, { takeaway: 'Signal tracking shows 9 mentions this week.', level: 'brand' }), evidence: [], meta: {} });
const t3 = TL({ id: 'z', frame_key: 'k', night: '2026-11-04', status: 'ready', frame: {}, measures: {}, read: oldRead, evidence: [], meta: {} });
ok(t1.takeaway === 'Sam\'s Club cannot win this on the price of the card.' && t1.level === 'brand' && t2.takeaway === null && t3.takeaway === null && t3.level === null && t1.claim === 'Costco quiet this month' && t1.dek === null && t1.watch.claim === 'Costco renewals stay above 90% through March',
  'F1 the tile carries the takeaway and the level; a takeaway naming the measure never reaches a tile (as the dek check holds); an old reading carries none; the bet rides as before');

// ── G: the page ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const css = between(page, '<style id="the-scroll">', '</style>'), lensCss = between(page, '<style id="the-lens">', '</style>');
ok(/#sec-explore \.hs-top\{grid-template-columns:minmax\(0,1\.3fr\) minmax\(0,1fr\);grid-template-areas:"ask ask" "box side";gap:calc\(8px\*var\(--k\)\) calc\(56px\*var\(--k\)\);/.test(css) && /#sec-explore \.hs-top h1\.hero-title,#sec-explore \.hero\.solo \.hs-top h1\.hero-title\{grid-area:ask;[^}]*white-space:nowrap;max-width:none\}/.test(css) && /\.hs-side\{grid-area:side;[^}]*padding-top:calc\(18px\*var\(--k\)\)\}/.test(css) && /\.search-shell\{grid-area:box;margin-top:calc\(18px\*var\(--k\)\)\}/.test(css),
  'G1 the ask on one line across the first section (its box uncapped, with the hero alone too); the box and the reader\'s side under it with their tops on one line');
ok(/@media \(max-width:1000px\)\{#sec-explore \.hs-top\{grid-template-columns:minmax\(0,1fr\);grid-template-areas:"ask" "box" "side";[^}]*\}#sec-explore \.hs-top h1\.hero-title\{font-size:clamp\(38px,11vw,48px\);white-space:normal\}/.test(css) && (page.match(/<style id="the-lens">/g) || []).length === 1 && page.indexOf('<style id="the-lens">') > page.indexOf('<style id="the-scroll">') && page.indexOf('<style id="the-lens">') < page.indexOf('<style id="partner">'),
  'G2 on a phone the ask wraps again; one style block for the cut, after the scroll\'s and before the partner\'s');
ok(/\.lead-reading \.text>p\.lead-take\{/.test(lensCss) && /\.lead-reading \.text>p\.lead-proof\{/.test(lensCss) && /\.hs-card \.hs-cardmove\{/.test(lensCss) && /\.hs-pop-take\{/.test(lensCss) && /\.read-take\{/.test(lensCss) && /\.read-pushback\{/.test(lensCss) && !DASH.test(lensCss), 'G3 the style names every new surface; no em dash');
const lead = between(page, 'function _leadRender(rec) {', 'function _leadWire(');
ok(/<h2>\$\{safe\(t\.claim \|\| t\.title\)\}<\/h2>\$\{t\.takeaway \? `<p class="lead-take">\$\{safe\(t\.takeaway\)\}<\/p>` : ''\}\$\{t\.dek \? `<p\$\{t\.takeaway \? ' class="lead-proof"' : ''\}>\$\{safe\(t\.dek\)\}<\/p>` : ''\}/.test(lead) && !/_leadBet\(t\)/.test(lead) && /_hsMoveBlock\(t\)/.test(lead),
  'G4 the lead: the takeaway under the headline, the dek under it as proof; no bet on the lead (it lives in the move); then the move or the door to it');
// the card, with the house-style harness's fakes
const hs = between(page, 'const _HS = {', 'function _hsWeekPhoto(');
const seen = { opened: [] };
const mkCard = (win) => new Function('window', '_gal', '_FI_RECORD', '_FI_LAKE', 'safe', 'safeAttr', '_recDay', '_leadBet', '_yoursTag', 'openFeaturedCard', 'document',
  hs + '; return { _hsCard, _hsMoves, _hsMoveOf };')(win, { set: null }, { tiles: [] }, { door: { tiles: [] } }, esc, esc, d => (d ? String(d).slice(5, 10) : ''), t => '<div class="rec-watch open"><i>The bet</i> x</div>', () => '', id => seen.opened.push(id), { getElementById: () => null, createElement: () => ({ style: {} }), body: { classList: { add() {}, remove() {} } }, addEventListener() {} });
const tile = { id: 'c1', claim: 'Members treat the Costco card like a savings account', dek: 'Renewals held at 92%, per WWD.', takeaway: 'Sam\'s Club cannot win renewal season on the price of the card.', watch: { claim: 'bet' }, deployed: '2026-11-04', frame: { entity: 'Costco' }, measures: {}, photo: null };
const V = mkCard({ _signedOut: true }), cardV = V._hsCard(tile, new Set());
ok(/<h3>Members treat the Costco card like a savings account<\/h3><p class="hs-dek">Sam&#39;s Club cannot win renewal season on the price of the card\.<\/p><div class="hs-lockrow" aria-hidden="true"><span>The move<\/span><i><\/i><i><\/i><\/div><button type="button" class="hs-btn hs-movebtn" onclick="_hsMoveOpen\('c1'\)">Open the move<\/button><\/div><\/article>$/.test(cardV) && !/The bet/.test(cardV) && !/Renewals held/.test(cardV),
  'G5 a visitor\'s card: the claim, the takeaway where the dek stood, the lock, the move\'s button last; no bet, no dek');
const cardV2 = V._hsCard(Object.assign({}, tile, { takeaway: null }), new Set());
ok(/<p class="hs-dek">Renewals held at 92%, per WWD\.<\/p>/.test(cardV2) && !/The bet/.test(cardV2), 'G6 a reading without a takeaway (the old voice) shows its dek, as before; still no bet');
const M = mkCard({ _signedOut: false }); M._hsMoves.ids.c1 = 'Make the card say something about who holds it';
const cardM = M._hsCard(tile, new Set());
ok(/<p class="hs-dek">Sam&#39;s Club cannot win renewal season on the price of the card\.<\/p><div class="hs-cardmove"><div class="hs-k">The move<\/div><p class="hs-move-text">Make the card say something about who holds it<\/p><\/div><button type="button" class="hs-btn hs-movebtn" onclick="_hsMoveOpen\('c1'\)">Open the move<\/button>/.test(cardM) && !/hs-lockrow/.test(cardM) && !/The bet/.test(cardM) && M._hsMoveOf(tile) === 'Make the card say something about who holds it',
  'G7 a member\'s card carries the move itself (from the moves the page took, or the reading\'s own), no lock; the button still opens it');
const cardM2 = M._hsCard(Object.assign({}, tile, { id: 'c2' }), new Set());
ok(/hs-lockrow/.test(cardM2) && !/hs-cardmove/.test(cardM2), 'G8 a member whose moves have not arrived sees the lock (hidden by the signed-in style) until they do; the scroll is drawn again when they arrive (_hsMovesApply)');
ok(/function _hsMovesApply\(\) \{\n  _hsMovesMerge\(\);\n  window\._hsMovesAt = String\(_hsMoves\.at\);\n  _hsRedraw\(\);/.test(page), 'G9 the moves\' arrival redraws the scroll');
const pop = between(page, 'function _hsMoveDraw(t, quiet) {', 'function _hsMoveClose(');
ok(/<p class="hs-pop-read">The read: \$\{safe\(t\.claim \|\| t\.title \|\| ''\)\}<\/p>\$\{t\.takeaway \? `<p class="hs-pop-take">\$\{safe\(t\.takeaway\)\}<\/p>` : ''\}/.test(pop) && /\$\{t\.watch \? `<div class="hs-pop-bet">\$\{_leadBet\(t\)\}<\/div>` : ''\}/.test(pop),
  'G10 the move\'s pop-out carries the takeaway with the read, and keeps the bet (the one place it shows beside the move it belongs to)');
ok(/takeaway:syn&&syn\.takeaway\|\|null, pushback:syn&&syn\.pushback\|\|null, level:syn&&syn\.level\|\|null,/.test(page) && /\$\{data\.takeaway\?`<p class="read-take">\$\{safe\(data\.takeaway\)\}<\/p>`:''\}\$\{data\.pushback&&data\.pushback\.text\?`<p class="read-pushback"><b>The other side<\/b> \$\{safe\(data\.pushback\.text\)\}<\/p>`:''\}/.test(page),
  'G11 the deep dive: the takeaway and the other side under the two lines, from the stored read');
ok(/<p class="modal-body">\$\{safe\(ins\.excerpt\)\}<\/p>\$\{ins\.implication\?`<p class="modal-body modal-read"><strong>So:<\/strong> \$\{safe\(ins\.implication\)\}<\/p>`:''\}/.test(page) && /implication: ins\.implication\|\|null/.test(page) && /\$\{_meaningBlock\(ins\)\}/.test(page) && /\$\{x\.implication\?`<br><small>SO<\/small> \$\{safe\(x\.implication\)\}`:''\}/.test(page),
  'G12 a finding\'s detail shows its read (So:), as the card already did; the export carries it');
ok(!DASH.test(lensCss + lead + hs + pop) && !/\bAhni\b/i.test(page), 'G13 no em dash in the page\'s new code');

// ── H: the seam and the gate ──────────────────────────────────────────────────────────────────────────────────────────────────
ok(seams.registry['SEAM:THE_LENS'] && seams.registry['SEAM:THE_LENS'].file === 'worker/src/index.js' && seams.registry['SEAM:THE_LENS@intelligence'] && seams.registry['SEAM:THE_LENS@intelligence'].tag === 'SEAM:THE_LENS' && seams.registry['SEAM:THE_LENS@intelligence'].file === 'intelligence/index.html' && /SEAM:THE_LENS/.test(w) && /SEAM:THE_LENS/.test(page),
  'H1 the seam is registered for the worker and the page');
ok(/the writer changed since the bench last ran/.test(gate) && /is below the floor/.test(gate), 'H2 the gate still holds the writer to the bench: a changed writer needs a bench run, and a mean below the floor fails');
// ── I: the live writer and the dry run ────────────────────────────────────────────────────────────────────────────────────────
const synth = between(w, 'async function synthesize(body, env, origin, hooks) {', 'async function synthesizeStream(');
ok(/system: \(isReport \? sys \+ ' ' \+ EXC_MOVE_LAW \+ ' ' \+ EXC_HEADLINE_LAW : sys\) \+ ' ' \+ EXC_TIME_LAW \+ ' ' \+ EXC_NUMBER_LAW/.test(synth) && !/EXC_LENS_LAW : sys\)/.test(synth) && /REV: 'i5'/.test(between(w, 'const EXC_MODEL = {', '\n')),
  'I1 the box\'s full read (the bench\'s writer) keeps its own system: the lens law rides the night\'s writer only (IQ2c, the bench of Nov 5); reads cached under the old writer are not served (i5)');
const report = new Function(between(w, 'function excReportPrompt(query, evidence) {', 'function excShort(v)') + '; return excReportPrompt;')()('q', 'E');
ok(/Return JSON exactly shaped as:\n\{"frame":\{/.test(report) && !/"level":|"lens":|the level's lens/.test(report) && report.indexOf('"takeaway":"one sentence under 28 words for the professional the question serves: what changes, for whom and why now; never the headline') > report.indexOf('"read":[') && /"pushback":\{"line":<1-based number of the line that argues the other side>/.test(report) && /"meaning":\{"culture":/.test(report) && /The takeaway and every meaning say what the fact alone does not, and nothing the lines do not carry\. JSON only\.$/.test(report),
  'I2 the report\'s shape (IQ2c): the takeaway after the two lines in its own words, the pushback only where a line carries it, the three meanings kept as the finding\'s read, no level and no lens; it closes in its own words');
ok(/const lensParts = isReport && typeof excLensParts === 'function' \? excLensParts\(parsed, merged, measures \? \[\{ text: excMeasureLine\(measures\) \}\] : \[\], read, \[frame0 && frame0\.entity\]/.test(synth) && /takeaway: lensParts\.takeaway, pushback: lensParts\.pushback, level: lensParts\.level, lens: lensParts\.lens,/.test(synth),
  'I3 the live read carries the takeaway and the pushback under the same checks as the night (excLensParts; the level null and the lens empty since IQ2c), so the page reads both the same way');
const LP = C.excLensParts;
const lp = LP({ level: 'talent', lens: ['a'], takeaway: 'Fans follow the work, not the feud, so the partner buys the song.', pushback: { line: 1, text: 'The press says the feud.' } }, [{ text: 'line one' }], [], ['The headline', 'The dek'], []);
ok(lp.level === 'talent' && lp.lens.length === 1 && lp.takeaway === 'Fans follow the work, not the feud, so the partner buys the song.' && lp.pushback.line === 1 && LP({}, [], [], [], []).takeaway === null && LP({ takeaway: 'Signal tracking shows 9 mentions this week' }, [], [], [], []).takeaway === null && LP({ pushback: { line: 2, text: 'x' } }, [{ text: 'one' }], [], [], []).pushback === null,
  'I4 excLensParts alone: the parts when they hold; nothing from nothing; a measure claim comes off; a pushback past the evidence comes off');
const tb = between(w, '/* ═══ SEAM:TAKEAWAY_TEST', '/* ═══ end SEAM:TAKEAWAY_TEST');
ok(/const system = EXC_VOICE_SYS \+ ' ' \+ EXC_MOVE_LAW \+ ' ' \+ EXC_TIME_LAW \+ ' ' \+ EXC_NUMBER_LAW \+ ' ' \+ EXC_HEADLINE_LAW \+ ' ' \+ EXC_LENS_LAW;/.test(tb) && /doorCompileRead\(got\.read, merged, r\.frame, r\.measures \|\| \{\}, r\.night, nightMs\)/.test(tb) && /doorPeopleBlock\(r\.meta && r\.meta\.voices\)/.test(tb) && /MAX: 12/.test(tb) && !/base\.replace\(TAKEAWAY_TEST\.ANCHOR/.test(tb) && /reads_dropped:/.test(tb) && /held \}/.test(tb),
  'I5 the dry run ({run: takeaway_test}) is the night\'s writer itself: its system, its prompt from the kept evidence and the people\'s lines as of the reading\'s night, its compile and its checks; twelve at most; nothing written');
console.log(`\nproof_the_lens: ${pass} checks PASS`);
