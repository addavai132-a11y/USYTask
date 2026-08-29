'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Heart, Home as HomeIcon, User, ArrowRight, Copy, Share2, Check, KeyRound, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { validateInvitationToken } from '@/lib/invitation'

const ONBOARDED_KEY = 'lifeos-onboarded'

const types = [
  { id: 'family', label: 'Familia', icon: Users, sample: 'Familia García' },
  { id: 'couple', label: 'Pareja', icon: Heart, sample: 'Marcos & Marieli' },
  { id: 'roommates', label: 'Compañeros de piso', icon: HomeIcon, sample: 'Piso Salamanca' },
  { id: 'personal', label: 'Personal', icon: User, sample: 'Mi espacio' },
]

export function Onboarding() {
  const router = useRouter()
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [step, setStep] = useState(1)
  const [type, setType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(ONBOARDED_KEY) !== '1') setVisible(true)
  }, [])

  const finish = () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setVisible(false)
  }

  const handleJoinSpace = () => {
    setJoinError('')
    const input = joinInput.trim()
    if (!input) {
      setJoinError('Introduce un código o enlace de invitación.')
      return
    }

    let cleanToken = input
    if (cleanToken.includes('/invite/')) {
      cleanToken = cleanToken.split('/invite/')[1]?.split('?')[0]?.split('#')[0] || cleanToken
    }

    const valRes = validateInvitationToken(cleanToken)
    if (!valRes.valid) {
      setJoinError(valRes.error || 'Código o enlace no válido.')
      return
    }

    setJoining(true)
    finish()
    toast(`¡Te has unido con éxito a ${valRes.invitation?.household_name || 'tu espacio'}!`, '🎉')
    setTimeout(() => {
      router.push(`/invite/${cleanToken}`)
    }, 500)
  }

  if (!visible) return null

  const selectedType = types.find((t) => t.id === type)

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background/95 backdrop-blur-xl animate-fade-in">
      <div className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-8 pt-8">
        {/* Header & Logo */}
        <div className="flex flex-col items-center gap-4">
          <UsyTaskLogo size="md" />

          {/* progress dots (create mode) */}
          {mode === 'create' && (
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── CHOOSE MODE ── */}
        {mode === 'choose' && (
          <div className="flex flex-col items-center justify-center text-center my-auto animate-slide-up-fade">
            <UsyTaskLogo size="xl" showSubtitle className="mb-4" />
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Bienvenido a USYTask</h1>
            <p className="mt-1 text-xs font-extrabold tracking-widest text-primary uppercase">
              Universal System for Tasks
            </p>
            <p className="mt-3 max-w-[280px] text-balance text-sm font-medium text-muted-foreground">
              Elige cómo deseas empezar a organizar tu vida.
            </p>

            <div className="mt-6 flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setMode('create')
                  setStep(1)
                }}
                className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left transition-all active:scale-[0.98] hover:border-primary hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <PlusCircle className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Crear nueva familia</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Crear un espacio nuevo</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-primary" />
              </button>

              <button
                type="button"
                onClick={() => setMode('join')}
                className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all active:scale-[0.98] hover:border-border/80 hover:bg-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground shadow-sm">
                    <KeyRound className="size-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Ya tengo una (Unirse)</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Pegar código o enlace</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* ── JOIN MODE ── */}
        {mode === 'join' && (
          <div className="flex flex-col my-auto animate-slide-up-fade">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Unirse a una familia</h2>
                <p className="text-xs text-muted-foreground">Introduce el código o enlace recibido</p>
              </div>
            </div>

            {joinError && (
              <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
                {joinError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">
                Código o enlace de invitación
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
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleJoinSpace}
                disabled={joining || !joinInput.trim()}
                className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                {joining ? 'Validando...' : 'Unirme al espacio'}
                <ArrowRight className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* ── CREATE MODE: Step 1 (Tipo de uso) ── */}
        {mode === 'create' && step === 1 && (
          <div className="flex flex-col my-auto animate-slide-up-fade">
            <h2 className="text-2xl font-black tracking-tight">¿Cómo vas a utilizar USYTask?</h2>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98]',
                    type === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      type === t.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
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

        {/* ── CREATE MODE: Step 2 (Nombre) ── */}
        {mode === 'create' && step === 2 && (
          <div className="flex flex-col my-auto animate-slide-up-fade">
            <h2 className="text-2xl font-black tracking-tight text-balance">¿Cómo quieres llamar a tu espacio?</h2>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedType?.sample ?? 'Familia García'}
              className="mt-6 w-full rounded-2xl border-2 border-border bg-card px-4 py-4 text-lg font-bold outline-none focus:border-primary"
            />
            <p className="mt-3 text-sm text-muted-foreground">Podrás cambiarlo cuando quieras.</p>
          </div>
        )}

        {/* ── CREATE MODE: Step 3 (Invitar) ── */}
        {mode === 'create' && step === 3 && (
          <div className="flex flex-col my-auto animate-slide-up-fade">
            <h2 className="text-2xl font-black tracking-tight">Invita a los tuyos</h2>
            <p className="mt-2 text-sm text-muted-foreground">Comparte el enlace para unirse al instante.</p>
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-secondary p-3">
              <span className="truncate text-sm font-semibold font-mono text-muted-foreground">usytask.app/invite/abc123</span>
              <button
                onClick={() => {
                  setCopied(true)
                  toast('Enlace copiado', '🔗')
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary"
                aria-label="Copiar enlace"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => toast('Abriendo WhatsApp', '💬')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 font-bold text-white transition-transform active:scale-95"
              >
                WhatsApp
              </button>
              <button
                onClick={() => toast('Compartir', '📤')}
                className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 font-bold transition-transform active:scale-95"
              >
                <Share2 className="size-4" /> Compartir
              </button>
            </div>
          </div>
        )}

        {/* Footer actions in create mode */}
        {mode === 'create' && (
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => {
                if (step < 3) setStep((s) => s + 1)
                else finish()
              }}
              disabled={step === 1 && !type}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {step === 3 ? 'Entrar en USYTask' : 'Continuar'}
              <ArrowRight className="size-5" />
            </button>
            <button
              onClick={() => {
                if (step === 1) setMode('choose')
                else setStep((s) => s - 1)
              }}
              className="py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Atrás
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
