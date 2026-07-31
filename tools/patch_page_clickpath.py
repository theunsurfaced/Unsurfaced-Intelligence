#!/usr/bin/env python3
# patch_page_clickpath.py — SEAM:CLICKPATH, page side.
# Target: intelligence/index.html. Applies on top of patch_page_stimulus.py.
#
# The overlay's half of the instrument: one message listener routes beacon
# events from sandboxed stimulus iframes to the question they belong to
# (matched by contentWindow — a sandboxed frame's origin is opaque, so source
# identity is the only trustworthy address). Submits carry the file. The
# client dashboard grows a behavior block; admin response cards grow an
# interaction chip.

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

# ── C1: iframes carry their question id ─────────────────────────────────────
rep(
"function _assetHtml(key, name, tall) {",
"function _assetHtml(key, name, tall, qid) {",
'C1a renderer takes qid')

rep(
"    + '<iframe class=\"ma-media\" src=\"' + safeAttr(u) + '\" sandbox=\"allow-scripts allow-forms allow-popups\" '",
"    + '<iframe class=\"ma-media stim-frame\"' + (qid ? ' data-qid=\"' + safeAttr(qid) + '\"' : '') + ' src=\"' + safeAttr(u) + '\" sandbox=\"allow-scripts allow-forms allow-popups\" '",
'C1b iframe carries qid')

rep(
"  const head = '<div style=\"font-weight:700;margin:18px 0 8px\">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'\n"
"    + _assetHtml(q.asset_key, q.asset_name, true);",
"  const head = '<div style=\"font-weight:700;margin:18px 0 8px\">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'\n"
"    + _assetHtml(q.asset_key, q.asset_name, true, q.id);",
'C1c guest door passes qid')

rep(
"  const head = '<div class=\"ma-q\">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'\n"
"    + _assetHtml(q.assetKey || q.asset_key, q.assetName || q.asset_name, true);",
"  const head = '<div class=\"ma-q\">' + (i + 1) + '. ' + safe(q.prompt) + '</div>'\n"
"    + _assetHtml(q.assetKey || q.asset_key, q.assetName || q.asset_name, true, q.id);",
'C1d responder door passes qid')

# ── C2: the router — one listener, source-matched, budget-capped ────────────
rep(
"function _assetKind(name) {",
"""/* SEAM:CLICKPATH — the overlay's half of the instrument. The beacon inside a
 * stimulus posts {unsrf:'click',...}; a sandboxed frame's origin is opaque
 * ('null'), so event.source vs iframe.contentWindow is the only trustworthy
 * address. Events file into the active response store under the frame's
 * question id — study-level stimuli file under '_study'. Everything shaped
 * and capped here AND server-side; the worker's cleanClicks is the law. */
window._clickStore = null;   // set by whichever response flow is live
window.addEventListener('message', function (ev) {
  const d = ev.data;
  if (!d || d.unsrf !== 'click' || !window._clickStore) return;
  let qid = null;
  const frames = document.querySelectorAll('iframe.stim-frame');
  for (let k = 0; k < frames.length; k++) {
    if (frames[k].contentWindow === ev.source) { qid = frames[k].getAttribute('data-qid') || '_study'; break; }
  }
  if (qid === null) return;                          // not one of ours
  const store = window._clickStore;
  store[qid] = store[qid] || [];
  if (store[qid].length >= 200) return;
  store[qid].push({ type: 'click', t: Math.max(0, parseInt(d.t, 10) || 0),
    label: String(d.label || '').slice(0, 40), href: d.href ? String(d.href).slice(0, 120) : null,
    x: parseInt(d.x, 10) || 0, y: parseInt(d.y, 10) || 0 });
});
function _assetKind(name) {""",
'C2 message router')

