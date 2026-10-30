/**
 * proof_house.mjs  --  RD1a THE ROOMS OF THE HOUSE (SEAM:HOUSE, SEAM:KNOWLEDGE@read).
 * READ is the house: the door opens on the library; each function is a room on the same page (?room=); the nights and the
 * assets are two admin lists that spend nothing; the feed lives in the house with its routes unchanged; the STUDIO overlay
 * and its doors have left the Intelligence page while its worker block, its routes and the muxer stay for RD1b.
 * Run from the repo root: node worker/proofs/proof_house.mjs
 */
import fs from 'node:fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const house = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
function ok(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok ' + m); }
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };

// ── A: the block, sliced pure ─────────────────────────────────────────────────────────────────────────────────────
const src = between(w, 'const HOUSE = {', 'async function readRoute(');
function mk(fakes) {
  return new Function('sbRest', 'excQuiet', 'json', src + '; return { HOUSE, houseAssetUrl, houseAssetUse, houseNightRows, houseChunks, houseAssets, houseNights, houseRoute };')(
    fakes.sbRest || (async () => []), fakes.excQuiet || ((name, dflt) => () => dflt), fakes.json || ((o, st) => ({ body: o, status: st })));
}
const H = mk({});
ok(!/—/.test(src) && !/\\u2014/.test(src), 'A1 no em dash in the block');
ok(H.houseAssetUrl({ kind: 'own', ref: 'own/abc.jpg' }) === '/media/own/abc.jpg' && H.houseAssetUrl({ kind: 'house', ref: 'make/x.jpg' }) === '/media/make/x.jpg', 'A2 the house\'s and its own photographs are served from R2');
ok(H.houseAssetUrl({ kind: 'story_obj', ref: 'S123' }) === '/img/t/123' && H.houseAssetUrl({ kind: 'story_thumb', ref: 'S9' }) === '/img/t/9', 'A3 a story\'s picture comes through the thumbnail relay');
ok(H.houseAssetUrl({ kind: 'type', ref: 'make/t.jpg' }) === null && H.houseAssetUrl({ kind: 'press', ref: 'kit-7', source_url: 'https://brand.example/kit.jpg' }) === 'https://brand.example/kit.jpg' && H.houseAssetUrl({ kind: 'cc', ref: 'cc-1' }) === null && H.houseAssetUrl(null) === null,
  'A4 a typographic block has no picture; a press image keeps the address its record holds; nothing is invented');
const use = H.houseAssetUse([
  { id: 10, kind: 'weekly', label: 'WEEKLY 004', version: 2, status: 'published', slots: { cover: { rights_id: 'r1' }, 'patterns[0]': { rights_id: 'r2' }, 'patterns[1]': { story: 'S5' } } },
  { id: 11, kind: 'recon', label: 'Costco', version: 1, status: 'ready', slots: { cover: { rights_id: 'r1' } } },
  { id: 12, kind: 'report', label: 'X', version: 1, status: 'ready', slots: ['nope'] }, { id: 13, slots: null }]);
ok(use.r1.length === 2 && use.r1[0].path === 'cover' && use.r1[1].id === 11 && use.r2.length === 1 && use.r2[0].path === 'patterns[0]' && Object.keys(use).length === 2,
  'A5 the reads that point at a record are found by their slots; a story slot and a malformed slots field count for nothing');
const rows = [
  { id: 'a1', frame_key: 'k1', night: '2026-10-29', status: 'ready', frame: { entity: 'Costco', category: 'retail' }, measures: { recent_7d: 40, outlets: 12, measured_from: '2026-08-06', coverage_weeks: 12 }, meta: { called: { verdict: 'held', by: '2026-10-28' } }, cost_usd: 0.02 },
  { id: 'a2', frame_key: 'k2', night: '2026-10-29', status: 'reused', frame: { entity: 'Apple' }, measures: {}, meta: {}, cost_usd: 0 },
  { id: 'a3', frame_key: 'k3', night: '2026-10-29', status: 'failed', error: 'measure_claim: read[0]: signals fell', frame: { entity: 'Target' }, measures: { recent_7d: 2 }, meta: {}, cost_usd: 0.01 },
  { id: 'a4', frame_key: 'k4', night: '2026-10-28', status: 'failed', error: 'TimeoutError', frame: { category: 'beauty' }, measures: {}, meta: {}, cost_usd: 0.005 },
  { id: 'a5', frame_key: 'k5', night: '2026-10-28', status: 'queued', frame: {}, measures: {}, meta: {}, cost_usd: null }];
