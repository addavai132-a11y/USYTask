'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Clock,
  Dumbbell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  Timer,
  Flame,
  Layers,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/toast'
import type {
  WorkoutRoutine,
  WorkoutSession,
  WorkoutExerciseSession,
  WorkoutSet,
  SetType,
} from '@/types/fitness'
import { muscleGroupLabels } from '@/types/fitness'
import {
  getActiveWorkoutSession,
  saveActiveWorkoutSession,
  clearActiveWorkoutSession,
  getAllExercisesCatalog,
  saveCustomExercise,
  type ActiveWorkoutState,
} from '@/lib/fitness-store'
import { triggerRestTimer, FloatingRestTimer } from './floating-rest-timer'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Exercise, MuscleGroup, EquipmentType } from '@/types/fitness'
import { equipmentLabels } from '@/types/fitness'
import { Search } from 'lucide-react'

interface LiveWorkoutTabProps {
  routines: WorkoutRoutine[]
  activeRoutineForSession: WorkoutRoutine | null
  onFinishSession: (session: WorkoutSession) => void
  onClearActiveRoutine: () => void
}

function generateSetId(exerciseId: string, setIdx: number): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `set_${crypto.randomUUID()}`
  }
  return `set_${exerciseId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${setIdx}`
}

function buildInitialExercisesForRoutine(routine: WorkoutRoutine | undefined): WorkoutExerciseSession[] {
  if (!routine) return []
  return routine.exercises.map((ex) => {
    const defaultRest = ex.restSeconds || 90
    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      targetRestSeconds: defaultRest,
      sets: [
        {
          id: generateSetId(ex.id, 1),
          setNumber: 1,
          type: 'calentamiento',
          weightKg: 40,
          reps: 10,
          restSeconds: Math.min(defaultRest, 60),
          completed: false,
          prevWeightKg: 40,
          prevReps: 10,
        },
        {
          id: generateSetId(ex.id, 2),
          setNumber: 2,
          type: 'efectiva',
          weightKg: 70,
          reps: 8,
          rpe: 8,
          restSeconds: defaultRest,
          completed: false,
          prevWeightKg: 67.5,
          prevReps: 8,
        },
        {
          id: generateSetId(ex.id, 3),
          setNumber: 3,
          type: 'efectiva',
          weightKg: 75,
          reps: 6,
          rpe: 8.5,
          restSeconds: defaultRest,
          completed: false,
          prevWeightKg: 72.5,
          prevReps: 6,
        },
      ],
    }
  })
}

