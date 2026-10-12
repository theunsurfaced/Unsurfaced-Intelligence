/**
 * proof_face.mjs  --  EX40 THE FACE OF THE RECORD: SEAM:RECORD_FACE. A current resolves its subjects against the record's tiles and shows
 * their photographs, their summed pulse, a folded body and buttons that open the readings. Nothing fetched. Run from the repo root.
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const src = between(page, 'function _curResolve(c, tiles) {', 'function _curToggle(btn) {');
const R = new Function(src + '; return _curResolve;')();
const tiles = [
  { id: 'a', label: 'OpenAI in artificial intelligence', frame: { entity: 'OpenAI', category: 'artificial intelligence' }, photo: { src: 'https://p/a.jpg', credit: 'The Verge' }, measures: { series: [1, 2, 3] } },
  { id: 'b', label: 'Nvidia in semiconductor technology', frame: { entity: 'Nvidia' }, photo: { src: 'https://p/b.jpg', credit: '' }, measures: { series: [2, 2, 2] } },
  { id: 'c', label: 'Apple in consumer electronics', frame: { entity: 'Apple' }, photo: { src: 'https://p/a.jpg', credit: 'The Verge' }, measures: { series: [0, 0, 0] } },
  { id: 'd', label: 'Microsoft in technology company', frame: { entity: 'Microsoft' }, photo: null, measures: {} }
];
const r = R({ subjects: ['OpenAI in artificial intelligence', 'Nvidia in semiconductor technology', 'Apple in consumer electronics', 'Microsoft in technology company', 'Somebody in nothing'] }, tiles);
ok(r.subs.length === 5 && r.subs[0].tile.id === 'a' && r.subs[0].short === 'OpenAI' && r.subs[4].tile === null && r.subs[4].short === 'Somebody', 'F1 subjects resolve to the record\'s tiles by label; an unknown one keeps its short name and opens nothing');
ok(r.faces.length === 2 && r.faces.map(f => f.id).join() === 'a,b', 'F2 the faces are the readings\' photographs, each once (a shared photograph is not repeated), at most three');
ok(r.series && r.series.join() === '3,4,5', 'F3 the pulse is the readings\' twelve-week series summed');
ok(R({ subjects: ['Microsoft in technology company'] }, tiles).series === null && R({ subjects: ['Microsoft in technology company'] }, tiles).faces.length === 0 && /class="rec-cur-faces big-pulse"/.test(page) && /class="rec-cur-faces names"/.test(page) && !/nofaces/.test(between(page, 'function _renderCurrents(cur, tilesIn) {', 'const LEAD = {')), 'F4 every current has a face: the photographs, else the pulse drawn large, else the subjects\' names set large; no card goes without');
ok(/function _renderCurrents\(cur, tilesIn\)/.test(page) && /_renderCurrents\(rec\.currents, rec\.tiles\);   \/\/ SEAM:CROSS_CURRENTS/.test(page) && /onclick="event\.stopPropagation\(\);openFeaturedCard\('\$\{safeAttr\(f\.id\)\}'\)"/.test(page) && /class="rec-cur-more" aria-expanded="false" onclick="_curToggle\(this\)"/.test(page), 'F5 the renderer takes the tiles, a face opens its reading, a long body folds behind More');
ok(/\.rec-cur p\.body\{display:-webkit-box;-webkit-line-clamp:5/.test(page) && /\.rec-cur-faces\.n3\{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr\}/.test(page) && /@media \(max-width:640px\)\{\.rec-cur-grid\.n2,\.rec-cur-grid\.n3,\.rec-cur-grid\.n4\{grid-template-columns:1fr\}/.test(page), 'F6 five lines folded; three faces as one large and two small; one column on a phone');
console.log('proof_face: ' + pass + ' ok');
