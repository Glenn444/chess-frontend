import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import { useIsMobile } from '../lib/useIsMobile'
import { useCreateGame } from '../lib/queries'

function ShareLink({ time, increment, color, onBack }: {
  time: string; increment: string; color: string; onBack: () => void
}) {
  const [copied, setCopied] = useState(false)
  const gameLink = `${window.location.origin}/game?time=${time}&increment=${increment}&color=${color}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = gameLink
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
        background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 12px 30px -10px rgba(229,169,59,0.4)',
      }}>
        <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="#1A1408" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      <h2 className="font-display" style={{ fontSize: 28, margin: '0 0 10px', fontWeight: 500, letterSpacing: -0.5 }}>
        Share this link
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 20px', fontSize: 14, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
        Send this link to your opponent. They'll join your game with the same time control and settings.
      </p>

      <div style={{
        display: 'flex', gap: 8, maxWidth: 480, margin: '0 auto 20px',
        background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)',
        borderRadius: 14, padding: 6,
      }}>
        <div className="font-mono" style={{
          flex: 1, padding: '10px 12px', fontSize: 12, color: 'var(--color-amber)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textAlign: 'left', userSelect: 'all',
        }}>
          {gameLink}
        </div>
        <button onClick={handleCopy} style={{
          padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: copied ? 'var(--color-green)' : 'var(--color-amber)',
          color: copied ? '#fff' : '#1A1408', fontWeight: 600, fontSize: 13,
          whiteSpace: 'nowrap', transition: 'all .15s ease',
          minWidth: copied ? 90 : 70,
        }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer' }}>
          ← Change settings
        </button>
        <button onClick={() => window.open(gameLink, '_self')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)' }}>
          Join game →
        </button>
      </div>
    </div>
  )
}

export default function Matchmaking() {
  const [phase, setPhase] = useState<'config' | 'searching' | 'share'>('config')
  const [time, setTime] = useState('10')
  const [increment, setIncrement] = useState('0')
  const [color, setColor] = useState('random')
  const [rated, setRated] = useState(true)
  const [range, setRange] = useState(150)
  const [elapsed, setElapsed] = useState(0)
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const createGame = useCreateGame()
  const playerRating = 1200

  useEffect(() => {
    if (phase !== 'searching') return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const presets = [
    { l: 'Unlimited', t: '∞', c: 'var(--color-text-muted)', i: 'handshake' as const },
    { l: 'Blitz', t: '5+0', c: 'var(--color-amber)', i: 'zap' as const },
    { l: 'Rapid', t: '10+0', c: 'var(--color-blue)', i: 'clock' as const },
    { l: 'Classical', t: '30+20', c: 'var(--color-green)', i: 'trophy' as const },
  ]

  const padding = isMobile ? '16px 14px' : '30px 40px'
  const titleSize = isMobile ? 28 : 40

  /* ──── Config phase ──── */
  if (phase === 'config') {
    const content = (
      <div style={{ width: '100%', maxWidth: 720 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 className="font-display" style={{ fontSize: titleSize, margin: 0, fontWeight: 500, letterSpacing: -0.7 }}>New game</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0', fontSize: isMobile ? 14 : 16 }}>
            Pick a time control and we'll find you a worthy opponent.
          </p>
        </div>

        <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 14 }}>Time control</div>
          <div className="mm-presets" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {presets.map(p => {
              const presetTime = p.t === '∞' ? '0' : p.t.split('+')[0]
              return (
                <div key={p.l} onClick={() => setTime(presetTime)}
                  style={{
                    padding: isMobile ? '12px 10px' : '16px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    border: time === presetTime ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                    background: time === presetTime ? 'rgba(229,169,59,0.06)' : 'var(--color-bg-elev)',
                  }}>
                  <Icon name={p.i} size={isMobile ? 18 : 20} color={p.c} />
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>{p.l}</div>
                  <div className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{p.t}</div>
                </div>
              )
            })}
          </div>

          <div className="mm-time-row" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Minutes per side</span><span className="font-mono" style={{ color: 'var(--color-amber)' }}>{time}</span>
              </div>
              <input type="range" min="1" max="60" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', accentColor: 'var(--color-amber)' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Increment (sec)</span><span className="font-mono" style={{ color: 'var(--color-amber)' }}>{increment}</span>
              </div>
              <input type="range" min="0" max="30" value={increment} onChange={e => setIncrement(e.target.value)} style={{ width: '100%', accentColor: 'var(--color-amber)' }} />
            </div>
          </div>
        </div>

        <div className="mm-row" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: isMobile ? 16 : 20 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 12 }}>Play as</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { k: 'white', l: 'White', b: 'var(--color-piece-light)' },
                { k: 'random', l: 'Random', b: 'linear-gradient(90deg, var(--color-piece-light) 50%, var(--color-piece-dark) 50%)' },
                { k: 'black', l: 'Black', b: 'var(--color-piece-dark)' },
              ].map(o => (
                <div key={o.k} onClick={() => setColor(o.k)} style={{
                  padding: 12, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: color === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: color === o.k ? 'rgba(229,169,59,0.06)' : 'var(--color-bg-elev)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: o.b, margin: '0 auto 6px', border: '1px solid rgba(0,0,0,0.3)' }} />
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{o.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: isMobile ? 16 : 20 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 12 }}>Game type</div>
            <div onClick={() => setRated(!rated)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, cursor: 'pointer', background: 'var(--color-bg-elev)' }}>
              <div style={{
                width: 36, height: 22, borderRadius: 999,
                background: rated ? 'var(--color-amber)' : 'var(--color-border-strong)',
                position: 'relative', transition: 'background .2s ease',
              }}>
                <div style={{ position: 'absolute', top: 2, left: rated ? 16 : 2, width: 18, height: 18, borderRadius: '50%', background: '#1A1408', transition: 'left .2s ease' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{rated ? 'Rated' : 'Casual'}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{rated ? 'Affects your ELO' : 'No rating change'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: isMobile ? 16 : 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Opponent rating range</div>
            <div className="font-mono" style={{ fontSize: 12, color: 'var(--color-amber)' }}>±{range} ({playerRating - range}–{playerRating + range})</div>
          </div>
          <input type="range" min="50" max="500" step="50" value={range} onChange={e => setRange(+e.target.value)} style={{ width: '100%', accentColor: 'var(--color-amber)' }} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/games')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer', flex: isMobile ? '1 1 100%' : 'none' }}>Cancel</button>
          <button onClick={async () => {
            try {
              const playerColor = color === 'white' ? 'w' as const : color === 'black' ? 'b' as const : 'w' as const
              const minutes = parseInt(time)
              const validTimes = [5, 10, 15, 30, 45, 60] as const
              const timeControl: 0 | 5 | 10 | 15 | 30 | 45 | 60 = minutes === 0
                ? 0
                : validTimes.reduce((prev, curr) => Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev)
              await createGame.mutateAsync({ opponent: 'person', player_color: playerColor, time_control: timeControl })
              setPhase('share')
            } catch { /* error shown via mutation */ }
          }} disabled={createGame.isPending} style={{ minWidth: 200, background: createGame.isPending ? 'var(--color-border-strong)' : 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: createGame.isPending ? 'var(--color-text-muted)' : '#1A1408', fontWeight: 600, borderRadius: 14, padding: '14px 24px', border: '1px solid rgba(0,0,0,0.15)', cursor: createGame.isPending ? 'not-allowed' : 'pointer', boxShadow: createGame.isPending ? 'none' : '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)', fontSize: 15, flex: isMobile ? '1 1 100%' : 'none', opacity: createGame.isPending ? 0.6 : 1 }}>
            {createGame.isPending ? 'Creating…' : 'Find opponent →'}
          </button>
        </div>
      </div>
    )

    return (
      <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
        {!isMobile && <Sidebar />}
        <main className="dashboard-main" style={{ flex: 1, padding, display: 'grid', placeItems: 'center', overflow: 'auto' }}>
          {content}
        </main>
      </div>
    )
  }

  /* ──── Share phase ──── */
  if (phase === 'share') {
    return (
      <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
        {!isMobile && <Sidebar />}
        <main style={{ flex: 1, padding, display: 'grid', placeItems: 'center', overflow: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 600 }}>
            <ShareLink time={time} increment={increment} color={color} onBack={() => setPhase('config')} />

            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <button onClick={() => setPhase('searching')} style={{ background: 'transparent', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                Or search for a random opponent instead →
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /* ──── Searching phase ──── */
  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, padding, display: 'grid', placeItems: 'center', overflow: 'auto' }}>
        <div className="fade-in" style={{ textAlign: 'center', padding: '20px 0', maxWidth: 600 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
            <div style={{
              width: isMobile ? 140 : 180, height: isMobile ? 140 : 180, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(229,169,59,0.18), transparent 70%)',
              position: 'absolute', inset: 0, animation: 'speaking 1.4s ease-in-out infinite',
            }} />
            <div className="pulse-ring" style={{
              width: isMobile ? 100 : 140, height: isMobile ? 100 : 140, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
              display: 'grid', placeItems: 'center', margin: isMobile ? 20 : 20,
              boxShadow: '0 20px 50px -20px rgba(229,169,59,0.6)',
            }}>
              <Icon name="logo" size={isMobile ? 40 : 56} color="#1A1408" />
            </div>
          </div>

          <h1 className="font-display" style={{ fontSize: isMobile ? 26 : 36, margin: 0, fontWeight: 500, letterSpacing: -0.5 }}>Finding opponent…</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '10px 0 28px', fontSize: isMobile ? 13 : 15 }}>
            Looking for someone rated <span style={{ color: 'var(--color-amber)' }}>{playerRating - range}–{playerRating + range}</span> to play <span className="font-mono" style={{ color: 'var(--color-amber)' }}>{time}+{increment}</span>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Wait time</div>
              <div className="font-mono font-display" style={{ fontSize: 28, fontWeight: 500, color: 'var(--color-amber)' }}>{formatTime(elapsed)}</div>
            </div>
            <div style={{ width: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Players in queue</div>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 500 }}>{Math.max(0, 147 - elapsed)}</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--color-amber)',
                  opacity: ((elapsed + i) % 5) < 3 ? 1 : 0.2, transition: 'opacity .25s ease',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {elapsed < 3 ? 'Connecting to matchmaker…' :
               elapsed < 8 ? 'Scanning queue…' :
               elapsed < 15 ? 'Found 3 candidates, evaluating…' :
               'Slightly slow today — hang tight.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPhase('config')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer', fontSize: isMobile ? 13 : 14 }}>← Change settings</button>
            <button onClick={() => navigate('/games')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)', fontSize: isMobile ? 13 : 14 }}>
            <Icon name="arrow-right" size={14} /> Go to games
            </button>
          </div>

          <div style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Tip: voice chat is <strong style={{ color: 'var(--color-amber)' }}>on by default</strong> for rated games. You can mute before the first move.
          </div>
        </div>
      </main>
    </div>
  )
}
