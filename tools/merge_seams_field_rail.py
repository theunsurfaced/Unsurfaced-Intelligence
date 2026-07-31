#!/usr/bin/env python3
# merge_seams_field_rail.py — register the MINE FIELD RAIL arc.
# Run from repo root. Writes into seams.json["registry"] — never the top level,
# which is the trap that cost an hour last session. Verifies with the same
# (tag, file) lookup tools/ritual_gate.py builds, so a print here means the
# gate structurally cannot raise "unregistered" for these tags.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:FIELD_RAIL": {
    "file": "worker/src/index.js",
    "purpose": "tokenized invites — the paid fielding rail; mint/list/revoke, token study door, token respond burns the token; panel of 3 made this the only way to field" },
  "SEAM:FIELD_RAIL@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:FIELD_RAIL",
    "purpose": "?t= token door reusing the guest overlay; invited email locked, no ZIP, response timed for the quality scan" },
  "SEAM:RESPONSE_QUALITY": {
    "file": "worker/src/index.js",
    "purpose": "pure qualityScan — speeder, straightline, thin_open, attention_fail, incomplete; flags prompt review, only admin 'rejected' leaves the read (0021)" },
  "SEAM:CLIENT_LENS": {
    "file": "worker/src/index.js",
    "purpose": "study_client read-only grant + aggregateResponses/crossTab with a 25-response floor; client reads never select email or ZIP (0021)" },
  "SEAM:CLIENT_LENS@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:CLIENT_LENS",
    "purpose": "client home + live dashboard; floor explained in client language, bars, verbatims as anon labels, cross-tab selector, 60s poll; client-access grant lane in study detail" },
  "SEAM:RESPONSE_QUALITY@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:RESPONSE_QUALITY",
    "purpose": "review lane on response cards — flags visible, admin clean/reject verdicts and the withdrawal delete, every write asserted by returned row count (RLS silent no-op law)" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)          # scrub any top-level stray from a prior attempt
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [
  ('SEAM:FIELD_RAIL', 'worker/src/index.js'),
  ('SEAM:FIELD_RAIL', 'intelligence/index.html'),
  ('SEAM:RESPONSE_QUALITY', 'worker/src/index.js'),
  ('SEAM:RESPONSE_QUALITY', 'intelligence/index.html'),
  ('SEAM:CLIENT_LENS', 'worker/src/index.js'),
  ('SEAM:CLIENT_LENS', 'intelligence/index.html'),
]
missing = [t for t in need if t not in reg]
assert not missing, 'STILL MISSING FROM REGISTRY: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified for all 4')
