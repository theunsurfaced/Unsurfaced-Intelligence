/**
 * proof_excavate_record.mjs  --  EX28 THE RECORD: SEAM:RECORD_LAW, SEAM:RECORD_WATCH, SEAM:RECORD_ROUTE, SEAM:EXC_BLIND, SEAM:EXC_HOUSE,
 * SEAM:EXC_PLACE (worker); SEAM:RECORD_SCROLL, SEAM:EXC_FALLBACK, SEAM:EXC_NAV (page).
 * The board is the intelligence the engine deploys when the evidence earns it, dated and kept; every read carries a bet the record
 * grades; the fallback obeys the laws; the nav is EXCAVATE and Library.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the law, pure ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const L = new Function(between(w, 'const DOOR_LAW = ', 'function excDoorPrompt(') + '; return { doorMoveSize, doorWatchOf, doorWatchGrade, doorPlaceOf, DOOR_LAW };')();
ok(L.DOOR_LAW.CAP === 6 && L.DOOR_LAW.MIN_DELTA === 3 && L.DOOR_LAW.MIN_VEL === 40 && L.DOOR_LAW.MIN_OUTLETS === 2 && L.DOOR_LAW.WATCH_MIN_D === 14 && L.DOOR_LAW.WATCH_MAX_D === 45, 'A1 the law: six a night, three stories or forty percent or two outlets, a watch 14 to 45 days out');
ok(L.doorMoveSize(null, null, null) === Infinity && L.doorMoveSize({ read: {} }, { recent_delta: 1, outlets_delta: 1 }, { velocity_pct: 20 }) === 0, 'A2 a subject never read is always earned; one more story, one more outlet and twenty percent is not a move');
ok(L.doorMoveSize({ read: {} }, { recent_delta: -4, outlets_delta: 0 }, { velocity_pct: -30 }) > 0 && L.doorMoveSize({ read: {} }, { recent_delta: 0, outlets_delta: 2 }, null) > 0 && L.doorMoveSize({ read: {} }, { recent_delta: 0, outlets_delta: 0 }, { velocity_pct: 55 }) > 0, 'A3 a fall of four stories, two new outlets or a 55 percent swing each earns a read');
ok(L.doorWatchOf({ measure: 'signals_7d', op: 'gte', value: 12, by: '2026-10-30', claim: 'twelve stories' }, '2026-10-08').by === '2026-10-30' && L.doorWatchOf({ measure: 'signals_7d', op: 'gte', value: 12, by: '2026-10-12' }, '2026-10-08') === null && L.doorWatchOf({ measure: 'likes', op: 'gte', value: 1, by: '2026-10-30' }, '2026-10-08') === null && L.doorWatchOf({ measure: 'outlets', op: 'eq', value: 1, by: '2026-10-30' }, '2026-10-08') === null,
  'A4 a watch is a counted measure, gte or lte, a number and a date in the window; anything else is no watch');
ok(L.doorWatchGrade({ measure: 'signals_7d', op: 'gte', value: 12 }, { recent_7d: 14 }).verdict === 'held' && L.doorWatchGrade({ measure: 'velocity_pct', op: 'lte', value: -20 }, { velocity_pct: 5 }).verdict === 'missed' && L.doorWatchGrade({ measure: 'outlets', op: 'gte', value: 3 }, null) === null && L.doorWatchGrade({ measure: 'outlets', op: 'gte', value: 3 }, { outlets: null }) === null,
  'A5 the grade is held or missed on the database\'s number; no number, no grade');
ok(JSON.stringify(L.doorPlaceOf([{ place: 'United States' }, { place: 'United States' }, { place: 'Nigeria' }, {}])) === '[{"place":"United States","count":2},{"place":"Nigeria","count":1}]', 'A6 place counts the evidence by country, two at most');

// ── B: the pass ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const pass_ = between(w, 'async function doorPass(env, opts) {', 'async function doorLand(');
ok(/const DOOR = \{ WANT: 30, KEY: 'door:v2'/.test(w) && /EVERY_D: 1, VOICE: '3\.3r'/.test(w), 'B1 the candidate pool is thirty, the door runs nightly, the voice carries the watch');
ok(/const voiceChanged = !!\(prev && prev\.stamp && !String\(prev\.stamp\)\.startsWith\('v' \+ DOOR\.VOICE \+ '~'\)\);/.test(pass_) && /const size = voiceChanged \? Infinity : doorMoveSize\(prev, base\.meta\.since, measures\);/.test(pass_) && /if \(prev && prev\.read && size === 0\) \{ out\.reused\+\+; out\.unmoved = \(out\.unmoved \|\| 0\) \+ 1;/.test(pass_),
  'B2 a subject whose evidence changed but did not move keeps its last read and spends nothing; a new voice is a new read');
ok(/jobs\.sort\(\(a, b\) => \(b\.size === Infinity \? 1e9 : b\.size\) - \(a\.size === Infinity \? 1e9 : a\.size\)\);/.test(pass_) && /for \(const j of jobs\.slice\(DOOR_LAW\.CAP\)\) \{ if \(j\.prev && j\.prev\.read\) \{ out\.reused\+\+; rowsOut\.push\(Object\.assign\(j\.base, \{ status: 'reused', read: j\.prev\.read \}\)\); \} else out\.waiting = \(out\.waiting \|\| 0\) \+ 1; \}/.test(pass_) && /jobs = jobs\.slice\(0, DOOR_LAW\.CAP\);/.test(pass_) && /out\.earned = jobs\.length; out\.cap = DOOR_LAW\.CAP;/.test(pass_),
  'B3 the largest moves first, at most six a night; past the cap a subject keeps its last read or waits; the pass reports earned and cap');
ok(/EXC_NUMBER_LAW \+ ' ' \+ EXC_HEADLINE_LAW, prompt: excDoorPrompt\(frame, evidence, measures, memo\.get\(cand\.key\) \|\| '', night\)/.test(pass_), 'B4 the door writer carries the headline law and the night');
ok(/const prevId = row\.meta && row\.meta\.prev_id;/.test(w) && /developed_by: id, developed_night: row\.night/.test(w), 'B5 a landing marks the read it develops; the earlier read stays on the record');

// ── C: the watch in the contract and the compile ───────────────────────────────────────────────────────────────────────────────
ok(/"watch":\{"claim":"one sentence, under 20 words: what the read expects the lake to show by the date","measure":"signals_7d\|outlets\|velocity_pct","op":"gte\|lte","value":<a number the MEASURES line makes plausible>,"by":"a date between ' \+ day\(DOOR_LAW\.WATCH_MIN_D\) \+ ' and ' \+ day\(DOOR_LAW\.WATCH_MAX_D\) \+ '"\},'/.test(w) && /The watch is a bet the read is willing to lose in public\./.test(w),
  'C1 the contract asks for one measurable watch between the window\'s dates, a bet the read is willing to lose in public');
ok(/const watch = doorWatchOf\(parsed\.watch, night\);/.test(w) && /insights, ideas, brief, watch, read_checks:/.test(w) && /function doorCompileRead\(parsed, merged, frame, measures, night\)/.test(w) && /doorCompileRead\(got\.read, merged, row\.frame, row\.measures, row\.night\)/.test(w), 'C2 the compile keeps the watch, checked against the row\'s night');
const called = between(w, 'async function doorCalled(env) {', 'async function doorRecord(env) {');
ok(/read->watch=not\.is\.null&meta->called=is\.null/.test(called) && /if \(!w \|\| !w\.by \|\| w\.by > today\) continue;/.test(called) && /await excMeasures\(env, r\.frame\)/.test(called) && /verdict: 'unmeasured'/.test(called) && !/callClaude|env\.AI\.run/.test(called),
  'C3 the nightly grade takes every due, ungraded watch, measures its frame on the database and marks it; no model is asked');
ok(/\.then\(\(\) => doorCalled\(env\)\)   \/\/ SEAM:RECORD_WATCH/.test(w) && /which === 'called' \? await doorCalled\(env\) : which === 'record' \? await doorRecord\(env\)/.test(w), 'C4 the grade runs after the door pass each night; the desk runs called and record');

// ── D: the record and the permalink ────────────────────────────────────────────────────────────────────────────────────────────
const rec = between(w, 'async function doorRecord(env) {', 'async function doorRecordRoute(');   // EX31: the record carries the currents and each tile's ahead too   // EX31: the record carries the currents and each tile's ahead too
ok(/door_reads\?status=eq\.ready&read=not\.is\.null&/.test(rec) && /order=night\.desc,created_at\.desc&limit=' \+ RECORD\.LIMIT/.test(rec), 'D1 the record lists reads the engine wrote, never a reused row, newest first');
ok(/o\.deployments >= RECORD\.POSITION_MIN && o\.held >= RECORD\.POSITION_HELD/.test(rec) && /const RECORD = \{ KEY: 'record:v1', TTL: 600, LIMIT: 80, GRADE_LIMIT: 40, POSITION_MIN: 3, POSITION_HELD: 2 \}/.test(w), 'D2 a position is three deployments of which two held; the record is cached ten minutes');
ok(/counts: \{ deployments: tiles\.length, subjects: by\.size, held:/.test(rec) && /blind: typeof excBlindLine === 'function' \? excBlindLine\(env\) : EXC_BLIND \}/.test(rec), 'D3 the record carries its counts and the blind-spots line');
ok(/if \(path === '\/excavate\/record' && request\.method === 'GET'\) return doorRecordRoute\(request, env, origin\);/.test(w) && /if \(path === '\/excavate\/insight' && request\.method === 'GET'\) return doorInsightRoute\(request, env, origin\);/.test(w) && /if \(path\.startsWith\('\/i\/'\) && request\.method === 'GET'\) return insightSharePage\(path, env, new URL\(request\.url\)\.searchParams\.get\('embed'\) === '1'\);/.test(w),
  'D4 the record, one insight and the permalink are routes');
const pub = between(w, 'async function doorInsightPublic(env, id) {', 'async function doorInsightRoute(');
ok(/delete t\.voices;/.test(pub) && /status=in\.\(ready,reused\)/.test(pub), 'D5 the public insight carries no voices; the evidence stays behind the signed-in read');
const share = between(w, 'async function insightSharePage(path, env, embed) {', 'async function excHouseLines(');   // SEAM:EVIDENCE_PACK
ok(/\/intelligence\/\?insight=/.test(share) && /property="og:title"/.test(share) && /property="og:image"/.test(share) && /http-equiv="refresh"/.test(share) && /Cache-Control': 'public, max-age=300'/.test(share), 'D6 the permalink page carries share tags and opens the reading on the site');
ok(/deployed: r\.night, develops: \(r\.meta && r\.meta\.prev_id\) \|\| null, developed_by: \(r\.meta && r\.meta\.developed_by\) \|\| null/.test(w) && /watch: \(rd && rd\.watch\) \|\| null, called: \(r\.meta && r\.meta\.called\) \|\| null, place: doorPlaceOf\(r\.evidence\)/.test(w), 'D7 the tile carries the deployment\'s date, lineage, watch, grade and place');

// ── E: blind spots, the house's own lines, place ───────────────────────────────────────────────────────────────────────────────
ok(/const EXC_BLIND = 'This read does not see TikTok, Instagram or X\. Its voices come from YouTube and Mastodon; its news from the open web and the lake\.';/.test(w) && (w.match(/blind: typeof excBlindLine === 'function' \? excBlindLine\(env\) : EXC_BLIND,   \/\/ SEAM:EXC_BLIND/g) || []).length === 2, 'E1 the blind-spots line rides every live read and every door read, computed from what is configured (SEAM:EXC_LANGUAGE, EX31)');
const house = between(w, 'async function excHouseLines(env, frame) {', 'async function excavateFeed(env, origin) {');
ok(/status=eq\.ready&read=not\.is\.null&night=gte\./.test(house) && /limit=3/.test(house) && /called: r\.meta && r\.meta\.called \? r\.meta\.called\.verdict : null/.test(house), 'E2 the house\'s own lines: three deployed insights on the frame, with their grades');
ok(/const house = typeof excHouseLines === 'function' \? await excHouseLines\(env, frame0\)\.catch\(excQuiet\('house_lines', \[\]\)\) : \[\];/.test(w) && /WHAT THE HOUSE DEPLOYED \(our own dated insights on this subject; context for continuity, never evidence, never a source to cite/.test(w) && /excMeasureLine\(measures\) \+ houseBlock \+ \(isReport/.test(w) && /house: house,   \/\/ SEAM:EXC_HOUSE/.test(w),
  'E3 a live read is handed the house\'s deployed insights after the measures and before the evidence, as context never evidence; the receipt carries them');
ok(/country: env1\(o\.country\)\.slice\(0, 40\) \|\| null,/.test(w) && /country: a\.sourcecountry \|\| null,   \/\/ SEAM:EXC_PLACE/.test(w) && /place: c\.country \|\| null \}\)\),   \/\/ SEAM:EXC_PLACE/.test(w) && /rail: 'gather', country: it\.country \|\| null \}/.test(w), 'E4 GDELT\'s country rides the envelope, the top-up and the stored evidence line');

// ── F: the page ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/onclick="navTo\('explore'\)">EXCAVATE<small>ask culture a question; the record<\/small>/.test(page) && /<li style="display:none"><button class="nlb" id="nav-brands"/.test(page) && /<li style="display:none"><button class="nlb" id="nav-audiences"/.test(page) && /<span id="nav-menu-cur">EXCAVATE<\/span>/.test(page) && /const _NAV_NAMES = \{ explore: 'EXCAVATE', brands: 'Brands', audiences: 'Audiences', library: 'Library' \};/.test(page),
  'F1 the nav is EXCAVATE and Library; the brand and audience rooms keep their sections and open from the record');
ok(/<h2 id="board-h2">The record<\/h2>/.test(page) && /<div class="rec-lenses" id="rec-lenses" style="display:none"><\/div>/.test(page) && /<div class="rec-counts" id="rec-counts" style="display:none"><\/div>/.test(page), 'F2 the board is the record, with a lens row and the counts');
ok(/async function _recordLoad\(\)/.test(page) && /\/excavate\/record'\)/.test(page) && /if \(_FI_RECORD && Array\.isArray\(_FI_RECORD\.tiles\) && _FI_RECORD\.tiles\.length >= 3\) \{ _renderScroll\(_FI_RECORD, data\); return; \}/.test(page) && /if \(data && data\.door && Array\.isArray\(data\.door\.tiles\) && data\.door\.tiles\.length >= 4\) \{ _renderDoorGrid\(data\.door, data\.proposed \|\| \[\]\); return; \}/.test(page),
  'F3 the record renders as the scroll; the standing door tiles render while the record is empty');
ok(/\['brand', count\(t => t\.frame && t\.frame\.entity\)\], \['category', count\(t => t\.frame && t\.frame\.category\)\], \['audience', count\(t => t\.frame && t\.frame\.audience\)\], \['place', count\(t => \(t\.place \|\| \[\]\)\.map\(p => p\.place\)\)\]/.test(page) && /btn\('positions', null, 'Where the house has a position', positions\.length\)/.test(page) && /onclick="navTo\('brands'\)">Brand rooms<\/button>/.test(page),
  'F4 the lens row: brand, category, audience, place, positions, and the rooms');
ok(/<b>Deployed \$\{safe\(_recDay\(t\.deployed\)\)\}<\/b>/.test(page) && /develops an earlier reading/.test(page) && /class="rec-pos">a position since/.test(page) && /<div class="rec-watch held"><i>Held<\/i>/.test(page) && /<div class="rec-watch missed"><i>Missed<\/i>/.test(page) && /<div class="rec-watch open"><i>Watching<\/i>/.test(page),
  'F5 a row carries its dateline, lineage, position, and the watch as held, missed or watching; a miss is shown');
ok(/_playRecord\('\$\{safeAttr\(t\.id\)\}'\)/.test(page) && /function _playRecord\(id\)/.test(page) && /_playOpen\(pkg\);/.test(page) && !/\.\.\/play\/\?brief=/.test(page) && /'\/i\/' \+ encodeURIComponent\(t\.id\)/.test(page) && /showToast\('Link copied'\)/.test(page),
  'F6 play it goes through the PLAY handoff; copy link is the permalink');
ok(/if \(p\.has\('insight'\)\)/.test(page) && /openFeaturedCard\(_iid\)/.test(page) && /const rt = _FI_RECORD\.tiles\.find\(t => t\.id === id\);/.test(page) && /_openDoorRead\(\{ id, title: '', frame: null \}\); return; \}   \/\/ SEAM:RECORD_SCROLL: a permalink's id/.test(page),
  'F7 a permalink opens the reading on any night');
ok(/A reading is deployed when a subject is new on the board or moved past the threshold since its last reading, at most six a night, as few as none\./.test(page) && !/update every|every other day|on a schedule\. /.test(between(page, 'function _renderScroll(', 'function _renderLakeGrid(')), 'F8 the page says the law in plain words');

// ── G: the fallback obeys the laws ──────────────────────────────────────────────────────────────────────────────────────────────
ok(/insights=\[\];\n    ideas=\[\];\n    brief='';\n    window\._readFailed=\{ q, items:\(items\|\|\[\]\)\.length \};/.test(page) && /if\(synthd\) window\._readFailed=null;/.test(page), 'G1 when the writer did not finish, nothing gathered becomes a finding');
ok(/if\(mode!=='live'\)\{   \/\/ SEAM:EXC_FALLBACK/.test(page) && /The reading did not finish in this pass\./.test(page) && /Nothing gathered is shown as a finding: the house prints only what its writer stood behind\./.test(page) && /onclick="_rfFull\(\)">Run the full read<\/button>/.test(page) && /const bar=document\.getElementById\('results-lens-bar'\); if\(bar\) bar\.style\.display='none';/.test(page) && /document\.querySelectorAll\('\.results-lens-panel'\)\.forEach\(x=>\{ x\.style\.display='none'; \}\);/.test(page),
  'G2 the fallback says so in the house\'s words, offers the full read and hides the lens tabs and panels');
ok(/function _rfFull\(\)\{ if\(window\._readFailed&&window\._readFailed\.q\)\{ window\._liveLast=Object\.assign\(\{\},window\._liveLast\|\|\{\},\{q:window\._readFailed\.q\}\); \} goDeeper\(\); \}/.test(page), 'G3 the full read runs on the same question through goDeeper');
ok(/  return \[\];   \/\/ SEAM:EXC_FALLBACK: no move is invented from a lens name/.test(page) && /function _buildLensIdeas\(q, cat\) \{/.test(page), 'G4 the templated lens moves are never returned');
ok(/else if \(window\._liveLast && window\._liveLast\.synthesis && Array\.isArray\(window\._liveLast\.synthesis\.insights\) && window\._liveLast\.synthesis\.insights\.length\) \{   \/\/ SEAM:EXC_FALLBACK/.test(page) && /bodyHTML = _buildReadPDF\(window\._liveLast\.q, window\._liveLast\.synthesis, dateStr, timeStr\);/.test(page) && /showToast\('The reading did not finish; there is nothing to download yet\. Run the full read\.'\);\n    return;/.test(page) && /\} else if \(false\) \{/.test(page),
  'G5 the download is built from the read the writer stood behind, or refused; the lens template is never printed');
const pdf = between(page, 'function _buildReadPDF(q, syn, dateStr, timeStr){', 'function _buildResultsPDF(dateStr,timeStr){');
ok(/THE READ \\u00b7/.test(pdf) && /What this read does not see/.test(pdf) && /What the read stood on/.test(pdf) && /Every figure above was checked against the evidence it cites or the lake's own counts\./.test(pdf) && !/—|Verify all statistics|5-LENS/.test(pdf), 'G6 the downloadable read: the two lines, the interpretation, findings, moves, the blind spots, the sources; no dash, no lens template');
ok(/const EXC_BLIND_LINE='This read does not see TikTok, Instagram or X\. Its voices come from YouTube and Mastodon; its news from the open web and the lake\.';/.test(page) && /<div class="read-thin voices-blind">/.test(page), 'G7 the blind-spots line sits under the voices and on the fallback');
ok(!/—/.test(between(w, 'const DOOR_LAW = ', 'function excDoorPrompt(') + called + rec + share + house) && !/—/.test(between(page, 'let _FI_RECORD = null', 'function _renderLakeGrid(') + pdf), 'H1 no em dash in the new code');
console.log('\nproof_excavate_record: ' + pass + ' checks PASS');
