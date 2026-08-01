#!/usr/bin/env python3
# patch_worker_brand_signal.py — EX-EVO-3, first measurement.
# Target: worker/src/index.js. Applies on top of patch_worker_synth_report.py.
#
# The moat begins: the first brand number computed from Unsurfaced's own lake
# instead of typed into a fixture. What the lake can honestly answer today:
# how much captured signal touches this brand (90d), whether that volume is
# accelerating (recent 30 vs prior 30), how much of it comes from tier-1
# sources, how fresh the latest capture is, and which signals lead. What it
# cannot answer stays MODELED on the page — no number without lineage.

import io, os

PATH = os.environ.get('WORKER_PATH', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

rep(
"      if (path === '/deep' && request.method === 'POST') return deepSearch(request, env, origin);",
"      if (path === '/deep' && request.method === 'POST') return deepSearch(request, env, origin);\n"
"      if (path === '/excavate/brand-signal' && request.method === 'POST') return brandSignal(request, env, origin);",
'B1 route')

rep(
"async function excavateLake(request, env, origin) {",
"""/* SEAM:MOAT_1 — computed brand signal. PURE math over lake matches; the
 * route just gathers. Thin evidence says thin: under 3 real matches returns
 * {thin:true} and the page keeps its MODELED chip — the moat fills honestly
 * or not at all. */
function computeBrandSignal(rows, nowMs) {
  const now = nowMs || Date.now();
  const real = (rows || []).filter(r => (r.similarity || 0) >= 0.3);
  if (real.length < 3) return { thin: true, matches: real.length };
  const age = (r) => (now - new Date(r.captured_at).getTime()) / 86400000;
  const recent = real.filter(r => age(r) <= 30).length;
  const prior = real.filter(r => age(r) > 30 && age(r) <= 60).length;
  const momentum = prior === 0 ? (recent > 0 ? 100 : 0)
    : Math.round(((recent - prior) / prior) * 100);
  const t1 = real.filter(r => r.source_tier === 1).length;
  const latest = real.map(r => r.captured_at).sort().pop();
  return {
    thin: false,
    mentions_90d: real.length,
    recent_30d: recent,
    momentum_pct: Math.max(-100, Math.min(500, momentum)),
    tier1_share: Math.round((t1 / real.length) * 100),
    latest_capture: latest,
    top: real.slice(0, 4).map(r => ({ title: String(r.title || '').slice(0, 120),
      url: r.url || null, source: r.source_name || '', tier: r.source_tier || null,
      captured_at: r.captured_at }))
  };
}

async function brandSignal(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const brand = String(body.brand || '').trim().slice(0, 80);
  if (!brand) return json({ ok: false, error: 'brand_required' }, 200, origin, env);
  try {
    const vec = await embedQuery(env, brand + ' brand consumer culture');
    if (!vec) return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
    const rows = await sbRest(env, 'rpc/match_signals', {
      method: 'POST',
      body: { p_query: vec, p_count: 24, p_territory: null, p_min_tier: 4,
              p_since: new Date(Date.now() - 90 * 86400000).toISOString() }
    }) || [];
    const sig = computeBrandSignal(rows);
    return json({ ok: true, brand, computed_at: new Date().toISOString(), signal: sig }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'lake_unavailable' }, 200, origin, env);
  }
}

async function excavateLake(request, env, origin) {""",
'B2 brand signal machinery')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
