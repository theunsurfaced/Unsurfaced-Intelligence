#!/usr/bin/env python3
"""
SEAM:STUDY_INVITE -- surgical injection into intelligence/index.html

Single anchor, single insertion, zero edits to any existing script block.
Run from repo root. Idempotent: refuses to double-inject.
"""

import io, os, sys

TARGET = "intelligence/index.html"
# exact opening marker. A bare "SEAM:STUDY_INVITE" would also match
# SEAM:STUDY_INVITE_ROUTE and refuse a clean file.
SEAM = "<!-- SEAM:STUDY_INVITE --"

BLOCK = r"""<!-- SEAM:STUDY_INVITE -- open studies invite, INTELLIGENCE hub -->
<style id="usiInviteCss">
#usiInvite{
  --usi-ink:#EDEAE3;
  --usi-muted:rgba(237,234,227,.56);
  --usi-faint:rgba(237,234,227,.34);
  --usi-line:rgba(237,234,227,.13);
  --usi-amber:#E8A33D;
  --usi-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;
  position:fixed;
  inset:0;
  z-index:8800; /* under login gate 9000, overlays 9500, toasts 9600 */
  pointer-events:none;
  -webkit-font-smoothing:antialiased;
}
#usiInvite[hidden]{display:none}
#usiInvite *{box-sizing:border-box}

.usiInvite__scrim{
  position:absolute;
  inset:0;
  background:rgba(0,0,0,.62);
  opacity:0;
  pointer-events:none;
  transition:opacity .34s ease;
}

.usiInvite__card{
  position:absolute;
  top:104px;
  right:32px;
  width:392px;
  max-width:calc(100vw - 48px);
  pointer-events:auto;
  background:linear-gradient(180deg,#101010 0%,#070707 100%);
  border:1px solid var(--usi-line);
  border-radius:3px;
  padding:24px 24px 20px 26px;
  overflow:hidden;
  box-shadow:0 28px 70px rgba(0,0,0,.72);
  opacity:0;
  transform:translateY(-12px);
  transition:opacity .42s ease,transform .52s cubic-bezier(.16,1,.3,1),padding .3s ease,width .3s ease;
}
#usiInvite.is-open .usiInvite__card{opacity:1;transform:translateY(0)}

/* signature: the core line */
.usiInvite__core{
  position:absolute;
  left:0; top:0;
  width:2px; height:100%;
  background:linear-gradient(180deg,var(--usi-amber) 0%,rgba(232,169,61,.28) 100%);
  transform:scaleY(0);
  transform-origin:top;
  transition:transform .82s cubic-bezier(.16,1,.3,1) .14s;
}
#usiInvite.is-open .usiInvite__core{transform:scaleY(1)}

/* signature: the scanner sweep, runs once */
.usiInvite__sweep{
  position:absolute;
  left:0; right:0; top:0;
  height:1px;
  background:linear-gradient(90deg,transparent 0%,rgba(232,169,61,.9) 50%,transparent 100%);
  opacity:0;
  pointer-events:none;
}
#usiInvite.is-open .usiInvite__sweep{animation:usiSweep 1.25s cubic-bezier(.22,1,.36,1) .18s 1 forwards}
@keyframes usiSweep{
  0%{opacity:0;transform:translateY(0)}
  10%{opacity:1}
  90%{opacity:1}
  100%{opacity:0;transform:translateY(var(--usi-sweepH,320px))}
}

.usiInvite__head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}
.usiInvite__eyebrow{
  margin:0;
  font-family:var(--usi-mono);
  font-size:10px;
  line-height:1;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:var(--usi-amber);
  display:flex;
  align-items:center;
  gap:9px;
}
.usiInvite__pulse{
  width:5px;height:5px;border-radius:50%;
  background:var(--usi-amber);
  box-shadow:0 0 0 0 rgba(232,169,61,.55);
  animation:usiPulse 2.4s ease-out infinite;
  flex:none;
}
@keyframes usiPulse{
  0%{box-shadow:0 0 0 0 rgba(232,169,61,.5)}
  70%{box-shadow:0 0 0 7px rgba(232,169,61,0)}
  100%{box-shadow:0 0 0 0 rgba(232,169,61,0)}
}

.usiInvite__close{
  flex:none;
  width:30px;height:30px;
  display:inline-flex;align-items:center;justify-content:center;
  background:transparent;
  border:1px solid var(--usi-line);
  border-radius:2px;
  color:var(--usi-muted);
  font-family:var(--usi-mono);
  font-size:13px;
  line-height:1;
  cursor:pointer;
  padding:0;
  transition:color .2s ease,border-color .2s ease,background .2s ease;
}
.usiInvite__close:hover{color:var(--usi-ink);border-color:rgba(237,234,227,.4);background:rgba(237,234,227,.05)}
.usiInvite__close:focus-visible{outline:2px solid var(--usi-amber);outline-offset:2px}

.usiInvite__title{
  margin:16px 0 0;
  font-size:26px;
  line-height:1.14;
  letter-spacing:-.015em;
  font-weight:700;
  color:var(--usi-ink);
}
.usiInvite__count{font-variant-numeric:tabular-nums;color:var(--usi-amber)}

.usiInvite__sub{
  margin:10px 0 0;
  font-size:13.5px;
  line-height:1.5;
  color:var(--usi-muted);
  max-width:31ch;
}

.usiInvite__strata{
  list-style:none;
  margin:20px 0 0;
  padding:0;
  border-top:1px solid var(--usi-line);
}
.usiInvite__row{
  display:flex;
  align-items:baseline;
  gap:12px;
  padding:11px 0 10px;
  border-bottom:1px solid var(--usi-line);
  opacity:0;
  transform:translateX(-8px);
}
#usiInvite.is-open .usiInvite__row{animation:usiStrata .5s cubic-bezier(.16,1,.3,1) forwards}
@keyframes usiStrata{to{opacity:1;transform:translateX(0)}}

.usiInvite__tick{
  flex:none;
  width:14px;height:1px;
  background:var(--usi-amber);
  opacity:.75;
  transform:translateY(-4px);
}
.usiInvite__rowTitle{
  flex:1 1 auto;
  min-width:0;
  font-size:13px;
  line-height:1.35;
  color:var(--usi-ink);
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.usiInvite__rowMeta{
  flex:none;
  font-family:var(--usi-mono);
  font-size:10px;
  letter-spacing:.09em;
  text-transform:uppercase;
  color:var(--usi-faint);
  white-space:nowrap;
}

.usiInvite__actions{
  display:flex;
  align-items:center;
  gap:10px;
  margin-top:20px;
}
.usiInvite__cta{
  flex:1 1 auto;
  display:inline-flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:12px 14px;
  background:var(--usi-amber);
  color:#0A0A0A;
  border:1px solid var(--usi-amber);
  border-radius:2px;
  font-family:var(--usi-mono);
  font-size:11px;
  letter-spacing:.13em;
  text-transform:uppercase;
  cursor:pointer;
  transition:filter .2s ease,transform .2s ease;
}
.usiInvite__cta:hover{filter:brightness(1.12)}
.usiInvite__cta:active{transform:translateY(1px)}
.usiInvite__cta:focus-visible{outline:2px solid var(--usi-ink);outline-offset:2px}
.usiInvite__ghost{
  flex:none;
  padding:12px 14px;
  background:transparent;
  color:var(--usi-muted);
  border:1px solid var(--usi-line);
  border-radius:2px;
  font-family:var(--usi-mono);
  font-size:11px;
  letter-spacing:.13em;
  text-transform:uppercase;
  cursor:pointer;
  transition:color .2s ease,border-color .2s ease;
}
.usiInvite__ghost:hover{color:var(--usi-ink);border-color:rgba(237,234,227,.4)}
.usiInvite__ghost:focus-visible{outline:2px solid var(--usi-amber);outline-offset:2px}

.usiInvite__handle{display:none}

/* collapsed pill once the hub has been scrolled */
#usiInvite.is-min .usiInvite__card{
  width:auto;
  padding:11px 16px 11px 18px;
  cursor:pointer;
}
#usiInvite.is-min .usiInvite__title{
  margin:0;
  font-size:12px;
  font-family:var(--usi-mono);
  letter-spacing:.13em;
  text-transform:uppercase;
  font-weight:400;
  color:var(--usi-muted);
  white-space:nowrap;
}
#usiInvite.is-min .usiInvite__sub,
#usiInvite.is-min .usiInvite__strata,
#usiInvite.is-min .usiInvite__actions{display:none}
#usiInvite.is-min .usiInvite__head{gap:22px}

/* mobile: bottom sheet with an unmissable way out */
@media (max-width:860px){
  .usiInvite__scrim{opacity:1;pointer-events:auto}
  #usiInvite.is-open .usiInvite__scrim{opacity:1}

  .usiInvite__card{
    top:auto;
    bottom:0;
    left:0;
    right:0;
    width:auto;
    max-width:none;
    border-radius:16px 16px 0 0;
    border-left:0;border-right:0;border-bottom:0;
    padding:10px 20px calc(22px + env(safe-area-inset-bottom,0px));
    transform:translateY(103%);
    opacity:1;
    transition:transform .44s cubic-bezier(.16,1,.3,1);
  }
  #usiInvite.is-open .usiInvite__card{transform:translateY(0)}
  #usiInvite.is-dragging .usiInvite__card{transition:none}

  .usiInvite__handle{
    display:block;
    width:38px;height:4px;
    margin:0 auto 16px;
    border-radius:99px;
    background:rgba(237,234,227,.28);
  }
  .usiInvite__close{
    width:44px;height:44px;
    font-size:15px;
    border-color:rgba(237,234,227,.3);
    color:var(--usi-ink);
  }
  .usiInvite__title{font-size:24px}
  .usiInvite__sub{max-width:none}
  .usiInvite__actions{flex-direction:column;align-items:stretch;gap:8px;margin-top:22px}
  .usiInvite__cta,.usiInvite__ghost{
    width:100%;
    justify-content:center;
    padding:15px 16px;
    font-size:11.5px;
  }
  .usiInvite__ghost{order:2}
  #usiInvite.is-min .usiInvite__card{width:auto;padding:10px 20px calc(22px + env(safe-area-inset-bottom,0px))}
  #usiInvite.is-min .usiInvite__sub,
  #usiInvite.is-min .usiInvite__strata{display:block}
  #usiInvite.is-min .usiInvite__actions{display:flex}
  #usiInvite.is-min .usiInvite__title{
    margin:16px 0 0;font-size:24px;font-family:inherit;
    letter-spacing:-.015em;text-transform:none;font-weight:700;color:var(--usi-ink);white-space:normal;
  }
}

@media (prefers-reduced-motion:reduce){
  #usiInvite .usiInvite__card,
  #usiInvite .usiInvite__core,
  #usiInvite .usiInvite__row,
  #usiInvite .usiInvite__sweep,
  #usiInvite .usiInvite__pulse{
    transition:opacity .2s ease !important;
    animation:none !important;
    transform:none !important;
  }
  #usiInvite .usiInvite__sweep{display:none}
  #usiInvite .usiInvite__row{opacity:1}
  #usiInvite .usiInvite__core{transform:scaleY(1) !important}
  #usiInvite .usiInvite__card{opacity:0}
  #usiInvite.is-open .usiInvite__card{opacity:1}
}
</style>

<div id="usiInvite" hidden aria-hidden="true" role="dialog" aria-labelledby="usiInviteTitle">
  <div class="usiInvite__scrim" data-usi-dismiss="scrim"></div>
  <div class="usiInvite__card" data-usi-card>
    <div class="usiInvite__core" aria-hidden="true"></div>
    <div class="usiInvite__sweep" aria-hidden="true"></div>
    <div class="usiInvite__handle" data-usi-handle aria-hidden="true"></div>
    <div class="usiInvite__head">
      <p class="usiInvite__eyebrow"><span class="usiInvite__pulse" aria-hidden="true"></span>Open studies</p>
      <button type="button" class="usiInvite__close" data-usi-dismiss="close" aria-label="Close open studies invite">&#10005;</button>
    </div>
    <h2 class="usiInvite__title" id="usiInviteTitle" data-usi-title></h2>
    <p class="usiInvite__sub" data-usi-sub></p>
    <ul class="usiInvite__strata" data-usi-list></ul>
    <div class="usiInvite__actions">
      <button type="button" class="usiInvite__cta" data-usi-go>
        <span data-usi-golabel>Browse open studies</span>
        <span aria-hidden="true">&#8594;</span>
      </button>
      <button type="button" class="usiInvite__ghost" data-usi-dismiss="notnow">Not now</button>
    </div>
  </div>
</div>

<script id="usiInviteJs">
(function () {
  'use strict';

  /* SEAM:STUDY_INVITE
     Invites an approved, signed-in user on the hub to browse open MINE studies.
     Data comes from the existing public GET /mine/studies (real live rows only).
     Approval comes from GET /whoami (SEAM:APPROVAL, DB truth). Real-stats law:
     zero open studies means the invite never renders. Never load bearing:
     every failure path goes dark, none of them throw into the app. */

  var CFG = {
    apiBase: (window.UNSURFACED_API || 'https://api.unsurfaced-intelligence.com'),
    endpoint: '/mine/studies',
    whoami: '/whoami',
    hubSelector: '#uai-hub',
    gateSelector: '#login-gate',
    delayMs: 1500,
    snoozeHours: 24,
    maxRows: 3,
    collapseAfterPx: 380,
    swipeClosePx: 78
  };

  if (window.__USI_INVITE_CFG) {
    for (var k in window.__USI_INVITE_CFG) {
      if (Object.prototype.hasOwnProperty.call(window.__USI_INVITE_CFG, k)) {
        CFG[k] = window.__USI_INVITE_CFG[k];
      }
    }
  }

  var root = document.getElementById('usiInvite');
  if (!root) return;

  var card = root.querySelector('[data-usi-card]');
  var titleEl = root.querySelector('[data-usi-title]');
  var subEl = root.querySelector('[data-usi-sub]');
  var listEl = root.querySelector('[data-usi-list]');
  var SNOOZE_KEY = 'usi.invite.snoozed';
  var opened = false;
  var settled = false;   /* terminal: shown once, pending user, or hard failure */
  var checking = false;
  var lastFocus = null;
  var hubNode = null;
  var observer = null;

  /* ---- storage shim: localStorage where allowed, memory otherwise ---- */
  var mem = {};
  var Store = {
    get: function (k) {
      try { return window.localStorage.getItem(k); } catch (e) { return mem[k] || null; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, v); } catch (e) { mem[k] = v; }
    }
  };

  function snoozed() {
    var raw = Store.get(SNOOZE_KEY);
    if (!raw) return false;
    var until = parseInt(raw, 10);
    return !isNaN(until) && Date.now() < until;
  }
  function snooze() {
    Store.set(SNOOZE_KEY, String(Date.now() + CFG.snoozeHours * 3600 * 1000));
  }

  /* ---- visibility ---- */
  /* The hub is position:fixed, so offsetParent is null even when shown.
     getClientRects is the real test; the style walk backs it up in
     environments that do not run layout. */
  function visible(node) {
    if (!node) return false;
    if (typeof node.getClientRects === 'function' && node.getClientRects().length > 0) return true;
    if (node.offsetParent) return true;
    var el = node;
    while (el && el.nodeType === 1) {
      if (el.hasAttribute('hidden')) return false;
      var cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
      el = el.parentElement;
    }
    return true;
  }

  function hub() {
    if (!hubNode || !hubNode.isConnected) hubNode = document.querySelector(CFG.hubSelector);
    return hubNode;
  }
  function onHub() {
    var h = hub();
    if (!h) return false;
    if (h.classList && !h.classList.contains('show')) return false;
    return visible(h);
  }
  function gateUp() {
    var g = document.querySelector(CFG.gateSelector);
    return g ? visible(g) : false;
  }

  /* ---- auth and approval ---- */
  function token() {
    if (typeof window.usiAuthToken === 'function') {
      return Promise.resolve().then(window.usiAuthToken).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  function approved() {
    /* QA fixture bypass: preview only, production never sets the fixture */
    if (window.__USI_INVITE_FIXTURE) return Promise.resolve('yes');
    if (window._signedOut === true) return Promise.resolve('later');
    return token().then(function (t) {
      if (!t) return 'later';   /* not signed in yet, keep watching */
      return fetch(CFG.apiBase + CFG.whoami, {
        headers: { 'authorization': 'Bearer ' + t, 'accept': 'application/json' }
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (j && j.approved === true) return 'yes';
          if (j) return 'no';   /* pending or rejected: stop asking this session */
          return 'no';
        })
        .catch(function () { return 'no'; });
    });
  }

  /* ---- data ---- */
  function money(cents) {
    if (typeof cents !== 'number' || cents <= 0) return null;
    return (cents % 100 === 0) ? ('$' + (cents / 100)) : ('$' + (cents / 100).toFixed(2));
  }

  function normalize(payload) {
    var raw = [];
    if (payload && Array.isArray(payload.studies)) raw = payload.studies;
    else if (Array.isArray(payload)) raw = payload;
    else if (payload && Array.isArray(payload.data)) raw = payload.data;

    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i] || {};
      if (!s.title) continue;                 /* never invent a title */
      out.push({
        id: s.id != null ? String(s.id) : null,
        title: String(s.title),
        type: s.type ? String(s.type) : null,
        reward: money(s.pay_cents)
      });
    }
    return out;
  }

  function load() {
    if (window.__USI_INVITE_FIXTURE) {
      return Promise.resolve(normalize(window.__USI_INVITE_FIXTURE));
    }
    /* /mine/studies is public by design (share pages, guest links). No auth. */
    return fetch(CFG.apiBase + CFG.endpoint, { headers: { 'accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(normalize)
      .catch(function () { return []; });
  }

  /* ---- render ---- */
  function meta(s) {
    var bits = [];
    if (s.type) bits.push(s.type);
    if (s.reward) bits.push(s.reward);
    return bits.join('  /  ');
  }

  function countUp(n) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var span = titleEl.querySelector('[data-usi-count]');
    if (!span) return;
    if (reduce || n <= 1) { span.textContent = String(n); return; }
    var start = null, dur = 620;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      span.textContent = String(Math.max(1, Math.round(eased * n)));
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function render(studies) {
    var n = studies.length;

    titleEl.innerHTML = '';
    var num = document.createElement('span');
    num.className = 'usiInvite__count';
    num.setAttribute('data-usi-count', '');
    num.textContent = '0';
    titleEl.appendChild(num);
    titleEl.appendChild(document.createTextNode(
      n === 1 ? ' study is open right now.' : ' studies are open right now.'
    ));

    subEl.textContent = n === 1
      ? 'Real answers from real people. See the brief and the reward before you commit a minute.'
      : 'Real answers from real people. See each brief and reward before you commit a minute.';

    listEl.innerHTML = '';
    var rows = studies.slice(0, CFG.maxRows);
    for (var i = 0; i < rows.length; i++) {
      var li = document.createElement('li');
      li.className = 'usiInvite__row';
      li.style.animationDelay = (0.42 + i * 0.09) + 's';

      var tick = document.createElement('span');
      tick.className = 'usiInvite__tick';
      tick.setAttribute('aria-hidden', 'true');

      var t = document.createElement('span');
      t.className = 'usiInvite__rowTitle';
      t.textContent = rows[i].title;

      li.appendChild(tick);
      li.appendChild(t);

      var m = meta(rows[i]);
      if (m) {
        var mm = document.createElement('span');
        mm.className = 'usiInvite__rowMeta';
        mm.textContent = m;
        li.appendChild(mm);
      }
      listEl.appendChild(li);
    }

    var more = n - rows.length;
    var label = root.querySelector('[data-usi-golabel]');
    if (label) label.textContent = more > 0 ? ('Browse all ' + n) : 'Browse open studies';

    return n;
  }

  /* ---- open / close ---- */
  function onHubScroll() {
    if (!opened) return;
    var h = hub();
    if (!h) return;
    root.classList.toggle('is-min', (h.scrollTop || 0) > CFG.collapseAfterPx);
  }

  function open(n) {
    if (opened) return;
    opened = true;
    settled = true;
    lastFocus = document.activeElement;

    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(function () {
      card.style.setProperty('--usi-sweepH', card.offsetHeight + 'px');
      window.requestAnimationFrame(function () {
        root.classList.add('is-open');
        countUp(n);
        var closeBtn = root.querySelector('[data-usi-dismiss="close"]');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
      });
    });

    document.addEventListener('keydown', onKey);
    var h = hub();
    if (h) h.addEventListener('scroll', onHubScroll, { passive: true });
    watchHubWhileOpen();
  }

  function close(reason) {
    if (!opened) return;
    opened = false;
    root.classList.remove('is-open', 'is-min', 'is-dragging');
    card.style.transform = '';
    root.setAttribute('aria-hidden', 'true');
    if (reason !== 'go') snooze();

    document.removeEventListener('keydown', onKey);
    var h = hub();
    if (h) h.removeEventListener('scroll', onHubScroll);
    stopObserving();

    window.setTimeout(function () { root.hidden = true; }, 460);
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
    if (typeof window.logEvent === 'function') {
      try { window.logEvent('study_invite_dismissed', { reason: reason }); } catch (e) {}
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close('escape'); }
  }

  /* ---- arming ----
     The hub is an SPA panel behind a login gate. At load it may be hidden, or
     shown to a signed-out visitor (SEAM:DOOR_GATE). One observer watches the
     hub and the gate; every relevant mutation re-runs the attempt. Once open,
     the same observer closes the invite if the person enters a space. */
  function stopObserving() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  function watchTargets() {
    if (typeof MutationObserver !== 'function') return;
    stopObserving();
    observer = new MutationObserver(function () {
      if (opened) {
        if (!onHub()) close('navigated');
        return;
      }
      attempt();
    });
    var h = hub();
    var g = document.querySelector(CFG.gateSelector);
    if (h) observer.observe(h, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'] });
    if (g) observer.observe(g, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden', 'hidden'] });
    if (!h && !g) observer.observe(document.body, { childList: true, subtree: false });
  }
  function watchHubWhileOpen() { watchTargets(); }

  var attemptTimer = null;
  function attempt() {
    if (settled || opened || checking) return;
    if (snoozed()) { settled = true; stopObserving(); return; }
    if (!onHub() || gateUp()) return;   /* keep watching */

    checking = true;
    approved().then(function (verdict) {
      checking = false;
      if (verdict === 'later') return;                 /* not signed in yet */
      if (verdict !== 'yes') { settled = true; stopObserving(); return; }
      return load().then(function (studies) {
        if (settled || opened) return;
        if (!studies.length) { settled = true; stopObserving(); return; }
        if (!onHub() || gateUp()) return;
        var n = render(studies);
        if (attemptTimer) window.clearTimeout(attemptTimer);
        attemptTimer = window.setTimeout(function () {
          if (!settled && !opened && onHub() && !gateUp()) open(n);
        }, CFG.delayMs);
      });
    }).catch(function () { checking = false; });
  }

  /* ---- interactions ---- */
  root.addEventListener('click', function (e) {
    var d = e.target.closest ? e.target.closest('[data-usi-dismiss]') : null;
    if (d) { close(d.getAttribute('data-usi-dismiss')); return; }
    if (e.target.closest && e.target.closest('[data-usi-go]')) {
      close('go');
      if (typeof window.logEvent === 'function') {
        try { window.logEvent('study_invite_accepted', {}); } catch (err) {}
      }
      if (typeof window.usiGoToStudies === 'function') { window.usiGoToStudies(); return; }
      if (typeof window.openStudyBoard === 'function') { try { window.openStudyBoard(); return; } catch (err) {} }
      if (typeof window.enterSpace === 'function') { try { window.enterSpace('mine'); } catch (err) {} }
      return;
    }
    if (root.classList.contains('is-min') && e.target.closest && e.target.closest('[data-usi-card]')) {
      root.classList.remove('is-min');
    }
  });

  /* swipe down to dismiss on touch */
  (function swipe() {
    var startY = 0, dy = 0, active = false;
    card.addEventListener('touchstart', function (e) {
      if (window.innerWidth > 860) return;
      if (e.target.closest && e.target.closest('button')) return;
      active = true; dy = 0;
      startY = e.touches[0].clientY;
      root.classList.add('is-dragging');
    }, { passive: true });
    card.addEventListener('touchmove', function (e) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) dy = 0;
      card.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    card.addEventListener('touchend', function () {
      if (!active) return;
      active = false;
      root.classList.remove('is-dragging');
      card.style.transform = '';
      if (dy > CFG.swipeClosePx) close('swipe');
    });
  })();

  /* ---- boot ---- */
  function boot() {
    if (snoozed()) return;
    watchTargets();
    attempt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.usiInvite = {
    open: attempt,
    close: close,
    reset: function () {
      Store.set(SNOOZE_KEY, '0');
      opened = false; settled = false; checking = false;
      root.classList.remove('is-open', 'is-min');
      root.hidden = true;
      boot();
    }
  };
})();
</script>
<!-- /SEAM:STUDY_INVITE -->
"""


