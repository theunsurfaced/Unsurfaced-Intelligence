/**
 * proof_morning_shelf.mjs  --  RD1d THE MORNING SHELF (SEAM:MORNING_SHELF, SEAM:MORNING_SHELF@read).
 * The nights room carries the morning's facts: per night the pass's record, the frame calls inside the pass's window judged by
 * the night's clock, and the spend (rows plus frames); per deployment the cost, the voice notes, the claims' confidence, what it
 * develops, the measure's movement, the hold's reason, the house's notes and the subject's room. One night opens alone as the
 * morning read, held and failed first. A house note is pinned on a door row through one admin door, idempotent, no model.
 * Run from the repo root: node worker/proofs/proof_morning_shelf.mjs
 */
import fs from 'node:fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const house = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
function ok(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok ' + m); }
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };

// ── A: the block, sliced pure, with the helpers the slice lacks handed in as fakes ───────────────────────────────────
const src = between(w, 'const HOUSE = {', 'async function readRoute(');
function mk(fakes) {
  const f = fakes || {};
  return new Function('sbRest', 'excQuiet', 'json', 'entityMap', 'watchDoorLine', 'doorEvery', 'DOOR', 'logEvent',
    src + '; return { HOUSE, MORNING, houseNightRows, houseNights, houseRoute, housePct, houseNightPass, houseNightFrames, houseClaimsMix, houseMorningOrder, houseNoteAdd, houseMorningNight, houseNoteRoute };')(
    f.sbRest || (async () => []), f.excQuiet || ((name, dflt) => () => dflt), f.json || ((o, st) => ({ body: o, status: st })), f.entityMap, f.watchDoorLine, f.doorEvery, f.DOOR, f.logEvent);
}
const H = mk({});
const DASH = String.fromCharCode(0x2014);
ok(src.indexOf(DASH) < 0 && src.indexOf('\\u2014') < 0, 'A1 neither the em dash nor its escape is in the block (the note law reads the code point)');
ok(H.housePct([5, 1, 9, 3], 50) === 3 && H.housePct([5, 1, 9, 3], 95) === 9 && H.housePct([], 95) === null && H.housePct(['x', 4], 95) === 4, 'A2 a percentile by rank; empty is null; junk is skipped');
const passes = [
  { created_at: '2026-10-30T06:12:40Z', meta: { earned: 6, cap: 6, queued: 6, kept: 2, reused: 18, unmoved: 1, thin: 3, waiting: 0, failed: 0, usd: 0.42, skipped: false } },
  { created_at: '2026-10-30T03:35:10Z', meta: { earned: 28, queued: 28, kept: 0, reused: 0, thin: 0, failed: 0, usd: 0.51 } },
  { created_at: '2026-10-29T06:11:00Z', meta: { error: 'door_pass_error: frame_slow' } },
  { created_at: '2026-10-28T06:10:30Z', meta: { skipped: true } }];
const p30 = H.houseNightPass(passes, '2026-10-30');
ok(p30 && p30.at === '2026-10-30T06:12:40Z' && p30.runs === 2 && p30.earned === 6 && p30.queued === 6 && p30.kept === 2 && p30.reused === 18 && p30.thin === 3 && p30.usd_est === 0.42 && p30.skipped === false && p30.error === null,
  'A3 the pass of a night is the latest door_pass written on that date, with how many times it ran');
ok(H.houseNightPass(passes, '2026-10-29').error === 'door_pass_error: frame_slow' && H.houseNightPass(passes, '2026-10-28').skipped === true && H.houseNightPass(passes, '2026-10-27') === null, 'A4 a pass that stopped early says so; a skipped night says so; a night with no pass has none');
const ledger = [
  { status: 'done', cost_usd: 0.002, created_at: '2026-10-30T06:05:00Z', ms: '4100' },
  { status: 'done', cost_usd: 0.002, created_at: '2026-10-30T06:06:00Z', ms: 9800 },
  { status: 'done', cost_usd: 0.002, created_at: '2026-10-30T06:07:00Z', ms: 31000 },
  { status: 'failed', cost_usd: 0, created_at: '2026-10-30T06:08:00Z', ms: 25000 },
  { status: 'done', cost_usd: 0.002, created_at: '2026-10-30T05:40:00Z', ms: 3000 },
  { status: 'done', cost_usd: 0.002, created_at: '2026-10-30T06:20:00Z', ms: 3000 }];
