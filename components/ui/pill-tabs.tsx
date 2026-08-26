'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PillTabItem<T extends string = string> {
  id: T
  label: string
  deletable?: boolean
}

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  onDelete,
  className,
  rightElement,
  showScrollArrows = true,
}: {
  tabs: PillTabItem<T>[]
  value: T
  onChange: (id: T) => void
  onDelete?: (id: T) => void
  className?: string
  rightElement?: React.ReactNode
  showScrollArrows?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, tabs])

  const scrollByAmount = (amount: number) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    setTimeout(checkScroll, 250)
  }

  return (
    <div className={cn('relative w-full group flex items-center', className)}>
      {/* Left Scroll Button */}
      {showScrollArrows && canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-200)}
          aria-label="Desplazar a la izquierda"
          className="absolute left-0 z-20 flex size-8 items-center justify-center rounded-full bg-card text-foreground border border-border shadow-lg backdrop-blur-md transition-all hover:bg-secondary hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="size-4.5" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={scrollRef}
        className={cn(
          'no-scrollbar flex w-full flex-1 items-center gap-2 overflow-x-auto scroll-smooth py-1',
          canScrollLeft ? 'pl-8 sm:pl-9' : 'pl-0.5',
          canScrollRight ? 'pr-8 sm:pr-9' : 'pr-0.5'
        )}
      >
        {tabs.map((t) => {
          const isActive = value === t.id
          return (
            <div
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cn(
                'group flex shrink-0 items-center gap-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none border',
                t.deletable && onDelete ? 'pl-3.5 pr-2 py-1.5' : 'px-4 py-2',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-soft dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 dark:text-white dark:border-purple-500/50 dark:shadow-[0_0_18px_rgba(168,85,247,0.3)]'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              <span>{t.label}</span>

              {t.deletable && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(t.id)
                  }}
                  aria-label={`Eliminar categoría ${t.label}`}
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'hover:bg-white/20 text-white'
                      : 'hover:bg-slate-300 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <X className="size-3 stroke-[2.5]" />
                </button>
              )}
            </div>
          )
        })}
        {rightElement}
      </div>

      {/* Right Scroll Button */}
      {showScrollArrows && canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(200)}
          aria-label="Desplazar a la derecha"
          className="absolute right-0 z-20 flex size-8 items-center justify-center rounded-full bg-card text-foreground border border-border shadow-lg backdrop-blur-md transition-all hover:bg-secondary hover:scale-105 active:scale-95"
        >
          <ChevronRight className="size-4.5" />
        </button>
      )}
    </div>
  )
}
