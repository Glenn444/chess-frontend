import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'

const LINKS = [
  { to: '/', label: 'Home', icon: 'user' as const },
  { to: '/lobby', label: 'Lobby', icon: 'globe' as const },
  { to: '/events', label: 'Events', icon: 'zap' as const },
  { to: '/login', label: 'Log in', icon: 'user' as const },
  { to: '/register', label: 'Sign up', icon: 'plus' as const },
]

const GUEST_ROUTES = ['/', '/lobby', '/events', '/announcements', '/login', '/register']

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isGuest = GUEST_ROUTES.includes(location.pathname) || location.pathname.startsWith('/events/')
  if (!isGuest) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      padding: '6px 6px',
      maxWidth: 'calc(100vw - 16px)',
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: 999,
    }}>
      {LINKS.map(item => {
        const active = location.pathname === item.to
        return (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '8px min(14px, 2.5vw)',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#d4a017' : 'transparent',
              color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.2s ease',
              minWidth: 'min(56px, 16vw)',
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <Icon name={item.icon} size={20} color={active ? '#ffffff' : 'currentColor'} />
            <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
