#!/usr/bin/env python3
# patch_worker_hotfix_send.py — the dishonest send, corrected.
# Applies ON TOP of patch_worker_client_surface.py. Target: worker/src/index.js
#
# The bug: sendEmail never throws — it resolves {skipped:true} (no API key) or
# {ok:false} (provider rejected). The send op only guarded against throws, so
# it marked invites 'sent', counted them, and reported success while nothing
# left the building. Three corrections:
#   1. sendEmail returns WHY it failed (status + provider detail).
#   2. The send op believes the result: only a true {ok:true} marks 'sent';
#      failures stay pending and the first failure's reason rides back to the
#      toast, so "no API key" vs "unverified sender domain" is visible in the UI.
#   3. op:'send' accepts retry_sent:true — re-sends rows already marked 'sent',
#      which un-sticks rows the old bug lied about and doubles as a reminder
#      mechanism for real fielding.

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

# ── S1: sendEmail says why ──────────────────────────────────────────────────
rep(
"""  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html })
  });
  return r.ok ? { ok: true } : { ok: false };""",
"""  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html })
  });
  if (r.ok) return { ok: true };
  let detail = '';
  try { detail = (await r.text()).slice(0, 200); } catch (e) {}
  return { ok: false, status: r.status, detail };""",
'S1 sendEmail says why')

# ── S2: the send op believes the result ─────────────────────────────────────
rep(
"""      const pend = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=eq.pending&token=not.is.null` +
        `&select=id,email,name,token&limit=80`) || [];
      if (!pend.length) return json({ ok: true, sent: 0, note: 'no pending invites' }, 200, origin, env);""",
"""      const wantStatuses = body.retry_sent ? 'in.(pending,sent)' : 'eq.pending';
      const pend = await sbRest(env,
        `study_invite?study_id=eq.${sid}&status=${wantStatuses}&token=not.is.null` +
        `&select=id,email,name,token&limit=80`) || [];
      if (!pend.length) return json({ ok: true, sent: 0, failed: 0, note: 'no pending invites' }, 200, origin, env);
      if (!env.RESEND_API_KEY)
        return json({ ok: false, error: 'mail_not_configured',
          note: 'RESEND_API_KEY is not set on the worker \\u2014 no email can send until it is' }, 200, origin, env);""",
'S2a retry flag + key gate')

rep(
"""        try {
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
      return json({ ok: true, sent, remaining: remain.length }, 200, origin, env);""",
"""        let res = null;
        try {
          res = await sendEmail(env, { to: iv.email,
            subject: 'You\\u2019re invited: \\u201c' + st2.title + '\\u201d'
              + ((st2.pay_cents || 0) > 0 ? ' \\u2014 paid study' : ''), html });
        } catch (e) { res = { ok: false, detail: String(e && e.message).slice(0, 120) }; }
        if (res && res.ok === true) {
          await sbRest(env, `study_invite?id=eq.${iv.id}`, { method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: { status: 'sent', sent_at: nowIso } }).catch(() => {});
          sent++;
        } else {
          failed++;
          if (!failDetail) failDetail = (res && res.status ? 'HTTP ' + res.status + ' \\u2014 ' : '')
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
        note: failed ? 'provider rejected ' + failed + ' \\u2014 common cause: EMAIL_FROM missing or on an unverified Resend domain' : null }, 200, origin, env);""",
'S2b result-checked send')

rep(
"      let sent = 0;\n      const nowIso = new Date().toISOString();",
"      let sent = 0;\n      let failed = 0;\n      let failDetail = null;\n      const nowIso = new Date().toISOString();",
'S2c failure counters')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
