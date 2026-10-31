/**
 * proof_house_corpus.mjs  --  EX53b THE CORPUS TO EVERY WRITER: the house reads read the house's dated, graded claims on their
 * subject before the evidence; THE HOUSE LAW rides their systems; the landing notes a repeated or a missed claim written as new;
 * nothing invented where the house holds nothing; the EXCAVATE writer's hash unchanged.
 * Run from the repo root: node worker/proofs/proof_house_corpus.mjs
 */
import fs from 'fs';
import { writerHash } from '../../tools/bench/writer_hash.mjs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };

// ── the slice: the corpus block with the graph and the database faked ───────────────────────────────────────────────
const block = between(w, '/* ═══ SEAM:HOUSE_CORPUS (EX53b)', '/* The corpus on a frame: the claims linked');
ok(!/\u2014/.test(block), 'A0 no em dash in the block or the law');
let calls = [], corpus = {}, links = [], names = {}, catRows = [];
const map = { 'jordan brand': { id: 'e-jb', name: 'Jordan Brand' }, 'nike': { id: 'e-nk', name: 'Nike' }, 'costco': { id: 'e-co', name: 'Costco' }, 'apple': { id: 'e-ap', name: 'Apple' } };
const sbRest = async (env, path, opts) => {
  calls.push({ path, body: opts && opts.body });
  if (path === 'rpc/claim_corpus') return corpus[opts.body.p_entities[0]] || [];
  if (/^signal_entities\?signal_id=in\./.test(path)) return links;
  if (/^entities\?id=in\./.test(path)) return Object.keys(names).map(id => ({ id, name: names[id] }));
  if (/^claims\?frame->>category=ilike\./.test(path)) return catRows;
  throw new Error('unexpected path ' + path);
};
const lawSrc = between(w, 'const READ_HOUSE_LAW = ', '   // SEAM:HOUSE_CORPUS (EX53b)\n');
const H = new Function('ENTITY', 'ENTITY_MEASURE', 'entityMap', 'sbRest', 'excQuiet', lawSrc + block +
  '; return { HOUSE_CORPUS, READ_HOUSE_LAW, houseGradeWords, houseCorpusLine, houseCorpusBlock, houseCorpusTop, houseCorpusKeep, houseCorpusMeta, houseTitleWords, houseTitleSim, houseRepeatNotes, houseClaimsFor };')(
  { MIN_NAME: 3 }, { MAX_COMPETITORS: 5 }, async () => map, sbRest, (where, v) => () => v);
const claim = (id, night, text, grade, confidence, src) => ({ id, night, claim: text, grade: grade || null, confidence: confidence || 'Medium', src: src || 'door', reading_id: 'r-' + id, on_record: src !== 'read' });

// ── A: a RECON on an entity with six claims, two held and one missed ─────────────────────────────────────────────────
corpus = { 'e-jb': [
  claim('c1', '2026-10-12', 'Jordan buyers under 25 rank comfort above the retro calendar', 'held', 'High'),
  claim('c2', '2026-10-05', 'The family-sized general release outsells the weekly drop at mass retail', 'held', 'Medium'),
  claim('c3', '2026-09-28', 'Resale premiums on the Chicago 1 are rising into the holiday', 'missed', 'Low'),
  claim('c4', '2026-10-19', 'Parents buy the second pair where the first pair held up', null, 'Medium', 'read'),
  claim('c5', '2026-10-20', 'A grade-school court shoe is the gap the comments name', 'unmeasured', 'Medium') ],
  'e-nk': [claim('c6', '2026-10-15', 'Nike cut Air Jordan retro supply after stock sat', 'held', 'High')] };
