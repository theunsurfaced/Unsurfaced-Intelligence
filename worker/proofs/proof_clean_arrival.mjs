/**
 * proof_clean_arrival.mjs  --  NT3e THE CLEAN ARRIVAL: SEAM:CLEAN_ARRIVAL. The arrival keeps its layout and loses its labels (the
 * morning's and the record's heads and lines, the visitor band, the record's ask). The voices: NT4 THE SCROLL made the band a scroll
 * (proof_the_scroll). The territory chips close the page after the voices; the page signs off with "Your hidden hand." over
 * EXCAVATE by Unsurfaced and the site's address. The ask follows an admin as a thin bar with its own box; the two boxes share what is
 * typed and Search runs the hero's search. Run from the repo root.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const DASH = /[—–]/;

// ── A: the markup and the style ─────────────────────────────────────────────────────────────────────────────────────────────────
const css = between(page, '<style id="clean-arrival">', '</style>');
ok(page.indexOf('<style id="clean-arrival">') > page.indexOf('<style id="house-style">') && (page.match(/<style id="clean-arrival">/g) || []).length === 1
  && css.includes('#sec-explore #gal-block>.room-head,#sec-explore #gal-sub,#sec-explore #hs-invite,#sec-explore #board-block>.room-head.rec-head,#sec-explore #rec-ask{display:none!important}'),
  'A1 the labels come off: the morning\'s head and line, the visitor band, the record\'s head, line and ask (after the house style, so it wins)');
ok(!/nth-child\(n\+4\)/.test(css) && !/vx-more|vx-acts/.test(css) && !/\.track>\.quote:nth-child\(n\+4\)/.test(page),
  'A2 the band no longer stops at three anywhere on the page; More voices is gone (NT4: the band scrolls, the room holds the rest)');
ok((css.match(/z-index:([^;}]+)/g) || []).every(z => /var\(--z-[a-z-]+\)/.test(z)) && !DASH.test(css) && /@media \(max-width:760px\)/.test(css)
  && /#ask-sticky\.ask-sticky\{position:fixed;/.test(css) && /body:not\(\.ask-follows\) #ask-sticky\.ask-sticky\{display:none!important\}/.test(css) && /#ask-sticky \.as-form\{[^}]*height:36px\}/.test(css) && /#ask-sticky \.as-form\{height:40px;/.test(css) && /#ask-sticky input\{font-size:16px;/.test(css) && /#ask-sticky button\{flex:none;width:auto;/.test(css) && /\.ex-by img\{[^}]*filter:invert\(1\) brightness\(2\)/.test(css),
  'A3 the bar is thin (36 on a computer, 40 on a phone, 16px type so a phone does not zoom), fixed so the page never jumps, shown to no one without ask-follows; every z-index a token; no dash');
ok(/<div class="ask-sticky" id="ask-sticky" style="display:none"><form class="as-form" role="search" onsubmit="return _askFollowGo\(event\)"><span class="as-k">Ask culture a question\.<\/span><span class="as-box"><input id="ask-sticky-q" maxlength="400" autocomplete="off" aria-label="Ask culture a question" placeholder="A brand, a category, the people, or the question itself"><button type="submit">Search<\/button><\/span><\/form><\/div>/.test(page)
  && /<h1 class="hero-title">Ask culture a question\.<\/h1>/.test(page) && (page.match(/id="search-input"/g) || []).length === 1,
  'A4 the bar carries the ask and its own box, never a second #search-input; the hero keeps its words and its search');
const iRec = page.indexOf('id="board-block"'), iV = page.indexOf('id="voices-block"'), iT = page.indexOf('id="hs-terr"'), iP = page.indexOf('<section class="partners">'), iF = page.indexOf('<footer class="ex-foot" id="ex-foot">'), iB = page.indexOf('<section class="hub-block builder-panel">');
ok(iRec > 0 && iRec < iV && iV < iT && iT < iP && iP < iF && iF < iB && (page.match(/id="hs-terr"/g) || []).length === 1 && !/id="voices-more"|_voicesMore/.test(page),
  'A5 the order: the record, the voices, the territory chips, the partners, the sign-off; More voices is gone (NT4)');
const foot = between(page, '<footer class="ex-foot" id="ex-foot">', '</footer>');
ok(/<p class="ex-hh">Your hidden hand<i>\.<\/i><\/p>/.test(foot) && /<b>EXCAVATE<\/b><span>by<\/span><img id="ex-foot-logo" alt="Unsurfaced™">/.test(foot) && /href="https:\/\/unsurfaced-intelligence\.com\/intelligence\/">UNSURFACED-INTELLIGENCE\.COM<\/a>/.test(foot) && !DASH.test(foot) && !/data:image/.test(foot),
  'A6 the sign-off: the closer, EXCAVATE by the Unsurfaced logo (taken from the nav, never copied), the address');
ok(/if \(typeof _ptSync === 'function'\) _ptSync\(\);[^\n]*\n  if \(typeof _askFollowSync === 'function'\) _askFollowSync\(\);/.test(between(page, 'function _navAuth() {', '/* SEAM:EXC_NAV: the dropdown.')),
  'A7 the bar follows the sign-in');
ok(!/The morning below/.test(page) && /The readings below are open to everyone\./.test(page) && /The readings below are yours either way\./.test(page) && /The readings below stay open\./.test(page),
  'A8 the box no longer names a label the page took off; it says what is below');
ok(/setTimeout\(\(\) => \{ const h = document\.getElementById\('gal-block'\); if \(h\) h\.scrollIntoView\(/.test(between(page, 'function _navRecord() {', '\n')) && !/getElementById\('board-h2'\)/.test(page),
  'A9 Record lands on the scroll of readings (NT4; its head is hidden, and a hidden element cannot be scrolled to)');
ok(/<section class="hub-block room-sec gal" id="gal-block" style="display:none" aria-label="The readings">/.test(page) && !/aria-label="The morning"/.test(page), 'A10 a screen reader no longer hears the label the page took off');
ok(/const q = \(\(document\.querySelector\('#ask-modal #ask-q'\) \|\| \{\}\)\.value \|\| ''\)\.trim\(\)/.test(between(page, 'async function _askSend() {', '\n}\n')) && /const t = document\.querySelector\('#ask-modal #ask-q'\); if \(t\) t\.value = '';/.test(page),
  'A11 Ask the team reads its own box, not the record\'s hidden one that shares its id');

// ── B: the voices ride NT4's band (proof_the_scroll holds it) ──────────────────────────────────────────────────────────────────
ok(/function _renderDoorVoices\(voices\) \{/.test(page) && !/\.vx-more|voices-more/.test(between(page, 'function _renderDoorVoices(voices) {', '\n}\n')), 'B1 the band is drawn by one function, without More voices');

// ── C: the bar, with fakes ─────────────────────────────────────────────────────────────────────────────────────────────────────
const blk = between(page, '/* ═══ SEAM:CLEAN_ARRIVAL (NT3e THE CLEAN ARRIVAL)', '/* ═══ end SEAM:CLEAN_ARRIVAL ═══ */');
ok(!DASH.test(blk) && !/fetch\(|callClaude|method:\s*'POST'/.test(blk), 'C1 the page block asks the network nothing of its own (the admin check is the page\'s _isAdmin); no dash');
const mk = () => {
  const body = { cls: new Set(), classList: { toggle(c, on) { on ? body.cls.add(c) : body.cls.delete(c); }, remove(c) { body.cls.delete(c); }, add(c) { body.cls.add(c); } } };
  const els = { 'ask-sticky': { style: {} }, 'ask-sticky-q': { value: '', focused: 0, focus() { this.focused++; } }, 'search-input': { value: '' } };
  const win = { _signedOut: true, scrolled: null, scrollTo(o) { this.scrolled = o; } };
  const st = { admin: false, asked: 0, email: 'a@x.test', searched: 0 };
  const doc = { body, readyState: 'complete', getElementById: id => els[id] || null, querySelector: s => s === 'nav' ? { getBoundingClientRect: () => ({ bottom: 60 }) } : null, addEventListener() {} };
  const H = new Function('document', 'window', '_galEmail', '_isAdmin', 'runSearch', 'matchMedia', 'addEventListener',
    blk.replace(/\(function \(\) \{[\s\S]*\}\)\(\);\s*$/, '') + '; return { _askFollowSync, _askFollowGo, _ASKF };')(
    doc, win, () => st.email, async () => { st.asked++; return st.admin; }, () => { st.searched++; }, () => ({ matches: false }), () => {});
  return { H, body, els, win, st };
};
let t = mk();
ok((await t.H._askFollowSync()) === false && !t.body.cls.has('ask-follows') && t.st.asked === 0, 'C2 signed out: no bar, and no one is asked whether they are an admin');
t.win._signedOut = false; t.st.admin = false;
ok((await t.H._askFollowSync()) === false && !t.body.cls.has('ask-follows') && t.st.asked === 1, 'C3 a member who is not an admin: no bar');
t = mk(); t.win._signedOut = false; t.st.admin = true;
ok((await t.H._askFollowSync()) === true && t.body.cls.has('ask-follows') && t.els['ask-sticky'].style.top === '60px', 'C4 an admin: the bar, set just under the nav');
await t.H._askFollowSync();
ok(t.st.asked === 1, 'C5 asked once a reader, not on every sign-in event');
t.st.email = 'b@x.test'; t.st.admin = false; await t.H._askFollowSync();
ok(t.st.asked === 2 && !t.body.cls.has('ask-follows'), 'C6 another reader on the same page is asked again');
t.win._signedOut = true; await t.H._askFollowSync();
ok(!t.body.cls.has('ask-follows') && t.H._ASKF.email === null, 'C7 signing out takes the bar away and forgets the reader');
t = mk();
const prevented = { n: 0 };
ok(t.H._askFollowGo({ preventDefault() { prevented.n++; } }) === false && t.st.searched === 0 && t.els['ask-sticky-q'].focused === 1 && prevented.n === 1, 'C8 an empty bar runs nothing and keeps the cursor in the box');
t.els['ask-sticky-q'].value = '  Nike in athletic footwear ';
ok(t.H._askFollowGo({ preventDefault() {} }) === false && t.els['search-input'].value === 'Nike in athletic footwear' && t.st.searched === 1 && t.win.scrolled && t.win.scrolled.top === 0,
  'C9 Search runs the hero\'s own search with the words typed, from the top of the page');
ok(/inp\.addEventListener\('input', \(\) => \{ q\.value = inp\.value; \}\); q\.addEventListener\('input', \(\) => \{ inp\.value = q\.value; \}\);/.test(blk) && /b\.setAttribute\('src', a\.getAttribute\('src'\)\)/.test(blk),
  'C10 the two boxes share what is typed; the sign-off takes the nav\'s logo');
// a stale answer never lands on another reader: the first reader's check answers last
t = mk(); t.win._signedOut = false;
{ const gates = [];
  const H3 = new Function('document', 'window', '_galEmail', '_isAdmin', 'runSearch', 'matchMedia', 'addEventListener',
    blk.replace(/\(function \(\) \{[\s\S]*\}\)\(\);\s*$/, '') + '; return { _askFollowSync, _ASKF };')(
    { body: t.body, getElementById: id => t.els[id] || null, querySelector: () => null }, t.win, () => t.st.email, () => new Promise(r => gates.push(r)), () => {}, () => ({ matches: false }), () => {});
  t.st.email = 'a@x.test'; const first = H3._askFollowSync();
  t.st.email = 'b@x.test'; const second = H3._askFollowSync();
  gates[1](false); await second; gates[0](true); await first;
  ok(!t.body.cls.has('ask-follows') && H3._ASKF.email === 'b@x.test' && H3._ASKF.on === false, 'C11 two readers in quick succession: the first one\'s late answer never lands on the second'); }
ok(/q\.addEventListener\('focus', \(\) => \{ if \(q\.value !== inp\.value\) q\.value = inp\.value; \}\);/.test(blk), 'C13 the bar takes the hero\'s words when it is used, so it never shows an old question');
console.log(`\nproof_clean_arrival: ${pass} checks PASS`);
