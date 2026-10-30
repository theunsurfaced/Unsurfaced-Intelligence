/**
 * proof_house_voice.mjs  --  VX1 THE VOICE: Method 5.0 synced, the contracts' keys unchanged while their descriptions changed,
 * the sentence checks, the voice desk, the sell law's reading of moves and the counter-reading.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const method = fs.readFileSync('templates/CULTURAL_READ_METHOD.md', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };

const block = w.slice(w.indexOf('/* SEAM:READ_ENGINE: the house read compiler'), w.indexOf('/* SEAM:ARCHIVE'));
const helper = (name, next) => w.slice(w.indexOf('function ' + name + '('), w.indexOf(next, w.indexOf('function ' + name + '(')));
const trim = helper('studioTrimClean', 'function studioComplete(');
const pmj = helper('parseModelJson', '\n}\n') + '\n}\n';
const ej = w.slice(w.indexOf('function jsonRepair('), w.indexOf('\n// Server-side connectors'));
let calls = [], reply = null;
const callClaude = async (env, tier, o) => { calls.push({ tier, o }); return typeof reply === 'function' ? reply(o) : reply; };
const R = new Function('sbRest', 'claudeBatchSubmit', 'claudeBatchDrain', 'callerIsAdmin', 'json', 'logEvent', 'callClaude',
  trim + pmj + ej + block + '; return { READ_METHOD, READ_CONTRACT, READ_STYLE, readStyle, houseVoiceNotesOf, houseSentences, houseVoicePlan, houseVoiceAccept, houseVoiceRun, HOUSE_VOICE, readSellable, SELL_LAW, READ_WRITER_LAW, READ_EDITOR_LAW, DEEP_STRATEGIST_SYS, READ_THINK_CONTRACT };')(
  async () => [], async () => ({ ok: true }), async () => ({}), async () => true, (o, s) => Object.assign({ _status: s }, o), () => Promise.resolve(), callClaude);

// ── M. The Method ──
ok(/^# The Unsurfaced Cultural Read Method\n\nVersion 5\.0, the house style\./.test(R.READ_METHOD) && R.READ_METHOD === method, 'M1 Method 5.0 is the worker\'s standing instruction, word for word the file (SEAM:PROMPT_SYNC)');
ok(!/\u2014/.test(R.READ_METHOD) && !/\u2013/.test(R.READ_METHOD), 'M2 the Method carries no em dash and no en dash');
ok(/You were in the room\./.test(R.READ_METHOD) && /creative who is tapped into culture and into the cultures where people come together/.test(R.READ_METHOD), 'M3 the stance: a creative who was in the room, in Fresco\'s terms');
ok(/no sentence runs past thirty words/.test(R.READ_METHOD) && /semicolon to carry a second clause is two sentences/.test(R.READ_METHOD), 'M4 the sentence: thirty words in a long field; the semicolon chain is two sentences');
ok(/\*\*The use law\.\*\*/.test(R.READ_METHOD) && !/\*\*The advantage law\.\*\*/.test(R.READ_METHOD) && /neither is a required part of the sentence/.test(R.READ_METHOD), 'M5 the use law replaces the advantage template');
ok(/leave the field empty and the page skips it/.test(R.READ_METHOD) && /A pattern gets a move for a role only when a source in its evidence supports one/.test(R.READ_METHOD), 'M6 the counter-reading only when real; moves only where earned');
ok(/Legacy does not transfer on its own\./.test(R.READ_METHOD) && /The threat isn't pricing\. It isn't product quality\. It's cultural distance\./.test(R.READ_METHOD) && /The Hyde Park Punch/.test(R.READ_METHOD) && /Gumbo Yaya/.test(R.READ_METHOD), 'M7 Fresco\'s own sentences are the exemplars (Chicago, Kraft Heinz, Capes)');
ok(/The remasters changed material this week where before they changed color\./.test(R.READ_METHOD) && /better skin, not new paint/.test(R.READ_METHOD), 'M8 the flagged sentence and its rewrites are the lesson on the contrast turn');
ok(/A contraction only when the full form would be stiff in a person's mouth, never by habit\./.test(R.READ_METHOD) && /No em dashes anywhere/.test(R.READ_METHOD), 'M9 the dash stays banned; a contraction only when necessary');
ok(/\*\*Real numbers only\.\*\*/.test(R.READ_METHOD) && /\*\*The time law\.\*\*/.test(R.READ_METHOD) && /\*\*The numbers law\.\*\*/.test(R.READ_METHOD) && /\*\*The voice law\.\*\*/.test(R.READ_METHOD) && /\*\*Tell it once\.\*\*/.test(R.READ_METHOD), 'M10 the laws on evidence, numbers, dating, voices and sources stand');
ok(/proof \(what a finding stands on\)/.test(R.READ_METHOD) && /the handoff/.test(R.READ_METHOD) && /the loop \(the rough, the read, the move, the return\)/.test(R.READ_METHOD), 'M11 the words of practice');
ok(/Method 5\.0/.test(fs.readFileSync('templates/METHOD_CHANGELOG.md', 'utf-8')), 'M12 the changelog carries the 5.0 row');

// ── C. The contracts: keys as they were before this cut (Method 4.2, pinned), descriptions changed ──
const before = {"weekly": ["title", "thesis", "the_week", "cover_image", "patterns", "name", "dek", "lead_image", "what_happened", "why_it_matters", "advantage", "against", "evidence", "strength", "moves", "creative", "marketer", "founder", "exec", "talent", "cross_currents", "thread", "evidence", "contradiction", "whitespace", "advertising_read", "watch", "social", "cover_line", "frames", "kicker", "headline", "line", "evidence", "caption"], "monthly": ["title", "thesis", "the_month", "by_the_numbers", "stat", "line", "cover_image", "features", "name", "dek", "lead_image", "what_happened", "why_it_matters", "advantage", "against", "evidence", "strength", "held_from_weekly", "moves", "territory_briefs", "territory", "line", "evidence", "cross_currents", "scoreboard", "whitespace", "advertising_read", "watch"], "report": ["title", "subtitle", "ground_line", "thesis", "executive_summary", "line", "evidence", "method", "what_was_read", "how_to_read", "limits", "by_the_numbers", "stat", "line", "cover_image", "findings", "name", "dek", "lead_image", "what_the_data_shows", "what_happened", "why_it_matters", "means", "culture", "category", "consumer", "advantage", "against", "line", "evidence", "reach", "horizon", "voices", "evidence", "confidence", "strength", "moves", "trigger", "territories", "territory", "headline", "line", "evidence", "competitive_sets", "names", "line", "evidence", "consumer_voice", "line", "quotes", "groups", "label", "quotes", "then_and_now", "line", "then", "now", "the_record", "line", "evidence", "cross_currents", "thread", "evidence", "contradiction", "whitespace", "advertising_read", "outlook", "next_30", "trigger", "evidence", "next_90", "glossary", "definition", "social", "cover_line", "frames", "kicker", "headline", "line", "evidence", "caption"], "record": ["title", "thesis", "the_arc", "by_the_numbers", "stat", "line", "cover_image", "held", "dek", "lead_image", "what_happened", "why_it_matters", "advantage", "against", "evidence", "moves", "faded", "emerged", "scoreboard", "advertising_read", "watch"], "recon": ["title", "subtitle", "ground_line", "thesis", "executive_summary", "line", "evidence", "method", "what_was_read", "how_to_read", "limits", "by_the_numbers", "stat", "line", "cover_image", "findings", "name", "dek", "lead_image", "what_the_data_shows", "what_happened", "why_it_matters", "means", "culture", "category", "consumer", "advantage", "against", "line", "evidence", "reach", "horizon", "voices", "evidence", "confidence", "strength", "moves", "trigger", "territories", "territory", "headline", "line", "evidence", "competitive_sets", "names", "line", "evidence", "consumer_voice", "line", "quotes", "groups", "label", "quotes", "then_and_now", "line", "then", "now", "the_record", "line", "evidence", "cross_currents", "thread", "evidence", "contradiction", "whitespace", "advertising_read", "outlook", "next_30", "trigger", "evidence", "next_90", "glossary", "definition", "social", "cover_line", "frames", "kicker", "headline", "line", "evidence", "caption", "brief_answer", "for_the_brief", "who_is_in", "who_is_absent", "where_to_enter", "evidence"]};
const keysOf = s => { const out = []; const rx = /"([a-z_0-9]+)"(?=\s*:)/g; let m; while ((m = rx.exec(s))) out.push(m[1]); return out; };
for (const k of Object.keys(before)) ok(JSON.stringify(keysOf(R.READ_CONTRACT[k])) === JSON.stringify(before[k]), 'C1 ' + k + ': the same ' + before[k].length + ' keys in the same order as Method 4.2 left them');
const C = R.READ_CONTRACT;
ok(/never the words the edge goes to or the cost of ignoring it/.test(C.weekly) && /never the words the edge goes to or the cost of ignoring it/.test(C.report) && /never the edge template/.test(C.monthly) && /never the edge template/.test(C.record), 'C2 the advantage is one plain sentence in the writer\'s own shape on every kind; the template is named and refused');
ok(/an empty string for a role with nothing earned/.test(C.weekly) && /an empty string for a role with nothing earned/.test(C.report) && /an empty string otherwise/.test(C.monthly) && /an empty string otherwise/.test(C.record), 'C3 moves only where a source supports one, on every kind');
ok(/or an empty string when the evidence holds none; never written to fill the slot/.test(C.weekly) && /or an empty string when the evidence holds none, "evidence": \[ids\]\}, never written to fill the slot/.test(C.report), 'C4 the counter-reading only when real');
ok(/never all three by rule/.test(C.report) && /never all three by rule/.test(C.recon), 'C5 means touches what the finding touches');
ok(/in short sentences with how it works written into them, one verdict, never a label such as the mechanism/.test(C.weekly) && /never a label such as the mechanism/.test(C.report), 'C6 why it matters: short sentences, how it works written in, one verdict, no mechanism label');
ok(/THE SENTENCE: short sentences, one idea in each, no sentence past thirty words outside the ground line/.test(C.report) && /THE SENTENCE: short sentences/.test(C.recon), 'C7 the report and the RECON carry the sentence rule in the contract');
ok(/^CONTRACT \(recon\)\. This is a commissioned research report/.test(C.recon) && /the answer to the brief\\?'s question from the evidence, for the reader, in three short sentences at most/.test(C.recon) && !/what the whole period shows, for the reader, in three short sentences at most/.test(C.recon), 'C8 the RECON\'s thesis replacement still lands on the rewritten anchor');
ok(/"findings": 5 to 8 objects, each standing on its own evidence/.test(C.recon) && /"competitive_sets": 1 to 6 objects, the brief\\?'s competitors first,/.test(C.recon) && /STATS\.recon\.stories_all\), the outlets, the comments read and the dates;/.test(C.recon) && /"by_the_numbers": 5 to 10 objects \{"stat": a key path in STATS\.recon/.test(C.recon) && /"territories": one object per territory where the brief\\?'s slice has stories/.test(C.recon) && /8 to 16 consumer voices on the brief that no finding cites/.test(C.recon), 'C9 every other RECON replacement still takes (findings, sets, ground line, numbers, territories, quotes)');
ok(/"creative", "marketer", "founder", "exec", "talent": one sentence each for the roles the evidence gives a move to, an empty string for the rest, never five by rule\}\}/.test(R.DEEP_STRATEGIST_SYS), 'C10 the strategist writes a move only for the roles the evidence earns');
ok(/material to write from, not slots to fill/.test(R.READ_WRITER_LAW) && /leave a field empty rather than translate a slot into prose/.test(R.READ_WRITER_LAW), 'C11 the writer law: material, not slots');
ok(/long_sentence: a sentence past thirty words in a long field/.test(R.READ_EDITOR_LAW) && /abstract_contrast/.test(R.READ_EDITOR_LAW) && /a style note is rewritten under THE SENTENCE/.test(R.READ_EDITOR_LAW) && /except a counter-reading or a move the evidence does not give, which stays empty/.test(R.READ_EDITOR_LAW), 'C12 the RECON\'s editor fixes the voice notes and never fills a counter-reading or a move');
ok(/"why": the evidence that decides it, in short sentences,/.test(R.READ_THINK_CONTRACT), 'C13 a decision\'s why is short sentences, not a paragraph by rule');

