/**
 * proof_the_reach.mjs  --  IQ6 THE REACH (the READ writers' half): the level and its lens reach the WEEKLY, the MONTHLY, the Record
 * and the RECON through the Method, Method 5.1 synced into the worker word for word, the eight tests the same eight the judge grades on,
 * the contracts and the laws untouched, no hashed EXCAVATE slice moved.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
const changelog = fs.readFileSync('templates/METHOD_CHANGELOG.md', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('anchor missing: ' + b); return s.slice(i, j); };
const fnOf = (name) => { const i = w.indexOf('function ' + name + '('); if (i < 0) throw new Error('function missing: ' + name); const j = w.indexOf('\nfunction ', i + 10); return w.slice(i, j < 0 ? undefined : j); };

// ── A. The section, where it sits ──
const H = '## The level and its lens';
const section = between(method, H, '## THE MOVE, by role');
ok(method.split(H).length === 2 && section.length > 3000, 'A1 one section, The level and its lens, in the Method');
const iNine = method.indexOf('## The nine questions'), iQ9 = method.indexOf('9. **What do we do Monday, and what do we watch?**'), iH = method.indexOf(H), iMove = method.indexOf('## THE MOVE, by role');
ok(iNine > 0 && iQ9 > iNine && iH > iQ9 && iMove > iH, 'A2 after the ninth question, before THE MOVE by role: the nine questions still run, the lens says which bites hardest');
ok(/^Version 5\.1, the house style\./m.test(method) && !/Version 5\.0/.test(method), 'A3 Method 5.1');
ok(/\| 2026-11-06 \| Method 5\.1 \|/.test(changelog) && /\| 2026-10-30 \| Method 5\.0 \|/.test(changelog), 'A4 the changelog carries the 5.1 row under the 5.0 row');

// ── B. The four levels, six questions each, the line each owes, the failure each has ──
const levels = ['Industry', 'Category', 'Brand', 'Talent'];
const paraOf = (name) => section.split('\n').find((l) => l.startsWith('**' + name + '**')) || '';
ok(levels.every((n) => paraOf(n).length > 400), 'B1 four levels, each its own paragraph: industry, category, brand, talent');
ok(levels.every((n) => [1, 2, 3, 4, 5, 6].every((k) => paraOf(n).includes('(' + k + ')')) && !paraOf(n).includes('(7)')), 'B2 six questions a level, numbered, no seventh');
ok(levels.every((n) => /The line (names|says|separates) /.test(paraOf(n))), 'B3 every level says what its pattern\'s line owes the reader');
ok(levels.every((n) => /It fails when /.test(paraOf(n))), 'B4 every level names how a read at that level fails');
const nine = { Industry: 'the first, the fifth and the sixth', Category: 'the second, the third and the fourth', Brand: 'the third, the fifth and the seventh', Talent: 'the second, the sixth and the ninth' };
ok(levels.every((n) => paraOf(n).includes('Of the nine, ' + nine[n] + ' bite hardest here: ')), 'B4b every level says which of the nine questions bite hardest for it (the promise in the intro is kept)');
ok(/\*\*industry\*\* \(one of the trade's areas\)/.test(section) && /\*\*category\*\* \(a kind of thing people buy or do\)/.test(section) && /\*\*brand\*\* \(a company or a product line\)/.test(section) && /\*\*talent\*\* \(an artist, athlete, creator or personality\)/.test(section),
  'B5 the levels defined in the lens law\'s own words (EXC_LENS_LAW), so EXCAVATE and READ name the same four');
ok(/story volume is read as growth/.test(paraOf('Industry')) && /launch coverage is read as adoption/.test(paraOf('Category')) && /coverage is read as sentiment or sales/.test(paraOf('Brand')) && /press volume is read as audience size/.test(paraOf('Talent')),
  'B6 coverage is never read as what people do, at every level');
ok(/never a growth rate or a market size/.test(paraOf('Category')) && /more stories is not a win/.test(paraOf('Brand')) && /with no audience measure, say so/i.test(paraOf('Talent')), 'B7 numbers are not intelligence: the stage not a rate, stories not a win, no audience measure said plainly');

// ── C. The eight tests: the judge's eight, in the judge's order ──
const tests = between(section, '**The eight tests**', '\n');
const names = (w.match(/CRITERIA: \[([\s\S]*?)\n  \]/) || ['', ''])[1].match(/name: '([^']+)'/g).map((m) => m.slice(7, -1));
ok(names.length === 8 && names.join('|') === 'Earned|Interprets|At the level|Not obvious|Consequence|Specific|The other side|Moves follow', 'C1 the judge grades on eight criteria (SEAM:THE_GRADE)');
const order = names.map((n) => tests.indexOf(n + ': '));
ok(order.every((i) => i > 0) && order.every((i, k) => k === 0 || i > order[k - 1]), 'C2 the Method\'s eight tests are the judge\'s eight, by name, in the judge\'s order');
ok(/coverage is never read as what people do/.test(tests) && /could not describe another brand or another week/.test(tests) && /a team could start it Monday/.test(tests), 'C3 earned, specific and moves follow say what the judge\'s two means');
ok(/Hold every finding to that lens\./.test(tests) && /let its lens pick the line\./.test(tests), 'C4 a RECON holds every finding to its one lens; a pattern\'s lens picks its line');

// ── D. The voice of the Method itself ──
ok(!/[—–]/.test(section), 'D1 no em dash and no en dash in the section');
ok(!/;/.test(section), 'D2 no semicolon chain in the section');
ok(!/\b(?:signals?|the lake|the frame|the house)\b/i.test(section.replace(/\*\*/g, '')), 'D3 none of the house\'s own words in the writers\' instruction');
ok(/reads like media\./.test(section), 'D4 the wrong lens reads like media');
ok(!/counter view|trend reports?\b|complaints|\battention\b|reviews/i.test(section), 'D5 the section asks the READ writers for nothing their pack does not carry (no EXCAVATE rail names: counter view, trend reports, complaints, reviews; not the RECON pack\'s ATTENTION either)');
ok(/A RECON has one subject and one level\. Decide the level before the thesis, and take the nearest level for a topic brief\. Let the thesis say it in the reader's words/.test(tests) && /The Weekly Read, the monthly and the Record carry subjects at several levels: decide each pattern's level before its line/.test(tests),
  'D6 a topic brief takes the nearest level; the thesis says the level in the reader\'s words (method vocabulary stays out of reader prose); the Weekly Read, the monthly and the Record decide each pattern\'s level');
