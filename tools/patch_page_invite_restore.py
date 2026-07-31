#!/usr/bin/env python3
# patch_page_invite_restore.py — the undo, and a send button you can always reach.
# Applies ON TOP of patch_page_hotfix_1.py. Target: intelligence/index.html
#
# Two field reports:
#   1. Revoked rows were a dead end with no way back. Restore button.
#   2. The send control only rendered when pending > 0, so a board of
#      revoked + sent rows offered no way to send anything at all — which is
#      exactly why no email was arriving. Send is now always reachable, and
#      when nothing is pending it becomes "Resend all" (retry_sent), which is
#      also the honest recovery for rows the old marking bug lied about.

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

# ── V1: send control is always reachable ────────────────────────────────────
rep(
"""    + '<button class="mr-btn mr-btn-primary" onclick="_invitesMint(\\'' + sid + '\\')">Mint links</button>'
    + ((t.pending || 0) > 0 ? '<button class="mr-btn" onclick="_invitesSend(\\'' + sid + '\\')">Send ' + t.pending + ' pending \\u2192</button>' : '')
    + '</div>';""",
"""    + '<button class="mr-btn mr-btn-primary" onclick="_invitesMint(\\'' + sid + '\\')">Mint links</button>'
    + ((t.pending || 0) > 0
        ? '<button class="mr-btn" onclick="_invitesSend(\\'' + sid + '\\')">Send ' + t.pending + ' pending \\u2192</button>'
        : ((t.sent || 0) > 0
            ? '<button class="mr-btn" onclick="_invitesSend(\\'' + sid + '\\',true)">Resend ' + t.sent + ' \\u2192</button>'
            : ''))
    + '</div>'
    + ((d.total || 0) === 0 ? '<p class="ma-muted" style="margin:-6px 0 14px">Minting creates the links. Sending is the second button \\u2014 nothing leaves until you press it.</p>' : '');""",
'V1 send always reachable')

# ── V2: send takes the retry flag ───────────────────────────────────────────
rep(
"""async function _invitesSend(sid) {
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'send' }) });
    const d = await r.json();
    if (d && d.ok) { showToast(d.sent + ' invitation' + (d.sent === 1 ? '' : 's') + ' sent' + (d.remaining ? ' \\u00B7 ' + d.remaining + ' remaining \\u2014 send again' : '')); _invitesLoad(sid); }
    else showToast(d && d.error === 'study_not_live' ? 'Launch the study before sending invites' : 'Send failed \\u2014 try again');
  } catch (e) { showToast('Send failed \\u2014 try again'); }
}""",
"""async function _invitesSend(sid, retrySent) {
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'send', retry_sent: !!retrySent }) });
    const d = await r.json();
    if (d && d.ok) {
      /* The provider's own words, surfaced. A failure that says nothing is how
         a whole evening gets spent looking in the wrong place. */
      if (d.failed) showToast(d.sent + ' sent, ' + d.failed + ' failed \\u2014 ' + (d.fail_detail || 'no reason given'));
      else showToast(d.sent + ' invitation' + (d.sent === 1 ? '' : 's') + ' sent'
        + (d.remaining ? ' \\u00B7 ' + d.remaining + ' still pending' : ''));
      _invitesLoad(sid);
    }
    else showToast(d && d.error === 'study_not_live' ? 'Launch the study before sending invites'
      : d && d.error === 'mail_not_configured' ? 'Mail is not configured on the worker \\u2014 RESEND_API_KEY is missing'
      : 'Send failed \\u2014 ' + ((d && d.error) || 'try again'));
  } catch (e) { showToast('Send failed \\u2014 try again'); }
}""",
'V2 send honors retry + surfaces reason')

# ── V3: Restore button on dead rows ─────────────────────────────────────────
rep(
"""    + (i.link && i.status !== 'revoked' && i.status !== 'responded'
        ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px" onclick="_inviteCopy(this,\\'' + safeAttr(i.link) + '\\')">Copy link</button>'
          + '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_inviteRevoke(\\'' + sid + '\\',\\'' + i.id + '\\')">Revoke</button>'
        : '') + '</span></div>').join('');""",
"""    + (i.status === 'revoked'
        ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px" onclick="_inviteRestore(\\'' + sid + '\\',\\'' + i.id + '\\')">Restore</button>'
        : (i.link && i.status !== 'responded'
            ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px" onclick="_inviteCopy(this,\\'' + safeAttr(i.link) + '\\')">Copy link</button>'
              + '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_inviteRevoke(\\'' + sid + '\\',\\'' + i.id + '\\')">Revoke</button>'
            : '')) + '</span></div>').join('');""",
'V3 restore button')

# ── V4: restore handler ─────────────────────────────────────────────────────
rep(
"function _inviteCopy(btn, link) {",
"""async function _inviteRestore(sid, id) {
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'restore', invite_id: id }) });
    const d = await r.json();
    showToast(d && d.ok ? 'Restored with a fresh link \\u2014 send it when ready' : 'Restore failed \\u2014 try again');
    _invitesLoad(sid);
  } catch (e) { showToast('Restore failed \\u2014 try again'); }
}
function _inviteCopy(btn, link) {""",
'V4 restore handler')

# ── V5: mint toast reports revivals ─────────────────────────────────────────
rep(
"    if (d && d.ok) { showToast(d.minted + ' new link' + (d.minted === 1 ? '' : 's') + ' minted'); _invitesLoad(sid); }",
"    if (d && d.ok) { showToast(d.minted + ' new link' + (d.minted === 1 ? '' : 's') + ' minted'\n"
"      + (d.revived ? ' \\u00B7 ' + d.revived + ' revoked restored' : '')\n"
"      + ' \\u2014 press Send to deliver them'); _invitesLoad(sid); }",
'V5 mint toast')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
