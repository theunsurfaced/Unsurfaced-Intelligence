#!/usr/bin/env python3
# patch_pop_camera.py — Pop-A-Shot camera modernization.
# Target: arcade/pop-a-shot/index.html
# Pop was already the best cabinet (320x240 constraint, 30Hz throttle, velocity
# EMA, lazy-load discipline). This brings it to the unified runtime and the
# shared loop/visibility/warmup pattern; the shooting physics are untouched.

import io, os

PATH = os.environ.get('POP_PATH', 'arcade/pop-a-shot/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── B1: unified runtime constant ────────────────────────────────────────────
rep(
"   @mediapipe/tasks-vision@0.10.35 (pinned) ONLY on explicit entry. Track the",
"   @mediapipe/tasks-vision (CAM.CDN pin below) ONLY on explicit entry. Track the",
'B0 comment tells the truth')

rep(
"  CDN: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35' };",
"  /* SEAM:CAM_CORE — unified arcade runtime; 1.0.0 verified API-identical to\n"
"     this call surface against the published d.ts. Revert = this line. */\n"
"  CDN: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0' };",
'B1 runtime 1.0.0')

# ── B2: GPU delegate + warmup behind the starting state ─────────────────────
rep(
"""    camTracker = await vision.HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: CAM.MODEL }, runningMode: 'VIDEO', numHands: 1 });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
    camVideo = document.getElementById('camView');
    camVideo.srcObject = stream; await camVideo.play();
    camOn = true; camPeak = 0; camPrevY = null;""",
"""    camTracker = await vision.HandLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: CAM.MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 1 });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
    camVideo = document.getElementById('camView');
    camVideo.srcObject = stream; await camVideo.play();
    /* SEAM:CAM_CORE — warmup: the first inference compiles shaders; spend it
       here so it never lands on the player's first flick. */
    try { if (camVideo.readyState >= 2) camTracker.detectForVideo(camVideo, performance.now()); } catch (e) {}
    camOn = true; camPeak = 0; camPrevY = null;""",
'B2 delegate + warmup')

# ── B3: the loop — per-camera-frame via rvfc, throttled rAF fallback ────────
rep(
"""    setCamUI('on');
    $('hint').textContent = 'camera armed · raise your hand, flick up to shoot';
    $('hint').classList.remove('off');
    requestAnimationFrame(camLoop);""",
"""    setCamUI('on');
    $('hint').textContent = 'camera armed · raise your hand, flick up to shoot';
    $('hint').classList.remove('off');
    camLoopStart();""",
'B3a start via gate')

rep(
"""function camLoop(){
  if (!camOn) return;
  requestAnimationFrame(camLoop);
  if (!camTracker || camVideo.readyState < 2) return;
  const t = performance.now();
  if (t - camPrevT < 33) return;                      // ~30 Hz detection
  const res = camTracker.detectForVideo(camVideo, t);""",
"""/* SEAM:CAM_CORE — detection rides requestVideoFrameCallback where present:
   one inference per delivered camera frame, zero duplicate work on high-Hz
   displays. rAF path keeps the original 33ms throttle as the fallback. The
   visibility hook parks the whole thing when the tab hides. */
let camVfc = null;
function camLoopStart(){
  camLoopStop();
  if (document.hidden) return;                        // visibility hook resumes
  if (camVideo && 'requestVideoFrameCallback' in HTMLVideoElement.prototype){
    const onFrame = () => { camDetect(performance.now()); if (camOn) camVfc = camVideo.requestVideoFrameCallback(onFrame); };
    camVfc = camVideo.requestVideoFrameCallback(onFrame);
  } else {
    requestAnimationFrame(camLoop);
  }
}
function camLoopStop(){
  if (camVfc != null && camVideo && camVideo.cancelVideoFrameCallback) camVideo.cancelVideoFrameCallback(camVfc);
  camVfc = null;
}
document.addEventListener('visibilitychange', () => {
  if (!camOn) return;
  if (document.hidden) camLoopStop(); else camLoopStart();
});
function camLoop(){
  if (!camOn || camVfc != null) return;
  requestAnimationFrame(camLoop);
  const t0 = performance.now();
  if (t0 - camPrevT < 33) return;                     // ~30 Hz detection
  camDetect(t0);
}
function camDetect(t){
  if (!camOn || !camTracker || !camVideo || camVideo.readyState < 2) return;
  const res = camTracker.detectForVideo(camVideo, t);""",
'B3b rvfc gate + detect split')

# ── B4: teardown parks the vfc loop too ─────────────────────────────────────
rep(
"""function stopCamera(){
  camOn = false;
  if (camVideo && camVideo.srcObject){""",
"""function stopCamera(){
  camOn = false;
  camLoopStop();
  if (camVideo && camVideo.srcObject){""",
'B4 teardown parks vfc')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
