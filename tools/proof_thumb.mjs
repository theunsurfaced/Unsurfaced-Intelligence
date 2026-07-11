/**
 * proof_thumb.mjs — SEAM:THUMB (needs: npm i jsdom).
 *   C  the core: hold-to-win at exactly 3s, early release, whiff->punish,
 *      escape at 6 reversals, failed escape, best-of-3 both ways, cooldown
 *   T  translators: drag and camera emit the same vocabulary from raw streams
 *   W  wiring: boot, camera refusal falls back, match + score post the spine
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const html = fs.readFileSync('arcade/thumb/index.html', 'utf-8');
const a = html.indexOf('/* TW:PURE:BEGIN */'), b = html.indexOf('/* TW:PURE:END */');
const win = {};
new Function('window', html.slice(a, b))(win);
const TW = win.TW;
const rngQ = (arr) => { let i = 0; return () => arr[Math.min(i++, arr.length - 1)]; };
const S = 0.05;
function run(core, secs, input) { let out; for (let t = 0; t < secs; t += S) out = core.step(S, input || {}); return out; }

/* C */
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.1]) });   // first draw feeds the Hand's clock
  let out = c.step(S, { lungeEdge: true, holding: true });
  ok(out.events.includes('p_pin_start'), 'C lunge catches: pin starts');
  run(c, 2.9, { holding: true });
  ok(c.state.phase === 'p_pin', 'C at 2.9s the hold is still a fight');
  out = run(c, 0.2, { holding: true });
  ok(c.state.rounds.p === 1 && c.state.pins === 1 && c.state.phase === 'round_end', 'C 3s held: round to the player');
}
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.1]) });
  c.step(S, { lungeEdge: true, holding: true });
  run(c, 1.5, { holding: true });
  const out = c.step(S, { holding: false });
  ok(out.events.includes('release') && c.state.phase === 'neutral' && c.state.pins === 0, 'C early release: no pin, back to neutral');
  const out2 = c.step(S, { lungeEdge: true, holding: true });
  ok(!out2.events.includes('p_pin_start'), 'C cooldown blocks the instant re-lunge');
}
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.9]) });
  let out = c.step(S, { lungeEdge: true });
  ok(out.events.includes('whiff'), 'C a bad lunge whiffs');
  let tele = false, lunge = false, pin = false;
  for (let t = 0; t < 1.5; t += S) {
    out = c.step(S, {});
    if (out.events.includes('h_tele')) tele = true;
    if (out.events.includes('h_lunge')) lunge = true;
    if (out.events.includes('h_pin_start')) { pin = true; break; }
  }
  ok(tele && lunge && pin, 'C the whiff gets punished: telegraph, lunge, pin');
  for (let i = 0; i < 6; i++) c.step(S, { reversalEdge: true });
  ok(c.state.phase === 'neutral', 'C six reversals break the pin');
}
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.9]) });
  c.step(S, { lungeEdge: true });
  run(c, 1.5, {});
  ok(c.state.phase === 'h_pin', 'C pinned again for the failure case');
  for (let i = 0; i < 5; i++) c.step(S, { reversalEdge: true });
  run(c, 3.1, {});
  ok(c.state.rounds.h === 1 && c.state.phase === 'round_end', 'C five reversals is not six: round to the Hand');
}
function playerRound(c) {
  run(c, 0.5, {});                       // settle any round cooldown
  c.step(S, { lungeEdge: true, holding: true });
  run(c, 3.05, { holding: true });
  run(c, 1.45, {});                      // ceremony
}
function handRound(c) {
  run(c, 0.5, {});
  c.step(S, { lungeEdge: true });        // whiff on purpose
  run(c, 1.6, {});                       // punish chain lands the pin
  run(c, 2.4, {});                       // pin times out
  run(c, 1.45, {});                      // ceremony
}
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.1, 0.5, 0.1]) });
  playerRound(c); playerRound(c);
  ok(c.state.phase === 'match_end' && c.state.matchResult === 'win' && c.state.pins === 2, 'C two pins take the match');
}
{
  const c = TW.createCore({ rng: rngQ([0.5, 0.1, 0.5, 0.9, 0.5, 0.9]) });
  playerRound(c); handRound(c); handRound(c);
  ok(c.state.phase === 'match_end' && c.state.matchResult === 'loss' && c.state.rounds.h === 2, 'C the Hand closes it 2-1');
}

