// Proves migration 0040 on Postgres 16 (PGlite, in memory): runs it twice on a stub of the tables it touches, then checks every
// function on fixtures. Needs @electric-sql/pglite: in an empty folder run npm i @electric-sql/pglite, copy this file there, and
// run node 0040_memory.test.mjs <path to the repo>. Not part of the gate (it needs the package).
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import fs from 'fs';
const db = new PGlite({ extensions: { pg_trgm } });
const sql = fs.readFileSync((process.argv[2] || '.') + '/supabase/migrations/0040_memory.sql', 'utf-8');
let fails = 0; const ok = (c, l) => { if (!c) { fails++; console.log('FAIL', l); } else console.log('  ok', l); };
await db.exec(`
create schema if not exists extensions;
do $$ begin create role anon; exception when others then null; end $$;
do $$ begin create role authenticated; exception when others then null; end $$;
do $$ begin create role service_role; exception when others then null; end $$;
create table public.themes (id uuid primary key, n int not null default 0);
create table public.tracks (id uuid primary key, name text not null, aliases text[] not null default '{}', active boolean not null default true, created_at timestamptz default now());
create table public.signals (id uuid primary key default gen_random_uuid(), title text, source_name text, territory text, published_at timestamptz,
  captured_at timestamptz not null default now(), status text not null default 'filtered', research boolean not null default false, theme_id uuid, cluster_id uuid, image text);
create index signals_captured_idx on public.signals (captured_at desc);
create table public.subject_weeks (
  id bigint generated always as identity primary key, subject_key text not null,
  kind text not null check (kind in ('theme', 'track', 'cohort', 'field')), week date not null, title text,
  board jsonb, door jsonb, track jsonb, cohort jsonb, first_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (subject_key, week));
`);
for (const run of [1, 2]) {
  const res = await db.exec(sql);
  const last = res[res.length - 1];
  ok(last.rows.map(r => r.status).join('|') === 'headline index ready|counting rule ready|subject_weeks remembers counts, said and grades|counter ready|brands and reads ready', 'run ' + run + ': five lines come back (' + last.rows.map(r => r.status).join(', ') + ')');
}
const q = async (s, p) => (await db.query(s, p)).rows;
// the counting rule
const sw = await q(`select public.sweep_week('2026-10-06 12:00+00', '2026-10-07 09:00+00') a, public.sweep_week(null, '2026-10-04 23:00+00') b, public.sweep_week('2026-10-09 12:00+00', '2026-10-07 09:00+00') c, public.sweep_week('2026-09-01 12:00+00', '2026-10-07 09:00+00') d, public.sweep_week('2026-09-08 12:00+00', '2026-10-07 09:00+00') e`);
const d = x => x instanceof Date ? x.toISOString().slice(0, 10) : x;
ok(d(sw[0].a) === '2026-10-05' && d(sw[0].b) === '2026-09-28' && sw[0].c === null && sw[0].d === null && d(sw[0].e) === '2026-09-07', 'the counting rule: published week; found the day after a Sunday; dated after it was found counts nowhere; found more than a month late counts nowhere; inside the month counts');
const tp = await q(`select public.track_patterns('Nike', array['NKE','**','LG','A_B*C (x)']) p, public.track_patterns('H&M', '{}') h, public.track_patterns('LG', '{}') l`);
ok(JSON.stringify(tp[0].p.sort()) === JSON.stringify(['%A B C x%', '%NKE%', '%Nike%'].sort()) && JSON.stringify(tp[0].h) === '["%H&M%"]' && JSON.stringify(tp[0].l) === '[]', 'track patterns follow ilikeOr: words only, H&M stays, LG and ** go (' + JSON.stringify(tp[0].p) + ')');
// fixtures: Mondays Sep 7 .. Oct 5 2026
const T1 = '11111111-1111-1111-1111-111111111111', T2 = '22222222-2222-2222-2222-222222222222', TH = 'aaaaaaaa-0000-0000-0000-000000000001', TH2 = 'aaaaaaaa-0000-0000-0000-000000000002', CL = 'cccccccc-0000-0000-0000-000000000001';
await db.exec(`insert into public.themes values ('${TH}', 10), ('${TH2}', 2);
insert into public.tracks (id, name, aliases) values ('${T1}', 'Nike', '{NKE}'), ('${T2}', 'Puma', '{}');`);
const ins = (title, src, terr, pub, cap, extra) => db.query(`insert into public.signals (title, source_name, territory, published_at, captured_at, status, research, theme_id, cluster_id, image) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
  [title, src, terr, pub, cap, (extra && extra.status) || 'filtered', !!(extra && extra.research), (extra && extra.theme) || null, (extra && extra.cluster) || null, (extra && extra.image) || null]);
// week of Sep 28: 3 Nike stories (2 outlets), one research (not counted), one rejected (not counted); one NKE alias story; a Puma story
await ins('Nike drops a runner', 'Hypebeast', 'style', '2026-09-29 10:00+00', '2026-09-29 12:00+00', { theme: TH, image: 'https://img/a.jpg' });
await ins('Nike earnings beat', 'Reuters', 'business', '2026-09-30 10:00+00', '2026-09-30 12:00+00', { theme: TH });
await ins('NKE stock moves', 'Reuters', 'business', '2026-10-01 10:00+00', '2026-10-01 12:00+00', { theme: TH });
await ins('Nike search find', 'Blog', 'style', '2026-10-01 10:00+00', '2026-10-01 12:00+00', { theme: TH, research: true });
await ins('Nike rejected', 'Spam', 'style', '2026-10-01 10:00+00', '2026-10-01 12:00+00', { theme: TH, status: 'rejected' });
await ins('Puma and Nike both', 'Complex', 'style', '2026-10-02 10:00+00', '2026-10-02 12:00+00', { theme: TH2 });
// week of Sep 14: a Nike story published then, found Sep 15
await ins('Nike in September', 'Vogue', 'style', '2026-09-14 10:00+00', '2026-09-15 12:00+00', { theme: TH });
// an old Nike story found late (published June, captured Oct): counts nowhere
await ins('Nike old archive', 'Archive', 'style', '2026-06-01 10:00+00', '2026-10-02 12:00+00', { theme: TH });
// a cluster-only row already on the board
await ins('A cluster story', 'Wire', 'music', '2026-10-03 10:00+00', '2026-10-03 12:00+00', { cluster: CL });
await db.exec(`insert into public.subject_weeks (subject_key, kind, week, title, board) values ('theme:${CL}', 'theme', '2026-10-05', 'On the board', '{"state":"EMERGING"}')`);
// count Sep 7 .. Oct 5 for every kind
const th = (await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'theme') n`))[0].n;
const te = (await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'territory') n`))[0].n;
const tr = (await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'track') n`))[0].n;
const rows = await q(`select subject_key, kind, week::text, title, counts, board from public.subject_weeks order by subject_key, week`);
const get = (k, w) => rows.find(r => r.subject_key === k && r.week === w);
console.log(rows.map(r => r.subject_key + ' ' + r.week + ' ' + JSON.stringify(r.counts)).join('\n'));
ok(get('theme:' + TH, '2026-09-28') && get('theme:' + TH, '2026-09-28').counts.n === 3 && get('theme:' + TH, '2026-09-28').counts.outlets === 2 && get('theme:' + TH, '2026-09-14').counts.n === 1 && get('theme:' + TH, '2026-09-28').counts.outlets_4w === 3,
  'a theme: its sweep stories by published week, never research or rejected, outlets that week and over four weeks to date');
