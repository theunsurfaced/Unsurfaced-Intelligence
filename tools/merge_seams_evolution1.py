#!/usr/bin/env python3
# merge_seams_evolution1.py — register SEAM:EVOLUTION_1. Run from repo root.
# Writes into seams.json["registry"], never the top level.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:EVOLUTION_1": {
    "file": "intelligence/index.html",
    "purpose": "usability pass, all roles: consent copy names behavior capture; progress counter (answered/total, sticky); tracked full-screen (expand-in-place, beacon never severed); draft preview (real overlay, records nothing, submit walled); CSV import (quoted-name aware, direct object mint); response CSV export (proper quoting); reminder relabel; study duplication (fresh ids, pointers carried); client report download (floor-gated, house-marked)" },
  "SEAM:EVOLUTION_1@worker": {
    "file": "worker/src/index.js",
    "tag": "SEAM:EVOLUTION_1",
    "purpose": "consent version 2026-08-behavior (new words, new version); milestone mail reaches granted clients at exactly the floor crossing and the target — the two moments the results room is most worth opening" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [('SEAM:EVOLUTION_1', 'intelligence/index.html'), ('SEAM:EVOLUTION_1', 'worker/src/index.js')]
missing = [x for x in need if x not in reg]
assert not missing, 'STILL MISSING: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified')