const recon = { frame: { entity: 'Jordan Brand', category: 'athletic sneakers', competitors: ['Nike', 'New Balance'] } };
let r = await H.houseClaimsFor({}, 'recon', { id: 1 }, [], recon);
ok(r.meta.n === 6 && r.meta.entities.length === 2 && r.meta.entities[0].name === 'Jordan Brand' && r.meta.entities[1].name === 'Nike', 'A1 a RECON reads its brief: the entity and the competitors the graph holds (New Balance absent from the graph is skipped, never created)');
const body = r.text.slice(r.text.indexOf('\n') + 1);
ok((body.match(/the call held/g) || []).length === 3 && (body.match(/the call missed/g) || []).length === 1 && /the call unmeasured/.test(body) && /ungraded/.test(body), 'A2 the block carries every grade in words: held, missed, unmeasured, ungraded');
ok(/^WHAT THE HOUSE ALREADY HOLDS ON THIS SUBJECT \(C1\.\.C6: our own dated findings from earlier readings on Jordan Brand, Nike;/.test(r.text) && /context for continuity, never evidence, never a source to cite; a figure inside a claim is not a figure this read may print unless the evidence below carries it/.test(r.text), 'A3 the block says what it is: the subjects, context never evidence, the real-stats law');
ok(/A pattern or finding that repeats a claim here says so and develops it: what moved since\. A claim graded missed is named as missed, never written again as new\. A finding that contradicts a held claim says which and why\./.test(r.text), 'A4 the three rules ride the block itself, so the RECON\'s analyst and strategist read them in the evidence');
const lines = r.text.split('\n').slice(1);
ok(lines[0].startsWith('C1 [2026-10-20, Medium, the call unmeasured, deployed, on Jordan Brand]') && lines[5].startsWith('C6 [2026-09-28, Low, the call missed, deployed, on Jordan Brand]') && /a live read, on Jordan Brand\]/.test(r.text), 'A5 newest first, each line dated, graded, deployed or a live read, on its entity');
ok(r.meta.graded.held === 3 && r.meta.graded.missed === 1 && r.meta.graded.unmeasured === 1 && r.meta.graded.ungraded === 1 && r.meta.ids.length === 6 && r.meta.claims.every(c => c.claim.length <= 160 && 'grade' in c) && r.meta.category === 'athletic sneakers', 'A6 meta.house_claims counts the grades and keeps the claims short for the landing');
const cc = calls.filter(c => c.path === 'rpc/claim_corpus');
ok(cc.length === 2 && cc.every(c => c.body.p_deployed === false && c.body.p_limit === 6 && /^\d{4}-\d{2}-\d{2}$/.test(c.body.p_since)) && !calls.some(c => /category/.test(c.path)), 'A7 one corpus call per subject, deployed and live alike, six a subject, inside 120 nights; the category is not asked when the graph answered');

// ── B: a WEEKLY reads the entities its window names ──────────────────────────────────────────────────────────────────
calls = []; links = [{ entity_id: 'e-co' }, { entity_id: 'e-co' }, { entity_id: 'e-co' }, { entity_id: 'e-ap' }, { entity_id: 'e-ap' }, { entity_id: 'e-xx' }]; names = { 'e-co': 'Costco', 'e-ap': 'Apple' };
corpus = { 'e-co': [claim('c7', '2026-10-22', 'Costco shoppers buy the membership for gas before groceries', 'held', 'High')], 'e-ap': [claim('c8', '2026-10-21', 'Apple sells the case as the upgrade', null, 'Medium', 'read')] };
const items = [{ id: 1, signal_id: '11111111-1111-4111-8111-111111111111' }, { id: 2, signal_id: '22222222-2222-4222-8222-222222222222' }, { id: 3, signal_id: 'not-a-uuid' }, { id: 4 }];
r = await H.houseClaimsFor({}, 'weekly', { id: 2 }, items, null);
ok(r.meta.entities.length === 2 && r.meta.entities[0].name === 'Costco' && r.meta.entities[0].links === 3 && r.meta.entities[1].links === 2 && r.meta.n === 2 && /on Costco\]/.test(r.text) && /on Apple\]/.test(r.text), 'B1 a WEEKLY\'s subjects are the entities its stories are linked to, the most-linked first; one link is not a subject');
ok(calls[0].path.startsWith('signal_entities?signal_id=in.(11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222)') && /^entities\?id=in\.\(e-co,e-ap\)&active=eq\.true/.test(calls[1].path), 'B2 only the pack\'s real signal ids are asked, and only the active names');
ok(JSON.stringify(H.houseCorpusTop({ a: 5, b: 2, c: 1, d: 2, e: 9, f: 3, g: 4, h: 7 })) === JSON.stringify([{ id: 'e', links: 9 }, { id: 'h', links: 7 }, { id: 'a', links: 5 }, { id: 'g', links: 4 }, { id: 'f', links: 3 }, { id: 'b', links: 2 }]), 'B3 houseCorpusTop: six at most, two links at least, ties by id');

