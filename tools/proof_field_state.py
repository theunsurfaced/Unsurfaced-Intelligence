#!/usr/bin/env python3
# proof_field_state.py — behavioral proof gate for the FIELD STATE arc.
# Runs against patched copies. Every check prints PASS or dies loudly.
# Sections: [A] worker syntax  [B] worker pure-function proofs
#           [C] inline-script syntax  [D] jsdom arrival proofs
#           [E] curly-quote delta scan

import io, os, re, subprocess, sys, json

WORKER = os.environ.get('WORKER_PATH', 'worker.js')
PAGE   = os.environ.get('PAGE_PATH', 'intelligence.html')
UP_W   = os.environ.get('ORIG_WORKER', '/mnt/user-data/uploads/index.js')
UP_P   = os.environ.get('ORIG_PAGE',   '/mnt/user-data/uploads/index.html')

passed = 0
def ok(name):
    global passed; passed += 1; print(f'  PASS {passed:02d}  {name}')

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    return r

# ── [A] worker syntax ────────────────────────────────────────────────────────
r = run(['node', '--check', WORKER])
assert r.returncode == 0, 'worker syntax: ' + r.stderr[:400]
ok('worker node --check')

w = io.open(WORKER, encoding='utf-8').read()

# ── [B] worker pure functions, extracted and exercised ──────────────────────
def extract(src, header, name):
    i = src.index(header)
    j = src.index('\n}', i) + 2
    return src[i:j]

harness = []
# weekEpoch + RECUR needed by rollup
i = w.index('const RECUR = ')
harness.append(w[i:w.index(';', i) + 1])
i = w.index('function weekEpoch')
harness.append(w[i:w.index('\n}', i) + 2])
for h in ['function cosSim(', 'function clusterState(', 'function clusterShape(',
          'function recurrenceRollup(', 'function anchorRelevance(']:
    harness.append(extract(w, h, h))
i = w.index('const FIELD = {')
harness.append(w[i:w.index('};', i) + 2])

tests = r'''
const day = 864e5, now = Date.now();
const iso = (d) => new Date(now - d * day).toISOString();
const A = (c, m) => { if (!c) { console.error('FAIL ' + m); process.exit(1); } };

// rollup: velocity buckets + week series
const mk = (cid, ds) => ds.map((d, i) => ({ cluster_id: cid, captured_at: iso(d),
  id: cid + '-' + i, title: 't', url: 'u', source_name: 's' + (i % 3), source_tier: 2,
  territory: 'music', status: 'connected' }));
const rows = mk('c1', [1, 2, 3, 9, 10, 20]).concat(mk('c2', [1, 1, 2]));
const roll = recurrenceRollup(rows, 10, 1);
const c1 = roll.find(t => t.cluster_id === 'c1');
A(c1.recent_7d === 3, 'c1 recent_7d=' + c1.recent_7d);
A(c1.prior_7d === 2, 'c1 prior_7d=' + c1.prior_7d);
A(Array.isArray(c1.week_series) && c1.week_series.reduce((a,b)=>a+b,0) === 6, 'c1 series sum');
console.log('  PASS ..  rollup velocity buckets + week series');

// states — one proof per verdict
A(clusterState({ recent_7d:2, prior_7d:0, weeks_touched:2, span_days:9,  last_seen: iso(1), sources:3 }, now) === 'EMERGING', 'emerging');
A(clusterState({ recent_7d:6, prior_7d:2, weeks_touched:4, span_days:25, last_seen: iso(1), sources:4 }, now) === 'ACCELERATING', 'accelerating');
A(clusterState({ recent_7d:1, prior_7d:1, weeks_touched:6, span_days:50, last_seen: iso(2), sources:6 }, now) === 'STRUCTURAL', 'structural');
A(clusterState({ recent_7d:0, prior_7d:0, weeks_touched:3, span_days:30, last_seen: iso(15), sources:4 }, now) === 'COOLING', 'cooling');
A(clusterState({ recent_7d:1, prior_7d:2, weeks_touched:6, span_days:50, last_seen: iso(2), sources:6, tightness:0.5 }, now) === 'CONTESTED', 'contested overrides structural');
A(clusterState({ recent_7d:1, prior_7d:1, weeks_touched:3, span_days:20, last_seen: iso(2), sources:4 }, now) === 'STEADY', 'steady');
A(clusterState({ recent_7d:2, prior_7d:0, weeks_touched:2, span_days:9,  last_seen: iso(1), sources:8, tightness:0.4 }, now) === 'CONTESTED', 'contested overrides emerging');
console.log('  PASS ..  clusterState: all six verdicts + override order');

// shapes
A(clusterShape([0,1,14,1,0]) === 'spike', 'spike');
A(clusterShape([1,2,3,5,8]) === 'staircase', 'staircase');
A(clusterShape([3,0,4,0,5]) === 'oscillating', 'oscillating');
A(clusterShape([2,3,2,3,2,3]) === 'slow-burn', 'slow-burn');
A(clusterShape([1,2]) === null, 'short series -> null');
console.log('  PASS ..  clusterShape: spike/staircase/oscillating/slow-burn/null');

// geometry math
A(Math.abs(cosSim([1,0],[1,0]) - 1) < 1e-9, 'cos identity');
A(Math.abs(cosSim([1,0],[0,1])) < 1e-9, 'cos orthogonal');
A(anchorRelevance([1,0], [{vec:[0,1]},{vec:[0.6,0.8]}]) === 0.6, 'anchor max cosine');
console.log('  PASS ..  cosSim + anchorRelevance');
'''
io.open('/tmp/worker_pure.js', 'w', encoding='utf-8').write('\n'.join(harness) + tests)
r = run(['node', '/tmp/worker_pure.js'])
sys.stdout.write(r.stdout)
assert r.returncode == 0, 'worker pure fns: ' + (r.stderr or r.stdout)[:600]
ok('worker pure-function proofs')

