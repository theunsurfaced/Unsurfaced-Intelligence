/**
 * proof_play_brief.mjs  --  EX25 PLAY BRIEF: SEAM:PLAY_BRIEF, SEAM:PLAY_CLAUDE, SEAM:PLAY_DIRECTOR, SEAM:PLAY_HANDOFF.
 * The creative ask is read into a brief before anything is made; PLAY's words come from Claude with Workers AI as the reserve;
 * three scored territories precede the direction; EXCAVATE hands PLAY the insight instead of a link nobody read.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const play = fs.readFileSync('play/index.html', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// ── A: the brief reader (SEAM:PLAY_BRIEF) ──────────────────────────────────────────────────────────────────────────
const blk = between(w, '/* SEAM:PLAY_CLAUDE: PLAY\'s words', '/* SEAM:PLAY_RENDER \\u2014 fal.ai render rail.');
const xj = between(w, 'function jsonRepair(', '// Server-side connectors');
const calls = [], kv = {};
const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
const json = (data, status) => ({ data, status });
let claudeReply = null;
const callClaude = async (e, tier, req) => { calls.push({ tier, req }); return typeof claudeReply === 'function' ? claudeReply(tier, req) : claudeReply; };
const sha256hex = async s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return (h.toString(16) + '0'.repeat(64)).slice(0, 64); };
const CONFIG = { TEXT_MODEL: 'reserve', MAX_TOKENS: 800 };
const PLAY_SYSTEM = eval('(' + between(w, 'const PLAY_SYSTEM = {', '\n};') .replace('const PLAY_SYSTEM = {', '{') + '\n})');
const P = new AsyncFunction('env', 'json', 'callClaude', 'sha256hex', 'CONFIG', 'PLAY_SYSTEM',
  xj + '\n' + blk + '\nreturn { PLAY_SPECS, PLAY_BRIEF, PLAY_CLAUDE, playBriefClean, playSpecsFor, playBriefLabel, playInterpret, playGenerate, playHandoff, playHandoffGet, playHandoffClean };');
const X = await P(env, json, callClaude, sha256hex, CONFIG, PLAY_SYSTEM);

ok(/case '\/play\/interpret':\s+return playInterpret\(body, env, origin, user\);/.test(w) && /case '\/play\/handoff':\s+return playHandoff\(body, env, origin, user\);/.test(w)
  && /path\.startsWith\('\/play\/handoff\/'\)\) return playHandoffGet\(/.test(w) && /path === '\/play\/interpret'   \/\/ SEAM:PLAY_BRIEF\n\s+\|\| path\.startsWith\('\/excavate'\)/.test(w),
  'A1 the routes: interpret and handoff POST behind the sign-in, handoff GET by id, interpret metered with the AI paths');
const raw = { deliverable: 'Social', platform: 'TikTok', brand: '<b>Jordan</b>', audience: 'Gen Z sneaker buyers', objective: 'make heritage feel like theirs', tone: 'knowing, fast, warm',
  must: ['the shoe in motion', 'real courts', '', 'a', 'b', 'c', 'd', 'e'], avoid: ['nostalgia montage'], insight: 'They buy the story, not the year.', count: '3', seconds: 'x', question: 'Which platform?' };
const b = X.playBriefClean(raw);
ok(b.deliverable === 'social' && b.platform === 'tiktok' && b.brand === 'Jordan' && b.must.length === 6 && b.count === 3 && b.seconds === null && b.question === null,
  'A2 playBriefClean lowercases the deliverable and the platform, strips markup, caps the lists, keeps integers only, and drops the question once both are known');
ok(b.specs && b.specs.lane === 'social' && b.specs.aspect === '9:16' && b.specs.scale === '3' && /bottom 20 percent/.test(b.specs.safe), 'A3 the platform sets the lane, the aspect, the scale and the safe zone; the count overrides the scale');
const b2 = X.playBriefClean({ deliverable: 'film', platform: null, seconds: 30, question: 'Where does it run?' });
ok(b2.specs.lane === 'film' && b2.specs.scale === '30' && b2.specs.seconds === 30 && b2.question === 'Where does it run?', 'A4 a deliverable with no platform falls to its lane defaults, the seconds override the scale, and the one question stays');
ok(X.playBriefClean({ deliverable: 'copy' }).specs === null && X.playBriefClean(null) === null && X.playBriefClean({ deliverable: 'poem' }).deliverable === null, 'A5 words only have no specs; nothing in is nothing out; an unknown deliverable is null, never invented');
ok(X.playBriefLabel(b) === 'social / tiktok / for Jordan / to Gen Z sneaker buyers', 'A6 the label reads deliverable, platform, brand, audience');
claudeReply = { ok: true, text: 'Here: ' + JSON.stringify(raw) };
let r = await X.playInterpret({ ask: 'A TikTok series for Jordan on how Gen Z buys heritage' }, env, null, { id: 'u1' });
ok(r.status === 200 && r.data.ok && r.data.brief.platform === 'tiktok' && r.data.cached === false && calls.length === 1 && calls[0].tier === 'frame' && calls[0].req.kind === 'play_brief' && calls[0].req.cache === true,
  'A7 /play/interpret asks the frame tier once (Haiku, cached system prompt) and returns the brief');
r = await X.playInterpret({ ask: 'a tiktok series for jordan on how gen z buys heritage  ' }, env, null, { id: 'u1' });
ok(r.data.ok && r.data.cached === true && calls.length === 1, 'A8 the same ask, any case or spacing, comes from the week-long cache without a call');
claudeReply = { ok: false, error: 'claude_cap' };
r = await X.playInterpret({ ask: 'something the tier cannot read right now' }, env, null, { id: 'u1' });
const r2 = await X.playInterpret({ ask: 'something the tier cannot read right now' }, env, null, { id: 'u1' });
ok(!r.data.ok && r.data.error === 'unreadable' && r.data.why === 'claude_cap' && calls.length === 2 && !r2.data.ok && calls.length === 2, 'A9 a closed tier is a readable miss, remembered fifteen minutes so it is not asked again on every keystroke');
r = await X.playInterpret({ ask: 'hi' }, env, null, { id: 'u1' });
ok(!r.data.ok && r.data.error === 'ask_too_short' && calls.length === 2, 'A10 a six-character floor before anything is spent');

// ── B: Claude first, Workers AI the reserve (SEAM:PLAY_CLAUDE) ─────────────────────────────────────────────────────
const aiRuns = [];
env.AI = { run: async (model, req) => { aiRuns.push({ model, req }); return { response: req.max_tokens === 1800 ? '[{"id":"u1","title":"t","desc":"d","seconds":4}]' : 'reserve words' }; } };
calls.length = 0; claudeReply = { ok: true, text: ' Claude words ' };
r = await X.playGenerate({ prompt: 'Write the direction', kind: 'engine-concept', brief: raw }, env, null);
ok(r.data.ok && r.data.data.text === 'Claude words' && r.data.data.by === 'claude' && calls.length === 1 && calls[0].tier === 'live' && calls[0].req.max_tokens === 900 && calls[0].req.kind === 'play_engine-concept' && aiRuns.length === 0,
  'B1 words come from the live tier in the kind\'s room, and the answer says Claude wrote them');
ok(/THE BRIEF, which every line holds to: \{"deliverable":"social","platform":"tiktok"/.test(calls[0].req.system) && /PLATFORM SPECS: \{"platform":"tiktok"/.test(calls[0].req.system) && calls[0].req.system.indexOf(PLAY_SYSTEM['engine-concept']) === 0,
  'B2 the cleaned brief and its specs ride the system prompt after the kind\'s own prompt');
claudeReply = { ok: false, error: 'claude_cap' };
r = await X.playGenerate({ prompt: 'Break it', kind: 'engine-units', format: 'json' }, env, null);
ok(r.data.ok && Array.isArray(r.data.data.json) && r.data.data.by === 'workers_ai' && aiRuns.length === 1 && aiRuns[0].req.max_tokens === 1800 && aiRuns[0].req.temperature === 0.15,
  'B3 a capped tier falls to the reserve with the old engine room and the cold decode, and the answer says so');
claudeReply = { ok: true, text: 'not json at all' };
r = await X.playGenerate({ prompt: 'Compile', kind: 'engine-compile', format: 'json' }, env, null);
ok(r.status === 502 && r.data.error === 'bad_model_json' && r.data.by === 'claude', 'B4 a Claude answer with no JSON in a JSON ask is refused as before, naming the writer');
claudeReply = { ok: true, text: '{"caption":"c","alt":"a","variants":{"feed":"f","story":"s","video":"v"}}' };
r = await X.playGenerate({ prompt: 'Copy for unit 1', kind: 'copy' }, env, null);
ok(r.data.ok && r.data.data.json.variants.video === 'v' && calls[calls.length - 1].req.max_tokens === 600, 'B5 copy and moodboard are JSON kinds without being asked');
r = await X.playGenerate({ prompt: 'x', kind: 'concept', reserve: true }, env, null);
ok(r.data.data.by === 'workers_ai' && aiRuns.length === 2, 'B6 reserve:true asks the reserve outright');
ok(!/underLimit\(/.test(blk) && /'playGenerate': 'underLimit \(DAILY_LIMIT\); the words on claudeGate, live tier/.test(gate) && /'playInterpret': 'underLimit \(DAILY_LIMIT\) \+ claudeGate on the frame tier/.test(gate),
  'B7 the gate\'s spender registry names both guards (the router still meters every call)');
ok(['engine-territories', 'campaign', 'article', 'copy', 'moodboard'].every(k => PLAY_SYSTEM[k] && !/—/.test(PLAY_SYSTEM[k])) && /true_to_insight, distinct and makeable/.test(PLAY_SYSTEM['engine-territories']) && /exactly 4 objects/.test(PLAY_SYSTEM.moodboard),
  'B8 the director kinds exist: three scored territories, campaign, article, a copy package, a moodboard of four');

// ── C: the handoff (SEAM:PLAY_HANDOFF) ─────────────────────────────────────────────────────────────────────────────
const pkg = { ask: 'Make this move real: Sell the story, not the year. <script>x</script>', q: 'jordan brand future sneaker consumer', frame: { entity: 'Jordan Brand', audience: 'Gen Z', market: 'US', task: 'brief' },
  move: { headline: 'Sell the story, not the year', body: 'b', because: 'c', proof: 'p', type: 'Product' }, title: 'T', thesis: 'Th', findings: ['f1', 'f2', 'f3', 'f4', 'f5'], evidence: ['e1'], voices: ['v1'] };
r = await X.playHandoff({ pkg }, env, null, { id: 'u1' });
ok(r.data.ok && /^[a-f0-9]{20}$/.test(r.data.id) && r.data.url === '../play/#pkg=' + r.data.id, 'C1 a package is stored and answered with its id and PLAY\'s address');
const got = await X.playHandoffGet(r.data.id, env, null, { id: 'u1' });
ok(got.data.ok && got.data.pkg.ask === 'Make this move real: Sell the story, not the year. x' && got.data.pkg.findings.length === 4 && got.data.pkg.move.headline === pkg.move.headline && got.data.pkg.frame.entity === 'Jordan Brand',
  'C2 the owner reads it back cleaned: markup gone, the findings capped at four, the move and the frame whole');
const other = await X.playHandoffGet(r.data.id, env, null, { id: 'u2' });
const gone = await X.playHandoffGet('0'.repeat(20), env, null, { id: 'u1' });
const bad = await X.playHandoffGet('nope', env, null, { id: 'u1' });
ok(other.status === 403 && gone.status === 404 && bad.status === 400, 'C3 another person is refused, a gone package is 404, a malformed id is 400');
const big = await X.playHandoff({ pkg: { ask: 'x'.repeat(2400), findings: ['y'.repeat(300), 'y'.repeat(300), 'y'.repeat(300), 'y'.repeat(300)], evidence: Array(5).fill('z'.repeat(160)), voices: Array(4).fill('w'.repeat(280)), thesis: 'q'.repeat(400), move: { body: 'm'.repeat(600), because: 'm'.repeat(400), proof: 'm'.repeat(400), headline: 'h'.repeat(200) } } }, env, null, { id: 'u1' });
ok(big.data.ok || big.data.error === 'package_too_large', 'C4 the ceiling holds: the largest clean package is stored or refused by size, never stored oversize');
ok((await X.playHandoff({ pkg: { frame: {} } }, env, null, { id: 'u1' })).status === 400, 'C5 a package with no ask is refused');
const kvKeys = Object.keys(kv).filter(k => k.startsWith('pho:'));
ok(kvKeys.length >= 1 && JSON.parse(kv[kvKeys[0]]).owner === 'u1', 'C6 the row carries its owner');

// ── D: the EXCAVATE doors ──────────────────────────────────────────────────────────────────────────────────────────
ok(!/\.\.\/play\/\?brief=/.test(page), 'D1 no door opens PLAY on a query string PLAY never read');
ok(/onclick="return _playMove\(\$\{\(window\._playMoves=window\._playMoves\|\|\[\]\)\.push\(m\)-1\}\)"/.test(page) && /Picture this move in PLAY/.test(page), 'D2 a move\'s door carries the move itself');
ok(/_playRead\(\[\.\.\.document\.querySelectorAll\('#read-block \.read-line'\)\]\.map\(e=>e\.innerText\)\.join\(' '\)\)">MAKE WITH PLAY<\/button>/.test(page), 'D3 MAKE WITH PLAY carries the two read lines');
ok(/onclick="return _playAsk\(\)">Make it in PLAY<\/a>/.test(page), 'D4 the interpreter\'s create door carries the question');
const pk = between(page, 'function _playPkg(ask, move){', 'function _playMove(');
ok(/frame:\{ entity:f\.entity\|\|null, category:f\.category\|\|null, audience:f\.audience\|\|null, market:f\.market\|\|null, task:f\.task\|\|null \}/.test(pk) && /voices\.quotes\)\)\?gm\.meta\.voices\.quotes\.filter\(q=>q&&q\.text&&!q\.share&&q\.on_frame!==false\)\.slice\(0,4\)/.test(pk)
  && /findings:\(Array\.isArray\(syn\.insights\)\?syn\.insights:\[\]\)\.slice\(0,4\)/.test(pk) && /evidence:items\.slice\(0,5\)\.map\(i=>i&&i\.title\)/.test(pk),
  'D5 the package carries the frame, the on-frame voices, the findings and the gathered titles');
ok(/const w=window\.open\('about:blank','_blank'\);/.test(page) && /if\(w\) w\.location=url; else window\.open\(url,'_blank'\);/.test(page) && /PLAY opens without the handoff/.test(page),
  'D6 the window opens on the click (no popup block), then lands on the id; a failed post still opens PLAY and says so');
ok(/else if\(_playKind==='moodboard'\)\{/.test(page) && /kind:'moodboard',format:'json'/.test(page) && /frames\.map\(f=>api\('play\/generate-image'/.test(page) && /Written on Claude/.test(page) && /Take it into the engine/.test(page),
  'D7 the console: a moodboard is a frame list rendered as four images; a text answer says who wrote it and opens the engine with the ask');

// ── E: the PLAY page ───────────────────────────────────────────────────────────────────────────────────────────────
const pj = between(play, '/* SEAM:PLAY_BRIEF: the brief, read before anything is made', '/* SEAM:PLAY_REF');
ok(/async function interpretBrief\(\)/.test(pj) && /api\('play\/interpret', \{ ask: composeAsk\(\), from: S\.pkg \? 'excavate' : null \}\)/.test(pj) && /function applySpecs\(\)/.test(pj) && /if \(S\.specsSet === sig\) return;/.test(pj),
  'E1 Read the brief asks the door with the composed ask; the specs set the lane once per read, a hand change stands');
ok(/function renderBrief\(\)/.test(pj) && /\['must', 'avoid'\]\.forEach/.test(pj) && /q\.style\.display = b\.question \? 'flex' : 'none'/.test(pj) && /async function answerQuestion\(\)/.test(pj) && /S\.brief_i = null; save\(\); await interpretBrief\(\);/.test(pj),
  'E2 the chips (deliverable to insight, must and avoid with add and drop) and the one question, whose answer folds into the brief and re-reads it');
ok(/async function develop\(\) \{[\s\S]*kind: 'engine-territories', format: 'json', brief: S\.brief_i/.test(pj) && /function pickTerritory\(i\)/.test(pj) && /if \(S\.picked\.length > 2\) S\.picked\.shift\(\);/.test(pj) && /async function blendTerritories\(\)/.test(pj) && /async function writeDirection\(\)/.test(pj),
  'E3 develop writes three territories; pick one (the direction), pick two (blend), or write one direction straight');
ok(/kind: 'engine-units', format: 'json', brief: S\.brief_i \}\);   \/\/ SEAM:PLAY_BRIEF/.test(play) && /kind: 'engine-compile', format: 'json', brief: S\.brief_i \}\);   \/\/ SEAM:PLAY_BRIEF/.test(play) && /return insightText\(\) \+ 'Lane: '/.test(play) && /S\.aspect \+ '\.' \+ specText\(\);/.test(play),
  'E4 the brief rides the units and every compile; the lane text opens with the insight and ends with the platform specs');
ok(/async function loadPkg\(\)/.test(pj) && /\/\[#&\]pkg=\(\[a-f0-9\]\{20\}\)\//.test(pj) && /apiGet\('play\/handoff\/' \+ m\[1\]\)/.test(pj) && /new URLSearchParams\(location\.search\)\.get\('brief'\)/.test(pj) && /history\.replaceState\(null, '', location\.pathname\)/.test(pj),
  'E5 PLAY reads #pkg (and the old ?brief=) on boot and clears the address');
ok(/await loadPkg\(\);   \/\/ SEAM:PLAY_HANDOFF/.test(play) && /if \(S\.pkg && !S\.brief_i && S\.brief\) interpretBrief\(\);/.test(play) && /<div class="from" id="from" style="display:none"><b>From EXCAVATE<\/b>/.test(play),
  'E6 the boot loads the package first, shows From EXCAVATE, and reads the brief on arrival');
ok(/<div class="chips" id="bchips"><\/div>/.test(play) && /<div class="terrs" id="terrs" style="display:none"><\/div>/.test(play) && /Develop three territories/.test(play) && /onclick="writeDirection\(\)">Write one direction<\/button>/.test(play),
  'E7 the markup: the chips under the brief, the territories above the direction, both doors on Stage I');
const store = {}; const S0 = { brief: 'A TikTok series', brand: '', pkg: { move: { headline: 'H', body: 'B', because: 'C' }, frame: { audience: 'Gen Z', market: 'US' }, thesis: 'Th', findings: ['f1', 'f2'], voices: ['v1'] }, brief_i: { insight: 'I', objective: 'O', tone: 'T', must: ['m'], avoid: ['a'], specs: { platform: 'tiktok', safe: 'sz' } }, lane: 'social', scale: '3', aspect: '9:16', style: '' };
const F = new Function('S', 'LANES', pj.split('async function interpretBrief()')[0] + '\nreturn { composeAsk, insightText, specText };')(S0, { social: { unitPlural: 'assets' } });
ok(/^A TikTok series The move this makes real: H\. B Why now: C Audience: Gen Z in US\. The read's thesis: Th$/.test(F.composeAsk()), 'E8 the composed ask carries the move, the audience and the thesis from the package');
ok(/^The insight every frame stands on: I Objective: O Tone: T\. Must: m\. Avoid: a\. What the read found: f1 \| f2 How people say it: "v1" $/.test(F.insightText()) && F.specText() === ' Platform: tiktok. Safe zone: sz.', 'E9 the insight text and the spec text read as the writer will see them');
ok(!/—/.test(blk) && !/—/.test(pj) && !/—/.test(pk), 'G1 no em dash in the new code or its copy');
console.log('\nproof_play_brief: ' + pass + ' checks PASS');
