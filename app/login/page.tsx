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
    let mounted = true

    async function checkSessionAndFamily() {
      try {
        if (isDevModeActive()) {
          router.replace(nextTarget || '/app')
          return
        }

        const supabase = createClient()
        const { data: sessionData } = await supabase.auth.getSession()
        const storedUser = getStoredSession()
        const hasActiveSession = Boolean(sessionData?.session?.user || storedUser)

        if (hasActiveSession) {
          // Si el usuario viene de un enlace de invitación (/join), respetar 'next' prioritariamente
          if (nextTarget && nextTarget.startsWith('/join')) {
            router.replace(nextTarget)
            return
          }

          try {
            await syncFromSupabaseCloud()
            const { hasFamily } = await getUserFamilyStatus()

            const finalTarget =
              nextTarget && nextTarget !== '/login' && nextTarget !== '/'
                ? nextTarget
                : hasFamily
                ? '/app'
                : '/onboarding'

            router.replace(finalTarget)
          } catch {
            const finalTarget =
              nextTarget && nextTarget !== '/login' && nextTarget !== '/'
                ? nextTarget
                : '/app'
            router.replace(finalTarget)
          }
        }
      } catch (err) {
        console.error('Error in login session verification:', err)
      }
    }

    checkSessionAndFamily()

    return () => {
      mounted = false
    }
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
      // Pasar nextTarget para que Supabase OAuth redirija de vuelta a /join tras autenticar
      await handleGoogleAuth(nextTarget || undefined)
    } catch (err: any) {
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
      const supabase = createClient()

      // 1. Intentar iniciar sesión real en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (!authError && authData.user) {
        const u = authData.user
        setStoredSession({
          id: u.id,
          fullName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuario',
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'usuario',
          dateOfBirth: u.user_metadata?.date_of_birth || '1996-01-01',
          email: u.email || email.trim(),
          authProvider: 'email',
          profileCompleted: true,
          createdAt: u.created_at,
        })
      } else {
        // Fallback: buscar usuario en almacén local
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
      }

      // 2. Determinar destino de redirección respetando 'next'
      if (nextTarget && nextTarget.startsWith('/join')) {
        router.replace(nextTarget)
        return
      }

      let hasFamily = false
      try {
        await syncFromSupabaseCloud()
        const res = await getUserFamilyStatus()
        hasFamily = res.hasFamily
      } catch (syncErr) {
        console.warn('Sync on login warning:', syncErr)
      }

      setTimeout(() => {
        setLoading(false)
        if (nextTarget && nextTarget !== '/login' && nextTarget !== '/') {
          router.replace(nextTarget)
        } else if (hasFamily) {
          router.replace('/app')
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

      {/* Main Card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-purple-950/20">
          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Bienvenido de nuevo
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {nextTarget?.startsWith('/join')
                ? 'Inicia sesión para unirte a la familia compartida'
                : 'Introduce tus datos para acceder a tu hogar'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Social Logins */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/20 active:scale-[0.99] disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <GoogleIcon className="size-4" />
              )}
              <span>Continuar con Google</span>
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-[#0b0b14] px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              O con tu email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:brightness-110 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 mx-auto w-full max-w-md pt-6 text-center text-xs text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link
          href={nextTarget ? `/register?next=${encodeURIComponent(nextTarget)}` : '/register'}
          className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Regístrate gratis
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
