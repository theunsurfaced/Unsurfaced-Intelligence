#!/usr/bin/env python3
# patch_page_evolution1.py — EVOLUTION 1, page side.
# Target: intelligence/index.html. Applies on top of patch_page_csp_frame.py.
#
# Nine cuts across three roles:
#   Respondents — consent copy names behavior capture (v2), a live progress
#     counter, and full-screen that keeps the beacon (overlay expand, never a
#     new tab that severs the parent link).
#   Partners — draft preview from the builder (renders the real overlay,
#     records nothing), CSV import into the invite lane, response CSV export,
#     the reminder relabel, and one-button study duplication.
#   Clients — a downloadable report built from exactly what their room shows.

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

# ── V1: consent copy names behavior capture, both doors ─────────────────────
rep(
"    ? 'I am 18 or older and I consent to my response being used as research for this brand. I can withdraw and request deletion at any time.'",
"    ? 'I am 18 or older and I consent to my response \\u2014 including how I interact with any pages or materials shown \\u2014 being used as research for this brand. I can withdraw and request deletion at any time.'",
'V1a token consent names behavior')

rep(
"    : 'I consent to my response being used as research. This is a free study \\u2014 no compensation.';",
"    : 'I consent to my response \\u2014 including how I interact with any pages or materials shown \\u2014 being used as research. This is a free study \\u2014 no compensation.';",
'V1b guest consent names behavior')

# ── V2: progress counter, guest/token door ──────────────────────────────────
rep(
"    + (s.questions || []).map((q, i) => _guestQ(q, i)).join('')\n    + _idBlock",
"    + '<div id=\"guest-prog\" style=\"position:sticky;top:0;z-index:5;background:rgba(10,10,10,.92);backdrop-filter:blur(4px);padding:8px 0;font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text2,#8988A0)\"></div>'\n"
"    + (s.questions || []).map((q, i) => _guestQ(q, i)).join('')\n    + _idBlock",
'V2a guest progress strip')

rep(
"function _guestSet(qid, val, multi) {",
"""/* SEAM:EVOLUTION_1 — the progress read. Uncertainty is where abandonment
 * lives: a respondent who knows they are 3 of 8 finishes; one staring down an
 * unmeasured scroll bails. Counts ANSWERED over TOTAL (excluding nothing —
 * screeners and attention checks are questions to the person answering). */
function _guestProgress() {
  const el = document.getElementById('guest-prog');
  if (!el || !_guest || !_guest.s) return;
  const qs = _guest.s.questions || [];
  const done = qs.filter(q => { const a = _guest.answers[q.id];
    return a != null && (!Array.isArray(a) || a.length) && String(a).trim() !== ''; }).length;
  el.textContent = done + ' of ' + qs.length + ' answered' + (done === qs.length && qs.length ? ' \\u2014 ready to submit' : '');
}
function _guestSet(qid, val, multi) {""",
'V2b guest progress fn')

rep(
"""  else _guest.answers[qid] = val;
  _guestRender();
}""",
"""  else _guest.answers[qid] = val;
  _guestRender();
  setTimeout(_guestProgress, 0);
}""",
'V2c progress updates on set')

# ── V3: full screen keeps the beacon — overlay expand, not a new tab ────────
rep(
"""  if (kind === 'html') return ''
    + '<div class="ma-clip" style="margin:8px 0 4px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
    + '<span>\\u25A6 ' + safe(name || 'Interactive page') + ' \\u2014 live, click through it</span>'
    + '<a class="u-trace" href="' + safeAttr(u) + '" target="_blank" rel="noopener">open full screen \\u2197</a></div>'""",
"""  /* SEAM:EVOLUTION_1 — full screen used to open the raw file in a new tab,
     which severs the parent link and takes the beacon's eyes with it exactly
     when the stimulus matters most (phones). Expand now grows the SAME frame
     in place — the parent relationship, and every click, survives. */
  if (kind === 'html') return ''
    + '<div class="ma-clip" style="margin:8px 0 4px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
    + '<span>\\u25A6 ' + safe(name || 'Interactive page') + ' \\u2014 live, click through it</span>'
    + '<button class="u-trace" onclick="_stimExpand(this)">full screen \\u2197</button></div>'""",
'V3a expand replaces the tab')

