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
  RotateLeft,
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
  type ActiveWorkoutState,
} from '@/lib/fitness-store'
import { triggerRestTimer, FloatingRestTimer } from './floating-rest-timer'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

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
  return routine.exercises.map((ex) => ({
    exerciseId: ex.id,
    exerciseName: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    targetRestSeconds: ex.restSeconds || 90,
    sets: [
      {
        id: generateSetId(ex.id, 1),
        setNumber: 1,
        type: 'calentamiento',
        weightKg: 40,
        reps: 10,
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
        completed: false,
        prevWeightKg: 72.5,
        prevReps: 6,
      },
    ],
  }))
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
    const saved = getActiveWorkoutSession()
    return saved ? saved.isTimerRunning : true
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
      setIsTimerRunning(true)
      persistCurrentWorkout(
        initialExercises,
        activeRoutineForSession.id,
        0,
        true,
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
      ex.sets.push({
        id: generateSetId(ex.exerciseId, newSetNumber),
        setNumber: newSetNumber,
        type: 'efectiva',
        weightKg: lastSet ? lastSet.weightKg : 60,
        reps: lastSet ? lastSet.reps : 8,
        rpe: 8,
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

  // Toggle Set Complete & Trigger Persistent Floating Rest Timer
  function handleToggleSetComplete(exerciseIndex: number, setIndex: number) {
    setSessionExercises((prev) => {
      const updated = [...prev]
      const targetSet = updated[exerciseIndex].sets[setIndex]
      const willBeCompleted = !targetSet.completed
      targetSet.completed = willBeCompleted

      if (willBeCompleted) {
        const restSecs = updated[exerciseIndex].targetRestSeconds || 90
        const exName = updated[exerciseIndex].exerciseName
        triggerRestTimer(restSecs, exName)
      }
      return updated
    })
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

  // ── CLEAN RESET OF CURRENT SESSION ──
  function handleResetSession() {
    clearActiveWorkoutSession()
    const routine = routines.find((r) => r.id === selectedRoutineId) || routines[0]
    const resetExercises = buildInitialExercisesForRoutine(routine)
    setSessionExercises(resetExercises)
    setSessionSeconds(0)
    setStartTimeMs(Date.now())
    setIsTimerRunning(true)
    setSessionNotes('')
    setIsResetModalOpen(false)
    toast('Entrenamiento reiniciado a su estado inicial', '🔄')
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
      <Card className="p-4 bg-[#121026]/90 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-xl space-y-3 sticky top-4 z-20">
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 shadow-sm animate-pulse">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                Sesión en Vivo (Guardado automático)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight font-mono">
                  {formatStopwatch(sessionSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((r) => !r)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title={isTimerRunning ? 'Pausar cronómetro' : 'Reanudar cronómetro'}
                >
                  {isTimerRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
                </button>
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
        <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between text-xs font-bold text-slate-300 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span>
              Volumen: <strong className="text-purple-300 font-mono">{totalVolume.toLocaleString('es-ES')} kg</strong>
            </span>
            <span>
              Series: <strong className="text-emerald-400 font-mono">{totalCompletedSets} completadas</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 text-slate-300 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
              title="Reiniciar series y descartar progreso actual"
            >
              <RotateCcw className="size-3.5" />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFinishModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
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
              className="p-4 bg-[#121026]/85 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl space-y-3"
            >
              {/* Header del Ejercicio */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-500/15">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-white truncate">
                      {exerciseSession.exerciseName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">
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
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/25 transition-all active:scale-95"
                >
                  <Timer className="size-3" />
                  <span>Descanso {exerciseSession.targetRestSeconds || 90}s</span>
                </button>
              </div>

              {/* Tabla de Series */}
              <div className="space-y-1.5 overflow-x-auto no-scrollbar">
                {/* Cabecera de Columnas */}
                <div className="grid grid-cols-12 gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 text-center">
                  <div className="col-span-1">Set</div>
                  <div className="col-span-3">Tipo</div>
                  <div className="col-span-2">Anterior</div>
                  <div className="col-span-2">Kg</div>
                  <div className="col-span-2">Reps</div>
                  <div className="col-span-2">✓</div>
                </div>

                {/* Filas de Series con inputs y checks persistentes */}
                {exerciseSession.sets.map((set, setIdx) => {
                  return (
                    <div
                      key={set.id ? `${set.id}-${setIdx}` : `set-${exIdx}-${setIdx}`}
                      className={cn(
                        'grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl transition-colors text-xs font-semibold text-center',
                        set.completed
                          ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                          : 'bg-white/[0.02] border border-white/5 text-slate-200'
                      )}
                    >
                      {/* Set Number */}
                      <div className="col-span-1 font-mono font-black text-slate-400">
                        {set.setNumber}
                      </div>

                      {/* Tipo de Serie */}
                      <div className="col-span-3">
                        <CustomSelect<SetType>
                          value={set.type}
                          onChange={(val) => handleUpdateSet(exIdx, setIdx, 'type', val)}
                          options={[
                            { value: 'calentamiento', label: 'W · Calentamiento' },
                            { value: 'efectiva', label: 'S · Efectiva' },
                            { value: 'dropset', label: 'D · Drop Set' },
                            { value: 'fallo', label: 'F · Al Fallo' },
                          ]}
                          triggerClassName="py-1 px-2 text-[11px] rounded-lg"
                        />
                      </div>

                      {/* Anterior (Ghost indicator) */}
                      <div className="col-span-2 font-mono text-[10px] text-slate-500 truncate">
                        {set.prevWeightKg ? `${set.prevWeightKg}k×${set.prevReps}` : '—'}
                      </div>

                      {/* Kg / Peso Input */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          value={set.weightKg ?? ''}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              setIdx,
                              'weightKg',
                              e.target.value === '' ? 0 : parseFloat(e.target.value)
                            )
                          }
                          className="w-full rounded-lg border border-purple-500/20 bg-white/[0.04] py-1 text-center font-mono font-bold text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Reps Input */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={set.reps ?? ''}
                          onChange={(e) =>
                            handleUpdateSet(
                              exIdx,
                              setIdx,
                              'reps',
                              e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                            )
                          }
                          className="w-full rounded-lg border border-purple-500/20 bg-white/[0.04] py-1 text-center font-mono font-bold text-white text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Check Complete Button */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                          className={cn(
                            'size-7 rounded-lg border flex items-center justify-center transition-all active:scale-90',
                            set.completed
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-400/40'
                              : 'bg-white/[0.05] border-white/20 text-slate-400 hover:border-purple-500 hover:text-white'
                          )}
                          title={set.completed ? 'Serie completada' : 'Marcar como completada'}
                        >
                          <Check className="size-4 stroke-[3]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exIdx, setIdx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar serie"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Botón + Añadir Serie */}
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="size-3.5" />
                <span>Añadir Serie</span>
              </button>
            </Card>
          )
        })}
      </div>

      {/* ── MODAL DE CONFIRMACIÓN PARA REINICIAR SESIÓN ── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-[#100e23] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="size-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">¿Reiniciar sesión actual?</h4>
                <p className="text-xs text-slate-400">Se descartarán las series marcadas.</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Esta acción limpiará los checks de series de la sesión actual y restablecerá el cronómetro a 0.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-soft transition-all active:scale-95"
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
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-400" />
                Resumen del Entrenamiento
              </h3>
              <button
                onClick={() => setIsFinishModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duración</span>
                <p className="text-lg font-black text-white font-mono mt-0.5">{formatStopwatch(sessionSeconds)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Volumen Total</span>
                <p className="text-lg font-black text-purple-300 font-mono mt-0.5">{totalVolume.toLocaleString('es-ES')} kg</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Series Ef.</span>
                <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{totalEffectiveSets}</p>
              </div>
            </div>

            {/* Notas opcionales de la sesión */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Notas de la sesión / Sensaciones</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ej: Buena congestión, subí 2.5kg en press de banca..."
                className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] p-3 text-xs text-white outline-none focus:border-purple-500 h-20 resize-none"
              />
            </div>

            <div className="pt-2 border-t border-purple-500/15 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white"
              >
                Seguir entrenando
              </button>
              <button
                type="button"
                onClick={handleConfirmFinishSession}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-2.5 text-xs font-black text-white shadow-soft transition-transform active:scale-95"
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