const fr = H.houseNightFrames(ledger, '2026-10-30T06:12:40Z', 25000);
ok(fr && fr.asked === 4 && fr.answered === 2 && fr.slow === 1 && fr.failed === 1 && fr.p95_ms === 31000 && fr.cost_usd === 0.006, 'A5 the frames of a pass are the ledger rows inside its window: answered inside the clock, slow past it, failed never; the p95 and the cost ride');
ok(H.houseNightFrames(ledger, null, 25000) === null && H.houseNightFrames([], '2026-10-30T06:12:40Z', 25000).asked === 0, 'A6 no pass, no frames; a pass with no calls says zero');
ok(JSON.stringify(H.houseClaimsMix([{ confidence: 'High' }, { confidence: 'Low' }, { confidence: 'High' }, { confidence: 'odd' }, null])) === '{"High":2,"Medium":0,"Low":1}', 'A7 the claims\' confidence mix counts the three bands and nothing else');
const ordered = H.houseMorningOrder([{ status: 'reused', entity: 'Zara' }, { status: 'ready', entity: 'Costco' }, { status: 'failed', held: true, entity: 'Target' }, { status: 'failed', entity: 'Apple' }, { status: 'ready', entity: 'Adidas' }, { status: 'queued', entity: 'Nike' }]);
ok(ordered.map(r => r.entity).join(',') === 'Target,Apple,Adidas,Costco,Zara,Nike', 'A8 the morning\'s order: held, then failed, then the deployments, then the reused, each by subject');
let r = H.houseNoteAdd([], 'Publish the Costco reading first', 'fresco', '2026-10-30T13:00:00Z');
ok(r.added && r.note.n === 1 && r.note.by === 'fresco' && r.note.scope === '' && r.note.status === 'open' && r.notes.length === 1, 'A9 a note is pinned in the desk\'s shape: n, by, at, scope, text, status open');
const again = H.houseNoteAdd(r.notes, '  Publish the Costco   reading first ', 'someone', '2026-10-30T14:00:00Z');
ok(!again.added && again.note === r.note && again.notes.length === 1 && again.error === null, 'A10 the same open text twice is one note: a second pin adds nothing');
const r2 = H.houseNoteAdd(r.notes.concat([{ n: 7, text: 'old', status: 'applied' }]), 'Pull the Apple row', 'fresco', '2026-10-30T14:00:00Z');
ok(r2.added && r2.note.n === 8 && r2.notes.length === 3, 'A11 the next note counts past every note on the row, applied ones too');
ok(H.houseNoteAdd([], 'ok', 'x', 'y').error === 'note_too_short' && H.houseNoteAdd([], 'A note ' + DASH + ' with a dash', 'x', 'y').error === 'em_dash', 'A12 a note under three characters and a note with an em dash are refused');
const many = []; for (let i = 0; i < 30; i++) many.push({ n: i + 1, text: 'note ' + i, status: 'open' });
ok(H.houseNoteAdd(many, 'the last one', 'x', 'y').notes.length === H.MORNING.NOTES_MAX, 'A13 a row keeps at most NOTES_MAX notes');
const rows = [
  { id: 'a1', frame_key: 'k1', night: '2026-10-30', status: 'ready', frame: { entity: 'Costco', category: 'retail' }, measures: { recent_7d: 40, outlets: 12, measured_from: '2026-08-06', coverage_weeks: 12 }, cost_usd: 0.0212,
    meta: { called: { verdict: 'held', by: '2026-10-28' }, prev_night: '2026-10-27', since: { recent_delta: 5, outlets_delta: -1 }, notes: [{ n: 1, text: 'Lead with the shelf', status: 'open' }, { n: 2, text: 'done', status: 'applied' }] }, voice: ['voice:long_sentence:brief:31', 'voice:semicolon_chain:read[0]'] },
  { id: 'a2', frame_key: 'k2', night: '2026-10-30', status: 'reused', frame: { entity: 'Apple' }, measures: {}, meta: { prev_night: '2026-10-29' }, cost_usd: 0, read: { voice: ['voice:edge_template:f0'] } },
  { id: 'a3', frame_key: 'k3', night: '2026-10-30', status: 'failed', error: 'measure_claim: read[0]: signals fell', frame: { entity: 'Target' }, measures: { recent_7d: 2 }, meta: {}, cost_usd: 0.01 },
  { id: 'a4', frame_key: 'k4', night: '2026-10-30', status: 'failed', error: 'thin_evidence', frame: { category: 'beauty' }, measures: {}, meta: {}, cost_usd: null },
  { id: 'a5', frame_key: 'k5', night: '2026-10-29', status: 'ready', frame: { entity: 'Nike' }, measures: {}, meta: { developed_night: '2026-10-30' }, cost_usd: 0.03 }];
