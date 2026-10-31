/**
 * proof_print.mjs  --  RP1 THE PRINT: SEAM:EXC_PRINT (worker, the read page, the Intelligence page).
 * One print system for every reading: the adapter is pure and prints only what the reading cited; the client cut is the RECON's law;
 * the route, the ticket and the page's branch exist; the old browser-built paper is gone. Run from the repo root.
 */
import fs from 'fs';
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const rpage = fs.readFileSync('intelligence/read/index.html', 'utf-8');
const ipage = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error('slice ' + a); return src.slice(i, j); };

// ── A: the adapter, pure ─────────────────────────────────────────────────────────────────────────────────────────────────────
const slice = between(w, '/* ═══ SEAM:EXC_PRINT (RP1 THE PRINT)', '/* ═══ SEAM:HOUSE (RD1a)');
const P = new Function('sbRest', 'excQuiet', 'json', 'callerIsAdmin', 'logEvent', 'corsHeaders', 'readHex', 'READ_PRINT',
  slice + '; return { EXC_PRINT, excPrintGroup, excPrintOutlet, excPrintBlind, excPrintTitle, excPrintCut, excPrintDate, excPrintDoc, excPrintFooter, excPrintFileName };')(
  null, () => () => null, () => null, async () => false, () => {}, () => new Map(), b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''), { TICKET_TTL: 300 });

