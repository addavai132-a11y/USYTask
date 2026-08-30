import type { AppNotification, Member } from '@/types'
import { addNotification, getAllNotifications, getTasksByGroup, getEventsByGroup, getRemindersByGroup, getBillsByGroup } from '@/lib/data-store'

// Safe currency formatter — fallback avoids crashing if types/finances import fails
function safeCurrency(amount: unknown): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { formatCurrency } = require('@/types/finances')
    return formatCurrency(amount)
  } catch {
    const n = Number(amount)
    if (isNaN(n)) return '—'
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
  }
}

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
 * Centralized Notification Dispatcher.
 * NOTE: synchronous — writes to in-app store immediately, then fire-and-forget Push.
 * Wrapping the entire body in try/catch ensures it never crashes the caller.
 */
export function dispatchNotification(options: DispatchNotificationOptions): void {
  const { groupId, title, body, type, recipientMemberIds, actionUrl, data, sendPush = true } = options

  try {
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

    // 1. Save in-app (localStorage)
    addNotification(notification)

    // 2. Fire-and-forget Web Push (only in browser context)
    if (sendPush && typeof window !== 'undefined') {
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
      }).catch((err) => console.warn('[dispatchNotification] Push notice:', err))
    }
  } catch (err) {
    console.error('[dispatchNotification] Error dispatching notification:', err)
  }
}

/**
 * Evaluates upcoming events, tasks, reminders and recurring bill charges,
 * dispatching proximity alerts and avoiding duplicates via proximityKey.
 *
 * Each section is individually wrapped in try/catch so a corrupt data entry
 * in one area cannot silently break the entire check cycle.
 */
export function checkProximityAndRecurringAlerts(groupId: string, _members: Member[] = []): void {
  if (!groupId || typeof window === 'undefined') return

  let now: Date
  let todayISO: string
  let currentDay: number
  let existingNotifications: AppNotification[]

  try {
    now = new Date()
    todayISO = now.toISOString().slice(0, 10)
    currentDay = now.getDate()
    existingNotifications = getAllNotifications().filter((n) => n.groupId === groupId)
  } catch (err) {
    console.warn('[checkProximityAndRecurringAlerts] Init error:', err)
    return
  }

  // ── 1. Eventos ──────────────────────────────────────────────────────────────
  try {
    const events = getEventsByGroup(groupId)
    events.forEach((event) => {
      try {
        if (!event.date) return
        const eventDate = new Date(event.date)
        if (isNaN(eventDate.getTime())) return

        const diffTime = eventDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const isToday = event.date === todayISO
        const isTomorrow = diffDays === 1

        if (!isToday && !isTomorrow) return

        const notifKey = `event_prox_${event.id}_${todayISO}`
        if (existingNotifications.some((n) => n.data?.proximityKey === notifKey)) return

        const timeStr = event.time ? ` a las ${event.time}` : ''
        dispatchNotification({
          groupId,
          title: isToday ? '📅 Evento de hoy' : '⏰ Recordatorio: Evento mañana',
          body: isToday
            ? `Hoy tienes el evento "${event.title}"${timeStr}`
            : `Mañana tienes el evento "${event.title}"${timeStr}`,
          type: 'event',
          actionUrl: '/app?tab=organizar',
          sendPush: false, // avoid spamming push for proximity checks; only in-app
          data: { proximityKey: notifKey, eventId: event.id, tab: 'organizar', subTab: 'calendario' },
        })
      } catch (err) {
        console.warn('[checkProximity] Single event error:', err)
      }
    })
  } catch (err) {
    console.warn('[checkProximityAndRecurringAlerts] Events section error:', err)
  }

  // ── 2. Tareas ────────────────────────────────────────────────────────────────
  try {
    const tasks = getTasksByGroup(groupId)
    tasks.forEach((task) => {
      try {
        if (task.completed || !task.dueDate) return
        if (task.dueDate !== todayISO) return

        const notifKey = `task_due_${task.id}_${todayISO}`
        if (existingNotifications.some((n) => n.data?.proximityKey === notifKey)) return

        dispatchNotification({
          groupId,
          title: '⚠️ Tarea vence hoy',
          body: `La tarea "${task.title}" tiene fecha límite hoy`,
          type: 'task',
          recipientMemberIds: task.assignedMemberIds,
          actionUrl: '/app?tab=organizar',
          sendPush: false,
          data: { proximityKey: notifKey, taskId: task.id, tab: 'organizar', subTab: 'tareas' },
        })
      } catch (err) {
        console.warn('[checkProximity] Single task error:', err)
      }
    })
  } catch (err) {
    console.warn('[checkProximityAndRecurringAlerts] Tasks section error:', err)
  }

  // ── 3. Recordatorios ─────────────────────────────────────────────────────────
  try {
    const reminders = getRemindersByGroup(groupId)
    reminders.forEach((rem) => {
      try {
        if ((rem as any).completed || !rem.dueDate) return
        if (rem.dueDate !== todayISO) return

        const notifKey = `rem_due_${rem.id}_${todayISO}`
        if (existingNotifications.some((n) => n.data?.proximityKey === notifKey)) return

        dispatchNotification({
          groupId,
          title: '🔔 Recordatorio pendiente',
          body: `Recordatorio para hoy: "${rem.title}"`,
          type: 'reminder',
          recipientMemberIds: rem.assignedMemberIds,
          actionUrl: '/app?tab=organizar',
          sendPush: false,
          data: { proximityKey: notifKey, reminderId: rem.id, tab: 'organizar', subTab: 'recordatorios' },
        })
      } catch (err) {
        console.warn('[checkProximity] Single reminder error:', err)
      }
    })
  } catch (err) {
    console.warn('[checkProximityAndRecurringAlerts] Reminders section error:', err)
  }

  // ── 4. Facturas y Suscripciones ──────────────────────────────────────────────
  try {
    const bills = getBillsByGroup(groupId)
    bills.forEach((bill) => {
      try {
        if (
          bill.subscriptionStatus === 'cancelada' ||
          bill.subscriptionStatus === 'pausada' ||
          bill.isActive === false
        ) return

        const billDay = Number(bill.dueDay)
        if (isNaN(billDay) || billDay !== currentDay) return

        const notifKey = `bill_due_${bill.id}_${todayISO}`
        if (existingNotifications.some((n) => n.data?.proximityKey === notifKey)) return

        dispatchNotification({
          groupId,
          title: '💳 Cargo recurrente programado',
          body: `Hoy es el día de cobro de ${bill.name} (${safeCurrency(bill.amount)})`,
          type: 'finance',
          actionUrl: '/app?tab=hogar',
          sendPush: false,
          data: { proximityKey: notifKey, billId: bill.id, tab: 'hogar', subTab: 'facturas' },
        })
      } catch (err) {
        console.warn('[checkProximity] Single bill error:', err)
      }
    })
  } catch (err) {
    console.warn('[checkProximityAndRecurringAlerts] Bills section error:', err)
  }
}
