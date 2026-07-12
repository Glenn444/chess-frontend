import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './icons/Icon'
import Avatar from './Avatar'
import { useAuth } from '../lib/authStore'
import { useLogout } from '../lib/queries'
import { useMobileNav } from '../lib/mobileNavStore'
import { api } from '../lib/api'
import { useToasts } from '../lib/toastStore'
import logoPng from '../assets/chesske-logo.png'

const items = [
  { k: '/dashboard', l: 'Home', i: 'user' as const },
  { k: '/games', l: 'Play', i: 'zap' as const },
]

export default function MobileNav() {
  const { open, closeNav } = useMobileNav()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuth(s => s.user)
  const logoutMutation = useLogout()
  const active = location.pathname

  const displayName = user?.username || 'Player'
  const displayRating = user?.rating ?? 1200
  const fileRef = useRef<HTMLInputElement>(null)
  const addToast = useToasts(s => s.addToast)
  const avatarVersion = useAuth(s => s.avatarVersion)
  const bumpAvatarVersion = useAuth(s => s.bumpAvatarVersion)
  const [uploading, setUploading] = useState(false)

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await api.uploadAvatar(file)
      bumpAvatarVersion()
      addToast('Profile photo updated!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const activeItem = items.find(it => active === it.k || active.startsWith(it.k + '/'))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const go = (path: string) => {
    closeNav()
    navigate(path)
  }

  const handleLogout = () => {
    closeNav()
    logoutMutation.mutate(undefined, { onSuccess: () => navigate('/login') })
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={closeNav}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
            animation: 'fade-in 0.15s ease both',
          }}
        />
      )}

      {/* Slide-in drawer */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 210,
          width: 270,
          background: 'var(--color-bg-raised)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 14px',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: open ? '8px 0 32px rgba(0,0,0,0.5)' : 'none',
          overflowY: 'auto',
        }}
      >
        {/* Header: logo + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 4px' }}>
          <div onClick={() => go('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <img src={logoPng} alt="Chesske" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Chesske</span>
          </div>
          <button
            onClick={closeNav}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
              color: 'var(--color-text-muted)', display: 'flex',
            }}
          >
            <Icon name="x" size={18} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(it => {
            const isActive = activeItem?.l === it.l
            return (
              <div
                key={it.l}
                onClick={() => go(it.k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-bg-elev)' : 'transparent',
                  border: isActive ? '1px solid var(--color-border-strong)' : '1px solid transparent',
                  fontSize: 14, fontWeight: isActive ? 600 : 500,
                }}
              >
                <Icon name={it.i} size={18} color={isActive ? 'var(--color-amber)' : 'currentColor'} />
                {it.l}
              </div>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Profile row */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--color-bg-elev)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Avatar — tap to change photo */}
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatarFile} style={{ display: 'none' }} />
            <div onClick={() => fileRef.current?.click()} style={{ flexShrink: 0, cursor: 'pointer', position: 'relative', opacity: uploading ? 0.5 : 1 }}>
              <Avatar name={displayName} size={38} color="amber" userId={user?.user_id} version={avatarVersion} />
              <div style={{
                position: 'absolute', bottom: -3, right: -3, width: 16, height: 16, borderRadius: 8,
                background: 'var(--color-amber)', display: 'grid', placeItems: 'center',
                border: '2px solid var(--color-bg-raised)',
              }}>
                <Icon name="plus" size={9} color="#1A1408" />
              </div>
            </div>

            {/* Name + rating */}
            <div onClick={() => go('/dashboard')} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                {displayRating} · Casual
              </div>
            </div>

            {/* Logout button — right side */}
            <button
              onClick={handleLogout}
              title="Log out"
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(210,106,106,0.08)',
                border: '1px solid rgba(210,106,106,0.25)',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="log-out" size={16} color="var(--color-red)" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