// ── S. The sentence checks ──
const N = R.houseVoiceNotesOf;
ok(JSON.stringify(N('patterns[0].why_it_matters', 'The remasters changed material this week where before they changed color.')) === '["style:abstract_contrast:patterns[0].why_it_matters"]', 'S1 the flagged sentence is noted: a contrast of category words with no thing in it');
ok(N('patterns[0].why_it_matters', 'Nike\'s remasters used to mean a new colorway. This week they meant a new material: the Air Max 95 in leather, the Air Force 1 in GORE-TEX.').length === 0, 'S2 the first rewrite passes');
ok(N('patterns[0].why_it_matters', 'The familiar shoes came back in better skin, not new paint: leather on the 95, GORE-TEX on the Force 1.').length === 0, 'S3 the second rewrite passes: the turn survives when its nouns are things');
ok(N('patterns[3].against', 'The brand sold access rather than product.').length === 1 && N('patterns[3].why_it_matters', 'Nike sold access rather than product.').length === 0, 'S4 a name in the sentence is a thing; a sentence opener is not');
const edge = 'The edge goes to the brand that puts a named person between its AI and its customer and says so; it favors service and media businesses with staff to show, and the cost of ignoring it is being the unverified option on the day the badge becomes the default.';
ok(JSON.stringify(N('patterns[1].advantage', edge)) === '["style:long_sentence:patterns[1].advantage:49","style:edge_template:patterns[1].advantage"]', 'S5 the edge template is noted, with the 49-word sentence it rides');
ok(JSON.stringify(N('patterns[1].why_it_matters', 'The machine made output cheap and verification expensive, and the expense went to people. That is the mechanism: every hour an agent removes from doing the work returns as an hour of checking it.')) === '["style:mechanism_sentence:patterns[1].why_it_matters"]' && N('findings[0].why_it_matters', 'The mechanism is the shelf.').length === 1, 'S6 the mechanism label is noted in both of its forms');
const chain = 'A platform that removes the AI tracks is selling a cleaner catalog; a bank that scans an iris is selling a safer call; a brand that names the person behind its output sells what the output cannot.';
ok(JSON.stringify(N('patterns[2].why_it_matters', chain)) === '["style:long_sentence:patterns[2].why_it_matters:37","style:semicolon_chain:patterns[2].why_it_matters"]', 'S7 the semicolon chain is noted, and the long sentence it makes');
const rough = 'The week ran on checks and bills. Zoom, Bain Capital and VanEck added Proof of Human iris-scan badges from World to stop deepfake fraud; Microsoft told enterprises to treat its AI agents as insider threats; Anthropic employees described their work as babysitting Claudes; Spotify said it had removed more than 50 million AI tracks a year into its crackdown and began asking family-plan members to scan a QR code to prove the household; Elvis Presley\'s estate sued Anthropic over training on his recordings.';
ok(N('the_week', rough).length === 0 && N('the_month', rough).length === 0 && N('ground_line', chain).length === 0, 'S8 the Rough may run long: every clause is a named fact');
ok(N('social.frames[0].line', chain).length === 0 && N('title', edge).length === 0 && N('findings[0].dek', edge).length === 0 && N('glossary[0].term', chain).length === 0, 'S9 the frames, the headlines and the labels keep their own caps and are not checked here');
ok(N('patterns[0].why_it_matters', 'She said "the edge goes to whoever shows up; nobody else; not the brand" and left.').length === 0, 'S10 words inside a quotation are the speaker\'s');
const read = { title: 'People now pay a premium for certainty', thesis: 'Culture spent the week buying insurance.', patterns: [{ name: 'Companies hired humans', why_it_matters: chain, advantage: edge, against: '', evidence: ['S1'], moves: { creative: 'Brief it.', marketer: '', founder: '', exec: '', talent: '' } }], social: { cover_line: 'Certainty costs extra', frames: [{ kicker: 'AI', headline: 'Companies hired humans to mind their machines', line: chain, evidence: ['S1'] }] } };
const st = R.readStyle(read).notes;
ok(st.includes('style:semicolon_chain:patterns[0].why_it_matters') && st.includes('style:edge_template:patterns[0].advantage') && !st.some(n => /social\./.test(n) && /long_sentence|semicolon/.test(n)), 'S11 readStyle carries the voice notes beside the older checks, by path');
ok(R.houseSentences('Legacy does not transfer on its own. The threat isn\'t pricing. It isn\'t product quality.').length === 3 && R.houseSentences('A $7.03B year. Then 2003.').length === 2, 'S12 sentences split as a reader reads them');

