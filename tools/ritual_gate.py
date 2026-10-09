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
  5c. Stacking law   every z-index on intelligence/index.html is a --z-* token
  5d. Content law    no hand-typed content pools render on intelligence/index.html
  5e. One name        no page declares the same top-level function twice
  6. Seam registry    every registered seam exists; every SEAM: tag is registered
  7. Voice law        no em dash in any worker string literal (glyph or escape)
  8. Swallow ratchet  empty catches may only go down
  9. Spender registry every AI-spending function is registered with its guard
 10. Proofs           every worker/proofs/*.mjs exits 0
 11. Prompt sync      worker READ_METHOD == templates/CULTURAL_READ_METHOD.md
"""
import re, sys, json, glob, base64, hashlib, subprocess, tempfile, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
FAIL = []

def load(f):
    return open(f, encoding="utf-8", errors="replace").read()

surfaces = sorted(glob.glob("*.html") + glob.glob("*/index.html") + glob.glob("*/*/index.html"))
worker_js = sorted(glob.glob("worker/src/*.js"))
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
        try:
            r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
        except FileNotFoundError:
            os.unlink(path)
            print("  js      Node.js not installed locally - JS checks deferred to CI")
            break
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

# ── 5b. Worker syntax ────────────────────────────────────────────────────
for f in worker_js:
    try:
        # Module mode (.mjs) matters: the worker ships as an ES module, where
        # duplicate top-level declarations are fatal but script mode allows them.
        with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8") as t:
            t.write(load(f)); mjs = t.name
        r = subprocess.run(["node", "--check", mjs], capture_output=True, text=True)
        os.unlink(mjs)
        if r.returncode != 0:
            FAIL.append(f"[js] {f}: {r.stderr.strip().splitlines()[0][:140]}")
        print(f"  js      {f}: checked (module mode)")
    except FileNotFoundError:
        print("  js      worker: Node.js not installed locally - deferred to CI")

# ── 5c. Stacking law (SURFACE_LAW seam, intelligence surface) ────────────
# Every z-index on the EXCAVATE surface is a --z-* token defined in :root.
# A literal (z-index:400, z-index:999999) is a stacking-law violation.
_zf = "intelligence/index.html"
if os.path.exists(_zf):
    _zs = load(_zf)
    _zbad = [m.group(0).strip() for m in re.finditer(r"z-index\s*:(?!\s*var\(--z-)[^;\"'}]+", _zs)]
    if _zbad:
        FAIL.append(f"[z] {_zf}: {len(_zbad)} z-index literal(s), not --z-* tokens: {_zbad[:3]}")
    _ztok = set(re.findall(r"--z-([a-z-]+)\s*:", _zs))
    _zuse = set(re.findall(r"var\(--z-([a-z-]+)\)", _zs))
    _zmiss = sorted(_zuse - _ztok)
    if _zmiss:
        FAIL.append(f"[z] {_zf}: z tokens used but not defined in :root: {_zmiss}")
    print(f"  z       {_zf}: {len(_zuse)} tokens in use, {len(_zbad)} literals")

# ── 5d. Content contract (HUB_FEED seam, intelligence surface) ───────────
# Hand-typed content pools do not render on the EXCAVATE surface. The feed,
# the desk, the tracks table and the lake are the only sources of cards.
_cf = "intelligence/index.html"
if os.path.exists(_cf):
    _cs = load(_cf)
    _cbad = [n for n in ("_TRENDING_POOL", "_AUD_DATA", "_BRAND_DATA", "_seedInitialReports(", "_AUD_CATS", "_AUD_MEDIA", "_AUD_DRIVERS", "_depStore") if n in _cs]   # EX18b: invented percentages and a seeded deploy queue
    _cbad += [m.group(0) for m in re.finditer(r"const _[A-Z_]+_POOL\s*=\s*\[\s*\{", _cs)]
    if _cbad:
        FAIL.append(f"[content] {_cf}: hand-typed pools present: {_cbad[:4]}")
    print(f"  content {_cf}: {len(_cbad)} typed pools")

# ── 5e. One name, one function (every surface) ──────────────────────────
# Two top-level declarations of one function in a page's classic scripts:
# the later one wins everywhere, silently. EX15's door band took the name
# of the custom read's voices and broke every custom read's render (EX18b).
for f in surfaces:
    _seen = {}
    for _attrs, _body in re.findall(r"<script([^>]*)>(.*?)</script>", load(f), re.S):
        if any(k in _attrs for k in ("src=", "module", "json", "importmap", "octet-stream")):
            continue
        for _fn in re.findall(r"^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", _body, re.M):
            _seen[_fn] = _seen.get(_fn, 0) + 1
    _dup = sorted(k for k, v in _seen.items() if v > 1)
    if _dup:
        FAIL.append(f"[dup] {f}: functions declared twice (the later wins): {_dup[:5]}")
print(f"  dup     {len(surfaces)} surfaces scanned")

# ── 6. Seam registry (surfaces + worker source) ──────────────────────────
found = {}  # (file, tag) presence
for f in surfaces + worker_js:
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

# ── 7. Voice law (worker strings) ────────────────────────────────────────
# No em dash in any worker string literal: glyph, — escape or &mdash;.
# Comments are free. The escape form was how 31 strings slipped past a
# glyph-only scan. pvDecode (outside article text) is the one sanctioned case.
sys.dont_write_bytecode = True   # no __pycache__ in the repo
sys.path.insert(0, os.path.join(ROOT, "tools"))
import jsscan
for f in worker_js:
    _vd = jsscan.dash_strings(load(f))
    for _a, _b, _ln, _lit in _vd[:5]:
        FAIL.append(f"[voice] {f}:{_ln}: em dash in a string: {_lit[:80]}")
    print(f"  voice   {f}: {len(_vd)} dashed strings")

# ── 8. Swallow ratchet ───────────────────────────────────────────────────
# An empty catch hides a failure. Some are deliberate (logging must never
# break a request), so the count is not zero; it can only go down. Lower
# SWALLOW_CEILING whenever a cut removes some.
SWALLOW_CEILING = 124
for f in worker_js:
    _s = load(f)
    _sw = len(re.findall(r"catch\s*(?:\([^)]*\))?\s*\{\s*\}", _s)) + len(re.findall(r"\.catch\(\s*\(\s*\w*\s*\)\s*=>\s*(?:\{\s*\}|null|undefined|\[\]|''|false)\s*\)", _s))
    if _sw > SWALLOW_CEILING:
        FAIL.append(f"[swallow] {f}: {_sw} empty catches > ceiling {SWALLOW_CEILING}")
    print(f"  swallow {f}: {_sw} (ceiling {SWALLOW_CEILING})")

# ── 9. AI spender registry ───────────────────────────────────────────────
# Every function that spends on a model or a paid rail is named here with
# the guard that bounds it. A new spender without an entry fails the gate;
# an entry whose function stopped spending fails too (stale guard).
SPENDERS = {
    'callModel': 'the router itself; public callers pass underLimit (DAILY_LIMIT) at the door',
    'callClaude': 'claudeGate: tier dollar cap + KV kill switch, fail loud',
    'claudeBatchSubmit': 'claudeGate on the summed estimate; reservation at submit',
    'claudeBatchDrain': 'reads results only; trues the ledger up, never submits',
    'claudeRoute': 'callerIsAdmin at the door',
    'composeFromLake': 'cron-bounded: 06:10 compose only',
    'runDailyPipeline': 'cron-bounded; /daily/run is secret-guarded',
    'spineAdvance': 'cron-bounded: drain slice with a call budget',
    'deskCompile': 'cron-bounded; /excavate/desk is admin-guarded',
    'embedQuery': 'callers are gated (excavateAuth, admin, underLimit)',
    'kbEmbed': 'callerIsAdmin on every /knowledge route',
    'excavateAnchors': 'callerIsAdmin',
    'excCompile': 'the EXCAVATE lane: claudeGate on the live tier (cap, kill switch), the overnight share, then the reserve model; callers are gated (excavateAuth, feedWarm cron)',
    'excavateVoice': 'excavateAuth + KV cache',
    'gatherPaidSignals': 'SIGNAL_DAILY_DOLLARS real-dollar cap + 6h cache',
    'pplx': 'PPLX_DAILY_DOLLARS cap + 6h cache',
    'mineAsk': 'underLimit (DAILY_LIMIT)',
    'mineSynthesize': 'underLimit (DAILY_LIMIT)',
    'mineClientResults': 'client grant + CLIENT_FLOOR + KV-cached read',
    'minePublishSignal': 'callerIsAdmin',
    'playGenerate': 'underLimit (DAILY_LIMIT); the words on claudeGate, live tier (cap, kill switch) through callClaude with a room per kind, Workers AI as the reserve when the tier refuses (SEAM:PLAY_CLAUDE)',
    'playInterpret': 'underLimit (DAILY_LIMIT) + claudeGate on the frame tier (Haiku, its own cap) + a week of KV cache per ask + a 7s deadline; signed in (SEAM:PLAY_BRIEF)',
    'playImage': 'underLimit (DAILY_LIMIT)',
    'playRender': 'renderBudget: personal seconds + RENDER_CEILING house seconds',
    'playAssemble': 'renderBudget',
    'pvTranslate': 'pvTranslateAllowed: per-IP hourly + house daily meter',
    'synthesize': 'underLimit (DAILY_LIMIT) on /excavate/*',
    'studioCaption': 'cron-bounded manifest + admin cut-story',
    'studioMemeLines': 'cron-bounded manifest + admin cut-story',
    'readSubmit': 'claudeGate via claudeBatchSubmit (doc tier cap; a deep RECON sends its first pass through deepThinkSend, on the recon tier, inside its commission ceiling on the worst case of all four passes, and only from deepCompile\'s claim); admin route or readTick only',
    'deepThinkSend': 'claudeBatchSubmit on the recon tier (exact $150 cap) inside the commission ceiling on its own estimate, the worst case of every pass after it and the copy desk; called by readSubmit (from deepCompile\'s claim) and the pass stages under the row\'s lease; a pass already sent is adopted from claude_jobs, never sent twice; at most 1 + READ_THINK.RESENDS sends a pass (SEAM:READ_THINK)',
    'deepRenders': 'Workers AI image model (flux-1-schnell) on a landed RECON written in passes only (readLand, from the drain or an adoption): at most READ_THINK.RENDERS images a landing, and a brief already drawn for the RECON is never drawn again (SEAM:READ_THINK)',
    'readSubmitRevision': 'claudeGate via claudeBatchSubmit (doc tier cap; a deep RECON on the recon tier, inside its commission ceiling on the revision\'s own estimate) on the prior pack; /reads/revise (admin) or readTick on a queued revise row only (SEAM:READ_DESK)',
    'deepEmbed': 'the deep RECON search stage only (readTick, /reads/commission and /reads/release, admin): Workers AI embeddings for at most 36 phrasings a RECON (SEAM:READ_DEEP)',
    'deepPlanStage': 'claudeGate on the recon tier (exact $150 cap, never multiplied) + the commission ceiling (deepRoom on the worst-case estimate); one plan per RECON, at most READ_DEEP.TRIES tries (SEAM:READ_DEEP)',
    'deepReadStage': 'claudeBatchSubmit on the recon tier; the commission ceiling is checked before a page is fetched and trims the batches before submit (the comment coding first, the cards last, room kept for the compile and the desk); batches already sent are adopted, never sent again; once per RECON under its lease (SEAM:READ_DEEP)',
    'deepExtract': 'Tavily extract (FIELD_API_KEY credits, a credit for every five pages) on the deep read stage only, inside the commission ceiling checked before it runs; pages read are kept, so a retry never pays twice (SEAM:READ_DEEP)',
    'fieldRail': 'excavateAuth + on request only (field: true); one Tavily search a call against FIELD_API_KEY\'s monthly credits (SEAM:EXCAVATE_WIRE)',
    'deepOutletTypes': 'claudeGate on the recon tier; a Haiku call per READ_DEEP.OUTLET.CHUNK outlets neither the registry nor the learned map (one KV entry) knows, at most READ_DEEP.OUTLET.MAX a RECON (SEAM:READ_DEEP)',
    'readProofPart': 'claudeGate on the live tier per part; called by readProof only, which readLand (the batch drain) and the admin /reads/proof door call; READ_PROOF.PARALLEL parts at once',
    'callClaudeStream': 'claudeGate: tier dollar cap + KV kill switch, the same row in claude_jobs; called by excCompile only',
    'doorPass': 'claudeBatchSubmit on the live tier under the overnight share (OVERNIGHT_SHARE of the live cap), cron-bounded (06:10 chain) or the admin /excavate/desk door; stamp reuse asks the model only about frames whose evidence moved',
    'excFacts': 'claudeGate on the frame tier (Haiku, its own cap) + a 9s deadline per chunk; called by synthesize only (excavateAuth), at most 4 chunks of 11 lines per read',
    'excGapCheck': 'claudeGate on the frame tier (Haiku, its own cap) + a 4.5s deadline; one call per read, called by synthesize only (excavateAuth)',
    'excFrameFor': 'claudeGate on the frame tier (Haiku, its own $3 cap) + a week of KV cache per query + a 4.5s deadline; callers: synthesize and gather (excavateAuth) and excFrameTiles (the public feed, at most one set of 12 per edition, cached 6h)',
    'benchGrade': 'claudeGate on the frame tier (Haiku); called by benchRun only, which the desk key or a signed-in admin opens (SEAM:BENCH); one call per pack, at most sixty kept',
    'roleImplications': 'claudeGate on the frame tier (Haiku) + a day of KV cache per insight and role; called by roleImplicationsRoute only, signed in (SEAM:ROLE_IMPLICATIONS)',
    'pushBrief': 'claudeGate on the frame tier (Haiku); called by pushNightly only (cron-bounded, the 06:10 chain, or the admin desk {run: push}), once per reader on their digest day and only when their frames deployed (SEAM:REACH_PUSH)',
    'excLook': 'Workers AI vision over at most LOOK.MAX images inside LOOK.MS; called by synthesize only (excavateAuth), on a full read, never for quick reads or the bench (SEAM:EXC_LOOK)',
    'crossCurrentsPass': 'claudeGate on the doc tier (Fable); called by crossCurrentsWeekly (cron-bounded: Sundays in the 06:10 chain) or the admin desk {run: currents}; one call a week over at most 80 rows (SEAM:CROSS_CURRENTS)',
}
_SP_MARK = re.compile(r"env\.AI\.run\(|(?<!function )callModel\(|(?<!function )callClaude\(|(?<!function )claudeBatchSubmit\(|queue\.fal\.run|api\.perplexity\.ai|api\.exa\.ai|api\.tavily\.com|CLAUDE\.API \+")
_SP_DECL = re.compile(r"^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|^\s{2,6}(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{\s*$")
_SP_RESET = re.compile(r"^(?:const|let|var|export default)\b|^/\*")
_SP_KW = {"if", "for", "while", "switch", "catch", "function", "return", "else", "do", "try", "with"}
for f in worker_js:
    _cur, _found = None, set()
    for _l in load(f).split("\n"):
        if _SP_RESET.match(_l): _cur = None
        _m = _SP_DECL.match(_l)
        if _m and (_m.group(1) or _m.group(2)) not in _SP_KW: _cur = _m.group(1) or _m.group(2)
        if _l.strip().startswith(("//", "*", "/*")): continue
        if _cur and _SP_MARK.search(_l): _found.add(_cur)
    for _n in sorted(_found - set(SPENDERS)):
        FAIL.append(f"[spend] {f}: {_n} spends on AI but is not in SPENDERS with its guard")
    for _n in sorted(set(SPENDERS) - _found):
        FAIL.append(f"[spend] {f}: SPENDERS lists {_n} but it no longer spends (stale entry)")
    print(f"  spend   {f}: {len(_found)} spenders, {len(SPENDERS)} registered")

# ── 10. Proofs runner ────────────────────────────────────────────────────
# Every behavioral proof in worker/proofs runs on every gate. A proof that
# only runs when someone remembers is not a proof.
_proofs = sorted(glob.glob("worker/proofs/*.mjs"))
for _p in _proofs:
    try:
        _r = subprocess.run(["node", _p], capture_output=True, text=True, timeout=120)
        if _r.returncode != 0:
            _tail = (_r.stderr or _r.stdout).strip().splitlines()
            FAIL.append(f"[proof] {_p}: exit {_r.returncode}: {(_tail[-1] if _tail else '')[:120]}")
    except FileNotFoundError:
        print("  proofs  Node.js not installed locally - deferred to CI"); break
print(f"  proofs  {len(_proofs)} run")

# ── 11. Prompt sync (SEAM:PROMPT_SYNC) ───────────────────────────────────
# The Method the model reads is the Method in the repo, byte for byte.
# Edit templates/CULTURAL_READ_METHOD.md, then run tools/sync_method.py.
_mf = "templates/CULTURAL_READ_METHOD.md"
for f in worker_js:
    _pm = re.search(r'^const READ_METHOD = (".*");(?=\s+// SEAM:PROMPT_SYNC)', load(f), re.M)
    if not _pm: continue
    if not os.path.exists(_mf):
        FAIL.append(f"[prompt] {_mf} missing")
    elif json.loads(_pm.group(1)) != load(_mf):
        FAIL.append(f"[prompt] {f}: READ_METHOD differs from {_mf}; run tools/sync_method.py")
    print(f"  prompt  {f}: READ_METHOD {'in sync' if os.path.exists(_mf) and json.loads(_pm.group(1)) == load(_mf) else 'DRIFT'}")

# ── 12. The bench (SEAM:BENCH) ───────────────────────────────────────────
# The writer's slices (the laws, the prompts, the room) are hashed exactly as tools/bench/writer_hash.mjs hashes them. When the
# hash differs from the one tools/bench/last.json was written against, the bench has not seen this writer: the gate fails. When
# last.json is missing the step warns (the first bench has not run); below the floor it fails.
_WRITER_SLICES = [('const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '), ('const EXC_MOVE_LAW = ', 'function excReportPrompt('), ('function excReportPrompt(', 'function excAnchors('),
                  ('const EXC_NUMBER_LAW = ', None), ('const EXC_VOICE_SYS = ', None), ('const EXC_TIME_LAW = ', None), ('function excDoorPrompt(', '// The compiled text becomes'),
                  ("    const tight = ' ROOM LAW", '    const passes = [];')]
_DECL = re.compile(r"\n(?=(?:const |let |function |async function |/\*|// ))")
def writer_hash(src):
    parts = []
    for a, b in _WRITER_SLICES:
        i = src.find(a)
        if i < 0: raise ValueError('writer slice missing: ' + a)
        if b: j = src.find(b, i + 1)
        else:
            m = _DECL.search(src, i + len(a)); j = m.start() if m else len(src)
        if j < 0: raise ValueError('writer slice end missing: ' + str(b))
        parts.append(src[i:j])
    return hashlib.sha256('\n'.join(parts).encode('utf-8')).hexdigest()
for f in worker_js:
    try: _wh = writer_hash(load(f))
    except ValueError as e: FAIL.append(f"[bench] {f}: {e}"); continue
    _bf = "tools/bench/last.json"
    if not os.path.exists(_bf):
        print(f"  bench   {f}: writer {_wh[:12]}; no bench on record yet (tools/bench/run.mjs)")
        continue
    try: _b = json.load(open(_bf))
    except Exception as e: FAIL.append(f"[bench] {_bf} unreadable: {e}"); continue
    if _b.get("writer_hash") != _wh:
        FAIL.append(f"[bench] {f}: the writer changed since the bench last ran ({str(_b.get('writer_hash'))[:12]} -> {_wh[:12]}); run tools/bench/run.mjs against the uploaded version")
    elif _b.get("mean") is not None and _b.get("mean") < _b.get("floor", 70):
        FAIL.append(f"[bench] mean {_b.get('mean')} is below the floor {_b.get('floor', 70)}")
    print(f"  bench   {f}: writer {_wh[:12]}, last run {str(_b.get('at'))[:10]} mean {_b.get('mean')} on {_b.get('ok')} of {_b.get('packs')} packs")

# ── verdict ──────────────────────────────────────────────────────────────
print()
if FAIL:
    print("RITUAL GATE: FAIL")
    for line in FAIL:
        print("  ", line)
    sys.exit(1)
print("RITUAL GATE: PASS")
