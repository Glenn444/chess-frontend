import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import { useAuth } from '../lib/authStore'
import { useLogout, useMyGames } from '../lib/queries'
import { useIsMobile } from '../lib/useIsMobile'
import { useMobileNav } from '../lib/mobileNavStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuth(s => s.user)
  const isMobile = useIsMobile()
  const [profileOpen, setProfileOpen] = useState(false)

  const logoutMutation = useLogout()
  const { data: myGames = [] } = useMyGames()

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync()
    navigate('/login')
  }, [navigate, logoutMutation])

  const openNav = useMobileNav(s => s.openNav)
  const displayName = user?.username || 'Player'
  const activeGames = myGames.filter((g: any) => g.state === 'active')
  const waitingGames = myGames.filter((g: any) => g.state === 'waiting')

  const pad = isMobile ? '16px 14px' : '30px 40px'

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, padding: pad, overflow: 'auto' }}>

        {/* Header */}
        {isMobile ? (
          /* Mobile: avatar left, greeting middle, hamburger far right */
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
              display: 'grid', placeItems: 'center',
              color: '#1A1408', fontWeight: 700, fontSize: 20,
              border: '2px solid rgba(229,169,59,0.4)',
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <h1 className="font-display" style={{ fontSize: 22, margin: '3px 0 0', fontWeight: 500, letterSpacing: -0.3 }}>
                Welcome back,<br />{displayName}.
              </h1>
            </div>
            <button
              onClick={openNav}
              style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                border: '1px solid var(--color-border-strong)',
                background: 'var(--color-bg-raised)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <Icon name="menu" size={20} color="var(--color-text-primary)" />
            </button>
          </div>
        ) : (
          /* Desktop: text left, buttons right */
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
              <h1 className="font-display" style={{ fontSize: 36, margin: '4px 0 0', fontWeight: 500, letterSpacing: -0.5 }}>
                Welcome back, {displayName}.
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => navigate('/games')} style={{
                background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                color: '#1A1408', fontWeight: 600, borderRadius: 14,
                padding: '12px 20px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)',
                fontSize: 14,
              }}>
                <Icon name="plus" size={16} color="#1A1408" /> New game
              </button>
              {/* Profile circle — desktop only */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
                    border: profileOpen ? '2px solid var(--color-amber)' : '2px solid var(--color-border-strong)',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                    color: '#1A1408', fontWeight: 700, fontSize: 16,
                    transition: 'border-color .15s ease',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                    <div style={{
                      position: 'absolute', top: 52, right: 0, zIndex: 50,
                      background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
                      borderRadius: 16, padding: 16, minWidth: 220,
                      boxShadow: '0 16px 40px -12px rgba(0,0,0,0.5)',
                      animation: 'fade-in 0.15s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
                          display: 'grid', placeItems: 'center',
                          color: '#1A1408', fontWeight: 700, fontSize: 15,
                        }}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{user?.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 12,
                          border: '1px solid var(--color-border-strong)',
                          background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)',
                          cursor: 'pointer', fontSize: 14, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <Icon name="arrow-left" size={16} /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick stats — real data */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 8 : 14, marginBottom: 32,
        }}>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid rgba(229,169,59,0.25)', borderRadius: 16, padding: isMobile ? '14px 12px' : 20 }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Rating</div>
            <div className="font-display" style={{ fontSize: isMobile ? 28 : 34, fontWeight: 500, marginTop: 4, letterSpacing: -0.5, color: 'var(--color-amber)' }}>{user?.rating ?? 1200}</div>
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: isMobile ? '14px 12px' : 20 }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Active</div>
            <div className="font-display" style={{ fontSize: isMobile ? 28 : 34, fontWeight: 500, marginTop: 4, letterSpacing: -0.5, color: 'var(--color-amber)' }}>{activeGames.length}</div>
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: isMobile ? '14px 12px' : 20 }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Waiting</div>
            <div className="font-display" style={{ fontSize: isMobile ? 28 : 34, fontWeight: 500, marginTop: 4, letterSpacing: -0.5, color: 'var(--color-amber-light)' }}>{waitingGames.length}</div>
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: isMobile ? '14px 12px' : 20 }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Total</div>
            <div className="font-display" style={{ fontSize: isMobile ? 28 : 34, fontWeight: 500, marginTop: 4, letterSpacing: -0.5 }}>{myGames.length}</div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={() => navigate('/games')} style={{
            padding: '12px 20px', borderRadius: 14, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>
            <Icon name="zap" size={16} /> Play a game
          </button>
          <button onClick={() => navigate('/events')} style={{
            padding: '12px 20px', borderRadius: 14, cursor: 'pointer', fontSize: 14, fontWeight: 500,
            background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>
            <Icon name="trophy" size={16} /> Events
          </button>
        </div>
      </main>
    </div>
  )
}
