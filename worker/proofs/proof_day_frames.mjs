/**
 * proof_day_frames.mjs  --  RD1b THE DAY'S FRAMES (SEAM:DAY_FRAMES, SEAM:DAY_FRAMES@read).
 * A DAILY day's frame copy is written once, under Method 5.0, from the stories, with every figure in them; it is kept on the
 * edition row and drawn in the WEEKLY grammar from the DAILY room; the reel encodes the frames in the browser; a feed drop lands
 * on the latest day's set as a frame and survives a rewrite; STUDIO's engine, routes, paint programs and counter are gone, the
 * knife and the archive stay; the muxer lives in its own file beside the read page, byte for byte.
 */
import fs from 'fs';
import crypto from 'crypto';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const house = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const muxer = fs.readFileSync('intelligence/read/mp4-muxer.js', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const mig = fs.readFileSync('supabase/migrations/0057_day_frames.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };
const fn = name => { const a = w.indexOf('function ' + name + '('); const b = w.indexOf('\n}\n', a); return w.slice(a, b + 3); };

// ── the worker's block, exact shipped code ───────────────────────────────
const block = between(w, '/* ═══ SEAM:DAY_FRAMES (RD1b THE DAY\'S FRAMES)', '/* SEAM:ARCHIVE');
let sb = [], claude = [], events = [], reply = null;
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); if (/^editions\?issue_no=eq\.213/.test(path)) return fixtures.edition(); if (/^edition_items\?/.test(path)) return fixtures.items(); return []; };
const callClaude = async (env, tier, req) => { claude.push({ tier, req }); const t = typeof reply === 'function' ? reply(claude.length) : reply; return { ok: true, text: t, cost_usd: 0.04 }; };
const helpers = fn('jsonRepair') + fn('extractJson') + fn('parseModelJson') + fn('kbNumsOK') + fn('studioTrimClean') + fn('studioGround') + fn('studioFabricated');
const D = new Function('sbRest', 'callClaude', 'logEvent', 'json', 'READ_METHOD', 'CLAUDE', helpers + block +
  '; return { DAY_FRAMES, DAY_FRAMES_CONTRACT, dayFramesWords, dayFramesPrompt, dayFramesGround, dayFramesShape, dayFramesMerge, dayFramesWrite, dayFramesEnsure, dayFramesRoute };')(
  sbRest, callClaude, (...a) => { events.push(a); return Promise.resolve(); }, (o, s) => Object.assign({ _status: s || 200 }, o), 'THE METHOD', { TIERS: { doc: { model: 'claude-fable-5-1' } } });
let fixtures = { edition: () => [], items: () => [] };
const ED = { id: 7, issue_no: 213, date: '2026-10-13', headline: 'Gen Z hair care is arriving on mass-retail shelves' };
const ITEMS = [
  { id: 412, ord: 0, kicker: 'Retail', headline: 'Gen Z hair care is arriving on mass-retail shelves', standfirst: 'Three launches in three weeks.', take: 'Target and Walmart each added a Gen Z hair line this month; the third came to CVS on October 9.', source_name: 'Business of Fashion', territory: 'fashion-beauty' },
  { id: 413, ord: 1, kicker: 'Sneakers', headline: 'Joe Freshgoods showed the New Balance 990v7 before any price or date', standfirst: null, take: 'He posted a closer look on October 12 and again on October 14. New Balance had no date and no price as of the 14th.', source_name: 'justfreshkicks.com', territory: 'sneakers' },
  { id: 414, ord: 2, kicker: 'Music', headline: 'Raye won the Mercury Prize', standfirst: 'The first solo woman since 2019.', take: 'The award went to her second record.', source_name: 'Billboard', territory: 'music' }
];
const GOOD = JSON.stringify({ cover_line: 'The shelf came to the kids this week', frames: [
  { item: 1, kicker: 'Retail', headline: 'Target and Walmart put Gen Z hair care on the shelf', line: 'Three launches in three weeks. CVS took the third on October 9.' },
  { item: 2, kicker: 'Sneakers', headline: 'Joe Freshgoods showed the 990v7 before New Balance named a price', line: 'A closer look on October 12 and again on the 14th. No date, no price from the brand.' },
  { item: 3, kicker: 'Music', headline: 'Raye won the Mercury Prize', line: 'The first solo woman since 2019, for her second record.' }
], caption: 'The shelf came to the kids this week. Hair care at Target, a sneaker shown before its sheet, a prize for a second record. #unsurfaced' });
const reset = () => { sb = []; claude = []; events = []; };

