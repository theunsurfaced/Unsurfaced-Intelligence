/**
 * proof_excavate_run.mjs  --  EX27 RUN: SEAM:EXC_RAILS, SEAM:EXC_QUICK, SEAM:EXC_HEADLINE, SEAM:EXC_THIN.
 * The rails follow the frame; Quick keeps the competitive set's retry and writes without thinking under a deadline; the headline law
 * rides the live writer; a read on a few lines says so; a voice is on the frame by its own words.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the class from the frame ────────────────────────────────────────────────────────────────────────────────────
const C = new Function(between(w, 'function excClassOfFrame(f) {', 'function classifyQuery(') + '; return excClassOfFrame;')();
ok(C({ entity: 'Jordan Brand', task: 'audience', category: 'athletic footwear' }) === 'brand', 'A1 a named entity reads as a brand question whatever the task (Jordan Brand, read for an audience)');
ok(C({ entity: null, task: 'compare', category: 'sneakers' }) === 'brand' && C({ entity: null, task: 'audience', category: 'sneakers' }) === 'behavior', 'A2 a comparison is a brand question; an audience with no entity is behavior');
ok(C({ entity: null, task: 'read', category: 'hair care' }) === 'category' && C({ entity: null, task: 'timeline', category: 'denim' }) === 'category' && C({ entity: null, task: 'brief', category: 'skincare' }) === 'category', 'A3 a read, a timeline or a brief on a category is a category question');
ok(C(null) === null && C({}) === null && C({ task: 'create' }) === null, 'A4 a frame that says nothing leaves the class to the classifier');
const gather = between(w, 'async function gatherOpenSignals(', 'async function excavateGather(');
ok(/const fw = excFrameWhole\(opts\.frame\);\n  const cls = opts\.cls \|\| excClassOfFrame\(fw\) \|\| classifyQuery\(query, ctx\.meta\.kg\);/.test(gather), 'A5 the gather takes the class from a whole frame before the classifier');
ok(/&& !\(fw && fw\.entity && \(r\.kind === 'research' \|\| r\.id === 'openlibrary'\)\)\)/.test(gather), 'A6 a frame with an entity never asks the research rails or Open Library');

// ── B: Quick ───────────────────────────────────────────────────────────────────────────────────────────────────────
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
ok(/if \(quick\) body = Object\.assign\(\{\}, body, \{ pages: false, gap: false, facts: false \}\);/.test(synth) && !/facts: false, framed: false/.test(synth), 'B1 Quick turns off the pages, the gap round and the fact table, and keeps the retry of the competitive set and the counter view');
ok(/body\.framed !== false/.test(synth) && /\['competitors', 'counter'\]/.test(synth), 'B2 the framed retry still asks for the competitors and the counter view when the gather missed them');
ok(/\+ '\|' \+ EXC_READ\.REV\)/.test(synth) && /const EXC_READ = \{ REV: 'r2', QUICK_MS: 45000 \}/.test(w), 'B3 the read cache key carries the revision, so yesterday\'s quick read is compiled again once');
ok(/thinking: quick \? \{ type: 'disabled' \} : null, timeout_ms: quick \? EXC_READ\.QUICK_MS : null/.test(synth), 'B4 a quick read writes without thinking under a 45 s deadline');
const comp = between(w, 'async function excCompile(env, o) {', '// SEAM:EXC_FRAME: the frame call lives in the lane block');
ok(/if \(o\.thinking\) req\.thinking = o\.thinking;/.test(comp) && /if \(!r\.ok && req\.thinking && \/\^claude_400\$\/\.test\(String\(r\.error \|\| ''\)\)\) \{ delete req\.thinking; r = await ask\(\); \}/.test(comp),
  'B5 the writer passes the thinking field through and retries once without it on a 400');

// ── C: the headline law ─────────────────────────────────────────────────────────────────────────────────────────────
const law = between(w, 'const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = ');
ok(/6 to 14 words, present tense/.test(law) && /whole words and articles/.test(law) && /never the signal, the count, the coverage or the measure/.test(law) && /a number only when the number is the point, and then one number/.test(law) && /it never argues against them/.test(law) && /a market the frame did not name/.test(law) && /Every insight title obeys the same law at 6 to 13 words/.test(law),
  'C1 the headline law v2: a sentence about people, never about the dial, one number when it is the point, the move follows the findings, no off-frame market');
ok(/EXC_MOVE_LAW \+ ' ' \+ EXC_HEADLINE_LAW : sys\)/.test(synth), 'C2 the law rides the report writer\'s system prompt');
ok(/"read":\["line 1, the headline: 6 to 12 words, present tense, one claim about the people in the question, no figure, no source name, no semicolon","line 2, the dek: one sentence under 30 words carrying the one figure that proves line 1 and naming its source in words"\]/.test(w),
  'C3 the contract\'s two lines are the headline and the dek, not a 40-word reframing');
ok(!/—/.test(law), 'C4 no em dash in the law');

// ── D: thin ground ──────────────────────────────────────────────────────────────────────────────────────────────────
ok(/const EXC_THIN = \{ MIN: 12 \}/.test(w) && /const thin = merged\.length < EXC_THIN\.MIN;/.test(synth) && /THIN GROUND: the evidence holds only ' \+ merged\.length \+ ' lines on this question\. Give at most 3 insights and 2 moves/.test(synth),
  'D1 under twelve lines the writer gives at most 3 insights and 2 moves and says the read is building');
ok(/thin: thin \? merged\.length : null,   \/\/ SEAM:EXC_THIN/.test(synth), 'D2 the payload says thin: <lines>');
ok(/if\(gd&&synthesis&&synthesis\.thin\)\{ gd\.insertAdjacentHTML\('afterbegin','<div class="read-thin">This read is building on '/.test(page) && /\.read-thin\{/.test(page), 'D3 the page says the read is building on N lines beside Go deeper');
ok(/brief = syn\.brief \|\| 'The interpretation did not finish in this pass; the findings and the moves above stand on their own evidence\.';/.test(page) && !/\$\{ok\.length\} live source|unranked raw signals straight from the open social and web layer \u2014/.test(page),
  'D4 a written read never prints the placeholder; the placeholder lost its dash and its none');
ok(/the first pass \$\{p\.stop==='max_tokens'\?'ran out of room'/.test(page) && !/cut at the token limit/.test(page), 'D5 the receipt describes a cut pass in plain words');

// ── E: the voice law ────────────────────────────────────────────────────────────────────────────────────────────────
const V = new Function('EXC_GATE', between(w, 'function voiceOnFrame(text, frame) {', 'function voiceAdd(') + '; return voiceOnFrame;')({ STOP: new Set(['the', 'and', 'for', 'brand', 'consumer', 'consumers']) });
const frame = { entity: 'Jordan Brand', competitors: ['Nike', 'New Balance'], category: 'athletic footwear', anchors: ['jordan', 'sneakers', 'shoes', 'gen z', 'young consumers', 'retro'] };
ok(V('Depends on the shoe. Some shoes will cause blisters with the short socks', frame) === false, 'E1 a comment about socks under a Jordan video is not a voice about Jordan (one category noun is not enough)');
ok(V('Jordans are not comfortable at $220', frame) === true && V('I switched to New Balance for the cushion', frame) === true, 'E2 a comment that names the entity or a competitor is on the frame');
ok(V('the retro sneakers my generation grew up on are back', frame) === true, 'E3 two of the frame\'s words carry a comment without the name');
ok(V('I love this video', frame) === false && V('anything', { anchors: [] }) === null, 'E4 a comment with none of the frame\'s words is off it; no frame says nothing');
ok(V('gen z buys hair care on tiktok', { entity: null, competitors: [], category: 'hair care', anchors: ['hair care', 'gen z'] }) === true, 'E5 a frame with no entity keeps the old law: one anchor is enough');

// ── F: Perplexity's cap ─────────────────────────────────────────────────────────────────────────────────────────────
ok(/PPLX_DAILY_DOLLARS: 1\.50,/.test(w) && /parseFloat\(env\.PPLX_DAILY_DOLLARS\) \|\| \(CONFIG\.PPLX_DAILY_DOLLARS \* \(evolutionMode\(env\) \? 5 : 1\)\)/.test(w), 'F1 the house cap is $1.50 a day, five times that in evolution mode, and the environment still wins');
ok(!/—/.test(gather + synth.slice(synth.indexOf('const quick'), synth.indexOf('const qhash')) + comp), 'G1 no em dash in the new code');
console.log('\nproof_excavate_run: ' + pass + ' checks PASS');
