import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SeoHead } from '../components/shared/SeoHead'

interface FormatSpec {
  ext: string
  name: string
  category: 'PDF' | 'Office' | 'Images' | 'Text'
  mime: string
  magicBytes: string
  engine: string
  maxSize: string
  description: string
  supportedConversions: { name: string; toolId: string }[]
  color: string
}

const FORMAT_SPECS: FormatSpec[] = [
  {
    ext: 'PDF',
    name: 'Portable Document Format (.pdf)',
    category: 'PDF',
    mime: 'application/pdf',
    magicBytes: '25 50 44 46 2D (%PDF-)',
    engine: 'PyMuPDF v1.24 + pypdf v4.3',
    maxSize: '100 MB',
    description: 'Universal vector document format preserving typography, layout, and visual fidelity across all platforms.',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    supportedConversions: [
      { name: 'Compress PDF', toolId: 'pdf-compress' },
      { name: 'Merge PDF', toolId: 'pdf-merge' },
      { name: 'Split PDF', toolId: 'pdf-split' },
      { name: 'PDF to Word', toolId: 'pdf-to-word' },
      { name: 'PDF to Images', toolId: 'pdf-to-images' },
      { name: 'Protect (AES-256)', toolId: 'pdf-protect' },
      { name: 'Unlock Password', toolId: 'pdf-unlock' },
      { name: 'Watermark PDF', toolId: 'pdf-watermark' },
      { name: 'Page Numbers', toolId: 'pdf-page-numbers' },
      { name: 'Redact Data', toolId: 'pdf-redact' },
      { name: 'Flatten Forms', toolId: 'pdf-flatten' },
      { name: 'Scrub Metadata', toolId: 'pdf-scrub-metadata' },
      { name: 'PDF to Text', toolId: 'pdf-to-txt' },
      { name: 'PDF to Excel', toolId: 'pdf-to-excel' },
      { name: 'Grayscale PDF', toolId: 'pdf-grayscale' },
    ],
  },
  {
    ext: 'DOCX',
    name: 'Microsoft Word Document (.docx)',
    category: 'Office',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magicBytes: '50 4B 03 04 (PK..)',
    engine: 'LibreOffice Headless + python-docx',
    maxSize: '100 MB',
    description: 'XML-based word processing document format standard containing formatted text, tables, styles, and embedded imagery.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    supportedConversions: [
      { name: 'Word to PDF', toolId: 'word-to-pdf' },
    ],
  },
  {
    ext: 'XLSX',
    name: 'Microsoft Excel Spreadsheet (.xlsx)',
    category: 'Office',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    magicBytes: '50 4B 03 04 (PK..)',
    engine: 'openpyxl v3.1 + reportlab table renderer',
    maxSize: '100 MB',
    description: 'Multi-sheet spreadsheet format supporting formulas, tabular grids, row styles, and calculated data sets.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    supportedConversions: [
      { name: 'Excel to PDF', toolId: 'excel-to-pdf' },
      { name: 'PDF to Excel', toolId: 'pdf-to-excel' },
    ],
  },
  {
    ext: 'PPTX',
    name: 'Microsoft PowerPoint Presentation (.pptx)',
    category: 'Office',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    magicBytes: '50 4B 03 04 (PK..)',
    engine: 'python-pptx v1.0 + reportlab landscape builder',
    maxSize: '100 MB',
    description: 'Presentation slide deck archive containing rich text shape boxes, slide sequences, notes, and visual layouts.',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    supportedConversions: [
      { name: 'PowerPoint to PDF', toolId: 'ppt-to-pdf' },
    ],
  },
  {
    ext: 'PNG',
    name: 'Portable Network Graphics (.png)',
    category: 'Images',
    mime: 'image/png',
    magicBytes: '89 50 4E 47 0D 0A 1A 0A (.PNG....)',
    engine: 'Pillow (PIL) 10.4',
    maxSize: '100 MB',
    description: 'Lossless raster image format supporting full 8-bit or 16-bit alpha channel transparency and sharp graphic lines.',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    supportedConversions: [
      { name: 'PNG to JPG', toolId: 'png-to-jpg' },
      { name: 'Image to WebP', toolId: 'image-to-webp' },
      { name: 'Images to PDF', toolId: 'images-to-pdf' },
      { name: 'Resize Image', toolId: 'image-resize' },
      { name: 'Compress Image', toolId: 'image-compress' },
      { name: 'Crop Image', toolId: 'image-crop' },
      { name: 'Rotate Image', toolId: 'image-rotate' },
    ],
  },
  {
    ext: 'JPG / JPEG',
    name: 'Joint Photographic Experts Group (.jpg, .jpeg)',
    category: 'Images',
    mime: 'image/jpeg',
    magicBytes: 'FF D8 FF E0 / FF D8 FF E1',
    engine: 'Pillow (PIL) 10.4',
    maxSize: '100 MB',
    description: 'Widely used photographic compression standard offering small byte footprints with high perceptual quality.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    supportedConversions: [
      { name: 'JPG to PNG', toolId: 'jpg-to-png' },
      { name: 'Image to WebP', toolId: 'image-to-webp' },
      { name: 'Images to PDF', toolId: 'images-to-pdf' },
      { name: 'Resize Image', toolId: 'image-resize' },
      { name: 'Compress Image', toolId: 'image-compress' },
      { name: 'Crop Image', toolId: 'image-crop' },
      { name: 'Rotate Image', toolId: 'image-rotate' },
    ],
  },
  {
    ext: 'WEBP',
    name: 'Modern Web Picture Format (.webp)',
    category: 'Images',
    mime: 'image/webp',
    magicBytes: '52 49 46 46 (RIFF) + WEBP',
    engine: 'Pillow (PIL) 10.4',
    maxSize: '100 MB',
    description: 'Next-generation web image format engineered by Google offering 30% superior compression to JPG and PNG.',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/30',
    supportedConversions: [
      { name: 'WebP to JPG / PNG', toolId: 'webp-to-image' },
      { name: 'Images to PDF', toolId: 'images-to-pdf' },
      { name: 'Resize Image', toolId: 'image-resize' },
      { name: 'Compress Image', toolId: 'image-compress' },
      { name: 'Crop Image', toolId: 'image-crop' },
      { name: 'Rotate Image', toolId: 'image-rotate' },
    ],
  },
  {
    ext: 'TXT',
    name: 'Plain Text UTF-8 (.txt)',
    category: 'Text',
    mime: 'text/plain',
    magicBytes: 'Valid UTF-8 / ASCII Byte Sequence',
    engine: 'PyMuPDF Semantic Layout Extractor',
    maxSize: '50 MB',
    description: 'Raw unformatted text encoded in Unicode UTF-8, ideal for natural language processing, archiving, and code indexing.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
    supportedConversions: [
      { name: 'PDF to Text', toolId: 'pdf-to-txt' },
    ],
  },
]

