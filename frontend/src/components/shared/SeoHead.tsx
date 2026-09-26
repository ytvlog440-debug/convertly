import * as React from 'react'

export interface SeoBreadcrumb {
  name: string
  item: string
}

export interface SeoFaq {
  question: string
  answer: string
}

export interface SeoHowToStep {
  number: number
  title: string
  desc: string
}

export type SeoPageType = 'WebApplication' | 'CollectionPage' | 'WebPage' | 'HomePage'

export interface SeoHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  pageType?: SeoPageType
  breadcrumbs?: SeoBreadcrumb[]
  faqs?: SeoFaq[]
  howToSteps?: SeoHowToStep[]
  toolName?: string
  toolCategory?: string
  schemaJson?: Record<string, unknown> | Record<string, unknown>[]
  noindex?: boolean
  ogImage?: string
  ogType?: 'website' | 'article'
}

const BASE_DOMAIN = 'https://convertlytools.xyz'
const DEFAULT_OG_IMAGE = `${BASE_DOMAIN}/og-image.png`
const LOGO_IMAGE = `${BASE_DOMAIN}/icon.svg`

/**
 * Normalizes any URL into a strict, secure, absolute canonical URL:
 * - Forces HTTPS protocol
 * - Normalizes domain to convertlytools.xyz
 * - Strips query parameters (?utm=..., ?ref=..., ?search=...)
 * - Strips hash fragments
 * - Strips trailing slashes (except root domain)
 */
export function normalizeCanonicalUrl(inputUrl?: string): string {
  try {
    let raw = inputUrl
    if (!raw && typeof window !== 'undefined') {
      raw = window.location.pathname
    }
    if (!raw) {
      return BASE_DOMAIN
    }

    // If relative path provided
    if (raw.startsWith('/')) {
      raw = `${BASE_DOMAIN}${raw}`
    }

    const parsed = new URL(raw, BASE_DOMAIN)
    let cleanPath = parsed.pathname.toLowerCase()

    // Normalize multiple slashes to single
    cleanPath = cleanPath.replace(/\/+/g, '/')

    // Strip trailing slash unless it's just root '/'
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1)
    }

    if (cleanPath === '/') {
      return BASE_DOMAIN
    }

    return `${BASE_DOMAIN}${cleanPath}`
  } catch {
    return BASE_DOMAIN
  }
}