// ── V. The voice desk ──
const plan = R.houseVoicePlan(read, st.concat(['house_word:patterns[0].why_it_matters:the lake', 'style:banned:patterns[0].advantage:leverage']));
ok(plan.paths.length === 2 && plan.by['patterns[0].why_it_matters'].length === 2 && plan.by['patterns[0].advantage'].length === 2 && !plan.by['patterns[0].advantage'].some(n => /banned/.test(n)), 'V1 the plan groups the voice notes by line and leaves the other notes alone');
const A = R.houseVoiceAccept;
const line = 'The edge goes to the brand that publishes stock and keeps 12 of the 20 lines on the shelf, and the cost of ignoring it is a loyalty measured in resale premiums rather than repeat purchases S3.';
ok(A('x', line, 'Publish the stock and keep 12 of the 20 lines on the shelf. Otherwise loyalty is measured in resale premiums, not repeat purchases S3.', ['style:edge_template:x']) === null, 'V2 a rewrite that keeps every figure and S-id, grows nothing and loses the fault may stand');
ok(A('x', line, 'Publish the stock and keep twelve of the 20 lines on the shelf S3.', ['style:edge_template:x']) === 'figures', 'V3 a figure dropped or changed is refused');
ok(A('x', line, 'Publish the stock and keep 12 of the 20 lines on the shelf.', ['style:edge_template:x']) === 'sids', 'V4 an S-id dropped is refused');
ok(A('x', line, 'Publish the stock \u2014 keep 12 of the 20 lines S3.', ['style:edge_template:x']) === 'dash', 'V5 a dash is refused');
ok(A('x', line, line + ' And then some more words to carry the line well past what it was before the desk touched it, which is not allowed.', ['style:edge_template:x']) === 'longer', 'V6 a line that grew is refused');
ok(A('x', line, 'The cost of ignoring it is 12 of the 20 lines S3.', ['style:edge_template:x']) === 'still:edge_template', 'V7 a rewrite that keeps the fault it was sent for is refused');
ok(A('x', line, '', ['style:edge_template:x']) === 'empty', 'V8 an empty line is refused');
const ground = 'S1 Companies hired humans; 12 of 20 lines; S3 resale.';
reply = (o) => ({ ok: true, text: JSON.stringify({ text: /why_it_matters/.test(o.prompt) ? 'A platform that removes the AI tracks sells a cleaner catalog. A bank that scans an iris sells a safer call. A brand that names the person behind its output sells what the output cannot.' : 'The edge goes to 12 of them S3.' }), cost_usd: 0.004 });
calls = [];
const read2 = JSON.parse(JSON.stringify(read)); read2.patterns[0].why_it_matters = chain; read2.patterns[0].advantage = edge;
const notes2 = R.readStyle(read2).notes.concat(['proofread:0']);
const hv = await R.houseVoiceRun({}, 'weekly', read2, notes2, ground, [1, 3], []);
ok(calls.length === 2 && calls.every(c => c.tier === 'live' && c.o.kind === 'house_voice' && /THE FAULTS:/.test(c.o.prompt)), 'V9 one live-tier call per noted line, the faults named in the prompt');
ok(hv.read.patterns[0].why_it_matters.startsWith('A platform that removes the AI tracks sells a cleaner catalog.') && hv.read.patterns[0].advantage === edge, 'V10 the line whose rewrite stood is replaced; the line whose rewrite added a figure is kept as it was');
ok(hv.notes.includes('voice_desk:fixed:1') && hv.notes.some(n => /^voice_desk:left:patterns\[0\]\.advantage:figures$/.test(n)) && !hv.notes.some(n => /semicolon_chain:patterns\[0\]\.why_it_matters/.test(n)) && hv.notes.includes('style:edge_template:patterns[0].advantage') && hv.notes.includes('proofread:0'), 'V11 the fixed line\'s notes go, the refused line keeps its note, the other notes ride through');
ok(hv.receipt && hv.receipt.fixed === 1 && hv.receipt.left === 1 && hv.receipt.cost_usd === 0.008 && hv.receipt.changes[0].faults.includes('semicolon_chain'), 'V12 the receipt: what was fixed, what was left, what it cost');
reply = { ok: false, error: 'tier_cap' }; calls = [];
const hv2 = await R.houseVoiceRun({}, 'weekly', read2, notes2, ground, [1, 3], []);
ok(hv2.read === read2 && hv2.notes.filter(n => /^voice_desk:left:/.test(n)).length === 2 && hv2.receipt.fixed === 0, 'V13 a desk the tier refuses leaves the read as it was, notes and all');
ok(R.HOUSE_VOICE.MAX_LINES === 24 && R.HOUSE_VOICE.GROW === 1.1, 'V14 at most 24 lines a landing; a line may grow a tenth and no more');
const none = await R.houseVoiceRun({}, 'weekly', { title: 'T', thesis: 'Short.' }, ['proofread:0'], ground, [], []);
ok(none.receipt === null && none.notes.length === 1, 'V15 a read with no voice notes costs nothing');
ok(/const hv = await houseVoiceRun\(env, row\.kind, v\.read, v\.notes, ground, row\.pack_ids \|\| \[\], extra\)/.test(w) && /voiceReceipt \? \{ voice: voiceReceipt \} : \{\}/.test(w) && /if \(!v\.fatal\.length\) \{   \/\/ SEAM:HOUSE_VOICE/.test(w), 'V16 the landing runs the desk on a WEEKLY, monthly or record with nothing fatal, before the copy desk, and keeps the receipt on meta.voice');
ok(!/houseVoiceRun\(env, row\.kind[\s\S]{0,400}readReportLaws/.test(w.slice(w.indexOf('if (v.read && readIsReport(row.kind)) {'), w.indexOf('if (v.read && readIsReport(row.kind)) {') + 1200)), 'V17 a report or a RECON is not sent to the desk: the editor fixes its notes');

// ── L. The sell law ──
const finding = (over) => Object.assign({ advantage: 'Keep the core on the shelf.', trigger: 'Sell-through.', against: { line: '', evidence: [] }, reach: 'category', horizon: 'now', moves: { creative: 'Brief it.', marketer: '', founder: '', exec: '', talent: '' }, supports: { outlets: 2 }, voices: ['V1'] }, over || {});
const rowOf = (f1, f2) => ({ kind: 'report', status: 'ready', version: 1, window_start: '2026-09-01', window_end: '2026-09-30', read: { title: 'T', thesis: 'S.', findings: [f1, f2] }, violations: [], meta: { proof: { lane: 'live' }, issue_no: 1 }, stats: { lake: { shape: {}, prior_comparable: false } } });
ok(R.readSellable(rowOf(finding(), finding())).fails.length === 0, 'L1 a finding with one earned move and no counter-reading sells');
ok(R.readSellable(rowOf(finding({ moves: { creative: '', marketer: '', founder: '', exec: '', talent: '' } }), finding())).fails.includes('finding_1:moves'), 'L2 a finding with no move at all does not');
ok(R.readSellable(rowOf(finding({ against: { line: 'Something cuts against it.', evidence: [] } }), finding())).fails.includes('finding_1:against'), 'L3 a counter-reading written on no evidence does not: that is the ritual');
ok(R.readSellable(rowOf(finding({ against: { line: 'Walmart widened what agents can do.', evidence: ['S4'] } }), finding())).fails.length === 0 && R.SELL_LAW.ROLES.length === 5, 'L4 a counter-reading on evidence sells; the five roles stand as the moves\' names');

// ── G. The gate and the page ──
ok(/'houseVoicePart': 'claudeGate on the live tier, one call per line a voice note sits on/.test(fs.readFileSync('tools/ritual_gate.py', 'utf-8')), 'G1 the voice desk is a registered spender');
ok(/"SEAM:HOUSE_VOICE": \{/.test(fs.readFileSync('seams.json', 'utf-8')), 'G2 SEAM:HOUSE_VOICE is registered');
const page = fs.readFileSync('intelligence/read/index.html', 'utf-8');
ok(/ROLES\.filter\(function \(r\) \{ return p\.moves\[r\]; \}\)/.test(page) && /\(p\.against \? '<div class="rp-against">/.test(page) && /\["culture", "category", "consumer"\]\.filter\(function \(k\) \{ return f\.means\[k\]; \}\)/.test(page), 'G3 the page already skips an empty move, an empty counter-reading and an empty means line: nothing on the page or the PDF changes');

console.log(`\nproof_house_voice: ${pass} checks passed`);
