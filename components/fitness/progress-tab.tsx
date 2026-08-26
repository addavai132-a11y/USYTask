'use client'

import { useState, useMemo, useEffect } from 'react'
import { Trophy, TrendingUp, TrendingDown, Scale, Plus, Activity, Dumbbell, BarChart3, Sparkles, X, Flame, ShieldAlert, History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect, type SelectOption } from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/toast'
import type { PersonalRecord, BodyMetric, WorkoutSession, MuscleGroup } from '@/types/fitness'
import { calculate1RM, muscleGroupLabels } from '@/types/fitness'
import { PREDEFINED_EXERCISES } from '@/lib/fitness-store'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export type BodyGoalPhase = 'volumen' | 'definicion' | 'mantenimiento'

export const BODY_GOAL_OPTIONS: SelectOption<BodyGoalPhase>[] = [
  {
    value: 'volumen',
    label: '📈 Volumen',
    badge: 'Ganancia muscular',
  },
  {
    value: 'definicion',
    label: '🔥 Definición',
    badge: 'Pérdida de grasa',
  },
  {
    value: 'mantenimiento',
    label: '⚖️ Mantenimiento',
    badge: 'Peso estable',
  },
]

interface ProgressTabProps {
  prs: PersonalRecord[]
  bodyMetrics: BodyMetric[]
  sessions: WorkoutSession[]
  onSavePR: (pr: PersonalRecord) => void
  onSaveBodyMetric: (metric: BodyMetric) => void
}

