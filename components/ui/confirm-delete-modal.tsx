'use client'

import { useEffect, ReactNode } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  icon?: ReactNode
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Eliminar elemento?',
  description = 'Esta acción no se puede deshacer. Se borrará permanentemente de tu cuenta.',
  itemName,
  confirmText = 'Eliminar permanentemente',
  cancelText = 'Cancelar',
  isDestructive = true,
  icon,
}: ConfirmDeleteModalProps) {
  // Handle ESC key to close safely
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-2xl bg-[#100e23]/95 backdrop-blur-xl border border-red-500/30 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative text-left'
        )}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Cerrar"
        >
          <X className="size-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
            {icon || <AlertTriangle className="size-5" />}
          </div>
          <div className="space-y-1 min-w-0 pr-4">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              {title}
            </h3>
            {itemName && (
              <div className="inline-block max-w-full truncate px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-semibold text-purple-200">
                «{itemName}»
              </div>
            )}
          </div>
        </div>

        {/* Warning Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-purple-500/15">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] hover:text-white transition-colors"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              'rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-950/40 transition-all active:scale-95 flex items-center gap-2',
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            )}
          >
            <Trash2 className="size-4 shrink-0 stroke-[2.5]" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
