'use client'

import { Calendar, CheckCircle2 } from 'lucide-react'
import { plans, getMember } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'

export function PlansSection() {
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-3">
      {plans.map((p) => (
        <Card key={p.id} className="p-0">
          <div className="flex items-start gap-3 p-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl" aria-hidden="true">
              {p.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight text-balance">{p.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="size-3.5" /> {p.date}
              </p>
              <div className="mt-2 flex -space-x-2">
                {p.participants.map((id) => (
                  <MemberAvatar key={id} member={getMember(id)} size="sm" ring />
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Checklist
              </span>
              <span className="tabular-nums">
                {p.checklistDone}/{p.checklistTotal}
              </span>
            </div>
            <ProgressBar value={p.checklistDone} max={p.checklistTotal} />
          </div>
        </Card>
      ))}

      <button
        onClick={() => toast('Nuevo plan creado', '🗓')}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors active:bg-secondary"
      >
        + Nuevo plan familiar
      </button>
    </div>
  )
}