ok(!rows.some(r => r.subject_key === 'theme:' + TH2) && get('theme:' + CL, '2026-09-28').counts.n === 1 && get('theme:' + CL, '2026-10-05').board.state === 'EMERGING' && get('theme:' + CL, '2026-10-05').counts.n === 0 && get('theme:' + CL, '2026-10-05').counts.outlets_4w === 1 && get('theme:' + CL, '2026-10-05').title === 'On the board',
  'a theme of two stories is not counted; a cluster on the board is, its board column and its name are untouched, and a quiet week after a story carries the four-week outlets');
ok(get('theme:' + TH, '2026-09-28').title === null && get('theme:' + TH, '2026-10-05').counts.n === 0 && get('theme:' + TH, '2026-10-05').counts.outlets_4w === 3 && get('theme:' + TH, '2026-09-21').counts.n === 0 && get('theme:' + TH, '2026-09-21').counts.outlets_4w === 1,
  'a theme row never takes a headline as its name; the three weeks after a story get rows that say how many outlets the four weeks to date carried');
ok(get('track:' + T1, '2026-09-28').counts.n === 4 && get('track:' + T1, '2026-09-28').counts.outlets === 3 && get('track:' + T1, '2026-09-14').counts.n === 1 && get('track:' + T2, '2026-09-28').counts.n === 1 && get('track:' + T1, '2026-09-28').title === 'Nike',
  'a tracked brand: its name and aliases, each story once (Nike and NKE), its own week');
