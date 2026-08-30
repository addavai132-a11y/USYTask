'use client'

import { Bell, BellRing, Loader2 } from 'lucide-react'
import { useApp } from '@/components/app/app-context'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useToast } from '@/components/ui/toast'
import { ThemeModeToggle } from '@/components/ui/theme-mode-toggle'
import { getGreeting, getTodayLabel } from '@/lib/date-utils'

export function FeedHeader() {
  const { setNotificationsOpen, userName, notifications } = useApp()
  const { activateAndTest, loading: pushLoading } = usePushNotifications()
  const { toast } = useToast()

  const handleActivate = async () => {
    const res = await activateAndTest()
    if (res.success) {
      toast('¡Notificación de prueba enviada con éxito!', '🚀')
    } else {
      toast(res.error || 'Aviso en notificación', '🔔')
    }
  }

  return (
    <header className="mb-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}, {userName}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">{getTodayLabel()}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleActivate}
            disabled={pushLoading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors bg-green-600 text-white hover:bg-green-700 dark:bg-purple-600/20 dark:text-purple-300 dark:border dark:border-purple-500/30 dark:hover:bg-purple-600/30 shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
            title="Activar notificaciones Push y enviar prueba"
          >
            {pushLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <BellRing className="size-3.5 text-white dark:text-purple-400 shrink-0" />
            )}
            <span className="text-[11px] sm:text-xs font-semibold whitespace-nowrap">
              Activar notificaciones
            </span>
          </button>

          <ThemeModeToggle />

          <button
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notificaciones"
            className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm transition-all active:scale-90 dark:border-purple-500/20 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white"
          >
            <Bell className="size-5" />
            {notifications.some((n) => !n.read) ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs">
                {notifications.filter((n) => !n.read).length > 9
                  ? '9+'
                  : notifications.filter((n) => !n.read).length}
              </span>
            ) : notifications.length > 0 ? (
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-white dark:border-[#100e23] bg-slate-400" />
            ) : null}
          </button>
        </div>
      </div>
    </header>
  )
}

