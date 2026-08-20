'use client'

import { Home, LayoutGrid, House, Users, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp, type Tab } from './app-context'

export const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'organizar', label: 'Organizar', icon: LayoutGrid },
  { id: 'hogar', label: 'Hogar', icon: House },
  { id: 'familia', label: 'Familia', icon: Users },
  { id: 'perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const { tab, setTab } = useApp()

  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pt-1.5">
        {navItems.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon className={cn('size-6 transition-transform', active && 'scale-110')} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function FloatingAddButton() {
  const { openQuickAdd } = useApp()
  return (
    <button
      onClick={openQuickAdd}
      aria-label="Añadir"
      className="safe-bottom fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg transition-transform active:scale-90 lg:bottom-8 lg:right-8"
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </button>
  )
}

import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { SpaceSelectorButton } from './space-selector-button'

export function Sidebar() {
  const { tab, setTab, openQuickAdd } = useApp()
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center px-2">
        <UsyTaskLogo size="md" />
      </div>

      <button
        onClick={openQuickAdd}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-primary-foreground transition-transform active:scale-95"
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Añadir
      </button>

      <nav aria-label="Navegación principal" className="mt-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60',
              )}
            >
              <item.icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <SpaceSelectorButton />
      </div>
    </aside>
  )
}