const ents = { costco: { id: '11111111-1111-4111-8111-111111111111', name: 'Costco' }, nike: { id: '22222222-2222-4222-8222-222222222222', name: 'Nike' } };
const nights = H.houseNightRows(rows, [{ insight_id: 'a1', mark: 'useful' }], [{ reading_id: 'a1', confidence: 'High' }, { reading_id: 'a1', confidence: 'Low' }, { reading_id: 'a3', confidence: 'Medium' }], ents);
const x1 = nights[0].rows.find(q => q.id === 'a1'), x2 = nights[0].rows.find(q => q.id === 'a2'), x3 = nights[0].rows.find(q => q.id === 'a3'), x4 = nights[0].rows.find(q => q.id === 'a4'), x5 = nights[1].rows[0];
ok(x1.cost_usd === 0.0212 && x1.voice === 2 && x1.claims === 2 && x1.claims_mix.High === 1 && x1.claims_mix.Low === 1 && x1.develops === '2026-10-27' && x1.since.recent_delta === 5 && x1.since.outlets_delta === -1 && x1.notes.open === 1 && x1.notes.last === 'Lead with the shelf' && x1.entity_id === ents.costco.id && x1.thin === false,
  'A14 a row carries its cost, its voice notes, its claims\' mix, what it develops, the measure\'s movement, its open notes and the room behind it');
ok(x2.voice === 1 && x2.develops === '2026-10-29' && x2.entity_id === null && x2.since === null && x2.notes.open === 0 && x2.notes.last === null, 'A15 the voice is read from the stored read when the alias is absent; a name the graph lacks has no room');
ok(x3.held === true && x3.thin === false && x3.claims_mix.Medium === 1 && x4.thin === true && x4.status === 'failed' && x4.held === false && x4.entity_id === null, 'A16 a held row and a thin row keep their reasons apart');
ok(x5.developed_by === '2026-10-30' && x5.entity_id === ents.nike.id && x5.cost_usd === 0.03, 'A17 a row that was developed says by which night');
const mn = H.houseMorningNight(nights[0], passes, ledger, 25000);
ok(mn.pass && mn.pass.at === '2026-10-30T06:12:40Z' && mn.frames.asked === 4 && mn.spend_usd === Math.round((nights[0].cost_usd + 0.006) * 1e4) / 1e4 && mn.rows[0].id === 'a3' && mn.rows[1].id === 'a4' && mn.rows[2].id === 'a1' && mn.rows[3].id === 'a2',
  'A18 the night\'s head carries the pass, the frames and the spend as rows plus frames; the rows come in the morning\'s order');
const quiet = H.houseMorningNight({ night: '2026-10-27', counts: {}, cost_usd: 0.03, rows: [] }, passes, ledger, 25000), erred = H.houseMorningNight(nights[1], passes, ledger, 25000);
ok(quiet.pass === null && quiet.frames === null && quiet.spend_usd === 0.03 && erred.pass && erred.pass.error === 'door_pass_error: frame_slow' && erred.frames.asked === 0, 'A19 a night with no pass on record has no frames and spends only its rows; a night whose pass stopped early says so and counts no frames');

