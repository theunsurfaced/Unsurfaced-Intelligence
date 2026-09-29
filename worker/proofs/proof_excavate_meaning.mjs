/**
 * proof_excavate_meaning.mjs  --  EX1d: the read says what it means, the move law
 * is enforced, and the results page is laid out as one read.
 * v2 (EX3a): the read compiles through excCompile; the time law rides the prompt.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (a, b) => { const i = w.indexOf(a), j = w.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return w.slice(i, j); };
const helpers = between('/* SEAM:EXCAVATE_MEANING: the report contract.', 'async function gatherServerSignals(');
const H = new Function(helpers + '; return { excMoveGuard, excAnchors, excMeaning, excShort, excReportPrompt, EXC_MOVE_LAW };')();

// ── the move law, on the exact moves from the gen z hair care recording ──
const q = 'gen z hair care';
const weak = [
  { headline: 'Vegan hair care line', body: 'Develop a vegan hair care line with texture-inclusive products, leveraging social media platforms for marketing.', from: 0, evidence: [1] },
  { headline: 'Eco-friendly packaging initiative', body: 'Launch an eco-friendly packaging initiative and emphasize eco-friendly ingredients in marketing efforts.', from: 1, evidence: [2] },
  { headline: 'Collaborate with social media influencers', body: 'Partner with social media influencers to promote hair care products and engage with Gen Z consumers.', from: 2, evidence: [3] },
  { headline: 'Authenticity-focused brand storytelling', body: 'Develop brand storytelling that prioritizes authenticity and transparency, highlighting eco-friendly and vegan options.', from: 3, evidence: [4] }];
const g1 = H.excMoveGuard(weak, q);
ok(g1.kept.length === 0 && g1.dropped === 4, 'M1 all four moves from the recording are dropped by the move law');
const strong = { headline: 'Put texture-type filters on Hair Proud shelf tags at CVS', body: 'Tag each SKU by curl pattern in the 1,000 CVS doors Hair Proud already holds.',
  proof: 'Hair Proud expanded into CVS in January 2024.', evidence: [2], from: 1 };
ok(H.excMoveGuard([strong], q).kept.length === 1, 'M2 a move with a named retailer, brand and number stays');
const genericButConcrete = { headline: 'Partner with influencers from the Being texture panel', body: 'Seat 12 creators from the Being panel at the Target launch.', evidence: [1] };
const genericThin = { headline: 'Partner with influencers on TikTok', body: 'Reach Gen Z where they are.', evidence: [1] };
ok(H.excMoveGuard([genericButConcrete], q).kept.length === 1 && H.excMoveGuard([genericThin], q).kept.length === 0, 'M3 a generic pattern stays only with two concrete anchors');
ok(H.excMoveGuard([Object.assign({}, strong, { evidence: [], from: null })], q).kept.length === 0, 'M4 a move that cites nothing is dropped, however concrete it sounds');
ok(H.excAnchors('Gen Z hair care brands win with Gen Z.', q) === 0, 'M5 the query\'s own words never count as specifics');
ok(H.excMeaning({ culture: 'a', category: '', consumer: 'c' }).consumer === 'c' && H.excMeaning({}) === null && H.excMeaning('x') === null, 'M6 meanings are kept only when there is something to say');
ok(H.excShort('Hair care') === 'Hair care' && H.excShort('a category label that is far too long to be a label') === null, 'M7 the frame labels stay short or fall back');
ok(!/—/.test(H.EXC_MOVE_LAW + H.excReportPrompt('x', 'y')), 'M8 no em dash in the move law or the contract');

// ── synthesize end to end in report mode ─────────────────────────────────
const synth = between('async function synthesize(', '// Robust JSON extraction');
const xj = between('function jsonRepair(', '// Server-side connectors');
let call = null;
const out = JSON.stringify({ frame: { category: 'Hair care', audience: 'Gen Z' }, read: ['a', 'b'],
  insights: [{ category: 'consumer', title: 'Texture first', excerpt: 'x', evidence: [1],
    meaning: { culture: 'Hair is identity.', category: 'Shelves sort by curl pattern.', consumer: 'They shop by texture.' } }],
  ideas: [weak[0], strong], brief: 'b' });
const S = new Function('json', 'gatherServerSignals', 'gatherPaidSignals', 'excCompile', 'ledgerWrite', 'sha256hex', 'lakeCapture', 'serverConnectors', 'CONFIG',
  helpers + xj + synth + '; return synthesize;')(
  (o) => o, async () => [], async () => [], async (e, o) => { call = { m: [{ content: o.system }, { content: o.prompt }], o: { max_tokens: o.max_tokens } }; return { text: out, lane: 'live', model: 'claude-sonnet-5', reason: null, cost_usd: 0 }; }, async () => 1, async () => 'h', async () => 0, () => [], {});
const corpus = [1, 2, 3].map(i => ({ lens: 'consumer', title: 't' + i, url: 'https://e.example/' + i, source: 's' + i }));
const r = (await S({ query: q, mode: 'report', corpus }, {}, '')).data;
ok(/MOVE LAW/.test(call.m[0].content) && /TIME LAW/.test(call.m[0].content) && /"meaning":\{"culture"/.test(call.m[1].content) && /"frame":\{"category"/.test(call.m[1].content) && call.o.max_tokens === 3600,
  'R1 report mode asks for the frame, the three meanings and the move brief under the move law and the time law, with room to write them');
ok(r.frame.category === 'Hair care' && r.frame.audience === 'Gen Z', 'R2 the frame comes back with the read');
ok(r.insights[0].meaning.category === 'Shelves sort by curl pattern.' && r.insights[0].implication === 'Shelves sort by curl pattern.', 'R3 each finding carries its meanings; the old implication line stays filled for downloads');
ok(r.ideas.length === 1 && r.ideas[0].headline === strong.headline && r.moves_dropped === 1, 'R4 the weak move is dropped and counted; the strong one ships');
ok(r.ideas[0].proof && Array.isArray(r.ideas[0].evidence), 'R5 a move carries its proof and evidence');
const plain = (await S({ query: q, corpus }, {}, '')).data;
ok(plain.frame === null && plain.moves_dropped === 0 && !/MOVE LAW/.test(call.m[0].content), 'R6 structured (non-report) mode is untouched');

// ── the page ──────────────────────────────────────────────────────────────
ok(/strip\.innerHTML='';/.test(page) && !/SOURCES USED:<\/span>`\+/.test(page), 'P1 no sources section: each finding carries its own source');
ok(/_ideas\.filter\(x=>Number\.isInteger\(x\.from\)&&_ins\[x\.from\]/.test(page) && !/k%CATS\.length===ci/.test(page), 'P2 a lens shows the moves from its own findings, not a round-robin');
ok(/insight-card\$\{ins\.image\?' has-img':''\}/.test(page), 'P0 a finding with a photo leads with it; the corner ornament steps aside');
ok(/function _meaningBlock\(ins\)/.test(page) && /\$\{_meaningBlock\(ins\)\}/.test(page), 'P3 every finding shows what it means');
ok(/function _moveCard\(m, all\)/.test(page) && /\['Why now',m\.because\],\['Proof',m\.proof\],\['Watch',m\.measure\],\['Risk',m\.risk\]/.test(page), 'P4 each move reads as a brief: why now, proof, watch, risk');
ok(/did not meet the bar/.test(page), 'P5 the page says how many moves did not meet the bar');
const iMoves = page.indexOf('id="moves-section"'), iVoice = page.indexOf('<div id="voice-strip"></div>'), iTruth = page.indexOf('id="rlp-truth"');
ok(iMoves > iTruth && iVoice > iMoves, 'P6 THE MOVES closes the read; raw voice sits after it');
ok(/#live-results\.show-all \.results-lens-panel:not\(#rlp-truth\)\{display:block;grid-template-columns:none\}/.test(page) && /#live-results\.show-all #results-grid-truth\{display:none\}/.test(page) &&
   /#live-results\.show-all \.results-lens-panel\.empty\{display:none\}/.test(page), 'P7 All Lenses is full width, hides empty lenses, and shows each finding once');
ok((page.match(/el\.innerHTML = '';   \/\/ EXCAVATE_MEANING/g) || []).length === 2, 'P8 an empty or unavailable voice panel no longer shows');
console.log(`\nproof_excavate_meaning: ${pass} checks PASS`);
