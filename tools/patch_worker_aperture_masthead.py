#!/usr/bin/env python3
# patch_worker_aperture_masthead.py — SEAM:APERTURE cut 2: six additive
# lanes (sports-culture, wellness-fitness, retail-dtc, luxury,
# travel-experiences, media-platforms), beat-mapped for legacy SLATE compat.
# Existing slugs untouched — they are load-bearing. Feeds are cut 3.
import io, os
PATH = os.environ.get('TARGET', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s
for old, new, tag in [("  territories: [\n    'advertising-marketing','technology-innovation','artificial-intelligence',\n    'business-economics','entrepreneurship-creator','music','fashion-beauty',\n    'sneakers-streetwear','art-design','architecture-cities',\n    'entertainment-gaming','food-hospitality','sustainability-impact','global-diaspora'\n  ],", "  territories: [\n    'advertising-marketing','technology-innovation','artificial-intelligence',\n    'business-economics','entrepreneurship-creator','music','fashion-beauty',\n    'sneakers-streetwear','art-design','architecture-cities',\n    'entertainment-gaming','food-hospitality','sustainability-impact','global-diaspora',\n    /* SEAM:APERTURE cut 2 — the masthead widens ADDITIVELY (existing slugs are\n       load-bearing across feed tags and the classifier). Six new lanes from\n       the twenty-lane map; feeds to fill them are cut 3. */\n    'sports-culture','wellness-fitness','retail-dtc','luxury',\n    'travel-experiences','media-platforms'\n  ],", 'A2a'), ("    'entertainment-gaming':'culture', 'food-hospitality':'culture',\n    'sustainability-impact':'culture', 'global-diaspora':'culture'\n  },", "    'entertainment-gaming':'culture', 'food-hospitality':'culture',\n    'sustainability-impact':'culture', 'global-diaspora':'culture',\n    'sports-culture':'culture', 'wellness-fitness':'culture',\n    'retail-dtc':'tech', 'luxury':'culture',\n    'travel-experiences':'culture', 'media-platforms':'advertising'\n  },", 'A2b')]:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: {n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
