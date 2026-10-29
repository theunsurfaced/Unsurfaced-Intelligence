/**
 * proof_frame_night.mjs  --  EX52a-0 THE NIGHT'S FRAME: the door's frame on its own clock, a slow call tried once more,
 * an aborted call written to the ledger. Run from the repo root: node worker/proofs/proof_frame_night.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = w.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return w.slice(i, j); };

// ── F: the frame call ─────────────────────────────────────────────────
const frameSrc = between('const EXC_FRAME = {', '\n') + '\n' + between('const DOOR = { WANT: 30', '\n') + '\n' + between('async function excFrameFor(', '/* SEAM:EXC_TIERS');
let calls = [], kv = new Map(), answers = [], logs = [];
const callClaude = async (env, tier, req) => { calls.push({ tier, timeout_ms: req.timeout_ms, kind: req.kind }); const a = answers.shift(); return typeof a === 'function' ? a() : a; };
const F = new Function('callClaude', 'sha256hex', 'excFrameClean', 'excNameHints', 'excNamePrompt', 'extractJson', 'excProbe', 'excQuiet', 'EXC_FRAME_SYS', 'console',
  frameSrc + '; return { EXC_FRAME, DOOR, excFrameFor };')(
  callClaude, async s => 'h' + s.length, f => f && (f.entity || f.category) ? f : null, async () => [], () => '', t => { try { return JSON.parse(t); } catch (e) { return null; } }, async (e, f) => f,
  (where, v) => e => v, 'SYS', { log: (...a) => logs.push(a.join(' ')) });
const env = { RATE_LIMIT: { get: async k => kv.has(k) ? kv.get(k) : null, put: async (k, v) => { kv.set(k, v); } } };
ok(F.EXC_FRAME.TIMEOUT_MS === 4500 && F.DOOR.FRAME_MS === 25000, 'F1 a reader\'s frame keeps 4.5 seconds; the night gets 25');
answers = [{ ok: true, text: '{"entity":"Costco","category":"retail"}' }];
const f1 = await F.excFrameFor(env, 'Costco retail');
ok(f1 && f1.entity === 'Costco' && calls.length === 1 && calls[0].timeout_ms === 4500, 'F2 without options the call runs on the reader\'s clock, once');
kv.clear(); calls = []; answers = [{ ok: true, text: '{"entity":"Walmart","category":"retail"}' }];
const f2 = await F.excFrameFor(env, 'Walmart retail', { timeout_ms: F.DOOR.FRAME_MS, retry: true });
ok(f2 && f2.entity === 'Walmart' && calls.length === 1 && calls[0].timeout_ms === 25000, 'F3 the night\'s options set the clock; a call that answers is not repeated');
kv.clear(); calls = []; answers = [{ ok: false, error: 'claude_network' }, { ok: true, text: '{"entity":"Target","category":"retail"}' }];
const f3 = await F.excFrameFor(env, 'Target retail', { timeout_ms: F.DOOR.FRAME_MS, retry: true });
ok(f3 && f3.entity === 'Target' && calls.length === 2 && calls.every(c => c.timeout_ms === 25000) && !logs.some(l => /exc_frame_miss/.test(l)), 'F4 a slow call is tried once more on the night, and the frame lands');
kv.clear(); calls = []; logs = []; answers = [{ ok: false, error: 'claude_network' }, { ok: false, error: 'claude_network' }];
const f4 = await F.excFrameFor(env, 'Nvidia technology', { timeout_ms: F.DOOR.FRAME_MS, retry: true });
ok(f4 === null && calls.length === 2 && logs.some(l => /exc_frame_miss claude_network/.test(l)) && [...kv.values()].some(v => /_miss/.test(v)), 'F5 two slow calls are a miss, logged and remembered, never a third try');
kv.clear(); calls = []; logs = []; answers = [{ ok: false, error: 'claude_cap' }, { ok: true, text: '{"entity":"x","category":"y"}' }];
const f5 = await F.excFrameFor(env, 'Apple technology', { timeout_ms: F.DOOR.FRAME_MS, retry: true });
ok(f5 === null && calls.length === 1 && logs.some(l => /exc_frame_miss claude_cap/.test(l)), 'F6 a closed tier is not retried');
kv.clear(); calls = []; answers = [{ ok: false, error: 'claude_network' }, { ok: true, text: '{"entity":"x","category":"y"}' }];
const f6 = await F.excFrameFor(env, 'Meta technology');
ok(f6 === null && calls.length === 1, 'F7 without the retry option a slow call is a miss, as before');

// ── D: the door and the ledger ────────────────────────────────────────
ok(/excFrameClean\(await excFrameFor\(env, cand\.query, \{ timeout_ms: DOOR\.FRAME_MS, retry: true \}\)\)/.test(between('async function doorPass(', 'async function doorLand(')), 'D1 the door frames every candidate on the night\'s clock with the retry');
const cc = between('async function callClaude(', 'async function callClaudeStream(');
ok(/catch \(e\) \{\n    await claudeRecord\(env, \[\{ tier, kind, mode: 'live', model: params\.model, status: 'failed',/.test(cc) && /error: \('claude_network ' \+/.test(cc) && /cost_usd: 0,/.test(cc.slice(cc.indexOf("catch (e) {"), cc.indexOf("return { ok: false, error: 'claude_network' }"))),
  'D2 a call aborted or never answered writes a failed row at cost 0 before callClaude returns claude_network');
ok(!/excFrameFor\(env, [a-z.]+\)[^;]*timeout_ms/.test(between('async function synthesize(', 'async function excFrameFor(')), 'D3 the reader\'s live frame is untouched in this cut');
console.log(`\nproof_frame_night: ${pass} checks passed`);
