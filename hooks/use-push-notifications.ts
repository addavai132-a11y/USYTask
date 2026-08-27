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

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsSupported(supported)

    if (!supported) return

    setPermission(Notification.permission)

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        setSubscription(sub)
        setIsSubscribed(!!sub)
      }
    } catch (err) {
      console.error('Error al comprobar suscripción Push:', err)
    }
  }, [])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  // 2. Suscribirse a las notificaciones Push
  const subscribe = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) {
      return { success: false, error: 'Este navegador no soporta notificaciones Push.' }
    }

    setLoading(true)
    try {
      // Solicitar permiso al usuario si aún no está otorgado
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return { success: false, error: 'Permiso de notificaciones denegado.' }
      }

      // Asegurar registro del Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setLoading(false)
        return { success: false, error: 'Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en la configuración.' }
      }

      // Obtener o crear suscripción
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
        setLoading(false)
        return { success: false, error: data.error || 'Error al persistir la suscripción en el servidor.' }
      }

      setSubscription(sub)
      setIsSubscribed(true)
      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.error('Error suscribiendo a Push:', err)
      setLoading(false)
      const message = err instanceof Error ? err.message : 'Error desconocido al suscribirse.'
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
        })
      }

      setSubscription(null)
      setIsSubscribed(false)
      setLoading(false)
      return { success: true }
    } catch (err: unknown) {
      console.error('Error desuscribiendo de Push:', err)
      setLoading(false)
      const message = err instanceof Error ? err.message : 'Error al cancelar la suscripción.'
      return { success: false, error: message }
    }
  }

  // 4. Probar notificación push de test
  const sendTestNotification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!subscription) {
        const subResult = await subscribe()
        if (!subResult.success) return subResult
      }

      const reg = await navigator.serviceWorker.ready
      const currentSub = await reg.pushManager.getSubscription()

      if (!currentSub) {
        return { success: false, error: 'No se encontró suscripción activa.' }
      }

      const res = await fetch('/api/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: currentSub }),
      })

      if (res.ok) {
        return { success: true }
      } else {
        const data = await res.json().catch(() => ({}))
        return { success: false, error: data.error || 'Error en el backend enviando la prueba.' }
      }
    } catch (err: unknown) {
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
