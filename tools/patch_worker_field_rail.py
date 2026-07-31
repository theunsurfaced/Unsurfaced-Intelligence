#!/usr/bin/env python3
# patch_worker_field_rail.py — MINE FIELD RAIL, worker side.
# Target: worker/src/index.js  (NEVER worker/index.js)
# Requires migration 0021_mine_field_rail.sql applied first.
# Every replacement anchored with assert s.count(old) == 1.

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

# ── M1: public routes — the token door (GET study, POST respond) ────────────
rep(
"      if (path === '/mine/respond' && request.method === 'POST') return mineGuestRespond(request, env, origin);",
"      if (path === '/mine/respond' && request.method === 'POST') return mineGuestRespond(request, env, origin);\n"
"      if (path === '/mine/t' && request.method === 'GET') return mineTokenStudy(url, env, origin);\n"
"      if (path === '/mine/t/respond' && request.method === 'POST') return mineTokenRespond(request, env, origin);",
'M1 public token routes')

# ── M2: authed routes — invites, client access, client results ──────────────
rep(
"        case '/mine/notify':        return mineNotify(body, env, origin, user);",
"        case '/mine/notify':        return mineNotify(body, env, origin, user);\n"
"        case '/mine/invites':       return mineInvites(body, env, origin, user);\n"
"        case '/mine/client-access': return mineClientAccess(body, env, origin, user);\n"
"        case '/mine/client-results': return mineClientResults(body, env, origin, user);",
'M2 authed field-rail routes')

# ── M3: the whole rail, mounted before the guest door it complements ────────
rep(
"/* ═══ SEAM:GUEST_LINK — the public response door ═════════════════════",
"""/* ═══ SEAM:FIELD_RAIL — the paid door ════════════════════════════════
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
const CONSENT_VERSION = 'mine-consent-2026-07';

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
    }
    out.push(entry);
  }
  return { n, floor: lim, floor_met: true, questions: out };
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
  const base = (env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\\/$/, '');
  try {
    if (op === 'mint') {
      // Accepts a pasted list or a parsed array — a client's customer export
      // and a hand-typed list arrive through the same door.
      let raw = body.list;
      if (typeof raw === 'string') raw = raw.split(/[\\n,;]+/);
      const seen = {};
      const people = [];
      for (const item of (Array.isArray(raw) ? raw : [])) {
        let email = '', name = '';
        if (item && typeof item === 'object') { email = String(item.email || ''); name = String(item.name || ''); }
        else { email = String(item || ''); }
        email = email.trim().toLowerCase();
        const m = email.match(/[^\\s@<>,;]+@[^\\s@<>,;]+\\.[^\\s@<>,;]{2,}/);
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
      const all = await sbRest(env,
        `study_invite?study_id=eq.${sid}&select=id,email,name,token,status&order=created_at`) || [];
      await logEvent(env, 'intelligence', 'mine', 'invites_mint', user.id,
        { study: sid, submitted: people.length, fresh: back.length });
      return json({ ok: true, minted: back.length, total: all.length,
        invites: all.map(i => ({ id: i.id, email: i.email, name: i.name, status: i.status,
          link: i.token ? base + '/intelligence/?t=' + i.token : null })) }, 200, origin, env);
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
  try { qs = await sbRest(env, `study_question?study_id=eq.${i.study_id}&select=id,ord,type,prompt,options&order=ord`); }
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

  const now = new Date().toISOString();
  try {
    await sbRest(env, 'response', { method: 'POST', headers: { Prefer: 'return=minimal' },
      body: { study_id: i.study_id, anon_id: anon, segments: [],
        answers, guest_email: i.email, status: 'submitted',
        invite_id: i.id, duration_ms: isNaN(dur) ? null : dur,
        started_at: body.started_at || null,
        quality: { flags: scan.flags }, quality_status: scan.status,
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
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email))
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
      `study_question?study_id=eq.${sid}&select=id,ord,type,prompt,options&order=ord`) || [];
    // No email, no ZIP, no responder_id crosses this line — a client read can
    // never carry PII because the select never asks for it.
    const rows = await sbRest(env,
      `response?study_id=eq.${sid}&select=anon_id,segments,answers,quality_status,submitted_at&limit=2000`) || [];
    const agg = aggregateResponses(rows, qs, RAIL.CLIENT_FLOOR);
    const out = { ok: true, role, study: { id: st.id, title: st.title, goal: st.goal,
      target_n: st.target_n || null, status: st.status },
      n: agg.n, floor: agg.floor, floor_met: agg.floor_met, questions: agg.questions };
    if (agg.floor_met && body.crosstab)
      out.crosstab = crossTab(rows, String(body.crosstab), 5);
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

/* ═══ SEAM:GUEST_LINK — the public response door ═════════════════════""",
'M3 field rail block')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
