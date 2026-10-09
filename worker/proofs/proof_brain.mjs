/**
 * proof_brain.mjs  --  EX32 THE BRAIN: SEAM:ASK_RECORD, SEAM:INSIGHT_PANEL, SEAM:CLIENT_EVIDENCE, SEAM:CALIBRATION.
 * The record answers from itself with citations; the panel asks real people about a claim; a reader's own evidence joins their read;
 * the record grades its own confidence. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: ask, pure ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const A = new Function(between(w, 'const ASK = {', 'async function askRecord(') + '; return { askTokens, askDeployments, ASK };')();
const tiles = [
  { id: 'a', deployed: '2026-10-01', claim: 'Gen Z buys retro Jordans on price, not hype', frame: { entity: 'Jordan Brand', category: 'athletic footwear', audience: 'Gen Z' } },
  { id: 'b', deployed: '2026-10-05', claim: 'Curl care moves to the salon shelf', frame: { category: 'hair care', audience: 'Black women' } },
  { id: 'c', deployed: '2026-10-07', claim: 'Retro silhouettes return at New Balance', frame: { entity: 'New Balance', category: 'athletic footwear', competitors: ['Jordan Brand'] } }];
const hit = A.askDeployments(tiles, 'What has the house seen on retro silhouettes and Jordan?');
ok(hit.length === 2 && hit[0].id === 'c' && hit[1].id === 'a' && !hit.some(t => t.id === 'b'), 'A1 the deployments a question touches, most shared words first; a question about retro and Jordan never brings hair care');
ok(A.askDeployments(tiles, 'the and for').length === 0 && A.askTokens('What does the brand do about people?').size === 0, 'A2 stop words carry no weight; a question of nothing touches nothing');
const ask = between(w, 'async function askRecord(', '/* ═══ SEAM:INSIGHT_PANEL');
ok(/if \(!\(await underLimit\(env, user\.id\)\)\) return json\(\{ ok: false, error: 'rate_limited' \}, 429, origin, env\);/.test(ask) && /callClaude\(env, 'live', \{ system: ASK_SYS, prompt, max_tokens: ASK\.MAX_TOKENS, kind: 'ask_record'/.test(ask) && /rpc\/match_signals_read/.test(ask),
  'A3 the ask is under the daily allowance, answered on the live tier from the record and the lake\'s nearest lines');
ok(/if \(!dLines\.length && !lLines\.length\) return json\(\{ ok: true, q, answer: 'The record and the lake hold nothing on this yet\./.test(ask) && /never from general knowledge/.test(w) && /Never invent a marker or a figure/.test(w), 'A4 when the record and the lake are silent the answer says so before any model is asked; the system never answers from general knowledge');
ok(/cites: cites\.filter\(c => new RegExp\('\\\\\[' \+ c\.k \+ '\\\\\]'\)\.test\(answer\) \|\| c\.k\.startsWith\('D'\)\)/.test(ask) && /url: pushLink\(env, t\.id\)/.test(ask), 'A5 the citations return with ids, dates, grades and permalinks');
ok(/case '\/ask':                 return askRecord\(body, env, origin, user\);/.test(w) && /'askRecord': 'claudeGate on the live tier \(Sonnet\) \+ underLimit/.test(gate), 'A6 /ask is a signed-in route and a registered spender');

// ── B: the panel ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const P = new Function('PANEL', between(w, 'function panelQuestions(claim) {', 'async function insightPanelCreate(') + between(w, '// PURE: the panel\'s answers, aggregated', 'async function insightPanelResults(') + '; return { panelQuestions, panelAggregate };')({ QUOTES: 6 });
const qs = P.panelQuestions('Gen Z buys retro on price, not hype.');
ok(qs.length === 3 && qs[0].type === 'scale' && qs[0].options.length === 7 && /How true is this of you: Gen Z buys retro/.test(qs[0].prompt) && qs[1].type === 'open' && qs[2].type === 'single' && qs[2].options.includes('Gen Z'), 'B1 three questions: how true on seven, what would change it, who you are');
const qq = [{ id: 'q1', ord: 0, type: 'scale' }, { id: 'q2', ord: 1, type: 'open' }, { id: 'q3', ord: 2, type: 'single' }];
const rs = [{ answers: { q1: '6', q2: 'If the retro came in under 150 I would buy two', q3: 'Gen Z' } }, { answers: { q1: '7', q2: 'short', q3: 'Gen Z' } }, { answers: { q1: ['3'], q2: 'My size never drops at retail so I buy used', q3: 'Millennial' } }, { answers: { q1: '5', q2: '', q3: 'Gen Z' }, quality_status: 'rejected' }];
const agg = P.panelAggregate(qq, rs);
ok(agg.n === 3 && agg.scale.n === 3 && agg.scale.mean === 5.3 && agg.scale.agree_pct === 67 && agg.quotes.length === 2 && agg.who['Gen Z'] === 2 && agg.who.Millennial === 1, 'B2 the aggregate: rejected answers out, the mean and the share at five or more, the open answers as quotes, who answered');
ok(/const study = \{ partner_id: user\.id, title: \('Panel: ' \+ claim\)\.slice\(0, 120\)/.test(w) && /status: 'draft', public_listing: false \}/.test(w) && /panel: \{ study_id: made\.id, by: user\.id, at: new Date\(\)\.toISOString\(\) \}/.test(w) && /if \(row\.meta && row\.meta\.panel && row\.meta\.panel\.study_id\) return json\(\{ ok: true, id, study_id: row\.meta\.panel\.study_id, existed: true \}/.test(w),
  'B3 the study is drafted under the reader\'s own partner id, never launched here, once per reading');
ok(/thin: agg\.n < PANEL\.MIN_N, min_n: PANEL\.MIN_N/.test(w) && /const PANEL = \{ TARGET_N: 50, MIN_N: 5, QUOTES: 6 \};/.test(w), 'B4 the panel shows its numbers at five answers, never before');

// ── C: the reader's evidence ────────────────────────────────────────────────────────────────────────────────────────────────────
const C = new Function('CLIENT_EV', between(w, 'function clientChunks(text) {', 'async function clientEvidenceRoute(') + '; return clientChunks;')({ CHUNK: 700, MAX_CHUNKS: 400 });
const chunks = C('Title line\n\nParagraph one about Jordan retros and price.\n\n' + 'x'.repeat(1500) + '\n\nLast paragraph.');
ok(chunks.length >= 3 && chunks[0].n === 1 && chunks.every(c => c.text.length <= 1400) && chunks.some(c => /Jordan retros/.test(c.text)), 'C1 text is cut into titled parts around 700 characters, long runs split, nothing lost');
const cev = between(w, 'async function clientEvidenceRoute(', '// The reader\'s lines that name the frame');
ok(/if \(!user\) return json\(\{ ok: false, error: 'auth_required' \}, 401, origin, env\);/.test(cev) && /if \(text\.length > CLIENT_EV\.MAX_BYTES\) return json\(\{ ok: false, error: 'too_large'/.test(cev) && /error: 'text_only', say: 'Paste the text, or upload a \.txt, \.md, \.csv or \.json file/.test(cev) && /client_evidence\?id=eq\.' \+ id \+ '&user_id=eq\.' \+ user\.id, \{ method: 'DELETE'/.test(cev),
  'C2 evidence is signed in, text only, under 400 KB, and a reader deletes only their own');
const lines = between(w, 'async function excClientLines(env, uid, frame, query) {', '/* ═══ SEAM:CALIBRATION');
ok(/source: 'Client evidence: ' \+ r\.title/.test(lines) && /tier: 1, rail: 'client', read: 'page', client: true/.test(lines) && /if \(out\.length >= CLIENT_EV\.MAX_LINES\) return out;/.test(lines) && /hintHit \|\| words\.some\(w => low\.includes\(w\)\)/.test(lines), 'C3 the reader\'s lines that name the frame join as first-party, tier 1, at most twelve');
const synth = between(w, 'async function synthesize(', '// Robust JSON extraction');
ok(/const clientLines = \(body\._uid && !body\.bench && typeof excClientLines === 'function'\) \? await excClientLines\(env, body\._uid, frame0, query\)/.test(synth) && /if \(clientLines\.length\) \{ excStampTiers\(clientLines, tiers\); corpusIn = corpusIn\.concat\(clientLines\); \}/.test(synth) && /const clientLaw = merged\.some\(c => c && c\.client\) \? ' ' \+ EXC_CLIENT_LAW : '';/.test(synth) && /client_lines: merged\.filter\(c => c && c\.client\)\.length/.test(synth),
  'C4 the reader\'s lines join after the gate, bring their law to the writer, and the payload counts them; never on the bench');
ok(/const EXC_CLIENT_LAW = 'CLIENT EVIDENCE: lines whose source begins "Client evidence" were supplied by the reader/.test(w) && /never silently prefer either/.test(w), 'C5 the client law: first-party, cited like any line, a disagreement said plainly');
ok(/case '\/excavate\/synthesize': \{ const b2 = Object\.assign\(\{\}, body \|\| \{\}, \{ _uid: user && user\.id \|\| null \}\); return b2\.stream \? synthesizeStream\(b2, env, origin, ctx\) : synthesize\(b2, env, origin\); \}/.test(w), 'C6 the route hands the reader\'s id to the read, streamed or not');

// ── D: calibration ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const K = new Function(between(w, 'function calibrationOf(rows) {', '/* ═══ SEAM:CROSS_CURRENTS') + '; return calibrationOf;')();
const cal = K([{ meta: { called: { verdict: 'held' } }, read: { insights: [{ confidence: 'High' }, { confidence: 'Low' }] } }, { meta: { called: { verdict: 'missed' } }, read: { insights: [{ confidence: 'Medium' }] } }, { meta: { called: { verdict: 'held' } }, read: { insights: [{ confidence: 'Medium' }] } }, { meta: {}, read: { insights: [{ confidence: 'High' }] } }, { meta: { called: { verdict: 'unmeasured' } }, read: { insights: [{ confidence: 'High' }] } }]);
ok(cal.High.n === 1 && cal.High.held === 1 && cal.Medium.n === 2 && cal.Medium.held === 1 && cal.Low.n === 0, 'D1 each graded reading is filed under its strongest confidence; ungraded and unmeasured readings count for nothing');
ok(/const calibration = calibrationOf\(rows\);   \/\/ SEAM:CALIBRATION/.test(w) && /tiles, positions, currents, calibration, counts:/.test(w), 'D2 the record carries its calibration');

// ── E: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/<div class="rec-ask" id="rec-ask">/.test(page) && /onsubmit="return _askSubmit\(event\)"/.test(page) && /api\('ask', \{ q, history: window\._askHistory\.slice\(-6\) \}\)/.test(page) && /onclick="openFeaturedCard\('\$\{safeAttr\(c\.id\)\}'\);return false">\$\{safe\(mark\)\}<\/a>/.test(page), 'E1 the ask box on the record; a deployment marker opens the reading');
ok(/Answered from the record and the lake only\./.test(page) && /The daily allowance is spent; the record answers again tomorrow\./.test(page), 'E2 the thread says what it answered from and when the allowance is spent');
ok(/onclick="_panelAsk\('\$\{safeAttr\(id\)\}'\)">Ask the panel<\/button>/.test(page) && /THE PANEL ON THIS READING/.test(page) && /said it is true of them \(5 or more on 7; mean/.test(page) && /Drafted in MINE, not yet launched/.test(page), 'E3 Ask the panel under a reading; the panel\'s numbers and quotes once five have answered');
ok(/YOUR EVIDENCE/.test(page) && /id="pm-ev-text"/.test(page) && /accept="\.txt,\.md,\.csv,\.json,text\/plain,text\/markdown,text\/csv,application\/json"/.test(page) && /rows\.push\(\['your evidence',`<b>\$\{n\(String\(data\.client_lines\)\)\}<\/b> of your own lines, first-party`\]\);/.test(page), 'E4 your evidence in the profile; the receipt says how many of your lines the read stood on');
ok(/<span class="rec-cal"><b>Calibration<\/b> \$\{calLine\}<\/span>/.test(page), 'E5 the calibration line in the record\'s counts');
ok(!/—/.test(between(w, 'const ASK = {', '/* ═══ SEAM:CROSS_CURRENTS') + between(page, 'window._askHistory = [];', '/* SEAM:CROSS_CURRENTS: the patterns') + between(page, 'async function _panelLoad(id)', 'async function _marksLoad(id) {')), 'F1 no em dash in the new code');
console.log('\nproof_brain: ' + pass + ' checks PASS');
