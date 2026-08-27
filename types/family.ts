// USYTask — Family Types
// Strongly typed models for the gamified Family Suite: Members, Challenges, Rewards, Achievements, and Memories.

export type FamilyRole = 'adulto' | 'hijo' | 'invitado' | 'adult' | 'child'

export interface FamilyMember {
  id: string
  name: string
  avatarUrl?: string
  role: FamilyRole
  points: number
  streakDays: number
  colorAccent?: string
  initials?: string
  avatarColor?: string
  colorVar?: string
  groupId?: string
  isOwner?: boolean
}

export type ChallengeCategory = 'hábitos' | 'limpieza' | 'deporte' | 'estudio' | 'otros'
export type ChallengeStatus = 'en_progreso' | 'completado'

export const CHALLENGE_CATEGORIES: { id: ChallengeCategory; label: string; icon: string; color: string }[] = [
  { id: 'hábitos', label: 'Hábitos', icon: '🌱', color: 'emerald' },
  { id: 'limpieza', label: 'Limpieza', icon: '🧹', color: 'blue' },
  { id: 'deporte', label: 'Deporte', icon: '🏃‍♂️', color: 'amber' },
  { id: 'estudio', label: 'Estudio', icon: '📚', color: 'purple' },
  { id: 'otros', label: 'Otros', icon: '✨', color: 'rose' },
]

export interface FamilyChallenge {
  id: string
  groupId: string
  title: string
  description: string
  rewardPoints: number
  targetDays: number
  currentDays: number
  category: ChallengeCategory
  assignedMemberIds: string[]
  status: ChallengeStatus
  endDate?: string
  lastCheckedDate?: string // ISO date YYYY-MM-DD
  completedAt?: string // ISO timestamp when completed
  createdAt?: string
}

export interface RewardClaim {
  id?: string
  memberId: string
  date: string // ISO string
  rewardTitle?: string
  pointCost?: number
}

export interface FamilyReward {
  id: string
  groupId: string
  title: string
  description: string
  pointCost: number
  icon: string
  stock?: number
  claimedBy?: RewardClaim[]
  createdAt?: string
}

export interface FamilyAchievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number
  maxProgress: number
  isUnlocked: boolean
  category?: 'points' | 'streak' | 'challenges' | 'rewards' | 'memories' | 'tasks'
}

export interface FamilyMemory {
  id: string
  groupId: string
  title: string
  description: string
  date: string // ISO date YYYY-MM-DD
  imageUrl?: string // Public URL from Supabase storage or Base64 preview
  imagePlaceholder?: string // Gradient code or CSS style
  tags: string[]
  taggedMemberIds: string[]
  createdAt?: string
}
