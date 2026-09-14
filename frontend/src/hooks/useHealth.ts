import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHealth, type HealthData } from '../lib/api'

// Optimistic fallback for zero-blocking UI
const DEFAULT_HEALTH: HealthData = {
  status: 'healthy',
  version: '2.0.0',
  environment: 'production',
  database: 'SQLAlchemy Async',
  storage: { driver: 'Local Driver', status: 'healthy' },
  system: {
    python_version: '3.11',
    platform: 'Linux',
    retention_policy_minutes: 120,
    max_upload_mb: 100,
  },
}

/**
 * Enterprise lazy health-check hook.
 *
 * Rules:
 * 1. Zero requests during critical rendering path (LCP / FCP unblocked).
 * 2. Deferred until user interaction OR requestIdleCallback / setTimeout(..., 3000).
 * 3. 5-minute memory caching (staleTime: 300,000ms) with zero background polling.
 * 4. Zero retries on failure (never saturates network).
 */
export function useHealth() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    let idleId: number | undefined
    let timeoutId: number | undefined

    const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const win = typeof window !== 'undefined' ? (window as any) : null

    const cleanup = () => {
      INTERACTION_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, triggerEnable)
      })
      if (idleId !== undefined && win && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }

    const triggerEnable = () => {
      cleanup()
      setIsEnabled(true)
    }

    INTERACTION_EVENTS.forEach((evt) => {
      window.addEventListener(evt, triggerEnable, { once: true, passive: true })
    })

    const scheduleAfterInteractive = () => {
      if (win && typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(triggerEnable, { timeout: 3000 })
      } else {
        timeoutId = window.setTimeout(triggerEnable, 3000)
      }
    }

    if (document.readyState === 'complete') {
      scheduleAfterInteractive()
    } else {
      window.addEventListener('load', scheduleAfterInteractive, { once: true })
    }

    return cleanup
  }, [])

  return useQuery<HealthData, Error>({
    queryKey: ['system-health'],
    queryFn: fetchHealth,
    enabled: isEnabled,
    refetchInterval: false, // NO background polling
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false, // No unnecessary retries
    staleTime: 5 * 60 * 1000, // 5 minutes in-memory caching
    placeholderData: DEFAULT_HEALTH,
  })
}

