/**
 * proof_the_loop.mjs  --  IQ4 THE LOOP: SEAM:THE_LOOP. The examples (a Sharp mark proposes, the room approves, the newest a level
 * rides the night's prompt), the stop list from the house's notes, the bets by level with the judge's criteria held against missed;
 * all of it material in the prompt, never the system, never a hashed slice. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const readp = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8')).registry;
const sql = fs.existsSync('supabase/migrations/0067_examples.sql') ? fs.readFileSync('supabase/migrations/0067_examples.sql', 'utf-8') : '';
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── the block, with fakes ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const lb = between(w, '/* ═══ SEAM:THE_LOOP (IQ4 THE LOOP)', '/* ═══ end SEAM:THE_LOOP ═══ */');
const T = { examples: [], marks: [], reads: [], posts: [], patches: [], events: [], claims: [], levels: [], judgments: [], paths: [] };
const sbRest = async (e, path, opts) => {
  T.paths.push(((opts && opts.method) || 'GET') + ' ' + path);
  if (opts && opts.method === 'POST' && /^house_examples$/.test(path)) { T.posts.push(opts.body[0]); return []; }
  if (opts && opts.method === 'PATCH' && /^house_examples\?id=eq\./.test(path)) { const id = path.match(/id=eq\.([^&]+)/)[1]; T.patches.push({ id, body: opts.body }); const x = T.examples.find(e => e.id === id); if (x) Object.assign(x, opts.body); return x ? [x] : []; }
  if (/^house_examples\?src=eq\.door&reading_id=eq\./.test(path)) { if (T.examples === null) throw new Error('sb_404'); const id = decodeURIComponent(path.match(/reading_id=eq\.([^&]+)/)[1]); return T.examples.filter(e => e.reading_id === id); }
  if (/^house_examples\?status=eq\.approved/.test(path)) return T.examples.filter(e => e.status === 'approved');
  if (/^house_examples\?select=/.test(path)) { if (T.examples === null) throw new Error('sb_404'); return T.examples; }
  if (/^door_reads\?id=eq\./.test(path)) { const id = decodeURIComponent(path.match(/id=eq\.([^&]+)/)[1]); return T.reads.filter(r => r.id === id); }
  if (/^door_reads\?id=in\./.test(path)) { const ids = path.match(/id=in\.\(([^)]+)\)/)[1].split(','); return T.levels.filter(r => ids.includes(r.id)); }
  if (/^reading_scores\?src=eq\.door&score=lte\.2/.test(path)) return T.marks;
  if (/^claims\?src=eq\.door&grade=in\./.test(path)) { if (T.claims === null) throw new Error('sb_404'); return T.claims; }
  if (/^reading_judgments\?src=eq\.door&status=eq\.done/.test(path)) return T.judgments;
  return [];
};
const JUDGE = { CRITERIA: [{ key: 'earned', name: 'Earned' }, { key: 'interprets', name: 'Interprets' }] };
const L = new Function('sbRest', 'excQuiet', 'logEvent', 'json', 'JUDGE',
  lb + '; return { LOOP, loopExampleText, loopPropose, loopExampleRoute, loopExamplesPick, loopStopList, loopBlockText, doorLoopBlock, loopBetsOf, loopBets };')(
  sbRest, (where, v) => e => v, async (e, p, s, ev, sid, meta) => T.events.push({ ev, meta }), (d, s) => ({ status: s, body: d }), JUDGE);

// ── A: the example's text, the proposal, the room ──────────────────────────────────────────────────────────────────────────────
const read = { level: 'brand', read: ['Members treat the Costco card like a savings account.', 'Renewals held at 92%, per WWD.'], takeaway: 'Sam\'s Club cannot win on the price of the card.',
  insights: [{ title: 'Members paid more', excerpt: 'Renewals held at 92%.', implication: 'The fee is a test of trust.' }, { title: 'Gold', excerpt: 'Gold sold out.', implication: null }, { title: 'Three', excerpt: 'f3', implication: 'r3' }, { title: 'Four past the cap', excerpt: 'f4' }],
  pushback: { line: 3, text: 'Sam\'s Club says its renewals rose.' }, ideas: [{ headline: 'Hold the fee', body: 'Keep it at $65.' }, { headline: 'Second' }, { headline: 'Third past the cap' }] };
