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
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* ── BOTÓN DISPARADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-purple-500/20 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs md:text-sm font-medium text-white transition-all active:scale-[0.98] shadow-sm backdrop-blur-md',
          isOpen && 'border-purple-500/40 bg-white/[0.08]',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Icono a la izquierda */}
          {selectedOption?.icon ? (
            <span className="shrink-0 leading-none">{selectedOption.icon}</span>
          ) : icon ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 shrink-0 text-xs">
              {icon}
            </span>
          ) : null}

          {/* Texto del selector */}
          <span className="truncate font-medium text-white">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Flecha indicadora */}
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE FLOTANTE (PANEL) ── */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 z-50 w-full min-w-[200px] max-h-48 md:max-h-56 overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-[#100e23]/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150',
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
                    ? 'bg-purple-950/60 border border-purple-500/40 text-purple-100 font-medium'
                    : 'text-slate-200 hover:text-white hover:bg-purple-600/20'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.icon && <span className="shrink-0 leading-none">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="size-4 text-purple-400 shrink-0 stroke-[2.5]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
