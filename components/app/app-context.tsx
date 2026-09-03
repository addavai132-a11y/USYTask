import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import type { Group, Task, CalendarEvent, Reminder, Member, GroupType, EventCategory, TaskSection, TaskPriority, Activity, AppNotification, TaskCategory, EventPoll, DailyMenu, WeeklyMenu, Income, Expense, BillSubscription, Budget } from '@/types'
import { MEMBER_COLORS } from '@/types'

export interface ConfirmDeleteOptions {
  title?: string
  description?: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
}
import {
  getAllGroups,
  getActiveGroup,
  getActiveGroupId,
  setActiveGroupId,
  createGroup as createGroupStore,
  ensureDefaultGroup,
  updateGroupName,
  deleteGroup as deleteGroupStore,
  saveAllGroups,
} from '@/lib/group-store'
import {
  ensureOwnerMember,
  addMember as addMemberStore,
  addTask as addTaskStore,
  updateTask as updateTaskStore,
  toggleTask as toggleTaskStore,
  deleteTask as deleteTaskStore,
  addEvent as addEventStore,
  updateEvent as updateEventStore,
  deleteEvent as deleteEventStore,
  addReminder as addReminderStore,
  updateReminder as updateReminderStore,
  deleteReminder as deleteReminderStore,
  addActivity as addActivityStore,
  addNotification as addNotificationStore,
  markNotificationAsRead as markNotificationAsReadStore,
  markAllNotificationsAsReadByGroup as markAllNotificationsAsReadByGroupStore,
  deleteNotification as deleteNotificationStore,
  clearNotificationsByGroup as clearNotificationsByGroupStore,
  getTasksByGroup,
  getEventsByGroup,
  getRemindersByGroup,
  getMembersByGroup,
  getActivitiesByGroup,
  getNotificationsByGroup,
  getMemberById as getMemberByIdStore,
  getShoppingListsByGroup,
  getShoppingItemsByGroup,
  addShoppingList as addShoppingListStore,
  updateShoppingList as updateShoppingListStore,
  deleteShoppingList as deleteShoppingListStore,
  addShoppingItem as addShoppingItemStore,
  toggleShoppingItem as toggleShoppingItemStore,
  deleteShoppingItem as deleteShoppingItemStore,
  getTaskCategoriesByGroup,
  addTaskCategory as addTaskCategoryStore,
  deleteTaskCategory as deleteTaskCategoryStore,
  getEventPollsByGroup,
  addEventPoll as addEventPollStore,
  voteEventPoll as voteEventPollStore,
  closeEventPoll as closeEventPollStore,
  deleteEventPoll as deleteEventPollStore,
  getDailyMenusByGroup,
  getWeeklyMenusByGroup,
  addDailyMenu as addDailyMenuStore,
  updateDailyMenu as updateDailyMenuStore,
  deleteDailyMenu as deleteDailyMenuStore,
  addWeeklyMenu as addWeeklyMenuStore,
  updateWeeklyMenu as updateWeeklyMenuStore,
  deleteWeeklyMenu as deleteWeeklyMenuStore,
  getIncomesByGroup,
  getExpensesByGroup,
  getBillsByGroup,
  getBudgetsByGroup,
  addIncome as addIncomeStore,
  updateIncome as updateIncomeStore,
  deleteIncome as deleteIncomeStore,
  addExpense as addExpenseStore,
  updateExpense as updateExpenseStore,
  deleteExpense as deleteExpenseStore,
  addBill as addBillStore,
  updateBill as updateBillStore,
  deleteBill as deleteBillStore,
  toggleBillStatus as toggleBillStatusStore,
  cancelBillSubscription as cancelBillSubscriptionStore,
  reactivateBillSubscription as reactivateBillSubscriptionStore,
  pauseBillSubscription as pauseBillSubscriptionStore,
  processMonthlyRecurringItems,
  saveBudget as saveBudgetStore,
  deleteBudget as deleteBudgetStore,
  getPiggyBankBalance,
  savePiggyBankBalance,
  updateMemberInStore,
  adjustMemberPointsInStore,
  type ShoppingList,
  type ShoppingItem,
} from '@/lib/data-store'
import { syncFromSupabaseCloud, scheduleCloudSync } from '@/lib/cloud-sync'
import type { FamilyChallenge, FamilyReward, FamilyMemory, FamilyAchievement } from '@/types'
import {
  getChallengesByGroup,
  addChallenge as addChallengeStore,
  updateChallenge as updateChallengeStore,
  deleteChallenge as deleteChallengeStore,
  adjustChallengeDays as adjustChallengeDaysStore,
  getRewardsByGroup,
  addReward as addRewardStore,
  updateReward as updateRewardStore,
  deleteReward as deleteRewardStore,
  claimReward as claimRewardStore,
  getMemoriesByGroup,
  addMemory as addMemoryStore,
  updateMemory as updateMemoryStore,
  deleteMemory as deleteMemoryStore,
  computeAchievementsForGroup,
  updateMemberProfile as updateMemberProfileStore,
  adjustMemberPoints as adjustMemberPointsStore,
} from '@/lib/family-store'
import { getStoredSession } from '@/lib/user-session'
import { getTodayISO } from '@/lib/date-utils'
import { deleteMemoryImage } from '@/lib/storage'
import {
  notifyEventReminder,
  notifyReminderDue,
  notifyTaskDue,
} from '@/lib/notification-triggers'
import { checkProximityAndRecurringAlerts } from '@/lib/notification-dispatcher'

export type Tab = 'inicio' | 'organizar' | 'hogar' | 'fitness' | 'familia' | 'perfil'
export type AddTab = 'tarea' | 'evento' | 'recordatorio' | 'miembro'

interface AppState {
  tab: Tab
  setTab: (t: Tab) => void
  quickAddOpen: boolean
  quickAddTab: AddTab
  quickAddHideTabs: boolean
  quickAddDefaultSection?: string
  openQuickAdd: (tab?: AddTab, options?: { hideTabs?: boolean; defaultSection?: string; defaultDate?: string }) => void
  quickAddDefaultDate?: string
  closeQuickAdd: () => void
  notificationsOpen: boolean
  setNotificationsOpen: (v: boolean) => void
  interactions: number
  bump: () => void

  // User
  userName: string

  // Multi-group state
  activeGroup: Group | null
  groups: Group[]
  switchGroup: (groupId: string) => void
  createGroup: (name: string, type: GroupType, role?: string, customCode?: string) => Group
  deleteGroup: (groupId: string) => void
  updateGroupName: (groupId: string, newName: string) => void
  groupSelectorOpen: boolean
  openGroupSelector: () => void
  closeGroupSelector: () => void
  createGroupModalOpen: boolean
  openCreateGroupModal: () => void
  closeCreateGroupModal: () => void
  historyOpen: boolean
  openHistory: () => void
  closeHistory: () => void
  refreshData: () => void

  // Data for active group
  currentMember: Member | null
  members: Member[]
  tasks: Task[]
  events: CalendarEvent[]
  reminders: Reminder[]
  activities: Activity[]
  notifications: AppNotification[]

  archivedTasks: Task[]
  archivedEvents: CalendarEvent[]
  archivedReminders: Reminder[]

  // Shopping
  shoppingLists: ShoppingList[]
  shoppingItems: ShoppingItem[]

  // Custom Task Categories
  taskCategories: TaskCategory[]

