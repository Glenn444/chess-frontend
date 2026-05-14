import Icon from '../icons/Icon'

export default function VoiceBar({ muted, status, onToggleMute }: {
  muted: boolean
  status: 'idle' | 'connected' | 'ended'
  onToggleMute: () => void
}) {
  const connected = status === 'connected'

  return (
    <div style={{
      padding: 12, display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: connected ? 'rgba(95,174,126,0.12)' : 'var(--color-bg-base)',
        border: `1px solid ${connected ? 'var(--color-green)' : 'var(--color-border-strong)'}`,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name="mic" size={16} color={connected ? 'var(--color-green)' : 'var(--color-text-muted)'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Voice</div>
        <div style={{ fontSize: 11, color: connected ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
          {connected ? 'Live' : status === 'idle' ? 'Connecting…' : 'Off'}
        </div>
      </div>
      <button
        onClick={onToggleMute}
        disabled={!connected}
        title={muted ? 'Unmute mic' : 'Mute mic'}
        style={{
          width: 36, height: 36, borderRadius: 10, cursor: connected ? 'pointer' : 'default',
          background: !connected ? 'transparent' : muted ? 'rgba(210,106,106,0.15)' : 'var(--color-bg-base)',
          border: `1px solid ${!connected ? 'var(--color-border)' : muted ? 'rgba(210,106,106,0.4)' : 'var(--color-border-strong)'}`,
          color: !connected ? 'var(--color-text-muted)' : muted ? 'var(--color-red)' : 'var(--color-text-secondary)',
          display: 'grid', placeItems: 'center', transition: 'all .15s ease', opacity: connected ? 1 : 0.4,
        }}>
        <Icon name={muted ? 'mic-off' : 'mic'} size={15} />
      </button>
    </div>
  )
}