// the sample reading of Oct 29 (Joe Freshgoods and New Balance), as the ledger keeps a live read: seven findings, five moves, the lines
// EX53's claims kept for the findings; line 40 is cited by a move and by no finding, so it is not in the claims' lines
const L = (n, title, source, url, date, image) => ({ n, title, source, url, date, tier: 2, image: image || null });
const lines = [
  L(9, 'New Balance 990v7 Revealed in Joe Freshgoods Closer Look', 'justfreshkicks.com', 'https://justfreshkicks.com/new-balance-990v7-grey-suede/', '2026-10-14', 'https://img.example.com/990v7.jpg'),
  L(13, 'Joe Freshgoods Teases Closer Look at the New Balance 990v7', 'Hypebeast', 'https://hypebeast.com/2026/10/joe-freshgoods-new-balance-990v7-closer-look-teased', '2026-10-14'),
  L(6, 'New Balance Tapped Longtime Collaborator Joe Freshgoods', 'soleretriever.com', 'https://www.soleretriever.com/news/articles/joe-freshgoods-helps-debut-the-new-balance-990v7', '2026-10-13'),
  L(8, "New Balance 990v7 'Kool Grey': Release Date, Price & Details", 'thedropdate.com', 'https://thedropdate.com/news/new-balance-990v7-first-look-release-info', '2026-10-22'),
  L(33, 'Raffle - Powered by EQL', 'joefreshgoods.com', 'https://joefreshgoods.com/pages/raffle-powered-by-eql', '2025-04-20'),
  L(31, 'SHOP', 'joefreshgoods.com', 'https://joefreshgoods.com/collections/shop', null),
  L(29, 'When Things Were Pure', 'newbalance.newsmarket.com', 'https://newbalance.newsmarket.com/latest-news/when-things-were-pure/s/cfb847d3', '2024-04-08'),
  L(30, 'From Prom to Paris', 'newbalance.newsmarket.com', 'https://newbalance.newsmarket.com/latest-news/from-prom-to-paris/s/d91466d5', '2024-08-13'),
  L(44, 'Joe freshgoods collection', 'reddit.com', 'https://www.reddit.com/r/Newbalance/comments/1x8rlkt/joe_freshgoods_collection/', '2026-10-18'),
  L(50, 'Kim Jong Un', 'Wikipedia', 'https://en.wikipedia.org/wiki/Kim_Jong_Un', '2026-10-27')   // in the pack, cited by nothing: it must never print
];
const ins = (title, excerpt, confidence, evidence, newest, extra) => Object.assign({ title, excerpt, confidence, evidence, dated: { newest, oldest: newest, band: 'RECENT' }, category: 'consumer', source: 'justfreshkicks.com', image: null }, extra || {});
const readRow = { id: '0b4c7d3e-1111-4222-8333-944445555666', query: 'New Balance and Joe Fresh Goods', created_at: '2026-10-29T18:20:00Z', evidence_n: 38,
  read: ['Sneaker collectors keep chasing the next Joe Freshgoods New Balance drop.', 'Joe Freshgoods priced the 1890 pack at $200 through an EQL raffle in April 2025, per joefreshgoods.com.'],
  brief: 'The live story is the New Balance 990v7: Joe Freshgoods has been teasing it on Instagram since October 12 while New Balance shipped the Kool Grey on October 22.\n\nFirst move: keep selling the mainline now and hold the Freshgoods edition back.',
  insights: [
    ins('Fans see the 990v7 before any official price or date', 'Joe Freshgoods posted a closer look at the unreleased 990v7 on his Instagram Story on October 12 and again October 14, while New Balance had not announced a release date or price as of October 14.', 'Medium', [9, 13, 6], '2026-10-14', { implication: 'Show the shoe before the sheet.', image: 'https://img.example.com/990v7.jpg' }),
    ins('Mainline 990v7 ships while the Freshgoods cut waits', 'New Balance released the debut 990v7 Kool Grey colorway on or after October 22, 2026, while the Freshgoods version remained undated.', 'Medium', [8, 9], '2026-10-22'),
    ins('Joe Freshgoods keeps returning as the go-to collaborator', 'Soleretriever calls Joe Freshgoods a longtime collaborator who helped debut the 990v7, following the 1000 (April 2024), the 990v6 (August 2024) and the 1890 raffle (April 2025).', 'Medium', [6, 29, 30], '2026-10-13'),
    ins('Collectors treat Joe Freshgoods releases as a running set', 'A Reddit poster says their collection is shaping up and lists the anatomy of the heart as still on their wish list.', 'Low', [44], '2026-10-18'),
    ins('The 990v7 trades firmer foam for softer FuelCell cushioning', 'Compared with the 990v6, the 990v7 swaps the firmer compounds for a softer FuelCell foam.', 'Medium', [9], '2026-10-14'),
    ins('Freshgoods pairs hold a consistent $200 price point', 'The 1890 pack launched through an EQL raffle at $200, the same regular price listed for the sold-out 1890 Cut The Check.', 'Low', [33, 31], '2025-04-20'),
    ins('Where the house disagrees: a Rosalia sighting built the buzz, not the Story', 'The 990v7 reveal followed paparazzi photos of Rosalia wearing the pair and a Chinatown billboard.', 'Low', [9], '2026-10-14', { stance: 'counter' })
  ],
  ideas: [
    { type: 'Content', for: 'media', headline: 'Seed Instagram Story closer-looks before any press release', body: 'Post closer-look Stories of upcoming colorways the way Joe Freshgoods did on October 12 and 14.', proof: 'Evidence 9, 13 and 14 show Story reveals driving write-ups.', from: 0, evidence: [9, 13] },
    { type: 'Pricing', for: 'retail', headline: 'Lock the next Freshgoods pair at $200 via EQL raffle', body: 'Repeat the EQL raffle structure and $200 price used for the 1890 pack.', proof: 'Evidence 33 cites the raffle at $200.', from: 5, evidence: [33, 31] },
    { type: 'Channel', for: 'retail', headline: 'Sell the mainline Kool Grey now, hold Freshgoods back', body: 'Keep the general 990v7 moving through retail while the Freshgoods edition stays undated.', proof: 'Evidence 8 and 9.', from: 1, evidence: [8, 9] },
    { type: 'Campaign', for: 'creative', headline: 'Pair a billboard teaser with a celebrity candid shot', body: 'Run an out-of-home teaser timed near a celebrity sighting.', proof: 'Evidence 9.', from: 6, evidence: [9] },
    { type: 'Partnership', for: 'brand', headline: 'Keep Freshgoods on a yearly 990-line cadence', body: 'Schedule the next project on the near-annual rhythm.', proof: 'Evidence 29, 30 and 40.', from: null, evidence: [29, 30, 40] }
  ],
  meta: { frame: { entity: 'New Balance', category: 'sneaker collaborations', audience: 'sneaker collectors', market: 'US', question: 'How does the next Freshgoods drop land?' }, voice: { n: 3, notes: ['voice:long_sentence:f1:32', 'voice:long_sentence:f2:31', 'voice:long_sentence:brief:39'] }, window: { newest: '2026-10-25', oldest: '2024-04-08' }, model: { lane: 'live', model: 'x' } } };
