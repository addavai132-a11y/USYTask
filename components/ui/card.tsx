import { cn } from '@/lib/utils'

export type CardVariant =
  | 'default'
  | 'emerald'
  | 'mint'
  | 'turquoise'
  | 'sky'
  | 'blue'
  | 'lavender'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'yellow'
  | 'gold'
  | 'amber'
  | 'olive'

const variantStyles: Record<CardVariant, string> = {
  default:
    'border-border bg-card hover:border-purple-500/35',
  emerald:
    'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-emerald-500/40',
  mint:
    'border-teal-500/30 bg-teal-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-teal-500/40',
  turquoise:
    'border-cyan-500/30 bg-cyan-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-cyan-500/40',
  sky:
    'border-sky-500/30 bg-sky-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-sky-500/40',
  blue:
    'border-blue-500/30 bg-blue-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-blue-500/40',
  lavender:
    'border-indigo-500/30 bg-indigo-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-indigo-500/40',
  violet:
    'border-purple-500/30 bg-purple-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-purple-500/40',
  rose:
    'border-rose-500/30 bg-rose-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-rose-500/40',
  orange:
    'border-orange-500/30 bg-orange-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-orange-500/40',
  yellow:
    'border-yellow-500/30 bg-yellow-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-yellow-500/40',
  gold:
    'border-amber-500/35 bg-amber-500/[0.08] dark:bg-[#0e0d1d]/65 hover:border-amber-500/45',
  amber:
    'border-amber-500/30 bg-amber-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-amber-500/40',
  olive:
    'border-lime-500/30 bg-lime-500/[0.04] dark:bg-[#0e0d1d]/65 hover:border-lime-500/40',
}

export function Card({
  className,
  children,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={cn(
        'rounded-3xl border p-4 transition-all duration-300 text-foreground bg-card shadow-soft backdrop-blur-2xl',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  action,
  onAction,
  icon,
}: {
  title: string
  action?: string
  onAction?: () => void
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-foreground text-base tracking-tight">{title}</h3>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  )
}
