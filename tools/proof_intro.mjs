/**
 * proof_intro.mjs — SEAM:INTRO (needs: npm i jsdom).
 *   F  the tape: exists, faststart (moov before mdat), poster present
 *   B  the boot: video wired for autoplay-muted-inline, skip + sound present
 *   E  exits: ended dissolves, skip dissolves, error dissolves, ESC dissolves
 *   W  the watchdog: a tape that never arms opens the floor anyway
 *   A  accessibility: reduced-motion never sees the sequence
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
let pass = 0; const ok = (c, l) => { if (!c) { console.error('FAIL:', l); process.exit(1); } pass++; console.log('  ok', l); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const html = fs.readFileSync('arcade/index.html', 'utf-8');

/* F */
{
  const st = fs.statSync('arcade/intro.mp4');
  ok(st.size > 100000 && st.size < 5000000, 'F the tape exists at sane weight');
  const head = fs.readFileSync('arcade/intro.mp4').subarray(0, 8192);
  const moov = head.indexOf('moov'), mdat = head.indexOf('mdat');
  ok(moov > -1 && (mdat === -1 || moov < mdat), 'F faststart: moov leads');
  ok(fs.statSync('arcade/intro-poster.jpg').size > 5000, 'F poster frame present');
}
function world(opts) {
  opts = opts || {};
  return new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://unsurfaced-intelligence.com/arcade/', pretendToBeVisual: true,
    beforeParse(win) {
      win.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, top: [], you: null, season: 'x' }) });
      win.matchMedia = (q) => ({ matches: !!(opts.reduced && String(q).includes('reduced')), addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    },
  });
}
/* B */
{
  const dom = world(); await sleep(300);
  const d = dom.window.document;
  const v = d.getElementById('introVid');
  ok(!!d.getElementById('introwrap') && !!v, 'B the boot overlay stands');
  ok(v.hasAttribute('autoplay') && v.hasAttribute('muted') && v.hasAttribute('playsinline') && v.getAttribute('poster') === 'intro-poster.jpg', 'B autoplay-muted-inline with poster');
  ok(d.querySelector('#introVid source').getAttribute('src') === 'intro.mp4', 'B the tape is the source');
  ok(!!d.getElementById('introSkip') && !!d.getElementById('introSnd'), 'B skip and sound stand ready');
  ok(d.body.style.overflow === 'hidden', 'B the floor waits behind the curtain');
}
/* E */
{
  const dom = world(); await sleep(200);
  const d = dom.window.document;
  d.getElementById('introVid').dispatchEvent(new dom.window.Event('ended'));
  await sleep(800);
  ok(!d.getElementById('introwrap') && d.body.style.overflow === '', 'E ended: dissolve, floor open');
}
{
  const dom = world(); await sleep(200);
  const d = dom.window.document;
  d.getElementById('introSkip').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await sleep(800);
  ok(!d.getElementById('introwrap'), 'E skip: instant out');
}
{
  const dom = world(); await sleep(200);
  const d = dom.window.document;
  d.getElementById('introVid').dispatchEvent(new dom.window.Event('error'));
  await sleep(800);
  ok(!d.getElementById('introwrap'), 'E a broken tape never traps');
}
{
  const dom = world(); await sleep(200);
  dom.window.document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(800);
  ok(!dom.window.document.getElementById('introwrap'), 'E escape works like it should');
}
{
  const dom = world(); await sleep(200);
  const d = dom.window.document, v = d.getElementById('introVid');
  let plays = 0;
  v.play = function () { plays++; return Promise.resolve(); };
  v.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  ok(plays >= 1, 'E a denied autoplay recovers on tap');
}
/* W */
{
  const dom = world(); await sleep(5200);
  ok(!dom.window.document.getElementById('introwrap'), 'W the watchdog opens the floor at 4s');
}
/* A */
{
  const dom = world({ reduced: true }); await sleep(900);
  const d = dom.window.document;
  ok(!d.getElementById('introwrap') && d.body.style.overflow === '', 'A reduced-motion never sees the sequence');
}
console.log('\nINTRO PROOF: ' + pass + '/' + pass + ' assertions PASS');
process.exit(0);
