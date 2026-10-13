/**
 * proof_read_clear.mjs  --  EX43 THE HOLD (SEAM:READ_CLEAR): a held read can be cleared from the product.
 * The fixture is the week of Oct 5: held on "1996" in social.cover_line and social.caption, a figure in no
 * line of the evidence. Fix the hold rewrites those lines without it and the read lands ready; a rewrite that
 * keeps the figure or brings a new one is refused; a revision of a held read carries its holds as notes.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';

let sb = [], fixtures = {}, claude = null, claudeCalls = [];
const sbRest = async (env, path, opts) => { sb.push({ path, opts }); for (const k of Object.keys(fixtures)) if (path.startsWith(k)) return fixtures[k](path, opts); return []; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'callClaude', 'extractJson', 'sha256hex', 'CLAUDE',
  pmj + block + '; return { readRoute, readValidate, readHoldFigures, readHoldNotes, readClearAccept, readPathGet, readPathSet, readNotesText, READ_CLEAR };')(
  sbRest, async () => ({ ok: true }), async () => ({}), async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async (env, tier, req) => { claudeCalls.push({ tier, req }); return typeof claude === 'function' ? claude(req) : claude; },
  (t) => { try { return JSON.parse(t); } catch (e) { return null; } }, async (t) => 'h' + t.length, { TIERS: { live: { model: 'claude-sonnet-5' } } });

// ── the fixture: the held weekly ─────────────────────────────────────────
const READ = {
  title: 'Makers brake their machines, buyers buy the nineties', thesis: 'The companies building AI spent the week slowing down. Buyers went looking for the past.',
  social: { cover_line: 'Wallpaper* in 1996, worn again', caption: 'The look of 1996 is back on the cover of Wallpaper*. Makers slowed their machines while buyers bought the past.',
    frames: [{ kicker: 'The week', headline: 'Makers slow down', line: 'Two of the week’s stories name a pause.', evidence: ['S11'] }] }
};
const VIOL = ['number_not_in_evidence:social.caption:1996', 'number_not_in_evidence:social.cover_line:1996', 'style:opener:social.frames[4].headline:numeral', 'proofread:3'];
const held = () => [{ id: 22, kind: 'weekly', status: 'held', version: 2, window_start: '2026-10-05', window_end: '2026-10-11', label: 'Week of Oct 5, 2026',
  stats: { stories: 2 }, pack_ids: [11], read: JSON.parse(JSON.stringify(READ)), violations: VIOL.slice(), error: 'held_for_review', meta: { issue_no: 4 } }];
const fx = (rows) => { fixtures = { 'house_reads?id=eq.': () => rows(), 'editions?': () => [], 'edition_items?': () => [] }; };
const patchOf = () => { const p = sb.filter(x => x.opts && x.opts.method === 'PATCH').pop(); return p && p.opts.body; };

// ── the bug, as it stood ─────────────────────────────────────────────────
ok(R.readValidate('weekly', READ, JSON.stringify({ stories: 2 }), [11], []).fatal.length === 2, 'H0 the fixture holds as the week of Oct 5 held: 1996 in the cover line and the caption');

// ── the pure laws ────────────────────────────────────────────────────────
const hf = R.readHoldFigures(VIOL);
ok(JSON.stringify(hf.by) === JSON.stringify({ 'social.caption': ['1996'], 'social.cover_line': ['1996'] }) && hf.other.length === 0, 'C1 the holds are read per line, the notes are not holds');
ok(R.readHoldFigures(['missing_title_or_thesis', 'number_not_in_evidence:title:12']).other[0] === 'missing_title_or_thesis', 'C2 a hold that is not a figure is set apart');
const r0 = JSON.parse(JSON.stringify(READ));
ok(R.readPathGet(r0, 'social.frames[0].headline') === 'Makers slow down' && R.readPathSet(r0, 'social.frames[0].headline', 'x') && r0.social.frames[0].headline === 'x' && R.readPathGet(r0, 'nope[3].x') === undefined,
  'C3 a dot path reads and writes into the read (social.frames[0].headline)');
ok(R.readClearAccept('Wallpaper* in 1996, worn again', 'Wallpaper*, worn again', ['1996']) === null, 'C4 a line without the figure is accepted');
ok(R.readClearAccept('Wallpaper* in 1996, worn again', 'Wallpaper* in 1996 again', ['1996']) === 'figure_kept', 'C5 a line that keeps the figure is refused');
ok(R.readClearAccept('Wallpaper* in 1996, worn again', 'Wallpaper*, worn 30 years on', ['1996']) === 'number_added:30', 'C6 a line that brings a new number is refused');
ok(R.readClearAccept('Two of 3 stories (S11) in 1996', 'Two of 3 stories in 1996', ['1996']) === 'figure_kept' && R.readClearAccept('3 stories (S11) in 1996', '3 stories', ['1996']) === 'sids', 'C7 the S-ids hold');
ok(R.readClearAccept('In 1996, worn', 'Worn again and again and again by everybody', ['1996']) === 'longer' && R.readClearAccept('In 1996, worn', 'Worn — again', ['1996']) === 'dash', 'C8 a line that grows or carries an em dash is refused');

// ── Fix the hold: the week of Oct 5 lands ready ──────────────────────────
fx(held); sb = []; claudeCalls = [];
claude = (req) => {
  const line = /THE LINE \([^)]*\):\n([\s\S]*?)\n\nTHE FIGURE/.exec(req.prompt)[1];
  return { ok: true, cost_usd: 0.004, text: JSON.stringify({ text: line.replace(/ in 1996/, '').replace(/The look of 1996/, 'The look') }) };
};
const d1 = await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'admin' });
ok(d1.ok && d1.status === 'ready' && d1.changes.length === 2 && d1.fatal.length === 0, 'F1 Fix the hold rewrites both lines and the laws pass: ready');
ok(claudeCalls.length === 2 && claudeCalls.every(c => c.tier === 'live' && c.req.kind === 'read_clear' && /1996/.test(c.req.prompt)), 'F2 one live-tier call per held line, each told the figure');
const p1 = patchOf();
ok(p1.status === 'ready' && p1.error === null && p1.read.social.cover_line === 'Wallpaper*, worn again' && !/1996/.test(p1.read.social.caption) && p1.read.title === READ.title,
  'F3 the row is written ready with the rewritten lines and every other field as it was');
ok(!p1.violations.some(x => /^number_not_in_evidence/.test(x)) && p1.violations.includes('style:opener:social.frames[4].headline:numeral') && p1.violations.includes('proofread:3'),
  'F4 the stale holds go, the notes stay (the sell law reads holds_remain from these)');
ok(p1.meta.issue_no === 4 && p1.meta.clear.changes.length === 2 && p1.meta.clear.changes[0].figures[0] === '1996' && p1.meta.clear.by === 'admin' && d1.cost_usd === 0.008, 'F5 the receipts are kept in meta.clear, the rest of meta stands, the spend is counted');

// ── refusals ─────────────────────────────────────────────────────────────
fx(held); sb = []; claude = () => ({ ok: true, cost_usd: 0.004, text: '{"text":"Wallpaper* in 1996 again"}' });
const d2 = await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'admin' });
ok(!d2.ok && /^refused:figure_kept:social\.caption$/.test(d2.error) && !patchOf(), 'R1 a rewrite that keeps the figure is refused and nothing is written');
fx(() => [Object.assign(held()[0], { violations: ['missing_title_or_thesis'] })]); sb = [];
const d3 = await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'admin' });
ok(!d3.ok && d3.error === 'needs_revise' && d3.holds[0] === 'missing_title_or_thesis', 'R2 a hold that is not a figure answers needs_revise');
fx(() => [Object.assign(held()[0], { status: 'ready' })]);
ok((await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'admin' })).error === 'not_held', 'R3 only a held read is cleared');
ok((await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'x' }))._status === 403, 'R4 admin only');
fx(held); claude = () => ({ ok: false, error: 'claude_network' });
ok((await R.readRoute('/reads/clear', { id: 22 }, {}, '', { id: 'admin' })).error === 'claude_network:social.caption', 'R5 a failed call says which line, and writes nothing');

// ── Revise carries the holds ─────────────────────────────────────────────
const hn = R.readHoldNotes(held()[0]);
ok(hn.length === 2 && hn[0].scope === 'social.caption' && /^HELD: 1996 is in no line of the evidence\. Rewrite this line without that figure/.test(hn[0].text) && hn[0].by === 'the laws', 'D1 a held read\'s holds become pinned notes');
ok(R.readHoldNotes(Object.assign(held()[0], { status: 'ready' })).length === 0, 'D2 a ready read carries no hold notes');
ok(/^1\. \[social\.caption\] HELD: 1996/.test(R.readNotesText(hn)), 'D3 the notes read in the prompt as any desk note does');
ok(/const notes = readNotesOpen\(row\)\.concat\(readHoldNotes\(prior\)\);/.test(w), 'D4 readSubmitRevision reads the holds of the read it revises (the Oct 13 v2 was revised on 0 notes and came back held)');
ok(/if \(!notes\.length && !desk\) \{ if \(!readHoldNotes\(row\)\.length\) return json\(\{ ok: false, error: 'nothing_to_apply' \}/.test(w), 'D5 revise is never refused on a held read');

// ── the page, the gate, the registry ────────────────────────────────────
ok(/id="clearhold"/.test(page) && /call\("\/reads\/clear", \{ id: row\.id \}\)/.test(page) && /SEAM:READ_CLEAR/.test(page), 'P1 every held read shows Fix the hold, which calls /reads/clear');
ok(/row\.status === "held"\) standPanel\(/.test(page) && /lands on the stand once the hold is cleared/.test(page), 'P2 a held weekly\'s stand bar says why it cannot land');
ok(/id="reland" title="Runs the stored text through the laws again\. It clears a hold only after a code fix"/.test(page), 'P3 Re-land says what it is for');
ok(/case '\/reads\/clear':/.test(w), 'G1 /reads/clear is routed');
ok(/'readClearPart': 'claudeGate on the live tier/.test(gate), 'G2 readClearPart is a registered spender');
ok(seams.registry['SEAM:READ_CLEAR'].file === 'worker/src/index.js' && seams.registry['SEAM:READ_CLEAR@page'].file === 'intelligence/read/index.html', 'G3 the seam is registered for the worker and the page');

console.log(`proof_read_clear: ${pass} passed`);
