'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-pwa'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-warning/20 px-3 py-2 text-xs font-semibold text-warning-foreground animate-slide-up-fade">
      <WifiOff className="size-4" />
      Sin conexión — mostrando lo esencial guardado.
    </div>
  )
}
