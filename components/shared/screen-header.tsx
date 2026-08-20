import { SpaceSelectorButton } from '@/components/app/space-selector-button'

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-4 flex flex-col gap-3">
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
