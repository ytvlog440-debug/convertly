/**
 * @file clarity.ts
 * @description Enterprise-grade Microsoft Clarity integration utility for Convertly.
 * 
 * Features:
 * - Production-only initialization (strictly isolates dev, staging, and localhost environments)
 * - Guaranteed single-initialization (idempotent guard prevents duplicate scripts/sessions)
 * - Asynchronous, non-blocking lazy loading (utilizes requestIdleCallback / deferred bootstrap)
 * - SPA Route Tracking (synchronizes virtual navigation with Clarity recordings and heatmaps)
 * - Strict Privacy & Zero PII compliance (sanitization of custom tags, respects DNT / GPC)
 * - Full compatibility with future Consent Management Platforms (CMP / GDPR / CCPA)
 * - Independent and fully compatible with existing Google Analytics 4 (GA4) integration
 * - Comprehensive TypeScript definitions and type safety
 */

import { isProductionEnvironment, isPrivacyDNTActive } from './analytics'

/**
 * Microsoft Clarity Project ID for Convertly
 * Production ID: yh51dttlog
 */
export const CLARITY_PROJECT_ID: string =
  (import.meta.env.VITE_CLARITY_PROJECT_ID as string) || 'yh51dttlog'

/**
 * TypeScript interface augmentation for the global window object.
 * Provides type-safe access to the Microsoft Clarity tracking API.
 */
declare global {
  interface Window {
    clarity?: {
      /**
       * Set custom tags or dimensions (e.g. page paths, user role, environment)
       */
      (command: 'set', key: string, value: string | string[]): void

      /**
       * Identify a specific user or session
       */
      (
        command: 'identify',
        customId: string,
        customSessionId?: string,
        customPageId?: string,
        friendlyName?: string
      ): void

      /**
       * Informs Clarity of user cookie/tracking consent
       */
      (command: 'consent', consent?: boolean): void

      /**
       * Record custom user interaction events
       */
      (command: 'event', eventName: string): void

      /**
       * Upgrade a session for prioritized recording retention
       */
      (command: 'upgrade', reason: string): void

      /**
       * Fallback call signature for generic Clarity API commands
       */
      (...args: unknown[]): void

      /**
       * Command queue before the Clarity script is fully executed
       */
      q?: unknown[][]

      /**
       * Version identifier populated by the Clarity script
       */
      v?: string
    }
  }
}

// Module-level state tracking
let isClarityInitialized = false
let isClarityReady = false
const pendingClarityActions: Array<() => void> = []

/**
 * Checks whether the Microsoft Clarity library has been initialized and is active.
 */
export const isClarityLoaded = (): boolean => {
  return isClarityReady && typeof window !== 'undefined' && typeof window.clarity === 'function'
}

/**
 * Sanitizes tag keys and values to prevent accidental transmission of PII,
 * credentials, URLs with query tokens, or local file system paths.
 */
export const sanitizeClarityTagValue = (value: string): string => {
  if (!value) return ''
  return value
    .slice(0, 100) // Bound length to prevent payload bloat
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-email]')
    .replace(/([a-zA-Z]:\\[^\s]+|\/[^\s]+)/g, '[redacted-path]')
}

/**
 * Queues an action if Clarity has not yet finished loading,
 * or executes it immediately if the script is active.
 */
const queueOrExecuteClarityAction = (action: () => void): void => {
  if (typeof window === 'undefined') return

  if (isClarityReady && typeof window.clarity === 'function') {
    try {
      action()
    } catch (err) {
      console.warn('[Convertly Clarity] Execution error:', err)
    }
  } else {
    pendingClarityActions.push(action)
  }
}

/**
 * Flushes all pending actions after the Clarity script has loaded.
 */
const flushClarityQueue = (): void => {
  while (pendingClarityActions.length > 0) {
    const action = pendingClarityActions.shift()
    try {
      action?.()
    } catch (err) {
      console.warn('[Convertly Clarity] Queue flush error:', err)
    }
  }
}

