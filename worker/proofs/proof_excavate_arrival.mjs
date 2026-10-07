/**
 * proof_excavate_arrival.mjs  --  EX1c: the arrival grid holds 8 to 12 honest
 * tiles, keeps each tile's lens, and leads each photo tile with its photo.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };

const arr = between('const ARRIVAL = ', 'async function excavateFeed(');
const A = new Function('PROPOSE_LENS', arr + '; return arrivalTiles;')(['consumer', 'market', 'culture', 'brand']);
const six = Array.from({ length: 6 }, (_, i) => ({ id: 'lake-' + i, cluster_id: 'c' + i, lens: 'market', title: 'Pattern ' + i, state: 'COOLING' }));
const desk = Array.from({ length: 20 }, (_, i) => ({ cluster_id: i < 2 ? 'c' + i : 'd' + i, title: 'Desk story ' + i, lens: i % 2 ? 'brand' : 'truth', score: i,
  line: 'line ' + i, state: 'EMERGING', territory: 'music', url: 'https://x.example/' + i, source_name: 'Billboard', image: null,
  components: { counts: { recent_7d: i, sources: 3, weeks: 2, members: 5 } } }));
const t = A(six, desk);
ok(t.length === 12, 'A1 six recurring patterns plus desk fill make 12 tiles');
ok(t.slice(0, 6).every(x => x.id.startsWith('lake-')) && t.slice(6).every(x => x.provenance === 'desk'), 'A2 recurring patterns lead; the desk fills after them');
ok(new Set(t.map(x => x.cluster_id)).size === 12, 'A3 no cluster appears twice (a desk item already shown is skipped)');
ok(t[6].title === 'Desk story 19' && t[6].stat === '↑ 19 signals this week' && t[6].subtitle === 'From the desk · music', 'A4 the fill is the desk\'s highest scores, with real counts, marked From the desk');
ok(t.slice(6).every(x => ['consumer', 'market', 'culture', 'brand'].includes(x.lens)), 'A5 a desk lens outside the four (truth) lands on a real lens');
ok(A(Array.from({ length: 14 }, (_, i) => ({ cluster_id: 'p' + i })), desk).length === 12, 'A6 never more than 12');
ok(A([], []).length === 0 && A(six.slice(0, 3), []).length === 3, 'A7 a thin lake shows fewer tiles, never invented ones');
ok(/lens: \(d && d\.lens\) \|\| p\.lens \|\| null/.test(w), 'A8 a tile keeps its own lens unless the desk names one');
ok(/const want = Math\.min\(12,/.test(w) && /WANT: 12,/.test(w) && /max_tokens: 8000 \}\);   \/\/ room for 12/.test(w), 'A9 PROPOSE may name 12 patterns, with room to write them (and to think first)');
ok(/states\[st\] = \(states\[st\] \|\| 0\) \+ 1/.test(between('async function excavateFeed(', 'function ilikeOr(')), 'A10 the state chips count every tile shown');

const card = page.slice(page.indexOf('function _renderLakeCard('), page.indexOf('function _renderLakeGrid('));
ok(card.indexOf('class="card-img"') < card.indexOf('fi-state-tag') && card.indexOf('class="card-img"') < card.indexOf('card-cat'), 'P1 the photo leads the tile; tag and chip come after it');
ok(/has-img/.test(card) && /\.insight-card\.has-img::after\{display:none\}/.test(page) && /\.insight-card\.has-img \.fi-state-tag\{background:rgba\(8,8,10,\.82\);z-index:var\(--z-raise\)\}/.test(page), 'P2 the tag rides on a dark plate; the corner ornament steps aside');
ok(/k\.classList\.remove\('has-img'\)/.test(card), 'P3 a photo that fails returns the tile to its text layout');
ok(/\$\{safe\(card\.title\)\}/.test(card), 'P4 tile titles are escaped');
ok(/_FI_CACHE_KEY  = 'unsurfaced_fi_v6'/.test(page) && /localStorage\.removeItem\('unsurfaced_fi_v5'\)/.test(page), 'P5 the grid cache moves on (v6: the band never carries a RECON\'s quotes; v5 is dropped): visitors see the new grid now');
console.log(`\nproof_excavate_arrival: ${pass} checks PASS`);
