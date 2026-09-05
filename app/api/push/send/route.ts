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

    // Accept both nested payload format and flattened direct format
    const title = body.payload?.title || body.title
    const bodyText = body.payload?.body || body.body
    const url = body.payload?.data?.url || body.url || '/app'
    const notificationType = (body.notificationType || body.payload?.data?.type || body.data?.type) as NotificationType | undefined
    const category = body.payload?.data?.category || body.data?.category

    if (!title || !bodyText) {
      return NextResponse.json(
        { error: 'Payload de notificación incompleto (requiere title y body).' },
        { status: 400 }
      )
    }

    const pushPayload: PushNotificationPayload = {
      title,
      body: bodyText,
      icon: body.payload?.icon || body.icon || '/icon-192.png',
      badge: body.payload?.badge || body.badge || '/icon-192.png',
      tag: body.payload?.tag || body.tag || `usyatask-${Date.now()}`,
      data: {
        url,
        type: notificationType,
        category,
        ...(body.payload?.data || body.data || {}),
      },
    }

    // Determine target userIds:
    // 1. If explicit userIds provided: use them
    // 2. If groupId provided: fetch all group members' auth user_ids
    let targetUserIds: string[] = []

    if (body.userIds && Array.isArray(body.userIds) && body.userIds.length > 0) {
      targetUserIds = body.userIds
    } else if (body.groupId) {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', body.groupId)

      if (groupMembers && groupMembers.length > 0) {
        targetUserIds = groupMembers.map((m) => m.user_id).filter(id => id && id !== user.id)
      }
    }

    // Fallback to current user if none found
    if (targetUserIds.length === 0) {
      targetUserIds = [user.id]
    }

    const result = await sendPushNotification(targetUserIds, pushPayload, notificationType)

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
