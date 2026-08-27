'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Home, Smartphone, Bell, LogOut, Zap, History, Loader2, Sliders } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { getActiveUserSession, handleLogout } from '@/lib/supabase-auth'
import { UserProfile, calculateAge } from '@/lib/user-session'
import { isDevModeActive, disableDevMode } from '@/lib/dev-mode'
import { InviteSection } from './invite-section'
import { SpacesManagementSection } from './spaces-management-section'
import { NotificationPreferencesModal } from '@/components/notifications/notification-preferences-modal'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { cn } from '@/lib/utils'

export function ProfileScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const { userName, activeGroup, members, openHistory } = useApp()
  const [session, setSession] = useState<UserProfile | null>(null)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)

  const {
    isSubscribed,
    loading: pushLoading,
    permission,
    isSupported,
    subscribe,
    unsubscribe,
  } = usePushNotifications()

  useEffect(() => {
    async function loadUser() {
      const u = await getActiveUserSession()
      if (u) setSession(u)
    }
    loadUser()
  }, [])

  const onSignOut = async () => {
    await handleLogout()
    toast('Sesión cerrada correctamente', '👋')
    router.push('/login')
  }

  const handleToggleNotifications = async (e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!isSupported) {
      toast('Este navegador no admite notificaciones Web Push.', '⚠️')
      return
    }

    if (permission === 'denied') {
      toast('Permiso bloqueado en el navegador. Habilítalo en los ajustes del sitio.', '🔒')
      return
    }

    if (isSubscribed) {
      const res = await unsubscribe()
      if (res.success) {
        toast('Notificaciones desactivadas en este dispositivo', '🔕')
      } else {
        toast(res.error || 'Error al desactivar notificaciones', '❌')
      }
    } else {
      const res = await subscribe()
      if (res.success) {
        toast('Notificaciones Push activadas con éxito', '🔔')
      } else {
        toast(res.error || 'No se pudo conceder el permiso', '⚠️')
      }
    }
  }

  const displayName = session?.fullName || session?.username || userName
  const displayEmail = session?.email || ''
  const displayUsername = session?.username ? `@${session.username}` : ''

  // Find current user's member data
  const currentMember = members.find((m) => m.name.toLowerCase() === userName.toLowerCase())
  const userRole = currentMember?.role === 'admin' ? 'Administrador' : currentMember?.role === 'hijo' ? 'Hijo/a' : 'Adulto'
  const userPoints = currentMember?.points || 0
  const userStreak = currentMember?.streakDays || currentMember?.streak || 0

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in pb-12">
      <ScreenHeader
        title="Mi Perfil"
        subtitle="Gestiona tu cuenta, roles y ajustes del espacio"
      />

      {/* TARJETA PRINCIPAL DE USUARIO */}
      <Card className="overflow-hidden border-border/80 shadow-md">
        <div className="bg-gradient-to-r from-emerald-600/20 via-primary/15 to-teal-500/20 p-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-2xl shadow-soft ring-4 ring-background">
              {session?.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt={displayName}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <span
              className="absolute bottom-0 right-0 size-5 rounded-full bg-emerald-500 ring-2 ring-background"
              title="En línea"
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl font-black tracking-tight text-foreground truncate">
              {displayName}
            </h2>
            {displayUsername && (
              <p className="text-xs font-semibold text-primary">{displayUsername}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{displayEmail}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                {userRole}
              </span>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1">
                ⭐ {userPoints} pts
              </span>
              {userStreak > 0 && (
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-300 flex items-center gap-1">
                  🔥 {userStreak} días de racha
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* GESTIÓN DE ESPACIOS / GRUPOS */}
      <SpacesManagementSection />

      {/* INVITACIONES */}
      <InviteSection />

      {/* AJUSTES */}
      <Card variant="mint">
        <CardHeader
          title="Ajustes de la aplicación"
          icon={<Smartphone className="size-5 text-teal-600 dark:text-teal-400" />}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={openHistory}
            className="flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/20 p-3 text-left transition-colors hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <History className="size-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Historial del grupo</p>
                <p className="text-xs text-muted-foreground">Ver elementos archivados</p>
              </div>
            </div>
          </button>

          {/* Switch Interactivo de Notificaciones Push con Acceso al Panel de Preferencias */}
          <div className="flex items-center justify-between rounded-2xl bg-teal-500/15 border border-teal-500/25 p-3 transition-colors hover:bg-teal-500/20">
            <div
              onClick={() => setIsNotificationModalOpen(true)}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-300 shrink-0">
                <Bell className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Notificaciones Push</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsNotificationModalOpen(true)
                    }}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                    title="Configurar alertas por sector"
                  >
                    <Sliders className="size-3" />
                    <span>Personalizar</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  Alertas en tiempo real para eventos, fitness, finanzas y hogar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                role="switch"
                aria-checked={isSubscribed}
                disabled={pushLoading || !isSupported}
                onClick={handleToggleNotifications}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                  isSubscribed
                    ? 'bg-emerald-600 dark:bg-teal-500'
                    : 'bg-slate-300 dark:bg-white/20'
                )}
                title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              >
                {pushLoading ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-3.5 animate-spin text-white" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                      isSubscribed ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-bold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/20 active:scale-[0.98]"
          >
            <LogOut className="size-5" />
            <span>Cerrar sesión</span>
          </button>

          {isDevModeActive() && (
            <button
              onClick={() => {
                disableDevMode()
                toast('Modo desarrollo desactivado', '⚡')
                router.push('/')
                router.refresh()
              }}
              className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3 text-sm font-bold text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/25 active:scale-[0.98]"
            >
              <Zap className="size-5 text-amber-500 fill-amber-500" />
              <span>Salir del modo desarrollo</span>
            </button>
          )}
        </div>
      </Card>

      {/* Modal de Preferencias de Notificación Push */}
      <NotificationPreferencesModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  )
}
