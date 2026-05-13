import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Board from '../components/Board'
import Icon from '../components/icons/Icon'
import Avatar from '../components/Avatar'
import PieceThemeSelector from '../components/PieceThemeSelector'
import { useIsMobile } from '../lib/useIsMobile'
import { useLiveGame } from '../lib/gameStore'
import { useAuth } from '../lib/authStore'
import { useVoiceCall } from '../lib/useVoiceCall'
import { api } from '../lib/api'
import { useToasts } from '../lib/toastStore'
import { getHints, fenToPosition, INITIAL_POSITION } from '../lib/chess'

/* ───── Player card (desktop) ───── */
const PlayerCard = memo(function PlayerCard({ player, isTurn, time, lowTime }: {
  player: { name: string; rating: string; title?: string; color: string; online: boolean; avatarColor: string }
  isTurn: boolean; time: string; lowTime: boolean
}) {
  return (
    <div style={{
      padding: 14, display: 'flex', alignItems: 'center', gap: 14,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
      borderColor: isTurn ? 'var(--color-amber)' : 'var(--color-border)',
      boxShadow: isTurn ? '0 0 0 3px rgba(229,169,59,0.18)' : 'none',
      transition: 'all .2s ease',
    }}>
      <Avatar name={player.name} size={44} color={player.avatarColor as 'amber'} ring={isTurn} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{player.name}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{player.rating}</span>
          {player.title && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'rgba(229,169,59,0.1)', border: '1px solid rgba(229,169,59,0.32)', fontSize: 10, color: 'var(--color-amber-light)', fontWeight: 700 }}>{player.title}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: player.color === 'white' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Playing {player.color}</span>
          <span style={{ fontSize: 12, color: player.online ? 'var(--color-green)' : 'var(--color-text-muted)' }}>● {player.online ? 'Online' : 'Away'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 8, minHeight: 18 }} />
      </div>
      <div style={{
        background: lowTime ? 'rgba(210,106,106,0.15)' : (isTurn ? 'rgba(229,169,59,0.12)' : 'var(--color-bg-base)'),
        border: `1px solid ${lowTime ? 'rgba(210,106,106,0.4)' : (isTurn ? 'var(--color-amber)' : 'var(--color-border-strong)')}`,
        padding: '10px 14px', borderRadius: 12, minWidth: 88, textAlign: 'center',
      }}>
        <div className="font-mono font-display" style={{
          fontSize: 24, fontWeight: 500, letterSpacing: -0.5,
          color: lowTime ? 'var(--color-red)' : (isTurn ? 'var(--color-amber)' : 'var(--color-text-primary)'),
        }}>{time}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, fontWeight: 600 }}>
          {isTurn ? 'Thinking' : 'Waiting'}
        </div>
      </div>
    </div>
  )
})

/* ───── Compact player strip (mobile) ───── */
const CompactPlayerStrip = memo(function CompactPlayerStrip({ player, isTurn, time, lowTime }: {
  player: { name: string; rating: string; avatarColor: string }
  isTurn: boolean; time: string; lowTime: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 14, width: '100%', maxWidth: 560,
      boxShadow: isTurn ? '0 0 0 2px rgba(229,169,59,0.18)' : 'none',
      borderColor: isTurn ? 'var(--color-amber)' : 'var(--color-border)',
    }}>
      <Avatar name={player.name} size={36} color={player.avatarColor as 'amber'} ring={isTurn} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{player.rating}</div>
      </div>
      <div style={{
        background: lowTime ? 'rgba(210,106,106,0.15)' : (isTurn ? 'rgba(229,169,59,0.12)' : 'var(--color-bg-base)'),
        border: `1px solid ${lowTime ? 'rgba(210,106,106,0.4)' : (isTurn ? 'var(--color-amber)' : 'var(--color-border-strong)')}`,
        padding: '6px 12px', borderRadius: 10, textAlign: 'center',
      }}>
        <div className="font-mono" style={{
          fontSize: 20, fontWeight: 500,
          color: lowTime ? 'var(--color-red)' : (isTurn ? 'var(--color-amber)' : 'var(--color-text-primary)'),
        }}>{time}</div>
      </div>
    </div>
  )
})

