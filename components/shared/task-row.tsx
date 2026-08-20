'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMember, type Task } from '@/lib/mock-data'
import { MemberAvatar } from '@/components/ui/member-avatar'

export function TaskRow({
  task,
  checked,
  onToggle,
}: {
  task: Task
  checked: boolean
  onToggle: () => void
}) {
  const member = getMember(task.assignee)
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={checked ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-90',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        )}
      >
        <Check className={cn('size-4 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </button>
      <span className={cn('flex-1 text-sm font-medium transition-colors', checked && 'text-muted-foreground line-through')}>
        {task.title}
      </span>
      {task.points ? (
        <span className="text-xs font-bold text-accent">+{task.points} ⭐</span>
      ) : null}
      <MemberAvatar member={member} size="sm" />
    </div>
  )
}
