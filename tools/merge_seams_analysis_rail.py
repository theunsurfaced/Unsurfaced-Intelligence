#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:ANALYSIS_RAIL": { "file": "worker/src/index.js",
  "purpose": "MINE phase 1 vs the industry bar: segment lens (census from the full set, aggregate on the filtered set, floor law applies to the filtered n), top-2-box computed for scales, THE MINE READ — the compiler judges primary research at last: house two-liner + themes with quotes VERIFIED VERBATIM against real responses (no counts: an estimated count violates the real-stats law; measured counts arrive with embedding clustering v2), KV-cached by n+segment so polling never re-burns AI, failure ships numbers without the read" },
  "SEAM:ANALYSIS_RAIL@arrival": { "file": "intelligence/index.html", "tag": "SEAM:ANALYSIS_RAIL",
  "purpose": "client room: segment select with counts, THE READ block (honesty label: quotes verbatim, themes read not counted), T2B chip on scale bars, lens carried through cache and poll" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:ANALYSIS_RAIL', 'worker/src/index.js') in reg and ('SEAM:ANALYSIS_RAIL', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
