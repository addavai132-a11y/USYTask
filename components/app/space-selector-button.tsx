'use client'

import { ChevronDown } from 'lucide-react'
import { useApp } from './app-context'
import { spaceTypeLabels } from '@/lib/spaces'

export function SpaceSelectorButton() {
  const { activeSpace, openSpaceSelector } = useApp()
  const typeMeta = spaceTypeLabels[activeSpace.type] || spaceTypeLabels.other

  return (
    <button
      type="button"
      onClick={openSpaceSelector}
      className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3.5 py-2 text-xs font-black text-foreground shadow-xs transition-all active:scale-95 group"
    >
      <span className="text-base leading-none">{activeSpace.icon || typeMeta.icon}</span>
      <span className="truncate max-w-[140px] sm:max-w-[200px] font-black">{activeSpace.name}</span>
      <ChevronDown className="size-3.5 text-primary shrink-0 stroke-[3] transition-transform group-hover:translate-y-0.5" />
    </button>
  )
}
