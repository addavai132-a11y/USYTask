'use client'

import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, CalendarPlus, Bell, Clock, Trash2, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { useApp } from '@/components/app/app-context'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { PillTabs } from '@/components/ui/pill-tabs'
import { MemberMultiSelectFilter } from '@/components/shared/member-multi-select-filter'
import type { Task, CalendarEvent, Reminder, Member } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type HistoryItem = {
  id: string
  type: 'task' | 'event' | 'reminder'
  title: string
  details?: string
  dateISO: string
  timeStr: string
  timestamp: number
  memberIds: string[]
  points?: number
  originalData: Task | CalendarEvent | Reminder
}

type FilterCategory = 'todo' | 'tareas' | 'eventos' | 'recordatorios'
type TimeRangeMode = 'todos' | 'hoy' | 'semana' | 'especifico'

function formatGroupHeader(dateISO: string): string {
  const today = getTodayISO()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = yesterdayDate.toISOString().slice(0, 10)

  if (dateISO === today) return 'Hoy'
  if (dateISO === yesterday) return 'Ayer'

  const d = new Date(dateISO + 'T00:00:00')
  if (isNaN(d.getTime())) return dateISO

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  return `${dayNames[d.getDay()]} ${d.getDate()} de ${monthNames[d.getMonth()]}`
}

