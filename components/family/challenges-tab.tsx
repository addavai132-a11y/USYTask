'use client'

import { useState } from 'react'
import { Plus, Trophy, CheckCircle2, Sparkles, Flame, Calendar, Trash2, Tag, Clock, Users } from 'lucide-react'
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
    if (!title.trim()) return
    addFamilyChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      targetDays,
      currentDays: 0,
      rewardPoints,
      assignedMemberIds,
      status: 'en_progreso',
    })
    setIsCreating(false)
    toast('Reto familiar creado', '🎯')
  }

  const handleCheckIn = (challenge: FamilyChallenge) => {
    const result = checkInFamilyChallenge(challenge.id)
    if (result.completedNow) {
      toast(`¡Reto "${challenge.title}" completado! +${result.pointsAwarded} pts`, '🎉')
    } else {
      toast('Día completado para el reto', '✨')
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
                ? 'bg-purple-600 text-white shadow-sm'
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
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Completados ({completedChallenges.length})
          </button>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
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
          action={filter === 'activos' ? '+ Crear primer reto' : undefined}
          onAction={filter === 'activos' ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedChallenges.map((c) => {
            const catInfo = CHALLENGE_CATEGORIES.find((cat) => cat.id === c.category) || CHALLENGE_CATEGORIES[0]
            const isCheckedToday = c.lastCheckedDate === today
            const isCompleted = c.status === 'completado'
            const pct = Math.min(100, Math.round((c.currentDays / c.targetDays) * 100))
            const assignedMembers = c.assignedMemberIds.map((id) => getMemberById(id)).filter(Boolean)

            return (
              <Card
                key={c.id}
                className={cn(
                  'p-4 bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all rounded-2xl flex flex-col justify-between gap-3 shadow-sm',
                  isCompleted && 'opacity-75 border-purple-500/20'
                )}
              >
                <div>
                  {/* Category & Points header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">
                      {catInfo.label}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 tabular-nums">
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

                  {/* Title & Description */}
                  <h4 className="font-bold text-sm text-white tracking-tight leading-snug">
                    {c.title}
                  </h4>
                  {c.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}
                </div>

                {/* Progress & Actions Footer */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                    <span>
                      Progreso: <strong className="text-white">{c.currentDays}</strong> de {c.targetDays} días
                    </span>
                    <span className="font-bold text-purple-300">{pct}%</span>
                  </div>

                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center -space-x-1.5">
                      {assignedMembers.map((m) => (
                        <div key={m!.id} title={m!.name}>
                          <MemberAvatar member={m!} size="sm" ring />
                        </div>
                      ))}
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => handleCheckIn(c)}
                        disabled={isCheckedToday}
                        className={cn(
                          'flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                          isCheckedToday
                            ? 'bg-white/[0.04] text-slate-400 border border-white/5 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm active:scale-95'
                        )}
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>{isCheckedToday ? 'Cumplido hoy' : 'Completar día'}</span>
                      </button>
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
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Descripción / Reglas (opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre cómo conseguirlo..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500 resize-none"
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Categoría</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CHALLENGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'rounded-xl py-2 text-xs font-bold border transition-all truncate text-center',
                    category === cat.id
                      ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
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
              className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Guardar reto
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