  // Data mutations
  addTaskCategory: (name: string, memberIds: string[]) => void
  deleteTaskCategory: (categoryId: string) => void
  addTask: (title: string, points: number, assignedToMemberId: string, section?: TaskSection, priority?: TaskPriority, dueDate?: string, dueTime?: string, assignedMemberIds?: string[], doBeforeDate?: string, doBeforeTime?: string) => void
  updateTask: (task: Task) => void
  toggleTask: (taskId: string) => { pointsAwarded: number; memberId: string | null }
  addEvent: (title: string, date: string, time: string | undefined, category: EventCategory, assignedMemberIds: string[], location?: string) => void
  updateEvent: (event: CalendarEvent) => void
  deleteEvent: (eventId: string) => void
  addReminder: (title: string, dueDate: string, assignedMemberIds?: string[], time?: string) => void
  updateReminder: (reminder: Reminder) => void
  deleteReminder: (reminderId: string) => void
  addMember: (name: string, colorIdx: number) => void
  getMemberById: (memberId: string) => Member | null
  dismissNotification: (id: string) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  clearNotifications: () => void
  addShoppingList: (name: string) => void
  updateShoppingList: (listId: string, name: string) => void
  deleteShoppingList: (listId: string) => void
  addShoppingItem: (
    name: string,
    listId: string,
    options?: { price?: number; unitPrice?: number; quantity?: number; aisle?: string; supermarket?: string }
  ) => void
  toggleShoppingItem: (itemId: string) => void
  deleteShoppingItem: (itemId: string) => void

  // Event Polls
  eventPolls: EventPoll[]
  addEventPoll: (
    title: string,
    category: EventCategory,
    options: { title: string; date?: string; time?: string }[],
    participantMemberIds: string[],
    location?: string,
    description?: string,
    pollType?: 'event' | 'general',
    allowMultipleVotes?: boolean,
    closeDate?: string
  ) => void
  voteEventPoll: (pollId: string, optionId: string) => void
  closeEventPoll: (pollId: string) => void
  deleteEventPoll: (pollId: string) => void

  // Daily & Weekly Menus
  dailyMenus: DailyMenu[]
  weeklyMenus: WeeklyMenu[]
  addDailyMenu: (menu: Omit<DailyMenu, 'id' | 'groupId'>) => void
  updateDailyMenu: (menu: DailyMenu) => void
  deleteDailyMenu: (id: string) => void
  duplicateDailyMenu: (id: string) => void
  addWeeklyMenu: (menu: Omit<WeeklyMenu, 'id' | 'groupId'>) => void
  updateWeeklyMenu: (menu: WeeklyMenu) => void
  deleteWeeklyMenu: (id: string) => void
  duplicateWeeklyMenu: (id: string) => void
  addIngredientsToShoppingList: (ingredients: string[]) => void

  // Finances
  incomes: Income[]
  expenses: Expense[]
  bills: BillSubscription[]
  budgets: Budget[]
  addIncome: (income: Omit<Income, 'id' | 'groupId'>) => void
  updateIncome: (income: Income) => void
  deleteIncome: (id: string) => void
  addExpense: (expense: Omit<Expense, 'id' | 'groupId'>) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  addBill: (bill: Omit<BillSubscription, 'id' | 'groupId'>) => void
  updateBill: (bill: BillSubscription) => void
  deleteBill: (id: string) => void
  toggleBillStatus: (id: string) => void
  cancelBillSubscription: (id: string) => void
  reactivateBillSubscription: (id: string) => void
  pauseBillSubscription: (id: string) => void
  saveBudget: (category: string, monthlyLimit: number) => void
  deleteBudget: (id: string) => void

  // Month Navigation & Hucha / Piggy Bank
  selectedMonthISO: string
  setSelectedMonthISO: (monthISO: string) => void
  initialPiggyBankBalance: number
  saveInitialPiggyBankBalance: (amount: number) => void

  // Family Suite
  familyChallenges: FamilyChallenge[]
  archivedFamilyChallenges: FamilyChallenge[]
  familyRewards: FamilyReward[]
  familyMemories: FamilyMemory[]
  familyAchievements: FamilyAchievement[]
  addFamilyChallenge: (challenge: Omit<FamilyChallenge, 'id' | 'groupId'>) => void
  updateFamilyChallenge: (challenge: FamilyChallenge) => void
  deleteFamilyChallenge: (id: string) => void
  checkInFamilyChallenge: (id: string) => { completedNow: boolean; pointsAwarded: number; alreadyDoneToday?: boolean }
  adjustFamilyChallengeDays: (id: string, delta: number) => { completedNow: boolean; pointsAwarded: number; alreadyDoneToday?: boolean }
  addFamilyReward: (reward: Omit<FamilyReward, 'id' | 'groupId'>) => void
  updateFamilyReward: (reward: FamilyReward) => void
  deleteFamilyReward: (id: string) => void
  claimFamilyReward: (rewardId: string, memberId: string) => { success: boolean; error?: string }
  addFamilyMemory: (memory: Omit<FamilyMemory, 'id' | 'groupId'>) => void
  updateFamilyMemory: (memory: FamilyMemory) => void
  deleteFamilyMemory: (id: string) => void
  updateMember: (memberId: string, updates: Partial<Member>) => void
  adjustMemberPoints: (memberId: string, pointsDelta: number, reason?: string) => void

