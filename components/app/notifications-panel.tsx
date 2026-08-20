'use client'

import { CalendarClock, ShoppingCart, Trophy, AlertTriangle } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useApp } from './app-context'

const items = [
  { icon: AlertTriangle, color: 'var(--accent)', title: 'ITV del coche', body: 'Vence dentro de 12 días', time: 'Ahora' },
  { icon: CalendarClock, color: 'var(--member-marieli)', title: 'Dentista de Marieli', body: 'Hoy a las 11:00', time: 'Hace 1 h' },
  { icon: Trophy, color: 'var(--warning)', title: 'Adrián completó una tarea', body: 'Ordenar habitación · +15 ⭐', time: 'Hace 20 min' },
  { icon: ShoppingCart, color: 'var(--primary)', title: 'Lista Mercadona actualizada', body: 'Marieli añadió Leche', time: 'Hace 1 h' },
]

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen } = useApp()
  return (
    <BottomSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notificaciones">
      <div className="flex flex-col gap-2">
        {items.map((n, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-border/60 p-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: n.color }}
            >
              <n.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