const txt = L.loopExampleText(read);
ok(txt === 'Headline: Members treat the Costco card like a savings account.\nDek: Renewals held at 92%, per WWD.\nTakeaway: Sam\'s Club cannot win on the price of the card.\nFinding 1: Members paid more. Fact: Renewals held at 92%. Read: The fee is a test of trust.\nFinding 2: Gold. Fact: Gold sold out.\nFinding 3: Three. Fact: f3 Read: r3\nThe other side: Sam\'s Club says its renewals rose.\nMove 1: Hold the fee. Keep it at $65.\nMove 2: Second'
  && L.loopExampleText(null) === '' && L.loopExampleText({ read: ['h', 'd'], insights: [{ title: 'x', excerpt: 'y'.repeat(3000) }] }).length === 1800,
  'A1 an example is the reading as the writer should see it: the two lines, the takeaway, three findings with fact and read, the other side, two moves; cut at the cap');
T.reads = [{ id: 'r1', night: '2026-11-05', frame: { entity: 'Costco' }, read }, { id: 'r2', night: '2026-11-04', frame: { title: 'A theme' }, read: { read: ['h', 'd'], level: 'nowhere', insights: [] } }];
const p1 = await L.loopPropose({}, 'r1', 'u1');
ok(p1.example === 'proposed' && T.posts.length === 1 && T.posts[0].src === 'door' && T.posts[0].reading_id === 'r1' && T.posts[0].level === 'brand' && T.posts[0].subject === 'Costco' && T.posts[0].night === '2026-11-05' && T.posts[0].status === 'proposed' && T.posts[0].proposed_by === 'u1' && T.posts[0].text === txt && T.events.some(e => e.ev === 'example_proposed'),
  'A2 a Sharp mark proposes the reading as an example: its level, its subject, its night, its text, who proposed it');
T.examples = [{ id: 'e1', src: 'door', reading_id: 'r1', status: 'approved', level: 'brand', text: txt }];
const p2 = await L.loopPropose({}, 'r1', 'u2'), p3 = await L.loopPropose({}, 'r2', 'u1'), p4 = await L.loopPropose({}, 'missing', 'u1');
ok(p2.example === 'approved' && T.posts.length === 2 && p3.example === 'proposed' && T.posts[1].level === null && T.posts[1].subject === 'A theme' && p4.example === null && p4.error === 'no_reading' && T.posts.length === 2,
  'A3 a reading already proposed, approved or retired keeps its state; a level the law does not know is kept as none; a reading that is not on the record proposes nothing');
T.examples = null;
const p5 = await L.loopPropose({}, 'r1', 'u1');
ok(p5.example === null && p5.error === 'no_table' && T.posts.length === 2, 'A4 without the table (0067 not run) a mark proposes nothing and says so');
const E1 = '11111111-1111-4111-8111-111111111111', E2 = '22222222-2222-4222-8222-222222222222';
T.examples = [{ id: E1, src: 'door', reading_id: 'r1', status: 'proposed', level: 'brand', text: 'a' }, { id: E2, src: 'door', reading_id: 'r2', status: 'approved', level: 'brand', text: 'b', approved_at: '2026-11-05T00:00:00Z' }];
const user = { id: 'admin1' };
const l1 = await L.loopExampleRoute({}, {}, '*', user);
ok(l1.body.ok && l1.body.examples.length === 2 && l1.body.counts.proposed === 1 && l1.body.counts.approved === 1 && l1.body.counts.retired === 0 && l1.body.per_level === 1, 'A5 the room lists the examples with their counts');
const l2 = await L.loopExampleRoute({ id: E1, status: 'approved' }, {}, '*', user);
ok(l2.body.ok && T.patches[0].id === E1 && T.patches[0].body.status === 'approved' && T.patches[0].body.approved_by === 'admin1' && T.patches[0].body.approved_at && l2.body.counts.approved === 2 && T.events.some(e => e.ev === 'example_approved'),
  'A6 an admin approves: the row takes the state, who and when; the list answers');
