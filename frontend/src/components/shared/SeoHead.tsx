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

export interface SeoHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  breadcrumbs?: SeoBreadcrumb[]
  faqs?: SeoFaq[]
  howToSteps?: SeoHowToStep[]
  toolName?: string
  schemaJson?: Record<string, unknown> | Record<string, unknown>[]
  noindex?: boolean
}

const BASE_DOMAIN = 'https://convertlytools.xyz'
const DEFAULT_IMAGE = `${BASE_DOMAIN}/icon.svg`

export function SeoHead({
  title = 'Convertly — Free Online PDF, Office & Image Converter | Fast & Secure',
  description = 'High-performance, secure and free file conversion SaaS. Convert PDF, Word, Excel, PowerPoint, and images with zero data retention.',
  keywords = 'pdf to word, word to pdf, merge pdf, compress pdf, excel to pdf, ppt to pdf, image to pdf, pdf converter online, free pdf tools, convertly',
  canonicalUrl = BASE_DOMAIN,
  breadcrumbs,
  faqs,
  howToSteps,
  toolName,
  schemaJson,
  noindex = false,
}: SeoHeadProps) {
  React.useEffect(() => {
    // 1. Page Title
    document.title = title

    // Helper to safely set/update a meta tag
    const setMeta = (attributeName: 'name' | 'property', attributeValue: string, content: string) => {
      let el = document.querySelector(`meta[${attributeName}="${attributeValue}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attributeName, attributeValue)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // 2. Standard Meta Tags
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

    // 3. Canonical Link Normalization
    // Strip redundant trailing slashes on subpaths (keep single slash for homepage)
    let cleanCanonical = canonicalUrl
    if (cleanCanonical.endsWith('/') && cleanCanonical !== `${BASE_DOMAIN}/` && cleanCanonical !== BASE_DOMAIN) {
      cleanCanonical = cleanCanonical.slice(0, -1)
    }
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', cleanCanonical)

    // 4. OpenGraph Social Tags
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Convertly')
    setMeta('property', 'og:locale', 'en_US')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', cleanCanonical)
    setMeta('property', 'og:image', DEFAULT_IMAGE)
    setMeta('property', 'og:image:alt', title)

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:site', '@convertlytools')
    setMeta('name', 'twitter:creator', '@convertlytools')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', DEFAULT_IMAGE)

    // 6. Structured Data (JSON-LD)
    const schemas: Record<string, unknown>[] = []

    // A. WebApplication / SoftwareApplication
    const appName = toolName || (title.includes('—') ? title.split('—')[0].trim() : 'Convertly')
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: appName,
      alternateName: `Convertly ${appName}`,
      url: cleanCanonical,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All (Windows, macOS, Linux, iOS, Android)',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '2.0.0',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '15420',
        bestRating: '5',
        worstRating: '1',
      },
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      featureList: [
        'Enterprise Document Conversion Fidelity',
        '120-Minute Zero-Retention Auto-Shredding Privacy',
        'Smart OCR for Scanned Documents',
        'In-Browser Live Document Preview',
        'Smartphone QR Direct File Transfer',
        'No File Limits and No Watermarks',
      ],
      creator: {
        '@type': 'Organization',
        name: 'Convertly',
        url: BASE_DOMAIN,
      },
    })

    // B. BreadcrumbList Schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.item,
        })),
      })
    }

    // C. FAQPage Schema
    if (faqs && faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
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

    // D. HowTo Schema for Step-by-Step Conversion Guides
    if (howToSteps && howToSteps.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
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

    // E. Custom Extra Schemas (e.g. from Homepage or Directory)
    if (schemaJson) {
      if (Array.isArray(schemaJson)) {
        schemas.push(...schemaJson)
      } else {
        schemas.push(schemaJson)
      }
    }

    // Inject idempotent JSON-LD script tag
    const scriptId = 'convertly-schema-jsonld'
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = scriptId
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }
    scriptTag.text = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
  }, [title, description, keywords, canonicalUrl, breadcrumbs, faqs, howToSteps, toolName, schemaJson])

  return null
}

export default SeoHead
