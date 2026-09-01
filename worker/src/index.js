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
  RENDER_DAILY_SECONDS: 120, // SEAM:PLAY_RENDER \u2014 fal render seconds per user per day (an image counts as its pool's sec weight)
};

const PLAY_SYSTEM = {
  default:  'You are a sharp brand-creative collaborator. Be vivid, specific, and useful. No preamble.',
  headline: 'You write punchy brand headlines. Return 5 numbered options, nothing else.',
  concept:  'You develop campaign concepts. Give a concept name and a two-sentence pitch.',
  naming:   'You generate brand/product name candidates. Return 8 options with a one-line rationale each.',
  'engine-concept': 'You are the PLAY creative engine for Unsurfaced. Develop exactly the creative direction the brief asks for. Declarative and specific. No em dashes. No hedging. No agency-speak.',
  'engine-units':   'You are the PLAY creative engine for Unsurfaced. Break the approved creative direction into concrete production units exactly as instructed. Follow the requested JSON shape precisely. No commentary.',
  'engine-compile': 'You are the PLAY creative engine for Unsurfaced, acting as a senior art director writing generation-ready prompts: subject, composition, lens, light, palette, texture. Never use quality-bait words like 8k, stunning, masterpiece, or cinematic as an adjective. No em dashes. Follow the requested JSON shape precisely.',
};

export default {
  async scheduled(event, env, ctx) {
    // Three crons, one worker: 05:15 capture · every 30' drain · 06:00 compose.
    const cron = String(event && event.cron || '');
    if (cron === '15 5 * * *') {
      ctx.waitUntil(runDailySpine(env)
        .then(s => console.log('spine_capture', JSON.stringify(s)))
        .catch(e => console.log('spine_capture_error', String(e && e.message))));
    } else if (cron === '0 6 * * *') {
      // .then after .catch, not .finally: the catch resolves, so the watchdog
      // runs whether compose succeeded, threw, or quietly produced nothing —
      // and waitUntil still covers the returned chain.
      ctx.waitUntil(runDailyPipeline(env)
        .then(s => console.log('daily_pipeline', JSON.stringify(s)))
        .catch(e => console.log('daily_pipeline_error', String(e && e.message)))
        .then(() => editionWatchdog(env)));
    } else {
      // advance:42 runs the full spine incl. CONNECT at 34 external subrequests
      // (free cap 50). NOTE: `calls` counts sbRest AND env.AI.run alike, but only
      // sbRest is an *external* subrequest; env.AI.run is a Cloudflare service
      // binding on the separate 1000 ceiling. 26 was sized as if AI calls spent
      // the scarce budget — they never did, and CONNECT starved for five calls
      // that did not exist. 46/50 return identical work: 42 is saturation.
      ctx.waitUntil(runDailySpine(env, { feeds: 6, gdelt: 1, advance: 42 })
        .then(s => console.log('spine_slice', JSON.stringify(s)))
        .catch(e => console.log('spine_slice_error', String(e && e.message))));
    }
  },
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return preflight(origin, env);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // Public
      if (path === '/' || path === '/health') return json({ ok: true, service: 'unsurfaced-api' }, 200, origin, env);
      if ((request.method === 'GET' || request.method === 'HEAD') && path.startsWith('/media/')) return serveMedia(path, env, origin, request);
      if (path === '/stripe/webhook' && request.method === 'POST') return stripeWebhook(request, env, origin);
      if (path.startsWith('/arcade/') && !path.startsWith('/arcade/admin/')) return arcadeRouter(path, request, env, origin);
      if (path === '/api/edition/today') return editionToday(env, origin);
      if (path === '/api/edition/archive') return editionArchive(env, origin);
      if (path === '/api/edition') return editionByIssue(url, env, origin);
      if (path === '/daily/run' && request.method === 'POST') return dailyRunGuarded(request, env, origin);
      if (path === '/daily/pov' && request.method === 'GET') return dailyPovPublic(origin, env);
      if (path === '/daily/lake' && request.method === 'GET') return dailyLakePublic(env, origin);
      if (path === '/daily/spine' && request.method === 'POST') return dailySpineGuarded(request, env, origin);
      if (path === '/daily/health' && request.method === 'GET') return dailyHealthGuarded(request, env, origin);
      if (path === '/excavate/lake' && request.method === 'POST') return excavateLake(request, env, origin);
      if (path === '/deep' && request.method === 'POST') return deepSearch(request, env, origin);
      if (path === '/excavate/brand-signal' && request.method === 'POST') return brandSignal(request, env, origin);
      if (path === '/mine/publish-signal' && request.method === 'POST') return minePublishSignal(request, env, origin);
      if (path === '/excavate/cluster' && request.method === 'POST') return excavateCluster(request, env, origin);
      if (path === '/excavate/recurrence' && request.method === 'POST') return excavateRecurrence(request, env, origin);
      if (path === '/excavate/promote' && request.method === 'POST') return excavatePromote(request, env, origin);
      if (path === '/excavate/propose' && request.method === 'POST') return excavatePropose(request, env, origin);
      if (path === '/excavate/voice' && request.method === 'POST') return excavateVoice(request, env, origin);
      if (path === '/excavate/anchors' && request.method === 'POST') return excavateAnchors(request, env, origin);
      if (path === '/preview' && request.method === 'GET') return previewRoute(request, env, origin);
      if (path === '/mine/studies' && request.method === 'GET') return mineStudiesPublic(env, origin);
      if (path === '/mine/study' && request.method === 'GET') return mineStudyPublic(url, env, origin);
      if (path.startsWith('/s/') && request.method === 'GET') return mineSharePage(path, env);
      if (path === '/mine/respond' && request.method === 'POST') return mineGuestRespond(request, env, origin);
      if (path === '/beacon' && request.method === 'POST') return beaconTrack(request, env, origin);
      if (path === '/mine/t' && request.method === 'GET') return mineTokenStudy(url, env, origin);
      if (path === '/mine/t/respond' && request.method === 'POST') return mineTokenRespond(request, env, origin);

      // Everything below requires a signed-in user
      const user = await authenticate(request, env);
      if (!user) return json({ ok: false, error: 'unauthorized' }, 401, origin, env);
      const _aiPath = path.startsWith('/play') || path.startsWith('/excavate') || path === '/mine/synthesize' || path === '/mine/ask';
      if (_aiPath && !(await underLimit(env, user.id))) return json({ ok: false, error: 'rate_limited' }, 429, origin, env);

      if (request.method === 'GET' && path.startsWith('/play/render/'))
        return playRenderStatus(decodeURIComponent(path.slice('/play/render/'.length)), env, origin, user);

      const body = (request.method === 'POST' && path !== '/mine/upload' && path !== '/knowledge/file' && path !== '/studio/archive' && path !== '/arcade/admin/prize-obj' && path !== '/play/upload-ref') ? await safeJson(request) : {};
      switch (path) {
        case '/play/generate':       return playGenerate(body, env, origin);
        case '/play/generate-image': return playImage(body, env, origin, user);
        case '/play/render':         return playRender(body, env, origin, user);
        case '/play/upload-ref':     return playUploadRef(request, env, origin, user);
        case '/excavate/synthesize': return synthesize(body, env, origin);
        case '/mine/notify':        return mineNotify(body, env, origin, user);
        case '/mine/invites':       return mineInvites(body, env, origin, user);
        case '/mine/client-access': return mineClientAccess(body, env, origin, user);
        case '/mine/client-results': return mineClientResults(body, env, origin, user);
        case '/mine/client-studies': return mineClientStudies(env, origin, user);
        case '/mine/lake-sync':     return mineLakeSync(body, env, origin, user);
        case '/mine/synthesize':     return mineSynthesize(body, env, origin);
        case '/mine/ask':            return mineAsk(body, env, origin);
        case '/mine/upload':         return mineUpload(request, env, origin, user);
        case '/whoami':             return kbWhoami(env, origin, user);
        case '/studio/manifest':     return studioManifest(body, env, origin, user);
        case '/studio/generate':     return studioGenerate(env, origin, user);
        case '/studio/cut-story':    return studioCutStory(body, env, origin, user);
        case '/studio/update':       return studioUpdate(body, env, origin, user);
        case '/studio/kill':         return studioKill(body, env, origin, user);
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
        case '/mine/ensure-slug':    return mineEnsureSlug(body, env, origin, user);
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
  const prompt = String(body.prompt || '').slice(0, 6000);
  if (!prompt) return json({ ok: false, error: 'prompt_required' }, 400, origin, env);
  const engine = String(body.kind || '').indexOf('engine') === 0;
  const wantJson = body.format === 'json';
  const sys = (PLAY_SYSTEM[body.kind] || PLAY_SYSTEM.default)
    + (wantJson ? ' Output STRICT JSON only. No markdown fences, no prose outside the JSON.' : '');
  const req = {
    messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }],
    max_tokens: engine ? 1800 : CONFIG.MAX_TOKENS
  };
  if (wantJson) req.temperature = 0.15; // cold decode for structured output
  const out = await env.AI.run(CONFIG.TEXT_MODEL, req);
  // Workers AI may return `response` as a STRING or, when the model emits pure
  // JSON, as an already-parsed object/array. Honor both shapes; never let a
  // live object be stringified into '[object Object]' on its way to the parser.
  const raw = out && out.response;
  const text = typeof raw === 'string' ? raw : (raw != null ? JSON.stringify(raw) : '');
  if (wantJson) {
    const parsed = (raw !== null && typeof raw === 'object') ? raw : extractJson(text);
    if (!parsed) return json({ ok: false, error: 'bad_model_json', detail: String(text).slice(0, 200) }, 502, origin, env);
    return json({ ok: true, data: { json: parsed, text } }, 200, origin, env);
  }
  return json({ ok: true, data: { text } }, 200, origin, env);
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

/* SEAM:PLAY_RENDER \u2014 fal.ai render rail.
 * Queue API: POST https://queue.fal.run/{model-id} with `Authorization: Key FAL_KEY`
 *   \u2192 { request_id, status_url, response_url, cancel_url }. Poll status_url;
 * on COMPLETED fetch response_url and land the asset in R2 (MEDIA) immediately \u2014
 * Unsurfaced owns the file, fal CDN retention is not ours.
 * Two-speed law: draft pools are the default; final is always an explicit press.
 * Model ids are swapped HERE only. flux/schnell + seedance-2.0/fast verified in
 * the fal catalog at cut time; confirm the *.final ids in your fal dashboard
 * before the first final render (a wrong id fails loud with fal_404, spends $0).
 * Requires: `npx wrangler secret put FAL_KEY` + hard spend cap in fal dashboard. */
const RENDER_POOL = {
  'image.draft': { id: 'fal-ai/flux/schnell',   ref: 'fal-ai/flux-2/turbo/edit', kind: 'image', sec: 2 },
  'image.final': { id: 'fal-ai/flux-pro/v1.1',  ref: 'fal-ai/flux-2-pro/edit',   kind: 'image', sec: 6 }, // swap base to FLUX.2 [pro] id from dashboard when ready
  'video.draft': { id: 'bytedance/seedance-2.0/fast/text-to-video', i2v: 'bytedance/seedance-2.0/fast/image-to-video', kind: 'video' },
  'video.final': { id: 'fal-ai/kling-video/v3/standard/text-to-video', i2v: 'fal-ai/kling-video/v3/standard/image-to-video', kind: 'video' } // VERIFY id in dashboard before first use
};
const RENDER_ASPECTS = { '16:9': 'landscape_16_9', '9:16': 'portrait_16_9', '1:1': 'square_hd', '4:5': 'portrait_4_3', '3:4': 'portrait_4_3', '4:3': 'landscape_4_3' };

async function renderBudget(env, userId, seconds) {
  if (!env.RATE_LIMIT) return true; // no KV bound \u2192 skip (configure for production)
  const day = new Date().toISOString().slice(0, 10);
  const key = `fal:${userId}:${day}`;
  const cur = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (cur + seconds > CONFIG.RENDER_DAILY_SECONDS) return false;
  await env.RATE_LIMIT.put(key, String(cur + seconds), { expirationTtl: 60 * 60 * 26 });
  return true;
}

/* POST /play/render { pool, prompt, aspect?, seconds?, image_url?, project?, unit? }
 *   \u2192 { ok, request_id }   (429 render_budget when the daily seconds cap is spent) */
