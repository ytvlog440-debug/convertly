import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  FileText,
  Layers,
  Sparkles,
  RotateCw,
  Trash2,
  FileCheck2,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Crop,
  Maximize2,
  ArrowUpDown,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  X,
  RefreshCw,
  Lock,
  Unlock,
  Stamp,
  Hash,
  Eye,
  EyeOff,
  Smartphone,
  Copy,
  Check,
  GripVertical
} from 'lucide-react'
import { Dropzone } from '../components/ui/Dropzone'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Progress } from '../components/ui/Progress'
import { SeoHead } from '../components/shared/SeoHead'
import { uploadFile, createJob, fetchJob, getDownloadUrl, type UploadedFile, type ConversionJob } from '../lib/api'
import { formatBytes } from '../lib/utils'
import { addRecentConversion } from '../lib/history'
import { generateSampleFiles } from '../lib/samples'
import { QrTransferModal } from '../components/common/QrTransferModal'
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal'

interface ToolConfig {
  id: string
  name: string
  desc: string
  category: 'PDF' | 'Office' | 'Images'
  icon: typeof FileText
  badge?: string
  acceptTypes: Record<string, string[]>
  maxFiles: number
  color: string
}

const TOOL_CONFIGS: Record<string, ToolConfig> = {
  'pdf-merge': {
    id: 'pdf-merge',
    name: 'Merge PDF',
    desc: 'Combine multiple PDF files into one clean document in your exact specified order.',
    category: 'PDF',
    icon: Layers,
    badge: 'Multi-File',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 20,
    color: 'text-rose-500 bg-rose-500/10'
  },
  'pdf-split': {
    id: 'pdf-split',
    name: 'Split PDF',
    desc: 'Extract specific page ranges or split your document into smaller PDF files.',
    category: 'PDF',
    icon: FileText,
    badge: 'Page Ranges',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-amber-500 bg-amber-500/10'
  },
  'pdf-compress': {
    id: 'pdf-compress',
    name: 'Compress PDF',
    desc: 'Optimize and reduce PDF file size while preserving high visual quality and vector clarity.',
    category: 'PDF',
    icon: Sparkles,
    badge: 'PyMuPDF Fast',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  'pdf-rotate': {
    id: 'pdf-rotate',
    name: 'Rotate PDF',
    desc: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.',
    category: 'PDF',
    icon: RotateCw,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-blue-500 bg-blue-500/10'
  },
  'pdf-delete-pages': {
    id: 'pdf-delete-pages',
    name: 'Delete Pages',
    desc: 'Select and permanently strip unwanted pages from your PDF document.',
    category: 'PDF',
    icon: Trash2,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-rose-600 bg-rose-600/10'
  },
  'pdf-extract-pages': {
    id: 'pdf-extract-pages',
    name: 'Extract Pages',
    desc: 'Extract chosen pages into a clean, standalone new PDF file.',
    category: 'PDF',
    icon: FileCheck2,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-violet-500 bg-violet-500/10'
  },
  'pdf-reorder-pages': {
    id: 'pdf-reorder-pages',
    name: 'Reorder Pages',
    desc: 'Rearrange and resequence pages of your PDF document into a custom order.',
    category: 'PDF',
    icon: ArrowUpDown,
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  'word-to-pdf': {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    desc: 'Convert Microsoft Word DOCX documents into clean, publication-ready PDF files.',
    category: 'Office',
    icon: FileText,
    badge: 'DOCX ⇄ PDF',
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    color: 'text-blue-600 bg-blue-600/10'
  },
  'pdf-to-word': {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    desc: 'Extract and transform PDF documents into fully editable Microsoft Word DOCX files.',
    category: 'Office',
    icon: FileText,
    badge: 'Editable DOCX',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-indigo-500 bg-indigo-500/10'
  },
  'excel-to-pdf': {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    desc: 'Convert Microsoft Excel XLSX workbooks and spreadsheets into structured PDF tables.',
    category: 'Office',
    icon: FileSpreadsheet,
    badge: 'XLSX ⇄ PDF',
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    color: 'text-emerald-600 bg-emerald-600/10'
  },
  'ppt-to-pdf': {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    desc: 'Turn Microsoft PowerPoint PPTX slide presentations into high-resolution PDF slide decks.',
    category: 'Office',
    icon: Presentation,
    badge: 'PPTX ⇄ PDF',
    acceptTypes: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    maxFiles: 1,
    color: 'text-orange-500 bg-orange-500/10'
  },
  'jpg-to-png': {
    id: 'jpg-to-png',
    name: 'JPG to PNG',
    desc: 'Convert JPG images to high quality PNG format with full transparency support.',
    category: 'Images',
    icon: ImageIcon,
    badge: 'Lossless PNG',
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  'png-to-jpg': {
    id: 'png-to-jpg',
    name: 'PNG to JPG',
    desc: 'Convert transparent or opaque PNG graphics to lightweight JPG photos.',
    category: 'Images',
    icon: ImageIcon,
    badge: 'Alpha Matting',
    acceptTypes: { 'image/png': ['.png'] },
    maxFiles: 1,
    color: 'text-blue-500 bg-blue-500/10'
  },
  'image-to-webp': {
    id: 'image-to-webp',
    name: 'JPG / PNG to WEBP',
    desc: 'Transform images into modern WebP format for high compression and rapid website loading.',
    category: 'Images',
    icon: ImageIcon,
    badge: 'Next-Gen Web',
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    color: 'text-teal-500 bg-teal-500/10'
  },
  'webp-to-image': {
    id: 'webp-to-image',
    name: 'WEBP to JPG / PNG',
    desc: 'Convert WebP images into universally compatible PNG or JPG format.',
    category: 'Images',
    icon: ImageIcon,
    acceptTypes: { 'image/webp': ['.webp'] },
    maxFiles: 1,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  'pdf-to-images': {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    desc: 'Convert PDF document pages into high-resolution 150/300 DPI PNG or JPG images.',
    category: 'Images',
    icon: ImageIcon,
    badge: '300 DPI Ready',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-purple-500 bg-purple-500/10'
  },
  'images-to-pdf': {
    id: 'images-to-pdf',
    name: 'Images to PDF',
    desc: 'Merge multiple JPG, PNG, and WebP images into a single clean PDF document.',
    category: 'Images',
    icon: FileText,
    badge: 'Multi-Image',
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 30,
    color: 'text-fuchsia-500 bg-fuchsia-500/10'
  },
  'image-resize': {
    id: 'image-resize',
    name: 'Resize Image',
    desc: 'Change image pixel dimensions with anti-aliasing while maintaining crisp sharpness.',
    category: 'Images',
    icon: Maximize2,
    badge: 'Lanczos Scale',
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    color: 'text-indigo-500 bg-indigo-500/10'
  },
  'image-compress': {
    id: 'image-compress',
    name: 'Compress Image',
    desc: 'Reduce image file size significantly without visible degradation.',
    category: 'Images',
    icon: Sparkles,
    badge: 'Smart Reduction',
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  'image-crop': {
    id: 'image-crop',
    name: 'Crop Image',
    desc: 'Crop your photo to custom pixel dimensions with bounding box accuracy.',
    category: 'Images',
    icon: Crop,
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    color: 'text-amber-500 bg-amber-500/10'
  },
  'image-rotate': {
    id: 'image-rotate',
    name: 'Rotate Image',
    desc: 'Rotate images 90°, 180°, 270° or perform horizontal and vertical mirror flips.',
    category: 'Images',
    icon: RotateCw,
    acceptTypes: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    color: 'text-blue-500 bg-blue-500/10'
  },
  'pdf-protect': {
    id: 'pdf-protect',
    name: 'Protect PDF',
    desc: 'Encrypt your PDF with bank-grade AES-256 password protection and permissions.',
    category: 'PDF',
    icon: Lock,
    badge: 'AES-256',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-rose-500 bg-rose-500/10'
  },
  'pdf-unlock': {
    id: 'pdf-unlock',
    name: 'Unlock PDF',
    desc: 'Remove password protection and security restrictions from an authenticated PDF document.',
    category: 'PDF',
    icon: Unlock,
    badge: 'Instant Decrypt',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  'pdf-watermark': {
    id: 'pdf-watermark',
    name: 'Watermark PDF',
    desc: 'Stamp custom text watermarks across all pages with customizable rotation, opacity, and styling.',
    category: 'PDF',
    icon: Stamp,
    badge: 'Customizable',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-indigo-500 bg-indigo-500/10'
  },
  'pdf-page-numbers': {
    id: 'pdf-page-numbers',
    name: 'Page Numbers',
    desc: 'Add customizable page numbers and indicators with crisp vector typography.',
    category: 'PDF',
    icon: Hash,
    badge: 'Vector Stamp',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-cyan-500 bg-cyan-500/10'
  },
  'pdf-redact': {
    id: 'pdf-redact',
    name: 'Redact PDF',
    desc: 'Permanently blackout and sanitize sensitive keywords, names, and numbers from your document.',
    category: 'PDF',
    icon: EyeOff,
    badge: 'Irreversible',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-rose-600 bg-rose-600/10'
  },
  'pdf-flatten': {
    id: 'pdf-flatten',
    name: 'Flatten PDF',
    desc: 'Bake form fields, digital signatures, and comments into permanent static page content.',
    category: 'PDF',
    icon: Layers,
    badge: 'Anti-Tamper',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-amber-500 bg-amber-500/10'
  },
  'pdf-scrub-metadata': {
    id: 'pdf-scrub-metadata',
    name: 'Scrub Metadata',
    desc: 'Strip all hidden author info, creation tools, timestamps, and XMP payloads before sharing.',
    category: 'PDF',
    icon: ShieldCheck,
    badge: 'HIPAA & GDPR',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-emerald-500 bg-emerald-500/10'
  },
  'pdf-to-txt': {
    id: 'pdf-to-txt',
    name: 'PDF to Text',
    desc: 'Extract plain text content and document structure into a clean, formatted TXT file.',
    category: 'PDF',
    icon: FileText,
    badge: 'Structured TXT',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-blue-500 bg-blue-500/10'
  },
  'pdf-grayscale': {
    id: 'pdf-grayscale',
    name: 'PDF to Grayscale',
    desc: 'Convert full-color PDF documents into black & white grayscale to optimize print costs.',
    category: 'PDF',
    icon: Layers,
    badge: 'Ink Saver',
    acceptTypes: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    color: 'text-slate-400 bg-slate-500/10'
  }
}

export function ToolConverterPage() {
  const { toolId: rawToolId } = useParams<{ toolId: string }>()
  const toolId = rawToolId === 'pptx-to-pdf' ? 'ppt-to-pdf' : rawToolId
  const navigate = useNavigate()
  const location = useLocation()

  const config = toolId ? TOOL_CONFIGS[toolId] : null

  // Workflow states
  const [stagedFiles, setStagedFiles] = useState<{ file: File; uploaded?: UploadedFile }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [job, setJob] = useState<ConversionJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isQrOpen, setIsQrOpen] = useState<boolean>(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [isLinkCopied, setIsLinkCopied] = useState<boolean>(false)

  // Tool specific options
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'basic'>('recommended')
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90)
  const [rotateScope, setRotateScope] = useState<'all' | 'odd' | 'even'>('all')
  const [splitRange, setSplitRange] = useState<string>('1-2')
  const [deletePagesInput, setDeletePagesInput] = useState<string>('1')
  const [extractPagesInput, setExtractPagesInput] = useState<string>('1')
  const [reorderOrderInput, setReorderOrderInput] = useState<string>('2, 1')

  // Image specific options
  const [imageResizeWidth, setImageResizeWidth] = useState<string>('800')
  const [imageResizeHeight, setImageResizeHeight] = useState<string>('600')
  const [imageKeepRatio, setImageKeepRatio] = useState<boolean>(true)
  const [imageCropWidth, setImageCropWidth] = useState<string>('400')
  const [imageCropHeight, setImageCropHeight] = useState<string>('400')
  const [pdfImagesDpi, setPdfImagesDpi] = useState<150 | 300>(150)
  const [pdfImagesFormat, setPdfImagesFormat] = useState<'png' | 'jpg'>('png')
  const [webpTargetFormat, setWebpTargetFormat] = useState<'png' | 'jpg'>('png')

  // Security & Watermark options
  const [protectPassword, setProtectPassword] = useState<string>('')
  const [protectConfirmPassword, setProtectConfirmPassword] = useState<string>('')
  const [showProtectPassword, setShowProtectPassword] = useState<boolean>(false)
  const [unlockPassword, setUnlockPassword] = useState<string>('')
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false)
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL')
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.25)
  const [watermarkFontSize, setWatermarkFontSize] = useState<number>(42)
  const [watermarkRotation, setWatermarkRotation] = useState<number>(45)
  const [watermarkColor, setWatermarkColor] = useState<string>('#ef4444')
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right'>('bottom-center')
  const [pageNumberFormat, setPageNumberFormat] = useState<string>('Page {n} of {total}')
  const [pageNumberStart, setPageNumberStart] = useState<number>(1)
  const [pageNumberFontSize, setPageNumberFontSize] = useState<number>(10)
  const [redactKeywordsInput, setRedactKeywordsInput] = useState<string>('CONFIDENTIAL')

  useEffect(() => {
    // Reset state on tool change
    setStagedFiles([])
    setJob(null)
    setError(null)
    setIsProcessing(false)
  }, [toolId])

  if (!config) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Tool Not Found</h2>
        <p className="mt-2 text-muted-foreground">The requested tool does not exist.</p>
        <Button onClick={() => navigate('/tools')} className="mt-6">
          View All Tools
        </Button>
      </div>
    )
  }

  const handleFilesSelected = async (newFiles: File[]) => {
    setError(null)
    setIsUploading(true)

    try {
      const uploadedList: { file: File; uploaded?: UploadedFile }[] = []

      for (const file of newFiles) {
        const uploaded = await uploadFile(file)
        uploadedList.push({ file, uploaded })
      }

      setStagedFiles((prev) =>
        config.maxFiles === 1 ? uploadedList.slice(0, 1) : [...prev, ...uploadedList]
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleLoadSample = async () => {
    if (!config) return
    setError(null)
    setIsUploading(true)
    try {
      const sampleFiles = await generateSampleFiles(config.id)
      await handleFilesSelected(sampleFiles)
    } catch {
      setError('Failed to generate sample document.')
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('demo') === 'true' && config && stagedFiles.length === 0 && !job && !isUploading) {
      handleLoadSample()
    }
  }, [location.search, config?.id])

  const removeFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setStagedFiles((prev) => {
      const copy = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= copy.length) return prev
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  const handleStartConversion = async () => {
    if (stagedFiles.length === 0) return
    setError(null)
    setIsProcessing(true)

    try {
      // Build options dictionary
      const options: Record<string, unknown> = {}
      if (config.id === 'pdf-compress' || config.id === 'image-compress') {
        options.level = compressLevel
      } else if (config.id === 'pdf-rotate' || config.id === 'image-rotate') {
        options.angle = rotateAngle
        options.scope = rotateScope
      } else if (config.id === 'pdf-split') {
        options.range = splitRange
      } else if (config.id === 'pdf-delete-pages') {
        options.pages = deletePagesInput
      } else if (config.id === 'pdf-extract-pages') {
        options.pages = extractPagesInput
      } else if (config.id === 'pdf-reorder-pages') {
        options.order = reorderOrderInput
          .split(',')
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n))
      } else if (config.id === 'image-resize') {
        options.width = parseInt(imageResizeWidth) || undefined
        options.height = parseInt(imageResizeHeight) || undefined
        options.keep_ratio = imageKeepRatio
      } else if (config.id === 'image-crop') {
        options.width = parseInt(imageCropWidth) || 300
        options.height = parseInt(imageCropHeight) || 300
      } else if (config.id === 'pdf-to-images') {
        options.dpi = pdfImagesDpi
        options.format = pdfImagesFormat
      } else if (config.id === 'webp-to-image') {
        options.format = webpTargetFormat
      } else if (config.id === 'pdf-protect') {
        if (!protectPassword) {
          setError('Please enter a password.')
          setIsProcessing(false)
          return
        }
        if (protectPassword !== protectConfirmPassword) {
          setError('Passwords do not match. Please re-enter.')
          setIsProcessing(false)
          return
        }
        options.password = protectPassword
      } else if (config.id === 'pdf-unlock') {
        if (!unlockPassword) {
          setError('Please enter the password to unlock this document.')
          setIsProcessing(false)
          return
        }
        options.password = unlockPassword
      } else if (config.id === 'pdf-watermark') {
        if (!watermarkText.trim()) {
          setError('Please specify the watermark text.')
          setIsProcessing(false)
          return
        }
        options.text = watermarkText.trim()
        options.opacity = watermarkOpacity
        options.fontsize = watermarkFontSize
        options.rotation = watermarkRotation
        options.color = watermarkColor
      } else if (config.id === 'pdf-page-numbers') {
        options.position = pageNumberPosition
        options.format = pageNumberFormat
        options.start_number = pageNumberStart
        options.fontsize = pageNumberFontSize
      } else if (config.id === 'pdf-redact') {
        if (!redactKeywordsInput.trim()) {
          setError('Please specify keywords or phrases to redact.')
          setIsProcessing(false)
          return
        }
        options.keywords = redactKeywordsInput.trim()
      }

      const inputIds = stagedFiles.map((f) => f.uploaded!.id)
      const createdJob = await createJob(config.id, inputIds, options)
      setJob(createdJob)

      // Poll until completion
      const pollInterval = setInterval(async () => {
        try {
          const current = await fetchJob(createdJob.id)
          setJob(current)
          if (current.status === 'completed' || current.status === 'failed') {
            clearInterval(pollInterval)
            setIsProcessing(false)
            if (current.status === 'failed') {
              setError(current.error_message || 'Conversion execution failed.')
            } else if (current.status === 'completed' && current.output_file_id) {
              const baseName = stagedFiles[0]?.file.name.replace(/\.[^/.]+$/, '') || 'converted'
              const ext =
                config.id === 'pdf-to-word'
                  ? '.docx'
                  : config.id === 'pdf-to-images'
                  ? '.zip'
                  : config.id === 'pdf-to-txt'
                  ? '.txt'
                  : config.category === 'Images'
                  ? '.png'
                  : '.pdf'
              const outputFilename = `${baseName}_converted${ext}`

              addRecentConversion({
                jobId: current.id,
                toolId: config.id,
                toolName: config.name,
                inputName: stagedFiles[0]?.file.name || 'uploaded_document',
                outputFileId: current.output_file_id,
                outputFilename,
                sizeBytes: stagedFiles[0]?.file.size || 0,
                mimeType: stagedFiles[0]?.file.type || 'application/octet-stream',
                timestamp: Date.now(),
              })
            }
          }
        } catch {
          clearInterval(pollInterval)
          setIsProcessing(false)
          setError('Failed to poll conversion status.')
        }
      }, 700)
    } catch (err: unknown) {
      setIsProcessing(false)
      setError(err instanceof Error ? err.message : 'Job execution failed.')
    }
  }

  const resetAll = () => {
    setStagedFiles([])
    setJob(null)
    setError(null)
    setIsProcessing(false)
    setIsQrOpen(false)
    setIsPreviewOpen(false)
    setIsLinkCopied(false)
  }

  const baseName = stagedFiles[0]?.file.name.replace(/\.[^/.]+$/, '') || 'converted'
  const ext =
    config.id === 'pdf-to-word'
      ? '.docx'
      : config.id === 'pdf-to-images'
      ? '.zip'
      : config.id === 'pdf-to-txt'
      ? '.txt'
      : config.category === 'Images'
      ? '.png'
      : '.pdf'
  const currentOutputFilename = `${baseName}_converted${ext}`
  const currentDownloadUrl = job?.output_file_id ? getDownloadUrl(job.output_file_id) : ''

  const handleCopyLink = async () => {
    if (!currentDownloadUrl) return
    try {
      const fullUrl = currentDownloadUrl.startsWith('http')
        ? currentDownloadUrl
        : `${window.location.origin}${currentDownloadUrl}`
      await navigator.clipboard.writeText(fullUrl)
      setIsLinkCopied(true)
      setTimeout(() => setIsLinkCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  const Icon = config.icon

  return (
    <div className="py-12 md:py-16">
      <SeoHead
        title={`${config.name} — Free Online Tool | Convertly V2`}
        description={config.desc}
        canonicalUrl={`https://convertly.app/tools/${config.id}`}
        breadcrumbs={[
          { name: 'Home', item: 'https://convertly.app/' },
          { name: 'Tools', item: 'https://convertly.app/tools' },
          { name: config.name, item: `https://convertly.app/tools/${config.id}` }
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to All Tools
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-400">
              <ShieldCheck className="h-3 w-3" /> Zero Retention (120m)
            </span>
          </div>
        </div>

        {/* Tool Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground">
            {config.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {config.desc}
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Error: </span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* COMPLETED VIEW */}
        {job && job.status === 'completed' && job.output_file_id ? (
          <Card className="border-emerald-500/30 bg-gradient-to-br from-card/80 to-emerald-500/5 p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="font-heading text-2xl font-bold text-foreground">
              Conversion Completed Successfully!
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your verified file is ready for download. It will be permanently shredded in 120 minutes.
            </p>

            {/* Metrics Breakdown if available */}
            {job.options?.savings_ratio_percent !== undefined && (
              <div className="my-6 inline-flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-card/60 px-4 py-2 text-xs">
                <span className="text-muted-foreground">Size Reduction:</span>
                <span className="font-bold text-emerald-400">
                  {String(job.options.savings_ratio_percent)}% saved
                </span>
                <span className="text-muted-foreground">
                  ({formatBytes(Number(job.options.original_size_bytes))} → {formatBytes(Number(job.options.compressed_size_bytes))})
                </span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={currentDownloadUrl}
                download={currentOutputFilename}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Converted {
                  config.id === 'pdf-to-word'
                    ? 'Word Document (.docx)'
                    : config.id === 'pdf-to-images'
                    ? 'Images (.zip)'
                    : config.category === 'Images'
                    ? 'Image File'
                    : 'PDF Document'
                }
              </a>

              <button
                onClick={() => setIsPreviewOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4 text-indigo-400" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => setIsQrOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
                title="Transfer file directly to smartphone via QR Code"
              >
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all cursor-pointer"
                title="Copy secure download link (expires in 120m)"
              >
                {isLinkCopied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <Button variant="outline" size="md" onClick={resetAll} className="w-full sm:w-auto py-3">
                <RefreshCw className="h-4 w-4 mr-2" />
                Convert Another
              </Button>
            </div>
          </Card>
        ) : (
          /* WORKFLOW: UPLOAD & CONFIGURATION */
          <div className="space-y-8">
            
            {/* 1. Staging / Upload Target */}
            {stagedFiles.length === 0 ? (
              <div className="space-y-3">
                <Dropzone
                  onFilesSelected={handleFilesSelected}
                  accept={config.acceptTypes}
                  maxFiles={config.maxFiles}
                  disabled={isUploading}
                  hintText={
                    config.maxFiles > 1
                      ? `Drop multiple ${config.category} files here (up to ${config.maxFiles})`
                      : `Drop your ${config.name} file here (up to 100MB)`
                  }
                />
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleLoadSample}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Try with Sample Document</span>
                  </button>
                </div>
              </div>
            ) : (
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      Staged Document{stagedFiles.length > 1 ? 's' : ''} ({stagedFiles.length})
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {formatBytes(stagedFiles.reduce((acc, f) => acc + f.file.size, 0))} total
                    </span>
                    {(config.id === 'pdf-merge' || config.id === 'images-to-pdf') && (
                      <span className="hidden sm:inline text-[11px] text-muted-foreground">
                        • Reorder sequence
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {stagedFiles.length > 1 && (
                      <button
                        onClick={() => setStagedFiles([])}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer transition-colors"
                      >
                        Clear All
                      </button>
                    )}

                    {config.maxFiles > stagedFiles.length && (
                      <label className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer">
                        + Add More
                        <input
                          type="file"
                          accept={Object.keys(config.acceptTypes).join(',')}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) {
                              handleFilesSelected(Array.from(e.target.files))
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Staged File Cards */}
                <div className="mt-4 space-y-2.5">
                  {stagedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2.5 text-xs transition-all hover:border-border"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {(config.id === 'pdf-merge' || config.id === 'images-to-pdf') && (
                          <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        )}
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-[10px] font-mono font-semibold text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">{item.file.name}</p>
                          <p className="text-[11px] text-muted-foreground">{formatBytes(item.file.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(config.id === 'pdf-merge' || config.id === 'images-to-pdf') && stagedFiles.length > 1 && (
                          <div className="flex items-center gap-0.5 mr-1">
                            <button
                              onClick={() => moveFile(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 cursor-pointer transition-colors"
                              title="Move Up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => moveFile(idx, 'down')}
                              disabled={idx === stagedFiles.length - 1}
                              className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-20 cursor-pointer transition-colors"
                              title="Move Down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => removeFile(idx)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 2. Tool Specific Options Panel */}
            {stagedFiles.length > 0 && (
              <Card className="p-6">
                <CardTitle className="text-base mb-4">Configuration & Options</CardTitle>

                {/* Compress Options */}
                {config.id === 'pdf-compress' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'recommended', label: 'Recommended', desc: 'Optimal balance of reduction and visual sharpness.' },
                      { id: 'extreme', label: 'Maximum Compression', desc: 'Smallest file size for email and web uploads.' },
                      { id: 'basic', label: 'Lossless Clean', desc: 'Cleans metadata and unreferenced streams without quality drop.' },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setCompressLevel(opt.id as any)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          compressLevel === opt.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm'
                            : 'border-border/80 bg-card/40 text-muted-foreground hover:border-border hover:bg-card'
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground mb-1">{opt.label}</div>
                        <div className="text-[11px] leading-relaxed">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rotate Options */}
                {config.id === 'pdf-rotate' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Rotation Angle</span>
                      <div className="flex gap-3">
                        {[
                          { angle: 90, label: '90° Clockwise' },
                          { angle: 180, label: '180° Inverted' },
                          { angle: 270, label: '270° Counter-CW' },
                        ].map((item) => (
                          <button
                            key={item.angle}
                            onClick={() => setRotateAngle(item.angle as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              rotateAngle === item.angle
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Target Pages</span>
                      <div className="flex gap-3">
                        {[
                          { id: 'all', label: 'All Pages' },
                          { id: 'odd', label: 'Odd Pages Only' },
                          { id: 'even', label: 'Even Pages Only' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setRotateScope(item.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              rotateScope === item.id
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Split Options */}
                {config.id === 'pdf-split' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Page Ranges to Extract
                    </label>
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 7-10"
                      className="w-full sm:w-80 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Separate page ranges with commas, e.g. "1-2, 4" creates a PDF with those exact pages.
                    </p>
                  </div>
                )}

                {/* Delete Pages Options */}
                {config.id === 'pdf-delete-pages' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Pages to Delete
                    </label>
                    <input
                      type="text"
                      value={deletePagesInput}
                      onChange={(e) => setDeletePagesInput(e.target.value)}
                      placeholder="e.g. 2, 4-6"
                      className="w-full sm:w-80 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      At least one page must remain in the document.
                    </p>
                  </div>
                )}

                {/* Extract Pages Options */}
                {config.id === 'pdf-extract-pages' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Pages to Extract
                    </label>
                    <input
                      type="text"
                      value={extractPagesInput}
                      onChange={(e) => setExtractPagesInput(e.target.value)}
                      placeholder="e.g. 1, 3, 5-8"
                      className="w-full sm:w-80 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Reorder Pages Options */}
                {config.id === 'pdf-reorder-pages' && (
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      New Page Sequence
                    </label>
                    <input
                      type="text"
                      value={reorderOrderInput}
                      onChange={(e) => setReorderOrderInput(e.target.value)}
                      placeholder="e.g. 3, 1, 2"
                      className="w-full sm:w-80 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Specify the new order of pages as comma-separated 1-indexed numbers.
                    </p>
                  </div>
                )}

                {/* PDF Merge Note */}
                {config.id === 'pdf-merge' && (
                  <p className="text-xs text-muted-foreground">
                    Documents will be merged in the top-to-bottom order displayed above. Ensure you have at least 2 files.
                  </p>
                )}

                {/* Image Resize Options */}
                {config.id === 'image-resize' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Target Width (px)</label>
                        <input
                          type="number"
                          value={imageResizeWidth}
                          onChange={(e) => setImageResizeWidth(e.target.value)}
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">Target Height (px)</label>
                        <input
                          type="number"
                          value={imageResizeHeight}
                          onChange={(e) => setImageResizeHeight(e.target.value)}
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imageKeepRatio}
                        onChange={(e) => setImageKeepRatio(e.target.checked)}
                        className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Maintain original aspect ratio</span>
                    </label>
                  </div>
                )}

                {/* Image Compress Options */}
                {config.id === 'image-compress' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'recommended', label: 'Balanced (80%)', desc: 'Drastically smaller size with no visible artifacts.' },
                      { id: 'extreme', label: 'Maximum (60%)', desc: 'Greatest reduction for messaging & fast web loading.' },
                      { id: 'basic', label: 'High Quality (90%)', desc: 'Minimal compression preserving maximum detail.' },
                    ].map((opt) => (
                      <div
                        key={opt.id}
                        onClick={() => setCompressLevel(opt.id as any)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          compressLevel === opt.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-foreground shadow-sm'
                            : 'border-border/80 bg-card/40 text-muted-foreground hover:border-border hover:bg-card'
                        }`}
                      >
                        <div className="font-semibold text-xs text-foreground mb-1">{opt.label}</div>
                        <div className="text-[11px] leading-relaxed">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Crop Options */}
                {config.id === 'image-crop' && (
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Crop Width (px)</label>
                      <input
                        type="number"
                        value={imageCropWidth}
                        onChange={(e) => setImageCropWidth(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Crop Height (px)</label>
                      <input
                        type="number"
                        value={imageCropHeight}
                        onChange={(e) => setImageCropHeight(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* PDF to Images Options */}
                {config.id === 'pdf-to-images' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Resolution (DPI)</span>
                      <div className="flex gap-3">
                        {[
                          { dpi: 150, label: 'Standard Web (150 DPI)' },
                          { dpi: 300, label: 'High Resolution Print (300 DPI)' },
                        ].map((item) => (
                          <button
                            key={item.dpi}
                            onClick={() => setPdfImagesDpi(item.dpi as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              pdfImagesDpi === item.dpi
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-2">Output Format</span>
                      <div className="flex gap-3">
                        {['png', 'jpg'].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setPdfImagesFormat(fmt as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase border transition-all cursor-pointer ${
                              pdfImagesFormat === fmt
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* WEBP to Image Options */}
                {config.id === 'webp-to-image' && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-2">Target Format</span>
                    <div className="flex gap-3">
                      {['png', 'jpg'].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setWebpTargetFormat(fmt as any)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase border transition-all cursor-pointer ${
                            webpTargetFormat === fmt
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                              : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protect PDF Options */}
                {config.id === 'pdf-protect' && (
                  <div className="space-y-4 max-w-md">
                    <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs flex items-center gap-2.5">
                      <Lock className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>Secured with military-grade AES-256 bit document encryption.</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Document Password</label>
                      <div className="relative">
                        <input
                          type={showProtectPassword ? 'text' : 'password'}
                          value={protectPassword}
                          onChange={(e) => setProtectPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-rose-500 focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProtectPassword(!showProtectPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showProtectPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Confirm Password</label>
                      <input
                        type={showProtectPassword ? 'text' : 'password'}
                        value={protectConfirmPassword}
                        onChange={(e) => setProtectConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Unlock PDF Options */}
                {config.id === 'pdf-unlock' && (
                  <div className="space-y-4 max-w-md">
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-xs flex items-center gap-2.5">
                      <Unlock className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Decrypts the document and permanently removes password restrictions.</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Current Password</label>
                      <div className="relative">
                        <input
                          type={showUnlockPassword ? 'text' : 'password'}
                          value={unlockPassword}
                          onChange={(e) => setUnlockPassword(e.target.value)}
                          placeholder="Enter current document password"
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showUnlockPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Watermark PDF Options */}
                {config.id === 'pdf-watermark' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">Watermark Text</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="e.g. CONFIDENTIAL, DRAFT"
                        className="w-full sm:w-96 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'ORIGINAL'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setWatermarkText(preset)}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-indigo-500/50"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Opacity ({Math.round(watermarkOpacity * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0.05"
                          max="0.8"
                          step="0.05"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Font Size ({watermarkFontSize}pt)
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="90"
                          step="2"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Angle ({watermarkRotation}°)
                        </label>
                        <div className="flex gap-2">
                          {[0, 45, -45, 90].map((angle) => (
                            <button
                              key={angle}
                              type="button"
                              onClick={() => setWatermarkRotation(angle)}
                              className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer ${
                                watermarkRotation === angle
                                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                  : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {angle}°
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Color</label>
                      <div className="flex gap-2.5 items-center">
                        {[
                          { hex: '#ef4444', label: 'Red' },
                          { hex: '#64748b', label: 'Slate' },
                          { hex: '#3b82f6', label: 'Blue' },
                          { hex: '#10b981', label: 'Green' },
                          { hex: '#f59e0b', label: 'Amber' }
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setWatermarkColor(c.hex)}
                            title={c.label}
                            style={{ backgroundColor: c.hex }}
                            className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                              watermarkColor === c.hex ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Page Numbers Options */}
                {config.id === 'pdf-page-numbers' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-2">Number Placement</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl">
                        {[
                          { id: 'bottom-center', label: 'Bottom Center' },
                          { id: 'bottom-right', label: 'Bottom Right' },
                          { id: 'bottom-left', label: 'Bottom Left' },
                          { id: 'top-right', label: 'Top Right' }
                        ].map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setPageNumberPosition(pos.id as any)}
                            className={`px-3 py-2 text-xs rounded-xl border text-center font-medium transition-all cursor-pointer ${
                              pageNumberPosition === pos.id
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-border bg-card/40 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Format Pattern</label>
                        <select
                          value={pageNumberFormat}
                          onChange={(e) => setPageNumberFormat(e.target.value)}
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="Page {n} of {total}">Page 1 of 10</option>
                          <option value="{n} / {total}">1 / 10</option>
                          <option value="{n}">1 (Number Only)</option>
                          <option value="- {n} -">- 1 -</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Start Number</label>
                        <input
                          type="number"
                          min="1"
                          value={pageNumberStart}
                          onChange={(e) => setPageNumberStart(parseInt(e.target.value) || 1)}
                          className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Font Size ({pageNumberFontSize}pt)</label>
                        <input
                          type="range"
                          min="8"
                          max="20"
                          step="1"
                          value={pageNumberFontSize}
                          onChange={(e) => setPageNumberFontSize(parseInt(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Redact PDF Options */}
                {config.id === 'pdf-redact' && (
                  <div className="space-y-4 max-w-lg">
                    <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs flex items-center gap-2.5">
                      <EyeOff className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>Permanent, irreversible redaction. Matching keywords are purged directly from the document binary stream.</span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1.5">
                        Keywords / Phrases to Redact (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={redactKeywordsInput}
                        onChange={(e) => setRedactKeywordsInput(e.target.value)}
                        placeholder="e.g. SSN, 123-45-6789, Confidential, John Doe"
                        className="w-full rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs text-foreground focus:border-rose-500 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['CONFIDENTIAL', 'SSN', 'DO NOT DISCLOSE', 'PASSWORD', 'FINANCIAL'].map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => {
                              const current = redactKeywordsInput.trim()
                              setRedactKeywordsInput(current ? `${current}, ${kw}` : kw)
                            }}
                            className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-rose-500/50"
                          >
                            + {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Flatten PDF Options */}
                {config.id === 'pdf-flatten' && (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3 max-w-lg">
                    <Layers className="h-5 w-5 shrink-0 text-amber-400" />
                    <span>
                      All interactive form fields, checkboxes, and digital comments will be permanently baked into static vector page content, preventing future tampering.
                    </span>
                  </div>
                )}

                {/* Scrub Metadata Options */}
                {config.id === 'pdf-scrub-metadata' && (
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-xs flex items-center gap-3 max-w-lg">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>
                      All hidden metadata (Author, Creation Tool, Subject, Keywords, XMP streams, and embedded thumbnails) will be permanently sanitized for strict GDPR and HIPAA compliance.
                    </span>
                  </div>
                )}

                {/* PDF to Text Notice */}
                {config.id === 'pdf-to-txt' && (
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-300 text-xs flex items-center gap-3 max-w-lg">
                    <FileText className="h-5 w-5 shrink-0 text-blue-400" />
                    <span>
                      Extracts plain text across all pages with clean structural demarcation, formatted into a lightweight, downloadable UTF-8 text document.
                    </span>
                  </div>
                )}

                {/* PDF to Grayscale Notice */}
                {config.id === 'pdf-grayscale' && (
                  <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-500/5 text-slate-300 text-xs flex items-center gap-3 max-w-lg">
                    <Layers className="h-5 w-5 shrink-0 text-slate-400" />
                    <span>
                      Converts all colored text, photos, and vector shapes into true monochrome grayscale to save printing toner and reduce document size.
                    </span>
                  </div>
                )}

                {/* Images to PDF Note */}
                {config.id === 'images-to-pdf' && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded photos will be consolidated into a multi-page PDF in the exact order shown above.
                  </p>
                )}
              </Card>
            )}

            {/* Processing Progress Indicator */}
            {isProcessing && (
              <Card className="p-6 text-center border-indigo-500/30">
                <div className="flex items-center justify-center gap-2 font-semibold text-xs text-foreground mb-3">
                  <Clock className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>Executing Document Engine Transformation...</span>
                </div>
                <Progress value={job?.progress || 35} className="max-w-md mx-auto" />
              </Card>
            )}

            {/* Action Bar */}
            {stagedFiles.length > 0 && !isProcessing && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="md" onClick={resetAll}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={config.id === 'pdf-merge' && stagedFiles.length < 2}
                  onClick={handleStartConversion}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {config.id === 'pdf-merge' ? 'Merge Documents' : 'Process File Now'}
                </Button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Mobile Transfer & Document Preview Modals */}
      <QrTransferModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        downloadUrl={currentDownloadUrl}
        filename={currentOutputFilename}
      />

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        downloadUrl={currentDownloadUrl}
        filename={currentOutputFilename}
        toolTitle={config.name}
      />
    </div>
  )
}
