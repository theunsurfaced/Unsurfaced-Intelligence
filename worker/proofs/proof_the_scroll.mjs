/**
 * proof_the_scroll.mjs  --  NT4 THE SCROLL: SEAM:THE_SCROLL. One scroll of intelligence. The first section: the ask and its box in one
 * column, the reader's side beside them (signed in: their frame and their last questions). The lead a third shorter; the week's read
 * under its cover line, without its numbers; its cross-currents under it. One dated scroll of readings, three to a row, the lenses as its
 * navigation, More readings. Every voice on a band that scrolls, the reader's own subjects first, labeled by subject, each opening its
 * reading; a room behind the band. Every photograph through the house's relay. The worker: the dek check widened, the cover line asked
 * for and checked, the band labeled by subject with its reading's id, a bar on a voice, the reader's questions, the relay.
 * Run from the repo root: node worker/proofs/proof_the_scroll.mjs
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8'), w = fs.readFileSync('worker/src/index.js', 'utf-8'), seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const DASH = /[—–]/;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = n => `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;

// ── A: the markup and the style ─────────────────────────────────────────────────────────────────────────────────────────────────
const top = between(page, '<div class="hs-top">', '<!-- compat stub -->');
const iH1 = top.indexOf('<h1 class="hero-title">'), iSide = top.indexOf('<div class="hs-side">'), iSub = top.indexOf('class="hero-sub"'), iInv = top.indexOf('id="pulse-invite"'), iYou = top.indexOf('id="hs-you"'), iShell = top.indexOf('<div class="search-shell">'), iBox = top.indexOf('id="search-input"'), iTry = top.indexOf('id="hs-try"');
ok(iH1 > 0 && iH1 < iShell && iShell < iBox && iBox < iTry && iTry < iSide && iSide < iSub && iSub < iInv && iInv < iYou && (page.match(/id="hs-you"/g) || []).length === 1 && (page.match(/<div class="hs-side">/g) || []).length === 1 && (page.match(/<div class="search-shell">/g) || []).length === 1,
  'A1 the first section: the ask, the box and the industries, then the reader\'s side (the words, the box\'s door, the reader\'s own), all inside one block; the keyboard reaches the box first');
const css = between(page, '<style id="the-scroll">', '</style>');
ok(page.indexOf('<style id="the-scroll">') > page.indexOf('<style id="clean-arrival">') && (page.match(/<style id="the-scroll">/g) || []).length === 1
  && /#sec-explore \.hs-top\{grid-template-columns:minmax\(0,1\.3fr\) minmax\(0,1fr\);grid-template-areas:"ask ask" "box side";/.test(css) && /h1\.hero-title\{grid-area:ask;/.test(css) && /\.hs-side\{grid-area:side;/.test(css) && /\.search-shell\{grid-area:box;/.test(css)
  && /@media \(max-width:1000px\)\{#sec-explore \.hs-top\{grid-template-columns:minmax\(0,1fr\);grid-template-areas:"ask" "box" "side";/.test(css) && /body\.uai-in\.hs-you-on #sec-explore \.hs-top \.hero-sub\{display:none\}/.test(css),
  'A2 the style (after NT3e\'s, so it wins): the ask on one line across the section (IQ2), the box and the side under it; one column on a phone, the side last; the words give way to the reader\'s own');
ok(/placeholder="A brand, a category, the people, or a question"/.test(top) && /<span class="hs-try-br" aria-hidden="true"><\/span>\n      <button type="button" class="tag hs-q" id="hs-q"/.test(top) && !/hs-try-sep|or the question itself" oninput/.test(page) && (page.match(/id="search-input"/g) || []).length === 1,
  'A3 the box says less (the ask is the headline over it); the example question takes its own line');
const week = between(page, '<section class="week nophoto" id="week-block"', '</section>');
ok(!/week-movers/.test(page) && /<div class="rec-currents" id="rec-currents" style="display:none"><\/div>/.test(week) && week.indexOf('id="lead-rail"') < week.indexOf('id="rec-currents"') && (page.match(/id="rec-currents"/g) || []).length === 1
  && /<img id="week-img" alt="" referrerpolicy="no-referrer" onerror="_hsImgFail\(this\)">/.test(week) && !/function _countUp\(/.test(page) && !/#lead-week \.movers/.test(page),
  'A4 the week: the numbers are gone with their style and their count-up; the cross-currents sit under the week; its photograph has a fallback');
const gal = between(page, '<section class="hub-block room-sec gal" id="gal-block"', '</section>'), board = between(page, '<section class="hub-block room-sec" id="board-block">', '</section>');
ok(/<div class="rec-lenses" id="rec-lenses" style="display:none"><\/div>/.test(gal) && gal.indexOf('id="rec-lenses"') < gal.indexOf('id="gal-rows"') && !/rec-lenses/.test(board) && (page.match(/id="rec-lenses"/g) || []).length === 1
  && /<div class="gal-more" id="gal-more" style="display:none"><button type="button" onclick="_scrollMore\(\)">More readings<\/button><\/div>/.test(gal) && /#sec-explore #board-block\{display:none!important\}/.test(css)
  && /#sec-explore \.gal-rows\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);/.test(css) && /#sec-explore \.gal-row\.hs-day\{border-top:3px solid var\(--room-red\)\}/.test(css) && /#sec-explore \.gal-row\.hs-hid\{display:none\}/.test(css) && /#sec-explore \.hs-card-text \.hs-movebtn\{margin-top:auto\}/.test(css),
  'A5 the scroll: the lens row over it, More readings under it, three to a row, a red rule on each day\'s first, the rest hidden until asked; the record\'s block is hidden');
const voices = between(page, '<section class="hub-block room-sec room-voices" id="voices-block"', '</section>');
ok(/<button type="button" class="vx-all" onclick="_vxRoomOpen\(\)">All voices<\/button><\/div>/.test(voices) && /<div class="vx-band"><button type="button" class="vx-arrow" onclick="_vxStep\(-1\)" aria-label="Earlier voices">&larr;<\/button><div class="track" id="voices-track" tabindex="0" aria-label="What people are saying"><\/div><button type="button" class="vx-arrow" onclick="_vxStep\(1\)" aria-label="More voices">&rarr;<\/button><\/div>/.test(voices)
  && !/id="voices-more"|_voicesMore\b|vx-more|nth-child\(n\+4\)/.test(page) && /#sec-explore \.room-voices \.track\{display:flex;grid-template-columns:none;overflow-x:auto;scroll-snap-type:x mandatory;/.test(css) && /#sec-explore \.room-voices \.track>\.quote\{flex:0 0 calc\(\(100% - 42px\)\/4\);scroll-snap-align:start;/.test(css)
  && /@media \(max-width:640px\)\{#sec-explore \.vx-band\{grid-template-columns:minmax\(0,1fr\)\}#sec-explore \.vx-arrow\{display:none\}#sec-explore \.room-voices \.track>\.quote\{flex-basis:82%\}/.test(css) && /\.vx-room-wrap\{position:fixed;inset:0;z-index:var\(--z-app-modal\);/.test(css),
  'A6 the voices: a band that scrolls (arrows, snap; a swipe on a phone), All voices over it, and the room\'s style; More voices is gone');
const blk = between(page, '/* ═══ SEAM:THE_SCROLL (NT4 THE SCROLL)', '/* ═══ end SEAM:THE_SCROLL ═══ */');
ok(!DASH.test(css) && !DASH.test(blk) && (css.match(/z-index:([^;}]+)/g) || []).every(z => /var\(--z-[a-z-]+\)/.test(z)) && !/method:\s*'POST'|callClaude|excavate\/(interpret|gather|synthesize)/.test(blk) && (blk.match(/fetch\(/g) || []).length === 1 && /fetch\(_galApi\('\/excavate\/searches\/mine'\)/.test(blk)
  && !/function _hsRow\(|function _hsGrade\(|\.hs-row\{|\.hs-grade\{/.test(page) && /(?:^|\s)(?:function\s+_vxWho|function\s+_hsSrc)/.test(blk),
  'A7 the block asks one GET of its own and no model; every z-index a token; no dash; the record\'s row and its word are gone');
const seen = {};
for (const m of page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) { if (/src=|module|json|importmap/.test(m[1])) continue; for (const f of m[2].matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) seen[f[1]] = (seen[f[1]] || 0) + 1; }
ok(['_scrollDraw', '_scrollMore', '_hsSrc', '_hsImgFail', '_weekCover', '_vxRedraw', '_vxStep', '_vxWho', '_vxRoomOpen', '_vxRoomClose', '_vxRoomKey', '_vxRoomSet', '_vxRoomDraw', '_youLoad', '_youForget', '_youSync', '_youRender', '_youAsk'].every(n => seen[n] === 1),
  'A8 each of the scroll\'s functions is declared once on the page');

// ── B: the scroll, with fakes ────────────────────────────────────────────────────────────────────────────────────────────────────
const scrollSrc = between(page, 'const _SCROLL = { SHOW: 9, STEP: 9 };', '/* The passed set, from the door set the feed brings.');
const mkNode = () => { const n = { style: {}, innerHTML: '', cls: new Set(), attrs: {} }; n.classList = { contains: c => n.cls.has(c), add: c => n.cls.add(c), remove: c => n.cls.delete(c), toggle: (c, on) => { on ? n.cls.add(c) : n.cls.delete(c); } }; n.setAttribute = (k, v) => { n.attrs[k] = v; }; n.focus = () => { n.focused = (n.focused || 0) + 1; }; return n; };
const rowsOf = host => [...host.innerHTML.matchAll(/<div class="gal-row([^"]*)" data-id="([^"]+)" data-day="([^"]*)">/g)].map(m => ({ cls: m[1].trim().split(/\s+/).filter(Boolean), id: m[2], day: m[3] }));
const mkScroll = (recordTiles, lens) => {
  const sec = mkNode(), host = mkNode(), more = mkNode(), gal = { pick: null };
  Object.defineProperty(host, 'innerHTML', { get() { return host._h || ''; }, set(v) { host._h = v; host.live = null; } });   // a new drawing forgets the rows handed out
  const liveRows = () => rowsOf(host).map(r => { const n = mkNode(); r.cls.forEach(c => n.cls.add(c)); n.id = r.id; n.querySelector = s => (s === 'h3' ? (n.h3 = n.h3 || mkNode()) : null); return n; });
  host.querySelectorAll = () => host.live || (host.live = liveRows());
  const doc = { getElementById: id => ({ 'gal-block': sec, 'gal-rows': host, 'gal-more': more })[id] || null };
  const S = new Function('document', '_gal', '_hsMineIds', '_recLens', '_recFilter', '_FI_RECORD', '_hsCard', 'safeAttr', scrollSrc + '; return { _scrollDraw, _scrollMore, _scroll, _SCROLL };')(
    doc, gal, () => ['m1'], lens, tiles => tiles.filter(t => t.frame && t.frame.entity === lens.value), recordTiles ? { tiles: recordTiles } : null, (t, s) => `<article class="hs-card" data-card="${t.id}" data-seen="${!!(t.photo && s.has(t.photo.src))}">${esc(t.claim)}</article>`, esc);
  return { S, sec, host, more, gal };
};
const T = (id, deployed, extra) => Object.assign({ id, deployed, claim: 'Claim ' + id, frame: { entity: 'Acme' }, photo: { src: 'https://p/' + id + '.jpg' } }, extra || {});
const L = T('lead', '2026-11-05'), N1 = T('n1', '2026-11-05', { frame: { entity: 'Nike' } }), N2 = T('n2', '2026-11-05', { photo: { src: 'https://p/lead.jpg' } }), M1 = T('m1', '2026-11-05');
const older = [['r1', '2026-11-04'], ['r2', '2026-11-04', 'Nike'], ['r3', '2026-11-03'], ['r4', '2026-11-03'], ['r5', '2026-11-02'], ['r6', '2026-11-02'], ['r7', '2026-11-01'], ['r8', '2026-11-01'], ['r9', '2026-10-31'], ['r10', '2026-10-31'], ['r11', '2026-10-30']].map(([id, d, e]) => T(id, d, e ? { frame: { entity: e } } : {}));
const record = [N2, L, older[4], N1, M1].concat(older.filter((_, i) => i !== 4));   // out of order, as a record arrives
{ const { S, sec, host, more } = mkScroll(record, { kind: 'all', value: null });
  // no set passed: the record alone, newest first
  S._scrollDraw();
  let rows = rowsOf(host);
  ok(rows.map(r => r.id).join() === ['n2', 'lead', 'n1'].concat(older.map(t => t.id)).join() && sec.style.display === '' && host.style.display === '',
    'B1 with no set passed the scroll is the record, newest first, a seat\'s own reading left out');
  ok(rows.filter(r => r.cls.includes('hs-day')).map(r => r.id).join() === 'n2,r1,r3,r5,r7,r9,r11' && rows.filter(r => !r.cls.includes('hs-hid')).length === 9, 'B2 a red rule on each day\'s first; nine show');
}
{ const { S, sec, host, more, gal } = mkScroll(record, { kind: 'all', value: null });
  gal.pick = { night: '2026-11-05', rail: [L], rows: [N2, N1, M1] };
  S._scrollDraw();
  const rows = rowsOf(host), days = rows.filter(r => r.cls.includes('hs-day')).map(r => r.id);
  ok(rows.map(r => r.id).join() === ['n2', 'n1'].concat(older.map(t => t.id)).join() && !rows.some(r => r.id === 'lead' || r.id === 'm1') && days.join() === 'n2,r1,r3,r5,r7,r9,r11'
    && rows.filter(r => !r.cls.includes('hs-hid')).length === 9 && rows.slice(9).every(r => r.cls.includes('hs-hid')) && more.style.display === '' && sec.style.display === '' && rows.every(r => r.day === (record.find(t => t.id === r.id) || {}).deployed),
    'B3 with a set passed: the night\'s cards first in the house\'s order (the lead and a seat\'s own left out), then every earlier reading by day; a red rule on each day\'s first; nine show, the rest wait');
  ok(/data-card="n2" data-seen="true"/.test(host.innerHTML) && /data-card="n1" data-seen="false"/.test(host.innerHTML), 'B4 a photograph appears once: the rail\'s is seen before the cards are drawn, so a card with the same one shows its name instead');
  S._scrollMore();
  const after = host.querySelectorAll('.gal-row');
  ok(after.filter(r => !r.cls.has('hs-hid')).length === 13 && more.style.display === 'none' && after[9].h3 && after[9].h3.focused === 1 && after[9].h3.attrs.tabindex === '-1',
    'B5 More readings opens the next nine (here the last four), puts the reader on the first one opened, and leaves once nothing waits');
  // a lens filters the night's and the record's readings alike, and the scroll starts over
  gal.pick = { night: '2026-11-05', rail: [L], rows: [N2, N1, M1] };
  const S2 = mkScroll(record, { kind: 'brand', value: 'Nike' }); S2.gal.pick = gal.pick; S2.S._scroll.shown = 18; S2.S._scroll.key = 'all';
  S2.S._scrollDraw();
  const lensed = rowsOf(S2.host);
  ok(lensed.map(r => r.id).join() === 'n1,r2' && lensed[0].cls.includes('hs-day') && lensed[1].cls.includes('hs-day') && S2.S._scroll.shown === 9 && S2.more.style.display === 'none' && S2.sec.style.display === '',
    'B6 under a lens the night\'s and the record\'s readings are kept alike, the scroll starts from its first nine, and the days still mark');
  const S3 = mkScroll(record, { kind: 'brand', value: 'Nobody' }); S3.gal.pick = gal.pick; S3.S._scrollDraw();
  ok(rowsOf(S3.host).length === 0 && /Nothing deployed under this lens yet/.test(S3.host.innerHTML) && S3.sec.style.display === '' && S3.more.style.display === 'none',
    'B7 an empty lens says so and keeps the lens row in view');
  const S4 = mkScroll(null, { kind: 'all', value: null }); S4.S._scrollDraw();
  ok(S4.sec.style.display === 'none' && S4.host.innerHTML === '', 'B8 no set and no record: nothing, and the block stays hidden');
}
ok(/_scrollDraw\(\);   \/\/ SEAM:THE_SCROLL \(NT4\): the night's readings lead the scroll; the record's follow, by day/.test(between(page, 'function _galRender(g) {', '\n}\n'))
  && /_hsMovesMerge\(\); const built = _leadBuilt;[^\n]*\n  window\._scrollDrawn = true; _leadRender\(rec\);/.test(page) && /if \(built === _leadBuilt && typeof _scrollDraw === 'function'\) _scrollDraw\(\);/.test(page)
  && /const b = document\.getElementById\('gal-block'\); if \(b\) b\.scrollIntoView\(/.test(between(page, 'function _terrOpen(slug) {', '\n}\n')) && /getElementById\('gal-block'\); if \(h\) h\.scrollIntoView/.test(between(page, 'function _navRecord() {', '\n')),
  'B9 the morning draws the scroll; the record draws it again when the lead stood (a lens, a record come again); a territory and Record land on it');

// ── C: the band, with fakes ──────────────────────────────────────────────────────────────────────────────────────────────────────
const bandSrc = between(page, 'function _renderDoorVoices(voices) {', '\n}\n') + '\n}\n';
const V = (text, likes, extra) => Object.assign({ text, likes, when: null, self: null }, extra || {});
const mkBand = (rec, yours) => {
  const el = mkNode(), track = mkNode(), vx = { pool: [] };
  const f = new Function('document', 'safe', 'safeAttr', '_FI_RECORD', '_yours', '_vx', bandSrc + 'return _renderDoorVoices;')({ getElementById: id => id === 'voices-block' ? el : id === 'voices-track' ? track : null }, esc, esc, rec, yours, vx);
  return { f, el, track, vx };
};
const RT = (id, label, deployed, voices, frame) => ({ id, label, deployed, claim: 'Claim ' + id, frame: frame || {}, voices });
const rec = { tiles: [
  RT('t-nike', 'Nike in apparel brand', '2026-11-04', [V('the retro can wait, comfort is what I pay for now', 12, { self: { generation: 'Gen Z' } }), V('short one', 2)], { entity: 'Nike' }),
  RT('t-costco', 'Costco in retail', '2026-11-05', [V('I renewed for the gas and the bulk is a bonus at this point', 44, { self: { role: 'member' } }), V('I wear mine every day at work', 40)], { category: 'retail' }),
  RT('t-hair', 'Hair care', '2026-11-03', [V('I buy the routine, not the bottle, so one missing step loses me', 24, { self: { generation: 'Gen Z' } })], { category: 'Hair care' })] };
const feed = [V('I wear mine every day at work', 40, { on: 'Costco in retail', id: 't-costco' }), V('the quiet one says little', 3, { on: null }), V('my 4c hair finally has a shelf and I am buying the set', 70, { on: 'Curl care', self: { generation: 'Gen Z', trait: '4c hair' } })];
{ const { f, el, track, vx } = mkBand(rec, { at: 1, matches: { 't-hair': 'follow' } });
  f(feed);
  const figs = [...track.innerHTML.matchAll(/<figure class="quote([^"]*)">(?:<div class="q-on">([^<]*)<\/div>)?<p>“([^”]*)”<\/p><cite>([^<]*)<\/cite>(<button[^>]*>Open the reading<\/button>)?<\/figure>/g)].map(m => ({ yours: /vx-yours/.test(m[1]), on: m[2] || null, text: m[3], who: m[4], open: !!m[5], id: (m[5] || '').replace(/^.*openFeaturedCard\('([^']*)'\).*$/, '$1') }));
  ok(figs.map(x => x.text).join('|') === 'I buy the routine, not the bottle, so one missing step loses me|I wear mine every day at work|my 4c hair finally has a shelf and I am buying the set|I renewed for the gas and the bulk is a bonus at this point|the retro can wait, comfort is what I pay for now'
    && figs[0].yours && figs[0].on === 'Hair care' && figs[0].id === 't-hair' && !figs[1].yours && figs[1].on === 'Costco' && figs[1].id === 't-costco' && figs[2].on === 'Curl care' && !figs[2].open && figs[3].on === 'Costco' && figs[4].on === 'Nike' && figs[4].id === 't-nike' && figs[4].who === 'Gen Z, 12 likes' && figs[3].who === 'A member, 44 likes'
    && el.style.display === 'block',
    'C1 one pool: the reader\'s own subject first and marked, then the feed\'s band, then the record\'s readings newest first; one text once; each labeled by its subject (the entity, the category, never the engine\'s frame) and opening its reading; the month\'s voice has no reading to open');
  ok(vx.pool.length === 7 && vx.pool.some(v => v.text === 'short one') && vx.pool.some(v => v.text === 'the quiet one says little') && !figs.some(x => x.text === 'short one' || x.text === 'the quiet one says little'),
    'C2 the band keeps a floor (eight words or ten likes); the room\'s pool keeps every voice');
  const twice = mkBand(rec, null); twice.f([V('I wear mine every day at work', 40, { on: 'Costco' }), V('a second voice long enough to stand on the band', 2), V('a third voice long enough to stand on the band', 3)]);
  ok(twice.vx.pool[0].id === 't-costco' && twice.vx.pool[0].deployed === '2026-11-05' && /openFeaturedCard\('t-costco'\)/.test(twice.track.innerHTML.split('</figure>')[0]), 'C2b a voice the feed sends without its reading takes the reading from the record\'s copy of it');
  const two = mkBand({ tiles: [] }, null); two.f([V('only two long enough voices to stand here now', 1), V('and a second one long enough to stand here', 1), V('three words', 1)]);
  ok(two.el.style.display === 'none' && two.vx.pool.length === 3, 'C3 under three voices above the floor the band stays hidden; the room still holds them');
  const none = mkBand(null, undefined); none.f(feed.concat([V('a fourth voice long enough to stand on the band', 2, { on: 'Tour dates' })]));
  ok(/<div class="q-on">Costco in retail<\/div>/.test(none.track.innerHTML) && /<div class="q-on">Tour dates<\/div>/.test(none.track.innerHTML) && (none.track.innerHTML.match(/<figure/g) || []).length === 3 && none.el.style.display === 'block' && none.vx.pool.length === 4,
    'C4 before the record arrives the band is the feed\'s, labeled as the feed labels it (the worker now writes the subject; an older feed\'s label stands until the record says the category); the pool is kept for the room');
}
ok(/if \(typeof _vx !== 'undefined' && _vx\.recAt !== \(rec\.built_at \|\| null\)\) \{ _vx\.recAt = rec\.built_at \|\| null; if \(typeof _vxRedraw === 'function'\) _vxRedraw\(\); \}/.test(page) && /if \(typeof _vxRedraw === 'function'\) _vxRedraw\(\);/.test(between(page, 'function _yoursRedraw() {', '\n}\n')),
  'C5 the band is drawn again once a record build and when the reader\'s frame arrives');

// ── D: the block, with fakes ─────────────────────────────────────────────────────────────────────────────────────────────────────
const mkBlock = (opts) => {
  const o = Object.assign({ signedOut: true, yours: null, lake: null, rec: null }, opts || {});
  const els = { 'hs-you': mkNode(), 'voices-track': Object.assign(mkNode(), { clientWidth: 1000, scrolled: [], scrollBy: function (x) { this.scrolled.push(x); } }), 'week-block': mkNode() };
  const made = [], body = Object.assign(mkNode(), { appendChild(n) { made.push(n); els[n.id] = n; }, contains: () => true });
  const doc = { body, activeElement: null, listeners: {}, getElementById: id => els[id] || null, createElement: tag => { const n = mkNode(); n.tag = tag; n.remove = () => { delete els[n.id]; }; return n; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }, removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter(x => x !== f); } };
  const win = { _signedOut: o.signedOut, _scrollDrawn: true }, fetched = [], state = { searched: 0, box: '', profile: 0, opened: [], band: [] };
  const H = new Function('document', 'window', '_galApi', '_authHeader', 'fetch', 'safe', 'safeAttr', '_yours', '_FI_LAKE', '_FI_RECORD', '_renderDoorVoices', 'setSearch', 'runSearch', '_profileOpen', 'openFeaturedCard', 'matchMedia', 'Date',
    blk + '; return { _vx, _you, _hsSrc, _hsImgFail, _weekCover, _vxRedraw, _vxStep, _vxWho, _vxRoomOpen, _vxRoomClose, _vxRoomSet, _vxRoomDraw, _youLoad, _youForget, _youSync, _youRender, _youAsk };')(
    doc, win, p => 'https://api.example' + p, async () => ({ Authorization: 'Bearer t' }), async (u, oo) => { fetched.push({ u, oo }); const b = o.fetch ? o.fetch(u) : null; return { ok: !!b, json: async () => b }; }, esc, esc, o.yours, o.lake, o.rec, v => state.band.push(v), q => { state.box = q; }, () => { state.searched++; }, () => { state.profile++; }, id => state.opened.push(id), () => ({ matches: false }), Date);
  return { H, els, doc, body, win, fetched, state, made };
};
{ const { H } = mkBlock({ rec: { tiles: [{ id: '0a0a0a0a-0000-4000-8000-000000000000' }] } });
  ok(H._hsSrc({ id: '0A0A0A0A-0000-4000-8000-000000000000', photo: { src: 'https://o/x.jpg' } }) === 'https://api.example/img/r/0a0a0a0a-0000-4000-8000-000000000000' && H._hsSrc({ id: 'theme:x', photo: { src: 'https://o/x.jpg' } }) === 'https://o/x.jpg' && H._hsSrc({ id: uuid(1) }) === ''
    && H._hsSrc({ id: uuid(2), photo: { src: 'https://o/p.jpg' } }) === 'https://o/p.jpg',
    'D1 a reading the record holds loads its photograph through the relay by its id; a reading the page does not know as public (a seat\'s own) from the sources\' own address; none without one');
  ok(H._weekCover({ cover: ' Parents buy the second pair where the first held up. ' }) === 'Parents buy the second pair where the first held up' && H._weekCover({ cover: 'Signal tracking shows the aisle moved' }) === '' && H._weekCover({ cover: 'one two three four five six seven eight nine ten eleven twelve thirteen' }) === ''
    && H._weekCover({ cover: 'The week: parents bought' }) === '' && H._weekCover({ cover: 'Two words' }) === '' && H._weekCover(null) === '' && H._weekCover({ cover: 'Coverage fell for sneakers this week' }) === '',
    'D2 the cover line holds when it is three to twelve words, one claim, no colon, and never about the measure or the lake');
  const img = (attrs, parent) => { const n = { attrs: Object.assign({}, attrs), removed: 0, getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; }, removeAttribute(k) { delete this.attrs[k]; }, remove() { this.removed++; }, parentNode: parent }; Object.defineProperty(n, 'src', { get() { return n.attrs.src; }, set(v) { n.attrs.src = v; } }); return n; };
  const fig = () => Object.assign(mkNode(), { removed: 0, remove() { this.removed++; }, querySelector(s) { return s === '.hs-face-name' ? (this.face ? {} : null) : s === 'figcaption' ? this.cap : null; } });
  const a = img({ 'data-src': 'https://o/direct.jpg', src: 'https://api/img/r/x' }, fig()); H._hsImgFail(a);
  const card = fig(); card.face = true; card.cap = { removed: 0, remove() { this.removed++; } }; const b = img({ src: 'https://o/direct.jpg' }, card); H._hsImgFail(b);
  const { H: H2, els } = mkBlock(); const wfig = fig(); const c = img({ src: 'x' }, wfig); c.id = 'week-img'; H2._hsImgFail(c);
  const box = { children: [], removed: 0, remove() { this.removed++; } }, btn = Object.assign(mkNode(), { removed: 0, remove() { this.removed++; box.children = []; }, querySelector: () => null }); const d = img({ src: 'x' }, btn); d.closest = s => (s === '.rec-cur-faces' ? box : null); H._hsImgFail(d);
  ok(a.attrs.src === 'https://o/direct.jpg' && a.attrs['data-src'] === undefined && a.removed === 0 && card.cls.has('hs-face') && card.cap.removed === 1 && b.removed === 1 && wfig.style.display === 'none' && els['week-block'].cls.has('nophoto') && btn.removed === 1 && box.removed === 1,
    'D3 a photograph that does not land: the sources\' own address is tried once; then a card shows the subject\'s name, the week shows no photograph, and a current\'s empty faces box goes');
}
{ const { H, els, body, state, fetched, win } = mkBlock({ signedOut: false, yours: { at: 1, has: true, frame: { tracked_brands: ['Nike', 'Hoka', 'On'], markets: ['US', 'UK'] } }, fetch: u => (/searches\/mine$/.test(u) ? { ok: true, questions: [{ q: 'Nike in athletic footwear', depth: 'full', at: '2026-11-04T10:00:00Z' }, { q: 'Who is buying smart glasses', depth: 'quick', at: '2026-11-03T10:00:00Z' }] } : null) });
  await H._youLoad(); await H._youLoad();
  const you = els['hs-you'].innerHTML;
  ok(fetched.length === 1 && /\/excavate\/searches\/mine$/.test(fetched[0].u) && fetched[0].oo.headers.Authorization === 'Bearer t' && /<div class="hs-you-k">Your frame<\/div><div class="hs-you-frame">Nike · Hoka · On<span>US · UK<\/span><button type="button" class="hs-you-edit" onclick="_profileOpen\(\)">Edit<\/button><\/div>/.test(you)
    && /<div class="hs-you-k">Your last questions<\/div>/.test(you) && (you.match(/<button type="button" data-q="/g) || []).length === 2 && you.indexOf('Nike in athletic footwear') < you.indexOf('Who is buying smart glasses') && els['hs-you'].style.display === '' && body.cls.has('hs-you-on'),
    'D4 signed in: the reader\'s frame (the brands they watch, their markets, Edit) and their last questions, read once in ten minutes with the sign-in');
  H._youAsk({ getAttribute: () => 'Who is buying smart glasses' });
  ok(state.box === 'Who is buying smart glasses' && state.searched === 1, 'D5 a last question goes back into the box and runs');
  win._signedOut = true; H._youSync();
  ok(els['hs-you'].style.display === 'none' && els['hs-you'].innerHTML === '' && !body.cls.has('hs-you-on') && H._you.at === 0 && H._you.qs.length === 0, 'D6 signing out takes the reader\'s side away and forgets the questions');
  const bare = mkBlock({ signedOut: false, yours: { at: 1, has: false, frame: { tracked_brands: [], markets: [] } }, fetch: () => ({ ok: true, questions: [] }) });
  await bare.H._youLoad();
  const cat = mkBlock({ signedOut: false, yours: { at: 1, has: true, frame: { tracked_brands: [], markets: [] } }, fetch: () => ({ ok: true, questions: [] }) }); cat.H._youRender();
  ok(/<button type="button" class="hs-you-set" onclick="_profileOpen\(\)">Set your frame<\/button>/.test(bare.els['hs-you'].innerHTML) && !/Your last questions/.test(bare.els['hs-you'].innerHTML) && bare.els['hs-you'].style.display === ''
    && /<div class="hs-you-frame"><span>As set in your profile\.<\/span><button type="button" class="hs-you-edit"/.test(cat.els['hs-you'].innerHTML) && !/Set your frame/.test(cat.els['hs-you'].innerHTML),
    'D7 a reader without a frame is offered the way to set one (no questions, no row for them); a reader framed by categories or audiences alone is never told to set one');
  const out = mkBlock({ signedOut: true, yours: { at: 1, has: true, frame: { tracked_brands: ['Nike'], markets: [] } } }); out.H._youRender(); await out.H._youLoad();
  ok(out.els['hs-you'].style.display === 'none' && out.fetched.length === 0, 'D8 signed out: nothing of the reader\'s, and nothing is asked for');
}
{ const pool = [{ text: 'I renewed for the gas and the bulk is a bonus', likes: 44, when: '2026-11-01', self: { role: 'member' }, on: 'Costco', id: 't-costco', deployed: '2026-11-05', yours: false },
    { text: 'comfort first, the retro can wait for the resale', likes: 12, when: '2026-11-03', self: { generation: 'Gen Z' }, on: 'Nike', id: 't-nike', deployed: '2026-11-04', yours: true },
    { text: 'my 4c hair finally has a shelf', likes: 70, when: '2026-10-29', self: { generation: 'Gen Z' }, on: 'Curl care', id: null, deployed: null, yours: false }];
  const { H, els, doc, body, state, made } = mkBlock({ rec: { tiles: [{ id: 't-costco', claim: 'Members buy the card for the gas' }, { id: 't-nike', claim: 'Comfort beats the retro calendar' }] } });
  H._vx.pool = pool; doc.activeElement = { focused: 0, focus() { this.focused++; } };
  const from = doc.activeElement;
  H._vxRoomOpen();
  const wrap = made[0];
  ok(wrap && wrap.id === 'vx-room' && /Every voice, as written\./.test(wrap.innerHTML) && /on the subjects we read/.test(wrap.innerHTML) && !/the house/.test(wrap.innerHTML) && body.cls.has('vx-room-open') && (doc.listeners.keydown || []).length === 1 && !DASH.test(wrap.innerHTML),
    'D9 All voices opens the room: its words, no machinery, Escape wired');
  // the room draws into its rows and grid: give them to the fake document and draw again
  els['vx-rows'] = mkNode(); els['vx-grid'] = mkNode(); els['vx-q'] = mkNode();
  H._vxRoomDraw();
  const rows = els['vx-rows'].innerHTML, grid = els['vx-grid'].innerHTML;
  ok(/<span class="vx-rk">Subject<\/span><button type="button" class="vx-chip on" onclick="_vxRoomSet\('on', &quot;&quot;\)" aria-pressed="true">All<\/button>/.test(rows) && /Costco<\/button>/.test(rows) && /Nike<\/button>/.test(rows) && /Curl care<\/button>/.test(rows)
    && /<span class="vx-rk">Who<\/span>/.test(rows) && /Everyone<\/button>/.test(rows) && /Gen Z<\/button>/.test(rows) && /A member<\/button>/.test(rows) && /Most liked<\/button>/.test(rows) && /Newest<\/button>/.test(rows)
    && (grid.match(/<figure/g) || []).length === 3 && grid.indexOf('4c hair') < grid.indexOf('renewed for the gas') && grid.indexOf('renewed for the gas') < grid.indexOf('comfort first') && /<div class="vx-on-read">On: Members buy the card for the gas<\/div><button type="button" class="vx-open" onclick="_vxRoomClose\(\);openFeaturedCard\('t-costco'\)">Open the reading<\/button>/.test(grid)
    && !/Open the reading/.test(grid.split('</figure>')[0]) && /class="quote vx-yours"/.test(grid.split('</figure>')[2]),
    'D10 the room: subject, who and order chips; every voice most liked first, the reader\'s own marked, each with its reading named and opened');
  H._vxRoomSet('on', 'Nike');
  const g2 = els['vx-grid'].innerHTML;
  ok((g2.match(/<figure/g) || []).length === 1 && /comfort first/.test(g2) && /class="vx-chip on" onclick="_vxRoomSet\('on', &quot;Nike&quot;\)"/.test(els['vx-rows'].innerHTML), 'D11 a subject chip keeps that subject\'s voices');
  H._vxRoomSet('on', 'Nike'); H._vxRoomSet('order', 'newest');
  const g3 = els['vx-grid'].innerHTML;
  ok((g3.match(/<figure/g) || []).length === 3 && g3.indexOf('comfort first') < g3.indexOf('renewed for the gas') && g3.indexOf('renewed for the gas') < g3.indexOf('4c hair'), 'D12 a chip pressed again lets go; Newest orders by the voice\'s own date');
  H._vxRoomSet('q', 'SHELF');
  ok((els['vx-grid'].innerHTML.match(/<figure/g) || []).length === 1 && /4c hair/.test(els['vx-grid'].innerHTML), 'D13 a word searched keeps the voices that say it');
  H._vxRoomSet('q', 'nothing like this');
  ok(/No voice says that yet\./.test(els['vx-grid'].innerHTML), 'D14 no match says so');
  doc.listeners.keydown[0]({ key: 'Escape', preventDefault() {} });
  ok(!els['vx-room'] && !body.cls.has('vx-room-open') && (doc.listeners.keydown || []).length === 0 && from.focused === 1 && H._vx.room === null, 'D15 Escape closes the room and hands focus back to All voices');
  H._vxStep(1); H._vxStep(-1);
  ok(els['voices-track'].scrolled.length === 2 && els['voices-track'].scrolled[0].left === 960 && els['voices-track'].scrolled[1].left === -960, 'D16 the arrows move the band by a screen');
  ok(H._vxWho({ self: { generation: 'Gen Z', role: 'nurse' }, likes: 1 }) === 'Gen Z, a nurse, 1 like' && H._vxWho({ self: null, likes: 0 }) === 'Consumer' && H._vxWho({ self: { role: 'parent' }, likes: 1240 }) === 'A parent, 1,240 likes', 'D17 who a voice is: generation, role, else Consumer; the likes after');
  const lake = mkBlock({ lake: { voices: [{ text: 'x' }] } }); lake.win._scrollDrawn = true; lake.H._vxRedraw(); const nolake = mkBlock({ lake: null }); nolake.H._vxRedraw();
  ok(lake.state.band.length === 1 && lake.state.band[0][0].text === 'x' && nolake.state.band.length === 0, 'D18 the band is drawn again from the feed the page holds, never before the feed');
}

// ── E: the worker ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const measureSrc = between(w, 'function excMeasureClaim(text) {', '/* PURE: the lines of a compiled reading that name the measure') ;
const M = new Function(measureSrc + '; return { excMeasureClaim, weekCoverOk };')();
ok(M.excMeasureClaim('Signal tracking shows 7 mentions this week for Costco, per Unsurfaced Lake') && M.excMeasureClaim('The lake counts the aisle') && M.excMeasureClaim('tracked over 4 weeks') && M.excMeasureClaim('Our tracking shows a quiet month') && M.excMeasureClaim('14 mentions across the month') && M.excMeasureClaim('Gas lines were the most covered Costco story this week') && M.excMeasureClaim('Story coverage doubled after the recall')
  && !M.excMeasureClaim('She mentions her mother in every clip') && !M.excMeasureClaim('Thrift is the first stop for the holiday party') && !M.excMeasureClaim('Lake Tahoe cabins book out by June') && !M.excMeasureClaim('A summer house on the lake sells in a weekend') && !M.excMeasureClaim('Insurance coverage doubled for renters after the storm') && !M.excMeasureClaim('Package tracking shows the delay at the port') && !M.excMeasureClaim('The data shows renters staying longer'),
  'E1 a dek in the house\'s own measure words is a measure claim; a figure from the evidence, a person who mentions something, a lake with a name, insurance coverage, package tracking are not');
ok(M.weekCoverOk(' Parents buy the second pair where the first held up. ') === 'Parents buy the second pair where the first held up' && M.weekCoverOk('Signal tracking shows the aisle moved') === '' && M.weekCoverOk('The week: parents bought twice') === '' && M.weekCoverOk('Too short') === '' && M.weekCoverOk('a b c d e f g h i j k l m') === '' && M.weekCoverOk(null) === '' && M.weekCoverOk('Costco buyers renew for the gas — and stay') === '',
  'E2 the cover line is kept when it holds: three to twelve words, no colon, no dash, never the measure');
ok(/"cover":<the week\\'s cover line: the read\\'s first sentence said as a headline, one claim about people in at most twelve words, no figure, no count, no colon, no em dash>,/.test(w) && /this week\\'s read: exactly 2 sentences, under 44 words total\. The first is a plain statement about people/.test(w)
  && /fieldCover = typeof weekCoverOk === 'function' \? weekCoverOk\(j && j\.cover\) : '';/.test(w) && /field: \{ read: fieldRead, cover: fieldCover, states: stateCounts, anchors_on: anchorsOn \},/.test(w),
  'E3 the writer is asked for the cover line beside the read (the read\'s own law untouched); it is checked and rides the field');
ok(/dek: rd && rd\.read && rd\.read\[1\] && r\.night >= '2026-10-10' && !\(typeof excMeasureClaim === 'function' && excMeasureClaim\(rd\.read\[1\]\)\) \? rd\.read\[1\] : null,/.test(between(w, 'function doorTile(r) {', '\n}\n')),
  'E4 a published dek about the measure or the lake comes off the tile, whenever it was written (a new one is held at doorLand, as EX52a holds a claim about the instrument)');
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));
const dvSrc = between(w, 'const DOOR_VOICES = {', '/* The voices alone, for the tiles standing now');
const D = new Function('RAIL_FNS', 'RAIL_BY_ID', 'excQuiet', 'READ_LOADED', voiceSrc + dvSrc + '; return { DOOR_VOICES, doorVoicePick, doorBand, doorSubjectOf, voiceBarred };')({}, {}, () => () => null, /\b(?:pervs?|glassholes?)\b/i);
ok(D.doorSubjectOf({ label: 'Nike in apparel brand', frame: { entity: 'Nike', category: 'apparel brand' } }) === 'Nike' && D.doorSubjectOf({ label: 'Family packs', frame: { category: 'athletic footwear', audience: 'parents' } }) === 'Family packs' && D.doorSubjectOf({ frame: { category: 'Hair care' } }) === 'Hair care' && D.doorSubjectOf({ label: 'Costco in retail', frame: { category: 'Retail' } }) === 'Costco' && D.doorSubjectOf({ label: 'Costco in retail' }) === 'Costco in retail' && D.doorSubjectOf({ label: 'Made in America festival', frame: { category: 'music' } }) === 'Made in America festival' && D.doorSubjectOf({ title: 'Tour dates' }) === 'Tour dates' && D.doorSubjectOf({}) === null,
  'E5 a subject as a reader says it: the entity, else the label without the engine\'s own tail (the frame\'s category), else the category; a label\'s own words stand');
const band = D.doorBand([{ id: 't1', label: 'Nike in apparel brand', frame: { entity: 'Nike' }, voices: [{ text: 'comfort first, the retro can wait', likes: 12 }, { text: 'those glassholes again, every one of them', likes: 99 }] }, { id: 't2', label: 'Costco in retail', frame: { category: 'retail' }, voices: [{ text: 'I renewed for the gas', likes: 44 }] }], [{ text: 'the month said so', likes: 5 }]);
ok(band.map(v => v.on + ':' + v.id + ':' + v.text).join('|') === 'Nike:t1:comfort first, the retro can wait|Costco:t2:I renewed for the gas|null:null:the month said so' && band.every(v => Object.keys(v).sort().join(',') === 'id,likes,on,self,text,when'),
  'E6 the band labels a voice by its subject, names the reading it speaks to, and never carries a barred voice; the month\'s voice has neither');
const picked = D.doorVoicePick([{ text: 'a clean voice long enough to keep here', likes: 9, when: '2026-11-01' }, { text: 'those pervs again, long enough to keep', likes: 900, when: '2026-11-01' }], Date.parse('2026-11-05T00:00:00Z'), 6, 2);
ok(picked.length === 1 && /clean voice/.test(picked[0].text) && D.voiceBarred('what a glasshole') && !D.voiceBarred('a glass of water'), 'E7 a barred voice is never kept for a subject; the bar reads the register law\'s own list too');
ok(/voices: \(r\.meta && Array\.isArray\(r\.meta\.voices\) \? r\.meta\.voices : \[\]\)\.filter\(v => v && v\.text && !\(typeof voiceBarred === 'function' && voiceBarred\(v\.text\)\)\)\.slice\(0, DOOR_VOICES\.KEEP\)\.map\(doorVoicePublic\) \};/.test(w), 'E8 a tile\'s voices keep the bar');
// the reader's questions
const smSrc = between(w, 'async function searchesMineRoute(env, origin, user) {', '\n}\n') + '\n}\n';
let asked = [];
const SM = new Function('sbRest', 'json', 'excQuiet', 'SEARCHES', smSrc + '; return searchesMineRoute;')(async (env, p) => { asked.push(p); return [{ query: 'Nike in athletic footwear', depth: 'full', created_at: '2026-11-04' }, { query: '  nike in  athletic footwear ', depth: 'quick', created_at: '2026-11-03' }, { query: '', created_at: '2026-11-02' }].concat(Array.from({ length: 9 }, (_, i) => ({ query: 'Q' + i, depth: 'full', created_at: '2026-10-2' + i }))); }, (o, st) => Object.assign({ status: st }, o), () => () => [], { MINE: 6 });
const sm = await SM({}, 'o', { id: 'u-1' });
ok(sm.ok && asked.length === 1 && /^searches\?user_id=eq\.u-1&status=in\.\(compiled,partial,cached\)&select=query,depth,created_at&order=created_at\.desc&limit=40$/.test(asked[0]) && sm.questions.length === 6 && sm.questions[0].q === 'Nike in athletic footwear' && sm.questions[0].at === '2026-11-04' && sm.questions[1].q === 'Q0' && sm.questions.every(q => Object.keys(q).sort().join() === 'at,depth,q'),
  'E9 the reader\'s own answered questions, distinct (case and spacing aside), newest first, six at most, nothing but the words, the depth and the date');
ok(/if \(path === '\/excavate\/searches\/mine' && request\.method === 'GET'\) return searchesMineRoute\(env, origin, user\);/.test(w) && w.indexOf("path === '/excavate/searches/mine'") > w.indexOf('const user = await authenticate(request, env);') && w.indexOf("path === '/excavate/searches/mine'") < w.indexOf("const _aiPath = path === '/play/generate'")
  && /const SEARCHES = \{ PAGE: 50, MAX_PAGE: 200, STATUS: \['compiled', 'partial', 'cached', 'refused'\], ASKED: 100, MINE: 6 \};/.test(w),
  'E10 the route is signed in and ahead of the meter; it never spends');
// the relay
const relaySrc = between(w, 'const ARRIVAL_IMG = {', 'async function readImageRelay(path, env) {');
const mkRelay = (opts) => {
  const o = Object.assign({ rows: [], photo: null, fetches: {} }, opts || {});
  const store = new Map(), calls = { db: [], fetch: [], log: [] };
  const caches = { default: { match: async k => store.get(k.url) || null, put: async (k, r) => { store.set(k.url, r); } } };
  const R = new Function('caches', 'sbRest', 'doorPhoto', 'readImgUrl', 'readImgLarger', 'readImgFetch', 'pvMeta', 'READ_IMG', 'excQuiet', 'console', relaySrc + '; return { arrivalImageRelay, ARRIVAL_IMG };')(
    caches, async (env, p) => { calls.db.push(p); return o.rows; }, () => o.photo, (raw, base) => (raw && /^https:\/\//.test(String(raw)) ? String(raw) : null), href => href.replace(/\?.*$/, ''),
    async (href, accept, cf) => { calls.fetch.push({ href, accept, cf }); const f = o.fetches[href]; return f ? f() : null; }, (html, prop) => { const m = new RegExp(prop + '=([^ ]+)').exec(html); return m ? m[1] : null; },
    { MAX_BYTES: 6000000, TTL: 604800, MISS_TTL: 86400, HTML_BYTES: 400000 }, () => () => [], { log: (...a) => calls.log.push(a.join(' ')) });
  return { R, calls, store };
};
const bytes = n => new Uint8Array(n).fill(1).buffer;
const imgRes = (n, type) => () => new Response(bytes(n), { status: 200, headers: { 'content-type': type || 'image/jpeg' } });
{ const id = uuid(7);
  const { R, calls, store } = mkRelay({ rows: [{ read: { insights: [{ image: 'https://o/pic.jpg?w=400', sourceUrl: 'https://o/story' }] }, evidence: [] }], photo: { src: 'https://o/pic.jpg?w=400', credit: 'Outlet' },
    fetches: { 'https://o/pic.jpg': imgRes(20000), 'https://o/story': () => new Response('og:image=https://o/og.jpg', { status: 200, headers: { 'content-type': 'text/html' } }), 'https://o/og.jpg': imgRes(30000), 'https://o/pic.jpg?w=400': imgRes(5000) } });
  const bad = await R.arrivalImageRelay('/img/r/not-an-id', {});
  const res = await R.arrivalImageRelay('/img/r/' + id.toUpperCase(), {});
  ok(bad.status === 404 && res.status === 200 && res.headers.get('content-type') === 'image/jpeg' && res.headers.get('x-img-from') === 'full' && res.headers.get('cache-control') === 'public, max-age=604800' && res.headers.get('access-control-allow-origin') === '*'
    && calls.db.length === 1 && /^door_reads\?id=eq\.0000000[0-9a-f-]+&status=in\.\(ready,reused\)&select=read,evidence&limit=1$/.test(calls.db[0]) && calls.fetch.length === 1 && calls.fetch[0].href === 'https://o/pic.jpg' && calls.fetch[0].cf.image.width === R.ARRIVAL_IMG.WIDTH && (await res.arrayBuffer()).byteLength === 20000,
    'E11 a public reading\'s photograph: the stored address with its size taken off, fetched by the worker, resized at the edge, served with a week\'s cache and open to the page; the id is read in any case');
  const again = await R.arrivalImageRelay('/img/r/' + id, {});
  ok(again.status === 200 && calls.db.length === 1 && calls.fetch.length === 1 && store.size === 1, 'E12 the second ask is answered from the edge: no database, no fetch');
}
{ const id = uuid(8);
  const { R, calls } = mkRelay({ rows: [{ read: { insights: [{ image: 'https://o/pic.jpg', sourceUrl: 'https://o/story' }] }, evidence: [] }], photo: { src: 'https://o/pic.jpg', credit: 'Outlet' },
    fetches: { 'https://o/pic.jpg': imgRes(4000), 'https://o/story': () => new Response('og:image=https://o/og.jpg', { status: 200, headers: { 'content-type': 'text/html' } }), 'https://o/og.jpg': imgRes(90000, 'image/webp') } });
  const res = await R.arrivalImageRelay('/img/r/' + id, {});
  ok(res.status === 200 && res.headers.get('x-img-from') === 'og' && res.headers.get('content-type') === 'image/webp' && calls.fetch.map(f => f.href).join() === 'https://o/pic.jpg,https://o/story,https://o/og.jpg',
    'E13 a logo-sized file is not a photograph: the source page\'s own image is tried next, and the stored address is never fetched twice');
}
{ const id = uuid(9);
  const { R, calls, store } = mkRelay({ rows: [{ read: { insights: [{ image: 'https://o/pic.jpg', sourceUrl: null }] }, evidence: [] }], photo: { src: 'https://o/pic.jpg' }, fetches: { 'https://o/pic.jpg': () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }) } });
  const res = await R.arrivalImageRelay('/img/r/' + id, {});
  const none = mkRelay({ rows: [], photo: null }); const r2 = await none.R.arrivalImageRelay('/img/r/' + uuid(10), {});
  const nophoto = mkRelay({ rows: [{ read: {}, evidence: [] }], photo: null }); const r3 = await nophoto.R.arrivalImageRelay('/img/r/' + uuid(11), {});
  ok(res.status === 404 && res.headers.get('cache-control') === 'public, max-age=86400' && store.size === 1 && /no_image_served/.test(calls.log.join()) && r2.status === 404 && /not_public/.test(none.calls.log.join()) && none.calls.fetch.length === 0 && r3.status === 404 && /no_photo/.test(nophoto.calls.log.join()),
    'E14 a non-image, a reading that is not public and a reading without a photograph answer 404, kept a day, and nothing is fetched for a reading that is not public');
}
ok(/if \(\(request\.method === 'GET' \|\| request\.method === 'HEAD'\) && path\.startsWith\('\/img\/r\/'\)\) return arrivalImageRelay\(path, env\);/.test(w) && w.indexOf("path.startsWith('/img/r/')") < w.indexOf('const user = await authenticate(request, env);') && /status=in\.\(ready,reused\)&select=read,evidence&limit=1/.test(relaySrc) && !/space_reads/.test(relaySrc),
  'E15 the relay is public and reads door_reads only (a private space\'s reading never sits there), by status ready or reused');
ok(seams.registry['SEAM:THE_SCROLL'] && seams.registry['SEAM:THE_SCROLL'].file === 'worker/src/index.js' && seams.registry['SEAM:THE_SCROLL@intelligence'] && seams.registry['SEAM:THE_SCROLL@intelligence'].tag === 'SEAM:THE_SCROLL' && seams.registry['SEAM:THE_SCROLL@intelligence'].file === 'intelligence/index.html'
  && /SEAM:THE_SCROLL/.test(w) && /SEAM:THE_SCROLL/.test(page) && !/\bAhni\b/i.test(page + w),
  'E16 the seam is registered for the worker and the page');
console.log(`\nproof_the_scroll: ${pass} checks PASS`);
