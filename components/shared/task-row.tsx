'use client'

import { Check, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, Member } from '@/types'
import { MemberAvatar } from '@/components/ui/member-avatar'

export function TaskRow({
  task,
  member,
  creator,
  checked,
  onToggle,
  onDelete,
  disabled,
  onDisabledClick,
}: {
  task: Task
  member?: Member | null
  creator?: Member | null
  checked: boolean
  onToggle: () => void
  onDelete?: () => void
  disabled?: boolean
  onDisabledClick?: () => void
}) {
  const isLocked = checked || disabled

  return (
    <div className={cn("flex items-center gap-3 py-1", isLocked && "opacity-75")}>
      <button
        disabled={checked}
        onClick={() => {
          if (disabled) {
            onDisabledClick?.()
          } else if (!checked) {
            onToggle()
          }
        }}
        aria-pressed={checked}
        aria-disabled={isLocked}
        aria-label={checked ? `Tarea ${task.title} completada` : `Completar ${task.title}`}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          !isLocked && 'active:scale-90',
          checked
            ? 'border-emerald-500 bg-emerald-500 text-white cursor-default'
            : disabled
            ? 'cursor-not-allowed border-border bg-card'
            : 'border-border bg-card hover:border-emerald-500'
        )}
      >
        <Check className={cn('size-4 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </button>
      <div className="flex-1 min-w-0">
        <span className={cn('block text-sm font-medium transition-colors truncate', checked && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] font-semibold text-muted-foreground">
          {(task.dueDate || task.dueTime) && (
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-purple-400 shrink-0" />
              <span>{task.dueDate ? task.dueDate : 'Hoy'}</span>
              {task.dueTime && <span className="text-foreground/90 font-bold">· {task.dueTime}</span>}
            </div>
          )}
          {creator && (
            <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full" title={`Creado por ${creator.name}`}>
              <span className="text-slate-400">Creado por:</span>
              <MemberAvatar member={creator} size="xs" />
              <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[75px]">{creator.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
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
