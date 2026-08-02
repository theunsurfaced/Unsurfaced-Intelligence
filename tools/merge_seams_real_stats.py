#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:REAL_STATS": { "file": "intelligence/index.html",
  "purpose": "founder law enforced: every data point is REAL — all ten invented quantities in the featured pool deleted (2.4x, 3x, 4x, 8.5x, 60%, 22%, 0.71, 12-of-14, 20-to-10, six-second), hooks rewritten as directional claims the compiler corroborates or contradicts with actual evidence; no number renders without lineage" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:REAL_STATS', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
