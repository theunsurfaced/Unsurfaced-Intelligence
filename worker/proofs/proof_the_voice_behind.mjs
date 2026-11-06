/**
 * proof_the_voice_behind.mjs  --  VX3 THE VOICE BEHIND: SEAM:THE_VOICE_BEHIND. The voice where the writer used it. The night's writer
 * cites the people's lines a finding stands on; the compile keeps the citations; the deep dive shows the cited comment under the
 * finding's read and the reading's own voices in its voices section; a reading from before the citations shows the comment that speaks
 * to the finding's own words. The band groups by subject: the claim at the head, the voices under it, Open the reading, All N voices.
 * Run from the repo root: node worker/proofs/proof_the_voice_behind.mjs
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8'), w = fs.readFileSync('worker/src/index.js', 'utf-8'), seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const DASH = /[—–]/;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── A: the writer and the compile ─────────────────────────────────────────────────────────────────────────────────────────────
const P = new Function('excFrameBlock', 'excMeasureLine', 'DOOR_LAW', between(w, 'function excDoorPrompt(frame, evidence, measures, memory, night) {', '// The compiled text becomes') + '; return excDoorPrompt;')(f => 'F', m => '', { WATCH_MIN_D: 14, WATCH_MAX_D: 45 });
const prompt = P({ entity: 'Costco' }, 'E', null, '', '2026-11-04');
ok(/"evidence":\[1-based numbers of the lines it stands on\],"people":\[the P numbers of the PEOPLE lines it stands on, most important first, else an empty list\]\}\]/.test(prompt) && prompt.indexOf('"people":[') > prompt.indexOf('"insights":[') && prompt.indexOf('"people":[') < prompt.indexOf('"pushback":'),
  'A1 a finding cites the people\'s lines it stands on, beside the evidence lines, in the night\'s own shape');
const measureSrc = between(w, 'function excMeasureLine(m) {', '/* PURE: the lines of a compiled reading that name the measure') + between(w, 'function excMeasureClaims(read) {', '\n}\n') + '\n}\n';
const groundSrc = between(w, 'const EXC_MONTH = ', 'function excGround(') + between(w, 'function excGround(text, evidence) {', '/* SEAM:EXC_FRAME: a query is turned');
const compileSrc = between(w, 'function excLensParts(parsed, merged, pool, read, names) {', '/* SEAM:TERRITORIES (EX39)');
const C = new Function('excBand', 'excWhen', 'excEarned', 'excTier', 'excClip', 'excShort', 'doorWatchOf', 'excWindow', 'DOOR_LAW',
  measureSrc + groundSrc + compileSrc + '; return { doorCompileRead };')(
  () => 'NOW', c => (c && c.published_at ? new Date(c.published_at) : null), () => 'Medium', () => 2, (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n), v => String(v || ''), x => (x && x.claim ? { claim: x.claim } : null), () => ({}), { PEOPLE: 8 });
const lines = [{ title: 'a', text: 'line one', source: 'WWD', url: 'https://w.example/a', published_at: '2026-10-30' }];
const r = C.doorCompileRead({ read: ['h', 'd'], insights: [{ category: 'brand', title: 'one', fact: 'f', read: 'r', evidence: [1], people: [2, '2', 1, 9, 0, 'x', 3, 4] }, { category: 'consumer', title: 'two', fact: 'f', evidence: [1] }, { category: 'market', title: 'three', fact: 'f', evidence: [1], people: 'P1' }], ideas: [], brief: '' }, lines, {}, null, '2026-11-04');
ok(r.insights[0].people.join() === '2,1,3' && r.insights[1].people.length === 0 && r.insights[2].people.length === 0,
  'A2 the compile keeps a finding\'s citations: numbers inside the people\'s block (1 to 8), each once, three at most; none when the writer cited none or wrote them wrong');
const L = new Function('DOOR_LAW', 'voiceBarred', between(w, 'function doorPeople(meta) {', '// PURE: how far a subject moved') + '; return { doorPeople, doorPeopleBlock };')({ PEOPLE: 8 }, t => /slur/.test(t));
const meta = { voices: [{ text: 'first voice', likes: 3, self: { generation: 'Gen Z' } }, { text: '' }, null, { text: 'a slur here', likes: 99 }, { text: 'second voice', likes: 0 }].concat(Array.from({ length: 9 }, (_, i) => ({ text: 'v' + i, likes: i }))) };
const people = L.doorPeople(meta), block = L.doorPeopleBlock(meta.voices);
ok(people.length === 8 && people[0].text === 'first voice' && people[0].self.generation === 'Gen Z' && people[1].text === 'second voice' && people[1].likes === 0 && people[1].self === null && /\nP1 "first voice" \(Gen Z, 3 likes\)\nP2 "second voice" \(a consumer\)\nP3 "v0"/.test(block) && L.doorPeople(meta.voices).length === 8 && L.doorPeople(null).length === 0,
  'A3 doorPeople: the people\'s lines in the writer\'s order (P1 first, the ones with words, a barred one left out, eight at most), the same list the prompt numbers; from a row\'s meta or the voices themselves');

// ── B: where the citations travel ─────────────────────────────────────────────────────────────────────────────────────────────
ok(/voices: Array\.isArray\(rd\.people\) \? rd\.people : \(typeof doorPeople === 'function' \? doorPeople\(r\.meta\) : \[\]\),/.test(between(w, 'async function doorReadRoute(request, env, origin) {', 'async function excavateFeed(')) && /read\.people = doorPeople\(row\.meta\);   \/\/ SEAM:THE_VOICE_BEHIND \(VX3\): the people's lines as the writer numbered them, kept with the read/.test(between(w, 'async function doorLand(', 'async function recordPassAllowed(')) && /read\.people = doorPeople\(row\.meta\);   \/\/ SEAM:THE_VOICE_BEHIND \(VX3\)/.test(between(w, 'async function recordPassLand(', 'async function recordPassAfter(')) && /if \(typeof doorPeople === 'function'\) read\.people = doorPeople\(row\.meta\);/.test(between(w, 'async function spaceLand(', 'async function spaceFail(')),
  'B1 the people the writer saw are kept with the read when it lands (the night, the pass, a space), and the deep dive reads that list first, so a reused night\'s new voices never shift the numbers under a finding');
ok(/findings: \(c\.insights \|\| \[\]\)\.map\(x => \(\{ title: x\.title, fact: x\.excerpt, read: x\.implication \|\| null, people: x\.people \|\| \[\] \}\)\)/.test(w), 'B2 the dry run shows each finding\'s citations');
const PG = new Function('doorPeople', between(w, 'function recordPassPage(rows, held) {', '\n}\n') + '\n}; return recordPassPage;')(m => (m && m.voices) || []);
const html = PG([{ night: '2026-11-04', frame: { entity: 'Costco' }, id: 'x', read: { read: ['old', 'd'], insights: [{ title: 'o', excerpt: 'e' }] }, meta: { voices: [{ text: 'the <card> pays', likes: 1 }, { text: 'second' }], pass_read: { read: ['new', 'd'], insights: [{ title: 'n', excerpt: 'e', implication: 'i', people: [1, 2] }, { title: 'm', excerpt: 'e', people: [9] }] } } }, { night: '2026-11-03', frame: {}, id: 'y', read: { read: ['o', 'd'], insights: [] }, meta: { voices: [{ text: 'tonight' }], pass_read: { read: ['n', 'd'], people: [{ text: 'as the writer saw it' }], insights: [{ title: 'k', excerpt: 'e', people: [1] }] } } }]);
ok(/<span class="pv">P1 “the &lt;card&gt; pays”<\/span><br><span class="pv">P2 “second”<\/span>/.test(html) && (html.match(/class="pv"/g) || []).length === 3 && /P1 “as the writer saw it”/.test(html) && !/tonight/.test(html) && /\.pv\{color:#d8d2c6/.test(html),
  'B3 the record pass preview shows the cited comments under a finding, escaped, from the list the read kept when it has one; a citation past the list shows nothing');

// ── C: the page ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/checks: ins\.checks\|\|null, people: Array\.isArray\(ins\.people\)\?ins\.people:\[\],/.test(page) && /voices:syn&&Array\.isArray\(syn\.voices\)\?syn\.voices:null,/.test(page) && /window\._lastVoices=Array\.isArray\(data\.voices\)\?data\.voices:null; window\._voiceUsed=new Map\(\);/.test(page) && /if\(window\._lastVoices&&typeof _voiceKey==='function'\) \(data\.insights\|\|\[\]\)\.forEach\(ins=>\{ const c=/.test(page) && /function _renderResultsV2\(q, lenses, truth, mode\) \{\n  window\._lastVoices=null; window\._voiceUsed=new Map\(\);/.test(page),
  'C1 a finding keeps its citations on the page; the reading\'s voices ride the live render and are kept, P1 first; every citation is reserved before a card draws, so a guess never takes a cited voice; the fallback render carries no voices from the reading before it');
ok(/meta: Array\.isArray\(j\.data\.voices\) && j\.data\.voices\.length \? \{ voices: _voicesRail\(j\.data\.voices\) \} : \{\}/.test(between(page, 'async function _openDoorRead(t) {', 'async function _profileGet(')) && /\$\{_meaningBlock\(ins\)\}\$\{_voiceBehind\(ins\)\}/.test(page),
  'C2 a night\'s reading opens with its own voices in the voices section; the finding\'s card carries the voice behind it, after its read');
const vb = between(page, 'function _voicesRail(vs){', 'function _meaningBlock(ins){');
const win = { _lastVoices: null, _voiceUsed: new Map() };
const F = new Function('window', 'safe', '_vxWho', vb + '; return { _voicesRail, _voiceWords, _voiceMatch, _voiceBehind };')(win, esc, v => (v.self && v.self.generation ? v.self.generation : 'Consumer') + (v.likes ? ', ' + v.likes + ' likes' : ''));
const rail = F._voicesRail([{ text: 'a comment', likes: 2, self: { role: 'nurse' } }, { text: '' }, null]);
ok(rail.quotes.length === 1 && rail.quotes[0].text === 'a comment' && rail.quotes[0].src === 'vx' && rail.quotes[0].on_frame === true && rail.quotes[0].self.role === 'nurse' && rail.sources[0].id === 'vx' && rail.sources[0].source === 'Quoted as written',
  'C3 the reading\'s voices take the shape the voices section already reads (quotes and one source, Quoted as written), the ones with words');
const voices = [{ text: 'I switched from the Prime card to Costco for the gas alone', likes: 12, self: { generation: 'Gen X' } }, { text: 'the sneakers are comfortable and I wear them daily', likes: 3 }, { text: 'Members treat the Costco card like a savings account now', likes: 40 }];
win._lastVoices = voices; win._voiceUsed = new Map();
const cited = F._voiceBehind({ title: 'Members paid more and kept buying', excerpt: 'Renewals held at 92%.', people: [3, 1] });
ok(/<blockquote class="card-voice"><span class="card-voice-k">In their words<\/span><p>“Members treat the Costco card like a savings account now”<\/p><cite>Consumer, 40 likes<\/cite><\/blockquote>/.test(cited) && win._voiceUsed.has(2),
  'C4 a cited finding shows the first comment the writer cited, as written, who said it and the likes; the voice is marked shown');
const matched = F._voiceBehind({ title: 'Members switch cards for the gas', excerpt: 'Members switched from the Prime card to Costco for the gas, two outlets report.', implication: null, people: [] });
ok(/“I switched from the Prime card to Costco for the gas alone”/.test(matched) && /Gen X, 12 likes/.test(matched) && win._voiceUsed.has(0),
  'C5 a finding from before the citations shows the comment that speaks to its own words: three content words shared, the best one');
const none = F._voiceBehind({ title: 'Tour dates sold out in the skipped cities', excerpt: 'Three new dates went in a morning.', people: [] });
const again = F._voiceBehind({ title: 'Another finding', excerpt: 'x', people: [3] }), same = F._voiceBehind({ title: 'Members paid more and kept buying', excerpt: 'Renewals held at 92%.', people: [3, 1] });
ok(none === '' && again === '' && /savings account now/.test(same) && F._voiceMatch({ title: 'short', excerpt: 'x' }, voices) === -1 && (win._lastVoices = null, F._voiceBehind({ title: 'a', people: [1] }) === ''),
  'C6 nothing when no comment speaks to the finding; a voice stands under one finding (a second finding citing it gets nothing; the same finding drawn again keeps it); a finding too short to match shows nothing; a reading without voices shows nothing');
ok(/\.card-voice\{margin:10px 0 0;padding:10px 12px;border-left:2px solid var\(--accent\)/.test(page) && /\.card-voice-k\{/.test(page) && !DASH.test(vb) && !F._voiceWords("they're don't that's").size && F._voiceWords('comfort matters').has('comfort'), 'C7 the voice\'s style; a contraction is not a content word; no em dash');

// ── D: the band ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const bandSrc = between(page, 'function _renderDoorVoices(voices) {', '\n}\n') + '\n}\n';
ok(/const groups = \[\], gBy = new Map\(\);/.test(bandSrc) && /g\.n\+\+; if \(g\.voices\.length < 3\) g\.voices\.push\(v\);/.test(bandSrc) && /<figure class="vx-group\$\{g\.yours \? ' vx-yours' : ''\}"><div class="vx-g-head">/.test(bandSrc) && /onclick="_vxRoomOpen\(\$\{safeAttr\(JSON\.stringify\(String\(g\.on\)\)\)\}\)">All \$\{g\.n\} voices<\/button>/.test(bandSrc) && !/<figure class="quote/.test(bandSrc),
  'D1 the band is groups: one a subject in the pool\'s order, the claim at the head, three voices, Open the reading, All N voices past three; no lone quotes');
ok(/function _vxRoomOpen\(on\) \{/.test(page) && /_vx\.room = \{ q: '', on: typeof on === 'string' \? on : '', who: '', order: 'liked' \};/.test(page) && /onclick="_vxRoomOpen\(\)">All voices<\/button>/.test(page) && /if \(R\.on && !subjects\.includes\(R\.on\)\) subjects\.unshift\(R\.on\);/.test(page),
  'D2 the room opens on a subject from its group (its chip shown however few its voices), and on everything from the band\'s own button');
const css = page;
ok(/#sec-explore \.room-voices \.track>\.vx-group\{flex:0 0 calc\(\(100% - 28px\)\/3\);scroll-snap-align:start;/.test(css) && /#sec-explore \.vx-group \.vx-g-claim\{margin:0;font-family:'Syne'/.test(css) && /#sec-explore \.room-voices \.track>\.vx-group\{flex-basis:86%\}/.test(css) && /#sec-explore \.vx-group\.vx-yours \.q-on::before\{content:''/.test(css) && /#sec-explore \.vx-group \.vx-g-head \.q-on\{margin:0;font-family:'Space Mono',monospace;[^}]*color:var\(--room-red\)\}/.test(css) && /@media \(max-width:1000px\)\{#sec-explore \.room-voices \.track>\.vx-group\{flex:0 0 calc\(\(100% - 14px\)\/2\)\}\}/.test(css),
  'D3 three groups a screen, two on a tablet, one on a phone; the subject in the house mono and red; the claim set in the house face; the reader\'s own group marked');
ok(!DASH.test(bandSrc) && !/\bAhni\b/i.test(page + w), 'D4 no em dash in the band\'s code');

// ── E: the seam ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/comment\$\{all\.length===1\?'':'s'\} on \$\{safe\(String\(\(v\.sources\|\|\[\]\)\.length\)\)\} source\$\{\(v\.sources\|\|\[\]\)\.length===1\?'':'s'\}/.test(page.replace(/\\/g, '')) && /label:'on the subject',key:'frame'/.test(page) && /' · off the subject'/.test(page) && !/naming the frame|' on the frame'|off the frame|not read through a frame|names the frame/.test(page) && /\(v\.sources\|\|\[\]\)\.map\(s=>s\.url\?`<a href=/.test(page),
  'E0 the voices section, now under every night\'s reading too: the subject, never the engine\'s word; one source is one source; a source without an address is a name, not a link');
ok(seams.registry['SEAM:THE_VOICE_BEHIND'] && seams.registry['SEAM:THE_VOICE_BEHIND'].file === 'worker/src/index.js' && seams.registry['SEAM:THE_VOICE_BEHIND@intelligence'] && seams.registry['SEAM:THE_VOICE_BEHIND@intelligence'].tag === 'SEAM:THE_VOICE_BEHIND' && /SEAM:THE_VOICE_BEHIND/.test(w) && /SEAM:THE_VOICE_BEHIND/.test(page),
  'E1 the seam is registered for the worker and the page');
console.log(`\nproof_the_voice_behind: ${pass} checks PASS`);