ok(get('territory:style', '2026-09-28').counts.n === 2 && get('territory:business', '2026-09-28').counts.n === 2 && get('territory:music', '2026-09-28').counts.n === 1 && !rows.some(r => r.week === '2026-05-25' || r.week === '2026-06-01'),
  'territories counted the same way; the June story found in October counts in no week');
ok(th > 0 && te > 0 && tr > 0, 'the counter says how many rows it wrote (' + th + ', ' + te + ', ' + tr + ')');
// the counter on theme ids: only those themes' runs are replaced
await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'theme', array['${CL}']::uuid[])`);
const keep = (await q(`select counts from public.subject_weeks where subject_key = 'theme:${TH}' and week = '2026-09-28'`))[0];
ok(keep.counts.n === 3, 'a recount of one theme leaves the others alone');
// a recount after a story is rejected: the count falls; a second run is identical
await db.exec(`update public.signals set status = 'rejected' where title = 'Nike in September'`);
await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'theme')`);
await q(`select public.memory_count_weeks('2026-09-07', '2026-10-05', 'track', array['${T1}']::uuid[])`);
const rows2 = await q(`select subject_key, week::text, counts from public.subject_weeks where subject_key in ('theme:${TH}', 'track:${T1}', 'track:${T2}') order by subject_key, week`);
const g2 = (k, w) => rows2.find(r => r.subject_key === k && r.week === w);
ok(g2('theme:' + TH, '2026-09-14').counts === null && g2('track:' + T1, '2026-09-14').counts === null && g2('theme:' + TH, '2026-09-28').counts.n === 3 && g2('track:' + T2, '2026-09-28').counts.n === 1,
  'a recount replaces the run: a story rejected since stops counting; a recount of one brand leaves the others alone');
let bad = 0; for (const a of [["'2026-09-08'", "'2026-10-05'", "'theme'"], ["'2026-01-05'", "'2026-10-05'", "'theme'"], ["'2026-09-07'", "'2026-10-05'", "'cohort'"]]) { try { await q(`select public.memory_count_weeks(${a.join(',')})`); } catch (e) { bad++; } }
ok(bad === 3, 'the counter refuses a week that is not a Monday, more than ten weeks, or a kind it does not count');
const st = (await q(`select public.memory_start()::text s`))[0].s;
ok(st === '2026-09-14', 'the first week the sweep counted anything (' + st + ')');
// the brand rollup at a fixed now
const ro = await q(`select * from public.track_rollup(array['${T1}', '${T2}', '33333333-3333-3333-3333-333333333333']::uuid[], '2026-10-06 12:00+00')`);
const r1 = ro.find(r => r.track_id === T1), r3 = ro.find(r => r.track_id === '33333333-3333-3333-3333-333333333333');
console.log(JSON.stringify(ro));
ok(ro.length === 3 && r1.weeks.length === 12 && r1.weeks[11] === 3 && r1.weeks[10] === 1 && r1.outlets[11] === 2 && r1.weeks.reduce((a, b) => a + b, 0) === 4 && r1.n7 === 3 && r1.n30 === 4 && r1.outlets30 === 3 && r1.image === 'https://img/a.jpg' && r3.n30 === 0 && r3.weeks.every(x => x === 0),
  'the brand rollup: twelve rolling weeks ending now, 7 and 30 days, outlets, a lake photo; a brand with nothing is zeros on the list it was asked about');
// what a read said
const said = (await q(`select public.ledger_said_put($1::jsonb) n`, [JSON.stringify([
  { subject_key: 'theme:' + TH, kind: 'theme', week: '2026-09-28', title: 'Runners', said: { 'weekly:2026-09-28': { read_id: 7, items: [{ name: 'A' }] } } },
  { subject_key: 'cohort:x', kind: 'cohort', week: '2026-09-28', said: { a: 1 } }])]))[0].n;
