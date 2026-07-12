const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.chesske.com'

// The spectator page is server-rendered by the Go backend. In production
// nginx serves it on the apex domain (chesske.com/game/:id); in dev the SPA
// doesn't own that route, so link straight to the backend.
export function spectateUrl(gameId: string): string {
  return import.meta.env.DEV ? `${BASE_URL}/game/${gameId}` : `/game/${gameId}`
}

// Auth is handled via HttpOnly cookies set by the server on signin.
// The browser sends them automatically with `credentials: 'include'`.
// No Authorization header or client-side token management needed.

let refreshPromise: Promise<boolean> | null = null

// Called on page load when the user is cookie-authenticated but has no wsToken in memory.
// Returns the new access_token so callers can store it for WebSocket auth.
export async function fetchFreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/users/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => ({}))
    return typeof data.access_token === 'string' ? data.access_token : null
  } catch {
    return null
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (!res.ok) return false
      // Server sets new access_token cookie in the response
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = false,
): Promise<T> {
  const makeRequest = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })
    if (res.ok) {
      if (res.status === 204) return undefined as T
      return res.json() as Promise<T>
    }
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, err.message || err.error || res.statusText, err)
  }

  try {
    return await makeRequest()
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && auth) {
      const refreshed = await tryRefreshToken()
      if (refreshed) return makeRequest()
    }
    throw e
  }
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type GameState =
  | 'waiting'
  | 'active'
  | 'checkmate'
  | 'stalemate'
  | 'resign'
  | 'draw'
  | 'abandoned'
  | 'timeout'

export type PlayerColor = 'w' | 'b'

export type PieceSymbol =
  | 'r' | 'n' | 'b' | 'q' | 'k' | 'p'   // black pieces (lowercase)
  | 'R' | 'N' | 'B' | 'Q' | 'K' | 'P'   // white pieces (uppercase)

export type Square = string   // e.g. "e4", "a1"

// ─────────────────────────────────────────────
// Board
// ─────────────────────────────────────────────

export interface BoardState {
  board: Record<Square, PieceSymbol>
  stockfish_game: string | null
}

// board_state arrives as a JSON string — parse it with this helper
export function parseBoardState(game: Game): BoardState {
  return JSON.parse(game.board_state) as BoardState
}

// ─────────────────────────────────────────────
// REST response types
// ─────────────────────────────────────────────

export interface Game {
  id: string
  white_player_id: string
  black_player_id: string
  white_player_name?: string
  black_player_name?: string
  state: GameState
  in_check: boolean
  current_player: PlayerColor
  move_count: number
  board_state: string        // JSON string — use parseBoardState()
  white_time_remaining_ms: number
  black_time_remaining_ms: number
  end_reason?: 'resign' | 'checkmate' | 'stalemate' | 'timeout' | ''
  ended_by_player_id?: string
  visibility?: 'public' | 'private'
  opponent?: 'person' | 'stockfish'
  stockfish_level?: number
  created_at: string
  updated_at: string
}

// GET /games/live — public person-vs-person games currently being played
export interface LiveGame {
  id: string
  white_username: string
  white_rating: number
  black_username: string
  black_rating: number
  current_player: PlayerColor
  move_count: number
  white_time_remaining_ms: number
  black_time_remaining_ms: number
  created_at: string
  updated_at: string
}

// GET /games/:id/replay — everything needed to step through a finished game
export interface GameReplay {
  game_id: string
  white_player_name: string
  black_player_name: string
  opponent: 'person' | 'stockfish'
  stockfish_level: number
  state: GameState
  end_reason: string
  ended_by_player_id: string
  moves: string[]            // UCI, in play order
  move_count: number
  created_at: string
  updated_at: string
}

export interface GameMove {
  id: string
  game_id: string
  player_id: string
  player_color: PlayerColor
  move_notation: string      // e.g. "e2e4"
  move_number: number
  created_at: string
}

export interface ChatMessage {
  id: string
  game_id: string
  sender_id: string
  content: string
  created_at: string
}

// ─────────────────────────────────────────────
// Auth types
// ─────────────────────────────────────────────

export interface SignupRequest {
  email: string
  password: string
  username: string
}

export interface SignupResponse {
  created_at: string
  email: string
  password_changed_at: string
  username: string
}

export interface SigninRequest {
  email: string
  password: string
}

