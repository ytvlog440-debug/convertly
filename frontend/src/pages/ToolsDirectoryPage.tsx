import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  FileText,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Presentation,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  FileCheck2,
  ArrowUpDown,
  Lock,
  Unlock,
  Stamp,
  Hash,
  Crop,
  Maximize2,
  RotateCw,
  EyeOff,
  ShieldCheck,
  X
} from 'lucide-react'
import { Card, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'

// Reordered by search demand, matching HomePage exactly
const ALL_TOOLS = [
  // 1. PDF to Word
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    desc: 'Extract PDF documents into editable Word DOCX files with formatting, tables, and typography intact.',
    category: 'office',
    icon: FileText,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Popular #1'
  },
  // 2. Word to PDF
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    desc: 'Convert DOCX documents to publication-ready PDF with pixel-perfect layout preservation via LibreOffice.',
    category: 'office',
    icon: FileText,
    color: 'text-blue-600 bg-blue-600/10',
    badge: 'High Demand'
  },
  // 3. Image to PDF
  {
    id: 'images-to-pdf',
    name: 'Image to PDF',
    desc: 'Merge multiple JPG, PNG, and WebP images into a single consolidated, searchable PDF document.',
    category: 'images',
    icon: FileText,
    color: 'text-fuchsia-500 bg-fuchsia-500/10',
    badge: 'Multi-File'
  },
  // 4. Excel to PDF
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    desc: 'Convert spreadsheets and XLSX workbooks into clean, structured, print-ready PDF tables.',
    category: 'office',
    icon: FileSpreadsheet,
    color: 'text-emerald-600 bg-emerald-600/10',
    badge: 'Table Preserved'
  },
  // 5. PowerPoint to PDF
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    desc: 'Turn PPTX slide presentations into high-resolution PDF presentations without font distortion.',
    category: 'office',
    icon: Presentation,
    color: 'text-orange-500 bg-orange-500/10',
    badge: 'Slide Fidelity'
  },
  // 6. Compress PDF
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    desc: 'Drastically reduce PDF file size while maintaining vector sharpness and high image clarity.',
    category: 'pdf',
    icon: Sparkles,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Up to -85%'
  },
  // 7. Merge PDF
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    desc: 'Combine multiple PDF files into one clean document in your exact custom sequence.',
    category: 'pdf',
    icon: Layers,
    color: 'text-rose-500 bg-rose-500/10',
    badge: 'Unlimited'
  },
  // 8. Split PDF
  {
    id: 'pdf-split',
    name: 'Split PDF',
    desc: 'Extract specific page ranges or divide documents into standalone individual PDF files.',
    category: 'pdf',
    icon: FileText,
    color: 'text-amber-500 bg-amber-500/10',
    badge: 'Range Extractor'
  },
  // 9. PDF to Images
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    desc: 'Export PDF pages into high-resolution 150/300 DPI PNG or JPG graphics.',
    category: 'images',
    icon: ImageIcon,
    color: 'text-purple-500 bg-purple-500/10',
    badge: '300 DPI'
  },
  // 10. JPG to PNG
  {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    desc: 'Lossless graphic conversion with full support for alpha channel transparency.',
    category: 'images',
    icon: ImageIcon,
    color: 'text-cyan-500 bg-cyan-500/10',
    badge: 'Lossless'
  },
  // 11. PNG to JPG
  {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    desc: 'Convert transparent or heavy PNG graphics to lightweight JPG photos with custom background matting.',
    category: 'images',
    icon: ImageIcon,
    color: 'text-blue-500 bg-blue-500/10',
    badge: 'Alpha Matting'
  },
  // 12. Image Compress
  {
    id: 'image-compress',
    name: 'Image Compress',
    desc: 'Intelligently compress JPG, PNG, and WebP images to slash byte size with negligible quality loss.',
    category: 'images',
    icon: Sparkles,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Smart Lossy'
  },
  // 13. Image Resize
  {
    id: 'image-resize',
    name: 'Image Resize',
    desc: 'Change image pixel dimensions with anti-aliasing Lanczos resampling while retaining sharpness.',
    category: 'images',
    icon: Maximize2,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Lanczos Scale'
  },
  // 14. Image Crop
  {
    id: 'image-crop',
    name: 'Image Crop',
    desc: 'Trim edges and isolate focal regions of images with pixel-perfect coordinate cropping.',
    category: 'images',
    icon: Crop,
    color: 'text-rose-500 bg-rose-500/10'
  },
  // 15. Rotate Image
  {
    id: 'image-rotate',
    name: 'Rotate Image',
    desc: 'Rotate photos 90°, 180°, or 270° clockwise or counter-clockwise without compression artifacts.',
    category: 'images',
    icon: RotateCw,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  // 16. Image to WebP
  {
    id: 'image-to-webp',
    name: 'Image to WebP',
    desc: 'Next-generation web format encoding for blazing fast website loading times and tiny file sizes.',
    category: 'images',
    icon: ImageIcon,
    color: 'text-teal-500 bg-teal-500/10',
    badge: 'Web Speed'
  },
  // 17. WebP to Image
  {
    id: 'webp-to-image',
    name: 'WebP to Image',
    desc: 'Convert WebP images into universally compatible PNG or JPG format for legacy software.',
    category: 'images',
    icon: ImageIcon,
    color: 'text-emerald-500 bg-emerald-500/10'
  },

  // PDF Security, Watermarking & Privacy Suite
  {
    id: 'pdf-rotate',
    name: 'Rotate PDF',
    desc: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.',
    category: 'pdf',
    icon: RotateCw,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    id: 'pdf-delete-pages',
    name: 'Delete Pages',
    desc: 'Select and permanently strip unwanted pages from your PDF document.',
    category: 'pdf',
    icon: Trash2,
    color: 'text-rose-600 bg-rose-600/10'
  },
  {
    id: 'pdf-extract-pages',
    name: 'Extract Pages',
    desc: 'Extract chosen pages into a clean, standalone new PDF file in seconds.',
    category: 'pdf',
    icon: FileCheck2,
    color: 'text-violet-500 bg-violet-500/10'
  },
  {
    id: 'pdf-reorder-pages',
    name: 'Reorder Pages',
    desc: 'Rearrange and resequence pages of your PDF document into a custom order.',
    category: 'pdf',
    icon: ArrowUpDown,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  {
    id: 'pdf-protect',
    name: 'Protect PDF',
    desc: 'Encrypt your PDF with bank-grade AES-256 password protection and permissions.',
    category: 'pdf',
    icon: Lock,
    color: 'text-rose-500 bg-rose-500/10',
    badge: 'AES-256'
  },
  {
    id: 'pdf-unlock',
    name: 'Unlock PDF',
    desc: 'Remove password protection and security restrictions from an authenticated PDF document.',
    category: 'pdf',
    icon: Unlock,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'Decrypt'
  },
  {
    id: 'pdf-watermark',
    name: 'Watermark PDF',
    desc: 'Stamp custom text watermarks across all pages with customizable rotation and opacity.',
    category: 'pdf',
    icon: Stamp,
    color: 'text-indigo-500 bg-indigo-500/10',
    badge: 'Stamp'
  },
  {
    id: 'pdf-page-numbers',
    name: 'Page Numbers',
    desc: 'Add customizable page numbers and indicators with crisp vector typography.',
    category: 'pdf',
    icon: Hash,
    color: 'text-cyan-500 bg-cyan-500/10',
    badge: 'Vector'
  },
  {
    id: 'pdf-redact',
    name: 'Redact PDF',
    desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers.',
    category: 'pdf',
    icon: EyeOff,
    color: 'text-rose-600 bg-rose-600/10',
    badge: 'Sanitize'
  },
  {
    id: 'pdf-flatten',
    name: 'Flatten PDF',
    desc: 'Bake form fields, digital signatures, and comments into static page content.',
    category: 'pdf',
    icon: Layers,
    color: 'text-amber-500 bg-amber-500/10',
    badge: 'Anti-Tamper'
  },
  {
    id: 'pdf-scrub-metadata',
    name: 'Scrub Metadata',
    desc: 'Strip hidden author info, creation tools, timestamps, and XMP payloads.',
    category: 'pdf',
    icon: ShieldCheck,
    color: 'text-emerald-500 bg-emerald-500/10',
    badge: 'GDPR Clean'
  },
  {
    id: 'pdf-to-txt',
    name: 'PDF to Text',
    desc: 'Extract plain text content and document structure into a clean, formatted TXT file.',
    category: 'pdf',
    icon: FileText,
    color: 'text-blue-500 bg-blue-500/10',
    badge: 'Structured TXT'
  },
  {
    id: 'pdf-grayscale',
    name: 'PDF to Grayscale',
    desc: 'Convert full-color PDF documents into black & white grayscale to optimize print costs.',
    category: 'pdf',
    icon: Layers,
    color: 'text-slate-400 bg-slate-500/10',
    badge: 'Ink Saver'
  }
]

export function ToolsDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || 'all'
  const queryParam = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(queryParam)

  useEffect(() => {
    if (queryParam && queryParam !== searchQuery) {
      setSearchQuery(queryParam)
    }
  }, [queryParam])

  const filtered = ALL_TOOLS.filter((tool) => {
    const matchesCategory = categoryParam === 'all' || tool.category === categoryParam
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      tool.name.toLowerCase().includes(query) ||
      tool.desc.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query) ||
      (tool.badge && tool.badge.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  })

  const DIRECTORY_SCHEMAS = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Directory of Conversion Tools — Convertly',
      url: 'https://convertlytools.xyz/tools',
      description: 'Comprehensive directory of 30 enterprise-grade document, PDF, and image conversion tools with zero retention privacy.',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: ALL_TOOLS.map((t, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: t.name,
          url: `https://convertlytools.xyz/tools/${t.id}`,
          description: t.desc
        }))
      }
    }
  ]

  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Directory of Conversion Tools — PDF, Office & Images | Convertly"
        description="Browse all 30 free online file conversion tools. Convert PDF to Word, Word to PDF, compress, merge, split, and optimize images with zero data retention."
        keywords="conversion tools directory, free pdf converter, word to pdf, pdf to word, image to pdf, compress pdf, merge pdf"
        canonicalUrl="https://convertlytools.xyz/tools"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz/' },
          { name: 'Tools Directory', item: 'https://convertlytools.xyz/tools' }
        ]}
        schemaJson={DIRECTORY_SCHEMAS}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4 backdrop-blur-md">
            <span>30 Enterprise Tools Available</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground">
            All Conversion Tools
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Browse our full suite of privacy-preserving, enterprise document and media conversion tools.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Category Filter Pills */}
          <div className="flex items-center rounded-xl border border-border bg-card/80 p-1 backdrop-blur-md">
            {[
              { id: 'all', label: 'All Tools' },
              { id: 'pdf', label: 'PDF Suite' },
              { id: 'office', label: 'Office ⇄ PDF' },
              { id: 'images', label: 'Image Suite' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSearchParams(cat.id === 'all' ? {} : { category: cat.id })}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  categoryParam === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search PDF, Word, Excel, Image tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search conversion tools by name or format"
              className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grid of Tools */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No matching conversion tools found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              We couldn't find any tools matching "{searchQuery}".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((tool) => {
              const Icon = tool.icon
              return (
                <Link key={tool.id} to={`/tools/${tool.id}`} className="block group">
                  <Card className="h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {tool.badge && (
                          <Badge variant="default" className="text-[10px]">
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
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
