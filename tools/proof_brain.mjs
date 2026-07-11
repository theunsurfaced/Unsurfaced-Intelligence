/* ═════════════════════════════════════════════════════════════════════
   CABINET 05 · CHESS — THE BRAIN'S TRIAL
   Tactical law + determinism + tier spec + self-play smoke.
   Mates are verified by an INDEPENDENT exhaustive solver over the core's
   public API — the brain is never trusted about its own genius.
   Run: node tools/proof_brain.mjs
   ═════════════════════════════════════════════════════════════════════ */
import { ChessCore } from '../arcade/chess/core.js';
import { ChessBrain, BRAIN_TIERS } from '../arcade/chess/brain.js';

let n = 0, bad = 0;
function ok(cond, label) {
  n++;
  if (cond) console.log('  ok ' + label);
  else { bad++; console.error('  FAIL ' + label); }
}

/* ── independent forced-mate solver (exhaustive, public API only) ──── */
function forcesMate(c, plies) {
  /* side to move can force checkmate within `plies` plies */
  if (plies <= 0) return false;
  for (const m of c.moves()) {
    const r = c.move(m);
    if (r.over && r.over.reason === 'checkmate') { c.undo(); return true; }
    if (!r.over && plies >= 3 && cannotEscape(c, plies)) { c.undo(); return true; }
    c.undo();
  }
  return false;
}
function cannotEscape(c, plies) {
  /* opponent to move: EVERY reply must still lose to forced mate */
  for (const m of c.moves()) {
    const r = c.move(m);
    const escaped = r.over ? true : !forcesMate(c, plies - 2);
    c.undo();
    if (escaped) return false;
  }
  return true;
}
function matingFirstMoves(c, plies) {
  const out = [];
  for (const m of c.moves()) {
    const r = c.move(m);
    const wins = (r.over && r.over.reason === 'checkmate') ||
                 (!r.over && plies >= 3 && cannotEscape(c, plies));
    c.undo();
    if (wins) out.push(m.from + m.to + (m.promo || ''));
  }
  return out;
}

/* ── 1 · MATE IN ONE ──────────────────────────────────────────────── */
console.log('MATE IN ONE — the brain must land the blow:');
{
  const fen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1';   /* back rank, white */
  const c = ChessCore(fen);
  ok(forcesMate(c, 1), 'solver confirms back-rank position is mate-in-1 (white)');
  const t = ChessBrain(c, { tier: 'T2', seed: 7 }).think();
  const r = c.move(t.move);
  ok(r && r.over && r.over.reason === 'checkmate' && r.over.result === '1-0',
     'T2 delivers back-rank mate: ' + t.move.from + t.move.to);
}
{
  const fen = 'r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1';   /* back rank, black */
  const c = ChessCore(fen);
  ok(forcesMate(c, 1), 'solver confirms back-rank position is mate-in-1 (black)');
  const t = ChessBrain(c, { tier: 'T2', seed: 7 }).think();
  const r = c.move(t.move);
  ok(r && r.over && r.over.reason === 'checkmate' && r.over.result === '0-1',
     'T2 delivers back-rank mate as black: ' + t.move.from + t.move.to);
}
{
  /* scholar's mate table — full board, real opening */
  const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
  const c = ChessCore(fen);
  ok(forcesMate(c, 1), "solver confirms scholar's position is mate-in-1");
  const t = ChessBrain(c, { tier: 'T3', seed: 1 }).think();
  const r = c.move(t.move);
  ok(r && r.over && r.over.reason === 'checkmate',
     "T3 finds the scholar's mate on a full board: " + t.move.from + t.move.to);
  ok(t.mate === 1, 'T3 reports mate-in-1 in its score (mate=' + t.mate + ')');
}

/* ── 2 · MATE IN TWO ──────────────────────────────────────────────── */
console.log('MATE IN TWO — the ladder closes:');
{
  const fen = '7k/8/8/8/8/8/R7/1R4K1 w - - 0 1';        /* two-rook ladder */
  const c = ChessCore(fen);
  const winning = matingFirstMoves(c, 3);
  ok(winning.length > 0, 'solver confirms ladder position is mate-in-2 (keys: ' + winning.join(',') + ')');
  const t = ChessBrain(c, { tier: 'T3', seed: 1 }).think();
  const key = t.move.from + t.move.to + (t.move.promo || '');
  ok(winning.includes(key), 'T3 first move preserves the forced mate: ' + key);
  ok(t.mate !== null && t.mate <= 2, 'T3 announces the mate (mate=' + t.mate + ')');
}

