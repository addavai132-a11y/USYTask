'use client'

import { useState, useEffect, useCallback } from 'react'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Función helper principal para solicitar permisos y activar notificaciones.
 * Hace fallback automático a la API nativa de Notification si no existe VAPID key.
 */
export async function enableNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones de escritorio.')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return false
    }

    // Comprobar si existe clave para Push remoto
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey || vapidKey.trim() === '') {
      console.info('Modo local: Notificaciones activadas sin VAPID key remota.')
      try {
        new Notification('USYTask', {
          body: '¡Notificaciones activadas correctamente!',
          icon: '/icon-192x192.png',
        })
      } catch (e) {
        console.warn('Advertencia al lanzar notificación nativa:', e)
      }
      return true
    }

    // Si existe VAPID key y Service Worker, intentar registrar el Service Worker Push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        let keyParam: Uint8Array | string = vapidKey
        try {
          keyParam = urlBase64ToUint8Array(vapidKey)
        } catch {
          keyParam = vapidKey
        }

        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyParam,
        })
        return true
      } catch (err) {
        console.warn('Aviso al registrar push manager remoto, manteniendo modo local activo:', err)
        return true // Mantener activo en modo local aunque falle el push server
      }
    }

    return true
  } catch (err) {
    console.error('Error al habilitar notificaciones:', err)
    return false
  }
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(false)

  // 1. Verificar soporte y suscripción activa al montar
  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return

    const hasNotification = 'Notification' in window
    setIsSupported(hasNotification)

    if (!hasNotification) return

    setPermission(Notification.permission)

    if (Notification.permission === 'granted') {
      setIsSubscribed(true)
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          setSubscription(sub)
          if (sub) {
            setIsSubscribed(true)
          }
        }
      } catch (err) {
        console.warn('Error al comprobar suscripción Push remota:', err)
      }
    }
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  // 2. Suscribirse a las notificaciones (Push remoto si hay VAPID o Local nativo)
  const subscribe = async (): Promise<{ success: boolean; error?: string; localOnly?: boolean }> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Este dispositivo o navegador no soporta notificaciones.' }
    }

    setLoading(true)
    try {
      const ok = await enableNotifications()
      const currentPerm = Notification.permission
      setPermission(currentPerm)

      if (!ok || currentPerm !== 'granted') {
        setLoading(false)
        setIsSubscribed(false)
        return {
          success: false,
          error: currentPerm === 'denied' ? 'Permiso de notificaciones denegado en el navegador.' : 'No se pudo activar el permiso.',
        }
      }

      setIsSubscribed(true)

      // Si hay soporte de ServiceWorker, intentar registrar o sincronizar suscripción
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (vapidKey && vapidKey.trim() !== '' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            setSubscription(sub)
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub }),
            }).catch(() => ({}))
          }
        } catch (e) {
          console.warn('Sincronización remota Push opcional no completada:', e)
        }
      }

      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.warn('Error durante suscripción:', err)
      const granted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      setIsSubscribed(granted)
      setLoading(false)
      return { success: granted }
    }
  }

  // 3. Desuscribirse
  const unsubscribe = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe().catch(() => ({}))

        // Eliminar del backend
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch(() => ({}))
      }

      setSubscription(null)
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.error('Error desuscribiendo:', err)
      setSubscription(null)
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    }
  }

  // 4. Probar notificación (Modo Push o Fallback Local)
  const sendTestNotification = async (): Promise<{ success: boolean; error?: string }> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'Notificaciones no soportadas en este dispositivo.' }
    }

    try {
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
        setPermission(perm)
      }

      if (perm !== 'granted') {
        return { success: false, error: 'Permiso de notificaciones no concedido.' }
      }

      setIsSubscribed(true)

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      // Fallback local directo si no hay VAPID key
      if (!vapidKey || vapidKey.trim() === '') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready.catch(() => null)
            if (reg && reg.showNotification) {
              await reg.showNotification('USYTask 🚀', {
                body: '¡Notificación de prueba recibida correctamente!',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
              })
              return { success: true }
            }
          }
        } catch {
          // fallback a new Notification
        }

        new Notification('USYTask 🚀', {
          body: '¡Notificación de prueba recibida correctamente!',
          icon: '/icon-192x192.png',
        })
        return { success: true }
      }

      // Si existe clave VAPID, intentar vía endpoint remoto
      let currentSub: PushSubscription | null = null
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready.catch(() => null)
        if (reg) {
          currentSub = await reg.pushManager.getSubscription().catch(() => null)
        }
      }

      if (currentSub) {
        const res = await fetch('/api/test-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: currentSub }),
        }).catch(() => null)

        if (res && res.ok) {
          return { success: true }
        }
      }

      // Si el endpoint falló o no había suscripción remota, fallback local
      try {
        new Notification('USYTask 🚀', {
          body: '¡Notificación de prueba recibida correctamente!',
          icon: '/icon-192x192.png',
        })
      } catch (e) {
        console.warn('Fallback local error:', e)
      }

      return { success: true }
    } catch (err: unknown) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('USYTask 🚀', {
            body: '¡Notificación de prueba recibida correctamente!',
            icon: '/icon-192x192.png',
          })
          return { success: true }
        } catch {}
      }
      const message = err instanceof Error ? err.message : 'Error enviando prueba.'
      return { success: false, error: message }
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    subscription,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription,
  }
}

