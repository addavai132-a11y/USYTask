'use client'

import {
  Calendar,
  Receipt,
  ShoppingCart,
  CheckCircle2,
  Star,
  Bell,
  Activity,
} from 'lucide-react'

export function AppPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
      {/* Glow Backdrop */}
      <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-tr from-primary/25 via-accent/20 to-emerald-500/15 blur-2xl opacity-75" />

      {/* Phone / Interface Shell */}
      <div className="relative overflow-hidden rounded-[32px] border border-border/80 bg-card p-4 sm:p-5 shadow-2xl transition-all">
        {/* Mock App Header */}
        <div className="mb-3.5 flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-emerald-600 to-accent text-xs font-black text-primary-foreground shadow-sm">
              UT
            </span>
            <div>
              <p className="text-xs font-black text-foreground leading-none">USYTask · Casa & Familia</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">4 miembros activos</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400">
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            <span>1,420 pts</span>
          </div>
        </div>

        {/* 1. Hoy en USYTask - Verde suave / Menta */}
        <div className="mb-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-100/70 via-emerald-50 to-teal-100/50 dark:from-emerald-950/60 dark:via-emerald-950/40 dark:to-teal-950/40 p-3 shadow-sm shadow-emerald-500/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
              <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Hoy en USYTask
            </span>
            <span className="text-[10px] font-semibold text-emerald-800/70 dark:text-emerald-300/70">Miércoles</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Event 1 */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/90 dark:bg-emerald-900/40 p-2.5 text-xs border border-emerald-500/20 shadow-2xs transition-transform hover:scale-[1.01]">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold truncate text-foreground">Javier · ITV del coche</p>
                <p className="text-[10px] font-medium text-muted-foreground">20 de enero · 17:00</p>
              </div>
              <span className="shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-2 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                ⏳ Quedan 2 semanas
              </span>
            </div>

            {/* Event 2 */}
            <div className="flex items-center justify-between rounded-xl bg-rose-50/90 dark:bg-rose-950/40 p-2.5 text-xs border border-rose-500/25 shadow-2xs transition-transform hover:scale-[1.01]">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold truncate text-foreground">Claudia · Dentista</p>
                <p className="text-[10px] font-medium text-muted-foreground">Hoy · 18:30</p>
              </div>
              <span className="shrink-0 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2 py-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 animate-pulse">
                En 3 horas
              </span>
            </div>
          </div>
        </div>

        {/* 2. Actividad reciente - Beige / Dorado cálido */}
        <div className="mb-3 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-100/70 via-amber-50 to-orange-100/50 dark:from-amber-950/60 dark:via-amber-950/40 dark:to-orange-950/40 p-3 shadow-sm shadow-amber-500/10">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300">
            <Activity className="size-3.5 text-amber-600 dark:text-amber-400" /> Actividad reciente
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Activity 1 - Factura */}
            <div className="flex items-center justify-between rounded-xl bg-amber-50/90 dark:bg-amber-950/40 p-2 text-[11px] border border-amber-500/20 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                  <Receipt className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Julio ha subido la factura de la luz</span>
              </div>
              <span className="shrink-0 rounded-md bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-black text-amber-900 dark:text-amber-200 ml-1">
                86,40 €
              </span>
            </div>

            {/* Activity 2 - Compra */}
            <div className="flex items-center justify-between rounded-xl bg-sky-50/90 dark:bg-sky-950/40 p-2 text-[11px] border border-sky-500/20 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 shrink-0">
                  <ShoppingCart className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Nora añadió 4 productos a la compra</span>
              </div>
            </div>

            {/* Activity 3 - Tarea */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 p-2 text-[11px] border border-emerald-500/20 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <CheckCircle2 className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Álex completó “Sacar la basura”</span>
              </div>
              <span className="shrink-0 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-200 ml-1">
                +10 pts
              </span>
            </div>
          </div>
        </div>

        {/* 3. Próximamente - Naranja / Dorado suave */}
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-100/70 via-orange-50 to-amber-100/50 dark:from-orange-950/60 dark:via-orange-950/40 dark:to-amber-950/40 p-3 shadow-sm shadow-orange-500/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-orange-900 dark:text-orange-300">
              <Bell className="size-3.5 text-orange-600 dark:text-orange-400" /> Próximamente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Upcoming 1 */}
            <div className="flex flex-col justify-between rounded-xl bg-orange-50/90 dark:bg-orange-950/40 p-2.5 border border-orange-500/20 shadow-2xs">
              <p className="font-bold text-[11px] text-foreground leading-snug">Renovar seguro del coche</p>
              <span className="mt-1.5 self-start text-[10px] font-extrabold text-orange-800 dark:text-orange-300 bg-orange-500/20 border border-orange-500/30 rounded-md px-1.5 py-0.5">
                Quedan 12 días
              </span>
            </div>

            {/* Upcoming 2 */}
            <div className="flex flex-col justify-between rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 p-2.5 border border-emerald-500/20 shadow-2xs">
              <p className="font-bold text-[11px] text-foreground leading-snug">Cumpleaños de Marta</p>
              <span className="mt-1.5 self-start text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-md px-1.5 py-0.5">
                Quedan 5 días
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
