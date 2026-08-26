import { SpaceSelectorButton } from '@/components/app/space-selector-button'
import { cn } from '@/lib/utils'

export function ScreenHeader({
  title,
  subtitle,
  action,
  centered,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  centered?: boolean
  className?: string
}) {
  if (centered) {
    return (
      <header className={cn('flex flex-col items-center justify-center text-center space-y-2 mb-6', className)}>
        {/* Botón selector de grupo centrado */}
        <div className="inline-flex items-center justify-center">
          <SpaceSelectorButton />
          {action}
        </div>

        {/* Título y Subtítulo centrados */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </header>
    )
  }

  return (
    <header className={cn('mb-4 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <SpaceSelectorButton />
        {action}
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm font-medium text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  )
}
