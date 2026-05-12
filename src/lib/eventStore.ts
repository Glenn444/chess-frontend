import { create } from 'zustand'

export interface Comment {
  id: string
  eventId: string
  userId: string
  username: string
  text: string
  createdAt: string
}

export interface ChesskeEvent {
  id: string
  title: string
  description: string
  image: string        // base64 data URL or external URL
  date: string
  type: string
  prize: string
  likes: number
  dislikes: number
  comments: Comment[]
  createdAt: string
}

const uid = () => Math.random().toString(36).slice(2, 10)

// ── Seed events ──
function defaultEvents(): ChesskeEvent[] {
  return [
    {
      id: uid(), title: 'Weekly Blitz Tournament',
      description: 'Join our weekly 5+3 blitz tournament. Open to all rating levels. Top 3 players win premium membership.',
      image: '', date: 'May 15, 2026 · 8:00 PM UTC', type: 'Tournament',
      prize: '1st: 3mo Premium · 2nd: 1mo · 3rd: 500 Chesske coins',
      likes: 142, dislikes: 3, comments: [], createdAt: '2026-05-01',
    },
    {
      id: uid(), title: 'Voice Chat Playtest — New Audio Codec',
      description: "We're testing a new Opus-based audio codec for voice chat. Join us for an evening of games with the dev team.",
      image: '', date: 'May 18, 2026 · 6:00 PM UTC', type: 'Playtest',
      prize: 'Exclusive "Beta Tester" badge for all participants',
      likes: 89, dislikes: 1, comments: [], createdAt: '2026-05-02',
    },
    {
      id: uid(), title: 'Community Vote: Next Piece Theme',
      description: 'Vote on which piece theme we add next! Candidates: Horsey, Pixel, Riohacha, Leipzig.',
      image: '', date: 'May 20, 2026 · All day', type: 'Community',
      prize: 'Your choice shapes the game', likes: 256, dislikes: 7, comments: [],
      createdAt: '2026-05-03',
    },
    {
      id: uid(), title: 'Chesske Anniversary — 6 Months Live',
      description: 'Celebrating 6 months since launch! Double rating gain, special anniversary board theme, and a 24-hour rapid arena.',
      image: '', date: 'May 25, 2026 · All day', type: 'Special',
      prize: 'Special anniversary board theme for all players',
      likes: 412, dislikes: 2, comments: [], createdAt: '2026-05-04',
    },
    {
      id: uid(), title: 'Puzzle Rush Challenge',
      description: 'Solve as many puzzles as you can in 10 minutes. Compete on the live leaderboard. Puzzles range from beginner to grandmaster difficulty.',
      image: '', date: 'May 28, 2026 · 7:00 PM UTC', type: 'Challenge',
      prize: 'Top 10 players earn 200 Chesske coins each',
      likes: 178, dislikes: 5, comments: [], createdAt: '2026-05-05',
    },
  ]
}

function loadEvents(): ChesskeEvent[] {
  try {
    const raw = localStorage.getItem('chesske_events')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const defaults = defaultEvents()
  localStorage.setItem('chesske_events', JSON.stringify(defaults))
  return defaults
}

function persist(events: ChesskeEvent[]) {
  localStorage.setItem('chesske_events', JSON.stringify(events))
}

// ── Like/dislike tracking (per-browser, no auth needed) ──
function getReactions(): Record<string, 'like' | 'dislike' | null> {
  try {
    const raw = localStorage.getItem('chesske_reactions')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function setReaction(eventId: string, reaction: 'like' | 'dislike' | null) {
  const r = getReactions()
  if (reaction === null) delete r[eventId]
  else r[eventId] = reaction
  localStorage.setItem('chesske_reactions', JSON.stringify(r))
}

// ── Store ──
interface EventState {
  events: ChesskeEvent[]
  reactions: Record<string, 'like' | 'dislike' | null>

  // Events CRUD
  addEvent: (e: Omit<ChesskeEvent, 'id' | 'likes' | 'dislikes' | 'comments' | 'createdAt'>) => void
  updateEvent: (id: string, e: Partial<ChesskeEvent>) => void
  deleteEvent: (id: string) => void

  // Reactions
  toggleLike: (eventId: string) => void
  toggleDislike: (eventId: string) => void
  getReaction: (eventId: string) => 'like' | 'dislike' | null

  // Comments
  addComment: (eventId: string, userId: string, username: string, text: string) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  events: loadEvents(),
  reactions: getReactions(),

  addEvent: (data) => {
    const event: ChesskeEvent = {
      ...data,
      id: uid(),
      likes: 0,
      dislikes: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const events = [event, ...s.events]
      persist(events)
      return { events }
    })
  },

  updateEvent: (id, data) => {
    set(s => {
      const events = s.events.map(e => e.id === id ? { ...e, ...data } : e)
      persist(events)
      return { events }
    })
  },

  deleteEvent: (id) => {
    set(s => {
      const events = s.events.filter(e => e.id !== id)
      persist(events)
      return { events }
    })
  },

  toggleLike: (eventId) => {
    const current = get().reactions[eventId]
    set(s => {
      let events = s.events.map(e => {
        if (e.id !== eventId) return e
        let { likes, dislikes } = e
        if (current === 'like') { likes-- }
        else {
          likes++
          if (current === 'dislike') dislikes--
        }
        return { ...e, likes, dislikes }
      })
      const reaction = current === 'like' ? null : 'like'
      setReaction(eventId, reaction)
      persist(events)
      return { events, reactions: { ...s.reactions, [eventId]: reaction } }
    })
  },

  toggleDislike: (eventId) => {
    const current = get().reactions[eventId]
    set(s => {
      let events = s.events.map(e => {
        if (e.id !== eventId) return e
        let { likes, dislikes } = e
        if (current === 'dislike') { dislikes-- }
        else {
          dislikes++
          if (current === 'like') likes--
        }
        return { ...e, likes, dislikes }
      })
      const reaction = current === 'dislike' ? null : 'dislike'
      setReaction(eventId, reaction)
      persist(events)
      return { events, reactions: { ...s.reactions, [eventId]: reaction } }
    })
  },

  getReaction: (eventId) => get().reactions[eventId] || null,

  addComment: (eventId, userId, username, text) => {
    const comment: Comment = {
      id: uid(),
      eventId,
      userId,
      username,
      text,
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const events = s.events.map(e =>
        e.id === eventId ? { ...e, comments: [...e.comments, comment] } : e,
      )
      persist(events)
      return { events }
    })
  },
}))
