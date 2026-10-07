/**
 * proof_read_commission.mjs  --  SEAM:READ_COMMISSION (EX22): the RECON generator.
 * The frame is read back before anything is spent; the editor's confirmed frame is what the RECON researches; a draft
 * compiles now and its deep version queues as the next version of the same RECON; the tracker says where each one is;
 * a RECON's own desk inputs reach every version of it. New Report stops pretending.
 * Run from the repo root: node worker/proofs/proof_read_commission.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const rpage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const H = 'a1b2c3d4e5f60718';
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;   // the route blocks await, as they do inside readRoute

// ── A: the desk, one RECON's own inputs ────────────────────────────────────────────────────────────────────────────
const deskSrc = between(w, 'function readDeskText(rows, kind, scoped) {', 'const READ_CONTRACT = {');
let asked = [];
const D = new Function('READ_DESK', 'sbRest', deskSrc + '; return { readDeskText, readDeskScope, readDeskInputs };')({ INPUTS_MAX: 4000 },
  async (env, path) => { asked.push(path); return [{ kind: 'recon:' + H, inputs: 'Lead with the women and girls finding.' }, { kind: 'recon', inputs: 'Name every outlet.' }, { kind: 'all', inputs: 'American English.' }]; });
const reconRow = { kind: 'recon', meta: { brief: { hash: H } } };
ok(D.readDeskScope(reconRow) === 'recon:' + H && D.readDeskScope({ kind: 'weekly', meta: { brief: { hash: H } } }) === null && D.readDeskScope({ kind: 'recon', meta: { brief: { hash: 'nothex!' } } }) === null,
  'A1 a RECON\'s own desk key is recon:<brief hash>; any other kind, or a malformed hash, has none');
const txt = await D.readDeskInputs({}, 'recon', reconRow);
ok(asked[0] === 'house_desk?kind=in.(recon:' + H + ',recon,all)&select=kind,inputs,updated_by,updated_at' && /^FOR THIS RECON \(every version\): Lead with the women/.test(txt) && txt.indexOf('Name every outlet') > txt.indexOf('women') && txt.indexOf('American English') > txt.indexOf('outlet'),
  'A2 a RECON compile reads its own inputs first, then the standing RECON inputs, then the house\'s');
asked = []; await D.readDeskInputs({}, 'weekly', { kind: 'weekly', meta: {} });
ok(asked[0].startsWith('house_desk?kind=in.(weekly,all)'), 'A3 every other read asks exactly what it asked before');
ok(/const desk = await readDeskInputs\(env, row\.kind, row\);   \/\/ SEAM:READ_DESK/.test(w) && /const desk = await readDeskInputs\(env, row\.kind, readDeskScope\(row\) \? row : prior\);/.test(w)
  && /const desk = await readDeskInputs\(env, row\.kind, row\);\n    if \(!notes\.length && !desk\)/.test(w) && !/readDeskInputs\(env, row\.kind\);/.test(w),
  'A4 the compile, the revision\'s compile and the revise door all read the RECON\'s own inputs');
const deskRoute = between(w, "  if (path === '/reads/desk') {", "  if (path === '/reads/frame') {");
const runDesk = async body => { const calls = []; const out = await new AsyncFunction('path', 'body', 'env', 'origin', 'user', 'json', 'HOUSE_READ', 'READ_DESK', 'sbRest', 'logEvent', 'readDeskText',
  deskRoute + ' return null;')('/reads/desk', body, {}, '', { id: 'u', email: 'fresco@x' }, d => d, { KINDS: { recon: {}, weekly: {} } }, { INPUTS_MAX: 4000 },
  async (env, path, o) => { calls.push({ path, o }); return o ? [] : [{ kind: 'recon:' + H, inputs: 'own' }, { kind: 'recon', inputs: 'kind' }]; }, () => {}, D.readDeskText); return { out, calls }; };
let r = await runDesk({ kind: 'recon:' + H, inputs: 'Lead with the women and girls finding.' });
ok(r.calls[0].o.body[0].kind === 'recon:' + H && r.calls[1].path.startsWith('house_desk?kind=in.(recon:' + H + ',recon,all)') && r.out.ok && /^FOR THIS RECON/.test(r.out.applies),
  'A5 /reads/desk writes a RECON\'s own inputs under its key and reads them beside the standing ones');
r = await runDesk({ kind: 'recon:not-a-hash' });
ok(r.out.ok === false && r.out.error === 'bad_kind' && !r.calls.length, 'A6 a key that is not recon:<16 hex> is refused before the database is touched');

// ── B: the commission ──────────────────────────────────────────────────────────────────────────────────────────────
const cleanSrc = between(w, 'function excFrameClean(f) {', 'function excFrameWhole(f)');
const commSrc = between(w, 'async function readCommission(env, body, user) {', '/* PURE: one RECON\'s state for the tracker');
const queued = [];
const framer = { entity: 'Jordan Brand', category: 'athletic sneakers', audience: 'Gen Z and Gen Alpha sneaker buyers', market: 'US', competitors: ['New Balance', 'On'],
  question: 'What drives purchase intent?', anchors: ['jordan brand sneakers', 'retro sneaker appeal'], exclude: ['michael jordan biography', 'apparel and clothing'],
  queries: { news: 'Jordan Brand Gen Z sneaker preferences 2024', research: 'r', discourse: 'd', web: 'w' } };
const mkComm = () => new Function('READ_DEEP', 'READ_RECON', 'deepAdvance', 'excFrameFor', 'logEvent', 'readAddDays', 'readDay', 'readIso', 'readQueue', 'readReconGather', 'readReconIssue',
  'readReconLabel', 'readReportWindow', 'readSubmit', 'sha256hex', cleanSrc + commSrc + '; return { readCommission, readFrameEdits };')(
  { DECISIONS: 5, BUDGET_MIN: 10, BUDGET_MAX: 100, BUDGET_USD: 30 }, { DAYS: 90 }, async () => ({ stage: 'plan' }), async () => JSON.parse(JSON.stringify(framer)), () => {},
  (d, n) => new Date(d.getTime() + n * 864e5), s => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00Z') : null), d => d.toISOString().slice(0, 10),
  async (env, kind, win, meta) => { const row = { id: 100 + queued.length, version: queued.length + 1, meta }; queued.push({ kind, win, meta }); return { row, prev: null }; },
  async () => ({ captured: 9, failed: [] }), async () => 2, (no, f) => 'RECON 00' + no + ': ' + f.entity, (a, b) => ({ start: a, end: b }),
  async (env, row) => ({ ok: true, id: row.id, batch_id: 'msgbatch_x' }), async () => H + H);
const C = mkComm();
const edit = { entity: 'Jordan Brand', category: 'athletic sneakers', exclude: ['michael jordan biography'], anchors: [], competitors: ['New Balance', 'On', 'Hoka'],
  queries: { news: 'Jordan Brand Gen Z sneaker buyers 2026' }, evil: '<script>' };
let c = await C.readCommission({}, { brief: 'How Jordan Brand wins the next generation of sneaker buyers.', frame: edit, decisions: ['Retro or new lines for buyers under 25?'], deep: false, now: true }, { id: 'u', email: 'f@x' });
let f = queued[0].meta.brief.frame;
ok(!(c instanceof Response) && c.id === 100 && c.ok === true && c.batch_id === 'msgbatch_x' && c.recon_no === 2,
  'B1 the commission is a function that answers a plain object: the draft queued, gathered and sent to the writer');
ok(f.exclude.join() === 'michael jordan biography' && f.competitors.join() === 'New Balance,On,Hoka' && f.anchors.join() === 'jordan brand sneakers,retro sneaker appeal' && f.queries.news === 'Jordan Brand Gen Z sneaker buyers 2026'
  && f.queries.research === 'r' && !('evil' in f) && f.entity === 'Jordan Brand',
  'B2 the frame the editor confirmed is what the RECON researches: apparel back in, Hoka added, the stale year gone; an emptied anchor list and unknown fields never reach it');
ok(!queued[0].meta.deep && queued[0].meta.brief.decisions[0] === 'Retro or new lines for buyers under 25?', 'B3 a draft carries no deep plan; the client\'s decisions ride the brief');
c = await C.readCommission({}, { brief: 'How Jordan Brand wins the next generation of sneaker buyers.', budget: 45, hold: true }, { id: 'u', email: 'f@x' });
ok(queued[1].meta.deep && queued[1].meta.deep.budget_usd === 45 && queued[1].meta.deep.hold === true && queued[1].meta.deep.stage === 'plan' && c.deep.budget_usd === 45 && c.waiting === 'tick',
  'B4 a deep commission queues its plan with the ceiling and the hold, and waits for the tick');
c = await C.readCommission({}, { brief: 'too short' }, { id: 'u' });
ok(c.ok === false && c.error === 'brief_too_short', 'B5 a brief under a sentence is refused');

// ── C: the doors: frame, commission depths, tracker ────────────────────────────────────────────────────────────────
const doors = between(w, "  if (path === '/reads/frame') {", "  if (path === '/reads/release') {");
const trackSrc = between(w, '/* PURE: one RECON\'s state for the tracker', 'async function readQueue(');
const deepSpent = d => Object.values((d && d.spend) || {}).reduce((a, b) => a + b, 0);
const T = new Function('deepSpent', trackSrc + '; return readTrackRow;')(deepSpent);
const runDoor = async (path, body, rc, rows) => { const calls = [], db = [];
  const out = await new AsyncFunction('path', 'body', 'env', 'origin', 'user', 'json', 'readCommission', 'excFrameFor', 'sha256hex', 'sbRest', 'readTrackRow', doors + ' return "fallthrough";')(
    path, body, {}, '', { id: 'u' }, d => d, async (env, b) => { calls.push(b); return rc ? rc(b, calls.length) : { ok: true, id: calls.length }; }, async () => JSON.parse(JSON.stringify(framer)), async () => H + H,
    async (env, p, o) => { db.push({ p, o }); return rows || []; }, T);
  return { out, calls, db }; };
let d = await runDoor('/reads/frame', { brief: 'How Jordan Brand wins the next generation of sneaker buyers.' }, null, [{ id: 20, version: 2, status: 'queued', label: 'RECON 002', hash: H, no: '2' }, { id: 9, hash: 'ffffffffffffffff', no: '1' }]);
ok(d.out.ok && d.out.frame.entity === 'Jordan Brand' && d.out.prior.recon_no === 2 && d.out.prior.versions === 1 && d.calls.length === 0 && d.db.every(x => !x.o),
  'C1 /reads/frame reads the frame and says the brief is already RECON 002; nothing is queued and nothing is written');
d = await runDoor('/reads/frame', { brief: 'short' });
ok(d.out.ok === false && d.out.error === 'brief_too_short', 'C2 the preview refuses a brief under a sentence');
d = await runDoor('/reads/commission', { brief: 'b', depth: 'draft_deep', budget: 40 }, (b, n) => ({ ok: true, id: 18 + n, recon_no: 2 }));
ok(d.calls.length === 2 && d.calls[0].deep === false && d.calls[0].now === true && d.calls[1].deep === true && d.calls[1].now === false && d.calls[1].budget === 40
  && d.out.ok && d.out.depth === 'draft_deep' && d.out.draft.id === 19 && d.out.deep.id === 20 && d.out.recon_no === 2,
  'C3 Draft then Deep: the draft compiles now, then the deep version queues as the next version of the same RECON');
d = await runDoor('/reads/commission', { brief: 'b', depth: 'draft_deep' }, () => ({ ok: false, error: 'unframeable' }));
ok(d.calls.length === 1 && d.out.error === 'unframeable', 'C4 a draft that never queued stops the pair: no deep version is paid for on a brief the framer could not place');
d = await runDoor('/reads/commission', { brief: 'b', depth: 'draft_deep' }, (b, n) => (n === 1 ? { ok: false, error: 'thin_slice', id: 19 } : { ok: true, id: 20 }));
ok(d.calls.length === 2 && d.out.ok && d.out.draft.error === 'thin_slice', 'C5 a draft too thin to write still lets the deep version run: its research is twenty times wider');
d = await runDoor('/reads/commission', { brief: 'b', depth: 'draft' });
ok(d.calls[0].deep === false && d.calls[0].now === true && d.out.depth === 'draft', 'C6 depth draft compiles now');
d = await runDoor('/reads/commission', { brief: 'b', deep: false, now: true });
ok(d.calls[0].deep === false && d.calls[0].now === true && d.out.depth === 'draft', 'C7 the console commission from this afternoon works unchanged');
d = await runDoor('/reads/track', { ids: [19, '20', 'x', -1] }, null, [{ id: 20, kind: 'recon', version: 2, status: 'queued', label: 'RECON 002', deep: { stage: 'read', budget_usd: 30, spend: { plan: 0.4, read: 1.1 }, log: [{ stage: 'search', to: 'read', at: 't' }] }, recon_no: 2 },
  { id: 19, kind: 'recon', version: 1, status: 'compiling', batch_id: 'b', deep: null }]);
ok(/^house_reads\?id=in\.\(19,20\)&select=.*deep:meta->deep.*&limit=2$/.test(d.db[0].p) && d.out.rows[0].deep.stage === 'read' && Math.abs(d.out.rows[0].deep.spent_usd - 1.5) < 1e-9 && d.out.rows[0].deep.last.to === 'read'
  && d.out.rows[1].depth === 'draft' && d.out.rows[1].batch === true && d.out.rows[1].deep === null,
  'C8 the tracker reads only what it shows: the stage, the spend against the ceiling, the last step, whether a batch is out');
d = await runDoor('/reads/track', {});
ok(/kind=eq\.recon&select=.*&limit=8$/.test(d.db[0].p), 'C9 with no ids, the tracker shows the latest eight RECONs');
ok(/case '\/reads\/frame':\s+\/\/ SEAM:READ_COMMISSION/.test(w) && /case '\/reads\/track':\s+\/\/ SEAM:READ_COMMISSION/.test(w), 'C10 both doors are routed through readRoute, behind the admin check');

// ── E: EXCAVATE ────────────────────────────────────────────────────────────────────────────────────────────────────
const cmSrc = between(page, '/* SEAM:READ_COMMISSION: the RECON generator (admin).', '/* A live read becomes a commission');
const P = new Function('safe', 'safeAttr', 'showModal', '_authHeader', 'API_BASE', '_isAdmin', cmSrc + '; return { _cmPayload, _cmStageText, _cmState };')(x => x, x => x, () => {}, async () => ({}), '', async () => true);
const st = P._cmState({ brief: '  How Jordan Brand wins  ', frame: { entity: 'Jordan Brand', category: 'athletic sneakers', audience: 'Gen Z', market: 'US', question: 'q', competitors: ['A', 'B', 'C', 'D', 'E', 'F'], anchors: ['x'], exclude: [] },
  decisions: ['Retro or new?', 'no', '', 'Win back New Balance buyers', ''], depth: 'draft' });
let pl = P._cmPayload(st);
ok(pl.brief === 'How Jordan Brand wins' && pl.depth === 'draft' && pl.frame.competitors.length === 5 && pl.decisions.join('|') === 'Retro or new?|Win back New Balance buyers' && !('budget' in pl) && !('hold' in pl) && pl.audience === 'Gen Z',
  'E1 the form sends the confirmed frame whole, the client\'s real decisions, and no ceiling on a draft');
pl = P._cmPayload(Object.assign(st, { depth: 'draft_deep', budget: '45', hold: true }));
ok(pl.budget === 45 && pl.hold === true && pl.days === 90, 'E2 a deep commission carries its ceiling, its hold and its window');
ok(P._cmStageText({ status: 'queued', deep: { stage: 'read' } }) === 'Reading sources in full' && P._cmStageText({ status: 'queued', deep: { stage: 'hold', hold_reason: 'evidence' } }) === 'Held for your evidence review on the READ page.'
  && P._cmStageText({ status: 'compiling', deep: null }) === 'Compiling: the draft is with the writer' && P._cmStageText({ status: 'ready' }) === 'Written and ready'
  && /^Failed: thin_slice/.test(P._cmStageText({ status: 'failed', error: 'thin_slice:4+3' })) && /sell law/.test(P._cmStageText({ status: 'held', deep: null })),
  'E3 every stage reads in plain words: where it is, what holds it, what failed');
ok(/if\(type==='new-report'\) return _newReport\(\);/.test(page) && !/openModal\('new-report-legacy'\)/.test(page) && /async function _newReport\(\) \{\n  if \(await _cmAdmin\(\)\) return openCommission\(\);/.test(page),
  'E4 New Report is real: an admin commissions, a member asks the question as a live read; the old modal that announced a report and made nothing is unreachable');
ok(/window\._liveLast=\{ q, synthesis: syn\|\|null \};/.test(page) && /id="btn-make-recon" style="display:none" onclick="makeReconFromRead\(\)"/.test(page) && /b\.style\.display=a\?'':'none'/.test(page),
  'E5 Make this a RECON sits on every live read, hidden until the house confirms the reader is an admin');
ok(/onclick="openCommission\(\)">Commission a RECON<\/button><button class="cm-btn" type="button" onclick="openCommissionTrack\(\[\]\)">Track<\/button>/.test(page), 'E6 the Library\'s RECON shelf commissions and tracks');
ok(/_cmBox\(false\);if\(window\._cmPoll\)\{clearInterval\(window\._cmPoll\);window\._cmPoll=null;\}/.test(page) && /'\/reads\/frame', \{ brief \}/.test(page) && /disabled' : ''\}>\$\{st\.busy \? 'Commissioning' : 'Commission'\}/.test(page),
  'E7 the commission waits for a frame read on the current brief, and the tracker stops polling when the modal closes');

// ── F: READ, the desk ──────────────────────────────────────────────────────────────────────────────────────────────
const dsSrc = (rpage.match(/function deskScope\(row\) \{[^\n]*\}/) || [''])[0];
const deskScope = new Function(dsSrc + '; return deskScope;')();
ok(deskScope({ kind: 'recon', meta: { brief: { hash: H } } }) === 'recon:' + H && deskScope({ kind: 'report', meta: {} }) === null, 'F1 the READ page finds a RECON\'s own desk key the way the worker does');
ok(/call\("\/reads\/desk", \{ kind: deskScope\(row\) \|\| row\.kind \}\)/.test(rpage) && /This RECON · every version/.test(rpage) && /\(ownEl && scope \? call\("\/reads\/desk", \{ kind: scope, inputs: ownEl\.value \}\)/.test(rpage),
  'F2 the desk shows "This RECON, every version" and saves it under the RECON\'s own key');

// ── G: the house laws ──────────────────────────────────────────────────────────────────────────────────────────────
const fresh = commSrc + trackSrc + doors + deskSrc + cmSrc + between(page, '/* A live read becomes a commission', 'function _newReportRun()');
ok(!/—/.test(fresh) && !/—/.test(rpage.split('\n').filter(l => /SEAM:READ_COMMISSION|desk-own|This RECON/.test(l)).join('\n')), 'G1 no em dash in the new code or its copy');
ok(!/z-index:\s*\d/.test(between(page, '/* SEAM:READ_COMMISSION: the RECON generator */', '@media (max-width:720px){.cm-grid')), 'G2 the new styles use no z-index literal');
console.log('\nproof_read_commission: ' + pass + ' checks PASS');
