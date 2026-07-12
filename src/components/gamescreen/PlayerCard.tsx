import { memo } from 'react'
import Avatar from '../Avatar'
import { useCountdown, formatClock } from '../../hooks/useCountdown'

export default memo(function PlayerCard({ player, isTurn, remainingMs, unlimited, gameActive, onFlag }: {
  player: { name: string; rating: string; title?: string; color: string; online: boolean; avatarColor: string }
  isTurn: boolean
  remainingMs: number
  unlimited: boolean
  gameActive: boolean
  onFlag?: () => void
}) {
  const msLeft = useCountdown(remainingMs, !unlimited && isTurn && gameActive, onFlag)
  const lowTime = !unlimited && msLeft < 60_000

  return (
    <div style={{
      padding: 14, display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
      borderColor: isTurn ? 'var(--color-amber)' : 'var(--color-border)',
      boxShadow: isTurn ? '0 0 0 3px rgba(229,169,59,0.18)' : 'none',
      transition: 'all .2s ease',
    }}>
      <Avatar name={player.name} size={44} color={player.avatarColor as 'amber'} ring={isTurn} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{player.rating}</span>
          {player.title && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.32)', fontSize: 10, color: 'var(--color-amber-light)', fontWeight: 700 }}>{player.title}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: player.color === 'white' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Playing {player.color}</span>
          <span style={{ fontSize: 12, color: player.online ? 'var(--color-green)' : 'var(--color-text-muted)' }}>● {player.online ? 'Online' : 'Away'}</span>
        </div>
      </div>
      <div style={{
        background: lowTime ? 'rgba(210,106,106,0.15)' : (isTurn ? 'rgba(229,169,59,0.12)' : 'var(--color-bg-base)'),
        border: `1px solid ${lowTime ? 'rgba(210,106,106,0.4)' : (isTurn ? 'var(--color-amber)' : 'var(--color-border-strong)')}`,
        padding: '10px 14px', borderRadius: 12, minWidth: 88, textAlign: 'center',
      }}>
        <div className="font-mono font-display" style={{
          fontSize: 24, fontWeight: 500, letterSpacing: -0.5,
          color: lowTime ? 'var(--color-red)' : (isTurn ? 'var(--color-amber)' : 'var(--color-text-primary)'),
        }}>{unlimited ? '∞' : formatClock(msLeft)}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, fontWeight: 600 }}>
          {isTurn ? 'Thinking' : 'Waiting'}
        </div>
      </div>
    </div>
  )
})
