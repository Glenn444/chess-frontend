import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import MiniBoard from '../components/MiniBoard'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import { useMyGames, useWaitingGames, useCreateGame, useJoinGame, useDeleteGame } from '../lib/queries'
import { useToasts } from '../lib/toastStore'
import { useMobileNav } from '../lib/mobileNavStore'

export default function Games() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const [color, setColor] = useState<'w' | 'b'>('w')
  const [timeControl, setTimeControl] = useState(600)

  const timePresets = [
    { label: '1 min', seconds: 60 },
    { label: '3 min', seconds: 180 },
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15|10', seconds: 900, increment: 10 },
    { label: '30 min', seconds: 1800 },
  ]

  const { data: myGames = [], isLoading: loadingMine } = useMyGames()
  const { data: waitingGames = [], isLoading: loadingWaiting } = useWaitingGames()
  const createGame = useCreateGame()
  const joinGame = useJoinGame()
  const deleteGame = useDeleteGame()
  const addToast = useToasts(s => s.addToast)

  const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

  const openNav = useMobileNav(s => s.openNav)
  const displayName = user?.username || 'Player'
  const pendingGames = myGames.filter((g: any) => g.state === 'waiting')
  const hasPendingGame = pendingGames.length > 0
  const myGameIds = new Set(myGames.map((g: any) => g.id))

  const handleCreateGame = async () => {
    if (hasPendingGame) {
      addToast('You already have a pending game. Cancel it before creating a new one.', 'info')
      return
    }
    try {
      const preset = timePresets.find(t => t.seconds === timeControl)
      const game = await createGame.mutateAsync({
        opponent: 'person',
        player_color: color,
        initial_time_seconds: timeControl,
        increment_seconds: preset?.increment || 0,
      })
      const g = game as { id: string }
      navigate(`/game/${g.id}`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create game', 'error')
    }
  }

  const handleJoinGame = async (gameId: string) => {
    try {
      await joinGame.mutateAsync(gameId)
      navigate(`/game/${gameId}`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to join game', 'error')
    }
  }

  const handleCopyLink = async (gameId: string) => {
    const link = `${window.location.origin}/game/${gameId}?join=true`
    try {
      await navigator.clipboard.writeText(link)
      addToast('Game link copied!', 'success')
    } catch {
      addToast('Failed to copy link', 'error')
    }
  }

  const handleShare = async (gameId: string) => {
    const link = `${window.location.origin}/game/${gameId}?join=true`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my chess game', text: 'Play chess with me!', url: link })
      } catch {
        // user cancelled or share failed — fall back to copy
        handleCopyLink(gameId)
      }
    } else {
      handleCopyLink(gameId)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    try {
      await deleteGame.mutateAsync(gameId)
      addToast('Game deleted', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete game', 'error')
    }
  }

  const pad = isMobile ? '16px 14px' : '30px 40px'

  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && <Sidebar />}
      <main style={{ flex: 1, padding: pad, overflow: 'auto', paddingBottom: isMobile ? 100 : pad }}>
        {/* Mobile header — avatar + title + hamburger */}
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
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
              <h1 className="font-display" style={{ fontSize: 22, margin: 0, fontWeight: 500, letterSpacing: -0.3 }}>
                Play Chess
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: '2px 0 0' }}>
                Join a game or create your own.
              </p>
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
          <div style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: 36, margin: '0 0 4px', fontWeight: 500, letterSpacing: -0.5 }}>
              Play Chess
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Join a waiting game or create your own.
            </p>
          </div>
        )}

        {/* Create Game */}
        <div style={{
          background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)',
          borderRadius: 20, padding: isMobile ? 14 : 24, marginBottom: 28,
        }}>
          <h2 className="font-display" style={{ fontSize: isMobile ? 17 : 20, margin: '0 0 14px', fontWeight: 500 }}>Create a new game</h2>
          {hasPendingGame && (
            <div style={{
              padding: '10px 14px', marginBottom: 14, borderRadius: 12,
              background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.25)',
              fontSize: 13, color: 'var(--color-amber)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="zap" size={14} />
              You have a pending game waiting for an opponent. Complete or cancel it before creating a new one.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Color selector */}
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { k: 'w' as const, l: 'White', b: 'var(--color-piece-light)' },
                { k: 'b' as const, l: 'Black', b: 'var(--color-piece-dark)' },
              ]).map(o => (
                <button key={o.k} onClick={() => setColor(o.k)} disabled={hasPendingGame} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  borderRadius: 12, cursor: hasPendingGame ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500,
                  border: color === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: color === o.k ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                  color: 'var(--color-text-primary)',
                  opacity: hasPendingGame ? 0.5 : 1,
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: o.b, border: '1px solid rgba(0,0,0,0.2)' }} />
                  Play as {o.l}
                </button>
              ))}
            </div>

            {/* Time control */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {timePresets.map(t => (
                <button key={t.seconds} onClick={() => setTimeControl(t.seconds)} disabled={hasPendingGame} style={{
                  padding: '8px 14px', borderRadius: 10, cursor: hasPendingGame ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                  border: timeControl === t.seconds ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: timeControl === t.seconds ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                  color: 'var(--color-text-primary)',
                  opacity: hasPendingGame ? 0.5 : 1,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateGame}
              disabled={createGame.isPending || hasPendingGame}
              style={{
                padding: '10px 22px', borderRadius: 12, border: 'none', cursor: hasPendingGame ? 'not-allowed' : 'pointer',
                background: hasPendingGame ? 'var(--color-border-strong)' : 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                color: hasPendingGame ? 'var(--color-text-muted)' : '#1A1408',
                fontWeight: 600, fontSize: 14,
                opacity: (createGame.isPending || hasPendingGame) ? 0.6 : 1,
                whiteSpace: 'nowrap',
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

        {/* Waiting Games (Lobby) — ABOVE My Games */}
        <div style={{ marginBottom: 28 }}>
          <h2 className="font-display" style={{ fontSize: isMobile ? 17 : 20, margin: '0 0 14px', fontWeight: 500 }}>
            Open games — join one ({waitingGames.length})
          </h2>
          {loadingWaiting ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading…</p>
          ) : (() => {
            const otherPeoplesGames = waitingGames.filter((g: any) => !myGameIds.has(g.id))
            if (otherPeoplesGames.length === 0) {
              return (
                <div style={{ padding: '24px 18px', textAlign: 'center', background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                    No open games right now. Create one above!
                  </p>
                </div>
              )
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherPeoplesGames.map((g: any) => (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
                    padding: isMobile ? '12px 14px' : '14px 18px',
                    background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
                    borderRadius: 14,
                  }}>
                    <Avatar name="Opponent" size={isMobile ? 30 : 36} color="amber" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>Waiting player</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Waiting for opponent
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleShare(g.id)}
                        style={{
                          padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: 8,
                          border: '1px solid var(--color-border-strong)',
                          background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)',
                          cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
                        }}
                      >
                        {isMobile ? 'Share' : 'Copy link'}
                      </button>
                      <button
                        onClick={() => handleJoinGame(g.id)}
                        disabled={joinGame.isPending}
                        style={{
                          padding: isMobile ? '8px 14px' : '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                          color: '#1A1408', fontWeight: 600, fontSize: isMobile ? 12 : 13,
                          opacity: joinGame.isPending ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {joinGame.isPending ? 'Joining…' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* My Games — BELOW Open Games */}
        {!loadingMine && myGames.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 className="font-display" style={{ fontSize: isMobile ? 17 : 20, margin: '0 0 14px', fontWeight: 500 }}>
              My games ({myGames.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myGames.map((g: any) => {
                const hasOpponent = g.white_player_id !== ZERO_UUID && g.black_player_id !== ZERO_UUID
                const opponentOnline = hasOpponent && g.state === 'active'
                return (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
                  padding: isMobile ? '12px 14px' : '14px 18px',
                  background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
                  borderRadius: 14, transition: 'border-color .15s ease',
                }}>
                  <div onClick={() => navigate(`/game/${g.id}`)} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}>
                      <MiniBoard preset={g.state === 'active' ? 'mid' : 'early'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>
                          {hasOpponent ? 'vs Opponent' : 'Waiting…'}
                        </span>
                        {hasOpponent && (
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: opponentOnline ? 'var(--color-green)' : 'var(--color-text-muted)',
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {g.state === 'waiting' ? (
                          'Waiting for opponent…'
                        ) : (
                          <span style={{ color: 'var(--color-amber)' }}>● Active game</span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: g.state === 'active' ? 'rgba(95,174,126,0.12)' : 'rgba(229,169,59,0.12)',
                      color: g.state === 'active' ? 'var(--color-green)' : 'var(--color-amber)',
                    }}>
                      {g.state === 'active' ? 'Active' : 'Waiting'}
                    </span>
                    {!isMobile && <Icon name="arrow-right" size={16} color="var(--color-text-muted)" />}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleCopyLink(g.id) }} style={{
                      padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: 8,
                      border: '1px solid var(--color-border-strong)',
                      background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)',
                      cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
                    }}>
                      {isMobile ? 'Share' : 'Copy link'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGame(g.id) }} style={{
                      padding: isMobile ? '6px 10px' : '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(210,106,106,0.3)',
                      background: 'rgba(210,106,106,0.08)', color: '#E89494',
                      cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
                    }}>
                      {isMobile ? 'Del' : 'Delete'}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {loadingMine && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading your games…</p>
          </div>
        )}
      </main>
    </div>
  )
}
