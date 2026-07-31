#!/usr/bin/env python3
# patch_rps_camera.py — RPS camera modernization.
# Target: arcade/rps/index.html
# Findings addressed: F1/F2 (0.10.14 -> 1.0.0, one revert constant), F3 (rvfc
# loop, display-rate inference ends), F4 (visibility pause), F5 (resolution
# constraint), F6 (warmup inference), F7 (stable-read window 6/4 -> 4/3).

import io, os

PATH = os.environ.get('RPS_PATH', 'arcade/rps/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── A1: constraints — ask for what the model wants, not what the phone has ──
rep(
"        const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });",
"        // SEAM:CAM_CORE — 640x480 ideal: finger-state classification wants more\n"
"        // pixels than wrist tracking, but 1080p (what an unconstrained request\n"
"        // returns on many phones) just taxes the copy path and the GPU.\n"
"        const stream = await navigator.mediaDevices.getUserMedia({\n"
"          video:{ facingMode:'user', width:{ ideal:640 }, height:{ ideal:480 }, frameRate:{ ideal:30 } }, audio:false });",
'A1 constraints')

# ── A2: runtime 1.0.0 + GPU delegate + warmup ───────────────────────────────
rep(
"""      els.hint.textContent = 'Loading hand tracking…';
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
      const files = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      this.landmarker = await vision.HandLandmarker.createFromOptions(files,{
        baseOptions:{ modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
        numHands:1, runningMode:'VIDEO'
      });
      this.ready = true; this._loop();""",
"""      els.hint.textContent = 'Loading hand tracking…';
      /* SEAM:CAM_CORE — one constant governs the runtime. 1.0.0 verified
         API-identical to our call surface (createFromOptions / detectForVideo /
         .landmarks) against the published d.ts; revert = edit this line. */
      const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0';
      const vision = await import(MP_CDN + '/vision_bundle.mjs');
      const files = await vision.FilesetResolver.forVisionTasks(MP_CDN + '/wasm');
      this.landmarker = await vision.HandLandmarker.createFromOptions(files,{
        baseOptions:{ modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate:'GPU' },
        numHands:1, runningMode:'VIDEO'
      });
      // Warmup: the first inference compiles shaders — spend it here, behind
      // the loading hint, so it never lands on the player's first SHOOT.
      try{ if(this.video.readyState>=2) this.landmarker.detectForVideo(this.video, performance.now()); }catch(e){}
      this.ready = true; this._loop();""",
'A2 runtime 1.0.0 + warmup')

# ── A3: the loop — per-camera-frame, not per-display-frame ──────────────────
rep(
"""  stop(){ cancelAnimationFrame(this.raf); const s=this.video.srcObject; if(s) s.getTracks().forEach(t=>t.stop()); this.video.srcObject=null; this.ready=false; this.camOn=false; },
  _loop(){
    const tick=()=>{
      if(this.landmarker && this.video.readyState>=2){
        const res = this.landmarker.detectForVideo(this.video, performance.now());
        if(res.landmarks && res.landmarks.length){
          const g = classify(res.landmarks[0]);
          this._push(g);
        }else{ this._push(null); }
      }
      this.raf=requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.raf); this.raf=requestAnimationFrame(tick);
  },""",
"""  stop(){ this._stopLoop(); const s=this.video.srcObject; if(s) s.getTracks().forEach(t=>t.stop()); this.video.srcObject=null; this.ready=false; this.camOn=false; },
  /* SEAM:CAM_CORE — detection rides requestVideoFrameCallback: one inference
     per DELIVERED camera frame (~30Hz), not per display refresh (120Hz on a
     ProMotion phone — three duplicate inferences out of four, pure heat).
     rAF fallback keeps a 33ms throttle where rvfc is absent. */
  _stopLoop(){
    if(this._vfc && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this._vfc);
    cancelAnimationFrame(this.raf); this._vfc=null;
  },
  _detectOnce(){
    if(this.landmarker && this.video.readyState>=2){
      const res = this.landmarker.detectForVideo(this.video, performance.now());
      if(res.landmarks && res.landmarks.length){
        const g = classify(res.landmarks[0]);
        this._push(g);
      }else{ this._push(null); }
    }
  },
  _loop(){
    this._stopLoop();
    if(document.hidden) return;              // visibility hook resumes us
    if('requestVideoFrameCallback' in HTMLVideoElement.prototype){
      const onFrame=()=>{ this._detectOnce(); this._vfc=this.video.requestVideoFrameCallback(onFrame); };
      this._vfc=this.video.requestVideoFrameCallback(onFrame);
    }else{
      let last=0;
      const tick=(t)=>{ if(t-last>=33){ last=t; this._detectOnce(); } this.raf=requestAnimationFrame(tick); };
      this.raf=requestAnimationFrame(tick);
    }
  },""",
'A3 rvfc loop')

# ── A4: visibility — a hidden tab burns nothing ─────────────────────────────
rep(
"  video:document.getElementById('video'), stable:null, _buf:[],",
"  video:document.getElementById('video'), stable:null, _buf:[], _vfc:null,",
'A4a vfc slot')

rep(
"/* classify 21 landmarks -> rock | paper | scissors */",
"""/* SEAM:CAM_CORE — locked phone, backgrounded tab: detection sleeps, the
   stream stays warm, everything resumes on return. The hot-phone fix. */
document.addEventListener('visibilitychange', ()=>{
  if(!detector || !detector.ready) return;
  if(document.hidden) detector._stopLoop();
  else detector._loop();
});

/* classify 21 landmarks -> rock | paper | scissors */""",
'A4b visibility hook')

# ── A5: stable read 6/4 -> 4/3 — same jitter rejection, half the felt lag ───
rep(
"""  _push(g){
    this._buf.push(g); if(this._buf.length>6) this._buf.shift();
    // stable = a move that appears in >=4 of last 6 frames
    const counts={}; for(const x of this._buf) if(x) counts[x]=(counts[x]||0)+1;
    let best=null,bn=0; for(const k in counts) if(counts[k]>bn){bn=counts[k];best=k;}
    // drop a stale read once the hand has been out of frame for a few frames
    const gone = this._buf.slice(-4).every(x=>!x);
    this.stable = bn>=4 ? best : (gone ? null : this.stable);""",
"""  _push(g){
    this._buf.push(g); if(this._buf.length>4) this._buf.shift();
    // SEAM:CAM_CORE — stable = >=3 of the last 4 frames. At ~30fps that is
    // ~100ms to lock a throw instead of ~200ms under the old 4-of-6, with the
    // same single-frame-flicker rejection. The read should feel simultaneous.
    const counts={}; for(const x of this._buf) if(x) counts[x]=(counts[x]||0)+1;
    let best=null,bn=0; for(const k in counts) if(counts[k]>bn){bn=counts[k];best=k;}
    // drop a stale read once the hand has been out of frame for a few frames
    const gone = this._buf.slice(-3).every(x=>!x);
    this.stable = bn>=3 ? best : (gone ? null : this.stable);""",
'A5 faster stable read')


# ── A6: capture owns the video fully — the rvfc loop must sleep too ─────────
rep(
"""  async capture(ms=460){
    cancelAnimationFrame(this.raf);          // own the video during the window""",
"""  async capture(ms=460){
    this._stopLoop();                        // own the video during the window""",
'A6 capture silences rvfc')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