async function playRender(body, env, origin, user) {
  if (!env.FAL_KEY) return json({ ok: false, error: 'render_unconfigured' }, 503, origin, env);
  const pool = RENDER_POOL[String(body.pool || '')];
  const prompt = String(body.prompt || '').slice(0, 2500);
  if (!pool || !prompt) return json({ ok: false, error: 'bad_request' }, 400, origin, env);
  const seconds = pool.kind === 'video'
    ? Math.min(Math.max(parseInt(body.seconds, 10) || 4, 2), 10)
    : pool.sec;
  if (!(await renderBudget(env, user.id, seconds))) return json({ ok: false, error: 'render_budget' }, 429, origin, env);
  const imageUrl = /^https:\/\//.test(String(body.image_url || '')) ? String(body.image_url).slice(0, 600) : '';
  /* SEAM:PLAY_REF \u2014 reference-guided generation. An image_url on an IMAGE
   * pool routes to the pool's FLUX.2 edit endpoint (image_urls array), so the
   * actual product conditions the frame instead of the model guessing from
   * words. On VIDEO pools image_url stays the i2v start frame \u2014 an uploaded
   * reference can drive motion directly. Text-only renders are untouched. */
  const model = imageUrl ? ((pool.kind === 'video' && pool.i2v) ? pool.i2v : (pool.ref || pool.id)) : pool.id;
  const input = { prompt };
  if (pool.kind === 'video') {
    input.duration = seconds;
    input.resolution = '720p';
    input.aspect_ratio = RENDER_ASPECTS[body.aspect] ? String(body.aspect) : '16:9';
    if (imageUrl) input.image_url = imageUrl; // keyframe-first chain or direct reference drive
  } else if (imageUrl && pool.ref) {
    input.image_urls = [imageUrl];
    input.image_size = RENDER_ASPECTS[body.aspect] || 'landscape_16_9';
  } else {
    input.image_size = RENDER_ASPECTS[body.aspect] || 'landscape_16_9';
  }
  const r = await fetch('https://queue.fal.run/' + model, {
    method: 'POST',
    headers: { Authorization: 'Key ' + env.FAL_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || !j.request_id)
    return json({ ok: false, error: 'fal_' + r.status, detail: String((j && (j.detail || j.message)) || '').slice(0, 300) }, 502, origin, env);
  const project = String(body.project || 'engine').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60) || 'engine';
  const rec = { model, kind: pool.kind, status_url: j.status_url, response_url: j.response_url,
    user: user.id, project, unit: String(body.unit || '').slice(0, 40), at: Date.now() };
  if (env.RATE_LIMIT) await env.RATE_LIMIT.put('rr:' + j.request_id, JSON.stringify(rec), { expirationTtl: 259200 });
  await logEvent(env, 'play', null, 'render_submit', null, { pool: String(body.pool), model });
  return json({ ok: true, request_id: j.request_id }, 200, origin, env);
}

/* GET /play/render/:request_id \u2192 { ok, status: running|done|failed, asset?, queue? }
 * On first COMPLETED poll the asset is streamed into R2 and served from /media/. */
async function playRenderStatus(reqId, env, origin, user) {
  if (!env.FAL_KEY) return json({ ok: false, error: 'render_unconfigured' }, 503, origin, env);
  if (!/^[A-Za-z0-9-]{8,80}$/.test(reqId)) return json({ ok: false, error: 'bad_request' }, 400, origin, env);
  const raw = env.RATE_LIMIT ? await env.RATE_LIMIT.get('rr:' + reqId) : null;
  let rec = null;
  try { rec = raw ? JSON.parse(raw) : null; } catch (e) { rec = null; }
  if (!rec || rec.user !== user.id) return json({ ok: false, error: 'not_found' }, 404, origin, env);
  if (rec.asset) return json({ ok: true, status: 'done', asset: rec.asset }, 200, origin, env);
  const hdr = { Authorization: 'Key ' + env.FAL_KEY };
  const st = await fetch(rec.status_url, { headers: hdr }).then(x => x.json()).catch(() => null);
  const status = (st && st.status) || 'UNKNOWN';
  if (status !== 'COMPLETED') {
    const failed = /FAILED|ERROR|CANCEL/i.test(status);
    return json({ ok: true, status: failed ? 'failed' : 'running', queue: st && st.queue_position }, 200, origin, env);
  }
  const out = await fetch(rec.response_url, { headers: hdr }).then(x => x.json()).catch(() => null);
  const url = (out && ((out.images && out.images[0] && out.images[0].url)
    || (out.video && out.video.url) || (out.image && out.image.url) || out.url)) || '';
  if (!url) return json({ ok: true, status: 'failed' }, 200, origin, env);
  const ext = rec.kind === 'video' ? 'mp4' : 'jpg';
  const key = `play/${user.id}/${rec.project}/${reqId}.${ext}`;
  let asset = url;
  if (env.MEDIA) {
    const a = await fetch(url);
    if (a.ok) {
      await env.MEDIA.put(key, a.body, { httpMetadata: { contentType: rec.kind === 'video' ? 'video/mp4' : 'image/jpeg' } });
      asset = '/media/' + key;
    }
  }
  rec.asset = asset;
  if (env.RATE_LIMIT) await env.RATE_LIMIT.put('rr:' + reqId, JSON.stringify(rec), { expirationTtl: 259200 });
  await logEvent(env, 'play', null, 'render_done', null, { model: rec.model, kind: rec.kind });
  return json({ ok: true, status: 'done', asset }, 200, origin, env);
}

/* SEAM:PLAY_REF \u2014 POST /play/upload-ref (raw image body)
 * Headers: Content-Type image/jpeg|png|webp. Cap 8MB. Lands in R2 at
 * play/{user}/refs/ and returns the public /media/ URL that fal can fetch.
 * No fal spend; not budget-metered. Photos only in v1 \u2014 video references
 * ride a later cut (motion-reference models take different inputs). */
async function playUploadRef(request, env, origin, user) {
  if (!env.MEDIA) return json({ ok: false, error: 'media_unconfigured' }, 503, origin, env);
  const ctype = String(request.headers.get('Content-Type') || '').toLowerCase();
  const ext = ctype === 'image/jpeg' ? 'jpg' : ctype === 'image/png' ? 'png' : ctype === 'image/webp' ? 'webp' : '';
  if (!ext) return json({ ok: false, error: 'unsupported_type' }, 415, origin, env);
  const buf = await request.arrayBuffer();
  if (!buf || !buf.byteLength) return json({ ok: false, error: 'empty' }, 400, origin, env);
  if (buf.byteLength > 8 * 1024 * 1024) return json({ ok: false, error: 'too_large' }, 413, origin, env);
  const key = `play/${user.id}/refs/${Date.now()}.${ext}`;
  await env.MEDIA.put(key, buf, { httpMetadata: { contentType: ctype } });
  await logEvent(env, 'play', null, 'ref_uploaded', null, { bytes: buf.byteLength, type: ctype });
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

    /* SEAM:INSIGHT_COMPILER — report mode adds the house shape. The two-liner
     * law is Unsurfaced's own: line one reframes what the evidence actually
     * says, line two is the move it implies. "implication" is the sentence
     * that separates intelligence from retrieval — every finding must answer
     * "so what does a brand DO about this". */
    const isReport = body.mode === 'report';
    const usr = `Topic: "${query}"\n\nEVIDENCE:\n${evidence}\n\n` +
      'Return JSON exactly shaped as:\n' +
      '{' + (isReport ? '"read":["line 1: one sharp sentence reframing what the evidence actually shows",' +
      '"line 2: one sentence naming the move it implies"],' : '') +
      '"insights":[{"category":"consumer|market|culture|brand","title":"<=9-word claim",' +
      '"excerpt":"1-2 sentence finding grounded in the evidence",' +
      (isReport ? '"implication":"1 sentence: what this means for a brand decision",' : '') +
      '"source":"copied from evidence",' +
      '"sourceUrl":"copied from evidence"}],' +
      '"ideas":[{"type":"Positioning|Product|Campaign|Content|Partnership","headline":"<=9 words",' +
      '"body":"1-2 sentence recommendation tied to the insights"}],' +
      '"brief":"3-4 sentence executive read of where the conversation actually is and what to do about it"}\n' +
      (isReport ? 'Never restate source counts or citation totals as findings — say what the evidence MEANS. ' +
      'If evidence items disagree, make one insight name the disagreement plainly. ' : '') +
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
    // Earned confidence: density of corroborating evidence in the insight's
    // own category. Never hardcoded, never the model's opinion of itself.
    const catDensity = {};
    for (const c of merged) {
      const k = ['consumer', 'market', 'culture', 'brand'].includes(c.lens) ? c.lens : 'consumer';
      catDensity[k] = (catDensity[k] || 0) + 1;
    }
    const earned = (cat2) => (catDensity[cat2] || 0) >= 3 ? 'High' : (catDensity[cat2] || 0) === 2 ? 'Medium' : 'Low';
    const insights = parsed.insights.slice(0, 8).map(x => ({
      category: ['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer',
      title: String(x.title || '').slice(0, 120),
      excerpt: String(x.excerpt || '').slice(0, 400),
      implication: String(x.implication || '').slice(0, 300) || null,
      confidence: earned(['consumer', 'market', 'culture', 'brand'].includes(x.category) ? x.category : 'consumer'),
      source: String(x.source || '').slice(0, 120),
      sourceUrl: /^https?:\/\//.test(String(x.sourceUrl || '')) ? x.sourceUrl : null
    })).filter(x => x.title);
    const read = (Array.isArray(parsed.read) ? parsed.read : []).slice(0, 2)
      .map(x => String(x || '').slice(0, 220)).filter(Boolean);
    const ideas = (Array.isArray(parsed.ideas) ? parsed.ideas : []).slice(0, 6).map(x => ({
      type: String(x.type || 'Strategy').slice(0, 40),
      headline: String(x.headline || '').slice(0, 120),
      body: String(x.body || '').slice(0, 400)
    })).filter(x => x.headline);
    const brief = String(parsed.brief || '').slice(0, 1200);
    return json({ ok: true, data: { insights, ideas, brief, read: read.length === 2 ? read : null,
      evidence_n: merged.length, signals: added, connectors: serverConnectors(added) } }, 200, origin, env);
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

// Robust JSON extraction from an LLM reply. One harvester for the whole
// worker: EXCAVATE objects and the PLAY engine's unit/prompt arrays both pass
// through here (SEAM:PLAY_RENDER). Fences are stripped GLOBALLY (models often
// preface the fence with prose, so anchored stripping misses it), and every
// failed parse gets one repair pass: trailing commas removed, curly quotes
// straightened. Strict parse is always attempted first; repair never runs on
// text that already parses, so well-formed replies are untouched.
function jsonRepair(t) {
  return t
    .replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');
}
function tryParse(t) {
  try { return JSON.parse(t); } catch (e) {}
  try { return JSON.parse(jsonRepair(t)); } catch (e) {}
  return null;
}
function extractJson(s) {
  if (!s) return null;
  const t = String(s).replace(/```(?:json)?/gi, '').trim();
  let out = tryParse(t);
  if (out !== null) return out;
  // Slice by whichever opener comes FIRST: an array wrapped in prose must not
  // have its first element harvested as if the payload were that one object.
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  const c = t.indexOf('['), d = t.lastIndexOf(']');
  const objFirst = a >= 0 && (c < 0 || a < c);
  const tries = objFirst
    ? [[a, b], [c, d]]
    : [[c, d], [a, b]];
  for (let i = 0; i < tries.length; i++) {
    const lo = tries[i][0], hi = tries[i][1];
    if (lo >= 0 && hi > lo) { out = tryParse(t.slice(lo, hi + 1)); if (out !== null) return out; }
  }
  return null;
}

// Server-side connectors — fetched by the Worker itself (keyless, and not subject
// to browser CORS, so they enrich the corpus with sources the client can't reach).
async function gatherServerSignals(q) {
  const out = [];
  // sourcelang:english is GDELT's own documented query filter and it runs on
  // their side, so it does not depend on the casing of a.language in the
  // response - a field this function has always collected into s.lang and
  // which nothing ever read, which is how a Chinese headline off 163.com led
  // Issue 003 of an English paper. Filtering here covers all three callers at
  // once: the spine, the legacy fallback, and synthesize() - which was feeding
  // untranslated articles to the model as evidence. HN is English by
  // construction and unaffected. Translation is a feature we do not have;
  // until we do, the wire is English.
  const term = String(q || '').slice(0, 200).trim();
  if (!term) return out;
  const enc = encodeURIComponent(term + ' sourcelang:english');
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
/* ═══ SEAM:CLICKPATH — behavior beside stated response ═══════════════════
 * CLICK_BEACON is appended to every served HTML stimulus (append, never
 * html.replace('</body>') — the injection law). It captures clicks at the
 * document level — label, href, position, ms since open — and posts them to
 * the parent via postMessage, the one channel a sandboxed opaque-origin frame
 * has. Appending at document end is deliberate: the DOM exists by then and
 * document-level listeners need no placement. Cap 200 events; the beacon
 * never throws into the client's page. */
const CLICK_BEACON = '<script>(function(){try{var t0=Date.now(),n=0;'
  + 'function lbl(el){var e=(el&&el.closest)?(el.closest("a,button,[role=button],input,select,textarea,[onclick]")||el):el;'
  + 'var s=String(e.innerText||e.value||e.getAttribute("aria-label")||e.title||e.tagName||"").trim().replace(/\\s+/g," ").slice(0,40);'
  + 'return s||String(e.tagName||"?");}'
  + 'document.addEventListener("click",function(ev){if(n>=200)return;n++;'
  + 'var a=(ev.target&&ev.target.closest)?ev.target.closest("a"):null;'
  + 'parent.postMessage({unsrf:"click",t:Date.now()-t0,label:lbl(ev.target),'
  + 'href:a?String(a.getAttribute("href")||"").slice(0,120):null,'
  + 'x:Math.round(ev.clientX||0),y:Math.round(ev.clientY||0)},"*");},true);'
  + 'parent.postMessage({unsrf:"open",t:0},"*");'
  + '}catch(e){}})();<\/script>';

// PURE and total: whatever a browser (or an attacker) posts back becomes at
// most 200 shaped events across all questions, strings capped, numbers
// coerced, unknown keys dropped. Garbage in, empty object out.
function cleanClicks(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  let budget = 200;
  for (const qid of Object.keys(raw).slice(0, 40)) {
    if (!/^[\w-]{1,60}$/.test(qid)) continue;
    const arr = raw[qid];
    if (!Array.isArray(arr)) continue;
    const evs = [];
    for (const e of arr) {
      if (budget <= 0) break;
      if (!e || typeof e !== 'object') continue;
      const type = e.type === 'open' ? 'open' : 'click';
      const ev = { type, t: Math.max(0, Math.min(36e5, parseInt(e.t, 10) || 0)) };
      if (type === 'click') {
        ev.label = String(e.label || '').slice(0, 40);
        if (!ev.label) continue;
        if (e.href) ev.href = String(e.href).slice(0, 120);
        ev.x = Math.max(0, Math.min(9999, parseInt(e.x, 10) || 0));
        ev.y = Math.max(0, Math.min(9999, parseInt(e.y, 10) || 0));
      }
      evs.push(ev); budget--;
    }
    if (evs.length) out[qid] = evs;
  }
  return out;
}

// PURE: the client-read summary for one question — how many respondents
// interacted, total clicks, the first-click distribution (the money answer),
// and the most-touched targets. Rejected responses never counted upstream.
function clickSummary(rows, qid) {
  let respondents = 0, total = 0;
  const first = {}, top = {};
  for (const r of (rows || [])) {
    const evs = (r.clicks && r.clicks[qid]) || [];
    const clicks = evs.filter(e => e && e.type === 'click' && e.label);
    if (!clicks.length) continue;
    respondents++; total += clicks.length;
    const f = clicks[0].label;
    first[f] = (first[f] || 0) + 1;
    for (const c of clicks) top[c.label] = (top[c.label] || 0) + 1;
  }
  if (!respondents) return null;
  const cut = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8));
  return { respondents, total, first: cut(first), top: cut(top) };
}

async function serveMedia(path, env, origin, request) {
  // Range-aware: Safari probes bytes=0-1 and refuses to play without a 206;
  // seeking in every browser rides the same rail. R2 does the byte math.
  if (!env.MEDIA) return new Response('not found', { status: 404 });
  const key = decodeURIComponent(path.slice('/media/'.length));
  let range = null;
  const rh = request && request.headers.get('Range');
  if (rh) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(rh.trim());
    if (m) {
      if (m[1] === '' && m[2] !== '') range = { suffix: parseInt(m[2], 10) };
      else if (m[1] !== '' && m[2] === '') range = { offset: parseInt(m[1], 10) };
      else if (m[1] !== '' && m[2] !== '') { const a = parseInt(m[1], 10), b = parseInt(m[2], 10); range = { offset: a, length: b - a + 1 }; }
    }
  }
  let obj;
  try { obj = await env.MEDIA.get(key, range ? { range } : undefined); }
  catch (e) { obj = null; }
  if (!obj && range) { obj = await env.MEDIA.get(key); range = null; } // unsatisfiable range: fall back to full
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=3600');
  // SEAM:PLAY_RENDER — external use: ?download=1 serves the asset as an
  // attachment so finished takes save cleanly cross-origin (the `download`
  // attribute is ignored on cross-origin anchors, so the server must say it).
  // Optional ?name= sets the saved filename, strictly sanitized; fallback is
  // the object's own basename. View mode (no param) is untouched.
  try {
    const q = new URL(request.url).searchParams;
    if (q.get('download') === '1') {
      let fname = String(q.get('name') || '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 90);
      if (!fname) fname = key.split('/').pop() || 'asset';
      headers.set('Content-Disposition', 'attachment; filename="' + fname + '"');
    }
  } catch (e) {}
  /* SEAM:STIMULUS — uploaded HTML (mock landing pages) is a first-class
     stimulus. Served with a CSP sandbox: scripts, forms, and clicks all work,
     but the document runs with an opaque origin — no storage, no credentialed
     reach into the API, even when the /media/ URL is opened directly rather
     than inside the response overlay's sandboxed iframe. */
  const ctype = String((obj.httpMetadata && obj.httpMetadata.contentType) || '');
  if (ctype.indexOf('text/html') >= 0)
    headers.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  /* SEAM:CLICKPATH — full HTML responses carry the beacon, appended to the
     document (landing pages are small; buffering one is nothing). Range
     requests skip injection — nobody range-requests a landing page, and a
     spliced beacon would corrupt the byte math. */
  if (!range && ctype.indexOf('text/html') >= 0) {
    const html = await obj.text();
    headers.delete('Content-Length');
    return new Response(html + CLICK_BEACON, { headers });
  }
  if (range) {
    const total = obj.size;
    const start = range.suffix != null ? total - range.suffix : range.offset;
    const end = range.length != null ? start + range.length - 1 : total - 1;
    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }
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

/* ═══ SEAM:DEEP_RAIL — Deep Search, house-keyed and budgeted ═════════════
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

/* ═══ SEAM:FIELD_RAIL — the paid door ════════════════════════════════
 * The panel is 3 people. A paid study cannot be fielded from it, and the
 * anonymous guest door hard-rejects paid studies by law (money plus an open
 * link is a fraud magnet). Tokens are the paid rail: one single-use
 * credential per invited person, minted here, burned on submit. Possession
 * of a token is the credential — the same law the share link lives by,
 * narrowed from anyone to one named person.
 *
 * A token response is stored as a guest response (responder_id null,
 * guest_email = the invited address). That is deliberate: the existing
 * response_guest_once index then gives one-response-per-email for free, and
 * mine_study_responses still never selects the email, so partners and
 * clients see GUEST-#### and nothing that identifies a human. ═══ */
const RAIL = {
  MIN_MS_PER_Q: 2200,     // under this per question is a speeder, not a reader
  STRAIGHT_MIN_Q: 4,      // straightlining needs enough scale/single answers to mean anything
  STRAIGHT_RATIO: 0.85,   // ...and this share of them identical
  OPEN_MIN_CHARS: 12,     // an open answer shorter than this is a shrug
  CLIENT_FLOOR: 25,       // below this N the client sees progress, never percentages
  MAX_MINT: 500
};
/* SEAM:EVOLUTION_1 — v2 names behavior capture. The version is the receipt
 * of WHICH words were agreed to; new words require a new version. */
const CONSENT_VERSION = 'mine-consent-2026-08-behavior';

// PURE: token minting. crypto.getRandomValues is in the Workers runtime, so no
// pgcrypto dependency reaches the migration.
function mintToken() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let out = '';
  for (let i = 0; i < b.length; i++) out += ('0' + b[i].toString(16)).slice(-2);
  return out;
}

/* ═══ SEAM:RESPONSE_QUALITY — every response gets scanned, none get judged ══
 * PURE and total: same input, same flags, no I/O. Flags are prompts to look,
 * not verdicts — only an admin marking 'rejected' removes a response from the
 * client read. Three cheap signals catch most farming: too fast to have read
 * the questions, the same answer down the column, and open boxes left empty
 * or one-word. Attention-check questions (type 'attention' with pass_options)
 * flag rather than screen: a failed check you can see is worth more than a
 * respondent silently discarded. */
function qualityScan(answers, questions, durationMs) {
  const flags = [];
  const qs = Array.isArray(questions) ? questions : [];
  const a = answers || {};
  const answered = qs.filter(q => {
    const v = a[q.id];
    return v != null && (!Array.isArray(v) || v.length) && String(v).trim() !== '';
  });

  if (typeof durationMs === 'number' && durationMs > 0 && qs.length) {
    if (durationMs < RAIL.MIN_MS_PER_Q * qs.length) flags.push('speeder');
  }

  const col = qs.filter(q => q.type === 'scale' || q.type === 'single')
    .map(q => a[q.id]).filter(v => v != null && String(v).trim() !== '');
  if (col.length >= RAIL.STRAIGHT_MIN_Q) {
    const tally = {};
    let top = 0;
    for (const v of col) { const k = String(v); tally[k] = (tally[k] || 0) + 1; if (tally[k] > top) top = tally[k]; }
    if (top / col.length >= RAIL.STRAIGHT_RATIO) flags.push('straightline');
  }

  const opens = qs.filter(q => q.type === 'open');
  if (opens.length) {
    const thin = opens.filter(q => String(a[q.id] || '').trim().length < RAIL.OPEN_MIN_CHARS).length;
    if (thin === opens.length) flags.push('thin_open');
  }

  for (const q of qs) {
    if (q.type !== 'attention') continue;
    const pass = Array.isArray(q.pass_options) ? q.pass_options : [];
    if (pass.length && pass.indexOf(a[q.id]) < 0) { flags.push('attention_fail'); break; }
  }

  if (qs.length && answered.length / qs.length < 0.5) flags.push('incomplete');

  return { flags, status: flags.length ? 'flagged' : 'unreviewed' };
}

// PURE: screener verdict. Screeners reject before anything is recorded;
// attention checks flag after. Two different jobs, two different types.
function screenerFails(answers, questions) {
  for (const q of (questions || [])) {
    if (q.type !== 'screener') continue;
    const pass = Array.isArray(q.pass_options) ? q.pass_options : [];
    if (pass.length && pass.indexOf((answers || {})[q.id]) < 0) return true;
  }
  return false;
}

/* ═══ SEAM:CLIENT_LENS — aggregation, with a floor ═════════════════════════
 * PURE. A client refreshing at N=9 sees "67% prefer A", screenshots it, and
 * the number is wrong by N=100. Below CLIENT_FLOOR this returns fielding
 * progress and nothing that looks like a finding. Rejected responses never
 * count. Verbatims ride as anon labels only — the aggregation never sees an
 * email because the caller never selects one. */
function aggregateResponses(rows, questions, floor) {
  const live = (rows || []).filter(r => r.quality_status !== 'rejected');
  const n = live.length;
  const lim = (typeof floor === 'number') ? floor : RAIL.CLIENT_FLOOR;
  if (n < lim) return { n, floor: lim, floor_met: false, questions: [] };

  const out = [];
  for (const q of (questions || [])) {
    if (q.type === 'screener' || q.type === 'attention') continue;
    const entry = { id: q.id, prompt: q.prompt, type: q.type, answered: 0 };
    /* SEAM:INSTRUMENT — rank and numeric leave before the categorical branch.
     * Counting distinct values on continuous or ordinal data produces a number
     * that looks like a finding and is not one. */
    if (q.type === 'rank') {
      const sums = {}, seen = {}, firsts = {};
      for (const r of live) {
        const v = (r.answers || {})[q.id];
        if (!Array.isArray(v) || !v.length) continue;
        entry.answered++;
        v.forEach((o, i) => {
          const k = String(o); if (!k.trim()) return;
          sums[k] = (sums[k] || 0) + (i + 1);
          seen[k] = (seen[k] || 0) + 1;
          if (i === 0) firsts[k] = (firsts[k] || 0) + 1;
        });
      }
      entry.mean_rank = {}; entry.first_pct = {};
      for (const k of Object.keys(sums)) {
        entry.mean_rank[k] = Math.round((sums[k] / seen[k]) * 100) / 100;
        entry.first_pct[k] = entry.answered ? Math.round(((firsts[k] || 0) / entry.answered) * 1000) / 10 : 0;
      }
      entry.order = Object.keys(sums).sort((a, b) => entry.mean_rank[a] - entry.mean_rank[b]);
      out.push(entry); continue;
    }
    if (q.type === 'numeric') {
      const nums = [];
      for (const r of live) {
        const raw = (r.answers || {})[q.id];
        if (raw == null || String(raw).trim() === '') continue;
        const v = Number(raw);
        if (Number.isFinite(v)) nums.push(v);
      }
      entry.answered = nums.length;
      if (nums.length) {
        nums.sort((a, b) => a - b);
        const sum = nums.reduce((x, y) => x + y, 0);
        const mid = Math.floor(nums.length / 2);
        entry.mean = Math.round((sum / nums.length) * 100) / 100;
        entry.median = nums.length % 2 ? nums[mid] : Math.round(((nums[mid - 1] + nums[mid]) / 2) * 100) / 100;
        entry.min = nums[0]; entry.max = nums[nums.length - 1];
      }
      out.push(entry); continue;
    }
    if (q.type === 'open') {
      entry.verbatims = live
        .map(r => ({ who: r.anon_id || 'anon', text: String((r.answers || {})[q.id] || '').trim() }))
        .filter(v => v.text.length >= RAIL.OPEN_MIN_CHARS)
        .slice(0, 40);
      entry.answered = entry.verbatims.length;
    } else {
      const counts = {};
      for (const r of live) {
        const v = (r.answers || {})[q.id];
        if (v == null || String(v).trim() === '') continue;
        entry.answered++;
        const vals = Array.isArray(v) ? v : [v];
        for (const x of vals) {
          const k = String(x);
          if (!k.trim()) continue;
          counts[k] = (counts[k] || 0) + 1;
        }
      }
      entry.counts = counts;
      const denom = entry.answered || 1;
      entry.pct = {};
      for (const k of Object.keys(counts)) entry.pct[k] = Math.round((counts[k] / denom) * 1000) / 10;
      /* SEAM:INSTRUMENT — the scale's own points ride along so top-box math
       * downstream reads this scale, not an assumed 1-5. */
      if (q.type === 'scale') {
        const pts = (q.options || []).map(String).filter(x => x.trim());
        entry.points = pts.length ? pts : ['1', '2', '3', '4', '5'];
      }
      /* SEAM:INSTRUMENT — NPS: promoters minus detractors, computed from the
       * counts already tallied. Never modeled. */
      if (q.type === 'nps' && entry.answered) {
        let prom = 0, det = 0;
        for (const k of Object.keys(counts)) {
          const n = Number(k);
          if (!Number.isFinite(n)) continue;
          if (n >= 9) prom += counts[k];
          else if (n <= 6) det += counts[k];
        }
        entry.promoters = Math.round((prom / entry.answered) * 1000) / 10;
        entry.detractors = Math.round((det / entry.answered) * 1000) / 10;
        entry.nps = Math.round(entry.promoters - entry.detractors);
      }
    }
    out.push(entry);
  }
  return { n, floor: lim, floor_met: true, questions: out };
}

/* SEAM:PROFILE — PURE. One label law for both rails. The client capture helper
 * mirrors this exactly (proof_profile.js enforces parity), so a captured
 * segment and a derived one are indistinguishable in content and distinguished
 * only by provenance, which is the point. */
function profileSegments(p) {
  if (!p) return [];
  const out = [];
  if (p.age_range && String(p.age_range).trim()) out.push('Age ' + String(p.age_range).trim().slice(0, 40));
  if (p.location && String(p.location).trim()) out.push('Near ' + String(p.location).trim().slice(0, 40));
  for (const it of (Array.isArray(p.interests) ? p.interests : []).slice(0, 4)) {
    const t = String(it).trim();
    if (t) out.push(t.slice(0, 40));
  }
  return out.slice(0, 8).map(x => x.slice(0, 60));
}

/* SEAM:PROFILE — PURE over its inputs; mutates rows in place. Fills derived
 * segments where none were captured and STRIPS responder_id from every row on
 * every branch, so nothing downstream can leak what only the join needed.
 * Returns the provenance split for the report to name. */
function deriveRowSegments(rows, profMap) {
  let captured = 0, derived = 0;
  for (const r of (rows || [])) {
    if (Array.isArray(r.segments) && r.segments.length) {
      captured++;
    } else {
      const d = profileSegments(profMap && r.responder_id ? profMap[r.responder_id] : null);
      if (d.length) { r.segments = d; derived++; }
    }
    delete r.responder_id;
  }
  return { captured, derived };
}

/* SEAM:BANNER — PURE. Two-proportion z-test. Compares one group against its
 * own complement; testing a group against a total that contains it understates
 * every difference. Returns null when either side is too thin to test, and a
 * null result renders as silence rather than a hedge. */
function twoProp(x1, n1, x2, n2, minCell) {
  const min = minCell || 5;
  if (n1 < min || n2 < min) return null;
  const pool = (x1 + x2) / (n1 + n2);
  if (pool <= 0 || pool >= 1) return null;
  const se = Math.sqrt(pool * (1 - pool) * (1 / n1 + 1 / n2));
  if (!se || !Number.isFinite(se)) return null;
  const z = ((x1 / n1) - (x2 / n2)) / se;
  if (!Number.isFinite(z)) return null;
  return { z: Math.round(z * 100) / 100, sig: Math.abs(z) >= 1.96, dir: z > 0 ? 'up' : 'down' };
}

/* SEAM:BANNER — PURE. Cut every question by one banner question. Groups are
 * derived from stored answers, so this works on studies that were fielded long
 * before banners existed. A multi-select banner puts a respondent in every
 * group they picked, which is correct: the groups overlap, and each is still
 * tested against everyone outside it. Groups below the minimum are named and
 * suppressed rather than dropped silently, because a client who cannot see
 * that a cell was withheld will assume it did not exist. */
function crossTabBy(rows, bannerQid, questions, minCell) {
  const live = (rows || []).filter(r => r.quality_status !== 'rejected');
  const min = minCell || 5;
  const bq = (questions || []).find(q => String(q.id) === String(bannerQid));
  if (!bq) return null;

  const groups = {};
  for (const r of live) {
    const v = (r.answers || {})[bannerQid];
    if (v == null || String(v).trim() === '') continue;
    for (const x of (Array.isArray(v) ? v : [v])) {
      const k = String(x).slice(0, 60);
      if (!k.trim()) continue;
      (groups[k] = groups[k] || []).push(r);
    }
  }
  const all = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  const names = all.filter(k => groups[k].length >= min).slice(0, 8);
  const suppressed = all.filter(k => groups[k].length < min).map(k => ({ name: k, n: groups[k].length }));
  if (!names.length) return { banner: { id: bq.id, prompt: bq.prompt }, groups: [], suppressed, questions: {} };

  const SKIP = ['open', 'screener', 'attention', 'rank', 'numeric'];
  const byQ = {};
  for (const q of (questions || [])) {
    if (String(q.id) === String(bannerQid)) continue;
    if (SKIP.indexOf(q.type) >= 0) continue;

    const tally = (set) => {
      let n = 0; const c = {};
      for (const r of set) {
        const v = (r.answers || {})[q.id];
        if (v == null || String(v).trim() === '') continue;
        n++;
        for (const x of (Array.isArray(v) ? v : [v])) {
          const k = String(x);
          if (k.trim()) c[k] = (c[k] || 0) + 1;
        }
      }
      return { n, counts: c };
    };

    const cells = {};
    let any = false;
    for (const g of names) {
      const inSet = groups[g];
      const inIds = new Set(inSet);
      const outSet = live.filter(r => !inIds.has(r));
      const a = tally(inSet), b = tally(outSet);
      const pct = {}, sig = {};
      for (const k of Object.keys(a.counts)) {
        pct[k] = a.n ? Math.round((a.counts[k] / a.n) * 1000) / 10 : 0;
        const t = twoProp(a.counts[k], a.n, b.counts[k] || 0, b.n, min);
        if (t && t.sig) { sig[k] = t; any = true; }
      }
      cells[g] = { n: a.n, counts: a.counts, pct, sig };
    }
    byQ[q.id] = { cells, any_sig: any };
  }
  return {
    banner: { id: bq.id, prompt: bq.prompt },
    groups: names.map(g => ({ name: g, n: groups[g].length })),
    suppressed,
    questions: byQ,
  };
}

// PURE: segment cross-tab. Segments are the free-text tags already on every
// response (ZIP for guests, interests for panel). Only segments carrying real
// weight are returned — a cross-tab on n=2 is noise wearing a suit.
function crossTab(rows, questionId, minCell) {
  const live = (rows || []).filter(r => r.quality_status !== 'rejected');
  const min = minCell || 5;
  const bySeg = {};
  for (const r of live) {
    const v = (r.answers || {})[questionId];
    if (v == null || String(v).trim() === '') continue;
    for (const seg of (r.segments || [])) {
      const key = String(seg);
      if (!key.trim()) continue;
      bySeg[key] = bySeg[key] || { n: 0, counts: {} };
      bySeg[key].n++;
      const vals = Array.isArray(v) ? v : [v];
      for (const x of vals) {
        const k = String(x);
        bySeg[key].counts[k] = (bySeg[key].counts[k] || 0) + 1;
      }
    }
  }
  const out = {};
  for (const k of Object.keys(bySeg)) if (bySeg[k].n >= min) out[k] = bySeg[k];
  return out;
}

// Shared authorization for every client-facing read: admin, the partner who
// owns the study, or a granted client. Returns the role so callers can decide
// how much to show — a client never sees more than the aggregate.
async function mineStudyViewer(env, uid, sid) {
  if (await callerIsAdmin(env, uid)) return 'admin';
  const ss = await sbRest(env, `study?id=eq.${sid}&select=partner_id`);
  const st = ss && ss[0];
  if (st) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${uid}&select=id`);
    if (pp && pp[0] && pp[0].id === st.partner_id) return 'partner';
  }
  const cc = await sbRest(env, `study_client?study_id=eq.${sid}&user_id=eq.${uid}&select=id`);
  if (cc && cc[0]) return 'client';
  return null;
}

// POST /mine/invites — ops: mint | list | revoke. Partner-owner or admin.
async function mineInvites(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const role = await mineStudyViewer(env, user.id, sid);
  if (role !== 'admin' && role !== 'partner')
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const op = String(body.op || 'list');
  const base = (env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\/$/, '');
  try {
    if (op === 'mint') {
      // Accepts a pasted list or a parsed array — a client's customer export
      // and a hand-typed list arrive through the same door.
      let raw = body.list;
      if (typeof raw === 'string') raw = raw.split(/[\n,;]+/);
      const seen = {};
      const people = [];
      for (const item of (Array.isArray(raw) ? raw : [])) {
        let email = '', name = '';
        if (item && typeof item === 'object') { email = String(item.email || ''); name = String(item.name || ''); }
        else { email = String(item || ''); }
        email = email.trim().toLowerCase();
        const m = email.match(/[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}/);
        if (!m) continue;
        email = m[0];
        if (seen[email]) continue;
        seen[email] = 1;
        people.push({ email, name: name.trim().slice(0, 80) || null });
        if (people.length >= RAIL.MAX_MINT) break;
      }
      if (!people.length) return json({ ok: false, error: 'no_valid_emails' }, 200, origin, env);
      const rows = people.map(p => ({ study_id: sid, email: p.email, name: p.name,
        token: mintToken(), status: 'pending' }));
      // Existing invites keep their token: re-minting must not invalidate a
      // link somebody already has open.
      const back = await sbRest(env, 'study_invite?on_conflict=study_id,email', {
        method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: rows }) || [];
      /* Revive: ignore-duplicates means a revoked or tokenless row would be
       * skipped forever, locking that address out of this study permanently.
       * Anything the caller just submitted that is dead comes back with a new
       * token. Live tokens are untouched — a link already in someone's inbox
       * must keep working. */
      let revived = 0;
      const existing = await sbRest(env,
        `study_invite?study_id=eq.${sid}&select=id,email,token,status`) || [];
      for (const row of existing) {
        if (!seen[String(row.email || '').toLowerCase()]) continue;
        if (row.token && row.status !== 'revoked') continue;
        await sbRest(env, `study_invite?id=eq.${row.id}`, { method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: { token: mintToken(), status: 'pending', sent_at: null, responded_at: null }
        }).catch(() => {});
        revived++;
      }
      const all = await sbRest(env,
        `study_invite?study_id=eq.${sid}&select=id,email,name,token,status&order=created_at`) || [];
      await logEvent(env, 'intelligence', 'mine', 'invites_mint', user.id,
        { study: sid, submitted: people.length, fresh: back.length, revived });
      return json({ ok: true, minted: back.length, revived, total: all.length,
        invites: all.map(i => ({ id: i.id, email: i.email, name: i.name, status: i.status,
          link: i.token ? base + '/intelligence/?t=' + i.token : null })) }, 200, origin, env);
    }
    if (op === 'send') {
      /* SEAM:FIELD_RAIL — fielding is email, not link-copying by hand. Every
       * pending invite gets its link once; re-running send only touches rows
       * still pending, so it is safe to mash the button. Cap per call keeps a
       * single request inside worker limits — run it again for the rest. */
      const ss2 = await sbRest(env, `study?id=eq.${sid}&select=title,goal,pay_cents,status`);
      const st2 = ss2 && ss2[0];
      if (!st2) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
      if (st2.status !== 'live')
        return json({ ok: false, error: 'study_not_live',
          note: 'launch the study before sending invites' }, 200, origin, env);
      const wantStatuses = body.retry_sent ? 'in.(pending,sent)' : 'eq.pending';
      const pend = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=${wantStatuses}&token=not.is.null` +
        `&select=id,email,name,token&limit=80`) || [];
      if (!pend.length) return json({ ok: true, sent: 0, failed: 0, note: 'no pending invites' }, 200, origin, env);
      if (!env.RESEND_API_KEY)
        return json({ ok: false, error: 'mail_not_configured',
          note: 'RESEND_API_KEY is not set on the worker \u2014 no email can send until it is' }, 200, origin, env);
      const payLine = (st2.pay_cents || 0) > 0
        ? '<p style="margin:0 0 14px"><b>$' + ((st2.pay_cents || 0) / 100).toFixed(2).replace(/\.00$/, '')
          + '</b> for your completed response.</p>' : '';
      let sent = 0;
      let failed = 0;
      let failDetail = null;
      const nowIso = new Date().toISOString();
      for (const iv of pend) {
        const link = base + '/intelligence/?t=' + iv.token;
        const hi = iv.name ? iv.name.split(' ')[0] : 'there';
        const html = '<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:520px">'
          + '<div style="font-weight:800;font-size:22px;letter-spacing:-.01em">Unsurfaced</div>'
          + '<div style="height:3px;background:#C41230;margin:8px 0 20px"></div>'
          + '<p style="margin:0 0 6px">Hi ' + hi + ',</p>'
          + '<h2 style="margin:0 0 10px;font-size:19px">You\u2019re invited: \u201c' + st2.title + '\u201d</h2>'
          + (st2.goal ? '<p style="margin:0 0 14px;color:#444">' + st2.goal + '</p>' : '')
          + payLine
          + '<p style="margin:0 0 18px">Your link is personal and works once \u2014 a few minutes, real questions, no account needed.</p>'
          + '<p><a href="' + link + '" style="background:#C41230;color:#fff;padding:12px 22px;'
          + 'text-decoration:none;font-weight:700;border-radius:4px;display:inline-block">Take the study \u2192</a></p>'
          + '<p style="margin:18px 0 0;font-size:12px;color:#888">UNSURFACED\u2122 \u00B7 Consumer & Market Intelligence</p></div>';
        let res = null;
        try {
          res = await sendEmail(env, { to: iv.email,
            subject: 'You\u2019re invited: \u201c' + st2.title + '\u201d'
              + ((st2.pay_cents || 0) > 0 ? ' \u2014 paid study' : ''), html });
        } catch (e) { res = { ok: false, detail: String(e && e.message).slice(0, 120) }; }
        if (res && res.ok === true) {
          await sbRest(env, `study_invite?id=eq.${iv.id}`, { method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: { status: 'sent', sent_at: nowIso } }).catch(() => {});
          sent++;
        } else {
          failed++;
          if (!failDetail) failDetail = (res && res.status ? 'HTTP ' + res.status + ' \u2014 ' : '')
            + ((res && res.detail) || (res && res.skipped ? 'no RESEND_API_KEY' : 'unknown'));
          // stays pending — the next send picks it up once the cause is fixed
        }
      }
      const remain = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=eq.pending&select=id`) || [];
      await logEvent(env, 'intelligence', 'mine', 'invites_send', user.id,
        { study: sid, sent, failed, remaining: remain.length });
      return json({ ok: true, sent, failed, remaining: remain.length,
        fail_detail: failed ? failDetail : null,
        note: failed ? 'provider rejected ' + failed + ' \u2014 common cause: EMAIL_FROM missing or on an unverified Resend domain' : null }, 200, origin, env);
    }
    if (op === 'restore') {
      // The undo. A revoked invite gets a NEW token — the old link stays dead,
      // which is the whole point of having revoked it.
      const id = String(body.invite_id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
      const back = await sbRest(env, `study_invite?id=eq.${id}&study_id=eq.${sid}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' },
        body: { token: mintToken(), status: 'pending', sent_at: null, responded_at: null } }) || [];
      if (!back.length) return json({ ok: false, error: 'invite_not_found' }, 200, origin, env);
      await logEvent(env, 'intelligence', 'mine', 'invite_restore', user.id, { study: sid });
      return json({ ok: true, link: back[0].token ? base + '/intelligence/?t=' + back[0].token : null },
        200, origin, env);
    }
    if (op === 'revoke') {
      const id = String(body.invite_id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
      await sbRest(env, `study_invite?id=eq.${id}&study_id=eq.${sid}`, { method: 'PATCH',
        headers: { Prefer: 'return=minimal' }, body: { status: 'revoked', token: null } });
      return json({ ok: true }, 200, origin, env);
    }
    const all = await sbRest(env,
      `study_invite?study_id=eq.${sid}&select=id,email,name,token,status,sent_at,responded_at&order=created_at`) || [];
    const tally = { pending: 0, sent: 0, responded: 0, screened: 0, revoked: 0 };
    all.forEach(i => { tally[i.status] = (tally[i.status] || 0) + 1; });
    return json({ ok: true, total: all.length, tally,
      invites: all.map(i => ({ id: i.id, email: i.email, name: i.name, status: i.status,
        responded_at: i.responded_at,
        link: i.token ? base + '/intelligence/?t=' + i.token : null })) }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'invites_failed',
      detail: String(e && e.message).slice(0, 100) }, 200, origin, env);
  }
}

// GET /mine/t?token= — the invited person's door. Public by design: the token
// IS the credential. pass_options never cross this line.
async function mineTokenStudy(url, env, origin) {
  const tok = String(url.searchParams.get('token') || '');
  if (!/^[a-f0-9]{32}$/.test(tok)) return json({ ok: false, error: 'bad_token' }, 200, origin, env);
  let inv;
  try { inv = await sbRest(env, `study_invite?token=eq.${tok}&select=id,study_id,email,name,status`); }
  catch (e) { inv = null; }
  const i = inv && inv[0];
  if (!i) return json({ ok: false, error: 'token_not_found' }, 200, origin, env);
  if (i.status === 'revoked') return json({ ok: false, error: 'token_revoked' }, 200, origin, env);
  if (i.status === 'responded') return json({ ok: false, error: 'already_responded' }, 200, origin, env);
  let ss;
  try { ss = await sbRest(env, `study?id=eq.${i.study_id}&select=id,title,goal,type,pay_cents,asset_key,target_n,status`); }
  catch (e) { ss = null; }
  const st = ss && ss[0];
  if (!st) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  if (st.status !== 'live') return json({ ok: false, error: 'study_closed' }, 200, origin, env);
  let qs;
  try { qs = await sbRest(env, `study_question?study_id=eq.${i.study_id}&select=id,ord,type,prompt,options,asset_key,asset_name&order=ord`); }
  catch (e) { qs = []; }
  return json({ ok: true, data: { id: st.id, title: st.title, goal: st.goal, type: st.type,
    pay_cents: st.pay_cents || 0, asset_key: st.asset_key || null, target_n: st.target_n || null,
    invited_email: i.email, invited_name: i.name || null,
    consent_version: CONSENT_VERSION, questions: qs || [] } }, 200, origin, env);
}

// POST /mine/t/respond — burn the token, record the response.
async function mineTokenRespond(request, env, origin) {
  const body = await safeJson(request);
  const tok = String(body.token || '');
  const answers = (body.answers && typeof body.answers === 'object') ? body.answers : null;
  if (!/^[a-f0-9]{32}$/.test(tok)) return json({ ok: false, error: 'bad_token' }, 200, origin, env);
  if (!answers || !Object.keys(answers).length) return json({ ok: false, error: 'answers_required' }, 200, origin, env);
  if (!body.consent) return json({ ok: false, error: 'consent_required' }, 200, origin, env);

  let inv;
  try { inv = await sbRest(env, `study_invite?token=eq.${tok}&select=id,study_id,email,status`); }
  catch (e) { inv = null; }
  const i = inv && inv[0];
  if (!i) return json({ ok: false, error: 'token_not_found' }, 200, origin, env);
  if (i.status === 'revoked') return json({ ok: false, error: 'token_revoked' }, 200, origin, env);
  if (i.status === 'responded') return json({ ok: false, error: 'already_responded' }, 200, origin, env);

  const ss = await sbRest(env, `study?id=eq.${i.study_id}&select=id,status`);
  const st = ss && ss[0];
  if (!st || st.status !== 'live') return json({ ok: false, error: 'study_closed' }, 200, origin, env);

  const qs = await sbRest(env,
    `study_question?study_id=eq.${i.study_id}&select=id,type,pass_options`) || [];

  // Screened out: the token burns, nothing is recorded. An invited person who
  // does not qualify is spent supply, not a response.
  if (screenerFails(answers, qs)) {
    await sbRest(env, `study_invite?id=eq.${i.id}`, { method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: { status: 'screened', responded_at: new Date().toISOString() } }).catch(() => {});
    return json({ ok: true, data: { screened: true } }, 200, origin, env);
  }

  const dur = parseInt(body.duration_ms, 10);
  const scan = qualityScan(answers, qs, isNaN(dur) ? null : dur);

  let hsh = 5381;
  const seed = i.study_id + '|' + i.email;
  for (let k = 0; k < seed.length; k++) hsh = ((hsh * 33) ^ seed.charCodeAt(k)) >>> 0;
  const anon = 'GUEST-' + String(1000 + (hsh % 9000));

  /* SEAM:PROFILE — invited rail snapshot. If the invite email belongs to a
   * registered responder, capture their profile segments at submission time.
   * The lookup selects only what the labels need; a failure degrades to
   * today's empty array and never blocks the response. */
  let _tokSeg = [];
  try {
    const _pp = await sbRest(env, `responder_profile?email=eq.${encodeURIComponent(i.email)}&select=age_range,location,interests`);
    if (_pp && _pp[0]) _tokSeg = profileSegments(_pp[0]);
  } catch (e) {}
  const now = new Date().toISOString();
  try {
    await sbRest(env, 'response', { method: 'POST', headers: { Prefer: 'return=minimal' },
      body: { study_id: i.study_id, anon_id: anon, segments: _tokSeg,
        answers, guest_email: i.email, status: 'submitted',
        invite_id: i.id, duration_ms: isNaN(dur) ? null : dur,
        started_at: body.started_at || null,
        quality: { flags: scan.flags }, quality_status: scan.status,
        clicks: cleanClicks(body.clicks),
        consent_version: String(body.consent_version || CONSENT_VERSION).slice(0, 40),
        consent_at: now } });
  } catch (e) {
    if (String(e && e.message) === 'sb_409')
      return json({ ok: false, error: 'already_responded' }, 200, origin, env);
    return json({ ok: false, error: 'submit_failed' }, 200, origin, env);
  }

  await sbRest(env, `study_invite?id=eq.${i.id}`, { method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: { status: 'responded', responded_at: now } }).catch(() => {});
  try { await mineMilestone(env, i.study_id); } catch (e) {}
  await logEvent(env, 'intelligence', 'mine', 'token_respond', null,
    { study: i.study_id, flags: scan.flags.length }).catch(() => {});
  return json({ ok: true, data: { anon, flagged: scan.status === 'flagged' } }, 200, origin, env);
}

// POST /mine/client-access — ops: grant | list | revoke. Partner-owner or admin.
// Grants by email against an existing auth user: a client must have signed up
// before they can be pointed at a study.
async function mineClientAccess(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const role = await mineStudyViewer(env, user.id, sid);
  if (role !== 'admin' && role !== 'partner')
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const op = String(body.op || 'list');
  try {
    if (op === 'grant') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        return json({ ok: false, error: 'email_invalid' }, 200, origin, env);
      const ur = await fetch(env.SUPABASE_URL + '/auth/v1/admin/users?filter=' + encodeURIComponent(email), {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } });
      const uj = ur.ok ? await ur.json() : null;
      const list = (uj && (uj.users || uj)) || [];
      const found = Array.isArray(list)
        ? list.find(u => String(u.email || '').toLowerCase() === email) : null;
      if (!found) return json({ ok: false, error: 'no_account',
        note: 'the client must create an account first, then grant access' }, 200, origin, env);
      await sbRest(env, 'study_client?on_conflict=study_id,user_id', {
        method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: { study_id: sid, user_id: found.id, email } });
      await logEvent(env, 'intelligence', 'mine', 'client_grant', user.id, { study: sid });
      return json({ ok: true, granted: email }, 200, origin, env);
    }
    if (op === 'revoke') {
      const id = String(body.client_id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
      await sbRest(env, `study_client?id=eq.${id}&study_id=eq.${sid}`, { method: 'DELETE',
        headers: { Prefer: 'return=minimal' } });
      return json({ ok: true }, 200, origin, env);
    }
    const rows = await sbRest(env,
      `study_client?study_id=eq.${sid}&select=id,email,created_at&order=created_at`) || [];
    return json({ ok: true, clients: rows }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'client_access_failed' }, 200, origin, env);
  }
}

// POST /mine/client-results — the live read. Admin, owning partner, or client.
async function mineClientResults(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const role = await mineStudyViewer(env, user.id, sid);
  if (!role) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  try {
    const ss = await sbRest(env, `study?id=eq.${sid}&select=id,title,goal,target_n,status,created_at`);
    const st = ss && ss[0];
    if (!st) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
    const qs = await sbRest(env,
      `study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options,asset_key,asset_name&order=ord`) || [];
    // SEAM:PROFILE — the PII law, restated: no email, no name, no ZIP is ever
    // selected on this path. responder_id enters the worker ONLY to join
    // responder_profile for segment derivation, and deriveRowSegments deletes
    // it from every row before any aggregation or payload is built.
    const rows = await sbRest(env,
      `response?study_id=eq.${sid}&select=anon_id,segments,answers,clicks,quality_status,submitted_at,responder_id&limit=2000`) || [];
    /* SEAM:PROFILE — derive-for-history. Rows with captured segments pass
     * through untouched; rows without get a reconstruction from the current
     * profile. Chunked lookups keep the in.() URL bounded. A failed lookup
     * ships the numbers without the derivation and still strips the join key,
     * because a degraded read must never become a leaking one. */
    let _segProv = null;
    try {
      const _ids = [...new Set(rows.map(r => r.responder_id).filter(Boolean))];
      const _profMap = {};
      for (let _i = 0; _i < _ids.length; _i += 100) {
        const _chunk = _ids.slice(_i, _i + 100);
        const _ps = await sbRest(env, `responder_profile?user_id=in.(${_chunk.join(',')})&select=user_id,age_range,location,interests`) || [];
        for (const _p of _ps) _profMap[_p.user_id] = _p;
      }
      _segProv = deriveRowSegments(rows, _profMap);
    } catch (e) {
      for (const _r of rows) delete _r.responder_id;
    }
    /* SEAM:ANALYSIS_RAIL — segment lens. The census is always computed from
     * the FULL set (so the filter UI knows what exists); the aggregate runs
     * on the filtered set, and the floor law applies to the filtered n —
     * a segment below the floor says so instead of showing thin numbers. */
    const segReq = String(body.segment || '').slice(0, 60);
    const segCensus = {};
    for (const r of rows) {
      if (r.quality_status === 'rejected') continue;
      for (const g of (r.segments || [])) { const k = String(g).slice(0, 60); if (k) segCensus[k] = (segCensus[k] || 0) + 1; }
    }
    const segRows = segReq ? rows.filter(r => (r.segments || []).map(String).includes(segReq)) : rows;
    const agg = aggregateResponses(segRows, qs, RAIL.CLIENT_FLOOR);
    agg.segment = segReq || null;
    agg.segments = Object.entries(segCensus).sort((a, b) => b[1] - a[1]).slice(0, 24)
      .map(([k, v]) => ({ name: k, n: v }));
    /* Top-2-box for scale questions — computed, never modeled. */
    for (const q of agg.questions || []) {
      /* SEAM:INSTRUMENT — top-2-box reads the scale's own top two points. The
       * previous hardcoded '4' + '5' was right for 1-5 and silently wrong for
       * every other scale length. A 2-point scale has no top BOX, so it is
       * skipped rather than reported as a half-truth. */
      if (q.type === 'scale' && q.answered) {
        const pts = (q.points && q.points.length) ? q.points : ['1', '2', '3', '4', '5'];
        if (pts.length >= 3) {
          const top = pts.slice(-2);
          const t2 = top.reduce((acc, k) => acc + ((q.counts && q.counts[k]) || 0), 0);
          q.t2b = Math.round((t2 / q.answered) * 100);
          q.t2b_points = top;
        }
      }
    }
    /* SEAM:CLICKPATH — behavior joins the read once the floor is met. Only
       non-rejected responses feed the summary, same law as every number. */
    if (agg.floor_met) {
      const live = segRows.filter(r => r.quality_status !== 'rejected');
      for (const q of agg.questions) {
        const cs = clickSummary(live, q.id);
        if (cs) q.clicks = cs;
      }
    }
    /* SEAM:ANALYSIS_RAIL — THE MINE READ. The compiler finally judges the
     * platform's own primary research: closed findings + verbatims flow to
     * the T-model, out comes the house two-liner plus THEMES read from the
     * open answers (theme names + VERBATIM quotes only — no counts, because
     * a count the model estimated would violate the real-stats law; measured
     * theme counts arrive with embedding clustering in v2). KV-cached by
     * n + segment so the 60s poll never re-burns AI; failure ships the
     * numbers without the read, never an error. */
    let insight = null;
    if (agg.floor_met) {
      const iKey = `mr:${sid}:${agg.n}:${segReq || 'all'}`;
      try { const hit = await env.RATE_LIMIT.get(iKey); if (hit) insight = JSON.parse(hit); } catch (e) {}
      if (!insight) {
        try {
          const lines = [];
          for (const q of agg.questions.slice(0, 8)) {
            if (q.type === 'open' || !q.counts) continue;
            const top = Object.keys(q.counts).sort((a, b) => q.counts[b] - q.counts[a])[0];
            if (top) lines.push(`"${String(q.prompt).slice(0, 80)}" -> top answer "${String(top).slice(0, 50)}" (${q.pct && q.pct[top] != null ? q.pct[top] + '%' : q.counts[top] + '/' + q.answered})${q.t2b != null ? ', T2B ' + q.t2b + '%' : ''}`);
          }
          const opens = agg.questions.filter(q => q.type === 'open' && (q.verbatims || []).length >= 3).slice(0, 3);
          let vb = '';
          for (const q of opens) vb += `\nOPEN "${String(q.prompt).slice(0, 80)}" [id ${q.id}]:\n` +
            q.verbatims.slice(0, 16).map(v => '- ' + String(v.text).slice(0, 140)).join('\n');
          const usr = `Primary research study: "${st.title}". Goal: ${String(st.goal || '').slice(0, 160)}. ${agg.n} quality responses${segReq ? ' (segment: ' + segReq + ')' : ''}.\nCLOSED FINDINGS:\n${lines.join('\n')}\n${vb}\n\nReturn JSON exactly: {"read":["line 1: one sharp sentence on what the field actually said","line 2: the move it implies for the client"],"themes":[{"qid":"<id from OPEN header>","name":"<=5 word theme","quotes":["verbatim copied exactly","verbatim copied exactly"]}]}\nUp to 4 themes per open question. Quotes must be COPIED VERBATIM from the responses above — never paraphrase, never invent. JSON only.`;
          const out2 = await env.AI.run(CONFIG.TEXT_MODEL, { messages: [
            { role: 'system', content: 'You compile primary research into honest findings. You never invent numbers or quotes.' },
            { role: 'user', content: usr }], max_tokens: 900 });
          const raw = String((out2 && (out2.response || out2.result || '')) || '');
          const jm = raw.match(/\{[\s\S]*\}/);
          if (jm) {
            const parsed = JSON.parse(jm[0]);
            const read = (Array.isArray(parsed.read) ? parsed.read : []).slice(0, 2).map(x => String(x || '').slice(0, 220)).filter(Boolean);
            const allVerb = new Set();
            for (const q of opens) for (const v of q.verbatims) allVerb.add(v.text);
            const themes = (Array.isArray(parsed.themes) ? parsed.themes : []).slice(0, 12).map(t => ({
              qid: String(t.qid || '').slice(0, 60),
              name: String(t.name || '').slice(0, 60),
              quotes: (Array.isArray(t.quotes) ? t.quotes : []).slice(0, 2)
                .map(x => String(x || '').slice(0, 160))
                .filter(x => { for (const v of allVerb) if (v.indexOf(x) >= 0 || x.indexOf(v.slice(0, 100)) >= 0) return true; return false; })
            })).filter(t => t.name);
            if (read.length === 2) {
              insight = { read, themes, computed_at: new Date().toISOString(), basis: agg.n + ' responses' + (segReq ? ' \u00b7 ' + segReq : '') };
              try { await env.RATE_LIMIT.put(iKey, JSON.stringify(insight), { expirationTtl: 21600 }); } catch (e) {}
            }
          }
        } catch (e) { /* numbers without the read beat no numbers */ }
      }
    }
    const out = { ok: true, role, study: { id: st.id, title: st.title, goal: st.goal,
      target_n: st.target_n || null, status: st.status },
      n: agg.n, floor: agg.floor, floor_met: agg.floor_met, questions: agg.questions,
      segment: agg.segment, segments: agg.segments, segments_note: _segProv, insight };
    if (agg.floor_met && body.crosstab)
      out.crosstab = crossTab(rows, String(body.crosstab), 5);
    /* SEAM:BANNER — the banner rides the same floor law as every other number:
     * below the floor a client sees fielding progress and nothing that looks
     * like a finding, so the cut is not computed at all. */
    if (agg.floor_met && body.banner)
      out.banner = crossTabBy(segRows, String(body.banner), qs, 5);
    /* Which questions can serve as a banner point, so the client picks from
     * what actually exists rather than guessing. */
    out.banner_options = (qs || [])
      .filter(q => ['single', 'multi', 'scale', 'ab', 'nps', 'screener'].indexOf(q.type) >= 0)
      .map(q => ({ id: q.id, prompt: q.prompt, type: q.type }));
    // Fielding health is for the house, never the client.
    if (role !== 'client') {
      const flagged = rows.filter(r => r.quality_status === 'flagged').length;
      const rejected = rows.filter(r => r.quality_status === 'rejected').length;
      const inv = await sbRest(env, `study_invite?study_id=eq.${sid}&select=status`) || [];
      const tally = {};
      inv.forEach(i => { tally[i.status] = (tally[i.status] || 0) + 1; });
      out.fielding = { invited: inv.length, tally, flagged, rejected, raw: rows.length };
    }
    return json(out, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'results_failed',
      detail: String(e && e.message).slice(0, 100) }, 200, origin, env);
  }
}

/* SEAM:CLIENT_LENS — a client's home: every study they hold a grant on, with
 * live counts and no PII. Service-role reads because a closed study is not
 * client-SELECTable under study_live_read, and a client watching their own
 * closed study is the whole point of the grant. */
async function mineClientStudies(env, origin, user) {
  try {
    const grants = await sbRest(env,
      `study_client?user_id=eq.${user.id}&select=id,study_id,created_at`) || [];
    if (!grants.length) return json({ ok: true, studies: [] }, 200, origin, env);
    const ids = grants.map(g => g.study_id).join(',');
    const studies = await sbRest(env,
      `study?id=in.(${ids})&select=id,title,goal,status,target_n,created_at`) || [];
    const out = [];
    for (const st of studies) {
      const rows = await sbRest(env,
        `response?study_id=eq.${st.id}&quality_status=neq.rejected&select=id`) || [];
      out.push({ id: st.id, title: st.title, goal: st.goal, status: st.status,
        target_n: st.target_n || null, n: rows.length, created_at: st.created_at });
    }
    return json({ ok: true, studies: out }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'client_studies_failed' }, 200, origin, env);
  }
}

/* ═══ SEAM:GUEST_LINK — the public response door ═════════════════════
 * Every live study is reachable by link; possession of the link is the
 * credential (same law the invite emails already live by). Free studies
 * complete without a profile: email + ZIP + answers through the worker's
 * service role — the response_bi trigger nulls responder_id and skips the
 * profile block, so GUEST-#### and the ZIP segment written here survive.
 * Paid studies hard-reject at this door: the guest rail is free-only by
 * law, not by UI. Email is dedup + contact only; mine_study_responses
 * never selects it, so partners see GUEST-#### and a ZIP, nothing else. */
async function mineStudyPublic(url, env, origin) {
  const sid = String(url.searchParams.get('id') || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  let ss; try { ss = await sbRest(env, `study?id=eq.${sid}&status=eq.live&select=id,title,goal,type,pay_cents,asset_key,target_n`); } catch (e) { ss = null; }
  const s = ss && ss[0];
  if (!s) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  let qs; try { qs = await sbRest(env, `study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options,asset_key,asset_name&order=ord`); } catch (e) { qs = []; }
  return json({ ok: true, data: { id: s.id, title: s.title, goal: s.goal, type: s.type, pay_cents: s.pay_cents || 0, asset_key: s.asset_key || null, target_n: s.target_n || null, questions: qs || [] } }, 200, origin, env);
}
async function mineGuestRespond(request, env, origin) {
  const body = await safeJson(request);
  const sid = String(body.study_id || '');
  const email = String(body.email || '').trim().toLowerCase();
  const zip = String(body.zip || '').trim();
  const answers = (body.answers && typeof body.answers === 'object') ? body.answers : null;
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, error: 'email_invalid' }, 200, origin, env);
  if (!/^\d{5}$/.test(zip)) return json({ ok: false, error: 'zip_invalid' }, 200, origin, env);
  if (!answers || !Object.keys(answers).length) return json({ ok: false, error: 'answers_required' }, 200, origin, env);
  // light per-IP door: 20 guest submissions a day
  if (env.RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = 'grl:' + ip + ':' + new Date().toISOString().slice(0, 10);
    const cur = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (cur >= 20) return json({ ok: false, error: 'rate_limited' }, 429, origin, env);
    await env.RATE_LIMIT.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 26 });
  }
  let ss; try { ss = await sbRest(env, `study?id=eq.${sid}&status=eq.live&select=id,pay_cents`); } catch (e) { ss = null; }
  const s = ss && ss[0];
  if (!s) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  if ((s.pay_cents || 0) > 0) return json({ ok: false, error: 'paid_study' }, 200, origin, env);
  /* SEAM:MINE_SCALE — screeners enforced here, where the pass keys live; guests never see them */
  let scrQ; try { scrQ = await sbRest(env, `study_question?study_id=eq.${sid}&type=eq.screener&select=id,pass_options`); } catch (e) { scrQ = []; }
  for (const q of (scrQ || [])) {
    if (Array.isArray(q.pass_options) && q.pass_options.length && q.pass_options.indexOf(answers[q.id]) < 0)
      return json({ ok: true, data: { screened: true } }, 200, origin, env);
  }
  // deterministic guest label: same guest, same study, same number
  let hsh = 5381; const seed = sid + '|' + email;
  for (let i = 0; i < seed.length; i++) hsh = ((hsh * 33) ^ seed.charCodeAt(i)) >>> 0;
  const anon = 'GUEST-' + String(1000 + (hsh % 9000));
  try {
    await sbRest(env, 'response', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { study_id: sid, anon_id: anon, segments: [zip], answers, guest_email: email, guest_zip: zip, status: 'submitted', clicks: cleanClicks(body.clicks) } });
  } catch (e) {
    if (String(e && e.message) === 'sb_409') return json({ ok: false, error: 'already_responded' }, 200, origin, env);
    return json({ ok: false, error: 'submit_failed' }, 200, origin, env);
  }
  try { await mineMilestone(env, sid); } catch (e) {}
  return json({ ok: true, data: { anon } }, 200, origin, env);
}
/* SEAM:MINE_SCALE — partners hear their study breathing: milestone mail at 1/10/25/50
 * and at target; target_n reached also closes the study (service role, one place). */
async function mineMilestone(env, sid) {
  const rows = await sbRest(env, `response?study_id=eq.${sid}&select=id`);
  const n = (rows || []).length; if (!n) return;
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,title,target_n,status,partner_id`);
  const s = ss && ss[0]; if (!s) return;
  const atTarget = s.target_n && n >= s.target_n;
  if (atTarget && s.status === 'live') {
    try { await sbRest(env, `study?id=eq.${sid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'closed' } }); } catch (e) {}
  }
  if (!(n === 1 || n === 10 || n === 25 || n === 50 || atTarget)) return;
  try {
    const pp = await sbRest(env, `partner_profile?id=eq.${s.partner_id}&select=owner_id`);
    const owner = pp && pp[0] && pp[0].owner_id; if (!owner) return;
    const ur = await fetch(env.SUPABASE_URL + '/auth/v1/admin/users/' + owner, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY } });
    const u = ur.ok ? await ur.json() : null; const to = u && u.email; if (!to) return;
    const base = (env.APP_URL || '').replace(/\/$/, '');
    await sendEmail(env, { to, subject: atTarget ? `"${s.title}" hit its target \u2014 ${n} responses, study closed` : `"${s.title}" \u2014 ${n} response${n === 1 ? '' : 's'} in`, html: `<div style="font-family:system-ui,sans-serif;line-height:1.6"><h2 style="margin:0 0 8px">${n} response${n === 1 ? '' : 's'} on \u201c${s.title}\u201d</h2><p>${atTarget ? 'Your target was reached and the study auto-closed. The full read is waiting.' : 'Your study is collecting. Open it to generate the Read.'}</p>${base ? `<p><a href="${base}/intelligence/">Open MINE \u2192</a></p>` : ''}</div>` });
  } catch (e) {}
  /* SEAM:EVOLUTION_1 — the client's two moments. Floor crossing (n exactly at
   * the floor: findings just opened) and target (study complete). Exact
   * equality is the dedup: each count is crossed once. Failures never block
   * the response path — this whole block is advisory. */
  try {
    const floorHit = n === RAIL.CLIENT_FLOOR;
    if (!(floorHit || atTarget)) return;
    const grants = await sbRest(env, `study_client?study_id=eq.${sid}&select=email`) || [];
    const base2 = (env.APP_URL || '').replace(/\/$/, '');
    for (const g of grants) {
      if (!g.email) continue;
      await sendEmail(env, { to: g.email,
        subject: floorHit ? `Findings just opened on \u201c${s.title}\u201d`
          : `\u201c${s.title}\u201d is complete \u2014 ${n} responses`,
        html: `<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:520px">`
          + `<div style="font-weight:800;font-size:22px;letter-spacing:-.01em">Unsurfaced</div>`
          + `<div style="height:3px;background:#C41230;margin:8px 0 20px"></div>`
          + `<h2 style="margin:0 0 10px;font-size:19px">${floorHit ? 'Your live results just opened' : 'Your study is complete'}</h2>`
          + `<p style="margin:0 0 14px">${floorHit
              ? `\u201c${s.title}\u201d crossed ${n} quality responses \u2014 the per-question read, verbatims, and behavior data are now live in your results room.`
              : `\u201c${s.title}\u201d reached its target with ${n} responses. The full read is ready.`}</p>`
          + (base2 ? `<p><a href="${base2}/intelligence/" style="background:#C41230;color:#fff;padding:12px 22px;text-decoration:none;font-weight:700;border-radius:4px;display:inline-block">Open your results \u2192</a></p>` : '')
          + `<p style="margin:18px 0 0;font-size:12px;color:#888">UNSURFACED\u2122 \u00B7 Consumer & Market Intelligence</p></div>` }).catch(() => {});
    }
  } catch (e) {}
}
/* SEAM:MINE_LAKE — primary research becomes signal. One digest row per study
 * (VOICE law: aggregate, never per-post noise) enters the lake through the
 * PROMOTE machinery: status raw, content_hash dedup, embedded on the next
 * drain slice — then EXCAVATE searches what real people told us beside what
 * the culture is saying. Tier 1: nothing outranks primary. Verbatims ride as
 * GUEST-####/anon labels only — no emails, no ZIPs, no profile fields. */
async function mineLakeSync(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,title,goal,partner_id`);
  const s = ss && ss[0]; if (!s) return json({ ok: false, error: 'study_not_found' }, 200, origin, env);
  const admin = await callerIsAdmin(env, user.id);
  if (!admin) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);
    if (!pp || !pp[0] || pp[0].id !== s.partner_id) return json({ ok: false, error: 'not_yours' }, 200, origin, env);
  }
  const resp = (await sbRest(env, `response?study_id=eq.${sid}&select=anon_id,answers&limit=200`)) || [];
  if (!resp.length) return json({ ok: false, error: 'no_responses' }, 200, origin, env);
  const read = String(body.read || '').slice(0, 500);
  const verb = resp.slice(0, 8).map(r => (r.anon_id || 'anon') + ': ' + JSON.stringify(r.answers).slice(0, 90)).join(' \u00B7 ');
  const summary = ('PRIMARY RESEARCH \u2014 ' + resp.length + ' real responses. GOAL: ' + (s.goal || '') + (read ? ' READ: ' + read : '') + ' VERBATIM: ' + verb).slice(0, 1200);
  const title = ('MINE: ' + s.title).slice(0, 300);
  const slug = await ensureStudySlug(env, s);
  const url = ((env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\/$/, '')) + '/s/' + (slug || sid);
  try {
    const hash = await sha256hex(hashInput(title, url));
    const row = { content_hash: hash, title, url, summary, image: null, published_at: null,
      source_name: 'MINE PRIMARY', source_tier: 1, territory: null, status: 'raw',
      momentum: { mine: { study_id: sid, responses: resp.length, by: user.id, at: new Date().toISOString() } } };
    const back = await sbRest(env, 'signals?on_conflict=content_hash&select=id', {
      method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: [row] }) || [];
    const landed = back[0] || null;
    await logEvent(env, 'intelligence', 'mine', 'lake_sync', null, { study: sid, responses: resp.length, fresh: !!landed });
    return json({ ok: true, promoted: !!landed, already_in_lake: !landed,
      note: landed ? 'in the lake at raw \u2014 searchable in EXCAVATE after the next slice' : 'this study is already in the lake' }, 200, origin, env);
  } catch (e) { return json({ ok: false, error: 'sync_failed' }, 200, origin, env); }
}
async function mineNotify(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  try { await mineMilestone(env, sid); } catch (e) {}
  return json({ ok: true }, 200, origin, env);
}
/* SEAM:MINE_SCALE — the link unfurls as the study, not a homepage: OG card + redirect */
function slugifyTitle(t) {
  return String(t || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'study';
}
async function ensureStudySlug(env, study) {
  if (!study || !study.id) return null;
  if (study.slug) return study.slug;
  try {
    const cur = await sbRest(env, `study?id=eq.${study.id}&select=slug,title`);
    if (cur && cur[0] && cur[0].slug) return cur[0].slug;
    const base = slugifyTitle((cur && cur[0] && cur[0].title) || study.title);
    for (let k = 0; k < 6; k++) {
      const cand = k ? base + '-' + (k + 1) : base;
      const taken = await sbRest(env, `study?slug=eq.${cand}&select=id`);
      if (taken && taken.length) continue;
      await sbRest(env, `study?id=eq.${study.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { slug: cand } });
      return cand;
    }
  } catch (e) {}
  return null;
}
async function mineEnsureSlug(body, env, origin, user) {
  const sid = String(body.study_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(sid)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,partner_id,title,slug`);
  const study = ss && ss[0];
  if (!study) return json({ ok: false, error: 'not_found' }, 200, origin, env);
  const admin = await callerIsAdmin(env, user.id);
  if (!admin) {
    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);
    if (!(pp && pp[0] && pp[0].id === study.partner_id)) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  }
  const slug = await ensureStudySlug(env, study);
  return json({ ok: true, slug, url: ((env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\/$/, '')) + '/s/' + (slug || sid) }, 200, origin, env);
}
async function mineSharePage(path, env) {
  /* SEAM:SHARE_SLUG — branded permalinks. /s/{key} resolves by UUID or by
   * slug; slugs mint lazily from the title on first share and never change
   * (permalink law: links must not rot). The live-only gate is unchanged —
   * drafts and closed studies still render the generic card. */
  const key = decodeURIComponent(path.slice('/s/'.length)).slice(0, 120);
  const byId = /^[0-9a-f-]{36}$/i.test(key);
  const q = byId ? `id=eq.${key}` : `slug=eq.${key.toLowerCase()}`;
  let ss; try { ss = await sbRest(env, `study?${q}&status=eq.live&select=id,title,goal,pay_cents`); } catch (e) { ss = null; }
  const sid = (ss && ss[0] && ss[0].id) || (byId ? key : '');
  const s = ss && ss[0];
  const base = (env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\/$/, '');
  const dest = base + '/intelligence/?study=' + encodeURIComponent(sid);
  const esc2 = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const title = s ? esc2(s.title) + ' \u00b7 ' + ((s.pay_cents || 0) > 0 ? 'Paid study' : 'Free study') + ' on Unsurfaced MINE' : 'A study on Unsurfaced MINE';
  const desc = s ? esc2((s.goal || '').slice(0, 160)) : 'Real questions for real people.';
  const img = 'https://api.unsurfaced-intelligence.com/media/og/study-default.png';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:site_name" content="Unsurfaced Intelligence"><meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${img}"><meta http-equiv="refresh" content="0;url=${dest}"></head><body><script>location.replace(${JSON.stringify(dest)})</script><a href="${dest}">Open the study</a></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

// --- email invites for a study's invited contacts (partner who owns it, or admin) ---
async function emailStudyInvite(body, env, origin, user) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: 'service_unconfigured' }, 200, origin, env);
  const sid = String(body.study_id || ''); if (!sid) return json({ ok: false, error: 'study_required' }, 400, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,partner_id,title,pay_cents`);
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
    const paid = (study.pay_cents || 0) > 0; /* SEAM:FREE_STUDY — $0 studies invite volunteers, never promise pay */
    const res = await sendEmail(env, { to: e, subject: paid ? "You're invited to a paid study on Unsurfaced" : "You're invited to a study on Unsurfaced", html: inviteEmailHtml(study.title, base + '/?study=' + sid, paid) });
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
  if (r.ok) return { ok: true };
  let detail = '';
  try { detail = (await r.text()).slice(0, 200); } catch (e) {}
  return { ok: false, status: r.status, detail };
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
function inviteEmailHtml(study, url, paid) {
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;color:#111;line-height:1.6">
    <h2 style="margin:0 0 8px">You're invited to a ${paid ? 'paid ' : ''}research study</h2>
    <p>A brand wants your honest take on <strong>${esc(study || 'a new study')}</strong>. It takes a couple of minutes${paid ? ", and you'll be paid for your response" : ''}.</p>
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
/* SEAM:BEACON -- the public funnel counter. Allowlisted events only, per-IP
 * throttle, then the house logEvent (SEAM:ACTIVITY_LOG) writes activity_events.
 * Awaited so Workers cannot cancel the write at response time; logEvent itself
 * swallows every failure, so this route can never break the client. */
async function beaconTrack(request, env, origin) {
  const b = await safeJson(request);
  const ev = String(b.event || '');
  const SPACE = { portal_view: 'hub', study_open: 'mine', guest_submit: 'mine',
                  panel_join: 'mine', study_invite_accepted: 'hub', study_invite_dismissed: 'hub' };
  if (!(ev in SPACE)) return json({ ok: true }, 200, origin, env);
  if (env.RATE_LIMIT) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = 'brl:' + ip + ':' + new Date().toISOString().slice(0, 10);
    const cur = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
    if (cur >= 500) return json({ ok: true }, 200, origin, env);
    await env.RATE_LIMIT.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 26 });
  }
  let meta = (b.meta && typeof b.meta === 'object' && !Array.isArray(b.meta)) ? b.meta : {};
  try { if (JSON.stringify(meta).length > 600) meta = {}; } catch (e) { meta = {}; }
  const sid = String(b.session_id || '').slice(0, 64) || null;
  await logEvent(env, 'intelligence', SPACE[ev], ev, sid, meta);
  return json({ ok: true }, 200, origin, env);
}

