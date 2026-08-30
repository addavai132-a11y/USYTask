// USYTask — Data store: CRUD for tasks, events, reminders, members (per group)
// All data is scoped by groupId and persisted in localStorage.

import type { Task, CalendarEvent, Reminder, Member, Activity, TaskCategory, EventPoll, DailyMenu, WeeklyMenu, Income, Expense, BillSubscription, Budget, PiggyBankConfig, AppNotification } from '@/types'
import { daysUntil } from './date-utils'
import { scheduleCloudSync } from './cloud-sync'

const TASKS_KEY = 'usytask_tasks'
const TASK_CATEGORIES_KEY = 'usytask_custom_task_categories'
const EVENTS_KEY = 'usytask_events'
const REMINDERS_KEY = 'usytask_reminders'
const MEMBERS_KEY = 'usytask_members'
const ACTIVITIES_KEY = 'usytask_activities'
const NOTIFICATIONS_KEY = 'usytask_notifications'

// ---------- Generic helpers ----------

function loadArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveArray<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    scheduleCloudSync()
  } catch (err) {
    console.error(`Error saving ${key}`, err)
  }
}

// ---------- Members ----------

export function getAllMembers(): Member[] {
  return loadArray<Member>(MEMBERS_KEY)
}

export function getMembersByGroup(groupId: string): Member[] {
  return getAllMembers().filter((m) => m.groupId === groupId)
}

export function getMemberById(memberId: string, groupId?: string): Member | null {
  if (!memberId) return null
  if (groupId) {
    const foundInGroup = getMembersByGroup(groupId).find((m) => m.id === memberId)
    if (foundInGroup) return foundInGroup
  }
  return getAllMembers().find((m) => m.id === memberId) || null
}

export function addMember(member: Member): void {
  const all = getAllMembers()
  all.push(member)
  saveArray(MEMBERS_KEY, all)
}

export function updateMemberPoints(memberId: string, groupId: string, pointsToAdd: number): void {
  const all = getAllMembers()
  const idx = all.findIndex((m) => m.id === memberId && m.groupId === groupId)
  if (idx >= 0) {
    const current = Number(all[idx].points) || 0
    const delta = Number(pointsToAdd) || 0
    all[idx] = { ...all[idx], points: current + delta }
    saveArray(MEMBERS_KEY, all)
  }
}

export function ensureOwnerMember(groupId: string, userName: string, role?: string): Member {
  const existing = getMembersByGroup(groupId)
  const owner = existing.find((m) => m.isOwner)
  if (owner) return owner

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const member: Member = {
    id: `member_owner_${groupId}`,
    name: userName,
    role: (role as any) || 'adult',
    initials: initials || userName.charAt(0).toUpperCase(),
    colorVar: 'member-marcos',
    avatarColor: 'oklch(0.58 0.12 245)',
    points: 0,
    streak: 0,
    groupId,
    isOwner: true,
  }
  addMember(member)
  return member
}

// ---------- Tasks ----------

export function getAllTasks(): Task[] {
  return loadArray<Task>(TASKS_KEY)
}

export function getTasksByGroup(groupId: string): Task[] {
  return getAllTasks().filter((t) => t.groupId === groupId)
}

export function addTask(task: Task): void {
  const all = getAllTasks()
  all.push(task)
  saveArray(TASKS_KEY, all)
}

export function toggleTask(taskId: string, groupId: string): { pointsAwarded: number; memberId: string | null } {
  const all = getAllTasks()
  const idx = all.findIndex((t) => t.id === taskId && t.groupId === groupId)
  if (idx < 0) return { pointsAwarded: 0, memberId: null }

  const task = all[idx]
  // Bloqueo permanente: Si la tarea ya está completada, no se puede desmarcar
  if (task.completed) {
    return { pointsAwarded: 0, memberId: null }
  }

  all[idx] = { 
    ...task, 
    completed: true,
    completedAt: new Date().toISOString(),
  }
  saveArray(TASKS_KEY, all)

  if (task.points > 0) {
    updateMemberPoints(task.assignedToMemberId, groupId, task.points)
    return { pointsAwarded: task.points, memberId: task.assignedToMemberId }
  }
  return { pointsAwarded: 0, memberId: null }
}

