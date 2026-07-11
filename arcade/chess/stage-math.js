/* ═════════════════════════════════════════════════════════════════════
   UNSURFACED — CABINET 05 · CHESS — STAGE MATH
   The measured law of the 3D table. Pure module: no DOM, no three.js.
   Board mapping · low-poly piece profiles · the procedural Hand
   (validated RPS FINGER_SPEC lineage) · pinch FK · move choreography.
   This exact code drives the deliverable, the Node proof, and the
   pyrender proof-sheet dump — one implementation, zero divergence.
   ═════════════════════════════════════════════════════════════════════ */

/* ── board ──────────────────────────────────────────────────────── */
export const BOARD = {
  N: 8, S: 1.0,                       /* square size = 1 world unit */
  TILE_H: 0.10,                       /* board slab thickness */
  RIM: 0.42,                          /* black surround width */
};

export function sqToWorld(name) {
  var f = name.charCodeAt(0) - 97;    /* a..h -> 0..7 */
  var r = name.charCodeAt(1) - 49;    /* 1..8 -> 0..7 */
  return { x: -3.5 + f, z: 3.5 - r }; /* rank 1 south (player side) */
}
export function worldToSq(x, z) {
  var f = Math.round(x + 3.5), r = Math.round(3.5 - z);
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  return 'abcdefgh'[f] + (r + 1);
}

/* ── low-poly pieces: lathe profiles [radius, y] + accent boxes ──── */
export const PIECE_SEGMENTS = 48;     /* radial segments — the hyperreal law */
export const PIECE_SCALE = 1.14;      /* presence dial — pieces claim their squares */
export const PROFILE_SMOOTH = 72;     /* Catmull-Rom samples along each profile */
/* Staunton-inflected profiles: denser control points, same heights and crown
   radii as the proven set — the pinch law and hold math stand untouched. */
export const PIECES = {
  p: { h: 0.60, crownR: 0.105, boxes: [], profile: [
    [0.27,0],[0.27,0.045],[0.24,0.075],[0.155,0.105],[0.125,0.16],[0.108,0.24],
    [0.10,0.30],[0.125,0.345],[0.155,0.375],[0.125,0.405],[0.105,0.43],
    [0.132,0.475],[0.148,0.52],[0.132,0.555],[0.09,0.585],[0,0.60]] },
  r: { h: 0.70, crownR: 0.16, profile: [
    [0.285,0],[0.285,0.05],[0.25,0.085],[0.185,0.115],[0.158,0.17],[0.142,0.28],
    [0.136,0.40],[0.15,0.45],[0.20,0.49],[0.208,0.53],[0.196,0.60],[0.196,0.655],
    [0.16,0.655],[0.16,0.70],[0,0.70]],
       boxes: [ { s:[0.085,0.10,0.085], p:[ 0.155,0.67,0], r:[0,0,0] }, { s:[0.085,0.10,0.085], p:[-0.155,0.67,0], r:[0,0,0] },
                { s:[0.085,0.10,0.085], p:[0,0.67, 0.155], r:[0,0,0] }, { s:[0.085,0.10,0.085], p:[0,0.67,-0.155], r:[0,0,0] } ] },
  n: { h: 0.78, crownR: 0.13, boxes: [], profile: [
    [0.285,0],[0.285,0.05],[0.25,0.085],[0.18,0.115],[0.155,0.17],[0.14,0.25],
    [0.135,0.31],[0.16,0.345],[0.175,0.36],[0,0.36]],
       /* the head: a true silhouette (x forward, y up), extruded + beveled */
       head: [
    [-0.115,0.34],[-0.135,0.46],[-0.125,0.585],[-0.10,0.685],[-0.075,0.755],
    [-0.028,0.78],[0.012,0.73],[0.052,0.712],[0.118,0.678],[0.168,0.638],
    [0.176,0.60],[0.128,0.585],[0.085,0.555],[0.062,0.505],[0.078,0.45],
    [0.098,0.40],[0.10,0.355],[0.06,0.335]],
       headDepth: 0.13 },
  b: { h: 0.82, crownR: 0.095, boxes: [], profile: [
    [0.285,0],[0.285,0.05],[0.25,0.085],[0.175,0.115],[0.145,0.18],[0.125,0.28],
    [0.115,0.38],[0.145,0.425],[0.172,0.455],[0.138,0.49],[0.098,0.515],
    [0.128,0.565],[0.148,0.625],[0.132,0.685],[0.095,0.735],[0.052,0.77],
    [0.062,0.79],[0.04,0.808],[0,0.82]] },
  q: { h: 0.94, crownR: 0.13, boxes: [], profile: [
    [0.305,0],[0.305,0.05],[0.27,0.09],[0.195,0.125],[0.162,0.20],[0.14,0.32],
    [0.128,0.45],[0.152,0.50],[0.192,0.545],[0.155,0.585],[0.112,0.615],
    [0.152,0.675],[0.188,0.745],[0.168,0.79],[0.128,0.822],[0.078,0.855],
    [0.062,0.878],[0.088,0.902],[0.062,0.925],[0,0.94]] },
  k: { h: 1.02, crownR: 0.13, profile: [
    [0.315,0],[0.315,0.05],[0.28,0.09],[0.205,0.13],[0.168,0.21],[0.148,0.34],
    [0.136,0.47],[0.158,0.525],[0.198,0.57],[0.16,0.61],[0.118,0.638],
    [0.158,0.70],[0.192,0.775],[0.168,0.825],[0.128,0.862],[0.062,0.888],[0,0.90]],
       boxes: [ { s:[0.045,0.16,0.045], p:[0,0.965,0], r:[0,0,0] }, { s:[0.125,0.045,0.045], p:[0,0.975,0], r:[0,0,0] } ] },
};

