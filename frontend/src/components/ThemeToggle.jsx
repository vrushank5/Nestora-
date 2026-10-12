import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/useTheme.js'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${nextTheme} mode`
  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}
