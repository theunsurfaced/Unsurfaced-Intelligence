/**
 * proof_sweep_ledger.mjs  --  EX18b THE FIXES: measuring and finding as separate jobs (SEAM:SWEEP_MEASURE), the board's own
 * voices and a band that never quotes a RECON (SEAM:DOOR_VOICES), EXCAVATE's memory (SEAM:LEDGER), the Library (SEAM:LIBRARY).
 * Runs the shipped code on fakes. Run from the repo root: node worker/proofs/proof_sweep_ledger.mjs
 *   S  the sweep             V  the board's voices        L  the ledger        P  the page        Z  migration, seams, gate
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8'));
const mig = fs.readFileSync('supabase/migrations/0038_sweep_ledger.sql', 'utf-8');
const mig39 = fs.readFileSync('supabase/migrations/0039_research_backfill.sql', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };
const quiet = () => { const o = console.log; const logs = []; console.log = (...a) => logs.push(a.join(' ')); return { logs, done: () => { console.log = o; } }; };
const fnOf = (name) => { const i = w.indexOf('async function ' + name + '(') >= 0 ? w.indexOf('async function ' + name + '(') : w.indexOf('function ' + name + '('); const j = w.indexOf('\n}\n', i); return w.slice(i, j + 3); };

// ── S: the sweep ──────────────────────────────────────────────────────────
const sweepSrc = between(w, '/* SEAM:SWEEP_MEASURE: measuring and finding are separate jobs.', 'const LIVE_KINDS = ');
let probes = 0, probeMode = 'ok';
const sbProbe = async (env, path) => { probes++; if (probeMode === 'missing') throw new Error('sb_400'); if (probeMode === 'blip') throw new Error('sb_network'); return [{ research: false }]; };
const mkSweep = (sb) => new Function('sbRest', sweepSrc + '; return { SWEEP, sweepReady, sweepOnly, sweepRefound, _sweep };')(sb || sbProbe);
let SW = mkSweep();
ok(await SW.sweepReady({}) === true && await SW.sweepReady({}) === true && probes === 1, 'S1 the column is probed once and the answer kept (ten minutes)');
ok(await SW.sweepOnly({}) === '&research=is.false', 'S2 a public count asks the sweep only once the column exists');
probes = 0; probeMode = 'missing'; SW = mkSweep();
let q = quiet(); const miss1 = await SW.sweepReady({}); const miss2 = await SW.sweepOnly({}); q.done();
ok(miss1 === false && miss2 === '' && probes === 1 && q.logs.filter(l => /sweep_column_missing: run migration 0038/.test(l)).length === 1, 'S3 before migration 0038 the worker counts as before and says so once in the log');
probes = 0; probeMode = 'blip'; SW = mkSweep();
const blip = await SW.sweepReady({});
probeMode = 'ok'; const after = await SW.sweepReady({});
ok(blip === true && after === true && probes === 2, 'S4 a network blip is not an answer: nothing is cached, the next call asks again, and meanwhile a public count asks the sweep only (it fails closed)');
probes = 0; probeMode = 'missing'; SW = mkSweep(); q = quiet(); await SW.sweepReady({}); q.done(); SW._sweep.at = 0; probeMode = 'blip';
ok(await SW.sweepReady({}) === false && probes === 2, 'S4b a blip after the column was found missing keeps that answer');
probes = 0; SW = mkSweep(async () => { probes++; throw new Error('sb_429'); });
ok(await SW.sweepReady({}) === true && await SW.sweepOnly({}) === '&research=is.false' && probes === 2, 'S4c a 401, 408 or 429 is a blip too: only a 400 (no such column) says the column is missing');
ok(!/\bresearch\s*(:|=)/.test(fnOf('lakeCapture').replace(/\/\/[^\n]*/g, '')) && !/sweepIsResearch/.test(w), 'S5 which rows are research is the database\'s call (0038\'s trigger): the worker never sends the flag, so a capture can never fail on it before the migration');
// the board's recurrence runs on the sweep
const recSrc = between(w, 'async function fetchRecurrenceRows(', 'function weekEpoch(');
const paths = [];
const fr = new Function('sbRest', 'RECUR', 'sweepOnly', recSrc + '; return fetchRecurrenceRows;')(async (env, p) => { paths.push(p); return []; }, { SLICES: 10, SLICE_ROWS: 120 }, async () => '&research=is.false');
await fr({}, 60, null);
ok(paths.length === 10 && paths.every(p => /status=in\.\(connected,published\)&cluster_id=not\.is\.null&research=is\.false&order=captured_at\.desc&limit=120/.test(p)),
  'S6 the board\'s states and ranks count the sweep: every slice of the recurrence scan asks research = false, inside its 120 rows');
