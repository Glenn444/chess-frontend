import { create } from 'zustand'

export interface AuthUser {
  username: string
  email: string
  email_confirmed: boolean
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  wsToken: string | null     // access token for WebSocket auth (memory only)

  setUser: (user: AuthUser | null) => void
  setWsToken: (token: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  wsToken: null,

  setUser: (user) => set({ user }),

  setWsToken: (wsToken) => set({ wsToken }),

  logout: () => set({ user: null, wsToken: null }),
}))
