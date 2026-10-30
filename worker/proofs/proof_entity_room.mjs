/**
 * proof_entity_room.mjs  --  RM1 THE ROOMS ON THE GRAPH (SEAM:ENTITY_ROOM): every active entity has a room, counted on its links with
 * the measure's own function; the record, the claims, the readings, the voices and the measure of one subject in one place.
 * Runs the shipped code on fakes. Run from the repo root: node worker/proofs/proof_entity_room.mjs
 *   R  the pure pieces (worker)   O  the room and the list (worker)   G  the page   Z  the migration and the seams
 */
import fs from 'node:fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const sql = fs.readFileSync('supabase/migrations/0056_rooms.sql', 'utf-8');
let pass = 0; const ok = (c, m) => { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok   ' + m); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const fnOf = (src, name) => { const i = src.indexOf('async function ' + name + '(') >= 0 ? src.indexOf('async function ' + name + '(') : src.indexOf('function ' + name + '('); if (i < 0) throw new Error('fn ' + name); const j = src.indexOf('\n}\n', i); return src.slice(i, j + 2); };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ago = d => new Date(Date.now() - d * 864e5).toISOString();
const day = d => ago(d).slice(0, 10);
const lakeWhen = new Function(fnOf(w, 'lakeWhen') + '; return lakeWhen;')();
const excOutletKey = new Function(fnOf(w, 'excOutletKey') + '; return excOutletKey;')();
const RECORD = { SINCE: '2026-10-08' }, DOOR = { MIN_EVIDENCE: 4 }, DOOR_VOICES = { KEEP: 6 }, LEDGER = { TABLE: 'subject_weeks' };
const E1 = '11111111-1111-1111-1111-111111111111', E2 = '22222222-2222-2222-2222-222222222222', E3 = '33333333-3333-3333-3333-333333333333', T1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', D1 = 'dddddddd-dddd-dddd-dddd-dddddddddd01', D2 = 'dddddddd-dddd-dddd-dddd-dddddddddd02', D3 = 'dddddddd-dddd-dddd-dddd-dddddddddd03';

// ── R: the pure pieces ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const pureSrc = between(w, 'const ROOMS = {', 'async function roomEntities(');
const R0 = new Function('lakeWhen', 'excOutletKey', 'RECORD', 'DOOR', pureSrc + '; return { ROOMS, ROOM_KINDS, roomRowsOf, roomWeeksOf, roomVoicesOf, roomStoriesOf, roomRecordOf, roomReadingsOf, roomListRow, roomTileIs };')(lakeWhen, excOutletKey, RECORD, DOOR);
const sig = (id, title, d, src, tier, more) => Object.assign({ id, title, url: 'https://' + String(src).toLowerCase().replace(/\s/g, '') + '.com/' + id, source_name: src, source_tier: tier, published_at: ago(d), captured_at: ago(Math.max(0, d - 1)), status: 'kept', research: false, image: null }, more || {});
const links = [
  { captured_at: ago(1), signal: sig('s1', 'Costco opens a store', 2, 'Vogue', 1, { image: 'https://img/1.jpg' }) },
  { captured_at: ago(1), signal: sig('s2', 'Costco again', 1, 'WWD', 2) },
  { captured_at: ago(1), signal: sig('s2b', 'COSTCO AGAIN', 1, 'The WWD', 2) },   // the same headline and the same outlet under "the": one story, one outlet in the room
  { captured_at: ago(20), signal: sig('s3', 'Costco last month', 20, 'Vogue', 1) },
  { captured_at: ago(1), signal: sig('s4', 'Costco research row', 1, 'Blog', 3, { research: true }) },
  { captured_at: ago(1), signal: sig('s5', 'Costco rejected row', 1, 'Blog', 3, { status: 'rejected' }) },
  { captured_at: ago(70), signal: sig('s6', 'Costco ten weeks ago', 70, 'Dezeen', 2) },
  { captured_at: ago(1), signal: sig('s7', 'Costco dated after tomorrow', -3, 'Vogue', 1) },
  { captured_at: ago(2), signal: null }
];
const rows = R0.roomRowsOf(links, true), rowsNoSweep = R0.roomRowsOf(links, false);
ok(rows.length === 6 && rowsNoSweep.length === 7 && !rows.some(r => r.id === 's5') && !rows.some(r => r.id === 's4') && rowsNoSweep.some(r => r.id === 's4') && rows[0].image === 'https://img/1.jpg' && rows.every(r => r.captured_at),
  'R1 the rows behind the links: a rejected row never, a research row not on the sweep, a link with no story skipped, the photograph carried');
const wk = R0.roomWeeksOf(rows, Date.now());
ok(wk.length === 12 && wk[11].n === 3 && wk[11].outlets === 2 && wk[9].n === 1 && wk[1].n === 1 && wk[1].outlets === 1 && wk.reduce((a, b) => a + b.n, 0) === 5 && wk[0].start === day(84) && !wk.some(x => x.n > 0 && x.start > day(1)),
  'R2 twelve rolling weeks by the date each row speaks for; outlets normalized (WWD and The WWD are one); a row dated after now is not counted');
const v = R0.roomVoicesOf(rows, Date.now());
ok(v.outlets === 3 && v.stories === 5 && v.tiers.map(t => t.tier).join(',') === '1,2' && v.tiers[0].outlets === 1 && v.tiers[0].stories === 2 && v.tiers[1].outlets === 2 && v.tiers[1].stories === 3 && v.tiers[1].names[0].name === 'WWD' && v.tiers[1].names[0].n === 2 && v.tiers[1].names.length === 2,
  'R3 the voices by tier: distinct outlets, the stories and the most frequent names (one outlet under two spellings is one name), tiers in order');
const st = R0.roomStoriesOf(rows, 6, Date.now());
ok(st.length === 4 && st[0].title === 'Costco again' && st[0].tier === 2 && st[0].source === 'WWD' && !st.some(x => /after tomorrow/.test(x.title)) && st.filter(x => /again/i.test(x.title)).length === 1 && st[st.length - 1].title === 'Costco ten weeks ago' && st.find(x => x.title === 'Costco opens a store').image === 'https://img/1.jpg',
  'R4 the latest stories newest first, one per headline, with the outlet, the tier, the date and the photograph; never one dated after tomorrow');
const tile = (id, night, more) => Object.assign({ id, key: 'frame:x', deployed: night, claim: 'Claim ' + id, move: 'Move ' + id, question: 'Q', findings: 3, measures: { recent_7d: 2, outlets: 2 }, evidence_n: 6, watch: { by: '2026-11-20' }, called: null, frame: { entity: 'Costco' }, photo: null, develops: null }, more || {});
const tiles = [tile(D1, '2026-10-20', { called: { verdict: 'held' }, photo: { url: 'https://p/1.jpg', credit: 'Vogue' } }), tile(D2, '2026-10-12', { called: { verdict: 'missed' } }), tile(D3, '2026-10-25'), tile('old1', '2026-10-01', { called: { verdict: 'held' } }), tile('thin', '2026-10-22', { measures: { recent_7d: 0, outlets: 0 }, evidence_n: 2 })];
const rec = R0.roomRecordOf(tiles, { [D1]: { held: 2, useful: 1, wrong: 0 } });
ok(rec.deployments === 3 && rec.held === 1 && rec.missed === 1 && rec.open === 1 && rec.since === '2026-10-12' && rec.earlier === 2 && rec.readings.map(r => r.id).join(',') === [D3, D1, D2].join(',') && rec.readings[1].grade === 'held' && rec.readings[1].marks.held === 2 && rec.readings[0].check_by === '2026-11-20' && rec.readings[0].grade === null && rec.readings[1].photo.url === 'https://p/1.jpg' && rec.readings[2].marks === null,
  'R5 the record under the law: deployments newest first with grade, watch date, marks and photograph; a reading before the law or on no evidence is counted as earlier, never listed');
const rd = R0.roomReadingsOf([{ claim: { src: 'door', reading_id: D1, night: '2026-10-20' } }, { claim: { src: 'door', reading_id: D1, night: '2026-10-20' } }, { claim: { src: 'read', reading_id: 'l1', night: '2026-10-27' } }, { claim: { src: 'read', reading_id: 'l2', night: '2026-10-29' } }, { claim: null }]);
ok(rd.door === 1 && rd.live === 2 && rd.latest_live === '2026-10-29', 'R6 the readings counted from the claims\' links: distinct overnight readings and live reads, the latest live read\'s day');
const row = R0.roomListRow({ id: E1, name: 'Costco', kind: 'brand', aliases: ['COST'], category: 'retail', from_src: 'track', track_id: T1 }, { weeks: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2], n7: 2, n30: 3, outlets30: 2, outlets84: 3, latest: ago(1), claims: 5, deployed: 2, held: 1, missed: 1 }, { image: 'https://kg/costco.jpg', image_license: 'CC', sector: 'retail' }, { measured_from: day(84), coverage_weeks: 12 });
const row0 = R0.roomListRow({ id: E2, name: 'Newcomer', kind: 'publication', aliases: [], category: null, from_src: 'frame' }, null, null, { measured_from: day(14), coverage_weeks: 2 });
ok(row.counts.captures_7d === 2 && row.counts.captures_30d === 3 && row.counts.outlets_30d === 2 && row.weeks.length === 12 && row.claims === 5 && row.deployments === 2 && row.held === 1 && row.image === 'https://kg/costco.jpg' && row.coverage_weeks === 12 && row.from === 'track'
  && row0.counts.captures_30d === null && row0.weeks === null && row0.kind === 'brand' && row0.claims === 0 && row0.coverage_weeks === 2 && row0.measured_from === day(14) && row0.image === null,
  'R7 a list card: counts from the rollup with the record\'s counts and the coverage; nulls, never zeros, until the entity is counted; an unknown kind reads as a brand');
ok(R0.roomTileIs({ key: 'track:' + T1, frame: { entity: 'Other' } }, { track_id: T1, name: 'Costco' }) && R0.roomTileIs({ key: 'frame:x', frame: { entity: 'costco' } }, { name: 'Costco', aliases: [] }) && R0.roomTileIs({ key: 'frame:x', frame: { entity: ' cost ' } }, { name: 'Costco', aliases: ['COST'] }) && !R0.roomTileIs({ key: 'frame:x', frame: { entity: 'Costco Travel' } }, { name: 'Costco', aliases: [] }) && !R0.roomTileIs(null, { name: 'Costco' }),
  'R8 a tile belongs to an entity by its track key or a frame whose entity is the name or an alias, case-blind, never by a longer name');
ok(R0.ROOMS.TTL === 1800 && R0.ROOMS.LIST_TTL === 600 && R0.ROOMS.WEEKS === 12 && R0.ROOM_KINDS.org === 'Organisation' && Object.keys(R0.ROOM_KINDS).join(',') === 'brand,person,product,org,place,other',
  'R9 a room is kept thirty minutes and the list ten; the six kinds have their names');

// ── O: the room and the list on fakes ──────────────────────────────────────────────────────────────────────────────────────────
const roomSrc = between(w, 'const ROOMS = {', '/* ═══ SEAM:AUDIENCES');
const mkO = (deps) => new Function('lakeWhen', 'excOutletKey', 'RECORD', 'DOOR', 'DOOR_VOICES', 'LEDGER', 'sbRest', 'excQuiet', 'loadTracks', 'sweepOnly', 'excMeasureFrom', 'excTerritoryOf', 'entityStateGet', 'entityCoverage', 'doorTile', 'doorSet', 'brandAttention', 'json', 'console',
  roomSrc + '; return { roomList, roomOf, excavateRooms, excavateRoom, roomDropLists };')(lakeWhen, excOutletKey, RECORD, DOOR, DOOR_VOICES, LEDGER, deps.sbRest, () => () => null, deps.loadTracks, deps.sweepOnly, deps.excMeasureFrom, () => 'business-economics', deps.entityStateGet, deps.entityCoverage, deps.doorTile, deps.doorSet, deps.brandAttention, (b, s) => ({ body: b, status: s }), { log: () => {}, warn: () => {} });
const ents = [
  { id: E1, name: 'Costco', kind: 'brand', aliases: ['COST'], category: 'retail', from_src: 'track', track_id: T1, resolved_from: null, ambiguous: false },
  { id: E2, name: 'Target', kind: 'brand', aliases: ['TGT'], category: 'retail', from_src: 'track', track_id: null, resolved_from: null, ambiguous: true },
  { id: E3, name: 'Dezeen', kind: 'org', aliases: [], category: 'design media', from_src: 'frame', track_id: null, resolved_from: ago(14), ambiguous: false }
];
const roll = [{ entity_id: E1, weeks: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3], outlets: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2], n7: 3, n30: 4, outlets30: 2, outlets84: 3, latest: ago(1), claims: 5, deployed: 2, held: 1, missed: 1 },
  { entity_id: E2, weeks: Array(12).fill(1), outlets: Array(12).fill(1), n7: 1, n30: 9, outlets30: 4, outlets84: 6, latest: ago(2), claims: 0, deployed: 0, held: 0, missed: 0 }];
