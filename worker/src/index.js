/**
 * Unsurfaced Intelligence — Edge API Gateway (Cloudflare Worker)
 * Single file, no build step. Paste into the Workers dashboard editor and Deploy,
 * or deploy with `wrangler deploy`.
 *
 * BINDINGS (dashboard → your Worker → Settings → Bindings):
 *   AI           → Workers AI
 *   MEDIA        → R2 bucket  (stores generated images + study media)
 *   RATE_LIMIT   → KV namespace (per-user daily rate limit)
 *
 * VARIABLES & SECRETS (dashboard → Settings → Variables and Secrets):
 *   SUPABASE_URL          (variable)  e.g. https://YOURPROJECT.supabase.co
 *   SUPABASE_ANON_KEY     (secret)    used to validate a user's login token
 *   ALLOWED_ORIGINS       (variable)  comma-separated app origins, e.g. https://app.unsurfaced.ai
 *   STRIPE_SECRET_KEY     (secret)    — Stripe Connect (responder payouts)
 *   STRIPE_WEBHOOK_SECRET (secret)    — verify /stripe/webhook signatures
 *   RESEND_API_KEY        (secret)    — transactional email (Resend)
 *   SUPABASE_SERVICE_ROLE_KEY (secret) — server-side payment/email bookkeeping
 *   EMAIL_FROM            (variable)  — e.g. 'Unsurfaced <studies@send.unsurfaced.ai>'
 *   APP_URL               (variable)  — app origin for payout return links
 */

const CONFIG = {
  // Verify exact IDs in your dashboard's Workers AI catalog; swap freely here only.
  TEXT_MODEL:  '@cf/meta/llama-4-scout-17b-16e-instruct', // alt: '@cf/openai/gpt-oss-20b'
  IMAGE_MODEL: '@cf/black-forest-labs/flux-1-schnell',    // upgrade to FLUX.2/Leonardo later (adjust output parsing)
  MAX_TOKENS:  800,
  DAILY_LIMIT: 100,   // AI calls per user per day (cost guardrail)
};

const PLAY_SYSTEM = {
  default:  'You are a sharp brand-creative collaborator. Be vivid, specific, and useful. No preamble.',
  headline: 'You write punchy brand headlines. Return 5 numbered options, nothing else.',
  concept:  'You develop campaign concepts. Give a concept name and a two-sentence pitch.',
  naming:   'You generate brand/product name candidates. Return 8 options with a one-line rationale each.',
};

export default {
  async scheduled(event, env, ctx) {
    // DAILY pipeline — runs on cron. Builds today's edition end to end.
    ctx.waitUntil(runDailyPipeline(env).catch(e => console.log('daily_pipeline_error', String(e && e.message))));
  },
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return preflight(origin, env);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // Public
      if (path === '/' || path === '/health') return json({ ok: true, service: 'unsurfaced-api' }, 200, origin, env);
      if (request.method === 'GET' && path.startsWith('/media/')) return serveMedia(path, env, origin);
      if (path === '/stripe/webhook' && request.method === 'POST') return stripeWebhook(request, env, origin);
      if (path.startsWith('/arcade/') && !path.startsWith('/arcade/admin/')) return arcadeRouter(path, request, env, origin);
      if (path === '/api/edition/today') return editionToday(env, origin);
      if (path === '/api/edition/archive') return editionArchive(env, origin);
      if (path === '/api/edition') return editionByIssue(url, env, origin);
      if (path === '/daily/run' && request.method === 'POST') return dailyRunGuarded(request, env, origin);
      if (path === '/daily/pov' && request.method === 'GET') return dailyPovPublic(origin, env);
      if (path === '/preview' && request.method === 'GET') return previewRoute(request, env, origin);
      if (path === '/mine/studies' && request.method === 'GET') return mineStudiesPublic(env, origin);

      // Everything below requires a signed-in user
      const user = await authenticate(request, env);
      if (!user) return json({ ok: false, error: 'unauthorized' }, 401, origin, env);
      const _aiPath = path.startsWith('/play') || path.startsWith('/excavate') || path === '/mine/synthesize' || path === '/mine/ask';
      if (_aiPath && !(await underLimit(env, user.id))) return json({ ok: false, error: 'rate_limited' }, 429, origin, env);

      const body = (request.method === 'POST' && path !== '/mine/upload' && path !== '/knowledge/file' && path !== '/studio/archive' && path !== '/arcade/admin/prize-obj') ? await safeJson(request) : {};
      switch (path) {
        case '/play/generate':       return playGenerate(body, env, origin);
        case '/play/generate-image': return playImage(body, env, origin, user);
        case '/excavate/synthesize': return synthesize(body, env, origin);
        case '/mine/synthesize':     return mineSynthesize(body, env, origin);
        case '/mine/ask':            return mineAsk(body, env, origin);
        case '/mine/upload':         return mineUpload(request, env, origin, user);
        case '/whoami':             return kbWhoami(env, origin, user);
        case '/studio/manifest':     return studioManifest(body, env, origin, user);
        case '/studio/generate':     return studioGenerate(env, origin, user);
        case '/studio/cut-story':    return studioCutStory(body, env, origin, user);
        case '/studio/update':       return studioUpdate(body, env, origin, user);
        case '/studio/archive':      return studioArchive(request, env, origin, user);
        case '/arcade/admin/state':     return arcAdminState(env, origin, user);
        case '/arcade/admin/rotate':    return arcAdminRotate(body, env, origin, user);
        case '/arcade/admin/prize':     return arcAdminPrize(body, env, origin, user);
        case '/arcade/admin/prize-obj': return arcAdminPrizeObj(request, env, origin, user);
        case '/arcade/admin/claims':    return arcAdminClaims(env, origin, user);
        case '/arcade/admin/fulfill':   return arcAdminFulfill(body, env, origin, user);
        case '/knowledge/submit':    return kbSubmit(body, env, origin, user);
        case '/knowledge/file':      return kbFile(request, env, origin, user);
        case '/knowledge/list':      return kbList(env, origin, user);
        case '/knowledge/search':    return kbSearch(body, env, origin, user);
        case '/knowledge/delete':    return kbDelete(body, env, origin, user);
        case '/pay/onboard':         return payOnboard(env, origin, user);
        case '/pay/status':          return payStatus(env, origin, user);
        case '/pay/responder':       return payResponder(body, env, origin, user);
        case '/pay/fund-study':      return payFundStudy(body, env, origin, user);
        case '/email/study-invite':  return emailStudyInvite(body, env, origin, user);
        default: return json({ ok: false, error: 'not_found' }, 404, origin, env);
      }
    } catch (err) {
      return json({ ok: false, error: 'server_error', detail: String((err && err.message) || err) }, 500, origin, env);
    }
  }
};

/* ----------------------------- auth ----------------------------- */
// Validates the user's Supabase login token by asking Supabase who they are.
// Works whether your project uses HS256 or the newer asymmetric signing keys.
async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !env.SUPABASE_URL) return null;
  const r = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY || '' }
  });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && u.id ? { id: u.id, email: u.email } : null;
}

/* ------------------------- rate limit --------------------------- */
async function underLimit(env, userId) {
  if (!env.RATE_LIMIT) return true; // no KV bound → skip (configure for production)
  const day = new Date().toISOString().slice(0, 10);
  const key = `rl:${userId}:${day}`;
  const cur = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (cur >= CONFIG.DAILY_LIMIT) return false;
  await env.RATE_LIMIT.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

/* ----------------------------- PLAY ----------------------------- */
async function playGenerate(body, env, origin) {
  const prompt = String(body.prompt || '').slice(0, 2000);
  if (!prompt) return json({ ok: false, error: 'prompt_required' }, 400, origin, env);
  const sys = PLAY_SYSTEM[body.kind] || PLAY_SYSTEM.default;
  const out = await env.AI.run(CONFIG.TEXT_MODEL, {
    messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
    max_tokens: CONFIG.MAX_TOKENS
  });
  return json({ ok: true, data: { text: out.response || '' } }, 200, origin, env);
}

async function playImage(body, env, origin, user) {
  const prompt = String(body.prompt || '').slice(0, 2000);
  if (!prompt) return json({ ok: false, error: 'prompt_required' }, 400, origin, env);
  const out = await env.AI.run(CONFIG.IMAGE_MODEL, { prompt });
  const b64 = out.image || (out.images && out.images[0]) || '';   // flux-1-schnell → { image: base64 }
  if (!b64) return json({ ok: false, error: 'no_image' }, 502, origin, env);
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const key = `play/${user.id}/${Date.now()}.jpg`;
  if (env.MEDIA) await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
  return json({ ok: true, data: { url: `/media/${key}` } }, 200, origin, env);
}

/* --------------------------- EXCAVATE --------------------------- */
// Three input shapes, one endpoint:
//  • { query, corpus:[{lens,source,title,text,url}] } → structured grounded read
//        → { ok, data:{ insights:[{category,title,excerpt,source,sourceUrl}], ideas:[{type,headline,body}], brief } }
//  • { query, corpus:"<string>" }  → narrative text read (MINE partner preview)  → { ok, data:{ text } }
//  • { prompt, sources:[...] }     → legacy analyst text                          → { ok, data:{ text } }
async function synthesize(body, env, origin) {
  // ── Structured EXCAVATE mode: fuse the client-gathered open-data corpus ──
  if (Array.isArray(body.corpus)) {
    const query  = String(body.query || '').slice(0, 300);
    const corpus = body.corpus.slice(0, 28);
    // Server-side connectors (keyless, not CORS-bound): live news (GDELT) + practitioner signal (HN).
    const added = await gatherServerSignals(query);
    const merged = corpus.concat(added.map(a => ({ lens: a.signalType === 'news' ? 'culture' : 'consumer', source: a.source, title: a.title, text: a.snippet, url: a.url }))).slice(0, 40);
    if (!merged.length) return json({ ok: false, error: 'no_corpus' }, 200, origin, env);

    const evidence = merged.map((c, i) =>
      `[${i + 1}] (${c.lens || 'general'}) ${String(c.title || '').slice(0, 160)} — ` +
      `${String(c.text || '').slice(0, 320)} {source:${String(c.source || '').slice(0, 80)}|url:${String(c.url || '').slice(0, 200)}}`
    ).join('\n');

    const sys = 'You are Excavate, a senior consumer-insights strategist who fuses numbered evidence into a sharp, ' +
      'decision-useful read for a brand team. Ground EVERY insight in the evidence — never invent facts, numbers, ' +
      'sources, or URLs. Copy each insight\'s "source" and "sourceUrl" verbatim from the evidence item you used. ' +
      'Output STRICT JSON only — no markdown fences, no prose outside the JSON object.';

    const usr = `Topic: "${query}"\n\nEVIDENCE:\n${evidence}\n\n` +
      'Return JSON exactly shaped as:\n' +
      '{"insights":[{"category":"consumer|market|culture|brand","title":"<=9-word claim",' +
      '"excerpt":"1-2 sentence finding grounded in the evidence","source":"copied from evidence",' +
      '"sourceUrl":"copied from evidence"}],' +
      '"ideas":[{"type":"Positioning|Product|Campaign|Content|Partnership","headline":"<=9 words",' +
      '"body":"1-2 sentence recommendation tied to the insights"}],' +
      '"brief":"3-4 sentence executive read of where the conversation actually is and what to do about it"}\n' +
      'Give 6-8 insights spread across the categories the evidence supports, and 4-6 ideas. JSON only.';

    const out = await env.AI.run(CONFIG.TEXT_MODEL, {
      messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
      max_tokens: 1600
    });
    const parsed = extractJson(out.response || '');
    if (!parsed || !Array.isArray(parsed.insights)) {
      // Soft-fail (HTTP 200, ok:false) so the client cleanly falls back to its template read.
      return json({ ok: false, error: 'synthesis_unparsable' }, 200, origin, env);
    }
    const insights = parsed.insights.slice(0, 8).map(x => ({
      category: ['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer',
      title: String(x.title || '').slice(0, 120),
      excerpt: String(x.excerpt || '').slice(0, 400),
      source: String(x.source || '').slice(0, 120),
      sourceUrl: /^https?:\/\//.test(String(x.sourceUrl || '')) ? x.sourceUrl : null
    })).filter(x => x.title);
    const ideas = (Array.isArray(parsed.ideas) ? parsed.ideas : []).slice(0, 6).map(x => ({
      type: String(x.type || 'Strategy').slice(0, 40),
      headline: String(x.headline || '').slice(0, 120),
      body: String(x.body || '').slice(0, 400)
    })).filter(x => x.headline);
    const brief = String(parsed.brief || '').slice(0, 1200);
    return json({ ok: true, data: { insights, ideas, brief, signals: added, connectors: serverConnectors(added) } }, 200, origin, env);
  }

  // ── Narrative text mode: brief + string corpus (MINE partner preview) ──
  if (body.query && typeof body.corpus === 'string') {
    const out = await env.AI.run(CONFIG.TEXT_MODEL, {
      messages: [
        { role: 'system', content: 'You synthesize real consumer responses into a sharp, traceable executive read. Ground every claim in the quoted responses; cite response numbers like [3]. Never invent. No preamble.' },
        { role: 'user', content: `Brief: ${String(body.query).slice(0, 600)}\n\nResponses:\n${String(body.corpus).slice(0, 6000)}\n\nWrite a 4-6 sentence read that answers the brief.` }
      ],
      max_tokens: CONFIG.MAX_TOKENS
    });
    return json({ ok: true, data: { text: out.response || '' } }, 200, origin, env);
  }

  // ── Legacy analyst text mode: { prompt, sources } ──
  const prompt = String(body.prompt || '').slice(0, 4000);
  if (!prompt) return json({ ok: false, error: 'nothing_to_synthesize' }, 200, origin, env);
  const sources = Array.isArray(body.sources) ? body.sources.slice(0, 10) : [];
  const grounding = sources.length
    ? `Use ONLY these sources and cite them by number. If they do not answer, say so.\n\n` +
      sources.map((s, i) => `[${i + 1}] ${String(s).slice(0, 800)}`).join('\n')
    : '';
  const out = await env.AI.run(CONFIG.TEXT_MODEL, {
    messages: [
      { role: 'system', content: 'You are an insights analyst. Be precise. Never invent facts or sources.' },
      { role: 'user', content: `${prompt}\n\n${grounding}` }
    ],
    max_tokens: CONFIG.MAX_TOKENS
  });
  return json({ ok: true, data: { text: out.response || '' } }, 200, origin, env);
}

// Robust JSON extraction from an LLM reply (handles ```json fences and stray prose).
function extractJson(s) {
  if (!s) return null;
  let t = String(s).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

// Server-side connectors — fetched by the Worker itself (keyless, and not subject
// to browser CORS, so they enrich the corpus with sources the client can't reach).
async function gatherServerSignals(q) {
  const out = [];
  const enc = encodeURIComponent(String(q || '').slice(0, 200));
  if (!enc) return out;
  // GDELT — global news across the last few months, keyless JSON.
  try {
    const r = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${enc}&mode=artlist&maxrecords=8&format=json&sort=hybridrel&timespan=3months`, { cf: { cacheTtl: 300 } });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      ((j && j.articles) || []).slice(0, 6).forEach(a => out.push({
        signalType: 'news',
        source: a.domain || 'GDELT News',
        title: String(a.title || '').slice(0, 180),
        snippet: [a.sourcecountry, a.seendate].filter(Boolean).join(' · '),
        url: a.url || '',
        image: a.socialimage || '',            // key visual straight from the source
        lang: a.language || ''                 // e.g. "English", "Spanish" (GDELT names)
      }));
    }
  } catch (e) {}
  // Hacker News (Algolia) — operator / practitioner discourse, keyless.
  try {
    const r = await fetch(`https://hn.algolia.com/api/v1/search?query=${enc}&tags=story&hitsPerPage=8&numericFilters=points>5`, { cf: { cacheTtl: 300 } });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      ((j && j.hits) || []).slice(0, 6).forEach(h => out.push({
        signalType: 'social',
        source: 'Hacker News',
        title: String(h.title || h.story_title || '').slice(0, 180),
        snippet: `${h.points || 0} points · ${h.num_comments || 0} comments`,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        image: '',
        lang: 'English'
      }));
    }
  } catch (e) {}
  return out.filter(x => x.title);
}

