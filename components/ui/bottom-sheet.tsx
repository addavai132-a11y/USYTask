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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-foreground/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'safe-bottom relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 pb-8 shadow-soft-lg animate-sheet-up',
          'sm:max-w-md sm:rounded-3xl sm:pb-6',
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />
        {title && <h2 className="mb-4 text-lg font-bold text-balance">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