export function FormatsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'All' | 'PDF' | 'Office' | 'Images' | 'Text'>('All')

  const filteredFormats = FORMAT_SPECS.filter((fmt) => {
    const matchesCategory = activeCategory === 'All' || fmt.category === activeCategory
    const matchesSearch =
      fmt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fmt.ext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fmt.mime.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fmt.engine.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title="Supported File Formats & Technical Specifications | Convertly"
        description="Comprehensive technical specifications of all formats supported by Convertly: MIME types, magic byte signatures, transformation engines, and conversion matrix."
        canonicalUrl="https://convertlytools.xyz/formats"
        breadcrumbs={[
          { name: 'Home', item: 'https://convertlytools.xyz' },
          { name: 'Supported Formats', item: 'https://convertlytools.xyz/formats' }
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 mb-4">
            <Cpu className="h-3.5 w-3.5" />
            <span>Format Standards & Engine Matrix</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Supported File Formats & Binary Specifications
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Convertly V2 enforces strict binary magic-byte inspection before processing any uploaded document, blocking disguised executables and ensuring 100% format fidelity.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search formats, MIME types, or engines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/80 pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border w-full sm:w-auto overflow-x-auto">
            {(['All', 'PDF', 'Office', 'Images', 'Text'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Formats Grid */}
        <h2 className="sr-only">Supported Format Specifications Directory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredFormats.map((fmt) => (
            <Card
              key={fmt.ext}
              className="p-6 border-border/80 bg-card/80 hover:border-border transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${fmt.color}`}>
                      {fmt.ext}
                    </span>
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      {fmt.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {fmt.category}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {fmt.description}
                </p>

                {/* Technical Meta Table */}
                <div className="rounded-xl bg-background/50 border border-border/50 p-3 space-y-1.5 text-[11px] font-mono mb-4">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>MIME Type:</span>
                    <span className="text-foreground truncate max-w-[220px]" title={fmt.mime}>
                      {fmt.mime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Magic Bytes:</span>
                    <span className="text-cyan-400 font-bold">{fmt.magicBytes}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Backend Engine:</span>
                    <span className="text-emerald-400 font-semibold">{fmt.engine}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Max File Size:</span>
                    <span className="text-foreground">{fmt.maxSize}</span>
                  </div>
                </div>
              </div>

              {/* Supported Conversions */}
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Available Operations ({fmt.supportedConversions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {fmt.supportedConversions.map((conv) => (
                    <Link
                      key={conv.toolId}
                      to={`/tools/${conv.toolId}?demo=true`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-secondary hover:bg-secondary/80 text-foreground transition-colors group"
                    >
                      <span>{conv.name}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Guarantee Banner */}
        <Card className="p-6 border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Need a custom enterprise format?</h2>
              <p className="text-xs text-muted-foreground">
                Our ephemeral worker architecture supports custom plug-in converters for TIFF, EPUB, SVG, and PostScript.
              </p>
            </div>
          </div>

          <Link
            to="/developers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shrink-0"
          >
            <span>Explore Developer API</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  )
}
