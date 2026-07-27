#!/usr/bin/env python3
# patch_intelligence_arrival.py — FIELD STATE arc, arrival side.
# Target: intelligence/index.html
# The law of this patch: the 32-topic pool remains the cold-start floor.
# Below 4 proposed lake cards, nothing here fires and the page behaves
# exactly as it does today. Every replacement: assert count == 1.

import sys, io, os

PATH = os.environ.get('PAGE_PATH', 'intelligence/index.html')
s = io.open(PATH, encoding='utf-8').read()
orig = s

def rep(old, new, tag):
    global s
    n = s.count(old)
    assert n == 1, f'ANCHOR FAIL [{tag}]: count={n} (expected 1)'
    s = s.replace(old, new)
    print(f'  OK  {tag}')

# ── F1: CSS — field read, state strip, state tags, receipts ─────────────────
rep(
"/* ── LIVING FEATURED INSIGHTS ───────────────────────────────── */",
"""/* ── LIVING FEATURED INSIGHTS ───────────────────────────────── */
/* SEAM:ARRIVAL_LIVE — field-read + state-strip chrome. Instrument panel over
   a dig site: Space Mono, numbers visible, state color as the only signal. */
.fi-field-read{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;line-height:1.45;color:var(--text,#FAF7F2);margin:0 0 6px;max-width:820px}
.fi-field-read .fi-read-label{display:block;font-family:'Space Mono',monospace;font-weight:400;font-size:9px;letter-spacing:.16em;color:var(--red,#FF3333);margin-bottom:6px}
.fi-state-strip{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px}
.fi-state-chip{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.12em;padding:5px 11px;border:1px solid var(--text3,#545268);border-radius:2px;cursor:pointer;color:var(--text2,#8988A0);background:transparent;text-transform:uppercase;user-select:none}
.fi-state-chip .fi-chip-n{margin-left:6px;opacity:.7}
.fi-state-chip.active{border-color:var(--red,#FF3333);color:var(--red,#FF3333)}
.fi-state-chip.dim{opacity:.35;cursor:default}
.fi-state-tag{position:absolute;top:12px;right:14px;font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.14em;padding:3px 8px;border-radius:2px;border:1px solid currentColor}
.fi-state-tag.st-emerging{color:var(--accent3,#5AC8F5)}
.fi-state-tag.st-accelerating{color:var(--red,#FF3333)}
.fi-state-tag.st-structural{color:var(--accent2,#B48CFF)}
.fi-state-tag.st-cooling{color:var(--text3,#545268)}
.fi-state-tag.st-contested{color:var(--accent4,#F55A8C)}
.fi-state-tag.st-steady{color:var(--text2,#8988A0)}
.fi-receipts{font-family:'Space Mono',monospace;font-size:9px;color:var(--text3,#545268);letter-spacing:.08em;margin:2px 0 8px;text-transform:uppercase}""",
'F1 css')

# ── F2: markup — read + strip mounts above the grid ─────────────────────────
rep(
"""    <!-- 8-card living insights grid: 2 per lens, refreshes every 24h -->
    <div class="insights-grid" id="featured-insights-grid">""",
"""    <!-- SEAM:ARRIVAL_LIVE — the read and the state strip mount here when the
         lake carries the grid; both stay hidden on the pool path. -->
    <div class="fi-field-read" id="fi-field-read" style="display:none"></div>
    <div class="fi-state-strip" id="fi-state-strip" style="display:none"></div>
    <!-- 8-card living insights grid: 2 per lens, refreshes every 24h -->
    <div class="insights-grid" id="featured-insights-grid">""",
'F2 markup mounts')

# ── F3: cache key bump + lake globals ───────────────────────────────────────
rep(
"const _FI_CACHE_KEY  = 'unsurfaced_fi_v2';",
"""const _FI_CACHE_KEY  = 'unsurfaced_fi_v3'; // v3: cache may carry a lake field read
let   _FI_LAKE        = null;   // live PROPOSE payload when the lake owns the grid
let   _fiStateFilter  = null;   // active state-strip filter, null = all
const _FI_LAKE_MIN    = 4;      // cold-start law: below this many proposed cards, pool paints
const _FI_STATE_META  = {
  EMERGING:     { cls:'st-emerging',     label:'EMERGING' },
  ACCELERATING: { cls:'st-accelerating', label:'ACCELERATING' },
  STRUCTURAL:   { cls:'st-structural',   label:'STRUCTURAL' },
  COOLING:      { cls:'st-cooling',      label:'COOLING' },
  CONTESTED:    { cls:'st-contested',    label:'CONTESTED' },
  STEADY:       { cls:'st-steady',       label:'STEADY' }
};""",
'F3 globals')

