'use client'

import { AppProvider, useApp } from './app-context'
import { ToastProvider } from '@/components/ui/toast'
import { Sidebar, BottomNav, FloatingAddButton } from './navigation'
import { QuickAdd } from './quick-add'
import { NotificationsPanel } from './notifications-panel'
import { OfflineBanner } from './offline-banner'
import { RightRail } from './right-rail'
import { Onboarding } from './onboarding'
import { InstallPwa } from '@/components/pwa/install-pwa'
import { FeedScreen } from '@/components/feed/feed-screen'
import { OrganizeScreen } from '@/components/organize/organize-screen'
import { HomeScreen } from '@/components/home/home-screen'
import { FamilyScreen } from '@/components/family/family-screen'
import { ProfileScreen } from '@/components/profile/profile-screen'
import { DevModeIndicator } from '@/components/dev/dev-mode-indicator'
import { SpaceSelectorModal } from './space-selector-modal'
import { CreateSpaceModal } from './create-space-modal'

function Screens() {
  const { tab } = useApp()
  switch (tab) {
    case 'inicio':
      return <FeedScreen />
    case 'organizar':
      return <OrganizeScreen />
    case 'hogar':
      return <HomeScreen />
    case 'familia':
      return <FamilyScreen />
    case 'perfil':
      return <ProfileScreen />
  }
}

function ShellInner() {
  const { tab, activeSpace } = useApp()
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-5xl gap-6 lg:px-6">
          <main
            key={`${tab}_${activeSpace.id}`}
            className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-5 animate-fade-in lg:max-w-xl lg:pb-10"
          >
            <OfflineBanner />
            <Screens />
          </main>
          {tab === 'inicio' && <RightRail />}
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
    </div>
  )
}

export function AppShell() {
  return (
    <ToastProvider>
      <AppProvider>
        <ShellInner />
      </AppProvider>
    </ToastProvider>
  )
}
