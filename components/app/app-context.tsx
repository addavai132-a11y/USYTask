'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import {
  SpaceData,
  getAllSpaces,
  getActiveSpace,
  setActiveSpaceId,
  getActiveSpaceId,
} from '@/lib/spaces'

export type Tab = 'inicio' | 'organizar' | 'hogar' | 'familia' | 'perfil'

interface AppState {
  tab: Tab
  setTab: (t: Tab) => void
  quickAddOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
  notificationsOpen: boolean
  setNotificationsOpen: (v: boolean) => void
  interactions: number
  bump: () => void

  // Multi-space state
  activeSpace: SpaceData
  spacesList: SpaceData[]
  switchSpace: (spaceId: string) => void
  spaceSelectorOpen: boolean
  openSpaceSelector: () => void
  closeSpaceSelector: () => void
  createSpaceModalOpen: boolean
  openCreateSpaceModal: () => void
  closeCreateSpaceModal: () => void
  refreshSpaces: () => void
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTabState] = useState<Tab>('inicio')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [interactions, setInteractions] = useState(0)

  // Spaces state
  const [activeSpace, setActiveSpaceState] = useState<SpaceData>(() => getActiveSpace())
  const [spacesList, setSpacesListState] = useState<SpaceData[]>(() => getAllSpaces())
  const [spaceSelectorOpen, setSpaceSelectorOpen] = useState(false)
  const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)

  const refreshSpaces = () => {
    setSpacesListState(getAllSpaces())
    setActiveSpaceState(getActiveSpace())
  }

  useEffect(() => {
    // Listen for custom space change event
    const handleSpaceChange = () => {
      refreshSpaces()
    }
    window.addEventListener('usytask_space_change', handleSpaceChange)
    return () => window.removeEventListener('usytask_space_change', handleSpaceChange)
  }, [])

  const switchSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId)
    refreshSpaces()
    setSpaceSelectorOpen(false)
  }

  const bump = () => setInteractions((n) => n + 1)

  const setTab = (t: Tab) => {
    setTabState(t)
    bump()
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  return (
    <AppContext.Provider
      value={{
        tab,
        setTab,
        quickAddOpen,
        openQuickAdd: () => setQuickAddOpen(true),
        closeQuickAdd: () => setQuickAddOpen(false),
        notificationsOpen,
        setNotificationsOpen,
        interactions,
        bump,

        activeSpace,
        spacesList,
        switchSpace,
        spaceSelectorOpen,
        openSpaceSelector: () => setSpaceSelectorOpen(true),
        closeSpaceSelector: () => setSpaceSelectorOpen(false),
        createSpaceModalOpen,
        openCreateSpaceModal: () => {
          setSpaceSelectorOpen(false)
          setCreateSpaceModalOpen(true)
        },
        closeCreateSpaceModal: () => setCreateSpaceModalOpen(false),
        refreshSpaces,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
