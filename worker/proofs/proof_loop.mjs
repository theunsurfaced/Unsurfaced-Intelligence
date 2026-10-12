/**
 * proof_loop.mjs  --  EX38 THE LOOP: SEAM:BOARD_SWEEP. The board's subjects gather nightly through the free rails and enter the lake
 * as recon_board (research by 0038's rule), so they deepen the evidence and count in nothing.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0038_sweep_ledger.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const fn = between(w, 'async function boardSweep(env) {', 'async function doorSet(env) {');
ok(/const BOARD_SWEEP = \{ MAX: 24, PAR: 2, BUDGET_MS: 240000, KEY: 'sweep:last', SKIP: \['exa', 'pplx', 'youtube', 'youtube_shorts', 'competitors', 'counter', 'consensus', 'calendar'\] \};/.test(w), 'L1 the sweep is bounded: 24 subjects, two at a time, four minutes, the paid and rationed rails skipped');
ok(/await doorCandidates\(env\)/.test(fn) && /gatherOpenSignals\(env, s\.q, \{ skip: BOARD_SWEEP\.SKIP \}\)/.test(fn), 'L2 the subjects are the board\'s own candidates; each gathers through the open rails minus the skip list');
ok(/lakeCapture\(env, g\.items, \{ provenance: 'recon_board', query: s\.q, cls: g\.cls \}\)/.test(fn) && /~ '\^\(live\|recon\)'/.test(mig), 'L3 the rows enter as recon_board, which 0038\'s trigger marks research: findable, never counted');
ok(/\.then\(\(\) => boardSweep\(env\)\)/.test(w) && w.indexOf('.then(() => boardSweep(env))') > w.indexOf('.then(() => doorPass(env))') && w.indexOf('.then(() => boardSweep(env))') < w.indexOf('.then(() => doorCalled(env))'), 'L4 the loop runs nightly after the door compiles and before the watches are graded');
ok(/which === 'sweep' \? await boardSweep\(env\)/.test(w) && /BOARD_SWEEP\.KEY, JSON\.stringify/.test(fn) && /out\.sweep = env\.RATE_LIMIT/.test(w), 'L5 the desk runs it and the watch line carries the last sweep');
ok(!/'board_sweep'[^\n]*provenance/.test(fn) && !/research: false/.test(fn), 'L6 the sweep never writes the research flag itself; the database decides from the provenance');
console.log('proof_loop: ' + pass + ' ok');
