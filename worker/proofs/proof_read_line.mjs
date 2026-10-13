/**
 * proof_read_line.mjs  --  EX44 THE LINE (SEAM:READ_LINE): the desk's revision, made strong.
 * Notes pinned to a line are edited at once on the line desk and the new version is written ready or held on the
 * spot; a figure the edit brings in is cleared once; anything else takes the full revision; a revise on nothing is
 * refused; every revision keeps a receipt of what changed and any note it left untouched.
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
const clone = x => JSON.parse(JSON.stringify(x));

// ── a small house_reads table ────────────────────────────────────────────
let live = {}, nextId = 30, deskRows = [], submitted = [], posts = [], claudeCalls = [], lineReply = null, clearReply = null;
const sbRest = async (env, path, opts) => {
  let m;
  if ((m = /^house_reads\?id=eq\.(\d+)/.exec(path))) {
    if (opts && opts.method === 'PATCH') { live[m[1]] = Object.assign(live[m[1]] || {}, clone(opts.body)); return []; }
    return live[m[1]] ? [clone(live[m[1]])] : [];
  }
  if (/^house_reads\?kind=eq\.\w+&window_start=eq\./.test(path)) { const vs = Object.values(live).sort((a, b) => b.version - a.version); return vs.length ? [{ id: vs[0].id, version: vs[0].version, status: vs[0].status }] : []; }
  if (path.startsWith('house_reads?select=*') && opts && opts.method === 'POST') { const r = Object.assign({ id: nextId++ }, clone(opts.body[0])); live[r.id] = r; posts.push(r); return [clone(r)]; }
  if (path.startsWith('house_desk?')) return deskRows;
  return [];
};
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'callClaude', 'extractJson', 'sha256hex', 'CLAUDE',
  pmj + block + '; return { readRoute, readLand, readLinePlan, readLineAccept, readReviseAfter, READ_LINE, READ_LINE_SYS };')(
  sbRest, async (env, tier, kind, items) => { submitted.push({ tier, kind, items }); return { ok: true, batch_id: 'b1', est_usd: 1.2 }; }, async () => ({}),
  async (e, u) => u === 'admin', (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(),
  async (env, tier, req) => { claudeCalls.push({ tier, req }); const line = (/THE LINE \([^)]*\):\n([\s\S]*?)\n\n/.exec(req.prompt) || [])[1] || '';
    return { ok: true, cost_usd: 0.003, text: JSON.stringify({ text: (req.kind === 'read_line' ? lineReply : clearReply)(line, req) }) }; },
  (t) => { try { return JSON.parse(t); } catch (e) { return null; } }, async (t) => 'h' + t.length, { TIERS: { live: { model: 'claude-sonnet-5' } } });

const READ = {
  title: 'Makers brake their machines, buyers buy the nineties', thesis: 'The companies building AI spent the week slowing down. Buyers went looking for the past.',
  patterns: [{ name: 'The pause is the product', what_happened: 'Two makers paused launches.', evidence: ['S11'] }],
  social: { cover_line: 'Wallpaper* in 1996, worn again', caption: 'The look of 1996 is back on the cover of Wallpaper*.', frames: [] }
};
const CLEAN = Object.assign(clone(READ), { social: { cover_line: 'Wallpaper*, worn again', caption: 'The look is back on the cover of Wallpaper*.', frames: [] } });   // a ready read carries no unsourced figure
const HELD = ['number_not_in_evidence:social.caption:1996', 'number_not_in_evidence:social.cover_line:1996', 'style:opener:social.frames[4].headline:numeral', 'proofread:3'];
const base = (o) => Object.assign({ id: 22, kind: 'weekly', status: 'held', version: 2, window_start: '2026-10-05', window_end: '2026-10-11', label: 'Week of Oct 5, 2026',
  stats: { stories: 2 }, pack_ids: [11], read: clone(READ), violations: HELD.slice(), error: 'held_for_review', meta: { issue_no: 4, proof: { lane: 'live', reason: null } } }, o || {});
const reset = (row) => { live = { 22: clone(row) }; nextId = 30; deskRows = []; submitted = []; posts = []; claudeCalls = []; };
const dropYear = l => l.replace(/ in 1996/, '').replace(/The look of 1996/, 'The look');
const admin = { id: 'admin', email: 'fresco@x' };

// ── the pure laws ────────────────────────────────────────────────────────
const pl = R.readLinePlan(READ, [{ scope: 'thesis', text: 'a' }, { scope: 'patterns[0]', text: 'b' }, { scope: 'findings[2]', text: 'c' }, { scope: '', text: 'd' }, { scope: 'social.caption', text: 'e' }]);
ok(pl.paths.join(',') === 'thesis,social.caption' && pl.whole.length === 3, 'P1 a note pinned to a line of text is the line desk\'s; a section, a missing path or the whole read is the full revision\'s');
ok(R.readLineAccept('In 1996, worn', 'Worn again', ['1996']) === null && R.readLineAccept('In 1996, worn', 'In 1996 worn', ['1996']) === 'figure_kept' &&
  R.readLineAccept('Worn', 'Worn — again', null) === 'dash' && R.readLineAccept('Worn', 'x'.repeat(400), null) === 'longer' && R.readLineAccept('Worn', ' ', null) === 'empty',
  'P2 an edited line stands unless it is empty, carries an em dash, more than doubles, or keeps a figure it was held on');

// ── L: the week of Oct 5, revised on its holds alone ─────────────────────
reset(base()); lineReply = dropYear;
const l1 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(l1.ok && l1.lane === 'line' && l1.status === 'ready' && l1.changes === 2 && l1.version === 3 && l1.notes === 2, 'L1 a held read with no desk note is revised on its holds on the line desk: version 3, ready, two lines');
ok(submitted.length === 0 && claudeCalls.length === 2 && claudeCalls.every(c => c.tier === 'live' && c.req.kind === 'read_line' && /HELD: 1996 is in no line of the evidence/.test(c.req.prompt)), 'L2 no batch, no recompile: one live-tier call per line, each carrying its hold as a note');
const v3 = live[30];
ok(v3.status === 'ready' && v3.error === null && v3.read.social.cover_line === 'Wallpaper*, worn again' && v3.read.title === READ.title && JSON.stringify(v3.read.patterns) === JSON.stringify(READ.patterns), 'L3 the new version carries the edited lines and every other field exactly as it was');
ok(!v3.violations.some(x => /^number_not_in_evidence/.test(x)) && v3.violations.includes('style:opener:social.frames[4].headline:numeral') && v3.stats.stories === 2 && v3.pack_ids[0] === 11 && v3.label === 'Week of Oct 5, 2026',
  'L4 the holds are gone, the notes stay, the stats, pack and label are the prior\'s');
ok(v3.meta.plan === 'revise' && v3.meta.lane === 'line' && v3.meta.revised_from === 22 && v3.meta.revised_from_version === 2 && v3.meta.issue_no === 4 && v3.meta.proof.lane === 'live' &&
  v3.meta.revision.lane === 'line' && v3.meta.revision.diff.length === 2 && v3.meta.revision.holds.join(',') === 'social.caption,social.cover_line' && v3.meta.revision.cost_usd === 0.006,
  'L5 the receipt: the plan, what it revises, the issue and the desk carried, every line that changed, the holds it applied, the spend');
ok(live[22].status === 'held' && JSON.stringify(live[22].read) === JSON.stringify(READ), 'L6 the prior version is untouched: a revision is a new version, never an overwrite');

// ── N: a desk note pinned to a line ──────────────────────────────────────
reset(base({ read: clone(CLEAN), status: 'ready', violations: ['proofread:3'], error: null, meta: { issue_no: 4, notes: [{ n: 1, scope: 'thesis', text: 'Lead with the buyers.', status: 'open', by: 'josh' }] } }));
lineReply = () => 'Buyers went looking for the past while the companies building AI slowed down.';
const n1 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(n1.ok && n1.lane === 'line' && n1.status === 'ready' && live[30].read.thesis.startsWith('Buyers went looking') && /1\. \[thesis\] Lead with the buyers\. \(josh\)/.test(claudeCalls[0].req.prompt), 'N1 a note pinned to the thesis edits the thesis at once, the note in the prompt');
ok(live[22].meta.notes[0].status === 'applied' && live[22].meta.notes[0].applied_in === 30 && live[30].meta.notes[0].status === 'applied' && live[30].meta.revision.changes[0].notes[0] === 1, 'N2 the note is marked applied on both versions and named on the change');

// ── C: a line edit that brings a figure in is cleared once ───────────────
reset(base({ read: clone(CLEAN), status: 'ready', violations: [], error: null, meta: { notes: [{ n: 1, scope: 'thesis', text: 'Say how long.', status: 'open' }] } }));
lineReply = () => 'The companies building AI spent 2001 days slowing down. Buyers went looking for the past.';
clearReply = l => l.replace(' 2001 days', ' the week');
const c1 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(c1.ok && c1.status === 'ready' && live[30].meta.revision.clear.length === 1 && live[30].meta.revision.clear[0].figures[0] === '2001' && !/2001/.test(live[30].read.thesis), 'C1 the edit brought in a figure the evidence does not give; it is cleared once and the version lands ready');
clearReply = l => l;   // the clear keeps the figure: refused, so the version lands held and says why
reset(base({ read: clone(CLEAN), status: 'ready', violations: [], error: null, meta: { notes: [{ n: 1, scope: 'thesis', text: 'Say how long.', status: 'open' }] } }));
const c2 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(c2.ok && c2.status === 'held' && live[30].violations.includes('number_not_in_evidence:thesis:2001') && live[30].error === 'held_for_review', 'C2 a figure that cannot be cleared holds the new version and names the line');

// ── F: what still takes the full revision, and what is refused ───────────
reset(base({ read: clone(CLEAN), status: 'ready', violations: [], error: null, meta: { notes: [{ n: 1, scope: '', text: 'Tighten the whole read.', status: 'open' }] } }));
const f1 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(f1.ok && f1.lane === 'full' && submitted.length === 1 && claudeCalls.length === 0, 'F1 a note on the whole read takes the full revision (batch)');
reset(base({ read: clone(CLEAN), status: 'ready', violations: [], error: null, meta: {} })); deskRows = [{ kind: 'weekly', inputs: 'Name the mechanism.' }];
const f2 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(!f2.ok && f2.error === 'no_notes' && posts.length === 0 && submitted.length === 0, 'F2 Revise with no note and no hold is refused and nothing is spent (the Oct 13 v2)');
const f3 = await R.readRoute('/reads/revise', { id: 22, inputs: true }, {}, '', admin);
ok(f3.ok && f3.lane === 'full' && submitted.length === 1, 'F3 re-applying the standing inputs is asked for on purpose');
reset(base()); lineReply = l => l;   // the line desk keeps the year: refused, nothing written, the full revision offered
const f4 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin);
ok(!f4.ok && f4.lane === 'line' && f4.retry === 'full' && /^refused:figure_kept:social\.caption$/.test(f4.error) && posts.length === 0, 'F4 a line the desk cannot fix writes nothing and offers the full revision');
const f5 = await R.readRoute('/reads/revise', { id: 22, lane: 'full' }, {}, '', admin);
ok(f5.ok && f5.lane === 'full' && submitted.length === 1 && /HELD: 1996/.test(submitted[0].items[0].prompt), 'F5 lane full forces the full revision, which carries the holds (EX43)');
reset(base({ kind: 'recon', read: clone(CLEAN), status: 'ready', violations: [], error: null, meta: { notes: [{ n: 1, scope: 'thesis', text: 'x', status: 'open' }] } }));
const f6 = await R.readRoute('/reads/revise', { id: 22 }, {}, '', admin).catch(e => ({ error: String(e) }));
ok(f6.lane !== 'line' && claudeCalls.length === 0, 'F6 a RECON is never edited on the line desk (its revisions are paid inside its ceiling)');

// ── A: a full revision lands with its receipt ────────────────────────────
reset(base({ read: clone(CLEAN), status: 'ready', violations: [], error: null }));
live[31] = { id: 31, kind: 'weekly', status: 'held', version: 3, window_start: '2026-10-05', window_end: '2026-10-11', stats: { stories: 2 }, pack_ids: [11], error: 'held_for_review',
  read: Object.assign(clone(READ), { title: 'A new title', social: { cover_line: 'Wallpaper*, worn again', caption: READ.social.caption, frames: [] } }), violations: ['number_not_in_evidence:social.caption:1996'],
  meta: { plan: 'revise', revised_from: 22, notes: [{ n: 1, scope: 'thesis', text: 'Lead with the buyers.', status: 'applied' }, { n: 2, scope: 'title', text: 'Sharper.', status: 'applied' }] } };
clearReply = dropYear;
const a1 = await R.readReviseAfter({}, 31);
ok(a1.status === 'ready' && a1.cleared === 1 && a1.unapplied === 1 && live[31].status === 'ready' && !/1996/.test(live[31].read.social.caption), 'A1 a full revision that lands held on a figure is cleared once: ready');
ok(live[31].meta.revision.lane === 'full' && live[31].meta.revision.unapplied[0].scope === 'thesis' && live[31].meta.revision.diff.some(d => d.path === 'title'), 'A2 the receipt names the change and the note the writer left untouched (NOT APPLIED)');
ok(/if \(pr\.read && row\.meta && row\.meta\.plan === 'revise'\) \{   \/\/ SEAM:READ_LINE/.test(w) && /const after = await readReviseAfter\(env, id\)\.catch\(e => \{ console\.log\('read_revise_after'/.test(w), 'A3 readLand writes the receipt for every revision that lands, and a failure there never blocks the landing');

// ── the page, the gate, the registry ────────────────────────────────────
ok(/<datalist id="desk-paths">/.test(page) && /list="desk-paths"/.test(page) && /function deskPaths\(o\)/.test(page), 'G1 the scope field offers every line of the read');
ok(/esc\(deskReviseLabel\(row, open\)\)/.test(page) && /line edit, instant/.test(page) && /full revision/.test(page), 'G2 the Revise button names its lane and counts notes and holds');
ok(/if \(pend\.length >= 3\) call\("\/reads\/note"/.test(page) && /if \(d && d\.ok && d\.lane === "line"\) \{ openRead\(d\.id\); return; \}/.test(page) && /rv\.onclick = full;/.test(page), 'G3 Revise takes the typed note with it, opens the new version at once, and offers the full revision when the line desk refuses');
ok(/id="desk-inputs"[^>]*>Re-apply standing inputs/.test(page) && /inputs: true, lane: "full"/.test(page), 'G4 re-applying the standing inputs is its own button');
ok(/'<div class="doc">' \+ revHtml\(row\)/.test(page) && /h \+= revHtml\(row\);/.test(page) && /WHAT CHANGED/.test(page) && /NOT APPLIED/.test(page), 'G5 a revised read shows what changed and any note not applied');
ok(/'readLinePart': 'claudeGate on the live tier/.test(gate) && seams.registry['SEAM:READ_LINE'].file === 'worker/src/index.js' && seams.registry['SEAM:READ_LINE@page'].file === 'intelligence/read/index.html',
  'G6 readLinePart is a registered spender; the seam is registered for the worker and the page');

console.log(`proof_read_line: ${pass} passed`);
