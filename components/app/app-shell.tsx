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

  useEffect(() => {
    let isMounted = true

    async function verifyAuth() {
      // Immediate local verification to avoid delays
      const localSession = getStoredSession()
      const devMode = isDevModeActive()

      if (localSession || devMode) {
        return
      }

      // Background verification against Supabase Auth session
      try {
        const supabase = createClient()
        
        const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: new Error('Supabase timeout') }), 2500)
        )
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])
        
        if (error) {
          throw error
        }

        if (session?.user) {
          await getActiveUserSession().catch(() => {})
        } else {
          if (isMounted) {
            const currentPath = window.location.pathname
            if (currentPath !== '/login' && currentPath !== '/') {
               router.replace('/login')
            }
          }
        }
      } catch (err) {
        console.warn('Session verification fallback to stored session:', err)
        if (isMounted) {
           const currentPath = window.location.pathname
           if (currentPath !== '/login' && currentPath !== '/') {
              router.replace('/login')
           }
        }
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
            const currentPath = window.location.pathname
            if (currentPath !== '/login' && currentPath !== '/') {
               router.replace('/')
            }
          }
        } else if (session?.user) {
          await getActiveUserSession().catch(() => {})
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

  // Bypassed loading block
  // The app will ALWAYS render children instantly.
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