export function HistorySection({
  memberFilter: propMemberFilter,
  searchQuery,
}: {
  memberFilter?: string
  searchQuery?: string
} = {}) {
  const {
    archivedTasks,
    archivedEvents,
    archivedReminders,
    getMemberById,
    members,
    deleteTask,
    deleteEvent,
    deleteReminder,
  } = useApp()

  const [filterCategory, setFilterCategory] = useState<FilterCategory>('todo')
  const [timeRangeMode, setTimeRangeMode] = useState<TimeRangeMode>('todos')
  const [specificDate, setSpecificDate] = useState<string>(getTodayISO())
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    propMemberFilter && propMemberFilter !== 'all' ? [propMemberFilter] : []
  )

  // Sync member filter from props
  useEffect(() => {
    if (propMemberFilter) {
      setSelectedMemberIds(propMemberFilter === 'all' ? [] : [propMemberFilter])
    }
  }, [propMemberFilter])

  // Build unified items array
  const allItems: HistoryItem[] = []

  // 1. Tasks
  archivedTasks.forEach((t) => {
    const d = t.completedAt ? new Date(t.completedAt) : new Date()
    const dateISO = t.completedAt ? t.completedAt.slice(0, 10) : getTodayISO()
    const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'
    allItems.push({
      id: `task_${t.id}`,
      type: 'task',
      title: t.title,
      details: t.section ? `Categoría: ${t.section}` : undefined,
      dateISO,
      timeStr,
      timestamp: d.getTime() || Date.now(),
      memberIds: t.assignedToMemberId ? [t.assignedToMemberId] : [],
      points: t.points,
      originalData: t,
    })
  })

  // 2. Events
  archivedEvents.forEach((e) => {
    const d = new Date(`${e.date}T${e.time || '12:00'}`)
    allItems.push({
      id: `event_${e.id}`,
      type: 'event',
      title: e.title,
      details: e.location ? `📍 ${e.location}` : `Categoría: ${e.category}`,
      dateISO: e.date,
      timeStr: e.time,
      timestamp: !isNaN(d.getTime()) ? d.getTime() : Date.now(),
      memberIds: e.assignedMemberIds && e.assignedMemberIds.length > 0 ? e.assignedMemberIds : e.assignedToMemberId ? [e.assignedToMemberId] : [],
      originalData: e,
    })
  })

  // 3. Reminders
  archivedReminders.forEach((r) => {
    const d = new Date(`${r.dueDate}T12:00:00`)
    allItems.push({
      id: `reminder_${r.id}`,
      type: 'reminder',
      title: r.title,
      details: 'Recordatorio finalizado',
      dateISO: r.dueDate,
      timeStr: '23:59',
      timestamp: !isNaN(d.getTime()) ? d.getTime() : Date.now(),
      memberIds: r.assignedMemberIds || [],
      originalData: r,
    })
  })

  // Filter items
  let filtered = allItems.filter((item) => {
    // Category filter
    if (filterCategory === 'tareas' && item.type !== 'task') return false
    if (filterCategory === 'eventos' && item.type !== 'event') return false
    if (filterCategory === 'recordatorios' && item.type !== 'reminder') return false

    // Multi-member filter
    if (selectedMemberIds.length > 0 && selectedMemberIds.length < members.length) {
      const match = item.memberIds.some((mId) => selectedMemberIds.includes(mId))
      if (!match) return false
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!item.title.toLowerCase().includes(q) && !item.details?.toLowerCase().includes(q)) return false
    }

    // Time Range filter
    const today = getTodayISO()
    if (timeRangeMode === 'hoy') {
      return item.dateISO === today
    }
    if (timeRangeMode === 'semana') {
      const now = new Date()
      const itemDate = new Date(item.dateISO + 'T00:00:00')
      const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays >= -1 && diffDays <= 7
    }
    if (timeRangeMode === 'especifico') {
      return item.dateISO === specificDate
    }

    return true
  })

  // Sort descending by timestamp
  filtered.sort((a, b) => b.timestamp - a.timestamp)

  // Group by dateISO
  const groupedDates: { dateISO: string; items: HistoryItem[] }[] = []
  const groupMap = new Map<string, HistoryItem[]>()

  filtered.forEach((item) => {
    if (!groupMap.has(item.dateISO)) {
      groupMap.set(item.dateISO, [])
    }
    groupMap.get(item.dateISO)!.push(item)
  })

  groupMap.forEach((items, dateISO) => {
    groupedDates.push({ dateISO, items })
  })

  groupedDates.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())

  function handleDeleteItem(item: HistoryItem) {
    if (item.type === 'task') deleteTask((item.originalData as Task).id)
    if (item.type === 'event') deleteEvent((item.originalData as CalendarEvent).id)
    if (item.type === 'reminder') deleteReminder((item.originalData as Reminder).id)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Card Glassmorphism Compacto */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{filtered.length}</span>
          <span className="text-xs text-slate-400">actividades en el historial</span>
        </div>
      </div>

      {/* Top Controls: Time Ranges & Member Selector */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Time Range Tabs + Specific Date Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <PillTabs<TimeRangeMode>
            value={timeRangeMode}
            onChange={setTimeRangeMode}
            tabs={[
              { id: 'todos', label: 'Todos' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Esta semana' },
              { id: 'especifico', label: 'Día específico' },
            ]}
          />

          {timeRangeMode === 'especifico' && (
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 shadow-sm animate-fade-in">
              <CalendarIcon className="size-3.5 text-purple-400" />
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Row 2: Category Filter Tabs + Member Filter */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pt-1 border-t border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-xs font-bold text-muted-foreground shrink-0">Filtrar:</span>
            <PillTabs<FilterCategory>
              value={filterCategory}
              onChange={setFilterCategory}
              tabs={[
                { id: 'todo', label: 'Todo' },
                { id: 'tareas', label: 'Tareas' },
                { id: 'eventos', label: 'Eventos' },
                { id: 'recordatorios', label: 'Recordatorios' },
              ]}
            />
          </div>

          <MemberMultiSelectFilter
            selectedIds={selectedMemberIds}
            onChange={setSelectedMemberIds}
            members={members}
            className="w-full sm:w-56 shrink-0"
          />
        </div>
      </div>

      {/* Main Grouped List */}
      {groupedDates.length === 0 ? (
        <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
            📅
          </div>
          <p className="text-xs text-slate-400 max-w-xs">No hay actividad registrada para esta fecha.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedDates.map(({ dateISO, items }) => (
            <div key={dateISO} className="flex flex-col gap-3">
              {/* Group Header */}
              <div className="flex items-center gap-2 px-1">
                <div className="flex size-7 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                  <Clock className="size-3.5" />
                </div>
                <h3 className="text-sm font-black tracking-tight text-foreground">
                  {formatGroupHeader(dateISO)}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">({dateISO})</span>
                <div className="flex-1 h-px bg-border/60 ml-2" />
              </div>

              {/* Items Card List */}
              <div className="flex flex-col gap-2.5">
                {items.map((item) => {
                  const assignedMembers = item.memberIds
                    .map((id) => getMemberById(id))
                    .filter(Boolean) as Member[]

                  return (
                    <Card
                      key={item.id}
                      className="p-4 border border-border/80 bg-card hover:bg-secondary/20 transition-all flex items-center justify-between gap-3 shadow-soft group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Icon by type */}
                        {item.type === 'task' && (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold">
                            <CheckCircle2 className="size-5" />
                          </div>
                        )}
                        {item.type === 'event' && (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-purple-500/10 dark:text-purple-400 font-bold">
                            <CalendarPlus className="size-5" />
                          </div>
                        )}
                        {item.type === 'reminder' && (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 font-bold">
                            <Bell className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-foreground truncate">
                              {item.title}
                            </h4>
                            {item.points ? (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                                +{item.points} pts
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {item.details && <span>{item.details}</span>}
                            <span>·</span>
                            <span className="font-semibold">{item.timeStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Member Avatars & Delete */}
                      <div className="flex items-center gap-3 shrink-0">
                        {assignedMembers.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex -space-x-1.5">
                              {assignedMembers.map((m) => (
                                <MemberAvatar key={m.id} member={m} size="xs" ring />
                              ))}
                            </div>
                            <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">
                              {assignedMembers.map((m) => m.name).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground italic">Toda la casa</span>
                        )}

                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-muted-foreground/60 hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors"
                          title="Eliminar del historial"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
