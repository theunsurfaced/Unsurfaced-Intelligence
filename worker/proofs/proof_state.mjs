/**
 * proof_state.mjs  --  EX36a THE ASK AND THE STRIP: SEAM:ENGINE_STATE.
 * The engine's night as counted numbers, public; the page's ask as one band that follows the reader; the strip that remembers the visitor.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the state on fakes ───────────────────────────────────────────────────────────────────────────────────────────
const src = between(w, 'const STATE = {', 'async function excavateStateRoute(');
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const tiles = [
  { id: 'a', deployed: '2026-10-11', frame: { entity: 'Jordan Brand' }, measures: { territory: 'sneakers-streetwear', recent_7d: 12, prior_7d: 4, velocity_pct: 200 }, watch: { by: '2026-11-07' }, called: null },
  { id: 'b', deployed: '2026-10-10', frame: { entity: 'New Balance' }, measures: { territory: 'sneakers-streetwear', recent_7d: 3, prior_7d: 6, velocity_pct: -50 }, watch: { by: '2026-11-01' }, called: { verdict: 'held' } },
  { id: 'c', deployed: '2026-10-11', frame: { entity: 'Spotify' }, measures: { territory: 'music', recent_7d: 1, prior_7d: 0, velocity_pct: 100 }, watch: { by: '2026-11-07' }, called: { verdict: 'unmeasured' } },
];
const rows = [].concat(Array.from({ length: 30 }, () => ({ territory: 'sneakers-streetwear', created_at: iso(now - 2 * 86400000) })), Array.from({ length: 10 }, () => ({ territory: 'sneakers-streetwear', created_at: iso(now - 10 * 86400000) })), Array.from({ length: 5 }, () => ({ territory: 'music', created_at: iso(now - 9 * 86400000) })), [{ territory: 'nowhere', created_at: iso(now) }]);
const counts = { 'signals?created_at=gte.': null };
const kv = {}; const KV = { get: async k => kv[k] == null ? null : kv[k], put: async (k, v) => { kv[k] = v; } };
const S = new Function('sbRest', 'excQuiet', 'doorRecord', 'TERRITORY_SLUGS', 'fetch', 'json', src + '; return { excavateState, sbCount, stateOf, STATE };')(
  async (env, path) => { if (/event=eq\.door_pass/.test(path)) return [{ created_at: iso(now - 3600000), meta: { night: '2026-10-11', candidates: 30, kept: 4, queued: 6, thin: 1, failed: 0 } }]; if (/event=eq\.door_called/.test(path)) return [{ created_at: iso(now - 3500000), meta: { checked: 2, held: 1, missed: 1, unmeasured: 0 } }]; if (/^signals\?created_at=gte/.test(path)) return rows; return []; },
  () => () => null, async () => ({ tiles, counts: { deployments: 3, held: 1, missed: 0, subjects: 3 } }), ['sneakers-streetwear', 'music', 'fashion-beauty'],
  async (url) => { const m = /signals\?([^&]*)/.exec(url); const q = m ? m[1] : ''; const total = /lt\./.test(url) ? 1530 : /gte\./.test(url) ? 1840 : 120273; return { ok: true, status: 206, headers: { get: h => h === 'content-range' ? '0-0/' + total : null } }; },
  (o) => o);
const st = await S.excavateState({ RATE_LIMIT: KV });
ok(st.signals.week === 1840 && st.signals.prior === 1530 && st.signals.lake === 120273, 'A1 the week, the prior week and the lake are exact counts from the database');
ok(st.pass.kept === 4 && st.pass.deployed === 2 && st.called.held === 1 && st.called.missed === 1, 'A2 the last pass and the last grade ride with what they counted; deployed is the record\'s own count for that night');
ok(st.record.open === 2 && st.record.deployments === 3, 'A3 open bets are readings with a watch and no held or missed verdict (unmeasured stays open)');
const sn = st.territories.find(t => t.territory === 'sneakers-streetwear'), mu = st.territories.find(t => t.territory === 'music'), fb = st.territories.find(t => t.territory === 'fashion-beauty');
ok(st.territories.length === 3 && st.territories[0].territory === 'sneakers-streetwear' && sn.recent_7d === 30 && sn.prior_7d === 10 && sn.velocity_pct === 200 && sn.state === 'spike', 'A4 every territory of the house is counted, 7 days against the prior 7, ordered by movement; a row from nowhere is dropped');
ok(mu.recent_7d === 0 && mu.prior_7d === 5 && mu.state === 'quiet' && fb.state === 'quiet' && fb.readings === 0, 'A5 a territory with nothing this week is quiet, with or without a prior week');
ok(sn.movers.loud.name === 'Jordan Brand' && sn.movers.loud.n === 12 && sn.movers.fast.name === 'Jordan Brand' && sn.movers.cool.name === 'New Balance' && sn.readings === 2, 'A6 the movers are the record\'s subjects in the territory: most covered, fastest rise, sharpest fall');
ok(JSON.parse(kv['state:v1']).signals.week === 1840 && (await S.excavateState({ RATE_LIMIT: KV })).at === st.at, 'A7 the state is kept in KV and served from it');
ok(S.stateOf(10, 4) === 'spike' && S.stateOf(6, 4) === 'rising' && S.stateOf(4, 4) === 'steady' && S.stateOf(2, 4) === 'falling' && S.stateOf(0, 4) === 'quiet' && S.stateOf(3, 0) === 'spike', 'A8 the five states from the two counts');
ok(/if \(path === '\/excavate\/state' && request\.method === 'GET'\) return excavateStateRoute\(env, origin\);/.test(w) && w.indexOf("path === '/excavate/state'") < w.indexOf('// Everything below requires a signed-in user'), 'A9 the route is public, before the signed-in block');

// ── B: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/<section class="hero ask" id="hero-ask">/.test(page) && /#sec-explore \.hero\.ask\{grid-template-columns:1fr/.test(page) && /#sec-explore \.hero\.ask \.week\{display:grid;grid-template-columns:5fr 7fr/.test(page) && /el\.style\.display = ''; window\._weekReady = true;/.test(page), 'B1 the hero is the ask, one band, with the week\'s read laid out under it by the stylesheet');
const i = page.indexOf('id="hero-ask"'), j = page.indexOf('id="engine-now"'), k = page.indexOf('id="ask-sticky"'), m = page.indexOf('id="board-block"');
ok(i > 0 && j > i && k > j && m > k, 'B2 the order: the ask, the strip, the sticky ask, then the record');
ok(/id="en-week"/.test(page) && /id="en-dep"/.test(page) && /id="en-open"/.test(page) && /id="en-held"/.test(page) && /id="en-missed"/.test(page) && /id="en-lake"/.test(page) && /id="en-since"/.test(page) && /id="en-pass"/.test(page) && /onclick="_recLensSet\('watching'\); _navRecord\(\)"/.test(page) && /title="Signals the lake captured in the last seven days, counted by the database"/.test(page),
  'B3 the strip: the week\'s captures, readings, open bets, graded, the lake, since-you-were-here, the pass line; every number says what it counted; open bets open the Watching lens');
ok(/const _EN_SEEN = 'uai_engine_seen';/.test(page) && /localStorage\.getItem\(_EN_SEEN\)/.test(page) && /localStorage\.setItem\(_EN_SEEN, JSON\.stringify\(now\)\)/.test(page) && /'Since you were here: ' \+ parts\.join\(', '\)/.test(page) && /'Your first look'/.test(page) && !/access\/|fetch\([^)]*uai_engine_seen/.test(between(page, 'const _EN_SEEN', 'function _countUp(')),
  'B4 the page remembers the visitor in this browser only and says what changed since; nothing of it is sent');
ok(/b\.setAttribute\('data-from', String\(from \? \(from\[id\.replace\('en-', ''\)\] \|\| 0\) : 0\)\)/.test(page) && /new IntersectionObserver\(es => \{ if \(es\.some\(x => x\.isIntersecting\)\) \{ io\.disconnect\(\); go\(\); \} \}, \{ threshold: 0\.2 \}\)/.test(page) && /toLocaleString\('en-US'\); if \(k < 1\) requestAnimationFrame\(step\);/.test(page) && /prefers-reduced-motion: reduce\)'\)\.matches\) \{ el\.textContent = Number\(to\)\.toLocaleString\('en-US'\); return; \}/.test(page),
  'B5 the numbers count from the last look to now when the strip comes into view, with their separators; reduced motion simply shows them');
ok(/function _askFocus\(\)/.test(page) && /if \(e\.key !== '\/' \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey\) return;/.test(page) && /tag === 'INPUT' \|\| tag === 'TEXTAREA' \|\| tag === 'SELECT'/.test(page) && /bar\.style\.display = seen \? 'none' : '';/.test(page) && /\.ask-sticky\{position:sticky;top:60px;/.test(page),
  'B6 `/` focuses the ask from anywhere but a field; the slim ask sticks under the nav once the hero\'s ask has scrolled away');
ok(/_stateLoad\(\);   \/\/ SEAM:ENGINE_STATE \(EX36a\)/.test(page) && /@media \(max-width:760px\)\{\.en-grid\{grid-template-columns:1fr 1fr\}/.test(page), 'B7 the strip loads with the front page and stacks two across on a phone');
const stripCopy = between(page, '<section class="engine-now"', '<div class="error-banner"').replace(/<!--[\s\S]*?-->/g, '').replace(/title="[^"]*"/g, '').replace(/<[^>]+>/g, ' ');
ok(!/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(stripCopy) && /captured this week/.test(stripCopy) && /kept in all/.test(stripCopy), 'B8 the strip speaks in the arrival\'s words: captured, kept, readings, bets; no machinery word in its visible copy');
console.log('proof_state: ' + pass + ' checks passed');
