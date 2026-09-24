import { useState, useEffect } from 'react'
import {
  History,
  X,
  Download,
  Trash2,
  FileCheck2,
  Clock,
  ShieldCheck
} from 'lucide-react'
import {
  getRecentConversions,
  clearRecentConversions,
  type ConversionHistoryItem
} from '../../lib/history'
import { getDownloadUrl } from '../../lib/api'
import { formatBytes } from '../../lib/utils'
import { trackDownloadStarted, trackDownloadCompleted } from '../../lib/analytics'

interface RecentActivityDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function RecentActivityDrawer({ isOpen, onClose }: RecentActivityDrawerProps) {
  const [items, setItems] = useState<ConversionHistoryItem[]>([])

  const loadItems = () => {
    setItems(getRecentConversions())
  }

  useEffect(() => {
    if (isOpen) {
      loadItems()
    }
  }, [isOpen])

  useEffect(() => {
    const handleUpdate = () => loadItems()
    window.addEventListener('convertly:history_updated', handleUpdate)
    return () => window.removeEventListener('convertly:history_updated', handleUpdate)
  }, [])

  if (!isOpen) return null

  const handleClear = () => {
    clearRecentConversions()
    setItems([])
  }

  const getRemainingMinutes = (timestamp: number) => {
    const elapsedMinutes = Math.floor((Date.now() - timestamp) / (60 * 1000))
    const remaining = 120 - elapsedMinutes
    return Math.max(0, remaining)
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md h-full bg-card/95 border-l border-border/80 p-6 shadow-2xl backdrop-blur-2xl flex flex-col justify-between transition-transform animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Recent Conversions</h3>
                <p className="text-[11px] text-muted-foreground">Session file activity & downloads</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Retention Privacy Notice */}
          <div className="my-4 p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-2.5 text-xs text-indigo-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>Files are automatically deleted after 120 minutes.</span>
          </div>

          {/* List of conversions */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {items.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <FileCheck2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">No recent conversions</p>
                <p className="mt-1">Files you convert will appear here for fast re-downloading.</p>
              </div>
            ) : (
              items.map((item) => {
                const remainingMins = getRemainingMinutes(item.timestamp)
                const downloadUrl = getDownloadUrl(item.outputFileId)

                return (
                  <div
                    key={item.jobId}
                    className="p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card/90 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="inline-block rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20 mb-1">
                          {item.toolName}
                        </span>
                        <h4 className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={item.outputFilename}>
                          {item.outputFilename}
                        </h4>
                      </div>
                      <a
                        href={downloadUrl}
                        download={item.outputFilename}
                        onClick={() => {
                          const ext = item.outputFilename.split('.').pop()?.toLowerCase()
                          trackDownloadStarted({
                            tool_name: item.toolName,
                            output_format: ext,
                            file_size: item.sizeBytes,
                          })
                          trackDownloadCompleted({
                            tool_name: item.toolName,
                            output_format: ext,
                            file_size: item.sizeBytes,
                            success: true,
                          })
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                      <span>{formatBytes(item.sizeBytes)}</span>
                      <div className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>{remainingMins}m TTL remaining</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer with Clear All */}
        {items.length > 0 && (
          <div className="border-t border-border/60 pt-4 mt-auto">
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-secondary/40 py-2 text-xs font-semibold text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Recent History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
