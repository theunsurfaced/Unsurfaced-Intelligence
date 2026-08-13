#!/usr/bin/env python3
# patch_page_analysis_rail.py — SEAM:ANALYSIS_RAIL phase 1: segment lens (floor law rides the
# filtered n), top-2-box, THE MINE READ (compiled two-liner + themes with
# VERBATIM-verified quotes, no invented counts), KV-cached by n+segment.
import io, os
PATH = os.environ.get('TARGET', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
PAIRS = [
  ('    const bodyReq = { study_id: sid };\n    if (_clientCache && _clientCache.sid === sid && _clientCache.crosstab) bodyReq.crosstab = _clientCache.crosstab;',
   '    const bodyReq = { study_id: sid };\n    if (_clientCache && _clientCache.sid === sid && _clientCache.crosstab) bodyReq.crosstab = _clientCache.crosstab;\n    if (_clientCache && _clientCache.sid === sid && _clientCache.segment) bodyReq.segment = _clientCache.segment;',
   'P1a request carries segment'),
  ('    _clientCache = { sid, data: d, crosstab: bodyReq.crosstab || null };',
   '    _clientCache = { sid, data: d, crosstab: bodyReq.crosstab || null, segment: bodyReq.segment || null };',
   'P1b cache remembers'),
  ('  h += \'<p class="ma-muted" style="font-family:\\\'Space Mono\\\',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>Live \\u00B7 refreshes each minute \\u00B7 rejected responses never counted</span>\'\n    + (d.floor_met ? \'<button class="u-trace" onclick="_clientReport()">Download report \\u2913</button>\' : \'\') + \'</p>\';',
   '  h += \'<p class="ma-muted" style="font-family:\\\'Space Mono\\\',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>Live \\u00B7 refreshes each minute \\u00B7 rejected responses never counted</span>\'\n    + (d.floor_met ? \'<button class="u-trace" onclick="_clientReport()">Download report \\u2913</button>\' : \'\') + \'</p>\';\n  /* SEAM:ANALYSIS_RAIL — the segment lens + THE MINE READ. */\n  if ((d.segments || []).length > 1 || d.segment) {\n    h += \'<div style="margin:10px 0 4px"><select onchange="_clientSegment(this.value)" style="background:var(--surface,#111);color:var(--text,#eee);border:1px solid rgba(255,255,255,.15);font-family:\\\'Space Mono\\\',monospace;font-size:10px;letter-spacing:.08em;padding:8px 10px;max-width:100%">\'\n      + \'<option value=""\' + (!d.segment ? \' selected\' : \'\') + \'>All segments \\u00B7 \' + d.n + \'</option>\'\n      + (d.segments || []).map(s2 => \'<option value="\' + safeAttr(s2.name) + \'"\' + (d.segment === s2.name ? \' selected\' : \'\') + \'>\' + safe(s2.name) + \' \\u00B7 \' + s2.n + \'</option>\').join(\'\')\n      + \'</select></div>\';\n  }\n  if (d.insight && d.insight.read) {\n    h += \'<div style="border:1px solid rgba(74,222,128,.35);background:var(--surface,#101014);padding:18px 20px;margin:12px 0 18px">\'\n      + \'<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px">\'\n      + \'<span style="font-family:\\\'Space Mono\\\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#4ade80">THE READ \\u00B7 compiled from \' + safe(d.insight.basis) + \'</span>\'\n      + \'<span style="font-family:\\\'Space Mono\\\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text2,#888)">quotes verbatim \\u00B7 themes read, not counted</span></div>\'\n      + \'<p style="font-size:16px;font-weight:700;line-height:1.5;margin:0 0 4px">\' + safe(d.insight.read[0]) + \'</p>\'\n      + \'<p style="font-size:13px;color:var(--text2,#aaa);line-height:1.6;margin:0">\' + safe(d.insight.read[1]) + \'</p>\'\n      + ((d.insight.themes || []).length ? \'<div style="border-top:1px solid rgba(255,255,255,.08);margin-top:12px;padding-top:8px">\'\n        + d.insight.themes.map(t => \'<div style="margin:7px 0"><span style="font-family:\\\'Space Mono\\\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text)">\' + safe(t.name) + \'</span>\'\n          + (t.quotes || []).map(qq => \'<div style="font-size:12px;color:var(--text2,#999);font-style:italic;margin:3px 0 0 10px">\\u201c\' + safe(qq) + \'\\u201d</div>\').join(\'\') + \'</div>\').join(\'\')\n        + \'</div>\' : \'\')\n      + \'</div>\';\n  }',
   'P2 lens UI + the read block'),
  ('function _clientReport() {',
   '/* SEAM:ANALYSIS_RAIL — switch the lens, refetch, floor law rides along. */\nfunction _clientSegment(seg) {\n  if (!_clientCache) return;\n  _clientCache.segment = seg || null;\n  _clientLoadResults(_clientCache.sid);\n}\nfunction _clientReport() {',
   'P3 segment handler'),
  ('    h += \'<div class="ma-sum"><div class="ma-q">\' + safe(q.prompt) + \' <span class="ma-muted">\\u00B7 \' + q.answered + \' answered</span></div>\'',
   '    h += \'<div class="ma-sum"><div class="ma-q">\' + safe(q.prompt) + \' <span class="ma-muted">\\u00B7 \' + q.answered + \' answered\' + (q.t2b != null ? \' \\u00B7 T2B \' + q.t2b + \'%\' : \'\') + \'</span></div>\'',
   'P4 t2b chip'),
]
for old, new, tag in PAIRS:
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n}'
    s = s.replace(old, new)
    print('  OK  ' + tag)
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