/**
 * Checks whether Microsoft Clarity should be initialized and active.
 * Strict production check: loads only in production builds on non-local hostnames.
 * Supports explicit developer verification query '?clarity_debug=true' or localStorage 'CLARITY_DEBUG=true'.
 */
export const shouldLoadClarity = (): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const searchParams = new URLSearchParams(window.location.search)
    if (
      searchParams.get('clarity_debug') === 'true' ||
      window.localStorage?.getItem('CLARITY_DEBUG') === 'true'
    ) {
      return true
    }
  } catch {
    // Ignore URL/storage access errors in restricted contexts
  }

  return isProductionEnvironment()
}

/**
 * Initializes Microsoft Clarity session recording and heatmaps.
 * 
 * Rules:
 * 1. Only loads in production environments (protects dev and local tests from noise).
 * 2. Never initializes more than once (idempotent guard protects DOM and memory).
 * 3. Respects Do Not Track (DNT) and Global Privacy Control (GPC) signals.
 * 4. Defers script injection via requestIdleCallback to keep hydration and FCP fast.
 * 5. Loads asynchronously without blocking DOM parsing or application rendering.
 * 
 * @param customProjectId Optional custom Project ID override (defaults to CLARITY_PROJECT_ID)
 */
export const initClarity = (customProjectId?: string): void => {
  // Ensure we are in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Idempotency: prevent double initialization
  if (isClarityInitialized || document.getElementById('microsoft-clarity')) {
    return
  }

  // Strict production check: never record in development or preview environments unless explicitly debugging
  if (!shouldLoadClarity()) {
    if (import.meta.env.DEV) {
      console.debug('[Convertly Clarity] Skipped initialization: Non-production environment.')
    }
    return
  }

  // Honor user privacy preferences (DNT / GPC)
  if (isPrivacyDNTActive()) {
    console.info('[Convertly Clarity] Tracking disabled: Do Not Track (DNT) signal detected.')
    return
  }

  const projectId = customProjectId || CLARITY_PROJECT_ID

  if (!projectId) {
    console.warn('[Convertly Clarity] Initialization skipped: Missing Project ID.')
    return
  }

  isClarityInitialized = true

  /**
   * Inject Clarity tracking snippet asynchronously.
   * Standard Microsoft Clarity asynchronous bootstrap snippet.
   */
  const injectClarityScript = (): void => {
    try {
      // Define the Clarity command queue before the external script finishes downloading
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const win = window as any
      win.clarity =
        win.clarity ||
        function () {
          ;(win.clarity.q = win.clarity.q || []).push(arguments)
        }
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const scriptElement = document.createElement('script')
      scriptElement.id = 'microsoft-clarity'
      scriptElement.type = 'text/javascript'
      scriptElement.async = true
      scriptElement.src = `https://www.clarity.ms/tag/${projectId}`
      scriptElement.crossOrigin = 'anonymous'

      scriptElement.onload = () => {
        isClarityReady = true
        flushClarityQueue()
      }

      scriptElement.onerror = (err) => {
        console.warn('[Convertly Clarity] Failed to load Microsoft Clarity script:', err)
      }

      // Append script safely to document head or before the first script
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(scriptElement, firstScript)
      } else {
        document.head.appendChild(scriptElement)
      }
    } catch (err) {
      console.warn('[Convertly Clarity] Error during script injection:', err)
    }
  }

  // Use requestIdleCallback so initial page rendering and hydration complete with zero friction
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(injectClarityScript, { timeout: 2500 })
  } else {
    setTimeout(injectClarityScript, 1000)
  }
}

/**
 * Tracks single-page application (SPA) route changes in Microsoft Clarity.
 * 
 * Microsoft Clarity monitors DOM changes and URL history events. Calling this
 * function informs Clarity explicitly of virtual page changes, ensuring
 * recordings, heatmaps, and funnel analytics segment correctly by route.
 * 
 * @param path Current URL path + search (e.g. '/tools/pdf-to-word')
 * @param title Optional document title of the active page
 */
