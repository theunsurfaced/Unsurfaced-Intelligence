// NT2 THE PASS: the morning pass, proved. First the pure parts (the house's clock across both changes of time, the cutoff, the day's
// set, the states the shelf says, the note a reader sees); then the real doorPublish, doorTile, doorRecord, doorReadRoute,
// doorInsightPublic, pushNightly, houseNights and houseNoteRoute with the pass's routes, the chain's step and the cutoff, on a small
// database: a pulled reading leaves the record, the board and the push; a promoted one leads doorPublish; a held one is published
// on a note; a pass twice is a no-op; the unattended path at the cutoff sends what the chain sent, byte for byte; a seat hears its
// space at the same pass or cutoff. Then the wiring, the page and the seams. Run from the repo root: node worker/proofs/proof_net_pass.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
let pass = 0;
function ok(c, m) { if (!c) { console.error('FAIL ' + m); process.exit(1); } pass++; console.log('ok ' + m); }
const w = fs.readFileSync('worker/src/index.js', 'utf-8'), house = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8')), gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8'), toml = fs.readFileSync('worker/wrangler.toml', 'utf-8');
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('slice start missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('slice end missing: ' + b); return s.slice(i, j); };
const DASH = String.fromCharCode(0x2014), LOG = console.log;
const mute = () => { console.log = () => {}; }, unmute = () => { console.log = LOG; };
const hush = async fn => { mute(); try { return await fn(); } finally { unmute(); } };
const clone = x => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const U = s => Date.parse(s);

// ── A: the block, pure ────────────────────────────────────────────────────────────────────────────────────────────
const netSrc = between(w, '/* ═══ SEAM:NET_PASS (NT2 THE PASS)', '/* ═══ SEAM:SPACES (NT1 THE SPACES)');
const mkPure = intl => new Function('Intl', 'sbRest', 'excQuiet', 'doorNight', netSrc + '; return { NET, netUsOffsetH, netLocal, netCutoffAt, netDue, netEventsOf, netNightOf, netOrder, netNoteOf };')(intl, async () => [], () => () => null, () => '2026-10-31');
const N = mkPure(Intl), NR = mkPure({ DateTimeFormat: function () { throw new Error('no zone data'); } });
const SPM = /env\.AI\.run\(|env\.AI\.toMarkdown\(|callModel\(|callClaude\(|claudeBatchSubmit\(|queue\.fal\.run|api\.perplexity\.ai|api\.exa\.ai|api\.tavily\.com|CLAUDE\.API \+/;
ok(netSrc.indexOf(DASH) < 0 && netSrc.indexOf('\\u2014') < 0 && !/–/.test(netSrc) && !SPM.test(netSrc) && !/catch\s*(?:\([^)]*\))?\s*\{\s*\}/.test(netSrc) && !/\.catch\(\(\) => (?:\{\}|null|undefined|\[\]|''|false)\)/.test(netSrc) && !netSrc.includes('space_reads'),
  'A1 the block carries no dash, asks no model and no paid rail, swallows no error and never names a seat\'s private table');
ok(N.netUsOffsetH(U('2026-10-31T12:00:00Z')) === -5 && N.netUsOffsetH(U('2026-11-01T06:59:00Z')) === -5 && N.netUsOffsetH(U('2026-11-01T07:00:00Z')) === -6 && N.netUsOffsetH(U('2026-11-02T13:00:00Z')) === -6 &&
  N.netUsOffsetH(U('2027-03-14T07:59:00Z')) === -6 && N.netUsOffsetH(U('2027-03-14T08:00:00Z')) === -5 && N.netUsOffsetH(U('2026-03-08T07:59:00Z')) === -6 && N.netUsOffsetH(U('2026-03-08T08:00:00Z')) === -5,
  'A2 the US rule: daylight time ends Nov 1, 2026 at 07:00 UTC and begins again Mar 14, 2027 at 08:00 UTC (it began Mar 8, 2026)');
const L = (n, s) => { const l = n.netLocal(U(s)); return l.date + ' ' + String(l.h).padStart(2, '0') + ':' + String(l.m).padStart(2, '0'); };
ok(L(N, '2026-10-31T12:00:00Z') === '2026-10-31 07:00' && L(N, '2026-10-31T11:30:00Z') === '2026-10-31 06:30' && L(N, '2026-11-02T13:00:00Z') === '2026-11-02 07:00' && L(N, '2026-11-02T12:00:00Z') === '2026-11-02 06:00' &&
  L(N, '2026-11-01T06:30:00Z') === '2026-11-01 01:30' && L(N, '2026-11-01T07:30:00Z') === '2026-11-01 01:30' && L(N, '2026-10-31T06:10:00Z') === '2026-10-31 01:10' && L(N, '2026-11-02T06:10:00Z') === '2026-11-02 00:10' && N.netLocal(U('2026-10-31T12:00:00Z')).via === 'intl',
  'A3 the house\'s clock: 07:00 CT is 12:00 UTC on Oct 31 and 13:00 UTC on Nov 2; 01:30 comes twice on Nov 1; the 06:10 UTC chain runs at 01:10 CDT, 00:10 CST');
let agree = 0, total = 0;
mute();
for (let t = U('2026-10-01T00:00:00Z'); t < U('2027-04-01T00:00:00Z'); t += 30 * 60e3) { total++; const a = N.netLocal(t), b = NR.netLocal(t); if (a.date === b.date && a.h === b.h && a.m === b.m && a.via === 'intl' && b.via === 'rule') agree++; }
const ruleCut = [NR.netCutoffAt('2026-10-31'), NR.netCutoffAt('2026-11-02')];
unmute();
ok(total > 8000 && agree === total, 'A4 Intl and the US rule agree on every half hour from Oct 1, 2026 to Apr 1, 2027 (' + total + ' instants across both changes of time): the rule is a true fallback');
ok(N.netCutoffAt('2026-10-31') === '2026-10-31T12:00:00.000Z' && N.netCutoffAt('2026-11-01') === '2026-11-01T13:00:00.000Z' && N.netCutoffAt('2026-11-02') === '2026-11-02T13:00:00.000Z' && N.netCutoffAt('2027-03-13') === '2027-03-13T13:00:00.000Z' &&
  N.netCutoffAt('2027-03-14') === '2027-03-14T12:00:00.000Z' && N.netCutoffAt('nope') === null && ruleCut[0] === '2026-10-31T12:00:00.000Z' && ruleCut[1] === '2026-11-02T13:00:00.000Z',
  'A5 the cutoff is 07:00 in Chicago on the night\'s own date: 12:00 UTC through Oct 31, 13:00 UTC from Nov 1 (the clocks go back at 02:00 that morning) to Mar 13, 12:00 UTC again from Mar 14');
const at = s => N.netLocal(U(s));
ok(!N.netDue(at('2026-10-31T11:30:00Z'), '2026-10-31', false) && N.netDue(at('2026-10-31T12:00:00Z'), '2026-10-31', false) && !N.netDue(at('2026-11-02T12:30:00Z'), '2026-11-02', false) && N.netDue(at('2026-11-02T13:00:00Z'), '2026-11-02', false) &&
  N.netDue(at('2026-10-31T07:00:00Z'), '2026-10-31', true) && !N.netDue(at('2026-11-01T01:00:00Z'), '2026-11-01', false),
  'A6 a night is due at 07:00 CT on its own date (06:30 is not; 12:30 UTC on Nov 2 is 06:30 CST), at once when the house passed it, and never in the evening after the UTC date turns (Nov 1 at 01:00 UTC is Oct 31 in Chicago)');
const rowsO = [
  { id: 'r1', status: 'ready', measures: { recent_7d: 40 }, meta: { move: { rank: 2, size: 55 } } }, { id: 'r2', status: 'ready', measures: { recent_7d: 12 }, meta: { move: { rank: 1, size: null } } },
  { id: 'r3', status: 'ready', measures: { recent_7d: 30 }, meta: {} }, { id: 'r4', status: 'ready', measures: { recent_7d: 50 }, meta: {} },
  { id: 'h1', status: 'failed', error: 'measure_claim: read[0]: x', measures: {}, meta: { move: { rank: 3 } } }, { id: 'p1', status: 'failed', error: 'pulled_by_house', measures: {}, meta: { move: { rank: 4 }, lead: { at: 'z' } } },
  { id: 'u1', status: 'reused', measures: { recent_7d: 90 }, meta: {} }];
const o1 = N.netOrder(rowsO);
ok(o1.lead === 'r2' && o1.lead_by === 'move' && o1.order.join() === 'r2,r1,r4,r3' && o1.order_by === 'move' && o1.pulled.join() === 'p1',
  'A7 by default the lead is the largest move (rank 1; a first read ranks as Infinity) and the deployments follow the ranking; one the ranking never saw follows by its week\'s stories; held, pulled and reused are not deployments');
const rowsP = clone(rowsO); rowsP[2].meta.lead = { by: 'fresco', at: '2026-10-31T11:00:00Z' }; rowsP[3].meta.lead = { by: 'fresco', at: '2026-10-31T10:00:00Z' };
const o2 = N.netOrder(rowsP);
ok(o2.lead === 'r3' && o2.lead_by === 'house' && o2.order.join() === 'r3,r2,r1,r4', 'A8 the house\'s promotion leads (the latest when two say so; a pulled row never leads) and the ranking follows under it');
const rowsH = clone(rowsO); rowsH[3].meta.pos = 1; rowsH[2].meta.pos = 2; rowsH[0].meta.pos = 3;
const o3 = N.netOrder(rowsH);
ok(o3.lead === 'r2' && o3.order.join() === 'r2,r4,r3,r1' && o3.order_by === 'house' && N.netOrder([]).lead === null && N.netOrder([]).order.length === 0,
  'A9 the house\'s order holds under the lead; a deployment it did not place follows; a night with no deployment has no lead');
const NIGHT = '2026-10-31';
const evs = [
  { id: 5, event: 'night_held', created_at: '2026-10-31T06:14:00Z', meta: { night: NIGHT } },
  { id: 9, event: 'night_pass', created_at: '2026-10-31T11:40:00Z', meta: { night: NIGHT, by: 'fresco', auto: false, lead: 'r2', lead_by: 'move', order: ['r2', 'r1'], order_by: 'move', pulled: [], pending: 0 } },
  { id: 10, event: 'night_pass', created_at: '2026-10-31T11:41:00Z', meta: { night: NIGHT, by: 'second' } },
  { id: 11, event: 'night_send', created_at: '2026-10-31T11:40:05Z', meta: { night: NIGHT, by: 'house' } },
  { id: 12, event: 'night_sent', created_at: '2026-10-31T11:40:09Z', meta: { night: NIGHT, by: 'house', late: 0, push: { readers: 3, matched: 2 } } },
  { id: 3, event: 'door_pass', created_at: '2026-10-31T06:12:00Z', meta: {} }, { id: 4, event: 'night_held', created_at: '2026-10-30T06:12:00Z', meta: { night: '2026-10-30' } }];
const sAt = (list, s) => N.netNightOf(list, NIGHT, U(s), NIGHT);
const s0 = sAt([], '2026-10-31T05:00:00Z'), s1 = sAt(evs.slice(0, 1), '2026-10-31T07:00:00Z'), s2 = sAt(evs.slice(0, 3), '2026-10-31T11:40:01Z'), s3 = sAt(evs.slice(0, 4), '2026-10-31T11:45:00Z'), s3b = sAt(evs.slice(0, 4), '2026-10-31T12:00:00Z'), s4 = sAt(evs, '2026-10-31T12:00:00Z');
const other = N.netNightOf(evs, '2026-10-30', U('2026-10-31T12:00:00Z'), NIGHT);
ok(s0.state === 'none' && s1.state === 'open' && s1.held_at === '2026-10-31T06:14:00Z' && s1.cutoff_at === '2026-10-31T12:00:00.000Z' && s2.state === 'passed' && s2.pass.by === 'fresco' && s3.state === 'sending' && s3b.state === 'passed' &&
  s4.state === 'sent' && s4.pass.by === 'fresco' && s4.sent.told === 2 && s4.sent.readers === 3 && s4.current === true && other.state === 'open' && other.current === false,
  'A10 the shelf\'s states: none, open (held, with the cutoff\'s instant), passed (the first pass stands), sending (a live claim), passed again once the claim is older than the lease, sent; a record of another night is that night\'s');
ok(N.netNoteOf({ notes: [{ n: 1, text: 'open one', status: 'open' }, { n: 2, text: 'Read the shelf first', status: 'applied', applied_by: 'fresco', applied_at: '2026-10-31T11:00:00Z' }, { n: 3, text: 'Later', status: 'applied', applied_at: '2026-10-31T11:30:00Z' }] }).text === 'Later' &&
  JSON.stringify(N.netNoteOf({ notes: [{ n: 2, text: 'The fall is the story.', status: 'applied', by: 'fresco', applied_by: 'fresco', applied_at: '2026-10-31T11:00:00Z' }] })) === '{"text":"The fall is the story.","at":"2026-10-31"}' && N.netNoteOf({ notes: [{ n: 1, text: 'x', status: 'open' }] }) === null && N.netNoteOf(null) === null,
  'A11 the note a reader sees is the latest applied one: its text and its date, never who wrote or applied it');

// ── B: the night, run: the real door, record, push and shelf with the pass on a small database ──────────────────────
const doorSrc = between(w, 'const DOOR = { WANT: 30', 'async function excavateFeed(env, origin) {');
const keepSrc = between(w, '// PURE: what a subject keeps:', '/* The voices alone');
const houseSrc = between(w, 'const HOUSE = {', 'async function readRoute(');
const spacesSrc = between(w, '/* ═══ SEAM:SPACES (NT1 THE SPACES)', '/* ═══ SEAM:ENTITY_ROOM (RM1): the rooms on the graph.');
const prelude = "const doorVoices = async () => []; const DOOR_VOICES = { KEEP: 6, PASS_MS: 120000, FRESH_D: 90 }; const doorVoicePick = q => (q || []).slice(0, 6); const ledgerPut = async () => 0; const ledgerDoorRows = () => []; const peopleLedger = async () => 0;\n";
const tonight = new Date().toISOString().slice(0, 10), yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10), weekday = new Date().getUTCDay();
const ADMIN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', UA = '11111111-1111-4111-8111-111111111111', UB = '22222222-2222-4222-8222-222222222222', US = '33333333-3333-4333-8333-333333333333';
const ID = n => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const R1 = ID(1), R2 = ID(2), R3 = ID(3), H1 = ID(4), F1 = ID(5), RU = ID(6), P0 = ID(7), PT = ID(8), S1 = ID(9), H2 = ID(10);
const readOf = (head, move) => ({ read: [head, 'The dek, one figure.'], insights: [{ category: 'market', title: head + ', the finding', excerpt: 'The story says so.', evidence: [1], confidence: 'Medium' }], ideas: [{ type: 'Channel', headline: move, body: 'b' }], brief: 'Where it is.', question: 'What moved?' });
const evOf = n => Array.from({ length: n }, (_, i) => ({ title: 'Line ' + i, url: 'https://lake.example/' + i, source: 'outlet' + (i % 3), published_at: new Date(Date.now() - (i + 1) * 864e5).toISOString(), tier: 2, text: 'x' }));
const rowOf = (id, o) => Object.assign({ id, frame_key: 'k' + id.slice(-2), night: tonight, status: 'ready', error: null, frame: {}, measures: { recent_7d: 10, prior_7d: 4, outlets: 5, series: [1, 2, 3] }, read: null, evidence: evOf(6), meta: {}, cost_usd: 0.02, created_at: tonight + 'T06:20:00Z' }, o);
const claimOf = (rid, frame) => ({ id: 'c-' + rid.slice(-2), src: 'door', reading_id: rid, idx: 0, claim: 'A finding', confidence: 'Medium', on_record: true, night: tonight, frame });
let T, nid = 1000;
function fresh() {
  T = { door: [
      rowOf(R1, { frame_key: 'track:costco', frame: { entity: 'Costco', category: 'Retail', audience: 'Families' }, measures: { recent_7d: 40, prior_7d: 20, outlets: 12, series: [1, 2] }, read: readOf('Costco shoppers bought the bulk shelf first', 'Stock the bulk shelf'), meta: { move: { rank: 2, size: 55 }, prev_id: P0 } }),
      rowOf(R2, { frame_key: 'track:apple', frame: { entity: 'Apple', category: 'Technology' }, measures: { recent_7d: 12, prior_7d: 2, outlets: 6 }, read: readOf('Apple buyers waited for the fold', 'Hold the fold'), meta: { move: { rank: 1, size: null } } }),
      rowOf(R3, { frame_key: 'track:nike', frame: { entity: 'Nike', category: 'Athletic footwear' }, measures: { recent_7d: 30, prior_7d: 28, outlets: 9 }, read: readOf('Nike runners asked for the plain shoe', 'Ship the plain shoe'), meta: {} }),
      rowOf(H1, { frame_key: 'track:target', status: 'failed', error: 'measure_claim: read[0]: signals fell this week', frame: { entity: 'Target', category: 'Retail' }, measures: { recent_7d: 2, outlets: 3 }, read: readOf('Target shoppers left the aisle', 'Reset the aisle'), meta: { move: { rank: 3, size: 31 }, prev_id: PT } }),
      rowOf(H2, { frame_key: 'track:zara', status: 'failed', error: 'measure_claim: read[0]: a count', frame: { entity: 'Zara' }, read: null, meta: {} }),
      rowOf(F1, { frame_key: 'cat:beauty', status: 'failed', error: 'thin_evidence', frame: { category: 'Beauty' }, measures: {}, read: null, evidence: [], meta: {} }),
      rowOf(RU, { frame_key: 'track:mielle', status: 'reused', frame: { entity: 'Mielle', category: 'Hair care' }, measures: { recent_7d: 9, outlets: 4 }, read: readOf('Mielle buyers kept the oil', 'Keep the oil'), meta: {} }),
      rowOf(P0, { frame_key: 'track:costco', night: yday, frame: { entity: 'Costco', category: 'Retail' }, read: readOf('Costco, the night before', 'x'), meta: {}, created_at: yday + 'T06:20:00Z' }),
      rowOf(PT, { frame_key: 'track:target', night: yday, frame: { entity: 'Target', category: 'Retail' }, read: readOf('Target, the night before', 'x'), meta: {}, created_at: yday + 'T06:20:00Z' })],
    space: [{ id: S1, frame_key: 'brand:acme', night: tonight, status: 'ready', frame: { entity: 'Acme' }, measures: { recent_7d: 9, prior_7d: 3, outlets: 4 }, read: readOf('Acme buyers came back', 'Call them back'), evidence: evOf(5), meta: { space: { key: 'brand:acme', name: 'Acme', kind: 'brand', private: true }, since: { recent_delta: 6 } } }],
    claims: [claimOf(R1, { entity: 'Costco' }), claimOf(R2, { entity: 'Apple' }), claimOf(R3, { entity: 'Nike' }), claimOf(P0, { entity: 'Costco' })],
    events: [], jobs: [], pushlog: [], mail: [], hooks: [], briefs: [], logs: [], patches: [], paths: [], kv: {},
    profiles: [
      { user_id: UA, email: 'a@x.test', role_title: 'strategy', tracked_brands: ['Costco'], follows: [{ kind: 'brand', value: 'Apple' }], push_email: true, digest_day: weekday },
      { user_id: UB, email: 'b@x.test', tracked_brands: ['Nike', 'Target'], follows: [], push_email: false, slack_webhook: 'https://hooks.example/b', digest_day: 9 },
      { user_id: US, email: 's@x.test', tracked_brands: ['Acme'], follows: [], push_email: true, digest_day: 9 }],
    spaces: [{ id: 'sp1', key: 'brand:acme', name: 'Acme', held_by: US, holder_kind: 'seat', status: 'active' }] };
}
const resolve = (row, key) => { let v = row; for (const p of key.split(/->>?/)) v = v == null ? undefined : v[p]; return v; };
function filt(rows, path) {
  const q = path.split('?')[1] || ''; let out = rows.slice();
  for (const kv of q.split('&')) {
    if (!kv) continue;
    const i = kv.indexOf('='), k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1));
    if (['select', 'limit', 'order', 'on_conflict'].includes(k)) continue;
    const val = r => resolve(r, k);
    if (v === 'not.is.null') out = out.filter(r => val(r) != null);
    else if (v === 'is.null') out = out.filter(r => val(r) == null);
    else if (v.startsWith('in.(')) { const set = v.slice(4, -1).split(',').map(x => x.replace(/^"|"$/g, '')); out = out.filter(r => set.includes(String(val(r)))); }
    else if (v.startsWith('eq.')) out = out.filter(r => val(r) != null && String(val(r)) === v.slice(3));
    else if (v.startsWith('neq.')) out = out.filter(r => String(val(r)) !== v.slice(4));
    else if (v.startsWith('lt.')) out = out.filter(r => val(r) != null && String(val(r)) < v.slice(3));
    else if (v.startsWith('gte.')) out = out.filter(r => val(r) != null && String(val(r)) >= v.slice(4));
    else throw new Error('filter not faked: ' + kv);
  }
  const ord = (q.match(/(?:^|&)order=([^&]+)/) || [])[1];
  if (ord) { const keys = ord.split(',').map(x => x.split('.')); out.sort((a, b) => { for (const [c, d] of keys) { const x = a[c], y = b[c]; if (x === y) continue; return (x < y ? -1 : 1) * (d === 'desc' ? -1 : 1); } return 0; }); }
  const lim = (q.match(/(?:^|&)limit=(\d+)/) || [])[1]; if (lim) out = out.slice(0, Number(lim));
  const sel = (q.match(/(?:^|&)select=([^&]+)/) || [])[1];
  return out.map(r => { const c = clone(r); if (sel) for (const s of sel.split(',')) { const m = /^(\w+):(.+)$/.exec(s); if (m) c[m[1]] = clone(resolve(r, m[2])); } return c; });
}
async function db(env, path, opts) {
  const m = (opts && opts.method) || 'GET', tab = path.split('?')[0]; T.paths.push(m + ' ' + path);
  const TABS = { door_reads: T.door, space_reads: T.space, claims: T.claims, activity_events: T.events, claude_jobs: T.jobs, client_profile: T.profiles, push_log: T.pushlog, spaces: T.spaces, insight_marks: [] };
  if (tab === 'rpc/link_claim_entities') return [{ links_made: 0 }];
  if (m === 'POST' && tab === 'activity_events') { if (T.failEvents) throw new Error('sb_503'); const row = Object.assign({ id: ++nid, created_at: new Date().toISOString() }, clone(opts.body)); T.events.push(row); return /representation/.test((opts.headers && opts.headers.Prefer) || '') ? [clone(row)] : null; }
  if (m === 'POST' && tab === 'push_log') { T.pushlog.push(...clone(opts.body)); return null; }
  if (m === 'POST' && tab === 'claims') { const back = []; for (const r of opts.body) { let c = T.claims.find(x => x.src === r.src && x.reading_id === r.reading_id && x.idx === r.idx); if (c) Object.assign(c, clone(r)); else { c = Object.assign({ id: 'c' + (++nid) }, clone(r)); T.claims.push(c); } back.push({ id: c.id }); } return back; }
  if (m === 'PATCH') { const ids = filt(TABS[tab], path).map(r => r.id); for (const r of TABS[tab]) if (ids.includes(r.id)) Object.assign(r, clone(opts.body)); T.patches.push({ tab, path, body: clone(opts.body) }); return null; }
  if (m === 'GET') return TABS[tab] ? filt(TABS[tab], path) : [];
  throw new Error('not faked: ' + m + ' ' + path);
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const INJ = {
  sbRest: db, excQuiet: (where, v) => () => v, json: (o, st) => Object.assign({ status: st || 200 }, o), logEvent: async (env, pf, sp, ev, sid, meta) => { T.logs.push([ev, meta]); },
  excFrameLabel: f => f.entity ? f.entity + ' in ' + String(f.category || '').toLowerCase() : (f.title || f.category || 'Frame'), calendarAhead: () => null,
  extractJson: s => { try { return JSON.parse(s); } catch (e) { return null; } }, sendEmail: async (env, msg) => { T.mail.push(clone(msg)); return { ok: true }; },
  fetch: async (url, o) => { T.hooks.push({ url, body: o && o.body }); return { ok: true }; },
  callClaude: async (env, tier, o) => { T.briefs.push(o.kind); return { ok: true, text: JSON.stringify({ lines: ['Costco moved first this week.', 'Apple waited for the fold.', 'Start with the bulk shelf.'] }) }; },
  callerIsAdmin: async (env, uid) => uid === ADMIN, authenticate: async req => req.user || null, esc, EXC_BLIND: 'BLIND', CLAUDE: { TIERS: { live: { model: 'claude-sonnet-5' } } }
};
const D = new Function(...Object.keys(INJ), prelude + keepSrc + doorSrc + '\n' + houseSrc + '\n' + netSrc + '\n' + spacesSrc +
  '; return { NET, doorPublish, doorRecord, doorTile, doorReadRoute, doorInsightPublic, pushNightly, houseNights, houseNoteRoute, netPassRoute, netNightSend, netCutoff, netSend, netPassWrite, netCutoffAt, netEvent, doorNight };')(...Object.values(INJ));
const env = { RATE_LIMIT: { get: async k => (T.kv[k] == null ? null : T.kv[k]), put: async (k, v) => { T.kv[k] = v; }, delete: async k => { delete T.kv[k]; } }, APP_URL: 'https://x.test' };
const fresco = { id: ADMIN, email: 'fresco@unsurfaced.example' };
const route = (path, body) => hush(() => D.netPassRoute(path, body, env, '', fresco));
const board = () => JSON.parse(T.kv['door:v2'] || 'null');
const byId = id => T.door.find(r => r.id === id);
const mailTo = to => T.mail.filter(x => x.to === to);
const cutT = U(D.netCutoffAt(tonight));
D.NET.PASS = true;

// B1 the board before the pass: the tiles as they stood, the lead the largest move, the order the ranking, no pass
fresh();
await hush(() => D.doorPublish(env));
let b = board();
ok(b && b.tiles.map(t => t.id).join() === [R1, R3, R2, RU].join() && b.lead === R2 && b.order.join() === [R2, R1, R3, RU].join() && b.pass === null && b.tiles.every(t => t.house_note === null),
  'B1 doorPublish keeps its tiles and their order (stories this week) and adds the day\'s lead (the largest move, rank 1), the order of every tile (the deployments by the ranking, then the reused) and no pass yet');

// B2 a promoted one leads doorPublish; one lead a night; dropped, the move leads again
const pr3 = await route('/reads/night-promote', { id: R3 });
b = board();
const lead3 = b.lead === R3 && b.order[0] === R3 && b.order.join() === [R3, R2, R1, RU].join();
const pr1 = await route('/reads/night-promote', { id: R1 });
b = board();
const lead1 = b.lead === R1 && !byId(R3).meta.lead && byId(R1).meta.lead && byId(R1).meta.lead.by === 'fresco';
const off1 = await route('/reads/night-promote', { id: R1, off: true });
b = board();
ok(pr3.ok && pr3.lead && lead3 && pr1.ok && lead1 && off1.ok && off1.lead === false && b.lead === R2 && !byId(R1).meta.lead && (await route('/reads/night-promote', { id: H1 })).error === 'not_deployed',
  'B2 a promoted reading leads doorPublish with the ranking under it; promoting another takes the lead from the first (one lead a night); dropped, the largest move leads again; a held reading cannot lead');

// B3 a pulled reading leaves the record, the board, the public link and the push; put back, it returns
fresh();
const recBefore = await hush(() => D.doorRecord(env));
await hush(() => D.pushNightly(env));
const mailBefore = mailTo('a@x.test').map(x => x.html).join(' ');
fresh();
T.kv['record:v1'] = '{"cached":true}';
const pulled = await route('/reads/night-pull', { id: R2, why: 'The fold story is a rumor' });
const r2 = byId(R2), c2 = T.claims.find(c => c.reading_id === R2);
ok(pulled.ok && pulled.pulled && r2.status === 'failed' && r2.error === 'pulled_by_house' && r2.read && r2.meta.pulled.by === 'fresco' && r2.meta.pulled.on_record === true && r2.meta.pulled.why === 'The fold story is a rumor' && c2 && c2.on_record === false && !('record:v1' in T.kv),
  'B3 a pull is the row held by the house (failed, pulled_by_house): the row, its read and its claims kept, the claims off the record, why it was pulled and who on the row, the record\'s cache cleared');
const recAfter = await hush(() => D.doorRecord(env));
b = board();
await hush(() => D.pushNightly(env));
const mailAfter = mailTo('a@x.test').map(x => x.html).join(' ');
ok(recBefore.tiles.some(t => t.id === R2) && !recAfter.tiles.some(t => t.id === R2) && !b.tiles.some(t => t.id === R2) && b.lead === R1 && !b.order.includes(R2) && (await hush(() => D.doorInsightPublic(env, R2))) === null &&
  /Apple buyers waited for the fold/.test(mailBefore) && !/Apple buyers waited for the fold/.test(mailAfter) && /Costco shoppers bought the bulk shelf first/.test(mailAfter),
  'B4 the pulled reading leaves the record, the board (the next move leads), its public link and the push: the reader who follows Apple hears Costco and not the fold');
const back = await route('/reads/night-publish', { id: R2 });
const recBack = await hush(() => D.doorRecord(env));
ok(back.ok && back.from === 'pulled' && byId(R2).status === 'ready' && byId(R2).error === null && !byId(R2).meta.pulled && byId(R2).meta.published.from === 'pulled' && T.claims.find(c => c.reading_id === R2).on_record === true && recBack.tiles.some(t => t.id === R2) && board().lead === R2 &&
  (await route('/reads/night-pull', { id: H1 })).error === 'not_deployed' && (await route('/reads/night-pull', { id: R2, why: 'A ' + DASH + ' dash' })).error === 'em_dash',
  'B5 put back, the reading is a deployment again: on the record, its claims on the record, the lead again by its rank; only a deployment is pulled, and a why in the house voice');

// B6 a held reading is published on a house note: the landing the hold stopped; never a failed row with no read
fresh();
const noNote = await route('/reads/night-publish', { id: H1 });
const pub = await route('/reads/night-publish', { id: H1, note: 'The fall is the story and the count is the lake\'s own' });
const h1 = byId(H1), hClaims = T.claims.filter(c => c.reading_id === H1);
const recH = await hush(() => D.doorRecord(env));
ok(noNote.error === 'note_first' && pub.ok && pub.from === 'held' && pub.in_push === true && h1.status === 'ready' && h1.error === null && h1.meta.notes.length === 1 && h1.meta.notes[0].status === 'open' && h1.meta.published.from === 'held' && h1.meta.published.note === 1 &&
  hClaims.length === 1 && hClaims[0].on_record === true && byId(PT).meta.developed_by === H1 && recH.tiles.some(t => t.id === H1),
  'B6 a held reading is refused without a house note, then published on one: ready, its findings written as claims on the record and the reading it develops marked, as the landing would have; on the record and in tonight\'s push');
ok((await route('/reads/night-publish', { id: F1 })).error === 'not_held' && (await route('/reads/night-publish', { id: H2, note: 'It stands, the count is ours' })).error === 'no_read' && (await route('/reads/night-publish', { id: R1 })).error === 'already_deployed' &&
  (await route('/reads/night-publish', { id: S1 })).error === 'not_found' && (await route('/reads/night-pull', { id: S1 })).error === 'not_found' && (await route('/reads/night-publish', { id: 'nope' })).error === 'bad_id',
  'B7 never a failed row with no read: a thin row is not held and a held row without its read is refused; a deployment is not published twice; a seat\'s private reading is not on the house\'s doors');

// B8 the order: the house's under the lead; back to the ranking
fresh();
const ord = await route('/reads/night-order', { night: tonight, ids: [R2, R3, R1] });
b = board();
const housed = b.order.join() === [R2, R3, R1, RU].join() && byId(R3).meta.pos === 2;
const bad = await route('/reads/night-order', { night: tonight, ids: [R2, H1] });
const reset = await route('/reads/night-order', { night: tonight, reset: true });
ok(ord.ok && ord.order_by === 'house' && housed && bad.error === 'not_deployed' && reset.ok && reset.order_by === 'move' && board().order.join() === [R2, R1, R3, RU].join() && byId(R3).meta.pos === undefined && (await route('/reads/night-order', { night: tonight, ids: [R1, R1] })).error === 'bad_order',
  'B8 the house\'s order holds on the board under the lead; only deployments are ordered, each once; back to the ranking clears it');

// B9 a note applied rides the tile and the deep dive, its text and date only; the note law still holds
fresh();
const pinned = await hush(() => D.houseNoteRoute({ id: R1, text: 'Bulk is the week, not the shelf' }, env, '', fresco));
const ap = await route('/reads/night-apply', { id: R1, n: 1 });
b = board();
const deep = await hush(() => D.doorReadRoute({ url: 'https://x.test/excavate/door/read?id=' + R1, user: { id: UA } }, env, ''));
const drop = await hush(() => D.houseNoteRoute({ id: R1, drop: true, n: 1 }, env, '', fresco));
const tileNote = (b.tiles.find(t => t.id === R1) || {}).house_note;
const apOff = await route('/reads/night-apply', { id: R1, n: 1, off: true });
ok(pinned.ok && ap.ok && ap.applied && tileNote && tileNote.text === 'Bulk is the week, not the shelf' && tileNote.at === tonight && !('by' in tileNote) && deep.ok && deep.data.house_note && deep.data.house_note.text === tileNote.text &&
  drop.error === 'already_applied' && apOff.ok && apOff.applied === false && board().tiles.find(t => t.id === R1).house_note === null && (await route('/reads/night-apply', { id: R1, n: 9 })).error === 'no_such_note',
  'B9 an applied note rides the board\'s tile and the deep dive\'s payload (its text and date, never who), an applied note is not dropped (RD1d\'s law), and withdrawn it leaves both');

// B10 the pass: refused before the chain holds the night; then written once, published and sent; a pass twice is a no-op
fresh();
const early = await route('/reads/night-pass', { night: tonight });
const held = await hush(() => D.netNightSend(env));
const mailAtHold = T.mail.length;
const p1 = await route('/reads/night-pass', { night: tonight });
const passRec = T.events.filter(e => e.event === 'night_pass'), sentRec = T.events.filter(e => e.event === 'night_sent');
const mailAtPass = T.mail.length, hooksAtPass = T.hooks.length;
const p2 = await route('/reads/night-pass', { night: tonight });
const cAfter = await hush(() => D.netCutoff(env, { now: cutT + 3600e3 }));
b = board();
ok(early.error === 'not_ready_to_pass' && held.held && mailAtHold === 0 && p1.ok && p1.pass.lead === R2 && p1.pass.lead_by === 'move' && p1.pass.order.join() === [R2, R1, R3].join() && p1.send.sent === true &&
  passRec.length === 1 && passRec[0].meta.by === 'fresco' && passRec[0].meta.auto === false && passRec[0].meta.deployments === 3 && passRec[0].meta.pending === 0 && sentRec.length === 1 && sentRec[0].meta.by === 'house' && mailAtPass > 0,
  'B10 the chain holds the night (no send at 06:10); before that the pass is refused; Pass and send writes the day\'s set once (the lead, the order, by whom), publishes it and sends it through pushNightly');
ok(p2.ok && p2.already === true && T.events.filter(e => e.event === 'night_pass').length === 1 && T.mail.length === mailAtPass && T.hooks.length === hooksAtPass && cAfter.skipped === 'sent' &&
  b.pass && b.pass.night === tonight && b.pass.by === 'house' && !JSON.stringify(b.pass).includes('fresco') && (await route('/reads/night-pass', { night: yday })).error === 'not_tonight',
  'B11 a pass twice is a no-op: no second record, no second send, and the cutoff finds the night sent; the board says passed by the house, never by whom; only tonight is passed');

// B12 compiles still out: the pass waits for them; the drain lands them; the next half hour sends
fresh();
await hush(() => D.netNightSend(env));
T.jobs.push({ id: 'j1', kind: 'door_read', status: 'submitted', created_at: tonight + 'T06:15:00Z' }, { id: 'j0', kind: 'door_read', status: 'submitted', created_at: yday + 'T06:15:00Z' });
const pw = await route('/reads/night-pass', { night: tonight });
const w1 = await hush(() => D.netCutoff(env, { now: cutT }));
const mailWaiting = T.mail.length;
T.jobs[0].status = 'done';
const w2 = await hush(() => D.netCutoff(env, { now: cutT + 1800e3 }));
ok(pw.ok && pw.send.waiting === 1 && w1.waiting === 1 && w1.passed === true && mailWaiting === 0 && w2.sent === true && w2.by === 'house' && T.events.find(e => e.event === 'night_sent').meta.by === 'house' && T.mail.length > 0,
  'B12 a pass with a compile still out waits (a job from the night before does not count); once the drain lands it, the next half hour sends the house\'s pass');

// B13 the cutoff: nobody passed; before 07:00 CT nothing; at 07:00 the night is passed as it stands and sent; late compiles wait to the day's last hour
fresh();
await hush(() => D.netNightSend(env));
const c0 = await hush(() => D.netCutoff(env, { now: cutT - 1800e3 }));
const promoted = await route('/reads/night-promote', { id: R3 });
const c1 = await hush(() => D.netCutoff(env, { now: cutT }));
const autoRec = T.events.find(e => e.event === 'night_pass');
ok(c0.skipped === 'before_cutoff' && promoted.ok && c1.sent === true && c1.by === 'cutoff' && autoRec.meta.auto === true && autoRec.meta.by === 'cutoff' && autoRec.meta.lead === R3 && autoRec.meta.lead_by === 'house' && T.mail.length > 0 && board().pass.by === 'cutoff',
  'B13 nobody passed: at 06:30 CT the cutoff waits; at 07:00 CT it passes the night as it stands (a lead the house set stands) and sends it');
fresh();
await hush(() => D.netNightSend(env));
T.jobs.push({ id: 'j2', kind: 'door_read', status: 'submitted', created_at: tonight + 'T06:15:00Z' });
const lateDay = U(tonight + 'T23:00:00Z');
const l0 = await hush(() => D.netCutoff(env, { now: cutT + 3 * 3600e3 })), mailL0 = T.mail.length, l1 = await hush(() => D.netCutoff(env, { now: lateDay }));
ok(l0.waiting === 1 && mailL0 === 0 && l1.sent === true && l1.late === 1 && T.events.find(e => e.event === 'night_sent').meta.late === 1,
  'B14 a night whose batch has not landed waits past 07:00 CT; at the UTC day\'s last hour it sends what is ready and says how many were still compiling');

// B15 the unattended path is today's path byte for byte: the chain's push (the pass off) and the cutoff's send on the same database
fresh();
D.NET.PASS = false;
const chainOut = await hush(() => D.netNightSend(env));
const A = JSON.stringify({ mail: T.mail, hooks: T.hooks, pushlog: T.pushlog, briefs: T.briefs });
const chainSent = T.events.find(e => e.event === 'night_sent');
const offCut = await hush(() => D.netCutoff(env, { now: cutT }));
const offPass = await route('/reads/night-pass', { night: tonight });
const offMail = T.mail.length;
fresh();
D.NET.PASS = true;
const heldNow = await hush(() => D.netNightSend(env));
const atHold = T.mail.length + T.hooks.length + T.pushlog.length;
const before7 = await hush(() => D.netCutoff(env, { now: cutT - 1800e3 }));
const atSeven = await hush(() => D.netCutoff(env, { now: cutT }));
const B = JSON.stringify({ mail: T.mail, hooks: T.hooks, pushlog: T.pushlog, briefs: T.briefs });
ok(chainOut && chainOut.readers === 3 && chainSent && chainSent.meta.by === 'chain' && heldNow.held && atHold === 0 && before7.skipped === 'before_cutoff' && atSeven.sent && atSeven.by === 'cutoff' && A === B && A.length > 400 &&
  JSON.parse(A).mail.length >= 2 && JSON.parse(A).hooks.length === 1 && JSON.parse(A).briefs.length === 1,
  'B15 the unattended path is today\'s path byte for byte: on the same database the cutoff at 07:00 CT sends exactly the emails, the webhook, the push log and the Monday brief the chain sent at its end (' + A.length + ' bytes)');
ok(offCut.skipped === 'off' && offPass.ok && offPass.send.off === true && offMail === JSON.parse(A).mail.length,
  'B16 NET.PASS false is the chain\'s send, as before: the half hour\'s check stands aside, and a pass writes the day\'s set without sending again');
const seatHeard = JSON.parse(B).mail.find(x => x.to === 's@x.test');
ok(seatHeard && /your space moved: Acme/.test(seatHeard.html) && !JSON.parse(B).mail.some(x => x.to !== 's@x.test' && /Acme buyers came back/.test(x.html)),
  'B17 a seat\'s private reading is never passed by the house; its "your space moved" push waits for the same pass or cutoff, and nobody else hears it');

// B18 one send: two senders at once send once; a sender that died is taken over after the lease; a log that cannot hold the night sends as before
fresh();
await hush(() => D.netNightSend(env));
await hush(() => D.netPassWrite(env, tonight, 'fresco', false));
const pair = await hush(() => Promise.all([D.netSend(env, tonight, 'house', 0), D.netSend(env, tonight, 'cutoff', 0)]));
const onceMail = T.mail.length;
ok(pair.filter(x => x.sent).length === 1 && pair.filter(x => x.already === 'sending').length === 1 && T.events.filter(e => e.event === 'night_sent').length === 1 && onceMail === 2,
  'B18 two senders at the same moment: the earliest claim on the log sends, the other stands aside; pushNightly runs once');
fresh();
await hush(() => D.netNightSend(env));
T.events.push({ id: ++nid, event: 'night_send', created_at: new Date(Date.now() - 20 * 60e3).toISOString(), meta: { night: tonight, by: 'house' } });
const takeover = await hush(() => D.netCutoff(env, { now: cutT })), takeSent = T.events.filter(e => e.event === 'night_sent').length;
fresh(); T.failEvents = true;
const unheld = await hush(() => D.netNightSend(env));
ok(takeover.sent === true && takeSent === 1 && unheld && unheld.readers === 3 && T.mail.length === 2,
  'B19 a claim older than the lease is a sender that died: the next half hour sends; a log that cannot hold the night sends at the chain\'s end, as before');

// B20 the shelf: the night's state, the set and tonight's compiles; a pulled row held by the house
fresh();
await hush(() => D.netNightSend(env));
await route('/reads/night-pull', { id: R3 });
const sh = await hush(() => D.houseNights(env, 7));
const g0 = sh.nights.find(g => g.night === tonight), pr = g0.rows.find(r => r.id === R3), r2s = g0.rows.find(r => r.id === R2);
ok(sh.pass && sh.pass.on === true && sh.pass.cutoff_at === D.netCutoffAt(tonight) && g0.net && g0.net.state === 'open' && g0.net.current === true && g0.net.lead === R2 && g0.net.order.join() === [R2, R1].join() && g0.net.pulled.join() === R3 && g0.net.pending === 0 &&
  pr.pulled === true && pr.held === true && pr.pulled_by === 'fresco' && g0.counts.held === 3 && r2s.rank === 1 && r2s.lead === false && g0.net.cutoff_at === D.netCutoffAt(tonight),
  'B20 the shelf carries the night\'s pass (open, tonight, the cutoff\'s instant, the compiles out) and the live set; a pulled deployment is held by the house, with who pulled it; a row carries its rank');

// ── C: the wiring ───────────────────────────────────────────────────────────────────────────────────────────────────
const sched = between(w, 'async scheduled(', 'async fetch(');
ok(/\.then\(\(\) => doorCalled\(env\)\)[\s\S]*\.then\(\(\) => netNightSend\(env\)\)   \/\/ SEAM:REACH_PUSH[^\n]*\n\s+\.then\(s => console\.log\('push_nightly', JSON\.stringify\(s\)\)\)\n\s+\.catch\(e => console\.log\('push_nightly_error'/.test(sched) && !/\.then\(\(\) => pushNightly\(env\)\)/.test(sched) &&
  (sched.match(/netCutoff\(env\)/g) || []).length === 1 && sched.indexOf('netCutoff(env)') > sched.indexOf('claudeBatchDrain(env)') && sched.indexOf('netCutoff(env)') < sched.indexOf('readTick(env, { deep: true, t0 })') && sched.indexOf('netCutoff(env)') > sched.indexOf("} else {"),
  'C1 the 06:10 chain holds the night where it sent; the half hour\'s check runs once, in the 30-minute chain, after the drain and before the deep tick');
ok(/crons = \["\*\/30 \* \* \* \*", "15 5 \* \* \*", "10 6 \* \* \*"\]/.test(toml), 'C2 no new trigger: the cutoff rides the half-hour cron the drain rides');
ok(/case '\/reads\/pdf':           return readRoute\(path, body, env, origin, user\);\n        case '\/reads\/night-publish': \/\/ SEAM:NET_PASS[^\n]*\n        case '\/reads\/night-promote':\n        case '\/reads\/night-pull':\n        case '\/reads\/night-order':\n        case '\/reads\/night-apply':\n        case '\/reads\/night-pass':    return readRoute\(path, body, env, origin, user\);/.test(w) &&
  /if \(\/\^\\\/reads\\\/night-\(\?:publish\|promote\|pull\|order\|apply\|pass\)\$\/\.test\(path\)\) return netPassRoute\(path, body, env, origin, user\);/.test(w) &&
  w.indexOf('return netPassRoute(path, body, env, origin, user)') > w.indexOf("if (!(await callerIsAdmin(env, user.id))) return json({ ok: false, error: 'forbidden' }, 403, origin, env);\n  body = body || {};\n  if (path === '/reads/assets'"),
  'C3 the pass\'s six doors go through readRoute, behind its admin check');
ok(/  jobs\.sort\(\(a, b\) => \(b\.size === Infinity \? 1e9 : b\.size\) - \(a\.size === Infinity \? 1e9 : a\.size\)\);\n  jobs\.forEach\(\(j, i\) => \{ j\.base\.meta\.move = \{ rank: i \+ 1, size: Number\.isFinite\(j\.size\) \? Math\.round\(j\.size \* 100\) \/ 100 : null \}; \}\);/.test(w) &&
  /if \(typeof netSetOf === 'function'\) Object\.assign\(set, await netSetOf\(env, set\)\.catch\(excQuiet\('net_set', \{\}\)\)\);/.test(between(w, 'async function doorPublish(env) {', '\n}\n')) &&
  /    house_note: typeof netNoteOf === 'function' \? netNoteOf\(r\.meta\) : null,/.test(between(w, 'function doorTile(r) {', '\n}\n')) && /    house_note: typeof netNoteOf === 'function' \? netNoteOf\(r\.meta\) : null,/.test(between(w, 'async function doorReadRoute(request, env, origin) {', '\n}\n')),
  'C4 doorPass keeps the ranking its cap reads on each earned row; doorPublish, the tile and the deep dive gain the pass\'s fields behind a typeof guard');
ok(crypto.createHash('sha256').update(between(w, 'async function pushNightly(env) {', '/* ═══ SEAM:EVIDENCE_PACK')).digest('hex') === '686932773cd91a567b80049cf45d69c68c53fbea3b2db9e77a6d1cc72d35cc60',
  'C5 pushNightly is byte for byte the function the chain ran before NT2: the pass moves when it runs, never what it sends');
ok(!/net[A-Z]\w*/.test(between(gate, 'SPENDERS = {', '\n}')) && Number((gate.match(/SWALLOW_CEILING = (\d+)/) || [])[1]) <= 122, 'C6 nothing in this cut spends: the registry has no new name and the swallow ceiling did not rise');

// ── D: the page ──────────────────────────────────────────────────────────────────────────────────────────────────────
const pg = between(house, '  /* THE NIGHTS, the morning shelf (SEAM:MORNING_SHELF, RD1d)', '  /* THE ASSETS: every rights record');
ok(pg.indexOf(DASH) < 0 && pg.indexOf('\\u2014') < 0, 'D1 no em dash in the nights room\'s block');
ok(/"<\/span><span>" \+ frameLine \+ "<\/span><\/div>" \+ nightPassBar\(g, open\);/.test(pg) && /id="night-pass">Pass and send<\/button>/.test(pg) && /pb\.setAttribute\("data-armed", "1"\)/.test(pg) && /call\("\/reads\/night-pass", \{ night: g\.night \}\)/.test(pg) && /n\.state === "open"/.test(pg),
  'D2 tonight\'s head carries Pass and send, pressed twice, while the night is open');
ok(['/reads/night-promote', '/reads/night-pull', '/reads/night-publish', '/reads/night-apply'].every(p => pg.includes('"' + p + '"')) && /call\("\/reads\/night-order", \{ night: g\.night, ids: ids \}\)/.test(pg) && /call\("\/reads\/night-order", \{ night: g\.night, reset: true \}\)/.test(pg) &&
  /call\("\/reads\/night-publish", \{ id: id, note: text \}\)/.test(pg) && /data-needs="note"/.test(pg) && /nightActs\(r\) \+ "<\/td><\/tr>"/.test(pg) && /nightApply\(r\) \+ '<span class="hs-noteform"/.test(pg),
  'D3 the row\'s acts: make or drop the lead, pull, publish (on a note written there when a held row has none), put back, apply; the set moves up and down and back to the ranking');
const pageFns = between(house, '  function hsPlural(n, one, many)', '\n') + '\n' + between(house, '  function hsCt(iso) {', '  function nightPassBar(g, open) {');
const PL = new Function('esc', 'Q', 'nightMorning', 'nightsRoom', pageFns + '; return { nightPassLine, hsCt };')(esc, new URLSearchParams(''), () => 0, () => 0);
const lOpen = PL.nightPassLine({ state: 'open', current: true, on: true, held_at: '2026-10-31T06:14:00Z', cutoff_at: '2026-10-31T12:00:00.000Z', pending: 0 });
const lPassed = PL.nightPassLine({ state: 'passed', current: true, on: true, pass: { at: '2026-10-31T11:41:00Z', by: 'fresco', auto: false }, pending: 2 });
const lCut = PL.nightPassLine({ state: 'sent', current: true, on: true, pass: { at: '2026-10-31T12:04:00Z', by: 'cutoff', auto: true }, sent: { at: '2026-10-31T12:04:30Z', by: 'cutoff', told: 2, readers: 3, late: 0 } });
const lLate = PL.nightPassLine({ state: 'open', current: true, on: true, held_at: '2026-10-31T06:14:00Z', cutoff_at: '2026-10-31T12:00:00.000Z', pending: 2 });
const lHouse = PL.nightPassLine({ state: 'sent', current: false, on: true, pass: { at: '2026-11-02T12:41:00Z', by: 'fresco', auto: false }, sent: { at: '2026-11-02T12:41:20Z', by: 'house', told: 1, readers: 3, late: 0 } });
ok(/<b>not passed\.<\/b> Ready to pass since 01:14 CT\. If nobody passes, the day sends itself at 07:00 CT \(12:00 UTC\)\./.test(lOpen) && /^passed at 06:41 CT by fresco\. 2 readings are still compiling: the day sends when they land\.$/.test(lPassed) &&
  /^<b>not passed\.<\/b> The cutoff came at 07:00 CT with 2 readings still compiling: the day sends itself when they land\.$/.test(lLate) && /<b>not passed\.<\/b> Sent by the cutoff at 07:04 CT\. 2 readers told of 3 with frames\./.test(lCut) && /^passed at 06:41 CT by fresco\. Sent at 06:41 CT\. 1 reader told of 3 with frames\.$/.test(lHouse),
  'D4 the head says the state in the house\'s time: not passed and ready since, passed at a time by whom and waiting on compiles, the cutoff come with compiles out (the day sends when they land), sent by the cutoff (07:04 CDT on Oct 31), passed and sent (06:41 CST on Nov 2)');
ok(/\.hs-passbar \{/.test(house) && /\.hs-set li \{/.test(house) && /\.hs-act \{/.test(house) && /\.hs-passgo \.btn\.arm \{/.test(house) && /SEAM:NET_PASS \(NT2\): the morning pass on tonight's head/.test(house), 'D5 the pass\'s styles are on the page');

// ── E: the seams ─────────────────────────────────────────────────────────────────────────────────────────────────────
ok(seams.registry['SEAM:NET_PASS'] && seams.registry['SEAM:NET_PASS'].file === 'worker/src/index.js' && /NT2/.test(seams.registry['SEAM:NET_PASS'].purpose) && seams.registry['SEAM:NET_PASS@read'] && seams.registry['SEAM:NET_PASS@read'].tag === 'SEAM:NET_PASS' && seams.registry['SEAM:NET_PASS@read'].file === 'intelligence/read/index.html',
  'E1 SEAM:NET_PASS is registered on the worker and the page');

console.log('\nproof_net_pass: ' + pass + ' checks PASS');
