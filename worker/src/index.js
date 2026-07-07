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

      // Everything below requires a signed-in user
      const user = await authenticate(request, env);
      if (!user) return json({ ok: false, error: 'unauthorized' }, 401, origin, env);
      const _aiPath = path.startsWith('/play') || path.startsWith('/excavate') || path === '/mine/synthesize' || path === '/mine/ask';
      if (_aiPath && !(await underLimit(env, user.id))) return json({ ok: false, error: 'rate_limited' }, 429, origin, env);

      const body = request.method === 'POST' ? await safeJson(request) : {};
      switch (path) {
        case '/play/generate':       return playGenerate(body, env, origin);
        case '/play/generate-image': return playImage(body, env, origin, user);
        case '/excavate/synthesize': return synthesize(body, env, origin);
        case '/mine/synthesize':     return mineSynthesize(body, env, origin);
        case '/mine/ask':            return mineAsk(body, env, origin);
        case '/mine/upload':         return mineUpload(request, env, origin, user);
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
        url: a.url || ''
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
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`
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
