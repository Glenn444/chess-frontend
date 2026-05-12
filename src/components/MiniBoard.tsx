interface MiniBoardProps {
  preset?: 'mid' | 'early' | 'end'
}

const positions: Record<string, Record<string, string>> = {
  mid: { e4: 'P', e5: 'p', f3: 'N', c6: 'n', c4: 'B', f6: 'n' },
  early: { e4: 'P', e5: 'p' },
  end: { e6: 'K', g7: 'k', a1: 'R' },
}

export default function MiniBoard({ preset = 'mid' }: MiniBoardProps) {
  const pos = positions[preset] || positions.mid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', height: '100%' }}>
      {Array.from({ length: 64 }).map((_, i) => {
        const r = Math.floor(i / 8)
        const c = i % 8
        const file = 'abcdefgh'[c]
        const rank = 8 - r
        const sq = `${file}${rank}`
        const p = pos[sq]
        const light = (r + c) % 2 === 0
        const isUpper = p === p?.toUpperCase()
        return (
          <div
            key={i}
            style={{
              background: light ? 'var(--color-board-light)' : 'var(--color-board-dark)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {p && (
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: isUpper ? 'var(--color-piece-light)' : 'var(--color-piece-dark)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
