/**
 * proof_ears.mjs  --  EX31 THE EARS: SEAM:RAIL_BLUESKY, SEAM:RAIL_REDDIT, SEAM:RAIL_SHORTS, SEAM:EXC_LANGUAGE, SEAM:EXC_AHEAD, SEAM:EXC_DISAGREE,
 * SEAM:EXC_LOOK, SEAM:CROSS_CURRENTS. The engine hears more, in the frame's language, knows what is ahead, says where it disagrees, sees
 * the look, and names the currents. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the helpers, pure ────────────────────────────────────────────────────────────────────────────────────────────────────────
const H = new Function(between(w, 'function excLang(ctx)', 'const LOOK = {') + '; return { excLang, excGdeltLang, calendarAhead, excBlindLine, CULTURAL_CALENDAR, AHEAD };')();
ok(H.excLang({ frame: { language: 'es' } }) === 'es' && H.excLang({ frame: { language: 'xx1' } }) === 'en' && H.excLang(null) === 'en' && H.excGdeltLang({ frame: { language: 'es' } }) === 'spanish' && H.excGdeltLang({}) === 'english', 'A1 the language is a two-letter code from the frame, en otherwise; GDELT gets its own name for it');
const ahead = H.calendarAhead({ entity: 'Jordan Brand', category: 'athletic footwear', anchors: ['jordan', 'sneakers', 'retro'] }, 'q', Date.UTC(2026, 9, 9));
ok(ahead.length === 3 && ahead[0].name === 'NBA season opens' && ahead[0].days === 12 && ahead[0].date === '2026-10-21' && ahead.every(m => m.days >= 0 && m.days <= H.AHEAD.DAYS), 'A2 on Oct 9 a Jordan frame is heading into the NBA season in twelve days, soonest first, inside sixty days');
ok(H.calendarAhead({ category: 'hair care', anchors: ['curl', 'shampoo'] }, 'q', Date.UTC(2026, 9, 9)).length === 0 && H.calendarAhead(null, 'super bowl snacks', Date.UTC(2027, 0, 20))[0].name === 'Super Bowl Sunday', 'A3 a frame nothing touches gets nothing; a bare query can meet a moment; the year rolls over');
ok(H.CULTURAL_CALENDAR.length >= 30 && H.CULTURAL_CALENDAR.every(m => /^\d\d-\d\d$/.test(m.md) && m.tags.length >= 3) && !/—/.test(JSON.stringify(H.CULTURAL_CALENDAR)), 'A4 the calendar holds thirty or more moments, each dated and tagged, no dash');
ok(/Mastodon and Bluesky; its news/.test(H.excBlindLine({})) && /Bluesky and Reddit; its news/.test(H.excBlindLine({ REDDIT_CLIENT_ID: 'a', REDDIT_CLIENT_SECRET: 'b' })) && /does not see TikTok, Instagram or X/.test(H.excBlindLine({})), 'A5 the blind-spots line names the voices the engine has, Reddit only when its keys are set');

// ── B: the rails ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const rails = between(w, 'const RAILS = [', 'const RAIL_BY_ID');
ok(/\{ id: 'reddit',        name: 'Reddit',                 tier: 3, kind: 'discourse', classes: \['brand','talent','category','behavior'\], cap: 300 \}/.test(rails) && /id: 'bluesky'/.test(rails) && /id: 'youtube_shorts'/.test(rails) && /id: 'consensus',     name: 'Trend reports \(consensus\)', tier: 3, kind: 'consensus'/.test(rails) && /id: 'calendar',      name: 'Cultural calendar',      tier: 2, kind: 'ahead'/.test(rails),
  'B1 Reddit, Bluesky, Shorts, the consensus and the calendar are rails with classes and caps');
const bsky = between(w, '  async bluesky(env, q, ctx, rail) {', '  async reddit(env, q, ctx, rail) {');
ok(/public\.api\.bsky\.app\/xrpc\/app\.bsky\.feed\.searchPosts/.test(bsky) && /voiceAdd\(ctx, 'Bluesky', src\)/.test(bsky) && /on_frame: voiceOnFrame\(text, frame\), share: share \|\| null/.test(bsky) && !/handle|author\.handle/.test(bsky), 'B2 Bluesky asks the public search, adds its voices under the laws, and never keeps a handle');
const rd = between(w, '  async reddit(env, q, ctx, rail) {', '  async youtube_shorts(');
ok(/if \(!env\.REDDIT_CLIENT_ID \|\| !env\.REDDIT_CLIENT_SECRET\) \{ if \(ctx && ctx\.meta\) ctx\.meta\.reddit_off = true; return \[\]; \}/.test(rd) && /www\.reddit\.com\/api\/v1\/access_token/.test(rd) && /grant_type=client_credentials/.test(rd) && /'User-Agent': ua/.test(rd) && /oauth\.reddit\.com\/search/.test(rd) && /expirationTtl: 3000/.test(rd) && /!d\.over_18/.test(rd),
  'B3 Reddit is silent without keys and says so; OAuth client credentials, the required User-Agent, the token kept fifty minutes, adult posts out');
ok(/async youtube_shorts\(env, q, ctx, rail\) \{ return RAIL_FNS\.youtube\(env, q, Object\.assign\(\{\}, ctx \|\| \{\}, \{ shorts: true \}\), rail\); \}/.test(w) && /\(ctx && ctx\.shorts \? '&videoDuration=short' : ''\)/.test(w), 'B4 Shorts is the YouTube rail with short videos only, on the same quota');
ok(/relevanceLanguage=' \+ \(typeof excLang === 'function' \? excLang\(ctx\) : 'en'\)/.test(w) && (w.match(/sourcelang:' \+ \(typeof excGdeltLang === 'function' \? excGdeltLang\(ctx\) : 'english'\)/g) || []).length === 2, 'B5 YouTube and GDELT ask in the frame\'s language');
const cons = between(w, '  async consensus(env, q, ctx, rail) {', '  async calendar(');
ok(/RAIL_FNS\.exa\(env, String\(subject\)\.slice\(0, 80\) \+ ' trend report '/.test(cons) && /title: 'CONSENSUS: '/.test(cons) && /stance: 'consensus', kind: 'consensus'/.test(cons), 'B6 the consensus rail is one Exa search for trend reports, every line marked CONSENSUS');
const cal = between(w, '  async calendar(env, q, ctx, rail) {', '};');
ok(/calendarAhead\(f, q, Date\.now\(\)\)/.test(cal) && /title: 'AHEAD ' \+ m\.date \+ ': ' \+ m\.name, kind: 'ahead'/.test(cal) && /never invent what it will bring/.test(cal), 'B7 the calendar rail rides AHEAD lines with the law not to invent what the moment brings');

// ── C: the read ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
ok(/const langOk = t => \(frame0 && frame0\.language && frame0\.language !== 'en'\) \? true : looksEnglish\(t\);/.test(synth) && (synth.match(/langOk\(/g) || []).length === 3 && !/looksEnglish\(a\.title/.test(synth), 'C1 the English filter stands down for a read in another language, at every door of the read');
ok(/"language":"the two-letter language the question\\'s people speak/.test(w) && /language: \/\^\[a-z\]\{2\}\$\/\.test\(String\(f\.language \|\| ''\)\) \? String\(f\.language\) : 'en',   \/\/ SEAM:EXC_LANGUAGE/.test(w), 'C2 the framer names the language and the clean keeps a two-letter code');
ok(/const EXC_DISAGREE_LAW = 'WHERE THE HOUSE DISAGREES: lines whose title begins CONSENSUS are what published trend reports and outlooks claim, never evidence of what people do\./.test(w) && /states the stronger reading as a plain sentence under the HEADLINE LAW/.test(w) && /it carries "stance":"counter"/.test(w) && /const hasConsensus = merged\.some\(c => c && c\.stance === 'consensus'\);/.test(synth) && /depthLaw \+ thinLaw \+ disagreeLaw \+ aheadLaw \+ clientLaw, prompt: usr,/.test(synth) && /Never adopt a consensus claim as a finding and never cite a CONSENSUS line as evidence for a figure\./.test(w),
  'C3 when consensus lines ride the evidence the writer reads the disagree law; a consensus claim is never a finding or a source');
ok(/const aheadLaw = aheadLines \? ' AHEAD: lines marked AHEAD are known moments coming inside sixty days; a move may anchor to one by name and date; never invent what the moment will bring\. ' : '';/.test(synth) && /ahead: aheadLines \? merged\.filter\(c => c && c\.kind === 'ahead'\)\.slice\(0, 3\)/.test(synth), 'C4 AHEAD lines bring their law and the payload names the moments');
const look = between(w, 'const LOOK = {', 'function envelope(rail, o) {');
ok(/MODEL: '@cf\/llava-hf\/llava-1\.5-7b-hf'/.test(look) && /MAX: 3, MS: 6000, BYTES: 1500000/.test(look) && /env\.AI\.run\(LOOK\.MODEL, \{ image: Array\.from\(new Uint8Array\(buf\)\), prompt: LOOK\.PROMPT, max_tokens: 60 \}\)/.test(look) && /if \(buf\.byteLength > LOOK\.BYTES\) return null;/.test(look) && /Promise\.race\(\[Promise\.all\(urls\.map\(one\)\), new Promise\(res => setTimeout\(\(\) => res\(\[\]\), LOOK\.MS\)\)\]\)/.test(look),
  'C5 the look runs vision over at most three small images inside six seconds');
ok(/\(quick \|\| body\.bench \|\| body\.look === false \|\| typeof excLook !== 'function'\) \? Promise\.resolve\(null\) : excLook\(env, merged, frame0\)/.test(synth) && /look: look \|\| null,   \/\/ SEAM:EXC_LOOK/.test(synth), 'C6 the look runs on a full read only, beside the facts and the measures, never for quick reads or the bench');
ok(/'excLook': 'Workers AI vision over at most LOOK\.MAX images/.test(gate) && /'crossCurrentsPass': 'claudeGate on the doc tier \(Fable\)/.test(gate), 'C7 the look and the currents are registered spenders');

// ── D: the currents and the record ──────────────────────────────────────────────────────────────────────────────────────────────
const cur = between(w, 'const CURRENTS = {', '/* ═══ SEAM:CLIENT_PROFILE');
ok(/NIGHTS: 14, MAX_TOKENS: 2500, TIMEOUT_MS: 90000, WEEKDAY: 0/.test(cur) && /callClaude\(env, 'doc', \{ system: CURRENTS_SYS/.test(cur) && /if \(rows\.length < 4\) return \{ skipped: 'thin', rows: rows\.length \};/.test(cur) && /\.filter\(c => c\.title && c\.body && c\.subjects\.length >= 2\)/.test(cur) && /filter\(x => labels\.has\(x\)\)/.test(cur),
  'D1 the currents pass reads a fortnight on Fable, needs four readings, keeps a current only through two or more real subjects');
ok(/async function crossCurrentsWeekly\(env\) \{ return new Date\(\)\.getUTCDay\(\) === CURRENTS\.WEEKDAY \? crossCurrentsPass\(env\) : \{ skipped: 'not_the_day' \}; \}/.test(w) && /\.then\(\(\) => crossCurrentsWeekly\(env\)\)   \/\/ SEAM:CROSS_CURRENTS/.test(w) && /which === 'currents' \? await crossCurrentsPass\(env\)/.test(w) && !/'currents'/.test(between(w, 'const DESK_ROLES = {', 'async function callerRole(')),
  'D2 the currents run on Sundays in the nightly chain and from the admin desk; an editor cannot run them');
ok(/for \(const t of tiles\) t\.ahead = calendarAhead\(t\.frame, t\.title, Date\.now\(\)\);/.test(w) && /const set = \{ built_at: new Date\(\)\.toISOString\(\), tiles, positions, currents,/.test(w), 'D3 the record carries each tile\'s moments ahead and the currents');

// ── E: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/rows\.push\(\['the look',data\.look\.lines\.map\(l=>n\(l\.line\)\)\.join\(' '\)\]\);/.test(page) && /rows\.push\(\['ahead',data\.ahead\.map\(n\)\.join\('; '\)\]\);/.test(page) && /rows\.push\(\['reddit','asked, not configured'\]\);/.test(page) && /look:syn&&syn\.look\|\|null, ahead:syn&&syn\.ahead\|\|null, client_lines:syn&&syn\.client_lines\|\|0\}/.test(page),
  'E1 the receipt carries the look, what is ahead and whether Reddit was configured');
ok(/btn\('ahead', null, 'Ahead', aheadN\)/.test(page) && /if \(L\.kind === 'ahead'\) return tiles\.filter\(t => Array\.isArray\(t\.ahead\) && t\.ahead\.length\);/.test(page) && /class="rec-ahead">ahead: \$\{safe\(t\.ahead\[0\]\.name\)\} in \$\{safe\(String\(t\.ahead\[0\]\.days\)\)\} days/.test(page), 'E2 the Ahead lens and the moment on a tile\'s dateline');
ok(/function _renderCurrents\(cur\)/.test(page) && /_renderCurrents\(rec\.currents\);   \/\/ SEAM:CROSS_CURRENTS/.test(page) && /CROSS-CURRENTS/.test(page) && /\.rec-cur-grid\{display:grid/.test(page), 'E3 the cross-currents render above the scroll');
ok(!/—/.test(bsky + rd + cons + cal + look + cur + between(page, 'function _renderCurrents(cur)', 'function _renderScroll(')), 'F1 no em dash in the new code');
console.log('\nproof_ears: ' + pass + ' checks PASS');