const doorRows = [
  { id: D1, frame_key: 'track:' + T1, night: '2026-10-20', status: 'ready', frame: { entity: 'Costco' }, measures: { recent_7d: 2, outlets: 2 }, read: { read: ['Casual buyers choose the archive.'], ideas: [{ headline: 'Lead with the archive' }], insights: [1, 2, 3] }, evidence: [1, 2, 3, 4, 5, 6], meta: { called: { verdict: 'held' } } },
  { id: D2, frame_key: 'frame:x', night: '2026-10-12', status: 'ready', frame: { entity: 'costco' }, measures: { recent_7d: 1, outlets: 1 }, read: { read: ['An older call.'], ideas: [], insights: [1] }, evidence: [1, 2, 3, 4], meta: { called: { verdict: 'missed' } } },
  { id: 'old1', frame_key: 'frame:y', night: '2026-10-01', status: 'ready', frame: { entity: 'Costco' }, measures: { recent_7d: 3, outlets: 3 }, read: { read: ['Before the law.'], ideas: [], insights: [1] }, evidence: [1, 2, 3, 4], meta: {} },
  { id: 'wrong', frame_key: 'frame:z', night: '2026-10-21', status: 'ready', frame: { entity: 'Costco Travel' }, measures: { recent_7d: 3, outlets: 3 }, read: { read: ['Not this subject.'], ideas: [], insights: [1] }, evidence: [1, 2, 3, 4], meta: {} }
];
const claimRows = [
  { id: 'c1', src: 'door', reading_id: D1, idx: 0, night: '2026-10-20', claim: 'Casual buyers choose the archive.', excerpt: 'Three outlets.', lens: 'consumer', confidence: 'High', band: 'NOW', newest: '2026-10-19', tiers: { 1: 2 }, grade: 'held', marks: { held: 2, useful: 0, wrong: 0 }, on_record: true, how: 'frame' },
  { id: 'c2', src: 'read', reading_id: 'l1', idx: 0, night: '2026-10-27', claim: 'A live read names Costco.', excerpt: null, lens: 'market', confidence: 'Medium', band: 'RECENT', newest: null, tiers: {}, grade: null, marks: {}, on_record: false, how: 'alias' },
  { id: 'c3', src: 'door', reading_id: D2, idx: 0, night: '2026-10-12', claim: '', excerpt: null, lens: 'consumer', confidence: 'Low', band: null, newest: null, tiers: {}, grade: 'missed', marks: {}, on_record: true, how: 'frame' }
];
const clLinks = [{ claim: { src: 'door', reading_id: D1, night: '2026-10-20' } }, { claim: { src: 'door', reading_id: D2, night: '2026-10-12' } }, { claim: { src: 'read', reading_id: 'l1', night: '2026-10-27' } }];
const mkEnv = () => { const kv = {}; return { kv, env: { RATE_LIMIT: { get: async k => kv[k] == null ? null : kv[k], put: async (k, v, o) => { kv[k] = v; kv[k + ':ttl'] = o && o.expirationTtl; }, delete: async k => { delete kv[k]; delete kv[k + ':ttl']; } } } }; };
const mkDeps = (opts) => { const paths = [], o = opts || {};
  const sbRest = async (env, path, init) => { paths.push(path);
    if (/^entities\?active=eq\.true&select=/.test(path)) return ents;
    if (/^entities\?id=eq\./.test(path)) return ents.filter(e => path.indexOf('id=eq.' + e.id) >= 0);
    if (/^entities\?track_id=eq\./.test(path)) return ents.filter(e => e.track_id && path.indexOf('track_id=eq.' + e.track_id) >= 0);
    if (path === 'rpc/entity_rollup') { if (o.rollupFails) throw new Error('rollup down'); return roll.filter(r => init.body.p_ids.includes(r.entity_id)); }
    if (/^signal_entities\?entity_id=eq\./.test(path)) return path.indexOf(E1) >= 0 ? links : [];
    if (path === 'rpc/claim_corpus') { if (o.claimsFail) throw new Error('claims down'); return init.body.p_entities[0] === E1 ? claimRows : []; }
    if (/^claim_entities\?entity_id=eq\./.test(path)) return path.indexOf(E1) >= 0 ? clLinks : [];
    if (/^door_reads\?status=eq\.ready/.test(path)) return doorRows;
    if (/^subject_weeks\?subject_key=eq\./.test(path)) return [{ week: '2026-09-28', door: false }, { week: '2026-10-05', door: true }];
    throw new Error('unexpected path ' + path); };
  return { paths, sbRest, loadTracks: async () => [{ id: T1, name: 'Costco', sector: 'retail', description: 'Warehouse club', image: 'https://kg/costco.jpg', image_license: 'CC BY' }], sweepOnly: async () => '&research=is.false',
    excMeasureFrom: (rows, terr, now, hint) => ({ weeks: 12, series: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, rows.filter(r => { const a = Date.now() - Date.parse(lakeWhen(r)); return a >= 0 && a < 7 * 864e5; }).length], recent_7d: rows.filter(r => { const a = Date.now() - Date.parse(lakeWhen(r)); return a >= 0 && a < 7 * 864e5; }).length, prior_7d: 0, velocity_pct: null, outlets: new Set(rows.map(r => excOutletKey({ source: r.source_name, url: r.url }))).size, weeks_touched: 3, state: 'STEADY', shape: 'flat', newest: day(1), n: rows.length, territory: hint }),
    entityStateGet: async () => ({ backfill: { done: true } }), entityCoverage: (rf, bf, now, W) => rf ? { measured_from: String(rf).slice(0, 10), coverage_weeks: 2 } : { measured_from: day(84), coverage_weeks: W },
    doorTile: r => ({ id: r.id, key: r.frame_key, deployed: r.night, frame: r.frame, claim: r.read.read[0], move: r.read.ideas[0] ? r.read.ideas[0].headline : null, question: null, findings: r.read.insights.length, measures: r.measures, evidence_n: r.evidence.length, watch: { by: '2026-11-20' }, called: r.meta.called || null, photo: null, develops: null }),
    doorSet: async () => ({ night: '2026-10-29', tiles: [{ id: D1, key: 'track:' + T1, night: '2026-10-29', claim: 'Tonight on Costco.', move: 'Move tonight', question: 'What now?', measures: { state: 'STRUCTURAL' }, frame: { entity: 'Costco' }, voices: [{ text: 'I shop there weekly', likes: 3, when: '2026-10-28', self: { role: 'parent' }, extra: 'never' }] }] }),
    brandAttention: async (env, t, peers) => (o.noAttention ? null : { months: ['2026-09', '2026-10'], series: [{ label: t.name, role: 'subject', article: t.name, views: [1, 2] }].concat(peers.map(p => ({ label: p.name, role: 'rival', article: p.name, views: [1, 1] }))), stats: { recent_3m: 1200, yoy_pct: 5 }, source: 'Wikimedia pageviews', sector: t.sector, description: t.description }) }; };
