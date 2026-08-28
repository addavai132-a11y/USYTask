'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail, User, AtSign, Calendar, CheckCircle2 } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { GoogleIcon } from '@/components/ui/google-icon'
import { handleGoogleAuth, getActiveUserSession } from '@/lib/supabase-auth'
import { createClient } from '@/lib/supabase'
import {
  UserProfile,
  calculateAge,
  generateUserId,
  sanitizeUsername,
  setStoredSession,
  getStoredSession,
  validateDateOfBirth,
  validateUsername,
} from '@/lib/user-session'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextTarget = searchParams.get('next')

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [terms, setTerms] = useState(false)

  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [dateOfBirthError, setDateOfBirthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Auto redirect if already logged in
  useEffect(() => {
    if (isDevModeActive()) {
      router.replace(nextTarget || '/app')
      return
    }
    const session = getStoredSession()
    if (session) {
      router.replace(nextTarget || '/app')
      return
    }
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (supaSession?.user) {
        getActiveUserSession().then(() => {
          router.replace(nextTarget || '/app')
        })
      }
    })
  }, [router, nextTarget])

  const handleUsernameChange = (val: string) => {
    setUsername(val)
    if (val.trim()) {
      const res = validateUsername(val)
      setUsernameError(res.valid ? '' : (res.error || ''))
    } else {
      setUsernameError('')
    }
  }

  const handleDateOfBirthChange = (val: string) => {
    setDateOfBirth(val)
    if (val.trim()) {
      const res = validateDateOfBirth(val)
      setDateOfBirthError(res.valid ? '' : (res.error || ''))
    } else {
      setDateOfBirthError('')
    }
  }

  const handleGoogleRegister = async () => {
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

    if (!fullName || !username || !dateOfBirth || !email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos obligatorios.')
      return
    }

    const uRes = validateUsername(username)
    if (!uRes.valid) {
      setError(uRes.error || 'El nombre de usuario no es válido.')
      setUsernameError(uRes.error || '')
      return
    }

    const dRes = validateDateOfBirth(dateOfBirth)
    if (!dRes.valid || !dRes.value) {
      setError(dRes.error || 'La fecha de nacimiento no es válida.')
      setDateOfBirthError(dRes.error || '')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!terms) {
      setError('Debes aceptar los términos y política de privacidad.')
      return
    }

    setLoading(true)

    const newUser: UserProfile = {
      id: generateUserId(),
      fullName: fullName.trim(),
      username: sanitizeUsername(username),
      dateOfBirth: dRes.value,
      age: calculateAge(dRes.value),
      email: email.trim(),
      authProvider: 'email',
      profileCompleted: true,
      createdAt: new Date().toISOString(),
    }

    setStoredSession(newUser)

    setTimeout(() => {
      setLoading(false)
      if (nextTarget) {
        router.push(nextTarget)
      } else {
        router.push('/onboarding')
      }
    }, 400)
  }

  const displayUsername = username.trim()
    ? sanitizeUsername(username)
    : fullName.trim()
    ? sanitizeUsername(fullName)
    : 'Marcos García'

  return (
    <div className="relative min-h-screen min-h-[100dvh] flex flex-col justify-between bg-[#05050a] text-white px-4 py-8 sm:px-6 overflow-x-hidden">
      {/* Ambient Radial Aurora Glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-purple-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-indigo-600/15 blur-[120px]" />

      {/* Top Header */}
      <div className="relative z-10 mx-auto w-full max-w-md flex justify-between items-center pb-6">
        <Link href="/">
          <UsyTaskLogo size="md" />
        </Link>
        <Link
          href={nextTarget ? `/login?next=${encodeURIComponent(nextTarget)}` : '/login'}
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>

      {/* Floating Central Dark Glass Card */}
      <div className="relative z-10 mx-auto w-full max-w-md my-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-[#0e0d1d]/75 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <UsyTaskLogo size="lg" showSubtitle className="mb-3" />
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl mt-1">
              Empieza a ponerlo todo en orden.
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Crea tu espacio y organiza todo lo importante desde un único sistema.
            </p>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
              o continúa con email
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 1. Nombre y apellidos */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-xs font-semibold text-slate-400">
                Nombre y apellidos
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Marcos García"
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* 2. Nombre de usuario */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="username" className="text-xs font-semibold text-slate-400">
                  Nombre de usuario <span className="text-purple-400">*</span>
                </label>
                <span className="text-[10px] font-medium text-slate-500">
                  3-30 caracteres
                </span>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Ej. Marcos_21 o Marcos.G"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-semibold text-white outline-none transition-all ${
                    usernameError
                      ? 'border-rose-500/50 bg-rose-500/10 focus:border-rose-500'
                      : 'border-white/10 bg-black/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40'
                  }`}
                />
              </div>

              {usernameError ? (
                <p className="text-xs font-bold text-rose-400 mt-0.5">{usernameError}</p>
              ) : (
                <div className="mt-0.5 flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/20 px-3 py-2 text-xs font-semibold text-purple-300">
                  <CheckCircle2 className="size-3.5 shrink-0 text-purple-400" />
                  <span className="truncate">
                    Así aparecerás en USYTask: <strong className="text-white font-bold">{displayUsername}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 3. Fecha de nacimiento */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-400">
                Fecha de nacimiento <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 pointer-events-none" />
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-4 text-xs font-semibold text-white outline-none transition-all ${
                    dateOfBirthError
                      ? 'border-rose-500/50 bg-rose-500/10 focus:border-rose-500'
                      : 'border-white/10 bg-black/50 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40'
                  }`}
                />
              </div>
            </div>

            {/* 4. Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* 5. Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* 6. Confirmar contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition-all"
                />
              </div>
            </div>

            {/* Checkbox */}
            <label className="mt-1 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-white/20 text-purple-600 focus:ring-purple-500 bg-black"
              />
              <span className="text-xs font-medium text-slate-400">
                Acepto los términos y política de privacidad de USYTask.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !!usernameError || !!dateOfBirthError}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white shadow-lg shadow-purple-950/60 transition-all active:scale-[0.98] hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/30 disabled:opacity-50"
            >
              <span className="text-xs">{loading ? 'Creando cuenta...' : 'Crear mi cuenta'}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-medium text-slate-400 pt-4 border-t border-white/10">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href={nextTarget ? `/login?next=${encodeURIComponent(nextTarget)}` : '/login'}
              className="font-semibold text-purple-400 hover:underline"
            >
              Iniciar sesión
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

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  )
}