const tr = fnOf('tracksRefresh'), au = fnOf('audiencesRefresh'), em = fnOf('excMeasures'), cf = fnOf('composeFromLake');
ok(/const sw = await sweepOnly\(env\);/.test(tr) && /if \(sw\) for \(let i = 0; i < tracks\.length; i \+= MEMORY\.TRACK_CHUNK\)/.test(tr) && /s\.title ilike tp\.pat and s\.research = false and s\.status <> 'rejected'/.test(fs.readFileSync('supabase/migrations/0040_memory.sql', 'utf-8')), 'S7 a tracked brand counts the sweep (the database\'s rollup reads research = false only, and is asked only when the sweep is known)');
ok(/const sw = await sweepOnly\(env\);/.test(au) && /ilikeOr\(c\.terms\) \+ sw \+ '&captured_at=gte\.'/.test(au), 'S8 a cohort counts the sweep');
ok((em.match(/\+ sw \+ '&captured_at=gte\./g) || []).length === 3, 'S9 a read\'s measures (the subject, its territory, its competitors) never count what its own search brought in');
ok(/`signals\?status=in\.\(connected,filtered\)&captured_at=gte\.\$\{since\}` \+ sw \+/.test(cf), 'S10 DAILY picks from the sweep: a RECON\'s gathers never become the paper');
// the sweep's refound: run it
let flips = [];
const SWR = mkSweep(async (env, path, opts) => { if (opts && opts.method === 'PATCH') { flips.push({ path, body: opts.body }); return null; } return [{ research: false }]; });
const rowsIn = Array.from({ length: 45 }, (_, i) => ({ content_hash: i.toString(16).padStart(64, 'a') }));
const nFlip = await SWR.sweepRefound({}, rowsIn.concat([{ content_hash: "bad'hash" }]), rowsIn.slice(0, 3));
ok(nFlip === 42 && flips.length === 2 && flips.every(f => /^signals\?content_hash=in\.\([0-9a-f,]+\)&research=is\.true$/.test(f.path) && f.body.research === false) && flips[0].path.split(',').length === 40 && !flips.some(f => f.path.includes(rowsIn[0].content_hash)),
  'S11 the sweep re-finds stories a search brought in first: those (and only those it did not just insert) flip to the sweep, forty to a request, and a malformed hash never reaches the query');
const SWR0 = mkSweep(async () => { throw new Error('sb_400'); });
q = quiet(); const n0f = await SWR0.sweepRefound({}, rowsIn, []); q.done();
ok(n0f === 0, 'S12 before the migration the refound asks nothing');
ok(/await sweepRefound\(env, rows, fresh\);/.test(fnOf('spineCapture')) && /\(await sweepOnly\(env\)\)/.test(fnOf('dailyLakePublic')), 'S12b the spine calls the refound after every insert; the public ticker counts the sweep');
// the RECON in flight is untouched: its research reads the lake as it always did. Every place the sweep is asked for, by function:
const enclosing = i => { const head = w.slice(0, i); const m = [...head.matchAll(/^(?:async )?function (\w+)\(/gm)].pop(); return m ? m[1] : null; };
const askers = new Set([...w.matchAll(/await sweepOnly\(env\)/g)].map(m => enclosing(m.index)));
ok([...askers].sort().join(',') === 'audiencesRefresh,brandRoom,composeFromLake,dailyLakePublic,excMeasures,fetchRecurrenceRows,tracksRefresh',
  'S13 the sweep is asked for in exactly seven places: the board\'s recurrence, tracked brands, a brand\'s room, cohorts, a read\'s measures, DAILY\'s picks and the public ticker');
const flaggers = new Set([...w.matchAll(/await sweepReady\(env\)/g)].map(m => enclosing(m.index)));
ok([...flaggers].sort().join(',') === 'excavatePropose,sweepOnly,sweepRefound',
  'S14 the column is asked about only by the sweep\'s refound, the ledger\'s sweep note and sweepOnly: a RECON\'s stages, a read\'s pack and a tile\'s evidence read the whole lake, research included');

const fl = between(w, "const echo = near.find(n => n.id !== r.id && n.similarity >= SPINE.ECHO_SIM);", 'calls++;\n        const reply');
ok(/if \(echo\.research === true && !\/\^\(live\|recon\)\/\.test\(String\(\(r\.momentum && r\.momentum\.provenance\) \|\| ''\)\) && calls \+ 1 <= budget\)/.test(fl) && /'signals\?id=eq\.' \+ echo\.id \+ '&research=is\.true', \{ method: 'PATCH', headers: \{ Prefer: 'return=minimal' \}, body: \{ research: false \} \}/.test(fl) && fl.indexOf("research: false") < fl.indexOf("status: 'rejected'"),
  'S15 research never erases the sweep: a sweep story that echoes a search\'s row makes that row the sweep\'s before the copy is set aside (inside the drain\'s call budget)');
ok(/momentumMech\(near\.filter\(n => n\.research !== true\), r\.territory, r\.source_tier, novelty\)/.test(w), 'S16 research never ranks the paper: a story\'s momentum counts the sweep around it');

// ── V: the board's voices ─────────────────────────────────────────────────
const voiceSrc = w.slice(w.indexOf('const VOICES = {'), w.indexOf('function voiceOnFrame(')) + w.slice(w.indexOf('function stripHtml('), w.indexOf('function hintsOf('));
const dvSrc = between(w, 'const DOOR_VOICES = {', '/* The voices alone, for the tiles standing now');
const now = Date.parse('2026-10-06T12:00:00Z'), day = 864e5, d = n => new Date(now - n * day).toISOString();
const mkV = (rails, src) => new Function('RAIL_FNS', 'RAIL_BY_ID', 'excQuiet', voiceSrc + (src || dvSrc) + '; return { DOOR_VOICES, doorVoices, doorVoicePick, doorBand, doorVoicePublic, doorVoicesKeep };')(rails, { youtube: { id: 'youtube' }, mastodon: { id: 'mastodon' } }, () => () => null);
const V0 = mkV({});
const picked = V0.doorVoicePick([
  { src: 'yt:a', text: 'first from video a, long enough to keep', likes: 50, when: d(2), self: { generation: 'Gen Z' } },
  { src: 'yt:a', text: 'second from video a, long enough to keep', likes: 40, when: d(3) },
  { src: 'yt:a', text: 'third from video a, long enough to keep', likes: 30, when: d(4) },
  { src: 'yt:b', text: 'First from video a, long enough to keep', likes: 20, when: d(1) },
  { src: 'yt:b', text: 'a voice from two years back, long enough', likes: 9000, when: d(700) },
  { src: 'ma:c', text: 'The law will not save us | Jonathan Liew theguardian.com/commentisfree/2026/aug/31/x', likes: 500 },
  { src: 'ma:c', text: 'short', likes: 999 },
  { src: 'ma:d', text: 'undated but a real voice all the same', likes: 1 }], now);
ok(picked.map(v => v.text).join('|') === 'first from video a, long enough to keep|second from video a, long enough to keep|undated but a real voice all the same',
  'V1 a subject keeps the most liked voices: two a video at most, deduplicated by text, nothing older than a quarter, no shared headline, nothing too short to say anything');
ok(picked.map(V0.doorVoicePublic).every(v => Object.keys(v).sort().join(',') === 'likes,self,text,when') && picked[0].src === 'yt:a' && picked[0].when === d(2).slice(0, 10) && picked[0].self.generation === 'Gen Z' && /\.map\(doorVoicePublic\) \};/.test(fnOf('doorTile')),
  'V2 a voice shown anywhere carries its words, likes, date and what the speaker said about themselves; the video it came from stays on the row (for the two-a-video rule), never on a tile');
const many = Array.from({ length: 20 }, (_, i) => ({ src: 'yt:' + i, text: 'voice number ' + i + ' long enough to keep', likes: i, when: d(1) }));
ok(V0.doorVoicePick(many, now).length === V0.DOOR_VOICES.KEEP && V0.DOOR_VOICES.KEEP === 6, 'V3 six voices a subject');
ok(V0.doorVoicePick([{ src: 'yt:z', text: 'first! love your videos so much', likes: 900, when: d(1), on_frame: false }, { src: 'yt:z', text: 'the glasses lasted my whole shift', likes: 2, when: d(1), on_frame: true }, { src: 'ma:z', text: 'no frame to judge this one by', likes: 1, when: d(1), on_frame: null }], now).map(v => v.text).join('|') === 'the glasses lasted my whole shift|no frame to judge this one by',
  'V3b a comment that is not about the subject is never quoted under its name, however liked');
let asked = [];
const pushN = (ctx, src, n, likes0) => { const vv = ctx.meta.voices = ctx.meta.voices || { sources: [], quotes: [] }; for (let i = 0; i < n; i++) if (vv.quotes.length < (ctx.voiceMax || 150)) vv.quotes.push({ src, text: 'comment ' + src + ' number ' + i + ' about the glasses', likes: likes0 - i, when: d(3), on_frame: ctx.frame ? true : null }); };
const V1 = mkV({
  youtube: async (env, qq, ctx) => { asked.push(['yt', qq, ctx.since, ctx.voiceMax, !!ctx.frame]); pushN(ctx, 'yt:v1', 100, 500); pushN(ctx, 'yt:v2', 100, 400); pushN(ctx, 'yt:v3', 100, 300); },
  mastodon: async (env, qq, ctx) => { asked.push(['ma', qq]); pushN(ctx, 'ma:p', 40, 50); } });
const frameG = { entity: 'Ray-Ban Meta', anchors: ['smart glasses', 'ray-ban meta'], category: 'Wearables' };
const got = await V1.doorVoices({}, { query: 'smart glasses at work', title: 'Smart glasses' }, frameG);
ok(asked[0][0] === 'yt' && asked[0][1] === 'smart glasses at work' && asked[0][2] === new Date(Date.now() - 30 * day).toISOString().slice(0, 10) && asked[0][3] === 340 && asked[0][4] === true && asked[1][0] === 'ma' && asked[1][1] === 'Ray-Ban Meta',
  'V4 each subject is asked its own question through its frame: the month\'s videos on YouTube, its shortest name on Mastodon (a tag), with room for every comment the rails fetch');
const top = V1.doorVoicesKeep(got, null, Date.now());
ok(got.length === 40 && new Set(got.map(v => v.src)).size === 3 && got.filter(v => v.src === 'yt:v1').length === 15 && top.voices.length === 6 && top.voices.map(v => v.likes).join(',') === '500,499,400,399,300,299' && top.voices_pool.length === 40 && !('src' in top.voices[0]),
  'V4b one video never fills the room: the pool keeps forty (fifteen at most from one video) for the people page; the tile\'s six come from all three videos, two each, the most liked first, and carry no source');
ok((await V1.doorVoices({}, { query: '', title: '' }, frameG)).length === 0, 'V5 a subject with no question gathers nothing');
asked = [];
ok((await V1.doorVoices({}, { query: 'curl care', title: 'Curl care' }, null)).length === 0 && (await V1.doorVoices({}, { query: 'curl care' }, { anchors: [] })).length === 0 && asked.length === 0,
  'V5b without a frame nothing can say a comment is about the subject: nothing is asked, and the subject keeps its last voices');
await V1.doorVoices({}, { query: 'texture first curl care shelves', title: 'Curl care' }, { anchors: ['texture-first shelves', 'curl care', 'ai'] });
ok(asked[1][0] === 'ma' && asked[1][1] === 'curl care', 'V5c Mastodon reads a tag, so it is asked the subject\'s shortest real name (three letters or more)');
const V2 = mkV({ youtube: () => new Promise(() => {}), mastodon: async () => {} }, dvSrc.replace('MS: 12000', 'MS: 30'));
const t0 = Date.now(); const stuck = await V2.doorVoices({}, { query: 'q' });
ok(Array.isArray(stuck) && Date.now() - t0 < 2000 && /MS: 12000, PASS_MS: 120000/.test(dvSrc), 'V6 a rail that never answers cannot hold the pass: a subject stops at twelve seconds, the whole pass gives voices two minutes');
const KP = new Function('DOOR_VOICES', 'doorVoicePick', between(w, '// PURE: what a subject keeps:', '/* The voices alone') + '; return doorVoicesKeep;')({ FRESH_D: 90 }, V0.doorVoicePick);
const kept1 = KP([], { voices: [{ text: 'last week', when: d(10) }, { text: 'from last spring', when: d(200) }], voices_at: '2026-09-29T06:00:00Z' }, now), kept2 = KP([{ text: 'tonight, a voice long enough to keep', src: 'yt:t', likes: 2 }], { voices: [{ text: 'last week' }] }), kept3 = KP([], null);
ok(kept1.voices.length === 1 && kept1.voices[0].text === 'last week' && kept1.voices_at === '2026-09-29T06:00:00Z' && kept2.voices[0].text === 'tonight, a voice long enough to keep' && kept2.voices_pool[0].src === 'yt:t' && !('src' in kept2.voices[0]) && /^\d{4}-/.test(kept2.voices_at) && kept3.voices.length === 0 && kept3.voices_at === null,
  'V6b a gather that comes back empty keeps the subject\'s last voices and their date (still aging out after a quarter); a subject is never emptied by a failed ask');
const dp = fnOf('doorPass');
const iKept = dp.indexOf("out.kept++; continue; }"), iVoice = dp.indexOf('const vt = Date.now(), heard = voicesSpent < DOOR_VOICES.PASS_MS ? await doorVoices(env, cand, frame) : [];'), iReuse = dp.indexOf('out.reused++;'), iThin = dp.indexOf("error: 'thin_evidence'");
ok(iThin > 0 && iKept > iThin && iVoice > iKept && iReuse > iVoice && /Object\.assign\(base\.meta, doorVoicesKeep\(heard, prev && prev\.meta\)\);/.test(dp) && /select=id,frame_key,night,stamp,read,measures,frame,meta'/.test(dp) && /let voicesSpent = 0;/.test(dp) && /voicesSpent \+= Date\.now\(\) - vt;/.test(dp)
   && /!!prev\.measures\.sweep === !!\(measures && measures\.sweep\) \? prev\.measures : null;/.test(dp) && /m\.sweep = !!sw;/.test(fnOf('excMeasures')),
  'V7 the door pass gathers a subject\'s voices after the thin and kept checks (a read kept tonight spends nothing), within two minutes of their own time, keeping last week\'s when the gather is empty, before the reuse so a reused read gets fresh voices; "since" compares only passes that counted the same way');
ok(/voices: \(r\.meta && Array\.isArray\(r\.meta\.voices\) \? r\.meta\.voices : \[\]\)\.slice\(0, DOOR_VOICES\.KEEP\)\.map\(doorVoicePublic\) \};/.test(fnOf('doorTile')) && !/voices_pool/.test(fnOf('doorTile')), 'V8 a tile carries its subject\'s six voices, never the pool');
// the desk's voices pass
const vpSrc = between(w, '/* The voices alone, for the tiles standing now', '/* ═══ SEAM:LEDGER');
const vpPatches = [], vpDel = [], vpAsked = []; let published = 0;
let vpLedger = null;
const VP = new Function('doorSet', 'sbRest', 'doorVoices', 'doorVoicesKeep', 'doorPublish', 'DOOR_EXTRAS', 'excQuiet', 'PEOPLE', 'peopleLedger', vpSrc + '; return doorVoicesPass;')(
  async () => ({ tiles: [{ id: 'd1', title: 'Smart glasses', frame: { query: 'smart glasses' } }, { id: 'd2', title: 'Curl care', frame: { query: 'curl care' } }, { id: 'd3', title: 'Presales', frame: { query: 'presales' } }, { id: 'd0', title: 'last night', carried: true }] }),
  async (env, path, opts) => { if (opts && opts.method === 'PATCH') { vpPatches.push({ path, body: opts.body }); return null; } const id = /id=eq\.(\w+)/.exec(path)[1]; return id === 'd2' ? [] : [{ id, frame: { query: id === 'd1' ? 'smart glasses at work' : 'ticket presales', anchors: ['x'] }, meta: { since: { recent_delta: 3 }, batch_id: 'b1', voices: [{ text: 'kept from last week' }], voices_at: '2026-09-29T06:00:00Z' } }]; },
  async (env, c, f) => { vpAsked.push([c.query, !!f]); return c.query === 'ticket presales' ? [] : [{ text: 'voice for ' + c.query, likes: 1, when: null, self: null }]; }, KP,
  async () => { published++; return { night: '2026-10-05', tiles: [] }; }, { KEY: 'door:extras:v3' }, () => () => null, { KEY: 'people:v2' }, async (env, set) => { vpLedger = set; return 4; });
const vp = await VP({ RATE_LIMIT: { delete: async k => vpDel.push(k) } });
ok(vp.tiles === 3 && vp.gathered === 2 && vp.quotes === 1 && vp.kept === 1 && vpPatches.length === 2 && /door_reads\?id=eq\.d1/.test(vpPatches[0].path) && vpPatches[0].body.meta.batch_id === 'b1' && vpPatches[0].body.meta.since.recent_delta === 3 && vpPatches[0].body.meta.voices[0].text === 'voice for smart glasses at work'
   && vpPatches[1].body.meta.voices[0].text === 'kept from last week' && vpAsked.every(a => a[1]) && vpAsked.map(a => a[0]).join('|') === 'smart glasses at work|ticket presales',
  'V9 the desk\'s voices pass asks each standing tile through its own row\'s frame, one at a time (a carried tile is left to its own night; a missing row is skipped), keeps everything else on the row, and keeps last week\'s voices when tonight\'s gather is empty');
ok(!/Promise\.all/.test(vpSrc) && published === 1 && vpDel[0] === 'door:extras:v3' && vpDel[1] === 'people:v2' && vp.ledgered === 4 && vpLedger && vpLedger.night === '2026-10-05' && /which === 'voices' \? await doorVoicesPass\(env\)/.test(w), 'V10 one subject at a time (the YouTube allowance is counted exactly), then the arrival republishes and the band is rebuilt; the desk runs it with {run: voices}, free, no model');

// ── L: the ledger ─────────────────────────────────────────────────────────
const ledSrc = between(w, '/* ═══ SEAM:LEDGER: EXCAVATE remembers what it posts.', '/* ═══════════════════════════════════════════════════════════════════════════\n * SEAM:EXC_DOOR v2');
const puts = []; let sbThrow = false;
const L = new Function('sbRest', ledSrc + '; return { LEDGER, ledgerWeek, ledgerPut, ledgerVoiceCounts, ledgerBoardRows, ledgerDoorRows };')(async (env, path, opts) => { if (sbThrow) throw new Error('sb_404'); puts.push({ path, opts }); return null; });
ok(L.ledgerWeek('2026-10-06') === '2026-10-05' && L.ledgerWeek('2026-10-05') === '2026-10-05' && L.ledgerWeek('2026-10-11') === '2026-10-05' && L.ledgerWeek('2026-10-12T03:00:00Z') === '2026-10-12' && L.ledgerWeek('nonsense') === null && /^\d{4}-\d{2}-\d{2}$/.test(L.ledgerWeek()),
  'L1 a row speaks for the week of the Monday (UTC) it falls in');
const n1 = await L.ledgerPut({}, 'track', [{ subject_key: 'track:t1', kind: 'track', week: '2026-10-05', title: 'Nike', data: { n7: 4 } }, { subject_key: 'track:t2', kind: 'track', week: '2026-10-05', data: { n7: 0 } }, { subject_key: 'x', kind: 'bogus', week: '2026-10-05' }, { kind: 'track', week: '2026-10-05' }]);
const body = puts[0].opts.body;
ok(n1 === 2 && puts[0].path === 'subject_weeks?on_conflict=subject_key,week' && /resolution=merge-duplicates/.test(puts[0].opts.headers.Prefer) && body.every(r => Object.keys(r).sort().join(',') === 'kind,subject_key,title,track,updated_at,week') && body[1].title === 'track:t2' && body[0].track.n7 === 4,
  'L2 each writer owns its column: a row carries its key, week, kind, title and that one column, merged per week, never another writer\'s');
ok(await L.ledgerPut({}, 'nonsense', [{ subject_key: 'track:t1', kind: 'track', week: '2026-10-05' }]) === 0 && puts.length === 1, 'L3 a column the ledger does not have is never written');
sbThrow = true; q = quiet(); const n0 = await L.ledgerPut({}, 'door', [{ subject_key: 'theme:a', kind: 'theme', week: '2026-10-05' }]); q.done(); sbThrow = false;
ok(n0 === 0 && q.logs.some(l => /ledger_put door sb_404/.test(l)), 'L4 a missing table costs a log line, never a page');
const prop = [{ cluster_id: 'c1', title: 'Smart glasses at work', state: 'ACCELERATING', shape: 'staircase', evidence: { recent_7d: 9, prior_7d: 3, weeks_touched: 6, sources: 7, territories: ['tech'] } }, { cluster_id: 'c2', title: 'Curl care', state: 'STRUCTURAL', evidence: {} }];
const rowsB = L.ledgerBoardRows(prop, [{ cluster_id: 'c1', week_series: [1, 2, 3, 9] }], { window_days: 60, scanned: 1200, candidates: 40, field: { read: 'People wear their glasses to work. Brands follow.', states: { ACCELERATING: 1 } } }, true, '2026-10-05');
ok(rowsB.length === 3 && rowsB[0].subject_key === 'theme:c1' && rowsB[0].data.place === 1 && rowsB[1].data.place === 2 && rowsB[0].data.week_series.join(',') === '1,2,3,9' && rowsB[1].data.week_series === null && rowsB[0].data.sampled === true && rowsB[0].data.sweep === true && rowsB[0].data.recent_7d === 9,
  'L5 the board\'s week: each subject with its place, state, shape, measures and week series, marked sampled and whether it counted the sweep only');
ok(rowsB[2].subject_key === 'field:week' && rowsB[2].kind === 'field' && rowsB[2].data.read === 'People wear their glasses to work. Brands follow.' && L.ledgerBoardRows(prop, [], { field: { read: '' } }, false, '2026-10-05').length === 2,
  'L6 the week\'s read is kept as what we said that week (and nothing is kept when there was none)');
const rowsD = L.ledgerDoorRows([{ key: 'theme:c1', night: '2026-10-06', id: 'd1', label: 'Smart glasses', claim: 'Nurses wear them.', move: 'Sell to hospitals.', question: 'Who wears them?', measures: { recent_7d: 9, state: 'ACCELERATING', series: [1, 2] }, voices: [{ self: { generation: 'Gen Z', role: 'nurse' } }, { self: { generation: 'Gen Z' } }, { self: null }] },
  { key: 'track:t1', night: '2026-10-06', title: 'Nike', measures: {} }, { key: 'theme:old', night: '2026-09-29', carried: true }, { key: 'weird:x', night: '2026-10-06' }]);
ok(rowsD.length === 2 && rowsD[0].week === '2026-10-05' && rowsD[0].data.rank === 1 && rowsD[0].data.label === 'Smart glasses' && rowsD[0].data.claim === 'Nurses wear them.' && rowsD[0].data.question === 'Who wears them?' && rowsD[0].data.state === 'ACCELERATING' && rowsD[0].data.voices.n === 3 && rowsD[0].data.voices.generations['Gen Z'] === 2 && rowsD[0].data.voices.roles.nurse === 1 && rowsD[1].kind === 'track',
  'L7 what the arrival posted: each tile standing for its own night, with its rank, label, claim, move, question, state and who spoke; a carried tile is left to its own week');
puts.length = 0;
await L.ledgerPut({}, 'door', rowsD.concat([Object.assign({}, rowsD[0], { data: Object.assign({}, rowsD[0].data, { claim: 'the later write' }) })]));
const db = puts[0].opts.body;
ok(db.length === 2 && db.every(r => !('title' in r) && Object.keys(r).sort().join(',') === 'door,kind,subject_key,updated_at,week') && db.find(r => r.subject_key === 'theme:c1').door.claim === 'the later write',
  'L7b the door never overwrites a subject\'s title (its label rides in its own column), and a write never carries one key twice (Postgres would refuse it): the later wins');
ok(/if \(internal === true\) await ledgerPut\(env, 'board', ledgerBoardRows\(proposed, themes, out, await sweepReady\(env\), ledgerWeek\(\)\)\);/.test(w), 'L8 the board\'s week is kept when the feed warms (the internal propose), never on a visitor\'s call');
ok(/await ledgerPut\(env, 'door', ledgerDoorRows\(tiles\)\);/.test(fnOf('doorPublish')) && /ledgerPut\(env, 'track', tracks\.filter\(t => \(stats\[t\.id\] \|\| \{\}\)\.counted\)\.map/.test(fnOf('tracksRefresh')) && /counted = true;/.test(fnOf('tracksRefresh')) && /ledgerPut\(env, 'cohort', COHORTS\.filter\(c => out\[c\.key\] && !out\[c\.key\]\.failed\)\.map/.test(fnOf('audiencesRefresh')) && /last\[c\.key\] \|\| \{\}, \{ failed: true \}\); \}/.test(fnOf('audiencesRefresh')) && /counted \|\| !last\[t\.id\] \?/.test(fnOf('tracksRefresh')) && /sweep: !!sw/.test(fnOf('tracksRefresh')) && /sweep: !!sw/.test(fnOf('audiencesRefresh')),
  'L9 the arrival, the tracked brands and the cohorts each write their own column, saying whether they counted the sweep; a count that failed is never kept as a zero, and the public counts keep the last good one');
const ledgerLines = w.split('\n').filter(l => /LEDGER\.TABLE \+/.test(l));
ok(!/method: 'DELETE'[^\n]*(subject_weeks|LEDGER\.TABLE)|(subject_weeks|LEDGER\.TABLE)[^\n]*method: 'DELETE'/.test(w) && ledgerLines.length >= 2 && ledgerLines.every(l => !/method: '(DELETE|PATCH)'/.test(l) && (!/method: 'POST'/.test(l) || /resolution=merge-duplicates/.test(l))) && !/'subject_weeks\?/.test(w) && /LEDGER\.TABLE \+ '\?subject_key=eq\.' \+ encodeURIComponent\('track:' \+ t\.id\) \+ '&select=week,door&order=week\.asc&limit=260'/.test(w),
  'L10 nothing deletes or patches a ledger row: every write through LEDGER.TABLE is an upsert that merges (each writer its own columns), every other use is a read');

// ── the band, at the feed ─────────────────────────────────────────────────
const ex = fnOf('doorExtras');
ok(/house_reads\?kind=eq\.report&status=in\.\(ready,published\)/.test(ex) && !/recon/.test(ex.replace(/\/\/[^\n]*/g, '')) && /out\.voices = doorBand\(\(door && door\.tiles\) \|\| \[\], quotes\)/.test(ex) && !/from: r\.label|source: q\.source/.test(ex),
  'V11 the band asks the monthly report only, never a RECON, and no read\'s name or platform rides on a quote');
ok(/const DOOR_EXTRAS = \{ KEY: 'door:extras:v[4-9]'/.test(w), 'V12 the extras move to a new key: the cached copy that held RECON quotes (v2) is never served again');

// ── P: the page ───────────────────────────────────────────────────────────
ok(/<button class="nlb" id="nav-library" onclick="navTo\('library'\)">Library<small>/.test(page) && !/id="nav-reports"|id="nav-deploy"|id="sec-reports"|id="sec-deploy"/.test(page) && /if \(section === 'reports' \|\| section === 'deploy'\) section = 'library';/.test(page) && /if \(section === 'library'\)   initLibraryPage\(\);/.test(page),
  'P1 the nav carries Library; Reports and Deploy are gone and their old doors lead to the Library');
ok(!/_depStore|generateReport|_fetchReportData|_completeReport|initDeployPage|downloadDeliverable|renderBrandFeed|_AUD_CATS|_AUD_MEDIA|_AUD_DRIVERS|brands-feed-section">|What is emerging on tracked brands/.test(page),
  'P2 the seeded deploy queue, the animated generator, the duplicate brand list and the invented audience percentages are gone');
const libHtml = between(page, '<div id="sec-library" class="page-section">', '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js');
ok(/id="lib-weekly"/.test(libHtml) && /id="lib-report"/.test(libHtml) && /id="lib-recon-sec" style="display:none"/.test(libHtml) && /class="room-sec"/.test(libHtml) && /class="room-dateline">The library</.test(libHtml),
  'P3 the Library is built in the room\'s design: the Weekly Read, the report, and the RECONs hidden until an admin is known');
const libVisible = libHtml.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
ok(!/\b(signal|signals|lake|overnight|frame|frames)\b/i.test(libVisible) && !/the house/i.test(libVisible) && !/[—–]/.test(libVisible) && !/cover price|pay/i.test(libVisible),
  'P4 no machinery word, no dash and nothing that reads as a price for the free issue in the Library\'s copy');
const libJs = between(page, '/* ══ LIBRARY ══ SEAM:LIBRARY', 'async function _libRecons()');
const esc = x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const LJ = new Function('safe', 'safeUrl', 'safeAttr', 'API_BASE', libJs + '; return { _libWeeklyCard, _libReportCard, _libRange, _libReconState, _libCover };')(
  esc, u => /^https?:\/\//.test(String(u)) ? u : '#', esc, 'https://api.unsurfaced-intelligence.com/');
const wc = LJ._libWeeklyCard({ issue_no: 3, week_start: '2026-09-28', week_end: '2026-10-04', lead: 'Glasses go to work', standfirst: 'Who wears them now', cover_key: 'weekly/003/cover.jpg', page_count: 24 });
ok(/href="\.\.\/weekly\/\?issue=3"/.test(wc) && /Issue 003 · Sep 28 to Oct 4, 2026/.test(wc) && /src="https:\/\/api\.unsurfaced-intelligence\.com\/media\/weekly\/003\/cover\.jpg"/.test(wc) && /Read issue 003/.test(wc) && /24 pages/.test(wc) && !/[—–]/.test(wc),
  'P5 a Weekly card opens its issue on the stand, with its own cover, its number, its week (no dash) and its pages');
const rc = LJ._libReportCard({ issue_no: 1, title: 'The Culture Report', thesis: 'What the month meant', window_start: '2026-09-01', window_end: '2026-09-30', cover_url: '/img/s/abc', price_cents: 4900, page_count: 48 }, true);
ok(/href="\.\.\/weekly\/#report"/.test(rc) && /48 pages · \$49/.test(rc) && /src="https:\/\/api\.unsurfaced-intelligence\.com\/img\/s\/abc"/.test(rc) && /Get the report/.test(rc), 'P6 a report card opens the report on the stand, its price read from the issue, never typed');
const older = LJ._libReportCard({ issue_no: 1, title: 'Older', price_cents: 1999, currency: 'gbp' }, false);
ok(/class="lib-card lib-feature"/.test(rc) && !/lib-feature/.test(older) && /\(x, k\) => _libReportCard\(x, k === 0\)/.test(libJs) && /href="mailto:hello@unsurfaced-intelligence\.com\?subject=Cultural%20Intelligence%20Report%2C%20Issue%20001"/.test(older) && /Ask for this issue/.test(older) && /£19\.99/.test(older),
  'P6b the latest report leads its shelf, wide, and opens on the stand (which sells the latest); an earlier issue is asked for by name; a price reads in its own currency');
const bare = LJ._libWeeklyCard({ issue_no: 4, week_start: '2026-10-05', week_end: '2026-10-11', lead: 'No cover yet' });
ok(/class="lib-cover none"/.test(bare) && /No cover yet/.test(bare) && !/<img/.test(bare), 'P7 an issue without a cover is typeset, never left blank');
ok(LJ._libReconState({ status: 'queued', deep_stage: 'gather' }) === 'Researching' && LJ._libReconState({ status: 'queued', deep_hold: 'evidence' }) === 'On hold: the evidence file is ready' && LJ._libReconState({ status: 'queued', deep_hold: 'budget' }) === 'On hold: the ceiling' && LJ._libReconState({ status: 'held' }) === 'Held: a note from our checks is on the desk' && LJ._libReconState({ status: 'ready' }) === 'Ready',
  'P8 a RECON row says where it stands in plain words');
const rec = between(page, 'async function _libRecons()', '\n}\n');
ok(/if \(!hh \|\| !hh\.Authorization\) return;/.test(rec) && /'\/reads\/list'/.test(rec) && /kind: 'recon'/.test(rec) && /sec\.style\.display = 'block';/.test(rec) && rec.indexOf("sec.style.display = 'none';") < rec.indexOf('/reads/list'),
  'P9 the RECONs show only to a signed-in admin (the desk answers no one else), hidden first and shown only when rows come back');
// the band beside the board
const band = between(page, 'function _renderDoorVoices(voices) {', '\n}\n');
ok((page.match(/function _renderVoices\(/g) || []).length === 1 && /function _renderVoices\(meta\)\{/.test(page) && /_renderWeek\(data\); _renderDoorVoices\(data\.voices\); _renderRecord\(data\.record\);/.test(page),
  'P10 one name, one function: the custom read\'s voices and the board\'s band no longer share a name, so a custom read renders its own voices again');
const elx = { block: { style: {} }, track: { innerHTML: '' } };
const RDV = new Function('document', 'safe', band + '\n}\nreturn _renderDoorVoices;')({ getElementById: id => id === 'voices-block' ? elx.block : id === 'voices-track' ? elx.track : null }, x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'));
RDV([{ text: 'I wear mine the whole shift', likes: 1240, self: { role: 'nurse' }, on: 'Smart glasses at work' }, { text: 'my 4c hair has a shelf now', likes: 870, self: { generation: 'Gen Z' }, on: 'Curl care' }, { text: 'cancelled after the show ended', likes: 0, self: null, on: null }]);
ok(!/youtube|mastodon/i.test(band) && /<div class="q-on">Smart glasses at work<\/div><p>“I wear mine the whole shift”<\/p><cite>A nurse, 1,240 likes<\/cite>/.test(elx.track.innerHTML) && /<cite>Gen Z, 870 likes<\/cite>/.test(elx.track.innerHTML) && /<p>“cancelled after the show ended”<\/p><cite>Consumer<\/cite>/.test(elx.track.innerHTML) && elx.block.style.display === 'block',
  'P11 a quote names the subject it speaks to and its speaker by generation or role, else as Consumer; never by platform');
// one name, one function, across the page's classic scripts (the gate's 5e, run here too)
const counts = {};
for (const m of page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) { if (/src=|module|json|importmap/.test(m[1])) continue; for (const f of m[2].matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) counts[f[1]] = (counts[f[1]] || 0) + 1; }
ok(Object.values(counts).every(n => n === 1) && Object.keys(counts).length > 300, 'P12 no function is declared twice anywhere on the page');
ok(/const _FI_CACHE_KEY  = 'unsurfaced_fi_v6';/.test(page) && /localStorage\.removeItem\('unsurfaced_fi_v5'\)/.test(page),
  'P12b a browser that kept yesterday\'s feed (which could hold a RECON\'s quotes) drops it: the feed\'s local copy moves to a new key and the old one is removed');
ok(/renderReportCards\(\);   \/\/ SEAM:LIBRARY: the builder's list refreshes/.test(between(page, 'function _saveReport(q, data, mode) {', '\n}\n')), 'P12c the builder\'s list of this session\'s reads refreshes on every save');
RDV([{ text: 'one like only', likes: 1, self: null, on: null }, { text: 'second quote here', likes: 2 }, { text: 'third quote here', likes: 3 }]);
ok(/<cite>Consumer, 1 like<\/cite>/.test(elx.track.innerHTML) && /about the subjects on the board and the month behind them\./.test(page), 'P12d one like is a like; the band says it quotes the board\'s subjects and the month behind them');
const stand = fs.readFileSync('weekly/index.html', 'utf-8');
ok(/if \(location\.hash === '#report' && report\.issue\) setTimeout\(function \(\) \{ \$\('report'\)\.scrollIntoView\(/.test(stand), 'P12e the stand scrolls to the report when the Library sends a reader there');
const brands = between(page, '<div id="sec-brands" class="page-section">', '<!-- ══ AUDIENCES ══ -->');
ok(!/[—]/.test(brands) && !/\blake\b/.test(brands) && /Every brand we watch, measured every week\./.test(brands), 'P13 the Brands page loses its dashes and its machinery word');

// ── Z: migration, seams, gate ─────────────────────────────────────────────
ok(/set lock_timeout = '5s';/.test(mig) && /alter table public\.signals add column if not exists research boolean not null default false;/.test(mig) && !/update public\.signals/.test(mig),
  'Z1 0038: the research flag is added in an instant (a constant default rewrites nothing) and waits five seconds at most for its lock; no backfill holds the lake');
ok(/if coalesce\(col_description\('public\.signals'::regclass,/.test(mig39) && /<> 'research: backfilled' then\s+update public\.signals set research = true\s+where research = false and coalesce\(momentum->>'provenance', ''\) ~ '\^\(live\|recon\)';\s+comment on column public\.signals\.research is 'research: backfilled';/.test(mig39),
  'Z1a 0039: the rows already in the lake are marked once, under row locks only, and the column records it, so a second run never re-marks a row the sweep has since found');
ok(/new\.research := coalesce\(new\.momentum->>'provenance', ''\) ~ '\^\(live\|recon\)';/.test(mig) && /set search_path = ''/.test(mig) && /create trigger signals_research_mark before insert on public\.signals\s+for each row execute function public\.signals_research_mark\(\);/.test(mig) && /drop trigger if exists signals_research_mark on public\.signals;/.test(mig),
  'Z1b 0038: the database marks research on every insert, whoever inserts (the worker in service now, a run that has not finished), so no row is ever filed wrong in the gap between the migration and the deploy');
ok(/drop function if exists public\.match_signals\(vector, int, text, int, timestamptz\);/.test(mig) && /captured_at timestamptz, momentum jsonb, similarity float, research boolean/.test(mig) && /s\.research\s+from public\.signals s/.test(mig),
  'Z1c 0038: the drain\'s neighbours carry their flag; the same arguments and rows, one more column');
ok(/create table if not exists public\.subject_weeks/.test(mig) && /unique \(subject_key, week\)/.test(mig) && /check \(kind in \('theme', 'track', 'cohort', 'field'\)\)/.test(mig) && /board\s+jsonb/.test(mig) && /door\s+jsonb/.test(mig) && /track\s+jsonb/.test(mig) && /cohort\s+jsonb/.test(mig) && /alter table public\.subject_weeks enable row level security;/.test(mig) && (mig.match(/^select '|^union all/gm) || []).length === 7,
  'Z2 0038: the ledger, one row a subject a week, a column per writer, service role only; four check lines');
ok(!/[—]/.test(mig.replace(/^--.*$/gm, '')), 'Z3 no em dash in the migration\'s statements');
ok(['SEAM:SWEEP_MEASURE', 'SEAM:DOOR_VOICES', 'SEAM:DOOR_VOICES@page', 'SEAM:LEDGER', 'SEAM:LIBRARY'].every(k => seams.registry[k]) && seams.registry['SEAM:LIBRARY'].file === 'intelligence/index.html',
  'Z4 the seams are registered with the tags');
ok(/# ── 5e\. One name, one function/.test(gate) && /"_AUD_CATS", "_AUD_MEDIA", "_AUD_DRIVERS", "_depStore"/.test(gate), 'Z5 the gate now fails a page that declares a function twice, and the invented numbers can never come back');

console.log('\nproof_sweep_ledger: ' + pass + ' checks PASS');
