import Icon from '../icons/Icon'

export default function VoiceBar({ muted, onToggleMute }: {
  muted: boolean; onToggleMute: () => void
}) {
  return (
    <div style={{
      padding: 12, display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: muted ? 'rgba(210,106,106,0.12)' : 'rgba(95,174,126,0.12)',
          border: `1px solid ${muted ? 'rgba(210,106,106,0.3)' : 'var(--color-border-strong)'}`,
          display: 'grid', placeItems: 'center',
          color: muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
          flexShrink: 0,
        }}>
          <Icon name={muted ? 'mic-off' : 'mic'} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {muted ? 'Microphone muted' : 'Microphone on'}
          </div>
        </div>
      </div>
      <button onClick={onToggleMute} style={{
        width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
        background: muted ? 'rgba(210,106,106,0.15)' : 'var(--color-bg-base)',
        border: `1px solid ${muted ? 'rgba(210,106,106,0.4)' : 'var(--color-border-strong)'}`,
        color: muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
        display: 'grid', placeItems: 'center', transition: 'all .15s ease',
      }}>
        <Icon name={muted ? 'mic-off' : 'mic'} size={16} />
      </button>
    </div>
  )
}
