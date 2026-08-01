#!/usr/bin/env python3
# merge_seams_insight_compiler.py — register SEAM:INSIGHT_COMPILER. Repo root.

import io, json

s = json.load(open('seams.json'))
assert 'registry' in s, 'no registry key — top level is: ' + str(list(s.keys()))

add = {
  "SEAM:INSIGHT_COMPILER": {
    "file": "worker/src/index.js",
    "purpose": "synthesize report mode: THE READ two-liner (reframe then move), per-insight implication, anti-metadata law in the prompt (never restate counts as findings, name disagreements), EARNED confidence from evidence density per category (3+ High / 2 Medium / 1 Low) — never hardcoded, never the model's self-grade" },
  "SEAM:INSIGHT_COMPILER@arrival": {
    "file": "intelligence/index.html",
    "tag": "SEAM:INSIGHT_COMPILER",
    "purpose": "reports complete on DATA not animation (bar parks at 94 until corpus fetched AND compiled); corpus flows through /excavate/synthesize; honest fallback ships as RETRIEVAL SUMMARY with confidence demoted to Unverified; padding loop dead (empty lens says so once at Low); Signal-Signal doubling dead; truth chips — audience panel and brand trend lines say MODELED until EVO-3 computes them from the lake" }
}

for k in add:
    s['registry'].pop(k, None)
    s.pop(k, None)
before = len(s['registry'])
s['registry'].update(add)
io.open('seams.json', 'w', encoding='utf-8').write(json.dumps(s, indent=1) + '\n')

chk = json.load(open('seams.json'))
reg = {(e.get('tag', k), e['file']) for k, e in chk['registry'].items()}
need = [('SEAM:INSIGHT_COMPILER', 'worker/src/index.js'), ('SEAM:INSIGHT_COMPILER', 'intelligence/index.html')]
missing = [x for x in need if x not in reg]
assert not missing, 'STILL MISSING: ' + str(missing)
print(f'REGISTRY: {before} -> {len(chk["registry"])} entries, gate-style lookup verified')
