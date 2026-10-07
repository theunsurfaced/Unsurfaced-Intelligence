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
  trim + pmj + ej + block + '; return { HOUSE_READ, readLand, readRoute, readPruneRefusal, readPruneStandId, readSellable, SELL_LAW, wkIssueFromRead, wkCoverStory, readStatsCounts, readStatsWithCounts, readGroundOf };')(
  sbRest, async () => ({ ok: true }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve());

const K = R.HOUSE_READ.KINDS;
ok(K.weekly.max_tokens === 40000 && K.monthly.max_tokens === 56000 && K.record.max_tokens === 32000, 'F1 room: 40k weekly, 56k monthly (EX17: the Week of Sep 28 used 19,724 of 20,000), 32k record');
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
  && R.readPruneRefusal({ id: 2, version: 2, status: 'published' }, vs, 2).error === 'on_the_stand' && R.readPruneRefusal({ id: 2, version: 2, status: 'published' }, vs, null).error === 'on_the_stand'
  && R.readPruneRefusal({ id: 1, version: 1, status: 'compiling' }, vs).error === 'still_compiling'
  && R.readPruneRefusal({ id: 1, version: 1, status: 'held' }, [{ id: 1, version: 1, status: 'held' }]).error === 'newest_version',
  'P1 an older cut may go; the newest cut of its window stays (a failed newer cut does not count), the stand\'s stays (and a published cut stays when the stand is unknown), a compiling one stays');
// P5 guards the v5 incident: issue 001 was re-staged on v6 and v5, still published, could not be deleted.
const vp = [{ id: 10, version: 5, status: 'published' }, { id: 14, version: 6, status: 'published' }, { id: 15, version: 7, status: 'held' }];
ok(R.readPruneStandId({ kind: 'report' }, vp, [{ house_read_id: 14 }]) === 14 && R.readPruneStandId({ kind: 'report' }, vp, []) === null
  && R.readPruneStandId({ kind: 'weekly' }, vp, []) === 14 && R.readPruneStandId({ kind: 'weekly' }, [{ id: 1, version: 1, status: 'held' }], []) === null
  && R.readPruneRefusal({ id: 10, version: 5, status: 'published' }, vp, 14) === null && R.readPruneRefusal({ id: 14, version: 6, status: 'published' }, vp, 14).error === 'on_the_stand',
  'P5 the stand carries one cut per window (the report shelf\'s read; the newest published weekly); a published cut it has replaced may go, the cut it carries never does');
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
  'P4 the door is routed; the page offers Delete this version on any cut that is not compiling, confirms first, and explains a refusal');

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

// ── SEAM:WEEKLY_SHELF: a ready weekly becomes the next issue on the stand ──
const wkRow = { id: 15, kind: 'weekly', version: 1, status: 'ready', window_start: '2026-09-28', window_end: '2026-10-04', label: 'Week of Sep 28, 2026',
  stats: { stories: 84, editions: 7, sources_distinct: 16, issues: { first: 76, last: 82 }, threads: [{ t: 1 }, { t: 2 }, { t: 3 }], by_territory: { music: 20, tech: 30, food: 0 }, by_format: { dispatch: 50, provocation: 4 } },
  read: { title: 'Permission became the product', thesis: 'Three sentences.', patterns: [{ name: 'p', lead_image: 'S900', evidence: ['S901'] }] } };
const wi = R.wkIssueFromRead(wkRow, 3, { pages: 14, bytes: 2500000 }, 'weekly/cover-003.jpg', 'Billboard');
ok(wi.issue_no === 3 && wi.week_start === '2026-09-28' && wi.lead === 'Permission became the product' && wi.stories_read === 84 && wi.editions === 7 && wi.sources === 16 && wi.threads === 3 && wi.issue_range === 'Issues 076 to 082'
  && wi.r2_key === 'weekly/issue-003.pdf' && wi.cover_key === 'weekly/cover-003.jpg' && wi.cover_credit === 'Billboard' && wi.page_count === 14 && wi.byte_size === 2500000 && wi.status === 'published' && wi.published_at,
  'W1 the shelf row is built from the read: the week, the lead and standfirst, the database counts, the issue range, the cover, the PDF');
ok(R.wkCoverStory(wkRow.read) === 'S900' && R.wkCoverStory({ cover_image: 'S7', patterns: [{ lead_image: 'S900' }] }) === 'S7' && R.wkCoverStory({ patterns: [{ evidence: ['L1', 'S44'] }] }) === 'S44' && R.wkCoverStory({}) === null,
  'W2 the cover is the house pick, else the first pattern\'s lead image, else the first cited story');
fixtures = { 'house_reads?id=eq.': () => [wkRow], 'weekly_issues?week_start=eq.2026-09-28': () => [{ issue_no: 2 }], 'editions?': () => [], 'edition_items?': () => [] };
const wOn = await R.readRoute('/reads/weekly-stand', { id: 15 }, {}, '', { id: 'admin' });
ok(!wOn.ok && wOn.error === 'week_on_stand' && wOn.issue_no === 2, 'W3 a week already on the stand is a replace, never a second issue');
ok((await R.readRoute('/reads/weekly-stand', { id: 15 }, {}, '', { id: 'x' }))._status === 403 && /return wkStandNew\(env, row, origin, user\)/.test(w) && /id="stand-weekly-new">Put this week on the stand as the next issue/.test(page),
  'W4 admin only; a weekly with no issue on the stand offers to become the next one on its read page');

// ── SEAM:READ_COUNTS: the counts a writer reaches for are figures ──
const cnt = R.readStatsCounts(wkRow.stats);
ok(cnt.territory === 2 && cnt.format === 2 && cnt.threads === 3 && R.readStatsWithCounts(wkRow.stats).counts.territory === 2 && R.readStatsWithCounts({ counts: { x: 1 } }).counts.x === 1,
  'C1 counts: territories and formats with stories (zero does not count), threads; a block that has counts keeps them');
ok(/"counts":\{"territory":2,"format":2,"threads":3\}/.test(R.readGroundOf(wkRow, [])) && !/"counts"/.test(R.readGroundOf({ kind: 'report', stats: { lake: {} } }, [])),
  'C2 the ground of a weekly carries the counts even when the row was submitted before they existed; the report\'s ground is its own');
ok(/else stats = readStatsWithCounts\(stats\);/.test(w) && /never add counts together/.test(w) && /The block's `counts` says how many territories/.test(w),
  'C3 the counts are written into STATS at submit; the Method forbids sums and sends the writer to counts');
// C4 guards the Sep 21 incident: a comment swallowed the story lines and every story figure was held.
const gStory = R.readGroundOf(wkRow, [{ headline: 'Meta sells 462 pairs by 2030', take: 'The take says 3.8 billion.', apply: 'Apply 95 percent.', date: '2026-09-23', issue_no: 111 }]);
const gLake = R.readGroundOf({ kind: 'report', stats: { lake: {} }, meta: { pack: { text: 'L1 lake line 777' } } }, [{ headline: 'S line 888', take: '', apply: '', date: '2026-09-23', issue_no: 1 }]);
ok(/462 pairs by 2030/.test(gStory) && /3\.8 billion/.test(gStory) && /95 percent/.test(gStory) && /2026-09-23 111/.test(gStory) && /S line 888[\s\S]*lake line 777/.test(gLake),
  'C4 the ground carries every story\'s headline, take, apply, date and issue number, and the pack text after them; a figure a story states is never held');

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
