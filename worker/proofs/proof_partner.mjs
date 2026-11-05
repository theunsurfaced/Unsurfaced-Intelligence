/**
 * proof_partner.mjs  --  EX51 THE PARTNER: SEAM:PARTNER. A Partner or Retainer company's own page: its intake (kept by the team's owner,
 * joined to every member's frame), what the house delivers, what comes next and the office hours this month, kept by the desk. The
 * tables are the worker's alone; the routes are signed in, below the sign-in line and ahead of the meter; no one else sees the band.
 * Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0064_partner.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DASH = /[—–]/;

// ── A: the tables ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const tables = ['partner_intake', 'partner_deliveries', 'partner_schedule', 'partner_hours'];
ok(tables.every(t => sql.includes('create table if not exists public.' + t + ' (') && sql.includes('alter table public.' + t + ' enable row level security;') && sql.includes('revoke all on public.' + t + ' from anon, authenticated;'))
  && (sql.match(/references public\.member_groups\(id\) on delete cascade/g) || []).length === 4 && /url\s+text check \(url is null or url like 'https:\/\/%'\)/.test(sql) && /minutes > 0 and minutes <= 1440/.test(sql)
  && /kind in \('read','recon','report','brief','session'\)/.test(sql) && /status in \('planned','done','moved','cancelled'\)/.test(sql) && /kind in \('session','office_hours'\)/.test(sql) && !/create policy|grant /i.test(sql),
  'A1 four tables on the company, gone with it; row level security on and no grants, so only the worker reads them; https links, sane minutes, the kinds the worker knows');

// ── B: the worker, against a small table store ──────────────────────────────────────────────────────────────────────────────────
const pb = between(w, '/* ═══ SEAM:PARTNER (EX51 THE PARTNER)', '/* ═══ end SEAM:PARTNER ═══ */');
const K = (/const PARTNER = (\{[\s\S]*?\});\nfunction partnerList/.exec(pb) || [])[1];
const DB = { seats: [], groups: [], intake: [], deliveries: [], schedule: [], hours: [] }, calls = [];
let FAIL_WRITE = false;
const sbRest = async (env, path, opts) => {
  const m = (opts && opts.method) || 'GET'; calls.push(m + ' ' + path);
  const q = k => (new RegExp('[?&]' + k + '=(?:eq|gte)\\.([^&]+)').exec(path) || [])[1];
  if (m !== 'GET') { if (FAIL_WRITE) throw new Error('sb_500');
    const b = opts.body || {};
    if (path.startsWith('partner_intake?on_conflict=group_id')) { DB.intake = DB.intake.filter(r => r.group_id !== b.group_id).concat([b]); return null; }
    if (path === 'partner_deliveries') { DB.deliveries.push(Object.assign({ id: 'dl' + DB.deliveries.length, delivered_at: '2026-11-0' + (DB.deliveries.length + 1) + 'T10:00:00Z' }, b)); return null; }
    if (path === 'partner_schedule') { DB.schedule.push(Object.assign({ id: 'aaaaaaaa-0000-4000-8000-00000000000' + DB.schedule.length, status: 'planned' }, b)); return null; }
    if (path.startsWith('partner_schedule?id=eq.')) { const id = q('id'), g = q('group_id'), hit = DB.schedule.filter(r => r.id === id && r.group_id === g); hit.forEach(r => Object.assign(r, b)); return (opts.headers || {}).Prefer === 'return=representation' ? hit : null; }
    if (path === 'partner_hours') { DB.hours.push(b); return null; }
    throw new Error('unexpected write ' + path); }
  if (path.startsWith('group_seats?')) return DB.seats.filter(r => r.user_id === q('user_id'));
  if (path.startsWith('member_groups?')) return DB.groups.filter(r => r.id === q('id'));
  if (path.startsWith('partner_intake?')) return DB.intake.filter(r => r.group_id === q('group_id'));
  if (path.startsWith('partner_deliveries?')) return DB.deliveries.filter(r => r.group_id === q('group_id')).sort((a, b) => b.delivered_at.localeCompare(a.delivered_at));
  if (path.startsWith('partner_schedule?')) return DB.schedule.filter(r => r.group_id === q('group_id') && r.status === 'planned' && r.due >= q('due')).sort((a, b) => a.due.localeCompare(b.due));
  if (path.startsWith('partner_hours?')) return DB.hours.filter(r => r.group_id === q('group_id') && r.on_date >= q('on_date'));
  return [];
};
const USERS = { 'own@acme.test': { id: 'u-own' }, 'mem@acme.test': { id: 'u-mem' }, 'eng@x.test': { id: 'u-eng' } };
const P = new Function('sbRest', 'excQuiet', 'json', 'planPeriod', 'planUser', pb + '; return { PARTNER, partnerList, partnerIntakeClean, partnerFrameJoin, partnerOf, partnerFrameOf, partnerHome, partnerRoute, partnerIntakeRoute, partnerDesk };')(
  sbRest, (l, fb) => () => fb, (o, status) => ({ status, body: o }), () => '2026-11-01', async (env, e) => USERS[String(e || '').toLowerCase()] || null);