function logEvent(env, platform, space, event, sessionId, meta) {
  try {
    return sbRest(env, 'activity_events', {
      method: 'POST',
      body: { platform, space, event, session_id: sessionId, meta: meta || {} }
    }).catch(() => {});
  } catch { return Promise.resolve(); }
}

/* ═══════════════════════════════════════════════════════════════════
 * SEAM:STUDIO — the content engine. After DAILY publishes, the engine
 * cuts the day's manifest into content_pieces: what to say, where, from
 * which data. Rendering happens in the admin's browser (the house
 * renderer); binaries archive to R2 only at deploy. Doctrine:
 * templates/DOCTRINE.md — evidence that surfaced, not content made.
 * Caps are law: one hero piece per story, chosen by story shape;
 * only the lead carries an alt. The engine selects; the admin disposes.
 * ═══════════════════════════════════════════════════════════════════ */
const STUDIO_VOICE = 'Voice: declarative, specific, a little dangerous. Use ONLY facts, numbers, and dates that appear in the finding text \u2014 inventing a date, figure, name, or event is the one unforgivable move. If the finding has no number, write without one. '
  + 'Never explain the joke. Banned: engagement-bait ("you won\'t believe", "stop scrolling"), '
  + 'emoji soup, listicle cadence, hashtag walls. Write like the reader is smart and busy. '
  + 'Editorial standard: meaning over novelty; evidence over hype; tension over generality; '
  + 'utility over performance \u2014 end where the reader can use what they now see.';
