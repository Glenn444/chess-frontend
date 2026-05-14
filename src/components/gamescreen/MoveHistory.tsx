import { memo } from 'react'

export default memo(function MoveHistory({ moves }: { moves: { move: string; current_player: string }[] }) {
  const paired: { n: number; w: string; b: string }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    paired.push({
      n: Math.floor(i / 2) + 1,
      w: moves[i]?.move || '',
      b: moves[i + 1]?.move || '',
    })
  }
  const currentIdx = paired.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Moves</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {paired.length === 0 ? (
          <div style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: 12, fontStyle: 'italic' }}>No moves yet</div>
        ) : (
          paired.map((m, i) => (
            <div key={m.n} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 1fr',
              padding: '6px 14px', fontSize: 13, alignItems: 'center',
              background: i === currentIdx ? 'rgba(229,169,59,0.06)' : 'transparent',
            }}>
              <div className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{m.n}.</div>
              <div className="font-mono" style={{ fontWeight: 500, color: i === currentIdx && !m.b ? 'var(--color-amber)' : 'var(--color-text-primary)', padding: '3px 8px', borderRadius: 4, background: i === currentIdx && !m.b ? 'rgba(229,169,59,0.12)' : 'transparent' }}>{m.w}</div>
              <div className="font-mono" style={{ color: 'var(--color-text-primary)', padding: '3px 8px' }}>{m.b}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})
