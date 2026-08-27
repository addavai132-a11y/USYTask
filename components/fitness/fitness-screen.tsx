'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScreenHeader } from '@/components/shared/screen-header'
import { PillTabs } from '@/components/ui/pill-tabs'
import { RoutinesTab } from './routines-tab'
import { LiveWorkoutTab } from './live-workout-tab'
import { ProgressTab } from './progress-tab'
import { NutritionTab } from './nutrition-tab'
import { useApp } from '@/components/app/app-context'
import type {
  WorkoutRoutine,
  WorkoutSession,
  PersonalRecord,
  BodyMetric,
  DailyMealLog,
  NutritionGoal,
  MealType,
  MealItem,
} from '@/types/fitness'
import { calculate1RM } from '@/types/fitness'
import {
  getAllRoutines,
  saveRoutine,
  deleteRoutine,
  getAllSessions,
  saveSession,
  getAllPRs,
  savePR,
  getAllBodyMetrics,
  saveBodyMetric,
  getNutritionGoal,
  saveNutritionGoal,
  getAllMealLogs,
  saveMealItem,
  deleteMealItem,
} from '@/lib/fitness-store'
import { getTodayISO } from '@/lib/date-utils'

type FitnessSubTab = 'rutinas' | 'live' | 'progreso' | 'nutricion'

export function FitnessScreen() {
  const { activeGroup, addEvent } = useApp()
  const todayISO = getTodayISO()

  const [subTab, setSubTab] = useState<FitnessSubTab>('rutinas')

  // Fitness State
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [prs, setPRs] = useState<PersonalRecord[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(getNutritionGoal())
  const [mealLogs, setMealLogs] = useState<DailyMealLog[]>([])

  // Active routine passed from Routines tab into Live Workout tab
  const [activeRoutineForSession, setActiveRoutineForSession] = useState<WorkoutRoutine | null>(null)

  // Load all fitness data on mount
  const refreshData = useCallback(() => {
    setRoutines(getAllRoutines())
    setSessions(getAllSessions())
    setPRs(getAllPRs())
    setBodyMetrics(getAllBodyMetrics())
    setNutritionGoal(getNutritionGoal())
    setMealLogs(getAllMealLogs(todayISO))
  }, [todayISO])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // ── ROUTINES HANDLERS ──
  function handleSaveRoutine(routine: WorkoutRoutine) {
    saveRoutine(routine)
    refreshData()
  }

  function handleDeleteRoutine(id: string) {
    if (activeRoutineForSession?.id === id) {
      setActiveRoutineForSession(null)
    }
    const updated = deleteRoutine(id)
    setRoutines(updated)
  }

  function handleStartSessionWithRoutine(routine: WorkoutRoutine) {
    setActiveRoutineForSession(routine)
    setSubTab('live')
  }

  // ── SESSIONS HANDLERS ──
  function handleFinishSession(session: WorkoutSession) {
    saveSession(session)

    // Check and update PRs automatically if higher estimated 1RM is achieved
    session.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.completed && set.weightKg > 0 && set.reps > 0) {
          const estimated = calculate1RM(set.weightKg, set.reps)
          const existingPR = prs.find((p) => p.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase())
          if (!existingPR || estimated > existingPR.estimated1RM) {
            savePR({
              id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              groupId: activeGroup?.id || 'default',
              exerciseName: ex.exerciseName,
              muscleGroup: ex.muscleGroup,
              weightKg: set.weightKg,
              reps: set.reps,
              estimated1RM: estimated,
              date: session.date,
            })
          }
        }
      })
    })

    // Sincronización con Actividades y Calendario
    if (activeGroup) {
      addEvent(
        `🏋️‍♂️ ${session.routineName} (${Math.round(session.durationSeconds / 60)} min · ${session.totalVolumeKg.toLocaleString('es-ES')} kg)`,
        session.date,
        session.startTime || '18:00',
        'Deporte',
        [],
        'Gimnasio'
      )
    }

    refreshData()
    setSubTab('progreso')
  }

  // ── PR & BODY METRIC HANDLERS ──
  function handleSavePR(pr: PersonalRecord) {
    savePR(pr)
    refreshData()
  }

  function handleSaveBodyMetric(metric: BodyMetric) {
    saveBodyMetric(metric)
    refreshData()
  }

  // ── NUTRITION HANDLERS ──
  function handleSaveGoal(goal: NutritionGoal) {
    saveNutritionGoal(goal)
    setNutritionGoal(goal)
  }

  function handleAddMealItem(mealType: MealType, item: MealItem) {
    saveMealItem(todayISO, mealType, item)
    refreshData()
  }

  function handleDeleteMealItem(mealType: MealType, itemId: string) {
    deleteMealItem(todayISO, mealType, itemId)
    refreshData()
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Header Principal Centrado ── */}
      <ScreenHeader
        title="Salud & Fitness"
        subtitle="Entrenamientos, sobrecarga progresiva, marcas personales y nutrición"
        centered
      />

      {/* ── Sub-barra Superior de Pestañas (Segmented Control) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<FitnessSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'rutinas', label: '🏋️ Rutinas' },
            { id: 'live', label: '⚡ Modo Entreno' },
            { id: 'progreso', label: '📈 Progreso y Marcas' },
            { id: 'nutricion', label: '🥗 Nutrición' },
          ]}
        />
      </div>

      {/* ── Vistas Principales del Módulo ── */}
      {subTab === 'rutinas' && (
        <RoutinesTab
          routines={routines}
          onSaveRoutine={handleSaveRoutine}
          onDeleteRoutine={handleDeleteRoutine}
          onStartSessionWithRoutine={handleStartSessionWithRoutine}
        />
      )}

      {subTab === 'live' && (
        <LiveWorkoutTab
          routines={routines}
          activeRoutineForSession={activeRoutineForSession}
          onFinishSession={handleFinishSession}
          onClearActiveRoutine={() => setActiveRoutineForSession(null)}
        />
      )}

      {subTab === 'progreso' && (
        <ProgressTab
          prs={prs}
          bodyMetrics={bodyMetrics}
          sessions={sessions}
          onSavePR={handleSavePR}
          onSaveBodyMetric={handleSaveBodyMetric}
        />
      )}

      {subTab === 'nutricion' && (
        <NutritionTab
          nutritionGoal={nutritionGoal}
          mealLogs={mealLogs}
          bodyMetrics={bodyMetrics}
          onSaveGoal={handleSaveGoal}
          onAddMealItem={handleAddMealItem}
          onDeleteMealItem={handleDeleteMealItem}
          onSaveBodyMetric={handleSaveBodyMetric}
        />
      )}
    </div>
  )
}
