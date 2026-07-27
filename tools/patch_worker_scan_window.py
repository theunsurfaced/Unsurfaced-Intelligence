#!/usr/bin/env python3
# patch_worker_scan_window.py — date-honest recurrence scan.
# Applies ON TOP of patch_worker_field_state.py. Target: worker/src/index.js
#
# The bug, measured live: DAILY captures ~400 signals/day, so newest-800 under
# a "60-day" filter actually covered ~48 hours (top candidate span Jul 25-27).
# Recurrence over a two-day slice can never touch two week-epochs — the engine
# was structurally blind, not patient. Fix: slice the window into RECUR.SLICES
# equal spans fetched in parallel, bounded rows per slice, so every week of the
# window is represented instead of only the loudest 48 hours.

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

# ── S1: constants + the sliced fetch helper, beside RECUR ───────────────────
rep(
"const RECUR = { WINDOW_D: 60, SCAN: 800, MIN_WEEKS: 2, TOP: 12 };",
"""const RECUR = { WINDOW_D: 60, SCAN: 800, MIN_WEEKS: 2, TOP: 12,
  SLICES: 10, SLICE_ROWS: 120 };

/* SEAM:FIELD_STATE amendment — the date-honest scan. A single newest-first
 * fetch under a date filter is a lie at volume: at ~400 captures/day the 800
 * newest rows of a "60-day" window span two days, and recurrence over two
 * days is structurally zero. This fetches RECUR.SLICES equal spans of the
 * window in parallel, RECUR.SLICE_ROWS per slice (10 x 120 = 1200 rows,
 * every week represented). A failed slice contributes [] rather than killing
 * the scan — a thin week is data, a dead fetch is not. */
async function fetchRecurrenceRows(env, days, territory) {
  const nowMs = Date.now();
  const sliceMs = (days * 864e5) / RECUR.SLICES;
  const base = 'signals?status=in.(connected,published)&cluster_id=not.is.null' +
    (territory ? '&territory=eq.' + territory : '') +
    '&order=captured_at.desc&limit=' + RECUR.SLICE_ROWS +
    '&select=id,cluster_id,title,url,source_name,source_tier,territory,status,captured_at,edition_item_id';
  const fetches = [];
  for (let i = 0; i < RECUR.SLICES; i++) {
    const hi = new Date(nowMs - i * sliceMs).toISOString();
    const lo = new Date(nowMs - (i + 1) * sliceMs).toISOString();
    fetches.push(sbRest(env, base + '&captured_at=gte.' + lo + '&captured_at=lt.' + hi)
      .catch(function () { return []; }));
  }
  const slices = await Promise.all(fetches);
  const rows = [];
  for (const sl of slices) if (Array.isArray(sl)) rows.push.apply(rows, sl);
  return rows;
}""",
'S1 RECUR slices + fetchRecurrenceRows')

# ── S2: PROPOSE reads through the sliced scan ───────────────────────────────
rep(
"""    const since = new Date(Date.now() - days * 864e5).toISOString();
    const rows = await sbRest(env, 'signals?status=in.(connected,published)&cluster_id=not.is.null' +
      '&captured_at=gte.' + since + '&order=captured_at.desc&limit=' + RECUR.SCAN +
      '&select=id,cluster_id,title,url,source_name,source_tier,territory,status,captured_at,edition_item_id') || [];

    const ranked = recurrenceRollup(rows, 64, minWeeks);""",
"""    const rows = await fetchRecurrenceRows(env, days, null);

    const ranked = recurrenceRollup(rows, 64, minWeeks);""",
'S2 PROPOSE sliced scan')

# ── S3: RECURRENCE reads through the same door ──────────────────────────────
rep(
"""    const since = new Date(Date.now() - days * 864e5).toISOString();
    const q = 'signals?status=in.(connected,published)&cluster_id=not.is.null' +
      '&captured_at=gte.' + since + (territory ? '&territory=eq.' + territory : '') +
      '&order=captured_at.desc&limit=' + RECUR.SCAN +
      '&select=id,cluster_id,title,url,source_name,source_tier,territory,status,captured_at,edition_item_id';
    const rows = await sbRest(env, q) || [];
    const themes = recurrenceRollup(rows, top);""",
"""    const rows = await fetchRecurrenceRows(env, days, territory);
    const themes = recurrenceRollup(rows, top);""",
'S3 RECURRENCE sliced scan')

# ── S4: PROPOSE cache key v2 -> v3 (scan semantics changed) ─────────────────
rep(
"  const ck = 'prop:v2:' + days + ':' + want + ':' + minWeeks;",
"  const ck = 'prop:v3:' + days + ':' + want + ':' + minWeeks;",
'S4 cache key v3')

assert s != orig, 'nothing changed'
io.open(PATH, 'w', encoding='utf-8').write(s)
print(f'WROTE {PATH} ({len(s)} chars)')
