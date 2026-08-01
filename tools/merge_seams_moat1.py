#!/usr/bin/env python3
# merge_seams_moat1.py — register SEAM:MOAT_1. Repo root.
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))
add = {
  "SEAM:MOAT_1": {
    "file": "worker/src/index.js",
    "purpose": "first computed brand number: /excavate/brand-signal — pure computeBrandSignal over lake matches (90d mentions, 30d-vs-prior momentum with zero-division sentinel, tier-1 share, leading signals); under 3 real matches (sim>=.3) returns thin:true — the moat fills honestly or not at all" },
  "SEAM:MOAT_1@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:MOAT_1",
    "purpose": "LAKE SIGNAL block above the modeled chart on brand dashboards, badged COMPUTED — not modeled, with its timestamp; thin lake says 'not enough to measure yet'; failures render nothing; both excavateBrand branches fire the load" }
}
for k in add:
    s['registry'].pop(k, None); s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [('SEAM:MOAT_1', 'worker/src/index.js'), ('SEAM:MOAT_1', 'intelligence/index.html')]
missing = [x for x in need if x not in reg]
assert not missing, 'STILL MISSING: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified')
