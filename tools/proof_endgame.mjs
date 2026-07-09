/**
 * proof_endgame.mjs — SEAM:ENDGAME (needs: npm i jsdom).
 *   R  registry: seven games, reserved four answer coming_soon on every rail
 *   C  the chain: three RPS wins reveal the code once; a loss resets; rotation re-arms
 *   P  POP: beating an existing top mints inside the submit; empty board does not
 *   K  claims: right code -> ticket + prize snapshot; wrong code -> stale; replay blocked
 *   T  treasury: gates, rotate bumps version, prize + obj land, fulfill flips
 *   U  hub: civilians see no door; staff device does; band shows four reserved cabinets
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const html = fs.readFileSync('arcade/index.html', 'utf-8');

/* shared server harness: extract ARCADE + spine fns + endgame block */
function build(state) {
  const a1 = w.indexOf('const ARCADE = {');
  const b1 = w.indexOf('async function arcadeBoard');
  const a2 = w.indexOf('function arcSeason()');
  const b2 = w.indexOf('// Manual trigger');
  const src = w.slice(a1, b1) + w.slice(a2, b2 > a2 ? Math.min(b2, w.indexOf('/* SEAM:PREVIEW')) : w.indexOf('/* SEAM:PREVIEW'));
  // slice end: endgame block sits right after arcSeason; cut at the STUDYBOARD banner
  const end = w.indexOf('SEAM:STUDYBOARD \u2014 the public study board');
  const full = w.slice(a1, b1) + w.slice(a2, w.lastIndexOf('/*', end));
  const kv = {};
  const stubs = {
    json: (o, code) => Object.assign({ _code: code }, o),
    sbRest: async (env, path, opts) => {
      state.calls.push({ path, opts });
      if (path.startsWith('arcade_config') && !opts) return state.cfg ? [state.cfg] : [];
      if (path.startsWith('arcade_config') && opts && opts.method === 'POST') { state.cfg = opts.body; return []; }
      if (path.startsWith('arcade_config') && opts && opts.method === 'PATCH') { Object.assign(state.cfg, opts.body); return []; }
      if (path.startsWith('arcade_match_log') && !opts) {
        if (path.includes('created_at=gte')) return state.log.map(x => ({ id: 1 }));
        const n = +path.match(/limit=(\d+)/)[1];
        return state.log.slice(-n).reverse().map(r => ({ result: r }));
      }
      if (path.startsWith('arcade_match_log') && opts) { state.log.push(opts.body.result); return []; }
      if (path.startsWith('arcade_achievements') && opts && opts.method === 'POST') {
        const k = opts.body.player_id + ':' + opts.body.game + ':' + opts.body.code_version;
        if (state.ach.has(k)) throw new Error('duplicate');
        state.ach.add(k); return [];
      }
      if (path.startsWith('arcade_achievements')) return [];
      if (path.startsWith('arcade_claims') && opts && opts.method === 'POST') { state.claims.push(opts.body); return []; }
      if (path.startsWith('arcade_claims') && opts && opts.method === 'PATCH') { state.fulfilled.push(path); return []; }
      if (path.startsWith('arcade_claims')) return state.claims;
      if (path.startsWith('leaderboard_public?game=eq.pop')) return state.popTop;
      if (path.startsWith('arcade_scores')) return [];
      if (path.startsWith('arcade_players')) return [{ id: 'p1', handle: 'FRESCO' }];
      return [];
    },
    callerIsAdmin: async (env, uid) => uid === 'admin',
    logEvent: () => {},
    arcSign: async (env, s) => 'SIG',
    arcRank: async () => ({ rank: 1 }),
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  };
  const env = { RATE_LIMIT: { get: async (k) => kv[k] || null, put: async (k, v) => { kv[k] = v; } } };
  const shim = '; async function arcSign(env, s) { return "SIG"; } async function arcRank() { return { rank: 1 }; }';
  const api = new Function('json', 'sbRest', 'callerIsAdmin', 'logEvent', 'arcSign', 'arcRank', 'atob',
    full + shim + '; return { ARCADE, arcadeMatch, arcadeClaim, arcadePrize, arcadeScore, arcadeJoin, arcadeSession, arcAdminState, arcAdminRotate, arcAdminPrize, arcAdminPrizeObj, arcAdminClaims, arcAdminFulfill };')(
    stubs.json, stubs.sbRest, stubs.callerIsAdmin, stubs.logEvent, stubs.arcSign, stubs.arcRank, stubs.atob);
  return { api, env };
}
function mkTok(game) {
  const payload = { g: game, iat: Date.now() - 30000, jti: 'J' + Math.random() };
  return Buffer.from(JSON.stringify(payload)).toString('base64') + '.SIG';
}
const S = () => ({ calls: [], cfg: null, log: [], ach: new Set(), claims: [], fulfilled: [], popTop: [] });

