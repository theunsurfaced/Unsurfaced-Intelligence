#!/usr/bin/env python3
# patch_page_field_rail.py — MINE FIELD RAIL, arrival side.
# Target: intelligence/index.html
# The token flow reuses the guest overlay wholesale: same question renderer,
# same modal, same submit shape. Token mode differs in four ways only —
# the study is fetched by token, the email is known and locked, there is no
# ZIP box, and the response is timed. Free guest studies behave exactly as
# they do today; every branch below is gated on _guest.token.

import io, os

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── G1: ?t= param opens the invited door ────────────────────────────────────
rep(
"    if (p.has('funded') || p.has('payout')) { p.delete('funded'); p.delete('payout');",
"""    /* SEAM:FIELD_RAIL — an invited link. Unlike ?study= this fires signed in
       or out: the token is the credential, not the session. */
    if (p.has('t')) { const _tok = p.get('t'); setTimeout(() => { try { _tokenMaybeOpen(_tok); } catch (e5) {} }, 200); p.delete('t'); const q2 = p.toString(); history.replaceState({}, '', window.location.pathname + (q2 ? '?' + q2 : '')); }
    if (p.has('funded') || p.has('payout')) { p.delete('funded'); p.delete('payout');""",
'G1 token param hook')

# ── G2: token opener, beside the guest opener it mirrors ────────────────────
rep(
"function _guestSet(qid, val, multi) {",
"""/* SEAM:FIELD_RAIL — the invited person's door. The panel is 3 people, so paid
 * studies field by token, not by account. Opens for signed-in and signed-out
 * alike; the token identifies the respondent, so a session would add nothing
 * but friction. */
async function _tokenMaybeOpen(tok) {
  if (!tok || !API_BASE) return;
  try {
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/t?token=' + encodeURIComponent(tok));
    const d = await r.json();
    if (!d || !d.ok || !d.data) {
      const code = d && d.error;
      showToast(code === 'already_responded' ? 'This invitation has already been used'
        : code === 'token_revoked' ? 'This invitation is no longer active'
        : code === 'study_closed' ? 'This study has closed \\u2014 thank you'
        : 'This invitation link is not valid');
      return;
    }
    _guest = { s: d.data, answers: {}, consent: false, token: tok,
      email: d.data.invited_email || '', startedAt: Date.now(),
      consentVersion: d.data.consent_version || null };
    _guestRender();
  } catch (e) {}
}
function _guestSet(qid, val, multi) {""",
'G2 token opener')