const nights = H.houseNightRows(rows, [{ insight_id: 'a1', mark: 'held' }, { insight_id: 'a1', mark: 'held' }, { insight_id: 'a1', mark: 'wrong' }, { insight_id: 'zz', mark: 'useful' }], [{ reading_id: 'a1' }, { reading_id: 'a1' }, { reading_id: 'a3' }]);
ok(nights.length === 2 && nights[0].night === '2026-10-29' && nights[1].night === '2026-10-28', 'A6 the nights come newest first');
ok(nights[0].counts.ready === 1 && nights[0].counts.reused === 1 && nights[0].counts.held === 1 && nights[0].counts.failed === 0 && nights[1].counts.failed === 1 && nights[1].counts.other === 1,
  'A7 a row the measure-claim law stopped counts as held; a row that did not compile as failed; a queued one as other');
ok(nights[0].cost_usd === 0.03 && nights[1].cost_usd === 0.005, 'A8 the night\'s cost is the sum of its rows');
const r1 = nights[0].rows[0], r3 = nights[0].rows[2];
ok(r1.entity === 'Costco' && r1.category === 'retail' && r1.recent_7d === 40 && r1.outlets === 12 && r1.measured_from === '2026-08-06' && r1.coverage_weeks === 12 && r1.grade === 'held' && r1.check_by === '2026-10-28' && r1.marks.held === 2 && r1.marks.wrong === 1 && r1.marks.useful === 0 && r1.claims === 2,
  'A9 a row carries its subject, measure, coverage, grade, marks and claims count');
ok(r3.held === true && r3.status === 'failed' && /^measure_claim:/.test(r3.error) && r3.claims === 1 && nights[0].rows[1].recent_7d === null && nights[0].rows[1].grade === null, 'A10 a held row says why; a reused row with no measure says nothing it does not have');
ok(H.houseChunks(['a', 'b', 'c'], 2).length === 2 && H.houseChunks([], 2).length === 0, 'A11 ids are read in chunks');

// ── B: the two lists against a fake database ─────────────────────────────────────────────────────────────────────
const qs = [];
const fakeDb = async (env, path) => {
  qs.push(path);
  if (/^door_reads\?/.test(path)) return rows;
  if (/^insight_marks\?/.test(path)) return [{ insight_id: 'a1', mark: 'useful' }];
  if (/^claims\?/.test(path)) return [{ reading_id: 'a2' }];
  if (/^media_rights\?/.test(path)) return [{ id: 'r1', kind: 'own', ref: 'own/h.jpg', credit: 'Photo: Unsurfaced', basis: 'A', contexts: ['weekly_pdf', 'social'], made: { own: true, bytes: 1200, name: 'h.jpg', release: 'model release on file', by: 'u1' }, created_at: '2026-10-29T00:00:00Z' },
    { id: 'r2', kind: 'house', ref: 'make/m.jpg', credit: 'Unsurfaced, AI illustration', basis: 'AIR', contexts: [], made: { model: 'flux', checks: { hard: ['lettering'] } }, created_at: '2026-10-28T00:00:00Z' },
    { id: 'r3', kind: 'type', ref: 'type', credit: null, basis: 'A', contexts: ['web'], made: {}, created_at: '2026-10-27T00:00:00Z' }];
  if (/^house_reads\?/.test(path)) return [{ id: 10, kind: 'weekly', label: 'WEEKLY 004', version: 2, status: 'published', slots: { cover: { rights_id: 'r1' } } }];
  return [];
};
const F = mk({ sbRest: fakeDb });
const nn = await F.houseNights({}, 7);
ok(qs[0].startsWith('door_reads?night=gte.') && /order=night\.desc,id\.asc/.test(qs[0]) && /select=id,frame_key,night,status,error,frame,measures,meta,cost_usd/.test(qs[0]) && !/read,/.test(qs[0].replace('frame_key,', '')), 'B1 the nights read the door\'s rows by night, status and measure, never the read itself');
ok(qs.some(q => /^insight_marks\?insight_id=in\.\(a1,a2,a3,a4,a5\)&select=insight_id,mark$/.test(q)) && qs.some(q => /^claims\?src=eq\.door&reading_id=in\.\(a1,a2,a3,a4,a5\)&select=reading_id,confidence$/.test(q)), 'B2 marks and claims are counted by the rows\' ids, in chunks');
ok(nn.since && nn.nights.length === 2 && nn.nights[0].rows.find(r => r.id === 'a1').marks.useful === 1 && nn.nights[0].rows.find(r => r.id === 'a2').claims === 1, 'B3 the marks and claims land on their rows (found by id: RD1d orders a night held and failed first)');
qs.length = 0;
const aa = await F.houseAssets({});
ok(/^media_rights\?select=id,kind,ref,source_url,credit,basis,contexts,display_max_px,object_sentence,made,created_at&order=created_at\.desc&limit=240$/.test(qs[0]) && /^house_reads\?select=id,kind,label,version,status,slots:meta->slots&meta->slots=not\.is\.null/.test(qs[1]),
  'B4 the assets read every record newest first and only the reads that carry slots, by their slots alone');
