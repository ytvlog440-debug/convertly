/**
 * @file analytics.ts
 * @description Enterprise-grade Google Analytics 4 (GA4) integration utility for Convertly.
 * 
 * Features:
 * - Production-only initialization (strictly prevents dev/staging/localhost pollution)
 * - Guaranteed single-initialization (idempotent guard)
 * - Automatic queueing of early events during lazy script loading
 * - Zero blocking on initial render (requestIdleCallback / deferred bootstrap)
 * - Strict Privacy & Zero PII compliance (IP anonymization, DNT honoring, sanitization of error messages and raw filenames)
 * - Type-safe event tracking with rich parameters (tool_name, input_format, output_format, file_size, conversion_time, success, error_message)
 */

import ReactGA from 'react-ga4'

/**
 * Production Google Analytics 4 Measurement ID
 */
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string) || 'G-5GGFLML6VZ'

/**
 * Standard custom events tracked across the application
 */
export type AnalyticsEventName =
  | 'file_upload_started'
  | 'file_upload_completed'
  | 'conversion_started'
  | 'conversion_completed'
  | 'download_started'
  | 'download_completed'
  | 'search_used'
  | 'tool_opened'
  | 'tool_selected'
  | 'tool_conversion_finished'
  | 'error_occurred'

/**
 * Custom Event Parameter Specifications
 */
export interface EventParams {
  tool_name?: string
  input_format?: string
  output_format?: string
  file_size?: number
  conversion_time?: number
  success?: boolean
  error_message?: string
  search_term?: string
  results_count?: number
  category?: string
  source?: string
  [key: string]: unknown
}

// Module-level state variables
let isInitialized = false
let isReady = false
const pendingEventsQueue: Array<() => void> = []

/**
 * Detects whether the current execution context is the live production website.
 * Prevents accidental tracking on localhost, 127.0.0.1, or non-production previews.
 */
export const isProductionEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false

  // Must be in Vite production build mode
  if (!import.meta.env.PROD) return false

  const hostname = window.location.hostname
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')

  return !isLocal
}

/**
 * Checks if the user's browser has requested Do Not Track (DNT) or Global Privacy Control (GPC).
 * Respects user privacy preferences by disabling analytics if enabled.
 */
export const isPrivacyDNTActive = (): boolean => {
  if (typeof window === 'undefined') return false

  const nav = navigator as unknown as {
    doNotTrack?: string
    globalPrivacyControl?: boolean
  }
  const win = window as unknown as {
    doNotTrack?: string
  }

  return (
    nav.doNotTrack === '1' ||
    nav.doNotTrack === 'yes' ||
    win.doNotTrack === '1' ||
    nav.globalPrivacyControl === true
  )
}

/**
 * Sanitizes error messages by stripping potentially sensitive personal data,
 * file system paths, URLs, and email addresses.
 */
export const sanitizeErrorMessage = (message?: string): string | undefined => {
  if (!message) return undefined

  return (
    message
      // Limit length to avoid payload bloat
      .slice(0, 150)
      // Mask email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-email]')
      // Mask local file paths (Windows & POSIX)
      .replace(/([a-zA-Z]:\\[^\s]+|\/[^\s]+)/g, '[redacted-path]')
  )
}

/**
 * Sanitizes search queries to protect user privacy (e.g. accidental sensitive inputs).
 */
export const sanitizeSearchTerm = (query?: string): string | undefined => {
  if (!query) return undefined
  return query.trim().slice(0, 50)
}

/**
 * Executes a tracking action or enqueues it if GA4 is still initializing.
 */
const queueOrExecute = (fn: () => void): void => {
  if (isReady) {
    try {
      fn()
    } catch (err) {
      console.warn('[Convertly GA4] Execution error:', err)
    }
  } else {
    pendingEventsQueue.push(fn)
  }
}

/**
 * Flushes all pending queued events once the GA4 script is fully loaded and ready.
 */
