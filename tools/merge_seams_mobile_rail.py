#!/usr/bin/env python3
# merge_seams_mobile_rail.py — register SEAM:MOBILE_RAIL. Repo root.
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key'
add = { "SEAM:MOBILE_RAIL": {
  "file": "intelligence/index.html",
  "purpose": "portrait first-class: the old 700px breakpoint deleted the nav (display:none, no replacement — the forced-rotate bug); replaced with snap-scroll nav rail, compact ticker, single-column grids (results/ideas/insights/audience/idb quads/sources/actions), breathing dashboard overlay, 40px tap targets, 16px inputs killing iOS zoom-on-focus" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
before = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:MOBILE_RAIL', 'intelligence/index.html') in reg
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, verified')
