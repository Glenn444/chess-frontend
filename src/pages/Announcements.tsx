import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import logoPng from '../assets/chesske-logo.png'

const EVENTS = [
  {
    id: '1',
    title: 'Weekly Blitz Tournament',
    date: 'May 15, 2026 · 8:00 PM UTC',
    type: 'Tournament',
    description: 'Join our weekly 5+3 blitz tournament. Open to all rating levels. Top 3 players win premium membership.',
    prize: '🏆 1st: 3mo Premium · 2nd: 1mo · 3rd: 500 Chesske coins',
  },
  {
    id: '2',
    title: 'Voice Chat Playtest — New Audio Codec',
    date: 'May 18, 2026 · 6:00 PM UTC',
    type: 'Playtest',
    description: 'We\'re testing a new Opus-based audio codec for voice chat. Join us for an evening of games with the dev team and help us tune the quality.',
    prize: 'All participants get an exclusive "Beta Tester" badge',
  },
  {
    id: '3',
    title: 'Community Vote: Next Piece Theme',
    date: 'May 20, 2026 · All day',
    type: 'Community',
    description: 'Vote on which piece theme we add next! Candidates: Horsey, Pixel, Riohacha, Leipzig. The winning set goes live in the next update.',
    prize: 'Your choice shapes the game',
  },
  {
    id: '4',
    title: 'Chesske Anniversary — 6 Months Live',
    date: 'May 25, 2026 · All day',
    type: 'Special',
    description: 'Celebrating 6 months since launch! Double rating gain all day, special anniversary board theme unlock, and a 24-hour rapid arena.',
    prize: 'Special anniversary board theme for all players',
  },
  {
    id: '5',
    title: 'Puzzle Rush Challenge',
    date: 'May 28, 2026 · 7:00 PM UTC',
    type: 'Challenge',
    description: 'Solve as many puzzles as you can in 10 minutes. Compete on the live leaderboard. Puzzles range from beginner to grandmaster difficulty.',
    prize: 'Top 10 players earn 200 Chesske coins each',
  },
]

const typeColors: Record<string, string> = {
  Tournament: 'var(--color-amber)',
  Playtest: 'var(--color-blue)',
  Community: 'var(--color-green)',
  Special: 'var(--color-violet)',
  Challenge: 'var(--color-red)',
}

export default function Announcements() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)

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
              <button onClick={() => navigate('/login')} className="btn-ghost" style={{ padding: '8px 16px', background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Log in</button>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {EVENTS.map(event => (
            <div
              key={event.id}
              style={{
                background: 'var(--color-bg-raised)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                padding: isMobile ? 20 : 28,
                transition: 'border-color .15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  background: `${typeColors[event.type] || 'var(--color-amber)'}22`,
                  color: typeColors[event.type] || 'var(--color-amber)',
                  border: `1px solid ${typeColors[event.type] || 'var(--color-amber)'}33`,
                }}>
                  {event.type}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{event.date}</span>
              </div>

              <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 500 }}>
                {event.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
                {event.description}
              </p>

              <div style={{
                fontSize: 13, color: 'var(--color-amber)',
                background: 'rgba(229,169,59,0.08)',
                border: '1px solid rgba(229,169,59,0.2)',
                borderRadius: 10,
                padding: '8px 14px',
                display: 'inline-block',
              }}>
                {event.prize}
              </div>
            </div>
          ))}
        </div>
      </main>

    </div>
  )
}
