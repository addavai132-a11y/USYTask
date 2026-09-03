// Fitness Store - Local Storage and initial data provider for Salud & Fitness module

import type {
  WorkoutRoutine,
  Exercise,
  WorkoutSession,
  WorkoutExerciseSession,
  PersonalRecord,
  BodyMetric,
  DailyMealLog,
  NutritionGoal,
  MuscleGroup,
} from '@/types/fitness'
import { calculate1RM } from '@/types/fitness'
import { getTodayISO, getDayOfWeekFromDate } from '@/lib/date-utils'
import { scheduleCloudSync } from './cloud-sync'

export const ROUTINES_KEY = 'usytask_fitness_routines'
export const SESSIONS_KEY = 'usytask_fitness_sessions'
export const PRS_KEY = 'usytask_fitness_prs'
export const BODY_METRICS_KEY = 'usytask_fitness_body_metrics'
export const NUTRITION_GOAL_KEY = 'usytask_fitness_nutrition_goal'
export const MEAL_LOGS_KEY = 'usytask_fitness_meal_logs'
export const ACTIVE_WORKOUT_KEY = 'usytask_active_workout_session'
export const REST_TIMER_KEY = 'usytask_active_rest_timer'
export const CUSTOM_EXERCISES_KEY = 'usytask_fitness_custom_exercises'

export interface ActiveWorkoutState {
  routineId: string
  routineName?: string
  sessionSeconds: number
  startTimeMs: number
  lastUpdatedMs: number
  isTimerRunning: boolean
  exercises: WorkoutExerciseSession[]
  notes?: string
}

export interface RestTimerState {
  targetEndTime: number
  totalSeconds: number
  isPaused: boolean
  remainingSecondsWhenPaused?: number
  exerciseName?: string
}

function loadArray<T>(key: string, defaultSeed: T[] = []): T[] {
  if (typeof window === 'undefined') return defaultSeed
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) {
      if (defaultSeed.length > 0) {
        localStorage.setItem(key, JSON.stringify(defaultSeed))
      }
      return defaultSeed
    }
    return JSON.parse(raw)
  } catch {
    return defaultSeed
  }
}

function saveArray<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
    scheduleCloudSync()
  } catch (err) {
    console.error('Error saving fitness data to localStorage', err)
  }
}

