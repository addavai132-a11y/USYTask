import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { sendPushNotification } from '@/lib/push-service'
import type { PushNotificationPayload } from '@/types/notifications'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    const now = new Date()
    const todayISO = now.toISOString().slice(0, 10)
    const currentDay = now.getDate()

    let processedCount = 0

    // 1. Obtener eventos que ocurren hoy o mañana
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString().slice(0, 10)

    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('id, group_id, title, date, time')
      .in('date', [todayISO, tomorrowISO])

    if (upcomingEvents && upcomingEvents.length > 0) {
      for (const ev of upcomingEvents) {
        const isToday = ev.date === todayISO
        const timeStr = ev.time ? ` a las ${ev.time}` : ''
        const title = isToday ? '📅 Evento de hoy' : '⏰ Recordatorio: Evento mañana'
        const body = isToday
          ? `Hoy tienes el evento "${ev.title}"${timeStr}`
          : `Mañana tienes el evento "${ev.title}"${timeStr}`

        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', ev.group_id)

        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id).filter(Boolean)
          const payload: PushNotificationPayload = {
            title,
            body,
            data: {
              url: '/app?tab=organizacion&sub=calendario',
              type: 'organizacion_events',
              category: 'organizacion',
              eventId: ev.id,
            },
          }
          await sendPushNotification(userIds, payload, 'organizacion_events')
          processedCount++
        }
      }
    }

    // 2. Facturas y suscripciones con fecha de cobro hoy
    const { data: recurringBills } = await supabase
      .from('bills')
      .select('id, group_id, name, amount, due_day, is_active')
      .eq('is_active', true)
      .eq('due_day', currentDay)

    if (recurringBills && recurringBills.length > 0) {
      for (const bill of recurringBills) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', bill.group_id)

        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id).filter(Boolean)
          const payload: PushNotificationPayload = {
            title: '💳 Cargo recurrente programado',
            body: `Hoy se procesa el cobro de ${bill.name} (${bill.amount}€)`,
            data: {
              url: '/app?tab=finanzas&sub=facturas',
              type: 'finanzas_bills',
              category: 'finanzas',
              billId: bill.id,
            },
          }
          await sendPushNotification(userIds, payload, 'finanzas_bills')
          processedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedCount,
    })
  } catch (error: any) {
    console.error('Error en cron check-reminders:', error)
    return NextResponse.json(
      { error: error?.message || 'Error en cron de recordatorios' },
      { status: 500 }
    )
  }
}