/* THE LENGTH CONTRACT \u2014 copy composes to the box; the box never cuts
 * the copy. studioTrimClean is the only knife: within budget \u2192 untouched;
 * over \u2192 cut at the last sentence end inside budget; no sentence end \u2192
 * last word boundary, trailing connectors stripped. Never mid-word, never
 * an ellipsis. studioComplete is the gate: hashtag tail set aside, the
 * copy must land on terminal punctuation or it does not enter the queue. */
function studioTrimClean(text, budget) {
  const t = String(text || '').trim();
  if (t.length <= budget) return t;
  const cut = t.slice(0, budget);
  let best = -1;
  for (const m of cut.matchAll(/[.!?\u2026](?=\s|$)/g)) best = m.index;
  if (best > budget * 0.4) return cut.slice(0, best + 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > 0 ? cut.slice(0, sp) : cut).replace(/[\s,;:\u2014\u2013-]+$/, '');
}
function studioComplete(text) {
  let t = String(text || '').trim();
  const lines = t.split('\n');
  while (lines.length && /^[#\s]*(#[\w\u00c0-\uffff]+[\s]*)+$/.test(lines[lines.length - 1])) lines.pop();
  t = lines.join('\n').trim();
  if (!t) return false;
  return /[.!?\u2026"'\u201d\u2019)]$/.test(t);
}
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
  const base = String(item.headline || '') + ' \u2014 ' + studioTrimClean(item.take, 160);
  if (platform === 'linkedin') return base + (item.source_name ? '\nSource: ' + item.source_name : '');
  return base + '\n\n#unsurfaced #' + String(item.kicker || 'signal').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
/* the composer's format steers the caption's angle — additive, silent on
 * legacy items (no format field → no extra instruction). */
function studioAngle(item) {
  switch (item && item.format) {
    case 'number':      return ' Anchor the caption on the number in the finding \u2014 the stat is the hook.';
    case 'read':        return ' Frame it as one pattern showing up in more than one place at once.';
    case 'signal':      return ' Frame it as an early signal from the edge \u2014 say plainly that it is early.';
    case 'provocation': return ' Lead with the open question the finding leaves behind.';
    case 'drop':        return ' Read the release through identity and behavior, never through PR.';
    default:            return '';
  }
}
async function studioCaption(env, platform, item) {
  const budget = platform === 'linkedin' ? 600 : platform === 'instagram' ? 500 : 300;
  const contract = ' Land the whole caption within ' + budget + ' characters. Complete every sentence \u2014 if it will not fit, drop an idea, never a sentence.';
  const dialect = (platform === 'linkedin'
    ? 'LinkedIn dialect: the finding leads; 2-3 sentences arguing it; no hashtags.'
    : platform === 'instagram'
      ? 'Instagram dialect: one sharp line, then one context line. End with up to 5 chosen hashtags on their own line.'
      : 'TikTok dialect: hook under 12 words, then one payoff line. Up to 4 hashtags.') + contract;
  try {
    const ground = studioGround(item);
    const user = `Finding: ${item.headline}\n${item.standfirst || ''}\nThe take: ${item.take || ''}\nSource: ${item.source_name || ''}`;
    let out = await callModel(env, 't1', [
      { role: 'system', content: 'You write social captions for Unsurfaced, a creative recon group publishing daily cultural intelligence. ' + STUDIO_VOICE + ' ' + dialect + studioAngle(item) + ' Output only the caption text.' },
      { role: 'user', content: user }
    ], { max_tokens: 400 });
    let cap = studioTrimClean(out, budget);
    if (studioFabricated(cap, ground) || !studioComplete(cap)) {
      out = await callModel(env, 't1', [
        { role: 'system', content: 'Rewrite the caption using ONLY the facts in the finding. Remove every date, figure, and name that the finding does not contain. Finish every sentence \u2014 no fragments. ' + dialect + ' Output only the caption text.' },
        { role: 'user', content: user + '\n\nCaption to fix: ' + cap }
      ], { max_tokens: 400 });
      cap = studioTrimClean(out, budget);
    }
    if (!cap || studioFabricated(cap, ground) || !studioComplete(cap)) cap = studioSafeCaption(platform, item);
    return cap;
  } catch (e) { return studioSafeCaption(platform, item); }
}
async function studioMemeLines(env, item) {
  try {
    const out = await callModel(env, 't1', [
      { role: 'system', content: 'You write two-line house memes for Unsurfaced. ' + STUDIO_VOICE + ' Formats: "verdict" (line1 = the finding stated flat, line2 = the deadpan read) or "vs" (line1 = the signal, line2 = the noise it replaces). No emoji ever. line1 within 90 characters, line2 within 110 \u2014 complete phrases only, never cut a thought. Output ONLY JSON: {"mformat":"verdict"|"vs","line1":"...","line2":"..."}' },
      { role: 'user', content: `Finding: ${item.headline}\nThe take: ${item.take || ''}` }
    ], { max_tokens: 140 });
    const j = JSON.parse(String(out).replace(/```json|```/g, '').trim());
    if (j && j.line1) {
      const ground = studioGround(item);
      if (!studioFabricated(String(j.line1) + ' ' + String(j.line2 || ''), ground))
        return { mformat: j.mformat === 'vs' ? 'vs' : 'verdict',
          line1: studioTrimClean(j.line1, 90), line2: studioTrimClean(j.line2, 110) };
    }
  } catch (e) {}
  return { mformat: 'verdict', line1: studioTrimClean(item.headline, 90),
    line2: studioTrimClean(item.take, 110) };
}
/* PURE: the selector. One hero per story \u2014 the editorial format the
 * composer stamped picks the piece format and its native platform, and
 * the reason ships in the payload so the counter shows its work.
 * Scoreboard, never the playbook: the reason is the read, not the rubric. */
function studioSelect(it) {
  switch (it && it.editorial_format || it && it.format) {
    case 'number':      return { format: 'signal_still', platform: 'instagram', lane: 'perishable',
      why: 'number-led finding \u2014 the stat card is the hero' };
    case 'provocation': return { format: 'hand_meme',    platform: 'instagram', lane: 'durable',
      why: 'open question \u2014 the meme grammar carries it' };
    case 'drop':        return { format: 'kinetic_take', platform: 'tiktok',    lane: 'perishable',
      why: 'release energy \u2014 motion is the native read' };
    case 'read':        return { format: 'kinetic_take', platform: 'tiktok',    lane: 'perishable',
      why: 'pattern across places \u2014 the moving take' };
    case 'signal':      return { format: 'signal_still', platform: 'instagram', lane: 'perishable',
      why: 'early signal \u2014 the flat card, stated plainly' };
    default:            return { format: 'signal_still', platform: 'instagram', lane: 'perishable',
      why: 'dispatch \u2014 the still carries the finding' };
  }
}
/* PURE: the slate walk. First story per unseen territory; territory-less
 * editions fall back to the beat walk; still thin → fill by order. The
 * LEAD (item 0) always seats first. */
function studioSlate(items) {
  const slate = [], seenT = new Set(), seenB = new Set();
  for (const it of (items || [])) {
    const t = it.territory || null;
    if (t && !seenT.has(t)) { seenT.add(t); slate.push(it); }
    if (slate.length === 3) return slate;
  }
  for (const it of (items || [])) {
    if (slate.length === 3) break;
    if (slate.includes(it)) continue;
    const b = it.beat || null;
    if (b && !seenB.has(b)) { seenB.add(b); slate.push(it); }
  }
  for (const it of (items || [])) {
    if (slate.length === 3) break;
    if (!slate.includes(it)) slate.push(it);
  }
  return slate;
}

async function buildStudioManifest(env, day, issueNo, items) {
  try {
    const existing = await sbRest(env, `content_pieces?day=eq.${day}&select=id&limit=1`);
    if (existing && existing.length) return { ok: true, skipped: 'manifest-exists' };
    const lead = items && items[0];
    if (!lead) return { ok: false, error: 'no_items' };
    // THE SLATE — three stories across distinct TERRITORIES (the 12-story law),
    // beats as the fallback lens, order as the floor. Deterministic and free.
    const slate = studioSlate(items);
    const base = (it, story) => ({ issue_no: issueNo, date: day, kicker: it.kicker, headline: it.headline,
      take: it.take, source_name: it.source_name, beat: it.beat || 'culture', story,
      territory: it.territory || null, editorial_format: it.format || 'dispatch',
      apply: it.apply || null, momentum: it.momentum || null });
    const sixPayload = { issue_no: issueNo, date: day,
      slides: (items || []).slice(0, 6).map(it => ({
        kicker: it.kicker, headline: it.headline, take: it.take, source_name: it.source_name,
        territory: it.territory || null, editorial_format: it.format || null })) };
    // The slate walk: 2 edition anchors + hero per story (lead carries an alt).
    // Six pieces on a full slate, down from seventeen. Caps are code, not comment.
    const MATRIX = [
      { format: 'the_six', platform: 'instagram', lane: 'perishable', it: null, story: 0,
        why: 'the edition anchor \u2014 carousel-native feed' },
      { format: 'the_six', platform: 'linkedin',  lane: 'perishable', it: null, story: 0,
        why: 'the edition anchor \u2014 document-post native' },
    ];
    if (slate[0]) {
      const hero = studioSelect(slate[0]);
      MATRIX.push({ format: hero.format, platform: hero.platform, lane: hero.lane, it: slate[0], story: 1, why: hero.why });
      MATRIX.push({ format: 'signal_still', platform: 'linkedin', lane: 'perishable', it: slate[0], story: 1,
        why: 'the lead carries two \u2014 the LinkedIn read' });
    }
    [slate[1], slate[2]].forEach((it, i) => { if (it) {
      const hero = studioSelect(it);
      MATRIX.push({ format: hero.format, platform: hero.platform, lane: hero.lane, it, story: 2 + i, why: hero.why });
    } });
    const memeByStory = {};
    for (const cell of MATRIX) if (cell.it && cell.format === 'hand_meme' && !memeByStory[cell.it.headline])
      memeByStory[cell.it.headline] = await studioMemeLines(env, cell.it);
    const pieces = [];
    for (const cell of MATRIX) {
      const it = cell.it || lead;
      let payload;
      if (cell.format === 'the_six') payload = Object.assign({}, sixPayload, { selection: cell.why });
      else if (cell.format === 'hand_meme') payload = Object.assign(base(it, cell.story), memeByStory[it.headline] || {}, { selection: cell.why });
      else payload = Object.assign(base(it, cell.story), { selection: cell.why });
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
  const hero = studioSelect(it);
  const base = { issue_no: ed.issue_no, date: day, kicker: it.kicker, headline: it.headline,
    take: it.take, source_name: it.source_name, beat: it.beat || 'culture', story: 9,
    territory: it.territory || null, editorial_format: it.format || 'dispatch',
    apply: it.apply || null, momentum: it.momentum || null,
    selection: 'admin cut \u2014 ' + hero.why };
  const payload = hero.format === 'hand_meme'
    ? Object.assign({}, base, await studioMemeLines(env, it)) : base;
  const pieces = [
    { day, lane: hero.lane, format: hero.format, platform: hero.platform, status: 'draft',
      copy: { caption: await studioCaption(env, hero.platform, it) }, payload },
  ];
  await sbRest(env, 'content_pieces', { method: 'POST', body: pieces });
  logEvent(env, 'intelligence', 'studio', 'story_cut', null, { item: itemId, beat: base.beat, format: hero.format });
  return json({ ok: true, pieces: 1, beat: base.beat, format: hero.format }, 200, origin, env);
}
async function studioManifest(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const days = Math.min(parseInt(body.days, 10) || 7, 30);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = await sbRest(env,
    `content_pieces?day=gte.${since}&status=neq.killed&order=day.desc,id.asc&select=id,day,lane,format,platform,copy,payload,status,deployed_at,post_url,archive_key`);
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
/* KILL means kill \u2014 the piece leaves the shared queue for every admin.
 * Never-deployed drafts hard-delete (no ledger value); anything that
 * shipped soft-kills to status='killed' \u2014 the record of what went out
 * is never erased. The queue query excludes killed, so both paths
 * vanish from the list, persistently. */
async function studioKill(body, env, origin, user) {
  if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const id = parseInt(body.id, 10);
  if (!id) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const rows = await sbRest(env, `content_pieces?id=eq.${id}&select=id,deployed_at,status`);
  const piece = rows && rows[0];
  if (!piece) return json({ ok: true, id, gone: 'already' }, 200, origin, env);
  let mode;
  if (piece.deployed_at) {
    await sbRest(env, `content_pieces?id=eq.${id}`, { method: 'PATCH', body: { status: 'killed' } });
    mode = 'soft';
  } else {
    await sbRest(env, `content_pieces?id=eq.${id}`, { method: 'DELETE' });
    mode = 'hard';
  }
  logEvent(env, 'intelligence', 'studio', 'piece_killed', null, { id, mode });
  return json({ ok: true, id, mode }, 200, origin, env);
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
/* SEAM:EXCAVATE - the query door. bge-small-en-v1.5 is an ASYMMETRIC
 * retrieval model: short query on one side, long passage on the other, and
 * its model card asks the query to carry an instruction prefix while the
 * passage carries none. We embed passages correctly ('title. summary') and
 * have always embedded queries bare, so every EXCAVATE and FEED search has
 * run one side of the pair mis-shaped.
 *
 * The prefix CANNOT live inside kbEmbed: that function serves both sides -
 * kbInsert hands it passages, kbSearch hands it a query. Putting it there
 * would poison the corpus. So it lives here, and only query paths call it.
 *
 * Safe by construction: ECHO_SIM (0.93) and CLUSTER_SIM (0.80) are compared
 * against vecOf(r.embedding) - a signal's own stored vector, never a text
 * embed - so no threshold moves and no row needs re-embedding. Both query
 * callers rank top-N with no cutoff. Nothing to retune.  */
const BGE_QUERY_PREFIX = 'Represent this sentence for searching relevant passages: ';
async function embedQuery(env, q) {
  const r = await env.AI.run(KB_EMBED_MODEL, { text: [BGE_QUERY_PREFIX + String(q || '')] });
  return (r && r.data && r.data[0]) || null;
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
  // Also reports approval status (SEAM:APPROVAL) so any consumer can gate on DB
  // truth. One read covers both role and status; callerIsAdmin stays untouched.
  let admin = false, approved = false, status = 'pending';
  try {
    const r = await sbRest(env, `app_user?id=eq.${user.id}&select=role,status`);
    if (r && r[0]) {
      admin = r[0].role === 'admin';
      status = r[0].status || 'pending';
      approved = status === 'approved' || admin;
    }
  } catch (e) {}
  return json({ ok: true, admin, approved, status }, 200, origin, env);
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
  const vec = await embedQuery(env, q);          // query side - prefixed
  if (!vec) return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
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
    'entertainment-gaming','food-hospitality','sustainability-impact','global-diaspora',
    /* SEAM:APERTURE cut 2 — the masthead widens ADDITIVELY (existing slugs are
       load-bearing across feed tags and the classifier). Six new lanes from
       the twenty-lane map; feeds to fill them are cut 3. */
    'sports-culture','wellness-fitness','retail-dtc','luxury',
    'travel-experiences','media-platforms'
  ],
  // Legacy SLATE compatibility: every territory resolves to one of the five beats.
  beat_map: {
    'advertising-marketing':'advertising', 'technology-innovation':'tech',
    'artificial-intelligence':'ai', 'business-economics':'tech',
    'entrepreneurship-creator':'culture', 'music':'culture',
    'fashion-beauty':'culture', 'sneakers-streetwear':'culture',
    'art-design':'creativity', 'architecture-cities':'creativity',
    'entertainment-gaming':'culture', 'food-hospitality':'culture',
    'sustainability-impact':'culture', 'global-diaspora':'culture',
    'sports-culture':'culture', 'wellness-fitness':'culture',
    'retail-dtc':'tech', 'luxury':'culture',
    'travel-experiences':'culture', 'media-platforms':'advertising'
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
    { name:"It's Nice That",     feed:'https://feeds.feedburner.com/itsnicethat/SlXC',              tier:2, territories:['art-design','advertising-marketing'], verified:false },
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
    { name:'Dirt',               feed:'https://rss.beehiiv.com/feeds/C8g1hSvrGA.xml',  tier:3, territories:['entertainment-gaming','art-design'], verified:false },
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

/* ═══ SEAM:DAILY_SPINE — the lake-filler. CAPTURE (27 feeds + GDELT) →
 * hash dedup → embed (Workers AI, own account) → FILTER (echo kill +
 * t1 classify) → CONNECT (neighbors, clusters, mechanical momentum).
 * Runs inside runDailyPipeline BEFORE the edition (failures never block
 * publishing) and standalone via POST /daily/spine (admin). Every stage
 * is per-item fault-tolerant: a dead feed or a bad model reply costs
 * one item, never the run. Momentum here is mechanical v1; the composer
 * (DAILY-03) refines. ═══ */
const SPINE = {
  FEED_CAP: 10, GDELT_CAP: 4, MAX_NEW: 120, EMBED_BATCH: 16,
  MAX_CLASSIFY: 48, MAX_CONNECT: 48, PAR: 6, TIMEOUT_MS: 8000,
  ECHO_SIM: 0.93, CLUSTER_SIM: 0.80, BREADTH_SIM: 0.75
};

// tolerant RSS2/Atom item extraction — no DOM in Workers, regex law with
// CDATA + entity handling; malformed feeds yield what they can, never throw.
function rssDecode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ''; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch (e) { return ''; } })
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ');
}
function rssField(block, names) {
  for (const n of names) {
    const m = block.match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i'));
    if (m && m[1]) return m[1];
  }
  return '';
}
function rssItems(xml, max) {
  const out = [];
  const src = String(xml || '');
  const blocks = src.match(/<item[\s>][\s\S]*?<\/item>/gi)
             || src.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks.slice(0, max || 12)) {
    let link = rssField(b, ['link']).trim();
    if (!link) {                                     // Atom: <link href="..."/>
      const m = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = m ? m[1] : '';
    }
    if (!/^https?:\/\//i.test(link)) continue;
    const title = rssDecode(rssField(b, ['title'])).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title) continue;
    const desc = rssDecode(rssField(b, ['description', 'summary', 'content:encoded', 'content']))
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    const dateRaw = rssField(b, ['pubDate', 'published', 'updated', 'dc:date']).trim();
    const d = dateRaw ? new Date(dateRaw) : null;
    // key visual, from the feed itself — media:*, enclosure, itunes, first <img>
    let image = null;
    const im = b.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i)
            || b.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i)
            || b.match(/<enclosure[^>]*url=["']([^"']+\.(?:jpe?g|png|webp|gif)[^"']*)["']/i)
            || b.match(/<itunes:image[^>]*href=["']([^"']+)["']/i)
            || b.match(/<img[^>]*src=["']([^"']+)["']/i);
    if (im && /^https?:\/\//i.test(rssDecode(im[1]))) image = rssDecode(im[1]).slice(0, 500);
    out.push({
      title: title.slice(0, 240), url: rssDecode(link).trim(), summary: desc, image,
      published_at: d && !isNaN(d.getTime()) ? d.toISOString() : null
    });
  }
  return out;
}

// dedup fingerprint: normalized title + canonical url (host+path, no query/utm).
function hashInput(title, url) {
  const t = String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 80);
  let u = '';
  try {
    const p = new URL(String(url || ''));
    u = (p.host + p.pathname).toLowerCase().replace(/\/+$/, '');
  } catch (e) { u = String(url || '').toLowerCase().slice(0, 120); }
  return t + '|' + u;
}
async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// model replies arrive fenced, prefixed, or clean — take the first {...}.
function parseModelJson(s) {
  try {
    const m = String(s || '').match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) { return null; }
}

// mechanical momentum v1 — neighbors are {similarity, territory, source_tier,
// captured_at}; confidence stays distinct from excitement.
/* The rubric and the measurement are different instruments and must not be
 * confused. The six dims below are TASTE: a 0-5 human scale, the editorial
 * judgement that makes the paper good. `measure` is a NUMBER: uncapped,
 * timestamped, tier-weighted - the thing a brand puts in a deck and the thing
 * Nielsen cannot sell them, because Nielsen counts the audience after it
 * arrives and this counts the press deciding, days upstream.
 *
 * The rubric reads the first 6 neighbours, exactly as it did when p_count WAS
 * 6. That is deliberate: raising p_count to 40 would otherwise re-rank the
 * paper silently - depth saturates at 5 the moment it sees more than ~6
 * sources, and nobody knows yet what 40 does to those distributions. Measure
 * first, retune with evidence. `measure` reads the full sample and is nested,
 * so DAILY_POV.momentum.dims never picks it up and no score moves today.  */
function momentumMech(neighbors, ownTerritory, ownTier, novelty) {
  const now = Date.now();
  const ms = (t) => new Date(t).getTime();

  // ── taste: unchanged, first 6 only ──
  const near = neighbors.slice(0, 6).filter(n => n.similarity >= SPINE.BREADTH_SIM);
  const recent = near.filter(n => now - ms(n.captured_at) <= 48 * 3600e3);
  const terrs = new Set(near.map(n => n.territory).filter(Boolean)); terrs.add(ownTerritory);
  const srcs = new Set(near.map(n => n.source_name).filter(Boolean));
  const spanMs = near.length ? Math.max(...near.map(n => now - ms(n.captured_at))) : 0;

  // ── measurement: the whole sample, nothing clamped ──
  const rel = neighbors.filter(n => n.similarity >= SPINE.BREADTH_SIM);
  const echoes = neighbors.filter(n => n.similarity >= SPINE.ECHO_SIM);
  const eTimes = echoes.map(n => ms(n.captured_at)).filter(t => !isNaN(t));
  const measure = {
    echo_n: echoes.length,                                    // outlets carrying THIS story
    echo_h: eTimes.length > 1                                 // hours first-to-last: velocity
      ? Math.round((Math.max(...eTimes) - Math.min(...eTimes)) / 3600e3) : 0,
    echo_t1: echoes.filter(n => n.source_tier === 1).length,   // how much of it is tier-1
    near_n: rel.length,                                       // the wider neighbourhood
    srcs_n: new Set(rel.map(n => n.source_name).filter(Boolean)).size,
    terrs_n: new Set(rel.map(n => n.territory).filter(Boolean)).size,
    span_h: rel.length
      ? Math.round(Math.max(...rel.map(n => now - ms(n.captured_at))) / 3600e3) : 0,
    sample: neighbors.length                                   // what the number was drawn from
  };

  return {
    novelty: Math.max(0, Math.min(5, novelty | 0)),
    velocity: Math.min(5, recent.length),
    breadth: Math.min(5, terrs.size - 1 + (near.length ? 1 : 0)),
    depth: Math.min(5, Math.round(srcs.size ? (srcs.size + (5 - ownTier)) / 2 : (5 - ownTier) / 2)),
    durability: Math.min(5, Math.round(spanMs / (24 * 3600e3))),
    relevance: ({ 1: 4, 2: 3, 3: 3, 4: 2 })[ownTier] || 2,
    measure
  };
}

/* rotatePick — stateless rotation: pick n items starting at an
 * hour-derived offset, wrapping. Every source gets its turn across
 * consecutive ticks; no KV, no cursor, fully deterministic. */
function rotatePick(list, n, epoch) {
  const L = (list || []).length;
  if (!L) return [];
  const off = (((epoch | 0) * Math.max(1, n | 0)) % L + L) % L;   // stride = window size
  const out = [];
  for (let i = 0; i < Math.min(n, L); i++) out.push(list[(off + i) % L]);
  return out;
}

async function fetchWithTimeout(url, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { signal: ctl.signal, cf: { cacheTtl: 600 }, headers: { 'User-Agent': 'UnsurfacedDAILY/1.0 (+https://unsurfaced-intelligence.com)' } }); }
  finally { clearTimeout(t); }
}

// CAPTURE — every enabled source; a dead feed costs its own items only.
async function spineCapture(env, opts) {
  const items = [], feedErrors = [];
  let gdeltSeen = 0, gdeltKept = 0;          // SEAM:DAILY_SPINE - the wire must report itself
  const hours = Math.floor(Date.now() / 18e5);   // 30-min epochs — matches the drain cadence
  const nFeeds = (opts && opts.feeds) || 10;
  const nLanes = (opts && opts.gdelt) != null ? opts.gdelt : 2;
  const sources = rotatePick(DAILY_POV.sources, nFeeds, hours);
  const lanes = rotatePick(DAILY_BEATS, nLanes, hours);
  for (let i = 0; i < sources.length; i += SPINE.PAR) {
    const chunk = sources.slice(i, i + SPINE.PAR);
    const settled = await Promise.allSettled(chunk.map(async (s) => {
      const r = await fetchWithTimeout(s.feed, SPINE.TIMEOUT_MS);
      if (!r.ok) throw new Error('http_' + r.status);
      const got = rssItems(await r.text(), SPINE.FEED_CAP);
      return got.map(it => ({ ...it, source_name: s.name, source_tier: s.tier, territory: s.territories[0] || null }));  // it.image rides along
    }));
    settled.forEach((res, j) => {
      if (res.status === 'fulfilled') items.push(...res.value);
      else feedErrors.push(chunk[j].name + ':' + String(res.reason && res.reason.message || res.reason).slice(0, 40));
    });
  }
  // GDELT breadth sweep — tier 4, never sole evidence, rotating lanes.
  for (const lane of lanes) {
    try {
      const sig = await gatherServerSignals(lane.q);
      // Belt behind the query filter. Deliberately permissive: an unknown lang
      // PASSES. An exact === 'English' against a field whose casing is
      // unverified would drop every article and take tier 4 to zero in
      // silence - and in the legacy fallback it would empty raw[] and return
      // no_signal, which is the paper going dark. gdelt:"kept/seen" rides out
      // on spine_slice so a filter that starts eating the wire says so on the
      // first cron instead of never.
      const news = sig.filter(s => s.signalType === 'news' && s.url);
      const eng = news.filter(s => !s.lang || /^(english|eng|en)$/i.test(String(s.lang).trim()));
      gdeltSeen += news.length;
      gdeltKept += Math.min(eng.length, SPINE.GDELT_CAP);
      eng.slice(0, SPINE.GDELT_CAP).forEach(s => items.push({
        title: s.title, url: s.url, summary: s.snippet || '', published_at: null,
        image: /^https?:\/\//.test(String(s.image || '')) ? String(s.image).slice(0, 500) : null,
        source_name: s.source || 'GDELT', source_tier: 4, territory: null
      }));
    } catch (e) {}
  }
  // in-memory dedup by fingerprint, then bulk insert (dupes vs the lake ignored).
  const byHash = new Map();
  for (const it of items) {
    const hash = await sha256hex(hashInput(it.title, it.url));
    if (!byHash.has(hash)) byHash.set(hash, { ...it, content_hash: hash, status: 'raw' });
  }
  const rows = [...byHash.values()].slice(0, SPINE.MAX_NEW);
  let fresh = [];
  if (rows.length) {
    fresh = await sbRest(env, 'signals?on_conflict=content_hash&select=id,content_hash,title,summary,source_name,source_tier,territory,image', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: rows
    }) || [];
  }
  return { captured: items.length, unique: rows.length, fresh, feedErrors,
    gdelt: gdeltSeen ? (gdeltKept + '/' + gdeltSeen) : null };
}