function serverConnectors(added) {
  const by = {};
  (added || []).forEach(a => { const k = a.source === 'Hacker News' ? 'Hacker News' : 'GDELT News'; (by[k] = by[k] || []).push(a); });
  return Object.keys(by).map(k => ({ source: k, status: 'ok', count: by[k].length, url: (by[k][0] && by[k][0].url) || '#' }));
}


/* ----------------------------- MINE ----------------------------- */
async function mineSynthesize(body, env, origin) {
  const responses = Array.isArray(body.responses) ? body.responses.slice(0, 200) : [];
  if (!responses.length)
    return json({ ok: true, data: { text: 'Not enough responses yet to synthesize a read.' } }, 200, origin, env);
  const corpus = responses.map((r, i) => `#${i + 1} (${r.anon_id || 'anon'}): ${JSON.stringify(r.answers).slice(0, 600)}`).join('\n');
  const out = await env.AI.run(CONFIG.TEXT_MODEL, {
    messages: [
      { role: 'system', content: 'You synthesize REAL consumer responses into findings. Every finding must be grounded in the responses provided — never invent. Reference response numbers as evidence.' },
      { role: 'user', content: `Business question: ${body.goal || '(unspecified)'}\n\nResponses:\n${corpus}\n\nReturn 3–5 findings. For each: a one-line statement, a one-line implication, and the supporting response numbers.` }
    ],
    max_tokens: CONFIG.MAX_TOKENS
  });
  return json({ ok: true, data: { text: out.response || '' } }, 200, origin, env);
}

async function mineAsk(body, env, origin) {
  const question = String(body.question || '').slice(0, 500);
  if (!question) return json({ ok: false, error: 'question_required' }, 400, origin, env);
  const responses = Array.isArray(body.responses) ? body.responses.slice(0, 200) : [];
  const corpus = responses.map((r, i) => `#${i + 1} (${r.anon_id || 'anon'}): ${JSON.stringify(r.answers).slice(0, 500)}`).join('\n');
  const out = await env.AI.run(CONFIG.TEXT_MODEL, {
    messages: [
      { role: 'system', content: 'Answer ONLY from the provided responses and cite response numbers. If they do not contain the answer, say so plainly.' },
      { role: 'user', content: `Question: ${question}\n\nResponses:\n${corpus}` }
    ],
    max_tokens: CONFIG.MAX_TOKENS
  });
  return json({ ok: true, data: { text: out.response || '' } }, 200, origin, env);
}

async function mineUpload(request, env, origin, user) {
  if (!env.MEDIA) return json({ ok: false, error: 'storage_unconfigured' }, 500, origin, env);
  const name = (request.headers.get('x-filename') || 'file').replace(/[^\w.-]/g, '_');
  const type = request.headers.get('content-type') || 'application/octet-stream';
  const key = `studies/${user.id}/${Date.now()}-${name}`;
  await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type } });
  return json({ ok: true, data: { key, url: `/media/${key}` } }, 200, origin, env);
}

/* ---------------------------- media ----------------------------- */
async function serveMedia(path, env, origin) {
  if (!env.MEDIA) return new Response('not found', { status: 404 });
  const key = decodeURIComponent(path.slice('/media/'.length));
  const obj = await env.MEDIA.get(key);
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=3600');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return new Response(obj.body, { headers });
}

/* ----------------------- stripe webhook ------------------------- */
// Stub for the payments sprint. TODO: verify the Stripe-Signature header with
// stripeWebhook + payments/email handlers are defined in the payments section below.

/* =====================  PAYMENTS (Stripe Connect) + EMAIL (Resend)  ===================== */
// Responders onboard a Stripe Connect Express account and get paid per response via
// Transfers. The Worker does privileged DB bookkeeping with the service-role key.
// Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY,
//               RESEND_API_KEY (email), EMAIL_FROM, APP_URL (return links).

// --- low-level Stripe (form-encoded) ---
function encodeForm(obj, prefix) {
  const parts = [];
  for (const k in obj) {
    const v = obj[k]; if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') parts.push(encodeForm(v, key));
    else parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(v));
  }
  return parts.filter(Boolean).join('&');
}
async function stripeApi(env, path, method, params) {
  const r = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params ? encodeForm(params) : undefined
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((j && j.error && j.error.message) || ('stripe_' + r.status));
  return j;
}

// --- privileged Supabase REST (service role; bypasses RLS for bookkeeping only) ---
async function sbRest(env, path, opts) {
  opts = opts || {};
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!r.ok) throw new Error('sb_' + r.status);
  if (r.status === 204) return null;
  return r.json().catch(() => null);
}
async function callerIsAdmin(env, uid) {
  try { const r = await sbRest(env, `app_user?id=eq.${uid}&select=role`); return !!(r && r[0] && r[0].role === 'admin'); }
  catch (e) { return false; }
}
function payConfigured(env) { return !!(env.STRIPE_SECRET_KEY && env.SUPABASE_SERVICE_ROLE_KEY); }

// --- responder onboarding ---
async function payOnboard(env, origin, user) {
  if (!payConfigured(env)) return json({ ok: false, error: 'payments_unconfigured' }, 200, origin, env);
  const rows = await sbRest(env, `responder_profile?user_id=eq.${user.id}&select=user_id,stripe_account_id,email`);
  const prof = rows && rows[0];
  if (!prof) return json({ ok: false, error: 'no_responder_profile' }, 200, origin, env);
  let acct = prof.stripe_account_id;
  if (!acct) {
    const a = await stripeApi(env, 'accounts', 'POST', {
      type: 'express', email: prof.email || user.email || undefined,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual', metadata: { user_id: user.id }
    });
    acct = a.id;
    await sbRest(env, `responder_profile?user_id=eq.${user.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { stripe_account_id: acct } });
  }
  const base = String(env.APP_URL || origin || '').replace(/\/$/, '');
  const link = await stripeApi(env, 'account_links', 'POST', {
    account: acct, refresh_url: base + '/?payout=refresh', return_url: base + '/?payout=done', type: 'account_onboarding'
  });
  return json({ ok: true, data: { url: link.url } }, 200, origin, env);
}
async function payStatus(env, origin, user) {
  if (!payConfigured(env)) return json({ ok: true, data: { connected: false, payouts_enabled: false } }, 200, origin, env);
  const rows = await sbRest(env, `responder_profile?user_id=eq.${user.id}&select=stripe_account_id`);
  const acct = rows && rows[0] && rows[0].stripe_account_id;
  if (!acct) return json({ ok: true, data: { connected: false, payouts_enabled: false } }, 200, origin, env);
  const a = await stripeApi(env, 'accounts/' + acct, 'GET');
  const pe = !!a.payouts_enabled;
  await sbRest(env, `responder_profile?user_id=eq.${user.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { payouts_enabled: pe } }).catch(() => {});
  return json({ ok: true, data: { connected: true, payouts_enabled: pe, charges_enabled: !!a.charges_enabled, details_submitted: !!a.details_submitted } }, 200, origin, env);
}

// --- pay a responder for a response (partner who owns the study, or admin) ---
async function payResponder(body, env, origin, user) {
  if (!payConfigured(env)) return json({ ok: false, error: 'payments_unconfigured' }, 200, origin, env);
  const responseId = String(body.response_id || '');
  if (!responseId) return json({ ok: false, error: 'response_required' }, 400, origin, env);
  const rs = await sbRest(env, `response?id=eq.${responseId}&select=id,study_id,responder_id,status`);
  const resp = rs && rs[0]; if (!resp) return json({ ok: false, error: 'response_not_found' }, 200, origin, env);
  const ss = await sbRest(env, `study?id=eq.${resp.study_id}&select=id,partner_id,pay_cents,title`);
  const study = ss && ss[0]; if (!study) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  // authz
  const admin = await callerIsAdmin(env, user.id);
  if (!admin) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);
    const mine = pp && pp[0] && pp[0].id;
    if (!mine || mine !== study.partner_id) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  }
  // idempotency
  const ex = await sbRest(env, `payment?response_id=eq.${responseId}&select=id,status`);
  if (ex && ex.some(p => p.status === 'paid')) return json({ ok: false, error: 'already_paid' }, 200, origin, env);
  // responder payout account
  const rp = await sbRest(env, `responder_profile?user_id=eq.${resp.responder_id}&select=stripe_account_id,payouts_enabled,email,name`);
  const prof = rp && rp[0];
  if (!prof || !prof.stripe_account_id || !prof.payouts_enabled) return json({ ok: false, error: 'responder_not_onboarded' }, 200, origin, env);
  const amount = study.pay_cents || 0;
  if (amount <= 0) return json({ ok: false, error: 'no_amount' }, 200, origin, env);
  // budget gate: the study must have remaining pre-funded budget (partner Checkout)
  const fr = await sbRest(env, `study?id=eq.${study.id}&select=funded_cents`);
  const funded = (fr && fr[0] && fr[0].funded_cents) || 0;
  const pr = await sbRest(env, `payment?study_id=eq.${study.id}&status=eq.paid&select=amount_cents`);
  const spent = (pr || []).reduce((a, p) => a + (p.amount_cents || 0), 0);
  if (funded - spent < amount) return json({ ok: false, error: 'study_unfunded' }, 200, origin, env);
  // transfer
  let transfer;
  try {
    transfer = await stripeApi(env, 'transfers', 'POST', {
      amount, currency: 'usd', destination: prof.stripe_account_id, transfer_group: 'study_' + study.id,
      metadata: { response_id: responseId, study_id: study.id, responder_id: resp.responder_id }
    });
  } catch (e) { return json({ ok: false, error: 'transfer_failed', detail: String(e.message) }, 200, origin, env); }
  // record + mark paid
  await sbRest(env, 'payment', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { response_id: responseId, responder_id: resp.responder_id, study_id: study.id, amount_cents: amount, currency: 'usd', status: 'paid', stripe_transfer_id: transfer.id } }).catch(() => {});
  await sbRest(env, `response?id=eq.${responseId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'paid' } }).catch(() => {});
  // notify responder
  await sendEmail(env, { to: prof.email, subject: "You've been paid for your response", html: payEmailHtml(prof.name, study.title, amount) }).catch(() => {});
  return json({ ok: true, data: { amount_cents: amount, transfer_id: transfer.id } }, 200, origin, env);
}

// --- email invites for a study's invited contacts (partner who owns it, or admin) ---
async function emailStudyInvite(body, env, origin, user) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: 'service_unconfigured' }, 200, origin, env);
  const sid = String(body.study_id || ''); if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,partner_id,title`);
  const study = ss && ss[0]; if (!study) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  const admin = await callerIsAdmin(env, user.id);
  if (!admin) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);
    if (!(pp && pp[0] && pp[0].id === study.partner_id)) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  }
  const inv = await sbRest(env, `study_invite?study_id=eq.${sid}&select=email`);
  const emails = (inv || []).map(x => x.email).filter(Boolean);
  const base = String(env.APP_URL || origin || '').replace(/\/$/, '');
  let sent = 0;
  for (const e of emails) {
    const res = await sendEmail(env, { to: e, subject: "You're invited to a paid study on Unsurfaced", html: inviteEmailHtml(study.title, base + '/?study=' + sid) });
    if (res && res.ok) sent++;
  }
  return json({ ok: true, data: { sent, total: emails.length } }, 200, origin, env);
}

