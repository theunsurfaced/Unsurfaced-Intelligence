/**
 * proof_read_write.mjs  --  EX26 WRITE: SEAM:READ_EDIT, SEAM:READ_CUT, SEAM:READ_LAYOUT.
 * The editing laws are counted (a figure once, a name once, confidence frames the claim, limits first, the tic), they reach the editor
 * before the landing and the desk after it, the editor may cut what says nothing new, the Method carries the laws, and the client cut is
 * a view of the same document on the page and in the PDF.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the editing laws, counted ──────────────────────────────────────────────────────────────────────────────────
const blk = between(w, 'const READ_EDIT = {', '/* PURE: the think contract, checked on a landed read');
const E = new Function('readReconOf', 'deepBrandNames', blk + '; return { READ_EDIT, readEditSections, readEditNotes };')(
  row => ({ frame: { entity: 'Jordan Brand', competitors: ['New Balance', 'adidas'] } }),
  rc => [{ name: 'Jordan Brand' }, { name: 'New Balance' }, { name: 'adidas' }]);
const read = {
  title: 'Young buyers want Jordans they can wear all day', thesis: 'Comfort rose from 13% to 25% of comments and New Balance took the everyday shoe.',
  brief_answer: 'Jordan wins by rebuilding comfort inside the retro. The complaint that grew fastest is comfort, 25% of comments.',
  executive_summary: [{ line: 'Comfort rose from 13% to 25%; the J Balvin and Mowalola partnerships reach the young.', evidence: ['S1'] }],
  method: { what_was_read: '766 stories', limits: 'This evidence is coverage and comments, not transactions.' },
  findings: [{ name: 'Buyers judge a Jordan on comfort before price', confidence: 'medium', data: 'Comfort is 25% of comments, against 13% before; price 22%; the Mowalola drop sold.', means: { culture: 'Comfort, not colorways, is the measure; a full shelf, not a drop, is the respect.' }, evidence: ['S1', 'S2'], image_prompt: 'A 25% figure on a screen' }],
  decisions: [{ n: 1, decision: 'Retro or new?', answer: 'Rebuild comfort in the core retros; 25% of comments say so.', confidence: 'medium', evidence: ['S1'] },
    { n: 3, decision: 'Women and girls?', answer: 'Build the girls court shoe; the Samba has 162 stories and the J Balvin and Mowalola route works.', confidence: 'low', evidence: ['S3'] }],
  market_model: { line: 'Comfort at 25% leads; Mowalola and J Balvin drops sell. 25% again.', drivers: [] },
  futures: [{ name: 'Comfort fix', story: 'Comfort at 25% eases as J Balvin and Mowalola carry the young by 2027.', signposts: ['comfort under 20%'] }],
  product_concepts: [{ name: 'Retro comfort build', proof: 'Comfort at 25% of comments; the J Balvin and Mowalola cadence.', first_test: '70% of a 200-buyer panel' }],
  plan_90: { line: 'Prove it in one season.', phases: [{ window: 'Days 1 to 30', moves: ['a'], measure: 'J Balvin videos reach 25% under 18' }] },
  social: { frames: [{ line: '25% 25% 25%' }] }, by_the_numbers: [{ stat: 'lake.signals', line: '25%' }]
};
const secs = E.readEditSections(read);
ok(!('social' in secs) && !('by_the_numbers' in secs) && !/A 25% figure on a screen/.test(secs.findings) && /Comfort is 25%/.test(secs.findings) && !/S1/.test(secs.findings),
  'A1 the prose of a section is its words: ids, evidence arrays, an illustrator\'s brief, the social frames and the numbers page are not prose');
const notes = E.readEditNotes(read, { kind: 'recon', meta: { brief: {} } });
const rf = notes.find(n => n.startsWith('repeat_figure:25%'));
ok(rf && parseInt(rf.split(':')[2], 10) >= 6 && /brief_answer/.test(rf) && /findings/.test(rf), 'A2 a figure stated in more than three sections is noted with its count and the sections it rides');
ok(!notes.some(n => n.startsWith('repeat_figure:13%')) && !notes.some(n => /repeat_figure:2027/.test(n)), 'A3 a figure in three sections is not noted, and a year is a date, not a figure');
ok(notes.some(n => /^repeat_name:J Balvin:/.test(n)) && notes.some(n => /^repeat_name:Mowalola:/.test(n)) && !notes.some(n => /repeat_name:New Balance/.test(n)) && !notes.some(n => /repeat_name:Jordan/.test(n)),
  'A4 a name riding more than five sections is noted; the brief\'s own names (its entity, its competitors) never are');
ok(notes.includes('confidence_bet:decisions[1]') && !notes.includes('confidence_bet:decisions[0]'), 'A5 a low-confidence decision written as a bet is noted; a medium one is not');
ok(!E.readEditNotes(Object.assign({}, read, { decisions: [{ answer: 'Pilot the girls court shoe before any line commitment.', confidence: 'low' }] }), {}).some(n => /^confidence_bet/.test(n)),
  'A6 a low-confidence decision written as the whitespace to test (a pilot) is not a bet');
ok(notes.includes('limits_first:the_answer_never_says_what_the_evidence_cannot_show'), 'A7 an answer that never says what the evidence cannot show is noted');
ok(!E.readEditNotes(Object.assign({}, read, { brief_answer: 'Jordan wins by rebuilding comfort. This evidence is coverage and comments, not transactions.' }), {}).some(n => /^limits_first/.test(n)),
  'A8 an answer that says its limit in one sentence passes');
ok(notes.some(n => /^tic:x_not_y:findings:2$/.test(n)) && !notes.some(n => /^tic:x_not_y:decisions/.test(n)), 'A9 the "X, not Y" tic is noted when a section carries it more than once');
ok(E.readEditNotes(null, {}).length === 0 && E.readEditNotes({ title: 't' }, { kind: 'recon', meta: { brief: {} } }).length === 0, 'A10 nothing in is nothing out');

// ── B: where the notes go, and what the editor may cut ───────────────────────────────────────────────────────────
ok(/laws\.notes, deepThinkLaws\(laws\.read, row\), readEditNotes\(laws\.read, row\),   \/\/ SEAM:READ_EDIT/.test(w), 'B1 the editor pass reads the editing notes with the laws\' notes before it edits');
ok(/v\.notes\.concat\(laws\.notes, think \? deepThinkLaws\(v\.read, row\) : \[\], readEditNotes\(v\.read, row\)\)/.test(w), 'B2 the desk reads them on every report and RECON landing');
const think = between(w, 'const READ_THINK = {', '};');
ok(!/'glossary', 'social'/.test(think) && /CUTTABLE: \['glossary', 'advertising_read', 'competitive_sets'\]/.test(think) && /KEEP: \[[^\]]*'findings'[^\]]*'decisions'[^\]]*'plan_90'\]/.test(think),
  'B3 the editor may return the glossary, the advertising read and the competitive sets empty; the findings, the decisions and the plan always come back');
const law = between(w, "const READ_EDITOR_LAW = ", "/* PURE: a pass's custom id");
ok(/repeat_figure: a figure stated in more than three sections/.test(law) && /confidence_bet: a low-confidence decision whose answer reads as a bet/.test(law) && /limits_first: the answer never says what this evidence cannot show/.test(law) && /tic: the "X, not Y" construction/.test(law),
  'B4 the editor law names every editing note');
ok(/THE EDITING LAWS: a figure is stated once, in the section that proves its finding/.test(law) && /a low-confidence decision is written as the whitespace to test and names the pilot that settles it, never as a bet/.test(law)
  && /inside brief_answer or the first line of the executive summary, before any finding/.test(law) && /come back empty/.test(law) && !/—/.test(law),
  'B5 the editor law carries the editing laws: say it once, confidence frames the claim, limits first, every section earns its page');
ok(/## The editing laws/.test(method) && /1\. \*\*Say it once\.\*\*/.test(method) && /2\. \*\*Confidence frames the claim\.\*\*/.test(method) && /3\. \*\*Limits first\.\*\*/.test(method) && /4\. \*\*Every section earns its page\.\*\*/.test(method) && /5\. \*\*Two readers, one document\.\*\*/.test(method)
  && !/\bthe house\b(?! style)/i.test(method.replace(/"the house"/g, '')) && w.includes(JSON.stringify(method).slice(1, -1)),
  'B6 the Method carries the five editing laws, never calls us the house, and the worker carries the exact text');

