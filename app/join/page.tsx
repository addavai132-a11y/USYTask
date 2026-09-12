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
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { createClient } from '@/lib/supabase'
import { getHouseholdDetails, joinHousehold } from '@/app/actions/household'
import { useToast } from '@/components/ui/toast'
import { syncFromSupabaseCloud } from '@/lib/cloud-sync'

/**
 * Limpia y normaliza el identificador de la familia para evitar fallos si
 * se pasa una URL completa o parámetros malformados.
 */
function extractHouseholdId(raw: string | null | undefined): string {
  if (!raw) return ''
  let val = raw.trim()
  if (!val) return ''

  // Si contiene formato de URL o path
  if (val.includes('/join/')) {
    val = val.split('/join/')[1]?.split('?')[0]?.split('#')[0] || val
  }
  if (val.includes('household_id=')) {
    val = val.split('household_id=')[1]?.split('&')[0]?.split('#')[0] || val
  }
  if (val.includes('h=')) {
    val = val.split('h=')[1]?.split('&')[0]?.split('#')[0] || val
  }

  try {
    return decodeURIComponent(val.trim())
  } catch {
    return val.trim()
  }
}

export function JoinInvitationContent({ paramHouseholdId }: { paramHouseholdId?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // 1. Leer el household_id desde params o searchParams (con soporte para múltiples alias)
  const rawSearchId =
    searchParams?.get('household_id') ||
    searchParams?.get('h') ||
    searchParams?.get('id') ||
    searchParams?.get('groupId') ||
    searchParams?.get('code') ||
    ''

  const householdId = extractHouseholdId(paramHouseholdId || rawSearchId)

  const [loading, setLoading] = useState(true)
  const [householdName, setHouseholdName] = useState<string>('')
  const [resolvedId, setResolvedId] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  
  // Errores de carga inicial (ej: ID no existe)
  const [loadError, setLoadError] = useState<{
    code?: string
    message: string
    details?: string
  } | null>(null)

  // Errores específicos ocurridos durante la acción de unirse (INSERT)
  const [joinError, setJoinError] = useState<{
    code?: string
    message: string
    details?: string
    hint?: string
  } | null>(null)

  const [joining, setJoining] = useState(false)
  const [joinedSuccess, setJoinedSuccess] = useState(false)
  const [copiedError, setCopiedError] = useState(false)

  // Verificación de autenticación y carga de la familia
  useEffect(() => {
    let isMounted = true

    async function verifyAuthAndHousehold() {
      if (!householdId) {
        setLoadError({
          code: 'NO_ID',
          message: 'El enlace de invitación no incluye un identificador de familia válido.',
        })
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // 1. Verificar si el usuario está autenticado en Supabase
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          // Redirigir a login guardando el parámetro exacto para regresar tras iniciar sesión
          const currentPath = `/join?household_id=${encodeURIComponent(householdId)}`
          router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
          return
        }

        if (!isMounted) return
        setCurrentUser(user)

        // Obtener access token para que la consulta al server respete auth.uid() en RLS
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token

        // 2. Obtener el nombre REAL de la familia en Supabase
        const details = await getHouseholdDetails(householdId, token)

        if (!isMounted) return

        if (!details.success || !details.household) {
          setLoadError({
            code: details.errorCode || 'LOOKUP_FAILED',
            message: details.errorMessage || details.error || 'No se pudo encontrar la familia especificada.',
            details: details.errorDetails,
          })
          setLoading(false)
          return
        }

        setHouseholdName(details.household.name)
        setResolvedId(details.household.id)

        // 3. Verificar si el usuario ya pertenece a esta familia
        if (details.isMember) {
          setAlreadyMember(true)
        }
      } catch (err: any) {
        console.error('Error verificando invitación:', err)
        if (isMounted) {
          setLoadError({
            code: 'EXCEPTION',
            message: err?.message || 'Error de conexión al procesar la invitación.',
          })
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

  // Ejecutar el Server Action de unión con reporte exacto de errores
  const handleAcceptJoin = async () => {
    const targetId = resolvedId || householdId
    if (!targetId) return

    setJoining(true)
    setJoinError(null)

    try {
      const supabase = createClient()

      // Re-verificar autenticación antes del INSERT
      const {
        data: { user: verifiedUser },
        error: verifyError,
      } = await supabase.auth.getUser()

      if (verifyError || !verifiedUser) {
        toast('Debes iniciar sesión para unirte a la familia.', '🔒')
        const currentPath = `/join?household_id=${encodeURIComponent(targetId)}`
        router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
        return
      }

      // Obtener el JWT activo
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      // Ejecutar Server Action pasando token de autenticación
      const res = await joinHousehold(targetId, token)

      if (!res.success) {
        if (res.requiresAuth) {
          const currentPath = `/join?household_id=${encodeURIComponent(targetId)}`
          router.replace(`/login?next=${encodeURIComponent(currentPath)}`)
          return
        }

        if (res.alreadyMember) {
          setAlreadyMember(true)
          toast('Ya perteneces a esta familia.', 'ℹ️')
          return
        }

        // Registrar el error exacto de Supabase para mostrar en la interfaz
        const errObj = {
          code: res.errorCode || 'UNKNOWN',
          message: res.errorMessage || res.error || 'Error al procesar el INSERT en la base de datos.',
          details: res.errorDetails,
          hint: res.errorHint,
        }

        setJoinError(errObj)
        toast(`Error [${errObj.code}]: ${errObj.message}`, '❌')
        return
      }

      // Éxito
      setJoinedSuccess(true)
      toast(res.message || `¡Bienvenido a ${householdName}!`, '🎉')

      try {
        await syncFromSupabaseCloud()
      } catch {}

      setTimeout(() => {
        router.replace('/app')
      }, 1200)
    } catch (err: any) {
      console.error('Error al unirse:', err)
      const errObj = {
        code: 'CLIENT_EXCEPTION',
        message: err?.message || 'Error inesperado al conectar con el servidor.',
      }
      setJoinError(errObj)
      toast(`Error inesperado: ${errObj.message}`, '❌')
    } finally {
      setJoining(false)
    }
  }

  const copyErrorToClipboard = () => {
    if (!joinError && !loadError) return
    const activeErr = joinError || loadError
    const text = `Error Supabase [${activeErr?.code || 'NO_CODE'}]: ${activeErr?.message}\nDetalles: ${activeErr?.details || 'N/A'}`
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text)
    }
    setCopiedError(true)
    toast('Error copiado al portapapeles', '📋')
    setTimeout(() => setCopiedError(false), 2000)
  }

  // 1. Estado de carga inicial
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <UsyTaskLogo size="md" />
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
            <Loader2 className="size-4 animate-spin" />
            <span>Verificando autenticación y familia...</span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Estado de error de carga inicial (ej: ID inexistente o RLS al hacer SELECT)
  if (loadError && !joinedSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-6 sm:p-8 shadow-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="size-7" />
          </div>
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-mono font-bold text-destructive border border-destructive/20">
            Código: {loadError.code || 'ERROR'}
          </span>
          <h2 className="text-xl font-black text-foreground mt-3">Error al Cargar la Invitación</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadError.message}</p>

          {loadError.details && (
            <p className="mt-2 text-xs font-mono text-muted-foreground bg-secondary/70 p-2 rounded-xl text-left break-all">
              {loadError.details}
            </p>
          )}

          {loadError.code === '42501' && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs text-left font-medium">
              ⚠️ <strong>Error de políticas RLS:</strong> La tabla <code>households</code> no permite lectura pública o a usuarios autenticados. Ejecuta la política SELECT en Supabase.
            </div>
          )}

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

        {/* Identidad del usuario autenticado */}
        <div className="w-full mt-5 rounded-2xl border border-border bg-secondary/50 p-3.5 flex items-center gap-3 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
          <UserCheck className="size-4 text-emerald-500 shrink-0" />
        </div>

        {/* ALERTA ROJA DESTACADA EN CASO DE ERROR DE SUPABASE / RLS */}
        {joinError && (
          <div className="w-full mt-4 p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-left text-destructive animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-destructive" />
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-destructive">
                    Error de Supabase [{joinError.code || 'FAIL'}]
                  </p>
                  <button
                    type="button"
                    onClick={copyErrorToClipboard}
                    className="flex items-center gap-1 text-[10px] font-bold text-destructive/80 hover:text-destructive p-1 rounded-lg hover:bg-destructive/20 transition-colors"
                    title="Copiar error"
                  >
                    {copiedError ? <Check className="size-3" /> : <Copy className="size-3" />}
                    <span>{copiedError ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <p className="mt-1 font-mono text-[11px] font-semibold break-all">
                  {joinError.message}
                </p>

                {joinError.details && (
                  <p className="mt-1 text-[10px] opacity-80 break-all">
                    <strong>Detalles:</strong> {joinError.details}
                  </p>
                )}

                {joinError.hint && (
                  <p className="mt-1 text-[10px] opacity-80">
                    <strong>Sugerencia:</strong> {joinError.hint}
                  </p>
                )}

                {joinError.code === '42501' && (
                  <div className="mt-2.5 p-2 rounded-xl bg-destructive/20 border border-destructive/30 text-[11px] font-medium text-foreground">
                    ⚠️ <strong>Causa identificada:</strong> Faltan permisos de Row Level Security (RLS) en Supabase para <code>household_members</code>. Ejecuta la sentencia SQL <code>CREATE POLICY ... FOR INSERT ... WITH CHECK (auth.uid() = user_id)</code> en el SQL Editor.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                <span>Uniendo a la familia...</span>
              </>
            ) : joinError ? (
              <>
                <RefreshCw className="size-4" />
                <span>Reintentar Unión</span>
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

      {/* Pie de página */}
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
