'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { GoogleIcon } from '@/components/ui/google-icon'
import { handleGoogleAuth } from '@/lib/supabase-auth'
import { findUserByEmail, generateUserId, setStoredSession } from '@/lib/user-session'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextTarget = searchParams.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (isDevModeActive()) {
      enableDevMode()
      router.push(nextTarget || '/app')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor, ingresa tu email y contraseña.')
      return
    }

    setLoading(true)

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

    setTimeout(() => {
      setLoading(false)
      router.push(nextTarget || '/app')
    }, 400)
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="mx-auto w-full max-w-md flex justify-between items-center pb-6">
        <Link href="/">
          <UsyTaskLogo size="md" />
        </Link>
        <Link
          href={nextTarget ? `/register?next=${encodeURIComponent(nextTarget)}` : '/register'}
          className="text-sm font-bold text-primary hover:underline"
        >
          Crear cuenta
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/10 p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <UsyTaskLogo size="lg" showSubtitle className="mb-4" />
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl mt-2">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Todo sigue exactamente donde lo dejaste.
            </p>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card font-bold text-foreground shadow-sm transition-transform active:scale-[0.98] hover:border-primary/50 hover:bg-secondary/40"
          >
            <GoogleIcon className="size-5 shrink-0" />
            <span>{googleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
          </button>

          {/* Separador */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-border/80" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              o inicia sesión con email
            </span>
            <div className="h-[1px] flex-1 bg-border/80" />
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-xs font-bold text-muted-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-bold text-muted-foreground">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => alert('Próximamente: Recuperación de contraseña por email.')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  ¿Has olvidado tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              <ArrowRight className="size-5" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-semibold text-muted-foreground pt-4 border-t border-border/60">
            ¿No tienes cuenta?{' '}
            <Link
              href={nextTarget ? `/register?next=${encodeURIComponent(nextTarget)}` : '/register'}
              className="font-bold text-primary hover:underline"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-md text-center text-xs font-medium text-muted-foreground pt-6">
        USYTask — Universal System for Tasks
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3">
            <UsyTaskLogo size="md" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse">Cargando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
