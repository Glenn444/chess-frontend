import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import { useEventStore } from '../lib/eventStore'
import FloatingNav from '../components/FloatingNav'
import logoPng from '../assets/chesske-logo.png'

const typeColors: Record<string, string> = {
  Tournament: 'var(--color-amber)',
  Playtest: 'var(--color-blue)',
  Community: 'var(--color-green)',
  Special: 'var(--color-violet)',
  Challenge: 'var(--color-red)',
}

export default function Events() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const { events, reactions, toggleLike, toggleDislike } = useEventStore()
  const [sharedId, setSharedId] = useState<string | null>(null)

  const handleShare = async (eventId: string) => {
    const link = `${window.location.origin}/events/${eventId}`
    try {
      await navigator.clipboard.writeText(link)
      setSharedId(eventId)
      setTimeout(() => setSharedId(null), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setSharedId(eventId)
      setTimeout(() => setSharedId(null), 2000)
    }
  }

  return (
    <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
      {/* Nav */}
      <nav className="landing-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 20px' : '20px 40px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoPng} alt="Chesske" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="font-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Chesske</span>
        </div>
        <div className="nav-links" style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 22, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          <a onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Home</a>
          <a style={{ cursor: 'pointer', color: 'var(--color-amber)', textDecoration: 'none', fontWeight: 600 }}>Events</a>
          {user ? (
            <button onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '8px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 14 }}>Dashboard</button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Log in</button>
              <button onClick={() => navigate('/register')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '8px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 14 }}>Sign up</button>
            </>
          )}
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: isMobile ? '24px 16px 100px' : '60px 40px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: isMobile ? 32 : 48, margin: 0, fontWeight: 500, letterSpacing: -0.7 }}>
            Events & Announcements
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0', fontSize: isMobile ? 14 : 16 }}>
            Tournaments, playtests, community votes, and more.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {events.map(event => {
            const reaction = reactions[event.id]
            return (
              <div
                key={event.id}
                style={{
                  background: 'var(--color-bg-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'border-color .15s ease',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {event.image && (
                  <div style={{ width: '100%', height: isMobile ? 180 : 240, overflow: 'hidden' }}>
                    <img
                      src={event.image}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ padding: isMobile ? 18 : 24 }}>
                  {/* Type badge + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                      background: `${typeColors[event.type] || 'var(--color-amber)'}22`,
                      color: typeColors[event.type] || 'var(--color-amber)',
                      border: `1px solid ${typeColors[event.type] || 'var(--color-amber)'}33`,
                    }}>
                      {event.type}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{event.date}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 500 }}>
                    {event.title}
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
                    {event.description.slice(0, 150)}{event.description.length > 150 ? '...' : ''}
                  </p>

                  {/* Like / Dislike / Share / Comments bar */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggleLike(event.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 999,
                        border: reaction === 'like' ? '1px solid var(--color-amber)' : '1px solid transparent',
                        background: reaction === 'like' ? 'rgba(229,169,59,0.1)' : 'transparent',
                        color: reaction === 'like' ? 'var(--color-amber)' : 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        transition: 'all .15s ease',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill={reaction === 'like' ? 'var(--color-amber)' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 22H3a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h4l6-6a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-2 9a2 2 0 0 1-2 2h-7" />
                      </svg>
                      {event.likes}
                    </button>

                    <button
                      onClick={() => toggleDislike(event.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 999,
                        border: reaction === 'dislike' ? '1px solid var(--color-red)' : '1px solid transparent',
                        background: reaction === 'dislike' ? 'rgba(210,106,106,0.1)' : 'transparent',
                        color: reaction === 'dislike' ? 'var(--color-red)' : 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        transition: 'all .15s ease',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill={reaction === 'dislike' ? 'var(--color-red)' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 2h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4l-6 6a2 2 0 0 1-2-2v-4H4a2 2 0 0 1-2-2l2-9a2 2 0 0 1 2-2h7" />
                      </svg>
                      {event.dislikes}
                    </button>

                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 999, border: '1px solid transparent',
                        background: 'transparent', color: 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        transition: 'all .15s ease', marginLeft: 'auto',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {event.comments.length}
                    </button>

                    <button
                      onClick={() => handleShare(event.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 999, border: '1px solid transparent',
                        background: sharedId === event.id ? 'rgba(126,168,229,0.1)' : 'transparent',
                        color: sharedId === event.id ? 'var(--color-blue)' : 'var(--color-text-muted)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        transition: 'all .15s ease',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                      {sharedId === event.id ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {!user && <FloatingNav />}
    </div>
  )
}
