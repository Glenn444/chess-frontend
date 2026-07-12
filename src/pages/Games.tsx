import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '../components/Sidebar'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import MiniBoard from '../components/MiniBoard'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import { useMyGames, useWaitingGames, useCreateGame, useJoinGame, useDeleteGame } from '../lib/queries'
import { useToasts } from '../lib/toastStore'
import { useMobileNav } from '../lib/mobileNavStore'
import { subscribeToPush, isPushSubscribed } from '../lib/push'
import { GameSocket } from '../lib/websocket'

export default function Games() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const wsToken = useAuth(s => s.wsToken)
  const queryClient = useQueryClient()
  const [color, setColor] = useState<'w' | 'b'>('w')
  const [timeControl, setTimeControl] = useState<0 | 5 | 10 | 15 | 30 | 45 | 60>(10)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [opponent, setOpponent] = useState<'person' | 'stockfish'>('person')
  const [stockfishLevel, setStockfishLevel] = useState(5)

  const timePresets: { label: string; minutes: 0 | 5 | 10 | 15 | 30 | 45 | 60 }[] = [
    { label: 'Unlimited', minutes: 0  },
    { label: '5 min',     minutes: 5  },
    { label: '10 min',    minutes: 10 },
    { label: '15 min',    minutes: 15 },
    { label: '30 min',    minutes: 30 },
    { label: '45 min',    minutes: 45 },
    { label: '60 min',    minutes: 60 },
  ]

  // Global push subscription state — checked once on mount
  const [pushState, setPushState] = useState<'loading' | 'prompt' | 'granted' | 'dismissed'>('loading')

  useEffect(() => {
    async function checkPushState() {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setPushState('dismissed')
        return
      }
      if (Notification.permission === 'denied') {
        setPushState('dismissed')
        return
      }
      const subscribed = await isPushSubscribed()
      setPushState(subscribed ? 'granted' : 'prompt')
    }
    checkPushState()
  }, [])

  const handleEnableNotifications = async () => {
    const success = await subscribeToPush()
    setPushState(success ? 'granted' : 'dismissed')
  }

  const { data: myGames = [], isLoading: loadingMine } = useMyGames()
  const { data: waitingGames = [], isLoading: loadingWaiting } = useWaitingGames()
  const createGame = useCreateGame()
  const joinGame = useJoinGame()
  const deleteGame = useDeleteGame()
  const addToast = useToasts(s => s.addToast)

  const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

  const openNav = useMobileNav(s => s.openNav)
  const displayName = user?.username || 'Player'
  const activeGames = myGames.filter((g: any) => g.state === 'active')
  const waitingGamesMine = myGames.filter((g: any) => g.state === 'waiting')
  const hasPendingGame = activeGames.length >= 1 || waitingGamesMine.length >= 2
  const myGameIds = new Set(myGames.map((g: any) => g.id))

  // Open a GameSocket for each of the user's waiting games so that when an
  // opponent joins (game_state event), the games list refreshes immediately
  // instead of waiting up to 30 s for the next poll.
  useEffect(() => {
    if (!wsToken || waitingGamesMine.length === 0) return
    console.log('[Games] opening WS for waiting games:', waitingGamesMine.map((g: any) => g.id))

    const sockets = waitingGamesMine.map((g: any) => {
      const sock = new GameSocket(g.id, wsToken)
      sock.on(() => {
        queryClient.invalidateQueries({ queryKey: ['games', 'waiting'] })
        queryClient.invalidateQueries({ queryKey: ['games', 'mine'] })
      })
      return sock
    })

    return () => {
      sockets.forEach(s => s.destroy())
    }
  // Re-run only when the set of waiting game IDs changes or the token rotates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsToken, waitingGamesMine.map((g: any) => g.id).join(',')])

  const handleCreateGame = async () => {
    if (hasPendingGame) {
      addToast('You can have at most 1 active game and 2 waiting games. Finish or delete one first.', 'info')
      return
    }
    try {
      const game = await createGame.mutateAsync({
        opponent,
        player_color: color,
        time_control: timeControl,
        visibility,
        ...(opponent === 'stockfish' ? { stockfish_level: stockfishLevel } : {}),
      })
      if (opponent === 'stockfish') {
        // Engine games start immediately — jump straight in.
        navigate(`/game/${game.id}`)
      } else {
        addToast('Game created! Share the link below to invite someone.', 'success')
      }
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

        {/* Global push notification banner */}
        {pushState === 'prompt' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', marginBottom: 20,
            borderRadius: 14, border: '1px solid rgba(229,169,59,0.25)',
            background: 'rgba(229,169,59,0.06)',
          }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none"
              stroke="var(--color-amber)" strokeWidth={1.8}
              strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Enable notifications to know when opponents join your games
            </span>
            <button
              onClick={handleEnableNotifications}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none',
                cursor: 'pointer', background: 'var(--color-amber)',
                color: '#1A1408', fontWeight: 600, fontSize: 12,
                flexShrink: 0,
              }}
            >
              Enable
            </button>
          </div>
        )}

        {pushState === 'granted' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', marginBottom: 20,
            borderRadius: 14, border: '1px solid rgba(95,174,126,0.2)',
            background: 'rgba(95,174,126,0.05)',
            fontSize: 13, color: 'var(--color-green)',
          }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none"
              stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12l5 5 9-11" />
            </svg>
            Notifications enabled — you'll be alerted when opponents join your games
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
              {activeGames.length >= 1
                ? 'You already have an active game — finish it before creating a new one.'
                : 'You already have 2 pending games — delete one or wait for them to fill before creating a new one.'
              }
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Opponent selector */}
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { k: 'person' as const, l: 'Friend', icon: 'chat' as const },
                { k: 'stockfish' as const, l: 'Stockfish', icon: 'zap' as const },
              ]).map(o => (
                <button key={o.k} onClick={() => setOpponent(o.k)} disabled={hasPendingGame} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', minHeight: 44,
                  borderRadius: 12, cursor: hasPendingGame ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500,
                  border: opponent === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: opponent === o.k ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                  color: 'var(--color-text-primary)',
                  opacity: hasPendingGame ? 0.5 : 1,
                }}>
                  <Icon name={o.icon} size={14} color={opponent === o.k ? 'var(--color-amber)' : 'var(--color-text-muted)'} />
                  {o.l}
                </button>
              ))}
            </div>

            {/* Stockfish level (engine games only) */}
            {opponent === 'stockfish' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 12, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-elev)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Level</span>
                <input
                  type="range" min={0} max={20} step={1}
                  value={stockfishLevel}
                  onChange={e => setStockfishLevel(Number(e.target.value))}
                  disabled={hasPendingGame}
                  style={{ width: isMobile ? '100%' : 140, accentColor: 'var(--color-amber)' }}
                />
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-amber)', minWidth: 22, textAlign: 'center' }}>{stockfishLevel}</span>
              </div>
            )}

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

            {/* Visibility toggle — engine games are always private */}
            {opponent === 'person' && <div style={{ display: 'flex', gap: 6 }}>
              {([
                { k: 'public' as const, l: 'Public' },
                { k: 'private' as const, l: 'Private' },
              ]).map(o => (
                <button key={o.k} onClick={() => setVisibility(o.k)} disabled={hasPendingGame} style={{
                  padding: '8px 14px', borderRadius: 10, cursor: hasPendingGame ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                  border: visibility === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: visibility === o.k ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                  color: 'var(--color-text-primary)',
                  opacity: hasPendingGame ? 0.5 : 1,
                }}>
                  {o.l}
                </button>
              ))}
            </div>}

            {/* Time control */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {timePresets.map(t => (
                <button key={t.minutes} onClick={() => setTimeControl(t.minutes)} disabled={hasPendingGame} style={{
                  padding: '8px 14px', borderRadius: 10, cursor: hasPendingGame ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                  border: timeControl === t.minutes ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                  background: timeControl === t.minutes ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
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
                    <Avatar name={g.white_player_id !== ZERO_UUID ? (g.white_player_name || 'Player') : (g.black_player_name || 'Player')} size={isMobile ? 30 : 36} color="amber" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14 }}>
                        {g.white_player_id !== ZERO_UUID ? (g.white_player_name || 'Player') : (g.black_player_name || 'Player')}
                      </div>
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
                const isEngine = g.opponent === 'stockfish'
                const hasOpponent = isEngine || (g.white_player_id !== ZERO_UUID && g.black_player_id !== ZERO_UUID)
                const opponentOnline = hasOpponent && g.state === 'active'
                const finished = !['waiting', 'active'].includes(g.state)
                const oppLabel = isEngine
                  ? `vs Stockfish (level ${g.stockfish_level ?? 0})`
                  : hasOpponent
                    ? `vs ${g.white_player_name === user?.username ? (g.black_player_name || 'Opponent') : (g.white_player_name || 'Opponent')}`
                    : 'Waiting…'
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
                            {oppLabel}
                          </span>
                          {hasOpponent && !finished && (
                            <span style={{
                              width: 7, height: 7, borderRadius: '50%',
                              background: opponentOnline ? 'var(--color-green)' : 'var(--color-text-muted)',
                            }} />
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {g.state === 'waiting' ? (
                            'Waiting for opponent…'
                          ) : finished ? (
                            g.end_reason ? `Ended — ${g.end_reason}` : `Ended — ${g.state}`
                          ) : (
                            <span style={{ color: 'var(--color-amber)' }}>● Active game</span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: g.state === 'active' ? 'rgba(95,174,126,0.12)' : finished ? 'rgba(255,255,255,0.06)' : 'rgba(229,169,59,0.12)',
                        color: g.state === 'active' ? 'var(--color-green)' : finished ? 'var(--color-text-secondary)' : 'var(--color-amber)',
                      }}>
                        {g.state === 'active' ? 'Active' : finished ? 'Finished' : 'Waiting'}
                      </span>
                      {!isMobile && <Icon name="arrow-right" size={16} color="var(--color-text-muted)" />}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {finished && (
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/replay/${g.id}`) }} style={{
                          padding: isMobile ? '10px 12px' : '8px 16px', minHeight: 40, borderRadius: 10,
                          border: '1px solid rgba(229,169,59,0.35)',
                          background: 'rgba(229,169,59,0.08)', color: 'var(--color-amber)',
                          cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 600, whiteSpace: 'nowrap',
                        }}>
                          Replay
                        </button>
                      )}
                      {!finished && !isEngine && <button onClick={(e) => { e.stopPropagation(); handleCopyLink(g.id) }} style={{
                        padding: isMobile ? '10px 12px' : '8px 16px', minHeight: 40, borderRadius: 10,
                        border: '1px solid var(--color-border-strong)',
                        background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)',
                        cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        {isMobile ? 'Share' : 'Copy link'}
                      </button>}
                      {g.state === 'waiting' && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteGame(g.id) }} style={{
                          padding: isMobile ? '10px 12px' : '8px 16px', minHeight: 40, borderRadius: 10,
                          border: '1px solid rgba(210,106,106,0.3)',
                          background: 'rgba(210,106,106,0.08)', color: '#E89494',
                          cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
                        }}>
                          {isMobile ? 'Del' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
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
