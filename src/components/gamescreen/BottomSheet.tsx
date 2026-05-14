import { memo } from 'react'
import Icon from '../icons/Icon'

export default memo(function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(14,15,19,0.6)', backdropFilter: 'blur(4px)',
        animation: 'fade-in 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        maxHeight: '75vh',
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-border-strong)',
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'fade-in 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border-strong)',
            background: 'var(--color-bg-elev)', color: 'var(--color-text-secondary)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {children}
        </div>
      </div>
    </>
  )
})
