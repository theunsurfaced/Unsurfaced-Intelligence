/**
 * proof_watch.mjs  --  EX29 THE WATCH: SEAM:WATCH_LINE, SEAM:WATCH_ALERT, SEAM:BENCH, SEAM:BACKUP, SEAM:DESK_ROLES.
 * The house hears a failure before a client sees it; the writer's quality is measured; the record has its own copy; the desk knows who.
 * Run from the repo root.
 */
import fs from 'fs';
import { writerHash } from '../../tools/bench/writer_hash.mjs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const toml = fs.readFileSync('worker/wrangler.toml', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the health line on fakes ─────────────────────────────────────────────────────────────────────────────────────────────────
const health = between(w, 'const WATCH = {', 'async function watchRecipients(');
const kv = {}; const KV = { get: async k => kv[k] == null ? null : kv[k], put: async (k, v) => { kv[k] = v; }, delete: async k => { delete kv[k]; } };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
let evRows = { door_pass: [{ created_at: iso(now - 40 * 36e5), meta: { earned: 4, queued: 0, failed: 4 } }], door_called: [], exc_rails: [1, 2, 3].map(() => ({ created_at: iso(now), meta: { silent: ['openalex', 'arxiv', 'pubmed', 'crossref', 'semanticscholar', 'sec_edgar', 'hn'] } })) };
const sb = async (env, path) => { const m = path.match(/event=eq\.(\w+)/); if (m) return evRows[m[1]] || []; if (/^claude_jobs\?/.test(path)) return [{ status: 'ok' }, { status: 'error' }, { status: 'ok', stop_reason: 'timeout' }]; if (/^app_user\?role=eq\.admin/.test(path)) return [{ email: 'owner@house.test' }]; return []; };
kv['cl$:live:' + new Date().toISOString().slice(0, 7)] = '26.5'; kv['pplxd:' + new Date().toISOString().slice(0, 10)] = '1.45'; kv['watch:fail:' + new Date().toISOString().slice(0, 10)] = '3';
const H = new Function('sbRest', 'excQuiet', 'CLAUDE', 'claudeSpent', 'claudeCap', 'CONFIG', 'evolutionMode', health + '; return watchHealth;')(
  sb, () => () => null, { TIERS: { live: {}, doc: {} } }, async (env, t) => parseFloat(kv['cl$:' + t + ':' + new Date().toISOString().slice(0, 7)]) || 0, (env, t) => t === 'live' ? 30 : 50, { PPLX_DAILY_DOLLARS: 1.5 }, () => false);
const line = await H({ RATE_LIMIT: KV, CF_VERSION_METADATA: { id: 'abcdef12-3456', tag: null } });
const kinds = line.trips.map(t => t.kind);
ok(kinds.includes('cron_late') && kinds.includes('door_failed'), 'A1 a pass forty hours old and a night that earned four readings and wrote none both trip');
ok(kinds.includes('rails_silent') && line.rails.silent_every_time.length === 7, 'A2 seven rails silent on every one of the last reads trip');
ok(kinds.includes('spend_live') && !kinds.includes('spend_doc') && line.spend.live.pct === 88, 'A3 the live tier at 88 percent of its cap trips; the doc tier at nothing does not');
ok(kinds.includes('pplx_cap') && kinds.includes('writer_failing') && kinds.includes('backup_late'), 'A4 Perplexity near its day, three failed reads and no backup on record each trip');
ok(line.version.id === 'abcdef12-3456' && line.writer.errors_today === 2 && line.writer.calls_today === 3 && JSON.parse(kv['watch:v1']).trips.length === line.trips.length, 'A5 the line carries the version, the jobs ledger\'s errors, and is kept in KV');
evRows.door_pass = [{ created_at: iso(now - 2 * 36e5), meta: { earned: 3, queued: 3, failed: 0 } }]; evRows.exc_rails = []; kv['cl$:live:' + new Date().toISOString().slice(0, 7)] = '4'; kv['pplxd:' + new Date().toISOString().slice(0, 10)] = '0.2'; delete kv['watch:fail:' + new Date().toISOString().slice(0, 10)]; kv['backup:last'] = JSON.stringify({ at: iso(now - 3 * 36e5), tables: {} });
const quiet = await H({ RATE_LIMIT: KV });
ok(quiet.trips.length === 0 && quiet.cron.earned === 3 && quiet.backup.at, 'A6 a healthy morning trips nothing');

// ── B: the alert ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const alertSrc = between(w, 'async function watchRecipients(', 'async function watchTick(');
const mails = [], events = [];
const A = new Function('sbRest', 'excQuiet', 'sendEmail', 'esc', 'logEvent', 'WATCH', alertSrc + '; return { watchRecipients, watchAlert };')(
  sb, () => () => null, async (env, m) => { mails.push(m); return { ok: true }; }, s => String(s), (env, p, s, e, sid, meta) => { events.push({ e, meta }); return Promise.resolve(); }, { ALERT_TTL: 21600 });