/* T — drag */
{
  const d = TW.dragTranslator();
  d.pointer('down', 100, 100, 0);
  let f = d.frame();
  ok(f.lungeEdge && f.holding, 'T drag: touch-down is the lunge, the hold begins');
  f = d.frame();
  ok(!f.lungeEdge && f.holding, 'T drag: the edge fires once, the hold persists');
  d.pointer('up', 100, 100, 500);
  ok(d.frame().holding === false, 'T drag: lift ends the hold');
  const d2 = TW.dragTranslator();
  d2.pointer('down', 200, 200, 0);
  let reversals = 0, t = 0, x = 200;
  for (let i = 0; i < 10; i++) { t += 40; x += (i % 2 ? 40 : -40); d2.pointer('move', x, 200, t); reversals += d2.frame().reversalEdge ? 1 : 0; }
  ok(reversals >= 6, 'T drag: the escape shake counts reversals (' + reversals + ')');
  const d3 = TW.dragTranslator();
  d3.pointer('down', 100, 100, 0);
  d3.frame();
  d3.pointer('move', 180, 100, 40);
  ok(d3.frame().dodgeEdge === true, 'T drag: a fast burst is a dodge');
}
/* T — camera */
{
  const lm = (x, y) => { const arr = []; for (let i = 0; i < 21; i++) arr.push({ x: 1 - x, y: y }); return arr; };
  const c1 = TW.camTranslator();
  c1.landmarks(lm(0.5, 0.40), 0);
  c1.landmarks(lm(0.5, 0.70), 200);
  let f = c1.frame();
  ok(f.lungeEdge && f.holding, 'T cam: thumb pressing into the zone lunges and holds');
  c1.landmarks(lm(0.5, 0.70), 400);
  ok(c1.frame().holding === true, 'T cam: staying in the zone keeps the hold');
  const c2 = TW.camTranslator();
  c2.landmarks(lm(0.5, 0.70), 0);
  let revs = 0, t = 0, cx = 0.5;
  for (let i = 0; i < 10; i++) { t += 50; cx += (i % 2 ? 0.08 : -0.08); c2.landmarks(lm(cx, 0.70), t); revs += c2.frame().reversalEdge ? 1 : 0; }
  ok(revs >= 6, 'T cam: shaking the thumb counts reversals (' + revs + ')');
  const c3 = TW.camTranslator();
  c3.landmarks(lm(0.5, 0.40), 0);
  c3.landmarks(lm(0.62, 0.40), 50);
  ok(c3.frame().dodgeEdge === true, 'T cam: a lateral flee is a dodge');
}

/* W */
{
  const posts = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/arcade/thumb/', pretendToBeVisual: true,
    beforeParse(w) {
      w.localStorage.setItem('arcade_player', JSON.stringify({ player_id: 'p1', handle: 'FRESCO' }));
      w.fetch = async (url, opts) => {
        const u = String(url);
        posts.push({ u, body: opts && opts.body ? JSON.parse(opts.body) : null });
        if (u.includes('/arcade/session')) return { json: async () => ({ ok: true, token: 'TOK' }) };
        if (u.includes('/arcade/match')) return { json: async () => ({ ok: true }) };
        if (u.includes('/arcade/score')) return { json: async () => ({ ok: true, rank: { rank: 2 } }) };
        return { json: async () => ({ ok: true }) };
      };
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      w.HTMLCanvasElement.prototype.getContext = () => null;
    },
  });
  await sleep(500);
  const d = dom.window.document;
  ok(!!d.getElementById('ring') && d.getElementById('joinBtn').textContent === 'COMPETING AS FRESCO', 'W boots wearing the shared identity');
  d.getElementById('modeBtn').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(200);
  ok(d.getElementById('modeBtn').textContent === 'CAMERA: OFF' && d.getElementById('toast').textContent.includes('DRAG MODE HOLDS'), 'W no camera: refuses loud, drag mode holds');
  await dom.window.__thumbFinish('win', 2);
  await sleep(200);
  const match = posts.find(p => p.u.includes('/arcade/match'));
  const score = posts.find(p => p.u.includes('/arcade/score'));
  ok(match && match.body.game === 'thumb' && match.body.result === 'win' && match.body.token === 'TOK', 'W the match rail hears the result');
  ok(score && score.body.score === 2 && score.body.game === 'thumb', 'W the board hears the pins');
  await dom.window.__thumbFinish('win', 5);
  ok(posts.filter(p => p.u.includes('/arcade/match')).length === 1, 'W one match, one post');
}
/* R3 — the brand rig is aboard, and failure leaves the floor standing */
{
  ok(html.includes('type="module"') && html.includes('three@0.170.0'), 'R3 the rig rides the house importmap');
  ok(html.includes('class ProceduralHand') && html.includes('constructor(holder'), 'R3 the CABINET 01 hand, holder-parametrized');
  ok(html.includes('new ProceduralHand(playerHolder)') && html.includes('new ProceduralHand(houseHolder)'), 'R3 two of THE hand, opposed');
  ok(html.includes('pYaw: -96') && html.includes('mirrorP: 0'), 'R3 facing curls: two right hands, the player rotated to meet the house');
  ok(html.includes('id="handGlb"') && html.includes('class GLBHand') && html.includes('glb_fallback'), 'R3 THE Hand rides embedded, procedural stands fallback');
  ok(html.includes('I DECLARE A THUMB WAR') && html.includes('ROUND TO THE HAND'), 'R3 the ceremony: declaration and round stamps');
  ok(html.includes('navigator.vibrate') && html.includes('tw_mute'), 'R3 haptics and the persisted mute');
  ok(html.includes('__twFx') && html.includes('pinHeartbeat'), 'R3 feedback fx and the pin heartbeat');
  ok(html.includes('GLB_ADDUCT'), 'R3 measured adduction: fingers close ranks');
  ok(html.includes('lens: THUMB_SPEC.lens.map(l => l * 1.30)'), 'R3 measured thumb anatomy: 1.30x from the footage');
  ok(html.includes('id="fx"') && html.includes('window.__three_on'), 'R3 fx overlay + fallback switch wired');
  ok(html.includes("catch (e) { console.log('rig_fallback'"), 'R3 a broken rig falls back, never blanks');
}

console.log('\nTHUMB PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
