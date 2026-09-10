import { useState } from 'react'
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
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  RotateCw,
  Trash2,
  FileCheck2,
  ArrowUpDown,
  EyeOff,
  ShieldCheck,
  Crop,
  Maximize2
} from 'lucide-react'
import { Dropzone } from '../components/ui/Dropzone'
import { Card, CardTitle, CardDescription } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'
import { useHealth } from '../hooks/useHealth'

interface ToolItem {
  id: string
  name: string
  desc: string
  category: 'PDF' | 'Office' | 'Images'
  icon: typeof FileText
  color: string
  badge?: string
}

const HOME_FAQS = [
  {
    question: "Is Convertly V2 completely free to use?",
    answer: "Yes, 100% free with zero subscription requirements, watermarks, or artificial daily upload limits. All 25 tools are enterprise-grade and unrestricted."
  },
  {
    question: "Are my uploaded documents secure and private?",
    answer: "Security and user privacy are foundational to Convertly V2. Uploaded documents are processed entirely in memory or temporary encrypted disk storage and automatically shredded and permanently erased after 120 minutes."
  },
  {
    question: "Does Office conversion preserve fonts, formulas, and exact layout?",
    answer: "Yes. We use a containerized LibreOffice headless engine alongside native Python document parsers, providing exact fidelity on Word (DOCX), Excel (XLSX), and PowerPoint (PPTX) files without formatting loss."
  },
  {
    question: "What is the maximum file size limit?",
    answer: "You can upload files up to 100MB per document for single-file tools, or batch stage up to 30 files at once for multi-document operations like Merge PDF and Images to PDF."
  }
]

