/* ═════════════════════════════════════════════════════════════════════
   CABINET 05 · CHESS — THE STAGE'S TRIAL (numeric ground truth)
   The 3D law is measured before any deliverable exists. Run:
   node tools/proof_chess_stage.mjs
   ═════════════════════════════════════════════════════════════════════ */
import {
  BOARD, sqToWorld, worldToSq, PIECES, PIECE_SEGMENTS,
  HAND, CAMERA, handFK, pinchOffset, wristForPinchAt, dist,
  TIMES, PHASES, PH_PICKUP, PH_CARRY, PH_PUTBACK,
  planMove, planPickup, planCarry, planPutback, samplePlan, holdPose, restPose,
} from '../arcade/chess/stage-math.js';

let n = 0, bad = 0;
function ok(cond, label) {
  n++;
  if (cond) console.log('  ok ' + label);
  else { bad++; console.error('  FAIL ' + label); }
}
const close = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9);

console.log('BOARD MAP — squares to world and back:');
{
  const a1 = sqToWorld('a1'), h8 = sqToWorld('h8'), e4 = sqToWorld('e4');
  ok(close(a1.x, -3.5) && close(a1.z, 3.5), 'a1 sits south-west: ' + a1.x + ',' + a1.z);
  ok(close(h8.x, 3.5) && close(h8.z, -3.5), 'h8 sits north-east: ' + h8.x + ',' + h8.z);
  ok(close(e4.x, 0.5) && close(e4.z, 0.5), 'e4 just south-east of center');
  let round = true;
  for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) {
    const s = f + r, w = sqToWorld(s);
    if (worldToSq(w.x, w.z) !== s) round = false;
  }
  ok(round, 'all 64 squares round-trip through world coords');
  ok(worldToSq(9, 0) === null && worldToSq(0, -9) === null, 'off-board points refuse a name');
}

console.log('PIECES — the low-poly set holds its law:');
{
  ok(PIECE_SEGMENTS >= 32, PIECE_SEGMENTS + ' radial segments (the hyperreal law)');
  const order = ['p','r','n','b','q','k'].map((k) => PIECES[k].h);
  ok(order.every((h, i) => i === 0 || h > order[i - 1]), 'heights ascend pawn -> king: ' + order.join(' < '));
  let grounded = true, closed = true;
  for (const k in PIECES) {
    const pr = PIECES[k].profile;
    if (pr[0][1] !== 0) grounded = false;
    if (pr[pr.length - 1][0] !== 0) closed = false;
  }
  ok(grounded, 'every profile starts on the table');
  ok(closed, 'every profile closes at its crown axis');
  ok(PIECES.k.boxes.length === 2 && PIECES.r.boxes.length === 4,
     'accents hold: king cross, rook battlements');
  ok(PIECES.n.head && PIECES.n.head.length >= 12 &&
     PIECES.n.head.every((p) => p[1] >= 0.3 && p[1] <= PIECES.n.h + 0.001),
     'the knight carries a true head silhouette (' + PIECES.n.head.length + ' points, within its height)');
}

console.log('HAND ORIENTATION — palm to the table, fingers into the board:');
{
  const house = handFK({ pos: [0, 2, -6], side: 'b', curl: HAND.OPEN });
  const player = handFK({ pos: [0, 2, 6], side: 'w', curl: HAND.OPEN });
  ok(house.palmNormal[1] < -0.85, 'house palm faces down (' + house.palmNormal[1].toFixed(3) + ')');
  ok(player.palmNormal[1] < -0.85, 'player palm faces down (' + player.palmNormal[1].toFixed(3) + ')');
  ok(house.fingerDir[2] > 0.85, 'house fingers reach south toward the player');
  ok(player.fingerDir[2] < -0.85, 'player fingers reach north toward the house');
  ok(house.fingerDir[1] < -0.2 && player.fingerDir[1] < -0.2, 'both angle down at the table (the refs)');
  ok(house.capsules.length === 4 + 12 + 2 && house.spheres.length === 5,
     'skeleton complete: 4 palm links + 12 finger segs + 2 thumb segs + 5 palm beads');
}

