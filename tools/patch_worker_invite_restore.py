#!/usr/bin/env python3
# patch_worker_invite_restore.py — revoke must be reversible.
# Applies ON TOP of patch_worker_hotfix_send.py. Target: worker/src/index.js
#
# The trap: revoke nulls the token (right — the live link must die at once),
# but mint inserts with resolution=ignore-duplicates against the existing
# (study_id, email) key. So re-minting a revoked address hits the conflict,
# gets skipped, and that person can never be invited to that study again.
# Silent, permanent, and entirely my doing.
#
# Fix, two parts:
#   1. mint REVIVES: after the insert, any submitted email whose row is
#      revoked or tokenless gets a fresh token and returns to pending. Rows
#      with a live token are never touched — a link someone already holds
#      must keep working.
#   2. op:'restore' — an explicit per-row undo for the same operation.

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

# ── R1: mint revives revoked / tokenless rows ───────────────────────────────
rep(
"""      const back = await sbRest(env, 'study_invite?on_conflict=study_id,email', {
        method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
        body: rows }) || [];
      const all = await sbRest(env,
        `study_invite?study_id=eq.${sid}&select=id,email,name,token,status&order=created_at`) || [];""",
"""      const back = await sbRest(env, 'study_invite?on_conflict=study_id,email', {
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
        `study_invite?study_id=eq.${sid}&select=id,email,name,token,status&order=created_at`) || [];""",
'R1 mint revives')

rep(
"""      await logEvent(env, 'intelligence', 'mine', 'invites_mint', user.id,
        { study: sid, submitted: people.length, fresh: back.length });
      return json({ ok: true, minted: back.length, total: all.length,""",
"""      await logEvent(env, 'intelligence', 'mine', 'invites_mint', user.id,
        { study: sid, submitted: people.length, fresh: back.length, revived });
      return json({ ok: true, minted: back.length, revived, total: all.length,""",
'R1b mint reports revived')

# ── R2: explicit restore op ─────────────────────────────────────────────────
rep(
"    if (op === 'revoke') {\n      const id = String(body.invite_id || '');",
"""    if (op === 'restore') {
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
      const id = String(body.invite_id || '');""",
'R2 restore op')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
