import { useState } from 'react'
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
  ShieldCheck
} from 'lucide-react'
import { Card, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'

const ALL_TOOLS = [
  // PDF Core Suite
  { id: 'pdf-merge', name: 'Merge PDF', desc: 'Combine multiple PDF files into one clean document in your chosen order.', category: 'pdf', icon: Layers, color: 'text-rose-500 bg-rose-500/10', badge: 'Multi-File' },
  { id: 'pdf-split', name: 'Split PDF', desc: 'Separate pages or extract specific page ranges with instant download.', category: 'pdf', icon: FileText, color: 'text-amber-500 bg-amber-500/10', badge: 'Page Ranges' },
  { id: 'pdf-compress', name: 'Compress PDF', desc: 'Reduce PDF file size drastically while preserving vector text and image clarity.', category: 'pdf', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10', badge: 'High Ratio' },
  { id: 'pdf-rotate', name: 'Rotate PDF', desc: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.', category: 'pdf', icon: RotateCw, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'pdf-delete-pages', name: 'Delete Pages', desc: 'Select and permanently strip unwanted pages from your PDF document.', category: 'pdf', icon: Trash2, color: 'text-rose-600 bg-rose-600/10' },
  { id: 'pdf-extract-pages', name: 'Extract Pages', desc: 'Extract chosen pages into a clean, standalone new PDF file.', category: 'pdf', icon: FileCheck2, color: 'text-violet-500 bg-violet-500/10' },
  { id: 'pdf-reorder-pages', name: 'Reorder Pages', desc: 'Rearrange and resequence pages of your PDF document into a custom order.', category: 'pdf', icon: ArrowUpDown, color: 'text-cyan-500 bg-cyan-500/10' },

  // PDF Security, Watermarking & Privacy Suite
  { id: 'pdf-protect', name: 'Protect PDF', desc: 'Encrypt your PDF with bank-grade AES-256 password protection and permissions.', category: 'pdf', icon: Lock, color: 'text-rose-500 bg-rose-500/10', badge: 'AES-256' },
  { id: 'pdf-unlock', name: 'Unlock PDF', desc: 'Remove password protection and security restrictions from an authenticated PDF document.', category: 'pdf', icon: Unlock, color: 'text-emerald-500 bg-emerald-500/10', badge: 'Decrypt' },
  { id: 'pdf-watermark', name: 'Watermark PDF', desc: 'Stamp custom text watermarks across all pages with customizable rotation and opacity.', category: 'pdf', icon: Stamp, color: 'text-indigo-500 bg-indigo-500/10', badge: 'Stamp' },
  { id: 'pdf-page-numbers', name: 'Page Numbers', desc: 'Add customizable page numbers and indicators with crisp vector typography.', category: 'pdf', icon: Hash, color: 'text-cyan-500 bg-cyan-500/10', badge: 'Vector' },
  { id: 'pdf-redact', name: 'Redact PDF', desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers.', category: 'pdf', icon: EyeOff, color: 'text-rose-600 bg-rose-600/10', badge: 'Sanitize' },
  { id: 'pdf-flatten', name: 'Flatten PDF', desc: 'Bake form fields, digital signatures, and comments into static page content.', category: 'pdf', icon: Layers, color: 'text-amber-500 bg-amber-500/10', badge: 'Anti-Tamper' },
  { id: 'pdf-scrub-metadata', name: 'Scrub Metadata', desc: 'Strip hidden author info, creation tools, timestamps, and XMP payloads.', category: 'pdf', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10', badge: 'GDPR Clean' },
  { id: 'pdf-to-txt', name: 'PDF to Text', desc: 'Extract plain text content and document structure into a clean, formatted TXT file.', category: 'pdf', icon: FileText, color: 'text-blue-500 bg-blue-500/10', badge: 'Structured TXT' },
  { id: 'pdf-grayscale', name: 'PDF to Grayscale', desc: 'Convert full-color PDF documents into black & white grayscale to optimize print costs.', category: 'pdf', icon: Layers, color: 'text-slate-400 bg-slate-500/10', badge: 'Ink Saver' },

  // Office Suite
  { id: 'word-to-pdf', name: 'Word to PDF (DOCX)', desc: 'Convert DOCX to standard PDF with pixel-perfect font and table layout preservation.', category: 'office', icon: FileText, color: 'text-blue-600 bg-blue-600/10', badge: 'LibreOffice' },
  { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Extract PDF documents into editable Word DOCX files with formatting intact.', category: 'office', icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'excel-to-pdf', name: 'Excel to PDF (XLSX)', desc: 'Convert spreadsheet sheets into publication-ready PDF tables.', category: 'office', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-600/10' },
  { id: 'ppt-to-pdf', name: 'PowerPoint to PDF (PPTX)', desc: 'Turn PPTX slide decks into sharable, high-resolution PDF presentations.', category: 'office', icon: Presentation, color: 'text-orange-500 bg-orange-500/10' },

  // Image Suite
  { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Lossless conversion with support for alpha channel transparency.', category: 'images', icon: ImageIcon, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert PNG graphics to standard JPEG with clean background matting.', category: 'images', icon: ImageIcon, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'image-to-webp', name: 'Image to WEBP', desc: 'Next-gen web format compression for ultra-fast website loading times.', category: 'images', icon: ImageIcon, color: 'text-teal-500 bg-teal-500/10', badge: 'Next-Gen' },
  { id: 'webp-to-image', name: 'WEBP to JPG / PNG', desc: 'Convert WebP images into universally compatible PNG or JPG format.', category: 'images', icon: ImageIcon, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'pdf-to-images', name: 'PDF to Images', desc: 'Export PDF pages into 300+ DPI crisp PNG or JPG graphic files.', category: 'images', icon: ImageIcon, color: 'text-purple-500 bg-purple-500/10', badge: '300 DPI' },
  { id: 'images-to-pdf', name: 'Images to PDF', desc: 'Merge JPG, PNG, and WEBP photos into a single consolidated PDF book.', category: 'images', icon: FileText, color: 'text-fuchsia-500 bg-fuchsia-500/10', badge: 'Multi-Image' },
  { id: 'image-resize', name: 'Resize Image', desc: 'Change image pixel dimensions with anti-aliasing while maintaining crisp sharpness.', category: 'images', icon: Maximize2, color: 'text-indigo-500 bg-indigo-500/10', badge: 'Lanczos' },
  { id: 'image-compress', name: 'Compress Image', desc: 'Reduce image file size significantly without visible degradation.', category: 'images', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10', badge: 'Smart' },
  { id: 'image-crop', name: 'Crop Image', desc: 'Crop your photo to custom pixel dimensions with bounding box accuracy.', category: 'images', icon: Crop, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'image-rotate', name: 'Rotate Image', desc: 'Rotate images 90°, 180°, 270° or perform horizontal and vertical mirror flips.', category: 'images', icon: RotateCw, color: 'text-blue-500 bg-blue-500/10' },
]

export function ToolsDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || 'all'
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = ALL_TOOLS.filter((tool) => {
    const matchesCategory = categoryParam === 'all' || tool.category === categoryParam
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Directory of Conversion Tools — Convertly V2"
        description="Explore all production-grade file converters: PDF, Office documents, and images."
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground">
            All Conversion Tools
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Browse our full suite of privacy-preserving, enterprise conversion tools.
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
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/60 pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Grid of Tools */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No tools matched your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((tool) => {
              const Icon = tool.icon
              return (
                <Link key={tool.id} to={`/tools/${tool.id}`} className="block group">
                  <Card className="h-full flex flex-col justify-between group-hover:-translate-y-1 transition-all duration-300">
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
