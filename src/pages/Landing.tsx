import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import AnimatedBoard from '../components/AnimatedBoard'
import { useAuth } from '../lib/authStore'
import { useIsMobile } from '../lib/useIsMobile'
import logoPng from '../assets/chesske-logo.png'

function LiveGameTile({ white, black, moves, viewers, time, opening, onClick }: {
  white: { name: string; rating: number; c: string }
  black: { name: string; rating: number; c: string }
  moves: number; viewers: string; time: string; opening: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="live-tile"
      style={{
        padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
        cursor: 'pointer', transition: 'transform .15s ease, border-color .15s ease',
        background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
        borderRadius: 16,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-red)', animation: 'speaking 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--color-red)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Live</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '1px 7px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{time}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="user" size={11} /> {viewers}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-piece-light)', border: '1px solid rgba(0,0,0,0.3)', flexShrink: 0 }} />
          <Avatar name={white.name} size={22} color={white.c as 'amber'} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{white.name}</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{white.rating}</div>
          </div>
        </div>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>vs</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 0, flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{black.name}</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{black.rating}</div>
          </div>
          <Avatar name={black.name} size={22} color={black.c as 'amber'} />
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontStyle: 'italic' }}>{opening}</span>
        <span className="font-mono" style={{ color: 'var(--color-amber)' }}>move {moves}</span>
      </div>
    </div>
  )
}

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuth(s => s.user)
  const isMobile = useIsMobile()

  const liveGames = [
    { white: { name: 'Magnus_J', rating: 2840, c: 'amber' }, black: { name: 'fabi_c', rating: 2792, c: 'blue' }, moves: 24, viewers: '1.2k', time: '5+3', opening: 'Sicilian Najdorf' },
    { white: { name: 'knight_rider', rating: 1547, c: 'amber' }, black: { name: 'Maya_R', rating: 1612, c: 'rose' }, moves: 14, viewers: '8', time: '10+0', opening: 'Italian Game' },
    { white: { name: 'polgar_fan', rating: 2104, c: 'violet' }, black: { name: 'endgame_eli', rating: 2087, c: 'green' }, moves: 41, viewers: '67', time: '15+10', opening: "Queen's Gambit" },
    { white: { name: 'rookie_27', rating: 980, c: 'teal' }, black: { name: 'pawnstorm', rating: 1024, c: 'amber' }, moves: 9, viewers: '3', time: '3+2', opening: 'London System' },
    { white: { name: 'Tomás_S', rating: 1498, c: 'blue' }, black: { name: 'Hina_K', rating: 1580, c: 'violet' }, moves: 32, viewers: '12', time: '10+5', opening: 'Caro-Kann' },
    { white: { name: 'openings_db', rating: 1820, c: 'green' }, black: { name: 'tactic_x', rating: 1845, c: 'rose' }, moves: 18, viewers: '24', time: '5+0', opening: "King's Indian" },
  ]

  return (
    <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 20px' : '20px 40px', borderBottom: '1px solid var(--color-border)' }} className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoPng} alt="Chesske" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="font-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>Chesske</span>
        </div>
        <div className="nav-links" style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 22, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          <a onClick={() => navigate('/events')} style={{ cursor: 'pointer', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Events</a>
          {user ? (
            <button onClick={() => navigate('/dashboard')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '8px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 14 }}>Dashboard</button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Log in</button>
              <button onClick={() => navigate('/register')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '8px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 14, boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)' }}>Sign up</button>
            </>
          )}
        </div>
        <button onClick={() => setNavOpen(o => !o)} style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', borderRadius: 10, width: 40, height: 40, color: 'var(--color-text-primary)', cursor: 'pointer', display: 'none' }} className="nav-burger" aria-label="Menu">
          <Icon name={navOpen ? 'x' : 'zap'} size={20} />
        </button>
      </nav>
      {navOpen && (
        <div className="nav-mobile-menu" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 24px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-raised)' }}>
          <a style={{ color: 'var(--color-text-secondary)', fontSize: 15, cursor: 'pointer' }} onClick={() => { setNavOpen(false); navigate('/events') }}>Events</a>
          {user ? (
            <button onClick={() => { setNavOpen(false); navigate('/dashboard') }} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '10px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer' }}>Dashboard</button>
          ) : (
            <>
              <button onClick={() => { setNavOpen(false); navigate('/login') }} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '10px 16px', fontWeight: 500, cursor: 'pointer' }}>Log in</button>
              <button onClick={() => { setNavOpen(false); navigate('/register') }} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '10px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer' }}>Sign up</button>
            </>
          )}
        </div>
      )}

      {/* Hero */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 60, padding: '80px 40px 30px', alignItems: 'center', maxWidth: 1320, margin: '0 auto', width: '100%' }} className="landing-hero">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.32)', color: 'var(--color-amber-light)', fontSize: 12, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-amber)' }} />
            Live · 14,238 players online
          </div>
          <h1 className="font-display landing-h1" style={{ lineHeight: 1.02, margin: 0, letterSpacing: -2, fontWeight: 500, fontSize: 76 }}>
            Chess that<br/>
            <span style={{ color: 'var(--color-amber)', fontStyle: 'italic' }}>actually</span> feels<br/>
            like a conversation.
          </h1>
          <p className="landing-sub" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.55, marginTop: 24, maxWidth: 480, fontSize: 18 }}>
            Play live games with built-in voice and chat. No downloads, no clutter — just you, your opponent, and 64 squares.
          </p>
          <div className="landing-cta" style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '14px 26px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)', textAlign: 'center' }}>
              Play your first game →
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '14px 22px', fontWeight: 500, cursor: 'pointer', fontSize: 15, textAlign: 'center' }}>
              I already have an account
            </button>
          </div>

          <div className="trust-strip" style={{ display: 'flex', gap: 32, marginTop: 56, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { v: '1.4M', l: 'games played' },
              { v: '180+', l: 'countries' },
              { v: '4.9★', l: 'App Store' },
            ].map(s => (
              <div key={s.l}>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="landing-visual" style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <div className="hero-glow" style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,169,59,0.18), transparent 70%)', filter: 'blur(40px)' }} />
          <div className="hero-board" style={{ position: 'relative', transform: 'rotate(-4deg)' }}>
            <AnimatedBoard size={460} />
          </div>
          {/* floating voice chip */}
          <div className="hero-chip-voice" style={{ position: 'absolute', top: 20, right: 0, transform: 'rotate(3deg)' }}>
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, whiteSpace: 'nowrap' }}>
              <Avatar name="Maya R" size={28} color="rose" speaking />
              <div style={{ display: 'flex', gap: 2, alignItems: 'end', height: 14, flexShrink: 0 }}>
                {[0.3, 0.7, 0.5, 0.9, 0.4].map((_h, i) => (
                  <div key={i} className="bar" style={{ width: 3, height: 14, background: 'var(--color-amber)', borderRadius: 2, animationDelay: `${i * 0.1}s`, animation: 'speaking 0.7s ease-in-out infinite', transformOrigin: 'center' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Maya is talking</span>
            </div>
          </div>
          {/* floating muted chip — second user */}
          <div className="hero-chip-mute" style={{ position: 'absolute', bottom: 24, right: -12, transform: 'rotate(-2deg)' }}>
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, whiteSpace: 'nowrap' }}>
              <Avatar name="Alex C" size={28} color="amber" />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Muted</span>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="var(--color-red)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l18 18M9 9v3a3 3 0 0 0 5 2.2M15 9V6a3 3 0 0 0-5.5-1.7M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.5 2.6M12 18v3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE GAMES */}
      <section className="landing-live" style={{ padding: '20px 40px 80px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.32)', color: 'var(--color-amber-light)', fontSize: 12, marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-red)', animation: 'speaking 1.4s ease-in-out infinite' }} />
              4,612 games in progress
            </div>
            <h2 className="font-display" style={{ margin: 0, fontWeight: 500, letterSpacing: -0.8, fontSize: 42 }}>
              Watch <span style={{ color: 'var(--color-amber)', fontStyle: 'italic' }}>live</span> games right now.
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0', maxWidth: 540, fontSize: 15 }}>
              From titled players in classical to rapid-fire bullet wars — sit in on any game and learn from how others play.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['Featured', 'Bullet', 'Blitz', 'Rapid', 'Classical'].map((t, i) => (
              <div key={t} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                background: i === 0 ? 'var(--color-bg-elev-2)' : 'transparent',
                border: i === 0 ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border)',
                color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: i === 0 ? 600 : 500,
              }}>{t}</div>
            ))}
          </div>
        </div>

        <div className="live-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {liveGames.map((g, i) => (
            <LiveGameTile key={i} {...g} onClick={() => navigate('/register')} />
          ))}
        </div>

        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <button onClick={() => navigate('/register')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            See all live games <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" style={{ padding: '20px 40px 100px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { i: 'mic' as const, t: 'Voice, built-in', d: 'Crystal-clear WebRTC audio. No setup, no third-party app.', c: 'amber' },
            { i: 'zap' as const, t: 'Real-time, anywhere', d: 'Sub-100ms moves over WebSocket. Plays on phone, tablet, desktop.', c: 'blue' },
            { i: 'trophy' as const, t: 'Track your rise', d: 'ELO, openings library, win streaks, and replays of every game.', c: 'green' },
          ].map(f => (
            <div key={f.t} style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.c === 'amber' ? 'rgba(229,169,59,0.12)' : f.c === 'blue' ? 'rgba(126,168,229,0.12)' : 'rgba(95,174,126,0.12)',
                color: f.c === 'amber' ? 'var(--color-amber)' : f.c === 'blue' ? 'var(--color-blue)' : 'var(--color-green)',
                display: 'grid', placeItems: 'center', marginBottom: 18,
              }}>
                <Icon name={f.i} size={22} />
              </div>
              <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 8px', fontWeight: 500 }}>{f.t}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: isMobile && !user ? '24px 20px 80px' : '30px 40px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontSize: 13, flexWrap: 'wrap', gap: 12 }} className="landing-footer">
        <div>© 2026 Chesske</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Privacy</a>
          <a style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Terms</a>
          <a style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Press</a>
        </div>
      </footer>

    </div>
  )
}
