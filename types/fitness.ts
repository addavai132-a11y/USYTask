// Types for Salud & Fitness Module

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombro'
  | 'biceps'
  | 'triceps'
  | 'cuadriceps'
  | 'isquios'
  | 'gluteo'
  | 'gemelo'
  | 'core'
  | 'cardio'

export const muscleGroupLabels: Record<MuscleGroup, { label: string; icon: string; color: string }> = {
  pecho: { label: 'Pecho', icon: '🏋️‍♂️', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  espalda: { label: 'Espalda', icon: '🚣', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  hombro: { label: 'Hombro', icon: '🎯', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  biceps: { label: 'Bíceps', icon: '💪', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  triceps: { label: 'Tríceps', icon: '⚡', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  cuadriceps: { label: 'Cuádriceps', icon: '🦵', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  isquios: { label: 'Isquios', icon: '🏃', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  gluteo: { label: 'Glúteo', icon: '🍑', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  gemelo: { label: 'Gemelo', icon: '🦶', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  core: { label: 'Core / Abdomen', icon: '🛡️', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  cardio: { label: 'Cardio', icon: '❤️‍🔥', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export type EquipmentType =
  | 'barra'
  | 'mancuerna'
  | 'polea'
  | 'maquina'
  | 'peso_corporal'
  | 'kettlebell'
  | 'otro'

export const equipmentLabels: Record<EquipmentType, string> = {
  barra: 'Barra',
  mancuerna: 'Mancuernas',
  polea: 'Polea',
  maquina: 'Máquina',
  peso_corporal: 'Peso Corporal',
  kettlebell: 'Kettlebell',
  otro: 'Otro equipo',
}

export type SetType = 'calentamiento' | 'efectiva' | 'dropset' | 'fallo'

export const setTypeLabels: Record<SetType, { label: string; badge: string; color: string }> = {
  calentamiento: { label: 'Calentamiento', badge: 'W', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  efectiva: { label: 'Serie Efectiva', badge: 'S', color: 'bg-purple-600/25 text-purple-200 border-purple-500/30' },
  dropset: { label: 'Drop Set', badge: 'D', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  fallo: { label: 'Al Fallo', badge: 'F', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
}

export type RoutineCategory =
  | 'push_pull_legs'
  | 'torso_pierna'
  | 'fullbody'
  | 'hipertrofia'
  | 'fuerza'
  | 'cardio'
  | 'personalizada'

export const routineCategoryLabels: Record<RoutineCategory, string> = {
  push_pull_legs: 'Push / Pull / Legs (PPL)',
  torso_pierna: 'Torso / Pierna',
  fullbody: 'Fullbody (Cuerpo Completo)',
  hipertrofia: 'Hipertrofia Específica',
  fuerza: 'Fuerza / Powerlifting',
  cardio: 'Cardio / Resistencia',
  personalizada: 'Personalizada',
}

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: EquipmentType
  targetRpeRir?: string
  restSeconds?: number
  notes?: string
}

export interface WorkoutRoutine {
  id: string
  groupId: string
  name: string
  description?: string
  category: RoutineCategory
  exercises: Exercise[]
  isArchived?: boolean
  createdAt?: string
}

export interface WorkoutSet {
  id: string
  setNumber: number
  type: SetType
  weightKg: number
  reps: number
  rpe?: number
  completed: boolean
  prevWeightKg?: number
  prevReps?: number
}

export interface WorkoutExerciseSession {
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  equipment: EquipmentType
  targetRestSeconds?: number
  sets: WorkoutSet[]
  notes?: string
}

export interface WorkoutSession {
  id: string
  groupId: string
  routineId?: string
  routineName: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime?: string
  durationSeconds: number
  totalVolumeKg: number
  effectiveSetsCount: number
  exercises: WorkoutExerciseSession[]
  notes?: string
}

export interface PersonalRecord {
  id: string
  groupId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  weightKg: number
  reps: number
  estimated1RM: number
  date: string
}

export interface BodyMetric {
  id: string
  groupId: string
  date: string
  weightKg: number
  bodyFatPercent?: number
  notes?: string
}

export interface NutritionGoal {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFats: number
  weightKg?: number
  heightCm?: number
  age?: number
  gender?: 'hombre' | 'mujer'
  activityLevel?: 'sedentario' | 'ligero' | 'moderado' | 'alto'
  goalPhase?: 'definicion' | 'volumen' | 'mantenimiento'
  goalPace?: 'conservador' | 'moderado' | 'agresivo' | 'limpio' | 'estandar'
  targetWeightKg?: number
}

export interface MealItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  quantity?: string
}

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'pre_post' | string

export interface MealSection {
  id: string
  name: string
  icon: string
  isDefault?: boolean
}

export const DEFAULT_MEAL_SECTIONS: MealSection[] = [
  { id: 'desayuno', name: 'Desayuno', icon: '🍳', isDefault: true },
  { id: 'almuerzo', name: 'Almuerzo / Comida', icon: '🥗', isDefault: true },
  { id: 'merienda', name: 'Merienda', icon: '🥪', isDefault: true },
  { id: 'cena', name: 'Cena', icon: '🍲', isDefault: true },
  { id: 'pre_post', name: 'Pre / Post Entreno', icon: '⚡', isDefault: true },
]

export const mealTypeLabels: Record<string, { label: string; icon: string }> = {
  desayuno: { label: 'Desayuno', icon: '🍳' },
  almuerzo: { label: 'Almuerzo / Comida', icon: '🥗' },
  merienda: { label: 'Merienda', icon: '🥪' },
  cena: { label: 'Cena', icon: '🍲' },
  pre_post: { label: 'Pre / Post Entreno', icon: '⚡' },
}

export interface DailyMealLog {
  id: string
  groupId: string
  date: string
  mealType: MealType
  items: MealItem[]
}

// 1RM Estimator helper (Epley formula)
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  if (reps <= 0 || weightKg <= 0) return 0
  return Math.round(weightKg * (1 + reps / 30))
}
