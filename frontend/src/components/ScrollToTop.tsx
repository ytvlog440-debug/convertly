import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname, search } = useLocation()
  const isFirstMount = useRef(true)

  useEffect(() => {
    // Skip initial mount to prevent forced synchronous reflow on first paint
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    // Defer scroll reset to next animation frame on route changes to avoid layout thrashing
    const rafId = requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      })
      if (document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0
      }
      if (document.body.scrollTop !== 0) {
        document.body.scrollTop = 0
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [pathname, search])

  return null
}

export default ScrollToTop