await q(`select public.ledger_said_put($1::jsonb)`, [JSON.stringify([{ subject_key: 'theme:' + TH, kind: 'theme', week: '2026-09-28', said: { 'monthly:2026-09-01': { read_id: 9, items: [{ name: 'B' }] } } }])]);
await q(`select public.ledger_said_put($1::jsonb)`, [JSON.stringify([{ subject_key: 'theme:' + TH, kind: 'theme', week: '2026-09-28', said: { 'weekly:2026-09-28': { read_id: 8, items: [{ name: 'A2' }] } } }])]);
const sr = (await q(`select said, title, counts from public.subject_weeks where subject_key = 'theme:${TH}' and week = '2026-09-28'`))[0];
await q(`select public.ledger_said_put($1::jsonb)`, [JSON.stringify([{ subject_key: 'theme:' + CL, kind: 'theme', week: '2026-09-28', said: { 'weekly:2026-09-28': { read_id: 8, items: [{ name: 'C' }] } } }])]);
await q(`select public.ledger_said_put($1::jsonb, $2, $3::date)`, [JSON.stringify([{ subject_key: 'theme:' + CL, kind: 'theme', week: '2026-09-28', said: { 'weekly:2026-09-28': { read_id: 10, items: [{ name: 'C2' }] } } }]), 'weekly:2026-09-28', '2026-09-28']);
const sr2 = (await q(`select said from public.subject_weeks where subject_key = 'theme:${TH}' and week = '2026-09-28'`))[0], sr3 = (await q(`select said from public.subject_weeks where subject_key = 'theme:${CL}' and week = '2026-09-28'`))[0];
ok(!('weekly:2026-09-28' in sr2.said) && 'monthly:2026-09-01' in sr2.said && sr3.said['weekly:2026-09-28'].read_id === 10, 'a new version that no longer speaks to a subject takes its old entry off that subject, and leaves other reads alone');
ok(said === 1 && Object.keys(sr.said).sort().join(',') === 'monthly:2026-09-01,weekly:2026-09-28' && sr.said['weekly:2026-09-28'].read_id === 8 && sr.counts.n === 3,
  'what a read said is merged by read: a new version replaces its own entry, another read sits beside it, the counts stay; only theme, track and territory rows are taken');
// grants
// time: 60,000 stories over 300 days and 2,000 themes, one four-week span of themes (the API allows about eight seconds)
await db.exec(`insert into public.themes select ('bbbbbbbb-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid, 10 from generate_series(1, 2000) i;
insert into public.signals (title, source_name, territory, published_at, captured_at, status, research, theme_id)
select 'story ' || i, 'outlet ' || (i % 300), 'style', now() - (i % 300) * interval '1 day', now() - (i % 300) * interval '1 day' + interval '2 hours', 'filtered', false,
       ('bbbbbbbb-0000-0000-0000-' || lpad((1 + i % 2000)::text, 12, '0'))::uuid from generate_series(1, 60000) i;`);
const wk = (await q(`select (date_trunc('week', now() at time zone 'UTC'))::date::text w`))[0].w;
const t0 = Date.now(); await q(`select public.memory_count_weeks(($1::date - 21), $1::date, 'theme')`, [wk]); const ms = Date.now() - t0;
ok(ms < 8000, 'one four-week span of 2,000 themes over 60,000 stories counts in ' + ms + ' ms (in Postgres in WebAssembly; the hosted database is faster)');
const g = await q(`select has_function_privilege('anon', 'public.memory_count_weeks(date, date, text, uuid[])', 'execute') a, has_function_privilege('service_role', 'public.memory_count_weeks(date, date, text, uuid[])', 'execute') s, has_function_privilege('authenticated', 'public.track_rollup(uuid[], timestamptz)', 'execute') t, has_function_privilege('anon', 'public.ledger_said_put(jsonb, text, date)', 'execute') l`);
ok(g[0].a === false && g[0].s === true && g[0].t === false && g[0].l === false, 'only the service role may run them');
console.log(fails ? 'FAILED ' + fails : 'migration 0040: all checks pass');
process.exit(fails ? 1 : 0);