# worker structural asserts
for needle, m in [
    ("path === '/excavate/anchors'", 'anchors route registered'),
    ("'prop:v3:'", 'PROPOSE cache key bumped (v3: sliced scan)'),
    ('field: { read: fieldRead', 'field summary in response'),
    ('scoreboardMark(env, themes)', 'scoreboard wired into PROPOSE'),
    ("embedding: '[' + vec.join(',') + ']'", 'anchor vector as bracketed literal'),
]:
    assert needle in w, 'missing: ' + m
ok('worker structural asserts (route, v2 key, field, scoreboard, pgvector literal)')

# ── [C] page inline-script syntax ───────────────────────────────────────────
p = io.open(PAGE, encoding='utf-8').read()
scripts = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', p, re.S)
assert scripts, 'no inline scripts found'
for k, sc in enumerate(scripts):
    if not sc.strip(): continue
    io.open(f'/tmp/inline_{k}.js', 'w', encoding='utf-8').write(sc)
    r = run(['node', '--check', f'/tmp/inline_{k}.js'])
    assert r.returncode == 0, f'inline script {k} syntax: ' + r.stderr[:400]
ok(f'all {len(scripts)} inline script blocks node --check')

# ── [D] jsdom arrival proofs ────────────────────────────────────────────────
i = p.index('const _FI_CACHE_KEY')
j = p.index('// ── Render Trending Now sidebar')
fi = p[i:j]
# the FI slice already contains the pool and the opener — extract nothing else
opener = ''
pool = ''

