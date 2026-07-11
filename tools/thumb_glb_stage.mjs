// Ground truth, GLB edition: the real rig's bones under the real choreography.
import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const html = fs.readFileSync('arcade/thumb/index.html', 'utf-8');
const t0 = html.indexOf('id="handGlb"');
const ts = html.indexOf('>', t0) + 1;
const te = html.indexOf('</script>', ts);
const b64 = html.slice(ts, te).replace(/\s+/g, '');
const bin = Buffer.from(b64, 'base64');
const buf = bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);

const GLB_FINGER_BONES_M = html.match(/const GLB_FINGER_BONES = \{[\s\S]*?\};/)[0];
const GLB_FINGER_BONES = eval('(' + GLB_FINGER_BONES_M.slice(GLB_FINGER_BONES_M.indexOf('{'), GLB_FINGER_BONES_M.lastIndexOf('}') + 1) + ')');
const GLB_QUAT = JSON.parse(html.match(/GLB_QUAT:\s*(\[[^\]]*\])/)[1]);
const GLB_SCALE = parseFloat(html.match(/GLB_SCALE:\s*([\d.]+)/)[1]);
const GLB_POS = JSON.parse(html.match(/GLB_POS:\s*(\[[^\]]*\])/)[1]);
const GLB_THUMB_CLOSE = JSON.parse(html.match(/const GLB_THUMB_CLOSE = (\[[^\]]*\])/)[1]);
const GLB_CLOSE = JSON.parse(html.match(/const GLB_CLOSE = (\[[^\]]*\])/)[1]);

const loader = new GLTFLoader();
const gltf = await new Promise((res, rej) => loader.parse(buf.slice(0), '', res, rej));

function findBone(model, name) {
  let out = null;
  model.traverse(o => { if (!out && o.isBone && (o.name === name || o.name.endsWith(name) || o.name.replace(/[._]/g,'') === name.replace(/[._]/g,''))) out = o; });
  return out;
}

function buildHand(gltfScene, holderCfg) {
  const model = gltfScene;
  const bones = {}, bind = {};
  for (const f in GLB_FINGER_BONES) {
    bones[f] = GLB_FINGER_BONES[f].map(n => {
      const b = findBone(model, n);
      if (b) bind[n] = b.quaternion.clone();
      return b || null;
    });
  }
  const handG = new THREE.Group();
  handG.add(model);
  model.quaternion.set(...GLB_QUAT);
  model.scale.setScalar(GLB_SCALE);
  model.position.set(GLB_POS[0], GLB_POS[1], GLB_POS[2]);
  const holder = new THREE.Group();
  holder.add(handG);
  holder.scale.setScalar(0.88);
  holder.quaternion.setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(holderCfg.pitch),
    THREE.MathUtils.degToRad(holderCfg.yaw),
    THREE.MathUtils.degToRad(holderCfg.roll), 'YXZ'));
  holder.position.set(holderCfg.x, 0.24, holderCfg.z);
  const scene = new THREE.Scene();
  scene.add(holder);
  return { scene, holder, bones, bind };
}

const _AX = new THREE.Vector3(1,0,0), _AY = new THREE.Vector3(0,1,0), _AZ = new THREE.Vector3(0,0,1);
function pose(hand, curls, thumbArc, thumbRx, chanZ, chanY) {
  for (const f in GLB_FINGER_BONES) {
    const names = GLB_FINGER_BONES[f];
    const close = f === 'thumb' ? GLB_THUMB_CLOSE : GLB_CLOSE;
    const c = curls[f] ?? 0;
    hand.bones[f].forEach((b, k) => {
      if (!b) return;
      b.quaternion.copy(hand.bind[names[k]])
        .multiply(new THREE.Quaternion().setFromAxisAngle(_AX, -c * close[k]));
    });
  }
  const b0 = hand.bones.thumb[0];
  if (b0) {
    b0.quaternion.copy(hand.bind[GLB_FINGER_BONES.thumb[0]])
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AX, -(curls.thumb ?? 0) * GLB_THUMB_CLOSE[0]))
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AZ, thumbArc * chanZ))
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AY, thumbArc * chanY))
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AX, thumbRx));
  }
  const b1 = hand.bones.thumb[1];
  const s2 = arguments.length > 6 ? arguments[6] : 0;   // MCP share
  if (b1 && s2) {
    b1.quaternion.copy(hand.bind[GLB_FINGER_BONES.thumb[1]])
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AX, -(curls.thumb ?? 0) * GLB_THUMB_CLOSE[1]))
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AZ, thumbArc * chanZ * s2))
      .multiply(new THREE.Quaternion().setFromAxisAngle(_AY, thumbArc * chanY * s2));
  }
  hand.scene.updateMatrixWorld(true);
}
function tip(hand) {
  const chain = hand.bones.thumb.filter(Boolean);
  const last = chain[chain.length - 1];
  const p = new THREE.Vector3();
  last.getWorldPosition(p);
  return p;
}