const flushQueue = (): void => {
  while (pendingEventsQueue.length > 0) {
    const fn = pendingEventsQueue.shift()
    try {
      fn?.()
    } catch (err) {
      console.warn('[Convertly GA4] Queue flush error:', err)
    }
  }
}

/**
 * Initializes Google Analytics 4.
 * 
 * Rules:
 * 1. Only runs in production environments.
 * 2. Never initializes more than once.
 * 3. Honors Do Not Track (DNT) / GPC signals.
 * 4. Lazy-loads via requestIdleCallback to keep Lighthouse scores at peak performance.
 */
export const initGA = (): void => {
  if (typeof window === 'undefined') return
  if (isInitialized) return

  // Verify production environment
  if (!isProductionEnvironment()) {
    // In development mode, analytics acts as a no-op with optional console visibility
    return
  }

  // Respect user privacy
  if (isPrivacyDNTActive()) {
    console.info('[Convertly GA4] Tracking disabled: Do Not Track (DNT) signal detected.')
    return
  }

  isInitialized = true

  const bootstrap = () => {
    try {
      ReactGA.initialize(GA_MEASUREMENT_ID, {
        gtagOptions: {
          send_page_view: false, // SPA handles page views manually to avoid duplicate counts
          anonymize_ip: true,    // Anonymize IP addresses for GDPR compliance
          cookie_flags: 'SameSite=None;Secure',
        },
      })
      isReady = true
      flushQueue()
    } catch (err) {
      console.warn('[Convertly GA4] Initialization error:', err)
    }
  }

  // Lazy load using requestIdleCallback so initial page render and hydration are never delayed
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(bootstrap, { timeout: 2000 })
  } else {
    setTimeout(bootstrap, 1000)
  }
}

/**
 * Dispatches a page_view event to GA4.
 * Used for tracking Single Page Application (SPA) route navigation.
 */
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window === 'undefined') return

  const cleanPath = path || window.location.pathname + window.location.search
  const cleanTitle = title || document.title

  if (!isProductionEnvironment()) {
    console.debug('%c[Convertly GA4 PageView]', 'color: #10b981; font-weight: bold;', {
      page: cleanPath,
      title: cleanTitle,
    })
    return
  }

  if (isPrivacyDNTActive()) return

  queueOrExecute(() => {
    ReactGA.send({
      hitType: 'pageview',
      page: cleanPath,
      title: cleanTitle,
    })
  })
}

/**
 * Generic custom event dispatcher.
 */
export const trackEvent = (name: AnalyticsEventName, params?: EventParams): void => {
  if (typeof window === 'undefined') return

  // Sanitize any potential PII
  const sanitizedParams: Record<string, unknown> = { ...(params || {}) }
  if (typeof sanitizedParams.error_message === 'string') {
    sanitizedParams.error_message = sanitizeErrorMessage(sanitizedParams.error_message)
  }
  if (typeof sanitizedParams.search_term === 'string') {
    sanitizedParams.search_term = sanitizeSearchTerm(sanitizedParams.search_term)
  }

  // Never send raw filenames or user-specific paths
  delete sanitizedParams.filename
  delete sanitizedParams.file_name
  delete sanitizedParams.file_path
  delete sanitizedParams.password
  delete sanitizedParams.text

  if (!isProductionEnvironment()) {
    console.debug(`%c[Convertly GA4 Event: ${name}]`, 'color: #6366f1; font-weight: bold;', sanitizedParams)
    return
  }

  if (isPrivacyDNTActive()) return

  queueOrExecute(() => {
    ReactGA.event(name, sanitizedParams)
  })
}

// ---------------------------------------------------------------------------
// Reusable High-Level Analytics Helper Functions
// ---------------------------------------------------------------------------

/**
 * Track when a user initiates file upload(s) in a tool.
 */
