import type { IconName } from './icons/Icon'
import { useToasts } from '../lib/toastStore'
import Icon from './icons/Icon'

const COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  error: { bg: 'rgba(210,106,106,0.15)', border: 'rgba(210,106,106,0.4)', icon: 'var(--color-red)' },
  success: { bg: 'rgba(95,174,126,0.15)', border: 'rgba(95,174,126,0.4)', icon: 'var(--color-green)' },
  info: { bg: 'rgba(229,169,59,0.12)', border: 'rgba(229,169,59,0.35)', icon: 'var(--color-amber)' },
}

const ICONS: Record<string, IconName> = {
  error: 'x',
  success: 'check',
  info: 'zap',
}

export default function ToastContainer() {
  const toasts = useToasts(s => s.toasts)
  const removeToast = useToasts(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      width: '100%', maxWidth: 400, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type]
        return (
          <div key={t.id} style={{
            padding: '12px 16px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            pointerEvents: 'auto',
            backdropFilter: 'blur(12px)',
            animation: 'fade-in 0.2s ease',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
          }}>
            <div style={{ color: c.icon, marginTop: 1, flexShrink: 0 }}>
              <Icon name={ICONS[t.type]} size={16} />
            </div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
              {t.message}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: 0, flexShrink: 0,
                marginTop: 1,
              }}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
