/**
 * proof_checkout.mjs  --  EX49 THE CHECKOUT AND THE INVITES (SEAM:CHECKOUT). Stripe and the database are faked; every price, every
 * webhook, the seat line, the invite's whole life and the selling switch are proven on the real code.
 */
import fs from 'fs';
import { createHash, webcrypto } from 'crypto';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const sql = fs.readFileSync('supabase/migrations/0050_checkout.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('/* ═══ SEAM:CHECKOUT (EX49)'), w.indexOf("const ACCESS = { KEY: 'knock:'"));

// ── the fake house ───────────────────────────────────────────────────────
let db, mails, events, stripe, kvm, approved, gid, failLedger = false;
const reset = () => {
  db = { users: [{ id: 'ana', email: 'ana@brand.test', status: 'approved', company: 'Brand Co' }, { id: 'ben', email: 'ben@brand.test', status: 'pending' }, { id: 'cy', email: 'cy@brand.test', status: 'approved' }, { id: 'pat', email: 'pat@big.test', status: 'pending', company: 'Big Co' }],
    groups: [], seats: [], invites: [], ledger: [] };
  mails = []; events = []; stripe = []; kvm = new Map(); approved = []; gid = 0;
};
const q = (path, k) => { const m = new RegExp('(?:^|[?&])' + k.replace(/[>-]/g, c => '\\' + c) + '=(eq|gt|is)\\.([^&]+)').exec(path); return m ? decodeURIComponent(m[2]) : null; };
const sbRest = async (env, path, opts = {}) => {
  const t = path.split('?')[0], method = opts.method || 'GET', b = opts.body;
  if (path === 'rpc/seat_take') {
    const g = db.groups.find(x => x.id === b.p_group);
    if (!g || g.plan === 'member' || g.status !== 'active') return { ok: false, error: 'plan_required' };
    if (db.seats.some(x => x.user_id === b.p_user)) return { ok: false, error: 'seat_elsewhere' };
    if (db.seats.filter(x => x.group_id === g.id).length >= g.seats) return { ok: false, error: 'no_free_seat' };
    const inv = db.invites.find(i => i.id === b.p_invite && i.group_id === g.id && !i.accepted_at && !i.revoked_at && i.expires_at > new Date().toISOString());
    if (!inv) return { ok: false, error: 'invite_closed' };
    inv.accepted_at = new Date().toISOString(); inv.accepted_by = b.p_user; db.seats.push({ group_id: g.id, user_id: b.p_user, role: 'member' }); return { ok: true };
  }
  if (t === 'app_user') {
    if (method === 'PATCH') { const u = db.users.find(x => x.id === q(path, 'id')); Object.assign(u, b); return null; }
    if (method === 'POST') { const u = db.users.find(x => x.id === b.id); if (u) Object.assign(u, b); else db.users.push(Object.assign({}, b)); return null; }
    if (/id=in\./.test(path)) { const ids = /id=in\.\(([^)]*)\)/.exec(path)[1].split(','); return db.users.filter(u => ids.includes(u.id)); }
    const id = q(path, 'id'), e = q(path, 'email'); return db.users.filter(u => (!id || u.id === id) && (!e || u.email === e));
  }
  if (t === 'member_groups') {
    if (method === 'POST') { const g = Object.assign({ id: 'g' + (++gid), status: 'active', billing: 'desk', meta: {} }, b); db.groups.push(g); return [Object.assign({}, g)]; }
    if (method === 'PATCH') { const g = db.groups.find(x => x.id === q(path, 'id')); Object.assign(g, b); return [Object.assign({}, g)]; }
    if (method === 'DELETE') { db.groups = db.groups.filter(x => x.id !== q(path, 'id')); return null; }
    const sub = q(path, 'meta->stripe->>subscription'); if (sub) return db.groups.filter(g => g.meta && g.meta.stripe && g.meta.stripe.subscription === sub);
    return db.groups.filter(g => g.id === q(path, 'id')).map(g => JSON.parse(JSON.stringify(g)));
  }
  if (t === 'group_seats') {
    if (method === 'POST') { if (db.seats.some(s => s.user_id === b.user_id)) throw new Error('sb_409'); db.seats.push(Object.assign({}, b)); return null; }
    if (method === 'DELETE') { const u = q(path, 'user_id'); db.seats = db.seats.filter(s => s.user_id !== u); return null; }
    const u = q(path, 'user_id'), g = q(path, 'group_id'); return db.seats.filter(s => (!u || s.user_id === u) && (!g || s.group_id === g)).map(s => Object.assign({}, s));
  }
  if (t === 'group_invites') {
    if (method === 'POST') { const i = Object.assign({ id: '00000000-0000-0000-0000-0000000000' + String(db.invites.length + 10), created_at: new Date().toISOString(), accepted_at: null, revoked_at: null }, b); db.invites.push(i); return [Object.assign({}, i)]; }
    if (method === 'PATCH') { for (const i of db.invites.filter(i => i.id === q(path, 'id') && (!/group_id=/.test(path) || i.group_id === q(path, 'group_id')) && (!/accepted_at=is\.null/.test(path) || !i.accepted_at))) Object.assign(i, b); return null; }
    const h = q(path, 'token_hash'); if (h) return db.invites.filter(i => i.token_hash === h).map(i => Object.assign({}, i));
    const now = q(path, 'expires_at');
    return db.invites.filter(i => i.group_id === q(path, 'group_id') && !i.accepted_at && !i.revoked_at && (!now || i.expires_at > now)).map(i => Object.assign({}, i));
  }
  if (t === 'credit_ledger' && method === 'GET') return db.ledger.filter(r => r.ref === q(path, 'ref'));
  if (t === 'credit_ledger') { if (failLedger) throw new Error('sb_503'); if (db.ledger.some(r => r.ref === b.ref && r.action === 'topup')) throw new Error('sb_409'); db.ledger.push(Object.assign({}, b)); return null; }
  return [];
};
const stripeApi = async (env, path, method, params) => {
  stripe.push({ path, method, params });
  if (path === 'checkout/sessions') return { id: 'cs_' + stripe.length, url: 'https://checkout.stripe.test/' + stripe.length };
  if (path.startsWith('subscriptions/')) return { id: 'sub_1', items: { data: env._items || [] } };
  return { ok: true };
};
const PLANS = { MAX_SEATS: 500, SEAT_CREDITS: 400 };
const planSeatOf = async (env, uid) => db.seats.find(s => s.user_id === uid) || null;
const planUser = async (env, e) => db.users.find(u => u.email === String(e || '').toLowerCase()) || null;
const env = { STRIPE_SECRET_KEY: 'sk', APP_URL: 'https://unsurfaced-intelligence.com', RATE_LIMIT: { get: async k => kvm.get(k) || null, put: async (k, v) => { kvm.set(k, v); }, delete: async k => { kvm.delete(k); } } };
const json = (o, s) => Object.assign({ _status: s || 200 }, o);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sha256hex = async s => createHash('sha256').update(s).digest('hex');
const C = new Function('sbRest', 'json', 'excQuiet', 'PLANS', 'planSeatOf', 'planUser', 'planDesk', 'planPeriod', 'accessDesk', 'logEvent', 'watchRecipients', 'sendEmail', 'esc', 'stripeApi', 'sha256hex', 'crypto', 'accessWelcomeHtml',
  block + '; return { CHECKOUT, checkoutParams, plansSelling, planCheckoutDone, planSubscriptionChanged, planTopupDone, planSeatsSet, planBillingRoute, inviteCreate, inviteAccept, checkoutDesk, seatsDesk };')(
  sbRest, json, (k, v) => () => v, PLANS, planSeatOf, planUser, async (e, b) => ({ ok: true, desk: b }), () => '2026-10-01',
  async (e, b) => { approved.push(b.email); const u = db.users.find(x => x.email === b.email); if (!u) return { ok: false }; u.status = 'approved'; return { ok: true, welcomed: true }; },
  (e, p, s, event, x, meta) => { events.push({ event, meta }); return Promise.resolve(); }, async () => ['house@unsurfaced.test'],
  async (e, m) => { mails.push(m); return { ok: true }; }, esc, stripeApi, sha256hex, webcrypto, (e, r) => '<p>The door is open.</p>');
const user = id => ({ id, email: db.users.find(u => u.id === id).email });
const route = (path, uid, body) => C.planBillingRoute(path, {}, env, '', user(uid), body || {});
const site = 'https://unsurfaced-intelligence.com';

// ── the prices ───────────────────────────────────────────────────────────
let p = C.checkoutParams({ plan: 'engine', cycle: 'month', seats: 3, user: 'ana', email: 'ana@brand.test', site });
ok(p.mode === 'subscription' && p.line_items.length === 1 && p.line_items[0].quantity === 3 && p.line_items[0].price_data.unit_amount === 10000 && p.line_items[0].price_data.recurring.interval === 'month', 'P1 Engine monthly: one seat line, $100 a seat, quantity = seats');
p = C.checkoutParams({ plan: 'engine', cycle: 'year', seats: 2, user: 'ana', site });
ok(p.line_items[0].price_data.unit_amount === 100000 && p.line_items[0].price_data.recurring.interval === 'year' && p.metadata.cycle === 'year', 'P2 Engine yearly: $1,000 a seat a year');
p = C.checkoutParams({ plan: 'partner', seats: 7, user: 'pat', site, by: 'desk' });
ok(p.line_items.length === 2 && p.line_items[0].price_data.unit_amount === 1000000 && p.line_items[0].quantity === 1 && p.line_items[1].price_data.unit_amount === 150000 && p.line_items[1].quantity === 2 && p.metadata.cycle === 'year', 'P3 Partner, 7 seats: $10,000 a year with 5, plus 2 added seats at $1,500 ($13,000)');
ok(C.checkoutParams({ plan: 'partner', seats: 5, user: 'pat', site }).line_items.length === 1 && C.checkoutParams({ plan: 'partner', seats: 3, user: 'pat', site }).metadata.seats === '5', 'P4 Partner at 5 seats is the base alone, and is never sold under the 5 it includes');
p = C.checkoutParams({ plan: 'retainer', seats: 3, base_cents: 1200000, user: 'pat', site, by: 'desk' });
ok(p.line_items[0].price_data.unit_amount === 1200000 && p.line_items[1].price_data.unit_amount === 12500 && p.line_items[1].quantity === 2 && p.metadata.cycle === 'month', 'P5 Retainer: the desk\'s base with 1 seat, $125 a month for each added seat');
let threw = null; try { C.checkoutParams({ plan: 'retainer', seats: 1, user: 'pat', site }); } catch (e) { threw = e.message; }
ok(threw === 'retainer_base', 'P6 a Retainer is never sold without the base the desk names');
threw = null; try { C.checkoutParams({ plan: 'gold', seats: 1, site }); } catch (e) { threw = e.message; } ok(threw === 'bad_plan', 'P7 a plan nobody sells is refused');
ok(p.subscription_data.metadata.kind === 'plan' && p.metadata.seat_cents === '12500' && p.metadata.included === '1' && p.success_url === site + '/intelligence/?plan=done', 'P8 the session and the subscription carry what the webhook needs');

// ── self-serve, behind the switch ────────────────────────────────────────
reset();
let d = await route('/plan/checkout', 'ana', { cycle: 'month', seats: 2 });
ok(!d.ok && d.error === 'not_on_sale' && stripe.length === 0, 'S1 nothing sells while the switch is off');
kvm.set('plans:sell', '1');
d = await route('/plan/checkout', 'ana', { cycle: 'year', seats: 2 });
ok(d.ok && d.url && stripe[0].params.line_items[0].quantity === 2 && stripe[0].params.metadata.by === 'self' && stripe[0].params.customer_email === 'ana@brand.test', 'S2 with it on, Ana opens Engine checkout for 2 seats');
ok((await route('/plan/checkout', 'ana', { seats: 51 })).error === 'bad_seats', 'S3 self-serve runs 1 to 50 seats');

// ── the webhook makes the plan ───────────────────────────────────────────
const sess = (md, extra) => Object.assign({ id: 'cs_x', mode: 'subscription', customer: 'cus_1', subscription: 'sub_1', metadata: md }, extra || {});
d = await C.planCheckoutDone(env, sess({ kind: 'plan', user: 'ana', plan: 'engine', cycle: 'month', seats: '2', included: '0', seat_cents: '10000', by: 'self' }));
const g1 = db.groups[0];
ok(d.ok && d.made && g1.plan === 'engine' && g1.seats === 2 && g1.billing === 'stripe' && g1.meta.stripe.subscription === 'sub_1' && g1.name === 'Brand Co' && db.seats[0].role === 'owner', 'W1 a paid checkout makes the group, owned by the buyer, billed by Stripe, the subscription kept');
ok(mails.some(m => m.to === 'house@unsurfaced.test' && /New plan: ana@brand\.test, engine, 2 seats/.test(m.subject)), 'W2 the house is told');
await C.planCheckoutDone(env, sess({ kind: 'plan', user: 'ana', plan: 'engine', cycle: 'month', seats: '2', included: '0', seat_cents: '10000' }));
ok(db.groups.length === 1 && db.seats.length === 1, 'W3 a webhook delivered twice makes nothing twice');
ok((await C.planCheckoutDone(env, sess({ kind: 'plan', user: 'cy', plan: 'engine', seats: '1' }, { subscription: 'sub_slow', payment_status: 'unpaid' }))).pending && !db.groups.some(g => g.meta.stripe && g.meta.stripe.subscription === 'sub_slow'), 'W3a a payment still clearing does not open the plan (async_payment_succeeded does)');
mails = [];
d = await C.planCheckoutDone(env, sess({ kind: 'plan', user: 'ana', plan: 'engine', cycle: 'month', seats: '4', included: '0', seat_cents: '10000' }, { subscription: 'sub_2' }));
ok(d.error === 'second_subscription' && g1.meta.stripe.subscription === 'sub_1' && g1.seats === 2 && mails.some(m => /Payment to sort by hand/.test(m.subject)), 'W3b a second subscription for a live team overwrites nothing; the house is told to sort it');
d = await C.planCheckoutDone(env, sess({ kind: 'plan', user: 'pat', plan: 'partner', cycle: 'year', seats: '7', included: '5', seat_cents: '150000', by: 'desk' }, { subscription: 'sub_p' }));
ok(d.ok && d.approved === true && db.users.find(u => u.id === 'pat').status === 'approved' && db.groups[1].name === 'Big Co', 'W4 a desk link paid by someone still at the door lets them in (the house sent it)');
await C.planSubscriptionChanged(env, { id: 'sub_p', status: 'active', items: { data: [{ quantity: 1, price: { unit_amount: 1000000 } }, { quantity: 4, price: { unit_amount: 150000 } }] } }, 'customer.subscription.updated');
ok(db.groups[1].seats === 9, 'W5 Partner seats follow the subscription: 5 included plus the 4 on the seat line');
await C.planSubscriptionChanged(env, { id: 'sub_1', status: 'past_due', items: { data: [{ quantity: 3, price: { unit_amount: 10000 } }] } }, 'customer.subscription.updated');
ok(g1.status === 'paused' && g1.seats === 3, 'W6 a failed payment pauses the meter; Engine seats are the quantity');
await C.planSubscriptionChanged(env, { id: 'sub_1', status: 'active', items: { data: [{ quantity: 3, price: { unit_amount: 10000 } }] } }, 'customer.subscription.updated');
ok(g1.status === 'active', 'W7 a paid invoice opens it again');
await C.planSubscriptionChanged(env, { id: 'sub_p', status: 'canceled' }, 'customer.subscription.deleted');
ok(db.groups[1].plan === 'member' && db.groups[1].meta.stripe.ended_at, 'W8 a cancel moves the team back to Member, and says when');
ok((await C.planSubscriptionChanged(env, { id: 'sub_nobody', status: 'active' }, 'customer.subscription.updated')).error === 'no_group', 'W9 a subscription the house does not know changes nothing');

// ── top-ups ──────────────────────────────────────────────────────────────
d = await route('/plan/topup', 'ana', {});
const tp = stripe[stripe.length - 1].params;
ok(d.ok && tp.mode === 'payment' && tp.line_items[0].price_data.unit_amount === 2500 && tp.metadata.credits === '200' && tp.metadata.group === g1.id, 'T1 a seat holder buys 200 credits for $25');
await C.planTopupDone(env, { id: 'cs_t', metadata: tp.metadata }); await C.planTopupDone(env, { id: 'cs_t', metadata: tp.metadata });
ok(db.ledger.length === 1 && db.ledger[0].credits === -200 && db.ledger[0].user_id === null && db.ledger[0].action === 'topup', 'T2 the credits land in the pool once, however often Stripe calls');
ok((await route('/plan/topup', 'cy', {})).error === 'plan_required', 'T3 a Member has nothing to top up');
failLedger = true; d = await C.planTopupDone(env, { id: 'cs_t2', metadata: tp.metadata }); failLedger = false;
ok(d.retry && db.ledger.length === 1, 'T4 a top-up that did not land asks Stripe to send it again');
ok(/planTopupDone\(env, o\)[\s\S]{0,200}if \(tr && tr\.retry\)[^\n]*status: 500/.test(w) && /planCheckoutDone\(env, o\)[\s\S]{0,200}if \(pr && pr\.retry\)[^\n]*status: 500/.test(w), 'T5 the webhook answers 500 on a write that failed, so Stripe retries');

// ── seats ────────────────────────────────────────────────────────────────
env._items = [{ id: 'si_1', quantity: 3, price: { unit_amount: 10000, product: 'prod_1', recurring: { interval: 'month' } } }]; stripe = [];
d = await route('/plan/seats', 'ana', { seats: 5 });
ok(d.ok && stripe.some(s => s.path === 'subscription_items/si_1' && s.params.quantity === 5 && s.params.proration_behavior === 'always_invoice') && g1.seats === 5, 'E1 the owner adds seats: the seat line moves and the added seats are invoiced now');
db.groups[1].plan = 'partner'; db.groups[1].status = 'active'; env._items = [{ id: 'si_b', quantity: 1, price: { unit_amount: 1000000, product: 'prod_p', recurring: { interval: 'year' } } }]; stripe = [];
d = await C.seatsDesk(env, { email: 'pat@big.test', seats: 6 });
ok(d.ok && stripe.some(s => s.path === 'subscription_items' && s.params.quantity === 1 && s.params.price_data.unit_amount === 150000 && s.params.price_data.product === 'prod_p'), 'E2 a Partner at its base gets a seat line on its own product from the desk');
ok((await route('/plan/seats', 'pat', { seats: 7 })).error === 'team_billed', 'E3 Partner and Retainer seats change through the team, not the room');
ok((await route('/plan/seats', 'ana', { seats: 0 })).error === 'bad_seats', 'E4 a team has a seat at least');

// ── invites: a paid seat is the approval ─────────────────────────────────
mails = [];
d = await route('/plan/invite', 'ana', { email: 'Ben@Brand.test' });
const inv = db.invites[0];
ok(d.ok && inv.email === 'ben@brand.test' && inv.token_hash.length === 64 && Date.parse(inv.expires_at) - Date.now() > 13 * 864e5, 'I1 the owner gives Ben a seat: one invite, the token kept only as a hash, 14 days');
const link = /\?invite=([a-f0-9]{48})/.exec(mails[0].html), token = link && link[1];
ok(token && mails[0].to === 'ben@brand.test' && mails[0].reply_to === 'ana@brand.test' && (await sha256hex(token)) === inv.token_hash, 'I2 Ben is mailed the link; the token in it is the one hashed');
ok((await C.inviteAccept(env, user('cy'), { token })).error === 'email_mismatch', 'I3 the link is tied to Ben\'s address: Cy cannot take it');
d = await C.inviteAccept(env, user('ben'), { token });
ok(d.ok && d.opened && db.seats.some(s => s.user_id === 'ben' && s.role === 'member') && db.users.find(u => u.id === 'ben').status === 'approved' && db.users.find(u => u.id === 'ben').approved_via === 'seat' && mails.some(m => m.to === 'ben@brand.test' && m.subject === 'The door is open'), 'I4 Ben takes the seat (one locked step) and is let in at the door with the welcome, no knock; the door is marked as the seat\'s');
ok(mails.some(m => m.to === 'ana@brand.test' && /took their seat/.test(m.subject)), 'I5 the owner hears that Ben joined');
ok((await C.inviteAccept(env, user('ben'), { token })).already && (await C.inviteAccept(env, user('cy'), { token })).error === 'used', 'I6 the link works once');
d = await route('/plan/invites', 'ana', {});
ok(d.ok && d.held === 2 && d.members.some(m => m.email === 'ben@brand.test') && d.invites.length === 0 && d.seats === 5, 'I7 the owner sees who holds a seat');
for (const e of ['a@x.test', 'b@x.test', 'c@x.test']) await route('/plan/invite', 'ana', { email: e });
ok((await route('/plan/invite', 'ana', { email: 'd@x.test' })).error === 'no_free_seat', 'I8 seats held plus invites out never pass the seats paid for');
ok((await route('/plan/invite', 'ana', { email: 'a@x.test' })).ok && db.invites.filter(i => i.email === 'a@x.test' && !i.revoked_at).length === 1, 'I9 inviting the same address again sends a fresh link and withdraws the old one');
const aInv = db.invites.find(i => i.email === 'a@x.test' && !i.revoked_at);
await route('/plan/invite/revoke', 'ana', { id: aInv.id });
ok(db.invites.find(i => i.id === aInv.id).revoked_at, 'I10 the owner withdraws an invite');
const exp = db.invites.find(i => i.email === 'b@x.test'); exp.expires_at = '2020-01-01T00:00:00Z';
db.users.push({ id: 'bx', email: 'b@x.test', status: 'pending' });
const bTok = /\?invite=([a-f0-9]{48})/.exec(mails.filter(m => m.to === 'b@x.test').pop().html)[1];
ok((await C.inviteAccept(env, user('bx'), { token: bTok })).error === 'expired' && (await C.inviteAccept(env, user('bx'), { token: 'f'.repeat(48) })).error === 'not_found' && (await C.inviteAccept(env, user('bx'), { token: 'short' })).error === 'bad_token', 'I11 a closed link, a link nobody issued and a broken link are each refused');
ok((await route('/plan/invite', 'ben', { email: 'z@x.test' })).error === 'owner_only', 'I12 only the owner gives seats');
d = await route('/plan/member/remove', 'ana', { email: 'ben@brand.test' });
ok(d.ok && d.door_closed && !db.seats.some(s => s.user_id === 'ben') && db.users.find(u => u.id === 'ben').status === 'pending', 'I13 the owner frees a seat and the door the seat opened closes with it (no seat, no free pass)');
db.users.find(u => u.id === 'cy').status = 'approved'; db.seats.push({ group_id: g1.id, user_id: 'cy', role: 'member' });
d = await route('/plan/member/remove', 'ana', { email: 'cy@brand.test' });
ok(d.ok && !d.door_closed && db.users.find(u => u.id === 'cy').status === 'approved', 'I13b a reader the house let in by hand keeps the door when the seat goes');
db.users.push({ id: 'rv', email: 'rv@brand.test', status: 'revoked' });
await route('/plan/invite', 'ana', { email: 'rv@brand.test' });
const rvTok = /\?invite=([a-f0-9]{48})/.exec(mails.filter(m => m.to === 'rv@brand.test').pop().html)[1];
ok((await C.inviteAccept(env, user('rv'), { token: rvTok })).error === 'door_closed' && db.users.find(u => u.id === 'rv').status === 'revoked', 'I13c a door the house closed stays closed, invite or not');
ok((await route('/plan/member/remove', 'ana', { email: 'ana@brand.test' })).error === 'owner_seat', 'I14 the owner\'s own seat holds the team');
ok((await route('/plan/seats', 'ana', { seats: 1 })).error === 'seats_below_held', 'I15 seats never go under the seats held plus the invites out');
db.invites.forEach(i => { if (!i.accepted_at) i.revoked_at = '2026-10-14T00:00:00Z'; }); kvm.set('invites:' + g1.id + ':' + new Date().toISOString().slice(0, 10), '20');
ok((await route('/plan/invite', 'ana', { email: 'late@x.test' })).error === 'invite_limit', 'X9 twenty invites a day per team');

// ── the desk link ────────────────────────────────────────────────────────
reset(); stripe = [];
d = await C.checkoutDesk(env, { email: 'pat@big.test', plan: 'retainer', seats: 3, base: 12000 });
ok(d.ok && d.url && d.total_usd === 12250 && d.per === 'month' && stripe[0].params.metadata.by === 'desk', 'D1 {run:"checkout"} issues a Retainer link: $12,000 base and 2 seats at $125 is $12,250 a month');
ok((await C.checkoutDesk(env, { email: 'pat@big.test', plan: 'retainer', seats: 3 })).error === 'retainer_base' && kvm.get('plans:sell') === undefined, 'D2 no Retainer without its base; desk links do not need the switch');

// ── the wiring ───────────────────────────────────────────────────────────
ok(/o\.mode === 'subscription' && o\.metadata && o\.metadata\.kind === 'plan'\) \{[^\n]*\n\s+const pr = await planCheckoutDone\(env, o\)/.test(w) && /o\.metadata\.kind === 'topup'\) \{[^\n]*\n\s+const tr = await planTopupDone\(env, o\)/.test(w) && /evt\.type === 'checkout\.session\.async_payment_succeeded' && o\.metadata && o\.metadata\.kind === 'plan'\) \{[^\n]*\n\s+const ar = await planCheckoutDone\(env, o\)/.test(w) && /evt\.type === 'customer\.subscription\.updated' \|\| evt\.type === 'customer\.subscription\.deleted'\) \{[^\n]*\n\s+await planSubscriptionChanged\(env, o, evt\.type\)/.test(w), 'X1 the webhook sets the plan, lands top-ups, keeps the subscription');
ok(/case '\/plan\/invite\/accept':\s+case '\/plan\/member\/remove': return planBillingRoute\(path, request, env, origin, user, body\);/.test(w) && /which === 'checkout' \? await checkoutDesk\(env, body\) : which === 'seats' \? await seatsDesk\(env, body\)/.test(w), 'X2 the routes and the desk runs are wired');
ok(/sell: await plansSelling\(env\),/.test(w) && /if \(body\.sell === true \|\| body\.sell === false\)/.test(w) && /return \{ enforce, sell: await plansSelling\(env\), period/.test(w), 'X3 {run:"plans", sell} flips the switch and GET /plan tells the room');
ok(!/callClaude|callModel|claudeBatchSubmit/.test(block) && !/—/.test(block), 'X4 no model, no em dash');
ok(/await _inviteTake\(\);   \/\/ SEAM:CHECKOUT/.test(page) && page.indexOf('await _inviteTake();') < page.indexOf("_sb.rpc('is_approved'); approved = !error") && /localStorage\.setItem\('uai_invite', t\)/.test(page), 'X5 the page keeps the invite from the URL and takes it before the door is checked');
ok(/id="rm-plan"/.test(page) && /_planPanel\(\);   \/\/ SEAM:CHECKOUT/.test(page) && /Give a seat/.test(page) && /_planBuy\('month'\)/.test(page), 'X6 YOUR PLAN is in the room: credits, seats, invites, Engine');
ok(/create table if not exists group_invites/.test(sql) && /token_hash text not null unique/.test(sql) && /credit_ledger_topup_once/.test(sql) && /enable row level security/.test(sql), 'X7 the migration: invites with hashed tokens, a top-up once, RLS on');
ok(seams.registry['SEAM:CHECKOUT'] && seams.registry['SEAM:CHECKOUT@intelligence'], 'X8 registered');
ok(/data-email="\$\{safeAttr\(m\.email \|\| ''\)\}" onclick="_planRemove\(this\.dataset\.email\)"/.test(page) && !/_planRemove\('\$\{/.test(page), 'X10 an email never lands inside an onclick string');
ok(/history\.replaceState\(null, '', location\.pathname/.test(page), 'X11 the invite token leaves the address bar once it is kept');
ok(/create or replace function seat_take/.test(sql) && /for update/.test(sql) && /member_groups_subscription_once/.test(sql) && /add column if not exists approved_via/.test(sql), 'X12 the migration: the locked seat, one team a subscription, the door\'s mark');

console.log(`proof_checkout: ${pass} passed`);
