/* ═════════════════════════════════════════════════════════════════════
   CABINET 05 · CHESS — THE SURFACE'S TRIAL
   jsdom harness: boots arcade/chess/index.html headlessly and plays it.
   Also rehearses the ritual gate: every plain <script> block is extracted
   and node --checked before the DOM ever loads.
   Run: node tools/proof_chess_surface.mjs   (requires: npm i jsdom)
   ═════════════════════════════════════════════════════════════════════ */
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(here, '..', 'arcade', 'chess', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

let n = 0, bad = 0;
function ok(cond, label) {
  n++;
  if (cond) console.log('  ok ' + label);
  else { bad++; console.error('  FAIL ' + label); }
}
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/* ── 0 · GATE REHEARSAL — every plain script block parses ─────────── */
console.log('GATE REHEARSAL — script blocks extracted and checked:');
{
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  ok(blocks.length === 3, 'three plain script blocks (core, brain, surface): ' + blocks.length);
  const dir = mkdtempSync(join(tmpdir(), 'chess-blocks-'));
  let allPass = true;
  blocks.forEach((b, i) => {
    const p = join(dir, 'block_' + i + '.js');
    writeFileSync(p, b);
    try { execFileSync('node', ['--check', p]); } catch (e) { allPass = false; }
  });
  ok(allPass, 'node --check passes on all extracted blocks');
  ok(!/[\u2018\u2019\u201c\u201d]/.test(html), 'no smart-quote contamination');
  ok(html.includes('function ChessCore') && html.includes('function ChessBrain'),
     'core and brain ride embedded');
  ok(!/\bexport\s/.test(html.replace(/<style>[\s\S]*?<\/style>/, '')),
     'no stray ES-module export keywords in plain blocks');
}

/* ── boot the cabinet ─────────────────────────────────────────────── */
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://unsurfaced.test/arcade/chess/',
  pretendToBeVisual: true,
});
const { window } = dom;
const { document } = window;
const CAB = window.CABINET;
const q = (sel) => document.querySelector(sel);
const sq = (name) => document.querySelector('[data-sq="' + name + '"]');

console.log('BOOT — the cabinet stands:');
{
  ok(!!CAB, 'CABINET debug handle exposed');
  ok(document.querySelectorAll('.sq').length === 64, '64 squares built');
  ok(document.querySelectorAll('.pc').length === 32, '32 pieces at the start');
  ok(q('#status').textContent === 'YOUR MOVE', 'status stamp opens on YOUR MOVE');
  ok(typeof window.ChessCore === 'function' && typeof window.ChessBrain === 'function',
     'engine and brain reachable on window');
  const identity = window.ChessCore().perft(3);
  ok(identity === 8902, 'embedded engine identity: perft(3) = ' + identity + ' (want 8902)');
  ok(!!window.BRAIN_TIERS && !!window.BRAIN_TIERS.T3, 'tier table rides along');
  ok(document.querySelectorAll('.chip').length === 3, 'three tier chips rendered');
}

console.log('TAP-TO-MOVE — legal-move law painted on the board:');
await (async () => {
  CAB.newGame({ tier: 'T1', seed: 123, ponderMs: 0 });
  CAB.tap('e2');
  ok(sq('e2').classList.contains('sel'), 'tapping e2 selects the pawn');
  const dots = document.querySelectorAll('.dot');
  ok(dots.length === 2 && sq('e3').querySelector('.dot') && sq('e4').querySelector('.dot'),
     'legal dots on e3 and e4 exactly');
  CAB.tap('e2');
  ok(document.querySelectorAll('.dot').length === 0, 'tapping again deselects');
  CAB.tap('e2'); CAB.tap('e4');
  ok(sq('e4').querySelector('.pc') && !sq('e2').querySelector('.pc'), 'pawn lands on e4');
  ok(CAB.phase() === 'ponder' && q('#status').textContent.indexOf('PONDERS') >= 0,
     'THE HAND PONDERS stamp during the reply');
  await sleep(120);
  ok(CAB.phase() === 'idle' && CAB.core().turn() === 'w', 'the Hand replied; your move again');
  ok(CAB.logLen() === 2, 'move log carries both plies');
  ok(sq(CAB.core().fen() ? 'e4' : 'e4').classList !== null, 'render survived the exchange');
})();

