import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, Loader2 } from 'lucide-react'
import { getHouseholdForInvitation, HouseholdDetailsResult } from '@/app/actions/household'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

// Regex estándar de validación de formato UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface JoinPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
 * Server Component para la ruta /join (?household_id=... o ?id=... o ?h=...).
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  // 1. AWAIT SEARCHPARAMS (Next.js 15+)
  let rawId = ''
  try {
    const resolvedParams = await searchParams
    const rawVal =
      resolvedParams?.household_id ||
      resolvedParams?.h ||
      resolvedParams?.id ||
      resolvedParams?.groupId ||
      resolvedParams?.code ||
      ''
    rawId = Array.isArray(rawVal) ? rawVal[0] : (rawVal as string) || ''
  } catch (paramErr: any) {
    if (paramErr?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw paramErr
    }
    console.error('[JoinPage] Error resolviendo searchParams:', paramErr)
    return (
      <InvalidInvitationUI
        title="Error: No se ha podido encontrar la familia o el enlace ha caducado"
        message="No se pudo interpretar los parámetros de la invitación."
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
        message="El identificador de la familia no tiene un formato válido o no se especificó en el enlace."
        code="INVALID_UUID"
      />
    )
  }

  // 3. TRY / CATCH DEFENSIVO AL CONSULTAR SUPABASE (Sin llamar a notFound)
  let result: HouseholdDetailsResult | null = null
  try {
    result = await getHouseholdForInvitation(cleanId)
  } catch (err: any) {
    console.error('[JoinPage] Error fatal no controlado al consultar Supabase:', err)
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

// Re-exportar para compatibilidad con código existente
export { JoinInvitationClient as JoinInvitationContent } from '@/app/join/join-client'
