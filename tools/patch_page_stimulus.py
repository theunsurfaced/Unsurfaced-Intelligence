#!/usr/bin/env python3
# patch_page_stimulus.py — SEAM:STIMULUS, page side.
# Target: intelligence/index.html. Applies on top of the field-rail arc.
#
# The model: an asset is a stimulus, and a stimulus can be an image, a video,
# an audio clip, or a RUNNING PAGE. One helper decides the treatment from the
# filename; every surface that shows an asset calls it. HTML renders in an
# iframe with sandbox="allow-scripts allow-forms allow-popups" — the mock
# landing page is fully clickable, and it runs with an opaque origin.
#
# Per-question assets: builder attach + chip, save paths carry the columns,
# and all three respondent doors (guest, token, signed-in responder) render
# the stimulus above its question.

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

# ── Q1: the universal stimulus renderer, mounted beside _guestQ ─────────────
rep(
"function _guestQ(q, i) {",
"""/* SEAM:STIMULUS — one renderer for every stimulus, treatment by filename.
 * HTML is the headline: a mock landing page renders live and clickable in a
 * sandboxed iframe (scripts, forms, popups — never an origin). Everything a
 * respondent reacts to flows through here, so the treatment rules live in
 * exactly one place. */
function _assetKind(name) {
  const ext = String(name || '').toLowerCase().split('.').pop();
  if (ext === 'html' || ext === 'htm') return 'html';
  if (['png','jpg','jpeg','gif','webp','avif','svg'].indexOf(ext) >= 0) return 'image';
  if (['mp4','mov','webm','m4v'].indexOf(ext) >= 0) return 'video';
  if (['mp3','wav','m4a','aac','ogg'].indexOf(ext) >= 0) return 'audio';
  return 'file';
}
function _assetHtml(key, name, tall) {
  if (!key || !API_BASE) return '';
  const u = API_BASE.replace(/\\/$/, '') + '/media/' + encodeURIComponent(key);
  const kind = _assetKind(name);
  if (kind === 'html') return ''
    + '<div class="ma-clip" style="margin:8px 0 4px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
    + '<span>\\u25A6 ' + safe(name || 'Interactive page') + ' \\u2014 live, click through it</span>'
    + '<a class="u-trace" href="' + safeAttr(u) + '" target="_blank" rel="noopener">open full screen \\u2197</a></div>'
    + '<iframe class="ma-media" src="' + safeAttr(u) + '" sandbox="allow-scripts allow-forms allow-popups" '
    + 'style="width:100%;height:' + (tall ? '560' : '420') + 'px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#fff;margin:0 0 10px" loading="lazy"></iframe>';
  if (kind === 'image') return '<img class="ma-media" src="' + safeAttr(u) + '" alt="' + safeAttr(name || 'stimulus') + '" style="max-width:100%;border-radius:8px;margin:8px 0 10px" loading="lazy">';
  if (kind === 'video') return '<video class="ma-media" src="' + safeAttr(u) + '" controls playsinline style="width:100%;border-radius:8px;margin:8px 0 10px"></video>';
  if (kind === 'audio') return '<audio class="ma-media" src="' + safeAttr(u) + '" controls style="width:100%;margin:8px 0 10px"></audio>';
  return '<a class="ma-clip" href="' + safeAttr(u) + '" target="_blank" rel="noopener" style="display:block;margin:8px 0 10px">\\u2913 ' + safe(name || 'Attachment') + '</a>';
}
function _guestQ(q, i) {""",
'Q1 universal renderer')

# ── Q2: guest/token door — stimulus above its question ──────────────────────
rep(
"""  const a = _guest.answers[q.id];
  const head = '<div style="font-weight:700;margin:18px 0 8px">' + (i + 1) + '. ' + safe(q.prompt) + '</div>';""",
"""  const a = _guest.answers[q.id];
  const head = '<div style="font-weight:700;margin:18px 0 8px">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'
    + _assetHtml(q.asset_key, q.asset_name, true);""",
'Q2 guest door stimulus')

# ── Q3: signed-in responder door — same treatment ───────────────────────────
rep(
"""function mineRenderQuestion(q, i) {
  const head = '<div class="ma-q">' + (i + 1) + '. ' + safe(q.prompt) + '</div>';""",
"""function mineRenderQuestion(q, i) {
  const head = '<div class="ma-q">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'
    + _assetHtml(q.assetKey || q.asset_key, q.assetName || q.asset_name, true);""",
'Q3 responder door stimulus')