rep(
"window._clickStore = null;   // set by whichever response flow is live",
"""window._clickStore = null;   // set by whichever response flow is live
/* SEAM:EVOLUTION_1 — expand-in-place. The iframe node never moves (moving an
 * iframe reloads it and resets the stimulus); its wrapper goes fixed-fullscreen
 * and a close bar rides on top. Esc works. Tracking never blinks. */
function _stimExpand(btn) {
  const clip = btn.closest('.ma-clip');
  const frame = clip && clip.nextElementSibling;
  if (!frame || frame.tagName !== 'IFRAME') return;
  if (frame._stimFull) return _stimCollapse(frame);
  frame._stimFull = { style: frame.getAttribute('style') || '' };
  const bar = document.createElement('div');
  bar.id = 'stim-fullbar';
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100001;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#0A0A0A;color:#FAF7F2;font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase';
  bar.innerHTML = '<span>\\u25A6 Interactive stimulus \\u2014 your clicks are part of the study</span><button class="mr-btn" style="font-size:10px;padding:5px 12px" onclick="_stimCollapse()">Close \\u2715</button>';
  document.body.appendChild(bar);
  frame.setAttribute('style', 'position:fixed;top:42px;left:0;width:100vw;height:calc(100vh - 42px);z-index:100000;border:0;border-radius:0;background:#fff;margin:0');
  document.body.style.overflow = 'hidden';
  frame._stimEsc = (e) => { if (e.key === 'Escape') _stimCollapse(); };
  document.addEventListener('keydown', frame._stimEsc);
  window._stimActive = frame;
}
function _stimCollapse(frame) {
  frame = frame || window._stimActive;
  if (!frame || !frame._stimFull) return;
  frame.setAttribute('style', frame._stimFull.style);
  document.removeEventListener('keydown', frame._stimEsc);
  frame._stimFull = null; frame._stimEsc = null; window._stimActive = null;
  const bar = document.getElementById('stim-fullbar');
  if (bar) bar.remove();
  const gw = document.getElementById('guestwrap');
  document.body.style.overflow = gw ? 'hidden' : '';
}""",
'V3b expand machinery')

# ── V4: draft preview — the real overlay, recording nothing ─────────────────
rep(
"        : '<div class=\"mr-nav\"><button class=\"mr-btn\" onclick=\"mineSaveStudy(false)\">Save draft</button><button class=\"mr-btn mr-btn-primary\" onclick=\"mineSaveStudy(true)\">Launch study →</button></div>');",
"        : '<div class=\"mr-nav\"><button class=\"mr-btn\" onclick=\"_draftPreview()\">Preview \\u2192</button><button class=\"mr-btn\" onclick=\"mineSaveStudy(false)\">Save draft</button><button class=\"mr-btn mr-btn-primary\" onclick=\"mineSaveStudy(true)\">Launch study →</button></div>');",
'V4a preview button')

rep(
"async function _tokenMaybeOpen(tok) {",
"""/* SEAM:EVOLUTION_1 — experience the study before it exists. Renders the SAME
 * overlay a respondent gets, from the builder's draft state, and records
 * nothing: no store armed, submit walled off, banner says so. Building blind
 * and testing with a burned token was the old way; this is the honest way. */
function _draftPreview() {
  mineSaveDraftMeta();
  const d = mineState.draft || {};
  if (!(d.questions || []).length) { showToast('Add at least one question to preview'); return; }
  _guest = { s: { id: '_preview', title: d.title || 'Untitled study', goal: d.goal || '',
      type: d.type || 'survey', pay_cents: Math.round((parseFloat(d.pay) || 0) * 100),
      asset_key: d.asset ? d.asset.key : null, asset_name: d.asset ? d.asset.name : null,
      questions: (d.questions || []).map(q => ({ id: q.id, type: q.type, prompt: q.prompt,
        options: q.options || [], asset_key: q.assetKey || null, asset_name: q.assetName || null })) },
    answers: {}, consent: false, preview: true };
  window._clickStore = null;                     // preview records nothing
  _guestRender();
  setTimeout(() => { const w = document.querySelector('#guestwrap .sb');
    if (w) w.insertAdjacentHTML('afterbegin',
      '<div style="background:var(--red,#C41230);color:#fff;font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px;margin:0 0 14px">Preview \\u2014 exactly what respondents see \\u00B7 nothing records</div>'); }, 0);
}
async function _tokenMaybeOpen(tok) {""",
'V4b preview machinery')

