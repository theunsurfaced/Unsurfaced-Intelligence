#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:LAKE_LOOP": { "file": "worker/src/index.js",
  "purpose": "the organism breathes: /mine/publish-signal sends floor-cleared MINE aggregates into the lake as tier-0 signal (admin-gated, idempotent via content_hash mine-{study_id}, status filtered, raw doc embedding per the book); EXCAVATE brand signal and DASH_READ can now cite Unsurfaced's own field work" },
  "SEAM:LAKE_LOOP@arrival": { "file": "intelligence/index.html", "tag": "SEAM:LAKE_LOOP",
  "purpose": "admin Publish-to-lake button on study detail; worker enforces every law, the button asks and reports" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:LAKE_LOOP', 'worker/src/index.js') in reg and ('SEAM:LAKE_LOOP', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