/* the scale is applied HERE, once — every consumer (geometry, choreography,
   proofs, sweeps, dumps) reads the already-scaled spec */
(function () {
  for (var k in PIECES) {
    var P = PIECES[k];
    P.h *= PIECE_SCALE; P.crownR *= PIECE_SCALE;
    P.profile = P.profile.map(function (pt) { return [pt[0] * PIECE_SCALE, pt[1] * PIECE_SCALE]; });
    P.boxes = P.boxes.map(function (b) {
      return { s: b.s.map(function (v) { return v * PIECE_SCALE; }),
               p: b.p.map(function (v) { return v * PIECE_SCALE; }), r: b.r };
    });
    if (P.head) {
      P.head = P.head.map(function (pt) { return [pt[0] * PIECE_SCALE, pt[1] * PIECE_SCALE]; });
      P.headDepth *= PIECE_SCALE;
    }
  }
})();

/* ── the Hand: validated RPS procedural spec (palm-half-width units).
   Modelling frame: fingers +Y, palm faces +Z. ───────────────────── */
export const FINGER_SPEC = [
  { name:'index',  base:[-0.32, 0.40, 0.00], splay: 0.05, lens:[0.48,0.32,0.25], radii:[0.112,0.099,0.084,0.058] },
  { name:'middle', base:[-0.10, 0.44, 0.015],splay: 0.00, lens:[0.56,0.37,0.27], radii:[0.118,0.104,0.088,0.061] },
  { name:'ring',   base:[ 0.11, 0.41, 0.00], splay:-0.05, lens:[0.50,0.34,0.26], radii:[0.110,0.097,0.082,0.058] },
  { name:'pinky',  base:[ 0.31, 0.36,-0.01], splay:-0.13, lens:[0.39,0.27,0.22], radii:[0.096,0.085,0.072,0.050] },
];
export const THUMB_SPEC = { name:'thumb', base:[-0.42,-0.02,0.12], rotZ:1.12, rotX:-0.70, lens:[0.35,0.28], radii:[0.128,0.110,0.088] };
export const FINGER_CLOSE = [1.45, 1.68, 1.05];   /* MCP, PIP, DIP at curl=1 */
export const THUMB_CLOSE  = [1.00, 0.95];
export const PALM_SPINE = [[0,0.40,0],[0,0.14,0],[-0.02,-0.14,0],[-0.02,-0.40,0],[-0.02,-0.72,0]];
export const PALM_RADII = [0.44,0.48,0.42,0.30,0.24];
export const PALM_FLAT  = [1.08,1.0,0.56];

