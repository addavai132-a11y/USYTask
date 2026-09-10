'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  QrCode,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  X,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Users,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { createClient } from '@/lib/supabase'
import { getCurrentUserHousehold } from '@/app/actions/household'

export function InviteSection() {
  const { toast } = useToast()
  const { activeGroup } = useApp()

  const [loading, setLoading] = useState(true)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Cargar el household_id real conectado a Supabase
  const loadHouseholdFromSupabase = async () => {
    setLoading(true)
    try {
      // 1. Intentar obtener el hogar a través del Server Action
      const serverRes = await getCurrentUserHousehold()
      if (serverRes.success && serverRes.householdId) {
        setHouseholdId(serverRes.householdId)
        setHouseholdName(serverRes.householdName || activeGroup?.name || 'Mi Familia')
        return
      }

      // 2. Consulta directa al cliente de Supabase (browser)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Buscar en household_members
        const { data: hm } = await supabase
          .from('household_members')
          .select('household_id, households(id, name)')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (hm?.household_id) {
          setHouseholdId(hm.household_id)
          setHouseholdName((hm.households as any)?.name || activeGroup?.name || 'Mi Familia')
          return
        }

        // Buscar en group_members (compatibilidad)
        const { data: gm } = await supabase
          .from('group_members')
          .select('group_id, groups(id, name)')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (gm?.group_id) {
          setHouseholdId(gm.group_id)
          setHouseholdName((gm.groups as any)?.name || activeGroup?.name || 'Mi Familia')
          return
        }

        // Buscar si el usuario es creador de un hogar
        const { data: hCreated } = await supabase
          .from('households')
          .select('id, name')
          .eq('created_by', user.id)
          .limit(1)
          .maybeSingle()

        if (hCreated?.id) {
          setHouseholdId(hCreated.id)
          setHouseholdName(hCreated.name)
          return
        }

        // Buscar si el usuario es creador de un grupo
        const { data: gCreated } = await supabase
          .from('groups')
          .select('id, name')
          .eq('created_by', user.id)
          .limit(1)
          .maybeSingle()

        if (gCreated?.id) {
          setHouseholdId(gCreated.id)
          setHouseholdName(gCreated.name)
          return
        }
      }

      // 3. Si no hay sesión o no se encuentra registro en DB, usar el espacio activo local
      if (activeGroup?.id) {
        setHouseholdId(activeGroup.id)
        setHouseholdName(activeGroup.name)
      }
    } catch (err) {
      console.error('Error al obtener el hogar desde Supabase:', err)
      if (activeGroup?.id) {
        setHouseholdId(activeGroup.id)
        setHouseholdName(activeGroup.name)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHouseholdFromSupabase()
  }, [activeGroup?.id])

  // Generar enlace dinámico usando el household_id real
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const inviteUrl = householdId ? `${origin}/join?household_id=${householdId}` : ''
  const displayName = householdName || activeGroup?.name || 'Mi Familia'

  const handleCopyLink = () => {
    if (!inviteUrl) return
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inviteUrl)
    }
    setCopied(true)
    toast('Enlace de invitación copiado al portapapeles', '📋')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!inviteUrl) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Invitación a ${displayName}`,
          text: `Únete a nuestro hogar "${displayName}" en USYTask`,
          url: inviteUrl,
        })
        toast('Enlace compartido', '📤')
        return
      } catch {
        // Compartir cancelado por el usuario
      }
    }
    handleCopyLink()
  }

  const handleWhatsApp = () => {
    if (!inviteUrl) return
    const text = encodeURIComponent(
      `¡Hola! Te invito a unirte a nuestro hogar "${displayName}" en USYTask. Haz clic en el enlace para entrar:\n${inviteUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <>
      <Card variant="emerald" className="flex flex-col gap-5">
        <CardHeader
          title="Invitar personas"
          icon={<QrCode className="size-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <p className="text-xs font-semibold text-muted-foreground -mt-2 mb-1">
          Invita a familiares, pareja o compañeros a vuestro espacio de USYTask mediante código QR o enlace directo.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-emerald-500/20 bg-card">
            <Loader2 className="size-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-xs font-bold text-muted-foreground">
              Obteniendo datos de tu hogar desde Supabase...
            </p>
          </div>
        ) : !householdId ? (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-border bg-card">
            <Users className="size-8 text-muted-foreground mb-2" />
            <p className="text-xs font-bold text-muted-foreground mb-3">
              No se encontró un hogar activo para generar la invitación.
            </p>
            <button
              type="button"
              onClick={loadHouseholdFromSupabase}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
            >
              <RefreshCw className="size-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        ) : (
          <>
            {/* CÓDIGO QR DESTACADO DINÁMICO */}
            <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-emerald-500/20 bg-card p-6 shadow-sm">
              <div className="relative flex items-center justify-center p-4 bg-white rounded-2xl shadow-soft border border-emerald-500/30">
                <QRCodeSVG
                  value={inviteUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="mt-3 text-xs sm:text-sm font-extrabold text-foreground">
                Escanea este código para unirte a “<span className="text-primary">{displayName}</span>”
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

            {/* COMPARTIR ENLACE DINÁMICO */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Enlace de invitación directo
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

            {/* BOTÓN DE ACTUALIZAR / SINCRONIZAR HOGAR */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={loadHouseholdFromSupabase}
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Sincronizar datos con Supabase"
              >
                <RefreshCw className="size-3" />
                <span>Actualizar enlace</span>
              </button>
            </div>
          </>
        )}
      </Card>

      {/* MODAL QR AMPLIADO */}
      {qrModalOpen && inviteUrl && (
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
                <ShieldCheck className="size-3.5" /> Enlace Conectado a Supabase
              </span>
              <h2 className="text-2xl font-black mt-2">{displayName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Escanea este código desde la cámara del teléfono para unirte
              </p>
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