const CLASP = { thumb: 0.05, index: 0.45, middle: 0.62, ring: 0.66, pinky: 0.68 };
const P = buildHand(gltf.scene, { yaw: -96, pitch: -24, roll: -8, x: 0.42, z: -0.06 });
const gltf2 = await new Promise((res, rej) => loader.parse(buf.slice(0), '', res, rej));
const H = buildHand(gltf2.scene, { yaw: 92, pitch: -24, roll: 8, x: -0.52, z: 0.10 });

pose(P, CLASP, -0.22, 0, 0.6, 0.6);
pose(H, CLASP, 0.22, 0, 0.6, 0.6);   // house arc negated in live loop -> +rest here
const tP = tip(P), tH = tip(H);
console.log('NEUTRAL tips  P(%s) H(%s)  dist %s',
  tP.toArray().map(v=>v.toFixed(2)), tH.toArray().map(v=>v.toFixed(2)),
  tP.distanceTo(tH).toFixed(3));

// ═══ SWEEP MODE: make the tips meet, then make the pins land ═══
if (process.argv[2] === 'sweep') {
  const T = new THREE.Vector3((tP.x + tH.x) / 2, 1.02, (tP.z + tH.z) / 2);
  console.log('meet target:', T.toArray().map(v => v.toFixed(2)).join(','));

  function seek(hand, curl, arcSign) {
    let best = null;
    for (let arc = 0.0; arc <= 1.3; arc += 0.05) {
      for (const cz of [-1, -0.6, 0, 0.6, 1]) {
        for (const cy of [-1, -0.6, 0, 0.6, 1]) {
          for (const rx of [-0.4, -0.2, 0, 0.2, 0.4]) {
            pose(hand, { ...CLASP, thumb: curl }, arcSign * arc, rx, cz, cy);
            const p = tip(hand);
            const d = p.distanceTo(T);
            if (!best || d < best.d) best = { d, arc: arcSign * arc, cz, cy, rx, p: p.toArray().map(v => +v.toFixed(2)) };
          }
        }
      }
    }
    return best;
  }
  const bP = seek(P, 0.05, -1);   // player arc runs negative in live convention
  const bH = seek(H, 0.05, +1);
  console.log('P seek:', JSON.stringify(bP));
  console.log('H seek:', JSON.stringify(bH));

  // verify the joint touch
  pose(P, { ...CLASP, thumb: 0.05 }, bP.arc, bP.rx, bP.cz, bP.cy);
  pose(H, { ...CLASP, thumb: 0.05 }, bH.arc, bH.rx, bH.cz, bH.cy);
  const d = tip(P).distanceTo(tip(H));
  console.log('JOINT touch dist:', d.toFixed(3));

  // H_PIN: trap the player low, land the house press on it
  pose(P, { ...CLASP, thumb: 0.35 }, bP.arc, bP.rx + 0.25, bP.cz, bP.cy);
  const V = tip(P);
  let bestPress = null;
  for (let arc = 0.0; arc <= 1.5; arc += 0.05) {
    for (const rx of [-0.6, -0.4, -0.2, 0, 0.2, 0.4]) {
      pose(H, { ...CLASP, thumb: 0.28 }, arc, rx, bH.cz, bH.cy);
      const p = tip(H);
      const lat = Math.hypot(p.x - V.x, p.z - V.z);
      const above = p.y - V.y;
      if (above < 0.01 || above > 0.14) continue;
      const cost = lat + Math.abs(above - 0.06);
      if (!bestPress || cost < bestPress.cost) bestPress = { cost, arc, rx, lat: +lat.toFixed(3), above: +above.toFixed(3) };
    }
  }
  console.log('H_PIN press:', JSON.stringify(bestPress), '| victim tip:', V.toArray().map(v => +v.toFixed(2)));

  // P_PIN mirror: trap the house, land the player press
  pose(H, { ...CLASP, thumb: 0.35 }, bH.arc, bH.rx + 0.25, bH.cz, bH.cy);
  const V2 = tip(H);
  let bestPress2 = null;
  for (let arc = 0.0; arc <= 1.5; arc += 0.05) {
    for (const rx of [-0.6, -0.4, -0.2, 0, 0.2, 0.4]) {
      pose(P, { ...CLASP, thumb: 0.28 }, -arc, rx, bP.cz, bP.cy);
      const p = tip(P);
      const lat = Math.hypot(p.x - V2.x, p.z - V2.z);
      const above = p.y - V2.y;
      if (above < 0.01 || above > 0.14) continue;
      const cost = lat + Math.abs(above - 0.06);
      if (!bestPress2 || cost < bestPress2.cost) bestPress2 = { cost, arc: -arc, rx, lat: +lat.toFixed(3), above: +above.toFixed(3) };
    }
  }
  console.log('P_PIN press:', JSON.stringify(bestPress2), '| victim tip:', V2.toArray().map(v => +v.toFixed(2)));
}

