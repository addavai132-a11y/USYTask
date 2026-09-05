'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Crown,
  Sparkles,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { isDevEnvironment } from '@/lib/dev-mode'
import {
  generatePromoCode,
  getAllPromoCodes,
  toggleDevPremiumStatus,
} from '@/lib/promo-codes'
import type { PromoCode, PromoPlanType } from '@/types/promo-codes'
import { getStoredSession } from '@/lib/user-session'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

function DevPromoCodesContent() {
  const { toast } = useToast()
  const isDev = isDevEnvironment()
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [customCode, setCustomCode] = useState('')
  const [planType, setPlanType] = useState<PromoPlanType>('lifetime')
  const [description, setDescription] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [session, setSession] = useState(getStoredSession())

  useEffect(() => {
    loadCodes()
    setSession(getStoredSession())
  }, [])

  async function loadCodes() {
    setLoading(true)
    try {
      const list = await getAllPromoCodes()
      setCodes(list)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsGenerating(true)
    try {
      const duration = planType === 'monthly' ? 30 : planType === 'annual' ? 365 : null
      const res = await generatePromoCode({
        code: customCode || undefined,
        planType,
        durationDays: duration,
        description: description || `Creado desde /dev/promo-codes (${planType})`,
      })

      if (res.success) {
        toast(`Código generado: ${res.promoCode.code}`, '✨')
        setCustomCode('')
        setDescription('')
        await loadCodes()
      } else {
        toast('Error al generar código', '❌')
      }
    } catch (err: any) {
      toast(err?.message || 'Error inesperado', '❌')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code)
    }
    setCopiedCode(code)
    toast('Código copiado al portapapeles', '📋')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleTogglePremium = () => {
    const nextState = !session?.isPremium
    toggleDevPremiumStatus(nextState)
    setSession(getStoredSession())
    toast(
      nextState ? 'Estatus Premium activado en sesión' : 'Estatus Premium desactivado',
      nextState ? '👑' : '🔄'
    )
  }

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md p-6 rounded-3xl border border-rose-500/30 bg-card text-center space-y-3">
          <AlertTriangle className="size-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black">Acceso Restringido</h2>
          <p className="text-xs text-muted-foreground">
            Esta vista solo está disponible en el entorno local de desarrollo (localhost).
          </p>
          <Link
            href="/"
            className="inline-block mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra superior */}
        <div className="flex items-center justify-between">
          <Link
            href="/app?tab=profile"
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Volver a Mi Perfil</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Terminal className="size-3" /> Entorno Localhost Activo
            </span>
          </div>
        </div>

        {/* Título principal */}
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-purple-500/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Crown className="size-7 text-amber-500" />
              <span>Generador de Códigos Promocionales</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Herramienta interna de desarrollo para crear y probar licencias y códigos de activación en Supabase.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTogglePremium}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border hover:bg-secondary/80 text-xs font-bold transition-all shrink-0 active:scale-95"
          >
            <Zap className="size-4 text-amber-500" />
            <span>
              {session?.isPremium ? 'Quitar Premium de Mi Sesión' : 'Darme Premium Directo'}
            </span>
          </button>
        </div>

        {/* Formulario de creación rápida */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
            Crear Nuevo Código de Activación
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Tipo de Plan
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value as PromoPlanType)}
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-semibold outline-none focus:border-amber-500"
              >
                <option value="lifetime">Vitalicio (Lifetime)</option>
                <option value="early_access">Acceso Anticipado (Beta Tester)</option>
                <option value="monthly">30 Días de Prueba</option>
                <option value="annual">1 Año Completo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Código Personalizado (Opcional)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="EJ: USY-VIP-2026"
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-mono font-bold outline-none focus:border-amber-500 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Descripción / Destinatario
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="EJ: Prueba QA, Youtuber, Beta..."
                className="w-full rounded-2xl border border-border bg-background p-3 text-xs font-medium outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-soft transition-all"
            >
              <Plus className="size-4" />
              <span>Generar y Guardar en BD</span>
            </button>
          </div>
        </div>

        {/* Tabla de códigos existentes */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              Códigos en Base de Datos ({codes.length})
            </h2>
            <button
              type="button"
              onClick={loadCodes}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-secondary"
            >
              <RefreshCw className="size-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Cargando códigos...
            </div>
          ) : codes.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No hay códigos registrados todavía. Crea uno arriba para empezar.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {codes.map((c) => (
                <div
                  key={c.id || c.code}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm tracking-wide text-foreground">
                        {c.code}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          c.is_used
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {c.is_used ? 'Canjeado' : 'Disponible'}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {c.plan_type}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    )}
                    {c.used_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Canjeado el: {new Date(c.used_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(c.code)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground transition-all"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-emerald-500">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DevPromoCodesPage() {
  return (
    <ToastProvider>
      <DevPromoCodesContent />
    </ToastProvider>
  )
}