ok(!/\bthinking\b/.test(tests) && !/name it in the thesis/.test(tests), 'D7 the section names no field the contracts do not have');

// ── E. Synced into the worker, word for word, outside every hashed slice ──
const i = w.indexOf('\nconst READ_METHOD = ');
const line = w.slice(i + 1, w.indexOf('\n', i + 1));
const m = line.match(/^const READ_METHOD = ("(?:[^"\\]|\\.)*");\s+\/\/ SEAM:PROMPT_SYNC/);
ok(!!m && JSON.parse(m[1]) === method, 'E1 READ_METHOD is the file, word for word (SEAM:PROMPT_SYNC; tools/sync_method.py would change nothing)');
ok(w.split(H).length === 2 && !fnOf('excDoorPrompt').includes(H) && !between(w, 'const EXC_HEADLINE_LAW', 'const EXC_ROOM').includes(H) && !between(w, 'const EXC_MOVE_LAW', 'function excReportPrompt').includes(H),
  'E2 the section is in the worker once, in READ_METHOD, and no hashed EXCAVATE slice carries it (no bench)');
ok(/\/\* SEAM:THE_REACH \(IQ6/.test(w.slice(i - 400, i + 1)) && seams.registry['SEAM:THE_REACH'] && seams.registry['SEAM:THE_REACH'].file === 'worker/src/index.js', 'E3 the seam marks the constant and is registered on the worker');
const contracts = between(w, 'const READ_CONTRACT = {', '\n};');
ok(contracts.length > 2000 && !contracts.includes('lens') && !contracts.includes('level and its'), 'E4 the contracts are untouched: the level reaches the writers through the Method, never a new key');
ok(!/level and its lens/i.test(between(w, 'const READ_WRITER_LAW', 'const READ_EDITOR_LAW')) && !/level and its lens/i.test(fnOf('readValidate')), 'E5 the writer law and the validator unchanged: nothing holds a read for its level');
ok((w.match(/voice: 'Method 5\.1'/g) || []).length === 2 && !/voice: 'Method 5\.0'/.test(w), 'E6 the day\'s frames and the corpus extractor stamp what they write Method 5.1, the Method they now read');

console.log('proof_the_reach: ' + pass + ' checks passed');