// ═══ SWEEP2: placement joins the search — close until the tips meet ═══
if (process.argv[2] === 'sweep2') {
  const MIX = [[0.6, -1], [1, -0.6], [0.6, -0.6]];
  function seekAt(hand, arcSign, tgt) {
    let best = null;
    for (const [cz, cy] of MIX)
      for (let arc = 0.0; arc <= 1.3; arc += 0.05)
        for (const rx of [-0.5, -0.4, -0.3, -0.2, 0]) {
          pose(hand, { ...CLASP, thumb: 0.05 }, arcSign * arc, rx, cz, cy);
          const p = tip(hand);
          const d = p.distanceTo(tgt);
          if (!best || d < best.d) best = { d, arc: arcSign * arc, cz, cy, rx, p: p.toArray().map(v => +v.toFixed(2)) };
        }
    return best;
  }
  let winner = null;
  for (const gap of [0.86, 0.76, 0.66, 0.58]) {
    for (const [pz, hz] of [[-0.06, 0.10], [-0.02, 0.04], [0, 0]]) {
      const pX = gap / 2 - 0.05, hX = -(gap / 2 + 0.05);   // keep the slight house retreat
      P.holder.position.set(pX, 0.24, pz);
      H.holder.position.set(hX, 0.24, hz);
      // provisional target = midpoint at thumb height
      pose(P, { ...CLASP, thumb: 0.05 }, -0.22, 0, 0.6, -1);
      pose(H, { ...CLASP, thumb: 0.05 }, 0.22, 0, 0.6, -1);
      const T2 = tip(P).clone().add(tip(H)).multiplyScalar(0.5); T2.y = 1.0;
      const bP2 = seekAt(P, -1, T2), bH2 = seekAt(H, +1, T2);
      pose(P, { ...CLASP, thumb: 0.05 }, bP2.arc, bP2.rx, bP2.cz, bP2.cy);
      pose(H, { ...CLASP, thumb: 0.05 }, bH2.arc, bH2.rx, bH2.cz, bH2.cy);
      const d = tip(P).distanceTo(tip(H));
      const rec = { gap, pX: +pX.toFixed(2), hX: +hX.toFixed(2), pz, hz, d: +d.toFixed(3), bP: bP2, bH: bH2 };
      console.log('gap %s pz %s hz %s -> touch %s  (P arc %s rx %s | H arc %s rx %s)',
        gap, pz, hz, d.toFixed(3), bP2.arc.toFixed(2), bP2.rx, bH2.arc.toFixed(2), bH2.rx);
      if (!winner || d < winner.d) winner = rec;
    }
  }
  console.log('WINNER:', JSON.stringify(winner));
}


// ═══ SWEEP3: two-joint thumbs, closer gaps — until the pads meet ═══
if (process.argv[2] === 'sweep3') {
  const MIX = [[0.6, -1], [1, -0.6], [0.6, -0.6], [1, -1]];
  function seek3(hand, arcSign, tgt) {
    let best = null;
    for (const [cz, cy] of MIX)
      for (const s2 of [0, 0.4, 0.7])
        for (let arc = 0.0; arc <= 1.4; arc += 0.05)
          for (const rx of [-0.7, -0.5, -0.3, -0.15, 0]) {
            pose(hand, { ...CLASP, thumb: 0.05 }, arcSign * arc, rx, cz, cy, s2);
            const d = tip(hand).distanceTo(tgt);
            if (!best || d < best.d) best = { d: +d.toFixed(3), arc: +(arcSign * arc).toFixed(2), cz, cy, rx, s2 };
          }
    return best;
  }
  let winner = null;
  for (const gap of [0.58, 0.50, 0.44]) {
    const pX = gap / 2 - 0.05, hX = -(gap / 2 + 0.05);
    P.holder.position.set(pX, 0.24, 0);
    H.holder.position.set(hX, 0.24, 0);
    pose(P, { ...CLASP, thumb: 0.05 }, -0.3, -0.3, 0.6, -1, 0.4);
    pose(H, { ...CLASP, thumb: 0.05 }, 0.3, -0.3, 0.6, -1, 0.4);
    const T3 = tip(P).clone().add(tip(H)).multiplyScalar(0.5); T3.y = 0.98;
    const bP3 = seek3(P, -1, T3), bH3 = seek3(H, +1, T3);
    pose(P, { ...CLASP, thumb: 0.05 }, bP3.arc, bP3.rx, bP3.cz, bP3.cy, bP3.s2);
    pose(H, { ...CLASP, thumb: 0.05 }, bH3.arc, bH3.rx, bH3.cz, bH3.cy, bH3.s2);
    const tPP = tip(P), tHH = tip(H);
    const d = tPP.distanceTo(tHH);
    console.log('gap %s -> touch %s | P%j H%j | tips P[%s] H[%s]', gap, d.toFixed(3), bP3, bH3,
      tPP.toArray().map(v=>v.toFixed(2)), tHH.toArray().map(v=>v.toFixed(2)));
    if (!winner || d < winner.d) winner = { gap, pX: +pX.toFixed(2), hX: +hX.toFixed(2), d: +d.toFixed(3), bP: bP3, bH: bH3 };
  }
  console.log('WINNER3:', JSON.stringify(winner));
}


