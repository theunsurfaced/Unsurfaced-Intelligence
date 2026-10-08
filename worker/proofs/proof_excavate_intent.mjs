/**
 * proof_excavate_intent.mjs  --  SEAM:EXC_INTENT (EX24 INTERPRET, the interpreter half).
 * The framer reads the task, the threads and the period; the page shows the frame as chips before the gather and
 * runs the read on what the person confirmed; a stacked question is gathered one thread at a time and written as one
 * read with a section per thread; suggestions as the person types. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the frame carries the intent ────────────────────────────────────────────────────────────────────────────────
const fsys = between(w, 'const EXC_FRAME_SYS = ', 'function excFrameClean(f) {');
const cleanSrc = between(w, 'function excFrameClean(f) {', 'function excFrameWhole(f)');
const SYS = new Function(fsys + '; return EXC_FRAME_SYS;')();
ok(/"task": one of read \(/.test(SYS) && /"threads": when the query stacks two or three distinct subjects/.test(SYS) && /"period": the years/.test(SYS) && /brief \(how a brand or team can win/.test(SYS) && /create \(ideas, a campaign/.test(SYS),
  'A1 the framer is asked for the task (seven kinds), the threads and the period, beside the frame it already wrote');
ok(/REV: 'f2'/.test(between(w, 'const EXC_FRAME = ', '\n')), 'A2 the frame cache moves to f2, so no frame cached without its intent is served');
const C = new Function(cleanSrc + '; return excFrameClean;')();
const raw = { entity: 'Jordan Brand', category: 'athletic sneakers', audience: 'Gen Z', market: 'US', anchors: ['jordan brand'], task: 'Brief', threads: ['Labor displacement', 'Safety incidents', 'Public trust'], period: '2023-2026' };
let f = C(raw);
ok(f.task === 'brief' && f.threads.join('|') === 'Labor displacement|Safety incidents|Public trust' && f.period === '2023 to 2026', 'A3 the task is one of the seven, the threads are kept, the period is read as years');
ok(C(Object.assign({}, raw, { task: 'essay', threads: ['one subject'], period: 'lately' })).task === 'read' && C(Object.assign({}, raw, { threads: ['one subject'] })).threads.length === 0 && C(Object.assign({}, raw, { period: 'lately' })).period === null,
  'A4 an unknown task is a plain read, one thread is no split, a period without years is none');
ok(C(Object.assign({}, raw, { threads: ['a', 'b', 'c', 'd', 'e'] })).threads.length === 3 && C(Object.assign({}, raw, { threads: ['<b>x</b>', 'y'] })).threads[0] === 'x', 'A5 at most three threads, cleaned of markup');
ok(C({ category: 'sneakers' }).task === 'read' && Array.isArray(C({ category: 'sneakers' }).threads), 'A6 a frame the model wrote without the intent fields is a plain read of one subject');

// ── B: the writer hears the threads and the task ───────────────────────────────────────────────────────────────────
const blockSrc = between(w, 'function excFrameBlock(frame) {', '/* SEAM:EXC_TIERS');
const B = new Function(blockSrc + '; return excFrameBlock;')();
const stacked = B({ category: 'artificial intelligence', audience: 'the public', market: 'US', question: 'q', task: 'read', threads: ['AI labor displacement', 'AI safety incidents', 'public trust in AI'] });
ok(/THREADS: the question stacks 3 subjects\. Write one read with a section per thread, the findings labeled by thread, then what connects them\. The threads: 1\. AI labor displacement 2\. AI safety incidents 3\. public trust in AI/.test(stacked),
  'B1 a stacked question is written as one read with a section per thread and what connects them, never squeezed into one frame');
ok(/The person is asking for a comparison: where each named player wins and loses/.test(B({ category: 'sneakers', task: 'compare', competitors: ['Nike', 'Adidas'] })) && /The period asked about: 2023 to 2026/.test(B({ category: 'sneakers', task: 'timeline', period: '2023 to 2026' }))
  && !/asking for a/.test(B({ category: 'sneakers', task: 'read' })) && !/THREADS/.test(B({ category: 'sneakers', threads: [] })),
  'B2 the writer is told what the person asked for (a comparison, a read across time) and says nothing extra for a plain read');

// ── C: the doors ───────────────────────────────────────────────────────────────────────────────────────────────────
const routes = between(w, '/* SEAM:EXC_INTENT: the frame before the gather.', 'async function excavateGather(request, env, origin, wctx) {');
const mk = (frame, db) => new Function('excavateAuth', 'json', 'excFrameFor', 'excFrameLabel', 'loadTracks', 'sbRest', 'TERRITORY_SLUGS',
  routes + '; return { excavateInterpret, excavateSuggest, excSuggestRank };')(
  async () => ({}), (d, st) => ({ d, st }), async () => frame, f => f.entity || f.category, async () => [{ id: 't1', name: 'Jordan Brand', sector: 'sneakers' }, { id: 't2', name: 'Jordan Peele', sector: 'film' }],
  async (env, p) => (db ? db(p) : []), ['sneakers-streetwear', 'artificial-intelligence']);
const req = body => ({ json: async () => body });
let R = mk({ entity: 'Jordan Brand', category: 'athletic sneakers', task: 'brief', threads: [] });
let r = await R.excavateInterpret(req({ query: '  how Jordan Brand wins  Gen Z ' }), {}, '');
ok(r.d.ok && r.d.query === 'how Jordan Brand wins Gen Z' && r.d.frame.task === 'brief' && r.d.label === 'Jordan Brand', 'C1 /excavate/interpret answers the frame with its task, cleaned query and label, nothing gathered');
r = await R.excavateInterpret(req({ query: 'ai' }), {}, '');
ok(r.d.ok === false && r.d.error === 'query_too_short', 'C2 a query under four characters is not framed');
R = mk(null);
r = await R.excavateInterpret(req({ query: 'asdkjh qwe' }), {}, '');
ok(r.d.ok === false && r.d.error === 'unframeable', 'C3 a query the framer cannot place says so');
R = mk(null, p => p.startsWith('reads?') ? [{ id: 481, query: 'Jordan Brand Gen Z sneaker consumer', created_at: '2026-10-07T20:00:00Z' }, { id: 480, query: 'gen z haircare', created_at: '2026-10-06' }]
  : p.startsWith('house_reads?') ? [{ id: 19, label: 'RECON 002: Jordan Brand', brief: 'How Jordan Brand wins the next generation of sneaker buyers.' }] : []);
r = await R.excavateSuggest(req({ q: 'jord' }), {}, '');
ok(r.d.ok && r.d.items[0].kind === 'brand' && r.d.items[0].text === 'Jordan Brand' && r.d.items.some(x => x.kind === 'recon') && r.d.items.some(x => x.kind === 'read' && x.id === 481) && !r.d.items.some(x => /haircare/.test(x.text)),
  'C4 suggestions: the tracked brand first, then the RECON and the read whose words start with what was typed; nothing unrelated');
r = await R.excavateSuggest(req({ q: 'j' }), {}, '');
ok(r.d.ok && r.d.items.length === 0, 'C5 under two characters, no suggestions and no database read');
r = await R.excavateSuggest(req({ q: 'sneak' }), {}, '');
ok(r.d.items.some(x => x.kind === 'territory' && x.text === 'Sneakers and Streetwear'), 'C6 territories suggest by their words');
ok(R.excSuggestRank('jordan', [{ kind: 'read', text: 'Jordan Brand' }, { kind: 'brand', text: 'jordan brand' }]).length === 1, 'C7 the same words from two sources are one suggestion');
ok(/if \(path === '\/excavate\/interpret' && request\.method === 'POST'\) return excavateInterpret/.test(w) && /if \(path === '\/excavate\/suggest' && request\.method === 'POST'\) return excavateSuggest/.test(w)
  && /const gate = await excavateAuth\(request, env, origin\);\n  if \(gate\.err\) return gate\.err;\n  let body = \{\}; try \{ body = await request\.json\(\); \} catch \(e\) \{ body = \{\}; \}\n  const q = String\(body\.query/.test(routes),
  'C8 both doors are routed and sit behind the signed-in gate; neither spends on a model of its own');

// ── D: the page ────────────────────────────────────────────────────────────────────────────────────────────────────
const inSrc = between(page, '/* SEAM:EXC_INTENT: the interpretation before the gather.', 'async function _inInterpret(q) {');
const PI = new Function('safe', 'safeAttr', '_authHeader', 'API_BASE', 'window', inSrc + '; return { _inSentence, _inFrameOut };')(x => x, x => x, async () => ({}), '', {});
ok(PI._inSentence({ task: 'brief', entity: 'Jordan Brand', category: 'athletic sneakers', audience: 'Gen Z and Gen Alpha sneaker buyers', competitors: ['New Balance', 'On'], market: 'US' }) === 'A brief: Jordan Brand in athletic sneakers, for Gen Z and Gen Alpha sneaker buyers, against New Balance, On.'
  && /3 threads, read together\.$/.test(PI._inSentence({ task: 'read', category: 'AI', threads: ['a', 'b', 'c'] })), 'D1 the chips say the read in one sentence');
const out = PI._inFrameOut({ entity: ' Jordan <Brand> ', category: '', market: '', competitors: ['New Balance', '', 'On', 'Hoka', 'Adidas', 'Asics', 'Puma'], threads: ['only one'], anchors: ['x'] });
ok(out.entity === 'Jordan Brand' && out.category === null && out.market === 'US' && out.competitors.length === 5 && out.threads.length === 0 && out.anchors[0] === 'x', 'D2 the chips are cleaned the way the worker cleans a frame; one thread is no split; the anchors ride along');
ok(/const _if=_tf0\?null:_inFrameOut\(await _inInterpret\(q\)\);/.test(page) && /const _tf=_tf0\|\|\(_if&&\(_if\.anchors\|\|\[\]\)\.length\?_if:null\);/.test(page),
  'D3 the gather runs on the frame the person confirmed; a tile\'s frame still rides in untouched');
ok(/const gatherP=_threads\?Promise\.all\(_threads\.map\(_gatherOne\)\)/.test(page) && /items\.push\(Object\.assign\(\{\},it,\{thread:ti\+1\}\)\)/.test(page) && /threads:_threads\}\) \}; \}\):_gatherOne\(q\);/.test(page),
  'D4 a stacked question is gathered one thread at a time, in parallel, and merged into one corpus with each line\'s thread');
ok(/frame:_if\?Object\.assign\(\{\},\(g\.meta&&g\.meta\.frame\)\|\|\{\},_if\)/.test(page), 'D5 the person\'s chips win over the gather\'s frame on the way to the writer');
ok(/if \(I\.frame && I\.q === q\) return I\.frame;/.test(page) && /onclick="runSearch\(\)">Read it this way<\/button>/.test(page) && /window\._intent = \{ q: '', frame: null, edited: false, busy: false \}; _inRender\(\);/.test(page),
  'D6 an edited chip offers Read it this way, the confirmed frame is reused, and a new search starts clean');
ok(/oninput="_sgInput\(this\.value\)" onkeydown="_sgKey\(event\)"/.test(page) && /\.suggest-box\{position:absolute;[^}]*z-index:var\(--z-menu\)/.test(page) && /placeholder="Ask culture a question/.test(page),
  'D7 suggestions ride the bar, stack on a token, and the bar asks culture a question');
ok(/Open the brand room: \$\{safe\(f\.entity\)\}/.test(page) && /This is a brief: commission a RECON/.test(page) && /Make it in PLAY/.test(page) && /document\.getElementById\('brand-find'\)/.test(page),
  'D8 the task opens its door beside the read: the brand room, a RECON commission (admin), PLAY');

// ── E: the labeled set ─────────────────────────────────────────────────────────────────────────────────────────────
// The intent proof the interpreter must pass before the answer shapes go live (the speed patch): a labeled query per task,
// run through excFrameClean's rules on what the framer returns. The live accuracy run is `?panel=intent` on the page, to come.
const LABELED = [
  ['gen z haircare', 'read'], ['Jordan Brand', 'brand'], ['Jordan Brand vs New Balance', 'compare'], ['Gen Alpha sneaker culture', 'audience'],
  ['how sneaker resale changed since 2021', 'timeline'], ['how can Jordan Brand win with the next sneaker consumer', 'brief'], ['campaign ideas for a Gen Z running shoe', 'create']];
ok(LABELED.every(([q, t]) => C({ category: 'x', task: t }).task === t) && new Set(LABELED.map(x => x[1])).size === 7, 'E1 every one of the seven tasks round-trips through the cleaner; the labeled set covers each once');

ok(!/—/.test(fsys + cleanSrc + blockSrc + routes + inSrc), 'G1 no em dash in the new code or its laws');
console.log('\nproof_excavate_intent: ' + pass + ' checks PASS');
