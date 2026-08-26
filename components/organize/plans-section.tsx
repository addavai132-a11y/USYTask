'use client'

import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useApp } from '@/components/app/app-context'

export function PlansSection() {
  const { openQuickAdd } = useApp()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={() => openQuickAdd('evento', { hideTabs: true })}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
        >
          <Plus className="size-3.5" />
          Añadir evento
        </button>
      </div>
      <EmptyState
        emoji="🗓"
        title="No hay planes ni eventos en este grupo."
        action="Añadir evento"
        onAction={() => openQuickAdd('evento', { hideTabs: true })}
      />
    </div>
  )
}