/* spineAdvance — the budgeted drain. Pulls its OWN backlog from the lake
 * by status, spends at most `budget` subrequests (free-tier law: every
 * fetch/AI/sb call counts), and stops mid-stage when the wallet empties.
 * Fully resumable: whatever is left advances on the next slice. */

/* ═══ SEAM:DAILY_COMPOSER — twelve from the lake. Candidates are recent
 * connected/filtered signals; a PURE slot-filler enforces the POV edition
 * template (per-territory max, edge quota); a PURE format law assigns the
 * six shapes; INTERPRET+APPLY (t3, the voice layer) writes each take.
 * The legacy synthesis path survives untouched as the fallback — the
 * paper can never again starve on a single upstream. ═══ */

// PURE: greedy fill under the POV quotas. cands sorted by score desc.
/* Language is never stored on a signal, so the lake cannot be asked what it
 * cannot read: rows already inside the 36h window predate the capture filter,
 * and a wire this broad will find a way in again. This is the belt at the door
 * of the paper itself.
 *
 * Ratio, not presence. 'Uniqlo (\u30e6\u30cb\u30af\u30ed) launches X' is an English headline;
 * dropping it over one katakana would be a permanent, silent false negative -
 * exactly the bug class that cost this pipeline seven dark days. Ask the real
 * question: is this headline PREDOMINANTLY not Latin script?  */
const NON_LATIN_G = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f]/g;
function mostlyNonLatin(s) {
  const t = String(s || '');
  if (!t) return false;
  const m = t.match(NON_LATIN_G);
  return !!m && m.length / t.length > 0.3;
}

/* ONE STORY, ONE SLOT. The lake's hash dedup kills identical fingerprints
 * and the spine MEASURES echo \u2014 but the composer never took the test,
 * so three writeups of one drop could ride the same momentum wave into
 * three slots. The edition now applies the doctrine's own bar at the
 * door: embedding cosine >= CLUSTER_SIM (0.80) is the same story. When a
 * vector is missing, the backstop is title content-token containment \u2014
 * >= 0.5 within one source, >= 0.75 across sources. */
function vecParse(e) {
  if (Array.isArray(e)) return e;
  if (typeof e !== 'string' || e[0] !== '[') return null;
  try { const v = JSON.parse(e); return Array.isArray(v) ? v : null; } catch { return null; }
}
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}
const STORY_STOP = new Set(['the','a','an','is','are','was','its','it','of','to','in','on','for','and','with','at','this','that','from','by','as','his','her','their','our','your']);
function titleTokens(t) {
  return new Set(String(t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(x => x.length > 1 && !STORY_STOP.has(x)));
}
function sameStory(a, b) {
  if (a._vec && b._vec) return cosineSim(a._vec, b._vec) >= SPINE.CLUSTER_SIM;
  const ta = titleTokens(a.title), tb = titleTokens(b.title);
  if (!ta.size || !tb.size) return false;
  let ov = 0, ent = 0;
  for (const x of ta) if (tb.has(x)) { ov++; if (x.length >= 5) ent++; }
  const contain = ov / Math.min(ta.size, tb.size);
  const sameSrc = a.source_name && a.source_name === b.source_name;
  if (contain >= (sameSrc ? 0.5 : 0.75)) return true;
  // entity law: two substantial shared names is the same subject \u2014
  // three outlets, one merger, one slot.
  return ent >= 2 && contain >= 0.3;
}
function slotFill(cands, quotas) {
  const picks = [], perT = {};
  for (const c of cands) {
    if (picks.length >= 12) break;
    if (picks.some(p => sameStory(p, c))) continue;   // one story, one slot
    const t = c.territory || 'unknown';
    if ((perT[t] || 0) >= quotas.per_territory_max) continue;
    perT[t] = (perT[t] || 0) + 1;
    picks.push(c);
  }
  // edge law: at least one Tier-3 story if the lake holds one.
  if (quotas.edge_min > 0 && !picks.some(p => p.source_tier === 3)) {
    const edge = cands.find(c => c.source_tier === 3 && !picks.includes(c)
      && !picks.slice(0, -1).some(p => sameStory(p, c)));
    if (edge && picks.length) {
      let low = picks.length - 1;                       // swap out the weakest
      picks[low] = edge;
    }
  }
  return picks;
}

// PURE: the six shapes. idx 0 = LEAD; 1-2 = FEATURES (reads when connected).
function assignFormat(c, idx, haveProvocation) {
  if (idx === 0) return 'dispatch';
  const breadth = (c.momentum && c.momentum.breadth) || 0;
  if ((idx === 1 || idx === 2) && breadth >= 2) return 'read';
  if (c.source_tier === 3) return 'signal';
  if (/\d{2,}|\$\d|%/.test(c.title || '')) return 'number';
  if (/launch|debut|unveil|drops?\b|releases?\b/i.test(c.title || '')) return 'drop';
  if (!haveProvocation && idx >= 9) return 'provocation';
  return 'dispatch';
}

async function composeFromLake(env, today) {
  const since = new Date(Date.now() - 36 * 3600e3).toISOString();
  const cands = (await sbRest(env,
    `signals?status=in.(connected,filtered)&captured_at=gte.${since}` +
    '&order=captured_at.desc&limit=120' +
    '&select=id,url,title,summary,source_name,source_tier,territory,image,momentum,status'
  ) || []).filter(c => c.title && c.url && !mostlyNonLatin(c.title));
  if (cands.length < 6) return null;

  const dims = DAILY_POV.momentum.dims;
  cands.forEach(c => {
    const m = c.momentum || {};
    c.score = dims.reduce((s, d) => s + (Number(m[d]) || 0), 0)
      + (c.source_tier === 1 ? 1 : 0) + (c.status === 'connected' ? 1 : 0);
  });
  cands.sort((a, b) => b.score - a.score);

  // arm the same-story test: vectors for the ranked head, one fetch.
  const head = cands.slice(0, 40);
  try {
    const vecs = await sbRest(env,
      `signals?id=in.(${head.map(c => c.id).join(',')})&select=id,embedding`) || [];
    const byId = {}; for (const v of vecs) byId[v.id] = vecParse(v.embedding);
    for (const c of head) c._vec = byId[c.id] || null;
    const armed = head.filter(c => c._vec).length;
    await logEvent(env, 'daily', 'compose', 'dedup_vectors', null, { head: head.length, armed });
  } catch (e) { /* vectors missing -> title backstop carries the test */ }

  /* SEAM:APERTURE — cross-issue memory. slotFill deduped within one issue;
   * nothing remembered yesterday, so the same story re-entered daily — the
   * repetition Fresco named. Now the trailing 7 days of published stories
   * are the memory: a candidate matching a recent pick (sameStory: vector
   * or entity law) is suppressed from fresh slots and counted — the count
   * ships in the compose log today and feeds the RECURRENCE strip next.
   * Failure to fetch history never blocks an edition. */
  let recurring = 0;
  let pool = cands;
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const prior = await sbRest(env,
      `edition_items?select=title,source_name,editions!inner(date,status)&editions.date=gte.${since}&editions.status=eq.published&limit=120`) || [];
    if (prior.length) {
      const fresh = [];
      for (const c of pool) {
        if (prior.some(p => sameStory(p, c))) { recurring++; continue; }
        fresh.push(c);
      }
      if (fresh.length >= 6) pool = fresh;
      await logEvent(env, 'daily', 'compose', 'cross_issue_dedup', null, { prior: prior.length, suppressed: recurring, fresh: fresh.length });
    }
  } catch (e) { /* memoryless compose beats no compose */ }

  const picks = slotFill(pool, DAILY_POV.edition.quotas);
  if (picks.length < 6) return null;

  // lead + features are the three big cards - the template has said so since
  // day one and the composer never read it. `image` was selected and never
  // scored, so a story with no key visual ranked exactly like one with, and
  // Issue 003 shipped two of three visual slots empty. picks is score-ordered,
  // so the first match is the strongest available. Format law is positional
  // (idx 0 is always dispatch), so a swap changes which story wears which
  // format, never the distribution. Nothing has an image -> nothing moves:
  // degrade, never starve.
  const visualSlots = DAILY_POV.edition.lead + DAILY_POV.edition.features;
  for (let i = 0; i < Math.min(visualSlots, picks.length); i++) {
    if (picks[i].image) continue;
    const j = picks.findIndex((p, k) => k > i && p.image);
    if (j > i) { const t = picks[i]; picks[i] = picks[j]; picks[j] = t; }
  }

  const items = [];
  let haveProv = false;
  for (let i = 0; i < picks.length; i++) {
    const c = picks[i];
    const format = assignFormat(c, i, haveProv);
    if (format === 'provocation') haveProv = true;
    let take = '', apply = null;
    try {
      const reply = await callModel(env, 't3', [
        { role: 'system', content: DAILY_POV.stages.interpret + ' Then, on its own final line: ' + DAILY_POV.stages.apply },
        { role: 'user', content: 'TITLE: ' + c.title + '\nSUMMARY: ' + (c.summary || '(none)') +
          '\nSOURCE: ' + c.source_name + ' (tier ' + c.source_tier + ')\nTERRITORY: ' + c.territory }
      ], { max_tokens: 320 });
      const lines = String(reply || '').trim().split('\n').map(s => s.trim()).filter(Boolean);
      const tagLine = lines.findIndex(l => /\[(creative|founder|marketer|exec|talent)\]/i.test(l));
      if (tagLine >= 0) { apply = studioTrimClean(lines[tagLine], 240); lines.splice(tagLine, 1); }
      take = studioTrimClean(lines.join(' '), 800);
    } catch (e) { /* voice failure → factual fallback below */ }
    if (!take) take = studioTrimClean(c.summary || c.title, 400);
    items.push({
      kicker: String(c.territory || 'the signal').replace(/-/g, ' ').toUpperCase().slice(0, 40),
      headline: studioTrimClean(c.title, 200),
      standfirst: firstSentences(c.summary, 220) || firstSentences(take, 220) || null,
      take,
      source_name: String(c.source_name || '').slice(0, 120),
      source_url: c.url,
      image_url: /^https?:\/\//.test(String(c.image || '')) ? c.image : null,
      lang: null,
      beat: DAILY_POV.beat_map[c.territory] || 'culture',
      territory: c.territory, format, apply,
      signal_id: c.id, momentum: c.momentum || null
    });
  }
  return { lead: items[0].headline, items };
}

