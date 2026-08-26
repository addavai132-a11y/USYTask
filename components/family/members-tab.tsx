'use client'

import { useState } from 'react'
import { Plus, Star, Flame, Settings, PlusCircle, MinusCircle, User, ShieldCheck, Sparkles, X, Check, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { MEMBER_COLORS, type Member, type FamilyRole } from '@/types'
import { cn } from '@/lib/utils'

export function MembersTab() {
  const { toast } = useToast()
  const { members, currentMember, addMember, updateMember, adjustMemberPoints, openQuickAdd } = useApp()

  // Modals state
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [pointsAdjustMember, setPointsAdjustMember] = useState<Member | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)

  // Points adjust form state
  const [pointsDelta, setPointsDelta] = useState<number>(50)
  const [pointsReason, setPointsReason] = useState<string>('')
  const [isSubtract, setIsSubtract] = useState<boolean>(false)

  // Add Member form state
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'adult' | 'child'>('adult')
  const [newMemberColorIdx, setNewMemberColorIdx] = useState(0)

  // Edit Member form state
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<string>('adult')
  const [editColorIdx, setEditColorIdx] = useState(0)

  const handleOpenAdjustPoints = (m: Member) => {
    setPointsAdjustMember(m)
    setPointsDelta(50)
    setIsSubtract(false)
    setPointsReason('')
  }

  const handleSaveAdjustPoints = () => {
    if (!pointsAdjustMember) return
    const delta = isSubtract ? -Math.abs(pointsDelta) : Math.abs(pointsDelta)
    adjustMemberPoints(pointsAdjustMember.id, delta, pointsReason.trim() || 'Ajuste manual')
    toast(
      `${delta >= 0 ? '+' : ''}${delta} pts para ${pointsAdjustMember.name}`,
      delta >= 0 ? '⭐' : '📉'
    )
    setPointsAdjustMember(null)
  }

  const handleOpenEditMember = (m: Member) => {
    setEditingMember(m)
    setEditName(m.name)
    setEditRole(m.role || 'adult')
    const cIdx = MEMBER_COLORS.findIndex((c) => c.value === m.avatarColor)
    setEditColorIdx(cIdx >= 0 ? cIdx : 0)
  }

  const handleSaveEditMember = () => {
    if (!editingMember || !editName.trim()) return
    const chosenColor = MEMBER_COLORS[editColorIdx % MEMBER_COLORS.length]
    updateMember(editingMember.id, {
      name: editName.trim(),
      role: editRole as any,
      avatarColor: chosenColor.value,
      colorVar: chosenColor.var,
      initials: editName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    })
    toast('Perfil de miembro actualizado', '👤')
    setEditingMember(null)
  }

  const handleCreateMember = () => {
    if (!newMemberName.trim()) return
    addMember(newMemberName.trim(), newMemberColorIdx)
    toast(`¡Bienvenido/a ${newMemberName}!`, '🎉')
    setNewMemberName('')
    setNewMemberRole('adult')
    setIsAddingMember(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-foreground">Integrantes del Hogar</h3>
          <p className="text-xs text-muted-foreground font-medium">Gestiona roles, rachas y balances de puntos</p>
        </div>
        <button
          onClick={() => setIsAddingMember(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Añadir miembro</span>
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Sin miembros en este grupo"
          description="Añade a los integrantes de tu hogar para empezar a ganar puntos y cumplir retos."
          action="+ Añadir primer miembro"
          onAction={() => setIsAddingMember(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {members.map((m) => {
            const level = Math.floor((m.points || 0) / 200) + 1
            const progressToNextLevel = ((m.points || 0) % 200) / 2
            const isAdult = m.role === 'adult' || m.role === 'adulto'
            const isChild = m.role === 'child' || m.role === 'hijo'

            return (
              <Card
                key={m.id}
                className={cn(
                  'relative overflow-hidden p-4 transition-all hover:border-primary/40',
                  m.id === currentMember?.id && 'ring-1 ring-primary/50'
                )}
              >
                {/* Top Badge: Level & Role */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MemberAvatar member={m} size="lg" ring />
                      <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black ring-2 ring-card shadow-sm">
                        {level}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-base text-foreground tracking-tight">{m.name}</h4>
                        {m.isOwner && (
                          <span title="Propietario del espacio">
                            <ShieldCheck className="size-3.5 text-primary" />
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider',
                          isAdult
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : isChild
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        )}
                      >
                        {isAdult ? 'Adulto' : isChild ? 'Hijo/a' : 'Invitado'}
                      </span>
                    </div>
                  </div>

                  {/* Settings / Adjust buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAdjustPoints(m)}
                      className="flex size-8 items-center justify-center rounded-xl bg-secondary/80 text-foreground transition-all hover:bg-secondary active:scale-90"
                      title="Sumar o restar puntos"
                    >
                      <Sparkles className="size-4 text-amber-500" />
                    </button>
                    <button
                      onClick={() => handleOpenEditMember(m)}
                      className="flex size-8 items-center justify-center rounded-xl bg-secondary/80 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-90"
                      title="Ajustes de perfil"
                    >
                      <Settings className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Stats row: Points & Streak */}
                <div className="grid grid-cols-2 gap-2 my-2.5 rounded-2xl bg-secondary/40 p-2.5 border border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                      <Star className="size-4 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none">Puntos</p>
                      <p className="text-sm font-black text-foreground mt-0.5 tabular-nums">{m.points || 0} pts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-500">
                      <Flame className="size-4 fill-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground leading-none">Racha</p>
                      <p className="text-sm font-black text-foreground mt-0.5 tabular-nums">
                        {m.streak || m.streakDays || 0} días
                      </p>
                    </div>
                  </div>
                </div>

                {/* Level progress */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                    <span>Nivel {level}</span>
                    <span>{200 - ((m.points || 0) % 200)} pts para Nivel {level + 1}</span>
                  </div>
                  <ProgressBar value={progressToNextLevel} max={100} className="h-1.5" />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL: AJUSTAR PUNTOS (+ / -) */}
      <BottomSheet
        open={Boolean(pointsAdjustMember)}
        onClose={() => setPointsAdjustMember(null)}
        title={pointsAdjustMember ? `Ajustar puntos · ${pointsAdjustMember.name}` : ''}
      >
        {pointsAdjustMember && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-secondary/50 p-1 border border-border">
              <button
                type="button"
                onClick={() => setIsSubtract(false)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
                  !isSubtract ? 'bg-emerald-600 text-white shadow-soft' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <PlusCircle className="size-4" />
                <span>Sumar puntos (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSubtract(true)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
                  isSubtract ? 'bg-rose-600 text-white shadow-soft' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MinusCircle className="size-4" />
                <span>Restar puntos (-)</span>
              </button>
            </div>

            {/* Quick point presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Cantidad de puntos</label>
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPointsDelta(amt)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-black transition-all border',
                      pointsDelta === amt
                        ? 'border-primary bg-primary/15 text-primary shadow-sm'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={5000}
                value={pointsDelta || ''}
                onChange={(e) => setPointsDelta(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card transition-colors"
                placeholder="Cantidad personalizada"
              />
            </div>

            {/* Reason input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Motivo / Concepto (opcional)</label>
              <input
                type="text"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="Ej. Ayudó a recoger la compra, Deberes a tiempo..."
                className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-card transition-colors"
              />
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPointsAdjustMember(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustPoints}
                className={cn(
                  'rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95',
                  isSubtract ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                Confirmar {isSubtract ? `-${pointsDelta}` : `+${pointsDelta}`} pts
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* MODAL: EDITAR MIEMBRO */}
      <BottomSheet
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Editar perfil del miembro"
      >
        {editingMember && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Rol familiar</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'adult', label: 'Adulto' },
                  { id: 'child', label: 'Hijo/a' },
                  { id: 'invitado', label: 'Invitado' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setEditRole(r.id)}
                    className={cn(
                      'rounded-xl py-2 text-xs font-bold transition-all border',
                      editRole === r.id
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Color de avatar</label>
              <div className="flex flex-wrap gap-2.5 p-1">
                {MEMBER_COLORS.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setEditColorIdx(idx)}
                    className={cn(
                      'size-8 rounded-full transition-transform flex items-center justify-center',
                      editColorIdx === idx ? 'ring-2 ring-primary scale-110' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c.value }}
                  >
                    {editColorIdx === idx && <Check className="size-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditMember}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* MODAL: AÑADIR MIEMBRO */}
      <BottomSheet
        open={isAddingMember}
        onClose={() => setIsAddingMember(false)}
        title="Añadir integrante al hogar"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Nombre completo</label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Ej. Sofía, Papá, Lucas..."
              autoFocus
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Rol familiar</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewMemberRole('adult')}
                className={cn(
                  'rounded-xl py-2 text-xs font-bold transition-all border',
                  newMemberRole === 'adult'
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                )}
              >
                Adulto
              </button>
              <button
                type="button"
                onClick={() => setNewMemberRole('child')}
                className={cn(
                  'rounded-xl py-2 text-xs font-bold transition-all border',
                  newMemberRole === 'child'
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                )}
              >
                Hijo/a
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Color de avatar</label>
            <div className="flex flex-wrap gap-2.5 p-1">
              {MEMBER_COLORS.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setNewMemberColorIdx(idx)}
                  className={cn(
                    'size-8 rounded-full transition-transform flex items-center justify-center',
                    newMemberColorIdx === idx ? 'ring-2 ring-primary scale-110' : 'opacity-80 hover:opacity-100'
                  )}
                  style={{ backgroundColor: c.value }}
                >
                  {newMemberColorIdx === idx && <Check className="size-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateMember}
              disabled={!newMemberName.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
            >
              Crear integrante
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