/* the player's seat: low and close — not quite eye level, board full in frame,
   both hands living at their rails. THE dial Fresco's screenshots tune. */
export const CAMERA = { pos: [0, 5.8, 8.6], look: [0, 0.35, -1], fov: 66 };  /* SWEEP-BAKED, edge-kiss law: area 32.7%, pitch 29.6, sep 0.115 */
/* the drama cam — the reference gameplay angle, live while a hand travels.
   Dives toward the action, eases home to the seat for your input. */
export const CAMERA_ACTION = {
  y: 1.9, z: 6.6, fov: 52, lookY: 0.55,
  xFollow: 0.45,          /* eye slides toward the action file */
  lookFollow: 0.75,       /* gaze leads onto the action square */
  easeIn: 0.55, easeOut: 0.7,
};

export const HAND = {
  SCALE: 1.15,               /* palm-half-width units -> board squares — presence dial */
  TILT: 0.42,                /* extra pitch: fingertips angle down at the table */
  HOVER_Y: 2.0,              /* wrist height while travelling */
  APEX_Y: 2.35,              /* carry-arc apex — clears the king with margin */
  HOLD_Y: 1.50,              /* held-piece hover: lifted clear, waiting on command */
  REST: { w: { x: 2.2, y: 1.0, z: 4.6 }, b: { x: -1.9, y: 1.2, z: -4.6 } },  /* SWEEP-BAKED: both rails in frame */
  /* curl poses — GRIP baked by tools/sweep_grip.mjs, never eyeballed */
  OPEN: { thumb: 0.30, index: 0.26, middle: 0.33, ring: 0.42, pinky: 0.50, opposeK: 0 },  /* the relaxed drape — fingers rest, never splay */
  GRIP: { thumb: 0.50, index: 0.65, middle: 0.65, ring: 0.72, pinky: 0.80, opposeK: 1 },  /* SWEEP-BAKED at PIECE_SCALE 1.14: gap = 0.268 = crown diameter, err 0.0001 */
  GRIP_DROP: 0.30,           /* wrist descends this far below hover to pinch */
  GRIP_OPPOSE: { z: -1.00, x: 0.90 },   /* SWEEP-BAKED thumb opposition (rescaled table) */
  GRIP_OPPOSE_NONE: { z: 0.0, x: 0.0 },
};

/* ── THE HAND (the brand GLB) — transplant constants, all Node-measured
   against the byte-verified rig (sha 66e0eb…322c). Q_BASE maps the rig
   into the modelling frame exactly (F->+Y, N->+Z verified); FIT matches
   the procedural hand's reach; GRIP swept on the rig itself:
   pinch gap 0.2347 vs crown 0.235 (err 0.0003). ─────────────────── */
export const GLB_SPEC = {
  SHA_PREFIX: '66e0ebb444fecaca',
  BONES: {
    index:  ['Bone',    'Bone.001','Bone.002'],
    middle: ['Bone.003','Bone.004','Bone.005'],
    ring:   ['Bone.006','Bone.007','Bone.008'],
    pinky:  ['Bone.009','Bone.010','Bone.011'],
    thumb:  ['Bone.017','Bone.018','Bone.019'],
  },
  WRIST: 'Bone.016',
  CLOSE: [1.15, 1.5, 1.35], THUMB_CLOSE: [0.9, 0.7, 0.7],
  ADDUCT: { index: -0.26, middle: -0.086, ring: 0.086, pinky: 0.26 },
  Q_BASE: [-0.65297, -0.064231, -0.005689, 0.754634],
  FIT: 2.2444, ANCHOR: [-0.681, 0.59718, 0.46988],
  GRIP: { thumb: 0.86, index: 0.66, middle: 0.66, ring: 0.80, pinky: 0.85 },
  PINCH_OPEN: [0.4068, 1.4172, 0.3454],
  PINCH_GRIP: [-0.1906, 0.9566, 0.5789],
  /* the ecosystem skins: THE Hand's shipped tone for you; the dark Hand across */
  SKIN: { w: '#CE9E7A', b: '#4A3428' },
  SHEEN: { w: 0xff6a4a, b: 0x66261a },
};

