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
import Piece from '../components/Piece'
import { playSelect, playGameStart, playLowTime } from '../hooks/useSounds'

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'
const GAME_OVER_REASONS = ['checkmate', 'stalemate', 'resign', 'draw', 'abandoned', 'timeout']

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
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null)
  const [boardSize, setBoardSize] = useState(560)
  // manualFlip: null means "use auto orientation", true/false means user manually toggled
  const [manualFlip, setManualFlip] = useState<boolean | null>(null)
  const isMobile = useIsMobile()
  const [sheet, setSheet] = useState<'chat' | 'moves' | 'actions' | 'theme' | null>(null)
  const [unreadChats, setUnreadChats] = useState(0)
  const seenMsgIds = useRef(new Set<string>())
  const gameStartSoundPlayed = useRef(false)
  const lowTimeSoundPlayed = useRef(false)
  // Refs that mirror derived state so handleSquareClick never needs them as deps
  const displayPositionRef = useRef<import('../components/Board').Position>(INITIAL_POSITION)
  const userColorRef = useRef<'w' | 'b' | null>(null)
  const isGameOverRef = useRef(false)
  const isMyTurnRef = useRef(false)

  // ── REST: chat + move history — loaded once, live updates come via WS ──
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
    gameState, position, moves: liveMoves, moveOffset, chatMessages,
    connect, disconnect, makeMove, sendChat: wsSendChat,
    opponentDisconnected, error, clearError, setMyPlayerId,
  } = useLiveGame()

  // ── Engine games: the server plays Stockfish's replies automatically ──
  const isEngineGame = restGame?.opponent === 'stockfish' || gameState?.play_against === 'stockfish'
  const stockfishLevel = restGame?.stockfish_level ?? 0

  // Chat: none in engine games, and the server deletes it once a game ends —
  // don't fetch history in either case.
  const restGameOver = GAME_OVER_REASONS.includes(restGame?.state ?? '')
  const { data: chatHistory } = useGameChat(isEngineGame || restGameOver ? undefined : gameId)

  // ── userColor ──
  // REST UUID comparison is the ground truth: if the current user's UUID matches
  // white_player_id or black_player_id we know exactly which side they play.
  // WS UserColor is used as a fallback because some backend versions send "" or
  // the wrong color for the joining player.  Username comparison is the last resort.
  const userColor = useMemo<'w' | 'b' | null>(() => {
    if (restGame && currentUser?.user_id) {
      if (restGame.white_player_id === currentUser.user_id) return 'w'
      if (restGame.black_player_id === currentUser.user_id) return 'b'
    }
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
      // Token expired mid-game — disconnect first so the connect effect sees no socket,
      // then set the fresh token so the effect re-runs and creates a new socket.
      fetchFreshToken().then(token => {
        if (token) { disconnect(); setWsToken(token) }
        else addToast('Session expired. Please log in again.', 'error')
      })
    } else {
      addToast(error, 'error')
    }
    clearError()
  }, [error, addToast, clearError, setWsToken, disconnect])

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

  // Connect when ready.
  // Only create a new socket when there isn't one already for this game.
  // GameSocket manages its own reconnects internally, so we must not destroy
  // and recreate it on re-renders or token refreshes — that produces ghost sessions
  // that receive duplicate voice signaling messages from the server relay.
  useEffect(() => {
    console.log('[GameScreen] WS effect — gameId:', gameId, '| wsToken:', wsToken ? 'set' : 'NULL', '| gameState:', restGame?.state, '| hasSocket:', !!socket)
    if (!gameId || !wsToken || restGame?.state !== 'active') return
    if (socket && socket.gameId === gameId) return  // already connected for this game
    connect(gameId, wsToken)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, wsToken, restGame?.state, socket])

  // White player auto-initiates voice once game_state arrives; black auto-answers via useVoiceCall.
  // Track the socket instance so we can detect reconnects and restart voice after WS recovers.
  const voiceInitiated = useRef(false)
  const lastVoiceSocket = useRef<typeof socket>(null)
  useEffect(() => {
    if (socket !== lastVoiceSocket.current) {
      lastVoiceSocket.current = socket
      if (socket && voiceInitiated.current) {
        // Socket reconnected — old PC is dead. Reset so we retry below.
        // console.log('[GameScreen] socket reconnected — resetting voice for retry')
        voiceInitiated.current = false
      }
    }
    if (!gameState || !socket || voiceInitiated.current) return
    if (isEngineGame) return   // nobody to call in an engine game
    if (userColor === 'w') {
      voiceInitiated.current = true
      voice.startCall()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, userColor, socket, isEngineGame])

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
      const maxFromHeight = Math.max(280, window.innerHeight - (isMobile ? 284 : 288))
      let sizeFromWidth: number
      if (w < 480) sizeFromWidth = w - 12
      else if (w < 860) sizeFromWidth = Math.min(w - 32, 560)
      else {
        // Desktop: subtract the actual fixed chrome around the board —
        // sidebar (220) + main padding/gaps (~80) + right rail (320) and,
        // above 1250px, the left rail (300+16) too.
        const chrome = 220 + 80 + 320 + (w > 1250 ? 316 : 0)
        sizeFromWidth = Math.min(620, Math.max(300, w - chrome))
      }
      setBoardSize(Math.min(sizeFromWidth, maxFromHeight))
    }
    onResize()
    // Debounced: mobile browsers fire resize continuously while the URL bar
    // animates — recomputing the board each frame makes play feel jumpy.
    let t: ReturnType<typeof setTimeout> | undefined
    const debounced = () => { clearTimeout(t); t = setTimeout(onResize, 120) }
    window.addEventListener('resize', debounced)
    return () => { clearTimeout(t); window.removeEventListener('resize', debounced) }
  }, [isMobile])

  // Use a ref so the handler is never recreated and makeMove is never
  // called inside a state updater (which StrictMode would double-invoke).
  const handleSquareClick = useCallback((sq: string) => {
    if (isGameOverRef.current) return   // lock board as soon as game ends
    const uc = userColorRef.current
    const ownColor = uc === 'w' ? 'l' : 'd'
    const prev = selectedRef.current
    if (!prev) {
      // Only your own pieces are selectable, and only on your turn — anything
      // else would end in a guaranteed server rejection.
      const piece = displayPositionRef.current[sq]
      if (!piece || uc === null || piece.c !== ownColor || !isMyTurnRef.current) return
      selectedRef.current = sq
      setSelected(sq)
      playSelect()
    } else if (prev === sq) {
      selectedRef.current = null
      setSelected(null)
    } else {
      // If the user clicks one of their own pieces while another is selected,
      // re-select rather than sending an illegal move that triggers an error toast.
      const destPiece = displayPositionRef.current[sq]
      if (destPiece && uc !== null && destPiece.c === ownColor) {
        selectedRef.current = sq
        setSelected(sq)
        playSelect()
      } else {
        // Pawn reaching the last rank needs a promotion piece — ask first.
        const moving = displayPositionRef.current[prev]
        const destRank = sq[1]
        if (moving?.t === 'P' && ((moving.c === 'l' && destRank === '8') || (moving.c === 'd' && destRank === '1'))) {
          setPendingPromotion({ from: prev, to: sq })
        } else {
          makeMove(prev + sq)
        }
        selectedRef.current = null
        setSelected(null)
      }
    }
  }, [makeMove])

  const confirmPromotion = useCallback((p: { from: string; to: string }, piece: 'q' | 'r' | 'b' | 'n') => {
    makeMove(p.from + p.to + piece)
    setPendingPromotion(null)
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
  // Keep refs in sync so handleSquareClick can read current values without stale closure issues
  displayPositionRef.current = displayPosition
  userColorRef.current = userColor

  const hints = useMemo(() =>
    selected ? getHints(displayPosition, selected) : [],
  [selected, displayPosition])

  // sender_id is a UUID — prefer currentUser.user_id directly; fall back to color-derived ID
  const myPlayerId = currentUser?.user_id
    ?? (userColor === 'w' ? restGame?.white_player_id : restGame?.black_player_id)

  // Keep store in sync so chat sound can skip own messages
  useEffect(() => {
    if (myPlayerId) setMyPlayerId(myPlayerId)
  }, [myPlayerId, setMyPlayerId])

  // Game-start sound — once per session on first WS game_state
  useEffect(() => {
    if (gameState && !gameStartSoundPlayed.current) {
      gameStartSoundPlayed.current = true
      playGameStart()
    }
  }, [gameState])

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

  // Unread message count — resets when the chat panel is open
  const isChatOpen = (!isMobile && !chatCollapsed) || (isMobile && sheet === 'chat')
  useEffect(() => {
    if (isChatOpen) {
      chatForUI.forEach(m => seenMsgIds.current.add(m.id))
      setUnreadChats(0)
    } else {
      setUnreadChats(chatForUI.filter(m => !m.me && !seenMsgIds.current.has(m.id)).length)
    }
  }, [isChatOpen, chatForUI])

  // REST history (base) merged with live WS moves by ABSOLUTE index:
  // liveMoves[i] is the (moveOffset + i)-th move of the game, where moveOffset
  // came from the game_state snapshot. Plain concatenation breaks after a
  // reload mid-game (live moves restart at 0 while base already has N).
  const allMovesForHistory = useMemo(() => {
    const merged: { move: string; current_player: string }[] =
      (restMoves ?? []).map(m => ({ move: m.move_notation, current_player: m.player_color }))
    liveMoves.forEach((mv, i) => {
      merged[moveOffset + i] = { move: mv.move, current_player: mv.current_player === 'w' ? 'b' : 'w' }
    })
    return merged.filter(Boolean)
  }, [restMoves, liveMoves, moveOffset])

  // If the snapshot says more moves were played than REST returned, the REST
  // cache predates a reconnect — refresh it to fill the gap.
  useEffect(() => {
    if (gameId && restMoves && moveOffset > restMoves.length) {
      queryClient.invalidateQueries({ queryKey: ['moves', gameId] })
    }
  }, [gameId, moveOffset, restMoves, queryClient])

  // Opponent name: engine games name the engine; else WS, then REST fallback
  const opponentName = useMemo(() => {
    if (isEngineGame) return `Stockfish (level ${stockfishLevel})`
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
  }, [isEngineGame, stockfishLevel, gameState?.opponent_username, restGame, currentUser])

  // Turn / color helpers — before WS connects, derive from REST current_player
  const currentPlayer = gameState?.current_player ?? restGame?.current_player
  const isMyTurn = userColor ? currentPlayer === userColor : false
  isMyTurnRef.current = isMyTurn
  // Use === 'b' so that null (unresolved) defaults to 'white', consistent with the unflipped board
  const myColor = userColor === 'b' ? 'black' : 'white'
  const opponentColor = userColor === 'b' ? 'white' : 'black'
  const opponentUserId = isEngineGame ? undefined
    : userColor === 'w' ? restGame?.black_player_id : restGame?.white_player_id

  // Live check indicator: the side to move is the one in check. Board wants
  // the checked king's SQUARE, so find it in the current position.
  const inCheckNow = gameState?.in_check ?? restGame?.in_check ?? false
  const checkedKingSquare = useMemo(() => {
    if (!inCheckNow || !currentPlayer) return null
    const kingColor = currentPlayer === 'w' ? 'l' : 'd'
    for (const [sq, piece] of Object.entries(displayPosition)) {
      if (piece.t === 'K' && piece.c === kingColor) return sq
    }
    return null
  }, [inCheckNow, currentPlayer, displayPosition])

  // Prefer make_move.end_reason (arrives instantly with the move that ends the game).
  // Fall back to gameState.status, which is set from game_state.Status — this covers:
  //   • resign broadcast as a game_state event (no make_move involved)
  //   • legacy backends that use is_checkmate/is_stalemate flags but leave end_reason empty
  const wsEndReason =
    (gameState?.end_reason && gameState.end_reason !== '') ? gameState.end_reason
    : (gameState?.status && GAME_OVER_REASONS.includes(gameState.status)) ? gameState.status
    : null

  const isGameOver =
    GAME_OVER_REASONS.includes(restGame?.state ?? '') ||
    !!wsEndReason
  isGameOverRef.current = isGameOver
  const gameActive = restGame?.state === 'active' && !isGameOver

  // Timer: WS game_state is authoritative (synced on every broadcast), REST is initial value.
  const whiteMs = gameState?.white_time_remaining_ms ?? restGame?.white_time_remaining_ms ?? 600000
  const blackMs = gameState?.black_time_remaining_ms ?? restGame?.black_time_remaining_ms ?? 600000
  // Unlimited games carry zero on BOTH clocks; a timed game can only reach
  // zero on one side (and then it's over). Never infer "unlimited" from a
  // single clock hitting zero — that made the clock vanish at the flag.
  const unlimited = whiteMs === 0 && blackMs === 0
  const myMs       = userColor === 'b' ? blackMs : whiteMs
  const opponentMs = userColor === 'b' ? whiteMs : blackMs

  // When a flag falls locally, the server may end the game without a further
  // broadcast reaching us — refetch to pick up the timeout result.
  const onFlagFall = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['game', gameId] })
  }, [queryClient, gameId])

  // Game result for the end-game overlay.
  // Prefers WS end_reason (fires instantly on the move broadcast) over REST state.
  const gameResult = useMemo(() => {
    const reason = wsEndReason || (restGame?.end_reason || '') || restGame?.state
    if (!reason || !GAME_OVER_REASONS.includes(reason)) return null

    const endedById = (gameState?.ended_by_player_id && gameState.ended_by_player_id !== '')
      ? gameState.ended_by_player_id
      : restGame?.ended_by_player_id
    const currentPlayerNow = gameState?.current_player ?? restGame?.current_player

    // Fallback: if backend stores timeout as state='checkmate' without setting end_reason,
    // detect it by checking which player's clock reached zero.

    if (reason === 'stalemate') return { outcome: 'draw' as const, title: 'Draw', sub: 'by stalemate' }
    if (reason === 'draw')      return { outcome: 'draw' as const, title: 'Draw', sub: '' }
    if (reason === 'abandoned') return { outcome: 'draw' as const, title: 'Game abandoned', sub: '' }
    if (reason === 'checkmate') {
      // current_player after checkmate = the player who was just mated (it's their turn but they can't move)
      const iLost = currentPlayerNow === userColor
      return iLost
        ? { outcome: 'loss' as const, title: 'Checkmate', sub: `${opponentName} wins` }
        : { outcome: 'win' as const, title: 'Checkmate!', sub: 'You win!' }
    }
    if (reason === 'resign') {
      // ended_by_player_id = the player who resigned (loser)
      const loserIsMe = endedById === myPlayerId
      return loserIsMe
        ? { outcome: 'loss' as const, title: 'You resigned', sub: `${opponentName} wins` }
        : { outcome: 'win' as const, title: `${opponentName} resigned`, sub: 'You win!' }
    }
    if (reason === 'timeout') {
      // Move-path timeouts stamp ended_by_player_id with the FLAGGED player;
      // watcher timeouts leave it empty but leave current_player on the
      // flagged player — check the id first, fall back to current_player.
      const iLost = endedById ? endedById === myPlayerId : currentPlayerNow === userColor
      return iLost
        ? { outcome: 'loss' as const, title: "Time's up!", sub: `${opponentName} wins on time` }
        : { outcome: 'win' as const, title: 'You win on time!', sub: `${opponentName} ran out of time` }
    }
    return { outcome: 'draw' as const, title: 'Game over', sub: '' }
  }, [wsEndReason, gameState?.ended_by_player_id, gameState?.current_player, gameState?.status, restGame, userColor, myPlayerId, opponentName])

  // Low-time warning — once when user's clock crosses below 10 s
  useEffect(() => {
    if (gameActive && !unlimited && myMs > 0 && myMs <= 10_000 && !lowTimeSoundPlayed.current) {
      lowTimeSoundPlayed.current = true
      playLowTime()
    }
  }, [myMs, unlimited, gameActive])

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

  /* ──── Waiting for opponent (never shown for engine games) ──── */
  if (restGame?.state === 'waiting' && !isEngineGame) {
    return <WaitingLobby gameId={gameId!} playerColor={restGame.current_player} />
  }

  /* ──── Shared overlays ──── */
  const promotionOverlay = pendingPromotion && (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 15 }}>
      <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 20, textAlign: 'center' }}>
        <h3 className="font-display" style={{ fontSize: 16, margin: '0 0 12px', fontWeight: 500 }}>Promote to</h3>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {([['q', 'Queen'], ['r', 'Rook'], ['b', 'Bishop'], ['n', 'Knight']] as const).map(([p, label]) => (
            <button
              key={p}
              onClick={() => confirmPromotion(pendingPromotion, p)}
              title={label}
              aria-label={`Promote to ${label}`}
              style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-elev)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >
              <Piece type={p.toUpperCase()} color={userColor === 'b' ? 'dark' : 'light'} size={40} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const handleResign = () => {
    setResignOpen(false)
    api.resignGame(gameId!)
      .then(() => queryClient.invalidateQueries({ queryKey: ['game', gameId] }))
      .catch(() => addToast('Failed to resign', 'error'))
  }

  /* ──── Mobile layout ──── */
  if (isMobile) {
    return (
      <div className="fade-in" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)' }}>
        <audio ref={voice.remoteAudioRef} autoPlay />

        {/* No top bar on mobile — every pixel goes to the board; nav lives in the Actions sheet */}

        {voice.micDenied && !isEngineGame && (
          <div style={{ margin: '8px 12px 0', padding: '10px 14px', background: 'rgba(210,106,106,0.12)', border: '1px solid rgba(210,106,106,0.3)', borderRadius: 12, fontSize: 13, color: 'var(--color-red)', textAlign: 'center' }}>
            Microphone access is needed for voice chat. You can still play — enable it in browser settings to talk.
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 'calc(8px + env(safe-area-inset-top)) 6px calc(76px + env(safe-area-inset-bottom))', gap: 8 }}>
          <CompactPlayerStrip
            player={{ name: opponentName, rating: isEngineGame ? `Level ${stockfishLevel}` : '—', avatarColor: 'rose', online: isEngineGame || !opponentDisconnected, color: opponentColor, userId: opponentUserId }}
            isTurn={!isMyTurn}
            remainingMs={opponentMs}
            unlimited={unlimited}
            gameActive={gameActive}
          />

          <div style={{ position: 'relative', maxWidth: '100%' }}>
            <Board
              position={displayPosition}
              size={boardSize}
              selected={selected}
              hints={hints}
              lastMove={lastMoveSquares}
              check={checkedKingSquare}
              flipped={flipped}
              onSquareClick={handleSquareClick}
            />

            {promotionOverlay}

            {resignOpen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 280 }}>
                  <Icon name="flag" size={28} color="var(--color-red)" />
                  <h3 className="font-display" style={{ fontSize: 18, margin: '10px 0 6px', fontWeight: 500 }}>Resign?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: '0 0 16px' }}>Your opponent wins the game.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setResignOpen(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '10px 18px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                    <button onClick={handleResign} style={{ background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, padding: '10px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>Resign</button>
                  </div>
                </div>
              </div>
            )}

            {gameResult && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.92)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(6px)', zIndex: 20 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: `1px solid ${gameResult.outcome === 'win' ? 'rgba(229,169,59,0.4)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.4)' : 'var(--color-border)'}`, borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 280 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: gameResult.outcome === 'win' ? 'rgba(229,169,59,0.15)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${gameResult.outcome === 'win' ? 'rgba(229,169,59,0.35)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.35)' : 'var(--color-border)'}` }}>
                    <Icon name={gameResult.outcome === 'win' ? 'trophy' : gameResult.outcome === 'loss' ? 'flag' : 'handshake'} size={22} color={gameResult.outcome === 'win' ? 'var(--color-amber)' : gameResult.outcome === 'loss' ? 'var(--color-red)' : 'var(--color-text-secondary)'} />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 20, margin: '0 0 6px', fontWeight: 500, color: gameResult.outcome === 'win' ? 'var(--color-amber)' : gameResult.outcome === 'loss' ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{gameResult.title}</h3>
                  {gameResult.sub && <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: '0 0 18px' }}>{gameResult.sub}</p>}
                  <button onClick={() => navigate(`/replay/${gameId}`)} style={{ width: '100%', padding: '11px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', marginTop: gameResult.sub ? 0 : 16 }}>Review game</button>
                  <button onClick={() => navigate('/games')} style={{ width: '100%', padding: '11px 20px', borderRadius: 14, cursor: 'pointer', fontWeight: 500, fontSize: 14, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', marginTop: 8 }}>Back to games</button>
                </div>
              </div>
            )}
          </div>

          <CompactPlayerStrip
            player={{ name: currentUser?.username || 'You', rating: String(currentUser?.rating ?? 1200), avatarColor: 'amber', online: true, color: myColor, userId: currentUser?.user_id }}
            isTurn={isMyTurn}
            remainingMs={myMs}
            unlimited={unlimited}
            gameActive={gameActive}
            onFlag={onFlagFall}
          />

          <div style={{ width: '100%', maxWidth: 560 }}>
            <StatusBar
              turn={isMyTurn ? 'you' : opponentName}
              phase={gameState?.status || restGame?.state || 'active'}
              check={inCheckNow}
              moveNumber={allMovesForHistory.length}
              timeControl={unlimited ? 'Unlimited' : undefined}
            />
          </div>
        </div>

        {/* Floating dock */}
        <div style={{
          position: 'fixed', bottom: 'calc(6px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', zIndex: 50,
          display: 'flex', gap: 4, padding: 6,
          background: 'rgba(22,24,31,0.94)', border: '1px solid var(--color-border-strong)',
          borderRadius: 999, backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
        }}>
          {!isEngineGame && <button
            onClick={voice.toggleMute}
            disabled={voice.status !== 'connected' && voice.status !== 'degraded'}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 12px', borderRadius: 999, border: 'none',
              cursor: (voice.status === 'connected' || voice.status === 'degraded') ? 'pointer' : 'default',
              background: (voice.status !== 'connected' && voice.status !== 'degraded') ? 'transparent' : voice.muted ? 'transparent' : 'var(--color-amber)',
              color: (voice.status !== 'connected' && voice.status !== 'degraded') ? 'var(--color-text-muted)' : voice.muted ? 'var(--color-text-secondary)' : '#1A1408',
              opacity: (voice.status === 'connected' || voice.status === 'degraded') ? 1 : 0.4,
              transition: 'all .15s ease', minWidth: 52,
            }}
          >
            <Icon name={voice.muted ? 'mic-off' : 'mic'} size={18} color="currentColor" />
            <span style={{ fontSize: 9, fontWeight: 600 }}>{voice.muted ? 'Unmute' : 'Mute'}</span>
          </button>}
          {([
            { k: 'chat' as const, icon: 'chat' as const, label: 'Chat', badge: unreadChats },
            { k: 'moves' as const, icon: 'clock' as const, label: 'Moves', badge: 0 },
            { k: 'actions' as const, icon: 'zap' as const, label: 'Actions', badge: 0 },
            { k: 'theme' as const, icon: 'settings' as const, label: 'Theme', badge: 0 },
          ] as const).filter(item => !(isEngineGame && item.k === 'chat')).map(item => (
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
              <div style={{ position: 'relative' }}>
                <Icon name={item.icon} size={18} color={sheet === item.k ? '#1A1408' : 'currentColor'} />
                {item.badge > 0 && (
                  <div style={{
                    position: 'absolute', top: -5, right: -8,
                    background: 'var(--color-red)', color: '#fff', borderRadius: 999,
                    minWidth: 14, height: 14, fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        <BottomSheet open={sheet === 'chat'} onClose={() => setSheet(null)} title="Chat">
          <div style={{ height: 'min(360px, 55dvh)', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel messages={chatForUI} onSend={handleSend} opponentName={opponentName} chatLimited={chatForUI.length >= 200} closed={isGameOver} />
          </div>
        </BottomSheet>
        <BottomSheet open={sheet === 'moves'} onClose={() => setSheet(null)} title="Move History">
          <div style={{ maxHeight: 340, overflow: 'auto' }}>
            <MoveHistory moves={allMovesForHistory} />
          </div>
        </BottomSheet>
        <BottomSheet open={sheet === 'actions'} onClose={() => setSheet(null)} title="Actions">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => { setResignOpen(true); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, cursor: 'pointer', fontWeight: 500 }}>
              <Icon name="flag" size={16} /> Resign
            </button>
            <button onClick={() => { setManualFlip(f => f === null ? !autoFlipped : !f); setSheet(null) }} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
              ⇅ Flip board
            </button>
            <button onClick={() => navigate('/games')} style={{ padding: 14, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}>
              <Icon name="arrow-left" size={16} /> Back to games
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
    <div className="fade-in" style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <audio ref={voice.remoteAudioRef} autoPlay />
      <Sidebar />
      <main className="game-main" style={{ flex: 1, padding: 24, display: 'grid', gap: 16, alignItems: 'start', height: '100dvh', overflow: 'hidden', boxSizing: 'border-box' }}>
        {/* LEFT — voice + chat (or engine info) */}
        <div className="game-left" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: boardSize + 238, minWidth: 0 }}>
          {isEngineGame ? (
            <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(229,169,59,0.12)', border: '1px solid rgba(229,169,59,0.32)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="zap" size={18} color="var(--color-amber)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Playing Stockfish</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Level {stockfishLevel} of 20 · unrated</div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                      {unreadChats > 0
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'var(--color-red)', fontSize: 10, color: '#fff', fontWeight: 700 }}>{unreadChats > 99 ? '99+' : unreadChats}</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 999, background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)', fontSize: 10, color: 'var(--color-text-secondary)' }}>{chatForUI.length}</span>
                      }
                    </div>
                    <Icon name={chatCollapsed ? 'arrow-right' : 'x'} size={14} color="var(--color-text-muted)" />
                  </div>
                  {!chatCollapsed && <ChatPanel messages={chatForUI} onSend={handleSend} opponentName={opponentName} chatLimited={chatForUI.length >= 200} closed={isGameOver} />}
                </div>
              </div>
            </>
          )}
        </div>

        {/* CENTER */}
        <div className="game-center" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <div className="player-card-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <PlayerCard
              player={{ name: opponentName, rating: isEngineGame ? `Level ${stockfishLevel}` : '—', color: opponentColor, online: isEngineGame || !opponentDisconnected, avatarColor: 'rose', userId: opponentUserId }}
              isTurn={!isMyTurn}
              remainingMs={opponentMs}
              unlimited={unlimited}
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
              check={checkedKingSquare}
              flipped={flipped}
              onSquareClick={handleSquareClick}
            />
            {promotionOverlay}
            {resignOpen && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.85)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24, textAlign: 'center', maxWidth: 320 }}>
                  <Icon name="flag" size={32} color="var(--color-red)" />
                  <h3 className="font-display" style={{ fontSize: 20, margin: '10px 0 6px', fontWeight: 500 }}>Resign the game?</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: '0 0 16px' }}>Your opponent wins the game.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => setResignOpen(false)} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleResign} style={{ background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, padding: '10px 16px', fontWeight: 500, cursor: 'pointer' }}>Yes, resign</button>
                  </div>
                </div>
              </div>
            )}

            {gameResult && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,15,19,0.92)', display: 'grid', placeItems: 'center', borderRadius: 18, backdropFilter: 'blur(6px)', zIndex: 20 }}>
                <div style={{ background: 'var(--color-bg-raised)', border: `1px solid ${gameResult.outcome === 'win' ? 'rgba(229,169,59,0.4)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.4)' : 'var(--color-border)'}`, borderRadius: 20, padding: 32, textAlign: 'center', maxWidth: 320 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px', display: 'grid', placeItems: 'center', background: gameResult.outcome === 'win' ? 'rgba(229,169,59,0.15)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${gameResult.outcome === 'win' ? 'rgba(229,169,59,0.35)' : gameResult.outcome === 'loss' ? 'rgba(210,106,106,0.35)' : 'var(--color-border)'}` }}>
                    <Icon name={gameResult.outcome === 'win' ? 'trophy' : gameResult.outcome === 'loss' ? 'flag' : 'handshake'} size={26} color={gameResult.outcome === 'win' ? 'var(--color-amber)' : gameResult.outcome === 'loss' ? 'var(--color-red)' : 'var(--color-text-secondary)'} />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 24, margin: '0 0 6px', fontWeight: 500, color: gameResult.outcome === 'win' ? 'var(--color-amber)' : gameResult.outcome === 'loss' ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{gameResult.title}</h3>
                  {gameResult.sub && <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 22px' }}>{gameResult.sub}</p>}
                  <button onClick={() => navigate(`/replay/${gameId}`)} style={{ width: '100%', padding: '13px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15, background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', marginTop: gameResult.sub ? 0 : 20 }}>Review game</button>
                  <button onClick={() => navigate('/games')} style={{ width: '100%', padding: '13px 20px', borderRadius: 14, cursor: 'pointer', fontWeight: 500, fontSize: 15, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', marginTop: 8 }}>Back to games</button>
                </div>
              </div>
            )}
          </div>
          <div className="player-card-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <PlayerCard
              player={{ name: currentUser?.username || 'You', rating: String(currentUser?.rating ?? 1200), color: myColor, online: true, avatarColor: 'amber', userId: currentUser?.user_id }}
              isTurn={isMyTurn}
              remainingMs={myMs}
              unlimited={unlimited}
              gameActive={gameActive}
              onFlag={onFlagFall}
            />
          </div>
          <div className="game-status-wrap" style={{ width: '100%', maxWidth: 620 }}>
            <StatusBar
              turn={isMyTurn ? 'you' : opponentName}
              phase={gameState?.status || restGame?.state || 'active'}
              check={inCheckNow}
              moveNumber={allMovesForHistory.length}
              timeControl={unlimited ? 'Unlimited' : undefined}
            />
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
              <button
                onClick={() => setManualFlip(f => f === null ? !autoFlipped : !f)}
                style={{ padding: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, cursor: 'pointer', fontWeight: 500 }}
              >
                ⇅ Flip board
              </button>
              <button onClick={() => setResignOpen(true)} disabled={isGameOver} style={{ padding: 10, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(210,106,106,0.12)', color: '#E89494', border: '1px solid rgba(210,106,106,0.32)', borderRadius: 12, cursor: isGameOver ? 'default' : 'pointer', fontWeight: 500, opacity: isGameOver ? 0.5 : 1 }}>
                <Icon name="flag" size={14} /> Resign
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 12, overflow: 'hidden' }}>
            <PieceThemeSelector compact />
          </div>
        </div>
      </main>
    </div>
  )
}