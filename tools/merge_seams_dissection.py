#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:DISSECTION": { "file": "intelligence/index.html",
  "purpose": "Lens 2 dissection closed: staleness label honest (curated pool / enriched Nh ago / live on open), citation counts demoted from headline stat to provenance (evidence: N works / source), Citation Impact reframed as Research signal — metadata never again wears an insight costume" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:DISSECTION', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
