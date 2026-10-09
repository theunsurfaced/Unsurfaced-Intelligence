/**
 * proof_excavate_depth.mjs  --  SEAM:EXC_DEPTH and SEAM:READ_SALVAGE (EX24, part two).
 * A quick read is a real mode, cached apart from the full one; a house read's reply that is cut or wrapped keeps what it
 * finished, a reply with no read in it is sent once more before the row is held, and a hold names what came back.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the quick read in synthesize ────────────────────────────────────────────────────────────────────────────────
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
ok(/const quick = body\.depth === 'quick';\n[\s\S]{0,400}?if \(quick\) body = Object\.assign\(\{\}, body, \{ pages: false, gap: false, facts: false \}\);/.test(synth),
  'A1 depth quick turns off the slow middle: the pages read in full, the gap round and the fact table; the competitive set and the counter view keep their retry (SEAM:EXC_RAILS)');
ok(/sha256hex\(query\.toLowerCase\(\)\.trim\(\) \+ '\|' \+ String\(body\.mode \|\| ''\) \+ \(quick \? '\|quick' : ''\) \+ '\|' \+ EXC_READ\.REV\)/.test(synth), 'A2 a quick read is cached under its own key, never served as a full read, and the key carries the read revision (SEAM:EXC_QUICK)');
ok(/const depthLaw = quick \? ' QUICK READ: give 4 to 5 insights and 3 moves/.test(synth) && /EXC_NUMBER_LAW \+ depthLaw \+ thinLaw \+ disagreeLaw \+ aheadLaw \+ clientLaw, prompt: usr,\n      max_tokens: quick \? EXC_ROOM\.quick : \(isReport \? EXC_ROOM\.report : EXC_ROOM\.plain\)/.test(synth),
  'A3 the quick writer is asked for 4 to 5 findings and 3 moves in its own room; every law still rides the system prompt');
ok(/depth: quick \? 'quick' : 'full',   \/\/ SEAM:EXC_DEPTH/.test(synth), 'A4 the payload says its depth, so the page and the receipts can show it');
const room = JSON.parse(between(w, 'const EXC_ROOM = ', ';').replace('const EXC_ROOM = ', '').replace(/(\w+):/g, '"$1":'));
ok(room.quick === 9000 && room.report === 16000 && room.plain === 8000, 'A5 the quick room is 9000; the report and plain rooms are unchanged');

// ── B: salvage and the resend in readLand ──────────────────────────────────────────────────────────────────────────
const land = between(w, 'async function readLand(env, id, text, cost, stopReason, force) {', 'async function readProof(');
ok(/const whole = parseModelJson\(text\) \|\| extractJson\(text\);[^\n]*\n  let parsed = whole && typeof whole === 'object' && !Array\.isArray\(whole\) \? whole : \(excSalvage\(text, 0\) \|\| null\);\n  const salvaged = !!parsed && parsed !== whole;/.test(land),
  'B1 a cut or wrapped reply is salvaged with the EXCAVATE writer\'s own salvage, and the landing knows it was');
ok(/if \(!parsed && !think0 && !force && !\(row\.meta && row\.meta\.resent\)\) \{/.test(land) && /readPatch\(env, id, \{ status: 'queued', meta: row\.meta, error: 'resent_once: the first reply had no read in it' \}\)/.test(land)
  && /const again = await readSubmit\(env, Object\.assign\(\{\}, row, \{ status: 'queued' \}\)\)/.test(land) && /if \(again && again\.ok\) return \{ resent: true, batch_id: again\.batch_id \|\| null \};/.test(land),
  'B2 a reply with no read in it is sent once more by itself, marked on the row so it is never sent a third time; a RECON written in passes keeps its own fallback; a re-land never resends');
ok(/\(truncated \? 'truncated_max_tokens' : 'unparsable'\) \+ ': ' \+ String\(text \|\| ''\)\.length \+ ' chars; head: '/.test(land) && /'held_for_review' \+ \(salvaged \? ' \(salvaged from a ' \+ \(truncated \? 'cut' : 'wrapped'\) \+ ' reply\)' : ''\)/.test(land),
  'B3 a hold names the reply\'s length, head and tail, and says when the read landed from a salvaged reply');
// The salvage itself, on the shapes that held RECON 002 v1 and the Oct 2 reads.
const xj = between(w, 'function jsonRepair(', '// Server-side connectors');
const X = new Function(xj + '; return { excSalvage, extractJson };')();
const report = { title: 'Jordan sells heritage to buyers who never saw it', thesis: 't', findings: [{ claim: 'a', evidence: ['S1'] }, { claim: 'b', evidence: ['S2'] }], moves: [{ headline: 'm' }] };
const full = JSON.stringify(report);
const cut = full.slice(0, full.indexOf('"moves"') - 1);
const wrapped = 'Here is the RECON you asked for:\n```json\n' + full + '\n```\nLet me know if you want changes.';
ok(Array.isArray(X.extractJson(cut)) && X.excSalvage(cut, 0).findings.length === 2 && X.excSalvage(cut, 0).title === report.title, 'B4 a reply cut while writing the moves hands extractJson a bare array, so the landing takes the salvage: title, thesis and both findings');
ok(X.extractJson(wrapped).findings.length === 2, 'B5 a reply wrapped in prose and fences parses whole');
ok(X.excSalvage('', 0) === null && X.excSalvage('I cannot write this report.', 0) === null, 'B6 an empty or refused reply has nothing to salvage, which is what sends the compile once more');

// ── C: the page ────────────────────────────────────────────────────────────────────────────────────────────────────
const dp = between(page, '/* SEAM:EXC_DEPTH: Quick / Full.', 'async function runLiveSearch(q){');
const store = {}; const win = {};
const D = new Function('localStorage', 'window', 'document', dp + '; return { _depthGet, setDepth, _depthLabel, _DEPTH_DEEP_TASKS };')(
  { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, win, { querySelectorAll: () => [], getElementById: () => null });
ok(D._depthGet() === 'full', 'C1 Full is the default');
D.setDepth('quick');
ok(D._depthGet() === 'quick' && win._depth === 'quick', 'C2 the choice is remembered in this browser');
D.setDepth('whatever');
ok(D._depthGet() === 'full' && D._depthLabel('quick') === 'Quick read' && /worth the full read/.test(D._DEPTH_DEEP_TASKS.brief) && !D._DEPTH_DEEP_TASKS.read,
  'C3 anything but quick is full; a brief, a comparison and a read across time say they deserve the full read, a plain read says nothing');
ok(/depth:\(window\._depth\|\|_depthGet\(\)\), cls:_gm\.cls\|\|null/.test(page), 'C4 the read sends its depth to the door');
ok(/<span class="depth-switch" id="depth-switch"[^>]*><button type="button" data-depth="quick" onclick="setDepth\('quick'\)">Quick<\/button><button type="button" data-depth="full" class="on" onclick="setDepth\('full'\)">Full<\/button><\/span>/.test(page),
  'C5 the switch sits beside Search with Full on');
ok(/synthesis\.depth==='quick'\)\{ gd\.insertAdjacentHTML\('afterbegin','<button class="btn-go-deeper" type="button" onclick="goDeeper\(\)">Go deeper: the full read<\/button>'\)/.test(page)
  && /function goDeeper\(\) \{[\s\S]*setDepth\('full'\);[\s\S]*runSearch\(\);/.test(page), 'C6 a quick read ends with Go deeper, which runs the full read on the same frame');
ok(/_inRender\(\) \{\n  const row = [^\n]*\n  if \(typeof _depthRender === 'function'\) _depthRender\(\);/.test(page), 'C7 the depth note reads the interpreter\'s task as soon as the chips land');

// ── D: the nav (SEAM:EXC_NAV) ──────────────────────────────────────────────────────────────────────────────────────
const nav = between(page, '<nav>', '</nav>');
ok(!/<ul class="nav-links">/.test(nav) && /<div class="nav-menu" id="nav-menu">/.test(nav) && /<ul class="nav-menu-list" id="nav-menu-list">/.test(nav), 'D1 the row of tabs is one dropdown');
ok(['nav-explore', 'nav-brands', 'nav-audiences', 'nav-library', 'nav-spaces'].every(id => nav.includes('id="' + id + '"')) && /<a class="nlb" href="\.\.\/">/.test(nav), 'D2 every door the tabs had is in the menu with its id, so navTo and the doors that light a tab work unchanged');
ok(/<li id="nav-read-li" style="display:none"><a class="nlb" id="nav-read" href="read\/">READ/.test(nav) && /_cmAdmin\(\)\.then\(a => \{ const li = document\.getElementById\('nav-read-li'\); if \(li\) li\.style\.display = a \? '' : 'none'; \}\)/.test(page), 'D3 READ is in the menu for admins, hidden until the house confirms one');
ok(/_navMenuName\(section\); navMenuClose\(\);/.test(page) && /document\.addEventListener\('click', e => \{ const m = document\.getElementById\('nav-menu'\); if \(m && !m\.contains\(e\.target\)\) navMenuClose\(\); \}\)/.test(page) && /if \(e\.key === 'Escape'\) navMenuClose\(\);/.test(page),
  'D4 the trigger names the section you are in; the menu closes on a choice, an outside click or Escape');
ok(/\.nav-menu-list\{[^}]*z-index:var\(--z-menu\)/.test(page) && !/nav \.nav-links/.test(page), 'D5 the menu stacks on a token and the room-era overrides address the menu, not the old row');
ok(!/\u2014/.test(land.split('\n').filter(l => /SEAM:READ_SALVAGE|resent|salvaged|whole/.test(l)).join('\n') + dp + between(synth, 'const quick = body', 'const qhash')), 'G1 no em dash in the new code or its copy');
console.log('\nproof_excavate_depth: ' + pass + ' checks PASS');