async function spineAdvance(env, budget) {
  // Drain newest-first. composeFromLake only sees captured_at >= now-36h, so
  // oldest-first spends every call on rows the paper can never print and the
  // lake reads 0/6 until the whole backlog clears. Today's signal goes first;
  // the stale tail drains behind it on leftover budget.
  let calls = 0;
  const stats = { embedded: 0, filtered: 0, rejected: 0, connected: 0 };
  const vecOf = (e) => Array.isArray(e) ? e : (typeof e === 'string' ? JSON.parse(e) : null);
  // pgvector takes a bracketed literal. A raw JS array serializes toward PG
  // '{...}' and vector(384) refuses it — kbEmbed has always done it this way.
  const vecStr = (v) => '[' + v.join(',') + ']';
  // ON CONFLICT DO UPDATE forms the whole tuple before it resolves the
  // conflict, so a partial body trips NOT NULL on title/url (23502). Every
  // upsert carries back the row it just read.
  const carry = (r) => ({ content_hash: r.content_hash, title: r.title, url: r.url,
    summary: r.summary, image: r.image, published_at: r.published_at,
    source_name: r.source_name, source_tier: r.source_tier, territory: r.territory });
  const errs = [];

  // E · EMBED backlog: raw rows without vectors.
  if (calls + 3 <= budget) {
    calls++;
    let back = [];
    try { back = await sbRest(env, 'signals?status=eq.raw&embedding=is.null&order=captured_at.desc&limit=32&select=content_hash,title,url,summary,image,published_at,source_name,source_tier,territory,status') || []; }
    catch (e) { back = []; }
    for (let i = 0; i < back.length && calls + 2 <= budget; i += SPINE.EMBED_BATCH) {
      const batch = back.slice(i, i + SPINE.EMBED_BATCH);
      try {
        calls++;
        const out = await env.AI.run(KB_EMBED_MODEL, {
          text: batch.map(r => (r.title + '. ' + (r.summary || '')).slice(0, 512))
        });
        const data = (out && out.data) || [];
        if (data.length !== batch.length) throw new Error('embed_shape');
        calls++;
        await sbRest(env, 'signals?on_conflict=content_hash', {
          method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
          body: batch.map((r, j) => Object.assign({}, r, { embedding: vecStr(data[j]) }))
        });
        stats.embedded += batch.length;
      } catch (e) { errs.push('embed:' + String(e && e.message).slice(0, 50)); }
    }
  }

  // F · FILTER backlog: raw rows WITH vectors — echo kill + t1 classify.
  if (calls + 4 <= budget) {
    calls++;
    const back = await sbRest(env, 'signals?status=eq.raw&embedding=not.is.null&order=captured_at.desc&limit=12&select=id,content_hash,title,url,summary,image,published_at,source_name,source_tier,territory,embedding,momentum') || [];
    const updates = [];
    for (const r of back) {
      if (calls + 3 > budget) break;
      const vec = vecOf(r.embedding);
      if (!vec) continue;
      try {
        calls++;
        const near = await sbRest(env, 'rpc/match_signals', { method: 'POST', body: { p_query: vec, p_count: 2 } }) || [];
        const echo = near.find(n => n.id !== r.id && n.similarity >= SPINE.ECHO_SIM);
        if (echo) { updates.push(Object.assign(carry(r), { status: 'rejected', momentum: { echo_of: echo.id } })); stats.rejected++; continue; }
        calls++;
        const reply = await callModel(env, 't1', [
          { role: 'system', content: DAILY_POV.stages.filter + ' Territories: ' + DAILY_POV.territories.join(', ') + '.' },
          { role: 'user', content: 'TITLE: ' + r.title + '\nSUMMARY: ' + (r.summary || '(none)') + '\nSOURCE: ' + r.source_name }
        ], { max_tokens: 160 });
        const j = parseModelJson(reply) || {};
        const territory = DAILY_POV.territories.includes(j.territory) ? j.territory : (r.territory || 'technology-innovation');
        const novelty = Math.max(0, Math.min(5, Number(j.novelty) || 0));
        if (j.announcement === true && novelty <= 1) {
          updates.push(Object.assign(carry(r), { territory, status: 'rejected', momentum: { novelty, announcement: true } }));
          stats.rejected++;
        } else {
          // merge, never replace: momentum.promoted is the receipt for a hand-
          // promoted signal and must outlive every stage that touches the row.
          updates.push(Object.assign(carry(r), { territory, status: 'filtered', momentum: Object.assign({}, r.momentum, { novelty, note: String(j.note || '').slice(0, 90) }) }));
          stats.filtered++;
        }
      } catch (e) { errs.push('filter:' + String(e && e.message).slice(0, 50)); }
    }
    if (updates.length && calls + 1 <= budget) {
      calls++;
      await sbRest(env, 'signals?on_conflict=content_hash', {
        method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: updates
      });
    }
  }

  // C · CONNECT backlog: filtered rows — neighbors, clusters, momentum.
  if (calls + 5 <= budget) {
    calls++;
    const back = await sbRest(env, 'signals?status=eq.filtered&order=captured_at.desc&limit=8&select=id,content_hash,title,url,summary,image,published_at,source_name,source_tier,territory,embedding,momentum') || [];
    const found = [], anchors = new Set();
    for (const r of back) {
      if (calls + 3 > budget) break;
      const vec = vecOf(r.embedding);
      if (!vec) { errs.push('connect:no_vec'); continue; }
      try {
        calls++;
        // Two args, not three. PostgREST resolves rpc/ by the EXACT set of named
        // arguments - {p_query,p_count,p_since} against match_signals(p_query,
        // p_count) is a 404, not a fallback to the closest overload. FILTER's
        // two-arg call is the proven shape; it is why echo-kill works at all.
        // The p_since window was never read: this threw on every row since the
        // day it was written, and `catch (e) {}` ate it, so CONNECT has never
        // run once. Losing the 14-day bound is a gain, not a cost - anchors may
        // now reach the whole archive, which is what recurrence actually wants.
        // p_count was 6. Every momentum dim is computed from this sample, so a
        // story carried by 6 outlets and one carried by 60 produced identical
        // momentum - and the composer ranks on those dims, which meant velocity,
        // breadth and depth could not spread and the paper was effectively
        // ranked by tier and a model's novelty guess. 40 costs the same single
        // subrequest; HNSW does not care and the payload is ~20KB.
        const near = (await sbRest(env, 'rpc/match_signals', {
          method: 'POST', body: { p_query: vec, p_count: 40 }
        }) || []).filter(n => n.id !== r.id);
        const anchor = near.find(n => n.similarity >= SPINE.CLUSTER_SIM);
        if (anchor) anchors.add(anchor.id);
        found.push({ r, near, anchorId: anchor ? anchor.id : null });
      } catch (e) { errs.push('connect:' + String(e && e.message).slice(0, 50)); }
    }
    let clusterOf = {};
    if (anchors.size && calls + 1 <= budget) {
      calls++;
      const det = await sbRest(env, `signals?id=in.(${[...anchors].join(',')})&select=id,cluster_id`) || [];
      det.forEach(d => { clusterOf[d.id] = d.cluster_id; });
    }
    const updates = found.map(({ r, near, anchorId }) => {
      const cluster_id = (anchorId && clusterOf[anchorId]) || crypto.randomUUID();
      const novelty = (r.momentum && r.momentum.novelty) || 0;
      const m = momentumMech(near, r.territory, r.source_tier, novelty);
      return Object.assign(carry(r), { cluster_id, status: 'connected',
        momentum: Object.assign({}, r.momentum, m, { neighbors: near.slice(0, 4).map(n => n.id) }) });
    });
    if (updates.length && calls + 1 <= budget) {
      calls++;
      await sbRest(env, 'signals?on_conflict=content_hash', {
        method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: updates
      });
      // Count what landed. The increment used to fire inside the .map(), so a
      // skipped or failed upsert still reported connected:8 - the same lie
      // stats.embedded told for seven days.
      stats.connected += updates.length;
    }
  }
  stats.calls = calls;
  if (errs.length) stats.errors = errs.slice(0, 6);
  return stats;
}

async function runDailySpine(env, opts) {
  const t0 = Date.now();
  let cap = { captured: 0, unique: 0, fresh: [], feedErrors: [] };
  try { cap = await spineCapture(env, opts); }
  catch (e) { cap.feedErrors.push('capture:' + String(e && e.message).slice(0, 60)); }
  let adv = {};
  try { adv = await spineAdvance(env, (opts && opts.advance) || 22); }
  catch (e) { adv = { advance_error: String(e && e.message).slice(0, 60) }; }
  // cap is hand-picked, not spread: anything spineCapture computes and this
  // list omits is silently discarded here. gdelt was computed correctly and
  // dropped on this exact line - a measurement thrown away one function above
  // the one that made it, which is the whole bug class this pipeline exists
  // to have stopped doing. Add the field here or it does not exist.
  const stats = {
    captured: cap.captured, unique: cap.unique, fresh: cap.fresh.length,
    gdelt: cap.gdelt || null,
    ...adv, feed_errors: cap.feedErrors.slice(0, 8), ms: Date.now() - t0
  };
  await logEvent(env, 'daily', null, 'spine_run', null, stats);
  return stats;
}


/* ═══ SEAM:EXCAVATE — the lake as recon surface. Two doors, both for
 * signed-in members, both rate-limited: /excavate/lake (semantic search
 * over everything the spine ever captured, with territory/tier/window
 * filters) and /excavate/cluster (a signal's neighborhood + the
 * provenance thread to any published DAILY story). Every source added
 * to the registry deepens this surface automatically. ═══ */
async function excavateAuth(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user) return { err: json({ ok: false, error: 'auth_required' }, 401, origin, env) };
  if (!(await underLimit(env, user.id)))
    return { err: json({ ok: false, error: 'rate_limited' }, 429, origin, env) };
  return { user };
}

/* SEAM:MOAT_1 — computed brand signal. PURE math over lake matches; the
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

/* SEAM:LAKE_LOOP — the organism's first closed loop: approved MINE field
 * work enters the lake as TIER-0 signal, the highest trust rank the platform
 * has, because it is the one source no competitor can retrieve: what real
 * people told Unsurfaced, on the record, floor-cleared. Laws: admin-only
 * (editorial gate is a human), floor law travels (no floor, no publish),
 * idempotent (content_hash = mine-{study_id}, republish merges), doc
 * embedding raw title+summary per the book (prefix is for queries only).
 */
function mineSignalSummary(study, agg) {
  let out = String(study.goal || '').trim();
  const bits = [];
  for (const q of (agg.questions || []).slice(0, 3)) {
    if (q.type === 'open' || !q.counts) continue;
    const keys = Object.keys(q.counts).sort((a, b) => q.counts[b] - q.counts[a]);
    if (!keys.length) continue;
    const top = keys[0];
    const pct = q.pct && q.pct[top] != null ? q.pct[top] + '%' : q.counts[top] + ' of ' + q.answered;
    bits.push('"' + String(q.prompt).slice(0, 70) + '" \u2192 ' + String(top).slice(0, 40) + ' (' + pct + ')');
    const fk = q.clicks && q.clicks.first && Object.keys(q.clicks.first).sort((a, b) => q.clicks.first[b] - q.clicks.first[a])[0];
    if (fk) bits.push('first click: ' + String(fk).slice(0, 40));
  }
  if (bits.length) out += ' \u2014 Field results (' + agg.n + ' quality responses): ' + bits.join(' \u00b7 ');
  return out.slice(0, 460);
}

