import { create } from 'zustand'

interface MobileNavStore {
  open: boolean
  openNav: () => void
  closeNav: () => void
}

export const useMobileNav = create<MobileNavStore>(set => ({
  open: false,
  openNav: () => set({ open: true }),
  closeNav: () => set({ open: false }),
}))