// ═══ SWEEP4: the house holds its ground; the player crosses to it ═══
if (process.argv[2] === 'sweep4') {
  const MIX = [[0.6, -1], [1, -0.6], [1, -1], [0.6, -0.6]];
  function bestPose(hand, arcSign, tgt, arcMax, rxSet, s2Set) {
    let best = null;
    for (const [cz, cy] of MIX)
      for (const s2 of s2Set)
        for (let arc = 0.0; arc <= arcMax; arc += 0.05)
          for (const rx of rxSet) {
            pose(hand, { ...CLASP, thumb: 0.05 }, arcSign * arc, rx, cz, cy, s2);
            const d = tip(hand).distanceTo(tgt);
            if (!best || d < best.d) best = { d: +d.toFixed(3), arc: +(arcSign * arc).toFixed(2), cz, cy, rx, s2 };
          }
    return best;
  }
  for (const gap of [0.52, 0.46]) {
    const pX = gap / 2 - 0.05, hX = -(gap / 2 + 0.05);
    P.holder.position.set(pX, 0.24, 0);
    H.holder.position.set(hX, 0.24, 0);
    // house: strongest inward reach
    const probe = new THREE.Vector3(0.10, 0.95, -0.02);
    const bH4 = bestPose(H, +1, probe, 1.4, [-0.5, -0.3, -0.15, 0], [0, 0.4, 0.7]);
    pose(H, { ...CLASP, thumb: 0.05 }, bH4.arc, bH4.rx, bH4.cz, bH4.cy, bH4.s2);
    const tH4 = tip(H).clone();
    // player: cross the gap to the house tip
    const bP4 = bestPose(P, -1, tH4, 1.5, [-0.9, -0.7, -0.5, -0.3, -0.15, 0], [0, 0.4, 0.7, 0.9]);
    pose(P, { ...CLASP, thumb: 0.05 }, bP4.arc, bP4.rx, bP4.cz, bP4.cy, bP4.s2);
    const d = tip(P).distanceTo(tH4);
    console.log('gap %s -> TOUCH %s | H holds %j at [%s] | P crosses %j',
      gap, d.toFixed(3), bH4, tH4.toArray().map(v=>v.toFixed(2)), bP4);
  }
}


// ═══ SWEEP5: pins on the touching stance ═══
if (process.argv[2] === 'sweep5') {
  P.holder.position.set(0.18, 0.24, 0);
  H.holder.position.set(-0.28, 0.24, 0);
  const MIXP = [[0.6, -1]];
  function seekTip(hand, arcSign, tgt, arcMax, rxSet, curl) {
    let best = null;
    for (const [cz, cy] of MIXP)
      for (let arc = 0.0; arc <= arcMax; arc += 0.05)
        for (const rx of rxSet) {
          pose(hand, { ...CLASP, thumb: curl }, arcSign * arc, rx, cz, cy, 0);
          const p = tip(hand);
          const lat = Math.hypot(p.x - tgt.x, p.z - tgt.z);
          const above = p.y - tgt.y;
          if (above < 0.02 || above > 0.12) continue;
          const cost = lat + Math.abs(above - 0.06) * 0.5;
          if (!best || cost < best.cost) best = { cost: +cost.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, lat: +lat.toFixed(3), above: +above.toFixed(3) };
        }
    return best;
  }
  // H_PIN: trap the player low, house presses down onto it
  let bestTrap = null;
  for (const c of [0.25, 0.35]) for (const a of [-0.95, -0.7, -0.5]) for (const rx of [-0.3, -0.1, 0.1]) {
    pose(P, { ...CLASP, thumb: c }, a, rx, 0.6, -1, 0);
    const p = tip(P);
    if (p.y > 0.80 || p.y < 0.68) continue;
    const cost = Math.abs(p.y - 0.74) + Math.abs(p.x + 0.04) * 0.5;
    if (!bestTrap || cost < bestTrap.cost) bestTrap = { cost, c, a, rx, tip: p.toArray().map(v=>+v.toFixed(2)) };
  }
  pose(P, { ...CLASP, thumb: bestTrap.c }, bestTrap.a, bestTrap.rx, 0.6, -1, 0);
  const V = tip(P).clone();
  const press = seekTip(H, +1, V, 1.4, [-0.6, -0.4, -0.2, 0], 0.28);
  console.log('H_PIN  victim %j | press %j', bestTrap, press);
  // P_PIN: trap the house low, player presses
  let bestTrap2 = null;
  for (const c of [0.25, 0.35]) for (const a of [0.6, 0.45, 0.3]) for (const rx of [-0.3, -0.1, 0.1]) {
    pose(H, { ...CLASP, thumb: c }, a, rx, 0.6, -1, 0);
    const p = tip(H);
    if (p.y > 0.80 || p.y < 0.66) continue;
    const cost = Math.abs(p.y - 0.73) + Math.abs(p.x + 0.06) * 0.5;
    if (!bestTrap2 || cost < bestTrap2.cost) bestTrap2 = { cost, c, a, rx, tip: p.toArray().map(v=>+v.toFixed(2)) };
  }
  pose(H, { ...CLASP, thumb: bestTrap2.c }, bestTrap2.a, bestTrap2.rx, 0.6, -1, 0);
  const V2 = tip(H).clone();
  const press2 = seekTip(P, -1, V2, 1.6, [-0.9, -0.7, -0.5, -0.3], 0.28);
  console.log('P_PIN  victim %j | press %j', bestTrap2, press2);
  // TELE: house rears tall
  let tele = null;
  for (let a = 0; a <= 0.8; a += 0.05) for (const rx of [0, -0.15, -0.3]) {
    pose(H, { ...CLASP, thumb: 0.02 }, a, rx, 0.6, -1, 0);
    const p = tip(H);
    if (!tele || p.y > tele.y) tele = { y: +p.y.toFixed(2), arc: +a.toFixed(2), rx };
  }
  console.log('H_TELE tall %j', tele);
}


