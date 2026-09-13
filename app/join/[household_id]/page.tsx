import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { AlertTriangle, Home, Loader2, CheckCircle2, ArrowRight, XCircle } from 'lucide-react'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'
import { createClient } from '@/lib/supabase-server'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

// ─────────────────────────────────────────────────────────────────────────────
// ESQUEMA VERIFICADO (migraciones 20260911 / 20260912):
//   - Tabla: public.households        → columnas: id (UUID PK), name (TEXT), created_by (UUID)
//   - Tabla: public.household_members → columnas: id, household_id (FK), user_id (FK), name, role
//   - RLS en households: SELECT permitido a authenticated y anon (USING true)
//   - RLS en household_members: SELECT permitido si user_id = auth.uid() o el usuario ya es miembro
//                                INSERT permitido si auth.uid() = user_id
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos explícitos para los datos de Supabase ─────────────────────────────

/** Datos mínimos de la familia para la pantalla de invitación (solo lectura). */
interface HouseholdBasicInfo {
  id: string
  name: string
}

/** Resultado de verificar membresía del usuario actual en una familia. */
interface MembershipRow {
  id: string
}

// ── Configuración de la página ──────────────────────────────────────────────

/** Regex estándar de validación de formato UUID v4. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ household_id?: string; id?: string }>
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES DE UI ESTÁTICOS (Server Components puros — sin "use client")
// ─────────────────────────────────────────────────────────────────────────────

/**
 * UI para invitación no válida (familia inexistente, UUID malformado, enlace expirado).
 * PROHIBIDO llamar a notFound() — siempre renderizar JSX amigable.
 */
