/**
 * proof_spaces.mjs  --  NT1 THE SPACES: SEAM:SPACES. The net's unit is a row: what the door reads, who holds it, its cadence and its
 * state. The board's thirty stay exactly as doorCandidates ranks them; the stamp rule and the earned law are untouched; the house keeps
 * its six; a space only seats hold compiles under its holder's twelve a week, ahead of the board when the night is tight, and is read for
 * them alone. The pure parts are run, then the real doorPass, doorLand, doorReadRoute, pushNightly and the routes run against a small
 * database. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0061_spaces.sql', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const hush = async f => { const l = console.log; console.log = () => undefined; try { return await f(); } finally { console.log = l; } };

// ── A: the migration ─────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/create table if not exists public\.spaces \(/.test(sql) && /create unique index if not exists spaces_key_holder_uq on public\.spaces \(key, held_by\);/.test(sql) && /create table if not exists public\.space_grants \(/.test(sql) && /primary key \(space_id, user_id\)/.test(sql) && /create table if not exists public\.space_reads \(like public\.door_reads including all\);/.test(sql),
  'A1 0061: spaces (one row per key and holder), space_grants (one per space and reader), space_reads in door_reads\' shape with its upsert key');
ok(['spaces', 'space_grants', 'space_reads'].every(t => sql.includes('alter table public.' + t + ' enable row level security;') && sql.includes('revoke all on public.' + t + ' from anon, authenticated;')), 'A2 row level security on all three tables; nothing for anon or authenticated');
ok(/check \(kind in \('brand', 'entity', 'theme', 'category', 'frame'\)\)/.test(sql) && /check \(cadence in \('nightly', 'every_2', 'every_3', 'weekly'\)\)/.test(sql) && /check \(holder_kind in \('house', 'seat', 'group'\)\)/.test(sql) && /check \(status in \('active', 'dormant'\)\)/.test(sql) && /references public\.entities\(id\) on delete set null/.test(sql) && /references public\.tracks\(id\) on delete set null/.test(sql),
  'A3 the kinds, the cadences, the holders and the states are the table\'s own checks; an entity or a track removed leaves the space');
ok(/security definer/.test(sql) && /set search_path = public/.test(sql) && /revoke all on function public\.spaces_touch\(jsonb\) from public, anon, authenticated;/.test(sql) && /grant execute on function public\.spaces_touch\(jsonb\) to service_role;/.test(sql) && /entity_id\s+= coalesce\(s\.entity_id, nullif\(r->>'entity_id', ''\)::uuid\)/.test(sql) && /on conflict \(key, held_by\) do update set/.test(sql) && /if coalesce\(r->>'key', ''\) = '' then continue; end if;/.test(sql),
  'A4 spaces_touch is the service role\'s one write: a field left out keeps its value, the entity is filled only while empty, a row with no key is skipped');
ok(/Named 0061, not 0060: EX53b may take 0060\./.test(sql) && (sql.match(/create table if not exists public\./g) || []).length === 3 && !/subject_weeks/.test(sql) && !/[—–]/.test(sql), 'A5 named 0061 for EX53b\'s 0060; three tables and one function, nothing else (the ledger\'s kinds are not widened)');

// ── B: the pure parts ────────────────────────────────────────────────────────────────────────────────────────────────────────
const blockSrc = between(w, '/* ═══ SEAM:SPACES (NT1 THE SPACES)', '/* ═══ SEAM:ENTITY_ROOM (RM1): the rooms on the graph.');
const LAW = new Function(between(w, 'const DOOR_LAW = ', 'function excDoorPrompt(') + '; return { DOOR_LAW, doorMoveSize };')();
const P = new Function('DOOR_LAW', 'DOOR', blockSrc + '; return { SPACES, spaceSlug, spaceRowOf, spaceBoardRow, spaceUnseen, spaceDue, spaceStale, spaceMovement, spacePull, spaceNext, spacesCap, spacesSplit, spacesHoldersOf, spaceOn, spaceCandOf, spaceFrame, spaceContextKeep, spaceWhy, spacePublicRow };')(LAW.DOOR_LAW, { EVIDENCE: 30 });
ok(P.spaceSlug('Jordan Brand') === 'jordan-brand' && P.spaceSlug('Café & Co.') === 'cafe-and-co' && P.spaceSlug('  ') === '', 'B1 a name\'s slug: lowercased, accents gone, single hyphens');
const TR = [{ id: 't-jb', name: 'Jordan Brand', aliases: ['Air Jordan'], sector: 'Athletic footwear' }], EMAP = { acme: { id: 'e-acme', name: 'Acme', resolved_from: null } };
const rJ = P.spaceRowOf({ name: 'air jordan' }, TR, EMAP), rA = P.spaceRowOf({ name: 'ACME' }, TR, EMAP), rF = P.spaceRowOf({ name: 'FIELD', names: ['FIELD', 'smart glasses'], context: ['Glasses', 'wearable'] }, TR, EMAP), rC = P.spaceRowOf({ name: 'Hair Care', kind: 'category' }, TR, EMAP);
ok(rJ.key === 'track:t-jb' && rJ.track_id === 't-jb' && rJ.name === 'Jordan Brand' && rA.key === 'brand:acme' && rA.entity_id === 'e-acme' && rA.name === 'Acme' && rF.key === 'brand:field' && rF.entity_id === null && !('track_id' in rF) && rF.frame.context.join() === 'glasses,wearable' && rC.key === 'cat:hair-care' && rC.category === 'hair care' && P.spaceRowOf({ name: 'ab' }, TR, EMAP) === null,
  'B2 a brand the house tracks takes the track\'s key (one subject, one key, whoever holds it); a name on the graph keeps its entity; a bare name has none; a category its name; a short name nothing');
const N = '2026-11-10';
ok(P.spaceDue({ status: 'active', cadence: 'nightly', last_considered: null }, N) && P.spaceDue({ status: 'active', cadence: 'nightly', last_considered: '2026-11-09' }, N) && !P.spaceDue({ status: 'active', cadence: 'every_3', last_considered: '2026-11-08' }, N) && P.spaceDue({ status: 'active', cadence: 'every_3', last_considered: '2026-11-07' }, N) && !P.spaceDue({ status: 'active', cadence: 'weekly', last_considered: '2026-11-04' }, N) && P.spaceDue({ status: 'active', cadence: 'weekly', last_considered: '2026-11-03' }, N) && !P.spaceDue({ status: 'dormant', cadence: 'nightly', last_considered: null }, N),
  'B3 a space is due on its cadence: never considered, or its gap in nights since it last was; a sleeping space never');
const seatS = { key: 'brand:acme', held_by: 'u1', cadence: 'nightly', considered_nights: 4, unmoved_nights: 4, last_considered: '2026-11-09' };
const n1 = P.spaceNext(seatS, 'unmoved', N, { night: N, recent_7d: 2 });
ok(n1.cadence === 'every_2' && n1.unmoved_nights === 0 && n1.considered_nights === 5 && n1.last_considered === N && n1.movement.recent_7d === 2 && !('last_compiled_at' in n1), 'B4 a seat\'s space unmoved for five considered nights slows a step, and the count starts again');
const n2 = P.spaceNext(Object.assign({}, seatS, { cadence: 'every_3', unmoved_nights: 2 }), 'compiled', N, null);
ok(n2.cadence === 'nightly' && n2.unmoved_nights === 0 && n2.last_compiled_at === N, 'B5 the night it earns a read it is nightly again');
ok(P.spaceNext(Object.assign({}, seatS, { cadence: 'every_2' }), 'capped', N, null).cadence === 'nightly' && P.spaceNext(Object.assign({}, seatS, { cadence: 'weekly', unmoved_nights: 4 }), 'thin', N, null).cadence === 'weekly', 'B6 earned past the cap it is first in line (nightly); weekly is the floor');
const hN = P.spaceNext({ key: 'theme:x', held_by: 'house', cadence: 'nightly', considered_nights: 9, unmoved_nights: 9, last_considered: '2026-11-09' }, 'unmoved', N, null);
ok(hN.cadence === 'nightly' && hN.unmoved_nights === 10 && P.spaceNext(Object.assign({}, seatS, { pinned: true, unmoved_nights: 4 }), 'unmoved', N, null).cadence === 'nightly', 'B7 the house\'s spaces (the board, the hand) stay nightly however long they sit unmoved; the count is kept for the shelf');
const again = P.spaceNext(Object.assign({}, seatS, { last_considered: N }), 'unmoved', N, null);
ok(again.considered_nights === 4 && again.unmoved_nights === 4 && P.spaceNext(seatS, 'kept', N, null) === null && P.spaceNext(seatS, null, N, null) === null, 'B8 a second pass the same night counts nothing twice; a space already read tonight is left alone');

// ── C: the cap ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const J = (k, size) => ({ base: { frame_key: k, meta: {} }, size, prev: null });
const boardJobs = Array.from({ length: 9 }, (_, i) => J('theme:t' + i, 100 - i));
const noHolders = P.spacesCap(boardJobs, {}, 6, new Map(boardJobs.map(j => [j.base.frame_key, { house: true, holders: [] }])));
ok(noHolders.go.length === 6 && noHolders.go.every((j, i) => j === boardJobs[i]) && noHolders.rest.length === 3 && noHolders.rest.every((j, i) => j === boardJobs[6 + i]) && noHolders.held === 0 && noHolders.house === 6 && P.spacesCap(boardJobs, {}, 6, new Map()).go.every((j, i) => j === boardJobs[i]),
  'C1 with no seat holder the cap is the house\'s own: exactly jobs.slice(0, 6), the rest past it in order');
const mineJobs = Array.from({ length: 11 }, (_, i) => J('brand:s' + i, 10 - i)), allJobs = boardJobs.concat(mineJobs);
const BY = new Map(boardJobs.map(j => [j.base.frame_key, { house: true, holders: [] }]).concat(mineJobs.map(j => [j.base.frame_key, { house: false, holders: ['u1', 'u2'] }])));
const tight = P.spacesCap(allJobs, { u1: 5, u2: 12 }, 6, BY);
ok(tight.held === 9 && tight.house === 3 && tight.go.length === 12 && tight.charged.u1 === 5 && tight.charged.u2 === 4 && tight.go.filter(j => j.base.frame_key.startsWith('theme:')).map(j => j.base.frame_key).join() === 'theme:t0,theme:t1,theme:t2' && tight.go.filter(j => j.charge).length === 9,
  'C2 when the night is tight the holders\' spaces go first, charged to the first holder with allowance, up to twelve less the house\'s floor of three; the house keeps its three largest moves');
const spent = P.spacesCap(allJobs, { u1: 0, u2: 1 }, 6, BY);
ok(spent.held === 1 && spent.house === 6 && spent.go.length === 7 && spent.rest.length === 13, 'C3 a seat with no allowance left waits (its space keeps its last read and is first in line); the house takes its own six');
const BY2 = new Map(boardJobs.map((j, i) => [j.base.frame_key, { house: true, holders: i === 7 ? ['u1'] : [] }]));
const over = P.spacesCap(boardJobs, { u1: 3 }, 6, BY2);
ok(over.go.length === 7 && over.go.some(j => j.base.frame_key === 'theme:t7' && j.charge === 'u1') && over.house === 6 && over.held === 1 && over.charged.u1 === 1 && !over.go.some(j => j.base.frame_key === 'theme:t6'), 'C4 a house space past the house\'s cap that a seat holds compiles under that seat\'s allowance; the one beside it nobody holds waits');
ok([noHolders, tight, spent, over].every(c => c.house <= 6 && c.go.length <= 12), 'C5 never more than six for the house, never more than twelve a night');

// ── D: who sees what ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const sp = P.spacesSplit([{ frame_key: 'a', meta: { space: { private: true } } }, { frame_key: 'b', meta: { space: { private: false } } }, { frame_key: 'c', meta: {} }]);
ok(sp.priv.map(r => r.frame_key).join() === 'a' && sp.pub.map(r => r.frame_key).join() === 'b,c', 'D1 a row only seats hold goes to space_reads; every other row is the house\'s record, as before');
const BK = new Map([['track:t-jb', [{ key: 'track:t-jb', held_by: 'house', kind: 'brand', name: 'Jordan Brand', status: 'active' }, { key: 'track:t-jb', held_by: 'u1', holder_kind: 'seat', kind: 'brand', name: 'Jordan Brand', status: 'active' }, { key: 'track:t-jb', held_by: 'u9', holder_kind: 'seat', kind: 'brand', name: 'Jordan Brand', status: 'active' }]], ['brand:acme', [{ key: 'brand:acme', held_by: 'u1', holder_kind: 'seat', kind: 'brand', name: 'Acme', status: 'active' }]]]);
const o1 = P.spaceOn('track:t-jb', BK, new Set(['u1']), 'Jordan Brand'), o2 = P.spaceOn('brand:acme', BK, new Set(['u1']), 'Acme');
ok(o1.house && !o1.private && o1.holders.join() === 'u1' && o1.rows.length === 2 && o2.private && !o2.house && o2.holders.join() === 'u1' && P.spacesHoldersOf(new Map([['a', o1], ['b', o2]])).join() === 'u1', 'D2 a space the house holds is public whoever else holds it; a space only seats hold is theirs alone; a seat that does not pay holds nothing');
const pr = P.spacePublicRow({ id: 'x', key: 'brand:acme', kind: 'brand', name: 'Acme', held_by: 'u1', created_by: 'profile', cadence: 'every_2' });
ok(!('held_by' in pr) && !('created_by' in pr) && pr.house === false && pr.cadence === 'every_2', 'D3 a viewer is shown a space\'s state, never who holds it');
ok(P.spaceWhy('Acme', { recent_7d: 12, velocity_pct: 40 }, { recent_delta: 5, outlets_delta: 2 }) === 'your space moved: Acme, 12 stories this week, up 5 since its last reading, 2 new outlets' && P.spaceWhy('Acme', { recent_7d: 1, velocity_pct: -30 }, null) === 'your space moved: Acme, 1 story this week, -30% on the week' && P.spaceWhy('A', {}, {}) === 'your space moved: A',
  'D4 a holder hears that its space moved: the name and the movement in the measure\'s own words');

// ── F: the candidate, the frame, the evidence ────────────────────────────────────────────────────────────────────────────────
const CTX = { trackBy: new Map([['t-jb', TR[0]]]), stats: { 't-jb': { n7: 7 } }, entName: new Map([['e-acme', 'Acme']]), sets: new Map([['hair care', [{ id: 'e-mielle', name: 'Mielle', n7: 5 }, { id: 'e-pattern', name: 'Pattern Beauty', n7: 3 }]]]) };
const cT = P.spaceCandOf({ key: 'track:t-jb', kind: 'brand', name: 'Jordan Brand', track_id: 't-jb', frame: {} }, CTX);
const trExpr = between(w, '  const tr = tracks.map(', '\n  return themes.concat(tr)').replace(/^  const tr = tracks\.map\(/, '').replace(/\);$/, '');
const boardTr = new Function('tracks', 'st', 'return tracks.map(' + trExpr + ');')(TR, CTX.stats)[0];
const { form: cTform, ...cT0 } = cT;
ok(JSON.stringify(cT0) === JSON.stringify(boardTr) && cTform === 'track', 'F1 a tracked brand held by hand is the candidate doorCandidates builds for a track, field for field (its own code, run)');
const cE = P.spaceCandOf({ key: 'brand:acme', kind: 'brand', name: 'ACME', entity_id: 'e-acme', frame: { names: ['Acme Inc'] } }, CTX);
const cB = P.spaceCandOf({ key: 'brand:field', kind: 'brand', name: 'FIELD', frame: { names: ['FIELD', 'smart glasses'], context: ['glasses', 'wearable'] } }, CTX);
const cC = P.spaceCandOf({ key: 'cat:hair-care', kind: 'category', name: 'Hair care', category: 'hair care', frame: {} }, CTX);
ok(cE.form === 'entity' && cE.entity_ids.join() === 'e-acme' && cE.entity_name === 'Acme' && cE.names.includes('Acme Inc') && cB.form === 'bare' && !cB.entity_ids && cB.context.join() === 'glasses,wearable' && cB.query === 'FIELD glasses wearable' && cC.form === 'category' && cC.entity_ids.join() === 'e-mielle,e-pattern' && cC.names.join() === 'Mielle,Pattern Beauty' && cC.velocity === 8 && P.spaceCandOf({ key: 'cat:none', kind: 'category', name: 'Nothing here', frame: {} }, CTX) === null,
  'F2 a brand on the graph is read by its links, a bare name by its names with its context words, a category by its set on the rooms (a category with no subject on the graph waits)');
const fBoard = { entity: 'Nike', anchors: ['a'] }, fE = { entity: 'Acme Corporation', anchors: ['x'] }, fB = { entity: 'FIELD', anchors: [] }, fC = { entity: 'Mielle', category: 'beauty', anchors: [] }, fT = { entity: 'Jordan', anchors: ['j'] };
P.spaceFrame({ form: 'board' }, fBoard); P.spaceFrame(cT, fT); P.spaceFrame(cE, fE); P.spaceFrame(cB, fB); P.spaceFrame(cC, fC);
ok(fBoard.entity === 'Nike' && fBoard.anchors.join() === 'a' && fT.entity === 'Jordan' && fT.anchors.join() === 'j' && fE.entity === 'Acme' && fB.entity === null && fB.anchors.join() === 'FIELD,smart glasses' && fC.entity === null && fC.category === 'hair care' && fC.competitors.join() === 'Mielle,Pattern Beauty' && fC.anchors.slice(0, 2).join() === 'Mielle,Pattern Beauty' && P.spaceFrame(cB, null) === null,
  'F3 the board\'s and a track\'s frames are the compiler\'s; a brand on the graph names its entity; a bare name and a category name none (the measure never makes an entity from a hand name); the names and the set become the anchors');
ok(P.spaceContextKeep({ title: 'FIELD unveils AI glasses', summary: '' }, ['glasses']) && !P.spaceContextKeep({ title: 'A field guide to fall', summary: 'the football field' }, ['glasses', 'wearable']), 'F4 a bare name\'s line counts only when it carries one of its context words');
ok(P.spacePull(12, 9) && P.spacePull(6, 9) && !P.spacePull(11, 9) && !P.spacePull(null, 9) && !P.spacePull(5, null) && LAW.DOOR_LAW.MIN_DELTA === 3, 'F5 the pull: a space not due whose week moved by the law\'s own three stories since it was last considered is read tonight');
ok(P.spaceMovement({ recent_7d: 4, prior_7d: 1, outlets: 2, velocity_pct: 300, state: 'RISING' }, { recent_delta: 3 }, N).recent_7d === 4 && P.spaceMovement(null, null, N).measured === false, 'F6 a space keeps the measure of the night it was considered; a bare name keeps that it had none');
ok(P.SPACES.HELD_WEEK === 12 && P.SPACES.NIGHT_CAP === 12 && P.SPACES.HOUSE_FLOOR === 3 && P.SPACES.SLOW_AFTER === 5 && P.SPACES.DORMANT_AFTER === 7 && P.SPACES.SET === 8 && P.SPACES.HAND_MAX === 6 && P.SPACES.HOLDER_PLANS.join() === 'engine,partner,retainer' && P.SPACES.STEPS.join() === 'nightly,every_2,every_3,weekly' && /SET: 8,/.test(between(w, 'const ROOMS = {', '\n')),
  'F7 the constants: twelve compiles a week a seat, twelve a night with three kept for the house, five unmoved nights to slow, seven unseen to sleep, six by hand, the set of eight as the rooms count it; seats on engine, partner and retainer plans hold');

// ── G: the night, run: the real doorPass, doorLand, doorReadRoute, pushNightly and the routes on a small database ─────────────
const today = new Date().toISOString().slice(0, 10);
const ago = d => new Date(Date.now() - d * 864e5).toISOString();
const U1 = '11111111-1111-4111-8111-111111111111', U2 = '22222222-2222-4222-8222-222222222222', U3 = '33333333-3333-4333-8333-333333333333', U5 = '55555555-5555-4555-8555-555555555555', U8 = '88888888-8888-4888-8888-888888888888', U9 = '99999999-9999-4999-8999-999999999999', ADMIN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let T, nid;
const fresh = () => { T = { door: [], space: [], spaces: [], touches: [], patches: [], batch: [], kv: {}, jobs: [], grants: [], mail: [], pushlog: [], claimed: 0, measured: [], paths: [], failSpaces: false, failSeats: false,
  seats: [{ user_id: U1, group_id: 'g1' }, { user_id: U2, group_id: 'g2' }, { user_id: U3, group_id: 'g3' }],
  groups: [{ id: 'g1', plan: 'engine', status: 'active' }, { id: 'g2', plan: 'engine', status: 'paused' }, { id: 'g3', plan: 'member', status: 'active' }],
  profiles: [{ user_id: U1, email: 'u1@x.test', role_title: 'strategy', tracked_brands: ['Nike', 'Acme'], follows: [{ kind: 'brand', value: 'FIELD' }, { kind: 'category', value: 'Hair Care' }, { kind: 'audience', value: 'Gen Z' }], push_email: true, digest_day: 9 },
    { user_id: U2, email: 'u2@x.test', tracked_brands: ['Paused Co'], follows: [], push_email: true, digest_day: 9 }, { user_id: U3, email: 'u3@x.test', tracked_brands: ['Member Co'], follows: [], push_email: true, digest_day: 9 },
    { user_id: U5, email: 'u5@x.test', role_title: 'strategy', tracked_brands: ['Nike'], follows: [], push_email: true, digest_day: 9 }],
  users: [U1, U2, U3, U5, U8, U9, ADMIN].map(id => ({ id })), entities: [{ id: 'ent-jb', track_id: 'tr-jb', active: true }], rollup: [] }; nid = 1; };
const uuid = () => '00000000-0000-4000-8000-' + String(nid++).padStart(12, '0');
const copy = x => JSON.parse(JSON.stringify(x));
function mini(rows, path) {
  const ps = new URLSearchParams(path.split('?')[1] || ''); let out = rows.slice();
  for (const [k, v] of ps) {
    if (['select', 'limit', 'order', 'on_conflict'].includes(k)) continue;
    const val = r => String(r[k]);
    if (v.startsWith('in.(')) { const set = v.slice(4, -1).split(',').map(x => decodeURIComponent(x.replace(/^"|"$/g, ''))); out = out.filter(r => set.includes(val(r))); }
    else if (v.startsWith('eq.')) out = out.filter(r => val(r) === decodeURIComponent(v.slice(3)));
    else if (v.startsWith('neq.')) out = out.filter(r => val(r) !== v.slice(4));
    else if (v.startsWith('lt.')) out = out.filter(r => val(r) < v.slice(3));
    else if (v.startsWith('gte.')) out = out.filter(r => r[k] != null && val(r) >= v.slice(4));
  }
  if (ps.get('order') === 'night.desc') out.sort((a, b) => a.night < b.night ? 1 : -1);
  if (ps.get('select') === 'night') return out.map(r => ({ night: r.night }));
  return copy(out);
}
function applyTouch(rows) {
  for (const r of rows) {
    if (!r || !r.key) continue;
    const hb = r.held_by || 'house'; let s = T.spaces.find(x => x.key === r.key && x.held_by === hb);
    if (!s) { T.spaces.push({ id: uuid(), key: r.key, kind: r.kind || 'brand', name: r.name || r.key, entity_id: r.entity_id || null, track_id: r.track_id || null, category: r.category || null, frame: r.frame || {}, held_by: hb, holder_kind: r.holder_kind || 'house', pinned: !!r.pinned, cadence: r.cadence || 'nightly',
      considered_nights: r.considered_nights || 0, unmoved_nights: r.unmoved_nights || 0, last_considered: r.last_considered || null, last_compiled_at: r.last_compiled_at || null, last_read_id: r.last_read_id || null, movement: r.movement || null, seen_on: r.seen_on || null, status: r.status || 'active', since: today }); continue; }
    for (const [k, v] of Object.entries(r)) { if (v == null || k === 'key' || k === 'held_by') continue; if (k === 'entity_id' || k === 'track_id') { if (!s[k]) s[k] = v; continue; } if (k === 'frame') { s.frame = Object.assign({}, s.frame, v); continue; } s[k] = v; }
  }
}
async function sb(env, path, opts) {
  const m = (opts && opts.method) || 'GET'; T.paths.push(m + ' ' + path);
  if (/^spaces\?/.test(path)) { if (T.failSpaces) throw new Error('sb_404'); return mini(T.spaces, path); }
  if (path === 'rpc/spaces_touch') { T.touches.push(copy(opts.body.p_rows)); applyTouch(copy(opts.body.p_rows)); return opts.body.p_rows.length; }
  if (/^group_seats\?/.test(path)) { if (T.failSeats) throw new Error('sb_500'); return copy(T.seats); }
  if (/^member_groups\?/.test(path)) return mini(T.groups, path);
  if (/^client_profile\?/.test(path)) return /user_id=in\./.test(path) ? mini(T.profiles, path) : copy(T.profiles);
  if (path === 'rpc/entity_rollup') return copy(T.rollup.filter(r => opts.body.p_ids.includes(r.entity_id)));
  if (/^claude_jobs\?/.test(path)) return copy(T.jobs);
  if (/^entities\?/.test(path)) return mini(T.entities, path);
  if (/^app_user\?/.test(path)) return mini(T.users, path);
  if (/^space_grants/.test(path)) {
    if (m === 'POST') { for (const g of opts.body) if (!T.grants.some(x => x.space_id === g.space_id && x.user_id === g.user_id)) T.grants.push(g); return null; }
    if (m === 'DELETE') { const q = new URLSearchParams(path.split('?')[1]); T.grants = T.grants.filter(g => !(g.space_id === q.get('space_id').slice(3) && g.user_id === q.get('user_id').slice(3))); return null; }
    return mini(T.grants, path);
  }
  if (/^push_log/.test(path)) { if (m === 'POST') { T.pushlog.push(...opts.body); return null; } return []; }
  if (/^signal_entities\?/.test(path)) return Array.from({ length: 6 }, (_, i) => ({ signal_id: 'sig-' + i }));
  if (/^signals\?/.test(path)) {
    const n = /th2/.test(path) ? 2 : /FIELD/.test(path) ? 8 : 6;
    const label = /theme_id\.eq\.th1/.test(path) ? 'Curl aisle story ' : /Nike/.test(path) ? 'Nike story ' : /Jordan/.test(path) ? 'Jordan story ' : /FIELD/.test(path) ? 'FIELD ' : /id=in\./.test(path) ? 'Linked story ' : 'thin ';
    return Array.from({ length: n }, (_, i) => ({ id: label.replace(/\W+/g, '') + i, title: label + (/FIELD/.test(path) ? (i < 5 ? 'shows its glasses ' + i : 'and a field day ' + i) : i), url: 'https://lake.example/' + label.replace(/\W+/g, '') + i, summary: 'summary ' + i, source_name: 'outlet' + (i % 3), source_tier: 3, published_at: ago(i + 1), captured_at: ago(i + 1), image: null }));
  }
  const tab = /^space_reads/.test(path) ? T.space : /^door_reads/.test(path) ? T.door : null;
  if (tab && /on_conflict/.test(path)) return copy(opts.body.map(r => { const prev = tab.find(x => x.frame_key === r.frame_key && x.night === r.night); if (prev) { Object.assign(prev, copy(r)); return prev; } const row = Object.assign({ id: uuid() }, copy(r)); tab.push(row); return row; }));
  if (tab && m === 'PATCH') { const id = path.match(/id=eq\.([^&]+)/)[1]; const row = tab.find(r => r.id === id); if (row) Object.assign(row, copy(opts.body)); T.patches.push({ tab: path.split('?')[0], id, body: copy(opts.body) }); return null; }
  if (tab) return mini(tab, path);
  return [];
}
const doorSrc = between(w, 'const DOOR = { WANT: 30', 'async function excavateFeed(env, origin) {');
const keepSrc = between(w, '// PURE: what a subject keeps:', '/* The voices alone');
const prelude = "const doorVoices = async () => []; const DOOR_VOICES = { KEEP: 6, PASS_MS: 120000, FRESH_D: 90 }; const doorVoicePick = q => (q || []).slice(0, 6); const ledgerPut = async () => 0; const ledgerDoorRows = () => []; const peopleLedger = async () => 0;\n";
const PROPOSED_TWO = [{ cluster_id: 'th1', title: 'Texture-first shelves', subtitle: 'Who wins the curl aisle?', query: 'curl hair care shelf', lens: 'market', evidence: { recent_7d: 9 } }, { cluster_id: 'th2', title: 'Quiet theme', subtitle: '', lens: 'culture', evidence: { recent_7d: 1 } }];
let PROPOSED = PROPOSED_TWO;
const INJ = {
  EXC_HEADLINE_LAW: 'HEADLINE LAW', EXC_LENS_LAW: 'LENS LAW', feedCacheKey: () => 'prop', feedWarm: async () => ({ proposed: PROPOSED }),
  loadTracks: async () => [{ id: 'tr1', name: 'Nike', aliases: ['NKE'], sector: 'Athletic footwear' }, { id: 'tr-jb', name: 'Jordan Brand', aliases: ['Air Jordan'], sector: 'Athletic footwear' }], FEED: { TRACKS_KEY: 'tracks:stats' }, sbRest: sb,
  ilikeOr: names => 'or=(' + names.map(n => 'title.ilike.*' + n + '*').join(',') + ')', excStampTiers: () => null, excRelevance: (items) => ({ kept: items, dropped: [] }), excReadPages: async () => ({ read: 0 }), excBudget: items => ({ merged: items.slice(0, 44), open: items, server: [], lake: [] }),
  excKey: c => c.url || c.title, excWhen: c => c && c.published_at ? new Date(c.published_at) : null, excLine: (c, i) => '[' + (i + 1) + '] ' + c.title, excFrameBlock: () => 'FRAME\n', excMeasureLine: () => 'MEASURES\n', excFrameClean: f => f,
  excFrameFor: async (env, q) => ({ category: /Nike|Jordan/.test(q) ? 'Athletic footwear' : 'Hair care', entity: /Nike/.test(q) ? 'Nike' : /Jordan/.test(q) ? 'Jordan Brand' : /Acme/i.test(q) ? 'Acme Corporation' : /FIELD/.test(q) ? 'FIELD' : null, audience: 'Gen Z', market: 'US', competitors: ['x'], question: 'q?', anchors: ['a'], exclude: [], queries: {} }),
  excMeasures: async (env, f) => { T.measured.push(f && f.entity); return f && f.entity ? { series: [1, 2, 3], recent_7d: 9, prior_7d: 3, outlets: 4, weeks_touched: 5, weeks: 12, velocity_pct: 200, share_pct: 30, territory: 'fashion-beauty', state: 'ACCELERATING', newest: '2026-10-02', entity_id: 'ent-' + String(f.entity).toLowerCase().replace(/\W+/g, '-'), sweep: false } : null; },
  excTiersLoad: async () => ({}), excTier: c => (c && c.tier != null ? c.tier : 3), excBand: () => 'RECENT', excGround: () => ({ numbers: 0, ungrounded: [] }), excEarned: () => 'Medium', excClip: (x, n) => String(x).slice(0, n), excShort: x => x, excWindow: () => ({}),
  excReadOf: t => { const j = JSON.parse(t); return { read: j, how: 'whole' }; }, excFrameLabel: f => f.entity ? f.entity + ' in ' + String(f.category || '').toLowerCase() : (f.title || f.category || 'Frame'),
  claudeBatchSubmit: async (env, tier, kind, items) => { T.batch.push({ tier, kind, items: copy(items) }); return { ok: true, batch_id: 'b' + T.batch.length, est_usd: 0.05 * items.length }; }, claudeSpent: async () => 0, claudeCap: () => 10, EXC_MODEL: { TIER: 'live', OVERNIGHT_SHARE: 0.6 },
  EXC_VOICE_SYS: 'VOICE', EXC_MOVE_LAW: 'MOVE', EXC_TIME_LAW: 'TIME', EXC_NUMBER_LAW: 'NUMBER', RAIL_FNS: { gdelt: async () => [] }, RAIL_BY_ID: { gdelt: { id: 'gdelt', kind: 'news' } }, excRailQuery: (r, q) => q,
  excQuiet: (where, v) => () => v, logEvent: async () => 0, excavateAuth: async () => ({}), json: (o, st) => Object.assign({ status: st || 200 }, o), CLAUDE: { TIERS: { live: { model: 'claude-sonnet-5' } } },
  entityMap: async () => ({ acme: { id: 'e-acme', name: 'Acme', resolved_from: null } }),
  roomList: async () => ({ rooms: [{ id: 'e-mielle', name: 'Mielle', category: 'Hair care', counts: { captures_7d: 5 } }, { id: 'e-pattern', name: 'Pattern Beauty', category: 'hair care', counts: { captures_7d: 3 } }] }),
  excMeasureFrom: rows => ({ weeks: 12, series: [], recent_7d: rows.length, prior_7d: 0, velocity_pct: null, outlets: 1, weeks_touched: 1, territory: null, state: 'STEADY', n: rows.length }), excTerritoryOf: () => null, sweepOnly: async () => '',
  entityRows: async (env, id) => [{ id: 's-' + id }, { id: 's-shared' }], entityStateGet: async () => ({ backfill: null }), entityCoverage: () => ({ measured_from: '2026-08-08', coverage_weeks: 12 }), EXC_MEASURE: { WEEKS: 12 },
  callerIsAdmin: async (env, uid) => uid === ADMIN, authenticate: async req => req.user || null, esc: s => String(s == null ? '' : s), EXC_BLIND: 'BLIND',
  sendEmail: async (env, msg) => { T.mail.push(msg); return { ok: true }; }
};
const D = new Function(...Object.keys(INJ), prelude + keepSrc + doorSrc + '\n' + blockSrc + '; return { doorCandidates, doorPass, doorLand, doorFail, doorReadRoute, pushNightly, spacesPool, spacesSeed, spacesDesk, spaceRoute, spaceGrantRoute, DOOR };')(...Object.values(INJ));
const env = { RATE_LIMIT: { get: async k => (T.kv[k] == null ? null : T.kv[k]), put: async (k, v) => { T.kv[k] = v; }, delete: async k => { delete T.kv[k]; } }, APP_URL: 'https://x.test' };
const landed = JSON.stringify({ read: ['The lead line, plain.', 'The dek.'], insights: [{ category: 'market', title: 'A finding', excerpt: 'Story 0 says so.', evidence: [1] }, { category: 'consumer', title: 'A second finding', fact: 'Story 1 says so.', read: 'Buyers choose the second.', evidence: [2] }], ideas: [{ type: 'Channel', for: 'retail', headline: 'The move', body: 'b', because: 'c', proof: 'p', evidence: [1], from: 0 }], brief: 'Where it is.' });
const ups = tab => T.paths.filter(p => p.startsWith('POST ' + tab + '?on_conflict')).length;

// G1: no table yet: the night is the board alone, exactly as before
fresh(); T.failSpaces = true;
const legacy = await hush(() => D.doorPass(env));
ok(legacy.candidates === 4 && legacy.queued === 3 && legacy.thin === 1 && !legacy.spaces && ups('door_reads') === 1 && ups('space_reads') === 0 && T.touches.length === 0 && T.batch.length === 1 && T.batch[0].items.every(i => !('held_by' in i.meta)) && T.door.length === 4,
  'G1 before 0061 runs the night is the board alone, as today: four candidates, three queued, one thin, one upsert, no space touched');
const legacyKeys = T.door.map(r => r.frame_key).join();

// G2: the seed, twice
fresh();
const seed1 = await hush(() => D.spacesSeed(env, { hand: [{ name: 'Jordan Brand' }, { name: 'FIELD', names: ['FIELD', 'smart glasses'], context: ['glasses', 'wearable'] }], categories: ['Hair care'] }));
const s1 = copy(T.spaces);
const seed2 = await hush(() => D.spacesSeed(env, { hand: [{ name: 'Jordan Brand' }, { name: 'FIELD', names: ['FIELD', 'smart glasses'], context: ['glasses', 'wearable'] }], categories: ['Hair care'] }));
const k = (s, key, hb) => s.find(x => x.key === key && x.held_by === hb);
ok(seed1.ok && seed1.board === 4 && seed1.hand.length === 3 && seed1.hand[0].key === 'track:tr-jb' && /its track/.test(seed1.hand[0].reads) && seed1.hand[1].key === 'brand:field' && /no measure until the graph has its entity/.test(seed1.hand[1].reads) && seed1.hand[2].key === 'cat:hair-care' && seed1.categories === 1,
  'G2 the seed: the board\'s four as the house\'s spaces, Jordan Brand by its track, FIELD by its names and context (no entity), the category by its name; each says what the engine reads for it');
ok(k(s1, 'track:tr-jb', 'house').pinned && k(s1, 'track:tr-jb', 'house').entity_id === 'ent-jb' && k(s1, 'brand:field', 'house').pinned && k(s1, 'brand:field', 'house').entity_id === null && k(s1, 'track:tr1', 'house') && !k(s1, 'track:tr1', 'house').pinned && k(s1, 'track:tr1', U1) && k(s1, 'brand:acme', U1).entity_id === 'e-acme' && k(s1, 'brand:field', U1) && k(s1, 'cat:hair-care', U1) && !s1.some(s => s.held_by === U2 || s.held_by === U3) && !s1.some(s => /gen-z/.test(s.key)) && seed1.seats.holders === 1 && seed1.seats.audiences_left_as_filters === 1,
  'G3 the hand spaces are pinned (Jordan Brand\'s on its track, with the entity the graph has); a paying seat\'s brands and categories are its spaces; a paused group\'s seat and a member plan hold nothing; an audience stays a filter');
ok(seed2.ok && T.spaces.length === s1.length && JSON.stringify(T.spaces.map(s => [s.key, s.held_by, s.pinned, s.status, s.entity_id]).sort()) === JSON.stringify(s1.map(s => [s.key, s.held_by, s.pinned, s.status, s.entity_id]).sort()) && seed2.now.house_hand === 3 && seed2.now.house_board === 3,
  'G4 the seed twice makes nothing new: the same rows touched, the same state');

// G3: the first night on the spaces
T.batch = []; T.paths = []; T.touches = [];
const out = await hush(() => D.doorPass(env));
const pubKeys = T.door.map(r => r.frame_key), privKeys = T.space.map(r => r.frame_key);
ok(out.candidates === 7 && T.door.slice(0, 4).map(r => r.frame_key).join() === legacyKeys.split(',').filter(x => pubKeys.includes(x)).join() && legacyKeys === 'theme:th2,theme:th1,track:tr1,track:tr-jb' && out.spaces.considered === 7,
  'G5 the first night\'s pool is the board\'s four as doorCandidates ranks them, then the hand spaces (FIELD, the category), then the seat\'s own (Acme): seven considered');
ok(pubKeys.sort().join() === 'brand:field,cat:hair-care,theme:th1,theme:th2,track:tr-jb,track:tr1' && privKeys.join() === 'brand:acme' && ups('door_reads') === 1 && ups('space_reads') === 1,
  'G6 every space the house holds is written to the record; the one only the seat holds is written to space_reads alone');
const items = T.batch[0].items, acmeRow = T.space[0];
ok(T.batch.length === 1 && items.length === 6 && items.filter(i => i.meta.held_by === U1).length === 1 && items.find(i => i.meta.held_by === U1).meta.door_id === acmeRow.id && out.held === 1 && out.charged === 1 && out.earned === 6 && !JSON.stringify(out).includes(U1),
  'G7 one batch: the seat\'s private compile is charged to it on the ledger (meta.held_by); the house\'s five compile under its own cap; the pass\'s record counts the seats charged, never names them');
ok(T.patches.filter(p => p.tab === 'space_reads').map(p => p.id).join() === acmeRow.id && T.patches.filter(p => p.tab === 'door_reads').length === 5 && acmeRow.status === 'compiling' && acmeRow.meta.space.private === true && !('holders' in acmeRow.meta.space) && T.door.every(r => !r.meta.space || (r.meta.space.private === false && !('holders' in r.meta.space) && !JSON.stringify(r.meta).includes(U1))),
  'G8 the batch\'s patch goes where the row lives; no row on the record names who holds it');
ok(!T.measured.includes('FIELD') && T.measured.includes('Acme') && T.door.find(r => r.frame_key === 'brand:field').measures && !T.door.find(r => r.frame_key === 'brand:field').measures.recent_7d && T.door.find(r => r.frame_key === 'brand:field').frame.entity == null && T.door.find(r => r.frame_key === 'cat:hair-care').measures.set.join() === 'Mielle,Pattern Beauty' && T.door.find(r => r.frame_key === 'cat:hair-care').measures.recent_7d === 3,
  'G9 a bare name is never measured and never named an entity; a brand on the graph is measured as its entity; a category on its set, a story linked twice counted once');
const fieldEv = T.door.find(r => r.frame_key === 'brand:field').evidence;
ok(fieldEv.length === 5 && fieldEv.every(e => /glasses/.test(e.title)) && T.paths.some(p => /signals\?status=neq\.rejected&or=\(title\.ilike\.\*FIELD\*,title\.ilike\.\*smart glasses\*\)[^ ]*limit=120&/.test(p)) && T.paths.some(p => /^GET signal_entities\?entity_id=in\.\(e-mielle,e-pattern\)/.test(p)) && T.paths.some(p => /^GET signal_entities\?entity_id=in\.\(e-acme\)/.test(p)),
  'G10 a bare name\'s evidence is its names on the lake, read wider and kept only with a context word; a space on the graph reads its links');
const st = s => k(T.spaces, s[0], s[1]);
ok(st(['brand:acme', U1]).considered_nights === 1 && st(['brand:acme', U1]).last_compiled_at === today && st(['brand:acme', U1]).last_read_id === acmeRow.id && st(['brand:acme', U1]).cadence === 'nightly' && st(['theme:th2', 'house']).unmoved_nights === 1 && st(['theme:th2', 'house']).last_considered === today && st(['track:tr1', U1]).last_compiled_at === today && st(['track:tr1', 'house']).entity_id === 'ent-nike' && T.touches.length === 1,
  'G11 each space\'s night is on its row in one write: considered, compiled, its last read, its movement; the thin one counted unmoved; a tracked brand gains the entity its measure found');

// G4: the landings
const idOf = key => (T.door.find(r => r.frame_key === key) || T.space.find(r => r.frame_key === key)).id;
const claimsPosts = () => T.paths.filter(p => p.startsWith('POST claims?')).length;
await hush(async () => { await D.doorLand(env, idOf('theme:th1'), landed, 0.02, 'end_turn'); await D.doorLand(env, idOf('track:tr1'), landed, 0.02, 'end_turn'); });
const claimsDoor = claimsPosts();
await hush(() => D.doorLand(env, acmeRow.id, landed, 0.02, 'end_turn'));
const board = JSON.parse(T.kv['door:v2'] || '{"tiles":[]}');
ok(T.space[0].status === 'ready' && T.space[0].read && claimsDoor === 2 && claimsPosts() === claimsDoor && board.tiles.length === 2 && !board.tiles.some(t => t.key === 'brand:acme') && T.door.find(r => r.frame_key === 'theme:th1').status === 'ready',
  'G12 a private reading lands in space_reads: ready, with no claims and no place on the board; the house\'s readings land as before');
await hush(() => D.doorFail(env, acmeRow.id, 'test_fail'));
ok(T.patches.slice(-2).map(p => p.tab).join() === 'door_reads,space_reads' && T.space[0].status === 'failed', 'G13 a failed private compile is marked where it lives');
T.space[0].status = 'ready'; T.space[0].error = null;

// G5: who may open it
const rq = (url, user, body) => ({ url, user, json: async () => body || {} });
const asU1 = await hush(() => D.doorReadRoute(rq('https://x.test/excavate/door/read?id=' + acmeRow.id, { id: U1 }), env, ''));
const asU9 = await hush(() => D.doorReadRoute(rq('https://x.test/excavate/door/read?id=' + acmeRow.id, { id: U9 }), env, ''));
const asAdmin = await hush(() => D.doorReadRoute(rq('https://x.test/excavate/door/read?id=' + acmeRow.id, { id: ADMIN }), env, ''));
ok(asU1.ok && asU1.data && asU1.data.overnight.night === today && asU9.ok === false && asU9.error === 'not_ready' && asAdmin.ok, 'G14 the read route opens a private reading for its holder and an admin; anyone else is told not_ready, as for an id it does not know');
const acmeSpace = k(T.spaces, 'brand:acme', U1);
const g8 = await hush(() => D.spaceGrantRoute(rq('https://x.test/excavate/space-grant', { id: U8 }, { space_id: acmeSpace.id, user_id: U9 }), env, '', { id: U8 }));
const g1 = await hush(() => D.spaceGrantRoute(rq('https://x.test/excavate/space-grant', { id: U1 }, { space_id: acmeSpace.id, user_id: U9 }), env, '', { id: U1 }));
const after9 = await hush(() => D.doorReadRoute(rq('https://x.test/excavate/door/read?id=' + acmeRow.id, { id: U9 }), env, ''));
const view9 = await hush(() => D.spaceRoute(rq('https://x.test/excavate/space?key=brand%3Aacme', { id: U9 }), env, '', { id: U9 }));
const view8 = await hush(() => D.spaceRoute(rq('https://x.test/excavate/space?key=brand%3Aacme', { id: U8 }), env, '', { id: U8 }));
ok(g8.ok === false && g8.status === 403 && g8.error === 'not_yours' && g1.ok && T.grants.length === 1 && after9.ok && view9.ok && view9.readings.length === 1 && view9.readings[0].private === true && !JSON.stringify(view9).includes(U1) && view8.ok === false && view8.status === 403,
  'G15 a holder grants a reader a view; the reader opens the reading and the space (never seeing who holds it); a stranger can neither grant nor view');
const rv = await hush(() => D.spaceGrantRoute(rq('https://x.test/excavate/space-grant', { id: ADMIN }, { space_id: acmeSpace.id, user_id: U9, revoke: true }), env, '', { id: ADMIN }));
const gone9 = await hush(() => D.doorReadRoute(rq('https://x.test/excavate/door/read?id=' + acmeRow.id, { id: U9 }), env, ''));
const mine1 = await hush(() => D.spaceRoute(rq('https://x.test/excavate/space', { id: U1 }), env, '', { id: U1 }));
const house1 = await hush(() => D.spaceRoute(rq('https://x.test/excavate/space?key=track%3Atr1', { id: U8 }), env, '', { id: U8 }));
ok(rv.ok && rv.granted === false && T.grants.length === 0 && gone9.ok === false && mine1.ok && mine1.held.length === 4 && mine1.held.every(s => !('held_by' in s)) && house1.ok && house1.space.house && house1.readings.every(t => t.private === false),
  'G16 an admin takes the view back; a seat lists its own spaces; a house space opens for anyone signed in with the record\'s readings only');

// G6: the push
T.mail = [];
await hush(() => D.pushNightly(env));
const m1 = T.mail.find(x => x.to === 'u1@x.test'), m5 = T.mail.find(x => x.to === 'u5@x.test');
ok(m1 && /your space moved: Acme, 9 stories this week/.test(m1.html) && /your space moved: Nike/.test(m1.html) && /\bcategory\b/.test(m1.html) && m5 && /\bbrand\b/.test(m5.html) && !/Acme|your space moved/.test(m5.html) && !T.mail.some(x => x.to === 'u2@x.test' || x.to === 'u3@x.test'),
  'G17 a holder hears that its spaces moved, its private reading among them; a reader keeps today\'s push and never sees another\'s private reading');

// G7: a second pass the same night: kept, nothing counted twice, nothing spent
const before = copy(T.spaces), batches = T.batch.length;
const out2 = await hush(() => D.doorPass(env));
ok(out2.kept >= 5 && T.batch.length === batches && k(T.spaces, 'brand:acme', U1).considered_nights === 1 && k(T.spaces, 'theme:th2', 'house').unmoved_nights === 1 && k(T.spaces, 'theme:th2', 'house').considered_nights === before.find(s => s.key === 'theme:th2' && s.held_by === 'house').considered_nights,
  'G18 a second pass the same night keeps what it read, spends nothing and counts no night twice');

// G8: the pool alone: due, the pull, sleep
fresh();
const yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10), wkAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10), sixAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
const row = (o) => Object.assign({ id: uuid(), kind: 'brand', name: o.key, entity_id: null, track_id: null, category: null, frame: {}, holder_kind: o.held_by === 'house' ? 'house' : 'seat', pinned: false, cadence: 'nightly', considered_nights: 3, unmoved_nights: 0, last_considered: yday, last_compiled_at: null, last_read_id: null, movement: null, seen_on: null, status: 'active', since: '2026-10-01' }, o);
T.profiles[0].tracked_brands = ['Acme', 'Slowco', 'Pullco', 'Stillco']; T.profiles[0].follows = [];
T.spaces = [row({ key: 'brand:acme', held_by: U1, entity_id: 'e-acme', cadence: 'every_3', movement: { recent_7d: 9 } }), row({ key: 'brand:slowco', held_by: U1, cadence: 'every_2', last_considered: yday }), row({ key: 'brand:pullco', held_by: U1, entity_id: 'e-pull', cadence: 'weekly', movement: { recent_7d: 4 } }), row({ key: 'brand:stillco', held_by: U1, entity_id: 'e-still', cadence: 'weekly', movement: { recent_7d: 4 } }),
  row({ key: 'theme:gone', held_by: 'house', kind: 'theme', seen_on: wkAgo }), row({ key: 'theme:recent', held_by: 'house', kind: 'theme', seen_on: sixAgo }), row({ key: 'brand:hand', held_by: 'house', pinned: true, seen_on: null, frame: { names: ['Handco'] } })];
T.rollup = [{ entity_id: 'e-acme', n7: 10 }, { entity_id: 'e-pull', n7: 7 }, { entity_id: 'e-still', n7: 6 }];
const BOARD = [{ key: 'theme:th1', kind: 'theme', id: 'th1', title: 'Texture-first shelves', subtitle: '', query: 'curl', lens: 'market', velocity: 9 }];
const pool = await hush(() => D.spacesPool(env, BOARD, today));
const keys = pool.pool.map(c => c.key), touch = pool.touch;
ok(pool.ok && keys.join() === 'theme:th1,brand:hand,brand:pullco' && pool.pulled === 1 && pool.held === 1 && pool.hand === 1 && JSON.stringify((({ space, form, ...c }) => c)(pool.pool[0])) === JSON.stringify(BOARD[0]),
  'G19 the board comes first unchanged; the hand space every night; a seat\'s space not due waits (Acme moved one story, Slowco is a night early) unless its week moved by three since it was last considered (Pullco: pulled)');
ok(touch.some(r => r.key === 'theme:gone' && r.status === 'dormant') && !touch.some(r => r.key === 'theme:recent' && r.status === 'dormant') && !touch.some(r => r.key === 'brand:hand' && r.status === 'dormant') && touch.some(r => r.key === 'theme:th1' && r.seen_on === today && r.status === 'active'),
  'G20 a board space unseen for seven nights sleeps (six is not seven; a hand space never does); tonight\'s board is seen tonight');
T.profiles[0].tracked_brands = ['Acme']; T.spaces.forEach(s => { if (s.held_by === U1) s.last_considered = null; });
const p2 = await hush(() => D.spacesPool(env, BOARD, today));
ok(p2.touch.some(r => r.key === 'brand:slowco' && r.held_by === U1 && r.status === 'dormant') && p2.pool.some(c => c.key === 'brand:acme') && !p2.pool.some(c => c.key === 'brand:slowco'), 'G21 a space the seat no longer holds sleeps; its record stays');
T.failSeats = true;
const p3 = await hush(() => D.spacesPool(env, BOARD, today));
ok(p3.ok && !p3.touch.some(r => r.held_by === U1) && !p3.pool.some(c => c.key === 'brand:acme'), 'G22 when the seats do not answer, nothing of theirs is put to sleep, and nothing of theirs is read on a guess');
T.failSeats = false; T.groups[0].status = 'paused';
const p4 = await hush(() => D.spacesPool(env, BOARD, today));
ok(p4.touch.some(r => r.key === 'brand:acme' && r.held_by === U1 && r.status === 'dormant') && !p4.pool.some(c => c.key === 'brand:acme'), 'G23 a seat whose group stops paying holds nothing: its spaces sleep');

// G9: today's thirty, at full size
fresh(); T.seats = [];
PROPOSED = Array.from({ length: 40 }, (_, i) => ({ cluster_id: 'c' + i, title: 'Theme ' + i, subtitle: 'Sub ' + i, query: 'query ' + i, lens: 'culture', evidence: { recent_7d: 100 - i, territories: [] } }));
const thirty = await hush(() => D.doorCandidates(env));
T.spaces = [row({ key: 'brand:hand2', held_by: 'house', pinned: true, frame: { names: ['Handco Two'] } })];
const net30 = await hush(() => D.spacesPool(env, thirty, today));
PROPOSED = PROPOSED_TWO;
ok(thirty.length === 30 && thirty[29].key === 'theme:c29' && net30.ok && net30.pool.length === 31 && net30.pool.slice(0, 30).every((c, i) => JSON.stringify((({ space, form, ...x }) => x)(c)) === JSON.stringify(thirty[i]) && c.form === 'board' && c.space.house && !c.space.private) && net30.pool[30].key === 'brand:hand2' && net30.made === 30 && net30.touch.filter(r => r.seen_on === today).length === 30,
  'G24 the first night\'s pool is today\'s thirty, in today\'s order, each the very candidate doorCandidates made (now knowing its house space); the hand spaces come after; the thirty become the house\'s spaces, seen tonight');

// G10: a bare name the graph resolves later
fresh(); T.seats = [];
T.spaces = [row({ key: 'brand:acme', held_by: 'house', pinned: true, name: 'ACME', last_considered: null })];
const res = await hush(() => D.spacesPool(env, BOARD, today));
const acmeC = res.pool.find(c => c.key === 'brand:acme');
ok(res.resolved === 1 && res.touch.some(r => r.key === 'brand:acme' && r.held_by === 'house' && r.entity_id === 'e-acme') && acmeC && acmeC.form === 'entity' && acmeC.entity_ids.join() === 'e-acme',
  'G25 a bare name the graph has since resolved is read on its links from that night, its entity filled while empty');

// ── H: the wiring ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const dp = between(w, 'async function doorPass(env, opts) {', 'async function doorLand(');
ok(/  const board = await doorCandidates\(env\);\n  const net = typeof spacesPool === 'function' \? await spacesPool\(env, board, night\)\.catch\(excQuiet\('spaces_pool', null\)\) : null;/.test(dp) && /  const cands = net && net\.ok \? net\.pool : board;/.test(dp) && /return themes\.concat\(tr\)\.sort\(\(a, b\) => \(b\.velocity - a\.velocity\) \|\| \(a\.kind === b\.kind \? 0 : a\.kind === 'theme' \? -1 : 1\)\)\.slice\(0, DOOR\.WANT\);/.test(w),
  'H1 doorPass reads the board through the spaces; doorCandidates ranks the board as before (the feed\'s themes and the tracks by this week\'s signals, thirty)');
const stampFn = between(w, 'function doorStamp(merged) {', '\n}\n'), lawFn = between(w, 'function doorMoveSize(prev, since, measures) {', '\n}\n');
ok(stampFn.includes("return 'v' + DOOR.VOICE + '~' + keys.join('|') + '#' + (newest ? newest.toISOString().slice(0, 10) : 'undated');") && lawFn.includes('const earned = d >= DOOR_LAW.MIN_DELTA || v >= DOOR_LAW.MIN_VEL || o >= DOOR_LAW.MIN_OUTLETS;') && lawFn.includes('return earned ? d * 10 + v + o * 5 : 0;') && !stampFn.includes('SPACES') && !lawFn.includes('SPACES') && /const DOOR_LAW = \{ CAP: 6, MIN_DELTA: 3, MIN_VEL: 40, MIN_OUTLETS: 2, WATCH_MIN_D: 14, WATCH_MAX_D: 45, BAR_OUTLETS: 2, PEOPLE: 8 \};/.test(w) && /EVERY_D: 1,/.test(w),
  'H2 the stamp rule and the earned law are untouched; the house\'s cap is six; the board is nightly (IQ2 adds the evidence bar and the people\'s lines to the law\'s constants)');
ok(/  \} else \{\n  for \(const j of jobs\.slice\(DOOR_LAW\.CAP\)\) \{/.test(dp) && /typeof spacesCap === 'function' && jobs\.some\(j => \{ const s = spaceBy\.get\(j\.base\.frame_key\); return !!\(s && s\.holders && s\.holders\.length\); \}\)/.test(dp) && /if \(cand\.form && cand\.form !== 'board' && typeof spaceFrame === 'function'\) spaceFrame\(cand, frame\);/.test(dp) && /cand\.form && cand\.form !== 'board' && typeof spaceMeasures === 'function' \? await spaceMeasures\(env, cand, frame\) : frame \? await excMeasures\(env, frame\) : null;/.test(dp),
  'H3 with no seat holder the house\'s cap runs byte for byte; a board subject\'s frame and measure are the compiler\'s and the graph\'s as before');
ok(/if \(!row\) return typeof spaceLand === 'function' \? spaceLand\(env, id, text, cost, stopReason\) : \{ skipped: 'no_row' \};/.test(w) && /if \(typeof spaceFail === 'function'\) await spaceFail\(env, id, error\);/.test(w) && /const r = rows\[0\] \|\| \(typeof spaceReadFor === 'function' \? await spaceReadFor\(env, id, user\) : null\);/.test(w) && /: cand\.form && cand\.form !== 'board' && cand\.form !== 'track' && typeof spaceEvidenceRows === 'function' \? await spaceEvidenceRows\(env, cand, since, sel\)/.test(w),
  'H4 doorLand, doorFail, the read route and doorEvidence hand a space\'s row to its own code, behind a typeof guard');
const router = between(w, "      if (!user) return json({ ok: false, error: 'unauthorized' }, 401, origin, env);", '      const _aiPath = ');
ok(/if \(path === '\/excavate\/space' && request\.method === 'GET'\) return spaceRoute\(request, env, origin, user\);/.test(router) && /if \(path === '\/excavate\/space-grant' && request\.method === 'POST'\) return spaceGrantRoute\(request, env, origin, user\);/.test(router) && /which === 'spaces_seed' \? await spacesSeed\(env, body\) : which === 'spaces' \? await spacesDesk\(env\) : /.test(w) && !/'spaces_seed'|'spaces'/.test(between(w, 'const DESK_ROLES = {', '\n')),
  'H5 the routes are signed in and outside the daily AI allowance (no model is asked); the seed and the state are the desk\'s, admin only');
const pub = ['async function doorPublish(env) {', 'async function doorRecord(env) {', 'async function roomOf(env, e) {', 'async function excHouseLines(env, frame) {', 'async function insightSharePage(path, env, embed) {', 'async function doorCalled(env) {', 'async function crossCurrentsPass(env, opts) {'].filter(a => w.includes(a)).map(a => between(w, a, '\n}\n'));
const allowed = [['/* ═══ SEAM:SPACES (NT1 THE SPACES)', '/* ═══ SEAM:ENTITY_ROOM (RM1): the rooms on the graph.'], ['async function doorPass(env, opts) {', 'async function doorLand('], ['async function doorLand(', 'async function doorFail('], ['async function backupNightly(env) {', '\n}\n']].map(([a, b]) => { const i = w.indexOf(a); return [i, w.indexOf(b, i + 1)]; });
const hits = [...w.matchAll(/space_reads/g)].map(m => m.index);
ok(pub.length >= 6 && pub.every(s => !s.includes('space_reads') && !s.includes('spaceReadFor')) && hits.length > 10 && hits.every(h => allowed.some(([i, j]) => h > i && h < j)),
  'H6 nothing public reads space_reads: the board, the record, the rooms, the house lines, the permalink and the grades never see a private reading (only the spaces\' own code, doorPass, a comment in doorLand and the backup name it)');
ok(/\['spaces', 'spaces\?select=\*&order=key\.asc,held_by\.asc'\]/.test(w) && /\['space_reads', 'space_reads\?night=gte\.' \+ since/.test(w), 'H7 the backup carries the net\'s rows and the seats\' private readings');
const SPM = /env\.AI\.run\(|env\.AI\.toMarkdown\(|callModel\(|callClaude\(|claudeBatchSubmit\(|queue\.fal\.run|api\.perplexity\.ai|api\.exa\.ai|api\.tavily\.com|CLAUDE\.API \+/;
ok(!SPM.test(blockSrc) && !/[—–]/.test(blockSrc) && !/\\u2014/.test(blockSrc) && !/catch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(blockSrc) && !/\.catch\(\(\) => (?:\{\}|null|undefined|\[\]|''|false)\)/.test(blockSrc),
  'H8 the block spends nothing (no model, no paid rail), carries no dash and swallows no error');
ok(seams.registry['SEAM:SPACES'] && seams.registry['SEAM:SPACES'].file === 'worker/src/index.js' && /NT1/.test(seams.registry['SEAM:SPACES'].purpose), 'H9 SEAM:SPACES is registered');
console.log('\nproof_spaces: ' + pass + ' checks PASS');
