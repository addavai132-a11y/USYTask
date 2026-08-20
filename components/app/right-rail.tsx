'use client'

import { events, members, reminders, getMember } from '@/lib/mock-data'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { Card, CardHeader } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { useApp } from './app-context'

export function RightRail() {
  const { openQuickAdd } = useApp()
  const upcoming = events.filter((e) => e.dayOffset <= 3).slice(0, 5)

  return (
    <div className="hidden w-72 shrink-0 flex-col gap-4 py-4 xl:flex">
      <Card variant="sky">
        <CardHeader title="Próximos eventos" />
        <ul className="flex flex-col gap-3">
          {upcoming.map((e) => {
            const m = getMember(e.member)
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className="w-11 shrink-0 text-xs font-bold text-muted-foreground">{e.time}</span>
                <span className="h-8 w-1 rounded-full" style={{ backgroundColor: `var(--${m.colorVar})` }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{m.name}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <Card variant="turquoise">
        <CardHeader title="Miembros" action="Invitar" onAction={openQuickAdd} />
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <MemberAvatar member={m} size="sm" />
              <span className="text-sm font-semibold">{m.name}</span>
              <span className="ml-auto text-xs font-bold text-cyan-800 dark:text-cyan-300">{m.points} ⭐</span>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="rose">
        <CardHeader title="No olvidéis" />
        <ul className="flex flex-col gap-2">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-rose-500" />
              <span className="flex-1 font-medium">{r.title}</span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{r.daysLeft}d</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
