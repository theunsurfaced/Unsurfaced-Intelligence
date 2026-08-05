#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:DOOR_GATE": { "file": "intelligence/index.html",
  "purpose": "the user journey inversion (GATE-BEHIND-THE-CLICK spec): hub is the signed-out ground state, doors are turnstiles stashing pending_door, sign-in lands inside the chosen territory; approval law stacks after auth unchanged, guest rail rides above the hub, recovery/pending flows raise the gate directly, back-to-spaces escape on the turnstile gate" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:DOOR_GATE', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
