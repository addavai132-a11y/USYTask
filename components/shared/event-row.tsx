import { MapPin } from 'lucide-react'
import { getMember, categoryLabels, type CalendarEvent } from '@/lib/mock-data'

export function EventRow({ event }: { event: CalendarEvent }) {
  const member = getMember(event.member)
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-12 shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums">{event.time}</p>
      </div>
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: `var(--${member.colorVar})` }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{event.title}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {member.name}
          {event.location && (
            <>
              <span aria-hidden="true">·</span>
              <MapPin className="size-3" />
              {event.location}
            </>
          )}
          <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            {categoryLabels[event.category]}
          </span>
        </p>
      </div>
    </div>
  )
}
