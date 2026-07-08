/**
 * proof_studio.mjs — SEAM:STUDIO end to end (needs: npm i jsdom).
 *   M  manifest: structural cap (exactly 2 perishable), formats, idempotence
 *   R  routes: admin gates, update whitelist, archive writes R2 + ledger patch
 *   T  templates: pure paint programs — doctrine encoded (red reserved, paper
 *      inversion, wrap caps), issue furniture correct
 *   Z  zip: store-mode container validated byte-level (magic + EOCD)
 *   U  UI: one whoami reveals Studio+Feed, staff flag set, staff door on gate,
 *      deep-link stash, queue renders, kill posts update
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const w = fs.readFileSync('worker/src/index.js', 'utf-8');
const html = fs.readFileSync('intelligence/index.html', 'utf-8');

/* ── M + R: server half, exact shipped code ── */
{
  const a = w.indexOf("const STUDIO_VOICE");
  const b = w.lastIndexOf('/*', w.indexOf('SEAM:STUDYBOARD \u2014 the public study board'));
  const sb = []; let existing = [];
  const stubs = {
    json: (o) => o,
    sbRest: async (env, path, opts) => { sb.push({ path, opts }); 
      if (path.startsWith('content_pieces?day=eq') && !opts) return existing;
      if (path.startsWith('content_pieces?id=eq') && !opts) return [{ id: 9, day: '2026-07-08', format: 'signal_still' }];
      return []; },
    callerIsAdmin: async (env, uid) => uid === 'admin',
    callModel: async (env, t, msgs) => msgs[0].content.includes('house memes') ? JSON.stringify({ mformat: 'vs', line1: 'L1', line2: 'L2' }) : 'CAPTION:' + msgs[0].content.slice(0, 20),
    logEvent: () => {},
  };
  const api = new Function('json', 'sbRest', 'callerIsAdmin', 'callModel', 'logEvent',
    w.slice(a, b) + '; return { buildStudioManifest, studioUpdate, studioArchive, studioManifest, studioCutStory };')(
    stubs.json, stubs.sbRest, stubs.callerIsAdmin, stubs.callModel, stubs.logEvent);

  const beats = ['ai', 'ai', 'tech', 'culture', 'tech', 'advertising'];
  const items = Array.from({ length: 6 }, (_, i) => ({ kicker: 'K' + i, headline: 'H' + i, take: 'T' + i, standfirst: 'S' + i, source_name: 'SRC' + i, beat: beats[i] }));
  const m = await api.buildStudioManifest({}, '2026-07-08', 7, items);
  const ins = sb.find(c => c.opts && c.opts.method === 'POST' && c.path === 'content_pieces').opts.body;
  ok(m.ok && m.pieces === 17 && ins.length === 17, 'M the slate is structural: seventeen cells across three stories');
  const slateHeads = [...new Set(ins.filter(x => x.format !== 'the_six').map(x => x.payload.headline))];
  ok(slateHeads.join('|') === 'H0|H2|H3', 'M three stories seated: first per unseen beat');
  ok([...new Set(ins.filter(x => x.format !== 'the_six').map(x => x.payload.beat))].sort().join('|') === 'ai|culture|tech', 'M three distinct beats on the slate');
  ok(ins.filter(x => x.payload.story === 1).length === 8, 'M primary story wears the full treatment: eight');
  ok(ins.filter(x => x.payload.story === 2).length === 3 && ins.filter(x => x.payload.story === 3).length === 3, 'M stories two and three get the essential three');
  ok(ins.filter(x => x.format === 'the_six').length === 3 && ins.find(x => x.format === 'the_six').payload.slides.length === 6, 'M the edition keeps its three carousels');
  const memes = ins.filter(x => x.format === 'hand_meme');
  ok(memes.length === 5 && memes.every(x => x.payload.line1 === 'L1') && ins[0].copy.caption.length > 0, 'M five memes, lines shaped per story, captions voiced');
  /* fallback: pre-0012 editions with no beats still slate by order */
  sb.length = 0; existing = [];
  const bare = Array.from({ length: 4 }, (_, i) => ({ kicker: 'K', headline: 'B' + i, take: 'T', source_name: 'S' }));
  await api.buildStudioManifest({}, '2026-07-09', 8, bare);
  const ins2 = sb.find(c => c.opts && c.opts.method === 'POST' && c.path === 'content_pieces').opts.body;
  ok([...new Set(ins2.filter(x => x.format !== 'the_six').map(x => x.payload.headline))].join('|') === 'B0|B1|B2', 'M beatless editions fall back to order');
  existing = [{ id: 1 }];
  ok((await api.buildStudioManifest({}, '2026-07-08', 7, items)).skipped === 'manifest-exists', 'M idempotent per day');

  ok((await api.studioManifest({}, {}, '', { id: 'nobody' })).error === 'forbidden', 'R manifest admin-gated');
  ok((await api.studioCutStory({ item_id: 5 }, {}, '', { id: 'nobody' })).error === 'forbidden', 'S2 cut-story admin-gated');
  sb.length = 0;
  const cutStubs = Object.assign({}, stubs, { sbRest: async (env, path, opts) => { sb.push({ path, opts });
    if (path.startsWith('edition_items?id=eq.5')) return [{ id: 5, edition_id: 2, kicker: 'K', headline: 'Left behind', take: 'T', source_name: 'S', beat: 'advertising' }];
    if (path.startsWith('editions?id=eq.2')) return [{ issue_no: 7, date: '2026-07-08' }];
    if (path.includes('payload->>headline')) return [];
    return []; } });
  const apiCut = new Function('json', 'sbRest', 'callerIsAdmin', 'callModel', 'logEvent',
    w.slice(w.indexOf('const STUDIO_VOICE'), w.lastIndexOf('/*', w.indexOf('SEAM:STUDYBOARD \u2014 the public study board'))) + '; return studioCutStory;')(
    stubs.json, cutStubs.sbRest, stubs.callerIsAdmin, stubs.callModel, stubs.logEvent);
  const cut = await apiCut({ item_id: 5 }, {}, '', { id: 'admin' });
  const cutIns = sb.find(c => c.opts && c.opts.method === 'POST' && c.path === 'content_pieces').opts.body;
  ok(cut.ok && cut.pieces === 3 && cut.beat === 'advertising', 'S2 cut lands the essential three on the right beat');
  ok(cutIns.map(x => x.format + ':' + x.platform).sort().join('|') === 'hand_meme:instagram|kinetic_take:tiktok|signal_still:instagram', 'S2 essential three: still, kinetic, meme');
  ok(cutIns.every(x => x.payload.story === 9 && x.payload.headline === 'Left behind'), 'S2 pieces carry the story they were cut from');
  ok((await api.studioUpdate({ id: 9, status: 'deployed' }, {}, '', { id: 'admin' })).error === 'empty_patch', 'R update cannot forge deployed status');
  sb.length = 0;
  const req = { url: 'https://x/studio/archive?id=9&ext=png', arrayBuffer: async () => new TextEncoder().encode('PNGBYTES').buffer };
  const env = { MEDIA: { put: async (k) => { sb.push({ r2: k }); } } };
  const arc = await api.studioArchive(req, env, '', { id: 'admin' });
  ok(arc.ok && arc.archive_key === 'studio/2026-07-08/9-signal_still.png', 'R archive lands in the dated ledger');
  const patch = sb.find(c => c.opts && c.opts.method === 'PATCH').opts.body;
  ok(patch.status === 'deployed' && patch.archive_key && patch.deployed_at, 'R deploy patch: status + key + timestamp');
}

