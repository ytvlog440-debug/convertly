import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Layers, Menu, X, Search, History } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useHealth } from '../../hooks/useHealth'
import { CommandPalette } from '../common/CommandPalette'
import { RecentActivityDrawer } from '../common/RecentActivityDrawer'
import { ShortcutsModal } from '../common/ShortcutsModal'
import { getRecentConversions } from '../../lib/history'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)
  const { data: health, isLoading, isError } = useHealth()
  const location = useLocation()

  useEffect(() => {
    const updateCount = () => {
      setHistoryCount(getRecentConversions().length)
    }
    updateCount()

    const handleTogglePalette = () => setIsPaletteOpen((prev) => !prev)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return
      if (e.key === '?') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
      }
    }

    window.addEventListener('convertly:history_updated', updateCount)
    window.addEventListener('convertly:toggle_command_palette', handleTogglePalette)
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('convertly:history_updated', updateCount)
      window.removeEventListener('convertly:toggle_command_palette', handleTogglePalette)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  const navLinks = [
    { name: 'All Tools', href: '/tools' },
    { name: 'PDF Suite', href: '/tools?category=pdf' },
    { name: 'Office ⇄ PDF', href: '/tools?category=office' },
    { name: 'Image Suite', href: '/tools?category=images' },
    { name: 'Guides', href: '/guides' },
    { name: 'Blog', href: '/blog' },
  ]

  const isHealthy = !isLoading && !isError && (health?.status === 'healthy' || health?.status === 'degraded')

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                  Convertly
                </span>
                <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                  v2.0
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname + location.search === link.href
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-secondary text-foreground font-semibold'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions & Health Status */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search trigger button */}
            <div role="search">
              <button
                type="button"
                aria-label="Search all 30 conversion tools"
                onClick={() => setIsPaletteOpen(true)}
                className="hidden lg:flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search 30 tools...</span>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">Ctrl K</kbd>
              </button>
            </div>

            {/* Recent Activity Drawer trigger button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              title="Recent file conversions"
              className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all cursor-pointer"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline text-[11px]">Recent</span>
              {historyCount > 0 && (
                <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Real-time Engine Pulse */}
            <div
              title={
                isLoading
                  ? 'Connecting to Document Engine...'
                  : isHealthy
                  ? `Core Engine Operational (v${health?.version || '2.0.0'})`
                  : 'Core Engine Offline'
              }
              className="hidden xl:flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span className="relative flex h-2 w-2">
                {isHealthy && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isLoading
                      ? 'bg-amber-400'
                      : isHealthy
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span className="text-[11px] font-medium">
                {isLoading ? 'Connecting' : isHealthy ? 'Engines Online' : 'Offline'}
              </span>
            </div>

            <ThemeToggle />

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
              aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Core Engines:</span>
            <span className={`font-semibold ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isHealthy ? 'Operational' : 'Unavailable'}
            </span>
          </div>
        </div>
      )}
    </header>

    {/* Global Command Palette, Recent Activity Drawer & Shortcuts Modal */}
    <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    <RecentActivityDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
  </>
  )
}
