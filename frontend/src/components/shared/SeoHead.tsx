import * as React from 'react'

export interface SeoBreadcrumb {
  name: string
  item: string
}

export interface SeoFaq {
  question: string
  answer: string
}

export interface SeoHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonicalUrl?: string
  breadcrumbs?: SeoBreadcrumb[]
  faqs?: SeoFaq[]
  schemaJson?: Record<string, unknown> | Record<string, unknown>[]
}

export function SeoHead({
  title = 'Convertly — Free Online PDF, Office & Image Converter',
  description = 'High-performance, secure and free file conversion SaaS. Convert PDF, Word, Excel, PowerPoint, and images with zero data retention.',
  keywords,
  canonicalUrl = 'https://convertlytools.xyz',
  breadcrumbs,
  faqs,
  schemaJson,
}: SeoHeadProps) {
  React.useEffect(() => {
    document.title = title

    // Update or insert meta description
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', description)

    // Update or insert meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
    }

    // Canonical link tag
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    // OpenGraph & Twitter tags
    const ogTags: Record<string, string> = {
      'og:title': title,
      'og:description': description,
      'og:url': canonicalUrl,
      'og:type': 'website',
      'og:site_name': 'Convertly V2',
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
    }

    Object.entries(ogTags).forEach(([key, value]) => {
      let tag = document.querySelector(`meta[property="${key}"], meta[name="${key}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(key.startsWith('twitter:') ? 'name' : 'property', key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', value)
    })

    // Prepare JSON-LD schemas array
    const schemas: Record<string, unknown>[] = []

    // 1. WebApplication Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title.includes('—') ? title.split('—')[0].trim() : 'Convertly V2',
      url: canonicalUrl,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '2.0.0',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '12840',
        bestRating: '5',
        worstRating: '1',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        '30 Real Document Engines',
        '120-Minute Zero-Retention Privacy Shredding',
        'Mobile QR File Transfer',
        'In-Browser Document Preview',
        'No File Limits or Watermarks',
      ],
    })

    // 2. BreadcrumbList Schema (if provided)
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

    // 3. FAQPage Schema (if provided)
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

    if (schemaJson) {
      if (Array.isArray(schemaJson)) {
        schemas.push(...schemaJson)
      } else {
        schemas.push(schemaJson)
      }
    }

    // Inject Script Tag
    const scriptId = 'convertly-schema-jsonld'
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = scriptId
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }
    scriptTag.text = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
  }, [title, description, keywords, canonicalUrl, breadcrumbs, faqs, schemaJson])

  return null
}
