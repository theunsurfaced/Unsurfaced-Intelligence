/* ═════════════════════════════════════════════════════════════════════
   UNSURFACED — CABINET 05 · CHESS — THE HAND'S BRAIN
   Deterministic search + evaluation. No DOM, no Date, no Math.random.
   Given (position, tier, seed) the move is law: same inputs, same move.
   negamax + alpha-beta · iterative deepening · MVV-LVA + killers ·
   quiescence on captures · material + piece-square tables + tempo.
   Tiers T1/T2/T3 — KEYSMITH prices these; the DAILY model-pool named them.
   ═════════════════════════════════════════════════════════════════════ */

export const BRAIN_TIERS = {
  T1: { name: 'APPRENTICE',  depth: 2, qdepth: 2,  noise: 60, nodeCap: 30000 },
  T2: { name: 'JOURNEYMAN',  depth: 4, qdepth: 6,  noise: 12, nodeCap: 250000 },
  T3: { name: 'MASTER',      depth: 6, qdepth: 10, noise: 0,  nodeCap: 500000 },
};

const MATE = 100000;
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

/* Piece-square tables (simplified-eval canon), written a8-first (visual).
   White index: (7 - rank) * 8 + file · Black index: rank * 8 + file. */
const PST = {
  p: [
      0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
      5,  5, 10, 25, 25, 10,  5,  5,
      0,  0,  0, 20, 20,  0,  0,  0,
      5, -5,-10,  0,  0,-10, -5,  5,
      5, 10, 10,-20,-20, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20],
  r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20],
};
const K_MID = [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20];
const K_END = [
    -50,-40,-30,-20,-20,-30,-40,-50,
    -30,-20,-10,  0,  0,-10,-20,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-30,  0,  0,  0,  0,-30,-30,
    -50,-30,-30,-30,-30,-30,-30,-50];
const ENDGAME_MAT = 1300;   /* combined non-pawn material at/below = endgame king */
const TEMPO = 10;