// ═══ SWEEP6: extended thumbs, proud and touching; pins re-zeroed after ═══
if (process.argv[2] === 'sweep6') {
  const GRIPC = { thumb: 0.0, index: 0.55, middle: 0.70, ring: 0.74, pinky: 0.76 };
  P.holder.position.set(0.18, 0.24, 0);
  H.holder.position.set(-0.28, 0.24, 0);
  function seekTall(hand, arcSign, tgt, rxSet) {
    let best = null;
    for (let arc = 0.0; arc <= 1.5; arc += 0.05)
      for (const rx of rxSet) {
        pose(hand, GRIPC, arcSign * arc, rx, 0.6, -1, 0);
        const p = tip(hand);
        if (p.y < 0.90) continue;                       // proud thumbs only
        const d = p.distanceTo(tgt);
        if (!best || d < best.d) best = { d: +d.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, tip: p.toArray().map(v=>+v.toFixed(2)) };
      }
    return best;
  }
  // house holds high-inward; player crosses to it
  const probe = new THREE.Vector3(0.08, 1.00, -0.02);
  const bH = seekTall(H, +1, probe, [-0.45, -0.35, -0.25, -0.15, 0]);
  pose(H, GRIPC, bH.arc, bH.rx, 0.6, -1, 0);
  const tH6 = tip(H).clone();
  const bP = seekTall(P, -1, tH6, [-0.45, -0.35, -0.25, -0.15, 0]);
  pose(P, GRIPC, bP.arc, bP.rx, 0.6, -1, 0);
  const d = tip(P).distanceTo(tH6);
  console.log('EXTENDED TOUCH %s | H %j | P %j', d.toFixed(3), bH, bP);

  // pins at the extended rest: victim lowered but proud-visible, press dives on it
  function trap(hand, arcSign, restArc, restRx) {
    let best = null;
    for (const c of [0.15, 0.22, 0.30])
      for (const a of [restArc, restArc * 0.7, restArc * 0.5])
        for (const rx of [restRx + 0.25, restRx + 0.4, restRx + 0.55]) {
          pose(hand, { ...GRIPC, thumb: c }, a, rx, 0.6, -1, 0);
          const p = tip(hand);
          if (p.y > 0.88 || p.y < 0.70) continue;
          const cost = Math.abs(p.y - 0.79);
          if (!best || cost < best.cost) best = { cost, c, a: +a.toFixed(2), rx: +rx.toFixed(2), tip: p.toArray().map(v=>+v.toFixed(2)) };
        }
    return best;
  }
  function press(hand, arcSign, tgt) {
    let best = null;
    for (let arc = 0.0; arc <= 1.6; arc += 0.05)
      for (const rx of [-0.7, -0.55, -0.4, -0.25, -0.1]) {
        pose(hand, { ...GRIPC, thumb: 0.20 }, arcSign * arc, rx, 0.6, -1, 0);
        const p = tip(hand);
        const lat = Math.hypot(p.x - tgt.x, p.z - tgt.z);
        const above = p.y - tgt.y;
        if (above < 0.02 || above > 0.13) continue;
        const cost = lat + Math.abs(above - 0.06) * 0.5;
        if (!best || cost < best.cost) best = { cost: +cost.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, lat: +lat.toFixed(3), above: +above.toFixed(3) };
      }
    return best;
  }
  const vP = trap(P, -1, bP.arc, bP.rx);
  pose(P, { ...GRIPC, thumb: vP.c }, vP.a, vP.rx, 0.6, -1, 0);
  const prH = press(H, +1, tip(P).clone());
  console.log('H_PIN  victim %j | press %j', vP, prH);
  const vH = trap(H, +1, bH.arc, bH.rx);
  pose(H, { ...GRIPC, thumb: vH.c }, vH.a, vH.rx, 0.6, -1, 0);
  const prP = press(P, -1, tip(H).clone());
  console.log('P_PIN  victim %j | press %j', vH, prP);
}


