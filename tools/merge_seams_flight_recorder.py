#!/usr/bin/env python3
# merge_seams_flight_recorder.py — register SEAM:FLIGHT_RECORDER. Repo root.
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key'
add = { "SEAM:FLIGHT_RECORDER": {
  "file": "intelligence/index.html",
  "purpose": "the platform reports its own failures: crash bar paints any uncaught error/rejection with message+line, loading screen carries CANCEL (no scroll-locked dead ends), stage beacons + 25s watchdog name a stalled search, 3s SCRIPTS ARMED boot chip whose absence convicts a boot crash — born from a freeze that gave no testimony" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
before = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:FLIGHT_RECORDER', 'intelligence/index.html') in reg
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, verified')
