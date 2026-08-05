#!/usr/bin/env python3
# patch_page_door_badges.py — door identities, not status labels:
# PLAY · Create / EXCAVATE · Learn / MINE · Grow.
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ('<span class="uai-status st-soon">Early access</span>', '<span class="uai-status st-soon">Create</span>', 'B1 PLAY badge'),
  ('<span class="uai-status st-live">Live</span>', '<span class="uai-status st-live">Learn</span>', 'B2 EXCAVATE badge'),
  ('<span class="uai-status st-dev">In development</span>', '<span class="uai-status st-dev">Grow</span>', 'B3 MINE badge'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
