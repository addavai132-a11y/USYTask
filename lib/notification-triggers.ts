import type { PushNotificationPayload, NotificationType } from '@/types/notifications'

/**
 * Función genérica de despacho hacia el endpoint /api/push/send
 */
async function dispatchPush(
  userIds: string[] = [],
  payload: PushNotificationPayload,
  notificationType: NotificationType
) {
  try {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds,
        payload,
        notificationType,
      }),
    })
    return await res.json()
  } catch (err) {
    console.error(`Error despachando notificación [${notificationType}]:`, err)
    return { success: false, error: err }
  }
}

// =========================================================================
// A. SECTOR ORGANIZACIÓN & CENTRO DE CONTROL
// =========================================================================

/**
 * Aviso de tarea asignada, próxima a vencer o vencida
 */
export async function notifyTaskDue(params: {
  taskTitle: string
  dueDate?: string
  assignedToName?: string
  userIds?: string[]
}) {
  const { taskTitle, dueDate, assignedToName, userIds = [] } = params
  return dispatchPush(
    userIds,
    {
      title: '⏰ Tarea Pendiente',
      body: dueDate
        ? `La tarea '${taskTitle}' tiene fecha límite para ${dueDate}.`
        : `Tienes pendiente la tarea: '${taskTitle}'.`,
      tag: `task-${Date.now()}`,
      data: {
        url: '/app?tab=organizar',
        type: 'organizacion_events',
        category: 'organizacion',
      },
    },
    'organizacion_events'
  )
}

/**
 * Aviso de recordatorio urgente o programado
 */
export async function notifyReminderDue(params: {
  reminderTitle: string
  dueStr?: string
  userIds?: string[]
}) {
  const { reminderTitle, dueStr, userIds = [] } = params
  return dispatchPush(
    userIds,
    {
      title: '📌 Recordatorio Activo',
      body: dueStr
        ? `Aviso: '${reminderTitle}' programado para ${dueStr}.`
        : `Tienes un recordatorio activo: '${reminderTitle}'.`,
      tag: `reminder-${Date.now()}`,
      data: {
        url: '/app?tab=organizar',
        type: 'organizacion_events',
        category: 'organizacion',
      },
    },
    'organizacion_events'
  )
}

/**
 * Aviso con antelación programada para un evento o reunión
 */
export async function notifyEventReminder(params: {
  eventTitle: string
  timeStr?: string
  minutesBefore?: number
  userIds?: string[]
}) {
  const { eventTitle, timeStr, minutesBefore = 15, userIds = [] } = params
  return dispatchPush(
    userIds,
    {
      title: '🗓️ Recordatorio de Evento',
      body: timeStr
        ? `Tienes '${eventTitle}' a las ${timeStr} (en ${minutesBefore} min).`
        : `Tienes '${eventTitle}' programado pronto.`,
      tag: `event-${Date.now()}`,
      data: {
        url: '/app?tab=organizar',
        type: 'organizacion_events',
        category: 'organizacion',
      },
    },
    'organizacion_events'
  )
}

/**
 * Notificación cuando un miembro actualiza o añade un producto urgente a compras
 */
export async function notifyShoppingListUpdated(params: {
  listName: string
  authorName: string
  itemCount?: number
  userIds: string[]
}) {
  const { listName, authorName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🛒 Lista de Compras Actualizada',
      body: `${authorName} ha actualizado la lista '${listName}'.`,
      tag: 'shopping-update',
      data: {
        url: '/app?tab=organizar',
        type: 'organizacion_shopping',
        category: 'organizacion',
      },
    },
    'organizacion_shopping'
  )
}

/**
 * Recordatorio del menú o toma planificada para el día
 */
export async function notifyMealPlanReminder(params: {
  mealName: string
  dayLabel?: string
  userIds: string[]
}) {
  const { mealName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🥗 Menú del Día',
      body: `Hoy toca preparar: ${mealName}. ¡Buen provecho!`,
      tag: 'meal-plan',
      data: {
        url: '/app?tab=fitness',
        type: 'organizacion_meals',
        category: 'organizacion',
      },
    },
    'organizacion_meals'
  )
}

// =========================================================================
// B. SECTOR SALUD & FITNESS
// =========================================================================

