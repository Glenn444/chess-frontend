import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)

  useEffect(() => {
    // Debounced: iOS fires resize continuously while the URL bar collapses,
    // and un-throttled updates make the layout feel jumpy mid-scroll.
    let t: ReturnType<typeof setTimeout> | undefined
    const handler = () => {
      clearTimeout(t)
      t = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 120)
    }
    window.addEventListener('resize', handler)
    return () => { clearTimeout(t); window.removeEventListener('resize', handler) }
  }, [breakpoint])

  return isMobile
}
