'use client'

import { ChevronDown } from 'lucide-react'
import { useApp } from './app-context'
import { groupTypeLabels } from '@/types'

export function SpaceSelectorButton() {
  const { activeGroup, openGroupSelector } = useApp()

  if (!activeGroup) return null
  const typeMeta = groupTypeLabels[activeGroup.type] || groupTypeLabels.other

  return (
    <button
      type="button"
      onClick={openGroupSelector}
      className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3.5 py-2 text-xs font-black text-foreground shadow-xs transition-all active:scale-95 group"
    >
      <span className="text-base leading-none">{activeGroup.icon || typeMeta.icon}</span>
      <span className="truncate max-w-[140px] sm:max-w-[200px] font-black">{activeGroup.name}</span>
      <ChevronDown className="size-3.5 text-primary shrink-0 stroke-[3] transition-transform group-hover:translate-y-0.5" />
    </button>
  )
}
