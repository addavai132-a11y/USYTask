import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendPushNotification } from '@/lib/push-service'
import type { PushNotificationPayload, NotificationType } from '@/types/notifications'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const TriggerSchema = z.object({
  userIds: z.array(z.string().uuid()).optional(),
  userId: z.string().uuid().optional(),
  payload: z.object({
    title: z.string().max(100),
    body: z.string().max(300),
    icon: z.string().max(300).optional(),
    badge: z.string().max(300).optional(),
    tag: z.string().max(100).optional(),
    data: z.record(z.any()).optional()
  }),
  type: z.string().max(50).optional()
}).passthrough()

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip, 20, 60000)) {
      return NextResponse.json({ error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' }, { status: 429 })
    }

    const supabase = await createClient()

    // Autenticación requerida para usar este endpoint
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const rawBody = await req.json().catch(() => ({}))
    const parsed = TriggerSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload de notificación inválido.' }, { status: 400 })
    }

    const body = parsed.data
    const { userIds, userId, payload, type } = body as {
      userIds?: string[]
      userId?: string
      payload: PushNotificationPayload
      type?: NotificationType
    }

    const targetUserIds = userIds || (userId ? [userId] : [])

    if (targetUserIds.length === 0 || !payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos (userIds, payload.title, payload.body)' },
        { status: 400 }
      )
    }

    // Opcional: Evitar que el usuario se envíe una notificación a sí mismo (para menciones/asignaciones)
    // Solo enviamos a los targets que NO son el autor de la acción, a menos que sea un recordatorio
    const isCron = false // Este endpoint es para triggers de usuario a usuario
    const filteredUserIds = targetUserIds.filter(id => id !== user.id)

    if (filteredUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se enviaron notificaciones a uno mismo.',
        result: { sentCount: 0, failedCount: 0, cleanedCount: 0, errors: [] },
      })
    }

    console.info(`[/api/push/trigger] Despachando evento push a ${filteredUserIds.length} usuarios. Tipo: ${type}`)
    
    // Disparar Web Push
    const pushResult = await sendPushNotification(filteredUserIds, payload, type)

    return NextResponse.json({
      success: true,
      message: 'Notificación(es) push enviada(s).',
      result: pushResult,
    })
  } catch (error: any) {
    console.error('[/api/push/trigger] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la notificación' },
      { status: 500 }
    )
  }
}
