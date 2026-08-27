import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendPushNotification } from '@/lib/push-service'
import type { PushNotificationPayload, NotificationType } from '@/types/notifications'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const body = await req.json()
    const { userIds, payload, notificationType } = body as {
      userIds?: string[]
      payload: PushNotificationPayload
      notificationType?: NotificationType
    }

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Payload de notificación incompleto (requiere title y body).' },
        { status: 400 }
      )
    }

    // Si no se especifican userIds, enviar al usuario actual
    const targetUserIds = userIds && userIds.length > 0 ? userIds : [user.id]

    const result = await sendPushNotification(targetUserIds, payload, notificationType)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Error enviando notificación desde /api/push/send:', error)
    return NextResponse.json(
      { error: error?.message || 'Error interno enviando notificación.' },
      { status: 500 }
    )
  }
}
