/**
 * proof_assets.mjs  --  AS1 THE ASSETS (SEAM:ASSETS, SEAM:ASSETS@read).
 * PLAY's renders are rights records (kind play, the prompt kept, cleared for nothing until checked); a PLAY image set on a slot is
 * checked at pick time and a video never sits in a slot; the archive is backfilled from R2 by the desk, idempotent on the ref; a
 * slot can be filled from the records the house holds; every record downloads; the event log's platform list carries play.
 * Run from the repo root: node worker/proofs/proof_assets.mjs
 */
import fs from 'node:fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const mig = fs.readFileSync('supabase/migrations/0059_assets.sql', 'utf-8');
let pass = 0;
function ok(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok ' + m); }
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };

// ── A: the rights law, sliced pure ──────────────────────────────────────────────────────────────────────────────────────
const rightsSrc = between(w, 'const RIGHTS = {', 'async function rightsInsert(');
const R = new Function(rightsSrc + '; return { RIGHTS, rightsContexts, rightsClears };')();
ok(R.RIGHTS.KINDS.includes('play') && R.RIGHTS.BASIS.play === 'AIR', 'A1 play is a rights kind on the house basis');
ok(R.rightsContexts('play', null).length === 0 && R.rightsContexts('play', {}).length === 0, 'A2 a PLAY record clears nothing until it is checked');
ok(R.rightsContexts('play', { hard: [], advisory: [] }).length === R.RIGHTS.CONTEXTS.length, 'A3 a checked PLAY image with no hard fault clears every context, as a house draft does');
ok(R.rightsContexts('play', { hard: ['logo'] }).length === 0 && R.rightsContexts('play', { hard: ['logo'], override: { why: 'the mark is ours' } }).length === R.RIGHTS.CONTEXTS.length,
  'A4 a hard fault clears nothing; the admin\'s override on the record clears as a pass');
ok(R.rightsContexts('own', null).length === R.RIGHTS.CONTEXTS.length && R.rightsContexts('press', null).length === 7 && R.rightsContexts('story_obj', null).length === 4, 'A5 the other kinds are as ED2 left them');

// ── B: the block, sliced pure ───────────────────────────────────────────────────────────────────────────────────────────
const src = between(w, 'const PLAY_ASSETS = {', '/* PURE: the slots a read carries, by path.');
ok(!/\u2014/.test(src) && !/\\u2014/.test(src), 'B0 no em dash in the block');
function mk(f) {
  return new Function('RIGHTS', 'rightsContexts', 'rightsByRef', 'rightsInsert', 'imageCheck', 'sbRest', 'excQuiet', 'entityStateGet', 'entityStatePut', 'logEvent',
    src + '; return { PLAY_ASSETS, playIsVideo, playUserId, playRightsRecord, playBackfillRecord, playBackfillFresh, playChunks, playRightsWrite, playRecordChecked, playAssetsBackfill, houseAssetsForSlot };')(
    R.RIGHTS, R.rightsContexts, f.rightsByRef || (async () => null), f.rightsInsert || (async (env, r) => Object.assign({ id: 'new' }, r)), f.imageCheck || (async () => ({ hard: [], advisory: [], unknown: [], shows: '' })),
    f.sbRest || (async () => []), f.excQuiet || ((name, dflt) => () => dflt), f.entityStateGet || (async () => ({})), f.entityStatePut || (async () => {}), f.logEvent || (() => {}));
}
const B = mk({});
const U = '6a13b794-711e-5688-a571-f8b0ee153aa8';
ok(B.playIsVideo({ made: { kind: 'video' }, ref: 'play/u/p/x.jpg' }) && B.playIsVideo({ ref: 'play/u/p/x.mp4' }) && !B.playIsVideo({ made: { kind: 'image' }, ref: 'play/u/p/x.jpg' }), 'B1 a video by what its maker said, else by its key');
const long = 'x'.repeat(3000);
const rec1 = B.playRightsRecord({ model: 'fal-ai/kling-video/v3/standard/image-to-video', kind: 'video', seconds: 5, prompt: long, project: 'jordanbrand', unit: 'u5', user: U }, 'play/' + U + '/jordanbrand/req1.mp4', 'req1', '2026-10-30T15:00:00.000Z');
ok(rec1.kind === 'play' && rec1.ref === 'play/' + U + '/jordanbrand/req1.mp4' && rec1.basis === 'AIR' && rec1.contexts.length === 0 && rec1.credit === 'Unsurfaced PLAY', 'B2 a finished render\'s record: kind play, the key as the ref, cleared for nothing');
ok(rec1.made.kind === 'video' && rec1.made.seconds === 5 && rec1.made.prompt.length === 2500 && rec1.made.project === 'jordanbrand' && rec1.made.unit === 'u5' && rec1.made.request_id === 'req1' && rec1.created_by === U && rec1.made.at === '2026-10-30T15:00:00.000Z',
  'B3 the prompt is kept (cut at 2,500), the seconds, the project, the unit, the request and the user ride the record');
