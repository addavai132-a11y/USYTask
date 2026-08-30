'use client'

import { useState } from 'react'
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Gift,
  Sparkles,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useApp } from './app-context'
import { EmptyState } from '@/components/ui/empty-state'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useToast } from '@/components/ui/toast'
import type { AppNotification } from '@/types'
import { cn } from '@/lib/utils'

// Helper to format relative time
function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Reciente'

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} d`
}

function getNotificationVisuals(type: AppNotification['type']) {
  switch (type) {
    case 'task':
      return {
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
        label: 'Tarea',
      }
    case 'event':
      return {
        icon: Calendar,
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
        label: 'Evento',
      }
    case 'reminder':
      return {
        icon: BellRing,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        label: 'Recordatorio',
      }
    case 'finance':
      return {
        icon: CreditCard,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
        label: 'Finanzas',
      }
    case 'reward':
      return {
        icon: Gift,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
        label: 'Recompensa',
      }
    default:
      return {
        icon: Sparkles,
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
        label: 'Sistema',
      }
  }
}

export function NotificationsPanel() {
  const { toast } = useToast()
  const {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    dismissNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    setTab,
  } = useApp()

  const { activateAndTest, loading } = usePushNotifications()
  const [filter, setFilter] = useState<'todas' | 'no_leidas'>('todas')

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayedNotifications = notifications.filter((n) => {
    if (filter === 'no_leidas') return !n.read
    return true
  })

  const handleActivateNotifications = async () => {
    const res = await activateAndTest()
    if (res.success) {
      toast('¡Notificación push de prueba enviada con éxito!', '🚀')
    } else {
      toast(res.error || 'Aviso en notificación', '🔔')
    }
  }

  const handleNotificationClick = (n: AppNotification) => {
    // Mark as read
    if (!n.read) {
      markNotificationAsRead(n.id)
    }

    // Dynamic Deep-linking
    if (n.data?.tab) {
      setTab(n.data.tab as any)
      setNotificationsOpen(false)
      return
    }

    // Fallback deep links by type
    if (n.type === 'task' || n.type === 'event' || n.type === 'reminder') {
      setTab('organizar')
      setNotificationsOpen(false)
    } else if (n.type === 'finance') {
      setTab('hogar')
      setNotificationsOpen(false)
    } else if (n.type === 'reward') {
      setTab('familia')
      setNotificationsOpen(false)
    }
  }

  return (
    <BottomSheet
      open={notificationsOpen}
      onClose={() => setNotificationsOpen(false)}
      title="Centro de Notificaciones"
    >
      <div className="space-y-3 text-xs">
        {/* Banner PWA Push Notifications */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 dark:bg-purple-500/10 dark:border-purple-500/25 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:bg-purple-500/20 dark:text-purple-300 shrink-0">
              <Bell className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                Alertas Push del dispositivo
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Recibe avisos de tareas, eventos y pagos en tu móvil
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleActivateNotifications}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-purple-600 dark:hover:bg-purple-500 shadow-sm shrink-0 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <BellRing className="size-3.5" />
            )}
            <span>Activar Push</span>
          </button>
        </div>

        {/* Barra de Filtro y Acciones */}
        <div className="flex items-center justify-between gap-2 pt-1 pb-1 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('todas')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                filter === 'todas'
                  ? 'bg-slate-100 text-slate-900 dark:bg-purple-600/30 dark:text-purple-200'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              )}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('no_leidas')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                filter === 'no_leidas'
                  ? 'bg-slate-100 text-slate-900 dark:bg-purple-600/30 dark:text-purple-200'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              )}
            >
              {unreadCount > 0 && <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />}
              <span>No leídas ({unreadCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-purple-300 hover:underline"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="size-3" />
                <span>Marcar leídas</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                title="Limpiar todas las notificaciones"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Listado de Notificaciones */}
        {displayedNotifications.length === 0 ? (
          <div className="py-8">
            <EmptyState
              emoji="📭"
              title={filter === 'no_leidas' ? 'No tienes notificaciones pendientes de leer.' : 'No tienes notificaciones registradas.'}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {displayedNotifications.map((n) => {
              const visuals = getNotificationVisuals(n.type)
              const Icon = visuals.icon
              const isUnread = !n.read

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'group relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none',
                    isUnread
                      ? 'bg-emerald-50/40 border-emerald-200 dark:bg-purple-950/20 dark:border-purple-500/30 hover:border-emerald-500/50 shadow-xs'
                      : 'bg-white border-slate-200 dark:bg-white/[0.02] dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 opacity-75 hover:opacity-100'
                  )}
                >
                  {/* Icono con badge visual */}
                  <div
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl border',
                      visuals.badgeClass
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Contenido de la notificación */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          'text-xs font-bold leading-snug truncate',
                          isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {n.title}
                      </p>
                      {isUnread && (
                        <span className="size-2 rounded-full bg-emerald-500 shrink-0" title="No leída" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="font-mono">{timeAgo(n.timestamp)}</span>
                      <span>·</span>
                      <span className="font-semibold">{visuals.label}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissNotification(n.id)
                      }}
                      className="flex size-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-500 transition-colors"
                      title="Descartar notificación"
                    >
                      <X className="size-3.5" />
                    </button>
                    <ExternalLink className="size-3 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
