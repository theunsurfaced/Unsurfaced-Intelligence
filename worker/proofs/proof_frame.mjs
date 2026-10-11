/**
 * proof_frame.mjs  --  EX35e THE FRAME: SEAM:CLIENT_FRAME.
 * A reader's frame is brands, industries, audiences, words and markets; the push matches all of them; the house learns from the reader's own
 * reads and offers it back; nothing learned crosses readers.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the clean ────────────────────────────────────────────────────────────────────────────────────────────────────
const P = new Function(between(w, 'const PROFILE = {', 'async function profileLoad(') + '; return { profileClean, FRAME, INDUSTRY_NAMES };')();
const c = P.profileClean({ industries: ['music', 'MUSIC', 'cars', 'fashion-beauty'], audiences: ['Gen Z', 'gen z ', 'x'], keywords: ['Retro', 'RETRO', 'drop culture'], markets: ['US', 'UK'] }, {});
ok(c.industries.join() === 'music,fashion-beauty' && c.audiences.join() === 'Gen Z' && c.keywords.join() === 'retro,drop culture' && c.markets.join() === 'US,UK', 'A1 industries are the house\'s own (lowercased, unknown ones dropped), words are lowercased, duplicates and short names go');
ok(P.profileClean({ industries: Object.keys(P.INDUSTRY_NAMES) }, {}).industries.length === P.FRAME.INDUSTRIES && Object.keys(P.INDUSTRY_NAMES).length === 14, 'A2 six industries at most; the fourteen territories all have names');

// ── B: the push matches the wider frame ─────────────────────────────────────────────────────────────────────────────
const M = new Function('ROLE_WORDS', 'esc', 'EXC_BLIND', between(w, 'const PUSH = {', 'async function pushWebhook(') + '; return { pushMatches };')({ other: 'x' }, s => String(s), 'B');
const prof = { tracked_brands: ['Jordan Brand'], follows: [], industries: ['sneakers-streetwear'], audiences: ['Gen Z'], keywords: ['retro', 'resale'], markets: ['UK'] };
ok(M.pushMatches({ frame: { entity: 'Nike' }, measures: { territory: 'sneakers-streetwear' } }, prof) === 'industry', 'B1 a reading in the reader\'s industry reaches them');
ok(M.pushMatches({ frame: { entity: 'Glossier', audience: 'gen z' } }, prof) === 'audience' && M.pushMatches({ frame: { entity: 'Tesco', market: 'uk' } }, prof) === 'market', 'B2 the reader\'s own audiences and markets match, any case');
ok(M.pushMatches({ frame: { entity: 'Adidas' }, claim: 'The resale floor fell under the retro drop', measures: { territory: 'music' } }, prof) === 'keyword' && M.pushMatches({ frame: { entity: 'Tesla', category: 'cars' }, claim: 'Nothing here' }, prof) === null, 'B3 a word of theirs in the claim matches; nothing else does');
ok(M.pushMatches({ frame: { entity: 'jordan brand' }, measures: { territory: 'music' } }, prof) === 'brand', 'B4 the brand still wins first');
ok(/const active = profs\.filter\(p => \(\(p\.tracked_brands \|\| \[\]\)\.length \|\| \(p\.follows \|\| \[\]\)\.length \|\| \(p\.industries \|\| \[\]\)\.length \|\| \(p\.audiences \|\| \[\]\)\.length \|\| \(p\.keywords \|\| \[\]\)\.length \|\| \(p\.markets \|\| \[\]\)\.length\) && \(p\.push_email !== false \|\| p\.slack_webhook \|\| p\.teams_webhook\)\);/.test(w), 'B5 a reader with any frame and a channel is active');

// ── C: the learning, on fakes ───────────────────────────────────────────────────────────────────────────────────────
const calls = [];
const L = new Function('sbRest', 'excQuiet', 'FRAME', 'PROFILE', between(w, 'async function profileLearn(', 'async function profileRoute(') + '; return { profileLearn, profileLearnAct };')(
  async (env, path) => { calls.push(path); return [{ meta: { entity: 'New Balance', audience: 'runners', market: 'US' } }, { meta: { entity: 'New Balance', audience: 'Gen Z' } }, { meta: { entity: 'Hoka', audience: 'runners' } }, { meta: { entity: 'Jordan Brand' } }, { meta: { entity: 'Jordan Brand' } }, { meta: { entity: 'Asics' } }]; },
  () => () => null, P.FRAME, { MAX_TRACKED: 12 });
const learned = await L.profileLearn({}, 'u1', { tracked_brands: ['Jordan Brand'], audiences: [], markets: [], follows: [], declined: [{ kind: 'brand', value: 'hoka' }] });
ok(/event=eq\.read_frame&session_id=eq\.u1&created_at=gte\./.test(calls[0]), 'C1 the house reads only this reader\'s own read_frame events, sixty days back');
ok(learned.length === 2 && learned[0].kind === 'brand' && learned[0].value === 'New Balance' && learned[0].n === 2 && learned[1].kind === 'audience' && learned[1].value === 'runners', 'C2 a name seen twice comes back; one on the frame, one declined, one seen once do not');
const act = L.profileLearnAct({ confirm: { kind: 'brand', value: 'New Balance' }, decline: { kind: 'audience', value: 'runners' } }, { tracked_brands: ['Jordan Brand'], declined: [] });
ok(act.tracked_brands.join() === 'Jordan Brand,New Balance' && act.declined.length === 1 && act.declined[0].value === 'runners', 'C3 confirm moves the chip onto the frame; decline keeps it off');
ok(/if \(body\._uid && !body\.bench && frame0\) logEvent\(env, 'intelligence', 'excavate', 'read_frame', body\._uid, \{ entity: frame0\.entity \|\| null, category: frame0\.category \|\| null, audience: frame0\.audience \|\| null, market: frame0\.market \|\| null, q: query\.slice\(0, 80\) \}\);/.test(w), 'C4 a signed-in live read leaves its frame behind under the reader\'s id; a bench read does not');
ok(/if \(request\.method === 'GET'\) \{ let learned = \[\]; try \{ learned = await profileLearn\(env, user\.id, prev\); \}/.test(w) && /Object\.assign\(profileClean\(body, prev\), profileLearnAct\(body, prev\),/.test(w) && /industries: p\.industries \|\| \[\], audiences: p\.audiences \|\| \[\], keywords: p\.keywords \|\| \[\], markets: p\.markets \|\| \[\], learned: p\.learned \|\| \[\], industries_all:/.test(w), 'C5 the route carries the learned chips out and takes confirm and decline in');
ok(fs.existsSync('supabase/migrations/0045_frame.sql') && /add column if not exists declined/.test(fs.readFileSync('supabase/migrations/0045_frame.sql', 'utf-8')), 'C6 migration 0045 adds the frame to client_profile, idempotent');

// ── D: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────
const room = between(page, 'async function _profileOpen() {', 'function _profileClose()');
ok(/Who are you watching\?/.test(room) && /What world do you work in\?/.test(room) && /What words would you want to see first on a Monday\?/.test(room) && /<details class="rm-more" id="rm-frame-more"\$\{first \? '' : ' open'\}><summary>More of your frame<\/summary>/.test(room), 'D1 three questions on the first entry; audiences, markets and the followed frames behind More');
ok(/id="pm-industries-pick"/.test(room) && /class="rm-pill\$\{\(prof\.industries \|\| \[\]\)\.includes\(x\.id\) \? ' on' : ''\}" data-id="\$\{safeAttr\(x\.id\)\}" onclick="_industryToggle\(this\)"/.test(room) && /Six industries is the most a frame holds/.test(page), 'D2 industries are picked from the house\'s list, six at most');
ok(/id="pm-keywords"/.test(room) && /id="pm-audiences"/.test(room) && /id="pm-markets"/.test(room) && /function _chipAdd\(hid, max\)/.test(page) && /industries: list\('pm-industries'\), keywords: list\('pm-keywords'\), audiences: list\('pm-audiences'\), markets: list\('pm-markets'\)/.test(page), 'D3 words, audiences and markets are chips; the save carries all five rows');
ok(/The house thinks you also watch/.test(room) && /class="pm-chip learned"/.test(room) && /async function _learnAct\(kind, value, act\)/.test(page) && /body\[act\] = \{ kind, value \};/.test(page), 'D4 the learned chips, kept or refused in one tap');
console.log('proof_frame: ' + pass + ' checks passed');
