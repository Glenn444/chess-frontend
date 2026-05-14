import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, fetchFreshToken, type CreateGameRequest } from './api'
import { useAuth } from './authStore'
import type { LoginForm, RegisterForm } from './schemas'

// ─── /me — rehydrate user profile via HttpOnly cookie ───
export function useMe() {
  const setUser = useAuth(s => s.setUser)
  const setWsToken = useAuth(s => s.setWsToken)

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const me = await api.me()
      setUser(me)
      // Always refresh wsToken on page load so a stale sessionStorage token never causes WS auth to fail.
      const token = await fetchFreshToken()
      if (token) {
        console.log('[useMe] wsToken refreshed')
        setWsToken(token)
      } else {
        console.warn('[useMe] could not obtain wsToken — WS will not connect until next login')
      }
      return me
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Signin (login) mutation ───
export function useLogin() {
  const queryClient = useQueryClient()
  const setUser = useAuth(s => s.setUser)
  const setWsToken = useAuth(s => s.setWsToken)

  return useMutation({
    mutationFn: (data: LoginForm) => api.signin(data),
    onSuccess: async (signinData) => {
      // Cookies set by browser. Store access token in memory for WebSocket auth.
      setWsToken(signinData.access_token)

      // Fetch user profile — access_token cookie sent automatically.
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
    mutationFn: (data: CreateGameRequest) => api.createGame(data),
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
