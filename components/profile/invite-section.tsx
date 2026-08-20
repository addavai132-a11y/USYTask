'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  QrCode,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Maximize2,
  X,
  MessageCircle,
  ShieldCheck,
  Power,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import {
  HouseholdInvitation,
  ExpirationOption,
  getActiveInvitation,
  regenerateInvitation,
  toggleInvitationActive,
  getInvitationUrl,
} from '@/lib/invitation'
import { household } from '@/lib/mock-data'

export function InviteSection() {
  const { toast } = useToast()
  const [invitation, setInvitation] = useState<HouseholdInvitation | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [expiration, setExpiration] = useState<ExpirationOption>('never')

  useEffect(() => {
    setInvitation(getActiveInvitation(household.name))
  }, [])

  if (!invitation) return null

  const inviteUrl = getInvitationUrl(invitation.token)
  const householdName = invitation.household_name || household.name

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl)
    }
    setCopied(true)
    toast('Enlace de invitación copiado al portapapeles', '📋')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Invitación a ${householdName}`,
          text: `Únete a nuestro espacio "${householdName}" en USYTask`,
          url: inviteUrl,
        })
        toast('Enlace compartido', '📤')
        return
      } catch {
        // User cancelled share or failed
      }
    }
    handleCopyLink()
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a nuestro espacio "${householdName}" en USYTask. Haz clic en el enlace para entrar:\n${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleRegenerate = () => {
    const newInv = regenerateInvitation(expiration, householdName)
    setInvitation(newInv)
    toast('Nuevo enlace y código QR generados', '🔄')
  }

  const handleToggleActive = () => {
    const updated = toggleInvitationActive(!invitation.is_active)
    setInvitation(updated)
    toast(
      updated.is_active ? 'Invitación activada de nuevo' : 'Invitación desactivada',
      updated.is_active ? '✅' : '🔒'
    )
  }

  const handleExpirationChange = (opt: ExpirationOption) => {
    setExpiration(opt)
    const newInv = regenerateInvitation(opt, householdName)
    setInvitation(newInv)
    const label =
      opt === 'never'
        ? 'Sin caducidad'
        : opt === '24h'
        ? 'Caduca en 24 horas'
        : opt === '7d'
        ? 'Caduca en 7 días'
        : 'Caduca en 30 días'
    toast(`Configuración de caducidad actualizada: ${label}`, '⏱️')
  }

  return (
    <>
      <Card variant="emerald" className="flex flex-col gap-5">
        <CardHeader
          title="Invitar personas"
          icon={<QrCode className="size-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <p className="text-xs font-semibold text-muted-foreground -mt-2 mb-1">
          Invita a familiares, pareja o compañeros a vuestro espacio de USYTask.
        </p>

        {/* CÓDIGO QR DESTACADO */}
        <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-emerald-500/20 bg-card p-6 shadow-sm">
          <div className="relative flex items-center justify-center p-4 bg-white rounded-2xl shadow-soft border border-emerald-500/30">
            <QRCodeSVG
              value={inviteUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
            {!invitation.is_active && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl p-2 text-rose-500 font-bold text-xs">
                <Power className="size-8 mb-1" />
                <span>Invitación desactivada</span>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs sm:text-sm font-extrabold text-foreground">
            Escanea este código para unirte a “<span className="text-primary">{householdName}</span>”
          </p>

          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="mt-3 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-transform active:scale-95 hover:bg-emerald-500/20"
          >
            <Maximize2 className="size-3.5" />
            <span>Ampliar QR</span>
          </button>
        </div>

        {/* COMPARTIR ENLACE */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Enlace de invitación
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 p-2.5">
            <span className="truncate text-xs font-mono font-bold text-foreground flex-1 pl-1">
              {inviteUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="size-4 text-primary" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* BOTONES DE ACCIÓN (Compartir & WhatsApp) */}
          <div className="grid grid-cols-2 gap-2.5 mt-1">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] py-3 text-xs sm:text-sm font-bold text-white shadow-soft transition-transform active:scale-95"
            >
              <MessageCircle className="size-4 fill-white" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-secondary py-3 text-xs sm:text-sm font-bold text-foreground shadow-soft transition-transform active:scale-95"
            >
              <Share2 className="size-4 text-primary" />
              <span>Compartir</span>
            </button>
          </div>
        </div>

        {/* CONTROLES DE ADMINISTRADOR (Caducidad, Regenerar, Desactivar) */}
        <div className="mt-2 pt-4 border-t border-emerald-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" /> Caducidad del enlace
            </span>
            <div className="flex items-center gap-1">
              {(['never', '24h', '7d', '30d'] as ExpirationOption[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleExpirationChange(opt)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-extrabold transition-colors ${
                    expiration === opt
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt === 'never' ? 'Nunca' : opt === '24h' ? '24h' : opt === '7d' ? '7d' : '30d'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground transition-all hover:border-primary/50 active:scale-95"
            >
              <RefreshCw className="size-3.5 text-primary" />
              <span>Regenerar enlace</span>
            </button>

            <button
              type="button"
              onClick={handleToggleActive}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                invitation.is_active
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <Power className="size-3.5" />
              <span>{invitation.is_active ? 'Desactivar' : 'Activar'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* MODAL QR AMPLIADO */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-[36px] border border-emerald-500/30 bg-card p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="mb-4 flex flex-col items-center">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" /> Invitación activa
              </span>
              <h2 className="text-2xl font-black mt-2">{householdName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Escanea este código desde la cámara del teléfono</p>
            </div>

            <div className="my-2 p-6 bg-white rounded-3xl border-2 border-emerald-500/40 shadow-soft">
              <QRCodeSVG
                value={inviteUrl}
                size={240}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span>{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
