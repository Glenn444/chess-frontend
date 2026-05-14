import { create } from 'zustand'
import { GameSocket } from './websocket'
import { type WSInboundEvent, type ChatMessage, type WSBoardCell } from './api'
import { boardToPosition, applyMove } from './chess'
import type { Position } from '../components/Board'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// Convert backend 2D Board array → flat { "e2": "P", "a8": "r", ... } map.
// rankIdx 0 = rank 1 (white's back rank), rankIdx 7 = rank 8 (black's back rank).
function flattenBoard(board: WSBoardCell[][]): Record<string, string> {
  const result: Record<string, string> = {}
  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const cell = board[rankIdx]?.[fileIdx]
      if (cell?.Occupied && cell.Piece) {
        const sq = FILES[fileIdx] + (rankIdx + 1)
        result[sq] = cell.Piece.Color === 'w'
          ? cell.Piece.PieceType.toUpperCase()
          : cell.Piece.PieceType.toLowerCase()
      }
    }
  }
  return result
}

export interface LiveGameState {
  current_player: 'w' | 'b'
  board: Record<string, string>
  move_number: number
  status: string
  in_check: boolean
  play_against: 'person' | 'stockfish'
  user_color?: 'w' | 'b'   // undefined when backend sends "" — GameScreen falls back to REST
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
    console.log('[gameStore] connect — gameId:', gameId, 'hasToken:', !!token)
    get().socket?.destroy()

    const socket = new GameSocket(gameId, token)

    socket.on((event: WSInboundEvent) => {
      switch (event.type) {
        case 'game_state': {
          const raw = event.payload
          const g = raw.game
          const flatBoard = flattenBoard(g.Board)
          const gs: LiveGameState = {
            current_player: g.CurrentPlayer,
            board: flatBoard,
            move_number: g.MoveNumber,
            status: g.Status,
            in_check: g.InCheck,
            play_against: (g.PlayAgainst as 'person' | 'stockfish') || 'person',
            user_color: g.UserColor === 'w' || g.UserColor === 'b' ? g.UserColor : undefined,
            opponent_username: raw.opponent_username,
          }
          const pos = boardToPosition(flatBoard)
          set({ gameState: gs, position: pos, error: null })
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
    const socket = get().socket
    console.log('[gameStore] makeMove:', move, '— socket:', socket ? 'exists' : 'NULL')
    socket?.send('make_move', { move })
  },

  sendChat: (content) => {
    get().socket?.send('chat', { content })
  },

  clearError: () => set({ error: null }),
}))
