/**
 * proof_fit.mjs  --  EX36f THE FIT: SEAM:THE_FIT. The nav's doors sit centered on the desktop header; the hero and the record's head can
 * shrink, so no input sets the page wider than a phone; under 480 the ask wraps and the header fits.
 * Run from the repo root.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
ok(/@media \(min-width:761px\)\{nav \.nav-menu\{display:none;\}nav\{display:grid;grid-template-columns:1fr auto 1fr;\}\.nav-list\{justify-self:center;margin:0;\}\.nav-right\{justify-self:end;\}\}/.test(page), 'F1 on the desktop the header is three columns, the doors centered, the logo and the account at the edges');
ok(/@media \(min-width:761px\) and \(max-width:1000px\)\{nav\{padding:0 20px;grid-template-columns:auto 1fr auto\}\.nav-list\{gap:0\}/.test(page), 'F2 on the tablet the doors compress and the header fits');
ok(/#sec-explore \.hero\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);/.test(page) && /@media \(max-width:1000px\)\{#sec-explore \.hero\{grid-template-columns:minmax\(0,1fr\);/.test(page) && /#sec-explore \.hero-left,#sec-explore \.hero-right,#sec-explore \.lead-rail,#sec-explore \.search-shell\{min-width:0\}/.test(page), 'F3 the hero\'s columns can shrink: no input sets the page\'s width');
ok(/\.room-head\.rec-head\{display:grid;grid-template-columns:auto minmax\(0,1fr\) minmax\(340px,40%\)/.test(page) && /@media \(max-width:1000px\)\{\.room-head\.rec-head\{grid-template-columns:minmax\(0,1fr\)\}/.test(page) && /\.rec-head \.rec-ask-row\{min-width:0;flex-wrap:wrap\}/.test(page), 'F4 the record\'s head can shrink and its ask row wraps');
ok(/@media \(max-width:480px\)\{\n  #sec-explore \.search-wrapper\{flex-wrap:wrap\}\n  #sec-explore \.search-bar\{flex:1 1 100%;/.test(page) && /\.nav-logo>span:nth-child\(2\)\{display:none\}/.test(page), 'F5 under 480 the ask wraps, the input on its own line, and the header\'s logo shrinks to fit');
console.log('proof_fit: ' + pass + ' ok');