# ── C3: stores arm when a response flow opens ───────────────────────────────
rep(
"    _guest = { s: d.data, answers: {}, consent: false, token: tok,\n"
"      email: d.data.invited_email || '', startedAt: Date.now(),\n"
"      consentVersion: d.data.consent_version || null };",
"    _guest = { s: d.data, answers: {}, consent: false, token: tok,\n"
"      email: d.data.invited_email || '', startedAt: Date.now(),\n"
"      consentVersion: d.data.consent_version || null, clicks: {} };\n"
"    window._clickStore = _guest.clicks;",
'C3a token flow arms store')

rep(
"  mineState.resp = { studyId: id, answers: {}, consent: false };",
"  mineState.resp = { studyId: id, answers: {}, consent: false, clicks: {} };\n"
"  window._clickStore = mineState.resp.clicks;",
'C3b responder flow arms store')

# ── C4: submits carry the file ──────────────────────────────────────────────
rep(
"        body: JSON.stringify({ token: _guest.token, answers: _guest.answers, consent: true,\n"
"          consent_version: _guest.consentVersion || null,",
"        body: JSON.stringify({ token: _guest.token, answers: _guest.answers, consent: true,\n"
"          clicks: _guest.clicks || {},\n"
"          consent_version: _guest.consentVersion || null,",
'C4a token submit carries clicks')

rep(
"  const { error } = await _sb.from('response').insert({ study_id: s.id, responder_id: uid, answers: st.answers });",
"  const { error } = await _sb.from('response').insert({ study_id: s.id, responder_id: uid, answers: st.answers, clicks: st.clicks || {} });",
'C4b signed-in submit carries clicks')

# ── C5: client dashboard — the behavior block under each question ───────────
rep(
"""    const keys = Object.keys(q.counts || {}).sort((a, b) => (q.counts[b] || 0) - (q.counts[a] || 0));
    const max = Math.max(1, ...keys.map(k => q.counts[k]));
    h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' answered</span></div>'
      + keys.map(k => '<div class="mp-bar-row"><span class="mp-bar-label">' + safe(k) + '</span>'
          + '<span class="mp-bar-track"><span class="mp-bar-fill" style="width:' + Math.round((q.counts[k] / max) * 100) + '%"></span></span>'
          + '<span class="mp-bar-n">' + (q.pct && q.pct[k] != null ? q.pct[k] + '%' : q.counts[k]) + '</span></div>').join('')
      + '</div>';""",
"""    const keys = Object.keys(q.counts || {}).sort((a, b) => (q.counts[b] || 0) - (q.counts[a] || 0));
    const max = Math.max(1, ...keys.map(k => q.counts[k]));
    h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' answered</span></div>'
      + keys.map(k => '<div class="mp-bar-row"><span class="mp-bar-label">' + safe(k) + '</span>'
          + '<span class="mp-bar-track"><span class="mp-bar-fill" style="width:' + Math.round((q.counts[k] / max) * 100) + '%"></span></span>'
          + '<span class="mp-bar-n">' + (q.pct && q.pct[k] != null ? q.pct[k] + '%' : q.counts[k]) + '</span></div>').join('')
      + _clickBlock(q.clicks)
      + '</div>';""",
'C5a bars question gains behavior')

rep(
"""      h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' voices</span></div>'
        + (q.verbatims || []).slice(0, 12).map(vv =>
            '<div class="ma-ans"><span class="ma-ans-q">' + safe(vv.who) + '</span><span class="ma-ans-a">\\u201c' + safe(vv.text) + '\\u201d</span></div>').join('')
        + ((q.verbatims || []).length > 12 ? '<div class="ma-muted" style="margin-top:6px">+ ' + ((q.verbatims || []).length - 12) + ' more in the full report</div>' : '')
        + '</div>';""",
"""      h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' voices</span></div>'
        + (q.verbatims || []).slice(0, 12).map(vv =>
            '<div class="ma-ans"><span class="ma-ans-q">' + safe(vv.who) + '</span><span class="ma-ans-a">\\u201c' + safe(vv.text) + '\\u201d</span></div>').join('')
        + ((q.verbatims || []).length > 12 ? '<div class="ma-muted" style="margin-top:6px">+ ' + ((q.verbatims || []).length - 12) + ' more in the full report</div>' : '')
        + _clickBlock(q.clicks)
        + '</div>';""",
'C5b open question gains behavior')

