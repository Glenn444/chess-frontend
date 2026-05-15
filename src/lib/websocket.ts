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
    console.log('[WS] connecting to game', this.gameId)
    this.ws = createGameSocket(this.gameId)

    this.ws.onopen = () => {
      console.log('[WS] open — waiting for auth_required')
    }

    this.ws.onmessage = (msg) => {
      const event = wsParseInbound(msg.data as string)
      if (!event) {
        console.warn('[WS] unparseable message:', msg.data)
        return
      }
      switch (event.type) {
        case 'auth_required':
          console.log('[WS] sending auth token')
          wsSend(this.ws!, { type: 'auth', payload: { token: this.token } })
          break

        case 'game_state':
          console.log('[WS] ← game_state')
          this.startPing()
          this.emit(event)
          break

        case 'ping':
          wsSend(this.ws!, { type: 'pong' })
          break

        default:
          console.log('[WS] ←', event.type, 'payload' in event ? event.payload : '')
          this.emit(event)
      }
    }

    this.ws.onclose = (e) => {
      console.log('[WS] closed — code:', e.code, 'reason:', e.reason, 'clean:', e.wasClean)
      this.stopPing()
      if (!this.destroyed) {
        console.log('[WS] reconnecting in 3s…')
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = (e) => {
      console.error('[WS] error event', e)
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
    const state = this.ws ? ['CONNECTING','OPEN','CLOSING','CLOSED'][this.ws.readyState] : 'NO_SOCKET'
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] send blocked — socket state:', state, '— type:', type)
      return
    }
    console.log('[WS] →', type, payload ?? '')
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
      case 'voice_stats':
        wsSend(this.ws, { type: 'voice_stats', payload: payload as { localType: string; remoteType: string; relayProtocol: string | null; selectedPair: string; localCandidate: string; remoteCandidate: string } })
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
