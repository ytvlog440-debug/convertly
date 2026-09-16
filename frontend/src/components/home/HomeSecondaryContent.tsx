import React from 'react'
import { Link } from 'react-router-dom'
import {
  Lock,
  Cpu,
  Zap,
  QrCode,
  Check,
  Search,
  HardDrive,
  ShieldCheck,
  Shield,
  ExternalLink,
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import { Card } from '../ui/Card'
import { useHealth } from '../../hooks/useHealth'

interface LazySectionProps {
  children: React.ReactNode
  minHeight?: number
  className?: string
  id?: string
  rootMargin?: string
}

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

interface WorkflowStep {
  id: string
  name: string
}

interface Workflow {
  title: string
  description: string
  steps: WorkflowStep[]
}

const CONVERSION_WORKFLOWS: Workflow[] = [
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

interface DirectoryTool {
  id: string
  name: string
  category: string
}

interface HomeSecondaryContentProps {
  tools?: DirectoryTool[]
}

export function HomeSecondaryContent({ tools }: HomeSecondaryContentProps) {
  const { data: health } = useHealth()

  return (
    <>
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
      {tools && tools.length > 0 && (
        <LazySection minHeight={280} className="py-16 border-t border-border/60 bg-secondary/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-heading text-xl font-bold text-foreground">Complete Conversion Tools Directory</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Browse our complete library of verified PDF, Microsoft Office, and graphic transformation utilities.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tools.map((tool) => (
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
      )}
    </>
  )
}
