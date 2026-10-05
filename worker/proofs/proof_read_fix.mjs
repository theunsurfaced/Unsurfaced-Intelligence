/**
 * proof_read_fix.mjs  --  arc 3.1: room, tolerant landing, truncation label, reland.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
let sb = [], fixtures = {};
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent',
  trim + pmj + ej + block + '; return { HOUSE_READ, readLand, readRoute, readPruneRefusal, readSellable, SELL_LAW };')(
  sbRest, async () => ({ ok: true }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve());

const K = R.HOUSE_READ.KINDS;
ok(K.weekly.max_tokens === 20000 && K.monthly.max_tokens === 28000 && K.record.max_tokens === 32000, 'F1 room: 20k weekly, 28k monthly, 32k record');
ok(K.weekly.effort === 'medium' && K.monthly.effort === 'medium' && K.record.effort === 'high', 'F1b effort: medium weekly and monthly, high record');
ok(/MAX_TOKENS: 128000,/.test(w), 'F2 lane ceiling admits the record and the report (Fable writes up to 128000)');

const row = (status) => [{ id: 1, kind: 'weekly', status, window_start: '2026-09-14', window_end: '2026-09-20', stats: { stories: 2 }, pack_ids: [11], label: 'Week' }];
function fx(status) { fixtures = { 'house_reads?id=eq.': () => row(status), 'editions?': () => [], 'edition_items?': () => [] }; }
const patchOf = () => sb.filter(x => x.opts && x.opts.method === 'PATCH').pop().opts.body;

fx('compiling'); sb = [];
const fenced = '```json\n{"title":"Proximity sells","thesis":"Tickets moved fast.",}\n```';
const r1 = await R.readLand({}, 1, fenced, 0.3, 'end_turn');
ok(r1.status === 'ready', 'F3 fenced JSON with a trailing comma lands ready (extractJson)');
fx('compiling'); sb = [];
const r2 = await R.readLand({}, 1, '{"title":"Proximity sells","thesis":"Tickets mo', 0.3, 'max_tokens');
ok(r2.status === 'held' && patchOf().error === 'truncated_max_tokens', 'F4 a cut-off read is labeled truncated_max_tokens');
fx('compiling'); sb = [];
await R.readLand({}, 1, 'not json at all', 0.3, 'end_turn');
ok(patchOf().error === 'unparsable', 'F5 real garbage is still unparsable');

fx('held'); sb = [];
fixtures['claude_jobs?kind=eq.house_weekly'] = () => [{ result: '{"title":"Proximity sells","thesis":"Tickets moved fast."}', cost_usd: '0.29', stop_reason: 'end_turn' }];
const r3 = await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'admin' });
ok(r3.ok && r3.status === 'ready', 'F6 /reads/reland salvages a held read from stored text');
ok(sb.some(x => /meta->>house_read_id=eq\.1/.test(x.path)), 'F7 reland reads the stored job, spends nothing');
fx('ready');
ok((await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'admin' })).error === 'not_held', 'F8 only held reads can be re-landed');
ok((await R.readRoute('/reads/reland', { id: 1 }, {}, '', { id: 'x' }))._status === 403, 'F9 admin only');
ok(/readLand\(env, row\.meta\.house_read_id, patch\.result, patch\.cost_usd, patch\.stop_reason\)/.test(w), 'F10 the drain passes stop_reason');
ok(/case '\/reads\/reland':/.test(w), 'F11 reland routed');

// ── SEAM:READ_PRUNE: an old version goes; the newest, the stand's and a compiling one stay ──
const vs = [{ id: 1, version: 1, status: 'held' }, { id: 2, version: 2, status: 'ready' }, { id: 3, version: 3, status: 'failed' }];
ok(R.readPruneRefusal({ id: 1, version: 1, status: 'held' }, vs) === null && R.readPruneRefusal({ id: 2, version: 2, status: 'ready' }, vs).error === 'newest_version'
  && R.readPruneRefusal({ id: 2, version: 2, status: 'published' }, vs).error === 'on_the_stand' && R.readPruneRefusal({ id: 1, version: 1, status: 'compiling' }, vs).error === 'still_compiling'
  && R.readPruneRefusal({ id: 1, version: 1, status: 'held' }, [{ id: 1, version: 1, status: 'held' }]).error === 'newest_version',
  'P1 an older cut may go; the newest cut of its window stays (a failed newer cut does not count), the stand\'s stays, a compiling one stays');
let deleted = [], media = [];
fixtures = { 'house_reads?id=eq.': (path, opts) => { if (opts && opts.method === 'DELETE') { deleted.push(path); return [{ id: 1 }]; } return [{ id: 1, kind: 'weekly', version: 1, status: 'held', window_start: '2026-09-14', window_end: '2026-09-20', label: 'Week', meta: { pdf: { key: 'reads/pdf/1/abc.pdf' } } }]; },
  'house_reads?kind=eq.weekly&window_start=eq.2026-09-14': () => vs, 'editions?': () => [], 'edition_items?': () => [] };
const envM = { MEDIA: { delete: async k => { media.push(k); } } };
const p1 = await R.readRoute('/reads/delete', { id: 1 }, envM, '', { id: 'admin' });
ok(p1.ok && p1.id === 1 && p1.pdf === true && deleted.length === 1 && /house_reads\?id=eq\.1$/.test(deleted[0]) && media[0] === 'reads/pdf/1/abc.pdf', 'P2 /reads/delete removes the row and its rendered PDF, admin only');
fixtures['house_reads?id=eq.'] = () => [{ id: 2, kind: 'weekly', version: 2, status: 'ready', window_start: '2026-09-14', window_end: '2026-09-20', label: 'Week', meta: {} }];
deleted = [];
const p2 = await R.readRoute('/reads/delete', { id: 2 }, envM, '', { id: 'admin' });
ok(!p2.ok && p2.error === 'newest_version' && !deleted.length && (await R.readRoute('/reads/delete', { id: 2 }, envM, '', { id: 'x' }))._status === 403, 'P3 the newest cut is refused before anything is touched; admin only');
ok(/case '\/reads\/delete':/.test(w) && /id="prune">Delete this version/.test(page) && /PRUNE_WHY/.test(page) && /window\.confirm\("Delete "/.test(page) && /SEAM:READ_PRUNE/.test(page),
  'P4 the door is routed; the page offers Delete this version on a cut that is not on the stand or compiling, confirms first, and explains a refusal');

// ── SEAM:SELL_LAW: may this read carry a price? ──
const good = () => ({ id: 9, kind: 'report', status: 'ready', version: 5, window_start: '2026-07-08', window_end: '2026-10-03', violations: ['proofread:12'], meta: { issue_no: 1, proof: { lane: 'live', reason: null, changes: 12 } },
  stats: { lake: { shape: { music: {} }, prior_comparable: false } },
  read: { title: 't', thesis: 't', findings: [1, 2].map(i => ({ name: 'f' + i, advantage: 'e', trigger: 't', against: { line: 'a', evidence: [] }, reach: 'category', horizon: 'now', voices: ['V1'], supports: { outlets: 3 },
    moves: { creative: 'c', marketer: 'm', founder: 'f', exec: 'e', talent: 't' } })) } });
ok(R.readSellable(good()).ok === true && R.readSellable(good()).fails.length === 0, 'S1 a read whose receipts say everything may carry a price');
let g = good(); g.status = 'held'; g.violations = ['number_not_in_evidence:x:570', 'proofread:0']; g.meta.proof = { lane: null, reason: 'claude_network' };
let sf = R.readSellable(g).fails;
ok(sf.includes('not_ready:held') && sf.includes('holds_remain') && sf.includes('desk_did_not_run:claude_network'), 'S2 a held read with a number hold and no desk pass fails on all three, named');
g = good(); g.violations = ['house_word:findings[5].what_the_data_shows:the Lake', 'id_in_prose:findings[4].x:V1', 'proofread:3']; g.stats = { lake: {} }; g.read.findings[0].voices = []; g.read.findings[1].voices = [];
sf = R.readSellable(g).fails;
ok(sf.includes('reader_law:2') && sf.includes('no_shape') && sf.includes('voices:0_of_2'), 'S3 house words in the prose, a missing shape and no consumer voices on the findings each keep a price off it');
g = good(); delete g.read.findings[1].against; g.read.findings[1].reach = null; g.read.findings[1].moves.talent = ''; g.read.findings[1].supports.outlets = 1; delete g.meta.issue_no;
sf = R.readSellable(g).fails;
ok(sf.includes('finding_2:against+reach_horizon+moves+outlets') && sf.includes('no_issue_no') && !sf.some(f => /^finding_1/.test(f)), 'S4 a finding missing its counter-reading, reach, a move or a second outlet is named by number; an unnumbered issue cannot be sold');
ok(R.readSellable(null).fails.includes('not_written') && R.SELL_LAW.VOICED_FINDINGS === 2, 'S5 nothing written, nothing sold');
fixtures = { 'house_reads?id=eq.': () => [good()], 'report_issues?issue_no=eq.1&select=house_read_id': () => [{ house_read_id: 9 }], 'report_issues?issue_no=eq.1': () => [{ issue_no: 1, status: 'draft' }], 'editions?': () => [], 'edition_items?': () => [] };
sb = [];
const live = await R.readRoute('/reads/shelf', { issue_no: 1, status: 'published' }, {}, '', { id: 'admin' });
ok(live.ok && sb.some(x => x.opts && x.opts.method === 'PATCH' && x.opts.body && x.opts.body.status === 'published'), 'S6 the switch sends a sellable issue live');
const bad = good(); bad.read.findings[0].voices = []; bad.read.findings[1].voices = [];
fixtures['house_reads?id=eq.'] = () => [bad]; sb = [];
const refused = await R.readRoute('/reads/shelf', { issue_no: 1, status: 'published' }, {}, '', { id: 'admin' });
ok(!refused.ok && refused.error === 'not_sellable' && refused.fails.includes('voices:0_of_2') && !sb.some(x => x.opts && x.opts.method === 'PATCH'), 'S7 the switch refuses to send live what the sell law refuses, with the reasons, and changes nothing');
const standRefused = await R.readRoute('/reads/stand', { id: 9, live: true }, {}, '', { id: 'admin' });
ok(!standRefused.ok && standRefused.error === 'not_sellable', 'S8 staging straight to live is refused the same way');
ok(/sell: readSellable\(row\)/.test(w) && /case '\/reads\/cover':/.test(w), 'S9 /reads/get carries the verdict for the page; the cover door is routed');
// the cover door
fixtures['house_reads?id=eq.'] = () => [Object.assign(good(), { pack_ids: [11, 12], read: { title: 't', thesis: 't', cover_image: 'S11' } })];
fixtures = Object.assign({ 'edition_items?id=eq.12': () => [{ id: 12, image_url: 'https://x/y.jpg' }], 'edition_items?id=eq.13': () => [] }, fixtures);   // the specific keys first; the fake matches by prefix
sb = [];
const cv = await R.readRoute('/reads/cover', { id: 9, sid: 'S12' }, {}, '', { id: 'admin' });
const cvPatch = sb.filter(x => x.opts && x.opts.method === 'PATCH').pop();
ok(cv.ok && cv.cover_image === 'S12' && cvPatch && cvPatch.opts.body.read.cover_image === 'S12' && cvPatch.opts.body.read.title === 't', 'S10 the cover pick sets the cover story on the read; the rest of the read is untouched');
ok((await R.readRoute('/reads/cover', { id: 9, sid: 'S13' }, {}, '', { id: 'admin' })).error === 'not_in_the_read' && (await R.readRoute('/reads/cover', { id: 9, sid: 'L1' }, {}, '', { id: 'admin' })).error === 'not_in_the_read',
  'S11 only a story the read cites can be the cover');

// estimate: cached prefix priced at the cache-write rate
const lane = w.slice(w.indexOf('/* SEAM:CLAUDE_ROUTE: the paid lane'), w.indexOf('/* A COMPLETE SENTENCE UNDER EVERY HEADLINE'));
const L = new Function('sbRest', 'logEvent', 'json', 'callerIsAdmin', 'fetch', lane + '; return { claudeEstimate, claudeParams };')(sbRest, () => {}, (o) => o, async () => false, async () => ({}));
const sys = 'M'.repeat(35000);
const cached = L.claudeEstimate(L.claudeParams('doc', { system: sys, cache: true, prompt: 'p', max_tokens: 10 }), false);
const plain = L.claudeEstimate(L.claudeParams('doc', { system: sys, prompt: 'p', max_tokens: 10 }), false);
ok(cached > plain, 'F12 a cached system prompt is estimated at the cache-write rate');

ok(/thinking: \{ type: 'adaptive' \}, output_config: \{ effort: K\.effort \}/.test(w) && !/type: 'enabled'/.test(w), 'F13 every read asks for adaptive thinking at its effort, never enabled');
const pa = L.claudeParams('doc', { prompt: 'p', thinking: { type: 'adaptive' }, output_config: { effort: 'high' } });
ok(pa.thinking.type === 'adaptive' && pa.output_config.effort === 'high', 'F14 the lane passes adaptive thinking and effort through');
ok(/error: txt \? null : 'no_text:'/.test(w), 'F15 a job that returns no text records its block types');

console.log(`\nproof_read_fix: ${pass} checks PASS`);
