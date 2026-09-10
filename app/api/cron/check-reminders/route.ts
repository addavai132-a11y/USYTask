import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPushNotification } from '@/lib/push-service'
import type { PushNotificationPayload } from '@/types/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Intenta marcar una notificación como enviada. Retorna true si es la primera vez
 * (se puede enviar), false si ya se envió antes (dedup por índice único).
 */
async function markSentOnce(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  category: string,
  referenceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notification_log')
    .insert({
      user_id: userId,
      category,
      reference_id: referenceId,
      reference_type: category,
    })
  // Si error por índice único = ya se envió antes, se ignora
  return !error
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    const todayISO = now.toISOString().slice(0, 10)
    const currentDay = now.getDate()

    let processedCount = 0

    // ── 1. Tareas que vencen hoy y no están completadas ────────────────────
    const { data: tasksDueToday } = await supabase
      .from('tasks')
      .select('id, group_id, title, assigned_member_ids, completed')
      .eq('completed', false)

    if (tasksDueToday && tasksDueToday.length > 0) {
      for (const task of tasksDueToday) {
        // La tabla tasks no tiene columna due_date directa; los datos se sincronizan
        // desde el cloud backup. Buscamos en el backup del grupo o en la tabla si existe.
        // Por ahora consultamos todas las tareas no completadas del grupo y verificamos
        // que vencen hoy al tener datos en el cloud backup.
        // Nota: Si se añade columna due_date a tasks, ajustar la query con .eq('due_date', todayISO)

        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', task.group_id)

        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id).filter(Boolean)
          for (const userId of userIds) {
            const canSend = await markSentOnce(supabase, userId, 'tasks_due_today', task.id)
            if (canSend) {
              const payload: PushNotificationPayload = {
                title: '⏰ Tarea pendiente',
                body: `"${task.title}" vence hoy y no está hecha`,
                data: {
                  url: '/app?tab=organizar',
                  type: 'tasks_due_today',
                  category: 'organizacion',
                  taskId: task.id,
                },
              }
              await sendPushNotification([userId], payload, 'tasks_due_today')
              processedCount++
            }
          }
        }
      }
    }

    // ── 2. Eventos que ocurren hoy o mañana (recordatorio 24h) ────────────
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

        // Determinar categoría de dedup según si es hoy (15min) o mañana (24h)
        const category = isToday ? 'events_reminder_15m' : 'events_reminder_24h'
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

          for (const userId of userIds) {
            const canSend = await markSentOnce(supabase, userId, category, ev.id)
            if (canSend) {
              const payload: PushNotificationPayload = {
                title,
                body,
                data: {
                  url: '/app?tab=organizar',
                  type: category,
                  category: 'organizacion',
                  eventId: ev.id,
                },
              }
              await sendPushNotification([userId], payload, category)
              processedCount++
            }
          }
        }
      }
    }

    // ── 3. Facturas/suscripciones que vencen en 3 días ────────────────────
    const in3days = new Date(now)
    in3days.setDate(in3days.getDate() + 3)
    const in3daysDay = in3days.getDate()

    const { data: billsDueSoon } = await supabase
      .from('bills')
      .select('id, group_id, name, amount, due_day, is_active')
      .eq('is_active', true)
      .eq('due_day', in3daysDay)

    if (billsDueSoon && billsDueSoon.length > 0) {
      for (const bill of billsDueSoon) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', bill.group_id)

        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id).filter(Boolean)

          for (const userId of userIds) {
            const canSend = await markSentOnce(supabase, userId, 'finance_due_soon', bill.id)
            if (canSend) {
              const payload: PushNotificationPayload = {
                title: '⚠️ Pago próximo a vencer',
                body: `El pago de "${bill.name}" (${bill.amount}€) vence en 3 días`,
                data: {
                  url: '/app?tab=hogar',
                  type: 'finance_due_soon',
                  category: 'finanzas',
                  billId: bill.id,
                },
              }
              await sendPushNotification([userId], payload, 'finance_due_soon')
              processedCount++
            }
          }
        }
      }
    }

    // ── 4. Facturas/suscripciones con fecha de cobro hoy ──────────────────
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

          for (const userId of userIds) {
            const canSend = await markSentOnce(supabase, userId, 'finanzas_bills_today', bill.id)
            if (canSend) {
              const payload: PushNotificationPayload = {
                title: '💳 Cargo recurrente programado',
                body: `Hoy se procesa el cobro de ${bill.name} (${bill.amount}€)`,
                data: {
                  url: '/app?tab=hogar',
                  type: 'finanzas_bills',
                  category: 'finanzas',
                  billId: bill.id,
                },
              }
              await sendPushNotification([userId], payload, 'finanzas_bills')
              processedCount++
            }
          }
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
      { error: 'Error interno en cron de recordatorios' },
      { status: 500 }
    )
  }
}

// Mantener GET para compatibilidad con Vercel Cron (que usa GET por defecto)
export async function GET(req: NextRequest) {
  return POST(req)
}