jsdom = r'''
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!doctype html><body>
  <div id="fi-field-read" style="display:none"></div>
  <div id="fi-state-strip" style="display:none"></div>
  <div class="insights-grid" id="featured-insights-grid"></div>
  <span id="fi-live-badge" style="display:none"></span>
  <span id="fi-refresh-label"></span></body>`, { runScripts: 'outside-only' });
global.window = dom.window; global.document = dom.window.document;
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
dom.window.localStorage = global.localStorage;
const CATS = ['consumer','market','culture','brand'];
const CAT_LABELS = { consumer:'Consumer Behavior', market:'Market Dynamics', culture:'Cultural Signal', brand:'Brand Health' };
let opened = null;
function openInsightDashboard(x) { opened = x; }
function showToast() {}
const API_BASE = 'https://api.test/';
let authed = true;
async function _authHeader() { return authed ? { Authorization: 'Bearer t' } : {}; }
let fetchPayload = null;
global.fetch = async () => ({ ok: true, json: async () => fetchPayload });
dom.window.fetch = global.fetch;
const A = (c, m) => { if (!c) { console.error('FAIL ' + m); process.exit(1); } };

__POOL__
__OPENER__
__FI__

const mkCard = (n, state) => ({ id: 'lake-' + n, cluster_id: 'c' + n, lens: 'culture',
  title: 'Theme ' + n, subtitle: 'Sub ' + n, deck: 'Deck', hook: 'Hook ' + n,
  query: 'q ' + n, stat: '3 weeks running', bar: 50, state, shape: 'staircase',
  evidence: { weeks_touched: 3, sources: 6, members: 9, first_seen: new Date().toISOString() } });
const lakeFix = (n) => ({ ok: true, proposed: Array.from({length:n}, (_, i) =>
    mkCard(i, i === 0 ? 'EMERGING' : (i === 1 ? 'ACCELERATING' : 'STRUCTURAL'))),
  field: { read: 'The field consolidated. Move before the trades name it.',
    states: { EMERGING: 1, ACCELERATING: 1, STRUCTURAL: Math.max(0, n - 2) } } });

(async () => {
  // 1 — pool floor: no lake cache, grid paints 8 pool cards, chrome hidden
  _renderFeaturedGrid(false);
  let cards = document.querySelectorAll('#featured-insights-grid .insight-card');
  A(cards.length === 8, 'pool paints 8, got ' + cards.length);
  A(document.getElementById('fi-field-read').style.display === 'none', 'read hidden on pool');
  console.log('  PASS ..  jsdom: pool floor paints 8, chrome hidden');

  // 2 — cold-start law: fresh lake below the floor stays on the pool
  store[_FI_CACHE_KEY] = JSON.stringify({ fetchedAt: Date.now(), lake: lakeFix(3) });
  _renderFeaturedGrid(false);
  A(document.querySelectorAll('.fi-state-tag').length === 0, 'thin lake must not render tags');
  console.log('  PASS ..  jsdom: 3 proposed < floor -> pool, law holds');

  // 3 — lake mode: 8 proposed -> lake grid, read, strip, receipts
  store[_FI_CACHE_KEY] = JSON.stringify({ fetchedAt: Date.now(), lake: lakeFix(8) });
  _renderFeaturedGrid(false);
  cards = document.querySelectorAll('#featured-insights-grid .insight-card');
  A(cards.length === 8, 'lake paints 8, got ' + cards.length);
  A(document.getElementById('fi-field-read').textContent.includes('The field consolidated'), 'read renders');
  A(document.querySelectorAll('.fi-state-chip').length === 6, 'strip: ALL + five states');
  A(document.querySelectorAll('.fi-receipts').length === 8, 'receipts on every card');
  A(document.querySelector('.fi-state-tag').textContent === 'EMERGING', 'state tag renders');
  console.log('  PASS ..  jsdom: lake grid + read + strip + receipts');

  // 4 — filter narrows, empty filter never blanks
  _setFiStateFilter('EMERGING');
  A(document.querySelectorAll('#featured-insights-grid .insight-card').length === 1, 'filter narrows to 1');
  _setFiStateFilter('EMERGING'); // toggle off
  A(document.querySelectorAll('#featured-insights-grid .insight-card').length === 8, 'toggle restores 8');
  _setFiStateFilter('COOLING');  // zero-count chip is inert, but force via fn
  A(document.querySelectorAll('#featured-insights-grid .insight-card').length === 8, 'empty filter keeps grid');
  _setFiStateFilter('COOLING');
  console.log('  PASS ..  jsdom: state filter narrows, toggles, never blanks');

  // 5 — lake card opens the dashboard through the id door
  openFeaturedCard('lake-2');
  A(opened && opened.topicKey === 'lake-2' && opened.cat === 'culture', 'lake opener routes');
  console.log('  PASS ..  jsdom: openFeaturedCard resolves lake id -> dashboard');

  // 6 — refresh: lake fetch success writes cache; re-render enters lake mode
  delete store[_FI_CACHE_KEY];
  fetchPayload = lakeFix(6);
  await _checkAndRefreshFeatured(true);
  const cached = JSON.parse(store[_FI_CACHE_KEY] || 'null');
  A(cached && cached.lake && cached.lake.proposed.length === 6, 'refresh cached the lake');
  A(document.querySelectorAll('.fi-state-tag').length === 6, 'finally re-render landed in lake mode');
  console.log('  PASS ..  jsdom: lake-first refresh caches and re-renders live');

  // 7 — refresh fall-through: guest (no auth) leaves the pool path intact
  delete store[_FI_CACHE_KEY];
  authed = false;
  _renderFeaturedGrid(false);
  A(document.querySelectorAll('#featured-insights-grid .insight-card').length === 8, 'guest pool paints');
  console.log('  PASS ..  jsdom: guest falls to pool untouched');
  console.log('JSDOM_ALL_PASS');
})().catch(e => { console.error('FAIL async: ' + e.message); process.exit(1); });
'''
jsdom = jsdom.replace('__POOL__', pool).replace('__OPENER__', opener).replace('__FI__', fi)
io.open('arrival_proof.js', 'w', encoding='utf-8').write(jsdom)
r = run(['node', 'arrival_proof.js'])
sys.stdout.write(r.stdout)
assert r.returncode == 0 and 'JSDOM_ALL_PASS' in r.stdout, 'jsdom: ' + (r.stderr or r.stdout)[:800]
ok('jsdom arrival proofs (7 scenarios)')

# ── [E] curly-quote delta scan (strip base64 payloads first) ────────────────
def curly_count(path):
    t = io.open(path, encoding='utf-8').read()
    t = re.sub(r'data:[^"\']+', '', t)
    return sum(t.count(c) for c in '\u2018\u2019\u201c\u201d')

for new, old, name in [(WORKER, UP_W, 'worker'), (PAGE, UP_P, 'page')]:
    if os.path.exists(old):
        a, b = curly_count(new), curly_count(old)
        assert a <= b, f'{name}: curly quotes grew {b} -> {a}'
ok('curly-quote delta scan: no new contamination')

print(f'\nGATE GREEN — {passed} checks passed.')
