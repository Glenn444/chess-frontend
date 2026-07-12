import { memo } from 'react'

export default memo(function StatusBar({ turn, phase, check, moveNumber, timeControl }: {
  turn: string
  phase: string
  check: boolean
  moveNumber?: number
  timeControl?: string   // e.g. "10 min" or "Unlimited"
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px', borderRadius: 14, gap: 8,
      background: check ? 'rgba(210,106,106,0.12)' : 'var(--color-bg-elev)',
      border: `1px solid ${check ? 'rgba(210,106,106,0.35)' : 'var(--color-border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: turn === 'you' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {check ? <span style={{ color: 'var(--color-red)' }}>Check! </span> : null}
          {turn === 'you' ? <span style={{ color: 'var(--color-amber)' }}>Your move</span> : `${turn} is thinking`}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {moveNumber != null ? `· move ${moveNumber} ` : ''}· {phase}
        </span>
      </div>
      {timeControl && (
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          <span className="font-mono" style={{ color: 'var(--color-amber)' }}>{timeControl}</span>
        </span>
      )}
    </div>
  )
})
