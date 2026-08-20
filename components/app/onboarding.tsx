'use client'

import { useEffect, useState } from 'react'
import { Users, Heart, Home as HomeIcon, User, ArrowRight, Copy, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

const ONBOARDED_KEY = 'lifeos-onboarded'

const types = [
  { id: 'family', label: 'Familia', icon: Users, sample: 'Familia García' },
  { id: 'couple', label: 'Pareja', icon: Heart, sample: 'Marcos & Marieli' },
  { id: 'roommates', label: 'Compañeros de piso', icon: HomeIcon, sample: 'Piso Salamanca' },
  { id: 'personal', label: 'Personal', icon: User, sample: 'Mi espacio' },
]

export function Onboarding() {
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [type, setType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(ONBOARDED_KEY) !== '1') setVisible(true)
  }, [])

  const finish = () => {
    localStorage.setItem(ONBOARDED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const selectedType = types.find((t) => t.id === type)

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background animate-fade-in">
      <div className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-6">
        {/* progress dots */}
        <div className="mb-8 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up-fade">
            <UsyTaskLogo size="xl" showSubtitle className="mb-4" />
            <h1 className="mt-4 text-3xl font-black tracking-tight">USYTask</h1>
            <p className="mt-2 text-xs font-extrabold tracking-widest text-primary uppercase">
              Universal System for Tasks
            </p>
            <p className="mt-3 max-w-[260px] text-balance text-base font-medium text-muted-foreground">
              Todo lo importante. Un solo sistema.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col animate-slide-up-fade">
            <h2 className="text-2xl font-black tracking-tight">¿Cómo vas a utilizar USYTask?</h2>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

        {step === 2 && (
          <div className="flex flex-1 flex-col animate-slide-up-fade">
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

        {step === 3 && (
          <div className="flex flex-1 flex-col animate-slide-up-fade">
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

        {/* footer actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => {
              if (step < 3) setStep((s) => s + 1)
              else finish()
            }}
            disabled={step === 1 && !type}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            {step === 0 ? 'Empezar' : step === 3 ? 'Entrar en USYTask' : 'Continuar'}
            <ArrowRight className="size-5" />
          </button>
          {step > 0 && (
            <button onClick={finish} className="py-1 text-sm font-semibold text-muted-foreground">
              {step === 3 ? 'Lo haré después' : 'Saltar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
