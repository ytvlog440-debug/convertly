import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'Ctrl K / ⌘ K', desc: 'Open Global Command Palette (search all 31 tools)' },
  { key: 'Esc', desc: 'Close any active modal, preview, or drawer' },
  { key: '?', desc: 'Toggle this keyboard shortcuts cheatsheet' },
  { key: 'Tab', desc: 'Navigate between interactive controls and buttons' },
  { key: 'Enter', desc: 'Execute focused action or trigger conversion' },
]

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
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
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Keyboard Shortcuts
              </h3>
              <p className="text-xs text-muted-foreground">Power user navigation commands</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-5 space-y-3">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-3.5 py-2.5 text-xs"
            >
              <span className="text-muted-foreground">{item.desc}</span>
              <kbd className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] font-semibold text-foreground shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
