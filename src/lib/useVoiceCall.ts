import { useRef, useState, useCallback, useEffect } from 'react'
import type { GameSocket } from './websocket'
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
    return { iceServers }
  } catch {
    return FALLBACK_ICE
  }
}

export function useVoiceCall(socket: GameSocket | null) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  const [state, setState] = useState<VoiceState>({
    status: 'idle', muted: false, micDenied: false, error: null,
  })

  useEffect(() => {
    return () => { hangup() }
  }, [])

  const hangup = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
    setState(s => ({ ...s, status: 'ended' }))
  }, [])

  const createPC = useCallback((iceConfig: RTCConfiguration) => {
    const pc = new RTCPeerConnection(iceConfig)

    pc.onicecandidate = (e) => {
      if (e.candidate) socket?.send('voice_ice', e.candidate)
    }

    pc.ontrack = (e) => {
      if (e.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0]
        remoteAudioRef.current.play().catch(() => {})
        setState(s => ({ ...s, status: 'connected' }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        hangup()
      }
    }

    return pc
  }, [socket, hangup])

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      setState(s => ({ ...s, micDenied: false }))
      return stream
    } catch {
      setState(s => ({ ...s, micDenied: true }))
      throw new Error('Microphone access denied')
    }
  }

  // ── Request mic permission on mount (required to play) ──
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

  // ── Listen for WebSocket voice events ──
  useEffect(() => {
    if (!socket) return

    const unsubs = [
      // Receiver side — fetch TURN, then auto-answer
      socket.on('voice_offer', async (_, payload) => {
        try {
          const iceConfig = await fetchIceServers()
          const pc = createPC(iceConfig)
          pcRef.current = pc

          const stream = await getLocalStream()
          stream.getTracks().forEach(t => pc.addTrack(t, stream))

          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.send('voice_answer', pc.localDescription)
        } catch {
          setState(s => ({ ...s, error: 'Microphone access denied' }))
          hangup()
        }
      }),

      socket.on('voice_answer', async (_, payload) => {
        try {
          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(payload as RTCSessionDescriptionInit)
          )
          setState(s => ({ ...s, status: 'connected' }))
        } catch {
          setState(s => ({ ...s, error: 'Failed to connect audio' }))
          hangup()
        }
      }),

      socket.on('voice_ice', async (_, payload) => {
        try {
          await pcRef.current?.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit))
        } catch { /* ignore invalid candidates */ }
      }),

      socket.on('voice_end', () => hangup()),
    ]

    return () => unsubs.forEach(u => u())
  }, [socket, hangup, createPC])

  // ── Start call — fetch TURN, then create offer ──
  const startCall = useCallback(async () => {
    if (!socket || pcRef.current) return
    try {
      const iceConfig = await fetchIceServers()
      const pc = createPC(iceConfig)
      pcRef.current = pc

      const stream = await getLocalStream()
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.send('voice_offer', pc.localDescription)
    } catch {
      setState(s => ({ ...s, error: 'Microphone access denied' }))
    }
  }, [socket, createPC])

  // ── End call ──
  const endCall = useCallback(() => {
    socket?.send('voice_end', {})
    hangup()
  }, [socket, hangup])

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setState(s => {
      const newMuted = !s.muted
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !newMuted })
      return { ...s, muted: newMuted }
    })
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