/* ── THE STADIUM — the black depth, the pooled light, the brand ──── */
export const STADIUM = {
  FOG: { color: 0x0A0A0A, near: 10, far: 26 },   /* the gamespace dissolves into the page */
  KEY_SPOT:  { pos: [0, 13, 2.5], intensity: 260, angle: 0.52, penumbra: 0.45, color: 0xFFF2E0 },
  RIM_SPOTS: [ { pos: [-7, 6.5, -7], intensity: 90, color: 0xDCE6FF },
               { pos: [ 7, 6.5, -7], intensity: 90, color: 0xFFE2D0 } ],
  AMBIENT: 0.10, ENV: 0.32,
  HOARDING: { pos: [0, 0.34, -6.3], w: 4.8, logoOpacity: 0.9 },   /* the arena fascia across the table */
  DECAL:    { pos: [0, 6.05], w: 3.2, opacity: 0.30 },            /* the floor mark on the felt, south */
  LOGO_ASPECT: 10.156,
};

/* ── THE ORBIT — the whole table, from any side, by your finger ──── */
export const ORBIT = {
  POLAR_MIN: 0.24,          /* radians from zenith-complement: never under the felt */
  POLAR_MAX: 1.32,          /* never gimbal-locked overhead */
  SPEED_X: 0.0075,          /* radians per pixel, azimuth */
  SPEED_Y: 0.0055,          /* radians per pixel, polar */
  TAP_SLOP: 8,              /* pixels of movement before a tap becomes a drag */
  HOME_EPS: 0.05,           /* how far from the seat counts as wandered */
  R_MIN: 0.55, R_MAX: 1.35, /* zoom clamps, as multiples of the seat radius */
  WHEEL_SPEED: 0.0011,      /* wheel/trackpad-pinch: exp scale per deltaY */
  PINCH_GAIN: 1.0,          /* two-finger pinch: 1:1 distance ratio */
};

/* the seat expressed spherically around its own look point */
export function seatSpherical() {
  var dx = CAMERA.pos[0] - CAMERA.look[0];
  var dy = CAMERA.pos[1] - CAMERA.look[1];
  var dz = CAMERA.pos[2] - CAMERA.look[2];
  var r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return {
    r: r,
    phi: Math.acos(Math.max(-1, Math.min(1, dy / r))),   /* from +Y */
    theta: Math.atan2(dx, dz),                            /* around Y, 0 = south */
    pivot: [CAMERA.look[0], CAMERA.look[1], CAMERA.look[2]],
  };
}

/* a camera pose on the orbit sphere — same pivot, same radius, any angle */
export function orbitPose(theta, phi, rScale) {
  var s = seatSpherical();
  var p = Math.max(ORBIT.POLAR_MIN, Math.min(ORBIT.POLAR_MAX, phi));
  var rs = Math.max(ORBIT.R_MIN, Math.min(ORBIT.R_MAX, rScale === undefined ? 1 : rScale));
  var r = s.r * rs;
  var sp = Math.sin(p);
  return {
    eye: [s.pivot[0] + r * sp * Math.sin(theta),
          s.pivot[1] + r * Math.cos(p),
          s.pivot[2] + r * sp * Math.cos(theta)],
    look: s.pivot.slice(),
    fov: CAMERA.fov,
  };
}

/* ── tiny vec/mat kit ───────────────────────────────────────────── */
function Rx(a){var c=Math.cos(a),s=Math.sin(a);return [1,0,0, 0,c,-s, 0,s,c];}
function Ry(a){var c=Math.cos(a),s=Math.sin(a);return [c,0,s, 0,1,0, -s,0,c];}
function Rz(a){var c=Math.cos(a),s=Math.sin(a);return [c,-s,0, s,c,0, 0,0,1];}
function mmul(A,B){var o=new Array(9);for(var r=0;r<3;r++)for(var c=0;c<3;c++)o[r*3+c]=A[r*3]*B[c]+A[r*3+1]*B[3+c]+A[r*3+2]*B[6+c];return o;}
function mv(A,v){return [A[0]*v[0]+A[1]*v[1]+A[2]*v[2], A[3]*v[0]+A[4]*v[1]+A[5]*v[2], A[6]*v[0]+A[7]*v[1]+A[8]*v[2]];}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function scale(v,s){return [v[0]*s,v[1]*s,v[2]*s];}
export function dist(a,b){var dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];return Math.sqrt(dx*dx+dy*dy+dz*dz);}