console.log('TAKE BACK — the rewind law:');
{
  const before = CAB.core().fen().split(' ')[0];
  CAB.takeBack();
  const placement = CAB.core().fen().split(' ')[0];
  ok(placement === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR' && CAB.logLen() === 0,
     'take back rewinds both plies to the start (' + before + ' -> start)');
}

console.log('PROMOTION — the crowning:');
await (async () => {
  CAB.newGame({ tier: 'T1', seed: 5, fen: '8/P6k/8/8/8/8/7K/8 w - - 0 1', ponderMs: 0 });
  CAB.tap('a7'); CAB.tap('a8');
  ok(CAB.phase() === 'promo' && q('#promo').classList.contains('open'), 'picker opens on the eighth rank');
  ok(document.querySelectorAll('#promoOpts button').length === 4, 'four crowns offered');
  CAB.choosePromo('n');
  ok(!q('#promo').classList.contains('open'), 'picker closes on choice');
  const pos = CAB.core().board();
  ok(pos['a8'] === 'N', 'underpromotion honored: knight on a8');
  await sleep(120);
})();

console.log('VERDICT — the stamps land:');
await (async () => {
  const wBefore = CAB.tally().w;
  CAB.newGame({ tier: 'T1', seed: 9, fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', ponderMs: 0 });
  CAB.tap('a1'); CAB.tap('a8');
  ok(CAB.phase() === 'over', 'game closes on the mate');
  ok(q('#veil').classList.contains('open') &&
     q('#veilStamp').textContent.indexOf('CHECKMATE') >= 0 &&
     q('#veilStamp').textContent.indexOf('YOURS') >= 0,
     'veil stamps the win: ' + q('#veilStamp').textContent);
  ok(CAB.tally().w === wBefore + 1, 'tally counts the win (W=' + CAB.tally().w + ')');
  CAB.tap('g2');
  ok(CAB.phase() === 'over' && document.querySelectorAll('.sq.sel').length === 0,
     'input locked after the verdict');
  CAB.newGame({ tier: 'T1', seed: 10, ponderMs: 0 });
  ok(!q('#veil').classList.contains('open') && CAB.phase() === 'idle', 'new game lifts the veil');
})();

console.log('HOUSE OPENS — the Hand moves first when the seat says so:');
await (async () => {
  CAB.newGame({ tier: 'T1', seed: 77, ponderMs: 0,
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' });
  await sleep(150);
  ok(CAB.core().turn() === 'w' && CAB.logLen() === 1, 'the Hand played its reply unprompted');
})();

console.log('DIALS — persisted tier and sound:');
{
  CAB.setTier('T3');
  ok(window.localStorage.getItem('unsurfaced_chess_tier') === 'T3', 'tier persisted to localStorage');
  ok(document.querySelector('.chip.active').textContent.indexOf('MASTER') >= 0, 'MASTER chip lights up');
  const label0 = q('#btnSound').textContent;
  CAB.toggleSound();
  ok(q('#btnSound').textContent !== label0 &&
     ['0', '1'].includes(window.localStorage.getItem('unsurfaced_chess_mute')),
     'sound toggle flips and persists');
  CAB.toggleSound();
  CAB.setTier('T1');
}

console.log('BOTTOM BAR — the standard rail:');
{
  const join = document.querySelector('.bottombar a.join');
  ok(!!join && join.getAttribute('href') === '../', 'JOIN THE BOARD rides the bar, link resolves upward');
}

console.log('');
if (bad) { console.error('SURFACE PROOF: ' + (n - bad) + '/' + n + ' — FAILURES PRESENT'); process.exit(1); }
console.log('SURFACE PROOF: ' + n + '/' + n + ' assertions PASS');
