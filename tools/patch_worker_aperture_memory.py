#!/usr/bin/env python3
# patch_worker_aperture_memory.py — SEAM:APERTURE cut 1: cross-issue memory.
# The trailing 7 days of published stories become the dedup memory; matches
# are suppressed and counted (the count feeds the RECURRENCE strip next).
# NOTE: the prior-stories table name (edition_stories) is UNVERIFIED — if it
# differs, the fetch fails into the catch and compose runs memoryless (safe
# no-op). Verify with the command in the handoff before trusting suppression.
import io, os
PATH = os.environ.get('TARGET', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s
OLD = '  const picks = slotFill(cands, DAILY_POV.edition.quotas);\n  if (picks.length < 6) return null;'
NEW = "  /* SEAM:APERTURE — cross-issue memory. slotFill deduped within one issue;\n   * nothing remembered yesterday, so the same story re-entered daily — the\n   * repetition Fresco named. Now the trailing 7 days of published stories\n   * are the memory: a candidate matching a recent pick (sameStory: vector\n   * or entity law) is suppressed from fresh slots and counted — the count\n   * ships in the compose log today and feeds the RECURRENCE strip next.\n   * Failure to fetch history never blocks an edition. */\n  let recurring = 0;\n  let pool = cands;\n  try {\n    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);\n    const prior = await sbRest(env,\n      `edition_stories?select=title,source_name,editions!inner(date,status)&editions.date=gte.${since}&editions.status=eq.published&limit=120`) || [];\n    if (prior.length) {\n      const fresh = [];\n      for (const c of pool) {\n        if (prior.some(p => sameStory(p, c))) { recurring++; continue; }\n        fresh.push(c);\n      }\n      if (fresh.length >= 6) pool = fresh;\n      await logEvent(env, 'daily', 'compose', 'cross_issue_dedup', null, { prior: prior.length, suppressed: recurring, fresh: fresh.length });\n    }\n  } catch (e) { /* memoryless compose beats no compose */ }\n\n  const picks = slotFill(pool, DAILY_POV.edition.quotas);\n  if (picks.length < 6) return null;"
n = s.count(OLD)
assert n == 1, f'ANCHOR FAIL: {n}'
s = s.replace(OLD, NEW)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'  OK  aperture memory · WROTE {PATH} ({len(s)} chars)')
