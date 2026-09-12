/**
 * @file AnalyticsTracker.tsx
 * @description Headless router listener that dispatches Google Analytics 4 page_view
 * events automatically on every SPA route transition in React Router.
 */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../../lib/analytics'
import { trackClarityNavigation } from '../../lib/clarity'

/**
 * AnalyticsTracker Component
 * 
 * Must be mounted as a child of <Router>.
 * Monitors `location.pathname` and `location.search`.
 * Guarantees that every page navigation in the SPA emits accurate page view and
 * session navigation events for both Google Analytics 4 and Microsoft Clarity
 * with updated document title once the destination page components mount.
 */
export function AnalyticsTracker(): null {
  const location = useLocation()
  const previousPathRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPath = location.pathname + location.search

    // Avoid duplicate dispatch if the path has not changed
    if (previousPathRef.current === currentPath) {
      return
    }
    previousPathRef.current = currentPath

    // Brief timeout ensures document.title updated by SeoHead / route components takes effect
    const timerId = window.setTimeout(() => {
      trackPageView(currentPath, document.title)
      trackClarityNavigation(currentPath, document.title)
    }, 120)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [location.pathname, location.search])

  return null
}
