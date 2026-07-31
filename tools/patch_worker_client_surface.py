#!/usr/bin/env python3
# patch_worker_client_surface.py — MINE overhaul, worker side part 2.
# Applies ON TOP of patch_worker_field_rail.py. Target: worker/src/index.js
# Two additions: the 'send' op (fielding is email, not link-copying by hand)
# and /mine/client-studies (a client's home needs a list of their grants).

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

# ── C1: client-studies route in the authed switch ───────────────────────────
rep(
"        case '/mine/client-results': return mineClientResults(body, env, origin, user);",
"        case '/mine/client-results': return mineClientResults(body, env, origin, user);\n"
"        case '/mine/client-studies': return mineClientStudies(env, origin, user);",
'C1 client-studies route')

# ── C2: the send op inside mineInvites, before revoke ───────────────────────
rep(
"""    if (op === 'revoke') {
      const id = String(body.invite_id || '');""",
"""    if (op === 'send') {
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
      const pend = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=eq.pending&token=not.is.null` +
        `&select=id,email,name,token&limit=80`) || [];
      if (!pend.length) return json({ ok: true, sent: 0, note: 'no pending invites' }, 200, origin, env);
      const payLine = (st2.pay_cents || 0) > 0
        ? '<p style="margin:0 0 14px"><b>$' + ((st2.pay_cents || 0) / 100).toFixed(2).replace(/\\.00$/, '')
          + '</b> for your completed response.</p>' : '';
      let sent = 0;
      const nowIso = new Date().toISOString();
      for (const iv of pend) {
        const link = base + '/intelligence/?t=' + iv.token;
        const hi = iv.name ? iv.name.split(' ')[0] : 'there';
        const html = '<div style="font-family:system-ui,sans-serif;line-height:1.6;max-width:520px">'
          + '<div style="font-weight:800;font-size:22px;letter-spacing:-.01em">Unsurfaced</div>'
          + '<div style="height:3px;background:#C41230;margin:8px 0 20px"></div>'
          + '<p style="margin:0 0 6px">Hi ' + hi + ',</p>'
          + '<h2 style="margin:0 0 10px;font-size:19px">You\\u2019re invited: \\u201c' + st2.title + '\\u201d</h2>'
          + (st2.goal ? '<p style="margin:0 0 14px;color:#444">' + st2.goal + '</p>' : '')
          + payLine
          + '<p style="margin:0 0 18px">Your link is personal and works once \\u2014 a few minutes, real questions, no account needed.</p>'
          + '<p><a href="' + link + '" style="background:#C41230;color:#fff;padding:12px 22px;'
          + 'text-decoration:none;font-weight:700;border-radius:4px;display:inline-block">Take the study \\u2192</a></p>'
          + '<p style="margin:18px 0 0;font-size:12px;color:#888">UNSURFACED\\u2122 \\u00B7 Consumer & Market Intelligence</p></div>';
        try {
          await sendEmail(env, { to: iv.email,
            subject: 'You\\u2019re invited: \\u201c' + st2.title + '\\u201d'
              + ((st2.pay_cents || 0) > 0 ? ' \\u2014 paid study' : ''), html });
          await sbRest(env, `study_invite?id=eq.${iv.id}`, { method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: { status: 'sent', sent_at: nowIso } });
          sent++;
        } catch (e) { /* leave it pending; the next send picks it up */ }
      }
      const remain = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=eq.pending&select=id`) || [];
      await logEvent(env, 'intelligence', 'mine', 'invites_send', user.id,
        { study: sid, sent, remaining: remain.length });
      return json({ ok: true, sent, remaining: remain.length }, 200, origin, env);
    }
    if (op === 'revoke') {
      const id = String(body.invite_id || '');""",
'C2 send op')

# ── C3: client-studies function, mounted before the guest door ──────────────
rep(
"/* ═══ SEAM:GUEST_LINK — the public response door ═════════════════════",
"""/* SEAM:CLIENT_LENS — a client's home: every study they hold a grant on, with
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

/* ═══ SEAM:GUEST_LINK — the public response door ═════════════════════""",
'C3 client-studies fn')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