ok(P.partnerList(' Nike , nike,  Hoka<b>, A, "On",On', 8).join('|') === 'Nike|Hokab|On' && P.partnerList(['a1', 'b2', 'c3'], 2).join() === 'a1,b2' && P.partnerList(null, 3).length === 0,
  'B1 a list is trimmed, kept to names of two letters or more, deduplicated whatever the case, stripped of markup, capped');
const ic = P.partnerIntakeClean({ brand: '  Acme  Running ', competitors: 'Nike, Hoka, nike', markets: ['UK', 'US'], audiences: 'parents', channels: [], questions: 'Where do parents buy the second pair?\nshort\n' + 'x'.repeat(300), notes: 'a'.repeat(1500) });
ok(ic.brand === 'Acme Running' && ic.competitors.join() === 'Nike,Hoka' && ic.markets.join() === 'UK,US' && ic.audiences.join() === 'parents' && ic.questions.length === 2 && ic.questions[1].length === 240 && ic.notes.length === 1000
  && P.partnerIntakeClean({ questions: Array.from({ length: 9 }, (_, i) => 'Question number ' + i) }).questions.length === 6 && P.partnerIntakeClean({}).brand === null,
  'B2 the intake: the brand, the lists, up to six standing questions of eight letters or more (one to a line), the notes, each capped');
const fj = P.partnerFrameJoin({ tracked_brands: ['Nike'], markets: ['US'], keywords: ['retro'] }, { brand: 'Acme', competitors: ['nike', 'Hoka'], markets: ['UK'], audiences: ['parents'] });
ok(fj.tracked_brands.join() === 'Nike,Acme,Hoka' && fj.markets.join() === 'US,UK' && fj.audiences.join() === 'parents' && fj.keywords.join() === 'retro' && P.partnerFrameJoin({ a: 1 }, null).a === 1 && P.partnerFrameJoin(null, { brand: 'Acme' }).tracked_brands.join() === 'Acme',
  'B3 the company\'s intake joins the reader\'s frame: its brand and its set watched, its markets and audiences theirs; the reader\'s own frame kept');
DB.groups.push({ id: 'g1', name: 'Acme', plan: 'partner', seats: 5, status: 'active', owner_id: 'u-own' }, { id: 'g2', name: 'Engine Co', plan: 'engine', seats: 3, status: 'active', owner_id: 'u-eng' });
DB.seats.push({ user_id: 'u-own', group_id: 'g1', role: 'owner' }, { user_id: 'u-mem', group_id: 'g1', role: 'member' }, { user_id: 'u-eng', group_id: 'g2', role: 'owner' });
const po = await P.partnerOf({}, 'u-own'), pm = await P.partnerOf({}, 'u-mem');
ok(po && po.owner === true && po.group.id === 'g1' && pm && pm.owner === false && (await P.partnerOf({}, 'u-eng')) === null && (await P.partnerOf({}, 'u-none')) === null,
  'B4 a reader\'s company counts only on a Partner or Retainer plan; its owner is the seat\'s owner');