const rec2 = B.playRightsRecord({ model: 'fal-ai/flux-pro/v1.1', kind: 'image', seconds: 6, prompt: 'a stoop at dusk', project: 'engine', user: 'not-a-uuid' }, 'play/x/engine/r2.jpg', 'r2');
ok(rec2.made.kind === 'image' && rec2.made.seconds === null && rec2.created_by === null && rec2.made.user === 'not-a-uuid', 'B4 an image carries no seconds; a user that is not an id is kept on the record but never as created_by');
const bf = B.playBackfillRecord('play/' + U + '/jordanbrand/abc-123.mp4', new Date('2026-10-20T10:00:00Z'));
ok(bf && bf.kind === 'play' && bf.made.backfilled === true && bf.made.kind === 'video' && bf.made.prompt === null && bf.made.project === 'jordanbrand' && bf.made.request_id === 'abc-123' && bf.created_by === U && bf.created_at === '2026-10-20T10:00:00.000Z',
  'B5 a render made before the cut gets its record from its key: who, which project, which kind; the prompt unknown; dated by its upload');
ok(B.playBackfillRecord('play/u/thumbs.txt') === null && B.playBackfillRecord('make/abc.jpg') === null && B.playBackfillRecord('play/u/x.jpg') === null, 'B6 a key that is not a render under play/<user>/<project>/ gets no record');
const fresh = B.playBackfillFresh([{ key: 'play/u/p/a.jpg', uploaded: new Date() }, { key: 'play/u/p/b.mp4', uploaded: new Date() }, { key: 'play/u/p/notes.json' }], ['play/u/p/a.jpg']);
ok(fresh.length === 1 && fresh[0].ref === 'play/u/p/b.mp4', 'B7 only the keys with no record become records; a file that is not a render is passed over');

