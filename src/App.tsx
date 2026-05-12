import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PieceThemeProvider } from './lib/PieceThemeContext'
import { useAuth } from './lib/authStore'
import { useMe } from './lib/queries'
import FloatingNav from './components/FloatingNav'
import Landing from './pages/Landing'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Matchmaking from './pages/Matchmaking'
import GameScreen from './pages/GameScreen'
import Announcements from './pages/Announcements'

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)',
      fontSize: 14,
    }}>
      Loading…
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuth(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: ReactNode }) {
  const user = useAuth(s => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { data, isLoading } = useMe()
  const setUser = useAuth(s => s.setUser)
  const user = useAuth(s => s.user)

  // Sync React Query cache → Zustand client state
  useEffect(() => {
    if (data?.user) setUser(data.user)
  }, [data, setUser])

  if (isLoading) return <SplashScreen />

  return (
    <PieceThemeProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
      </Routes>
      {!user && <FloatingNav />}
    </PieceThemeProvider>
  )
}
