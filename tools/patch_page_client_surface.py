#!/usr/bin/env python3
# patch_page_client_surface.py — MINE overhaul, page side part 2.
# Applies ON TOP of patch_page_field_rail.py. Target: intelligence/index.html
# Four surfaces: the client's live dashboard, the invite manager, the quality
# review lane, and the aggregate-first report. Everything reuses the existing
# mr-*/ma-*/mp-* brand system — no new CSS block, no new modal machinery.

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

# ── K1: route map learns the client views ───────────────────────────────────
rep(
"    'a-home': vAHome, 'a-study': vAStudy,",
"    'a-home': vAHome, 'a-study': vAStudy,\n    'c-home': vCHome, 'c-study': vCStudy,",
'K1 route map')

# ── K2: post-render hook — async fills without touching every view ──────────
rep(
"""  const stage = document.getElementById('mine-stage'); if (!stage) return;
  stage.innerHTML = (map[view] || vRHome)(arg);
  mineBar();""",
"""  const stage = document.getElementById('mine-stage'); if (!stage) return;
  stage.innerHTML = (map[view] || vRHome)(arg);
  mineBar();
  /* SEAM:CLIENT_LENS — one post-render hook instead of async render hacks:
     study detail lazily loads its invite + client-access lanes, the client
     dashboard loads results and starts its live poll, everything else stops
     the poll so a closed dashboard never keeps fetching. */
  try { _postRoute(view, arg); } catch (e) {}""",
'K2 post-render hook')

# ── K3: mineHydrate learns the client role ──────────────────────────────────
rep(
"  } else if (role === 'admin') {\n    mineSession.role = 'admin';",
"""  } else if (role === 'client') {
    mineSession.role = 'client';
    mineDB.clientStudies = [];
    try {
      const hh = await _authHeader();
      const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/client-studies', {
        method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
        body: JSON.stringify({}) });
      const d = await r.json();
      if (d && d.ok) mineDB.clientStudies = d.studies || [];
    } catch (e) {}
  } else if (role === 'admin') {
    mineSession.role = 'admin';""",
'K3 hydrate client role')

# ── K4: _sbOpenMine routes a client home ────────────────────────────────────
rep(
"  if (role === 'admin') return mineRoute('a-home');",
"""  if (role === 'admin') return mineRoute('a-home');
  if (role === 'client') return mineRoute((mineDB.clientStudies || []).length === 1
    ? 'c-study' : 'c-home', (mineDB.clientStudies || []).length === 1 ? mineDB.clientStudies[0].id : null);""",
'K4 open client')

# ── K5: mineBar shows the client identity ───────────────────────────────────
rep(
"  } else if (mineSession.role === 'admin') {",
"""  } else if (mineSession.role === 'client') {
    html = '<span class="mine-id-r" style="color:var(--accent3,#5AC8F5)">Client \\u00B7 Live results</span>'
      + ((mineDB.clientStudies || []).length > 1 ? '<button class="mine-id-b" onclick="mineRoute(\\'c-home\\')">Studies</button>' : '')
      + '<button class="mine-id-b" onclick="mineSignOut()">Sign out</button>';
  } else if (mineSession.role === 'admin') {""",
'K5 client bar')

# ── K6: hub reveals the client door when a grant exists ─────────────────────
rep(
"  if (typeof _syncAdminUI === 'function') _syncAdminUI();",
"""  if (typeof _syncAdminUI === 'function') _syncAdminUI();
  /* SEAM:CLIENT_LENS — the client door appears only for someone holding a
     grant; RLS self-select makes the probe safe from any account. */
  try {
    if (sbEnabled()) _sb.from('study_client').select('id').limit(1).then(({ data }) => {
      const link = document.getElementById('mine-research-ops-link');
      if (data && data.length && link && !document.getElementById('mine-client-link')) {
        const b = document.createElement('button');
        b.className = 'uai-link'; b.id = 'mine-client-link';
        b.textContent = 'Your live results \\u2192';
        b.onclick = function () { openMine('client'); };
        link.parentNode.insertBefore(b, link);
      }
    });
  } catch (e) {}""",
'K6 hub client door')

# ── K7: response mapping carries the quality read ───────────────────────────
rep(
"function _mapResponse(r) { return { id: r.id, studyId: r.study_id, anon: r.anon_id, segments: r.segments || [], answers: r.answers || {}, status: r.status }; }",
"function _mapResponse(r) { return { id: r.id, studyId: r.study_id, anon: r.anon_id, segments: r.segments || [], answers: r.answers || {}, status: r.status,\n"
"  qualityStatus: r.quality_status || null, qualityFlags: (r.quality && r.quality.flags) || [], durationMs: r.duration_ms || null }; }",
'K7 map quality')

