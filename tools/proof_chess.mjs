/* ═════════════════════════════════════════════════════════════════════
   CABINET 05 · CHESS — THE ENGINE'S TRIAL
   Perft gold standard + rule-law assertions. Run: node tools/proof_chess.mjs
   ═════════════════════════════════════════════════════════════════════ */
import { ChessCore } from '../arcade/chess/core.js';

let n = 0, bad = 0;
function ok(cond, label) {
  n++;
  if (cond) console.log('  ok ' + label);
  else { bad++; console.error('  FAIL ' + label); }
}

/* ── PERFT: the gold standard ─────────────────────────────────────── */
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const SUITE = [
  ['startpos', START, [[1, 20], [2, 400], [3, 8902], [4, 197281]]],
  ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    [[1, 48], [2, 2039], [3, 97862]]],
  ['position3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    [[1, 14], [2, 191], [3, 2812], [4, 43238]]],
  ['position4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    [[1, 6], [2, 264], [3, 9467]]],
  ['position5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    [[1, 44], [2, 1486], [3, 62379]]],
  ['position6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    [[1, 46], [2, 2079], [3, 89890]]],
];
console.log('PERFT — node counts vs canon:');
for (const [name, fen, depths] of SUITE) {
  const c = ChessCore(fen);
  for (const [d, want] of depths) {
    const t0 = Date.now();
    const got = c.perft(d);
    ok(got === want, `perft ${name} d${d}: ${got} (want ${want}) [${Date.now() - t0}ms]`);
  }
}

/* ── rule laws ────────────────────────────────────────────────────── */
{
  const c = ChessCore();
  const e2 = c.moves('e2').map((m) => m.to).sort().join(',');
  ok(e2 === 'e3,e4', `pawn opening: e2 -> {${e2}}`);
  ok(Object.keys(c.board()).length === 32 && c.board()['e1'] === 'K', 'board map: 32 pieces, K on e1');
}
{
  const c = ChessCore('4k3/8/8/8/8/8/5r2/4K2R w K - 0 1');
  ok(!c.moves('e1').some((m) => m.to === 'g1'), 'castling through check refused (rook eyes f1)');
}
{
  const c = ChessCore('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const k = c.moves('e1').map((m) => m.to);
  ok(k.includes('g1') && k.includes('c1'), 'both castles offered with clear, safe paths');
  const mv = c.move({ from: 'e1', to: 'c1' });
  ok(mv && mv.flags === 'q' && c.board()['d1'] === 'R' && !c.board()['a1'], 'queenside castle carries the rook to d1');
}
{
  const c = ChessCore('4k3/8/8/8/5p2/8/4P3/4K3 w - - 0 1');
  c.move({ from: 'e2', to: 'e4' });
  const ep = c.moves('f4').find((m) => m.flags === 'ep');
  ok(ep && ep.to === 'e3', 'en passant window opens on the double push');
  c.move({ from: 'f4', to: 'e3' });
  ok(!c.board()['e4'] && c.board()['e3'] === 'p', 'en passant capture removes the passed pawn');
}
{
  const c = ChessCore('4k3/8/8/8/5p2/8/4P3/4K3 w - - 0 1');
  c.move({ from: 'e2', to: 'e4' });
  c.move({ from: 'e8', to: 'd8' });
  c.move({ from: 'e1', to: 'd1' });
  ok(!c.moves('f4').some((m) => m.flags === 'ep'), 'en passant window expires after one ply');
}
{
  const c = ChessCore('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  ok(c.moves('a7').length === 4, 'promotion offers all four pieces');
  c.move({ from: 'a7', to: 'a8' });
  ok(c.board()['a8'] === 'Q', 'unspecified promotion crowns a queen');
  const c2 = ChessCore('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  c2.move({ from: 'a7', to: 'a8', promo: 'n' });
  ok(c2.board()['a8'] === 'N', 'underpromotion honored (knight)');
}
{
  const c = ChessCore('4r3/8/8/8/8/8/4B3/4K3 w - - 0 1');
  ok(c.moves('e2').length === 0, 'absolute pin: the bishop cannot leave the file');
}
{
  const c = ChessCore();
  c.move({ from: 'f2', to: 'f3' });
  c.move({ from: 'e7', to: 'e5' });
  c.move({ from: 'g2', to: 'g4' });
  const mate = c.move({ from: 'd8', to: 'h4' });
  ok(mate && mate.check === true, "fool's mate: the queen gives check");
  ok(mate.over && mate.over.result === '0-1' && mate.over.reason === 'checkmate', "fool's mate: checkmate declared, 0-1");
}
{
  const c = ChessCore('7k/8/6Q1/8/8/8/8/K7 b - - 0 1');
  const r = c.result();
  ok(r && r.result === '1/2-1/2' && r.reason === 'stalemate', 'stalemate: no moves, no check, half point');
}
{
  const c = ChessCore('4k3/8/8/8/8/8/8/R3K3 w Q - 99 80');
  c.move({ from: 'a1', to: 'a2' });
  const r = c.result();
  ok(r && r.reason === 'fifty-move', 'fifty-move clock strikes at 100 halfmoves');
}
{
  const c = ChessCore();
  for (const [f, t] of [['g1','f3'],['g8','f6'],['f3','g1'],['f6','g8'],['g1','f3'],['g8','f6'],['f3','g1']]) c.move({ from: f, to: t });
  const last = c.move({ from: 'f6', to: 'g8' });
  ok(last.over && last.over.reason === 'threefold', 'threefold repetition: the knights confess');
}
{
  ok(ChessCore('4k3/8/8/8/8/8/8/4K3 w - - 0 1').result()?.reason === 'insufficient', 'insufficient: K vs K');
  ok(ChessCore('4k3/8/8/8/8/8/8/4KB2 w - - 0 1').result()?.reason === 'insufficient', 'insufficient: K+B vs K');
  ok(ChessCore('4k3/8/8/8/8/8/8/4KN2 w - - 0 1').result()?.reason === 'insufficient', 'insufficient: K+N vs K');
  ok(ChessCore('4k3/8/8/8/8/4b3/8/2B1K3 w - - 0 1').result()?.reason === 'insufficient', 'insufficient: same-shade bishops');
  ok(ChessCore('4k3/8/8/8/8/3b4/8/2B1K3 w - - 0 1').result() === null, 'opposite-shade bishops: the game lives');
}
{
  const KIWI = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  ok(ChessCore(KIWI).fen() === KIWI, 'fen round-trip: kiwipete survives intact');
}
{
  const c = ChessCore();
  c.move({ from: 'e2', to: 'e4' });
  c.undo();
  ok(c.fen() === START, 'undo restores the exact position');
  const before = c.fen();
  ok(c.move({ from: 'e2', to: 'e5' }) === null && c.fen() === before, 'illegal move refused, state untouched');
}

console.log('');
if (bad) { console.error(`CHESS PROOF: ${bad} of ${n} FAILED`); process.exit(1); }
console.log(`CHESS PROOF: ${n}/${n} assertions PASS`);
