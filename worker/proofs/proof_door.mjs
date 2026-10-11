/**
 * proof_door.mjs  --  EX34 THE DOOR: SEAM:ACCESS_KNOCK.
 * A reader at the door is heard once, the house opens it from the desk, the reader is welcomed, the watch counts who waits.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the door on fakes ─────────────────────────────────────────────────────────────────────────────────────────────
const doorSrc = between(w, '/* SEAM:ACCESS_KNOCK: the door.', 'const DESK_ROLES = {');
const ACCESS = { KEY: 'knock:', TTL: 30 * 86400, WAIT_H: 24, MAX_PENDING: 50, ACTIONS: ['approve', 'hold', 'revoke'] };
let users = {}, calls = [], mails = [], events = [];
const sb = async (env, path, opts) => {
  calls.push({ path, method: (opts && opts.method) || 'GET', body: opts && opts.body });
  const m = path.match(/^app_user\?id=eq\.([^&]+)/), e = path.match(/^app_user\?email=eq\.([^&]+)/);
  if (path === 'app_user' && opts && opts.method === 'POST') { if (!users[opts.body.id]) users[opts.body.id] = Object.assign({ id: opts.body.id }, opts.body); return null; }
  if (m && opts && opts.method === 'PATCH') { const u = users[m[1]]; if (!u) return []; if (opts.body.status === 'revoked' && env.noRevoked) throw new Error('sb_400'); Object.assign(u, opts.body); return [u]; }
  if (m) return users[m[1]] ? [users[m[1]]] : [];
  if (e) { const em = decodeURIComponent(e[1]); return Object.values(users).filter(u => u.email === em); }
  if (/^app_user\?status=eq\.pending/.test(path)) return Object.values(users).filter(u => (u.status || 'pending') === 'pending');
  return [];
};
const kv = {}; const KV = { get: async k => kv[k] == null ? null : kv[k], put: async (k, v) => { kv[k] = v; } };
const D = new Function('authenticate', 'json', 'sbRest', 'excQuiet', 'watchRecipients', 'sendEmail', 'esc', 'logEvent', 'ACCESS',
  doorSrc + '; return { accessKnock, accessDesk, accessKnocks, accessKnockHtml, accessWelcomeHtml };')(
  async r => { const a = r.headers.get('Authorization') || ''; return a === 'Bearer new' ? { id: 'u-new', email: 'ana@brand.test' } : a === 'Bearer in' ? { id: 'u-in', email: 'in@brand.test' } : null; },
  (o, st) => Object.assign({ _st: st || 200 }, o), sb, () => () => null, async () => ['owner@house.test'], async (env, m) => { mails.push(m); return { ok: true }; },
  s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), (env, p, s, e, sid, meta) => { events.push({ e, meta }); return Promise.resolve(); }, ACCESS);
const req = (auth, body) => new Request('https://x/access/knock', { method: 'POST', headers: { Authorization: 'Bearer ' + auth }, body: JSON.stringify(body || {}) });
const env = { RATE_LIMIT: KV, APP_URL: 'https://unsurfaced-intelligence.com' };

let r = await D.accessKnock(req('nobody', {}), env, '');
ok(r._st === 401 && mails.length === 0, 'A1 a knock without a session is refused and tells no one');
r = await D.accessKnock(req('new', { name: 'Ana Reyes', company: 'Brand Co', title: 'Brand manager' }), env, '');
ok(r.ok && r.status === 'pending' && r.first === true && r.told === true && mails.length === 1 && /At the door: Ana Reyes, Brand Co/.test(mails[0].subject) && /Someone is at the door/.test(mails[0].html) && /"run":"access","email":"ana@brand.test","action":"approve"/.test(mails[0].html) && /Ana Reyes · Brand manager · Brand Co/.test(mails[0].html),
  'A2 the first knock with no row makes the row, tells the house once with who they are and the desk line to open the door');
ok(users['u-new'] && users['u-new'].status === 'pending' && users['u-new'].name === 'Ana Reyes' && users['u-new'].company === 'Brand Co' && users['u-new'].knocked_at, 'A3 the knock is kept on app_user: pending, named, timed');
r = await D.accessKnock(req('new', { name: 'Ana Reyes' }), env, '');
ok(r.ok && r.first === false && r.told === false && mails.length === 1, 'A4 a second knock is heard but the house is not told again');
users['u-in'] = { id: 'u-in', email: 'in@brand.test', status: 'approved' };
r = await D.accessKnock(req('in', {}), env, '');
ok(r.ok && r.status === 'approved' && mails.length === 1, 'A5 an approved reader who knocks is simply told the door is open');
ok(!/[—]|&mdash;/.test(D.accessKnockHtml({ email: 'x@y.z' }, { name: 'Q', company: '', title: '' }) + D.accessWelcomeHtml(env, { name: 'Ana Reyes', email: 'ana@brand.test' })), 'A6 the house\'s mail carries no em dash');
ok(/Sam\./.test(D.accessWelcomeHtml(env, { name: 'Sam Oduya' })) && /https:\/\/unsurfaced-intelligence\.com\/intelligence\//.test(D.accessWelcomeHtml(env, { name: 'Sam Oduya' })) && /set your frame/i.test(D.accessWelcomeHtml(env, {})), 'A7 the welcome names them, links the platform, and asks for the frame first');

// ── B: the desk opens the door ───────────────────────────────────────────────────────────────────────────────────────
let d = await D.accessDesk(env, {});
ok(d.ok === false && d.error === 'missing_email', 'B1 the desk needs an email');
d = await D.accessDesk(env, { email: 'nobody@brand.test' });
ok(d.ok === false && d.error === 'no_such_user' && mails.length === 1, 'B2 an email that never signed up opens nothing and mails no one');
d = await D.accessDesk(env, { email: 'Ana@Brand.test' });
ok(d.ok && d.was === 'pending' && d.now === 'approved' && d.welcomed === true && users['u-new'].status === 'approved' && users['u-new'].approved_at && mails.length === 2 && mails[1].to === 'ana@brand.test' && /The door is open, Ana\./.test(mails[1].html) && events.some(x => x.e === 'access_approve'),
  'B3 approve (the default action, any case of email) flips the status is_approved() reads, stamps the time, welcomes once, logs');
d = await D.accessDesk(env, { email: 'ana@brand.test', action: 'approve' });
ok(d.ok && d.was === 'approved' && d.welcomed === false && mails.length === 2, 'B4 approving twice welcomes once');
d = await D.accessDesk(env, { email: 'ana@brand.test', action: 'hold' });
ok(d.ok && d.now === 'pending' && users['u-new'].status === 'pending', 'B5 hold puts the account back at the door');
d = await D.accessDesk(Object.assign({ noRevoked: true }, env), { email: 'ana@brand.test', action: 'revoke' });
ok(d.ok && d.now === 'pending' && /does not take revoked/.test(d.note), 'B6 revoke on a table without that status falls back to pending and says so');
d = await D.accessDesk(env, { email: 'ana@brand.test', action: 'revoke' });
ok(d.ok && d.now === 'revoked' && users['u-new'].status === 'revoked', 'B7 revoke on a table that takes it revokes');
users['u-new'].status = 'pending';
const k = await D.accessKnocks(env);
ok(k.pending === 1 && k.people[0].email === 'ana@brand.test' && k.people[0].company === 'Brand Co' && k.people[0].knocked === true, 'B8 knocks lists who waits, with who they said they are');

// ── C: the watch counts the door ─────────────────────────────────────────────────────────────────────────────────────
const health = between(w, 'const WATCH = {', 'async function watchRecipients(');
ok(/^const ACCESS = \{ KEY: 'knock:', TTL: 30 \* 86400, WAIT_H: 24, MAX_PENDING: 50, ACTIONS: \['approve', 'hold', 'revoke'\] \};/m.test(health), 'C1 ACCESS stands beside WATCH, inside the watch\'s slice');
const now = Date.now(), iso = ms => new Date(ms).toISOString();
let pend = [];
const sbw = async (env, path) => { if (/^app_user\?status=eq\.pending&knocked_at=not\.is\.null/.test(path)) return pend; if (/^claude_jobs\?/.test(path)) return []; if (/event=eq\.door_pass/.test(path)) return [{ created_at: iso(now - 2 * 36e5), meta: { earned: 2, queued: 2, failed: 0 } }]; return []; };
const kv2 = { 'backup:last': JSON.stringify({ at: iso(now - 36e5) }) }; const KV2 = { get: async k => kv2[k] == null ? null : kv2[k], put: async (k, v) => { kv2[k] = v; } };
const H = new Function('sbRest', 'excQuiet', 'CLAUDE', 'claudeSpent', 'claudeCap', 'CONFIG', 'evolutionMode', health + '; return watchHealth;')(
  sbw, () => () => null, { TIERS: { live: {}, doc: {} } }, async () => 0, () => 50, { PPLX_DAILY_DOLLARS: 1.5 }, () => false);
let line = await H({ RATE_LIMIT: KV2 });
ok(line.door && line.door.pending === 0 && !line.trips.some(t => t.kind === 'access_waiting'), 'C2 no one at the door: the line says so and trips nothing');
pend = [{ email: 'a@x.test', knocked_at: iso(now - 3 * 36e5) }];
line = await H({ RATE_LIMIT: KV2 });
ok(line.door.pending === 1 && line.door.oldest_h === 3 && !line.trips.some(t => t.kind === 'access_waiting'), 'C3 a knock three hours old waits without tripping');
pend = [{ email: 'a@x.test', knocked_at: iso(now - 3 * 36e5) }, { email: 'b@x.test', knocked_at: iso(now - 30 * 36e5) }];
line = await H({ RATE_LIMIT: KV2 });
const trip = line.trips.find(t => t.kind === 'access_waiting');
ok(line.door.pending === 2 && line.door.oldest_h === 30 && trip && /2 people have waited at the door, the longest for 30 hours/.test(trip.say), 'C4 a knock past a day trips, naming how many wait and how long the longest has');

// ── D: the wiring ────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/if \(path === '\/access\/knock' && request\.method === 'POST'\) return accessKnock\(request, env, origin\);/.test(w) && w.indexOf("path === '/access/knock'") < w.indexOf('// Everything below requires a signed-in user'), 'D1 the knock route stands before the signed-in block and authenticates itself');
ok(/which === 'access' \? await accessDesk\(env, body\) : which === 'knocks' \? await accessKnocks\(env\) :/.test(w) && !/'access'|'knocks'/.test(between(w, 'const DESK_ROLES = {', 'async function callerRole(')), 'D2 the desk runs access and knocks; neither is an editor\'s run');
ok(fs.existsSync('supabase/migrations/0044_door.sql') && /add column if not exists knocked_at/.test(fs.readFileSync('supabase/migrations/0044_door.sql', 'utf-8')) && /add column if not exists created_at/.test(fs.readFileSync('supabase/migrations/0044_door.sql', 'utf-8')), 'D3 migration 0044 adds the knock to app_user, idempotent');

// ── E: the page ──────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/_accessKnock\(\);   \/\/ SEAM:ACCESS_KNOCK \(EX34\)/.test(page) && /async function _accessKnock\(\) \{/.test(page) && /api\('access\/knock', \{ name: \[u\.firstName, u\.lastName\]\.filter\(Boolean\)\.join\(' '\)\.trim\(\), company: u\.company \|\| '', title: u\.role \|\| '' \}\)/.test(page) && /window\._accessKnocked = true/.test(page),
  'E1 the waiting room knocks once per load with the sign-up\'s name, company and title');
ok(/setInterval\(async function \(\) \{[\s\S]{0,400}_sb\.rpc\('is_approved'\)[\s\S]{0,300}_enterPlatform\(\); showToast\('The door is open\. Welcome in\.'\);[\s\S]{0,40}\}, 45000\);/.test(page) && /if \(window\._accessPoll\) \{ clearInterval\(window\._accessPoll\); window\._accessPoll = null; \}\n  goHub\(\);/.test(page),
  'E2 the page asks the database every 45 seconds while the pending panel is up and enters on yes; the entry stops the asking');
ok(/the house has been told\. A person opens the door, not a rule; you'll get an email when it opens, and this page lets you in on its own\./.test(page) && !/you'll be let in shortly/.test(page), 'E3 the waiting room says what happens');
ok(/async function _accessFirstRun\(\) \{/.test(page) && /localStorage\.getItem\('uai_frame_set'\) === '1'/.test(page) && /window\._profileFirstRun = true; _profileOpen\(\);/.test(page) && /\$\{window\._profileFirstRun \? 'SET YOUR FRAME' : 'YOUR PROFILE'\}/.test(page) && /class="pm-lead"/.test(page) && /localStorage\.setItem\('uai_frame_set', '1'\)/.test(page) && /window\._profileFirstRun = false; \}$/m.test(page),
  'E4 the first entry opens the profile as the frame, once per browser, and a reader with a frame is never asked');

console.log('proof_door: ' + pass + ' checks passed');
