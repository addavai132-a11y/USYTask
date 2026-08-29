'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-mode-context'
import { cn } from '@/lib/utils'

export function ThemeModeToggle({ className }: { className?: string }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { mode, toggleMode } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Bloqueo: Si no estamos en la página principal del dashboard, no renderizamos el switch
  if (pathname !== '/app') {
    return null
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex h-7 sm:h-8 items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 dark:border-purple-500/20 bg-slate-100 dark:bg-white/[0.04] px-2 sm:px-2.5 py-1 animate-pulse shrink-0',
          className
        )}
      >
        <div className="size-3.5 rounded-full bg-slate-300 dark:bg-purple-500/20" />
        <div className="h-3 w-14 rounded-full bg-slate-300 dark:bg-purple-500/20 hidden sm:block" />
        <div className="h-4 w-7 rounded-full bg-slate-300 dark:bg-purple-500/20" />
      </div>
    )
  }

  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={cn(
        'group flex items-center gap-1.5 sm:gap-2 rounded-full px-2 sm:px-2.5 py-1 text-xs font-medium transition-all duration-300 ease-in-out shrink-0 active:scale-95 shadow-2xs',
        isDark
          ? 'border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200'
          : 'border border-slate-300/80 bg-slate-100 hover:bg-slate-200/80 text-gray-700',
        className
      )}
    >
      {/* Icono animado */}
      <div className="flex items-center justify-center">
        {isDark ? (
          <Moon className="size-3.5 text-purple-300 transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun className="size-3.5 text-amber-500 transition-transform duration-300 group-hover:rotate-45" />
        )}
      </div>

      {/* Texto explicativo */}
      <span
        className={cn(
          'text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-300 hidden sm:inline',
          isDark ? 'text-purple-200' : 'text-gray-700'
        )}
      >
        {isDark ? 'Modo oscuro' : 'Modo claro'}
      </span>

      {/* Interruptor Switch interactivo */}
      <div
        className={cn(
          'relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out',
          isDark ? 'bg-purple-600' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-xs transition-transform duration-300 ease-in-out',
            isDark ? 'translate-x-3.5' : 'translate-x-0'
          )}
        />
      </div>
    </button>
  )
}
