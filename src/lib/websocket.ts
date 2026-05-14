import {
  createGameSocket,
  wsSend,
  wsParseInbound,
  type WSInboundEvent,
} from './api'

type EventHandler = (event: WSInboundEvent) => void

export class GameSocket {
  private ws: WebSocket | null = null
  private gameId: string
  private token: string
  private handlers = new Set<EventHandler>()
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  constructor(gameId: string, token: string) {
    this.gameId = gameId
    this.token = token
    this.connect()
  }

  private connect() {
    if (this.destroyed) return
    this.ws = createGameSocket(this.gameId)

    this.ws.onopen = () => {
      // Server will send auth_required first
    }

    this.ws.onmessage = (msg) => {
      const event = wsParseInbound(msg.data as string)
      if (!event) return

      switch (event.type) {
        case 'auth_required':
          wsSend(this.ws!, { type: 'auth', payload: { token: this.token } })
          break

        case 'game_state':
          this.startPing()
          this.emit(event)
          break

        case 'ping':
          wsSend(this.ws!, { type: 'pong' })
          break

        default:
          this.emit(event)
      }
    }

    this.ws.onclose = () => {
      this.stopPing()
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = () => {
      // onclose fires afterward, triggering reconnect
    }
  }

  on(handler: EventHandler): () => void {
    this.handlers.add(handler)
    return () => { this.handlers.delete(handler) }
  }

  private emit(event: WSInboundEvent) {
    this.handlers.forEach(h => h(event))
  }

  send(type: string, payload?: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    switch (type) {
      case 'make_move':
        wsSend(this.ws, { type: 'make_move', payload: payload as { move: string } })
        break
      case 'chat':
        wsSend(this.ws, { type: 'chat', payload: payload as { content: string } })
        break
      case 'voice_offer':
        wsSend(this.ws, { type: 'voice_offer', payload: payload as RTCSessionDescriptionInit })
        break
      case 'voice_answer':
        wsSend(this.ws, { type: 'voice_answer', payload: payload as RTCSessionDescriptionInit })
        break
      case 'voice_ice':
        wsSend(this.ws, { type: 'voice_ice', payload: payload as RTCIceCandidateInit })
        break
      case 'voice_end':
        wsSend(this.ws, { type: 'voice_end' })
        break
    }
  }

  private startPing() {
    this.stopPing()
    // Server sends ping every 30s — we reply in onmessage.
    // No action needed on client timer; the server drives pings.
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null }
  }

  destroy() {
    this.destroyed = true
    this.stopPing()
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
  }
}
