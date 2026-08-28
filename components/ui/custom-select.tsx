'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  icon?: ReactNode
  badge?: string
}

interface CustomSelectProps<T = string | number> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  icon?: ReactNode
  className?: string
  triggerClassName?: string
  panelClassName?: string
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  icon,
  className,
  triggerClassName,
  panelClassName,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative inline-block text-left', isOpen && 'z-50', className)} ref={containerRef}>
      {/* ── BOTÓN DISPARADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-800 transition-all active:scale-[0.98] shadow-sm dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white',
          isOpen && 'border-emerald-500/50 bg-slate-50 dark:border-purple-500/40 dark:bg-white/[0.08]',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Icono a la izquierda */}
          {selectedOption?.icon ? (
            <span className="shrink-0 leading-none">{selectedOption.icon}</span>
          ) : icon ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300 shrink-0 text-xs">
              {icon}
            </span>
          ) : null}

          {/* Texto del selector */}
          <span className="truncate font-medium text-slate-800 dark:text-white">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Flecha indicadora */}
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-emerald-600 dark:text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE FLOTANTE (PANEL) ── */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 z-50 w-full min-w-[200px] max-h-48 md:max-h-56 overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-white border border-slate-200 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#100e23]/95 dark:backdrop-blur-xl dark:border-purple-500/30 dark:shadow-2xl',
            panelClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm transition-all text-left w-full cursor-pointer',
                  isSelected
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-purple-100'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.icon && <span className="shrink-0 leading-none">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="size-4 text-emerald-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
