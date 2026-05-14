import { memo, useState, useEffect } from 'react'
import Avatar from '../Avatar'

export default memo(function CompactPlayerStrip({ player, isTurn, initialSeconds, gameActive }: {
  player: { name: string; rating: string; avatarColor: string; online?: boolean }
  isTurn: boolean
  initialSeconds: number
  gameActive: boolean
}) {
  const [secs, setSecs] = useState(initialSeconds)

  useEffect(() => { setSecs(initialSeconds) }, [initialSeconds])

  useEffect(() => {
    if (!isTurn || !gameActive) return
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [isTurn, gameActive])

  const mins = Math.floor(secs / 60)
  const lowTime = mins < 1
  const display = `${mins}:${(secs % 60).toString().padStart(2, '0')}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 14, width: '100%', maxWidth: 560,
      boxShadow: isTurn ? '0 0 0 2px rgba(229,169,59,0.18)' : 'none',
      borderColor: isTurn ? 'var(--color-amber)' : 'var(--color-border)',
    }}>
      <Avatar name={player.name} size={36} color={player.avatarColor as 'amber'} ring={isTurn} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{player.rating}</span>
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
        }}>{display}</div>
      </div>
    </div>
  )
})
