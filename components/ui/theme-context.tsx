'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type AppTheme = 'bento-minimal' | 'dark-glass' | 'neumorphism-soft'

interface ThemeContextType {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'bento-minimal',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('bento-minimal')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app-ui-theme') as AppTheme | null
      if (stored === 'dark-glass' || stored === 'bento-minimal' || stored === 'neumorphism-soft') {
        setThemeState(stored)
        applyThemeClass(stored)
      } else {
        setThemeState('bento-minimal')
        applyThemeClass('bento-minimal')
      }
    } catch {
      applyThemeClass('bento-minimal')
    }
  }, [])

  function applyThemeClass(t: AppTheme) {
    const root = document.documentElement
    root.classList.remove('theme-bento-minimal', 'theme-dark-glass', 'theme-neumorphism-soft', 'dark', 'light')

    if (t === 'dark-glass') {
      root.classList.add('dark', 'theme-dark-glass')
    } else if (t === 'neumorphism-soft') {
      root.classList.add('light', 'theme-neumorphism-soft')
    } else {
      root.classList.add('light', 'theme-bento-minimal')
    }
  }

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme)
    applyThemeClass(newTheme)
    try {
      localStorage.setItem('app-ui-theme', newTheme)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
