#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:APERTURE": { "file": "worker/src/index.js",
  "purpose": "cut 1 of the aperture arc: cross-issue memory — trailing-7-day published stories dedup the compose pool via sameStory (vector or entity law); suppressed count logged, feeds the RECURRENCE strip next; fetch failure degrades to memoryless compose, never blocks an edition" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:APERTURE', 'worker/src/index.js') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