// B8: the backfill over two pages, idempotent, the cursor kept, done once
{
  const pages = [
    { objects: [{ key: 'play/u/p/a.jpg', uploaded: new Date('2026-10-01T00:00:00Z') }, { key: 'play/u/p/b.jpg', uploaded: new Date('2026-10-02T00:00:00Z') }], truncated: true, cursor: 'c1' },
    { objects: [{ key: 'play/u/p/c.mp4', uploaded: new Date('2026-10-03T00:00:00Z') }], truncated: false }];
  const listed = [], inserted = [], state = {};
  const env = { MEDIA: { list: async o => { listed.push(o.cursor || null); return pages[listed.length - 1]; } } };
  const sbRest = async (env, path, o) => {
    if (/^media_rights\?kind=eq\.play/.test(path)) { const known = ['play/u/p/a.jpg'].concat(inserted.map(r => r.ref)); return (decodeURIComponent(path).match(/"([^"]+)"/g) || []).map(q => q.slice(1, -1)).filter(k => known.includes(k)).map(ref => ({ ref })); }
    if (path === 'media_rights' && o && o.method === 'POST') { inserted.push(...o.body); return o.body.map((r, i) => Object.assign({ id: 'i' + i }, r)); }
    return [];
  };
  const Bb = mk({ sbRest, entityStateGet: async () => state, entityStatePut: async (env, k, v) => { state[k] = v; } });
  const out = await Bb.playAssetsBackfill(env, { steps: 10 });
  ok(out.ok && out.done && out.steps === 2 && out.listed === 3 && out.written === 2 && listed[0] === null && listed[1] === 'c1', 'B8 two pages listed with the cursor, three keys seen, the two without a record written, done');
  ok(inserted.every(r => r.kind === 'play' && r.made.backfilled) && inserted.map(r => r.ref).join(',') === 'play/u/p/b.jpg,play/u/p/c.mp4' && state.assets_play.done === true, 'B9 the records are kind play and backfilled; the cursor row says done');
  const again = await Bb.playAssetsBackfill(env, { steps: 10 });
  ok(again.done && again.steps === 0 && listed.length === 2, 'B10 a finished pass answers done and lists nothing more until asked again');
  listed.length = 0; pages[0].truncated = false;
  const re = await Bb.playAssetsBackfill(env, { steps: 10, again: true });
  ok(re.steps === 1 && re.written === 0 && listed.length === 1, 'B11 asked again it relists from the start and writes nothing for keys that have their record');
}
// B12: the one-step budget
{
  const env = { MEDIA: { list: async () => ({ objects: [], truncated: true, cursor: 'z' }) } };
  const state = {};
  const Bc = mk({ entityStateGet: async () => state, entityStatePut: async (env, k, v) => { state[k] = v; } });
  const out = await Bc.playAssetsBackfill(env, { steps: 1 });
  ok(out.steps === 1 && !out.done && out.cursor === 'z' && state.assets_play.cursor === 'z', 'B12 a step is one page; the cursor is kept for the next call');
  const none = await Bc.playAssetsBackfill({}, {});
  ok(none.ok === false && none.error === 'media_unconfigured', 'B13 without storage the pass says so');
}
// B14: the pick-time check
{
  const patched = [];
  const Bd = mk({ imageCheck: async (env, ref) => ref === 'play/u/p/bad.jpg' ? { hard: ['logo'], advisory: [], unknown: [], shows: 'a swoosh' } : { hard: [], advisory: [], unknown: [], shows: 'a stoop' },
    sbRest: async (env, path, o) => { patched.push({ path, body: o && o.body }); return []; } });
  const good = await Bd.playRecordChecked({}, { id: 'g', kind: 'play', ref: 'play/u/p/good.jpg', made: { play: true, kind: 'image' } });
  ok(good.contexts.length === R.RIGHTS.CONTEXTS.length && good.made.checks.hard.length === 0 && good.made.checked_at && patched[0].path === 'media_rights?id=eq.g' && patched[0].body.contexts.length === R.RIGHTS.CONTEXTS.length,
    'B14 an unchecked PLAY image is checked at pick time and its verdict is written as the contexts');
  const bad = await Bd.playRecordChecked({}, { id: 'b', kind: 'play', ref: 'play/u/p/bad.jpg', made: { play: true, kind: 'image' } });
  ok(bad.contexts.length === 0 && bad.made.checks.hard[0] === 'logo' && !R.rightsClears(bad, 'weekly_pdf'), 'B15 a hard fault clears nothing; the pick route then asks for the override\'s reason');
  const same = await Bd.playRecordChecked({}, { id: 's', kind: 'play', ref: 'play/u/p/s.jpg', made: { checks: { hard: [] } }, contexts: ['web'] });
  const house = await Bd.playRecordChecked({}, { id: 'h', kind: 'house', ref: 'make/h.jpg' });
  ok(same.contexts.length === 1 && house.kind === 'house' && patched.length === 2, 'B16 a record already checked, or of another kind, is returned as it is and nothing is written');
}
// B17: a finished render writes once per key
{
  let inserted = 0;
  const Be = mk({ rightsByRef: async (env, ref) => ref === 'play/u/p/have.jpg' ? { id: 'have' } : null, rightsInsert: async (env, r) => { inserted++; return Object.assign({ id: 'n' }, r); } });
  const a = await Be.playRightsWrite({}, { model: 'm', kind: 'image', prompt: 'p', user: U }, 'play/u/p/have.jpg', 'r');
  const b = await Be.playRightsWrite({}, { model: 'm', kind: 'image', prompt: 'p', user: U }, 'play/u/p/new.jpg', 'r2');
  ok(a.id === 'have' && b.id === 'n' && inserted === 1 && b.made.prompt === 'p', 'B17 a key that has its record is not written twice');
}
// B18: the records a slot may be filled from
{
  const all = [
    { id: '1', kind: 'house', contexts: R.RIGHTS.CONTEXTS.slice(), made: {} }, { id: '2', kind: 'house', contexts: [], made: { hard: 1 } },
    { id: '3', kind: 'own', contexts: R.RIGHTS.CONTEXTS.slice(), made: {} }, { id: '4', kind: 'type', contexts: R.RIGHTS.CONTEXTS.slice(), made: {} },
    { id: '5', kind: 'story_obj', contexts: ['weekly_pdf'], made: {} }, { id: '6', kind: 'play', contexts: [], made: { kind: 'image' } },
    { id: '7', kind: 'play', contexts: [], made: { kind: 'video' } }, { id: '8', kind: 'play', contexts: [], made: { kind: 'image', hard: 1 } },
    { id: '9', kind: 'play', contexts: R.RIGHTS.CONTEXTS.slice(), made: { kind: 'image', hard: 1, overridden: true } }, { id: '10', kind: 'press', contexts: ['web'], made: {} }];
  ok(B.houseAssetsForSlot(all).map(a => a.id).join(',') === '1,3,6,9', 'B18 a slot may take a cleared image, or a PLAY image not yet checked or overridden; never a block, a story\'s own photograph, a video, a failed check, or an image the page is not cleared for');
}

// ── C: the house list and the routes ────────────────────────────────────────────────────────────────────────────────────
{
  const hsrc = between(w, 'const HOUSE = {', 'async function readRoute(');
  const recs = [{ id: 'p1', kind: 'play', ref: 'play/u/p/a.jpg', contexts: [], made: { play: true, kind: 'image', model: 'fal-ai/flux-pro/v1.1', prompt: 'a stoop at dusk, ' + 'x'.repeat(500), project: 'engine', seconds: null }, created_at: '2026-10-30' },
    { id: 'p2', kind: 'play', ref: 'play/u/p/b.mp4', contexts: [], made: { play: true, kind: 'video', seconds: 5, checks: { hard: [] } }, created_at: '2026-10-30' },
    { id: 'h1', kind: 'house', ref: 'make/x.jpg', contexts: R.RIGHTS.CONTEXTS.slice(), made: {}, created_at: '2026-10-29' },
    { id: 't1', kind: 'type', ref: 'type:1:cover', contexts: R.RIGHTS.CONTEXTS.slice(), made: {}, created_at: '2026-10-29' }];
  const H = new Function('sbRest', 'excQuiet', 'json', 'houseAssetsForSlot', hsrc + '; return { houseAssets, houseRoute };')(
    async (env, path) => /^media_rights/.test(path) ? recs : [], (n, d) => () => d, (o, st) => ({ body: o, status: st }), B.houseAssetsForSlot);
  const all = await H.houseAssets({}, {});
  ok(all.assets.length === 4 && all.counts.play === 2 && all.assets[0].url === '/media/play/u/p/a.jpg' && all.assets[0].made.prompt.length === 400 && all.assets[0].made.kind === 'image' && all.assets[0].made.checked === false && all.assets[1].made.checked === true && all.assets[1].made.seconds === 5,
    'C1 the list carries PLAY\'s records with the prompt (cut at 400), the kind, the seconds and whether they were checked');
  const slot = await H.houseAssets({}, { for_slot: true });
  ok(slot.assets.map(a => a.id).join(',') === 'p1,h1', 'C2 for_slot keeps the cleared house image and the unchecked PLAY image; the video and the block fall away');
  const onlyPlay = await H.houseAssets({}, { kind: 'play' });
  ok(onlyPlay.assets.length === 2 && onlyPlay.counts.house === 1, 'C3 kind narrows the list; the counts stay whole');
  const r = await H.houseRoute('/reads/assets', { for_slot: true }, {}, null, {});
  ok(r.body.ok && r.body.assets.length === 2, 'C4 the route passes for_slot through');
}
const pick = between(w, "} else if (pick.rights_id) {", "} else if (pick.clear === true) {");
ok(pick.includes("if (rec.kind === 'play') {") && pick.includes("'video_not_a_slot'") && pick.includes('rec = await playRecordChecked(env, rec);') && pick.indexOf("playRecordChecked") < pick.indexOf("rightsClears(rec, 'weekly_pdf') && why.length >= 12"),
  'C5 the pick route checks a PLAY image before the override and the clearance are judged, and refuses a video');
const submit = between(w, 'async function playRender(body, env, origin, user) {', 'async function playRenderStatus(');
ok(/prompt, seconds: pool\.kind === 'video' \? seconds : null \};/.test(submit), 'C6 the render\'s submit record carries the prompt and the seconds');
const done = between(w, 'async function playRenderStatus(', 'async function playUploadRef(');
ok(/rec\.asset = asset;\s*\n\s*if \(asset !== url\) await playRightsWrite\(env, rec, key, reqId\)\.catch\(excQuiet\('play_rights', null\)\);/.test(done), 'C7 a finished render the house holds writes its record; one fal gave back and storage refused writes none');
ok(/which === 'assets_play' \? await playAssetsBackfill\(env, \{ steps: parseInt\(body\.steps, 10\) \|\| undefined, again: !!body\.again \}\)/.test(w), 'C8 the desk runs the backfill');

