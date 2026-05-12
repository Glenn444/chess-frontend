import { create } from 'zustand'

const ADMIN_KEY = 'chesske_admin_auth'
const USERS_KEY = 'chesske_admin_users'

// Default admin credentials
const DEFAULT_ADMIN = { username: 'admin', password: 'chesske2026' }

export interface ManagedUser {
  id: string
  username: string
  email: string
  rating: number
  role: 'user' | 'admin'
  createdAt: string
  banned: boolean
}

function uid() { return Math.random().toString(36).slice(2, 10) }

function seedUsers(): ManagedUser[] {
  return [
    { id: uid(), username: 'Alex Chen', email: 'alex@chesske.gg', rating: 1547, role: 'user', createdAt: '2026-04-15', banned: false },
    { id: uid(), username: 'Maya R', email: 'maya@chesske.gg', rating: 1612, role: 'user', createdAt: '2026-04-20', banned: false },
    { id: uid(), username: 'Magnus_J', email: 'magnus@chesske.gg', rating: 2840, role: 'user', createdAt: '2026-03-01', banned: false },
    { id: uid(), username: 'fabi_c', email: 'fabi@chesske.gg', rating: 2792, role: 'user', createdAt: '2026-03-05', banned: false },
    { id: uid(), username: 'pawnstorm', email: 'pawn@chesske.gg', rating: 1024, role: 'user', createdAt: '2026-05-01', banned: true },
  ]
}

function loadUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const defaults = seedUsers()
  localStorage.setItem(USERS_KEY, JSON.stringify(defaults))
  return defaults
}

function persistUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

interface AdminState {
  isAdmin: boolean
  adminLogin: (username: string, password: string) => boolean
  adminLogout: () => void
  checkAuth: () => void

  // User management
  users: ManagedUser[]
  toggleBan: (userId: string) => void
  deleteUser: (userId: string) => void
  updateUserRole: (userId: string, role: 'user' | 'admin') => void
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: localStorage.getItem(ADMIN_KEY) === 'true',
  users: loadUsers(),

  adminLogin: (username, password) => {
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      localStorage.setItem(ADMIN_KEY, 'true')
      set({ isAdmin: true })
      return true
    }
    return false
  },

  adminLogout: () => {
    localStorage.removeItem(ADMIN_KEY)
    set({ isAdmin: false })
  },

  checkAuth: () => {
    set({ isAdmin: localStorage.getItem(ADMIN_KEY) === 'true' })
  },

  toggleBan: (userId) => {
    set(s => {
      const users = s.users.map(u => u.id === userId ? { ...u, banned: !u.banned } : u)
      persistUsers(users)
      return { users }
    })
  },

  deleteUser: (userId) => {
    set(s => {
      const users = s.users.filter(u => u.id !== userId)
      persistUsers(users)
      return { users }
    })
  },

  updateUserRole: (userId, role) => {
    set(s => {
      const users = s.users.map(u => u.id === userId ? { ...u, role } : u)
      persistUsers(users)
      return { users }
    })
  },
}))
