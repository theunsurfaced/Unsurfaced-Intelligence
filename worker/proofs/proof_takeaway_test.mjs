/**
 * proof_takeaway_test.mjs  --  TK1 THE TAKEAWAY TEST: SEAM:TAKEAWAY_TEST. The desk writes the newest readings again with a takeaway
 * line and returns them beside what was published. It writes nothing to the record, the night writer's hashed slices do not move, and
 * only the admin desk or the desk key can run it, on the live tier's gate. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const tb = between(w, '/* ═══ SEAM:TAKEAWAY_TEST', '/* ═══ end SEAM:TAKEAWAY_TEST ═══ */');

// ── A: wiring ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/which === 'takeaway_test' \? await takeawayTest\(env, body\) : which === 'partner'/.test(w) && !/'takeaway_test'/.test(between(w, 'const DESK_ROLES = {', '};')),
  'A1 the desk runs it, and an editor cannot: the run is not among the editor runs, so only an admin or the desk key opens it');
ok(/'takeawayTest': 'claudeGate on the live tier/.test(between(gate, 'SPENDERS = {', '\n}')) && /callClaude\(env, 'live', \{ system, prompt:/.test(tb),
  'A2 it spends on the live tier through callClaude (the cap and the kill switch) and is registered as a spender with that guard');
const slices = ['const EXC_HEADLINE_LAW = ', 'function excDoorPrompt(', 'const EXC_MOVE_LAW = ', 'const EXC_VOICE_SYS = '].map(a => between(w, a, a === 'function excDoorPrompt(' ? '// The compiled text becomes' : '\n'));
ok(slices.every(s => !/TAKEAWAY_TEST|TAKEAWAY LAW/.test(s)) && w.indexOf('/* ═══ SEAM:TAKEAWAY_TEST') > w.indexOf('// The compiled text becomes') && !/TAKEAWAY_TEST\.LAW|TAKEAWAY_TEST\.FIELD|TAKEAWAY_TEST\.ANCHOR/.test(between(w, 'async function takeawayTest(', '/* ═══ end SEAM:TAKEAWAY_TEST')),
  'A3 the night writer is untouched by this block: no hashed slice carries the test\'s own law, and since IQ2 the run adds nothing of its own to the night\'s prompt or system');

// ── B: the run, against stubs ─────────────────────────────────────────────────────────────────────────────────────────────────────
const K = (/const TAKEAWAY_TEST = (\{[\s\S]*?\});\n\/\/ PURE/.exec(tb) || [])[1];
const fnChecks = (/(function takeawayChecks[\s\S]*?\n\})\nasync function takeawayTest/.exec(tb) || [])[1];
const fnRun = (/(async function takeawayTest[\s\S]*\n\})\s*$/.exec(tb) || [])[1];
ok(K && fnChecks && fnRun, 'B0 the constants, the checks and the run are found in the block');
const calls = [], asked = [];
const ROWS = [
  { id: 'r1', frame_key: 'track:a', night: '2026-11-02', frame: { entity: 'Costco', category: 'warehouse retail' }, measures: {}, evidence: [{ title: 'Gas lines grow', text: 'Members queue for fuel.', source: 'Outlet', published_at: '2026-11-01' }],
    read: { read: ['Costco members stay for the gas', 'Fuel lines led the week in two outlets.'], watch: { claim: 'Renewals hold by Dec 1.' }, ideas: [{ headline: 'Sell the pump in the renewal' }] } },
  { id: 'r2', frame_key: 'theme:b', night: '2026-11-02', frame: { title: 'Family packs' }, measures: {}, evidence: [], read: { read: ['A', 'B'] } }];
