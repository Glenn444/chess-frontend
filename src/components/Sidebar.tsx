import { useRef, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'
import Avatar from './Avatar'
import { useAuth } from '../lib/authStore'
import { useLogout } from '../lib/queries'
import logoPng from '../assets/chesske-logo.png'

const items = [
  { k: '/dashboard', l: 'Home', i: 'user' as const },
  { k: '/games', l: 'Play', i: 'zap' as const },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const logoutMutation = useLogout()
  const active = location.pathname

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeItem = items.find(it => active === it.k || active.startsWith(it.k + '/'))
  const displayName = user?.username || 'Player'
  const displayRating = user?.rating ?? 1200

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <aside className="sidebar" style={{
      width: 220, borderRight: '1px solid var(--color-border)',
      background: 'var(--color-bg-raised)', padding: '22px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0, height: '100vh', boxSizing: 'border-box', overflowY: 'auto',
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

      {/* Avatar card + dropdown */}
      <div ref={menuRef} style={{ position: 'relative', marginTop: 16 }}>
        {/* Dropdown menu — renders above the card */}
        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
            background: 'var(--color-bg-raised)', border: '1px solid var(--color-border-strong)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 -8px 24px -4px rgba(0,0,0,0.5)',
            zIndex: 200,
          }}>
            <button
              onClick={() => { setMenuOpen(false); navigate('/dashboard') }}
              style={{
                width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-elev)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon name="user" size={15} color="var(--color-text-secondary)" />
              View profile
            </button>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                color: 'var(--color-red)', fontSize: 13, fontWeight: 500,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(210,106,106,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon name="x" size={15} color="var(--color-red)" />
              Log out
            </button>
          </div>
        )}

        {/* Avatar card */}
        <div
          onClick={() => setMenuOpen(o => !o)}
          style={{
            background: menuOpen ? 'var(--color-bg-elev)' : 'var(--color-bg-elev)',
            border: `1px solid ${menuOpen ? 'var(--color-amber)' : 'var(--color-border)'}`,
            borderRadius: 16, padding: 14, cursor: 'pointer',
            transition: 'border-color .15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={displayName} size={36} color="amber" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{displayRating} · Casual</div>
            </div>
            <Icon name="settings" size={16} color={menuOpen ? 'var(--color-amber)' : 'var(--color-text-muted)'} />
          </div>
        </div>
      </div>
    </aside>
  )
}
