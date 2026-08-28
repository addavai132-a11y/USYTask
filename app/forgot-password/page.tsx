'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { createClient } from '@/lib/supabase'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError('Por favor, introduce tu correo electrónico.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      const redirectTo = `${origin}/auth/callback?next=/reset-password`

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      })

      if (resetError) {
        console.error('Supabase resetPasswordForEmail error:', resetError)
        setError(resetError.message || 'Error al solicitar la recuperación.')
        setLoading(false)
        return
      }

      setIsSubmitted(true)
    } catch (err: any) {
      console.error('Error general en forgot-password:', err)
      setError('Ocurrió un error inesperado. Inténtalo más tarde.')
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
        <Link
          href="/login"
          className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al login</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0e0d1d]/85 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80">
          {!isSubmitted ? (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-3 shadow-lg shadow-purple-950/40">
                  <KeyRound className="size-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
                  Recuperar contraseña
                </h1>
                <p className="mt-2 text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
                  Introduce tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recovery-email" className="text-xs font-semibold text-slate-400">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      id="recovery-email"
                      name="email"
                      type="email"
                      autoComplete="username email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-950/60 transition-all active:scale-[0.98] hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  <span className="text-xs">{loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}</span>
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4 animate-fade-in">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-lg">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="text-xl font-bold text-white">¡Revisa tu correo!</h2>
              <p className="mt-2 text-xs font-medium text-slate-300 leading-relaxed max-w-sm">
                Hemos enviado un enlace a <strong className="text-purple-300 font-bold">{email}</strong> para restablecer tu contraseña.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                (Si no lo ves en unos minutos, revisa tu carpeta de correo no deseado o spam).
              </p>

              <div className="mt-6 flex flex-col w-full gap-2 pt-4 border-t border-white/10">
                <Link
                  href="/login"
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-white/10 font-semibold text-xs text-white hover:bg-white/15 transition-all"
                >
                  Volver a iniciar sesión
                </Link>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-[11px] font-semibold text-purple-400 hover:underline py-1"
                >
                  ¿No recibiste el correo? Probar de nuevo
                </button>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#05050a]" />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
