/**
 * proof_themes.mjs  --  EX2a: the lake grouped by subject. The rollup keys by
 * theme, the pass runs on the schedule, and DAILY's own clustering is untouched.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0028_themes.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };

// ── the rollup keys by theme ──────────────────────────────────────────────
const src = between('const THEME = ', 'async function fetchRecurrenceRows(') +
  between('function weekEpoch(', 'function clusterState(');
const R = new Function('RECUR', 'sbRest', src + '; return { recurrenceRollup, lakeKey, themePass, THEME };')({ MIN_WEEKS: 2 }, null);
const day = 864e5, now = Date.now(), iso = d => new Date(now - d * day).toISOString();
const rows = [
  { id: 'a', cluster_id: 'c1', theme_id: 'T', title: 'Ray-Ban Meta audio glasses', source_name: 'The Verge', captured_at: iso(1), territory: 'technology-innovation' },
  { id: 'b', cluster_id: 'c2', theme_id: 'T', title: 'Meta Connect unveils glasses', source_name: 'Engadget', captured_at: iso(2), territory: 'technology-innovation' },
  { id: 'c', cluster_id: 'c3', theme_id: 'T', title: 'Meta x LISA smart glasses', source_name: 'Hypebeast', captured_at: iso(9), territory: 'fashion-beauty' },
  { id: 'd', cluster_id: 'c4', theme_id: null, title: 'Nike skate shoe', source_name: 'Highsnobiety', captured_at: iso(1) },
  { id: 'e', cluster_id: 'c4', theme_id: null, title: 'Nike skate shoe again', source_name: 'Highsnobiety', captured_at: iso(8) }];
const out = R.recurrenceRollup(rows, 10, 2);
const T = out.find(t => t.cluster_id === 'T'), C4 = out.find(t => t.cluster_id === 'c4');
ok(out.length === 2 && T && C4, 'K1 three clusters in one theme roll into one; rows without a theme still roll by cluster');
ok(T.members === 3 && T.sources === 3 && T.weeks_touched === 2 && T.territories.length === 2, 'K2 the theme carries breadth: 3 signals, 3 outlets, 2 weeks, 2 territories');
ok(T.exemplar.title === 'Ray-Ban Meta audio glasses', 'K3 the exemplar is the newest story in the theme');
ok(R.lakeKey({ theme_id: 'T', cluster_id: 'c' }) === 'T' && R.lakeKey({ cluster_id: 'c' }) === 'c' && R.lakeKey({}) === null, 'K4 lakeKey: theme first, cluster second, nothing otherwise');

// ── the pass ──────────────────────────────────────────────────────────────
let calls = [];
const remainingSeq = [3000, 1500, 0];
const P = new Function('RECUR', 'sbRest', src + '; return themePass;')({ MIN_WEEKS: 2 },
  async (env, path, o) => { calls.push({ path, body: o.body }); return [{ assigned: 900, created: 600, remaining: remainingSeq[calls.length - 1] }]; });
const night = await P({ THEME_SIM: '0.68' }, 6, 1500);
ok(calls.length === 3 && night.assigned === 2700 && night.created === 1800 && night.remaining === 0, 'P1 the pass loops until nothing remains, then stops early');
ok(calls.every(c => c.path === 'rpc/theme_assign' && c.body.p_limit === 1500 && c.body.p_sim === 0.68 && c.body.p_step === 0.015), 'P2 the threshold comes from THEME_SIM when set; the step rides along');
calls = [];
await P({}, 1, 400);
ok(calls.length === 1 && calls[0].body.p_sim === 0.65 && calls[0].body.p_step === 0.015 && calls[0].body.p_limit === 400, 'P3 defaults 0.65 and 0.015; the drain runs one small round');

// ── schedule and wiring ───────────────────────────────────────────────────
const sched = between('async scheduled(', 'async fetch(');
ok(/themePass\(env, THEME\.NIGHT_ROUNDS, THEME\.BATCH\)[\s\S]*feedWarm\(env\)/.test(sched), 'S1 nightly pass runs before the feed warms');
ok(/spine_slice[\s\S]*themePass\(env, 1, THEME\.DRAIN_BATCH\)[\s\S]*deskScore\(env\)/.test(sched), 'S2 the drain themes the new slice before the desk scores');
ok(/select=id,cluster_id,theme_id,title/.test(w), 'S3 the rollup rows carry theme_id');
ok(/const k = lakeKey\(r\);   \/\/ SEAM:THEMES/.test(w), 'S4 PROPOSE gathers headlines by the same key');
ok(/signals\?or=\(theme_id\.in\.\(' \+ idl \+ '\),cluster_id\.in\.\(' \+ idl \+ '\)\)/.test(w) && /const gk = lakeKey\(r\);/.test(w), 'S5 geometry fetches members by either key');
ok(/const kinQ = sig\.theme_id \? `theme_id=eq\.\$\{sig\.theme_id\}` : `cluster_id=eq\.\$\{sig\.cluster_id\}`/.test(w), 'S6 the cluster dashboard shows theme kin');
ok(/'prop:v4:'/.test(w) && (w.match(/'prop:v4:'/g) || []).length === 2 && !/'prop:v3:'/.test(w), 'S7 feed and PROPOSE caches move to v4 together');
ok(/which === 'themes' \? await themePass\(env, 8, THEME\.BATCH\)/.test(w), 'S8 an admin door can run the pass by hand');

// ── DAILY untouched ───────────────────────────────────────────────────────
ok(/ECHO_SIM: 0\.93, CLUSTER_SIM: 0\.80/.test(w), 'D1 CONNECT still clusters at 0.80 and rejects echoes at 0.93');
ok(/const cluster_id = \(anchorId && clusterOf\[anchorId\]\) \|\| crypto\.randomUUID\(\);/.test(w), 'D2 CONNECT still mints its own clusters; themes are a second column');
const composeFn = (() => { const i = w.indexOf('async function composeFromLake('); const j = w.indexOf('\nasync function ', i + 10); return w.slice(i, j); })();
ok(composeFn.length > 500 && !/theme/.test(composeFn), 'D3 compose reads no theme');

// ── the migration ─────────────────────────────────────────────────────────
ok(/create table if not exists public\.themes/.test(mig) && /using hnsw \(sumvec vector_cosine_ops\)/.test(mig), 'M1 themes table with an HNSW index on the running sum');
ok(/add column if not exists theme_id uuid references public\.themes\(id\) on delete set null/.test(mig), 'M2 theme_id sits beside cluster_id');
ok(/p_sim float default 0\.65, p_step float default 0\.015/.test(mig) && /bar := p_sim \+ p_step \* log\(2, greatest\(t\.n, 1\)::numeric\)::float;/.test(mig) && /limit 5/.test(mig),
   'M3 a story joins the nearest theme whose size-aware bar it clears (five tried), or starts one');
ok(/drop function if exists public\.theme_assign\(int, float\);/.test(mig), 'M3b the first-pass signature is dropped so the call is never ambiguous');
ok(/order by coalesce\(s\.published_at, s\.captured_at\) asc/.test(mig) && /s\.status in \('filtered', 'connected', 'published'\)/.test(mig), 'M4 oldest first; rejected and raw rows stay out');
ok(/sumvec = sumvec \+ r\.embedding/.test(mig) && /returns table \(assigned int, created int, remaining int\)/.test(mig), 'M5 the sum grows in place and the pass reports what remains');
ok(/delete from public\.cluster_calls where resolved_at is null/.test(mig), 'M6 open scoreboard calls on fragments are retired, resolved history kept');
ok(/grant execute on function public\.theme_assign\(int, float, float\) to service_role/.test(mig) && /revoke all on public\.themes from anon, authenticated/.test(mig), 'M7 service role only');
console.log(`\nproof_themes: ${pass} checks PASS`);
