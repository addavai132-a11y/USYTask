'use client'

import { LayoutDashboard, Folders, House, Dumbbell, Users, User, Plus, Moon, Sun, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp, type Tab } from './app-context'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { SpaceSelectorButton } from './space-selector-button'
import { useThemeMode } from '@/components/ui/theme-mode-context'

export const navItems: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'organizar', label: 'Organizar', icon: Folders },
  { id: 'hogar', label: 'Hogar', icon: House },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'familia', label: 'Familia', icon: Users },
  { id: 'perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  const { tab, setTab } = useApp()

  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-purple-500/15 bg-white/95 dark:bg-[#090814]/85 backdrop-blur-2xl lg:hidden shadow-xl"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[10.5px] font-semibold transition-all active:scale-95 border',
                active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-purple-600/25 dark:text-purple-200 dark:border-purple-500/50 dark:shadow-[0_0_16px_rgba(168,85,247,0.25)] backdrop-blur-md'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <item.icon className={cn('size-5 transition-transform', active ? 'scale-110 text-white dark:text-purple-300' : 'text-slate-400')} strokeWidth={active ? 2.5 : 2} />
              <span className="truncate max-w-full px-0.5 text-[9.5px] sm:text-[10.5px]">{item.label}</span>
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
      onClick={() => openQuickAdd()}
      aria-label="Añadir"
      className="safe-bottom fixed bottom-24 sm:bottom-28 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 dark:shadow-purple-950/80 border border-emerald-500/30 dark:border-purple-400/30 transition-transform active:scale-90 lg:bottom-8 lg:right-8"
    >
      <Plus className="size-7 stroke-[2.5]" />
    </button>
  )
}

export function Sidebar() {
  const { tab, setTab, openQuickAdd } = useApp()
  const { mode, toggleMode } = useThemeMode()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 dark:border-purple-500/15 bg-white dark:bg-[#090814]/85 backdrop-blur-2xl px-4 py-6 lg:flex">
      <div className="flex items-center px-2">
        <UsyTaskLogo size="md" />
      </div>

      <button
        onClick={() => openQuickAdd()}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 dark:hover:from-purple-500 dark:hover:to-indigo-500 py-3 font-semibold shadow-md shadow-emerald-900/10 dark:shadow-purple-950/60 border border-emerald-500/30 dark:border-purple-400/30 transition-all active:scale-95"
      >
        <Plus className="size-5 stroke-[2.5]" />
        Añadir
      </button>

      <nav aria-label="Navegación principal" className="mt-6 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const active = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all border',
                active
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm dark:bg-purple-600/25 dark:text-purple-200 dark:border-purple-500/50 dark:shadow-[0_0_16px_rgba(168,85,247,0.2)] backdrop-blur-md'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-purple-500/10 hover:text-emerald-900 dark:hover:text-white'
              )}
            >
              <item.icon className={cn('size-5', active ? 'text-white dark:text-purple-300' : 'text-slate-400')} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          )
        })}

        {/* Modo Claro / Oscuro Switch Toggle (Justo debajo de Perfil) */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-purple-500/15">
          <button
            onClick={toggleMode}
            type="button"
            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-slate-100 dark:bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white transition-all hover:bg-slate-200/70 dark:hover:bg-purple-500/15"
          >
            <div className="flex items-center gap-2.5">
              {mode === 'dark' ? (
                <Moon className="size-4 text-purple-400" />
              ) : (
                <Sun className="size-4 text-amber-500" />
              )}
              <span className="text-[11.5px] font-bold">
                {mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
              </span>
            </div>

            {/* Pill Toggle Switch */}
            <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 dark:bg-purple-950/80 p-0.5 transition-colors">
              <span
                className={cn(
                  'pointer-events-none inline-block size-4 rounded-full shadow-md transition-transform duration-200',
                  mode === 'dark' ? 'translate-x-4 bg-purple-400' : 'translate-x-0 bg-purple-600'
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <SpaceSelectorButton />
      </div>
    </aside>
  )
}