// ═══ SWEEP7: two sections — dense interlock below, tall thumb arena above ═══
if (process.argv[2] === 'sweep7') {
  const GRIPC = { thumb: 0.0, index: 0.62, middle: 0.74, ring: 0.78, pinky: 0.82 };
  P.holder.position.set(0.16, 0.24, 0);
  H.holder.position.set(-0.26, 0.24, 0);
  function ceiling(hand, arcSign) {
    let top = 0;
    for (let arc = 0.0; arc <= 1.2; arc += 0.05)
      for (const rx of [-0.35, -0.2, -0.05, 0.1])
        for (const s2 of [0, 0.35, 0.6]) {
          pose(hand, GRIPC, arcSign * arc, rx, 0.6, -1, s2);
          top = Math.max(top, tip(hand).y);
        }
    return top;
  }
  function seekArena(hand, arcSign, tgt, floor) {
    let best = null;
    for (let arc = 0.0; arc <= 1.2; arc += 0.05)
      for (const rx of [-0.35, -0.25, -0.15, -0.05, 0.05])
        for (const s2 of [0, 0.35, 0.6]) {
          pose(hand, GRIPC, arcSign * arc, rx, 0.6, -1, s2);
          const p = tip(hand);
          if (p.y < floor) continue;
          const d = p.distanceTo(tgt);
          if (!best || d < best.d) best = { d: +d.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, s2, tip: p.toArray().map(v=>+v.toFixed(2)) };
        }
    return best;
  }
  const cH = ceiling(H, +1), cP = ceiling(P, -1);
  console.log('ceilings  H %s  P %s', cH.toFixed(2), cP.toFixed(2));
  const floorH = cH - 0.03, floorP = Math.min(cP - 0.03, cH + 0.06);
  const probe = new THREE.Vector3(0.04, cH + 0.02, 0.0);
  const bH = seekArena(H, +1, probe, floorH);
  pose(H, GRIPC, bH.arc, bH.rx, 0.6, -1, 0);
  const tH7 = tip(H).clone();
  const bP = seekArena(P, -1, tH7, floorP);
  pose(P, GRIPC, bP.arc, bP.rx, 0.6, -1, 0);
  const d = tip(P).distanceTo(tH7);
  console.log('ARENA %s | H %j | P %j', d.toFixed(3), bH, bP);

  function trap(hand, arcSign, restArc, restRx, restTipY) {
    const tgtY = restTipY - 0.14;
    let best = null;
    for (const c of [0.10, 0.18, 0.26, 0.36, 0.45])
      for (const a of [restArc, restArc * 0.75, restArc * 0.5, restArc * 0.25])
        for (const rx of [restRx + 0.2, restRx + 0.35, restRx + 0.5, restRx + 0.65, restRx + 0.8]) {
          pose(hand, { ...GRIPC, thumb: c }, a, rx, 0.6, -1, 0);
          const p = tip(hand);
          if (Math.abs(p.y - tgtY) > 0.07) continue;
          const cost = Math.abs(p.y - tgtY);
          if (!best || cost < best.cost) best = { cost, c, a: +a.toFixed(2), rx: +rx.toFixed(2), tip: p.toArray().map(v=>+v.toFixed(2)) };
        }
    return best || { c: 0.3, a: +(restArc*0.6).toFixed(2), rx: +(restRx+0.5).toFixed(2), tip: 'FALLBACK' };
  }
  function press(hand, arcSign, tgt) {
    let best = null;
    for (let arc = 0.0; arc <= 1.4; arc += 0.05)
      for (const rx of [-0.55, -0.4, -0.25, -0.1, 0]) {
        pose(hand, { ...GRIPC, thumb: 0.15 }, arcSign * arc, rx, 0.6, -1, 0);
        const p = tip(hand);
        const lat = Math.hypot(p.x - tgt.x, p.z - tgt.z);
        const above = p.y - tgt.y;
        if (above < 0.02 || above > 0.13) continue;
        const cost = lat + Math.abs(above - 0.06) * 0.5;
        if (!best || cost < best.cost) best = { cost: +cost.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, lat: +lat.toFixed(3), above: +above.toFixed(3) };
      }
    return best;
  }
  const vP = trap(P, -1, bP.arc, bP.rx, bP.tip[1]);
  pose(P, { ...GRIPC, thumb: vP.c }, vP.a, vP.rx, 0.6, -1, 0);
  const prH = press(H, +1, tip(P).clone());
  console.log('H_PIN victim %j | press %j', vP, prH);
  const vH = trap(H, +1, bH.arc, bH.rx, bH.tip[1]);
  pose(H, { ...GRIPC, thumb: vH.c }, vH.a, vH.rx, 0.6, -1, 0);
  const prP = press(P, -1, tip(H).clone());
  console.log('P_PIN victim %j | press %j', vH, prP);
}


