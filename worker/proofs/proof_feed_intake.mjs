/**
 * proof_feed_intake.mjs  --  KB1 THE INTAKE: every document through one door; the RECON commissioned from a read carries its frame.
 * Run from the repo root: node worker/proofs/proof_feed_intake.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const house = fs.readFileSync('intelligence/read/index.html', 'utf-8');   // RD1a: the feed's file input lives in the house
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };

// ── D: the door ───────────────────────────────────────────────────────
const logs = [];
const D = new Function('console', between(w, 'const DOC_INTAKE = {', 'async function kbFile(') + '; return { DOC_INTAKE, docKind, docText };')({ log: (...a) => logs.push(a.join(' ')) });
const enc = s => new TextEncoder().encode(s).buffer;
const calls = [];
const ai = { toMarkdown: async doc => { calls.push(doc); return { name: doc.name, format: 'markdown', mimetype: doc.blob.type, tokens: 12, data: '# The deck\n\nSlide one says the aisle moved.' }; } };
const t1 = await D.docText({ AI: ai }, 'notes.md', 'text/markdown', enc('plain words'));
ok(t1.ok && t1.text === 'plain words' && t1.how === 'text' && t1.mime === 'text/markdown' && calls.length === 0, 'D1 a text file is read as it is; the conversion is never asked');
const t2 = await D.docText({ AI: ai }, 'deck.pdf', 'application/pdf', enc('%PDF'));
ok(t2.ok && /Slide one says the aisle moved/.test(t2.text) && t2.how === 'markdown' && t2.tokens === 12 && calls.length === 1 && calls[0].name === 'deck.pdf' && calls[0].blob.type === 'application/pdf', 'D2 a PDF goes through the conversion once, as a Blob of its own type, and comes back as Markdown');
const t3 = await D.docText({ AI: ai }, 'brief.docx', '', enc('PK'));
ok(t3.ok && calls[1].blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'D3 a Word file carries its own MIME type even when the upload did not say');
ok((await D.docText({ AI: ai }, 'tape.mp4', 'video/mp4', enc('x'))).error === 'unsupported_type' && calls.length === 2, 'D4 a recording is refused at the door: not read yet, nothing spent');
ok((await D.docText({}, 'deck.pdf', 'application/pdf', enc('%PDF'))).error === 'convert_unconfigured', 'D5 without the AI binding a document is refused plainly, never crashed');
const bad = { toMarkdown: async () => ({ format: 'error', error: 'encrypted' }) };
ok((await D.docText({ AI: bad }, 'locked.pdf', '', enc('x'))).error === 'convert_failed' && logs.some(l => /doc_convert_refused pdf encrypted/.test(l)), 'D6 a conversion the service refuses is a failed read with the reason logged');
const thrower = { toMarkdown: async () => { throw new Error('boom'); } };
ok((await D.docText({ AI: thrower }, 'x.xlsx', '', enc('x'))).error === 'convert_failed' && logs.some(l => /doc_convert_error xlsx boom/.test(l)), 'D7 a conversion that throws is caught and logged');
ok(D.docKind('a.pdf') === 'pdf' && D.docKind('a.JPG') === 'image' && D.docKind('a.xls') === 'xlsx' && D.docKind('a.htm') === 'html' && D.docKind('a.txt') === 'text' && D.docKind('a.markdown') === 'md' && D.docKind('a.csv') === 'csv', 'D8 the kind is named from the extension, the way the shelf shows it');
ok(D.DOC_INTAKE.MAX_BYTES === 15000000 && D.DOC_INTAKE.CONVERT.test('x.numbers') && D.DOC_INTAKE.CONVERT.test('x.svg') && !D.DOC_INTAKE.CONVERT.test('x.mp3'), 'D9 fifteen megabytes at the door; the supported list is the conversion\'s own');

// ── R: the routes ─────────────────────────────────────────────────────
const kb = between(w, 'async function kbFile(', 'async function kbList(');
ok(/if \(!DOC_INTAKE\.TEXT\.test\(name\) && !DOC_INTAKE\.CONVERT\.test\(name\)\)/.test(kb) && !/text_files_only/.test(kb) && /const got = await docText\(env, name, request\.headers\.get\('content-type'\), raw\);/.test(kb) && /raw\.byteLength > DOC_INTAKE\.MAX_BYTES/.test(kb), 'R1 the knowledge file route takes every type the door reads and refuses the rest by name');
ok(/contentType: got\.mime \|\| 'application\/octet-stream'/.test(kb) && /how: got\.how, kind: docKind\(name\)/.test(kb), 'R2 the original is kept in R2 as what it is, and the reply says how it was read');
const ev = between(w, 'async function clientEvidenceRoute(', '// The reader\'s lines that name the frame');
ok(/kind = docKind\(title\); if \(!CLIENT_EV\.KINDS\.includes\(kind\)\) kind = 'text';/.test(ev) && /const got = await docText\(env, title, ctype, raw\);/.test(ev) && !/text_only/.test(ev) && /unsupported_type/.test(ev), 'R3 client evidence takes the same types through the same door');
ok(/KINDS: \['text', 'csv', 'md', 'json', 'pdf', 'docx', 'xlsx', 'odt', 'ods', 'html', 'xml', 'numbers', 'image'\]/.test(w), 'R4 the evidence kinds name every type the door reads');
ok(/if \(text\.length > CLIENT_EV\.MAX_BYTES\) return json\(\{ ok: false, error: 'too_large'/.test(ev), 'R5 the text a document yields is still held to the evidence cap');
ok(/env\\\.AI\\\.toMarkdown\\\(/.test(gate) && /'docText': 'Workers AI Markdown Conversion/.test(gate), 'R6 the gate sees the conversion as a spend and docText is registered');

// ── P: the page ───────────────────────────────────────────────────────
ok(/id="kbFile" accept="\.txt,\.md,\.markdown,\.csv,\.json,\.pdf,\.docx,\.xlsx,\.xlsm,\.xlsb,\.xls,\.odt,\.ods,\.html,\.htm,\.xml,\.numbers,\.jpg,\.jpeg,\.png,\.webp,\.gif,\.bmp,\.svg"/.test(house), 'P1 the feed\'s file input accepts the new types');
ok(/accept="\.txt,\.md,\.csv,\.json,\.pdf,\.docx,\.xlsx,\.xlsm,\.xlsb,\.xls,\.odt,\.ods,\.html,\.htm,\.xml,\.numbers,\.jpg,\.jpeg,\.png,\.webp,\.gif,\.bmp,\.svg" onchange="_evidenceUpload\(this\)"/.test(page) && /if \(f\.size > 15000000\)/.test(page) && !/PDF, decks and recordings next/.test(page), 'P2 the evidence shelf accepts them too, fifteen megabytes at the door');
const mr = between(page, 'function makeReconFromRead() {', '/* New Report:');
ok(/const framed = \(fr\.entity \|\| fr\.category\) \? Object\.assign\(\{ competitors: \[\], anchors: \[\], exclude: \[\] \}, fr,/.test(mr) && /openCommission\(\{ brief: String\(L\.q\), from: String\(L\.q\), decisions: \['', '', '', '', ''\], frame: framed, framedFor: framed \? String\(L\.q\)\.replace\(\/\\s\+\/g, ' '\)\.trim\(\) : '' \}\);/.test(mr),
  'P3 Make this a RECON carries the read\'s frame into the commission, so the Commission button is there at once; a read with no frame still asks for one');
const cmSrc = between(page, 'function _cmRender() {', 'function _cmChipDel(');
ok(/const rest = !f \? '' : `/.test(cmSrc) && /id="cm-go" onclick="_cmGo\(\)"/.test(cmSrc), 'P4 the Commission button still renders only under a frame (the frame first, then the spend)');
console.log(`\nproof_feed_intake: ${pass} checks passed`);
