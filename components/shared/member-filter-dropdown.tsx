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
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border border-purple-500/20 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 text-xs md:text-sm font-medium text-white transition-all active:scale-[0.98] shadow-sm backdrop-blur-md',
          isOpen && 'border-purple-500/40 bg-white/[0.08]'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedMember ? (
            <MemberAvatar member={selectedMember} size="sm" className="size-5 text-[10px]" />
          ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
              <Users className="size-3" />
            </div>
          )}
          <span className="truncate font-medium text-white">
            {selectedMember ? selectedMember.name : 'Todos los miembros'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE FLOTANTE (PANEL) ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-56 max-h-48 md:max-h-56 overflow-y-auto pr-1 dropdown-scroll rounded-2xl bg-[#100e23]/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
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
                ? 'bg-purple-950/60 border border-purple-500/40 text-purple-100 font-medium'
                : 'text-slate-200 hover:text-white hover:bg-purple-600/20'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
                <Users className="size-3.5" />
              </div>
              <span className="truncate">Todos los miembros</span>
            </div>
            {value === 'all' && <Check className="size-4 text-purple-400 shrink-0 stroke-[2.5]" />}
          </button>

          {/* Línea Separadora */}
          <div className="border-t border-purple-500/15 my-1" />

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
                    ? 'bg-purple-950/60 border border-purple-500/40 text-purple-100 font-medium'
                    : 'text-slate-200 hover:text-white hover:bg-purple-600/20'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MemberAvatar member={m} size="sm" className="size-6 text-[11px]" />
                  <span className="truncate">{m.name}</span>
                </div>
                {isSelected && <Check className="size-4 text-purple-400 shrink-0 stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
