#!/usr/bin/env python3
# patch_thumb_camera.py — Thumb Wrestling camera modernization.
# Target: arcade/thumb/index.html
# Findings addressed: shared runtime (0.10.14 -> 1.0.0), GPU delegate + warmup,
# the WASM leak (every camera toggle re-created a landmarker without closing
# the old one — now created once and reused), the eternal setTimeout(33) chain
# (ticked from page load forever, camera on or off — now a gated loop that
# rides requestVideoFrameCallback and stops when the camera does), visibility
# pause, and velocity EMA in the pure translator so thumb jitter stops minting
# false reversal edges. Pose stays raw — the cursor keeps its snap; only the
# EDGES read smoothed velocity.

import io, os

PATH = os.environ.get('THUMB_PATH', 'arcade/thumb/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── T1: pure translator — EMA on edge velocities, raw pose untouched ────────
rep(
"""  function camTranslator() {
    var prev = null, dir = 0, inZone = false;
    var pend = { lungeEdge: false, dodgeEdge: false, reversalEdge: false };
    var ZONE = { x0: 0.25, x1: 0.75, y0: 0.6 };
    function landmarks(lms, t) {
      if (!lms || !lms[4]) { prev = null; return; }
      var tip = { x: 1 - lms[4].x, y: lms[4].y };   // mirrored view
      if (prev) {
        var dt = Math.max(0.001, (t - prev.t) / 1000);
        var vx = (tip.x - prev.x) / dt, vy = (tip.y - prev.y) / dt;
        var zone = tip.y > ZONE.y0 && tip.x > ZONE.x0 && tip.x < ZONE.x1;
        if (zone && !inZone && vy > 0.35) pend.lungeEdge = true;
        inZone = zone;
        if (Math.abs(vx) > 0.6) {
          var d = vx > 0 ? 1 : -1;
          if (dir !== 0 && d !== dir) pend.reversalEdge = true;
          dir = d;
        }
        if (Math.abs(vx) > 0.9 && !zone) pend.dodgeEdge = true;
        prev = { x: tip.x, y: tip.y, t: t, pose: true };
      } else prev = { x: tip.x, y: tip.y, t: t };
      prev.poseX = tip.x; prev.poseY = tip.y;
    }""",
"""  function camTranslator() {
    var prev = null, dir = 0, inZone = false;
    var svx = 0, svy = 0;                            // EMA'd edge velocities
    var pend = { lungeEdge: false, dodgeEdge: false, reversalEdge: false };
    var ZONE = { x0: 0.25, x1: 0.75, y0: 0.6 };
    function landmarks(lms, t) {
      if (!lms || !lms[4]) { prev = null; svx = 0; svy = 0; return; }
      var tip = { x: 1 - lms[4].x, y: lms[4].y };   // mirrored view
      if (prev) {
        var dt = Math.max(0.001, (t - prev.t) / 1000);
        var vx = (tip.x - prev.x) / dt, vy = (tip.y - prev.y) / dt;
        /* SEAM:CAM_CORE — the EDGES read smoothed velocity (EMA .55/.45, the
           Pop-A-Shot pattern): one jittery frame can no longer flip the sign
           and mint a false reversal. The pose stays raw — the cursor snaps. */
        svx = svx * 0.55 + vx * 0.45;
        svy = svy * 0.55 + vy * 0.45;
        var zone = tip.y > ZONE.y0 && tip.x > ZONE.x0 && tip.x < ZONE.x1;
        if (zone && !inZone && svy > 0.35) pend.lungeEdge = true;
        inZone = zone;
        if (Math.abs(svx) > 0.6) {
          var d = svx > 0 ? 1 : -1;
          if (dir !== 0 && d !== dir) pend.reversalEdge = true;
          dir = d;
        }
        if (Math.abs(svx) > 0.9 && !zone) pend.dodgeEdge = true;
        prev = { x: tip.x, y: tip.y, t: t, pose: true };
      } else prev = { x: tip.x, y: tip.y, t: t };
      prev.poseX = tip.x; prev.poseY = tip.y;
    }""",
'T1 edge velocity EMA')

# ── T2: runtime 1.0.0, GPU delegate, landmarker reuse, warmup ───────────────
rep(
"""      var vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
      var files = await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      landmarker = await vision.HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
        numHands: 1, runningMode: 'VIDEO' });
      mode = 'on'; modeBtn.textContent = 'CAMERA: ON'; modeBtn.classList.add('on');""",
"""      /* SEAM:CAM_CORE — unified arcade runtime (verified API-identical to
         this call surface); landmarker is created ONCE and reused across
         toggles — the old path re-created it on every CAMERA: ON without
         closing the last, leaking a WASM graph per toggle. */
      if (!landmarker) {
        var MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0';
        var vision = await import(MP_CDN + '/vision_bundle.mjs');
        var files = await vision.FilesetResolver.forVisionTasks(MP_CDN + '/wasm');
        landmarker = await vision.HandLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU' },
          numHands: 1, runningMode: 'VIDEO' });
      }
      // Warmup: first inference compiles shaders — spend it before play begins.
      try { var pv = document.getElementById('pip'); if (pv.readyState >= 2) landmarker.detectForVideo(pv, performance.now()); } catch (e) {}
      mode = 'on'; modeBtn.textContent = 'CAMERA: ON'; modeBtn.classList.add('on');
      camLoopStart();""",
'T2 runtime + reuse + warmup')

# ── T3: teardown keeps the landmarker, parks the loop, stops the tracks ─────
rep(
"""  function stopCam() {
    if (pipStream) { pipStream.getTracks().forEach(function (t) { t.stop(); }); pipStream = null; }
    document.getElementById('pip').style.display = 'none';
    landmarker = null; mode = 'off';""",
"""  function stopCam() {
    camLoopStop();
    if (pipStream) { pipStream.getTracks().forEach(function (t) { t.stop(); }); pipStream = null; }
    document.getElementById('pip').style.display = 'none';
    mode = 'off';   // landmarker survives — reused on the next CAMERA: ON""",
'T3 teardown keeps landmarker')

# ── T4: the eternal chain becomes a gated per-frame loop ────────────────────
rep(
"""  /* ── camera detect loop ── */
  function camLoop() {
    if (mode === 'on' && landmarker) {
      var pip = document.getElementById('pip');
      try {
        var res = landmarker.detectForVideo(pip, performance.now());
        cam.landmarks(res && res.landmarks && res.landmarks[0], performance.now());
      } catch (e) {}
    }
    setTimeout(camLoop, 33);
  }""",
"""  /* ── camera detect loop ── */
  /* SEAM:CAM_CORE — the old chain ticked setTimeout(33) from page load
     forever, camera on or off. This one exists only while the camera does:
     rides requestVideoFrameCallback on the pip (one inference per delivered
     frame), falls back to a 33ms timer, parks on visibility loss, dies with
     stopCam. */
  var camTimer = null, camVfc = null;
  function camDetect() {
    if (mode !== 'on' || !landmarker) return;
    var pip = document.getElementById('pip');
    if (!pip || pip.readyState < 2) return;
    try {
      var res = landmarker.detectForVideo(pip, performance.now());
      cam.landmarks(res && res.landmarks && res.landmarks[0], performance.now());
    } catch (e) {}
  }
  function camLoopStart() {
    camLoopStop();
    if (document.hidden) return;                     // visibility hook resumes
    var pip = document.getElementById('pip');
    if (pip && 'requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      var onFrame = function () { camDetect(); if (mode === 'on') camVfc = pip.requestVideoFrameCallback(onFrame); };
      camVfc = pip.requestVideoFrameCallback(onFrame);
    } else {
      camTimer = setInterval(camDetect, 33);
    }
  }
  function camLoopStop() {
    if (camTimer) { clearInterval(camTimer); camTimer = null; }
    var pip = document.getElementById('pip');
    if (camVfc != null && pip && pip.cancelVideoFrameCallback) pip.cancelVideoFrameCallback(camVfc);
    camVfc = null;
  }
  document.addEventListener('visibilitychange', function () {
    if (mode !== 'on') return;
    if (document.hidden) camLoopStop(); else camLoopStart();
  });""",
'T4 gated loop')

# ── T5: the unconditional starter at boot goes away ─────────────────────────
rep(
"\n  camLoop();\n",
"\n  // camLoopStart() now fires from the CAMERA: ON handler — nothing runs at boot.\n",
'T5 no boot loop')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
