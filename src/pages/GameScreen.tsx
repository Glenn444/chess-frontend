import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Sidebar from '../components/Sidebar'
import Board from '../components/Board'
import type { Position } from '../components/Board'
import Icon from '../components/icons/Icon'
import PieceThemeSelector from '../components/PieceThemeSelector'
import PlayerCard from '../components/gamescreen/PlayerCard'
import CompactPlayerStrip from '../components/gamescreen/CompactPlayerStrip'
import BottomSheet from '../components/gamescreen/BottomSheet'
import MoveHistory from '../components/gamescreen/MoveHistory'
import VoiceBar from '../components/gamescreen/VoiceBar'
import ChatPanel from '../components/gamescreen/ChatPanel'
import StatusBar from '../components/gamescreen/StatusBar'
import WaitingLobby from '../components/gamescreen/WaitingLobby'
import { useIsMobile } from '../lib/useIsMobile'
import { useLiveGame } from '../lib/gameStore'
import { useAuth } from '../lib/authStore'
import { useVoiceCall } from '../lib/useVoiceCall'
import { api, type Game, parseBoardState, fetchFreshToken } from '../lib/api'
import { useToasts } from '../lib/toastStore'
import { getHints, INITIAL_POSITION } from '../lib/chess'
import { useGameChat, useGetMoves } from '../lib/queries'
import { useMobileNav } from '../lib/mobileNavStore'

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

function boardStateToPosition(game: Game): Position {
  const bs = parseBoardState(game)
  const pos: Position = {}
  for (const [sq, piece] of Object.entries(bs.board)) {
    pos[sq] = {
      t: piece.toUpperCase(),
      c: piece === piece.toUpperCase() ? 'l' : 'd',
    }
  }
  return pos
}

