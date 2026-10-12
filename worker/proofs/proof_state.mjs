/**
 * proof_state.mjs  --  EX36a THE ASK: SEAM:ENGINE_STATE (the territories, nothing about the engine), SEAM:ASK_FOLLOWS, SEAM:QUIET_ENGINE.
 * The public route serves intelligence about the world and no count of the engine's work; the ask follows the reader; the record says the score.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the territories on fakes ─────────────────────────────────────────────────────────────────────────────────────
const src = between(w, 'const STATE = {', 'async function excavateStateRoute(');
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const tiles = [
  { id: 'a', deployed: '2026-10-11', frame: { entity: 'Jordan Brand' }, measures: { territory: 'sneakers-streetwear', recent_7d: 12, prior_7d: 4, velocity_pct: 200 } },
  { id: 'b', deployed: '2026-10-10', frame: { entity: 'New Balance' }, measures: { territory: 'sneakers-streetwear', recent_7d: 3, prior_7d: 6, velocity_pct: -50 } },
  { id: 'c', deployed: '2026-10-11', frame: { entity: 'Spotify' }, measures: { territory: 'music', recent_7d: 1, prior_7d: 0, velocity_pct: 100 } },
];
const rows = [].concat(Array.from({ length: 30 }, () => ({ territory: 'sneakers-streetwear', created_at: iso(now - 2 * 86400000) })), Array.from({ length: 10 }, () => ({ territory: 'sneakers-streetwear', created_at: iso(now - 10 * 86400000) })), Array.from({ length: 5 }, () => ({ territory: 'music', created_at: iso(now - 9 * 86400000) })), [{ territory: 'nowhere', created_at: iso(now) }]);
const kv = {}; const KV = { get: async k => kv[k] == null ? null : kv[k], put: async (k, v) => { kv[k] = v; } };
const S = new Function('sbRest', 'excQuiet', 'doorRecord', 'TERRITORY_SLUGS', 'json', 'DAILY_POV', 'INDUSTRY_NAMES', src + '; return { excavateState, stateOf, STATE };')(
  async (env, path) => /^signals\?created_at=gte/.test(path) ? rows : [], () => () => null, async () => ({ tiles }), ['sneakers-streetwear', 'music', 'fashion-beauty'], (o) => o, { sources: [{ name: 'A', tier: 1, territories: ['sneakers-streetwear'] }, { name: 'B', tier: 2, territories: ['sneakers-streetwear', 'music'] }] }, { 'sneakers-streetwear': 'Sneakers and streetwear', music: 'Music' });
const st = await S.excavateState({ RATE_LIMIT: KV });
const sn = st.territories.find(t => t.territory === 'sneakers-streetwear'), mu = st.territories.find(t => t.territory === 'music'), fb = st.territories.find(t => t.territory === 'fashion-beauty');
ok(Object.keys(st).sort().join() === 'at,territories' && st.territories.every(x => Object.keys(x).sort().join() === 'movers,name,readings,state,territory,velocity_pct') && sn.name === 'Sneakers and streetwear', 'A1 the route serves the territories and the time, nothing else: no capture counts, no pass, no lake, no record totals, no sources (EX39: each named)');
ok(st.territories.length === 3 && st.territories[0].territory === 'sneakers-streetwear' && sn.velocity_pct === 200 && sn.state === 'spike' && sn.readings === 2, 'A2 every territory of the house, ordered by movement; the change on last week as a percentage and a state; a row from nowhere is dropped');
ok(mu.state === 'quiet' && mu.readings === 1 && fb.state === 'quiet' && fb.readings === 0, 'A3 a territory with nothing this week is quiet');
ok(sn.movers.loud.name === 'Jordan Brand' && sn.movers.loud.n === 12 && sn.movers.fast.name === 'Jordan Brand' && sn.movers.cool.name === 'New Balance', 'A4 the movers are the record\'s subjects in the territory: most covered, fastest rise, sharpest fall');
ok(JSON.parse(kv['state:v4']).territories.length === 3 && (await S.excavateState({ RATE_LIMIT: KV })).at === st.at, 'A5 kept in KV and served from it');
ok(S.stateOf(10, 4) === 'spike' && S.stateOf(6, 4) === 'rising' && S.stateOf(4, 4) === 'steady' && S.stateOf(2, 4) === 'falling' && S.stateOf(0, 4) === 'quiet' && S.stateOf(3, 0) === 'spike', 'A6 the five states from the two counts');
ok(/if \(path === '\/excavate\/state' && request\.method === 'GET'\) return excavateStateRoute\(env, origin\);/.test(w) && w.indexOf("path === '/excavate/state'") < w.indexOf('// Everything below requires a signed-in user') && !/sbCount/.test(w), 'A7 the route is public, before the signed-in block; no exact-count helper remains');

// ── B: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/<section class="hero">\s*<div class="hero-left">/.test(page) && !/hero-pulse|engine-now|_stateLoad|ENGINE_STATE/.test(page), 'B1 the hero keeps its two columns with the week\'s read on the right; no strip, no pulse, no count of the engine\'s work on the page');
ok(/<div class="ask-sticky" id="ask-sticky" style="display:none">/.test(page) && page.indexOf('id="ask-sticky"') < page.indexOf('id="board-block"') && /function _askFocus\(\)/.test(page) && /if \(e\.key !== '\/' \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey\) return;/.test(page) && /tag === 'INPUT' \|\| tag === 'TEXTAREA' \|\| tag === 'SELECT'/.test(page) && /bar\.style\.display = seen \? 'none' : '';/.test(page) && /\.ask-sticky\{position:sticky;top:60px;/.test(page),
  'B2 the ask follows the reader: the slim bar sticks under the nav once the hero\'s ask has scrolled away; `/` focuses the ask from anywhere but a field');
ok(/SEAM:QUIET_ENGINE \(EX36a\): the score, never the machinery/.test(page) && !/readings deployed<\/span>/.test(page) && !/<b>Calibration<\/b>/.test(page) && /<\/b> being checked<\/span>/.test(page), 'B3 the record\'s line carries the score (held, missed, being checked) and no count of readings or subjects, no calibration');
ok(/What the house has read, dated and kept\. A later reading develops an earlier one; both stand\./.test(page) && !/What the engine deployed/.test(page) && !/at most six a night, as few as none/.test(page) && /more\.innerHTML = safe\('Every reading carries one bet; the record grades it when its date comes, and a miss stays\.'\)/.test(page),
  'B4 the record\'s copy says what it is, not how it is made: no law, no cadence, no threshold');
ok(!/THE LAKE IS FILLING/.test(page) && /THE FIRST READINGS ARE ON THEIR WAY/.test(page) && !/what the lake has captured/.test(page), 'B5 the empty state names no lake');
ok(/body\{background:var\(--bg\);color:var\(--text\);font-family:'Syne',sans-serif;min-height:100vh;\}/.test(page) && /html\{overflow-x:hidden;\}/.test(page), 'B6 the body is not a scroll container (its overflow-x is gone; the html clips), so the nav and the slim ask can stick');
ok(/<div class="room-head rec-head">/.test(page) && between(page, '<div class="room-head rec-head">', '</form>').includes('id="board-h2"') && between(page, '<div class="room-head rec-head">', '</form>').includes('id="board-sub"') && between(page, '<div class="room-head rec-head">', '</form>').includes('id="ask-q"') && /<div class="rec-ask" id="rec-ask">/.test(page) && /\.room-head\.rec-head\{display:grid;grid-template-columns:auto minmax\(0,1fr\) minmax\(340px,40%\)/.test(page) && /\.rec-ask:has\(#ask-thread:empty\)\{display:none\}/.test(page),
  'B7 the record\'s head is one line: the name, the line and the ask; the thread opens under it and hides when empty');
console.log('proof_state: ' + pass + ' checks passed');