/**
 * Recordatorio vespertino si aún no se ha entrenado
 */
export async function notifyWorkoutReminder(params: {
  routineName: string
  userIds: string[]
}) {
  const { routineName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '⚡ ¡Hora de Entrenar!',
      body: `Hoy toca sesión de '${routineName}'. ¡Mantén tu constancia!`,
      tag: 'workout-reminder',
      data: {
        url: '/app?tab=fitness',
        type: 'fitness_workout',
        category: 'fitness',
      },
    },
    'fitness_workout'
  )
}

/**
 * Celebración de récord personal (PR) superado
 */
export async function notifyPersonalRecord(params: {
  exerciseName: string
  weightKg: number
  reps?: number
  authorName?: string
  userIds: string[]
}) {
  const { exerciseName, weightKg, reps = 1, authorName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🏆 ¡Nuevo Récord Personal!',
      body: authorName
        ? `${authorName} ha superado su marca en ${exerciseName}: ¡${weightKg} kg (${reps} reps)!`
        : `¡Has registrado un nuevo récord en ${exerciseName}: ${weightKg} kg! 🔥`,
      tag: 'personal-record',
      data: {
        url: '/app?tab=fitness',
        type: 'fitness_records',
        category: 'fitness',
      },
    },
    'fitness_records'
  )
}

/**
 * Alerta para registrar calorías/macronutrientes del día
 */
export async function notifyNutritionLogReminder(params: {
  userIds: string[]
}) {
  return dispatchPush(
    params.userIds,
    {
      title: '🥑 Registro Nutricional',
      body: 'Recuerda registrar tus comidas de hoy para completar tus objetivos de macros.',
      tag: 'nutrition-log',
      data: {
        url: '/app?tab=fitness',
        type: 'fitness_nutrition',
        category: 'fitness',
      },
    },
    'fitness_nutrition'
  )
}

// =========================================================================
// C. SECTOR FINANZAS & HUCHA FAMILIAR
// =========================================================================

/**
 * Aviso de factura con vencimiento próximo (ej. 2 días antes)
 */
export async function notifyBillDue(params: {
  billName: string
  amount: number
  daysUntilDue?: number
  userIds: string[]
}) {
  const { billName, amount, daysUntilDue = 2, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '⚠️ Factura Próxima a Vencer',
      body: `El recibo de '${billName}' (${amount.toFixed(2)} €) vence en ${daysUntilDue} días.`,
      tag: `bill-${billName}`,
      data: {
        url: '/app?tab=hogar',
        type: 'finanzas_bills',
        category: 'finanzas',
      },
    },
    'finanzas_bills'
  )
}

/**
 * Alerta de presupuesto al límite (supera 85% o 100%)
 */
export async function notifyBudgetAlert(params: {
  categoryName: string
  percentSpent: number
  userIds: string[]
}) {
  const { categoryName, percentSpent, userIds } = params
  const isOver = percentSpent >= 100
  return dispatchPush(
    userIds,
    {
      title: isOver ? '🚨 Presupuesto Excedido' : '⚠️ Presupuesto al Límite',
      body: `La categoría '${categoryName}' ha alcanzado el ${Math.round(percentSpent)}% del límite mensual.`,
      tag: `budget-${categoryName}`,
      data: {
        url: '/app?tab=hogar',
        type: 'finanzas_budgets',
        category: 'finanzas',
      },
    },
    'finanzas_budgets'
  )
}

/**
 * Notificación al registrar un nuevo ahorro compartido en la hucha
 */
export async function notifyPiggyBankContribution(params: {
  amount: number
  authorName: string
  totalSaved?: number
  userIds: string[]
}) {
  const { amount, authorName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🐷 Aporte a la Hucha Familiar',
      body: `${authorName} ha ingresado +${amount.toFixed(2)} € a la Hucha Compartida. 🎉`,
      tag: 'piggy-bank-contribution',
      data: {
        url: '/app?tab=hogar',
        type: 'finanzas_piggy',
        category: 'finanzas',
      },
    },
    'finanzas_piggy'
  )
}

// =========================================================================
// D. SECTOR FAMILIA & GAMIFICACIÓN
// =========================================================================

