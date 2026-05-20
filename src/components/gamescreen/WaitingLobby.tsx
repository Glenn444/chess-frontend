import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../icons/Icon'
import { subscribeToPush } from '../../lib/push'

export default function WaitingLobby({ gameId, playerColor }: { gameId: string; playerColor?: string }) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [notifyState, setNotifyState] = useState<'idle' | 'prompt' | 'granted' | 'dismissed'>(
    () => {
      if (!('Notification' in window)) return 'dismissed'
      if (Notification.permission === 'denied') return 'dismissed'
      if (Notification.permission === 'granted') return 'granted'
      return 'prompt'
    }
  )
  const inviteLink = `${window.location.origin}/game/${gameId}?join=true`
  const colorLabel = playerColor === 'w' ? 'White' : 'Black'

  const handleEnableNotifications = async () => {
    await subscribeToPush(gameId)
    setNotifyState(
      'Notification' in window && Notification.permission === 'granted'
        ? 'granted'
        : 'dismissed'
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my chess game on Chesske', text: 'Play chess with me!', url: inviteLink })
      } catch { /* user cancelled */ }
    } else {
      handleCopy()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-base)',
      padding: '24px 16px', boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-amber-light), var(--color-amber-deep))',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 12px 30px -10px rgba(229,169,59,0.4)',
        }}>
          <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="#1A1408" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        <h1 className="font-display" style={{ fontSize: 'clamp(22px, 6vw, 28px)', margin: '0 0 10px', fontWeight: 500 }}>
          Waiting for opponent
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 6px', lineHeight: 1.5 }}>
          Share this link with a friend to start playing.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 12, margin: '0 0 16px' }}>
          Playing as <strong style={{ color: 'var(--color-amber)' }}>{colorLabel}</strong>
        </p>

        {/* Notification prompt */}
        {notifyState === 'prompt' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', marginBottom: 18,
            borderRadius: 14,
            background: 'rgba(229,169,59,0.08)',
            border: '1px solid rgba(229,169,59,0.2)',
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="var(--color-amber)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'left' }}>
              Get notified when your opponent joins
            </span>
            <button
              onClick={handleEnableNotifications}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'var(--color-amber)', color: '#1A1408',
                fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Enable
            </button>
          </div>
        )}

        {notifyState === 'granted' && (
          <div style={{
            padding: '8px 14px', marginBottom: 18,
            borderRadius: 14,
            background: 'rgba(95,174,126,0.08)',
            border: '1px solid rgba(95,174,126,0.2)',
            fontSize: 13, color: 'var(--color-green)',
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12l5 5 9-11" /></svg>
            You'll be notified when your opponent joins.
          </div>
        )}

        {/* Link box */}
        <div style={{
          background: 'var(--color-bg-elev)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 14, padding: '12px 14px',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', boxSizing: 'border-box',
        }}>
          <div className="font-mono" style={{
            flex: 1, fontSize: 12, color: 'var(--color-amber)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            userSelect: 'all', minWidth: 0,
          }}>
            {inviteLink}
          </div>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 9,
              cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
              background: copied ? 'var(--color-green)' : 'var(--color-bg-base)',
              color: copied ? '#fff' : 'var(--color-text-primary)',
              border: copied ? 'none' : '1px solid var(--color-border-strong)',
              transition: 'all .15s ease',
            } as React.CSSProperties}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        {/* Share button (native on mobile, copy fallback on desktop) */}
        <button
          onClick={handleShare}
          style={{
            width: '100%', padding: '13px 20px', borderRadius: 14, border: 'none',
            cursor: 'pointer', fontWeight: 600, fontSize: 15,
            background: 'linear-gradient(180deg, var(--color-amber-light) 0%, var(--color-amber) 100%)',
            color: '#1A1408',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.15) inset, 0 6px 18px -6px rgba(229,169,59,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 12,
            boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          <Icon name="send" size={16} color="#1A1408" />
          Share invite link
        </button>

        <button
          onClick={() => navigate('/games')}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 14, cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
            background: 'var(--color-bg-elev)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box',
          } as React.CSSProperties}
        >
          <Icon name="arrow-left" size={15} /> Back to games
        </button>

        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          This page updates automatically when someone joins.
        </p>
      </div>
    </div>
  )
}