function InvalidInvitationUI({
  title = 'Invitación no válida o expirada',
  message = 'No se encontró la familia asociada a este enlace de invitación.',
  code = 'NOT_FOUND',
}: {
  title?: string
  message?: string
  code?: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md pt-6 flex justify-center">
        <UsyTaskLogo size="md" />
      </div>

      <div className="w-full max-w-md my-auto rounded-[32px] border border-destructive/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <AlertTriangle className="size-7" />
        </div>

        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-mono font-bold text-destructive border border-destructive/20">
          Código: {code}
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-foreground mt-3 text-balance">
          {title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <Home className="size-4" />
            <span>Volver al Inicio</span>
          </Link>

          <Link
            href="/login"
            className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión con otra cuenta
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          USYTask — Organización y colaboración para el hogar
        </p>
      </div>
    </div>
  )
}

/**
 * UI para errores de conexión / excepciones de Supabase (distinta de "familia no encontrada").
 */
function ServerErrorUI({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md pt-6 flex justify-center">
        <UsyTaskLogo size="md" />
      </div>

      <div className="w-full max-w-md my-auto rounded-[32px] border border-orange-500/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 mb-4">
          <XCircle className="size-7" />
        </div>

        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20">
          Error de servidor
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-foreground mt-3 text-balance">
          No se pudo cargar la invitación
        </h1>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
          {message || 'Ocurrió un error al conectar con el servidor. Por favor, inténtalo de nuevo más tarde.'}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <Home className="size-4" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          USYTask — Organización y colaboración para el hogar
        </p>
      </div>
    </div>
  )
}

/**
 * UI que se renderiza cuando el usuario autenticado YA es miembro de la familia.
 * Early return limpio — NUNCA debe mostrarse el botón "Unirse".
 */
function AlreadyMemberUI({ householdName }: { householdName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-md pt-6 flex justify-center">
        <UsyTaskLogo size="md" />
      </div>

      <div className="w-full max-w-md my-auto rounded-[32px] border border-primary/30 bg-card p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-fade-in">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="size-7" />
        </div>

        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20">
          Miembro actual
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-3 text-balance">
          Ya eres miembro de &ldquo;{householdName}&rdquo;
        </h1>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
          Tu cuenta ya está vinculada a este hogar. Puedes acceder directamente para gestionar tus tareas, calendario y finanzas compartidas.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <span>Ir al Dashboard</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href="/login"
            className="py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cambiar de cuenta
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          USYTask — Organización y colaboración para el hogar
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚠️  IMPORTANTE — SEGURIDAD:
//   Este archivo es un Server Component (NO tiene "use client").
//   La variable process.env.SUPABASE_SERVICE_ROLE_KEY SOLO existe en el servidor.
//   NUNCA se debe importar este archivo desde un componente cliente.
//   NUNCA se debe pasar la service_role key como prop al cliente.
//
// ─────────────────────────────────────────────────────────────────────────────

export default async function JoinHouseholdPage({ params }: PageProps) {
  try {
    // ── PASO 1: Resolver params (async en Next.js 15/16 App Router) ──────
    let rawId = ''
    try {
      const resolvedParams = await params
      rawId = resolvedParams?.household_id || resolvedParams?.id || ''
    } catch (paramErr: any) {
      // Propagar errores internos de Next.js (ej: DYNAMIC_SERVER_USAGE)
      if (paramErr?.digest === 'DYNAMIC_SERVER_USAGE') {
        throw paramErr
      }
      console.error('[JoinPage] Error al resolver params:', { error: paramErr })
      return <InvalidInvitationUI message="No se pudo interpretar el enlace de invitación." code="PARAM_ERROR" />
    }

    const cleanId = extractHouseholdId(rawId)

    // ── PASO 2: Validación de UUID estricta ──────────────────────────────
    if (!cleanId || !UUID_REGEX.test(cleanId)) {
      console.warn('[JoinPage] UUID inválido recibido:', { rawId, cleanId })
      return (
        <InvalidInvitationUI
          message="El identificador de la familia no tiene un formato válido o el enlace está incompleto."
          code="INVALID_UUID"
        />
      )
    }

    // ── PASO 3: Obtener datos de la familia con Service Role (bypass RLS) ─
    //
    // Se usa createClient de @supabase/supabase-js (NO el helper de SSR/cookies)
    // inicializado con SUPABASE_SERVICE_ROLE_KEY para garantizar que el SELECT
    // funcione incluso si el usuario no está autenticado o no es miembro.
    //
    // SOLO se seleccionan columnas públicas no sensibles: {id, name}.
    //
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

    let household: HouseholdBasicInfo | null = null

    if (supabaseUrl && serviceRoleKey && serviceRoleKey.length > 20 && serviceRoleKey !== 'tu_clave_service_role_aqui') {
      // ⚠️ ESTA KEY NUNCA DEBE EXPONERSE AL CLIENTE — solo existe en el servidor.
      const supabaseAdmin = createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      console.log(`[JoinPage] Consultando familia "${cleanId}" con cliente Admin (service_role)...`)

      const { data, error } = await supabaseAdmin
        .from('households')
        .select('id, name')
        .eq('id', cleanId)
        .maybeSingle()

      if (error) {
        console.error('[JoinPage] Error de Supabase al consultar familia con service role:', {
          familyId: cleanId,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        })
        // Distinguir: error de conexión/consulta ≠ familia no encontrada
        return <ServerErrorUI message={`Error de base de datos: ${error.message}`} />
      }

      if (data) {
        household = { id: data.id, name: data.name }
        console.log(`[JoinPage] ✅ Familia encontrada: "${data.name}" (${data.id})`)
      }
    } else {
      // Fallback: si no hay service role key, intentar con el cliente de cookies
      console.warn('[JoinPage] ⚠️ SUPABASE_SERVICE_ROLE_KEY no configurada. Usando cliente de cookies como fallback.')

      try {
        const supabaseCookie = await createClient()
        const { data, error } = await supabaseCookie
          .from('households')
          .select('id, name')
          .eq('id', cleanId)
          .maybeSingle()

        if (error) {
          console.error('[JoinPage] Error de Supabase al consultar familia (cookie client):', {
            familyId: cleanId,
            error: {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            },
          })
          return <ServerErrorUI message={`Error de base de datos: ${error.message}. Si el error es de permisos (RLS), configura SUPABASE_SERVICE_ROLE_KEY en .env.local.`} />
        }

        if (data) {
          household = { id: data.id, name: data.name }
        }
      } catch (cookieErr: any) {
        console.error('[JoinPage] Excepción al consultar familia con cookie client:', {
          familyId: cleanId,
          error: cookieErr,
        })
        return <ServerErrorUI />
      }
    }

    // ── PASO 4: Familia no encontrada (dato vacío, no error de conexión) ──
    if (!household) {
      console.warn(`[JoinPage] Familia no encontrada para ID "${cleanId}". Posible enlace expirado o ID incorrecto.`)
      return (
        <InvalidInvitationUI
          title="Invitación no válida o expirada"
          message="No se encontró ninguna familia asociada a este enlace de invitación. El enlace puede haber caducado o ser incorrecto."
          code="NOT_FOUND"
        />
      )
    }

    // ── PASO 5: Obtener usuario autenticado actual (cliente de cookies) ───
    let currentUserId: string | null = null

    try {
      const supabaseAuth = await createClient()
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

      if (authError) {
        console.warn('[JoinPage] Error al obtener usuario autenticado:', {
          familyId: cleanId,
          error: { message: authError.message, status: authError.status },
        })
      }

      if (!user) {
        // No hay usuario logueado → redirigir a login con URL de retorno
        console.log(`[JoinPage] Usuario no autenticado. Redirigiendo a login con redirect_to=/join/${cleanId}`)
        redirect(`/login?next=${encodeURIComponent(`/join/${cleanId}`)}`)
      }

      currentUserId = user.id
    } catch (authErr: any) {
      // redirect() de Next.js lanza un error especial con digest — hay que propagarlo
      if (authErr?.digest?.startsWith('NEXT_REDIRECT')) {
        throw authErr
      }
      console.error('[JoinPage] Excepción al verificar autenticación:', {
        familyId: cleanId,
        error: authErr,
      })
      // Si falla la autenticación, dejamos que el componente cliente lo maneje
    }

    // ── PASO 6: Verificación de membresía previa (EARLY RETURN) ──────────
    //
    // ANTES de renderizar el botón "Unirse", verificamos si el usuario
    // ya es miembro de esta familia. Esta consulta usa el cliente autenticado
    // normal (cookies), ya que RLS SÍ permite a un usuario consultar
    // sus propias filas en household_members (user_id = auth.uid()).
    //
    if (currentUserId) {
      try {
        const supabaseMembership = await createClient()

        const { data: existingMember, error: memberError } = await supabaseMembership
          .from('household_members')
          .select('id')
          .eq('household_id', household.id)
          .eq('user_id', currentUserId)
          .maybeSingle()

        if (memberError) {
          console.warn('[JoinPage] Error al verificar membresía (no bloqueante):', {
            familyId: household.id,
            userId: currentUserId,
            error: {
              message: memberError.message,
              code: memberError.code,
              details: memberError.details,
            },
          })
          // No bloqueamos el flujo — si la consulta falla, dejamos que el cliente lo maneje
        }

        if (existingMember) {
          console.log(`[JoinPage] ✅ Usuario ${currentUserId} ya es miembro de "${household.name}" (${household.id}). Early return.`)
          return <AlreadyMemberUI householdName={household.name} />
        }
      } catch (memberCheckErr: any) {
        console.warn('[JoinPage] Excepción al verificar membresía (no bloqueante):', {
          familyId: household.id,
          userId: currentUserId,
          error: memberCheckErr,
        })
        // No bloquear el flujo — dejar que el componente cliente lo maneje
      }
    }

    // ── PASO 7: Renderizar la vista interactiva de aceptación ────────────
    //
    // Si llegamos aquí:
    //   ✅ La familia existe y tenemos su nombre
    //   ✅ El usuario está autenticado (o se le redirigió a login)
    //   ✅ El usuario NO es miembro de la familia todavía
    //
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <JoinInvitationClient
          paramHouseholdId={cleanId}
          initialHousehold={household}
        />
      </Suspense>
    )
  } catch (outerErr: any) {
    // ── CATCH GLOBAL — Captura cualquier excepción no controlada ─────────
    //
    // Propagar errores internos de Next.js (redirect, DYNAMIC_SERVER_USAGE, etc.)
    if (
      outerErr?.digest?.startsWith('NEXT_REDIRECT') ||
      outerErr?.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw outerErr
    }

    console.error('[JoinPage] ❌ EXCEPCIÓN GLOBAL no controlada en Server Component:', {
      message: outerErr?.message,
      code: outerErr?.code,
      stack: outerErr?.stack,
      name: outerErr?.name,
    })

    // NUNCA propagar como 500 genérico — siempre renderizar fallback amigable
    return <ServerErrorUI />
  }
}
