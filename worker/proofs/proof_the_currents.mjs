/**
 * proof_the_currents.mjs  --  CC1 THE CURRENTS: the cross-currents on one line (five columns; a sideways row under 1100px), and each
 * card a door to the current's own pop-out (the house's ivory dialog) with the readings it runs through; the faces and the chips keep
 * their own doors.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('anchor missing: ' + b); return s.slice(i, j); };

// ── A. One line ──
ok(/\.rec-cur-grid\.n5\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)\}/.test(page) && /rec-cur-grid n\$\{Math\.min\(5, list\.length\)\}/.test(page), 'A1 five currents take five columns; the grid never wraps a fifth');
ok(/\.rec-cur-grid\.n5 \.rec-cur h3\{font-size:16px\}\.rec-cur-grid\.n5 \.rec-cur p\.body\{-webkit-line-clamp:4\}/.test(page) && /\(list\.length >= 5 \? 150 : 300\)/.test(page), 'A2 at five across the title is a step smaller and the body folds to four lines behind More');
ok(/@media \(max-width:1100px\)\{\.rec-cur-grid\.n5,\.rec-cur-grid\.n4\{display:flex;overflow-x:auto;scroll-snap-type:x mandatory/.test(page) && /@media \(max-width:640px\)\{\.rec-cur-grid\.n2,\.rec-cur-grid\.n3\{grid-template-columns:1fr\}/.test(page), 'A3 under 1100px four or five scroll sideways as the voices band does; two or three still stack on a phone');

// ── B. The card is a door ──
const rend = between(page, 'function _renderCurrents(cur, tilesIn) {', 'const LEAD = {');
ok(/<article class="rec-cur rec-cur-door" data-cur="\$\{i\}" onclick="_curOpen\(\$\{i\}\)">/.test(rend) && /<h3><button type="button" class="rec-cur-h" aria-label="\$\{safeAttr\('Open the current: ' \+ String\(c\.title \|\| ''\)\)\}" onclick="event\.stopPropagation\(\);_curOpen\(\$\{i\}\)">/.test(rend) && /const face = \(c, i\) => \{/.test(rend) && !/role="button"/.test(rend) && !/onkeydown=/.test(rend),
  'B1 a mouse opens the current anywhere on the card; the title is the button a keyboard and a screen reader meet (no role on the article, no keydown that steals Enter from the inner doors)');
ok(/onclick="event\.stopPropagation\(\);_curToggle\(this\)"/.test(rend) && /<div class="rec-cur-subs" onclick="event\.stopPropagation\(\)">/.test(rend) && /onclick="event\.stopPropagation\(\);openFeaturedCard\('\$\{safeAttr\(f\.id\)\}'\)"/.test(rend), 'B2 More, the subject chips and the faces keep their own doors without opening the current');
ok(/window\._curList = \{ at: cur\.at, list, tiles \};/.test(rend), 'B3 what the pop-out reads is kept with the render');
ok(/\.rec-cur\.rec-cur-door\{cursor:pointer/.test(page) && /\.rec-cur\.rec-cur-door:hover,\.rec-cur\.rec-cur-door:has\(\.rec-cur-h:focus-visible\)\{border-color:var\(--accent\)\}/.test(page) && /\.rec-cur-h:focus-visible\{outline:2px solid var\(--accent\)/.test(page) && /gap:14px;padding:1px 1px 6px;scrollbar-width:thin/.test(page),
  'B4 the card shows it is a door on hover and on the title\'s focus; the band keeps a pixel so the frame is not clipped');
ok(!/Plus Jakarta|Playfair/.test(between(page, '.rec-cur-grid.n5{', '.cur-pop-read small')) && /\.cur-pop-k\{[^}]*color:#C41230\}/.test(page) && /\.cur-pop-h\{margin:0;font-family:'DM Serif Display',serif/.test(page) && /\.cur-pop-body\{font-family:'Syne',sans-serif/.test(page),
  'B5 the dialog\'s own type and red: Syne, DM Serif Display, Space Mono, the kicker the house\'s #C41230 (no family the page does not load)');

// ── C. The pop-out, run with fakes ──
const src = between(page, 'function _curResolve(c, tiles) {', '/* SEAM:LEAD_SCROLL (EX36b)');
const els = {}, added = [], cls = new Set(), listeners = [];
const mk = (id) => ({ id, innerHTML: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, querySelector(sel) { return sel === '.hs-pop-x' ? { focus() { added.push('focus:x'); } } : null; }, remove() { delete els[this.id]; } });
const document = { activeElement: { focus() { added.push('focus:back'); } }, getElementById: id => els[id] || null, createElement: () => mk(''), body: { appendChild(e) { e.id = e.id || 'hs-pop'; els[e.id] = e; added.push('append'); }, classList: { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c) }, contains: () => true }, addEventListener: (k) => listeners.push(k), removeEventListener: () => {} };
const tiles = [
  { id: 'aaaaaaaa-0000-4000-8000-000000000001', label: 'Nike in athletic footwear', deployed: '2026-11-03', claim: 'Heritage drops overrun the calendar', frame: { entity: 'Nike' }, photo: { src: 'https://x/nike.jpg', credit: 'Reuters' } },
  { id: 'bbbbbbbb-0000-4000-8000-000000000002', label: 'Costco in membership retail', deployed: '2026-11-01', claim: 'Membership becomes the product', frame: { entity: 'Costco' }, photo: null },
];
const W = { _signedOut: false, _curList: null };
const photoSrc = between(page, 'function _hsPhoto(t, seen, cls) {', '/* The lead\'s move:');
const faceSrc = between(page, 'function _hsFace(t) {', '\n}\n') + '\n}\n';
let fromId = null;
const F = new Function('window', 'document', 'safe', 'safeAttr', '_recDay', '_hsMoveClose', '_hsMoveKey', '_gateForDoor', 'openFeaturedCard', '_hsPopFrom', '_hsPopFromId', '_setFrom',
  faceSrc + photoSrc + src + '; return { _curResolve, _curOpen: (i) => { const r = _curOpen(i); _setFrom(_hsPopFromId); return r; } };')(W, document, s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), s => String(s).replace(/"/g, '&quot;'), d => String(d).slice(0, 10), () => added.push('close'), () => {}, n => added.push('gate:' + n), id => added.push('open:' + id), null, null, v => { fromId = v; });
const cur = { title: 'Membership stops being a perk and becomes the product', body: 'Costco pitches Medicare to members and Nike rations drops.', subjects: ['Nike in athletic footwear', 'Costco in membership retail', 'Apple in consumer technology'], move: 'Audit what your most loyal customers get free.' };
W._curList = { at: '2026-11-01T06:00:00Z', list: [cur], tiles };
F._curOpen(0);
const pop = els['hs-pop'];
ok(!!pop && pop.getAttribute('data-id') === 'current-0' && cls.has('hs-pop-open') && listeners.includes('keydown') && added.includes('focus:x') && fromId === 'current-0', 'C1 the current opens in the move\'s dialog, with the move\'s keys, the close button focused, and the way back remembered as current-0');
ok(/Cross-current \u00b7 named 2026-11-01/.test(pop.innerHTML) && /<h2 id="hs-pop-h" class="cur-pop-h">Membership stops being a perk and becomes the product<\/h2>/.test(pop.innerHTML) && /<p class="cur-pop-body">Costco pitches Medicare to members and Nike rations drops\.<\/p>/.test(pop.innerHTML) && /<div class="hs-k">The move<\/div><p class="hs-pop-take">Audit what your most loyal customers get free\.<\/p>/.test(pop.innerHTML),
  'C2 the kicker names the day it was named; the title, the body whole and the move');
ok(/<figure class="hs-pop-fig"><span class="hs-face-name" aria-hidden="true">Nike<\/span><img src="https:\/\/x\/nike\.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="_hsImgFail\(this\)"><figcaption>Photo: Reuters<\/figcaption><\/figure>/.test(pop.innerHTML),
  'C3 the lead face is the photograph through the house\'s own figure (the name behind it, the relay\'s onerror, no referrer), with its credit');
const reads = (pop.innerHTML.match(/class="cur-pop-read"/g) || []).length;
ok(reads === 2 && /openFeaturedCard\('aaaaaaaa-0000-4000-8000-000000000001'\)/.test(pop.innerHTML) && /<b>Heritage drops overrun the calendar<\/b><small>Nike \u00b7 2026-11-03<\/small>/.test(pop.innerHTML) && /<figure class="hs-thumb hs-face"><span class="hs-face-name" aria-hidden="true">Costco<\/span><\/figure><b>Membership becomes the product<\/b><small>Costco \u00b7 2026-11-01<\/small>/.test(pop.innerHTML) && !/cur-pop-read"[^>]*>(?:(?!<\/button>).)*Apple/.test(pop.innerHTML) && /Also runs through <span class="cur-pop-k">Apple<\/span>\./.test(pop.innerHTML),
  'C4 the readings it runs through are cards that close the dialog and open their deep dive; a subject with no reading on the record is named, not a card');
ok(/_hsMoveClose\(\);openFeaturedCard\(/.test(pop.innerHTML) && /class="hs-link hs-close" onclick="_hsMoveClose\(\)">Close<\/button>/.test(pop.innerHTML), 'C5 every way out is the move\'s');
W._curList = { at: '2026-11-01T06:00:00Z', list: [{ title: 'T', body: 'B', subjects: ['Apple in consumer technology'], move: '' }], tiles };
F._curOpen(0);
ok(/<div class="hs-k">It runs through<\/div><p class="cur-pop-body"><span class="cur-pop-k">Apple<\/span><\/p>/.test(els['hs-pop'].innerHTML) && !/The move/.test(els['hs-pop'].innerHTML) && /<figure class="hs-pop-fig hs-face"><span class="hs-face-name" aria-hidden="true">Apple<\/span><\/figure>/.test(els['hs-pop'].innerHTML),
  'C6 a current whose subjects have no reading yet names them; no move, no move block; no photograph, the subject\'s name set large on the band');
F._curOpen(7);
ok(els['hs-pop'].innerHTML.includes('<h2 id="hs-pop-h" class="cur-pop-h">T</h2>'), 'C7 a place with no current changes nothing');
W._signedOut = true; added.length = 0; F._curOpen(0);
ok(added.join() === 'gate:excavate', 'C8 a visitor meets the gate (never the landing after AC1, but the door is shut either way)');

// ── D. The seam and the house's hand ──
ok(seams.registry['SEAM:THE_CURRENTS'] && seams.registry['SEAM:THE_CURRENTS'].file === 'intelligence/index.html', 'D1 the seam is registered for the page');
ok(/else if \(fid && \/\^current-\\d\+\$\/\.test\(fid\)/.test(between(page, 'function _hsMoveClose() {', '\n}\n')) && /\.rec-cur\[data-cur="' \+ fid\.slice\(8\) \+ '"\] \.rec-cur-h/.test(between(page, 'function _hsMoveClose() {', '\n}\n')), 'D1b the way back when the card was drawn again under the dialog: its title takes focus');
const lines = page.split('\n').filter(l => /SEAM:THE_CURRENTS/.test(l));
ok(lines.length >= 8 && lines.every(l => !/[\u2014\u2013]/.test(l)) && !/\bsignal|the lake\b/i.test(src), 'D2 every line of the cut carries its seam, no dash, none of the house\'s words in the pop-out');
console.log('proof_the_currents: ' + pass + ' checks passed');