/**
 * Notificación cuando se asigna un nuevo reto o tarea a un integrante
 */
export async function notifyTaskOrChallengeAssigned(params: {
  taskTitle: string
  assignerName: string
  points?: number
  userIds: string[]
}) {
  const { taskTitle, assignerName, points, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🎯 Nuevo Reto Asignado',
      body: points
        ? `${assignerName} te ha asignado '${taskTitle}' (+${points} pts). ¡A por ello!`
        : `${assignerName} te ha asignado una nueva tarea: '${taskTitle}'.`,
      tag: 'task-assigned',
      data: {
        url: '/app?tab=feed',
        type: 'familia_challenges',
        category: 'familia',
      },
    },
    'familia_challenges'
  )
}

/**
 * Celebración de racha mantenida o nivel alcanzado
 */
export async function notifyStreakOrLevelUp(params: {
  streakDays: number
  pointsEarned?: number
  userIds: string[]
}) {
  const { streakDays, pointsEarned, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🔥 ¡Racha Imparable!',
      body: pointsEarned
        ? `¡Has mantenido tu racha de ${streakDays} días activa y ganado +${pointsEarned} pts!`
        : `¡Llevas ${streakDays} días seguidos cumpliendo objetivos! Sigue así.`,
      tag: 'streak-achieved',
      data: {
        url: '/app?tab=feed',
        type: 'familia_streaks',
        category: 'familia',
      },
    },
    'familia_streaks'
  )
}

/**
 * Notificación al compartir un recuerdo, foto o nota familiar
 */
export async function notifySharedMemory(params: {
  memoryTitle: string
  authorName: string
  userIds: string[]
}) {
  const { memoryTitle, authorName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '📸 Nuevo Recuerdo Familiar',
      body: `${authorName} ha compartido '${memoryTitle}' en el baúl del hogar.`,
      tag: 'shared-memory',
      data: {
        url: '/app?tab=familia',
        type: 'familia_memories',
        category: 'familia',
      },
    },
    'familia_memories'
  )
}

// =========================================================================
// E. DISPARADORES INMEDIATOS — Notificaciones Push granulares (Fase 6)
//    Cada función mapea a una categoría de notification_preferences.
// =========================================================================

/**
 * #1 — Tarea asignada a uno o más usuarios.
 * Destinatarios: usuarios asignados (excluyendo al autor si se autoasigna).
 */
export async function notifyTaskAssigned(params: {
  taskTitle: string
  taskId: string
  assignerName?: string
  userIds: string[]
}) {
  const { taskTitle, taskId, assignerName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '📋 Nueva tarea asignada',
      body: assignerName
        ? `${assignerName} te ha asignado la tarea: "${taskTitle}"`
        : `Te han asignado la tarea: "${taskTitle}"`,
      tag: `task-assigned-${taskId}`,
      data: {
        url: '/app?tab=organizar',
        type: 'tasks_assigned',
        category: 'organizacion',
        taskId,
      },
    },
    'tasks_assigned'
  )
}

/**
 * #3 — Tarea completada por alguien distinto al creador.
 * Destinatario: creador de la tarea.
 */
export async function notifyTaskCompletedByOther(params: {
  taskTitle: string
  taskId: string
  completedByName: string
  userIds: string[]
}) {
  const { taskTitle, taskId, completedByName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '✅ Tarea completada',
      body: `${completedByName} ha completado la tarea "${taskTitle}"`,
      tag: `task-completed-${taskId}`,
      data: {
        url: '/app?tab=organizar',
        type: 'tasks_completed',
        category: 'organizacion',
        taskId,
      },
    },
    'tasks_completed'
  )
}

/**
 * #4 — Nuevo evento creado en el calendario familiar.
 * Destinatarios: miembros del grupo (excepto creador).
 */
export async function notifyEventCreated(params: {
  eventTitle: string
  eventId: string
  creatorName?: string
  userIds: string[]
}) {
  const { eventTitle, eventId, creatorName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '🗓️ Nuevo evento en el calendario',
      body: creatorName
        ? `${creatorName} ha añadido "${eventTitle}" al calendario familiar`
        : `Se ha añadido "${eventTitle}" al calendario familiar`,
      tag: `event-new-${eventId}`,
      data: {
        url: '/app?tab=organizar',
        type: 'events_new',
        category: 'organizacion',
        eventId,
      },
    },
    'events_new'
  )
}

