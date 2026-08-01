#!/usr/bin/env python3
# patch_worker_evolution1.py — EVOLUTION 1, worker side.
# Target: worker/src/index.js. Applies on top of patch_worker_clickpath.py.
#
# Two jobs:
#   1. Consent version bumps to 2026-08 — the consent copy now names behavior
#      capture, and a consent record that predates its own text is worthless.
#      The version stamps which words were on screen when the box was ticked.
#   2. Milestone mail reaches granted clients at the two moments the client
#      room is most worth opening: the floor crossing (findings just opened)
#      and the target (study complete). The dashboard polls; humans don't.

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

# ── E1: consent version stamps the new words ────────────────────────────────
rep(
"const CONSENT_VERSION = 'mine-consent-2026-07';",
"/* SEAM:EVOLUTION_1 — v2 names behavior capture. The version is the receipt\n"
" * of WHICH words were agreed to; new words require a new version. */\n"
"const CONSENT_VERSION = 'mine-consent-2026-08-behavior';",
'E1 consent version v2')

# ── E2: milestone mail reaches granted clients at floor + target ────────────
rep(
"""    await sendEmail(env, { to, subject: atTarget ? `\"${s.title}\" hit its target \\u2014 ${n} responses, study closed` : `\"${s.title}\" \\u2014 ${n} response${n === 1 ? '' : 's'} in`, html: `<div style=\"font-family:system-ui,sans-serif;line-height:1.6\"><h2 style=\"margin:0 0 8px\">${n} response${n === 1 ? '' : 's'} on \\u201c${s.title}\\u201d</h2><p>${atTarget ? 'Your target was reached and the study auto-closed. The full read is waiting.' : 'Your study is collecting. Open it to generate the Read.'}</p>${base ? `<p><a href=\"${base}/intelligence/\">Open MINE \\u2192</a></p>` : ''}</div>` });
  } catch (e) {}
}""",
"""    await sendEmail(env, { to, subject: atTarget ? `\"${s.title}\" hit its target \\u2014 ${n} responses, study closed` : `\"${s.title}\" \\u2014 ${n} response${n === 1 ? '' : 's'} in`, html: `<div style=\"font-family:system-ui,sans-serif;line-height:1.6\"><h2 style=\"margin:0 0 8px\">${n} response${n === 1 ? '' : 's'} on \\u201c${s.title}\\u201d</h2><p>${atTarget ? 'Your target was reached and the study auto-closed. The full read is waiting.' : 'Your study is collecting. Open it to generate the Read.'}</p>${base ? `<p><a href=\"${base}/intelligence/\">Open MINE \\u2192</a></p>` : ''}</div>` });
  } catch (e) {}
  /* SEAM:EVOLUTION_1 — the client's two moments. Floor crossing (n exactly at
   * the floor: findings just opened) and target (study complete). Exact
   * equality is the dedup: each count is crossed once. Failures never block
   * the response path — this whole block is advisory. */
  try {
    const floorHit = n === RAIL.CLIENT_FLOOR;
    if (!(floorHit || atTarget)) return;
    const grants = await sbRest(env, `study_client?study_id=eq.${sid}&select=email`) || [];
    const base2 = (env.APP_URL || '').replace(/\\/$/, '');
    for (const g of grants) {
      if (!g.email) continue;
      await sendEmail(env, { to: g.email,
        subject: floorHit ? `Findings just opened on \\u201c${s.title}\\u201d`
          : `\\u201c${s.title}\\u201d is complete \\u2014 ${n} responses`,
        html: `<div style=\"font-family:system-ui,sans-serif;line-height:1.6;max-width:520px\">`
          + `<div style=\"font-weight:800;font-size:22px;letter-spacing:-.01em\">Unsurfaced</div>`
          + `<div style=\"height:3px;background:#C41230;margin:8px 0 20px\"></div>`
          + `<h2 style=\"margin:0 0 10px;font-size:19px\">${floorHit ? 'Your live results just opened' : 'Your study is complete'}</h2>`
          + `<p style=\"margin:0 0 14px\">${floorHit
              ? `\\u201c${s.title}\\u201d crossed ${n} quality responses \\u2014 the per-question read, verbatims, and behavior data are now live in your results room.`
              : `\\u201c${s.title}\\u201d reached its target with ${n} responses. The full read is ready.`}</p>`
          + (base2 ? `<p><a href=\"${base2}/intelligence/\" style=\"background:#C41230;color:#fff;padding:12px 22px;text-decoration:none;font-weight:700;border-radius:4px;display:inline-block\">Open your results \\u2192</a></p>` : '')
          + `<p style=\"margin:18px 0 0;font-size:12px;color:#888\">UNSURFACED\\u2122 \\u00B7 Consumer & Market Intelligence</p></div>` }).catch(() => {});
    }
  } catch (e) {}
}""",
'E2 client milestone mail')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