// --- Resend email ---
async function sendEmail(env, msg) {
  if (!env.RESEND_API_KEY || !msg || !msg.to) return { skipped: true };
  const from = env.EMAIL_FROM || 'Unsurfaced <onboarding@resend.dev>';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html })
  });
  return r.ok ? { ok: true } : { ok: false };
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function payEmailHtml(name, study, cents) {
  const amt = '$' + ((cents || 0) / 100).toFixed(2);
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;color:#111;line-height:1.6">
    <h2 style="margin:0 0 8px">You've been paid ${amt}</h2>
    <p>Hi ${esc(name || 'there')},</p>
    <p>Thanks for your response to <strong>${esc(study || 'a study')}</strong>. Your payout of <strong>${amt}</strong> is on its way to your connected account.</p>
    <p style="color:#666">— The Unsurfaced team</p></div>`;
}
function inviteEmailHtml(study, url) {
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;color:#111;line-height:1.6">
    <h2 style="margin:0 0 8px">You're invited to a paid research study</h2>
    <p>A brand wants your honest take on <strong>${esc(study || 'a new study')}</strong>. It takes a couple of minutes, and you'll be paid for your response.</p>
    <p><a href="${esc(url)}" style="display:inline-block;background:#FF3B3B;color:#fff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:600">Take the study →</a></p>
    <p style="color:#666">— Unsurfaced</p></div>`;
}

// --- Stripe webhook (signature-verified) ---
async function stripeWebhook(request, env, origin) {
  const sig = request.headers.get('stripe-signature') || '';
  const payload = await request.text();
  if (env.STRIPE_WEBHOOK_SECRET) {
    const ok = await verifyStripeSig(payload, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!ok) return new Response('bad signature', { status: 400 });
  }
  let evt; try { evt = JSON.parse(payload); } catch (e) { return new Response('bad json', { status: 400 }); }
  try {
    const o = (evt.data && evt.data.object) || {};
    if (evt.type === 'account.updated') {
      await sbRest(env, `responder_profile?stripe_account_id=eq.${o.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { payouts_enabled: !!o.payouts_enabled } }).catch(() => {});
    } else if (evt.type === 'checkout.session.completed') {
      if (o.mode === 'payment' && o.metadata && o.metadata.kind === 'study_funding' && o.metadata.study_id) {
        const amt = o.amount_total || 0;
        let firstTime = false;
        try { await sbRest(env, 'study_funding', { method: 'POST', headers: { Prefer: 'return=representation' }, body: { study_id: o.metadata.study_id, partner_id: o.metadata.partner_id || null, amount_cents: amt, currency: o.currency || 'usd', stripe_session_id: o.id, stripe_payment_intent: o.payment_intent || null, status: 'paid' } }); firstTime = true; }
        catch (e) { firstTime = false; }  // unique stripe_session_id → already credited
        if (firstTime && amt > 0) await sbRest(env, 'rpc/add_study_funding', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { p_study: o.metadata.study_id, p_amount: amt } }).catch(() => {});
      }
    } else if (evt.type === 'transfer.paid' || evt.type === 'payout.paid') {
      if (o.id) await sbRest(env, `payment?stripe_transfer_id=eq.${o.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'paid' } }).catch(() => {});
    } else if (evt.type === 'transfer.failed' || evt.type === 'payout.failed') {
      if (o.id) await sbRest(env, `payment?stripe_transfer_id=eq.${o.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'failed' } }).catch(() => {});
    }
  } catch (e) {}
  return json({ ok: true, received: true }, 200, origin, env);
}
async function verifyStripeSig(payload, header, secret) {
  const parts = {};
  String(header).split(',').forEach(kv => { const i = kv.indexOf('='); if (i > 0) parts[kv.slice(0, i)] = kv.slice(i + 1); });
  const t = parts.t, v1 = parts.v1; if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + payload));
  const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== v1.length) return false;
  let diff = 0; for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}


// --- partner funds a study's response budget (Stripe Checkout) ---
async function payFundStudy(body, env, origin, user) {
  if (!payConfigured(env)) return json({ ok: false, error: 'payments_unconfigured' }, 200, origin, env);
  const sid = String(body.study_id || '');
  const qty = Math.max(1, Math.min(1000, parseInt(body.quantity, 10) || 0));
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  if (!qty) return json({ ok: false, error: 'quantity_required' }, 400, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,partner_id,title,pay_cents`);
  const study = ss && ss[0]; if (!study) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  // authz: owning partner or admin
  let partnerId = study.partner_id;
  const admin = await callerIsAdmin(env, user.id);
  if (!admin) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);
    const mine = pp && pp[0] && pp[0].id;
    if (!mine || mine !== study.partner_id) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
    partnerId = mine;
  }
  const unit = study.pay_cents || 0;
  if (unit <= 0) return json({ ok: false, error: 'no_pay_amount' }, 200, origin, env);
  const base = String(env.APP_URL || origin || '').replace(/\/$/, '');
  const session = await stripeApi(env, 'checkout/sessions', 'POST', {
    mode: 'payment',
    success_url: base + '/?funded=' + sid,
    cancel_url: base + '/?funded=cancel',
    line_items: [{ price_data: { currency: 'usd', unit_amount: unit, product_data: { name: 'Responses · ' + (study.title || 'Study') } }, quantity: qty }],
    metadata: { kind: 'study_funding', study_id: sid, partner_id: partnerId, qty: String(qty) },
    payment_intent_data: { metadata: { kind: 'study_funding', study_id: sid } }
  });
  return json({ ok: true, data: { url: session.url, amount_cents: unit * qty, quantity: qty } }, 200, origin, env);
}

/* ---------------------------- helpers --------------------------- */
function allowed(origin, env) {
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return list.length === 0 || list.includes(origin);
}
function corsHeaders(origin, env) {
  const h = new Headers();
  if (origin && allowed(origin, env)) { h.set('Access-Control-Allow-Origin', origin); h.set('Vary', 'Origin'); }
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'authorization, content-type, x-filename, apikey');
  return h;
}
function preflight(origin, env) { return new Response(null, { status: 204, headers: corsHeaders(origin, env) }); }
function json(data, status, origin, env) {
  const h = corsHeaders(origin, env); h.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers: h });
}
async function safeJson(request) { try { return await request.json(); } catch { return {}; } }


/* ------------------------- ARCADE SPINE -------------------------- */
/* Leaderboard backend for RPS / CLAW / POP. Public routes (players are
 * anonymous; identity = handle + private email in arcade_players).
 * Requires secret: LEADERBOARD_HMAC_SECRET. Reuses RATE_LIMIT KV for
 * replay protection (keys prefixed arc:). Tables from migration 0005;
 * events from 0007. Board reads go through leaderboard_public only.  */

const ARCADE = {
  GAMES: { rps:      { max: 50, live: true },                    // best streak cap
           claw:     { max: 5, minGrabMs: 3000, live: true },    // wins per session cap
           pop:      { max: 240, perSec: 4, live: true },        // 60s * 3pt heaters + slack
           chess:    { max: 50, live: true },                    // PRIMARY — best win-streak vs the Hand
           checkers: { max: 50, live: false },                   // best win-streak vs the Hand
           cornhole: { max: 21, live: false },                   // cancellation to 21, best session
           thumb:    { max: 60, perSec: 2, live: true } },       // pins per bout, rate-capped
  SESSION_MIN_S: 5, SESSION_MAX_S: 1800,
  HANDLE_RE: /^[A-Za-z0-9_ ]{3,20}$/,
  HANDLE_BLOCK: ['admin','unsurfaced','moderator','fuck','shit','bitch','cunt','nigg','fag','rape','hitler','nazi'],
};

async function arcadeRouter(path, request, env, origin) {
  const body = request.method === 'POST' ? await safeJson(request) : {};
  const url = new URL(request.url);
  switch (path) {
    case '/arcade/match':   return arcadeMatch(body, env, origin);
    case '/arcade/claim':   return arcadeClaim(body, env, origin);
    case '/arcade/gate':    return arcadeGate(body, env, origin);
    case '/arcade/prize':   return arcadePrize(env, origin);
    case '/arcade/join':    return arcadeJoin(body, env, origin);
    case '/arcade/session': return arcadeSession(url, env, origin);
    case '/arcade/score':   return arcadeScore(body, env, origin);
    case '/arcade/board':   return arcadeBoard(url, env, origin);
    default: return json({ ok: false, error: 'not_found' }, 404, origin, env);
  }
}

/* POST /arcade/join { handle, email } -> { ok, player_id, handle }
 * Email is stored and never surfaced anywhere public (migration 0005). */
async function arcadeJoin(body, env, origin) {
  if (body && body.game && ARCADE.GAMES[body.game] && ARCADE.GAMES[body.game].live === false)
    return json({ ok: false, error: 'coming_soon' }, 200, origin, env);
  const handle = String(body.handle || '').trim();
  const email  = String(body.email  || '').trim().toLowerCase();
  if (!ARCADE.HANDLE_RE.test(handle))
    return json({ ok: false, error: 'bad_handle', hint: '3-20 chars: letters, numbers, spaces, _' }, 400, origin, env);
  const lower = handle.toLowerCase();
  if (ARCADE.HANDLE_BLOCK.some(w => lower.includes(w)))
    return json({ ok: false, error: 'handle_unavailable' }, 400, origin, env);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({ ok: false, error: 'bad_email' }, 400, origin, env);
  try {
    const rows = await sbRest(env, 'arcade_players', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: { handle, email }
    });
    const p = rows && rows[0];
    logEvent(env, 'arcade', null, 'player_joined', null, {});
    return json({ ok: true, player_id: p.id, handle: p.handle }, 200, origin, env);
  } catch (e) {
    if (String(e.message).includes('409')) return json({ ok: false, error: 'handle_taken' }, 409, origin, env);
    throw e;
  }
}

/* GET /arcade/session?game=pop -> { ok, token }  (HMAC, embeds game+iat+jti) */
async function arcadeSession(url, env, origin) {
  { const g = url.searchParams.get('game'); if (g && ARCADE.GAMES[g] && ARCADE.GAMES[g].live === false)
    return json({ ok: false, error: 'coming_soon' }, 200, origin, env); }
  const game = url.searchParams.get('game');
  if (!ARCADE.GAMES[game]) return json({ ok: false, error: 'bad_game' }, 400, origin, env);
  const payload = { g: game, iat: Date.now(), jti: crypto.randomUUID() };
  const token = btoa(JSON.stringify(payload)) + '.' + await arcSign(env, JSON.stringify(payload));
  return json({ ok: true, token }, 200, origin, env);
}

