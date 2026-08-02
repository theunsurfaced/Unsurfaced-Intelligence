#!/usr/bin/env python3
# patch_page_collapse_duplicate.py -- the freeze's root cause, removed.
# Target: intelligence/index.html.
#
# Post-mortem, on the record: the flight-recorder stager harvested its T4
# block from an AMBIGUOUS start marker (window._clickStore = null; exists
# twice), captured a 56-line span from the wrong site, and the staged patch
# transplanted it -- doubling the _draftPreview tail through _guestSet, with
# the duplicate's opening lines at top-level scope where a bare closing brace
# broke the parse. That killed script block #0 at load: every function in it
# dead, every click inert -- the "freeze". This collapse was SIMULATED on the
# exact repo bytes before shipping: result parses clean in every block and
# matches canonical except one benign comment.
#
# The law it writes into the book: harvest anchors must be proven unique in
# the harvest source, and round-trip checks must verify the DESTINATION
# splice, not merely that the bytes exist somewhere in the reference file.

import io, os, re, subprocess, sys, tempfile

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()

PREV = 'window._clickStore = null;                     // preview records nothing\n'
n = s.count(PREV)
if n == 1:
    print('already collapsed -- one occurrence, nothing to do')
    sys.exit(0)
assert n == 2, f'expected 2 occurrences of the preview line, found {n} -- stop and report'

a = s.index(PREV) + len(PREV)
b = s.index(PREV, a) + len(PREV)
removed = s[a:b]
assert 800 < len(removed) < 6000 and '_tokenMaybeOpen' in removed, (
    f'span sanity failed ({len(removed)} chars) -- stop and report')
s = s[:a] + s[b:]
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'  OK  collapsed {len(removed)} duplicate chars ({removed.count(chr(10))} lines)')

TYPE_RE = re.compile("type\\s*=\\s*[\"']([^\"']+)")
bad = 0
for k, (attrs, sc) in enumerate(re.findall(r'<script([^>]*)>(.*?)</script>', s, re.S)):
    if 'src=' in attrs or not sc.strip():
        continue
    m = TYPE_RE.search(attrs)
    if (m.group(1) if m else 'text/javascript').lower() not in ('text/javascript', 'module', 'application/javascript'):
        continue
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(sc)
        tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    if r.returncode:
        print(f'  BLOCK {k} STILL FAILS:', r.stderr[:200])
        bad += 1
assert not bad, 'collapse insufficient -- stop and report'
print(f'  PASS  every JS block parses -- WROTE {PATH} ({len(s)} chars)')
