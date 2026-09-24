import { useState, useEffect } from 'react'
import { X, Smartphone, Copy, Check, ShieldCheck, Clock } from 'lucide-react'
import { generateQrDataUrl } from '../../lib/qr'

interface QrTransferModalProps {
  isOpen: boolean
  onClose: () => void
  downloadUrl: string
  filename: string
}

export function QrTransferModal({ isOpen, onClose, downloadUrl, filename }: QrTransferModalProps) {
  const [qrSrc, setQrSrc] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)

  // Absolute URL for the QR code
  const absoluteUrl = downloadUrl.startsWith('http')
    ? downloadUrl
    : `${window.location.origin}${downloadUrl}`

  useEffect(() => {
    if (isOpen && absoluteUrl) {
      generateQrDataUrl(absoluteUrl).then((url) => setQrSrc(url))
    }
  }, [isOpen, absoluteUrl])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl shadow-indigo-500/10 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Download on Phone
              </h3>
              <p className="text-xs text-muted-foreground">Scan QR to transfer file instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="rounded-2xl border border-border/80 bg-white p-3 shadow-inner">
            {qrSrc ? (
              <img
                src={qrSrc}
                alt="File download QR code"
                className="h-56 w-56 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-xs text-slate-500">
                Generating QR code...
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs font-medium text-foreground max-w-[280px] truncate">
            {filename}
          </p>

          <p className="mt-1 text-center text-[11px] text-muted-foreground max-w-xs">
            Open your smartphone camera or QR scanner and point it at this screen to download immediately.
          </p>
        </div>

        {/* Privacy & Expiration Notice */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Link expires in 120m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>120-minute temporary retention</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-secondary/70 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted-foreground" />
                <span>Copy Direct Link</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
