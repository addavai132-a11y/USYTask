'use client'

import { Check, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Member } from '@/types'
import { MemberAvatar } from '@/components/ui/member-avatar'

export function TaskRow({
  task,
  member,
  checked,
  onToggle,
  onDelete,
  disabled,
  onDisabledClick,
}: {
  task: Task
  member?: Member | null
  checked: boolean
  onToggle: () => void
  onDelete?: () => void
  disabled?: boolean
  onDisabledClick?: () => void
}) {
  return (
    <div className={cn("flex items-center gap-3 py-1", disabled && "opacity-70")}>
      <button
        onClick={() => {
          if (disabled) {
            onDisabledClick?.()
          } else {
            onToggle()
          }
        }}
        aria-pressed={checked}
        aria-disabled={disabled}
        aria-label={checked ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          !disabled && 'active:scale-90',
          disabled && 'cursor-not-allowed',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        )}
      >
        <Check className={cn('size-4 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0">
        <span className={cn('block text-sm font-medium transition-colors truncate', checked && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
        {(task.dueDate || task.dueTime) && (
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-muted-foreground">
            <Clock className="size-3 text-purple-400 shrink-0" />
            <span>{task.dueDate ? task.dueDate : 'Hoy'}</span>
            {task.dueTime && <span className="text-foreground/90 font-bold">· {task.dueTime}</span>}
          </div>
        )}
      </div>
      {task.points ? (
        <span className="text-xs font-bold text-accent shrink-0">+{task.points} ⭐</span>
      ) : null}
      {member && <MemberAvatar member={member} size="sm" />}
      {onDelete && (
        <button
          onClick={onDelete}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-rose-500/10 hover:text-rose-500 shrink-0"
          title="Eliminar tarea"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}
