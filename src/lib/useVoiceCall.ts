import { useRef, useState, useCallback, useEffect } from 'react'
import type { GameSocket } from './websocket'
import type { WSInboundEvent } from './api'
import { api } from './api'

interface VoiceState {
  status: 'idle' | 'connected' | 'degraded' | 'ended'
  muted: boolean
  micDenied: boolean
  error: string | null
}

const FALLBACK_ICE: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

async function fetchIceServers(): Promise<RTCConfiguration> {
  try {
    const { iceServers } = await api.turnCredentials()
    // console.log('[Voice] TURN credentials fetched:', iceServers)
    return { iceServers }
  } catch (e) {
    // console.warn('[Voice] TURN credentials failed, using Google STUN fallback:', e)
    return FALLBACK_ICE
  }
}

export function useVoiceCall(socket: GameSocket | null) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])
  const remoteDescSet = useRef(false)
  const mutedRef = useRef(true)
  // Always-current socket ref — used in PC event handlers so they don't capture stale closures
  const socketRef = useRef(socket)
  const iceRestartInProgress = useRef(false)
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOffererRef = useRef(false)     // true when we called startCall (white side)

  useEffect(() => { socketRef.current = socket }, [socket])

  const [state, setState] = useState<VoiceState>({
    status: 'idle', muted: true, micDenied: false, error: null,
  })

  useEffect(() => {
    return () => { hangup() }
  }, [])

  const hangup = useCallback(() => {
    // console.log('[Voice] hangup — closing peer connection')
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = null
    }
    iceRestartInProgress.current = false
    isOffererRef.current = false
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    iceCandidateQueue.current = []
    remoteDescSet.current = false
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    setState(s => ({ ...s, status: 'ended' }))
  }, [])

  // ICE restart — cheaper than full PC teardown. Sends a new offer with iceRestart: true.
  // The other side's voice_offer handler detects the live PC and answers without creating a new one.
  const restartIce = useCallback(async () => {
    const pc = pcRef.current
    const sock = socketRef.current
    if (!pc || !sock || iceRestartInProgress.current) return
    if (pc.signalingState === 'closed') { hangup(); return }

    iceRestartInProgress.current = true
    // console.log('[Voice] ICE restart — creating offer with iceRestart: true')
    setState(s => ({ ...s, status: 'degraded' }))

    try {
      const offer = await pc.createOffer({ iceRestart: true })
      await pc.setLocalDescription(offer)
      sock.send('voice_offer', pc.localDescription)
      // console.log('[Voice] ICE restart offer sent')
    } catch (e) {
      // console.error('[Voice] ICE restart failed — full hangup:', e)
      hangup()
    } finally {
      iceRestartInProgress.current = false
    }
  }, [hangup])

  // Re-sends the current offer to the opponent without touching the PC, ICE, or mic.
  // Called when the opponent reconnects and may have missed our original voice_offer.
  const resendOffer = useCallback(async () => {
    const pc = pcRef.current
    const sock = socketRef.current
    if (!pc || !sock || pc.signalingState === 'closed') return

    // console.log('[Voice] resendOffer — signalingState:', pc.signalingState)
    if (pc.signalingState === 'have-local-offer' && pc.localDescription) {
      // Offer already exists — just resend, no renegotiation needed
      sock.send('voice_offer', pc.localDescription)
      // console.log('[Voice] resendOffer — existing offer re-sent')
    } else if (pc.signalingState === 'stable') {
      // Need a fresh offer (e.g. answer was received but connection never established)
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        sock.send('voice_offer', pc.localDescription)
        // console.log('[Voice] resendOffer — new offer sent')
      } catch (e) {
        // console.error('[Voice] resendOffer — createOffer failed:', e)
      }
    } else {
      // console.log('[Voice] resendOffer — skipping, state not resendable:', pc.signalingState)
    }
  }, [])

  const flushIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = iceCandidateQueue.current.splice(0)
    // console.log(`[Voice] flushing ${queued.length} queued ICE candidates`)
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c))
        // console.log('[Voice] queued ICE candidate added')
      } catch (e) {
        // console.warn('[Voice] queued ICE candidate failed:', e)
      }
    }
  }, [])

  const createPC = useCallback((iceConfig: RTCConfiguration) => {
    // console.log('[Voice] creating RTCPeerConnection with config:', JSON.stringify(iceConfig))
    const pc = new RTCPeerConnection(iceConfig)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        // console.log('[Voice] local ICE candidate — sending via WS:', e.candidate.candidate.substring(0, 60))
        socketRef.current?.send('voice_ice', e.candidate)
      } else {
        // console.log('[Voice] ICE gathering complete (null candidate)')
      }
    }

    pc.onicegatheringstatechange = () => {
      // console.log('[Voice] ICE gathering state:', pc.iceGatheringState)
    }

    pc.oniceconnectionstatechange = () => {
      // console.log('[Voice] ICE connection state:', pc.iceConnectionState)
      if (pc.iceConnectionState === 'failed') {
        // console.warn('[Voice] ICE failed — attempting ICE restart')
        restartIce()
      }
    }

    pc.onsignalingstatechange = () => {
      // console.log('[Voice] signaling state:', pc.signalingState)
    }

    pc.ontrack = (e) => {
      // console.log('[Voice] remote track received — kind:', e.track.kind, 'streams:', e.streams.length)
      if (e.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
        remoteAudioRef.current.play().catch(_err => {
          // console.warn('[Voice] audio autoplay blocked:', _err)
        })
        setState(s => ({ ...s, status: 'connected' }))
        // console.log('[Voice] ✅ audio connected')
      }
    }

    pc.onconnectionstatechange = () => {
      // console.log('[Voice] connection state:', pc.connectionState)

      if (pc.connectionState === 'connected') {
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current)
          disconnectTimerRef.current = null
        }
        iceRestartInProgress.current = false
        setState(s => ({ ...s, status: 'connected' }))
        void (async () => {
          try {
            const stats = await pc.getStats()
            const candidateTypes = new Map<string, string>()
            stats.forEach(r => {
              if (r.type === 'local-candidate' || r.type === 'remote-candidate') {
                candidateTypes.set(r.id, r.candidateType ?? 'unknown')
              }
            })
            stats.forEach(r => {
              if (r.type === 'candidate-pair' && r.state === 'succeeded') {
                const localType = candidateTypes.get(r.localCandidateId) ?? r.localCandidateId
                const remoteType = candidateTypes.get(r.remoteCandidateId) ?? r.remoteCandidateId
                const relayProtocol = r.relayProtocol ?? null
                // console.log('[Voice] stats — local:', localType, 'remote:', remoteType, 'relay:', relayProtocol)
                socketRef.current?.send('voice_stats', {
                  localType,
                  remoteType,
                  relayProtocol,
                  selectedPair: r.id,
                  localCandidate: r.localCandidateId,
                  remoteCandidate: r.remoteCandidateId,
                })
              }
            })
          } catch (_e) {
            // console.warn('[Voice] getStats failed:', _e)
          }
        })()
      }

      if (pc.connectionState === 'disconnected') {
        // console.warn('[Voice] connection disconnected — waiting 5s before ICE restart')
        setState(s => ({ ...s, status: 'degraded' }))
        disconnectTimerRef.current = setTimeout(() => {
          if (pcRef.current?.connectionState === 'disconnected') {
            // console.warn('[Voice] still disconnected after 5s — attempting ICE restart')
            restartIce()
          }
        }, 5000)
      }

      if (pc.connectionState === 'failed') {
        // console.warn('[Voice] connection failed — attempting ICE restart')
        restartIce()
      }
    }

    return pc
  }, [hangup, restartIce])

  const getLocalStream = async () => {
    // console.log('[Voice] requesting microphone access…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      setState(s => ({ ...s, micDenied: false }))
      // const track = stream.getAudioTracks()[0]
      // console.log('[Voice] mic access granted — track:', track?.label, 'enabled:', track?.enabled)
      return stream
    } catch (e) {
      // console.error('[Voice] mic access denied:', e)
      setState(s => ({ ...s, micDenied: true }))
      throw new Error('Microphone access denied')
    }
  }

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
      setState(s => ({ ...s, micDenied: false }))
    } catch {
      setState(s => ({ ...s, micDenied: true }))
    }
  }, [])

  // Listen for WebSocket voice events
  useEffect(() => {
    if (!socket) return
    // console.log('[Voice] subscribing to WS voice events on socket')

    const unsub = socket.on(async (event: WSInboundEvent) => {
      switch (event.type) {
        case 'voice_offer': {
          // console.log('[Voice] ← voice_offer received')

          // If we already have a live PC, treat this as an ICE restart offer.
          // Don't create a new PC — just renegotiate on the existing one.
          const existingPc = pcRef.current
          if (existingPc && existingPc.signalingState !== 'closed') {
            // console.log('[Voice] existing PC alive (%s) — handling as ICE restart offer', existingPc.connectionState)
            try {
              await existingPc.setRemoteDescription(new RTCSessionDescription(event.payload))
              remoteDescSet.current = true
              const answer = await existingPc.createAnswer()
              await existingPc.setLocalDescription(answer)
              socket.send('voice_answer', existingPc.localDescription)
              // console.log('[Voice] ICE restart answer sent')
              iceRestartInProgress.current = false
            } catch (_e) {
              // console.error('[Voice] ICE restart answer failed:', _e)
            }
            break
          }

          // No live PC — full setup (first connection or after hangup)
          // console.log('[Voice] no existing PC — full setup (I am the answerer)')
          try {
            const iceConfig = await fetchIceServers()
            const pc = createPC(iceConfig)
            pcRef.current = pc
            remoteDescSet.current = false

            const stream = await getLocalStream()
            stream.getTracks().forEach(t => {
              t.enabled = !mutedRef.current
              pc.addTrack(t, stream)
              // console.log('[Voice] answerer: local audio track added to PC — enabled:', t.enabled)
            })

            // console.log('[Voice] setting remote description (offer)…')
            await pc.setRemoteDescription(new RTCSessionDescription(event.payload))
            remoteDescSet.current = true
            // console.log('[Voice] remote description set — creating answer…')
            await flushIceCandidates(pc)

            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            // console.log('[Voice] → sending voice_answer')
            socket.send('voice_answer', pc.localDescription)
          } catch (_e) {
            // console.error('[Voice] answerer error:', _e)
            setState(s => ({ ...s, error: 'Microphone access denied' }))
            hangup()
          }
          break
        }

        case 'voice_answer': {
          // console.log('[Voice] ← voice_answer received (I am the offerer)')
          try {
            const pc = pcRef.current
            if (!pc) { /* console.warn('[Voice] no PC for voice_answer — ignoring') */ break }
            await pc.setRemoteDescription(new RTCSessionDescription(event.payload))
            remoteDescSet.current = true
            // console.log('[Voice] remote description set (answer) — flushing ICE queue…')
            await flushIceCandidates(pc)
          } catch (_e) {
            // console.error('[Voice] offerer setRemoteDescription failed:', _e)
            setState(s => ({ ...s, error: 'Failed to connect audio' }))
            hangup()
          }
          break
        }

        case 'voice_ice': {
          const pc = pcRef.current
          // console.log('[Voice] ← voice_ice candidate — remoteDescSet:', remoteDescSet.current)
          if (!pc) { /* console.warn('[Voice] no PC for voice_ice — ignoring') */ break }
          if (!remoteDescSet.current) {
            // console.log('[Voice] queueing ICE candidate (remote desc not set yet)')
            iceCandidateQueue.current.push(event.payload)
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(event.payload))
              // console.log('[Voice] ICE candidate added')
            } catch (_e) {
              // console.warn('[Voice] addIceCandidate failed:', _e)
            }
          }
          break
        }

        case 'voice_end': {
          // console.log('[Voice] ← voice_end — hanging up')
          hangup()
          break
        }

        case 'player_reconnected': {
          // console.log('[Voice] ← player_reconnected')
          const pc = pcRef.current
          // If we are the offerer and the PC is alive but voice isn't connected yet,
          // the opponent may have missed our original voice_offer — re-send it after
          // a short delay to let their WS session stabilise.
          if (
            isOffererRef.current &&
            pc &&
            pc.signalingState !== 'closed' &&
            pc.connectionState !== 'connected'
          ) {
            // console.log('[Voice] opponent reconnected, I am offerer — re-sending offer in 1s')
            setTimeout(() => {
              if (pcRef.current?.connectionState !== 'connected') resendOffer()
            }, 1000)
          }
          break
        }
      }
    })

    return () => unsub()
  }, [socket, hangup, createPC, flushIceCandidates, resendOffer])

  const startCall = useCallback(async () => {
    if (!socket) { /* console.warn('[Voice] startCall — no socket') */ return }

    // If PC exists and is healthy, skip — voice survives WS reconnects independently.
    // Only restart if the PC itself has failed or been closed.
    const existingPc = pcRef.current
    if (existingPc) {
      const connState = existingPc.connectionState
      if (connState !== 'failed' && connState !== 'closed') {
        // console.log('[Voice] startCall — PC already alive (%s), skipping', connState)
        return
      }
      // console.log('[Voice] startCall — PC is %s, closing and restarting', connState)
      existingPc.close()
      pcRef.current = null
      iceCandidateQueue.current = []
      remoteDescSet.current = false
    }

    isOffererRef.current = true
    // console.log('[Voice] startCall — I am the offerer')
    try {
      const iceConfig = await fetchIceServers()
      const pc = createPC(iceConfig)
      pcRef.current = pc
      remoteDescSet.current = false

      const stream = await getLocalStream()
      stream.getTracks().forEach(t => {
        t.enabled = !mutedRef.current
        pc.addTrack(t, stream)
        // console.log('[Voice] offerer: local audio track added to PC — enabled:', t.enabled)
      })

      // console.log('[Voice] creating offer…')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      // console.log('[Voice] → sending voice_offer')
      socket.send('voice_offer', pc.localDescription)
    } catch (_e) {
      // console.error('[Voice] startCall error:', _e)
      setState(s => ({ ...s, error: 'Microphone access denied' }))
    }
  }, [socket, createPC])

  const endCall = useCallback(() => {
    // console.log('[Voice] endCall')
    socket?.send('voice_end')
    hangup()
  }, [socket, hangup])

  const toggleMute = useCallback(() => {
    const newMuted = !mutedRef.current
    mutedRef.current = newMuted

    const localTracks = localStreamRef.current?.getAudioTracks() ?? []
    // console.log('[Voice] mute toggled — muted:', newMuted,
    //   '| localStream tracks:', localTracks.map(t => ({
    //     id: t.id.slice(0, 8),
    //     label: t.label,
    //     enabled: t.enabled,
    //     readyState: t.readyState,
    //   }))
    // )

    localTracks.forEach(t => { t.enabled = !newMuted })

    // const senders = pcRef.current?.getSenders() ?? []
    // console.log('[Voice] PC senders after toggle:', senders.map(s => ({
    //   kind: s.track?.kind,
    //   id: s.track?.id.slice(0, 8),
    //   enabled: s.track?.enabled,
    //   readyState: s.track?.readyState,
    // })))

    // if (senders.length === 0) {
    //   console.warn('[Voice] no senders on PC — mute may have no effect (stale PC or PC not created yet)')
    // }

    setState(s => ({ ...s, muted: newMuted }))
  }, [])

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    requestMic,
    remoteAudioRef,
  }
}
