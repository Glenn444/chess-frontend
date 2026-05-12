import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export const PIECE_THEMES = [
  'cburnett',
  'merida',
  'alpha',
  'chess7',
  'maestro',
  'fresca',
  'cardinal',
  'fantasy',
  'spatial',
  'gioco',
  'tatiana',
  'staunty',
  'dubrovny',
  'kosal',
  'monna',
] as const

export type PieceTheme = (typeof PIECE_THEMES)[number]

interface PieceThemeContextType {
  theme: PieceTheme
  setTheme: (theme: PieceTheme) => void
}

const PieceThemeContext = createContext<PieceThemeContextType>({
  theme: 'cburnett',
  setTheme: () => {},
})

export function PieceThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PieceTheme>('cburnett')

  const handleSetTheme = useCallback((t: PieceTheme) => {
    setTheme(t)
  }, [])

  return (
    <PieceThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </PieceThemeContext.Provider>
  )
}

export function usePieceTheme() {
  return useContext(PieceThemeContext)
}