/* ───── Bottom sheet / drawer ───── */
const BottomSheet = memo(function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(14,15,19,0.6)', backdropFilter: 'blur(4px)',
        animation: 'fade-in 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        maxHeight: '75vh',
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-border-strong)',
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'fade-in 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border-strong)',
            background: 'var(--color-bg-elev)', color: 'var(--color-text-secondary)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {children}
        </div>
      </div>
    </>
  )
})

/* ───── Move list (live moves from WebSocket) ───── */
const MoveHistory = memo(function MoveHistory({ moves }: { moves: { move: string; current_player: string }[] }) {
  // Pair moves into white/black rows
  const paired: { n: number; w: string; b: string }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    paired.push({
      n: Math.floor(i / 2) + 1,
      w: moves[i]?.move || '',
      b: moves[i + 1]?.move || '',
    })
  }
  const currentIdx = paired.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Moves</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {paired.length === 0 ? (
          <div style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontSize: 12, fontStyle: 'italic' }}>No moves yet</div>
        ) : (
          paired.map((m, i) => (
            <div key={m.n} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 1fr',
              padding: '6px 14px', fontSize: 13, alignItems: 'center',
              background: i === currentIdx ? 'rgba(229,169,59,0.06)' : 'transparent',
            }}>
              <div className="font-mono" style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{m.n}.</div>
              <div className="font-mono" style={{ fontWeight: 500, color: i === currentIdx && !m.b ? 'var(--color-amber)' : 'var(--color-text-primary)', padding: '3px 8px', borderRadius: 4, background: i === currentIdx && !m.b ? 'rgba(229,169,59,0.12)' : 'transparent' }}>{m.w}</div>
              <div className="font-mono" style={{ color: 'var(--color-text-primary)', padding: '3px 8px' }}>{m.b}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

/* ───── Voice bar (mute/unmute only) ───── */
function VoiceBar({ muted, onToggleMute }: {
  muted: boolean; onToggleMute: () => void
  voiceStatus?: string
  onStartCall?: () => void
  onEndCall?: () => void
}) {
  return (
    <div style={{
      padding: 12, display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: muted ? 'rgba(210,106,106,0.12)' : 'rgba(95,174,126,0.12)',
          border: `1px solid ${muted ? 'rgba(210,106,106,0.3)' : 'var(--color-border-strong)'}`,
          display: 'grid', placeItems: 'center',
          color: muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
          flexShrink: 0,
        }}>
          <Icon name={muted ? 'mic-off' : 'mic'} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {muted ? 'Microphone muted' : 'Microphone on'}
          </div>
        </div>
      </div>
      <button onClick={onToggleMute} style={{
        width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
        background: muted ? 'rgba(210,106,106,0.15)' : 'var(--color-bg-base)',
        border: `1px solid ${muted ? 'rgba(210,106,106,0.4)' : 'var(--color-border-strong)'}`,
        color: muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
        display: 'grid', placeItems: 'center', transition: 'all .15s ease',
      }}>
        <Icon name={muted ? 'mic-off' : 'mic'} size={16} />
      </button>
    </div>
  )
}

/* ───── Chat panel ───── */
function ChatPanel({ messages, onSend, opponentName }: {
  messages: { me: boolean; text: string; time: string }[]
  onSend: (text: string) => void
  opponentName: string
}) {
  const [input, setInput] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 300 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start', gap: 2 }}>
            {(i === 0 || messages[i - 1].me !== m.me) && (
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '0 4px' }}>{m.me ? 'You' : opponentName}</div>
            )}
            <div style={{
              maxWidth: '82%', padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word',
              background: m.me ? 'var(--color-amber)' : 'var(--color-bg-base)',
              color: m.me ? '#1A1408' : 'var(--color-text-primary)',
              border: m.me ? 'none' : '1px solid var(--color-border-strong)',
              borderBottomRightRadius: m.me ? 4 : 14, borderBottomLeftRadius: m.me ? 14 : 4,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', padding: '0 4px' }}>{m.time}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: '10px 12px', fontSize: 14, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-primary)', outline: 'none' }}
          placeholder="Say gg, glhf..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onSend(input); setInput('') } }}
        />
        <button onClick={() => { if (input.trim()) { onSend(input); setInput('') } }} style={{
          background: 'var(--color-amber)', border: 'none', borderRadius: 10, width: 40, height: 40, color: '#1A1408',
          display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        }}><Icon name="send" size={16} /></button>
      </div>
    </div>
  )
}

