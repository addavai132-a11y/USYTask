'use client'

import { Sun, Moon } from 'lucide-react'
import { useThemeMode } from './theme-mode-context'
import { cn } from '@/lib/utils'

export function ThemeModeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm transition-all active:scale-90 dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white',
        className
      )}
    >
      {isDark ? (
        <Sun className="size-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="size-5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
