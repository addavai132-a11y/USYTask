'use client'

import { useState } from 'react'
import { Plus, Settings, PlusCircle, MinusCircle, ShieldCheck, Sparkles, Star, Flame } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { MEMBER_COLORS, type Member } from '@/types'
import { cn } from '@/lib/utils'

export function MembersTab() {
  const { toast } = useToast()
  const { members, currentMember, addMember, updateMember, adjustMemberPoints } = useApp()

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
      delta >= 0 ? '✨' : '📉'
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
    toast('Perfil de miembro actualizado', '✅')
    setEditingMember(null)
  }

  const handleCreateMember = () => {
    if (!newMemberName.trim()) return
    addMember(newMemberName.trim(), newMemberColorIdx)
    toast(`Miembro ${newMemberName} añadido`, '✅')
    setNewMemberName('')
    setIsAddingMember(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Header Bar ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <span className="text-sm font-bold text-white">Integrantes ({members.length})</span>
          <p className="text-xs text-slate-400">Roles, progreso y puntos acumulados</p>
        </div>
        <button
          onClick={() => setIsAddingMember(true)}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Añadir miembro</span>
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Sin miembros registrados en este espacio."
          action="+ Añadir primer miembro"
          onAction={() => setIsAddingMember(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((m) => {
            const level = Math.floor((m.points || 0) / 200) + 1
            const progressToNextLevel = ((m.points || 0) % 200) / 2
            const isAdult = m.role === 'adult' || m.role === 'adulto'
            const isChild = m.role === 'child' || m.role === 'hijo'

            return (
              <Card
                key={m.id}
                className={cn(
                  'p-4 bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all rounded-2xl flex flex-col justify-between gap-3 shadow-sm',
                  m.id === currentMember?.id && 'ring-1 ring-purple-500/40'
                )}
              >
                {/* Top Row: Avatar, Name, Role & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={m} size="md" ring />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white tracking-tight">{m.name}</h4>
                        {m.isOwner && (
                          <span title="Propietario">
                            <ShieldCheck className="size-3.5 text-purple-400" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5">
                          {isAdult ? 'Adulto' : isChild ? 'Hijo/a' : 'Invitado'}
                        </span>
                        <span className="text-[10px] font-semibold text-purple-300">
                          Nivel {level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenAdjustPoints(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Ajustar puntos"
                    >
                      <Sparkles className="size-3.5 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleOpenEditMember(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Ajustes de perfil"
                    >
                      <Settings className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Points & Streak Metric Box */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400 uppercase">Puntos</span>
                    <span className="text-sm font-bold text-purple-300 tabular-nums">
                      {m.points || 0} pts
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400 uppercase">Racha</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      {m.streak || m.streakDays || 0} días
                    </span>
                  </div>
                </div>

                {/* Level Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span>Nivel {level}</span>
                    <span>{200 - ((m.points || 0) % 200)} pts para Nivel {level + 1}</span>
                  </div>
                  <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressToNextLevel}%` }}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL: AJUSTAR PUNTOS ── */}
      <BottomSheet
        open={Boolean(pointsAdjustMember)}
        onClose={() => setPointsAdjustMember(null)}
        title={pointsAdjustMember ? `Ajustar puntos · ${pointsAdjustMember.name}` : ''}
      >
        {pointsAdjustMember && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.03] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setIsSubtract(false)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all',
                  !isSubtract ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
                  isSubtract ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 hover:text-white'
                )}
              >
                <MinusCircle className="size-4" />
                <span>Restar puntos (-)</span>
              </button>
            </div>

            {/* Quick point presets */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400">Cantidad de puntos</label>
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPointsDelta(amt)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-bold transition-all border',
                      pointsDelta === amt
                        ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white'
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
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-sm font-bold text-white outline-none focus:border-purple-500"
                placeholder="Cantidad personalizada"
              />
            </div>

            {/* Reason input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400">Motivo / Concepto (opcional)</label>
              <input
                type="text"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="Ej. Colaboración en el hogar, tarea cumplida..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPointsAdjustMember(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustPoints}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Confirmar ajuste
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── MODAL: EDITAR MIEMBRO ── */}
      <BottomSheet
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title={editingMember ? `Editar · ${editingMember.name}` : ''}
      >
        {editingMember && (
          <div className="flex flex-col gap-3.5 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Rol en el hogar</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'adult', label: 'Adulto' },
                  { id: 'child', label: 'Hijo/a' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setEditRole(r.id)}
                    className={cn(
                      'rounded-xl py-2.5 text-xs font-bold border transition-all',
                      editRole === r.id
                        ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditMember}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── MODAL: AÑADIR MIEMBRO ── */}
      <BottomSheet
        open={isAddingMember}
        onClose={() => setIsAddingMember(false)}
        title="Añadir nuevo miembro"
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Nombre del integrante <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Ej. Sofía, David, Papá..."
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateMember}
              className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Añadir miembro
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
