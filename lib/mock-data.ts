// USYTask (Universal System for Tasks) — multi-space data proxy layer.
import { getActiveSpace } from './spaces'

export type MemberId = 'marcos' | 'marieli' | 'adrian' | 'celia'

export interface Member {
  id: MemberId
  name: string
  role: 'adult' | 'child'
  initials: string
  colorVar: string
  points: number
  streak: number
}

export function getMember(id: MemberId): Member {
  const currentMembers = getActiveSpace().members as Member[]
  return currentMembers.find((m) => m.id === id) ?? currentMembers[0] ?? {
    id: 'marcos',
    name: 'Alex',
    role: 'adult',
    initials: 'A',
    colorVar: 'member-marcos',
    points: 140,
    streak: 5,
  }
}

// Dynamic Household Proxy reflecting the active space
export const household = new Proxy(
  {
    name: 'Casa Nexo',
    type: 'family' as 'family' | 'couple' | 'roommates',
    inviteCode: 'nexo2026',
  },
  {
    get(_, prop: string) {
      const active = getActiveSpace()
      if (prop === 'name') return active.name
      if (prop === 'type') return active.type
      if (prop === 'inviteCode') return active.inviteToken
      return (active as any)[prop]
    },
  }
)

export const currentUser: MemberId = 'marcos'

// Dynamic arrays proxying active space data
export const members: Member[] = new Proxy([] as Member[], {
  get(target, prop, receiver) {
    const activeMembers = getActiveSpace().members as Member[]
    const val = Reflect.get(activeMembers, prop, receiver)
    return typeof val === 'function' ? val.bind(activeMembers) : val
  },
})

// ---------- Calendar / events ----------

export type EventCategory =
  | 'colegio'
  | 'trabajo'
  | 'medico'
  | 'deporte'
  | 'cumpleanos'
  | 'casa'
  | 'plan'
  | 'otros'

export interface CalendarEvent {
  id: string
  title: string
  time: string
  endTime?: string
  member: MemberId
  category: EventCategory
  dayOffset: number
  location?: string
}

export const categoryLabels: Record<EventCategory, string> = {
  colegio: 'Colegio',
  trabajo: 'Trabajo',
  medico: 'Médico',
  deporte: 'Deporte',
  cumpleanos: 'Cumpleaños',
  casa: 'Casa',
  plan: 'Plan',
  otros: 'Otros',
}

export const events: CalendarEvent[] = new Proxy([] as CalendarEvent[], {
  get(target, prop, receiver) {
    const currentEvents = getActiveSpace().events as CalendarEvent[]
    const val = Reflect.get(currentEvents, prop, receiver)
    return typeof val === 'function' ? val.bind(currentEvents) : val
  },
})

// ---------- Tasks ----------

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskSection = 'mias' | 'familia' | 'casa' | 'hijos' | 'recurrentes'

export interface Task {
  id: string
  title: string
  assignee: MemberId
  done: boolean
  section: TaskSection
  priority: TaskPriority
  points?: number
  time?: string
  needsApproval?: boolean
  recurring?: string
}

export const tasks: Task[] = new Proxy([] as Task[], {
  get(target, prop, receiver) {
    const currentTasks = getActiveSpace().tasks as Task[]
    const val = Reflect.get(currentTasks, prop, receiver)
    return typeof val === 'function' ? val.bind(currentTasks) : val
  },
})

// ---------- Shopping ----------

export type ShoppingCategory =
  | 'fruta'
  | 'carne'
  | 'lacteos'
  | 'despensa'
  | 'limpieza'
  | 'higiene'
  | 'mascotas'
  | 'otros'

export const shoppingCategoryLabels: Record<ShoppingCategory, string> = {
  fruta: 'Fruta y verdura',
  carne: 'Carne',
  lacteos: 'Lácteos',
  despensa: 'Despensa',
  limpieza: 'Limpieza',
  higiene: 'Higiene',
  mascotas: 'Mascotas',
  otros: 'Otros',
}

export interface ShoppingItem {
  id: string
  name: string
  category: ShoppingCategory
  done: boolean
  addedBy: MemberId
}

export interface ShoppingList {
  id: string
  name: string
  emoji: string
  items: ShoppingItem[]
}

export const shoppingLists: ShoppingList[] = new Proxy([] as ShoppingList[], {
  get(target, prop, receiver) {
    const currentLists = getActiveSpace().shoppingLists as ShoppingList[]
    const val = Reflect.get(currentLists, prop, receiver)
    return typeof val === 'function' ? val.bind(currentLists) : val
  },
})

// ---------- Reminders / vencimientos ----------

