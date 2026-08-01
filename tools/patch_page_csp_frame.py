#!/usr/bin/env python3
# patch_page_csp_frame.py — the white-box fix.
# Target: intelligence/index.html
# The CSP meta had no frame-src, so iframes fell back to default-src 'self'
# and the browser refused to frame the api origin — silently, per the CSP law
# already in the book. Same disease as the media-src fix, frame edition:
# stimulus iframes load from api.unsurfaced-intelligence.com and need saying so.

import io, os

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

old = "media-src 'self' https://api.unsurfaced-intelligence.com https://*.workers.dev; object-src 'none';"
new = "media-src 'self' https://api.unsurfaced-intelligence.com https://*.workers.dev; frame-src 'self' https://api.unsurfaced-intelligence.com https://*.workers.dev; object-src 'none';"
n = s.count(old)
assert n == 1, f'ANCHOR FAIL [F1 frame-src]: count={n} (expected 1)'
s = s.replace(old, new)
print('  OK  F1 frame-src added to CSP')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
