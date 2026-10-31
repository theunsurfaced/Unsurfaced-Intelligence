/**
 * proof_video_door.mjs  --  RD1c THE DAY'S SLOTS AND THE VIDEO DOOR (SEAM:VIDEO_DOOR, SEAM:VIDEO_DOOR@read).
 * A DAILY day's frames are slots (day:<issue> through the slot doors, carried across a rewrite by the story each frame names); THE VIDEO
 * door on every slot (a cleared image or a story's photograph to a take through playRender, the house look and the motion law on the
 * prompt once, a draft at 720p and a final at 1080p, the cost from the price table, the record carrying its source); the clip stitches
 * the landed takes in slot order; nothing renders unless an admin asks. No migration, no new spender.
 * Run from the repo root: node worker/proofs/proof_video_door.mjs
 */
import fs from 'node:fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
function ok(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok ' + m); }
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };
const fn = name => { const a = w.indexOf('function ' + name + '('); if (a < 0) throw new Error('fn missing: ' + name); const b = w.indexOf('\n}\n', a); return w.slice(a, b + 3); };
const DASH = /—/;

// ── A: the house look on a shot prompt ───────────────────────────────────────────────────────────────────
const hs = between(w, '/* SEAM:VIDEO_DOOR (RD1c): the house look on a shot prompt.', '\nexport default {');
ok(!DASH.test(hs), 'A0 no em dash in the house look');
const H = new Function(hs + '; return { PLAY_HOUSE_SUFFIX, PLAY_MOTION_LAW, PLAY_HOUSE_NEGATIVE, playHousePrompt, playResolution };')();
ok(/evidence that surfaced, not content that was made/.test(H.PLAY_HOUSE_SUFFIX) && /red on the one found thing only/.test(H.PLAY_HOUSE_SUFFIX) && /plain and unlettered/.test(H.PLAY_HOUSE_SUFFIX) && /ivory and cream/.test(H.PLAY_HOUSE_SUFFIX),
  'A1 the suffix carries the doctrine: evidence that surfaced, red for the found thing only, the palette, no lettering');
