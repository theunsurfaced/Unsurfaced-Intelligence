/**
 * proof_plans.mjs  --  EX46 THE PLANS (SEAM:PLANS): groups, seats, plans and the credit meter.
 * The database is faked: credit_spend and credit_refund are modeled in JS with the same rules as 0048 (the pool or the seat, the
 * month, the refusal, a refund once), so the worker's side is proven on every branch. The SQL itself is checked for the lock, the
 * sums and the grants.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const sql = fs.readFileSync('supabase/migrations/0048_plans.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* ═══ SEAM:PLANS (EX46)'), w.indexOf("const ACCESS = { KEY: 'knock:'"));

// ── the fake house ───────────────────────────────────────────────────────
let db, events, admins, kvm, approved;
const reset = () => { db = { groups: [], seats: [], ledger: [], users: [] }; events = []; admins = new Set(['admin']); kvm = new Map(); approved = []; };
const period = () => { const t = new Date(); return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1)).toISOString().slice(0, 10); };
const used = (g, uid) => db.ledger.filter(r => r.group_id === g.id && r.period === period() && (g.credit_mode === 'pool' || r.user_id === uid)).reduce((a, r) => a + r.credits, 0);
let down = false;
const q = (path, k) => { const m = new RegExp(k + '=eq\\.([^&]+)').exec(path); return m ? decodeURIComponent(m[1]) : null; };
const sbRest = async (env, path, opts = {}) => {
  if (down) throw new Error('sb_network');
  const method = opts.method || 'GET', b = opts.body;
  if (path === 'rpc/credit_spend') {
    const s = db.seats.find(x => x.user_id === b.p_user); if (!s) return { ok: false, error: 'no_group' };
    const g = db.groups.find(x => x.id === s.group_id);
    if (g.status !== 'active' || g.plan === 'member') return { ok: false, error: 'plan_required', plan: g.plan, status: g.status };
    const allow = g.credit_mode === 'pool' ? g.seats * g.seat_credits : g.seat_credits, u = used(g, b.p_user);
    if (b.p_credits > 0 && u + b.p_credits > allow) return { ok: false, error: 'credits_out', left: Math.max(allow - u, 0), allowance: allow, resets: 'next', mode: g.credit_mode, plan: g.plan };
    db.ledger.push({ group_id: g.id, user_id: b.p_user, period: period(), action: b.p_action, credits: b.p_credits, cost_usd: b.p_cost, ref: b.p_ref });
    return { ok: true, left: allow - u - b.p_credits, allowance: allow, resets: 'next', group: g.id, mode: g.credit_mode, plan: g.plan };
  }
  if (path === 'rpc/credit_refund') {
    const r = db.ledger.find(x => x.ref === b.p_ref && x.credits > 0 && !x.action.startsWith('refund:')); if (!r) return { ok: false, error: 'no_charge' };
    if (db.ledger.some(x => x.ref === b.p_ref && x.action.startsWith('refund:'))) return { ok: true, already: true };
    db.ledger.push(Object.assign({}, r, { action: 'refund:' + r.action, credits: -r.credits, cost_usd: null })); return { ok: true, credits: r.credits };
  }
  const table = path.split('?')[0];
  if (table === 'app_user') { const e = q(path, 'email'); return db.users.filter(u => u.email === e); }
  if (table === 'group_seats') {
    if (method === 'POST') { if (db.seats.some(s => s.user_id === b.user_id)) throw new Error('sb_409'); db.seats.push(Object.assign({}, b)); return null; }
    if (method === 'DELETE') { const u = q(path, 'user_id'); db.seats = db.seats.filter(s => s.user_id !== u); return null; }
    let rows = db.seats; const u = q(path, 'user_id'), gid = q(path, 'group_id'), role = q(path, 'role');
    if (u) rows = rows.filter(s => s.user_id === u); if (gid) rows = rows.filter(s => s.group_id === gid); if (role) rows = rows.filter(s => s.role === role);
    return rows.map(s => Object.assign({}, s));
  }
  if (table === 'member_groups') {
    if (method === 'POST') { const g = Object.assign({ id: 'g' + (db.groups.length + 1), status: 'active', billing: 'desk' }, b); db.groups.push(g); return [Object.assign({}, g)]; }
    if (method === 'PATCH') { const g = db.groups.find(x => x.id === q(path, 'id')); Object.assign(g, b); return [Object.assign({}, g)]; }
    if (method === 'DELETE') { db.groups = db.groups.filter(x => x.id !== q(path, 'id')); return null; }
    const id = q(path, 'id'); return db.groups.filter(g => !id || g.id === id).map(g => Object.assign({}, g));
  }
  if (table === 'credit_ledger') {
    if (method === 'POST') { db.ledger.push(Object.assign({}, b)); return null; }
    const gid = q(path, 'group_id'), per = q(path, 'period'); return db.ledger.filter(r => (!gid || r.group_id === gid) && (!per || r.period === per));
  }
  if (table === 'activity_events') return events.filter(e => e.event === q(path, 'event')).map(e => ({ meta: e.meta }));
  return [];
};
const kv = { get: async k => kvm.has(k) ? kvm.get(k) : null, put: async (k, v) => { kvm.set(k, v); }, delete: async k => { kvm.delete(k); } };
const env = { RATE_LIMIT: kv };
const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } });
const P = new Function('sbRest', 'callerIsAdmin', 'logEvent', 'json', 'excQuiet', 'accessDesk', 'crypto',
  block + '; return { PLANS, renderUsd, renderCredits, planPeriod, planNext, meterCharge, meterRefusal, meterRefund, meterSettle, meterRun, planState, planRoute, planDesk, seatDesk, creditsDesk, plansDesk };')(
  sbRest, async (e, u) => admins.has(u), (e, p, s, event, x, meta) => { events.push({ event, meta }); return Promise.resolve(); }, json,
  (k, v) => () => v, async (e, b) => { approved.push(b.email); const u = db.users.find(x => x.email === b.email); if (u) u.status = 'approved'; return { ok: true, welcomed: true }; }, globalThis.crypto);

// ── the prices ───────────────────────────────────────────────────────────
ok(P.renderCredits('fal-ai/kling-video/v3/standard/image-to-video', 'video', 5) === 14 && P.renderCredits('fal-ai/kling-video/v3/standard/text-to-video', 'video', 10) === 28, 'C1 Kling at $0.14 a second: 5 seconds is 14 credits, 10 is 28');
ok(P.renderCredits('bytedance/seedance-2.0/fast/image-to-video', 'video', 5) === 12 && P.renderCredits('bytedance/seedance-2.0/fast/reference-to-video', 'video', 4) === 10, 'C2 Seedance fast at $0.12 a second, the fast reference path priced as fast (longest prefix wins)');
ok(P.renderCredits('bytedance/seedance-2.0/reference-to-video', 'video', 5) === 15, 'C3 Seedance standard reference at $0.15 a second');
ok(P.renderCredits('fal-ai/flux/schnell', 'image', 2) === 1 && P.renderCredits('fal-ai/flux-pro/v1.1', 'image', 6) === 1 && P.renderCredits('fal-ai/flux-2-pro/edit', 'image', 6) === 2, 'C4 a still is 1 or 2 credits: Flux costs a cent or less (the bill, Oct 13)');
ok(P.renderCredits('fal-ai/ffmpeg-api/merge-videos', 'video', 1) === 0 && P.renderCredits('someone/new-video-model', 'video', 5) === 15 && P.renderCredits('someone/new-image', 'image', 6) === 2, 'C5 the stitch is free; an unlisted model is charged as the dearest of its kind');
ok(P.PLANS.COST['excavate.full'] === 12 && P.PLANS.COST['excavate.quick'] === 7 && P.PLANS.SEAT_CREDITS === 400 && P.PLANS.CREDIT_USD === 0.05, 'C6 the plan\'s numbers: 12 a full read, 7 a quick one, 400 a seat, a credit is five cents');

// ── the desk sets a plan ────────────────────────────────────────────────
reset();
db.users.push({ id: 'ana', email: 'ana@brand.test', status: 'approved', role: null, company: 'Brand Co' }, { id: 'ben', email: 'ben@brand.test', status: 'pending', role: null },
  { id: 'cy', email: 'cy@brand.test', status: 'pending', role: null }, { id: 'dee', email: 'dee@other.test', status: 'approved', role: null }, { id: 'fresh', email: 'fresh@x.test', status: 'approved', role: null });
let d = await P.planDesk(env, { email: 'ana@brand.test' });
ok(!d.ok && d.error === 'missing_plan', 'D1 a new group needs a paid plan');
d = await P.planDesk(env, { email: 'ana@brand.test', plan: 'engine', seats: 2, mode: 'pool' });
ok(d.ok && d.made && d.plan === 'engine' && d.group.name === 'Brand Co' && d.group.seats === 2 && d.allowance === 800 && d.left === 800 && d.role === 'owner', 'D2 {run:"plan"} makes the group, owned by Ana, 2 seats pooled: 800 credits');
ok((await P.planDesk(env, { email: 'ana@brand.test', plan: 'gold' })).error === 'bad_plan' && (await P.planDesk(env, { email: 'ana@brand.test', mode: 'shared' })).error === 'bad_mode' && (await P.planDesk(env, { email: 'nobody@x.test', plan: 'engine' })).error === 'no_such_user', 'D3 a plan, a mode and an email are checked');

// ── seats: a paid seat is the approval ───────────────────────────────────
d = await P.seatDesk(env, { email: 'ben@brand.test', owner: 'ana@brand.test' });
ok(d.ok && d.held === 2 && d.approved === true && approved.includes('ben@brand.test') && db.users.find(u => u.id === 'ben').status === 'approved', 'S1 Ben takes the second seat and is let in without a knock (the welcome goes out)');
d = await P.seatDesk(env, { email: 'cy@brand.test', owner: 'ana@brand.test' });
ok(!d.ok && d.error === 'no_free_seat' && /seats:3/.test(d.say) && !approved.includes('cy@brand.test'), 'S2 a third teammate is refused until a seat is added, and is not let in');
ok((await P.planDesk(env, { email: 'ana@brand.test', seats: 1 })).error === 'seats_below_held', 'S3 seats cannot go under the seats held');
await P.planDesk(env, { email: 'dee@other.test', plan: 'partner', seats: 5 });
ok((await P.seatDesk(env, { email: 'dee@other.test', owner: 'ana@brand.test' })).error === 'seat_elsewhere' && (await P.planDesk(env, { email: 'ben@brand.test', plan: 'retainer' })).error === 'seat_in_group', 'S4 one group a person; a teammate cannot set the plan');

// ── the pool ─────────────────────────────────────────────────────────────
let m = await P.meterCharge(env, 'ana', 'excavate.full', 12, null);
ok(m.ok && m.ref && m.credits === 12 && m.left === 788 && db.ledger.length === 1 && db.ledger[0].cost_usd === 0.6, 'M1 a full read charges 12 credits from the pool and writes the ledger at $0.60');
await P.meterCharge(env, 'ben', 'excavate.quick', 7, null);
ok((await P.planState(env, 'ana')).used === 19 && (await P.planState(env, 'ben')).left === 781, 'M2 the pool is the team\'s: Ben\'s quick read comes out of the same 800');
db.ledger.push({ group_id: 'g1', user_id: 'ana', period: period(), action: 'play.render', credits: 775, ref: 'fill' });
m = await P.meterCharge(env, 'ben', 'excavate.full', 12, null);
ok(!m.ok && m.error === 'credits_out' && m.left === 6 && P.meterRefusal(m).say.startsWith('6 credits left this month and this needs 12'), 'M3 an empty pool refuses with a plain line: what is left, what it needs, when it resets');
d = await P.creditsDesk(env, { email: 'ana@brand.test', grant: 100, note: 'launch week' });
ok(d.ok && d.granted === 100 && d.left === 106 && (await P.meterCharge(env, 'ben', 'excavate.full', 12, null)).ok, 'M4 a desk grant puts 100 credits back in the pool and Ben reads again');
d = await P.creditsDesk(env, { email: 'ben@brand.test' });
ok(d.by_action['excavate.full'] === 24 && d.by_action.grant === -100, 'M5 {run:"credits"} shows the month by action');

// ── per seat ─────────────────────────────────────────────────────────────
await P.planDesk(env, { email: 'dee@other.test', mode: 'seat', credits: 50 });
db.users.push({ id: 'eve', email: 'eve@other.test', status: 'approved', role: null }); await P.seatDesk(env, { email: 'eve@other.test', owner: 'dee@other.test' });
for (let i = 0; i < 4; i++) await P.meterCharge(env, 'dee', 'excavate.full', 12, null);
const dOut = await P.meterCharge(env, 'dee', 'excavate.full', 12, null), eIn = await P.meterCharge(env, 'eve', 'excavate.full', 12, null);
ok(!dOut.ok && dOut.left === 2 && dOut.mode === 'seat' && eIn.ok && eIn.left === 38, 'M6 per seat: Dee runs out at 48 of 50 and Eve\'s 50 are untouched');

// ── refunds ──────────────────────────────────────────────────────────────
reset(); db.users.push({ id: 'ana', email: 'ana@brand.test', status: 'approved' }); await P.planDesk(env, { email: 'ana@brand.test', plan: 'engine' });
m = await P.meterCharge(env, 'ana', 'play.render', 14, { usd: 0.7 });
await P.meterRefund(env, m); await P.meterRefund(env, m);
ok((await P.planState(env, 'ana')).used === 0 && db.ledger.filter(r => r.action === 'refund:play.render').length === 1 && db.ledger[0].cost_usd === 0.7, 'R1 a refused render gives its 14 credits back once, however often it is asked; the real price is kept');
let calls = 0;
let res = await P.meterRun(env, '', { id: 'ana' }, 'play.words', async () => { calls++; return json({ ok: false, error: 'model_down' }, 200); });
ok(calls === 1 && (await P.planState(env, 'ana')).used === 0, 'R2 a PLAY run that fails (ok:false) is refunded');
res = await P.meterRun(env, '', { id: 'ana' }, 'play.words', async () => json({ ok: true, data: {} }, 200));
ok((await res.json()).ok && (await P.planState(env, 'ana')).used === 1, 'R3 a PLAY run that lands keeps its credit, and the page still reads the answer');
const h = { charge: await P.meterCharge(env, 'ana', 'excavate.full', 12, null) };
ok((await P.meterSettle(env, h, { ok: false, error: 'stream_failed' })).refunded && (await P.meterSettle(env, { charge: { ref: null } }, { ok: false })).settled === false, 'R4 a streamed read that did not land is refunded; a free action has nothing to settle');

// ── Members: watched, then walled ────────────────────────────────────────
reset();
m = await P.meterCharge(env, 'stranger', 'excavate.full', 12, null);
ok(m.ok && m.watch && events.some(e => e.event === 'meter_watch' && e.meta.credits === 12 && e.meta.usd === 0.6) && db.ledger.length === 0, 'W1 a Member is watched, not stopped, while the wall is off (meter_watch: 12 credits, $0.60)');
ok((await P.meterCharge(env, 'admin', 'excavate.full', 12, null)).house && !events.some(e => e.meta && e.meta.user === 'admin'), 'W2 an admin outside a group is the house: not charged, not watched');
d = await P.plansDesk(env, { enforce: true });
m = await P.meterCharge(env, 'stranger', 'play.words', 1, null);
ok(d.enforce && !m.ok && m.error === 'plan_required' && /come with Engine/.test(P.meterRefusal(m).say), 'W3 {run:"plans", enforce:true} turns the wall on: a Member is told what Engine adds');
res = await P.meterRun(env, '', { id: 'stranger' }, 'ask', async () => { throw new Error('must not run'); });
ok(res.status === 402 && (await res.json()).error === 'plan_required', 'W4 a walled action never reaches the model');
ok(!(await P.plansDesk(env, { enforce: false })).enforce && (await P.meterCharge(env, 'stranger', 'ask', 1, null)).ok, 'W5 and the switch turns it off again');
d = await P.plansDesk(env, {});
ok(d.members_watched.readers === 1 && d.members_watched.credits === 13, 'W6 {run:"plans"} says what Members would have spent this month');
down = true; m = await P.meterCharge(env, 'stranger', 'excavate.full', 12, null); down = false;
ok(m.ok && m.down, 'W7 the meter down never stops a reader (the house caps stand behind it)');
db.users.push({ id: 'ana', email: 'ana@brand.test', status: 'approved' }); await P.planDesk(env, { email: 'ana@brand.test', plan: 'engine' }); await P.planDesk(env, { email: 'ana@brand.test', status: 'paused' });
m = await P.meterCharge(env, 'ana', 'ask', 1, null);
ok(!m.ok && /paused/.test(P.meterRefusal(m).say), 'W8 a paused group is told so');

// ── the wiring ───────────────────────────────────────────────────────────
ok(/case '\/play\/generate':\s+return meterRun\(env, origin, user, 'play\.words'/.test(w) && /case '\/play\/generate-image': return meterRun\(env, origin, user, 'play\.still'/.test(w) && /case '\/ask':\s+return meterRun\(env, origin, user, 'ask'/.test(w), 'X1 PLAY runs, stills and the record\'s answers go through the meter');
const syn = w.slice(w.indexOf('async function synthesize('), w.indexOf('async function synthesize(') + 6000);
ok(syn.indexOf("if (body.cache_only) return reply") < syn.indexOf('meterCharge(env, body._m.uid') && syn.indexOf('const hit = await env.RATE_LIMIT.get(excCacheKey(qhash))') < syn.indexOf('meterCharge('), 'X2 a read is charged after the cache answers, so a cached read costs nothing');
ok(/quick \? 'excavate\.quick' : 'excavate\.full'/.test(syn) && /!body\.bench/.test(syn.slice(syn.indexOf('meterCharge(') - 200, syn.indexOf('meterCharge('))), 'X3 quick and full are priced apart; the bench is never charged');
ok(/_m: \{ uid: user && user\.id \|\| null \}/.test(w) && /if \(!b2\.stream\) await meterSettle\(env, b2\._m, res\)/.test(w) && /if \(body && body\._m && body\._m\.charge\) await meterSettle\(env, body\._m, \{ ok: outcome === 'ok' \|\| outcome === 'partial' \}\)/.test(w), 'X4 the plain read and the stream both refund a read that did not land');
const pr = w.slice(w.indexOf('async function playRender('), w.indexOf('async function playRenderStatus('));
ok(pr.indexOf('meterCharge(env, user.id, \'play.render\', renderCredits(model, pool.kind, seconds)') > pr.indexOf('const model =') && pr.indexOf('meterCharge(') < pr.indexOf("fetch('https://queue.fal.run/'") && pr.indexOf('meterCharge(') < pr.indexOf('renderBudget('), 'X5 a render is priced on the model it will really call, charged before fal and before the seconds are counted');
ok(/if \(!\(await renderBudget\(env, user\.id, seconds\)\)\) \{ await meterRefund\(env, meter\);/.test(pr) && /if \(!r\.ok \|\| !j \|\| !j\.request_id\) await meterRefund\(env, meter\);/.test(pr) && /meter: meter\.ref \|\| null/.test(pr), 'X6 a render the seconds budget or fal refuses is refunded; the charge rides the render record');
const st = w.slice(w.indexOf('async function playRenderStatus('), w.indexOf('async function playUploadRef('));
ok(/if \(failed && rec\.meter\) await meterRefund/.test(st) && /if \(!url\) \{ if \(rec\.meter\) await meterRefund/.test(st), 'X7 a render that fails later is refunded when the page polls it');
ok(/which === 'plan' \? await planDesk\(env, body\) : which === 'seat' \? await seatDesk\(env, body\) : which === 'credits' \? await creditsDesk\(env, body\) : which === 'plans' \? await plansDesk\(env, body\)/.test(w) && !/'plan'|'seat'|'credits'|'plans'/.test(w.slice(w.indexOf('const DESK_ROLES = {'), w.indexOf('async function callerRole('))), 'X8 the desk runs are the admin\'s, never an editor\'s');
ok(/case '\/plan':\s+return planRoute\(env, origin, user\);/.test(w), 'X9 GET /plan gives a signed-in reader their plan and balance');
ok(!/mine/i.test(Object.keys(P.PLANS.COST).join(' ')) && !/meterRun\(env, origin, user, '[a-z.]+', \(\) => mine/.test(w), 'X10 MINE costs nothing');
ok(!/—/.test(block), 'X11 no em dash in the meter\'s words');

// ── the database ─────────────────────────────────────────────────────────
ok(/from member_groups where id = s\.group_id for update/.test(sql) && /allow := g\.seats \* g\.seat_credits/.test(sql) && /and user_id = p_user/.test(sql), 'Q1 credit_spend locks the group, sums the pool or the seat, then writes');
ok(/if p_credits > 0 and used \+ p_credits > allow then/.test(sql) && /'credits_out'/.test(sql) && /'no_group'/.test(sql) && /'plan_required'/.test(sql), 'Q2 it refuses past the allowance, and answers no_group and plan_required');
ok(/credit_ledger_refund_once on credit_ledger \(ref\) where action like 'refund:%'/.test(sql) && /exception when unique_violation/.test(sql), 'Q3 a refund is written once (a unique index and the function both hold it)');
ok((sql.match(/enable row level security/g) || []).length === 3 && /revoke all on function credit_spend/.test(sql) && /grant execute on function credit_spend\(uuid, text, int, text, numeric\) to service_role/.test(sql), 'Q4 RLS on all three; only the service role may spend or refund');
ok(/create table if not exists member_groups/.test(sql) && /create or replace function credit_refund/.test(sql), 'Q5 the migration can run twice');

// ── the registry ─────────────────────────────────────────────────────────
ok(seams.registry['SEAM:PLANS'] && seams.registry['SEAM:PLANS'].file === 'worker/src/index.js', 'G1 SEAM:PLANS is registered');
ok(/'playRender': 'the meter \(SEAM:PLANS/.test(gate), 'G2 the spender registry names the meter on renders');

console.log(`proof_plans: ${pass} passed`);