console.log('PINCH LAW — sweep-baked grip meets the crown:');
{
  const fk = handFK({ pos: [0, 0, 0], side: 'b', curl: HAND.GRIP });
  const gap = dist(fk.tips.thumb, fk.tips.index);
  const crown = PIECES.p.crownR + PIECES.k.crownR;
  ok(close(gap, crown, 0.02), 'pinch gap ' + gap.toFixed(3) + ' = crown diameter ' + crown.toFixed(3));
  const openFk = handFK({ pos: [0, 0, 0], side: 'b', curl: HAND.OPEN });
  ok(dist(openFk.tips.thumb, openFk.tips.index) > gap + 0.4, 'open hand releases well clear of the crown');
  /* wrist solver: pinch lands exactly where asked, both sides */
  for (const side of ['w', 'b']) {
    const target = [1.5, 0.6, -2.5];
    const w = wristForPinchAt(target, side, HAND.GRIP);
    const fk2 = handFK({ pos: w, side, curl: HAND.GRIP });
    ok(dist(fk2.pinch, target) < 1e-6, side + ' wrist solver: pinch lands on target exactly');
  }
}

console.log('CHOREOGRAPHY — a move, sampled to the frame:');
{
  const plan = planMove({ side: 'b', from: 'g8', to: 'f6', piece: 'n', capture: null });
  ok(close(plan.dur, Object.values(TIMES).reduce((a, b) => a + b, 0)), 'plan duration is the sum of its phases');
  ok(plan.segs.length === PHASES.length, 'all ' + PHASES.length + ' phases present, in order');

  /* full sweep: continuity, no NaN, arc clearance, piece follows the pinch */
  let nan = false, maxStep = 0, prev = null, apexOk = true, followOk = true;
  const kingTop = PIECES.k.h;
  for (let i = 0; i <= 400; i++) {
    const t = (i / 400) * plan.dur;
    const s = samplePlan(plan, t);
    const p = s.pose.pos;
    if (p.some((v) => !isFinite(v))) nan = true;
    if (prev) maxStep = Math.max(maxStep, dist(p, prev));
    prev = p;
    if (s.phase === 'carry') {
      const fk = handFK(s.pose);
      if (fk.pinch[1] < kingTop + 0.15) apexOk = false;   /* carried base clears the king */
      if (s.carriedPiecePos) {
        const gap = Math.abs((s.carriedPiecePos[1] + plan.crownY) - fk.pinch[1]);
        if (gap > 1e-6) followOk = false;
      }
    }
  }
  ok(!nan, 'zero NaN across a 400-sample sweep');
  ok(maxStep < 0.16, 'motion continuous (max frame step ' + maxStep.toFixed(3) + ')');
  ok(apexOk, 'carry arc clears the king by margin at every sample');
  ok(followOk, 'carried piece crown rides the pinch, frame-exact');

  /* endpoints: starts landing at from-square, ends releasing at to-square */
  const gripT = plan.segs.find((s) => s.name === 'grip').t1;
  const sg = samplePlan(plan, gripT);
  const fg = handFK(sg.pose);
  const fw = sqToWorld('g8');
  ok(dist(fg.pinch, [fw.x, PIECES.n.h - 0.02 + 0.02, fw.z]) < 0.02,
     'at full grip the pinch sits on the knight crown at g8');
  const lowT = plan.segs.find((s) => s.name === 'lower').t1;
  const sl = samplePlan(plan, lowT);
  const fl = handFK(sl.pose);
  const tw = sqToWorld('f6');
  ok(Math.hypot(fl.pinch[0] - tw.x, fl.pinch[2] - tw.z) < 0.02,
     'at touchdown the pinch sits over f6 exactly');
  ok(samplePlan(plan, plan.dur + 0.01).done, 'plan reports done past its duration');

  /* determinism: identical samples on identical inputs */
  const a = samplePlan(plan, 1.234), b = samplePlan(planMove(plan.rec), 1.234);
  ok(dist(a.pose.pos, b.pose.pos) === 0, 'deterministic: same time, same pose, twice');
}

