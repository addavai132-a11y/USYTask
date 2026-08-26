'use client'

import { Bell, X, Check, CheckCircle2, CalendarPlus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useApp } from './app-context'
import { EmptyState } from '@/components/ui/empty-state'
import type { AppNotification } from '@/types'

// Helper to format relative time
function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} d`
}

function getIconForType(type: AppNotification['type']) {
  switch (type) {
    case 'task':
      return CheckCircle2
    case 'event':
      return CalendarPlus
    case 'reminder':
      return Bell
    default:
      return Bell
  }
}

export function NotificationsPanel() {
  const { notificationsOpen, setNotificationsOpen, notifications, dismissNotification, clearNotifications } = useApp()

  return (
    <BottomSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notificaciones">
      {notifications.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={clearNotifications}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check className="size-3.5" /> Marcar como leídas
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="py-8">
          <EmptyState emoji="📭" title="No tienes notificaciones pendientes" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = getIconForType(n.type)
            return (
              <div key={n.id} className="group relative flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: n.colorVar || 'var(--primary)' }}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Descartar"
                  >
                    <X className="size-3.5" />
                  </button>
                  <span className="text-[11px] font-medium text-muted-foreground">{timeAgo(n.timestamp)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BottomSheet>
  )
}