const l3 = await L.loopExampleRoute({ id: E2, status: 'retired' }, {}, '*', user), l4 = await L.loopExampleRoute({ id: E2, status: 'gold' }, {}, '*', user), l4b = await L.loopExampleRoute({ id: 'e9', status: 'retired' }, {}, '*', user), l4c = await L.loopExampleRoute({ id: '99999999-9999-4999-8999-999999999999', status: 'retired' }, {}, '*', user);
ok(l3.body.ok && T.patches[1].body.status === 'retired' && !('approved_by' in T.patches[1].body) && l3.body.counts.retired === 1 && !l4.body.ok && l4.body.error === 'bad_status' && !l4b.body.ok && l4b.body.error === 'bad_id' && !l4c.body.ok && l4c.body.error === 'not_found' && T.patches.length === 3,
  'A7 retire keeps who approved it before; a state the law does not know, an id that is not one, or an example that is not there changes nothing');
T.examples = null;
const l5 = await L.loopExampleRoute({}, {}, '*', user);
ok(!l5.body.ok && l5.body.error === 'no_table' && /0067/.test(l5.body.detail), 'A8 without the table the room says which SQL to run');

// ── B: what the writer is given ───────────────────────────────────────────────────────────────────────────────────────────────────
const ex = [
  { status: 'approved', level: 'brand', text: 'B new', subject: 'Costco', approved_at: '2026-11-06' }, { status: 'approved', level: 'brand', text: 'B old', approved_at: '2026-11-01' },
  { status: 'proposed', level: 'industry', text: 'I proposed' }, { status: 'approved', level: 'industry', text: 'I', approved_at: '2026-11-03' }, { status: 'retired', level: 'category', text: 'C retired' },
  { status: 'approved', level: 'talent', text: 'T' }, { status: 'approved', level: 'category', text: 'C' }, { status: 'approved', level: null, text: 'no level' }, { status: 'approved', level: 'brand', text: '' }
];
const picked = L.loopExamplesPick(ex);
ok(picked.map(x => x.text).join('|') === 'B new|I|T|C' && L.loopExamplesPick([]).length === 0 && L.loopExamplesPick(null).length === 0 && L.loopExamplesPick([{ status: 'approved', level: null, text: 'no level' }]).length === 0,
  'B1 the writer is given the newest approved example a level, four at most; proposed, retired, empty and level-less ones never');
const marks = [{ score: 2, note: '  Repeats the headline as the takeaway.  ', at: '2026-11-05T12:00:00Z' }, { score: 1, note: 'x'.repeat(300), at: '2026-11-04T12:00:00Z' }, { score: 2, note: null, at: '2026-11-03' }, { score: 3, note: 'fine', at: '2026-11-02' }, { score: 2, note: '  ', at: '2026-11-01' }];
const stops = L.loopStopList(marks);
ok(stops.length === 2 && stops[0] === '2026-11-05: Repeats the headline as the takeaway.' && stops[1].length === 12 + 160 && L.loopStopList(marks.concat(Array.from({ length: 20 }, (_, i) => ({ score: 1, note: 'n' + i, at: '2026-10-2' + (i % 10) })))).length === 10,
  'B2 the stop list: the house\'s notes on a 2 or a 1, dated, trimmed, newest first, ten at most; a mark without a note or above 2 says nothing');