// ── B: the list against a fake database ──────────────────────────────────────────────────────────────────
const qs = [];
const fakeDb = async (env, path, opts) => {
  qs.push([path, opts || null]);
  if (/^door_reads\?/.test(path)) return rows;
  if (/^insight_marks\?/.test(path)) return [{ insight_id: 'a1', mark: 'useful' }];
  if (/^claims\?/.test(path)) return [{ reading_id: 'a1', confidence: 'High' }];
  if (/^claude_jobs\?/.test(path)) return ledger;
  if (/^activity_events\?/.test(path)) return passes;
  return [];
};
const F = mk({ sbRest: fakeDb, entityMap: async () => ents, watchDoorLine: (every, last, today, skipped) => ({ every, last_compiled: last, gap_nights: 1, skipped: !!skipped, trip: null }), doorEvery: () => 1, DOOR: { FRAME_MS: 25000 } });
const nn = await F.houseNights({}, 7);
ok(qs[0][0].startsWith('door_reads?night=gte.') && /select=id,frame_key,night,status,error,frame,measures,meta,cost_usd,voice:read->voice&order=night\.desc,id\.asc/.test(qs[0][0]) && !/read,/.test(qs[0][0].replace('frame_key,', '')),
  'B1 the rows are read with the voice notes and never the read itself');
ok(qs.some(q => /^claims\?src=eq\.door&reading_id=in\.\(a1,a2,a3,a4,a5\)&select=reading_id,confidence$/.test(q[0])), 'B2 the claims are read with their confidence');
ok(qs.some(q => /^claude_jobs\?kind=eq\.excavate_frame&created_at=gte\.\d{4}-\d{2}-\d{2}T00:00:00Z&select=status,cost_usd,created_at,ms:meta->>ms&order=created_at\.desc&limit=3000$/.test(q[0])) && qs.some(q => /^activity_events\?event=eq\.door_pass&created_at=gte\.\d{4}-\d{2}-\d{2}T00:00:00Z&select=created_at,meta&order=created_at\.desc&limit=120$/.test(q[0])),
  'B3 the frame ledger and the pass records are read once for the window');
ok(nn.windows.join(',') === '7,14,30,60' && nn.night === null && nn.nights.length === 2 && nn.nights[0].pass && nn.nights[0].frames && nn.nights[0].spend_usd > nn.nights[0].cost_usd && nn.nights[0].rows.find(q => q.id === 'a1').entity_id === ents.costco.id && nn.nights[0].rows[0].id === 'a3',
  'B4 the answer carries the windows, the nights with pass, frames and spend, and the rooms behind the subjects');
ok(nn.cadence && nn.cadence.every === 1 && nn.cadence.last_compiled === '2026-10-30' && nn.cadence.gap_nights === 1 && nn.cadence.skipped === false, 'B5 the cadence rides the answer from the last compiled night and the last pass');
qs.length = 0;
const one = await F.houseNights({}, 14, '2026-10-30');
ok(qs[0][0].startsWith('door_reads?night=eq.2026-10-30&') && one.night === '2026-10-30' && one.since === '2026-10-30' && qs.some(q => /created_at=gte\.2026-10-30T00:00:00Z/.test(q[0])),
  'B6 one night opens alone: its rows, its ledger window and its pass from that date');
ok((await F.houseNights({}, 14, 'not-a-date')).night === null, 'B7 a malformed night falls back to the window');
const bare = await mk({ sbRest: fakeDb }).houseNights({}, 7);
ok(bare.cadence === null && bare.nights[0].rows.every(q => q.entity_id === null) && bare.nights[0].pass && bare.nights[0].frames, 'B8 without the graph and the watch the shelf still answers: no room ids, no cadence, the pass and the frames stand');
qs.length = 0;
const routed = [];
const R = mk({ sbRest: fakeDb, json: (o, st) => { routed.push([o, st]); return o; } });
await R.houseRoute('/reads/nights', { night: '2026-10-30' }, {}, '', {});
ok(routed[0][0].ok === true && routed[0][0].night === '2026-10-30' && qs[0][0].startsWith('door_reads?night=eq.2026-10-30'), 'B9 the route hands the night to the list');

