import { useState, useEffect, useMemo, memo } from 'react'
import Board from './Board'

const AUTH_MOVES = [
  { from: 'e2', to: 'e4' },
  { from: 'e7', to: 'e5' },
  { from: 'g1', to: 'f3' },
  { from: 'b8', to: 'c6' },
  { from: 'f1', to: 'c4' },
]

export default memo(function AnimatedBoard({ size = 360, showLabel = false }: {
  size?: number
  showLabel?: boolean
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1400)
    return () => clearInterval(id)
  }, [])

  const step = tick % (AUTH_MOVES.length + 2)

  const position = useMemo(() => {
    const base: Record<string, { t: string; c: 'l' | 'd' }> = {}
    for (const f of 'abcdefgh') {
      base[`${f}2`] = { t: 'P', c: 'l' }
      base[`${f}7`] = { t: 'P', c: 'd' }
    }
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    for (let i = 0; i < 8; i++) {
      base[`${'abcdefgh'[i]}1`] = { t: back[i], c: 'l' }
      base[`${'abcdefgh'[i]}8`] = { t: back[i], c: 'd' }
    }
    for (let i = 0; i < step; i++) {
      const m = AUTH_MOVES[i]
      if (m && base[m.from]) {
        base[m.to] = base[m.from]
        delete base[m.from]
      }
    }
    return base
  }, [step])

  const lastMove = useMemo(() => {
    const lastIdx = step - 1
    return lastIdx >= 0 && AUTH_MOVES[lastIdx]
      ? [AUTH_MOVES[lastIdx].from, AUTH_MOVES[lastIdx].to]
      : []
  }, [step])

  return (
    <>
      <div style={{ display: 'inline-block', animation: 'float-piece 6s ease-in-out infinite' }}>
        <Board size={size} showCoords={false} position={position} lastMove={lastMove} />
      </div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <span>Italian Game · move {Math.max(1, step)}/5</span>
        </div>
      )}
    </>
  )
})
