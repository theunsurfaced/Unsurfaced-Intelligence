/**
 * proof_reach.mjs  --  EX30 THE REACH: SEAM:CLIENT_PROFILE, SEAM:ROLE_IMPLICATIONS, SEAM:READER_MARKS, SEAM:REACH_PUSH, SEAM:EVIDENCE_PACK.
 * The reader has a profile; the insight speaks to their role; they can mark it; what moves on their frames reaches them once; the
 * evidence travels as a document. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the profile, pure ────────────────────────────────────────────────────────────────────────────────────────────────────────
const P = new Function(between(w, 'const PROFILE = {', 'async function profileLoad(') + '; return { profileClean, profileWebhookOk, PROFILE };')();
ok(P.profileWebhookOk('https://hooks.slack.com/services/T/B/x') && P.profileWebhookOk('https://acme.webhook.office.com/webhookb2/x') && P.profileWebhookOk('https://prod-12.westus.logic.azure.com/workflows/x') && !P.profileWebhookOk('https://evil.example/hook') && !P.profileWebhookOk('http://hooks.slack.com/x') && P.profileWebhookOk(''), 'A1 a webhook is Slack, Teams or an Azure workflow over https, or nothing');
const c = P.profileClean({ role_title: 'ceo', tracked_brands: ['Jordan Brand', ' jordan brand ', 'x', 'Nike'], follows: [{ kind: 'brand', value: 'Nike' }, { kind: 'brand', value: 'nike' }, { kind: 'planet', value: 'Mars' }, { kind: 'category', value: 'hair care' }], slack_webhook: 'https://evil.example/x', digest_day: 9 }, { slack_webhook: 'https://hooks.slack.com/services/kept' });
ok(c.role_title === 'other' && c.tracked_brands.length === 3 && c.follows.length === 2 && c.slack_webhook === 'https://hooks.slack.com/services/kept' && c.digest_day === 1, 'A2 an unknown role is other, duplicates and short names go, an unknown follow kind goes, a bad webhook keeps the old one, a bad day is Monday');
ok(/webhooks never echoed|slack_webhook: p\.slack_webhook \? 'set' : null/.test(w) && /return json\(\{ ok: false, error: 'auth_required' \}, 401, origin, env\);\n  const prev = await profileLoad\(env, user\);/.test(w), 'A3 the profile is signed in and never echoes a webhook back');

// ── B: the push, pure ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const M = new Function('ROLE_WORDS', 'esc', 'EXC_BLIND', between(w, 'const PUSH = {', 'async function pushWebhook(') + '; return { pushMatches, pushMailHtml, pushText };')({ other: 'x' }, s => String(s), 'BLIND');
const prof = { tracked_brands: ['Jordan Brand'], follows: [{ kind: 'category', value: 'Hair Care' }, { kind: 'audience', value: 'Gen Z' }] };
ok(M.pushMatches({ frame: { entity: 'jordan brand' } }, prof) === 'brand' && M.pushMatches({ frame: { entity: 'Nike', competitors: ['Jordan Brand'] } }, prof) === 'competitor' && M.pushMatches({ frame: { category: 'hair care' } }, prof) === 'category' && M.pushMatches({ frame: { audience: 'Gen Z' } }, prof) === 'audience' && M.pushMatches({ frame: { entity: 'Tesla', category: 'cars' } }, prof) === null,
  'B1 a reading reaches a reader by their brand, its competitive set, a followed category or audience; nothing else does');
const tile = { id: '11111111-1111-1111-1111-111111111111', deployed: '2026-10-09', claim: 'Gen Z buys retro on price, not hype.', move: 'Price the retro at 150.', called: { verdict: 'held' } };
const html = M.pushMailHtml({ APP_URL: 'https://x.test' }, prof, [{ kind: 'called', tile, why: 'brand' }], ['Line one.', 'Do this first.']);
ok(/Your Monday brief/.test(html) && /HELD/.test(html) && /https:\/\/x\.test\/i\/11111111-1111-1111-1111-111111111111/.test(html) && /BLIND/.test(html) && !/—/.test(html), 'B2 the mail opens with the brief, names the grade, links the permalink and carries the blind-spots line');
ok(/^Your Monday brief:\n/.test(M.pushText({ APP_URL: 'https://x.test' }, [{ kind: 'deployed', tile, why: 'brand' }], ['A line'])) && /DEPLOYED 2026-10-09: Gen Z buys retro/.test(M.pushText({}, [{ kind: 'deployed', tile, why: 'brand' }], [])), 'B3 the webhook text carries the same brief and lines');
const push = between(w, 'async function pushNightly(env) {', '/* ═══ SEAM:EVIDENCE_PACK');
ok(/const active = profs\.filter\(p => \(\(p\.tracked_brands \|\| \[\]\)\.length \|\| \(p\.follows \|\| \[\]\)\.length\) && \(p\.push_email !== false \|\| p\.slack_webhook \|\| p\.teams_webhook\)\);/.test(push) && /const seen = new Set\(sentBefore\.map\(r => r\.kind \+ ':' \+ r\.insight_id\)\);/.test(push) && /if \(!fresh\.length\) continue;/.test(push),
  'B4 only readers with frames and a channel are considered; an insight already sent is never sent again; a reader with nothing fresh gets nothing');
ok(/if \(weekday === \(prof\.digest_day == null \? 1 : prof\.digest_day\)\)/.test(push) && /brief = await pushBrief\(env, prof, week\)/.test(push) && /kind: 'push_brief'/.test(w), 'B5 the Monday brief is written once, on the reader\'s digest day, from the week\'s deployments on their frames');
ok(/\.then\(\(\) => pushNightly\(env\)\)   \/\/ SEAM:REACH_PUSH/.test(w) && /which === 'push' \? await pushNightly\(env\)/.test(w), 'B6 the push runs after the grade each night and from the desk');

// ── C: the implications and the marks ──────────────────────────────────────────────────────────────────────────────────────────
ok(/const ROLE_IMP = \{ TTL: 86400, MAX_TOKENS: 600, TIMEOUT_MS: 20000, KEY: 'roleimp:v1:' \};/.test(w) && /callClaude\(env, 'frame', \{ system: ROLE_IMP_SYS, cache: true, prompt, max_tokens: ROLE_IMP\.MAX_TOKENS, temperature: 0, kind: 'role_implications'/.test(w) && /const r0 = PROFILE\.ROLES\.includes\(role\) \? role : 'other', key = ROLE_IMP\.KEY \+ tile\.id \+ ':' \+ r0;/.test(w),
  'C1 three implications on Haiku, cached a day per insight and role');
ok(/if \(!user\) return json\(\{ ok: false, error: 'auth_required' \}, 401, origin, env\);\n  const id = String\(new URL\(request\.url\)\.searchParams\.get\('id'\) \|\| ''\)\.slice\(0, 40\);\n  const rows = \(await sbRest\(env, 'door_reads\?id=eq\.' \+ id \+ '&status=in\.\(ready,reused\)/.test(w), 'C2 the implications are written only for a signed-in reader on a real deployment');
ok(/const MARKS = \['held', 'useful', 'wrong'\];/.test(w) && /insight_marks\?on_conflict=insight_id,user_id/.test(w) && /resolution=merge-duplicates/.test(between(w, 'async function markRoute(', '/* ═══ SEAM:REACH_PUSH')), 'C3 one mark per reader per insight, replaced on a second mark');
ok(/'roleImplications': 'claudeGate on the frame tier/.test(gate) && /'pushBrief': 'claudeGate on the frame tier/.test(gate), 'C4 both spenders are registered with their guards');

// ── D: the pack and the embed ───────────────────────────────────────────────────────────────────────────────────────────────────
const pack = between(w, 'function insightPackHtml(env, row) {', 'async function insightPackRoute(');
ok(/EVIDENCE PACK/.test(pack) && /What it stood on/.test(pack) && /What this reading does not see/.test(pack) && /What people are saying/.test(pack) && /credited by what the speaker said about themselves, never by name/.test(pack) && /excBlindLine === 'function' \? excBlindLine\(env\)/.test(pack) && !/—/.test(pack), 'D1 the pack carries the claim, the move, the findings, the voices, every line, the blind spots (computed); no dash');
ok(/async function insightPackRoute\(request, env, origin\) \{\n  const user = await authenticate\(request, env\);\n  if \(!user\) return json/.test(w) && /'Cache-Control': 'private, no-store'/.test(between(w, 'async function insightPackRoute(', '/* ═══ SEAM:BACKUP')), 'D2 the pack is signed in and never cached');
ok(/async function insightSharePage\(path, env, embed\) \{/.test(w) && /if \(embed\) \{   \/\/ SEAM:EVIDENCE_PACK: the embeddable card/.test(w) && /target="_top">Open the reading<\/a>/.test(w), 'D3 the permalink serves an embeddable card on ?embed=1 that links back');
ok(/if \(path === '\/client\/profile' && \(request\.method === 'GET' \|\| request\.method === 'POST'\)\) return profileRoute/.test(w) && /if \(path === '\/excavate\/insight\/roles' && request\.method === 'GET'\) return roleImplicationsRoute/.test(w) && /if \(path === '\/excavate\/insight\/pack' && request\.method === 'GET'\) return insightPackRoute/.test(w) && /if \(path === '\/excavate\/mark' && \(request\.method === 'GET' \|\| request\.method === 'POST'\)\) return markRoute/.test(w),
  'D4 the profile, the implications, the pack and the marks are routes');
ok(fs.existsSync('supabase/migrations/0042_reach.sql') && /create table if not exists public\.client_profile/.test(fs.readFileSync('supabase/migrations/0042_reach.sql', 'utf-8')) && /unique \(insight_id, user_id\)/.test(fs.readFileSync('supabase/migrations/0042_reach.sql', 'utf-8')), 'D5 migration 0042: the profile, the marks (one per reader) and the push log');

// ── E: the page ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/onclick="_profileOpen\(\)">Your profile<\/button>/.test(page) && /async function _profileOpen\(\)/.test(page) && /id="pm-role"/.test(page) && /id="pm-tracked"/.test(page) && /id="pm-slack"/.test(page) && /id="pm-day"/.test(page), 'E1 your profile under the user menu: role, tracked brands, follows, push, webhooks, brief day');
ok(/_reachBlock\(t\.id\);   \/\/ SEAM:ROLE_IMPLICATIONS/.test(page) && /FOR YOUR ROLE/.test(page) && /\/excavate\/insight\/roles\?id=/.test(page) && /onclick="_packOpen\('\$\{safeAttr\(id\)\}'\)">Evidence pack<\/button>/.test(page) && /onclick="_embedCopy\('\$\{safeAttr\(id\)\}'\)">Embed<\/button>/.test(page),
  'E2 opening a deployed reading adds the reach block: the implications for your role, the evidence pack, the embed');
ok(/\['held', 'useful', 'wrong'\]\.map\(m => `<button type="button" class="reach-mark/.test(page) && /api\('excavate\/mark', \{ id, mark \}\)/.test(page), 'E3 the three marks with their counts, posted signed in');
ok(/onclick="_followLens\(\)">Follow \$\{safe\(_recLens\.value\)\}<\/button>/.test(page) && /async function _followLens\(\)/.test(page), 'E4 a lens on the record can be followed in one click');
ok(/\.pm-wrap\{position:fixed;inset:0;[^}]*z-index:var\(--z-modal\)/.test(page), 'E5 the profile modal sits on the modal token');
ok(!/—/.test(between(w, 'const PROFILE = {', '/* ═══ SEAM:BACKUP') + between(page, 'async function _profileGet()', 'function _embedCopy(')), 'F1 no em dash in the new code');
console.log('\nproof_reach: ' + pass + ' checks PASS');
