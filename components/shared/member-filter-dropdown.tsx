'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Users } from 'lucide-react'
import { MemberAvatar } from '@/components/ui/member-avatar'
import type { Member } from '@/types'
import { cn } from '@/lib/utils'

interface MemberFilterDropdownProps {
  value: string
  onChange: (memberId: string) => void
  members: Member[]
  className?: string
}

export function MemberFilterDropdown({
  value,
  onChange,
  members,
  className,
}: MemberFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
    placeAbove: boolean
  } | null>(null)

  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedMember = members.find((m) => m.id === value)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Auto-close if trigger scrolls completely out of screen (e.g. inside scrollable modals)
    if (rect.bottom < -40 || rect.top > viewportHeight + 40) {
      setIsOpen(false)
      return
    }

    const safeMargin = 10
    const spaceBelow = Math.max(0, viewportHeight - rect.bottom - safeMargin)
    const spaceAbove = Math.max(0, rect.top - safeMargin)
    const estPanelHeight = Math.min((members.length + 1) * 44 + 24, 300)

    const placeAbove = spaceBelow < Math.min(estPanelHeight, 180) && spaceAbove > spaceBelow
    const availableHeight = placeAbove ? spaceAbove : spaceBelow
    const maxHeight = Math.max(80, Math.min(estPanelHeight, availableHeight - 6))

    const desiredWidth = Math.min(Math.max(rect.width, 224), viewportWidth - safeMargin * 2)
    let left = rect.right - desiredWidth
    if (left + desiredWidth > viewportWidth - safeMargin) {
      left = Math.max(safeMargin, viewportWidth - desiredWidth - safeMargin)
    }
    if (left < safeMargin) {
      left = safeMargin
    }

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
  }, [members.length])

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
      if (triggerRef.current?.contains(target)) return
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
        coords
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
      className="overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#100e23] dark:backdrop-blur-xl dark:border-purple-500/30 dark:shadow-2xl"
    >
      {/* Opción: Todos los miembros */}
      <button
        type="button"
        onClick={() => {
          onChange('all')
          setIsOpen(false)
        }}
        className={cn(
          'flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm transition-all text-left w-full cursor-pointer',
          value === 'all'
            ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-white'
            : 'text-slate-900 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20 font-medium'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300">
            <Users className="size-3.5" />
          </div>
          <span className="truncate text-slate-900 dark:text-white">Todos los miembros</span>
        </div>
        {value === 'all' && <Check className="size-4 text-emerald-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />}
      </button>

      {/* Línea Separadora */}
      <div className="border-t border-slate-200 dark:border-purple-500/15 my-1" />

      {/* Lista de cada miembro del hogar */}
      {members.map((m) => {
        const isSelected = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              onChange(m.id)
              setIsOpen(false)
            }}
            className={cn(
              'flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm transition-all text-left w-full cursor-pointer',
              isSelected
                ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-white'
                : 'text-slate-900 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20 font-medium'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MemberAvatar member={m} size="sm" className="size-6 text-[11px]" />
              <span className="truncate text-slate-900 dark:text-white">{m.name}</span>
            </div>
            {isSelected && <Check className="size-4 text-emerald-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={cn('relative inline-block text-left', className)} ref={triggerRef}>
      {/* ── BOTÓN DISPARADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-800 transition-all active:scale-[0.98] shadow-sm dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white cursor-pointer',
          isOpen && 'border-emerald-500/50 bg-slate-50 dark:border-purple-500/40 dark:bg-white/[0.08]'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedMember ? (
            <MemberAvatar member={selectedMember} size="sm" className="size-5 text-[10px]" />
          ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-400">
              <Users className="size-3" />
            </div>
          )}
          <span className="truncate font-medium text-slate-800 dark:text-white">
            {selectedMember ? selectedMember.name : 'Todos los miembros'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-emerald-600 dark:text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE CON PORTAL ── */}
      {isOpen && typeof document !== 'undefined' && createPortal(panelContent, document.body)}
    </div>
  )
}