/* POST /arcade/score { token, player_id, game, score, meta } -> { ok, rank } */
async function arcadeScore(body, env, origin) {
  const { token, player_id, game, score } = body;
  const meta = (body.meta && typeof body.meta === 'object') ? body.meta : {};
  const spec = ARCADE.GAMES[game];
  if (!spec || !token || !player_id) return json({ ok: false, error: 'bad_request' }, 400, origin, env);
  if (spec.live === false) return json({ ok: false, error: 'coming_soon' }, 200, origin, env);

  // 1. Token: signature, game match, age window
  const dot = token.lastIndexOf('.');
  if (dot < 0) return json({ ok: false, error: 'bad_token' }, 400, origin, env);
  const rawB64 = token.slice(0, dot), sig = token.slice(dot + 1);
  let payload; try { payload = JSON.parse(atob(rawB64)); } catch { return json({ ok: false, error: 'bad_token' }, 400, origin, env); }
  if (await arcSign(env, JSON.stringify(payload)) !== sig) return json({ ok: false, error: 'bad_sig' }, 403, origin, env);
  if (payload.g !== game) return json({ ok: false, error: 'game_mismatch' }, 400, origin, env);
  const ageS = (Date.now() - payload.iat) / 1000;
  if (ageS < ARCADE.SESSION_MIN_S || ageS > ARCADE.SESSION_MAX_S)
    return json({ ok: false, error: 'session_window' }, 400, origin, env);

  // 2. Replay: one submission per token (RATE_LIMIT KV, arc: prefix)
  if (env.RATE_LIMIT) {
    const k = 'arc:jti:' + payload.jti;
    if (await env.RATE_LIMIT.get(k)) return json({ ok: false, error: 'replay' }, 409, origin, env);
    await env.RATE_LIMIT.put(k, '1', { expirationTtl: 86400 });
  }

  // 3. Plausibility: caps per game; pop also capped by real elapsed time
  const s = Number(score);
  let valid = Number.isInteger(s) && s >= 0 && s <= spec.max;
  if (game === 'pop' && s > Math.ceil(Math.min(ageS, 75) * spec.perSec)) valid = false;
  if (game === 'claw' && meta.grab_ms != null && Number(meta.grab_ms) < spec.minGrabMs) valid = false;

  // POP achievement pre-read: the board top BEFORE this score lands.
  let popPrevTop = null;
  if (game === 'pop' && valid) {
    const t = await sbRest(env, `leaderboard_public?game=eq.pop&season=eq.${arcSeason()}&order=rank.asc&limit=1`);
    popPrevTop = (t && t[0]) ? Number(t[0].score) : null;
  }

  // 4. Insert (service role; anon has no path to these tables)
  await sbRest(env, 'arcade_scores', {
    method: 'POST',
    body: { player_id, game, score: s, meta, season: arcSeason(), valid }
  });
  logEvent(env, 'arcade', game, valid ? 'score_submitted' : 'score_rejected', payload.jti, { score: s });
  if (!valid) return json({ ok: false, error: 'implausible' }, 422, origin, env);

  const rank = await arcRank(env, game, player_id);
  // SEAM:ENDGAME — beating an existing top mints the reveal, server-decided.
  let grant = null;
  if (game === 'pop' && popPrevTop !== null && s > popPrevTop) {
    const cfg = await getArcConfig(env);
    grant = await arcGrant(env, player_id, 'pop', cfg);
  }
  return json(Object.assign({ ok: true, rank }, grant || {}), 200, origin, env);
}

/* GET /arcade/board?game=pop&player_id=... -> { ok, season, top, you } */
async function arcadeBoard(url, env, origin) {
  const game = url.searchParams.get('game');
  if (!ARCADE.GAMES[game]) return json({ ok: false, error: 'bad_game' }, 400, origin, env);
  if (ARCADE.GAMES[game].live === false) return json({ ok: false, error: 'coming_soon' }, 200, origin, env);
  const season = arcSeason();
  const top = await sbRest(env, `leaderboard_public?game=eq.${game}&season=eq.${season}&order=rank.asc&limit=10`);
  let you = null;
  const pid = url.searchParams.get('player_id');
  if (pid) you = await arcRank(env, game, pid);
  return json({ ok: true, season, top: top || [], you }, 200, origin, env);
}

async function arcRank(env, game, playerId) {
  try {
    const p = await sbRest(env, `arcade_players?id=eq.${playerId}&select=handle`);
    const handle = p && p[0] && p[0].handle;
    if (!handle) return null;
    const rows = await sbRest(env,
      `leaderboard_public?game=eq.${game}&season=eq.${arcSeason()}&handle=eq.${encodeURIComponent(handle)}`);
    return (rows && rows[0]) || null;
  } catch { return null; }
}

