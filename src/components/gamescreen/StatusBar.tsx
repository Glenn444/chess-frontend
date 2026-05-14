import { memo } from 'react'

export default memo(function StatusBar({ turn, phase, check }: { turn: string; phase: string; check: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px', borderRadius: 14,
      background: check ? 'rgba(210,106,106,0.12)' : 'var(--color-bg-elev)',
      border: `1px solid ${check ? 'rgba(210,106,106,0.35)' : 'var(--color-border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: turn === 'you' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {check ? <span style={{ color: 'var(--color-red)' }}>Check! </span> : null}
          {turn === 'you' ? <span style={{ color: 'var(--color-amber)' }}>Your move</span> : `${turn} is thinking`}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>· move 14 · {phase}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span><span className="font-mono" style={{ color: 'var(--color-amber)' }}>10+0</span> Rated</span>
        <span style={{ width: 1, height: 12, background: 'var(--color-border-strong)' }} />
        <span>Italian Game</span>
      </div>
    </div>
  )
})
