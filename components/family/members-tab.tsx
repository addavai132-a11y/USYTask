'use client'

import { useState, useEffect } from 'react'
import {
  UserPlus,
  Link2,
  Copy,
  Check,
  Share2,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Settings,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Star,
  Flame,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  getActiveInvitation,
  getInvitationUrl,
  type HouseholdInvitation,
} from '@/lib/invitation'
import { MEMBER_COLORS, type Member } from '@/types'
import { cn } from '@/lib/utils'

export function MembersTab() {
  const { toast } = useToast()
  const { members, currentMember, updateMember, adjustMemberPoints, activeGroup } = useApp()
  const groupName = activeGroup?.name || 'Mi Hogar'

  // Modals state
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [pointsAdjustMember, setPointsAdjustMember] = useState<Member | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  // Invite state
  const [invitation, setInvitation] = useState<HouseholdInvitation | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    setInvitation(getActiveInvitation(groupName))
  }, [groupName])

  // Points adjust form state
  const [pointsDelta, setPointsDelta] = useState<string>('50')
  const [pointsReason, setPointsReason] = useState<string>('')
  const [isSubtract, setIsSubtract] = useState<boolean>(false)

  // Edit Member form state
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<string>('adult')
  const [editColorIdx, setEditColorIdx] = useState(0)

  const handleOpenAdjustPoints = (m: Member) => {
    setPointsAdjustMember(m)
    setPointsDelta('50')
    setIsSubtract(false)
    setPointsReason('')
  }

  const handleSaveAdjustPoints = () => {
    if (!pointsAdjustMember) return
    const parsed = parseInt(pointsDelta, 10) || 0
    if (parsed <= 0) {
      toast('Introduce una cantidad válida de puntos', '⚠️')
      return
    }
    const delta = isSubtract ? -Math.abs(parsed) : Math.abs(parsed)
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

  const currentInvite = invitation || getActiveInvitation(groupName)
  const inviteUrl = getInvitationUrl(currentInvite.token)
  const joinCode = currentInvite.token

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(joinCode)
    }
    setCopiedCode(true)
    toast('Código de unión copiado al portapapeles', '🔑')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl)
    }
    setCopiedLink(true)
    toast('Enlace de invitación copiado al portapapeles', '📋')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Invitación a ${groupName}`,
          text: `Únete a nuestro espacio "${groupName}" en USYTask con el código: ${joinCode}`,
          url: inviteUrl,
        })
        toast('Enlace compartido', '📤')
        return
      } catch {
        // User cancelled share
      }
    }
    handleCopyLink()
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a nuestro espacio "${groupName}" en USYTask.\n\n🔑 Código del hogar: ${joinCode}\n🔗 Enlace directo:\n${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Header Bar ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-white/[0.03] dark:border-white/10">
        <div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Integrantes ({members.length})</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Roles, progreso y puntos acumulados</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
        >
          <UserPlus className="size-3.5" />
          <span>Invitar</span>
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Sin miembros registrados en este espacio."
          action="+ Invitar personas"
          onAction={() => setIsInviteModalOpen(true)}
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
                  !isSubtract ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
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
                    onClick={() => setPointsDelta(amt.toString())}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-bold transition-all border',
                      pointsDelta === amt.toString()
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
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
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-sm font-bold text-white outline-none focus:border-emerald-500 font-mono"
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
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
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-emerald-500"
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
                      'rounded-xl py-2.5 text-xs font-black border transition-all',
                      editRole === r.id
                        ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-black shadow-sm'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    )}
                  >
                    <span className={editRole === r.id ? 'text-slate-950 font-black' : ''}>{r.label}</span>
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
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── MODAL: CÓDIGO DEL HOGAR E INVITACIÓN ── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar dark:border-purple-500/30 dark:bg-[#100e23] space-y-3">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 shrink-0">
                  <UserPlus className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    Invitar a “{groupName}”
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Comparte el código o enlace para que otros se unan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* 1. Tarjeta Destacada con el Código de Unión */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5 dark:bg-white/[0.03] dark:border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-purple-300">
                Código del Hogar
              </span>
              <div className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 shadow-2xs dark:bg-[#16132f] dark:border-purple-500/30">
                <span className="font-mono text-base sm:text-lg font-bold tracking-wider break-all text-slate-900 dark:text-white select-all text-center block">
                  {joinCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
              >
                {copiedCode ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedCode ? '¡Código copiado!' : 'Copiar código del hogar'}</span>
              </button>
            </div>

            {/* 2. Enlace Directo de Invitación */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enlace directo
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-white/[0.04] dark:border-white/10">
                <span className="truncate text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex-1 pl-1">
                  {inviteUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-transform active:scale-95 dark:bg-white/10 dark:text-white dark:border-white/10 shrink-0"
                  title="Copiar enlace"
                >
                  {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            {/* 3. Botones de Compartir (WhatsApp & Nativo) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
              >
                <MessageCircle className="size-3.5 fill-white" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition-transform active:scale-95 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
              >
                <Share2 className="size-3.5 text-emerald-600 dark:text-purple-400" />
                <span>Compartir</span>
              </button>
            </div>

            {/* 4. Código QR Desplegable */}
            <div className="pt-1.5 border-t border-slate-200/80 dark:border-purple-500/20">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="w-full flex items-center justify-between py-1 px-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5 text-[11px]">
                  <QrCode className="size-3.5 text-emerald-600 dark:text-purple-400" />
                  <span>{showQr ? 'Ocultar código QR' : 'Ver código QR para escanear'}</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-purple-300">
                  {showQr ? '▲' : '▼'}
                </span>
              </button>

              {showQr && (
                <div className="mt-1.5 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl dark:bg-white/[0.02] dark:border-white/10 animate-fade-in">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <QRCodeSVG value={inviteUrl} size={130} level="H" includeMargin />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    Escanea desde la cámara de otro teléfono para unirse
                  </p>
                </div>
              )}
            </div>

            {/* Botón de Cierre */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors dark:bg-purple-600 dark:hover:bg-purple-500 shadow-sm active:scale-95"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
