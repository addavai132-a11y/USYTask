'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Lock, Mail, User, AtSign, Calendar, CheckCircle2 } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { GoogleIcon } from '@/components/ui/google-icon'
import { handleGoogleAuth } from '@/lib/supabase-auth'
import {
  UserProfile,
  calculateAge,
  generateUserId,
  sanitizeUsername,
  setStoredSession,
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
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="mx-auto w-full max-w-md flex justify-between items-center pb-6">
        <Link href="/">
          <UsyTaskLogo size="md" />
        </Link>
        <Link
          href={nextTarget ? `/login?next=${encodeURIComponent(nextTarget)}` : '/login'}
          className="text-sm font-bold text-primary hover:underline"
        >
          Iniciar sesión
        </Link>
      </div>

      {/* Main Register Form */}
      <div className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/10 p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <UsyTaskLogo size="lg" showSubtitle className="mb-4" />
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl mt-2">
              Empieza a ponerlo todo en orden.
            </h1>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Crea tu espacio y organiza todo lo importante desde un único sistema.
            </p>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
              o continúa con email
            </span>
            <div className="h-[1px] flex-1 bg-border/80" />
          </div>

          {error && (
            <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 1. Nombre y apellidos */}
            <div className="flex flex-col gap-1">
              <label htmlFor="fullName" className="text-xs font-bold text-muted-foreground">
                Nombre y apellidos
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Marcos García"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* 2. Nombre de usuario */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="username" className="text-xs font-bold text-muted-foreground">
                  Nombre de usuario <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  3-30 caracteres
                </span>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Ej. Marcos_21 o Marcos.G"
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-colors ${
                    usernameError
                      ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                      : 'border-border bg-secondary/50 focus:border-primary focus:bg-card'
                  }`}
                />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                Así te verán los demás miembros de tus espacios.
              </p>

              {usernameError ? (
                <p className="text-xs font-bold text-rose-500 mt-1">{usernameError}</p>
              ) : (
                <div className="mt-1 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    Así aparecerás en USYTask: <strong className="text-foreground">{displayUsername}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 3. Fecha de nacimiento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="dateOfBirth" className="text-xs font-bold text-muted-foreground">
                Fecha de nacimiento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
                <input
                  id="dateOfBirth"
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(e.target.value)}
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-colors ${
                    dateOfBirthError
                      ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                      : 'border-border bg-secondary/50 focus:border-primary focus:bg-card'
                  }`}
                />
              </div>
              {dateOfBirthError ? (
                <p className="text-xs font-bold text-rose-500 mt-1">{dateOfBirthError}</p>
              ) : (
                <p className="text-[10px] font-medium text-muted-foreground/80 mt-0.5">
                  No mostrar públicamente la fecha de nacimiento por defecto.
                </p>
              )}
            </div>

            {/* 4. Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-bold text-muted-foreground">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* 5. Contraseña */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-bold text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* 6. Confirmar contraseña */}
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="text-xs font-bold text-muted-foreground">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </div>

            {/* Checkbox */}
            <label className="mt-1 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-medium text-muted-foreground">
                Acepto los términos y política de privacidad de USYTask.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !!usernameError || !!dateOfBirthError}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
              <ArrowRight className="size-5" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-semibold text-muted-foreground pt-4 border-t border-border/60">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href={nextTarget ? `/login?next=${encodeURIComponent(nextTarget)}` : '/login'}
              className="font-bold text-primary hover:underline"
            >
              Iniciar sesión
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

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  )
}
