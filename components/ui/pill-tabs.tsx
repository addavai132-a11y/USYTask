'use client'

import { cn } from '@/lib/utils'

export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95',
            value === t.id
              ? 'bg-foreground text-background shadow-soft'
              : 'bg-secondary text-secondary-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
