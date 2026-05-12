import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'

const LINKS = [
  { to: '/', label: 'Home', icon: 'user' as const },
  { to: '/announcements', label: 'Events', icon: 'zap' as const },
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

const GUEST_ROUTES = ['/', '/announcements', '/login', '/register']

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()

  if (!GUEST_ROUTES.includes(location.pathname)) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      gap: 8,
      padding: '8px 10px',
      background: 'rgba(22, 24, 31, 0.7)',
      backdropFilter: 'blur(30px) saturate(220%)',
      WebkitBackdropFilter: 'blur(30px) saturate(220%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 999,
      boxShadow: '0 12px 44px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
      maxWidth: 'calc(100vw - 20px)',
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
              gap: 4,
              padding: '10px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--color-amber)' : 'transparent',
              color: active ? '#ffffff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: 64,
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!active) {
                e.currentTarget.style.color = 'var(--color-text-primary)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                e.currentTarget.style.color = 'var(--color-text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {item.icon === 'lock' ? (
              <PadlockIcon size={22} active={active} />
            ) : (
              <Icon name={item.icon} size={22} color={active ? '#ffffff' : 'currentColor'} />
            )}
            <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: 0.2 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
