'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type Toast = { id: number; message: string; emoji?: string }

const ToastContext = createContext<{ toast: (message: string, emoji?: string) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, emoji?: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, emoji }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 2600)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-soft-lg animate-slide-up-fade"
          >
            {t.emoji && <span aria-hidden="true">{t.emoji}</span>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
