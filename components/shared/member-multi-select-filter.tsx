'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Users, UserCheck } from 'lucide-react'
import { MemberAvatar } from '@/components/ui/member-avatar'
import type { Member } from '@/types'
import { cn } from '@/lib/utils'

export interface MemberMultiSelectFilterProps {
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  members: Member[]
  className?: string
  placeholder?: string
}

export function MemberMultiSelectFilter({
  selectedIds,
  onChange,
  members,
  className,
  placeholder = 'Todos los miembros',
}: MemberMultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isAllSelected = members.length > 0 && selectedIds.length === members.length
  const isNoneSelected = selectedIds.length === 0

  const handleToggleAll = () => {
    if (isAllSelected || isNoneSelected) {
      // Si todos están seleccionados o ninguno, vaciar (muestra todos) o seleccionar todos
      if (isAllSelected) {
        onChange([])
      } else {
        onChange(members.map((m) => m.id))
      }
    } else {
      onChange(members.map((m) => m.id))
    }
  }

  const handleToggleMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((mId) => mId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  // Elementos seleccionados actualmente
  const selectedMembers = members.filter((m) => selectedIds.includes(m.id))

  // Render del contenido del Trigger
  const renderTriggerContent = () => {
    if (isNoneSelected || isAllSelected) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-5.5 items-center justify-center rounded-full bg-purple-500/15 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 shrink-0">
            <Users className="size-3" />
          </div>
          <span className="truncate font-semibold text-slate-800 dark:text-white">
            {placeholder}
          </span>
        </div>
      )
    }

    if (selectedMembers.length === 1) {
      const member = selectedMembers[0]
      return (
        <div className="flex items-center gap-2 min-w-0">
          <MemberAvatar member={member} size="sm" className="size-5.5 text-[10px] shrink-0" ring />
          <span className="truncate font-semibold text-slate-800 dark:text-white">
            {member.name}
          </span>
        </div>
      )
    }

    // 2 o más seleccionados
    const firstMember = selectedMembers[0]
    const remainingCount = selectedMembers.length - 1

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex -space-x-2 items-center shrink-0">
          {selectedMembers.slice(0, 2).map((m) => (
            <MemberAvatar key={m.id} member={m} size="sm" className="size-5.5 text-[10px]" ring />
          ))}
        </div>
        <span className="truncate font-semibold text-slate-800 dark:text-white text-xs">
          {firstMember.name.split(' ')[0]} +{remainingCount} más
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      {/* ── BOTÓN ACTIVADOR (TRIGGER) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] shadow-sm',
          'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-purple-500/25 dark:bg-[#110C24] dark:hover:bg-purple-950/40 dark:text-white',
          isOpen && 'border-emerald-500/50 dark:border-purple-400 bg-slate-50 dark:bg-purple-950/50 shadow-md'
        )}
      >
        {renderTriggerContent()}
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180 text-emerald-600 dark:text-purple-400'
          )}
        />
      </button>

      {/* ── MENÚ DESPLEGABLE CON CHECKBOXES ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 max-h-80 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 dark:border-purple-500/30 dark:bg-[#0e0c1f]/95 dark:backdrop-blur-2xl text-slate-200">
          {/* Opción Superior: Seleccionar / Desmarcar Todos */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all text-left w-full text-slate-900 hover:text-black hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-purple-600/20"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300">
                <Users className="size-3.5" />
              </div>
              <span className="truncate text-slate-900 dark:text-white">
                {isAllSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
              </span>
            </div>
            <span className="text-[10px] font-black text-emerald-700 dark:text-purple-400">
              {isAllSelected ? 'Limpiar' : 'Todos'}
            </span>
          </button>

          {/* Separador */}
          <div className="border-t border-slate-200 dark:border-purple-500/15 my-1.5" />

          {/* Lista de Miembros con Checkboxes Interactivos */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar max-h-52">
            {members.map((m) => {
              const isChecked = selectedIds.includes(m.id)
              return (
                <div
                  key={m.id}
                  onClick={(e) => handleToggleMember(m.id, e)}
                  className={cn(
                    'flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer select-none',
                    isChecked
                      ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-600/20 dark:border-purple-500/30 dark:text-white'
                      : 'text-slate-900 hover:text-black hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/[0.04] font-medium'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MemberAvatar member={m} size="sm" className="size-6 text-[11px]" ring />
                    <span className="truncate text-slate-900 dark:text-white">{m.name}</span>
                  </div>

                  {/* Checkbox Verde Esmeralda */}
                  <div
                    className={cn(
                      'flex size-5 items-center justify-center rounded-md border transition-all',
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'border-slate-300 dark:border-white/20 bg-white dark:bg-black/30'
                    )}
                  >
                    {isChecked && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer de Aplicar */}
          <div className="border-t border-slate-200 dark:border-purple-500/15 pt-2 mt-1.5 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {selectedIds.length === 0
                ? 'Todos visibles'
                : `${selectedIds.length} ${selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 transition-all active:scale-95 shadow-sm"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
