'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Heart, Home as HomeIcon, User, ArrowRight, Copy, Share2, Check, KeyRound, Sparkles, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { validateInvitationToken } from '@/lib/invitation'

const spaceTypes = [
  { id: 'family', label: 'Familia', icon: Users, sample: 'Familia García' },
  { id: 'couple', label: 'Pareja', icon: Heart, sample: 'Nuestra casa' },
  { id: 'roommates', label: 'Compañeros de piso', icon: HomeIcon, sample: 'Piso Salamanca' },
  { id: 'personal', label: 'Personal', icon: User, sample: 'Mi espacio' },
]

function OnboardingContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [step, setStep] = useState(1)
  const [type, setType] = useState<string | null>('family')
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const selectedType = spaceTypes.find((t) => t.id === type)

  const finishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeos-onboarded', '1')
    }
    router.push('/app')
  }

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1)
    } else {
      finishOnboarding()
    }
  }

  const handleJoinSpace = () => {
    setJoinError('')
    const input = joinInput.trim()
    if (!input) {
      setJoinError('Por favor, introduce un código de invitación o enlace.')
      return
    }

    // Extract token if full URL was pasted
    let cleanToken = input
    if (cleanToken.includes('/invite/')) {
      cleanToken = cleanToken.split('/invite/')[1]?.split('?')[0]?.split('#')[0] || cleanToken
    }

    const valRes = validateInvitationToken(cleanToken)
    if (!valRes.valid) {
      setJoinError(valRes.error || 'Código o enlace de invitación no válido.')
      return
    }

    setJoining(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lifeos-onboarded', '1')
    }

    toast(`¡Te has unido con éxito a ${valRes.invitation?.household_name || 'tu espacio'}!`, '🎉')
    setTimeout(() => {
      router.push(`/invite/${cleanToken}`)
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground px-4 py-8 sm:px-6">
      {/* Top Header & Dots */}
      <div className="mx-auto w-full max-w-md flex flex-col items-center gap-6">
        <UsyTaskLogo size="md" />

        {/* Progress dots (only in create flow) */}
        {mode === 'create' && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-border'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-[32px] border border-border/80 bg-card p-6 shadow-xl sm:p-8 animate-fade-in">
          {/* ────────────────────────────────────────────────────────── */}
          {/* CHOOSE FLOW: Crear nueva vs Ya tengo una                  */}
          {/* ────────────────────────────────────────────────────────── */}
          {mode === 'choose' && (
            <div className="flex flex-col items-center text-center">
              <UsyTaskLogo size="xl" showSubtitle className="mb-4" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-balance">
                Bienvenido a USYTask
              </h1>
              <p className="mt-1 text-xs font-extrabold tracking-widest text-primary uppercase">
                Universal System for Tasks
              </p>
              <p className="mt-3 text-sm font-medium text-muted-foreground text-balance">
                ¿Deseas crear un nuevo espacio para tu hogar o unirte a uno ya existente?
              </p>

              {/* 2 Clear Options */}
              <div className="mt-6 flex flex-col gap-3.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setMode('create')
                    setStep(2)
                  }}
                  className="group flex items-center justify-between gap-3.5 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left transition-all active:scale-[0.98] hover:border-primary hover:bg-primary/10 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
                      <PlusCircle className="size-6" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Crear nueva familia</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Configura un espacio nuevo desde cero
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-primary shrink-0 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setMode('join')}
                  className="group flex items-center justify-between gap-3.5 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all active:scale-[0.98] hover:border-border/80 hover:bg-secondary/40 shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-foreground shadow-sm group-hover:scale-105 transition-transform">
                      <KeyRound className="size-6 text-primary" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Ya tengo una (Unirse)</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tengo un código o enlace de invitación
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* JOIN FLOW: Pegar enlace o código                           */}
          {/* ────────────────────────────────────────────────────────── */}
          {mode === 'join' && (
            <div className="flex flex-col animate-fade-in">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                    Unirse a una familia
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Introduce el código o enlace recibido
                  </p>
                </div>
              </div>

              {joinError && (
                <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
                  {joinError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  Enlace o código de invitación <span className="text-rose-500">*</span>
                </label>
                <input
                  autoFocus
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value)
                    setJoinError('')
                  }}
                  placeholder="Ej: nexo2026, HOG-9821 o https://..."
                  className="w-full rounded-2xl border-2 border-border bg-secondary/50 px-4 py-3.5 text-sm font-bold outline-none focus:border-primary focus:bg-card"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pega el enlace completo o el código de 6-8 caracteres que te compartieron.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleJoinSpace}
                  disabled={joining || !joinInput.trim()}
                  className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-40"
                >
                  {joining ? 'Validando invitación...' : 'Unirme al espacio'}
                  <ArrowRight className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Volver a opciones
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* CREATE FLOW: Step 2 (Tipo de uso)                          */}
          {/* ────────────────────────────────────────────────────────── */}
          {mode === 'create' && step === 2 && (
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-balance sm:text-3xl">
                ¿Cómo vas a utilizar USYTask?
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Selecciona la opción que mejor describa vuestro espacio.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {spaceTypes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.98]',
                      type === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-secondary/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-xl',
                        type === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                      )}
                    >
                      <t.icon className="size-5" />
                    </span>
                    <span className="text-sm font-bold">{t.label}</span>
                    {type === t.id && <Check className="ml-auto size-4 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CREATE FLOW: Step 3 (Nombre) */}
          {mode === 'create' && step === 3 && (
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-balance sm:text-3xl">
                ¿Cómo quieres llamar a tu espacio?
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Este nombre identificará tu sistema de organización.
              </p>

              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedType?.sample ?? 'Familia García'}
                className="mt-6 w-full rounded-2xl border-2 border-border bg-secondary/50 px-4 py-4 text-lg font-bold outline-none focus:border-primary focus:bg-card"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span>Ejemplos:</span>
                {spaceTypes.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setName(st.sample)}
                    className="rounded-full bg-secondary px-2.5 py-0.5 hover:bg-border/60 transition-colors"
                  >
                    {st.sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CREATE FLOW: Step 4 (Invitar) */}
          {mode === 'create' && step === 4 && (
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight text-balance sm:text-3xl">
                Invita a las personas de tu espacio
              </h1>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Comparte el acceso a USYTask para mantener todo sincronizado.
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-secondary p-3">
                <span className="truncate text-xs font-bold font-mono text-muted-foreground">
                  usytask.app/invite/abc123
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText('https://usytask.app/invite/abc123')
                    }
                    setCopied(true)
                    toast('Enlace copiado al portapapeles', '🔗')
                    setTimeout(() => setCopied(false), 1500)
                  }}
                  className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-soft"
                  aria-label="Copiar enlace"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toast('Abriendo WhatsApp para compartir USYTask...', '💬')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-soft transition-transform active:scale-95"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => toast('Opción de compartir abierta', '📤')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 text-sm font-bold transition-transform active:scale-95"
                >
                  <Share2 className="size-4" /> Compartir
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for Create Flow */}
          {mode === 'create' && (
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 2 && !type}
                className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                {step === 4 ? 'Entrar en USYTask' : 'Continuar'}
                <ArrowRight className="size-5" />
              </button>

              {step === 4 ? (
                <button
                  type="button"
                  onClick={finishOnboarding}
                  className="py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Lo haré después
                </button>
              ) : step === 2 ? (
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="py-1 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Atrás
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="py-1 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Atrás
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-md text-center text-xs font-medium text-muted-foreground pt-6">
        USYTask · Configuración inicial
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <ToastProvider>
      <OnboardingContent />
    </ToastProvider>
  )
}
