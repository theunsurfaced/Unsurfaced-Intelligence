#!/usr/bin/env python3
# patch_page_evo4_opener.py — EVO-4 opener: rationale layer + dashboard READ.
# Target: intelligence/index.html. Applies on top of patch_page_dash_honesty.py.
# Register: ROADMAPPED, per founder decision — every modeled module names its
# replacement path; the Lake block explains its own method; and the dashboard
# gains THE READ, compiled from its own evidence through the report-mode
# synthesizer (which auto-joins the lake). Thin corpus stays silent; failures
# render nothing; honest-fallback cards never feed the compiler.

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

CAP = "font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);font-weight:400"

rep('''        <div class="section-header" style="margin-bottom:20px"><span class="section-title">Intelligence Overview</span></div>
        <div class="idb-quad-grid" id="idb-quad-grid"></div>''',
'''        <div id="idb-read"></div>
        <div class="section-header" style="margin-bottom:20px"><span class="section-title">Intelligence Overview</span></div>
        <div class="idb-quad-grid" id="idb-quad-grid"></div>''',
'E1 READ container')

rep('      <span class="section-title">Signal Trend</span>',
    '      <span class="section-title">Signal Trend <span style="' + CAP + '">\u00b7 modeled \u2014 retires as the lake deepens; Lake Signal above is live</span></span>',
    'E2a signal trend caption')
rep('      <span class="section-title">Audience Intelligence</span>',
    '      <span class="section-title">Audience Intelligence <span style="' + CAP + '">\u00b7 modeled \u2014 retires as MINE panel data wires in</span></span>',
    'E2b audience intelligence caption')
rep('      <div class="section-header"><span class="section-title">Market Signals</span></div>',
    '      <div class="section-header"><span class="section-title">Market Signals <span style="' + CAP + '">\u00b7 modeled \u2014 retires as measured signal replaces it</span></span></div>',
    'E2c market signals caption')
rep('MODELED \u2014 illustrative segmentation \u00b7 live panel wiring in progress',
    'MODELED \u2014 retires as the MINE panel wires in \u00b7 measured segments replace these',
    'E2d segments caption roadmapped')

rep("      + (sig.top && sig.top.length ? '<div style=\"margin-top:10px;font-size:11px;color:var(--text2)\">Leading: '",
    "      + '<div style=\"' + mono + ';font-size:8px;color:var(--text3);margin-top:10px\">Method: semantic match of captured lake signal \\u00B7 similarity \\u2265 .30 \\u00B7 90-day window \\u00B7 tier per source registry</div>'\n"
    "      + (sig.top && sig.top.length ? '<div style=\"margin-top:10px;font-size:11px;color:var(--text2)\">Leading: '",
    'E3 lake method line')

rep("async function _brandLakeLoad(name) {",
'''/* SEAM:DASH_READ \u2014 the dashboard learns judgment. After render, the base
 * findings package as a corpus and flow through the same compiler reports
 * use (api() joins the lake automatically): THE READ lands above the
 * overview \u2014 reframe, then move \u2014 with up to three implications. Failure
 * renders nothing; the dashboard was already useful. */
async function _dashReadLoad(config, data) {
  const box = document.getElementById('idb-read');
  if (!box || !API_BASE) return;
  const src = (data && data.base && data.base.insights) || [];
  const corpus = src.filter(x => x.source && x.source !== 'Excavate' && x.source !== 'Synthesis')
    .slice(0, 16).map(x => ({ lens: x.category || 'consumer', source: x.source,
      title: String(x.title || '').slice(0, 160), text: String(x.excerpt || '').slice(0, 320),
      url: x.sourceUrl || '' }));
  if (corpus.length < 3) return;
  const mono2 = "font-family:'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase";
  box.innerHTML = '<div style="border:1px solid var(--border);background:var(--surface2);padding:14px 20px;margin-bottom:22px">'
    + '<span style="' + mono2 + ';font-size:9px;color:var(--text3)">Compiling the read\\u2026</span></div>';
  try {
    const d = await api('excavate/synthesize', { query: config.query || config.title, mode: 'report', corpus });
    if (!d || !d.ok || !d.data) { box.innerHTML = ''; return; }
    const read = d.data.read;
    const imps = (d.data.insights || []).filter(x => x.implication).slice(0, 3);
    if (!read && !imps.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<div style="border:1px solid rgba(74,222,128,.35);background:var(--surface2);padding:20px 24px;margin-bottom:26px">'
      + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">'
      + '<span style="' + mono2 + ';font-size:9px;color:#4ade80">THE READ \\u00B7 compiled from ' + (d.data.evidence_n || corpus.length) + ' evidence signals</span>'
      + '<span style="' + mono2 + ';font-size:9px;color:var(--text3)">earned confidence \\u00B7 every claim cited in All Findings</span></div>'
      + (read ? '<p style="font-family:\\'DM Serif Display\\',serif;font-size:19px;line-height:1.45;color:var(--text);margin:0 0 4px">' + safe(read[0]) + '</p>'
        + '<p style="font-size:14px;color:var(--text2);line-height:1.6;margin:0 0 12px">' + safe(read[1]) + '</p>' : '')
      + (imps.length ? '<div style="border-top:1px solid var(--border);padding-top:10px">'
        + imps.map(x => '<div style="font-size:12px;color:var(--text2);margin:5px 0">\\u2192 ' + safe(x.implication)
          + ' <span style="' + mono2 + ';font-size:8px;color:var(--text3)">' + safe(x.source) + ' \\u00B7 ' + safe(x.confidence) + '</span></div>').join('') + '</div>' : '')
      + '</div>';
  } catch (e) { box.innerHTML = ''; }
}
async function _brandLakeLoad(name) {''',
'E4 dashboard READ machinery')

rep('''    _idbData = data;
    _renderDashboard(config, data);''',
'''    _idbData = data;
    _renderDashboard(config, data);
    setTimeout(function () { try { _dashReadLoad(config, data); } catch (e) {} }, 200);''',
'E5 READ fires post-render')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