export const trackClarityNavigation = (path: string, title?: string): void => {
  if (typeof window === 'undefined') return

  const cleanPath = path || window.location.pathname + window.location.search
  const cleanTitle = title || document.title

  if (!shouldLoadClarity()) {
    if (import.meta.env.DEV) {
      console.debug('%c[Convertly Clarity Navigation]', 'color: #0284c7; font-weight: bold;', {
        page: cleanPath,
        title: cleanTitle,
      })
    }
    return
  }

  if (isPrivacyDNTActive()) return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      // Set the active virtual page path
      window.clarity('set', 'page', cleanPath)

      // Set the page title metadata if provided
      if (cleanTitle) {
        window.clarity('set', 'page_title', sanitizeClarityTagValue(cleanTitle))
      }

      // Record a navigation event for Clarity funnel filtering
      window.clarity('event', 'spa_navigation')
    }
  })
}

/**
 * Logs a custom event in Microsoft Clarity for session filtering and analytics.
 * 
 * @param eventName Identifier of the action (e.g. 'conversion_started', 'download_completed')
 */
export const trackClarityEvent = (eventName: string): void => {
  if (typeof window === 'undefined') return

  const safeEventName = eventName.trim().slice(0, 50)

  if (!shouldLoadClarity()) {
    if (import.meta.env.DEV) {
      console.debug(`%c[Convertly Clarity Event: ${safeEventName}]`, 'color: #0284c7; font-weight: bold;')
    }
    return
  }

  if (isPrivacyDNTActive()) return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('event', safeEventName)
    }
  })
}

/**
 * Sets a custom tag (dimension) in Microsoft Clarity to filter sessions and heatmaps.
 * 
 * @param key Dimension key (e.g. 'tool_name', 'input_format')
 * @param value Dimension value (e.g. 'pdf-to-word', 'pdf')
 */
export const setClarityTag = (key: string, value: string | string[]): void => {
  if (typeof window === 'undefined') return

  const safeKey = key.trim().slice(0, 50)
  const safeValue = Array.isArray(value)
    ? value.map((v) => sanitizeClarityTagValue(String(v)))
    : sanitizeClarityTagValue(String(value))

  if (!shouldLoadClarity()) {
    if (import.meta.env.DEV) {
      console.debug(`%c[Convertly Clarity Tag] ${safeKey}:`, 'color: #0284c7;', safeValue)
    }
    return
  }

  if (isPrivacyDNTActive()) return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('set', safeKey, safeValue)
    }
  })
}

/**
 * Identifies a user or session pseudonymously without exposing sensitive PII.
 * 
 * @param customId Pseudonymous identifier (e.g. hashed user id)
 * @param customSessionId Optional session identifier
 * @param customPageId Optional page identifier
 * @param friendlyName Optional label (never use raw personal data)
 */
export const identifyClarityUser = (
  customId: string,
  customSessionId?: string,
  customPageId?: string,
  friendlyName?: string
): void => {
  if (typeof window === 'undefined') return

  if (!shouldLoadClarity() || isPrivacyDNTActive()) return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('identify', customId, customSessionId, customPageId, friendlyName)
    }
  })
}

/**
 * Consent management compatibility: notifies Microsoft Clarity whether user has
 * granted or denied cookie/tracking consent.
 * 
 * Calling this with `false` or `true` ensures seamless integration with any
 * Consent Management Platform (CMP), GDPR banner, or cookie preference modal.
 * 
 * @param consentGranted Boolean indicating if user has granted consent
 */
export const setClarityConsent = (consentGranted: boolean): void => {
  if (typeof window === 'undefined') return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('consent', consentGranted)
    }
  })
}

/**
 * Upgrades the current Clarity session to ensure the recording is prioritized and retained.
 * Useful when critical interactions or errors occur.
 * 
 * @param reason Descriptive reason for session upgrade (e.g. 'conversion_error', 'checkout_reached')
 */
export const upgradeClaritySession = (reason: string): void => {
  if (typeof window === 'undefined') return

  const safeReason = reason.trim().slice(0, 50)

  if (!shouldLoadClarity() || isPrivacyDNTActive()) return

  queueOrExecuteClarityAction(() => {
    if (typeof window.clarity === 'function') {
      window.clarity('upgrade', safeReason)
    }
  })
}
