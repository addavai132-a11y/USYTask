'use client'

import { useState } from 'react'
import { Plus, Gift, Sparkles, Star, CheckCircle2, Trash2, History, AlertCircle, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { FamilyReward, Member } from '@/types'
import { cn } from '@/lib/utils'

export function RewardsTab() {
  const { toast } = useToast()
  const {
    familyRewards,
    members,
    currentMember,
    getMemberById,
    addFamilyReward,
    deleteFamilyReward,
    claimFamilyReward,
    confirmDelete,
  } = useApp()

  const [isCreating, setIsCreating] = useState(false)
  const [claimingReward, setClaimingReward] = useState<FamilyReward | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [showHistory, setShowHistory] = useState(false)

  // Creation form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointCost, setPointCost] = useState<number>(200)
  const [stock, setStock] = useState<string>('')

  const handleOpenClaim = (r: FamilyReward) => {
    setClaimingReward(r)
    setSelectedMemberId(currentMember?.id || members[0]?.id || '')
  }

  const handleConfirmClaim = () => {
    if (!claimingReward || !selectedMemberId) return
    const res = claimFamilyReward(claimingReward.id, selectedMemberId)
    if (res.success) {
      const member = getMemberById(selectedMemberId)
      toast(`Recompensa "${claimingReward.title}" canjeada para ${member?.name}`, '✅')
      setClaimingReward(null)
    } else {
      toast(res.error || 'Puntos insuficientes', '❌')
    }
  }

  const handleOpenCreateModal = () => {
    setTitle('')
    setDescription('')
    setPointCost(200)
    setStock('')
    setIsCreating(true)
  }

  const handleCreateReward = () => {
    if (!title.trim()) return
    addFamilyReward({
      title: title.trim(),
      description: description.trim(),
      pointCost: Math.max(10, pointCost),
      icon: '🎁',
      stock: stock ? parseInt(stock, 10) : undefined,
      claimedBy: [],
    })
    toast(`Recompensa "${title.trim()}" añadida al catálogo`, '✅')
    setIsCreating(false)
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

  // Flatten all claims for history view
  const allClaims = familyRewards.flatMap((r) =>
    (r.claimedBy || []).map((c) => ({
      ...c,
      rewardTitle: r.title,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Top Header Controls ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <span className="text-sm font-bold text-white">Catálogo de Recompensas ({familyRewards.length})</span>
          <p className="text-xs text-slate-400">Canjea puntos por privilegios y premios</p>
        </div>

        <div className="flex items-center gap-2">
          {allClaims.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/[0.08] transition-all"
              title="Historial de canjes"
            >
              <History className="size-3.5 text-purple-400" />
              <span className="hidden sm:inline">Historial</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>+ Nueva recompensa</span>
          </button>
        </div>
      </div>

      {/* ── Rewards Grid ── */}
      {familyRewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Sin recompensas en el catálogo familiar."
          action="+ Añadir primera recompensa"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {familyRewards.map((r) => {
            const hasStock = r.stock === undefined || r.stock > 0
            return (
              <Card
                key={r.id}
                className={cn(
                  'p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col justify-between gap-3 shadow-sm',
                  !hasStock && 'opacity-60'
                )}
              >
                <div>
                  {/* Top: Icon & Cost */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Gift className="size-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {r.pointCost} pts
                      </span>
                      <button
                        onClick={() => handleDelete(r.id, r.title)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="Eliminar recompensa"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-sm text-white tracking-tight leading-snug">
                    {r.title}
                  </h4>
                  {r.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  )}
                </div>

                {/* Bottom Row: Stock & Canjear Button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {r.stock !== undefined ? `${r.stock} disponibles` : 'Ilimitado'}
                  </span>

                  <button
                    onClick={() => handleOpenClaim(r)}
                    disabled={!hasStock}
                    className={cn(
                      'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
                      hasStock
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:scale-95'
                        : 'bg-white/[0.04] text-slate-500 border border-white/5 cursor-not-allowed'
                    )}
                  >
                    Canjear
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL: CANJEAR RECOMPENSA ── */}
      <BottomSheet
        open={Boolean(claimingReward)}
        onClose={() => setClaimingReward(null)}
        title={`Canjear: ${claimingReward?.title || ''}`}
      >
        {claimingReward && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400">Coste requerido:</span>
              <span className="font-bold text-emerald-400 text-sm tabular-nums">
                {claimingReward.pointCost} puntos
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-bold text-slate-300">¿Quién canjea este premio?</p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {members.map((m) => {
                  const canAfford = (m.points || 0) >= claimingReward.pointCost
                  const isSelected = selectedMemberId === m.id

                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border text-left transition-all',
                        !canAfford
                          ? 'border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar member={m} size="sm" />
                        <div>
                          <p className="font-bold text-xs">{m.name}</p>
                          <p className={cn('text-[10px]', canAfford ? 'text-emerald-300' : 'text-slate-500')}>
                            Saldo actual: {m.points || 0} pts
                          </p>
                        </div>
                      </div>
                      {!canAfford && (
                        <span className="text-[10px] text-slate-500 font-semibold">Puntos insuficientes</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setClaimingReward(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Confirmar canje
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── MODAL: CREAR RECOMPENSA ── */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Nueva recompensa para la tienda"
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Título del premio <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Elegir película del viernes, Tarde de videojuegos..."
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Descripción / Detalles (opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condiciones para disfrutar del premio..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Coste en puntos</label>
              <input
                type="number"
                min={10}
                step={10}
                value={pointCost}
                onChange={(e) => setPointCost(Math.max(10, parseInt(e.target.value, 10) || 10))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-400">Stock (dejar vacío = ilimitado)</label>
              <input
                type="number"
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ilimitado"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
              />
            </div>
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
              onClick={handleCreateReward}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Guardar recompensa
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── MODAL: HISTORIAL DE CANJES ── */}
      <BottomSheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Historial de canjes"
      >
        <div className="flex flex-col gap-2 text-xs max-h-72 overflow-y-auto">
          {allClaims.length === 0 ? (
            <p className="text-slate-400 text-center py-6">No hay canjes registrados aún.</p>
          ) : (
            allClaims.map((claim, idx) => {
              const member = getMemberById(claim.memberId)
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    {member ? (
                      <MemberAvatar member={member} size="sm" />
                    ) : (
                      <div className="size-7 rounded-full bg-white/10" />
                    )}
                    <div>
                      <p className="font-bold text-white text-xs">{claim.rewardTitle}</p>
                      <p className="text-[10px] text-slate-400">
                        Canjeado por {member?.name || 'Miembro'} · {new Date(claim.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  {claim.pointCost && (
                    <span className="font-bold text-purple-300 text-xs">-{claim.pointCost} pts</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