# ── F4: openFeaturedCard — lake cards resolve first ─────────────────────────
rep(
"""function openFeaturedCard(id) {
  // Find the card in the pool
  for (const cat of CATS) {""",
"""function openFeaturedCard(id) {
  // Lake cards first — when a live field read owns the grid, its ids win.
  if (_FI_LAKE && Array.isArray(_FI_LAKE.proposed)) {
    const lk = _FI_LAKE.proposed.find(c => c.id === id);
    if (lk) {
      openInsightDashboard({
        title:    lk.subtitle || lk.title,
        cat:      CATS.includes(lk.lens) ? lk.lens : 'culture',
        query:    lk.query || lk.title,
        deck:     lk.deck || '',
        topicKey: lk.id,
      });
      return;
    }
  }
  // Find the card in the pool
  for (const cat of CATS) {""",
'F4 opener lake path')

# ── F5: grid render — lake short-circuit, pool untouched below the floor ────
rep(
"""function _renderFeaturedGrid(isLive) {
  const grid = document.getElementById('featured-insights-grid');
  if (!grid) return;
""",
"""function _renderFeaturedGrid(isLive) {
  const grid = document.getElementById('featured-insights-grid');
  if (!grid) return;

  // SEAM:ARRIVAL_LIVE — when a fresh lake read with enough cards is cached,
  // the grid is the lake's. Otherwise every line below behaves exactly as it
  // did before this seam existed: the pool is the cold-start floor.
  let _lakeC = null;
  try { _lakeC = JSON.parse(localStorage.getItem(_FI_CACHE_KEY) || 'null'); } catch(e) {}
  const _lakeFresh = _lakeC && _lakeC.lake
    && (Date.now() - (_lakeC.fetchedAt || 0)) < _FI_TTL_MS
    && Array.isArray(_lakeC.lake.proposed)
    && _lakeC.lake.proposed.length >= _FI_LAKE_MIN;
  if (_lakeFresh) { _FI_LAKE = _lakeC.lake; _renderLakeGrid(_FI_LAKE); return; }
  _hideFieldChrome();
""",
'F5 grid short-circuit')

# ── F6: refresh guard honors a fresh lake cache ─────────────────────────────
rep(
"  if (!force && cacheAge < _FI_TTL_MS && liveCardCount > 0) return;",
"""  const hasLake = !!(cached && cached.lake && Array.isArray(cached.lake.proposed)
    && cached.lake.proposed.length >= _FI_LAKE_MIN);
  if (!force && cacheAge < _FI_TTL_MS && (liveCardCount > 0 || hasLake)) return;""",
'F6 refresh guard')

# ── F7: refresh — lake first, pool path untouched on fall-through ───────────
rep(
"""  let gotLiveData = false;
  try {
    // Pick 2 topics to fetch live — one from the current day's selection""",
"""  let gotLiveData = false;
  try {
    // SEAM:ARRIVAL_LIVE — lake first. One authed PROPOSE call replaces the
    // whole pool when it clears the floor. Guests, thin lakes, and any error
    // fall through to the pool path below, byte-for-byte the old behavior.
    // The early return rides the finally: _renderFeaturedGrid re-runs and
    // short-circuits into the lake grid.
    const lakeData = await _fetchLakeField();
    if (lakeData) {
      const keepCards = (cached && cached.cards) || {};
      localStorage.setItem(_FI_CACHE_KEY,
        JSON.stringify({ fetchedAt: Date.now(), lake: lakeData, cards: keepCards }));
      gotLiveData = true;
      return;
    }

    // Pick 2 topics to fetch live — one from the current day's selection""",
'F7 lake-first refresh')

