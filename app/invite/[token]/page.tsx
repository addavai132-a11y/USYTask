'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { UsyTaskLogo } from '@/components/ui/usytask-logo'

function InviteRedirect({ token }: { token: string }) {
  const router = useRouter()

  useEffect(() => {
    if (token) {
      router.replace(`/join?household_id=${encodeURIComponent(token)}`)
    } else {
      router.replace('/app')
    }
  }, [token, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <UsyTaskLogo size="md" />
      <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
        <Loader2 className="size-4 animate-spin" />
        <span>Redirigiendo a la invitación...</span>
      </div>
    </div>
  )
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  return <InviteRedirect token={resolvedParams.token} />
}
