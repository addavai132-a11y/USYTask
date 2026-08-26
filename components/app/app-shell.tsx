'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppProvider, useApp } from './app-context'
import { ToastProvider } from '@/components/ui/toast'
import { Sidebar, BottomNav, FloatingAddButton } from './navigation'
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
import { cn } from '@/lib/utils'
import { getStoredSession } from '@/lib/user-session'
import { isDevModeActive } from '@/lib/dev-mode'

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
    const session = getStoredSession()
    const devMode = isDevModeActive()
    if (!session && !devMode) {
      router.push('/login')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    )
  }
  return <>{children}</>
}

function ShellInner() {
  const { tab, activeGroup } = useApp()
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 justify-center min-w-0">
        <div
          className={cn(
            'flex w-full justify-center lg:px-6 min-w-0',
            tab === 'organizar' ? 'max-w-7xl' : 'max-w-4xl'
          )}
        >
          <main
            key={`${tab}_${activeGroup?.id || 'none'}`}
            className={cn(
              'w-full flex-1 px-4 pb-28 pt-5 animate-fade-in lg:pb-10 min-w-0',
              tab === 'organizar'
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
      <FloatingAddButton />
      <QuickAdd />
      <NotificationsPanel />
      <InstallPwa />
      <Onboarding />
      <DevModeIndicator />
      <SpaceSelectorModal />
      <CreateSpaceModal />
      <HistoryModal />
    </div>
  )
}

export function AppShell() {
  return (
    <ToastProvider>
      <AuthGate>
        <AppProvider>
          <ShellInner />
        </AppProvider>
      </AuthGate>
    </ToastProvider>
  )
}
