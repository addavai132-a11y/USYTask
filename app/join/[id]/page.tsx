import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { JoinInvitationContent } from '@/app/join/page'

interface JoinDynamicParams {
  params: Promise<{ id: string }>
}

export default async function JoinDynamicPage({ params }: JoinDynamicParams) {
  const resolvedParams = await params
  const id = resolvedParams?.id || ''

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      }
    >
      <JoinInvitationContent paramHouseholdId={id} />
    </Suspense>
  )
}
