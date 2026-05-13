const WS_BASE = 'wss://api.chesske.com/ws'

type MessageHandler = (type: string, payload: unknown) => void

interface QueuedMessage {
  type: string
  payload: unknown
}

export class GameSocket {
  private ws: WebSocket | null = null
  private gameId: string
  private token: string
  private handlers = new Map<string, Set<MessageHandler>>()
  private queue: QueuedMessage[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingTimer: ReturnType<typeof setTimeout> | null = null
  private authenticated = false
  private destroyed = false

  constructor(gameId: string, token: string) {
    this.gameId = gameId
    this.token = token
    this.connect()
  }

  private connect() {
    if (this.destroyed) return
    this.ws = new WebSocket(`${WS_BASE}?game_id=${this.gameId}`)

    this.ws.onopen = () => {
      // Wait for auth_required from server before sending auth
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this.handleMessage(msg)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.authenticated = false
      this.stopPing()
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = () => {
      // onclose will fire after this, triggering reconnect
    }
  }

  private handleMessage(msg: { type: string; payload?: unknown }) {
    const { type, payload } = msg

    switch (type) {
      case 'auth_required':
        this.sendRaw({ type: 'auth', payload: { token: this.token } })
        break

      case 'game_state':
        this.authenticated = true
        this.flushQueue()
        this.startPing()
        this.emit(type, payload)
        break

      case 'ping':
        this.sendRaw({ type: 'pong', payload: {} })
        break

      case 'make_move':
      case 'chat':
      case 'error':
      case 'player_disconnected':
      case 'player_reconnected':
      case 'voice_offer':
      case 'voice_answer':
      case 'voice_ice':
      case 'voice_end':
        this.emit(type, payload)
        break

      default:
        // forward unknown events too
        this.emit(type, payload)
    }
  }

  private sendRaw(msg: QueuedMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  send(type: string, payload: unknown = {}) {
    const msg = { type, payload }
    if (this.authenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.sendRaw(msg)
    } else {
      this.queue.push(msg)
    }
  }

  private flushQueue() {
    const pending = this.queue.splice(0)
    pending.forEach(m => this.sendRaw(m))
  }

  private startPing() {
    this.stopPing()
    this.pingTimer = setInterval(() => {
      // Server sends ping, we reply pong — no action needed here
    }, 30_000)
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => { this.handlers.get(type)?.delete(handler) }
  }

  private emit(type: string, payload: unknown) {
    this.handlers.get(type)?.forEach(h => h(type, payload))
  }

  isConnected() {
    return this.authenticated && this.ws?.readyState === WebSocket.OPEN
  }

  destroy() {
    this.destroyed = true
    this.stopPing()
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.ws?.close()
    this.ws = null
    this.handlers.clear()
    this.queue = []
  }
}