const d1 = mkDeps(), k1 = mkEnv(), O1 = mkO(d1);
const list = await O1.roomList(k1.env);
ok(list.ok && list.rooms.length === 3 && list.rooms.map(r => r.name).join(',') === 'Target,Costco,Dezeen' && list.rooms[1].counts.captures_7d === 3 && list.rooms[1].deployments === 2 && list.rooms[1].image === 'https://kg/costco.jpg' && list.rooms[2].counts.captures_30d === null && list.rooms[2].coverage_weeks === 2 && list.rooms[0].kind === 'brand' && list.rooms[2].kind === 'org' && d1.paths.filter(p => p === 'rpc/entity_rollup').length === 1 && k1.kv['rooms:v1'] && k1.kv['rooms:v1:ttl'] === 600,
  'O1 the list: every active entity on one rollup call, most covered first, the track\'s photograph, nulls until counted, kinds, kept ten minutes');
const pathsBefore = d1.paths.length; const list2 = await O1.roomList(k1.env);
ok(list2.rooms.length === 3 && d1.paths.length === pathsBefore, 'O1b the list is read from the cache the second time');
const room = await O1.roomOf(k1.env, ents[0]);
ok(room.ok && room.room.name === 'Costco' && room.room.kind === 'brand' && room.room.category === 'retail' && room.room.track.image === 'https://kg/costco.jpg' && room.room.coverage_weeks === 12 && room.measure.recent_7d === 3 && room.measure.outlets === 3 && room.measure.n === 6 && room.measure.territory === 'business-economics' && room.weeks.length === 12 && room.weeks[11].n === 3,
  'O2 a room: the subject with its track, the measure on the links (research and rejected rows out), twelve weeks');
