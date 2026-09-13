import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { getHouseholdForInvitation, HouseholdDetailsResult } from '@/app/actions/household'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Regex estándar de validación de formato UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ household_id?: string; id?: string }>
}

/**
 * UI estándar (JSX) que se renderiza si la familia no se encuentra, el enlace caducó
 * o el ID no es válido. PROHIBIDO llamar a notFound() para evitar pantallas 404 nativas.
 */
function InvalidInvitationUI({
  title = 'Error: No se ha podido encontrar la familia o el enlace ha caducado',
  message = 'No se encontró la familia asociada a este enlace de invitación o el enlace ha caducado.',
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
 * UI que se renderiza cuando el usuario autenticado YA es miembro de la familia.
 * Early return limpio sin cargar el componente cliente de invitación.
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

export default async function JoinHouseholdPage({ params }: PageProps) {
  // 1. AWAIT PARAMS (Crucial en Next.js 15/16 App Router)
  let rawId = ''
  try {
    const resolvedParams = await params
    rawId = resolvedParams?.household_id || resolvedParams?.id || ''
  } catch (paramErr: any) {
    if (paramErr?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw paramErr
    }
    console.error('[JoinHouseholdPage] Error al resolver params asíncronamente:', paramErr)
    return (
      <InvalidInvitationUI
        title="Error: No se ha podido encontrar la familia o el enlace ha caducado"
        message="No se pudo interpretar el enlace de invitación."
        code="PARAM_RESOLVE_ERROR"
      />
    )
  }

  const cleanId = extractHouseholdId(rawId)

  // 2. VALIDACIÓN DE UUID ESTRICTA
  if (!cleanId || !UUID_REGEX.test(cleanId)) {
    return (
      <InvalidInvitationUI
        title="Error: No se ha podido encontrar la familia o el enlace ha caducado"
        message="El identificador de la familia no tiene un formato válido o el enlace está incompleto."
        code="INVALID_UUID"
      />
    )
  }

  // 3. TRY / CATCH DEFENSIVO AL CONSULTAR SUPABASE (Sin llamar a notFound)
  let result: HouseholdDetailsResult | null = null
  try {
    result = await getHouseholdForInvitation(cleanId)
  } catch (err: any) {
    console.error('[JoinHouseholdPage] Error fatal no controlado al consultar Supabase:', err)
    return (
      <InvalidInvitationUI
        title="Error: No se ha podido encontrar la familia o el enlace ha caducado"
        message="Ocurrió un error inesperado al conectar con el servidor. Por favor, intenta de nuevo más tarde."
        code="SERVER_ERROR"
      />
    )
  }

  // 4. Si la familia no existe o no se pudo cargar, renderizar UI de error JSX (NUNCA notFound)
  if (!result || !result.success || !result.household) {
    return (
      <InvalidInvitationUI
        title="Error: No se ha podido encontrar la familia o el enlace ha caducado"
        message={result?.errorMessage || 'No se encontró ninguna familia asociada a este enlace de invitación o ha sido eliminada.'}
        code={result?.errorCode || 'NOT_FOUND'}
      />
    )
  }

  // 5. VERIFICACIÓN DE MEMBRESÍA — ¿El usuario ya pertenece a esta familia?
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.id) {
      // Usar admin client para saltarse RLS en la verificación de membresía
      // (el usuario podría no tener políticas SELECT sobre household_members de otras familias)
      const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
      let checkClient: any = null

      if (serviceRoleKey && serviceRoleKey.length > 20 && serviceRoleKey !== 'tu_clave_service_role_aqui') {
        try {
          checkClient = createAdminClient()
        } catch {
          // Fallback al cliente autenticado
        }
      }

      // Si no hay admin client, usar el cliente con cookies (la verificación de su propia membresía SÍ pasará RLS)
      if (!checkClient) {
        checkClient = supabase
      }

      // Verificar en household_members
      const { data: existingMember } = await checkClient
        .from('household_members')
        .select('id')
        .eq('household_id', result.household.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingMember) {
        console.log(`[JoinHouseholdPage] Usuario ${user.id} ya es miembro de "${result.household.name}" (${result.household.id}). Early return.`)
        return <AlreadyMemberUI householdName={result.household.name} />
      }

      // Verificar también en group_members (esquema alternativo)
      const { data: existingGroupMember } = await checkClient
        .from('group_members')
        .select('id')
        .eq('group_id', result.household.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingGroupMember) {
        console.log(`[JoinHouseholdPage] Usuario ${user.id} ya es miembro (group_members) de "${result.household.name}" (${result.household.id}). Early return.`)
        return <AlreadyMemberUI householdName={result.household.name} />
      }
    }
  } catch (memberCheckErr) {
    // No bloquear el flujo si la verificación de membresía falla — dejar que el cliente lo maneje
    console.warn('[JoinHouseholdPage] Error al verificar membresía (no bloqueante):', memberCheckErr)
  }

  // 6. Si se encontró la familia Y el usuario NO es miembro, renderizamos la vista interactiva
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
        initialHousehold={result.household}
      />
    </Suspense>
  )
}