/* ── hand FK ────────────────────────────────────────────────────────
   pose = { pos:[x,y,z] (wrist, world), side:'w'|'b', curl:{thumb..pinky} }
   Right hand both sides; the player's is the house's turned 180 (yaw).
   Returns capsules [{p0,p1,r0,r1}], spheres [{p,rx,ry,rz}] (palm),
   tips { thumb, index, ... }, pinch (midpoint thumb/index tips),
   palmNormal, fingerDir — everything in world units. ─────────────── */
export function handFK(pose) {
  var yaw = pose.side === 'w' ? Math.PI : 0;
  var R = mmul(Ry(yaw), Rx(Math.PI / 2 + HAND.TILT));
  var S = HAND.SCALE, P = [pose.pos[0], pose.pos[1], pose.pos[2]];
  var W = function (localPt) { return add(P, mv(R, scale(localPt, S))); };
  var capsules = [], spheres = [], tips = {};

  /* palm: ellipsoid beads along the spine + connective capsules */
  for (var i = 0; i < PALM_SPINE.length; i++) {
    var r = PALM_RADII[i];
    spheres.push({ p: W(PALM_SPINE[i]), rx: r*PALM_FLAT[0]*S, ry: r*0.9*S, rz: r*PALM_FLAT[2]*S });
    if (i > 0) capsules.push({ p0: W(PALM_SPINE[i-1]), p1: W(PALM_SPINE[i]),
      r0: PALM_RADII[i-1]*PALM_FLAT[2]*S, r1: r*PALM_FLAT[2]*S });
  }

  /* fingers: chain of segments; curl bends toward the palm (+Z local) */
  for (var f = 0; f < FINGER_SPEC.length; f++) {
    var fs = FINGER_SPEC[f];
    var curl = pose.curl[fs.name] !== undefined ? pose.curl[fs.name] : 0;
    var M = Rz(fs.splay);
    var pt = fs.base.slice();
    var tip = pt;
    for (var s = 0; s < fs.lens.length; s++) {
      M = mmul(M, Rx(curl * FINGER_CLOSE[s]));
      var nxt = add(pt, mv(M, [0, fs.lens[s], 0]));
      capsules.push({ p0: W(pt), p1: W(nxt), r0: fs.radii[s]*S, r1: fs.radii[s+1]*S });
      pt = nxt; tip = nxt;
    }
    tips[fs.name] = W(tip);
  }

  /* thumb — opposition (extra rotZ/rotX) lets it meet the index in a pinch */
  var ts = THUMB_SPEC;
  var tCurl = pose.curl.thumb !== undefined ? pose.curl.thumb : 0;
  var opp = pose.oppose || HAND.GRIP_OPPOSE;
  var oz = (pose.curl.opposeK !== undefined ? pose.curl.opposeK : 0);
  var TM = mmul(Rz(ts.rotZ + opp.z * oz), Rx(ts.rotX + opp.x * oz));
  var tp = ts.base.slice(), ttip = tp;
  for (var u = 0; u < ts.lens.length; u++) {
    TM = mmul(TM, Rx(tCurl * THUMB_CLOSE[u]));
    var tn = add(tp, mv(TM, [0, ts.lens[u], 0]));
    capsules.push({ p0: W(tp), p1: W(tn), r0: ts.radii[u]*S, r1: ts.radii[u+1]*S });
    tp = tn; ttip = tn;
  }
  tips.thumb = W(ttip);

  var pinch = scale(add(tips.thumb, tips.index), 0.5);
  return {
    capsules: capsules, spheres: spheres, tips: tips, pinch: pinch,
    palmNormal: mv(R, [0, 0, 1]),
    fingerDir: mv(R, [0, 1, 0]),
  };
}

/* the pinch point in wrist-local terms: measured once, reused everywhere.
   When HAND.PINCH_OVERRIDE is set (THE Hand transplant live), the override
   points (modelling frame) blend by opposeK and rotate through the same
   wrist orientation the FK uses — one law for both skins. */
