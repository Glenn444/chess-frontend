import { useState, useEffect, useRef } from 'react'
import Icon from '../icons/Icon'

const PAGE_SIZE = 50

interface ChatMessage {
  id: string
  me: boolean
  text: string
  time: string
  senderName: string
}

export default function ChatPanel({ messages, onSend, opponentName, chatLimited = false }: {
  messages: ChatMessage[]
  onSend: (text: string) => void
  opponentName: string
  chatLimited?: boolean
}) {
  const [input, setInput] = useState('')
  const [visibleFrom, setVisibleFrom] = useState(() => Math.max(0, messages.length - PAGE_SIZE))
  const listRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)

  // When a new live message arrives, advance visibleFrom window and scroll to bottom
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      prevLengthRef.current = messages.length
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages.length])

  // Scroll to bottom on first render
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [])

  const loadPrevious = () => {
    const prevFrom = visibleFrom
    const newFrom = Math.max(0, visibleFrom - PAGE_SIZE)
    setVisibleFrom(newFrom)
    // Restore scroll position so existing messages don't jump
    requestAnimationFrame(() => {
      if (!listRef.current) return
      const added = prevFrom - newFrom
      const rowHeight = listRef.current.scrollHeight / (messages.length - newFrom)
      listRef.current.scrollTop = added * rowHeight
    })
  }

  const visibleMessages = messages.slice(visibleFrom)
  const hasMore = visibleFrom > 0

  const initial = (name: string) => name.trim().charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Message list */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Load previous button */}
        {hasMore && (
          <button
            onClick={loadPrevious}
            style={{
              alignSelf: 'center', margin: '4px 0 8px',
              padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}
          >
            ↑ Load previous messages
          </button>
        )}

        {visibleMessages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No messages yet — say gg, glhf!
          </div>
        )}

        {visibleMessages.map((m, i) => {
          const prev = visibleMessages[i - 1]
          const next = visibleMessages[i + 1]
          const isFirstInGroup = !prev || prev.me !== m.me
          const isLastInGroup = !next || next.me !== m.me

          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start', marginTop: isFirstInGroup ? 10 : 2 }}>
              {isFirstInGroup && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, paddingLeft: m.me ? 0 : 40, paddingRight: m.me ? 4 : 0 }}>
                  {m.me ? 'You' : m.senderName}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: m.me ? 'row-reverse' : 'row', maxWidth: '86%' }}>
                {!m.me ? (
                  isLastInGroup ? (
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg, #E58EA2, #C26483)',
                      display: 'grid', placeItems: 'center',
                      fontSize: 12, fontWeight: 700, color: '#1A1408',
                      border: '1px solid rgba(0,0,0,0.15)',
                    }}>
                      {initial(opponentName)}
                    </div>
                  ) : (
                    <div style={{ width: 28, flexShrink: 0 }} />
                  )
                ) : null}

                <div style={{
                  padding: '8px 12px', borderRadius: 16,
                  borderBottomRightRadius: m.me ? (isLastInGroup ? 4 : 16) : 16,
                  borderBottomLeftRadius: m.me ? 16 : (isLastInGroup ? 4 : 16),
                  fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word',
                  background: m.me ? 'var(--color-amber)' : 'var(--color-bg-base)',
                  color: m.me ? '#1A1408' : 'var(--color-text-primary)',
                  border: m.me ? 'none' : '1px solid var(--color-border-strong)',
                }}>
                  {m.text}
                </div>
              </div>

              {isLastInGroup && (
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3, paddingLeft: m.me ? 0 : 40, paddingRight: m.me ? 4 : 0 }}>
                  {m.time}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Input */}
      {chatLimited ? (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Chat limit reached (200 messages)
        </div>
      ) : (
        <div style={{ padding: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1, padding: '10px 12px', fontSize: 14, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-primary)', outline: 'none' }}
            placeholder="Say gg, glhf..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onSend(input.trim()); setInput('') } }}
          />
          <button
            onClick={() => { if (input.trim()) { onSend(input.trim()); setInput('') } }}
            style={{ background: 'var(--color-amber)', border: 'none', borderRadius: 10, width: 40, height: 40, color: '#1A1408', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
