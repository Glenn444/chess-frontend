import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import MiniBoard from '../components/MiniBoard'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import { useMyGames, useWaitingGames, useCreateGame, useJoinGame } from '../lib/queries'
import logoPng from '../assets/chesske-logo.png'

export default function Games() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const [color, setColor] = useState<'w' | 'b'>('w')

  const { data: myGames = [], isLoading: loadingMine } = useMyGames()
  const { data: waitingGames = [], isLoading: loadingWaiting } = useWaitingGames()
  const createGame = useCreateGame()
  const joinGame = useJoinGame()

  const handleCreateGame = async () => {
    try {
      const game = await createGame.mutateAsync({ opponent: 'person', player_color: color })
      const g = game as { id: string }
      navigate(`/game/${g.id}`)
    } catch { /* error shown below */ }
  }

  const handleJoinGame = async (gameId: string) => {
    try {
      await joinGame.mutateAsync(gameId)
      navigate(`/game/${gameId}`)
    } catch { /* error shown below */ }
  }

  const pad = isMobile ? '16px 14px' : '30px 40px'

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, padding: pad, overflow: 'auto', paddingBottom: isMobile ? 100 : pad }}>
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={logoPng} alt="Chesske" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              <span className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>Chesske</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                <Icon name="user" size={16} />
              </button>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-display" style={{ fontSize: isMobile ? 28 : 36, margin: '0 0 4px', fontWeight: 500, letterSpacing: -0.5 }}>
            Play Chess
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            Join a waiting game or create your own.
          </p>
        </div>

        {/* Create Game */}
        <div style={{
          background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
          borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 28,
        }}>
          <h2 className="font-display" style={{ fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>Create a new game</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { k: 'w' as const, l: 'White', b: 'var(--color-piece-light)' },
                { k: 'b' as const, l: 'Black', b: 'var(--color-piece-dark)' },
              ]).map(o => (
                <button key={o.k} onClick={() => setColor(o.k)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                  border: color === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: color === o.k ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                  color: 'var(--color-text-primary)',
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: o.b, border: '1px solid rgba(0,0,0,0.2)' }} />
                  Play as {o.l}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreateGame}
              disabled={createGame.isPending}
              style={{
                padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                color: '#1A1408', fontWeight: 600, fontSize: 14,
                opacity: createGame.isPending ? 0.6 : 1,
              }}
            >
              {createGame.isPending ? 'Creating…' : 'Create game →'}
            </button>
          </div>
          {createGame.error && (
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-red)' }}>
              {createGame.error instanceof Error ? createGame.error.message : 'Failed to create game'}
            </div>
          )}
        </div>

        {/* My Active Games */}
        {loadingMine ? null : myGames.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 className="font-display" style={{ fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>
              My games ({myGames.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myGames.map((g: any) => (
                <div key={g.id} onClick={() => navigate(`/game/${g.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
                  borderRadius: 14, cursor: 'pointer', transition: 'border-color .15s ease',
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}>
                    <MiniBoard preset={g.status === 'playing' ? 'mid' : 'early'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      vs {g.white_player === user?.username ? g.black_player : g.white_player}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {g.status === 'waiting' ? 'Waiting for opponent…' : g.current_player === g.player_color ? '● Your turn' : 'Opponent\'s turn'}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: g.status === 'playing' ? 'rgba(95,174,126,0.12)' : 'rgba(229,169,59,0.12)',
                    color: g.status === 'playing' ? 'var(--color-green)' : 'var(--color-amber)',
                  }}>
                    {g.status === 'playing' ? 'Active' : 'Waiting'}
                  </span>
                  <Icon name="arrow-right" size={16} color="var(--color-text-muted)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting Games (Lobby) */}
        <div>
          <h2 className="font-display" style={{ fontSize: 20, margin: '0 0 14px', fontWeight: 500 }}>
            Open games — join one ({waitingGames.length})
          </h2>
          {loadingWaiting ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</p>
          ) : waitingGames.length === 0 ? (
            <div style={{ padding: '24px 18px', textAlign: 'center', background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                No open games right now. Create one above!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {waitingGames.map((g: any) => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                  background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
                  borderRadius: 14,
                }}>
                  <Avatar name={g.white_player} size={36} color="amber" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.white_player}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Playing white · Waiting for opponent
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinGame(g.id)}
                    disabled={joinGame.isPending}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                      color: '#1A1408', fontWeight: 600, fontSize: 13,
                      opacity: joinGame.isPending ? 0.6 : 1,
                    }}
                  >
                    {joinGame.isPending ? 'Joining…' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