const block = L.loopBlockText(picked, stops);
ok(/^\n\nTHE HOUSE'S OWN, MARKED SHARP \(one a level; match the shape and the depth of the read, never the subject or the words; these are not evidence and nothing in them is cited\):\nBRAND \(Costco\)\nB new\n\nINDUSTRY\nI\n\nTALENT\nT\n\nCATEGORY\nC\n\nWHAT THE WRITER STOPS DOING \(the house's notes on readings marked Obvious or Wrong, dated\):\n- 2026-11-05: Repeats the headline as the takeaway\.\n- 2026-11-04: x/.test(block)
  && L.loopBlockText([], []) === '' && /^\n\nWHAT THE WRITER STOPS DOING/.test(L.loopBlockText([], stops)) && !/STOPS DOING/.test(L.loopBlockText(picked, [])),
  'B3 the block: the examples by level with their subject, then the stop list; nothing from nothing; each part only when it has something');
T.examples = ex.map((x, i) => Object.assign({ id: 'x' + i, src: 'door', reading_id: 'r' + i }, x)); T.marks = marks;
const b1 = await L.doorLoopBlock({});
ok(b1 === block && /house_examples\?status=eq\.approved&select=/.test(T.paths.find(p => /house_examples\?status/.test(p))) && /reading_scores\?src=eq\.door&score=lte\.2&note=not\.is\.null&at=gte\./.test(T.paths.find(p => /reading_scores\?src=eq\.door&score/.test(p))),
  'B4 doorLoopBlock reads the approved examples and the notes of the last thirty days and builds the block');
const dp = between(w, 'async function doorPass(env, opts) {', 'async function doorLand(');
ok(/const loop = typeof doorLoopBlock === 'function' \? await doorLoopBlock\(env\)\.catch\(excQuiet\('door_loop', ''\)\) : '';/.test(dp) && /\+ doorPeopleBlock\(base\.meta\.voices\) \+ loop;/.test(dp) && /prompt: excDoorPrompt\(frame, evidence, measures, memo\.get\(cand\.key\) \|\| '', night\) \}\);/.test(dp) && dp.indexOf('const loop = ') < dp.indexOf('for (const cand of cands) {') && dp.indexOf('if (!cands.length) return out;') < dp.indexOf('const loop = '),
  'B5 the night reads the block once a pass, after a pass with nothing to read has returned, and every job\'s prompt carries it after the evidence and the people');
const rp = between(w, 'async function recordPassQueue(env, n, preview) {', '\n}\n');
ok(/const loop = typeof doorLoopBlock === 'function' \? await doorLoopBlock\(env\)\.catch\(excQuiet\('pass_loop', ''\)\) : '';/.test(rp) && /\+ doorPeopleBlock\(r\.meta && r\.meta\.voices\) \+ loop;/.test(rp) && /prompt: excDoorPrompt\(r\.frame, evidence, r\.measures, '', r\.night\)/.test(rp), 'B6 the record pass carries it too');
const tt = between(w, 'async function takeawayTest(env, body) {', '/* ═══ end SEAM:TAKEAWAY_TEST');
ok(/const loop = typeof doorLoopBlock === 'function' \? await doorLoopBlock\(env\)\.catch\(excQuiet\('test_loop', ''\)\) : '';/.test(tt) && /doorPeopleBlock\(r\.meta && r\.meta\.voices\) : ''\) \+ loop, r\.measures \|\| \{\}, '', r\.night\);/.test(tt), 'B7 and the dry run, as the night sees it');
const slices = [['const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '], ['const EXC_MOVE_LAW = ', 'function excReportPrompt('], ['function excReportPrompt(', 'function excAnchors('], ['function excDoorPrompt(', '// The compiled text becomes'], ['const EXC_VOICE_SYS = ', '\n'], ['const EXC_NUMBER_LAW = ', '\n'], ['const EXC_TIME_LAW = ', '\n']].map(([a, b]) => between(w, a, b));
ok(slices.every(s => !/THE_LOOP|doorLoopBlock|MARKED SHARP|STOPS DOING/.test(s)), 'B8 material, never instruction: no hashed slice and no system prompt carries the loop; the writer\'s hash and the bench stand');