rep(
"async function _guestSubmit() {\n  const s = _guest.s;",
"async function _guestSubmit() {\n  const s = _guest.s;\n  if (_guest.preview) { showToast('Preview only \\u2014 launch the study to collect real responses'); return; }",
'V4c preview submit wall')

# ── V5: CSV import into the invite lane ─────────────────────────────────────
rep(
"  const paste = '<textarea id=\"inv-paste\" class=\"mr-textarea\" rows=\"3\" placeholder=\"Paste emails \\u2014 one per line, or comma separated. Names welcome: Ada Lovelace <ada@ex.com>\"></textarea>'",
"  const paste = '<textarea id=\"inv-paste\" class=\"mr-textarea\" rows=\"3\" placeholder=\"Paste emails \\u2014 one per line, or comma separated. Names welcome: Ada Lovelace <ada@ex.com>\"></textarea>'\n"
"    + '<label class=\"u-trace\" style=\"cursor:pointer;display:inline-block;margin:2px 0 6px\">\\u2913 import a CSV instead<input type=\"file\" accept=\".csv,.txt\" style=\"display:none\" onchange=\"_invitesCsv(this,\\'' + sid + '\\')\"></label>'",
'V5a csv control')

rep(
"async function _invitesMint(sid) {",
"""/* SEAM:EVOLUTION_1 — client lists arrive as CSV exports, not typed lists.
 * The parser is deliberately dumb and total: find the email in each row by
 * shape, treat the longest other cell as the name, ignore everything else.
 * Header rows fall out naturally (no email in them). */
function _invitesCsv(input, sid) {
  const f = input.files && input.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = async function () {
    const lines = String(rd.result || '').split(/\\r?\\n/);
    const people = [];
    for (const line of lines) {
      const m = line.match(/[^\\s@<>,;"']+@[^\\s@<>,;"']+\\.[^\\s@<>,;"']{2,}/);
      if (!m) continue;
      /* Quoted cells first ("Lovelace, Ada" is one name, not two cells);
         otherwise the longest non-email cell wins. */
      const qm = line.replace(m[0], '').match(/"([^"]{2,})"/);
      let name = qm ? qm[1].trim() : null;
      if (!name) {
        const cells = line.replace(m[0], '').split(/[,;\\t]/).map(c => c.replace(/["']/g, '').trim()).filter(Boolean);
        cells.sort((a, b) => b.length - a.length);
        name = cells[0] || null;
      }
      people.push({ email: m[0].toLowerCase(), name: name ? name.slice(0, 80) : null });
    }
    if (!people.length) { showToast('No emails found in that file'); return; }
    /* Mint directly with objects — names survive only as objects (the string
       path strips them), and review happens in the rendered invite list. */
    try {
      const hh = await _authHeader();
      const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
        method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
        body: JSON.stringify({ study_id: sid, op: 'mint', list: people }) });
      const d = await r.json();
      if (d && d.ok) { showToast(d.minted + ' minted' + (d.revived ? ' \\u00B7 ' + d.revived + ' restored' : '') + ' from ' + people.length + ' contacts \\u2014 review below, then Send'); _invitesLoad(sid); }
      else showToast('Import failed \\u2014 ' + ((d && d.error) || 'try again'));
    } catch (e) { showToast('Import failed \\u2014 try again'); }
  };
  rd.readAsText(f);
  input.value = '';
}
async function _invitesMint(sid) {""",
'V5b csv parser')

# ── V6: the reminder relabel — the send button says what it does ────────────
rep(
"        : ((t.sent || 0) > 0\n            ? '<button class=\"mr-btn\" onclick=\"_invitesSend(\\'' + sid + '\\',true)\">Resend ' + t.sent + ' \\u2192</button>'\n            : ''))",
"        : ((t.sent || 0) > 0\n            ? '<button class=\"mr-btn\" onclick=\"_invitesSend(\\'' + sid + '\\',true)\">Remind ' + t.sent + ' who haven\\u2019t responded \\u2192</button>'\n            : ''))",
'V6 reminder relabel')

