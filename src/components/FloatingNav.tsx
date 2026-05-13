import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'

const LINKS = [
  { to: '/', label: 'Home', icon: 'user' as const },
  { to: '/events', label: 'Events', icon: 'zap' as const },
  { to: '/login', label: 'Log in', icon: 'lock' as const },
  { to: '/register', label: 'Sign up', icon: 'plus' as const },
]

function PadlockIcon({ size = 18, active = false }: { size?: number; active?: boolean }) {
  const color = active ? '#ffffff' : 'currentColor'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="11" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
    </svg>
  )
}

const GUEST_ROUTES = ['/', '/events', '/announcements', '/login', '/register']

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isGuest = GUEST_ROUTES.includes(location.pathname) || location.pathname.startsWith('/events/')
  if (!isGuest) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 8px',
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
              padding: '8px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#d4a017' : 'transparent',
              color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.2s ease',
              minWidth: 56,
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
            }}
          >
            {item.icon === 'lock' ? (
              <PadlockIcon size={20} active={active} />
            ) : (
              <Icon name={item.icon} size={20} color={active ? '#ffffff' : 'currentColor'} />
            )}
            <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
