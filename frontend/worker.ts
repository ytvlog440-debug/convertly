export interface Env {
  ASSETS: {
    fetch: (request: Request | string) => Promise<Response>
  }
  BACKEND_API_URL?: string
}

export const CONVERT_REDIRECTS: Record<string, string> = {
  '/convert/pdf-to-word': '/tools/pdf-to-word',
  '/convert/pdf-to-word-online': '/tools/pdf-to-word',
  '/convert/pdf-to-word-free': '/tools/pdf-to-word',
  '/convert/pdf-to-word-windows': '/tools/pdf-to-word',
  '/convert/pdf-to-word-mac': '/tools/pdf-to-word',
  '/convert/pdf-to-word-mobile': '/tools/pdf-to-word',
  '/convert/word-to-pdf': '/tools/word-to-pdf',
  '/convert/merge-pdf-online': '/tools/pdf-merge',
  '/convert/compress-pdf-online': '/tools/pdf-compress',
  '/convert/convert-pdf-without-losing-formatting': '/guides/how-to-convert-pdf-to-word-without-losing-formatting',
  '/convert/convert-jpg-to-png': '/tools/jpg-to-png',
  '/convert/convert-image-to-pdf': '/tools/images-to-pdf',
}

const BACKEND_BASE_URL = 'https://convertly-production-285a.up.railway.app'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname

    // 1. API proxy: /api/* -> Railway API
    if (pathname.startsWith('/api/')) {
      const backendBase = env.BACKEND_API_URL || BACKEND_BASE_URL
      const targetUrl = new URL(`${pathname}${url.search}`, backendBase)

      const headers = new Headers(request.headers)
      headers.set('X-Forwarded-Host', url.host)
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''))
      headers.set('X-Convertly-Worker', 'true')

      // Ensure Cloudflare client IP is forwarded
      const clientIp = request.headers.get('cf-connecting-ip')
      if (clientIp) {
        headers.set('CF-Connecting-IP', clientIp)
        // Set X-Forwarded-For to preserve client IP through upstream proxy
        const existingXff = request.headers.get('x-forwarded-for')
        headers.set('X-Forwarded-For', existingXff ? `${existingXff}, ${clientIp}` : clientIp)
      }

      const init: RequestInit = {
        method: request.method,
        headers,
        redirect: 'follow',
      }

      if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
        init.body = request.body
        // @ts-expect-error duplex required in Cloudflare fetch streaming runtimes
        init.duplex = 'half'
      }

      try {
        const response = await fetch(targetUrl.toString(), init)
        return response
      } catch (err: unknown) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Backend proxy error',
            detail: 'Unable to connect to conversion engine backend service.',
          }),
          {
            status: 502,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          }
        )
      }
    }

    // 2. Service worker: /sw.js -> Real 404 (service worker intentionally removed)
    if (pathname === '/sw.js') {
      return new Response('No service worker registered', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    // 3. Asset route: /assets/* -> Real 404 if missing, never fall back to index.html
    if (pathname.startsWith('/assets/')) {
      const assetRes = await env.ASSETS.fetch(request)
      if (assetRes.status === 404 || assetRes.status >= 400) {
        return new Response('Asset not found', {
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      }
      return assetRes
    }

    // 4. SEO 301 Permanent Redirects: Consolidate legacy /convert/* landing pages
    // Redirects occur BEFORE env.ASSETS.fetch(), SPA fallback, and React routing
    const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
    const redirectTarget = CONVERT_REDIRECTS[cleanPath.toLowerCase()]
    if (redirectTarget) {
      const destinationUrl = new URL(`${redirectTarget}${url.search}`, request.url)
      return new Response(null, {
        status: 301,
        headers: {
          Location: destinationUrl.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // 5. Serve static assets directly (including pre-rendered HTML routes, favicon, robots.txt, etc.)
    const staticResponse = await env.ASSETS.fetch(request)
    if (staticResponse.status !== 404) {
      return staticResponse
    }

    // 6. SPA fallback for legitimate client-side React routes
    // Do NOT fall back for missing files with extensions (.css, .js, .png, etc.) or non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const lastSegment = pathname.split('/').pop() || ''
    if (lastSegment.includes('.') && !lastSegment.endsWith('.html')) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // Rewrite to /index.html for client-side navigation
    const spaRequest = new Request(new URL('/index.html', request.url), request)
    return env.ASSETS.fetch(spaRequest)
  },
}
