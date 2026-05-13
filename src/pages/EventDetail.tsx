import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useIsMobile } from '../lib/useIsMobile'
import { useAuth } from '../lib/authStore'
import { useEventStore } from '../lib/eventStore'
import Avatar from '../components/Avatar'
import Icon from '../components/icons/Icon'
const typeColors: Record<string, string> = {
  Tournament: 'var(--color-amber)',
  Playtest: 'var(--color-blue)',
  Community: 'var(--color-green)',
  Special: 'var(--color-violet)',
  Challenge: 'var(--color-red)',
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuth(s => s.user)
  const { events, reactions, toggleLike, toggleDislike, addComment } = useEventStore()
  const [commentText, setCommentText] = useState('')
  const [sharedId, setSharedId] = useState<string | null>(null)

  const event = events.find(e => e.id === id)
  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, marginBottom: 16 }}>Event not found</p>
          <button onClick={() => navigate('/events')} style={{ background: 'var(--color-amber)', color: '#1A1408', border: 'none', borderRadius: 14, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>
            ← Back to Events
          </button>
        </div>
      </div>
    )
  }

  const reaction = reactions[event.id]

  const handleShare = async () => {
    const link = `${window.location.origin}/events/${event.id}`
    try {
      await navigator.clipboard.writeText(link)
      setSharedId(event.id)
      setTimeout(() => setSharedId(null), 2000)
    } catch { /* fallback handled silently */ }
  }

  const handleAddComment = () => {
    if (!commentText.trim() || !user) return
    addComment(event.id, user.username, user.username, commentText.trim())
    setCommentText('')
  }

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--color-bg-base)', paddingBottom: 80 }}>
      {/* Back nav */}
      <div style={{
        padding: isMobile ? '14px 16px' : '16px 28px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={() => navigate('/events')} style={{
          background: 'var(--color-bg-elev)', border: '1px solid var(--color-border-strong)',
          borderRadius: 10, width: 36, height: 36, display: 'grid', placeItems: 'center',
          cursor: 'pointer', color: 'var(--color-text-secondary)',
        }}>
          <Icon name="arrow-left" size={18} />
        </button>
        <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Back to Events</span>
      </div>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 28px' }}>
        {/* Event image */}
        {event.image && (
          <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 24, maxHeight: 400 }}>
            <img src={event.image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Type + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '4px 12px', borderRadius: 999,
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            background: `${typeColors[event.type] || 'var(--color-amber)'}22`,
            color: typeColors[event.type] || 'var(--color-amber)',
            border: `1px solid ${typeColors[event.type] || 'var(--color-amber)'}33`,
          }}>
            {event.type}
          </span>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{event.date}</span>
        </div>

        {/* Title + description */}
        <h1 className="font-display" style={{ fontSize: isMobile ? 28 : 38, margin: '0 0 16px', fontWeight: 500, letterSpacing: -0.5 }}>
          {event.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.7, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>
          {event.description}
        </p>

        {/* Prize */}
        {event.prize && (
          <div style={{
            fontSize: 14, color: 'var(--color-amber)',
            background: 'rgba(229,169,59,0.08)',
            border: '1px solid rgba(229,169,59,0.2)',
            borderRadius: 12, padding: '10px 16px',
            display: 'inline-block', marginBottom: 24,
          }}>
            {event.prize}
          </div>
        )}

        {/* Reaction bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '14px 0',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 32,
        }}>
          <button onClick={() => toggleLike(event.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999,
            border: reaction === 'like' ? '1px solid var(--color-amber)' : '1px solid transparent',
            background: reaction === 'like' ? 'rgba(229,169,59,0.1)' : 'transparent',
            color: reaction === 'like' ? 'var(--color-amber)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all .15s ease',
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill={reaction === 'like' ? 'var(--color-amber)' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 22H3a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h4l6-6a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-2 9a2 2 0 0 1-2 2h-7" />
            </svg>
            {event.likes}
          </button>

          <button onClick={() => toggleDislike(event.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999,
            border: reaction === 'dislike' ? '1px solid var(--color-red)' : '1px solid transparent',
            background: reaction === 'dislike' ? 'rgba(210,106,106,0.1)' : 'transparent',
            color: reaction === 'dislike' ? 'var(--color-red)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all .15s ease',
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill={reaction === 'dislike' ? 'var(--color-red)' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4l-6 6a2 2 0 0 1-2-2v-4H4a2 2 0 0 1-2-2l2-9a2 2 0 0 1 2-2h7" />
            </svg>
            {event.dislikes}
          </button>

          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999,
            border: '1px solid transparent', background: 'transparent',
            color: sharedId === event.id ? 'var(--color-blue)' : 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, marginLeft: 'auto',
            transition: 'all .15s ease',
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            {sharedId === event.id ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Comments */}
        <div>
          <h2 className="font-display" style={{ fontSize: 22, margin: '0 0 20px', fontWeight: 500 }}>
            Comments ({event.comments.length})
          </h2>

          {event.comments.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, fontStyle: 'italic', marginBottom: 24 }}>
              No comments yet. Be the first to share your thoughts!
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {event.comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <Avatar name={c.username} size={32} color={['amber', 'blue', 'green', 'violet', 'rose', 'teal'][c.username.length % 6] as 'amber'} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{c.username}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          {user ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Avatar name={user.username} size={36} color="amber" />
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-strong)', borderRadius: 12,
                    color: 'var(--color-text-primary)', fontSize: 14, outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    style={{
                      padding: '8px 18px', borderRadius: 10, border: 'none', cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                      background: commentText.trim() ? 'var(--color-amber)' : 'var(--color-border-strong)',
                      color: commentText.trim() ? '#1A1408' : 'var(--color-text-muted)',
                      fontWeight: 600, fontSize: 13, transition: 'all .15s ease',
                    }}
                  >
                    Post comment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '14px 18px', background: 'var(--color-bg-elev)',
              border: '1px solid var(--color-border)', borderRadius: 14,
              textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)',
            }}>
              <a onClick={() => navigate('/login')} style={{ color: 'var(--color-amber)', cursor: 'pointer', fontWeight: 500 }}>Log in</a> to leave a comment.
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