ok(room.voices.outlets === 3 && room.voices.tiers.length === 2 && room.stories.length === 4 && room.stories[0].title === 'Costco again',
  'O3 the voices by tier and the latest stories ride the same rows');
ok(room.record.deployments === 2 && room.record.held === 1 && room.record.missed === 1 && room.record.earlier === 1 && room.record.readings.map(r => r.id).join(',') === D1 + ',' + D2 && room.record.readings[0].marks.held === 2 && room.record.readings[1].marks === null && !JSON.stringify(room.record).includes('Not this subject') && d1.paths.some(p => /^door_reads\?status=eq\.ready&read=not\.is\.null&or=\(frame_key\.eq\.track%3Aaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa,frame->>entity\.ilike\.Costco,frame->>entity\.ilike\.COST\)&select=id,frame_key,night,status,frame,measures,read,evidence,meta&order=night\.desc,created_at\.desc&limit=40$/.test(p)),
  'O4 the record on the subject: the door\'s readings by track key, name and alias, under the law, with the marks from the claims; a longer name is not this subject');
ok(room.claims.length === 2 && room.claims[0].claim === 'Casual buyers choose the archive.' && room.claims[0].how === 'frame' && room.claims[0].marks.held === 2 && room.claims[1].src === 'read' && room.claims[1].how === 'alias' && room.claims[1].marks === null && room.readings.door === 2 && room.readings.live === 1 && room.readings.latest_live === '2026-10-27' && d1.paths.some(p => p === 'rpc/claim_corpus'),
  'O5 the claims newest first with how each was linked and the marks; the readings counted from the links; an empty claim never shown');
ok(room.board && room.board.claim === 'Tonight on Costco.' && room.board.state === 'STRUCTURAL' && room.board.voices.length === 1 && Object.keys(room.board.voices[0]).sort().join(',') === 'likes,self,text,when' && room.set.length === 1 && room.set[0].name === 'Target' && room.set[0].n30 === 9 && room.attention.series.length === 2 && room.attention.sector === 'retail' && room.attention.description === 'Warehouse club' && room.ledger.weeks === 2 && room.ledger.on_board === 1 && room.partial === false,
  'O6 the board tonight with the people\'s voices, the set from the list on the same count, the attention over the entity with its rival, the ledger for a tracked entity');
const roomD = await O1.roomOf(k1.env, ents[2]);
ok(roomD.ok && roomD.room.kind === 'org' && roomD.room.track === null && roomD.room.coverage_weeks === 2 && roomD.room.measured_from === day(14) && roomD.measure.n === 0 && roomD.record.deployments === 0 && roomD.claims.length === 0 && roomD.readings.door === 0 && roomD.board === null && roomD.set.length === 0 && roomD.ledger === null && roomD.stories.length === 0 && roomD.voices.tiers.length === 0,
  'O7 an entity from a frame with no track: its own coverage date, no ledger, nothing on record yet, never a zero said as a count');
const k2 = mkEnv(), d2 = mkDeps(), O2 = mkO(d2);
const req = q => ({ url: 'https://api.example/excavate/room?' + q });
const bad = (await O2.excavateRoom(req('id=nope'), k2.env, '*')).body, none = (await O2.excavateRoom(req('id=99999999-9999-9999-9999-999999999999'), k2.env, '*')).body;
const first = (await O2.excavateRoom(req('id=' + E1), k2.env, '*')).body, again = (await O2.excavateRoom(req('id=' + E1.toUpperCase()), k2.env, '*')).body;
const byTrack = (await O2.excavateRoom(req('track=' + T1), k2.env, '*')).body;
ok(bad.error === 'bad_id' && none.error === 'no_room' && first.ok && !first.cached && first.room.id === E1 && again.cached === true && k2.kv['room:v1:' + E1 + ':ttl'] === 1800 && byTrack.ok && byTrack.room.id === E1 && byTrack.cached === true,
  'O8 GET /excavate/room: a bad id, an unknown subject, a room kept thirty minutes and read from the cache, the entity behind a track');