// ── C: nothing on record ─────────────────────────────────────────────────────────────────────────────────────────────
calls = []; corpus = {}; catRows = [];
r = await H.houseClaimsFor({}, 'recon', { id: 3 }, [], { frame: { entity: 'Vans', category: 'skate shoes', competitors: [] } });
ok(r.meta.n === 0 && /^WHAT THE HOUSE ALREADY HOLDS ON THIS SUBJECT: nothing on record yet\. This is the first reading the house writes on this subject; there is no history to name, and none is to be invented\.$/.test(r.text) && !/C1/.test(r.text), 'C1 a subject the house holds nothing on gets the honest line and no history');
ok(calls.some(c => /^claims\?frame->>category=ilike\.\*skate%20shoes\*&night=gte\./.test(c.path)), 'C2 an entity the graph lacks falls back to the category\'s claims, which were none');
catRows = [claim('c9', '2026-10-18', 'Skate shoe buyers want the suede back', 'held', 'Medium')];
r = await H.houseClaimsFor({}, 'recon', { id: 3 }, [], { frame: { entity: 'Vans', category: 'skate shoes', competitors: [] } });
ok(r.meta.n === 1 && /on skate shoes\]/.test(r.text) && /on skate shoes;/.test(r.text) && r.meta.entities.length === 0, 'C3 the category\'s claims stand in when the graph holds no entity for the brief');
r = await H.houseClaimsFor({}, 'weekly', { id: 4 }, [{ id: 1 }], null);
ok(r.meta.n === 0 && /nothing on record yet/.test(r.text), 'C4 a WEEKLY whose stories carry no signals holds nothing, and says so');

// ── D: the cap and the size ──────────────────────────────────────────────────────────────────────────────────────────
const many = []; for (let i = 0; i < 40; i++) many.push(claim('m' + i, '2026-' + String(8 + (i % 3)).padStart(2, '0') + '-' + String(1 + (i % 28)).padStart(2, '0'), 'x'.repeat(200), i % 2 ? 'held' : null, 'High'));
const kept = H.houseCorpusKeep(many.concat([many[0]]));
ok(kept.length === 24 && kept[0].night >= kept[23].night && new Set(kept.map(k => k.id)).size === 24, 'D1 twenty-four claims at most, newest first, one per claim');
const big = H.houseCorpusBlock(kept.map(k => Object.assign({}, k, { entity: 'A long entity name' })), ['A long entity name']);
ok(big.length / 4 < 2000 && big.split('\n').length === 25, 'D2 the whole block for the longest claims is under two thousand tokens (about forty a claim as they are written)');

