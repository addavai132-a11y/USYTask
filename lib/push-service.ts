import webpush from 'web-push'
import { createClient } from '@/lib/supabase-server'
import type { PushNotificationPayload, NotificationType, NotificationPreferences } from '@/types/notifications'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications'

// Inicializar configuración VAPID
function ensureVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:soporte@usyatask.com'

  if (!publicKey || !privateKey) {
    throw new Error('Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en las variables de entorno.')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export interface PushSendResult {
  sentCount: number
  failedCount: number
  cleanedCount: number
  errors: string[]
}

/**
 * Servicio Centralizado de Envíos Push
 * Envía notificaciones a uno o varios usuarios filtrando por sus preferencias activas
 * y eliminando automáticamente endpoints caducados (410 Gone / 404).
 */
export async function sendPushNotification(
  userIds: string[],
  payload: PushNotificationPayload,
  notificationType?: NotificationType
): Promise<PushSendResult> {
  const result: PushSendResult = {
    sentCount: 0,
    failedCount: 0,
    cleanedCount: 0,
    errors: [],
  }

  if (!userIds || userIds.length === 0) {
    return result
  }

  try {
    ensureVapidConfig()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error configurando VAPID'
    console.error('Push Service VAPID Error:', msg)
    result.errors.push(msg)
    return result
  }

  const supabase = await createClient()

  // 1. Filtrar usuarios que tengan silenciada esta categoría de notificación
  let targetUserIds = [...userIds]

  if (notificationType) {
    const { data: prefsData } = await supabase
      .from('notification_preferences')
      .select('user_id, preferences')
      .in('user_id', userIds)

    if (prefsData && prefsData.length > 0) {
      const prefsMap = new Map<string, NotificationPreferences>()
      prefsData.forEach((p) => {
        prefsMap.set(p.user_id, {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...(p.preferences as Partial<NotificationPreferences>),
        })
      })

      targetUserIds = userIds.filter((uId) => {
        const userPref = prefsMap.get(uId)
        if (!userPref) return true // por defecto activado si no ha personalizado
        return userPref[notificationType] !== false
      })
    }
  }

  if (targetUserIds.length === 0) {
    return result
  }

  // 2. Obtener todas las suscripciones activas de los usuarios destino
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, subscription')
    .in('user_id', targetUserIds)

  if (subsError || !subscriptions || subscriptions.length === 0) {
    return result
  }

  // 3. Preparar payload serializado
  const stringifiedPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || `usyatask-${Date.now()}`,
    data: {
      url: payload.data?.url || '/app',
      type: payload.data?.type || notificationType || 'general',
      category: payload.data?.category,
      ...payload.data,
    },
  })

  const expiredSubscriptionIds: string[] = []

  // 4. Enviar en paralelo a todos los dispositivos
  const sendPromises = subscriptions.map(async (item) => {
    try {
      await webpush.sendNotification(
        item.subscription as any,
        stringifiedPayload
      )
      result.sentCount++
    } catch (err: any) {
      result.failedCount++
      const statusCode = err?.statusCode || err?.status

      // Si el endpoint ya no existe o caducó (410 Gone / 404 Not Found), programar eliminación
      if (statusCode === 410 || statusCode === 404) {
        expiredSubscriptionIds.push(item.id)
      } else {
        result.errors.push(`Error en suscripción ${item.id}: ${err.message || err}`)
      }
    }
  })

  await Promise.allSettled(sendPromises)

  // 5. Limpieza automática de endpoints caducados en la base de datos
  if (expiredSubscriptionIds.length > 0) {
    const { error: cleanError } = await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', expiredSubscriptionIds)

    if (!cleanError) {
      result.cleanedCount = expiredSubscriptionIds.length
    }
  }

  return result
}