ok(aa.assets.length === 3 && aa.counts.own === 1 && aa.counts.house === 1 && aa.counts.type === 1 && aa.reads_scanned === 1, 'B5 the records are counted by kind');
const a1 = aa.assets[0], a2 = aa.assets[1], a3 = aa.assets[2];
ok(a1.url === '/media/own/h.jpg' && a1.made.own === true && a1.made.release === 'model release on file' && a1.made.name === 'h.jpg' && a1.used.length === 1 && a1.used[0].id === 10 && a1.used[0].path === 'cover' && a1.contexts.length === 2,
  'B6 an own photograph carries its release, its name and the read that uses it');
ok(a2.made.hard === 1 && a2.made.overridden === false && a2.used.length === 0 && a3.url === null && a3.credit === null, 'B7 a failed hard check shows; a typographic block has no picture; nothing is invented for a missing credit');
const routed = [];
const R = mk({ sbRest: fakeDb, json: (o, st) => { routed.push([o, st]); return { o, st }; } });
await R.houseRoute('/reads/assets', {}, {}, '', {}); await R.houseRoute('/reads/nights', { nights: 999 }, {}, '', {}); await R.houseRoute('/reads/elsewhere', {}, {}, '', {});
ok(routed[0][0].ok === true && Array.isArray(routed[0][0].assets) && routed[0][1] === 200 && routed[1][0].ok === true && Array.isArray(routed[1][0].nights) && routed[2][1] === 404, 'B8 the route answers the two lists and nothing else');
const since999 = routed[1][0].since, days = Math.round((Date.now() - new Date(since999 + 'T00:00:00Z').getTime()) / 864e5);
ok(days >= 59 && days <= 61, 'B9 the window is capped at sixty nights');