// ── C: a Sharp mark on the score route ────────────────────────────────────────────────────────────────────────────────────────────
const sr = between(w, 'async function scoreRoute(path, body, env, origin, user) {', '\n}\n');
ok(/const example = score === 5 && src === 'door' && typeof loopPropose === 'function' \? await loopPropose\(env, id, by\)\.catch\(excQuiet\('loop_propose', \{ example: null \}\)\) : null;/.test(sr) && /example: example \? example\.example : null,/.test(sr) && sr.indexOf('const example = ') > sr.indexOf("reading_scores?on_conflict=src,reading_id,by"),
  'C1 a 5 on an overnight reading proposes it after the mark is kept; the answer says proposed, approved or retired; a 4 or a live read proposes nothing');
ok(/if \(path === '\/reads\/corpus-example'\) return loopExampleRoute\(b, env, origin, user\);/.test(w) && /\/\^\\\/reads\\\/corpus\(\?:-doc\|-extract\|-position\|-register\|-example\)\?\$\/\.test\(path\)/.test(w) && /case '\/reads\/corpus-example':/.test(between(w, "case '/reads/corpus-register':", "return readRoute(path, body, env, origin, user);")),
  'C2 the corpus route lists and judges the examples, behind the same admin gate as the corpus; the router\'s switch carries the path to it');

// ── D: the bets by level ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const claims = [{ reading_id: 'a', grade: 'held' }, { reading_id: 'a', grade: 'held' }, { reading_id: 'b', grade: 'missed' }, { reading_id: 'c', grade: 'held' }, { reading_id: 'd', grade: 'missed' }, { reading_id: 'e', grade: 'unmeasured' }, { reading_id: 'f', grade: 'missed' }];
const levels = { a: 'brand', b: 'brand', c: 'category', d: 'category', f: 'category' };
const judgments = [{ reading_id: 'a', status: 'done', scores: { earned: { score: 2 }, interprets: { score: 1 } } }, { reading_id: 'a', status: 'done', scores: { earned: { score: 0 }, interprets: { score: 0 } } }, { reading_id: 'b', status: 'done', scores: { earned: { score: 0 }, interprets: { score: 1 } } }, { reading_id: 'c', status: 'done', scores: { earned: { score: 2 }, interprets: { score: 2 } } }, { reading_id: 'zzz', status: 'done', scores: { earned: { score: 2 } } }, { reading_id: 'd', status: 'failed', scores: null }];
const bets = L.loopBetsOf(claims, levels, judgments);
ok(bets.graded === 5 && bets.levels.map(x => x.level + ':' + x.n + ':' + x.held + ':' + x.rate).join() === 'category:3:1:0.33,brand:2:1:0.5' && bets.worst === null,
  'D1 by level: one grade a reading (its claims all carry it), held and missed only; the level missing most is named only with five graded or more');
ok(bets.criteria.map(c => c.key + ':' + c.held_mean + '/' + c.held_n + ':' + c.missed_mean + '/' + c.missed_n).join() === 'earned:2/2:0/1,interprets:1.5/2:1/1' && bets.judged_graded === 3,
  'D2 the judge\'s criteria on readings both judged and graded, one judgment a reading (the newest): the mean on held beside the mean on missed; a reading never graded, or a failed judgment, counts nothing');
