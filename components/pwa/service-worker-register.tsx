'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Register after load so it never blocks first paint.
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Comprobar si hay una nueva versión del Service Worker cada vez que se carga la PWA
          reg.update().catch(() => {})
        })
        .catch(() => {
          // Silently ignore — the app must work fine without the SW.
        })
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
