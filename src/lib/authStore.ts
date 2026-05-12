import { create } from 'zustand'

// Client-only state: who is logged in, UI preferences.
// Server data (games, moves) lives in React Query.
export interface AuthUser {
  id: string
  username: string
  rating: number
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