/* ───── Status bar ───── */
const StatusBar = memo(function StatusBar({ turn, phase, check }: { turn: string; phase: string; check: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 18px', borderRadius: 14,
      background: check ? 'rgba(210,106,106,0.12)' : 'var(--color-bg-elev)',
      border: `1px solid ${check ? 'rgba(210,106,106,0.35)' : 'var(--color-border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: turn === 'you' ? 'var(--color-piece-light)' : 'var(--color-piece-dark)', border: '1px solid rgba(255,255,255,0.2)' }} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {check ? <span style={{ color: 'var(--color-red)' }}>Check! </span> : null}
          {turn === 'you' ? <span style={{ color: 'var(--color-amber)' }}>Your move</span> : `${turn} is thinking`}
        </span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>· move 14 · {phase}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span><span className="font-mono" style={{ color: 'var(--color-amber)' }}>10+0</span> Rated</span>
        <span style={{ width: 1, height: 12, background: 'var(--color-border-strong)' }} />
        <span>Italian Game</span>
      </div>
    </div>
  )
})

/* ═══════════════ MAIN GAME SCREEN ═══════════════ */

export default function GameScreen() {
  const navigate = useNavigate()
  const { id: gameId } = useParams<{ id?: string }>()
  const token = useAuth(s => s.token)
  const currentUser = useAuth(s => s.user)

  // Voice call — real WebRTC
  const socket = useLiveGame(s => s.socket)
  const voice = useVoiceCall(socket)

  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [resignOpen, setResignOpen] = useState(false)
  const [drawOffered, setDrawOffered] = useState(false)
  const [boardSize, setBoardSize] = useState(560)
  const [flipped, setFlipped] = useState(false)
  const isMobile = useIsMobile()
  const [sheet, setSheet] = useState<'chat' | 'moves' | 'actions' | 'theme' | null>(null)

  // Game status — REST check before connecting WebSocket
  const [gameStatus, setGameStatus] = useState<'loading' | 'waiting' | 'playing' | 'joining'>('loading')
  const [shared, setShared] = useState(false)
  const [restGame, setRestGame] = useState<any>(null)

  // Live game state from WebSocket
  const {
    gameState, position, moves: liveMoves, chatMessages,
    connect, disconnect, makeMove, sendChat: wsSendChat,
    opponentDisconnected, error, clearError,
  } = useLiveGame()

  // Initialize board flip based on player color (from REST first, then WebSocket)
  useEffect(() => {
    const color = gameState?.player_color || (restGame as any)?.player_color
    if (color) {
      setFlipped(color === 'b')
    }
  }, [gameState?.player_color, restGame])

  // Toast notifications
  const addToast = useToasts(s => s.addToast)

  // Show errors as toasts
  useEffect(() => {
    if (error) {
      addToast(error, 'error')
      clearError()
    }
  }, [error, addToast, clearError])

  // Show opponent disconnect/reconnect
  useEffect(() => {
    if (opponentDisconnected) {
      addToast('Opponent disconnected — waiting for reconnect…', 'info')
    }
  }, [opponentDisconnected, addToast])

  // Fetch game status via REST
  useEffect(() => {
    if (!gameId || !token) return
    let cancelled = false
    let poll: ReturnType<typeof setInterval>

    const check = async () => {
      try {
        const g = await api.getGame(gameId)
        if (cancelled) return
        setRestGame(g)
        const gs = g as { status: string; white_player?: string; black_player?: string }
        // A game needs both players to be considered "playing"
        const hasOpponent = !!(gs.white_player && gs.black_player)
        const isWaitingStatus = gs.status === 'waiting' || gs.status === 'pending' || gs.status === 'created'
        if (!hasOpponent || isWaitingStatus) {
          setGameStatus('waiting')
        } else {
          setGameStatus('playing')
          clearInterval(poll)
        }
      } catch {
        if (!cancelled) {
          addToast('Failed to load game. Please try again.', 'error')
        }
      }
    }
    check()
    // Poll while waiting/loading
    poll = setInterval(check, 3000)
    return () => { cancelled = true; clearInterval(poll) }
  }, [gameId, token])

  // Auto-join if ?join=true is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('join') === 'true' && gameId && token && gameStatus === 'loading') {
      setGameStatus('joining')
      api.joinGame(gameId).then(() => {
        setGameStatus('playing')
      }).catch((err) => {
        setGameStatus('waiting')
        const msg = err instanceof Error ? err.message : 'Failed to join game'
        addToast(msg, 'error')
      })
    }
  }, [gameId, token, gameStatus])

  // Only connect WebSocket when game is playing
  useEffect(() => {
    if (gameId && token && gameStatus === 'playing') {
      connect(gameId, token)
      voice.requestMic()
    }
    return () => { if (gameStatus === 'playing') disconnect() }
  }, [gameId, token, gameStatus, connect, disconnect])

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/game/${gameId}?join=true`
    try {
      await navigator.clipboard.writeText(link)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch { /* ignore */ }
  }

  // Responsive: detect mobile + compute board size
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w < 480) setBoardSize(Math.min(w - 24, 360))
      else if (w < 860) setBoardSize(Math.min(w - 32, 480))
      else if (w < 1100) setBoardSize(Math.min(w - 80, 540))
      else setBoardSize(Math.min(620, w * 0.42))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleSquareClick = useCallback((sq: string) => {
    setSelected(prev => {
      if (!prev) return sq           // first click: select piece
      if (prev === sq) return null    // deselect
      // second click: send move
      makeMove(prev + sq)
      return null
    })
  }, [makeMove])

  // Send chat via WebSocket
  const handleSend = useCallback((text: string) => {
    if (gameId && gameState) {
      wsSendChat(text)
    }
  }, [gameId, gameState, wsSendChat])

  // Resolve position: store first, then REST response FEN, then initial position
  const displayPosition = useMemo(() =>
    position
    || (restGame?.fen ? fenToPosition(restGame.fen) : undefined)
    || INITIAL_POSITION,
  [position, restGame])

  const hints = useMemo(() =>
    selected ? getHints(displayPosition, selected) : [],
  [selected, displayPosition])

  // Map chat messages to UI format
  const chatForUI = useMemo(() =>
    chatMessages.map(m => ({
      me: m.username === (currentUser?.username || ''),
      text: m.content,
      time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })),
  [chatMessages, currentUser])

  // Player info from game state
  const opponentName = gameState ? (gameState.player_color === 'w' ? gameState.black_player : gameState.white_player) : 'Opponent'
  const isMyTurn = gameState ? gameState.current_player === gameState.player_color : false
  const myColor = gameState?.player_color === 'w' ? 'white' : 'black'
  const opponentColor = myColor === 'white' ? 'black' : 'white'

  // Chess timers (10 min each, counts down for active player)
  const [whiteTime, setWhiteTime] = useState(600)
  const [blackTime, setBlackTime] = useState(600)

  useEffect(() => {
    if (!gameState || gameState.is_checkmate || gameState.is_stalemate) return
    const id = setInterval(() => {
      if (gameState.current_player === 'w') {
        setWhiteTime(t => Math.max(0, t - 1))
      } else {
        setBlackTime(t => Math.max(0, t - 1))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [gameState?.current_player, gameState?.is_checkmate, gameState?.is_stalemate])

  const formatClock = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const myTime = gameState?.player_color === 'w' ? formatClock(whiteTime) : formatClock(blackTime)
  const opponentTime = gameState?.player_color === 'w' ? formatClock(blackTime) : formatClock(whiteTime)

  /* ──── Waiting / Joining lobby ──── */
  if (gameStatus === 'loading' || gameStatus === 'joining') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {gameStatus === 'joining' ? 'Joining game…' : 'Loading game…'}
        </div>
      </div>
    )
  }

  if (gameStatus === 'waiting') {
    const inviteLink = `${window.location.origin}/game/${gameId}?join=true`
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))', display: 'grid', placeItems: 'center', margin: '0 auto 24px', boxShadow: '0 12px 30px -10px rgba(229,169,59,0.4)' }}>
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#1A1408" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <h1 className="font-display" style={{ fontSize: 28, margin: '0 0 12px', fontWeight: 500 }}>Waiting for opponent</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 8px', lineHeight: 1.5 }}>
            Share this link with a friend to start playing.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '0 0 20px' }}>
            Playing as <strong style={{ color: 'var(--color-amber)' }}>{restGame?.player_color === 'w' ? 'White' : 'Black'}</strong>
          </p>
          <div style={{ display: 'flex', gap: 8, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: 6, marginBottom: 20 }}>
            <div className="font-mono" style={{ flex: 1, padding: '10px 12px', fontSize: 12, color: 'var(--color-amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', userSelect: 'all' }}>{inviteLink}</div>
            <button onClick={handleCopyLink} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: shared ? 'var(--color-green)' : 'var(--color-amber)', color: shared ? '#fff' : '#1A1408', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all .15s ease' }}>
              {shared ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => navigate('/games')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
            ← Back to games
          </button>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)' }}>Waiting for an opponent to join… this page will update automatically.</p>
        </div>
      </div>
    )
  }

  /* ──── Mobile layout ──── */
  if (isMobile) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
        <audio ref={voice.remoteAudioRef} autoPlay />
        {voice.micDenied && (
          <div style={{ margin: '8px 12px 0', padding: '10px 14px', background: 'rgba(210,106,106,0.12)', border: '1px solid rgba(210,106,106,0.3)', borderRadius: 12, fontSize: 13, color: 'var(--color-red)', textAlign: 'center' }}>
            Microphone access is required to play. Please enable your microphone in browser settings.
          </div>
        )}
        {/* Board area — full width */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', gap: 10 }}>
          {/* Opponent compact strip */}
          <CompactPlayerStrip
            player={{ name: opponentName, rating: '1200', avatarColor: 'rose' }}
            isTurn={!isMyTurn}
            time={opponentTime}
            lowTime={parseInt(opponentTime.split(':')[0]) < 1}
          />

          {/* Board */}
          <div style={{ position: 'relative', maxWidth: '100%' }}>
            <Board position={displayPosition} size={boardSize} selected={selected} hints={hints} lastMove={liveMoves.length > 0 ? [liveMoves[liveMoves.length - 1].move.slice(0, 2), liveMoves[liveMoves.length - 1].move.slice(2, 4)] : []} check={gameState?.in_check ? 'in_check' : null} flipped={flipped} onSquareClick={handleSquareClick} />

            {drawOffered && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 280 }}>
                  <Icon name="handshake" size={28} color="var(--color-amber)" />
                  <h3 className="font-display" style={{ fontSize: 18, margin: '10px 0 6px', fontWeight: 500 }}>Offer a draw?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: '0 0 16px' }}>Your opponent will be asked to accept or decline.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setDrawOffered(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '10px 18px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={() => setDrawOffered(false)} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '10px 18px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 14 }}>Send</button>
                  </div>
                </div>
              </div>
            )}

            {resignOpen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 280 }}>
                  <Icon name="flag" size={28} color="var(--color-red)" />
                  <h3 className="font-display" style={{ fontSize: 18, margin: '10px 0 6px', fontWeight: 500 }}>Resign?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: '0 0 16px' }}>You'll lose 16 rating points.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setResignOpen(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '10px 18px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={() => { setResignOpen(false); api.resignGame(gameId!).finally(() => navigate('/dashboard')) }} style={{ background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, padding: '10px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Resign</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My compact strip */}
          <CompactPlayerStrip
            player={{ name: currentUser?.username || 'You', rating: '1200', avatarColor: 'amber' }}
            isTurn={isMyTurn}
            time={myTime}
            lowTime={parseInt(myTime.split(':')[0]) < 1}
          />

          {/* Status */}
          <div style={{ width: '100%', maxWidth: 560 }}>
            <StatusBar turn={isMyTurn ? 'you' : opponentName} phase={gameState?.status || 'playing'} check={gameState?.in_check || gameState?.is_checkmate || false} />
          </div>
        </div>

        {/* Floating dock */}
        <div style={{
          position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          display: 'flex', gap: 4, padding: 6,
          background: 'rgba(22,24,31,0.94)', border: '1px solid var(--color-border-strong)',
          borderRadius: 999, backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
        }}>
          <button
            onClick={voice.toggleMute}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: voice.muted ? 'transparent' : 'var(--color-amber)',
              color: voice.muted ? 'var(--color-text-secondary)' : '#1A1408',
              transition: 'all .15s ease', minWidth: 52,
            }}
          >
            <Icon name={voice.muted ? 'mic-off' : 'mic'} size={18} color={voice.muted ? 'currentColor' : '#1A1408'} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>{voice.muted ? 'Unmute' : 'Mute'}</span>
          </button>
          {[
            { k: 'chat' as const, icon: 'chat' as const, label: 'Chat' },
            { k: 'moves' as const, icon: 'clock' as const, label: 'Moves' },
            { k: 'actions' as const, icon: 'zap' as const, label: 'Actions' },
            { k: 'theme' as const, icon: 'settings' as const, label: 'Theme' },
          ].map(item => (
            <button
              key={item.k}
              onClick={() => setSheet(sheet === item.k ? null : item.k)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '8px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: sheet === item.k ? 'var(--color-amber)' : 'transparent',
                color: sheet === item.k ? '#1A1408' : 'var(--color-text-secondary)',
                transition: 'all .15s ease', minWidth: 52,
              }}
            >
              <Icon name={item.icon} size={18} color={sheet === item.k ? '#1A1408' : 'currentColor'} />
              <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Bottom sheets */}
        <BottomSheet open={sheet === 'chat'} onClose={() => setSheet(null)} title="Chat">
          <ChatPanel messages={chatForUI} onSend={handleSend} opponentName={opponentName} />
        </BottomSheet>

        <BottomSheet open={sheet === 'moves'} onClose={() => setSheet(null)} title="Move History">
          <div style={{ maxHeight: 340, overflow: 'auto' }}>
            <MoveHistory moves={liveMoves} />
          </div>
        </BottomSheet>

        <BottomSheet open={sheet === 'actions'} onClose={() => setSheet(null)} title="Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => { setDrawOffered(true); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
              <Icon name="handshake" size={16} /> Offer draw
            </button>
            <button onClick={() => { setResignOpen(true); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, cursor: 'pointer', fontWeight: 500 }}>
              <Icon name="flag" size={16} /> Resign
            </button>
            <button onClick={() => { setFlipped(f => !f); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
              ⇅ Flip board
            </button>
          </div>
        </BottomSheet>

        <BottomSheet open={sheet === 'theme'} onClose={() => setSheet(null)} title="Piece Theme">
          <PieceThemeSelector />
        </BottomSheet>
      </div>
    )
  }

  /* ──── Desktop layout (unchanged 3-column) ──── */
  return (
    <div className="fade-in" style={{ display: 'flex', minHeight: '100vh' }}>
      <audio ref={voice.remoteAudioRef} autoPlay />
      <Sidebar />
      <main className="game-main" style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 16, minHeight: '100vh' }}>
        {/* LEFT — voice + chat */}
        <div className="game-left" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <VoiceBar muted={voice.muted} onToggleMute={voice.toggleMute} />
          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', height: chatCollapsed ? 48 : '100%', overflow: 'hidden', transition: 'height .2s ease' }}>
              <div onClick={() => setChatCollapsed(c => !c)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer', borderBottom: chatCollapsed ? 'none' : '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="chat" size={16} color="var(--color-amber)" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Chat</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{chatForUI.length}</span>
                </div>
                <Icon name={chatCollapsed ? 'arrow-right' : 'x'} size={14} color="var(--color-text-muted)" />
              </div>
              {!chatCollapsed && <ChatPanel messages={chatForUI} onSend={handleSend} opponentName={opponentName} />}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
          <div className="player-card-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <PlayerCard player={{ name: opponentName, rating: '1200', color: opponentColor, online: !opponentDisconnected, avatarColor: 'rose' }} isTurn={!isMyTurn} time={opponentTime} lowTime={parseInt(opponentTime.split(':')[0]) < 1} />
          </div>
          <div className="game-board-wrap" style={{ position: 'relative', maxWidth: '100%' }}>
            <Board position={displayPosition} size={boardSize} selected={selected} hints={hints} lastMove={liveMoves.length > 0 ? [liveMoves[liveMoves.length - 1].move.slice(0, 2), liveMoves[liveMoves.length - 1].move.slice(2, 4)] : []} check={gameState?.in_check ? 'in_check' : null} flipped={flipped} onSquareClick={handleSquareClick} />
            {drawOffered && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 320 }}>
                  <Icon name="handshake" size={32} color="var(--color-amber)" />
                  <h3 className="font-display" style={{ fontSize: 20, margin: '10px 0 6px', fontWeight: 500 }}>Offer a draw?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: '0 0 16px' }}>Your opponent will be asked to accept or decline.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setDrawOffered(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => setDrawOffered(false)} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '12px 20px', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset' }}>Send offer</button>
                  </div>
                </div>
              </div>
            )}
            {resignOpen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 320 }}>
                  <Icon name="flag" size={32} color="var(--color-red)" />
                  <h3 className="font-display" style={{ fontSize: 20, margin: '10px 0 6px', fontWeight: 500 }}>Resign the game?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: '0 0 16px' }}>You'll lose 16 rating points.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setResignOpen(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => { setResignOpen(false); api.resignGame(gameId!).finally(() => navigate('/dashboard')) }} style={{ background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, padding: '10px 16px', fontWeight: 500, cursor: 'pointer' }}>Yes, resign</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="player-card-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <PlayerCard player={{ name: currentUser?.username || 'You', rating: '1200', color: myColor, online: true, avatarColor: 'amber' }} isTurn={isMyTurn} time={myTime} lowTime={parseInt(myTime.split(':')[0]) < 1} />
          </div>
          <div className="game-status-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <StatusBar turn={isMyTurn ? 'you' : opponentName} phase={gameState?.status || 'playing'} check={gameState?.in_check || gameState?.is_checkmate || false} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="game-right" style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <MoveHistory moves={liveMoves} />
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => setDrawOffered(true)} style={{ padding: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
                <Icon name="handshake" size={14} /> Offer draw
              </button>
              <button onClick={() => setResignOpen(true)} style={{ padding: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, cursor: 'pointer', fontWeight: 500 }}>
                <Icon name="flag" size={14} /> Resign
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <button onClick={() => setFlipped(f => !f)} style={{ padding: 10, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
                ⇅ Flip board
              </button>
              <button style={{ padding: 10, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
                <Icon name="settings" size={14} /> Settings
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 12, overflow: 'hidden' }}>
            <PieceThemeSelector compact />
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Eval</div>
              <div className="font-mono font-display" style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-green)' }}>+0.4</div>
            </div>
            <div style={{ flex: 1, height: 8, background: 'var(--color-bg-base)', borderRadius: 4, margin: '0 12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '54%', height: '100%', background: 'var(--color-piece-light)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>slight edge</div>
          </div>
        </div>
      </main>
    </div>
  )
}
