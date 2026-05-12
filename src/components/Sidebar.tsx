import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'
import Avatar from './Avatar'
import { useAuth } from '../lib/authStore'
import logoPng from '../assets/chesske-logo.png'

const items = [
  { k: '/dashboard', l: 'Home', i: 'user' as const },
  { k: '/matchmaking', l: 'Play', i: 'zap' as const },
  { k: '/dashboard', l: 'Puzzles', i: 'puzzle' as const },
  { k: '/dashboard', l: 'Games', i: 'clock' as const },
  { k: '/dashboard', l: 'Leaderboard', i: 'trophy' as const },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const active = location.pathname

  const activeItem = items.find(it => active === it.k || active.startsWith(it.k + '/'))
  const displayName = user?.username || 'Alex Chen'
  const displayRating = user?.rating ?? 1547

  return (
    <aside className="sidebar" style={{
      width: 220, borderRight: '1px solid var(--color-border)',
      background: 'var(--color-bg-raised)', padding: '22px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0,
    }}>
      <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px', cursor: 'pointer' }}>
        <img src={logoPng} alt="Chesske" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>Chesske</span>
      </div>
      {items.map(it => (
        <div
          key={it.l}
          className="sidebar-item"
          onClick={() => navigate(it.k)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
            color: activeItem?.l === it.l ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: activeItem?.l === it.l ? 'var(--color-bg-elev)' : 'transparent',
            border: activeItem?.l === it.l ? '1px solid var(--color-border-strong)' : '1px solid transparent',
            fontSize: 14, fontWeight: activeItem?.l === it.l ? 600 : 500,
          }}
        >
          <Icon name={it.i} size={18} color={activeItem?.l === it.l ? 'var(--color-amber)' : 'currentColor'} />
          {it.l}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 14, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={displayName} size={36} color="amber" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{displayRating} · Casual</div>
          </div>
          <Icon name="settings" size={16} color="var(--color-text-muted)" />
        </div>
      </div>
    </aside>
  )
}
