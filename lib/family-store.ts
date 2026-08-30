// USYTask — Family Data Store
// CRUD, Persistence and Gamification Logic for Challenges, Rewards, Memories, Achievements, and Member Profiles.

import type { FamilyChallenge, FamilyReward, FamilyMemory, FamilyAchievement, Member, Task } from '@/types'
import { getTodayISO } from './date-utils'
import { scheduleCloudSync } from './cloud-sync'

const CHALLENGES_KEY = 'usytask_family_challenges'
const REWARDS_KEY = 'usytask_family_rewards'
const MEMORIES_KEY = 'usytask_family_memories'
const MEMBERS_KEY = 'usytask_members'

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

// ---------------- CHALLENGES ----------------

export function getAllChallenges(): FamilyChallenge[] {
  return loadArray<FamilyChallenge>(CHALLENGES_KEY)
}

export function getChallengesByGroup(groupId: string): FamilyChallenge[] {
  const all = getAllChallenges()
  return all.filter((c) => c.groupId === groupId)
}

export function addChallenge(challenge: FamilyChallenge): void {
  const all = getAllChallenges()
  all.unshift(challenge)
  saveArray(CHALLENGES_KEY, all)
}

export function updateChallenge(challenge: FamilyChallenge): void {
  const all = getAllChallenges()
  const idx = all.findIndex((c) => c.id === challenge.id && c.groupId === challenge.groupId)
  if (idx >= 0) {
    all[idx] = challenge
    saveArray(CHALLENGES_KEY, all)
  }
}

export function deleteChallenge(id: string, groupId: string): void {
  const all = getAllChallenges()
  saveArray(CHALLENGES_KEY, all.filter((c) => !(c.id === id && c.groupId === groupId)))
}

export function adjustChallengeDays(
  id: string,
  groupId: string,
  delta: number
): { challenge: FamilyChallenge | null; completedNow: boolean; pointsAwarded: number } {
  const all = getAllChallenges()
  const idx = all.findIndex((c) => c.id === id && c.groupId === groupId)
  if (idx < 0) return { challenge: null, completedNow: false, pointsAwarded: 0 }

  const chal = all[idx]
  const today = getTodayISO()

  const currentStreak = chal.currentDays || 0
  const targetDays = chal.targetDays || 7
  const newDays = Math.max(0, Math.min(targetDays, currentStreak + delta))
  const isNowCompleted = newDays >= targetDays

  const updated: FamilyChallenge = {
    ...chal,
    currentDays: newDays,
    status: isNowCompleted ? 'completado' : 'en_progreso',
    lastCheckedDate: today,
    completedAt: isNowCompleted ? (chal.completedAt || new Date().toISOString()) : undefined,
  }

  all[idx] = updated
  saveArray(CHALLENGES_KEY, all)

  return {
    challenge: updated,
    completedNow: isNowCompleted && chal.status !== 'completado',
    pointsAwarded: isNowCompleted && chal.status !== 'completado' ? chal.rewardPoints : 0,
  }
}

// ---------------- REWARDS ----------------

export function getAllRewards(): FamilyReward[] {
  try {
    return loadArray<FamilyReward>(REWARDS_KEY)
  } catch (err) {
    console.error('Error in getAllRewards:', err)
    return []
  }
}

export function getRewardsByGroup(groupId: string): FamilyReward[] {
  try {
    const all = getAllRewards()
    return all.filter((r) => r.groupId === groupId)
  } catch (err) {
    console.error('Error in getRewardsByGroup:', err)
    return []
  }
}

export function addReward(reward: FamilyReward): void {
  try {
    const all = getAllRewards()
    all.unshift({
      ...reward,
      pointCost: Number(reward.pointCost) || 100,
      stock: reward.stock !== undefined ? Number(reward.stock) : undefined,
    })
    saveArray(REWARDS_KEY, all)
  } catch (err) {
    console.error('Error in addReward:', err)
  }
}

export function updateReward(reward: FamilyReward): void {
  try {
    const all = getAllRewards()
    const idx = all.findIndex((r) => r.id === reward.id)
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        ...reward,
        pointCost: Number(reward.pointCost) || 100,
        stock: reward.stock !== undefined ? Number(reward.stock) : undefined,
      }
      saveArray(REWARDS_KEY, all)
    }
  } catch (err) {
    console.error('Error in updateReward:', err)
  }
}

export function deleteReward(id: string, groupId: string): void {
  try {
    const all = getAllRewards()
    saveArray(REWARDS_KEY, all.filter((r) => r.id !== id))
  } catch (err) {
    console.error('Error in deleteReward:', err)
  }
}

