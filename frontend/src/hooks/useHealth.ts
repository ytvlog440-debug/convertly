import { useState, useEffect } from 'react'
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

let cachedHealth: HealthData | null = null
let cachedTimestamp = 0
let activeFetchPromise: Promise<HealthData> | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Enterprise zero-dependency lazy health-check hook.
 *
 * Performance features:
 * 1. Zero requests during critical rendering path (LCP / FCP unblocked).
 * 2. Deferred until user interaction OR requestIdleCallback / setTimeout(..., 3000).
 * 3. 5-minute memory caching (staleTime: 300,000ms) with zero background polling.
 * 4. Zero retries on failure (never saturates network).
 * 5. Eliminates heavy external query client bundle overhead from critical path.
 */
export function useHealth() {
  const [data, setData] = useState<HealthData>(cachedHealth || DEFAULT_HEALTH)
  const [isLoading, setIsLoading] = useState<boolean>(!cachedHealth)
  const [isError, setIsError] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    const now = Date.now()
    if (cachedHealth && now - cachedTimestamp < CACHE_TTL_MS) {
      setData(cachedHealth)
      setIsLoading(false)
      return
    }

    let idleId: number | undefined
    let timeoutId: number | undefined
    const INTERACTION_EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const win = typeof window !== 'undefined' ? (window as any) : null

    const executeFetch = async () => {
      cleanup()
      if (!isMounted) return

      try {
        if (!activeFetchPromise) {
          activeFetchPromise = fetchHealth()
        }
        const result = await activeFetchPromise
        cachedHealth = result
        cachedTimestamp = Date.now()
        activeFetchPromise = null
        if (isMounted) {
          setData(result)
          setIsLoading(false)
        }
      } catch {
        activeFetchPromise = null
        if (isMounted) {
          setIsError(true)
          setIsLoading(false)
        }
      }
    }

    const cleanup = () => {
      INTERACTION_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, executeFetch)
      })
      if (idleId !== undefined && win && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }

    INTERACTION_EVENTS.forEach((evt) => {
      window.addEventListener(evt, executeFetch, { once: true, passive: true })
    })

    const scheduleAfterInteractive = () => {
      if (win && typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(executeFetch, { timeout: 3000 })
      } else {
        timeoutId = window.setTimeout(executeFetch, 3000)
      }
    }

    if (document.readyState === 'complete') {
      scheduleAfterInteractive()
    } else {
      window.addEventListener('load', scheduleAfterInteractive, { once: true })
    }

    return () => {
      isMounted = false
      cleanup()
    }
  }, [])

  return { data, isLoading, isError }
}
