/**
 * proof_studyboard.mjs — SEAM:STUDYBOARD, both halves.
 * Server half: exact shipped route with a capturing sbRest stub.
 * UI half (needs: npm i jsdom): the real page — door order, gate button,
 * signed-out vs signed-in labels, pending-study bridge, css in real head.
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ── server half ── */
{
  const w = fs.readFileSync('worker/src/index.js', 'utf-8');
  const a = w.indexOf('async function mineStudiesPublic');
  const b = w.indexOf('\n}', a) + 2;
  const calls = [];
  const fn = new Function('json', 'sbRest', w.slice(a, b) + '; return mineStudiesPublic;')(
    (o) => o, async (env, path) => { calls.push(path); return [{ id: 's1', title: 'T', goal: 'G', type: 'survey', pay_cents: 1500, partner_id: 'LEAK' }]; });
  const out = await fn({}, '');
  ok(calls[0].includes('status=eq.live') && calls[0].includes('audience=eq.open') && calls[0].includes('public_listing=eq.true'), 'S route enforces all three locks server-side');
  ok(calls[0].includes('select=id,title,goal,type,pay_cents,created_at') && !calls[0].includes('partner_id'), 'S safe fields only requested');
  ok(out.ok && out.studies.length === 1, 'S rows flow through');
}

/* ── UI half ── */
const html = fs.readFileSync('intelligence/index.html', 'utf-8');
{
  const hc = html.indexOf('</head>');
  ok(html.indexOf('.sbwrap{position:fixed') > 0 && html.indexOf('.sbwrap{position:fixed') < hc, 'U board css lives in the real head');
  const doors = html.indexOf('class="uai-doors2"');
  const first = html.indexOf('uai-door2', doors);
  ok(html.indexOf('Review existing studies', first) - first < 200, 'U review card is the FIRST door');
}
function world() {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/intelligence/', pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = async (url) => ({ ok: true, status: 200, json: async () =>
        String(url).includes('/mine/studies')
          ? { ok: true, studies: [{ id: 'st1', title: 'Spring campaign react', goal: 'How the drop lands', type: 'video', pay_cents: 1200 }] }
          : { ok: true, rows: [] }, text: async () => '{}' });
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      w.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
      w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
      w.scrollTo = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => null;
    },
  });
  return dom;
}
{ /* signed-out */
  const dom = world(); await sleep(600);
  const d = dom.window.document;
  ok(!!d.querySelector('.lg-browse'), 'U gate carries the Open studies button');
  await dom.window.openStudyBoard(); await sleep(250);
  const card = d.querySelector('.sb-card');
  ok(card && card.textContent.includes('Spring campaign react') && card.textContent.includes('$12'), 'U shelf renders title + reward');
  const btn = d.querySelector('[data-take]');
  ok(btn && btn.textContent.includes('Sign up to take'), 'U signed-out button offers sign-up');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); await sleep(100);
  ok(dom.window.sessionStorage.getItem('mine_pending_study') === 'st1', 'U take intent survives to sessionStorage');
}
{ /* signed-in */
  const dom = world(); await sleep(600);
  dom.window._authHeader = async () => ({ Authorization: 'Bearer t' });
  await dom.window.openStudyBoard(); await sleep(250);
  const btn = dom.window.document.querySelector('[data-take]');
  ok(btn && btn.textContent.includes('Take this study'), 'U signed-in button takes directly');
}
console.log('\nSTUDYBOARD PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