# ── Q4: study-level asset learns the same treatments (html included) ────────
rep(
"""  let assetHtml = '';
  if (s.type === 'video' || s.type === 'audio') {
    const url = s.asset && (sbEnabled() && s.asset.key ? (API_BASE.replace(/\\/$/, '') + '/media/' + encodeURIComponent(s.asset.key)) : mineMedia[s.asset.mediaId]);
    if (url && s.type === 'video') assetHtml = '<video class="ma-media" src="' + safeAttr(url) + '" controls></video>';
    else if (url && s.type === 'audio') assetHtml = '<audio class="ma-media" src="' + safeAttr(url) + '" controls></audio>';
    else assetHtml = '<div class="ma-clip">' + (s.type === 'video' ? '▶' : '♪') + ' ' + safe(s.asset ? s.asset.name : 'Media') + ' — preview available in the session it was uploaded</div>';
  }""",
"""  /* SEAM:STIMULUS — the study-level asset rides the universal renderer too:
     a mock landing page attached at study level is the whole environment the
     respondent explores before any question asks about it. */
  let assetHtml = s.asset && s.asset.key ? _assetHtml(s.asset.key, s.asset.name, true) : '';
  if (!assetHtml && (s.type === 'video' || s.type === 'audio') && s.asset && mineMedia[s.asset.mediaId]) {
    const url = mineMedia[s.asset.mediaId];
    assetHtml = s.type === 'video' ? '<video class="ma-media" src="' + safeAttr(url) + '" controls></video>'
      : '<audio class="ma-media" src="' + safeAttr(url) + '" controls></audio>';
  }""",
'Q4 study asset universal')

# ── Q5: guest overlay's study-level media block goes universal ──────────────
rep(
"""  let media = '';
  if ((s.type === 'video' || s.type === 'audio') && s.asset_key && API_BASE) {
    const u = API_BASE.replace(/\\/$/, '') + '/media/' + encodeURIComponent(s.asset_key);
    media = s.type === 'video' ? '<video class="ma-media" src="' + safeAttr(u) + '" controls style="width:100%;margin:10px 0"></video>' : '<audio class="ma-media" src="' + safeAttr(u) + '" controls style="width:100%;margin:10px 0"></audio>';
  }""",
"""  const media = s.asset_key ? _assetHtml(s.asset_key, s.asset_name || (s.type === 'video' ? 'video.mp4' : s.type === 'audio' ? 'audio.mp3' : ''), true) : '';""",
'Q5 guest study media universal')

# ── Q6: builder — attach control in the question form ───────────────────────
rep(
"    + [['single', 'Single choice'], ['multi', 'Multiple choice'], ['scale', 'Rating (1\u20135)'], ['open', 'Open text'], ['screener', 'Screener (qualify)'], ['attention', 'Attention check (quality)']].map(o => '<option value=\"' + o[0] + '\"' + (o[0] === formType ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'",
"""    + [['single', 'Single choice'], ['multi', 'Multiple choice'], ['scale', 'Rating (1\u20135)'], ['open', 'Open text'], ['screener', 'Screener (qualify)'], ['attention', 'Attention check (quality)']].map(o => '<option value="' + o[0] + '"' + (o[0] === formType ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
    + (sbEnabled() ? ('<div class="ma-clip" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0">'
      + '<span id="q-asset-chip">' + (mineState.qAsset ? '\\u25A6 ' + safe(mineState.qAsset.name) : 'No stimulus attached \\u2014 image, video, audio, or an HTML page respondents click through')
      + '</span><span>' + (mineState.qAsset ? '<button class="u-trace" onclick="_qAssetClear()">remove</button> ' : '')
      + '<label class="u-trace" style="cursor:pointer">attach<input type="file" accept="image/*,video/*,audio/*,.html,.htm" style="display:none" onchange="_qAssetPick(this)"></label></span></div>') : '')""",
'Q6 builder attach control')

