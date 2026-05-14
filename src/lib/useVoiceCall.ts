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
    status: 'idle', muted: true, micDenied: false, error: null,
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

    const unsub = socket.on(async (event: WSInboundEvent) => {
      switch (event.type) {
        case 'voice_offer': {
          try {
            const iceConfig = await fetchIceServers()
            const pc = createPC(iceConfig)
            pcRef.current = pc

            const stream = await getLocalStream()
            stream.getTracks().forEach(t => pc.addTrack(t, stream))

            await pc.setRemoteDescription(new RTCSessionDescription(event.payload))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.send('voice_answer', pc.localDescription)
          } catch {
            setState(s => ({ ...s, error: 'Microphone access denied' }))
            hangup()
          }
          break
        }

        case 'voice_answer': {
          try {
            await pcRef.current?.setRemoteDescription(
              new RTCSessionDescription(event.payload)
            )
            setState(s => ({ ...s, status: 'connected' }))
          } catch {
            setState(s => ({ ...s, error: 'Failed to connect audio' }))
            hangup()
          }
          break
        }

        case 'voice_ice': {
          try {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(event.payload))
          } catch { /* ignore invalid candidates */ }
          break
        }

        case 'voice_end': {
          hangup()
          break
        }
      }
    })

    return () => unsub()
  }, [socket, hangup, createPC])

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

  const endCall = useCallback(() => {
    socket?.send('voice_end')
    hangup()
  }, [socket, hangup])

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
