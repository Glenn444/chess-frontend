import { create } from 'zustand'

export interface AuthUser {
  user_id: string
  username: string
  email: string
  email_confirmed: boolean
  is_active: boolean
  rating?: number   // Elo — present on /users/me responses
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  wsToken: string | null

  setUser: (user: AuthUser | null) => void
  setWsToken: (token: string) => void
  logout: () => void
}

const WS_TOKEN_KEY = 'chesske_ws_token'

export const useAuth = create<AuthState>((set) => ({
  user: null,
  // Survive page refresh — cleared on logout or browser-session end
  wsToken: sessionStorage.getItem(WS_TOKEN_KEY),

  setUser: (user) => set({ user }),

  setWsToken: (wsToken) => {
    sessionStorage.setItem(WS_TOKEN_KEY, wsToken)
    set({ wsToken })
  },

  logout: () => {
    sessionStorage.removeItem(WS_TOKEN_KEY)
    set({ user: null, wsToken: null })
  },
}))
