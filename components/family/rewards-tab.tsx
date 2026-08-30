'use client'

import { useState } from 'react'
import {
  Plus,
  Gift,
  Sparkles,
  Star,
  CheckCircle2,
  Trash2,
  Edit2,
  History,
  AlertCircle,
  ShoppingBag,
  Loader2,
  Clock,
  Coins,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { FamilyReward, Member } from '@/types'
import { cn } from '@/lib/utils'

const REWARD_ICONS = ['🎁', '🎮', '🍕', '🎬', '🍦', '🛌', '🏆', '☕', '🎟️', '🚗', '🏖️', '💆', '🍔', '🍿', '🚴', '⭐']

export function RewardsTab() {
  const { toast } = useToast()
  const {
    familyRewards,
    members,
    currentMember,
    getMemberById,
    addFamilyReward,
    updateFamilyReward,
    deleteFamilyReward,
    claimFamilyReward,
    confirmDelete,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'catalogo' | 'historial'>('catalogo')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [claimingReward, setClaimingReward] = useState<FamilyReward | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [isClaiming, setIsClaiming] = useState(false)

  // Creation/Edit form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointCost, setPointCost] = useState<string>('200')
  const [icon, setIcon] = useState('🎁')
  const [stock, setStock] = useState<string>('')

  const handleOpenClaim = (r: FamilyReward) => {
    if (r.stock !== undefined && r.stock !== null && Number(r.stock) <= 0) {
      toast('Esta recompensa ya no tiene unidades disponibles (agotada)', '⚠️')
      return
    }
    setClaimingReward(r)
    // Select first member who can afford or current member
    const affordableMember = members.find((m) => Number(m.points || 0) >= Number(r.pointCost || 0))
    setSelectedMemberId(currentMember?.id || affordableMember?.id || members[0]?.id || '')
  }

  const handleConfirmClaim = async () => {
    if (isClaiming || !claimingReward) return

    if (claimingReward.stock !== undefined && claimingReward.stock !== null && Number(claimingReward.stock) <= 0) {
      toast('Esta recompensa ya no tiene unidades disponibles (agotada)', '⚠️')
      setClaimingReward(null)
      return
    }

    if (!selectedMemberId) {
      toast('Debes seleccionar un integrante para canjear el premio', '⚠️')
      return
    }

    const member = getMemberById(selectedMemberId) || members.find((m) => m.id === selectedMemberId)
    if (!member) {
      toast('Integrante no encontrado', '❌')
      return
    }

    const memberPoints = Number(member.points) || 0
    const cost = Number(claimingReward.pointCost) || 0

    if (memberPoints < cost) {
      toast(`Puntos insuficientes (${memberPoints} pts). Necesitas ${cost} pts.`, '❌')
      return
    }

    setIsClaiming(true)
    try {
      const res = claimFamilyReward(claimingReward.id, selectedMemberId)
      if (res && res.success) {
        toast(`¡Recompensa "${claimingReward.title}" canjeada para ${member.name}! 🎉`, '✅')
        setClaimingReward(null)
      } else {
        toast(res?.error || 'No se pudo canjear la recompensa', '❌')
      }
    } catch (err) {
      console.error('Error al canjear recompensa:', err)
      toast('Error inesperado al canjear la recompensa. Inténtalo de nuevo.', '❌')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingRewardId(null)
    setTitle('')
    setDescription('')
    setPointCost('200')
    setIcon('🎁')
    setStock('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (reward: FamilyReward) => {
    setEditingRewardId(reward.id)
    setTitle(reward.title)
    setDescription(reward.description || '')
    setPointCost(reward.pointCost !== undefined ? reward.pointCost.toString() : '200')
    setIcon(reward.icon || '🎁')
    setStock(reward.stock !== undefined ? reward.stock.toString() : '')
    setIsModalOpen(true)
  }

  const handleSaveReward = () => {
    try {
      if (!title.trim()) {
        toast('Introduce un título para la recompensa', '⚠️')
        return
      }

      const cost = Math.max(1, parseInt(pointCost, 10) || 10)
      const parsedStock = stock.trim() ? Math.max(1, parseInt(stock, 10)) : undefined

      if (editingRewardId) {
        const existing = familyRewards.find((r) => r.id === editingRewardId)
        if (!existing) {
          toast('Recompensa no encontrada', '❌')
          return
        }
        updateFamilyReward({
          ...existing,
          title: title.trim(),
          description: description.trim(),
          pointCost: cost,
          icon: icon || '🎁',
          stock: parsedStock,
        })
        toast(`Recompensa "${title.trim()}" actualizada`, '✏️')
      } else {
        addFamilyReward({
          title: title.trim(),
          description: description.trim(),
          pointCost: cost,
          icon: icon || '🎁',
          stock: parsedStock,
          claimedBy: [],
        })
        toast(`Recompensa "${title.trim()}" añadida al catálogo`, '✅')
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error in handleSaveReward:', err)
      toast('Hubo un error al guardar la recompensa', '❌')
    }
  }

  const handleDelete = (id: string, rewardTitle: string) => {
    confirmDelete({
      title: '¿Eliminar recompensa?',
      itemName: rewardTitle,
      description: 'Esta recompensa desaparecerá del catálogo familiar.',
      confirmText: 'Eliminar Recompensa',
      onConfirm: () => {
        deleteFamilyReward(id)
        toast(`Recompensa "${rewardTitle}" eliminada`, '🗑️')
      },
    })
  }

  // Filter only active available rewards (unlimited or stock > 0)
  const availableRewards = familyRewards.filter(
    (r) => r.stock === undefined || r.stock === null || Number(r.stock) > 0
  )

  // Flatten all claims for history view
  const allClaims = familyRewards
    .flatMap((r) =>
      (r.claimedBy || []).map((c) => ({
        ...c,
        rewardTitle: r.title,
        rewardIcon: r.icon || '🎁',
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Top Header Controls & Tab Selector ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-[#121026]/90 dark:border-purple-500/20 dark:shadow-xl">
        <div>
          <span className="text-sm font-black text-slate-900 dark:text-white">
            Tienda & Recompensas Familiares
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Canjea puntos ganados por privilegios, premios y regalos del hogar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Pestañas: Catálogo vs Historial */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeTab === 'catalogo'
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-purple-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              )}
            >
              Catálogo ({availableRewards.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                activeTab === 'historial'
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-purple-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              )}
            >
              <History className="size-3" />
              <span>Historial ({allClaims.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">+ Nueva Recompensa</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: CATÁLOGO DE RECOMPENSAS ── */}
      {activeTab === 'catalogo' && (
        <>
          {availableRewards.length === 0 ? (
            <EmptyState
              emoji="🎁"
              title="Sin recompensas disponibles en la tienda."
              description="Todas las recompensas con unidades limitadas han sido canjeadas o aún no has creado ninguna."
              action="+ Añadir recompensa"
              onAction={handleOpenCreateModal}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableRewards.map((r) => {
                const hasStock = r.stock === undefined || r.stock === null || r.stock > 0
                return (
                  <Card
                    key={r.id}
                    className="p-4 bg-white border border-slate-200 hover:border-emerald-500/40 dark:bg-[#121026]/85 dark:border-purple-500/20 dark:hover:border-purple-500/40 transition-all rounded-2xl flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div>
                      {/* Top: Icon, Cost & Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-xl border border-emerald-200 dark:bg-purple-500/15 dark:border-purple-500/30">
                          {r.icon || '🎁'}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 px-2.5 py-0.5 text-xs font-bold tabular-nums">
                            <Coins className="size-3 text-amber-500" />
                            <span>{r.pointCost} pts</span>
                          </span>

                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                            title="Editar recompensa"
                          >
                            <Edit2 className="size-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(r.id, r.title)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition-colors"
                            title="Eliminar recompensa"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-snug">
                        {r.title}
                      </h4>
                      {r.description && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Stock & Canjear Button */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {r.stock !== undefined && r.stock !== null ? (
                          `${r.stock} disponibles`
                        ) : (
                          'Ilimitado'
                        )}
                      </span>

                      <button
                        onClick={() => handleOpenClaim(r)}
                        disabled={!hasStock}
                        className="rounded-xl px-4 py-1.5 text-xs font-bold transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
                      >
                        Canjear
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: HISTORIAL DE CANJES ── */}
      {activeTab === 'historial' && (
        <Card className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 dark:bg-[#121026]/90 dark:border-purple-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-purple-500/15">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <History className="size-3.5 text-emerald-600 dark:text-purple-400" />
              <span>Historial de Recompensas Canjeadas</span>
            </h4>
            <span className="text-xs text-slate-500 font-mono">{allClaims.length} registros</span>
          </div>

          {allClaims.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <p>Aún no se ha canjeado ninguna recompensa.</p>
              <p className="mt-1 text-[11px]">¡Completa tareas y retos familiares para ganar puntos!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allClaims.map((claim, idx) => {
                const member = getMemberById(claim.memberId)
                const dateObj = new Date(claim.date)
                const formattedDate = !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : claim.date

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs dark:bg-white/[0.02] dark:border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base shrink-0 dark:bg-purple-500/20 dark:border-purple-500/30">
                        {claim.rewardIcon || '🎁'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {claim.rewardTitle}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {member && <MemberAvatar member={member} size="sm" />}
                          <span className="font-medium">{member?.name || 'Miembro'}</span>
                          <span>·</span>
                          <span className="font-mono">{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-rose-600 dark:text-purple-300 font-mono text-xs">
                        -{claim.pointCost || 0} pts
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold dark:bg-emerald-500/20 dark:text-emerald-300">
                        Completado
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── MODAL: CANJEAR RECOMPENSA ── */}
      <BottomSheet
        open={Boolean(claimingReward)}
        onClose={() => setClaimingReward(null)}
        title={`Canjear: ${claimingReward?.title || ''}`}
      >
        {claimingReward && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-purple-950/30 dark:border-purple-500/20">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Coste de la recompensa:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Se descontará del saldo del miembro seleccionado</p>
              </div>
              <span className="font-black text-emerald-700 dark:text-purple-300 text-base font-mono tabular-nums">
                {claimingReward.pointCost} puntos
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-extrabold text-slate-900 dark:text-slate-200">
                ¿Qué integrante de la familia canjea este premio?
              </p>
              <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                {members.map((m) => {
                  const memberPts = Number(m.points) || 0
                  const cost = Number(claimingReward.pointCost) || 0
                  const canAfford = memberPts >= cost
                  const isSelected = selectedMemberId === m.id
                  const remainingAfter = memberPts - cost

                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border text-left transition-all',
                        !canAfford
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed dark:border-white/5 dark:bg-white/[0.01]'
                          : isSelected
                          ? 'border-emerald-500 bg-emerald-50 text-slate-900 shadow-sm ring-1 ring-emerald-500 dark:border-purple-500 dark:bg-purple-600/20 dark:text-white dark:ring-purple-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar member={m} size="sm" />
                        <div>
                          <p className="font-bold text-xs">{m.name}</p>
                          <p
                            className={cn(
                              'text-[10px] font-medium font-mono',
                              canAfford
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            )}
                          >
                            Saldo actual: {memberPts} pts
                            {canAfford && (
                              <span className="text-slate-500 dark:text-slate-400 ml-1">
                                (tras canje: {remainingAfter} pts)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {!canAfford && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-500/20">
                          Puntos insuficientes
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                disabled={isClaiming}
                onClick={() => setClaimingReward(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isClaiming ||
                  !selectedMemberId ||
                  !members.some(
                    (m) =>
                      m.id === selectedMemberId &&
                      Number(m.points || 0) >= Number(claimingReward.pointCost)
                  )
                }
                onClick={handleConfirmClaim}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Canjeando premio...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Confirmar Canje</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── MODAL: CREAR / EDITAR RECOMPENSA ── */}
      <BottomSheet
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRewardId ? 'Editar recompensa' : 'Nueva recompensa para la tienda'}
      >
        <div className="flex flex-col gap-3.5 text-xs">
          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Título del premio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Elegir película del viernes, Tarde de videojuegos, Postre especial..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>

          {/* Selector de Icono */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Icono / Emoji</label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-white/[0.02] dark:border-white/10">
              {REWARD_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    'size-8 rounded-lg text-base flex items-center justify-center transition-all',
                    icon === emoji
                      ? 'bg-emerald-600 text-white scale-110 shadow-sm dark:bg-purple-600'
                      : 'hover:bg-slate-200 dark:hover:bg-white/10'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Descripción / Condiciones (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condiciones para disfrutar del premio..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 resize-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            />
          </div>

          {/* Coste y Cantidad disponible */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Coste en puntos</label>
              <input
                type="number"
                min={1}
                step={10}
                value={pointCost}
                onChange={(e) => setPointCost(e.target.value)}
                placeholder="200"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 font-mono dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Cantidad disponible
              </label>
              <input
                type="number"
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ilimitado"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 font-mono dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!title.trim()}
              onClick={handleSaveReward}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
            >
              {editingRewardId ? 'Guardar Cambios' : 'Crear Recompensa'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
