/**
 * proof_measure_entities.mjs  --  EX52b THE ENTITIES, arc 2: the measure counts the links; a first-time name is added and backfilled
 * alone before it is counted; coverage is said while the window is not whole; the ilike measure is gone.
 * Run from the repo root: node worker/proofs/proof_measure_entities.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const rpage = fs.readFileSync('intelligence/read/index.html', 'utf-8');   // RP1: the printed measure lives on the read page's paper
const sql = fs.readFileSync('supabase/migrations/0053_entity_measure.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };

// ── the slice: the graph's pure parts and the measure block, with the lake faked ──────────────────────────
const graphPure = between(w, 'const ENTITY = {', 'async function entitySeed(');
const measure = between(w, 'const ENTITY_MEASURE = {', 'function excMeasureLine(m) {');
const day = 864e5, now = Date.UTC(2026, 9, 29, 18, 0, 0);
let calls = [], kv = new Map(), entities = [{ id: 'e1', name: 'Costco', aliases: ['Kirkland'], resolved_from: null }], state = [{ k: 'backfill', v: { done: true } }];
let counts = { e1: [{ signal_id: 's1', captured_at: new Date(now - day).toISOString(), title: 'Costco shoppers', url: 'https://r/1', source_name: 'Reuters', source_tier: 1, territory: 'business-economics', published_at: null, research: false }, { signal_id: 's2', captured_at: new Date(now - 2 * day).toISOString(), title: 'Kirkland', url: 'https://x/2', source_name: 'Blog', source_tier: 3, territory: null, published_at: null, research: true }] };
let sweep = '';
const sbRest = async (env, path, opts) => {
  calls.push({ path, body: opts && opts.body });
  if (/^entities\?active=eq\.true/.test(path)) return entities;
  if (path === 'entities' && opts && opts.method === 'POST') { const row = Object.assign({ id: 'e' + (entities.length + 1) }, opts.body); entities.push({ id: row.id, name: row.name, aliases: row.aliases, resolved_from: row.resolved_from }); return [row]; }
  if (path === 'rpc/resolve_signal_entities') return [{ signals_seen: 10, links_made: 3, entities_run: 1 }];
  if (path === 'rpc/entity_counts') return counts[opts.body.p_entity] || [];
  if (/^entity_resolve_state/.test(path)) return state;
  if (/^signals\?/.test(path)) return [];
  throw new Error('unexpected path ' + path);
};
const env = { RATE_LIMIT: { get: async k => kv.has(k) ? kv.get(k) : null, put: async (k, v) => { kv.set(k, v); }, delete: async k => { kv.delete(k); } } };
const M = new Function('sbRest', 'excQuiet', 'EXC_MEASURE', 'sweepOnly', 'excTerritoryOf', 'excMeasureFrom', 'entityStateGet', 'console',
  graphPure + measure + '; return { ENTITY_MEASURE, entityMap, entityResolveName, entityRows, entityCoverage, excMeasures };')(
  sbRest, (where, v) => e => v, { WEEKS: 12, ROWS: 1500, TERR_ROWS: 3000 }, async () => sweep, f => (f && f.category === 'retail' ? 'business-economics' : null),
  (rows, terrRows, nowMs, hint) => ({ weeks: 12, series: Array.from({ length: 12 }, () => 0), recent_7d: rows.length, prior_7d: 0, velocity_pct: null, outlets: new Set(rows.map(r => r.source_name)).size, weeks_touched: rows.length ? 1 : 0, territory: hint || null, territory_agree: true, newest: null, state: 'STEADY', shape: null, n: rows.length }),
  async () => { const st = {}; for (const r of state) st[r.k] = r.v; return st; }, { log: () => {} });

// ── C: coverage ───────────────────────────────────────────────────────
const c1 = M.entityCoverage(new Date(now - 21 * day).toISOString(), null, now, 12);
ok(c1.coverage_weeks === 3 && c1.measured_from === new Date(now - 21 * day).toISOString().slice(0, 10), 'C1 an entity backfilled alone three weeks ago is counted from then: 3 of 12 weeks');
const c2 = M.entityCoverage(null, { done: false, at: new Date(now - 84 * day + 14 * day).toISOString(), until: new Date(now - 7 * day).toISOString() }, now, 12);
ok(c2.coverage_weeks === 3 && c2.measured_from === new Date(now - 7 * day).toISOString().slice(0, 10) && Array.isArray(c2.gap) && c2.gap.length === 2, 'C2 while the shared backfill walks, the window is counted at both ends (two older weeks, one recent) with the gap named');
ok(M.entityCoverage(null, { done: true }, now, 12).coverage_weeks === 12 && M.entityCoverage(null, null, now, 12).coverage_weeks === 12 && M.entityCoverage(new Date(now - 400 * day).toISOString(), null, now, 12).coverage_weeks === 12, 'C3 a finished backfill, no backfill at all, or a resolved_from older than the window: the whole window');

// ── E: the measure on the links ───────────────────────────────────────
calls = []; kv.clear();
const m1 = await M.excMeasures(env, { entity: 'Costco', category: 'retail', competitors: [] });
ok(m1 && m1.entity_id === 'e1' && m1.entity === 'Costco' && m1.anchors.join() === 'Costco' && m1.recent_7d === 2 && m1.coverage_weeks === 12 && m1.measured_from, 'E1 a known entity is counted from its links; the measure names the entity and the window it covers');
ok(!calls.some(c => /^signals\?.*title\.ilike/.test(c.path)) && calls.some(c => c.path === 'rpc/entity_counts' && c.body.p_entity === 'e1'), 'E2 no headline is matched by its letters: the rows come from the links');
calls = [];
const m1b = await M.excMeasures(env, { entity: 'kirkland', category: 'retail' });
ok(m1b && m1b.entity_id === 'e1' && !calls.some(c => /^entities\?active/.test(c.path)), 'E3 an alias resolves to the same entity, from the cached map, with no second read of the graph');
sweep = '&research=is.false'; calls = [];
const m1c = await M.excMeasures(env, { entity: 'Costco', category: 'retail' });
ok(m1c.recent_7d === 1 && m1c.sweep === true, 'E4 under the sweep rule a research row is not counted');
sweep = '';
ok((await M.excMeasures(env, { entity: '', category: 'retail' })) === null && (await M.excMeasures(env, { entity: 'LG' })) === null && (await M.excMeasures(env, null)) === null, 'E5 a frame with no entity, or a two-letter one, has no measure: never zeros');
calls = []; kv.clear();
const m2 = await M.excMeasures(env, { entity: 'Walmart', category: 'retail', competitors: ['Costco', 'Walmart', 'Target'] });
const made = calls.find(c => c.path === 'entities' && c.body && c.body.name === 'Walmart'), bf = calls.find(c => c.path === 'rpc/resolve_signal_entities');
ok(!!(made && made.body.resolved_from && made.body.from_src === 'frame' && made.body.category === 'retail' && bf), 'E6 a name the graph lacks is added from the frame and backfilled alone over the window before it is counted');
ok(bf && entities.find(e => e.name === 'Walmart') && bf.body.p_entity === entities.find(e => e.name === 'Walmart').id && m2.coverage_weeks === 12 && m2.recent_7d === 0, 'E7 the lone backfill names the new entity; it is counted at once over the whole window, zero stories being a measured zero');
ok(Array.isArray(m2.competitors) && m2.competitors.map(c => c.name).join() === 'Costco,Target' && m2.competitors[0].recent_7d === 2 && entities.find(e => e.name === 'Target'), 'E8 the competitive set is counted the same way; the entity never competes with itself; a new competitor joins the graph too');
ok(!kv.has('ent:map:v1') || JSON.parse(kv.get('ent:map:v1')).walmart, 'E9 adding a name drops the cached map, so the next read sees it');

// ── L: the writer's line ──────────────────────────────────────────────
const L = new Function(between(w, 'function excMeasureLine(m) {', '/* PURE: the lines of a compiled reading that name the measure') + '; return excMeasureLine;')();
const base = { series: [], weeks: 12, recent_7d: 3, prior_7d: 4, outlets: 2, weeks_touched: 2, state: 'STEADY', shape: null };
ok(/Coverage: counted from 2026-10-22, 1 of 12 weeks; the earlier weeks are not counted yet/.test(L(Object.assign({}, base, { coverage_weeks: 1, measured_from: '2026-10-22' }))) && !/Coverage:/.test(L(Object.assign({}, base, { coverage_weeks: 12, measured_from: '2026-08-06' }))), 'L1 the MEASURES line says the coverage while the window is not whole, and nothing when it is');
ok(/Coverage: counted from/.test(L(Object.assign({}, base, { recent_7d: 0, coverage_weeks: 2, measured_from: '2026-10-15' }))), 'L2 the quiet week says it too');
ok(!/ilikeOr\(anchors\)/.test(between(w, 'async function excMeasures(', 'function excMeasureLine(')), 'L3 the ilike measure is gone from excMeasures');

// ── P: the page ───────────────────────────────────────────────────────
const F = new Function(between(page, 'function _measuredFrom(m) {', 'function _recMeasureLine(m) {') + '; return _measuredFrom;')();
ok(F({ coverage_weeks: 12, weeks: 12 }) === '' && F(null) === '' && F({ recent_7d: 2 }) === '', 'P1 a whole window says nothing');
ok(F({ coverage_weeks: 3, weeks: 12, measured_from: '2026-10-08' }) === 'measured from Oct 8, 3 of 12 weeks counted', 'P2 a partial window says from when and how many weeks');
ok(/if \(_measuredFrom\(m\)\) bits\.push\(safe\(_measuredFrom\(m\)\)\);/.test(between(page, 'function _recMeasureLine(m) {', 'function _recFoot(')) && /if \(_measuredFrom\(m\)\) bits\.push\(`<span>\$\{safe\(_measuredFrom\(m\)\)\}<\/span>`\);/.test(between(page, 'function _doorMeasureRow(m, since) {', '\n}\n')), 'P3 the record tile line and the door tile row carry it');
ok(/weeks of coverage on this frame\$\{_measuredFrom\(ms\)\?' <span class="dot">&middot;<\/span> '\+n\(_measuredFrom\(ms\)\):''\}<\/span>/.test(page) && /"Counted from " \+ H\.fmtDate\(m\.measured_from\) \+ ": " \+ m\.coverage_weeks \+ " of " \+ m\.weeks \+ " weeks/.test(rpage), 'P4 the read block\'s caption and the printed measure page carry it (RP1: the paper is the read page\'s)');

// ── S: the migration ──────────────────────────────────────────────────
ok(/alter table public\.entities add column if not exists resolved_from timestamptz;/.test(sql) && /drop function if exists public\.resolve_signal_entities\(timestamptz, timestamptz\);/.test(sql) && /p_entity uuid default null\)/.test(sql) && /where active and \(p_entity is null or id = p_entity\)/.test(sql), 'S1 resolved_from on the entity; the resolver takes an optional entity and the two-argument form is dropped so the API has one signature');
console.log(`\nproof_measure_entities: ${pass} checks passed`);
