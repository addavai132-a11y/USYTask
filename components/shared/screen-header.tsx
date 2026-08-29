import { SpaceSelectorButton } from '@/components/app/space-selector-button'
import { ThemeModeToggle } from '@/components/ui/theme-mode-toggle'
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
      <header className={cn('flex flex-col items-center justify-center text-center space-y-2 mb-6 w-full', className)}>
        {/* Fila superior: Selector de espacio y botón de tema */}
        <div className="w-full flex items-center justify-between sm:justify-center relative">
          <div className="sm:mx-auto">
            <SpaceSelectorButton />
          </div>
          <div className="flex items-center gap-2 sm:absolute sm:right-0">
            {action}
            <ThemeModeToggle />
          </div>
        </div>

        {/* Título y Subtítulo centrados */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto px-2">
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
        <div className="flex items-center gap-2">
          {action}
          <ThemeModeToggle />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white text-balance">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
    </header>
  )
}
