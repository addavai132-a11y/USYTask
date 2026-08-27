export type NotificationCategory = 'organizacion' | 'fitness' | 'finanzas' | 'familia'

export type NotificationType =
  // Organización
  | 'organizacion_events'
  | 'organizacion_shopping'
  | 'organizacion_meals'
  // Fitness
  | 'fitness_workout'
  | 'fitness_records'
  | 'fitness_nutrition'
  // Finanzas
  | 'finanzas_bills'
  | 'finanzas_budgets'
  | 'finanzas_piggy'
  // Familia
  | 'familia_challenges'
  | 'familia_streaks'
  | 'familia_memories'

export interface NotificationPreferences {
  // Organización
  organizacion_events: boolean
  organizacion_shopping: boolean
  organizacion_meals: boolean
  // Fitness
  fitness_workout: boolean
  fitness_records: boolean
  fitness_nutrition: boolean
  // Finanzas
  finanzas_bills: boolean
  finanzas_budgets: boolean
  finanzas_piggy: boolean
  // Familia
  familia_challenges: boolean
  familia_streaks: boolean
  familia_memories: boolean
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
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