// ═══ SWEEP8: measured crown, proud-but-crossing arena, pins ═══
if (process.argv[2] === 'sweep8') {
  const GRIPC = { thumb: 0.0, index: 0.62, middle: 0.74, ring: 0.78, pinky: 0.82 };
  P.holder.position.set(0.16, 0.24, 0);
  H.holder.position.set(-0.26, 0.24, 0);
  function crown() {
    pose(P, GRIPC, -0.5, -0.2, 0.6, -1, 0);
    pose(H, GRIPC,  0.4, -0.2, 0.6, -1, 0);
    let top = 0;
    const v = new THREE.Vector3();
    for (const hand of [P, H])
      for (const f of ['index', 'middle', 'ring'])
        for (const b of hand.bones[f]) if (b) { b.getWorldPosition(v); top = Math.max(top, v.y); }
    return top;
  }
  const CR = crown();
  const floorY = CR + 0.09;
  console.log('crown %s -> arena floor %s', CR.toFixed(2), floorY.toFixed(2));
  function seek8(hand, arcSign, tgt) {
    let best = null;
    for (let arc = 0.0; arc <= 1.3; arc += 0.04)
      for (const rx of [-0.4, -0.3, -0.2, -0.1, 0])
        for (const s2 of [0, 0.35]) {
          pose(hand, GRIPC, arcSign * arc, rx, 0.6, -1, s2);
          const p = tip(hand);
          if (p.y < floorY) continue;
          const d = p.distanceTo(tgt);
          if (!best || d < best.d) best = { d: +d.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, s2, tip: p.toArray().map(v=>+v.toFixed(2)) };
        }
    return best;
  }
  const probe = new THREE.Vector3(0.06, CR + 0.13, 0.0);
  const bH = seek8(H, +1, probe);
  pose(H, GRIPC, bH.arc, bH.rx, 0.6, -1, bH.s2);
  const tH8 = tip(H).clone();
  const bP = seek8(P, -1, tH8);
  pose(P, GRIPC, bP.arc, bP.rx, 0.6, -1, bP.s2);
  const d = tip(P).distanceTo(tH8);
  console.log('ARENA8 %s | H %j | P %j', d.toFixed(3), bH, bP);

  function trap8(hand, arcSign, rest) {
    const tgtY = rest.tip[1] - 0.13;
    let best = null;
    for (const c of [0.10, 0.18, 0.26, 0.36])
      for (const a of [rest.arc, rest.arc * 0.7, rest.arc * 0.4])
        for (const rx of [rest.rx + 0.25, rest.rx + 0.4, rest.rx + 0.55, rest.rx + 0.7]) {
          pose(hand, { ...GRIPC, thumb: c }, a, rx, 0.6, -1, 0);
          const p = tip(hand);
          if (Math.abs(p.y - tgtY) > 0.06) continue;
          if (!best || Math.abs(p.y - tgtY) < best.cost) best = { cost: Math.abs(p.y - tgtY), c, a: +(+a).toFixed(2), rx: +rx.toFixed(2), tip: p.toArray().map(v=>+v.toFixed(2)) };
        }
    return best;
  }
  function press8(hand, arcSign, tgt) {
    let best = null;
    for (let arc = 0.0; arc <= 1.5; arc += 0.04)
      for (const rx of [-0.6, -0.45, -0.3, -0.15, 0])
        for (const s2 of [0, 0.35]) {
          pose(hand, { ...GRIPC, thumb: 0.15 }, arcSign * arc, rx, 0.6, -1, s2);
          const p = tip(hand);
          const lat = Math.hypot(p.x - tgt.x, p.z - tgt.z);
          const above = p.y - tgt.y;
          if (above < 0.02 || above > 0.15) continue;
          const cost = lat + Math.abs(above - 0.06) * 0.4;
          if (!best || cost < best.cost) best = { cost: +cost.toFixed(3), arc: +(arcSign*arc).toFixed(2), rx, s2, lat: +lat.toFixed(3), above: +above.toFixed(3) };
        }
    return best;
  }
  const vP = trap8(P, -1, bP);
  pose(P, { ...GRIPC, thumb: vP.c }, vP.a, vP.rx, 0.6, -1, 0);
  const prH = press8(H, +1, tip(P).clone());
  console.log('H_PIN8 victim %j | press %j', vP, prH);
  const vH = trap8(H, +1, bH);
  pose(H, { ...GRIPC, thumb: vH.c }, vH.a, vH.rx, 0.6, -1, 0);
  const prP = press8(P, -1, tip(H).clone());
  console.log('P_PIN8 victim %j | press %j', vH, prP);
}


