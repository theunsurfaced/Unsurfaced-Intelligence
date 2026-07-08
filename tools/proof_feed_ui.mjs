/**
 * proof_feed_ui.mjs — wired-DOM proof for the FEED panel (needs: npm i jsdom).
 * Drives the real intelligence/index.html in jsdom across four worlds:
 *   A  admin           -> button revealed, panel opens, submit posts, status LIVE
 *   B  non-admin       -> button stays hidden, reveal loop stops asking
 *   C  stale worker    -> button hidden; (panel state proven in D)
 *   D  stale worker UI -> submit reports WORKER STALE, not a fake admin error
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
const html = fs.readFileSync('intelligence/index.html', 'utf-8');
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function world(behave) {
  const fetches = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/intelligence/', pretendToBeVisual: true,
    beforeParse(w) {
      w.fetch = async (url, opts) => {
        const u = String(url); fetches.push({ u, m: (opts && opts.method) || 'GET' });
        const r = behave(u);
        return { ok: r.status === 200, status: r.status,
          json: async () => { if (r.status !== 200) throw new Error('nojson'); return r.body; },
          text: async () => JSON.stringify(r.body || {}) };
      };
      w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      w.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
      w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
      w.scrollTo = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => null;
    },
  });
  return { dom, fetches };
}
const okRoute = (u, body) => ({ status: 200, body });

/* A: admin world */
{
  const { dom, fetches } = world(u =>
    u.includes('/whoami') ? okRoute(u, { ok: true, admin: true }) :
    u.includes('/knowledge/list') ? okRoute(u, { ok: true, rows: [] }) :
    u.includes('/knowledge/submit') ? okRoute(u, { ok: true, added: 3 }) :
    okRoute(u, { ok: true }));
  await sleep(700);
  const d = dom.window.document, btn = d.getElementById('kbOpen');
  ok(btn && btn.hidden === false, 'A whoami reveals the button for admins');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(250);
  const wrap = d.getElementById('kbwrap');
  ok(wrap && wrap.classList.contains('on'), 'A click raises the panel');
  d.getElementById('kbText').value = 'note';
  d.getElementById('kbGo').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(250);
  ok(d.getElementById('kbStatus').textContent.includes('LIVE \u2014 3 chunks'), 'A submit reports LIVE with chunk count');
  ok(fetches.some(f => f.u.includes('/knowledge/submit') && f.m === 'POST'), 'A submit posted to the doorway');
}

/* B: non-admin world */
{
  const { dom, fetches } = world(u =>
    u.includes('/whoami') ? okRoute(u, { ok: true, admin: false }) : okRoute(u, { ok: true, rows: [] }));
  await sleep(700);
  const btn = dom.window.document.getElementById('kbOpen');
  ok(btn && btn.hidden === true, 'B non-admin: button stays hidden');
  const n = fetches.filter(f => f.u.includes('/whoami')).length;
  await sleep(2800);
  ok(fetches.filter(f => f.u.includes('/whoami')).length === n, 'B confirmed non-admin: reveal loop stops asking');
}

/* C+D: stale-worker world (all api routes 404) */
{
  const { dom } = world(u => ({ status: 404, body: {} }));
  await sleep(700);
  const d = dom.window.document;
  ok(d.getElementById('kbOpen').hidden === true, 'C stale worker: button not revealed');
  ok(typeof dom.window.__kbErr === 'function' &&
     dom.window.__kbErr('Proxy knowledge/submit failed: 404').includes('WORKER STALE'), 'D 404 speaks WORKER STALE, not a fake admin error');
  ok(dom.window.__kbErr('Proxy knowledge/submit failed: 403').includes('ADMIN ONLY'), 'D 403 speaks ADMIN ONLY');
}

console.log('\nFEED UI PROOF: ' + pass + '/' + pass + ' assertions PASS');

process.exit(0);