/* ── 3 · MATERIAL SANITY ──────────────────────────────────────────── */
console.log('MATERIAL LAW — take what hangs, keep what matters:');
{
  const fen = 'k7/8/8/3q4/8/8/3R4/K7 w - - 0 1';        /* queen hangs on d5 */
  const c = ChessCore(fen);
  const t = ChessBrain(c, { tier: 'T2', seed: 3 }).think();
  ok(t.move.from === 'd2' && t.move.to === 'd5', 'T2 captures the hanging queen: ' + t.move.from + t.move.to);
}
{
  const fen = 'k2r4/8/8/3p4/8/8/3Q4/K7 w - - 0 1';      /* poisoned pawn: Qxd5?? Rxd5 */
  const c = ChessCore(fen);
  const t = ChessBrain(c, { tier: 'T2', seed: 3 }).think();
  ok(!(t.move.from === 'd2' && t.move.to === 'd5'), 'T2 refuses the poisoned pawn (played ' + t.move.from + t.move.to + ')');
}

/* ── 4 · DETERMINISM — house law ──────────────────────────────────── */
console.log('DETERMINISM — same position, tier, seed → same move:');
{
  const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
  const a = ChessBrain(ChessCore(fen), { tier: 'T2', seed: 42 }).think();
  const b = ChessBrain(ChessCore(fen), { tier: 'T2', seed: 42 }).think();
  ok(a.move.from === b.move.from && a.move.to === b.move.to && a.nodes === b.nodes,
     'T2 reproducible: ' + a.move.from + a.move.to + ' (' + a.nodes + ' nodes) twice');
  const c1 = ChessBrain(ChessCore(fen), { tier: 'T1', seed: 99 }).think();
  const c2 = ChessBrain(ChessCore(fen), { tier: 'T1', seed: 99 }).think();
  ok(c1.move.from === c2.move.from && c1.move.to === c2.move.to,
     'T1 (noisy tier) reproducible under a fixed seed: ' + c1.move.from + c1.move.to);
}

/* ── 5 · TIER SPEC — the dials KEYSMITH will price ────────────────── */
console.log('TIER SPEC — the dials hold their settings:');
{
  ok(BRAIN_TIERS.T1.depth < BRAIN_TIERS.T2.depth && BRAIN_TIERS.T2.depth < BRAIN_TIERS.T3.depth,
     'depth ladder ascends T1 < T2 < T3');
  ok(BRAIN_TIERS.T1.noise > BRAIN_TIERS.T2.noise && BRAIN_TIERS.T3.noise === 0,
     'noise ladder descends to zero at T3');
  const c = ChessCore();
  const t = ChessBrain(c, { tier: 'T3', seed: 1 }).think();
  ok(t.nodes <= BRAIN_TIERS.T3.nodeCap, 'node budget respected from startpos (' + t.nodes + ' ≤ cap)');
  ok(t.depth >= 1 && t.tierName === 'MASTER', 'reports completed depth (' + t.depth + ') and tier name');
  let threw = false;
  try { ChessBrain(ChessCore(), { tier: 'T9' }); } catch (e) { threw = true; }
  ok(threw, 'unknown tier refused loudly');
}

/* ── 6 · GAME-OVER GRACE ──────────────────────────────────────────── */
console.log('GAME OVER — the brain declines a finished board:');
{
  const c = ChessCore();
  c.move({ from: 'f2', to: 'f3' }); c.move({ from: 'e7', to: 'e5' });
  c.move({ from: 'g2', to: 'g4' }); c.move({ from: 'd8', to: 'h4' });   /* fool's mate */
  ok(ChessBrain(c, { tier: 'T2', seed: 1 }).think() === null, 'think() → null after checkmate');
}

/* ── 7 · SELF-PLAY SMOKE — T1 vs T1 to a verdict ──────────────────── */
console.log('SELF-PLAY SMOKE — T1 vs T1, every move legal, verdict legal:');
{
  const c = ChessCore();
  const white = ChessBrain(c, { tier: 'T1', seed: 11 });
  const black = ChessBrain(c, { tier: 'T1', seed: 22 });
  let plies = 0, over = null, illegal = 0;
  const CAP = 300;
  while (plies < CAP) {
    const mover = c.turn() === 'w' ? white : black;
    const t = mover.think();
    if (!t) break;
    const legalKeys = c.moves().map((m) => m.from + m.to + (m.promo || ''));
    if (!legalKeys.includes(t.move.from + t.move.to + (t.move.promo || ''))) { illegal++; break; }
    const r = c.move(t.move);
    plies++;
    if (r.over) { over = r.over; break; }
  }
  ok(illegal === 0, 'zero illegal moves across ' + plies + ' plies');
  const reasons = ['checkmate', 'stalemate', 'fifty-move', 'threefold', 'insufficient'];
  ok(over ? reasons.includes(over.reason) : plies === CAP,
     'game concluded lawfully: ' + (over ? over.result + ' by ' + over.reason : 'ply cap at ' + CAP) +
     ' after ' + plies + ' plies');
  ok(c.fen().split(' ').length === 6, 'final FEN intact: ' + c.fen());
}

console.log('');
if (bad) { console.error('BRAIN PROOF: ' + (n - bad) + '/' + n + ' — FAILURES PRESENT'); process.exit(1); }
console.log('BRAIN PROOF: ' + n + '/' + n + ' assertions PASS');