// ═══ AUDIT: every phase, every drag extreme — the design-system laws ═══
if (process.argv[2] === 'audit') {
  const GRIPC = { thumb: 0.0, index: 0.68, middle: 0.80, ring: 0.84, pinky: 0.88 };
  P.holder.position.set(0.13, 0.24, 0.07);
  H.holder.position.set(-0.23, 0.24, -0.07);
  const CONTACT = 0.11;
  function crown() {
    pose(P, GRIPC, 0, -0.1, 0.6, -1, 0);
    pose(H, GRIPC, 0.04, -0.1, 0.6, -1, 0.35);
    let top = 0; const v = new THREE.Vector3();
    for (const hand of [P, H]) for (const f of ['index','middle','ring'])
      for (const b of hand.bones[f]) if (b) { b.getWorldPosition(v); top = Math.max(top, v.y); }
    return top;
  }
  const CR = crown();
  const CASES = [
    ['neutral drag-L', { p: [0.36, -0.55, -0.05, 0], h: [0.36, 0.04, -0.05, 0.35] }],
    ['neutral center', { p: [0.36,  0.00, -0.05, 0], h: [0.36, 0.04, -0.05, 0.35] }],
    ['neutral drag-R', { p: [0.36,  0.55, -0.05, 0], h: [0.36, 0.04, -0.05, 0.35] }],
    ['h_tele',         { p: [0.36,  0.00, -0.05, 0], h: [0.36, 0.05,  0.00, 0.35] }],
    ['h_pin',          { p: [0.36,  0.00,  0.15, 0], h: [0.36, 1.12, -0.60, 0], pv: 0.36, hv: 0.15 }],
    ['p_pin',          { p: [0.36, -1.24, -0.75, 0], h: [0.36, 0.02,  0.15, 0], pv: 0.15, hv: 0.36 }],
  ];
  // weave density: opposing finger-bone pairs in mesh contact
  function weave() {
    pose(P, GRIPC, 0, -0.1, 0.6, -1, 0);
    pose(H, GRIPC, 0.04, -0.1, 0.6, -1, 0.35);
    const vp = new THREE.Vector3(), vh = new THREE.Vector3();
    let contacts = 0, minD = 9;
    for (const fp of ['index','middle','ring','pinky']) for (const bp of P.bones[fp]) {
      if (!bp) continue; bp.getWorldPosition(vp);
      for (const fh of ['index','middle','ring','pinky']) for (const bh of H.bones[fh]) {
        if (!bh) continue; bh.getWorldPosition(vh);
        const d = vp.distanceTo(vh);
        minD = Math.min(minD, d);
        if (d < 0.09) contacts++;
      }
    }
    return { contacts, minD: +minD.toFixed(3) };
  }
  const W = weave();
  console.log('crown %s | contact radius %s | WEAVE contacts %d, closest %s', CR.toFixed(2), CONTACT, W.contacts, W.minD);
  console.log('case            | tipP              | tipH              | dist  | dy    | verdict');
  for (const [name, c] of CASES) {
    const pc = c.pv !== undefined ? c.pv : 0.0;
    const hc = c.hv !== undefined ? c.hv : 0.0;
    pose(P, { ...GRIPC, thumb: pc }, c.p[1], c.p[2], 0.6, -1, c.p[3]);
    pose(H, { ...GRIPC, thumb: hc }, -c.h[1] * -1 === c.h[1] ? c.h[1] : c.h[1], c.h[2], 0.6, -1, c.h[3]);
    const tp = tip(P), th = tip(H);
    const d = tp.distanceTo(th), dy = tp.y - th.y;
    let verdict = 'ok';
    const lateral = Math.abs(dy) < 0.05;
    if (d < CONTACT && lateral) verdict = 'touch (resolver holds)';
    if (d < CONTACT - 0.025 && lateral) verdict = 'OVERLAP';
    if (name.startsWith('neutral') && Math.min(tp.y, th.y) < CR + 0.06) verdict += ' LOW';
    console.log('%s | [%s] | [%s] | %s | %s | %s',
      name.padEnd(15), tp.toArray().map(v=>v.toFixed(2)).join(','),
      th.toArray().map(v=>v.toFixed(2)).join(','),
      d.toFixed(3), dy.toFixed(3), verdict);
  }
}


// ═══ ADDUCT: squeeze each hand's fingers together — measure, don't guess ═══
if (process.argv[2] === 'adduct') {
  const GRIPC = { thumb: 0.0, index: 0.68, middle: 0.80, ring: 0.84, pinky: 0.88 };
  P.holder.position.set(0.13, 0.24, 0.07);
  H.holder.position.set(-0.23, 0.24, -0.07);
  const FING = ['index', 'middle', 'ring', 'pinky'];
  const PATTERN = { index: 1, middle: 0.33, ring: -0.33, pinky: -1 };
  function poseAdduct(hand, axis, s) {
    for (const f of FING) {
      const names = GLB_FINGER_BONES[f];
      hand.bones[f].forEach((b, k) => {
        if (!b) return;
        b.quaternion.copy(hand.bind[names[k]])
          .multiply(new THREE.Quaternion().setFromAxisAngle(_AX, -GRIPC[f] * GLB_CLOSE[k]));
        if (k === 0 && s) {
          const A = axis === 'y' ? _AY : _AZ;
          b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(A, PATTERN[f] * s));
        }
      });
    }
    hand.scene.updateMatrixWorld(true);
  }
  function spread(hand) {
    const v = new THREE.Vector3();
    const tips = FING.map(f => {
      const c = hand.bones[f].filter(Boolean);
      c[c.length - 1].getWorldPosition(v);
      return v.clone();
    });
    let sum = 0, mn = 9;
    for (let i = 0; i < 3; i++) {
      const d = tips[i].distanceTo(tips[i + 1]);
      sum += d; mn = Math.min(mn, d);
    }
    return { mean: +(sum / 3).toFixed(3), min: +mn.toFixed(3) };
  }
  poseAdduct(P, 'z', 0); poseAdduct(H, 'z', 0);
  console.log('baseline spread  P %j  H %j', spread(P), spread(H));
  let best = null;
  for (const axis of ['y', 'z'])
    for (const sign of [1, -1])
      for (const st of [0.14, 0.18, 0.22, 0.26, 0.30]) {
        poseAdduct(P, axis, sign * st); poseAdduct(H, axis, sign * st);
        const sp = spread(P), sh = spread(H);
        if (sp.min < 0.055 || sh.min < 0.055) continue;   // fingers must not merge
        const score = sp.mean + sh.mean;
        if (!best || score < best.score) best = { score: +score.toFixed(3), axis, s: sign * st, P: sp, H: sh };
      }
  console.log('ADDUCT best:', JSON.stringify(best));
}