export function SeoHead({
  title = 'Convertly | Free Online PDF, Word, Excel, PowerPoint & Image Converter',
  description = 'High-performance, secure and free file conversion SaaS. Convert PDF, Word, Excel, PowerPoint, and images with 120-minute temporary file retention.',
  keywords = 'pdf to word, word to pdf, merge pdf, compress pdf, excel to pdf, ppt to pdf, image to pdf, pdf converter online, free pdf tools, convertly',
  canonicalUrl,
  pageType,
  breadcrumbs,
  faqs,
  howToSteps,
  toolName,
  toolCategory,
  schemaJson,
  noindex = false,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
}: SeoHeadProps) {
  React.useEffect(() => {
    // 1. Ensure HTML root language is set
    if (document.documentElement.lang !== 'en') {
      document.documentElement.lang = 'en'
    }

    // 2. Page Title
    if (document.title !== title) {
      document.title = title
    }

    // Helper to safely set, update, or deduplicate meta tags without redundant DOM writes
    const setMeta = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
      const existing = document.querySelectorAll(`meta[${attributeName}="${attributeValue}"]`)
      if (existing.length > 1) {
        // Remove duplicates if any were injected previously
        for (let i = 1; i < existing.length; i++) {
          existing[i].remove()
        }
      }
      let el = existing[0] as HTMLMetaElement | undefined
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attributeName, attributeValue)
        el.setAttribute('content', content)
        document.head.appendChild(el)
        return
      }
      if (el.getAttribute('content') !== content) {
        el.setAttribute('content', content)
      }
    }

    // 3. Absolute Canonical URL Normalization
    const cleanCanonical = normalizeCanonicalUrl(canonicalUrl)
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      canonical.setAttribute('href', cleanCanonical)
      document.head.appendChild(canonical)
    } else if (canonical.getAttribute('href') !== cleanCanonical) {
      canonical.setAttribute('href', cleanCanonical)
    }

    // 4. Standard Directives & Metadata
    setMeta('name', 'description', description)
    if (keywords) setMeta('name', 'keywords', keywords)
    setMeta('name', 'author', 'Convertly Document Engineering Team')
    setMeta('name', 'publisher', 'Convertly')
    setMeta('name', 'theme-color', '#4f46e5')

    const robotsDirective = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    setMeta('name', 'robots', robotsDirective)
    setMeta('name', 'googlebot', robotsDirective)
    setMeta('name', 'bingbot', robotsDirective)

    // 5. OpenGraph Metadata (Facebook, LinkedIn, Discord, Slack)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:site_name', 'Convertly')
    setMeta('property', 'og:locale', 'en_US')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', cleanCanonical)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('property', 'og:image:type', 'image/png')
    setMeta('property', 'og:image:alt', title)

    // 6. Twitter Card Metadata
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:site', '@convertlytools')
    setMeta('name', 'twitter:creator', '@convertlytools')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)

    // 7. Dynamic JSON-LD Graph Generation
    const graph: Record<string, unknown>[] = []

    // A. Base Organization Schema with Logo
    graph.push({
      '@type': 'Organization',
      '@id': `${BASE_DOMAIN}/#organization`,
      name: 'Convertly',
      url: BASE_DOMAIN,
      logo: {
        '@type': 'ImageObject',
        '@id': `${BASE_DOMAIN}/#logo`,
        url: LOGO_IMAGE,
        caption: 'Convertly Logo',
      },
      knowsAbout: [
        'https://en.wikipedia.org/wiki/PDF',
        'https://en.wikipedia.org/wiki/Microsoft_Word',
        'https://en.wikipedia.org/wiki/Data_compression',
        'https://en.wikipedia.org/wiki/Optical_character_recognition',
        'https://en.wikipedia.org/wiki/Computer_security',
        'https://en.wikipedia.org/wiki/Information_privacy',
      ],
    })

    // B. Base WebSite Schema with SearchAction
    graph.push({
      '@type': 'WebSite',
      '@id': `${BASE_DOMAIN}/#website`,
      url: BASE_DOMAIN,
      name: 'Convertly',
      description: 'Free online PDF, Office, and image conversion suite with 120-minute temporary file retention.',
      publisher: {
        '@id': `${BASE_DOMAIN}/#organization`,
      },
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_DOMAIN}/tools?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    })

    // C. SiteNavigationElement Schema
    graph.push({
      '@type': 'SiteNavigationElement',
      '@id': `${BASE_DOMAIN}/#navigation`,
      name: 'Convertly Primary Navigation',
      hasPart: [
        { '@type': 'WebPage', name: 'All Tools', url: `${BASE_DOMAIN}/tools` },
        { '@type': 'WebPage', name: 'PDF Suite', url: `${BASE_DOMAIN}/tools?category=pdf` },
        { '@type': 'WebPage', name: 'Office ⇄ PDF', url: `${BASE_DOMAIN}/tools?category=office` },
        { '@type': 'WebPage', name: 'Image Suite', url: `${BASE_DOMAIN}/tools?category=images` },
      ],
    })

    // D. Page-Specific Schema
    const determinedType = pageType || (toolName ? 'WebApplication' : cleanCanonical === BASE_DOMAIN ? 'HomePage' : 'WebPage')
    const appName = toolName || (title.includes('—') ? title.split('—')[0].trim() : 'Convertly')

    if (determinedType === 'WebApplication') {
      graph.push({
        '@type': 'WebApplication',
        '@id': `${cleanCanonical}/#app`,
        name: appName,
        alternateName: `Convertly ${appName}`,
        url: cleanCanonical,
        inLanguage: 'en-US',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        softwareVersion: '2.0.0',
        isPartOf: {
          '@id': `${BASE_DOMAIN}/#website`,
        },
        creator: {
          '@id': `${BASE_DOMAIN}/#organization`,
        },
        publisher: {
          '@id': `${BASE_DOMAIN}/#organization`,
        },
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        featureList: [
          'Document Conversion Fidelity',
          'Automated 120-Minute Temporary File Deletion',
          'Smart OCR for Scanned Documents',
          'In-Browser Live Document Preview',
          'Smartphone QR Direct File Transfer',
          'No File Limits and No Watermarks',
        ],
        about: [
          {
            '@type': 'Thing',
            name: 'Document conversion',
            sameAs: 'https://en.wikipedia.org/wiki/Data_conversion',
          },
          ...(toolName?.toLowerCase().includes('pdf') || toolCategory === 'PDF' ? [{
            '@type': 'Thing',
            name: 'Portable Document Format',
            sameAs: 'https://en.wikipedia.org/wiki/PDF',
          }] : []),
          ...(toolName?.toLowerCase().includes('word') || toolName?.toLowerCase().includes('docx') ? [{
            '@type': 'Thing',
            name: 'Microsoft Word',
            sameAs: 'https://en.wikipedia.org/wiki/Microsoft_Word',
          }] : []),
          ...(toolName?.toLowerCase().includes('excel') ? [{
            '@type': 'Thing',
            name: 'Microsoft Excel',
            sameAs: 'https://en.wikipedia.org/wiki/Microsoft_Excel',
          }] : []),
          ...(toolName?.toLowerCase().includes('image') || toolCategory === 'Images' ? [{
            '@type': 'Thing',
            name: 'Image file format',
            sameAs: 'https://en.wikipedia.org/wiki/Image_file_format',
          }] : []),
        ],
      })
    } else if (determinedType === 'CollectionPage') {
      graph.push({
        '@type': 'CollectionPage',
        '@id': `${cleanCanonical}/#collection`,
        url: cleanCanonical,
        name: title,
        description: description,
        isPartOf: {
          '@id': `${BASE_DOMAIN}/#website`,
        },
        about: {
          '@id': `${BASE_DOMAIN}/#organization`,
        },
      })
    } else if (determinedType === 'WebPage') {
      graph.push({
        '@type': 'WebPage',
        '@id': `${cleanCanonical}/#webpage`,
        url: cleanCanonical,
        name: title,
        description: description,
        inLanguage: 'en-US',
        isPartOf: {
          '@id': `${BASE_DOMAIN}/#website`,
        },
        publisher: {
          '@id': `${BASE_DOMAIN}/#organization`,
        },
      })
    }

    // E. BreadcrumbList Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${cleanCanonical}/#breadcrumb`,
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: normalizeCanonicalUrl(b.item),
        })),
      })
    }

    // F. HowTo Schema (Step-by-Step Tool Instructions)
    if (howToSteps && howToSteps.length > 0) {
      graph.push({
        '@type': 'HowTo',
        '@id': `${cleanCanonical}/#howto`,
        name: `How to convert files with ${appName}`,
        description: `Follow these quick steps to convert and optimize your documents using Convertly's secure online engine.`,
        step: howToSteps.map((s) => ({
          '@type': 'HowToStep',
          position: s.number,
          name: s.title,
          text: s.desc,
          url: `${cleanCanonical}#step-${s.number}`,
        })),
      })
    }

    // G. FAQPage Schema — STRICT RULE: Only output if page contains visible FAQ content!
    if (faqs && faqs.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${cleanCanonical}/#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      })
    }

    // H. Custom Extra Schemas (if passed)
    if (schemaJson) {
      if (Array.isArray(schemaJson)) {
        graph.push(...schemaJson)
      } else {
        graph.push(schemaJson)
      }
    }

    // Inject Idempotent JSON-LD Script Tag
    const scriptId = 'convertly-schema-jsonld'
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = scriptId
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }

    const structuredDataPayload = {
      '@context': 'https://schema.org',
      '@graph': graph,
    }

    const payloadJson = JSON.stringify(structuredDataPayload)
    if (scriptTag.text !== payloadJson) {
      scriptTag.text = payloadJson
    }
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    pageType,
    breadcrumbs,
    faqs,
    howToSteps,
    toolName,
    schemaJson,
    noindex,
    ogImage,
    ogType,
  ])

  return null
}

export default SeoHead
