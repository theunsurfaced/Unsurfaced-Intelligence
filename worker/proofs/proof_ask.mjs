/**
 * proof_ask.mjs  --  EX48 THE ASK (SEAM:ASK_TEAM): a member asks the team for more; the house hears at once; the desk answers with a
 * reply and, when it is bigger work, an offer; the member says yes on the page. No model is called and no price is typed.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const sql = fs.readFileSync('supabase/migrations/0049_asks.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* ═══ SEAM:ASK_TEAM (EX48)'), w.indexOf("const ACCESS = { KEY: 'knock:'"));

let asks, mails, events, kvm, plan, doors;
const reset = () => { asks = []; mails = []; events = []; kvm = new Map(); plan = { plan: 'member', group: null }; doors = { 'aaaaaaaa-0000-0000-0000-000000000001': { id: 'aaaaaaaa-0000-0000-0000-000000000001', read: {}, frame: {} } }; };
const q = (path, k) => { const m = new RegExp('(?:^|[?&])' + k + '=eq\\.([^&]+)').exec(path); return m ? decodeURIComponent(m[1]) : null; };
let n = 0;
const sbRest = async (env, path, opts = {}) => {
  const t = path.split('?')[0], method = opts.method || 'GET';
  if (t === 'member_asks') {
    if (method === 'POST') { const row = Object.assign({ id: 'bbbbbbbb-0000-0000-0000-00000000000' + (++n), status: 'new', created_at: '2026-10-14T12:00:00Z' }, opts.body); asks.push(row); return [Object.assign({}, row)]; }
    if (method === 'PATCH') { const r = asks.find(a => a.id === q(path, 'id')); Object.assign(r, opts.body); return null; }
    let rows = asks; const id = q(path, 'id'), u = q(path, 'user_id'), s = q(path, 'status');
    if (id) rows = rows.filter(a => a.id === id); if (u) rows = rows.filter(a => a.user_id === u); if (s) rows = rows.filter(a => a.status === s);
    return rows.map(r => Object.assign({}, r));
  }
  if (t === 'door_reads') { const r = doors[q(path, 'id')]; return r ? [r] : []; }
  return [];
};
const env = { RATE_LIMIT: { get: async k => kvm.get(k) || null, put: async (k, v) => { kvm.set(k, v); } }, APP_URL: 'https://unsurfaced-intelligence.com' };
const json = (o, s) => Object.assign({ _status: s || 200 }, o);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const A = new Function('sbRest', 'json', 'excQuiet', 'doorTile', 'planState', 'watchRecipients', 'sendEmail', 'logEvent', 'esc',
  block + '; return { ASK_TEAM, askTeamRoute, asksDesk, askReplyDesk, askTeamPublic };')(
  sbRest, json, (k, v) => () => v, r => ({ claim: 'Jordan wins the court', title: 't' }), async () => plan, async () => ['house@unsurfaced.test'],
  async (e, m) => { mails.push(m); return { ok: true }; }, (e, p, s, event, x, meta) => { events.push({ event, meta }); return Promise.resolve(); }, esc);
const ana = { id: 'ana', email: 'ana@brand.test' };
const post = b => A.askTeamRoute({ method: 'POST' }, env, '', ana, b);

// ── asking ───────────────────────────────────────────────────────────────
reset();
let d = await post({ kind: 'insight', ref: 'aaaaaaaa-0000-0000-0000-000000000001', question: 'What would this mean for women\'s basketball in Chicago next season?' });
ok(d.ok && asks.length === 1 && asks[0].ref_title === 'Jordan wins the court' && asks[0].plan === 'member' && asks[0].kind === 'insight', 'A1 an ask about an insight is kept with the insight\'s claim and the member\'s plan');
ok(mails.length === 1 && mails[0].to === 'house@unsurfaced.test' && mails[0].reply_to === 'ana@brand.test' && /women\'s basketball/.test(mails[0].html) && /"run":"ask_reply"/.test(mails[0].html), 'A2 the house is mailed at once; replying from the inbox reaches the member; the desk line is in the mail');
ok(d.told && /comes to ana@brand\.test/.test(d.say) && events.some(e => e.event === 'ask_team'), 'A3 the member is told where the answer comes');
d = await post({ kind: 'search', ref: 'gen z running clubs', question: 'Which brands are sponsoring these clubs, and is it working for them?' });
ok(d.ok && asks[1].ref_title === 'gen z running clubs', 'A4 an ask about a search carries the query');
ok((await post({ question: 'too short' })).error === 'too_short' && (await post({ question: 'x'.repeat(1501) })).error === 'too_long' && asks.length === 2, 'A5 an ask runs 20 to 1,500 characters');
for (let i = 0; i < 3; i++) await post({ question: 'Another question that is long enough ' + i });
d = await post({ question: 'The sixth question of the day, long enough' });
ok(!d.ok && d.error === 'ask_limit' && asks.length === 5, 'A6 five asks a day reach the team');
ok((await post({ kind: 'bogus', question: 'A question with a kind nobody knows about' })).error === 'ask_limit', 'A7 the limit holds whatever the kind');
reset(); await post({ kind: 'bogus', question: 'A question with a kind nobody knows about' });
ok(asks[0].kind === 'other', 'A8 an unknown kind is kept as other');

// ── the desk answers ─────────────────────────────────────────────────────
reset(); mails = [];
await post({ kind: 'insight', ref: 'aaaaaaaa-0000-0000-0000-000000000001', question: 'What would this mean for women\'s basketball in Chicago next season?' });
let list = await A.asksDesk(env, {});
ok(list.count === 1 && list.asks[0].email === 'ana@brand.test' && /ask_reply/.test(list.say), 'D1 {run:"asks"} lists what waits, oldest first');
const id = asks[0].id; mails = [];
ok((await A.askReplyDesk(env, { id, reply: 'Short' })).error === 'bad_reply' && (await A.askReplyDesk(env, { id, reply: 'A reply — with a dash in it' })).error === 'em_dash', 'D2 a reply has to say something, and in the house voice');
d = await A.askReplyDesk(env, { id, reply: 'The court signal is strongest in Chicago. A full read would test it against three leagues.', offer: 'recon' }, 'fresco@unsurfaced');
ok(d.ok && d.status === 'offered' && asks[0].offer === 'recon' && asks[0].answered_by === 'fresco@unsurfaced', 'D3 a reply with an offer is kept as offered, with who answered');
ok(mails.length === 1 && mails[0].to === 'ana@brand.test' && mails[0].reply_to === 'house@unsurfaced.test' && /a RECON/.test(mails[0].html) && /scope and a price/.test(mails[0].html) && !/\$\d/.test(mails[0].html), 'D4 the member is mailed the answer and the offer; the reply goes to the house; no price is typed');
ok((await A.asksDesk(env, {})).count === 0 && (await A.asksDesk(env, { status: 'offered' })).count === 1, 'D5 an answered ask leaves the waiting list');
await post({ question: 'A plain question that only needs a plain answer' });
d = await A.askReplyDesk(env, { id: asks[1].id, reply: 'Here is the plain answer, from the record.' });
ok(d.status === 'answered' && asks[1].offer === 'none', 'D6 a reply with no offer is answered');
ok((await A.askReplyDesk(env, { id: 'nope', reply: 'Here is the plain answer.' })).error === 'bad_id', 'D7 a bad id is refused');

// ── the member reads and says yes ────────────────────────────────────────
d = await A.askTeamRoute({ method: 'GET' }, env, '', ana, {});
const off = d.asks.find(a => a.status === 'offered');
ok(d.ok && d.asks.length === 2 && off.offer.kind === 'recon' && /RECON/.test(off.offer.say) && !off.accepted && /court signal/.test(off.reply), 'M1 GET /asks shows the member her asks, the answers and the offer');
mails = [];
d = await A.askTeamRoute({ method: 'POST' }, env, '', ana, { accept: id });
ok(d.ok && asks[0].accepted_at && mails.length === 1 && mails[0].reply_to === 'ana@brand.test' && /said yes/.test(mails[0].html), 'M2 a yes is kept and the house is told, with the member as reply-to');
mails = []; await A.askTeamRoute({ method: 'POST' }, env, '', ana, { accept: id });
ok(mails.length === 0, 'M3 a second yes tells no one twice');
ok((await A.askTeamRoute({ method: 'POST' }, env, '', { id: 'eve', email: 'e@x' }, { accept: id })).error === 'not_found' && (await A.askTeamRoute({ method: 'POST' }, env, '', ana, { accept: asks[1].id })).error === 'no_offer', 'M4 only the asker can say yes, and only to an offer');
ok((await A.askTeamRoute({ method: 'GET' }, env, '', { id: 'eve' }, {})).asks.length === 0, 'M5 a reader sees only her own asks');

// ── the wiring ───────────────────────────────────────────────────────────
ok(/case '\/asks':\s+return askTeamRoute\(request, env, origin, user, body\);/.test(w) && /which === 'asks' \? await asksDesk\(env, body\) : which === 'ask_reply' \? await askReplyDesk\(env, body, who\)/.test(w), 'W1 /asks is a signed-in route; the desk runs are wired with who answered');
ok(!/'asks'|'ask_reply'/.test(w.slice(w.indexOf('const DESK_ROLES = {'), w.indexOf('async function callerRole('))), 'W2 answering is the admin\'s');
ok(/msg\.reply_to \? \{ reply_to: msg\.reply_to \} : \{\}/.test(w), 'W3 sendEmail carries an optional reply-to');
ok(!/callClaude|callModel|claudeBatchSubmit/.test(block), 'W4 nothing here calls a model');
ok(/_askTeam\('insight','\$\{safeAttr\(id\)\}'\)">Ask the team<\/button>/.test(page) && /_askTeam\('search', document\.getElementById\('search-input'\)\.value\)">Ask the team<\/button>/.test(page), 'W5 Ask the team sits under every deployed insight and on every live read');
ok(/async function _askTeam\(kind, ref\)/.test(page) && /Yes, send me the scope/.test(page) && /api\('asks', \{ accept: id \}\)/.test(page), 'W6 the panel asks, lists, and says yes');
ok(/create table if not exists member_asks/.test(sql) && /enable row level security/.test(sql) && /check \(status in \('new','answered','offered','closed'\)\)/.test(sql), 'W7 the table, its states, RLS on');
ok(seams.registry['SEAM:ASK_TEAM'] && seams.registry['SEAM:ASK_TEAM@intelligence'] && !/—/.test(block), 'W8 registered; no em dash');

console.log(`proof_ask: ${pass} passed`);