# ── K8: response card grows the quality lane (admin verdicts) ───────────────
rep(
"""  return '<div class="mp-quote"><div class="mp-quote-m" style="margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span><span class="mp-sent-chip">' + safe(r.anon) + '</span> <span class="ma-muted">' + safe((r.segments || []).join(', ')) + '</span></span>' + payCtl + '</div>' + rows + '</div>';
}""",
"""  /* SEAM:RESPONSE_QUALITY — the review lane. Flags are visible to whoever can
     see the card; verdict buttons are admin-only, matching the RLS reality
     (response_admin_update). Reject removes a response from the client read;
     the delete button is the withdrawal right made mechanical. */
  const flags = r.qualityFlags || [];
  const qchips = (r.qualityStatus ? [r.qualityStatus] : []).concat(flags).map(f => {
    const bad = f === 'rejected' || flags.indexOf(f) >= 0;
    const good = f === 'clean';
    return '<span style="font-family:\\'Space Mono\\',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;'
      + 'padding:2px 7px;border-radius:2px;border:1px solid currentColor;color:'
      + (good ? 'var(--accent4,#F55A8C)' : bad ? 'var(--red,#FF3333)' : 'var(--text3,#545268)') + '">' + safe(f) + '</span>';
  }).join(' ');
  const dur = r.durationMs ? '<span class="ma-muted" style="font-size:10px">' + Math.round(r.durationMs / 1000) + 's</span>' : '';
  const isAdminView = mineSession.role === 'admin';
  const verdicts = isAdminView && sbEnabled()
    ? '<span style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'
      + (r.qualityStatus !== 'clean' ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px" onclick="_qualityMark(\\'' + r.id + '\\',\\'clean\\')">Mark clean</button>' : '')
      + (r.qualityStatus !== 'rejected' ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_qualityMark(\\'' + r.id + '\\',\\'rejected\\')">Reject</button>' : '')
      + '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_responseDelete(\\'' + r.id + '\\')">Delete (withdrawal)</button></span>'
    : '';
  return '<div class="mp-quote"' + (r.qualityStatus === 'rejected' ? ' style="opacity:.45"' : '') + '><div class="mp-quote-m" style="margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span><span class="mp-sent-chip">' + safe(r.anon) + '</span> <span class="ma-muted">' + safe((r.segments || []).join(', ')) + '</span> ' + dur + '</span><span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + qchips + payCtl + '</span></div>' + rows + verdicts + '</div>';
}""",
'K8 quality lane on cards')

# ── K9: study detail grows the fielding + client-access lanes ───────────────
rep(
"    + linkRow + lakeRow + listRow + '<div class=\"ma-sec\">Responses \u2014 every one is a receipt</div>'",
"    + linkRow + _fieldRailRow(s, admin) + _clientAccessRow(s, admin) + lakeRow + listRow + '<div class=\"ma-sec\">Responses \u2014 every one is a receipt</div>'",
'K9 detail lanes')

# ── K10: report goes aggregate-first ────────────────────────────────────────
rep(
"    + '<div class=\"eb\">Responses \\u2014 every one is a receipt</div>' + (rows || '<div class=\"meta\">No responses yet.</div>')",
"    + _reportAggregate(s, resp)\n"
"    + '<div class=\"eb\">Responses \\u2014 every one is a receipt</div>' + (rows || '<div class=\"meta\">No responses yet.</div>')",
'K10 aggregate-first report')

