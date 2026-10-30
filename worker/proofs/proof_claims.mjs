/**
 * proof_claims.mjs  --  EX53 CLAIMS: findings as rows, written when a reading lands and migrated by parsing; the record answers
 * first at claim granularity; the moves pass reads the corpus on the frame; the graph does not seed a lowercase noun.
 * Run from the repo root: node worker/proofs/proof_claims.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0055_claims.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };

// ── the slice: the claims block with the database, the graph and the lane faked ───────────────────────────────────────────
const block = between(w, '/* ═══ SEAM:CLAIMS (EX53)', '/* SEAM:EXC_HOUSE: the house');
let calls = [], state = {}, doorRows = [], readRows = [], corpusRows = [], compiled = null, throwing = false;
const sbRest = async (env, path, opts) => {
  calls.push({ path, body: opts && opts.body, prefer: opts && opts.headers && opts.headers.Prefer, method: (opts && opts.method) || 'GET' });
  if (throwing) throw new Error('sb_500');
  if (/^claims\?on_conflict/.test(path)) return (opts.body || []).map((r, i) => ({ id: 'c' + (i + 1) }));
  if (path === 'rpc/link_claim_entities') return [{ links_made: (opts.body.p_claims || []).length * 2, entities_run: 3 }];
  if (path === 'rpc/claim_corpus') return corpusRows;
  if (/^claims\?src=eq\.door/.test(path)) return [];
  if (/^door_reads\?status=eq\.ready/.test(path)) { const r = doorRows; doorRows = []; return r; }
  if (/^reads\?select=/.test(path)) { const r = readRows; readRows = []; return r; }
  throw new Error('unexpected path ' + path);
};
const env = {};
const M = new Function('sbRest', 'excQuiet', 'RECORD', 'DOOR', 'ENTITY', 'entityStateGet', 'entityStatePut', 'logEvent', 'entityResolveName', 'excFrameBlock', 'excMeasureLine',
  'excAnchors', 'EXC_GENERIC', 'excShort', 'excCompile', 'extractJson', 'excSalvage', 'EXC_VOICE_SYS', 'EXC_MOVE_LAW', 'EXC_NUMBER_LAW', 'console',
  block + '; return { CLAIMS, claimsOf, claimsWrite, claimsGrade, claimsMarks, claimsMigratePass, claimsCorpus, excMovesPrompt, excMovesShape, excMovesPass };')(
  sbRest, (where, v) => e => v, { SINCE: '2026-10-08' }, { MIN_EVIDENCE: 4 }, { MIN_NAME: 3 },
  async () => state, async (env, k, v) => { state[k] = v; }, async () => {},
  async (env, name, opts) => { calls.push({ path: 'resolve:' + name, body: opts }); return /^costco$/i.test(name) ? { id: 'e1', name: 'Costco' } : null; },
  f => 'FRAME: entity ' + (f && f.entity) + '\n', m => (m ? 'MEASURES: context\n' : ''),
  (text, query) => (String(text).match(/\b[A-Z][a-z]+/g) || []).length, /leverage social media|build awareness/i, v => (v ? String(v).slice(0, 40) : null),
  async (env, o) => { calls.push({ path: 'compile', body: o }); return compiled || { text: '', lane: 'none', reason: 'claude_network', cost_usd: 0 }; },
  s => { try { return JSON.parse(s); } catch (e) { return null; } }, () => null, 'VOICE', 'MOVE LAW', 'NUMBER LAW', { log: () => {} });

// ── A: findings as rows (pure) ─────────────────────────────────────────────────────────────────────────────────────────────
const lines = [{ title: 'Costco shoppers trade down', url: 'https://r/1', source: 'Reuters', tier: 1, published_at: '2026-10-19T10:00:00Z' }, { title: 'Kirkland grows', url: 'https://b/2', source: 'Blog', tier: 3, published_at: '2026-10-18T10:00:00Z' }, { title: 'x', url: 'https://c/3', source: 'C', tier: 2 }];
const read = { read: ['a', 'b'], insights: [
  { category: 'consumer', title: 'Costco shoppers trade down inside the warehouse', excerpt: 'Kirkland lines gain.', confidence: 'High', evidence: [1, 2, 2, 9], dated: { newest: '2026-10-19', oldest: '2026-10-18', band: 'RECENT' } },
  { category: 'odd', title: 'Second finding', excerpt: '', confidence: 'Maybe', evidence: [], dated: null, meaning: { culture: 'c' } },
  { category: 'brand', title: '', excerpt: 'no title' }, null] };
const frame = { entity: 'Costco', category: 'retail', audience: 'members', market: 'US', question: 'Why?', competitors: ['Walmart'], anchors: ['x'] };
const rows = M.claimsOf('door', 'd1', read, lines, frame, '2026-10-20', { recent_7d: 12, outlets: 4 }, 'track:a', '2026-10-20T06:00:00Z');
ok(rows.length === 2 && rows[0].idx === 0 && rows[1].idx === 1 && rows[0].src === 'door' && rows[0].reading_id === 'd1' && rows[0].frame_key === 'track:a' && rows[0].night === '2026-10-20' && rows[0].written_at === '2026-10-20T06:00:00Z', 'A1 each finding with a title is a row keyed by the reading and its place; an untitled or null finding is skipped');
ok(rows[0].claim === 'Costco shoppers trade down inside the warehouse' && rows[0].lens === 'consumer' && rows[0].confidence === 'High' && rows[0].band === 'RECENT' && rows[0].newest === '2026-10-19' && rows[0].oldest === '2026-10-18', 'A2 the claim is the sentence, with its lens, the confidence the ground earned, and the band and dates of its lines');
ok(rows[0].lines.length === 2 && rows[0].lines[0].n === 1 && rows[0].lines[0].tier === 1 && rows[0].lines[0].source === 'Reuters' && rows[0].lines[0].date === '2026-10-19' && rows[0].lines[1].n === 2 && JSON.stringify(rows[0].tiers) === '{"1":1,"3":1}', 'A3 the lines it stands on are resolved from the evidence numbers (deduplicated, out-of-range dropped) with their tiers; the tier mix is counted');
ok(rows[0].frame.entity === 'Costco' && rows[0].frame.question === 'Why?' && !('anchors' in rows[0].frame) && !('competitors' in rows[0].frame) && rows[0].on_record === true && rows[0].meaning === null && rows[1].meaning.culture === 'c', 'A4 the frame rides small (entity, category, audience, market, question); a deployment under the record law is on_record; a report\'s meanings ride when the reading had them');
ok(rows[1].lens === 'consumer' && rows[1].confidence === 'Low' && rows[1].lines.length === 0 && rows[1].band === null && JSON.stringify(rows[1].tiers) === '{}', 'A5 an unknown lens reads consumer and an unknown confidence reads Low; a finding on no line has no lines, no band, no tiers');
ok(M.claimsOf('door', 'd0', read, lines.slice(0, 2), frame, '2026-10-01', { recent_7d: 12 }, 'k')[0].on_record === false && M.claimsOf('door', 'd2', read, lines.slice(0, 2), frame, '2026-10-20', { recent_7d: 0, outlets: 0 }, 'k')[0].on_record === false && M.claimsOf('door', 'd3', read, lines.concat(lines), frame, '2026-10-20', {}, 'k')[0].on_record === true, 'A6 the record law: before Oct 8, or no measure and under four lines, is history, never on the record');
const live = M.claimsOf('read', 'r1', { insights: [{ title: 'A live finding', category: 'market', confidence: 'Medium', evidence: [2], source: 'Vogue', sourceUrl: 'https://vogue/1', dated: { newest: '2026-10-25', band: 'NOW' } }] }, [], { entity: 'Nike' }, '2026-10-25T15:00:00Z', null, null, '2026-10-25T15:00:00Z');
ok(live.length === 1 && live[0].src === 'read' && live[0].night === '2026-10-25' && live[0].on_record === false && live[0].frame_key === null && live[0].lines.length === 1 && live[0].lines[0].n === null && live[0].lines[0].url === 'https://vogue/1' && live[0].lines[0].source === 'Vogue' && live[0].lines[0].date === '2026-10-25', 'A7 a migrated live read, whose lines are not stored, keeps the one source each finding named; it is never on the record');
ok(M.claimsOf('door', 'x', null, [], {}, '2026-10-20').length === 0 && M.claimsOf('door', 'x', { insights: 'no' }, [], {}, '2026-10-20').length === 0, 'A8 a reading with no findings writes no rows');

// ── B: the write ───────────────────────────────────────────────────────────────────────────────────────────────────────────
calls = [];
const wr = await M.claimsWrite(env, rows);
const up = calls.find(c => /^claims\?on_conflict=src,reading_id,idx&select=id$/.test(c.path)), lk = calls.find(c => c.path === 'rpc/link_claim_entities');
ok(wr.wrote === 2 && wr.linked === 4 && up && up.method === 'POST' && /merge-duplicates/.test(up.prefer) && /return=representation/.test(up.prefer) && up.body.length === 2 && up.body[0].updated_at && lk && lk.body.p_claims.join() === 'c1,c2', 'B1 the rows are upserted on (src, reading_id, idx) and the ids are handed to link_claim_entities');
calls = []; throwing = true;
const wf = await M.claimsWrite(env, rows); throwing = false;
ok(wf.wrote === 0 && wf.linked === 0 && wf.error === 'sb_500' && (await M.claimsWrite(env, [])).wrote === 0, 'B2 a database failure returns a count of zero with the error, never a throw into the reading; nothing is written for no rows');
calls = [];
await M.claimsGrade(env, 'd1', { verdict: 'held', at: '2026-11-01T00:00:00Z' }); await M.claimsMarks(env, 'd1', { held: 1, useful: 0, wrong: 0 }); await M.claimsGrade(env, 'd1', null);
ok(calls.length === 2 && calls.every(c => c.method === 'PATCH' && /^claims\?src=eq\.door&reading_id=eq\.d1$/.test(c.path)) && calls[0].body.grade === 'held' && calls[0].body.graded_at === '2026-11-01T00:00:00Z' && calls[1].body.marks.held === 1, 'B3 the reading\'s grade and marks are carried onto its claims by one PATCH each; no grade, no call');

// ── C: the migration by parsing ────────────────────────────────────────────────────────────────────────────────────────────
calls = []; state = {};
doorRows = [{ id: 'd1', frame_key: 'track:a', night: '2026-10-19', frame, measures: { recent_7d: 3 }, read, evidence: lines, updated_at: '2026-10-19T06:00:00Z' }, { id: 'd2', frame_key: 'track:b', night: '2026-10-20', frame, measures: {}, read, evidence: lines, updated_at: '2026-10-20T06:00:00Z' }];
readRows = [{ id: 'r1', insights: [{ title: 'A live finding', evidence: [] }], meta: { frame: { entity: 'Nike' } }, created_at: '2026-10-21T10:00:00Z' }];
const m1 = await M.claimsMigratePass(env, { steps: 10 });
const dq = calls.filter(c => /^door_reads\?/.test(c.path)), rq = calls.filter(c => /^reads\?/.test(c.path));
ok(m1.steps === 4 && m1.done === true && m1.wrote === 5 && m1.door.rows === 2 && m1.door.claims === 4 && m1.read.rows === 1 && m1.read.claims === 1 && state.claims_door.done && state.claims_read.done, 'C1 the pass walks the deployments and then the live reads, STEP rows a step, writes their claims and records both cursors done');
ok(dq.length === 2 && /status=eq\.ready&read=not\.is\.null&select=/.test(dq[0].path) && /order=night\.asc,id\.asc&limit=20/.test(dq[0].path) && /&or=\(night\.gt\.2026-10-20,and\(night\.eq\.2026-10-20,id\.gt\.d2\)\)/.test(dq[1].path) && rq.length === 2 && /order=created_at\.asc,id\.asc/.test(rq[0].path) && /created_at\.gt\.2026-10-21T10%3A00%3A00Z/.test(rq[1].path), 'C2 the cursors are keysets (night and id; created_at and id), so a step never re-reads a row and never skips one');
calls = []; doorRows = []; readRows = [];
const m2 = await M.claimsMigratePass(env, { steps: 10 });
ok(m2.steps === 0 && m2.done === true && !calls.some(c => /^(door_reads|reads)\?/.test(c.path)), 'C3 a second pass over finished cursors reads nothing: the migration is a no-op once done (the upsert makes a re-run a no-op too)');
ok(M.CLAIMS.PASS_MS <= 20000 && M.CLAIMS.MAX_STEPS === 200 && M.CLAIMS.STEP === 20, 'C4 a pass is bounded: twenty rows a step, at most two hundred steps a call, twenty seconds');

// ── D: the corpus on a frame ───────────────────────────────────────────────────────────────────────────────────────────────
calls = []; corpusRows = [{ id: 'c9', reading_id: 'd9', night: '2026-10-22', claim: 'Older claim', confidence: 'Medium', grade: 'held', src: 'door' }, { id: 'c8', claim: '' }];
const cp = await M.claimsCorpus(env, { entity: 'Costco' }, { deployed: true, limit: 8, nights: 120 });
const rc = calls.find(c => c.path === 'rpc/claim_corpus'), rs = calls.find(c => /^resolve:/.test(c.path));
ok(cp.entity.id === 'e1' && cp.rows.length === 1 && rc && rc.body.p_entities.join() === 'e1' && rc.body.p_deployed === true && rc.body.p_limit === 8 && /^\d{4}-\d{2}-\d{2}$/.test(rc.body.p_since) && rs && !(rs.body && rs.body.create), 'D1 the frame\'s entity is looked up in the graph (never created here) and the corpus is read from claim_corpus with the flag, the window and the limit; a row with no claim is dropped');
calls = [];
const cp2 = await M.claimsCorpus(env, { entity: 'Nobody Known' }, {}), cp3 = await M.claimsCorpus(env, { entity: 'LG' }, {}), cp4 = await M.claimsCorpus(env, { category: 'retail' }, {});
ok(cp2.entity === null && cp2.rows.length === 0 && cp3.rows.length === 0 && cp4.rows.length === 0 && !calls.some(c => c.path === 'rpc/claim_corpus'), 'D2 an entity the graph lacks, a two-letter name or a frame with no entity reads no corpus and asks the database nothing');

// ── E: the moves shaped from the corpus (pure) ─────────────────────────────────────────────────────────────────────────────
const ins = [{ title: 'Costco shoppers trade down', evidence: [1, 2], dated: { newest: '2026-10-19', band: 'RECENT' } }, { title: 'Kirkland lines gain', evidence: [2, 3], dated: { newest: '2026-10-18', band: 'RECENT' } }];
const corpus = [{ id: 'c1', night: '2026-10-10', claim: 'Members renew through the price rise', grade: 'held' }, { id: 'c2', night: '2026-10-15', claim: 'Private label takes the basket', grade: null }];
const parsed = { moves: [
  { type: 'Pricing', headline: 'Hold Kirkland at the Walmart gap', body: 'Price Kirkland staples against Walmart Great Value by name.', because: 'b', proof: 'p', measure: 'm', risk: 'r', from: ['F2', 'c2', 'F9', 'junk'], for: 'merchandising' },
  { type: 'Content', headline: 'Leverage social media to build awareness', body: 'leverage social media', from: ['F1'] },
  { type: 'Product', headline: 'Bring Kirkland Signature into the pharmacy', body: 'The Kirkland line moves into Pharmacy aisles.', from: ['C1'] },
  { type: 'Campaign', headline: 'Name Costco in October', body: 'A Costco October push.', from: [] },
  { headline: '' } ] };
const sh = M.excMovesShape(parsed, ins, corpus, 'costco shoppers');
ok(sh.wrote === 5 && sh.kept.length === 2 && sh.dropped === 2 && sh.single === 1, 'E1 a move naming no finding is dropped, a generic move without anchors is dropped by the MOVE LAW, the rest are kept');
ok(sh.kept[0].headline === 'Hold Kirkland at the Walmart gap' && sh.kept[0].from === 1 && sh.kept[0].findings.join() === '1' && sh.kept[0].evidence.join() === '2,3' && sh.kept[0].stands.length === 1 && sh.kept[0].stands[0].id === 'c2' && sh.kept[0].stands[0].date === '2026-10-15' && sh.kept[0].single_source === false && sh.kept[0].for === 'merchandising' && sh.kept[0].dated.newest === '2026-10-18', 'E2 a move resolves its labels: from is the first finding\'s index, evidence the union of its findings\' lines, stands the corpus claims by date; a bad label is ignored');
ok(sh.kept[1].headline === 'Bring Kirkland Signature into the pharmacy' && sh.kept[1].single_source === true && sh.kept[1].from === null && sh.kept[1].evidence.length === 0 && sh.kept[1].stands[0].grade === 'held' && sh.kept[1].dated.band === 'RECORD' && sh.kept[1].dated.newest === '2026-10-10', 'E3 a move on one corpus claim is single-source and ranked last; it stands on the record with the claim\'s date and grade');
ok(M.excMovesShape(null, ins, corpus, 'q').kept.length === 0 && M.excMovesShape({ ideas: parsed.moves }, ins, corpus, 'q').kept.length === 2, 'E4 nothing parsed is nothing kept; a reply shaped as ideas is read the same way');
const pr = M.excMovesPrompt({ entity: 'Costco' }, 'costco shoppers', ins, corpus.map(c => Object.assign({ src: 'door', confidence: 'High' }, c)), { recent_7d: 2 });
ok(/^FRAME: entity Costco/.test(pr) && /MEASURES: context/.test(pr) && /F1 \[Low, 2026-10-19\] Costco shoppers trade down/.test(pr) && /C1 \[2026-10-10, High, the call held, deployed\] Members renew/.test(pr) && /"from":\["F2","C5"\]/.test(pr) && /Three to five moves/.test(pr) && pr.indexOf('\u2014') < 0, 'E5 the prompt carries the frame, the measure as context, this reading\'s findings as F and the corpus as C with dates, confidence and grades, and asks for the labels');

// ── F: the pass itself ─────────────────────────────────────────────────────────────────────────────────────────────────────
calls = []; corpusRows = [corpus[0]];
const p1 = await M.excMovesPass(env, { frame: { entity: 'Costco' }, query: 'q', insights: ins, measures: null, leftMs: 60000 });
ok(p1 && p1.ideas === null && p1.pass.used === false && p1.pass.why === 'thin_corpus' && p1.pass.corpus === 1 && !calls.some(c => c.path === 'compile'), 'F1 under MIN_CORPUS claims on the frame the pass spends nothing and the writer\'s moves stand');
calls = []; corpusRows = [corpus[0], corpus[1], { id: 'c3', night: '2026-10-16', claim: 'Third' }, { id: 'c4', night: '2026-10-17', claim: 'Fourth' }];
compiled = { text: JSON.stringify({ moves: [parsed.moves[0], parsed.moves[2], { type: 'Channel', headline: 'Put Kirkland on Instacart first', body: 'Instacart carries the Kirkland basket.', from: ['F1', 'C3'] }] }), lane: 'live', cost_usd: 0.04 };
const p2 = await M.excMovesPass(env, { frame: { entity: 'Costco' }, query: 'q', insights: ins, measures: { recent_7d: 2 }, leftMs: 60000 });
const cc = calls.find(c => c.path === 'compile');
ok(p2.pass.used === true && p2.ideas.length === 3 && p2.pass.kept === 3 && p2.pass.single === 1 && p2.pass.corpus === 4 && p2.pass.usd === 0.04 && p2.pass.lane === 'live', 'F2 with a corpus the pass writes the moves from it: three or more that survive replace the writer\'s');
ok(cc && cc.body.kind === 'excavate_moves' && cc.body.noReserve === true && cc.body.thinking.type === 'disabled' && cc.body.timeout_ms === 40000 && cc.body.max_tokens === 2600 && /^VOICE MOVE LAW NUMBER LAW$/.test(cc.body.system) && /WHAT THE HOUSE ALREADY HOLDS/.test(cc.body.prompt), 'F3 one call on the live lane through excCompile: the voice, the MOVE LAW and the NUMBER LAW; no reserve model; no thinking; inside its own clock');
calls = []; compiled = null;
const p3 = await M.excMovesPass(env, { frame: { entity: 'Costco' }, query: 'q', insights: ins, leftMs: 60000 });
ok(p3.pass.used === false && p3.ideas === null && p3.pass.why === 'claude_network' && p3.pass.kept === 0, 'F4 a lane that did not answer leaves the writer\'s moves and says why');
compiled = { text: JSON.stringify({ moves: [parsed.moves[0]] }), lane: 'live', cost_usd: 0.02 };
const p4 = await M.excMovesPass(env, { frame: { entity: 'Costco' }, query: 'q', insights: ins, leftMs: 60000 });
ok(p4.pass.used === false && p4.pass.why === 'few_moves' && p4.pass.kept === 1 && (await M.excMovesPass(env, { frame: { entity: 'Costco' }, query: 'q', insights: ins, leftMs: 3000 })).pass.why === 'no_time' && (await M.excMovesPass(env, { frame: {}, query: 'q', insights: ins })) === null, 'F5 fewer than three moves, no time left on the read\'s clock, or no entity: the writer\'s moves stand');

// ── G: the record answers first at claim granularity ───────────────────────────────────────────────────────────────────────
const house = between(w, 'async function excHouseLines(env, frame) {', 'async function excavateFeed(env, origin) {');
let hcalls = [], hrows = [];
const H = new Function('claimsCorpus', 'CLAIMS', 'excQuiet', 'sbRest', house + '; return excHouseLines;')(
  async (env, f, o) => { hcalls.push({ f, o }); return { entity: hrows.length ? { id: 'e1' } : null, rows: hrows }; }, { HOUSE: 8, HOUSE_NIGHTS: 120 }, (where, v) => e => v,
  async (env, path) => { hcalls.push({ path }); return [{ id: 'd7', night: '2026-10-21', read: { read: ['The old headline', 'dek'], ideas: [{ headline: 'Old move' }] }, meta: { called: { verdict: 'missed' } } }]; });
hrows = [{ id: 'c1', reading_id: 'd1', night: '2026-10-20', claim: 'Costco shoppers trade down', confidence: 'High', grade: 'held' }, { id: 'c2', reading_id: 'd1', night: '2026-10-20', claim: 'Second', confidence: 'Low', grade: null }];
const h1 = await H(env, { entity: 'Costco', category: 'retail' });
ok(h1.length === 2 && h1[0].id === 'd1' && h1[0].claim_id === 'c1' && h1[0].deployed === '2026-10-20' && h1[0].claim === 'Costco shoppers trade down' && h1[0].confidence === 'High' && h1[0].called === 'held' && h1[1].called === null && hcalls[0].o.deployed === true && hcalls[0].o.limit === 8 && hcalls[0].o.nights === 120 && !hcalls.some(c => c.path), 'G1 the house lines are the deployed claims on the entity, newest first, each with its reading, its date, its confidence and its grade; the reading-level query is not asked');
hcalls = []; hrows = [];
const h2 = await H(env, { entity: 'Costco', category: 'retail' });
ok(h2.length === 1 && h2[0].id === 'd7' && h2[0].claim === 'The old headline' && h2[0].called === 'missed' && hcalls.some(c => c.path && /limit=3/.test(c.path)), 'G2 with no claims on the subject yet (before the migration reaches it, or an entity the graph lacks) the reading-level query stands as the fallback');
ok(/WHAT THE HOUSE DEPLOYED \(our own dated insights on this subject; context for continuity, never evidence, never a source to cite/.test(w) && /h\.deployed \+ ': ' \+ h\.claim \+ \(h\.confidence \? ' \(' \+ h\.confidence \+ '\)' : ''\) \+ \(h\.called \? ' \[' \+ h\.called \+ '\]' : ''\)/.test(w), 'G3 the writer reads the claims before the evidence, each with its confidence and grade, as context never evidence');

// ── H: where the claims are written, graded and marked; the desk; the pass in the synth ───────────────────────────────────
ok(/if \(typeof claimsWrite === 'function'\) await claimsWrite\(env, claimsOf\('door', id, read, merged, row\.frame, row\.night, row\.measures, row\.frame_key, new Date\(\)\.toISOString\(\)\)\);/.test(w) && /'door_reads\?id=eq\.' \+ id \+ '&select=id,frame_key,frame,measures,evidence,status,night,meta'/.test(w), 'H1 a deployment that lands writes its claims from the row\'s evidence; a reused row writes none');
ok(/if \(readId && typeof claimsWrite === 'function'\) await claimsWrite\(env, claimsOf\('read', readId, \{ insights \}, merged, frame0 \|\| frame, new Date\(now\)\.toISOString\(\), measures, null, new Date\(now\)\.toISOString\(\)\)\);/.test(w), 'H2 a live read writes its claims beside the ledger, from the lines it stood on; a bench read or a failed ledger write writes none');
ok(/if \(typeof claimsGrade === 'function'\) await claimsGrade\(env, r\.id, called\);/.test(w) && /if \(typeof claimsMarks === 'function'\) await claimsMarks\(env, iid, m\.counts\);/.test(w), 'H3 the grade and the marks reach the claims when the reading is called or marked');
ok(/which === 'claims' \? await claimsMigratePass\(env, \{ steps: parseInt\(body\.steps, 10\) \|\| undefined \}\) :/.test(w), 'H4 the desk runs the migration: {run: claims, steps: N}');
const synth = between(w, "    const guard = isReport ? excMoveGuard(ideasAll, query)", "    const frameIn = (parsed.frame && typeof parsed.frame === 'object')");
ok(/let ideas = guard\.kept; const movesDropped = guard\.dropped;/.test(synth) && /if \(isReport && !quick && !thin && frame0 && !body\.bench && typeof excMovesPass === 'function'\)/.test(synth) && /await excMovesPass\(env, \{ frame: frame0, query, insights, measures, leftMs: writeLeft\(\) \}\)/.test(synth) && /if \(mp\.ideas\) ideas = mp\.ideas;/.test(synth), 'H5 the pass runs after the writer\'s moves are guarded, on a full read only (never quick, thin, a bench read or an unframed query), inside the read\'s wall clock');
ok(/moves_dropped: movesDropped, moves_pass: movesPass, partial,   \/\/ SEAM:EXC_STALL: the ledger knows a partial read/.test(w) && /frame, moves_dropped: movesDropped, moves_pass: movesPass, partial,   \/\/ SEAM:EXC_STALL; SEAM:CLAIMS/.test(w), 'H6 the ledger row and the read carry the pass (corpus, kept, single, used, why)');
const tight = between(w, "    const tight = ' ROOM LAW", '    const passes = [];');
ok(!/claims|movesPass/.test(tight) && !/claims|CLAIMS/.test(between(w, 'const EXC_MOVE_LAW = ', 'function excAnchors(')), 'H7 the bench\'s hashed slices (the laws, the prompts, the room) are untouched: the writer hash stands');

// ── I: the graph ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const graphPure = between(w, 'const ENTITY = {', 'async function entitySeed(');
const G = new Function(graphPure + '; return { entityProposals };')();
const props = G.entityProposals([{ frame: { entity: 'Costco', category: 'retail', competitors: ['music publishers', 'Walmart', 'legal firms', 'Disney+'] } }], [{ id: 't1', name: 'lowercase brand', aliases: ['lb co'], sector: 'retail' }]);
const names = props.map(p => p.name);
ok(names.includes('Costco') && names.includes('Walmart') && names.includes('Disney+') && !names.includes('music publishers') && !names.includes('legal firms') && names.includes('lowercase brand'), 'I1 a frame\'s name with no uppercase letter is a noun, not a name: not seeded; a tracked brand keeps the house\'s spelling');
ok(/create or replace function public\.entity_pattern\(p_names text\[\]\)/.test(sql) && /clean := \(case when clean ~ '\^\[\[:alnum:\]\]' then '\\m' else '' end\) \|\| clean \|\| \(case when clean ~ '\[\[:alnum:\]\]\$' then '\\M' else '' end\);/.test(sql) && /return '\(\?:' \|\| array_to_string\(parts, '\|'\) \|\| '\)';/.test(sql), 'I2 0055 carries the graph\'s boundary fix: a name ending in * or + links on its own words (the same text the desk ran by hand)');

// ── J: the migration file and the page ─────────────────────────────────────────────────────────────────────────────────────
ok(/create table if not exists public\.claims \(/.test(sql) && /src text not null check \(src in \('door', 'read'\)\)/.test(sql) && /create unique index if not exists claims_reading_idx_uq on public\.claims \(src, reading_id, idx\);/.test(sql) && /create table if not exists public\.claim_entities \(/.test(sql) && /how text not null default 'alias' check \(how in \('frame', 'alias', 'hand'\)\)/.test(sql), 'J1 claims and claim_entities, idempotent, keyed by the reading and the finding\'s place');
ok(/create or replace function public\.link_claim_entities\(p_claims uuid\[\]\)/.test(sql) && /select c\.id, e\.id, 'frame' from public\.claims c/.test(sql) && /select c\.id, e\.id, 'alias' from public\.claims c/.test(sql) && /\(ctx is null or \(c\.claim \|\| ' ' \|\| coalesce\(c\.excerpt, ''\)\) ~\* ctx\)/.test(sql) && /create or replace function public\.claim_corpus\(p_entities uuid\[\], p_deployed boolean default false, p_since date default null, p_limit int default 40\)/.test(sql) && /and \(not p_deployed or c\.on_record\)/.test(sql) && /order by x\.night desc nulls last, x\.written_at desc, x\.idx asc/.test(sql), 'J2 link_claim_entities links the frame\'s entity and every name the claim carries (an ambiguous one needs a context word); claim_corpus reads newest first, deployed only on the flag');
ok(/stands:Array\.isArray\(d\.stands\)\?d\.stands:null, single:!!d\.single_source\}\)\)/.test(page) && /moves_pass:syn&&syn\.moves_pass\|\|null, compiled_at:/.test(page) && /dropped:data\.moves_dropped\|\|0, pass:data\.moves_pass\|\|null \};/.test(page), 'J3 the page carries what a move stands on, whether it is single-source, and the pass');
ok(/\$\{truth\.pass&&truth\.pass\.used\?' · built on '\+Number\(truth\.pass\.corpus\|\|0\)\+' findings the house holds on this subject':''\}/.test(page) && /STANDS ON · \$\{m\.stands\.slice\(0,3\)\.map\(s=>safe\(\(s\.date\|\|''\)\+\(s\.date\?': ':''\)\+\(s\.claim\|\|''\)\)\)\.join\(' · '\)\}/.test(page) && /SINGLE SOURCE · one finding stands behind this move/.test(page), 'J4 the moves head says how many findings the house held; the card says what it stands on, by date, and when one finding stands behind it');
ok(block.indexOf('\u2014') < 0 && !/\u2014/.test(between(page, 'function _moveCard(m, all){', '// EXC_INTEL: the band and date a finding stands on.')), 'J5 no em dash in the block or the card');

console.log(`\nproof_claims: ${pass} checks passed`);