// ── E: the repeat notes at the landing ───────────────────────────────────────────────────────────────────────────────
const hc = H.houseCorpusMeta([claim('c1', '2026-10-12', 'Jordan buyers under 25 rank comfort above the retro calendar', 'held'), claim('c3', '2026-09-28', 'Resale premiums on the Chicago 1 are rising into the holiday', 'missed')], [], null, 1);
ok(H.houseTitleSim('Jordan buyers under 25 rank comfort above the retro calendar', 'Buyers under 25 rank comfort above the retro calendar') === 1 && H.houseTitleSim('Jordan buyers under 25 rank comfort above the retro calendar', 'Collectors left Paris before the fair closed') < 0.2 && H.houseTitleSim('A B', 'A B') === 0, 'E1 the title test: shared words over the smaller set; a title too short to judge is never near');
let notes = H.houseRepeatNotes({ patterns: [
  { name: 'Buyers under 25 rank comfort above the retro calendar', what_happened: 'Nike cut supply.', why_it_matters: 'Comfort sells.' },
  { name: 'Under-25 buyers rank comfort above the retro calendar', what_happened: 'The house called this on Oct 12; the week moved it from the comments to the shelf.' },
  { name: 'Resale premiums on the Chicago 1 are rising into the holiday', what_happened: 'They rose again.' },
  { name: 'Resale premiums on the Chicago 1 rise into the holiday', what_happened: 'The house got this wrong in September; the call missed, and the premium fell.' },
  { name: 'Collectors left Paris before the fair closed', what_happened: 'They did.' } ] }, hc);
ok(JSON.stringify(notes) === JSON.stringify(['house:repeat:patterns[0].name', 'house:missed:patterns[2].name']), 'E2 a title near a held claim with no word that the house called it is noted; one that says so is not; a missed claim written as new is noted; a developed one is not; an unrelated title is not');
notes = H.houseRepeatNotes({ findings: [{ title: 'Buyers under 25 rank comfort above the retro calendar', excerpt: 'new' }] }, hc);
ok(JSON.stringify(notes) === JSON.stringify(['house:repeat:findings[0].title']), 'E3 a report\'s findings are read by title');
ok(H.houseRepeatNotes({ patterns: [{ name: 'Buyers under 25 rank comfort above the retro calendar' }] }, null).length === 0 && H.houseRepeatNotes(null, hc).length === 0, 'E4 no corpus, no read: no notes');

