'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/60 dark:bg-black/75 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'safe-bottom relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] bg-white text-slate-900 dark:bg-[#0e0d1d]/95 dark:text-white border border-slate-200 dark:border-purple-500/20 p-6 pb-8 shadow-2xl backdrop-blur-2xl animate-sheet-up',
          'sm:max-w-md sm:rounded-3xl sm:pb-6',
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-purple-500/30 sm:hidden" />
        {title && <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
