import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getHouseholdForInvitation } from '@/app/actions/household'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'

interface JoinDynamicParams {
  params: Promise<{ id: string }>
}

/**
 * Server Component para la ruta dinámica /join/[id].
 *
 * En Next.js App Router (Next 15/16), `params` es una Promise que se resuelve con `await params`.
 *
 * OPCIÓN A (Recomendada):
 * Consulta los datos básicos de la familia (id y name) desde el servidor usando
 * getHouseholdForInvitation (que utiliza el cliente Admin con SUPABASE_SERVICE_ROLE_KEY).
 * De este modo, se salta el bloqueo RLS que afecta a los usuarios no miembros,
 * garantizando que la tarjeta de invitación cargue al instante y sin errores.
 */
export default async function JoinDynamicPage({ params }: JoinDynamicParams) {
  // 1. Extraer ID resolviendo la Promise de params
  const resolvedParams = await params
  const rawId = resolvedParams?.id || ''
  const cleanId = extractHouseholdId(rawId)

  // 2. Consulta en el servidor con Admin Client (Opción A)
  const result = cleanId ? await getHouseholdForInvitation(cleanId) : null

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
