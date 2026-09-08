'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Home, Map as MapIcon, PlusSquare, User, Menu, MessageSquare, Search, BookOpen, Skull, Car, Crosshair, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/explore', label: 'Explorar', icon: Compass },
  { href: '/forum', label: 'Foro', icon: MessageSquare },
  { href: '/map', label: 'Mapa', icon: MapIcon },
  { href: '/secrets', label: 'Secretos', icon: Skull, desktopOnly: true },
  { href: '/guides', label: 'Guías', icon: BookOpen, desktopOnly: true },
  { href: '/vehicles', label: 'Vehículos', icon: Car, desktopOnly: true },
  { href: '/weapons', label: 'Armas', icon: Crosshair, desktopOnly: true },
  { href: '/characters', label: 'Personajes', icon: Users, desktopOnly: true },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-background)]">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--color-vice-border)] bg-[var(--color-surface)] fixed h-screen top-0 left-0">
        <div className="p-6 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded bg-gradient-to-br from-[var(--color-vice-pink)] to-[var(--color-vice-purple)] flex items-center justify-center font-display font-black text-white">
              V
            </div>
            <span className="font-display font-black text-xl tracking-wide">VICE HUB</span>
          </Link>
        </div>
        
        <div className="px-4 py-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-vice-gray)] bg-[var(--color-background)] rounded-lg border border-[var(--color-vice-border)] hover:text-white transition-colors">
            <Search className="size-4" />
            <span>Buscar...</span>
            <kbd className="ml-auto text-[10px] bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-vice-border)]">Ctrl K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive 
                    ? 'bg-[var(--color-vice-purple)]/10 text-[var(--color-vice-pink)] border border-[var(--color-vice-purple)]/20' 
                    : 'text-[var(--color-vice-gray)] hover:text-white hover:bg-[var(--color-vice-border)]'
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-[var(--color-vice-border)] mt-auto">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-vice-border)] transition-colors">
            <img src="https://i.pravatar.cc/150?u=u1" alt="Avatar" className="size-8 rounded-full border-2 border-[var(--color-vice-pink)]" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">NeonGator</span>
              <span className="text-[10px] text-[var(--color-vice-pink)] font-bold">LVL 24 • EXPLORADOR</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-vice-border)] glass-panel sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 rounded bg-gradient-to-br from-[var(--color-vice-pink)] to-[var(--color-vice-purple)] flex items-center justify-center font-display font-black text-white text-sm">
            V
          </div>
          <span className="font-display font-black text-lg tracking-wide text-white">VICE HUB</span>
        </Link>
        <button className="p-2 text-[var(--color-vice-gray)] hover:text-white">
          <Search className="size-5" />
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 overflow-x-hidden min-h-screen">
        {children}
      </main>

      {/* BOTTOM NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-[var(--color-vice-border)] flex items-center justify-around p-2 z-50 pb-safe">
        {[
          { href: '/', label: 'Inicio', icon: Home },
          { href: '/explore', label: 'Explorar', icon: Compass },
          { href: '/create', label: 'Crear', icon: PlusSquare, highlight: true },
          { href: '/map', label: 'Mapa', icon: MapIcon },
          { href: '/profile', label: 'Perfil', icon: User },
        ].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-xl transition-colors',
                item.highlight 
                  ? 'bg-gradient-to-r from-[var(--color-vice-pink)] to-[var(--color-vice-magenta)] text-white shadow-[0_0_15px_rgba(233,51,255,0.4)] -mt-5 size-12' 
                  : isActive
                    ? 'text-[var(--color-vice-pink)]'
                    : 'text-[var(--color-vice-gray)] hover:text-white'
              )}
            >
              <item.icon className={cn(item.highlight ? 'size-6' : 'size-5')} />
              {!item.highlight && (
                <span className="text-[9px] font-medium mt-1">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