async function minePublishSignal(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  const uid = gate.user && gate.user.id;
  if (!uid || !(await callerIsAdmin(env, uid)))
    return json({ ok: false, error: 'admin_only' }, 200, origin, env);
  let body = {}; try { body = await request.json(); } catch (e) {}
  const sid = String(body.study_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(sid)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,title,goal,status`);
  const study = ss && ss[0];
  if (!study) return json({ ok: false, error: 'not_found' }, 200, origin, env);
  const qs = await sbRest(env, `study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options,asset_name&order=ord`) || [];
  const rows = await sbRest(env, `response?study_id=eq.${sid}&select=anon_id,segments,answers,clicks,quality_status&limit=2000`) || [];
  const agg = aggregateResponses(rows, qs, RAIL.CLIENT_FLOOR);
  if (agg.floor_met) {
    const live = rows.filter(r => r.quality_status !== 'rejected');
    for (const q of agg.questions) { const cs = clickSummary(live, q.id); if (cs) q.clicks = cs; }
  }
  if (!agg.floor_met)
    return json({ ok: false, error: 'below_floor', note: 'the floor law travels: ' + RAIL.CLIENT_FLOOR + ' quality responses before anything enters the lake' }, 200, origin, env);
  const title = 'Field study: ' + String(study.title || '').slice(0, 110);
  const summary = mineSignalSummary(study, agg);
  const er = await env.AI.run(KB_EMBED_MODEL, { text: [(title + '. ' + summary).slice(0, 512)] });
  const vec = er && er.data && er.data[0];
  if (!vec) return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
  await sbRest(env, 'signals?on_conflict=content_hash', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: [{ content_hash: 'mine-' + sid, title, summary,
      url: (env.APP_URL || '').replace(/\/$/, '') + '/intelligence/',
      source_name: 'Unsurfaced MINE', source_tier: 0, territory: 'field',
      status: 'filtered', published_at: new Date().toISOString(),
      embedding: '[' + vec.join(',') + ']' }] });
  try { await logEvent(env, 'intelligence', 'mine', 'lake_publish', uid, { study: sid, n: agg.n }); } catch (e) {}
  return json({ ok: true, published: { title, n: agg.n } }, 200, origin, env);
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

async function excavateLake(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const q = String(body.q || '').trim().slice(0, 200);
  if (!q) return json({ ok: false, error: 'q_required' }, 200, origin, env);
  const territory = DAILY_POV.territories.includes(body.territory) ? body.territory : null;
  const maxTier = Math.min(4, Math.max(1, parseInt(body.max_tier, 10) || 4));
  const days = Math.min(365, Math.max(0, parseInt(body.days, 10) || 0));
  const count = Math.min(24, Math.max(1, parseInt(body.count, 10) || 12));
  try {
    const vec = await embedQuery(env, q);          // query side - prefixed
    if (!vec) return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
    const rows = await sbRest(env, 'rpc/match_signals', {
      method: 'POST',
      body: { p_query: vec, p_count: count, p_territory: territory, p_min_tier: maxTier,
              p_since: days ? new Date(Date.now() - days * 24 * 3600e3).toISOString() : null }
    }) || [];
    return json({ ok: true, q, count: rows.length, results: rows.map(r => ({
      id: r.id, title: r.title, url: r.url, summary: r.summary,
      source_name: r.source_name, source_tier: r.source_tier,
      territory: r.territory, status: r.status, captured_at: r.captured_at,
      momentum: r.momentum, similarity: Math.round((r.similarity || 0) * 1000) / 1000,
      provenance: 'lake'
    })), field: await fieldRail(env, q) }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'lake_unavailable' }, 200, origin, env);
  }
}

/* ═══ SEAM:FIELD_RAIL — the law before the provider. EXCAVATE can only ever
 * see what the spine captured; the registry is the ceiling on every insight
 * it produces. Live reach past that ceiling is legitimate — the surface is
 * interactive, one query at a time, and a human is the filter — but a live
 * result and a lake row are not the same kind of thing and must never share
 * a list.
 *
 * A lake row carries source_tier, captured_at, cluster_id, momentum and a
 * provenance thread to published DAILY stories. A field result carries none
 * of it: no embedding, no cluster, no recurrence, no tier. Return them
 * blended and you have laundered a web scrape as archive intelligence — the
 * one thing the buyer we are chasing is trained to catch.
 *
 * So: two rails, structurally separate, each item declaring its own
 * provenance. The field rail's field set is deliberately thin. You cannot
 * render a field result as a lake row because it has no tier to render.
 * The shape IS the law.
 *
 * No provider is attached. That is on purpose — the law ships before the
 * fetcher. To attach one, implement fetch inside this function against a
 * chosen provider and set FIELD_API_KEY; the contract is:
 *   { title, url, summary, source_name } — and nothing else. Anything richer
 *   belongs in the lake, which is what SEAM:PROMOTE is for.  ═══ */
async function fieldRail(env, q) {
  const off = (note) => ({ enabled: false, provider: null, count: 0, results: [], note });
  if (!env.FIELD_API_KEY) return off('no field provider attached — set FIELD_API_KEY');
  if (!q) return off('no query');
  try {
    // Tavily: POST /search, Bearer auth, 1000 calls/month free. Chosen over
    // NVIDIA because NVIDIA's trial terms bar production and Generated Content
    // in production outright, and EXCAVATE serves signed-in partners - that is
    // 'activity serving real end-users' by their own FAQ. A platform sold
    // against Nielsen cannot run on someone's evaluation licence.
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.FIELD_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: String(q).slice(0, 300), search_depth: 'basic',
        max_results: 6, include_answer: false, include_raw_content: false })
    });
    if (!r.ok) return off('field_http_' + r.status);   // fail closed AND say why
    const j = await r.json().catch(() => null);
    const rows = (j && Array.isArray(j.results) ? j.results : [])
      .filter(x => x && x.title && /^https?:\/\//.test(String(x.url || '')))
      .slice(0, 6)
      .map(x => ({
        // Deliberately thin. No tier, no momentum, no cluster, no captured_at.
        // A field result cannot be rendered as a lake row because it has
        // nothing to render them from. The shape is the law.
        title: String(x.title).slice(0, 300),
        url: String(x.url).slice(0, 500),
        summary: String(x.content || '').slice(0, 600),
        source_name: (() => { try { return new URL(x.url).hostname.replace(/^www\./, ''); } catch (e) { return 'field'; } })(),
        provenance: 'field'
      }));
    return { enabled: true, provider: 'tavily', count: rows.length, results: rows,
      fetched_at: new Date().toISOString(),
      note: rows.length ? null : 'provider returned no usable results' };
  } catch (e) {
    return off('field_error: ' + String(e && e.message).slice(0, 80));
  }
}

/* ═══ SEAM:PROMOTE — how the lake grows by hand. A field result that proves
 * out gets promoted: hashed on the same fingerprint as capture, tiered by the
 * member who promoted it, and inserted at status:'raw'. From there the spine
 * owns it — and because the drain runs newest-first, a promotion is embedded
 * on the very next slice, filtered after, clustered after that. It then
 * participates in recurrence like anything else.
 *
 * This is the answer to the source problem RSS hides from you. RSS hands you
 * editorial filtering for free, which is exactly why it is an echo; a
 * firehose like X would take that filter away and starve FILTER at 12 rows a
 * slice. Promotion puts the filter back where it belongs: one analyst, one
 * judgement, one row. The tier question dissolves too — a designer with 200
 * followers has no institutional tier, so the person who saw it assigns one.
 *
 * The receipt rides in momentum.promoted: who, when, which provider, and the
 * query that surfaced it. That thread is the authority substitute — Mintel
 * says trust us, this says here is when we first saw it and who called it.
 * FILTER and CONNECT merge rather than replace momentum so it survives.  ═══ */
async function excavatePromote(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const title = String(body.title || '').trim().slice(0, 300);
  const url = String(body.url || '').trim().slice(0, 500);
  if (!title) return json({ ok: false, error: 'title_required' }, 200, origin, env);
  if (!/^https?:\/\//.test(url)) return json({ ok: false, error: 'url_required' }, 200, origin, env);
  const tier = Math.min(4, Math.max(1, parseInt(body.tier, 10) || 3));
  const territory = DAILY_POV.territories.includes(body.territory) ? body.territory : null;
  try {
    const hash = await sha256hex(hashInput(title, url));
    const row = {
      content_hash: hash, title, url,
      summary: String(body.summary || '').slice(0, 1200),
      image: /^https?:\/\//.test(String(body.image || '')) ? String(body.image).slice(0, 500) : null,
      published_at: null,
      source_name: String(body.source_name || 'FIELD').slice(0, 120),
      source_tier: tier, territory, status: 'raw',
      momentum: { promoted: {
        by: gate.user.id, at: new Date().toISOString(),
        provider: String(body.provider || 'manual').slice(0, 40),
        q: String(body.q || '').slice(0, 200)
      } }
    };
    const back = await sbRest(env, 'signals?on_conflict=content_hash&select=id,content_hash', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: [row]
    }) || [];
    const landed = back[0] || null;
    await logEvent(env, 'intelligence', 'excavate', 'promote', null,
      { tier, territory, provider: row.momentum.promoted.provider, fresh: !!landed });
    return json({ ok: true, promoted: !!landed, already_in_lake: !landed,
      content_hash: hash, id: landed ? landed.id : null,
      note: landed ? 'entered the lake at raw — embedded on the next slice' : 'already captured; not duplicated'
    }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'promote_failed', detail: String(e && e.message).slice(0, 120) }, 200, origin, env);
  }
}

async function excavateCluster(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const id = String(body.id || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return json({ ok: false, error: 'bad_id' }, 200, origin, env);
  try {
    const sigRows = await sbRest(env, `signals?id=eq.${id}` +
      '&select=id,title,url,summary,source_name,source_tier,territory,status,captured_at,momentum,cluster_id,embedding,edition_item_id');
    const sig = sigRows && sigRows[0];
    if (!sig) return json({ ok: false, error: 'not_found' }, 200, origin, env);
    const byId = new Map();
    if (sig.cluster_id) {
      const kin = await sbRest(env, `signals?cluster_id=eq.${sig.cluster_id}&id=neq.${id}` +
        '&order=captured_at.desc&limit=20' +
        '&select=id,title,url,source_name,source_tier,territory,status,captured_at,momentum,edition_item_id') || [];
      kin.forEach(k => byId.set(k.id, k));
    }
    const vec = Array.isArray(sig.embedding) ? sig.embedding
      : (typeof sig.embedding === 'string' ? JSON.parse(sig.embedding) : null);
    if (vec) {
      const near = await sbRest(env, 'rpc/match_signals', {
        method: 'POST', body: { p_query: vec, p_count: 8 }
      }) || [];
      near.filter(n => n.id !== id).forEach(n => { if (!byId.has(n.id)) byId.set(n.id, n); });
    }
    const cluster = [...byId.values()].slice(0, 20);
    // the provenance thread: which of these made the paper, and when.
    const itemIds = [sig, ...cluster].map(r => r.edition_item_id).filter(Boolean);
    let published = [];
    if (itemIds.length) {
      const its = await sbRest(env, `edition_items?id=in.(${itemIds.join(',')})&select=id,edition_id,headline`) || [];
      const edIds = [...new Set(its.map(i => i.edition_id))];
      const eds = edIds.length
        ? await sbRest(env, `editions?id=in.(${edIds.join(',')})&select=id,issue_no,date`) || [] : [];
      const edBy = new Map(eds.map(e => [e.id, e]));
      published = its.map(i => ({ item_id: i.id, headline: i.headline,
        issue_no: (edBy.get(i.edition_id) || {}).issue_no || null,
        date: (edBy.get(i.edition_id) || {}).date || null }));
    }
    const recurrence = clusterPulse([sig].concat(cluster));
    delete sig.embedding;
    return json({ ok: true, signal: sig, recurrence, cluster, published }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'cluster_unavailable' }, 200, origin, env);
  }
}

/* ═══ SEAM:RECURRENCE — the lake's long memory made legible. A theme that
 * keeps resurfacing across weeks is the compounding the POV's §08 promised.
 * POST /excavate/recurrence (member-gated, rate-limited): one bounded
 * select over recent connected/published signals, a PURE rollup grouped
 * by cluster_id, ranked by persistence — weeks touched, span, members,
 * source breadth, paper provenance. Zero model calls, zero writes.
 * /excavate/cluster now carries its own cluster's pulse for free. ═══ */
const RECUR = { WINDOW_D: 60, SCAN: 800, MIN_WEEKS: 2, TOP: 12,
  SLICES: 10, SLICE_ROWS: 120 };

/* SEAM:FIELD_STATE amendment — the date-honest scan. A single newest-first
 * fetch under a date filter is a lie at volume: at ~400 captures/day the 800
 * newest rows of a "60-day" window span two days, and recurrence over two
 * days is structurally zero. This fetches RECUR.SLICES equal spans of the
 * window in parallel, RECUR.SLICE_ROWS per slice (10 x 120 = 1200 rows,
 * every week represented). A failed slice contributes [] rather than killing
 * the scan — a thin week is data, a dead fetch is not. */
async function fetchRecurrenceRows(env, days, territory) {
  const nowMs = Date.now();
  const sliceMs = (days * 864e5) / RECUR.SLICES;
  const base = 'signals?status=in.(connected,published)&cluster_id=not.is.null' +
    (territory ? '&territory=eq.' + territory : '') +
    '&order=captured_at.desc&limit=' + RECUR.SLICE_ROWS +
    '&select=id,cluster_id,title,url,source_name,source_tier,territory,status,captured_at,edition_item_id';
  const fetches = [];
  for (let i = 0; i < RECUR.SLICES; i++) {
    const hi = new Date(nowMs - i * sliceMs).toISOString();
    const lo = new Date(nowMs - (i + 1) * sliceMs).toISOString();
    fetches.push(sbRest(env, base + '&captured_at=gte.' + lo + '&captured_at=lt.' + hi)
      .catch(function () { return []; }));
  }
  const slices = await Promise.all(fetches);
  const rows = [];
  for (const sl of slices) if (Array.isArray(sl)) rows.push.apply(rows, sl);
  return rows;
}

function weekEpoch(ts) { return Math.floor(new Date(ts).getTime() / 6048e5); }

// PURE: rows -> ranked recurring themes. Needs cluster_id + captured_at;
// title/url/source/tier/territory/edition_item_id enrich the read.
// minWeeks defaults to RECUR.MIN_WEEKS so existing callers are unchanged; it
// is a parameter because the floor was hardcoded here, which silently made
// SEAM:PROPOSE's min_weeks:1 preview a no-op - the rollup dropped one-week
// clusters before the caller could ever see them.
function recurrenceRollup(rows, top, minWeeks) {
  const floor = Math.max(1, parseInt(minWeeks, 10) || RECUR.MIN_WEEKS);
  const by = new Map();
  for (const r of rows || []) {
    if (!r.cluster_id || !r.captured_at) continue;
    let c = by.get(r.cluster_id);
    if (!c) {
      c = { cluster_id: r.cluster_id, members: 0, weeks: new Set(), sources: new Set(),
        territories: new Set(), first_seen: r.captured_at, last_seen: r.captured_at,
        published: 0, best_tier: 4, exemplar: null, hits: [] };
      by.set(r.cluster_id, c);
    }
    c.members++;
    c.hits.push(r.captured_at);
    c.weeks.add(weekEpoch(r.captured_at));
    if (r.source_name) c.sources.add(r.source_name);
    if (r.territory) c.territories.add(r.territory);
    if (r.captured_at < c.first_seen) c.first_seen = r.captured_at;
    if (r.captured_at >= c.last_seen) {
      c.last_seen = r.captured_at;
      c.exemplar = { id: r.id, title: r.title, url: r.url,
        source_name: r.source_name, territory: r.territory };
    }
    if (r.edition_item_id) c.published++;
    if (r.source_tier && r.source_tier < c.best_tier) c.best_tier = r.source_tier;
  }
  const out = [];
  const nowMs = Date.now();
  for (const c of by.values()) {
    if (c.weeks.size < floor) continue;
    const span_days = Math.round((new Date(c.last_seen) - new Date(c.first_seen)) / 864e5);
    // SEAM:FIELD_STATE — the rollup already walks every hit; the velocity
    // buckets and week series are free arithmetic on timestamps in hand.
    const recent_7d = c.hits.filter(ts => (nowMs - new Date(ts)) < 7 * 864e5).length;
    const prior_7d  = c.hits.filter(ts => {
      const d = nowMs - new Date(ts); return d >= 7 * 864e5 && d < 14 * 864e5; }).length;
    const wk = new Map();
    c.hits.forEach(ts => { const w = weekEpoch(ts); wk.set(w, (wk.get(w) || 0) + 1); });
    const wkeys = [...wk.keys()].sort((a, b) => a - b);
    const week_series = [];
    for (let w = wkeys[0]; w <= wkeys[wkeys.length - 1] && week_series.length < 32; w++)
      week_series.push(wk.get(w) || 0);
    out.push({
      cluster_id: c.cluster_id, weeks_touched: c.weeks.size, span_days,
      members: c.members, sources: c.sources.size, territories: [...c.territories],
      published: c.published, best_tier: c.best_tier,
      first_seen: c.first_seen, last_seen: c.last_seen, exemplar: c.exemplar,
      recent_7d, prior_7d, week_series,
      score: c.weeks.size * 10 + Math.min(span_days, 45) + c.members
        + c.sources.size * 2 + c.published * 3
    });
  }
  out.sort(function (a, b) { return b.score - a.score; });
  return out.slice(0, top || RECUR.TOP);
}

// PURE: one cluster's pulse, computed from rows already in hand.
function clusterPulse(rows) {
  const ts = (rows || []).map(function (r) { return r.captured_at; }).filter(Boolean).sort();
  if (!ts.length) return null;
  const weeks = new Set(ts.map(weekEpoch));
  return { members: ts.length, first_seen: ts[0], last_seen: ts[ts.length - 1],
    span_days: Math.round((new Date(ts[ts.length - 1]) - new Date(ts[0])) / 864e5),
    weeks_touched: weeks.size };
}

/* ═══ SEAM:PROPOSE — the lake writes its own themes.
 *
 * The featured surface runs on _FEATURED_POOL in intelligence/index.html: 32
 * theses typed by hand, each carrying stat:'↑ High signal' and bar:84 as
 * literals. The only live value on a card is an OpenAlex paper count for a
 * hardcoded query. It is a mockup wearing a counter, and it has been telling
 * on itself — 'WHICH BRANDS CONSUMERS ACTUALLY TRUST IN 2024', printed in 2026.
 *
 * The lake already holds every number bar:84 was pretending to be: weeks
 * touched, span, breadth, source count, paper provenance. recurrenceRollup
 * computes them. What a cluster lacks is a thesis.
 *
 * So the lake proposes and the editor disposes — SEAM:PROMOTE run the other
 * direction. There a human hands the lake a signal; here the lake hands a
 * human a theme. Neither publishes itself.
 *
 * Evidence is never invented: stat and bar are computed from the rollup, the
 * model is never shown either word, and it receives only the cluster's own
 * headlines. Every card declares provenance:'lake' so a proposal cannot be
 * mistaken for the curated pool — the two-rail law again.
 *
 * One t3 call for the whole batch, KV-cached 24h. This surface does not move
 * like DAILY and must not cost like it.
 *
 * NOTE: RECUR.MIN_WEEKS is 2, and cluster_id only began populating when
 * CONNECT first ran. Until clusters carry two weeks behind them this returns
 * [] — honestly, and saying why. That is recurrence working, not failing.
 * Pass min_weeks:1 to preview what it will say.  ═══ */
/* ═══ SEAM:FIELD_STATE — categories as states, not subjects.
 * A fixed taxonomy files stories in drawers that never learn. These functions
 * read the cluster registry the lake already keeps (cluster_id is lineage —
 * signals inherit it at CONNECT) and classify each theme's STATE from pure
 * arithmetic: no model call decides a state. CONTESTED alone needs geometry
 * (member-to-centroid tightness), fetched bounded and failure-soft. Every
 * threshold below is a named constant so tuning is one edit, not a hunt. ═══ */
const FIELD = {
  CONTEST_TIGHT: 0.62,  // below this mean cosine, the cluster disagrees with itself
  CONTEST_SRC: 5,       // ...and only counts as contested with real source volume
  EMERGE_WEEKS: 2, EMERGE_SPAN_D: 14,   // young and active = the window is open
  ACCEL_MIN: 3, ACCEL_MULT: 2,          // recent must double prior with real volume
  STRUCT_WEEKS: 5, STRUCT_QUIET_D: 21,  // long-lived and not gone quiet
  COOL_QUIET_D: 10,                      // silent this long with zero recent = exit
  GEO_CLUSTERS: 16, GEO_ROWS: 240, GEO_MEMBERS: 12
};
const FIELD_STATES = ['EMERGING', 'ACCELERATING', 'STRUCTURAL', 'COOLING', 'CONTESTED', 'STEADY'];

// PURE: cosine similarity, zero-safe.
function cosSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}

// PURE: rollup theme -> state. Order is the law: contested overrides everything
// (a fought-over story is not a trend), youth beats acceleration (an EMERGING
// cluster is always "accelerating" from zero — the young read is the true one),
// structure beats cooling (a 6-week theme with a quiet fortnight is resting,
// not exiting).
function clusterState(t, nowMs) {
  const recent = t.recent_7d || 0, prior = t.prior_7d || 0;
  const weeks = t.weeks_touched || 0;
  const quietDays = t.last_seen
    ? Math.round((nowMs - new Date(t.last_seen).getTime()) / 864e5) : 999;
  if (t.tightness != null && t.tightness < FIELD.CONTEST_TIGHT
      && (t.sources || 0) >= FIELD.CONTEST_SRC) return 'CONTESTED';
  if (weeks <= FIELD.EMERGE_WEEKS && (t.span_days || 0) <= FIELD.EMERGE_SPAN_D
      && recent > 0) return 'EMERGING';
  if (recent >= FIELD.ACCEL_MIN && recent >= FIELD.ACCEL_MULT * Math.max(prior, 1))
    return 'ACCELERATING';
  if (weeks >= FIELD.STRUCT_WEEKS && quietDays <= FIELD.STRUCT_QUIET_D)
    return 'STRUCTURAL';
  if (recent === 0 && quietDays >= FIELD.COOL_QUIET_D) return 'COOLING';
  return 'STEADY';
}

// PURE: week series -> curve shape. Shape predicts durability better than
// magnitude: a spike and a staircase can post identical weekly velocity and
// mean a campaign vs a platform. Order: spike (one week owns the story) ->
// staircase (monotone build, one dip forgiven) -> oscillating (dies and
// returns) -> slow-burn (never zero). Anything else earns no shape.
function clusterShape(series) {
  const sArr = (series || []).filter(n => typeof n === 'number');
  if (sArr.length < 3) return null;
  const total = sArr.reduce((a, b) => a + b, 0);
  if (!total) return null;
  if (Math.max.apply(null, sArr) / total >= 0.6) return 'spike';
  let dips = 0;
  for (let i = 1; i < sArr.length; i++) if (sArr[i] < sArr[i - 1]) dips++;
  if (dips <= 1 && sArr[sArr.length - 1] >= sArr[0]) return 'staircase';
  if (sArr.filter(n => n === 0).length >= 2) return 'oscillating';
  if (sArr.every(n => n > 0)) return 'slow-burn';
  return null;
}

// Bounded geometry pass: one embeddings fetch for the leading clusters, then
// centroid + tightness in-worker. Embeddings arrive as bracketed string
// literals from PostgREST — parse, never trust the type.
async function clusterGeometry(env, ids) {
  const out = {};
  if (!ids || !ids.length) return out;
  const rows = await sbRest(env, 'signals?cluster_id=in.(' + ids.join(',') + ')' +
    '&embedding=not.is.null&order=captured_at.desc&limit=' + FIELD.GEO_ROWS +
    '&select=cluster_id,embedding') || [];
  const byC = new Map();
  for (const r of rows) {
    let v = r.embedding;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
    if (!Array.isArray(v) || !v.length) continue;
    const a = byC.get(r.cluster_id) || [];
    if (a.length < FIELD.GEO_MEMBERS) { a.push(v); byC.set(r.cluster_id, a); }
  }
  for (const [cid, vs] of byC) {
    if (vs.length < 2) { out[cid] = { centroid: vs[0] || null, tightness: null }; continue; }
    const dim = vs[0].length;
    const cen = new Array(dim).fill(0);
    vs.forEach(v => { for (let i = 0; i < dim; i++) cen[i] += v[i]; });
    for (let i = 0; i < dim; i++) cen[i] /= vs.length;
    let acc = 0;
    vs.forEach(v => { acc += cosSim(v, cen); });
    out[cid] = { centroid: cen, tightness: acc / vs.length };
  }
  return out;
}

/* ═══ SEAM:BOOK_ANCHOR — the relevance gate. Culture at large is not the
 * product; culture filtered through the book of business is. Anchors are the
 * book as vectors — embedded PASSAGE-side (no BGE query prefix) so they live
 * in the same space signals were embedded into at capture. owner NULL is the
 * house book; per-client lenses are a WHERE clause waiting. ═══ */
async function fetchBookAnchors(env) {
  const rows = await sbRest(env, 'book_anchors?active=is.true&embedding=not.is.null' +
    '&select=id,label,embedding&limit=64').catch(() => null) || [];
  const out = [];
  for (const r of rows) {
    let v = r.embedding;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
    if (Array.isArray(v) && v.length) out.push({ id: r.id, label: r.label, vec: v });
  }
  return out;
}

// PURE: best anchor cosine, clamped 0..1.
function anchorRelevance(centroid, anchors) {
  let best = 0;
  for (const a of anchors) { const c = cosSim(centroid, a.vec); if (c > best) best = c; }
  return Math.max(0, Math.min(1, best));
}

// POST /excavate/anchors — admin door. ops: list (default) | add | remove.
// remove is a soft kill (active=false): a dead anchor still explains history.
async function excavateAnchors(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user || !(await callerIsAdmin(env, user.id)))
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const op = String(body.op || 'list');
  try {
    if (op === 'add') {
      const label = String(body.label || '').trim().slice(0, 80);
      if (!label) return json({ ok: false, error: 'label_required' }, 200, origin, env);
      const note = String(body.note || '').trim().slice(0, 240);
      const r = await env.AI.run(KB_EMBED_MODEL, { text: [note ? label + ': ' + note : label] });
      const vec = r && r.data && r.data[0];
      if (!vec) return json({ ok: false, error: 'embed_failed' }, 200, origin, env);
      // pgvector law: bracketed string literal, never a raw JS array.
      const row = await sbRest(env, 'book_anchors', {
        method: 'POST', headers: { Prefer: 'return=representation' },
        body: { label, note: note || null, owner: body.owner || null,
          embedding: '[' + vec.join(',') + ']' }
      });
      await logEvent(env, 'intelligence', 'excavate', 'anchor_add', user.id, { label });
      return json({ ok: true,
        anchor: row && row[0] ? { id: row[0].id, label: row[0].label } : null }, 200, origin, env);
    }
    if (op === 'remove') {
      const id = String(body.id || '');
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
        return json({ ok: false, error: 'bad_id' }, 200, origin, env);
      await sbRest(env, 'book_anchors?id=eq.' + id, { method: 'PATCH',
        headers: { Prefer: 'return=minimal' }, body: { active: false } });
      await logEvent(env, 'intelligence', 'excavate', 'anchor_remove', user.id, { id });
      return json({ ok: true }, 200, origin, env);
    }
    const rows = await sbRest(env, 'book_anchors?active=is.true' +
      '&select=id,label,note,owner,created_at&order=created_at.desc&limit=64') || [];
    return json({ ok: true, anchors: rows }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'anchors_unavailable',
      detail: String(e && e.message).slice(0, 100) }, 200, origin, env);
  }
}

/* ═══ SEAM:SCOREBOARD — every EMERGING/ACCELERATING read is a logged call.
 * Creativity Is Our Sport; nobody else in the category keeps score. The mark
 * is idempotent (unique cluster_id+state, ignore-duplicates), the resolution
 * runs inside PROPOSE itself ~30 days later: converted (accelerated or went
 * structural), held (still moving), faded (cooled or fell out of the read).
 * A call whose cluster left the top read resolves as faded — honest, and
 * noted here so the grader is never accused of grading on a curve. ═══ */
async function scoreboardMark(env, themes) {
  const calls = (themes || [])
    .filter(t => t.state === 'EMERGING' || t.state === 'ACCELERATING')
    .map(t => ({ cluster_id: t.cluster_id, state: t.state }));
  if (calls.length) {
    await sbRest(env, 'cluster_calls?on_conflict=cluster_id,state', {
      method: 'POST', body: calls,
      headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }
    }).catch(() => {});
  }
  const cutoff = new Date(Date.now() - 30 * 864e5).toISOString();
  const open = await sbRest(env, 'cluster_calls?resolved_at=is.null&called_at=lt.' +
    cutoff + '&select=id,cluster_id,state&limit=24').catch(() => null) || [];
  if (!open.length) return;
  const nowState = new Map((themes || []).map(t => [t.cluster_id, t.state || 'STEADY']));
  for (const c of open) {
    const st = nowState.get(c.cluster_id);
    const outcome = (st === 'ACCELERATING' || st === 'STRUCTURAL') ? 'converted'
      : (!st || st === 'COOLING') ? 'faded' : 'held';
    await sbRest(env, 'cluster_calls?id=eq.' + c.id, {
      method: 'PATCH', headers: { Prefer: 'return=minimal' },
      body: { resolved_at: new Date().toISOString(), outcome }
    }).catch(() => {});
  }
}

const PROPOSE_LENS = ['consumer', 'market', 'culture', 'brand'];

/* ═══ SEAM:VOICE — the fourth rail. LAKE is ours, FIELD is live, ACADEMIC is
 * mechanism; this is what people actually said.
 *
 * The law that shapes everything here: consumer voice is AGGREGATE, not signal.
 * One article is a signal. One post is noise — a thousand posts is a signal. So
 * this never writes rows to the lake: FILTER does 12 a slice and a brand
 * firehose would starve it by lunchtime, and hashInput cannot dedupe a repost.
 * It returns ONE measurement per entity per window. That is the row a brand
 * manager reads first, and it is the only thing on this platform Nielsen
 * cannot already sell them.
 *
 * Bluesky, because in 2026 there is no free door left. Reddit's unauthenticated
 * .json began returning 403 in May 2026; its free tier is non-commercial only
 * with registration closed, and commercial access carries a $12k/year floor —
 * that is a client line item, not platform overhead. X is $200/mo minimum.
 * TikTok and Instagram have no honest door at all. Bluesky costs nothing, has
 * no quota meter, and skews precisely culture-adjacent — the sneakers/music/
 * art/design audience the 14 territories already cover. It is better AIMED for
 * this product than X, not merely cheaper.
 *
 * searchPosts is NOT public despite the docs: public.api.bsky.app returns 403.
 * So a session is required — free, but a credential. KV-cached 90m so the
 * handshake is not paid per query.
 *
 * Facts counted here, language written by the model, never the reverse.
 * mentions/authors/engagement are arithmetic over what came back; only themes
 * and sentiment go to t1, on a sample, in one batched call.  ═══ */
async function bskySession(env) {
  if (!env.BSKY_HANDLE || !env.BSKY_APP_PASSWORD) return null;
  const k = 'voice:sess:v1';
  if (env.RATE_LIMIT) {
    const hit = await env.RATE_LIMIT.get(k).catch(function () { return null; });
    if (hit) { try { const s = JSON.parse(hit); if (s && s.jwt) return s; } catch (e) {} }
  }
  const r = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASSWORD })
  });
  if (!r.ok) throw new Error('bsky_session_' + r.status);
  const j = await r.json();
  if (!j || !j.accessJwt) throw new Error('bsky_session_shape');
  const s = { jwt: j.accessJwt, did: j.did || null };
  // 90m: the token lives ~2h, so refresh well inside it rather than at the edge.
  if (env.RATE_LIMIT) await env.RATE_LIMIT.put(k, JSON.stringify(s), { expirationTtl: 5400 })
    .catch(function () {});
  return s;
}

async function excavateVoice(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const entity = String(body.entity || body.q || '').trim().slice(0, 80);
  if (!entity) return json({ ok: false, error: 'entity_required' }, 200, origin, env);
  const days = Math.min(30, Math.max(1, parseInt(body.days, 10) || 7));
  const ck = 'voice:v1:' + days + ':' + entity.toLowerCase();

  if (body.refresh !== true && env.RATE_LIMIT) {
    const hit = await env.RATE_LIMIT.get(ck).catch(function () { return null; });
    if (hit) { try { return json(Object.assign(JSON.parse(hit), { cached: true }), 200, origin, env); } catch (e) {} }
  }

  const off = (note) => json({ ok: true, entity, window_days: days, enabled: false,
    provider: null, mentions: 0, samples: [], provenance: 'voice', note }, 200, origin, env);

  try {
    let sess = null;
    try { sess = await bskySession(env); }
    catch (e) { return off('voice provider error: ' + String(e && e.message).slice(0, 60)); }
    if (!sess) return off('no voice provider — set BSKY_HANDLE and BSKY_APP_PASSWORD');

    const since = new Date(Date.now() - days * 864e5).toISOString();
    const url = 'https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=' + encodeURIComponent(entity)
      + '&limit=100&sort=latest&since=' + encodeURIComponent(since);
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + sess.jwt } });
    if (r.status === 401 && env.RATE_LIMIT) {                 // stale token: burn it, once
      await env.RATE_LIMIT.delete('voice:sess:v1').catch(function () {});
      return off('voice_session_expired — retry');
    }
    if (!r.ok) return off('voice_http_' + r.status);
    const j = await r.json().catch(function () { return null; });
    const posts = (j && Array.isArray(j.posts)) ? j.posts : [];

    if (!posts.length) {
      const out0 = { ok: true, entity, window_days: days, enabled: true, provider: 'bluesky',
        mentions: 0, authors: 0, engagement: { likes: 0, reposts: 0, replies: 0 },
        trend: null, themes: [], samples: [], provenance: 'voice',
        note: 'no posts in window — the brand is not in this conversation, which is itself a finding' };
      if (env.RATE_LIMIT) await env.RATE_LIMIT.put(ck, JSON.stringify(out0), { expirationTtl: 21600 })
        .catch(function () {});
      return json(out0, 200, origin, env);
    }

    // ── arithmetic, not opinion ──
    const authors = new Set();
    let likes = 0, reposts = 0, replies = 0;
    for (const p of posts) {
      if (p.author && p.author.did) authors.add(p.author.did);
      likes += Number(p.likeCount) || 0;
      reposts += Number(p.repostCount) || 0;
      replies += Number(p.replyCount) || 0;
    }
    const texts = posts.map(function (p) { return String((p.record && p.record.text) || ''); })
      .filter(Boolean);

    // ── trend: today against the prior window, from our own history ──
    let trend = null;
    if (env.RATE_LIMIT) {
      const today = new Date().toISOString().slice(0, 10);
      const hk = 'voice:hist:' + entity.toLowerCase() + ':' + today;
      await env.RATE_LIMIT.put(hk, String(posts.length), { expirationTtl: 2764800 }).catch(function () {});
      const prior = [];
      for (let d = 1; d <= 7; d++) {
        const dt = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
        const v = await env.RATE_LIMIT.get('voice:hist:' + entity.toLowerCase() + ':' + dt)
          .catch(function () { return null; });
        if (v != null) prior.push(Number(v) || 0);
      }
      if (prior.length >= 2) {
        const avg = prior.reduce(function (a, b) { return a + b; }, 0) / prior.length;
        trend = { today: posts.length, prior_days: prior.length,
          prior_avg: Math.round(avg * 10) / 10,
          ratio: avg > 0 ? Math.round((posts.length / avg) * 10) / 10 : null };
      }
    }

    // ── one t1 call: disambiguate, THEN read. Language only, never counts. ──
    // Most brands worth consulting on are also ordinary words. 'kool-aid' is an
    // idiom before it is a beverage; so are Apple, Target, Tide, Dove, Shell,
    // Gap, Subway, Visa. A raw name search returns the metaphor, and a mention
    // count laid over it is a lie with a decimal point. So the model separates
    // posts ABOUT the entity from posts that merely use its name, and both
    // numbers ship: the raw search count, and the real one.
    //
    // The share is not a caveat, it is the finding. 'Eighty-seven percent of
    // your brand name on social is somebody else's metaphor' is the most useful
    // sentence this rail can hand a brand manager, and no panel provider sells
    // it — they bill by the mention.
    let themes = [], sentiment = null, aboutN = null;
    const sampleN = Math.min(40, texts.length);
    try {
      const sample = texts.slice(0, 40).map(function (t, i) {
        return '[' + (i + 1) + '] ' + t.replace(/\s+/g, ' ').slice(0, 180); }).join('\n');
      const reply = await callModel(env, 't1', [
        { role: 'system', content: 'You are given numbered social posts that all matched a '
          + 'search for a named ENTITY. Many will merely use its name as a common word, an '
          + 'idiom, a person, or an unrelated thing. First separate them. Then read only the '
          + 'ones actually about the entity.\n'
          + 'Return ONLY JSON: {"about":[<item numbers genuinely about the entity>],'
          + '"themes":[<3-6 short noun phrases drawn from the ABOUT posts, most common first>],'
          + '"sentiment":{"pos":<n>,"neu":<n>,"neg":<n>}} where the three counts sum to the '
          + 'number of ABOUT items. If none are about the entity, return an empty "about" and '
          + 'empty themes. Count only what is written. Invent nothing. No prose outside the JSON.' },
        { role: 'user', content: 'Entity: ' + entity + '\n\n' + sample }
      ], { max_tokens: 600 });
      const pj = parseModelJson(reply);
      if (pj && Array.isArray(pj.about)) {
        const good = pj.about.map(function (n) { return parseInt(n, 10); })
          .filter(function (n) { return n >= 1 && n <= sampleN; });
        aboutN = new Set(good).size;
      }
      if (pj && Array.isArray(pj.themes)) themes = pj.themes.slice(0, 6).map(function (t) {
        return String(t).slice(0, 48); });
      if (pj && pj.sentiment) sentiment = {
        pos: Number(pj.sentiment.pos) || 0, neu: Number(pj.sentiment.neu) || 0,
        neg: Number(pj.sentiment.neg) || 0, of_about: aboutN };
    } catch (e) { /* the count stands without the reading */ }

    const out = {
      ok: true, entity, window_days: days, enabled: true, provider: 'bluesky',
      mentions: posts.length,
      capped: posts.length >= 100,     // searchPosts limit — say so, do not imply a total
      // the raw count is what the search matched; about_* is what is actually
      // yours. Extrapolated from the read sample and it says so — never counted
      // whole, because we only read 40.
      about_sample: aboutN, about_sample_of: sampleN,
      about_rate: (aboutN != null && sampleN) ? Math.round((aboutN / sampleN) * 100) / 100 : null,
      about_estimate: (aboutN != null && sampleN) ? Math.round(posts.length * (aboutN / sampleN)) : null,
      authors: authors.size,
      engagement: { likes, reposts, replies },
      trend, themes, sentiment,
      samples: posts.slice(0, 5).map(function (p) {
        const rk = String(p.uri || '').split('/').pop();
        const hd = (p.author && p.author.handle) || '';
        return { text: String((p.record && p.record.text) || '').slice(0, 240),
          handle: hd, likes: Number(p.likeCount) || 0,
          at: (p.record && p.record.createdAt) || p.indexedAt || null,
          url: hd && rk ? 'https://bsky.app/profile/' + hd + '/post/' + rk : null };
      }),
      provenance: 'voice', fetched_at: new Date().toISOString()
    };
    if (env.RATE_LIMIT) await env.RATE_LIMIT.put(ck, JSON.stringify(out), { expirationTtl: 21600 })
      .catch(function () {});
    await logEvent(env, 'intelligence', 'excavate', 'voice', null,
      { entity: entity.slice(0, 40), days, mentions: out.mentions, authors: out.authors });
    return json(out, 200, origin, env);
  } catch (e) {
    return off('voice_error: ' + String(e && e.message).slice(0, 80));
  }
}

async function excavatePropose(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const days = Math.min(180, Math.max(7, parseInt(body.days, 10) || RECUR.WINDOW_D));
  const want = Math.min(8, Math.max(1, parseInt(body.count, 10) || 6));
  const minWeeks = Math.min(6, Math.max(1, parseInt(body.min_weeks, 10) || RECUR.MIN_WEEKS));
  const ck = 'prop:v3:' + days + ':' + want + ':' + minWeeks;

  if (body.refresh !== true && env.RATE_LIMIT) {
    const hit = await env.RATE_LIMIT.get(ck).catch(function () { return null; });
    if (hit) { try { return json(Object.assign(JSON.parse(hit), { cached: true }), 200, origin, env); } catch (e) {} }
  }

  try {
    const rows = await fetchRecurrenceRows(env, days, null);

    const ranked = recurrenceRollup(rows, 64, minWeeks);
    // SEAM:FIELD_STATE — geometry + state pass over the leading candidates,
    // then the SEAM:BOOK_ANCHOR relevance blend re-ranks them. Bounded: one
    // embeddings fetch, one anchors read. Every failure degrades to the plain
    // rollup with arithmetic-only states — the field never blocks the paper.
    let themes = ranked.slice(0, want);
    let anchorsOn = false;
    try {
      const cand = ranked.slice(0, Math.min(FIELD.GEO_CLUSTERS, ranked.length));
      const geo = await clusterGeometry(env, cand.map(t => t.cluster_id));
      const anchors = await fetchBookAnchors(env);
      anchorsOn = anchors.length > 0;
      const nowMs = Date.now();
      for (const t of cand) {
        const g = geo[t.cluster_id] || {};
        t.tightness = (g.tightness != null) ? g.tightness : null;
        t.relevance = (anchorsOn && g.centroid) ? anchorRelevance(g.centroid, anchors) : null;
        t.state = clusterState(t, nowMs);
        t.shape = clusterShape(t.week_series);
      }
      if (anchorsOn) cand.sort((a, b) =>
        (b.score * (0.6 + 0.4 * (b.relevance || 0)))
        - (a.score * (0.6 + 0.4 * (a.relevance || 0))));
      themes = cand.slice(0, want);
    } catch (e) {
      themes = ranked.slice(0, want);
      const nowMs = Date.now();
      themes.forEach(t => { t.state = clusterState(t, nowMs); t.shape = clusterShape(t.week_series); });
    }
    if (!themes.length) {
      return json({ ok: true, proposed: [], scanned: rows.length, window_days: days, min_weeks: minWeeks,
        note: 'no cluster has recurred across ' + minWeeks + '+ weeks in this window yet — '
            + 'recurrence needs time; clusters begin at CONNECT' }, 200, origin, env);
    }

    // the cluster's own headlines - free, the rows are already in memory
    const titlesOf = new Map();
    for (const r of rows) {
      if (!r.cluster_id || !r.title) continue;
      const a = titlesOf.get(r.cluster_id) || [];
      if (a.length < 6) { a.push(r.title); titlesOf.set(r.cluster_id, a); }
    }

    const brief = themes.map(function (t, i) {
      return '[' + (i + 1) + '] state=' + (t.state || 'STEADY')
        + ' weeks=' + t.weeks_touched + ' span_days=' + t.span_days
        + ' signals=' + t.members + ' sources=' + t.sources
        + ' territories=' + (t.territories.join(',') || 'none') + ' published=' + t.published
        + '\n    headlines: ' + (titlesOf.get(t.cluster_id) || []).map(function (x) {
            return String(x).slice(0, 110); }).join(' // ');
    }).join('\n');

    const sys = 'You name recurring patterns for Unsurfaced INTELLIGENCE, a cultural recon platform read '
      + 'by brand and creative leadership. Each numbered item is one cluster of signals the lake has seen '
      + 'resurface across multiple weeks. Name the pattern underneath it.\n\n'
      + DAILY_POV.stages.interpret + '\n\n'
      + 'Return ONLY JSON: {"read":<the field read: exactly 2 sentences, first reframes what the '
      + 'set of patterns says about the field today, second names the move — under 40 words total, '
      + 'declarative, no colon openers, no em dashes>,"themes":[{"n":<item number>,"lens":<one of ' + PROPOSE_LENS.join('|') + '>,'
      + '"title":<3-5 words, declarative, no colon>,'
      + '"subtitle":<8-14 words naming the actual question>,'
      + '"deck":<1 sentence on what is structurally shifting>,'
      + '"hook":<1 sentence a strategist could say out loud in a room>,'
      + '"query":<6-12 words of academic search terms for this pattern>}]}\n'
      + 'Ground every word in the headlines given. Invent no facts, numbers, brands or dates. If a cluster '
      + 'shows no real pattern, omit it entirely rather than forcing one. No prose outside the JSON.';

    let written = [];
    let fieldRead = '';
    try {
      const reply = await callModel(env, 't3', [
        { role: 'system', content: sys },
        { role: 'user', content: brief }
      ], { max_tokens: 1400 });
      const j = parseModelJson(reply);
      written = (j && Array.isArray(j.themes)) ? j.themes : [];
      fieldRead = (j && typeof j.read === 'string') ? j.read.slice(0, 400) : '';
    } catch (e) {
      return json({ ok: false, error: 'propose_voice_failed',
        detail: String(e && e.message).slice(0, 120) }, 200, origin, env);
    }

    const maxScore = Math.max.apply(null, themes.map(function (t) { return t.score; }).concat([1]));
    const proposed = [];
    for (const w of written) {
      const t = themes[(parseInt(w && w.n, 10) || 0) - 1];
      if (!t || !w || !w.title) continue;
      proposed.push({
        id: 'lake-' + t.cluster_id.slice(0, 8),
        cluster_id: t.cluster_id,
        lens: PROPOSE_LENS.indexOf(w.lens) >= 0 ? w.lens : 'culture',
        title: String(w.title).slice(0, 60),
        subtitle: String(w.subtitle || '').slice(0, 120),
        deck: String(w.deck || '').slice(0, 300),
        hook: String(w.hook || '').slice(0, 300),
        query: String(w.query || '').slice(0, 160),
        // computed from the rollup - the model is never shown these words
        stat: t.territories.length > 1
          ? '↗ crossing ' + t.territories.length + ' territories'
          : '↑ ' + t.weeks_touched + ' weeks running',
        bar: Math.max(12, Math.min(96, Math.round((t.score / maxScore) * 92))),
        state: t.state || 'STEADY',
        shape: t.shape || null,
        evidence: {
          weeks_touched: t.weeks_touched, span_days: t.span_days, members: t.members,
          sources: t.sources, territories: t.territories, published: t.published,
          best_tier: t.best_tier, first_seen: t.first_seen, last_seen: t.last_seen,
          recent_7d: t.recent_7d || 0, prior_7d: t.prior_7d || 0,
          tightness: (t.tightness != null) ? Math.round(t.tightness * 100) / 100 : null,
          relevance: (t.relevance != null) ? Math.round(t.relevance * 100) / 100 : null
        },
        exemplar: t.exemplar,
        provenance: 'lake'
      });
    }

    // SEAM:SCOREBOARD — mark and resolve, silently; the read never waits on it.
    try { await scoreboardMark(env, themes); } catch (e) {}
    const stateCounts = {};
    themes.forEach(t => { const st = t.state || 'STEADY'; stateCounts[st] = (stateCounts[st] || 0) + 1; });
    const out = { ok: true, window_days: days, scanned: rows.length, min_weeks: minWeeks,
      candidates: ranked.length, proposed,
      field: { read: fieldRead, states: stateCounts, anchors_on: anchorsOn },
      bar_note: 'bar is recurrence strength RELATIVE to this set; evidence carries the absolute numbers',
      generated_at: new Date().toISOString() };
    if (env.RATE_LIMIT) {
      await env.RATE_LIMIT.put(ck, JSON.stringify(out), { expirationTtl: 86400 }).catch(function () {});
    }
    await logEvent(env, 'intelligence', 'excavate', 'propose', null,
      { scanned: rows.length, candidates: ranked.length, proposed: proposed.length, min_weeks: minWeeks });
    return json(out, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'propose_unavailable',
      detail: String(e && e.message).slice(0, 120) }, 200, origin, env);
  }
}

async function excavateRecurrence(request, env, origin) {
  const gate = await excavateAuth(request, env, origin);
  if (gate.err) return gate.err;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const days = Math.min(180, Math.max(7, parseInt(body.days, 10) || RECUR.WINDOW_D));
  const territory = DAILY_POV.territories.includes(body.territory) ? body.territory : null;
  const top = Math.min(24, Math.max(1, parseInt(body.count, 10) || RECUR.TOP));
  try {
    const rows = await fetchRecurrenceRows(env, days, territory);
    const themes = recurrenceRollup(rows, top);
    return json({ ok: true, window_days: days, scanned: rows.length, themes }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'recurrence_unavailable' }, 200, origin, env);
  }
}

async function dailySpineGuarded(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user || !(await callerIsAdmin(env, user.id)))
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  try {
    const stats = await runDailySpine(env, { feeds: 10, gdelt: 2, advance: 42 });
    return json({ ok: true, ...stats }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'spine_error', detail: String(e && e.message).slice(0, 140) }, 200, origin, env);
  }
}

/* GET /daily/lake — public receipt: recent-window counts by status and
 * territory, newest capture timestamp. Reads a bounded window, cheap. */
async function dailyLakePublic(env, origin) {
  try {
    const rows = await sbRest(env, 'signals?select=status,territory,captured_at&order=captured_at.desc&limit=500') || [];
    const byStatus = {}, byTerritory = {};
    rows.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.territory) byTerritory[r.territory] = (byTerritory[r.territory] || 0) + 1;
    });
    return json({ ok: true, window: rows.length, newest: rows[0] ? rows[0].captured_at : null,
      by_status: byStatus, by_territory: byTerritory }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'unavailable' }, 200, origin, env);
  }
}

/* ═══ SEAM:DAILY_HEALTH — the pipeline's pulse behind one admin door.
 * GET /daily/health reads: the 24h capture window shape, the three
 * backlog depths the drain still owes, the spine's recent heartbeats
 * from activity_events, per-feed error history aggregated across runs,
 * the latest edition with its lake-provenance share — and a flags
 * array naming every condition that needs the editor's hand. Read-only,
 * bounded (~8 sb calls), admin-gated; nowMs injects for proofs. ═══ */
const HEALTH = {
  EVENTS: 40, PROBE: 200, WINDOW_H: 24,
  CAPTURE_STALE_MIN: 45,     // drain cron fires every 30' — 45' of silence is a missed beat
  EDITION_DUE_UTC: 7,        // compose runs 06:00 UTC; 07:00 with no paper is late
  DEAD_FEED_ERRORS: 3,       // three sightings in the event window = a dying feed
  EMBED_BACKLOG: 150         // raw-unembedded probe depth that flags a clogged drain
};

async function dailyHealthGuarded(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user || !(await callerIsAdmin(env, user.id)))
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  try {
    return json(await dailyHealth(env), 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'health_error', detail: String(e && e.message).slice(0, 140) }, 200, origin, env);
  }
}

async function dailyHealth(env, nowMs) {
  const now = nowMs || Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const since = new Date(now - HEALTH.WINDOW_H * 3600e3).toISOString();

  // 1 · the capture window — status + territory shape of the last 24h intake
  const win = await sbRest(env,
    `signals?captured_at=gte.${since}&select=status,territory&limit=1000`) || [];
  const winStatus = {}, winTerr = {};
  win.forEach(r => {
    winStatus[r.status] = (winStatus[r.status] || 0) + 1;
    if (r.territory) winTerr[r.territory] = (winTerr[r.territory] || 0) + 1;
  });

  // 2 · backlog depths — what the drain still owes, probe-capped
  const probe = (q) => sbRest(env, `signals?${q}&select=id&limit=${HEALTH.PROBE}`)
    .then(r => (r || []).length).catch(() => -1);
  const backlog = {
    to_embed:   await probe('status=eq.raw&embedding=is.null'),
    to_filter:  await probe('status=eq.raw&embedding=not.is.null'),
    to_connect: await probe('status=eq.filtered')
  };

  // 3 · the heartbeat — recent daily events from the activity log
  const events = await sbRest(env,
    'activity_events?platform=eq.daily' +
    '&event=in.(spine_run,edition_published,edition_starved,compose_error,spine_error)' +
    `&order=created_at.desc&limit=${HEALTH.EVENTS}&select=event,created_at,meta`) || [];
  const spineRuns = events.filter(e => e.event === 'spine_run');
  const lastSpine = spineRuns[0] || null;
  const fresh24 = spineRuns
    .filter(e => now - new Date(e.created_at).getTime() <= HEALTH.WINDOW_H * 3600e3)
    .reduce((a, e) => a + (Number(e.meta && e.meta.fresh) || 0), 0);

  // 4 · feed health — errors aggregated per source across the run window.
  //     spineRuns arrive newest-first, so the first sighting per feed IS
  //     the most recent; set last_error/last_seen on create only.
  const feeds = {};
  spineRuns.forEach(e => ((e.meta && e.meta.feed_errors) || []).forEach(s => {
    const str = String(s);
    const i = str.lastIndexOf(':');
    const name = i > 0 ? str.slice(0, i) : str;
    const err = i > 0 ? str.slice(i + 1) : 'error';
    if (!feeds[name]) feeds[name] = { errors: 0, last_error: err, last_seen: e.created_at };
    feeds[name].errors++;
  }));

  // 5 · the paper — latest published edition + its lake-provenance share
  const eds = await sbRest(env,
    'editions?status=eq.published&order=date.desc&limit=1&select=id,issue_no,date,published_at') || [];
  let edition = null;
  if (eds[0]) {
    const its = await sbRest(env,
      `edition_items?edition_id=eq.${eds[0].id}&select=id,signal_id`) || [];
    edition = { issue_no: eds[0].issue_no, date: eds[0].date, published_at: eds[0].published_at,
      items: its.length, from_lake: its.filter(i => i.signal_id).length };
  }

  // 6 · the verdict — every condition needing the editor's hand, named
  const flags = [];
  const utcH = new Date(now).getUTCHours();
  if (!edition) flags.push('no_edition_ever');
  else if (edition.date !== today && utcH >= HEALTH.EDITION_DUE_UTC) flags.push('no_edition_today');
  if (!lastSpine) flags.push('spine_never_ran');
  else if (now - new Date(lastSpine.created_at).getTime() > HEALTH.CAPTURE_STALE_MIN * 60e3)
    flags.push('capture_stale');
  if (spineRuns.length && fresh24 === 0) flags.push('lake_quiet_24h');
  if (backlog.to_embed >= HEALTH.EMBED_BACKLOG) flags.push('embed_backlog');
  Object.keys(feeds).forEach(n => {
    if (feeds[n].errors >= HEALTH.DEAD_FEED_ERRORS) flags.push('dead_feed:' + n);
  });

  return {
    ok: true, at: new Date(now).toISOString(), flags,
    lake: { window_hours: HEALTH.WINDOW_H, intake: win.length, fresh_24h: fresh24,
      by_status: winStatus, by_territory: winTerr, backlog },
    spine: { last_run: lastSpine ? lastSpine.created_at : null,
      last_stats: lastSpine ? lastSpine.meta : null, runs_seen: spineRuns.length },
    feeds, edition
  };
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

/* A COMPLETE SENTENCE UNDER EVERY HEADLINE. firstSentences keeps only
 * whole sentences: accumulate full stops within budget, guard the
 * abbreviation trap (Warner Bros. is a name, not a sentence), and if no
 * complete sentence fits, return nothing \u2014 the caller falls back to
 * the voiced take, which the completeness gate already guarantees ends
 * clean. healStandfirsts applies the law at serve, so editions frozen
 * before this law still read complete today. */
const SENT_ABBREV = new Set(['bros','inc','corp','co','ltd','mr','mrs','ms','dr','st','no','vs','jr','sr','dept','gov','sen','rep']);
function firstSentences(text, budget) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  let out = '';
  const re = /[.!?\u2026](?=\s|$)/g; let m;
  while ((m = re.exec(t))) {
    const prev = t.slice(0, m.index).split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
    if (m[0] === '.' && (SENT_ABBREV.has(prev) || prev.length === 1)) continue;
    const cand = t.slice(0, m.index + 1);
    if (cand.length > budget) break;
    out = cand;
    if (out.length >= budget * 0.6) break;
  }
  return out;
}
function healStandfirsts(items) {
  return (items || []).map(it => Object.assign({}, it, {
    standfirst: firstSentences(it.standfirst, 240) || firstSentences(it.take, 240) || null
  }));
}
async function editionToday(env, origin) {
  try {
    const eds = await sbRest(env, "editions?status=eq.published&order=date.desc&limit=1");
    const ed = eds && eds[0];
    if (!ed) return json({ edition: null, items: [] }, 200, origin, env);
    const items = await sbRest(env, `edition_items?edition_id=eq.${ed.id}&order=ord.asc`);
    return json({
      edition: { issue_no: ed.issue_no, date: ed.date, headline: ed.headline || '' },
      items: healStandfirsts(items)
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
      items: healStandfirsts(items) }, 200, origin, env);
  } catch (e) { return json({ edition: null, items: [], error: 'unavailable' }, 200, origin, env); }
}

// Manual trigger (admin only) — same pipeline the cron runs, for on-demand builds.
async function dailyRunGuarded(request, env, origin) {
  const user = await authenticate(request, env);
  if (!user || !(await callerIsAdmin(env, user.id)))
    return json({ ok: false, error: 'forbidden' }, 403, origin, env);
  const force = new URL(request.url).searchParams.get('force') === '1';
  try {
    const result = await runDailyPipeline(env, { force });
    return json({ ok: true, ...result }, 200, origin, env);
  } catch (e) {
    return json({ ok: false, error: 'pipeline_error', detail: String(e && e.message).slice(0, 140) }, 200, origin, env);
  }
}

/* ═══ SEAM:EDITION_WATCHDOG — the alarm that did not exist. DAILY went dark
 * for seven days while every cron reported Success. Health was written by
 * logEvent into activity_events — a table that needs an admin JWT to read —
 * so the pipeline could only report its condition to someone already inside.
 * A system that speaks solely to authenticated readers goes quiet exactly
 * when you most need it to talk.
 *
 * This seam trusts no return value. It asks the database what actually
 * happened and mails out on two silent failures:
 *   DARK   — no edition reached status='published' today. Either compose
 *            produced nothing, or publishEdition stalled mid-write at
 *            status='building' and left a half-paper behind.
 *   LEGACY — an edition published, but not one item carried a signal_id.
 *            Only lake items do; legacy ingest has none. The paper shipped,
 *            the intelligence engine fed it nothing, and OPS looks green.
 * Needs ALERT_EMAIL. Unset, it still speaks — to the log stream.  */
async function editionWatchdog(env) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const eds = await sbRest(env, `editions?date=eq.${today}&select=id,issue_no,status`) || [];
    const live = eds.find(e => e.status === 'published');

    let level = null, why = '';
    if (!live) {
      level = 'DARK';
      why = eds.length
        ? `An edition row exists but stalled at status='${eds[0].status}'. publishEdition began and did not finish.`
        : 'No edition row for today. Compose produced nothing and the legacy fallback did not catch it.';
    } else {
      const fromLake = await sbRest(env,
        `edition_items?edition_id=eq.${live.id}&signal_id=not.is.null&select=id`) || [];
      if (!fromLake.length) {
        level = 'LEGACY';
        why = `Issue ${live.issue_no} published, but no item carried a signal_id. `
            + 'The lake fed nothing and legacy ingest carried the paper.';
      }
    }
    if (!level) { console.log('edition_watchdog', 'ok issue=' + live.issue_no); return; }

    let health = null;
    try { health = await dailyHealth(env); }
    catch (e) { health = { error: String(e && e.message).slice(0, 80) }; }
    console.log('edition_watchdog_' + level.toLowerCase(),
      JSON.stringify({ date: today, why, flags: (health && health.flags) || null }));

    if (!env.ALERT_EMAIL) { console.log('edition_watchdog', 'ALERT_EMAIL unset - no mail sent'); return; }
    const sent = await sendEmail(env, {
      to: env.ALERT_EMAIL,
      subject: (level === 'DARK' ? 'DAILY DARK - no edition for ' : 'DAILY degraded - legacy fallback on ') + today,
      html: watchdogEmailHtml(level, today, why, health)
    });
    console.log('edition_watchdog', 'mail ' + JSON.stringify(sent));
  } catch (e) {
    // The watchdog must not fail the way the pipeline did. If it cannot read
    // the edition state, that is itself the alarm - an alarm that goes quiet
    // when the system breaks is not an alarm. Say it out loud, not into a log.
    const detail = String(e && e.message).slice(0, 120);
    console.log('edition_watchdog_error', detail);
    if (env.ALERT_EMAIL) {
      await sendEmail(env, {
        to: env.ALERT_EMAIL,
        subject: 'DAILY watchdog blind - cannot read edition state - ' + today,
        html: watchdogEmailHtml('DARK', today, 'The watchdog itself failed: ' + detail
          + '. Edition state is unknown - the lake could not be reached. Check the worker and Supabase.', null)
      }).catch(() => {});
    }
  }
}

function watchdogEmailHtml(level, date, why, health) {
  const h = health || {};
  const b = (h.lake && h.lake.backlog) || {};
  const dark = level === 'DARK';
  const flags = (h.flags || []).map(f =>
    `<code style="background:#F5F0E8;padding:2px 6px;border-radius:3px;font-size:12px">${esc(f)}</code>`
  ).join(' ') || '<em style="color:#888">none raised</em>';
  const row = (k, v) => `<tr><td style="padding:5px 18px 5px 0;color:#666">${esc(k)}</td>`
    + `<td style="padding:5px 0"><strong>${esc(v == null ? '?' : v)}</strong></td></tr>`;
  return `<div style="font-family:system-ui,Segoe UI,sans-serif;color:#0A0A0A;line-height:1.6;max-width:560px">
    <div style="border-left:3px solid ${dark ? '#C41230' : '#B8860B'};padding-left:14px;margin:0 0 20px">
      <h2 style="margin:0 0 3px;font-size:19px">${dark ? 'DAILY did not publish' : 'DAILY ran on the fallback'}</h2>
      <div style="color:#666;font-size:13px;letter-spacing:.04em">${esc(date)}</div>
    </div>
    <p style="margin:0 0 18px">${esc(why)}</p>
    <table style="border-collapse:collapse;font-size:14px;margin:0 0 18px">
      ${row('to embed', b.to_embed)}
      ${row('to filter', b.to_filter)}
      ${row('to connect', b.to_connect)}
      ${row('intake 24h', h.lake ? h.lake.fresh_24h : null)}
      ${row('spine runs seen', h.spine ? h.spine.runs_seen : null)}
      ${row('last spine run', h.spine ? (h.spine.last_run || 'never') : null)}
    </table>
    <p style="margin:0 0 6px;font-size:12px;color:#666;letter-spacing:.06em">FLAGS</p>
    <p style="margin:0 0 20px">${flags}</p>
    <p style="margin:0;font-size:12px;color:#888">SEAM:EDITION_WATCHDOG · 06:00 compose cron</p>
  </div>`;
}

async function runDailyPipeline(env, opts) {
  const force = !!(opts && opts.force);
  const today = new Date().toISOString().slice(0, 10);

  // 0. THE SPINE — a drain slice first (the daily-spine seam). Capture has
  //    its own 05:15 cron; compose runs travel light on the free-tier budget.
  //    A spine failure is logged and swallowed: the edition publishes regardless.
  let spine = null;
  try {
    spine = (opts && opts.fullSpine) ? await runDailySpine(env) : await spineAdvance(env, 8);
  }
  catch (e) { logEvent(env, 'daily', null, 'spine_error', null, { err: String(e && e.message).slice(0, 120) }); }

  // Idempotency: if today is already published, do nothing.
  const existing = await sbRest(env, `editions?date=eq.${today}&select=id,status`);
  if (existing && existing[0] && existing[0].status === 'published' && !force) {
    return { skipped: 'already_published', date: today, spine };
  }

  // 1. THE LAKE COMPOSER — twelve from the spine's catch (SEAM law).
  try {
    const lake = await composeFromLake(env, today);
    if (lake) return await publishEdition(env, today, existing, lake.lead, lake.items, 'lake', spine);
  } catch (e) {
    logEvent(env, 'daily', null, 'compose_error', null, { err: String(e && e.message).slice(0, 120) });
  }

  // 1b. LEGACY INGEST — the fallback when the lake runs thin.
  const raw = [];
  for (const lane of DAILY_BEATS) {
    const sig = await gatherServerSignals(lane.q);
    // same law as the spine, same permissiveness - a filter that empties raw[]
    // returns no_signal and takes the paper dark.
    sig.filter(s => !s.lang || /^(english|eng|en)$/i.test(String(s.lang).trim()))
       .forEach(s => raw.push({ ...s, beat: lane.beat }));
  }
  if (!raw.length) {
    logEvent(env, 'daily', null, 'edition_starved', null, { date: today });
    return { error: 'no_signal', date: today, spine };
  }

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
      headline: studioTrimClean(it.headline, 200),
      standfirst: firstSentences(it.standfirst, 240) || null,
      take: studioTrimClean(it.take, 800),
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

  // 5. PUBLISH — shared machinery (lake + legacy).
  return publishEdition(env, today, existing, parsed.lead_headline || null, enriched, 'legacy', spine);
}

/* publishEdition — create/reuse today's edition, replace items, mark
 * published, backlink lake signals when items carry signal_id, cut the
 * STUDIO manifest. One door for both composers. */
async function publishEdition(env, today, existing, leadHeadline, items, mode, spine) {
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
      body: { issue_no: issueNo, date: today, status: 'building', headline: leadHeadline }
    });
    edId = created[0].id;
  }

  const createdItems = await sbRest(env, 'edition_items', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: items.map((it, i) => ({ edition_id: edId, ord: i, ...it }))
  }) || [];

  await sbRest(env, `editions?id=eq.${edId}`, {
    method: 'PATCH',
    body: { status: 'published', headline: leadHeadline, published_at: new Date().toISOString() }
  });

  // provenance thread: the lake learns which of its signals made the paper.
  try {
    const backs = createdItems.filter(r => r.signal_id);
    for (const b of backs) {
      await sbRest(env, `signals?id=eq.${b.signal_id}`, {
        method: 'PATCH', body: { status: 'published', edition_item_id: b.id }
      });
    }
  } catch (e) {}

  logEvent(env, 'daily', null, 'edition_published', null, { issue_no: issueNo, items: items.length, mode });
  await buildStudioManifest(env, today, issueNo, items).catch(() => {});
  return { ok: true, date: today, issue_no: issueNo, items: items.length, mode, spine };
}
