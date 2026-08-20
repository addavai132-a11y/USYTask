import { cn } from '@/lib/utils'

export function UsyTaskLogo({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showSubtitle?: boolean
  className?: string
}) {
  const iconSizes = {
    sm: 'size-7 text-xs rounded-lg',
    md: 'size-9 text-sm rounded-xl',
    lg: 'size-12 text-lg rounded-2xl',
    xl: 'size-16 text-2xl rounded-3xl',
  }

  const textSizes = {
    sm: 'text-base font-black',
    md: 'text-xl font-black',
    lg: 'text-2xl font-black',
    xl: 'text-4xl font-black',
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Icon: Sleek U with connected check/system mark */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center bg-gradient-to-tr from-primary via-emerald-600 to-accent text-primary-foreground font-black shadow-soft',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3/5"
        >
          {/* U shape with check mark */}
          <path d="M6 4v8a6 6 0 0 0 12 0V4" />
          <path d="m9 12 2 2 4-4" className="stroke-accent-foreground" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('tracking-tight text-foreground', textSizes[size])}>
            USYTask
          </span>
          {showSubtitle && (
            <span className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Universal System for Tasks
            </span>
          )}
        </div>
      )}
    </div>
  )
}
