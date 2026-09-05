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
  frequency?: ExpenseFrequency // 'puntual' | 'mensual' | 'bimestral' | 'trimestral' | 'anual'
  status?: 'active' | 'cancelled'
  subscriptionId?: string // Vinculado a la suscripción padre si se autogeneró
  consumption?: ConsumptionData
  createdAt?: string
  updatedAt?: string
}

export type ExpenseFrequency = 'puntual' | 'mensual' | 'bimestral' | 'trimestral' | 'anual'

export interface ExpenseFrequencyOption {
  value: ExpenseFrequency
  label: string
  monthsInterval: number // 0 para puntual, 1 mensual, 2 bimestral, 3 trimestral, 12 anual
  shortLabel: string
}

export const EXPENSE_FREQUENCIES: ExpenseFrequencyOption[] = [
  { value: 'puntual', label: 'Puntual', monthsInterval: 0, shortLabel: 'puntual' },
  { value: 'mensual', label: 'Mensual', monthsInterval: 1, shortLabel: '/mes' },
  { value: 'bimestral', label: 'Bimestral', monthsInterval: 2, shortLabel: '/2 meses' },
  { value: 'trimestral', label: 'Trimestral', monthsInterval: 3, shortLabel: '/trimestre' },
  { value: 'anual', label: 'Anual', monthsInterval: 12, shortLabel: '/año' },
]

export const EXPENSE_FREQUENCY_CONFIG: Record<ExpenseFrequency, ExpenseFrequencyOption> = {
  puntual: { value: 'puntual', label: 'Puntual', monthsInterval: 0, shortLabel: 'puntual' },
  mensual: { value: 'mensual', label: 'Mensual', monthsInterval: 1, shortLabel: '/mes' },
  bimestral: { value: 'bimestral', label: 'Bimestral', monthsInterval: 2, shortLabel: '/2 meses' },
  trimestral: { value: 'trimestral', label: 'Trimestral', monthsInterval: 3, shortLabel: '/trimestre' },
  anual: { value: 'anual', label: 'Anual', monthsInterval: 12, shortLabel: '/año' },
}

export type BillingCycle = 'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'anual'

export interface BillingCycleOption {
  value: BillingCycle
  label: string
  monthsInterval: number
  shortLabel: string
}

export const BILLING_CYCLES: BillingCycleOption[] = [
  { value: 'mensual', label: 'Mensual', monthsInterval: 1, shortLabel: '/mes' },
  { value: 'bimestral', label: 'Bimestral', monthsInterval: 2, shortLabel: '/2 meses' },
  { value: 'trimestral', label: 'Trimestral', monthsInterval: 3, shortLabel: '/trimestre' },
  { value: 'cuatrimestral', label: 'Cuatrimestral', monthsInterval: 4, shortLabel: '/4 meses' },
  { value: 'anual', label: 'Anual', monthsInterval: 12, shortLabel: '/año' },
]

export const BILLING_CYCLE_CONFIG: Record<BillingCycle, BillingCycleOption> = {
  mensual: { value: 'mensual', label: 'Mensual', monthsInterval: 1, shortLabel: '/mes' },
  bimestral: { value: 'bimestral', label: 'Bimestral', monthsInterval: 2, shortLabel: '/2 meses' },
  trimestral: { value: 'trimestral', label: 'Trimestral', monthsInterval: 3, shortLabel: '/trimestre' },
  cuatrimestral: { value: 'cuatrimestral', label: 'Cuatrimestral', monthsInterval: 4, shortLabel: '/4 meses' },
  anual: { value: 'anual', label: 'Anual', monthsInterval: 12, shortLabel: '/año' },
}

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
  startMonth?: string // YYYY-MM
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
  note?: string // Anotación o propósito descriptivo (ej. para la categoría 'otros')
  updatedAt?: string
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

/**
 * Checks whether an expense is due in the target month (YYYY-MM).
 * - 'puntual': only in its exact date's month
 * - 'mensual': every month starting from its date
 * - 'bimestral': every 2 months (interval 2)
 * - 'trimestral': every 3 months (interval 3)
 * - 'anual': every 12 months (interval 12)
 */