console.log('THE PLAYER SEAT — camera low and close, by spec:');
{
  ok(CAMERA.pos[1] > 3.5 && CAMERA.pos[1] < 8.5, 'camera height rides between aerial and eye level (y=' + CAMERA.pos[1] + ')');
  ok(CAMERA.pos[2] > 5.5, 'camera pulled in behind the player rail');
  const pitch = Math.atan2(CAMERA.pos[1] - CAMERA.look[1], CAMERA.pos[2] - CAMERA.look[2]) * 180 / Math.PI;
  ok(pitch > 16 && pitch < 32, 'pitch ' + pitch.toFixed(1) + ' deg — the reference gameplay band (16-32)');
  const ACT = (await import('../arcade/chess/stage-math.js')).CAMERA_ACTION;
  ok(ACT.y < CAMERA.pos[1] && ACT.y > 1.0, 'drama cam dives below the seat, stays above the table (y=' + ACT.y + ')');
  ok(ACT.easeIn > 0.2 && ACT.easeOut > 0.2, 'camera moves ease, never cut');
}

console.log('HOLD LAW — pickup ends holding; carry and putback depart from that exact pose:');
{
  const rec = { side: 'w', from: 'e2', to: 'e4', piece: 'p', capture: null };
  const pick = planPickup(rec);
  ok(pick.segs.length === PH_PICKUP.length && pick.segs[pick.segs.length - 1].name === 'lift',
     'pickup lane: hover -> descend -> grip -> lift');
  const hold = holdPose(rec);
  const fkHold = handFK(hold.pose);
  ok(Math.abs(fkHold.pinch[1] - (HAND.HOLD_Y)) < 1e-6, 'held pinch waits at HOLD_Y exactly');
  ok(hold.carriedPiecePos !== null, 'the piece rides the hold');
  const carry = planCarry(rec);
  const c0 = samplePlan(carry, 0);
  ok(dist(c0.pose.pos, hold.pose.pos) < 1e-9, 'carry departs from the hold pose, zero seam');
  const put = planPutback(rec);
  const p0 = samplePlan(put, 0);
  ok(dist(p0.pose.pos, hold.pose.pos) < 1e-9, 'putback departs from the hold pose, zero seam');
  ok(put.rec.to === 'e2' && put.segs.length === PH_PUTBACK.length, 'putback lowers home: to == from');
  /* carry sweep still continuous and clears the king via the apex */
  let maxStep = 0, prev = null, apexSeen = 0;
  for (let i = 0; i <= 240; i++) {
    const s = samplePlan(carry, (i / 240) * carry.dur);
    if (prev) maxStep = Math.max(maxStep, dist(s.pose.pos, prev));
    prev = s.pose.pos;
    if (s.phase === 'carry') {
      const fk = handFK(s.pose);
      apexSeen = Math.max(apexSeen, fk.pinch[1]);
      if (fk.pinch[1] < HAND.HOLD_Y - 1e-6) apexSeen = -1;
    }
  }
  ok(maxStep < 0.16, 'carry lane continuous (max step ' + maxStep.toFixed(3) + ')');
  ok(apexSeen > PIECES.k.h + 0.15, 'carry apex clears the king (' + apexSeen.toFixed(2) + ')');
}

