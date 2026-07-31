#!/usr/bin/env python3
# merge_seams_stimulus.py — register SEAM:STIMULUS. Run from repo root.
# Writes into seams.json["registry"], never the top level.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:STIMULUS": {
    "file": "intelligence/index.html",
    "purpose": "assets become stimuli: universal renderer (_assetKind/_assetHtml) — image/video/audio/html by filename; HTML renders live + clickable in iframe sandbox=allow-scripts allow-forms allow-popups, never allow-same-origin; per-question attach in the builder, pointers survive save/persist/load (0022)" },
  "SEAM:STIMULUS@worker": {
    "file": "worker/src/index.js",
    "tag": "SEAM:STIMULUS",
    "purpose": "all three respondent doors select asset_key/asset_name; serveMedia adds CSP sandbox header to text/html so a directly-opened mock landing page still runs with an opaque origin" },
  "SEAM:CLICKPATH": {
    "file": "worker/src/index.js",
    "purpose": "behavior beside stated response: CLICK_BEACON appended to served HTML at serve time (never spliced, range-safe), cleanClicks total sanitizer (200-event budget, hostile-proof), clickSummary first-click distribution; all three response writes store clicks (0023)" },
  "SEAM:CLICKPATH@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:CLICKPATH",
    "purpose": "one message listener routes beacon events by contentWindow identity into the active response store; guest/token/responder flows arm and carry; client dashboard behavior block (first click = the headline) + admin interaction chip" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [('SEAM:STIMULUS', 'intelligence/index.html'), ('SEAM:STIMULUS', 'worker/src/index.js'),
        ('SEAM:CLICKPATH', 'worker/src/index.js'), ('SEAM:CLICKPATH', 'intelligence/index.html')]
missing = [x for x in need if x not in reg]
assert not missing, 'STILL MISSING: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified')
