#!/usr/bin/env python3
"""
UNSURFACED(TM) RITUAL GATE
The validation ritual, executable. Runs locally and in CI on every push.
Exit 0 = PASS (merge allowed). Exit 1 = FAIL (merge blocked).

Checks:
  1. JS syntax        node --check on every executable <script> block
  2. Payload identity GLB sha256 vs integrity.json baseline
  3. Font identity    Black Ops One @font-face byte-identical across carriers
  4. Link integrity   every internal href resolves to a real file
  5. Quote scan       curly quotes in importmap/JSON script blocks (silent killers)
  6. Seam registry    every registered seam exists; every SEAM: tag is registered
"""
import re, sys, json, glob, base64, hashlib, subprocess, tempfile, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
FAIL = []

def load(f):
    return open(f, encoding="utf-8", errors="replace").read()

surfaces = sorted(glob.glob("*.html") + glob.glob("*/index.html") + glob.glob("*/*/index.html"))
manifest = json.load(open("integrity.json"))
seams = json.load(open("seams.json"))

# ── 1. JS syntax ─────────────────────────────────────────────────────────
for f in surfaces:
    h = load(f)
    n = 0
    for attrs, body in re.findall(r"<script([^>]*)>(.*?)</script>", h, re.S):
        if any(k in attrs for k in ("importmap", "octet-stream", "application/json")) or not body.strip():
            continue
        n += 1
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as t:
            t.write(body); path = t.name
        r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
        os.unlink(path)
        if r.returncode != 0:
            FAIL.append(f"[js] {f} script#{n}: {r.stderr.strip().splitlines()[0][:140]}")
    print(f"  js      {f}: {n} scripts")

# ── 2. Payload identity ──────────────────────────────────────────────────
home = load("index.html")
for gid, want in manifest["payloads"].items():
    m = re.search(r'id="' + gid + r'"[^>]*>([^<]+)<', home)
    if not m:
        FAIL.append(f"[glb] {gid}: payload block missing"); continue
    got = hashlib.sha256(base64.b64decode(m.group(1).strip())).hexdigest()
    if got != want:
        FAIL.append(f"[glb] {gid}: DRIFT {got[:16]} != baseline {want[:16]}")
    print(f"  glb     {gid}: {'identical' if got == want else 'DRIFT'}")

# ── 3. Font identity ─────────────────────────────────────────────────────
fnt = manifest["fonts"]["black-ops-one"]
for f in fnt["carriers"]:
    m = re.search(r"@font-face\s*\{[^}]*Black Ops One[^}]*\}", load(f))
    if not m:
        FAIL.append(f"[font] {f}: Black Ops One @font-face missing"); continue
    got = hashlib.sha256(m.group(0).encode()).hexdigest()
    if got != fnt["sha256"]:
        FAIL.append(f"[font] {f}: font-face drift")
print(f"  font    black-ops-one: {len(fnt['carriers'])} carriers checked")

# ── 4. Link integrity ────────────────────────────────────────────────────
for f in surfaces:
    base = os.path.dirname(f)
    for href in re.findall(r'href="(\.\.?/[^"#?]*)"', load(f)):
        p = href
        target = os.path.normpath(os.path.join(base, p))
        if href.endswith("/") or os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not os.path.exists(target):
            FAIL.append(f"[link] {f}: {href} -> {target} missing")
print(f"  links   {len(surfaces)} surfaces checked")

# ── 5. Quote scan (non-executable blocks node can't catch) ───────────────
BAD = "\u201c\u201d\u2018\u2019"
for f in surfaces:
    for attrs, body in re.findall(r"<script([^>]*)>(.*?)</script>", load(f), re.S):
        if ("importmap" in attrs or "application/json" in attrs) and any(c in body for c in BAD):
            FAIL.append(f"[quote] {f}: curly quote in JSON/importmap block")
print("  quotes  scanned")

# ── 6. Seam registry ─────────────────────────────────────────────────────
found = {}  # (file, tag) presence
for f in surfaces:
    for tag in set(re.findall(r"SEAM:[A-Z_0-9]+", load(f))):
        found.setdefault(tag, set()).add(f)
for key, entry in seams["registry"].items():
    tag = entry.get("tag", key)
    if entry["file"] not in found.get(tag, set()):
        FAIL.append(f"[seam] {tag} registered for {entry['file']} but not found there")
registered = {(e.get("tag", k), e["file"]) for k, e in seams["registry"].items()}
for tag, files in found.items():
    for f in files:
        if (tag, f) not in registered:
            FAIL.append(f"[seam] {tag} in {f} is unregistered — add to seams.json")
print(f"  seams   {sum(len(v) for v in found.values())} tags across {len(found)} seam names")

# ── verdict ──────────────────────────────────────────────────────────────
print()
if FAIL:
    print("RITUAL GATE: FAIL")
    for line in FAIL:
        print("  ", line)
    sys.exit(1)
print("RITUAL GATE: PASS")