export interface Reminder {
  id: string
  title: string
  daysLeft: number
  type: 'itv' | 'documento' | 'medico' | 'factura' | 'otros'
}

export const reminders: Reminder[] = new Proxy([] as Reminder[], {
  get(target, prop, receiver) {
    const currentReminders = getActiveSpace().reminders as Reminder[]
    const val = Reflect.get(currentReminders, prop, receiver)
    return typeof val === 'function' ? val.bind(currentReminders) : val
  },
})

// ---------- Expenses / money ----------

export type ExpenseCategory =
  | 'vivienda'
  | 'alimentacion'
  | 'transporte'
  | 'ocio'
  | 'hijos'
  | 'suscripciones'
  | 'otros'

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  vivienda: 'Vivienda',
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  ocio: 'Ocio',
  hijos: 'Hijos',
  suscripciones: 'Suscripciones',
  otros: 'Otros',
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: ExpenseCategory
  member: MemberId
  date: string
}

export const expenses: Expense[] = new Proxy([] as Expense[], {
  get(target, prop, receiver) {
    const currentExpenses = getActiveSpace().expenses as Expense[]
    const val = Reflect.get(currentExpenses, prop, receiver)
    return typeof val === 'function' ? val.bind(currentExpenses) : val
  },
})

export const monthlyBudget = {
  income: 4800,
  expenses: 3420,
  savings: 1380,
  byCategory: [
    { category: 'vivienda' as ExpenseCategory, amount: 1250 },
    { category: 'alimentacion' as ExpenseCategory, amount: 640 },
    { category: 'transporte' as ExpenseCategory, amount: 380 },
    { category: 'ocio' as ExpenseCategory, amount: 420 },
    { category: 'hijos' as ExpenseCategory, amount: 480 },
    { category: 'suscripciones' as ExpenseCategory, amount: 120 },
    { category: 'otros' as ExpenseCategory, amount: 130 },
  ],
}

export const weeklyExpense = 342

export const wishlists: any[] = new Proxy([] as any[], {
  get(target, prop, receiver) {
    const currentWl = getActiveSpace().wishlists || []
    const val = Reflect.get(currentWl, prop, receiver)
    return typeof val === 'function' ? val.bind(currentWl) : val
  },
})

export const memories: any[] = []

// ---------- Goals ----------

export interface Goal {
  id: string
  title: string
  emoji: string
  current: number
  target: number
}

export const goals: Goal[] = [
  { id: 'g1', title: 'Vacaciones', emoji: '🏖', current: 2340, target: 5000 },
  { id: 'g2', title: 'Coche nuevo', emoji: '🚗', current: 6800, target: 15000 },
  { id: 'g3', title: 'Fondo emergencia', emoji: '🛟', current: 3200, target: 4000 },
]

// ---------- Bills ----------

export interface Bill {
  id: string
  name: string
  amount: number
  daysLeft: number
  emoji: string
}

export const bills: Bill[] = [
  { id: 'b1', name: 'Electricidad', amount: 74.3, daysLeft: 4, emoji: '⚡️' },
  { id: 'b2', name: 'Internet', amount: 39.99, daysLeft: 9, emoji: '📶' },
  { id: 'b3', name: 'Seguro hogar', amount: 28.5, daysLeft: 15, emoji: '🛡' },
  { id: 'b4', name: 'Hipoteca', amount: 820, daysLeft: 21, emoji: '🏠' },
]

// ---------- House maintenance ----------

export interface MaintenanceItem {
  id: string
  name: string
  status: 'ok' | 'soon' | 'overdue'
  detail: string
  emoji: string
}

export const maintenance: MaintenanceItem[] = [
  { id: 'm1', name: 'Caldera', status: 'soon', detail: 'Revisión en 3 semanas', emoji: '🔥' },
  { id: 'm2', name: 'Filtro de agua', status: 'overdue', detail: 'Cambiar (vencido)', emoji: '💧' },
  { id: 'm3', name: 'Aire acondicionado', status: 'ok', detail: 'Revisado en junio', emoji: '❄️' },
]

// ---------- Vehicles ----------

export interface Vehicle {
  id: string
  name: string
  plate: string
  km: number
  itvDaysLeft: number
  insuranceDaysLeft: number
  emoji: string
}

export const vehicles: Vehicle[] = [
  { id: 'v1', name: 'Seat León', plate: '4821 KLM', km: 84200, itvDaysLeft: 12, insuranceDaysLeft: 88, emoji: '🚗' },
]

// ---------- Inventory ----------

