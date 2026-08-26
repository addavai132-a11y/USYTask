'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Home, Smartphone, Bell, LogOut, Zap, History } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { getActiveUserSession, handleLogout } from '@/lib/supabase-auth'
import { UserProfile, calculateAge } from '@/lib/user-session'
import { isDevModeActive, disableDevMode } from '@/lib/dev-mode'
import { InviteSection } from './invite-section'
import { SpacesManagementSection } from './spaces-management-section'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'

export function ProfileScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const { notificationsOpen, setNotificationsOpen, userName, activeGroup, members, openHistory } = useApp()
  const [session, setSession] = useState<UserProfile | null>(null)

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

  const displayName = session?.fullName || session?.username || userName
  const displayEmail = session?.email || ''
  const displayUsername = session?.username ? `@${session.username}` : ''

  // Find current user's member data
  const currentMember = members.find((m) => m.isOwner)

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Perfil"
        subtitle="Configuración personal, del hogar y documentos"
      />

      {/* USUARIO */}
      <Card variant="turquoise" className="flex items-center gap-4">
        {session?.avatarUrl ? (
          <img
            src={session.avatarUrl}
            alt={displayName}
            className="size-16 rounded-full border-2 border-primary object-cover shadow-soft shrink-0"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold text-xl border-2 border-cyan-500/40">
            <User className="size-8" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black truncate">{displayName}</h3>
            <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-800 dark:text-cyan-300 shrink-0">
              Miembro
            </span>
          </div>
          {displayEmail && <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>}
          <div className="mt-1 flex items-center gap-2 text-xs font-extrabold text-cyan-900 dark:text-cyan-200">
            {displayUsername && <span>{displayUsername}</span>}
            {session?.dateOfBirth || session?.age ? (
              <span>· {calculateAge(session?.dateOfBirth) ?? session?.age} años</span>
            ) : null}
          </div>
          {currentMember && (
            <div className="mt-2 flex items-center gap-3 text-xs font-extrabold">
              <span className="text-amber-600 dark:text-amber-400">⭐ {currentMember.points} puntos</span>
              <span className="text-orange-500">🔥 {currentMember.streak} días racha</span>
            </div>
          )}
        </div>
      </Card>

      {/* HOGAR */}
      {activeGroup && (
        <Card variant="olive">
          <CardHeader
            title="Mi Grupo Activo"
            icon={<Home className="size-5 text-lime-700 dark:text-lime-400" />}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-lime-500/15 border border-lime-500/25 p-3">
              <div>
                <p className="font-bold text-sm">{activeGroup.name}</p>
                <p className="text-xs text-muted-foreground">
                  {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECCIÓN MIS ESPACIOS */}
      <SpacesManagementSection />

      {/* SECCIÓN INVITACIÓN */}
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

          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen)
              toast(notificationsOpen ? 'Notificaciones desactivadas' : 'Notificaciones activadas', '🔔')
            }}
            className="flex items-center justify-between rounded-2xl bg-teal-500/15 border border-teal-500/25 p-3 text-left transition-colors hover:bg-teal-500/20"
          >
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-sm font-bold">Notificaciones</p>
                <p className="text-xs text-muted-foreground">Alertas de tareas y calendario</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
              {notificationsOpen ? 'Activadas' : 'Desactivadas'}
            </span>
          </button>

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
    </div>
  )
}
