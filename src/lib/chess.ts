import type { Position } from '../components/Board'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function boardToPosition(board: Record<string, string>): Position {
  const pos: Position = {}
  for (const [sq, piece] of Object.entries(board)) {
    pos[sq] = {
      t: piece.toUpperCase(),
      c: piece === piece.toUpperCase() ? 'l' : 'd',
    }
  }
  return pos
}

export function fenToPosition(fen?: string): Position {
  const position: Position = {}
  const board = (fen || INITIAL_FEN).split(' ')[0]
  const ranks = board.split('/')
  for (let rank = 0; rank < 8; rank++) {
    let file = 0
    for (const ch of ranks[rank]) {
      if (ch >= '1' && ch <= '8') {
        file += parseInt(ch)
      } else {
        const sq = `${FILES[file]}${8 - rank}`
        position[sq] = {
          t: ch.toUpperCase(),
          c: ch === ch.toUpperCase() ? 'l' : 'd',
        }
        file++
      }
    }
  }
  return position
}

export function applyMove(position: Position, move: string): Position {
  const from = move.slice(0, 2)
  const to = move.slice(2, 4)
  const promo = move.length > 4 ? move[4].toUpperCase() : null
  const piece = position[from]
  if (!piece) return position

  const next = { ...position }
  delete next[from]

  // Castling
  if (piece.t === 'K' && from === 'e1' && to === 'g1') { delete next.h1; next.f1 = { t: 'R', c: 'l' } }
  if (piece.t === 'K' && from === 'e1' && to === 'c1') { delete next.a1; next.d1 = { t: 'R', c: 'l' } }
  if (piece.t === 'K' && from === 'e8' && to === 'g8') { delete next.h8; next.f8 = { t: 'R', c: 'd' } }
  if (piece.t === 'K' && from === 'e8' && to === 'c8') { delete next.a8; next.d8 = { t: 'R', c: 'd' } }

  // En passant capture
  if (piece.t === 'P' && from[0] !== to[0] && !position[to]) {
    const capturedSq = `${to[0]}${from[1]}`
    delete next[capturedSq]
  }

  next[to] = promo ? { t: promo, c: piece.c } : piece
  return next
}

// ── Pseudo-legal move hints ──

function inBounds(f: number, r: number) { return f >= 0 && f < 8 && r >= 0 && r < 8 }
function sq(f: number, r: number) { return `${FILES[f]}${r + 1}` }
function rc(sq: string) { return { f: FILES.indexOf(sq[0]), r: parseInt(sq[1]) - 1 } }

function slidingMoves(pos: Position, from: string, dirs: [number, number][], color: 'l' | 'd'): string[] {
  const result: string[] = []
  const { f, r } = rc(from)
  for (const [df, dr] of dirs) {
    for (let i = 1; i < 8; i++) {
      const nf = f + df * i; const nr = r + dr * i
      if (!inBounds(nf, nr)) break
      const target = pos[sq(nf, nr)]
      if (target) {
        if (target.c !== color) result.push(sq(nf, nr))
        break
      }
      result.push(sq(nf, nr))
    }
  }
  return result
}

export function getHints(position: Position, square: string): string[] {
  const piece = position[square]
  if (!piece) return []

  const color = piece.c
  const opponent = color === 'l' ? 'd' : 'l'
  const { f, r } = rc(square)
  const hints: string[] = []

  switch (piece.t) {
    case 'P': {
      const dir = color === 'l' ? 1 : -1
      // Forward one
      const fwd = sq(f, r + dir)
      if (inBounds(f, r + dir) && !position[fwd]) hints.push(fwd)
      // Forward two from starting rank
      const startRank = color === 'l' ? 1 : 6
      const fwd2 = sq(f, r + 2 * dir)
      if (r === startRank && inBounds(f, r + 2 * dir) && !position[fwd] && !position[fwd2]) hints.push(fwd2)
      // Captures
      for (const df of [-1, 1]) {
        if (inBounds(f + df, r + dir)) {
          const capSq = sq(f + df, r + dir)
          if (position[capSq] && position[capSq].c === opponent) hints.push(capSq)
          // En passant — include capture squares next to pawns on same rank
          const adjSq = sq(f + df, r)
          const adjPiece = position[adjSq]
          if (adjPiece && adjPiece.t === 'P' && adjPiece.c === opponent) {
            if (inBounds(f + df, r + dir) && !position[capSq]) hints.push(capSq)
          }
        }
      }
      break
    }
    case 'N': {
      for (const [df, dr] of [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]) {
        const nf = f + df; const nr = r + dr
        if (inBounds(nf, nr)) {
          const target = position[sq(nf, nr)]
          if (!target || target.c === opponent) hints.push(sq(nf, nr))
        }
      }
      break
    }
    case 'B':
      hints.push(...slidingMoves(position, square, [[1,1],[1,-1],[-1,1],[-1,-1]], color))
      break
    case 'R':
      hints.push(...slidingMoves(position, square, [[1,0],[-1,0],[0,1],[0,-1]], color))
      break
    case 'Q':
      hints.push(...slidingMoves(position, square, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]], color))
      break
    case 'K': {
      for (const [df, dr] of [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]) {
        const nf = f + df; const nr = r + dr
        if (inBounds(nf, nr)) {
          const target = position[sq(nf, nr)]
          if (!target || target.c === opponent) hints.push(sq(nf, nr))
        }
      }
      // Castling hints (simplified — just show squares, server validates)
      if (color === 'l' && square === 'e1') {
        if (!position.f1 && !position.g1 && position.h1?.t === 'R' && position.h1.c === 'l') hints.push('g1')
        if (!position.d1 && !position.c1 && !position.b1 && position.a1?.t === 'R' && position.a1.c === 'l') hints.push('c1')
      }
      if (color === 'd' && square === 'e8') {
        if (!position.f8 && !position.g8 && position.h8?.t === 'R' && position.h8.c === 'd') hints.push('g8')
        if (!position.d8 && !position.c8 && !position.b8 && position.a8?.t === 'R' && position.a8.c === 'd') hints.push('c8')
      }
      break
    }
  }

  return hints
}

export const INITIAL_POSITION = fenToPosition()