/* ── G: the fabrication guard — the caption layer earns the receipts covenant ── */
{
  const a = w.indexOf('function studioGround');
  const b = w.indexOf('async function studioCaption');
  const g = new Function(w.slice(a, b) + '; return { studioGround, studioFabricated, studioSafeCaption };')();
  const item = { headline: 'EU boosts AI defense', take: 'The move lands as threats escalate.', kicker: 'ai tech', source_name: 'tportal', date: '2026-07-08' };
  const ground = g.studioGround(item);
  ok(g.studioFabricated('Announced on March 13, 2024, the plan lands.', ground) === 'year:2024', 'G invented year caught');
  ok(String(g.studioFabricated('The EU allocated \u20AC17 million to the effort.', ground)).startsWith('money:'), 'G invented figure caught');
  ok(g.studioFabricated('The move lands in 2026-07-08 fashion as threats escalate.', ground) === null, 'G grounded facts pass');
  const safe = g.studioSafeCaption('linkedin', item);
  ok(safe.includes('EU boosts AI defense') && safe.includes('Source: tportal') && g.studioFabricated(safe, ground) === null, 'G the safe floor can never fabricate');
}

/* ── GC: caption path retries once, then falls to the floor ── */
{
  const a = w.indexOf('const STUDIO_VOICE');
  const b = w.indexOf('async function buildStudioManifest');
  let calls = 0;
  const cap = await new Function('callModel',
    w.slice(a, b) + '; return studioCaption;')(
    async () => { calls++; return 'The EU allocated \u20AC17 million on March 13, 2024.'; })(
    {}, 'instagram', { headline: 'EU boosts AI defense', take: 'The move lands.', kicker: 'ai tech', source_name: 'tportal', date: '2026-07-08' });
  ok(calls === 2 && cap.includes('EU boosts AI defense') && !cap.includes('2024') && !cap.includes('17 million'), 'GC stubborn fabricator: one retry, then the floor');
}