const d3 = mkDeps({ claimsFail: true }), k3 = mkEnv(), O3 = mkO(d3);
const roomP = (await O3.excavateRoom(req('id=' + E1), k3.env, '*')).body;
ok(roomP.ok && roomP.partial === true && roomP.claims.length === 0 && roomP.record.deployments === 2 && !k3.kv['room:v1:' + E1], 'O9 a part that failed to load: the room is shown with the rest and never kept');
const d4 = mkDeps({ rollupFails: true }), k4 = mkEnv(), O4 = mkO(d4);
const listP = (await O4.excavateRooms(k4.env, '*')).body;
ok(listP.ok && listP.partial === true && listP.rooms.length === 3 && listP.rooms.every(r => r.counts.captures_30d === null) && !k4.kv['rooms:v1'], 'O9b a rollup that failed: every card says counted from the next run, and the list is not kept');
await O1.roomDropLists(k1.env);
ok(!k1.kv['rooms:v1'], 'O10 the list can be dropped (a watched brand drops it)');
ok(/if \(path === '\/excavate\/rooms' && request\.method === 'GET'\) return excavateRooms\(env, origin\);/.test(w) && /if \(path === '\/excavate\/room' && request\.method === 'GET'\) return excavateRoom\(request, env, origin\);/.test(w) && /if \(path === '\/excavate\/brand' && request\.method === 'GET'\) return excavateBrand\(request, env, origin\);/.test(w) && /if \(path === '\/excavate\/tracks' && request\.method === 'GET'\) return excavateTracks\(env, origin\);/.test(w),
  'O11 the routes: the rooms and a room beside the brand room and the tracks, which stay');
const ta = fnOf(w, 'excavateTrackAdd');
ok(/const ent = await entityResolveName\(env, name, \{ create: true, category: row\.sector, track: \{ id: back\[0\]\.id, name, aliases: row\.aliases, sector: row\.sector \} \}\);/.test(ta) && /'entities\?id=eq\.' \+ ent\.id \+ '&track_id=is\.null'/.test(ta) && /body: \{ track_id: back\[0\]\.id, from_src: 'track', updated_at: new Date\(\)\.toISOString\(\) \}/.test(ta) && /roomDropLists\(env\)/.test(ta) && ta.indexOf('entityResolveName') > ta.indexOf("if (!back[0]) return json({ ok: false, error: 'exists_or_denied' }") && ta.indexOf('roomDropLists') < ta.indexOf("'track_add'"),
  'O12 a brand watched from the page becomes an entity at once, stamped with its track when it had none, and the list is dropped');
// O12b the watched name reaches the graph as a track: the house's spelling stands even in lowercase; a lowercase frame name still does not
const entSrc = between(w, 'const ENTITY = {', '/* PURE: the words a category') + fnOf(w, 'entityContextWords') + fnOf(w, 'entityProposals') + fnOf(w, 'entityResolveName');
const posts = [], rpcs = [];
const ER = new Function('sbRest', 'entityMap', 'excQuiet', 'console', 'ENTITY_MEASURE', entSrc + '; return entityResolveName;')(
  async (env, path, init) => { if (path === 'entities' && init && init.method === 'POST') { posts.push(init.body); return [{ id: 'e9', name: init.body.name }]; } if (path === 'rpc/resolve_signal_entities') { rpcs.push(init.body); return [{}]; } return []; },
  async () => ({}), () => () => null, { log: () => {} }, { MAP_KEY: 'ent:map:v1' });
const envR = { RATE_LIMIT: { delete: async () => {} } };
const madeTrack = await ER(envR, 'lululemon', { create: true, category: 'athletic apparel', track: { id: T1, name: 'lululemon', aliases: ['LULU'], sector: 'athletic apparel' } });
const madeFrame = await ER(envR, 'music publishers', { create: true, category: 'music' });
const madeCap = await ER(envR, 'Everlane', { create: true, category: 'apparel' });
ok(madeTrack && madeTrack.id === 'e9' && posts.length === 2 && posts[0].name === 'lululemon' && posts[0].from_src === 'track' && posts[0].track_id === T1 && posts[0].aliases.join(',') === 'LULU' && posts[0].category === 'athletic apparel' && posts[0].resolved_from && rpcs[0].p_entity === 'e9'
  && madeFrame === null && posts[1].name === 'Everlane' && posts[1].from_src === 'frame' && posts[1].track_id === null && madeCap.id === 'e9',
  'O12b a brand typed in lowercase into Watch becomes an entity from its track (from_src track, its track_id, its aliases, backfilled alone); a lowercase frame name still does not; a frame name keeps the frame path');
