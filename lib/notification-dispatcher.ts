import type { AppNotification, Task, CalendarEvent, Reminder, BillSubscription, Member } from '@/types'
import { addNotification, getAllNotifications, getTasksByGroup, getEventsByGroup, getRemindersByGroup, getBillsByGroup } from '@/lib/data-store'
import { formatCurrency } from '@/types/finances'

export interface DispatchNotificationOptions {
  groupId: string
  title: string
  body: string
  type: AppNotification['type']
  recipientMemberIds?: string[] // if empty, broadcasts to whole group
  actionUrl?: string
  data?: Record<string, any>
  sendPush?: boolean
}

/**
 * Centralized Notification Dispatcher:
 * 1. Creates in-app AppNotification (persisted in data-store / Supabase)
 * 2. Triggers Web Push API via /api/push/send if enabled and supported
 */
export async function dispatchNotification(options: DispatchNotificationOptions): Promise<void> {
  const { groupId, title, body, type, recipientMemberIds, actionUrl, data, sendPush = true } = options

  const notification: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    groupId,
    recipientMemberId: recipientMemberIds && recipientMemberIds.length === 1 ? recipientMemberIds[0] : undefined,
    type,
    title,
    body,
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl,
    data,
  }

  // 1. Guardar en almacén in-app
  addNotification(notification)

  // 2. Enviar Web Push si estamos en entorno navegador
  if (sendPush && typeof window !== 'undefined') {
    try {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          url: actionUrl || '/app',
          groupId,
          memberIds: recipientMemberIds,
          data: {
            type,
            notificationId: notification.id,
            ...data,
          },
        }),
      }).catch((err) => console.warn('Push dispatch notice:', err))
    } catch (err) {
      console.warn('Could not send web push:', err)
    }
  }
}

/**
 * Checks for upcoming events, tasks, reminders, and recurring bills,
 * dispatching proximity alerts and avoiding duplicate notifications.
 */
export function checkProximityAndRecurringAlerts(groupId: string, members: Member[] = []): void {
  if (!groupId || typeof window === 'undefined') return

  const now = new Date()
  const todayISO = now.toISOString().slice(0, 10)
  const currentDay = now.getDate()
  const existingNotifications = getAllNotifications().filter((n) => n.groupId === groupId)

  // 1. Proximidad de Eventos (Hoy o Mañana)
  const events = getEventsByGroup(groupId)
  events.forEach((event) => {
    if (!event.date) return
    const eventDate = new Date(event.date)
    const diffTime = eventDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isToday = event.date === todayISO
    const isTomorrow = diffDays === 1

    if (isToday || isTomorrow) {
      const notifKey = `event_prox_${event.id}_${todayISO}`
      const alreadySent = existingNotifications.some((n) => n.data?.proximityKey === notifKey)

      if (!alreadySent) {
        const timeStr = event.time ? ` a las ${event.time}` : ''
        const title = isToday ? '📅 Evento de hoy' : '⏰ Recordatorio: Evento mañana'
        const body = isToday
          ? `Hoy tienes el evento "${event.title}"${timeStr}`
          : `Mañana tienes el evento "${event.title}"${timeStr}`

        dispatchNotification({
          groupId,
          title,
          body,
          type: 'event',
          actionUrl: '/app?tab=organizacion&sub=calendario',
          data: { proximityKey: notifKey, eventId: event.id, tab: 'organizacion', subTab: 'calendario' },
        })
      }
    }
  })

  // 2. Proximidad de Tareas (Tareas pendientes que vencen hoy o mañana)
  const tasks = getTasksByGroup(groupId)
  tasks.forEach((task) => {
    if (task.completed || !task.dueDate) return
    const isToday = task.dueDate === todayISO
    if (isToday) {
      const notifKey = `task_due_${task.id}_${todayISO}`
      const alreadySent = existingNotifications.some((n) => n.data?.proximityKey === notifKey)

      if (!alreadySent) {
        dispatchNotification({
          groupId,
          title: '⚠️ Tarea vence hoy',
          body: `La tarea "${task.title}" tiene fecha límite hoy`,
          type: 'task',
          recipientMemberIds: task.assignedMemberIds,
          actionUrl: '/app?tab=organizacion&sub=tareas',
          data: { proximityKey: notifKey, taskId: task.id, tab: 'organizacion', subTab: 'tareas' },
        })
      }
    }
  })

  // 3. Proximidad de Recordatorios pendientes
  const reminders = getRemindersByGroup(groupId)
  reminders.forEach((rem) => {
    if (rem.completed || !rem.dueDate) return
    if (rem.dueDate === todayISO) {
      const notifKey = `rem_due_${rem.id}_${todayISO}`
      const alreadySent = existingNotifications.some((n) => n.data?.proximityKey === notifKey)

      if (!alreadySent) {
        dispatchNotification({
          groupId,
          title: '🔔 Recordatorio pendiente',
          body: `Recordatorio para hoy: "${rem.title}"`,
          type: 'reminder',
          recipientMemberIds: rem.assignedMemberIds,
          actionUrl: '/app?tab=organizacion&sub=recordatorios',
          data: { proximityKey: notifKey, reminderId: rem.id, tab: 'organizacion', subTab: 'recordatorios' },
        })
      }
    }
  })

  // 4. Alertas del Módulo Financiero (Día de cobro de suscripciones/facturas activas)
  const bills = getBillsByGroup(groupId)
  bills.forEach((bill) => {
    if (bill.subscriptionStatus === 'cancelada' || bill.subscriptionStatus === 'pausada' || bill.isActive === false) return
    if (Number(bill.dueDay) === currentDay) {
      const notifKey = `bill_due_${bill.id}_${todayISO}`
      const alreadySent = existingNotifications.some((n) => n.data?.proximityKey === notifKey)

      if (!alreadySent) {
        dispatchNotification({
          groupId,
          title: '💳 Cargo recurrente programado',
          body: `Hoy es el día de cobro de ${bill.name} (${formatCurrency(bill.amount)})`,
          type: 'finance',
          actionUrl: '/app?tab=finanzas&sub=facturas',
          data: { proximityKey: notifKey, billId: bill.id, tab: 'finanzas', subTab: 'facturas' },
        })
      }
    }
  })
}