// ── EXERCISE CATALOG ──
export const PREDEFINED_EXERCISES: Exercise[] = [
  // Pecho
  { id: 'ex_bench_press', name: 'Press de Banca Plano', muscleGroup: 'pecho', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 120, notes: 'Retracción escapular y leg drive activo' },
  { id: 'ex_inc_db_press', name: 'Press Inclinado con Mancuernas', muscleGroup: 'pecho', equipment: 'mancuerna', targetRpeRir: 'RPE 8.5', restSeconds: 90, notes: 'Banco a 30 grados, control en la bajada' },
  { id: 'ex_chest_dips', name: 'Fondos en Paralelas (Pecho)', muscleGroup: 'pecho', equipment: 'peso_corporal', targetRpeRir: 'RIR 1-2', restSeconds: 90, notes: 'Ligera inclinación hacia adelante' },
  { id: 'ex_cable_crossover', name: 'Cruces en Polea Media/Alta', muscleGroup: 'pecho', equipment: 'polea', targetRpeRir: 'RIR 1', restSeconds: 60, notes: 'Aguantar 1s la contracción máxima' },
  { id: 'ex_chest_press_mach', name: 'Press en Máquina Convergente', muscleGroup: 'pecho', equipment: 'maquina', targetRpeRir: 'RPE 9', restSeconds: 90 },

  // Espalda
  { id: 'ex_deadlift', name: 'Peso Muerto Convencional', muscleGroup: 'espalda', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 180, notes: 'Espalda neutra, empuje fuerte desde los talones' },
  { id: 'ex_barbell_row', name: 'Remo con Barra 45° (Pendlay/Bent-over)', muscleGroup: 'espalda', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 90, notes: 'Tirar con los codos hacia la cadera' },
  { id: 'ex_pull_ups', name: 'Dominadas Pronas / Neutras', muscleGroup: 'espalda', equipment: 'peso_corporal', targetRpeRir: 'RIR 1-2', restSeconds: 120, notes: 'Rango completo desde bloqueo' },
  { id: 'ex_lat_pulldown', name: 'Jalón al Pecho en Polea', muscleGroup: 'espalda', equipment: 'polea', targetRpeRir: 'RIR 1', restSeconds: 75, notes: 'Pecho erguido, sin balanceo excesivo' },
  { id: 'ex_seated_cable_row', name: 'Remo Gironda en Polea Baja', muscleGroup: 'espalda', equipment: 'polea', targetRpeRir: 'RPE 8.5', restSeconds: 75 },

  // Hombro
  { id: 'ex_ohp', name: 'Press Militar de Pie', muscleGroup: 'hombro', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 120, notes: 'Glúteos y core compactos, bloqueo arriba' },
  { id: 'ex_db_lat_raise', name: 'Elevaciones Laterales con Mancuerna', muscleGroup: 'hombro', equipment: 'mancuerna', targetRpeRir: 'Al fallo', restSeconds: 60, notes: 'Subir hasta la altura del hombro sin trampas' },
  { id: 'ex_cable_lat_raise', name: 'Elevaciones Laterales en Polea', muscleGroup: 'hombro', equipment: 'polea', targetRpeRir: 'RIR 0-1', restSeconds: 60, notes: 'Tensión continua en todo el rango' },
  { id: 'ex_face_pull', name: 'Face Pulls en Polea', muscleGroup: 'hombro', equipment: 'polea', targetRpeRir: 'RIR 2', restSeconds: 60, notes: 'Salud de manguito rotador y deltoides posterior' },

  // Pierna (Cuádriceps, Isquios, Glúteo, Gemelo)
  { id: 'ex_squat', name: 'Sentadilla Trasera con Barra', muscleGroup: 'cuadriceps', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 180, notes: 'Romper el paralelo, rodillas alineadas con puntas' },
  { id: 'ex_leg_press', name: 'Prensa Inclinada 45°', muscleGroup: 'cuadriceps', equipment: 'maquina', targetRpeRir: 'RPE 8.5', restSeconds: 120, notes: 'Pies a anchura media, bajar profundo sin despegar lumbar' },
  { id: 'ex_quad_ext', name: 'Extensiones de Cuádriceps', muscleGroup: 'cuadriceps', equipment: 'maquina', targetRpeRir: 'Al fallo', restSeconds: 60, notes: 'Pausa isométrica de 1s arriba' },
  { id: 'ex_romanian_deadlift', name: 'Peso Muerto Rumano', muscleGroup: 'isquios', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 90, notes: 'Empujar cadera atrás, sentir estiramiento de isquios' },
  { id: 'ex_lying_leg_curl', name: 'Curl Femoral Tumbado', muscleGroup: 'isquios', equipment: 'maquina', targetRpeRir: 'RIR 1', restSeconds: 60 },
  { id: 'ex_hip_thrust', name: 'Hip Thrust con Barra', muscleGroup: 'gluteo', equipment: 'barra', targetRpeRir: 'RPE 8.5', restSeconds: 90, notes: 'Bloqueo pélvico arriba con contracción glútea' },
  { id: 'ex_calf_raise', name: 'Elevación de Talones de Pie', muscleGroup: 'gemelo', equipment: 'maquina', targetRpeRir: 'Al fallo', restSeconds: 45, notes: 'Pausa de 2s en máxima elongación' },

  // Brazos (Bíceps & Tríceps)
  { id: 'ex_bb_curl', name: 'Curl de Bíceps con Barra Z', muscleGroup: 'biceps', equipment: 'barra', targetRpeRir: 'RIR 1', restSeconds: 60 },
  { id: 'ex_inc_db_curl', name: 'Curl Inclinado con Mancuernas', muscleGroup: 'biceps', equipment: 'mancuerna', targetRpeRir: 'RIR 1', restSeconds: 60, notes: 'Máximo estiramiento de la cabeza larga' },
  { id: 'ex_hammer_curl', name: 'Curl Martillo Cruzado', muscleGroup: 'biceps', equipment: 'mancuerna', targetRpeRir: 'RIR 0-1', restSeconds: 60 },
  { id: 'ex_tricep_pushdown', name: 'Extensiones de Tríceps en Polea (Cuerda)', muscleGroup: 'triceps', equipment: 'polea', targetRpeRir: 'Al fallo', restSeconds: 60 },
  { id: 'ex_skull_crushers', name: 'Press Francés con Barra Z', muscleGroup: 'triceps', equipment: 'barra', targetRpeRir: 'RPE 8', restSeconds: 75 },

  // Core & Cardio
  { id: 'ex_hanging_leg_raise', name: 'Elevaciones de Piernas Colgado', muscleGroup: 'core', equipment: 'peso_corporal', targetRpeRir: 'RIR 1', restSeconds: 60 },
  { id: 'ex_ab_wheel', name: 'Rueda Abdominal (Ab Wheel)', muscleGroup: 'core', equipment: 'otro', targetRpeRir: 'RPE 8', restSeconds: 60 },
  { id: 'ex_treadmill_hiit', name: 'Cardio HIIT / Cinta Inclinada', muscleGroup: 'cardio', equipment: 'maquina', notes: '20 min a pulsaciones zona 3-4' },
]

