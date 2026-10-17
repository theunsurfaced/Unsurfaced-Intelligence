/**
 * proof_popout.mjs  --  EX47 THE POP-OUT (SEAM:POPOUT): the implications for every reader's role are written before anyone opens an
 * insight, one call an insight; the route serves what was written and never calls a model on open.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const block = w.slice(w.indexOf('async function roleImplicationsRoute('), w.indexOf('/* ═══ SEAM:READER_MARKS:'));

// ── the fake house ───────────────────────────────────────────────────────
const ID = (n) => '00000000-0000-0000-0000-00000000000' + n;
let rows, profiles, calls, liveCalls, patches, enforced, admins, plan, profile, lastPrompt;
const reset = () => {
  rows = {}; [1, 2, 3].forEach(n => { rows[ID(n)] = { id: ID(n), status: 'ready', frame: { entity: 'Jordan', category: 'sneakers' }, read: { brief: 'The interpretation.' }, meta: { voices: [{ text: 'kept' }] } }; });
  profiles = [{ role_title: 'strategy' }, { role_title: 'creative' }, { role_title: 'nonsense' }, { role_title: null }];
  calls = []; liveCalls = 0; patches = []; enforced = false; admins = new Set(); plan = { plan: 'member' }; profile = { role_title: 'creative' };
};
const sel = (path, k) => { const m = new RegExp(k + '=(eq|in)\\.\\(?([^&)]+)').exec(path); return m ? m[2].split(',') : null; };
const sbRest = async (env, path, opts = {}) => {
  const t = path.split('?')[0];
  if (t === 'client_profile') return profiles;
  if (t === 'door_reads') {
    if ((opts.method || 'GET') === 'PATCH') { const id = sel(path, 'id')[0]; rows[id] = Object.assign({}, rows[id], opts.body); patches.push({ id, body: opts.body }); return null; }
    const ids = sel(path, 'id') || [];
    const got = ids.map(i => rows[i]).filter(Boolean);
    if (/keys:meta->roles->keys/.test(path)) return got.map(r => ({ id: r.id, keys: r.meta && r.meta.roles ? r.meta.roles.keys : null, rev: r.meta && r.meta.roles ? r.meta.roles.rev : null }));
    return got.map(r => JSON.parse(JSON.stringify(r)));
  }
  return [];
};
const claude = (req) => {
  calls.push(req); lastPrompt = req.prompt;
  const keys = [...req.prompt.matchAll(/^([a-z]+): /gm)].map(m => m[1]).filter(k => k !== 'THE' && k !== 'FRAME');
  const roles = {}; for (const k of keys) roles[k] = [1, 2, 3].map(i => ({ title: 'Act ' + i + ' — for ' + k, body: 'Do the thing for ' + k + '.' }));
  return { ok: true, cost_usd: 0.006, text: JSON.stringify({ roles }) };
};
const PROFILE = { ROLES: ['brand', 'strategy', 'creative', 'media', 'product', 'insights', 'founder', 'other'] };
const ROLE_WORDS = { brand: 'a brand manager', strategy: 'a strategist', creative: 'a creative director', media: 'a media planner', product: 'a product lead', insights: 'an insights lead', founder: 'a founder', other: 'a professional in marketing' };
const json = (o, s) => Object.assign({ _status: s || 200 }, o);
const R = new Function('authenticate', 'sbRest', 'json', 'excQuiet', 'profileLoad', 'PROFILE', 'ROLE_WORDS', 'doorTile', 'roleImplications', 'plansEnforced', 'callerIsAdmin', 'planState', 'callClaude', 'extractJson', 'doorSet', 'logEvent',
  block + '; return { roleImplicationsRoute, popoutPick, popoutLiveAllowed, popoutRolesWanted, popoutClean, popoutPass, POPOUT };')(
  async () => ({ id: 'reader' }), sbRest, json, (k, v) => () => v, async () => profile, PROFILE, ROLE_WORDS,
  r => ({ id: r.id, claim: 'Jordan wins the court', move: 'Own the court', deployed: '2026-10-13', frame: r.frame || {} }),
  async () => { liveCalls++; return { ok: true, role: 'creative', implications: [{ title: 'live', body: 'live' }] }; },
  async () => enforced, async (e, u) => admins.has(u), async () => plan,
  async (env, tier, req) => { if (tier !== 'frame') throw new Error('wrong tier'); return claude(req); }, t => { try { return JSON.parse(t); } catch (e) { return null; } },
  async () => ({ tiles: [{ id: ID(1) }, { id: ID(2) }, { id: ID(3), carried: true }, { id: 'not-a-uuid' }] }), () => Promise.resolve());
const req = id => ({ url: 'https://api.test/excavate/insight/roles?id=' + id });

// ── the pass ─────────────────────────────────────────────────────────────
reset();
ok(JSON.stringify(await R.popoutRolesWanted({})) === JSON.stringify(['strategy', 'creative', 'other']), 'P1 the roles are the ones readers hold, plus other; an unknown role is not asked');
let out = await R.popoutPass({});
ok(out.tiles === 3 && out.missing === 3 && out.written === 3 && calls.length === 3 && out.cost_usd === 0.018, 'P2 one call an insight on the board (a carried tile too), never one call a role');
ok(calls.every(c => c.kind === 'popout' && /strategy: a strategist/.test(c.prompt) && /creative: a creative director/.test(c.prompt) && /other: a professional/.test(c.prompt) && /INTERPRETATION: The interpretation\./.test(c.prompt)), 'P3 each call names every reader role and carries the claim, the move and the interpretation');
const m1 = rows[ID(1)].meta;
ok(m1.roles.rev === R.POPOUT.REV && JSON.stringify(m1.roles.keys) === JSON.stringify(['strategy', 'creative', 'other']) && m1.roles.by_role.creative.length === 3 && m1.voices[0].text === 'kept', 'P4 the lines land on meta.roles; the rest of meta (the voices) is kept');
ok(!/—/.test(JSON.stringify(m1.roles)), 'P5 no em dash survives into a stored line');
calls = []; out = await R.popoutPass({});
ok(out.missing === 0 && calls.length === 0, 'P6 nothing written twice: a second slice with nothing new costs nothing');
profiles.push({ role_title: 'media' }); calls = []; out = await R.popoutPass({});
ok(out.missing === 3 && calls.length === 3 && calls.every(c => /media: a media planner/.test(c.prompt) && !/strategy: a strategist/.test(c.prompt)) && rows[ID(1)].meta.roles.by_role.strategy && rows[ID(1)].meta.roles.by_role.media, 'P7 a role new among readers is asked alone, and the roles already written stay');
calls = []; out = await R.popoutPass({}, {});
reset(); calls = []; out = await R.popoutPass({}, { max: 1 });
ok(out.written === 1 && out.missing === 3, 'P8 a slice writes at most its share (PER_RUN, or max from the desk)');
calls = []; out = await R.popoutPass({}, { force: true });
ok(calls.length === 3 && out.written === 3, 'P9 force rewrites every insight on the board');
ok(R.POPOUT.PER_RUN === 8, 'P10 at most eight insights a slice');

// ── the route: opening never spends ──────────────────────────────────────
reset(); await R.popoutPass({}); calls = []; liveCalls = 0;
let r = await R.roleImplicationsRoute(req(ID(1)), {}, '');
ok(r.ok && r.stored && r.role === 'creative' && !r.fallback && r.implications.length === 3 && calls.length === 0 && liveCalls === 0, 'O1 a creative opens an insight: her lines, stored, no model called');
profile = { role_title: 'founder' };
r = await R.roleImplicationsRoute(req(ID(1)), {}, '');
ok(r.ok && r.role === 'other' && r.fallback && liveCalls === 0, 'O2 a role not written yet is served the lines for every role, still with no call');
reset(); enforced = true; profile = { role_title: 'creative' };
r = await R.roleImplicationsRoute(req(ID(2)), {}, '');
ok(!r.ok && r.error === 'not_written' && /written overnight/.test(r.say) && liveCalls === 0, 'O3 with the wall on, a Member opening an insight the pass has not reached is told it is written overnight (no spend)');
plan = { plan: 'engine', status: 'active' };
r = await R.roleImplicationsRoute(req(ID(2)), {}, '');
ok(r.ok && liveCalls === 1, 'O4 a paid seat on an insight from before EX47 is asked live, as before (cached a day)');
plan = { plan: 'member' }; admins.add('reader'); liveCalls = 0;
ok((await R.roleImplicationsRoute(req(ID(2)), {}, '')).ok && liveCalls === 1, 'O5 the house too');
admins.clear(); enforced = false; liveCalls = 0;
ok((await R.roleImplicationsRoute(req(ID(2)), {}, '')).ok && liveCalls === 1, 'O6 while the wall is off a Member asks live as before: nothing is taken away before EX50');
reset(); await R.popoutPass({}); profile = { role_title: null };
ok((await R.roleImplicationsRoute(req(ID(1)), {}, '')).role === 'strategy', 'O7 a reader with no role set reads as a strategist, as the old route did');
ok(R.popoutPick(null, 'brand') === null && R.popoutPick({ brand: [] }, 'brand') === null && R.popoutPick({ strategy: [{ title: 't', body: 'b' }] }, 'brand').role === 'strategy', 'O8 the pick falls back to other, then strategy, and never serves an empty set');
ok(Object.keys(R.popoutClean({ roles: { creative: [{ title: '', body: 'x' }], other: 'nope' } }, ['creative', 'other'])).length === 0, 'O9 an unreadable answer stores nothing');

// ── the wiring ───────────────────────────────────────────────────────────
const sched = w.slice(w.indexOf('async scheduled('), w.indexOf('async scheduled(') + 9000);
const slice = sched.slice(sched.indexOf('} else {'));
ok(/\.then\(\(\) => popoutPass\(env\)\)/.test(slice) && slice.indexOf('popoutPass(env)') < slice.indexOf('claudeBatchDrain(env)') && !/popoutPass/.test(sched.slice(0, sched.indexOf('} else {'))), 'W1 the pass runs in the 30-minute slice, so a reading the drain landed is written within half an hour');
ok(/which === 'popout' \? await popoutPass\(env, \{ force: !!body\.force/.test(w) && !/'popout'/.test(w.slice(w.indexOf('const DESK_ROLES = {'), w.indexOf('async function callerRole('))), 'W2 {run:"popout"} is the admin\'s, never an editor\'s (it spends)');
ok(/'popoutWrite': 'claudeGate on the frame tier/.test(gate) && seams.registry['SEAM:POPOUT'] && seams.registry['SEAM:POPOUT@intelligence'], 'W3 the spender and the seams are registered');
ok(/j\.error === 'not_written' \? safe\(j\.say/.test(page) && /j\.fallback \? 'for every role'/.test(page), 'W4 the page says when the lines are written overnight and labels a fallback for every role');
ok(!/—/.test(block), 'W5 no em dash in the new code');

console.log(`proof_popout: ${pass} passed`);
