'use client'

import { Check } from 'lucide-react'
import { MemberAvatar } from '@/components/ui/member-avatar'
import type { Member } from '@/types'
import { cn } from '@/lib/utils'

interface MemberMultiSelectProps {
  members: Member[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  label?: string
  required?: boolean
  className?: string
}

export function MemberMultiSelect({
  members,
  selectedIds,
  onChange,
  label = 'Miembros asignados',
  required = false,
  className,
}: MemberMultiSelectProps) {
  const isAllSelected = members.length > 0 && selectedIds.length === members.length

  const handleToggleAll = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange(members.map((m) => m.id))
    }
  }

  const handleToggleMember = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((mId) => mId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-muted-foreground text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={handleToggleAll}
          className="font-bold text-primary hover:underline text-[11px]"
        >
          {isAllSelected ? 'Desmarcar todos' : '+ Seleccionar todos'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-0.5">
        {/* Button [ + Todos ] */}
        <button
          type="button"
          onClick={handleToggleAll}
          className={cn(
            'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 border',
            isAllSelected
              ? 'border-primary bg-primary text-primary-foreground shadow-soft'
              : 'border-dashed border-primary/50 bg-primary/5 text-primary hover:bg-primary/10'
          )}
        >
          <span>{isAllSelected ? '✓ Todos' : '+ Todos'}</span>
        </button>

        {/* Member Chips */}
        {members.map((m) => {
          const isSelected = selectedIds.includes(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleToggleMember(m.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 border',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
              )}
            >
              <MemberAvatar member={m} size="xs" />
              <span>{m.name}</span>
              {isSelected && <Check className="size-3 text-primary stroke-[3]" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
