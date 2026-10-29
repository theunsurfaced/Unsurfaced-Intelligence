/**
 * proof_entities.mjs  --  EX52b THE ENTITIES, arc 1: the graph seeded from what the house knows, the resolver on the half hour,
 * the backfill a step a slice, the watch line. The SQL itself was run on Postgres 16 (Oct 29); here its shape is held.
 * Run from the repo root: node worker/proofs/proof_entities.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0052_entities.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };

// ── S: the migration ──────────────────────────────────────────────────
ok(/create table if not exists public\.entities \(/.test(sql) && /create unique index if not exists entities_name_uq on public\.entities \(lower\(name\)\)/.test(sql) && /context text\[\] not null default '\{\}'::text\[\]/.test(sql) && /ambiguous boolean not null default false/.test(sql), 'S1 an entity is one row per name, case-blind, with aliases, a category, context words and the ambiguous flag');
ok(/create table if not exists public\.signal_entities \(/.test(sql) && /captured_at timestamptz not null,/.test(sql) && /primary key \(signal_id, entity_id\)/.test(sql) && /on public\.signal_entities \(entity_id, captured_at desc\)/.test(sql), 'S2 a link is one per signal and entity, carrying the capture time, indexed for the measure');
ok(/create or replace function public\.entity_pattern\(p_names text\[\]\)/.test(sql) && /'\\m\(\?:' \|\| array_to_string\(parts, '\|'\) \|\| '\)\\M'/.test(sql) && /if length\(replace\(clean, ' ', ''\)\) < 3 then continue; end if;/.test(sql) && /replace\(clean, '\\\.', '\\\.\?'\)/.test(sql), 'S3 a name matches as whole words, case-blind, its dot optional; a name under three characters never matches the lake');
ok(/create or replace function public\.resolve_signal_entities\(p_since timestamptz, p_until timestamptz default now\(\)\)/.test(sql) && /on conflict do nothing/.test(sql) && /and \(ctx is null or \(coalesce\(s\.title, ''\) \|\| ' ' \|\| coalesce\(s\.summary, ''\)\) ~\* ctx\)/.test(sql) && /s\.status <> 'rejected'/.test(sql) && /security definer/.test(sql), 'S4 the resolver links every signal in the window to every active entity its text names, never a rejected row, an ambiguous name only beside a context word, and a link already made is left alone');
ok(/create or replace function public\.entity_counts\(p_entity uuid, p_since timestamptz, p_until timestamptz default now\(\)\)/.test(sql) && /grant execute on function public\.resolve_signal_entities/.test(sql) && /grant select, insert, update, delete on public\.signal_entities to service_role/.test(sql), 'S5 the counts function arc 2 reads exists, and the service role holds the grants');
ok(/create table if not exists public\.entity_resolve_state \(/.test(sql), 'S6 the resolver keeps its cursors in the database, never in a worker\'s memory');

// ── G: the graph from what the house knows ────────────────────────────
const blk = between(w, 'const ENTITY = {', 'async function entitySeed(');
const G = new Function(blk + '; return { ENTITY, entityContextWords, entityProposals };')();
ok(G.entityContextWords('Athletic footwear and the retail trade').join() === 'athletic,footwear,retail,trade', 'G1 a category lends its words as context, the small words left out');
const frames = [{ frame_key: 'track:1', frame: { entity: 'Costco', category: 'retail', competitors: ['Walmart', 'Target', 'BJ'] } }, { frame_key: 'theme:2', frame: { entity: 'Dr. Martens', category: 'footwear', competitors: ['Costco'] } }];
const tracks = [{ id: 't1', name: 'Nike', aliases: ['NKE', 'Nike Inc'], kind: 'brand', sector: 'Athletic footwear' }, { id: 't2', name: 'costco', aliases: ['Costco Wholesale', 'Kirkland'], kind: 'brand', sector: 'Warehouse retail' }];
const p = G.entityProposals(frames, tracks);
const by = Object.fromEntries(p.map(x => [x.name.toLowerCase(), x]));
ok(p.length === 5 && by.costco && by.walmart && by.target && by['dr. martens'] && by.nike && !by.bj, 'G2 one row per name across frames and tracks; a two-letter name is left out');
ok(by.costco.aliases.join() === 'Costco Wholesale,Kirkland' && by.costco.category === 'retail' && by.costco.from_src === 'track' && by.costco.track_id === 't2', 'G3 a name the frames and a track both know unions its aliases, keeps the first category, and carries the track');
ok(by.target.ambiguous === true && by.target.context.includes('retail') && by.target.context.includes('retailer') && by.target.context.length <= 24 && by.walmart.ambiguous === false && by.walmart.context.length === 0, 'G4 a name that is also a word is ambiguous and carries the category\'s words and the commerce words as context; a plain name carries none');
ok(by.nike.aliases.join() === 'NKE,Nike Inc' && by.nike.category === 'Athletic footwear', 'G5 a tracked brand brings its aliases and its sector');

// ── B: the backfill steps ─────────────────────────────────────────────
const now = Date.UTC(2026, 9, 29, 12, 0, 0);
const B = new Function(blk + between(w, 'function entityStep(', 'async function entityResolveRun(') + '; return { entityStep, ENTITY };')();
const first = B.entityStep({ at: '2026-10-01T00:00:00.000Z', until: '2026-10-29T11:00:00.000Z' }, now);
ok(first.since === '2026-10-01T00:00:00.000Z' && first.until === '2026-10-01T12:00:00.000Z', 'B1 a backfill step is twelve hours from the cursor');
const last = B.entityStep({ at: '2026-10-29T06:00:00.000Z', until: '2026-10-29T11:00:00.000Z' }, now);
ok(last.until === '2026-10-29T11:00:00.000Z' && B.entityStep({ at: '2026-10-29T11:00:00.000Z', until: '2026-10-29T11:00:00.000Z' }, now) === null, 'B2 the last step stops at the half hour\'s first window and the next asks for nothing');
ok(B.ENTITY.BACKFILL_WEEKS === 12 && B.ENTITY.STEP_H === 12 && B.ENTITY.STEPS_PER_SLICE === 2 && B.ENTITY.PASS_MS === 20000, 'B3 twelve weeks in twelve-hour steps, two a slice, inside a twenty-second budget');
const pass_ = between(w, 'async function entityResolvePass(', 'async function entityLine(');
ok(/if \(!st\.cursor \|\| \(opts && opts\.seed\)\) seeded = await entitySeed\(env\);/.test(pass_) && /const since = \(st\.cursor && st\.cursor\.until\) \|\| new Date\(t0 - 36e5\)\.toISOString\(\);/.test(pass_) && /while \(!bf\.done && ran < steps && Date\.now\(\) - t0 < ENTITY\.PASS_MS\)/.test(pass_) && /Math\.min\(200, parseInt\(opts && opts\.steps, 10\) \|\| ENTITY\.STEPS_PER_SLICE\)/.test(pass_),
  'B4 the pass seeds an empty graph, resolves from the cursor, then backfills as many steps as the budget and the desk allow');
ok(/rpc\/resolve_signal_entities/.test(between(w, 'async function entityResolveRun(', 'async function entityStateGet(')) && /entity_resolve_state\?on_conflict=k/.test(between(w, 'async function entityStatePut(', 'async function entityResolvePass(')), 'B5 the resolver is the database\'s function; the cursors are upserted rows');

// ── W: the slice, the desk and the watch ──────────────────────────────
const chain = w.slice(w.indexOf('await (runDailySpine(env,'), w.indexOf('  async fetch(request, env, ctx) {'));
ok(chain.indexOf('entityResolvePass(env)') > chain.indexOf('imageDescribePass(env)') && (chain.match(/entityResolvePass\(env\)/g) || []).length === 1 && /\.catch\(e => console\.log\('entity_resolve_error'/.test(chain), 'W1 the resolver runs last in the 30-minute chain, after the describer, inside its own budget');
ok(/which === 'resolve' \? await entityResolvePass\(env, \{ steps: parseInt\(body\.steps, 10\) \|\| undefined, seed: !!body\.seed \}\) : which === 'entities' \? await entitySeed\(env\) :/.test(w), 'W2 the desk runs the resolver with a step count and seeds the graph by hand');
const wh = between(w, 'async function watchHealth(env) {', 'async function watchTick(');
ok(/out\.entities = await entityLine\(env\);/.test(wh) && /kind: 'entity_stale'/.test(wh) && /now - cu > 2 \* 36e5/.test(wh), 'W3 the watch line carries the graph and trips when the resolver has not run for two hours');
ok(!/env\.AI\.run|callClaude|queue\.fal\.run/.test(between(w, 'const ENTITY = {', 'const EXC_MEASURE = {')), 'W4 nothing in the arc asks a model');
ok(!/ilikeOr\(anchors\)/.test(between(w, 'async function excMeasures(', 'function excMeasureLine(')) && /entityResolveName\(env, name, \{ create: true/.test(between(w, 'async function excMeasures(', 'function excMeasureLine(')), 'W5 the measure counts the links (arc 2); the ilike measure is gone');
console.log(`\nproof_entities: ${pass} checks passed`);
