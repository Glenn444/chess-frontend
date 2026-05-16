import Icon from '../icons/Icon'

export default function VoiceBar({ muted, status, onToggleMute }: {
  muted: boolean
  status: 'idle' | 'connected' | 'degraded' | 'ended'
  onToggleMute: () => void
}) {
  const connected = status === 'connected'
  const degraded = status === 'degraded'
  const active = connected || degraded  // mute is usable in both states

  const iconColor = connected
    ? 'var(--color-green)'
    : degraded
      ? 'var(--color-amber)'
      : 'var(--color-text-muted)'

  const statusText = connected
    ? 'Live'
    : degraded
      ? 'Reconnecting…'
      : status === 'idle'
        ? 'Connecting…'
        : 'Off'

  return (
    <div style={{
      padding: 12, display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: connected
          ? 'rgba(95,174,126,0.12)'
          : degraded
            ? 'rgba(229,169,59,0.1)'
            : 'var(--color-bg-base)',
        border: `1px solid ${iconColor}`,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name="mic" size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Voice</div>
        <div style={{ fontSize: 11, color: iconColor }}>{statusText}</div>
      </div>
      <button
        onClick={onToggleMute}
        disabled={!active}
        title={muted ? 'Unmute mic' : 'Mute mic'}
        style={{
          width: 36, height: 36, borderRadius: 10, cursor: active ? 'pointer' : 'default',
          background: !active ? 'transparent' : muted ? 'rgba(210,106,106,0.15)' : 'var(--color-bg-base)',
          border: `1px solid ${!active ? 'var(--color-border)' : muted ? 'rgba(210,106,106,0.4)' : 'var(--color-border-strong)'}`,
          color: !active ? 'var(--color-text-muted)' : muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
          display: 'grid', placeItems: 'center', transition: 'all .15s ease', opacity: active ? 1 : 0.4,
        }}>
        <Icon name={muted ? 'mic-off' : 'mic'} size={15} />
      </button>
    </div>
  )
}