export function deleteTask(taskId: string, groupId: string): void {
  const all = getAllTasks()
  const task = all.find((t) => t.id === taskId && t.groupId === groupId)
  if (task && task.completed && task.points > 0) {
    updateMemberPoints(task.assignedToMemberId, groupId, -task.points)
  }
  saveArray(TASKS_KEY, all.filter((t) => !(t.id === taskId && t.groupId === groupId)))
}

// ---------- Events ----------

export function getAllEvents(): CalendarEvent[] {
  return loadArray<CalendarEvent>(EVENTS_KEY)
}

export function getEventsByGroup(groupId: string): CalendarEvent[] {
  return getAllEvents().filter((e) => e.groupId === groupId)
}

export function addEvent(event: CalendarEvent): void {
  const all = getAllEvents()
  all.push(event)
  saveArray(EVENTS_KEY, all)
}

export function deleteEvent(eventId: string, groupId: string): void {
  const all = getAllEvents()
  saveArray(EVENTS_KEY, all.filter((e) => !(e.id === eventId && e.groupId === groupId)))
}

// ---------- Reminders ----------

export function getAllReminders(): Reminder[] {
  return loadArray<Reminder>(REMINDERS_KEY)
}

export function getRemindersByGroup(groupId: string): Reminder[] {
  return getAllReminders()
    .filter((r) => r.groupId === groupId)
    .map((r) => ({ ...r, daysLeft: daysUntil(r.dueDate) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export function addReminder(reminder: Reminder): void {
  const all = getAllReminders()
  all.push(reminder)
  saveArray(REMINDERS_KEY, all)
}

export function deleteReminder(reminderId: string, groupId: string): void {
  const all = getAllReminders()
  saveArray(REMINDERS_KEY, all.filter((r) => !(r.id === reminderId && r.groupId === groupId)))
}

// ---------- Activities ----------

export function getAllActivities(): Activity[] {
  return loadArray<Activity>(ACTIVITIES_KEY)
}

export function getActivitiesByGroup(groupId: string): Activity[] {
  return getAllActivities()
    .filter((a) => a.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addActivity(activity: Activity): void {
  const all = getAllActivities()
  all.push(activity)
  // Limit activities per group to prevent infinite growth (keep all groups' data intact)
  const groupActivities = all.filter(a => a.groupId === activity.groupId)
  if (groupActivities.length > 50) {
    const oldest = groupActivities.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]
    const idx = all.findIndex(a => a.id === oldest.id)
    if (idx > -1) all.splice(idx, 1)
  }
  saveArray(ACTIVITIES_KEY, all)
}

// ---------- Notifications ----------

export function getAllNotifications(): AppNotification[] {
  return loadArray<AppNotification>(NOTIFICATIONS_KEY)
}

export function getNotificationsByGroup(groupId: string): AppNotification[] {
  return getAllNotifications().filter((n) => n.groupId === groupId)
}

export function addNotification(notification: AppNotification): void {
  const all = getAllNotifications()
  // Add to beginning
  all.unshift({
    ...notification,
    read: notification.read !== undefined ? notification.read : false,
  })
  // Keep last 60
  if (all.length > 60) {
    all.length = 60
  }
  saveArray(NOTIFICATIONS_KEY, all)
}

export function markNotificationAsRead(notificationId: string): void {
  const all = getAllNotifications()
  const idx = all.findIndex((n) => n.id === notificationId)
  if (idx >= 0) {
    all[idx].read = true
    saveArray(NOTIFICATIONS_KEY, all)
  }
}

export function markAllNotificationsAsReadByGroup(groupId: string): void {
  const all = getAllNotifications()
  let changed = false
  all.forEach((n) => {
    if (n.groupId === groupId && !n.read) {
      n.read = true
      changed = true
    }
  })
  if (changed) {
    saveArray(NOTIFICATIONS_KEY, all)
  }
}

export function deleteNotification(notificationId: string): void {
  const all = getAllNotifications()
  saveArray(NOTIFICATIONS_KEY, all.filter((n) => n.id !== notificationId))
}

export function clearNotificationsByGroup(groupId: string): void {
  const all = getAllNotifications()
  saveArray(NOTIFICATIONS_KEY, all.filter((n) => n.groupId !== groupId))
}

// ---------- Shopping Lists & Items ----------

export interface ShoppingList {
  id: string
  name: string
  groupId: string
}

export interface ShoppingItem {
  id: string
  name: string
  completed: boolean
  listId: string
  groupId: string
  price?: number
  unitPrice?: number
  quantity?: number
  aisle?: string
  supermarket?: string
  createdAt?: string
}

const SHOPPING_LISTS_KEY = 'usytask_shopping_lists_v2'
const SHOPPING_ITEMS_KEY = 'usytask_shopping_items_v2'

export function getAllShoppingLists(): ShoppingList[] {
  return loadArray<ShoppingList>(SHOPPING_LISTS_KEY)
}

export function getShoppingListsByGroup(groupId: string): ShoppingList[] {
  return getAllShoppingLists().filter((l) => l.groupId === groupId)
}

export function addShoppingList(list: ShoppingList): void {
  const all = getAllShoppingLists()
  all.push(list)
  saveArray(SHOPPING_LISTS_KEY, all)
}

export function updateShoppingList(listId: string, newName: string, groupId: string): void {
  const all = getAllShoppingLists()
  const idx = all.findIndex((l) => l.id === listId && l.groupId === groupId)
  if (idx >= 0) {
    all[idx].name = newName
    saveArray(SHOPPING_LISTS_KEY, all)
  }
}

export function deleteShoppingList(listId: string, groupId: string): void {
  const lists = getAllShoppingLists().filter((l) => !(l.id === listId && l.groupId === groupId))
  saveArray(SHOPPING_LISTS_KEY, lists)

  const items = getAllShoppingItems().filter((i) => !(i.listId === listId && i.groupId === groupId))
  saveArray(SHOPPING_ITEMS_KEY, items)
}

export function getAllShoppingItems(): ShoppingItem[] {
  return loadArray<ShoppingItem>(SHOPPING_ITEMS_KEY)
}

export function getShoppingItemsByGroup(groupId: string): ShoppingItem[] {
  return getAllShoppingItems().filter((i) => i.groupId === groupId)
}

export function addShoppingItem(item: ShoppingItem): void {
  const all = getAllShoppingItems()
  all.push(item)
  saveArray(SHOPPING_ITEMS_KEY, all)
}

export function toggleShoppingItem(itemId: string, groupId: string): void {
  const all = getAllShoppingItems()
  const idx = all.findIndex((i) => i.id === itemId && i.groupId === groupId)
  if (idx >= 0) {
    all[idx].completed = !all[idx].completed
    saveArray(SHOPPING_ITEMS_KEY, all)
  }
}

export function deleteShoppingItem(itemId: string, groupId: string): void {
  const all = getAllShoppingItems()
  saveArray(SHOPPING_ITEMS_KEY, all.filter((i) => !(i.id === itemId && i.groupId === groupId)))
}

// ---------- Task Categories ----------

const DEFAULT_TASK_CATEGORIES: Omit<TaskCategory, 'groupId'>[] = [
  { id: 'mias', name: 'Mías', memberIds: [], isEssential: true },
  { id: 'familia', name: 'Familia', memberIds: [], isEssential: true },
  { id: 'casa', name: 'Casa', memberIds: [], isEssential: false },
  { id: 'hijos', name: 'Hijos', memberIds: [], isEssential: false },
  { id: 'recurrentes', name: 'Recurrentes', memberIds: [], isEssential: false },
]

export function getAllTaskCategories(): TaskCategory[] {
  return loadArray<TaskCategory>(TASK_CATEGORIES_KEY)
}

export function getTaskCategoriesByGroup(groupId: string): TaskCategory[] {
  const all = getAllTaskCategories()
  const groupCats = all.filter((c) => c.groupId === groupId)
  if (groupCats.length > 0) return groupCats

  // Initialize group with default categories if none are stored yet
  const defaults: TaskCategory[] = DEFAULT_TASK_CATEGORIES.map((dc) => ({
    ...dc,
    groupId,
  }))
  saveArray(TASK_CATEGORIES_KEY, [...all, ...defaults])
  return defaults
}

export function addTaskCategory(category: TaskCategory): void {
  const all = getAllTaskCategories()
  all.push(category)
  saveArray(TASK_CATEGORIES_KEY, all)
}

export function deleteTaskCategory(categoryId: string, groupId: string): void {
  const categories = getAllTaskCategories().filter((c) => !(c.id === categoryId && c.groupId === groupId))
  saveArray(TASK_CATEGORIES_KEY, categories)

  // Reassign tasks from deleted category to 'familia'
  const tasks = getAllTasks()
  let updated = false
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].groupId === groupId && tasks[i].section === categoryId) {
      tasks[i].section = 'familia'
      updated = true
    }
  }
  if (updated) {
    saveArray(TASKS_KEY, tasks)
  }
}

// ---------- Event Polls ----------

const EVENT_POLLS_KEY = 'usytask_event_polls'

export function getAllEventPolls(): EventPoll[] {
  return loadArray<EventPoll>(EVENT_POLLS_KEY)
}

export function getEventPollsByGroup(groupId: string): EventPoll[] {
  return getAllEventPolls()
    .filter((p) => p.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addEventPoll(poll: EventPoll): void {
  const all = getAllEventPolls()
  all.push(poll)
  saveArray(EVENT_POLLS_KEY, all)
}

export function voteEventPoll(
  pollId: string,
  optionId: string,
  memberId: string,
  groupId: string
): { poll: EventPoll | null; resolvedEvent?: CalendarEvent } {
  const all = getAllEventPolls()
  const idx = all.findIndex((p) => p.id === pollId && p.groupId === groupId)
  if (idx < 0) return { poll: null }

  const poll = all[idx]
  if (poll.status === 'resolved') return { poll }

  // Update votes: member votes for selected option
  const updatedOptions = poll.options.map((opt) => ({
    ...opt,
    votes: opt.votes.filter((id) => id !== memberId),
  }))

  const targetOptIdx = updatedOptions.findIndex((opt) => opt.id === optionId)
  if (targetOptIdx >= 0) {
    updatedOptions[targetOptIdx].votes.push(memberId)
  }

  // Check unique voted members
  const votedMembersSet = new Set<string>()
  updatedOptions.forEach((opt) => opt.votes.forEach((mId) => votedMembersSet.add(mId)))

  let resolvedEvent: CalendarEvent | undefined = undefined
  let newStatus: 'active' | 'resolved' = 'active'
  let resolvedEventId: string | undefined = undefined

  const totalParticipants = poll.participantMemberIds.length
  if (totalParticipants > 0 && votedMembersSet.size >= totalParticipants) {
    newStatus = 'resolved'
    const sortedOptions = [...updatedOptions].sort((a, b) => b.votes.length - a.votes.length)
    const winningOption = sortedOptions[0]

    if (winningOption) {
      resolvedEvent = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: winningOption.title || poll.title,
        date: winningOption.date,
        time: winningOption.time,
        category: poll.category,
        location: poll.location,
        assignedMemberIds: poll.participantMemberIds,
        assignedToMemberId: poll.participantMemberIds[0] || '',
        groupId: poll.groupId,
      }
      addEvent(resolvedEvent)
      resolvedEventId = resolvedEvent.id
    }
  }

  const updatedPoll: EventPoll = {
    ...poll,
    options: updatedOptions,
    status: newStatus,
    resolvedEventId,
  }

  all[idx] = updatedPoll
  saveArray(EVENT_POLLS_KEY, all)

  return { poll: updatedPoll, resolvedEvent }
}

export function deleteEventPoll(pollId: string, groupId: string): void {
  const all = getAllEventPolls()
  saveArray(EVENT_POLLS_KEY, all.filter((p) => !(p.id === pollId && p.groupId === groupId)))
}

// ---------- Daily & Weekly Menus ----------

const DAILY_MENUS_KEY = 'usytask_daily_menus'
const WEEKLY_MENUS_KEY = 'usytask_weekly_menus'

export function getAllDailyMenus(): DailyMenu[] {
  return loadArray<DailyMenu>(DAILY_MENUS_KEY)
}

export function getDailyMenusByGroup(groupId: string): DailyMenu[] {
  return getAllDailyMenus().filter((m) => m.groupId === groupId && m.id !== 'sample_daily_mediterranean')
}

export function addDailyMenu(menu: DailyMenu): void {
  const all = getAllDailyMenus().filter((m) => m.id !== 'sample_daily_mediterranean')
  all.unshift(menu)
  saveArray(DAILY_MENUS_KEY, all)
}

export function updateDailyMenu(menu: DailyMenu): void {
  const all = getAllDailyMenus()
  const idx = all.findIndex((m) => m.id === menu.id && m.groupId === menu.groupId)
  if (idx >= 0) {
    all[idx] = menu
    saveArray(DAILY_MENUS_KEY, all)
  }
}

export function deleteDailyMenu(id: string, groupId: string): void {
  const all = getAllDailyMenus()
  saveArray(DAILY_MENUS_KEY, all.filter((m) => !(m.id === id && m.groupId === groupId)))
}

export function duplicateDailyMenu(id: string, groupId: string): DailyMenu | null {
  const all = getAllDailyMenus().filter((m) => m.id !== 'sample_daily_mediterranean')
  const original = all.find((m) => m.id === id && m.groupId === groupId)
  if (!original) return null

  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `daily_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const copy: DailyMenu = {
    ...original,
    id: uniqueId,
    title: `${original.title} (Copia)`,
    createdAt: new Date().toISOString(),
  }
  all.unshift(copy)
  saveArray(DAILY_MENUS_KEY, all)
  return copy
}

export function getAllWeeklyMenus(): WeeklyMenu[] {
  return loadArray<WeeklyMenu>(WEEKLY_MENUS_KEY)
}

export function getWeeklyMenusByGroup(groupId: string): WeeklyMenu[] {
  return getAllWeeklyMenus().filter((m) => m.groupId === groupId && m.id !== 'sample_weekly_balanced')
}

export function addWeeklyMenu(menu: WeeklyMenu): void {
  const all = getAllWeeklyMenus().filter((m) => m.id !== 'sample_weekly_balanced')
  all.unshift(menu)
  saveArray(WEEKLY_MENUS_KEY, all)
}

export function updateWeeklyMenu(menu: WeeklyMenu): void {
  const all = getAllWeeklyMenus()
  const idx = all.findIndex((m) => m.id === menu.id && m.groupId === menu.groupId)
  if (idx >= 0) {
    all[idx] = menu
    saveArray(WEEKLY_MENUS_KEY, all)
  }
}

export function deleteWeeklyMenu(id: string, groupId: string): void {
  const all = getAllWeeklyMenus()
  saveArray(WEEKLY_MENUS_KEY, all.filter((m) => !(m.id === id && m.groupId === groupId)))
}

export function duplicateWeeklyMenu(id: string, groupId: string): WeeklyMenu | null {
  const all = getAllWeeklyMenus()
  const original = all.find((m) => m.id === id && m.groupId === groupId)
  if (!original) return null

  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `weekly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const copy: WeeklyMenu = {
    ...original,
    id: uniqueId,
    title: `${original.title} (Copia)`,
    createdAt: new Date().toISOString(),
  }
  all.unshift(copy)
  saveArray(WEEKLY_MENUS_KEY, all)
  return copy
}

// ---------- Finances (Incomes, Expenses, Bills, Budgets) ----------

const INCOMES_KEY = 'usytask_incomes'
const EXPENSES_KEY = 'usytask_expenses'
const BILLS_KEY = 'usytask_bills'
const BUDGETS_KEY = 'usytask_budgets'

// Incomes
export function getAllIncomes(): Income[] {
  return loadArray<Income>(INCOMES_KEY)
}

export function getIncomesByGroup(groupId: string): Income[] {
  return getAllIncomes().filter((item) => item.groupId === groupId)
}

export function addIncome(income: Income): void {
  try {
    const all = getAllIncomes()
    all.unshift({
      ...income,
      amount: Number(income.amount) || 0,
    })
    saveArray(INCOMES_KEY, all)
  } catch (err) {
    console.error('Error in addIncome:', err)
  }
}

export function updateIncome(income: Income): void {
  const all = getAllIncomes()
  const idx = all.findIndex((i) => i.id === income.id && i.groupId === income.groupId)
  if (idx >= 0) {
    all[idx] = income
    saveArray(INCOMES_KEY, all)
  }
}

export function deleteIncome(id: string, groupId: string): void {
  const all = getAllIncomes()
  saveArray(INCOMES_KEY, all.filter((i) => !(i.id === id && i.groupId === groupId)))
}

// Expenses
export function getAllExpenses(): Expense[] {
  return loadArray<Expense>(EXPENSES_KEY)
}

export function getExpensesByGroup(groupId: string): Expense[] {
  return getAllExpenses().filter((item) => item.groupId === groupId)
}

export function addExpense(expense: Expense): void {
  const all = getAllExpenses()
  all.unshift(expense)
  saveArray(EXPENSES_KEY, all)
}

export function updateExpense(expense: Expense): void {
  const all = getAllExpenses()
  const idx = all.findIndex((e) => e.id === expense.id && e.groupId === expense.groupId)
  if (idx >= 0) {
    all[idx] = expense
    saveArray(EXPENSES_KEY, all)
  }
}

export function deleteExpense(id: string, groupId: string): void {
  const all = getAllExpenses()
  saveArray(EXPENSES_KEY, all.filter((e) => !(e.id === id && e.groupId === groupId)))
}

// Bill / Subscriptions
export function getAllBills(): BillSubscription[] {
  return loadArray<BillSubscription>(BILLS_KEY)
}

export function getBillsByGroup(groupId: string): BillSubscription[] {
  return getAllBills().filter((item) => item.groupId === groupId)
}

export function addBill(bill: BillSubscription): void {
  const all = getAllBills()
  all.unshift({
    ...bill,
    subscriptionStatus: bill.subscriptionStatus || 'activa',
    isActive: bill.isActive !== undefined ? bill.isActive : true,
    amount: Number(bill.amount) || 0,
    dueDay: Number(bill.dueDay) || 1,
    createdAt: new Date().toISOString(),
  })
  saveArray(BILLS_KEY, all)
}

export function updateBill(bill: BillSubscription): void {
  const all = getAllBills()
  const idx = all.findIndex((b) => b.id === bill.id)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      ...bill,
      amount: Number(bill.amount) || 0,
      dueDay: Number(bill.dueDay) || 1,
      updatedAt: new Date().toISOString(),
    }
    saveArray(BILLS_KEY, all)
  }
}

export function toggleBillStatus(id: string, groupId: string): void {
  const all = getAllBills()
  const idx = all.findIndex((b) => b.id === id && (b.groupId === groupId || !groupId))
  if (idx >= 0) {
    all[idx].status = all[idx].status === 'pagado' ? 'pendiente' : 'pagado'
    if (all[idx].status === 'pagado') {
      all[idx].lastPaidDate = new Date().toISOString().slice(0, 10)
    }
    saveArray(BILLS_KEY, all)
  }
}

export function cancelBillSubscription(id: string, groupId: string): void {
  const all = getAllBills()
  const idx = all.findIndex((b) => b.id === id && (b.groupId === groupId || !groupId))
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      subscriptionStatus: 'cancelada',
      isActive: false,
      updatedAt: new Date().toISOString(),
    }
    saveArray(BILLS_KEY, all)
  }
}

