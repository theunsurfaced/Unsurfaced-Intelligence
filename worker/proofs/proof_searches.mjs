/**
 * proof_searches.mjs  --  RD1e THE SEARCHES: SEAM:SEARCH_LEDGER. Every question asked of the engine is kept for READ (who, when, how deep,
 * how it was answered, the read it returned), and READ opens a search's read as it was compiled. Nothing runs again; nothing is spent; a
 * search that cannot be kept never stops the read. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const read = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const sql = fs.readFileSync('supabase/migrations/0065_searches.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const DASH = /[—–]/;
const U1 = '11111111-1111-4111-8111-111111111111', R1 = 'aaaaaaaa-0000-4000-8000-000000000001', R2 = 'aaaaaaaa-0000-4000-8000-000000000002';

// ── A: the table ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ok(/create table if not exists public\.searches \(/.test(sql) && /alter table public\.searches enable row level security;/.test(sql) && /revoke all on public\.searches from anon, authenticated;/.test(sql)
  && /read_id\s+uuid references public\.reads\(id\) on delete set null/.test(sql) && /status in \('compiled','partial','cached','refused'\)/.test(sql) && /searches_at_idx on public\.searches \(at desc\)/.test(sql) && !/create policy|grant /i.test(sql),
  'A1 the searches are the worker\'s alone: row level security on, no grants; a search outlives its read; four ways a search is answered');
ok(/insert into public\.searches[\s\S]*from public\.reads r\s*\nwhere not exists \(select 1 from public\.searches s where s\.read_id = r\.id\);/.test(sql) && /e\.event = 'read_frame'/.test(sql) && /e\.meta->>'q' = left\(r\.query, 80\)/.test(sql)
  && /between r\.created_at - interval '2 minutes' and r\.created_at \+ interval '2 minutes'/.test(sql) && /coalesce\(r\.user_id,/.test(sql),
  'A2 every read already in the ledger is entered once; who asked is taken only from the reader\'s own frame log naming the same question within two minutes');

// ── B: the worker ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const sb = between(w, '/* ═══ SEAM:SEARCH_LEDGER (RD1e THE SEARCHES)', '/* ═══ end SEAM:SEARCH_LEDGER ═══ */');
let rowsFor = () => [], writes = [], asked = [], FAIL = false;
const sbRest = async (env, path, opts) => { asked.push(path); if (opts && opts.method === 'POST') { if (FAIL) throw new Error('sb_500'); writes.push({ path, body: opts.body }); return null; } const r = rowsFor(path); if (r instanceof Error) throw r; return r; };
const S = new Function('sbRest', 'excQuiet', 'json', 'planUser', sb + '; return { SEARCHES, searchRow, searchLog, searchesFilter, searchesList, searchesRead, searchesRoute };')(
  sbRest, (l, fb) => () => fb, (o, status) => ({ status, body: o }), async (env, e) => (String(e).toLowerCase() === 'ana@acme.test' ? { id: U1, email: 'ana@acme.test' } : null));
const r1 = S.searchRow({ user_id: U1, query: 'x'.repeat(300), depth: 'quick', mode: 'report', status: 'cached', read_id: R1, cost_usd: '0.42', meta: { lane: 'live' } }), r2 = S.searchRow({ user_id: 'nobody', query: 'q', status: 'weird', read_id: 'no', cost_usd: 'n/a', depth: 'deep' });
ok(r1.query.length === 200 && r1.user_id === U1 && r1.depth === 'quick' && r1.status === 'cached' && r1.read_id === R1 && r1.cost_usd === 0.42 && r1.meta.lane === 'live'
  && r2.user_id === null && r2.status === 'compiled' && r2.read_id === null && r2.cost_usd === null && r2.depth === null && S.searchRow({ query: 'q', cost_usd: null }).cost_usd === null,
  'B1 a search is kept as it is: who, the question, how deep, how it was answered, its read and its cost; anything malformed is left empty, never guessed');
ok((await S.searchLog({}, { query: '  ' })) === false && writes.length === 0 && (await S.searchLog({}, { user_id: U1, query: 'Nike', status: 'compiled', read_id: R1 })) === true && writes[0].path === 'searches' && writes[0].body.read_id === R1,
  'B2 a search with a question is written; an empty one is not');
