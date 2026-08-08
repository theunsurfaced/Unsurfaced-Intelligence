#!/usr/bin/env python3
# patch_worker_share_slug.py — SEAM:SHARE_SLUG. Custom branded study permalinks.
import io, os
PATH = os.environ.get('TARGET', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ("  const sid = decodeURIComponent(path.slice('/s/'.length));\n  let ss; try { ss = await sbRest(env, `study?id=eq.${sid}&status=eq.live&select=id,title,goal,pay_cents`); } catch (e) { ss = null; }",
   "  /* SEAM:SHARE_SLUG — branded permalinks. /s/{key} resolves by UUID or by\n   * slug; slugs mint lazily from the title on first share and never change\n   * (permalink law: links must not rot). The live-only gate is unchanged —\n   * drafts and closed studies still render the generic card. */\n  const key = decodeURIComponent(path.slice('/s/'.length)).slice(0, 120);\n  const byId = /^[0-9a-f-]{36}$/i.test(key);\n  const q = byId ? `id=eq.${key}` : `slug=eq.${key.toLowerCase()}`;\n  let ss; try { ss = await sbRest(env, `study?${q}&status=eq.live&select=id,title,goal,pay_cents`); } catch (e) { ss = null; }\n  const sid = (ss && ss[0] && ss[0].id) || (byId ? key : '');",
   'W1 resolve by slug or id'),
  ("  const url = 'https://api.unsurfaced-intelligence.com/s/' + sid;",
   "  const slug = await ensureStudySlug(env, s);\n  const url = ((env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\\/$/, '')) + '/s/' + (slug || sid);",
   'W2 lake card branded url'),
  ('async function mineSharePage(',
   "function slugifyTitle(t) {\n  return String(t || '').toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '')\n    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'study';\n}\nasync function ensureStudySlug(env, study) {\n  if (!study || !study.id) return null;\n  if (study.slug) return study.slug;\n  try {\n    const cur = await sbRest(env, `study?id=eq.${study.id}&select=slug,title`);\n    if (cur && cur[0] && cur[0].slug) return cur[0].slug;\n    const base = slugifyTitle((cur && cur[0] && cur[0].title) || study.title);\n    for (let k = 0; k < 6; k++) {\n      const cand = k ? base + '-' + (k + 1) : base;\n      const taken = await sbRest(env, `study?slug=eq.${cand}&select=id`);\n      if (taken && taken.length) continue;\n      await sbRest(env, `study?id=eq.${study.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { slug: cand } });\n      return cand;\n    }\n  } catch (e) {}\n  return null;\n}\nasync function mineEnsureSlug(body, env, origin, user) {\n  const sid = String(body.study_id || '');\n  if (!/^[0-9a-f-]{36}$/i.test(sid)) return json({ ok: false, error: 'bad_id' }, 200, origin, env);\n  const ss = await sbRest(env, `study?id=eq.${sid}&select=id,partner_id,title,slug`);\n  const study = ss && ss[0];\n  if (!study) return json({ ok: false, error: 'not_found' }, 200, origin, env);\n  const admin = await callerIsAdmin(env, user.id);\n  if (!admin) {\n    const pp = await sbRest(env, `partner_profile?owner_id=eq.${user.id}&select=id`);\n    if (!(pp && pp[0] && pp[0].id === study.partner_id)) return json({ ok: false, error: 'forbidden' }, 403, origin, env);\n  }\n  const slug = await ensureStudySlug(env, study);\n  return json({ ok: true, slug, url: ((env.APP_URL || 'https://unsurfaced-intelligence.com').replace(/\\/$/, '')) + '/s/' + (slug || sid) }, 200, origin, env);\n}\nasync function mineSharePage(",
   'W3 slug machinery + endpoint'),
  ("        case '/email/study-invite':  return emailStudyInvite(body, env, origin, user);",
   "        case '/email/study-invite':  return emailStudyInvite(body, env, origin, user);\n        case '/mine/ensure-slug':    return mineEnsureSlug(body, env, origin, user);",
   'W4 route'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
