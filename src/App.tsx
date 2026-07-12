import { useEffect } from 'react'
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PieceThemeProvider } from './lib/PieceThemeContext'
import { useAuth } from './lib/authStore'
import { useMe } from './lib/queries'
import FloatingNav from './components/FloatingNav'
import MobileNav from './components/MobileNav'
import ToastContainer from './components/Toast'
import Landing from './pages/Landing'
import Lobby from './pages/Lobby'
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import GameScreen from './pages/GameScreen'
import Games from './pages/Games'
import Replay from './pages/Replay'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Admin from './pages/Admin'
import VerifyEmail from './pages/VerifyEmail'

// Old share links pointed at /game/:id?join=true — in production that path is
// the backend's spectator page, but on pages.dev/dev the SPA still owns it.
function LegacyGameRedirect() {
  const { id } = useParams()
  const { search } = useLocation()
  return <Navigate to={`/play/${id}${search}`} replace />
}

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
  const location = window.location.pathname + window.location.search
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location)}`} replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: ReactNode }) {
  const user = useAuth(s => s.user)
  if (user) {
    // Honor ?redirect= so a logged-in user landing on /login?redirect=/game/x
    // still reaches the game (e.g. shared invite links).
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    return <Navigate to={redirect && redirect.startsWith('/') ? redirect : '/games'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { data: me, isLoading } = useMe()
  const setUser = useAuth(s => s.setUser)
  const user = useAuth(s => s.user)

  // Sync API response → Zustand client state
  useEffect(() => {
    if (me) setUser(me)
  }, [me, setUser])

  // Show splash while checking auth status via cookie
  if (isLoading) return <SplashScreen />

  return (
    <PieceThemeProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/announcements" element={<Navigate to="/events" replace />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        {/* /game/:id belongs to the server-rendered spectator page in production
            (nginx routes it to the Go backend) — the app plays at /play/:id. */}
        <Route path="/play/:id" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
        <Route path="/play" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
        <Route path="/game/:id" element={<LegacyGameRedirect />} />
        <Route path="/replay/:id" element={<ProtectedRoute><Replay /></ProtectedRoute>} />
      </Routes>
      <ToastContainer />
      {!user && <FloatingNav />}
      {user && <MobileNav />}
    </PieceThemeProvider>
  )
}