const claimsLines = lines.filter(l => l.n !== 40 && l.n !== 50);   // what EX53 kept: the findings' lines; 40 was a move's only, 50 was nobody's
const house = P.excPrintDoc('read', readRow, claimsLines, { cut: null, blind: 'This read does not see TikTok, Instagram or X. Its voices come from YouTube, Mastodon and Bluesky; its news from the open web and the lake.' });
const x = house.row.read, rc = house.receipts;
ok(house.row.kind === 'excavate' && house.row.id === readRow.id && house.row.status === 'ready' && x.src === 'read' && x.cut === null, 'A1 a live read becomes a read page row of kind excavate');
ok(x.title === readRow.read[0] && x.thesis === readRow.read[1] && x.question === 'New Balance and Joe Fresh Goods' && x.subject === 'New Balance' && x.frame.entity === 'New Balance' && x.frame.audience === 'sneaker collectors', 'A2 the claim is the title, the second line the dek, the question and the frame ride the cover');
ok(x.findings.length === 7 && x.findings[0].n === 1 && x.findings[0].use === 'Show the shoe before the sheet.' && x.findings[0].image === 'https://img.example.com/990v7.jpg' && x.findings[0].credit === 'justfreshkicks.com', 'A3 every finding prints in the house cut, with its use sentence, its photograph and its credit');
ok(x.findings[6].counter === true && x.findings[6].title === 'a Rosalia sighting built the buzz, not the Story', 'A4 the house\'s counter prefix becomes a chip, not a title');
ok(JSON.stringify(x.findings[0].sources) === JSON.stringify(['S9', 'S13', 'S6']) && rc.S9 && rc.S9.source_name === 'justfreshkicks.com' && rc.S9.date === '2026-10-14' && rc.S13.source_name === 'Hypebeast' && rc.S9.has_image === false, 'A5 a finding cites its lines as receipts keyed by the line number, the outlet\'s name clean');
ok(!rc.S50 && !rc.S40 && Object.keys(rc).length === 9, 'A6 only the cited lines are receipts: the pack\'s uncited reference row never prints, and a move\'s line the claims did not keep is left out, not invented');
ok(x.findings[0].moves.length === 1 && x.findings[0].moves[0].role === 'media' && JSON.stringify(x.findings[0].moves[0].sources) === JSON.stringify(['S9', 'S13']) && x.findings[5].moves.length === 1 && x.findings[1].moves.length === 1 && x.findings[6].moves.length === 1, 'A7 a move sits under the finding it came from');
ok(x.moves.length === 1 && x.moves[0].headline === 'Keep Freshgoods on a yearly 990-line cadence' && JSON.stringify(x.moves[0].sources) === JSON.stringify(['S29', 'S30']) && x.moves_placed === 4, 'A8 a move from no finding prints under the moves, with the lines it cites that the reading kept');
ok(x.counts.findings === 7 && x.counts.voices === 1 && x.counts.reports === 6 && x.counts.confidence === 'medium', 'A9 the counts are the reading\'s own: findings, distinct reporting outlets cited, voices cited, the confidence most findings carry');
ok(rc.S44.kind === 'voices' && rc.S29.kind === 'reporting' && rc.S9.kind === 'reporting' && P.excPrintGroup({ url: 'https://investor.costco.com/q4.pdf', title: 'Costco Q4' }) === 'records' && P.excPrintGroup({ url: 'https://en.wikipedia.org/wiki/New_Balance', source: 'Wikipedia' }) === 'reference', 'A10 the sources group as a reader thinks of them: reporting, records and filings, reference, voices');
ok(x.dated.newest === '2026-10-22' && x.dated.oldest === '2025-04-20' && house.row.window_end === '2026-10-22' && house.row.window_start === '2025-04-20', 'A11 the document is dated by its findings');
ok(x.about && x.about.lines === 38 && x.about.cited === 9 && x.about.voice_notes === 3 && x.about.model === 'the live lane' && x.about.dropped === 0 && x.measures === null, 'A12 the house cut says what the read stood on; a live read carries no measure');
ok(/the house's own archive/.test(x.blind) && !/the lake\b/.test(x.blind), 'A13 the blind line is said in the reader\'s words');
ok(x.brief && x.brief.indexOf('First move') > 0 && x.read.length === 2 && x.watch === null, 'A14 the interpretation rides; a live read has no bet');