# ── F8: lake machinery block before the refresh section ─────────────────────
rep(
"// ── Background refresh logic ──────────────────────────────────────",
"""// ── SEAM:ARRIVAL_LIVE — lake field machinery ─────────────────────
// The arrival stops presenting a corpus and starts answering three questions:
// what is the field doing (the read), where is it moving (the state strip),
// and why believe it (receipts on every card). All of it rides one PROPOSE
// call, cached 24h beside the pool cache it replaces.

async function _fetchLakeField() {
  try {
    const hh = await _authHeader();
    if (!hh.Authorization) return null;               // no session, no lake
    const tout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000));
    const call = fetch(API_BASE.replace(/\\/$/, '') + '/excavate/propose', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, hh),
      body: JSON.stringify({ count: 8 })
    });
    const r = await Promise.race([call, tout]);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || !j.ok || !Array.isArray(j.proposed)) return null;
    if (j.proposed.length < _FI_LAKE_MIN) return null; // cold-start law
    return j;
  } catch(e) { return null; }
}

function _hideFieldChrome() {
  const rd = document.getElementById('fi-field-read');
  const st = document.getElementById('fi-state-strip');
  if (rd) rd.style.display = 'none';
  if (st) st.style.display = 'none';
}

function _setFiStateFilter(stateKey) {
  _fiStateFilter = (_fiStateFilter === stateKey) ? null : stateKey;
  if (_FI_LAKE) _renderLakeGrid(_FI_LAKE);
}

function _renderStateStrip(states) {
  const strip = document.getElementById('fi-state-strip');
  if (!strip) return;
  const order = ['EMERGING', 'ACCELERATING', 'STRUCTURAL', 'COOLING', 'CONTESTED'];
  const chips = ['<span class="fi-state-chip' + (_fiStateFilter === null ? ' active' : '')
    + '" onclick="_setFiStateFilter(null)">ALL</span>'];
  for (const k of order) {
    const n = (states && states[k]) || 0;
    const cls = 'fi-state-chip' + (_fiStateFilter === k ? ' active' : '') + (n === 0 ? ' dim' : '');
    const click = n === 0 ? '' : ` onclick="_setFiStateFilter('${k}')"`;
    chips.push(`<span class="${cls}"${click}>${_FI_STATE_META[k].label}<span class="fi-chip-n">${n}</span></span>`);
  }
  strip.innerHTML = chips.join('');
  strip.style.display = 'flex';
}

function _renderLakeCard(card, i) {
  const lens  = CATS.includes(card.lens) ? card.lens : 'culture';
  const meta  = _FI_STATE_META[card.state] || _FI_STATE_META.STEADY;
  const ev    = card.evidence || {};
  const first = ev.first_seen ? new Date(ev.first_seen)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : null;
  const bits  = [];
  if (ev.sources)        bits.push(ev.sources + ' SRC');
  if (ev.weeks_touched)  bits.push(ev.weeks_touched + 'W');
  if (ev.members)        bits.push(ev.members + ' SIGNALS');
  if (first)             bits.push('FIRST ' + first);
  if (card.shape)        bits.push(String(card.shape).toUpperCase());
  const delay = i * 0.06;
  return `
    <div class="insight-card fi-card-enter" style="animation-delay:${delay}s;position:relative" onclick="openFeaturedCard('${card.id}')">
      <span class="fi-state-tag ${meta.cls}">${meta.label}</span>
      <span class="card-cat ${lens}">● ${CAT_LABELS[lens]}</span>
      <h2 class="card-title">${card.title}</h2>
      <p style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">${card.subtitle || ''}</p>
      <p class="card-excerpt">${card.hook || card.deck || ''}</p>
      <div class="fi-receipts">${bits.join(' · ')}</div>
      <div class="card-meta">
        <span class="card-stat">${card.stat || ''}</span>
        <span style="color:var(--text3)">Click for full dashboard →</span>
      </div>
      ${card.bar != null ? `<div class="card-bar"><div class="card-bar-fill" style="width:${card.bar}%"></div></div>` : ''}
    </div>`;
}

function _renderLakeGrid(data) {
  const grid = document.getElementById('featured-insights-grid');
  if (!grid) return;
  const read = data.field && data.field.read;
  const rd = document.getElementById('fi-field-read');
  if (rd) {
    if (read) {
      rd.innerHTML = '<span class="fi-read-label">THE READ · FROM THE LAKE</span>'
        + String(read).replace(/</g, '&lt;');
      rd.style.display = 'block';
    } else rd.style.display = 'none';
  }
  _renderStateStrip((data.field && data.field.states) || {});
  let cards = data.proposed || [];
  if (_fiStateFilter) {
    const hit = cards.filter(c => c.state === _fiStateFilter);
    if (hit.length) cards = hit;   // an empty filter never blanks the grid
  }
  grid.innerHTML = cards.map((c, i) => _renderLakeCard(c, i)).join('');
  const badge = document.getElementById('fi-live-badge');
  const label = document.getElementById('fi-refresh-label');
  if (badge) badge.style.display = 'inline-flex';
  if (label) {
    let cachedAt = 0;
    try { cachedAt = (JSON.parse(localStorage.getItem(_FI_CACHE_KEY) || '{}').fetchedAt) || 0; } catch(e) {}
    const h = cachedAt ? Math.floor((Date.now() - cachedAt) / 3600000) : 0;
    label.textContent = 'FIELD READ · ' + (h === 0 ? 'UPDATED JUST NOW' : 'UPDATED ' + h + 'H AGO');
  }
}

// ── Background refresh logic ──────────────────────────────────────""",
'F8 lake machinery')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} bytes)')