FAIL = true; let threw = false, kept = null; try { kept = await S.searchLog({}, { query: 'Nike' }); } catch (e) { threw = true; } FAIL = false;
ok(!threw && kept === false, 'B3 a search that cannot be kept says false and never throws: the read goes on');
const f1 = S.searchesFilter({ before: '2026-11-02T20:15:03.123456+00:00', q: 'Nike*, (air)', status: 'refused' }), f2 = S.searchesFilter({ before: '2026-11-02T20:15:03Z' }), f3 = S.searchesFilter({ before: 'yesterday', q: 'a', status: 'all' });
ok(f1[0] === 'at=lt.2026-11-02T20%3A15%3A03.123456%2B00%3A00' && f1[1] === 'query=ilike.' + encodeURIComponent('*Nike air*') && f1[2] === 'status=eq.refused' && f2[0] === 'at=lt.2026-11-02T20%3A15%3A03Z' && f3.length === 0,
  'B4 the filter: before a time as the table writes it (its offset kept), a word in the question with the table\'s own wildcards and markup taken out, one way it was answered');
rowsFor = p => {
  if (p.startsWith('searches?select=')) return [{ id: 's1', at: '2026-11-02T20:00:00+00:00', user_id: U1, query: 'Nike', depth: 'full', status: 'compiled', read_id: R1, cost_usd: 0.41 }, { id: 's2', at: '2026-11-02T19:00:00+00:00', user_id: null, query: 'Costco', depth: null, status: 'compiled', read_id: R2, cost_usd: null }, { id: 's3', at: '2026-11-02T18:00:00+00:00', user_id: U1, query: 'Hoka', status: 'refused', read_id: null }];
  if (p.startsWith('app_user?id=in.')) return [{ id: U1, email: 'ana@acme.test', name: 'Ana', company: 'Acme' }];
  if (p.startsWith('reads?id=in.')) return [{ id: R1, read: ['Runners buy the second pair', 'Line two'], evidence_n: 14 }, { id: R2, read: null, evidence_n: 3 }];
  return [];
};
asked = [];
const L = await S.searchesList({}, { limit: 2 });
ok(L.ok && L.more === true && L.searches.length === 2 && L.searches[0].who.email === 'ana@acme.test' && L.searches[0].who.company === 'Acme' && L.searches[0].claim === 'Runners buy the second pair' && L.searches[1].who === null && L.searches[1].claim === null
  && asked[0] === 'searches?select=id,at,user_id,query,depth,mode,status,read_id,cost_usd&order=at.desc&limit=3' && asked.some(p => p === 'app_user?id=in.(' + U1 + ')&select=id,email,name,company'),
  'B5 the list, newest first, a page at a time: who asked (where it was kept), the read\'s first line; one more row says there are older ones');
asked = [];
const Lw = await S.searchesList({}, { who: 'Ana@acme.test' }), Ln = await S.searchesList({}, { who: 'nobody@x.test' });
ok(Lw.ok && asked[0].includes('&user_id=eq.' + U1) && Ln.ok && Ln.searches.length === 0, 'B6 one reader\'s searches by their email; an email no one signed up with finds none');
rowsFor = p => (p.startsWith('searches?select=') ? new Error('sb_404') : []);
const Lx = await S.searchesList({}, {});
ok(Lx.ok === false && Lx.error === 'not_ready' && /0065_searches\.sql/.test(Lx.say), 'B7 before the table is there, the room says which SQL to run');
rowsFor = p => (p.startsWith('reads?id=eq.') ? [{ id: R1, user_id: U1, query: 'Nike', read: ['A', 'B'], insights: [{ title: 'T' }], ideas: [], brief: 'Brief', meta: { model: { lane: 'live', cost_usd: 0.41 } }, created_at: '2026-11-02T20:00:00+00:00' }]
  : p.startsWith('searches?read_id=eq.') ? [{ at: '2026-11-02T20:00:00+00:00', user_id: U1, depth: 'full', status: 'compiled' }, { at: '2026-11-02T21:00:00+00:00', user_id: null, depth: 'full', status: 'cached' }]
  : p.startsWith('app_user?id=in.') ? [{ id: U1, email: 'ana@acme.test' }] : []);
const D = await S.searchesRead({}, { id: R1 }), Dbad = await S.searchesRead({}, { id: '1;drop' });
rowsFor = () => []; const D404 = await S.searchesRead({}, { id: R2 });
ok(D.ok && D.read.query === 'Nike' && D.read.insights[0].title === 'T' && D.who === 'ana@acme.test' && D.asked.length === 2 && D.asked[0].who === 'ana@acme.test' && D.asked[1].who === null && Dbad.error === 'bad_id' && D404.error === 'not_found',
  'B8 a search\'s read, from the ledger as it was compiled, with every time it was asked and by whom');
