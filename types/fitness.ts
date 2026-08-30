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
  pecho: { label: 'Pecho', icon: '🏋️‍♂️', color: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20' },
  espalda: { label: 'Espalda', icon: '🚣', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
  hombro: { label: 'Hombro', icon: '🎯', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
  biceps: { label: 'Bíceps', icon: '💪', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  triceps: { label: 'Tríceps', icon: '⚡', color: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20' },
  cuadriceps: { label: 'Cuádriceps', icon: '🦵', color: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20' },
  isquios: { label: 'Isquios', icon: '🏃', color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  gluteo: { label: 'Glúteo', icon: '🍑', color: 'text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-500/10 dark:border-pink-500/20' },
  gemelo: { label: 'Gemelo', icon: '🦶', color: 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-500/10 dark:border-teal-500/20' },
  core: { label: 'Core / Abdomen', icon: '🛡️', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20' },
  cardio: { label: 'Cardio', icon: '❤️‍🔥', color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' },
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
  isCustom?: boolean
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
  restSeconds?: number // Tiempo de descanso específico tras esta serie en segundos (ej. 60, 90, 180, 240)
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
  grams?: number
  calories100g?: number
  protein100g?: number
  carbs100g?: number
  fats100g?: number
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

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

export interface DailyMealLog {
  id: string
  groupId: string
  date: string
  dayOfWeek?: DayOfWeek
  mealType: MealType
  items: MealItem[]
}

// 1RM Estimator helper (Epley formula)
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  if (reps <= 0 || weightKg <= 0) return 0
  return Math.round(weightKg * (1 + reps / 30))
}
