/**
 * proof_excavate_door.mjs  --  EX4c: the door shows frames, a tile opens the
 * read, and the page hears the stream. Runs the real functions on fakes.
 * Run from the repo root: node worker/proofs/proof_excavate_door.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── W: the worker frames the tiles ────────────────────────────────────────
const doorSrc = between(w, 'const EXC_DOOR = ', 'async function excavateFeed(');
let frameCalls = [];
const kv = {};
const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
const frames = { 'Nike Announces Yet Another Round of Restructuring Amid Sales Drop': { entity: 'Nike', category: 'Athletic footwear', audience: 'Sneaker buyers', market: 'US', competitors: ['adidas', 'New Balance', 'On', 'Hoka'], question: 'Can Nike hold shelf share through a restructuring?' },
  'gen z hair care': { entity: null, category: 'Hair care', audience: 'Gen Z', market: 'US', competitors: ['&honey', 'Being'], question: 'q' } };
let spent = 0;
const D = new Function('excFrameFor', 'excQuiet', 'claudeSpent', 'claudeCap', 'EXC_FRAME', doorSrc + '; return { excFrameLabel, excFrameQuery, excFrameTiles, EXC_DOOR };')(
  async (e, q) => { frameCalls.push(q); return frames[q] || null; }, () => () => null, async () => spent, () => 3, { DOOR_SHARE: 0.5 });
ok(D.excFrameLabel(frames['gen z hair care']) === 'Gen Z hair care' && D.excFrameLabel(frames['Nike Announces Yet Another Round of Restructuring Amid Sales Drop']) === 'Nike in athletic footwear' && D.excFrameLabel({ entity: null, category: null }) === null,
  'W1 a frame reads as a label: the audience and category, or the entity in its category');
ok(D.excFrameQuery(frames['gen z hair care']) === 'Gen Z Hair care' && D.excFrameQuery(frames['Nike Announces Yet Another Round of Restructuring Amid Sales Drop']) === 'Nike Athletic footwear', 'W2 a frame yields the query a tile searches, never the headline');
const tiles = [
  { id: 'desk-1', provenance: 'desk', title: 'Nike Announces Yet Another Round of Restructuring Amid Sales Drop', subtitle: 'From the desk · fashion beauty', query: 'Nike Announces Yet Another Round of Restructuring Amid Sales Drop', line: 'Nike cut again.', stat: '↑ 4 signals this week', evidence: { sources: 3 } },
  { id: 'theme-1', provenance: 'lake', title: 'Gen Z hair care', query: 'gen z hair care', stat: '↑ 9 signals this week', evidence: { sources: 6 } },
  { id: 'desk-2', provenance: 'desk', title: 'Unframeable story', subtitle: 'From the desk', query: 'Unframeable story', line: 'x' }];
let out = await D.excFrameTiles(env, tiles, '2026-10-03', '2026-10-03T06:00:00');
ok(frameCalls.length === 3 && out[0].title === 'Nike in athletic footwear' && out[0].query === 'Nike Athletic footwear' && out[0].story === 'Nike Announces Yet Another Round of Restructuring Amid Sales Drop' && out[0].line === 'Nike cut again.' && /From the desk · fashion beauty/.test(out[0].subtitle),
  'W3 a desk-fill tile becomes its frame: the frame is the title and the query, the story rides beneath, the desk line stays');
ok(out[0].frame.market === 'US' && out[0].frame.competitors.length === 4 && out[0].stat === '↑ 4 signals this week' && out[0].evidence.sources === 3, 'W4 the tile carries market and competitive set, and keeps its measured receipts');
ok(out[1].title === 'Gen Z hair care' && out[1].query === 'gen z hair care' && out[1].frame.audience === 'Gen Z', 'W5 a theme tile keeps its own title and query and gains its frame');
ok(out[2].title === 'Unframeable story' && !out[2].frame && out[2].query === 'Unframeable story', 'W6 a tile that cannot be framed keeps its old shape');
ok(Object.keys(kv).length === 1 && JSON.parse(Object.values(kv)[0])[2].title === 'Unframeable story', 'W7 an incomplete set is cached too, briefly, so the next visitor does not trigger the same misses');
for (const k of Object.keys(kv)) delete kv[k];
frames['Unframeable story'] = { entity: null, category: 'Retail', audience: 'Shoppers', market: 'UK', competitors: [], question: 'q' };
frameCalls = []; out = await D.excFrameTiles(env, tiles, '2026-10-03', '2026-10-03T06:00:00');
ok(frameCalls.length === 3 && Object.keys(kv).length === 1 && out[2].title === 'Shoppers retail' && /From the desk · UK/.test(out[2].subtitle), 'W8 a complete set is cached for the edition; a foreign market is named on the tile');
frameCalls = []; out = await D.excFrameTiles(env, tiles, '2026-10-03', '2026-10-03T06:00:00');
ok(frameCalls.length === 0 && out[0].title === 'Nike in athletic footwear', 'W9 the next visitor pays nothing: the framed set comes from the cache');
for (const k of Object.keys(kv)) delete kv[k]; spent = 2; frameCalls = []; out = await D.excFrameTiles(env, tiles, '2026-10-04', 'x');
ok(frameCalls.length === 0 && out[0].title === tiles[0].title && !out[0].frame, 'W9b past half the frame cap the door frames nothing: the other half stays with signed-in reads');
ok(out[0].frame === undefined && JSON.stringify(tiles[0]).indexOf('anchors') < 0, 'W9c tiles are never mutated in place');
ok(/tiles = await excFrameTiles\(env, tiles, \(ed && ed\.date\) \|\| '', out\.generated_at \|\| ''\)/.test(w), 'W10 the feed door frames its tiles before it answers');

// ── P: the page ───────────────────────────────────────────────────────────
ok(/function _openFrameRead\(card\)/.test(page) && /if \(lk\) \{ _openFrameRead\(lk\); return; \}/.test(page) && /if \(card\) \{ _openFrameRead\(card\); return; \}/.test(page) && !/openInsightDashboard\(\{\s*title:\s*lk\.subtitle/.test(page),
  'P1 a tile opens THE READ through the search door; the template dashboard behind the tiles is gone');
ok(/window\._tileFrame = card\.frame \? \{ _q: q, frame: card\.frame \} : null;/.test(page) && /body:JSON\.stringify\(_tf\?\{query:q,frame:_tf\}:\{query:q\}\)/.test(page), 'P2 the tile\'s frame rides to the gather, so nothing is framed twice');
ok(/confidence: \['High','Medium','Low'\]\.includes\(ins\.confidence\)\?ins\.confidence:'Low'/.test(page) && !/confidence: i<3\?'High':'Medium'/.test(page), 'P3 the page shows the confidence the compiler earned, never the card\'s position');
ok(/window:syn&&syn\.window\|\|null, model:syn&&syn\.model\|\|null, frame:syn&&syn\.frame\|\|null/.test(page) && /relevance:syn&&syn\.relevance\|\|null, timing:syn&&syn\.timing\|\|null, read_checks:syn&&syn\.read_checks\|\|null/.test(page),
  'P4 window, lane, frame, relevance, timing and checks reach renderResults');
ok(/dated: ins\.dated\|\|null, meaning: ins\.meaning\|\|null, implication: ins\.implication\|\|null, evidence: ins\.evidence\|\|\[\], checks: ins\.checks\|\|null/.test(page) && /function _checkChip\(c\)/.test(page) && /\$\{_checkChip\(ins\.checks\)\}/.test(page),
  'P5 every finding keeps its date, band, meanings and number check, and an unverified figure is said on the card');
ok(/const gatherP=fetch\(/.test(page) && /window\._lakePromise=fetch\(/.test(page) && /const g=await gatherP;/.test(page) && /const lp = window\._lakePromise && window\._lakePromise\._q === payload\.query \? window\._lakePromise : null;/.test(page),
  'P6 lenses, the server gather and the lake start together; the lake answer is read once');
ok(/d = await _synthesizeStream\(_pl, \(ev, data\) => \{ if \(ev === 'stage'\) _loaderStage\(data\); else if \(ev === 'draft'\) _loaderDraft\(data\); \}, _st\);/.test(page) && /catch \(e\) \{ d = await _synthesizePlainAfterCut\(_pl, _st\.heard\); \}/.test(page) && /frame:_gm\.frame\|\|null, rails:\(_gm\.rails\|\|\[\]\)\.filter\(r=>r&&r\.ok&&!r\.skipped&&!\(\(r\.id==='competitors'\|\|r\.id==='counter'\)&&!\(r\.n>0\)\)\)\.map\(r=>r\.id\)/.test(page) && /cache_only: true/.test(page) && /waited < 90000/.test(page),
  'P7 the live search streams the read, falls back to the plain door after a wait when the stream was cut, and sends the frame and the rails the gather ran');
ok(/window\._gatherMeta=null; window\._gatherItems=\[\]; window\._tileFrame=null;/.test(page) && /\$\{safe\(card\.subtitle \|\| ''\)\}/.test(page) && /safeAttr\(\['consumer','market','culture','brand'\]\.includes\(x\.category\)/.test(page),
  'P7b a new search starts clean; a tile subtitle and a draft category never reach the DOM unescaped');
// The stream reader, run on a fake door.
const ssSrc = between(page, 'async function _synthesizeStream(payload, onEvent, state) {', 'async function _synthesizePlainAfterCut(');
const sse = evts => evts.map(e => 'event: ' + e[0] + '\ndata: ' + JSON.stringify(e[1]) + '\n\n').join('');
const stream = sse([['stage', { stage: 'reading' }], ['draft', { read: ['a'], insights: [{ title: 't' }], ideas: [] }], ['final', { ok: true, data: { insights: [1, 2] } }]]);
const heard = [];
const SS = new Function('_authHeader', '_withLake', 'API_BASE', 'fetch', 'window', ssSrc + '; return _synthesizeStream;')(
  async () => ({}), async p => p, 'https://api.example', async (url, o) => { const b = JSON.parse(o.body); if (!b.stream) throw new Error('not streamed');
    const enc = new TextEncoder(); const bytes = enc.encode(stream);
    return { ok: true, headers: { get: () => 'text/event-stream; charset=utf-8' }, body: new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, 30)); c.enqueue(bytes.slice(30)); c.close(); } }) }; }, {});
const st = { heard: false };
const fin = await SS({ query: 'q', corpus: [] }, (ev, d) => heard.push([ev, d]), st);
ok(fin.ok && fin.data.insights.length === 2 && heard.length === 2 && heard[0][0] === 'stage' && heard[1][0] === 'draft' && heard[1][1].insights[0].title === 't' && st.heard === true, 'P8 the page reads stage and draft events as they come, keeps the final payload, and knows it heard something');
const SS2 = new Function('_authHeader', '_withLake', 'API_BASE', 'fetch', 'window', ssSrc + '; return _synthesizeStream;')(
  async () => ({}), async p => p, 'https://api.example', async () => ({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ ok: true, data: { plain: true } }) }), {});
ok((await SS2({ query: 'q' })).data.plain === true, 'P9 an older worker that answers plainly is still understood');
ok(/<div class="loader-draft" id="loader-draft"/.test(page) && /function _loaderDraft\(d\)/.test(page) && /Open the read →/.test(page) && !/Click for full dashboard/.test(page), 'P10 the loader has a place for the draft; every tile says it opens the read');
ok(!/—/.test(doorSrc), 'P11 no em dash in the door');
console.log('\nproof_excavate_door: ' + pass + ' checks PASS');
