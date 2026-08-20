'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, AtSign, Calendar, CheckCircle2, ShieldCheck, User } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { getActiveUserSession, updateUserProfile } from '@/lib/supabase-auth'
import {
  UserProfile,
  sanitizeUsername,
  validateDateOfBirth,
  validateUsername,
} from '@/lib/user-session'

function CompleteProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextTarget = searchParams.get('next')

  const [session, setSession] = useState<UserProfile | null>(null)
  const [username, setUsername] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState<string>('')
  const [usernameError, setUsernameError] = useState('')
  const [dateOfBirthError, setDateOfBirthError] = useState('')
  const [formError, setFormError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadSession() {
      try {
        const s = await getActiveUserSession()
        if (!s) {
          router.push(nextTarget ? `/login?next=${encodeURIComponent(nextTarget)}` : '/login')
          return
        }
        if (s.profileCompleted && s.username && (s.dateOfBirth || s.age)) {
          router.push(nextTarget || '/app')
          return
        }
        setSession(s)
        if (s.username) setUsername(s.username)
        if (s.dateOfBirth) setDateOfBirth(s.dateOfBirth)
      } catch (err) {
        console.error('Error loading session in complete-profile:', err)
      } finally {
        setPageLoading(false)
      }
    }
    loadSession()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const uRes = validateUsername(username)
    if (!uRes.valid) {
      setUsernameError(uRes.error || '')
      setFormError('Por favor, ingresa un nombre de usuario válido.')
      return
    }

    const dRes = validateDateOfBirth(dateOfBirth)
    if (!dRes.valid || !dRes.value) {
      setDateOfBirthError(dRes.error || '')
      setFormError(dRes.error || 'Por favor, selecciona una fecha de nacimiento válida.')
      return
    }

    setLoading(true)

    const cleanUser = sanitizeUsername(username)
    const result = await updateUserProfile(cleanUser, dRes.value)

    if (!result.success) {
      setLoading(false)
      setFormError(result.error || 'No se pudo guardar la información del perfil.')
      return
    }

    setLoading(false)
    if (nextTarget) {
      router.push(nextTarget)
    } else {
      router.push('/onboarding')
    }
  }

  const displayUsername = username.trim()
    ? sanitizeUsername(username)
    : session?.fullName
    ? sanitizeUsername(session.fullName)
    : 'Usuario'

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <UsyTaskLogo size="md" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mx-auto w-full max-w-md flex justify-between items-center pb-6">
        <Link href="/">
          <UsyTaskLogo size="md" />
        </Link>
        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="size-4 text-emerald-500" /> Verificación segura
        </span>
      </div>

      {/* Main Card */}
      <div className="mx-auto w-full max-w-md my-auto">
        <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/10 p-6 shadow-xl sm:p-8">
          {/* Header info */}
          <div className="mb-6 flex flex-col items-center text-center">
            {session?.avatarUrl ? (
              <div className="relative mb-3">
                <img
                  src={session.avatarUrl}
                  alt={session.fullName}
                  className="size-16 rounded-full border-2 border-primary object-cover shadow-soft"
                />
                <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                  ✓
                </span>
              </div>
            ) : (
              <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/30">
                <User className="size-8" />
              </div>
            )}
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl mt-1">
              Completa tu perfil
            </h1>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Conectado como <strong className="text-foreground">{session?.email || 'Google User'}</strong>
            </p>
          </div>

          {formError && (
            <div className="mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 1. Nombre de usuario */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="complete-username" className="text-xs font-bold text-muted-foreground">
                  Nombre de usuario <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  3-30 caracteres
                </span>
              </div>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <input
                  id="complete-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Ej. Javier_García o Javier.G"
                  className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-colors ${
                    usernameError
                      ? 'border-rose-500 bg-rose-500/5 focus:border-rose-500'
                      : 'border-border bg-secondary/50 focus:border-primary focus:bg-card'
                  }`}
                />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                Elige cómo quieres que te vean los demás en USYTask.
              </p>

              {usernameError ? (
                <p className="text-xs font-bold text-rose-500 mt-1">{usernameError}</p>
              ) : (
                <div className="mt-1.5 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-bold text-primary">
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    Así aparecerás: <strong className="text-foreground">{displayUsername}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 2. Fecha de nacimiento */}
            <div className="flex flex-col gap-1">
              <label htmlFor="complete-dateOfBirth" className="text-xs font-bold text-muted-foreground">
                Fecha de nacimiento <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
                <input
                  id="complete-dateOfBirth"
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
                <p className="text-[10px] font-medium text-muted-foreground/80 mt-1 leading-relaxed">
                  No mostrar públicamente la fecha de nacimiento por defecto. Es un dato del perfil para calcular tu edad de forma automática.
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !!usernameError || !!dateOfBirthError}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Guardando perfil...' : 'Continuar'}
              <ArrowRight className="size-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-md text-center text-xs font-medium text-muted-foreground pt-6">
        USYTask — Universal System for Tasks
      </div>
    </div>
  )
}

export default function CompleteProfilePage() {
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
      <CompleteProfileContent />
    </Suspense>
  )
}
