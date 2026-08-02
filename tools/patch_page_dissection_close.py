#!/usr/bin/env python3
# patch_page_dissection_close.py — SEAM:DISSECTION. Lens 2 closes: honest
# staleness, citation counts demoted to provenance, metadata never again
# wears an insight costume.
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ("      refreshLabel.textContent = hoursAgo === 0 ? 'UPDATED JUST NOW' : `UPDATED ${hoursAgo}H AGO`;",
   "      refreshLabel.textContent = hoursAgo === 0 ? 'ENRICHED JUST NOW' : `CURATED POOL · ENRICHED ${hoursAgo}H AGO · LIVE ON OPEN`;"),
  ("      stat:totalCites.toLocaleString()+'× combined citations',",
   "      stat:'evidence: '+totalCites.toLocaleString()+' citations across sources',"),
  ("      stat: `${cites.toLocaleString()}× combined citations · ${oa.meta?.count?.toLocaleString()||''} works`,",
   "      stat: `evidence: ${oa.meta?.count?.toLocaleString()||''} works · OpenAlex`,"),
  ("      stat: `${cites.toLocaleString()}× combined citations · ${ss.total?.toLocaleString()||''} papers`,",
   "      stat: `evidence: ${ss.total?.toLocaleString()||''} papers · Semantic Scholar`,"),
  ('      category:cat, title:`Citation Impact: "${title.slice(0,72)}"`,',
   '      category:cat, title:`Research signal: "${title.slice(0,72)}"`,'),
]
for k, (old, new) in enumerate(PAIRS):
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [D{k+1}]: count={n}'
    s = s.replace(old, new)
    print(f'  OK  D{k+1}')
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