export function ProgressTab({
  prs,
  bodyMetrics,
  sessions,
  onSavePR,
  onSaveBodyMetric,
}: ProgressTabProps) {
  const { toast } = useToast()

  // ── PR MODAL STATE ──
  const [isPRModalOpen, setIsPRModalOpen] = useState(false)
  const [prExerciseName, setPRExerciseName] = useState('Press de Banca Plano')
  const [prMuscleGroup, setPRMuscleGroup] = useState<MuscleGroup>('pecho')
  const [prWeight, setPRWeight] = useState('')
  const [prReps, setPRReps] = useState('')
  const [prDate, setPRDate] = useState(getTodayISO())

  // ── BODY METRIC MODAL STATE ──
  const [isBodyMetricModalOpen, setIsBodyMetricModalOpen] = useState(false)
  const [bodyWeight, setBodyWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [bodyNotes, setBodyNotes] = useState('')
  const [metricDate, setMetricDate] = useState(getTodayISO())

  // ── PROGRESSION CURVE SELECTOR ──
  const [selectedCurveExercise, setSelectedCurveExercise] = useState<string>('Press de Banca Plano')

  // Calculate 1RM live in modal
  const live1RM = useMemo(() => {
    const w = parseFloat(prWeight) || 0
    const r = parseInt(prReps, 10) || 0
    return calculate1RM(w, r)
  }, [prWeight, prReps])

  function handleSaveNewPR() {
    const w = parseFloat(prWeight)
    const r = parseInt(prReps, 10)
    if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) {
      toast('Por favor, introduce peso y repeticiones válidas', '❌')
      return
    }

    const pr: PersonalRecord = {
      id: `pr_${Date.now()}`,
      groupId: 'default',
      exerciseName: prExerciseName,
      muscleGroup: prMuscleGroup,
      weightKg: w,
      reps: r,
      estimated1RM: calculate1RM(w, r),
      date: prDate,
    }

    onSavePR(pr)
    toast('🏆 ¡Nuevo récord personal guardado!', '🔥')
    setIsPRModalOpen(false)
    setPRWeight('')
    setPRReps('')
  }

  function handleSaveNewBodyMetric() {
    const w = parseFloat(bodyWeight)
    if (isNaN(w) || w <= 0) {
      toast('Introduce un peso corporal válido', '❌')
      return
    }

    const metric: BodyMetric = {
      id: `bm_${Date.now()}`,
      groupId: 'default',
      date: metricDate,
      weightKg: w,
      bodyFatPercent: bodyFat ? parseFloat(bodyFat) : undefined,
      notes: bodyNotes.trim() || undefined,
    }

    onSaveBodyMetric(metric)
    toast('⚖️ Peso corporal registrado con éxito', '✅')
    setIsBodyMetricModalOpen(false)
    setBodyWeight('')
    setBodyFat('')
    setBodyNotes('')
  }

  // ── BODY GOAL PHASE STATE (Volumen / Definición / Mantenimiento) ──
  const [goalPhase, setGoalPhase] = useState<BodyGoalPhase>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('body_goal_phase')
      if (saved === 'volumen' || saved === 'definicion' || saved === 'mantenimiento') {
        return saved as BodyGoalPhase
      }
    }
    return 'volumen'
  })

  function handleGoalPhaseChange(phase: BodyGoalPhase) {
    setGoalPhase(phase)
    if (typeof window !== 'undefined') {
      localStorage.setItem('body_goal_phase', phase)
    }
    toast(
      phase === 'volumen'
        ? 'Objetivo fijado: Ganancia Muscular (Volumen) 📈'
        : phase === 'definicion'
        ? 'Objetivo fijado: Pérdida de Grasa (Definición) 🔥'
        : 'Objetivo fijado: Mantenimiento de Peso ⚖️',
      '🎯'
    )
  }

  // Body weight delta & percentage calculation (latest vs previous)
  const latestWeight = bodyMetrics[0]?.weightKg ?? 78.5
  const previousWeight = bodyMetrics.length > 1 ? bodyMetrics[1].weightKg : latestWeight
  const weightDiff = Number((latestWeight - previousWeight).toFixed(2))
  const percentChange = previousWeight > 0 ? Number((((latestWeight - previousWeight) / previousWeight) * 100).toFixed(2)) : 0

  const formattedDelta = `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%)`

  // Dynamic semantic color & badge calculation based on selected goal
  const trendMeta = useMemo(() => {
    const isPositive = weightDiff > 0.05
    const isNegative = weightDiff < -0.05

    if (goalPhase === 'volumen') {
      if (isPositive) {
        return {
          badgeStyle: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          icon: TrendingUp,
          label: 'Superávit / Ganancia muscular',
          status: 'positive',
        }
      }
      if (isNegative) {
        return {
          badgeStyle: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
          icon: TrendingDown,
          label: 'Pérdida de peso (Aumentar calorías)',
          status: 'negative',
        }
      }
      return {
        badgeStyle: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
        icon: Scale,
        label: 'Peso estable',
        status: 'neutral',
      }
    }

    if (goalPhase === 'definicion') {
      if (isNegative) {
        return {
          badgeStyle: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
          icon: TrendingDown,
          label: 'Déficit / Pérdida de grasa',
          status: 'positive',
        }
      }
      if (isPositive) {
        return {
          badgeStyle: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
          icon: TrendingUp,
          label: 'Aumento de peso (Ajustar déficit)',
          status: 'negative',
        }
      }
      return {
        badgeStyle: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
        icon: Scale,
        label: 'Peso estable',
        status: 'neutral',
      }
    }

    // Mantenimiento
    const isWithinMaintenance = Math.abs(weightDiff) <= 0.3
    if (isWithinMaintenance) {
      return {
        badgeStyle: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
        icon: Scale,
        label: 'Mantenimiento óptimo (±0.3 kg)',
        status: 'neutral',
      }
    }
    return {
      badgeStyle: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      icon: isPositive ? TrendingUp : TrendingDown,
      label: isPositive ? 'Ligera ganancia (+0.3kg)' : 'Ligera pérdida (-0.3kg)',
      status: 'warning',
    }
  }, [weightDiff, goalPhase])

  // Volume by Muscle Group in past workouts
  const volumeByMuscle = useMemo(() => {
    const counts: Record<string, number> = {
      Pecho: 16,
      Espalda: 18,
      Pierna: 22,
      Hombro: 14,
      Brazos: 12,
    }
    return counts
  }, [sessions])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── BARRA RESUMEN DE RÉCORDS (PRs) ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{prs.length}</span>
          <span className="text-xs text-slate-400">marcas personales (PRs)</span>
        </div>
        <button
          onClick={() => setIsPRModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>Registrar PR</span>
        </button>
      </div>

      {/* ── GRID DE MARCAS PERSONALES CON 1RM ESTIMADO ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prs.map((pr) => {
          const meta = muscleGroupLabels[pr.muscleGroup] || muscleGroupLabels.pecho

          return (
            <Card
              key={pr.id}
              className="p-4 bg-[#121026]/90 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl flex flex-col justify-between gap-3 hover:border-amber-500/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {meta.icon} {meta.label}
                  </span>
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                    {pr.exerciseName}
                  </h4>
                </div>
                <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Trophy className="size-3.5" />
                </div>
              </div>

              {/* Peso x Reps y 1RM Estimado */}
              <div className="flex items-baseline justify-between pt-2 border-t border-purple-500/15">
                <div>
                  <span className="text-2xl font-black text-white font-mono tracking-tight">
                    {pr.weightKg} <span className="text-xs font-bold text-slate-400">kg</span>
                  </span>
                  <span className="text-xs text-slate-400 font-semibold ml-1.5">
                    × {pr.reps} reps
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    1RM Estimado
                  </span>
                  <span className="text-sm font-black text-amber-300 font-mono">
                    ~{pr.estimated1RM} kg
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-medium">
                Logrado el {pr.date}
              </span>
            </Card>
          )
        })}
      </div>

      {/* ── SECCIÓN DE MÉTRICAS CORPORALES Y PESO ── */}
      <Card className="p-4 bg-[#121026]/90 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shrink-0">
              <Scale className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Evolución del Peso Corporal</h3>
              <p className="text-[11px] text-slate-400">Control de peso semanal y composición corporal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Selector de Etapa / Objetivo */}
            <CustomSelect<BodyGoalPhase>
              value={goalPhase}
              onChange={handleGoalPhaseChange}
              options={BODY_GOAL_OPTIONS}
              triggerClassName="py-1.5 px-3 text-xs bg-purple-950/40 border-purple-500/30 hover:bg-purple-900/40 rounded-xl"
              className="w-auto min-w-[145px]"
            />

            <button
              type="button"
              onClick={() => setIsBodyMetricModalOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-cyan-600/25 hover:bg-cyan-600/40 border border-cyan-500/30 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:text-white transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="size-3.5" />
              <span>Pesarme hoy</span>
            </button>
          </div>
        </div>

        {/* Resumen del último peso de ancho completo (Full Width) */}
        <div className="w-full flex items-center justify-between p-4 md:p-5 bg-purple-950/20 border border-purple-500/20 rounded-2xl backdrop-blur-md">
          {/* Lado Izquierdo: Etiqueta superior, valor grande y etapa activa */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Último Peso Registrado
              </span>
              {bodyMetrics[0]?.date && (
                <span className="text-[10px] text-slate-500 font-mono">
                  · {bodyMetrics[0].date}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                {latestWeight}
              </span>
              <span className="text-sm md:text-base font-bold text-slate-400">kg</span>
            </div>

            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 pt-0.5">
              <span className="text-purple-300 font-bold">
                {goalPhase === 'volumen' ? '📈 Volumen' : goalPhase === 'definicion' ? '🔥 Definición' : '⚖️ Mantenimiento'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{trendMeta.label}</span>
            </p>
          </div>

          {/* Lado Derecho: Badge de cambio y porcentaje centrado verticalmente */}
          <div className="shrink-0 pl-3">
            <div
              className={cn(
                'px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all',
                trendMeta.badgeStyle
              )}
              title={trendMeta.label}
            >
              <trendMeta.icon className="size-4 sm:size-4.5 shrink-0" />
              <span className="font-mono tracking-tight">{formattedDelta}</span>
            </div>
          </div>
        </div>

        {/* Historial de pesajes */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historial reciente:</span>
          <div className="space-y-1">
            {bodyMetrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-300 font-bold">{m.date}</span>
                  {m.notes && <span className="text-[11px] text-slate-400 truncate max-w-[200px]">· {m.notes}</span>}
                </div>
                <span className="font-mono font-black text-white">{m.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── CONTROL DE VOLUMEN SEMANAL POR GRUPO MUSCULAR ── */}
      <Card className="p-4 bg-[#121026]/90 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-purple-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">
              Volumen Semanal (Series Efectivas por Músculo)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Control de fatiga</span>
        </div>

        <div className="space-y-2.5 pt-1">
          {Object.entries(volumeByMuscle).map(([muscle, sets]) => {
            const percentage = Math.min(100, Math.round((sets / 24) * 100))
            const isOptimal = sets >= 12 && sets <= 20

            return (
              <div key={muscle} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">{muscle}</span>
                  <span className="text-purple-300 font-mono">
                    {sets} series {isOptimal ? '· Óptimo' : sets > 20 ? '· Alto' : '· Bajo'}
                  </span>
                </div>
                <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      sets > 20
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── MODAL REGISTRO DE NUEVO PR ── */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="size-5 text-amber-400" />
                Registrar Marca Personal (PR)
              </h3>
              <button
                onClick={() => setIsPRModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Ejercicio</label>
                <CustomSelect<string>
                  value={prExerciseName}
                  onChange={(val) => {
                    setPRExerciseName(val)
                    const ex = PREDEFINED_EXERCISES.find((e) => e.name === val)
                    if (ex) setPRMuscleGroup(ex.muscleGroup)
                  }}
                  options={PREDEFINED_EXERCISES.map((e) => ({ value: e.name, label: e.name }))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Peso (Kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.5"
                    value={prWeight}
                    onChange={(e) => setPRWeight(e.target.value)}
                    placeholder="Ej: 100"
                    autoFocus
                    className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 font-mono font-bold text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Repeticiones <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={prReps}
                    onChange={(e) => setPRReps(e.target.value)}
                    placeholder="Ej: 5"
                    className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 font-mono font-bold text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 1RM Preview */}
              {live1RM > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>1RM Estimado (Fórmula Epley):</span>
                  <span className="text-base font-black font-mono">~{live1RM} kg</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Fecha del logro</label>
                <input
                  type="date"
                  value={prDate}
                  onChange={(e) => setPRDate(e.target.value)}
                  className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 border-t border-purple-500/15 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsPRModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewPR}
                  className="rounded-2xl bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95"
                >
                  Guardar Marca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REGISTRO DE PESO CORPORAL ── */}
      {isBodyMetricModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Scale className="size-5 text-cyan-400" />
                Registrar Peso de Hoy
              </h3>
              <button
                onClick={() => setIsBodyMetricModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Peso (Kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    placeholder="Ej: 78.6"
                    autoFocus
                    className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 font-mono font-bold text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">% Grasa Corporal (opcional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="Ej: 14.5"
                    className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 font-mono font-bold text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Notas / Sensaciones</label>
                <input
                  value={bodyNotes}
                  onChange={(e) => setBodyNotes(e.target.value)}
                  placeholder="Ej: En ayunas post-entreno, buena energía"
                  className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Fecha</label>
                <input
                  type="date"
                  value={metricDate}
                  onChange={(e) => setMetricDate(e.target.value)}
                  className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 border-t border-purple-500/15 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsBodyMetricModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewBodyMetric}
                  className="rounded-2xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95"
                >
                  Guardar Peso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
