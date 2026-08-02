#!/usr/bin/env python3
# patch_page_seam_tags.py — the gate's registry→code check caught two seams
# registered but untagged in the file. Tags added; the check is a good law.
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [('const _FEATURED_POOL = {', '/* SEAM:REAL_STATS — founder law: every data point is REAL. All invented\n * quantities deleted from this pool; hooks are directional claims the\n * compiler corroborates or contradicts with actual evidence. */\nconst _FEATURED_POOL = {', 'S1'), ("      refreshLabel.textContent = hoursAgo === 0 ? 'ENRICHED JUST NOW' : `CURATED POOL · ENRICHED ${hoursAgo}H AGO · LIVE ON OPEN`;", "      /* SEAM:DISSECTION — the label tells the truth about what updated means. */\n      refreshLabel.textContent = hoursAgo === 0 ? 'ENRICHED JUST NOW' : `CURATED POOL · ENRICHED ${hoursAgo}H AGO · LIVE ON OPEN`;", 'S2')]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: {n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
