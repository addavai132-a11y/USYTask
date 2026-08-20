'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, LogOut } from 'lucide-react'
import { isDevModeActive, disableDevMode } from '@/lib/dev-mode'

export function DevModeIndicator() {
  const router = useRouter()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(isDevModeActive())
  }, [])

  if (!active) return null

  const handleExitDevMode = () => {
    disableDevMode()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-950/90 p-2 pl-3.5 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-xl animate-fade-in sm:bottom-4 sm:right-4">
      <div className="flex items-center gap-1.5">
        <Zap className="size-4 animate-pulse text-amber-400 fill-amber-400" />
        <span className="tracking-wider uppercase text-[11px] font-black">DEV MODE</span>
      </div>
      <span className="hidden sm:inline text-amber-200/70">|</span>
      <span className="hidden sm:inline text-[11px] text-amber-100 font-medium">Alex Martín · Casa Nexo</span>
      <button
        type="button"
        onClick={handleExitDevMode}
        className="ml-1 flex items-center gap-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition-colors active:scale-95 border border-amber-500/30"
        title="Salir del modo desarrollo y volver al inicio"
      >
        <LogOut className="size-3.5" />
        <span>Salir</span>
      </button>
    </div>
  )
}