export function ChessBrain(core, opts = {}) {
  const tierKey = opts.tier || 'T2';
  const T = BRAIN_TIERS[tierKey];
  if (!T) throw new Error('unknown tier: ' + tierKey);
  const sys = core._sys();

  /* ── deterministic PRNG — mulberry32, seeded, no Math.random ──── */
  let rngState = ((opts.seed === undefined ? 0x5eed : opts.seed) >>> 0) || 1;
  function rng() {
    rngState = (rngState + 0x6d2b79f5) >>> 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* ── evaluation: white-positive, returned from side-to-move view ─ */
  function evaluate() {
    const board = sys.boardRef();
    let score = 0, nonPawn = 0, wK = -1, bK = -1;
    for (let s = 0; s < 128; s++) {
      if (s & 0x88) continue;
      const p = board[s];
      if (!p) continue;
      const white = p === p.toUpperCase();
      const lo = white ? p.toLowerCase() : p;
      const f = s & 15, r = s >> 4;
      const idx = white ? (7 - r) * 8 + f : r * 8 + f;
      if (lo === 'k') { if (white) wK = idx; else bK = idx; continue; }
      if (lo !== 'p') nonPawn += VAL[lo];
      const v = VAL[lo] + PST[lo][idx];
      score += white ? v : -v;
    }
    const kTab = nonPawn <= ENDGAME_MAT ? K_END : K_MID;
    if (wK >= 0) score += kTab[wK];
    if (bK >= 0) score -= kTab[bK];
    let stm = sys.turn() === 'w' ? score : -score;
    stm += TEMPO;
    if (T.noise) stm += Math.floor((rng() * 2 - 1) * T.noise);
    return stm;
  }

  /* ── move ordering ────────────────────────────────────────────── */
  let killers;
  function orderScore(m, ply, pvMove) {
    if (pvMove && m.from === pvMove.from && m.to === pvMove.to &&
        m.promo === pvMove.promo) return 1e9;
    let s = 0;
    if (m.capture) s = 1e6 + VAL[m.capture.toLowerCase()] * 10 - VAL[m.piece.toLowerCase()];
    if (m.promo) s += 9e5 + VAL[m.promo];
    if (!m.capture && !m.promo) {
      const k = killers[ply];
      if (k) {
        if (k[0] && k[0].from === m.from && k[0].to === m.to) s = 8e5;
        else if (k[1] && k[1].from === m.from && k[1].to === m.to) s = 7e5;
      }
    }
    return s;
  }
  function ordered(moves, ply, pvMove) {
    return moves
      .map((m) => [orderScore(m, ply, pvMove), m])
      .sort((a, b) => b[0] - a[0])
      .map((x) => x[1]);
  }

  /* ── lazy legality: pseudo moves, king-attack test only on visit ──
     legal() pays make/unmake for EVERY move before search sees any;
     alpha-beta visits few. Kings are tracked so the check test is one
     attacked() call, never a 128-square scan. ───────────────────── */
  let nodes, stopped, kings, kingStack;
  function initKings() {
    kings = { w: sys.kingSq('w'), b: sys.kingSq('b') };
    kingStack = [];
  }
  function mk(m) {
    const moverIsKing = m.piece === 'K' || m.piece === 'k';
    const us = sys.turn();
    kingStack.push(moverIsKing ? { c: us, sq: kings[us] } : null);
    if (moverIsKing) kings[us] = m.to;
    sys.make(m);
  }
  function unmk() {
    sys.unmake();
    const rec = kingStack.pop();
    if (rec) kings[rec.c] = rec.sq;
  }
  const chk = (color) => sys.attacked(kings[color], color === 'w' ? 'b' : 'w');

  /* quiescence: captures/promotions when calm, full evasions in check.
     Check evasion keeps horizon mates visible to the search. */
  function qsearch(alpha, beta, qd, ply) {
    nodes++;
    if (nodes > T.nodeCap) { stopped = true; return alpha; }
    const us = sys.turn();
    const inChk = chk(us);
    if (!inChk) {
      const stand = evaluate();
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (qd <= 0) return alpha;
    }
    const gen = sys.pseudo();
    const list = inChk ? gen : gen.filter((m) => m.capture || m.promo);
    let anyLegal = false;
    for (const m of ordered(list, 0, null)) {
      mk(m);
      if (chk(us)) { unmk(); continue; }
      anyLegal = true;
      const sc = -qsearch(-beta, -alpha, qd - 1, ply + 1);
      unmk();
      if (stopped) return alpha;
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    if (inChk && !anyLegal) return -(MATE - ply);   /* mated at the horizon */
    return alpha;
  }

  /* ── negamax + alpha-beta over pseudo moves ───────────────────── */
  function negamax(depth, alpha, beta, ply) {
    nodes++;
    if (nodes > T.nodeCap) { stopped = true; return alpha; }
    if (sys.halfmove() >= 100) return 0;
    if (depth <= 0) return qsearch(alpha, beta, T.qdepth, ply);
    const us = sys.turn();
    let best = -Infinity, anyLegal = false;
    for (const m of ordered(sys.pseudo(), ply, null)) {
      mk(m);
      if (chk(us)) { unmk(); continue; }             /* illegal — skip lazily */
      anyLegal = true;
      const sc = -negamax(depth - 1, -beta, -alpha, ply + 1);
      unmk();
      if (stopped) return alpha;
      if (sc > best) best = sc;
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) {
        if (!m.capture) {
          const k = killers[ply] || (killers[ply] = []);
          if (!k[0] || k[0].from !== m.from || k[0].to !== m.to) { k[1] = k[0]; k[0] = m; }
        }
        break;
      }
    }
    if (!anyLegal) return chk(us) ? -(MATE - ply) : 0;
    return best;
  }

  /* ── the public act: think ────────────────────────────────────── */
  function think() {
    nodes = 0; stopped = false; killers = [];
    initKings();
    const rootMoves = sys.legal();
    if (rootMoves.length === 0) return null;
    let bestMove = rootMoves[0], bestScore = -Infinity, completedDepth = 0, pv = null;
    for (let d = 1; d <= T.depth; d++) {
      let iterBest = null, iterScore = -Infinity;
      let alpha = -Infinity;
      for (const m of ordered(rootMoves, 0, pv)) {
        mk(m);
        const sc = -negamax(d - 1, -Infinity, -alpha, 1);
        unmk();
        if (stopped) break;
        if (sc > iterScore) { iterScore = sc; iterBest = m; }
        if (sc > alpha) alpha = sc;
      }
      if (stopped || !iterBest) break;               /* discard torn iteration */
      bestMove = iterBest; bestScore = iterScore; completedDepth = d; pv = iterBest;
      if (bestScore >= MATE - 1000) break;           /* mate found — stop digging */
    }
    const mate = bestScore >= MATE - 1000
      ? Math.ceil((MATE - bestScore) / 2)
      : bestScore <= -(MATE - 1000)
        ? -Math.ceil((MATE + bestScore) / 2)
        : null;
    return {
      move: {
        from: sys.sqName(bestMove.from),
        to: sys.sqName(bestMove.to),
        promo: bestMove.promo || undefined,
      },
      score: bestScore, mate,
      depth: completedDepth, nodes,
      tier: tierKey, tierName: T.name,
    };
  }

  /* think + commit through the core's public door (full legality/result) */
  function play() {
    const t = think();
    if (!t) return null;
    const r = core.move(t.move);
    return r ? { ...t, played: r } : null;
  }

  return { think, play, tier: () => tierKey, spec: () => ({ ...T }) };
}
