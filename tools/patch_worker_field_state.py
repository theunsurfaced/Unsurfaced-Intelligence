#!/usr/bin/env python3
# patch_worker_field_state.py — FIELD STATE arc, worker side.
# Run from repo root:  python3 tools/patch_worker_field_state.py  (or wherever staged)
# Target: worker/src/index.js  (NEVER worker/index.js)
# Every replacement is anchored with assert s.count(old) == 1.
# A failed assertion leaves the file untouched.

import sys, io, os

PATH = os.environ.get('WORKER_PATH', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── P1: route table — anchors door after voice ──────────────────────────────
rep(
"      if (path === '/excavate/voice' && request.method === 'POST') return excavateVoice(request, env, origin);",
"      if (path === '/excavate/voice' && request.method === 'POST') return excavateVoice(request, env, origin);\n"
"      if (path === '/excavate/anchors' && request.method === 'POST') return excavateAnchors(request, env, origin);",
'P1 route /excavate/anchors')

# ── P2a: rollup accumulator carries raw hit timestamps ──────────────────────
rep(
"""      c = { cluster_id: r.cluster_id, members: 0, weeks: new Set(), sources: new Set(),
        territories: new Set(), first_seen: r.captured_at, last_seen: r.captured_at,
        published: 0, best_tier: 4, exemplar: null };""",
"""      c = { cluster_id: r.cluster_id, members: 0, weeks: new Set(), sources: new Set(),
        territories: new Set(), first_seen: r.captured_at, last_seen: r.captured_at,
        published: 0, best_tier: 4, exemplar: null, hits: [] };""",
'P2a rollup hits[]')

rep(
"    c.members++;\n    c.weeks.add(weekEpoch(r.captured_at));",
"    c.members++;\n    c.hits.push(r.captured_at);\n    c.weeks.add(weekEpoch(r.captured_at));",
'P2b rollup hit push')

# ── P2c: rollup output gains velocity buckets + week series ─────────────────
rep(
"""  const out = [];
  for (const c of by.values()) {
    if (c.weeks.size < floor) continue;
    const span_days = Math.round((new Date(c.last_seen) - new Date(c.first_seen)) / 864e5);
    out.push({
      cluster_id: c.cluster_id, weeks_touched: c.weeks.size, span_days,
      members: c.members, sources: c.sources.size, territories: [...c.territories],
      published: c.published, best_tier: c.best_tier,
      first_seen: c.first_seen, last_seen: c.last_seen, exemplar: c.exemplar,
      score: c.weeks.size * 10 + Math.min(span_days, 45) + c.members
        + c.sources.size * 2 + c.published * 3
    });
  }""",
"""  const out = [];
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
  }""",
'P2c rollup velocity + series')

# ── P3: FIELD_STATE pure functions + anchors + scoreboard, before PROPOSE_LENS
rep(
"const PROPOSE_LENS = ['consumer', 'market', 'culture', 'brand'];",
"""/* ═══ SEAM:FIELD_STATE — categories as states, not subjects.
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

const PROPOSE_LENS = ['consumer', 'market', 'culture', 'brand'];""",
'P3 FIELD_STATE block')

# ── P4a: cache key v1 -> v2 (payload shape changed) ─────────────────────────
rep(
"  const ck = 'prop:v1:' + days + ':' + want + ':' + minWeeks;",
"  const ck = 'prop:v2:' + days + ':' + want + ':' + minWeeks;",
'P4a cache key v2')

# ── P4b: enrichment pass replaces the plain slice ───────────────────────────
rep(
"""    const ranked = recurrenceRollup(rows, 64, minWeeks);
    const themes = ranked.slice(0, want);""",
"""    const ranked = recurrenceRollup(rows, 64, minWeeks);
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
    }""",
'P4b enrichment pass')

# ── P4c: T3 brief carries the state ─────────────────────────────────────────
rep(
"      return '[' + (i + 1) + '] weeks=' + t.weeks_touched + ' span_days=' + t.span_days",
"      return '[' + (i + 1) + '] state=' + (t.state || 'STEADY')\n"
"        + ' weeks=' + t.weeks_touched + ' span_days=' + t.span_days",
'P4c brief state')

# ── P4d: T3 JSON schema gains the field read ────────────────────────────────
rep(
"""      + 'Return ONLY JSON: {"themes":[{"n":<item number>,"lens":<one of ' + PROPOSE_LENS.join('|') + '>,'""",
"""      + 'Return ONLY JSON: {"read":<the field read: exactly 2 sentences, first reframes what the '
      + 'set of patterns says about the field today, second names the move — under 40 words total, '
      + 'declarative, no colon openers, no em dashes>,"themes":[{"n":<item number>,"lens":<one of ' + PROPOSE_LENS.join('|') + '>,'""",
'P4d read schema')

rep(
"""    let written = [];
    try {
      const reply = await callModel(env, 't3', [
        { role: 'system', content: sys },
        { role: 'user', content: brief }
      ], { max_tokens: 1400 });
      const j = parseModelJson(reply);
      written = (j && Array.isArray(j.themes)) ? j.themes : [];""",
"""    let written = [];
    let fieldRead = '';
    try {
      const reply = await callModel(env, 't3', [
        { role: 'system', content: sys },
        { role: 'user', content: brief }
      ], { max_tokens: 1400 });
      const j = parseModelJson(reply);
      written = (j && Array.isArray(j.themes)) ? j.themes : [];
      fieldRead = (j && typeof j.read === 'string') ? j.read.slice(0, 400) : '';""",
'P4e capture read')

# ── P4f: proposed cards carry state + shape, evidence carries the receipts ──
rep(
"""        evidence: {
          weeks_touched: t.weeks_touched, span_days: t.span_days, members: t.members,
          sources: t.sources, territories: t.territories, published: t.published,
          best_tier: t.best_tier, first_seen: t.first_seen, last_seen: t.last_seen
        },
        exemplar: t.exemplar,
        provenance: 'lake'""",
"""        state: t.state || 'STEADY',
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
        provenance: 'lake'""",
'P4f card state + receipts')

# ── P4g: scoreboard mark + field summary in the response ────────────────────
rep(
"""    const out = { ok: true, window_days: days, scanned: rows.length, min_weeks: minWeeks,
      candidates: ranked.length, proposed,""",
"""    // SEAM:SCOREBOARD — mark and resolve, silently; the read never waits on it.
    try { await scoreboardMark(env, themes); } catch (e) {}
    const stateCounts = {};
    themes.forEach(t => { const st = t.state || 'STEADY'; stateCounts[st] = (stateCounts[st] || 0) + 1; });
    const out = { ok: true, window_days: days, scanned: rows.length, min_weeks: minWeeks,
      candidates: ranked.length, proposed,
      field: { read: fieldRead, states: stateCounts, anchors_on: anchorsOn },""",
'P4g field summary + scoreboard')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} bytes)')