rep(
"function _clientCrosstab(qid) {",
"""/* SEAM:CLICKPATH — what they DID, beside what they said. First-click is the
 * headline: the distribution of the very first thing each respondent touched
 * inside the stimulus. Renders nothing when there is no behavior to show. */
function _clickBlock(cs) {
  if (!cs || !cs.respondents) return '';
  const bar = (obj, label) => {
    const ks = Object.keys(obj || {});
    if (!ks.length) return '';
    const mx = Math.max(1, ...ks.map(k => obj[k]));
    return '<div class="ma-muted" style="font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin:10px 0 4px">' + label + '</div>'
      + ks.map(k => '<div class="mp-bar-row"><span class="mp-bar-label">' + safe(k) + '</span>'
        + '<span class="mp-bar-track"><span class="mp-bar-fill" style="width:' + Math.round((obj[k] / mx) * 100) + '%"></span></span>'
        + '<span class="mp-bar-n">' + obj[k] + '</span></div>').join('');
  };
  return '<div style="border-top:1px solid rgba(255,255,255,.08);margin-top:12px;padding-top:2px">'
    + '<div class="ma-muted" style="font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin:8px 0 0">Behavior \\u00B7 ' + cs.respondents + ' interacted \\u00B7 ' + cs.total + ' clicks</div>'
    + bar(cs.first, 'First click \\u2014 what they did first')
    + bar(cs.top, 'Most touched')
    + '</div>';
}
function _clientCrosstab(qid) {""",
'C5c the behavior block')

# ── C6: admin response cards — the interaction chip ─────────────────────────
rep(
"  qualityStatus: r.quality_status || null, qualityFlags: (r.quality && r.quality.flags) || [], durationMs: r.duration_ms || null }; }",
"  qualityStatus: r.quality_status || null, qualityFlags: (r.quality && r.quality.flags) || [], durationMs: r.duration_ms || null,\n"
"  clickCount: r.clicks ? Object.values(r.clicks).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0) : 0 }; }",
'C6a map counts interactions')

rep(
"  const dur = r.durationMs ? '<span class=\"ma-muted\" style=\"font-size:10px\">' + Math.round(r.durationMs / 1000) + 's</span>' : '';",
"  const dur = (r.durationMs ? '<span class=\"ma-muted\" style=\"font-size:10px\">' + Math.round(r.durationMs / 1000) + 's</span>' : '')\n"
"    + (r.clickCount ? ' <span class=\"ma-muted\" style=\"font-size:10px\">\\u00B7 ' + r.clickCount + ' interactions</span>' : '');",
'C6b card shows the chip')

# ── C7-C9: free guest door — arm, carry, disarm ─────────────────────────────
rep(
"    _guest = { s: d.data, answers: {}, consent: false };",
"    _guest = { s: d.data, answers: {}, consent: false, clicks: {} };\n"
"    window._clickStore = _guest.clicks;",
'C7 free guest arms store')

rep(
"body: JSON.stringify({ study_id: s.id, email: email.trim(), zip: zip.trim(), answers: _guest.answers }) });",
"body: JSON.stringify({ study_id: s.id, email: email.trim(), zip: zip.trim(), answers: _guest.answers, clicks: _guest.clicks || {} }) });",
'C8 free guest submit carries clicks')

rep(
"function _guestClose() { const w = document.getElementById('guestwrap'); if (w) w.remove(); document.body.style.overflow = ''; _guest = null; }",
"function _guestClose() { const w = document.getElementById('guestwrap'); if (w) w.remove(); document.body.style.overflow = ''; _guest = null; window._clickStore = null; }",
'C9 close disarms store')


assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
