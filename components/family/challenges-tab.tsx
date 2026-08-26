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
      rewardPoints,
      assignedMemberIds,
    })
    setIsCreating(false)
    toast('¡Reto familiar creado!', '🎯')
  }

  const handleCheckIn = (challenge: FamilyChallenge) => {
    const result = checkInFamilyChallenge(challenge.id)
    if (result.completedNow) {
      toast(`🏆 ¡Reto "${challenge.title}" completado! +${result.pointsAwarded} pts para todos`, '🎉')
    } else {
      toast('¡Día completado! Racha aumentada 🔥', '💪')
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
    <div className="flex flex-col gap-4">
      {/* Top Controls: Filter Pills & + Crear Reto */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-2xl bg-secondary/60 p-1 border border-border">
          <button
            onClick={() => setFilter('activos')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
              filter === 'activos'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Activos ({activeChallenges.length})
          </button>
          <button
            onClick={() => setFilter('completados')}
            className={cn(
              'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
              filter === 'completados'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Completados ({completedChallenges.length})
          </button>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Nuevo reto</span>
        </button>
      </div>

      {/* Challenges List */}
      {displayedChallenges.length === 0 ? (
        <EmptyState
          emoji={filter === 'activos' ? '🏆' : '🏅'}
          title={
            filter === 'activos'
              ? 'Sin retos activos en este momento'
              : 'Aún no hay retos completados'
          }
          description={
            filter === 'activos'
              ? 'Crea un desafío para motivar a la familia con hábitos saludables, deporte o tareas del hogar.'
              : 'Completa tus retos diarios para desbloquear recompensas y logros.'
          }
          action={filter === 'activos' ? '+ Crear primer reto' : undefined}
          onAction={filter === 'activos' ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  'relative flex flex-col justify-between p-4 transition-all hover:border-primary/40',
                  isCompleted && 'opacity-85 border-emerald-500/30'
                )}
              >
                <div>
                  {/* Category & Points header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground border border-border">
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
                        <Sparkles className="size-3 fill-amber-500" />
                        +{c.rewardPoints} pts
                      </span>
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="rounded-lg p-1 text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        title="Eliminar reto"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-extrabold text-base text-foreground tracking-tight leading-snug">
                    {c.title}
                  </h4>
                  {c.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  {/* Assigned Members */}
                  {assignedMembers.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {assignedMembers.slice(0, 4).map((m: any) => (
                          <MemberAvatar key={m.id} member={m} size="xs" ring />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {assignedMembers.length === 1
                          ? assignedMembers[0]?.name
                          : `${assignedMembers.length} participantes`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress & Action Bottom */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Flame className="size-3.5 text-orange-500" />
                      Día {c.currentDays} de {c.targetDays}
                    </span>
                    <span className={cn(isCompleted ? 'text-emerald-500' : 'text-primary')}>
                      {pct}%
                    </span>
                  </div>

                  <ProgressBar
                    value={c.currentDays}
                    max={c.targetDays}
                    className="h-2 mb-3"
                    barClassName={isCompleted ? 'bg-emerald-500' : 'bg-primary'}
                  />

                  {/* Daily Check-in Button */}
                  {!isCompleted ? (
                    <button
                      onClick={() => handleCheckIn(c)}
                      disabled={isCheckedToday}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm active:scale-95',
                        isCheckedToday
                          ? 'bg-secondary text-muted-foreground cursor-default opacity-80 border border-border'
                          : 'bg-primary text-primary-foreground hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600'
                      )}
                    >
                      {isCheckedToday ? (
                        <>
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <span>¡Completado por hoy!</span>
                        </>
                      ) : (
                        <>
                          <Flame className="size-4 text-orange-400" />
                          <span>Marcar día completado hoy</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" />
                      <span>¡Reto superado con éxito!</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL: CREAR RETO */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Crear nuevo reto familiar"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Título del reto</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. 30 min de Lectura diaria, Recoger la mesa..."
              autoFocus
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalles sobre cómo y cuándo cumplirlo..."
              className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-card resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Categoría</label>
            <div className="grid grid-cols-3 gap-2">
              {CHALLENGE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-bold transition-all border',
                    category === cat.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Duración (días)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={targetDays || ''}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Recompensa (pts)</label>
              <input
                type="number"
                min={10}
                max={5000}
                value={rewardPoints || ''}
                onChange={(e) => setRewardPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>
          </div>

          {/* Member assignment */}
          <MemberMultiSelect
            members={members}
            selectedIds={assignedMemberIds}
            onChange={setAssignedMemberIds}
            label="Participantes asignados"
          />

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateChallenge}
              disabled={!title.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
            >
              Crear reto
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
