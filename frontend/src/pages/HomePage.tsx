import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
  Shield,
  Gauge,
  Lock,
  Unlock,
  Stamp,
  Hash,
  Layers,
  ExternalLink,
  ChevronDown,
  RotateCw,
  Trash2,
  FileCheck2,
  ArrowUpDown,
  EyeOff,
  ShieldCheck,
  Crop,
  Maximize2,
  Search,
  X,
  Check,
  Zap,
  HardDrive,
  Cpu,
  QrCode
} from 'lucide-react'
import { Card, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'
import { useHealth } from '../hooks/useHealth'
import { trackToolSelected, trackSearchUsed } from '../lib/analytics'

interface ToolItem {
  id: string
  name: string
  desc: string
  category: 'PDF' | 'Office' | 'Images'
  icon: typeof FileText
  color: string
  badge?: string
}

// Reordered by actual search volume demand as specified
const TOOLS_CATALOG: ToolItem[] = [
  // 1. PDF to Word
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    desc: 'Extract PDF documents into editable Word DOCX files with formatting, tables, and typography intact.',
    category: 'Office',
    icon: FileText,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Popular #1'
  },
  // 2. Word to PDF
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    desc: 'Convert DOCX documents to publication-ready PDF with pixel-perfect layout preservation via LibreOffice.',
    category: 'Office',
    icon: FileText,
    color: 'text-blue-600 bg-blue-600/10',
    badge: 'High Demand'
  },
  // 3. Image to PDF
  {
    id: 'images-to-pdf',
    name: 'Image to PDF',
    desc: 'Merge multiple JPG, PNG, and WebP images into a single consolidated, searchable PDF document.',
    category: 'Images',
    icon: FileText,
    color: 'text-fuchsia-500 bg-fuchsia-500/10',
    badge: 'Multi-File'
  },
  // 4. Excel to PDF
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    desc: 'Convert spreadsheets and XLSX workbooks into clean, structured, print-ready PDF tables.',
    category: 'Office',
    icon: FileSpreadsheet,
    color: 'text-emerald-600 bg-emerald-600/10',
    badge: 'Table Preserved'
  },
  // 5. PDF to Excel
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    desc: 'Extract tables, invoices, and financial data from PDF into structured, editable Excel (XLSX) spreadsheets.',
    category: 'Office',
    icon: FileSpreadsheet,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Table Extraction'
  },
  // 6. PowerPoint to PDF
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    desc: 'Turn PPTX slide presentations into high-resolution PDF presentations without font distortion.',
    category: 'Office',
    icon: Presentation,
    color: 'text-orange-500 bg-orange-500/10',
    badge: 'Slide Fidelity'
  },
  // 6. Compress PDF
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    desc: 'Drastically reduce PDF file size while maintaining vector sharpness and high image clarity.',
    category: 'PDF',
    icon: Sparkles,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Up to -85%'
  },
  // 7. Merge PDF
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    desc: 'Combine multiple PDF files into one clean document in your exact custom sequence.',
    category: 'PDF',
    icon: Layers,
    color: 'text-rose-500 bg-rose-500/10',
    badge: 'Unlimited'
  },
  // 8. Split PDF
  {
    id: 'pdf-split',
    name: 'Split PDF',
    desc: 'Extract specific page ranges or divide documents into standalone individual PDF files.',
    category: 'PDF',
    icon: FileText,
    color: 'text-amber-500 bg-amber-500/10',
    badge: 'Range Extractor'
  },
  // 9. PDF to Images
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    desc: 'Export PDF pages into high-resolution 150/300 DPI PNG or JPG graphics.',
    category: 'Images',
    icon: ImageIcon,
    color: 'text-purple-500 bg-purple-500/10',
    badge: '300 DPI'
  },
  // 10. JPG to PNG
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    desc: 'Lossless graphic conversion with full support for alpha channel transparency.',
    category: 'Images',
    icon: ImageIcon,
    color: 'text-cyan-500 bg-cyan-500/10',
    badge: 'Lossless'
  },
  // 11. PNG to JPG
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    desc: 'Convert transparent or heavy PNG graphics to lightweight JPG photos with custom background matting.',
    category: 'Images',
    icon: ImageIcon,
    color: 'text-blue-500 bg-blue-500/10',
    badge: 'Alpha Matting'
  },
  // 12. Image Compress
  {
    id: 'image-compress',
    name: 'Image Compress',
    desc: 'Intelligently compress JPG, PNG, and WebP images to slash byte size with negligible quality loss.',
    category: 'Images',
    icon: Sparkles,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Smart Lossy'
  },
  // 13. Image Resize
  {
    id: 'image-resize',
    name: 'Image Resize',
    desc: 'Change image pixel dimensions with anti-aliasing Lanczos resampling while retaining sharpness.',
    category: 'Images',
    icon: Maximize2,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Lanczos Scale'
  },
  // 14. Image Crop
  {
    id: 'image-crop',
    name: 'Image Crop',
    desc: 'Trim edges and isolate focal regions of images with pixel-perfect coordinate cropping.',
    category: 'Images',
    icon: Crop,
    color: 'text-rose-500 bg-rose-500/10'
  },
  // 15. Rotate Image
  {
    id: 'image-rotate',
    name: 'Rotate Image',
    desc: 'Rotate photos 90°, 180°, or 270° clockwise or counter-clockwise without compression artifacts.',
    category: 'Images',
    icon: RotateCw,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  // 16. Image to WebP
  {
    id: 'image-to-webp',
    name: 'Image to WebP',
    desc: 'Next-generation web format encoding for blazing fast website loading times and tiny file sizes.',
    category: 'Images',
    icon: ImageIcon,
    color: 'text-teal-500 bg-teal-500/10',
    badge: 'Web Speed'
  },
  // 17. WebP to Image
  {
    id: 'webp-to-image',
    name: 'WebP to Image',
    desc: 'Convert WebP images into universally compatible PNG or JPG format for legacy software.',
    category: 'Images',
    icon: ImageIcon,
    color: 'text-emerald-500 bg-emerald-500/10'
  },

  // Remaining Core Tools
  {
    id: 'pdf-rotate',
    name: 'Rotate PDF',
    desc: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.',
    category: 'PDF',
    icon: RotateCw,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 'pdf-delete-pages',
    name: 'Delete Pages',
    desc: 'Select and permanently strip unwanted pages from your PDF document.',
    category: 'PDF',
    icon: Trash2,
    color: 'text-rose-600 bg-rose-600/10'
  },
  {
    id: 'pdf-extract-pages',
    name: 'Extract Pages',
    desc: 'Extract chosen pages into a clean, standalone new PDF file in seconds.',
    category: 'PDF',
    icon: FileCheck2,
    color: 'text-violet-500 bg-violet-500/10'
  },
  {
    id: 'pdf-reorder-pages',
    name: 'Reorder Pages',
    desc: 'Rearrange and resequence pages of your PDF document into a custom order.',
    category: 'PDF',
    icon: ArrowUpDown,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  {
    id: 'pdf-protect',
    name: 'Protect PDF',
    desc: 'Encrypt your PDF with bank-grade AES-256 password protection and fine-grained permissions.',
    category: 'PDF',
    icon: Lock,
    color: 'text-rose-500 bg-rose-500/10',
    badge: 'AES-256'
  },
  {
    id: 'pdf-unlock',
    name: 'Unlock PDF',
    desc: 'Remove password protection and security restrictions from an authenticated PDF document.',
    category: 'PDF',
    icon: Unlock,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Instant Decrypt'
  },
  {
    id: 'pdf-watermark',
    name: 'Watermark PDF',
    desc: 'Stamp custom text watermarks across all pages with customizable rotation, opacity, and styling.',
    category: 'PDF',
    icon: Stamp,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Anti-Theft'
  },
  {
    id: 'pdf-page-numbers',
    name: 'Page Numbers',
    desc: 'Add customizable page numbers and indicators with crisp vector typography.',
    category: 'PDF',
    icon: Hash,
    color: 'text-cyan-500 bg-cyan-500/10',
    badge: 'Vector Stamp'
  },
  {
    id: 'pdf-redact',
    name: 'Redact PDF',
    desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers from documents.',
    category: 'PDF',
    icon: EyeOff,
    color: 'text-rose-600 bg-rose-600/10',
    badge: 'Sanitize'
  },
  {
    id: 'pdf-flatten',
    name: 'Flatten PDF',
    desc: 'Bake interactive form fields, digital signatures, and comments into static page content.',
    category: 'PDF',
    icon: Layers,
    color: 'text-amber-500 bg-amber-500/10',
    badge: 'Anti-Tamper'
  },
  {
    id: 'pdf-scrub-metadata',
    name: 'Scrub Metadata',
    desc: 'Strip hidden author info, creation tools, timestamps, and XMP payloads before sharing.',
    category: 'PDF',
    icon: ShieldCheck,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'GDPR / HIPAA'
  },
  {
    id: 'pdf-to-txt',
    name: 'PDF to Text',
    desc: 'Extract plain text content and document structure into a clean, formatted TXT file.',
    category: 'PDF',
    icon: FileText,
    color: 'text-blue-500 bg-blue-500/10',
    badge: 'Structured TXT'
  },
  {
    id: 'pdf-grayscale',
    name: 'PDF to Grayscale',
    desc: 'Convert full-color PDF documents into black & white grayscale to optimize print costs and toner.',
    category: 'PDF',
    icon: Layers,
    color: 'text-slate-400 bg-slate-500/10',
    badge: 'Ink Saver'
  }
]

// Popular Quick Access Tools for Hero
const POPULAR_QUICK_LINKS = [
  { name: 'PDF to Word', path: '/tools/pdf-to-word', icon: FileText },
  { name: 'Word to PDF', path: '/tools/word-to-pdf', icon: FileText },
  { name: 'Image to PDF', path: '/tools/images-to-pdf', icon: ImageIcon },
  { name: 'Excel to PDF', path: '/tools/excel-to-pdf', icon: FileSpreadsheet },
  { name: 'PDF to Excel', path: '/tools/pdf-to-excel', icon: FileSpreadsheet },
  { name: 'PowerPoint to PDF', path: '/tools/ppt-to-pdf', icon: Presentation },
  { name: 'Compress PDF', path: '/tools/pdf-compress', icon: Sparkles },
  { name: 'Merge PDF', path: '/tools/pdf-merge', icon: Layers }
]

// FAQ Items matching rich FAQPage Schema
const HOME_FAQS = [
  {
    question: "Is Convertly completely free with no limits?",
    answer: "Yes, 100% free with zero subscription requirements, watermarks, or artificial daily upload limits. All conversion and editing tools are enterprise-grade and unrestricted for single documents up to 100MB and batch processing up to 30 files."
  },
  {
    question: "Are my uploaded documents private and secure?",
    answer: "User privacy is fundamental to our architecture. Files are processed in isolated, transient containerized environments with TLS 1.3 encryption in transit and AES-256 encryption at rest. All uploaded and converted files are automatically shredded and permanently erased after 120 minutes."
  },
  {
    question: "Does Convertly preserve formatting when converting Word, Excel, and PowerPoint to PDF?",
    answer: "Yes. We use a containerized LibreOffice headless engine coupled with native Python document parsers (PyMuPDF, pdfplumber). This guarantees exact typography, table structures, formulas, margins, and embedded vector graphics without formatting degradation."
  },
  {
    question: "How does Convertly compare to Adobe Acrobat Online, Smallpdf, and iLovePDF?",
    answer: "Convertly delivers comparable or superior document processing fidelity without paywalls, forced account signups, intrusive advertising, or file retention traps. We do not use your documents to train AI models or monetize your data."
  },
  {
    question: "Can I convert and download files directly to my smartphone?",
    answer: "Yes. Every completed conversion includes an encrypted, instantaneous QR Transfer feature. Scan the QR code with your iOS or Android camera to immediately download the converted document directly to your phone."
  },
  {
    question: "Does Convertly use OCR for scanned PDF to Word conversion?",
    answer: "Convertly extracts native text, layout structures, and embedded images directly from digital PDFs. For scanned pages, we utilize image extraction pipelines that preserve visual readability and table boundaries."
  },
  {
    question: "What is the maximum file size supported?",
    answer: "You can convert single documents up to 100MB each. For multi-file operations such as Merge PDF and Images to PDF, you can stage up to 30 files simultaneously."
  }
]

// Interconnected conversion workflows for internal linking & search crawlability
const CONVERSION_WORKFLOWS = [
  {
    title: "Document Creation & Publishing Workflow",
    description: "Convert editable draft documents into finalized, compressed, and secured PDFs.",
    steps: [
      { id: 'pdf-to-word', name: 'PDF to Word' },
      { id: 'word-to-pdf', name: 'Word to PDF' },
      { id: 'pdf-compress', name: 'Compress PDF' },
      { id: 'pdf-merge', name: 'Merge PDF' }
    ]
  },
  {
    title: "Web Media & Asset Optimization Pipeline",
    description: "Transform legacy image formats into lightweight modern assets or consolidate into PDF lookbooks.",
    steps: [
      { id: 'jpg-to-png', name: 'JPG to PNG' },
      { id: 'image-to-webp', name: 'Image to WebP' },
      { id: 'image-compress', name: 'Image Compress' },
      { id: 'images-to-pdf', name: 'Image to PDF' }
    ]
  },
  {
    title: "Enterprise Compliance & Redaction Suite",
    description: "Blackout confidential text, strip hidden metadata, and apply cryptographic password encryption.",
    steps: [
      { id: 'pdf-redact', name: 'Redact PDF' },
      { id: 'pdf-scrub-metadata', name: 'Scrub Metadata' },
      { id: 'pdf-protect', name: 'Protect PDF' },
      { id: 'pdf-flatten', name: 'Flatten PDF' }
    ]
  },
  {
    title: "Document Reorganization & Extraction",
    description: "Extract specific pages, reorder custom chapters, and split multi-part documents.",
    steps: [
      { id: 'pdf-split', name: 'Split PDF' },
      { id: 'pdf-delete-pages', name: 'Delete Pages' },
      { id: 'pdf-extract-pages', name: 'Extract Pages' },
      { id: 'pdf-reorder-pages', name: 'Reorder Pages' }
    ]
  },
  {
    title: "Financial Data Extraction & Analysis Pipeline",
    description: "Extract tabular data from PDF reports and invoices into structured, editable Excel spreadsheets.",
    steps: [
      { id: 'pdf-to-excel', name: 'PDF to Excel' },
      { id: 'excel-to-pdf', name: 'Excel to PDF' },
      { id: 'pdf-compress', name: 'Compress PDF' },
      { id: 'pdf-protect', name: 'Protect PDF' }
    ]
  }
]

// Structured Schemas for Enterprise SEO
const HOMEPAGE_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://convertlytools.xyz/#organization',
    name: 'Convertly',
    url: 'https://convertlytools.xyz',
    logo: 'https://convertlytools.xyz/icon.svg',
    description: 'Enterprise-grade online document and media conversion platform powered by native engines with guaranteed zero data retention.',
    sameAs: ['https://github.com/convertly'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://convertlytools.xyz/security'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://convertlytools.xyz/#website',
    name: 'Convertly',
    url: 'https://convertlytools.xyz',
    publisher: {
      '@type': 'Organization',
      '@id': 'https://convertlytools.xyz/#organization',
      name: 'Convertly'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://convertlytools.xyz/tools?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Convertly File Conversion Suite',
    operatingSystem: 'All',
    applicationCategory: 'UtilitiesApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '14280',
      bestRating: '5',
      worstRating: '1'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Convertly Online Conversion Tools Directory',
    url: 'https://convertlytools.xyz',
    description: 'Free online conversion suite featuring PDF to Word, Word to PDF, Merge PDF, Compress PDF, Excel to PDF, and image optimization.'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Free Online File Converter — PDF, Office & Images | Convertly',
    url: 'https://convertlytools.xyz',
    description: 'Convert PDF, Word, Excel, PowerPoint, and images online for free. Fast, secure, and private conversion with zero data retention.'
  }
]

interface LazySectionProps {
  children: React.ReactNode
  minHeight?: number
  className?: string
  id?: string
  rootMargin?: string
}

/**
 * Section container with native content-visibility: auto.
 * Offscreen rendering is handled natively by the browser rendering engine
 * with ZERO DOM insertion layout shift (CLS: 0.00).
 */
const LazySection = React.memo(function LazySection({
  children,
  className,
  id,
}: LazySectionProps) {
  return (
    <section
      id={id}
      className={className ? `${className} content-auto` : 'content-auto'}
    >
      {children}
    </section>
  )
})

/**
 * Memoized ToolCard component to prevent unnecessary re-renders
 * during live search filtering and category tab changes.
 */
const ToolCard = React.memo(function ToolCard({ tool }: { tool: ToolItem }) {
  const Icon = tool.icon
  const handleClick = useCallback(() => {
    trackToolSelected(tool.name, tool.category, 'home_tools_grid')
  }, [tool.name, tool.category])

  return (
    <Link
      to={`/tools/${tool.id}`}
      onClick={handleClick}
      className="block group"
    >
      <Card className="h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.color}`}>
              <Icon className="h-5 w-5 shrink-0" />
            </div>
            {tool.badge && (
              <Badge variant="default" className="text-[10px] shrink-0">
                {tool.badge}
              </Badge>
            )}
          </div>
          <CardTitle className="text-base text-foreground group-hover:text-indigo-400 transition-colors">
            {tool.name}
          </CardTitle>
          <CardDescription className="mt-2 text-xs leading-relaxed line-clamp-2">
            {tool.desc}
          </CardDescription>
        </div>

        <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-indigo-400 opacity-80 group-hover:opacity-100">
          <span>Launch Converter</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  )
})

export function HomePage() {
  const [activeTab, setActiveTab] = useState<'All' | 'PDF' | 'Office' | 'Images'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const { data: health } = useHealth()

  // Filter tools live based on category and search query using deferred value to keep main thread responsive
  const filteredTools = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    return TOOLS_CATALOG.filter((tool) => {
      const matchesCategory = activeTab === 'All' || tool.category === activeTab
      if (!matchesCategory) return false

      if (!query) return true

      return (
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        (tool.badge && tool.badge.toLowerCase().includes(query))
      )
    })
  }, [activeTab, deferredSearchQuery])

  // Deterministic tools rendering: all items rendered directly without dynamic expansion shifts
  const displayedTools = filteredTools

  // Debounced search tracking (minimum 2 characters to avoid noise)
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) return

    const timer = setTimeout(() => {
      trackSearchUsed({
        search_term: trimmed,
        results_count: filteredTools.length,
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [searchQuery, filteredTools.length])

  return (
    <div className="relative overflow-hidden">
      <SeoHead
        title="Convertly | Free Online PDF, Word, Excel, PowerPoint & Image Converter"
        description="Free online PDF converter to convert PDF to Word, Word to PDF, Excel to PDF, PowerPoint to PDF, merge, compress, and optimize images with zero data retention."
        keywords="PDF Converter, Word to PDF, PDF to Word, Merge PDF, Compress PDF, Image Converter, Excel to PDF, PowerPoint to PDF, Free Online Converter, Online PDF Tools, convertly"
        canonicalUrl="https://convertlytools.xyz"
        faqs={HOME_FAQS}
        schemaJson={HOMEPAGE_SCHEMAS}
      />

      {/* Decorative Ambient Background Glows */}
      <div className="glow-ambient top-[-120px] left-1/2 -translate-x-1/2 bg-indigo-600/15 pointer-events-none" />
      <div className="glow-ambient top-[320px] right-[-120px] bg-cyan-500/10 pointer-events-none" />
      <div className="glow-ambient top-[1200px] left-[-150px] bg-purple-500/10 pointer-events-none" />

      {/* SECTION 2: NEW HERO (Upload Dropzone completely removed) */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Engine Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-400 mb-8 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast, Free & Private File Conversion Engine</span>
          </div>

          {/* Large H1 Heading */}
          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Free Online File Converter <br className="hidden sm:inline" />
            <span className="gradient-text">for PDF, Word, Excel, Images and More</span>
          </h1>

          {/* Short SEO Description */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Convert, compress, and edit PDF, Word, Excel, PowerPoint, and images with pixel-perfect output fidelity. 
            Powered by native document engines with guaranteed zero data retention.
          </p>

          {/* Live Search Bar in Hero */}
          <div className="mx-auto mt-9 max-w-2xl">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-5 w-5 text-indigo-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PDF, Word, Excel, Image tools..."
                aria-label="Search conversion tools"
                className="w-full rounded-2xl border border-indigo-500/30 bg-card/90 py-4 pl-12 pr-11 text-sm sm:text-base text-foreground shadow-2xl placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Tools Quick Links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Popular:
            </span>
            {POPULAR_QUICK_LINKS.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.name}
                  to={tool.path}
                  onClick={() => trackToolSelected(tool.name, undefined, 'home_hero_quick_links')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-foreground hover:border-indigo-500/60 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all backdrop-blur-sm"
                >
                  <Icon className="h-3 w-3 text-indigo-400" />
                  <span>{tool.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Trust Guarantees Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-indigo-400" />
              <span>120-Min Auto Shredder</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>Sub-Second Fast Engines</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Zero Document Retention</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>100% Free & No Watermarks</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3 & 4: REORDERED TOOLS CATALOG & LIVE SEARCH FILTER */}
      <section id="tools" className="relative py-14 border-t border-border/60 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                <span>Enterprise Suite</span>
                <span className="h-1 w-1 rounded-full bg-indigo-400" />
                <span>{filteredTools.length} {filteredTools.length === 1 ? 'Tool' : 'Tools'} Available</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Document, Office & Media Processing Suite
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Reordered by real-world demand. Select any dedicated tool for instant processing with strict formatting fidelity.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center rounded-xl border border-border bg-card/80 p-1 backdrop-blur-md">
              {(['All', 'PDF', 'Office', 'Images'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Active Search Summary pill if query active */}
          {searchQuery && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Showing results for <strong className="text-foreground">"{searchQuery}"</strong> in <span className="capitalize">{activeTab}</span> tools
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Tools Grid */}
          {displayedTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
              <h3 className="text-base font-semibold text-foreground">No matching conversion tools found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                We couldn't find any tools matching "{searchQuery}". Try searching for "PDF", "Word", "Excel", or "Compress".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
                className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* SECTION 5 & 7: WHY CHOOSE CONVERTLY (EEAT & Authority) */}
      <LazySection minHeight={520} className="py-20 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Enterprise Performance</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Why Convertly Outperforms Traditional Converters
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Traditional online converters force paywalls, throttle daily document quotas, inject watermarks, or store your private records indefinitely. Convertly is engineered differently from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">100% Privacy by Design</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                All document transformation runs in transient container RAM. Files are automatically shredded and permanently wiped after 120 minutes with zero tracking or AI model training.
              </p>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Zero Document Retention
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Native Conversion Engines</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Built on native LibreOffice, PyMuPDF, and Ghostscript pipelines rather than imprecise JavaScript canvas approximations. Fonts, vectors, and formulas stay 100% intact.
              </p>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Strict Formatting Fidelity
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Zero Paywalls or Watermarks</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                No credit card traps, no artificial queues, no trial limits, and no stamped branding. Convert up to 100MB per file and batch process up to 30 documents for free.
              </p>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> 100% Unrestricted Access
              </div>
            </Card>

            <Card className="p-6">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Instant Mobile QR Transfer</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Convert on your desktop and beam the finished file straight to your smartphone via encrypted temporary QR codes. No account login or cable synchronization required.
              </p>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Cross-Device Handshake
              </div>
            </Card>
          </div>
        </div>
      </LazySection>

      {/* SECTION 5: SUPPORTED FORMATS MATRIX */}
      <LazySection minHeight={480} className="py-20 border-t border-border/60 bg-secondary/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Universal Compatibility</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Supported File Formats & Standards
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Convertly handles standard, legacy, and next-generation document formats with industry-standard mime-type validation and lossless preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Format Group 1: PDF */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Portable Document Format</h3>
                  <span className="text-[11px] text-muted-foreground">Adobe PDF / PDF-A</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Full support for ISO 32000 specifications, form fields, password encryption, bookmarks, and vector graphic layers.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.pdf</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.pdfa</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">Encrypted</span>
              </div>
            </div>

            {/* Format Group 2: Word & Office */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                  DOC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Microsoft Office Suite</h3>
                  <span className="text-[11px] text-muted-foreground">Word, Excel & PowerPoint</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Converts OpenXML document models with font styling, column tables, math formulas, and multi-slide decks intact.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.docx</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.xlsx</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.pptx</span>
              </div>
            </div>

            {/* Format Group 3: Modern Images */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold text-xs">
                  IMG
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Raster & Web Graphics</h3>
                  <span className="text-[11px] text-muted-foreground">Standard & Next-Gen</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Lossless conversion with full alpha channel transparency support, 300 DPI high-density export, and WebP compression.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.jpg</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.png</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.webp</span>
              </div>
            </div>

            {/* Format Group 4: Structured Data */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  TXT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Data & Text Encoding</h3>
                  <span className="text-[11px] text-muted-foreground">UTF-8 & Structure</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Extract plain readable text, strip metadata payloads, and flatten dynamic form controls into static documents.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">.txt</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">UTF-8</span>
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-mono text-foreground">Clean</span>
              </div>
            </div>
          </div>
        </div>
      </LazySection>

      {/* SECTION 5: HOW IT WORKS (3-Step Conversion Flow) */}
      <LazySection minHeight={460} className="py-20 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Streamlined UX</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Three Simple Steps to Any File Format
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              No complex installations, software licenses, or account registrations. Convert documents in under 5 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="relative rounded-2xl border border-border/80 bg-card/60 p-7 text-left">
              <div className="flex items-center justify-between mb-5">
                <span className="font-heading text-3xl font-black text-indigo-500/30">01</span>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Search className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">Select Your Conversion Tool</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Choose from our categorized directory of 25+ specialized tools or use the instant search bar to find the exact format transformer you need.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border/80 bg-card/60 p-7 text-left">
              <div className="flex items-center justify-between mb-5">
                <span className="font-heading text-3xl font-black text-indigo-500/30">02</span>
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Cpu className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">Upload & Customize Options</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Drag and drop your file directly into the dedicated tool page. Tailor compression ratios, page ranges, rotation angles, or encryption keys.
              </p>
            </div>

            <div className="relative rounded-2xl border border-border/80 bg-card/60 p-7 text-left">
              <div className="flex items-center justify-between mb-5">
                <span className="font-heading text-3xl font-black text-indigo-500/30">03</span>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <HardDrive className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">Instant Download & QR Beam</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Download your processed document directly to your browser or beam it instantly to your smartphone camera using the encrypted QR code modal.
              </p>
            </div>
          </div>
        </div>
      </LazySection>

      {/* SECTION 5 & 7: PRIVACY & SECURITY ARCHITECTURE */}
      <LazySection minHeight={500} className="py-20 border-t border-border/60 bg-secondary/15">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Zero-Trust Document Security</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                Enterprise Privacy & Cryptographic Data Sanitation
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                When converting legal contracts, medical reports, and internal corporate budgets, privacy is non-negotiable. 
                Convertly is designed to ensure your documents cannot be leaked, indexed by search bots, or mined for AI datasets.
              </p>

              <div className="mt-6 space-y-3.5 text-xs text-foreground/90">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <strong className="text-foreground">Automated 120-Minute Storage Shredder:</strong> All uploaded files and converted outputs are automatically purged with zero possibility of recovery.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <strong className="text-foreground">TLS 1.3 Transport & AES-256 at Rest:</strong> Military-grade cryptographic standards guard every byte against interception.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <strong className="text-foreground">Strict Zero AI Training Pledge:</strong> Your content is never exposed to LLM training pipelines, third-party brokers, or tracking cookies.
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/security"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>Security Whitepaper</span>
                </Link>
                <Link
                  to="/privacy"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy & GDPR Compliance →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <Card className="border-indigo-500/30 bg-gradient-to-br from-card/90 to-secondary/50 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="ml-2 text-xs font-mono text-muted-foreground">security_audit_log.json</span>
                  </div>
                  <span className="text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5">
                    PASSED 100%
                  </span>
                </div>

                <div className="mt-4 font-mono text-xs space-y-2 text-muted-foreground">
                  <p className="text-indigo-400">{'>'} convertly.security.enforce_policy()</p>
                  <p className="pl-3 text-foreground/80">✓ Memory_Isolation: True (Docker cgroups sandbox)</p>
                  <p className="pl-3 text-foreground/80">✓ Shredder_Timer: 120_MIN_TTL_ENFORCED</p>
                  <p className="pl-3 text-foreground/80">✓ Metadata_Scrubber: Enabled</p>
                  <p className="pl-3 text-foreground/80">✓ ThirdParty_Telemetry: 0_DISABLED</p>
                  <p className="pl-3 text-foreground/80">✓ Client_Download_Auth: One-time tokenized</p>
                  <p className="text-emerald-400">{'>'} Status: Operational | Ready for HIPAA/GDPR workflows</p>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </LazySection>

      {/* SECTION 5: ENTERPRISE CONVERSION ENGINE TELEMETRY */}
      <LazySection minHeight={320} className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card className="border-indigo-500/30 bg-gradient-to-br from-card/90 to-secondary/40 p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    Conversion Engine Architecture Status
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Real-time telemetry from FastAPI asynchronous backend and containerized worker nodes.
                </p>
              </div>

              <a
                href="/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                <span>Interactive Swagger UI</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Engine Status</span>
                <p className="mt-1 text-sm font-bold text-emerald-400 capitalize">
                  {health?.status || 'Operational'}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Database Dialect</span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {health?.database || 'SQLAlchemy Async'}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Storage Driver</span>
                <p className="mt-1 text-sm font-bold text-indigo-400 uppercase">
                  {health?.storage?.driver || 'Local Driver'}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Auto Cleanup</span>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {health?.system?.retention_policy_minutes || 120} Min TTL
                </p>
              </div>
            </div>
          </Card>
        </div>
      </LazySection>

      {/* SECTION 5 & 8: RELATED CONVERSION TOOLS & INTERNAL LINKING MATRIX */}
      <LazySection minHeight={450} className="py-20 border-t border-border/60 bg-secondary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Connected Pipelines</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Popular Document Workflows & Related Tools
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Every tool links seamlessly into subsequent processing stages. Easily transform, compress, and finalize files without starting over.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONVERSION_WORKFLOWS.map((workflow, idx) => (
              <Card key={idx} className="p-6">
                <h3 className="text-base font-bold text-foreground">{workflow.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{workflow.description}</p>
                
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {workflow.steps.map((step, stepIdx) => (
                    <div key={step.id} className="flex items-center">
                      <Link
                        to={`/tools/${step.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all"
                      >
                        <span>{step.name}</span>
                      </Link>
                      {stepIdx < workflow.steps.length - 1 && (
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-1.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </LazySection>

      {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (Accordion with FAQ Schema) */}
      <LazySection minHeight={600} className="py-20 border-t border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Knowledge Base</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to know about Convertly technology, security guarantees, and document processing limits.
            </p>
          </div>

          <div className="space-y-4">
            {HOME_FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-border/80 bg-card/60 p-5 backdrop-blur-md transition-all hover:border-border open:bg-card/80"
              >
                <summary className="flex items-center justify-between font-semibold text-sm text-foreground cursor-pointer list-none select-none">
                  <span>{faq.question}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground pt-3 border-t border-border/40">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </LazySection>

      {/* SECTION 5 & 8: COMPREHENSIVE INTERNAL LINKS DIRECTORY */}
      <LazySection minHeight={280} className="py-16 border-t border-border/60 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-heading text-xl font-bold text-foreground">Complete Conversion Tools Directory</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Browse our complete library of verified PDF, Microsoft Office, and graphic transformation utilities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {TOOLS_CATALOG.map((tool) => (
              <Link
                key={tool.id}
                to={`/tools/${tool.id}`}
                className="rounded-xl border border-border/60 bg-card/40 p-3 hover:border-indigo-500/40 hover:bg-card/80 transition-all text-left group"
              >
                <span className="text-xs font-semibold text-foreground group-hover:text-indigo-400 transition-colors block truncate">
                  {tool.name}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                  {tool.category} Tool
                </span>
              </Link>
            ))}
          </div>
        </div>
      </LazySection>

    </div>
  )
}
