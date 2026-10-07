/**
 * proof_read_desk.mjs  --  EX14a THE DESK: the editors above the engine, for every kind.
 * Run from the repo root: node worker/proofs/proof_read_desk.mjs
 *   N notes   V revise   I standing inputs   T tick   M migration   P page   W wiring
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0036_recon.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
const frameClean = helper('excFrameClean', 'function excFrameWhole(');
let sb = [], fixtures = {}, submitted = [];
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'excFrameFor', 'gatherOpenSignals', 'lakeCapture', 'excTerritoryOf', 'sha256hex', 'RAILS', 'RAIL_FNS', 'excFrameLabel',
  trim + pmj + ej + frameClean + block + '; return { READ_DESK, READ_REVISION_LAW, readNotesOpen, readNotesText, readDeskText, readRoute, readTick, readItemsByIds };')(
  sbRest, async (env, tier, kind, jobs) => { submitted.push(jobs[0]); return { ok: true, batch_id: 'b9', est_usd: 1.1 }; }, async () => ({}), async (e, u) => u === 'admin' || u === 'u1' || u === 'u2', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async () => null, async () => ({ ok: true, items: [] }), async () => 0, () => null, async s => 'h', [], {}, () => '');
const quiet = () => { const o = console.log; console.log = () => {}; return () => { console.log = o; }; };

// ── N ─────────────────────────────────────────────────────────────────
ok(R.readNotesOpen({ meta: { notes: [{ n: 1, text: 'a', status: 'open' }, { n: 2, text: 'b', status: 'applied' }, { n: 3, text: 'c' }] } }).map(n => n.n).join(',') === '1,3' && R.readNotesOpen({}).length === 0,
  'N1 open notes are the ones not yet applied');
ok(R.readNotesText([{ scope: 'findings[2]', text: 'the  implication is soft', by: 'fresco' }, { scope: '', text: 'lead with the business', by: 'josh' }]) === '1. [findings[2]] the implication is soft (fresco)\n2. [whole read] lead with the business (josh)',
  'N2 notes read in the pack numbered, with their scope and their author');
let rowMeta = { plan: 'manual' }, patches = [];
fixtures = { 'house_reads?id=eq.7': (p, o) => { if (o && o.method === 'PATCH') { patches.push(o.body); rowMeta = o.body.meta; return []; } return [{ id: 7, kind: 'weekly', status: 'published', version: 2, window_start: '2026-09-21', window_end: '2026-09-27', label: 'Week of Sep 21', meta: rowMeta, read: { title: 't', thesis: 'x' }, pack_ids: [1, 2], stats: { stories: 2 } }]; } };
const n1 = await R.readRoute('/reads/note', { id: 7, text: 'Finding three: the implication is soft; the thought-starter is that glasses are a status object.', scope: 'findings[2]' }, {}, '', { id: 'u1', email: 'fresco@unsurfaced.com' });
ok(n1.ok && n1.note.n === 1 && n1.note.by === 'fresco' && n1.note.scope === 'findings[2]' && n1.note.status === 'open' && n1.open === 1 && rowMeta.notes.length === 1 && rowMeta.plan === 'manual',
  'N3 /reads/note pins a note with its author (the email\'s local part), scope and time; the rest of meta stays');
const n2 = await R.readRoute('/reads/note', { id: 7, text: 'Lead with the advertising business.' }, {}, '', { id: 'u2', email: 'josh@unsurfaced.com' });
ok(n2.ok && n2.note.n === 2 && n2.note.scope === '' && n2.open === 2, 'N4 a second note numbers up; no scope means the whole read');
ok((await R.readRoute('/reads/note', { id: 7, text: 'ok', scope: 'x' }, {}, '', { id: 'u1' })).error === 'note_too_short' && (await R.readRoute('/reads/note', { id: 7, text: 'a real note', scope: 'drop table' }, {}, '', { id: 'u1' })).error === 'bad_scope' &&
  (await R.readRoute('/reads/note', { id: 7, text: 'a real note' }, {}, '', { id: 'x' }))._status === 403, 'N5 short notes and bad scopes are refused; admin only');
const d1 = await R.readRoute('/reads/note-drop', { id: 7, n: 2 }, {}, '', { id: 'u1' });
ok(d1.ok && d1.open === 1 && rowMeta.notes.length === 1 && (await R.readRoute('/reads/note-drop', { id: 7, n: 9 }, {}, '', { id: 'u1' })).error === 'no_such_note', 'N6 an open note can be taken back');

// ── I ─────────────────────────────────────────────────────────────────
ok(R.readDeskText([{ kind: 'weekly', inputs: 'W' }, { kind: 'all', inputs: 'A' }], 'weekly') === 'W\nA' && R.readDeskText([{ kind: 'all', inputs: 'A' }], 'recon') === 'A' && R.readDeskText([], 'weekly') === '',
  'I1 standing inputs: the kind\'s own, then every read\'s');
let deskRows = [];
fixtures['house_desk?on_conflict=kind'] = (p, o) => { deskRows = deskRows.filter(r => r.kind !== o.body[0].kind).concat(o.body); return o.body; };
fixtures['house_desk?kind=in.'] = p => deskRows.filter(r => p.includes('(' + r.kind + ',') || p.includes(',' + r.kind + ')'));
const i1 = await R.readRoute('/reads/desk', { kind: 'weekly', inputs: 'The implication for the advertising business comes first — always.' }, {}, '', { id: 'u1', email: 'fresco@x' });
ok(i1.ok && i1.rows.length === 1 && i1.rows[0].updated_by === 'fresco' && !/—/.test(i1.rows[0].inputs) && i1.applies.startsWith('The implication'), 'I2 /reads/desk writes the kind\'s standing inputs (em dash becomes a colon) and reads back what applies');
ok((await R.readRoute('/reads/desk', { kind: 'all', inputs: 'Name the mechanism in every finding.' }, {}, '', { id: 'u1' })).ok && (await R.readRoute('/reads/desk', { kind: 'weekly' }, {}, '', { id: 'u1' })).applies.split('\n').length === 2 &&
  (await R.readRoute('/reads/desk', { kind: 'bogus' }, {}, '', { id: 'u1' })).error === 'bad_kind', 'I3 the all row applies to every kind; an unknown kind is refused');

// ── V ─────────────────────────────────────────────────────────────────
let queued = null; patches = []; submitted = [];
fixtures['house_reads?kind=eq.weekly&window_start=eq.2026-09-21'] = () => [{ id: 7, version: 2, status: 'published' }];
fixtures['house_reads?select=*'] = (p, o) => { queued = Object.assign({ id: 8 }, o.body[0]); return [queued]; };
fixtures['house_reads?id=eq.8'] = (p, o) => { if (o && o.method === 'PATCH') { patches.push(Object.assign({ id: 8 }, o.body)); return []; } return [queued]; };
fixtures['edition_items?id=in.'] = () => [{ id: 2, edition_id: 50, ord: 2, headline: 'Second story 462 pairs', take: 't2', apply: 'a2', territory: 'technology-innovation', source_name: 'Wired' }, { id: 1, edition_id: 50, ord: 1, headline: 'First story', take: 't1', apply: 'a1', territory: 'music', source_name: 'Billboard' }];
fixtures['editions?id=in.'] = () => [{ id: 50, issue_no: 44, date: '2026-09-23' }];
const un = quiet();
const v1 = await R.readRoute('/reads/revise', { id: 7 }, {}, '', { id: 'u1', email: 'fresco@x' });
un();
ok(v1.ok && v1.id === 8 && v1.from === 7 && v1.version === 3 && v1.notes === 1 && v1.batch_id === 'b9', 'V1 /reads/revise on a published read queues version 3 from version 2 and compiles it at once');
ok(queued.kind === 'weekly' && queued.status === 'queued' && queued.meta.plan === 'revise' && queued.meta.revised_from === 7 && queued.meta.revised_from_version === 2 && queued.meta.revised_by === 'fresco' && queued.meta.notes.length === 1 && queued.meta.notes[0].status === 'applying' && queued.label === 'Week of Sep 21',
  'V2 the new row carries the plan, what it revises, who asked, and the notes it applies; the label stays');
const priorPatch = patches.find(p => p.id === undefined) || null;
ok(rowMeta.notes[0].status === 'applied' && rowMeta.notes[0].applied_in === 8, 'V3 the prior row\'s open notes are marked applied, pointing at the revision');
const job = submitted[0];
ok(job && /^HOUSE DESK \(standing inputs from the editors; apply them to this read\):\nThe implication for the advertising business comes first : always\.\nName the mechanism in every finding\.\n\n/.test(job.prompt) &&
  /STATS \(exact, computed by the database\):\n\{"stories":2\}/.test(job.prompt) && /STORIES \(2, published by DAILY\):\nS1 \| 2026-09-23 \| #044 \| music \| First story/.test(job.prompt) && /\nS2 \| 2026-09-23 \| #044 \| technology-innovation \| Second story 462 pairs/.test(job.prompt) &&
  /PRIOR READ \(version 2, the object you are revising\):\n\{"title":"t","thesis":"x"\}/.test(job.prompt) && /DESK NOTES \(1\):\n1\. \[findings\[2\]\] Finding three: the implication is soft; the thought-starter is that glasses are a status object\. \(fresco\)/.test(job.prompt) &&
  job.prompt.includes(R.READ_REVISION_LAW) && /Write version 3 of Week of Sep 21\. Return only the JSON object\.$/.test(job.prompt) && job.custom_id === 'hr-8-v3' && job.max_tokens === 40000,
  'V4 the revision prompt: standing inputs, the prior stats, the prior stories in pack order, the prior read, the numbered notes, the revision law, the version to write; the weekly\'s room');
const cp = patches.find(p => p.status === 'compiling');
ok(cp && cp.pack_ids.join(',') === '1,2' && cp.stats.stories === 2 && cp.meta.notes[0].status === 'applied' && cp.meta.notes[0].applied_in === 8 && cp.meta.desk_chars > 0 && cp.meta.batch_id === 'b9',
  'V5 the revision compiles on the prior pack_ids and stats; its notes become its record');
ok(/Keep every section no note touches exactly as it is, word for word\./.test(R.READ_REVISION_LAW) && /write it as the house's position, as interpretation/.test(R.READ_REVISION_LAW) && /cite the evidence ids from the pack that carry it/.test(R.READ_REVISION_LAW) && !/—/.test(R.READ_REVISION_LAW),
  'V6 the revision law: untouched sections stay word for word; an editor\'s thought-starter is the house\'s position, as interpretation, with evidence');
fixtures['house_reads?id=eq.7'] = () => [{ id: 7, kind: 'weekly', status: 'compiling', version: 2, meta: {}, read: { title: 't' } }];
ok((await R.readRoute('/reads/revise', { id: 7 }, {}, '', { id: 'u1' })).error === 'still_compiling', 'V7 a compiling read cannot be revised yet');
fixtures['house_reads?id=eq.7'] = () => [{ id: 7, kind: 'weekly', status: 'held', version: 2, meta: {}, read: null }];
ok((await R.readRoute('/reads/revise', { id: 7 }, {}, '', { id: 'u1' })).error === 'not_written', 'V8 a read that was never written has nothing to revise');
deskRows = [];
fixtures['house_reads?id=eq.7'] = () => [{ id: 7, kind: 'weekly', status: 'held', version: 2, meta: {}, read: { title: 't', thesis: 'x' } }];
ok((await R.readRoute('/reads/revise', { id: 7 }, {}, '', { id: 'u1' })).error === 'nothing_to_apply', 'V9 with no notes and no standing inputs there is nothing to revise; nothing is spent');
fixtures['house_reads?id=eq.7'] = () => [{ id: 7, kind: 'weekly', status: 'held', version: 2, window_start: '2026-09-21', window_end: '2026-09-27', label: 'Week of Sep 21', meta: { notes: [{ n: 1, text: 'tighten the thesis', status: 'open', by: 'josh' }] }, read: { title: 't', thesis: 'x' }, pack_ids: [1], stats: {} }];
submitted = []; const un2 = quiet(); const v2 = await R.readRoute('/reads/revise', { id: 7 }, {}, '', { id: 'u1' }); un2();
ok(v2.ok && v2.notes === 1 && submitted.length === 1, 'V10 a held read is revised the same way: notes are a better tool than Re-land when the writing is the fault');

// ── T ─────────────────────────────────────────────────────────────────
fixtures['house_reads?status=eq.queued'] = () => [{ id: 8, kind: 'weekly', status: 'queued', version: 3, window_start: '2026-09-21', window_end: '2026-09-27', label: 'Week of Sep 21', meta: { plan: 'revise', revised_from: 7, notes: [] } }];
fixtures['house_reads?id=eq.7'] = () => [{ id: 7, kind: 'weekly', status: 'published', version: 2, meta: {}, read: { title: 't', thesis: 'x' }, pack_ids: [1, 2], stats: { stories: 2 } }];
submitted = []; const un3 = quiet(); const t1 = await R.readTick({}); un3();
ok(t1.submitted === 1 && submitted[0].custom_id === 'hr-8-v3' && /PRIOR READ \(version 2/.test(submitted[0].prompt), 'T1 the tick submits a queued revision from the prior pack, never a fresh compile');
ok(/if \(row\.meta && row\.meta\.plan === 'revise'\) \{ const rv = await readSubmitRevision\(env, row\);/.test(w), 'T2 the tick\'s revise branch runs before the gather and the submit');
const items = await R.readItemsByIds({}, [2, 1]);
ok(items.map(i => i.id).join(',') === '2,1' && items[0].date === '2026-09-23' && items[0].issue_no === 44, 'T3 readItemsByIds returns the stories in the order asked, with their dates and issues');

// ── M, W, P ───────────────────────────────────────────────────────────
ok(/create table if not exists public\.house_desk/.test(mig) && /kind\s+text primary key/.test(mig) && /revoke all on public\.house_desk from anon, authenticated/.test(mig), 'M1 0036 makes house_desk, one row per kind, service role only');
ok(/case '\/reads\/note':/.test(w) && /case '\/reads\/note-drop':/.test(w) && /case '\/reads\/revise':/.test(w) && /case '\/reads\/desk':/.test(w) && /const desk = await readDeskInputs\(env, row\.kind, row\);   \/\/ SEAM:READ_DESK/.test(w) && /desk_chars: desk\.length/.test(w),
  'W1 the four doors are dispatched; every fresh compile carries the standing inputs and records their size');
ok(/id="desk">The desk<\/button>/.test(page) && /function deskPanel\(html\)/.test(page) && /function deskShow\(row, deskRows\)/.test(page) && /call\("\/reads\/revise", \{ id: row\.id \}\)/.test(page) && /call\("\/reads\/note", \{ id: row\.id, text: t, scope: sc \}\)/.test(page) &&
  /call\("\/reads\/desk", \{ kind: "all", inputs: document\.getElementById\("desk-all"\)\.value \}\)/.test(page) && /Revised from v' \+ esc\(String\(row\.meta\.revised_from_version/.test(page) && /window\.confirm\("Revise "/.test(page),
  'P1 the page: The desk opens the panel with notes, Add a note, Revise (confirmed), standing inputs for the kind and for every read; a revision\'s bar says what it came from');

console.log('\nproof_read_desk: ' + pass + ' checks PASS');