// ── C: the wiring in the worker ──────────────────────────────────────────────────────────────────────────────────
ok(/if \(path === '\/reads\/assets' \|\| path === '\/reads\/nights'\) return houseRoute\(path, body, env, origin, user\);/.test(w), 'C1 readRoute hands the two lists to the house, after the admin check');
const rr = between(w, 'async function readRoute(path, body, env, origin, user) {', "if (path === '/reads/list')");
ok(/callerIsAdmin\(env, user\.id\)/.test(rr) && rr.indexOf('callerIsAdmin') < rr.indexOf('houseRoute'), 'C2 the admin check comes first');
ok(/case '\/reads\/assets':\s*\/\/ SEAM:HOUSE[^\n]*\n\s+case '\/reads\/nights':\s*\n\s+case '\/reads\/day-frames':[^\n]*\n\s+case '\/reads\/pdf':\s+return readRoute\(/.test(w), 'C3 the router carries both paths to readRoute (and the day\'s frames since RD1b)');
ok(!/buildStudioManifest\(/.test(w) && !/async function studioCaption\(/.test(w) && /dayFramesEnsure\(env, \{ id: edId/.test(w), 'C4 the STUDIO worker block and the cron\'s cut are gone; the publish writes the day\'s frames (RD1b)');

// ── D: the house page ────────────────────────────────────────────────────────────────────────────────────────────
const hb = between(house, 'SEAM:HOUSE (RD1a): READ is the house.', '  function library(');
ok(!/—/.test(hb) && !/\\u2014/.test(hb), 'D1 no em dash in the house\'s page block');
ok(/var HOUSE_ORDER = \["reads", "recon", "report", "weekly", "record", "daily", "nights", "assets", "feed"\];/.test(house) && /var ROOM = HOUSE_ROOMS\[Q\.get\("room"\) \|\| ""\] \? Q\.get\("room"\) : "reads";/.test(house), 'D2 nine rooms, chosen by ?room=, the reads by default');
ok(/if \(id\) openRead\(id\); else houseOpen\(ROOM\);/.test(house) && /function houseOpen\(room\) \{/.test(house), 'D3 the boot opens the room; an id still opens the read');
ok(/function library\(kinds\) \{/.test(house) && /if \(!groups\[k\]\.length \|\| \(kinds && kinds\.indexOf\(k\) < 0\)\) return;/.test(house) && /\["recon", "report", "record", "monthly", "weekly"\]\.forEach/.test(house) && /var html = houseHead\(kinds \? ROOM : "reads"\);/.test(house),
  'D4 a kind\'s room is the library filtered to its shelf; the door is every shelf, in the order it had');
ok(/<a class="btn" href="\.\/" id="house-link">The house<\/a>/.test(house) && /function houseBack\(room\)/.test(house) && /document\.title = "Unsurfaced DAILY · " \+ row\.label;\n\s+houseBack\(ROOM\);/.test(house), 'D5 one bar; an open read\'s back link returns to the room it came from');
ok(/<nav class="hs-doors" aria-label="The house">/.test(house) && /Every read we have compiled, newest first/.test(house), 'D6 the doors strip is on every shelf; the door\'s own line stands');
ok(/houseGet\("\/api\/edition\/archive"\)/.test(house) && /houseGet\("\/api\/edition\?issue=" \+ encodeURIComponent\(String\(n\)\)\)/.test(house) && /href="\.\/\?room=daily&issue=/.test(house) && /it\.standfirst/.test(house) && /it\.source_url/.test(house), 'D7 DAILY lists the editions from the public routes and opens a day\'s stories as the reader sees them');
ok(/call\("\/reads\/nights", \{ nights: N \}\)/.test(house) && /<th>Subject<\/th><th>Status<\/th><th>7 days<\/th><th>Outlets<\/th><th>Counted<\/th><th>Grade<\/th><th>Marks<\/th><th>Claims<\/th><th>Voice<\/th><th>Cost<\/th><th>Notes<\/th>/.test(house) && /class="hs-scroll"/.test(house) && /href="\.\.\/\?insight=' \+ esc\(r\.id\)/.test(house),
  'D8 the nights room reads a window of nights (fourteen by default), the scan in a scroll box with the morning\'s columns, and opens a deployment on the record (RD1d)');
ok(/call\("\/reads\/assets", \{\}\)/.test(house) && /fetch\(API \+ "\/reads\/slot-upload", \{ method: "POST", headers: \{ Authorization: "Bearer " \+ token, "Content-Type": f\.type \|\| "application\/octet-stream", "x-filename": f\.name, "x-credit": credit, "x-release": release \}, body: f \}\)/.test(house) && /if \(f\.size > 10000000\)/.test(house) && /not on a read yet/.test(house),
  'D9 the assets room lists every record with where it is used, and uploads the house\'s own photograph through THE SLOTS\' door');
ok(!/data-delete|knowledge\/purge|media_rights\?.*DELETE/.test(hb), 'D10 nothing on the house\'s new shelves deletes a record');
const ids = ['kbText', 'kbUrl', 'kbFile', 'kbTags', 'kbTarget', 'kbTitle', 'kbShare', 'kbAssets', 'kbGo', 'kbStatus', 'kbQ', 'kbHits', 'kbRows'];
ok(ids.every(id => house.includes('id="' + id + '"')) && /function feedRoom\(\)/.test(house) && /function api\(action, payload\)/.test(house) && /if \(!r\.ok\) throw new Error\("Proxy " \+ action \+ " failed: " \+ r\.status\);/.test(house), 'D11 the feed lives in the house with every control it had and the same failure voice');
ok(/api\("knowledge\/submit", \{ text: text, url: url \|\| undefined,/.test(house) && /API \+ "\/knowledge\/file" \+ qs/.test(house) && /api\("knowledge\/list", \{\}\)/.test(house) && /api\("knowledge\/search", \{ q: q, target:/.test(house) && /api\("knowledge\/used", \{ drop_key: key \}\)/.test(house) && /api\("knowledge\/cut", \{ drop_key: key, shareable: true \}\)/.test(house) && /api\("knowledge\/delete", \{ drop_key: b\.getAttribute\("data-drop"\) \}\)/.test(house),
  'D12 the feed\'s seven routes are called as before, unchanged on the worker');
ok(/id="kbFile" accept="\.txt,\.md,\.markdown,\.csv,\.json,\.pdf,\.docx,\.xlsx,\.xlsm,\.xlsb,\.xls,\.odt,\.ods,\.html,\.htm,\.xml,\.numbers,\.jpg,\.jpeg,\.png,\.webp,\.gif,\.bmp,\.svg"/.test(house), 'D13 the intake\'s types (KB1) came with it');
ok(/\.hs-doors \{ display: flex; flex-wrap: wrap;/.test(house) && /table\.hs-table \{ min-width: 860px;/.test(house) && /\.hs-scroll \{ overflow-x: auto; \}/.test(house) && /\.kb textarea, \.kb input\[type=text\], \.kb input\[type=url\], \.kb select \{ width: 100%; box-sizing: border-box;/.test(house),
  'D14 the shelves wear the library\'s type; the wide table scrolls in its box, the page never sideways');

// ── E: the Intelligence page ─────────────────────────────────────────────────────────────────────────────────────
ok(!/id="stOpen"/.test(page) && !/function mountStaffDoor/.test(page) && !/p\.has\('studio'\)/.test(page) && !/uai_pending_studio/.test(page) && !/window\.openStudio/.test(page) && !/\.stwrap\{/.test(page) && !/\.lg-studio\{/.test(page),
  'E1 the STUDIO overlay\'s doors are gone: the button, the staff door, the deep link, the opener and their styles');
ok(!/id="kbText"/.test(page) && !/\.kbwrap\{/.test(page) && !/function kbSaid\(d\)/.test(page) && !/SEAM:KNOWLEDGE/.test(page) && !/SEAM:FEED_BRIDGE/.test(page), 'E2 the FEED panel and its styles left the page with their seams');
ok(/<a class="uai-back" style="position:static;text-decoration:none;display:inline-block" id="kbOpen" href="read\/\?room=feed" title="The feed, in the house" hidden>Feed ⌁<\/a>/.test(page), 'E3 the Feed door is a link into the house, hidden until the house confirms an admin');
ok(/api\("whoami", \{\}\)\.then\(function \(d\) \{\n\s+var b = document\.getElementById\("kbOpen"\);\n\s+if \(d && d\.ok && d\.admin && b\) b\.hidden = false;/.test(page) && /else if \(d && d\.ok && !d\.admin\) return;/.test(page), 'E4 the reveal still asks the base, and stops asking once a non-admin is confirmed');
ok(!/mp4-muxer v5\.2\.2/.test(page) && !/async function framesFor\(piece\)/.test(page) && !/SEAM:STUDIO_LOOK/.test(page) && /SEAM:FEED_INTAKE/.test(page), 'E5 the muxer and the paint programs left the page with RD1b; the evidence shelf\'s intake stays');
ok(/href="read\/">READ<small>the house: reads, DAILY, the nights, the assets, the feed<\/small>/.test(page), 'E6 the nav names the house');
ok(/<li id="nav-read-li" style="display:none"><a class="nlb" id="nav-read" href="read\/">READ/.test(page), 'E7 the READ door keeps its id and its admin reveal');

// ── F: the registry ──────────────────────────────────────────────────────────────────────────────────────────────
const reg = seams.registry;
ok(reg['SEAM:HOUSE'] && reg['SEAM:HOUSE'].file === 'worker/src/index.js' && reg['SEAM:HOUSE@read'] && reg['SEAM:HOUSE@read'].file === 'intelligence/read/index.html' && reg['SEAM:HOUSE@intelligence'] && reg['SEAM:HOUSE@intelligence'].file === 'intelligence/index.html', 'F1 SEAM:HOUSE is registered where it lives');
ok(reg['SEAM:KNOWLEDGE@read'] && reg['SEAM:KNOWLEDGE@read'].file === 'intelligence/read/index.html' && reg['SEAM:FEED_BRIDGE@read'] && reg['SEAM:FEED_BRIDGE@read'].file === 'intelligence/read/index.html' && reg['SEAM:FEED_INTAKE@read'] && reg['SEAM:FEED_INTAKE@read'].file === 'intelligence/read/index.html',
  'F2 the feed\'s seams moved with it');
ok(!reg['SEAM:KNOWLEDGE@intelligence'] && !reg['SEAM:FEED_BRIDGE@intelligence'] && reg['SEAM:FEED_INTAKE@intelligence'] && !reg['SEAM:STUDIO@intelligence'] && reg['SEAM:KNOWLEDGE@worker'], 'F3 the Intelligence page keeps the seams it still carries and no other');

console.log(`\nproof_house: ${pass} checks passed`);