const r0 = await P.partnerRoute({}, 'o', { id: 'u-eng' });
ok(r0.status === 200 && r0.body.ok && r0.body.partner === null && !('intake' in r0.body), 'B5 anyone not on a Partner or Retainer team is told nothing more');
const rm = await P.partnerIntakeRoute({ json: async () => ({ brand: 'X' }) }, {}, 'o', { id: 'u-mem' }), rn = await P.partnerIntakeRoute({ json: async () => ({ brand: 'X' }) }, {}, 'o', { id: 'u-eng' });
ok(rm.status === 403 && rm.body.error === 'owner_only' && /owner sets the intake/.test(rm.body.say) && rn.status === 403 && rn.body.error === 'not_partner' && DB.intake.length === 0,
  'B6 only the team\'s owner keeps the intake; a member is told who does; no one else writes it');
const ro = await P.partnerIntakeRoute({ json: async () => ({ brand: 'Acme', competitors: 'Nike, Hoka', markets: 'UK', questions: 'Where do parents buy the second pair?' }) }, {}, 'o', { id: 'u-own' });
ok(ro.status === 200 && ro.body.ok && ro.body.role === 'owner' && ro.body.intake.brand === 'Acme' && DB.intake[0].group_id === 'g1' && DB.intake[0].updated_by === 'u-own' && calls.some(c => c === 'POST partner_intake?on_conflict=group_id'),
  'B7 the owner\'s intake is kept on the company, one row, written over');
FAIL_WRITE = true; const rf = await P.partnerIntakeRoute({ json: async () => ({ brand: 'Acme 2' }) }, {}, 'o', { id: 'u-own' }); FAIL_WRITE = false;
ok(rf.body.ok === false && rf.body.error === 'not_saved' && DB.intake[0].brand === 'Acme', 'B8 a write that fails says so; nothing claims it saved');
// the desk
const d0 = await P.partnerDesk({}, { run: 'partner_deliver', email: 'eng@x.test', kind: 'read', title: 'A read' });
const dBad = await P.partnerDesk({}, { run: 'partner_deliver', email: 'mem@acme.test', kind: 'poster', title: 'A read' }), dUrl = await P.partnerDesk({}, { run: 'partner_deliver', email: 'mem@acme.test', kind: 'read', title: 'A read', url: 'http://x.test/a' });
const d1 = await P.partnerDesk({}, { run: 'partner_deliver', email: 'MEM@acme.test', kind: 'recon', title: 'RECON: the second pair', summary: 'Parents buy where the first held up.', url: 'https://claude.ai/artifact/abc' });
const d2 = await P.partnerDesk({}, { run: 'partner_deliver', email: 'own@acme.test', kind: 'read', title: 'Weekly read, Nov 2' });
ok(d0.error === 'not_partner' && dBad.error === 'bad_delivery' && dUrl.error === 'bad_url' && d1.ok && d2.ok && d2.delivered.length === 2 && d2.delivered[0].title === 'Weekly read, Nov 2' && d2.delivered[1].url === 'https://claude.ai/artifact/abc' && DB.deliveries.every(x => x.group_id === 'g1' && x.created_by === 'desk'),
  'B9 the desk delivers to a company by anyone\'s email on its team: a known kind, a title, an https link or none; the newest first');
const s1 = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', kind: 'recon', title: 'Q1 RECON', due: '2099-01-15' });
const s2 = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', kind: 'session', title: 'Work session', due: '2099-01-05' });
const sBad = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', kind: 'session', title: 'Work session', due: 'Jan 5' });
const sid = DB.schedule.find(x => x.title === 'Work session').id;
const s3 = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', id: sid, status: 'done' }), s4 = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', id: sid, status: 'gone' });
const s5 = await P.partnerDesk({}, { run: 'partner_schedule', email: 'own@acme.test', id: 'bbbbbbbb-0000-4000-8000-000000000009', status: 'done' });
ok(s1.ok && s2.ok && s2.ahead.map(x => x.title).join() === 'Work session,Q1 RECON' && sBad.error === 'bad_schedule' && s3.ok && s3.ahead.map(x => x.title).join() === 'Q1 RECON' && s4.error === 'bad_status' && s5.ok === false && s5.error === 'not_found' && calls.some(c => c === 'PATCH partner_schedule?id=eq.' + sid + '&group_id=eq.g1'),
  'B10 the schedule: an entry with its date, soonest first; an entry\'s status changed only on that company\'s own entry, and an id it does not hold says so; a done one leaves what comes next');