// ── A: the contract and the prompt ───────────────────────────────────────
ok(/"cover_line": at most 8 words/.test(D.DAY_FRAMES_CONTRACT) && /"kicker": at most 3 words/.test(D.DAY_FRAMES_CONTRACT) && /"headline": at most 12 words, a sentence a person would say with the names in it/.test(D.DAY_FRAMES_CONTRACT) && /"line": at most 25 words/.test(D.DAY_FRAMES_CONTRACT) && /"caption": at most 600 characters, no hashtags/.test(D.DAY_FRAMES_CONTRACT),
  'A1 the day\'s contract carries the WEEKLY frames\' caps: 8, 3, 12, 25 words and 600 characters');
ok(/Every figure, date and name you write must appear in the stories as given/.test(D.DAY_FRAMES_CONTRACT) && /each one stands alone in a feed/.test(D.DAY_FRAMES_CONTRACT) && !/\u2014/.test(D.DAY_FRAMES_CONTRACT), 'A2 the law of the stories, the feed line, no em dash');
const prompt = D.dayFramesPrompt(ED, ITEMS);
ok(/THE DAY: Unsurfaced DAILY No\. 213, 2026-10-13\. Lead: Gen Z hair care/.test(prompt) && /^1\. \[RETAIL\] Gen Z hair care/m.test(prompt) && /^3\. \[MUSIC\] Raye won the Mercury Prize/m.test(prompt) && /Source: justfreshkicks\.com · sneakers/.test(prompt) && /Write the day's frames\. Return only the JSON object\./.test(prompt),
  'A3 the stories are numbered in the edition\'s order with their standfirst, take, source and territory');
ok(D.dayFramesWords('one two three four five', 3) === 'one two three' && D.dayFramesWords('  spaced   out ', 8) === 'spaced out', 'A4 a cap cuts words, never letters');

// ── B: the shape and the law ─────────────────────────────────────────────
const sh = D.dayFramesShape(JSON.parse(GOOD), ED, ITEMS);
ok(sh.ok && sh.set.frames.length === 3 && sh.set.frames[0].item_id === 412 && sh.set.frames[1].item_id === 413 && sh.set.frames.every(f => f.from === 'writer') && sh.set.frames[0].source_name === 'Business of Fashion',
  'B1 a good set shapes to one frame per story with the story\'s id for its photograph and its source for the credit');
ok(sh.set.caption.indexOf('#') < 0 && /second record\.$/.test(sh.set.caption), 'B2 hashtags are stripped from the caption');
const bad = JSON.parse(GOOD); bad.frames[0].line = 'Sales rose 40% in three weeks.';
const sh2 = D.dayFramesShape(bad, ED, ITEMS);
ok(!sh2.ok && sh2.hold.includes('figure_not_in_stories'), 'B3 a figure the stories never gave is a hold');
const bad2 = JSON.parse(GOOD); bad2.frames[2].headline = 'Raye won the Mercury Prize, the first since 2001';
ok(D.dayFramesShape(bad2, ED, ITEMS).hold.includes('invented:year:2001'), 'B4 a year the stories never gave is a hold');
const bad3 = JSON.parse(GOOD); bad3.frames[1].headline = 'Shown before the sheet \u2014 again';
ok(D.dayFramesShape(bad3, ED, ITEMS).hold.includes('em_dash'), 'B5 an em dash is a hold');
const bad4 = JSON.parse(GOOD); bad4.frames.push({ item: 9, kicker: 'x', headline: 'A story the day does not have', line: 'y' }); bad4.frames[0].headline = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen';
const sh4 = D.dayFramesShape(bad4, ED, ITEMS);
ok(sh4.ok && sh4.set.frames.length === 3 && sh4.set.frames[0].headline.split(' ').length === 12, 'B6 a frame naming no story is dropped; a long headline is cut to twelve words');
ok(!D.dayFramesShape({ cover_line: 'x', frames: [], caption: '' }, ED, ITEMS).ok && D.dayFramesShape(null, ED, ITEMS).hold[0] === 'unparsable', 'B7 too few frames and an unparsable reply are holds');
const merged = D.dayFramesMerge(sh.set, { frames: [{ from: 'feed', drop_key: 'dabc1234', headline: 'From the desk' }, { from: 'writer', headline: 'old' }] });
ok(merged.frames.length === 4 && merged.frames[3].from === 'feed' && !merged.frames.some(f => f.headline === 'old'), 'B8 the feed\'s frames survive a rewrite; the old writer\'s frames do not');

