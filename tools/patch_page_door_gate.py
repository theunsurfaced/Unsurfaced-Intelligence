#!/usr/bin/env python3
# patch_page_door_gate.py — SEAM:DOOR_GATE: the user journey inversion.
# GATE-BEHIND-THE-CLICK spec (July 27) executed: hub is the signed-out ground
# state, doors are turnstiles, sign-in lands inside the chosen territory.
# Approval law stacks unchanged; guest rail rides above the hub; recovery and
# pending flows still raise the gate directly.
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ('    if (data && data.session) { _currentUser = _userFromSb(data.session.user); _authShowApp(); }\n    else { _authShowGate(); }\n  } catch (e) { _authShowGate(); }',
   '    if (data && data.session) { _currentUser = _userFromSb(data.session.user); _authShowApp(); }\n    else { _showHubSignedOut(); }\n  } catch (e) { _showHubSignedOut(); }',
   'G1 connected boot lands on hub'),
  ('  } catch(e) {}\n  _authShowGate();\n}\n\nfunction _authShowGate() {',
   "  } catch(e) {}\n  _showHubSignedOut();\n}\n\n/* SEAM:DOOR_GATE — the user journey inversion (GATE-BEHIND-THE-CLICK spec).\n * Signed-out ground state is the HUB: three doors visible, gate risen only\n * when a door is chosen, destination stashed so sign-in lands the user\n * INSIDE the territory they picked. The gate is a turnstile mid-stride, not\n * a wall. Laws preserved: SEAM:APPROVAL still stacks (pending screen fires\n * after auth, before entry — the stash survives it); the guest rail rides\n * ABOVE the hub exactly as it rode above the gate (z-law unchanged);\n * recovery and pending flows still raise the gate directly. */\nfunction _showHubSignedOut() {\n  window._signedOut = true;\n  const g = document.getElementById('login-gate');\n  if (g) g.classList.add('hidden');\n  goHub();\n  const b = document.getElementById('uai-authbtn');\n  if (b) { b.textContent = 'Sign in \\u2192'; b.onclick = function () { _gateForDoor(null); }; }\n}\nfunction _gateForDoor(name) {\n  try { if (name) sessionStorage.setItem('pending_door', name); else sessionStorage.removeItem('pending_door'); } catch (e) {}\n  _authShowGate();\n  const g = document.getElementById('login-gate');\n  if (g && !document.getElementById('uai-gate-back')) {\n    const back = document.createElement('button');\n    back.id = 'uai-gate-back'; back.type = 'button';\n    back.textContent = '\\u2190 Back to spaces';\n    back.style.cssText = 'position:absolute;top:18px;left:18px;background:none;border:1px solid var(--border2);color:var(--text2);font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer;z-index:2';\n    back.onclick = function () {\n      try { sessionStorage.removeItem('pending_door'); } catch (e) {}\n      const g2 = document.getElementById('login-gate');\n      if (g2) g2.classList.add('hidden');\n      goHub();\n    };\n    g.appendChild(back);\n  }\n}\n\nfunction _authShowGate() {",
   'G2 local boot + the turnstile machinery'),
  ('function enterSpace(name){\n  _uaiHide();',
   'function enterSpace(name){\n  /* SEAM:DOOR_GATE — the turnstile. Signed out, the chosen door is stashed\n     and the gate rises; sign-in resumes INTO this exact space. */\n  if (window._signedOut) { _gateForDoor(name); return; }\n  _uaiHide();',
   'G3 door turnstile'),
  ('  _fiInitPending = true;\n  initFeaturedInsights();\n  goHub();\n}',
   "  _fiInitPending = true;\n  initFeaturedInsights();\n  window._signedOut = false;\n  const ab = document.getElementById('uai-authbtn');\n  if (ab) { ab.textContent = 'Sign out'; ab.onclick = function () { lgSignOut(); }; }\n  const gb = document.getElementById('uai-gate-back');\n  if (gb) gb.remove();\n  goHub();\n  /* SEAM:DOOR_GATE — land inside the chosen territory, not on a homepage. */\n  let door = null;\n  try { door = sessionStorage.getItem('pending_door'); sessionStorage.removeItem('pending_door'); } catch (e) {}\n  if (door) setTimeout(function () { try { enterSpace(door); } catch (e) {} }, 60);\n}",
   'G4 stash consumed on entry'),
  ('<button class="uai-back" style="position:static" onclick="lgSignOut()">Sign out</button>',
   '<button class="uai-back" style="position:static" id="uai-authbtn" onclick="lgSignOut()">Sign out</button>',
   'G5 auth button addressable'),
  ("function _guestJoinPanel() {\n  const em = (_guest && _guest.email) || '';\n  _guestClose();",
   "function _guestJoinPanel() {\n  const em = (_guest && _guest.email) || '';\n  _guestClose();\n  /* SEAM:DOOR_GATE — the gate is no longer the ground state; raise it before\n     pointing at its signup panel. */\n  _gateForDoor(null);",
   'G6 guest rail raises gate'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