/* ── T + Z: client pure halves, exact shipped code ── */
{
  const a = html.indexOf('var BRAND = { black');
  const b = html.indexOf('/* \u2500\u2500 the counter', a);
  const win = {};
  new Function('window', 'TextEncoder', html.slice(a, b))(win, TextEncoder);
  const f1 = win.STUDIO_TEMPLATES.signal_still({ issue_no: 7, date: '2026-07-08', kicker: 'ai tech', headline: 'EU boosts AI defense', take: 'The take.', source_name: 'tportal' });
  ok(f1.length === 1 && f1[0].w === 1080 && f1[0].h === 1350 && f1[0].ops[0].color === '#0A0A0A', 'T still: 1080x1350 on brand black');
  const reds = f1[0].ops.filter(o => o.color === '#C41230');
  ok(reds.length === 4 && reds.every(o => ['dot', 'text', 'rule'].includes(o.op)), 'T red reserved for the found thing (dot, kicker, take label, rule)');
  ok(f1[0].ops.some(o => o.op === 'wrap' && o.font === 'Syne' && o.weight === '800' && o.max === 5), 'T headline: Syne 800, five-line ceiling');
  ok(f1[0].ops.some(o => o.text === 'ISSUE 007'), 'T wire-room furniture: padded issue number');
  const slides8 = Array.from({ length: 8 }, (_, i) => ({ kicker: 'K', headline: 'H' + i, take: 'T', source_name: 'S' }));
  const f6 = win.STUDIO_TEMPLATES.the_six({ issue_no: 7, date: '2026-07-08', slides: slides8 }, 'instagram');
  ok(f6.length === 7 && f6.every(f => f.h === 1350), 'T six portrait: cover plus six at 1350');
  ok(f6[2].ops[0].color === '#F5F0E8', 'T paper inversion breaks the black rhythm (slide two)');
  const f6t = win.STUDIO_TEMPLATES.the_six({ issue_no: 7, date: '2026-07-08', slides: slides8 }, 'tiktok');
  ok(f6t.every(f => f.h === 1920) && f6t[1].ops.some(o => o.op === 'rule' && o.y > 1500), 'T six photo-mode: 1920 tall, receipt band shifted down');
  const mv = win.STUDIO_TEMPLATES.hand_meme({ mformat: 'verdict', line1: 'The finding', line2: 'The read', issue_no: 7 }, 'instagram');
  ok(mv[0].w === 1080 && mv[0].h === 1080 && mv[0].ops.some(o => o.text === 'THE HAND READS' && o.color === '#C41230'), 'T meme verdict: IG square, red hand-read tag');
  const ms = win.STUDIO_TEMPLATES.hand_meme({ mformat: 'vs', line1: 'S', line2: 'N', issue_no: 7 }, 'tiktok');
  ok(ms[0].h === 1920 && ms[0].ops.some(o => o.op === 'rect' && o.color === '#F5F0E8') && ms[0].ops.some(o => o.text === 'NOISE'), 'T meme vs: TT tall, cream noise block split');
  const allText = [].concat(f1[0].ops, mv[0].ops, ms[0].ops).filter(o => o.text).map(o => o.text).join(' ');
  ok(!/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(allText), 'T doctrine: no emoji anywhere in the ops');
  /* MO: motion program */
  const meas = (t, size) => String(t).length * size * 0.55;
  const lay = win.studioMotionLayout({ headline: 'EU boosts AI defense across the bloc', take: 'The take that lands and keeps landing on time.' }, meas);
  const prog = win.studioMotionProgram({ kicker: 'ai tech', headline: 'x', take: 'y', date: '2026-07-08', source_name: 'SRC' }, lay);
  ok(prog.w === 1080 && prog.h === 1920 && prog.fps === 30 && prog.total === 300, 'MO reel: 1080x1920, ten seconds flat');
  const hook = prog.at(12);
  ok(hook.some(o => o.text && o.text.includes('AI TECH')) && !hook.some(o => o.font === 'Syne'), 'MO hook: kicker alone inside 800ms');
  ok(prog.at(150).some(o => o.text === '\u2014 THE TAKE'), 'MO take lands mid-reel');
  ok(JSON.stringify(prog.at(246)) === JSON.stringify(prog.at(270)), 'MO the hold is a hold: 12+ identical frames');
  ok(prog.at(290).some(o => o.text === 'UNSURFACED\u2122 DAILY') && prog.at(290).length === 3, 'MO the out: black, dot, wordmark');
  /* P: LinkedIn-native PDF */
  const JPEG1 = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='), c => c.charCodeAt(0));
  const pdf = win.studioPdf([{ w: 1080, h: 1350, jpeg: JPEG1 }, { w: 1080, h: 1350, jpeg: JPEG1 }]);
  const head = new TextDecoder().decode(pdf.slice(0, 8));
  const tail = new TextDecoder().decode(pdf.slice(-5));
  ok(head.startsWith('%PDF-1.4') && tail === '%%EOF', 'P pdf container: header and EOF');
  fs.writeFileSync('/tmp/studio_test.pdf', pdf);
  const zip = win.studioZip([{ name: 'a.png', data: new Uint8Array([1, 2, 3]) }, { name: 'b.png', data: new Uint8Array([4, 5]) }]);
  ok(zip[0] === 0x50 && zip[1] === 0x4b && zip[2] === 3 && zip[3] === 4, 'Z local header magic');
  const eocd = zip.length - 22;
  ok(zip[eocd] === 0x50 && zip[eocd + 1] === 0x4b && zip[eocd + 3] === 6 && zip[eocd + 10] === 2, 'Z EOCD counts two entries');
  fs.writeFileSync('/tmp/studio_test.zip', zip);
}

