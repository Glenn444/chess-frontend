import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import MiniBoard from '../components/MiniBoard'
import { useAuth } from '../lib/authStore'
import { useLogout } from '../lib/queries'
import { useIsMobile } from '../lib/useIsMobile'

function StatCard({ label, value, sub, accent, spark }: {
  label: string; value: string; sub?: string; accent?: string; spark?: string
}) {
  return (
    <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 34, fontWeight: 500, marginTop: 4, letterSpacing: -0.5, color: accent || 'var(--color-text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>}
      {spark && (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ position: 'absolute', right: 12, bottom: 12, width: 80, height: 24, opacity: 0.7 }}>
          <polyline fill="none" stroke="var(--color-amber)" strokeWidth="1.5" points={spark} />
        </svg>
      )}
    </div>
  )
}

function ActiveGameCard({ game, onResume }: {
  game: { opponent: string; color: string; rating: string; move: number; turn: string; time: string; preset?: string }
  onResume: () => void
}) {
  return (
    <div
      onClick={onResume}
      style={{
        background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center',
        gap: 16, cursor: 'pointer', transition: 'border-color .15s ease',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'}
    >
      <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}>
        <MiniBoard preset={(game.preset || 'mid') as 'mid' | 'early' | 'end'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Avatar name={game.opponent} size={20} color={game.color as 'amber'} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>vs {game.opponent}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{game.rating}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <span className="font-mono">Move {game.move}</span>
          <span>·</span>
          <span>{game.turn === 'you' ? <span style={{ color: 'var(--color-amber)' }}>● Your turn</span> : 'Their turn'}</span>
          <span>·</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{game.time}</span>
        </div>
      </div>
      <Icon name="arrow-right" size={18} color="var(--color-text-muted)" />
    </div>
  )
}

function HistoryRow({ result, opponent, color, opening, moves, date, accuracy, isMobile }: {
  result: string; opponent: string; color: string; opening: string; moves: string; date: string; accuracy: number
  isMobile?: boolean
}) {
  const resultMap: Record<string, { l: string; c: string; bg: string }> = {
    win: { l: 'Win', c: 'var(--color-green)', bg: 'rgba(95,174,126,0.12)' },
    loss: { l: 'Loss', c: 'var(--color-red)', bg: 'rgba(210,106,106,0.12)' },
    draw: { l: 'Draw', c: 'var(--color-text-secondary)', bg: 'var(--color-bg-elev)' },
  }
  const r = resultMap[result]
  const cols = isMobile ? '50px 1fr 24px' : '60px 1.6fr 1.4fr 80px 80px 80px 24px'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '14px 8px', alignItems: 'center', borderBottom: '1px solid var(--color-border)', fontSize: 14 }}>
      <div style={{ background: r.bg, color: r.c, padding: '3px 0', borderRadius: 6, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{r.l}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={opponent} size={24} color={['amber', 'blue', 'green', 'violet', 'rose', 'teal'][opponent.length % 6] as 'amber'} />
        <div>
          <div style={{ fontWeight: 500 }}>{opponent}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>played {color}</div>
        </div>
      </div>
      {!isMobile && <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{opening}</div>}
      {!isMobile && <div className="font-mono" style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{moves}</div>}
      {!isMobile && <div className="font-mono" style={{ color: accuracy > 85 ? 'var(--color-green)' : 'var(--color-text-secondary)', fontSize: 12 }}>{accuracy}%</div>}
      {!isMobile && <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{date}</div>}
      <Icon name="arrow-right" size={14} color="var(--color-text-muted)" />
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuth(s => s.user)
  const isMobile = useIsMobile()

  const logoutMutation = useLogout()

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync()
    navigate('/login')
  }, [navigate, logoutMutation])

  const displayName = user?.username || 'Player'
  const displayRating = 1200 // default starting rating

  const statsCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'
  const gamesCols = isMobile ? '1fr' : '1fr 1fr 1fr'
  const headerFlex = isMobile ? 'column' as const : 'row' as const
  const pad = isMobile ? '16px 14px' : '30px 40px'
  const historyCols = isMobile ? '50px 1fr 24px' : '60px 1.6fr 1.4fr 80px 80px 80px 24px'
  const filterWrap = isMobile ? 'wrap' as const : 'nowrap' as const

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, padding: pad, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: 28, flexDirection: headerFlex, gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <h1 className="font-display" style={{ fontSize: isMobile ? 24 : 36, margin: '4px 0 0', fontWeight: 500, letterSpacing: -0.5 }}>
              Welcome back, {displayName}.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {!isMobile && (
              <>
                <button style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '10px 16px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="search" size={16} /> Find player
                </button>
                <button style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: 0, width: 42, height: 42, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Icon name="bell" size={18} />
                </button>
              </>
            )}
            <button onClick={() => navigate('/games')} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: isMobile ? '10px 16px' : '12px 20px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)', fontSize: isMobile ? 13 : 14 }}>
              <Icon name="plus" size={16} color="#1A1408" /> New game
            </button>
            <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 14, padding: isMobile ? '8px 14px' : '10px 16px', fontWeight: 500, cursor: 'pointer', fontSize: isMobile ? 12 : 13 }}>
              Log out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: statsCols, gap: 14, marginBottom: 28 }}>
          <StatCard label="Rating" value={String(displayRating)} sub="↑ 32 this week" accent="var(--color-amber)" spark="0,18 12,15 24,17 36,11 48,12 60,8 72,9 84,5 96,4" />
          <StatCard label="Games" value="42" sub="24W · 12L · 6D" />
          <StatCard label="Win rate" value="57%" sub="last 30 days" accent="var(--color-green)" />
          <StatCard label="Streak" value="🔥 3" sub="wins in a row" accent="var(--color-amber-light)" />
        </div>

        {/* Active games */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 className="font-display" style={{ fontSize: 22, margin: 0, fontWeight: 500 }}>Active games <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>(3)</span></h2>
            <a style={{ color: 'var(--color-amber)', fontSize: 13, cursor: 'pointer' }}>View all →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: gamesCols, gap: 12 }}>
            <ActiveGameCard onResume={() => navigate('/games')} game={{ opponent: 'Maya R', color: 'rose', rating: '1,612', move: 14, turn: 'you', time: '3:42 left', preset: 'mid' }} />
            <ActiveGameCard onResume={() => navigate('/games')} game={{ opponent: 'Tomás S', color: 'blue', rating: '1,498', move: 7, turn: 'them', time: '8:11 left', preset: 'early' }} />
            <ActiveGameCard onResume={() => navigate('/games')} game={{ opponent: 'Hina K', color: 'violet', rating: '1,580', move: 32, turn: 'you', time: '1:09 left', preset: 'end' }} />
          </div>
        </div>

        {/* Recent games */}
        <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '8px 16px 16px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 8px', flexWrap: filterWrap, gap: 8 }}>
            <h2 className="font-display" style={{ fontSize: 22, margin: 0, fontWeight: 500 }}>Recent games</h2>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['All', 'Wins', 'Losses', 'Draws'].map((t, i) => (
                <div key={t} style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
                  background: i === 0 ? 'var(--color-bg-elev-2)' : 'transparent',
                  border: i === 0 ? '1px solid var(--color-border-strong)' : '1px solid transparent',
                  color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                }}>{t}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: historyCols, padding: '8px', fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>
            <div>Result</div><div>Opponent</div>
            {!isMobile && <><div>Opening</div><div>Moves</div><div>Acc.</div><div>When</div></>}
            <div></div>
          </div>
          <HistoryRow result="win"  opponent="Daria K"   color="white" opening="Italian Game"           moves="34" date="2h ago"   accuracy={91} isMobile={isMobile} />
          <HistoryRow result="win"  opponent="Liam B"    color="black" opening="Sicilian, Najdorf"     moves="48" date="yesterday" accuracy={87} isMobile={isMobile} />
          <HistoryRow result="loss" opponent="Sven P"    color="white" opening="Queen's Gambit"        moves="56" date="yesterday" accuracy={72} isMobile={isMobile} />
          <HistoryRow result="draw" opponent="Aiko T"    color="black" opening="Caro-Kann Defense"     moves="71" date="2 days ago" accuracy={84} isMobile={isMobile} />
          <HistoryRow result="win"  opponent="Marcus V"  color="white" opening="London System"          moves="29" date="3 days ago" accuracy={94} isMobile={isMobile} />
          <HistoryRow result="loss" opponent="Priya N"   color="black" opening="King's Indian"          moves="42" date="4 days ago" accuracy={78} isMobile={isMobile} />
        </div>
      </main>
    </div>
  )
}