const h1 = await P.partnerDesk({}, { run: 'partner_hours', email: 'own@acme.test', minutes: 90, kind: 'session', note: 'Q4 plan' }), h2 = await P.partnerDesk({}, { run: 'partner_hours', email: 'own@acme.test', minutes: 30 });
const hBad = await P.partnerDesk({}, { run: 'partner_hours', email: 'own@acme.test', minutes: 0 }), hOld = await P.partnerDesk({}, { run: 'partner_hours', email: 'own@acme.test', minutes: 600, on: '2026-10-20' });
ok(h1.ok && h2.ok && hBad.error === 'bad_minutes' && hOld.ok && hOld.hours.used_min === 120 && hOld.hours.included_min === 240 && DB.hours.find(x => x.minutes === 30).kind === 'office_hours',
  'B11 the hours: minutes and a kind (office hours unless named), on a day; this month\'s are counted against what the plan includes (Partner four hours)');
DB.groups[0].plan = 'retainer'; const v = await P.partnerDesk({}, { run: 'partner', email: 'mem@acme.test' }); DB.groups[0].plan = 'partner';
ok(v.ok && v.role === 'member' && v.partner.name === 'Acme' && v.partner.plan === 'retainer' && v.hours.included_min === 1200 && v.intake.brand === 'Acme', 'B12 the desk sees the company\'s page as its team does; a Retainer includes twenty hours');
const pf = await P.partnerFrameOf({}, 'u-mem', { tracked_brands: ['Brooks'] });
ok(pf.tracked_brands.join() === 'Brooks,Acme,Nike,Hoka' && (await P.partnerFrameOf({}, 'u-eng', { tracked_brands: ['X'] })).tracked_brands.join() === 'X', 'B13 a member\'s frame carries the company\'s brand and set; a reader on any other plan keeps their own');
const iAuth = w.indexOf('// Everything below requires a signed-in user'), iMeter = w.indexOf('const _aiPath = ');
const iG = w.indexOf("if (path === '/partner' && request.method === 'GET') return partnerRoute(env, origin, user);"), iP = w.indexOf("if (path === '/partner/intake' && request.method === 'POST') return partnerIntakeRoute(request, env, origin, user);");
const er = (/const DESK_ROLES = \{ EDITOR_RUNS: \[([^\]]*)\]/.exec(w) || [])[1] || '';
ok(iG > iAuth && iP > iAuth && iG < iMeter && iP < iMeter && /which === 'partner' \|\| which === 'partner_deliver' \|\| which === 'partner_schedule' \|\| which === 'partner_hours' \? await partnerDesk\(env, body\)/.test(w) && !/partner/.test(er)
  && /const prof = typeof partnerFrameOf === 'function' \? await partnerFrameOf\(env, user\.id, rows\[0\] \|\| null\) : \(rows\[0\] \|\| null\);/.test(w)
  && !/callClaude|callModel|meterCharge|underLimit/.test(pb) && !DASH.test(pb) && K && /HOURS_MIN: \{ partner: 240, retainer: 1200 \}/.test(K),
  'B14 the routes sit below the sign-in line and ahead of the meter; the desk keeps the rest, never an editor; the frame takes the intake; no model, no dash');

// ── C: the page's band, with fakes ──────────────────────────────────────────────────────────────────────────────────────────────
const js = between(page, '/* ═══ SEAM:PARTNER (EX51 THE PARTNER): a Partner or Retainer company', '/* ═══ end SEAM:PARTNER ═══ */');
const el = (id, v) => ({ id, innerHTML: '', style: {}, value: v || '', focus() { seen.focus = id; } });
const doc = { byId: { 'pt-band': el('pt-band') }, getElementById(id) { return this.byId[id] || null; } };
const win = {}, seen = { fetched: [], posted: [], yours: 0, toast: [], focus: null }; let FETCH = null;
const C = new Function('document', 'window', 'safe', 'safeAttr', '_galApi', '_authHeader', 'fetch', '_recDay', '_yoursLoad', 'showToast',
  js + '; return { _PT, _pt, _ptLoad, _ptForget, _ptSync, _ptTime, _ptSub, _ptRender, _ptForm, _ptEdit, _ptFormBody, _ptSave };')(
  doc, win, esc, esc, p => 'https://api.example' + p, async () => ({ Authorization: 'Bearer t' }),
  async (u, o) => { if (o && o.method === 'POST') seen.posted.push({ u, body: JSON.parse(o.body) }); else seen.fetched.push(u); const b = FETCH ? FETCH(u, o) : null; return { ok: !!(b && !b._status), json: async () => b }; },
  d => (d ? String(d).slice(5, 10) : ''), () => { seen.yours++; }, m => seen.toast.push(m));
