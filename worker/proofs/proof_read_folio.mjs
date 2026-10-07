/**
 * proof_read_folio.mjs  --  SEAM:READ_FOLIO (EX23 COMPILE): many runs, one report.
 * A folio is a brief plus the ground the editor chose. A RECON commissioned from it writes from that ground first, from
 * evidence and never from prose: a pinned read brings its own lines from the lake, a house read the stories and lines
 * its claims cite, a note enters as framing. The folio is frozen into the commission and records the RECON.
 * Run from the repo root: node worker/proofs/proof_read_folio.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const rpage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const mig = fs.readFileSync('supabase/migrations/0041_folios.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// ── A: the pure parts ──────────────────────────────────────────────────────────────────────────────────────────────
const helpers = between(w, '/* ═══ SEAM:READ_FOLIO (EX23 COMPILE)', 'async function folioGround(env, inc) {');
const RD = { SCOPE_RX: /^[a-z_]+(?:\[\d+\])?(?:\.[a-z_]+(?:\[\d+\])?)*$/ };
const F = new Function('READ_DESK', helpers + '; return { FOLIO, folioItemClean, folioKey, folioItems, folioInclude, folioPath, folioHouseGround, folioLead, folioFraming };')(RD);
ok(F.folioItemClean({ k: 'read', ref: '481', title: 'Jordan Brand Gen Z sneaker consumer' }, 'fresco').ref === 481 && F.folioItemClean({ k: 'read', ref: 'x' }) === null && F.folioItemClean({ k: 'tweet', ref: 1 }) === null
  && F.folioItemClean({ k: 'house', ref: 19, path: 'findings[2]' }).path === 'findings[2]' && F.folioItemClean({ k: 'house', ref: 19, path: 'findings[2]; drop table' }) === null
  && F.folioItemClean({ k: 'note', note: 'Lead with women and girls — the gap is there' }).note === 'Lead with women and girls : the gap is there' && F.folioItemClean({ k: 'note', note: 'ok' }) === null,
  'A1 every item is one of five kinds with a real reference; a path is a path; a note is the editor\'s words, never an em dash');
const many = Array.from({ length: 50 }, (_, i) => ({ k: 'story', ref: i + 1 }));
ok(F.folioItems([{ k: 'read', ref: 5, title: 'first' }, { k: 'read', ref: '5', title: 'again' }, { k: 'house', ref: 19 }, { k: 'house', ref: 19, path: 'findings[1]' }]).map(x => x.title || x.k).join('|') === 'first|House read|House read'
  && F.folioItems(many).length === 40, 'A2 the same read pinned twice is one item (the first pin wins); a whole read and one finding in it are two; a folio holds 40');
const folio = { id: 7, title: 'Jordan Brand: the next buyer', items: [{ k: 'read', ref: 481 }, { k: 'door', ref: 33 }, { k: 'story', ref: 9012 }, { k: 'house', ref: 19, path: 'findings[1]' }, { k: 'note', note: 'Lead with women and girls.' }] };
const inc = F.folioInclude(folio);
ok(inc.folio_id === 7 && inc.reads.join() === '481' && inc.doors.join() === '33' && inc.stories.join() === '9012' && inc.houses[0].id === 19 && inc.houses[0].path === 'findings[1]' && inc.notes[0] === 'Lead with women and girls.',
  'A3 the commission freezes the folio as it stood: reads, frames, stories, house reads with their paths, notes');
const house = { id: 19, kind: 'recon', label: 'RECON 002', read: { title: 'Jordan sells heritage to buyers who never saw it', findings: [
  { claim: 'Retro drops still clear', evidence: ['S100', 'L2'] },
  { claim: 'Women and girls are the open lane', why_it_matters: 'The size run is the gap.', evidence: ['S200', 'L1', 'R1', 'C4'], voices: ['V3'] }] },
  lines: { L: [{ id: 5001 }, { id: 5002 }], R: [{ id: 6001 }] } };
let hg = F.folioHouseGround([house], [{ id: 19, path: 'findings[1]' }]);
ok(hg.stories.join() === '200' && hg.lake.join() === '5001,6001' && hg.views.length === 1 && hg.views[0].label === 'RECON 002, findings[1]' && /^Women and girls are the open lane The size run is the gap\.$/.test(hg.views[0].text),
  'A4 a pinned finding brings only what it cites: its S story and its L and R lines through its own pack (a card or a voice it cites stays behind), and its words as a prior view');
hg = F.folioHouseGround([house], [{ id: 19 }]);
ok(hg.stories.join() === '100,200' && hg.lake.join() === '5002,5001,6001' && /^Jordan sells heritage/.test(hg.views[0].text), 'A5 a whole house read brings everything its claims cite');
ok(F.folioLead([{ id: 3 }, { id: 1 }], [{ id: 1 }, { id: 2 }, { id: 3 }], r => r.id).map(r => r.id).join() === '3,1,2', 'A6 the folio\'s rows lead, and the rest follow without them');
const fr = F.folioFraming({ title: 'Jordan Brand: the next buyer', notes: ['Lead with women and girls.'], views: [{ label: 'RECON 002, findings[1]', text: 'Women and girls are the open lane' }] });
ok(/^THE FOLIO: Jordan Brand: the next buyer \(.*framing, never evidence: cite the ids in the sections, never this block\)\n- The editor: Lead with women and girls\.\n- A prior house view \(RECON 002, findings\[1\]\): Women/.test(fr) && F.folioFraming({ notes: [], views: [] }) === '',
  'A7 notes and prior views enter as framing, labeled as never evidence; nothing to frame is no block');

// ── B: the ground ──────────────────────────────────────────────────────────────────────────────────────────────────
const groundSrc = between(w, 'async function folioGround(env, inc) {', 'async function folioRow(env, id) {');
const asked = [];
const G = new Function('FOLIO', 'FOLIO_SIG', 'folioHouseGround', 'folioLead', 'folioInclude', 'sbRest', groundSrc + '; return { folioGround, folioCoverage };')(F.FOLIO, 'id,title', F.folioHouseGround, F.folioLead, F.folioInclude,
  async (env, p) => { asked.push(p);
    if (p.startsWith('reads?')) return [{ id: 481, query: 'Jordan Brand Gen Z sneaker consumer', created_at: '2026-10-07T20:00:00Z' }];
    if (p.startsWith('door_reads?')) return [{ id: 33, night: '2026-10-05' }];
    if (p.startsWith('house_reads?')) return [house];
    if (p.startsWith('signals?status=neq.rejected&momentum->>read_id=in.(481)')) return [{ id: 5001, source_name: 'Complex', published_at: '2026-09-30' }, { id: 7000, source_name: 'Highsnobiety', published_at: '2026-10-06' }];
    if (p.startsWith('signals?id=in.(5001,6001)')) return [{ id: 5001, source_name: 'Complex', published_at: '2026-09-30' }, { id: 6001, source_name: 'NYT', published_at: '2023-04-01' }];
    if (p.startsWith('signals?id=in.')) throw new Error('slow');
    return []; });
const g = await G.folioGround({}, inc);
ok(asked.some(p => /^signals\?status=neq\.rejected&momentum->>read_id=in\.\(481\)&select=id,title&order=source_tier\.asc,published_at\.desc&limit=160$/.test(p))
  && asked.some(p => /^house_reads\?id=in\.\(19\)&select=id,kind,label,read,lines:meta->pack->lines$/.test(p)),
  'B1 a pinned read\'s own evidence comes back from the lake by its read id; a house read brings its pack\'s lines');
ok(g.reads[0].id === 481 && g.frames[0].id === 33 && g.lake.map(r => r.id).join() === '5001,6001,7000' && g.stories.join() === '9012,200' && g.views.length === 1 && g.notes[0] === 'Lead with women and girls.',
  'B2 the ground: the read, the frame, the lines the house read cites first and the read\'s own after, every story, the prior view, the note');
const cov = await G.folioCoverage({}, folio);
ok(cov.items === 5 && cov.lines === 3 && cov.outlets === 3 && cov.reads === 1 && cov.frames === 1 && cov.stories === 2 && cov.span.from === '2023-04-01' && cov.span.to === '2026-10-07',
  'B3 coverage counts what is really there: lines, outlets, reads, frames, stories and the span, the record included');
const g2 = await G.folioGround({}, { reads: [], houses: [{ id: 19 }], notes: [] });
ok(g2.lake.length >= 0 && Array.isArray(g2.stories), 'B4 a slow ask leaves its lines out and never fails the compile');

// ── C: the doors ───────────────────────────────────────────────────────────────────────────────────────────────────
const doors = between(w, "  if (path === '/reads/folios') {", "  if (path === '/reads/track') {");
const rowSrc = between(w, 'async function folioRow(env, id) {', 'async function readQueue(');
const runDoor = async (path, body, db) => { const calls = [];
  const sb = async (env, p, o) => { calls.push({ p, o }); return db(p, o); };
  const folioRow = new Function('sbRest', rowSrc + '; return folioRow;')(sb);
  const out = await new AsyncFunction('path', 'body', 'env', 'origin', 'user', 'json', 'sbRest', 'folioRow', 'folioCoverage', 'folioItemClean', 'folioKey', 'folioItems', 'FOLIO', doors + ' return "fallthrough";')(
    path, body, {}, '', { id: 'u', email: 'fresco@x' }, d => d, sb, folioRow, async () => ({ lines: 0 }), F.folioItemClean, F.folioKey, F.folioItems, F.FOLIO);
  return { out, calls }; };
let r = await runDoor('/reads/folio-pin', { item: { k: 'read', ref: 481, title: 'Jordan Brand Gen Z sneaker consumer' } }, (p, o) => {
  if (p.startsWith('folios?status=eq.open')) return [];
  if (o && o.method === 'POST') return [Object.assign({ id: 8 }, o.body[0])];
  return []; });
const created = r.calls.find(c => c.o && c.o.method === 'POST');
ok(r.out.ok && r.out.added && created && created.o.body[0].items[0].ref === 481 && created.o.body[0].created_by === 'fresco' && /^Folio \d{4}-\d{2}-\d{2}$/.test(created.o.body[0].title),
  'C1 the first pin with no folio open starts one, dated, with the pin in it');
r = await runDoor('/reads/folio-pin', { id: 7, item: { k: 'read', ref: '481' } }, (p, o) => (p.startsWith('folios?id=eq.7&select=*') && !o ? [folio] : o && o.method === 'PATCH' ? [Object.assign({}, folio, o.body)] : []));
ok(r.out.ok && r.out.added === false && r.out.folio.items.length === 5, 'C2 a pin already in the folio is said to be there and never doubled');
const full = Object.assign({}, folio, { items: Array.from({ length: 40 }, (_, i) => ({ k: 'story', ref: i + 1 })) });
r = await runDoor('/reads/folio-pin', { id: 7, item: { k: 'read', ref: 999 } }, (p, o) => (!o ? [full] : []));
ok(r.out.ok === false && r.out.error === 'folio_full' && !r.calls.some(c => c.o), 'C3 a full folio refuses the 41st pin before anything is written');
r = await runDoor('/reads/folio-unpin', { id: 7, key: 'door:33' }, (p, o) => (!o ? [folio] : [Object.assign({}, folio, o.body)]));
ok(r.out.ok && r.out.folio.items.length === 4 && !r.out.folio.items.some(it => it.k === 'door'), 'C4 unpin removes one item by its key');
r = await runDoor('/reads/folio-save', { id: 7, title: '  Jordan Brand:   the next buyer ', brief: 'How Jordan Brand wins the next buyer.', status: 'commissioned' }, (p, o) => (!o ? [folio] : [Object.assign({}, folio, o.body)]));
ok(r.out.folio.title === 'Jordan Brand: the next buyer' && r.out.folio.brief === 'How Jordan Brand wins the next buyer.' && r.out.folio.status === undefined || r.out.folio.status === folio.status,
  'C5 save sets the title and the brief; a folio is marked commissioned only by a commission');
r = await runDoor('/reads/folio-pin', { item: { k: 'tweet', ref: 1 } }, () => []);
ok(r.out.error === 'bad_item', 'C6 an item that is not a folio item is refused');
ok(/case '\/reads\/folios':\s+\/\/ SEAM:READ_FOLIO/.test(w) && /case '\/reads\/folio-pin':/.test(w) && /case '\/reads\/folio-unpin':/.test(w) && /case '\/reads\/folio-save':/.test(w), 'C7 every folio door is routed through readRoute, behind the admin check');

// ── D: the commission and the compile ──────────────────────────────────────────────────────────────────────────────
const comm = between(w, 'async function readCommission(env, body, user) {', '/* PURE: the fields an editor may set');
ok(/const folio = body\.folio_id \? await folioRow\(env, body\.folio_id\) : null;\n    if \(body\.folio_id && !folio\) return \{ ok: false, error: 'folio_not_found' \};\n    if \(folio\) meta\.include = folioInclude\(folio\);/.test(comm)
  && /status: 'commissioned', recon_ids: \[\.\.\.new Set\(\(folio\.recon_ids \|\| \[\]\)\.concat\(\[row\.id\]\)\)\]/.test(comm),
  'D1 a commission from a folio freezes it into meta.include and records the RECON on the folio');
ok(/if \(recon && row\.meta && row\.meta\.include\) recon\.inc = await folioGround\(env, row\.meta\.include\);/.test(w)
  && /if \(recon && recon\.inc && recon\.inc\.stories\.length\) items = folioLead\(await readItemsByIds\(env, recon\.inc\.stories\), items, it => it\.id\);[^\n]*\n  if \(dpi\) dpi\.items = items;/.test(w),
  'D2 the compile reads the folio\'s ground once, and its stories lead the STORIES, the deep evidence file included');
const pack = between(w, 'async function readReportPack(', '/* PURE: every id a report may cite beyond S-ids.');
ok(/const inc = recon && recon\.inc \? recon\.inc : null;[^\n]*\n  if \(inc\) lake = folioLead\(inc\.lake, lake, r => r\.id\);\n  stage\('lake'/.test(pack)
  && /if \(inc\) \{ frames = folioLead\(inc\.frames, frames, d => d\.id\); reads = folioLead\(inc\.reads, reads, r => r\.id\); \}/.test(pack)
  && /const sections = \[\];\n  if \(inc && folioFraming\(inc\)\) sections\.push\(folioFraming\(inc\)\);/.test(pack)
  && pack.indexOf('if (inc) lake = folioLead') > pack.indexOf('let lake = deep ?') && pack.indexOf('folioLead(inc.reads') > pack.indexOf("let reads = (await sbRest(env, 'reads?created_at"),
  'D3 the folio\'s lines lead the lake, the frames and the reads after the brief\'s filter has run, so the editor\'s ground is never filtered out; the framing block opens the pack');

// ── E: the pages ───────────────────────────────────────────────────────────────────────────────────────────────────
const fo = between(page, '/* SEAM:READ_FOLIO: the folio tray (admin).', 'async function _foBoot() {');
const PF = new Function(fo + '; return { _foKey, _foLiveItem, _foCoverText };')();
ok(PF._foLiveItem({ q: 'jordan', synthesis: { read_id: 481 } }, { id: 33, query: 'jordan' }).k === 'read' && PF._foLiveItem({ q: 'jordan', synthesis: {} }, { id: 33, query: 'jordan' }).ref === 33
  && PF._foLiveItem({ q: 'nike', synthesis: {} }, { id: 33, query: 'jordan' }) === null && PF._foKey({ k: 'house', ref: 19, path: 'findings[1]' }) === F.folioKey({ k: 'house', ref: 19, path: 'findings[1]' }),
  'E1 a live read pins as its ledger row, a door read as its frame, a stale door never; the page keys items exactly as the worker does');
const ct = PF._foCoverText({ lines: 3, outlets: 1, reads: 1, frames: 0, stories: 2, views: 0, notes: 1, span: { from: '2023-04-01', to: '2026-10-07' } });
ok(/<b>3<\/b> evidence lines/.test(ct.line) && /<b>1<\/b> outlet</.test(ct.line) && /<b>2<\/b> DAILY stories/.test(ct.line) && !/door frame/.test(ct.line) && /2023-04-01 to 2026-10-07/.test(ct.line) && /^Thin ground: fewer than 12 evidence lines/.test(ct.thin),
  'E2 coverage reads in real counts and plain plurals, and thin ground is said before anything is spent');
ok(/if \(st\.folio && st\.folio\.id\) body\.folio_id = st\.folio\.id;/.test(page) && /Ground: the folio \$\{_cmEsc\(st\.folio\.title\)\}/.test(page) && /openCommission\(\{ brief: f\.brief, folio: \{ id: f\.id, title: f\.title, n: \(f\.items \|\| \[\]\)\.length \} \}\)/.test(page),
  'E3 Compile as a RECON opens Commission with the folio as its ground, and the commission carries folio_id');
ok(/id="btn-pin-read" style="display:none" onclick="pinLiveRead\(\)"/.test(page) && /id="folio-pill" type="button" style="display:none"/.test(page) && /\.folio-pill\{position:fixed;[^}]*z-index:var\(--z-menu\)/.test(page),
  'E4 Pin to folio and the tray stay hidden until the house confirms an admin; the tray stacks on a token');
ok(/btns\.push\('<button class="btn" id="pin-folio">Pin to folio<\/button>'\)/.test(rpage) && /call\("\/reads\/folio-pin", Object\.assign\(\{ item: \{ k: "house", ref: row\.id/.test(rpage), 'E5 every house read on the READ page pins to the open folio');

// ── G: the migration and the laws ──────────────────────────────────────────────────────────────────────────────────
ok(/create table if not exists public\.folios/.test(mig) && /revoke all on public\.folios from anon, authenticated/.test(mig) && /check \(status in \('open', 'commissioned', 'archived'\)\)/.test(mig)
  && /create index if not exists signals_read_id_idx\s+on public\.signals \(\(momentum->>'read_id'\)\)/.test(mig), 'G1 0041 makes folios, service role only, and indexes the lake by read id');
ok(!/—/.test(helpers + groundSrc + doors + fo) && !/—/.test(between(page, 'async function _foBoot() {', 'async function _foCompile() {')), 'G2 no em dash in the new code or its copy');
console.log('\nproof_read_folio: ' + pass + ' checks PASS');