// the client cut: the RECON's law
const client = P.excPrintDoc('read', readRow, claimsLines, { cut: 'client', blind: 'This read does not see TikTok, Instagram or X.' });
const cx = client.row.read;
ok(cx.cut === 'client' && cx.findings.length === 4 && cx.findings.map(f => f.title)[0] === 'Fans see the 990v7 before any official price or date', 'B1 the client cut keeps the strongest four findings');
ok(JSON.stringify(P.excPrintCut(readRow.insights)) === JSON.stringify([0, 1, 2, 4]), 'B2 the law ranks by confidence, then by the sources behind a finding, and keeps the writer\'s order: the four mediums, the one with three sources first');
ok(cx.about === null && cx.measures === null && cx.counts.findings === 4, 'B3 the client cut leaves the house\'s checks (the window, the voice notes, the model, the measure) to the full read');
ok(cx.moves.length === 1 && cx.moves[0].headline === 'Keep Freshgoods on a yearly 990-line cadence' && cx.findings.reduce((n, f) => n + f.moves.length, 0) === 2, 'B4 the client cut keeps the moves of the findings it kept and the moves from no finding; a move of a dropped finding goes with it');
ok(Object.keys(client.receipts).length === 6 && !client.receipts.S33 && !client.receipts.S44, 'B5 the client cut cites only what its pages cite');

// a deployment: the door's row, every line in its evidence, the measure, the bet, the grade
const doorRow = { id: '1c2d3e4f-2222-4333-8444-955556666777', night: '2026-10-29', status: 'ready', frame_key: 'track:costco', created_at: '2026-10-29T06:12:00Z', updated_at: '2026-10-29T06:14:00Z',
  frame: { entity: 'Costco', category: 'retail', audience: 'members', market: 'US', query: 'Costco', title: 'Costco' },
  measures: { weeks: 12, series: [3, 4, 2, 5, 6, 4, 8, 7, 9, 6, 10, 12], recent_7d: 12, prior_7d: 10, velocity_pct: 20, outlets: 9, weeks_touched: 12, state: 'ACCELERATING', measured_from: '2026-08-06', coverage_weeks: 12 },
  evidence: [{ title: 'Costco raises the hot dog price', source: 'Unsurfaced Lake · CNBC (T1)', url: 'https://www.cnbc.com/costco', published_at: '2026-10-27T10:00:00Z', tier: 1, image: 'https://img.cnbc.com/hotdog.jpg' },
    { title: 'Members queue for gold bars', source: 'Reuters', url: 'https://www.reuters.com/costco-gold', published_at: '2026-10-26T10:00:00Z', tier: 1 },
    { title: 'Costco Q4 call transcript', source: 'investor relations', url: 'https://investor.costco.com/q4.pdf', published_at: '2026-09-26T10:00:00Z', tier: 1 }],
  read: { read: ['Costco members pay more for the floor and keep coming.', 'The hot dog rose for the first time since 1985, and the queues held.'], brief: 'Hold the line.',
    insights: [{ title: 'The hot dog price moved and nobody left', excerpt: 'CNBC reported the first rise since 1985; Reuters counted the queues the same week.', confidence: 'High', evidence: [1, 2], dated: { newest: '2026-10-27', oldest: '2026-10-26', band: 'NOW' }, category: 'consumer', source: 'Unsurfaced Lake · CNBC (T1)', image: null, meaning: { consumer: 'The member reads the price as a promise kept.', category: null, culture: null } }],
    ideas: [{ type: 'Pricing', for: 'exec', headline: 'Raise one icon, hold the rest', body: 'Move one visible price and keep the floor.', proof: 'Evidence 1 and 3.', from: 0, evidence: [1, 3] }],
    watch: { measure: 'signals_7d', op: 'gte', value: 12, by: '2026-11-12', claim: 'the queues hold through the holidays' }, voice: ['voice:long_sentence:f0:31'] },
  meta: { called: { verdict: 'held' }, since: { recent_7d: 2 } } };
