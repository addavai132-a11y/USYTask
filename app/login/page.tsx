'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { GoogleIcon } from '@/components/ui/google-icon'
import { handleGoogleAuth, getActiveUserSession } from '@/lib/supabase-auth'
import { createClient } from '@/lib/supabase'
import { findUserByEmail, generateUserId, setStoredSession, getStoredSession } from '@/lib/user-session'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'
import { getUserFamilyStatus, syncFromSupabaseCloud } from '@/lib/cloud-sync'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextTarget = searchParams.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Auto redirect if already logged in
  useEffect(() => {
    async function checkSessionAndFamily() {
      try {
        if (isDevModeActive()) {
          router.replace(nextTarget || '/app')
          return
        }
        const session = getStoredSession()
        const supabase = createClient()
        const { data: sessionData } = await supabase.auth.getSession()

        if (session || sessionData?.session?.user) {
          try {
            await syncFromSupabaseCloud()
            const { hasFamily } = await getUserFamilyStatus()
            if (hasFamily) {
              router.replace(nextTarget || '/app')
            } else {
              router.replace('/onboarding')
            }
          } catch {
            router.replace(nextTarget || '/app')
          }
        }
      } catch (err) {
        console.error('Error in login session verification:', err)
      }
    }
    checkSessionAndFamily()
  }, [router, nextTarget])

  const handleGoogleLogin = async () => {
    if (isDevModeActive()) {
      enableDevMode()
      router.replace(nextTarget || '/app')
      return
    }
    setError('')
    setGoogleLoading(true)
    try {
      await handleGoogleAuth()
    } catch (err) {
      setGoogleLoading(false)
      setError('Error al conectar con Google. Por favor intenta de nuevo.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor, ingresa tu email y contraseña.')
      return
    }

    setLoading(true)

    try {
      // Find user or create active session
      let user = findUserByEmail(email)
      if (!user) {
        user = {
          id: generateUserId(),
          fullName: email.split('@')[0],
          username: email.split('@')[0],
          dateOfBirth: '1996-01-01',
          email: email.trim(),
          authProvider: 'email',
          profileCompleted: true,
          createdAt: new Date().toISOString(),
        }
      }

      setStoredSession(user)

      let hasFamily = true
      try {
        await syncFromSupabaseCloud()
        const res = await getUserFamilyStatus()
        hasFamily = res.hasFamily
      } catch (syncErr) {
        console.warn('Sync on login warning:', syncErr)
      }

      setTimeout(() => {
        setLoading(false)
        if (hasFamily) {
          router.replace(nextTarget || '/app')
        } else {
          router.replace('/onboarding')
        }
      }, 200)
    } catch (err: any) {
      console.error('Login submit error:', err)
      setLoading(false)
      setError(err?.message || 'Error al iniciar sesión. Por favor intenta de nuevo.')
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
          href={nextTarget ? `/register?next=${encodeURIComponent(nextTarget)}` : '/register'}
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Crear cuenta
        </Link>
      </div>

      {/* Floating Central Dark Glass Card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0e0d1d]/75 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <UsyTaskLogo size="lg" showSubtitle className="mb-3" />
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl mt-1">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Todo sigue exactamente donde lo dejaste.
            </p>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 font-semibold text-slate-200 shadow-sm transition-all active:scale-[0.98] hover:border-purple-500/30 hover:bg-white/[0.04]"
          >
            <GoogleIcon className="size-5 shrink-0" />
            <span className="text-xs">{googleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          {/* Separador */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              o inicia sesión con email
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-slate-400">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="login-email"
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

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-400">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  ¿Has olvidado tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-950/60 transition-all active:scale-[0.98] hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/30 disabled:opacity-50"
            >
              <span className="text-xs">{loading ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-medium text-slate-400 pt-4 border-t border-white/10">
            ¿No tienes cuenta?{' '}
            <Link
              href={nextTarget ? `/register?next=${encodeURIComponent(nextTarget)}` : '/register'}
              className="font-semibold text-purple-400 hover:underline"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mx-auto w-full max-w-md text-center text-[11px] font-medium text-slate-500 pt-6">
        USYTask — Universal System for Tasks
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#05050a] text-white">
          <div className="flex flex-col items-center gap-3">
            <UsyTaskLogo size="md" />
            <p className="text-xs font-semibold text-slate-400 animate-pulse">Cargando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
