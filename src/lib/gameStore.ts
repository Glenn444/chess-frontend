import { create } from 'zustand'
import { GameSocket } from './websocket'
import type { Position } from '../components/Board'
import { fenToPosition, applyMove } from './chess'

export interface GameMove {
  move: string
  current_player: 'w' | 'b'
  in_check: boolean
  is_checkmate: boolean
  is_stalemate: boolean
}

export interface ChatMessage {
  username: string
  content: string
  sent_at: string
}

export interface GameState {
  id: string
  status: string
  player_color: 'w' | 'b'
  white_player: string
  black_player: string
  current_player: 'w' | 'b'
  fen: string
  in_check: boolean
  is_checkmate: boolean
  is_stalemate: boolean
  created_at: string
}

interface LiveGameStore {
  socket: GameSocket | null
  gameState: GameState | null
  position: Position | null
  moves: GameMove[]
  chatMessages: ChatMessage[]
  error: string | null
  opponentDisconnected: boolean

  connect: (gameId: string, token: string) => void
  disconnect: () => void
  makeMove: (move: string) => void
  sendChat: (content: string) => void
  clearError: () => void
}

export const useLiveGame = create<LiveGameStore>((set, get) => ({
  socket: null,
  gameState: null,
  position: null,
  moves: [],
  chatMessages: [],
  error: null,
  opponentDisconnected: false,

  connect: (gameId, token) => {
    // Clean up existing connection
    get().socket?.destroy()

    const socket = new GameSocket(gameId, token)

    socket.on('game_state', (_, payload) => {
      const state = payload as GameState
      const position = fenToPosition(state.fen || '')
      set({ gameState: state, position, error: null })
    })

    socket.on('make_move', (_, payload) => {
      const move = payload as GameMove
      set(s => {
        const newMoves = [...s.moves, move]
        const state = s.gameState
        const newPosition = s.position ? applyMove(s.position, move.move) : null
        if (state) {
          return {
            moves: newMoves,
            position: newPosition,
            gameState: {
              ...state,
              current_player: move.current_player,
              in_check: move.in_check,
              is_checkmate: move.is_checkmate,
              is_stalemate: move.is_stalemate,
            },
          }
        }
        return { moves: newMoves, position: newPosition }
      })
    })

    socket.on('chat', (_, payload) => {
      const msg = payload as ChatMessage
      set(s => ({ chatMessages: [...s.chatMessages, msg] }))
    })

    socket.on('error', (_, payload) => {
      const err = payload as { error: string }
      set({ error: err.error })
    })

    socket.on('player_disconnected', () => {
      set({ opponentDisconnected: true })
    })

    socket.on('player_reconnected', () => {
      set({ opponentDisconnected: false })
    })

    set({ socket, position: null, moves: [], chatMessages: [], error: null, opponentDisconnected: false })
  },

  disconnect: () => {
    get().socket?.destroy()
    set({ socket: null, gameState: null, position: null, moves: [], chatMessages: [], error: null })
  },

  makeMove: (move) => {
    get().socket?.send('make_move', { move })
  },

  sendChat: (content) => {
    get().socket?.send('chat', { content })
  },

  clearError: () => set({ error: null }),
}))
