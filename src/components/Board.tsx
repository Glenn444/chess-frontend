import { memo } from 'react'
import Piece from './Piece'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

export interface Position {
  [square: string]: { t: string; c: 'l' | 'd' }
}

// Italian Game middlegame demo position
export const DEMO_POSITION: Position = {
  a8: { t: 'R', c: 'd' }, c8: { t: 'B', c: 'd' }, d8: { t: 'Q', c: 'd' }, e8: { t: 'K', c: 'd' }, h8: { t: 'R', c: 'd' },
  a7: { t: 'P', c: 'd' }, b7: { t: 'P', c: 'd' }, c7: { t: 'P', c: 'd' }, f7: { t: 'P', c: 'd' }, g7: { t: 'P', c: 'd' }, h7: { t: 'P', c: 'd' },
  d6: { t: 'P', c: 'd' }, f6: { t: 'N', c: 'd' },
  e5: { t: 'P', c: 'l' },
  c4: { t: 'B', c: 'l' }, e4: { t: 'P', c: 'l' },
  c3: { t: 'N', c: 'l' }, f3: { t: 'N', c: 'l' },
  a2: { t: 'P', c: 'l' }, b2: { t: 'P', c: 'l' }, d2: { t: 'P', c: 'l' }, f2: { t: 'P', c: 'l' }, g2: { t: 'P', c: 'l' }, h2: { t: 'P', c: 'l' },
  a1: { t: 'R', c: 'l' }, c1: { t: 'B', c: 'l' }, d1: { t: 'Q', c: 'l' }, e1: { t: 'K', c: 'l' }, h1: { t: 'R', c: 'l' },
}

interface BoardProps {
  position?: Position
  lastMove?: string[]
  selected?: string | null
  hints?: string[]
  check?: string | null
  size?: number
  flipped?: boolean
  onSquareClick?: (square: string) => void
  showCoords?: boolean
}

export default memo(function Board({
  position = DEMO_POSITION,
  lastMove = ['e2', 'e4'],
  selected = null,
  hints = [],
  check = null,
  size = 560,
  flipped = false,
  onSquareClick = () => {},
  showCoords = true,
}: BoardProps) {
  const squareSize = (size - 32) / 8
  const ranks = flipped ? [...RANKS].reverse() : RANKS
  const files = flipped ? [...FILES].reverse() : FILES

  return (
    <div
      style={{
        width: size,
        height: size,
        maxWidth: '100%',
        padding: 16,
        borderRadius: 18,
        border: '1px solid var(--color-border-strong)',
        background: 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.04), transparent 60%), var(--color-bg-raised)',
        boxShadow: '0 30px 60px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02) inset',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4) inset',
        }}
      >
        {ranks.map((rank, ri) =>
          files.map((file, fi) => {
            const sq = `${file}${rank}`
            const isLightSq = (ri + fi) % 2 === 0
            const piece = position[sq]
            const isLast = lastMove?.includes(sq)
            const isSel = selected === sq
            const isHint = hints.includes(sq)
            const isCheck = check === sq
            const showFile = ri === 7
            const showRank = fi === 0
            const coordColor = isLightSq ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'

            return (
              <div
                key={sq}
                onClick={() => onSquareClick(sq)}
                style={{
                  position: 'relative',
                  background: isLightSq ? 'var(--color-board-light)' : 'var(--color-board-dark)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'filter .12s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)' }}
              >
                {isLast && <div style={{ position: 'absolute', inset: 0, background: 'rgba(229,169,59,0.35)' }} />}
                {isSel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(229,169,59,0.45)', boxShadow: 'inset 0 0 0 2px var(--color-amber)' }} />}
                {isCheck && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(210,106,106,0.6), transparent 70%)' }} />}

                {showCoords && showFile && (
                  <div style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 10, fontWeight: 600, color: coordColor, fontFamily: "'JetBrains Mono', monospace" }}>{file}</div>
                )}
                {showCoords && showRank && (
                  <div style={{ position: 'absolute', top: 2, left: 4, fontSize: 10, fontWeight: 600, color: coordColor, fontFamily: "'JetBrains Mono', monospace" }}>{rank}</div>
                )}

                {piece && (
                  <Piece type={piece.t} color={piece.c === 'l' ? 'light' : 'dark'} size={squareSize * 0.86} />
                )}

                {isHint && !piece && (
                  <div style={{ width: squareSize * 0.28, height: squareSize * 0.28, borderRadius: '50%', background: 'rgba(229,169,59,0.55)' }} />
                )}
                {isHint && piece && (
                  <div style={{ position: 'absolute', inset: 4, border: '3px solid rgba(229,169,59,0.55)', borderRadius: '50%' }} />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
})
