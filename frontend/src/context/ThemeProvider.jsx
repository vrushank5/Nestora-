import { useCallback, useMemo, useState } from 'react'
import { ThemeContext } from './themeContext.js'

const THEME_STORAGE_KEY = 'nestora-theme'

function getInitialTheme() {
  const appliedTheme = document.documentElement.dataset.theme
  if (appliedTheme === 'dark' || appliedTheme === 'light') return appliedTheme

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
  } catch (error) {
    console.error('Unable to read the saved Nestora theme preference.', error)
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') {
      throw new TypeError(`Unsupported Nestora theme: ${nextTheme}`)
    }

    document.documentElement.dataset.theme = nextTheme
    setThemeState(nextTheme)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch (error) {
      console.error('Unable to save the Nestora theme preference.', error)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
