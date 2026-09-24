import React, { useState, useMemo, useEffect, useCallback, useDeferredValue, Suspense, lazy } from 'react'
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
  Zap
} from 'lucide-react'
import { Card, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'
import { trackToolSelected, trackSearchUsed } from '../lib/analytics'

const HomeSecondaryContent = lazy(() =>
  import('../components/home/HomeSecondaryContent').then((m) => ({ default: m.HomeSecondaryContent }))
)

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
    desc: 'Encrypt your PDF with standard AES-256 password protection and fine-grained permissions.',
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
    badge: 'Privacy Sanitized'
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
    answer: "User privacy is fundamental to our architecture. Files are processed with TLS transport encryption in transit and stored temporarily on active server storage. All uploaded and converted files are automatically deleted after 120 minutes."
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

// Structured Schemas for Enterprise SEO
const HOMEPAGE_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://convertlytools.xyz/#organization',
    name: 'Convertly',
    url: 'https://convertlytools.xyz',
    logo: 'https://convertlytools.xyz/icon.svg',
    description: 'Enterprise-grade online document and media conversion platform powered by native engines with 120-minute temporary file retention.',
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
    description: 'Convert PDF, Word, Excel, PowerPoint, and images online for free. Fast, secure, and private conversion with 120-minute temporary file retention.'
  }
]



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

  // Filter tools live based on category and search query using deferred value to keep main thread responsive
  const filteredTools = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    if (!query && activeTab === 'All') {
      return TOOLS_CATALOG
    }

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
        description="Free online PDF converter to convert PDF to Word, Word to PDF, Excel to PDF, PowerPoint to PDF, merge, compress, and optimize images with 120-minute temporary file retention."
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
            Powered by native document engines with 120-minute temporary file retention.
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
              <span>120-Min Temporary Retention</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>Sub-Second Fast Engines</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>No Permanent File Storage</span>
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

      {/* SECTION 5-8: BELOW-THE-FOLD SECTIONS (Lazy loaded outside critical LCP/TBT path) */}
      <Suspense fallback={null}>
        <HomeSecondaryContent tools={TOOLS_CATALOG} />
      </Suspense>

    </div>
  )
}
