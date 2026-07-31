#!/usr/bin/env python3
# patch_worker_stimulus.py — SEAM:STIMULUS, worker side.
# Target: worker/src/index.js. Requires 0022_question_assets.sql applied.
#
# Two jobs:
#   1. Every door that hands questions to a respondent now hands the asset
#      pointers too (token door, guest door, public study door, client results).
#   2. serveMedia serves user-uploaded HTML with a Content-Security-Policy
#      sandbox header. The page renders these inside a sandboxed iframe already;
#      this covers the other route — someone opening the /media/ URL directly.
#      A mock landing page keeps its scripts, forms, and clicks; what it never
#      gets is an origin: no storage, no credentialed fetch against the API.

import io, os

PATH = os.environ.get('WORKER_PATH', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag, count=1):
    global s
    n = s.count(old)
    assert n == count, f'ANCHOR FAIL [{tag}]: count={n} (expected {count})'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── W1: the three respondent-door question selects grow the pointers ────────
# Same select string appears at exactly three sites: token door, guest door,
# public study door. One replacement, count-3 asserted — they must move together.
rep(
"study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options&order=ord",
"study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options,asset_key,asset_name&order=ord",
'W1a guest door + client results (x2)', count=2)

rep(
"study_question?study_id=eq.${i.study_id}&select=id,ord,type,prompt,options&order=ord",
"study_question?study_id=eq.${i.study_id}&select=id,ord,type,prompt,options,asset_key,asset_name&order=ord",
'W1b token door')

# ── W3: serveMedia — HTML gets a sandbox CSP ────────────────────────────────
rep(
"""  headers.set('Cache-Control', 'public, max-age=3600');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);""",
"""  headers.set('Cache-Control', 'public, max-age=3600');
  /* SEAM:STIMULUS — uploaded HTML (mock landing pages) is a first-class
     stimulus. Served with a CSP sandbox: scripts, forms, and clicks all work,
     but the document runs with an opaque origin — no storage, no credentialed
     reach into the API, even when the /media/ URL is opened directly rather
     than inside the response overlay's sandboxed iframe. */
  const ctype = String((obj.httpMetadata && obj.httpMetadata.contentType) || '');
  if (ctype.indexOf('text/html') >= 0)
    headers.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);""",
'W3 html sandbox CSP')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