// ── F: the wiring in the worker ──────────────────────────────────────────────────────────────────────────────────────
ok(/const READ_HOUSE_LAW = 'THE HOUSE LAW: the pack may carry WHAT THE HOUSE ALREADY HOLDS/.test(w) && w.indexOf('const READ_HOUSE_LAW = ') > w.indexOf('const READ_EDITOR_LAW = ') && w.indexOf('const READ_HOUSE_LAW = ') < w.indexOf('function deepThinkCid(') && /says so and develops it, in a sentence that names the date and what moved since/.test(H.READ_HOUSE_LAW) && /graded missed is named as missed and not written again as new/.test(H.READ_HOUSE_LAW) && /contradicts a held claim says which claim and why/.test(H.READ_HOUSE_LAW) && /When the house holds nothing on the subject, the read says nothing about its history/.test(H.READ_HOUSE_LAW) && !/\u2014/.test(H.READ_HOUSE_LAW), 'F1 THE HOUSE LAW: the three instructions, the record never evidence, nothing invented');
ok((w.match(/\+ ' ' \+ READ_HOUSE_LAW/g) || []).length === 3 && /READ_CONTRACT\[row\.kind\] \+ ' ' \+ READ_HOUSE_LAW \+ ' ' \+ READ_POSITIONS_LAW, cache: true,/.test(w) && /READ_THINK_CONTRACT : ''\) \+ ' ' \+ READ_HOUSE_LAW \+ ' ' \+ READ_POSITIONS_LAW, cache: true,/.test(w) && /READ_EDITOR_LAW : READ_WRITER_LAW\) \+ ' ' \+ READ_HOUSE_LAW \+ ' ' \+ READ_POSITIONS_LAW;/.test(w), 'F2 the law rides the three systems: the one-pass compile, the revision, the RECON\'s writer and editor (VX2: the positions law after it)');
ok((w.match(/const hc = typeof houseClaimsFor === 'function' \? await houseClaimsFor\(env, row\.kind, row, items, recon\)\.catch\(excQuiet\('house_corpus', null\)\) : null;/g) || []).length === 2, 'F3 the compile and the revision read the corpus');
const compile = between(w, "const memo = typeof memoryReadBrief === 'function'", "const req = { custom_id: 'hr-' + row.id");
ok(compile.indexOf("(hc && hc.text ? '\\n\\n' + hc.text : '')") > compile.indexOf("JSON.stringify(stats)") && compile.indexOf("(hc && hc.text ? '\\n\\n' + hc.text : '')") < compile.indexOf("STORIES ("), 'F4 the block sits after STATS and before the stories in the compile\'s prompt');
const revision = between(w, 'async function readSubmitRevision(env, row) {', '/* Called by claudeBatchDrain when a house_* job lands.');
ok(revision.indexOf("(hc && hc.text ? '\\n\\n' + hc.text : '')") > revision.indexOf("JSON.stringify(stats)") && revision.indexOf("(hc && hc.text ? '\\n\\n' + hc.text : '')") < revision.indexOf("STORIES (") && /pack: Object\.assign\(\{\}, pk, hc && hc\.text \? \{ house: hc\.text \} : \{\}\)/.test(revision) && /hc \? \{ house_claims: hc\.meta \} : \{\}\);   \/\/ the notes it applied/.test(revision), 'F5 a revision reads the corpus as it stands now, before the stories, and keeps it on its row and its pack');
ok(/hc && hc\.text \? \{ house: hc\.text \} : \{\}\) \} : \{\};   \/\/ SEAM:READ_THINK/.test(w) && (w.match(/hc \? \{ house_claims: hc\.meta \} : \{\}/g) || []).length === 3, 'F6 the pack keeps the block for the RECON\'s passes; every row keeps meta.house_claims (the compile, the deep compile, the revision)');
const ev = between(w, 'async function deepThinkEvidence(env, row) {', '/* PURE: a pass\'s prompt');
ok(ev.indexOf("(pk.house ? '\\n\\n' + pk.house : '')") > ev.indexOf('JSON.stringify(row.stats || {})') && ev.indexOf("(pk.house ? '\\n\\n' + pk.house : '')") < ev.indexOf('STORIES ('), 'F7 the RECON\'s four passes read the block in the evidence, after STATS and before the stories, the same for all four');
const land = between(w, 'const v = readValidate(row.kind, parsed, ground, row.pack_ids || [], extra);', '// SEAM:READ_PROOF: the copy desk reads every landing.');
ok(/if \(v\.read && typeof houseRepeatNotes === 'function'\) v\.notes = v\.notes\.concat\(houseRepeatNotes\(v\.read, row\.meta && row\.meta\.house_claims\)\);/.test(land) && !/v\.fatal.*houseRepeatNotes/.test(land), 'F8 the landing notes the repeats on every kind, before the copy desk, as notes and never a hold');
ok(/const houseBlock = house\.length \? 'WHAT THE HOUSE DEPLOYED \(our own dated insights on this subject; context for continuity, never evidence/.test(w) && /\(h\.called \? ' \[' \+ h\.called \+ '\]' : ''\)/.test(w), 'F9 EXCAVATE\'s own block (EX53) still carries each claim\'s grade; untouched here');
ok(seams.registry['SEAM:HOUSE_CORPUS'] && seams.registry['SEAM:HOUSE_CORPUS'].file === 'worker/src/index.js' && (w.match(/SEAM:HOUSE_CORPUS/g) || []).length >= 12, 'F10 the seam is registered and tagged');
const last = JSON.parse(fs.readFileSync('tools/bench/last.json', 'utf-8'));
ok(writerHash(w).slice(0, 12) === String(last.writer_hash || '').slice(0, 12), 'F11 the EXCAVATE writer\'s hash is unchanged by this cut (' + writerHash(w).slice(0, 12) + ')');

console.log(`\nproof_house_corpus: ${pass} checks PASS`);