// ── D: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/media-src 'self' blob: https:\/\/api\.unsurfaced-intelligence\.com;/.test(page), 'D1 the page may play a video from the API');
ok(page.includes('FROM THE ASSETS</b>') && page.includes('id="sp-assets"') && /function slotsAssets\(row\)/.test(page) && /call\("\/reads\/assets", \{ for_slot: true \}\)/.test(page) && /slotsAssets\(row\);/.test(page),
  'D2 THE SLOTS offers FROM THE ASSETS and asks the house for the records a slot may take');
ok(/function slotsUseAsset\(row, rid, rows, why\)/.test(page) && /pick: \{ rights_id: rid \}/.test(page) && page.includes('d.error === "not_cleared"') && page.includes('d.error === "video_not_a_slot"'),
  'D3 Use it writes the slot through /reads/slot; a failed check asks for the override\'s reason; a video is refused in words');
ok(/function assetDownloadUrl\(a\)/.test(page) && page.includes('"?download=1&name=" + encodeURIComponent(assetFileName(a))') && page.includes('a.url.indexOf("/media/") !== 0) return null'),
  'D4 a download is the object as an attachment, named; a story\'s relayed photograph has none');
const pg = new Function('API', 'esc', between(page, '  function assetFileName(a) {', '  function assetIsVideo(a)') + '; return { assetFileName, assetDownloadUrl };')('https://api.example', s => String(s));
ok(pg.assetFileName({ kind: 'play', ref: 'play/u/p/abc.mp4', created_at: '2026-10-30T15:00:00Z', id: '6a13b794-711e' }) === 'unsurfaced-play-2026-10-30-6a13b794.mp4' && pg.assetDownloadUrl({ url: '/media/play/u/p/abc.mp4', kind: 'play', ref: 'play/u/p/abc.mp4', id: 'x' }).startsWith('https://api.example/media/play/u/p/abc.mp4?download=1&name=unsurfaced-play-')
  && pg.assetDownloadUrl({ url: '/img/t/5', kind: 'story_obj', ref: 'S5' }) === null, 'D5 the file name is the kind, the day and the id with the object\'s own extension');
