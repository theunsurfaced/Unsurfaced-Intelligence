/**
 * proof_instrument.mjs  --  EX52a THE INSTRUMENT: the polish a client sees, held by proof.
 * Run from the repo root: node worker/proofs/proof_instrument.mjs
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const gate = fs.readFileSync('tools/ritual_gate.py', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = src.indexOf(b, i); if (j < 0) throw new Error('anchor missing: ' + b); return src.slice(i, j); };
const fn = (src, name, stop) => between(src, 'function ' + name + '(', stop);

// ── M: the measure as context, never the claim ────────────────────────
const measureSrc = between(w, 'function excMeasureLine(m) {', '/* PURE: the lines of a compiled reading that name the measure') + between(w, 'function excMeasureClaims(read) {', '\n}\n') + '\n}\n';
const M = new Function(measureSrc + '; return { excMeasureLine, excMeasureClaim, excMeasureClaims };')();
const base = { series: [0, 0, 1], weeks: 12, outlets: 2, weeks_touched: 3, state: 'QUIET', shape: null, share_pct: 1, territory: 'retail' };
ok(M.excMeasureLine(Object.assign({}, base, { recent_7d: 0, prior_7d: 0 })) === '', 'M1 two quiet weeks write no MEASURES line at all');
const quiet = M.excMeasureLine(Object.assign({}, base, { recent_7d: 0, prior_7d: 4 }));
ok(/quiet on the lake this week, 4 signals the week before/.test(quiet) && !/\b0 signals\b/.test(quiet) && /no headline or move may be about the count/.test(quiet), 'M2 a quiet week reaches the writer in words with no zero to narrate, and the law that no headline is about the count');
ok(/MEASURES \(computed by the database/.test(M.excMeasureLine(Object.assign({}, base, { recent_7d: 3, prior_7d: 4 }))), 'M3 a counted week keeps the full MEASURES line');
ok(M.excMeasureClaim('Coverage reads 0 this week') && M.excMeasureClaim('Signals fell to zero') && M.excMeasureClaim('The count is unchanged from zero') && M.excMeasureClaim('Two weeks touched of 12 weeks'), 'M4 a line about the instrument is a measure claim');
ok(!M.excMeasureClaim('Costco shoppers trade down to private label') && !M.excMeasureClaim('An early signal from the curl aisle') && !M.excMeasureClaim('Nike signals a new direction'), 'M5 a line about people is not; "early signal" is the house\'s own phrase; a verb is not a count');
const held = M.excMeasureClaims({ read: ['Costco quiet on the lake', 'Coverage reads 0 this week'], insights: [{ title: 'Shoppers trade down' }, { title: 'The signal count is flat' }], ideas: [{ headline: 'Measure the streak' }] });
ok(held.length === 3 && held[0].where === 'read' && held[1].where === 'insight 2' && held[2].where === 'move 1', 'M6 the claims are named by where they sit: the read lines, a finding by number, a move by number');
ok(M.excMeasureClaims({ read: ['Costco shoppers trade down', 'Private label gains'], insights: [{ title: 'Kirkland wins the aisle' }], ideas: [{ headline: 'Lead with price' }] }).length === 0, 'M7 a clean reading names nothing');
const land = between(w, 'async function doorLand(', 'async function doorPublish(');
ok(/const named = typeof excMeasureClaims === 'function' \? excMeasureClaims\(read\) : \[\];/.test(land) && /status: 'failed', read, cost_usd: cost, error: \('measure_claim: ' \+ named\[0\]\.where \+ ': ' \+ named\[0\]\.text\)\.slice\(0, 200\)/.test(land) && /return \{ id, status: 'failed', held: 'measure_claim' \};/.test(land) && land.indexOf('named.length') < land.indexOf("status: 'ready', read, cost_usd: cost, error: null"),
  'M8 the door holds a reading that names the measure before it is ready: status failed, the reason on the row, off the board; the next night tries again');
ok(/\.filter\(x => \{ const bad = typeof excMeasureClaim === 'function' && excMeasureClaim\(x\.title\); if \(bad\) console\.log\('measure_claim_dropped'/.test(between(w, 'async function synthesize(', 'async function excFrameFor(')), 'M9 the live read drops a finding about the instrument and logs it');
ok(/const EXC_FRAME = \{ TIMEOUT_MS: 9000, TTL: 604800, MISS_TTL: 3600, WOBBLE_TTL: 60,/.test(w) && /FRAME_MS: 25000/.test(w), 'M10 the live frame waits nine seconds (decided Oct 28); the night keeps 25; a slow call is remembered a minute, never five');
const cc = between(w, 'async function callClaude(', 'async function callClaudeStream(');
ok(/const t0 = Date\.now\(\);/.test(cc) && (cc.match(/\{ ms: Date\.now\(\) - t0 \}/g) || []).length === 2 && /msg_id: j\.id \|\| null, ms: Date\.now\(\) - t0 \}/.test(cc), 'M11 every live call writes its duration as meta.ms on its row: done, refused and aborted alike, so a budget is set from measured calls');

// ── C: confidence counted on outlets ──────────────────────────────────
const confSrc = between(w, 'function excOutletKey(c) {', '// SEAM:EXC_RECORD:') + between(w, 'function excEarned(items, fresh, now) {', '\n}\n') + '\n}\n' + between(w, 'function excTier(c) {', '\n}\n') + '\n}\n';
const C = new Function('EXC_TIER_W', 'excBand', 'excWhen', 'excRecord', confSrc + '; return { excOutletKey, excEarned };')([1, 1, 0.8, 0.5, 0.4], () => 'RECENT', c => c.published_at, () => false);
ok(C.excOutletKey({ title: 'A sourceless line' }) === 'unknown' && C.excOutletKey({ title: 'Another sourceless line' }) === 'unknown' && C.excOutletKey({ source: 'Unsurfaced Lake · Reuters (T1)' }) === 'reuters', 'C1 a line with no source is the one outlet "unknown"; a lake line keys on its outlet');
const now = Date.now(), fresh = new Date(now - 864e5).toISOString();
ok(C.excEarned([{ title: 'one', tier: 3, published_at: fresh }], true, now) === 'Low', 'C2 one T3 line is Low');
ok(C.excEarned([{ title: 'a', published_at: fresh }, { title: 'b', published_at: fresh }, { title: 'c', published_at: fresh }], true, now) === 'Low', 'C3 three sourceless lines are one outlet and Low, never High');
ok(C.excEarned([{ source: 'Reuters', tier: 1, published_at: fresh }, { source: 'FT', tier: 1, published_at: fresh }, { source: 'Bloomberg', tier: 1, published_at: fresh }], true, now) === 'High', 'C4 three T1 outlets, fresh, are High');

// ── I: a photograph only from a T0 to T2 source ───────────────────────
ok(/image: first && first\.image && excTier\(first\) <= 2 \? first\.image : null \};/.test(between(w, 'function doorCompileRead(', 'async function doorLand(')), 'I1 the door finding carries a photograph only from a T0 to T2 cited line');
const photo = between(w, 'function doorPhoto(rd, evidence) {', '\n}\n') + '\n}\n';
const doorPhoto = new Function(photo + '; return doorPhoto;')();
ok(doorPhoto({ insights: [] }, [{ image: 'https://y/t3.jpg', source_name: 'Blog', tier: 3 }, { image: 'https://y/t1.jpg', source_name: 'Reuters', tier: 1 }]).src === 'https://y/t1.jpg' && doorPhoto({ insights: [] }, [{ image: 'https://y/none.jpg', source_name: 'Nobody' }]) === null, 'I2 the tile\'s photograph skips a T3 line for a T1 one; an untiered line is T3');
const attach = fn(page, '_attachImages', '\n}\n') + '\n}\n';
const A = new Function(attach + '; return _attachImages;')();
const ins = [{ title: 'a', source: 'reuters', sourceUrl: 'https://r/1' }, { title: 'b', source: 'blog', sourceUrl: 'https://b/1' }, { title: 'c', source: 'nobody', sourceUrl: 'https://n/1' }];
A(ins, [{ url: 'https://r/1', source_name: 'reuters', image: 'https://r/1.jpg', source_tier: 1 }, { url: 'https://b/1', source_name: 'blog', image: 'https://b/1.jpg', source_tier: 3 }, { url: 'https://n/1', source_name: 'nobody', image: 'https://n/1.jpg' }]);
ok(ins[0].image === 'https://r/1.jpg' && !ins[1].image && !ins[2].image, 'I3 the page attaches a T1 photograph to its finding and never a T3 or untiered one');
ok(/image: ins\.image\|\|null   \/\/ EX52a/.test(between(page, 'function _renderLive(q, data){', 'function _lensSignal(')), 'I4 the door\'s per-finding photograph rides through _renderLive to the card');

// ── H: honest headers and the question in the box ─────────────────────
const stamp = fn(page, '_utcStamp', '\n') + '\n';
const U = new Function(stamp + '; return _utcStamp;')();
ok(U('2026-10-29T06:14:00Z') === 'OCT 29, 2026, 06:14 AM UTC' && U(null) === '' && U('nope') === '', 'H1 a stored time is said in UTC as the house compiled it; nothing when there is none');
const rcSrc = fn(page, '_receiptOf', '\n}\n') + '\n}\n';
const RC = new Function(rcSrc + '; return _receiptOf;')();
ok(RC({ sources: [], insights: [{ source: 'Reuters' }, { source: 'Unsurfaced Lake · Reuters (T1)' }, { source: 'Excavate analysis' }, { source: 'FT' }], relevance: { kept: 18 } }).sources === 2, 'H2 a reading with no source list counts the outlets its findings cite, never the house itself: 0 SOURCES under cited findings cannot show');
const rl = between(page, 'function _renderLive(q, data){', 'function _lensSignal(');
ok(/lane==='overnight'/.test(rl) && /OVERNIGHT READ · COMPILED '\+_utcStamp\(syn\.compiled_at\)\+' · '\+\(\(\(syn\.relevance&&syn\.relevance\.kept\)\|\|0\)\)\+' LINES READ/.test(rl) && /LIVE SOURCES · AI-SYNTHESIZED · '\+\(\(\(syn&&syn\._sourceCount\)\|\|items\.length\)\)\+' SIGNALS FUSED/.test(rl) && !/LIVE SOURCES \u2014 AI-SYNTHESIZED/.test(rl), 'H3 an overnight reading\'s pill names the night it was compiled and the lines read; a live read keeps its signal count');
ok(/mode:synthd\?'live':'basic',depth:syn&&syn\.depth\|\|null,/.test(rl), 'H4 depth rides to the header, so a quick read says QUICK READ');
const rr = between(page, 'function renderResults(q, data, mode){', 'renderVoiceStrip(q);');
ok(/const _ov=!!\(data\.model&&data\.model\.lane==='overnight'\);/.test(rr) && /\(_ov\?'OVERNIGHT READ':\(data\.depth==='quick'\?'QUICK READ':'FULL READ'\)\)/.test(rr) && /\(_ov&&data\.compiled_at\?_utcStamp\(data\.compiled_at\):new Date\(\)/.test(rr), 'H5 the meta line says OVERNIGHT READ with the compiled time, never the browser\'s clock for a stored reading');
const od = between(page, 'async function _openDoorRead(t) {', '/* SEAM:CLIENT_PROFILE');
ok(/if \(h && t\.title\) h\.textContent = t\.title;/.test(od) && /window\._doorOpen = \{ id: t\.id, query: q, frame: j\.data\.frame \|\| null \};/.test(od) && /showLoader\(t\.title \|\| q \|\| 'the subject', 'live', \[[^\]]+\], 'OPENING THE OVERNIGHT READ'\)/.test(od), 'H6 the overnight reading\'s heading is the subject\'s title; the rail\'s search string stays the question for Go deeper and the RECON; the loader names the door');

// ── W: the watch sees the door and the marks ──────────────────────────
const wl = between(w, 'function watchDoorLine(every, lastNight, today, skipped) {', 'async function watchHealth(env) {');
const WL = new Function(wl + '; return watchDoorLine;')();
ok(WL(1, '2026-10-28', '2026-10-29', false).trip === null && WL(1, '2026-10-27', '2026-10-29', false).trip === null, 'W1 a door compiled last night or the night before is on cadence');
const dark = WL(1, '2026-10-23', '2026-10-29', false);
ok(dark.trip && dark.trip.kind === 'door_dark' && /not compiled for 6 nights \(cadence every 1\)/.test(dark.trip.say) && dark.gap_nights === 6, 'W2 a gap past the cadence trips the line with the nights and the cadence');
ok(WL(7, '2026-10-23', '2026-10-29', true).trip === null && /skipped by the cadence setting/.test(WL(1, '2026-10-20', '2026-10-29', true).trip.say) && /never compiled/.test(WL(1, null, '2026-10-29', false).trip.say), 'W3 a weekly cadence is honored; a skip is named on a trip; a board that never compiled trips');
const wh = between(w, 'async function watchHealth(env) {', 'async function watchTick(');
ok(/out\.door_cadence = \{ every: dl\.every, house: DOOR\.EVERY_D, last_compiled: dl\.last_compiled, gap_nights: dl\.gap_nights, skipped: dl\.skipped \};/.test(wh) && /if \(dl\.trip\) out\.trips\.push\(dl\.trip\);/.test(wh) && /door_reads\?status=in\.\(ready,reused\)&select=night&order=night\.desc&limit=1/.test(wh), 'W4 the watch line carries the door\'s cadence against its last compiled night and trips when it is dark');
ok(/insight_marks\?created_at=gte\./.test(wh) && /out\.marks = \{ week: counts, readings:/.test(wh) && /held: 0, useful: 0, wrong: 0/.test(wh), 'W5 the readers\' marks over seven days ride the watch line: held, useful, wrong, and the most-marked readings');
ok(!/the marks feed the bench's human score/.test(w) && /the marks ride the watch line and the desk's scoreboard \(EX52a\)/.test(w), 'W6 the comment at READER_MARKS tells the truth about where the marks go');
ok(/loud && loud\.measures\.recent_7d >= 1 \? \{ name: name\(loud\)/.test(w) && /if \(loud && loud\.measures\.recent_7d >= 1\) mv\.push/.test(page), 'W7 Most covered needs one story this week, on the territories and on the week\'s read');

// ── P: the cosmetics ──────────────────────────────────────────────────
ok(/function _heroSolo\(\) \{ const hero = document\.querySelector\('#sec-explore \.hero'\); if \(hero\) hero\.classList\.toggle\('solo', !\(window\._dashOn !== false && window\._weekReady\)\); \}/.test(page) && (page.match(/classList\.(?:add|remove|toggle)\('solo'/g) || []).length === 1, 'P1 one function decides the hero\'s single column; nothing else touches the class');
ok(/window\._dashOn = on; _heroSolo\(\);/.test(page) && /window\._weekReady = true; _heroSolo\(\);/.test(page) && /window\._weekReady = !!\(window\._leadIds && window\._leadIds\.size\); _heroSolo\(\);/.test(page) && /sec\.style\.display = ''; window\._weekReady = true; _heroSolo\(\); \}/.test(page), 'P2 the board, the week\'s read and the readings\' rail each report in and the one function decides');
const curSrc = between(page, 'function _curResolve(c, tiles) {', 'function _curToggle(btn) {');
const R = new Function(curSrc + '; return _curResolve;')();
const tiles = [{ id: 'old', label: 'Nike in footwear', deployed: '2026-10-01', photo: { src: 'https://p/old.jpg' } }, { id: 'new', label: 'Nike in footwear', deployed: '2026-10-28', photo: { src: 'https://p/new.jpg' } }];
ok(R({ subjects: ['Nike in footwear'] }, tiles).faces[0].id === 'new' && R({ subjects: ['Nike in footwear'] }, tiles.slice().reverse()).faces[0].id === 'new', 'P3 the newest deployment of a subject is its face, whichever order the record arrives in');
ok(/onerror="const b=this\.closest\('\.rec-cur-faces'\);this\.parentNode\.remove\(\);if\(b&&!b\.children\.length\)b\.remove\(\)"/.test(page), 'P4 a faces box whose last photograph fails goes with it; no empty box');
const reach = between(page, 'async function _reachBlock(id) {', '/* SEAM:INSIGHT_PANEL');
ok(/box\.insertAdjacentHTML\('beforebegin', `<div class="reach-role">/.test(reach) && /const old = el\.querySelector\('\.reach-role'\); if \(old\) old\.remove\(\);/.test(reach) && !/box\.innerHTML = `<div class="reach-role">/.test(reach), 'P5 the role line stands above the three-column grid, never in its first cell, and never twice');
const loader = between(page, 'function showLoader(q,mode,steps,label){', 'function hideLoader(){');
ok(/fl\.textContent='Gathering'/.test(loader) && /textContent=label\|\|\(mode==='live'\?'READING THE SOURCES':'GATHERING SOURCES'\)/.test(loader), 'P6 the loader starts clean every time: never the last read\'s "Complete." under a new one; a door read names itself');

// ── V: the voice law on the page ──────────────────────────────────────
const scripts = [...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m => !/importmap|octet-stream|application\/json/.test(m[1]) && m[2].trim()).map(m => m[2]);
// the gate's scanner (tools/jsscan.py string_spans), ported line for line, so the proof applies the same law
const REGEX_PREV = new Set('(,=:[!&|?{};+'.split(''));
function* stringSpans(src) {
  let i = 0; const n = src.length; let line = 1;
  while (i < n) {
    const c = src[i], d = i + 1 < n ? src[i + 1] : '';
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && i + 1 < n && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c, l0 = line; let j = i + 1, depth = 0;
      while (j < n) { const ch = src[j]; if (ch === '\\') { j += 2; continue; } if (ch === '\n') line++;
        if (q === '`' && ch === '$' && j + 1 < n && src[j + 1] === '{') { depth++; j += 2; continue; }
        if (q === '`' && depth && ch === '}') { depth--; j++; continue; }
        if (ch === q && !depth) break; j++; }
      yield [q, i, j + 1, l0]; i = j + 1; continue;
    }
    if (c === '/') { let k = i - 1; while (k >= 0 && ' \t\r\n'.includes(src[k])) k--;
      if (k < 0 || REGEX_PREV.has(src[k]) || src.slice(Math.max(0, k - 5), k + 1) === 'return') { let j = i + 1, cls = false;
        while (j < n && src[j] !== '\n') { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '[') cls = true; else if (src[j] === ']') cls = false; else if (src[j] === '/' && !cls) break; j++; }
        if (j < n && src[j] === '/') { i = j + 1; continue; } } }
    i++;
  }
}
const dashed = [];
for (const body of scripts) for (const [q, a, b, line] of stringSpans(body)) { const lit = body.slice(a, b); if (/\u2014|\\u2014|&mdash;/.test(lit)) dashed.push(line + ': ' + lit.slice(0, 80)); }
ok(dashed.length === 0, 'V1 no em dash in any page string (' + dashed.length + ' found' + (dashed.length ? ': ' + dashed[0] : '') + ')');
ok(/textContent=rc\.sources\|\|'·'/.test(page) && !/\|\|'—'/.test(page) && !/\|\|'\\u2014'/.test(page), 'V2 the empty-count placeholder is a middle dot');
ok(/intelligence\/index\.html/.test(between(gate, '# ── 7b. Voice law (the page', '# ── 8. Swallow ratchet')) && /jsscan\.dash_strings\(_body\)/.test(between(gate, '# ── 7b. Voice law (the page', '# ── 8. Swallow ratchet')), 'V3 the gate holds the page\'s classic script bodies to the voice law');
console.log(`\nproof_instrument: ${pass} checks passed`);