const syn = between(w, 'async function synthesize(body, env, origin, hooks) {', '\nasync function ');
ok(/readId = await ledgerWrite\(env, \{ user_id: body\._uid \|\| null, query: query\.slice\(0, 200\),/.test(syn), 'C1 the read ledger now keeps who asked');
const hitLine = (syn.split('\n').find(l => l.includes('if (j && Array.isArray(j.insights) && (!j.partial || body.cache_only)')) || '');
ok(/if \(!body\.cache_only && typeof searchLog === 'function'\) await searchLog\(env, \{ user_id: body\._uid, query, depth: quick \? 'quick' : 'full', mode: body\.mode, status: 'cached', read_id: j\.read_id \}\);/.test(hitLine) && hitLine.indexOf('searchLog') < hitLine.indexOf('return reply(')
  && syn.indexOf("if (env.RATE_LIMIT && !body.bench) {") < syn.indexOf("status: 'cached'"),
  'C2 a search served again from the day\'s read is kept before it is answered; a stream\'s retry for its own read is not a second search; the bench never reaches it');
const iRef = syn.indexOf("status: 'refused' });"), i402 = syn.indexOf('return reply(meterRefusal(mc), 402, origin, env);'), iCharge = syn.indexOf("meterCharge(env, body._m.uid");
ok(iCharge > 0 && iCharge < iRef && iRef < i402 && /if \(body\._m && body\._m\.uid && !body\.bench\)/.test(syn), 'C3 a search the meter refused is kept before the refusal is answered');
const iLedger = syn.indexOf('readId = await ledgerWrite('), iClaims = syn.indexOf("if (readId && typeof claimsWrite === 'function')"), iComp = syn.indexOf("status: partial ? 'partial' : 'compiled', read_id: readId, cost_usd: compiled.cost_usd");
ok(iLedger > 0 && iLedger < iClaims && iClaims < iComp && syn.lastIndexOf('if (!body.bench) try {', iLedger) > 0 && syn.indexOf('} catch (e) {}', iComp) > iComp,
  'C4 a compiled search is kept after its read, with the read and its cost, inside the ledger\'s own step: a bench read lands nowhere, and a failure there never stops the read');
const rr = between(w, 'async function readRoute(path, body, env, origin, user) {', "  if (path === '/reads/list') {");
ok(/case '\/reads\/night-pass':    return readRoute\(path, body, env, origin, user\);\n        case '\/reads\/searches':[^\n]*\n        case '\/reads\/search':        return readRoute\(path, body, env, origin, user\);/.test(w) && rr.indexOf('callerIsAdmin') < rr.indexOf("if (path === '/reads/searches' || path === '/reads/search') return searchesRoute(path, body, env, origin);")
  && w.indexOf("case '/reads/searches':") > w.indexOf('// Everything below requires a signed-in user') && !/callClaude|callModel|meterCharge|gatherOpenSignals|synthesize\(/.test(sb) && !DASH.test(sb),
  'C5 READ\'s two routes are signed in and admin only; the block asks no model, gathers nothing, spends nothing; no dash');

// ── D: READ's room ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const js = between(read, '  /* SEAM:SEARCH_LEDGER (RD1e THE SEARCHES): every question asked of the engine', '  function feedRoom() {');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const doc = { els: {}, getElementById(id) { return this.els[id] || null; } }, shell = { room: null, html: '' }, posted = []; let back = null, ANSWER = null;
const R = new Function('esc', 'call', 'houseShell', 'houseBack', 'document', js + '; return { SR, SR_HOW, srWhen, srMoney, srLink, srRow, srTable, srFilters, searchesRoom, srLoad, srReadHtml, searchRead };')(
  esc, async (p, b) => { posted.push({ p, b }); return ANSWER ? ANSWER(p, b) : null; }, (room, html) => { shell.room = room; shell.html = html; doc.els['sr-list'] = { innerHTML: '' }; doc.els['sr-f'] = {}; }, r => { back = r; }, doc);
const row = R.srRow({ at: '2026-11-02T20:00:00+00:00', who: { email: 'a<b>@x.test', company: 'Acme & Co' }, query: '<script>alert(1)</script>', depth: 'quick', status: 'refused', read_id: R1, claim: 'A "claim"', cost_usd: 0.4123 });
ok(!/<script>/.test(row) && /&lt;script&gt;alert\(1\)&lt;\/script&gt;/.test(row) && /a&lt;b&gt;@x\.test<small>Acme &amp; Co<\/small>/.test(row) && /href="\.\/\?room=searches&amp;read=aaaaaaaa-0000-4000-8000-000000000001">A &quot;claim&quot;<\/a>/.test(row)
  && /sr-refused">Refused by the meter</.test(row) && /<td>Quick<\/td>/.test(row) && /<td>\$0\.41<\/td>/.test(row) && /Not recorded/.test(R.srRow({ query: 'q', status: 'cached' })) && /No read/.test(R.srRow({ query: 'q', status: 'refused' })),
  'D1 a search\'s row: when, who (or Not recorded), the question, the depth, how it was answered, its read and its cost, every word escaped');
ANSWER = (p, b) => (p === '/reads/searches' ? { ok: true, more: !b.before, searches: b.before ? [{ at: '2026-11-01T10:00:00+00:00', query: 'Older one', status: 'compiled', read_id: R2 }] : [{ at: '2026-11-02T20:00:00+00:00', query: 'Newest', status: 'cached', read_id: R1, who: null }] } : null);
R.SR.f = { q: 'nike', who: '', status: 'cached' };
R.searchesRoom(); await new Promise(r => setTimeout(r, 0));
ok(shell.room === 'searches' && /<form class="sr-f" id="sr-f">/.test(shell.html) && /id="sr-q" maxlength="60" placeholder="A word in the question" value="nike"/.test(shell.html) && /<option value="cached" selected>Served again<\/option>/.test(shell.html) && /nothing runs again and nothing is spent/.test(shell.html) && typeof doc.els['sr-f'].onsubmit === 'function' && posted[0].p === '/reads/searches' && posted[0].b.q === 'nike' && posted[0].b.status === 'cached' && !('before' in posted[0].b) && /Newest/.test(doc.els['sr-list'].innerHTML) && /id="sr-more">Older<\/button>/.test(doc.els['sr-list'].innerHTML),
  'D2 the room asks with its filters and shows Older when there is more');
await R.srLoad(true);
ok(posted[1].b.before === '2026-11-02T20:00:00+00:00' && R.SR.rows.map(r => r.query).join() === 'Newest,Older one' && !/sr-more/.test(doc.els['sr-list'].innerHTML), 'D3 Older asks from the last row it holds and adds to the list');
ANSWER = (p) => (p === '/reads/search' ? { ok: true, who: 'ana@acme.test', asked: [{ at: '2026-11-02T20:00:00+00:00', who: 'ana@acme.test', status: 'compiled', depth: 'full' }, { at: '2026-11-02T21:00:00+00:00', who: null, status: 'cached' }],
  read: { query: 'Nike <b>', created_at: '2026-11-02T20:00:00+00:00', evidence_n: 14, read: ['The first line', 'The second line'], brief: 'The brief.', meta: { frame: { entity: 'Nike', category: 'footwear', competitors: ['Hoka'] }, model: { lane: 'live', cost_usd: 0.41 } },
    insights: [{ category: 'consumer', confidence: 'High', title: 'Finding one', excerpt: 'Why.', source: 'WWD', sourceUrl: 'https://wwd.com/a' }, { title: 'Finding two', excerpt: 'x', source: 'Bad', sourceUrl: 'javascript:alert(1)' }], ideas: [{ type: 'move', headline: 'Do this', body: 'Because.' }] } } : null);
await R.searchRead(R1);
const h = shell.html;
ok(posted[2].p === '/reads/search' && posted[2].b.id === R1 && shell.room === 'searches' && back === 'searches' && /<h2>Nike &lt;b&gt;<\/h2>/.test(h) && /Kept as it was compiled; opening it ran nothing\./.test(h) && /on the live lane, \$0\.41, on 14 sources/.test(h)
  && /Nike · footwear · against Hoka/.test(h) && /The first line/.test(h) && /The brief\./.test(h) && /<a href="https:\/\/wwd\.com\/a" target="_blank" rel="noopener">WWD<\/a>/.test(h) && !/javascript:/.test(h) && /Do this/.test(h) && /ana@acme\.test · Compiled · Full/.test(h) && /Not recorded · Served again/.test(h),
  'D4 a search opens its read as it was compiled: the read, the brief, the findings (https links only), the moves, and every time it was asked; it runs nothing');
const css = between(read, '  /* SEAM:SEARCH_LEDGER (RD1e THE SEARCHES): the searches room', '</style>');
ok(/HOUSE_ROOMS\.searches = \{ name: "The searches", door: "The searches",/.test(read) && /HOUSE_ORDER\.push\("searches"\);/.test(read) && /if \(room === "searches"\) return Q\.get\("read"\) \? searchRead\(Q\.get\("read"\)\) : searchesRoom\(\);/.test(read)
  && /\.sr-f \{/.test(css) && !/z-index/.test(css) && !DASH.test(js + css) && !/fetch\(|\/excavate\//.test(js),
  'D5 The searches stand on the house\'s doors and open from the address; the room asks READ\'s two routes and nothing else; no dash');
console.log(`\nproof_searches: ${pass} checks PASS`);
