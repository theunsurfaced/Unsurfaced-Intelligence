/**
 * proof_read_sweep.mjs  --  EX8 THE SWEEP: the Method 2.0, sources out of the prose, the advantage, the monthly as the report.
 * Run from the repo root: node worker/proofs/proof_read_sweep.mjs
 *   M  the Method: the laws that changed
 *   C  the contracts: no ids in prose, the advantage on every pattern
 *   L  landing: every kind is checked for the reader law
 *   P  the page: numbered sources, the edge, the Sources page in order of first mention
 *   R  the recut door for a weekly on the stand
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── M ─────────────────────────────────────────────────────────────────
ok(/^Version 2\.0\./m.test(method) && /Evidence is the sources, and the sources never interrupt the thought\./.test(method) && /They never appear inside prose\./.test(method), 'M1 the Method is 2.0 and takes the ids out of the prose');
ok(/\*\*The advantage law\.\*\*/.test(method) && /\*\*The reader law\.\*\*/.test(method) && /## The expert's voice/.test(method) && /Take a position\./.test(method) && /Name the mechanism\./.test(method) && /would a strategist pay for this sentence\?/.test(method),
  'M2 the advantage law, the reader law and the expert\'s voice are in the Method');
ok(/## The nine questions/.test(method) && /\*\*Why does it work\?\*\*/.test(method) && /\*\*What is the edge\?\*\*/.test(method), 'M3 the nine questions ask why it works and what the edge is');
ok(!/\(S12, S31, S40\)/.test(method) && /The sources ride in the evidence array; the sentence stays whole\./.test(method), 'M4 the examples no longer teach inline ids');
ok(/Cultural Intelligence Report\*\* \(the monthly\)/.test(method) && /LAKE SIGNALS\*\* \(L\)/.test(method), 'M5 the Method knows the report is the monthly and names the report\'s pack parts');
ok(!/—/.test(method), 'M6 no em dash in the Method');
const synced = (w.match(/^const READ_METHOD = (".*");(?=\s+\/\/ SEAM:PROMPT_SYNC)/m) || [])[1];
ok(synced && JSON.parse(synced) === method, 'M7 the worker carries the Method byte for byte');

// ── C ─────────────────────────────────────────────────────────────────
const C = new Function(between(w, 'const READ_CONTRACT = {', 'function readIso(') + '; return READ_CONTRACT;')();
ok(/"advantage": one sentence naming the edge a reader could take, who it favors, and what it costs to ignore/.test(C.weekly) && /"what_happened": 2 to 3 sentences naming the specifics, no ids/.test(C.weekly) && /how to use it, the mechanism named, no ids/.test(C.weekly),
  'C1 the weekly asks for the advantage, short what-happened without ids, and meaning with the mechanism');
ok(/"advantage": one sentence naming the edge/.test(C.monthly) && /"what_happened": 2 to 3 sentences, no ids/.test(C.monthly), 'C2 the monthly too');
ok(/"advantage": one sentence naming the edge/.test(C.record), 'C3 and the record');
ok(/"advantage": one sentence naming the edge a reader could take from this finding/.test(C.report) && /THE READER LAW/.test(C.report), 'C4 the report\'s findings carry the advantage beside the reader law');
ok(!Object.values(C).join('').includes('—'), 'C5 no em dash in any contract');

// ── L ─────────────────────────────────────────────────────────────────
ok(/\} else if \(v\.read\) \{   \/\/ SEAM:READ_SWEEP: every kind is checked for the reader law/.test(w) && /v\.notes = v\.notes\.concat\(readReaderVoice\(v\.read\)\.notes\);/.test(w), 'L1 a weekly or monthly that leaves an id in prose is noted on landing, never held');
ok(/out\.report = await readQueueOnce\(env, 'report', num\.win, \{ plan: 'cadence', issue_no: num\.issue, month: m\.label \}\);/.test(w) && /row\.kind === 'record' \? \['report', 'monthly'\]/.test(w),
  'L2 the first of the month queues the report; the record builds on reports and monthlies');

// ── P ─────────────────────────────────────────────────────────────────
ok(/var foot = \{\}, footN = 0, order = \[\];/.test(page) && /function srcline\(list\)/.test(page) && /SOURCES · ' \+ ns\.join\(" · "\)/.test(page), 'P1 the editorial read numbers its sources');
const ed = between(page, 'var main = x.patterns || x.features || x.held || [];', '/* Sources, in order of first mention');
ok(!/esc\(p\.what_happened\)|esc\(why\)|esc\(c\.thread\)|esc\(f\.line\)|esc\(t\.line\)|esc\(x\.scoreboard\)|esc\(b\.line\)/.test(ed) && /prose\(p\.what_happened\)/.test(ed) && /prose\(why\)/.test(ed) && /prose\(c\.thread\)/.test(ed) && /prose\(x\.scoreboard\)/.test(ed),
  'P2 every prose field on the editorial read runs through prose(), so an id becomes a number');
ok(!/evline\(sids\(x\.contradiction\)\)|evline\(sids\(x\.whitespace\)\)|evline\(sids\(x\.advertising_read\)\)|evline\(p\.evidence\)/.test(ed) && /srcline\(p\.evidence\)/.test(ed), 'P3 the RECEIPTS lines are gone; a pattern ends in SOURCES · 1 · 2');
ok(/<div class="lbl">What it means<\/div>/.test(ed) && /p\.advantage \? '<p class="edge"><b>THE EDGE<\/b>' \+ prose\(p\.advantage\)/.test(ed), 'P4 Why it matters reads What it means, and the edge is printed on every pattern that has one');
ok(/f\.advantage \? '<p class="edge"><b>THE EDGE<\/b>' \+ prose\(f\.advantage\)/.test(page), 'P5 the report\'s finding spreads print the edge too');
ok(/h \+= inner\(band\(pad\(sec\), "Sources", EXPLAIN\.receipts\)/.test(page) && /contents\.push\(\["Sources", "Every source cited, numbered"\]\);/.test(page) && !/S-numbers such as S739/.test(page) && /Small numbers in the text point to the sources at the back/.test(page),
  'P6 the back page is Sources, in order of first mention, and the reader\'s guide says so');
// the numbering, run: the editorial helpers on a tiny fixture
const helpers = between(page, '/* SEAM:READ_SWEEP: sources never interrupt the thought.', 'if (row.kind === "report") {');
const rc = { S11: { headline: 'a', source_name: 'Billboard' }, S12: { headline: 'b', source_name: 'Vogue' } }, cited = {};
const H = new Function('rc', 'cited', 'esc', 'real', helpers + '; return { num, refs, prose, srcline, order };')(rc, cited, s => String(s), s => rc[s] ? s : null);
ok(H.prose('Fans paid (S12, S11) and again S12 and S99.') === 'Fans paid<span class="rp-refs"><sup>1</sup><sup>2</sup></span> and again <sup>1</sup> and S99.' && H.order.join() === 'S12,S11' && H.srcline(['S11', 'S12', 'S99']) === '<div class="ev">SOURCES · 2 · 1</div>' && cited.S11 === 1,
  'P7 ids in prose become numbers in order of first mention; an unknown id is left alone; the sources line uses the same numbers');
ok(/\.edge \{ font-weight: 700;/.test(page) && /\.edge b \{ display: block; font-family: var\(--mono\)/.test(page), 'P8 the edge has its own type');

// ── R ─────────────────────────────────────────────────────────────────
ok(/case '\/reads\/weekly-stand':/.test(w) && /if \(path === '\/reads\/weekly-stand'\) \{/.test(w) && /await env\.MEDIA\.put\(key, bytes, \{ httpMetadata: \{ contentType: 'application\/pdf' \} \}\);/.test(w) && /const patch = \{ lead: String\(row\.read\.title \|\| ''\)\.slice\(0, 300\), standfirst: String\(row\.read\.thesis \|\| ''\)\.slice\(0, 600\), page_count: rsPdfPages\(bytes\), byte_size: bytes\.byteLength, r2_key: key \};/.test(w),
  'R1 a recut weekly replaces its own PDF on the stand and the shelf row follows the read; the cover stays');
ok(/if \(row\.kind !== 'weekly'\) return json\(\{ ok: false, error: 'not_a_weekly' \}/.test(w) && /if \(!issues\[0\]\) return json\(\{ ok: false, error: 'issue_not_on_stand' \}/.test(w), 'R2 only a weekly, only onto an issue that is on the stand');

// ── S: the sweep over what exists ─────────────────────────────────────
const planSrc = between(w, 'function readSweepPlan(rows, stand) {', '/* SEAM:READ_ENGINE cadence:');
const plan = new Function(planSrc + '; return readSweepPlan;')();
const rows = [
  { id: 1, kind: 'weekly', version: 1, status: 'published', window_start: '2026-09-14', window_end: '2026-09-20', label: 'Week of Sep 14, 2026', meta: {} },
  { id: 2, kind: 'weekly', version: 1, status: 'published', window_start: '2026-09-21', window_end: '2026-09-27', label: 'Week of Sep 21, 2026', meta: {} },
  { id: 3, kind: 'weekly', version: 1, status: 'ready', window_start: '2026-09-28', window_end: '2026-10-04', label: 'Week of Sep 28, 2026', meta: {} },
  { id: 4, kind: 'monthly', version: 1, status: 'ready', window_start: '2026-09-01', window_end: '2026-09-30', label: 'September 2026', meta: {} },
  { id: 5, kind: 'weekly', version: 2, status: 'compiling', window_start: '2026-09-21', window_end: '2026-09-27', label: 'Week of Sep 21, 2026', meta: { plan: 'sweep', replaces: 2, stand_issue: 2 } },
  { id: 6, kind: 'report', version: 1, status: 'compiling', window_start: '2026-07-08', window_end: '2026-10-03', label: 'Issue 001', meta: { plan: 'manual', issue_no: 1 } }];
const stand = [{ issue_no: 1, week_start: '2026-09-14', week_end: '2026-09-20' }, { issue_no: 2, week_start: '2026-09-21', week_end: '2026-09-27' }];
const P2 = plan(rows, stand);
ok(P2.weeklies.length === 3 && P2.weeklies[0].id === 1 && P2.weeklies[0].stand_issue === 1 && P2.weeklies[0].swept === false && P2.weeklies[1].id === 2 && P2.weeklies[1].stand_issue === 2 && P2.weeklies[1].swept === true && P2.weeklies[2].stand_issue === null,
  'S1 the plan names every weekly window with a read, the stand issue it is, and whether the sweep already recut it');
ok(P2.monthlies.length === 1 && P2.monthlies[0].id === 4 && P2.monthlies[0].swept === false && P2.pending.length === 1 && P2.pending[0].id === 5 && P2.pending[0].status === 'compiling',
  'S2 the monthly is planned as a report; a sweep row still compiling is listed as pending');
const P3 = plan(rows.concat([{ id: 7, kind: 'report', version: 1, status: 'ready', window_start: '2026-09-01', window_end: '2026-09-30', label: 'Issue 002', meta: { plan: 'sweep', replaces: 4, issue_no: 2 } }]), stand);
ok(P3.monthlies[0].swept === true, 'S3 a monthly whose report the sweep already wrote is marked swept');
ok(/case '\/reads\/sweep':/.test(w) && /if \(path === '\/reads\/sweep'\) \{/.test(w) && /const run = String\(body\.run \|\| 'plan'\);/.test(w) && /\{ plan: 'sweep', replaces: wk\.id, stand_issue: wk\.stand_issue \|\| null \}/.test(w) && /\{ plan: 'sweep', replaces: mo\.id, issue_no: num\.issue, month: mo\.label \}/.test(w),
  'S4 /reads/sweep plans, queues weeklies and the monthly as a report with the sweep remembered on each row');
ok(/if \(!r\.meta \|\| r\.meta\.plan !== 'sweep' \|\| r\.meta\.swept_at \|\| \(r\.status !== 'ready' && r\.status !== 'published'\)\) continue;/.test(w) && /const out = await rsPublishFromRead\(env, full, \{ status: 'draft' \}\);/.test(w) && /swept_at: new Date\(\)\.toISOString\(\), weekly_issue: n/.test(w),
  'S5 landing applies only ready sweep rows once: a weekly back onto its stand issue, the report staged as a draft');
ok(/if \(body\.weekly_start\) \{/.test(w) && /function standWeekly\(row, note\)/.test(page) && /id="stand-weekly">Replace issue /.test(page) && /call\("\/reads\/weekly-stand", \{ id: row\.id, issue_no: wk\.issue_no \}\)/.test(page),
  'S6 the house side shows a weekly\'s place on the stand and can replace that issue with the cut on screen');

console.log('proof_read_sweep: ' + pass + ' checks PASS');
