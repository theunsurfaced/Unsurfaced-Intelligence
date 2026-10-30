/**
 * proof_daily_house_voice.mjs  --  VX1c THE VOICE, DAILY: the third writer under Method 5.0's voice.
 * Run from the repo root: node worker/proofs/proof_daily_house_voice.mjs
 *   V the voice (DAILY_POV.stages)   L the legacy editor   A the assembly   N the notes   H the hook   R the registry and the migration
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('missing ' + a); const j = s.indexOf(b, i + 1); if (j < 0) throw new Error('missing ' + b); return s.slice(i, j); };
const keysOf = seg => [...new Set(seg.match(/"([a-zA-Z_]+)":/g).map(x => x.slice(1, -2)))].sort().join(',');

// ── V: the voice ──────────────────────────────────────────────────────────────────────
const povSrc = between(w, 'const DAILY_POV = {', '\n/* GET /daily/pov');
const POV = new Function(povSrc + '; return DAILY_POV;')();
const st = POV.stages;
ok(typeof st.voice === 'string' && /^You write for Unsurfaced DAILY as a creative who was in the room: the drop, the show, the stoop, the group chat, the restaurant where the menu changed\./.test(st.voice),
  'V1 the stance: a creative who was in the room, in DAILY\'s two sentences');
ok(/You write for people who were there too, or wish they had been, and who are paid to act on what you saw\./.test(st.voice), 'V2 the reader: people who were there too, paid to act');
ok(/THE SENTENCE: short, none past twenty words; one idea in each\./.test(st.voice) && /Say what happened with the names in it, then the one line that lets it land, and only when the fact does not already say it\./.test(st.voice),
  'V3 the sentence: twenty words at most, one idea each, the fact then the one line that lets it land');
ok(/Concrete nouns: the product, the place, the person, the price, the hour\./.test(st.voice) && /A contrast \("X, not Y"\) only when both sides are things a person could point at, never two category words\./.test(st.voice),
  'V4 concrete nouns; the contrast turn only with things a person could point at');
ok(/Never "the mechanism", never "which means", never a closing line written to be quoted, never "should focus on", "leverage" or "stay competitive"\. No hedging\. Never use the em dash character\./.test(st.voice),
  'V5 the mechanism label, which means, the quotable closer and agency-speak are faults; no hedging; the dash stays banned');
ok(/THE REGISTER, from our own hand: "Michael Jordan's last NBA game came before any Gen Alpha consumer was born\. Legacy does not transfer on its own\." "The threat isn't pricing\. It isn't product quality\. It's cultural distance\."/.test(st.voice),
  'V6 two of Fresco\'s sentences are the register (Chicago, Kraft Heinz; never the ORS deck)');
ok(/Form: "The remasters changed material this week where before they changed color\." Person: "Nike's remasters used to mean a new colorway\. This week they meant a new material: the Air Max 95 in leather\."/.test(st.voice),
  'V7 the lesson on the turn: the flagged sentence beside its rewrite');
ok(/Our words where they fit, never as decoration: proof, earned, show up, the room, the drop, ritual, insider\./.test(st.voice), 'V8 the words of practice');
ok(/^You write the take: two to four sentences, none past twenty words\. What happened, with the names in it, from the evidence only; then the one line that lets it land, if the fact does not already say it\. If you infer, say so plainly\. Declarative, specific, zero hype\.$/.test(st.interpret),
  'V9 the take: what happened then the one line, twenty words at most, the evidence law kept');
ok(!/observable shift|human tension|new expectation|possibility it opens/.test(st.interpret) && !/why now|who benefits|second-order/.test(st.interpret + st.apply), 'V10 the arc and the why-now triad are gone from the take');
ok(/^One sentence, under twenty words, on what this changes for the people in it\. End with exactly one audience tag in brackets from: \[creative\] \[founder\] \[marketer\] \[exec\] \[talent\]\.$/.test(st.apply),
  'V11 the apply line: one short sentence on what changes, the audience tag law kept word for word');
ok(POV.version === 'pov-2026-10' && [st.voice, st.interpret, st.apply].every(s => s.indexOf('\u2014') < 0 && s.indexOf('\u2013') < 0) && st.voice.length < 1500,
  'V12 the POV version moved (a new voice is a new POV); no dash; the voice stays under 1,500 characters for a small model');
ok(/^You are the FILTER stage/.test(st.filter) && /^You are the FILTER stage/.test(st.filter_batch) && /^Given a small set of signals/.test(st.connect), 'V13 the filter and connect stages are untouched');

// ── L: the legacy editor ──────────────────────────────────────────────────────────────
const leg = between(w, "const sys = 'You are the editor of Unsurfaced DAILY, a cultural-intelligence brief. '", '  let parsed = null;');
ok(/DAILY_POV\.stages\.voice/.test(leg) && !/why now, who benefits|second-order effect|you INTERPRET it/.test(leg), 'L1 the legacy editor reads the same voice; the why-now triad is gone');
ok(/a headline that is a claim about people with a verb; a standfirst that says what happened with the names in it; a take of two or three short sentences, none past twenty words: what happened and the one thing it changes, if the fact does not already say it\./.test(leg),
  'L2 the legacy editor\'s shape: the headline a claim about people, the standfirst what happened, the take the fact and the one thing it changes');
ok(/Ground every item in the evidence; never invent facts, sources, or URLs\. Copy each item\\'s source_name and source_url VERBATIM from the evidence item you used\. Output STRICT JSON only, no markdown fences, no prose outside the JSON\./.test(leg),
  'L3 the grounding, the copied source and the JSON law stand word for word');
ok(keysOf(leg) === 'headline,items,kicker,lead_headline,source_name,source_url,standfirst,take', 'L4 the legacy JSON shape keeps its eight keys, as before this cut');
ok(/<=12-word headline/.test(leg) && /<=20-word framing line/.test(leg) && /Exactly 6 items across distinct beats\. JSON only\./.test(leg) && /<=12 words/.test(leg), 'L5 the caps and the count stand: 12-word headline, 20-word standfirst, six items');
ok(/"take":"2-3 short sentences, none past twenty words: what happened, with the names in it, and the one thing it changes if the fact does not already say it"/.test(leg), 'L6 the take\'s description in the shape');

// ── A: the assembly ───────────────────────────────────────────────────────────────────
const lake = between(w, 'async function composeFromLake(env, today) {', 'async function spineAdvance(');
ok(/content: DAILY_POV\.stages\.voice \+ ' ' \+ DAILY_POV\.stages\.interpret \+ ' Then, on its own final line: ' \+ DAILY_POV\.stages\.apply/.test(lake), 'A1 the lake composer\'s system prompt is the voice, the take and the apply line');
ok((lake.match(/callModel\(env, 't3'/g) || []).length === 1 && /max_tokens: 320/.test(lake), 'A2 one call per item on the same tier with the same room: no new spender');
ok(/headline: studioTrimClean\(c\.title, 200\)/.test(lake) && /standfirst: firstSentences\(c\.summary, 220\)/.test(lake), 'A3 in lake mode the headline and the standfirst are still the source\'s own words');

// ── N: the notes ──────────────────────────────────────────────────────────────────────
const styleSrc = between(w, 'const READ_STYLE = {', 'function readStyle(read) {');
const noteSrc = between(w, 'const DAILY_VOICE = {', '\n/* GET /daily/pov');
const N = new Function(styleSrc + noteSrc + '; return { dailyVoiceNotes, DAILY_VOICE };')();
const long = 'Joe Freshgoods posted a closer look at the unreleased New Balance 990v7 on his Instagram Story on October 12 and again October 14 while New Balance had not announced a release date or price as of October 14.';
const items = [{ headline: long, standfirst: 'Fine.', take: long, apply: 'Fine. [creative]' }];
const lakeNotes = N.dailyVoiceNotes(items, 'lake'), legNotes = N.dailyVoiceNotes(items, 'legacy');
ok(lakeNotes.some(n => /^voice:long_sentence:items\[0\]\.take:3\d$/.test(n)) && !lakeNotes.some(n => /items\[0\]\.headline/.test(n)), 'N1 lake mode: a 33-word take is noted; the headline (the source\'s title) is not checked');
ok(legNotes.some(n => /items\[0\]\.headline/.test(n)) && legNotes.some(n => /items\[0\]\.take/.test(n)), 'N2 legacy mode: the editor wrote the headline too, so it is checked');
ok(N.dailyVoiceNotes([{ take: 'Nike\'s remasters used to mean a new colorway. This week they meant a new material: the Air Max 95 in leather, the Air Force 1 in GORE-TEX.', apply: 'Put the shoe in the sentence. [marketer]' }], 'lake').length === 0,
  'N3 the rewrite passes: two sentences under twenty words, the turn with things in it');
ok(N.dailyVoiceNotes([{ take: 'The remasters changed material this week where before they changed color.' }], 'lake').includes('voice:abstract_contrast:items[0].take'), 'N4 the flagged sentence is an abstract contrast');
ok(N.dailyVoiceNotes([{ take: 'The edge goes to the brand that shows the person. The cost of ignoring it is the badge.' }], 'lake').includes('voice:edge_template:items[0].take'), 'N5 the edge template is noted');
ok(N.dailyVoiceNotes([{ take: 'That is the mechanism: the check moved to people.' }], 'lake').includes('voice:mechanism_sentence:items[0].take'), 'N6 the mechanism label is noted');
ok(N.dailyVoiceNotes([{ take: 'A platform sells a catalog; a bank sells a call; a brand sells a name.' }], 'lake').includes('voice:semicolon_chain:items[0].take'), 'N7 a semicolon chain is noted');
ok(N.dailyVoiceNotes([{ take: 'Fine.', apply: 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone. [exec]' }], 'lake').includes('voice:long_sentence:items[0].apply:21'),
  'N8 the apply line is checked with its audience tag stripped; twenty-one words is noted');
ok(N.dailyVoiceNotes(Array.from({ length: 50 }, () => ({ take: long })), 'lake').length === N.DAILY_VOICE.MAX && N.DAILY_VOICE.MAX === 40 && N.DAILY_VOICE.LONG === 20, 'N9 forty notes at most; the long rule is twenty words');
ok(N.dailyVoiceNotes(null, 'lake').length === 0 && N.dailyVoiceNotes([{}], 'legacy').length === 0, 'N10 nothing to check is nothing noted');

// ── H: the hook ───────────────────────────────────────────────────────────────────────
const pub = between(w, 'async function publishEdition(env, today, existing, leadHeadline, items, mode, spine) {', '/* SEAM:WEEKLY_STAND');
const iPub = pub.indexOf("body: { status: 'published', headline: leadHeadline, published_at: new Date().toISOString() }"), iVoice = pub.indexOf('dailyVoiceNotes(items, mode)'), iProv = pub.indexOf('// provenance thread');
ok(iPub > 0 && iVoice > iPub && iProv > iVoice, 'H1 the notes are written after the edition is published and before the provenance thread');
ok(/try \{[^]*?dailyVoiceNotes\(items, mode\)[^]*?editions\?id=eq\.\$\{edId\}[^]*?meta: \{ voice: \{ n: voice\.length, notes: voice, at: new Date\(\)\.toISOString\(\) \} \}[^]*?\} catch \(e\) \{ console\.log\('daily_voice_error'/.test(pub),
  'H2 a separate PATCH writes editions.meta.voice inside its own try; a failure is logged and never touches the publish (no new swallow)');
ok(/logEvent\(env, 'daily', null, 'edition_voice', null, \{ date: today, n: voice\.length \}\)/.test(pub), 'H3 the count is logged under the daily platform (one the event table accepts)');
ok(/typeof dailyVoiceNotes === 'function'/.test(pub), 'H4 the hook guards the helper so a slice without it still publishes');
ok(/await dayFramesEnsure\(env, \{ id: edId, issue_no: issueNo, date: today, headline: leadHeadline \}, createdItems, \{ by: 'cron' \}\)/.test(pub) && !/buildStudioManifest/.test(pub), 'H5 the day\'s frames line is as RD1b left it; the STUDIO cut is gone from the hook');
ok(!/callModel|callClaude|env\.AI\.run|fal\.run|fetch\(/.test(noteSrc), 'H6 the notes spend nothing: no model, no fetch');

// ── R: the registry and the migration ─────────────────────────────────────────────────
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
ok(seams.registry['SEAM:DAILY_VOICE'] && seams.registry['SEAM:DAILY_VOICE'].file === 'worker/src/index.js', 'R1 SEAM:DAILY_VOICE is registered on the worker');
const mig = fs.readFileSync('supabase/migrations/0058_edition_voice.sql', 'utf-8');
ok(/alter table public\.editions add column if not exists meta jsonb not null default '\{\}'::jsonb;/.test(mig) && mig.indexOf('\u2014') < 0, 'R2 the migration adds editions.meta once, idempotent');
ok([noteSrc, leg, st.voice, st.interpret, st.apply].every(s => s.indexOf('\u2014') < 0), 'R3 no em dash in anything this cut wrote (the notes block, the legacy editor, the three stage strings)');

console.log(`\nproof_daily_house_voice: ${pass} checks passed`);
