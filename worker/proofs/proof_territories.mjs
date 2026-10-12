/**
 * proof_territories.mjs  --  EX39 THE TERRITORIES + EX39b THE QUIET RECORD: SEAM:TERRITORIES, SEAM:QUIET_ENGINE. Twenty territories named;
 * the state carries no source counts; the method surface is written from the constants that compute the numbers and answers the house
 * only; the door's evidence lines carry the article's passage; the page shows the map (state, movers, readings) and the territory lens,
 * no method, and the track record only once a call has been graded, as a score line.
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
const st = between(w, 'async function excavateState(env) {', 'const METHOD = {');
ok(/name: INDUSTRY_NAMES\[o\.territory\] \|\| o\.territory\.replace/.test(st) && !/sources:/.test(st) && !/declared/.test(st) && /KEY: 'state:v4'/.test(w), 'T2 the state names each territory and says nothing about the sources behind it');
const mr = between(w, 'async function excavateMethodRoute(request, env, origin) {', 'async function excavateStateRoute(');
ok(/path === '\/excavate\/method' && request\.method === 'GET'\) return excavateMethodRoute\(request, env, origin\)/.test(w) && /key === deskKey/.test(mr) && /callerIsAdmin\(env, user\.id\)/.test(mr) && /error: 'unauthorized' \}, 401/.test(mr), 'T3 GET /excavate/method answers the desk key or a signed-in admin, nobody else');
const m = between(w, 'function excavateMethod() {', 'async function excavateMethodRoute(');
ok(/EXC_MEASURE\.WEEKS/.test(m) && /STATE\.SPIKE/.test(m) && /STATE\.RISE/.test(m) && /STATE\.FALL/.test(m) && /DOOR_LAW\.WATCH_MIN_D/.test(m) && /DOOR_LAW\.MIN_DELTA/.test(m) && /SPINE\.ECHO_SIM/.test(m) && /DAILY_POV\.sources/.test(m) && /DAILY_POV\.tiers/.test(m) && /DAILY_POV\.resist/.test(m), 'T4 the method is written from the constants that compute the numbers, never typed');
ok(!/\d+ sources/.test(m) && /never: 'research'/.test(m) && /id: 'private', say: 'What a client uploads or searches teaches the engine and is shown to no one but that client and the house\.'/.test(m), 'T5 no figure is typed into the method; every measure says what it never counts; the private law is printed');
ok(/const DOOR_TEXT = \{ PER: 6, PAGES: 120, BUDGET_MS: 150000, MIN: 400, MAX: 700, TIER: 2 \};/.test(w) && /await doorQuotes\(env, ev, frame, textLedger\);/.test(w) && /quoted: !!c\.quoted, image:/.test(w) && /out\.text = \{ pages: textLedger\.pages, quoted: textLedger\.quoted, credits: textLedger\.credits/.test(w), 'T6 the text behind the row: tier 1 and 2 lines carry the article\'s passage, bounded per subject and per pass, counted on the pass');
const q = between(w, 'async function doorQuotes(env, ev, frame, ledger) {', 'async function doorPass(env, opts) {');
ok(/excTier\(c\) <= DOOR_TEXT\.TIER && !c\.quoted/.test(q) && /deepExtract\(env, want\.map\(c => c\.url\)\)/.test(q) && /t\.text\.length < DOOR_TEXT\.MIN\) continue;/.test(q), 'T7 only tier 1 and 2 https lines are pulled, through deepExtract; a page under the minimum keeps its dek');
// the page
ok(/<section class="hub-block room-sec" id="terr-block" style="display:none">/.test(page) && /<div class="terr-grid" id="terr-grid"><\/div>/.test(page) && /function _terrRender\(st\)/.test(page) && /onclick="_terrOpen\('\$\{safeAttr\(x\.territory\)\}'\)"/.test(page), 'T8 the territories as a map under the board, each a button');
const tr = between(page, 'function _terrRender(st) {', 'function _terrOpen(slug) {');
ok(!/sources/.test(tr) && !/tiers/.test(tr) && /No reading yet/.test(tr), 'T8b a card says the state, the movers and the readings; nothing about the sources behind it');
ok(/function _terrOpen\(slug\) \{\n  _recLensSet\('territory', slug\);/.test(page) && /if \(L\.kind === 'territory'\) return tiles\.filter\(t => t\.measures && t\.measures\.territory === L\.value\);/.test(page) && /\['territory', 'Territories'\]/.test(page), 'T9 opening a territory sets the record\'s territory lens and scrolls to it');
ok(!/method-block/.test(page) && !/_methodLoad/.test(page) && !/excavate\/method/.test(page) && /_terrLoad\(\);   \/\/ SEAM:TERRITORIES/.test(page), 'T10 the method is not on the page; the map loads beside the record');
ok(/\.terr-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(page) && /@media \(max-width:1000px\)\{\.terr-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/.test(page), 'T11 four across, two on a tablet and a phone');
const rr = between(page, 'function _renderRecord(record) {', 'async function _openDoorRead(t) {');
ok(/if \(!\(held \+ faded\)\) \{ el\.style\.display = 'none'; ledger\.innerHTML = ''; return; \}/.test(rr) && /ledger\.innerHTML = ''; ledger\.style\.display = 'none';/.test(rr) && !/col\('still open'/.test(rr), 'T12 the track record is off the page until a call has been graded, and then it is the score line, no ledger of bets');
console.log('proof_territories: ' + pass + ' ok');