ok(/hook is in the first second/.test(H.PLAY_MOTION_LAW) && /made by the fourth/.test(H.PLAY_MOTION_LAW) && /one gesture/.test(H.PLAY_MOTION_LAW) && /stamp/.test(H.PLAY_MOTION_LAW), 'A2 the motion law: the hook, the take by the fourth, one gesture, the stamp');
ok(/text, lettering, signage, logo/.test(H.PLAY_HOUSE_NEGATIVE) && /golden hour glow/.test(H.PLAY_HOUSE_NEGATIVE) && /lens flare/.test(H.PLAY_HOUSE_NEGATIVE) && /stock photography/.test(H.PLAY_HOUSE_NEGATIVE), 'A3 the negative names what the videos carried: lettering, logos, golden hour, flare, stock');
const once = H.playHousePrompt('A stoop at dusk, one pair of shoes on the step.', 'image');
ok(once.indexOf('A stoop at dusk') === 0 && once.indexOf(H.PLAY_HOUSE_SUFFIX) > 0 && once.indexOf(H.PLAY_MOTION_LAW) < 0, 'A4 an image prompt gets the house look and not the motion law');
const vid = H.playHousePrompt('A stoop at dusk. Motion: one hand ties a lace.', 'video');
ok(vid.indexOf(H.PLAY_HOUSE_SUFFIX) > 0 && vid.indexOf(H.PLAY_MOTION_LAW) > vid.indexOf(H.PLAY_HOUSE_SUFFIX), 'A5 a video prompt gets the house look then the motion law');
ok(H.playHousePrompt(vid, 'video') === vid && (vid.match(new RegExp(H.PLAY_HOUSE_SUFFIX.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1, 'A6 the look is added once; a housed prompt housed again is unchanged');
ok(H.playHousePrompt('x'.repeat(3000), 'video').length <= 2500 && H.playHousePrompt('x'.repeat(3000), 'video').indexOf(H.PLAY_MOTION_LAW) > 0, 'A7 the cap holds and the law survives a long prompt');
ok(H.playResolution('1080p') === '1080p' && H.playResolution('720p') === '720p' && H.playResolution('4k') === '720p' && H.playResolution(undefined) === '720p', 'A8 the resolution is 720p unless the door asks for 1080p');

// ── B: playRender and the record ─────────────────────────────────────────────────────────────────────────
const pr = between(w, 'async function playRender(body, env, origin, user) {', 'async function playRenderStatus(');
ok(/const housed = body\.house === true && typeof playHousePrompt === 'function' \? playHousePrompt\(prompt, pool\.kind\) : prompt;/.test(pr) && /const input = \{ prompt: housed \};/.test(pr), 'B1 the prompt fal receives is the housed one when the door asks, the plain one otherwise');
ok(/const resolution = typeof playResolution === 'function' \? playResolution\(body\.resolution\) : '720p';/.test(pr) && (pr.match(/input\.resolution = resolution;/g) || []).length === 2 && !/input\.resolution = '720p'/.test(pr), 'B2 the resolution is a parameter on both video paths; no path is fixed at 720p any more');
ok(/input\.negative_prompt = PLAY_HOUSE_NEGATIVE/.test(pr) && /\/kling\/\.test\(model\)/.test(pr), 'B3 the negative prompt rides the pool that takes one (Kling), only when the house asks');
ok(/prompt: housed, seconds: pool\.kind === 'video' \? seconds : null, resolution: pool\.kind === 'video' \? resolution : null/.test(pr) && /parent: \/\^\(\?:\[0-9a-f-\]\{36\}\|S\\d\+\)\$\/i\.test\(String\(body\.parent \|\| ''\)\)/.test(pr) && /surface: String\(body\.surface \|\| ''\)\.replace/.test(pr), 'B4 the KV note carries the housed prompt, the resolution, the parent, the surface and the source for the record');
ok(pr.indexOf("meterCharge(env, user.id, 'play.render', renderCredits(model, pool.kind, seconds)") > pr.indexOf('const housed =') && pr.indexOf('meterCharge(') < pr.indexOf("fetch('https://queue.fal.run/'"), 'B5 the meter is still charged before fal is asked (proof_plans X5 holds beside this)');
const rr = fn('playRightsRecord');
ok(/resolution: r\.resolution \|\| null, parent: r\.parent \|\| null, surface: r\.surface \|\| null, source: r\.source \|\| null/.test(rr), 'B6 the record of kind play carries the resolution, the parent, the surface and the source');
const PR = new Function('RIGHTS', 'PLAY_ASSETS', 'playUserId', rr + '; return playRightsRecord;')({ BASIS: { play: 'AIR' } }, { CREDIT: 'Unsurfaced PLAY', VIDEO_RX: /\.(?:mp4|webm|mov)$/i, PROMPT_MAX: 2500 }, s => /^[0-9a-f-]{36}$/i.test(String(s || '')) ? String(s) : null);
const rec = PR({ model: 'fal-ai/kling-video/v3/standard/image-to-video', kind: 'video', seconds: 5, prompt: 'p', resolution: '1080p', parent: 'abc', surface: 'slots', source: '41:cover', user: 'u' }, 'play/u/house/r1.mp4', 'r1', '2026-10-30T00:00:00Z');
ok(rec.made.parent === 'abc' && rec.made.surface === 'slots' && rec.made.source === '41:cover' && rec.made.resolution === '1080p' && rec.made.kind === 'video' && rec.contexts.length === 0, 'B7 a take\'s record: video, its source as parent, the slot it serves, cleared for nothing');
const pg = between(w, 'async function playGenerate(body, env, origin) {', '/* SEAM:PLAY_BRIEF:');
ok(/body\.house === true && typeof PLAY_HOUSE_SUFFIX === 'string' \? ' THE HOUSE LOOK, which every prompt you write carries: ' \+ PLAY_HOUSE_SUFFIX : ''/.test(pg), 'B8 PLAY\'s compile carries the house look only when the brief asks (house: true)');

// ── C: a frame is a slot path ────────────────────────────────────────────────────────────────────────────
const rights = between(w, 'const RIGHTS = {', 'async function rightsInsert(');
const R = new Function(rights + '; return { RIGHTS, rightsContexts, rightsClears };')();
ok(R.RIGHTS.SLOT_RX.test('frames[0]') && R.RIGHTS.SLOT_RX.test('frames[12]') && R.RIGHTS.SLOT_RX.test('cover') && R.RIGHTS.SLOT_RX.test('patterns[3]') && !R.RIGHTS.SLOT_RX.test('frames[x]') && !R.RIGHTS.SLOT_RX.test('takes[0]'), 'C1 frames[n] is a slot path; nothing else new is');
const S = new Function(fn('slotTarget') + fn('slotMain') + fn('slotLeads') + '; return { slotTarget, slotMain, slotLeads };')();
const dayRead = { title: 'The day', frames: [{ headline: 'Joe Freshgoods showed the 990v7 first', line: 'On his Story, October 12 and 14.', kicker: 'SNEAKERS', item_id: 7701 }, { headline: 'Kool Grey shipped', line: 'October 22.', item_id: 7702 }] };
const t0 = S.slotTarget(dayRead, 'frames[0]');
ok(t0.title === 'Joe Freshgoods showed the 990v7 first' && t0.text === 'On his Story, October 12 and 14.' && t0.evidence.join() === 'S7701' && S.slotTarget(dayRead, 'frames[2]') === null, 'C2 a frame slot points at the frame: its headline, its line, its story as the evidence');
ok(S.slotMain(dayRead).key === 'frames' && S.slotMain(dayRead).list.length === 2 && S.slotLeads(dayRead).join('|') === 'The day|Joe Freshgoods showed the 990v7 first|Kool Grey shipped', 'C3 the day\'s main array is its frames; the leads are the cover line and the headlines');
const wk = { title: 'People pay', patterns: [{ name: 'A', dek: 'B', evidence: ['S1'] }] };
ok(S.slotMain(wk).key === 'patterns' && S.slotTarget(wk, 'patterns[0]').title === 'A' && S.slotTarget(wk, 'patterns[0]').evidence.join() === 'S1', 'C4 a read\'s slots are as ED1 left them');

// ── D: the door, sliced pure and run with fakes ──────────────────────────────────────────────────────────
const door = between(w, '/* ═══ SEAM:VIDEO_DOOR (RD1c THE DAY\'S SLOTS AND THE VIDEO DOOR)', '/* SEAM:MEDIA_RIGHTS (ED1)');
ok(!DASH.test(door) && !/\\u2014/.test(door.replace(/\/\\u2014\/g/g, '').replace(/\\u2014/g, '')), 'D0 no em dash glyph in the door; the escapes it carries are in regexes');
let sb = [], patches = [], renders = [], assembles = [], events = [];
const RIGHTS_ROWS = { 'h1': { id: 'h1', kind: 'house', ref: 'make/h1.jpg', credit: 'Unsurfaced, AI illustration', contexts: ['weekly_pdf', 'social'], made: { brief: { scene: 'A brick stoop at dusk, one pair of shoes on the step', light: 'sodium', red: 'the lace' } } },
  'p1': { id: 'p1', kind: 'play', ref: 'play/u/engine/p1.jpg', credit: 'Unsurfaced PLAY', contexts: [], made: { kind: 'image' } },
  'v1': { id: 'v1', kind: 'play', ref: 'play/u/engine/v1.mp4', credit: 'Unsurfaced PLAY', contexts: [], made: { kind: 'video' } },
  'bad': { id: 'bad', kind: 'house', ref: 'make/bad.jpg', credit: 'x', contexts: [], made: { checks: { hard: ['lettering'] } } },
  'ty': { id: 'ty', kind: 'type', ref: 'type:41:cover', credit: 'Unsurfaced', contexts: ['weekly_pdf'] } };
const recsByReq = { 'req-landed': { id: 'rr1', ref: 'play/u/house/req-landed.mp4', created_at: '2026-10-30T01:00:00Z', made: { request_id: 'req-landed' } }, 'req-final': { id: 'rr2', ref: 'play/u/house/req-final.mp4', created_at: '2026-10-30T02:00:00Z', made: { request_id: 'req-final' } } };
const fakes = {
  sbRest: async (env, path, opts) => { sb.push({ path, opts });
    if (/^editions\?issue_no=eq\.213/.test(path)) return [{ id: 'ed-213', issue_no: 213, date: '2026-10-30', headline: 'The lead', frames: { status: 'ready', cover_line: 'People buy the shoe before the sheet', frames: [{ headline: 'Joe Freshgoods showed the 990v7 first', line: 'l', kicker: 'k', item_id: 7701, from: 'writer' }], slots: { 'frames[0]': { rights_id: 'h1', ref: 'make/h1.jpg', kind: 'house', credit: 'Unsurfaced, AI illustration' } }, takes: { cover: [{ request_id: 'req-landed', tier: 'draft', seconds: 4, at: '2026-10-30T00:00:00Z' }] } } }];
    if (/^editions\?issue_no=eq\.9999/.test(path)) return [];
    if (/^edition_items\?edition_id=eq\.ed-213/.test(path)) return [{ id: 7701, ord: 0, headline: 'h', source_name: 'justfreshkicks.com', image_url: 'https://x/a.jpg' }, { id: 7702, ord: 1, headline: 'h2', source_name: 'hypebeast.com' }];
    if (/^editions\?id=eq\.ed-213/.test(path) && opts && opts.method === 'PATCH') { patches.push(opts.body); return []; }
    if (/^media_rights\?kind=eq\.play&select=id,ref,created_at,made&made/.test(path)) { const want = decodeURIComponent(path.split('in.(')[1].replace(/\)$/, '')).split(',').map(s => s.replace(/"/g, '')); return want.map(id => recsByReq[id]).filter(Boolean); }
    if (/^media_rights\?kind=eq\.play&select=id,ref,created_at&made/.test(path)) { const id = decodeURIComponent(path.split('eq.')[2].split('&')[0]); return recsByReq[id] ? [recsByReq[id]] : []; }
    return []; },
  excQuiet: (name, dflt) => () => dflt,
  rightsGet: async (env, id) => RIGHTS_ROWS[id] || null,
  rightsClears: (rec, ctx) => !!(rec && Array.isArray(rec.contexts) && rec.contexts.includes(ctx)),
  playIsVideo: rec => !!(rec && rec.made && rec.made.kind === 'video'),
  playRecordChecked: async (env, rec) => rec.id === 'p1' ? Object.assign({}, rec, { contexts: ['weekly_pdf'], made: { kind: 'image', checks: { hard: [] } } }) : rec,
  MAKE: { MEDIA_BASE: 'https://api.unsurfaced-intelligence.com/media/' },
  RENDER_POOL: { 'video.draft': { id: 'bytedance/seedance-2.0/fast/text-to-video', i2v: 'bytedance/seedance-2.0/fast/image-to-video', kind: 'video' }, 'video.final': { id: 'fal-ai/kling-video/v3/standard/text-to-video', i2v: 'fal-ai/kling-video/v3/standard/image-to-video', kind: 'video' } },
  renderUsd: (model, kind, s) => (/seedance/.test(model) ? 0.12 : 0.14) * s,
  json: (o, s) => Object.assign({ _status: s }, o),
  logEvent: (e, p, sp, ev, sid, meta) => { events.push({ ev, meta }); },
  slotMain: S.slotMain,
  slotPatch: async (env, row, patch) => { if (row.day) return daySlotPatchRef(env, row, patch); patches.push(patch); row.meta = patch.meta; },
  playRender: async body => { renders.push(body); return body.pool === 'video.final' && body.seconds === 10 ? { ok: false, error: 'render_budget' } : { ok: true, request_id: 'req-' + renders.length }; },
  playAssemble: async body => { assembles.push(body); return { ok: true, request_id: 'req-clip' }; }
};
let daySlotPatchRef = null;
const D = new Function(...Object.keys(fakes), door + '; daySlotPatchRef = typeof daySlotPatch === "function" ? daySlotPatch : null; return { VIDEO_DOOR, videoPrompt, videoSpec, videoMenu, clipChoose, clipOrder, takeFileName, daySlotRow, daySlotPatch, slotTakesResolve, slotClipResolve, slotDoorExtras, slotVideoSource, slotDoorRoute };')(...Object.values(fakes));
daySlotPatchRef = D.daySlotPatch;
// pure
const vp = D.videoPrompt({ title: 'T', text: 'X', brief: { scene: 'A brick stoop at dusk', light: 'sodium.', red: 'the lace' }, motion: 'one hand ties the lace' });
ok(vp.indexOf('A brick stoop at dusk') === 0 && /Light: sodium\./.test(vp) && /The one thing in red: the lace\./.test(vp) && /Motion: one hand ties the lace$/.test(vp) && vp.indexOf('T') !== 0, 'D1 the prompt is the brief when the house wrote one, then what moves in the admin\'s words');
const vp2 = D.videoPrompt({ title: 'Fans saw the 990v7 first', text: 'On his Story.' });
ok(vp2.indexOf('Fans saw the 990v7 first. On his Story.') === 0 && vp2.indexOf(D.VIDEO_DOOR.MOTION_DEFAULT) > 0 && !/House look/.test(vp2), 'D2 without a brief the finding\'s words carry the shot, the default motion follows, the house look is not doubled here');
ok(D.videoPrompt({ title: 'a', motion: 'b — c' }).indexOf('—') < 0, 'D3 an em dash in the motion note is set as a comma');
ok(D.videoSpec('draft').pool === 'video.draft' && D.videoSpec('draft').seconds === 4 && D.videoSpec('draft').resolution === '720p' && D.videoSpec('final').pool === 'video.final' && D.videoSpec('final').seconds === 5 && D.videoSpec('final').resolution === '1080p', 'D4 a draft is four seconds at 720p on the draft pool; a final five at 1080p on the final pool');
ok(D.videoSpec('final', 10).seconds === 10 && D.videoSpec('final', 7).seconds === 5 && D.videoSpec('draft', 7).seconds === 7 && D.videoSpec('draft', 60).seconds === 4 && D.videoSpec('draft', 4, '1080p').resolution === '1080p' && D.videoSpec('final', 5, '4k').resolution === '1080p', 'D5 the final pool takes five or ten; the draft two to ten; the resolution is one of the two the door knows');
const menu = D.videoMenu(fakes.RENDER_POOL, fakes.renderUsd);
ok(menu.draft.usd === 0.48 && menu.final.usd === 0.7 && /seedance.*image-to-video/.test(menu.draft.model) && /kling.*image-to-video/.test(menu.final.model), 'D6 the menu prices a draft at $0.48 and a final at $0.70 by the price table, on the image-to-video models');
ok(D.clipChoose([{ tier: 'draft', ref: 'a' }, { tier: 'final', ref: 'b' }, { tier: 'draft' }]).ref === 'b' && D.clipChoose([{ tier: 'draft', ref: 'a' }, { tier: 'final', ref: 'b', pick: true }, { tier: 'final', ref: 'c' }]).ref === 'b' && D.clipChoose([{ tier: 'final' }]) === null, 'D7 the clip takes the pick, else the newest landed final, else the newest landed draft; a take still rendering is never chosen');
ok(D.clipOrder(['cover', 'patterns[0]', 'patterns[1]'], { 'patterns[1]': [{ ref: 'z' }], cover: [{ ref: 'c' }] }).map(o => o.path).join() === 'cover,patterns[1]', 'D8 the clip runs in slot order, the cover first, skipping slots with nothing landed');
ok(D.takeFileName({ tier: 'final', at: '2026-10-30T12:00:00Z' }, 'WEEKLY 004') === 'unsurfaced-weekly-004-final-2026-10-30.mp4', 'D9 a take\'s file name');
// the day as a row
const day = await D.daySlotRow({}, 213);
ok(day && day.id === 'day:213' && day.day.id === 'ed-213' && day.read.title === 'People buy the shoe before the sheet' && day.read.frames.length === 1 && day.read.frames[0].item_id === 7701 && day.pack_ids.join() === '7701,7702' && day.meta.slots['frames[0]'].rights_id === 'h1' && day.meta.takes.cover.length === 1, 'D10 a published day is a slot row: the cover line as the title, the frames, the slots and takes from editions.frames, the stories as the pack');
ok((await D.daySlotRow({}, 9999)) === null && (await D.daySlotRow({}, 'x')) === null, 'D11 an unpublished or junk issue is no row');
patches = [];
await D.daySlotPatch({}, day, { meta: { slots: { cover: { rights_id: 'h1' } }, briefs: {}, takes: day.meta.takes, clip: null } });
ok(patches.length === 1 && patches[0].frames.cover_line === 'People buy the shoe before the sheet' && patches[0].frames.slots.cover.rights_id === 'h1' && patches[0].frames.takes.cover.length === 1 && day.meta.slots.cover.rights_id === 'h1', 'D12 a day\'s slot patch lands on editions.frames beside the writer\'s copy, and the row sees it');
// takes resolved
const tk = await D.slotTakesResolve({}, { cover: [{ request_id: 'req-landed', tier: 'draft' }, { request_id: 'req-open', tier: 'final' }] });
ok(tk.cover[0].ref === 'play/u/house/req-landed.mp4' && tk.cover[0].status === 'done' && tk.cover[0].url === '/media/play/u/house/req-landed.mp4' && !tk.cover[1].ref, 'D13 a take that landed carries its record; one still rendering carries none');
const ex = await D.slotDoorExtras({}, day);
ok(ex.video.draft.usd === 0.48 && ex.takes.cover[0].ref && ex.day.issue_no === 213 && ex.clip === null, 'D14 /reads/slots carries the menu with its costs, the takes resolved, and the day');
// the source law
const ctxRead = { row: { id: 41, read: wk, meta: { slots: {}, takes: {} }, pack_ids: [1, 2] }, sp: 'patterns[0]', target: S.slotTarget(wk, 'patterns[0]'), slots: {}, briefs: {} };
ok((await D.slotVideoSource({}, ctxRead, null)).error === 'no_source', 'D15 a read\'s slot with no image and no choice has no source: nothing renders');
ok((await D.slotVideoSource({}, Object.assign({}, ctxRead, { slots: { 'patterns[0]': { rights_id: 'ty', kind: 'type' } } }), null)).error === 'typographic_slot', 'D16 a typographic slot has no image to move');
const srcH = await D.slotVideoSource({}, Object.assign({}, ctxRead, { slots: { 'patterns[0]': { rights_id: 'h1', kind: 'house' } } }), null);
ok(srcH.kind === 'house' && srcH.parent === 'h1' && srcH.url === 'https://api.unsurfaced-intelligence.com/media/make/h1.jpg' && srcH.rec.made.brief.scene, 'D17 the slot\'s own cleared house image is the source, by its public url, the record as the parent');
ok((await D.slotVideoSource({}, ctxRead, { rights_id: 'v1' })).error === 'source_is_video' && (await D.slotVideoSource({}, ctxRead, { rights_id: 'bad' })).error === 'source_not_cleared' && (await D.slotVideoSource({}, ctxRead, { rights_id: 'none' })).error === 'no_such_record', 'D18 a video, a record that failed a hard check, and a record that does not exist are refused');
ok((await D.slotVideoSource({}, ctxRead, { rights_id: 'p1' })).parent === 'p1', 'D19 a PLAY image is checked at the door and moves once it clears');
ok((await D.slotVideoSource({}, ctxRead, { story: 'S1' })).url === 'https://api.unsurfaced-intelligence.com/img/s/1' && (await D.slotVideoSource({}, ctxRead, { story: 'S9' })).error === 'not_in_the_read', 'D20 a story photograph the read stands on is a source through the relay; one it does not is refused');
const ctxDay = { row: day, sp: 'frames[0]', target: S.slotTarget(day.read, 'frames[0]'), slots: {}, briefs: {} };
ok((await D.slotVideoSource({}, ctxDay, null)).url === 'https://api.unsurfaced-intelligence.com/img/s/7701', 'D21 a day\'s frame with no slot moves its story\'s photograph');
// the routes
renders = []; patches = []; events = [];
const rowR = { id: 41, read: wk, meta: { slots: { 'patterns[0]': { rights_id: 'h1', kind: 'house' } }, briefs: { 'patterns[0]': { scene: 'The desk brief, forty characters and more of it here', light: 'north', red: 'ink' } }, takes: {} }, pack_ids: [1] };
const ctxR = { row: rowR, sp: 'patterns[0]', target: S.slotTarget(wk, 'patterns[0]'), slots: rowR.meta.slots, briefs: rowR.meta.briefs };
let r = await D.slotDoorRoute('/reads/slot-video', { tier: 'draft', motion: 'the ink dries' }, {}, '', { id: 'u1', email: 'fresco@x' }, ctxR);
ok(r.ok && r.take.request_id === 'req-1' && r.take.tier === 'draft' && r.take.seconds === 4 && r.take.resolution === '720p' && r.take.usd === 0.48 && r.take.source.parent === 'h1' && r.take.by === 'fresco', 'D22 a draft take is asked and recorded on the slot with its cost, its source and who asked');
ok(renders[0].pool === 'video.draft' && renders[0].house === true && renders[0].image_url === 'https://api.unsurfaced-intelligence.com/media/make/h1.jpg' && renders[0].parent === 'h1' && renders[0].surface === 'slots' && renders[0].source === '41:patterns[0]' && /^The desk brief/.test(renders[0].prompt) && /Motion: the ink dries$/.test(renders[0].prompt) && renders[0].resolution === '720p' && renders[0].seconds === 4 && renders[0].aspect === '9:16',
  'D23 playRender is asked with the house flag, the slot\'s brief as the shot, the admin\'s motion, the source image and its record as parent, portrait as the frames are');
ok(patches.length === 1 && patches[0].meta.takes['patterns[0]'][0].request_id === 'req-1' && events[0].ev === 'slot_take' && events[0].meta.usd === 0.48, 'D24 the take is written on the row and logged with its cost');
r = await D.slotDoorRoute('/reads/slot-video', { tier: 'final', seconds: 10 }, {}, '', { id: 'u1' }, ctxR);
ok(!r.ok && r.error === 'render_budget' && rowR.meta.takes['patterns[0]'].length === 1, 'D25 a refusal from PLAY (the meter, the budget) is the door\'s answer and writes no take');
r = await D.slotDoorRoute('/reads/slot-video', { tier: 'final' }, {}, '', { id: 'u1' }, ctxR);
ok(r.ok && r.take.resolution === '1080p' && r.take.seconds === 5 && r.take.usd === 0.7 && renders[2].resolution === '1080p' && rowR.meta.takes['patterns[0]'][0].request_id === 'req-3' && rowR.meta.takes['patterns[0]'].length === 2, 'D26 a final take is five seconds at 1080p for $0.70, newest first on the slot');
r = await D.slotDoorRoute('/reads/slot-video', { tier: 'draft' }, {}, '', { id: 'u1' }, Object.assign({}, ctxR, { slots: {} }));
ok(!r.ok && r.error === 'no_source' && renders.length === 3, 'D27 no source, no render: the fal call is never made');
r = await D.slotDoorRoute('/reads/slot-take', { request_id: 'req-3' }, {}, '', { id: 'u1' }, ctxR);
ok(r.ok && rowR.meta.takes['patterns[0]'][0].pick === true && rowR.meta.takes['patterns[0]'][1].pick === undefined, 'D28 a take marked for the clip; one mark per slot');
r = await D.slotDoorRoute('/reads/slot-take', { request_id: 'req-1', drop: true }, {}, '', { id: 'u1' }, ctxR);
ok(r.ok && rowR.meta.takes['patterns[0]'].length === 1 && (await D.slotDoorRoute('/reads/slot-take', { request_id: 'nope' }, {}, '', { id: 'u1' }, ctxR)).error === 'no_such_take', 'D29 a take dropped from the slot; an unknown take refused');
r = await D.slotDoorRoute('/reads/slot-clip', {}, {}, '', { id: 'u1' }, { row: rowR, slots: rowR.meta.slots, briefs: {} });
ok(!r.ok && r.error === 'need_two_takes' && assembles.length === 0, 'D30 the clip needs two landed takes; nothing is asked of fal until then');
rowR.meta.takes = { cover: [{ request_id: 'req-landed', tier: 'draft', at: 'a' }], 'patterns[0]': [{ request_id: 'req-final', tier: 'final', at: 'b' }, { request_id: 'req-open', tier: 'draft' }] };
r = await D.slotDoorRoute('/reads/slot-clip', {}, {}, '', { id: 'u1', email: 'fresco@x' }, { row: rowR, slots: rowR.meta.slots, briefs: {} });
ok(r.ok && r.clip.request_id === 'req-clip' && r.clip.n === 2 && r.clip.paths.join() === 'cover,patterns[0]' && assembles[0].video_urls.join() === 'https://api.unsurfaced-intelligence.com/media/play/u/house/req-landed.mp4,https://api.unsurfaced-intelligence.com/media/play/u/house/req-final.mp4' && assembles[0].project === 'house' && rowR.meta.clip.by === 'fresco',
  'D31 the clip stitches the landed takes in slot order through assemble, the cover first, and is kept on the row');
const cl = await D.slotClipResolve({}, { request_id: 'req-final', n: 2 });
ok(cl.ref === 'play/u/house/req-final.mp4' && cl.status === 'done' && (await D.slotClipResolve({}, { request_id: 'req-open' })).ref === undefined, 'D32 a clip that landed carries its record');

// ── E: a rewrite of the day\'s frames carries the slots ──────────────────────────────────────────────────
const C = new Function(fn('dayFramesCarry') + fn('dayFramesMerge') + '; return { dayFramesCarry, dayFramesMerge };')();
const prev = { frames: [{ item_id: 1, headline: 'a' }, { item_id: 2, headline: 'b' }, { item_id: 3, headline: 'c' }, { from: 'feed', drop_key: 'd1', headline: 'feed' }],
  slots: { cover: { rights_id: 'c0' }, 'frames[0]': { rights_id: 's1' }, 'frames[2]': { rights_id: 's3' }, 'frames[3]': { rights_id: 'sf' } }, briefs: { 'frames[1]': { scene: 'x' } }, takes: { 'frames[2]': [{ request_id: 'r' }] }, clip: { request_id: 'k' } };
const fresh = { v: 1, cover_line: 'new', frames: [{ item_id: 3, headline: 'c2' }, { item_id: 1, headline: 'a2' }, { item_id: 9, headline: 'n' }], caption: '' };
const m = C.dayFramesMerge(fresh, prev);
ok(m.frames.length === 4 && m.frames[3].from === 'feed', 'E1 the feed\'s frame still survives the rewrite (RD1b)');
ok(m.slots.cover.rights_id === 'c0' && m.slots['frames[1]'].rights_id === 's1' && m.slots['frames[0]'].rights_id === 's3' && !m.slots['frames[2]'] && !m.slots['frames[3]'] && m.briefs['frames[1]'] === undefined && m.takes['frames[0]'][0].request_id === 'r' && m.clip.request_id === 'k',
  'E2 the slots, briefs and takes follow their stories to their new places; the cover\'s stay; a frame that vanished (story 2) loses its brief; the feed frame has no story and loses its slot');
ok(C.dayFramesMerge(fresh, null).slots === undefined && C.dayFramesMerge(fresh, { frames: [] }).frames.length === 3, 'E3 a first write carries nothing');

// ── F: the routes dispatched ─────────────────────────────────────────────────────────────────────────────
ok(/case '\/reads\/slot-video':\s+\/\/ SEAM:VIDEO_DOOR \(RD1c\)[^\n]*\n\s+case '\/reads\/slot-take':\n\s+case '\/reads\/slot-clip':\n/.test(w) && /\/\^\\\/reads\\\/slots\?\(\?:-brief\|-make\|-final\|-video\|-take\|-clip\)\?\$\/\.test\(path\)\) return slotRoute\(/.test(w), 'F1 the three doors reach slotRoute through readRoute, admin only');
const sr = between(w, 'async function slotRoute(path, body, env, origin, user) {', '/* SEAM:READ_DESIGN image relay');
ok(/const row = \/\^day:\\d\+\$\/\.test\(String\(body\.id \|\| ''\)\) && typeof daySlotRow === 'function' \? await daySlotRow\(env, parseInt\(String\(body\.id\)\.slice\(4\), 10\)\) : await readRow\(env, body\.id\);/.test(sr), 'F2 slotRoute reads a day:<issue> row through daySlotRow and a read through readRow');
ok((sr.match(/await slotPatch\(env, row, \{/g) || []).length === 4 && !/await readPatch\(env, row\.id, \{/.test(sr) && /async function slotPatch\(env, row, patch\) \{\s+if \(row && row\.day && typeof daySlotPatch === 'function'\) return daySlotPatch\(env, row, patch\);\s+return readPatch\(env, row\.id, patch\);/.test(w), 'F3 every slot patch goes through slotPatch: the read\'s row, or the day\'s frames');
ok(/const door = typeof slotDoorExtras === 'function' \? await slotDoorExtras\(env, row\) : \{\};/.test(sr) && /return json\(Object\.assign\(\{ ok: true, id: row\.id, paths, slots, briefs, rights: recs/.test(sr), 'F4 /reads/slots carries the door\'s extras');
ok(sr.indexOf("if (path === '/reads/slot-clip') {") < sr.indexOf("const sp = String(body.path || '').trim();") && /if \(path === '\/reads\/slot-video' \|\| path === '\/reads\/slot-take'\) \{[^]*?return slotDoorRoute\(path, body, env, origin, user, \{ row, sp, target, slots, briefs \}\);/.test(sr), 'F5 the clip is dispatched before the path is required; a take after the slot is known');
ok(!/queue\.fal\.run/.test(door) && !/callClaude\(|callModel\(|env\.AI\.run\(/.test(door), 'F6 the door spends through playRender and playAssemble only: no fal call, no model call of its own');
ok(!/'slotDoorRoute'|'slotVideoSource'/.test(gate), 'F7 no new spender is registered because none was made');

// ── G: the page ─────────────────────────────────────────────────────────────────────────────────────────
const pblock = between(page, '/* SEAM:VIDEO_DOOR (RD1c): THE VIDEO in THE SLOTS', '/* THE SLOTS, FROM THE ASSETS');
ok(!DASH.test(pblock), 'G0 no em dash in the page\'s door');
ok(/function slotsAfter\(row\) \{ if \(row && typeof row\.after === "function"\) row\.after\(\); else openRead\(row\.id\); \}/.test(page) && (between(page, '  function slotsBind(row) {', '  function deskPanel(html) {').match(/slotsAfter\(row\);/g) || []).length === 5 && !/function slotsBind[^]*?openRead\(row\.id\)[^]*?function deskPanel/.test(page), 'G1 after a slot changes, a read is opened again or the day is drawn again');
ok(/THE VIDEO<\/b>/.test(pblock) && /id="sp-take-draft"/.test(pblock) && /id="sp-take-final"/.test(pblock) && /id="sp-clip">Stitch the clip · \$0<\/button>/.test(pblock) && /id="sp-motion"/.test(pblock), 'G2 THE VIDEO: a draft, a final, what moves, the clip');
ok(/usd\(dr\)/.test(pblock) && /usd\(fi\)/.test(pblock) && /Nothing renders until you press/.test(pblock) && /never sits in a slot/.test(pblock), 'G3 the buttons carry their cost and the note says nothing renders on its own');
ok(/call\("\/reads\/slot-video", \{ id: row\.id, path: p, tier: tier, motion: motion \}\)/.test(pblock) && /call\("\/reads\/slot-clip", \{ id: row\.id \}\)/.test(pblock) && /call\("\/reads\/slot-take", \{ id: row\.id, path: p, request_id: bt\.getAttribute\("data-tpick"\) \}\)/.test(pblock) && /drop: true/.test(pblock), 'G4 the page asks the three doors');
ok(/fetch\(API \+ "\/play\/render\/" \+ encodeURIComponent\(id\), \{ headers: \{ Authorization: "Bearer " \+ token \} \}\)/.test(pblock) && /VD\.polls > 120/.test(pblock), 'G5 a take still rendering is polled through PLAY\'s status door, twelve minutes at most');
ok(/Use in the clip/.test(pblock) && /data-tdrop/.test(pblock) && /download=1&name=/.test(pblock) && /<video src="' \+ API \+ "\/media\/" \+ esc\(t\.ref\)/.test(pblock), 'G6 a landed take plays, downloads, can be marked for the clip or dropped');
ok(/function dayRow\(ed, items, fr\)/.test(pblock) && /id: "day:" \+ ed\.issue_no/.test(pblock) && /after: function \(\) \{ dailyDay\(ed\.issue_no\); \}/.test(pblock) && /rc\["S" \+ it\.id\]/.test(pblock), 'G7 a day is a slot row on the page: day:<issue>, its stories as the photographs, the day drawn again after');
ok(/slotsVideoHtml\(d, p, row\) \+/.test(page) && /slotsVideoBind\(row\);/.test(page) && /var RCX = row\.rc \|\| RC_ALL, ids = Object\.keys\(RCX\)/.test(page), 'G8 the slots panel shows the door and reads a day\'s stories');
ok(/extra: ' <button class="btn" data-fr="slots">The slots<\/button>' \}\)\.then\(function \(wrapEl\)/.test(page) && /slotsOpen\(dayRow\(ed, items, fr\), null\)/.test(page), 'G9 a day\'s frames offer The slots');
ok(/pools: frames\.map\(function \(f, j\) \{ return dayFramePool\(fr, "frames\[" \+ fidx\[j\] \+ "\]", f\.item_id\); \}\)/.test(page) && /img: function \(id\) \{ return dayFrameImg\(byId, id\); \}/.test(page) && /credit: function \(id\) \{ return dayFrameCredit\(fr, byId, id\); \}/.test(page), 'G10 a day\'s frames draw a slot\'s image in place of the story\'s photograph');
const PG = new Function('API', pblock.split('function dayFramePool')[1] ? 'function dayFramePool' + pblock.split('function dayFramePool')[1] + '; return { dayFramePool, dayFrameImg, dayFrameCredit };' : '')('https://api');
const frx = { slots: { 'frames[0]': { ref: 'make/x.jpg', kind: 'house', credit: 'Unsurfaced, AI illustration' }, 'frames[1]': { ref: 'type:1', kind: 'type' }, cover: { ref: 'S77', kind: 'story_obj', credit: 'Photo: Wired' } } };
ok(PG.dayFramePool(frx, 'frames[0]', 7).join() === 'slot:make/x.jpg' && PG.dayFramePool(frx, 'frames[1]', 7).length === 0 && PG.dayFramePool(frx, 'frames[2]', 7).join() === '7' && PG.dayFramePool(frx, 'cover', null).join() === 'slot:S77', 'G11 the pool: the slot\'s record, nothing for a typographic slot, the story otherwise');
ok(PG.dayFrameImg({ '7': {} }, 'slot:make/x.jpg') === 'https://api/media/make/x.jpg' && PG.dayFrameImg({}, 'slot:S77') === 'https://api/img/s/77' && PG.dayFrameImg({ '7': {} }, '7') === 'https://api/img/s/7' && PG.dayFrameImg({}, '8') === null, 'G12 a slot image comes from the house\'s storage, a story through the relay');
ok(PG.dayFrameCredit(frx, {}, 'slot:make/x.jpg') === 'Unsurfaced, AI illustration' && PG.dayFrameCredit(frx, { '7': { source_name: 'Wired' } }, '7') === 'Photo: Wired', 'G13 the credit follows the slot or the story');
ok(/\.slots \.sp-video \{/.test(page) && /\.slots \.sp-take \{/.test(page) && /\.slots \.sp-take \.pic video/.test(page), 'G14 the door\'s styles');

// ── H: the registry, no migration ────────────────────────────────────────────────────────────────────────
ok(seams.registry['SEAM:VIDEO_DOOR'] && seams.registry['SEAM:VIDEO_DOOR'].file === 'worker/src/index.js' && seams.registry['SEAM:VIDEO_DOOR@read'] && seams.registry['SEAM:VIDEO_DOOR@read'].tag === 'SEAM:VIDEO_DOOR', 'H1 SEAM:VIDEO_DOOR is registered on the worker and the read page');
ok(!fs.existsSync('supabase/migrations/0060_video_door.sql') && /frames: fr \}/.test(door), 'H2 no migration: the day\'s slots live on editions.frames and the take\'s parent on the record\'s made');
console.log(`\nproof_video_door: ${pass} checks passed`);
