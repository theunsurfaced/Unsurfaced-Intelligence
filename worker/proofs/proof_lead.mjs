/**
 * proof_lead.mjs  --  EX36b THE DEPLOYMENTS: SEAM:LEAD_SCROLL.
 * The hero's right column is a rail: the week's read first when it is here, then the newest readings with photographs, each with its bet as a
 * countdown; a reading on the rail is not repeated in the rows; the record renders whatever the feed says.
 * Run from the repo root.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const lead = between(page, 'const LEAD = {', 'function _renderScroll(rec, data) {');

// ── A: the rail's pick and the countdown, pure ──────────────────────────────────────────────────────────────────────
const L = new Function('_recWatch', '_recMeasureLine', '_recDay', 'safe', 'safeAttr', 'document', 'window', 'matchMedia',
  lead.replace(/^let _leadBuilt[^\n]*\n/m, 'let _leadBuilt = null, _leadTimer = null, _leadPaused = false;\n') + '; return { _leadDays, _leadBet, LEAD };')(
  t => '<div class="rec-watch held">graded</div>', m => 'measure', d => d, s => String(s), s => String(s), { getElementById: () => null }, {}, () => ({ matches: true }));
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
ok(L._leadDays(day(27)) === 27 && L._leadDays(day(0)) === 0 && L._leadDays('nope') === null, 'A1 days to the check date, counted from today');
ok(/Checked in 27 days/.test(L._leadBet({ watch: { claim: 'Jordan names a date.', by: day(27) } })) && /Checked tomorrow/.test(L._leadBet({ watch: { claim: 'x', by: day(1) } })) && /Checked today/.test(L._leadBet({ watch: { claim: 'x', by: day(0) } })) && /Being checked/.test(L._leadBet({ watch: { claim: 'x', by: day(-2) } })),
  'A2 the bet reads as a countdown: in N days, tomorrow, today, being checked');
ok(/<i>The bet<\/i> Jordan names a date <span/.test(L._leadBet({ watch: { claim: 'Jordan names a date.', by: day(27) } })) && L._leadBet({ watch: { claim: 'x', by: day(1) }, called: { verdict: 'held' } }) === '<div class="rec-watch held">graded</div>' && L._leadBet({}) === '', 'A3 the claim loses its full stop; a graded bet shows its grade; no bet, no line');
ok(L.LEAD.MAX === 1 && L.LEAD.EVERY_MS === undefined, 'A4 one reading leads the spread (NT3c); nothing advances');

// ── B: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/<div class="lead-rail" id="lead-rail" aria-label="The lead and this week's read">/.test(page) && !/aria-roledescription="carousel"/.test(page) && /<article class="lead-card" id="lead-week">/.test(page) && /id="week-movers"/.test(between(page, '<article class="lead-card" id="lead-week">', '</article>')) && /<div class="lead-nav" id="lead-nav" style="display:none">/.test(page) && /<section class="week nophoto" id="week-block"[^]*?<\/section>\s*<\/section>/.test(page),
  'B1 the week block is one spread (NT3c): the lead above, the week\'s read with its words, photograph and movers under it; no carousel; still the hero\'s last section');
ok(/\.filter\(t => t\.photo && t\.photo\.src && \(t\.claim \|\| t\.title\)\)\.sort\(\(a, b\) => String\(b\.deployed \|\| ''\)\.localeCompare\(String\(a\.deployed \|\| ''\)\)\)\.slice\(0, LEAD\.MAX\)/.test(lead) && /window\._leadIds = new Set\(pick\.map\(t => t\.id\)\)/.test(lead) && /const stamp = \(rec\.built_at \|\| 'x'\) \+ '\|' \+ \(window\._hsMovesAt \|\| ''\) \+ '\|' \+ \(window\._hsMineAt \|\| ''\);/.test(lead) && /if \(_leadBuilt === stamp\) return;/.test(lead),
  'B2 with no set passed the lead is the newest reading with a photograph, drawn once per record build and again when the moves or a seat\'s spaces arrive (NT3c), and remembered');
ok(/const onRail0 = window\._leadIds \|\| new Set\(\), all = \(rec\.tiles \|\| \[\]\)\.filter\(t => !onRail0\.has\(t\.id\)\), tiles = _recFilter\(all\);/.test(page) && /const onRail = window\._leadIds \|\| new Set\(\), rows = rest\.filter\(t => !onRail\.has\(t\.id\)\);/.test(page) && /const leads = \[\], rest = tiles;/.test(page),
  'B3 one pool, one rule: the rows and the lens counts leave out what the rail carries');
ok(/<article class="lead-card lead-reading" data-id="\$\{safeAttr\(t\.id\)\}">/.test(lead) && /Deployed \$\{safe\(_recDay\(t\.deployed\)\)\}/.test(lead) && !/lead-measure/.test(lead) && /\$\{_leadBet\(t\)\}/.test(lead) && /_hsMoveBlock\(t\)/.test(lead),
  'B4 the lead: the photograph, the line, the claim, the copy, the bet, then the move or the door to it (NT3c: no measure line)');
ok(!/setInterval\(_leadTick/.test(lead) && /function _leadWire\(\) \{   \/\/ SEAM:HOUSE_STYLE \(NT3c\)/.test(lead) && /if \(_leadTimer\) \{ clearInterval\(_leadTimer\); _leadTimer = null; \}/.test(lead),
  'B5 nothing advances (NT3c): no timer; the arrows and dots stay hidden');
ok(/_recordLoad\(\)\.then\(rec => \{ if \(rec && rec\.tiles\.length && !window\._scrollDrawn\) _renderScroll\(rec, _FI_LAKE \|\| \{ proposed: \[\] \}\); \}\);/.test(page) && /window\._scrollDrawn = true; _leadRender\(rec\);/.test(page), 'B6 the record renders on its own, whatever the feed says');
ok(/if \(lw && !\(h2 && h2\.textContent\.trim\(\)\)\) lw\.style\.display = 'none';/.test(lead) && /const lw = document\.getElementById\('lead-week'\); if \(lw\) lw\.style\.display = '';/.test(page) && /if \(!\(window\._leadIds && window\._leadIds\.size\)\) el\.style\.display = 'none';/.test(page),
  'B7 without a week\'s read the readings lead; with one it leads; the rail hides only when it has nothing at all');
console.log('proof_lead: ' + pass + ' checks passed');