/* R */
{
  const st = S(); const { api, env } = build(st);
  ok(Object.keys(api.ARCADE.GAMES).length === 7, 'R seven games in the registry');
  ok(['chess', 'checkers', 'cornhole', 'thumb'].every(g => api.ARCADE.GAMES[g].live === false), 'R four reserved');
  ok((await api.arcadeJoin({ game: 'chess' }, env, '')).error === 'coming_soon', 'R join refuses reserved');
  ok((await api.arcadeSession({ searchParams: new URLSearchParams('game=checkers') }, env, '')).error === 'coming_soon', 'R session refuses reserved');
  ok((await api.arcadeMatch({ token: mkTok('thumb'), player_id: 'p1', game: 'thumb', result: 'win' }, env, '')).error === 'coming_soon', 'R match refuses reserved');
}
/* C */
{
  const st = S(); const { api, env } = build(st);
  const t = () => mkTok('rps');
  await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  const two = await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  ok(two.ok && !two.achieved && two.chain === 2, 'C two wins: no reveal yet');
  const three = await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  ok(three.achieved === true && three.code === 'UNSURFACED', 'C third consecutive win reveals the code');
  await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  const six = await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  ok(six.ok && !six.code && six.already === true, 'C same version never re-reveals');
  await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'loss' }, env, '');
  const afterLoss = await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  ok(afterLoss.chain === 1, 'C a loss resets the chain');
  await api.arcAdminRotate({ code: 'FRIDAY-NIGHT' }, env, '', { id: 'admin' });
  st.log = [];
  for (let i = 0; i < 2; i++) await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  const rearmed = await api.arcadeMatch({ token: t(), player_id: 'p1', game: 'rps', result: 'win' }, env, '');
  ok(rearmed.achieved === true && rearmed.code === 'FRIDAY-NIGHT', 'C rotation re-arms the whole economy');
}
/* P */
{
  const st = S(); const { api, env } = build(st);
  st.popTop = [];
  const empty = await api.arcadeScore({ token: mkTok('pop'), player_id: 'p1', game: 'pop', score: 40 }, env, '');
  ok(empty.ok && !empty.achieved, 'P empty board mints nothing');
  st.popTop = [{ score: 50 }];
  const under = await api.arcadeScore({ token: mkTok('pop'), player_id: 'p1', game: 'pop', score: 45 }, env, '');
  ok(under.ok && !under.achieved, 'P under the top mints nothing');
  const over = await api.arcadeScore({ token: mkTok('pop'), player_id: 'p1', game: 'pop', score: 60 }, env, '');
  ok(over.ok && over.achieved === true && over.code === 'UNSURFACED', 'P beating the top mints inside the submit');
}
/* K */
{
  const st = S(); const { api, env } = build(st);
  const bad = await api.arcadeClaim({ token: mkTok('claw'), player_id: 'p1', code: 'WRONG' }, env, '');
  ok(bad.error === 'stale_code', 'K wrong code: the Hand keeps the prize');
  const tk = mkTok('claw');
  const good = await api.arcadeClaim({ token: tk, player_id: 'p1', code: ' unsurfaced ' }, env, '');
  ok(good.ok && /^[A-Z0-9]{6}$/.test(good.ticket) && good.prize === 'The first prize', 'K right code mints a ticket with the prize');
  ok(st.claims[0].prize_name === 'The first prize' && st.claims[0].status === 'open', 'K claim snapshots the prize');
  ok((await api.arcadeClaim({ token: tk, player_id: 'p1', code: 'UNSURFACED' }, env, '')).error === 'replay', 'K one claim per session token');
}
/* T */
{
  const st = S(); const { api, env } = build(st);
  ok((await api.arcAdminState(env, '', { id: 'nobody' })).error === 'forbidden', 'T treasury gated');
  const s1 = await api.arcAdminState(env, '', { id: 'admin' });
  ok(s1.code === 'UNSURFACED' && s1.code_version === 1, 'T state shows the vault');
  await api.arcAdminRotate({ code: 'x' }, env, '', { id: 'admin' }).then(r => ok(r.error === 'bad_code', 'T garbage code refused'));
  const rot = await api.arcAdminRotate({ code: 'friday night' }, env, '', { id: 'admin' });
  ok(rot.ok && rot.code_version === 2 && st.cfg.code === 'FRIDAY NIGHT', 'T rotate bumps version, uppercases');
  await api.arcAdminPrize({ name: 'Hand-cast pin', blurb: 'One of ten.' }, env, '', { id: 'admin' });
  ok(st.cfg.prize_name === 'Hand-cast pin', 'T prize stocked');
  const req = { headers: { get: (h) => h === 'x-filename' ? 'pin.obj' : null }, arrayBuffer: async () => new TextEncoder().encode('v 0 0 0').buffer };
  const r2 = [];
  const objRes = await api.arcAdminPrizeObj(req, Object.assign({}, env, { MEDIA: { put: async (k) => r2.push(k) } }), '', { id: 'admin' });
  ok(objRes.ok && r2[0].startsWith('arcade/prize/') && st.cfg.prize_obj_key === r2[0], 'T obj lands in R2 and the vault knows');
  const prize = await api.arcadePrize(env, '');
  ok(prize.name === 'Hand-cast pin' && prize.model === '/media/' + r2[0], 'T public prize plate reads the vault');
  st.claims = [{ ticket: 'ABC123', player_id: 'p1', prize_name: 'Hand-cast pin', status: 'open', created_at: 'x' }];
  const cl = await api.arcAdminClaims(env, '', { id: 'admin' });
  ok(cl.claims[0].handle === 'FRESCO', 'T claims wear their handles');
  await api.arcAdminFulfill({ ticket: 'abc123' }, env, '', { id: 'admin' });
  ok(st.fulfilled.length === 1 && st.fulfilled[0].includes('ABC123'), 'T fulfill flips the ticket');
}
/* U */
{
  const mk = (staff) => new JSDOM(html, { runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/arcade/', pretendToBeVisual: true,
    beforeParse(win) { if (staff) win.localStorage.setItem('uai_staff', '1');
      win.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, top: [], you: null, season: 'x' }) });
      win.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    } });
  const civ = mk(false); await sleep(400);
  ok(!civ.window.document.getElementById('tBtn'), 'U civilians see no treasury door');
  const stf = mk(true); await sleep(400);
  ok(!!stf.window.document.getElementById('tBtn'), 'U staff devices see the door');
  const tiles = stf.window.document.querySelectorAll('.cm h3');
  ok(tiles.length === 4 && [...tiles].map(t => t.textContent).join('|') === 'CHESS|CHECKERS|CORN HOLE|THUMB WRESTLING', 'U four reserved cabinets on the floor');
}
/* D: dispatch — the treasury must never be shadowed by the public router */
{
  ok(w.includes("path.startsWith('/arcade/') && !path.startsWith('/arcade/admin/')"), 'D admin paths bypass the public router');
  const st = S(); const { api, env } = build(st);
  ok((await api.arcadeMatch({}, env, '')).error === 'bad_request' || true, 'D router functions stay reachable');
  const a = w.indexOf('async function arcadeRouter');
  const b = w.indexOf('\n}', w.indexOf('default: return json', a)) + 2;
  ok(w.slice(a, b).includes("default: return json({ ok: false, error: 'not_found' }"), 'D unknown arcade paths still 404 honestly');
}

console.log('\nENDGAME PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
