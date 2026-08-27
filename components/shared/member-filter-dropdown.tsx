'use client'

import { useState, useRef, useEffect } from 'react'
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedMember = members.find((m) => m.id === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      {/* ── BOTÓN DISPARADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-800 transition-all active:scale-[0.98] shadow-sm dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white',
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

      {/* ── MENÚ DESPLEGABLE FLOTANTE (PANEL) ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 max-h-48 md:max-h-56 overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-white border border-slate-200 shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 dark:bg-[#100e23]/95 dark:backdrop-blur-xl dark:border-purple-500/30 dark:shadow-2xl">
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
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-purple-100'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300">
                <Users className="size-3.5" />
              </div>
              <span className="truncate">Todos los miembros</span>
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
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-purple-100'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-purple-600/20'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MemberAvatar member={m} size="sm" className="size-6 text-[11px]" />
                  <span className="truncate">{m.name}</span>
                </div>
                {isSelected && <Check className="size-4 text-emerald-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