export interface InventoryItem {
  id: string
  name: string
  price: number
  purchaseDate: string
  warranty: string
  emoji: string
}

export const inventory: InventoryItem[] = [
  { id: 'i1', name: 'Televisor LG OLED', price: 1299, purchaseDate: 'Mar 2024', warranty: 'Hasta 2026', emoji: '📺' },
]

// ---------- Meals ----------

export interface Meal {
  breakfast: string
  lunch: string
  dinner: string
}

export const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const meals: Record<string, Meal> = {
  Lunes: { breakfast: 'Tostadas y fruta', lunch: 'Lentejas', dinner: 'Crema de calabacín' },
  Martes: { breakfast: 'Yogur y avena', lunch: 'Pollo al horno', dinner: 'Tortilla francesa' },
  Miércoles: { breakfast: 'Tostadas', lunch: 'Pasta boloñesa', dinner: 'Ensalada' },
  Jueves: { breakfast: 'Cereales', lunch: 'Pescado y verduras', dinner: 'Sopa' },
  Viernes: { breakfast: 'Tostadas y fruta', lunch: 'Arroz con verduras', dinner: 'Pizza casera' },
  Sábado: { breakfast: 'Tortitas', lunch: 'Paella', dinner: 'Hamburguesas' },
  Domingo: { breakfast: 'Bizcocho', lunch: 'Asado', dinner: 'Cena ligera' },
}

// ---------- Plans ----------

export interface Plan {
  id: string
  title: string
  emoji: string
  date: string
  participants: MemberId[]
  checklistDone: number
  checklistTotal: number
}

export const plans: Plan[] = new Proxy([] as Plan[], {
  get(target, prop, receiver) {
    const currentPlans = getActiveSpace().plans as Plan[]
    const val = Reflect.get(currentPlans, prop, receiver)
    return typeof val === 'function' ? val.bind(currentPlans) : val
  },
})

// ---------- Challenges ----------

export interface Challenge {
  id: string
  title: string
  emoji: string
  daysLeft: number
  leaderboard: { member: MemberId; points: number }[]
}

export const challenges: Challenge[] = [
  {
    id: 'c1',
    title: 'Semana ordenada',
    emoji: '🧹',
    daysLeft: 3,
    leaderboard: [
      { member: 'celia', points: 210 },
      { member: 'adrian', points: 180 },
      { member: 'marcos', points: 120 },
    ],
  },
]

// ---------- Rewards ----------

export interface Reward {
  id: string
  title: string
  cost: number
  emoji: string
}

export const rewards: Reward[] = [
  { id: 'rw1', title: '1 hora de consola', cost: 200, emoji: '🎮' },
  { id: 'rw2', title: 'Elegir cena', cost: 300, emoji: '🍕' },
]

// ---------- Achievements ----------

export interface Achievement {
  id: string
  title: string
  emoji: string
  member: MemberId
}

export const achievements: Achievement[] = [
  { id: 'a1', title: 'Semana perfecta', emoji: '🏆', member: 'adrian' },
]

// ---------- Activity feed ----------

export interface Activity {
  id: string
  member: MemberId
  text: string
  time: string
  reactions: { emoji: string; count: number }[]
}

export const activities: Activity[] = new Proxy([] as Activity[], {
  get(target, prop, receiver) {
    const currentActivities = getActiveSpace().activities as Activity[]
    const val = Reflect.get(currentActivities, prop, receiver)
    return typeof val === 'function' ? val.bind(currentActivities) : val
  },
})

export const activityPoints: Record<string, number> = {
  ac1: 15,
}

// ---------- Documents ----------

export type DocType = 'dni' | 'pasaporte' | 'seguro' | 'garantia' | 'contrato' | 'medico' | 'vehiculo' | 'otros'

export const docTypeLabels: Record<DocType, string> = {
  dni: 'DNI',
  pasaporte: 'Pasaporte',
  seguro: 'Seguro',
  garantia: 'Garantía',
  contrato: 'Contrato',
  medico: 'Médico',
  vehiculo: 'Vehículo',
  otros: 'Otros',
}

export interface Document {
  id: string
  name: string
  type: DocType
  owner: MemberId
  createdAt: string
  expiresAt?: string
  daysLeft?: number
  emoji: string
}

export const documents: Document[] = new Proxy([] as Document[], {
  get(target, prop, receiver) {
    const currentDocs = getActiveSpace().documents as Document[]
    const val = Reflect.get(currentDocs, prop, receiver)
    return typeof val === 'function' ? val.bind(currentDocs) : val
  },
})

// ---------- Greeting helper ----------

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export function getTodayLabel(): string {
  const d = new Date()
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
