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
    sm: 'size-7 rounded-lg',
    md: 'size-9 rounded-xl',
    lg: 'size-12 rounded-2xl',
    xl: 'size-16 rounded-3xl',
  }

  const textSizes = {
    sm: 'text-base font-semibold',
    md: 'text-xl font-semibold',
    lg: 'text-2xl font-bold',
    xl: 'text-4xl font-bold',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon: Luxury AI/Tech Continuous Geometric U Monogram */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center bg-[#070612] border border-purple-500/30 p-1.5 shadow-2xl shadow-purple-950/50 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]',
          iconSizes[size]
        )}
      >
        <svg viewBox="0 0 32 32" fill="none" className="size-full">
          <defs>
            <linearGradient id="usyLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#e879f9" />
            </linearGradient>
          </defs>
          {/* Stylized U monogram with AI continuous line & check element */}
          <path
            d="M8 7v10a8 8 0 0 0 16 0V7"
            stroke="url(#usyLogoGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M12 17l3 3 5-5"
            stroke="url(#usyLogoGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn('tracking-tight text-white font-semibold', textSizes[size])}>
            Usytask
          </span>
          {showSubtitle && (
            <span className="mt-1 text-[10px] sm:text-xs font-medium uppercase tracking-widest text-purple-300/70">
              Universal System for Tasks
            </span>
          )}
        </div>
      )}
    </div>
  )
}
