/**
 * proof_name.mjs  --  EX41 THE NAME: SEAM:EXC_NAME. The names in a query are found before the frame (record, tracked, graph) and ride
 * into the framer under a law; the frame carries how it was read; the page says so. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const fnOf = (name) => { const m = w.match(new RegExp('^(?:async )?function ' + name + '\\(', 'm')); const i = m.index; const j = w.indexOf('\n}\n', i); return w.slice(i, j + 3); };
const src = [between(w, 'const NAME = {', 'function excNameCandidates('), fnOf('excNameCandidates'), fnOf('excNameHints'), fnOf('excNamePrompt')].join('\n');
const railFetch = async () => ({ itemListElement: [{ result: { name: 'Earn Your Leisure', '@type': ['Organization', 'Thing'], description: 'American financial literacy podcast and media company', resultScore: 812 } }, { result: { name: 'Leisure', '@type': ['Thing'], description: 'Concept', resultScore: 12 } }] });
const loadTracks = async () => [{ name: 'Nike', aliases: ['Nike Inc'], kind: 'brand', sector: 'athletic footwear' }];
const sbRest = async () => [{ title: 'Earn Your Leisure co-founders on why financial empowerment matters' }, { title: 'Rashad Bilal of Earn Your Leisure sounds off on Invest Fest' }];
const F = new Function('railFetch', 'loadTracks', 'sbRest', 'excQuiet', src + '\nreturn { excNameCandidates, excNameHints, excNamePrompt };')(railFetch, loadTracks, sbRest, () => () => null);
const h = await F.excNameHints({ GOOGLE_KG_KEY: 'k' }, "Earn your leisure market Monday's");
ok(h.length === 1 && h[0].name === 'Earn Your Leisure' && h[0].from.join() === 'graph,record' && /organization: American financial literacy/.test(h[0].what), 'N1 the name is found by the graph and the record and merged once; a low-score concept is not a name');
ok(/Names found in this query: 1\. Earn Your Leisure \(organization: American financial literacy podcast and media company\) \[graph, record\]\. Law: when the query carries a known name, the entity is that name/.test(F.excNamePrompt(h)), 'N2 the names ride into the framer with what they are, where they were found, and the law');
ok((await F.excNameHints({}, 'sneakers')).length === 0 && F.excNameCandidates('nike in athletic footwear')[0] === 'nike in athletic footwear', 'N3 one word is never a name; candidates run from four words down to two');
const nk = await F.excNameHints({}, 'nike in athletic footwear'); ok(nk.some(x => x.name === 'Nike' && x.from.join() === 'tracked'), 'N4 a tracked brand in the query is a name without the graph');
ok(/const hints = await excNameHints\(env, query\)\.catch\(excQuiet\('name_hints', \[\]\)\);/.test(w) && /excNamePrompt\(hints\)/.test(w) && /REV: 'p1'/.test(w), 'N5 the framer is asked with the names; the frame cache moved to p1 (the probe)');
ok(/f\.named = \{ name: h\.name, what: h\.what \|\| null, from: h\.from \}/.test(w) && /out\.named = \{ name: str\(f\.named\.name, 80\)/.test(w), 'N6 the frame carries how it was read and the clean keeps it');
ok(/A query is often a name: a brand, a show, a podcast, a person, a venue, a movement, as people type it\./.test(w), 'N7 the framer\'s own law: ask whether the words are a name before reading them as a category');
ok(['Black Enterprise', 'TheGrio', 'AfroTech', 'Blavity', 'Essence', 'The Root', 'EURweb'].every(s => w.includes("name:'" + s + "'")), 'N8 seven sources join the registry: Black culture, business and media');
ok(/'Read as ' \+ f\.named\.name/.test(page), 'N9 the page says when the query was read as a name (EX42: as the probe\'s line when the probe said nothing)');
console.log('proof_name: ' + pass + ' ok');
