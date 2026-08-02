#!/usr/bin/env python3
# patch_worker_aperture_table.py — the caveat resolved: migrations name the
# table edition_items (0008). One-line re-anchor; the memory goes live.
import io, os
PATH = os.environ.get('TARGET', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
OLD = '      `edition_stories?select=title,source_name,editions!inner(date,status)&editions.date=gte.${since}&editions.status=eq.published&limit=120`) || [];'
NEW = '      `edition_items?select=title,source_name,editions!inner(date,status)&editions.date=gte.${since}&editions.status=eq.published&limit=120`) || [];'
n = s.count(OLD)
assert n == 1, f'ANCHOR FAIL: {n}'
s = s.replace(OLD, NEW)
io.open(PATH, 'w', encoding='utf-8').write(s)
print('  OK  edition_items · WROTE ' + PATH)