const sbRest = async (env, path, opts) => { calls.push(((opts && opts.method) || 'GET') + ' ' + path); return ROWS; };
const excQuiet = () => () => null, logEvent = () => {}, excLine = (c, i) => '[' + (i + 1) + '] ' + c.title + ': ' + c.text;
const EXC_VOICE_SYS = 'VOICE', EXC_MOVE_LAW = 'MOVE', EXC_TIME_LAW = 'TIME', EXC_NUMBER_LAW = 'NUMBER', EXC_HEADLINE_LAW = 'HEADLINE';
const excDoorPrompt = (frame, ev) => '{"read":["..."],"question":"the question this read answers for the professional it serves, one sentence, plain",\nEVIDENCE\n' + ev;
const extractJson = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const TAKE = 'Members who renew for fuel have made the warehouse a utility, so price rises elsewhere strengthen the card rather than test it.';
const callClaude = async (env, tier, req) => { asked.push({ tier, req }); return { ok: true, cost_usd: 0.06, text: JSON.stringify({ level: 'brand', lens: ['a', 'b'], read: ['Costco members renew for the fuel', 'Two outlets led with the lines.'], takeaway: TAKE, insights: [{ title: 'one', fact: 'f1', read: 'a read', evidence: [1] }, { title: 'two', fact: 'f2', read: 'another', evidence: [1] }], watch: { claim: 'x' }, ideas: [{ headline: 'Sell the pump' }] }) }; };
const EXC_LENS_LAW = 'LENS';   // IQ2: the run is the night's writer itself
const doorPeopleBlock = v => (v && v.length ? '\nPEOPLE P1 "' + v[0].text + '"' : ''), excReadOf = s => { const j = extractJson(s); return j ? { read: j } : null; }, excMeasureClaims = () => [];
const doorCompileRead = (parsed, merged, frame, measures, night, nowMs) => ({ read: parsed.read, takeaway: parsed.takeaway, level: parsed.level || null, lens: parsed.lens || [], pushback: parsed.pushback || null, insights: (parsed.insights || []).map(x => ({ title: x.title, excerpt: x.fact, implication: x.read || null })), ideas: parsed.ideas || [], watch: parsed.watch || null, brief: parsed.brief || null, nowMs });
const run = new Function('sbRest', 'excQuiet', 'logEvent', 'excLine', 'EXC_VOICE_SYS', 'EXC_MOVE_LAW', 'EXC_TIME_LAW', 'EXC_NUMBER_LAW', 'EXC_HEADLINE_LAW', 'EXC_LENS_LAW', 'excDoorPrompt', 'extractJson', 'callClaude', 'doorPeopleBlock', 'excReadOf', 'doorCompileRead', 'excMeasureClaims',
  'const TAKEAWAY_TEST = ' + K + ';\n' + fnChecks + '\n' + fnRun + '\nreturn { takeawayTest, takeawayChecks, TAKEAWAY_TEST };')(sbRest, excQuiet, logEvent, excLine, EXC_VOICE_SYS, EXC_MOVE_LAW, EXC_TIME_LAW, EXC_NUMBER_LAW, EXC_HEADLINE_LAW, EXC_LENS_LAW, excDoorPrompt, extractJson, callClaude, doorPeopleBlock, excReadOf, doorCompileRead, excMeasureClaims);
const out = await run.takeawayTest({}, { n: 50 });
ok(calls.length === 1 && /^GET door_reads\?status=eq\.ready&read=not\.is\.null&.*,meta&.*&limit=12$/.test(calls[0]), 'B1 one read of the record, the ready readings only (with their voices), capped at TAKEAWAY_TEST.MAX (twelve); nothing is written (no POST, no PATCH)');
ok(asked.length === 1 && asked[0].tier === 'live' && asked[0].req.system === 'VOICE MOVE TIME NUMBER HEADLINE LENS' && asked[0].req.prompt.indexOf(run.TAKEAWAY_TEST.FIELD) < 0 && /\[1\] Gas lines grow: Members queue for fuel\./.test(asked[0].req.prompt) && asked[0].req.kind === 'takeaway_test',
  'B2 each reading with evidence is written again by the night\'s writer itself (IQ2): the night\'s own system with the lens law, the reading\'s own prompt from its kept evidence, nothing spliced in');
const r1 = out.readings.find(x => x.id === 'r1'), r2 = out.readings.find(x => x.id === 'r2');
ok(out.ok && out.written === 1 && r1.was.headline === 'Costco members stay for the gas' && r1.was.move === 'Sell the pump in the renewal' && r1.now.takeaway === TAKE && r1.now.headline === 'Costco members renew for the fuel' && r1.now.level === 'brand' && r1.now.findings.length === 2 && r1.now.findings[0].read === 'a read' && r1.now.reads_dropped === 0 && r1.now.held === null && r1.now.moves[0] === 'Sell the pump' && r2.skipped === 'no_evidence' && out.usd === 0.06,
  'B3 it returns each reading beside what was published (headline, dek, bet, move): the new two lines, the level, the takeaway, each finding\'s fact and read, the reads the checks dropped, what the night would hold, the moves, the bet; a reading without kept evidence is skipped, not invented');
ok(r1.checks.present && r1.checks.length && r1.checks.no_dash && r1.checks.not_a_move && r1.checks.not_the_headline, 'B4 a takeaway under the law passes every check');
const c = run.takeawayChecks;
ok(!c('Sell the membership at the pump before the renewal letter goes out to every member this winter', 'h').not_a_move && !c('Retailers should treat fuel as the reason members stay with the warehouse card this year', 'h').not_a_move
  && !c('Too short to count', 'h').length && !c('Members renew for fuel — and the card becomes a utility for families across every region this year', 'h').no_dash && !c('', 'h').present,
  'B5 the checks catch a move, a "should", a short line, a dash and a missing line');
console.log('proof_takeaway_test: ' + pass + ' checks passed');