export function claimReward(
  rewardId: string,
  memberId: string,
  groupId: string
): { success: boolean; error?: string; reward?: FamilyReward } {
  try {
    if (!rewardId || !memberId) {
      return { success: false, error: 'Identificador de recompensa o integrante no válido' }
    }

    const allRewards = getAllRewards()
    const rIdx = allRewards.findIndex((r) => r.id === rewardId)
    if (rIdx < 0) {
      console.error('claimReward: Recompensa no encontrada', { rewardId, groupId, allRewards })
      return { success: false, error: 'Recompensa no encontrada en el catálogo' }
    }

    const reward = allRewards[rIdx]
    const cost = Math.max(0, Number(reward.pointCost) || 0)

    if (reward.stock !== undefined && reward.stock !== null && Number(reward.stock) <= 0) {
      return { success: false, error: 'Esta recompensa ya no tiene unidades disponibles (agotada)' }
    }

    // Check member points with fallback
    const allMembers = loadArray<Member>(MEMBERS_KEY)
    let mIdx = allMembers.findIndex((m) => m.id === memberId || (m.id && m.id.trim() === memberId.trim()))
    
    if (mIdx < 0) {
      // Fallback search by groupId if single owner
      mIdx = allMembers.findIndex((m) => m.groupId === groupId && m.isOwner)
    }

    if (mIdx < 0) {
      console.error('claimReward: Integrante no encontrado', { memberId, groupId, allMembers })
      return { success: false, error: 'Integrante no encontrado en el sistema' }
    }

    const member = allMembers[mIdx]
    const currentPoints = Math.max(0, Number(member.points) || 0)

    if (currentPoints < cost) {
      return {
        success: false,
        error: `Puntos insuficientes (${currentPoints} pts disponibles). Se requieren ${cost} pts.`,
      }
    }

    // Deduct points from member
    allMembers[mIdx] = {
      ...member,
      points: Math.max(0, currentPoints - cost),
    }
    saveArray(MEMBERS_KEY, allMembers)

    // Append to claimedBy list
    const updatedClaimedBy = Array.isArray(reward.claimedBy) ? [...reward.claimedBy] : []
    const claimRecord = {
      id: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      memberId: member.id,
      date: new Date().toISOString(),
      rewardTitle: reward.title,
      pointCost: cost,
    }
    updatedClaimedBy.unshift(claimRecord)

    const updatedReward: FamilyReward = {
      ...reward,
      stock: reward.stock !== undefined ? Math.max(0, Number(reward.stock) - 1) : undefined,
      claimedBy: updatedClaimedBy,
    }

    allRewards[rIdx] = updatedReward
    saveArray(REWARDS_KEY, allRewards)

    return { success: true, reward: updatedReward }
  } catch (err) {
    console.error('Error in claimReward in family-store:', err)
    return { success: false, error: 'Error interno al procesar el canje de recompensa' }
  }
}

// ---------------- MEMORIES ----------------

export function getAllMemories(): FamilyMemory[] {
  return loadArray<FamilyMemory>(MEMORIES_KEY)
}

export function getMemoriesByGroup(groupId: string): FamilyMemory[] {
  const all = getAllMemories()
  return all.filter((m) => m.groupId === groupId)
}

export function addMemory(memory: FamilyMemory): void {
  const all = getAllMemories()
  all.unshift(memory)
  saveArray(MEMORIES_KEY, all)
}

export function updateMemory(memory: FamilyMemory): void {
  const all = getAllMemories()
  const idx = all.findIndex((m) => m.id === memory.id && m.groupId === memory.groupId)
  if (idx >= 0) {
    all[idx] = memory
    saveArray(MEMORIES_KEY, all)
  }
}

export function deleteMemory(id: string, groupId: string): void {
  const all = getAllMemories()
  saveArray(MEMORIES_KEY, all.filter((m) => !(m.id === id && m.groupId === groupId)))
}

// ---------------- ACHIEVEMENTS ENGINE ----------------

