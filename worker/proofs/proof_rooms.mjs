/**
 * proof_rooms.mjs  --  EX19 THE ROOMS: a tracked brand's room (SEAM:BRAND_ROOM) and the people behind the board's subjects
 * (SEAM:PEOPLE), in the worker and on the page. Runs the shipped code on fakes. Run from the repo root: node worker/proofs/proof_rooms.mjs
 *   B  the brand room (worker)      P  the people (worker)      G  the page      Z  seams
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const fnOf = (src, name) => { const i = src.indexOf('async function ' + name + '(') >= 0 ? src.indexOf('async function ' + name + '(') : src.indexOf('function ' + name + '('); const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3); };
const day = 864e5, NOW = Date.parse('2026-10-06T12:00:00Z'), ago = n => new Date(NOW - n * day).toISOString();
const lakeWhen = new Function(fnOf(w, 'lakeWhen') + '; return lakeWhen;')();   // the shipped one
const ilikeOr = new Function(fnOf(w, 'ilikeOr') + '; return ilikeOr;')();
const esc = x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── B: the brand room ───────────────────────────────────────────────────
const roomSrc = between(w, 'const BRAND_ROOM = {', 'async function excavateTrackAdd(');
const mkRoom = (deps) => new Function('lakeWhen', 'sbRest', 'sweepOnly', 'FEED', 'readReconAttention', 'readAttnStats', 'doorSet', 'DOOR_VOICES', 'LEDGER', 'loadTracks', 'json', 'excQuiet', 'ilikeOr',
  roomSrc + '; return { BRAND_ROOM, brandCut, brandWeeks, brandCoverage, brandStories, brandCounted, brandCounts, brandAttnWords, brandAttention, brandRoom, excavateBrand };')(
  lakeWhen, deps.sbRest, deps.sw || (async () => '&research=is.false'), { TRACKS_KEY: 'tracks:stats' }, deps.attn || (async () => null), x => x ? { recent_3m: 900, yoy_pct: -8 } : null, deps.doorSet || (async () => null), { KEEP: 6 }, { TABLE: 'subject_weeks' },
  deps.loadTracks || (async () => []), (o, s) => Object.assign({ _status: s }, o), () => () => null, ilikeOr);
const B0 = mkRoom({ sbRest: async () => [] });
const rows = [
  { title: 'Nike reissue sells out', url: 'https://a/1', source_name: 'Hypebeast', published_at: ago(1), captured_at: ago(1), image: 'https://img/1.jpg' },
  { title: 'NIKE reissue sells out!', url: 'https://b/1', source_name: 'Complex', published_at: ago(2), captured_at: ago(2), image: 'http://img/2.jpg' },
  { title: 'Nike earnings', url: 'https://c/1', source_name: 'Reuters', published_at: ago(9), captured_at: ago(9) },
  { title: 'Nike at the marathon', url: 'https://d/1', source_name: 'Hypebeast', published_at: ago(10), captured_at: ago(10) },
  { title: 'Old Nike story', url: 'https://e/1', source_name: 'Old', published_at: ago(120), captured_at: ago(30) },
  { title: 'Nike launch next month', url: 'https://h/1', source_name: 'Future', published_at: new Date(NOW + 20 * day).toISOString(), captured_at: ago(1) },
  { title: 'Undated live capture', url: 'https://f/1', source_name: 'Live', captured_at: ago(1), momentum: { provenance: 'live_gather' } },
  { title: 'Undated sweep capture', url: 'https://g/1', source_name: 'Wire', captured_at: ago(3) }];
const wk = B0.brandWeeks(rows, NOW);
ok(wk.length === 12 && wk[11].n === 3 && wk[11].outlets === 3 && wk[10].n === 2 && wk[10].outlets === 2 && wk.reduce((a, b) => a + b.n, 0) === 5 && wk[0].start === ago(84).slice(0, 10),
  'B1 twelve rolling weeks, the newest last, each with its stories and outlets by the date each speaks for; a story older than twelve weeks and an undated search capture count nowhere');
const cov = B0.brandCoverage(rows, NOW, 1000), covCap = B0.brandCoverage(rows, NOW, 7);
ok(cov.this_week === 3 && cov.prior_week === 2 && cov.total === 5 && cov.outlets === 4 && cov.at_least === false && covCap.at_least === true,
  'B2 coverage: this week against the one before, the twelve-week total and its outlets (a story dated after today counts nowhere); a count that hit its row limit says "at least"');
const capRows = [{ title: 'a', published_at: ago(1), captured_at: ago(1), source_name: 'A' }, { title: 'b', published_at: ago(20), captured_at: ago(20), source_name: 'B' }, { title: 'c', published_at: ago(52), captured_at: ago(50), source_name: 'C' }];
const cut = B0.brandCut(capRows, 3), wkCut = B0.brandWeeks(capRows, NOW, null, cut), covC = B0.brandCoverage(capRows, NOW, 3);
ok(cut === ago(50) && B0.brandCut(capRows, 4) === null && wkCut.slice(0, 4).every(x => x.n === null && x.outlets === null) && wkCut[4].floor === true && wkCut[4].n === 1 && !wkCut[5].floor && wkCut[5].n === 0 && wkCut[11].n === 1
   && covC.at_least === true && covC.total === 3 && covC.weeks[0].n === null && covC.this_floor === false && covC.prior_floor === false
   && B0.brandCoverage([{ title: 'x', published_at: ago(1), captured_at: ago(1) }, { title: 'y', published_at: ago(9), captured_at: ago(9) }], NOW, 2).prior_floor === true,
  'B2b a read that hit its limit saw only the newest captures: the weeks before the oldest one it saw are unknown (null, never zero), the week it falls in is a floor, every later week is whole');
const stories = B0.brandStories(rows);
ok(stories.length === 5 && stories[0].title === 'Nike reissue sells out' && stories.map(x => x.title).includes('Nike reissue sells out') && !stories.map(x => x.title).includes('NIKE reissue sells out!') && stories.every(x => x.image === null || /^https:/.test(x.image)) && stories.every(x => x.date)
   && Date.parse(stories[0].date) >= Date.parse(stories[1].date), 'B3 the latest stories: newest first, one per headline (case and marks aside), https photographs only, undated search captures left out');
let paths = [], kv = {}, attnFrames = [];
const env = { RATE_LIMIT: { get: async k => kv[k] || null, put: async (k, v, o) => { kv[k] = v; kv[k + ':ttl'] = o && o.expirationTtl; } } };
const tracks = [{ id: '11111111-1111-1111-1111-111111111111', name: 'Nike', aliases: ['NKE'], sector: 'Athletic footwear', description: 'Sportswear company', image: 'https://kg/nike.jpg', image_license: 'CC BY' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Adidas', aliases: [], sector: 'Athletic footwear' }, { id: '33333333-3333-3333-3333-333333333333', name: 'Puma', aliases: [], sector: 'Athletic footwear' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Apple', aliases: [], sector: 'Technology' }, { id: 'aaaa1111-1111-1111-1111-111111111111', name: 'Converse', aliases: [], sector: 'Retail' }];
kv['tracks:stats'] = JSON.stringify({ stats: { '22222222-2222-2222-2222-222222222222': { n7: 4, n30: 20, outlets_30d: 9, weeks: [1, 2, 3] }, '11111111-1111-1111-1111-111111111111': { image: 'https://lake/img.jpg' } } });
const R = mkRoom({
  sbRest: async (e, p) => { paths.push(p); if (/^signals\?/.test(p)) return rows; if (/^subject_weeks\?/.test(p)) return [{ week: '2026-09-28', door: null }, { week: '2026-10-05', door: { rank: 2 } }]; return []; },
  attn: async (e, f) => { attnFrames.push(f); return { months: ['2026-07', '2026-08', '2026-09'], series: [{ label: 'Nike', role: 'subject', article: 'Nike, Inc.', views: [1, 2, 3] }, { label: 'Adidas', role: 'rival', article: 'Adidas', views: [3, 2, 1] }] }; },
  doorSet: async () => ({ tiles: [{ key: 'track:11111111-1111-1111-1111-111111111111', night: '2026-10-05', claim: 'Casual buyers choose the archive.', move: 'Hold archive prices.', question: 'Who buys?', measures: { state: 'STRUCTURAL' }, voices: [{ text: 'I bought the 2003 colorway', likes: 3, self: { generation: 'Gen Z' }, src: 'yt:x' }] }] }),
  loadTracks: async () => tracks });
const room = await R.brandRoom(env, tracks[0], tracks);
const sig = paths.find(p => /^signals\?/.test(p));
ok(/^signals\?select=id,title,url,source_name,published_at,captured_at,image,momentum&or=\(title\.ilike\.\*Nike\*,title\.ilike\.\*NKE\*\)&research=is\.false&status=neq\.rejected&captured_at=gte\./.test(sig) && /limit=1000$/.test(sig) && room.sweep === true,
  'B4 a brand\'s coverage is asked of the sweep only (research = false), its name and aliases, no rejected row, twelve weeks, 1,000 rows at most (inside PostgREST\'s own ceiling, so a full read knows it is full), with each row\'s provenance so a search\'s undated capture stays undated');
ok(ilikeOr(['***']) === 'id=is.null' && ilikeOr(['LG']) === 'id=is.null' && ilikeOr(['H&M']) === 'or=(title.ilike.*H%26M*)' && ilikeOr(['P&G', 'M & S']) === 'or=(title.ilike.*P%26G*,title.ilike.*M%20%26%20S*)' && ilikeOr(['&&&']) === 'id=is.null' && ilikeOr([]) === 'id=is.null' && ilikeOr(['Abercrombie & Fitch', 'A_B*C']) === 'or=(title.ilike.*Abercrombie%20%26%20Fitch*,title.ilike.*A%20B%20C*)' && ilikeOr(['x,(y)"z']) === 'or=(title.ilike.*x%20y%20z*)',
  'B4b a name is matched as words: pattern and filter characters go, a name needs three characters with two letters or digits (H&M stays, LG goes), and no name left matches nothing, never everything');
ok(room.ok && room.track.name === 'Nike' && room.track.description === 'Sportswear company' && room.track.image === 'https://kg/nike.jpg' && room.coverage.total === 5 && room.stories.length === 5,
  'B5 the room carries the brand as the table knows it, its coverage and its latest stories');
ok(room.set.length === 2 && room.set.map(x => x.name).join(',') === 'Adidas,Puma' && room.set[0].n30 === 20 && room.set[0].weeks.join(',') === '1,2,3' && room.set[1].n7 === null && room.set[1].n30 === null && room.set[1].outlets_30d === null && room.set[1].weeks === null && !room.set.some(x => x.name === 'Apple' || x.name === 'Nike'),
  'B6 the set is the tracked brands in its sector, itself left out, the most covered first, on the same counts; a brand not counted yet carries nothing, never a zero');
ok(room.self && room.self.n30 === undefined && room.self.measurable === true && Object.keys(room.self).join(',') === 'measurable', 'B6b a brand the counts have not reached yet has no numbers in its own row (an image alone is not a count)');
kv['tracks:stats'] = JSON.stringify({ stats: { '11111111-1111-1111-1111-111111111111': { n7: 9, n30: 40, outlets_30d: 14, weeks: [3, 4, 2], image: 'https://lake/img.jpg' } } });
const room2 = await R.brandRoom(env, tracks[0], tracks);
ok(room2.self && room2.self.n7 === 9 && room2.self.n30 === 40 && room2.self.outlets_30d === 14 && room2.self.weeks.join(',') === '3,4,2' && Object.keys(room2.self).sort().join(',') === 'floor30,floor7,measurable,n30,n7,outlets_30d,weeks',
  'B6c the brand sits in its own set on the counts its set is read on, never on the room\'s twelve-week coverage');
const about = new Function(fnOf(w, 'readAttnAbout') + '; return readAttnAbout;')();
const fr0 = attnFrames[0];
ok(fr0.entity === 'Nike' && fr0.category === null && fr0.anchors.join(',') === 'athletic,footwear,sportswear,company' && fr0.competitors.join(',') === 'Adidas,Puma' && room.attention.series.length === 2 && room.attention.stats.yoy_pct === -8
   && about({ title: 'Nike, Inc.', snippet: 'Nike, Inc. is an American athletic footwear and apparel corporation' }, fr0) && !about({ title: 'Nike (mythology)', snippet: 'In ancient Greek religion, Nike is a goddess who personified victory' }, fr0)
   && !about({ title: 'Puma (genus)', snippet: 'Puma is a genus in the family Felidae' }, fr0) && about({ title: 'Puma (brand)', snippet: 'Puma SE is a German company that designs athletic and casual footwear' }, fr0)
   && !about({ title: 'Apple', snippet: 'An apple is a round, edible fruit produced by an apple tree' }, { anchors: R.brandAttnWords({ sector: 'Technology', description: 'Consumer electronics company' }) }),
  'B7 attention is the brand\'s own article against up to two of its set, and an article counts only when it names the trade: Nike the goddess, Puma the cat and Apple the fruit share a name, never a sector');
const attnN = attnFrames.length, noTrade = await R.brandAttention(env, { id: '55555555-5555-5555-5555-555555555555', name: 'Mystery' }, []);
ok(noTrade === null && attnFrames.length === attnN && kv['brand:attn:v2:11111111-1111-1111-1111-111111111111:22222222.33333333'] && kv['brand:attn:v2:11111111-1111-1111-1111-111111111111:22222222.33333333:ttl'] === 7 * 86400,
  'B7b a brand with no sector and no description measures nothing rather than the wrong article; three years of monthly views are kept a week, under the rivals they were read against');
ok(room.board && room.board.claim === 'Casual buyers choose the archive.' && room.board.state === 'STRUCTURAL' && room.board.voices.length === 1 && Object.keys(room.board.voices[0]).sort().join(',') === 'likes,self,text,when',
  'B8 when the brand stands on the board, the room carries the board\'s reading and its voices, never a voice\'s source');
ok(room.record.weeks === 2 && room.record.since === '2026-09-28' && room.record.on_board === 1 && paths.some(p => /^subject_weeks\?subject_key=eq\.track%3A11111111-1111-1111-1111-111111111111&select=week,door&order=week\.asc&limit=260$/.test(p)),
  'B9 the record: the weeks the ledger holds for the brand, since when, and how many on the board');
const bad = await R.excavateBrand(new Request('https://x/excavate/brand?id=nope'), env, '');
const none = await R.excavateBrand(new Request('https://x/excavate/brand?id=99999999-9999-9999-9999-999999999999'), env, '');
const first = await R.excavateBrand(new Request('https://x/excavate/brand?id=11111111-1111-1111-1111-111111111111'), env, '');
paths = [];
const again = await R.excavateBrand(new Request('https://x/excavate/brand?id=11111111-1111-1111-1111-111111111111'), env, '');
const readsAgain = paths.length;
const upper = await R.excavateBrand(new Request('https://x/excavate/brand?id=' + 'aaaa1111-1111-1111-1111-111111111111'.toUpperCase()), env, '');
ok(bad.error === 'bad_id' && none.error === 'not_tracked' && first.ok && !first.cached && again.cached === true && readsAgain === 0 && kv['brand:v2:11111111-1111-1111-1111-111111111111:ttl'] === 6 * 3600 && upper.ok && upper.track.name === 'Converse',
  'B10 GET /excavate/brand: a malformed id and an untracked brand are refused; a room is kept six hours, so a second visit reads nothing; an id in capitals is the same brand');
let kvU = {}, pathsU = [];
const RU = mkRoom({ sw: async () => '', sbRest: async (e, p) => { pathsU.push(p); return /^signals\?/.test(p) ? rows : []; }, loadTracks: async () => tracks });
const envU = { RATE_LIMIT: { get: async k => kvU[k] || null, put: async (k, v, o) => { kvU[k] = v; } } };
const roomU = await RU.excavateBrand(new Request('https://x/excavate/brand?id=11111111-1111-1111-1111-111111111111'), envU, '');
const shortT = [{ id: '66666666-6666-6666-6666-666666666666', name: 'LG', aliases: ['**'], sector: 'Technology' }];
const RS = mkRoom({ sbRest: async (e, p) => { pathsU.push(p); return []; }, loadTracks: async () => shortT });
pathsU.length = 0; const roomS = await RS.excavateBrand(new Request('https://x/excavate/brand?id=66666666-6666-6666-6666-666666666666'), envU, '');
ok(roomU.ok && roomU.coverage === null && roomU.stories.length === 0 && !kvU['brand:v2:11111111-1111-1111-1111-111111111111'] && roomS.ok && roomS.measurable === false && roomS.coverage === null && !pathsU.some(p => /^signals\?/.test(p)) && kvU['brand:v2:66666666-6666-6666-6666-666666666666'],
  'B10b when the sweep cannot be told apart, a room counts nothing and lists nothing, and is not kept; a name too short to find is never read for, and that answer is kept');
let kvP = {};
const RP = mkRoom({ sbRest: async (e, p) => { if (/^subject_weeks\?/.test(p)) throw new Error('sb_503'); return /^signals\?/.test(p) ? rows : []; }, loadTracks: async () => tracks });
const roomP = await RP.excavateBrand(new Request('https://x/excavate/brand?id=11111111-1111-1111-1111-111111111111'), { RATE_LIMIT: { get: async k => kvP[k] || null, put: async (k, v) => { kvP[k] = v; } } }, '');
ok(roomP.ok && roomP.partial === true && roomP.coverage && !kvP['brand:v2:11111111-1111-1111-1111-111111111111'] && /if \(!anchors\.length \|\| ilikeOr\(anchors\) === 'id=is\.null'\) return null;/.test(fnOf(w, 'excMeasures')) && /ilikeOr\(\[x\]\) !== 'id=is\.null'\)\.slice\(0, 5\)/.test(fnOf(w, 'excMeasures')),
  'B10c a room with a part that failed to load is shown, never kept; a read whose names cannot be found in a headline gets no measures (never zeros), and such a competitor is left out');
const tr = fnOf(w, 'tracksRefresh');
// tracksRefresh, run: a capped brand, a future-dated story, a blip that keeps the last count
const trSrc = fnOf(w, 'tracksRefresh');
let trKv = {}, trLedger = [], trSw = '&research=is.false';
const trTracks = [{ id: 't1', name: 'Nike', aliases: [], kg_id: 'k' }, { id: 't2', name: 'Puma', aliases: [], kg_id: 'k' }, { id: 't3', name: 'LG', aliases: [], kg_id: 'k' }];
const hot = Array.from({ length: 600 }, (_, i) => ({ id: i, title: 'Nike', published_at: new Date(NOW - 864e5 * 0.05 * i).toISOString(), captured_at: new Date(NOW - 864e5 * 0.05 * i).toISOString(), source_name: 'S' + (i % 7) }));
const calm = [{ title: 'Puma', published_at: ago(2), captured_at: ago(2), source_name: 'A' }, { title: 'Puma', published_at: ago(40), captured_at: ago(40), source_name: 'B' }, { title: 'Puma next', published_at: new Date(NOW + 5 * day).toISOString(), captured_at: ago(1), source_name: 'C' }];
let trPaths = [];
const TR = new Function('loadTracks', 'sbRest', 'sweepOnly', 'lakeWhen', 'FEED', 'ilikeOr', 'env0', 'RAIL_FNS', 'RAIL_BY_ID', 'railFetch', 'ledgerPut', 'ledgerWeek', 'Date',
  roomSrc + trSrc + '; return tracksRefresh;')(async () => trTracks, async (e, p) => { trPaths.push(p); return /Nike/.test(p) ? hot : /Puma/.test(p) ? calm : []; }, async () => trSw, lakeWhen, { TRACKS_KEY: 'tracks:stats' }, ilikeOr, null, {}, {}, null,
  async (e, col, r) => { trLedger.push({ col, r }); return r.length; }, () => '2026-10-05', class extends Date { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } });
const trEnv = { RATE_LIMIT: { get: async k => trKv[k] || null, put: async (k, v) => { trKv[k] = v; } } };
await TR(trEnv);
const trSt = JSON.parse(trKv['tracks:stats']).stats;
ok(trSt.t1.capped && trSt.t1.weeks.slice(0, 7).every(x => x === null) && trSt.t1.weeks[7] === 40 && trSt.t1.weeks[11] === 140 && trSt.t1.n7 === 140 && trSt.t1.floor30 === true && trSt.t1.floor7 === false && trSt.t2.n7 === 1 && trSt.t2.n30 === 1 && trSt.t2.weeks[11] === 1 && !trSt.t2.capped
   && !trSt.t3.counted && trSt.t3.weeks === null && !trPaths.some(p => /LG/.test(p)) && trLedger[0].r.length === 2 && trLedger[0].r[0].data.capped === true && trLedger[0].r[0].data.floor30 === true,
  'B11 every tracked brand counts its twelve weeks on each refresh: a brand whose read hit its limit has its unseen weeks unknown and its 7 and 30 day counts marked as floors, in the list and in the ledger; a story dated after today is not counted; a name too short to find is never counted');
trSw = ''; const before = JSON.stringify(trSt.t2); trLedger = [];
await TR(trEnv);
const trSt2 = JSON.parse(trKv['tracks:stats']).stats;
ok(JSON.stringify(Object.assign({}, trSt2.t2, { counted: true })) === before && trSt2.t2.counted === false && trLedger[0].r.length === 0,
  'B11b when the sweep cannot be told apart, every brand keeps its last good count and nothing is written down');
const xt = fnOf(w, 'excavateTracks');
ok(/counts: brandCounts\(st\[t\.id\]\), weeks: brandCounted\(st\[t\.id\]\) \? st\[t\.id\]\.weeks : null/.test(xt) && /aliases: \(t\.aliases \|\| \[\]\)\.slice\(0, 8\), measurable:/.test(xt)
   && JSON.stringify(R.brandCounts({ n7: 4, n30: 0, latest: null })) === JSON.stringify({ captures_7d: null, captures_30d: null, outlets_30d: null, floor7: false, floor30: false }) && R.brandCounts({ n7: 4, n30: 9, weeks: [1], outlets_30d: 3, floor30: true }).captures_30d === 9,
  'B11c the brands list carries each brand\'s aliases (so the search finds them), whether its name can be counted, and nulls until it is counted on these rules');
ok(/tracks\?select=id,name,aliases,kind,sector,description,query,kg_id,image,image_license,active/.test(fnOf(w, 'loadTracks')), 'B12 a track carries its description, image and Knowledge Graph id, so the Knowledge Graph is asked once, not every refresh');
ok(/if \(path === '\/excavate\/brand' && request\.method === 'GET'\) return excavateBrand\(request, env, origin\);/.test(w) && /if \(path === '\/excavate\/people' && request\.method === 'GET'\) return excavatePeople\(env, origin\);/.test(w), 'B13 the two rooms have their doors');

// ── P: the people ───────────────────────────────────────────────────────
const pplSrc = between(w, 'const PEOPLE = {', 'async function excavateAudiences(');
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));
const bandSrc = w.slice(w.indexOf('function readBandOf('), w.indexOf('/* PURE: the date on a voice line'));
let ledger = [], pPaths = [], pkv = {};
const ledgerWeekReal = new Function(fnOf(w, 'ledgerWeek') + '; return ledgerWeek;')();
const mkP = (deps) => new Function('sbRest', 'doorSet', 'ledgerPut', 'ledgerWeek', 'json', 'excQuiet', voiceSrc + bandSrc + pplSrc + '; return { PEOPLE, peopleKeys, peopleGroups, peopleQuotes, peopleLedger, excavatePeople, voiceSelf };')(
  deps.sbRest, deps.doorSet, async (e, col, r) => { ledger.push({ col, rows: r }); return r.length; }, ledgerWeekReal, (o, s) => Object.assign({ _status: s }, o), () => () => null);
const P0 = mkP({ sbRest: async () => [], doorSet: async () => null });
const keys = P0.peopleKeys({ generation: 'Gen Z', role: 'parent' }), k2 = P0.peopleKeys({ role: 'engineer' }), k3 = P0.peopleKeys({ role: 'nurse', gender: 'woman', place: 'Lagos' });
const said = ['As a nurse I wear these all shift', 'I am a hairstylist and my clients ask', 'As a mom of three this is the one', 'I work as a retail worker and see it daily'].map(t => P0.peopleKeys(P0.voiceSelf(t)).map(k => k.label).join('/')).join(',');
ok(keys.map(k => k.key + '=' + k.label).join('|') === 'gen:gen_z=Gen Z|role:parent=Parents' && k2[0].label === 'Engineers' && k3.length === 1 && k3[0].label === 'Nurses' && P0.peopleKeys(null).length === 0
   && said === 'Practitioners,Stylists,Parents,Retail workers',
  'P1 a speaker is grouped by what they said about themselves: their generation and their role as the voice reader hears it (a nurse is a practitioner there), never their gender or their town');
const mkq = (n, self, on, likes0, prefix) => Array.from({ length: n }, (_, i) => ({ text: (prefix || 'voice') + ' number ' + i + ' ' + (on || 'none'), likes: (likes0 || 100) - i, self, on }));
const quotes = [].concat(mkq(20, { generation: 'Gen Z' }, 'Smart glasses', 100, 'gz'), mkq(8, { generation: 'Gen Z' }, 'Curl care', 500, 'gzc'), mkq(6, { role: 'nurse' }, 'Smart glasses', 50, 'n'), mkq(4, { role: 'teacher' }, 'Presales', 40, 't'), mkq(10, null, 'Curl care', 10, 'anon'),
  [{ text: 'gz number 0 Smart glasses', likes: 1, self: { generation: 'Gen Z' }, on: 'Smart glasses' }]);
const G = P0.peopleGroups(quotes);
const gz = G.groups.find(g => g.key === 'gen:gen_z'), nu = G.groups.find(g => g.key === 'role:nurse');
ok(G.heard === 48 && G.described === 38 && G.groups.length === 2 && gz.n === 28 && gz.stands === true && nu.n === 6 && nu.stands === false && !G.groups.some(g => g.key === 'role:teacher'),
  'P2 every comment counted once; a group stands at 25 voices, is an early read from 5, and is not shown below that');
ok(gz.subjects.map(x => x.on + ':' + x.n).join(',') === 'Smart glasses:20,Curl care:8' && gz.quotes.length === 3 && gz.quotes[0].likes === 500 && new Set(gz.quotes.map(q => q.on)).size === 2 && gz.likes > 0,
  'P3 a group carries the subjects it spoke to (most first) and its most liked words, from more than one subject when it can');
const doorTiles = { night: '2026-10-05', tiles: [{ id: 'aaaaaaaa-0000-0000-0000-000000000001', label: 'Smart glasses' }, { id: 'aaaaaaaa-0000-0000-0000-000000000002', label: 'Curl care' }] };
const P = mkP({ doorSet: async () => doorTiles, sbRest: async (e, p) => { pPaths.push(p);
  // PostgREST hands back only the json paths asked for (select=id,voices:meta->voices,pool:meta->voices_pool)
  if (/^door_reads\?id=in\.\([^)]*\)&select=id,voices:meta->voices,pool:meta->voices_pool$/.test(p)) return [{ id: 'aaaaaaaa-0000-0000-0000-000000000001', voices: [{ text: 'tile only', likes: 1 }], pool: mkq(26, { generation: 'Millennial' }, null, 90, 'pool') }, { id: 'aaaaaaaa-0000-0000-0000-000000000002', voices: [{ text: 'a voice with no pool behind it', likes: 2, self: { role: 'stylist' } }], pool: null }];
  if (/^house_reads\?kind=eq\.report&status=in\.\(ready,published\)&select=voices:meta->pack->voices->quotes&order=updated_at\.desc&limit=1$/.test(p)) return [{ voices: [{ text: 'a report voice long enough to keep', likes: 4, self: { generation: 'Millennial' }, when: '2026-09-30' }, { text: 'The law will not save us | Jonathan Liew theguardian.com/commentisfree/2026/aug/31/x', likes: 900 }] }];
  return []; } });
const penv = { RATE_LIMIT: { get: async k => pkv[k] || null, put: async (k, v) => { pkv[k] = v; } } };
const pr = await P.excavatePeople(penv, '');
const mil = pr.groups.find(g => g.key === 'gen:millennial');
ok(pr.ok && pr.heard === 28 && mil && mil.n === 27 && mil.board === 26 && mil.report === 1 && mil.stands && mil.subjects[0].on === 'Smart glasses' && mil.subjects[0].n === 26 && pr.subjects === 2 && pr.floor === 25 && pr.night === '2026-10-05'
   && pPaths.some(p => /select=voices:meta->pack->voices->quotes&order=updated_at\.desc&limit=1$/.test(p)) && pPaths.some(p => /select=id,voices:meta->voices,pool:meta->voices_pool$/.test(p)) && mil.label === 'Millennials',
  'P4 GET /excavate/people reads each standing subject\'s pool (its six when it has no pool) and the latest monthly report\'s comments only (only those json paths travel), groups named as people say them (Millennials), naming each comment\'s subject and where it came from; a shared headline never counts');
ok(!pPaths.some(p => /recon/.test(p)) && pr.groups.every(g => g.quotes.every(q => Object.keys(q).sort().join(',') === 'likes,on,self,text,when')),
  'P5 never a RECON\'s voices, and a quote carries only its words, likes, date, what the speaker said about themselves and its subject');
const ledger0 = ledger.length, n0 = await P.peopleLedger(penv, null), nNight = await P.peopleLedger(penv, { tiles: doorTiles.tiles });
ok(ledger0 === 0 && n0 === 0 && nNight === 0 && ledger.length === 0, 'P6 a visitor\'s call writes nothing down, and neither does a board with no night');
await P.peopleLedger(penv, doorTiles);
ok(ledger.length === 1 && ledger[0].col === 'cohort' && ledger[0].rows.every(r => /^cohort:self:(gen|role):/.test(r.subject_key) && r.kind === 'cohort' && r.week === '2026-10-05' && typeof r.data.n === 'number' && typeof r.data.board === 'number' && typeof r.data.report === 'number')
   && !/peopleLedger/.test(fnOf(w, 'doorPublish')) && /\.then\(async \(\) => peopleLedger\(env, await doorSet\(env\)\)\)   \/\/ SEAM:PEOPLE/.test(w) && /out\.ledgered = await peopleLedger\(env, pub\);/.test(fnOf(w, 'doorVoicesPass')),
  'P6b the groups\' counts go in the ledger for the board\'s week once a day after the board\'s pass and after a fresh gather (never per landed read), with how many came from the board and how many from the report');
const PF = mkP({ doorSet: async () => doorTiles, sbRest: async (e, p) => { if (/^door_reads/.test(p)) throw new Error('sb_503'); return []; } });
const pkvF = {}, penvF = { RATE_LIMIT: { get: async k => pkvF[k] || null, put: async (k, v) => { pkvF[k] = v; } } };
ledger = []; const prF = await PF.excavatePeople(penvF, ''), nF = await PF.peopleLedger(penvF, doorTiles);
const PN = mkP({ doorSet: async () => null, sbRest: async () => [] }), prN = await PN.excavatePeople(penvF, '');
ok(prF.ok === false && prF.error === 'not_ready' && !Object.keys(pkvF).length && nF === 0 && ledger.length === 0 && prN.ok === false && !Object.keys(pkvF).length,
  'P6c when a read fails, or there is no board to count against, the people are not shown half counted, kept or written down');
pPaths = []; const pr2 = await P.excavatePeople(penv, '');
ok(pr2.cached === true && pPaths.length === 0 && /PEOPLE\.KEY\); \} \} catch \(e\) \{ excQuiet\('door_extras_drop'\)\(e\); \}   \/\/ SEAM:PEOPLE/.test(w), 'P7 the people are counted once an hour, and a fresh gather of voices drops that copy');

// ── G: the page ─────────────────────────────────────────────────────────
const brandsHtml = between(page, '<div id="sec-brands" class="page-section">', '<!-- ══ AUDIENCES ══ -->'), audHtml = between(page, '<div id="sec-audiences" class="page-section">', '<!-- ══ LIBRARY ══');
ok(/id="brand-grid"/.test(brandsHtml) && /id="brand-find"/.test(brandsHtml) && /id="brand-room"/.test(brandsHtml) && !/brand-tracker-grid|brand-search-input|brand-cat-row|Outmaneuver/.test(page) && /class="room-dateline">Brands</.test(brandsHtml),
  'G1 Brands is built in the room: the brands, a search, a room; the old grid, search, filter chips and headline are gone');
const visible = h => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
ok([brandsHtml, audHtml].every(h => !/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(visible(h)) && !/the house/i.test(visible(h)) && !/[—–]/.test(visible(h))), 'G2 no machinery word and no dash in either room\'s copy');
const brandJs = between(page, 'const _brands = { tracks: [], at: 0, open: null, room: null };', 'async function trackThis(name)');
let phone = false; const mq = [];
const win = { matchMedia: q => ({ matches: phone && /max-width: 640px/.test(q), addEventListener: (ev, fn) => mq.push(fn) }), addEventListener: () => {} };
const pulseStub = s => '<div class="pulse">' + (s || []).length + '</div>';
const pulseWeeks = new Function('_pulse', fnOf(page, '_pulseWeeks') + '; return _pulseWeeks;')(pulseStub);
const BJ = new Function('safe', 'safeAttr', 'safeUrl', 'API_BASE', '_pulse', '_pulseWeeks', 'window', brandJs + '; return { _brandColumns, _brandLines, _renderBrandRoom, _BRAND_SERIES, _fmtC, _day, _uuid };')(
  esc, esc, u => /^https?:\/\//.test(String(u)) ? esc(u) : '#', 'https://api.example/', pulseStub, pulseWeeks, win);
const weeks = Array.from({ length: 12 }, (_, i) => ({ start: ago((12 - i) * 7).slice(0, 10), n: i === 3 ? 0 : i + 1, outlets: Math.max(0, i - 1) }));
const col = BJ._brandColumns(weeks, '');
const widths = [...col.matchAll(/H([\d.]+)Q/g)].length;
const xs = [...col.matchAll(/<path class="col( dim)?" d="M([\d.]+) [\d.]+V[\d.]+Q[\d.]+ [\d.]+ ([\d.]+)/g)];
ok((col.match(/<rect class="hit"/g) || []).length === 12 && (col.match(/<path class="col/g) || []).length === 11 && (col.match(/class="col dim"/g) || []).length === 10 && /tabindex="0" data-tip="Week of [A-Z][a-z]{2} \d{1,2}, 2026: 12 stories, 10 outlets"/.test(col) && /<text class="vlabel strong"[^>]*>12<\/text>/.test(col) && widths === 11,
  'G3 the coverage chart: twelve weeks, a column for each week with stories (none for a zero), the newest in full red and labeled, every week answering on hover and focus with its stories and outlets');
const bw = [...col.matchAll(/<path class="col(?: dim)?" d="M([\d.]+) ([\d.]+)V([\d.]+)Q[\d.]+ [\d.]+ [\d.]+ [\d.]+H([\d.]+)Q([\d.]+)/g)].map(m => Number(m[5]) - Number(m[1]));
ok(bw.length === 11 && bw.every(x => x <= 24.01), 'G3b no column is wider than 24px; each has a 4px rounded top and a square foot');
const cutWeeks = weeks.map((x, i) => i < 3 ? Object.assign({}, x, { n: null, outlets: null }) : i === 3 ? Object.assign({}, x, { n: 5, outlets: 4, floor: true }) : x);
const colCut = BJ._brandColumns(cutWeeks);
ok((colCut.match(/<path class="col/g) || []).length === 9 && (colCut.match(/: not counted \(the room reads the newest 1,000 stories\)"/g) || []).length === 6 && /: at least 5 stories, at least 4 outlets"/.test(colCut) && !/at least 12 stories/.test(colCut),
  'G3d a week the read could not see draws no column and says it was not counted; a cut week says "at least"; whole weeks say their count plainly');
const att = { months: Array.from({ length: 36 }, (_, i) => '20' + String(23 + Math.floor((i + 9) / 12)) + '-' + String((i + 9) % 12 + 1).padStart(2, '0')), series: [{ label: 'Nike', role: 'subject', article: 'Nike, Inc.', views: Array.from({ length: 36 }, (_, i) => 1000 + i * 10) }, { label: 'Adidas', role: 'rival', views: Array.from({ length: 36 }, (_, i) => i === 5 ? null : 800) }, { label: 'Puma', role: 'rival', views: Array.from({ length: 36 }, () => 300) }] };
const ln = BJ._brandLines(att);
ok((ln.match(/<path class="ln" stroke="(#E8243E|#3987e5|#199e70)"/g) || []).length === 3 && /<div class="viz-legend">/.test(ln) && (ln.match(/<circle /g) || []).length === 3 && /not measured/.test(ln) && (ln.match(/<tr><td>/g) || []).length === 36 && /class="xh"/.test(ln) && BJ._BRAND_SERIES.join(',') === '#E8243E,#3987e5,#199e70',
  'G4 the attention chart: the brand and up to two rivals in the validated palette, a legend, an end dot and label for each, a crosshair, every month in a table (a missing month says not measured)');
const near = BJ._brandLines({ months: att.months, series: [{ label: 'Alpha', role: 'subject', views: att.months.map(() => 1000) }, { label: 'Bravo', role: 'rival', views: att.months.map(() => 990) }, { label: 'Charlie', role: 'rival', views: att.months.map(() => 960) }] });
const labY = [...near.matchAll(/<text class="vlabel[^"]*" x="[\d.]+" y="([\d.]+)">/g)].map(m => Number(m[1])).sort((p, q) => p - q);
ok(labY.length === 3 && labY[1] - labY[0] >= 14 && labY[2] - labY[1] >= 14 && BJ._brandLines({ months: att.months, series: [{ label: 'X', role: 'subject', views: [1, 2] }] }) === '',
  'G4b the end labels never sit closer than 14 to the one above, however close the lines end; a series that does not span the months is not drawn');
const j = { ok: true, measured_at: '2026-10-06T12:00:00Z', track: { name: 'Nike', sector: 'Athletic footwear', description: 'Sportswear company', image: 'https://kg/nike.jpg', image_license: 'CC BY' },
  coverage: { weeks, this_week: 12, prior_week: 11, total: 75, outlets: 30, at_least: true }, attention: { months: att.months, series: att.series, stats: { recent_3m: 3300, yoy_pct: 12, two_year_pct: null, peak_month: '2026-09', peak_views: 1350 } },
  set: [{ id: '22222222-2222-2222-2222-222222222222', name: 'Adidas', n7: 4, n30: 20, outlets_30d: 9, weeks: [1, 2] }, { id: "x');alert(1);('", name: 'Hostile', n7: 1, n30: 1, outlets_30d: 1, weeks: null }, { id: '33333333-3333-3333-3333-333333333333', name: 'Newcomer', n7: null, n30: null, outlets_30d: null, weeks: null }], stories: [{ title: 'Nike reissue', url: 'https://a/1', source: 'Hypebeast', date: '2026-10-05', image: null }],
  board: { night: '2026-10-05', claim: 'Casual buyers choose the archive.', move: 'Hold archive prices.', question: 'Who buys?', voices: [{ text: 'I bought the 2003 colorway', likes: 1, self: { role: 'parent' } }, { text: 'too expensive now', likes: 2, self: null }] }, record: { weeks: 3, since: '2026-09-21', on_board: 1 } };
const html = BJ._renderBrandRoom(j);
ok(/On the board this week/.test(html) && /Casual buyers choose the archive\./.test(html) && /<cite>A parent, 1 like<\/cite>/.test(html) && /<cite>Consumer, 2 likes<\/cite>/.test(html) && />12<\/div><div class="l">stories in the last 7 days/.test(html) && /at least 75<\/div><div class="l">stories in twelve weeks/.test(html) && /at least 30<\/div><div class="l">outlets in twelve weeks/.test(html) && /up 1 on the week before/.test(html)
   && /at least 12<\/div><div class="l">stories in the last 7 days<\/div><\/div>/.test(BJ._renderBrandRoom(Object.assign({}, j, { coverage: Object.assign({}, j.coverage, { this_floor: true }) }))) && /up 12% on the same months last year/.test(html),
  'G5 the room: the board\'s reading with its voices (credited by role, else Consumer), stat tiles that say "at least" when a count hit its limit (the last 7 days only when that week was cut, and then no change on the week before), the week and the year in words');
ok(BJ._uuid('AAAA1111-1111-1111-1111-111111111111') === 'aaaa1111-1111-1111-1111-111111111111' && BJ._uuid("x');alert(1);('") === '' && BJ._uuid(null) === ''
   && /history\.pushState\(\{ brand: id \}/.test(page) && /window\.addEventListener\('popstate', _brandRoute\); window\.addEventListener\('hashchange', _brandRoute\);/.test(page)
   && /if \(section !== 'brands' && typeof _brandHash === 'function' && _brandHash\(\)\)/.test(page) && /navTo\(typeof _brandHash === 'function' && _brandHash\(\) \? 'brands' : 'explore'\)/.test(page)
   && /const id = _brandHash\(\);\n  if \(id\) \{ if \(_brands\.open !== id\) _openBrand\(id, true\); \} else if \(!_brands\.open\) _closeBrand\(true\);/.test(page),
  'G12 a room has an address: opening from a card is a step Back undoes, the address opens its room on entry and by hand, leaving Brands clears it, a slow brand list never closes a room opened while it loaded, and only a brand id reaches an address or a handler');
ok(/const _pulseIO = \{ io: null, watch: \[\] \};/.test(page) && (page.match(/new IntersectionObserver\(/g) || []).length >= 1 && /_pulseIO\.watch = _pulseIO\.watch\.filter\(p => \{ if \(p\.isConnected\) return true; _pulseIO\.io\.unobserve\(p\); return false; \}\)/.test(page)
   && pulseWeeks([null, null, 3, 4]) === '<div class="pulse">2</div>' && pulseWeeks([null, null, null]) === '' && pulseWeeks(null) === '',
  'G13 one observer draws every line on the page and lets go of the lines of a closed room; a line starts at the first week counted, never a zero for a week that was not');
ok(/Against its set/.test(html) && /\(this brand\)|brow self/.test(html) && /onclick="_openBrand\('22222222-2222-2222-2222-222222222222'\)"/.test(html) && !/Hostile|alert/.test(html) && /<b>Newcomer<\/b><span><\/span><span class="n"><small>counted from the next daily count<\/small>/.test(html) && /<div class="brow self">/.test(html) && /The latest stories/.test(html) && /3 weeks on record since Sep 21, 2026, 1 of them on the board\./.test(html) && /href="mailto:hello@unsurfaced-intelligence\.com\?subject=RECON%3A%20Nike"/.test(html) && /Image: CC BY/.test(html) && /Source: Wikimedia pageviews, English Wikipedia, people only\. Article: Nike, Inc\./.test(html),
  'G6 the set opens its brands (only by an id that is a brand\'s, so nothing else reaches a handler), a brand not yet counted says so, the stories link out, the record counts its weeks, a RECON can be commissioned, the image and the readers are credited');
const noDelta = BJ._renderBrandRoom(Object.assign({}, j, { coverage: Object.assign({}, j.coverage, { prior_floor: true }) })), shortRoom = BJ._renderBrandRoom(Object.assign({}, j, { measurable: false, coverage: null, set: [{ id: '22222222-2222-2222-2222-222222222222', name: 'LG', measurable: false }], self: { measurable: false } }));
ok(!/on the week before/.test(noDelta) && /up 1 on the week before/.test(html) && /Its name is too short to find in headlines, so its coverage is not counted\./.test(shortRoom) && (shortRoom.match(/name too short to count/g) || []).length === 2 && !/counted from the next daily count/.test(shortRoom),
  'G5b no change on the week before is said unless both weeks were counted whole; a brand whose name cannot be counted says so in its room and its rows, never promising a count');
const selfRow = h => (h.match(/<div class="brow self">[\s\S]*?<\/div>(?=<button|<\/div><\/section>)/) || [''])[0];
const withSelf = BJ._renderBrandRoom(Object.assign({}, j, { self: { n7: 9, n30: 40, outlets_30d: 14, weeks: [3, 4, 2], floor7: false, floor30: true } }));
ok(/>9<small>7 days<\/small>/.test(selfRow(withSelf)) && />at least 40<small>30 days<\/small>/.test(selfRow(withSelf)) && />at least 14<small>outlets, 30 days<\/small>/.test(selfRow(withSelf)) && /counted from the next daily count/.test(selfRow(html)) && !/<small>7 days/.test(selfRow(html)) && !/<button[^>]*brow self/.test(withSelf),
  'G6b the brand\'s own row reads its set\'s counts, with "at least" where a count hit its limit; before its first count it says so instead of showing a zero; it is not a button');
phone = true;
const colP = BJ._brandColumns(weeks, ''), lnP = BJ._brandLines(Object.assign({}, att, { series: att.series.map((x, k) => k === 1 ? Object.assign({}, x, { label: 'Adidas Originals' }) : x) }));
phone = false;
ok(/viewBox="0 0 400 200"/.test(colP) && /viewBox="0 0 400 240"/.test(lnP) && />Adidas Or<\/text>/.test(lnP) && /viewBox="0 0 1000 220"/.test(BJ._brandColumns(weeks, '')) && mq.length === 1,
  'G3c a phone draws both charts on a 400-wide canvas so their labels keep their size, end labels shorten to fit, and the open room redraws when the width crosses');
const plain = visible(html);
ok(!/[—–]/.test(plain) && !/\b(signal|signals|lake|overnight|frame)\b/i.test(plain) && !/youtube|mastodon/i.test(plain), 'G7 no dash, no machinery word and no platform in a room');
const bare = BJ._renderBrandRoom({ ok: true, measured_at: '2026-10-06T12:00:00Z', track: { name: 'Quiet' }, coverage: { weeks: weeks.map(x => Object.assign({}, x, { n: 0, outlets: 0 })), this_week: 0, prior_week: 0, total: 0, outlets: 0, at_least: false }, attention: null, set: [], stories: [], board: null, record: null });
ok(!/On the board this week|Attention, three years|Against its set|The latest stories/.test(bare) && /No story about Quiet in twelve weeks of our sweep\./.test(bare) && /the same as the week before/.test(bare), 'G8 a quiet brand says so plainly: no empty sections, no invented line');
const audJs = between(page, 'let _peopleAt = 0;', '// ══ REPORTS (retired) ══');
const el = {}; ['people-groups', 'people-early', 'people-early-sec', 'people-figs', 'people-note', 'people-groups-sub', 'people-dateline'].forEach(id => { el[id] = { innerHTML: '', textContent: '', style: {} }; });
const AJ = new Function('document', 'fetch', 'API_BASE', 'safe', '_fmtN', '_day', audJs + '; return initAudiencesPage;')({ getElementById: id => el[id] || null },
  async () => ({ ok: true, json: async () => ({ ok: true, night: '2026-10-05', heard: 48, described: 38, subjects: 12, computed_at: '2026-10-06T12:00:00Z', groups: [
    { key: 'gen:gen_z', label: 'Gen Z', n: 28, stands: true, subjects: [{ on: 'Smart glasses', n: 20 }], quotes: [{ text: 'I wear mine to work', likes: 9, self: { generation: 'Gen Z' }, on: 'Smart glasses' }] },
    { key: 'role:nurse', label: 'Nurses', n: 6, stands: false, subjects: [{ on: 'Smart glasses', n: 6 }], quotes: [{ text: 'the shift is long', likes: 2, self: { role: 'nurse' }, on: 'Smart glasses' }] }] }) }),
  'https://api.example/', esc, n => Number(n).toLocaleString('en-US'), d => String(d).slice(0, 10));
await AJ();
ok(/<b>48<\/b><span>comments read<\/span>/.test(el['people-figs'].innerHTML) && /<h3>Gen Z<\/h3><div class="pn">28 comments · 1 subject<\/div>/.test(el['people-groups'].innerHTML) && /Gen Z, 9 likes · on Smart glasses/.test(el['people-groups'].innerHTML)
   && el['people-early-sec'].style.display === 'block' && /Nurses<small>6 comments · on Smart glasses<\/small>/.test(el['people-early'].innerHTML) && /week of 2026-10-05/.test(el['people-dateline'].textContent) && !/youtube|mastodon/i.test(el['people-note'].textContent) && /comments, not people/.test(el['people-note'].textContent) && /up to three months old/.test(el['people-note'].textContent) && !/\bpeople ·|voices? ·/.test(el['people-groups'].innerHTML),
  'G9 Audiences: the counts are comments, never people, and say how old they can be; the week\'s figures, the standing groups as cards with their subjects and words, the early reads as rows, where the words come from without naming a platform');
ok(!/initAudiencesPage[\s\S]{0,400}\/excavate\/audiences/.test(audJs) && /'\/excavate\/people'/.test(audJs), 'G10 the page reads the people, not the old keyword counts');
const counts = {}; for (const m of page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) { if (/src=|module|json|importmap/.test(m[1])) continue; for (const f of m[2].matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) counts[f[1]] = (counts[f[1]] || 0) + 1; }
ok(Object.values(counts).every(n => n === 1) && counts._renderBrandRoom === 1 && counts.trackThis === 1 && !counts.searchBrand && !counts.excavateBrand && !counts._brandLakeLoad && !counts.showAudienceDetail, 'G11 one function per name; the retired brand dashboard and cohort cards are gone');

// ── Z: seams ────────────────────────────────────────────────────────────
ok(['SEAM:BRAND_ROOM', 'SEAM:BRAND_ROOM@page', 'SEAM:PEOPLE', 'SEAM:PEOPLE@page'].every(k => seams.registry[k]) && /EX19/.test(seams.registry['SEAM:TRACKS@page'].purpose) && /EX19/.test(seams.registry['SEAM:AUDIENCES@page'].purpose), 'Z1 the seams are registered and the old ones say what they are now');

console.log('\nproof_rooms: ' + pass + ' checks PASS');
