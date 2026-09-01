// USYTask — Central Type Definitions
// All interfaces for the multi-group data model.

export interface Member {
  id: string
  name: string
  role: 'adult' | 'child' | 'adulto' | 'hijo' | 'invitado'
  initials: string
  color?: string        // Display-friendly color name (e.g. 'Azul', 'Rosa')
  colorVar: string
  avatarColor: string
  points: number
  streak: number
  streakDays?: number
  avatarUrl?: string
  colorAccent?: string
  groupId: string
  isOwner?: boolean
}

export type EventCategory =
  | 'Deporte'
  | 'Médico'
  | 'Casa'
  | 'Plan'
  | 'Estudio'
  | 'General'
  | 'Trabajo'
  | 'Colegio'
  | 'Cumpleaños'

export const EVENT_CATEGORIES: EventCategory[] = [
  'General',
  'Deporte',
  'Médico',
  'Casa',
  'Plan',
  'Estudio',
  'Trabajo',
  'Colegio',
  'Cumpleaños',
]

export const categoryLabels: Record<EventCategory, string> = {
  Deporte: 'Deporte',
  Médico: 'Médico',
  Casa: 'Casa',
  Plan: 'Plan',
  Estudio: 'Estudio',
  General: 'General',
  Trabajo: 'Trabajo',
  Colegio: 'Colegio',
  Cumpleaños: 'Cumpleaños',
}

export interface CalendarEvent {
  id: string
  title: string
  time?: string
  endTime?: string
  date: string // ISO date string YYYY-MM-DD
  location?: string
  category: EventCategory
  assignedToMemberId?: string
  assignedMemberIds?: string[]
  groupId: string
}

export type PollType = 'event' | 'general'

export interface EventPollOption {
  id: string
  title: string // Nombre del plan / actividad / opción
  date?: string // ISO date string YYYY-MM-DD
  time?: string // HH:mm
  votes: string[] // memberIds who voted for this option
}

export interface EventPoll {
  id: string
  title: string
  description?: string
  pollType?: PollType // 'event' (para definir evento oficial) | 'general' (otro tipo / general)
  location?: string
  category: EventCategory
  options: EventPollOption[]
  participantMemberIds: string[]
  allowMultipleVotes?: boolean
  closeDate?: string
  groupId: string
  createdBy: string
  status: 'active' | 'resolved'
  resolvedEventId?: string
  winningOptionId?: string
  resolvedAt?: string
  createdAt: string
}