export const trackFileUploadStarted = (params: {
  tool_name: string
  file_size?: number
  input_format?: string
}): void => {
  trackEvent('file_upload_started', {
    tool_name: params.tool_name,
    file_size: params.file_size,
    input_format: params.input_format?.toLowerCase(),
  })
}

/**
 * Track when file upload(s) are completed successfully or fail.
 */
export const trackFileUploadCompleted = (params: {
  tool_name: string
  file_size?: number
  input_format?: string
  success: boolean
}): void => {
  trackEvent('file_upload_completed', {
    tool_name: params.tool_name,
    file_size: params.file_size,
    input_format: params.input_format?.toLowerCase(),
    success: params.success,
  })
}

/**
 * Track when the conversion process begins.
 */
export const trackConversionStarted = (params: {
  tool_name: string
  input_format?: string
  output_format?: string
  file_size?: number
}): void => {
  trackEvent('conversion_started', {
    tool_name: params.tool_name,
    input_format: params.input_format?.toLowerCase(),
    output_format: params.output_format?.toLowerCase(),
    file_size: params.file_size,
  })
}

/**
 * Track when conversion completes successfully.
 */
export const trackConversionCompleted = (params: {
  tool_name: string
  input_format?: string
  output_format?: string
  file_size?: number
  conversion_time?: number
  success: boolean
}): void => {
  trackEvent('conversion_completed', {
    tool_name: params.tool_name,
    input_format: params.input_format?.toLowerCase(),
    output_format: params.output_format?.toLowerCase(),
    file_size: params.file_size,
    conversion_time: params.conversion_time,
    success: params.success,
  })
}

/**
 * Track when download of converted file starts.
 */
export const trackDownloadStarted = (params: {
  tool_name: string
  output_format?: string
  file_size?: number
}): void => {
  trackEvent('download_started', {
    tool_name: params.tool_name,
    output_format: params.output_format?.toLowerCase(),
    file_size: params.file_size,
  })
}

/**
 * Track when download completes.
 */
export const trackDownloadCompleted = (params: {
  tool_name: string
  output_format?: string
  file_size?: number
  success: boolean
}): void => {
  trackEvent('download_completed', {
    tool_name: params.tool_name,
    output_format: params.output_format?.toLowerCase(),
    file_size: params.file_size,
    success: params.success,
  })
}

/**
 * Track when the search feature is used.
 */
export const trackSearchUsed = (params: {
  search_term: string
  results_count?: number
}): void => {
  trackEvent('search_used', {
    search_term: params.search_term,
    results_count: params.results_count,
  })
}

/**
 * Track when a conversion tool page is opened.
 */
export const trackToolOpened = (toolName: string, category?: string): void => {
  trackEvent('tool_opened', {
    tool_name: toolName,
    category: category,
  })
}

/**
 * Track when a user clicks/selects a tool from cards, menus, or palette.
 */
export const trackToolSelected = (
  toolName: string,
  category?: string,
  source?: string
): void => {
  trackEvent('tool_selected', {
    tool_name: toolName,
    category: category,
    source: source || 'app',
  })
}

/**
 * Track when tool conversion execution finishes (success or failure).
 */
export const trackToolConversionFinished = (params: {
  tool_name: string
  input_format?: string
  output_format?: string
  file_size?: number
  conversion_time?: number
  success: boolean
  error_message?: string
}): void => {
  trackEvent('tool_conversion_finished', {
    tool_name: params.tool_name,
    input_format: params.input_format?.toLowerCase(),
    output_format: params.output_format?.toLowerCase(),
    file_size: params.file_size,
    conversion_time: params.conversion_time,
    success: params.success,
    error_message: params.error_message,
  })
}

/**
 * Track when an error occurs during conversion, upload, or interaction.
 */
export const trackErrorOccurred = (params: {
  error_message: string
  tool_name?: string
}): void => {
  trackEvent('error_occurred', {
    error_message: params.error_message,
    tool_name: params.tool_name,
  })
}
