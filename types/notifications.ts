export type NotificationCategory = 'organizacion' | 'fitness' | 'finanzas' | 'familia'

export type NotificationType =
  // Organización (sector-level)
  | 'organizacion_events'
  | 'organizacion_shopping'
  | 'organizacion_meals'
  // Fitness (sector-level)
  | 'fitness_workout'
  | 'fitness_records'
  | 'fitness_nutrition'
  // Finanzas (sector-level)
  | 'finanzas_bills'
  | 'finanzas_budgets'
  | 'finanzas_piggy'
  // Familia (sector-level)
  | 'familia_challenges'
  | 'familia_streaks'
  | 'familia_memories'
  // ── Granular push categories (per-action) ──
  // Tareas y rutinas
  | 'tasks_assigned'
  | 'tasks_due_today'
  | 'tasks_completed'
  // Eventos y calendario
  | 'events_new'
  | 'events_reminder_24h'
  | 'events_reminder_15m'
  | 'events_changes'
  // Finanzas, facturas y pagos
  | 'finance_new_invoice'
  | 'finance_due_soon'
  | 'finance_paid'
  // Compras y hogar
  | 'shopping_urgent'

export interface NotificationPreferences {
  // Organización (sector-level)
  organizacion_events: boolean
  organizacion_shopping: boolean
  organizacion_meals: boolean
  // Fitness (sector-level)
  fitness_workout: boolean
  fitness_records: boolean
  fitness_nutrition: boolean
  // Finanzas (sector-level)
  finanzas_bills: boolean
  finanzas_budgets: boolean
  finanzas_piggy: boolean
  // Familia (sector-level)
  familia_challenges: boolean
  familia_streaks: boolean
  familia_memories: boolean
  // ── Granular push categories ──
  tasks_assigned: boolean
  tasks_due_today: boolean
  tasks_completed: boolean
  events_new: boolean
  events_reminder_24h: boolean
  events_reminder_15m: boolean
  events_changes: boolean
  finance_new_invoice: boolean
  finance_due_soon: boolean
  finance_paid: boolean
  shopping_urgent: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  // Sector-level (existing)
  organizacion_events: true,
  organizacion_shopping: true,
  organizacion_meals: true,
  fitness_workout: true,
  fitness_records: true,
  fitness_nutrition: true,
  finanzas_bills: true,
  finanzas_budgets: true,
  finanzas_piggy: true,
  familia_challenges: true,
  familia_streaks: true,
  familia_memories: true,
  // Granular push (new)
  tasks_assigned: true,
  tasks_due_today: true,
  tasks_completed: true,
  events_new: true,
  events_reminder_24h: true,
  events_reminder_15m: true,
  events_changes: true,
  finance_new_invoice: true,
  finance_due_soon: true,
  finance_paid: true,
  shopping_urgent: true,
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: {
    url?: string
    type?: NotificationType | string
    category?: NotificationCategory
    [key: string]: unknown
  }
}

