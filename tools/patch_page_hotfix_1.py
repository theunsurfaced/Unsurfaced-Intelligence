#!/usr/bin/env python3
# patch_page_hotfix_1.py — three field reports from the smoke test, one cut.
# Applies ON TOP of patch_page_client_surface.py. Target: intelligence/index.html
#
# 1. Blank lanes: on fetch failure the invite/client lanes rendered '' — a
#    silent blank that reads as broken. Failures now say what happened and
#    offer a retry, and they surface the HTTP status so "worker not deployed"
#    is distinguishable from "not authorized" at a glance.
# 2. Admin preview: mineClientResults always allowed role admin; the page just
#    had no door. Study detail gains "Preview client view", and vCStudy learns
#    to route back to the study it came from.
# 3. Question builder: options now split on commas and semicolons as well as
#    newlines, and the ATTENTION type exists in the builder at last — the
#    quality scan honored it from birth; the builder could never create one.

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

# ── H1a: invite lane fails honestly ─────────────────────────────────────────
rep(
"""async function _invitesLoad(sid) {
  const box = document.getElementById('inv-mgr');
  if (!box) return;
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'list' }) });
    const d = await r.json();
    if (!d || !d.ok) { box.innerHTML = ''; return; }
    box.innerHTML = _invitesHtml(sid, d);
  } catch (e) { box.innerHTML = ''; }
}""",
"""async function _invitesLoad(sid) {
  const box = document.getElementById('inv-mgr');
  if (!box) return;
  const fail = function (why) {
    box.innerHTML = '<div class="ma-row"><div><div class="ma-row-t">Invites could not load</div>'
      + '<div class="ma-row-s">' + safe(why) + '</div></div>'
      + '<button class="mr-btn" onclick="_invitesLoad(\\'' + sid + '\\')">Retry</button></div>';
  };
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'list' }) });
    if (!r.ok) return fail('The API answered ' + r.status + (r.status === 404 ? ' \\u2014 the worker may not be deployed yet' : ''));
    const d = await r.json();
    if (!d || !d.ok) return fail(d && d.error === 'forbidden' ? 'This account cannot manage invites for this study' : 'Error: ' + ((d && d.error) || 'unknown'));
    box.innerHTML = _invitesHtml(sid, d);
  } catch (e) { fail('Network error \\u2014 check the connection'); }
}""",
'H1a invites fail honestly')

# ── H1b: client-access lane fails honestly ──────────────────────────────────
rep(
"""    const d = await r.json();
    if (!d || !d.ok) { box.innerHTML = ''; return; }
    const rows = (d.clients || []).map(c =>""",
"""    if (!r.ok) { box.innerHTML = '<div class="ma-row"><div><div class="ma-row-t">Client access could not load</div>'
      + '<div class="ma-row-s">The API answered ' + r.status + (r.status === 404 ? ' \\u2014 the worker may not be deployed yet' : '') + '</div></div>'
      + '<button class="mr-btn" onclick="_clientListLoad(\\'' + sid + '\\')">Retry</button></div>'; return; }
    const d = await r.json();
    if (!d || !d.ok) { box.innerHTML = '<div class="ma-row"><div><div class="ma-row-t">Client access could not load</div>'
      + '<div class="ma-row-s">Error: ' + safe((d && d.error) || 'unknown') + '</div></div>'
      + '<button class="mr-btn" onclick="_clientListLoad(\\'' + sid + '\\')">Retry</button></div>'; return; }
    const rows = (d.clients || []).map(c =>""",
'H1b client lane fails honestly')

# ── H2a: the admin/partner door into the client room ────────────────────────
rep(
"function _clientAccessRow(s, admin) {\n  if (!sbEnabled() || !API_BASE) return '';\n  if (s.status === 'draft') return '';\n  return '<div class=\"ma-sec\">Client access \\u2014 read-only, this study only</div>'\n    + '<div id=\"client-acc\"><p class=\"mr-p ma-empty\">Loading\\u2026</p></div>';",
"function _clientAccessRow(s, admin) {\n  if (!sbEnabled() || !API_BASE) return '';\n  if (s.status === 'draft') return '';\n  return '<div class=\"ma-sec\" style=\"display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap\">Client access \\u2014 read-only, this study only'\n    + '<button class=\"mr-btn\" style=\"font-size:11px\" onclick=\"_clientPreview(\\'' + s.id + '\\')\">Preview client view \\u2192</button></div>'\n    + '<div id=\"client-acc\"><p class=\"mr-p ma-empty\">Loading\\u2026</p></div>';",
'H2a preview button')

