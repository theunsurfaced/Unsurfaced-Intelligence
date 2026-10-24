#!/usr/bin/env python3
"""tools/sync_brief.py  --  SEAM:BRIEF_SYNC (ED1).
After editing templates/IMAGE_BRIEF.md, run from the repo root:
    python3 tools/sync_brief.py
It rewrites the IMAGE_BRIEF constant in worker/src/index.js to the file's exact
text. The ritual gate fails whenever the two differ, so the brief every house
image is made from is always the brief in the repo. Bump IMAGE_BRIEF_REV in the
worker when the change should re-make cached images (the hash carries it)."""
import json, os, re, sys
W, M = "worker/src/index.js", "templates/IMAGE_BRIEF.md"
for f in (W, M):
    if not os.path.exists(f): sys.exit(f"ABORT: {f} not found. Run from the repo root.")
s, md = open(W, encoding="utf-8").read(), open(M, encoding="utf-8").read()
if "—" in md: sys.exit("ABORT: the brief contains an em dash; the voice law applies to it too.")
if "## The prompt the model receives" not in md: sys.exit("ABORT: the brief needs the '## The prompt the model receives' section; makePrompt reads the text under it.")
for hole in ("{scene}", "{light}", "{red}"):
    if hole not in md.split("## The prompt the model receives")[1]: sys.exit(f"ABORT: the prompt paragraph is missing {hole}.")
pat = re.compile(r'^const IMAGE_BRIEF = ".*";(?=\s+// SEAM:BRIEF_SYNC)', re.M)
if len(pat.findall(s)) != 1: sys.exit("ABORT: IMAGE_BRIEF line not found exactly once")
new = pat.sub(lambda m: "const IMAGE_BRIEF = " + json.dumps(md) + ";", s, count=1)
if new == s: print("already in sync: no changes"); sys.exit(0)
open(W, "w", encoding="utf-8").write(new)
print(f"IMAGE_BRIEF synced ({len(md)} chars). Deploy the worker for the make service to read it.")
