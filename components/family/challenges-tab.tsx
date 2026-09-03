'use client'

import { useState, useEffect } from 'react'
import { Plus, Trophy, CheckCircle2, Trash2, Timer } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProgressBar } from '@/components/ui/progress-bar'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { CHALLENGE_CATEGORIES, type FamilyChallenge, type ChallengeCategory } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { cleanExpiredCompletedChallenges, CHALLENGE_EXPIRATION_MS } from '@/lib/family-store'
import { cn } from '@/lib/utils'

export function ChallengesTab() {
  const { toast } = useToast()
  const {
    familyChallenges,
    members,
    getMemberById,
    addFamilyChallenge,
    deleteFamilyChallenge,
    checkInFamilyChallenge,
    adjustFamilyChallengeDays,
    confirmDelete,
  } = useApp()

  const [filter, setFilter] = useState<'activos' | 'completados'>('activos')
  const [isCreating, setIsCreating] = useState(false)
  const [now, setNow] = useState<number>(Date.now())

  useEffect(() => {
    cleanExpiredCompletedChallenges()
    const interval = setInterval(() => {
      setNow(Date.now())
      cleanExpiredCompletedChallenges()
    }, 30000) // prune every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ChallengeCategory>('hábitos')
  const [targetDays, setTargetDays] = useState<string>('7')
  const [rewardPoints, setRewardPoints] = useState<string>('150')
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([])

  const today = getTodayISO()

  const activeChallenges = familyChallenges.filter((c) => c.status !== 'completado')
  const completedChallenges = familyChallenges
    .filter((c) => {
      if (c.status !== 'completado') return false
      const completedTime = new Date(c.completedAt || (c as any).updatedAt || (c as any).date || 0).getTime()
      if (isNaN(completedTime) || completedTime === 0) return true
      return (now - completedTime) <= CHALLENGE_EXPIRATION_MS
    })
    .map((c) => {
      const completedTime = new Date(c.completedAt || (c as any).updatedAt || (c as any).date || 0).getTime()
      const minutesRemaining = !isNaN(completedTime) && completedTime > 0
        ? Math.max(1, Math.ceil((CHALLENGE_EXPIRATION_MS - (now - completedTime)) / 60000))
        : 30
      return {
        ...c,
        minutesRemaining,
      }
    })
  const displayedChallenges = filter === 'activos' ? activeChallenges : completedChallenges

  const handleOpenCreateModal = () => {
    setTitle('')
    setDescription('')
    setCategory('hábitos')
    setTargetDays('7')
    setRewardPoints('150')
    setAssignedMemberIds(members.map((m) => m.id))
    setIsCreating(true)
  }

  const handleCreateChallenge = () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast('Por favor, escribe un título para el reto', '❌')
      return
    }

    if (assignedMemberIds.length === 0) {
      toast('Debes seleccionar al menos un integrante participante para el reto', '⚠️')
      return
    }

    const parsedRewardPoints = parseInt(rewardPoints, 10)
    if (isNaN(parsedRewardPoints) || parsedRewardPoints < 10) {
      toast('Los puntos de recompensa deben ser como mínimo 10', '⚠️')
      return
    }

    addFamilyChallenge({
      title: cleanTitle,
      description: description.trim(),
      category,
      targetDays: Math.max(1, Number(targetDays) || 7),
      currentDays: 0,
      rewardPoints: parsedRewardPoints,
      assignedMemberIds,
      status: 'en_progreso',
    })
    setIsCreating(false)
    toast('Reto familiar creado correctamente', '🎯')
  }

  const handleCheckIn = (challenge: FamilyChallenge) => {
    handleAdjustDays(challenge, 1)
  }

  const handleAdjustDays = (challenge: FamilyChallenge, delta: number) => {
    const isDoneToday = challenge.lastCheckedDate === today || (Array.isArray(challenge.checkInDates) && challenge.checkInDates.includes(today))
    if (delta > 0 && isDoneToday) {
      toast('Este reto ya ha sido completado en el día de hoy', '⚠️')
      return
    }

    const result = adjustFamilyChallengeDays(challenge.id, delta)
    if (result.alreadyDoneToday) {
      toast('Este reto ya ha sido completado en el día de hoy', '⚠️')
      return
    }

    if (result.completedNow) {
      toast(`¡Reto "${challenge.title}" completado! +${result.pointsAwarded} pts`, '🎉')
    } else if (delta > 0) {
      toast(`Progreso de hoy registrado (+1 día: ${(challenge.currentDays || 0) + 1}/${challenge.targetDays})`, '✨')
    } else {
      toast(`Progreso ajustado (${Math.max(0, (challenge.currentDays || 0) - 1)}/${challenge.targetDays})`, '↩️')
    }
  }

  const handleDelete = (id: string, challengeTitle: string) => {
    confirmDelete({
      title: '¿Eliminar reto familiar?',
      itemName: challengeTitle,
      description: 'El progreso acumulado y los puntos asignados a este reto se borrarán.',
      confirmText: 'Eliminar Reto',
      onConfirm: () => {
        deleteFamilyChallenge(id)
        toast(`Reto "${challengeTitle}" eliminado`, '🗑️')
      },
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Top Header Controls ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
          <button
            onClick={() => setFilter('activos')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-black transition-all',
              filter === 'activos'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Activos ({activeChallenges.length})
          </button>
          <button
            onClick={() => setFilter('completados')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-black transition-all',
              filter === 'completados'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Completados ({completedChallenges.length})
          </button>
        </div>

        <div className="flex justify-end sm:ml-auto">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Nuevo reto</span>
          </button>
        </div>
      </div>

      {filter === 'completados' && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          <Timer className="size-3.5 shrink-0" />
          <span>Los retos completados se eliminan automáticamente tras 30 minutos de su finalización.</span>
        </div>
      )}

      {/* ── Challenges List ── */}
      {displayedChallenges.length === 0 ? (
        <EmptyState
          emoji={filter === 'activos' ? '🎯' : '✅'}
          title={
            filter === 'activos'
              ? 'Sin retos activos en este momento.'
              : 'Sin retos completados en los últimos 30 minutos.'
          }
          description={
            filter === 'activos'
              ? 'Crea un nuevo reto familiar para motivar hábitos y tareas conjuntas.'
              : 'Los retos completados hace más de 30 minutos se han eliminado automáticamente.'
          }
          action={filter === 'activos' ? '+ Añadir primer reto' : undefined}
          onAction={filter === 'activos' ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayedChallenges.map((c) => {
            const isCompleted = c.status === 'completado'
            const isDoneToday = c.lastCheckedDate === today || (Array.isArray(c.checkInDates) && c.checkInDates.includes(today))
            const assignedMembers = c.assignedMemberIds.map((id) => getMemberById(id)).filter(Boolean)

            return (
              <Card
                key={c.id}
                className={cn(
                  'p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col gap-3 shadow-sm',
                  isCompleted && 'opacity-85'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                      <Trophy className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white tracking-tight leading-snug">
                          {c.title}
                        </h4>
                        <span className="rounded-md bg-emerald-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                          {c.category}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 tabular-nums">
                      +{c.rewardPoints} pts
                    </span>
                    <button
                      onClick={() => handleDelete(c.id, c.title)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Eliminar reto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Members */}
                <div className="space-y-2 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Progreso:</span>
                    <span className="text-emerald-300 tabular-nums">
                      {c.currentDays || 0} / {c.targetDays} días ({Math.round(((c.currentDays || 0) / c.targetDays) * 100)}%)
                    </span>
                  </div>

                  <ProgressBar value={c.currentDays || 0} max={c.targetDays} className="h-2" />

                  {/* Footer Row */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs flex-wrap sm:flex-nowrap">
                    <div className="flex items-center -space-x-1.5">
                      {assignedMembers.map((m) => (
                        <div key={m!.id} title={m!.name}>
                          <MemberAvatar member={m!} size="sm" ring />
                        </div>
                      ))}
                    </div>

                    {!isCompleted ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustDays(c, -1)}
                          disabled={(c.currentDays || 0) <= 0}
                          className="size-7 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-90 border border-white/10 text-xs font-bold"
                          title="Restar 1 día"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustDays(c, 1)}
                          disabled={isDoneToday}
                          className={cn(
                            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-sm',
                            isDoneToday
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-not-allowed opacity-90'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                          )}
                          title={isDoneToday ? 'Ya has completado este reto hoy' : 'Añadir 1 día'}
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>{isDoneToday ? '¡Hecho hoy!' : '+1 Día'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Timer className="size-2.5" />
                          <span>Expira en {(c as any).minutesRemaining ?? 30}m</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="size-3.5" />
                          <span>Completado 🎉</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL: CREAR RETO ── */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Crear nuevo reto familiar"
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Título del reto <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Caminar 30 min, Leer 10 páginas, Ordenar habitación..."
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Descripción / Reglas (opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre cómo conseguirlo..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Días objetivo</label>
              <input
                type="number"
                min={1}
                max={365}
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                placeholder="7"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Puntos de recompensa (mín. 10)</label>
              <input
                type="number"
                min={10}
                step={10}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                placeholder="150"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CHALLENGE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as ChallengeCategory)}
                    className={cn(
                      'rounded-xl border py-2.5 px-2.5 text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm',
                      isSelected
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-black ring-2 ring-emerald-400/40'
                        : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span className={isSelected ? 'text-slate-950 font-black' : ''}>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <MemberMultiSelect
              members={members}
              selectedIds={assignedMemberIds}
              onChange={setAssignedMemberIds}
              label="Integrantes participantes *"
            />
            {assignedMemberIds.length === 0 && (
              <p className="text-[11px] font-semibold text-rose-400 mt-1">
                * Debes seleccionar al menos un integrante
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!title.trim() || assignedMemberIds.length === 0}
              onClick={handleCreateChallenge}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Guardar reto
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
