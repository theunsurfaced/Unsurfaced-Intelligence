/**
 * proof_territories.mjs  --  EX39 THE TERRITORIES: SEAM:TERRITORIES. Twenty territories named; the state carries their sources; the
 * method surface is written from the constants that compute the numbers; the door's evidence lines carry the article's passage; the
 * page shows the map, the territory lens and how the numbers are made.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const slugs = new Function('return ' + between(w, "const TERRITORY_SLUGS = ", ';   // SEAM:TERRITORIES').replace('const TERRITORY_SLUGS = ', ''))();
const names = new Function('return ' + between(w, 'const INDUSTRY_NAMES = ', ';   // SEAM:TERRITORIES').replace('const INDUSTRY_NAMES = ', ''))();
ok(slugs.length === 20 && Object.keys(names).length === 20 && slugs.every(s => names[s]), 'T1 twenty territories, every one named');
ok(/name: INDUSTRY_NAMES\[o\.territory\] \|\| o\.territory\.replace/.test(w) && /sources: \{ n: declared\.length, tiers: \[1, 2, 3\]\.map\(k => declared\.filter\(s => s\.tier === k\)\.length\) \}/.test(w) && /KEY: 'state:v3'/.test(w), 'T2 the state names each territory and declares its sources by tier; the cache key moved');
ok(/path === '\/excavate\/method' && request\.method === 'GET'\) return excavateMethodRoute\(env, origin\)/.test(w) && /function excavateMethod\(\)/.test(w), 'T3 GET /excavate/method is public');
const m = between(w, 'function excavateMethod() {', 'async function excavateMethodRoute(');
ok(/EXC_MEASURE\.WEEKS/.test(m) && /STATE\.SPIKE/.test(m) && /STATE\.RISE/.test(m) && /STATE\.FALL/.test(m) && /DOOR_LAW\.WATCH_MIN_D/.test(m) && /DOOR_LAW\.MIN_DELTA/.test(m) && /SPINE\.ECHO_SIM/.test(m) && /DAILY_POV\.sources/.test(m) && /DAILY_POV\.tiers/.test(m) && /DAILY_POV\.resist/.test(m), 'T4 the method is written from the constants that compute the numbers, never typed');
ok(!/\d+ sources/.test(m) && /never: 'research'/.test(m) && /id: 'private', say: 'What a client uploads or searches teaches the engine and is shown to no one but that client and the house\.'/.test(m), 'T5 no figure is typed into the method; every measure says what it never counts; the private law is printed');
ok(/const DOOR_TEXT = \{ PER: 6, PAGES: 120, BUDGET_MS: 150000, MIN: 400, MAX: 700, TIER: 2 \};/.test(w) && /await doorQuotes\(env, ev, frame, textLedger\);/.test(w) && /quoted: !!c\.quoted, image:/.test(w) && /out\.text = \{ pages: textLedger\.pages, quoted: textLedger\.quoted, credits: textLedger\.credits/.test(w), 'T6 the text behind the row: tier 1 and 2 lines carry the article\'s passage, bounded per subject and per pass, counted on the pass');
const q = between(w, 'async function doorQuotes(env, ev, frame, ledger) {', 'async function doorPass(env, opts) {');
ok(/excTier\(c\) <= DOOR_TEXT\.TIER && !c\.quoted/.test(q) && /deepExtract\(env, want\.map\(c => c\.url\)\)/.test(q) && /t\.text\.length < DOOR_TEXT\.MIN\) continue;/.test(q), 'T7 only tier 1 and 2 https lines are pulled, through deepExtract; a page under the minimum keeps its dek');
// the page
ok(/<section class="hub-block room-sec" id="terr-block" style="display:none">/.test(page) && /<div class="terr-grid" id="terr-grid"><\/div>/.test(page) && /function _terrRender\(st\)/.test(page) && /onclick="_terrOpen\('\$\{safeAttr\(x\.territory\)\}'\)"/.test(page), 'T8 the territories as a map under the board, each a button');
ok(/function _terrOpen\(slug\) \{\n  _recLensSet\('territory', slug\);/.test(page) && /if \(L\.kind === 'territory'\) return tiles\.filter\(t => t\.measures && t\.measures\.territory === L\.value\);/.test(page) && /\['territory', 'Territories'\]/.test(page), 'T9 opening a territory sets the record\'s territory lens and scrolls to it');
ok(/<section class="hub-block room-sec" id="method-block" style="display:none">/.test(page) && /function _methodRender\(m\)/.test(page) && /function _methodSources\(\)/.test(page) && /_terrLoad\(\); _methodLoad\(\);/.test(page), 'T10 how the numbers are made, from the route, with the source list a click away; both load beside the record');
ok(/\.terr-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(page) && /@media \(max-width:1000px\)\{\.terr-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/.test(page), 'T11 four across, two on a tablet and a phone');
console.log('proof_territories: ' + pass + ' ok');
