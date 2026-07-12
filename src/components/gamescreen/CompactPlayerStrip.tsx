import { memo } from 'react'
import Avatar from '../Avatar'
import { useCountdown, formatClock } from '../../hooks/useCountdown'

export default memo(function CompactPlayerStrip({ player, isTurn, remainingMs, unlimited, gameActive, onFlag }: {
  player: { name: string; rating: string; avatarColor: string; online?: boolean; color?: string; userId?: string }
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
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 14, width: '100%', maxWidth: 560,
      boxShadow: isTurn ? '0 0 0 2px rgba(229,169,59,0.18)' : 'none',
      borderColor: isTurn ? 'var(--color-amber)' : 'var(--color-border)',
    }}>
      <Avatar name={player.name} size={36} color={player.avatarColor as 'amber'} ring={isTurn} userId={player.userId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {player.color && (
            <>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: player.color === 'white' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Playing {player.color}</span>
            </>
          )}
          {!player.color && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{player.rating}</span>}
          {player.online !== undefined && (
            <span style={{ fontSize: 11, color: player.online ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
              ● {player.online ? 'Online' : 'Away'}
            </span>
          )}
        </div>
      </div>
      <div style={{
        background: lowTime ? 'rgba(210,106,106,0.15)' : (isTurn ? 'rgba(229,169,59,0.12)' : 'var(--color-bg-base)'),
        border: `1px solid ${lowTime ? 'rgba(210,106,106,0.4)' : (isTurn ? 'var(--color-amber)' : 'var(--color-border-strong)')}`,
        padding: '6px 12px', borderRadius: 10, textAlign: 'center',
      }}>
        <div className="font-mono" style={{
          fontSize: 20, fontWeight: 500,
          color: lowTime ? 'var(--color-red)' : (isTurn ? 'var(--color-amber)' : 'var(--color-text-primary)'),
        }}>{unlimited ? '∞' : formatClock(msLeft)}</div>
      </div>
    </div>
  )
})
