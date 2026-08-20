'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Heart, Home as HomeIcon, User, ArrowRight, Copy, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

const spaceTypes = [
  { id: 'family', label: 'Familia', icon: Users, sample: 'Familia García' },
  { id: 'couple', label: 'Pareja', icon: Heart, sample: 'Nuestra casa' },
  { id: 'roommates', label: 'Compañeros de piso', icon: HomeIcon, sample: 'Piso Salamanca' },
  { id: 'personal', label: 'Personal', icon: User, sample: 'Mi espacio' },
]

function OnboardingContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [type, setType] = useState<string | null>('family')
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground px-4 py-8 sm:px-6">
      {/* Top Header & Dots */}
      <div className="mx-auto w-full max-w-md flex flex-col items-center gap-6">
        <UsyTaskLogo size="md" />

        {/* Progress dots */}
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
      </div>

      {/* Card Content */}
      <div className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-[32px] border border-border/80 bg-card p-6 shadow-xl sm:p-8 animate-fade-in">
          {/* STEP 1: Bienvenida */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center">
              <UsyTaskLogo size="xl" showSubtitle className="mb-6" />
              <h1 className="text-3xl font-black tracking-tight text-balance">
                Bienvenido a USYTask
              </h1>
              <p className="mt-1 text-xs font-extrabold tracking-widest text-primary uppercase">
                Universal System for Tasks
              </p>
              <p className="mt-4 text-base font-medium text-muted-foreground text-balance">
                Vamos a crear el espacio desde el que organizarás todo.
              </p>
            </div>
          )}

          {/* STEP 2: Tipo de uso */}
          {step === 2 && (
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

          {/* STEP 3: Nombre del espacio */}
          {step === 3 && (
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

          {/* STEP 4: Invitar personas */}
          {step === 4 && (
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

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 2 && !type}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {step === 1 ? 'Empezar' : step === 4 ? 'Entrar en USYTask' : 'Continuar'}
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
            ) : (
              step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="py-1 text-center text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Atrás
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-md text-center text-xs font-medium text-muted-foreground pt-6">
        USYTask · Configuración inicial (Paso {step} de 4)
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