export function getCustomExercises(): Exercise[] {
  return loadArray<Exercise>(CUSTOM_EXERCISES_KEY, [])
}

export function saveCustomExercise(exercise: Exercise): Exercise[] {
  const custom = getCustomExercises()
  const idx = custom.findIndex((e) => e.id === exercise.id || e.name.toLowerCase() === exercise.name.toLowerCase())
  if (idx >= 0) {
    custom[idx] = { ...exercise, isCustom: true }
  } else {
    custom.unshift({ ...exercise, isCustom: true })
  }
  saveArray(CUSTOM_EXERCISES_KEY, custom)
  return custom
}

export function deleteCustomExercise(id: string): Exercise[] {
  const custom = getCustomExercises().filter((e) => e.id !== id)
  saveArray(CUSTOM_EXERCISES_KEY, custom)
  return custom
}

export function getAllExercisesCatalog(): Exercise[] {
  const custom = getCustomExercises()
  return [...custom, ...PREDEFINED_EXERCISES]
}

// ── INITIAL DEFAULT ROUTINES ──
export const INITIAL_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine_push_a',
    groupId: 'default',
    name: '⚡ Empuje A (Pecho, Hombro, Tríceps)',
    description: 'Enfoque en fuerza e hipertrofia de empuje con press de banca y militar.',
    category: 'push_pull_legs',
    createdAt: new Date().toISOString(),
    exercises: [
      PREDEFINED_EXERCISES[0], // Press Banca
      PREDEFINED_EXERCISES[1], // Press Inclinado Mancuernas
      PREDEFINED_EXERCISES[10], // Press Militar
      PREDEFINED_EXERCISES[11], // Elevaciones Laterales
      PREDEFINED_EXERCISES[24], // Tríceps Cuerda
    ],
  },
  {
    id: 'routine_pull_a',
    groupId: 'default',
    name: '🚣 Tirón A (Espalda, Bíceps, Posterior)',
    description: 'Espalda densa y amplia con dominadas y remo con barra.',
    category: 'push_pull_legs',
    createdAt: new Date().toISOString(),
    exercises: [
      PREDEFINED_EXERCISES[7], // Dominadas
      PREDEFINED_EXERCISES[6], // Remo con Barra
      PREDEFINED_EXERCISES[8], // Jalón al Pecho
      PREDEFINED_EXERCISES[13], // Face Pulls
      PREDEFINED_EXERCISES[21], // Curl Barra Z
    ],
  },
  {
    id: 'routine_legs_a',
    groupId: 'default',
    name: '🦵 Pierna Enfoque Cuádriceps & Isquios',
    description: 'Sentadilla pesada, prensa y peso muerto rumano.',
    category: 'push_pull_legs',
    createdAt: new Date().toISOString(),
    exercises: [
      PREDEFINED_EXERCISES[14], // Sentadilla
      PREDEFINED_EXERCISES[15], // Prensa 45°
      PREDEFINED_EXERCISES[17], // PM Rumano
      PREDEFINED_EXERCISES[18], // Curl Femoral
      PREDEFINED_EXERCISES[20], // Gemelos
    ],
  },
  {
    id: 'routine_torso_b',
    groupId: 'default',
    name: '🏆 Torso Hipertrofia & Brazos',
    description: 'Trabajo estético completo para pecho, espalda, deltoides y brazos.',
    category: 'torso_pierna',
    createdAt: new Date().toISOString(),
    exercises: [
      PREDEFINED_EXERCISES[1], // Inclinado Mancuernas
      PREDEFINED_EXERCISES[9], // Remo Gironda
      PREDEFINED_EXERCISES[12], // Laterales Polea
      PREDEFINED_EXERCISES[22], // Curl Inclinado
      PREDEFINED_EXERCISES[25], // Press Francés
    ],
  },
]

