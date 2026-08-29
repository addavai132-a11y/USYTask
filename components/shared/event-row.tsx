import { MapPin, Trash2 } from 'lucide-react'
import type { CalendarEvent, Member } from '@/types'
import { categoryLabels } from '@/types'
import { MemberAvatar } from '@/components/ui/member-avatar'

export function EventRow({
  event,
  member,
  members,
  onDelete,
}: {
  event: CalendarEvent
  member?: Member | null
  members?: Member[]
  onDelete?: () => void
}) {
  const memberList = members && members.length > 0 ? members : member ? [member] : []

  return (
    <div className="flex items-center gap-3 py-1.5 px-1">
      <div className="w-14 shrink-0 text-right">
        <p className="text-xs sm:text-sm font-bold tabular-nums text-foreground">{event.time || 'Todo el día'}</p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{event.title}</p>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            {categoryLabels[event.category] || event.category}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          {memberList.length > 0 ? (
            <span className="font-medium text-foreground">
              {memberList.map((m) => m.name).join(', ')}
            </span>
          ) : (
            <span>Sin asignar</span>
          )}
          {event.location && (
            <>
              <span aria-hidden="true">·</span>
              <MapPin className="size-3" />
              <span>{event.location}</span>
            </>
          )}
        </div>
      </div>

      {memberList.length > 0 && (
        <div className="flex -space-x-1.5 shrink-0">
          {memberList.map((m) => (
            <MemberAvatar key={m.id} member={m} size="xs" ring />
          ))}
        </div>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-rose-500/10 hover:text-rose-500 shrink-0"
          title="Eliminar evento"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}
