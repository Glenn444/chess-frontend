import { memo, useEffect, useState } from 'react'
import Icon from '../icons/Icon'

// Track the visual viewport height so the sheet shrinks when the on-screen
// keyboard opens (otherwise a fixed-bottom sheet's input hides behind it).
function useVisualViewportHeight() {
  const [height, setHeight] = useState<number | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setHeight(vv.height)
    onResize()
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])
  return height
}

export default memo(function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  const vvHeight = useVisualViewportHeight()
  if (!open) return null
  const maxHeight = vvHeight ? Math.min(vvHeight * 0.85, vvHeight - 40) : undefined
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(14,15,19,0.6)', backdropFilter: 'blur(4px)',
        animation: 'fade-in 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        maxHeight: maxHeight ?? '75dvh',
        background: 'var(--color-bg-raised)',
        border: '1px solid var(--color-border-strong)',
        borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'fade-in 0.25s ease',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: 10, border: '1px solid var(--color-border-strong)',
            background: 'var(--color-bg-elev)', color: 'var(--color-text-secondary)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </>
  )
})
