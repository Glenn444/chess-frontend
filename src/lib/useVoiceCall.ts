import { useRef, useState, useCallback, useEffect } from 'react'
import type { GameSocket } from './websocket'
import type { WSInboundEvent } from './api'
import { api } from './api'

interface VoiceState {
  status: 'idle' | 'connected' | 'ended'
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
    console.log('[Voice] TURN credentials fetched:', iceServers)
    return { iceServers }
  } catch (e) {
    console.warn('[Voice] TURN credentials failed, using Google STUN fallback:', e)
    return FALLBACK_ICE
  }
}

export function useVoiceCall(socket: GameSocket | null) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  // Buffer ICE candidates that arrive before remote description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])
  const remoteDescSet = useRef(false)
  const mutedRef = useRef(true) // mirrors state.muted; used outside setState updaters

  const [state, setState] = useState<VoiceState>({
    status: 'idle', muted: true, micDenied: false, error: null,
  })

  useEffect(() => {
    return () => { hangup() }
  }, [])

  const hangup = useCallback(() => {
    console.log('[Voice] hangup — closing peer connection')
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

  const flushIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const queued = iceCandidateQueue.current.splice(0)
    console.log(`[Voice] flushing ${queued.length} queued ICE candidates`)
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c))
        console.log('[Voice] queued ICE candidate added')
      } catch (e) {
        console.warn('[Voice] queued ICE candidate failed:', e)
      }
    }
  }, [])

  const createPC = useCallback((iceConfig: RTCConfiguration) => {
    console.log('[Voice] creating RTCPeerConnection with config:', JSON.stringify(iceConfig))
    const pc = new RTCPeerConnection(iceConfig)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('[Voice] local ICE candidate — sending via WS:', e.candidate.candidate.substring(0, 60))
        socket?.send('voice_ice', e.candidate)
      } else {
        console.log('[Voice] ICE gathering complete (null candidate)')
      }
    }

    pc.onicegatheringstatechange = () => {
      console.log('[Voice] ICE gathering state:', pc.iceGatheringState)
    }

    pc.oniceconnectionstatechange = () => {
      console.log('[Voice] ICE connection state:', pc.iceConnectionState)
      if (pc.iceConnectionState === 'failed') {
        console.error('[Voice] ICE failed — check TURN server or NAT traversal')
      }
    }

    pc.onsignalingstatechange = () => {
      console.log('[Voice] signaling state:', pc.signalingState)
    }

    pc.ontrack = (e) => {
      console.log('[Voice] remote track received — kind:', e.track.kind, 'streams:', e.streams.length)
      if (e.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
        remoteAudioRef.current.play().catch(err => {
          console.warn('[Voice] audio autoplay blocked:', err)
        })
        setState(s => ({ ...s, status: 'connected' }))
        console.log('[Voice] ✅ audio connected')
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('[Voice] connection state:', pc.connectionState)
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.warn('[Voice] connection dropped — hanging up')
        hangup()
      }
    }

    return pc
  }, [socket, hangup])

  const getLocalStream = async () => {
    console.log('[Voice] requesting microphone access…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      setState(s => ({ ...s, micDenied: false }))
      const track = stream.getAudioTracks()[0]
      console.log('[Voice] mic access granted — track:', track?.label, 'enabled:', track?.enabled)
      return stream
    } catch (e) {
      console.error('[Voice] mic access denied:', e)
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
    console.log('[Voice] subscribing to WS voice events on socket')

    const unsub = socket.on(async (event: WSInboundEvent) => {
      switch (event.type) {
        case 'voice_offer': {
          console.log('[Voice] ← voice_offer received (I am the answerer)')
          try {
            const iceConfig = await fetchIceServers()
            const pc = createPC(iceConfig)
            pcRef.current = pc
            remoteDescSet.current = false

            const stream = await getLocalStream()
            stream.getTracks().forEach(t => {
              pc.addTrack(t, stream)
              console.log('[Voice] local audio track added to PC')
            })

            console.log('[Voice] setting remote description (offer)…')
            await pc.setRemoteDescription(new RTCSessionDescription(event.payload))
            remoteDescSet.current = true
            console.log('[Voice] remote description set — creating answer…')
            await flushIceCandidates(pc)

            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            console.log('[Voice] → sending voice_answer')
            socket.send('voice_answer', pc.localDescription)
          } catch (e) {
            console.error('[Voice] answerer error:', e)
            setState(s => ({ ...s, error: 'Microphone access denied' }))
            hangup()
          }
          break
        }

        case 'voice_answer': {
          console.log('[Voice] ← voice_answer received (I am the offerer)')
          try {
            const pc = pcRef.current
            if (!pc) { console.warn('[Voice] no PC for voice_answer — ignoring'); break }
            await pc.setRemoteDescription(new RTCSessionDescription(event.payload))
            remoteDescSet.current = true
            console.log('[Voice] remote description set (answer) — flushing ICE queue…')
            await flushIceCandidates(pc)
            setState(s => ({ ...s, status: 'connected' }))
          } catch (e) {
            console.error('[Voice] offerer setRemoteDescription failed:', e)
            setState(s => ({ ...s, error: 'Failed to connect audio' }))
            hangup()
          }
          break
        }

        case 'voice_ice': {
          const pc = pcRef.current
          console.log('[Voice] ← voice_ice candidate — remoteDescSet:', remoteDescSet.current)
          if (!pc) { console.warn('[Voice] no PC for voice_ice — ignoring'); break }
          if (!remoteDescSet.current) {
            console.log('[Voice] queueing ICE candidate (remote desc not set yet)')
            iceCandidateQueue.current.push(event.payload)
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(event.payload))
              console.log('[Voice] ICE candidate added')
            } catch (e) {
              console.warn('[Voice] addIceCandidate failed:', e)
            }
          }
          break
        }

        case 'voice_end': {
          console.log('[Voice] ← voice_end — hanging up')
          hangup()
          break
        }
      }
    })

    return () => unsub()
  }, [socket, hangup, createPC, flushIceCandidates])

  const startCall = useCallback(async () => {
    if (!socket) { console.warn('[Voice] startCall — no socket'); return }
    if (pcRef.current) {
      // Stale PC from a previous session (e.g. WS reconnected). Close it and restart.
      console.log('[Voice] startCall — closing stale PC before restart')
      pcRef.current.close()
      pcRef.current = null
      iceCandidateQueue.current = []
      remoteDescSet.current = false
    }
    console.log('[Voice] startCall — I am the offerer')
    try {
      const iceConfig = await fetchIceServers()
      const pc = createPC(iceConfig)
      pcRef.current = pc
      remoteDescSet.current = false

      const stream = await getLocalStream()
      stream.getTracks().forEach(t => {
        pc.addTrack(t, stream)
        console.log('[Voice] local audio track added to PC')
      })

      console.log('[Voice] creating offer…')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('[Voice] → sending voice_offer')
      socket.send('voice_offer', pc.localDescription)
    } catch (e) {
      console.error('[Voice] startCall error:', e)
      setState(s => ({ ...s, error: 'Microphone access denied' }))
    }
  }, [socket, createPC])

  const endCall = useCallback(() => {
    console.log('[Voice] endCall')
    socket?.send('voice_end')
    hangup()
  }, [socket, hangup])

  const toggleMute = useCallback(() => {
    // Side effects must live outside the setState updater — React 18 StrictMode
    // invokes updater functions twice in development to detect impure updaters,
    // which would cause the log and track mutation to fire twice per toggle.
    const newMuted = !mutedRef.current
    mutedRef.current = newMuted
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !newMuted })
    console.log('[Voice] mute toggled — muted:', newMuted)
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