// ── C: the client cut on the page ─────────────────────────────────────────────────────────────────────────────────
const cutSrc = between(page, 'var READ_CUT = {', 'function reportDoc(x, st, rc, row, H) {');
const P = new Function(cutSrc + '; return { READ_CUT, readCut };')();
const x = { title: 't', thesis: 'th', hypotheses: [1], market_model: { line: 'm' }, glossary: [1], futures: [1, 2, 3], decisions: [1], product_concepts: [1], plan_90: {}, outlook: {}, method: { limits: 'l' },
  findings: [{ name: 'A', confidence: 'medium', evidence: ['S1'] }, { name: 'B', confidence: 'low', evidence: ['S1', 'S2', 'S3'] }, { name: 'C', confidence: 'high', evidence: [] }, { name: 'D', confidence: 'medium', evidence: ['S1', 'S2'] }, { name: 'E', confidence: 'low', evidence: ['S1', 'S2', 'S3', 'S4'] }, { name: 'F', confidence: 'medium', evidence: ['S1', 'S2', 'S3'] }, { name: 'G' }] };
const c = P.readCut(x);
ok(!('hypotheses' in c) && !('market_model' in c) && !('glossary' in c) && !('futures' in c) && 'decisions' in c && 'product_concepts' in c && 'plan_90' in c && 'outlook' in c && 'method' in c,
  'C1 the cut drops the house\'s own sections and keeps the answer, the decisions, the concepts, the plan, the outlook and the method');
