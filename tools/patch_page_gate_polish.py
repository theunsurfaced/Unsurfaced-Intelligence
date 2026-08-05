#!/usr/bin/env python3
# patch_page_gate_polish.py — SEAM:DOOR_GATE polish: the injected Back-to-
# spaces button collided with the gate's own Home link (top-left stack) —
# dropped below it; and the mobile rail learns the hub + turnstile surfaces
# (doors stack, type scales, chrome wraps).
import io, os
PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ("back.style.cssText = 'position:absolute;top:18px;left:18px;",
   "back.style.cssText = 'position:absolute;top:74px;left:18px;",
   'P1 collision cleared'),
  ('  input,select,textarea{font-size:16px;}\n}',
   '  input,select,textarea{font-size:16px;}\n  /* SEAM:DOOR_GATE — hub + turnstile on phones: doors stack, type scales,\n     the escape button clears the gate chrome. */\n  .uai-triptych{flex-direction:column;gap:2px;}\n  .uai-door{min-height:150px;padding:22px 18px;}\n  .uai-h1{font-size:clamp(38px,11vw,56px);}\n  .uai-lede{font-size:14px;}\n  .uai-hub-top{flex-wrap:wrap;gap:8px;padding:12px 14px;}\n  .uai-hub-top .uai-back{font-size:10px;padding:7px 10px;}\n  .uai-hub-head{padding-left:16px;padding-right:16px;}\n  .uai-hub-base{font-size:9px;padding:0 16px 14px;}\n  .uai-space-inner{padding:0 16px;}\n  .uai-doors2{flex-direction:column;}\n  #uai-gate-back{top:64px !important;left:12px !important;font-size:9px !important;padding:7px 10px !important;}\n}',
   'P2 mobile rail covers hub + gate'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