const door = P.excPrintDoc('door', doorRow, doorRow.evidence, { cut: null, blind: 'x' });
const dx = door.row.read;
ok(dx.src === 'door' && dx.night === '2026-10-29' && dx.subject === 'Costco' && door.row.label === 'Costco · 2026-10-29' && dx.question === 'Costco', 'C1 a deployment is labelled by its subject and night');
ok(dx.findings[0].image === 'https://img.cnbc.com/hotdog.jpg' && dx.findings[0].credit === 'CNBC' && door.receipts.S1.source_name === 'CNBC' && door.receipts.S3.kind === 'records', 'C2 a finding\'s photograph comes from its first T0 to T2 line, the credit is the outlet\'s name without the lake\'s prefix or tier');
ok(dx.measures && dx.measures.recent_7d === 12 && dx.watch && dx.watch.by === '2026-11-12' && dx.about.called === 'held' && dx.about.status === 'ready' && dx.about.lines === 3 && dx.about.voice_notes === 1, 'C3 a deployment prints its measure, its bet, its grade and what it stood on');
ok(dx.findings[0].meaning && dx.findings[0].meaning.consumer && !dx.findings[0].meaning.category && JSON.stringify(dx.findings[0].moves[0].sources) === JSON.stringify(['S1', 'S3']), 'C4 the meanings print only where the finding touches them; a move cites every line of the door\'s evidence it named');
ok(P.excPrintFooter(dx, false).indexOf('UNSURFACED™ EXCAVATE · THE READ · COSTCO · 2026-10-29') > 0 && P.excPrintFooter(dx, true).indexOf('CLIENT CUT') > 0 && P.excPrintFileName(dx, true) === 'Unsurfaced-Excavate-Costco-2026-10-29-client-cut.pdf' && P.excPrintFileName(x, false) === 'Unsurfaced-Excavate-New-Balance-2026-10-29.pdf', 'C5 the footer and the file name in the house\'s shape');
ok(P.excPrintOutlet('Unsurfaced Lake · Hypebeast (T2)') === 'Hypebeast' && P.excPrintTitle('CONSENSUS: the shelf wins') === 'the shelf wins' && P.excPrintDate({ published_at: '2026-10-01T12:00:00Z' }) === '2026-10-01' && P.excPrintDate({ date: '2026-09-09' }) === '2026-09-09' && P.excPrintDate({}) === null, 'C6 the small pure helpers');
ok(P.excPrintDoc('read', { id: 'x', query: 'q', insights: [], ideas: [], meta: {} }, [], {}).row.read.findings.length === 0 && P.excPrintDoc('door', { id: 'y', read: null, frame: {} }, [], {}).row.read.findings.length === 0, 'C7 an empty reading yields an empty document, never a throw');

