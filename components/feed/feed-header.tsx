'use client'

import { Bell, Plus } from 'lucide-react'
import { members, getMember, getGreeting, getTodayLabel, currentUser } from '@/lib/mock-data'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'

export function FeedHeader() {
  const { setNotificationsOpen } = useApp()
  const { toast } = useToast()
  const me = getMember(currentUser)

  return (
    <header className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-balance">
            {getGreeting()}, {me.name} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-0.5 text-sm font-medium text-muted-foreground">{getTodayLabel()}</p>
        </div>
        <button
          onClick={() => setNotificationsOpen(true)}
          aria-label="Notificaciones"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-soft transition-transform active:scale-90"
        >
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-card" />
        </button>
      </div>

      <div className="no-scrollbar mt-4 flex items-center gap-3 overflow-x-auto">
        {members.map((m) => (
          <div key={m.id} className="flex shrink-0 flex-col items-center gap-1">
            <MemberAvatar member={m} size="lg" ring />
            <span className="text-xs font-semibold">{m.name}</span>
          </div>
        ))}
        <button
          onClick={() => toast('Enlace de invitación copiado', '🔗')}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground transition-transform active:scale-90">
            <Plus className="size-6" />
          </span>
          <span className="text-xs font-semibold text-muted-foreground">Invitar</span>
        </button>
      </div>
    </header>
  )
}
