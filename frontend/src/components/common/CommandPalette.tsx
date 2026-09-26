import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackToolSelected, trackSearchUsed } from '../../lib/analytics'
import {
  Search,
  X,
  FileText,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Presentation,
  FileSpreadsheet,
  Lock,
  Unlock,
  Stamp,
  Hash,
  EyeOff,
  ShieldCheck,
  Maximize2,
  Crop,
  RotateCw,
  Trash2,
  FileCheck2,
  ArrowUpDown
} from 'lucide-react'

interface ToolSearchItem {
  id: string
  name: string
  desc: string
  category: 'PDF' | 'Office' | 'Images' | 'Security'
  icon: typeof FileText
  badge?: string
}

const ALL_TOOLS: ToolSearchItem[] = [
  // PDF Core
  { id: 'pdf-merge', name: 'Merge PDF', desc: 'Combine multiple PDF files into one clean document.', category: 'PDF', icon: Layers, badge: 'Multi-File' },
  { id: 'pdf-split', name: 'Split PDF', desc: 'Separate pages or extract specific page ranges.', category: 'PDF', icon: FileText, badge: 'Ranges' },
  { id: 'pdf-compress', name: 'Compress PDF', desc: 'Reduce PDF file size drastically with vector clarity.', category: 'PDF', icon: Sparkles, badge: 'High Ratio' },
  { id: 'pdf-rotate', name: 'Rotate PDF', desc: 'Rotate pages or entire documents 90°, 180°, 270°.', category: 'PDF', icon: RotateCw },
  { id: 'pdf-delete-pages', name: 'Delete Pages', desc: 'Strip unwanted pages from your PDF document.', category: 'PDF', icon: Trash2 },
  { id: 'pdf-extract-pages', name: 'Extract Pages', desc: 'Extract selected pages into a standalone new PDF.', category: 'PDF', icon: FileCheck2 },
  { id: 'pdf-reorder-pages', name: 'Reorder Pages', desc: 'Rearrange and resequence pages into a custom order.', category: 'PDF', icon: ArrowUpDown },
  { id: 'pdf-to-txt', name: 'PDF to Text', desc: 'Extract plain text content and document structure into a clean TXT file.', category: 'PDF', icon: FileText, badge: 'Structured' },
  { id: 'pdf-grayscale', name: 'PDF to Grayscale', desc: 'Convert color PDF documents into black & white to optimize print costs.', category: 'PDF', icon: Layers, badge: 'Ink Saver' },

  // Security & Privacy
  { id: 'pdf-protect', name: 'Protect PDF', desc: 'Encrypt your PDF with standard AES-256 password protection.', category: 'Security', icon: Lock, badge: 'AES-256' },
  { id: 'pdf-unlock', name: 'Unlock PDF', desc: 'Remove password protection from an authenticated PDF.', category: 'Security', icon: Unlock, badge: 'Decrypt' },
  { id: 'pdf-watermark', name: 'Watermark PDF', desc: 'Stamp custom text watermarks across all pages with opacity & rotation.', category: 'Security', icon: Stamp, badge: 'Stamp' },
  { id: 'pdf-page-numbers', name: 'Page Numbers', desc: 'Add customizable page numbers and vector typography.', category: 'Security', icon: Hash, badge: 'Vector' },
  { id: 'pdf-redact', name: 'Redact PDF', desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers.', category: 'Security', icon: EyeOff, badge: 'Irreversible' },
  { id: 'pdf-flatten', name: 'Flatten PDF', desc: 'Bake form fields and comments into permanent static page content.', category: 'Security', icon: Layers, badge: 'Anti-Tamper' },
  { id: 'pdf-scrub-metadata', name: 'Scrub Metadata', desc: 'Strip all hidden author info, creation tools, and XMP payloads.', category: 'Security', icon: ShieldCheck, badge: 'Privacy Clean' },

  // Office Suite
  { id: 'word-to-pdf', name: 'Word to PDF (DOCX)', desc: 'Convert DOCX to standard PDF with pixel-perfect font layout.', category: 'Office', icon: FileText, badge: 'LibreOffice' },
  { id: 'pdf-to-word', name: 'PDF to Word', desc: 'Extract PDF documents into editable Word DOCX files with formatting.', category: 'Office', icon: FileText },
  { id: 'excel-to-pdf', name: 'Excel to PDF (XLSX)', desc: 'Convert spreadsheet sheets into publication-ready PDF tables.', category: 'Office', icon: FileSpreadsheet },
  { id: 'pdf-to-excel', name: 'PDF to Excel (XLSX)', desc: 'Extract PDF tables and financial data into editable Excel spreadsheets.', category: 'Office', icon: FileSpreadsheet, badge: 'Smart Table' },
  { id: 'ppt-to-pdf', name: 'PowerPoint to PDF (PPTX)', desc: 'Turn PPTX slide decks into sharable, high-resolution PDF presentations.', category: 'Office', icon: Presentation },

  // Image Suite
  { id: 'jpg-to-png', name: 'JPG to PNG', desc: 'Lossless conversion with support for alpha channel transparency.', category: 'Images', icon: ImageIcon },
  { id: 'png-to-jpg', name: 'PNG to JPG', desc: 'Convert PNG graphics to standard JPEG with clean background matting.', category: 'Images', icon: ImageIcon },
  { id: 'image-to-webp', name: 'Image to WEBP', desc: 'Next-gen web format compression for ultra-fast website loading times.', category: 'Images', icon: ImageIcon, badge: 'Next-Gen' },
  { id: 'webp-to-image', name: 'WEBP to JPG / PNG', desc: 'Convert WebP images into universally compatible PNG or JPG format.', category: 'Images', icon: ImageIcon },
  { id: 'pdf-to-images', name: 'PDF to Images', desc: 'Export PDF pages into 300+ DPI crisp PNG or JPG graphic files.', category: 'Images', icon: ImageIcon, badge: '300 DPI' },
  { id: 'images-to-pdf', name: 'Images to PDF', desc: 'Merge JPG, PNG, and WEBP photos into a single consolidated PDF book.', category: 'Images', icon: FileText, badge: 'Multi-Image' },
  { id: 'image-resize', name: 'Resize Image', desc: 'Change image pixel dimensions with anti-aliasing scaling.', category: 'Images', icon: Maximize2, badge: 'Lanczos' },
  { id: 'image-compress', name: 'Compress Image', desc: 'Reduce image file size significantly without visible degradation.', category: 'Images', icon: Sparkles, badge: 'Smart' },
  { id: 'image-crop', name: 'Crop Image', desc: 'Crop your photo to custom pixel dimensions with bounding box accuracy.', category: 'Images', icon: Crop },
  { id: 'image-rotate', name: 'Rotate Image', desc: 'Rotate images 90°, 180°, 270° or perform horizontal and vertical flips.', category: 'Images', icon: RotateCw },
]

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<'All' | 'PDF' | 'Office' | 'Images' | 'Security'>('All')
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Trigger open via custom event or parent
          window.dispatchEvent(new Event('convertly:toggle_command_palette'))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
    const q = query.toLowerCase().trim()
    const matchesQuery = !q || tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q) || tool.id.includes(q)
    return matchesCategory && matchesQuery
  })

  // Debounced search tracking (minimum 2 characters to avoid noise)
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const timer = setTimeout(() => {
      trackSearchUsed({
        search_term: trimmed,
        results_count: filteredTools.length,
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [query, filteredTools.length])

  const handleSelect = (toolId: string) => {
    const selected = ALL_TOOLS.find((t) => t.id === toolId)
    if (selected) {
      trackToolSelected(selected.name, selected.category, 'command_palette')
    }
    onClose()
    navigate(`/tools/${toolId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex].id)
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-card/95 p-0 shadow-2xl backdrop-blur-2xl transition-all animate-in zoom-in-95 duration-150 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder={`Search ${ALL_TOOLS.length} tools (e.g. merge, compress, redact, watermark, docx)...`}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 border-b border-border/40 px-4 py-2 bg-secondary/20 overflow-x-auto">
          {(['All', 'PDF', 'Office', 'Images', 'Security'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat)
                setSelectedIndex(0)
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground font-mono hidden sm:inline-block">
            {filteredTools.length} tools
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/20">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No matching tools found for "{query}".
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const Icon = tool.icon
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelect(tool.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-500/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-card text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-400' : 'text-foreground'}`}>
                          {tool.name}
                        </span>
                        {tool.badge && (
                          <span className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{tool.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 px-2 py-0.5 rounded bg-secondary/40 shrink-0 ml-2">
                    {tool.category}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2 bg-secondary/10 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
            <span className="ml-2">Select:</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
          </div>
          <div>
            <span>Close:</span>
            <kbd className="ml-1.5 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
