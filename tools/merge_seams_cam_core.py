#!/usr/bin/env python3
# merge_seams_cam_core.py — register the arcade camera arc.
# Run from repo root. Writes into seams.json["registry"] — never the top level.
# One seam, three carriers: the @-suffix pattern the registry already uses.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:CAM_CORE": {
    "file": "arcade/rps/index.html",
    "purpose": "unified camera stack: tasks-vision 1.0.0 (one revert constant), GPU delegate, warmup inference, rvfc per-camera-frame loops, visibility pause; RPS adds 640x480 ideal constraints + 3-of-4 stable read (~100ms lock)" },
  "SEAM:CAM_CORE@pop": {
    "file": "arcade/pop-a-shot/index.html",
    "tag": "SEAM:CAM_CORE",
    "purpose": "same stack; shooting physics untouched — rvfc gate wraps the existing 30Hz throttle as fallback" },
  "SEAM:CAM_CORE@thumb": {
    "file": "arcade/thumb/index.html",
    "tag": "SEAM:CAM_CORE",
    "purpose": "same stack + two kills: landmarker reused across toggles (WASM leak) and the boot-time setTimeout(33) eternal chain replaced by a gated loop; edge velocities EMA'd in the pure translator, pose stays raw" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [('SEAM:CAM_CORE', 'arcade/rps/index.html'),
        ('SEAM:CAM_CORE', 'arcade/pop-a-shot/index.html'),
        ('SEAM:CAM_CORE', 'arcade/thumb/index.html')]
missing = [x for x in need if x not in reg]
assert not missing, 'STILL MISSING: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified for all 3')
