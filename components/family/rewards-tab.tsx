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

const POPULAR_ICONS = ['🎬', '🍕', '🎮', '🎟️', '🛡️', '🍦', '🎡', '💶', '📚', '🏖️', '🍔', '🎁']

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
  const [icon, setIcon] = useState('🎁')
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
      toast(`¡"${claimingReward.title}" canjeado con éxito para ${member?.name}!`, '🎉')
      setClaimingReward(null)
    } else {
      toast(res.error || 'Error al canjear recompensa', '⚠️')
    }
  }

  const handleOpenCreateModal = () => {
    setTitle('')
    setDescription('')
    setPointCost(200)
    setIcon('🎁')
    setStock('')
    setIsCreating(true)
  }

  const handleCreateReward = () => {
    if (!title.trim()) return
    addFamilyReward({
      title: title.trim(),
      description: description.trim(),
      pointCost: Math.max(10, pointCost),
      icon,
      stock: stock ? parseInt(stock, 10) : undefined,
      claimedBy: [],
    })
    toast(`Recompensa "${title.trim()}" añadida a la tienda`, '🎁')
    setIsCreating(false)
  }

  const handleDelete = (id: string, rewardTitle: string) => {
    confirmDelete({
      title: '¿Eliminar recompensa?',
      itemName: rewardTitle,
      description: 'Esta recompensa desaparecerá de la tienda familiar.',
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
      rewardIcon: r.icon,
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-foreground">Tienda de Recompensas</h3>
          <p className="text-xs text-muted-foreground font-medium">Canjea tus puntos por premios y privilegios familiares</p>
        </div>

        <div className="flex items-center gap-2">
          {allClaims.length > 0 && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground border border-border hover:bg-secondary/80 transition-all"
              title="Historial de canjes"
            >
              <History className="size-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Historial</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Nueva recompensa</span>
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      {familyRewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Sin recompensas en la tienda familiar"
          description="Crea premios motivadores como elegir peli, tarde de videojuegos o salidas especiales."
          action="+ Añadir primera recompensa"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {familyRewards.map((r) => {
            const hasStock = r.stock === undefined || r.stock > 0
            return (
              <Card
                key={r.id}
                className={cn(
                  'relative flex flex-col justify-between p-4 transition-all hover:border-primary/40',
                  !hasStock && 'opacity-60'
                )}
              >
                <div>
                  {/* Top Icon & Cost */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/80 text-2xl shadow-inner border border-border">
                      {r.icon}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400">
                        <Star className="size-3.5 fill-amber-500" />
                        {r.pointCost} pts
                      </span>
                      <button
                        onClick={() => handleDelete(r.id, r.title)}
                        className="rounded-lg p-1 text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                        title="Eliminar recompensa"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-black text-base text-foreground tracking-tight leading-snug">
                    {r.title}
                  </h4>
                  {r.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  {/* Stock tag */}
                  {r.stock !== undefined && (
                    <div className="mt-2 text-[11px] font-bold text-muted-foreground">
                      {r.stock > 0 ? (
                        <span>Disponibles: <strong className="text-foreground">{r.stock}</strong></span>
                      ) : (
                        <span className="text-rose-500 font-extrabold">Agotado</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Claim Button */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <button
                    onClick={() => handleOpenClaim(r)}
                    disabled={!hasStock}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-black shadow-soft transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600"
                  >
                    <Sparkles className="size-4" />
                    <span>Canjear por {r.pointCost} pts</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL: CANJEAR RECOMPENSA */}
      <BottomSheet
        open={Boolean(claimingReward)}
        onClose={() => setClaimingReward(null)}
        title="Canjear Recompensa"
      >
        {claimingReward && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3.5 border border-border">
              <div className="flex size-11 items-center justify-center rounded-xl bg-card text-2xl border border-border">
                {claimingReward.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-foreground truncate">{claimingReward.title}</h4>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  Coste: {claimingReward.pointCost} pts
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground">¿Quién canjea este premio?</label>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {members.map((m) => {
                  const isSelected = selectedMemberId === m.id
                  const hasEnough = (m.points || 0) >= claimingReward.pointCost
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMemberId(m.id)}
                      className={cn(
                        'flex items-center justify-between rounded-xl p-2.5 transition-all border text-left',
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar member={m} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-foreground">{m.name}</p>
                          <p className={cn('text-[11px] font-bold', hasEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                            Saldo: {m.points || 0} pts {!hasEnough && '(Insuficiente)'}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setClaimingReward(null)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClaim}
                disabled={!selectedMemberId}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
              >
                Confirmar canje
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* MODAL: HISTORIAL DE CANJES */}
      <BottomSheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        title="Historial de Canjes de Recompensas"
      >
        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
          {allClaims.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">No hay canjes registrados aún.</p>
          ) : (
            allClaims.map((claim, idx) => {
              const member = getMemberById(claim.memberId)
              return (
                <div
                  key={claim.id || idx}
                  className="flex items-center justify-between rounded-xl bg-secondary/40 p-2.5 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{claim.rewardIcon || '🎁'}</span>
                    <div>
                      <p className="font-bold text-foreground">{claim.rewardTitle}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {member?.name || 'Miembro'} · {new Date(claim.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  {claim.pointCost && (
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                      -{claim.pointCost} pts
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </BottomSheet>

      {/* MODAL: CREAR RECOMPENSA */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Nueva recompensa familiar"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Título del premio</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Elegir peli del viernes, Tarde de consola..."
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
              placeholder="Detalles o condiciones del premio..."
              className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-card resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Icono temático</label>
            <div className="flex flex-wrap gap-2 p-1">
              {POPULAR_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    'size-9 rounded-xl text-lg flex items-center justify-center transition-transform border',
                    icon === emoji
                      ? 'border-primary bg-primary/20 scale-110 shadow-sm'
                      : 'border-border bg-secondary/40 hover:bg-secondary'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Coste en puntos</label>
              <input
                type="number"
                min={10}
                max={10000}
                value={pointCost || ''}
                onChange={(e) => setPointCost(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Stock (opcional)</label>
              <input
                type="number"
                min={1}
                placeholder="Ilimitado"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>
          </div>

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
              onClick={handleCreateReward}
              disabled={!title.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
            >
              Crear recompensa
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
