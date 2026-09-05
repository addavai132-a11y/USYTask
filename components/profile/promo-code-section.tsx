'use client'

import { useState, useEffect } from 'react'
import {
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Terminal,
  ShieldCheck,
  Info,
  Zap,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { isDevEnvironment } from '@/lib/dev-mode'
import {
  redeemPromoCode,
  generatePromoCode,
  getAllPromoCodes,
  toggleDevPremiumStatus,
} from '@/lib/promo-codes'
import type { PromoCode, PromoPlanType } from '@/types/promo-codes'
import type { UserProfile } from '@/lib/user-session'
import { cn } from '@/lib/utils'

interface PromoCodeSectionProps {
  session: UserProfile | null
  onSessionUpdate?: (updated: UserProfile) => void
}

export function PromoCodeSection({ session, onSessionUpdate }: PromoCodeSectionProps) {
  const { toast } = useToast()
  const isDev = isDevEnvironment()

  // Estado del formulario de canje
  const [codeInput, setCodeInput] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemSuccessMsg, setRedeemSuccessMsg] = useState<string | null>(null)
  const [redeemErrorMsg, setRedeemErrorMsg] = useState<string | null>(null)
  const [showAlternativeInput, setShowAlternativeInput] = useState(false)

  // Estado del generador Dev (solo localhost)
  const [isDevOpen, setIsDevOpen] = useState(false)
  const [devCodes, setDevCodes] = useState<PromoCode[]>([])
  const [devPlanType, setDevPlanType] = useState<PromoPlanType>('lifetime')
  const [devCustomCode, setDevCustomCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const isPremium = Boolean(session?.isPremium)

  useEffect(() => {
    if (isDev) {
      loadDevCodes()
    }
  }, [isDev])

  async function loadDevCodes() {
    try {
      const list = await getAllPromoCodes()
      setDevCodes(list)
    } catch {
      // Ignorar errores en carga dev
    }
  }

  const handleRedeem = async (codeToUse?: string) => {
    const targetCode = (codeToUse || codeInput).trim().toUpperCase()
    if (!targetCode) {
      setRedeemErrorMsg('Por favor, escribe un código de activación.')
      toast('Escribe un código para canjear', '⚠️')
      return
    }

    setIsRedeeming(true)
    setRedeemErrorMsg(null)
    setRedeemSuccessMsg(null)

    try {
      const res = await redeemPromoCode(targetCode, session)

      if (res.success) {
        setRedeemSuccessMsg(res.message || '¡Código canjeado con éxito!')
        toast(res.message || '¡Código activado!', '✨')
        setCodeInput('')
        setShowAlternativeInput(false)

        if (onSessionUpdate && session) {
          onSessionUpdate({
            ...session,
            isPremium: true,
            premiumPlan: res.plan_type || 'early_access',
            premiumUntil: res.premium_until || null,
          })
        }

        if (isDev) {
          loadDevCodes()
        }
      } else {
        setRedeemErrorMsg(res.error || 'Código no válido o ya canjeado.')
        toast(res.error || 'No se pudo canjear el código', '❌')
      }
    } catch (err: any) {
      const msg = err?.message || 'Error inesperado al validar el código.'
      setRedeemErrorMsg(msg)
      toast(msg, '❌')
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleDevGenerate = async (customCodeParam?: string) => {
    setIsGenerating(true)
    try {
      const duration = devPlanType === 'monthly' ? 30 : devPlanType === 'annual' ? 365 : null
      const res = await generatePromoCode({
        code: (customCodeParam ?? devCustomCode) || undefined,
        planType: devPlanType,
        durationDays: duration,
        description: `Código generado en Localhost (${devPlanType})`,
      })

      if (res.success) {
        toast(`Código generado e insertado en Supabase: ${res.promoCode.code}`, '✨')
        setDevCustomCode('')
        setCodeInput(res.promoCode.code)
        await loadDevCodes()
      } else {
        toast('Error al generar código', '❌')
      }
    } catch (err: any) {
      toast(err?.message || 'Error al generar código en Supabase/local', '❌')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code)
    }
    setCopiedCode(code)
    toast(`Código ${code} copiado al portapapeles`, '📋')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleDevStatus = (target: boolean) => {
    toggleDevPremiumStatus(target)
    toast(
      target ? 'Estatus cambiado a Promocional (Modo Dev)' : 'Estatus restablecido a Estándar (Modo Dev)',
      target ? '✨' : '🔄'
    )
    if (onSessionUpdate && session) {
      onSessionUpdate({
        ...session,
        isPremium: target,
      })
    }
  }

  return (
    <Card className="relative overflow-hidden border-amber-500/30 dark:border-amber-400/20 bg-gradient-to-br from-white via-amber-500/[0.02] to-amber-500/[0.06] dark:from-[#0e0d1d] dark:via-purple-950/20 dark:to-amber-950/15 shadow-md flex flex-col gap-4">
      {/* Brillo ambiental premium */}
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-500/10 dark:bg-amber-400/10 blur-2xl pointer-events-none" />

      <CardHeader
        title="Canjear Código"
        icon={<Crown className="size-5 text-amber-500 dark:text-amber-400 animate-pulse" />}
      />

      {/* ESTADO ACTUAL DEL PERFIL */}
      {isPremium ? (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-purple-500/15 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-soft font-bold">
                👑
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <span>¡Código Promocional Activo!</span>
                  <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[10px]">
                    Activo
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Ventajas especiales habilitadas para tu perfil.
                </p>
              </div>
            </div>
            <Sparkles className="size-5 text-amber-500 dark:text-amber-300" />
          </div>

          <div className="pt-2 border-t border-amber-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>✨ Acceso desbloqueado a funciones exclusivas</span>
            {session?.premiumUntil ? (
              <span className="font-mono text-slate-500">
                Caduca: {new Date(session.premiumUntil).toLocaleDateString()}
              </span>
            ) : (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Sin fecha de caducidad
              </span>
            )}
          </div>

          {!showAlternativeInput ? (
            <button
              type="button"
              onClick={() => setShowAlternativeInput(true)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline pt-1 block"
            >
              ¿Tienes otro código promocional? Canjear otro código
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAlternativeInput(false)}
              className="text-[11px] font-bold text-slate-400 hover:underline pt-1 block"
            >
              Ocultar formulario de canje
            </button>
          )}
        </div>
      ) : null}

      {/* FORMULARIO DE CANJE (Visible si no es premium o si solicitó canjear otro código) */}
      {(!isPremium || showAlternativeInput) && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Introduce tu código de activación</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase())
                    setRedeemErrorMsg(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedeem()
                  }}
                  placeholder="Introduce tu código"
                  maxLength={32}
                  className="w-full rounded-2xl border border-border bg-background py-2.5 px-3.5 text-xs sm:text-sm font-mono font-bold tracking-widest text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 uppercase transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRedeem()}
                disabled={isRedeeming || !codeInput.trim()}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 shadow-soft transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Canjear código</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mensajes de feedback */}
          {redeemSuccessMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{redeemSuccessMsg}</span>
            </div>
          )}

          {redeemErrorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0" />
              <span>{redeemErrorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* ── GENERADOR DE CÓDIGOS PARA ENTORNO DE DESARROLLO (SOLO LOCALHOST) ── */}
      {isDev && (
        <div className="mt-2 pt-3 border-t border-dashed border-amber-500/30 dark:border-amber-500/20">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsDevOpen(!isDevOpen)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              <Terminal className="size-3.5" />
              <span>Generador de Códigos Local (Solo Localhost)</span>
              <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">
                {devCodes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleDevStatus(!isPremium)}
              className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 bg-secondary/80 border border-border px-2 py-1 rounded-lg transition-colors"
              title="Alternar estado de código promocional para pruebas"
            >
              <Zap className="size-3 text-amber-500" />
              <span>{isPremium ? 'Desactivar Código' : 'Activar Código'}</span>
            </button>
          </div>

          {isDevOpen && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-foreground uppercase tracking-wider">
                    Generar Nuevo Código de Activación
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Crea códigos válidos instantáneos y guárdalos en Supabase y localmente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadDevCodes}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title="Recargar lista de códigos"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Tipo de Plan
                  </label>
                  <select
                    value={devPlanType}
                    onChange={(e) => setDevPlanType(e.target.value as PromoPlanType)}
                    className="w-full mt-1 rounded-xl border border-border bg-background p-2 text-xs font-semibold text-foreground outline-none focus:border-amber-500"
                  >
                    <option value="lifetime">Vitalicio (Lifetime)</option>
                    <option value="early_access">Acceso Anticipado (Beta)</option>
                    <option value="monthly">30 Días de Prueba</option>
                    <option value="annual">1 Año Completo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">
                    Código personalizado (opcional)
                  </label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={devCustomCode}
                      onChange={(e) => setDevCustomCode(e.target.value.toUpperCase())}
                      placeholder="Dejar en blanco para auto-generar"
                      className="w-full rounded-xl border border-border bg-background p-2 text-xs font-mono font-bold text-foreground outline-none focus:border-amber-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleDevGenerate()}
                      disabled={isGenerating}
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      {isGenerating ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      <span>Crear en Supabase</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Listado de códigos disponibles para pruebas */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Códigos Registrados ({devCodes.length}):
                </span>

                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {devCodes.map((c) => (
                    <div
                      key={c.id || c.code}
                      className="flex items-center justify-between p-2 rounded-xl bg-secondary/50 border border-border/70 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          className={cn(
                            'size-2 rounded-full shrink-0',
                            c.is_used ? 'bg-rose-500' : 'bg-emerald-500'
                          )}
                          title={c.is_used ? 'Canjeado' : 'Disponible'}
                        />
                        <span className="font-mono font-bold text-foreground truncate">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          ({c.plan_type})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded',
                            c.is_used
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {c.is_used ? 'Usado' : 'Disponible'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(c.code)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                          title="Copiar código"
                        >
                          {copiedCode === c.code ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>

                        {!c.is_used && (
                          <button
                            type="button"
                            onClick={() => {
                              setCodeInput(c.code)
                              handleRedeem(c.code)
                            }}
                            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline ml-1"
                          >
                            Canjear
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
