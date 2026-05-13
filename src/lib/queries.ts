import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuth } from './authStore'
import type { LoginForm, RegisterForm } from './schemas'

// ─── /me — rehydrate user profile using stored JWT ───
export function useMe() {
  const token = useAuth(s => s.token)

  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.me(),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Signin (login) mutation ───
export function useLogin() {
  const queryClient = useQueryClient()
  const setAuth = useAuth(s => s.setAuth)
  const setUser = useAuth(s => s.setUser)

  return useMutation({
    mutationFn: (data: LoginForm) => api.signin(data),
    onSuccess: async (signinData) => {
      // Store tokens
      setAuth(signinData.access_token, signinData.refresh_token)

      // Fetch user profile with the new token
      try {
        const me = await api.me()
        setUser(me)
        queryClient.setQueryData(['me'], me)
      } catch {
        // /me call failed but signin succeeded — user can still use the app
      }
    },
  })
}

// ─── Signup (register) mutation — signup only, user must verify email before login ──
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterForm) => api.signup(data),
  })
}

// ─── Email verification ──
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: { email: string; email_otp: string }) => api.confirmEmail(data),
  })
}

// ─── Resend OTP ──
export function useResendOTP() {
  return useMutation({
    mutationFn: (email: string) => api.resendOTP(email),
  })
}

// ─── Logout ───
export function useLogout() {
  const queryClient = useQueryClient()
  const logout = useAuth(s => s.logout)

  return useMutation({
    mutationFn: () => {
      logout()
      queryClient.clear()
      return Promise.resolve()
    },
  })
}

// ─── Active / waiting games ───
export function useWaitingGames() {
  return useQuery({
    queryKey: ['games', 'waiting'],
    queryFn: () => api.listGames(),
    refetchInterval: 10_000,
  })
}

// ─── My games ───
export function useMyGames() {
  return useQuery({
    queryKey: ['games', 'mine'],
    queryFn: () => api.myGames(),
    refetchInterval: 10_000,
  })
}

// ─── Create game ───
export function useCreateGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { opponent: 'person' | 'stockfish'; player_color: 'w' | 'b'; initial_time_seconds?: number; increment_seconds?: number }) =>
      api.createGame(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

// ─── Join game ───
export function useJoinGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gameId: string) => api.joinGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

// ─── Game moves ───
export function useGameMoves(gameId: string | null) {
  return useQuery({
    queryKey: ['games', gameId, 'moves'],
    queryFn: () => api.getMoves(gameId!),
    enabled: !!gameId,
    refetchInterval: 3_000,
  })
}

// ─── Chat messages ───
export function useGameChat(gameId: string | null) {
  return useQuery({
    queryKey: ['games', gameId, 'chat'],
    queryFn: () => api.getChat(gameId!),
    enabled: !!gameId,
    refetchInterval: 3_000,
  })
}

// ─── Send chat ───
export function useSendChat(gameId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => api.sendChat(gameId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games', gameId, 'chat'] })
    },
  })
}

// ─── Resign ───
export function useResignGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gameId: string) => api.resignGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

// ─── Delete game ───
export function useDeleteGame() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gameId: string) => api.deleteGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })
}
