'use client'

import { useState, useEffect } from 'react'
import { X, Lock, KeyRound, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { getStoredSession } from '@/lib/user-session'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setError('')
      setNewPassword('')
      setConfirmPassword('')
      const session = getStoredSession()
      if (session?.email) {
        setEmail(session.email)
      }
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
        setError(updateError.message || 'No se pudo actualizar la contraseña.')
        setLoading(false)
        return
      }

      toast('Contraseña actualizada correctamente', '🔐')
      onClose()
    } catch (err: any) {
      console.error('Error general al cambiar contraseña:', err)
      setError('Ocurrió un error inesperado al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-purple-500/25 bg-[#0e0d1d] shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <KeyRound className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cambiar contraseña</h3>
              <p className="text-xs text-slate-400">Actualiza la clave de tu cuenta</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input oculto username/email para Password Managers de iOS y Android */}
          <input
            type="email"
            name="username"
            autoComplete="username email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sr-only pointer-events-none opacity-0 h-0 w-0"
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Nueva Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-new-password" className="text-xs font-semibold text-slate-400">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                id="modal-new-password"
                name="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-10 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-confirm-password" className="text-xs font-semibold text-slate-400">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                id="modal-confirm-password"
                name="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all active:scale-95 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              <span>{loading ? 'Guardando...' : 'Actualizar contraseña'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
