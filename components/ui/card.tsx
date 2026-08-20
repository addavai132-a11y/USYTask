import { cn } from '@/lib/utils'

export type CardVariant =
  | 'default'   // Soft off-white / light emerald cream gradient (10% primary tint)
  | 'emerald'   // Verde esmeralda suave (Calendario, Eventos)
  | 'mint'      // Verde menta fresco (Tareas, Tareas completadas)
  | 'turquoise' // Turquesa / Azul verdoso (Familia, Miembros)
  | 'sky'       // Azul cielo suave (Eventos próximos)
  | 'blue'      // Azul suave (Vehículos, Gastos)
  | 'lavender'  // Lavanda / Índigo suave (Documentos, Notas)
  | 'violet'    // Violeta / Púrpura suave (Retos, Logros)
  | 'rose'      // Coral / Rosa empolvado (Recordatorios, Alertas)
  | 'orange'    // Naranja suave (Compra)
  | 'yellow'    // Amarillo cálido (Facturas)
  | 'gold'      // Dorado cálido (Puntos, Recompensas)
  | 'amber'     // Beige / Dorado suave (Presupuesto)
  | 'olive'     // Verde oliva suave (Casa, Mantenimiento)

const variantStyles: Record<CardVariant, string> = {
  default:
    'border-emerald-500/25 bg-gradient-to-br from-emerald-50/90 via-emerald-50/60 to-teal-50/80 dark:from-emerald-950/50 dark:via-emerald-950/30 dark:to-teal-950/40 shadow-soft shadow-emerald-500/5',
  emerald:
    'border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-emerald-50 to-teal-100/50 dark:from-emerald-950/60 dark:via-emerald-950/40 dark:to-teal-950/40 shadow-soft shadow-emerald-500/10',
  mint:
    'border-teal-500/30 bg-gradient-to-br from-teal-100/70 via-emerald-50 to-teal-100/50 dark:from-teal-950/60 dark:via-teal-950/40 dark:to-emerald-950/40 shadow-soft shadow-teal-500/10',
  turquoise:
    'border-cyan-500/30 bg-gradient-to-br from-cyan-100/70 via-teal-50 to-cyan-100/50 dark:from-cyan-950/60 dark:via-teal-950/40 dark:to-cyan-950/40 shadow-soft shadow-cyan-500/10',
  sky:
    'border-sky-500/30 bg-gradient-to-br from-sky-100/70 via-sky-50 to-blue-100/50 dark:from-sky-950/60 dark:via-sky-950/40 dark:to-blue-950/40 shadow-soft shadow-sky-500/10',
  blue:
    'border-blue-500/30 bg-gradient-to-br from-blue-100/70 via-sky-50 to-cyan-100/50 dark:from-blue-950/60 dark:via-sky-950/40 dark:to-cyan-950/40 shadow-soft shadow-blue-500/10',
  lavender:
    'border-indigo-500/30 bg-gradient-to-br from-indigo-100/70 via-indigo-50 to-slate-100/50 dark:from-indigo-950/60 dark:via-indigo-950/40 dark:to-slate-950/40 shadow-soft shadow-indigo-500/10',
  violet:
    'border-purple-500/30 bg-gradient-to-br from-purple-100/70 via-purple-50 to-fuchsia-100/50 dark:from-purple-950/60 dark:via-purple-950/40 dark:to-fuchsia-950/40 shadow-soft shadow-purple-500/10',
  rose:
    'border-rose-500/30 bg-gradient-to-br from-rose-100/70 via-rose-50 to-pink-100/50 dark:from-rose-950/60 dark:via-rose-950/40 dark:to-pink-950/40 shadow-soft shadow-rose-500/10',
  orange:
    'border-orange-500/30 bg-gradient-to-br from-orange-100/70 via-orange-50 to-amber-100/50 dark:from-orange-950/60 dark:via-orange-950/40 dark:to-amber-950/40 shadow-soft shadow-orange-500/10',
  yellow:
    'border-yellow-500/30 bg-gradient-to-br from-yellow-100/70 via-amber-50 to-yellow-100/50 dark:from-yellow-950/60 dark:via-amber-950/40 dark:to-yellow-950/40 shadow-soft shadow-yellow-500/10',
  gold:
    'border-amber-500/35 bg-gradient-to-br from-amber-100/80 via-yellow-50 to-amber-100/60 dark:from-amber-950/65 dark:via-amber-950/45 dark:to-yellow-950/40 shadow-soft shadow-amber-500/10',
  amber:
    'border-amber-500/30 bg-gradient-to-br from-amber-100/70 via-amber-50 to-orange-100/50 dark:from-amber-950/60 dark:via-amber-950/40 dark:to-orange-950/40 shadow-soft shadow-amber-500/10',
  olive:
    'border-lime-500/30 bg-gradient-to-br from-lime-100/70 via-emerald-50 to-lime-100/50 dark:from-lime-950/60 dark:via-emerald-950/40 dark:to-lime-950/40 shadow-soft shadow-lime-500/10',
}

export function Card({
  className,
  children,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      className={cn('rounded-3xl border p-4 transition-all', variantStyles[variant], className)}
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
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-sm font-semibold text-primary transition-opacity active:opacity-60"
        >
          {action}
        </button>
      )}
    </div>
  )
}
