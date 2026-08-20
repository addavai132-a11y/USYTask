'use client'

import { useEffect, useState } from 'react'
import { X, Share, Plus, Sparkles } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useInstallPrompt } from '@/hooks/use-pwa'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'

const DISMISS_KEY = 'usytask-install-dismissed'

export function InstallPwa() {
  const { canInstall, isIos, installed, promptInstall } = useInstallPrompt()
  const { interactions } = useApp()
  const { toast } = useToast()
  const [dismissed, setDismissed] = useState(true)
  const [iosSheet, setIosSheet] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  const eligible = !installed && !dismissed && interactions >= 4 && (canInstall || isIos)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (eligible) {
      const id = setTimeout(() => setShow(true), 400)
      return () => clearTimeout(id)
    }
    setShow(false)
  }, [eligible])

  const close = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  const onAdd = async () => {
    if (isIos) {
      setIosSheet(true)
      return
    }
    const ok = await promptInstall()
    if (ok) toast('USYTask añadido a tu móvil', '🎉')
    close()
  }

  return (
    <>
      {show && (
        <div className="safe-bottom fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-8 lg:left-auto lg:right-8 lg:w-96 lg:px-0">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-soft-lg animate-slide-up-fade">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Ten USYTask siempre a mano</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Accede a tu espacio y tareas con un solo toque.
              </p>
            </div>
            <button
              onClick={onAdd}
              className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
            >
              Añadir
            </button>
            <button aria-label="Cerrar" onClick={close} className="shrink-0 text-muted-foreground">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <BottomSheet open={iosSheet} onClose={() => { setIosSheet(false); close() }} title="Añade USYTask a tu iPhone">
        <ol className="flex flex-col gap-3">
          <li className="flex items-center gap-3 rounded-2xl bg-secondary p-3 text-sm font-medium">
            <Share className="size-5 shrink-0 text-primary" />
            <span>Pulsa el botón <strong>Compartir</strong> en la barra de Safari.</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-secondary p-3 text-sm font-medium">
            <Plus className="size-5 shrink-0 text-primary" />
            <span>Elige <strong>Añadir a pantalla de inicio</strong>.</span>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-secondary p-3 text-sm font-medium">
            <Sparkles className="size-5 shrink-0 text-primary" />
            <span>Abre USYTask como una app más, ¡listo!</span>
          </li>
        </ol>
      </BottomSheet>
    </>
  )
}