export function LiveWorkoutTab({
  routines,
  activeRoutineForSession,
  onFinishSession,
  onClearActiveRoutine,
}: LiveWorkoutTabProps) {
  const { toast } = useToast()
  const isHydratedRef = useRef(false)

  // ── INITIAL STATE FROM STORAGE OR DEFAULT ──
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(() => {
    if (activeRoutineForSession) return activeRoutineForSession.id
    const saved = getActiveWorkoutSession()
    if (saved && saved.routineId) return saved.routineId
    return routines[0]?.id || 'custom'
  })

  const [sessionExercises, setSessionExercises] = useState<WorkoutExerciseSession[]>(() => {
    if (activeRoutineForSession) {
      return buildInitialExercisesForRoutine(activeRoutineForSession)
    }
    const saved = getActiveWorkoutSession()
    if (saved && saved.exercises && saved.exercises.length > 0) {
      return saved.exercises
    }
    const defaultRoutine = routines[0]
    return buildInitialExercisesForRoutine(defaultRoutine)
  })

  const [sessionSeconds, setSessionSeconds] = useState<number>(() => {
    const saved = getActiveWorkoutSession()
    if (saved) {
      const now = Date.now()
      if (saved.isTimerRunning && saved.lastUpdatedMs) {
        const passedSeconds = Math.max(0, Math.floor((now - saved.lastUpdatedMs) / 1000))
        return (saved.sessionSeconds || 0) + passedSeconds
      }
      return saved.sessionSeconds || 0
    }
    return 0
  })

  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    // NUNCA arrancar automáticamente al entrar a la pantalla o modo entrenamiento
    return false
  })

  const [startTimeMs, setStartTimeMs] = useState<number>(() => {
    const saved = getActiveWorkoutSession()
    return saved?.startTimeMs || Date.now()
  })

  const [sessionNotes, setSessionNotes] = useState<string>(() => {
    const saved = getActiveWorkoutSession()
    return saved?.notes || ''
  })

  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)

  // Exercise Picker Modal & Custom Exercise Creation for Live Workout
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false)
  const [liveExerciseSearch, setLiveExerciseSearch] = useState('')
  const [liveMuscleFilter, setLiveMuscleFilter] = useState<string>('all')
  const [isCreatingCustomExLive, setIsCreatingCustomExLive] = useState(false)
  const [customExNameLive, setCustomExNameLive] = useState('')
  const [customExMuscleLive, setCustomExMuscleLive] = useState<MuscleGroup>('pecho')
  const [customExEquipmentLive, setCustomExEquipmentLive] = useState<EquipmentType>('mancuerna')
  const [customExRestLive, setCustomExRestLive] = useState('90')

  // ── REACTIVE AUTO-SAVE TO LOCALSTORAGE ──
  const persistCurrentWorkout = useCallback(
    (
      currentExercises: WorkoutExerciseSession[],
      routineId: string,
      seconds: number,
      timerRunning: boolean,
      notes: string,
      startMs: number
    ) => {
      const currentRoutine = routines.find((r) => r.id === routineId)
      const state: ActiveWorkoutState = {
        routineId,
        routineName: currentRoutine?.name || 'Entrenamiento',
        sessionSeconds: seconds,
        startTimeMs: startMs,
        lastUpdatedMs: Date.now(),
        isTimerRunning: timerRunning,
        exercises: currentExercises,
        notes,
      }
      saveActiveWorkoutSession(state)
    },
    [routines]
  )

  // Save whenever session exercises or properties change
  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true
      return
    }
    persistCurrentWorkout(
      sessionExercises,
      selectedRoutineId,
      sessionSeconds,
      isTimerRunning,
      sessionNotes,
      startTimeMs
    )
  }, [
    sessionExercises,
    selectedRoutineId,
    sessionSeconds,
    isTimerRunning,
    sessionNotes,
    startTimeMs,
    persistCurrentWorkout,
  ])

  // Handle incoming activeRoutineForSession prop from parent
  useEffect(() => {
    if (activeRoutineForSession) {
      const initialExercises = buildInitialExercisesForRoutine(activeRoutineForSession)
      setSelectedRoutineId(activeRoutineForSession.id)
      setSessionExercises(initialExercises)
      const newStart = Date.now()
      setStartTimeMs(newStart)
      setSessionSeconds(0)
      setIsTimerRunning(false)
      persistCurrentWorkout(
        initialExercises,
        activeRoutineForSession.id,
        0,
        false,
        '',
        newStart
      )
    }
  }, [activeRoutineForSession, persistCurrentWorkout])

  // ── STOPWATCH WITH REAL TIMESTAMP RECOVERY (MOBILE SCREEN OFF IMMUNE) ──
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1)
      }, 1000)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTimerRunning) {
        const saved = getActiveWorkoutSession()
        if (saved && saved.isTimerRunning && saved.lastUpdatedMs) {
          const passed = Math.max(0, Math.floor((Date.now() - saved.lastUpdatedMs) / 1000))
          setSessionSeconds((saved.sessionSeconds || 0) + passed)
        }
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [isTimerRunning])

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── HANDLERS ──
  function handleRoutineChange(newRoutineId: string) {
    setSelectedRoutineId(newRoutineId)
    const routine = routines.find((r) => r.id === newRoutineId)
    const newExercises = buildInitialExercisesForRoutine(routine)
    setSessionExercises(newExercises)
    persistCurrentWorkout(
      newExercises,
      newRoutineId,
      sessionSeconds,
      isTimerRunning,
      sessionNotes,
      startTimeMs
    )
  }

  // Add Set to Exercise
  function handleAddSet(exerciseIndex: number) {
    setSessionExercises((prev) => {
      const updated = [...prev]
      const ex = updated[exerciseIndex]
      const lastSet = ex.sets[ex.sets.length - 1]
      const newSetNumber = ex.sets.length + 1
      const defaultRest = lastSet?.restSeconds ?? ex.targetRestSeconds ?? 90
      ex.sets.push({
        id: generateSetId(ex.exerciseId, newSetNumber),
        setNumber: newSetNumber,
        type: 'efectiva',
        weightKg: lastSet ? lastSet.weightKg : 60,
        reps: lastSet ? lastSet.reps : 8,
        rpe: 8,
        restSeconds: defaultRest,
        completed: false,
        prevWeightKg: lastSet ? lastSet.weightKg : 60,
        prevReps: lastSet ? lastSet.reps : 8,
      })
      return updated
    })
  }

  // Remove Set
  function handleRemoveSet(exerciseIndex: number, setIndex: number) {
    setSessionExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter((_, i) => i !== setIndex)
      updated[exerciseIndex].sets.forEach((s, idx) => {
        s.setNumber = idx + 1
      })
      return updated
    })
  }

  // Toggle Set Complete & Trigger Persistent Floating Rest Timer with exact set rest time
  function handleToggleSetComplete(exerciseIndex: number, setIndex: number) {
    setSessionExercises((prev) => {
      const updated = [...prev]
      const targetSet = updated[exerciseIndex].sets[setIndex]
      const willBeCompleted = !targetSet.completed
      targetSet.completed = willBeCompleted

      if (willBeCompleted) {
        const restSecs = targetSet.restSeconds ?? updated[exerciseIndex].targetRestSeconds ?? 90
        const exName = updated[exerciseIndex].exerciseName
        triggerRestTimer(restSecs, `${exName} (Serie ${targetSet.setNumber})`)
        toast(`⏰ Descanso de ${restSecs}s activado para Serie ${targetSet.setNumber}`, '⏱️')
      }
      return updated
    })
  }

  // Add Exercise to Live Session
  function handleAddExerciseToLive(ex: Exercise) {
    const defaultRest = ex.restSeconds || 90
    const newExerciseSession: WorkoutExerciseSession = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      targetRestSeconds: defaultRest,
      sets: [
        {
          id: generateSetId(ex.id, 1),
          setNumber: 1,
          type: 'efectiva',
          weightKg: 40,
          reps: 10,
          restSeconds: defaultRest,
          completed: false,
          prevWeightKg: 40,
          prevReps: 10,
        },
        {
          id: generateSetId(ex.id, 2),
          setNumber: 2,
          type: 'efectiva',
          weightKg: 50,
          reps: 8,
          rpe: 8,
          restSeconds: defaultRest,
          completed: false,
          prevWeightKg: 50,
          prevReps: 8,
        },
      ],
    }
    setSessionExercises((prev) => [...prev, newExerciseSession])
    setIsAddExerciseModalOpen(false)
    toast(`✅ "${ex.name}" añadido al entreno`, '🏋️')
  }

  function handleCreateAndAddCustomExerciseLive() {
    if (!customExNameLive.trim()) {
      toast('Escribe el nombre del ejercicio personalizado', '❌')
      return
    }
    const newEx: Exercise = {
      id: `ex_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: customExNameLive.trim(),
      muscleGroup: customExMuscleLive,
      equipment: customExEquipmentLive,
      restSeconds: parseInt(customExRestLive, 10) || 90,
      isCustom: true,
    }
    saveCustomExercise(newEx)
    handleAddExerciseToLive(newEx)
    setCustomExNameLive('')
    setCustomExRestLive('90')
    setIsCreatingCustomExLive(false)
  }

  // Update Set Values (Kg, Reps, Type, RPE)
  function handleUpdateSet(
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: any
  ) {
    setSessionExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        [field]: value,
      }
      return updated
    })
  }

  // ── TOTAL CALCULATIONS ──
  const { totalVolume, totalCompletedSets, totalEffectiveSets } = useMemo(() => {
    let volume = 0
    let completedCount = 0
    let effectiveCount = 0

    sessionExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          volume += (s.weightKg || 0) * (s.reps || 0)
          completedCount++
          if (s.type === 'efectiva' || s.type === 'dropset' || s.type === 'fallo') {
            effectiveCount++
          }
        }
      })
    })

    return {
      totalVolume: volume,
      totalCompletedSets: completedCount,
      totalEffectiveSets: effectiveCount,
    }
  }, [sessionExercises])

  // ── START & PAUSE HANDLERS (EXPLICIT USER CONTROL) ──
  function handleStartSession() {
    if (sessionSeconds === 0) {
      setStartTimeMs(Date.now())
    }
    setIsTimerRunning(true)
    toast('⚡ Sesión de entrenamiento iniciada', '⏱️')
  }

  function handlePauseSession() {
    setIsTimerRunning(false)
    toast('⏸️ Cronómetro pausado', '⏸️')
  }

  // ── CLEAN RESET OF CURRENT SESSION ──
  function handleResetSession() {
    clearActiveWorkoutSession()
    const routine = routines.find((r) => r.id === selectedRoutineId) || routines[0]
    const resetExercises = buildInitialExercisesForRoutine(routine)
    setSessionExercises(resetExercises)
    setSessionSeconds(0)
    setStartTimeMs(Date.now())
    setIsTimerRunning(false)
    setSessionNotes('')
    setIsResetModalOpen(false)
    toast('Entrenamiento reiniciado y cronómetro detenido en 00:00', '🔄')
  }

  // ── FINISH SESSION & CLEAN STORAGE ──
  function handleConfirmFinishSession() {
    const routine = routines.find((r) => r.id === selectedRoutineId)
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      groupId: 'default',
      routineId: selectedRoutineId,
      routineName: routine ? routine.name : 'Entrenamiento Libre',
      date: getTodayISO(),
      startTime: new Date(startTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: sessionSeconds,
      totalVolumeKg: totalVolume,
      effectiveSetsCount: totalEffectiveSets,
      exercises: sessionExercises,
      notes: sessionNotes.trim() || undefined,
    }

    // Save to permanent history & clean active session storage
    onFinishSession(session)
    clearActiveWorkoutSession()
    onClearActiveRoutine()
    setIsFinishModalOpen(false)
    toast('🎉 ¡Entrenamiento completado y guardado permanentemente!', '🏆')
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in pb-24">
      {/* ── CABECERA CON CRONÓMETRO DE SESIÓN ACTIVA ── */}
      <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-md space-y-3 sticky top-4 z-20 dark:bg-[#121026]/90 dark:border-purple-500/30 dark:shadow-2xl dark:backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 shadow-sm dark:bg-purple-600/25 dark:border-purple-500/40 dark:text-purple-300">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                {isTimerRunning ? (
                  <>
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sesión en Vivo (En curso)</span>
                  </>
                ) : sessionSeconds > 0 ? (
                  <>
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Sesión en Pausa</span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Sesión detenida</span>
                  </>
                )}
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight font-mono">
                  {formatStopwatch(sessionSeconds)}
                </span>
                
                {/* Botón de Iniciar / Pausar / Reanudar bajo demanda manual */}
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
                    title={sessionSeconds > 0 ? 'Reanudar cronómetro' : 'Iniciar sesión de entrenamiento'}
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>{sessionSeconds > 0 ? 'Reanudar' : 'Iniciar sesión'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseSession}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="Pausar cronómetro"
                  >
                    <Pause className="size-3.5" />
                    <span>Pausar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selector de Rutina Activa */}
          <div className="w-full sm:w-60">
            <CustomSelect<string>
              value={selectedRoutineId}
              onChange={handleRoutineChange}
              options={routines.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Seleccionar rutina..."
              className="w-full"
            />
          </div>
        </div>

        {/* Resumen en vivo de volumen y series + Botón Reset & Finalizar */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-purple-500/15 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span>
              Volumen: <strong className="text-slate-900 dark:text-white font-mono">{totalVolume.toLocaleString('es-ES')} kg</strong>
            </span>
            <span>
              Series: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{totalCompletedSets} completadas</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/10 dark:text-slate-300 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
              title="Reiniciar series y descartar progreso actual"
            >
              <RotateCcw className="size-3.5" />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFinishModalOpen(true)}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Finalizar Sesión</span>
            </button>
          </div>
        </div>
      </Card>

      {/* ── TABLA DE EJERCICIOS Y REGISTRO DE SERIES PERSISTENTE ── */}
      <div className="space-y-4">
        {sessionExercises.map((exerciseSession, exIdx) => {
          const meta = muscleGroupLabels[exerciseSession.muscleGroup] || muscleGroupLabels.pecho

          return (
            <Card
              key={`${exerciseSession.exerciseId}_${exIdx}`}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 dark:bg-[#121026]/85 dark:border-purple-500/20 dark:shadow-xl dark:backdrop-blur-xl"
            >
              {/* Header del Ejercicio */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-purple-500/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {exerciseSession.exerciseName}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                      {meta.label} · Descanso objetivo: {exerciseSession.targetRestSeconds || 90}s
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    triggerRestTimer(
                      exerciseSession.targetRestSeconds || 90,
                      exerciseSession.exerciseName
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-[11px] font-bold border border-slate-300 transition-all active:scale-95 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/25"
                >
                  <Timer className="size-3 text-emerald-600 dark:text-purple-400" />
                  <span>Descanso {exerciseSession.targetRestSeconds || 90}s</span>
                </button>
              </div>

              {/* Tabla de Series con scroll horizontal garantizado en móvil */}
              <div className="overflow-x-auto no-scrollbar pb-1">
                <div className="min-w-[490px] sm:min-w-0 space-y-1.5">
                  {/* Cabecera de Columnas */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 text-center items-center">
                    <div className="col-span-1">Set</div>
                    <div className="col-span-3 min-w-[120px] text-left pl-1">Tipo</div>
                    <div className="col-span-2 min-w-[64px]">Kg</div>
                    <div className="col-span-2 min-w-[56px]">Reps</div>
                    <div className="col-span-2 min-w-[62px]">Descanso</div>
                    <div className="col-span-2 min-w-[62px]">✓</div>
                  </div>

                  {/* Filas de Series con inputs y checks persistentes */}
                  {exerciseSession.sets.map((set, setIdx) => {
                    return (
                      <div
                        key={set.id ? `${set.id}-${setIdx}` : `set-${exIdx}-${setIdx}`}
                        className={cn(
                          'grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all duration-200 text-xs font-semibold text-center',
                          set.completed
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-500/40 dark:text-emerald-100 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.15)]'
                            : 'bg-slate-50/80 border border-slate-200/90 text-slate-900 hover:bg-slate-100/90 dark:bg-white/[0.02] dark:border-white/5 dark:text-slate-200 dark:hover:bg-white/[0.04]'
                        )}
                      >
                        {/* Set Number */}
                        <div className={cn(
                          'col-span-1 font-mono font-black transition-colors',
                          set.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                        )}>
                          {set.setNumber}
                        </div>

                        {/* Tipo de Serie con portal flotante sin recorte */}
                        <div className="col-span-3 min-w-[120px]">
                          <CustomSelect<SetType>
                            value={set.type}
                            onChange={(val) => handleUpdateSet(exIdx, setIdx, 'type', val)}
                            usePortal={true}
                            options={[
                              { value: 'calentamiento', label: 'W · Calentamiento' },
                              { value: 'efectiva', label: 'S · Efectiva' },
                              { value: 'dropset', label: 'D · Drop Set' },
                              { value: 'fallo', label: 'F · Al Fallo' },
                            ]}
                            className="w-full"
                            triggerClassName={cn(
                              'py-1.5 px-2 text-[11px] rounded-lg transition-colors font-semibold truncate w-full',
                              set.completed && 'border-emerald-400 text-emerald-900 dark:text-emerald-200'
                            )}
                            panelClassName="min-w-[150px] max-w-[190px]"
                          />
                        </div>

                        {/* Kg / Peso Input */}
                        <div className="col-span-2 min-w-[64px]">
                          <input
                            type="number"
                            step="0.5"
                            value={set.weightKg === 0 ? '' : (set.weightKg ?? '')}
                            onChange={(e) =>
                              handleUpdateSet(
                                exIdx,
                                setIdx,
                                'weightKg',
                                e.target.value === '' ? ('' as any) : parseFloat(e.target.value)
                              )
                            }
                            placeholder="Kg"
                            className={cn(
                              'w-full rounded-lg border py-1.5 px-1 text-center font-mono font-bold text-xs outline-none transition-colors',
                              set.completed
                                ? 'border-emerald-400 bg-emerald-100/50 text-emerald-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500'
                            )}
                          />
                        </div>

                        {/* Reps Input */}
                        <div className="col-span-2 min-w-[56px]">
                          <input
                            type="number"
                            value={set.reps === 0 ? '' : (set.reps ?? '')}
                            onChange={(e) =>
                              handleUpdateSet(
                                exIdx,
                                setIdx,
                                'reps',
                                e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10)
                              )
                            }
                            placeholder="Reps"
                            className={cn(
                              'w-full rounded-lg border py-1.5 px-1 text-center font-mono font-bold text-xs outline-none transition-colors',
                              set.completed
                                ? 'border-emerald-400 bg-emerald-100/50 text-emerald-950 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/30 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500'
                            )}
                          />
                        </div>

                        {/* Descanso por Serie (s) Input */}
                        <div className="col-span-2 min-w-[62px] relative">
                          <input
                            type="number"
                            step="5"
                            min="0"
                            placeholder={String(exerciseSession.targetRestSeconds || 90)}
                            value={set.restSeconds ?? ''}
                            onChange={(e) =>
                              handleUpdateSet(
                                exIdx,
                                setIdx,
                                'restSeconds',
                                e.target.value === '' ? ('' as any) : parseInt(e.target.value, 10)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border py-1.5 pr-3 text-center font-mono font-bold text-xs outline-none transition-colors',
                              set.completed
                                ? 'border-emerald-400 bg-emerald-100/50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500'
                            )}
                          />
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 pointer-events-none">
                            s
                          </span>
                        </div>

                        {/* Check Complete Circular Button & Delete */}
                        <div className="col-span-2 min-w-[62px] flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                            className={cn(
                              'size-7 sm:size-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 select-none shrink-0 cursor-pointer',
                              set.completed
                                ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30'
                                : 'bg-white border border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:bg-white/[0.05] dark:border-white/20 dark:text-slate-400 dark:hover:border-purple-400 dark:hover:text-white dark:hover:bg-purple-500/10'
                            )}
                            title={set.completed ? 'Serie completada (clic para desmarcar)' : `Completar serie (inicia descanso de ${set.restSeconds ?? exerciseSession.targetRestSeconds ?? 90}s)`}
                          >
                            <Check className={cn('size-3.5 sm:size-4 stroke-[3.5] transition-transform duration-200', set.completed && 'scale-110')} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                            title="Eliminar serie"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botón + Añadir Serie */}
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-slate-900 bg-white hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 dark:border-purple-500/30 dark:bg-transparent dark:text-purple-300 dark:hover:bg-purple-500/10"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Añadir Serie</span>
              </button>
            </Card>
          )
        })}

        {/* Botón para añadir ejercicio dinámico en vivo */}
        <button
          type="button"
          onClick={() => setIsAddExerciseModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-black transition-all active:scale-95 shadow-sm dark:bg-white/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
        >
          <Plus className="size-4 text-emerald-600 dark:text-purple-400" />
          <span>+ Añadir Ejercicio a la Sesión en Vivo</span>
        </button>
      </div>

      {/* ── MODAL AÑADIR EJERCICIO EN VIVO ── */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col space-y-3 dark:bg-[#100e23] dark:border-purple-500/30">
            {/* Cabecera y Buscador (Fijos arriba) */}
            <div className="shrink-0 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-purple-500/15">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Añadir Ejercicio al Entreno</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">Selecciona o crea un ejercicio para incorporarlo a esta sesión</p>
                </div>
                <button
                  onClick={() => setIsAddExerciseModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:text-white dark:hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Botón para alternar creación de ejercicio personalizado */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCustomExLive((prev) => !prev)
                    if (!customExNameLive && liveExerciseSearch) {
                      setCustomExNameLive(liveExerciseSearch)
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all active:scale-95"
                >
                  <Plus className="size-3.5" />
                  <span>{isCreatingCustomExLive ? 'Ocultar Creador' : '+ Crear Ejercicio Personalizado'}</span>
                </button>
              </div>

              {/* Formulario de Creación de Ejercicio Personalizado en Vivo */}
              {isCreatingCustomExLive && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-fade-in text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300">✨ Nuevo Ejercicio Personalizado</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCustomExLive(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Nombre del Ejercicio <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customExNameLive}
                      onChange={(e) => setCustomExNameLive(e.target.value)}
                      placeholder="Ej. Press Guillotina, Curl Spider..."
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Músculo</label>
                      <CustomSelect<MuscleGroup>
                        value={customExMuscleLive}
                        onChange={setCustomExMuscleLive}
                        options={[
                          { value: 'pecho', label: '🏋️‍♂️ Pecho' },
                          { value: 'espalda', label: '🚣 Espalda' },
                          { value: 'hombro', label: '🎯 Hombro' },
                          { value: 'cuadriceps', label: '🦵 Cuádriceps' },
                          { value: 'isquios', label: '🏃 Isquios' },
                          { value: 'gluteo', label: '🍑 Glúteo' },
                          { value: 'biceps', label: '💪 Bíceps' },
                          { value: 'triceps', label: '⚡ Tríceps' },
                          { value: 'gemelo', label: '🦶 Gemelo' },
                          { value: 'core', label: '🛡️ Core' },
                          { value: 'cardio', label: '❤️‍🔥 Cardio' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Equipo</label>
                      <CustomSelect<EquipmentType>
                        value={customExEquipmentLive}
                        onChange={setCustomExEquipmentLive}
                        options={[
                          { value: 'mancuerna', label: 'Mancuerna' },
                          { value: 'barra', label: 'Barra' },
                          { value: 'polea', label: 'Polea' },
                          { value: 'maquina', label: 'Máquina' },
                          { value: 'peso_corporal', label: 'Peso Corporal' },
                          { value: 'kettlebell', label: 'Kettlebell' },
                          { value: 'otro', label: 'Otro' },
                        ]}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Descanso (s)</label>
                      <input
                        type="number"
                        step="5"
                        min="0"
                        value={customExRestLive}
                        onChange={(e) => setCustomExRestLive(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-bold text-center text-slate-900 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreateAndAddCustomExerciseLive}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      Añadir a esta Sesión
                    </button>
                  </div>
                </div>
              )}

              {/* Búsqueda y Filtro de Músculo */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    value={liveExerciseSearch}
                    onChange={(e) => setLiveExerciseSearch(e.target.value)}
                    placeholder="Buscar ejercicio..."
                    className="w-full rounded-full border border-slate-200 bg-white py-2 px-3 pl-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500"
                  />
                </div>

                <CustomSelect<string>
                  value={liveMuscleFilter}
                  onChange={setLiveMuscleFilter}
                  options={[
                    { value: 'all', label: 'Todos los músculos' },
                    { value: 'pecho', label: '🏋️‍♂️ Pecho' },
                    { value: 'espalda', label: '🚣 Espalda' },
                    { value: 'hombro', label: '🎯 Hombro' },
                    { value: 'cuadriceps', label: '🦵 Cuádriceps' },
                    { value: 'isquios', label: '🏃 Isquios' },
                    { value: 'gluteo', label: '🍑 Glúteo' },
                    { value: 'biceps', label: '💪 Bíceps' },
                    { value: 'triceps', label: '⚡ Tríceps' },
                    { value: 'gemelo', label: '🦶 Gemelo' },
                    { value: 'core', label: '🛡️ Core' },
                    { value: 'cardio', label: '❤️‍🔥 Cardio' },
                  ]}
                  className="w-44"
                />
              </div>
            </div>

            {/* Listado de Ejercicios */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[45vh] pb-2 custom-fitness-scroll">
              {getAllExercisesCatalog()
                .filter((ex) => {
                  if (liveMuscleFilter !== 'all' && ex.muscleGroup !== liveMuscleFilter) return false
                  if (liveExerciseSearch.trim()) {
                    const q = liveExerciseSearch.toLowerCase()
                    return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q)
                  }
                  return true
                })
                .map((ex) => {
                  const meta = muscleGroupLabels[ex.muscleGroup]
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleAddExerciseToLive(ex)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-white/[0.02] dark:border-white/10 dark:hover:bg-white/[0.06] dark:text-slate-300 text-left transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{meta?.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-xs truncate">{ex.name}</p>
                            {ex.isCustom && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase">
                                Personalizado
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {meta?.label} · {equipmentLabels[ex.equipment]} · Descanso: {ex.restSeconds || 90}s
                          </span>
                        </div>
                      </div>

                      <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shrink-0">
                        + Añadir
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN PARA REINICIAR SESIÓN ── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white dark:border-rose-500/30 dark:bg-[#100e23] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="size-10 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 flex items-center justify-center">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">¿Reiniciar sesión actual?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Se descartarán las series marcadas.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Esta acción limpiará los checks de series de la sesión actual y restablecerá el cronómetro a 00:00 (totalmente detenido hasta que pulses manualmente &quot;Iniciar sesión&quot;).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors dark:text-slate-400 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-soft transition-all active:scale-95"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE FINALIZACIÓN Y GUARDADO DE ENTRENAMIENTO ── */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white dark:border-purple-500/30 dark:bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-purple-500/15">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                Resumen del Entrenamiento
              </h3>
              <button
                onClick={() => setIsFinishModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Duración</span>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{formatStopwatch(sessionSeconds)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Volumen Total</span>
                <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalVolume.toLocaleString('es-ES')} kg</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Series Ef.</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{totalEffectiveSets}</p>
              </div>
            </div>

            {/* Notas opcionales de la sesión */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notas de la sesión / Sensaciones</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ej: Buena congestión, subí 2.5kg en press de banca..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 dark:border-purple-500/20 dark:bg-white/[0.04] p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500 h-20 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-purple-500/15 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Seguir entrenando
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishSession}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-soft transition-transform active:scale-95"
              >
                Guardar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