console.log('FRAMING LAW — the seat sees everything it must (projected, not eyeballed):');
{
  /* project world points through the spec camera: look-at basis + perspective */
  const eye = CAMERA.pos, look = CAMERA.look;
  const fwd = [look[0]-eye[0], look[1]-eye[1], look[2]-eye[2]];
  const fl = Math.hypot(fwd[0], fwd[1], fwd[2]); fwd.forEach((v,i)=>fwd[i]=v/fl);
  const right = [fwd[2], 0, -fwd[0]];
  const rl = Math.hypot(right[0], right[1], right[2]); right.forEach((v,i)=>right[i]=v/rl);
  const up = [right[1]*fwd[2]-right[2]*fwd[1], right[2]*fwd[0]-right[0]*fwd[2], right[0]*fwd[1]-right[1]*fwd[0]];
  const tanF = Math.tan((CAMERA.fov * Math.PI / 180) / 2);
  function ndc(p) {
    const d = [p[0]-eye[0], p[1]-eye[1], p[2]-eye[2]];
    const z = d[0]*fwd[0]+d[1]*fwd[1]+d[2]*fwd[2];
    const x = d[0]*right[0]+d[1]*right[1]+d[2]*right[2];
    const y = d[0]*up[0]+d[1]*up[1]+d[2]*up[2];
    return { x: x / (z * tanF), y: y / (z * tanF), z };
  }
  const inFrame = (p, m) => { const n = ndc(p); return n.z > 0 && Math.abs(n.x) < (1 - m) && Math.abs(n.y) < (1 - m); };
  /* all four board corners (rim included) inside the frame */
  const R = 4 + BOARD.RIM;
  ok([[-R,0,R],[R,0,R],[-R,0,-R],[R,0,-R]].every((c) => inFrame(c, -0.06)),
     'all four board corners live in frame (edges may kiss, bound 1.06)');
  /* both resting hands visible: wrist + fingertips inside frame */
  let handsIn = true;
  for (const side of ['w','b']) {
    const fk = handFK(restPose(side));
    for (const nm of ['index','pinky']) if (!inFrame(fk.tips[nm], 0.0)) handsIn = false;
  }
  ok(handsIn, 'both hands live within the frame at rest');
  /* the held piece stays in frame at HOLD over the player rank */
  const hp = holdPose({ side: 'w', from: 'e2', to: 'e2', piece: 'p', capture: null });
  ok(inFrame(hp.carriedPiecePos, 0.02), 'a held piece over the player rank stays in frame');
  /* far rank squares still project with tappable separation */
  const a8 = ndc([sqToWorld('a8').x, 0, sqToWorld('a8').z]);
  const b8 = ndc([sqToWorld('b8').x, 0, sqToWorld('b8').z]);
  ok(Math.abs(a8.x - b8.x) > 0.05, 'far-rank squares keep tappable separation (' + Math.abs(a8.x - b8.x).toFixed(3) + ' NDC)');
}

console.log('THE STADIUM — black depth, pooled light, the brand in the space:');
{
  const ST = (await import('../arcade/chess/stage-math.js')).STADIUM;
  ok(ST.FOG.far > ST.FOG.near && ST.FOG.color === 0x0A0A0A,
     'fog dissolves the gamespace into page black (' + ST.FOG.near + ' -> ' + ST.FOG.far + ')');
  ok(ST.HOARDING.pos[2] < HAND.REST.b.z - 1.0,
     'the hoarding stands behind the dark Hand, across the table (z=' + ST.HOARDING.pos[2] + ')');
  ok(Math.hypot(ST.HOARDING.pos[0] - CAMERA.pos[0], ST.HOARDING.pos[2] - CAMERA.pos[2]) < ST.FOG.far,
     'the fascia stays inside the fog horizon — legible, not swallowed');
  ok(ST.DECAL.pos[1] > 4.42 && ST.DECAL.w > 2, 'the floor mark lives on the felt south of the rim');
  ok(ST.KEY_SPOT.penumbra > 0 && ST.RIM_SPOTS.length === 2, 'stadium rig: one pooled key, two rim spots');
}