// ── INITIAL DEFAULT PRs ──
export const INITIAL_PRS: PersonalRecord[] = [
  {
    id: 'pr_bench',
    groupId: 'default',
    exerciseName: 'Press de Banca Plano',
    muscleGroup: 'pecho',
    weightKg: 100,
    reps: 5,
    estimated1RM: calculate1RM(100, 5), // 117 kg
    date: '2026-08-20',
  },
  {
    id: 'pr_squat',
    groupId: 'default',
    exerciseName: 'Sentadilla Trasera con Barra',
    muscleGroup: 'cuadriceps',
    weightKg: 130,
    reps: 4,
    estimated1RM: calculate1RM(130, 4), // 147 kg
    date: '2026-08-18',
  },
  {
    id: 'pr_deadlift',
    groupId: 'default',
    exerciseName: 'Peso Muerto Convencional',
    muscleGroup: 'espalda',
    weightKg: 160,
    reps: 3,
    estimated1RM: calculate1RM(160, 3), // 176 kg
    date: '2026-08-15',
  },
  {
    id: 'pr_ohp',
    groupId: 'default',
    exerciseName: 'Press Militar de Pie',
    muscleGroup: 'hombro',
    weightKg: 65,
    reps: 6,
    estimated1RM: calculate1RM(65, 6), // 78 kg
    date: '2026-08-22',
  },
  {
    id: 'pr_pullups',
    groupId: 'default',
    exerciseName: 'Dominadas con Lastre',
    muscleGroup: 'espalda',
    weightKg: 25,
    reps: 6,
    estimated1RM: calculate1RM(25, 6),
    date: '2026-08-19',
  },
]

// ── INITIAL SESSIONS ──
export const INITIAL_SESSIONS: WorkoutSession[] = [
  {
    id: 'session_1',
    groupId: 'default',
    routineId: 'routine_push_a',
    routineName: '⚡ Empuje A (Pecho, Hombro, Tríceps)',
    date: '2026-08-24',
    startTime: '18:30',
    endTime: '19:45',
    durationSeconds: 4500, // 75 min
    totalVolumeKg: 8450,
    effectiveSetsCount: 16,
    exercises: [
      {
        exerciseId: 'ex_bench_press',
        exerciseName: 'Press de Banca Plano',
        muscleGroup: 'pecho',
        equipment: 'barra',
        sets: [
          { id: 's1', setNumber: 1, type: 'calentamiento', weightKg: 60, reps: 10, completed: true },
          { id: 's2', setNumber: 2, type: 'efectiva', weightKg: 90, reps: 8, rpe: 8, completed: true, prevWeightKg: 87.5, prevReps: 8 },
          { id: 's3', setNumber: 3, type: 'efectiva', weightKg: 95, reps: 6, rpe: 8.5, completed: true, prevWeightKg: 92.5, prevReps: 6 },
          { id: 's4', setNumber: 4, type: 'efectiva', weightKg: 100, reps: 5, rpe: 9, completed: true, prevWeightKg: 95, prevReps: 5 },
        ],
      },
    ],
  },
  {
    id: 'session_2',
    groupId: 'default',
    routineId: 'routine_pull_a',
    routineName: '🚣 Tirón A (Espalda, Bíceps, Posterior)',
    date: '2026-08-22',
    startTime: '19:00',
    endTime: '20:10',
    durationSeconds: 4200,
    totalVolumeKg: 9100,
    effectiveSetsCount: 18,
    exercises: [],
  },
  {
    id: 'session_3',
    groupId: 'default',
    routineId: 'routine_legs_a',
    routineName: '🦵 Pierna Enfoque Cuádriceps & Isquios',
    date: '2026-08-20',
    startTime: '10:30',
    endTime: '11:50',
    durationSeconds: 4800,
    totalVolumeKg: 11200,
    effectiveSetsCount: 17,
    exercises: [],
  },
]

