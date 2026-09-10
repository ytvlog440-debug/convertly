import { useState, useEffect } from 'react'
import { X, Download, FileText, Maximize2, Minimize2, Eye } from 'lucide-react'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  downloadUrl: string
  filename: string
  toolTitle?: string
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  downloadUrl,
  filename,
  toolTitle = 'Converted File'
}: DocumentPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isPdf = filename.toLowerCase().endsWith('.pdf')
  const isImage = /\.(png|jpe?g|webp|gif|bmp)$/i.test(filename)
  const isText = filename.toLowerCase().endsWith('.txt')
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoadingText, setIsLoadingText] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && isText) {
      setIsLoadingText(true)
      fetch(downloadUrl)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt)
          setIsLoadingText(false)
        })
        .catch(() => {
          setTextContent('Unable to load document text preview.')
          setIsLoadingText(false)
        })
    } else {
      setTextContent(null)
    }
  }, [isOpen, isText, downloadUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none border-none'
            : 'w-full max-w-5xl h-[85vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-border/60 bg-card/90 px-4 sm:px-6 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div className="truncate">
              <h3 className="font-heading text-sm font-bold text-foreground truncate">
                {filename}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Document Preview • {toolTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={filename}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto bg-secondary/30 p-2 sm:p-4 flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={`${downloadUrl}#toolbar=1&navpanes=0`}
              title={filename}
              className="w-full h-full rounded-xl border border-border/60 bg-background shadow-inner"
            />
          ) : isImage ? (
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={downloadUrl}
                alt={filename}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-border/80"
              />
            </div>
          ) : isText ? (
            <div className="w-full h-full overflow-auto rounded-xl border border-border/80 bg-background p-6 font-mono text-xs text-foreground shadow-inner">
              {isLoadingText ? (
                <p className="text-muted-foreground">Loading preview...</p>
              ) : (
                <pre className="whitespace-pre-wrap">{textContent}</pre>
              )}
            </div>
          ) : (
            <div className="text-center p-8 max-w-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <FileText className="h-7 w-7" />
              </div>
              <h4 className="font-heading text-base font-bold text-foreground">
                Preview Not Supported
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                In-browser preview is not available for this binary format. Please download the file to inspect it in your desktop application.
              </p>
              <a
                href={downloadUrl}
                download={filename}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download File Now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