// ── C: the note door against a fake database ───────────────────────────────────────────────────────────────
const writes = [], events = [];
const noteDb = async (env, path, opts) => {
  if (opts && opts.method === 'PATCH') { writes.push([path, opts.body]); return []; }
  if (/^door_reads\?id=eq\.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/.test(path)) return [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', night: '2026-10-30', meta: { called: { verdict: 'held' }, notes: [{ n: 1, text: 'Lead with the shelf', status: 'open', by: 'fresco', at: 'x' }, { n: 2, text: 'done', status: 'applied' }] } }];
  return [];
};
const N = mk({ sbRest: noteDb, json: (o, st) => o, logEvent: (env, pf, sp, ev, sid, meta) => { events.push([pf, sp, ev, meta]); } });
const u = { email: 'fresco@unsurfaced.example', id: 'u1' };
ok((await N.houseNoteRoute({ id: 'nope', text: 'x' }, {}, '', u)).error === 'bad_id' && (await N.houseNoteRoute({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', text: 'Hello there' }, {}, '', u)).error === 'not_found', 'C1 a bad id and a row that is not there are refused');
const added = await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', text: 'Publish the Costco reading first' }, {}, '', u);
ok(added.ok && added.added && added.note.n === 3 && added.note.by === 'fresco' && added.open === 2 && writes.length === 1 && writes[0][0] === 'door_reads?id=eq.aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' && writes[0][1].meta.called.verdict === 'held' && writes[0][1].meta.notes.length === 3 && events[0][2] === 'night_note' && events[0][3].n === 3,
  'C2 a note is pinned on the row\'s meta beside what the row already carried, and the event says so');
const same = await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', text: 'Lead with the shelf' }, {}, '', u);
ok(same.ok && !same.added && same.note.n === 1 && writes.length === 1, 'C3 pinning an open note again writes nothing');
const dropped = await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', drop: true, n: 1 }, {}, '', u);
ok(dropped.ok && dropped.open === 0 && writes.length === 2 && writes[1][1].meta.notes.length === 1 && writes[1][1].meta.notes[0].n === 2, 'C4 an open note can be taken back; the applied one stays');
ok((await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', drop: true, n: 2 }, {}, '', u)).error === 'already_applied' && (await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', drop: true, n: 9 }, {}, '', u)).error === 'no_such_note', 'C5 an applied note and a note that is not there are not dropped');
ok((await N.houseNoteRoute({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', text: 'A note ' + DASH + ' dashed' }, {}, '', u)).error === 'em_dash', 'C6 the house voice has no em dash, in a note either');

// ── D: the wiring ─────────────────────────────────────────────────────────────────────────────────────────
ok(/if \(path === '\/reads\/night-note'\) return houseNoteRoute\(body, env, origin, user\);/.test(w) && w.indexOf("if (path === '/reads/night-note')") > w.indexOf("if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);\n  body = body || {};\n  if (path === '/reads/assets'"),
  'D1 the note door is admin only, behind readRoute\'s check');
ok(/case '\/reads\/night-note':\s*\/\/ SEAM:MORNING_SHELF[^\n]*\n\s+case '\/reads\/assets':/.test(w), 'D2 the router carries the note door beside the house\'s lists');
ok(/await houseNights\(env, body && body\.nights, body && body\.night\)/.test(w), 'D3 the nights route passes a night through');
ok(!/function houseNightRows\(rows, marks, claims\) \{/.test(w) && /function houseNightRows\(rows, marks, claims, ents\)/.test(w), 'D4 the rows take the graph\'s names');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8'), spenders = between(gate, 'SPENDERS = {', '\n}');
ok(!/houseNoteRoute|houseNights|houseMorningNight/.test(spenders) && !/callClaude|callModel|env\.AI\.run|fal\.run|queue\.fal\.run/.test(src.slice(src.indexOf('const MORNING = {'))), 'D5 nothing in this cut spends: no model, no paid rail; the registry has no new name');

// ── E: the page ────────────────────────────────────────────────────────────────────────────────────────
const pg = between(house, '  /* THE NIGHTS, the morning shelf (SEAM:MORNING_SHELF, RD1d)', '  /* THE ASSETS: every rights record');
ok(pg.indexOf(DASH) < 0, 'E1 no em dash in the page block');
ok(/if \(Q\.get\("night"\)\) return nightMorning\(Q\.get\("night"\)\);/.test(pg) && /call\("\/reads\/nights", \{ night: date \}\)/.test(pg) && /call\("\/reads\/nights", \{ nights: N \}\)/.test(pg), 'E2 a night opens alone by ?night=; the shelf reads a window');
ok(/var NIGHTS_WINDOWS = \[7, 14, 30, 60\];/.test(pg) && /href="\.\/\?room=nights&nights=' \+ n \+ '"/.test(pg) && /href="\.\/\?room=nights&night=' \+ esc\(g\.night\) \+ '"/.test(pg), 'E3 the window is chosen on the page; every night links to its own morning');
ok(/\["held", "Held and failed"\], \["ready", "Deployed"\], \["reused", "Reused"\]/.test(pg) && /data-nf="' \+ x\[0\] \+ '"/.test(pg) && /id="night-who"/.test(pg) && /function nightRowShown\(r\)/.test(pg) && /if \(f === "held" && !\(r\.held \|\| r\.status === "failed"\)\) return false;/.test(pg), 'E4 filters by status (held and failed together, deployed, reused) and by subject');
ok(/<th>Subject<\/th><th>Status<\/th><th>7 days<\/th><th>Outlets<\/th><th>Counted<\/th><th>Grade<\/th><th>Marks<\/th><th>Claims<\/th><th>Voice<\/th><th>Cost<\/th><th>Notes<\/th><th><\/th>/.test(pg) && /class="hs-scroll"/.test(pg) && /hs-scan/.test(pg),
  'E5 the scan carries the morning\'s columns in a scroll box');
ok(/href="\.\.\/#room=' \+ esc\(r\.entity_id\) \+ '"/.test(pg) && /href="\.\.\/\?insight=' \+ esc\(r\.id\) \+ '"/.test(pg), 'E6 a subject opens its room; a deployment opens on the record');
ok(/call\("\/reads\/night-note", \{ id: id, text: text \}\)/.test(pg) && /class="hs-notebtn"/.test(pg) && /maxlength="600"/.test(pg), 'E7 a note is pinned from the row through the note door');
ok(/the measure, said: /.test(pg) && /thin evidence/.test(pg) && /hs-reason/.test(pg) && /The pass: /.test(pg) && /frames asked · /.test(pg) && /answered in the clock/.test(pg), 'E8 the hold\'s reason, the thin row, the pass and the frames are said in words');
ok(/\.hs-pass \{/.test(house) && /\.hs-filters a\.on, \.hs-filters button\.on/.test(house) && /table\.hs-scan \{ min-width: 1040px; \}/.test(house) && /\.hs-noteform:empty \{ display: none; \}/.test(house), 'E9 the shelf\'s styles are on the page');
ok(/sub: "The morning shelf: what the door deployed, night by night/.test(house), 'E10 the room says what it is');
ok(!/function nightsRoom\(\) \{\n    houseShell\("nights", '<div class="hs-note">Reading the nights\.<\/div>'\);\n    call\("\/reads\/nights", \{ nights: 14 \}\)/.test(house), 'E11 the old room is gone');

// ── F: the seams ───────────────────────────────────────────────────────────────────────────────────────
ok(seams.registry['SEAM:MORNING_SHELF'] && seams.registry['SEAM:MORNING_SHELF'].file === 'worker/src/index.js' && seams.registry['SEAM:MORNING_SHELF@read'] && seams.registry['SEAM:MORNING_SHELF@read'].tag === 'SEAM:MORNING_SHELF', 'F1 the seam is registered on the worker and the page');

console.log(`\nproof_morning_shelf: ${pass} checks passed`);