const roomPure = between(w, '/* ═══ SEAM:ENTITY_ROOM (RM1)', 'async function roomEntities(');
ok(!/callClaude|callModel|env\.AI\.run|excCompile|fetch\(/.test(roomSrc) && !/[—]/.test(roomSrc) && /excMeasureFrom\(rows, \[\], now,/.test(roomSrc) && /roomRowsOf\(links, !!sw\)/.test(roomSrc) && /entityCoverage\(e\.resolved_from, bf, now, ROOMS\.WEEKS\)/.test(roomSrc),
  'O13 no model and no dash in the rooms; the room\'s measure is the measure\'s own function over the rows the board reads, with its coverage');

// ── G: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const brandsHtml = between(page, '<div id="sec-brands" class="page-section">', '<!-- ══ AUDIENCES ══ -->');
const visible = h => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
ok(/id="brand-grid"/.test(brandsHtml) && /id="brand-find"/.test(brandsHtml) && /id="brand-room"/.test(brandsHtml) && /class="room-dateline">Brands</.test(brandsHtml) && /Every subject we watch, counted every week\./.test(brandsHtml) && /onsubmit="event\.preventDefault\(\);_roomFind\(\)"/.test(brandsHtml) && /The subjects we watch/.test(brandsHtml) && !/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(visible(brandsHtml)) && !/the house/i.test(visible(brandsHtml)) && !/[—–]/.test(visible(brandsHtml)),
  'G1 the Brands markup keeps its ids and its dateline; the copy is the subjects\'; no machinery word, no dash');
ok(/async function initBrandsPage\(\) \{\n  if \(typeof initRoomsPage === 'function'\) return initRoomsPage\(\);/.test(page) && /function _brandRoute\(\) \{\n  if \(typeof _roomRoute === 'function'\) return _roomRoute\(\);/.test(page) && /async function _openBrand\(id, fromAddress\) \{\n  if \(typeof _openRoom === 'function'\) return _openRoom\(id, fromAddress, 'track'\);/.test(page) && /function _closeBrand\(quiet\) \{\n  if \(typeof _closeRoom === 'function'\) return _closeRoom\(quiet\);/.test(page) && /function _brandHash\(\) \{ const m = \/#\(\?:brand\|room\)=\(\[0-9a-fA-F-\]\{36\}\)\(\?:\$\|\[&\?\]\)\/\.exec\(location\.hash \|\| ''\); return m \? _uuid\(m\[1\]\) : ''; \}/.test(page) && /if \(section !== 'brands' && typeof _brandHash === 'function' && _brandHash\(\)\)/.test(page) && /if \(typeof _rooms === 'object'\) _rooms\.at = 0;/.test(page),
  'G2 the old brand functions hand over to the rooms; the brand address reads both forms, so leaving Brands clears either; a watched brand reloads the rooms');
const brandJs = between(page, 'const _brands = { tracks: [], at: 0, open: null, room: null };', 'async function trackThis(name)');
const roomJs = between(page, 'const _rooms = { list: [], at: 0, open: null, room: null, loading: false };', '/* SEAM:MOAT_1 (retired on this page in EX19)');
const win = { matchMedia: () => ({ matches: false, addEventListener: () => {} }), addEventListener: () => {}, scrollTo: () => {} };
const pulseStub = s => '<div class="pulse">' + (s || []).length + '</div>';
const BJ = new Function('safe', 'safeAttr', 'safeUrl', 'API_BASE', '_pulse', '_pulseWeeks', 'window', 'document', brandJs + '; return { _brandColumns, _brandLines, _brandPhoto, _brandStat, _fmtN, _fmtC, _day, _month, _uuid, _tlKey };')(esc, esc, u => /^https?:\/\//.test(String(u)) ? esc(u) : '#', 'https://api.example/', pulseStub, pulseStub, win, { addEventListener: () => {}, getElementById: () => null });
const el = {}, doc = { getElementById: id => el[id] || null, querySelector: () => null };
const loc = { hash: '', pathname: '/intelligence/', search: '' }, hist = { state: null, pushState: (s, t, u) => { hist.state = s; hist.pushed = u; }, replaceState: (s, t, u) => { hist.state = s; hist.replaced = u; }, back: () => { hist.backs = (hist.backs || 0) + 1; } };
const RJ = new Function('safe', 'safeAttr', 'safeUrl', 'API_BASE', '_uuid', '_fmtN', '_fmtC', '_day', '_month', '_brandPhoto', '_brandStat', '_brandColumns', '_brandLines', '_pulseWeeks', '_drawPulses', '_wireColumns', '_wireLines', '_tlKey', '_tlFetch', '_renderTimeline', 'navTo', 'trackThis', 'window', 'document', 'location', 'history', 'fetch', 'console', '_openDoorRead',
  roomJs + '; return { _rooms, _roomKind, _roomHash, _renderRoomGrid, _roomFind, _closeRoom, _openRoom, _renderRoom, _roomQuote, _roomGrade, _roomMarks, initRoomsPage };')(
  esc, esc, u => /^https?:\/\//.test(String(u)) ? esc(u) : '#', 'https://api.example/', BJ._uuid, BJ._fmtN, BJ._fmtC, BJ._day, BJ._month, BJ._brandPhoto, BJ._brandStat, BJ._brandColumns, BJ._brandLines, pulseStub, () => {}, () => {}, () => {}, BJ._tlKey, async () => ({ ok: true, empty: true }), () => '', () => {}, () => {}, win, doc, loc, hist, async () => ({ ok: true, json: async () => roomFix }), { warn: () => {}, log: () => {} }, undefined);
loc.hash = '#room=' + E1.toUpperCase();
ok(RJ._roomHash().by === 'id' && RJ._roomHash().id === E1 && (loc.hash = '#brand=' + T1, RJ._roomHash().by === 'track' && RJ._roomHash().id === T1) && (loc.hash = "#room=x');alert(1)", RJ._roomHash() === null) && (loc.hash = '', RJ._roomHash() === null) && RJ._roomKind('org') === 'Organisation' && RJ._roomKind('publication') === 'Brand' && RJ._roomKind(null) === 'Brand',
  'G3 the address: #room=<entity id> and the older #brand=<track id>, lower-cased, nothing else; the kinds read as words');
const roomFix = { ok: true, room: { id: E1, name: 'Costco', kind: 'brand', category: 'retail', aliases: ['COST'], from: 'track', track: { id: T1, sector: 'retail', description: 'Warehouse club', image: 'https://kg/costco.jpg', image_license: 'CC BY' }, measured_at: ago(0), measured_from: day(84), coverage_weeks: 12 },
  measure: { weeks: 12, series: [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 3], recent_7d: 3, prior_7d: 2, outlets: 3, weeks_touched: 3, state: 'STEADY', newest: day(1), n: 6 },
  weeks: Array.from({ length: 12 }, (_, i) => ({ start: day((12 - i) * 7), n: i === 11 ? 3 : i === 8 || i === 1 ? 1 : 0, outlets: i === 11 ? 2 : i === 8 || i === 1 ? 1 : 0 })),
  voices: { outlets: 3, stories: 5, tiers: [{ tier: 1, outlets: 1, stories: 2, names: [{ name: 'Vogue', n: 2 }] }, { tier: 2, outlets: 2, stories: 3, names: [{ name: 'WWD', n: 2 }, { name: 'Dezeen', n: 1 }] }] },
  stories: [{ title: 'Costco again', url: 'https://wwd.com/1', source: 'WWD', tier: 2, date: day(1), image: null }, { title: 'Costco opens a store', url: 'https://vogue.com/1', source: 'Vogue', tier: 1, date: day(2), image: 'https://img/1.jpg' }],
  record: { deployments: 2, held: 1, missed: 1, open: 0, since: '2026-10-12', earlier: 1, readings: [{ id: D1, night: '2026-10-20', claim: 'Casual buyers choose the archive.', move: 'Lead with the archive', question: null, findings: 3, grade: 'held', check_by: '2026-11-20', marks: { held: 2, useful: 1, wrong: 0 }, photo: null }, { id: D2, night: '2026-10-12', claim: 'An older call.', move: null, findings: 1, grade: 'missed', check_by: '2026-11-01', marks: null, photo: null }] },
  readings: { door: 2, live: 1, latest_live: '2026-10-27' },
  claims: [{ id: 'c1', src: 'door', reading_id: D1, night: '2026-10-20', claim: 'Casual buyers choose the archive.', excerpt: 'Three outlets said so.', confidence: 'High', grade: 'held', marks: { held: 2 }, on_record: true, how: 'frame' }, { id: 'c2', src: 'read', reading_id: 'l1', night: '2026-10-27', claim: 'A live read names <Costco>.', excerpt: null, confidence: 'Medium', grade: null, marks: null, on_record: false, how: 'alias' }],
  board: { night: '2026-10-29', claim: 'Tonight on Costco.', move: 'Move tonight', question: 'What now?', state: 'STRUCTURAL', voices: [{ text: 'I shop there weekly', likes: 3, when: '2026-10-28', self: { role: 'parent' } }] },
  set: [{ id: E2, name: 'Target', kind: 'brand', category: 'retail', n7: 1, n30: 9, outlets_30d: 4, weeks: Array(12).fill(1) }, { id: 'bad', name: 'Hostile<script>', n7: 1, n30: 1, outlets_30d: 1, weeks: [] }],
  attention: { months: ['2026-09', '2026-10'], series: [{ label: 'Costco', role: 'subject', article: 'Costco', views: [1, 2] }, { label: 'Target', role: 'rival', article: 'Target Corporation', views: [1, 1] }], stats: { recent_3m: 1200, yoy_pct: 5 } },
  ledger: { weeks: 2, since: '2026-09-28', on_board: 1 }, partial: false };
const html = RJ._renderRoom(roomFix), plain = visible(html);
const order = ['On the board this week', 'The record', 'The claims', 'live read', 'Coverage, week by week', 'The voices', 'Attention, three years', 'Against its set', 'The latest stories', 'The weeks', 'Commission a RECON'].map(x => plain.indexOf(x));
ok(order.every(i => i >= 0) && order.every((x, i) => i === 0 || x > order[i - 1]), 'G4 a room in order: the board, the record, the claims, the readings, the weeks, the voices, the attention, the set, the stories, the ledger, the RECON line');
ok(/<h1 tabindex="-1">Costco<\/h1>/.test(html) && /class="room-dateline">Brand · retail · counted /.test(html) && />3<\/div><div class="l">stories in the last 7 days<\/div><div class="d">up 1 on the week before<\/div>/.test(html) && />5<\/div><div class="l">stories in twelve weeks<\/div>/.test(html) && />3<\/div><div class="l">outlets in twelve weeks<\/div>/.test(html) && />3 of 12<\/div><div class="l">weeks with a story<\/div>/.test(html) && /1\.2K<\/div><div class="l">views of its Wikipedia article/.test(html) && /<p class="desc">Warehouse club<\/p>/.test(html) && /<figcaption>Image: CC BY<\/figcaption>/.test(html),
  'G5 the head: the kind and the category, the counts, the week before, the attention, the description and the credited photograph');
ok(/2 readings on record since Oct 12, 2026: 1 held, 1 missed, 0 being checked\. 1 earlier reading stands outside the record\./.test(plain) && /Oct 20, 2026 · the call held · 3 findings/.test(plain) && /<h3>Casual buyers choose the archive\.<\/h3>/.test(html) && /<p class="move">Lead with the archive<\/p>/.test(html) && /Readers: 2 held, 1 useful/.test(plain) && /Oct 12, 2026 · the call missed · 1 finding/.test(plain) && (html.match(/onclick="_roomOpenReading\('dddddddd-dddd-dddd-dddd-dddddddddd0[12]'\)"/g) || []).length === 2,
  'G6 the record: the counts line, each reading with its date, its grade, its findings, its move, the readers\' marks and a way to open it');
ok(/Oct 20, 2026 · deployed · High · the call held/.test(plain) && /Oct 27, 2026 · a live read · Medium · named in the finding/.test(plain) && /A live read names &lt;Costco&gt;\./.test(html) && /<summary>What it rests on<\/summary><p class="rcl-ex">Three outlets said so\.<\/p>/.test(html) && /2 readings on the board and 1 live read name Costco; the latest live read on Oct 27, 2026\./.test(plain),
  'G7 the claims newest first with where each came from, its confidence, its grade and how it was linked; the readings counted');
ok((html.match(/<rect class="hit" x="/g) || []).length === 12 && /5 stories from 3 outlets in twelve weeks\./.test(plain) && /<table class="rtiers">/.test(html) && /Tier 1: daily reporting/.test(plain) && /Tier 2: specialist depth/.test(plain) && /WWD \(2\), Dezeen \(1\)/.test(plain) && /3 outlets behind 5 stories/.test(plain),
  'G8 the weeks as columns with the numbers beneath; the voices as a table by tier with the names');
ok(/<div class="viz-legend">/.test(html) && /onclick="_openRoom\('22222222-2222-2222-2222-222222222222'\)"/.test(html) && !/Hostile|alert|<script/.test(html) && /<b>Costco<\/b>/.test(html) && /brow self/.test(html) && />9<small>30 days<\/small>/.test(html) && /WWD · T2 · /.test(plain) && /<img src="https:\/\/img\/1\.jpg"/.test(html) && /2 weeks counted since Sep 28, 2026, 1 of them on the board\./.test(plain) && /data-key="track:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"/.test(html) && /subject=RECON%3A%20Costco/.test(html),
  'G9 the attention drawn, the set on the same count opening rooms (a bad id never), the stories with their tier and photograph, the ledger\'s weeks, the RECON line');
ok(!/[—–]/.test(plain) && !/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(plain) && !/the house/i.test(plain), 'G10 no dash, no machinery word and no "the house" in a room');
const bare = visible(RJ._renderRoom({ ok: true, room: { id: E3, name: 'Quiet', kind: 'org', category: null, aliases: [], from: 'frame', track: null, measured_at: ago(0), measured_from: day(14), coverage_weeks: 2 }, measure: { weeks: 12, series: Array(12).fill(0), recent_7d: 0, prior_7d: 0, outlets: 0, weeks_touched: 0, n: 0 }, weeks: Array.from({ length: 12 }, (_, i) => ({ start: day((12 - i) * 7), n: 0, outlets: 0 })), voices: { outlets: 0, stories: 0, tiers: [] }, stories: [], record: { deployments: 0, held: 0, missed: 0, open: 0, since: null, earlier: 0, readings: [] }, readings: { door: 0, live: 0 }, claims: [], board: null, set: [], attention: null, ledger: null }));
ok(/Organisation · counted /.test(bare) && /Counted from Oct \d{1,2}, 2026: 2 of 12 weeks\. The earlier weeks are not counted yet, so a low early column is not a fall\./.test(bare) && /stories in 2 counted weeks/.test(bare) && /Nothing on the record for Quiet yet\./.test(bare) && /No story naming Quiet in twelve weeks of our sweep\./.test(bare) && !/On the board this week|The claims|The voices|Attention, three years|Against its set|The latest stories|The weeks/.test(bare) && /the same as the week before/.test(bare),
  'G11 a quiet subject from a frame: its own coverage line, nothing on record, no empty section drawn, never a zero said as a fact');
el['brand-grid'] = { innerHTML: '' }; RJ._rooms.list = [{ id: E1, name: 'Costco', kind: 'brand', category: 'retail', counts: { captures_7d: 3, captures_30d: 4, outlets_30d: 2 }, weeks: Array(12).fill(1), latest: day(1), deployments: 2, held: 1, missed: 1, coverage_weeks: 12, image: 'https://kg/costco.jpg' }, { id: E3, name: 'Dezeen', kind: 'org', category: 'design media', counts: { captures_7d: null, captures_30d: null, outlets_30d: null }, weeks: null, latest: null, deployments: 0, coverage_weeks: 2, measured_from: day(14) }, { id: E2, name: 'Target', kind: 'brand', category: 'retail', counts: { captures_7d: 1, captures_30d: 9, outlets_30d: 4 }, weeks: Array(12).fill(1), latest: day(2), deployments: 0, coverage_weeks: 2, measured_from: day(14) }, { id: 'bad', name: 'Hostile', counts: {}, weeks: [] }]; RJ._rooms.at = Date.now();
RJ._renderRoomGrid(); const grid = el['brand-grid'].innerHTML;
ok((grid.match(/<article class="bcard"/g) || []).length === 3 && (grid.match(/counted from Oct/g) || []).length === 1 && /class="who">Brand · retail</.test(grid) && /class="who">Organisation · design media</.test(grid) && /<b>3<\/b> in 7 days/.test(grid) && /<b>2<\/b> readings on record/.test(grid) && /1 held, 1 missed/.test(grid) && /Counted from the next run\./.test(grid) && /counted from Oct \d{1,2}, 2026/.test(grid) && !/Hostile/.test(grid) && /<img src="https:\/\/kg\/costco\.jpg"/.test(grid) && /Watch a brand we do not follow yet/.test(grid) && !/[—–]/.test(visible(grid)),
  'G12 the cards: kind and category, the counts, the record\'s count, the coverage note only on a counted card, nulls as words, a bad id never drawn, the watch box');
el['brand-find'] = { value: 'cost' }; el['brand-find-note'] = { textContent: 'x', innerHTML: '' }; let opened = null; RJ._rooms.open = null;
el['brands-list'] = { style: {} }; el['brand-room'] = { style: {}, innerHTML: '', querySelector: () => null };
RJ._roomFind(); await new Promise(r => setTimeout(r, 5));
ok(RJ._rooms.open === E1 && hist.pushed === '/intelligence/#room=' + E1 && el['brand-room'].style.display === 'block' && el['brands-list'].style.display === 'none' && /<h1 tabindex="-1">Costco<\/h1>/.test(el['brand-room'].innerHTML),
  'G13 the find box opens a room by a name\'s start; the address becomes #room=<entity id>; the room draws in place of the list');
RJ._closeRoom(true);
ok(RJ._rooms.open === null && el['brand-room'].style.display === 'none' && el['brands-list'].style.display === 'block' && el['brand-room'].innerHTML === '', 'G14 closing a room returns the list');
const counts = {}; for (const m of page.matchAll(/\n(?:async )?function (\w+)\(/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
ok(['initRoomsPage', '_roomRoute', '_renderRoomGrid', '_roomFind', '_closeRoom', '_openRoom', '_paintRoom', '_fillRoomRecord', '_renderRoom', '_roomQuote', '_roomOpenReading', '_roomGrade', '_roomMarks', '_roomHash', '_roomKind', 'initBrandsPage', '_renderBrandRoom', '_openBrand', 'trackThis'].every(n => counts[n] === 1) && (page.match(/const _rooms = \{/g) || []).length === 1,
  'G15 one definition per function on the page: the rooms\' own and the brand functions they hand over from');
ok(/\/\* SEAM:ENTITY_ROOM \(RM1\): the record's readings, the claims and the tiers in a room \*\//.test(page) && /\.rrd\{background:var\(--room-card\)/.test(page) && /\.rtiers\{width:100%/.test(page) && /@media \(max-width:640px\)\{\.rtiers td:last-child\{overflow-wrap:anywhere\}\}/.test(page),
  'G16 the room\'s own styles sit beside the brand room\'s, phone width included');

// ── Z: the migration and the seams ─────────────────────────────────────────────────────────────────────────────────────────────
ok(/create or replace function public\.entity_rollup\(p_ids uuid\[\], p_now timestamptz default now\(\)\)/.test(sql) && /coalesce\(s\.published_at, s\.captured_at\) as w/.test(sql) && /s\.research = false and s\.status <> 'rejected'/.test(sql) && /11 - ago as i/.test(sql) && /c\.src = 'door' and c\.on_record\)::int as deployed/.test(sql) && /grant execute on function public\.entity_rollup\(uuid\[\], timestamptz\) to service_role;/.test(sql) && !/sweep_when|track_patterns|ilike/.test(sql),
  'Z1 0056: entity_rollup counts the links on the measure\'s rule (published, else captured; research and rejected out), twelve weeks, the record\'s counts; the title match is never asked');
ok(seams.registry['SEAM:ENTITY_ROOM'] && seams.registry['SEAM:ENTITY_ROOM'].file === 'worker/src/index.js' && seams.registry['SEAM:ENTITY_ROOM@intelligence'] && seams.registry['SEAM:ENTITY_ROOM@intelligence'].tag === 'SEAM:ENTITY_ROOM' && (w.match(/SEAM:ENTITY_ROOM/g) || []).length >= 4 && (page.match(/SEAM:ENTITY_ROOM/g) || []).length >= 6,
  'Z2 SEAM:ENTITY_ROOM is registered for the worker and the page, and tagged where the rooms live');
console.log(`\nproof_entity_room: ${pass} checks passed`);
