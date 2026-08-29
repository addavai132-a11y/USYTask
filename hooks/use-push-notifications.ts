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
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && hasNotification
    setIsSupported(supported || hasNotification)

    if (!hasNotification) return

    setPermission(Notification.permission)

    if (supported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          setSubscription(sub)
          setIsSubscribed(!!sub || Notification.permission === 'granted')
          return
        }
      } catch (err) {
        console.error('Error al comprobar suscripción Push:', err)
      }
    }

    if (Notification.permission === 'granted') {
      setIsSubscribed(true)
    }
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  // 2. Suscribirse a las notificaciones Push / Locales
  const subscribe = async (): Promise<{ success: boolean; error?: string; localOnly?: boolean }> => {
    if (typeof window === 'undefined') {
      return { success: false, error: 'Entorno no soportado.' }
    }

    setLoading(true)
    try {
      // Permitir notificaciones locales estándar de Notification API sin romper la app
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        setPermission(perm)
      } else if ('Notification' in window) {
        setPermission(Notification.permission)
      }

      if ('Notification' in window && Notification.permission === 'denied') {
        setLoading(false)
        return { success: false, error: 'Permiso de notificaciones denegado en el navegador.' }
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.warn('VAPID public key no configurada. Saltando suscripción push remota o usando fallback local.')
        setIsSubscribed(Notification.permission === 'granted')
        setLoading(false)
        return { success: Notification.permission === 'granted', localOnly: true }
      }

      // Si el navegador no soporta serviceWorker o PushManager pero sí Notification
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSubscribed(Notification.permission === 'granted')
        setLoading(false)
        return { success: Notification.permission === 'granted', localOnly: true }
      }

      // Asegurar registro del Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Obtener o crear suscripción Push remota
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      // Guardar en Supabase a través del endpoint API
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.warn('Advertencia al sincronizar suscripción con el servidor:', data.error)
      }

      setSubscription(sub)
      setIsSubscribed(true)
      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.warn('Aviso suscripción Push remota, recurriendo a modo nativo/local:', err)
      const granted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      setIsSubscribed(granted)
      setLoading(false)
      if (granted) {
        return { success: true, localOnly: true }
      }
      const message = err instanceof Error ? err.message : 'Error al activar notificaciones.'
      return { success: false, error: message }
    }
  }

  // 3. Desuscribirse
  const unsubscribe = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()

        // Eliminar del backend
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        }).catch((e) => console.warn('Error eliminando endpoint remoto:', e))
      }

      setSubscription(null)
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.error('Error desuscribiendo de Push:', err)
      setSubscription(null)
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    }
  }

  // 4. Probar notificación push de test con fallback local
  const sendTestNotification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      // Fallback a notificación nativa local si no hay clave VAPID configurada
      if (!vapidPublicKey) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          let perm = Notification.permission
          if (perm === 'default') {
            perm = await Notification.requestPermission()
            setPermission(perm)
          }

          if (perm === 'granted') {
            try {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready.catch(() => null)
                if (reg && reg.showNotification) {
                  await reg.showNotification('USYTask 🚀', {
                    body: '¡Notificación de prueba recibida correctamente!',
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                  })
                  setIsSubscribed(true)
                  return { success: true }
                }
              }
            } catch {
              // Ignore and fallback to Notification constructor
            }

            new Notification('USYTask 🚀', {
              body: '¡Notificación de prueba recibida correctamente!',
              icon: '/icon-192x192.png',
            })
            setIsSubscribed(true)
            return { success: true }
          } else {
            return { success: false, error: 'Permiso de notificaciones no concedido.' }
          }
        }
        return { success: false, error: 'Notificaciones no soportadas en este dispositivo.' }
      }

      if (!subscription) {
        const subResult = await subscribe()
        if (!subResult.success && !subResult.localOnly) return subResult
      }

      let currentSub: PushSubscription | null = null
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready.catch(() => null)
        if (reg) {
          currentSub = await reg.pushManager.getSubscription().catch(() => null)
        }
      }

      if (!currentSub) {
        // Disparar notificación nativa directamente
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('USYTask 🚀', {
            body: '¡Notificación de prueba recibida correctamente!',
            icon: '/icon-192x192.png',
          })
          return { success: true }
        }
        return { success: false, error: 'No se pudo inicializar la notificación.' }
      }

      const res = await fetch('/api/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: currentSub }),
      })

      if (res.ok) {
        return { success: true }
      } else {
        // Fallback a notificación local si el servidor no tiene las claves
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('USYTask 🚀', {
            body: '¡Notificación de prueba recibida correctamente (modo local)!',
            icon: '/icon-192x192.png',
          })
          return { success: true }
        }
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error || 'Error enviando la notificación de prueba.' }
      }
    } catch (err: unknown) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('USYTask 🚀', {
          body: '¡Notificación de prueba recibida correctamente!',
          icon: '/icon-192x192.png',
        })
        return { success: true }
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