export function reactivateBillSubscription(id: string, groupId: string): void {
  const all = getAllBills()
  const idx = all.findIndex((b) => b.id === id && (b.groupId === groupId || !groupId))
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      subscriptionStatus: 'activa',
      isActive: true,
      updatedAt: new Date().toISOString(),
    }
    saveArray(BILLS_KEY, all)
  }
}

export function pauseBillSubscription(id: string, groupId: string): void {
  const all = getAllBills()
  const idx = all.findIndex((b) => b.id === id && (b.groupId === groupId || !groupId))
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      subscriptionStatus: 'pausada',
      isActive: false,
      updatedAt: new Date().toISOString(),
    }
    saveArray(BILLS_KEY, all)
  }
}

export function deleteBill(id: string, groupId: string): void {
  const all = getAllBills()
  saveArray(BILLS_KEY, all.filter((b) => !(b.id === id && (b.groupId === groupId || !groupId))))
}

/**
 * Generates monthly records for active recurring subscriptions and incomes for the given month (YYYY-MM).
 * Avoids any duplicate entry.
 */
export function processMonthlyRecurringItems(groupId: string, monthISO: string): void {
  if (!groupId || !monthISO || monthISO.length < 7) return
  const yearMonth = monthISO.slice(0, 7)
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (isNaN(year) || isNaN(month)) return

  const daysInMonth = new Date(year, month, 0).getDate()

  // 1. Process active BillSubscriptions (recurring expenses / subscriptions)
  const allBills = getBillsByGroup(groupId)
  const allExpenses = getAllExpenses()
  let expensesUpdated = false

  allBills.forEach((bill) => {
    // Only process if active
    if (bill.subscriptionStatus === 'cancelada' || bill.subscriptionStatus === 'pausada' || bill.isActive === false) {
      return
    }

    // Check if expense already exists for this subscription in this month
    const exists = allExpenses.some(
      (e) =>
        e.groupId === groupId &&
        (e.subscriptionId === bill.id || (e.title.toLowerCase() === bill.name.toLowerCase() && e.isRecurring)) &&
        e.date.startsWith(yearMonth)
    )

    if (!exists) {
      const dueDay = Number(bill.dueDay)
      const dayNum = isNaN(dueDay) ? 1 : Math.min(daysInMonth, Math.max(1, dueDay))
      const dateStr = `${yearMonth}-${dayNum.toString().padStart(2, '0')}`
      const newExpense: Expense = {
        id: `exp_sub_${bill.id}_${yearMonth}`,
        groupId,
        title: bill.name,
        amount: Number(bill.amount) || 0,
        category: bill.category || 'hogar',
        customCategory: bill.customCategory,
        date: dateStr,
        paidByMemberId: bill.paidByMemberId || '',
        paidByMemberIds: bill.paidByMemberIds || (bill.paidByMemberId ? [bill.paidByMemberId] : []),
        isRecurring: true,
        billingDay: dayNum,
        subscriptionId: bill.id,
        createdAt: new Date().toISOString(),
      }
      allExpenses.push(newExpense)
      expensesUpdated = true
    }
  })

  if (expensesUpdated) {
    saveArray(EXPENSES_KEY, allExpenses)
  }

  // 2. Process active recurring Incomes
  const allIncomes = getAllIncomes()
  let incomesUpdated = false
  const templateIncomes = allIncomes.filter(
    (inc) => inc.groupId === groupId && inc.frequency === 'mensual' && inc.status !== 'cancelled'
  )

  // Find unique recurring income templates by title & member
  const processedKeys = new Set<string>()
  templateIncomes.forEach((inc) => {
    const templateKey = `${inc.title.toLowerCase()}_${inc.memberId}`
    if (processedKeys.has(templateKey)) return
    processedKeys.add(templateKey)

    const existsInMonth = allIncomes.some(
      (i) => i.groupId === groupId && i.title.toLowerCase() === inc.title.toLowerCase() && i.date.startsWith(yearMonth)
    )

    if (!existsInMonth) {
      const billingDay = Number(inc.billingDay)
      const dayNum = isNaN(billingDay) ? 1 : Math.min(daysInMonth, Math.max(1, billingDay))
      const dateStr = `${yearMonth}-${dayNum.toString().padStart(2, '0')}`
      const newIncome: Income = {
        id: `inc_rec_${inc.id}_${yearMonth}`,
        groupId,
        memberId: inc.memberId,
        memberIds: inc.memberIds,
        title: inc.title,
        amount: Number(inc.amount) || 0,
        frequency: 'mensual',
        billingDay: dayNum,
        isRecurring: true,
        category: inc.category,
        customCategory: inc.customCategory,
        date: dateStr,
        createdAt: new Date().toISOString(),
      }
      allIncomes.push(newIncome)
      incomesUpdated = true
    }
  })

  if (incomesUpdated) {
    saveArray(INCOMES_KEY, allIncomes)
  }
}

