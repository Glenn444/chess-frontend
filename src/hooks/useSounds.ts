// Audio elements are created once at module level so they're preloaded and ready instantly.
const audioElements = {
  move:      new Audio('/sounds/move.mp3'),
  capture:   new Audio('/sounds/capture.mp3'),
  check:     new Audio('/sounds/check.mp3'),
  chat:      new Audio('/sounds/chat.mp3'),
  gameStart: new Audio('/sounds/game-start.mp3'),
  lowTime:   new Audio('/sounds/low-time.mp3'),
  select:    new Audio('/sounds/select.mp3'),
}

Object.values(audioElements).forEach(a => { a.preload = 'auto' })

function play(audio: HTMLAudioElement) {
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Unlocks audio on iOS/Safari by playing a silent AudioContext buffer on the first user gesture.
function unlockAudio() {
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  const ctx = new AudioCtx()
  const buf = ctx.createBuffer(1, 1, 22050)
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  src.start(0)
  void ctx.close()
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', unlockAudio, { once: true })
}

// Named exports — callable from non-React code (gameStore, etc.)
export const playMove      = () => play(audioElements.move)
export const playCapture   = () => play(audioElements.capture)
export const playCheck     = () => play(audioElements.check)
export const playChat      = () => play(audioElements.chat)
export const playGameStart = () => play(audioElements.gameStart)
export const playLowTime   = () => play(audioElements.lowTime)
export const playSelect    = () => play(audioElements.select)

// Hook for React components that want the bundled interface.
export function useSounds() {
  return { playMove, playCapture, playCheck, playChat, playGameStart, playLowTime, playSelect }
}
