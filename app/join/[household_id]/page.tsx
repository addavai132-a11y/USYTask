import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { AlertTriangle, Home, Loader2, CheckCircle2, ArrowRight, XCircle } from 'lucide-react'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'
import { createClient } from '@/lib/supabase-server'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

// ─────────────────────────────────────────────────────────────────────────────
// TIPADOS ESTRICTOS
// ─────────────────────────────────────────────────────────────────────────────

interface HouseholdBasicInfo {
  id: string
  name: string
}

interface PageProps {
  params: Promise<{ household_id?: string; id?: string }>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES DE UI
// ─────────────────────────────────────────────────────────────────────────────

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
        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-mono font-bold text-orange-600 border border-orange-500/20">
          Error al cargar la invitación
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-foreground mt-3 text-balance">
          Ocurrió un error inesperado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs text-balance">
          {message || 'Ocurrió un error al cargar la invitación, inténtalo de nuevo más tarde.'}
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
    </div>
  )
}

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
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-3 text-balance">
          Ya eres miembro de &ldquo;{householdName}&rdquo;
        </h1>
        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <span>Ir al Dashboard</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER COMPONENT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default async function JoinHouseholdPage({ params }: PageProps) {
  try {
    // =========================================================================
    // 1. LECTURA DE PARAMS (Safe Parsing)
    // NOTA: Versión Next.js 16 detectada, 'params' es Promise y debe ser await.
    // =========================================================================
    let rawId = ''
    try {
      const resolvedParams = await params
      rawId = resolvedParams?.household_id || resolvedParams?.id || ''
    } catch (paramErr: any) {
      if (paramErr?.digest === 'DYNAMIC_SERVER_USAGE') throw paramErr
      console.error("🔥 ERROR PARAMS:", { message: paramErr?.message })
      return <InvalidInvitationUI code="PARAM_ERROR" />
    }

    const cleanId = extractHouseholdId(rawId)

    // =========================================================================
    // 2. VALIDACIÓN UUID (Evita consultas innecesarias)
    // =========================================================================
    if (!cleanId || !UUID_REGEX.test(cleanId)) {
      return (
        <InvalidInvitationUI
          message="El identificador de la familia no tiene un formato válido o el enlace está incompleto."
          code="INVALID_UUID"
        />
      )
    }

    // =========================================================================
    // 3. CONSULTA ADMIN PARA PREVISUALIZAR LA FAMILIA
    // =========================================================================
    let family: HouseholdBasicInfo | null = null

    try {
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
      const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

      if (!supabaseUrl || !serviceRoleKey) {
        console.error("🔥 ERROR CONFIG: faltan variables de entorno", {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey,
        })
        throw new Error("Configuración del servidor incompleta (faltan credenciales Supabase).")
      }

      // IMPORTANTE: Este cliente se usa ÚNICA Y EXCLUSIVAMENTE para el SELECT
      // de solo lectura de la familia (households). No reutilizar para nada
      // que dependa del contexto del usuario autenticado actual.
      const supabaseAdmin = createSupabaseJsClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const { data: familyData, error: familyError } = await supabaseAdmin
        .from('households')
        .select('id, name')
        .eq('id', cleanId)
        .maybeSingle()

      if (familyError) {
        console.error("🔥 ERROR SUPABASE ADMIN:", {
          familyId: cleanId,
          message: familyError.message,
          code: familyError.code,
          details: familyError.details,
          hint: familyError.hint,
        })
        return <ServerErrorUI message="Error al consultar la invitación." />
      }

      if (!familyData) {
        // Caso de negocio válido: UUID correcto pero no existe en BD
        return <InvalidInvitationUI code="NOT_FOUND" />
      }

      family = { id: familyData.id, name: familyData.name }
    } catch (adminTryCatchErr: any) {
      console.error("🔥 ERROR SUPABASE ADMIN:", {
        familyId: cleanId,
        message: adminTryCatchErr?.message,
      })
      return <ServerErrorUI message="Ocurrió un error al cargar la invitación, inténtalo de nuevo más tarde." />
    }

    // =========================================================================
    // 4. AUTENTICACIÓN DEL USUARIO ACTUAL (Cliente normal - SSR)
    // =========================================================================
    let currentUserId: string | null = null

    try {
      const supabaseAuth = await createClient() // Usa el helper de SSR para leer cookies
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

      if (authError) {
        console.error("🔥 ERROR SESIÓN:", {
          familyId: cleanId,
          message: authError.message,
          status: authError.status,
        })
        // Asumiremos fallo al validar el token, obligamos a logear de nuevo.
      }

      if (!user) {
        // No hay usuario logueado -> redirect a login.
        redirect(`/login?next=${encodeURIComponent(`/join/${cleanId}`)}`)
      }

      currentUserId = user.id
    } catch (authTryCatchErr: any) {
      if (authTryCatchErr?.digest?.startsWith('NEXT_REDIRECT')) {
        throw authTryCatchErr
      }
      console.error("🔥 ERROR SESIÓN:", {
        familyId: cleanId,
        message: authTryCatchErr?.message,
      })
      return <ServerErrorUI message="No pudimos validar tu sesión." />
    }

    // =========================================================================
    // 5. VERIFICACIÓN DE MEMBRESÍA PREVIA
    // =========================================================================
    try {
      const supabaseMembership = await createClient() // Usar cliente autenticado (sujeto a RLS)
      const { data: membershipData, error: membershipError } = await supabaseMembership
        .from('household_members')
        .select('id')
        .eq('household_id', family.id)
        .eq('user_id', currentUserId)
        .maybeSingle()

      if (membershipError) {
        console.error("🔥 ERROR MEMBRESÍA:", {
          familyId: family.id,
          userId: currentUserId,
          message: membershipError.message,
          code: membershipError.code,
          details: membershipError.details,
        })
        return <ServerErrorUI message="Error al verificar si ya perteneces a esta familia." />
      }

      if (membershipData) {
        // EARLY RETURN si ya es miembro, sin renderizar botón de unirse.
        return <AlreadyMemberUI householdName={family.name} />
      }
    } catch (membershipTryCatchErr: any) {
      console.error("🔥 ERROR MEMBRESÍA:", {
        familyId: family.id,
        userId: currentUserId,
        message: membershipTryCatchErr?.message,
      })
      return <ServerErrorUI message="Error inesperado al validar membresía." />
    }

    // =========================================================================
    // 6. RENDERIZADO DEL CLIENTE DE INVITACIÓN (Aceptación de la invitación)
    // =========================================================================
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <JoinInvitationClient
          paramHouseholdId={family.id}
          initialHousehold={family}
        />
      </Suspense>
    )
  } catch (globalCatchErr: any) {
    if (
      globalCatchErr?.digest?.startsWith('NEXT_REDIRECT') ||
      globalCatchErr?.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw globalCatchErr
    }

    console.error("🔥 ERROR INESPERADO EN JOIN PAGE:", {
      message: globalCatchErr?.message,
      stack: globalCatchErr?.stack,
    })

    return <ServerErrorUI />
  }
}