const TOOLS_CATALOG: ToolItem[] = [
  // PDF Core Suite
  { id: 'pdf-merge', name: 'Merge PDF', desc: 'Combine multiple PDF files into one clean document in your chosen order.', category: 'PDF', icon: Layers, color: 'text-rose-500 bg-rose-500/10', badge: 'Popular' },
  { id: 'pdf-split', name: 'Split PDF', desc: 'Separate pages or extract specific page ranges with instant download.', category: 'PDF', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'pdf-compress', name: 'Compress PDF', desc: 'Reduce PDF file size drastically while preserving vector text and image clarity.', category: 'PDF', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10', badge: 'High Ratio' },
  { id: 'pdf-rotate', name: 'Rotate PDF', desc: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.', category: 'PDF', icon: RotateCw, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'pdf-delete-pages', name: 'Delete Pages', desc: 'Select and permanently strip unwanted pages from your PDF document.', category: 'PDF', icon: Trash2, color: 'text-rose-600 bg-rose-600/10' },
  { id: 'pdf-extract-pages', name: 'Extract Pages', desc: 'Extract chosen pages into a clean, standalone new PDF file.', category: 'PDF', icon: FileCheck2, color: 'text-violet-500 bg-violet-500/10' },
  { id: 'pdf-reorder-pages', name: 'Reorder Pages', desc: 'Rearrange and resequence pages of your PDF document into a custom order.', category: 'PDF', icon: ArrowUpDown, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'pdf-protect', name: 'Protect PDF', desc: 'Encrypt your PDF with bank-grade AES-256 password protection and permissions.', category: 'PDF', icon: Lock, color: 'text-rose-500 bg-rose-500/10', badge: 'AES-256' },
  { id: 'pdf-unlock', name: 'Unlock PDF', desc: 'Remove password protection and restrictions from an authenticated PDF.', category: 'PDF', icon: Unlock, color: 'text-emerald-500 bg-emerald-500/10', badge: 'Instant' },
  { id: 'pdf-watermark', name: 'Watermark PDF', desc: 'Stamp custom text watermarks across all pages with customizable rotation and opacity.', category: 'PDF', icon: Stamp, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'pdf-page-numbers', name: 'Page Numbers', desc: 'Add customizable page numbers and indicators with crisp vector typography.', category: 'PDF', icon: Hash, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'pdf-redact', name: 'Redact PDF', desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers.', category: 'PDF', icon: EyeOff, color: 'text-rose-600 bg-rose-600/10', badge: 'Sanitize' },
  { id: 'pdf-flatten', name: 'Flatten PDF', desc: 'Bake form fields, digital signatures, and comments into static page content.', category: 'PDF', icon: Layers, color: 'text-amber-500 bg-amber-500/10', badge: 'Anti-Tamper' },
  { id: 'pdf-scrub-metadata', name: 'Scrub Metadata', desc: 'Strip hidden author info, creation tools, timestamps, and XMP payloads.', category: 'PDF', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10', badge: 'GDPR' },
  { id: 'pdf-to-txt', name: 'PDF to Text', desc: 'Extract plain text content and document structure into a clean, formatted TXT file.', category: 'PDF', icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'pdf-grayscale', name: 'PDF to Grayscale', desc: 'Convert full-color PDF documents into black & white grayscale to optimize print costs.', category: 'PDF', icon: Layers, color: 'text-slate-400 bg-slate-500/10', badge: 'Ink Saver' },

  // Office Suite
  { id: 'word-to-pdf', name: 'Word to PDF', desc: 'Convert DOCX to standard PDF with pixel-perfect font and table layout preservation.', category: 'Office', icon: FileText, color: 'text-blue-600 bg-blue-600/10', badge: 'LibreOffice' },
  { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Extract PDF documents into editable Word DOCX files with formatting intact.', category: 'Office', icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'excel-to-pdf', name: 'Excel to PDF', desc: 'Convert spreadsheet sheets into publication-ready PDF tables.', category: 'Office', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-600/10' },
  { id: 'ppt-to-pdf', name: 'PowerPoint to PDF', desc: 'Turn PPTX slide decks into sharable, high-resolution PDF presentations.', category: 'Office', icon: Presentation, color: 'text-orange-500 bg-orange-500/10' },

  // Image Suite
  { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Lossless conversion with support for alpha channel transparency.', category: 'Images', icon: ImageIcon, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert PNG graphics to standard JPEG with clean background matting.', category: 'Images', icon: ImageIcon, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'image-to-webp', name: 'Image to WEBP', desc: 'Next-gen web format compression for ultra-fast website loading times.', category: 'Images', icon: ImageIcon, color: 'text-teal-500 bg-teal-500/10', badge: 'Web Speed' },
  { id: 'webp-to-image', name: 'WEBP to JPG / PNG', desc: 'Convert WebP images into universally compatible PNG or JPG format.', category: 'Images', icon: ImageIcon, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'pdf-to-images', name: 'PDF to Images', desc: 'Export PDF pages into 300+ DPI crisp PNG or JPG graphic files.', category: 'Images', icon: ImageIcon, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'images-to-pdf', name: 'Images to PDF', desc: 'Merge JPG, PNG, and WEBP photos into a single consolidated PDF book.', category: 'Images', icon: FileText, color: 'text-fuchsia-500 bg-fuchsia-500/10' },
  { id: 'image-resize', name: 'Resize Image', desc: 'Accurate pixel dimension resizing with aspect ratio preservation.', category: 'Images', icon: Maximize2, color: 'text-blue-500 bg-blue-500/10' },
  { id: 'image-compress', name: 'Compress Image', desc: 'Optimize JPG, PNG, and WebP images to reduce byte size with negligible quality loss.', category: 'Images', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'image-crop', name: 'Crop Image', desc: 'Trim edges and isolate focal regions of images with exact coordinate cropping.', category: 'Images', icon: Crop, color: 'text-rose-500 bg-rose-500/10' },
  { id: 'image-rotate', name: 'Rotate Image', desc: 'Rotate photos 90°, 180°, or 270° clockwise or counter-clockwise losslessly.', category: 'Images', icon: RotateCw, color: 'text-cyan-500 bg-cyan-500/10' },
]

export function HomePage() {
  const [activeTab, setActiveTab] = useState<'All' | 'PDF' | 'Office' | 'Images'>('All')
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([])
  const { data: health } = useHealth()

  const filteredTools = activeTab === 'All'
    ? TOOLS_CATALOG
    : TOOLS_CATALOG.filter(t => t.category === activeTab)

  const handleFilesSelected = (files: File[]) => {
    setSelectedFileNames(files.map(f => f.name))
  }

  return (
    <div className="relative overflow-hidden">
      <SeoHead
        title="Convertly V2 — Enterprise Free File Conversion SaaS"
        description="Convert PDF, Office docs (Word, Excel, PowerPoint) and images online for free. Production-grade quality, zero retention, powered by native document engines."
        faqs={HOME_FAQS}
      />

      {/* Decorative Ambient Background Glows */}
      <div className="glow-ambient top-[-100px] left-1/2 -translate-x-1/2 bg-indigo-600/15" />
      <div className="glow-ambient top-[350px] right-[-150px] bg-cyan-500/10" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-8 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Convertly V2 Engine Baseline Online</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Enterprise File Conversion. <br />
            <span className="gradient-text">Zero Compromises.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            A production-grade alternative to Smallpdf and Adobe Acrobat Online. Powered by native 
            LibreOffice, PyMuPDF, and Ghostscript pipelines with guaranteed zero data retention.
          </p>

          {/* Interactive Upload Hero Target */}
          <div className="mx-auto mt-10 max-w-2xl">
            <Dropzone
              onFilesSelected={handleFilesSelected}
              hintText="Drag any PDF, Word, Excel, PowerPoint, or Image here to test upload verification"
            />
            {selectedFileNames.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-left text-xs text-emerald-400">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Files staged for conversion pipeline:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-foreground/80">
                  {selectedFileNames.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Metrics & Guarantees Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span>120-min Auto Shredder</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-400" />
              <span>Sub-Second Fast Conversions</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Zero Document Tracking</span>
            </div>
          </div>

        </div>
      </section>

      {/* Conversion Tools Directory Section */}
      <section className="relative py-16 border-t border-border/60 bg-secondary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Document & Media Processing Suite
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a dedicated tool engineered for strict output fidelity.
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

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTools.map((tool) => {
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

        </div>
      </section>

      {/* Backend Infrastructure Telemetry Card */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="border-indigo-500/30 bg-gradient-to-br from-card/80 to-secondary/40 p-8 shadow-xl">
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
                  Real-time telemetry from FastAPI backend & native worker subsystem.
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
      </section>

      {/* Frequently Asked Questions (FAQ) Section with Schema.org Integration */}
      <section className="py-16 border-t border-border/60 bg-secondary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to know about our technology, privacy commitments, and conversion engine.
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
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground pt-2 border-t border-border/40">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