export default function GameScreen() {
  const navigate = useNavigate()
  const { id: gameId } = useParams<{ id?: string }>()
  const currentUser = useAuth(s => s.user)
  const wsToken = useAuth(s => s.wsToken)
  const queryClient = useQueryClient()

  // Voice call — real WebRTC
  const socket = useLiveGame(s => s.socket)
  const voice = useVoiceCall(socket)

  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)
  const [resignOpen, setResignOpen] = useState(false)
  const [drawOffered, setDrawOffered] = useState(false)
  const [boardSize, setBoardSize] = useState(560)
  // manualFlip: null means "use auto orientation", true/false means user manually toggled
  const [manualFlip, setManualFlip] = useState<boolean | null>(null)
  const isMobile = useIsMobile()
  const openNav = useMobileNav(s => s.openNav)
  const [sheet, setSheet] = useState<'chat' | 'moves' | 'actions' | 'theme' | null>(null)

  // ── REST: chat + move history — loaded once, live updates come via WS ──
  const { data: chatHistory } = useGameChat(gameId)
  const { data: restMoves } = useGetMoves(gameId)

  // ── REST: fetch game, poll only while waiting for opponent ──
  const { data: restGame, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => api.getGame(gameId!),
    enabled: !!gameId,
    refetchInterval: (query) => {
      const g = query.state.data
      if (!g) return 3000
      return g.state === 'waiting' ? 3000 : false
    },
  })

  // Join mutation (for ?join=true)
  const joinMutation = useMutation({
    mutationFn: () => api.joinGame(gameId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game', gameId] }),
    onError: (err) => addToast(err instanceof Error ? err.message : 'Failed to join game', 'error'),
  })

  // ── Live game state from WebSocket ──
  const {
    gameState, position, moves: liveMoves, chatMessages,
    connect, disconnect, makeMove, sendChat: wsSendChat,
    opponentDisconnected, error, clearError,
  } = useLiveGame()

  // ── userColor: WS is authoritative once connected, REST is the fallback ──
  // REST uses white_player_name / black_player_name (not white_username)
  const userColor = useMemo<'w' | 'b' | null>(() => {
    if (gameState?.user_color) return gameState.user_color
    if (restGame && currentUser) {
      if (restGame.white_player_name === currentUser.username) return 'w'
      if (restGame.black_player_name === currentUser.username) return 'b'
    }
    return null
  }, [gameState?.user_color, restGame, currentUser])

  // ── flipped: derived from color, overridable by manual toggle ──
  const autoFlipped = userColor === 'b'
  const flipped = manualFlip !== null ? manualFlip : autoFlipped

  // Reset manual override whenever userColor resolves (new game / reconnect)
  useEffect(() => {
    if (userColor) setManualFlip(null)
  }, [userColor])

  // Toast notifications
  const addToast = useToasts(s => s.addToast)

  const setWsToken = useAuth(s => s.setWsToken)

  useEffect(() => {
    if (!error) return
    if (error === 'invalid token') {
      // Token expired mid-game — refresh silently and let the connect effect re-trigger
      fetchFreshToken().then(token => {
        if (token) setWsToken(token)
        else addToast('Session expired. Please log in again.', 'error')
      })
    } else {
      addToast(error, 'error')
    }
    clearError()
  }, [error, addToast, clearError, setWsToken])

  useEffect(() => {
    if (opponentDisconnected) addToast('Opponent disconnected — waiting for reconnect…', 'info')
  }, [opponentDisconnected, addToast])

  // Auto-join if ?join=true is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('join') === 'true' && gameId && restGame?.state === 'waiting') {
      joinMutation.mutate()
    }
  }, [restGame?.state])

  // Connect when ready — connect() destroys the old socket internally, so no cleanup needed here
  useEffect(() => {
    console.log('[GameScreen] WS effect — gameId:', gameId, '| wsToken:', wsToken ? 'set' : 'NULL', '| gameState:', restGame?.state)
    if (gameId && wsToken && restGame?.state === 'active') {
      connect(gameId, wsToken)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, wsToken, restGame?.state])

  // White player auto-initiates voice once game_state arrives; black auto-answers via useVoiceCall.
  // Track the socket instance so we can detect reconnects and restart voice after WS recovers.
  const voiceInitiated = useRef(false)
  const lastVoiceSocket = useRef<typeof socket>(null)
  useEffect(() => {
    if (socket !== lastVoiceSocket.current) {
      lastVoiceSocket.current = socket
      if (socket && voiceInitiated.current) {
        // Socket reconnected — old PC is dead. Reset so we retry below.
        console.log('[GameScreen] socket reconnected — resetting voice for retry')
        voiceInitiated.current = false
      }
    }
    if (!gameState || !socket || voiceInitiated.current) return
    if (userColor === 'w') {
      voiceInitiated.current = true
      voice.startCall()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, userColor, socket])

  // Disconnect only when the GameScreen unmounts
  useEffect(() => {
    return () => { disconnect() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Responsive board size — capped by both viewport width and height so the board fits without scrolling.
  // Available height for the board = vh - 48px (main padding) - 240px (player cards + status + gaps).
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const maxFromHeight = Math.max(280, window.innerHeight - (isMobile ? 340 : 288))
      let sizeFromWidth: number
      if (w < 480) sizeFromWidth = Math.min(w - 24, 360)
      else if (w < 860) sizeFromWidth = Math.min(w - 32, 480)
      else if (w < 1100) sizeFromWidth = Math.min(w - 80, 540)
      else sizeFromWidth = Math.min(620, w * 0.42)
      setBoardSize(Math.min(sizeFromWidth, maxFromHeight))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Use a ref so the handler is never recreated and makeMove is never
  // called inside a state updater (which StrictMode would double-invoke).
  const handleSquareClick = useCallback((sq: string) => {
    const prev = selectedRef.current
    if (!prev) {
      console.log('[click] select:', sq)
      selectedRef.current = sq
      setSelected(sq)
    } else if (prev === sq) {
      console.log('[click] deselect')
      selectedRef.current = null
      setSelected(null)
    } else {
      console.log('[click] move attempt:', prev + sq)
      makeMove(prev + sq)
      selectedRef.current = null
      setSelected(null)
    }
  }, [makeMove])

  const handleSend = useCallback((text: string) => {
    if (gameId && gameState) wsSendChat(text)
  }, [gameId, gameState, wsSendChat])

  // Position: WS store → REST board_state → initial
  const displayPosition = useMemo(() => {
    if (position) return position
    if (restGame) return boardStateToPosition(restGame)
    return INITIAL_POSITION
  }, [position, restGame])

  const hints = useMemo(() =>
    selected ? getHints(displayPosition, selected) : [],
  [selected, displayPosition])

  // sender_id is a UUID — compare against the player IDs from the REST game object
  const myPlayerId = userColor === 'w' ? restGame?.white_player_id : restGame?.black_player_id

  const chatForUI = useMemo(() => {
    // Merge REST history + live WS messages, dedupe by message ID
    const seen = new Set<string>()
    const all = [...(chatHistory ?? []), ...chatMessages].filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return all.map(m => ({
      id: m.id,
      me: !!myPlayerId && m.sender_id === myPlayerId,
      text: m.content,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: m.sender_id === restGame?.white_player_id
        ? (restGame.white_player_name ?? 'White')
        : (restGame?.black_player_name ?? 'Black'),
    }))
  }, [chatHistory, chatMessages, myPlayerId, restGame])

  // REST move history (base) + any WS moves that happened after (new moves during this session)
  const allMovesForHistory = useMemo(() => {
    const base = (restMoves ?? []).map(m => ({ move: m.move_notation, current_player: m.player_color }))
    return [...base, ...liveMoves.slice(base.length)]
  }, [restMoves, liveMoves])

  // Opponent name: WS first, REST fallback using correct field names
  const opponentName = useMemo(() => {
    if (gameState?.opponent_username) return gameState.opponent_username
    if (restGame && currentUser) {
      const opp = currentUser.username === restGame.white_player_name
        ? restGame.black_player_name
        : restGame.white_player_name
      if (opp) return opp
    }
    const hasOpponent = restGame &&
      restGame.white_player_id !== ZERO_UUID &&
      restGame.black_player_id !== ZERO_UUID
    return hasOpponent ? 'Opponent' : 'Waiting…'
  }, [gameState?.opponent_username, restGame, currentUser])

  // Turn / color helpers — before WS connects, derive from REST current_player
  const currentPlayer = gameState?.current_player ?? restGame?.current_player
  const isMyTurn = userColor ? currentPlayer === userColor : false
  const myColor = userColor === 'w' ? 'white' : 'black'
  const opponentColor = myColor === 'white' ? 'black' : 'white'

  const isGameOver = ['checkmate', 'stalemate', 'resign', 'draw'].includes(restGame?.state ?? '')
  const gameActive = restGame?.state === 'active' && !isGameOver
  const initialSeconds = 600

  const lastMoveSquares = liveMoves.length > 0
    ? [liveMoves[liveMoves.length - 1].move.slice(0, 2), liveMoves[liveMoves.length - 1].move.slice(2, 4)]
    : []

  /* ──── Loading ──── */
  if (isLoading || joinMutation.isPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {joinMutation.isPending ? 'Joining game…' : 'Loading game…'}
        </div>
      </div>
    )
  }

  /* ──── Waiting for opponent ──── */
  if (restGame?.state === 'waiting') {
    return <WaitingLobby gameId={gameId!} playerColor={restGame.current_player} />
  }

  /* ──── Mobile layout ──── */
  if (isMobile) {
    return (
      <div className="fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
        <audio ref={voice.remoteAudioRef} autoPlay />

        {/* Mobile top bar: avatar + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 0' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
            display: 'grid', placeItems: 'center',
            color: '#1A1408', fontWeight: 700, fontSize: 17,
            border: '2px solid rgba(229,169,59,0.4)',
          }}>
            {(currentUser?.username || 'P').charAt(0).toUpperCase()}
          </div>
          <button
            onClick={openNav}
            style={{
              width: 42, height: 42, borderRadius: 12,
              border: '1px solid var(--color-border-strong)',
              background: 'var(--color-bg-raised)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <Icon name="menu" size={20} color="var(--color-text-primary)" />
          </button>
        </div>

        {voice.micDenied && (
          <div style={{ margin: '8px 12px 0', padding: '10px 14px', background: 'rgba(210,106,106,0.12)', border: '1px solid rgba(210,106,106,0.3)', borderRadius: 12, fontSize: 13, color: 'var(--color-red)', textAlign: 'center' }}>
            Microphone access is required to play. Please enable your microphone in browser settings.
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', gap: 10 }}>
          <CompactPlayerStrip
            player={{ name: opponentName, rating: '1200', avatarColor: 'rose', online: !opponentDisconnected }}
            isTurn={!isMyTurn}
            initialSeconds={initialSeconds}
            gameActive={gameActive}
          />

          <div style={{ position: 'relative', maxWidth: '100%' }}>
            <Board
              position={displayPosition}
              size={boardSize}
              selected={selected}
              hints={hints}
              lastMove={lastMoveSquares}
              check={restGame?.in_check ? 'in_check' : null}
              flipped={flipped}
              onSquareClick={handleSquareClick}
            />

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

          <CompactPlayerStrip
            player={{ name: currentUser?.username || 'You', rating: '1200', avatarColor: 'amber', online: true }}
            isTurn={isMyTurn}
            initialSeconds={initialSeconds}
            gameActive={gameActive}
          />

          <div style={{ width: '100%', maxWidth: 560 }}>
            <StatusBar turn={isMyTurn ? 'you' : opponentName} phase={restGame?.state || 'active'} check={!!restGame?.in_check || restGame?.state === 'checkmate'} />
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

        <BottomSheet open={sheet === 'chat'} onClose={() => setSheet(null)} title="Chat">
          <div style={{ height: 360, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel messages={chatForUI} onSend={handleSend} opponentName={opponentName} />
          </div>
        </BottomSheet>
        <BottomSheet open={sheet === 'moves'} onClose={() => setSheet(null)} title="Move History">
          <div style={{ maxHeight: 340, overflow: 'auto' }}>
            <MoveHistory moves={allMovesForHistory} />
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
            <button onClick={() => { setManualFlip(f => f === null ? !autoFlipped : !f); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
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

  /* ──── Desktop layout ──── */
  return (
    <div className="fade-in" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <audio ref={voice.remoteAudioRef} autoPlay />
      <Sidebar />
      <main className="game-main" style={{ flex: 1, padding: 24, display: 'grid', gridTemplateColumns: '300px 1fr 320px', gap: 16, alignItems: 'start', height: '100vh', overflow: 'hidden', boxSizing: 'border-box' }}>
        {/* LEFT — voice + chat */}
        <div className="game-left" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: boardSize + 238 }}>
          <VoiceBar
            muted={voice.muted}
            status={voice.status}
            onToggleMute={voice.toggleMute}
          />
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, display: 'flex', flexDirection: 'column', flex: chatCollapsed ? 'none' : 1, height: chatCollapsed ? 48 : undefined, minHeight: 0, overflow: 'hidden', transition: 'all .2s ease' }}>
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
            <PlayerCard
              player={{ name: opponentName, rating: '1200', color: opponentColor, online: !opponentDisconnected, avatarColor: 'rose' }}
              isTurn={!isMyTurn}
              initialSeconds={initialSeconds}
              gameActive={gameActive}
            />
          </div>
          <div className="game-board-wrap" style={{ position: 'relative', maxWidth: '100%' }}>
            <Board
              position={displayPosition}
              size={boardSize}
              selected={selected}
              hints={hints}
              lastMove={lastMoveSquares}
              check={restGame?.in_check ? 'in_check' : null}
              flipped={flipped}
              onSquareClick={handleSquareClick}
            />
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
            <PlayerCard
              player={{ name: currentUser?.username || 'You', rating: '1200', color: myColor, online: true, avatarColor: 'amber' }}
              isTurn={isMyTurn}
              initialSeconds={initialSeconds}
              gameActive={gameActive}
            />
          </div>
          <div className="game-status-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <StatusBar turn={isMyTurn ? 'you' : opponentName} phase={restGame?.state || 'active'} check={!!restGame?.in_check || restGame?.state === 'checkmate'} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="game-right" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: boardSize + 238 }}>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <MoveHistory moves={allMovesForHistory} />
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
              <button
                onClick={() => setManualFlip(f => f === null ? !autoFlipped : !f)}
                style={{ padding: 10, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}
              >
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