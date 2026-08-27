import { cn } from '@/lib/utils'

export function EmptyState({
  emoji,
  title,
  description,
  action,
  onAction,
  className,
}: {
  emoji: string
  title: string
  description?: string
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center', className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-3xl mb-1" aria-hidden="true">
        {emoji}
      </div>
      <p className="text-pretty text-sm sm:text-base font-bold text-foreground">{title}</p>
      {description && (
        <p className="max-w-xs text-pretty text-xs text-muted-foreground -mt-1">{description}</p>
      )}
      {action && (
        <button
          onClick={onAction}
          className="mt-2 rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
        >
          {action}
        </button>
      )}
    </div>
  )
}