/**
 * #7 — Cambio de hora o cancelación de un evento.
 * Destinatarios: asistentes / miembros del grupo.
 */
export async function notifyEventChanged(params: {
  eventTitle: string
  eventId: string
  changeType: 'modified' | 'cancelled'
  userIds: string[]
}) {
  const { eventTitle, eventId, changeType, userIds } = params
  const isCancelled = changeType === 'cancelled'
  return dispatchPush(
    userIds,
    {
      title: isCancelled ? '❌ Evento cancelado' : '📅 Evento modificado',
      body: isCancelled
        ? `Se ha cancelado "${eventTitle}"`
        : `Se ha modificado la hora de "${eventTitle}"`,
      tag: `event-changed-${eventId}`,
      data: {
        url: '/app?tab=organizar',
        type: 'events_changes',
        category: 'organizacion',
        eventId,
      },
    },
    'events_changes'
  )
}

/**
 * #8 — Nueva factura / gasto subido.
 * Destinatarios: miembros del grupo (excepto quien la sube).
 */
export async function notifyNewInvoice(params: {
  invoiceTitle: string
  invoiceId: string
  amount?: number
  uploaderName?: string
  userIds: string[]
}) {
  const { invoiceTitle, invoiceId, amount, uploaderName, userIds } = params
  const amountStr = amount ? ` (${amount.toFixed(2)} €)` : ''
  return dispatchPush(
    userIds,
    {
      title: '💰 Nueva factura subida',
      body: uploaderName
        ? `${uploaderName} ha subido la factura de "${invoiceTitle}"${amountStr}`
        : `Se ha subido la factura de "${invoiceTitle}"${amountStr}`,
      tag: `finance-new-${invoiceId}`,
      data: {
        url: '/app?tab=hogar',
        type: 'finance_new_invoice',
        category: 'finanzas',
        invoiceId,
      },
    },
    'finance_new_invoice'
  )
}

/**
 * #10 — Un miembro ha marcado su parte como pagada.
 * Destinatarios: resto de miembros implicados en la factura.
 */
export async function notifyInvoicePaid(params: {
  invoiceTitle: string
  invoiceId: string
  paidByName: string
  userIds: string[]
}) {
  const { invoiceTitle, invoiceId, paidByName, userIds } = params
  return dispatchPush(
    userIds,
    {
      title: '✅ Pago registrado',
      body: `${paidByName} ha marcado su parte de "${invoiceTitle}" como pagada`,
      tag: `finance-paid-${invoiceId}`,
      data: {
        url: '/app?tab=hogar',
        type: 'finance_paid',
        category: 'finanzas',
        invoiceId,
      },
    },
    'finance_paid'
  )
}

/**
 * #11 — Artículo urgente o inserción masiva en la lista de la compra.
 * Destinatarios: miembros del grupo (excepto quien añade).
 */
export async function notifyShoppingUrgent(params: {
  productName?: string
  itemCount?: number
  authorName?: string
  userIds: string[]
}) {
  const { productName, itemCount, authorName, userIds } = params

  // Decidir mensaje según si es un artículo urgente individual o inserción masiva
  let body: string
  if (itemCount && itemCount > 5) {
    body = authorName
      ? `${authorName} ha añadido ${itemCount} artículos a la lista de la compra`
      : `Se han añadido ${itemCount} artículos a la lista de la compra`
  } else if (productName) {
    body = authorName
      ? `${authorName} ha marcado "${productName}" como urgente en la lista de la compra`
      : `"${productName}" marcado como urgente en la lista de la compra`
  } else {
    body = 'La lista de la compra se ha actualizado con artículos urgentes'
  }

  return dispatchPush(
    userIds,
    {
      title: '🛒 Lista de la compra actualizada',
      body,
      tag: 'shopping-urgent',
      data: {
        url: '/app?tab=organizar',
        type: 'shopping_urgent',
        category: 'organizacion',
      },
    },
    'shopping_urgent'
  )
}
