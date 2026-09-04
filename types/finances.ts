export type IncomeFrequency = 'mensual' | 'quincenal' | 'puntual'
export type IncomeCategory = 'nómina' | 'inversiones' | 'alquiler' | 'otros'

export interface Income {
  id: string
  groupId: string
  memberId: string // quién lo percibe (o principal)
  memberIds?: string[] // selección múltiple de perceptores
  title: string // ej. "Nómina Dav"
  amount: number
  frequency: IncomeFrequency
  billingDay?: number // 1-31 (Día de cobro del mes)
  isRecurring?: boolean
  status?: 'active' | 'cancelled'
  category: IncomeCategory
  customCategory?: string
  date: string // ISO YYYY-MM-DD
  createdAt?: string
  updatedAt?: string
}

export type ExpenseCategory = 'alimentación' | 'vivienda' | 'transporte' | 'ocio' | 'salud' | 'educación' | 'hogar' | 'otros'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'alimentación',
  'vivienda',
  'transporte',
  'ocio',
  'salud',
  'educación',
  'hogar',
  'otros',
]

export const expenseCategoryMeta: Record<ExpenseCategory, { icon: string; label: string }> = {
  alimentación: { icon: '🛒', label: 'Alimentación' },
  vivienda: { icon: '🏠', label: 'Vivienda' },
  transporte: { icon: '🚗', label: 'Transporte' },
  ocio: { icon: '🎬', label: 'Ocio' },
  salud: { icon: '💊', label: 'Salud' },
  educación: { icon: '📚', label: 'Educación' },
  hogar: { icon: '🛋️', label: 'Hogar' },
  otros: { icon: '✨', label: 'Otros' },
}

export type UtilityType = 'electricidad' | 'agua' | 'gas' | 'internet_telefonia' | 'combustible' | 'otro'

export interface ConsumptionData {
  utilityType?: UtilityType
  customUtilityName?: string
  customUtilityUnit?: string
  consumptionUnit?: string // 'kWh', 'm³', 'L', o personalizado
  consumptionValue?: number // ej. 36
  kilometers?: number // km para repostajes
  unitPrice?: number // €/kWh, €/m3, €/L, €/ud
}

export interface Expense {
  id: string
  groupId: string
  title: string
  amount: number
  category: ExpenseCategory
  customCategory?: string
  note?: string
  date: string // ISO YYYY-MM-DD
  paidByMemberId: string // principal
  paidByMemberIds?: string[] // selección múltiple de miembros pagadores/asociados
  isRecurring: boolean
  billingDay?: number // 1-31 (Día de pago del mes)
  status?: 'active' | 'cancelled'
  subscriptionId?: string // Vinculado a la suscripción padre si se autogeneró
  consumption?: ConsumptionData
  createdAt?: string
  updatedAt?: string
}

export type BillingCycle = 'mensual' | 'anual'
export type BillStatus = 'pendiente' | 'pagado'
export type SubscriptionStatus = 'activa' | 'cancelada' | 'pausada'

export interface BillSubscription {
  id: string
  groupId: string
  name: string // ej. "Luz / Endesa", "Internet", "Netflix", "Alquiler"
  amount: number
  billingCycle: BillingCycle
  dueDay: number // 1-31 (Día de cobro/pago del mes)
  autopay: boolean
  status: BillStatus
  subscriptionStatus?: SubscriptionStatus // 'activa' | 'cancelada' | 'pausada'
  isActive?: boolean // default true
  category?: ExpenseCategory
  customCategory?: string
  lastPaidDate?: string
  lastGeneratedMonth?: string // YYYY-MM
  paidByMemberId?: string
  paidByMemberIds?: string[]
  consumption?: ConsumptionData
  createdAt?: string
  updatedAt?: string
}

export interface Budget {
  id: string
  groupId: string
  category: ExpenseCategory
  monthlyLimit: number
}

export interface PiggyBankConfig {
  groupId: string
  initialBalance: number
  updatedAt?: string
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getIncomeMemberIds(income: Income): string[] {
  if (income.memberIds && income.memberIds.length > 0) {
    return income.memberIds
  }
  return income.memberId ? [income.memberId] : []
}

export function getExpenseMemberIds(expense: Expense): string[] {
  if (expense.paidByMemberIds && expense.paidByMemberIds.length > 0) {
    return expense.paidByMemberIds
  }
  return expense.paidByMemberId ? [expense.paidByMemberId] : []
}

export function formatMonthLabel(monthISO: string): string {
  if (!monthISO || monthISO.length < 7) return ''
  const [yearStr, monthStr] = monthISO.split('-')
  const year = parseInt(yearStr, 10)
  const monthIdx = parseInt(monthStr, 10) - 1
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return `${monthNames[monthIdx]} ${year}`
}

export function getPreviousMonthISO(monthISO: string): string {
  const [yearStr, monthStr] = monthISO.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthStr, 10) - 1
  if (month < 1) {
    month = 12
    year -= 1
  }
  return `${year}-${month.toString().padStart(2, '0')}`
}

export function getNextMonthISO(monthISO: string): string {
  const [yearStr, monthStr] = monthISO.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthStr, 10) + 1
  if (month > 12) {
    month = 1
    year += 1
  }
  return `${year}-${month.toString().padStart(2, '0')}`
}
