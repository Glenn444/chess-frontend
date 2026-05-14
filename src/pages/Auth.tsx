import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Icon from '../components/icons/Icon'
import AnimatedBoard from '../components/AnimatedBoard'
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '../lib/schemas'
import { useLogin, useRegister } from '../lib/queries'
import { api } from '../lib/api'
import { useIsMobile } from '../lib/useIsMobile'
import logoPng from '../assets/chesske-logo.png'

/* ───── Static auth art wrapper (never rerenders) ───── */
function AuthSideArt({ mode }: { mode: 'login' | 'register' }) {
  return (
    <div style={{
      position: 'relative', height: '100%',
      background: 'radial-gradient(120% 80% at 30% 20%, rgba(229,169,59,0.18), transparent 60%), linear-gradient(180deg, #16181F 0%, #0E0F13 100%)',
      display: 'grid', placeItems: 'center', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div style={{ position: 'relative', textAlign: 'center', padding: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <img src={logoPng} alt="Chesske" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>Chesske</span>
        </div>
        <h2 className="font-display" style={{ fontSize: 38, lineHeight: 1.1, margin: '0 0 14px', fontWeight: 500, letterSpacing: -1 }}>
          {mode === 'login' ? <>Welcome back to<br/>the board.</> : <>Two players.<br/>One open <span style={{ fontStyle: 'italic', color: 'var(--color-amber)' }}>game.</span></>}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 36, fontSize: 15 }}>
          {mode === 'login' ? 'Pick up where you left off.' : 'Create an account in under 30 seconds.'}
        </p>
        <AnimatedBoard size={360} showLabel />
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 12,
  color: 'var(--color-text-primary)',
  fontSize: 15,
  padding: '12px 14px',
  outline: 'none',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-red)',
  marginTop: 4,
}

const amberBtnStyle: React.CSSProperties = {
  padding: 14,
  background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
  color: '#1A1408',
  fontWeight: 600,
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.15)',
  cursor: 'pointer',
  fontSize: 15,
  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)',
  marginTop: 10,
}

const ghostBtnStyle: React.CSSProperties = {
  background: 'var(--color-bg-elev)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 14,
  padding: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
}