/* ── U: wired DOM ── */
function world(opts) {
  const posts = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/intelligence/' + (opts.qs || ''), pretendToBeVisual: true,
    beforeParse(win) {
      if (opts.staff) win.localStorage.setItem('uai_staff', '1');
      win.fetch = async (url, o) => ({ ok: true, status: 200, json: async () =>
        String(url).includes('/whoami') ? { ok: true, admin: !!opts.admin } : { ok: true, rows: [], studies: [] }, text: async () => '{}' });
      win.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
      win.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
      win.scrollTo = () => {};
      win.HTMLCanvasElement.prototype.getContext = () => null;
      win.__posts = posts;
    },
  });
  return { dom, posts };
}
{ /* admin reveal + queue + kill */
  const { dom, posts } = world({ admin: true });
  await sleep(600);
  dom.window.api = async (action, payload) => {
    posts.push({ action, payload });
    if (action === 'whoami') return { ok: true, admin: true };
    if (action === 'studio/manifest') return { ok: true, pieces: [{ id: 1, day: '2026-07-08', lane: 'perishable', format: 'signal_still', platform: 'instagram', copy: { caption: 'The caption' }, payload: { headline: 'H' }, status: 'draft' }] };
    return { ok: true };
  };
  await sleep(2700);   // reveal loop retries on 2.5s cadence
  const d = dom.window.document;
  ok(d.getElementById('stOpen').hidden === false && d.getElementById('kbOpen').hidden === false, 'U one whoami reveals Studio and Feed together');
  ok(dom.window.localStorage.getItem('uai_staff') === '1', 'U device remembers the staff session');
  dom.window.openStudio(); await sleep(300);
  const card = d.querySelector('.st-card');
  ok(card && card.textContent.includes('SIGNAL STILL') && d.querySelector('[data-cap]').value === 'The caption', 'U queue renders piece + editable caption');
  d.querySelector('[data-kill]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await sleep(150);
  ok(posts.some(p => p.action === 'studio/update' && p.payload.status === 'killed'), 'U kill posts the verdict');
}
{ /* staff door + deep link */
  const { dom } = world({ staff: true, qs: '?studio=1' });
  await sleep(700);
  ok(!!dom.window.document.getElementById('lgStudio'), 'U staff device shows the gate door');
  ok(dom.window.sessionStorage.getItem('uai_pending_studio') === '1', 'U deep link stashes intent through sign-in');
}
{ /* civilian device: no door */
  const { dom } = world({});
  await sleep(600);
  ok(!dom.window.document.getElementById('lgStudio'), 'U civilian gate shows nothing');
}
console.log('\nSTUDIO PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
