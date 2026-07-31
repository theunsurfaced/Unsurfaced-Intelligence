#!/usr/bin/env python3
# patch_worker_clickpath.py — SEAM:CLICKPATH, worker side.
# Target: worker/src/index.js. Requires 0023_click_paths.sql. Applies on top
# of patch_worker_stimulus.py.
#
# The design in one line: the worker injects the instrument, the overlay files
# the events, the worker sanitizes what comes back, the client read answers
# "what did they do first." No client cooperation required — ANY uploaded HTML
# gets the beacon at serve time.

import io, os

PATH = os.environ.get('WORKER_PATH', 'worker/src/index.js')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── P1: the beacon + sanitizer + summary, mounted before serveMedia ─────────
rep(
"async function serveMedia(path, env, origin, request) {",
"""/* ═══ SEAM:CLICKPATH — behavior beside stated response ═══════════════════
 * CLICK_BEACON is appended to every served HTML stimulus (append, never
 * html.replace('</body>') — the injection law). It captures clicks at the
 * document level — label, href, position, ms since open — and posts them to
 * the parent via postMessage, the one channel a sandboxed opaque-origin frame
 * has. Appending at document end is deliberate: the DOM exists by then and
 * document-level listeners need no placement. Cap 200 events; the beacon
 * never throws into the client's page. */
const CLICK_BEACON = '<script>(function(){try{var t0=Date.now(),n=0;'
  + 'function lbl(el){var e=(el&&el.closest)?(el.closest("a,button,[role=button],input,select,textarea,[onclick]")||el):el;'
  + 'var s=String(e.innerText||e.value||e.getAttribute("aria-label")||e.title||e.tagName||"").trim().replace(/\\\\s+/g," ").slice(0,40);'
  + 'return s||String(e.tagName||"?");}'
  + 'document.addEventListener("click",function(ev){if(n>=200)return;n++;'
  + 'var a=(ev.target&&ev.target.closest)?ev.target.closest("a"):null;'
  + 'parent.postMessage({unsrf:"click",t:Date.now()-t0,label:lbl(ev.target),'
  + 'href:a?String(a.getAttribute("href")||"").slice(0,120):null,'
  + 'x:Math.round(ev.clientX||0),y:Math.round(ev.clientY||0)},"*");},true);'
  + 'parent.postMessage({unsrf:"open",t:0},"*");'
  + '}catch(e){}})();<\\/script>';

// PURE and total: whatever a browser (or an attacker) posts back becomes at
// most 200 shaped events across all questions, strings capped, numbers
// coerced, unknown keys dropped. Garbage in, empty object out.
function cleanClicks(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  let budget = 200;
  for (const qid of Object.keys(raw).slice(0, 40)) {
    if (!/^[\\w-]{1,60}$/.test(qid)) continue;
    const arr = raw[qid];
    if (!Array.isArray(arr)) continue;
    const evs = [];
    for (const e of arr) {
      if (budget <= 0) break;
      if (!e || typeof e !== 'object') continue;
      const type = e.type === 'open' ? 'open' : 'click';
      const ev = { type, t: Math.max(0, Math.min(36e5, parseInt(e.t, 10) || 0)) };
      if (type === 'click') {
        ev.label = String(e.label || '').slice(0, 40);
        if (!ev.label) continue;
        if (e.href) ev.href = String(e.href).slice(0, 120);
        ev.x = Math.max(0, Math.min(9999, parseInt(e.x, 10) || 0));
        ev.y = Math.max(0, Math.min(9999, parseInt(e.y, 10) || 0));
      }
      evs.push(ev); budget--;
    }
    if (evs.length) out[qid] = evs;
  }
  return out;
}

// PURE: the client-read summary for one question — how many respondents
// interacted, total clicks, the first-click distribution (the money answer),
// and the most-touched targets. Rejected responses never counted upstream.
function clickSummary(rows, qid) {
  let respondents = 0, total = 0;
  const first = {}, top = {};
  for (const r of (rows || [])) {
    const evs = (r.clicks && r.clicks[qid]) || [];
    const clicks = evs.filter(e => e && e.type === 'click' && e.label);
    if (!clicks.length) continue;
    respondents++; total += clicks.length;
    const f = clicks[0].label;
    first[f] = (first[f] || 0) + 1;
    for (const c of clicks) top[c.label] = (top[c.label] || 0) + 1;
  }
  if (!respondents) return null;
  const cut = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8));
  return { respondents, total, first: cut(first), top: cut(top) };
}

async function serveMedia(path, env, origin, request) {""",
'P1 beacon + sanitizer + summary')

# ── P2: serveMedia injects the beacon into full (non-range) HTML responses ──
rep(
"""  if (ctype.indexOf('text/html') >= 0)
    headers.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);""",
"""  if (ctype.indexOf('text/html') >= 0)
    headers.set('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups');
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  /* SEAM:CLICKPATH — full HTML responses carry the beacon, appended to the
     document (landing pages are small; buffering one is nothing). Range
     requests skip injection — nobody range-requests a landing page, and a
     spliced beacon would corrupt the byte math. */
  if (!range && ctype.indexOf('text/html') >= 0) {
    const html = await obj.text();
    headers.delete('Content-Length');
    return new Response(html + CLICK_BEACON, { headers });
  }""",
'P2 injection at serve')

# ── P3: token respond stores sanitized clicks ───────────────────────────────
rep(
"        quality: { flags: scan.flags }, quality_status: scan.status,",
"        quality: { flags: scan.flags }, quality_status: scan.status,\n"
"        clicks: cleanClicks(body.clicks),",
'P3 token respond clicks')

# ── P4: guest respond stores sanitized clicks ───────────────────────────────
rep(
"    await sbRest(env, 'response', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { study_id: sid, anon_id: anon, segments: [zip], answers, guest_email: email, guest_zip: zip, status: 'submitted' } });",
"    await sbRest(env, 'response', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { study_id: sid, anon_id: anon, segments: [zip], answers, guest_email: email, guest_zip: zip, status: 'submitted', clicks: cleanClicks(body.clicks) } });",
'P4 guest respond clicks')

# ── P5: client results — select clicks, summarize per question ──────────────
rep(
"    const rows = await sbRest(env,\n"
"      `response?study_id=eq.${sid}&select=anon_id,segments,answers,quality_status,submitted_at&limit=2000`) || [];",
"    const rows = await sbRest(env,\n"
"      `response?study_id=eq.${sid}&select=anon_id,segments,answers,clicks,quality_status,submitted_at&limit=2000`) || [];",
'P5a select clicks')

rep(
"    const agg = aggregateResponses(rows, qs, RAIL.CLIENT_FLOOR);",
"""    const agg = aggregateResponses(rows, qs, RAIL.CLIENT_FLOOR);
    /* SEAM:CLICKPATH — behavior joins the read once the floor is met. Only
       non-rejected responses feed the summary, same law as every number. */
    if (agg.floor_met) {
      const live = rows.filter(r => r.quality_status !== 'rejected');
      for (const q of agg.questions) {
        const cs = clickSummary(live, q.id);
        if (cs) q.clicks = cs;
      }
    }""",
'P5b summarize per question')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
