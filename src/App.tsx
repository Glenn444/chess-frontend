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
import Games from './pages/Games'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Admin from './pages/Admin'
import VerifyEmail from './pages/VerifyEmail'

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
  if (user) return <Navigate to="/games" replace />
  return <>{children}</>
}

export default function App() {
  const token = useAuth(s => s.token)
  const { data: me, isLoading } = useMe()
  const setUser = useAuth(s => s.setUser)
  const user = useAuth(s => s.user)

  // Sync API response → Zustand client state
  useEffect(() => {
    if (me) setUser(me)
  }, [me, setUser])

  // Only show splash while we have a stored token and are verifying it
  if (token && isLoading) return <SplashScreen />

  return (
    <PieceThemeProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/announcements" element={<Navigate to="/events" replace />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
        <Route path="/game/:id" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
      </Routes>
      {!user && <FloatingNav />}
    </PieceThemeProvider>
  )
}