/* ───── Login ───── */
export function Login() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [showPw, setShowPw] = useState(false)
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const email = watch('email')

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data)
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      navigate(redirect || '/games')
    } catch {
      // server error shown via loginMutation.error below
    }
  }

  return (
    <>
    <div className="fade-in auth-split" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: '100vh' }}>
      {!isMobile && <div className="auth-art"><AuthSideArt mode="login" /></div>}
      <div className="auth-side" style={{ display: 'grid', placeItems: 'center', padding: isMobile ? '24px 24px 90px' : 40 }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 400 }}>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <img src={logoPng} alt="Chesske" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Chesske</span>
            </div>
          )}
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-display" style={{ fontSize: isMobile ? 28 : 36, margin: 0, letterSpacing: -0.5, fontWeight: 500 }}>Log in</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>Enter your details to start playing.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</div>
              <input {...register('email')} placeholder="you@example.com" style={inputStyle} />
              {errors.email && <div style={errorStyle}>{errors.email.message}</div>}
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                <span>Password</span>
                <a style={{ color: 'var(--color-amber)', fontSize: 12, cursor: 'pointer' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} type={showPw ? 'text' : 'password'} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex' }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? (
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <div style={errorStyle}>{errors.password.message}</div>}
            </label>

            {loginMutation.error && (() => {
              const errMsg = loginMutation.error instanceof Error ? loginMutation.error.message : 'Login failed'
              const isUnverified = errMsg.toLowerCase().includes('verify') || errMsg.toLowerCase().includes('confirm') || errMsg.toLowerCase().includes('not verified') || errMsg.toLowerCase().includes('not confirmed')
              return (
                <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '10px 14px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)' }}>
                  {errMsg}
                  {isUnverified && (
                    <div style={{ marginTop: 8 }}>
                      <a onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>
                        Verify your email →
                      </a>
                    </div>
                  )}
                </div>
              )
            })()}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-amber)' }} />
              Remember me on this device
            </label>

            <button type="submit" disabled={isSubmitting} style={{
              ...amberBtnStyle,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}>
              {isSubmitting ? 'Logging in…' : 'Log in'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--color-text-muted)', fontSize: 12, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              OR
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <button type="button" style={ghostBtnStyle}>
              <Icon name="globe" size={18} /> Continue with Google
            </button>
          </div>

          <p style={{ marginTop: 28, color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
            New to Chesske? <a onClick={() => { const p = new URLSearchParams(window.location.search); const r = p.get('redirect'); navigate(r ? `/register?redirect=${encodeURIComponent(r)}` : '/register') }} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>Create account</a>
          </p>
          <p style={{ marginTop: 16, color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>
            <a onClick={() => navigate('/')} style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}>← Back to home</a>
          </p>
        </form>
      </div>
    </div>
    </>
  )
}

/* ───── Register ───── */
export function Register() {
  const [showPw, setShowPw] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const registerMutation = useRegister()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const username = watch('username')

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await api.checkUsername(username)
        setUsernameStatus(result.exists ? 'taken' : 'available')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [username])

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync(data)
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect')
      const qs = `email=${encodeURIComponent(data.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`
      navigate(`/verify-email?${qs}`)
    } catch {
      // server error shown via registerMutation.error
    }
  }

  return (
    <>
    <div className="fade-in auth-split" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', minHeight: '100vh' }}>
      {!isMobile && <div className="auth-art"><AuthSideArt mode="register" /></div>}
      <div className="auth-side" style={{ display: 'grid', placeItems: 'center', padding: isMobile ? '24px 24px 90px' : 40 }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', maxWidth: 420 }}>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <img src={logoPng} alt="Chesske" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Chesske</span>
            </div>
          )}
          <div style={{ marginBottom: 28 }}>
            <h1 className="font-display" style={{ fontSize: isMobile ? 28 : 36, margin: 0, letterSpacing: -0.5, fontWeight: 500 }}>Create your account</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>Sign up in under 30 seconds.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Username</div>
              <input {...register('username')} placeholder="pick a unique handle" style={inputStyle} />
              {errors.username ? (
                <div style={errorStyle}>{errors.username.message}</div>
              ) : usernameStatus === 'checking' ? (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>Checking availability…</div>
              ) : usernameStatus === 'available' ? (
                <div style={{ fontSize: 12, color: 'var(--color-green)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12l5 5 9-11" /></svg>
                  Username is available
                </div>
              ) : usernameStatus === 'taken' ? (
                <div style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 6 }}>Username is already taken</div>
              ) : null}
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</div>
              <input {...register('email')} placeholder="you@example.com" style={inputStyle} />
              {errors.email && <div style={errorStyle}>{errors.email.message}</div>}
            </label>
            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Password</div>
              <div style={{ position: 'relative' }}>
                <input {...register('password')} type={showPw ? 'text' : 'password'} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, display: 'flex' }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? (
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <div style={errorStyle}>{errors.password.message}</div>}
            </label>

            {registerMutation.error && (
              <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '8px 12px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)' }}>
                {registerMutation.error instanceof Error ? registerMutation.error.message : 'Registration failed'}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-amber)', marginTop: 3 }} />
              <span>I agree to the <a style={{ color: 'var(--color-amber)' }}>Terms</a> and <a style={{ color: 'var(--color-amber)' }}>Privacy Policy</a>.</span>
            </label>

            <button type="submit" disabled={isSubmitting} style={{
              ...amberBtnStyle,
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </div>

          <p style={{ marginTop: 24, color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
            Already have one? <a onClick={() => { const p = new URLSearchParams(window.location.search); const r = p.get('redirect'); navigate(r ? `/login?redirect=${encodeURIComponent(r)}` : '/login') }} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>Log in</a>
          </p>
        </form>
      </div>
    </div>
    </>
  )
}
