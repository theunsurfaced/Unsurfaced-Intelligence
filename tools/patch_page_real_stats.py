#!/usr/bin/env python3
# patch_page_real_stats.py — SEAM:REAL_STATS. Founder law: every data point
# is REAL. All ten invented quantities in the featured pool die; each hook is
# rewritten as a directional claim the compiler can corroborate or contradict
# with actual evidence. No number renders without lineage.
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ('Creator partnerships now command premium CPMs over traditional media in 12 of 14 measured categories.',
   'Creator partnerships are commanding premium CPMs over traditional media across most measured categories.'),
  ('Sport has become the dominant secular community structure — athlete partnerships outperform celebrity by 2.4×.',
   'Sport has become the dominant secular community structure — athlete partnerships are outperforming celebrity endorsement.'),
  ('Cyclical nostalgia patterns are accelerating — the 20-year lag is compressing to 10 in digital-native cohorts.',
   'Cyclical nostalgia patterns are accelerating — the revival lag is visibly compressing in digital-native cohorts.'),
  ('Fandom-native brands achieve 3× NPS scores and 60% lower acquisition costs versus non-fandom competitors.',
   'Fandom-native brands show structurally stronger loyalty and cheaper acquisition than non-fandom competitors.'),
  ('TikTok-originated trends are reaching mainstream consumer adoption 60% faster than any prior cultural channel.',
   'TikTok-originated trends are reaching mainstream consumer adoption faster than any prior cultural channel.'),
  ('Six-second consideration windows require complete creative rethinking — most brand assets are built for 30s.',
   'Compressed consideration windows require complete creative rethinking — most brand assets are built for a longer attention era.'),
  ('Audio identity achieves 8.5× the recall of visual branding in streaming and voice contexts.',
   'Audio identity is showing materially stronger recall than visual branding in streaming and voice contexts.'),
  ('Brand adjacency incidents cause average 22% purchase intent decline — recovery takes 9–18 months.',
   'Brand adjacency incidents cause measurable purchase-intent decline — and recovery is slow, not instant.'),
  ('Unexpected brand collaborations generate 4× organic reach versus equivalent solo campaign spend.',
   'Unexpected brand collaborations are generating outsized organic reach versus equivalent solo campaign spend.'),
  ('Employer brand strength now correlates 0.71 with consumer NPS — they are no longer separate functions.',
   'Employer brand strength now tracks closely with consumer sentiment — they are no longer separate functions.'),
]
for k, (old, new) in enumerate(PAIRS):
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{k}]: count={n}'
    s = s.replace(old, new)
    print(f'  OK  stat {k+1}/10 deleted')
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
