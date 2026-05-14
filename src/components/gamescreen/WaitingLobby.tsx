import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WaitingLobby({ gameId, playerColor }: { gameId: string; playerColor?: string }) {
  const navigate = useNavigate()
  const [shared, setShared] = useState(false)
  const inviteLink = `${window.location.origin}/game/${gameId}?join=true`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))', display: 'grid', placeItems: 'center', margin: '0 auto 24px', boxShadow: '0 12px 30px -10px rgba(229,169,59,0.4)' }}>
          <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#1A1408" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h1 className="font-display" style={{ fontSize: 28, margin: '0 0 12px', fontWeight: 500 }}>Waiting for opponent</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 8px', lineHeight: 1.5 }}>
          Share this link with a friend to start playing.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '0 0 20px' }}>
          Playing as <strong style={{ color: 'var(--color-amber)' }}>{playerColor === 'w' ? 'White' : 'Black'}</strong>
        </p>
        <div style={{ display: 'flex', gap: 8, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: 6, marginBottom: 20 }}>
          <div className="font-mono" style={{ flex: 1, padding: '10px 12px', fontSize: 12, color: 'var(--color-amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', userSelect: 'all' }}>{inviteLink}</div>
          <button onClick={handleCopyLink} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: shared ? 'var(--color-green)' : 'var(--color-amber)', color: shared ? '#fff' : '#1A1408', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all .15s ease' }}>
            {shared ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={() => navigate('/games')} style={{ background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-strong)', borderRadius: 14, padding: '12px 20px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}>
          ← Back to games
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: 'var(--color-text-muted)' }}>Waiting for an opponent to join… this page will update automatically.</p>
      </div>
    </div>
  )
}
