import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getHouseholdForInvitation } from '@/app/actions/household'
import { JoinInvitationClient, extractHouseholdId } from '@/app/join/join-client'

interface JoinPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Server Component para la ruta /join (con parámetros de consulta como ?household_id=... o ?h=...).
 *
 * En Next.js App Router (Next 15/16), `searchParams` es una Promise que se resuelve con `await searchParams`.
 *
 * OPCIÓN A (Recomendada):
 * Realiza la consulta del nombre de la familia en el servidor usando getHouseholdForInvitation
 * con el Admin Client (SUPABASE_SERVICE_ROLE_KEY). Así se salta las políticas RLS que bloquean
 * las lecturas para los usuarios que aún no pertenecen a household_members.
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  // 1. Extraer ID resolviendo la Promise de searchParams
  const resolvedParams = await searchParams
  const rawId =
    resolvedParams?.household_id ||
    resolvedParams?.h ||
    resolvedParams?.id ||
    resolvedParams?.groupId ||
    resolvedParams?.code ||
    ''

  const paramId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || ''
  const cleanId = extractHouseholdId(paramId)

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

// Re-exportar para compatibilidad con código existente
export { JoinInvitationClient as JoinInvitationContent } from '@/app/join/join-client'