# ── H2b: preview routing + an honest back door ──────────────────────────────
rep(
"function vCStudy(sid) {\n  const st = (mineDB.clientStudies || []).find(x => x.id === sid);\n  return ((mineDB.clientStudies || []).length > 1\n      ? '<button class=\"mr-btn\" style=\"margin-bottom:18px\" onclick=\"mineRoute(\\'c-home\\')\">\\u2190 Your studies</button>' : '')",
"""/* Admin or partner stepping into the client's room to see exactly what the
 * client sees. The results endpoint always allowed it; this is the door. */
function _clientPreview(sid) {
  mineState.cBack = { view: mineState.view, arg: mineState.arg };
  mineRoute('c-study', sid);
}
function vCStudy(sid) {
  const st = (mineDB.clientStudies || []).find(x => x.id === sid)
    || (typeof mStudy === 'function' ? mStudy(sid) : null);
  const back = mineState.cBack
    ? '<button class="mr-btn" style="margin-bottom:18px" onclick="var b=mineState.cBack;mineState.cBack=null;mineRoute(b.view,b.arg)">\\u2190 Back to study</button>'
    : ((mineDB.clientStudies || []).length > 1
      ? '<button class="mr-btn" style="margin-bottom:18px" onclick="mineRoute(\\'c-home\\')">\\u2190 Your studies</button>' : '');
  return back
    + (mineState.cBack ? '<div class="ma-sum" style="margin:0 0 14px"><div class="ma-row-s" style="font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase">Previewing as client \\u2014 this is exactly what they see</div></div>' : '')""",
'H2b preview route + back')

# ── H3a: options split on commas, semicolons, and newlines ──────────────────
rep(
"  let options = []; if (type === 'single' || type === 'multi' || type === 'screener') { options = ((document.getElementById('q-opts') || {}).value || '').split('\\n').map(s => s.trim()).filter(Boolean); if (options.length < 2) { showToast('Add at least two options'); return; } }",
"  let options = []; if (type === 'single' || type === 'multi' || type === 'screener' || type === 'attention') { options = ((document.getElementById('q-opts') || {}).value || '').split(/[\\n,;]+/).map(s => s.trim()).filter(Boolean); if (options.length < 2) { showToast('Add at least two options \\u2014 one per line or comma-separated'); return; } }",
'H3a comma-tolerant options + attention')

# ── H3b: attention gets its pass answers, right after the screener block ────
rep(
"""  let passOptions = null;
  if (type === 'screener') {
    passOptions = (((document.getElementById('q-pass') || {}).value || '').split(',').map(s => s.trim()).filter(Boolean));
    passOptions = passOptions.filter(pv => options.indexOf(pv) >= 0);
    if (!passOptions.length) { showToast('Screeners need at least one qualifying answer that matches an option'); return; }
  }""",
"""  let passOptions = null;
  if (type === 'screener' || type === 'attention') {
    passOptions = (((document.getElementById('q-pass') || {}).value || '').split(',').map(s => s.trim()).filter(Boolean));
    passOptions = passOptions.filter(pv => options.indexOf(pv) >= 0);
    if (!passOptions.length) { showToast(type === 'screener'
      ? 'Screeners need at least one qualifying answer that matches an option'
      : 'Attention checks need the correct answer \\u2014 it must match an option'); return; }
  }""",
'H3b attention pass answers')

# ── H3c: attention in the type dropdown ─────────────────────────────────────
rep(
"    + [['single', 'Single choice'], ['multi', 'Multiple choice'], ['scale', 'Rating (1–5)'], ['open', 'Open text'], ['screener', 'Screener (qualify)']].map(o => '<option value=\"' + o[0] + '\"' + (o[0] === formType ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'",
"    + [['single', 'Single choice'], ['multi', 'Multiple choice'], ['scale', 'Rating (1–5)'], ['open', 'Open text'], ['screener', 'Screener (qualify)'], ['attention', 'Attention check (quality)']].map(o => '<option value=\"' + o[0] + '\"' + (o[0] === formType ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'",
'H3c attention in dropdown')

# ── H3d: the form toggle shows options + pass for attention ─────────────────
rep(
"function mineQFormToggle() { const t = v('q-type'); const o = document.getElementById('q-opts'); if (o) o.style.display = (t === 'single' || t === 'multi' || t === 'screener') ? '' : 'none'; const pp = document.getElementById('q-pass'); if (pp) pp.style.display = (t === 'screener') ? '' : 'none'; }",
"function mineQFormToggle() { const t = v('q-type'); const o = document.getElementById('q-opts'); if (o) o.style.display = (t === 'single' || t === 'multi' || t === 'screener' || t === 'attention') ? '' : 'none'; const pp = document.getElementById('q-pass'); if (pp) { pp.style.display = (t === 'screener' || t === 'attention') ? '' : 'none'; pp.placeholder = t === 'attention' ? 'The correct answer (must match an option) \\u2014 wrong answers flag, never reject' : 'Qualifying answers (comma-separated, must match options)'; } }",
'H3d toggle shows attention fields')

# ── H3e: attention has a label everywhere it appears ────────────────────────
rep(
"function mineQTypeLabel(t) { return { single: 'Single choice', multi: 'Multiple choice', scale: 'Rating 1–5', open: 'Open text', screener: 'Screener' }[t] || t; }",
"function mineQTypeLabel(t) { return { single: 'Single choice', multi: 'Multiple choice', scale: 'Rating 1–5', open: 'Open text', screener: 'Screener', attention: 'Attention check' }[t] || t; }",
'H3e attention label')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
