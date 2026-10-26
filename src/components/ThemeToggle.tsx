import { Moon, Sun } from 'lucide-react'
import { cx } from '../lib/format'
import { resolveTheme, setTheme, useTheme } from '../lib/theme'

export function ThemeToggle({
  onDark = false,
  className,
}: {
  onDark?: boolean
  className?: string
}) {
  const [mode] = useTheme()
  const dark = resolveTheme(mode) === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={cx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
        onDark
          ? 'border-white/12 bg-white/[0.06] text-white/65 hover:border-white/25 hover:text-white'
          : 'border-forest-900/10 bg-white text-forest-700 hover:border-forest-900/20 hover:text-forest-900',
        className,
      )}
    >
      {dark ? <Sun size={15} strokeWidth={1.9} /> : <Moon size={15} strokeWidth={1.9} />}
    </button>
  )
}
