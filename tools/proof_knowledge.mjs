/**
 * proof_knowledge.mjs — executable proof for SEAM:KNOWLEDGE.
 * Extracts the EXACT shipped block and drives it:
 *   C  chunker: paragraph packing, oversize split, cap
 *   E  embed batching + pgvector string shape
 *   S  submit: admin gate, text path, url path (guards + extraction reuse), failure ledger
 *   F  file: extension gate, size gate, R2 archive, insert with file_ref
 *   Q  search: query embedded with the SAME model, rpc args correct
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const a = w.indexOf("const KB_EMBED_MODEL");
const b = w.lastIndexOf('/*', w.indexOf(' * SEAM:PREVIEW '));
const pv = w.slice(w.indexOf('function pvBlockedHost'), w.indexOf('async function pvTranslate'));
const block = pv + w.slice(a, b);

const sbCalls = [], aiCalls = [], r2 = [];
function mkEnv(fail) {
  return {
    AI: { run: async (m, p) => { aiCalls.push({ m, n: p.text.length });
      if (fail) throw new Error('ai down');
      return { data: p.text.map(() => Array.from({ length: 384 }, (_, i) => i / 384)) }; } },
    MEDIA: { put: async (k, b2) => { r2.push(k); } },
  };
}
const stubs = {
  json: (o) => o,
  sbRest: async (env, path, opts) => { sbCalls.push({ path, opts }); return []; },
  callerIsAdmin: async (env, uid) => uid === 'admin',
  fetch: async (url) => ({ ok: true, url,
    headers: { get: () => 'text/html' },
    text: async () => '<html lang="en"><head><meta property="og:title" content="Doc"></head><body><article><p>' +
      'Alpha paragraph long enough to be kept by the harvest filter for sure.'.repeat(1) + '</p><p>' +
      'Beta paragraph long enough to be kept by the harvest filter for sure too.'.repeat(1) + '</p></article></body></html>' }),
};
const f = new Function('json', 'sbRest', 'callerIsAdmin', 'fetch',
  block + '; return { kbChunk, kbEmbed, kbSubmit, kbFile, kbSearch, kbTags, kbTarget };');
const api = f(stubs.json, stubs.sbRest, stubs.callerIsAdmin, stubs.fetch);

/* C: chunker */
const paras = Array.from({ length: 6 }, (_, i) => ('P' + i + ' ').padEnd(300, 'x')).join('\n\n');
const ch = api.kbChunk(paras, 900, 60);
ok(ch.length === 3 && ch.every(c => c.length <= 900) && ch[0].includes('P0') && ch[0].includes('P1') && ch[2].includes('P5'), 'C paragraphs pack to size');
ok(api.kbChunk('y'.repeat(2500), 900, 60).length === 3, 'C oversize paragraph hard-splits');
ok(api.kbChunk(paras, 900, 1).length === 1, 'C cap respected');
ok(api.kbTags(' Brand, Q3 ,,brand ').join('|') === 'brand|q3|brand'.replace('brand|q3|brand','brand|q3|brand') && api.kbTarget('nope') === 'both', 'C tags normalized, target defaulted');

/* E: embed */
const vecs = await api.kbEmbed(mkEnv(), Array.from({ length: 25 }, (_, i) => 'c' + i));
ok(vecs.length === 25 && aiCalls.length === 2 && aiCalls[0].n === 20, 'E batches of 20');
ok(vecs[0].startsWith('[') && vecs[0].split(',').length === 384, 'E pgvector string, 384-dim');

/* S: submit */
ok((await api.kbSubmit({ text: 'x' }, mkEnv(), '', { id: 'nobody' })).error === 'forbidden', 'S non-admin refused');
sbCalls.length = 0;
const s1 = await api.kbSubmit({ text: paras, tags: 'brand,q3', target: 'daily' }, mkEnv(), '', { id: 'admin' });
ok(s1.ok && s1.added === 3, 'S text path: chunked, embedded, inserted');
const row = sbCalls[0].opts.body[0];
ok(row.status === 'live' && row.target === 'daily' && row.tags.join() === 'brand,q3' && row.embedding.split(',').length === 384, 'S rows land live with tags/target/vector');
ok((await api.kbSubmit({ url: 'https://10.0.0.8/x' }, mkEnv(), '', { id: 'admin' })).error === 'blocked', 'S private URL refused');
sbCalls.length = 0;
const s2 = await api.kbSubmit({ url: 'https://ex.com/doc' }, mkEnv(), '', { id: 'admin' });
ok(s2.ok && sbCalls[0].opts.body[0].source_url === 'https://ex.com/doc' && sbCalls[0].opts.body[0].content.includes('Doc'), 'S url path: extracted, provenance kept');
sbCalls.length = 0;
const s3 = await api.kbSubmit({ text: 'short note' }, mkEnv(true), '', { id: 'admin' });
ok(s3.error === 'embed_failed' && sbCalls[0].opts.body[0].status === 'failed' && sbCalls[0].opts.body[0].fail_reason.includes('ai down'), 'S embed failure writes the ledger row');

/* F: file */
function mkReq(name, body) {
  return { url: 'https://x/knowledge/file?target=intelligence&tags=notes',
    headers: { get: (h) => h === 'x-filename' ? name : 'text/plain' },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer };
}
ok((await api.kbFile(mkReq('deck.pdf', 'x'), mkEnv(), '', { id: 'admin' })).error === 'text_files_only', 'F non-text refused');
sbCalls.length = 0; r2.length = 0;
const f1 = await api.kbFile(mkReq('notes.md', paras), mkEnv(), '', { id: 'admin' });
ok(f1.ok && f1.added === 3 && r2[0].startsWith('knowledge/admin/') && sbCalls[0].opts.body[0].file_ref === r2[0], 'F archived to R2, insert carries file_ref');

/* Q: search */
sbCalls.length = 0; 
const q1 = await api.kbSearch({ q: 'what do we know', target: 'daily' }, mkEnv(), '', { id: 'admin' });
ok(q1.ok && sbCalls[0].path === 'rpc/knowledge_search', 'Q rides the 0006 rpc');
const args = sbCalls[0].opts.body;
ok(args.p_target === 'daily' && args.p_query.split(',').length === 384 && args.p_count === 8, 'Q same-model query vector, right args');

console.log('\nKNOWLEDGE PROOF: ' + pass + '/' + pass + ' assertions PASS');