// ── INITIAL BODY METRICS ──
export const INITIAL_BODY_METRICS: BodyMetric[] = [
  { id: 'bm_1', groupId: 'default', date: '2026-08-10', weightKg: 78.4, bodyFatPercent: 14.8, notes: 'Inicio de fase de volumen limpio' },
  { id: 'bm_2', groupId: 'default', date: '2026-08-17', weightKg: 78.8, bodyFatPercent: 14.7, notes: 'Buenas sensaciones y fuerza' },
  { id: 'bm_3', groupId: 'default', date: '2026-08-24', weightKg: 79.1, bodyFatPercent: 14.6, notes: 'Peso en ayunas post entreno de piernas' },
]

// ── INITIAL NUTRITION GOAL & LOGS ──
export const DEFAULT_NUTRITION_GOAL: NutritionGoal = {
  targetCalories: 2650,
  targetProtein: 165,
  targetCarbs: 320,
  targetFats: 70,
}

export const INITIAL_MEAL_LOGS: DailyMealLog[] = [
  {
    id: 'meal_1',
    groupId: 'default',
    date: getTodayISO(),
    mealType: 'desayuno',
    items: [
      { id: 'i1', name: 'Avena con leche de almendras y frutos rojos', calories: 420, protein: 18, carbs: 64, fats: 8, quantity: '100g' },
      { id: 'i2', name: 'Tortilla de 3 huevos + 2 claras', calories: 260, protein: 28, carbs: 2, fats: 16, quantity: '1 ración' },
    ],
  },
  {
    id: 'meal_2',
    groupId: 'default',
    date: getTodayISO(),
    mealType: 'almuerzo',
    items: [
      { id: 'i3', name: 'Pechuga de pollo a la plancha', calories: 310, protein: 54, carbs: 0, fats: 7, quantity: '200g' },
      { id: 'i4', name: 'Arroz jazmín cocido', calories: 340, protein: 7, carbs: 74, fats: 1, quantity: '250g' },
      { id: 'i5', name: 'Verduras salteadas con AOVE', calories: 120, protein: 3, carbs: 12, fats: 6, quantity: '150g' },
    ],
  },
  {
    id: 'meal_3',
    groupId: 'default',
    date: getTodayISO(),
    mealType: 'merienda',
    items: [
      { id: 'i6', name: 'Batido de proteína Whey con plátano y crema de cacahuete', calories: 380, protein: 32, carbs: 42, fats: 9, quantity: '1 shake' },
    ],
  },
  {
    id: 'meal_4',
    groupId: 'default',
    date: getTodayISO(),
    mealType: 'cena',
    items: [
      { id: 'i7', name: 'Lomo de salmón al horno con patata asada', calories: 520, protein: 40, carbs: 38, fats: 22, quantity: '220g' },
      { id: 'i8', name: 'Ensalada mixta con aguacate', calories: 180, protein: 3, carbs: 8, fats: 14, quantity: '1 bol' },
    ],
  },
]

// ── STORE ACCESSORS ──

// Routines
export function getAllRoutines(): WorkoutRoutine[] {
  return loadArray<WorkoutRoutine>(ROUTINES_KEY, INITIAL_ROUTINES)
}

export function saveRoutine(routine: WorkoutRoutine): void {
  const all = getAllRoutines()
  const idx = all.findIndex((r) => r.id === routine.id)
  if (idx >= 0) {
    all[idx] = routine
  } else {
    all.unshift(routine)
  }
  saveArray(ROUTINES_KEY, all)
}

export function deleteRoutine(routineId: string): WorkoutRoutine[] {
  const all = getAllRoutines().filter((r) => r.id !== routineId)
  saveArray(ROUTINES_KEY, all)
  return all
}

