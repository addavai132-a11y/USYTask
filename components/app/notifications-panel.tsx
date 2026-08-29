'use client'

import { Bell, BellRing, X, Check, CheckCircle2, CalendarPlus, Loader2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useApp } from './app-context'
import { EmptyState } from '@/components/ui/empty-state'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useToast } from '@/components/ui/toast'
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
  const { toast } = useToast()
  const { notificationsOpen, setNotificationsOpen, notifications, dismissNotification, clearNotifications } = useApp()
  const { activateAndTest, loading } = usePushNotifications()

  const handleActivateNotifications = async () => {
    const res = await activateAndTest()
    if (res.success) {
      toast('¡Notificación de prueba enviada con éxito!', '🚀')
    } else {
      toast(res.error || 'Aviso en notificación', '🔔')
    }
  }

  return (
    <BottomSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="Notificaciones">
      {/* Botón permanente y visible de Activar Notificaciones */}
      <div className="flex items-center justify-between gap-3 p-3.5 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 dark:bg-purple-500/10 dark:border-purple-500/25 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:bg-purple-500/20 dark:text-purple-300 shrink-0">
            <Bell className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
              Alertas del dispositivo
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Avisos Push de tareas y eventos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleActivateNotifications}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-green-600 text-white hover:bg-green-700 dark:bg-purple-600/20 dark:text-purple-300 dark:border dark:border-purple-500/30 dark:hover:bg-purple-600/30 shadow-sm shrink-0 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <BellRing className="size-3.5 text-white dark:text-purple-400 shrink-0" />
          )}
          <span>Activar notificaciones</span>
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="flex justify-end mb-3">
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