# ── Q7: builder handlers + save/load carry the pointers ─────────────────────
rep(
"function mineQSave() {",
"""/* SEAM:STIMULUS — per-question attach. Upload rides the same /mine/upload
 * rail as the study asset; the pointer parks in mineState.qAsset until save. */
async function _qAssetPick(input) {
  const f = input.files && input.files[0]; if (!f) return;
  try {
    const auth = await _authHeader();
    showToast('Uploading ' + f.name + '\\u2026');
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/upload', { method: 'POST',
      headers: Object.assign({ 'content-type': f.type || (/\\.html?$/i.test(f.name) ? 'text/html' : 'application/octet-stream'), 'x-filename': f.name }, auth), body: f });
    const d = await r.json();
    if (d && d.ok && d.data && d.data.key) {
      mineState.qAsset = { key: d.data.key, name: f.name };
      const chip = document.getElementById('q-asset-chip');
      if (chip) chip.textContent = '\\u25A6 ' + f.name;
      showToast('Stimulus attached \\u2014 saves with the question');
    } else showToast('Upload failed \\u2014 try again');
  } catch (e) { showToast('Upload failed \\u2014 try again'); }
}
function _qAssetClear() { mineState.qAsset = null; const chip = document.getElementById('q-asset-chip'); if (chip) chip.textContent = 'No stimulus attached'; }
function mineQSave() {""",
'Q7 attach handlers')

rep(
"""  if (mineState.qedit) { const q = d.questions.find(x => x.id === mineState.qedit); q.type = type; q.prompt = prompt; q.options = options; q.passOptions = passOptions; mineState.qedit = null; }
  else d.questions.push({ id: mid('q'), type, prompt, options, passOptions });""",
"""  const _qa = mineState.qAsset || null; mineState.qAsset = null;
  if (mineState.qedit) { const q = d.questions.find(x => x.id === mineState.qedit); q.type = type; q.prompt = prompt; q.options = options; q.passOptions = passOptions; q.assetKey = _qa ? _qa.key : null; q.assetName = _qa ? _qa.name : null; mineState.qedit = null; }
  else d.questions.push({ id: mid('q'), type, prompt, options, passOptions, assetKey: _qa ? _qa.key : null, assetName: _qa ? _qa.name : null });""",
'Q8 save carries pointers (both branches)')

# ── Q9: edit loads the existing stimulus back into the form ─────────────────
rep(
"function mineQEdit(id) { mineSaveDraftMeta(); mineState.qedit = id; mineRoute(",
"function mineQEdit(id) { mineSaveDraftMeta(); mineState.qedit = id;\n"
"  const _eq = (mineState.draft.questions || []).find(x => x.id === id);\n"
"  mineState.qAsset = (_eq && _eq.assetKey) ? { key: _eq.assetKey, name: _eq.assetName } : null;\n"
"  mineRoute(",
'Q9 edit loads stimulus')

# ── Q10: persistence — insert and update both carry the columns ─────────────
rep(
"      if (keepIds.indexOf(q.id) >= 0) { const { data: ud } = await _sb.from('study_question').update({ ord: i, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null }).eq('id', q.id).select('id'); if (!ud || !ud.length) { showToast('Question update was blocked \\u2014 run migration 0019'); return; } }\n"
"      else { await _sb.from('study_question').insert({ study_id: studyId, ord: i, type: q.type, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null }); }",
"      if (keepIds.indexOf(q.id) >= 0) { const { data: ud } = await _sb.from('study_question').update({ ord: i, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null, asset_key: q.assetKey || null, asset_name: q.assetName || null }).eq('id', q.id).select('id'); if (!ud || !ud.length) { showToast('Question update was blocked \\u2014 run migration 0019'); return; } }\n"
"      else { await _sb.from('study_question').insert({ study_id: studyId, ord: i, type: q.type, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null, asset_key: q.assetKey || null, asset_name: q.assetName || null }); }",
'Q10a update+insert (edit path)')

rep(
"  if (!isEdit && d.questions.length) { await _sb.from('study_question').insert(d.questions.map((q, i) => ({ study_id: studyId, ord: i, type: q.type, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null }))); }",
"  if (!isEdit && d.questions.length) { await _sb.from('study_question').insert(d.questions.map((q, i) => ({ study_id: studyId, ord: i, type: q.type, prompt: q.prompt, options: q.options || [], pass_options: q.passOptions || null, asset_key: q.assetKey || null, asset_name: q.assetName || null }))); }",
'Q10b insert (create path)')

# ── Q11: the loader mapper keeps the pointers ───────────────────────────────
rep(
"  const by = {}; (data || []).forEach(q => { (by[q.study_id] = by[q.study_id] || []).push({ id: q.id, type: q.type, prompt: q.prompt, options: q.options || [], passOptions: q.pass_options || null }); });",
"  const by = {}; (data || []).forEach(q => { (by[q.study_id] = by[q.study_id] || []).push({ id: q.id, type: q.type, prompt: q.prompt, options: q.options || [], passOptions: q.pass_options || null, assetKey: q.asset_key || null, assetName: q.asset_name || null }); });",
'Q11 loader keeps pointers')


assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
