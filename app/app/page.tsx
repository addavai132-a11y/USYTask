'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/app/app-shell'

export default function AppDashboardPage() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Solo blindamos el historial si estamos exactamente en la raíz del dashboard
    if (pathname === '/app') {
      // Reemplazamos el estado actual para anclarlo
      window.history.replaceState({ usyRoot: true }, '', window.location.href)

      // Añadimos un estado hacia adelante para tener algo que atrapar
      window.history.pushState({ usyRoot: true }, '', window.location.href)

      const handlePopState = (event: PopStateEvent) => {
        // Si un modal activo ya gestionó el evento (usyModal), dejamos que cierre el modal
        if (event.state?.usyModal) return

        // Si el usuario intenta ir atrás en la pantalla principal, lo devolvemos instantáneamente al mismo sitio
        window.history.pushState({ usyRoot: true }, '', window.location.href)
      }

      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname])

  return <AppShell />
}


