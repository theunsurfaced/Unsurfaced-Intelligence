#!/usr/bin/env python3
# patch_page_lake_publish.py — SEAM:LAKE_LOOP. Applies on current baseline.
import io, os
PATH = os.environ.get('TARGET', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s
OLD0 = '    + \'<button class="mr-btn" onclick="_respExport(\\\'\' + s.id + \'\\\')">Export CSV</button>\''
NEW0 = '    + \'<button class="mr-btn" onclick="_respExport(\\\'\' + s.id + \'\\\')">Export CSV</button>\'\n    + (admin ? \'<button class="mr-btn" onclick="_lakePublish(\\\'\' + s.id + \'\\\')">Publish to lake \\u2192</button>\' : \'\')'
assert s.count(OLD0) == 1, 'ANCHOR FAIL 0: ' + str(s.count(OLD0))
s = s.replace(OLD0, NEW0)
print('  OK  cut 0')
OLD1 = 'async function _dashReadLoad(config, data) {'
NEW1 = "/* SEAM:LAKE_LOOP — the admin door: one click sends floor-cleared field work\n * into the lake as tier-0 signal. The worker enforces every law; this button\n * just asks and reports. */\nasync function _lakePublish(sid) {\n  if (!confirm('Publish this study\\u2019s floor-cleared findings to the lake as tier-0 signal? Republishing updates the same entry.')) return;\n  try {\n    const d = await api('mine/publish-signal', { study_id: sid });\n    if (d && d.ok) showToast('Published \\u2014 \\u201c' + d.published.title.slice(0, 40) + '\\u201d is now lake signal (' + d.published.n + ' responses)');\n    else showToast(d && d.error === 'below_floor' ? 'Below the floor \\u2014 the lake only takes floor-cleared findings'\n      : d && d.error === 'admin_only' ? 'Admin only' : 'Publish failed \\u2014 ' + ((d && d.error) || 'try again'));\n  } catch (e) { showToast('Publish failed \\u2014 try again'); }\n}\nasync function _dashReadLoad(config, data) {"
assert s.count(OLD1) == 1, 'ANCHOR FAIL 1: ' + str(s.count(OLD1))
s = s.replace(OLD1, NEW1)
print('  OK  cut 1')
assert s != orig
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