def main():
    if not os.path.exists(TARGET):
        print("FAIL target missing:", TARGET)
        return 1

    with io.open(TARGET, "r", encoding="utf-8") as f:
        s = f.read()

    print("RECON chars (utf-8 decoded):", len(s))

    # --- idempotence ---
    if SEAM in s:
        print("FAIL seam already present, nothing to do")
        return 1

    # --- anchor recon: assert before any cut ---
    anchor = "</body>"
    n = s.count(anchor)
    print("RECON anchor '%s' occurrences: %d" % (anchor, n))
    if n < 1:
        print("FAIL no </body> anchor")
        return 1
    at = s.rindex(anchor)
    print("RECON cut index:", at)

    # --- id collision recon ---
    for probe in ('id="usiInvite"', 'id="usiInviteCss"', 'id="usiInviteJs"'):
        c = s.count(probe)
        print("RECON id '%s' existing occurrences: %d" % (probe, c))
        if c:
            print("FAIL id collision, rename before injecting")
            return 1

    # --- smart glyph scan on the payload ---
    bad = {"\u201c": 0, "\u201d": 0, "\u2018": 0, "\u2019": 0,
           "\u2014": 0, "\u2013": 0, "\u2026": 0, "\u00a0": 0}
    hits = {k: BLOCK.count(k) for k in bad if BLOCK.count(k)}
    if hits:
        print("FAIL smart-glyph scan on payload:", hits)
        return 1
    print("PASS smart-glyph scan on payload")

    out = s[:at] + BLOCK + "\n" + s[at:]

    with io.open(TARGET, "w", encoding="utf-8") as f:
        f.write(out)

    print("PASS injected", len(BLOCK), "bytes")
    print("PASS new size:", len(out))
    print("NEXT node --check the new script block, then python3 tools/ritual_gate.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
