/**
 * proof_read_proof.mjs  --  READ_PROOF: the copy desk. American English, the editor
 * accepted only when it changed nothing but the words, receipts for every fix, and a
 * recut door for issues already out.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const a = w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), b = w.indexOf('/* SEAM:ARCHIVE');
const block = w.slice(a, b);
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';

let sb = [], fixtures = {}, claude = null, claudeCalls = [];
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'callClaude', 'extractJson', 'sha256hex', 'CLAUDE',
  pmj + block + '; return { readAmerican, readProofAccept, readProofDiff, readProof, readProofRun, readLand, readRoute, readValidate, READ_PROOF, READ_PROOF_SYS, READ_METHOD };')(
  sbRest, async () => ({ ok: true }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async (env, tier, req) => { claudeCalls.push({ tier, req }); return typeof claude === 'function' ? claude(req) : claude; },
  (t) => { try { return JSON.parse(t); } catch (e) { return null; } }, async (t) => 'h' + t.length, { TIERS: { live: { model: 'claude-sonnet-5' } } });

// ── the spelling pass ─────────────────────────────────────────────────────
const s1 = R.readAmerican({ title: 'The colour of the programme', thesis: 'Grey days, whilst the organisers realised the catalogue was travelling.',
  patterns: [{ name: 'The Labour Party centres', evidence: ['S12'], lead_image: 'S12', what_happened: 'They called it "a costume", not a memory .  Colour won.' }],
  by_the_numbers: [{ stat: 'by_territory.colour', line: 'A line.' }] });
ok(s1.read.title === 'The color of the program' && s1.read.thesis === 'Gray days, while the organizers realized the catalog was traveling.', 'A1 British spellings become American, case kept');
ok(s1.read.patterns[0].name === 'The Labour Party centers' && s1.read.patterns[0].lead_image === 'S12' && s1.read.by_the_numbers[0].stat === 'by_territory.colour', 'A2 a capitalized name inside a sentence, an image id and a stat key stay as they are');
ok(s1.read.patterns[0].what_happened === 'They called it "a costume," not a memory. Color won.', 'A3 the comma moves inside the quote, stray spaces go, a sentence-initial word is fixed');
ok(s1.changes.length === 13 && s1.changes.every(c => c.pass === 'spelling' && c.path && c.from && c.to) && s1.changes.some(c => c.from === 'colour' && c.to === 'color' && c.path === 'title'), 'A4 every change is a receipt with its path');
ok(R.readAmerican({ t: 'Per cent of the labour force in Centre Pompidou.' }).read.t === 'Percent of the labor force in Centre Pompidou.', 'A5 two-word forms are handled; lowercase common nouns inside a sentence are fixed only when not names');

// ── the acceptance law ────────────────────────────────────────────────────
const base = { title: 'Proximity is the product', patterns: [{ name: 'n', evidence: ['S1', 'S2'], what_happened: 'Fans payed for 3 shows (S1, S2).', moves: { creative: 'Brief a cut.' } }] };
const fix = JSON.parse(JSON.stringify(base)); fix.patterns[0].what_happened = 'Fans paid for 3 shows (S1, S2).';
ok(R.readProofAccept(base, fix).ok, 'B1 a typo fix is accepted');
const badId = JSON.parse(JSON.stringify(base)); badId.patterns[0].what_happened = 'Fans paid for 3 shows (S1, S3).';
const badNum = JSON.parse(JSON.stringify(base)); badNum.patterns[0].what_happened = 'Fans paid for 4 shows (S1, S2).';
const badLen = JSON.parse(JSON.stringify(base)); badLen.patterns[0].what_happened = 'Fans paid for 3 shows (S1, S2), and then went on to buy the merchandise as well, which is a longer story.';
const badKey = JSON.parse(JSON.stringify(base)); delete badKey.patterns[0].moves; badKey.patterns[0].move = { creative: 'x' };
const badDash = JSON.parse(JSON.stringify(base)); badDash.title = 'Proximity — the product';
const badArr = JSON.parse(JSON.stringify(base)); badArr.patterns[0].evidence = ['S1'];
ok(/^sids:/.test(R.readProofAccept(base, badId).why) && /^numbers:/.test(R.readProofAccept(base, badNum).why) && /^length:/.test(R.readProofAccept(base, badLen).why), 'B2 a changed S-id, a changed number or a field that grew by more than a fifth is refused');
ok(/^keys:/.test(R.readProofAccept(base, badKey).why) && /^dash:/.test(R.readProofAccept(base, badDash).why) && /^shape:/.test(R.readProofAccept(base, badArr).why), 'B3 a renamed key, an em dash or a shorter list is refused');
const d = R.readProofDiff(base, fix);
ok(d.length === 1 && d[0].path === 'patterns[0].what_happened' && /payed/.test(d[0].from) && /paid/.test(d[0].to) && d[0].pass === 'editor', 'B4 the diff names the field and the words that changed');

// ── the desk, end to end ──────────────────────────────────────────────────
const ground = 'stats\nstory one 3 shows';
claude = (req) => ({ ok: true, text: JSON.stringify({ read: fix, changes: [] }), cost_usd: 0.09, truncated: false });
let run = await R.readProofRun({}, 'weekly', base, ground, [1, 2]);
ok(run.read.patterns[0].what_happened === 'Fans paid for 3 shows (S1, S2).' && run.receipt.lane === 'live' && run.receipt.model === 'claude-sonnet-5' && run.receipt.editor === 1 && run.receipt.cost_usd === 0.09 && run.notes.includes('proofread:1'), 'C1 the editor fixes a typo on the live tier and the receipt says so');
ok(claudeCalls[0].tier === 'live' && claudeCalls[0].req.kind === 'read_proof' && claudeCalls[0].req.temperature === 0 && claudeCalls[0].req.cache === true && /American English/.test(claudeCalls[0].req.system), 'C2 the editor is asked for American English on the live tier, at temperature zero');
claude = () => ({ ok: true, text: JSON.stringify({ read: badId }), truncated: false });
run = await R.readProofRun({}, 'weekly', base, ground, [1, 2]);
ok(run.read.patterns[0].what_happened === base.patterns[0].what_happened && /^proof_editor_skipped:editor_rejected:sids/.test(run.notes[0]) && run.receipt.lane === null, 'C3 an editor that changed an S-id is refused; the read stands');
claude = () => ({ ok: false, error: 'claude_cap' });
run = await R.readProofRun({}, 'weekly', base, ground, [1, 2]);
ok(run.notes[0] === 'proof_editor_skipped:claude_cap' && run.read.title === base.title, 'C4 at the cap the read is not blocked; the note says the editor was skipped');
const brit = { title: 'The colour of it', patterns: [] };
claude = () => ({ ok: false, error: 'claude_off' });
run = await R.readProofRun({}, 'weekly', brit, ground, []);
ok(run.read.title === 'The color of it' && run.receipt.spelling === 1 && run.receipt.changes === 1, 'C5 the spelling pass stands on its own when the editor is off');
claude = (req) => ({ ok: true, text: JSON.stringify({ read: Object.assign({}, fix, { title: 'Proximity is the 9 product' }) }), truncated: false });
run = await R.readProofRun({}, 'weekly', base, ground, [1, 2]);
ok(/editor_rejected:numbers:title/.test(run.notes[0]), 'C6 a number the editor invented is refused before the laws even run');

// ── landing ───────────────────────────────────────────────────────────────
fixtures = { 'house_reads?id=eq.9': () => [{ id: 9, kind: 'weekly', status: 'compiling', window_start: '2026-09-14', window_end: '2026-09-20', stats: {}, pack_ids: [1, 2], meta: { batch_id: 'b' } }] };
claude = () => ({ ok: true, text: JSON.stringify({ read: { title: 'Proximity is the product', thesis: 'Fans paid for proximity.', patterns: [{ name: 'n', evidence: ['S1'] }] } }), cost_usd: 0.05, truncated: false });
sb = [];
const L = await R.readLand({}, 9, JSON.stringify({ title: 'Proximity is the product', thesis: 'Fans payed for proximity.', patterns: [{ name: 'n', evidence: ['S1'] }] }), 0.21);
const patch = sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body;
ok(L.status === 'ready' && patch.read.thesis === 'Fans paid for proximity.' && patch.meta.proof.changes === 1 && patch.meta.batch_id === 'b' && patch.violations.includes('proofread:1') && patch.cost_usd === 0.21, 'L1 a landing read is proofread before it is ready; the receipt rides meta.proof beside what was there');
ok(/const pr = v\.read \? await readProofRun\(env, row\.kind, v\.read, ground, row\.pack_ids \|\| \[\], extra\)/.test(block), 'L2 readLand runs the desk on every written read');

// ── the door ──────────────────────────────────────────────────────────────
ok(/case '\/reads\/proof':         \/\/ SEAM:READ_PROOF recut\n        case '\/reads\/pdf':/.test(w), 'D1 /reads/proof is routed as an admin door');
let stash = {};
const env = { RATE_LIMIT: { get: async k => stash[k] || null, put: async (k, v) => { stash[k] = v; }, delete: async k => { delete stash[k]; } } };
fixtures = { 'house_reads?id=eq.7': () => [{ id: 7, kind: 'weekly', status: 'published', window_start: '2026-09-14', window_end: '2026-09-20', stats: {}, pack_ids: [1, 2], violations: [], meta: { pdf: { key: 'k', stamp: 'old' } },
  read: { title: 'The colour of proximity', thesis: 'Fans payed for it.', patterns: [{ name: 'n', evidence: ['S1'] }] } }] };
claude = () => ({ ok: true, text: JSON.stringify({ read: { title: 'The color of proximity', thesis: 'Fans paid for it.', patterns: [{ name: 'n', evidence: ['S1'] }] } }), cost_usd: 0.1, truncated: false });
claudeCalls = []; sb = [];
const dry = await R.readRoute('/reads/proof', { id: 7, apply: false }, env, '', { id: 'admin' });
ok(dry.ok && !dry.applied && dry.proof.changes === 2 && dry.proof.spelling === 1 && dry.proof.editor === 1 && !sb.some(x => x.opts && x.opts.method === 'PATCH'), 'D2 a dry run lists every fix (spelling and editor) and writes nothing');
const wet = await R.readRoute('/reads/proof', { id: 7, apply: true }, env, '', { id: 'admin' });
const wp = sb.find(x => x.opts && x.opts.method === 'PATCH').opts.body;
ok(wet.ok && wet.applied && claudeCalls.length === 1 && wp.read.title === 'The color of proximity' && wp.read.thesis === 'Fans paid for it.' && wp.meta.proof.applied_by === 'admin' && wp.meta.pdf.stamp === 'old' && wp.violations.includes('proofread:2'), 'D3 applying what was just shown spends nothing twice; the read is rewritten and the kept PDF is left to fall out of date');
ok(!(await R.readRoute('/reads/proof', { id: 7 }, env, '', { id: 'nobody' })).ok, 'D4 the door is admin only');

// ── the law, the page, the gate ───────────────────────────────────────────
ok(/2\. \*\*American English only\.\*\* Every word of the read is English, spelled and punctuated the American way/.test(method) && R.READ_METHOD === method, 'M1 the Method says American English only, in the file and in the worker alike');
ok(/id="proof">Proofread<\/button>/.test(page) && /call\("\/reads\/proof", \{ id: row\.id, apply: false \}\)/.test(page) && /call\("\/reads\/proof", \{ id: row\.id, apply: true \}\)/.test(page), 'P1 the page has a Proofread button: a dry run first, then Apply');
ok(/function proofPanel\(html\)/.test(page) && /fix' \+ \(r\.changes === 1 \? '' : 'es'\) \+ ' proposed/.test(page) && /editor skipped/.test(page), 'P2 the fixes panel shows every fix, and says when the editor was skipped');
ok(/READ_PROOF receipt/.test(page) && /row\.meta\.proof\.applied_at/.test(page), 'P3 a proofread read carries its receipt in the bar');
ok(/'readProof': 'claudeGate on the live tier/.test(gate), 'G1 readProof is a registered spender');
ok(JSON.parse(fs.readFileSync('seams.json', 'utf-8')).registry['SEAM:READ_PROOF'].file === 'worker/src/index.js', 'G2 SEAM:READ_PROOF is registered');
ok(!/—/.test(R.READ_PROOF_SYS), 'G3 the desk carries no em dash');
console.log(`\nproof_read_proof: ${pass} checks PASS`);
