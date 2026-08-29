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
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

export function AppPreviewMockup() {
  return (
    <div className="relative mx-auto w-full max-w-full sm:max-w-md lg:max-w-none overflow-hidden">
      {/* Glow Backdrop */}
      <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-tr from-primary/30 via-accent/20 to-primary/10 blur-2xl opacity-75 pointer-events-none" />

      {/* Phone / Interface Shell */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] border border-border/80 bg-card/95 p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl transition-all w-full">
        {/* Mock App Header */}
        <div className="mb-3.5 flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <UsyTaskLogo size="sm" showText={false} />
            <div>
              <p className="text-xs font-black text-foreground leading-none">USYTask · Casa & Familia</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">4 miembros activos</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-extrabold text-primary">
            <Star className="size-3.5 fill-primary text-primary" />
            <span>1,420 pts</span>
          </div>
        </div>

        {/* 1. Hoy en USYTask - Card principal */}
        <div className="mb-3 rounded-2xl border border-primary/25 bg-secondary/40 p-3.5 shadow-sm backdrop-blur-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
              <Calendar className="size-3.5 text-primary" /> Hoy en USYTask
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">Miércoles</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Event 1 */}
            <div className="flex items-center justify-between rounded-xl bg-card border border-border/70 p-2.5 text-xs shadow-xs transition-all hover:border-primary/30">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold truncate text-foreground">Javier · ITV del coche</p>
                <p className="text-[10px] font-medium text-muted-foreground">20 de enero · 17:00</p>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-bold text-primary">
                ⏳ Quedan 2 semanas
              </span>
            </div>

            {/* Event 2 */}
            <div className="flex items-center justify-between rounded-xl bg-card border border-border/70 p-2.5 text-xs shadow-xs transition-all hover:border-primary/30">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold truncate text-foreground">Claudia · Dentista</p>
                <p className="text-[10px] font-medium text-muted-foreground">Hoy · 18:30</p>
              </div>
              <span className="shrink-0 rounded-lg bg-primary/15 border border-primary/25 px-2 py-1 text-[10px] font-extrabold text-primary animate-pulse">
                En 3 horas
              </span>
            </div>
          </div>
        </div>

        {/* 2. Actividad reciente */}
        <div className="mb-3 rounded-2xl border border-border/80 bg-secondary/30 p-3.5 shadow-sm backdrop-blur-sm">
          <div className="mb-2.5 flex items-center gap-1.5 text-xs font-extrabold text-foreground">
            <Activity className="size-3.5 text-primary" /> Actividad reciente
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Activity 1 - Factura */}
            <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 p-2 text-[11px] shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-primary/15 border border-primary/25 text-primary shrink-0">
                  <Receipt className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Julio ha subido la factura de la luz</span>
              </div>
              <span className="shrink-0 rounded-md bg-secondary border border-border px-1.5 py-0.5 text-[10px] font-black text-foreground ml-1">
                86,40 €
              </span>
            </div>

            {/* Activity 2 - Compra */}
            <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 p-2 text-[11px] shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-accent/15 border border-accent/25 text-accent shrink-0">
                  <ShoppingCart className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Nora añadió 4 productos a la compra</span>
              </div>
            </div>

            {/* Activity 3 - Tarea */}
            <div className="flex items-center justify-between rounded-xl bg-card border border-border/60 p-2 text-[11px] shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-5 items-center justify-center rounded-md bg-primary/15 border border-primary/25 text-primary shrink-0">
                  <CheckCircle2 className="size-3" />
                </span>
                <span className="truncate font-semibold text-foreground">Álex completó “Sacar la basura”</span>
              </div>
              <span className="shrink-0 rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-black text-primary ml-1">
                +10 pts
              </span>
            </div>
          </div>
        </div>

        {/* 3. Próximamente */}
        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5 shadow-sm backdrop-blur-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
              <Bell className="size-3.5 text-primary" /> Próximamente
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Upcoming 1 */}
            <div className="flex flex-col justify-between rounded-xl bg-card p-2.5 border border-border/60 shadow-xs">
              <p className="font-bold text-[11px] text-foreground leading-snug">Renovar seguro del coche</p>
              <span className="mt-2 self-start text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">
                Quedan 12 días
              </span>
            </div>

            {/* Upcoming 2 */}
            <div className="flex flex-col justify-between rounded-xl bg-card p-2.5 border border-border/60 shadow-xs">
              <p className="font-bold text-[11px] text-foreground leading-snug">Cumpleaños de Marta</p>
              <span className="mt-2 self-start text-[10px] font-extrabold text-accent bg-accent/10 border border-accent/20 rounded-md px-1.5 py-0.5">
                Quedan 5 días
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
