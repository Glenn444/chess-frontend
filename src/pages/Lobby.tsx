import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/authStore'
import { useMobileNav } from '../lib/mobileNavStore'
import { useIsMobile } from '../lib/useIsMobile'
import { useToasts } from '../lib/toastStore'
import Avatar from '../components/Avatar'
import MiniBoard from '../components/MiniBoard'
import Icon from '../components/icons/Icon'
import logoPng from '../assets/chesske-logo.png'

function formatTime(ms: number): string | null {
  if (ms <= 0) return null
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function Lobby() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const openNav = useMobileNav(s => s.openNav)
  const addToast = useToasts(s => s.addToast)
  const queryClient = useQueryClient()

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games', 'public'],
    queryFn: () => api.publicGames(),
    refetchInterval: 10_000,
  })

  const joinMutation = useMutation({
    mutationFn: (gameId: string) => api.joinGame(gameId),
    onSuccess: (_, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
      navigate(`/play/${gameId}`)
    },
    onError: (err) => addToast(err instanceof Error ? err.message : 'Failed to join game', 'error'),
  })

  const handleJoin = (gameId: string) => {
    if (!user) {
      navigate(`/register?redirect=${encodeURIComponent(`/play/${gameId}?join=true`)}`)
      return
    }
    joinMutation.mutate(gameId)
  }

  const pad = isMobile ? '16px 14px' : '40px 48px'

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '14px 16px' : '18px 48px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-raised)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', width: 'fit-content' }} onClick={() => navigate('/')}>
            <img src={logoPng} alt="Chesske" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Chesske</span>
          </div>
          {isMobile && user && (
            <button
              onClick={openNav}
              aria-label="Menu"
              style={{
                width: 42, height: 42, borderRadius: 12,
                border: '1px solid var(--color-border-strong)',
                background: 'var(--color-bg-elev)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <Icon name="menu" size={20} color="var(--color-text-primary)" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: pad }}>
        <div style={{ marginBottom: 28 }}>
          <h1 className="font-display" style={{ fontSize: isMobile ? 26 : 34, margin: '0 0 6px', fontWeight: 500, letterSpacing: -0.5 }}>
            Open games
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
            Public games waiting for an opponent. Join one to play instantly.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
            Loading games…
          </div>
        ) : games.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon name="clock" size={24} color="var(--color-amber)" />
            </div>
            <h3 className="font-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 500 }}>No open games right now</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 20px' }}>
              {user ? 'Create a game and others can join.' : 'Sign up to create a game and invite friends.'}
            </p>
            {user
              ? <button onClick={() => navigate('/games')} style={{ padding: '11px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408' }}>Create a game</button>
              : <button onClick={() => navigate('/register')} style={{ padding: '11px 22px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408' }}>Sign up free</button>
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {games.map((g: any) => {
              const creatorName = g.white_player_name || g.black_player_name || 'Player'
              const creatorColor = g.white_player_name ? 'White' : 'Black'
              const whiteTime = formatTime(g.white_time_remaining_ms ?? 0)
              const timeLabel = whiteTime ?? 'Unlimited'
              const isJoining = joinMutation.isPending && joinMutation.variables === g.id

              return (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16,
                  padding: isMobile ? '12px 14px' : '16px 20px',
                  background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
                  borderRadius: 16, transition: 'border-color .15s ease',
                }}>
                  <div style={{ width: isMobile ? 48 : 60, height: isMobile ? 48 : 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border-strong)' }}>
                    <MiniBoard preset="early" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Avatar name={creatorName} size={22} color="amber" />
                      <span style={{ fontWeight: 600, fontSize: isMobile ? 14 : 15 }}>{creatorName}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: 999, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)' }}>
                        plays {creatorColor}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-amber)', fontWeight: 500 }}>
                        {timeLabel}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {g.move_count > 0 ? `${g.move_count} moves` : 'Not started'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoin(g.id)}
                    disabled={isJoining}
                    style={{
                      padding: isMobile ? '9px 16px' : '10px 22px', borderRadius: 12, border: 'none', cursor: isJoining ? 'not-allowed' : 'pointer',
                      background: isJoining ? 'var(--color-border-strong)' : 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
                      color: isJoining ? 'var(--color-text-muted)' : '#1A1408',
                      fontWeight: 600, fontSize: isMobile ? 13 : 14, whiteSpace: 'nowrap',
                      opacity: isJoining ? 0.7 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {isJoining ? 'Joining…' : user ? 'Join' : 'Join →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!user && games.length > 0 && (
          <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(229,169,59,0.06)', border: '1px solid rgba(229,169,59,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Want to play?</strong> Create a free account to join or create games.
            </p>
            <button onClick={() => navigate('/register')} style={{ padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', whiteSpace: 'nowrap' }}>
              Sign up free
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
