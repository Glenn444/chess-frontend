import { useEffect, useRef, useState } from 'react'

// Deadline-based countdown. Computing from an absolute deadline (instead of
// decrementing a counter every second) keeps the clock honest through
// background-tab throttling and eliminates cumulative drift.
export function useCountdown(remainingMs: number, running: boolean, onFlag?: () => void) {
  const [msLeft, setMsLeft] = useState(remainingMs)
  const onFlagRef = useRef(onFlag)
  onFlagRef.current = onFlag

  useEffect(() => {
    setMsLeft(remainingMs)
    if (!running || remainingMs <= 0) return

    const deadline = Date.now() + remainingMs
    let flagged = false
    const tick = () => {
      const left = Math.max(0, deadline - Date.now())
      setMsLeft(left)
      if (left === 0 && !flagged) {
        flagged = true
        onFlagRef.current?.()
      }
    }
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [remainingMs, running])

  return msLeft
}

export function formatClock(msLeft: number): string {
  const secs = Math.ceil(msLeft / 1000)
  const mins = Math.floor(secs / 60)
  return `${mins}:${(secs % 60).toString().padStart(2, '0')}`
}
