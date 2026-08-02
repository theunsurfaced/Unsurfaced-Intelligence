#!/usr/bin/env python3
# patch_page_flight_recorder.py — the platform reports its own failures.
# Target: intelligence/index.html. Applies on top of patch_page_evo4_opener.py.
# Born from a freeze that gave no testimony: crash bar (any runtime error
# paints itself), loading-screen CANCEL (no more scroll-locked dead ends),
# stage beacons + 25s watchdog (a hang names itself), and a 3s boot chip
# (its absence on reload convicts a boot crash the bar will have named).

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

rep(
"""async function openInsightDashboard(config) {""",
"""/* SEAM:FLIGHT_RECORDER — the platform reports its own failures. A silent
 * freeze cost two debugging rounds; never again. Any uncaught error or
 * rejection paints a persistent banner with message and line — the user's
 * screenshot IS the diagnosis. */
(function () {
  function _crashBar(msg) {
    try {
      var b = document.getElementById('unsrf-crash') || document.createElement('div');
      b.id = 'unsrf-crash';
      b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#C41230;color:#fff;padding:8px 14px;font-family:monospace;font-size:11px;line-height:1.5;white-space:pre-wrap';
      b.textContent = 'RUNTIME · ' + msg + '   (screenshot this bar)';
      document.body.appendChild(b);
    } catch (e2) {}
  }
  window.addEventListener('error', function (ev) {
    _crashBar((ev.message || 'error') + ' · ' + String(ev.filename || '').split('/').pop() + ':' + (ev.lineno || '?'));
  });
  window.addEventListener('unhandledrejection', function (ev) {
    _crashBar('unhandled rejection · ' + String(ev.reason && (ev.reason.message || ev.reason)).slice(0, 200));
  });
})();
async function openInsightDashboard(config) {""",
'T1 flight recorder')

rep(
"""    <div class="idb-spinner"></div>
    <div class="idb-loading-label">EXCAVATING INTELLIGENCE</div>
    <div class="idb-loading-q" id="idb-loading-q"></div>""",
"""    <div class="idb-spinner"></div>
    <div class="idb-loading-label">EXCAVATING INTELLIGENCE</div>
    <div class="idb-loading-q" id="idb-loading-q"></div>
    <div id="idb-loading-diag" style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;color:var(--text3);margin-top:14px"></div>
    <button onclick="closeInsightDashboard()" style="margin-top:18px;background:none;border:1px solid var(--border2);color:var(--text2);font-family:'Space Mono',monospace;font-size:10px;padding:9px 18px;cursor:pointer;letter-spacing:.1em">← CANCEL</button>""",
'T2 loading escape hatch')

rep(
"""  try {
    _querySeed = Date.now();
    const topicKey = _getTopicKey(config);
    const data = await _runDashboardSearch(config, topicKey);""",
"""  try {
    _querySeed = Date.now();
    const topicKey = _getTopicKey(config);
    /* SEAM:FLIGHT_RECORDER — stage beacons + watchdog: the loading screen
       narrates which stage is running, and past 25s it says so out loud.
       A hang now has a name and an exit instead of a locked screen. */
    const _diag = (t) => { const d = document.getElementById('idb-loading-diag'); if (d) d.textContent = t; };
    _diag('stage: searching open sources…');
    const _wd = setTimeout(() => _diag('taking unusually long — a source may be stalled · CANCEL is safe, retry after'), 25000);
    let data;
    try { data = await _runDashboardSearch(config, topicKey); }
    finally { clearTimeout(_wd); }
    _diag('stage: rendering…');""",
'T3 stage beacons + watchdog')

rep(
"""window._clickStore = null;   // set by whichever response flow is live""",
"""window._clickStore = null;                     // preview records nothing
  _guestRender();
  setTimeout(() => { const w = document.querySelector('#guestwrap .sb');
    if (w) w.insertAdjacentHTML('afterbegin',
      '<div style="background:var(--red,#C41230);color:#fff;font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px;margin:0 0 14px">Preview \\u2014 exactly what respondents see \\u00B7 nothing records</div>'); }, 0);
}
async function _tokenMaybeOpen(tok) {
  if (!tok || !API_BASE) return;
  try {
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/t?token=' + encodeURIComponent(tok));
    const d = await r.json();
    if (!d || !d.ok || !d.data) {
      const code = d && d.error;
      showToast(code === 'already_responded' ? 'This invitation has already been used'
        : code === 'token_revoked' ? 'This invitation is no longer active'
        : code === 'study_closed' ? 'This study has closed \\u2014 thank you'
        : 'This invitation link is not valid');
      return;
    }
    _guest = { s: d.data, answers: {}, consent: false, token: tok,
      email: d.data.invited_email || '', startedAt: Date.now(),
      consentVersion: d.data.consent_version || null, clicks: {} };
    window._clickStore = _guest.clicks;
    _guestRender();
  } catch (e) {}
}
/* SEAM:EVOLUTION_1 — the progress read. Uncertainty is where abandonment
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
function _guestSet(qid, val, multi) {
  if (!_guest) return;
  if (multi) { const cur = _guest.answers[qid] || []; const i = cur.indexOf(val); if (i >= 0) cur.splice(i, 1); else cur.push(val); _guest.answers[qid] = cur; }
  else _guest.answers[qid] = val;
  _guestRender();
  setTimeout(_guestProgress, 0);
}
/* SEAM:STIMULUS — one renderer for every stimulus, treatment by filename.
 * HTML is the headline: a mock landing page renders live and clickable in a
 * sandboxed iframe (scripts, forms, popups — never an origin). Everything a
 * respondent reacts to flows through here, so the treatment rules live in
 * exactly one place. */
/* SEAM:CLICKPATH — the overlay's half of the instrument. The beacon inside a
 * stimulus posts {unsrf:'click',...}; a sandboxed frame's origin is opaque
 * ('null'), so event.source vs iframe.contentWindow is the only trustworthy
 * address. Events file into the active response store under the frame's
 * question id — study-level stimuli file under '_study'. Everything shaped
 * and capped here AND server-side; the worker's cleanClicks is the law. */
window._clickStore = null;   // set by whichever response flow is live
/* SEAM:FLIGHT_RECORDER — boot chip: three seconds of proof the script
 * armed. If a click "does nothing", the chip's absence on reload convicts a
 * boot-time crash (which the crash bar will have named). */
setTimeout(function () {
  try {
    var c = document.createElement('div');
    c.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:99999;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.4);color:#4ade80;font-family:monospace;font-size:9px;letter-spacing:.12em;padding:4px 10px;pointer-events:none';
    c.textContent = 'SCRIPTS ARMED';
    document.body.appendChild(c);
    setTimeout(function () { c.remove(); }, 3000);
  } catch (e) {}
}, 300);""",
'T4 boot chip')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