// ── D: the route, the ticket, the keeping ────────────────────────────────────────────────────────────────────────────────────
ok(/case '\/excavate\/pdf':        return excavatePdfRoute\(body, env, origin, user\);/.test(w) && /async function excavatePdfRoute\(body, env, origin, user\)/.test(w), 'D1 POST /excavate/pdf is an authenticated door in the switch');
ok(/if \(kind === 'door' && !\['ready', 'reused'\]\.includes\(String\(loaded\.row\.status \|\| ''\)\) && !\(await callerIsAdmin\(env, user\.id\)\)\) return json\(\{ ok: false, error: 'forbidden' \}, 403, origin, env\);/.test(w), 'D2 a door row the record does not carry prints for an admin only');
ok(/if \(String\(id\)\.indexOf\(EXC_PRINT\.TICKET\) === 0\) return excPrintTicket\(env, id, origin\);/.test(w) && /\/\^exc:\(door\|read\):\(\[0-9a-f-\]\{36\}\):\(house\|client\)\$\//.test(w), 'D3 the render ticket answers a reading\'s ticket with its document and receipts');
const pdf = between(w, 'async function excPrintPdf(env, loaded, cut) {', 'async function excPrintTicket(');
ok(/browser-rendering\/pdf/.test(pdf) && /READ_PRINT\.PAGE \+ '\?id=x&rt=' \+ rt/.test(pdf) && /format: 'letter', printBackground: true, preferCSSPageSize: true/.test(pdf) && /footerTemplate: excPrintFooter\(doc\.read, client\)/.test(pdf) && /html\[data-print-ready="1"\]/.test(pdf), 'D4 the same print rail as a house read: the read page under a ticket, Browser Rendering, letter, the house footer, the print-ready signal');
ok(/EXC_PRINT\.KEY \+ loaded\.row\.id \+ '-' \+ slot/.test(pdf) && /kept\.stamp === stamp && kept\.key/.test(pdf) && /table \+ '\?id=eq\.' \+ loaded\.row\.id, \{ method: 'PATCH'/.test(pdf) && /const table = loaded\.src === 'door' \? 'door_reads' : 'reads'/.test(pdf), 'D5 the PDF is kept once per stamp in R2 under print/excavate/ and on the row\'s meta.print, for a door row and a live read alike');
ok(/claims\?src=eq\.read&reading_id=eq\.' \+ id \+ '&select=idx,lines/.test(w) && /door_reads\?id=eq\.' \+ id \+ '&select=id,frame_key,night,status,frame,measures,read,evidence,meta,cost_usd,created_at,updated_at/.test(w), 'D6 a live read\'s lines come from the claims EX53 kept; a door row\'s from its evidence');
ok(!/—/.test(slice), 'D7 no em dash in the worker block');

// ── E: the read page ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const xdoc = between(rpage, 'function excavateDoc(x, rc, row, H) {', '  function openRead(id) {');
ok(/if \(row\.kind === "excavate"\) \{/.test(rpage) && /var xp = excavateDoc\(x, rc, row, \{ inner: inner, band: band, mark: mark, pad: pad, fmtDate: fmtDate \}\);/.test(rpage) && /excavate: "EXCAVATE · The read"/.test(rpage), 'E1 the page builds a reading on the paper and signals print-ready as for every read');
ok(/<section class="page cover">/.test(xdoc) && /xcPhoto\(lead\.image, "cover", lead\.title\)/.test(xdoc) && /"Asked: " \+ esc\(x\.question\)/.test(xdoc) && /Reports cited/.test(xdoc) && /Evidence to " \+ esc\(H\.fmtDate\(x\.dated\.newest\)\)/.test(xdoc), 'E2 the cover: the claim over the lead photograph, the counts, the question, the frame, the evidence date');
ok(/How to read this/.test(xdoc) && /What this read is and is not/.test(xdoc) && /cut \? '<div class="kicker" style="margin-top:14px">What this read is and is not<\/div>/.test(xdoc), 'E3 the client cut says its limits on page two');
ok(/The read · ' \+ \(i \+ 1\) \+ " of " \+ findings\.length/.test(xdoc) && /class="xc-chips"/.test(xdoc) && /What happened/.test(xdoc) && /What it means/.test(xdoc) && /THE MOVE · BY ROLE/.test(xdoc) && /earned a move on this finding/.test(xdoc) && /srcline\(f\.sources\)/.test(xdoc), 'E4 a spread per finding: the photograph with its chip, the chips, what happened beside what it means, the moves the finding earned, the sources it cites');
ok(/The measure/.test(xdoc) && /x\.measures && !cut/.test(xdoc) && /Stories by week/.test(xdoc) && /Counted from /.test(xdoc), 'E5 the measure prints in the house cut only, with its coverage said');
ok(/What the read does not see/.test(xdoc) && /What the read stood on/.test(xdoc) && /Every source this read cited, numbered as it was cited\. Nothing it did not cite is listed\./.test(xdoc) && /XC_GROUPS\.filter/.test(xdoc) && /foot\[s\]/.test(xdoc), 'E6 the limits, what it stood on, and the sources: cited only, numbered in order of first mention, grouped');
const xblock = between(rpage, 'var XC_GROUPS = ', '  function openRead(id) {');
ok(/function xcPhoto\(url, slot, alt\)/.test(xblock) && /onload="phCheck\(this\)" onerror="phGone\(this\)"/.test(xblock) && !/crossorigin/.test(between(xblock, 'function xcPhoto', 'function excavateDoc')), 'E7 a photograph is the outlet\'s own, drawn from its address without a CORS demand, waited for like every photo');
ok(!/—/.test(xdoc) && !/—/.test(between(rpage, 'if (row.kind === "excavate") {', 'var btns = [];')), 'E8 no em dash in the page\'s new code');

// ── F: the Intelligence page ─────────────────────────────────────────────────────────────────────────────────────────────────
ok(/function exportToPDF\(cut\) \{/.test(ipage) && /return _excPrint\(cut\);   \/\/ SEAM:EXC_PRINT/.test(ipage) && !/function _buildReadPDF\(/.test(ipage) && !/bodyHTML = _buildReadPDF/.test(ipage), 'F1 the Download asks the worker; the browser-built paper is gone');
const ip = between(ipage, 'async function _excPrint(cut) {', 'function _buildResultsPDF(dateStr,timeStr){');
ok(/const door = syn\.overnight && window\._doorOpen && window\._doorOpen\.id \? window\._doorOpen\.id : null;/.test(ip) && /syn\.read_id/.test(ip) && /This reading was not kept; run the read again to print it/.test(ip), 'F2 a live read prints by its ledger id, an overnight reading by its door row, a reading the ledger did not keep says so');
ok(/\/excavate\/pdf/.test(ip) && /JSON\.stringify\(\{ id, kind, cut: cut === 'client' \? 'client' : null \}\)/.test(ip) && /X-Read-Name/.test(ip) && /a\.download = name/.test(ip), 'F3 the page asks for the house or the client cut and saves the file under the worker\'s name');
ok(/onclick="exportToPDF\(\)">↓ Download PDF<\/button>/.test(ipage) && /onclick="exportToPDF\('client'\)"/.test(ipage) && /↓ Client cut<\/button>/.test(ipage), 'F4 two buttons on a reading: the PDF and the client cut');
ok(/function _buildDashboardPDF\(config,data,dateStr,timeStr\)/.test(ipage) && /bodyHTML = _buildDashboardPDF\(_idbConfig, _idbData, dateStr, timeStr\);/.test(ipage), 'F5 the dashboard\'s own paper stays as it was');
ok(!/—/.test(ip), 'F6 no em dash in the Intelligence page\'s new code');
console.log('\nproof_print: ' + pass + ' checks PASS');
