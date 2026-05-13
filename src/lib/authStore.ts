import { create } from 'zustand'
import { setTokenGetter, setRefreshTokenGetter, setOnTokensRefreshed } from './api'

const TOKEN_KEY = 'chesske_token'
const REFRESH_KEY = 'chesske_refresh'

export interface AuthUser {
  username: string
  email: string
  email_confirmed: boolean
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null

  setAuth: (token: string, refreshToken: string) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => {
  // Hydrate tokens from localStorage on init
  const storedToken = localStorage.getItem(TOKEN_KEY)
  const storedRefresh = localStorage.getItem(REFRESH_KEY)

  // Wire up the API client's token getters immediately
  setTokenGetter(() => useAuth.getState().token)
  setRefreshTokenGetter(() => useAuth.getState().refreshToken)
  setOnTokensRefreshed((access, refresh) => useAuth.getState().setAuth(access, refresh))

  return {
    user: null,
    token: storedToken,
    refreshToken: storedRefresh,

    setAuth: (token, refreshToken) => {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(REFRESH_KEY, refreshToken)
      setTokenGetter(() => useAuth.getState().token)
      set({ token, refreshToken })
    },

    setUser: (user) => set({ user }),

    logout: () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      set({ user: null, token: null, refreshToken: null })
    },
  }
})
