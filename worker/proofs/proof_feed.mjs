/**
 * proof_feed.mjs  --  EX45 THE FEED (SEAM:FEED_BRIDGE), as RD1b leaves it.
 * A drop reaches the lake (citable, counted in nothing) and, when shareable, the day's frames: one frame in the WEEKLY grammar on
 * the latest day's set, from the desk; an internal drop is never cut; a draft that invents a figure is refused; the room says
 * where a drop went. STUDIO's pieces are not made any more; the frame is drawn by the read page with the day's others.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const house = fs.readFileSync('intelligence/read/index.html', 'utf-8');   // RD1a: the FEED panel lives in the house
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const mig = fs.readFileSync('supabase/migrations/0047_feed.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const fn = name => { const a = w.indexOf('function ' + name + '('); const b = w.indexOf('\n}\n', a); return w.slice(a, b + 3); };

// ── the worker's FEED half and the knife, exact shipped code ─────────────
const kbA = w.indexOf('const KB_EMBED_MODEL'), kbB = w.indexOf('/* ═', w.indexOf('async function kbDelete('));
let sb = [], fixtures = {}, lakeCalls = [], modelCalls = [], modelReply = null, events = [];
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const K = new Function('sbRest', 'callerIsAdmin', 'json', 'logEvent', 'lakeCapture', 'territoryGuess', 'callModel', 'pvBlockedHost', 'pvExtract', 'DAY_FRAMES',
  fn('jsonRepair') + fn('extractJson') + fn('parseModelJson') + fn('studioTrimClean') + fn('studioGround') + fn('studioFabricated') + fn('dayFramesWords') + w.slice(kbA, kbB) +
  '; return { kbDrop, kbTitleOf, kbMirrorItems, kbNumsOK, kbSubmit, kbFile, kbList, kbCutRoute, kbUsed, kbDelete, kbFrame, KB_FEED, KB_DRAFT_SYS };')(
  sbRest, async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s || 200 }, o), (...a) => { events.push(a); return Promise.resolve(); },
  async (env, items, prov) => { lakeCalls.push({ items, prov }); return items.length; }, () => 'fashion-beauty',
  async (env, tier, messages, opts) => { modelCalls.push({ tier, messages, opts }); return typeof modelReply === 'function' ? modelReply(messages, opts) : modelReply; },
  () => false, () => ({ title: 't', paragraphs: [] }), { V: 1, WORDS: { cover_line: 8, kicker: 3, headline: 12, line: 25 } });
const env = { AI: { run: async (m, x) => ({ data: x.text.map(() => [0.1, 0.2, 0.3]) }) } };
const admin = { id: 'admin' };
const DROP = 'Field notes from Atlanta, October 2026. Three salons on Edgewood now stock the same clip-in bang line. Two stylists said clients ask for it by name after seeing it on TikTok.\n\nOwners report the line sells out within 10 days of each delivery.';
const draftOK = JSON.stringify({ kicker: 'Salon floor', headline: 'Clip-in bangs are selling out of Atlanta salons', line: 'Three salons on Edgewood stock the same clip-in bang line. Owners say it sells out within 10 days of each delivery.' });
const LATEST = { id: 7, issue_no: 213, date: '2026-10-13', frames: { v: 1, status: 'ready', cover_line: 'x', frames: [{ from: 'writer', headline: 'a' }], caption: '' } };
const reset = () => { sb = []; fixtures = {}; lakeCalls = []; modelCalls = []; events = []; fixtures['editions?status=eq.published&order=date.desc&limit=1'] = () => [JSON.parse(JSON.stringify(LATEST))]; };
const patches = () => sb.filter(x => x.path.startsWith('editions?id=eq.') && x.opts && x.opts.method === 'PATCH');

// ── D: the drop's own fields ────────────────────────────────────────────
const d0 = K.kbDrop(k => ({ title: '  Atlanta \u2014 field notes ', shareable: true, assets: 'true' })[k]);
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
const kbRows = sb.filter(x => x.path.startsWith('knowledge_base') && x.opts && x.opts.method === 'POST')[0].opts.body;
ok(s1.ok && s1.added === kbRows.length && kbRows.every(r => r.drop_key === s1.drop_key && r.title === 'Atlanta salon notes' && r.shareable === true && r.status === 'live'), 'S1 every chunk is written with the drop\'s key, title and flag');
ok(lakeCalls.length === 1 && lakeCalls[0].prov.provenance === 'recon_feed' && lakeCalls[0].prov.query === 'feed:' + s1.drop_key && s1.lake.lake === lakeCalls[0].items.length,
  'S2 a BOTH drop is mirrored into the lake as recon_feed: research by 0038\'s rule, citable, counted in nothing');
ok(modelCalls.length >= 1 && modelCalls[0].opts.sensitive === true && /Every figure, date and name you print must appear in the drop/.test(modelCalls[0].messages[0].content) && /THE DROP \(Atlanta salon notes\):/.test(modelCalls[0].messages[1].content),
  'S3 the draft rides Workers AI on the sensitive tier, told every figure must be in the drop');
ok(/Write as a creative who was in the room: short sentences, the names in them, one verdict/.test(K.KB_DRAFT_SYS) && /"kicker": at most 3 words, "headline": at most 12 words, a sentence a person would say, "line": at most 25 words/.test(K.KB_DRAFT_SYS) && !/STUDIO/.test(K.KB_DRAFT_SYS) && !/\u2014/.test(K.KB_DRAFT_SYS),
  'S3b the draft is asked for a frame in the house voice: kicker, headline, line, under the caps');
const p1 = patches()[0], set1 = p1 && p1.opts.body.frames, fr1 = set1 && set1.frames[set1.frames.length - 1];
ok(s1.frame.ok && s1.frame.issue_no === 213 && p1 && p1.path === 'editions?id=eq.7' && set1.frames.length === 2 && fr1.from === 'feed' && fr1.drop_key === s1.drop_key && fr1.item_id === null && fr1.source_name === 'Unsurfaced desk' && fr1.headline === 'Clip-in bangs are selling out of Atlanta salons' && fr1.kicker === 'Salon floor',
  'S4 a shareable drop lands as a frame on the latest day\'s set, from the desk, with its drop key, after the writer\'s frames');
ok(set1.status === 'ready' && set1.cover_line === 'x', 'S5 the day\'s own frames and cover line stand; the drop joins them');

reset(); modelReply = draftOK;
const s2 = await K.kbSubmit({ text: DROP, target: 'both', assets: true }, env, '', admin);
ok(s2.ok && s2.frame.error === 'internal' && patches().length === 0 && lakeCalls.length === 1, 'S6 an internal drop feeds the lake and is never made a public frame');
reset(); modelReply = draftOK;
const s3 = await K.kbSubmit({ text: DROP, target: 'daily', shareable: true, assets: true }, env, '', admin);
ok(s3.ok && s3.lake.skipped === 'target_daily' && lakeCalls.length === 0 && s3.frame.ok, 'S7 a DAILY drop goes to the day\'s frames, not the lake');
reset();
const s4 = await K.kbSubmit({ text: DROP, target: 'intelligence', shareable: true, assets: true }, env, '', admin);
ok(s4.frame.error === 'target_intelligence' && patches().length === 0 && lakeCalls.length === 1, 'S8 an INTELLIGENCE drop goes to the lake, not the frames');
reset(); modelReply = JSON.stringify({ kicker: 'Salon', headline: 'Clip-in bang sales rose 40% in Atlanta', line: 'Owners report the line sells out.' });
const s5 = await K.kbSubmit({ text: DROP, target: 'both', shareable: true, assets: true }, env, '', admin);
ok(s5.frame.error === 'draft_invented_a_figure' && patches().length === 0, 'S9 a draft that prints a figure the drop does not give is refused; nothing lands');
reset(); modelReply = draftOK;
const s6 = await K.kbSubmit({ text: DROP, target: 'both' }, env, '', admin);
ok(s6.ok && !s6.frame && lakeCalls.length === 1, 'S10 without Make a frame the drop feeds the base and the lake only');
ok((await K.kbSubmit({ text: DROP }, env, '', { id: 'x' }))._status === 403, 'S11 admin only');
reset(); modelReply = draftOK; fixtures['editions?status=eq.published&order=date.desc&limit=1'] = () => [{ id: 8, issue_no: 214, date: '2026-10-14', frames: null }];
const s7 = await K.kbSubmit({ text: DROP, target: 'daily', shareable: true, assets: true }, env, '', admin);
const set7 = patches()[0].opts.body.frames;
ok(s7.frame.ok && set7.status === 'feed_only' && set7.frames.length === 1 && set7.frames[0].from === 'feed', 'S12 a day the writer has not reached holds the drop\'s frame alone, marked feed_only, so the writer still comes');
reset(); modelReply = draftOK; fixtures['editions?status=eq.published&order=date.desc&limit=1'] = () => [];
ok((await K.kbSubmit({ text: DROP, target: 'daily', shareable: true, assets: true }, env, '', admin)).frame.error === 'no_edition', 'S13 no published day, no frame, said plainly');

// ── C, U, X: a frame later, where it went, remove it ────────────────────
reset(); modelReply = draftOK;
fixtures['knowledge_base?drop_key=eq.dabc1234&status=eq.live'] = () => [{ id: 1, content: DROP, title: 'Atlanta salon notes', target: 'both', shareable: false }];
const c1 = await K.kbCutRoute({ drop_key: 'dabc1234' }, env, '', admin);
ok(c1.error === 'internal' && patches().length === 0, 'C1 an internal drop is not made a frame later either');
const c2 = await K.kbCutRoute({ drop_key: 'dabc1234', shareable: true }, env, '', admin);
ok(c2.ok && c2.shareable === true && sb.some(x => x.path === 'knowledge_base?drop_key=eq.dabc1234' && x.opts && x.opts.method === 'PATCH' && x.opts.body.shareable === true) && patches().length === 1,
  'C2 asked on purpose, the drop is marked shareable and lands as a frame');
const c3 = await K.kbCutRoute({ drop_key: 'dabc1234', shareable: true }, env, '', admin);
ok(c3.ok && patches()[1].opts.body.frames.frames.filter(f => f.drop_key === 'dabc1234').length === 1, 'C2b asked twice, the drop\'s frame is replaced, never doubled');
ok((await K.kbCutRoute({ drop_key: 'nope; drop table' }, env, '', admin)).error === 'bad_drop', 'C3 a drop key is checked before it reaches a query');
reset();
fixtures['knowledge_base?drop_key=eq.dabc1234&select=title'] = () => [{ title: 'Atlanta salon notes', content: DROP, target: 'both', shareable: true }];
fixtures['signals?momentum->>query=eq.feed%3Adabc1234'] = () => [{ id: 'a' }, { id: 'b' }];
fixtures['editions?frames->frames=cs.'] = () => [{ issue_no: 213, date: '2026-10-13' }];
fixtures['house_reads?meta->pack->>text=ilike.'] = () => [{ id: 31, kind: 'report', label: 'October 2026', version: 1, status: 'ready' }];
const u1 = await K.kbUsed({ drop_key: 'dabc1234' }, env, '', admin);
ok(u1.ok && u1.lake === 2 && u1.frames.length === 1 && u1.frames[0].issue_no === 213 && u1.reads[0].id === 31 && sb.some(x => /house_reads\?meta->pack->>text=ilike\.\*Atlanta\*salon\*notes\*&/.test(x.path)) && sb.some(x => /^editions\?frames->frames=cs\.%5B%7B%22drop_key%22%3A%22dabc1234%22%7D%5D/.test(x.path)),
  'U1 Used: the lake rows, the days whose frames carry the drop, and the reads whose pack cites it');
reset();
const x1 = await K.kbDelete({ drop_key: 'dabc1234' }, env, '', admin);
ok(x1.ok && sb.some(x => x.path === 'knowledge_base?drop_key=eq.dabc1234' && x.opts.method === 'DELETE') && sb.some(x => x.path === 'signals?momentum->>query=eq.feed%3Adabc1234' && x.opts.method === 'DELETE'), 'X1 removing a drop removes every chunk and its lake copies');
reset(); await K.kbDelete({ id: 7 }, env, '', admin);
ok(sb.some(x => x.path === 'knowledge_base?id=eq.7' && x.opts.method === 'DELETE'), 'X2 an older row (no key) is still removed one at a time');
reset(); await K.kbList(env, '', admin);
ok(/select=id,content,source_url,file_ref,tags,target,status,created_at,drop_key,title,shareable/.test(sb[0].path), 'X3 the list carries each row\'s drop');

// ── W: the worker's wiring ──────────────────────────────────────────────
ok(/case '\/knowledge\/cut':\s+return kbCutRoute/.test(w) && /case '\/knowledge\/used':\s+return kbUsed/.test(w), 'W1 /knowledge/cut and /knowledge/used are routed');
ok(!/callClaude\(/.test(w.slice(kbA, kbB)), 'W3 FEED never calls Claude: the draft stays on Workers AI (SEAM:CLAUDE_ROUTE)');
ok(/add column if not exists drop_key text/.test(mig) && /shareable boolean not null default false/.test(mig) && /knowledge_base_drop_idx/.test(mig), 'W4 migration 0047: drop_key, title, shareable (internal by default), indexed');
ok(!/content_pieces/.test(w.slice(kbA, kbB)) && !/studioSelect|studioCaption|studioMemeLines/.test(w.slice(kbA, kbB)), 'W5 the FEED writes no piece and asks no STUDIO writer');

// ── F: the FEED room in the house ───────────────────────────────────────
ok(/id="kbTitle"/.test(house) && /id="kbShare"/.test(house) && /id="kbAssets"/.test(house) && /id="kbAssets"> Make a frame now/.test(house), 'F1 every drop takes a title, Shareable and Make a frame now');
ok(/title: document\.getElementById\("kbTitle"\)\.value, shareable: document\.getElementById\("kbShare"\)\.checked, assets: document\.getElementById\("kbAssets"\)\.checked/.test(house) && /"&shareable=" \+/.test(house), 'F2 a paste, a link and a file all send the drop\'s fields');
ok(/var k = r\.drop_key \|\| \("row" \+ r\.id\)/.test(house) && /api\("knowledge\/used", \{ drop_key: key \}\)/.test(house) && /api\("knowledge\/cut", \{ drop_key: key, shareable: true \}\)/.test(house) && /title="Make a frame">FRAME<\/button>/.test(house),
  'F3 drops are listed as drops, with USED, FRAME and remove');
ok(/function kbSaid\(d\)/.test(house) && /held, the drop is internal\. Mark it shareable to make a frame/.test(house) && /FRAME: on the day's set, No\. /.test(house), 'F4 the answer says what the drop did, and why the frame was held');

// ── G: gate and registry ────────────────────────────────────────────────
ok(/'kbDraft': 'callModel on Workers AI/.test(gate), 'G1 kbDraft is a registered spender');
ok(seams.registry['SEAM:FEED_BRIDGE'].file === 'worker/src/index.js' && seams.registry['SEAM:FEED_BRIDGE@read'].file === 'intelligence/read/index.html' && !seams.registry['SEAM:STUDIO_LOOK'] && !seams.registry['SEAM:STUDIO_LOOK@worker'], 'G2 the feed\'s seams are registered where they live; STUDIO\'s are gone');

console.log(`proof_feed: ${pass} passed`);