const many = Array.from({ length: 6 }, (_, i) => ({ reading_id: 'm' + i, grade: i < 1 ? 'held' : 'missed' })), manyLv = {}; for (let i = 0; i < 6; i++) manyLv['m' + i] = 'talent';
ok(L.loopBetsOf(many, manyLv, []).worst.level === 'talent' && L.loopBetsOf(many, manyLv, []).worst.rate === 0.17 && L.loopBetsOf([], {}, []).graded === 0 && L.loopBetsOf([], {}, []).levels.length === 0, 'D3 with five graded or more the level missing most is named; nothing from nothing');
T.claims = claims; T.levels = Object.keys(levels).map(id => ({ id, level: levels[id] })); T.judgments = judgments;
const lb1 = await L.loopBets({});
ok(lb1 && lb1.graded === 5 && lb1.days === 60 && lb1.levels[0].level === 'category' && /claims\?src=eq\.door&grade=in\.\(held,missed\)&graded_at=gte\./.test(T.paths.find(p => /^GET claims/.test(p))) && /door_reads\?id=in\.\(a,b,c,d,f\)&select=id,level:read->level/.test(T.paths.find(p => /door_reads\?id=in/.test(p))),
  'D4 loopBets reads the graded claims of the last sixty days, the readings\' levels by id, the judgments, and builds the report');
T.claims = null;
ok((await L.loopBets({})) === null, 'D5 without the claims nothing is counted and the room says so');
const tables = between(w, 'async function scoreTables(env) {', '\n}\n');
ok(/part\('bets', typeof loopBets === 'function' \? loopBets\(env\) : Promise\.resolve\(null\)\)/.test(tables) && /bets: got\.bets && !Array\.isArray\(got\.bets\) \? got\.bets : null,/.test(tables) && /p !== 'bets'/.test(tables), 'D6 THE SCORE room\'s tables carry the bets by level');

// ── E: the pages, the SQL, the seam ───────────────────────────────────────────────────────────────────────────────────────────────
ok(/r\.example === 'proposed' \? ' Proposed as an example for the writer; approve it in THE CORPUS room\.' : r\.example === 'approved' \? ' Already an example for the writer\.' : ''/.test(page), 'E1 the Intelligence page says when a Sharp mark proposed the reading');
ok(/<h2>The examples<\/h2>/.test(readp) && /function corpusExamples\(body, say\)/.test(readp) && /call\("\/reads\/corpus-example", body \|\| \{\}\)/.test(readp) && /Has 0067_examples\.sql run in Supabase\?/.test(readp) && /data-st="approved">Approve<\/button>/.test(readp) && /data-st="retired">Retire<\/button>/.test(readp) && /corpusBind\(\); corpusExamples\(\);/.test(readp),
  'E2 THE CORPUS room lists the examples, proposed first, with Approve and Retire');
ok(/function scoreBetsHtml\(b\)/.test(readp) && /scoreJudgeHtml\(d\.judge\) \+ scoreBetsHtml\(d\.bets\) \+ scoreVoiceHtml\(d\.voice\)/.test(readp) && /<h2>The bets by level<\/h2>/.test(readp) && /held against missed/.test(readp), 'E3 THE SCORE room shows the bets by level and the judge\'s criteria held against missed');
ok(/create table if not exists public\.house_examples/.test(sql) && /status\s+text not null default 'proposed' check \(status in \('proposed', 'approved', 'retired'\)\)/.test(sql) && /create unique index if not exists house_examples_uq on public\.house_examples \(src, reading_id\)/.test(sql) && /grant select, insert, update, delete on public\.house_examples to service_role/.test(sql),
  'E4 0067_examples.sql makes the table: one row a reading, proposed, approved or retired, service role only');
ok(seams['SEAM:THE_LOOP'] && /loopPropose/.test(seams['SEAM:THE_LOOP'].purpose) && /doorLoopBlock/.test(seams['SEAM:THE_LOOP'].purpose) && seams['SEAM:THE_LOOP@intelligence'] && seams['SEAM:THE_LOOP@read'], 'E5 the seam is registered for the worker, the page and READ');
ok(!/—/.test(lb) && !/—/.test(between(readp, 'function corpusExamples(body, say)', 'function corpusBind()')) && !/—/.test(between(readp, 'function scoreBetsHtml(b)', 'function scoreVoiceHtml(v)')), 'E6 no em dash in the cut\'s own text');
console.log('proof_the_loop: ' + pass + ' checks passed');
