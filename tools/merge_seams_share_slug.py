#!/usr/bin/env python3
import io, json
s = json.load(open('seams.json'))
assert 'registry' in s
add = { "SEAM:SHARE_SLUG": { "file": "worker/src/index.js",
  "purpose": "branded study permalinks: /s/{key} resolves by UUID or slug (live-only gate unchanged), slugs mint lazily from the title (kebab, diacritic-folded, deduped, capped 60) and never change once set — permalink law; /mine/ensure-slug authed endpoint (partner-or-admin) mints on demand; lake share cards carry the branded URL (0024)" },
  "SEAM:SHARE_SLUG@arrival": { "file": "intelligence/index.html", "tag": "SEAM:SHARE_SLUG",
  "purpose": "copy-link goes slug-first: known slug copies unsurfaced-intelligence.com/s/{slug}, else ensure-slug mints one, every fallback still copies a working link; toast shows the copied domain" } }
for k in add: s['registry'].pop(k, None); s.pop(k, None)
b = len(s['registry']); s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')
chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
assert ('SEAM:SHARE_SLUG', 'worker/src/index.js') in reg and ('SEAM:SHARE_SLUG', 'intelligence/index.html') in reg
print(f'REGISTRY: {b} -> {len(chk["registry"])}')