# ── K11: the whole client/fielding block, before the route switch ───────────
rep(
"function mineRoute(view, arg) {",
"""/* ═══ SEAM:CLIENT_LENS — the client's room ═══════════════════════════════
 * A client is somebody paying to watch their own study fill up. This surface
 * gives them exactly that and nothing else: fielding progress, then findings
 * once the floor is met, verbatims as anon labels, one cross-tab. No edit
 * buttons exist here because no edit rights exist behind them. */
let _clientPollTimer = null;
let _clientCache = null;

function _postRoute(view, arg) {
  if (_clientPollTimer) { clearInterval(_clientPollTimer); _clientPollTimer = null; }
  if (view === 'c-study' && arg) {
    _clientLoadResults(arg);
    _clientPollTimer = setInterval(function () { _clientLoadResults(arg, true); }, 60000);
  }
  if ((view === 'p-study' || view === 'a-study') && arg) {
    _invitesLoad(arg);
    _clientListLoad(arg);
  }
}

function vCHome() {
  const list = (mineDB.clientStudies || []).map(st =>
    '<button class="ma-gate-row" onclick="mineRoute(\\'c-study\\',\\'' + st.id + '\\')">'
    + '<span>' + safe(st.title) + '</span>'
    + '<span class="ma-muted">' + st.n + (st.target_n ? ' / ' + st.target_n : '') + ' responses \\u00B7 ' + safe(st.status) + '</span></button>').join('');
  return '<span class="mr-eyebrow">Client \\u00B7 Live results</span><h2 class="mr-h">Your studies.</h2>'
    + '<p class="mr-p">Live reads on the research you commissioned \\u2014 updated as responses arrive.</p>'
    + (list || empty('No studies are shared with this account yet. Ask your Unsurfaced contact for access.'));
}

function vCStudy(sid) {
  const st = (mineDB.clientStudies || []).find(x => x.id === sid);
  return ((mineDB.clientStudies || []).length > 1
      ? '<button class="mr-btn" style="margin-bottom:18px" onclick="mineRoute(\\'c-home\\')">\\u2190 Your studies</button>' : '')
    + '<span class="mr-eyebrow">Live results' + (st ? ' \\u00B7 ' + safe(st.status) : '') + '</span>'
    + '<h2 class="mr-h">' + safe(st ? st.title : 'Your study') + '</h2>'
    + (st && st.goal ? '<p class="mr-p">' + safe(st.goal) + '</p>' : '')
    + '<div id="client-results"><p class="mr-p ma-empty">Loading the live read\\u2026</p></div>';
}

async function _clientLoadResults(sid, quiet) {
  const box = document.getElementById('client-results');
  if (!box) return;
  try {
    const hh = await _authHeader();
    const bodyReq = { study_id: sid };
    if (_clientCache && _clientCache.sid === sid && _clientCache.crosstab) bodyReq.crosstab = _clientCache.crosstab;
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/client-results', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify(bodyReq) });
    const d = await r.json();
    if (!d || !d.ok) { if (!quiet) box.innerHTML = empty('Could not load results \\u2014 check your connection.'); return; }
    _clientCache = { sid, data: d, crosstab: bodyReq.crosstab || null };
    box.innerHTML = _clientResultsHtml(d);
  } catch (e) { if (!quiet) box.innerHTML = empty('Could not load results \\u2014 check your connection.'); }
}

function _clientResultsHtml(d) {
  const tn = d.study.target_n;
  const pctFill = tn ? Math.min(100, Math.round((d.n / tn) * 100)) : null;
  let h = '<div class="ma-metrics">'
    + metric(tn ? d.n + ' / ' + tn : d.n, 'Responses in')
    + metric(d.study.status === 'live' ? 'LIVE' : safe(d.study.status).toUpperCase(), 'Fielding')
    + (d.floor_met ? metric('OPEN', 'Findings') : metric(d.floor, 'Opens at N'))
    + '</div>';
  if (pctFill != null) h += '<div class="mp-bar-track" style="display:block;height:8px;margin:4px 0 18px"><span class="mp-bar-fill" style="width:' + pctFill + '%;height:8px;display:block"></span></div>';
  h += '<p class="ma-muted" style="font-family:\\'Space Mono\\',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase">Live \\u00B7 refreshes each minute \\u00B7 rejected responses never counted</p>';
  if (!d.floor_met) {
    /* The floor, explained in the client's language rather than enforced in
       silence — a number they can hold us to instead of one they screenshot. */
    return h + '<div class="ma-sum" style="margin-top:14px"><div class="ma-q">Findings open at ' + d.floor + ' responses</div>'
      + '<div class="ma-row-s">Early percentages mislead \\u2014 at small counts a single response moves a result by whole points. '
      + 'The moment ' + d.floor + ' quality responses are in, every question\\u2019s distribution appears here automatically. '
      + 'The study keeps collecting either way.</div></div>';
  }
  const singles = d.questions.filter(q => q.type === 'single' || q.type === 'scale');
  if (singles.length) {
    h += '<div class="ma-sec" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">What the field is saying'
      + '<select class="mr-field" style="width:auto;font-size:11px;padding:6px 10px" onchange="_clientCrosstab(this.value)">'
      + '<option value="">Cross-tab: off</option>'
      + singles.map(q => '<option value="' + q.id + '"' + (_clientCache && _clientCache.crosstab === q.id ? ' selected' : '') + '>By segment: ' + safe(q.prompt.slice(0, 40)) + '</option>').join('')
      + '</select></div>';
  } else h += '<div class="ma-sec">What the field is saying</div>';
  for (const q of d.questions) {
    if (q.type === 'open') {
      h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' voices</span></div>'
        + (q.verbatims || []).slice(0, 12).map(vv =>
            '<div class="ma-ans"><span class="ma-ans-q">' + safe(vv.who) + '</span><span class="ma-ans-a">\\u201c' + safe(vv.text) + '\\u201d</span></div>').join('')
        + ((q.verbatims || []).length > 12 ? '<div class="ma-muted" style="margin-top:6px">+ ' + ((q.verbatims || []).length - 12) + ' more in the full report</div>' : '')
        + '</div>';
      continue;
    }
    const keys = Object.keys(q.counts || {}).sort((a, b) => (q.counts[b] || 0) - (q.counts[a] || 0));
    const max = Math.max(1, ...keys.map(k => q.counts[k]));
    h += '<div class="ma-sum"><div class="ma-q">' + safe(q.prompt) + ' <span class="ma-muted">\\u00B7 ' + q.answered + ' answered</span></div>'
      + keys.map(k => '<div class="mp-bar-row"><span class="mp-bar-label">' + safe(k) + '</span>'
          + '<span class="mp-bar-track"><span class="mp-bar-fill" style="width:' + Math.round((q.counts[k] / max) * 100) + '%"></span></span>'
          + '<span class="mp-bar-n">' + (q.pct && q.pct[k] != null ? q.pct[k] + '%' : q.counts[k]) + '</span></div>').join('')
      + '</div>';
  }
  if (d.crosstab && Object.keys(d.crosstab).length) {
    h += '<div class="ma-sec">By segment</div>';
    for (const seg of Object.keys(d.crosstab)) {
      const cell = d.crosstab[seg];
      const ks = Object.keys(cell.counts).sort((a, b) => cell.counts[b] - cell.counts[a]);
      const mx = Math.max(1, ...ks.map(k => cell.counts[k]));
      h += '<div class="ma-sum"><div class="ma-q">' + safe(seg) + ' <span class="ma-muted">\\u00B7 n=' + cell.n + '</span></div>'
        + ks.map(k => '<div class="mp-bar-row"><span class="mp-bar-label">' + safe(k) + '</span>'
            + '<span class="mp-bar-track"><span class="mp-bar-fill" style="width:' + Math.round((cell.counts[k] / mx) * 100) + '%"></span></span>'
            + '<span class="mp-bar-n">' + cell.counts[k] + '</span></div>').join('')
        + '</div>';
    }
  } else if (_clientCache && _clientCache.crosstab) {
    h += '<div class="ma-sum"><div class="ma-row-s">No segment reaches the minimum cell size yet \\u2014 cross-tabs appear when a segment carries at least 5 responses.</div></div>';
  }
  return h;
}

function _clientCrosstab(qid) {
  if (_clientCache) { _clientCache.crosstab = qid || null; _clientLoadResults(_clientCache.sid); }
}

/* ═══ SEAM:FIELD_RAIL — the invite manager ═══════════════════════════════
 * The mint endpoint existed with no hands on it. This is the hands: paste a
 * list (the client's customer export arrives exactly this way), mint, send,
 * watch the tally move. Free studies keep their open link; this lane renders
 * for paid studies, where tokens are the only door. */
function _fieldRailRow(s, admin) {
  if (!sbEnabled() || !API_BASE) return '';
  if (!(s.pay > 0) || s.status === 'draft') return '';
  return '<div class="ma-sec">Field the study \\u2014 invited links</div>'
    + '<div id="inv-mgr"><p class="mr-p ma-empty">Loading invites\\u2026</p></div>';
}

async function _invitesLoad(sid) {
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
}

function _invitesHtml(sid, d) {
  const t = d.tally || {};
  const head = '<div class="ma-metrics">' + metric(d.total || 0, 'Invited')
    + metric(t.sent || 0, 'Sent') + metric(t.responded || 0, 'Responded')
    + metric(t.screened || 0, 'Screened') + '</div>';
  const paste = '<textarea id="inv-paste" class="mr-textarea" rows="3" placeholder="Paste emails \\u2014 one per line, or comma separated. Names welcome: Ada Lovelace <ada@ex.com>"></textarea>'
    + '<div class="mr-nav" style="margin:8px 0 16px">'
    + '<button class="mr-btn mr-btn-primary" onclick="_invitesMint(\\'' + sid + '\\')">Mint links</button>'
    + ((t.pending || 0) > 0 ? '<button class="mr-btn" onclick="_invitesSend(\\'' + sid + '\\')">Send ' + t.pending + ' pending \\u2192</button>' : '')
    + '</div>';
  const rows = (d.invites || []).map(i =>
    '<div class="ma-row"><div><div class="ma-row-t">' + safe(i.email) + (i.name ? ' <span class="ma-muted">' + safe(i.name) + '</span>' : '') + '</div>'
    + '<div class="ma-row-s" style="font-family:\\'Space Mono\\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase">' + safe(i.status) + '</div></div>'
    + '<span style="display:flex;gap:6px">'
    + (i.link && i.status !== 'revoked' && i.status !== 'responded'
        ? '<button class="mr-btn" style="font-size:10px;padding:4px 9px" onclick="_inviteCopy(this,\\'' + safeAttr(i.link) + '\\')">Copy link</button>'
          + '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_inviteRevoke(\\'' + sid + '\\',\\'' + i.id + '\\')">Revoke</button>'
        : '') + '</span></div>').join('');
  return head + paste + rows;
}

async function _invitesMint(sid) {
  const raw = (document.getElementById('inv-paste') || {}).value || '';
  if (!raw.trim()) { showToast('Paste at least one email'); return; }
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'mint', list: raw }) });
    const d = await r.json();
    if (d && d.ok) { showToast(d.minted + ' new link' + (d.minted === 1 ? '' : 's') + ' minted'); _invitesLoad(sid); }
    else showToast(d && d.error === 'no_valid_emails' ? 'No valid emails in that list' : 'Mint failed \\u2014 try again');
  } catch (e) { showToast('Mint failed \\u2014 try again'); }
}

async function _invitesSend(sid) {
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'send' }) });
    const d = await r.json();
    if (d && d.ok) { showToast(d.sent + ' invitation' + (d.sent === 1 ? '' : 's') + ' sent' + (d.remaining ? ' \\u00B7 ' + d.remaining + ' remaining \\u2014 send again' : '')); _invitesLoad(sid); }
    else showToast(d && d.error === 'study_not_live' ? 'Launch the study before sending invites' : 'Send failed \\u2014 try again');
  } catch (e) { showToast('Send failed \\u2014 try again'); }
}

async function _inviteRevoke(sid, id) {
  try {
    const hh = await _authHeader();
    await fetch(API_BASE.replace(/\\/$/, '') + '/mine/invites', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'revoke', invite_id: id }) });
    _invitesLoad(sid);
  } catch (e) {}
}

function _inviteCopy(btn, link) {
  try { navigator.clipboard.writeText(link).then(function () { showToast('Link copied'); }); }
  catch (e) { showToast(link); }
}

/* SEAM:CLIENT_LENS — granting the client their window, from the study page. */
function _clientAccessRow(s, admin) {
  if (!sbEnabled() || !API_BASE) return '';
  if (s.status === 'draft') return '';
  return '<div class="ma-sec">Client access \\u2014 read-only, this study only</div>'
    + '<div id="client-acc"><p class="mr-p ma-empty">Loading\\u2026</p></div>';
}

async function _clientListLoad(sid) {
  const box = document.getElementById('client-acc');
  if (!box) return;
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/client-access', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'list' }) });
    const d = await r.json();
    if (!d || !d.ok) { box.innerHTML = ''; return; }
    const rows = (d.clients || []).map(c =>
      '<div class="ma-row"><div><div class="ma-row-t">' + safe(c.email || c.id) + '</div>'
      + '<div class="ma-row-s">Watching live results</div></div>'
      + '<button class="mr-btn" style="font-size:10px;padding:4px 9px;color:var(--red,#FF3333)" onclick="_clientRevoke(\\'' + sid + '\\',\\'' + c.id + '\\')">Revoke</button></div>').join('');
    box.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 10px">'
      + '<input id="client-email" class="mr-field" type="email" placeholder="client@brand.com" style="flex:1;min-width:200px">'
      + '<button class="mr-btn mr-btn-primary" onclick="_clientGrant(\\'' + sid + '\\')">Grant access</button></div>'
      + (rows || '<p class="ma-muted">No client is watching yet. They create an account first, then you grant their email here.</p>');
  } catch (e) { box.innerHTML = ''; }
}

async function _clientGrant(sid) {
  const email = (document.getElementById('client-email') || {}).value || '';
  if (!email.trim()) { showToast('Enter the client\\u2019s email'); return; }
  try {
    const hh = await _authHeader();
    const r = await fetch(API_BASE.replace(/\\/$/, '') + '/mine/client-access', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'grant', email: email.trim() }) });
    const d = await r.json();
    if (d && d.ok) { showToast('Access granted \\u2014 ' + d.granted + ' can watch live'); _clientListLoad(sid); }
    else showToast(d && d.error === 'no_account'
      ? 'No account for that email yet \\u2014 have the client sign up first, then grant'
      : 'Grant failed \\u2014 try again');
  } catch (e) { showToast('Grant failed \\u2014 try again'); }
}

async function _clientRevoke(sid, id) {
  try {
    const hh = await _authHeader();
    await fetch(API_BASE.replace(/\\/$/, '') + '/mine/client-access', {
      method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ study_id: sid, op: 'revoke', client_id: id }) });
    _clientListLoad(sid);
  } catch (e) {}
}

/* ═══ SEAM:RESPONSE_QUALITY — admin verdicts, RLS-honest ═════════════════
 * .select('id') after every write because a failed RLS policy updates zero
 * rows without error — the affected-row assert is the only honest receipt. */
async function _qualityMark(rid, status) {
  try {
    const { data, error } = await _sb.from('response').update({ quality_status: status }).eq('id', rid).select('id');
    if (error || !data || !data.length) { showToast('Verdict did not stick \\u2014 admin only'); return; }
    const local = mineDB.responses.find(x => x.id === rid);
    if (local) local.qualityStatus = status;
    showToast(status === 'clean' ? 'Marked clean' : 'Rejected \\u2014 removed from the client read');
    mineRoute(mineState.view, mineState.arg);
  } catch (e) { showToast('Verdict failed \\u2014 try again'); }
}

async function _responseDelete(rid) {
  if (!confirm('Delete this response permanently? This is the withdrawal right \\u2014 it cannot be undone.')) return;
  try {
    const { data, error } = await _sb.from('response').delete().eq('id', rid).select('id');
    if (error || !data || !data.length) { showToast('Delete did not stick \\u2014 admin only'); return; }
    mineDB.responses = mineDB.responses.filter(x => x.id !== rid);
    showToast('Response deleted');
    mineRoute(mineState.view, mineState.arg);
  } catch (e) { showToast('Delete failed \\u2014 try again'); }
}

/* SEAM:CLIENT_LENS — the report leads with the finding, ends with receipts. */
function _reportAggregate(s, resp) {
  const live = resp.filter(r => r.qualityStatus !== 'rejected');
  if (!live.length) return '';
  let h = '<div class="eb">The numbers \\u2014 ' + live.length + ' quality responses</div>';
  for (const q of (s.questions || [])) {
    if (q.type === 'screener' || q.type === 'attention') continue;
    if (q.type === 'open') {
      const verbs = live.map(r => ({ who: r.anon || 'anon', text: String((r.answers || {})[q.id] || '').trim() }))
        .filter(x => x.text.length >= 12).slice(0, 6);
      if (!verbs.length) continue;
      h += '<div class="q">' + safe(q.prompt) + '</div>'
        + verbs.map(x => '<div class="a" style="margin:4px 0">\\u201c' + safe(x.text) + '\\u201d <span class="meta">\\u2014 ' + safe(x.who) + '</span></div>').join('');
      continue;
    }
    const counts = {};
    let answered = 0;
    for (const r of live) {
      const a = (r.answers || {})[q.id];
      if (a == null || String(a).trim() === '') continue;
      answered++;
      (Array.isArray(a) ? a : [a]).forEach(x => { const k = String(x); if (k.trim()) counts[k] = (counts[k] || 0) + 1; });
    }
    if (!answered) continue;
    const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    h += '<div class="q">' + safe(q.prompt) + '</div>'
      + keys.map(k => '<div class="a" style="display:flex;justify-content:space-between;gap:14px"><span>' + safe(k) + '</span><span><b>' + Math.round((counts[k] / answered) * 1000) / 10 + '%</b> <span class="meta">(' + counts[k] + ')</span></span></div>').join('');
  }
  return h;
}

function mineRoute(view, arg) {""",
'K11 client + fielding block')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
