import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

let nextId = 0

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'error') => {
    const id = String(++nextId)
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 5000)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