/*
 ===============================================================================
 REPORTE DE RESOLUCIÓN DE FALLOS SILENCIOSOS
 ===============================================================================
 Anteriormente, varios escenarios podían generar errores silenciosos o un 500
 no manejado (error.tsx). Estos son los puntos corregidos:

 1. Fallo al instanciar Admin Client por falta de variables:
    Antes: getAdminClientSafe() podía devolver null si la key faltaba, cayendo 
    silenciosamente a un cliente autenticado que reventaba por RLS.
    Ahora: Si NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltan, se lanza
    un Error explícito que es capturado, logueado como "🔥 ERROR CONFIG", y
    muestra un UI en lugar de un 500.

 2. Excepción interna de Supabase (ej. timeout de BD, network):
    Antes: await supabase.from(...).maybeSingle() si fallaba a nivel de red,
    o en .single() que lanzaba PGRST116 si no encontraba registros, esto reventaba
    el Server Component.
    Ahora: Se usa SIEMPRE .maybeSingle(). El resultado data/error se desestructura
    siempre. Si hay `error`, se evalúa independientemente. Si es una excepción a nivel JS 
    (promesa rechazada), es atrapada por el bloque try/catch INDIVIDUAL de la consulta Admin.

 3. Excepción en supabase.auth.getUser():
    Antes: Podía ser no controlada.
    Ahora: Tiene su propio try/catch. Si el token está corrupto y genera una excepción,
    lo captura, loguea con "🔥 ERROR SESIÓN", y renderiza ServerErrorUI. 
    Notar que hemos excluido del catch los errores de `redirect()`.

 4. Consulta de membresía previa (family_members -> household_members):
    Antes: Se omitían try/catches dedicados, y usar .single() habría reventado 
    con 406 Not Acceptable (PGRST116) para usuarios que no son miembros (que son 
    la mayoría visitando esta página).
    Ahora: Usa .maybeSingle() y atrapa errores aisladamente. Si hay error de 
    red/permisos, "🔥 ERROR MEMBRESÍA" lo reporta.

 5. Catch Global como última barrera:
    Cualquier cosa fuera de los 3 grandes bloques (como un error parseando params)
    cae al Catch global que loguea con "🔥 ERROR INESPERADO EN JOIN PAGE" y muestra
    ServerErrorUI. NUNCA deja que Next.js levante el error.tsx por su cuenta.
 ===============================================================================
*/
