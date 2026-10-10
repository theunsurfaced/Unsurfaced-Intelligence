#!/usr/bin/env node
/**
 * tools/bench/run.mjs  --  SEAM:BENCH: run the bench against a worker (a version's preview URL before it is promoted, or production).
 *   node tools/bench/run.mjs --base https://<preview>.workers.dev --key $DESK_API_KEY [--only q01,q02] [--no-grade] [--quick]
 * Every pack in tools/bench/packs/ is written by that worker's live writer and graded (the code's checks and, unless --no-grade,
 * one Haiku rubric). Writes tools/bench/last.json: the runs, the mean, the human scores from tools/bench/human.json when present,
 * and the writer's hash from the LOCAL worker/src/index.js, which the ritual gate compares against the worker it is about to pass.
 * About $0.50 for twenty packs with the rubric; a few cents without it.
 */
import fs from 'fs';
import path from 'path';
import { writerHash } from './writer_hash.mjs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = k => process.argv.includes(k);
const base = (arg('--base', process.env.BENCH_BASE || '')).replace(/\/$/, '');
const key = arg('--key', process.env.DESK_API_KEY || '');
const only = (arg('--only', '') || '').split(',').filter(Boolean);
if (!base || !key) { console.error('usage: node tools/bench/run.mjs --base <worker url> --key <desk key>'); process.exit(1); }
const here = path.dirname(new URL(import.meta.url).pathname);
const packs = fs.readdirSync(path.join(here, 'packs')).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(here, 'packs', f), 'utf-8'))).filter(p => !only.length || only.includes(p.id));
if (!packs.length) { console.error('no packs: run tools/bench/freeze.mjs first'); process.exit(1); }
let human = {}; try { human = JSON.parse(fs.readFileSync(path.join(here, 'human.json'), 'utf-8')); } catch (e) { human = {}; }
const runs = [];
for (const pack of packs) {
  const t0 = Date.now();
  try {
    const r = await fetch(base + '/bench/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-desk-key': key }, body: JSON.stringify({ pack, grade: !has('--no-grade'), depth: has('--quick') ? 'quick' : 'full' }) });
    const j = await r.json();
    if (!j || !j.ok) { runs.push({ id: pack.id, query: pack.query, ok: false, error: (j && j.error) || String(r.status) }); console.log('  fail', pack.id, (j && j.error) || r.status); continue; }
    const h = human[pack.id];
    runs.push({ id: pack.id, query: pack.query, ok: true, score: j.score, code: j.code && j.code.score, reader: j.reader && j.reader.ok ? j.reader.score : null, human: h == null ? null : h, failed_checks: j.code ? Object.keys(j.code.checks).filter(k => !j.code.checks[k]) : [], notes: (j.reader && j.reader.notes) || [], read: j.read, findings: j.findings, moves: j.moves, ms: j.ms, model: j.model && j.model.model });
    console.log('  ' + pack.id, String(j.score).padStart(3), 'code ' + (j.code && j.code.score), 'reader ' + (j.reader && j.reader.ok ? j.reader.score : 'none'), (j.code ? Object.keys(j.code.checks).filter(k => !j.code.checks[k]).join(',') : ''), Math.round((Date.now() - t0) / 1000) + 's');
  } catch (e) { runs.push({ id: pack.id, query: pack.query, ok: false, error: String(e && e.message).slice(0, 120) }); console.log('  error', pack.id, String(e && e.message).slice(0, 120)); }
}
const okRuns = runs.filter(r => r.ok);
const mean = okRuns.length ? Math.round(okRuns.reduce((a, r) => a + r.score, 0) / okRuns.length) : null;
const humanScores = okRuns.map(r => r.human).filter(x => typeof x === 'number');
const out = { at: new Date().toISOString(), base, writer_hash: writerHash(fs.readFileSync('worker/src/index.js', 'utf-8')), packs: packs.length, ok: okRuns.length, mean, human_mean: humanScores.length ? Math.round(humanScores.reduce((a, b) => a + b, 0) / humanScores.length) : null, floor: 70, runs };
if (!okRuns.length) { console.error('\nbench: no pack was written (' + runs.map(r => r.id + ' ' + r.error).join('; ') + '); tools/bench/last.json left as it was'); process.exit(3); }
fs.writeFileSync(path.join(here, 'last.json'), JSON.stringify(out, null, 1) + '\n');
console.log('\nbench: ' + okRuns.length + ' of ' + packs.length + ' written, mean ' + mean + (out.human_mean != null ? ', human ' + out.human_mean : '') + '; writer ' + out.writer_hash.slice(0, 12) + ' -> tools/bench/last.json');
if (mean != null && mean < out.floor) { console.error('bench below the floor (' + out.floor + '): the writer change should not ship'); process.exit(2); }