// Workout Sessions
export function getAllSessions(): WorkoutSession[] {
  return loadArray<WorkoutSession>(SESSIONS_KEY, INITIAL_SESSIONS)
}

export function saveSession(session: WorkoutSession): void {
  const all = getAllSessions()
  const idx = all.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    all[idx] = session
  } else {
    all.unshift(session)
  }
  saveArray(SESSIONS_KEY, all)
}

export function deleteSession(sessionId: string): void {
  const all = getAllSessions().filter((s) => s.id !== sessionId)
  saveArray(SESSIONS_KEY, all)
}

// PRs
export function getAllPRs(): PersonalRecord[] {
  return loadArray<PersonalRecord>(PRS_KEY, INITIAL_PRS)
}

export function savePR(pr: PersonalRecord): void {
  const all = getAllPRs()
  const idx = all.findIndex((p) => p.exerciseName.toLowerCase() === pr.exerciseName.toLowerCase())
  if (idx >= 0) {
    all[idx] = pr
  } else {
    all.unshift(pr)
  }
  saveArray(PRS_KEY, all)
}

// Body Metrics
export function getAllBodyMetrics(): BodyMetric[] {
  return loadArray<BodyMetric>(BODY_METRICS_KEY, INITIAL_BODY_METRICS)
}

export function saveBodyMetric(metric: BodyMetric): void {
  const all = getAllBodyMetrics()
  const idx = all.findIndex((m) => m.date === metric.date)
  if (idx >= 0) {
    all[idx] = metric
  } else {
    all.unshift(metric)
  }
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  saveArray(BODY_METRICS_KEY, all)
}

// Nutrition
export function getNutritionGoal(): NutritionGoal {
  if (typeof window === 'undefined') return DEFAULT_NUTRITION_GOAL
  try {
    const raw = localStorage.getItem(NUTRITION_GOAL_KEY)
    if (!raw) return DEFAULT_NUTRITION_GOAL
    return JSON.parse(raw)
  } catch {
    return DEFAULT_NUTRITION_GOAL
  }
}

export function saveNutritionGoal(goal: NutritionGoal): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NUTRITION_GOAL_KEY, JSON.stringify(goal))
    scheduleCloudSync()
  } catch (err) {
    console.error('Error saving nutrition goal', err)
  }
}

export function getAllMealLogs(dateOrDay?: string): DailyMealLog[] {
  try {
    const loaded = loadArray<DailyMealLog>(MEAL_LOGS_KEY, INITIAL_MEAL_LOGS)
    if (!dateOrDay) return loaded
    return loaded.filter((m) => m.date === dateOrDay || m.dayOfWeek === dateOrDay)
  } catch (err) {
    console.error('Error loading meal logs from store:', err)
    return INITIAL_MEAL_LOGS
  }
}

export function saveMealItem(
  dateISO: string,
  mealType: DailyMealLog['mealType'],
  item: DailyMealLog['items'][0],
  dayOfWeek?: string
): void {
  try {
    if (!item || !item.name) {
      console.warn('saveMealItem: Item inválido o sin nombre', item)
      return
    }
    const all = loadArray<DailyMealLog>(MEAL_LOGS_KEY, INITIAL_MEAL_LOGS)
    let mealLog = all.find((m) => {
      if (m.mealType !== mealType) return false
      if (dayOfWeek) {
        return m.dayOfWeek === dayOfWeek
      }
      return m.date === dateISO
    })

    const sanitizedItem = {
      ...item,
      calories: Math.max(0, Math.round(Number(item.calories) || 0)),
      protein: Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(item.carbs) || 0) * 10) / 10),
      fats: Math.max(0, Math.round((Number(item.fats) || 0) * 10) / 10),
    }

    if (!mealLog) {
      mealLog = {
        id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        groupId: 'default',
        date: dateISO,
        dayOfWeek: dayOfWeek as any,
        mealType: mealType || 'desayuno',
        items: [sanitizedItem],
      }
      all.push(mealLog)
    } else {
      if (!Array.isArray(mealLog.items)) {
        mealLog.items = []
      }
      if (dayOfWeek && !mealLog.dayOfWeek) {
        mealLog.dayOfWeek = dayOfWeek as any
      }
      mealLog.items.push(sanitizedItem)
    }
    saveArray(MEAL_LOGS_KEY, all)
  } catch (err) {
    console.error('Error saving meal item in fitness-store:', err)
  }
}

