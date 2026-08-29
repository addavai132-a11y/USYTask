'use client'

import { useState } from 'react'
import { Plus, Trophy, CheckCircle2, Trash2 } from 'lucide-react'
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

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ChallengeCategory>('hábitos')
  const [targetDays, setTargetDays] = useState<number>(7)
  const [rewardPoints, setRewardPoints] = useState<number>(100)
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([])

  const today = getTodayISO()

  const activeChallenges = familyChallenges.filter((c) => c.status !== 'completado')
  const completedChallenges = familyChallenges.filter((c) => c.status === 'completado')
  const displayedChallenges = filter === 'activos' ? activeChallenges : completedChallenges

  const handleOpenCreateModal = () => {
    setTitle('')
    setDescription('')
    setCategory('hábitos')
    setTargetDays(7)
    setRewardPoints(150)
    setAssignedMemberIds(members.map((m) => m.id))
    setIsCreating(true)
  }

  const handleCreateChallenge = () => {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast('Por favor, escribe un título para el reto', '❌')
      return
    }

    const assigned = assignedMemberIds.length > 0 ? assignedMemberIds : members.map((m) => m.id)

    addFamilyChallenge({
      title: cleanTitle,
      description: description.trim(),
      category,
      targetDays: Math.max(1, Number(targetDays) || 7),
      currentDays: 0,
      rewardPoints: Math.max(10, Number(rewardPoints) || 100),
      assignedMemberIds: assigned,
      status: 'en_progreso',
    })
    setIsCreating(false)
    toast('Reto familiar creado correctamente', '🎯')
  }

  const handleCheckIn = (challenge: FamilyChallenge) => {
    const result = checkInFamilyChallenge(challenge.id)
    if (result.completedNow) {
      toast(`¡Reto "${challenge.title}" completado! +${result.pointsAwarded} pts`, '🎉')
    } else {
      toast(`Día añadido al reto (${(challenge.currentDays || 0) + 1}/${challenge.targetDays})`, '✨')
    }
  }

  const handleAdjustDays = (challenge: FamilyChallenge, delta: number) => {
    const result = adjustFamilyChallengeDays(challenge.id, delta)
    if (result.completedNow) {
      toast(`¡Reto "${challenge.title}" completado! +${result.pointsAwarded} pts`, '🎉')
    } else if (delta > 0) {
      toast(`+1 día añadido (${(challenge.currentDays || 0) + 1}/${challenge.targetDays})`, '✨')
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
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
          <button
            onClick={() => setFilter('activos')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-bold transition-all',
              filter === 'activos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Activos ({activeChallenges.length})
          </button>
          <button
            onClick={() => setFilter('completados')}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-bold transition-all',
              filter === 'completados'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Completados ({completedChallenges.length})
          </button>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Nuevo reto</span>
        </button>
      </div>

      {/* ── Challenges List ── */}
      {displayedChallenges.length === 0 ? (
        <EmptyState
          emoji={filter === 'activos' ? '🎯' : '✅'}
          title={
            filter === 'activos'
              ? 'Sin retos activos en este momento.'
              : 'Aún no hay retos completados.'
          }
          action={filter === 'activos' ? '+ Añadir primer reto' : undefined}
          onAction={filter === 'activos' ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayedChallenges.map((c) => {
            const isCompleted = c.status === 'completado'
            const assignedMembers = c.assignedMemberIds.map((id) => getMemberById(id)).filter(Boolean)

            return (
              <Card
                key={c.id}
                className={cn(
                  'p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col gap-3 shadow-sm',
                  isCompleted && 'opacity-70'
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
                        <span className="rounded-md bg-white/[0.04] border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 capitalize">
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
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                          title="Añadir 1 día"
                        >
                          <CheckCircle2 className="size-3.5" />
                          <span>+1 Día</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        <span>Completado 🎉</span>
                      </span>
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
                onChange={(e) => setTargetDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Puntos de recompensa</label>
              <input
                type="number"
                min={10}
                step={10}
                value={rewardPoints}
                onChange={(e) => setRewardPoints(Math.max(10, parseInt(e.target.value, 10) || 10))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CHALLENGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as ChallengeCategory)}
                  className={cn(
                    'rounded-xl border py-2 px-2 text-center text-xs font-bold transition-all',
                    category === cat.id
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <MemberMultiSelect
            members={members}
            selectedIds={assignedMemberIds}
            onChange={setAssignedMemberIds}
            label="Integrantes participantes"
          />

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
              onClick={handleCreateChallenge}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Guardar reto
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
