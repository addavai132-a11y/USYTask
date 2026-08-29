'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { GoogleIcon } from '@/components/ui/google-icon'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { handleGoogleAuth, getActiveUserSession } from '@/lib/supabase-auth'
import { validateInvitationToken, HouseholdInvitation } from '@/lib/invitation'
import { isDevModeActive, enableDevMode } from '@/lib/dev-mode'
import { UserProfile, setStoredSession } from '@/lib/user-session'

function InviteContent({ token }: { token: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  const [session, setSession] = useState<UserProfile | null>(null)
  const [invitation, setInvitation] = useState<HouseholdInvitation | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuthAndToken() {
      try {
        // Validate token
        const valRes = validateInvitationToken(token)
        if (!valRes.valid) {
          setError(valRes.error || 'La invitación no es válida.')
          setLoading(false)
          return
        }

        setInvitation(valRes.invitation || null)

        // Check active user session
        if (isDevModeActive()) {
          enableDevMode()
          const s = await getActiveUserSession()
          setSession(s)
        } else {
          const s = await getActiveUserSession()
          setSession(s)
        }
      } catch (err) {
        console.error('Error loading invitation:', err)
        setError('Error al procesar la invitación.')
      } finally {
        setLoading(false)
      }
    }
    checkAuthAndToken()
  }, [token])

  const handleJoinSpace = async () => {
    if (!invitation) return
    setJoining(true)

    try {
      if (session) {
        // Update user session with joined household
        const updatedUser: UserProfile = {
          ...session,
          profileCompleted: true,
        }
        setStoredSession(updatedUser)
      } else if (isDevModeActive()) {
        enableDevMode()
      }

      setJoined(true)
      toast(`¡Te has unido con éxito a ${invitation.household_name}!`, '🎉')

      setTimeout(() => {
        router.replace('/app')
      }, 1000)
    } catch (err) {
      console.error('Error joining space:', err)
      toast('Error al unirse al espacio', '❌')
      setJoining(false)
    }
  }

  const handleGoogleJoin = async () => {
    setGoogleLoading(true)
    try {
      if (isDevModeActive()) {
        enableDevMode()
        await handleJoinSpace()
        return
      }
      await handleGoogleAuth()
    } catch (err) {
      setGoogleLoading(false)
      toast('Error al iniciar sesión con Google', '❌')
    }
  }

  const householdName = invitation?.household_name || 'Casa Nexo'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <UsyTaskLogo size="md" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">
            Verificando invitación...
          </p>
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
          <ShieldCheck className="size-4 text-emerald-500" /> Invitación oficial
        </span>
      </div>

      {/* Card Content */}
      <div className="mx-auto w-full max-w-md my-auto">
        {error ? (
          /* TOKEN INVALIDO / REVOCADO */
          <div className="rounded-[32px] border border-rose-500/20 bg-gradient-to-br from-card via-card to-rose-500/10 p-6 shadow-xl text-center sm:p-8 animate-fade-in">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="size-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-balance">
              Invitación no disponible
            </h1>
            <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Pide al administrador del espacio que te envíe un nuevo enlace de invitación o código QR.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/login"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
              >
                <span>Ir al inicio de sesión</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/"
                className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Volver a USYTask
              </Link>
            </div>
          </div>
        ) : joined ? (
          /* CONFIRMACIÓN ÉXITO */
          <div className="rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/10 p-8 shadow-xl text-center animate-fade-in">
            <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 border-2 border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="size-10" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-balance">
              ¡Bienvenido a {householdName}!
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Te has unido correctamente al espacio. Entrando a USYTask...
            </p>
          </div>
        ) : (
          /* VISTA PRINCIPAL INVITACIÓN */
          <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-500/10 p-6 shadow-xl sm:p-8 animate-fade-in">
            {/* Header info */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/30 shadow-soft">
                <Users className="size-10 text-primary" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                <Sparkles className="size-3.5" /> Te han invitado a un espacio
              </div>

              <h1 className="text-3xl font-black tracking-tight text-balance">
                {householdName}
              </h1>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Familia · 4 miembros activos
              </p>
            </div>

            {/* SI ESTÁ AUTENTICADO */}
            {session ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-3.5">
                  {session.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt={session.fullName}
                      className="size-10 rounded-full object-cover border border-primary"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                      <User className="size-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Te unirá como</p>
                    <p className="text-sm font-extrabold truncate">{session.fullName || session.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJoinSpace}
                  disabled={joining}
                  className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-soft-lg transition-transform active:scale-95 disabled:opacity-50"
                >
                  {joining ? 'Uniéndote al espacio...' : 'Unirme al espacio'}
                  <ArrowRight className="size-5" />
                </button>
              </div>
            ) : (
              /* SI NO HA INICIADO SESIÓN */
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-center">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">
                    Para unirte necesitas identificarte
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crea tu cuenta o inicia sesión para acceder a {householdName}.
                  </p>
                </div>

                {/* Botón Google */}
                <button
                  type="button"
                  onClick={handleGoogleJoin}
                  disabled={googleLoading}
                  className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card font-bold text-foreground shadow-sm transition-transform active:scale-[0.98] hover:border-primary/50 hover:bg-secondary/40"
                >
                  <GoogleIcon className="size-5 shrink-0" />
                  <span>{googleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
                </button>

                {/* Separador */}
                <div className="my-1 flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-border/80" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    o elige una opción
                  </span>
                  <div className="h-[1px] flex-1 bg-border/80" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/register?next=/invite/${token}`}
                    className="flex h-11 items-center justify-center rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95 text-center"
                  >
                    Crear cuenta
                  </Link>
                  <Link
                    href={`/login?next=/invite/${token}`}
                    className="flex h-11 items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary px-3 text-xs font-bold text-foreground shadow-soft transition-transform active:scale-95 text-center"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mx-auto w-full max-w-md text-center text-xs font-medium text-muted-foreground pt-6">
        USYTask — Universal System for Tasks
      </div>
    </div>
  )
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  return (
    <ToastProvider>
      <InviteContent token={resolvedParams.token} />
    </ToastProvider>
  )
}
