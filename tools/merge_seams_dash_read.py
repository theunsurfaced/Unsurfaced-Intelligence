#!/usr/bin/env python3
# merge_seams_dash_read.py — register SEAM:DASH_READ. Repo root.
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key'
add = { "SEAM:DASH_READ": {
  "file": "intelligence/index.html",
  "purpose": "EVO-4 opener: THE READ compiled onto dashboards from their own evidence via report-mode synthesize (lake auto-joins); thin corpus silent, honest-fallback cards never feed the compiler, failure renders nothing; roadmapped rationale captions on every modeled module (retires-as register) + method line inside the Lake block" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
before = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:DASH_READ', 'intelligence/index.html') in reg
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, verified')
