'use client'

import { AppShell } from '@/components/app/app-shell'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export default function AppDashboardPage() {
  const { sendTestNotification, isSubscribed, loading } = usePushNotifications()

  async function handleProbarNotificacion() {
    const res = await sendTestNotification()
    if (res.success) {
      alert('¡Notificación de prueba enviada con éxito! Revisa tus notificaciones.')
    } else {
      alert(`Aviso: ${res.error || 'No se pudo enviar la notificación.'}`)
    }
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleProbarNotificacion}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-full shadow-lg transition-all text-xs sm:text-sm flex items-center gap-1.5"
        >
          <span>🔔</span>
          <span>{loading ? 'Procesando...' : isSubscribed ? 'Probar Push' : 'Activar / Probar Push'}</span>
        </button>
      </div>
      <AppShell />
    </>
  )
}