console.log('THE ORBIT — the whole table from any side, by law:');
{
  const M = await import('../arcade/chess/stage-math.js');
  const s = M.seatSpherical();
  const home = M.orbitPose(s.theta, s.phi);
  const dHome = Math.hypot(home.eye[0] - CAMERA.pos[0], home.eye[1] - CAMERA.pos[1], home.eye[2] - CAMERA.pos[2]);
  ok(dHome < 1e-9, 'the orbit at seat angles IS the seat — no jump when the finger lands');
  const wrap = M.orbitPose(s.theta + Math.PI * 2, s.phi);
  ok(Math.hypot(wrap.eye[0] - home.eye[0], wrap.eye[2] - home.eye[2]) < 1e-9, 'full 360 wraps seamlessly');
  const under = M.orbitPose(s.theta, 3.0), over = M.orbitPose(s.theta, -1.0);
  ok(under.eye[1] > 1.5 && over.eye[1] < s.r + s.pivot[1],
     'polar clamps: never under the felt (' + under.eye[1].toFixed(2) + '), never gimbal-locked');
  let allAbove = true;
  for (let th = 0; th < Math.PI * 2; th += 0.3) {
    for (let ph = M.ORBIT.POLAR_MIN; ph <= M.ORBIT.POLAR_MAX; ph += 0.2) {
      if (M.orbitPose(th, ph).eye[1] <= 0.4) allAbove = false;
    }
  }
  ok(allAbove, 'every reachable orbit pose stays above the table');
  ok(M.ORBIT.TAP_SLOP >= 6 && M.ORBIT.TAP_SLOP <= 14, 'tap slop keeps taps taps (' + M.ORBIT.TAP_SLOP + 'px)');
  /* THE ZOOM: a third coordinate on the same sphere */
  const z1 = M.orbitPose(s.theta, s.phi, 1);
  ok(Math.hypot(z1.eye[0] - home.eye[0], z1.eye[1] - home.eye[1], z1.eye[2] - home.eye[2]) < 1e-9,
     'zoom at scale 1 IS the unzoomed pose — backwards-compatible by identity');
  const zIn = M.orbitPose(s.theta, s.phi, 0.01), zOut = M.orbitPose(s.theta, s.phi, 99);
  const dIn = Math.hypot(zIn.eye[0] - s.pivot[0], zIn.eye[1] - s.pivot[1], zIn.eye[2] - s.pivot[2]);
  const dOut = Math.hypot(zOut.eye[0] - s.pivot[0], zOut.eye[1] - s.pivot[1], zOut.eye[2] - s.pivot[2]);
  ok(Math.abs(dIn - s.r * M.ORBIT.R_MIN) < 1e-6 && Math.abs(dOut - s.r * M.ORBIT.R_MAX) < 1e-6,
     'radius clamps hold at both ends (' + dIn.toFixed(2) + ' .. ' + dOut.toFixed(2) + ')');
  ok(dOut < 26 - 4.5, 'max zoom-out keeps the far rail inside the fog horizon');
  let zoomSafe = true;
  for (let th = 0; th < Math.PI * 2; th += 0.4) {
    for (let ph = M.ORBIT.POLAR_MIN; ph <= M.ORBIT.POLAR_MAX; ph += 0.25) {
      for (const rs of [M.ORBIT.R_MIN, 1, M.ORBIT.R_MAX]) {
        const e = M.orbitPose(th, ph, rs).eye;
        const horiz = Math.hypot(e[0] - s.pivot[0], e[2] - s.pivot[2]);
        if (e[1] <= 0.5) zoomSafe = false;
        if (horiz < 4.5 && e[1] < 1.4) zoomSafe = false;   /* never inside the piece volume */
      }
    }
  }
  ok(zoomSafe, 'every zoomed orbit pose stays above the table and clear of the pieces');
}

console.log('CAPTURE + REST — victims sink, hands live off the table:');
{
  const cap = planMove({ side: 'w', from: 'd2', to: 'd5', piece: 'r', capture: 'q' });
  ok(cap.victimSq === 'd5', 'capture marks the victim square');
  const early = samplePlan(cap, cap.segs[2].t1);          /* end of grip */
  const late = samplePlan(cap, cap.segs[6].t1);           /* end of release */
  ok(early.victimSinkK === 0 && late.victimSinkK === 1, 'victim sinks only as the piece lands');
  const ep = planMove({ side: 'b', from: 'd4', to: 'e3', piece: 'p', capture: 'P', victimSq: 'e4' });
  ok(ep.victimSq === 'e4', 'en passant sinks the passed pawn, not the landing square');
  for (const side of ['w', 'b']) {
    const r = HAND.REST[side];
    ok(Math.abs(r.z) > 4.42, side + ' rest pose lives off the board footprint (z=' + r.z + ')');
  }
}

console.log('');
if (bad) { console.error('STAGE PROOF: ' + (n - bad) + '/' + n + ' — FAILURES PRESENT'); process.exit(1); }
console.log('STAGE PROOF: ' + n + '/' + n + ' assertions PASS');
