// USYTask — Cloud Synchronization Layer with Supabase
// Ensures 100% of groups, members, tasks, events, reminders, shopping, etc.
// are attached to the authenticated user (user_id / email) and restored across devices/cache resets.

import { createClient } from './supabase'
import { getAllGroups, saveAllGroups, getActiveGroupId, setActiveGroupId } from './group-store'
import {
  getAllMembers,
  getAllTasks,
  getAllEvents,
  getAllReminders,
  getAllActivities,
  getAllNotifications,
  getAllShoppingLists,
  getAllShoppingItems,
  getAllTaskCategories,
  getAllDailyMenus,
  getAllWeeklyMenus,
  getAllIncomes,
  getAllExpenses,
  getAllBills,
  getAllBudgets,
} from './data-store'
import {
  getAllChallenges,
  getAllRewards,
  getAllMemories,
} from './family-store'

export interface CloudBackupPayload {
  version: number
  userId: string
  updatedAt: string
  groups: any[]
  activeGroupId: string | null
  members: any[]
  tasks: any[]
  events: any[]
  reminders: any[]
  activities: any[]
  notifications: any[]
  shoppingLists: any[]
  shoppingItems: any[]
  taskCategories: any[]
  dailyMenus: any[]
  weeklyMenus: any[]
  incomes: any[]
  expenses: any[]
  bills: any[]
  budgets: any[]
  challenges: any[]
  rewards: any[]
  memories: any[]
}

const STORAGE_KEYS = {
  groups: 'usytask_groups',
  activeGroupId: 'usytask_active_group_id',
  members: 'usytask_members',
  tasks: 'usytask_tasks',
  events: 'usytask_events',
  reminders: 'usytask_reminders',
  activities: 'usytask_activities',
  notifications: 'usytask_notifications',
  shoppingLists: 'usytask_shopping_lists',
  shoppingItems: 'usytask_shopping_items',
  taskCategories: 'usytask_custom_task_categories',
  dailyMenus: 'usytask_daily_menus',
  weeklyMenus: 'usytask_weekly_menus',
  incomes: 'usytask_incomes',
  expenses: 'usytask_expenses',
  bills: 'usytask_bills',
  budgets: 'usytask_budgets',
  challenges: 'usytask_family_challenges',
  rewards: 'usytask_family_rewards',
  memories: 'usytask_family_memories',
}

let syncTimeout: NodeJS.Timeout | null = null

/**
 * Packs all current local data into a single cloud backup payload.
 */
export function buildCloudPayload(userId: string): CloudBackupPayload {
  return {
    version: 1,
    userId,
    updatedAt: new Date().toISOString(),
    groups: getAllGroups(),
    activeGroupId: getActiveGroupId(),
    members: getAllMembers(),
    tasks: getAllTasks(),
    events: getAllEvents(),
    reminders: getAllReminders(),
    activities: getAllActivities(),
    notifications: getAllNotifications(),
    shoppingLists: getAllShoppingLists(),
    shoppingItems: getAllShoppingItems(),
    taskCategories: getAllTaskCategories(),
    dailyMenus: getAllDailyMenus(),
    weeklyMenus: getAllWeeklyMenus(),
    incomes: getAllIncomes(),
    expenses: getAllExpenses(),
    bills: getAllBills(),
    budgets: getAllBudgets(),
    challenges: getAllChallenges(),
    rewards: getAllRewards(),
    memories: getAllMemories(),
  }
}

/**
 * Hydrates local storage with the cloud payload received from Supabase.
 */
