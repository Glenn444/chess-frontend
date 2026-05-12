import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Icon from '../components/icons/Icon'
import AnimatedBoard from '../components/AnimatedBoard'
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '../lib/schemas'
import { useLogin, useRegister } from '../lib/queries'
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
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await loginMutation.mutateAsync(data)
      navigate('/dashboard')
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
              <input {...register('password')} type="password" style={inputStyle} />
              {errors.password && <div style={errorStyle}>{errors.password.message}</div>}
            </label>

            {loginMutation.error && (
              <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '8px 12px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)' }}>
                {loginMutation.error instanceof Error ? loginMutation.error.message : 'Login failed'}
              </div>
            )}

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
            New to Chesske? <a onClick={() => navigate('/register')} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>Create account</a>
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
  const [step, setStep] = useState(1)
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
    defaultValues: { rating: '1200' },
  })

  const selectedRating = watch('rating')

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerMutation.mutateAsync(data)
      navigate('/dashboard')
    } catch {
      // server error shown via registerMutation.error
    }
  }

  const ratingOptions = [
    { l: 'Beginner', r: '800–1200', k: '800' },
    { l: 'Casual', r: '1200–1600', k: '1200' },
    { l: 'Club', r: '1600–2000', k: '1600' },
    { l: 'Strong', r: '2000+', k: '2000' },
  ]

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
            <p style={{ color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>Step {step} of 2 — {step === 1 ? 'the basics' : 'set your rating'}.</p>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            <div style={{ height: 4, borderRadius: 2, flex: 1, background: 'var(--color-amber)' }} />
            <div style={{ height: 4, borderRadius: 2, flex: 1, background: step === 2 ? 'var(--color-amber)' : 'var(--color-border-strong)' }} />
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Username</div>
                <input {...register('username')} placeholder="pick a unique handle" style={inputStyle} />
                {errors.username && <div style={errorStyle}>{errors.username.message}</div>}
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</div>
                <input {...register('email')} placeholder="you@example.com" style={inputStyle} />
                {errors.email && <div style={errorStyle}>{errors.email.message}</div>}
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, fontWeight: 500 }}>Password</div>
                <input {...register('password')} type="password" style={inputStyle} />
                {errors.password && <div style={errorStyle}>{errors.password.message}</div>}
              </label>

              {registerMutation.error && (
                <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '8px 12px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)' }}>
                  {registerMutation.error instanceof Error ? registerMutation.error.message : 'Registration failed'}
                </div>
              )}

              <button type="button" onClick={() => setStep(2)} style={amberBtnStyle}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Hidden rating field — set via the visual picker */}
              <input type="hidden" {...register('rating')} />

              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 500 }}>What's your skill level?</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {ratingOptions.map(o => (
                    <div key={o.l} onClick={() => register('rating').onChange({ target: { value: o.k } })} style={{
                      padding: 14, borderRadius: 12, cursor: 'pointer',
                      border: selectedRating === o.k ? '1.5px solid var(--color-amber)' : '1px solid var(--color-border-strong)',
                      background: selectedRating === o.k ? 'rgba(229,169,59,0.08)' : 'var(--color-bg-elev)',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.l}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>ELO {o.r}</div>
                    </div>
                  ))}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-amber)', marginTop: 3 }} />
                <span>I agree to the <a style={{ color: 'var(--color-amber)' }}>Terms</a> and <a style={{ color: 'var(--color-amber)' }}>Privacy Policy</a>.</span>
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{ ...ghostBtnStyle, flex: '0 0 auto' }}>← Back</button>
                <button type="submit" disabled={isSubmitting} style={{
                  ...amberBtnStyle,
                  flex: 1,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}>
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </div>
          )}

          <p style={{ marginTop: 24, color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
            Already have one? <a onClick={() => navigate('/login')} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>Log in</a>
          </p>
        </form>
      </div>
    </div>
    </>
  )
}
