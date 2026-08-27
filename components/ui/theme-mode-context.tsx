'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light'

interface ThemeModeContextType {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextType>({
  mode: 'light',
  setMode: () => {},
  toggleMode: () => {},
})

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme-mode') as ThemeMode | null
      if (stored === 'light' || stored === 'dark') {
        setModeState(stored)
        applyModeClass(stored)
      } else {
        setModeState('light')
        applyModeClass('light')
      }
    } catch {
      applyModeClass('light')
    }
  }, [])

  function applyModeClass(m: ThemeMode) {
    const root = document.documentElement
    if (m === 'light') {
      root.classList.add('light')
      root.classList.remove('dark')
    } else {
      root.classList.add('dark')
      root.classList.remove('light')
    }
  }

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    applyModeClass(newMode)
    try {
      localStorage.setItem('theme-mode', newMode)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
  }

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  return useContext(ThemeModeContext)
}