export interface SigninResponse {
  access_token: string
  refresh_token: string
  username: string
  password_changed_at: string
  last_login_at: string
}

export interface MeResponse {
  user_id: string
  created_at: string
  email: string
  email_confirmed: boolean
  is_active: boolean
  last_login_at: string
  username: string
  rating: number             // Elo, starts at 1200
}

export interface CreateGameRequest {
  opponent: 'person' | 'stockfish'
  player_color: PlayerColor
  time_control: 0 | 5 | 10 | 15 | 30 | 45 | 60   // minutes; 0 = unlimited
  visibility?: 'public' | 'private'
  stockfish_level?: number   // 0 (weakest) – 20 (full strength); engine games only
}

export interface CheckUsernameResponse {
  username: string
  exists: boolean
}

// ─────────────────────────────────────────────
// WebSocket envelope
// ─────────────────────────────────────────────

export interface WSEvent<T = unknown> {
  type: string
  payload?: T
}

// ─────────────────────────────────────────────
// WebSocket — outbound (client → server)
// ─────────────────────────────────────────────

export type WSOutboundEvent =
  | { type: 'auth';         payload: { token: string } }
  | { type: 'make_move';    payload: { move: string } }
  | { type: 'chat';         payload: { content: string } }
  | { type: 'pong' }
  | { type: 'voice_offer';  payload: RTCSessionDescriptionInit }
  | { type: 'voice_answer'; payload: RTCSessionDescriptionInit }
  | { type: 'voice_ice';    payload: RTCIceCandidateInit }
  | { type: 'voice_end' }
  | { type: 'voice_stats';  payload: { localType: string; remoteType: string; relayProtocol: string | null; selectedPair: string; localCandidate: string; remoteCandidate: string } }

// ─────────────────────────────────────────────
// WebSocket — inbound (server → client)
// ─────────────────────────────────────────────

// Sent immediately on connect — client must reply with auth
export interface WSAuthRequired {
  type: 'auth_required'
}

// Sent after successful auth and after reconnect.
// Backend serialises as PascalCase Go struct nested under "game".
export interface WSBoardCell {
  Occupied: boolean
  Piece: { PieceType: string; Color: 'w' | 'b'; Position: string; Points: number } | null
}

export interface WSGameStateEvent {
  type: 'game_state'
  payload: {
    game: {
      CurrentPlayer: PlayerColor
      Board: WSBoardCell[][]   // [rankIdx 0=rank1 … 7=rank8][fileIdx 0=a … 7=h]
      MoveNumber: number
      Status: string
      InCheck: boolean
      PlayAgainst: string
      UserColor: string        // may be "" — frontend derives color from REST fallback
      WhiteTimeRemainingMs?: number
      BlackTimeRemainingMs?: number
    }
    opponent_username?: string
  }
}

// Broadcast to both players after every valid move
export interface WSMoveEvent {
  type: 'make_move'
  payload: {
    move: string               // e.g. "e2e4"
    current_player: PlayerColor
    in_check: boolean
    is_checkmate: boolean
    is_stalemate: boolean
    end_reason: string         // "" during play; "checkmate"|"stalemate"|"timeout" on game end
    ended_by_player_id: string // "" during play; winner's ID on timeout/checkmate, loser's ID on resign
    white_time_remaining_ms: number
    black_time_remaining_ms: number
  }
}

// Broadcast to both players after a chat message is persisted
export interface WSChatEvent {
  type: 'chat'
  payload: ChatMessage         // same shape as REST ChatMessage
}

// Broadcast when a player's WebSocket session drops
export interface WSPlayerDisconnectedEvent {
  type: 'player_disconnected'
  payload: { username: string; color: PlayerColor }
}

export interface WSPlayerReconnectedEvent {
  type: 'player_reconnected'
  payload: { username: string; color: PlayerColor }
}

// Server keepalive — must reply immediately with { type: 'pong' }
export interface WSPingEvent {
  type: 'ping'
}

export interface WSErrorEvent {
  type: 'error'
  payload: { error: string }
}

// WebRTC signalling — relayed as-is from the other player
export interface WSVoiceOfferEvent   { type: 'voice_offer';  payload: RTCSessionDescriptionInit }
export interface WSVoiceAnswerEvent  { type: 'voice_answer'; payload: RTCSessionDescriptionInit }
export interface WSVoiceICEEvent     { type: 'voice_ice';    payload: RTCIceCandidateInit }
export interface WSVoiceEndEvent     { type: 'voice_end' }

