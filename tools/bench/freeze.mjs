#!/usr/bin/env node
/**
 * tools/bench/freeze.mjs  --  SEAM:BENCH: freeze the evidence packs once, from a real gather on the live worker.
 *   node tools/bench/freeze.mjs --base https://api.unsurfaced-intelligence.com --key $DESK_API_KEY [--only q01,q02]
 * Writes tools/bench/packs/<id>.json. A pack is frozen once and kept; refreeze only when the rails change on purpose
 * (then every bench score before and after is compared on the new ground, and the change is noted in last.json).
 */
import fs from 'fs';
import path from 'path';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const base = (arg('--base', process.env.BENCH_BASE || 'https://api.unsurfaced-intelligence.com')).replace(/\/$/, '');
const key = arg('--key', process.env.DESK_API_KEY || '');
const only = (arg('--only', '') || '').split(',').filter(Boolean);
if (!key) { console.error('a desk key is required (--key or DESK_API_KEY)'); process.exit(1); }
const here = path.dirname(new URL(import.meta.url).pathname);
const queries = JSON.parse(fs.readFileSync(path.join(here, 'queries.json'), 'utf-8')).filter(q => !only.length || only.includes(q.id));
fs.mkdirSync(path.join(here, 'packs'), { recursive: true });
let frozen = 0;
for (const q of queries) {
  const t0 = Date.now();
  try {
    const r = await fetch(base + '/bench/freeze', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-desk-key': key }, body: JSON.stringify({ id: q.id, query: q.query }) });
    const j = await r.json();
    if (!j || !j.ok || !j.pack) { console.log('  miss', q.id, q.query, (j && j.error) || r.status); continue; }
    fs.writeFileSync(path.join(here, 'packs', q.id + '.json'), JSON.stringify(j.pack, null, 1) + '\n');
    frozen++;
    console.log('  froze', q.id, q.query, j.pack.items.length + ' lines', (j.pack.rails || []).filter(x => x.n > 0).length + ' rails answered', Math.round((Date.now() - t0) / 1000) + 's');
  } catch (e) { console.log('  error', q.id, String(e && e.message).slice(0, 120)); }
}
console.log('\nfroze ' + frozen + ' of ' + queries.length + ' packs into tools/bench/packs/');