# ── V7: response CSV export, study detail ───────────────────────────────────
rep(
"    + (s.status === 'live' ? '<button class=\"mr-btn\" onclick=\"mineCloseStudy(\\'' + s.id + '\\')\">Close study</button>' : '')",
"    + (s.status === 'live' ? '<button class=\"mr-btn\" onclick=\"mineCloseStudy(\\'' + s.id + '\\')\">Close study</button>' : '')\n"
"    + '<button class=\"mr-btn\" onclick=\"_respExport(\\'' + s.id + '\\')\">Export CSV</button>'\n"
"    + '<button class=\"mr-btn\" onclick=\"_studyDuplicate(\\'' + s.id + '\\')\">Duplicate</button>'",
'V7a export + duplicate buttons')

rep(
"function mineBar() {",
"""/* SEAM:EVOLUTION_1 — partners get their raw data on day one, because they
 * will ask on day one. One row per response, one column per question, quality
 * columns riding when present. Proper CSV quoting — a verbatim with a comma
 * in it must not shear the row. */
function _csvCell(v) {
  const s2 = String(v == null ? '' : v);
  return /[",\\n]/.test(s2) ? '"' + s2.replace(/"/g, '""') + '"' : s2;
}
function _respExport(sid) {
  const s = mStudy(sid); if (!s) return;
  const resp = (mineDB.responses || []).filter(r => r.studyId === sid);
  if (!resp.length) { showToast('No responses to export yet'); return; }
  const qs = s.questions || [];
  const head = ['respondent', 'status', 'quality', 'flags', 'seconds', 'interactions', 'segments']
    .concat(qs.map(q => q.prompt.slice(0, 60)));
  const rows = resp.map(r => [r.anon || '', r.status || '', r.qualityStatus || '',
      (r.qualityFlags || []).join('|'), r.durationMs ? Math.round(r.durationMs / 1000) : '',
      r.clickCount || 0, (r.segments || []).join('|')]
    .concat(qs.map(q => { const a = (r.answers || {})[q.id];
      return Array.isArray(a) ? a.join('|') : (a == null ? '' : a); })));
  const csv = [head].concat(rows).map(row => row.map(_csvCell).join(',')).join('\\n');
  const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (s.title || 'study').replace(/[^\\w-]+/g, '_').toLowerCase() + '_responses.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  showToast(resp.length + ' response' + (resp.length === 1 ? '' : 's') + ' exported');
}

/* SEAM:EVOLUTION_1 — "run it again" is the shape of repeat business. Clone
 * carries structure and stimulus pointers (same R2 objects — pointers, not
 * copies); responses, invites, and grants stay with the original. */
function _studyDuplicate(sid) {
  const s = mStudy(sid); if (!s) return;
  mineState.draft = { title: (s.title || 'Study') + ' (again)', goal: s.goal || '',
    type: s.type || 'survey', pay: s.pay || 0, target: s.targetN || s.target_n || '',
    audience: s.audience || 'open', listing: !!s.publicListing,
    asset: s.asset && s.asset.key ? { key: s.asset.key, name: s.asset.name } : null,
    questions: (s.questions || []).map(q => ({ id: mid('q'), type: q.type, prompt: q.prompt,
      options: (q.options || []).slice(), passOptions: q.passOptions ? q.passOptions.slice() : null,
      assetKey: q.assetKey || null, assetName: q.assetName || null })) };
  mineState.qedit = null; mineState.qAsset = null;
  showToast('Duplicated \\u2014 same structure, fresh study, nothing shared');
  mineRoute('p-new');
}
function mineBar() {""",
'V7b export + duplicate machinery')

# ── V8: the client takes something home ─────────────────────────────────────
rep(
"  h += '<p class=\"ma-muted\" style=\"font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase\">Live \\u00B7 refreshes each minute \\u00B7 rejected responses never counted</p>';",
"  h += '<p class=\"ma-muted\" style=\"font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap\"><span>Live \\u00B7 refreshes each minute \\u00B7 rejected responses never counted</span>'\n"
"    + (d.floor_met ? '<button class=\"u-trace\" onclick=\"_clientReport()\">Download report \\u2913</button>' : '') + '</p>';",
'V8a download button')

