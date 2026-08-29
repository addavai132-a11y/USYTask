'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppProvider, useApp } from './app-context'
import { ToastProvider } from '@/components/ui/toast'
import { Sidebar, BottomNav } from './navigation'
import { QuickAdd } from './quick-add'
import { NotificationsPanel } from './notifications-panel'
import { OfflineBanner } from './offline-banner'
import { Onboarding } from './onboarding'
import { InstallPwa } from '@/components/pwa/install-pwa'
import { FeedScreen } from '@/components/feed/feed-screen'
import { OrganizeScreen } from '@/components/organize/organize-screen'
import { HomeScreen } from '@/components/home/home-screen'
import { FitnessScreen } from '@/components/fitness/fitness-screen'
import { FamilyScreen } from '@/components/family/family-screen'
import { ProfileScreen } from '@/components/profile/profile-screen'
import { DevModeIndicator } from '@/components/dev/dev-mode-indicator'
import { SpaceSelectorModal } from './space-selector-modal'
import { CreateSpaceModal } from './create-space-modal'
import { HistoryModal } from './history-modal'
import { FloatingRestTimer } from '@/components/fitness/floating-rest-timer'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { cn } from '@/lib/utils'
import { getStoredSession } from '@/lib/user-session'
import { isDevModeActive } from '@/lib/dev-mode'
import { createClient } from '@/lib/supabase'
import { getActiveUserSession } from '@/lib/supabase-auth'

function Screens() {
  const { tab } = useApp()
  switch (tab) {
    case 'inicio':
      return <FeedScreen />
    case 'organizar':
      return <OrganizeScreen />
    case 'hogar':
      return <HomeScreen />
    case 'fitness':
      return <FitnessScreen />
    case 'familia':
      return <FamilyScreen />
    case 'perfil':
      return <ProfileScreen />
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function verifyAuth() {
      // Immediate local verification to avoid delays
      const localSession = getStoredSession()
      const devMode = isDevModeActive()

      if (localSession || devMode) {
        if (isMounted) setChecked(true)
        return
      }

      // Background verification against Supabase Auth session
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await getActiveUserSession()
          if (isMounted) setChecked(true)
        } else {
          if (isMounted) router.replace('/login')
        }
      } catch (err) {
        console.warn('Session verification fallback to stored session:', err)
        if (isMounted) router.replace('/login')
      }
    }

    verifyAuth()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          const local = getStoredSession()
          if (!local && !isDevModeActive() && isMounted) {
            setChecked(false)
            router.replace('/')
          }
        } else if (session?.user) {
          await getActiveUserSession()
          if (isMounted) setChecked(true)
        }
      } catch (err) {
        console.warn('onAuthStateChange error handled:', err)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe?.()
    }
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] w-full flex-col items-center justify-center bg-[#05050a] text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-96 rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 right-1/4 size-80 rounded-full bg-indigo-600/15 blur-[120px]" />

        <div className="relative z-10 flex flex-col items-center gap-5 px-4 animate-fade-in">
          <UsyTaskLogo size="lg" showSubtitle />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="size-2 rounded-full bg-purple-500 animate-ping" />
            <span className="animate-pulse">Cargando tu espacio...</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function ShellInner() {
  const { tab, activeGroup } = useApp()

  useEffect(() => {
    // Asegurarse de que el estado actual en el historial sea la raíz de la app
    if (typeof window !== 'undefined') {
      if (window.history.state?.idx > 0 && window.location.pathname === '/app') {
        window.history.replaceState({ usyTab: 'inicio', usyRoot: true }, '', '/app')
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full max-w-full bg-background overscroll-y-none">
      <Sidebar />
      <div className="flex flex-1 justify-center min-w-0">
        <div
          className={cn(
            'flex w-full justify-center lg:px-6 min-w-0',
            tab === 'organizar' || tab === 'inicio' ? 'max-w-7xl' : 'max-w-4xl'
          )}
        >
          <main
            key={`${tab}_${activeGroup?.id || 'none'}`}
            className={cn(
              'w-full flex-1 px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] sm:pt-6 animate-fade-in lg:pb-10 min-w-0',
              tab === 'organizar' || tab === 'inicio'
                ? 'max-w-none mx-0'
                : 'mx-auto max-w-2xl'
            )}
          >
            <OfflineBanner />
            <Screens />
          </main>
        </div>
      </div>

      <BottomNav />
      <QuickAdd />
      <NotificationsPanel />
      <InstallPwa />
      <Onboarding />
      <DevModeIndicator />
      <SpaceSelectorModal />
      <CreateSpaceModal />
      <HistoryModal />
      <FloatingRestTimer />
    </div>
  )
}

export function AppShell() {
  return (
    <ErrorBoundary fallbackTitle="Error al cargar el Centro de Control">
      <ToastProvider>
        <AuthGate>
          <AppProvider>
            <ShellInner />
          </AppProvider>
        </AuthGate>
      </ToastProvider>
    </ErrorBoundary>
  )
}
