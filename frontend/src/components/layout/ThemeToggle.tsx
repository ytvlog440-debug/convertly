import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle visual theme"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card/60 text-muted-foreground transition-all duration-200 hover:border-border hover:bg-card hover:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 shrink-0 text-indigo-500 transition-transform duration-200 rotate-0 scale-100" />
      )}
    </button>
  )
}
