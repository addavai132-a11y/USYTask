import { cn } from '@/lib/utils'

export function EmptyState({
  emoji,
  title,
  action,
  onAction,
  className,
}: {
  emoji: string
  title: string
  action?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center', className)}>
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-3xl" aria-hidden="true">
        {emoji}
      </div>
      <p className="max-w-[220px] text-pretty text-sm font-medium text-muted-foreground">{title}</p>
      {action && (
        <button
          onClick={onAction}
          className="mt-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          {action}
        </button>
      )}
    </div>
  )
}
