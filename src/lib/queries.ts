import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LoginForm, RegisterForm } from './schemas'
import type { AuthUser } from './authStore'

// ─── /me hydration ───
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () =>
      fetch('/api/auth/me', { credentials: 'include' })
        .then(r => (r.ok ? r.json() as Promise<{ user: AuthUser }> : null)),
    retry: false,
    staleTime: Infinity,
  })
}

// ─── Login mutation ───
export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginForm) =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ message: 'Login failed' }))
          throw new Error(err.message || 'Login failed')
        }
        return r.json() as Promise<{ user: AuthUser }>
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
    },
  })
}

// ─── Register mutation ───
export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterForm) =>
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ message: 'Registration failed' }))
          throw new Error(err.message || 'Registration failed')
        }
        return r.json() as Promise<{ user: AuthUser }>
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data)
    },
  })
}

// ─── Logout mutation ───
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

// ─── Active games (polled) ───
export function useActiveGames() {
  return useQuery({
    queryKey: ['games', 'active'],
    queryFn: () =>
      fetch('/api/games/active', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 10_000,
  })
}
