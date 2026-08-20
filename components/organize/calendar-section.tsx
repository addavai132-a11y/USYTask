'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { events, members, getMember, type MemberId } from '@/lib/mock-data'
import { EventRow } from '@/components/shared/event-row'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PillTabs } from '@/components/ui/pill-tabs'

type View = 'dia' | 'semana' | 'mes' | 'agenda'

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function dayLabel(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  if (offset === 0) return 'Hoy'
  if (offset === 1) return 'Mañana'
  const s = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function CalendarSection() {
  const [view, setView] = useState<View>('agenda')
  const [filter, setFilter] = useState<MemberId | 'all'>('all')

  const filtered = events.filter((e) => filter === 'all' || e.member === filter)

  return (
    <div className="flex flex-col gap-4">
      <PillTabs<View>
        tabs={[
          { id: 'dia', label: 'Día' },
          { id: 'semana', label: 'Semana' },
          { id: 'mes', label: 'Mes' },
          { id: 'agenda', label: 'Agenda' },
        ]}
        value={view}
        onChange={setView}
      />

      {/* member filter */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
        {members.map((m) => (
          <FilterChip
            key={m.id}
            active={filter === m.id}
            onClick={() => setFilter(m.id)}
            label={m.name}
            color={`var(--${m.colorVar})`}
          />
        ))}
      </div>

      {view === 'agenda' && <AgendaView events={filtered} />}
      {view === 'dia' && <DayView events={filtered} />}
      {view === 'semana' && <WeekView events={filtered} />}
      {view === 'mes' && <MonthView events={filtered} />}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all active:scale-95',
        active ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {color && <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
    </button>
  )
}

function AgendaView({ events: evs }: { events: typeof events }) {
  const days = Array.from(new Set(evs.map((e) => e.dayOffset))).sort((a, b) => a - b)
  if (evs.length === 0) return <EmptyState emoji="📅" title="No hay eventos con este filtro." />
  return (
    <div className="flex flex-col gap-4">
      {days.map((offset) => (
        <div key={offset}>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(offset)}</p>
          <Card>
            <div className="flex flex-col divide-y divide-border/60">
              {evs
                .filter((e) => e.dayOffset === offset)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

function DayView({ events: evs }: { events: typeof events }) {
  const today = evs.filter((e) => e.dayOffset === 0).sort((a, b) => a.time.localeCompare(b.time))
  const hours = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 - 21:00
  return (
    <Card className="p-2">
      <div className="flex flex-col">
        {hours.map((h) => {
          const hh = `${String(h).padStart(2, '0')}:`
          const at = today.filter((e) => e.time.startsWith(hh.slice(0, 2)))
          return (
            <div key={h} className="flex min-h-12 gap-3 border-t border-border/50 py-1 first:border-t-0">
              <span className="w-12 shrink-0 pt-1 text-right text-xs font-semibold text-muted-foreground">{`${h}:00`}</span>
              <div className="flex flex-1 flex-col gap-1">
                {at.map((e) => {
                  const m = getMember(e.member)
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl px-3 py-1.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: `var(--${m.colorVar})` }}
                    >
                      {e.time} · {e.title}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function WeekView({ events: evs }: { events: typeof events }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {Array.from({ length: 7 }, (_, i) => i).map((offset) => {
        const dayEvents = evs.filter((e) => e.dayOffset === offset).sort((a, b) => a.time.localeCompare(b.time))
        return (
          <Card key={offset} className="p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(offset)}</p>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">Sin eventos</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {dayEvents.map((e) => {
                  const m = getMember(e.member)
                  return (
                    <span
                      key={e.id}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: `var(--${m.colorVar})` }}
                    >
                      {e.time} {e.title}
                    </span>
                  )
                })}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function MonthView({ events: evs }: { events: typeof events }) {
  const today = new Date()
  const start = today.getDate()
  // Build a simple 5x7 grid starting this week's Monday index
  const cells = Array.from({ length: 35 }, (_, i) => i - today.getDay() + 1)
  return (
    <Card className="p-3">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
        {dayNames.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dayNum, i) => {
          const offset = dayNum - start
          const has = evs.some((e) => e.dayOffset === offset && offset >= 0)
          const isToday = offset === 0
          const valid = dayNum >= 1 && dayNum <= 31
          return (
            <div
              key={i}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl text-sm',
                isToday ? 'bg-primary font-bold text-primary-foreground' : valid ? 'bg-secondary/60' : 'opacity-30',
              )}
            >
              {valid ? dayNum : ''}
              {has && !isToday && <span className="mt-0.5 size-1.5 rounded-full bg-accent" />}
              {has && isToday && <span className="mt-0.5 size-1.5 rounded-full bg-primary-foreground" />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
