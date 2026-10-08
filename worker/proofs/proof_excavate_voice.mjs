/**
 * proof_excavate_voice.mjs  --  EX15 THE DOOR: EXCAVATE's arrival as the room, in the house's voice.
 * Run from the repo root: node worker/proofs/proof_excavate_voice.mjs
 *   L the laws in the prompts   T the tile: question and photograph   X the feed's voices and record   P the page   M the Method
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const phelper = (name, next) => page.slice(page.indexOf('function ' + name + '('), page.indexOf(next, page.indexOf('function ' + name + '(')));

// ── L ─────────────────────────────────────────────────────────────────
const doorPrompt = helper('excDoorPrompt', '// The compiled text becomes a read');
ok(/one plain sentence, at most 30 words, stating what people are doing/.test(doorPrompt) && /never a count of coverage as the finding/.test(doorPrompt) && /no slogan, no X-not-Y/.test(doorPrompt) && /"question":"the question this read answers for the professional it serves/.test(doorPrompt),
  'L1 the door prompt writes line 1 under the headline law and returns the question the reading answers');
ok(/this week\\'s read: exactly 2 sentences, under 44 words total\. The first is a plain statement about people/.test(w) && /never a count of coverage; /.test(w) && /no slogan, no X-not-Y, no colon openers, no em dashes/.test(w),
  'L2 the week\'s read is written under the same law');
ok(/question: parsed && typeof parsed\.question === 'string' \? parsed\.question/.test(w), 'L3 the question rides on the stored door read');

// ── T ─────────────────────────────────────────────────────────────────
const photoSrc = helper('doorPhoto', '/* SEAM:EXC_DOOR_VOICE: what the door says');
const doorPhoto = new Function(photoSrc + '; return doorPhoto;')();
ok(doorPhoto({ insights: [{ image: 'https://z/d.jpg', source: 'Unsurfaced Lake · Highsnobiety (T2)' }] }, []).credit === 'Highsnobiety' && doorPhoto({ insights: [] }, [{ image: 'https://z/e.jpg', source: 'Unsurfaced Lake · signal (T?)' }]).credit === 'signal', 'T1b a photograph is credited to the outlet by name; the lake label and the tier never reach a reader');
ok(doorPhoto({ insights: [{ image: 'http://x/a.jpg', source: 'A' }, { image: 'https://x/b.jpg', source: 'Hypebeast' }] }, []).src === 'https://x/b.jpg' && doorPhoto({ insights: [] }, [{ image: 'https://y/c.jpg', source_name: 'Vogue' }]).credit === 'Vogue' && doorPhoto({ insights: [{ image: 'data:image/png;base64,xx' }] }, []) === null && doorPhoto(null, null) === null,
  'T1 the tile\'s photograph is the first https image a cited insight or an evidence line carries, credited to its outlet; http, data and nothing else');
ok(/question: \(rd && rd\.question\) \|\| f\.question \|\| null,/.test(w) && /photo: doorPhoto\(rd, r\.evidence\),/.test(w), 'T2 the tile carries the question (the read\'s, else the frame\'s) and the photograph');

// ── X ─────────────────────────────────────────────────────────────────
// SEAM:VOICE_LAW, SEAM:READ_TIME: the extras read voices through the voice helpers and the time bands
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));
const bandSrc = w.slice(w.indexOf('function readBandOf('), w.indexOf('/* PURE: the date on a voice line'));
const extrasSrc = voiceSrc + bandSrc + w.slice(w.indexOf('const DOOR_VOICES = {'), w.indexOf('/* The voices alone, for the tiles standing now')) + w.slice(w.indexOf('const DOOR_EXTRAS = {'), w.indexOf('async function doorPublish('));
let calls = [];
const sbRest = async (env, path) => { calls.push(path);
  if (path.startsWith('house_reads?kind=eq.report&')) return [{ id: 14, kind: 'report', label: 'Issue 001', meta: { pack: { voices: { quotes: [{ text: 'the quiet one says little', source: 'youtube', likes: 3 }, { text: 'the loud one says a lot', source: 'mastodon', likes: 90, when: '2026-09-30T10:00:00Z', self: { generation: 'Gen Z' } }, { text: 'the loud one says a lot', source: 'youtube', likes: 5 },
    { text: 'an old voice from years before the period', source: 'youtube', likes: 4000, when: '2014-04-16', band: 'earlier' }, { text: 'The law will not save us | Jonathan Liew theguardian.com/commentisfree/2026/aug/31/x', source: 'mastodon', likes: 500 }] } } } }];
  if (/house_reads\?kind=[^&]*recon/.test(path)) return [{ id: 18, kind: 'recon', label: 'RECON 001: a client topic', meta: { pack: { voices: { quotes: [{ text: 'a quote from a client brief', likes: 9999 }] } } } }];
  if (path.startsWith('cluster_calls?')) return [{ cluster_id: 'c1', state: 'EMERGING', called_at: '2026-09-14T00:00:00Z', resolved_at: '2026-09-28T00:00:00Z', outcome: 'converted' }, { cluster_id: 'c2', state: 'EMERGING', called_at: '2026-09-07T00:00:00Z', resolved_at: '2026-09-28T00:00:00Z', outcome: 'faded' }, { cluster_id: 'c3', state: 'ACCELERATING', called_at: '2026-09-28T00:00:00Z', resolved_at: null, outcome: null }, { cluster_id: 'c9', state: 'EMERGING', called_at: '2026-09-20T00:00:00Z', resolved_at: null, outcome: null }];
  return []; };
let kv = {}; const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
const X = new Function('sbRest', 'excQuiet', 'RAIL_FNS', 'RAIL_BY_ID', 'memoryRecord', extrasSrc + '; return { doorExtras, DOOR_EXTRAS, doorBand, DOOR_VOICES };')(sbRest, () => () => null, {}, {}, async () => ({ counts: { held: 2, faded: 1, open: 3, unmeasured: 0 }, held: [{ title: 'Presales clear first' }], faded: [], open: [] }));
const door = { tiles: [
  { label: 'Smart glasses', voices: [{ text: 'I wear mine every day at work', likes: 40, when: '2026-10-01', self: { role: 'nurse' } }, { text: 'the battery dies by lunch', likes: 12, when: '2026-10-02', self: null }] },
  { label: 'Curl care', voices: [{ text: 'my 4c hair finally has a shelf', likes: 70, when: '2026-09-29', self: { generation: 'Gen Z', trait: '4c hair' } }] },
  { label: 'No voices yet', voices: [] }] };
const ex = await X.doorExtras(env, [{ cluster_id: 'c1', title: 'Presales clear first' }, { cluster_id: 'c2', title: 'Ad fatigue cancels' }, { cluster_id: 'c3', title: 'Proximity pricing spreads' }], door);
ok(ex.voices.map(v => v.text).join('|') === 'I wear mine every day at work|my 4c hair finally has a shelf|the battery dies by lunch|the loud one says a lot|the quiet one says little'
   && ex.voices[0].on === 'Smart glasses' && ex.voices[1].on === 'Curl care' && ex.voices[3].on === null && ex.voices[3].self.generation === 'Gen Z' && ex.voices[3].when === '2026-09-30',
  'X1 the band quotes the board\'s own subjects one at a time, each naming the subject it speaks to, then the monthly report\'s most liked; deduplicated by text; a shared headline and a voice from before the period never reach the arrival');
ok(!calls.some(c => /recon/.test(c)) && !ex.voices.some(v => /client brief/.test(v.text)) && ex.voices.every(v => Object.keys(v).sort().join(',') === 'likes,on,self,text,when'),
  'X1b never a RECON: the band never asks for one, and a quote carries only its words, likes, date, what the speaker said about themselves and its subject; no platform, no handle, no link, no read\'s name');
ok(ex.record.counts.held === 2 && ex.record.held[0].title === 'Presales clear first' && !calls.some(c => /^cluster_calls\?/.test(c)) && /try \{ out\.record = await memoryRecord\(env\); \}/.test(extrasSrc),
  'X2 record: the calls graded on their own weekly stories (SEAM:MEMORY), never the scoreboard\'s board-presence outcomes');
calls = []; const again = await X.doorExtras(env, [], null);
ok(calls.length === 0 && again.voices.length === 5 && X.DOOR_EXTRAS.TTL === 3600 && X.DOOR_EXTRAS.KEY === 'door:extras:v4', 'X3 the extras are cached an hour in KV under a new key (v3 graded calls on the board; v2 held RECON quotes): the second call reads nothing from the database');
ok(/const extras = await doorExtras\(env, out\.proposed, door\);/.test(w) && /voices: extras\.voices, record: extras\.record \}/.test(w), 'X4 the public feed carries voices and record, the board\'s tiles passed in');
const many = { tiles: Array.from({ length: 5 }, (_, i) => ({ label: 'S' + i, voices: Array.from({ length: 6 }, (_, j) => ({ text: 'v' + i + '-' + j + ' long enough', likes: 10 - j })) })) };
const band = X.doorBand(many.tiles, []);
ok(band.length === X.DOOR_VOICES.BAND && band.slice(0, 5).map(v => v.on).join(',') === 'S0,S1,S2,S3,S4' && band[5].on === 'S0', 'X5 twelve quotes at most, one subject at a time, so no subject fills the band');

// ── P ─────────────────────────────────────────────────────────────────
const arrival = page.slice(page.indexOf('<section class="hero">'), page.indexOf('<!-- RESULTS PANEL -->'));
ok(/<h1 class="hero-title">Ask culture a question\.<\/h1>/.test(arrival) && /EXCAVATE is the cultural intelligence engine behind Unsurfaced\./.test(arrival) && /placeholder="Ask culture a question: a brand, a category, the people, or the question itself"/.test(arrival) && /onclick="runSearch\(\)">Search<\/button>/.test(arrival),
  'P1 the arrival opens with the headline, the plain sub and the search under it');
ok(/setSearch\('smart glasses, who buys and who refuses'\)/.test(arrival) && /setSearch\('luxury in Lagos'\)/.test(arrival) && !/Gen Z purchase behavior trends/.test(arrival), 'P2 the examples are questions a person would type');
ok(/id="week-block"/.test(arrival) && /id="week-movers"/.test(arrival) && /id="board-block"/.test(arrival) && /id="voices-block"/.test(arrival) && /id="record-block"/.test(arrival) && /<section class="partners">/.test(arrival) && /id="featured-insights-grid"/.test(arrival) && /id="fi-state-strip"/.test(arrival),
  'P3 the five movements mount in order and the engine\'s mount points keep their ids');
const visible = arrival.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
ok(!/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(visible) && !/Featured Insights|Trending Now|THE READ · FROM THE LAKE/.test(arrival), 'P4 no machinery word in the arrival\'s visible copy; the old headers are gone');
ok(/function _renderWeek\(data\)/.test(page) && /function _renderDoorVoices\(voices\)/.test(page) && /function _renderRecord\(record\)/.test(page) && /function _pulse\(series\)/.test(page) && /function _drawPulses\(\)/.test(page) && /function _countUp\(el, from, to, ms\)/.test(page) && /_renderWeek\(data\); _renderDoorVoices\(data\.voices\); _renderRecord\(data\.record\);/.test(page),
  'P5 the week, the voices and the record render on every feed; the pulses draw once and the movers count');
// the hybrid board: the movers lead as cards, the rest follow as rows; the first screen carries the invitation and the week's read
const orderSrc = page.slice(page.indexOf('function _doorLeads()'), page.indexOf('function _renderDoorRow(t)'));
const leadsOf = n => new Function('getComputedStyle', 'document', orderSrc + '; return { _doorOrder, _moveSize, _doorLeads };')(() => ({ getPropertyValue: () => ' ' + n }), { documentElement: {} });
const OO = leadsOf(2), O = OO._doorOrder;
const tl = (id, v, cov, photo, prior) => ({ id, photo: photo ? { src: 'https://x/' + id } : null, measures: { velocity_pct: v, recent_7d: cov, prior_7d: prior == null ? Math.max(cov, 9) : prior } });
const ord = O([tl('a', 51, 68, true), tl('b', 163, 50, true), tl('c', -17, 45, false), tl('d', -51, 33, true), tl('e', -6, 31, false)]);
ok(ord.leads.map(t => t.id).join(',') === 'b,a' && ord.rest.map(t => t.id).join(',') === 'c,d,e', 'P11 the two subjects that moved most lead (the most covered breaks a tie), photographs preferred; the rest keep the board\'s order as rows');
const ord2 = O([tl('a', 5, 10, false), tl('b', 50, 20, false)]);
ok(ord2.leads.length === 2 && ord2.leads[0].id === 'b', 'P11b with no photographs the movers still lead');
// the coverage floor: a move counts only when the side that defines it carries five stories or more
ok(OO._moveSize({ measures: { velocity_pct: -100, recent_7d: 0, prior_7d: 1 } }) === 0 && OO._moveSize({ measures: { velocity_pct: 100, recent_7d: 2, prior_7d: 1 } }) === 0 && OO._moveSize({ measures: { velocity_pct: -51, recent_7d: 33, prior_7d: 67 } }) === 51 && OO._moveSize({ measures: { velocity_pct: 163, recent_7d: 50, prior_7d: 19 } }) === 163,
  'P15 one story falling to none is no move; a fall from 67 to 33 and a rise from 19 to 50 are');
const ord3 = O([tl('z', -100, 0, true, 1), tl('a', 51, 68, true, 45), tl('b', -17, 45, true, 54)]);
ok(ord3.leads.map(t => t.id).join(',') === 'a,b' && ord3.quiet[0].id === 'z', 'P15b the subject with one story never leads the board on its hundred percent fall');
ok(/const moved = withM\.filter\(t => t\.measures\.velocity_pct != null && _moveSize\(t\) > 0\);/.test(page), 'P15c the week\'s movers sit above the same floor: no sharpest fall from one story to none');
// the room is one centered page that scales with the canvas; the stepped knob resolves in every browser (the trig formula did not)
ok(/--k:1;--room-w:calc\(1240px\*var\(--k\)\);--room-g:40px;--leads:2\}/.test(page) && /@media \(min-width:1680px\)\{:root\{--k:1\.15\}\}/.test(page) && /@media \(min-width:2360px\)\{:root\{--k:1\.5\}\}/.test(page) && /@media \(min-width:3300px\)\{:root\{--k:1\.75\}\}/.test(page) && !/tan\(atan2/.test(page),
  'P16 the room is 1240px at 1440 and scales by steps to 1.75 on a wide canvas; no formula a browser may not resolve');
ok(/#sec-explore \.hero\{display:grid;grid-template-columns:1fr 1fr;gap:calc\(56px\*var\(--k\)\);align-items:center;padding:calc\(48px\*var\(--k\)\) var\(--room-g\) calc\(44px\*var\(--k\)\);max-width:var\(--room-w\);margin:0 auto\}/.test(page) && /#main-dashboard\{max-width:var\(--room-w\);margin:0 auto;gap:0;padding:0 var\(--room-g\) calc\(40px\*var\(--k\)\)\}/.test(page) && !/max-width:1240px/.test(page) && !/nav\{padding:0 var\(--room-g\)\}/.test(page),
  'P16b the hero and the board share one centered room; the nav keeps its own gutter');
ok(/#featured-insights-grid\.insights-grid\{grid-template-columns:repeat\(var\(--leads\),minmax\(0,1fr\)\)!important/.test(page) && leadsOf(4)._doorLeads() === 4 && leadsOf('')._doorLeads() === 2 && leadsOf(9)._doorLeads() === 2 && !/window\._doorLast/.test(page),
  'P16c the board reads its lead count from the stylesheet; no resize machinery');
// quiet subjects and the patterns beneath the board speak the room's language
const Q = leadsOf(2);
const ordQ = Q._doorOrder([tl('z', -100, 0, true, 1), tl('a', 51, 68, true, 45), tl('b', -17, 45, false, 54), { id: 'y', measures: { velocity_pct: 0, recent_7d: 0, prior_7d: 0 } }]);
ok(ordQ.leads.map(t => t.id).join(',') === 'a,b' && ordQ.rest.length === 0 && ordQ.quiet.map(t => t.id).join(',') === 'z,y', 'P17 a subject with no stories this week is quiet: never a lead, never a row of zeros, named at the end');
ok(/function _renderQuietRow\(t\)/.test(page) && /class="row quiet"/.test(page) && /<span>No stories this week<\/span>/.test(page) && /weeks on record<\/span>/.test(page) && /Quiet this week<\/div>' \+ order\.quiet\.map\(t => _renderQuietRow\(t\)\)/.test(page),
  'P17b the quiet list is one line per subject under its own divider');
const lakeRow = phelper('_renderLakeRow', 'function _renderDoorRow(');
ok(/function _renderLakeRow\(c\)/.test(page) && /Also moving, not yet read<\/div>' \+ rest\.map\(c => _renderLakeRow\(c\)\)/.test(page) && !/_renderLakeCard\(c, tiles\.length \+ i\)/.test(page) && /<i>Not yet read<\/i>/.test(lakeRow) && /Answers<\/i>\$\{safe\(c\.subtitle\)\}/.test(lakeRow) && /c\.line \|\| c\.hook \|\| c\.deck \|\| c\.title/.test(lakeRow) && !/card-cat|fi-state-tag|card-title|text-transform:uppercase/.test(lakeRow),
  'P17c the patterns not yet read are rows in the room\'s language: the one-line read, the question, the counts in words; no serif title, no lens badge, no uppercase');
ok(/list\.classList\.toggle\('nothumbs', !order\.rest\.some\(hasPhoto\) && !rest\.some\(c => c\.image\)\);/.test(page) && /#board-list\.nothumbs \.row\{grid-template-columns:minmax\(0,1\.2fr\) calc\(360px\*var\(--k\)\) minmax\(0,1fr\)\}/.test(page) && /#board-list\.nothumbs \.row \.photo\.empty\{display:none\}/.test(page),
  'P17d when no row has a photograph the thumbnail column leaves instead of standing as a column of empty squares');
ok(/<section class="hub-block room-sec room-voices" id="voices-block"/.test(page) && /\.room-voices \.track\{display:flex/.test(page) && !/\.voices \.track\{/.test(page) && !/behind the house's recent readings/.test(page),
  'P16e the voices block owns its own class (the reading page owns .voices) and its line names no house');
ok(/function _renderDoorRow\(t\)/.test(page) && /<figure class="photo empty" aria-hidden="true"><\/figure>/.test(page) && /id="board-list"/.test(page) && /list\.innerHTML = order\.rest\.map\(t => _renderDoorRow\(t\)\)/.test(page) && /\.pos \.figures,\.row \.figures\{[^}]*grid-template-columns:1fr 1fr/.test(page),
  'P12 the rows carry a square thumbnail or an honest empty square; the figures sit in a two-by-two grid on cards and rows');
ok(/<section class="hero">\s*<div class="hero-left">/.test(page) && /<section class="week nophoto" id="week-block"[^]*?<\/section>\s*<\/section>/.test(page) && /#sec-explore \.hero\{display:grid;grid-template-columns:1fr 1fr/.test(page) && /@media \(max-width:1000px\)\{#sec-explore \.hero\{grid-template-columns:1fr/.test(page) && /function _dashShow\(on\)/.test(page) && (page.match(/_dashShow\(/g) || []).length >= 6,
  'P13 the first screen carries the invitation and the week\'s read side by side, stacking under 1000px; the week leaves and returns with the board');
ok(/filter:saturate\(\.78\) sepia\(\.08\) contrast\(1\.02\)/.test(page) && /#main-dashboard \.builder-panel\{display:none\}/.test(page) && /--room-fg3:#8A8478/.test(page) && /-webkit-line-clamp:1/.test(page),
  'P14 photographs share one grade and come to full color under the hand; the builder is off the arrival; the quiet gray is a step lighter; the question is one line on the board');
const card = phelper('_renderDoorCard', 'function _renderDoorGrid(');
ok(/class="pos\$\{photo \? '' : ' nophoto'\}"/.test(card) && /<figure class="photo"><img src="\$\{safeAttr\(t\.photo\.src\)\}"/.test(card) && /Answers<\/i>\$\{safe\(t\.question\)\}/.test(card) && /Recommended move<\/i>/.test(card) && /Open the reading/.test(card) && !/card-cat|fi-state-tag|LAKE SIGNALS|compiled overnight/.test(card),
  'P6 a position carries the photograph, the claim, what it answers, the pulse, the figures, the move; no lens badge, no machinery');
const row = phelper('_doorMeasureRow', 'function _pulse(');
ok(/stories this week/.test(row) && /on last week/.test(row) && /of \$\{safe\(String\(m\.weeks \|\| 12\)\)\} weeks/.test(row) && /stories since the last reading/.test(row) && !/this wk|wks|signals/.test(row), 'P7 the figures say their unit in words');
const strip = phelper('_renderStateStrip', 'function _renderLakeCard(');
ok(/if \(!n\) continue;/.test(strip) && /k\.charAt\(0\) \+ k\.slice\(1\)\.toLowerCase\(\)/.test(strip) && />All<span class="fi-chip-n">/.test(strip), 'P8 a filter with nothing in it is not shown; words in sentence case');
ok(/<style id="arrival-room">/.test(page) && /body::before\{display:none\}/.test(page) && /#sec-explore h1\.hero-title\{font-family:'Syne'/.test(page) && /nav \.nav-menu \.nlb\{font-family:'Space Mono'/.test(page) && /@media \(prefers-reduced-motion:reduce\)\{\.room-voices \.track\{animation:none\}/.test(page),
  'P9 the room\'s styles: Syne for words, the grid paper gone, the nav in the house\'s type, reduced motion honored');
ok(!/style="color:var\(--deep2\)">◆ Spaces/.test(page) && /#nav-spaces::first-letter\{color:var\(--room-red\)\}/.test(page), 'P10 the nav\'s diamond is the house red, not purple');

// ── M ─────────────────────────────────────────────────────────────────
ok(/^Version 4\.\d, the house style\./m.test(method) && /12\. \*\*The question law\.\*\* Every read is the answer to a question a professional brought to culture, for the people they serve\./.test(method) && /we do not sell reference\./.test(method) && !/the house does not/.test(method) && w.includes(JSON.stringify(method).slice(1, -1).slice(0, 400)),
  'M1 Method 4 (the house style) carries the question law in our own voice, and the worker carries the exact text');

console.log('\nproof_excavate_voice: ' + pass + ' checks PASS');