// Everything the client can receive — use this in your message handler switch
export type WSInboundEvent =
  | WSAuthRequired
  | WSGameStateEvent
  | WSMoveEvent
  | WSChatEvent
  | WSPlayerDisconnectedEvent
  | WSPlayerReconnectedEvent
  | WSPingEvent
  | WSErrorEvent
  | WSVoiceOfferEvent
  | WSVoiceAnswerEvent
  | WSVoiceICEEvent
  | WSVoiceEndEvent

// Type-safe send helper — use this instead of ws.send(JSON.stringify(...)) directly
export function wsSend(ws: WebSocket, event: WSOutboundEvent): void {
  ws.send(JSON.stringify(event))
}

// Type-safe message parser — use this in ws.onmessage
export function wsParseInbound(raw: string): WSInboundEvent | null {
  try {
    return JSON.parse(raw) as WSInboundEvent
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// WebSocket connection
// ─────────────────────────────────────────────

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'wss://api.chesske.com'

export function createGameSocket(gameId: string): WebSocket {
  return new WebSocket(`${WS_BASE_URL}/ws?game_id=${gameId}`)
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

export const api = {
  // Auth
  signup:        (data: SignupRequest) =>
                   request<SignupResponse>('POST', '/users/signup', data),
  signin:        (data: SigninRequest) =>
                   request<SigninResponse>('POST', '/users/signin', data),
  checkUsername: (username: string) =>
                   request<CheckUsernameResponse>('GET', `/users/check-username?username=${encodeURIComponent(username)}`),
  confirmEmail:  (data: { email: string; email_otp: string }) =>
                   request<{ email: string; message: string }>('POST', '/users/confirm-email', data),
  resendOTP:     (email: string) =>
                   request<{ email: string; msg: string }>('POST', '/users/send-emailotp', { email }),
  me:            () =>
                   request<MeResponse>('GET', '/users/me', undefined, true),

  // Games
  listGames:     () =>
                   request<Game[]>('GET', '/games', undefined, true),
  createGame:    (data: CreateGameRequest) =>
                   request<Game>('POST', '/games', data, true),
  myGames:       () =>
                   request<Game[]>('GET', '/games/mine', undefined, true),
  getGame:       (id: string) =>
                   request<Game>('GET', `/games/${id}`, undefined, true),
  joinGame:      (id: string) =>
                   request<Game>('POST', `/games/${id}/join`, undefined, true),
  getMoves:      (id: string) =>
                   request<GameMove[]>('GET', `/games/${id}/moves`, undefined, true),
  getReplay:     (id: string) =>
                   request<GameReplay>('GET', `/games/${id}/replay`, undefined, true),
  resignGame:    (id: string) =>
                   request<Game>('POST', `/games/${id}/resign`, undefined, true),
  deleteGame:    (id: string) =>
                   request<{ message: string }>('DELETE', `/games/${id}`, undefined, true),

  // Password reset
  forgotPassword: (email: string) =>
                   request<{ msg: string; email: string }>('POST', '/users/forgot-password', { email }),
  resetPassword:  (data: { email: string; otp: string; new_password: string }) =>
                   request<{ message: string }>('POST', '/users/reset-password', data),

  // Chat (REST — for loading history; live chat goes over WebSocket)
  getChat:       (gameId: string) =>
                   request<ChatMessage[]>('GET', `/games/${gameId}/chat`, undefined, true),

  // TURN credentials for WebRTC
  turnCredentials: () =>
                   request<{ iceServers: RTCIceServer[] }>('GET', '/turn-credentials', undefined, true),

  // Logout — invalidates the session cookie on the server
  logout: () =>
          request<void>('POST', '/users/logout', undefined, true),

  // Public games — no auth required
  publicGames: (): Promise<Game[]> =>
    fetch(`${BASE_URL}/games/public`)
      .then(r => { if (!r.ok) throw new Error('Failed to fetch public games'); return r.json() }),

  // Live games — public, no auth; spectators watch these at /game/:id
  liveGames: (): Promise<LiveGame[]> =>
    fetch(`${BASE_URL}/games/live`)
      .then(r => { if (!r.ok) throw new Error('Failed to fetch live games'); return r.json() }),
}