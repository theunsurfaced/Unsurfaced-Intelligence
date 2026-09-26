#!/usr/bin/env python3
"""tools/sync_method.py  --  SEAM:PROMPT_SYNC.
After editing templates/CULTURAL_READ_METHOD.md, run from the repo root:
    python3 tools/sync_method.py
It rewrites the READ_METHOD constant in worker/src/index.js to the file's exact
text. The ritual gate fails whenever the two differ, so the Method the model
reads is always the Method in the repo."""
import json, os, re, sys
W, M = "worker/src/index.js", "templates/CULTURAL_READ_METHOD.md"
for f in (W, M):
    if not os.path.exists(f): sys.exit(f"ABORT: {f} not found. Run from the repo root.")
s, md = open(W, encoding="utf-8").read(), open(M, encoding="utf-8").read()
if "—" in md: sys.exit("ABORT: the Method contains an em dash; the voice law applies to it too.")
pat = re.compile(r'^const READ_METHOD = ".*";(?=\s+// SEAM:PROMPT_SYNC)', re.M)
if len(pat.findall(s)) != 1: sys.exit("ABORT: READ_METHOD line not found exactly once")
new = pat.sub(lambda m: "const READ_METHOD = " + json.dumps(md) + ";", s, count=1)
if new == s: print("already in sync: no changes"); sys.exit(0)
open(W, "w", encoding="utf-8").write(new)
print(f"READ_METHOD synced ({len(md)} chars). Deploy the worker for the model to read it.")