export function pinchOffset(curl) {
  var ov = HAND.PINCH_OVERRIDE;
  if (ov) {
    var k = curl.opposeK !== undefined ? curl.opposeK : 0;
    var m = [ov.open[0] + (ov.grip[0] - ov.open[0]) * k,
             ov.open[1] + (ov.grip[1] - ov.open[1]) * k,
             ov.open[2] + (ov.grip[2] - ov.open[2]) * k];
    return mv(Rx(Math.PI / 2 + HAND.TILT), m);
  }
  var fk = handFK({ pos: [0, 0, 0], side: 'b', curl: curl });
  return fk.pinch;   /* world == local when wrist at origin, side b (yaw 0) */
}

/* wrist orientation as a quaternion [x,y,z,w] — R = Ry(yaw) * Rx(PI/2+TILT) */
export function poseQuat(side) {
  var yaw = side === 'w' ? Math.PI : 0;
  var a = (Math.PI / 2 + HAND.TILT) / 2, b = yaw / 2;
  var qx = [Math.sin(a), 0, 0, Math.cos(a)];
  var qy = [0, Math.sin(b), 0, Math.cos(b)];
  return [
    qy[3]*qx[0] + qy[0]*qx[3] + qy[1]*qx[2] - qy[2]*qx[1],
    qy[3]*qx[1] - qy[0]*qx[2] + qy[1]*qx[3] + qy[2]*qx[0],
    qy[3]*qx[2] + qy[0]*qx[1] - qy[1]*qx[0] + qy[2]*qx[3],
    qy[3]*qx[3] - qy[0]*qx[0] - qy[1]*qx[1] - qy[2]*qx[2],
  ];
}

/* place the wrist so the pinch lands exactly at target (world) */
export function wristForPinchAt(target, side, curl) {
  var off = pinchOffset(curl);
  if (side === 'w') { off = [-off[0], off[1], -off[2]]; }   /* yaw PI flips x,z */
  return [target[0] - off[0], target[1] - off[1], target[2] - off[2]];
}

/* ── choreography ───────────────────────────────────────────────────
   Split lanes so the piece answers the player's command literally:
   PICKUP  : hover -> descend -> grip -> lift          (ends HOLDING)
   CARRY   : carry -> lower -> release -> retreat      (from the hold)
   PUTBACK : lower -> release -> retreat               (deselect law)
   FULL    : pickup + carry in one arc (the Hand's own moves)
   Continuity is exact at every seam: hold pose == carry start ==
   putback start. Captured piece sinks during LOWER.               */
export const TIMES = { hover:0.42, descend:0.30, grip:0.22, lift:0.26, carry:0.55, lower:0.28, release:0.20, retreat:0.45 };
export const PH_FULL = ['hover','descend','grip','lift','carry','lower','release','retreat'];
export const PH_PICKUP = ['hover','descend','grip','lift'];
export const PH_CARRY = ['carry','lower','release','retreat'];
export const PH_PUTBACK = ['lower','release','retreat'];
export const PHASES = PH_FULL;

function planFromPhases(rec, names) {
  var fromW = sqToWorld(rec.from), toW = sqToWorld(rec.to);
  var kind = rec.piece.toLowerCase();
  var crownY = PIECES[kind].h - 0.02;
  var t = 0, segs = [];
  for (var i = 0; i < names.length; i++) {
    var d = TIMES[names[i]];
    segs.push({ name: names[i], t0: t, t1: t + d });
    t += d;
  }
  return { rec: rec, segs: segs, dur: t, fromW: fromW, toW: toW, crownY: crownY,
           victimSq: rec.victimSq || (rec.capture ? rec.to : null) };
}
export function planMove(rec)    { return planFromPhases(rec, PH_FULL); }
export function planPickup(rec)  { return planFromPhases(rec, PH_PICKUP); }
export function planCarry(rec)   { return planFromPhases(rec, PH_CARRY); }
export function planPutback(rec) {
  var r2 = { side: rec.side, from: rec.from, to: rec.from, piece: rec.piece, capture: null, victimSq: null, promo: null };
  return planFromPhases(r2, PH_PUTBACK);
}