export function hydrateLocalFromCloud(payload: CloudBackupPayload): boolean {
  if (typeof window === 'undefined' || !payload) return false

  try {
    if (payload.groups && payload.groups.length > 0) {
      localStorage.setItem(STORAGE_KEYS.groups, JSON.stringify(payload.groups))
    }
    if (payload.activeGroupId) {
      localStorage.setItem(STORAGE_KEYS.activeGroupId, payload.activeGroupId)
    }
    if (payload.members) {
      localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(payload.members))
    }
    if (payload.tasks) {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(payload.tasks))
    }
    if (payload.events) {
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(payload.events))
    }
    if (payload.reminders) {
      localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(payload.reminders))
    }
    if (payload.activities) {
      localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(payload.activities))
    }
    if (payload.notifications) {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(payload.notifications))
    }
    if (payload.shoppingLists) {
      localStorage.setItem(STORAGE_KEYS.shoppingLists, JSON.stringify(payload.shoppingLists))
    }
    if (payload.shoppingItems) {
      localStorage.setItem(STORAGE_KEYS.shoppingItems, JSON.stringify(payload.shoppingItems))
    }
    if (payload.taskCategories) {
      localStorage.setItem(STORAGE_KEYS.taskCategories, JSON.stringify(payload.taskCategories))
    }
    if (payload.dailyMenus) {
      localStorage.setItem(STORAGE_KEYS.dailyMenus, JSON.stringify(payload.dailyMenus))
    }
    if (payload.weeklyMenus) {
      localStorage.setItem(STORAGE_KEYS.weeklyMenus, JSON.stringify(payload.weeklyMenus))
    }
    if (payload.incomes) {
      localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify(payload.incomes))
    }
    if (payload.expenses) {
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(payload.expenses))
    }
    if (payload.bills) {
      localStorage.setItem(STORAGE_KEYS.bills, JSON.stringify(payload.bills))
    }
    if (payload.budgets) {
      localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(payload.budgets))
    }
    if (payload.challenges) {
      localStorage.setItem(STORAGE_KEYS.challenges, JSON.stringify(payload.challenges))
    }
    if (payload.rewards) {
      localStorage.setItem(STORAGE_KEYS.rewards, JSON.stringify(payload.rewards))
    }
    if (payload.memories) {
      localStorage.setItem(STORAGE_KEYS.memories, JSON.stringify(payload.memories))
    }

    return true
  } catch (err) {
    console.error('Error hydrating local storage from cloud:', err)
    return false
  }
}

/**
 * Completely purges all local storage and session data for USYTask.
 * Called on logout to prevent state/family leakage between different users.
 */
export function clearAllLocalData(): void {
  if (typeof window === 'undefined') return
  try {
    // Clear known keys
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    // Clear any extra usytask_* or auth keys from localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('usytask_') || k.startsWith('sb-'))) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // Clear sessionStorage as well
    sessionStorage.clear()
  } catch (err) {
    console.error('Error clearing local data:', err)
  }
}

/**
 * Syncs and pulls the complete data set from Supabase for the active user.
 * If local storage is empty, restores all spaces, tasks, reminders, and events.
 */
export async function syncFromSupabaseCloud(): Promise<{ success: boolean; restored: boolean }> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, restored: false }
    }

    const cloudBackup = user.user_metadata?.usytask_cloud_backup as CloudBackupPayload | undefined

    if (cloudBackup && cloudBackup.groups && cloudBackup.groups.length > 0) {
      // Hydrate local storage with the cloud backup strictly belonging to THIS user
      hydrateLocalFromCloud(cloudBackup)
      return { success: true, restored: true }
    }

    return { success: true, restored: false }
  } catch (err) {
    console.error('Error syncing from Supabase cloud:', err)
    return { success: false, restored: false }
  }
}

/**
 * Checks in Supabase (and local storage fallback) if the user has at least one family/group.
 * Used during login/onboarding routing decisions.
 */
export async function getUserFamilyStatus(): Promise<{ hasFamily: boolean; groupsCount: number }> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const cloudBackup = user.user_metadata?.usytask_cloud_backup as CloudBackupPayload | undefined
      if (cloudBackup && cloudBackup.groups && cloudBackup.groups.length > 0) {
        return { hasFamily: true, groupsCount: cloudBackup.groups.length }
      }

      // Also check group_members table if present
      try {
        const { data: dbMembers, error: dbError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)

        if (!dbError && dbMembers && dbMembers.length > 0) {
          return { hasFamily: true, groupsCount: dbMembers.length }
        }
      } catch {
        // Ignored if table not created yet
      }

      // Authenticated user in Supabase with NO cloud backup and NO group_members has NO family yet
      return { hasFamily: false, groupsCount: 0 }
    }

    // Check local storage only if offline/dev mode
    const localGroups = getAllGroups()
    if (localGroups.length > 0) {
      return { hasFamily: true, groupsCount: localGroups.length }
    }

    return { hasFamily: false, groupsCount: 0 }
  } catch (err) {
    console.error('Error checking user family status:', err)
    return { hasFamily: false, groupsCount: 0 }
  }
}

/**
 * Saves current local data state to the authenticated Supabase user metadata.
 */
export async function syncToSupabaseCloud(): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const payload = buildCloudPayload(user.id)

    const { error } = await supabase.auth.updateUser({
      data: {
        usytask_cloud_backup: payload,
      },
    })

    if (error) {
      console.warn('Warning updating cloud backup in Supabase:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('Failed to sync data to Supabase cloud:', err)
    return false
  }
}

/**
 * Debounced cloud synchronization trigger for all CRUD operations.
 */
export function scheduleCloudSync(delayMs = 600) {
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }
  syncTimeout = setTimeout(() => {
    syncToSupabaseCloud().catch((err) => console.warn('Background cloud sync error:', err))
  }, delayMs)
}