rep(
"function _clientCrosstab(qid) {",
"""/* SEAM:EVOLUTION_1 — the client leaves with an artifact. Built from exactly
 * what the room shows (same payload, same floor law — the button only exists
 * once findings are open), print-styled, carrying the house mark. Their
 * stakeholder deck circulates it with our name on it. */
function _clientReport() {
  const c = _clientCache && _clientCache.data; if (!c || !c.floor_met) return;
  const esc = (t) => String(t == null ? '' : t).replace(/</g, '&lt;');
  let body = '<h1>' + esc(c.study.title) + '</h1>'
    + (c.study.goal ? '<p class="goal">' + esc(c.study.goal) + '</p>' : '')
    + '<p class="meta">' + c.n + ' quality responses \\u00B7 generated ' + new Date().toLocaleDateString()
    + ' \\u00B7 rejected responses excluded</p>';
  for (const q of (c.questions || [])) {
    body += '<div class="q">' + esc(q.prompt) + '</div>';
    if (q.type === 'open') {
      body += (q.verbatims || []).slice(0, 20).map(v =>
        '<div class="verb">\\u201c' + esc(v.text) + '\\u201d <span class="who">\\u2014 ' + esc(v.who) + '</span></div>').join('');
    } else {
      const keys = Object.keys(q.counts || {}).sort((a, b) => q.counts[b] - q.counts[a]);
      body += keys.map(k => '<div class="row"><span>' + esc(k) + '</span><span><b>'
        + (q.pct && q.pct[k] != null ? q.pct[k] + '%' : q.counts[k]) + '</b> (' + q.counts[k] + ')</span></div>').join('');
    }
    if (q.clicks && q.clicks.respondents) {
      body += '<div class="beh">Behavior \\u00B7 ' + q.clicks.respondents + ' interacted \\u00B7 ' + q.clicks.total + ' clicks</div>';
      const fk = Object.keys(q.clicks.first || {});
      if (fk.length) body += '<div class="beh-h">First click</div>' + fk.map(k =>
        '<div class="row"><span>' + esc(k) + '</span><span><b>' + q.clicks.first[k] + '</b></span></div>').join('');
    }
  }
  const w = window.open('', '_blank');
  if (!w) { showToast('Allow pop-ups to download the report'); return; }
  w.document.write('<!doctype html><html><head><title>' + esc(c.study.title) + ' \\u2014 Unsurfaced</title><style>'
    + 'body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 20px;color:#0A0A0A;line-height:1.5}'
    + 'h1{font-size:26px;margin:0 0 4px}.goal{color:#444;margin:0 0 6px}.meta{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.1em;border-bottom:3px solid #C41230;padding-bottom:14px}'
    + '.q{font-weight:700;margin:26px 0 8px;font-size:15px}.row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee}'
    + '.verb{margin:6px 0;font-style:italic}.who{color:#888;font-style:normal;font-size:12px}'
    + '.beh{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.12em;margin:12px 0 4px;border-top:1px solid #eee;padding-top:8px}'
    + '.beh-h{font-size:10px;color:#C41230;text-transform:uppercase;letter-spacing:.12em;margin:6px 0 2px}'
    + '.foot{margin-top:36px;font-size:11px;color:#888}@media print{.noprint{display:none}}'
    + '</style></head><body>'
    + '<div style="font-weight:800;font-size:20px">UNSURFACED\\u2122</div>'
    + '<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin:0 0 22px">Consumer & Market Intelligence \\u00B7 Live study report</div>'
    + body
    + '<div class="foot">Generated from the live results room. Findings open at ' + c.floor + ' quality responses by design \\u2014 early percentages mislead.</div>'
    + '<div class="noprint" style="margin-top:22px"><button onclick="window.print()" style="background:#C41230;color:#fff;border:0;padding:12px 22px;font-weight:700;cursor:pointer">Print / Save as PDF</button></div>'
    + '</body></html>');
  w.document.close();
}
function _clientCrosstab(qid) {""",
'V8b client report builder')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