function easeInOut(k){ return k*k*(3-2*k); }
function lerp(a,b,k){ return a+(b-a)*k; }
function lerpCurl(a,b,k){ var o={}; for(var n in a) o[n]=lerp(a[n], b[n], k); return o; }

/* the canonical idle pose — plan endpoints meet it exactly, no seams */
export function restPose(side) {
  var r = HAND.REST[side];
  return { pos: [r.x, r.y + 0.8, r.z], side: side, curl: HAND.OPEN };
}
/* the canonical hold pose — a piece pinched at HOLD_Y over its square */
export function holdPose(rec) {
  var p = planPickup(rec);
  return samplePlan(p, p.dur);
}

export function samplePlan(plan, time) {
  var r = plan.rec, side = r.side;
  var rest = HAND.REST[side];
  var gripY = plan.crownY + 0.02;
  var seg = null, k = 0;
  for (var i = 0; i < plan.segs.length; i++) {
    var s = plan.segs[i];
    if (time <= s.t1 || i === plan.segs.length - 1) { seg = s; k = Math.min(1, Math.max(0, (time - s.t0) / (s.t1 - s.t0))); break; }
  }
  k = easeInOut(k);
  var fx = plan.fromW.x, fz = plan.fromW.z, tx = plan.toW.x, tz = plan.toW.z;
  var curl = HAND.OPEN, pinchT = null, carried = 0, victimK = 0, wrist;

  function wristOverPinch(px, py, pz, c) {
    return wristForPinchAt([px, py, pz], side, c);
  }
  var n = seg.name;
  if (n === 'hover') {
    var w0 = wristOverPinch(fx, HAND.HOVER_Y - 0.6, fz, HAND.OPEN);
    wrist = [lerp(rest.x, w0[0], k), lerp(rest.y + 0.8, w0[1], k), lerp(rest.z, w0[2], k)];
  } else if (n === 'descend') {
    var y = lerp(HAND.HOVER_Y - 0.6, gripY, k);
    wrist = wristOverPinch(fx, y, fz, HAND.OPEN);
  } else if (n === 'grip') {
    curl = lerpCurl(HAND.OPEN, HAND.GRIP, k);
    wrist = wristOverPinch(fx, gripY, fz, curl);
  } else if (n === 'lift') {
    curl = HAND.GRIP; carried = 1;
    var y2 = lerp(gripY, HAND.HOLD_Y, k);
    wrist = wristOverPinch(fx, y2, fz, curl);
  } else if (n === 'carry') {
    curl = HAND.GRIP; carried = 1;
    var px = lerp(fx, tx, k), pz = lerp(fz, tz, k);
    var py = HAND.HOLD_Y + Math.sin(k * Math.PI) * (HAND.APEX_Y - HAND.HOLD_Y);
    wrist = wristOverPinch(px, py, pz, curl);
  } else if (n === 'lower') {
    curl = HAND.GRIP; carried = 1; victimK = k;
    var y3 = lerp(HAND.HOLD_Y, gripY, k);
    wrist = wristOverPinch(tx, y3, tz, curl);
  } else if (n === 'release') {
    curl = lerpCurl(HAND.GRIP, HAND.OPEN, k); victimK = 1;
    wrist = wristOverPinch(tx, gripY, tz, HAND.GRIP);
  } else { /* retreat — depart from EXACTLY where release parked the wrist */
    victimK = 1;
    var w1 = wristOverPinch(tx, gripY, tz, HAND.GRIP);
    wrist = [lerp(w1[0], rest.x, k),
             lerp(w1[1], rest.y + 0.8, k) + Math.sin(k * Math.PI) * 0.5,
             lerp(w1[2], rest.z, k)];
  }

  var pose = { pos: wrist, side: side, curl: curl };
  if (carried) {
    var off = pinchOffset(curl);
    if (side === 'w') off = [-off[0], off[1], -off[2]];
    pinchT = [wrist[0] + off[0], wrist[1] + off[1], wrist[2] + off[2]];
  }
  return {
    phase: n, pose: pose,
    carriedPiecePos: carried ? [pinchT[0], pinchT[1] - plan.crownY, pinchT[2]] : null,
    victimSinkK: plan.victimSq ? victimK : 0,
    done: time >= plan.dur,
  };
}
