/* ═════════════════════════════════════════════════════════════════════
   UNSURFACED — CABINET 05 · CHESS — THE ENGINE
   Pure rules core. No DOM, no RNG, no rendering. 0x88 board.
   The Hand's brain rides elsewhere; this is the law of the game.
   ═════════════════════════════════════════════════════════════════════ */

export function ChessCore(fen) {
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  /* board: 0x88 — file = sq & 15, rank = sq >> 4, offboard = sq & 0x88 */
  let board, turn, castling, ep, halfmove, fullmove;
  let history, repetition;

  const WHITE = 'w', BLACK = 'b';
  const N_OFF = [31, 33, 14, 18, -31, -33, -14, -18];
  const K_OFF = [1, -1, 16, -16, 15, 17, -15, -17];
  const B_OFF = [15, 17, -15, -17];
  const R_OFF = [1, -1, 16, -16];

  const isWhite = (p) => p && p === p.toUpperCase();
  const colorOf = (p) => (isWhite(p) ? WHITE : BLACK);
  const sqName = (sq) => 'abcdefgh'[sq & 15] + ((sq >> 4) + 1);
  const sqOf = (name) => (name.charCodeAt(0) - 97) + ((name.charCodeAt(1) - 49) << 4);

  function loadFen(f) {
    board = new Array(128).fill(null);
    const parts = f.trim().split(/\s+/);
    const rows = parts[0].split('/');
    for (let r = 0; r < 8; r++) {
      let file = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') file += +ch;
        else board[((7 - r) << 4) + file++] = ch;
      }
    }
    turn = parts[1] || 'w';
    castling = { K: false, Q: false, k: false, q: false };
    for (const c of (parts[2] || '')) if (c in castling) castling[c] = true;
    ep = parts[3] && parts[3] !== '-' ? sqOf(parts[3]) : -1;
    halfmove = +(parts[4] || 0);
    fullmove = +(parts[5] || 1);
    history = [];
    repetition = new Map();
    bump(posKey(), +1);
  }

  function fenOut() {
    let rows = [];
    for (let r = 7; r >= 0; r--) {
      let row = '', empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = board[(r << 4) + f];
        if (!p) empty++;
        else { if (empty) { row += empty; empty = 0; } row += p; }
      }
      if (empty) row += empty;
      rows.push(row);
    }
    const cast = (castling.K ? 'K' : '') + (castling.Q ? 'Q' : '') +
                 (castling.k ? 'k' : '') + (castling.q ? 'q' : '');
    return rows.join('/') + ' ' + turn + ' ' + (cast || '-') + ' ' +
           (ep >= 0 ? sqName(ep) : '-') + ' ' + halfmove + ' ' + fullmove;
  }

  function posKey() {
    /* repetition identity: placement + turn + castling + ep only */
    return fenOut().split(' ').slice(0, 4).join(' ');
  }
  function bump(key, d) {
    repetition.set(key, (repetition.get(key) || 0) + d);
  }

  /* ── attack detection ─────────────────────────────────────────── */
  function attacked(sq, by) {
    /* pawns */
    const pawn = by === WHITE ? 'P' : 'p';
    const pOff = by === WHITE ? [-15, -17] : [15, 17];
    for (const o of pOff) {
      const s = sq + o;
      if (!(s & 0x88) && board[s] === pawn) return true;
    }
    const kn = by === WHITE ? 'N' : 'n';
    for (const o of N_OFF) {
      const s = sq + o;
      if (!(s & 0x88) && board[s] === kn) return true;
    }
    const ki = by === WHITE ? 'K' : 'k';
    for (const o of K_OFF) {
      const s = sq + o;
      if (!(s & 0x88) && board[s] === ki) return true;
    }
    const bq = by === WHITE ? 'BQ' : 'bq';
    for (const o of B_OFF) {
      let s = sq + o;
      while (!(s & 0x88)) {
        const p = board[s];
        if (p) { if (bq.includes(p)) return true; break; }
        s += o;
      }
    }
    const rq = by === WHITE ? 'RQ' : 'rq';
    for (const o of R_OFF) {
      let s = sq + o;
      while (!(s & 0x88)) {
        const p = board[s];
        if (p) { if (rq.includes(p)) return true; break; }
        s += o;
      }
    }
    return false;
  }

  function kingSq(color) {
    const k = color === WHITE ? 'K' : 'k';
    for (let s = 0; s < 128; s++) if (!(s & 0x88) && board[s] === k) return s;
    return -1;
  }
  const inCheck = (color) => attacked(kingSq(color), color === WHITE ? BLACK : WHITE);

  /* ── move generation ──────────────────────────────────────────── */
  function pseudo() {
    const out = [];
    const us = turn, them = us === WHITE ? BLACK : WHITE;
    const fwd = us === WHITE ? 16 : -16;
    const startRank = us === WHITE ? 1 : 6;
    const promoRank = us === WHITE ? 7 : 0;
    const push = (from, to, flags, promo) => out.push({ from, to, piece: board[from], capture: board[to] || (flags === 'ep' ? (us === WHITE ? 'p' : 'P') : null), flags: flags || '', promo: promo || null });

    for (let from = 0; from < 128; from++) {
      if (from & 0x88) continue;
      const p = board[from];
      if (!p || colorOf(p) !== us) continue;
      const P = p.toUpperCase();

      if (P === 'P') {
        const one = from + fwd;
        if (!(one & 0x88) && !board[one]) {
          if ((one >> 4) === promoRank) for (const pr of ['q', 'r', 'b', 'n']) push(from, one, 'p', pr);
          else {
            push(from, one, '');
            const two = from + 2 * fwd;
            if ((from >> 4) === startRank && !board[two]) push(from, two, 'd');
          }
        }
        for (const o of [fwd - 1, fwd + 1]) {
          const to = from + o;
          if (to & 0x88) continue;
          if (board[to] && colorOf(board[to]) === them) {
            if ((to >> 4) === promoRank) for (const pr of ['q', 'r', 'b', 'n']) push(from, to, 'pc', pr);
            else push(from, to, 'c');
          } else if (to === ep) push(from, to, 'ep');
        }
      } else if (P === 'N' || P === 'K') {
        for (const o of (P === 'N' ? N_OFF : K_OFF)) {
          const to = from + o;
          if (to & 0x88) continue;
          if (!board[to]) push(from, to, '');
          else if (colorOf(board[to]) === them) push(from, to, 'c');
        }
        if (P === 'K') {
          const home = us === WHITE ? 0 : 7 << 4;
          const kSide = us === WHITE ? castling.K : castling.k;
          const qSide = us === WHITE ? castling.Q : castling.q;
          if (from === home + 4 && !inCheck(us)) {
            if (kSide && !board[home + 5] && !board[home + 6] &&
                !attacked(home + 5, them) && !attacked(home + 6, them))
              push(from, home + 6, 'k');
            if (qSide && !board[home + 3] && !board[home + 2] && !board[home + 1] &&
                !attacked(home + 3, them) && !attacked(home + 2, them))
              push(from, home + 2, 'q');
          }
        }
      } else {
        const dirs = P === 'B' ? B_OFF : P === 'R' ? R_OFF : K_OFF; /* Q = K rays sliding */
        for (const o of dirs) {
          let to = from + o;
          while (!(to & 0x88)) {
            if (!board[to]) push(from, to, '');
            else { if (colorOf(board[to]) === them) push(from, to, 'c'); break; }
            to += o;
          }
        }
      }
    }
    return out;
  }

  function make(m) {
    const undo = {
      m, captured: board[m.to], ep, castling: { ...castling },
      halfmove, key: posKey(),
    };
    board[m.to] = m.promo
      ? (turn === WHITE ? m.promo.toUpperCase() : m.promo)
      : board[m.from];
    board[m.from] = null;
    if (m.flags === 'ep') {
      const capSq = m.to + (turn === WHITE ? -16 : 16);
      undo.epCaptured = board[capSq];
      board[capSq] = null;
    }
    if (m.flags === 'k') { const h = turn === WHITE ? 0 : 112; board[h + 5] = board[h + 7]; board[h + 7] = null; }
    if (m.flags === 'q') { const h = turn === WHITE ? 0 : 112; board[h + 3] = board[h + 0]; board[h + 0] = null; }
    /* rights decay */
    const P = m.piece.toUpperCase();
    if (P === 'K') { if (turn === WHITE) { castling.K = castling.Q = false; } else { castling.k = castling.q = false; } }
    if (m.from === 0 || m.to === 0) castling.Q = false;
    if (m.from === 7 || m.to === 7) castling.K = false;
    if (m.from === 112 || m.to === 112) castling.q = false;
    if (m.from === 119 || m.to === 119) castling.k = false;
    ep = m.flags === 'd' ? m.from + (turn === WHITE ? 16 : -16) : -1;
    halfmove = (P === 'P' || m.capture) ? 0 : halfmove + 1;
    if (turn === BLACK) fullmove++;
    turn = turn === WHITE ? BLACK : WHITE;
    history.push(undo);
    bump(posKey(), +1);
    return undo;
  }

  function unmake() {
    const u = history.pop();
    if (!u) return false;
    bump(posKey(), -1);
    turn = turn === WHITE ? BLACK : WHITE;
    if (turn === BLACK) fullmove--;
    const m = u.m;
    board[m.from] = m.promo ? (turn === WHITE ? 'P' : 'p') : board[m.to];
    board[m.to] = u.captured || null;
    if (m.flags === 'ep') {
      const capSq = m.to + (turn === WHITE ? -16 : 16);
      board[capSq] = u.epCaptured;
      board[m.to] = null;
    }
    if (m.flags === 'k') { const h = turn === WHITE ? 0 : 112; board[h + 7] = board[h + 5]; board[h + 5] = null; }
    if (m.flags === 'q') { const h = turn === WHITE ? 0 : 112; board[h + 0] = board[h + 3]; board[h + 3] = null; }
    ep = u.ep; castling = u.castling; halfmove = u.halfmove;
    return true;
  }

  function legal() {
    const us = turn, out = [];
    for (const m of pseudo()) {
      make(m);
      if (!inCheck(us)) out.push(m);
      unmake();
    }
    return out;
  }

  /* ── results ──────────────────────────────────────────────────── */
  function insufficient() {
    const pieces = [];
    for (let s = 0; s < 128; s++) {
      if (s & 0x88) continue;
      const p = board[s];
      if (p && p.toUpperCase() !== 'K') pieces.push({ p, s });
    }
    if (pieces.length === 0) return true;                     /* K vs K */
    if (pieces.length === 1) {
      const P = pieces[0].p.toUpperCase();
      return P === 'B' || P === 'N';                          /* K+minor vs K */
    }
    if (pieces.length === 2 &&
        pieces[0].p.toUpperCase() === 'B' && pieces[1].p.toUpperCase() === 'B' &&
        colorOf(pieces[0].p) !== colorOf(pieces[1].p)) {
      const shade = (s) => ((s >> 4) + (s & 15)) & 1;
      return shade(pieces[0].s) === shade(pieces[1].s);       /* opposite bishops, same shade */
    }
    return false;
  }

  function result() {
    const ms = legal();
    if (ms.length === 0)
      return inCheck(turn)
        ? { result: turn === WHITE ? '0-1' : '1-0', reason: 'checkmate' }
        : { result: '1/2-1/2', reason: 'stalemate' };
    if (halfmove >= 100) return { result: '1/2-1/2', reason: 'fifty-move' };
    if ((repetition.get(posKey()) || 0) >= 3) return { result: '1/2-1/2', reason: 'threefold' };
    if (insufficient()) return { result: '1/2-1/2', reason: 'insufficient' };
    return null;
  }

  /* ── public move ──────────────────────────────────────────────── */
  function move(spec) {
    const from = typeof spec.from === 'string' ? sqOf(spec.from) : spec.from;
    const to = typeof spec.to === 'string' ? sqOf(spec.to) : spec.to;
    const promo = spec.promo ? spec.promo.toLowerCase() : null;
    for (const m of legal()) {
      if (m.from !== from || m.to !== to) continue;
      if (m.promo && m.promo !== (promo || 'q')) continue;   /* unspecified promo = queen */
      {
        make(m);
        const r = result();
        return {
          from: sqName(m.from), to: sqName(m.to), piece: m.piece,
          capture: m.capture, promo: m.promo, flags: m.flags,
          check: inCheck(turn), over: r,
        };
      }
    }
    return null;
  }

  function perft(depth) {
    if (depth === 0) return 1;
    let n = 0;
    for (const m of legal()) { make(m); n += perft(depth - 1); unmake(); }
    return n;
  }

  loadFen(fen || START);

  return {
    fen: fenOut,
    load: loadFen,
    turn: () => turn,
    board: () => {
      const out = {};
      for (let s = 0; s < 128; s++) if (!(s & 0x88) && board[s]) out[sqName(s)] = board[s];
      return out;
    },
    moves: (fromName) => legal()
      .filter((m) => !fromName || sqName(m.from) === fromName)
      .map((m) => ({ from: sqName(m.from), to: sqName(m.to), piece: m.piece, capture: m.capture, promo: m.promo, flags: m.flags })),
    move,
    undo: unmake,
    inCheck: () => inCheck(turn),
    result,
    perft,
    /* fast-path for THE HAND'S BRAIN (search). Raw internals — caller must
       balance every make() with an unmake(). No legality re-check, no result
       computation. The public move() remains the only door for game moves. */
    _sys: () => ({
      legal, pseudo, make, unmake,
      inCheck: (c) => inCheck(c || turn),
      attacked, kingSq,
      turn: () => turn,
      boardRef: () => board,
      halfmove: () => halfmove,
      sqName, sqOf,
    }),
  };
}
