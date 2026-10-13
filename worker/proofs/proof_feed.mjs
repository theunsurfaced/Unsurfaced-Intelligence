/**
 * proof_feed.mjs  --  EX45 THE FEED (SEAM:FEED_BRIDGE, SEAM:STUDIO_LOOK).
 * A drop reaches the lake (citable, counted in nothing) and, when shareable, STUDIO; an internal drop is never cut;
 * a draft that invents a figure is refused; the panel says where a drop went. STUDIO is drawn in the Weekly's hand:
 * the story's photograph, the fade, the counter, the source, the closer; no em dash on any asset.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const mig = fs.readFileSync('supabase/migrations/0047_feed.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const fn = name => { const a = w.indexOf('function ' + name + '('); const b = w.indexOf('\n}\n', a); return w.slice(a, b + 3); };

// ── the worker's FEED and STUDIO halves, exact shipped code ──────────────
const kbA = w.indexOf('const KB_EMBED_MODEL'), kbB = w.indexOf('/* ═', w.indexOf('async function kbDelete('));
const stA = w.indexOf('const STUDIO_VOICE'), stB = w.indexOf('function studioSlate(');
let sb = [], fixtures = {}, lakeCalls = [], modelCalls = [], modelReply = null, events = [];
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const K = new Function('sbRest', 'callerIsAdmin', 'json', 'logEvent', 'lakeCapture', 'territoryGuess', 'callModel', 'pvBlockedHost', 'pvExtract',
  fn('jsonRepair') + fn('extractJson') + fn('parseModelJson') + w.slice(stA, stB) + w.slice(kbA, kbB) +
  '; return { kbDrop, kbTitleOf, kbMirrorItems, kbNumsOK, kbSubmit, kbFile, kbList, kbCutRoute, kbUsed, kbDelete, kbCut, KB_FEED, KB_DRAFT_SYS };')(
  sbRest, async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s || 200 }, o), (...a) => { events.push(a); return Promise.resolve(); },
  async (env, items, prov) => { lakeCalls.push({ items, prov }); return items.length; }, () => 'fashion-beauty',
  async (env, tier, messages, opts) => { modelCalls.push({ tier, messages, opts }); return typeof modelReply === 'function' ? modelReply(messages, opts) : modelReply; },
  () => false, () => ({ title: 't', paragraphs: [] }));
const env = { AI: { run: async (m, x) => ({ data: x.text.map(() => [0.1, 0.2, 0.3]) }) } };
const admin = { id: 'admin' };
const DROP = 'Field notes from Atlanta, October 2026. Three salons on Edgewood now stock the same clip-in bang line. Two stylists said clients ask for it by name after seeing it on TikTok.\n\nOwners report the line sells out within 10 days of each delivery.';
const draftOK = JSON.stringify({ kicker: 'Salon floor', headline: 'Clip-in bangs are selling out of Atlanta salons', take: 'Three salons on Edgewood stock the same clip-in bang line, and owners report it sells out within 10 days of each delivery.', apply: 'Brands with a clip-in line: stock the salon, not only the shelf.', format: 'number' });
const reset = () => { sb = []; fixtures = {}; lakeCalls = []; modelCalls = []; events = []; };
const posts = path => sb.filter(x => x.path.startsWith(path) && x.opts && x.opts.method === 'POST');

// ── D: the drop's own fields ────────────────────────────────────────────
const d0 = K.kbDrop(k => ({ title: '  Atlanta — field notes ', shareable: true, assets: 'true' })[k]);
ok(K.KB_FEED.KEY_RX.test(d0.drop_key) && d0.title === 'Atlanta : field notes' && d0.shareable === true && d0.assets === true, 'D1 every drop gets a key, a clean title (no em dash) and its flags, from a body');
const d1 = K.kbDrop(k => ({ shareable: '0', assets: '1' })[k]);
ok(d1.title === null && d1.shareable === false && d1.assets === true, 'D2 and from a file upload\'s query string; internal is the default');
ok(K.kbTitleOf(DROP) === 'Field notes from Atlanta, October 2026.', 'D3 a drop with no title is named by its first sentence');
const mi = K.kbMirrorItems({ drop_key: 'dabc1234', title: 'Atlanta salons', chunks: ['one', 'two'] });
ok(mi.length === 2 && mi[0].url === 'https://unsurfaced-intelligence.com/#desk-dabc1234-1' && mi[1].title === 'Atlanta salons (2 of 2)' && mi.every(x => x.source_name === 'Unsurfaced desk' && x.source_tier === 2 && x.rail === 'feed'),
  'D4 the lake copy: one row a chunk, each with its own address, cited as the Unsurfaced desk');
ok(K.kbMirrorItems({ drop_key: 'dabc1234', source_url: 'https://x.com/a#b', chunks: ['one'] })[0].url === 'https://x.com/a#desk-dabc1234-1', 'D5 a link drop keeps its own address');

// ── S: one drop, every destination ──────────────────────────────────────
reset(); modelReply = draftOK;
const s1 = await K.kbSubmit({ text: DROP, target: 'both', title: 'Atlanta salon notes', shareable: true, assets: true }, env, '', admin);
const kbRows = posts('knowledge_base')[0].opts.body;
ok(s1.ok && s1.added === kbRows.length && kbRows.every(r => r.drop_key === s1.drop_key && r.title === 'Atlanta salon notes' && r.shareable === true && r.status === 'live'), 'S1 every chunk is written with the drop\'s key, title and flag');
ok(lakeCalls.length === 1 && lakeCalls[0].prov.provenance === 'recon_feed' && lakeCalls[0].prov.query === 'feed:' + s1.drop_key && s1.lake.lake === lakeCalls[0].items.length,
  'S2 a BOTH drop is mirrored into the lake as recon_feed: research by 0038\'s rule, citable, counted in nothing');
ok(modelCalls.length >= 1 && modelCalls[0].opts.sensitive === true && /Every figure, date and name you print must appear in the drop/.test(modelCalls[0].messages[0].content) && /THE DROP \(Atlanta salon notes\):/.test(modelCalls[0].messages[1].content),
  'S3 the draft rides Workers AI on the sensitive tier, told every figure must be in the drop');
const piece = posts('content_pieces')[0].opts.body[0];
ok(s1.studio.ok && piece.format === 'signal_still' && piece.status === 'draft' && piece.payload.source === 'feed' && piece.payload.drop_key === s1.drop_key && piece.payload.story_id === null &&
  piece.payload.source_name === 'Unsurfaced desk' && /^feed drop: number-led finding/.test(piece.payload.selection) && piece.payload.story >= 100, 'S4 a shareable drop is cut into STUDIO: the selector\'s format, tagged feed with its drop, on its own story line');
ok(typeof piece.copy.caption === 'string' && piece.copy.caption.length > 0, 'S5 the caption comes from STUDIO\'s caption writer');

reset(); modelReply = draftOK;
const s2 = await K.kbSubmit({ text: DROP, target: 'both', assets: true }, env, '', admin);
ok(s2.ok && s2.studio.error === 'internal' && posts('content_pieces').length === 0 && lakeCalls.length === 1, 'S6 an internal drop feeds the lake and is never cut into a public asset');
reset(); modelReply = draftOK;
const s3 = await K.kbSubmit({ text: DROP, target: 'daily', shareable: true, assets: true }, env, '', admin);
ok(s3.ok && s3.lake.skipped === 'target_daily' && lakeCalls.length === 0 && s3.studio.ok, 'S7 a DAILY drop goes to STUDIO, not the lake');
reset();
const s4 = await K.kbSubmit({ text: DROP, target: 'intelligence', shareable: true, assets: true }, env, '', admin);
ok(s4.studio.error === 'target_intelligence' && posts('content_pieces').length === 0 && lakeCalls.length === 1, 'S8 an INTELLIGENCE drop goes to the lake, not STUDIO');
reset(); modelReply = JSON.stringify({ kicker: 'Salon', headline: 'Clip-in bang sales rose 40% in Atlanta', take: 'Owners report the line sells out.', apply: 'x', format: 'number' });
const s5 = await K.kbSubmit({ text: DROP, target: 'both', shareable: true, assets: true }, env, '', admin);
ok(s5.studio.error === 'draft_invented_a_figure' && posts('content_pieces').length === 0, 'S9 a draft that prints a figure the drop does not give is refused; nothing is cut');
reset(); modelReply = draftOK;
const s6 = await K.kbSubmit({ text: DROP, target: 'both' }, env, '', admin);
ok(s6.ok && !s6.studio && lakeCalls.length === 1, 'S10 without Make assets the drop feeds the base and the lake only');
ok((await K.kbSubmit({ text: DROP }, env, '', { id: 'x' }))._status === 403, 'S11 admin only');

// ── C, U, X: cut later, where it went, remove it ─────────────────────────
reset(); modelReply = draftOK;
fixtures['knowledge_base?drop_key=eq.dabc1234&status=eq.live'] = () => [{ id: 1, content: DROP, title: 'Atlanta salon notes', target: 'both', shareable: false }];
const c1 = await K.kbCutRoute({ drop_key: 'dabc1234' }, env, '', admin);
ok(c1.error === 'internal' && posts('content_pieces').length === 0, 'C1 an internal drop is not cut later either');
const c2 = await K.kbCutRoute({ drop_key: 'dabc1234', shareable: true }, env, '', admin);
ok(c2.ok && c2.shareable === true && sb.some(x => x.path === 'knowledge_base?drop_key=eq.dabc1234' && x.opts && x.opts.method === 'PATCH' && x.opts.body.shareable === true) && posts('content_pieces').length === 1,
  'C2 asked on purpose, the drop is marked shareable and cut');
ok((await K.kbCutRoute({ drop_key: 'nope; drop table' }, env, '', admin)).error === 'bad_drop', 'C3 a drop key is checked before it reaches a query');
reset();
fixtures['knowledge_base?drop_key=eq.dabc1234&select=title'] = () => [{ title: 'Atlanta salon notes', content: DROP, target: 'both', shareable: true }];
fixtures['signals?momentum->>query=eq.feed%3Adabc1234'] = () => [{ id: 'a' }, { id: 'b' }];
fixtures['content_pieces?payload->>drop_key=eq.dabc1234'] = () => [{ id: 9, day: '2026-10-13', format: 'signal_still', platform: 'instagram', status: 'draft' }];
fixtures['house_reads?meta->pack->>text=ilike.'] = () => [{ id: 31, kind: 'report', label: 'October 2026', version: 1, status: 'ready' }];
const u1 = await K.kbUsed({ drop_key: 'dabc1234' }, env, '', admin);
ok(u1.ok && u1.lake === 2 && u1.studio.length === 1 && u1.reads[0].id === 31 && sb.some(x => /house_reads\?meta->pack->>text=ilike\.\*Atlanta\*salon\*notes\*&/.test(x.path)), 'U1 Used: the lake rows, the STUDIO pieces and the reads whose pack cites the drop');
reset();
const x1 = await K.kbDelete({ drop_key: 'dabc1234' }, env, '', admin);
ok(x1.ok && sb.some(x => x.path === 'knowledge_base?drop_key=eq.dabc1234' && x.opts.method === 'DELETE') && sb.some(x => x.path === 'signals?momentum->>query=eq.feed%3Adabc1234' && x.opts.method === 'DELETE'), 'X1 removing a drop removes every chunk and its lake copies');
reset(); await K.kbDelete({ id: 7 }, env, '', admin);
ok(sb.some(x => x.path === 'knowledge_base?id=eq.7' && x.opts.method === 'DELETE'), 'X2 an older row (no key) is still removed one at a time');
reset(); await K.kbList(env, '', admin);
ok(/select=id,content,source_url,file_ref,tags,target,status,created_at,drop_key,title,shareable/.test(sb[0].path), 'X3 the list carries each row\'s drop');

// ── W: the worker's wiring ──────────────────────────────────────────────
ok(/case '\/knowledge\/cut':\s+return kbCutRoute/.test(w) && /case '\/knowledge\/used':\s+return kbUsed/.test(w), 'W1 /knowledge/cut and /knowledge/used are routed');
ok((w.match(/story_id: it\.id \|\| null/g) || []).length === 3, 'W2 every STUDIO payload carries its story id (the still, each slide of THE SIX, the admin cut)');
ok(!/callClaude\(/.test(w.slice(kbA, kbB)), 'W3 FEED never calls Claude: STUDIO stays on Workers AI (SEAM:CLAUDE_ROUTE)');
ok(/add column if not exists drop_key text/.test(mig) && /shareable boolean not null default false/.test(mig) && /knowledge_base_drop_idx/.test(mig), 'W4 migration 0047: drop_key, title, shareable (internal by default), indexed');

// ── L: STUDIO in the Weekly's hand, exact shipped code ──────────────────
const pa = page.indexOf('var BRAND = { black'), pb = page.indexOf('/* ── the counter', pa);
const win = {};
new Function('window', 'TextEncoder', 'Image', page.slice(pa, pb))(win, TextEncoder, undefined);
const T = win.STUDIO_TEMPLATES, IMG = 'https://api.unsurfaced-intelligence.com/img/s/412';
const story = { issue_no: 213, date: '2026-10-13', kicker: 'Retail', headline: 'Gen Z hair care is arriving on mass-retail shelves', take: 'Three launches in three weeks.', source_name: 'Business of Fashion' };
const st = T.signal_still(Object.assign({}, story, { img: IMG }), 'instagram')[0];
const im = st.ops.find(o => o.op === 'image'), sh = st.ops.find(o => o.op === 'shade');
ok(st.w === 1080 && st.h === 1350 && im && im.src === IMG && im.h === 760 && sh && sh.y0 === 420 && sh.y1 === 780, 'L1 the still carries the story\'s photograph and the Weekly\'s fade (760 deep, 420 to 780)');
const head = st.ops.find(o => o.op === 'wrap' && o.font === 'Syne'), take = st.ops.find(o => o.op === 'wrap' && o.font === 'Space Mono');
ok(head.y === 890 && head.size === 70 && head.max === 3 && take.follow === 30 && take.color === '#F5F0E8' && st.ops.some(o => o.op === 'rule' && o.y === 1236 && o.color === '#C41230'),
  'L2 the Weekly\'s story grid: kicker under the photograph, Syne headline, cream take following it, red rule at 1236');
ok(st.ops.some(o => o.text === 'ISSUE 213' && o.align === 'right') && st.ops.some(o => o.text === 'SOURCE · BUSINESS OF FASHION'), 'L3 the counter top right, the source on the foot');
const st0 = T.signal_still(story, 'instagram')[0];
ok(!st0.ops.some(o => o.op === 'image' || o.op === 'shade') && st0.ops.find(o => o.op === 'wrap' && o.font === 'Syne').y === 390, 'L4 no sharp photograph: the type layout, no hole where a photograph failed');
const slides = Array.from({ length: 6 }, (_, i) => ({ kicker: 'K', headline: 'Headline ' + i, take: 'T', source_name: 'S', img: i === 0 ? IMG : null }));
const six = T.the_six({ issue_no: 213, date: '2026-10-13', slides }, 'instagram');
ok(six.length === 8 && six[0].ops.some(o => o.op === 'image' && o.src === IMG && o.dim === 0.62) && six[1].ops.some(o => o.text === '1 / 6') && six[7].ops.some(o => o.text === 'The read is free. The moves are yours.'),
  'L5 THE SIX: a full-bleed cover under the 62 percent dim, six story frames counted 1 / 6, the house line to close');
ok(!six.some(f => f.ops[0].color === '#F5F0E8'), 'L6 one black frame system, as the Weekly\'s (the cream inversion retired)');
const tall = T.the_six({ issue_no: 213, date: '2026-10-13', slides }, 'tiktok');
ok(tall.every(f => f.h === 1920) && tall[1].ops.some(o => o.op === 'image' && o.h === 1100) && tall[1].ops.some(o => o.op === 'rule' && o.y === 1806), 'L7 photo mode: 1920 tall, a deeper photograph, the foot moved down');
const meas = (t, size) => String(t).length * size * 0.55;
const prog = win.studioMotionProgram({ kicker: 'k', headline: 'x', take: 'y', date: 'd', source_name: 'S' }, win.studioMotionLayout({ headline: 'x', take: 'y' }, meas));
const texts = [].concat(st.ops, st0.ops, ...six.map(f => f.ops), T.hand_meme({ mformat: 'verdict', line1: 'a', line2: 'b', issue_no: 1 }, 'instagram')[0].ops, prog.at(150).ops || prog.at(150)).filter(o => o && o.text).map(o => o.text).join(' ');
ok(!/—/.test(texts) && /THE TAKE/.test(JSON.stringify(prog.at(150))), 'L8 no em dash on any asset (the take label reads THE TAKE)');

// ── P: the paint program ────────────────────────────────────────────────
const calls = [];
const ctx = { measureText: t => ({ width: String(t).length * 20 }), fillText: (t, x, y) => calls.push(['text', t, x, y]), fillRect: (...a) => calls.push(['rect', ...a]), drawImage: (...a) => calls.push(['image', ...a]),
  save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, arc() {}, fill() {}, createLinearGradient: () => ({ addColorStop() {} }) };
const canvas = { getContext: () => ctx };
win.STUDIO_IMG[IMG] = { naturalWidth: 1600, naturalHeight: 1066 };
win.studioPaint(canvas, st);
const drawn = calls.find(c => c[0] === 'image'), takeLine = calls.find(c => c[0] === 'text' && /Three launches/.test(c[1]));
ok(drawn && Math.round(drawn[4]) === Math.round(1600 * (760 / 1066)) && drawn[5] === 760, 'P1 the photograph is drawn cover-fit into its box');
const headLines = calls.filter(c => c[0] === 'text' && c[3] >= 890 && c[3] < 1100 && !/Three/.test(c[1]));
ok(takeLine && takeLine[3] >= headLines[headLines.length - 1][3] + 30, 'P2 the take follows the headline, never overlapping it');
calls.length = 0; win.STUDIO_IMG[IMG] = null; win.studioPaint(canvas, st);
ok(!calls.some(c => c[0] === 'image'), 'P3 a photograph that did not load is never drawn');
ok(/async function framesFor\(piece\)/.test(page) && /await studioPreload\(want\)/.test(page) && /p\.img = stLoaded\(src\(p\.story_id\)\)/.test(page) &&
  /var fr = await framesFor\(piece\);\n    if \(!fr\) return null;/.test(page) && /var fr = await framesFor\(piece\); if \(!fr\) return;/.test(page), 'P4 the photographs load before the template runs, for the preview and the download');
ok(/naturalWidth >= 600 \? im : null/.test(page), 'P5 only sharp photographs (600px and wider) are used, as the Weekly\'s rule');

// ── F: the FEED panel ───────────────────────────────────────────────────
ok(/id="kbTitle"/.test(page) && /id="kbShare"/.test(page) && /id="kbAssets"/.test(page), 'F1 every drop takes a title, Shareable and Make STUDIO assets');
ok(/title: document\.getElementById\("kbTitle"\)\.value, shareable: document\.getElementById\("kbShare"\)\.checked, assets: document\.getElementById\("kbAssets"\)\.checked/.test(page) && /"&shareable=" \+/.test(page), 'F2 a paste, a link and a file all send them');
ok(/var k = r\.drop_key \|\| \("row" \+ r\.id\)/.test(page) && /api\("knowledge\/used", \{ drop_key: key \}\)/.test(page) && /api\("knowledge\/cut", \{ drop_key: key, shareable: true \}\)/.test(page) && /api\("knowledge\/delete", \{ drop_key: b\.getAttribute\("data-drop"\) \}\)/.test(page),
  'F3 drops are listed as drops, with USED, ASSETS and remove');
ok(/function kbSaid\(d\)/.test(page) && /held, the drop is internal/.test(page), 'F4 the answer says what the drop did, and why STUDIO held it');

// ── G: gate and registry ────────────────────────────────────────────────
ok(/'kbDraft': 'callModel on Workers AI/.test(gate), 'G1 kbDraft is a registered spender');
ok(seams.registry['SEAM:FEED_BRIDGE'].file === 'worker/src/index.js' && seams.registry['SEAM:FEED_BRIDGE@intelligence'].file === 'intelligence/index.html' &&
  seams.registry['SEAM:STUDIO_LOOK'].file === 'intelligence/index.html' && seams.registry['SEAM:STUDIO_LOOK@worker'].file === 'worker/src/index.js', 'G2 both seams are registered where they live');

console.log(`proof_feed: ${pass} passed`);
