'use client'

import { useState } from 'react'
import { X, ArrowRight, ArrowLeft, Sparkles, Check, Copy, QrCode, Users } from 'lucide-react'
import { useApp } from './app-context'
import { SpaceType, createNewSpace, spaceTypeLabels } from '@/lib/spaces'
import { getInvitationUrl } from '@/lib/invitation'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '@/components/ui/toast'

export function CreateSpaceModal() {
  const { createSpaceModalOpen, closeCreateSpaceModal, switchSpace, setTab } = useApp()
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<SpaceType>('family')
  const [spaceName, setSpaceName] = useState('')
  const [createdSpaceId, setCreatedSpaceId] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<string>('')
  const [copied, setCopied] = useState(false)

  if (!createSpaceModalOpen) return null

  const handleReset = () => {
    setStep(1)
    setSelectedType('family')
    setSpaceName('')
    setCreatedSpaceId(null)
    closeCreateSpaceModal()
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!spaceName.trim()) return

    const newSpace = createNewSpace(spaceName, selectedType)
    setCreatedSpaceId(newSpace.id)
    setCreatedToken(newSpace.inviteToken)
    setStep(3)
    toast(`Espacio "${newSpace.name}" creado con éxito`, '🎉')
  }

  const inviteUrl = createdToken ? getInvitationUrl(createdToken) : ''

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
    }
    setCopied(true)
    toast('Enlace de invitación copiado', '📋')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFinish = () => {
    if (createdSpaceId) {
      switchSpace(createdSpaceId)
    }
    handleReset()
  }

  const handleGoToProfile = () => {
    if (createdSpaceId) {
      switchSpace(createdSpaceId)
    }
    handleReset()
    setTab('perfil')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-[36px] border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleReset}
          className="absolute right-4 top-4 rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* PASO 1: TIPO DE ESPACIO */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                Paso 1 de 2
              </span>
              <h2 className="text-2xl font-black tracking-tight">
                ¿Qué tipo de espacio quieres crear?
              </h2>
              <p className="text-xs text-muted-foreground">
                Selecciona la opción que mejor describa a tu grupo
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 my-2">
              {(Object.keys(spaceTypeLabels) as SpaceType[]).map((type) => {
                const meta = spaceTypeLabels[type]
                const isSelected = selectedType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-soft'
                        : 'border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/70'
                    }`}
                  >
                    <span className="text-2xl">{meta.icon}</span>
                    <span className="font-extrabold text-sm flex-1 text-foreground">
                      {meta.label}
                    </span>
                    {isSelected && (
                      <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              <span>Continuar</span>
              <ArrowRight className="size-5" />
            </button>
          </div>
        )}

        {/* PASO 2: NOMBRE DEL ESPACIO */}
        {step === 2 && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                  Paso 2 de 2
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1">¿Cómo quieres llamarlo?</h2>
              <p className="text-xs text-muted-foreground">
                Podrás cambiar el nombre en cualquier momento desde los ajustes.
              </p>
            </div>

            <div className="flex flex-col gap-2 my-2">
              <label htmlFor="spaceName" className="text-xs font-bold text-muted-foreground">
                Nombre del espacio <span className="text-rose-500">*</span>
              </label>
              <input
                id="spaceName"
                type="text"
                required
                autoFocus
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="Ej. Familia García, Marcos & Laura, Piso Salamanca..."
                className="w-full rounded-2xl border border-border bg-secondary/50 py-3.5 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
              />

              <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                <span className="text-[11px] text-muted-foreground font-semibold">Ejemplos:</span>
                {['Familia Rivera', 'Marcos & Laura', 'Piso Salamanca', 'Casa de verano'].map(
                  (ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSpaceName(ex)}
                      className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                    >
                      {ex}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!spaceName.trim()}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <span>Crear espacio</span>
              <ArrowRight className="size-5" />
            </button>
          </form>
        )}

        {/* PASO 3: CONFIRMACIÓN Y LISTO */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/30">
              <Sparkles className="size-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight">Tu nuevo espacio está listo</h2>
              <p className="text-sm font-bold text-primary mt-1">“{spaceName}”</p>
            </div>

            {/* QR PREVIEW */}
            {inviteUrl && (
              <div className="p-4 bg-white rounded-2xl border border-emerald-500/30 shadow-sm my-1">
                <QRCodeSVG value={inviteUrl} size={130} level="M" />
              </div>
            )}

            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-secondary font-bold text-foreground text-xs shadow-xs"
              >
                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-primary" />}
                <span>{copied ? 'Enlace copiado' : 'Copiar enlace de invitación'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
              >
                <span>Entrar al espacio</span>
                <ArrowRight className="size-5" />
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Lo haré después
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
