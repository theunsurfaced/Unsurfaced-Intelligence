#!/usr/bin/env python3
# patch_worker_deep.py — EX-EVO-1A: Deep Search gets its server half.
# Target: worker/src/index.js. Applies on top of patch_worker_evolution1.py.
#
# The page has posted {key, payload} to API_BASE/deep since birth; the route
# never existed, so Deep Search has answered 404 in production forever. This
# is the missing half, built to the page's exact contract:
#   - House key (PPLX_API_KEY secret) preferred; the user's BYOK rides as
#     fallback so the existing modal keeps working with no house key set.
#   - Budget is law: global daily cap + per-IP daily cap, counted in the
#     RATE_LIMIT KV. Over budget answers 429 — the page already renders 429
#     as a polite "wait a moment", so no page change needed.
#   - Response cache by payload hash (6h): repeat queries cost zero budget.
#   - Upstream status MIRRORED (401/402/429 pass through) because the page's
#     error copy branches on exactly those codes.

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

# ── D1: the route, public with its own guards ───────────────────────────────
rep(
"      if (path === '/excavate/lake' && request.method === 'POST') return excavateLake(request, env, origin);",
"      if (path === '/excavate/lake' && request.method === 'POST') return excavateLake(request, env, origin);\n"
"      if (path === '/deep' && request.method === 'POST') return deepSearch(request, env, origin);",
'D1 deep route')

# ── D2: the machinery, mounted beside the lake it complements ───────────────
rep(
"/* ═══ SEAM:FIELD_RAIL — the paid door ════════════════════════════════",
"""/* ═══ SEAM:DEEP_RAIL — Deep Search, house-keyed and budgeted ═════════════
 * The page's contract, honored exactly: POST /deep {key, payload} → forward
 * payload to Perplexity, mirror the upstream status. House key preferred,
 * BYOK fallback. Budget in KV: a global daily cap and a per-IP daily cap,
 * both answering 429 (which the page already renders politely). Cache by
 * payload hash — a repeated query costs nothing. */
const DEEP = {
  DAILY_CAP: 60,          // house-key calls per UTC day, all users combined
  IP_DAILY_CAP: 12,       // per-IP per day — one curious visitor can't drain the tank
  CACHE_TTL: 21600,       // 6h — cultural queries don't move faster than this
  TIMEOUT_MS: 55000
};

async function _deepHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => ('0' + b.toString(16)).slice(-2)).join('').slice(0, 32);
}

async function deepSearch(request, env, origin) {
  const body = await safeJson(request);
  const payload = body && body.payload;
  if (!payload || !Array.isArray(payload.messages) || !payload.messages.length)
    return json({ error: 'payload_required' }, 400, origin, env);

  const houseKey = env.PPLX_API_KEY || null;
  const userKey = typeof body.key === 'string' && body.key.indexOf('pplx-') === 0 ? body.key : null;
  const key = houseKey || userKey;
  if (!key) return json({ error: 'no_key', note: 'no house key configured and no user key supplied' }, 401, origin, env);

  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';

  // Cache first — a hit costs no budget and no upstream call.
  const qhash = await _deepHash(JSON.stringify(payload.messages) + '|' + String(payload.model || ''));
  const cacheKey = 'deep:c:' + qhash;
  try {
    const hit = await env.RATE_LIMIT.get(cacheKey);
    if (hit) {
      const h = new Headers({ 'Content-Type': 'application/json', 'x-deep-cache': 'hit' });
      if (origin) h.set('Access-Control-Allow-Origin', origin);
      return new Response(hit, { status: 200, headers: h });
    }
  } catch (e) {}

  // Budget gates apply only to house-key spend — BYOK users burn their own credits.
  if (key === houseKey) {
    try {
      const gKey = 'deep:g:' + day;
      const iKey = 'deep:i:' + day + ':' + ip;
      const g = parseInt(await env.RATE_LIMIT.get(gKey), 10) || 0;
      const i = parseInt(await env.RATE_LIMIT.get(iKey), 10) || 0;
      const cap = parseInt(env.DEEP_DAILY_CAP, 10) || DEEP.DAILY_CAP;
      if (g >= cap || i >= DEEP.IP_DAILY_CAP)
        return json({ error: 'budget_exhausted',
          note: g >= cap ? 'the house Deep Search budget resets at midnight UTC' : 'per-visitor daily limit reached' },
          429, origin, env);
      await env.RATE_LIMIT.put(gKey, String(g + 1), { expirationTtl: 172800 });
      await env.RATE_LIMIT.put(iKey, String(i + 1), { expirationTtl: 172800 });
    } catch (e) { /* KV hiccup never blocks the call — the cap is a governor, not a lock */ }
  }

  let up;
  try {
    up = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(DEEP.TIMEOUT_MS)
    });
  } catch (e) {
    return json({ error: 'upstream_unreachable', detail: String(e && e.message).slice(0, 100) }, 502, origin, env);
  }

  const text = await up.text();
  // Mirror the upstream status — the page's 401/402/429 copy depends on it.
  const h = new Headers({ 'Content-Type': 'application/json', 'x-deep-cache': 'miss' });
  if (origin) h.set('Access-Control-Allow-Origin', origin);
  if (up.ok) {
    try { await env.RATE_LIMIT.put(cacheKey, text, { expirationTtl: DEEP.CACHE_TTL }); } catch (e) {}
    try { await logEvent(env, 'intelligence', 'excavate', 'deep_search', null,
      { keyed: key === houseKey ? 'house' : 'byok', ip_hash: (await _deepHash(ip)).slice(0, 8) }); } catch (e) {}
  }
  return new Response(text, { status: up.status, headers: h });
}

/* ═══ SEAM:FIELD_RAIL — the paid door ════════════════════════════════""",
'D2 deep machinery')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