// Budgets
export function getAllBudgets(): Budget[] {
  return loadArray<Budget>(BUDGETS_KEY)
}

export function getBudgetsByGroup(groupId: string): Budget[] {
  return getAllBudgets().filter((item) => item.groupId === groupId)
}

export function saveBudget(groupId: string, category: string, monthlyLimit: number): void {
  const all = getAllBudgets()
  const idx = all.findIndex((b) => b.groupId === groupId && b.category === category)
  if (idx >= 0) {
    all[idx].monthlyLimit = monthlyLimit
  } else {
    all.push({
      id: `budget_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      groupId,
      category: category as any,
      monthlyLimit,
    })
  }
  saveArray(BUDGETS_KEY, all)
}

export function deleteBudget(id: string, groupId: string): void {
  const all = getAllBudgets()
  saveArray(BUDGETS_KEY, all.filter((b) => !(b.id === id && b.groupId === groupId)))
}

// Piggy Bank / Hucha Base Balance
const PIGGY_BANK_KEY = 'usytask_piggy_bank'

export function getPiggyBankBalance(groupId: string): number {
  const all = loadArray<PiggyBankConfig>(PIGGY_BANK_KEY)
  const found = all.find((p) => p.groupId === groupId)
  return found ? found.initialBalance : 0
}

export function savePiggyBankBalance(groupId: string, initialBalance: number): void {
  const all = loadArray<PiggyBankConfig>(PIGGY_BANK_KEY)
  const idx = all.findIndex((p) => p.groupId === groupId)
  if (idx >= 0) {
    all[idx].initialBalance = initialBalance
    all[idx].updatedAt = new Date().toISOString()
  } else {
    all.push({ groupId, initialBalance, updatedAt: new Date().toISOString() })
  }
  saveArray(PIGGY_BANK_KEY, all)
}