let r = await A.watchAlert({ RATE_LIMIT: KV }, [{ kind: 'cron_late', say: 'late' }, { kind: 'spend_live', say: 'spend' }], { spend: { live: { spent: 26.5, cap: 30 } }, version: { id: 'abcdef12' } });
ok(r.sent === 1 && mails.length === 1 && mails[0].to === 'owner@house.test' && /2 trips/.test(mails[0].html) && /EXCAVATE: cron late, spend live/.test(mails[0].subject) && events[0].e === 'watch_alert', 'B1 one email to the admins names every trip, and the alert is logged');
r = await A.watchAlert({ RATE_LIMIT: KV }, [{ kind: 'cron_late', say: 'late again' }], null);
ok(r.sent === 0 && mails.length === 1 && kv['alert:cron_late'] === '1', 'B2 the same trip inside six hours sends nothing');
ok((await A.watchRecipients({ ALERT_TO: 'a@x.test, b@x.test' })).length === 2, 'B3 ALERT_TO names the recipients when set');
ok(/if \(!body\.bench && typeof watchNote === 'function'\) await watchNote\(env, 'read_failed'/.test(w) && /if \(n >= WATCH\.FAIL_BURST\) await watchAlert\(env, \[\{ kind: 'writer_failing'/.test(w), 'B4 a live read whose writer failed outright is counted the moment it happens and the third pages the house');
ok(/\.then\(\(\) => watchTick\(env\)\)   \/\/ SEAM:WATCH_LINE: the line read and, if it trips, the house told/.test(w) && /read_tick_error[^\n]*\n\s+\.then\(\(\) => watchTick\(env\)\)   \/\/ SEAM:WATCH_LINE: the line on the half hour/.test(w) && /\.then\(\(\) => backupNightly\(env\)\)   \/\/ SEAM:BACKUP/.test(w), 'B5 the tick runs after the nightly chain and after the half-hour read tick; the backup runs after memory');
ok(/if \(\(path === '\/watch\/line' && request\.method === 'GET'\) \|\| \(path === '\/watch\/test' && request\.method === 'POST'\)\) return watchRoute\(request, env, origin\);/.test(w) && /if \(path === '\/bench\/run' && request\.method === 'POST'\) return benchRun\(request, env, origin\);/.test(w) && /if \(path === '\/bench\/freeze' && request\.method === 'POST'\) return benchFreeze\(request, env, origin\);/.test(w), 'B6 the watch and the bench are routes');
ok(/const ev = logEvent\(env, 'intelligence', 'watch', 'exc_rails', null, \{ q: q\.slice\(0, 80\), cls: g\.cls \|\| null, asked: asked\.length, silent \}\);/.test(w), 'B7 the gather logs the rails that stayed silent, after the response');

// ── C: the bench ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const B = new Function(between(w, 'function benchCodeChecks(d) {', 'async function benchGrade(') + '; return benchCodeChecks;')();
const good = { read: ['Gen Z buys retro Jordans on price, not hype', 'Comments under the month\'s videos name $230 as the wall, 613 likes on one line.'], brief: 'x'.repeat(100), read_checks: { ungrounded: [] },
  insights: [{ confidence: 'High', checks: { ungrounded: [] } }, { confidence: 'Low', checks: { ungrounded: [] } }, { confidence: 'Medium', checks: { ungrounded: [] } }], ideas: [{ from: 0, checks: { ungrounded: [] } }, { from: 2, checks: { ungrounded: [] } }, { from: 1, checks: { ungrounded: [] } }] };
const g1 = B(good);
ok(g1.score === 100 && g1.passed === 10, 'C1 a read that keeps every law the code can see scores 100 on the code\'s checks');
const bad = { read: ['Jordan Brand: 68% of Gen Z say price matters; New Balance, Nike and Asics gain', 'The dek.'], brief: 'short', read_checks: { ungrounded: ['68%'] }, insights: [{ confidence: 'Low', checks: { ungrounded: [] } }], ideas: [{ from: null }] };
const g2 = B(bad);
ok(!g2.checks.headline_length && !g2.checks.headline_pure && !g2.checks.dek_figure && !g2.checks.numbers_in_evidence && !g2.checks.moves_follow && !g2.checks.findings_count && !g2.checks.brief_present && g2.score <= 30, 'C2 a forty-word headline with a figure, an unsourced number, a move with no finding and a one-line brief fail their checks');
ok(/const req = \{ query: String\(pack\.query\)\.slice\(0, 300\), mode: 'report', depth: body\.depth === 'quick' \? 'quick' : 'full', frame: pack\.frame \|\| null, corpus: pack\.items\.slice\(0, 80\),\n    rails: \['gdelt', 'hn', 'exa', 'pplx', 'competitors', 'counter'\], pages: false, gap: false, facts: false, framed: false, bench: true \};/.test(w) && /const d = await synthesize\(req, env, origin, \{ reply: x => x \}\);/.test(w),
  'C3 the bench writes a frozen pack with every rail marked as run and nothing re-gathered');
ok(/const gathered = !!body\.bench \|\| body\.corpus\.some/.test(w) && /if \(env\.RATE_LIMIT && !body\.bench\) \{   \/\/ SEAM:BENCH: the bench never reads the cache/.test(w) && /if \(!body\.bench\) try \{   \/\/ SEAM:BENCH: a bench read lands nowhere/.test(w) && /if \(!body\.bench\) try \{ await env\.RATE_LIMIT\.put\(excCacheKey\(qhash\)/.test(w),
  'C4 a bench read reads no cache, writes no cache, lands no ledger row and captures nothing to the lake');
ok(/callClaude\(env, 'frame', \{ system: BENCH_RUBRIC, prompt: body, max_tokens: BENCH\.GRADE_TOKENS, temperature: 0, kind: 'bench_grade'/.test(w) && /const score = reader\.ok \? Math\.round\(\(code\.score \* BENCH\.WEIGHTS\.code \+ reader\.score \* BENCH\.WEIGHTS\.reader\) \/ 100\) : code\.score;/.test(w) && /WEIGHTS: \{ code: 60, reader: 40 \}/.test(w),
  'C5 the reader rubric runs on Haiku; the score weighs the code 60 and the reader 40');
ok(/'benchGrade': 'claudeGate on the frame tier \(Haiku\); called by benchRun only/.test(gate), 'C6 the grader is registered as a spender with its guard');
const hashSrc = between(w, 'const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = ');
ok(/_WRITER_SLICES = \[\('const EXC_HEADLINE_LAW = ', 'const EXC_ROOM = '\)/.test(gate) && /def writer_hash\(src\):/.test(gate) && /the writer changed since the bench last ran/.test(gate) && /is below the floor/.test(gate) && /no bench on record yet/.test(gate), 'C7 the gate hashes the writer\'s slices and refuses a writer the bench has not seen or that fell below the floor');
ok(/^[0-9a-f]{64}$/.test(writerHash(w)) && writerHash(w) !== writerHash(w.replace(hashSrc, hashSrc + ' ')) && writerHash(w) === writerHash(w.replace('const RECORD = {', 'const RECORD  = {')), 'C8 the hash moves when a law moves and stays when anything else does');
ok(fs.existsSync('tools/bench/queries.json') && JSON.parse(fs.readFileSync('tools/bench/queries.json', 'utf-8')).length === 20 && fs.existsSync('tools/bench/run.mjs') && fs.existsSync('tools/bench/freeze.mjs') && fs.existsSync('tools/bench/README.md') && fs.existsSync('.github/workflows/gate.yml') && /python3 tools\/ritual_gate\.py/.test(fs.readFileSync('.github/workflows/gate.yml', 'utf-8')),
  'C9 twenty questions, the freeze and the run, the README, and the gate runs on every push');

// ── D: the backup and the roles ─────────────────────────────────────────────────────────────────────────────────────────────────
const bk = between(w, 'async function backupNightly(env) {', '/* ═══ SEAM:BENCH');
ok(/\['door_reads', 'door_reads\?night=gte\./.test(bk) && /\['house_reads', 'house_reads\?select=/.test(bk) && /\['subject_weeks', LEDGER\.TABLE/.test(bk) && /\['cluster_calls'/.test(bk) && /\['claude_jobs', 'claude_jobs\?created_at=gte\./.test(bk) && /env\.MEDIA\.put\(BACKUP\.PREFIX \+ day \+ '\/' \+ name \+ '\.json', body, \{ httpMetadata: \{ contentType: 'application\/json' \} \}\)/.test(bk) && /RATE_LIMIT\.put\('backup:last'/.test(bk),
  'D1 the backup lands five tables in R2 under the day and leaves its sizes for the line');
ok(/const DESK_ROLES = \{ EDITOR_RUNS: \['record', 'called', 'door_publish', 'voices', 'score', 'backup', 'watch', 'health'\] \};/.test(w) && /allowed = role === 'admin' \|\| \(role === 'editor' && DESK_ROLES\.EDITOR_RUNS\.includes\(which\)\);/.test(w) && /logEvent\(env, 'intelligence', 'desk', 'desk_run', null, \{ run: which, who: who \? String\(who\)\.slice\(0, 80\) : null, role \}\);/.test(w),
  'D2 an editor runs the free passes, an admin everything, and every run is logged with who');
ok(!/'door'|'themes'|'memory'|'windows'|'edition'|'hub'/.test(between(w, 'const DESK_ROLES = {', 'async function callerRole(')), 'D3 no pass that spends a model is in the editor\'s list');
ok(/\[version_metadata\]\nbinding = "CF_VERSION_METADATA"/.test(toml) && /preview_urls = true/.test(toml) && /ALERT_TO \(SEAM:WATCH_ALERT/.test(toml), 'D4 the version binding, preview URLs and the alert secret are in the worker\'s config');
ok(fs.existsSync('templates/METHOD_CHANGELOG.md') && /Method 4\.2/.test(fs.readFileSync('templates/METHOD_CHANGELOG.md', 'utf-8')), 'D5 the Method has a dated changelog');
ok(!/—/.test(health + alertSrc + bk + between(w, 'const BENCH = {', 'async function benchRun(')), 'E1 no em dash in the new code');
console.log('\nproof_watch: ' + pass + ' checks PASS');
