import { useState } from 'react'
import Icon from '../icons/Icon'

export default function ChatPanel({ messages, onSend, opponentName }: {
  messages: { me: boolean; text: string; time: string }[]
  onSend: (text: string) => void
  opponentName: string
}) {
  const [input, setInput] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 300 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start', gap: 2 }}>
            {(i === 0 || messages[i - 1].me !== m.me) && (
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '0 4px' }}>{m.me ? 'You' : opponentName}</div>
            )}
            <div style={{
              maxWidth: '82%', padding: '8px 12px', borderRadius: 14, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word',
              background: m.me ? 'var(--color-amber)' : 'var(--color-bg-base)',
              color: m.me ? '#1A1408' : 'var(--color-text-primary)',
              border: m.me ? 'none' : '1px solid var(--color-border-strong)',
              borderBottomRightRadius: m.me ? 4 : 14, borderBottomLeftRadius: m.me ? 14 : 4,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', padding: '0 4px' }}>{m.time}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 0 0', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, padding: '10px 12px', fontSize: 14, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-primary)', outline: 'none' }}
          placeholder="Say gg, glhf..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onSend(input); setInput('') } }}
        />
        <button onClick={() => { if (input.trim()) { onSend(input); setInput('') } }} style={{
          background: 'var(--color-amber)', border: 'none', borderRadius: 10, width: 40, height: 40, color: '#1A1408',
          display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0,
        }}><Icon name="send" size={16} /></button>
      </div>
    </div>
  )
}