// ── C: writing, once ─────────────────────────────────────────────────────
reset(); reply = GOOD;
const wr = await D.dayFramesWrite({}, Object.assign({}, ED), ITEMS, 'cron');
ok(wr.ok && wr.status === 'ready' && claude.length === 1 && claude[0].tier === 'doc' && claude[0].req.kind === 'daily_frames' && claude[0].req.cache === true && /^THE METHOD\n\nCONTRACT \(a DAILY day's frames\)/.test(claude[0].req.system) && claude[0].req.max_tokens === 2400,
  'C1 one call on the doc tier under the Method and the day\'s contract, cached, 2,400 tokens of room');
const patch = sb.find(x => x.path === 'editions?id=eq.7' && x.opts.method === 'PATCH');
ok(patch && patch.opts.body.frames.status === 'ready' && patch.opts.body.frames.frames.length === 3 && patch.opts.body.frames.cost_usd === 0.04 && patch.opts.body.frames.by === 'cron' && patch.opts.body.frames.voice === 'Method 5.0' && patch.opts.body.frames.model === 'claude-fable-5-1',
  'C2 the set is written on the edition row with its cost, its author and the Method\'s version');
ok(events.some(e => e[1] === 'daily' && e[3] === 'day_frames' && e[5].status === 'ready'), 'C3 the day\'s frames are an event');
reset(); reply = n => n === 1 ? JSON.stringify(Object.assign(JSON.parse(GOOD), { cover_line: 'Sales rose 40%' })) : GOOD;
const wr2 = await D.dayFramesWrite({}, Object.assign({}, ED), ITEMS, 'desk');
ok(wr2.ok && wr2.status === 'ready' && claude.length === 2 && /The last attempt was refused: figure_not_in_stories/.test(claude[1].req.prompt) && wr2.cost_usd === 0.08, 'C4 a refused set is written once more with the reason; both calls are paid for');
reset(); reply = () => JSON.stringify(Object.assign(JSON.parse(GOOD), { cover_line: 'Sales rose 40%' }));
const wr3 = await D.dayFramesWrite({}, Object.assign({}, ED), ITEMS, 'desk');
ok(wr3.ok && wr3.status === 'held' && claude.length === 2 && sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body.frames.hold.includes('figure_not_in_stories'), 'C5 twice refused, the set is held with the reason, never drawn');
reset(); reply = GOOD;
const en = await D.dayFramesEnsure({}, Object.assign({}, ED, { frames: { status: 'ready', frames: [{}] } }), ITEMS, {});
ok(en.ok && en.existing === true && claude.length === 0, 'C6 a day whose frames exist is not written again');
reset();
const en2 = await D.dayFramesEnsure({}, Object.assign({}, ED, { frames: { status: 'feed_only', frames: [{ from: 'feed', drop_key: 'dabc1234', headline: 'From the desk' }] } }), ITEMS, { by: 'cron' });
ok(en2.ok && claude.length === 1 && sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body.frames.frames.length === 4, 'C7 a day holding only a feed frame is written, and keeps the feed frame');
reset();
const en3 = await D.dayFramesEnsure({}, Object.assign({}, ED, { frames: { status: 'ready', frames: [{}] } }), ITEMS, { force: true, by: 'fresco' });
ok(en3.ok && claude.length === 1 && claude[0].req.meta.by === 'fresco', 'C8 asked again from the row, the set is written again by the admin who asked');

// ── R: the route ─────────────────────────────────────────────────────────
reset(); fixtures.edition = () => [Object.assign({}, ED, { frames: null })]; fixtures.items = () => ITEMS;
const r0 = await D.dayFramesRoute({ issue: 213 }, {}, '', { id: 'u', email: 'fresco@unsurfaced.com' });
ok(r0.ok && r0.frames === null && r0.edition.issue_no === 213 && claude.length === 0, 'R1 asked plainly, the route reads the set and writes nothing');
const r1 = await D.dayFramesRoute({ issue: 213, make: true }, {}, '', { id: 'u', email: 'fresco@unsurfaced.com' });
ok(r1.ok && r1.status === 'ready' && claude.length === 1 && claude[0].req.meta.by === 'fresco' && sb.some(x => /^edition_items\?edition_id=eq\.7&order=ord\.asc/.test(x.path)), 'R2 make writes the set from the day\'s stories, by the admin who asked');
ok((await D.dayFramesRoute({ issue: 'x' }, {}, '', { id: 'u' })).error === 'bad_issue' && (fixtures.edition = () => [], (await D.dayFramesRoute({ issue: 999, make: true }, {}, '', { id: 'u' })).error === 'not_found'), 'R3 a bad issue and an unpublished one are refused');
ok(/case '\/reads\/day-frames':/.test(w) && /if \(path === '\/reads\/day-frames'\) return dayFramesRoute\(body, env, origin, user\);/.test(w), 'R4 the router carries the path to readRoute, behind the admin check');
const rr = between(w, 'async function readRoute(path, body, env, origin, user) {', "if (path === '/reads/list')");
ok(rr.indexOf('callerIsAdmin') < rr.indexOf('dayFramesRoute'), 'R5 the admin check comes first');

// ── W: the wiring, STUDIO gone, the knife kept ───────────────────────────
ok(/await dayFramesEnsure\(env, \{ id: edId, issue_no: issueNo, date: today, headline: leadHeadline \}, createdItems, \{ by: 'cron' \}\)\.catch\(e => console\.log\('day_frames_error'/.test(w), 'W1 the publish writes the day\'s frames from the stories as inserted (with their ids), and a failure never fails the publish');
ok(!/buildStudioManifest|studioSlate|studioSelect|studioCaption|studioMemeLines|STUDIO_VOICE|studioManifest|studioGenerate|studioCutStory|studioUpdate|studioKill|studioArchive|'\/studio\//.test(w), 'W2 STUDIO\'s engine, voice and routes are gone from the worker');
ok(/^function studioTrimClean\(/m.test(w) && /^function studioComplete\(/m.test(w) && /^function studioFabricated\(/m.test(w) && /^function studioGround\(/m.test(w), 'W3 the knife stays: the length contract and the grounding checks DAILY and the feed use');
ok(!/content_pieces/.test(w.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')) || !/'content_pieces'/.test(w), 'W4 the worker writes nothing to content_pieces any more (the archive stands)');
ok(/'dayFramesWrite': 'claudeGate on the doc tier/.test(gate) && !/'studioCaption'/.test(gate) && !/'studioMemeLines'/.test(gate), 'W5 the day\'s writer is a registered spender; STUDIO\'s are not');
ok(/add column if not exists frames jsonb/.test(mig), 'W6 migration 0057: editions.frames');

// ── F: the feed lands a frame ────────────────────────────────────────────
ok(/async function kbFrame\(env, d\)/.test(w) && !/async function kbCut\(env, d\)/.test(w) && /out\.frame = await kbFrame\(env, d\)/.test(w), 'F1 a shareable drop becomes a frame (kbFrame), not a piece');
ok(/"kicker": at most 3 words, "headline": at most 12 words, a sentence a person would say, "line": at most 25 words/.test(w) && /Every figure, date and name you print must appear in the drop\. Never an em dash/.test(w) && !/You are the STUDIO desk/.test(w), 'F2 the drop is drafted as a frame under the sentence law, every figure in the drop');
ok(/editions\?frames->frames=cs\./.test(w) && /frames: frames \}, 200, origin, env\)/.test(w.slice(w.indexOf('async function kbUsed('))), 'F3 USED says which days carry the drop\'s frame');

// ── P: the read page draws a day as it draws an issue ────────────────────
const pA = house.indexOf('/* SEAM:DAY_FRAMES (RD1b THE DAY\'S FRAMES): one frames section'), pB = house.indexOf('/* ── The day\'s frames in the DAILY room');
ok(pA > 0 && pB > pA, 'P0 the frames block is on the read page');
const P = new Function('C', 'loadSharp', 'frame', 'esc', 'pad', 'app', 'pdfOf', 'document', 'window', 'console', house.slice(pA, pB) + '; return { reelProgram, REEL, reelPaint, framesSection, social };')(
  { void: '#0A0A0A', ivory: '#FAF7F2', red: '#C41230' }, null, null, null, null, null, null, {}, {}, console);
const prog = P.reelProgram(3);
ok(prog.w === 1080 && prog.h === 1350 && prog.fps === 30 && prog.total === 3 * 90 + 36, 'P1 the reel is 1080 x 1350 at 30 fps: 84 frames held and 6 black for each frame, a 36-frame out');
ok(prog.at(0).some(o => o.op === 'frame' && o.i === 0) && prog.at(83).some(o => o.op === 'frame' && o.i === 0) && !prog.at(87).some(o => o.op === 'frame') && prog.at(90).some(o => o.op === 'frame' && o.i === 1), 'P2 a frame holds, then a hard cut to black, then the next: a stamp, never a slide');
const out = prog.at(prog.total - 1);
ok(out.some(o => o.op === 'dot' && o.color === '#C41230') && out.some(o => o.op === 'text' && o.text === 'UNSURFACED™ DAILY') && !out.some(o => o.op === 'frame'), 'P3 the out is black with the red dot and the wordmark');
const opsAll = JSON.stringify(Array.from({ length: prog.total }, (_, f) => prog.at(f)));
ok(crypto.createHash('sha256').update(opsAll).digest('hex') === 'f438ebbeeeb72d7172b4d1fa2079ee29b1ace5a79b15e531540a3cc61ad2792c' && !/\u2014/.test(opsAll), 'P4 the program is pure: three frames give the same ops every run (sha256 f438ebbe), and no em dash');
const calls = [];
const ctx = { fillRect: (...a) => calls.push(['rect', ...a]), drawImage: (...a) => calls.push(['image', ...a]), beginPath() {}, arc: (...a) => calls.push(['arc', ...a]), fill() {}, fillText: (...a) => calls.push(['text', ...a]) };
P.reelPaint({ width: 0, height: 0, getContext: () => ctx }, [{ id: 'A' }, { id: 'B' }], 1080, 1350, prog.at(0));
ok(calls[0][0] === 'rect' && calls[1][0] === 'image' && calls[1][1].id === 'A' && calls[1][4] === 1080 && calls[1][5] === 1350, 'P5 the painter fills black and draws the frame to the full canvas');
ok(/function frame\(kind, data, label, im\)/.test(house) && /c\.fillText\(String\(data\.sub \|\| "THE WEEKLY READ · SWIPE"\), 84, 1270\)/.test(house), 'P6 the painter takes the cover\'s second line: the WEEKLY\'s by default, the day\'s when given');
ok(/function social\(row, s, rc, img, coverPool\) \{\n    return framesSection\(\{ label: row\.label, sub: "THE WEEKLY READ · SWIPE"/.test(house), 'P7 the WEEKLY\'s frames go through the same section, as before');
ok(/dayFramesPanel\(ed, items, app\);/.test(house) && /function dayFramesShow\(ed, items, panel, fr, err\)/.test(house) && /call\("\/reads\/day-frames"/.test(house) && /sub: "THE DAILY · " \+ hsDay\(ed\.date\)\.toUpperCase\(\) \+ " · SWIPE"/.test(house),
  'P8 a day opened in the DAILY room reads its frames and draws them with the day\'s own cover line');
ok(/data-fr="reel">Render the reel \(MP4\)<\/button>/.test(house) && /async function buildMp4\(program, paint, onTick\)/.test(house) && /This browser cannot encode video here/.test(house), 'P9 the reel button on every frames section, WEEKLY and DAILY, and an honest line when a browser cannot encode');
ok(/<script src="\.\/mp4-muxer\.js"><\/script>/.test(house) && /script-src 'self'/.test(house), 'P10 the muxer is loaded from its own file beside the page, which the page\'s CSP allows');
ok(/^\/\* mp4-muxer v5\.2\.2, \(c\) Vanilagy, MIT\./.test(muxer) && crypto.createHash('sha256').update(muxer.split('\n').slice(2).join('\n')).digest('hex') === '6c723b5b513ea4424a41bfa443a8145e3582e18ebae75955abecf55bd802da04',
  'P11 the muxer\'s body is the library as it was vendored, byte for byte (sha256 6c723b5b)');
ok(!/Mp4Muxer|mp4-muxer|STUDIO_TEMPLATES|studioMotionProgram|SEAM:STUDIO|--z-studio|async function framesFor\(piece\)/.test(page), 'P12 the Intelligence page carries no muxer, no paint program, no STUDIO seam and no stale z token');
ok(!/Make STUDIO assets/.test(house) && /Make a frame now/.test(house) && /d\.frame\.ok \? " FRAME: on the day's set, No\. "/.test(house) && /FRAMES: " \+ \(u\.frames && u\.frames\.length/.test(house), 'P13 the feed room offers a frame, says where it landed, and USED names the days');

// ── G: the registry and the tools ────────────────────────────────────────
const reg = seams.registry;
ok(reg['SEAM:DAY_FRAMES'] && reg['SEAM:DAY_FRAMES'].file === 'worker/src/index.js' && reg['SEAM:DAY_FRAMES@read'] && reg['SEAM:DAY_FRAMES@read'].file === 'intelligence/read/index.html', 'G1 SEAM:DAY_FRAMES is registered where it lives');
ok(!reg['SEAM:STUDIO@worker'] && !reg['SEAM:STUDIO@intelligence'] && !reg['SEAM:STUDIO_LOOK'] && !reg['SEAM:STUDIO_LOOK@worker'], 'G2 the STUDIO seams are gone from the registry');
ok(!fs.existsSync('tools/proof_studio.mjs') && !fs.existsSync('tools/proof_feed_ui.mjs'), 'G3 the STUDIO tools outside the gate are retired');

console.log(`\nproof_day_frames: ${pass} checks passed`);
