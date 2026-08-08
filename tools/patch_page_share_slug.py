#!/usr/bin/env python3
# patch_page_share_slug.py — SEAM:SHARE_SLUG. Custom branded study permalinks.
import io, os
PATH = os.environ.get('TARGET', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ("function mineCopyLink(id) {\n  const url = API_BASE ? (API_BASE.replace(/\\/$/, '') + '/s/' + encodeURIComponent(id)) : (window.location.origin + window.location.pathname + '?study=' + encodeURIComponent(id));\n  const done = () => showToast('Link copied');\n  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(() => window.prompt('Copy the response link:', url));\n  else window.prompt('Copy the response link:', url);\n}",
   "/* SEAM:SHARE_SLUG — branded permalinks first: the copy button asks the worker\n * to mint (or return) the study's slug and copies unsurfaced-intelligence.com\n * /s/{slug}. Every fallback keeps the old behavior — a link is always copied. */\nasync function mineCopyLink(id) {\n  let url = API_BASE ? (API_BASE.replace(/\\/$/, '') + '/s/' + encodeURIComponent(id)) : (window.location.origin + window.location.pathname + '?study=' + encodeURIComponent(id));\n  try {\n    const s = mStudy(id);\n    if (s && s.slug) url = 'https://unsurfaced-intelligence.com/s/' + s.slug;\n    else if (API_BASE) {\n      const d = await api('mine/ensure-slug', { study_id: id });\n      if (d && d.ok && d.url) { url = d.url; if (s && d.slug) s.slug = d.slug; }\n    }\n  } catch (e) {}\n  const done = () => showToast('Link copied \\u2014 ' + url.replace(/^https?:\\/\\//, ''));\n  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(() => window.prompt('Copy the response link:', url));\n  else window.prompt('Copy the response link:', url);\n}",
   'P1 copy button slug-first'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
