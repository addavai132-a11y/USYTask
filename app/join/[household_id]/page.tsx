import { Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, Loader2 } from 'lucide-react'
import { getHouseholdForInvitation, HouseholdDetailsResult } from '@/app/actions/household'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

// Regex estándar de validación de formato UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PageProps {
  params: Promise<{ household_id?: string; id?: string }>
}

/**
 * UI amigable que se renderiza directamente si el UUID no es válido
 * o si ocurre un fallo fatal de conexión, evitando crasheos y errores 500.
 */
function InvalidInvitationUI({
  title = 'Enlace de invitación inválido',
  message = 'El enlace no incluye un identificador de familia válido o está cortado.',
  code = 'INVALID_UUID',
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

        <h1 className="text-2xl font-black text-foreground mt-3">
          {title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2.5 w-full">
          <Link
            href="/app"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <Home className="size-4" />
            <span>Ir a USYTask</span>
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

export default async function JoinHouseholdPage({ params }: PageProps) {
  // 1. REGLA 1: AWAIT PARAMS (Crucial en Next.js 15/16 App Router)
  let rawId = ''
  try {
    const resolvedParams = await params
    rawId = resolvedParams?.household_id || resolvedParams?.id || ''
  } catch (paramErr) {
    console.error('[JoinHouseholdPage] Error al resolver params asíncronamente:', paramErr)
    return (
      <InvalidInvitationUI
        title="Error en el enlace"
        message="No se pudo interpretar el enlace de invitación."
        code="PARAM_RESOLVE_ERROR"
      />
    )
  }

  const cleanId = extractHouseholdId(rawId)

  // 2. REGLA 2: VALIDACIÓN DE UUID ESTRICTA
  // Si no es un UUID válido, evitamos que Postgres lance '22P02: invalid input syntax for type uuid'
  if (!cleanId || !UUID_REGEX.test(cleanId)) {
    return (
      <InvalidInvitationUI
        title="Enlace de invitación inválido"
        message="El identificador de la familia no tiene un formato UUID válido o el enlace está incompleto."
        code="INVALID_UUID"
      />
    )
  }

  // 3. REGLA 3: TRY / CATCH DEFENSIVO AL CONSULTAR SUPABASE
  let result: HouseholdDetailsResult | null = null
  try {
    result = await getHouseholdForInvitation(cleanId)
  } catch (err: any) {
    // Registro detallado en los logs de Vercel / servidor
    console.error('[JoinHouseholdPage] Error fatal no controlado al consultar Supabase:', err)
    return (
      <InvalidInvitationUI
        title="No pudimos cargar la invitación"
        message="Ocurrió un error inesperado al conectar con el servidor. Por favor, intenta de nuevo más tarde."
        code="SERVER_ERROR"
      />
    )
  }

  // Si la consulta devolvió un resultado controlado, renderizamos la vista de invitación
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
        initialHousehold={result?.household || null}
        initialError={
          result && !result.success
            ? {
                code: result.errorCode || 'NOT_FOUND',
                message: result.errorMessage || result.error || 'Familia no encontrada',
                details: result.errorDetails,
              }
            : null
        }
      />
    </Suspense>
  )
}
