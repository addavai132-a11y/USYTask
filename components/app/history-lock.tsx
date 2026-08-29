'use client'

import { useEffect } from 'react'

export function HistoryLock() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Inyectamos un par de estados idénticos de golpe para crear un "colchón" en el historial
    window.history.pushState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)

    const handlePopState = (e: PopStateEvent) => {
      // Si un modal activo o drawer está abierto y gestionando el retroceso, permitimos su cierre
      if (e.state?.usyModal) {
        return
      }

      // 2. Detenemos la propagación inmediatamente en fase de captura para que el router de Next.js no se entere del retroceso
      e.stopPropagation()
      e.stopImmediatePropagation?.()

      // 3. Volvemos a empujar el estado para rellenar el hueco que acaba de consumir el botón atrás
      window.history.pushState(null, '', window.location.href)
    }

    // 4. IMPORTANTE: Usamos `true` (fase de captura) para interceptarlo antes que cualquier otro listener
    window.addEventListener('popstate', handlePopState, true)

    return () => {
      window.removeEventListener('popstate', handlePopState, true)
    }
  }, [])

  return null
}

export default HistoryLock