ok(page.includes('<div class="dl"><a class="btn" href="\' + esc(dl) + \'">Download</a></div>') && /function assetPicHtml\(a, h\)/.test(page) && page.includes('<video src="\' + API + esc(a.url) + \'" muted playsinline preload="metadata"'),
  'D6 every card in THE ASSETS downloads; a video record plays in its tile');
ok(page.includes('slot.kind === "play" ?') && page.includes('PLAY render · '), 'D7 a slot filled from PLAY says so');
ok(!/\u2014/.test(between(page, '  /* SEAM:ASSETS (AS1): every record downloads', '  function assetsUpload() {')), 'D8 no em dash in the page block');

// ── E: the migration and the seams ──────────────────────────────────────────────────────────────────────────────────────
ok(/drop constraint if exists media_rights_kind_check;/.test(mig) && /'own', 'play'\)\);/.test(mig), 'E1 0059 widens the rights kinds to play, idempotently');
ok(/drop constraint if exists activity_events_platform_check;/.test(mig) && /'home', 'play'\)\);/.test(mig), 'E2 0059 lets the event log carry play');
ok(seams.registry['SEAM:ASSETS'] && seams.registry['SEAM:ASSETS'].file === 'worker/src/index.js' && seams.registry['SEAM:ASSETS@read'] && seams.registry['SEAM:ASSETS@read'].file === 'intelligence/read/index.html', 'E3 the seams are registered on both surfaces');
ok((w.match(/logEvent\(env, 'play'/g) || []).length === 4, 'E4 the four PLAY events the log refused until 0059 are still logged under play');

console.log(`\nproof_assets: ${pass} checks passed`);