ok(C._ptTime(0) === '0 min' && C._ptTime(45) === '45 min' && C._ptTime(90) === '1 h 30 min' && C._ptTime(240) === '4 h' && /^Start with the intake/.test(C._ptSub(null))
  && C._ptSub({ brand: 'Acme', competitors: ['Nike', 'Hoka', 'On', 'Brooks', 'Asics'] }) === 'Built around Acme, read against Nike, Hoka, On, Brooks.' && C._ptSub({ brand: 'Acme', competitors: [] }) === 'Built around Acme.',
  'C1 the hours as a person says them; the company\'s line names its brand and the set it is read against');
win._signedOut = true;
ok((await C._ptLoad()) === null && !seen.fetched.length, 'C2 a visitor asks for nothing');
win._signedOut = false; FETCH = u => (/\/partner$/.test(u) ? { ok: true, partner: null } : null);
await C._ptLoad();
ok(seen.fetched.length === 1 && C._pt.data === null && doc.byId['pt-band'].style.display === 'none' && doc.byId['pt-band'].innerHTML === '', 'C3 a reader on any other plan sees no band');
const HOME = { ok: true, role: 'owner', partner: { name: 'Acme', plan: 'partner', seats: 5 }, intake: { brand: 'Acme', competitors: ['Nike', 'Hoka'], markets: ['UK'], audiences: [], channels: [], questions: ['Where do parents buy the second pair?', 'What makes a member renew?'], notes: null },
  delivered: [{ id: 'd1', kind: 'recon', title: 'RECON: the second pair', summary: 'Parents buy where the first held up.', url: 'https://claude.ai/artifact/abc', delivered_at: '2026-11-02T10:00:00Z' }, { id: 'd2', kind: 'read', title: 'Weekly read', summary: null, url: 'javascript:alert(1)', delivered_at: '2026-10-28T10:00:00Z' }],
  ahead: [{ id: 's1', kind: 'session', title: 'Work session', due: '2026-11-12' }], hours: { used_min: 90, included_min: 240, period: '2026-11-01' } };
FETCH = u => (/\/partner$/.test(u) ? HOME : null); await C._ptLoad(true);
const band = doc.byId['pt-band'].innerHTML;
ok(doc.byId['pt-band'].style.display === '' && /YOUR PARTNER PAGE/.test(band) && /<h2 id="pt-h">Acme<\/h2>/.test(band) && /Built around Acme, read against Nike, Hoka\./.test(band) && (band.match(/<li>/g) || []).length === 3
  && /RECON · 11-02<\/div><h3>RECON: the second pair<\/h3><p>Parents buy where the first held up\.<\/p><a class="hs-link" href="https:\/\/claude\.ai\/artifact\/abc" target="_blank" rel="noopener">Open it<\/a>/.test(band) && !/javascript:/.test(band)
  && /<li><span class="hs-line">Session · 11-12<\/span><b>Work session<\/b><\/li>/.test(band) && /Office hours this month: 1 h 30 min of 4 h/.test(band) && /onclick="_ptEdit\(true\)">Edit your intake<\/button>/.test(band) && /href="mailto:hello@unsurfaced-intelligence\.com\?subject=Acme%20partnership">Talk to the team<\/a>/.test(band),
  'C4 the company\'s band: its name and set, its standing questions, what was delivered (each opening where it lives, https only), what comes next, the hours this month, the owner\'s intake and the way to the team');
