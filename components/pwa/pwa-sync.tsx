'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { syncFromSupabaseCloud } from '@/lib/cloud-sync'

/**
 * PwaSync
 * Componente cliente para forzar la sincronización en la versión instalada (PWA / Acceso directo).
 *
 * 1. Escucha los eventos `visibilitychange` y `focus` de la ventana.
 * 2. Cuando la app vuelve al primer plano (el usuario abre el acceso directo o cambia de app),
 *    ejecuta `router.refresh()` de `next/navigation` para forzar a Next.js a re-renderizar
 *    los Server Components con datos frescos del servidor/Supabase.
 * 3. Ejecuta `syncFromSupabaseCloud()` para sincronizar familias y miembros en el store local.
 * 4. Despacha el evento `usytask_group_change` para actualizar reactivamente la UI cliente.
 */
export function PwaSync() {
  const router = useRouter()
  const lastSyncRef = useRef<number>(0)
  const isSyncingRef = useRef<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleSync = async (trigger: string) => {
      const now = Date.now()
      // Throttle de 2.5s para evitar llamadas redundantes si focus y visibilitychange disparan a la vez
      if (now - lastSyncRef.current < 2500 || isSyncingRef.current) {
        return
      }

      lastSyncRef.current = now
      isSyncingRef.current = true

      try {
        console.log(`[PWA Sync] Revalidando datos frescos por evento: ${trigger}`)

        // 1. Refrescar Server Components en Next.js App Router (invalida Router Cache en cliente)
        router.refresh()

        // 2. Sincronizar datos locales con Supabase Cloud (household_members, familias, etc.)
        await syncFromSupabaseCloud().catch((err) => {
          console.warn('[PWA Sync] Aviso al sincronizar desde Supabase Cloud:', err)
        })

        // 3. Notificar a los componentes de cliente (Dashboard, selector de espacios, tabs)
        window.dispatchEvent(new CustomEvent('usytask_group_change'))
      } catch (err) {
        console.error('[PWA Sync] Error durante la sincronización:', err)
      } finally {
        isSyncingRef.current = false
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSync('visibilitychange')
      }
    }

    const onFocus = () => {
      handleSync('focus')
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [router])

  return null
}