# ── G3: render — token mode swaps the eyebrow, locks email, drops ZIP ───────
rep(
"""  wrap.innerHTML = '<div class="sb" role="dialog" aria-modal="true"><button class="sb-close" onclick="_guestClose()">CLOSE \\u2715</button>'
    + '<div class="sb-eyebrow">MINE \\u00B7 Free study</div><h2>' + safe(s.title) + '</h2>'
    + (s.goal ? '<div class="sb-sub">' + safe(s.goal) + '</div>' : '')
    + media
    + (s.questions || []).map((q, i) => _guestQ(q, i)).join('')
    + '<div style="font-weight:700;margin:18px 0 4px">Your email</div><input id="guest-email" type="email" placeholder="you@example.com" style="' + inp + '" value="' + safeAttr(_guest.email || '') + '">'
    + '<div style="font-weight:700;margin:6px 0 4px">ZIP code</div><input id="guest-zip" type="text" inputmode="numeric" maxlength="5" placeholder="60452" style="' + inp + '" value="' + safeAttr(_guest.zip || '') + '">'
    + '<label class="mr-check" style="margin:8px 0 14px;display:block"><input type="checkbox"' + (_guest.consent ? ' checked' : '') + ' onchange="_guest.consent=this.checked"> I consent to my response being used as research. This is a free study \\u2014 no compensation.</label>'
    + '<button class="mr-btn mr-btn-primary" onclick="_guestSubmit()">Submit response \\u2192</button></div>';""",
"""  /* SEAM:FIELD_RAIL — one modal, two doors. Token mode is an invited paid
     study: the email is already known, so it is shown and locked rather than
     asked for, ZIP is dropped, and the consent line names the compensation. */
  const _tk = !!(_guest && _guest.token);
  const _pay = (s.pay_cents || 0) > 0 ? ('$' + ((s.pay_cents || 0) / 100).toFixed(2).replace(/\\.00$/, '')) : null;
  const _idBlock = _tk
    ? '<div style="font-weight:700;margin:18px 0 4px">Responding as</div>'
      + '<input id="guest-email" type="email" readonly style="' + inp + ';opacity:.7" value="' + safeAttr(_guest.email || '') + '">'
    : '<div style="font-weight:700;margin:18px 0 4px">Your email</div><input id="guest-email" type="email" placeholder="you@example.com" style="' + inp + '" value="' + safeAttr(_guest.email || '') + '">'
      + '<div style="font-weight:700;margin:6px 0 4px">ZIP code</div><input id="guest-zip" type="text" inputmode="numeric" maxlength="5" placeholder="60452" style="' + inp + '" value="' + safeAttr(_guest.zip || '') + '">';
  const _consentLine = _tk
    ? 'I am 18 or older and I consent to my response being used as research for this brand. I can withdraw and request deletion at any time.'
    : 'I consent to my response being used as research. This is a free study \\u2014 no compensation.';
  wrap.innerHTML = '<div class="sb" role="dialog" aria-modal="true"><button class="sb-close" onclick="_guestClose()">CLOSE \\u2715</button>'
    + '<div class="sb-eyebrow">MINE \\u00B7 ' + (_tk ? ('Invited study' + (_pay ? ' \\u00B7 ' + _pay : '')) : 'Free study') + '</div><h2>' + safe(s.title) + '</h2>'
    + (s.goal ? '<div class="sb-sub">' + safe(s.goal) + '</div>' : '')
    + media
    + (s.questions || []).map((q, i) => _guestQ(q, i)).join('')
    + _idBlock
    + '<label class="mr-check" style="margin:8px 0 14px;display:block"><input type="checkbox"' + (_guest.consent ? ' checked' : '') + ' onchange="_guest.consent=this.checked"> ' + _consentLine + '</label>'
    + '<button class="mr-btn mr-btn-primary" onclick="_guestSubmit()">Submit response \\u2192</button></div>';""",
'G3 token-aware render')

# ── G4: submit — token branch posts to the token door with timing ───────────
rep(
"""async function _guestSubmit() {
  const s = _guest.s;
  const email = (document.getElementById('guest-email') || {}).value || '';""",
"""async function _guestSubmit() {
  const s = _guest.s;
  /* SEAM:FIELD_RAIL — the invited branch. duration_ms is the honest read of
     how long this took; the worker's quality scan uses it to catch a farmed
     response. Nothing here decides anything — the scan flags, an admin
     judges. */
  if (_guest.token) {
    const req = (s.questions || []).filter(q => q.type !== 'open');
    const ok = req.every(q => { const a = _guest.answers[q.id]; return a != null && (!Array.isArray(a) || a.length); });
    if (!ok) { showToast('Please answer the required questions'); return; }
    if (!_guest.consent) { showToast('Please confirm consent to continue'); return; }
    try {
      const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/t/respond', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: _guest.token, answers: _guest.answers, consent: true,
          consent_version: _guest.consentVersion || null,
          started_at: new Date(_guest.startedAt || Date.now()).toISOString(),
          duration_ms: Date.now() - (_guest.startedAt || Date.now()) }) });
      const d = await r.json();
      if (d && d.ok) { _guest.done = true; _guest.screened = !!(d.data && d.data.screened); _guestRender(); return; }
      const code = d && d.error;
      showToast(code === 'already_responded' ? 'This invitation has already been used'
        : code === 'study_closed' ? 'This study has closed \\u2014 thank you'
        : code === 'consent_required' ? 'Please confirm consent to continue'
        : 'Submit failed \\u2014 try again');
    } catch (e) { showToast('Submit failed \\u2014 try again'); }
    return;
  }
  const email = (document.getElementById('guest-email') || {}).value || '';""",
'G4 token submit branch')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
