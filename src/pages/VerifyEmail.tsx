import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useIsMobile } from '../lib/useIsMobile'
import { useVerifyEmail, useResendOTP } from '../lib/queries'
import logoPng from '../assets/chesske-logo.png'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const verifyMutation = useVerifyEmail()
  const resendMutation = useResendOTP()

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp
    if (otpCode.length !== 6) return
    try {
      await verifyMutation.mutateAsync({ email, email_otp: otpCode })
      setIsVerified(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setMessage(msg)
    }
  }

  const handleResend = async () => {
    verifyMutation.reset()   // clear stale error so the confirmation shows
    try {
      await resendMutation.mutateAsync(email)
      setMessage('A new code has been sent to your email.')
    } catch {
      setMessage('Failed to resend code. Try again.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: 'min(48px, 11.5vw)', height: 56, textAlign: 'center', fontSize: 22, fontWeight: 600,
    background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)',
    borderRadius: 12, color: 'var(--color-text-primary)', outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
  }

  if (!email) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <p>No email provided. Please sign up first.</p>
          <button onClick={() => navigate('/register')} style={{ marginTop: 16, background: 'var(--color-amber)', color: '#1A1408', border: 'none', borderRadius: 14, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
            Go to sign up
          </button>
        </div>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(95,174,126,0.15)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="var(--color-green)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-11" />
            </svg>
          </div>
          <h1 className="font-display" style={{ fontSize: 28, margin: '0 0 8px', fontWeight: 500 }}>Email verified!</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 24px', fontSize: 14 }}>
            Your email has been confirmed. You can now log in.
          </p>
          <button onClick={() => { const p = new URLSearchParams(window.location.search); const r = p.get('redirect'); navigate(r ? `/login?redirect=${encodeURIComponent(r)}` : '/login') }} style={{ background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)', color: '#1A1408', fontWeight: 600, borderRadius: 14, padding: '14px 28px', border: 'none', cursor: 'pointer', fontSize: 15 }}>
            Go to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <img src={logoPng} alt="Chesske" style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 16px' }} />

        <h1 className="font-display" style={{ fontSize: isMobile ? 24 : 30, margin: '0 0 8px', fontWeight: 500 }}>
          Verify your email
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 24px', fontSize: 14, lineHeight: 1.5 }}>
          We sent a 6-digit code to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>.
          Enter it below to verify your account.
        </p>

        {/* OTP Input */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={otp[i] || ''}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                const newOtp = otp.split('')
                newOtp[i] = val
                const combined = newOtp.join('')
                setOtp(combined)
                // Auto-advance to next input
                if (val && i < 5) {
                  const next = e.target.parentElement?.children[i + 1] as HTMLInputElement
                  next?.focus()
                }
                // Auto-submit when all 6 digits filled — pass the combined
                // code directly (state hasn't committed yet)
                if (combined.length === 6) {
                  setTimeout(() => handleVerify(combined), 100)
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !otp[i] && i > 0) {
                  const prev = (e.target as HTMLInputElement).parentElement?.children[i - 1] as HTMLInputElement
                  prev?.focus()
                }
              }}
              style={inputStyle}
            />
          ))}
        </div>

        {verifyMutation.error && (
          <div style={{ fontSize: 13, color: 'var(--color-red)', padding: '8px 12px', background: 'rgba(210,106,106,0.1)', borderRadius: 10, border: '1px solid rgba(210,106,106,0.25)', marginBottom: 12 }}>
            {verifyMutation.error instanceof Error ? verifyMutation.error.message : 'Verification failed'}
          </div>
        )}

        {message && !verifyMutation.error && (
          <div style={{ fontSize: 13, color: 'var(--color-green)', padding: '8px 12px', background: 'rgba(95,174,126,0.1)', borderRadius: 10, border: '1px solid rgba(95,174,126,0.25)', marginBottom: 12 }}>
            {message}
          </div>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={otp.length !== 6 || verifyMutation.isPending}
          style={{
            padding: '12px 28px', borderRadius: 14, border: 'none', cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
            background: otp.length === 6 ? 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)' : 'var(--color-border-strong)',
            color: otp.length === 6 ? '#1A1408' : 'var(--color-text-muted)',
            fontWeight: 600, fontSize: 14, opacity: verifyMutation.isPending ? 0.6 : 1,
          }}
        >
          {verifyMutation.isPending ? 'Verifying…' : 'Verify email'}
        </button>

        <p style={{ marginTop: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>
          Didn't receive the code?{' '}
          <a onClick={handleResend} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500, display: 'inline-block', padding: '10px 8px', margin: '-10px -8px' }}>
            {resendMutation.isPending ? 'Sending…' : 'Resend'}
          </a>
        </p>
      </div>
    </div>
  )
}