  // Global Confirmation Dialog
  confirmDelete: (options: ConfirmDeleteOptions) => void
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [tab, setTabState] = useState<Tab>('inicio')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddTab, setQuickAddTab] = useState<AddTab>('tarea')
  const [quickAddHideTabs, setQuickAddHideTabs] = useState(false)
  const [quickAddDefaultSection, setQuickAddDefaultSection] = useState<string | undefined>(undefined)
  const [quickAddDefaultDate, setQuickAddDefaultDate] = useState<string | undefined>(undefined)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [interactions, setInteractions] = useState(0)

  // Global Confirm Delete Modal State
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean
    title?: string
    description?: string
    itemName?: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    onConfirm: () => {},
  })

  const confirmDelete = useCallback((options: ConfirmDeleteOptions) => {
    setConfirmModalState({
      isOpen: true,
      title: options.title,
      description: options.description,
      itemName: options.itemName,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      isDestructive: options.isDestructive ?? true,
      onConfirm: options.onConfirm,
    })
  }, [])

  const handleOpenQuickAdd = (targetTab: AddTab = 'tarea', options?: { hideTabs?: boolean; defaultSection?: string; defaultDate?: string }) => {
    setQuickAddTab(targetTab)
    setQuickAddHideTabs(options?.hideTabs ?? false)
    setQuickAddDefaultSection(options?.defaultSection)
    setQuickAddDefaultDate(options?.defaultDate)
    setQuickAddOpen(true)
  }

  const handleCloseQuickAdd = () => {
    setQuickAddOpen(false)
    setQuickAddHideTabs(false)
    setQuickAddDefaultSection(undefined)
    setQuickAddDefaultDate(undefined)
  }

  // User name
  const session = typeof window !== 'undefined' ? getStoredSession() : null
  const userName = session?.fullName || session?.username || 'Usuario'

  // Groups state
  const [groups, setGroupsState] = useState<Group[]>([])
  const [activeGroup, setActiveGroupState] = useState<Group | null>(null)
  const [groupSelectorOpen, setGroupSelectorOpen] = useState(false)
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Data for active group
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [archivedEvents, setArchivedEvents] = useState<CalendarEvent[]>([])
  const [archivedReminders, setArchivedReminders] = useState<Reminder[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([])
  const [eventPolls, setEventPolls] = useState<EventPoll[]>([])
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([])
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [bills, setBills] = useState<BillSubscription[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedMonthISO, setSelectedMonthISO] = useState<string>(getTodayISO().slice(0, 7))
  const [initialPiggyBankBalance, setInitialPiggyBankBalance] = useState<number>(0)

  // Family Suite state
  const [familyChallenges, setFamilyChallenges] = useState<FamilyChallenge[]>([])
  const [archivedFamilyChallenges, setArchivedFamilyChallenges] = useState<FamilyChallenge[]>([])
  const [familyRewards, setFamilyRewards] = useState<FamilyReward[]>([])
  const [familyMemories, setFamilyMemories] = useState<FamilyMemory[]>([])
  const [familyAchievements, setFamilyAchievements] = useState<FamilyAchievement[]>([])

  const refreshData = useCallback(() => {
    const allGroups = getAllGroups()
    setGroupsState(allGroups)

    const active = getActiveGroup()
    setActiveGroupState(active)

    if (active) {
      const activeMembers = getMembersByGroup(active.id)
      setMembers(activeMembers)
      const cMember = activeMembers.find((m) => m.name === userName) || activeMembers[0] || null
      setCurrentMember(cMember)
      setActivities(getActivitiesByGroup(active.id))
      setShoppingLists(getShoppingListsByGroup(active.id))
      setShoppingItems(getShoppingItemsByGroup(active.id))
      setTaskCategories(getTaskCategoriesByGroup(active.id))
      setEventPolls(getEventPollsByGroup(active.id))
      setDailyMenus(getDailyMenusByGroup(active.id))
      setWeeklyMenus(getWeeklyMenusByGroup(active.id))
      processMonthlyRecurringItems(active.id, selectedMonthISO)
      // Run proximity alerts first (may write new notifications), THEN read notifications
      try { checkProximityAndRecurringAlerts(active.id, activeMembers) } catch (e) { console.warn('[refreshData] proximity alerts error:', e) }
      setIncomes(getIncomesByGroup(active.id))
      setExpenses(getExpensesByGroup(active.id))
      setBills(getBillsByGroup(active.id))
      setBudgets(getBudgetsByGroup(active.id))
      // Read notifications ONCE, after proximity alerts may have written new ones
      setNotifications(getNotificationsByGroup(active.id))
      setInitialPiggyBankBalance(getPiggyBankBalance(active.id))

      const THIRTY_MINS = 30 * 60 * 1000
      const now = Date.now()

      // Retos Familiares: Archivar si pasaron 30 min tras completarse
      const allChals = getChallengesByGroup(active.id)
      const aChals: FamilyChallenge[] = []
      const cChals: FamilyChallenge[] = []
      for (const c of allChals) {
        const isCompletedBy30Mins = !!(
          c.status === 'completado' &&
          c.completedAt &&
          now - new Date(c.completedAt).getTime() > THIRTY_MINS
        )
        if (isCompletedBy30Mins) {
          aChals.push(c)
        } else {
          cChals.push(c)
        }
      }
      setFamilyChallenges(cChals)
      setArchivedFamilyChallenges(aChals)

      const rews = getRewardsByGroup(active.id)
      setFamilyRewards(rews)
      const mems = getMemoriesByGroup(active.id)
      setFamilyMemories(mems)
      const allTasksForGroup = getTasksByGroup(active.id)
      const achs = computeAchievementsForGroup(activeMembers, allTasksForGroup, allChals, rews, mems)
      setFamilyAchievements(achs)

      // 1. Tareas: Archivar si pasaron 30 min desde completada O 30 min desde hora límite vencida
      const allTasks = getTasksByGroup(active.id)
      const aTasks: Task[] = []
      const cTasks: Task[] = [] // activas
      for (const t of allTasks) {
        let isPastDueBy30Mins = false
        if (t.dueDate) {
          const timeStr = t.dueTime || '23:59:59'
          const taskDeadline = new Date(`${t.dueDate}T${timeStr}`).getTime()
          if (!isNaN(taskDeadline) && now - taskDeadline > THIRTY_MINS) {
            isPastDueBy30Mins = true
          }
        }

        const isCompletedBy30Mins = !!(
          t.completed &&
          t.completedAt &&
          now - new Date(t.completedAt).getTime() > THIRTY_MINS
        )

        if (isCompletedBy30Mins || isPastDueBy30Mins) {
          aTasks.push(t)
        } else {
          cTasks.push(t)
        }
      }
      setTasks(cTasks)
      setArchivedTasks(aTasks)

      // 2. Eventos: Archivar automáticamente cuando pase su hora programada O si fue marcado como completado
      const allEvents = getEventsByGroup(active.id)
      const aEvents: CalendarEvent[] = []
      const cEvents: CalendarEvent[] = []
      for (const e of allEvents) {
        // Si el evento tiene hora específica (ej. 14:30), expira cuando pase esa hora.
        // Si no tiene hora específica, expira al finalizar el día (23:59:59).
        const timeStr = e.time ? (e.time.length === 5 ? `${e.time}:00` : e.time) : '23:59:59'
        const eventTime = new Date(`${e.date}T${timeStr}`).getTime()
        const isPastDue = !isNaN(eventTime) && now >= eventTime
        const isCompleted = !!(e as any).completed

        if (isCompleted || isPastDue) {
          aEvents.push(e)
        } else {
          cEvents.push(e)
        }
      }
      setEvents(cEvents)
      setArchivedEvents(aEvents)

      // 3. Recordatorios: Archivar automáticamente cuando pase su fecha/hora límite O si fue marcado como completado
      const allReminders = getRemindersByGroup(active.id)
      const aReminders: Reminder[] = []
      const cReminders: Reminder[] = []
      for (const r of allReminders) {
        // Si tiene hora específica (ej. 09:00), expira cuando pase esa hora.
        // Si no tiene hora específica, expira al finalizar el día (23:59:59).
        const timeStr = r.time ? (r.time.length === 5 ? `${r.time}:00` : r.time) : '23:59:59'
        const reminderTime = new Date(`${r.dueDate}T${timeStr}`).getTime()
        const isPastDue = !isNaN(reminderTime) && now >= reminderTime
        const isCompleted = !!(r as any).completed

        if (isCompleted || isPastDue) {
          aReminders.push(r)
        } else {
          cReminders.push(r)
        }
      }
      setReminders(cReminders)
      setArchivedReminders(aReminders)
    } else {
      setMembers([])
      setCurrentMember(null)
      setTasks([])
      setArchivedTasks([])
      setEvents([])
      setArchivedEvents([])
      setReminders([])
      setArchivedReminders([])
      setActivities([])
      setNotifications([])
      setShoppingLists([])
      setShoppingItems([])
      setTaskCategories([])
      setEventPolls([])
      setDailyMenus([])
      setWeeklyMenus([])
      setIncomes([])
      setExpenses([])
      setBills([])
      setBudgets([])
      setFamilyChallenges([])
      setFamilyRewards([])
      setFamilyMemories([])
      setFamilyAchievements([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  // Initialize on mount: pull data from Supabase cloud first
  useEffect(() => {
    async function initCloudAndData() {
      try {
        await syncFromSupabaseCloud()
        const group = ensureDefaultGroup(userName)
        if (group?.id) {
          ensureOwnerMember(group.id, userName)
        }
        refreshData()
      } catch (err) {
        console.error('Data initialization caught error, falling back to local store:', err)
        try {
          const group = ensureDefaultGroup(userName)
          if (group?.id) ensureOwnerMember(group.id, userName)
          refreshData()
        } catch (fallbackErr) {
          console.error('Fallback initialization error:', fallbackErr)
        }
      } finally {
        setIsInitialized(true)
      }
    }
    initCloudAndData()
  }, [userName, refreshData])

  // Listen for group change events and periodic auto-archive ticker
  useEffect(() => {
    const handler = () => refreshData()
    window.addEventListener('usytask_group_change', handler)

    // Re-evaluate auto-archive expiration every 30s
    const ticker = setInterval(() => {
      refreshData()
    }, 30000)

    return () => {
      window.removeEventListener('usytask_group_change', handler)
      clearInterval(ticker)
    }
  }, [refreshData])

  // Tab navigation history & root boundary anchor
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Read initial tab from URL search params if provided (e.g. ?tab=fitness)
    const urlParams = new URLSearchParams(window.location.search)
    const initialTabParam = urlParams.get('tab') as Tab | null
    if (initialTabParam && ['inicio', 'organizar', 'hogar', 'fitness', 'familia', 'perfil'].includes(initialTabParam)) {
      setTabState(initialTabParam)
      window.history.replaceState({ usyTab: initialTabParam, usyRoot: true }, '', `/app?tab=${initialTabParam}`)
    } else {
      window.history.replaceState({ usyTab: 'inicio', usyRoot: true }, '', '/app')
    }

    // Push anchor state to capture Back button on main tabs
    window.history.pushState({ usyTab: 'inicio', usyRoot: true }, '', window.location.href)

    const handlePopState = (event: PopStateEvent) => {
      // If a modal interceptor handled this popstate (usyModal), ignore here
      if (event.state?.usyModal) return

      // In main tabs (Inicio, Organizar, Hogar, Fitness, Familia, Perfil),
      // the Back button does nothing and prevents exiting the app or returning to login
      window.history.pushState({ usyTab: tab, usyRoot: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [tab])

  const bump = () => setInteractions((n) => n + 1)

  const setTab = (t: Tab) => {
    if (typeof window !== 'undefined') {
      // Flatten history between main tabs using replaceState
      if (t === 'inicio') {
        window.history.replaceState({ usyTab: 'inicio', usyRoot: true }, '', '/app')
      } else {
        window.history.replaceState({ usyTab: t, usyRoot: true }, '', `/app?tab=${t}`)
      }
      window.scrollTo({ top: 0 })
    }
    setTabState(t)
    bump()
  }

  const switchGroup = (groupId: string) => {
    setActiveGroupId(groupId)
    refreshData()
    setGroupSelectorOpen(false)
  }

  const handleCreateGroup = (name: string, type: GroupType, role?: string, customCode?: string): Group => {
    const newGroup = createGroupStore(name, type, customCode)
    ensureOwnerMember(newGroup.id, userName, role)
    refreshData()
    setCreateGroupModalOpen(false)
    return newGroup
  }

  const handleDeleteGroup = (groupId: string) => {
    deleteGroupStore(groupId)
    refreshData()
  }

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    updateGroupName(groupId, newName)
    refreshData()
  }

  // --- Data mutations ---
  const handleAddTask = (
    title: string,
    points: number,
    assignedToMemberId: string,
    section: TaskSection = 'familia',
    priority: TaskPriority = 'medium',
    dueDate?: string,
    dueTime?: string,
    assignedMemberIds?: string[],
    doBeforeDate?: string,
    doBeforeTime?: string
  ) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    // Current user's member in this group
    const groupMembers = getMembersByGroup(activeGroup.id)
    const actingMember =
      groupMembers.find((m) => m.name === userName) ||
      groupMembers[0] ||
      { id: currentMember?.id || 'usr_default', name: userName || 'Usuario' }

    const safePoints = Math.max(10, Number(points) || 10)

    const task: Task = {
      id: uniqueId,
      title,
      points: safePoints,
      assignedToMemberId,
      assignedMemberIds: assignedMemberIds && assignedMemberIds.length > 0 ? assignedMemberIds : [assignedToMemberId],
      completed: false,
      groupId: activeGroup.id,
      section,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      doBeforeDate: doBeforeDate || undefined,
      doBeforeTime: doBeforeTime || undefined,
      createdBy: currentMember?.id || actingMember.id,
    }
    addTaskStore(task)

    try {
      addActivity({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: activeGroup.id,
        type: 'task_created',
        title: task.title,
        details: `+${task.points} ⭐`,
        memberId: actingMember.id,
        timestamp: new Date().toISOString(),
      })

      // Notificación al integrante asignado si es diferente del creador
      const creatorName = actingMember.name || 'Alguien'
      const assignedIds = task.assignedMemberIds || (task.assignedToMemberId ? [task.assignedToMemberId] : [])
      const targetMemberIds = assignedIds.filter((id) => id !== actingMember.id)

      if (targetMemberIds.length > 0) {
        addNotificationStore({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          groupId: activeGroup.id,
          recipientMemberId: targetMemberIds[0],
          type: 'task',
          title: 'Nueva tarea asignada',
          body: `${creatorName} te ha asignado la tarea: "${task.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/app?tab=organizar',
          data: { taskId: task.id, tab: 'organizar', subTab: 'tareas' },
          colorVar: 'var(--primary)',
        })

        if (typeof window !== 'undefined') {
          fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: activeGroup.id,
              title: 'Nueva tarea asignada',
              body: `${creatorName} te ha asignado la tarea: "${task.title}"`,
              url: '/app?tab=organizar',
              data: { type: 'organizacion_events', taskId: task.id },
            }),
          }).catch((err) => console.warn('Push dispatch error:', err))
        }
      }

      notifyTaskDue({
        taskTitle: task.title,
      }).catch(() => {})
    } catch (e) {
      console.warn('Activity/Notification creation warning:', e)
    }

    refreshData()
    bump()
  }

  const handleToggleTask = (taskId: string) => {
    if (!activeGroup) return { pointsAwarded: 0, memberId: null, error: 'No active group' }
    const existingTask = getTasksByGroup(activeGroup.id).find((t) => t.id === taskId)
    if (!existingTask) return { pointsAwarded: 0, memberId: null, error: 'Tarea no encontrada' }
    if (existingTask.completed) {
      return { pointsAwarded: 0, memberId: null }
    }

    // Comprobación de permisos: solo la persona asignada puede marcar la tarea como completada
    if (currentMember) {
      const assignedIds = existingTask.assignedMemberIds && existingTask.assignedMemberIds.length > 0
        ? existingTask.assignedMemberIds
        : existingTask.assignedToMemberId
        ? [existingTask.assignedToMemberId]
        : []

      const isAssigned = assignedIds.includes(currentMember.id)
      if (!isAssigned) {
        toast('Solo la persona asignada a esta tarea puede marcarla como completada', '🔒')
        return { pointsAwarded: 0, memberId: null, error: 'unauthorized' }
      }
    }

    const result = toggleTaskStore(taskId, activeGroup.id)
    
    if (result.pointsAwarded > 0 && result.memberId) {
      const task = getTasksByGroup(activeGroup.id).find(t => t.id === taskId)
      if (task) {
        const completedByMember = getMemberByIdStore(result.memberId, activeGroup.id)
        try {
          addActivityStore({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            groupId: activeGroup.id,
            type: 'task_completed',
            title: task.title,
            memberId: result.memberId,
            timestamp: new Date().toISOString(),
            points: result.pointsAwarded,
          })
          
          addNotificationStore({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            groupId: activeGroup.id,
            type: 'task',
            title: 'Tarea completada',
            body: `${completedByMember?.name || 'Alguien'} completó "${task.title}" (+${result.pointsAwarded} ⭐)`,
            timestamp: new Date().toISOString(),
            colorVar: 'var(--emerald-500)',
          })
        } catch (e) {
          console.warn('Activity/Notification creation warning:', e)
        }
      }
    }

    refreshData()
    bump()
    return result
  }

  const handleUpdateTask = (task: Task) => {
    if (!activeGroup) return
    updateTaskStore(task)
    refreshData()
    bump()
  }

  const handleDeleteTask = (taskId: string) => {
    if (!activeGroup) return
    deleteTaskStore(taskId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddEvent = (
    title: string,
    date: string,
    time: string | undefined,
    category: EventCategory,
    assignedMemberIds: string[],
    location?: string
  ) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const event: CalendarEvent = {
      id: uniqueId,
      title,
      time: time || undefined,
      date: date || getTodayISO(),
      category,
      assignedMemberIds,
      assignedToMemberId: assignedMemberIds[0] || '',
      groupId: activeGroup.id,
      location,
    }
    addEventStore(event)

    const groupMembers = getMembersByGroup(activeGroup.id)
    const actingMember =
      groupMembers.find((m) => m.name === userName) ||
      groupMembers[0] ||
      { id: currentMember?.id || 'usr_default', name: userName || 'Usuario' }

    try {
      addActivity({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: activeGroup.id,
        type: 'event_created',
        title: event.title,
        details: time ? `${date || getTodayISO()} · ${time}` : `${date || getTodayISO()}`,
        memberId: actingMember.id,
        timestamp: new Date().toISOString(),
      })

      // Notificación en tiempo real a integrantes asignados
      const creatorName = actingMember.name || 'Alguien'
      const targetEventMemberIds = (assignedMemberIds || []).filter((id) => id !== actingMember.id)
      if (targetEventMemberIds.length > 0) {
        addNotificationStore({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          groupId: activeGroup.id,
          recipientMemberId: targetEventMemberIds[0],
          type: 'event',
          title: 'Nuevo evento asignado',
          body: `${creatorName} te ha asignado el evento: "${event.title}" (${date}${time ? ' ' + time : ''})`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/app?tab=organizar',
          data: { eventId: event.id, tab: 'organizar', subTab: 'calendario' },
          colorVar: 'var(--purple-500)',
        })

        if (typeof window !== 'undefined') {
          fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: activeGroup.id,
              title: 'Nuevo evento asignado',
              body: `${creatorName} te ha asignado el evento: "${event.title}"`,
              url: '/app?tab=organizar',
              data: { type: 'organizacion_events', eventId: event.id },
            }),
          }).catch((err) => console.warn('Push error:', err))
        }
      }

      if (event.time) {
        notifyEventReminder({
          eventTitle: event.title,
          timeStr: event.time,
        }).catch(() => {})
      }
    } catch (e) {
      console.warn('Activity/Notification creation warning:', e)
    }

    refreshData()
    bump()
  }

  const handleUpdateEvent = (event: CalendarEvent) => {
    if (!activeGroup) return
    updateEventStore(event)
    refreshData()
    bump()
  }

  const handleDeleteEvent = (eventId: string) => {
    if (!activeGroup) return
    deleteEventStore(eventId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddReminder = (
    title: string,
    dueDate: string,
    assignedMemberIds: string[] = [],
    time?: string
  ) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const reminder: Reminder = {
      id: uniqueId,
      title,
      dueDate,
      time: time || undefined,
      daysLeft: 0, // will be computed on read
      groupId: activeGroup.id,
      assignedMemberIds,
      assignedToMemberId: assignedMemberIds[0] || undefined,
    }
    addReminderStore(reminder)

    const groupMembers = getMembersByGroup(activeGroup.id)
    const actingMember =
      groupMembers.find((m) => m.name === userName) ||
      groupMembers[0] ||
      { id: currentMember?.id || 'usr_default', name: userName || 'Usuario' }

    try {
      addActivity({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: activeGroup.id,
        type: 'reminder_created',
        title: reminder.title,
        memberId: actingMember.id,
        timestamp: new Date().toISOString(),
      })

      // Notificación en tiempo real para recordatorios asignados
      const creatorName = actingMember.name || 'Alguien'
      const targetReminderMemberIds = (assignedMemberIds || []).filter((id) => id !== actingMember.id)
      if (targetReminderMemberIds.length > 0) {
        addNotificationStore({
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          groupId: activeGroup.id,
          recipientMemberId: targetReminderMemberIds[0],
          type: 'reminder',
          title: 'Nuevo recordatorio asignado',
          body: `${creatorName} te ha asignado un recordatorio: "${reminder.title}"`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: '/app?tab=organizar',
          data: { reminderId: reminder.id, tab: 'organizar', subTab: 'recordatorios' },
          colorVar: 'var(--rose-500)',
        })

        if (typeof window !== 'undefined') {
          fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              groupId: activeGroup.id,
              title: 'Nuevo recordatorio asignado',
              body: `${creatorName} te ha asignado un recordatorio: "${reminder.title}"`,
              url: '/app?tab=organizar',
              data: { type: 'organizacion_events', reminderId: reminder.id },
            }),
          }).catch((err) => console.warn('Push error:', err))
        }
      }

      notifyReminderDue({
        reminderTitle: reminder.title,
        dueStr: reminder.dueDate,
      }).catch(() => {})
    } catch (e) {
      console.warn('Activity/Notification creation warning:', e)
    }

    refreshData()
    bump()
  }

  const handleUpdateReminder = (reminder: Reminder) => {
    if (!activeGroup) return
    updateReminderStore(reminder)
    refreshData()
    bump()
  }

  const handleDeleteReminder = (reminderId: string) => {
    if (!activeGroup) return
    deleteReminderStore(reminderId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddMember = (name: string, colorIdx: number) => {
    if (!activeGroup) return
    const color = MEMBER_COLORS[colorIdx % MEMBER_COLORS.length]
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    const member: Member = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      role: 'adult',      // Required field in Member interface
      initials,
      colorVar: color.var,
      avatarColor: color.value,
      points: 0,
      streak: 0,
      groupId: activeGroup.id,
    }
    addMemberStore(member)
    refreshData()
    bump()
  }

  const handleGetMemberById = (memberId: string): Member | null => {
    if (!activeGroup) return null
    return getMemberByIdStore(memberId, activeGroup.id)
  }

  const dismissNotification = (id: string) => {
    deleteNotificationStore(id)
    refreshData()
  }

  const markNotificationAsRead = (id: string) => {
    markNotificationAsReadStore(id)
    refreshData()
  }

  const markAllNotificationsAsRead = () => {
    if (!activeGroup) return
    markAllNotificationsAsReadByGroupStore(activeGroup.id)
    refreshData()
  }

  const clearNotifications = () => {
    if (!activeGroup) return
    clearNotificationsByGroupStore(activeGroup.id)
    refreshData()
  }

  // --- Shopping mutations ---
  const handleAddShoppingList = (name: string) => {
    if (!activeGroup) return
    const list: ShoppingList = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `list_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      groupId: activeGroup.id,
    }
    addShoppingListStore(list)
    refreshData()
    bump()
  }

  const handleUpdateShoppingList = (listId: string, name: string) => {
    if (!activeGroup) return
    updateShoppingListStore(listId, name, activeGroup.id)
    refreshData()
    bump()
  }

  const handleDeleteShoppingList = (listId: string) => {
    if (!activeGroup) return
    deleteShoppingListStore(listId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddShoppingItem = (
    name: string,
    listId: string,
    options?: { price?: number; unitPrice?: number; quantity?: number; aisle?: string; supermarket?: string }
  ) => {
    if (!activeGroup) return
    const item: ShoppingItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      completed: false,
      listId,
      groupId: activeGroup.id,
      price: options?.price,
      unitPrice: options?.unitPrice,
      quantity: options?.quantity,
      aisle: options?.aisle,
      supermarket: options?.supermarket,
      createdAt: new Date().toISOString(),
    }
    addShoppingItemStore(item)
    refreshData()
    bump()
  }

  const handleToggleShoppingItem = (itemId: string) => {
    if (!activeGroup) return
    toggleShoppingItemStore(itemId, activeGroup.id)
    refreshData()
  }

  const handleDeleteShoppingItem = (itemId: string) => {
    if (!activeGroup) return
    deleteShoppingItemStore(itemId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddEventPoll = (
    title: string,
    category: EventCategory,
    options: { title: string; date?: string; time?: string }[],
    participantMemberIds: string[],
    location?: string,
    description?: string,
    pollType: 'event' | 'general' = 'event',
    allowMultipleVotes: boolean = false,
    closeDate?: string
  ) => {
    if (!activeGroup) return
    const actingMember = getMembersByGroup(activeGroup.id).find((m) => m.name === userName) || getMembersByGroup(activeGroup.id)[0]
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `poll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    const pollOptions = options.map((opt, i) => ({
      id: `opt_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: opt.title,
      date: opt.date || undefined,
      time: opt.time || undefined,
      votes: [],
    }))

    const poll: EventPoll = {
      id: uniqueId,
      title,
      description: description || undefined,
      pollType,
      category,
      options: pollOptions,
      participantMemberIds,
      allowMultipleVotes,
      closeDate: closeDate || undefined,
      location: location || undefined,
      groupId: activeGroup.id,
      createdBy: actingMember ? actingMember.id : 'system',
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    addEventPollStore(poll)

    addActivity({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      groupId: activeGroup.id,
      type: 'event_created',
      title: `Encuesta: ${poll.title}`,
      details: pollType === 'event' ? `${options.length} alternativas de evento` : `${options.length} opciones para votar`,
      memberId: actingMember ? actingMember.id : 'system',
      timestamp: new Date().toISOString(),
    })

    refreshData()
    bump()
  }

  const handleVoteEventPoll = (pollId: string, optionId: string) => {
    if (!activeGroup || !currentMember) return
    voteEventPollStore(pollId, optionId, currentMember.id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleCloseEventPoll = (pollId: string) => {
    if (!activeGroup) return
    closeEventPollStore(pollId, activeGroup.id)
    refreshData()
    bump()
  }

  const handleDeleteEventPoll = (pollId: string) => {
    if (!activeGroup) return
    deleteEventPollStore(pollId, activeGroup.id)
    refreshData()
    bump()
  }

  // --- Meal Mutations ---
  const handleAddDailyMenu = (menuData: Omit<DailyMenu, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `daily_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const menu: DailyMenu = {
      ...menuData,
      id: uniqueId,
      groupId: activeGroup.id,
      createdAt: new Date().toISOString(),
    }
    addDailyMenuStore(menu)
    refreshData()
    bump()
  }

  const handleUpdateDailyMenu = (menu: DailyMenu) => {
    if (!activeGroup) return
    updateDailyMenuStore(menu)
    refreshData()
    bump()
  }

  const handleDeleteDailyMenu = (id: string) => {
    if (!activeGroup) return
    deleteDailyMenuStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleDuplicateDailyMenu = (id: string) => {
    if (!activeGroup) return
    duplicateDailyMenuStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddWeeklyMenu = (menuData: Omit<WeeklyMenu, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `weekly_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const menu: WeeklyMenu = {
      ...menuData,
      id: uniqueId,
      groupId: activeGroup.id,
      createdAt: new Date().toISOString(),
    }
    addWeeklyMenuStore(menu)
    refreshData()
    bump()
  }

  const handleUpdateWeeklyMenu = (menu: WeeklyMenu) => {
    if (!activeGroup) return
    updateWeeklyMenuStore(menu)
    refreshData()
    bump()
  }

  const handleDeleteWeeklyMenu = (id: string) => {
    if (!activeGroup) return
    deleteWeeklyMenuStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleDuplicateWeeklyMenu = (id: string) => {
    if (!activeGroup) return
    duplicateWeeklyMenuStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddIngredientsToShoppingList = (ingredients: string[]) => {
    if (!activeGroup || ingredients.length === 0) return
    let lists = getShoppingListsByGroup(activeGroup.id)
    let listId = lists[0]?.id
    if (!listId) {
      const newListId = `list_${Date.now()}`
      addShoppingListStore({ id: newListId, name: 'Lista de la Compra', groupId: activeGroup.id })
      listId = newListId
    }

    ingredients.forEach((ing) => {
      const cleanName = ing.trim()
      if (cleanName) {
        const item = {
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: cleanName,
          completed: false,
          listId,
          groupId: activeGroup.id,
        }
        addShoppingItemStore(item)
      }
    })
    refreshData()
    bump()
  }

  // --- Finance Mutations ---
  const handleAddIncome = (data: Omit<Income, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const numAmount = typeof data.amount === 'number' ? data.amount : parseFloat(String(data.amount).replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) return
    const memberIds = data.memberIds && data.memberIds.length > 0
      ? data.memberIds
      : data.memberId ? [data.memberId] : []
    if (memberIds.length === 0) return

    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    addIncomeStore({
      ...data,
      id: uniqueId,
      groupId: activeGroup.id,
      amount: numAmount,
      memberId: memberIds[0],
      memberIds,
      createdAt: new Date().toISOString(),
    })
    refreshData()
    bump()
  }

  const handleUpdateIncome = (income: Income) => {
    if (!activeGroup) return
    const numAmount = typeof income.amount === 'number' ? income.amount : parseFloat(String(income.amount).replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) return
    updateIncomeStore({
      ...income,
      amount: numAmount,
    })
    refreshData()
    bump()
  }

  const handleDeleteIncome = (id: string) => {
    if (!activeGroup) return
    deleteIncomeStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddExpense = (data: Omit<Expense, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const numAmount = typeof data.amount === 'number' ? data.amount : parseFloat(String(data.amount).replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) return
    const memberIds = data.paidByMemberIds && data.paidByMemberIds.length > 0
      ? data.paidByMemberIds
      : data.paidByMemberId ? [data.paidByMemberId] : []
    if (memberIds.length === 0) return

    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    addExpenseStore({
      ...data,
      id: uniqueId,
      groupId: activeGroup.id,
      amount: numAmount,
      paidByMemberId: memberIds[0],
      paidByMemberIds: memberIds,
      createdAt: new Date().toISOString(),
    })
    refreshData()
    bump()
  }

  const handleUpdateExpense = (expense: Expense) => {
    if (!activeGroup) return
    const numAmount = typeof expense.amount === 'number' ? expense.amount : parseFloat(String(expense.amount).replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) return
    updateExpenseStore({
      ...expense,
      amount: numAmount,
    })
    refreshData()
    bump()
  }

  const handleDeleteExpense = (id: string) => {
    if (!activeGroup) return
    deleteExpenseStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAddBill = (data: Omit<BillSubscription, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bill_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    addBillStore({ ...data, id: uniqueId, groupId: activeGroup.id })
    refreshData()
    bump()
  }

  const handleUpdateBill = (bill: BillSubscription) => {
    if (!activeGroup) return
    updateBillStore(bill)
    refreshData()
    bump()
  }

  const handleDeleteBill = (id: string) => {
    if (!activeGroup) return
    deleteBillStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleToggleBillStatus = (id: string) => {
    if (!activeGroup) return
    toggleBillStatusStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleCancelBillSubscription = (id: string) => {
    if (!activeGroup) return
    cancelBillSubscriptionStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleReactivateBillSubscription = (id: string) => {
    if (!activeGroup) return
    reactivateBillSubscriptionStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handlePauseBillSubscription = (id: string) => {
    if (!activeGroup) return
    pauseBillSubscriptionStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleSaveBudget = (category: string, monthlyLimit: number) => {
    if (!activeGroup) return
    saveBudgetStore(activeGroup.id, category, monthlyLimit)
    refreshData()
    bump()
  }

  const handleDeleteBudget = (id: string) => {
    if (!activeGroup) return
    deleteBudgetStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleSaveInitialPiggyBankBalance = (amount: number) => {
    if (!activeGroup) return
    savePiggyBankBalanceStore(activeGroup.id, amount)
    refreshData()
    bump()
  }

  // --- Task Category mutations ---
  const handleAddTaskCategory = (name: string, memberIds: string[]) => {
    if (!activeGroup) return
    const cat: TaskCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      memberIds,
      groupId: activeGroup.id,
    }
    addTaskCategoryStore(cat)
    refreshData()
    bump()
  }

  const handleDeleteTaskCategory = (categoryId: string) => {
    if (!activeGroup) return
    deleteTaskCategoryStore(categoryId, activeGroup.id)
    refreshData()
    bump()
  }

  // --- Family mutations ---
  const handleAddFamilyChallenge = (data: Omit<FamilyChallenge, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    const groupMembers = getMembersByGroup(activeGroup.id)
    const actingMember =
      groupMembers.find((m) => m.name === userName) ||
      groupMembers[0] ||
      { id: currentMember?.id || 'usr_default', name: userName || 'Usuario' }

    addChallengeStore({
      ...data,
      id: uniqueId,
      groupId: activeGroup.id,
      assignedMemberIds: data.assignedMemberIds && data.assignedMemberIds.length > 0 ? data.assignedMemberIds : [actingMember.id],
      targetDays: Number(data.targetDays) || 7,
      rewardPoints: Number(data.rewardPoints) || 100,
      currentDays: data.currentDays || 0,
      status: data.status || 'en_progreso',
      createdAt: new Date().toISOString(),
    })

    try {
      addActivity({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: activeGroup.id,
        type: 'task_created',
        title: `Nuevo Reto: ${data.title}`,
        details: `+${data.rewardPoints} pts`,
        memberId: currentMember?.id || actingMember.id,
        timestamp: new Date().toISOString(),
      })
    } catch (e) {
      console.warn('Activity error on challenge creation:', e)
    }

    refreshData()
    bump()
  }

  const handleUpdateFamilyChallenge = (challenge: FamilyChallenge) => {
    if (!activeGroup) return
    updateChallengeStore(challenge)
    refreshData()
    bump()
  }

  const handleDeleteFamilyChallenge = (id: string) => {
    if (!activeGroup) return
    deleteChallengeStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleAdjustFamilyChallengeDays = (id: string, delta: number) => {
    if (!activeGroup) return { completedNow: false, pointsAwarded: 0, alreadyDoneToday: false }
    const res = adjustChallengeDaysStore(id, activeGroup.id, delta)
    if (res.alreadyDoneToday) {
      return { completedNow: false, pointsAwarded: 0, alreadyDoneToday: true }
    }
    if (res.completedNow && res.pointsAwarded > 0) {
      if (res.challenge?.assignedMemberIds && res.challenge.assignedMemberIds.length > 0) {
        res.challenge.assignedMemberIds.forEach((mId) => {
          adjustMemberPointsStore(mId, activeGroup.id, res.pointsAwarded)
        })
      } else if (currentMember) {
        adjustMemberPointsStore(currentMember.id, activeGroup.id, res.pointsAwarded)
      }
      try {
        addNotification({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          groupId: activeGroup.id,
          type: 'task',
          title: '¡Reto completado!',
          body: `Se ha completado el reto "${res.challenge?.title}" (+${res.pointsAwarded} pts)`,
          timestamp: new Date().toISOString(),
          colorVar: 'var(--amber-500)',
        })
      } catch (e) {
        console.warn(e)
      }
    }
    refreshData()
    bump()
    return { completedNow: res.completedNow, pointsAwarded: res.pointsAwarded, alreadyDoneToday: false }
  }

  const handleCheckInFamilyChallenge = (id: string) => {
    return handleAdjustFamilyChallengeDays(id, 1)
  }

  const handleAddFamilyReward = (data: Omit<FamilyReward, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rew_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    addRewardStore({
      ...data,
      id: uniqueId,
      groupId: activeGroup.id,
      createdAt: new Date().toISOString(),
    })
    refreshData()
    bump()
  }

  const handleUpdateFamilyReward = (reward: FamilyReward) => {
    if (!activeGroup) return
    updateRewardStore(reward)
    refreshData()
    bump()
  }

  const handleDeleteFamilyReward = (id: string) => {
    if (!activeGroup) return
    deleteRewardStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleClaimFamilyReward = (rewardId: string, memberId: string) => {
    if (!activeGroup) return { success: false, error: 'Sin grupo activo' }
    try {
      const res = claimRewardStore(rewardId, memberId, activeGroup.id)
      if (res.success && res.reward) {
        const claimingMember = getMembersByGroup(activeGroup.id).find((m) => m.id === memberId)
        try {
          addActivity({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            groupId: activeGroup.id,
            type: 'reward_claimed',
            title: `Recompensa canjeada: ${res.reward.title}`,
            details: `-${res.reward.pointCost} pts`,
            memberId,
            timestamp: new Date().toISOString(),
          })
          addNotification({
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            groupId: activeGroup.id,
            type: 'reward',
            title: 'Recompensa canjeada',
            body: `${claimingMember?.name || 'Un miembro'} canjeó "${res.reward.title}"`,
            timestamp: new Date().toISOString(),
            colorVar: 'var(--purple-500)',
          })
        } catch (actErr) {
          console.warn('Error recording activity for claimed reward:', actErr)
        }
      }
      refreshData()
      bump()
      return res
    } catch (err) {
      console.error('Error in handleClaimFamilyReward in app-context:', err)
      return { success: false, error: 'Error al procesar el canje de recompensa' }
    }
  }

  const handleAddFamilyMemory = (data: Omit<FamilyMemory, 'id' | 'groupId'>) => {
    if (!activeGroup) return
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    addMemoryStore({
      ...data,
      id: uniqueId,
      groupId: activeGroup.id,
      createdAt: new Date().toISOString(),
    })
    refreshData()
    bump()
  }

  const handleUpdateFamilyMemory = (memory: FamilyMemory) => {
    if (!activeGroup) return
    updateMemoryStore(memory)
    refreshData()
    bump()
  }

  const handleDeleteFamilyMemory = (id: string) => {
    if (!activeGroup) return
    const mem = familyMemories.find((m) => m.id === id)
    if (mem?.imageUrl) {
      deleteMemoryImage(mem.imageUrl)
    }
    deleteMemoryStore(id, activeGroup.id)
    refreshData()
    bump()
  }

  const handleUpdateMember = (memberId: string, updates: Partial<Member>) => {
    if (!activeGroup) return
    updateMemberProfileStore(memberId, activeGroup.id, updates)
    refreshData()
    bump()
  }

  const handleAdjustMemberPoints = (memberId: string, pointsDelta: number, reason?: string) => {
    if (!activeGroup) return
    adjustMemberPointsStore(memberId, activeGroup.id, pointsDelta)
    const targetMember = getMembersByGroup(activeGroup.id).find((m) => m.id === memberId)
    if (reason && targetMember) {
      addActivity({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: activeGroup.id,
        type: pointsDelta >= 0 ? 'task_completed' : 'task_created',
        title: `Ajuste de puntos para ${targetMember.name}: ${reason}`,
        details: `${pointsDelta >= 0 ? '+' : ''}${pointsDelta} pts`,
        memberId,
        timestamp: new Date().toISOString(),
      })
    }
    refreshData()
    bump()
  }

  return (
    <AppContext.Provider
      value={{
        tab,
        setTab,
        quickAddOpen,
        quickAddTab,
        quickAddHideTabs,
        quickAddDefaultSection,
        quickAddDefaultDate,
        openQuickAdd: handleOpenQuickAdd,
        closeQuickAdd: handleCloseQuickAdd,
        notificationsOpen,
        setNotificationsOpen,
        interactions,
        bump,

        userName,

        activeGroup,
        groups,
        switchGroup,
        createGroup: handleCreateGroup,
        deleteGroup: handleDeleteGroup,
        updateGroupName: handleUpdateGroupName,
        groupSelectorOpen,
        openGroupSelector: () => setGroupSelectorOpen(true),
        closeGroupSelector: () => setGroupSelectorOpen(false),
        createGroupModalOpen,
        openCreateGroupModal: () => {
          setGroupSelectorOpen(false)
          setCreateGroupModalOpen(true)
        },
        closeCreateGroupModal: () => setCreateGroupModalOpen(false),
        historyOpen,
        openHistory: () => setHistoryOpen(true),
        closeHistory: () => setHistoryOpen(false),
        refreshData,

        currentMember,
        members,
        tasks,
        events,
        reminders,
        activities,
        notifications,
        archivedTasks,
        archivedEvents,
        archivedReminders,

        shoppingLists,
        shoppingItems,
        taskCategories,
        eventPolls,
        dailyMenus,
        weeklyMenus,
        incomes,
        expenses,
        bills,
        budgets,

        // Family Suite
        familyChallenges,
        archivedFamilyChallenges,
        familyRewards,
        familyMemories,
        familyAchievements,
        addFamilyChallenge: handleAddFamilyChallenge,
        updateFamilyChallenge: handleUpdateFamilyChallenge,
        deleteFamilyChallenge: handleDeleteFamilyChallenge,
        checkInFamilyChallenge: handleCheckInFamilyChallenge,
        adjustFamilyChallengeDays: handleAdjustFamilyChallengeDays,
        addFamilyReward: handleAddFamilyReward,
        updateFamilyReward: handleUpdateFamilyReward,
        deleteFamilyReward: handleDeleteFamilyReward,
        claimFamilyReward: handleClaimFamilyReward,
        addFamilyMemory: handleAddFamilyMemory,
        updateFamilyMemory: handleUpdateFamilyMemory,
        deleteFamilyMemory: handleDeleteFamilyMemory,
        updateMember: handleUpdateMember,
        adjustMemberPoints: handleAdjustMemberPoints,

        addIncome: handleAddIncome,
        updateIncome: handleUpdateIncome,
        deleteIncome: handleDeleteIncome,
        addExpense: handleAddExpense,
        updateExpense: handleUpdateExpense,
        deleteExpense: handleDeleteExpense,
        addBill: handleAddBill,
        updateBill: handleUpdateBill,
        deleteBill: handleDeleteBill,
        toggleBillStatus: handleToggleBillStatus,
        cancelBillSubscription: handleCancelBillSubscription,
        reactivateBillSubscription: handleReactivateBillSubscription,
        pauseBillSubscription: handlePauseBillSubscription,
        saveBudget: handleSaveBudget,
        deleteBudget: handleDeleteBudget,
        selectedMonthISO,
        setSelectedMonthISO,
        initialPiggyBankBalance,
        saveInitialPiggyBankBalance: handleSaveInitialPiggyBankBalance,

        addDailyMenu: handleAddDailyMenu,
        updateDailyMenu: handleUpdateDailyMenu,
        deleteDailyMenu: handleDeleteDailyMenu,
        duplicateDailyMenu: handleDuplicateDailyMenu,
        addWeeklyMenu: handleAddWeeklyMenu,
        updateWeeklyMenu: handleUpdateWeeklyMenu,
        deleteWeeklyMenu: handleDeleteWeeklyMenu,
        duplicateWeeklyMenu: handleDuplicateWeeklyMenu,
        addIngredientsToShoppingList: handleAddIngredientsToShoppingList,

        addTaskCategory: handleAddTaskCategory,
        deleteTaskCategory: handleDeleteTaskCategory,
        addEventPoll: handleAddEventPoll,
        voteEventPoll: handleVoteEventPoll,
        closeEventPoll: handleCloseEventPoll,
        deleteEventPoll: handleDeleteEventPoll,

        addTask: handleAddTask,
        updateTask: handleUpdateTask,
        toggleTask: handleToggleTask,
        deleteTask: handleDeleteTask,
        addEvent: handleAddEvent,
        updateEvent: handleUpdateEvent,
        deleteEvent: handleDeleteEvent,
        addReminder: handleAddReminder,
        updateReminder: handleUpdateReminder,
        deleteReminder: handleDeleteReminder,
        addMember: handleAddMember,
        getMemberById: handleGetMemberById,
        dismissNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        addShoppingList: handleAddShoppingList,
        updateShoppingList: handleUpdateShoppingList,
        deleteShoppingList: handleDeleteShoppingList,
        addShoppingItem: handleAddShoppingItem,
        toggleShoppingItem: handleToggleShoppingItem,
        deleteShoppingItem: handleDeleteShoppingItem,

        confirmDelete,
      }}
    >
      {!isInitialized ? (
        <div className="flex min-h-screen min-h-[100dvh] w-full flex-col items-center justify-center bg-[#05050a] text-white relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-96 rounded-full bg-purple-600/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 size-80 rounded-full bg-indigo-600/15 blur-[120px]" />

          <div className="relative z-10 flex flex-col items-center gap-5 px-4 animate-fade-in">
            <UsyTaskLogo size="lg" showSubtitle />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="animate-pulse">Preparando tu Centro de Control...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {children}
          <ConfirmDeleteModal
            isOpen={confirmModalState.isOpen}
            onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModalState.onConfirm}
            title={confirmModalState.title}
            description={confirmModalState.description}
            itemName={confirmModalState.itemName}
            confirmText={confirmModalState.confirmText}
            cancelText={confirmModalState.cancelText}
            isDestructive={confirmModalState.isDestructive}
          />
        </>
      )}
    </AppContext.Provider>
  )
}
