/* ═════════════════════════════════════════════════════════════════════
   UNSURFACED — CABINET 05 · CHESS — THE 3D STAGE
   Aerial table. Two hands work the board: yours from the south rail,
   THE Hidden Hand from the north. Every pose comes from STAGEMATH —
   the same FK the proofs measured. Resilience by construction: no
   three-on until the first frame renders; every frame in armor; any
   throw tears down to the proven 2D plane below.
   GLB slot: a #handGlb tag (byte-identical brand carrier) transplants
   THE Hand here when the bytes arrive; the procedural pair is the
   working default and the permanent glb_fallback.
   ═════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* UNSURFACED wordmark — ivory on transparent, extracted from the brand master */
var LOGO_B64 = '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';

(function () {
  'use strict';
  var SM = window.STAGEMATH, CAB = window.CABINET;
  if (!SM || !CAB) return;

  var COLORS = {
    bg: 0x0A0A0A, rim: 0x111111, tileLight: 0xF5F0E8, tileDark: 0x1A1A1A,
    pieceW: 0xFAF7F2, pieceB: 0xC41230, handW: 0xCE9E7A, handB: 0x4A3428,   /* the ecosystem skins */
    hot: 0xFF3333,
  };
  var mount = document.getElementById('stage3d');
  var renderer, scene, camera, raycaster, boardPlane;
  var pieceGroup, piecePool = {}, highlightGroup, hands = {};
  var raf = 0, dead = false, clock = null, MERGE = null;
  var activeDone = null;
  var carriedMesh = null, victimMesh = null, hiddenSquares = {};

  function info(tag, detail) {
    try { console.info('[stage3d] ' + tag, detail || ''); } catch (e) {}
  }
  function log(tag, detail) {
    try { console.warn('[stage3d] ' + tag, detail || ''); } catch (e) {}
  }
  function teardown(reason, err) {
    if (dead) return;
    dead = true;
    log('three_fallback', reason + (err && err.message ? ' :: ' + err.message : ''));
    try { cancelAnimationFrame(raf); } catch (e) {}
    try { document.body.classList.remove('three-on'); } catch (e) {}
    try { if (renderer) { renderer.dispose(); mount.innerHTML = ''; } } catch (e) {}
    try { delete window.__STAGE__; } catch (e) { window.__STAGE__ = undefined; }
    if (activeDone) { var d = activeDone; activeDone = null; d(); }
    try { CAB.tap && window.CABINET; } catch (e) {}
  }
  window.addEventListener('error', function (ev) {
    if (!dead && ev && ev.filename === '') log('window_error', ev.message);
  });

  /* ── materials + geometry kits ─────────────────────────────────── */
  function std(color, rough, flat) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: rough === undefined ? 0.6 : rough,
      metalness: 0.05, flatShading: !!flat });
  }
  function lacquer(color, rough, coat) {
    return new THREE.MeshPhysicalMaterial({ color: color,
      roughness: rough, metalness: 0.0,
      clearcoat: coat, clearcoatRoughness: 0.22,
      sheen: 0.15, sheenRoughness: 0.6 });
  }
  /* procedural wood grain — no assets, all canvas */
  function woodTexture(base, streak, dark) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 34; i++) {
      g.strokeStyle = streak;
      g.globalAlpha = 0.05 + Math.random() * 0.10;
      g.lineWidth = 0.6 + Math.random() * 2.2;
      var x0 = Math.random() * 256, amp = 2 + Math.random() * 5, ph = Math.random() * 6.28;
      g.beginPath();
      for (var y = 0; y <= 256; y += 8) g.lineTo(x0 + Math.sin(y * 0.03 + ph) * amp, y);
      g.stroke();
    }
    g.globalAlpha = dark ? 0.10 : 0.05;
    for (var j = 0; j < 500; j++) {
      g.fillStyle = streak;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1 + Math.random() * 2);
    }
    g.globalAlpha = 1;
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function woodMat(base, streak, dark) {
    return new THREE.MeshPhysicalMaterial({ map: woodTexture(base, streak, dark),
      roughness: 0.34, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.28 });
  }
  var MAT = {
    w: lacquer(COLORS.pieceW, 0.26, 0.75), b: lacquer(COLORS.pieceB, 0.22, 0.85),
    handW: std(COLORS.handW, 0.62), handB: std(COLORS.handB, 0.62),
    dot: new THREE.MeshBasicMaterial({ color: COLORS.hot, transparent: true, opacity: 0.55 }),
    ring: new THREE.MeshBasicMaterial({ color: COLORS.hot, transparent: true, opacity: 0.7 }),
    sel: new THREE.MeshBasicMaterial({ color: COLORS.hot, transparent: true, opacity: 0.85 }),
    last: new THREE.MeshBasicMaterial({ color: 0xC41230, transparent: true, opacity: 0.22 }),
    chk: new THREE.MeshBasicMaterial({ color: COLORS.hot, transparent: true, opacity: 0.4 }),
  };

  function pieceGeometry(kind) {
    var spec = SM.PIECES[kind];
    /* Catmull-Rom through the control points: organic Staunton curvature */
    var ctrl = [new THREE.Vector3(0, 0, 0)];
    for (var i = 0; i < spec.profile.length; i++)
      ctrl.push(new THREE.Vector3(spec.profile[i][0], spec.profile[i][1], 0));
    var curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5);
    var raw = curve.getPoints(SM.PROFILE_SMOOTH);
    /* monotonic-rise clamp: spline overshoot would fold the lathe surface */
    var pts = [], yMax = -1;
    for (var q = 0; q < raw.length; q++) {
      yMax = Math.max(yMax, raw[q].y);
      pts.push(new THREE.Vector2(Math.max(0, raw[q].x), yMax));
    }
    var g = new THREE.LatheGeometry(pts, SM.PIECE_SEGMENTS);
    g.computeVertexNormals();
    var head = null;
    if (spec.head) {
      var shape = new THREE.Shape();
      shape.moveTo(spec.head[0][0], spec.head[0][1]);
      for (var k = 1; k < spec.head.length; k++) shape.lineTo(spec.head[k][0], spec.head[k][1]);
      shape.closePath();
      head = new THREE.ExtrudeGeometry(shape, { depth: spec.headDepth, bevelEnabled: true,
        bevelThickness: 0.02, bevelSize: 0.016, bevelSegments: 3, curveSegments: 20 });
      head.translate(0, 0, -spec.headDepth / 2);
      head.rotateY(-Math.PI / 2);              /* silhouette forward -> +z */
      head.computeVertexNormals();
    }
    return { lathe: g, boxes: spec.boxes, head: head };
  }
  var PIECE_GEO = {};
  'prnbqk'.split('').forEach(function (k) { PIECE_GEO[k] = pieceGeometry(k); });

  function makePiece(kind, color) {
    var grp = new THREE.Group();
    var geo = PIECE_GEO[kind];
    var body = new THREE.Mesh(geo.lathe, MAT[color]);
    body.castShadow = true;
    grp.add(body);
    for (var i = 0; i < geo.boxes.length; i++) {
      var b = geo.boxes[i];
      var m = new THREE.Mesh(new THREE.BoxGeometry(b.s[0], b.s[1], b.s[2]), MAT[color]);
      m.position.set(b.p[0], b.p[1], b.p[2]);
      m.rotation.set(b.r[0], b.r[1], b.r[2]);
      m.castShadow = true;
      grp.add(m);
    }
    if (geo.head) {
      var hm = new THREE.Mesh(geo.head, MAT[color]);
      hm.castShadow = true;
      grp.add(hm);
    }
    if (kind === 'n' && color === 'w') grp.rotation.y = Math.PI;   /* knights face the opponent */
    grp.userData = { kind: kind, color: color };
    return grp;
  }

  /* ── the procedural Hand: rigid pooled segments driven by FK ──── */
  function makeHand(side) {
    var mat = side === 'w' ? MAT.handW : MAT.handB;
    var probe = SM.handFK(SM.restPose(side));
    var grp = new THREE.Group();
    var segs = [], beads = [];
    var up = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i < probe.capsules.length; i++) {
      var c = probe.capsules[i];
      var len = SM.dist(c.p0, c.p1);
      var g = new THREE.CylinderGeometry(c.r1, c.r0, Math.max(len, 1e-4), 10);
      var m = new THREE.Mesh(g, mat);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(c.r1, 10, 8), mat);
      m.castShadow = true; tip.castShadow = true;
      grp.add(m); grp.add(tip);
      segs.push({ body: m, tip: tip });
    }
    for (var j = 0; j < probe.spheres.length; j++) {
      var sp = probe.spheres[j];
      var bead = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat);
      bead.scale.set(sp.rx, sp.ry, sp.rz);
      grp.add(bead);
      beads.push(bead);
    }
    return {
      group: grp,
      apply: function (pose) {
        var fk = SM.handFK(pose);
        for (var i2 = 0; i2 < fk.capsules.length; i2++) {
          var cc = fk.capsules[i2], s2 = segs[i2];
          var p0 = new THREE.Vector3(cc.p0[0], cc.p0[1], cc.p0[2]);
          var p1 = new THREE.Vector3(cc.p1[0], cc.p1[1], cc.p1[2]);
          s2.body.position.copy(p0).add(p1).multiplyScalar(0.5);
          var dir = p1.clone().sub(p0);
          var len2 = dir.length();
          if (len2 > 1e-9) s2.body.quaternion.setFromUnitVectors(up, dir.multiplyScalar(1 / len2));
          s2.tip.position.copy(p1);
        }
        var bq = SM.poseQuat(pose.side);
        for (var j2 = 0; j2 < fk.spheres.length; j2++) {
          var ss = fk.spheres[j2];
          beads[j2].position.set(ss.p[0], ss.p[1], ss.p[2]);
          beads[j2].quaternion.fromArray(bq);   /* flatten in the HAND frame, not the world's */
        }
      },
    };
  }

  /* ── THE HAND: the brand rig, bone-driven by the thumb cabinet's law ── */
  var AX_X = new THREE.Vector3(1, 0, 0), AX_Z = new THREE.Vector3(0, 0, 1);
  function findBone(m, n) {
    return m.getObjectByName(n) || m.getObjectByName(n.replace(/\./g, '')) ||
           m.getObjectByName(n.replace(/\./g, '_')) || null;
  }
  function b64ToArrayBuffer(b64) {
    var bin = atob(b64.replace(/\s+/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  function makeGlbHand(model, side) {
    var G = SM.GLB_SPEC;
    /* the shipped thumb-cabinet skin recipe, verbatim — the ecosystem Hand */
    var mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(G.SKIN[side]),
      roughness: 0.62, metalness: 0.0,
      vertexColors: true,                    /* baked AO in the rig */
      sheen: 0.55, sheenRoughness: 0.7,
      sheenColor: new THREE.Color(G.SHEEN[side]),
      clearcoat: 0.12, clearcoatRoughness: 0.55,
    });
    model.traverse(function (o) { if (o.isMesh) { o.material = mat; o.frustumCulled = false; o.castShadow = true; } });
    var bones = {}, bindQ = {};
    var missing = 0;
    for (var f in G.BONES) {
      bones[f] = G.BONES[f].map(function (n) {
        var b = findBone(model, n);
        if (b) bindQ[n] = b.quaternion.clone(); else missing++;
        return b;
      });
    }
    if (missing) throw new Error('rig bones missing: ' + missing);
    var outer = new THREE.Group(), inner = new THREE.Group();
    inner.quaternion.fromArray(G.Q_BASE);
    inner.scale.setScalar(G.FIT);
    var anchor = new THREE.Vector3().fromArray(G.ANCHOR)
      .applyQuaternion(inner.quaternion).multiplyScalar(G.FIT);
    inner.position.copy(anchor).negate();
    inner.add(model);
    outer.add(inner);
    var _q = new THREE.Quaternion();               /* scratch — zero per-frame allocs */
    var _lastSig = '';
    function setCurl(curl) {
      /* AUDIT: curl is constant through carry/hold/travel — skip identical frames */
      var sig = (curl.thumb || 0).toFixed(3) + (curl.index || 0).toFixed(3) +
                (curl.middle || 0).toFixed(3) + (curl.ring || 0).toFixed(3) + (curl.pinky || 0).toFixed(3);
      if (sig === _lastSig) return;
      _lastSig = sig;
      for (var f2 in bones) {
        var close = f2 === 'thumb' ? G.THUMB_CLOSE : G.CLOSE;
        var rescale = (G.GRIP[f2] || 1) / (SM.HAND.GRIP[f2] || 1);
        var c = (curl[f2] || 0) * rescale;
        for (var k = 0; k < bones[f2].length; k++) {
          var b2 = bones[f2][k];
          if (!b2) continue;
          b2.quaternion.copy(bindQ[G.BONES[f2][k]])
            .multiply(_q.setFromAxisAngle(AX_X, -c * close[k]));
          if (k === 0 && G.ADDUCT[f2])
            b2.quaternion.multiply(_q.setFromAxisAngle(AX_Z, G.ADDUCT[f2]));
        }
      }
    }
    return {
      group: outer,
      apply: function (pose) {
        outer.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
        outer.quaternion.fromArray(SM.poseQuat(pose.side));
        setCurl(pose.curl);
      },
    };
  }
  async function loadTheHands() {
    var glbTag = document.getElementById('handGlb');
    if (!glbTag || !glbTag.textContent || glbTag.textContent.length < 1000) {
      info('hands', 'no GLB carrier — procedural pair (the permanent fallback)');
      return false;
    }
    var mod = await import('three/addons/loaders/GLTFLoader.js');
    var skel = await import('three/addons/utils/SkeletonUtils.js');
    var loader = new mod.GLTFLoader();
    var ab = b64ToArrayBuffer(glbTag.textContent);
    var parse = function (buf) {
      return new Promise(function (res, rej) { loader.parse(buf, '', res, rej); });
    };
    /* AUDIT: one parse, one geometry in memory — the second hand is a
       skeleton clone sharing buffers, not a second 70k-vert model */
    var g1 = await parse(ab);
    var scene2 = skel.clone(g1.scene);
    hands.w = makeGlbHand(g1.scene, 'w');
    hands.b = makeGlbHand(scene2, 'b');
    SM.HAND.PINCH_OVERRIDE = { open: SM.GLB_SPEC.PINCH_OPEN, grip: SM.GLB_SPEC.PINCH_GRIP };
    info('hands', 'THE Hand seated, twice — rig live, pinch law transferred');
    return true;
  }

  /* ── board + highlights ────────────────────────────────────────── */
  function buildBoard() {
    var B = SM.BOARD, N = B.N, S = B.S, TH = B.TILE_H;
    /* the table under everything: dark felt, drinking the shadows */
    var felt = new THREE.Mesh(new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x0D0C0B, roughness: 0.96, metalness: 0 }));
    felt.rotation.x = -Math.PI / 2;
    felt.position.y = -TH - 0.02;
    felt.receiveShadow = true;
    scene.add(felt);
    /* walnut rim, maple/ebony grained tiles — lacquered */
    var rimMat = woodMat('#2A1B12', '#120B07', true);
    var rim = new THREE.Mesh(new THREE.BoxGeometry(N * S + 2 * B.RIM, TH, N * S + 2 * B.RIM), rimMat);
    rim.position.y = -TH / 2 - 0.005;
    rim.receiveShadow = true;
    scene.add(rim);
    var lightMat = woodMat('#EFE6D3', '#C9B893', false);
    var darkMat = woodMat('#241a14', '#0F0A07', true);
    /* AUDIT: 64 tile draw calls merge into 2 — one geometry per wood */
    var lightGeos = [], darkGeos = [];
    for (var r = 0; r < N; r++) {
      for (var f = 0; f < N; f++) {
        var g = new THREE.BoxGeometry(S * 0.997, TH, S * 0.997);
        g.translate(-N / 2 + S / 2 + f * S, -TH / 2, N / 2 - S / 2 - r * S);
        (((r + f) % 2 === 0) ? darkGeos : lightGeos).push(g);
      }
    }
    if (MERGE && MERGE.mergeGeometries) {
      var lm = new THREE.Mesh(MERGE.mergeGeometries(lightGeos), lightMat);
      var dm = new THREE.Mesh(MERGE.mergeGeometries(darkGeos), darkMat);
      lm.receiveShadow = dm.receiveShadow = true;
      scene.add(lm); scene.add(dm);
    } else {
      /* armor: per-tile fallback if the utils module is unreachable */
      for (var gi = 0; gi < lightGeos.length; gi++) {
        var t1 = new THREE.Mesh(lightGeos[gi], lightMat); t1.receiveShadow = true; scene.add(t1);
      }
      for (var gj = 0; gj < darkGeos.length; gj++) {
        var t2 = new THREE.Mesh(darkGeos[gj], darkMat); t2.receiveShadow = true; scene.add(t2);
      }
    }
    boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    /* the brand owns the space: fascia across the table, floor mark on the felt */
    var ST2 = SM.STADIUM;
    var logoTex = new THREE.TextureLoader().load('data:image/png;base64,' + LOGO_B64);
    logoTex.colorSpace = THREE.SRGBColorSpace;
    var lw = ST2.HOARDING.w, lh = lw / ST2.LOGO_ASPECT;
    var panel = new THREE.Mesh(new THREE.BoxGeometry(lw + 0.5, lh + 0.28, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0D0D0C, roughness: 0.9, metalness: 0 }));
    panel.position.set(ST2.HOARDING.pos[0], ST2.HOARDING.pos[1], ST2.HOARDING.pos[2]);
    scene.add(panel);
    var fascia = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh),
      new THREE.MeshBasicMaterial({ map: logoTex, transparent: true,
        opacity: ST2.HOARDING.logoOpacity, depthWrite: false }));
    fascia.position.set(ST2.HOARDING.pos[0], ST2.HOARDING.pos[1], ST2.HOARDING.pos[2] + 0.05);
    scene.add(fascia);
    var dw = ST2.DECAL.w, dh = dw / ST2.LOGO_ASPECT;
    var decal = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh),
      new THREE.MeshBasicMaterial({ map: logoTex, transparent: true,
        opacity: ST2.DECAL.opacity, depthWrite: false }));
    decal.rotation.x = -Math.PI / 2;
    decal.rotation.z = Math.PI;        /* the mark reads from YOUR seat, not the Hand's */
    decal.position.set(ST2.DECAL.pos[0], -B.TILE_H - 0.012, ST2.DECAL.pos[1]);
    scene.add(decal);
  }

  function poolKey(kind, color) { return kind + '_' + color; }
  function shadowDirty() { try { renderer.shadowMap.needsUpdate = true; } catch (e) {} }
  function syncBoard(boardMap) {
    shadowDirty();
    /* return every pooled piece home, then place from the map */
    for (var k in piecePool) for (var i = 0; i < piecePool[k].length; i++) piecePool[k][i].visible = false;
    var counters = {};
    for (var sq in boardMap) {
      if (hiddenSquares[sq]) continue;
      var p = boardMap[sq];
      var kind = p.toLowerCase(), color = (p === p.toUpperCase()) ? 'w' : 'b';
      var key = poolKey(kind, color);
      counters[key] = (counters[key] || 0);
      if (!piecePool[key]) piecePool[key] = [];
      if (!piecePool[key][counters[key]]) {
        var mesh = makePiece(kind, color);
        piecePool[key].push(mesh);
        pieceGroup.add(mesh);
      }
      var m2 = piecePool[key][counters[key]++];
      var w = SM.sqToWorld(sq);
      m2.visible = true;
      m2.position.set(w.x, 0, w.z);
      m2.scale.set(1, 1, 1);
      m2.userData.sq = sq;
    }
  }

  var dotGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);
  var ringGeo = new THREE.RingGeometry(0.34, 0.44, 24);
  var tileGeo = new THREE.PlaneGeometry(0.96, 0.96);
  function syncHighlights(vs) {
    while (highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);
    function flat(geo, mat2, sq, y) {
      var m = new THREE.Mesh(geo, mat2);
      var w = SM.sqToWorld(sq);
      m.position.set(w.x, y, w.z);
      if (geo !== dotGeo) m.rotation.x = -Math.PI / 2;
      highlightGroup.add(m);
    }
    if (vs.lastMove) { flat(tileGeo, MAT.last, vs.lastMove.from, 0.012); flat(tileGeo, MAT.last, vs.lastMove.to, 0.012); }
    if (vs.selected) flat(ringGeo, MAT.sel, vs.selected, 0.016);
    for (var i = 0; i < vs.targets.length; i++) {
      var t = vs.targets[i];
      if (t.capture) flat(ringGeo, MAT.ring, t.to, 0.016);
      else flat(dotGeo, MAT.dot, t.to, 0.02);
    }
    if (vs.checkSq) flat(tileGeo, MAT.chk, vs.checkSq, 0.014);
  }

  /* ── choreography: the task machine ────────────────────────────────
     Tasks: pickup (ends HOLDING), carry (from hold), putback, full.
     The player's taps command pickups literally; committed moves ride
     carry (if already held) or full arcs (the Hand's own moves). */
  var tasks = [], task = null, taskT0 = 0;
  var heldSq = null, heldRec = null;

  function beginTask(t) {
    task = t; taskT0 = clock.getElapsedTime();
    /* the reference angle, live while a hand travels */
    if (t.kind === 'full' || t.kind === 'carry') {
      var ACT = SM.CAMERA_ACTION;
      var fx = (t.plan.fromW.x + t.plan.toW.x) / 2;
      var fz = (t.plan.fromW.z + t.plan.toW.z) / 2;
      t.camPose = {
        eye: [fx * ACT.xFollow, ACT.y, ACT.z],
        look: [fx * ACT.lookFollow, ACT.lookY, fz * ACT.lookFollow],
        fov: ACT.fov,
      };
    }
    hiddenSquares = {};
    if (t.kind !== 'putback') hiddenSquares[t.rec.to] = true;
    hiddenSquares[t.rec.from] = true;
    if (t.plan.victimSq) hiddenSquares[t.plan.victimSq] = true;
    syncBoard(CAB.viewState().board);
    if (t.kind === 'carry' && carriedMesh) {
      /* the piece is already in the hand from the pickup */
    } else {
      if (carriedMesh) { pieceGroup.remove(carriedMesh); carriedMesh = null; }
      carriedMesh = makePiece(t.rec.piece.toLowerCase(), t.rec.side);
      carriedMesh.userData.sq = t.rec.from;   /* tapping the held piece puts it back */
      var fw = SM.sqToWorld(t.rec.from);
      carriedMesh.position.set(fw.x, 0, fw.z);
      pieceGroup.add(carriedMesh);
    }
    if (t.plan.victimSq && t.rec.capture) {
      victimMesh = makePiece(t.rec.capture.toLowerCase(), t.rec.side === 'w' ? 'b' : 'w');
      var vw = SM.sqToWorld(t.plan.victimSq);
      victimMesh.position.set(vw.x, 0, vw.z);
      pieceGroup.add(victimMesh);
    }
  }

  function finishTask() {
    var t = task; task = null;
    if (t.kind === 'pickup') {
      heldSq = t.rec.from; heldRec = t.rec;
      /* keep the carried mesh in hand and its square hidden */
      hiddenSquares = {}; hiddenSquares[heldSq] = true;
      startNext();
      return;
    }
    heldSq = null; heldRec = null;
    if (carriedMesh) { pieceGroup.remove(carriedMesh); carriedMesh = null; }
    if (victimMesh) { pieceGroup.remove(victimMesh); victimMesh = null; }
    hiddenSquares = {};
    startNext();
  }

  function startNext() {
    if (task || !tasks.length) {
      if (!task && !tasks.length) {
        if (activeDone) { var d = activeDone; activeDone = null; d(); }
        syncBoard(CAB.viewState().board);
        syncHighlights(CAB.viewState());
        if (!heldSq) { hands.w.apply(SM.restPose('w')); hands.b.apply(SM.restPose('b')); }
      }
      return;
    }
    beginTask(tasks.shift());
  }

  function stepActive() {
    var t = clock.getElapsedTime() - taskT0;
    var s = SM.samplePlan(task.plan, t);
    hands[task.rec.side].apply(s.pose);
    if (s.carriedPiecePos && carriedMesh) {
      carriedMesh.position.set(s.carriedPiecePos[0], s.carriedPiecePos[1], s.carriedPiecePos[2]);
    }
    if (victimMesh && s.victimSinkK > 0) {
      var k = 1 - s.victimSinkK;
      victimMesh.scale.set(Math.max(k, 0.001), Math.max(k, 0.001), Math.max(k, 0.001));
      victimMesh.position.y = -(1 - k) * 0.25;
    }
    shadowDirty();                                /* a hand is moving — shadows follow */
    if (s.done) finishTask();
  }

  function enqueue(kind, rec) {
    var plan = kind === 'pickup' ? SM.planPickup(rec)
             : kind === 'carry' ? SM.planCarry(rec)
             : kind === 'putback' ? SM.planPutback(rec)
             : SM.planMove(rec);
    tasks.push({ kind: kind, rec: rec, plan: plan });
    startNext();
  }

  function abortHold() {
    heldSq = null; heldRec = null;
    if (carriedMesh) { pieceGroup.remove(carriedMesh); carriedMesh = null; }
    hiddenSquares = {};
    hands.w.apply(SM.restPose('w'));
    hands.b.apply(SM.restPose('b'));
  }

  /* the player's selection commands the hand: pick up, put back, swap */
  function watchSelection(vs) {
    if (task || tasks.length) return;
    if (vs.phase !== 'idle') return;
    if (heldSq && (!vs.board[heldSq])) { abortHold(); syncBoard(vs.board); return; }  /* new game / rewind */
    if (!heldSq && vs.selected && vs.board[vs.selected]) {
      var p = vs.board[vs.selected];
      if (p === p.toUpperCase()) {
        enqueue('pickup', { side: 'w', from: vs.selected, to: vs.selected,
          piece: p, capture: null, victimSq: null, promo: null });
      }
    } else if (heldSq && vs.selected !== heldSq) {
      enqueue('putback', heldRec);
      if (vs.selected && vs.board[vs.selected]) {
        var p2 = vs.board[vs.selected];
        if (p2 === p2.toUpperCase()) {
          enqueue('pickup', { side: 'w', from: vs.selected, to: vs.selected,
            piece: p2, capture: null, victimSq: null, promo: null });
        }
      }
    }
  }

  window.__STAGE__ = {
    play: function (recs, done) {
      if (dead) { done(); return; }
      activeDone = done;
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        if (i === 0 && heldSq === rec.from) {
          heldSq = null; heldRec = null;      /* the held piece rides the carry */
          enqueue('carry', rec);
        } else {
          enqueue('full', rec);
        }
      }
      if (!recs.length) { activeDone = null; done(); }
    },
  };

  /* ── input: taps move pieces; drags orbit the table ────────────── */
  var orbit = null;                 /* {theta, phi, thetaT, phiT, r, rT} — live after init */
  var drag = null;                  /* {x, y, moved} while one pointer is down */
  var touches = {};                 /* active pointers, for the two-finger pinch */
  var pinch = null;                 /* {d0, r0} while two pointers are down */
  function clampR(v) { return Math.max(SM.ORBIT.R_MIN, Math.min(SM.ORBIT.R_MAX, v)); }
  function markOrbited() {
    var s = SM.seatSpherical();
    var away = Math.abs(orbit.thetaT - s.theta) + Math.abs(orbit.phiT - s.phi) + Math.abs(orbit.rT - 1);
    try { document.body.classList.toggle('orbited', away > SM.ORBIT.HOME_EPS); } catch (e) {}
  }
  function pinchDist() {
    var ids = Object.keys(touches);
    var a = touches[ids[0]], b = touches[ids[1]];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function onPointerDown(ev) {
    if (dead) return;
    touches[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    var n = Object.keys(touches).length;
    if (n === 1) {
      drag = { x: ev.clientX, y: ev.clientY, moved: false };
    } else if (n === 2) {
      if (drag) drag.moved = true;             /* a second finger is never a tap */
      pinch = { d0: pinchDist(), r0: orbit.rT };
    }
    try { ev.target.setPointerCapture(ev.pointerId); } catch (e) {}
  }
  function onPointerMove(ev) {
    if (dead || !touches[ev.pointerId]) return;
    touches[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (pinch && Object.keys(touches).length >= 2) {
      /* two fingers: the world scales under them, 1:1 */
      var d = pinchDist();
      if (d > 1) {
        orbit.rT = clampR(pinch.r0 * (pinch.d0 / d) * SM.ORBIT.PINCH_GAIN);
        orbit.r = orbit.rT;
        markOrbited();
      }
      return;
    }
    if (!drag) return;
    var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < SM.ORBIT.TAP_SLOP) return;
    drag.moved = true;
    drag.x = ev.clientX; drag.y = ev.clientY;
    if (task) return;               /* the drama cam owns travels */
    orbit.thetaT -= dx * SM.ORBIT.SPEED_X;
    orbit.phiT = Math.max(SM.ORBIT.POLAR_MIN, Math.min(SM.ORBIT.POLAR_MAX, orbit.phiT - dy * SM.ORBIT.SPEED_Y));
    orbit.theta = orbit.thetaT;     /* direct manipulation: 1:1 under the finger */
    orbit.phi = orbit.phiT;
    markOrbited();
  }
  function onPointerUp(ev) {
    if (dead) return;
    delete touches[ev.pointerId];
    if (Object.keys(touches).length < 2) pinch = null;
    var wasTap = drag && !drag.moved && Object.keys(touches).length === 0;
    if (Object.keys(touches).length === 0) drag = null;
    if (wasTap) onTap(ev);
  }
  function onWheel(ev) {
    if (dead || task) return;
    try { ev.preventDefault(); } catch (e) {}
    /* mouse wheel AND trackpad two-finger pinch (arrives as wheel) */
    orbit.rT = clampR(orbit.rT * Math.exp(ev.deltaY * SM.ORBIT.WHEEL_SPEED));
    markOrbited();
  }
  function recenter() {
    var s = SM.seatSpherical();
    /* ride home the short way around */
    var d = s.theta - orbit.thetaT;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    orbit.thetaT = orbit.thetaT + d;
    orbit.phiT = s.phi;
    orbit.rT = 1;
    markOrbited();
  }
  function onTap(ev) {
    if (dead) return;
    try {
      var rect = renderer.domElement.getBoundingClientRect();
      var x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      var y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      /* pieces first: tapping a piece IS tapping its square, even when the
         low seat makes its head overhang the squares behind it */
      var hits = raycaster.intersectObjects(pieceGroup.children, true);
      if (hits.length) {
        var node = hits[0].object;
        while (node && !(node.userData && node.userData.sq)) node = node.parent;
        if (node && node.userData.sq) { CAB.tap(node.userData.sq); return; }
      }
      var hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(boardPlane, hit)) {
        var sq = SM.worldToSq(hit.x, hit.z);
        if (sq) CAB.tap(sq);
      }
    } catch (e) { teardown('input_error', e); }
  }

  /* ── boot ──────────────────────────────────────────────────────── */
  async function init() {

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(COLORS.bg);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;        /* AUDIT: shadows redraw on motion, not on habit */
    renderer.shadowMap.needsUpdate = true;        /* ...but the first frame draws them */
    try { MERGE = await import('three/addons/utils/BufferGeometryUtils.js'); }
    catch (eM) { info('audit', 'merge utils unreachable — per-tile fallback'); }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    var size = Math.min(mount.clientWidth || 500, 960);
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    var ST = SM.STADIUM;
    scene.fog = new THREE.Fog(ST.FOG.color, ST.FOG.near, ST.FOG.far);
    camera = new THREE.PerspectiveCamera(SM.CAMERA.fov, 1, 0.1, 60);
    camera.position.set(SM.CAMERA.pos[0], SM.CAMERA.pos[1], SM.CAMERA.pos[2]);
    camera.lookAt(SM.CAMERA.look[0], SM.CAMERA.look[1], SM.CAMERA.look[2]);
    raycaster = new THREE.Raycaster();

    /* stadium rig: one pooled key spot over the table, two cool rim spots */
    var key = new THREE.SpotLight(ST.KEY_SPOT.color, ST.KEY_SPOT.intensity);
    key.position.set(ST.KEY_SPOT.pos[0], ST.KEY_SPOT.pos[1], ST.KEY_SPOT.pos[2]);
    key.angle = ST.KEY_SPOT.angle; key.penumbra = ST.KEY_SPOT.penumbra;
    key.decay = 2; key.distance = 45;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 2; key.shadow.camera.far = 30;
    key.shadow.bias = -0.0005;
    key.target.position.set(0, 0, 0);
    scene.add(key); scene.add(key.target);
    for (var rI = 0; rI < ST.RIM_SPOTS.length; rI++) {
      var rs = ST.RIM_SPOTS[rI];
      var rim2 = new THREE.SpotLight(rs.color, rs.intensity);
      rim2.position.set(rs.pos[0], rs.pos[1], rs.pos[2]);
      rim2.angle = 0.6; rim2.penumbra = 0.7; rim2.decay = 2; rim2.distance = 40;
      rim2.target.position.set(0, 0.4, 0);
      scene.add(rim2); scene.add(rim2.target);
    }
    scene.add(new THREE.AmbientLight(0xffffff, ST.AMBIENT));
    /* image-based light: RoomEnvironment through PMREM — realism's backbone */
    try {
      var envMod = await import('three/addons/environments/RoomEnvironment.js');
      var pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new envMod.RoomEnvironment(), 0.04).texture;
      if ('environmentIntensity' in scene) scene.environmentIntensity = SM.STADIUM.ENV;
      info('light', 'room environment live — PBR reflections on');
    } catch (eE) { info('light', 'no environment module — direct lights carry it'); }

    buildBoard();
    pieceGroup = new THREE.Group(); scene.add(pieceGroup);
    highlightGroup = new THREE.Group(); scene.add(highlightGroup);
    var glbOn = false;
    try { glbOn = await loadTheHands(); }
    catch (eG) { warn('glb_parse_fallback', (eG && eG.message) || 'parse failed'); }
    if (!glbOn) { hands.w = makeHand('w'); hands.b = makeHand('b'); }
    scene.add(hands.w.group); scene.add(hands.b.group);
    hands.w.apply(SM.restPose('w'));
    hands.b.apply(SM.restPose('b'));

    syncBoard(CAB.viewState().board);
    syncHighlights(CAB.viewState());
    CAB.onRender(function () {
      if (dead) return;
      var vs = CAB.viewState();
      watchSelection(vs);
      if (task || tasks.length) return;
      syncBoard(vs.board);
      syncHighlights(vs);
    });
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    var btnSeat = document.getElementById('btnSeat');
    if (btnSeat) btnSeat.addEventListener('click', recenter);
    window.addEventListener('resize', function () {
      try {
        var s2 = Math.min(mount.clientWidth || 500, 960);
        renderer.setSize(s2, s2);
      } catch (e) {}
    });

    clock = new THREE.Clock();
    var first = true;
    var camCur = { eye: SM.CAMERA.pos.slice(), look: SM.CAMERA.look.slice(), fov: SM.CAMERA.fov };
    var seat0 = SM.seatSpherical();
    orbit = { theta: seat0.theta, phi: seat0.phi, thetaT: seat0.theta, phiT: seat0.phi, r: 1, rT: 1 };
    var prevT = 0;
    function easeCam(dt) {
      /* the user's angles glide toward their targets (recenter rides this) */
      var ko = Math.min(1, dt * 4.2);
      orbit.theta += (orbit.thetaT - orbit.theta) * ko;
      orbit.phi += (orbit.phiT - orbit.phi) * ko;
      orbit.r += (orbit.rT - orbit.r) * ko;
      var want = (task && task.camPose) ? task.camPose : SM.orbitPose(orbit.theta, orbit.phi, orbit.r);
      var dragging = !!((drag && drag.moved) || pinch);
      var rate = (task && task.camPose) ? (1 / SM.CAMERA_ACTION.easeIn) : (1 / SM.CAMERA_ACTION.easeOut);
      var k = dragging ? 1 : Math.min(1, dt * rate * 3.2);
      for (var i = 0; i < 3; i++) {
        camCur.eye[i] += (want.eye[i] - camCur.eye[i]) * k;
        camCur.look[i] += (want.look[i] - camCur.look[i]) * k;
      }
      camCur.fov += (want.fov - camCur.fov) * k;
      camera.position.set(camCur.eye[0], camCur.eye[1], camCur.eye[2]);
      camera.lookAt(camCur.look[0], camCur.look[1], camCur.look[2]);
      if (Math.abs(camera.fov - camCur.fov) > 0.02) { camera.fov = camCur.fov; camera.updateProjectionMatrix(); }
    }
    function frame() {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      try {
        var now = clock.getElapsedTime();
        var dt = Math.min(0.05, now - prevT); prevT = now;
        if (task) stepActive();
        easeCam(dt);
        renderer.render(scene, camera);
        if (first) { first = false; document.body.classList.add('three-on'); info('stage', 'live — first frame rendered'); }
      } catch (e) { teardown('frame_error', e); }
    }
    frame();
  }

  init().catch(function (e) { teardown('init_error', e); });
})();
