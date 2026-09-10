'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Loader2,
  Sparkles,
  Home,
} from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { createClient } from '@/lib/supabase'
import { getHouseholdDetails, joinHousehold } from '@/app/actions/household'
import { useToast } from '@/components/ui/toast'
import { syncFromSupabaseCloud } from '@/lib/cloud-sync'

function JoinInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Leer household_id de la URL (soporta 'household_id', 'h' o 'id')
  const householdId =
    searchParams.get('household_id') ||
    searchParams.get('h') ||
    searchParams.get('id') ||
    ''

  const [loading, setLoading] = useState(true)
  const [householdName, setHouseholdName] = useState<string>('')
  const [resolvedId, setResolvedId] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinedSuccess, setJoinedSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function verifyAuthAndHousehold() {
      if (!householdId) {
        setError('El enlace de invitación no incluye un identificador de familia válido.')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        // 1. Verificar autenticación del usuario
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          // Redirigir a login guardando el parámetro para regresar tras iniciar sesión
          const currentPath = `/join?household_id=${encodeURIComponent(householdId)}`
          router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
          return
        }

        if (!isMounted) return
        setCurrentUser(user)

        // 2. Obtener el nombre REAL de la familia mediante consulta
        const details = await getHouseholdDetails(householdId)

        if (!isMounted) return

        if (!details.success || !details.household) {
          setError(details.error || 'No se pudo encontrar la familia especificada.')
          setLoading(false)
          return
        }

        setHouseholdName(details.household.name)
        setResolvedId(details.household.id)

        // 3. Verificar si ya es miembro
        if (details.isMember) {
          setAlreadyMember(true)
        }
      } catch (err: any) {
        console.error('Error verificando invitación:', err)
        if (isMounted) {
          setError('Ocurrió un error al procesar la invitación. Comprueba tu conexión.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifyAuthAndHousehold()

    return () => {
      isMounted = false
    }
  }, [householdId, router])

  const handleAcceptJoin = async () => {
    if (!resolvedId && !householdId) return
    setJoining(true)
    setError(null)

    try {
      const res = await joinHousehold(resolvedId || householdId)

      if (!res.success) {
        if (res.requiresAuth) {
          const currentPath = `/join?household_id=${encodeURIComponent(householdId)}`
          router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
          return
        }
        if (res.alreadyMember) {
          setAlreadyMember(true)
          toast('Ya eres miembro de esta familia.', 'ℹ️')
          return
        }
        setError(res.error || 'No se pudo completar la unión a la familia.')
        toast(res.error || 'Error al unirse', '❌')
        return
      }

      setJoinedSuccess(true)
      toast(res.message || `¡Bienvenido a ${householdName}!`, '🎉')

      // Sincronizar estado en segundo plano si está disponible
      try {
        await syncFromSupabaseCloud()
      } catch {
        // Silencioso
      }

      setTimeout(() => {
        router.replace('/app')
      }, 1200)
    } catch (err: any) {
      console.error('Error al unirse:', err)
      setError(err?.message || 'Error inesperado al unirse a la familia.')
      toast('Error inesperado', '❌')
    } finally {
      setJoining(false)
    }
  }

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <UsyTaskLogo size="md" />
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
            <Loader2 className="size-4 animate-spin" />
            <span>Verificando invitación y familia...</span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Estado de error / Invitación no encontrada
  if (error && !joinedSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-6 sm:p-8 shadow-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="size-7" />
          </div>
          <h2 className="text-xl font-black text-foreground">Invitación no válida</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => router.replace('/app')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
            >
              <Home className="size-4" />
              <span>Ir al Inicio</span>
            </button>
            <Link
              href="/login"
              className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cambiar de cuenta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Estado de éxito tras unirse
  if (joinedSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in">
        <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card p-6 sm:p-8 shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
            <Sparkles className="size-8" />
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ¡Todo listo!
          </span>
          <h2 className="text-2xl font-black text-foreground mt-3">
            ¡Te has unido a “{householdName}”!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Accediendo a tus tareas, calendario y finanzas compartidas...
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>Entrando a USYTask...</span>
          </div>
        </div>
      </div>
    )
  }

  // 4. Estado: Ya es miembro de la familia
  if (alreadyMember) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <CheckCircle2 className="size-7" />
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
            Miembro actual
          </span>
          <h2 className="text-2xl font-black text-foreground mt-3">
            Ya perteneces a “{householdName}”
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cuenta ya está vinculada a este hogar. Puedes ingresar directamente para gestionar tus tareas y eventos.
          </p>

          <div className="mt-6">
            <button
              onClick={() => router.replace('/app')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
            >
              <span>Abrir USYTask</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 5. Pantalla Principal de Aceptación de Invitación
  const userName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.user_metadata?.username ||
    currentUser?.email?.split('@')[0] ||
    'Usuario'
  const userEmail = currentUser?.email || ''

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 bg-background text-foreground">
      {/* Cabecera con Logo */}
      <div className="w-full max-w-md pt-6 flex justify-center">
        <UsyTaskLogo size="md" />
      </div>

      {/* Tarjeta de Aceptación */}
      <div className="w-full max-w-md my-auto rounded-[32px] border border-emerald-500/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3">
          <Users className="size-7" />
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Invitación Familiar
        </span>

        <p className="text-xs font-bold text-muted-foreground mt-3 uppercase tracking-wider">
          Has sido invitado a unirte a
        </p>

        {/* Nombre REAL de la familia obtenido de Supabase */}
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1 text-balance">
          {householdName}
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xs">
          Comparte tareas del hogar, listas de la compra, calendario familiar y finanzas en tiempo real.
        </p>

        {/* Identidad del usuario que se va a unir */}
        <div className="w-full mt-6 rounded-2xl border border-border bg-secondary/50 p-3.5 flex items-center gap-3 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
          <UserCheck className="size-4 text-emerald-500 shrink-0" />
        </div>

        {/* Botón Principal de Aceptar */}
        <div className="w-full mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleAcceptJoin}
            disabled={joining}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm sm:text-base font-bold text-primary-foreground shadow-soft transition-transform active:scale-95 disabled:opacity-50"
          >
            {joining ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Uniéndote al hogar...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Aceptar y Unirme al Hogar</span>
              </>
            )}
          </button>

          <Link
            href="/app"
            className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar y volver a mi espacio
          </Link>
        </div>
      </div>

      {/* Pie de página discreto */}
      <div className="w-full max-w-md pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          USYTask — Organización y colaboración para el hogar
        </p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <JoinInvitationContent />
    </Suspense>
  )
}
