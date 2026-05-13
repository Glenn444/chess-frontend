const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.chesske.com'

let tokenGetter: (() => string | null) = () => null
let refreshTokenGetter: (() => string | null) = () => null
let onTokensRefreshed: ((access: string, refresh: string) => void) | null = null

export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn
}
export function setRefreshTokenGetter(fn: () => string | null) {
  refreshTokenGetter = fn
}
export function setOnTokensRefreshed(fn: (access: string, refresh: string) => void) {
  onTokensRefreshed = fn
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  const refresh = refreshTokenGetter()
  if (!refresh) return false

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) return false
      const data = await res.json()
      onTokensRefreshed?.(data.access_token, data.refresh_token || refresh)
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

    if (auth) {
      const token = tokenGetter()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
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

// ── Auth ──
export interface SignupRequest { email: string; password: string; username: string }
export interface SignupResponse { created_at: string; email: string; password_changed_at: string; username: string }

export interface SigninRequest { email: string; password: string }
export interface SigninResponse { access_token: string; refresh_token: string; username: string; password_changed_at: string; last_login_at: string }

export interface RefreshResponse { access_token: string; message: string }

export interface MeResponse { created_at: string; email: string; email_confirmed: boolean; is_active: boolean; last_login_at: string; username: string }

export const api = {
  // Auth
  signup: (data: SignupRequest) => request<SignupResponse>('POST', '/users/signup', data),
  signin: (data: SigninRequest) => request<SigninResponse>('POST', '/users/signin', data),
  checkUsername: (username: string) => request<unknown>('GET', `/users/check-username?username=${encodeURIComponent(username)}`),
  confirmEmail: (data: { email: string; email_otp: string }) => request<{ email: string; message: string }>('POST', '/users/confirm-email', data),
  resendOTP: (email: string) => request<{ email: string; msg: string }>('POST', '/users/send-emailotp', { email }),
  me: () => request<MeResponse>('GET', '/users/me', undefined, true),
  refreshToken: (refresh_token: string) => request<RefreshResponse>('POST', '/users/refresh-token', { refresh_token }),

  // Games
  listGames: () => request<unknown[]>('GET', '/games', undefined, true),
  createGame: (data: { opponent: 'person' | 'stockfish'; player_color: 'w' | 'b'; initial_time_seconds?: number; increment_seconds?: number }) => request<unknown>('POST', '/games', data, true),
  myGames: () => request<unknown[]>('GET', '/games/mine', undefined, true),
  getGame: (id: string) => request<unknown>('GET', `/games/${id}`, undefined, true),
  joinGame: (id: string) => request<unknown>('POST', `/games/${id}/join`, undefined, true),
  getMoves: (id: string) => request<unknown[]>('GET', `/games/${id}/moves`, undefined, true),
  resignGame: (id: string) => request<unknown>('POST', `/games/${id}/resign`, undefined, true),
  deleteGame: (id: string) => request<unknown>('DELETE', `/games/${id}`, undefined, true),

  // Chat
  getChat: (gameId: string) => request<unknown[]>('GET', `/games/${gameId}/chat`, undefined, true),
  sendChat: (gameId: string, content: string) => request<unknown>('POST', `/games/${gameId}/chat`, { content }, true),

  // TURN credentials — fetch fresh before each call
  turnCredentials: () => request<{ iceServers: RTCIceServer[] }>('GET', '/turn-credentials', undefined, true),

  // Voice
  getVoice: (gameId: string) => request<unknown>('GET', `/games/${gameId}/voice`, undefined, true),
  startVoice: (gameId: string) => request<unknown>('POST', `/games/${gameId}/voice`, undefined, true),
  endVoice: (gameId: string, vid: string) => request<unknown>('DELETE', `/games/${gameId}/voice/${vid}`, undefined, true),
  acceptVoice: (gameId: string, vid: string) => request<unknown>('PATCH', `/games/${gameId}/voice/${vid}/activate`, undefined, true),
}