export function getEventMemberIds(event: CalendarEvent): string[] {
  if (event.assignedMemberIds && event.assignedMemberIds.length > 0) {
    return event.assignedMemberIds
  }
  if (event.assignedToMemberId) {
    return [event.assignedToMemberId]
  }
  return []
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskSection = string

export interface TaskCategory {
  id: string
  name: string
  memberIds: string[]
  groupId: string
  isSystem?: boolean
  isEssential?: boolean
}

export interface Task {
  id: string
  title: string
  points: number
  assignedToMemberId: string
  assignedMemberIds?: string[]
  completed: boolean
  groupId: string
  section: TaskSection
  customCategory?: string
  priority: TaskPriority
  needsApproval?: boolean
  recurring?: string
  dueDate?: string
  dueTime?: string
  doBeforeDate?: string // ISO date string YYYY-MM-DD (Hacer antes de)
  doBeforeTime?: string // HH:mm
  completedAt?: string
  createdBy?: string
}

export function getTaskMemberIds(task: Task): string[] {
  if (task.assignedMemberIds && task.assignedMemberIds.length > 0) {
    return task.assignedMemberIds
  }
  if (task.assignedToMemberId) {
    return [task.assignedToMemberId]
  }
  return []
}

export interface Reminder {
  id: string
  title: string
  dueDate: string // ISO date string
  time?: string // Optional HH:mm
  daysLeft: number
  groupId: string
  type?: 'itv' | 'documento' | 'medico' | 'factura' | 'otros'
  customCategory?: string
  assignedToMemberId?: string
  assignedMemberIds?: string[]
}

export function getReminderMemberIds(reminder: Reminder): string[] {
  if (reminder.assignedMemberIds && reminder.assignedMemberIds.length > 0) {
    return reminder.assignedMemberIds
  }
  if (reminder.assignedToMemberId) {
    return [reminder.assignedToMemberId]
  }
  return []
}

export type GroupType = 'family' | 'couple' | 'roommates' | 'personal' | 'other'

export interface Group {
  id: string
  name: string
  type: GroupType
  icon: string
  createdAt: string
  inviteToken: string
  isOwner: boolean
}

export const groupTypeLabels: Record<GroupType, { label: string; icon: string }> = {
  family: { label: 'Familia', icon: '👨‍👩‍👧' },
  couple: { label: 'Pareja', icon: '❤️' },
  roommates: { label: 'Compañeros de piso', icon: '🏠' },
  personal: { label: 'Personal', icon: '👤' },
  other: { label: 'Otro espacio', icon: '✨' },
}

// Palette for new member colors
export const MEMBER_COLORS = [
  { name: 'Azul', var: 'member-c1', value: 'oklch(0.58 0.12 245)' },
  { name: 'Rosa', var: 'member-c2', value: 'oklch(0.66 0.15 350)' },
  { name: 'Naranja', var: 'member-c3', value: 'oklch(0.68 0.14 55)' },
  { name: 'Violeta', var: 'member-c4', value: 'oklch(0.62 0.13 300)' },
  { name: 'Esmeralda', var: 'member-c5', value: 'oklch(0.62 0.13 155)' },
  { name: 'Rojo', var: 'member-c6', value: 'oklch(0.60 0.20 25)' },
  { name: 'Cian', var: 'member-c7', value: 'oklch(0.65 0.12 200)' },
  { name: 'Ámbar', var: 'member-c8', value: 'oklch(0.72 0.15 75)' },
]

export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'event_created'
  | 'reminder_created'
  | 'challenge_completed'
  | 'reward_claimed'
  | 'memory_created'
  | 'shopping_completed'

export interface Activity {
  id: string
  groupId: string
  type: ActivityType
  title: string
  details?: string
  memberId: string // The member associated with the action
  timestamp: string // ISO string for relative time calculation
  points?: number // If it's a task completion or challenge
  completedAt?: string
  data?: any
}

export type AddTab = 'tarea' | 'evento' | 'recordatorio' | 'miembro'

export interface AppNotification {
  id: string
  groupId: string
  recipientMemberId?: string
  type: 'task' | 'event' | 'reminder' | 'finance' | 'reward' | 'system'
  title: string
  body: string
  timestamp: string
  read?: boolean
  actionUrl?: string
  data?: {
    entityId?: string
    entityType?: string
    tab?: string
    subTab?: string
    [key: string]: any
  }
  colorVar?: string
}

// ---------- Meal & Recipe Definitions ----------
export type MealType = 'desayuno' | 'comida' | 'merienda' | 'cena'

export const mealTypeLabels: Record<MealType, { label: string; icon: string; time: string }> = {
  desayuno: { label: 'Desayuno', icon: '🌅', time: '08:30' },
  comida: { label: 'Comida', icon: '☀️', time: '14:00' },
  merienda: { label: 'Merienda', icon: '☕', time: '17:30' },
  cena: { label: 'Cena', icon: '🌙', time: '21:00' },
}

export interface MealItem {
  id: string
  name: string
  type: MealType
  ingredients?: string[]
  recipeInstructions?: string
  calories?: number
}

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export const dayNamesMap: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export type DailyMealsMap = {
  desayuno?: MealItem
  comida?: MealItem
  merienda?: MealItem
  cena?: MealItem
}

export interface DailyMenu {
  id: string
  groupId: string
  title: string
  date?: string
  meals: DailyMealsMap
  createdAt?: string
}

export interface WeeklyMenu {
  id: string
  groupId: string
  title: string
  startDate?: string
  endDate?: string
  days: {
    [key in DayOfWeek]?: DailyMealsMap
  }
  createdAt?: string
}

export * from './finances'
export * from './family'
export * from './fitness'

