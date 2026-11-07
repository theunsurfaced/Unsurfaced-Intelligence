/**
 * proof_the_run_query.mjs  --  RQ1 THE RUN QUERY: the wait (the question as the headline, the stages lit as they happen with what each found,
 * the read's first lines as they land, the frame at the foot; no rings, no bar on a timer, none of the house's words) and the arrival (one
 * header, one rail with More, the jump rail in the page's words, the findings under a heading with the lenses as chips, FOR YOU after the
 * moves, the voices once as the landing's band, Measured beside what the read stood on, the receipts, the foot with the reader's marks).
 */
import fs from 'fs';
const page = fs.readFileSync('intelligence/index.html', 'utf-8');
const seams = JSON.parse(fs.readFileSync('seams.json', 'utf-8')).registry;
let pass = 0;
const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const between = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('anchor missing: ' + a); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('anchor missing: ' + b); return s.slice(i, j); };
const safe = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeAttr = s => String(s).replace(/"/g, '&quot;');

// A fake document: elements by id, class lists as strings, querySelectorAll over the stages.
const mkDoc = () => {
  const els = {};
  const el = (id) => { if (!els[id]) els[id] = { id, className: '', innerHTML: '', textContent: '', style: {}, attrs: {}, hasAttribute(k) { return k in this.attrs; }, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, classList: { has: (c) => els[id].className.split(' ').includes(c), remove: (c) => { const e = els[id]; e.className = e.className.split(' ').filter(x => x !== c).join(' '); }, toggle: (c, force) => { const e = els[id]; const on = e.className.split(' ').includes(c); const want = force === undefined ? !on : !!force; if (want !== on) e.className = on ? e.className.split(' ').filter(x => x !== c).join(' ') : (e.className + ' ' + c).trim(); return want; } }, scrollIntoView() { els[id].scrolled = true; } }; return els[id]; };
  ['searching-state', 'wait-k', 'loader-query', 'loader-steps', 'loader-draft', 'wait-foot', 'read-rail-more', 'rail-voices', 'read-after'].forEach(el);
  const doc = { band: null, getElementById: (id) => els[id] || null, querySelector: (sel) => sel === '#read-voices .rb-vall' ? doc.band : null, querySelectorAll: (sel) => sel === '.lstep' ? Object.values(els).filter(e => /^ls\d$/.test(e.id)) : [] };
  // showLoader writes the stages as markup; the fake reads the ids back out of it so _lsSet can find them.
  Object.defineProperty(els['loader-steps'], 'innerHTML', { set(v) { this._h = v; (v.match(/id="ls\d"/g) || []).forEach((m, i) => { const e = el('ls' + i); e.className = /class="lstep active" id="ls0"/.test(v) && i === 0 ? 'lstep active' : 'lstep'; el('lsn' + i); }); }, get() { return this._h || ''; } });
  return { doc, els };
};

// \u2500\u2500 A. The wait \u2500\u2500
const loaderMarkup = between(page, '<div class="searching-state" id="searching-state">', '<!-- MAIN DASHBOARD -->');
ok(/<div class="wait">\s*<div class="wait-k" id="wait-k">The read is being written<\/div>\s*<div class="wait-q" id="loader-query"><\/div>\s*<div class="wait-grid">\s*<div class="wait-stages" id="loader-steps"><\/div>\s*<div class="wait-draft" id="loader-draft" style="display:none"><\/div>\s*<\/div>\s*<div class="wait-foot" id="wait-foot"><\/div>/.test(loaderMarkup) && !/loader-ring|fetch-bar|fetch-label|loader-label|EXCAVATING/.test(loaderMarkup),
  'A1 the wait is the kicker, the question, the stages beside the draft, and the frame at the foot; no rings, no bar, no label in capitals');
const waitSrc = between(page, 'let stepTimer=null, progressVal=0, progressTimer=null;', '// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n//  BASIC SEARCH');
const stageSrc = between(page, 'function _loaderStage(st) {', '// GET a source through the proxy');
let intervals = [], timeouts = [];
const mkWait = (W) => { const { doc, els } = mkDoc(); const F = new Function('window', 'document', 'safe', 'safeAttr', '_depthGet', '_recDay', '_blindWords', 'setInterval', 'clearInterval', 'setTimeout',
  waitSrc + stageSrc + '; return { showLoader, _lsSet, _loaderGathered, hideLoader, _loaderStage, _loaderDraft, _waitFoot };')(W, doc, safe, safeAttr, () => 'full', d => 'the ' + String(d).slice(8, 10) + 'th', t => String(t).replace(/\bthe lake\b/g, 'the archive'), (fn, ms) => { intervals.push(ms); return 1; }, () => {}, (fn, ms) => { timeouts.push(ms); fn(); }); return { F, els }; };
{
  intervals = []; timeouts = [];
  const W = { _depth: 'full', _intent: { q: 'Who is winning the running shoe', frame: { market: 'US', category: 'athletic footwear', audience: 'runners', competitors: ['Nike', 'Hoka', 'On'] } } };
  const { F, els } = mkWait(W);
  F.showLoader('Who is winning the running shoe', 'live', ['Reading the sources', 'Reading what people say', 'Writing the read', 'Checking every line is cited', 'Naming the moves']);
  ok(els['searching-state'].style.display === 'block' && els['wait-k'].innerHTML === 'The read is being written <i>\u00b7 full \u00b7 about a minute</i>' && els['loader-query'].textContent === 'Who is winning the running shoe' && els['loader-draft'].style.display === 'none' && els['wait-foot'].innerHTML === '<span>US \u00b7 athletic footwear \u00b7 runners</span><span>against Nike, Hoka, On</span>',
    'A2 a live read: the kicker says full and about a minute, the question is the headline, the draft waits, the frame stands at the foot');
  ok(/<div class="lstep active" id="ls0"><span class="dot"><\/span><span class="t">Reading the sources<\/span><span class="n" id="lsn0"><\/span><\/div>/.test(els['loader-steps'].innerHTML) && (els['loader-steps'].innerHTML.match(/class="lstep"/g) || []).length === 4 && intervals.length === 0,
    'A3 five stages, the first lit, the rest waiting on the worker: a live read sets no timer');
  F._loaderGathered({ items: [{ source: 'Dezeen', published_at: '2026-11-03T06:00:00Z' }, { source: 'dezeen', date: '2026-10-12' }, { source: 'Wallpaper', published: '2026-09-28' }, { source_name: 'Frieze' }] });
  ok(els['ls0'].className === 'lstep done' && els['lsn0'].textContent === '4 lines \u00b7 3 outlets \u00b7 back to the 28th' && els['ls1'].className === 'lstep done' && els['lsn1'].textContent === 'no voices on the subject yet' && els['ls2'].className === 'lstep active',
    'A4 the gather came back: the lines, the outlets (one name counted once) and how far back; the voices stage says none yet; writing is lit');
  W._gatherMeta = { meta: { voices: { quotes: [{ text: 'a' }, { text: 'b', on_frame: false }, { text: 'c' }] } }, frame: { market: 'UK', category: 'trail shoes', competitors: [] } };
  F._loaderGathered({ items: [] });
  ok(els['lsn0'].textContent === 'nothing yet' && els['lsn1'].textContent === '2 voices on the subject' && els['wait-foot'].innerHTML === '<span>UK \u00b7 trail shoes</span>', 'A5 nothing gathered is said as nothing yet; the voices counted are the ones on the subject; the foot takes the frame the gather read against');
  F._loaderStage({ stage: 'tabling', note: 'Writing the fact table from 40 lines and counting the lake' });
  const a6 = els['ls2'].className === 'lstep active' && els['lsn2'].textContent === 'setting out what the lines say';
  F._loaderStage({ stage: 'reading', note: 'Reading 40 lines' });
  ok(a6 && els['lsn2'].textContent === 'reading the lines', 'A6 the worker reading: the stage said in the reader\'s words; the worker\'s own note (its tables, its lake) never shown');
  F._loaderStage({ stage: 'writing', evidence: 38, dropped: 2 });
  ok(els['lsn2'].textContent === '38 lines in, 2 set aside', 'A7 the worker writing: the lines in and the lines set aside');
  F._loaderDraft({ read: ['Running shoes are sold on the second pair', 'The first pair is the advertisement'], takeaway: 'Price the second pair.', insights: [{ title: 'Hoka doubled repeat buyers', category: 'market' }, { title: 'Carbon plates go mass', category: 'odd' }], ideas: [] });
  ok(els['ls2'].className === 'lstep done' && els['lsn2'].textContent === 'the first lines are in' && els['ls3'].className === 'lstep active' && els['lsn3'].textContent === '2 findings so far' && els['loader-draft'].style.display === 'block'
    && /^<span class="wait-ak">As it lands<\/span><h2 class="ld-line">Running shoes are sold on the second pair<\/h2><p class="ld-line two">The first pair is the advertisement<\/p><p class="ld-take">Price the second pair\.<\/p><div class="ld-list"><div class="ld-item"><span class="card-cat market">\u25cf<\/span> Hoka doubled repeat buyers<\/div><div class="ld-item"><span class="card-cat consumer">\u25cf<\/span> Carbon plates go mass<\/div><\/div>$/.test(els['loader-draft'].innerHTML),
    'A8 the draft lands as the read\'s first lines: the headline, the dek, the takeaway, then the findings by name (an unknown lens falls to consumer); the stages follow it');
  F._loaderStage({ stage: 'completing', findings: 2, missing: ['ideas'] });
  ok(els['ls3'].className === 'lstep done' && els['lsn3'].textContent === '2 findings cited' && els['ls4'].className === 'lstep active' && els['lsn4'].textContent === 'writing the moves', 'A9 the worker completing: every line cited, the moves being named');
  F._lsSet(2, 'active', 'x');
  ok(els['ls2'].className === 'lstep done', 'A10 a stage is lit forward only: done stays done');
  F._loaderDraft({ read: ['<b>x</b>'], insights: [], ideas: [{ type: 'PLAY', headline: 'Sell the second pair' }] });
  ok(/<h2 class="ld-line">&lt;b&gt;x&lt;\/b&gt;<\/h2>/.test(els['loader-draft'].innerHTML) && /<div class="ld-list moves"><div class="ld-item"><span class="ld-type">PLAY<\/span> Sell the second pair<\/div><\/div>/.test(els['loader-draft'].innerHTML) && els['lsn4'].textContent === '1 move so far',
    'A11 the moves land by name; the draft is escaped');
  F.hideLoader();
  ok([0, 1, 2, 3, 4].every(i => els['ls' + i].className === 'lstep done') && timeouts[0] === 400 && els['searching-state'].style.display === 'none' && !/Complete\./.test(waitSrc), 'A12 the read is in: every stage done, the wait gone after a beat, no Complete');
  intervals = [];
  const q = mkWait({ _depth: 'quick', _intent: { q: 'the last question', frame: { market: 'US', competitors: ['Nike'] } } }); q.F.showLoader('a new question', 'live', ['a']);
  ok(q.els['wait-k'].innerHTML === 'The read is being written <i>\u00b7 quick \u00b7 under a minute</i>' && q.els['wait-foot'].innerHTML === '' && intervals.length === 0, 'A13 a quick read says under a minute; a new question does not wear the last question\'s frame');
  const tq = mkWait({ _tileFrame: { _q: 'Nike in athletic footwear', frame: { market: 'US', category: 'athletic footwear', competitors: ['Hoka'] } } }); tq.F.showLoader('Nike in athletic footwear', 'live', ['a']);
  ok(tq.els['wait-foot'].innerHTML === '<span>US \u00b7 athletic footwear</span><span>against Hoka</span>', 'A14 a tile\'s frame rides into its wait');
  const b = mkWait({}); b.F.showLoader('x', 'basic', ['Asking the open sources', 'b']);
  ok(b.els['wait-k'].innerHTML === 'Gathering the sources <i>\u00b7 nothing is written</i>' && intervals.length === 1 && intervals[0] === 600, 'A15 a gather without a writer says so and steps on the short timer');
  intervals = [];
  const d = mkWait({}); d.F.showLoader('Heritage drops overrun the calendar', 'door', ['Opening the reading', 'Placing its evidence', 'Rendering'], 'OPENING THE OVERNIGHT READ', { market: 'US', category: 'athletic footwear', competitors: [] });
  ok(d.els['wait-k'].innerHTML === 'opening the overnight read' && d.els['wait-foot'].innerHTML === '<span>US \u00b7 athletic footwear</span>' && intervals.length === 1 && intervals[0] === 600 && /showLoader\(t\.title \|\| q \|\| 'the subject', 'door', \['Opening the reading', 'Placing its evidence', 'Rendering'\], 'OPENING THE OVERNIGHT READ', t\.frame \|\| null\)/.test(page),
    'A16 a door read steps on the short timer with its own kicker and the reading\'s frame at the foot');
}
const liveSteps = between(page, "showLoader(q,'live',[", ']);'), basicSteps = between(page, "showLoader(q,'basic',[", ']);');
ok(/'Reading the sources',\s*'Reading what people say',\s*'Writing the read',\s*'Checking every line is cited',\s*'Naming the moves',/.test(liveSteps) && /'Asking the open sources',\s*'Reading what people say',\s*'Sorting what came back',\s*'Placing it by lens',\s*'Gathered, not read',/.test(basicSteps) && /_loaderGathered\(g\)/.test(between(page, "showLoader(q,'live',[", 'if(!g.items.length){')),
  'A17 the five stages in the reader\'s words for a live read and for a gather; the gather lights the first two');
ok(!/signal|the lake|Fusing|Excavate AI|server-side|Excavating/i.test(loaderMarkup + waitSrc + stageSrc + liveSteps + basicSteps), 'A18 none of the house\'s words in the wait');

// \u2500\u2500 B. The arrival: one header, one rail \u2500\u2500
const rbSrc = between(page, 'function _renderReadBlock(q, data, mode){', '/* EX33c: the jump rail scrolls to a part of the read. */');
ok(/\.results-header\{display:none\}/.test(page) && /<div class="rb-top"><div class="read-kicker rb-kick">\$\{_kick\}<\/div><\/div>/.test(rbSrc) && /<span class="rb-kind">\$\{ov\?'\u25cf Overnight read':data\.depth==='quick'\?'Quick read':'The read'\}<\/span>/.test(rbSrc) && /<i>\u00b7 the night of \$\{n\(ov\.night\)\}<\/i>/.test(rbSrc) && /line\$\{rcpt\.lines===1\?'':'s'\} read<\/i>/.test(rbSrc) && /outlet\$\{rcpt\.sources===1\?'':'s'\}<\/i>/.test(rbSrc),
  'B1 the summary card is hidden; the kicker names the kind of read, the night, the lines read and the outlets in words');
ok(/const _frameLine=`\$\{cells\.length\?`<p class="rb-frameline"><span class="rb-fk">The frame<\/span> /.test(rbSrc) && /const _qLine=\(fr&&fr\.question\)\|\|\(\(q&&String\(q\)\.trim\(\)!==String\(lines\[0\]\|\|''\)\.trim\(\)\)\?q:''\);/.test(rbSrc) && /\$\{_qLine\?`<p class="rb-q">\$\{n\(_qLine\)\}<\/p>`:''\}/.test(rbSrc) && !/rb-frame-cell|<dl class="rb-frame"/.test(rbSrc),
  'B2 the frame is one mono line (only when there are cells) with the question under it: the frame\'s, or what was typed, never the headline twice');
ok(/<div class="rb-rail" id="read-rail"><button type="button" class="rr red" onclick="trackThis\(document\.getElementById\('search-input'\)\.value\)">Track this<\/button>\$\{ov\?`<button type="button" class="rr" onclick="_goDeeperLive\(\)">Go deeper, live<\/button>`:data\.depth==='quick'\?`<button type="button" class="rr" onclick="goDeeper\(\)">The full read<\/button>`:''\}<button type="button" class="rr" onclick="exportToPDF\(\)">Download<\/button><button type="button" class="rr" onclick="openSourcesModal\(\)">Every source<\/button><button type="button" class="rr" onclick="_askTeam\('search', document\.getElementById\('search-input'\)\.value\)">Ask the team<\/button><button type="button" class="rr more" aria-expanded="false" aria-controls="read-rail-more" onclick="_railMore\(this\)">More<\/button>/.test(rbSrc),
  'B3 one rail under the read: Track this in red; Go deeper, live for an overnight read or The full read for a quick one; Download is the paper (exportToPDF, not the id the old rail lacked); Every source; Ask the team; More');
ok(/<div class="rb-rail-more" id="read-rail-more" hidden><button type="button" class="rr" onclick="exportToPDF\('client'\)"[^>]*>Client cut<\/button><button type="button" class="rr" onclick="_playRead\(/.test(rbSrc) && /New search<\/button><span id="read-rail-admin" style="display:none"><button type="button" class="rr" onclick="makeReconFromRead\(\)">Make this a RECON<\/button><button type="button" class="rr" onclick="pinLiveRead\(\)">Pin to folio<\/button><button type="button" class="rr" onclick="_scoreOpen\(\)">Score<\/button><\/span><\/div><\/div>/.test(rbSrc) && /_cmAdmin\(\)\.then\(a=>\{ const s=document\.getElementById\('read-rail-admin'\); if\(s\) s\.style\.display=a\?'':'none'; \}\)/.test(rbSrc),
  'B4 under More: the client cut, PLAY, a new search; the admin\'s three (RECON, the folio, the score) shown only to an admin');
ok(/\$\{_betHtml\}\s*\$\{_rail\}`;/.test(rbSrc) && /<div class="read-foryou" id="read-foryou"><\/div>\s*\$\{_rcHtml\}\s*\$\{_frameLine\}/.test(rbSrc), 'B5 the read\'s order: the lines, the takeaway, the other side, the record\'s check, the frame, the bet, the rail');
{
  const { doc, els } = mkDoc();
  const F = new Function('document', between(page, 'function _railMore(btn){', '/* SEAM:THE_ARRIVAL (RQ1): the voices band') + between(page, 'function _voicesAll(btn){', '\n') + '; return { _railMore, _voicesAll };')(doc);
  const more = els['read-rail-more']; more.setAttribute('hidden', '');
  const btn = { attrs: {}, textContent: 'More', setAttribute(k, v) { this.attrs[k] = v; } };
  F._railMore(btn);
  const opened = !more.hasAttribute('hidden') && btn.attrs['aria-expanded'] === 'true' && btn.textContent === 'Less';
  F._railMore(btn);
  ok(opened && more.hasAttribute('hidden') && btn.attrs['aria-expanded'] === 'false' && btn.textContent === 'More', 'B6 More folds the rest of the rail out and back, and says which');
  const vb = { attrs: {}, textContent: 'All voices \u2192', setAttribute(k, v) { this.attrs[k] = v; } };
  F._voicesAll(vb);
  const vo = els['rail-voices'].className === 'open' && vb.attrs['aria-expanded'] === 'true' && vb.textContent === 'Fewer voices' && els['rail-voices'].scrolled === true;
  F._voicesAll(vb);
  ok(vo && els['rail-voices'].className === '' && vb.textContent === 'All voices \u2192' && /#rail-voices\.folded\{display:none\}#rail-voices\.folded\.open\{display:block\}/.test(page), 'B7 All voices opens the whole grid in place and scrolls to it; Fewer voices folds it');
  const FF = new Function('window', 'document', between(page, 'function _voicesFold(host){', '\n') + '; return _voicesFold;')({ _voicesFresh: true }, doc);
  const host = els['rail-voices']; host.className = 'open'; doc.band = {};
  FF(host); const f1 = host.className === 'folded';
  host.className = 'folded open'; FF(host); const f2 = host.className === 'folded open';
  doc.band = null; FF(host); const f3 = host.className === 'open';
  doc.band = {}; els['read-after'].style.display = 'none'; host.className = ''; FF(host); const f4 = host.className === ''; els['read-after'].style.display = '';
  ok(f1 && f2 && f3 && f4 && /_voicesFold\(host\);   \/\/ SEAM:THE_ARRIVAL \(RQ1\)/.test(between(page, 'function _renderVoices(meta){', '\n}\n')) && /_voicesFold\(host\);/.test(between(page, 'function _renderRailVoices(items){', '\n}\n')) && /window\._voicesFresh=true;/.test(between(page, 'function renderResults(q, data, mode){', 'lastSources=data.sources')),
    'B7b the grid folds behind a band that is showing and only then (a read that did not finish keeps it whole); a new read starts it folded; the chips and Show more keep it open; a read with no band shows it whole');
}
ok(/<button type="button" onclick="_readJump\('read-block'\)">The read<\/button><button type="button" onclick="_readJump\('rlp-findings'\)">Findings<\/button><button type="button" onclick="_readJump\('moves-section'\)">Moves<\/button><button type="button" onclick="_readJump\('reach-block'\)">For you<\/button><button type="button" onclick="_readJump\('read-voices'\)">Voices<\/button><button type="button" onclick="_readJump\('read-measured'\)">Measured<\/button><button type="button" onclick="_readJump\('read-receipts'\)">Receipts<\/button>/.test(page),
  'B8 the jump rail in the page\'s words: The read, Findings, Moves, For you, Voices, Measured, Receipts');
const reloc = rbSrc.indexOf("const host=document.getElementById('read-doors'); if(host){ const gd=document.getElementById('intent-doors'); if(gd&&gd.parentNode!==host) host.appendChild(gd); const hn=document.getElementById('results-house-note'); if(hn&&hn.parentNode!==host) host.insertBefore(hn, host.firstChild); }");
ok(/<div class="read-doors" id="read-doors"><\/div>/.test(page) && reloc > 0 && reloc < rbSrc.indexOf("if(mode!=='live'){") && /\.read-doors:empty\{display:none\}/.test(page),
  'B9 the task\'s door and the house\'s note move under the read before any branch, since the summary card that held them is hidden');

// \u2500\u2500 C. The findings, FOR YOU, the voices, the measure, the receipts, the foot \u2500\u2500
ok(/\.results-lens-bar::before\{content:'The findings';font-family:'DM Serif Display',serif/.test(page) && /\.results-lens-bar \.rlb\.active,\.results-lens-bar \.rlb\.active\.cat-market,\.results-lens-bar \.rlb\.active\.cat-culture,\.results-lens-bar \.rlb\.active\.cat-brand,\.results-lens-bar \.rlb\.active\.cat-truth\{border-color:var\(--accent\);color:var\(--text\)\}/.test(page),
  'C1 the findings carry a heading; the lenses are chips with counts, the active one framed in the house red whatever its lens');
ok(/<p class="card-excerpt card-read"><strong>The read<\/strong> \$\{safe\(ins\.implication\)\}<\/p>/.test(page) && !/<strong>So:<\/strong>/.test(between(page, 'function _meaningBlock(', '\n}')), 'C2 a finding\'s second line is The read, as the landing says it, never So');
const reachSrc = between(page, 'function _reachBlock(id) {', '\n}\n');
ok(/<div class="reach-top"><span class="reach-k">FOR YOU<\/span><span class="reach-role" id="reach-role"><\/span><\/div>/.test(reachSrc) && !/Embed|THIS READING|FOR YOUR ROLE/.test(reachSrc) && /Evidence pack<\/button><button type="button" class="tl-open" onclick="_panelAsk\('\$\{safeAttr\(id\)\}'\)">Ask the panel<\/button><button type="button" class="tl-open" onclick="_askTeam\('insight','\$\{safeAttr\(id\)\}'\)">Ask the team<\/button>/.test(reachSrc),
  'C3 FOR YOU is one block: the role beside the kicker, the implications, Evidence pack, Ask the panel, Ask the team; no Embed, no THIS READING row');
ok(/\(document\.getElementById\('moves-section'\) \|\| rb\)\.insertAdjacentElement\('afterend', el\)/.test(reachSrc) && /const fy = document\.getElementById\('read-foryou'\); if \(fy\) el\.appendChild\(fy\);/.test(reachSrc),
  'C4 FOR YOU reads after the moves; the group form (IQ5) sits under the role\'s lines');
ok(/const foot = document\.getElementById\('read-acts-marks'\); if \(foot\) \{ foot\.innerHTML = '<span class="reach-marks-k">Was this read useful\?<\/span>'; foot\.appendChild\(marks\); \} else el\.appendChild\(marks\);/.test(reachSrc) && /_marksLoad\(id\);/.test(reachSrc),
  'C5 the reader\'s marks (held, useful, wrong) stand at the foot of the read, asked as a question; a read without a foot keeps them in the block');
ok(/rl\.textContent = \(j\.fallback \? 'for every role' : 'for ' \+ String\(j\.role\)\) \+ ' \u00b7 from your profile';/.test(page), 'C6 the role line says whose role, from the profile, in text (never markup)');
const vpSrc = between(page, 'function _voicesPull(voices, k){', '\n}\n');
ok(/<div class="rb-voices-head"><span class="rb-vh">What people are saying<\/span><button type="button" class="rb-vall" aria-expanded="false" onclick="_voicesAll\(this\)">All voices \u2192<\/button><\/div><p class="rb-voices-sub">Comments quoted as written, about the subjects this read stood on; a speaker\u2019s own description beside the words, never a name\.<\/p>/.test(vpSrc) && /<div class="rb-voice-who">\$\{safe\(who\(q\)\)\}<\/div>/.test(vpSrc) && /bits\.length\?bits\.slice\(0,2\)\.join\(' \u00b7 '\):'A reader'/.test(vpSrc),
  'C7 the voices once, as the landing\'s band: the heading, All voices, the sub line, a column a speaker named by their own description or A reader');
ok(/if\(!picks\.length\) return voices\.quotes\.length\?`<div class="rb-voices-head">/.test(vpSrc) && !/voices-blind/.test(between(page, 'function _renderVoices(', '\n}\n')) && !/rb-voices-cap/.test(vpSrc),
  'C8 nothing long enough to pull still leaves the grid a click away; the platform line has left the grid');
const afterSrc = between(page, "const _blind=_readerBlind(", '/* EX33c: the jump rail');
ok(/<summary>Receipts: every source, when it was published, what was set aside, what this read does not see<\/summary>\$\{_blind\?`<p class="rb-foot rb-blind">\$\{safe\(_blind\)\}<\/p>`:''\}/.test(afterSrc) && /_readerBlind\(\(data\.blind\)\|\|\(window\._liveLast&&window\._liveLast\.synthesis&&window\._liveLast\.synthesis\.blind\)\|\|EXC_BLIND_LINE\)/.test(afterSrc)
  && (() => { const RB = new Function(between(page, 'function _readerBlind(t){', '\n') + '; return _readerBlind;')(); const out = RB('This read does not see TikTok, Instagram or X. Its voices come from YouTube and Mastodon; its news from the open web and the lake.'); return /the open web and our own archive\.$/.test(out) && !/lake|house/.test(out); })(),
  'C9 what this read does not see is said in the receipts, in the reader\'s words: our own archive, never the lake, never the house');
ok(/const _interp=\(data\.brief&&!data\.takeaway\)\?`<div class="rb-interp-head">The interpretation<\/div>/.test(afterSrc) && /\$\{\(_interp\|\|_pxHtml\|\|_ovHtml\)\?`<div class="rb-body rb-body-one" id="read-interp"><div class="rb-prose">\$\{_interp\}\$\{_pxHtml\}\$\{_ovHtml\}<\/div><\/div>`:''\}/.test(afterSrc),
  'C10 the interpretation is not said twice under a read that carries a takeaway; the block is one column');
ok(/\$\{\(_msHtml\|\|_rcptHtml\)\?`\$\{_msHtml\?'<div class="rb-sec-h">Measured<\/div>':''\}<div class="rb-measured-row\$\{_msHtml&&_rcptHtml\?'':' one'\}" id="read-measured-row">\$\{_msHtml\}\$\{_rcptHtml\}<\/div>`:''\}/.test(afterSrc) && /\.rb-measured-row\{display:grid;grid-template-columns:minmax\(0,2fr\) minmax\(260px,1fr\)/.test(page) && /\.rb-sec-h\{font-family:'DM Serif Display',serif;font-size:26px/.test(page),
  'C11 Measured under its heading, with what this read stood on beside it; one column when only one is there');
ok(/const _acts=`<div class="read-acts"><button type="button" class="btn-go-deeper" onclick="trackThis\(document\.getElementById\('search-input'\)\.value\)">Track this<\/button><button type="button" class="read-act" onclick="openSourcesModal\(\)">Every source<\/button><button type="button" class="read-act" onclick="_askTeam\('search', document\.getElementById\('search-input'\)\.value\)">Ask the team<\/button><span class="read-acts-marks" id="read-acts-marks"><\/span><\/div>`;/.test(afterSrc) && /\.read-acts \.btn-go-deeper\{font-size:11px;letter-spacing:\.08em;text-transform:uppercase;padding:10px 15px\}/.test(page),
  'C12 the foot: Track this, Every source, Ask the team and the reader\'s marks; nothing the rail does not say (PLAY sits under More)');
ok(/const _ovHtml=ov\?`<p class="rb-foot">Overnight read for the night of \$\{n\(ov\.night\)\}[^`]*\.<\/p>`:'';/.test(page) && !/rb-go-live/.test(afterSrc + between(page, 'const _ovHtml=', '\n')), 'C13 the overnight foot names the night without a second Go deeper button');
ok(/\{ const rb0=document\.getElementById\('reach-block'\); if\(rb0\) rb0\.remove\(\); window\._voicesFresh=true; setTimeout\(/.test(between(page, 'function renderResults(q, data, mode){', 'lastSources=data.sources')), 'C14 a new read drops the last reading\'s FOR YOU, the form it took in and its implications');
ok(/if\(gd&&synthesis&&synthesis\.depth==='quick'\)\{ gd\.style\.display=''; \}/.test(page) && !/Go deeper: the full read/.test(page), 'C15 a quick read\'s full read is on the rail once, not a second button in the door');
ok(/const h = document\.getElementById\('read-block'\) \|\| document\.querySelector\('#live-results \.results-header'\); if \(!h\) return;/.test(page) && /h\.insertAdjacentElement\('afterend', el\); el\.scrollIntoView\(/.test(page), 'C16 the score panel mounts under the read, where Score now lives, and comes into view');
ok(/<h3 class="card-title" style="font-size:21px;line-height:1\.2">\$\{safe\(ins\.title\|\|''\)\}<\/h3>/.test(page) && !/\.card-title\{font-size:21px\}/.test(page) && /<strong>The read<\/strong> \$\{safe\(ins\.implication\)\}<\/p>`:''\}/.test(between(page, 'function openInsightModal(', '\n}')), 'C17 a finding\'s title a step larger on the card itself (the record\'s tiles keep theirs); the finding\'s modal says The read too');
ok(/\$\{ov&&data\.depth==='quick'\?'<i>\u00b7 quick<\/i>':''\}/.test(rbSrc) && !/_voiceSelfLine/.test(vpSrc), 'C18 a quick read is said once in the kicker; a pulled voice names the speaker once, in the head');
ok(/#read-rail-admin\{display:contents\}/.test(page) && /@media \(max-width:760px\)\{\.read-block \.read-line\{font-size:28px\}\.read-block \.read-line\.two\{font-size:18px\}\.read-acts #read-acts-marks button\{width:auto\}/.test(page), 'C19 the admin\'s three keep the rail\'s gap; a phone\'s headline and dek step down; the marks keep their width in the stacked foot');

// -- E. The re-cut: every finding the landing's figure; the band by relevance first --
{
  const figSrc = between(page, 'function _findFig(ins,cat){', '\n');
  const photoSrc = between(page, 'function _hsPhoto(t, seen, cls) {', "/* The lead's move:");
  const faceSrc = between(page, 'function _hsFace(t) {', '\n');
  const W = { _lastFrame: { entity: '', category: 'design retrospective' } };
  const FF = new Function('window', 'safe', 'safeAttr', '_cleanSource', 'CAT_LABELS', '_hsSrc', faceSrc + '\n' + photoSrc + figSrc + '; return _findFig;')(W, safe, safeAttr, x => String(x), { market: 'Market', brand: 'Brand' }, t => t.photo.src);
  const withPhoto = FF({ image: 'https://x/a.jpg', imageSource: 'Dezeen', category: 'market' }, 'market');
  const without = FF({ category: 'brand' }, 'brand');
  const bad = FF({ image: 'javascript:alert(1)', category: 'brand' }, 'brand');
  W._lastFrame = {};
  const bare = FF({ category: 'brand' }, 'brand');
  ok(/^<figure class="hs-thumb card-fig"><span class="hs-face-name" aria-hidden="true">design retrospective<\/span><img src="https:\/\/x\/a\.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="_hsImgFail\(this\)"><figcaption>Photo: Dezeen<\/figcaption><\/figure>$/.test(withPhoto)
    && without === '<figure class="hs-thumb card-fig hs-face"><span class="hs-face-name" aria-hidden="true">design retrospective</span></figure>' && bad === without
    && bare === '<figure class="hs-thumb card-fig hs-face"><span class="hs-face-name" aria-hidden="true">Brand</span></figure>',
    'E1 every finding keeps the same slot: the photograph with its credit through the house figure (onerror falls to the name), the subject set large without one, only an http(s) address taken, the lens when there is no subject');
  ok(/<div class="insight-card has-img" style="animation:fadeIn 0\.4s ease \$\{i\*0\.065\}s both" onclick="openInsightModal\(\$\{idx\}\)">\s*\$\{_findFig\(ins,cat\)\}/.test(page) && !/<img class="card-img" src="\$\{safeUrl\(ins\.image\)\}"/.test(page) && /\.insight-card \.card-fig\{display:block;aspect-ratio:16\/9/.test(page) && /\.insight-card \.card-fig figcaption\{/.test(page),
    'E2 the finding card draws the figure every time at 16:9, the credit on the photograph');
  const vp = between(page, 'function _voicesPull(voices, k){', '\n}\n') + '\n}\n';
  const sortSrc = between(page, 'function _voiceSort(a,b){', '\n') + '\n';
  const VW = { _lastVoices: [{ text: 'The finding stands on this one: retrospectives moved to festivals this fall, sadly.' }], _voiceUsed: new Map([[0, 'k']]) };
  const VP = new Function('window', 'safe', 'safeUrl', '_voiceSelfLine', sortSrc + vp + '; return _voicesPull;')(VW, safe, x => x, () => '');
  const q = (text, likes, on) => ({ text, likes, on_frame: on, src: 's' });
  const html = VP({ sources: [{ id: 's', source: 'YouTube' }], quotes: [
    q('A very popular comment that was never read against the subject at all here.', 900, null),
    q('An off-subject comment about something else entirely, with many likes too.', 800, false),
    q('An on-subject comment with few likes, about the festivals and the retrospectives.', 3, true),
    q('The finding stands on this one: retrospectives moved to festivals this fall, sadly.', 1, true),
    q('Another on-subject comment, a little more liked, about design weeks this season.', 9, true) ] }, 3);
  const order = [...html.matchAll(/<p>([^<]+)<\/p>/g)].map(m => m[1].slice(0, 14));
  ok(JSON.stringify(order) === JSON.stringify(['The finding st', 'Another on-sub', 'An on-subject ']), 'E3 the band picks the voice a finding stands on first, then the ones read on the subject by likes; a popular voice never read against the subject waits; an off-subject one never comes');
  const html2 = VP({ sources: [{ id: 's', source: 'YouTube' }], quotes: [q('A very popular comment that was never read against the subject at all here.', 900, null), q('An on-subject comment with few likes, about the festivals and the retrospectives.', 3, true)] }, 3);
  ok([...html2.matchAll(/<p>([^<]+)<\/p>/g)].map(m => m[1].slice(0, 14)).join('|') === 'An on-subject |A very popular', 'E4 a voice never read against the subject fills the band only when fewer than three are on it');
}


{
  // E5: a live read (no cited voices) still puts the voice a finding's own words meet first
  const vp = between(page, 'function _voicesPull(voices, k){', '\n}\n') + '\n}\n';
  const helpers = between(page, 'function _voiceWords(s){', '\n') + '\n' + between(page, 'function _voiceMatch(ins, voices){', '\n}\n') + '\n}\n' + between(page, 'function _voiceKey(ins){', '\n') + '\n' + between(page, 'function _voiceSort(a,b){', '\n') + '\n';
  const W = { _lastVoices: null, _voiceUsed: new Map(), _lastInsights: [{ title: 'Citywide festivals replace solo retrospectives', excerpt: 'Designart Tokyo and Amman Design Week gathered hundreds of designers', implication: 'Festivals carry the attention retrospectives once had' }] };
  const VP = new Function('window', 'safe', 'safeUrl', '_voiceSelfLine', helpers + vp + '; return _voicesPull;')(W, safe, x => x, () => '');
  const q = (text, likes, on) => ({ text, likes, on_frame: on, src: 's' });
  const html = VP({ sources: [{ id: 's', source: 'YouTube' }], quotes: [
    q('Loved the colours in this video, the editing is great and the music too.', 500, true),
    q('Honestly the festivals in Tokyo and Amman had more designers than any retrospective this year.', 2, true),
    q('A third on-subject line about design and the season, liked a fair amount.', 40, true) ] }, 3);
  ok([...html.matchAll(/<p>([^<]+)<\/p>/g)].map(m => m[1].slice(0, 12)).join('|') === 'Honestly the|Loved the co|A third on-s', 'E5 on a live read the band leads with the voice a finding\'s own words meet, ahead of a more liked one that meets none');
  ok(/function _renderResultsV2\(q, lenses, truth, mode\) \{\n  window\._lastVoices=null; window\._voiceUsed=new Map\(\);[^\n]*\n  window\._lastFrame=null;/.test(page), 'E6 a gather\'s cards never wear the last read\'s subject');
  ok(/if\(mode!=='live'\)\{ const ra=document\.getElementById\('read-after'\); if\(ra\)\{ ra\.innerHTML=''; ra\.style\.display='none'; \} \}/.test(between(page, 'function _renderReadBlock(q, data, mode){', "if(mode!=='live'){   // SEAM:EXC_FALLBACK")), 'E7 a read that did not finish keeps nothing of the read before it');
  const btns = [{ on: "_readJump('read-block')" }, { on: "_readJump('reach-block')" }].map(b => ({ style: {}, getAttribute: () => b.on }));
  const JS = new Function('document', between(page, 'function _jumpSync(){', '\n') + '; return _jumpSync;')({ querySelectorAll: () => btns, getElementById: id => id === 'read-block' ? {} : null });
  JS();
  ok(btns[0].style.display === '' && btns[1].style.display === 'none' && /if \(typeof _jumpSync === 'function'\) _jumpSync\(\);/.test(between(page, 'async function _reachBlock(id) {', '\n}\n')) && /_jumpSync\(\); \},0\);/.test(between(page, 'function renderResults(q, data, mode){', 'lastSources=data.sources')), 'E8 the jump rail shows only the parts this read has; For you appears when FOR YOU does');
  ok(/#sec-explore \.insight-card \.card-fig \.hs-face-name\{font-size:22px;padding:16px\}/.test(page), 'E9 the card\'s name is set at the card\'s size, not the landing lead\'s');
}

// \u2500\u2500 D. The styles, the seams, the words \u2500\u2500
const styleSrc = between(page, '/* \u2550\u2550\u2550 SEAM:THE_WAIT / SEAM:THE_ARRIVAL (RQ1)', '.read-take{font-family');
ok(/\.wait-q\{font-family:'DM Serif Display',serif;font-size:40px/.test(styleSrc) && /\.wait-grid\{display:grid;grid-template-columns:1fr 1fr/.test(styleSrc) && /\.wait-draft\{border-left:2px solid var\(--accent\)/.test(styleSrc) && /\.wait-stages \.lstep\.done \.dot\{background:var\(--accent\)/.test(styleSrc) && /@media \(max-width:900px\)\{\.wait-grid\{grid-template-columns:1fr\}/.test(styleSrc),
  'D1 the wait\'s styles: the question in serif, the stages beside the draft, the draft on a red rule, a lit dot; one column on a phone');
ok(/\.read-block \.read-line\{font-size:36px;line-height:1\.1/.test(styleSrc) && /\.rb-rail \.rr\{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:\.12em;text-transform:uppercase/.test(styleSrc) && /\.rb-rail \.rr\.red\{background:var\(--accent\)/.test(styleSrc) && /\.rb-voices\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(styleSrc) && /\.rb-voice-who\{font-family:'Space Mono',monospace/.test(styleSrc),
  'D2 the arrival\'s styles: the headline at 36px, the rail in mono capitals with Track this in red, the voices three across with the speaker in mono');
const fams = (styleSrc.match(/font-family:[^;}]+/g) || []).map(x => x.replace(/^font-family:/, '').trim());
ok(fams.length > 10 && fams.every(f => /^('Syne',sans-serif|'DM Serif Display',serif|'Space Mono',monospace)$/.test(f)), 'D3 every family the cut names is one of the page\'s three (Syne, DM Serif Display, Space Mono); none the page does not load');
ok(seams['SEAM:THE_WAIT'] && seams['SEAM:THE_WAIT'].file === 'intelligence/index.html' && seams['SEAM:THE_ARRIVAL'] && seams['SEAM:THE_ARRIVAL'].file === 'intelligence/index.html' && /SEAM:THE_WAIT \(RQ1\)/.test(page) && /SEAM:THE_ARRIVAL \(RQ1\)/.test(page),
  'D4 the seams are registered and marked in the page');
const fresh = loaderMarkup + waitSrc + stageSrc + rbSrc + reachSrc + vpSrc + afterSrc + styleSrc;
ok(!/\u2014/.test(fresh), 'D5 no dash in the cut');
const stripped = fresh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const copy = (stripped.match(/>[^<`$={};()]{4,}</g) || []).concat(stripped.match(/title="[^"]*"/g) || []).join('\n').replace(/>The frame</g, '');
const cc = (stripped.match(/title="[^"]*">Client cut/) || [''])[0];
ok(!/\bsignal|\bthe lake\b|\bframe\b(?!line|-)|the house/i.test(copy) && cc && !/'/.test(cc), 'D6 none of the house\'s words in the reader\'s copy, the titles included, and the client cut\'s title with no straight apostrophe (the comments set aside; The frame is the label the reader already knows)');

console.log('proof_the_run_query: ' + pass + ' checks passed');