C._pt.data = Object.assign({}, HOME, { role: 'member', intake: null }); C._ptRender();
ok(!/_ptEdit/.test(doc.byId['pt-band'].innerHTML) && /Your team’s owner sets them\./.test(doc.byId['pt-band'].innerHTML) && /Start with the intake/.test(doc.byId['pt-band'].innerHTML), 'C5 a member reads the page; the owner keeps the intake');
C._pt.data = HOME; doc.byId['pt-brand'] = el('pt-brand', 'Acme'); C._ptEdit(true);
const form = doc.byId['pt-band'].innerHTML;
ok(/<form class="pt-form" id="pt-form" onsubmit="return _ptSave\(event\)">/.test(form) && /id="pt-brand" maxlength="80" value="Acme"/.test(form) && /id="pt-competitors" value="Nike, Hoka"/.test(form) && /<textarea id="pt-questions" rows="5">Where do parents buy the second pair\?\nWhat makes a member renew\?<\/textarea>/.test(form) && seen.focus === 'pt-brand',
  'C6 the intake opens with what is kept, the questions one to a line, and the brand takes focus');
const body = C._ptFormBody(id => ({ 'pt-brand': ' Acme ', 'pt-competitors': 'Nike, Hoka, ,On', 'pt-markets': 'UK', 'pt-audiences': '', 'pt-channels': 'TikTok', 'pt-questions': 'Q one is long enough\n\n Q two too long enough ', 'pt-notes': ' n ' })[id]);
ok(body.brand === 'Acme' && body.competitors.join() === 'Nike,Hoka,On' && body.audiences.length === 0 && body.channels.join() === 'TikTok' && body.questions.join('|') === 'Q one is long enough|Q two too long enough' && body.notes === 'n',
  'C7 the form\'s lists split on commas and its questions on lines');
Object.assign(doc.byId, { 'pt-brand': el('pt-brand', 'Acme Running'), 'pt-competitors': el('pt-competitors', 'Nike, Brooks'), 'pt-markets': el('pt-markets', 'UK'), 'pt-audiences': el('pt-audiences', ''), 'pt-channels': el('pt-channels', ''), 'pt-questions': el('pt-questions', 'Where do parents buy the second pair?'), 'pt-notes': el('pt-notes', '') });
FETCH = (u, o) => (o && o.method === 'POST' ? { _status: 403, ok: false, error: 'owner_only', say: 'Your team’s owner sets the intake.' } : HOME);
await C._ptSave({ preventDefault() {} });
const kept = doc.byId['pt-band'].innerHTML;
ok(seen.posted.length === 1 && seen.posted[0].u === 'https://api.example/partner/intake' && seen.posted[0].body.brand === 'Acme Running' && /Your team’s owner sets the intake\./.test(kept) && /value="Acme Running"/.test(kept) && /value="Nike, Brooks"/.test(kept) && C._pt.editing,
  'C8 a save that is refused says why, and what was typed stays in the form');
FETCH = (u, o) => (o && o.method === 'POST' ? Object.assign({}, HOME, { intake: Object.assign({}, HOME.intake, { brand: 'Acme Running' }) }) : HOME);
await C._ptSave({ preventDefault() {} });
ok(!C._pt.editing && C._pt.draft === null && /<h2 id="pt-h">Acme<\/h2>/.test(doc.byId['pt-band'].innerHTML) && /Built around Acme Running/.test(doc.byId['pt-band'].innerHTML) && seen.yours === 1 && seen.toast.includes('Intake saved'),
  'C9 a saved intake redraws the page and the reader\'s frame is read again');
win._signedOut = true; C._ptSync();
ok(C._pt.data === null && doc.byId['pt-band'].style.display === 'none', 'C10 signing out forgets the company\'s page');
const css = between(page, '<style id="partner">', '</style>');
ok(page.indexOf('id="pt-band"') > 0 && page.indexOf('id="pt-band"') < page.indexOf('id="my-spaces"') && /if \(typeof _ptSync === 'function'\) _ptSync\(\);/.test(between(page, 'function _navAuth() {', '/* SEAM:EXC_NAV: the dropdown.'))
  && !/z-index/.test(css) && /@media \(max-width:640px\)/.test(css) && !DASH.test(css + js) && !/callClaude|excavate\/(interpret|gather|synthesize)/.test(js),
  'C11 the band opens the arrival, ahead of a seat\'s spaces; it follows the sign-in; a phone layout; no model, no dash');
console.log(`\nproof_partner: ${pass} checks PASS`);