export function computeAchievementsForGroup(
  members: Member[],
  tasks: Task[],
  challenges: FamilyChallenge[],
  rewards: FamilyReward[],
  memories: FamilyMemory[]
): FamilyAchievement[] {
  const totalPoints = members.reduce((acc, m) => acc + (m.points || 0), 0)
  const maxStreak = members.reduce((acc, m) => Math.max(acc, m.streak || m.streakDays || 0), 0)
  const completedTasks = tasks.filter((t) => t.completed).length
  const completedChallenges = challenges.filter((c) => c.status === 'completado').length
  const totalClaims = rewards.reduce((acc, r) => acc + (r.claimedBy?.length || 0), 0)
  const totalMemories = memories.length

  const definitions: Omit<FamilyAchievement, 'isUnlocked' | 'progress'>[] = [
    {
      id: 'ach_first_step',
      title: 'Primer Paso en Equipo',
      description: 'Crea tu primer integrante y completa al menos 1 tarea.',
      icon: '🌱',
      maxProgress: 1,
      category: 'tasks',
    },
    {
      id: 'ach_streak_3',
      title: 'Hábito Forjado (3 Días)',
      description: 'Alcanza una racha de 3 días activos en el hogar.',
      icon: '🔥',
      maxProgress: 3,
      category: 'streak',
    },
    {
      id: 'ach_streak_7',
      title: 'Semana Perfecta (7 Días)',
      description: 'Mantén una racha imparable de 7 días continuos.',
      icon: '⚡',
      maxProgress: 7,
      category: 'streak',
    },
    {
      id: 'ach_points_500',
      title: 'Bolsa de Oro (500 Puntos)',
      description: 'Acumula un total de 500 puntos entre todos los miembros.',
      icon: '⭐',
      maxProgress: 500,
      category: 'points',
    },
    {
      id: 'ach_points_1500',
      title: 'Leyendas del Hogar (1500 Pts)',
      description: 'Supera la barrera de los 1500 puntos familiares acumulados.',
      icon: '👑',
      maxProgress: 1500,
      category: 'points',
    },
    {
      id: 'ach_tasks_10',
      title: 'Colaborador Maestro (10 Tareas)',
      description: 'Completa al menos 10 tareas en el hogar.',
      icon: '🧹',
      maxProgress: 10,
      category: 'tasks',
    },
    {
      id: 'ach_challenge_master',
      title: 'Conquistador de Retos',
      description: 'Lleva a término al menos 2 retos o desafíos familiares.',
      icon: '🏆',
      maxProgress: 2,
      category: 'challenges',
    },
    {
      id: 'ach_reward_hunter',
      title: 'Cazador de Recompensas',
      description: 'Canjea tu primer premio en la Tienda Familiar.',
      icon: '🎁',
      maxProgress: 1,
      category: 'rewards',
    },
    {
      id: 'ach_album_gold',
      title: 'Álbum Dorado de Recuerdos',
      description: 'Inmortaliza al menos 3 momentos especiales en el baúl.',
      icon: '📸',
      maxProgress: 3,
      category: 'memories',
    },
  ]

  return definitions.map((def) => {
    let current = 0
    if (def.id === 'ach_first_step') current = members.length > 0 && completedTasks >= 1 ? 1 : 0
    else if (def.id === 'ach_streak_3') current = Math.min(3, maxStreak)
    else if (def.id === 'ach_streak_7') current = Math.min(7, maxStreak)
    else if (def.id === 'ach_points_500') current = Math.min(500, totalPoints)
    else if (def.id === 'ach_points_1500') current = Math.min(1500, totalPoints)
    else if (def.id === 'ach_tasks_10') current = Math.min(10, completedTasks)
    else if (def.id === 'ach_challenge_master') current = Math.min(2, completedChallenges)
    else if (def.id === 'ach_reward_hunter') current = Math.min(1, totalClaims)
    else if (def.id === 'ach_album_gold') current = Math.min(3, totalMemories)

    const isUnlocked = current >= def.maxProgress
    return {
      ...def,
      progress: current,
      isUnlocked,
      unlockedAt: isUnlocked ? 'Desbloqueado' : undefined,
    }
  })
}

// ---------------- MEMBER ADJUSTMENTS ----------------

export function updateMemberProfile(
  memberId: string,
  groupId: string,
  updates: Partial<Member>
): Member | null {
  const allMembers = loadArray<Member>(MEMBERS_KEY)
  const idx = allMembers.findIndex((m) => m.id === memberId && m.groupId === groupId)
  if (idx < 0) return null

  allMembers[idx] = {
    ...allMembers[idx],
    ...updates,
  }
  saveArray(MEMBERS_KEY, allMembers)
  return allMembers[idx]
}

export function adjustMemberPoints(
  memberId: string,
  groupId: string,
  pointsDelta: number
): Member | null {
  const allMembers = loadArray<Member>(MEMBERS_KEY)
  const idx = allMembers.findIndex((m) => m.id === memberId && m.groupId === groupId)
  if (idx < 0) return null

  const updatedPoints = Math.max(0, (allMembers[idx].points || 0) + pointsDelta)
  allMembers[idx] = {
    ...allMembers[idx],
    points: updatedPoints,
  }
  saveArray(MEMBERS_KEY, allMembers)
  return allMembers[idx]
}
