'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { createClient } from '@/lib/supabase'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Cargar el usuario de la sesión actual verificada por el callback
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setEmail(user.email)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Supabase updateUser password error:', updateError)
        setError(updateError.message || 'No se pudo actualizar la contraseña.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/app')
      }, 2000)
    } catch (err: any) {
      console.error('Error restableciendo contraseña:', err)
      setError('Ocurrió un error inesperado al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col justify-between bg-[#05050a] text-white px-4 py-8 sm:px-6 overflow-x-hidden">
      {/* Ambient Radial Aurora Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Top Header */}
      <div className="relative z-10 mx-auto w-full max-w-md flex justify-between items-center pb-6">
        <Link href="/">
          <UsyTaskLogo size="md" />
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0e0d1d]/85 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80">
          {!success ? (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-3 shadow-lg shadow-purple-950/40">
                  <ShieldCheck className="size-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
                  Nueva contraseña
                </h1>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Crea una contraseña segura para tu cuenta de USYTask.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Campo oculto con email y autoComplete="username" para los gestores de contraseñas de iOS / Android */}
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
                  <label htmlFor="new-password" className="text-xs font-semibold text-slate-400">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                {/* Confirmar Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm-new-password" className="text-xs font-semibold text-slate-400">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="confirm-new-password"
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

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-950/60 transition-all active:scale-[0.98] hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  <span className="text-xs">{loading ? 'Actualizando contraseña...' : 'Guardar nueva contraseña'}</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4 animate-fade-in">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-lg">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="text-xl font-bold text-white">¡Contraseña actualizada!</h2>
              <p className="mt-2 text-xs font-medium text-slate-300 leading-relaxed max-w-sm">
                Tu contraseña se ha restablecido correctamente. Redirigiendo a tu espacio de USYTask...
              </p>
              <div className="mt-6 flex w-full pt-4 border-t border-white/10">
                <Link
                  href="/app"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-xs text-white shadow-lg"
                >
                  Ir al Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mx-auto w-full max-w-md text-center text-[11px] font-medium text-slate-500 pt-6">
        USYTask — Universal System for Tasks
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05050a]" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
