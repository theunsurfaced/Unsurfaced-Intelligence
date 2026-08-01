#!/usr/bin/env python3
# patch_page_brand_signal.py — EX-EVO-3, page side.
# Target: intelligence/index.html. Applies on top of patch_page_insight_compiler.py.
# The brand dashboard grows a LAKE SIGNAL block: the first measured numbers on
# a surface full of modeled ones, and the contrast is the point. Thin lake =
# honest "not enough captured signal yet" — the MODELED chips stay until the
# lake earns their replacement.

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

# ── L1: the container rides above Signal Trend ──────────────────────────────
rep(
"""    <div class="section-header">
      <span class="section-title">Signal Trend</span>""",
"""    <div id="lake-signal-block"></div>
    <div class="section-header">
      <span class="section-title">Signal Trend</span>""",
'L1 container')

# ── L2: the loader fires when a brand dashboard opens ───────────────────────
rep(
"function excavateBrand(name) {",
"""/* SEAM:MOAT_1 — the measured block. Fetches computed lake signal for the
 * brand and renders it labeled COMPUTED with its timestamp, above the modeled
 * chart. Thin lake says so plainly. Failures render nothing — a missing
 * measurement is not an error state, it is the pre-moat world. */
async function _brandLakeLoad(name) {
  const box = document.getElementById('lake-signal-block');
  if (!box || !API_BASE) return;
  box.innerHTML = '';
  try {
    const d = await api('excavate/brand-signal', { brand: name });
    if (!d || !d.ok || !d.signal) return;
    const sig = d.signal;
    const mono = "font-family:'Space Mono',monospace;letter-spacing:.12em;text-transform:uppercase";
    if (sig.thin) {
      box.innerHTML = '<div style="border:1px solid var(--border);background:var(--surface);padding:14px 18px;margin:0 0 18px">'
        + '<div style="' + mono + ';font-size:9px;color:var(--text3)">UNSURFACED LAKE \\u00B7 COMPUTED</div>'
        + '<div style="font-size:12px;color:var(--text2);margin-top:6px">' + (sig.matches || 0) + ' captured signal' + (sig.matches === 1 ? '' : 's') + ' touch this brand \\u2014 not enough to measure yet. The lake deepens daily; measured momentum replaces the modeled chart when evidence earns it.</div></div>';
      return;
    }
    const up = sig.momentum_pct >= 0;
    box.innerHTML = '<div style="border:1px solid rgba(74,222,128,.35);background:var(--surface);padding:16px 18px;margin:0 0 18px">'
      + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'
      + '<span style="' + mono + ';font-size:9px;color:#4ade80">UNSURFACED LAKE \\u00B7 COMPUTED \\u2014 not modeled</span>'
      + '<span style="' + mono + ';font-size:9px;color:var(--text3)">computed ' + new Date(d.computed_at).toLocaleDateString() + '</span></div>'
      + '<div style="display:flex;gap:26px;flex-wrap:wrap;margin-top:12px">'
      + '<span><b style="font-size:20px">' + sig.mentions_90d + '</b> <span style="' + mono + ';font-size:9px;color:var(--text3)">signals \\u00B7 90d</span></span>'
      + '<span><b style="font-size:20px;color:' + (up ? '#4ade80' : 'var(--accent)') + '">' + (up ? '\\u25B2 +' : '\\u25BC ') + sig.momentum_pct + '%</b> <span style="' + mono + ';font-size:9px;color:var(--text3)">30d vs prior</span></span>'
      + '<span><b style="font-size:20px">' + sig.tier1_share + '%</b> <span style="' + mono + ';font-size:9px;color:var(--text3)">tier-1 sources</span></span></div>'
      + (sig.top && sig.top.length ? '<div style="margin-top:10px;font-size:11px;color:var(--text2)">Leading: '
        + sig.top.slice(0, 2).map(t => (t.url ? '<a href="' + safeAttr(t.url) + '" target="_blank" rel="noopener" style="color:var(--text)">' + safe(t.title) + '</a>' : safe(t.title)) + ' <span style="color:var(--text3)">(' + safe(t.source) + ')</span>').join(' \\u00B7 ') + '</div>' : '')
      + '</div>';
  } catch (e) { /* pre-moat world: render nothing */ }
}
function excavateBrand(name) {""",
'L2 loader + renderer')

# ── L3: both dashboard-open branches fire the load ──────────────────────────
rep(
"""    openInsightDashboard({
      title:    brand.name + ' — Brand Intelligence',""",
"""    setTimeout(function () { _brandLakeLoad(brand.name); }, 400);
    openInsightDashboard({
      title:    brand.name + ' — Brand Intelligence',""",
'L3a known-brand branch')

rep(
"""    openInsightDashboard({
      title:    name + ' — Brand Intelligence',""",
"""    setTimeout(function () { _brandLakeLoad(name); }, 400);
    openInsightDashboard({
      title:    name + ' — Brand Intelligence',""",
'L3b custom-brand branch')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