ok(c.findings.map(f => f.name).join('') === 'ACDF', 'C2 the four strongest findings stay (high, then medium by sources, then low), in the writer\'s order');
ok(x.findings.length === 7 && P.READ_CUT.FINDINGS === 4, 'C3 the document is never changed; the cut is a copy');
ok(/CUT = Q\.get\("cut"\) === "client" \? "client" : null/.test(page) && /reportDoc\(CUT \? readCut\(x\) : x, st, rc, row, \{/.test(page) && /cut: CUT \}\);/.test(page), 'C4 the page renders the view the address asks for');
ok(/if \(!cut\) contents\.push\(\["The period in numbers"/.test(page) && /if \(!cut\) contents\.push\(\["About this report"/.test(page) && /if \(appx && !cut\) contents\.push\(\["The data appendix"/.test(page) && /cut \? "The competitive page" : "The response map"/.test(page),
  'C5 the contents and the pages agree: the numbers, about and the appendix are the full read\'s; the map is the competitive page in the cut');
ok(/if \(!cut\) \{   \/\* SEAM:READ_CUT \*\/\n    sec\+\+;\n    var bn = /.test(page) && /\}   \/\* SEAM:READ_CUT: the period in numbers \*\//.test(page) && /if \(!cut\) \{   \/\* SEAM:READ_CUT: the cut said its limits on page two \*\/\n    sec\+\+;\n    var tiers/.test(page) && /\}   \/\* SEAM:READ_CUT: about and the appendix \*\//.test(page),
  'C6 the numbers page, the about page and the appendix are skipped in the cut');
ok(/cut && \(m\.limits \|\| m\.what_was_read\) \? '<div class="kicker" style="margin-top:14px">What this read is and is not<\/div>'/.test(page) && /\(cut \? " · Client cut" : ""\)/.test(page), 'C7 the cut says what the read is and is not on page two, and the cover names the cut');
ok(/<button class="btn" id="cut">' \+ \(CUT \? "Full read" : "Client cut"\) \+ '<\/button>/.test(page) && /q\.set\("cut", "client"\)/.test(page) && /openRead\(row\.id\); \};/.test(page), 'C8 a Client cut / Full read button switches the view and renders it again');
ok(/JSON\.stringify\(CUT \? \{ id: row\.id, cut: CUT \} : \{ id: row\.id \}\)/.test(page) && /\(CUT \? "-client-cut" : ""\) \+ "\.pdf"/.test(page), 'C9 Download PDF renders the view that is open, named for it');

// ── D: the client cut's PDF in the worker ─────────────────────────────────────────────────────────────────────────
const pdf = between(w, 'async function readPdf(env, row, cut) {', 'async function readRoute(');
ok(/const client = cut === 'client', slot = client \? 'pdf_client' : 'pdf';/.test(pdf) && /\(await readStamp\(row\)\) \+ \(client \? ':client' : ''\)/.test(pdf) && /row\.meta\[slot\]/.test(pdf) && /\{ \[slot\]: \{ key, stamp/.test(pdf),
  'D1 the client cut is kept in its own slot under its own stamp, so the full read\'s PDF is never served as the cut');
ok(/'&rt=' \+ rt \+ \(client \? '&cut=client' : ''\)/.test(pdf) && /footerTemplate: readPdfFooter\(row, client\)/.test(pdf) && /\(client \? ' \\u00B7 CLIENT CUT' : ''\)/.test(w), 'D2 the ticket page renders the cut and the running footer says so');
ok(/readPdf\(env, row, body\.cut === 'client' \? 'client' : null\)/.test(w), 'D3 the route takes the cut from the body and nothing else');

// ── E: the paper ──────────────────────────────────────────────────────────────────────────────────────────────────
ok(/\.nums \{ gap: 10px; \}/.test(page) && /\.nums b \{ display: block; font-weight: 800; font-size: 32px; line-height: 1; letter-spacing: -\.5px; white-space: nowrap; \}/.test(page), 'E1 the cover\'s figures never run into each other');
ok(/\.rp-futures \{ break-inside: avoid; \}/.test(page) && /\.rp-futures > div \{[^}]*break-inside: avoid; \}/.test(page) && /\.rp-means \{ break-inside: avoid; \}/.test(page), 'E2 the three futures and the three "for the" columns stay whole on a page');
ok(!/—/.test(blk + cutSrc + pdf), 'G1 no em dash in the new code');
console.log('\nproof_read_write: ' + pass + ' checks PASS');