export function deleteMealItem(
  dateISO: string,
  mealType: DailyMealLog['mealType'],
  itemId: string,
  dayOfWeek?: string
): void {
  try {
    if (!itemId) {
      console.warn('deleteMealItem: itemId no proporcionado')
      return
    }
    const all = loadArray<DailyMealLog>(MEAL_LOGS_KEY, INITIAL_MEAL_LOGS)
    let modified = false

    all.forEach((m) => {
      if (Array.isArray(m.items) && m.items.some((i) => i.id === itemId)) {
        m.items = m.items.filter((i) => i.id !== itemId)
        modified = true
      }
    })

    if (modified) {
      saveArray(MEAL_LOGS_KEY, all)
    }
  } catch (err) {
    console.error('Error deleting meal item in fitness-store:', err)
  }
}

/**
 * Clears all food items for a specific meal intake (e.g. Desayuno, Almuerzo, etc.) on a selected day or date.
 */
export function clearMealLog(
  mealType: DailyMealLog['mealType'],
  dayOfWeek?: string,
  dateISO?: string
): void {
  try {
    const all = loadArray<DailyMealLog>(MEAL_LOGS_KEY, INITIAL_MEAL_LOGS)
    let modified = false

    all.forEach((m) => {
      const matchType = m.mealType === mealType
      let matchDay = false
      if (dayOfWeek) {
        matchDay = Boolean(m.dayOfWeek === dayOfWeek || (m.date && getDayOfWeekFromDate(m.date) === dayOfWeek))
      } else if (dateISO) {
        matchDay = m.date === dateISO
      } else {
        matchDay = true
      }

      if (matchType && matchDay && Array.isArray(m.items) && m.items.length > 0) {
        m.items = []
        modified = true
      }
    })

    if (modified) {
      saveArray(MEAL_LOGS_KEY, all)
    }
  } catch (err) {
    console.error('Error clearing meal log in fitness-store:', err)
  }
}

/**
 * Permanently deletes all meal records associated with a custom meal section across all days.
 */
export function deleteMealLogsBySection(sectionId: string): void {
  try {
    const all = loadArray<DailyMealLog>(MEAL_LOGS_KEY, INITIAL_MEAL_LOGS)
    const updated = all.filter((m) => m.mealType !== sectionId)
    saveArray(MEAL_LOGS_KEY, updated)
  } catch (err) {
    console.error('Error deleting meal logs for section:', err)
  }
}

// ── ACTIVE WORKOUT SESSION PERSISTENCE ──
export function getActiveWorkoutSession(): ActiveWorkoutState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_WORKOUT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error reading active workout session from localStorage', err)
    return null
  }
}

export function saveActiveWorkoutSession(state: ActiveWorkoutState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Error saving active workout session to localStorage', err)
  }
}

export function clearActiveWorkoutSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ACTIVE_WORKOUT_KEY)
  } catch (err) {
    console.error('Error clearing active workout session from localStorage', err)
  }
}

// ── REST TIMER PERSISTENCE (TARGET END TIME METHOD) ──
export function getRestTimer(): RestTimerState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(REST_TIMER_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error reading rest timer from localStorage', err)
    return null
  }
}

export function saveRestTimer(state: RestTimerState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REST_TIMER_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Error saving rest timer to localStorage', err)
  }
}

export function clearRestTimer(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(REST_TIMER_KEY)
  } catch (err) {
    console.error('Error clearing rest timer from localStorage', err)
  }
}

// ── AUDIO & HAPTIC NOTIFICATIONS FOR COMPLETED REST ──
export function playTimerCompletionSound(): void {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    const playTone = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(0.25, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + duration)
    }

    playTone(now, 880, 0.15) // A5
    playTone(now + 0.18, 880, 0.15) // A5
    playTone(now + 0.36, 1174.66, 0.35) // D6
  } catch {
    // Audio autoplay or permissions limitation
  }
}

export function triggerHapticFeedback(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200])
    } catch {}
  }
}
