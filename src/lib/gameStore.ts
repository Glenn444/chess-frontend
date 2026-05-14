import { create } from 'zustand'
import { GameSocket } from './websocket'
import { type WSInboundEvent, type ChatMessage } from './api'
import { boardToPosition, applyMove } from './chess'
import type { Position } from '../components/Board'

export interface LiveGameState {
  current_player: 'w' | 'b'
  board: Record<string, string>
  move_number: number
  status: string
  in_check: boolean
  play_against: 'person' | 'stockfish'
  user_color: 'w' | 'b'
  opponent_username?: string
}

export interface LiveMove {
  move: string
  current_player: 'w' | 'b'
  in_check: boolean
  is_checkmate: boolean
  is_stalemate: boolean
}

interface LiveGameStore {
  socket: GameSocket | null
  gameState: LiveGameState | null
  position: Position | null
  moves: LiveMove[]
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
    get().socket?.destroy()

    const socket = new GameSocket(gameId, token)

    socket.on((event: WSInboundEvent) => {
      switch (event.type) {
        case 'game_state': {
          const gs = event.payload
          const pos = boardToPosition(gs.board)
          set({
            gameState: gs,
            position: pos,
            error: null,
          })
          break
        }

        case 'make_move': {
          const mv = event.payload
          set(s => ({
            moves: [...s.moves, mv],
            position: s.position ? applyMove(s.position, mv.move) : null,
            gameState: s.gameState ? {
              ...s.gameState,
              current_player: mv.current_player,
              in_check: mv.in_check,
              status: mv.is_checkmate ? 'checkmate' : mv.is_stalemate ? 'stalemate' : s.gameState.status,
            } : null,
          }))
          break
        }

        case 'chat': {
          const msg = event.payload
          set(s => ({ chatMessages: [...s.chatMessages, msg] }))
          break
        }

        case 'error': {
          set({ error: event.payload.error })
          break
        }

        case 'player_disconnected': {
          set({ opponentDisconnected: true })
          break
        }

        case 'player_reconnected': {
          set({ opponentDisconnected: false })
          break
        }
      }
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