function arcSeason() {  // ISO week, e.g. 2026-W28 — weekly seasons per spec
  const d = new Date(); const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil((((t - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════════════════
 * SEAM:ENDGAME — skill mints the key, the claw spends it, the Hand
 * fulfills. One rotating house code (never per-player vouchers);
 * achievements REVEAL the current code, once per player per version,
 * so rotation re-arms the whole economy. The match rail is generic:
 * RPS rides it today, chess/checkers/thumb ride it tomorrow.
 * ═══════════════════════════════════════════════════════════════════ */
const ARC_ACH = {
  rps:   { key: 'three_matches', chain: 3 },   // best of 9: three consecutive best-of-3 wins vs the Hand
  pop:   { key: 'beats_top' },                 // beat the standing high score (server-decided in score submit)
  chess: { key: 'three_wins', chain: 3 },      // take three straight games from the Hand
  thumb: { key: 'ten_straight', chain: 10 },   // pin ten consecutive rounds
};
async function arcVerify(env, token, game) {
  if (!token) return { error: 'bad_token' };
  const dot = token.lastIndexOf('.');
  if (dot < 0) return { error: 'bad_token' };
  const rawB64 = token.slice(0, dot), sig = token.slice(dot + 1);
  let payload; try { payload = JSON.parse(atob(rawB64)); } catch (e) { return { error: 'bad_token' }; }
  if (await arcSign(env, JSON.stringify(payload)) !== sig) return { error: 'bad_sig' };
  if (payload.g !== game) return { error: 'game_mismatch' };
  const ageS = (Date.now() - payload.iat) / 1000;
  if (ageS < ARCADE.SESSION_MIN_S || ageS > ARCADE.SESSION_MAX_S) return { error: 'session_window' };
  return { ok: true, payload };
}
async function getArcConfig(env) {
  const rows = await sbRest(env, 'arcade_config?id=eq.1');
  if (rows && rows[0]) return rows[0];
  const seed = { id: 1, code: 'UNSURFACED', code_version: 1, prize_name: 'The first prize', prize_blurb: '' };
  await sbRest(env, 'arcade_config', { method: 'POST', body: seed });
  return seed;
}
async function arcGrant(env, playerId, game, cfg) {
  // Unarmed treasury: the win stands, the reveal is NOT consumed —
  // come back and play again once the Hand arms the claw.
  if (!cfg.code || !String(cfg.code).trim()) {
    logEvent(env, 'arcade', game, 'token_unarmed', null, {});
    return { achieved: true, armed: false };
  }
  // One reveal per player per code version — rotation re-arms.
  try {
    await sbRest(env, 'arcade_achievements', { method: 'POST', body: {
      player_id: playerId, game, achievement_key: ARC_ACH[game].key, code_version: cfg.code_version } });
    logEvent(env, 'arcade', game, 'code_revealed', null, { v: cfg.code_version });
    return { achieved: true, armed: true, code: cfg.code, prize: cfg.prize_name };
  } catch (e) { return { achieved: false, already: true }; }
}
async function arcadeMatch(body, env, origin) {
  const { token, player_id, game, result } = body;
  const spec = ARCADE.GAMES[game];
  if (!spec || !player_id || !['win', 'loss'].includes(result))
    return json({ ok: false, error: 'bad_request' }, 400, origin, env);
  if (spec.live === false) return json({ ok: false, error: 'coming_soon' }, 200, origin, env);
  const v = await arcVerify(env, token, game);
  if (!v.ok) return json({ ok: false, error: v.error }, 403, origin, env);
  const today = new Date().toISOString().slice(0, 10);
  const dayCount = await sbRest(env,
    `arcade_match_log?player_id=eq.${player_id}&game=eq.${game}&created_at=gte.${today}&select=id&limit=200`);
  if (dayCount && dayCount.length >= 200) return json({ ok: false, error: 'slow_down' }, 429, origin, env);
  await sbRest(env, 'arcade_match_log', { method: 'POST', body: {
    player_id, game, result, meta: (body.meta && typeof body.meta === 'object') ? body.meta : {} } });
  const ach = ARC_ACH[game];
  if (result !== 'win' || !ach || !ach.chain) return json({ ok: true }, 200, origin, env);
  const last = await sbRest(env,
    `arcade_match_log?player_id=eq.${player_id}&game=eq.${game}&order=created_at.desc,id.desc&limit=${ach.chain}&select=result`);
  let streak = 0;
  for (const r of (last || [])) { if (r.result === 'win') streak++; else break; }
  if (streak < ach.chain) return json({ ok: true, chain: streak }, 200, origin, env);
  const cfg = await getArcConfig(env);
  const grant = await arcGrant(env, player_id, game, cfg);
  return json(Object.assign({ ok: true, chain: ach.chain }, grant), 200, origin, env);
}
/* POST /arcade/gate { token(claw session), code } -> { ok, armed, valid }
   The doorman: validates a token against the treasury without spending it. */
async function arcadeGate(body, env, origin) {
  const { token, code } = body;
  const v = await arcVerify(env, token, 'claw');
  if (!v.ok) return json({ ok: false, error: v.error }, 403, origin, env);
  const cfg = await getArcConfig(env);
  const armed = !!(cfg.code && String(cfg.code).trim());
  if (!armed) return json({ ok: true, armed: false, valid: false }, 200, origin, env);
  const valid = String(code || '').trim().toUpperCase() === String(cfg.code).trim().toUpperCase();
  logEvent(env, 'arcade', 'claw', valid ? 'gate_opened' : 'gate_refused', v.payload.jti, {});
  return json({ ok: true, armed: true, valid }, 200, origin, env);
}
async function arcadeClaim(body, env, origin) {
  const { token, player_id, code } = body;
  if (!player_id || !code) return json({ ok: false, error: 'bad_request' }, 400, origin, env);
  const v = await arcVerify(env, token, 'claw');
  if (!v.ok) return json({ ok: false, error: v.error }, 403, origin, env);
  if (env.RATE_LIMIT) {
    const k = 'arc:claim:' + v.payload.jti;
    if (await env.RATE_LIMIT.get(k)) return json({ ok: false, error: 'replay' }, 409, origin, env);
    await env.RATE_LIMIT.put(k, '1', { expirationTtl: 86400 });
  }
  const cfg = await getArcConfig(env);
  if (!cfg.code || !String(cfg.code).trim())
    return json({ ok: false, error: 'unarmed' }, 200, origin, env);
  const given = String(code).trim().toUpperCase();
  if (given !== String(cfg.code).trim().toUpperCase()) {
    logEvent(env, 'arcade', 'claw', 'claim_stale', v.payload.jti, {});
    return json({ ok: false, error: 'stale_code' }, 200, origin, env);
  }
  const ticket = (Date.now().toString(36).slice(-3) + Math.random().toString(36).slice(2, 5)).toUpperCase();
  await sbRest(env, 'arcade_claims', { method: 'POST', body: {
    ticket, player_id, prize_name: cfg.prize_name, prize_blurb: cfg.prize_blurb || '',
    code_version: cfg.code_version, status: 'open' } });
  logEvent(env, 'arcade', 'claw', 'prize_claimed', v.payload.jti, { ticket });
  return json({ ok: true, ticket, prize: cfg.prize_name }, 200, origin, env);
}
async function arcadePrize(env, origin) {
  const cfg = await getArcConfig(env);
  return json({ ok: true, name: cfg.prize_name, blurb: cfg.prize_blurb || '',
    model: cfg.prize_obj_key ? '/media/' + cfg.prize_obj_key : null }, 200, origin, env);
}
/* ── the treasury: admin only, DB-truth gated ── */
async function arcAdminState(env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const cfg = await getArcConfig(env);
  const open = await sbRest(env, 'arcade_claims?status=eq.open&select=id');
  const reveals = await sbRest(env, `arcade_achievements?code_version=eq.${cfg.code_version}&select=id`);
  return json({ ok: true, code: cfg.code, code_version: cfg.code_version,
    prize: { name: cfg.prize_name, blurb: cfg.prize_blurb || '', model: cfg.prize_obj_key || null },
    open_claims: (open || []).length, reveals_this_version: (reveals || []).length }, 200, origin, env);
}
async function arcAdminRotate(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const code = String(body.code || '').trim();
  const disarm = code === '';
  if (!disarm && !/^[A-Za-z0-9\- ]{3,24}$/.test(code)) return json({ ok: false, error: 'bad_code' }, 200, origin, env);
  const cfg = await getArcConfig(env);
  const nextV = cfg.code_version + 1;
  await sbRest(env, 'arcade_config?id=eq.1', { method: 'PATCH', body: {
    code: disarm ? '' : code.toUpperCase(), code_version: nextV, updated_at: new Date().toISOString() } });
  logEvent(env, 'arcade', null, disarm ? 'code_disarmed' : 'code_rotated', null, { v: nextV });
  return json({ ok: true, code_version: nextV, armed: !disarm }, 200, origin, env);
}
async function arcAdminPrize(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const patch = { updated_at: new Date().toISOString() };
  if (body.name) patch.prize_name = String(body.name).slice(0, 80);
  if (body.blurb != null) patch.prize_blurb = String(body.blurb).slice(0, 240);
  await getArcConfig(env);
  await sbRest(env, 'arcade_config?id=eq.1', { method: 'PATCH', body: patch });
  return json({ ok: true }, 200, origin, env);
}
async function arcAdminPrizeObj(request, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const name = (request.headers.get('x-filename') || 'prize.obj').replace(/[^\w.-]/g, '_');
  if (!/\.obj$/i.test(name)) return json({ ok: false, error: 'obj_only' }, 200, origin, env);
  const raw = await request.arrayBuffer();
  if (!raw.byteLength || raw.byteLength > 8000000) return json({ ok: false, error: 'size' }, 200, origin, env);
  if (!env.MEDIA) return json({ ok: false, error: 'storage_unconfigured' }, 500, origin, env);
  const key = `arcade/prize/${Date.now()}-${name}`;
  await env.MEDIA.put(key, raw, { httpMetadata: { contentType: 'text/plain' } });
  await getArcConfig(env);
  await sbRest(env, 'arcade_config?id=eq.1', { method: 'PATCH', body: {
    prize_obj_key: key, updated_at: new Date().toISOString() } });
  return json({ ok: true, key }, 200, origin, env);
}
async function arcAdminClaims(env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const rows = await sbRest(env,
    'arcade_claims?order=created_at.desc&limit=50&select=ticket,player_id,prize_name,status,created_at,fulfilled_at');
  const ids = [...new Set((rows || []).map(r => r.player_id))];
  let handles = {};
  if (ids.length) {
    const ps = await sbRest(env, `arcade_players?id=in.(${ids.join(',')})&select=id,handle`);
    (ps || []).forEach(p => { handles[p.id] = p.handle; });
  }
  return json({ ok: true, claims: (rows || []).map(r => Object.assign({ handle: handles[r.player_id] || '?' }, r)) }, 200, origin, env);
}
async function arcAdminFulfill(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const t = String(body.ticket || '').trim().toUpperCase();
  if (!t) return json({ ok: false, error: 'bad_ticket' }, 200, origin, env);
  await sbRest(env, `arcade_claims?ticket=eq.${encodeURIComponent(t)}`, { method: 'PATCH', body: {
    status: 'fulfilled', fulfilled_at: new Date().toISOString() } });
  logEvent(env, 'arcade', null, 'claim_fulfilled', null, { ticket: t });
  return json({ ok: true, ticket: t }, 200, origin, env);
}


async function arcSign(env, raw) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.LEADERBOARD_HMAC_SECRET || 'dev-only'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* SEAM:ACTIVITY_LOG — the one function every endpoint calls to record an
 * event (migration 0007). Fire-and-forget: analytics never block product. */
function logEvent(env, platform, space, event, sessionId, meta) {
  try {
    sbRest(env, 'activity_events', {
      method: 'POST',
      body: { platform, space, event, session_id: sessionId, meta: meta || {} }
    }).catch(() => {});
  } catch { /* never throw from telemetry */ }
}

/* ═══════════════════════════════════════════════════════════════════
 * SEAM:STUDIO — the content engine. After DAILY publishes, the engine
 * cuts the day's manifest into content_pieces: what to say, where, from
 * which data. Rendering happens in the admin's browser (the house
 * renderer); binaries archive to R2 only at deploy. Doctrine:
 * templates/DOCTRINE.md — evidence that surfaced, not content made.
 * Caps are law: perishable lane ships at most 2 pieces a day.
 * ═══════════════════════════════════════════════════════════════════ */
const STUDIO_VOICE = 'Voice: declarative, specific, a little dangerous. Use ONLY facts, numbers, and dates that appear in the finding text \u2014 inventing a date, figure, name, or event is the one unforgivable move. If the finding has no number, write without one. '
  + 'Never explain the joke. Banned: engagement-bait ("you won\'t believe", "stop scrolling"), '
  + 'emoji soup, listicle cadence, hashtag walls. Write like the reader is smart and busy.';
function studioGround(item) {
  return [item.headline, item.standfirst, item.take, item.kicker, item.source_name, item.date]
    .map(x => String(x || '')).join(' ');
}
function studioFabricated(text, ground) {
  // Years and money the ground never mentioned = invention. Zero tolerance.
  const g = String(ground || '');
  const years = String(text || '').match(/\b(19|20)\d{2}\b/g) || [];
  for (const y of years) if (!g.includes(y)) return 'year:' + y;
  const money = String(text || '').match(/[\u20AC$\u00A3]\s?[\d.,]+\s?(?:million|billion|[MBK]\b)?|\b[\d.,]+\s(?:million|billion)\b/gi) || [];
  for (const m of money) if (!g.includes(m.trim())) return 'money:' + m.trim();
  return null;
}
function studioSafeCaption(platform, item) {
  const base = String(item.headline || '') + ' \u2014 ' + String(item.take || '').slice(0, 160);
  if (platform === 'linkedin') return base + (item.source_name ? '\nSource: ' + item.source_name : '');
  return base + '\n\n#unsurfaced #' + String(item.kicker || 'signal').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
async function studioCaption(env, platform, item) {
  const dialect = platform === 'linkedin'
    ? 'LinkedIn dialect: the finding leads; 2-3 sentences arguing it; no hashtags.'
    : platform === 'instagram'
      ? 'Instagram dialect: one sharp line, then one context line. End with up to 5 chosen hashtags on their own line.'
      : 'TikTok dialect: hook under 12 words, then one payoff line. Up to 4 hashtags.';
  try {
    const ground = studioGround(item);
    const user = `Finding: ${item.headline}\n${item.standfirst || ''}\nThe take: ${item.take || ''}\nSource: ${item.source_name || ''}`;
    let out = await callModel(env, 't1', [
      { role: 'system', content: 'You write social captions for Unsurfaced, a creative recon group publishing daily cultural intelligence. ' + STUDIO_VOICE + ' ' + dialect + ' Output only the caption text.' },
      { role: 'user', content: user }
    ], { max_tokens: 220 });
    let cap = String(out || '').trim().slice(0, 900);
    if (studioFabricated(cap, ground)) {
      out = await callModel(env, 't1', [
        { role: 'system', content: 'Rewrite the caption using ONLY the facts in the finding. Remove every date, figure, and name that the finding does not contain. ' + dialect + ' Output only the caption text.' },
        { role: 'user', content: user + '\n\nCaption to fix: ' + cap }
      ], { max_tokens: 220 });
      cap = String(out || '').trim().slice(0, 900);
    }
    if (!cap || studioFabricated(cap, ground)) cap = studioSafeCaption(platform, item);
    return cap;
  } catch (e) { return studioSafeCaption(platform, item); }
}
async function studioMemeLines(env, item) {
  try {
    const out = await callModel(env, 't1', [
      { role: 'system', content: 'You write two-line house memes for Unsurfaced. ' + STUDIO_VOICE + ' Formats: "verdict" (line1 = the finding stated flat, line2 = the deadpan read) or "vs" (line1 = the signal, line2 = the noise it replaces). No emoji ever. Output ONLY JSON: {"mformat":"verdict"|"vs","line1":"...","line2":"..."}' },
      { role: 'user', content: `Finding: ${item.headline}\nThe take: ${item.take || ''}` }
    ], { max_tokens: 140 });
    const j = JSON.parse(String(out).replace(/```json|```/g, '').trim());
    if (j && j.line1) {
      const ground = studioGround(item);
      if (!studioFabricated(String(j.line1) + ' ' + String(j.line2 || ''), ground))
        return { mformat: j.mformat === 'vs' ? 'vs' : 'verdict',
          line1: String(j.line1).slice(0, 90), line2: String(j.line2 || '').slice(0, 110) };
    }
  } catch (e) {}
  return { mformat: 'verdict', line1: String(item.headline || '').slice(0, 90),
    line2: String(item.take || '').slice(0, 110) };
}
async function buildStudioManifest(env, day, issueNo, items) {
  try {
    const existing = await sbRest(env, `content_pieces?day=eq.${day}&select=id&limit=1`);
    if (existing && existing.length) return { ok: true, skipped: 'manifest-exists' };
    const lead = items && items[0];
    if (!lead) return { ok: false, error: 'no_items' };
    // THE SLATE — three stories across distinct beats, not one story in eleven outfits.
    // Deterministic and free: walk the edition, seat the first story per unseen beat.
    const slate = [];
    const seenBeats = new Set();
    for (const it of items) {
      const b = it.beat || null;
      if (b && !seenBeats.has(b)) { seenBeats.add(b); slate.push(it); }
      if (slate.length === 3) break;
    }
    for (const it of items) {           // beats absent (pre-0012 editions) or thin: fill by order
      if (slate.length === 3) break;
      if (!slate.includes(it)) slate.push(it);
    }
    const base = (it, story) => ({ issue_no: issueNo, date: day, kicker: it.kicker, headline: it.headline,
      take: it.take, source_name: it.source_name, beat: it.beat || 'culture', story });
    const sixPayload = { issue_no: issueNo, date: day,
      slides: (items || []).slice(0, 6).map(it => ({
        kicker: it.kicker, headline: it.headline, take: it.take, source_name: it.source_name })) };
    // 17 cells: edition x3 · primary story x8 · stories two and three x3 each.
    const MATRIX = [
      { format: 'the_six', platform: 'instagram', lane: 'perishable', it: null, story: 0 },
      { format: 'the_six', platform: 'linkedin',  lane: 'perishable', it: null, story: 0 },
      { format: 'the_six', platform: 'tiktok',    lane: 'perishable', it: null, story: 0 },
    ];
    if (slate[0]) MATRIX.push(
      { format: 'signal_still', platform: 'instagram', lane: 'perishable', it: slate[0], story: 1 },
      { format: 'signal_still', platform: 'linkedin',  lane: 'perishable', it: slate[0], story: 1 },
      { format: 'kinetic_take', platform: 'instagram', lane: 'perishable', it: slate[0], story: 1 },
      { format: 'kinetic_take', platform: 'linkedin',  lane: 'perishable', it: slate[0], story: 1 },
      { format: 'kinetic_take', platform: 'tiktok',    lane: 'perishable', it: slate[0], story: 1 },
      { format: 'hand_meme',    platform: 'instagram', lane: 'durable',    it: slate[0], story: 1 },
      { format: 'hand_meme',    platform: 'linkedin',  lane: 'durable',    it: slate[0], story: 1 },
      { format: 'hand_meme',    platform: 'tiktok',    lane: 'durable',    it: slate[0], story: 1 });
    [slate[1], slate[2]].forEach((it, i) => { if (it) MATRIX.push(
      { format: 'signal_still', platform: 'instagram', lane: 'perishable', it, story: 2 + i },
      { format: 'kinetic_take', platform: 'tiktok',    lane: 'perishable', it, story: 2 + i },
      { format: 'hand_meme',    platform: 'instagram', lane: 'durable',    it, story: 2 + i }); });
    const memeByStory = {};
    for (const it of slate) if (it) memeByStory[it.headline] = await studioMemeLines(env, it);
    const pieces = [];
    for (const cell of MATRIX) {
      const it = cell.it || lead;
      let payload;
      if (cell.format === 'the_six') payload = sixPayload;
      else if (cell.format === 'hand_meme') payload = Object.assign(base(it, cell.story), memeByStory[it.headline] || {});
      else payload = base(it, cell.story);
      pieces.push({ day, lane: cell.lane, format: cell.format, platform: cell.platform, status: 'draft',
        copy: { caption: await studioCaption(env, cell.platform, it) }, payload });
    }
    await sbRest(env, 'content_pieces', { method: 'POST', body: pieces });
    logEvent(env, 'intelligence', 'studio', 'manifest_cut', null, { day, pieces: pieces.length });
    return { ok: true, pieces: pieces.length };
  } catch (e) {
    return { ok: false, error: String(e && e.message).slice(0, 200) };
  }
}
async function studioCutStory(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const itemId = parseInt(body.item_id, 10);
  if (!itemId) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const rows = await sbRest(env, `edition_items?id=eq.${itemId}&select=*`);
  const it = rows && rows[0];
  if (!it) return json({ ok: false, error: 'not_found' }, 200, origin, env);
  const eds = await sbRest(env, `editions?id=eq.${it.edition_id}&select=issue_no,date`);
  const ed = (eds && eds[0]) || {};
  const day = ed.date || new Date().toISOString().slice(0, 10);
  const dupe = await sbRest(env, `content_pieces?day=eq.${day}&payload->>headline=eq.${encodeURIComponent(it.headline)}&select=id&limit=1`);
  if (dupe && dupe.length) return json({ ok: true, skipped: 'story-already-cut' }, 200, origin, env);
  const meme = await studioMemeLines(env, it);
  const base = { issue_no: ed.issue_no, date: day, kicker: it.kicker, headline: it.headline,
    take: it.take, source_name: it.source_name, beat: it.beat || 'culture', story: 9 };
  const pieces = [
    { day, lane: 'perishable', format: 'signal_still', platform: 'instagram', status: 'draft',
      copy: { caption: await studioCaption(env, 'instagram', it) }, payload: base },
    { day, lane: 'perishable', format: 'kinetic_take', platform: 'tiktok', status: 'draft',
      copy: { caption: await studioCaption(env, 'tiktok', it) }, payload: base },
    { day, lane: 'durable', format: 'hand_meme', platform: 'instagram', status: 'draft',
      copy: { caption: await studioCaption(env, 'instagram', it) }, payload: Object.assign({}, base, meme) },
  ];
  await sbRest(env, 'content_pieces', { method: 'POST', body: pieces });
  logEvent(env, 'intelligence', 'studio', 'story_cut', null, { item: itemId, beat: base.beat });
  return json({ ok: true, pieces: 3, beat: base.beat }, 200, origin, env);
}
async function studioManifest(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const days = Math.min(parseInt(body.days, 10) || 7, 30);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = await sbRest(env,
    `content_pieces?day=gte.${since}&order=day.desc,id.asc&select=id,day,lane,format,platform,copy,payload,status,deployed_at,post_url,archive_key`);
  return json({ ok: true, pieces: rows || [] }, 200, origin, env);
}
async function studioGenerate(env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const eds = await sbRest(env, 'editions?status=eq.published&order=date.desc&limit=1');
  const ed = eds && eds[0];
  if (!ed) return json({ ok: false, error: 'no_edition' }, 200, origin, env);
  const items = await sbRest(env, `edition_items?edition_id=eq.${ed.id}&order=ord.asc`);
  const r = await buildStudioManifest(env, ed.date, ed.issue_no, items || []);
  return json(r, 200, origin, env);
}
async function studioUpdate(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const id = parseInt(body.id, 10);
  if (!id) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const patch = {};
  if (body.copy && typeof body.copy === 'object') patch.copy = body.copy;
  if (['draft', 'approved', 'killed'].includes(body.status)) patch.status = body.status;
  if (!Object.keys(patch).length) return json({ ok: false, error: 'empty_patch' }, 200, origin, env);
  await sbRest(env, `content_pieces?id=eq.${id}`, { method: 'PATCH', body: patch });
  return json({ ok: true, id }, 200, origin, env);
}
async function studioArchive(request, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const u = new URL(request.url);
  const id = parseInt(u.searchParams.get('id'), 10);
  const ext = (u.searchParams.get('ext') || 'png').replace(/[^a-z0-9]/gi, '').slice(0, 4);
  const postUrl = (u.searchParams.get('post_url') || '').slice(0, 400);
  if (!id) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const rows = await sbRest(env, `content_pieces?id=eq.${id}&select=id,day,format`);
  const piece = rows && rows[0];
  if (!piece) return json({ ok: false, error: 'not_found' }, 200, origin, env);
  let archive_key = null;
  const raw = await request.arrayBuffer();
  if (raw && raw.byteLength > 0 && env.MEDIA) {
    if (raw.byteLength > 60000000) return json({ ok: false, error: 'too_large' }, 200, origin, env);
    archive_key = `studio/${piece.day}/${piece.id}-${piece.format}.${ext}`;
    await env.MEDIA.put(archive_key, raw, { httpMetadata: {
      contentType: ext === 'mp4' ? 'video/mp4' : ext === 'zip' ? 'application/zip' : ext === 'pdf' ? 'application/pdf' : 'image/png' } });
  }
  const patch = { status: 'deployed', deployed_at: new Date().toISOString() };
  if (archive_key) patch.archive_key = archive_key;
  if (postUrl) patch.post_url = postUrl;
  await sbRest(env, `content_pieces?id=eq.${id}`, { method: 'PATCH', body: patch });
  logEvent(env, 'intelligence', 'studio', 'piece_deployed', null, { id, format: piece.format, archived: !!archive_key });
  return json({ ok: true, id, archive_key }, 200, origin, env);
}

/* ═══ SEAM:STUDYBOARD — the public study board. Anyone may read the
 * opted-in shelf; the Worker (service role) is the only door and it
 * enforces the three locks server-side: live + audience='open' +
 * public_listing=true. Safe fields only — no partner identity, no
 * invites, no funding internals. ═══ */
async function mineStudiesPublic(env, origin) {
  try {
    const rows = await sbRest(env,
      'study?select=id,title,goal,type,pay_cents,created_at' +
      '&status=eq.live&audience=eq.open&public_listing=eq.true' +
      '&order=created_at.desc&limit=24');
    return json({ ok: true, studies: rows || [] }, 200, origin, env);
  } catch (e) {
    return json({ ok: true, studies: [] }, 200, origin, env);
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * SEAM:KNOWLEDGE — the feed doorway. Founder-fed data enters here:
 * paste, URL, or text file → chunk → embed → knowledge_base (0006).
 * INTERNAL data: embeds ride Workers AI on our account only — never a
 * free/training-eligible pool. Table is service-role locked; these
 * admin-gated routes are the only door. Originals archive to R2.
 * ═══════════════════════════════════════════════════════════════════ */
const KB_EMBED_MODEL = '@cf/baai/bge-small-en-v1.5';   // 384-dim, matches vector(384)
function kbChunk(text, size, cap) {
  size = size || 900; cap = cap || 60;
  const paras = String(text || '').split(/\n\s*\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  let cur = '';
  for (const p of paras) {
    if (p.length > size) {                       // hard-split an oversized paragraph
      if (cur) { out.push(cur); cur = ''; }
      for (let i = 0; i < p.length && out.length < cap; i += size) out.push(p.slice(i, i + size));
      continue;
    }
    if ((cur + ' ' + p).trim().length > size) { out.push(cur); cur = p; }
    else cur = (cur ? cur + '\n' : '') + p;
    if (out.length >= cap) break;
  }
  if (cur && out.length < cap) out.push(cur);
  return out.slice(0, cap);
}
async function kbEmbed(env, chunks) {
  const vecs = [];
  for (let i = 0; i < chunks.length; i += 20) {
    const batch = chunks.slice(i, i + 20);
    const r = await env.AI.run(KB_EMBED_MODEL, { text: batch });
    const data = (r && r.data) || [];
    if (data.length !== batch.length) throw new Error('embed_shape');
    for (const v of data) vecs.push('[' + v.join(',') + ']');
  }
  return vecs;
}
async function kbInsert(env, user, chunks, vecs, extra) {
  const rows = chunks.map((c, i) => Object.assign({
    content: c, embedding: vecs[i], submitted_by: user.id,
    tags: extra.tags || [], target: extra.target, status: 'live'
  }, extra.source_url ? { source_url: extra.source_url } : {},
     extra.file_ref ? { file_ref: extra.file_ref } : {}));
  await sbRest(env, 'knowledge_base', { method: 'POST', body: rows });
  return rows.length;
}
function kbTarget(t) { return ['daily', 'intelligence', 'both'].includes(t) ? t : 'both'; }
function kbTags(x) {
  const a = Array.isArray(x) ? x : String(x || '').split(',');
  return a.map(s => String(s).trim().toLowerCase()).filter(Boolean).slice(0, 12);
}
async function kbWhoami(env, origin, user) {
  // UI gating only — every /knowledge route re-checks at the door regardless.
  return json({ ok: true, admin: await callerIsAdmin(env, user.id) }, 200, origin, env);
}
async function kbSubmit(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const target = kbTarget(body.target), tags = kbTags(body.tags);
  let text = String(body.text || '').slice(0, 60000), source_url = null;
  if (!text && body.url) {
    let t;
    try { t = new URL(String(body.url)); } catch (e) { return json({ ok: false, error: 'bad_url' }, 200, origin, env); }
    if (!/^https?:$/.test(t.protocol) || t.port || pvBlockedHost(t.hostname))
      return json({ ok: false, error: 'blocked' }, 200, origin, env);
    let res;
    try {
      res = await fetch(t.href, { redirect: 'follow', headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnsurfacedFeed/1.0; +https://unsurfaced-intelligence.com)',
        'Accept': 'text/html,application/xhtml+xml' } });
    } catch (e) { return json({ ok: false, error: 'unreachable' }, 200, origin, env); }
    if (!res.ok || !/text\/html|xhtml/.test(res.headers.get('content-type') || ''))
      return json({ ok: false, error: 'not_html' }, 200, origin, env);
    const ex = pvExtract((await res.text()).slice(0, 600000), res.url || t.href);
    text = [ex.title].concat(ex.paragraphs).join('\n\n');
    source_url = t.href;
  }
  if (!text.trim()) return json({ ok: false, error: 'empty' }, 200, origin, env);
  const chunks = kbChunk(text);
  try {
    const vecs = await kbEmbed(env, chunks);
    const added = await kbInsert(env, user, chunks, vecs, { tags, target, source_url });
    return json({ ok: true, added, target, tags }, 200, origin, env);
  } catch (e) {
    await sbRest(env, 'knowledge_base', { method: 'POST', body: [{
      content: text.slice(0, 900), submitted_by: user.id, tags, target,
      status: 'failed', fail_reason: String(e && e.message).slice(0, 200),
      ...(source_url ? { source_url } : {}) }] });
    return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
  }
}
async function kbFile(request, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const u = new URL(request.url);
  const target = kbTarget(u.searchParams.get('target')), tags = kbTags(u.searchParams.get('tags'));
  const name = (request.headers.get('x-filename') || 'drop.txt').replace(/[^\w.-]/g, '_');
  if (!/\.(txt|md|markdown|csv|json)$/i.test(name))
    return json({ ok: false, error: 'text_files_only' }, 200, origin, env);
  const raw = await request.arrayBuffer();
  if (raw.byteLength > 1500000) return json({ ok: false, error: 'too_large' }, 200, origin, env);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(raw).slice(0, 60000);
  if (!text.trim()) return json({ ok: false, error: 'empty' }, 200, origin, env);
  let file_ref = null;
  if (env.MEDIA) {
    file_ref = `knowledge/${user.id}/${Date.now()}-${name}`;
    await env.MEDIA.put(file_ref, raw, { httpMetadata: { contentType: 'text/plain' } });
  }
  const chunks = kbChunk(text);
  try {
    const vecs = await kbEmbed(env, chunks);
    const added = await kbInsert(env, user, chunks, vecs, { tags, target, file_ref });
    return json({ ok: true, added, target, tags, file_ref }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
  }
}
async function kbList(env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const rows = await sbRest(env, 'knowledge_base?select=id,content,source_url,file_ref,tags,target,status,created_at&order=created_at.desc&limit=50');
  return json({ ok: true, rows: (rows || []).map(r => Object.assign(r, { content: String(r.content || '').slice(0, 140) })) }, 200, origin, env);
}
async function kbSearch(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const q = String(body.q || '').slice(0, 500);
  if (!q.trim()) return json({ ok: false, error: 'empty' }, 200, origin, env);
  const vec = (await kbEmbed(env, [q]))[0];
  const rows = await sbRest(env, 'rpc/knowledge_search', { method: 'POST',
    body: { p_target: kbTarget(body.target), p_query: vec, p_count: Math.min(+body.count || 8, 20) } });
  return json({ ok: true, rows: rows || [] }, 200, origin, env);
}
async function kbDelete(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const id = parseInt(body.id, 10);
  if (!id) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  await sbRest(env, `knowledge_base?id=eq.${id}`, { method: 'DELETE' });
  return json({ ok: true, deleted: id }, 200, origin, env);
}

/* ═══════════════════════════════════════════════════════════════════
 * SEAM:PREVIEW — in-house source reader. Fetches an article server-side,
 * extracts the readable core (title, key visual, paragraphs), and — the
 * house being English-first — translates non-English text on request.
 * Translation rides Workers AI m2m100 first, MODEL_POOL t1 as fallback;
 * public news only, so free tiers are fair game. Edge-cached.
 * ═══════════════════════════════════════════════════════════════════ */
const PV_LANG_CODES = { arabic:'ar', bulgarian:'bg', chinese:'zh', croatian:'hr', czech:'cs',
  danish:'da', dutch:'nl', english:'en', finnish:'fi', french:'fr', german:'de', greek:'el',
  hebrew:'he', hindi:'hi', hungarian:'hu', indonesian:'id', italian:'it', japanese:'ja',
  korean:'ko', norwegian:'no', polish:'pl', portuguese:'pt', romanian:'ro', russian:'ru',
  serbian:'sr', slovak:'sk', slovenian:'sl', spanish:'es', swedish:'sv', thai:'th',
  turkish:'tr', ukrainian:'uk', vietnamese:'vi' };
function pvLangCode(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  if (PV_LANG_CODES[n]) return PV_LANG_CODES[n];
  return /^[a-z]{2}/.test(n) ? n.slice(0, 2) : null;
}
function pvBlockedHost(host) {
  const x = String(host || '').toLowerCase();
  if (!x || x === 'localhost' || x.endsWith('.local') || x.endsWith('.internal') || x.endsWith('.lan')) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(x)) {
    const p = x.split('.').map(Number);
    if (p[0] === 127 || p[0] === 10 || p[0] === 0 || (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
        (p[0] === 192 && p[1] === 168) || (p[0] === 169 && p[1] === 254)) return true;
  }
  if (x.includes(':')) return true;
  return false;
}
function pvDecode(s) {
  return String(s || '')
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ''; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ''; } })
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026').replace(/\s+/g, ' ').trim();
}
function pvMeta(html, prop) {
  const re = new RegExp('<meta[^>]+(?:property|name)=["\\x27]' + prop + '["\\x27][^>]*>', 'i');
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["\x27]([^"\x27]*)["\x27]/i);
  return c ? pvDecode(c[1]) : null;
}
function pvExtract(html, finalUrl) {
  const tm = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = pvMeta(html, 'og:title') || (tm ? pvDecode(tm[1]) : null);
  const site = pvMeta(html, 'og:site_name') || (new URL(finalUrl)).hostname.replace(/^www\./, '');
  let image = pvMeta(html, 'og:image') || pvMeta(html, 'twitter:image');
  if (image) { try { image = new URL(image, finalUrl).href; if (!/^https?:/.test(image)) image = null; } catch (e) { image = null; } }
  let lang = null;
  const hl = html.match(/<html[^>]+lang=["\x27]?([a-zA-Z-]{2,})/);
  if (hl) lang = hl[1].slice(0, 2).toLowerCase();
  if (!lang) { const loc = pvMeta(html, 'og:locale'); if (loc) lang = loc.slice(0, 2).toLowerCase(); }
  let body = html.replace(/<(script|style|noscript|svg|iframe|form|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ');
  const art = body.match(/<article[\s\S]*?<\/article>/i);
  if (art) body = art[0];
  const paras = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m, chars = 0;
  while ((m = re.exec(body)) && paras.length < 45 && chars < 14000) {
    const t = pvDecode(m[1].replace(/<[^>]+>/g, ' '));
    const cjk = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(t);
    if (t.length >= (cjk ? 15 : 40)) { paras.push(t); chars += t.length; }
  }
  if (!paras.length) { const d = pvMeta(html, 'og:description'); if (d) paras.push(d); }
  return { title: title || site, site, image, lang, paragraphs: paras };
}
async function pvTranslate(env, srcLang, texts) {
  const code = pvLangCode(srcLang);
  const out = [];
  for (const t of texts) {
    let done = null;
    if (code && code !== 'en') {
      try {
        const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text: t.slice(0, 1600), source_lang: code, target_lang: 'en' });
        done = r && r.translated_text ? String(r.translated_text).trim() : null;
      } catch (e) { done = null; }
    }
    if (!done) {
      try {
        done = (await callModel(env, 't1', [
          { role: 'system', content: 'Translate the user text into English. Output only the translation, nothing else.' },
          { role: 'user', content: t.slice(0, 1600) }
        ], { max_tokens: 700 })).trim();
      } catch (e) { done = t; }
    }
    out.push(done || t);
  }
  return out;
}
async function previewRoute(request, env, origin) {
  const u = new URL(request.url);
  const target = u.searchParams.get('url') || '';
  const wantEn = (u.searchParams.get('lang') || 'en') === 'en';
  const metaOnly = u.searchParams.get('meta') === '1';
  let t;
  try { t = new URL(target); } catch (e) { return json({ ok: false, error: 'bad_url' }, 200, origin, env); }
  if (!/^https?:$/.test(t.protocol) || t.port || pvBlockedHost(t.hostname) || target.length > 600)
    return json({ ok: false, error: 'blocked' }, 200, origin, env);

  const cache = caches.default;
  const key = new Request('https://pv.unsurfaced-intelligence.com/?u=' + encodeURIComponent(target) +
    '&en=' + (wantEn ? 1 : 0) + '&m=' + (metaOnly ? 1 : 0));
  const hit = await cache.match(key);
  if (hit) { try { return json(JSON.parse(await hit.text()), 200, origin, env); } catch (e) {} }

  let res;
  try {
    res = await fetch(t.href, { redirect: 'follow', headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; UnsurfacedPreview/1.0; +https://unsurfaced-intelligence.com)',
      'Accept': 'text/html,application/xhtml+xml' } });
  } catch (e) { return json({ ok: false, error: 'unreachable' }, 200, origin, env); }
  if (!res.ok || !/text\/html|xhtml/.test(res.headers.get('content-type') || ''))
    return json({ ok: false, error: 'not_html' }, 200, origin, env);
  const html = (await res.text()).slice(0, 600000);
  const ex = pvExtract(html, res.url || t.href);

  let payload;
  if (metaOnly) {
    payload = { ok: true, url: t.href, site: ex.site, title: ex.title, image: ex.image, lang: ex.lang };
  } else {
    let translated = false, title = ex.title, paragraphs = ex.paragraphs;
    const foreign = ex.lang && ex.lang !== 'en';
    if (wantEn && foreign && paragraphs.length) {
      const all = await pvTranslate(env, ex.lang, [title].concat(paragraphs));
      title = all[0]; paragraphs = all.slice(1); translated = true;
    }
    payload = { ok: true, url: t.href, site: ex.site, title, image: ex.image,
      lang: ex.lang, translated, paragraphs };
  }
  await cache.put(key, new Response(JSON.stringify(payload), { headers: {
    'content-type': 'application/json', 'Cache-Control': 'public, s-maxage=' + (payload.ok ? 21600 : 600) } }));
  return json(payload, 200, origin, env);
}

/* ═══════════════════════════════════════════════════════════════════
 * DAILY PIPELINE + SEAM:MODEL_POOL
 * Ingest (GDELT/HN) → cluster → synthesize (fabrication-guarded) →
 * publish today's edition. Cron-driven; also runnable via /daily/run.
 * ═══════════════════════════════════════════════════════════════════ */

// The beats DAILY covers each cycle — broad cultural-intelligence surface.
const DAILY_BEATS = [
  { beat: 'creativity',  q: 'creative industry design' },
  { beat: 'advertising', q: 'advertising brand campaign' },
  { beat: 'tech',        q: 'technology industry' },
  { beat: 'ai',          q: 'artificial intelligence' },
  { beat: 'culture',     q: 'culture trend internet' }
];

/* ═══ SEAM:DAILY_POV — doctrine as code. The Intelligence POV (July 2026)
 * in machine-readable form: territories, the tiered source registry, the
 * resist-list, the five-stage prompts, the momentum rubric, and the
 * 12-slot edition template. DAILY-02/03 consume this; STUDIO and EXCAVATE
 * read the same law. Registry note: a feed is a candidate until its first
 * successful capture — a dead feed must never kill the pipeline. ═══ */
const DAILY_POV = {
  version: 'pov-2026-07',
  territories: [
    'advertising-marketing','technology-innovation','artificial-intelligence',
    'business-economics','entrepreneurship-creator','music','fashion-beauty',
    'sneakers-streetwear','art-design','architecture-cities',
    'entertainment-gaming','food-hospitality','sustainability-impact','global-diaspora'
  ],
  // Legacy SLATE compatibility: every territory resolves to one of the five beats.
  beat_map: {
    'advertising-marketing':'advertising', 'technology-innovation':'tech',
    'artificial-intelligence':'ai', 'business-economics':'tech',
    'entrepreneurship-creator':'culture', 'music':'culture',
    'fashion-beauty':'culture', 'sneakers-streetwear':'culture',
    'art-design':'creativity', 'architecture-cities':'creativity',
    'entertainment-gaming':'culture', 'food-hospitality':'culture',
    'sustainability-impact':'culture', 'global-diaspora':'culture'
  },
  tiers: {
    1: { role: 'daily signal — original reporting, cross-category influence', cadence: 'daily' },
    2: { role: 'specialist interpretation — depth, criticism, region',        cadence: 'weekly' },
    3: { role: 'edge + weak signals — independents, communities, subculture', cadence: 'monitor' },
    4: { role: 'validation + primary evidence',                               cadence: 'on-demand' }
  },
  // verified:false = candidate feed; CAPTURE tolerates failure per-source.
  sources: [
    { name:'The Verge',          feed:'https://www.theverge.com/rss/index.xml',        tier:1, territories:['technology-innovation','artificial-intelligence'], verified:true },
    { name:'TechCrunch',         feed:'https://techcrunch.com/feed/',                  tier:1, territories:['technology-innovation','entrepreneurship-creator'], verified:true },
    { name:'Hypebeast',          feed:'https://hypebeast.com/feed',                    tier:1, territories:['sneakers-streetwear','fashion-beauty'], verified:true },
    { name:'Highsnobiety',       feed:'https://www.highsnobiety.com/feed/',            tier:1, territories:['fashion-beauty','sneakers-streetwear'], verified:false },
    { name:'Dezeen',             feed:'https://www.dezeen.com/feed/',                  tier:1, territories:['art-design','architecture-cities'], verified:true },
    { name:'ArchDaily',          feed:'https://www.archdaily.com/feed',                tier:1, territories:['architecture-cities'], verified:false },
    { name:'Pitchfork',          feed:'https://pitchfork.com/feed/feed-news/rss',      tier:1, territories:['music'], verified:true },
    { name:'Billboard',          feed:'https://www.billboard.com/feed/',               tier:1, territories:['music','entertainment-gaming'], verified:true },
    { name:'Eater',              feed:'https://www.eater.com/rss/index.xml',           tier:1, territories:['food-hospitality'], verified:true },
    { name:'Fast Company',       feed:'https://www.fastcompany.com/latest/rss',        tier:1, territories:['business-economics','advertising-marketing'], verified:false },
    { name:'Business of Fashion',feed:'https://www.businessoffashion.com/arc/outboundfeeds/rss/', tier:1, territories:['fashion-beauty','business-economics'], verified:false },
    { name:'Engadget',           feed:'https://www.engadget.com/rss.xml',              tier:2, territories:['technology-innovation'], verified:true },
    { name:"It's Nice That",     feed:'https://www.itsnicethat.com/feed',              tier:2, territories:['art-design','advertising-marketing'], verified:false },
    { name:'Core77',             feed:'https://feeds.feedburner.com/core77/blog',      tier:2, territories:['art-design'], verified:false },
    { name:'Colossal',           feed:'https://www.thisiscolossal.com/feed/',          tier:2, territories:['art-design'], verified:true },
    { name:'Dazed',              feed:'https://www.dazeddigital.com/rss',              tier:2, territories:['fashion-beauty','music','global-diaspora'], verified:true },
    { name:'Creative Boom',      feed:'https://www.creativeboom.com/feed/',            tier:2, territories:['art-design','advertising-marketing'], verified:true },
    { name:'Nice Kicks',         feed:'https://www.nicekicks.com/feed/',               tier:2, territories:['sneakers-streetwear'], verified:true },
    { name:'Wallpaper',          feed:'https://www.wallpaper.com/feeds/all',           tier:2, territories:['art-design','architecture-cities'], verified:false },
    { name:'Curbed',             feed:'https://www.curbed.com/rss/index.xml',          tier:2, territories:['architecture-cities'], verified:true },
    { name:'Hyperallergic',      feed:'https://hyperallergic.com/feed/',               tier:2, territories:['art-design'], verified:true },
    { name:'Rest of World',      feed:'https://restofworld.org/feed/latest/',          tier:2, territories:['global-diaspora','technology-innovation'], verified:true },
    { name:'Blackbird Spyplane', feed:'https://www.blackbirdspyplane.com/feed',        tier:3, territories:['fashion-beauty','sneakers-streetwear'], verified:true },
    { name:'Embedded',           feed:'https://embedded.substack.com/feed',            tier:3, territories:['entertainment-gaming','global-diaspora'], verified:true },
    { name:'Garbage Day',        feed:'https://www.garbageday.email/feed',             tier:3, territories:['entertainment-gaming','technology-innovation'], verified:false },
    { name:'Dirt',               feed:'https://dirt.fyi/feed',                         tier:3, territories:['entertainment-gaming','art-design'], verified:false },
    { name:'OkayAfrica',         feed:'https://www.okayafrica.com/feeds/feed.rss',     tier:3, territories:['global-diaspora','music'], verified:false },
    { name:'Link in Bio',        feed:'https://www.linkinbio.news/feed',               tier:3, territories:['advertising-marketing','entrepreneurship-creator'], verified:false }
  ],
  gdelt: { tier: 4, role: 'breadth sweep + validation; never sole evidence for a story' },
  resist: [
    { rule:'trend_laundering',   law:'one celebrity moment, campaign, show or viral post is not a movement — require a second independent appearance' },
    { rule:'source_echo',        law:'repeated coverage of one announcement is one signal — collapse via hash + embedding dedup' },
    { rule:'category_myopia',    law:'read every signal for its meaning outside its home industry' },
    { rule:'scale_bias',         law:'small communities can be influential before they are large — Tier-3 quota protects them' },
    { rule:'edge_fetish',        law:'not every niche scales — name the broader human need beneath it' },
    { rule:'tech_determinism',   law:'capability is not adoption — track use, resistance, consequence, uneven access' },
    { rule:'false_certainty',    law:'distinguish observed fact, editorial inference and emerging hypothesis — label inference' },
    { rule:'frictionless_optimism', law:'for every adoption signal scan for backlash, fatigue, barriers, unintended effects' }
  ],
  standard: [
    'selectivity_over_volume','meaning_over_novelty','connection_over_category',
    'evidence_over_hype','tension_over_generality','utility_over_performance'
  ],
  stages: {
    filter: 'You are the FILTER stage of a cultural-intelligence pipeline. Given one captured signal (title, summary, source), output ONLY JSON: {"territory": <one of the configured territories>, "novelty": <0-5, 0=routine 5=genuinely new behavior or condition>, "announcement": <true if routine PR/launch language with no behavioral evidence>, "note": <at most 12 words on what is actually new>}. No prose outside the JSON.',
    connect: 'Given a small set of signals from different territories, name the one pattern connecting them in at most 2 sentences — a behavior, tension or value appearing in multiple places at once. If no real connection exists, output exactly NONE. Never force it.',
    interpret: 'You write the take for Unsurfaced DAILY. 2-4 sentences. Move through the arc without naming its parts: the observable shift, the human tension underneath it, the new expectation forming, and the possibility it opens. Use only facts present in the evidence; if you infer, say so plainly. Declarative, specific, zero hype. The reader should finish smarter, not busier.',
    apply: 'One sentence: why this matters right now and what it could unlock. End with exactly one audience tag in brackets from: [creative] [founder] [marketer] [exec] [talent].'
  },
  momentum: {
    scale: '0-5 each',
    dims: ['novelty','velocity','breadth','depth','durability','relevance'],
    definitions: {
      novelty:'how new the underlying behavior or condition is',
      velocity:'how fast it is moving or accumulating',
      breadth:'how many territories/communities it appears in',
      depth:'strength and independence of the evidence',
      durability:'likelihood it matters beyond the news cycle',
      relevance:'usefulness to the DAILY audiences today'
    },
    note: 'confidence stays distinct from excitement'
  },
  edition: {
    slots: 12, lead: 1, features: 2, standard: 9,
    quotas: {
      per_territory_max: 2,
      min_territories: 8,
      edge_min: 1,                        // at least one Tier-3 story every day
      guaranteed_groups: [
        ['artificial-intelligence','technology-innovation'],
        ['business-economics','entrepreneurship-creator'],
        ['fashion-beauty','sneakers-streetwear'],
        ['art-design','architecture-cities'],
        ['music','entertainment-gaming'],
        ['food-hospitality','sustainability-impact','global-diaspora']
      ]
    },
    formats: ['dispatch','read','signal','number','drop','provocation'],
    format_min: { number: 1, signal: 1, provocation: 1 },
    features_prefer: 'read'
  }
};

/* GET /daily/pov — the public doctrine. Front-end, STUDIO and EXCAVATE
 * read the same law the pipeline runs on. */
function dailyPovPublic(origin, env) {
  return json({ ok: true, pov: DAILY_POV }, 200, origin, env);
}

/* SEAM:MODEL_POOL — the single routing function every LLM call passes through.
 * Tiers: t1/t2 = bulk transform on PUBLIC data; t3 = final voice.
 * Today all tiers resolve to Workers AI (env.AI). When OpenRouter is wired,
 * t1/t2 route to free models here — the call sites never change.
 * `sensitive:true` payloads are FORBIDDEN from free/training-eligible models;
 * they pin to t3 regardless of requested tier. */
async function callModel(env, tier, messages, opts) {
  opts = opts || {};
  // Guard: sensitive content never rides a bulk/free tier.
  const t = opts.sensitive ? 't3' : tier;
  // Current resolution: all tiers → Workers AI. (OpenRouter free pool attaches here.)
  const model = CONFIG.TEXT_MODEL;
  const out = await env.AI.run(model, {
    messages,
    max_tokens: opts.max_tokens || CONFIG.MAX_TOKENS
  });
  return out.response || '';
}

async function editionToday(env, origin) {
  try {
    const eds = await sbRest(env, "editions?status=eq.published&order=date.desc&limit=1");
    const ed = eds && eds[0];
    if (!ed) return json({ edition: null, items: [] }, 200, origin, env);
    const items = await sbRest(env, `edition_items?edition_id=eq.${ed.id}&order=ord.asc`);
    return json({
      edition: { issue_no: ed.issue_no, date: ed.date, headline: ed.headline || '' },
      items: items || []
    }, 200, origin, env);
  } catch (e) {
    return json({ edition: null, items: [], error: 'unavailable' }, 200, origin, env);
  }
}

/* SEAM:ARCHIVE — the back-issue shelf. Every published edition stays
 * readable forever: a public index (issue, date, lead headline) and a
 * public by-issue reader in the exact shape /api/edition/today serves,
 * so the front page renders any day in history with the same code.
 * Published-only — drafts never leak. */
async function editionArchive(env, origin) {
  try {
    const eds = await sbRest(env, 'editions?status=eq.published&order=date.desc&limit=90&select=id,issue_no,date');
    if (!eds || !eds.length) return json({ ok: true, issues: [] }, 200, origin, env);
    const ids = eds.map(e => e.id).join(',');
    const leads = await sbRest(env, `edition_items?edition_id=in.(${ids})&ord=eq.0&select=edition_id,headline`);
    const byId = {};
    (leads || []).forEach(l => { byId[l.edition_id] = l.headline; });
    return json({ ok: true, issues: eds.map(e => ({
      issue_no: e.issue_no, date: e.date, lead: byId[e.id] || '' })) }, 200, origin, env);
  } catch (e) { return json({ ok: true, issues: [] }, 200, origin, env); }
}
async function editionByIssue(url, env, origin) {
  try {
    const n = parseInt(url.searchParams.get('issue'), 10);
    if (!n) return json({ edition: null, items: [], error: 'bad_issue' }, 200, origin, env);
    const eds = await sbRest(env, `editions?issue_no=eq.${n}&status=eq.published&limit=1`);
    const ed = eds && eds[0];
    if (!ed) return json({ edition: null, items: [] }, 200, origin, env);
    const items = await sbRest(env, `edition_items?edition_id=eq.${ed.id}&order=ord.asc`);
    return json({ edition: { issue_no: ed.issue_no, date: ed.date, headline: ed.headline || '' },
      items: items || [] }, 200, origin, env);
  } catch (e) { return json({ edition: null, items: [], error: 'unavailable' }, 200, origin, env); }
}

// Manual trigger (admin only) — same pipeline the cron runs, for on-demand builds.
async function dailyRunGuarded(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user || !(await callerIsAdmin(env, user.id)))
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const force = new URL(request.url).searchParams.get('force') === '1';
  const result = await runDailyPipeline(env, { force });
  return json({ ok: true, ...result }, 200, origin, env);
}

async function runDailyPipeline(env, opts) {
  const force = !!(opts && opts.force);
  const today = new Date().toISOString().slice(0, 10);

  // Idempotency: if today is already published, do nothing.
  const existing = await sbRest(env, `editions?date=eq.${today}&select=id,status`);
  if (existing && existing[0] && existing[0].status === 'published' && !force) {
    return { skipped: 'already_published', date: today };
  }

  // 1. INGEST — gather public signal across beats (reuses gatherServerSignals).
  const raw = [];
  for (const lane of DAILY_BEATS) {
    const sig = await gatherServerSignals(lane.q);
    sig.forEach(s => raw.push({ ...s, beat: lane.beat }));
  }
  if (!raw.length) return { error: 'no_signal', date: today };

  // 2. CLUSTER/DEDUP — collapse near-duplicate titles; keep the strongest per beat.
  const seen = new Set();
  const deduped = [];
  for (const s of raw) {
    const key = (s.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }
  // Prefer news, cap the working set so synthesis stays focused.
  const working = deduped
    .sort((a, b) => (a.signalType === 'news' ? -1 : 1) - (b.signalType === 'news' ? -1 : 1))
    .slice(0, 24);

  // 3. SYNTHESIZE — interpretive items with a hard fabrication guard.
  //    PUBLIC data only → t2 tier is allowed. Provenance copied verbatim.
  const evidence = working.map((c, i) =>
    `[${i + 1}] (${c.beat}) ${String(c.title || '').slice(0, 180)} ` +
    `{source:${String(c.source || '').slice(0, 80)}|url:${String(c.url || '').slice(0, 200)}}`
  ).join('\n');

  const sys = 'You are the editor of Unsurfaced Daily, a cultural-intelligence brief. You do not summarize the news — ' +
    'you INTERPRET it: why now, who benefits, what the second-order effect is. From the numbered evidence, select the ' +
    '6 most significant stories across different beats. For each, write a sharp interpretive take. Ground every item in ' +
    'the evidence — never invent facts, sources, or URLs. Copy each item\'s source_name and source_url VERBATIM from the ' +
    'evidence item you used. Output STRICT JSON only, no markdown fences, no prose outside the JSON.';

  const usr = `DATE: ${today}\n\nEVIDENCE:\n${evidence}\n\n` +
    'Return JSON exactly shaped as:\n' +
    '{"lead_headline":"<the day\'s single most important line, <=12 words>",' +
    '"items":[{"kicker":"<2-4 word beat label, uppercase>","headline":"<=12-word headline",' +
    '"standfirst":"<=20-word framing line","take":"2-3 sentences of interpretation: why now, who benefits, ' +
    'what\'s the second-order effect","source_name":"copied verbatim from evidence","source_url":"copied verbatim from evidence"}]}\n' +
    'Exactly 6 items across distinct beats. JSON only.';

  let parsed = null;
  try {
    const resp = await callModel(env, 't2', [
      { role: 'system', content: sys }, { role: 'user', content: usr }
    ], { max_tokens: 2000 });
    parsed = extractJson(resp);
  } catch (e) { /* fall through */ }

  if (!parsed || !Array.isArray(parsed.items) || !parsed.items.length) {
    return { error: 'synthesis_failed', date: today };
  }

  // 4. FABRICATION GUARD — keep only items whose source_url actually appears in evidence.
  const evidenceUrls = new Set(working.map(w => (w.url || '').trim()).filter(Boolean));
  const clean = parsed.items
    .filter(it => it && it.headline && it.take)
    .map(it => ({
      kicker: String(it.kicker || 'THE SIGNAL').slice(0, 40),
      headline: String(it.headline).slice(0, 200),
      standfirst: String(it.standfirst || '').slice(0, 240),
      take: String(it.take).slice(0, 800),
      source_name: String(it.source_name || '').slice(0, 120),
      source_url: /^https?:\/\//.test(String(it.source_url || '')) &&
                  evidenceUrls.has(String(it.source_url).trim()) ? it.source_url : null
    }))
    .slice(0, 6);

  if (!clean.length) return { error: 'all_items_failed_guard', date: today };

  // 4b. VISUAL + LANGUAGE CARRY-THROUGH — joined back to the ingest signal by
  // source_url, never generated. If the guard nulled the URL, nothing attaches.
  const sigByUrl = new Map(working.filter(w => w.url).map(w => [String(w.url).trim(), w]));
  const enriched = clean.map(it => {
    const sig = it.source_url ? sigByUrl.get(String(it.source_url).trim()) : null;
    const img = sig && /^https?:\/\//.test(String(sig.image || '')) ? String(sig.image).slice(0, 500) : null;
    const lng = sig && sig.lang ? String(sig.lang).slice(0, 40).toLowerCase() : null;
    return { ...it, image_url: img, lang: lng, beat: (sig && sig.beat) || 'culture' };
  });

  // 5. PUBLISH — create/reuse today's edition row, replace its items, mark published.
  let edId, issueNo;
  if (existing && existing[0]) {
    edId = existing[0].id;
    const meta = await sbRest(env, `editions?id=eq.${edId}&select=issue_no`);
    issueNo = meta && meta[0] ? meta[0].issue_no : 1;
    await sbRest(env, `edition_items?edition_id=eq.${edId}`, { method: 'DELETE' });
  } else {
    const noRows = await sbRest(env, 'rpc/next_issue_no', { method: 'POST', body: {} });
    issueNo = (typeof noRows === 'number') ? noRows : (noRows || 1);
    const created = await sbRest(env, 'editions', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: { issue_no: issueNo, date: today, status: 'building', headline: parsed.lead_headline || null }
    });
    edId = created[0].id;
  }

  await sbRest(env, 'edition_items', {
    method: 'POST',
    body: enriched.map((it, i) => ({ edition_id: edId, ord: i, ...it }))
  });

  await sbRest(env, `editions?id=eq.${edId}`, {
    method: 'PATCH',
    body: { status: 'published', headline: parsed.lead_headline || null, published_at: new Date().toISOString() }
  });

  logEvent(env, 'daily', null, 'edition_published', null, { issue_no: issueNo, items: clean.length });
  await buildStudioManifest(env, today, issueNo, enriched).catch(() => {});
  return { ok: true, date: today, issue_no: issueNo, items: clean.length };
}