export function isExpenseDueInMonth(expense: Expense, targetMonthISO: string): boolean {
  if (!targetMonthISO || targetMonthISO.length < 7) return false
  const target = targetMonthISO.slice(0, 7)
  const freq = expense.frequency || (expense.isRecurring ? 'mensual' : 'puntual')

  if (freq === 'puntual') {
    return Boolean(expense.date && expense.date.startsWith(target))
  }

  const interval = EXPENSE_FREQUENCY_CONFIG[freq]?.monthsInterval || 1
  if (!expense.date) return true

  const baseMonth = expense.date.slice(0, 7)
  const [bYear, bMonth] = baseMonth.split('-').map((v) => parseInt(v, 10))
  const [tYear, tMonth] = target.split('-').map((v) => parseInt(v, 10))

  if (isNaN(bYear) || isNaN(bMonth) || isNaN(tYear) || isNaN(tMonth)) return false

  const diffMonths = (tYear - bYear) * 12 + (tMonth - bMonth)
  if (diffMonths < 0) return false

  return diffMonths % interval === 0
}

/**
 * Checks whether a bill/subscription is due in the target month (YYYY-MM) according to its cycle.
 */
export function isBillDueInMonth(bill: BillSubscription, targetMonthISO: string): boolean {
  if (!targetMonthISO || targetMonthISO.length < 7) return false
  if (bill.subscriptionStatus === 'cancelada' || bill.subscriptionStatus === 'pausada' || bill.isActive === false) {
    return false
  }

  const cycle = bill.billingCycle || 'mensual'
  if (cycle === 'mensual') return true

  const interval = BILLING_CYCLE_CONFIG[cycle]?.monthsInterval || 1
  if (interval <= 1) return true

  const target = targetMonthISO.slice(0, 7)
  const baseMonth = bill.startMonth || (bill.createdAt ? bill.createdAt.slice(0, 7) : '2026-01')
  const [bYear, bMonth] = baseMonth.split('-').map((v) => parseInt(v, 10))
  const [tYear, tMonth] = target.split('-').map((v) => parseInt(v, 10))

  if (isNaN(bYear) || isNaN(bMonth) || isNaN(tYear) || isNaN(tMonth)) return true

  const diffMonths = (tYear - bYear) * 12 + (tMonth - bMonth)
  if (diffMonths < 0) return false
  return ((diffMonths % interval) + interval) % interval === 0
}

/**
 * Returns the effective list of expenses that belong to the target month (YYYY-MM).
 * Direct entries for the month are returned, and any active periodic expense template
 * that is due in the target month but hasn't yet materialized into an entry is included.
 * Crucially, expenses from periodic templates are NOT included in intermediate months.
 */
export function getEffectiveExpensesForMonth(expensesList: Expense[], targetMonthISO: string): Expense[] {
  if (!targetMonthISO || targetMonthISO.length < 7) return expensesList
  const target = targetMonthISO.slice(0, 7)

  // Direct expenses whose date matches this month
  const directInMonth = expensesList.filter((e) => e.date && e.date.startsWith(target))

  // Recurring templates that are due in this month but don't have an instance for this month yet
  const unmaterializedTemplates = expensesList.filter((e) => {
    if (!e.isRecurring) return false
    if (e.date && e.date.startsWith(target)) return false // already counted in directInMonth
    if (e.id.startsWith('exp_rec_') || e.id.startsWith('exp_sub_')) return false
    if (!isExpenseDueInMonth(e, target)) return false

    // Check if an entry for this template or recurring item already exists in directInMonth
    const exists = directInMonth.some(
      (m) =>
        m.id === `exp_rec_${e.id}_${target}` ||
        (m.title.toLowerCase() === e.title.toLowerCase() && m.isRecurring)
    )
    return !exists
  })

  return [...directInMonth, ...unmaterializedTemplates]
}

/**
 * Returns bills/subscriptions that are due in the target month (YYYY-MM) and have NOT yet
 * been materialized as an expense entry in the expenses list for that month.
 */
export function getEffectiveBillsForMonth(
  billsList: BillSubscription[],
  expensesList: Expense[],
  targetMonthISO: string
): BillSubscription[] {
  if (!targetMonthISO || targetMonthISO.length < 7) return []
  const target = targetMonthISO.slice(0, 7)
  return billsList.filter((b) => {
    if (b.subscriptionStatus === 'cancelada' || b.subscriptionStatus === 'pausada' || b.isActive === false) return false
    if (!isBillDueInMonth(b, target)) return false
    const alreadyInExpenses = expensesList.some(
      (e) =>
        e.date?.startsWith(target) &&
        (e.subscriptionId === b.id || (e.title.toLowerCase() === b.name.toLowerCase() && e.isRecurring))
    )
    return !alreadyInExpenses
  })
}

