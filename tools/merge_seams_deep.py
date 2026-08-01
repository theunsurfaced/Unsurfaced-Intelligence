#!/usr/bin/env python3
# merge_seams_deep.py — register SEAM:DEEP_RAIL. Run from repo root.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:DEEP_RAIL": {
    "file": "worker/src/index.js",
    "purpose": "the /deep route the page has called since birth: house PPLX key preferred with BYOK fallback, global + per-IP daily budget in KV answering 429, 6h response cache by payload hash (hits cost no budget), upstream status mirrored because the page's 401/402/429 copy branches on it, errors never cached" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:DEEP_RAIL', 'worker/src/index.js') in reg, 'STILL MISSING'
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified')
