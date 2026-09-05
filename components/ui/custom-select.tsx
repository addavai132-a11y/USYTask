'use client'

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  usePortal?: boolean
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
  usePortal = true,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
    placeAbove: boolean
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Cerrar automáticamente si el elemento disparador sale completamente de la pantalla (ej. scroll en modal)
    if (rect.bottom < -40 || rect.top > viewportHeight + 40) {
      setIsOpen(false)
      return
    }

    const safeMargin = 10
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - safeMargin)
    const spaceAbove = Math.max(0, rect.top - safeMargin)
    const estPanelHeight = Math.min(options.length * 40 + 20, 280)

    // Decidir posición vertical (arriba vs abajo) dinámicamente según espacio disponible
    const placeAbove = spaceBelow < Math.min(estPanelHeight, 180) && spaceAbove > spaceBelow
    const availableHeight = placeAbove ? spaceAbove : spaceBelow
    const maxHeight = Math.max(80, Math.min(estPanelHeight, availableHeight - 6))

    // Ancho y posición horizontal acotados a los márgenes visibles de la pantalla
    const minW = Math.max(rect.width, 160)
    const desiredWidth = Math.min(minW, viewportWidth - safeMargin * 2)
    let left = rect.left
    if (left + desiredWidth > viewportWidth - safeMargin) {
      left = Math.max(safeMargin, viewportWidth - desiredWidth - safeMargin)
    }
    if (left < safeMargin) {
      left = safeMargin
    }

    // Coordenadas top absolutas (inmunes a cambios de tamaño de barra de navegación móvil)
    const top = placeAbove
      ? Math.max(safeMargin, rect.top - maxHeight - 6)
      : Math.min(viewportHeight - maxHeight - safeMargin, rect.bottom + 6)

    setCoords({
      top,
      left,
      width: desiredWidth,
      maxHeight,
      placeAbove,
    })
  }, [options.length])

  // Compute position immediately when opening
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    updatePosition()
    const rafId = requestAnimationFrame(updatePosition)

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true })
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleScrollOrResize)
      window.visualViewport.addEventListener('scroll', handleScrollOrResize)
    }

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside, { passive: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleScrollOrResize)
        window.visualViewport.removeEventListener('scroll', handleScrollOrResize)
      }
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition])

  const panelContent = (
    <div
      ref={panelRef}
      style={
        usePortal && coords
          ? {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 999999,
            }
          : undefined
      }
      className={cn(
        'overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-white border border-slate-200 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#100e23] dark:border-purple-500/30 dark:shadow-2xl',
        !usePortal && 'absolute right-0 top-full mt-1.5 z-[70] w-full min-w-[180px] max-h-52',
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
              'flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-all text-left w-full cursor-pointer',
              isSelected
                ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-white'
                : 'text-slate-900 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20 font-medium'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {opt.icon && <span className="shrink-0 leading-none">{opt.icon}</span>}
              <span className="truncate text-slate-900 dark:text-white">{opt.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {opt.badge && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {opt.badge}
                </span>
              )}
              {isSelected && (
                <Check className="size-3.5 text-emerald-600 dark:text-purple-400 stroke-[2.5]" />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={cn('relative inline-block text-left', isOpen && !usePortal && 'z-[70]', className)} ref={containerRef}>
      {/* ── BOTÓN DISPARADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-800 transition-all active:scale-[0.98] shadow-sm dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white cursor-pointer',
          isOpen && 'border-emerald-500/50 bg-slate-50 dark:border-purple-500/40 dark:bg-white/[0.08]',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon ? (
            <span className="shrink-0 leading-none">{selectedOption.icon}</span>
          ) : icon ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300 shrink-0 text-xs">
              {icon}
            </span>
          ) : null}

          <span className="truncate font-medium text-slate-800 dark:text-white">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-emerald-600 dark:text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE FLOTANTE (PANEL) ── */}
      {isOpen && (
        usePortal && typeof document !== 'undefined'
          ? createPortal(panelContent, document.body)
          : panelContent
      )}
    </div>
  )
}
