'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  ListChecks,
  Bell,
  UtensilsCrossed,
  Plus,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Layers,
  Check,
  X,
  Trash2,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'
import { getTodayISO } from '@/lib/date-utils'
import { getEventMemberIds, getTaskMemberIds, getReminderMemberIds, type Member } from '@/types'

const dayFullNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

type CalendarItem = {
  id: string
  rawId: string
  title: string
  date: string
  time: string
  kind: 'event' | 'task' | 'reminder' | 'meal'
  memberIds: string[]
  completed?: boolean
  location?: string
  priority?: string
  original: any
}

const kindConfig: Record<
  CalendarItem['kind'],
  { dot: string; bg: string; border: string; text: string; label: string; icon: any }
> = {
  task: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Tareas con fecha',
    icon: ListChecks,
  },
  event: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Eventos',
    icon: CalendarDays,
  },
  reminder: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
    border: 'border-orange-500/30',
    text: 'text-orange-600 dark:text-orange-400',
    label: 'Recordatorios',
    icon: Bell,
  },
  meal: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Menús y Comidas',
    icon: UtensilsCrossed,
  },
}

export function CalendarSection({
  memberFilter = 'all',
  searchQuery = '',
}: {
  memberFilter?: string
  searchQuery?: string
} = {}) {
  const {
    events,
    tasks,
    reminders,
    dailyMenus,
    currentMember,
    getMemberById,
    openQuickAdd,
    toggleTask,
    deleteTask,
    deleteEvent,
    deleteReminder,
  } = useApp()
  const { toast } = useToast()

  const todayISO = getTodayISO()
  const todayDate = useMemo(() => new Date(), [])

  // Explicit Year & Month state: consecutive range from 2024 to 2060
  const [viewYear, setViewYear] = useState<number>(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(todayDate.getMonth())

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)

  const monthRef = useRef<HTMLDivElement>(null)
  const yearRef = useRef<HTMLDivElement>(null)
  const yearListRef = useRef<HTMLDivElement>(null)

  const [selectedDateISO, setSelectedDateISO] = useState<string>(todayISO)
  const [selectedDayModalISO, setSelectedDayModalISO] = useState<string | null>(null)

  // Layer filters (toggle on/off)
  const [layers, setLayers] = useState<{
    event: boolean
    task: boolean
    reminder: boolean
    meal: boolean
  }>({
    event: true,
    task: true,
    reminder: true,
    meal: true,
  })

  // Close pickers on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false)
      }
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setIsYearPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll to active year when year picker opens
  useEffect(() => {
    if (isYearPickerOpen && yearListRef.current) {
      const activeEl = yearListRef.current.querySelector('[data-active-year="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  }, [isYearPickerOpen])

  // Keyboard shortcut ('c' to add item for currently selected date)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'c' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        openQuickAdd('evento', { hideTabs: true, defaultDate: selectedDateISO })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openQuickAdd, selectedDateISO])

  // Merge all types into CalendarItems
  const allItems: CalendarItem[] = useMemo(() => {
    const items: CalendarItem[] = []

    // 1. Tasks with date
    ;(tasks ?? []).forEach((t) => {
      if (!t) return
      const date = todayISO
      items.push({
        id: `tk-${t.id}`,
        rawId: t.id,
        title: t.title || 'Tarea',
        date,
        time: '09:00',
        kind: 'task',
        memberIds: getTaskMemberIds(t),
        completed: t.completed,
        priority: t.priority,
        original: t,
      })
    })

    // 2. Events
    ;(events ?? []).forEach((e) => {
      if (!e) return
      items.push({
        id: `ev-${e.id}`,
        rawId: e.id,
        title: e.title || 'Evento',
        date: e.date,
        time: e.time || '00:00',
        kind: 'event',
        memberIds: getEventMemberIds(e),
        location: e.location,
        original: e,
      })
    })

    // 3. Reminders
    ;(reminders ?? []).forEach((r) => {
      if (!r) return
      items.push({
        id: `rm-${r.id}`,
        rawId: r.id,
        title: r.title || 'Recordatorio',
        date: r.dueDate,
        time: r.time || '08:00',
        kind: 'reminder',
        memberIds: getReminderMemberIds(r),
        original: r,
      })
    })

    // 4. Daily Menus
    ;(dailyMenus ?? []).forEach((m) => {
      if (m?.date) {
        items.push({
          id: `ml-${m.id}`,
          rawId: m.id,
          title: m.title || 'Menú planificado',
          date: m.date,
          time: '13:00',
          kind: 'meal',
          memberIds: [],
          original: m,
        })
      }
    })

    return items
  }, [events, tasks, reminders, dailyMenus, todayISO])

  // Filtered by Member, Search query, and Active Layers
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (!layers[item.kind]) return false
      if (memberFilter !== 'all' && item.memberIds.length > 0 && !item.memberIds.includes(memberFilter)) {
        return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!item.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [allItems, layers, memberFilter, searchQuery])

  // Map of items grouped by date for fast lookup
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    filteredItems.forEach((item) => {
      const existing = map.get(item.date) || []
      existing.push(item)
      map.set(item.date, existing)
    })
    return map
  }, [filteredItems])

  // All consecutive years from 2024 to 2060
  const yearsList = useMemo(() => {
    const list: number[] = []
    for (let y = 2024; y <= 2060; y++) {
      list.push(y)
    }
    return list
  }, [])

  const handlePrevDay = () => {
    const [y, m, d] = (selectedDateISO || todayISO).split('-').map(Number)
    const prev = new Date(y, m - 1, d - 1)
    if (prev.getFullYear() < 2024) return
    const prevYear = prev.getFullYear()
    const prevMonth = prev.getMonth()
    const prevISO = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
    setViewYear(prevYear)
    setViewMonth(prevMonth)
    setSelectedDateISO(prevISO)
  }

  const handleNextDay = () => {
    const [y, m, d] = (selectedDateISO || todayISO).split('-').map(Number)
    const next = new Date(y, m - 1, d + 1)
    if (next.getFullYear() > 2060) return
    const nextYear = next.getFullYear()
    const nextMonth = next.getMonth()
    const nextISO = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    setViewYear(nextYear)
    setViewMonth(nextMonth)
    setSelectedDateISO(nextISO)
  }

  const handleGoToday = () => {
    const now = new Date()
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    setSelectedDateISO(todayISO)
    setIsMonthPickerOpen(false)
    setIsYearPickerOpen(false)
  }

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = (firstDay.getDay() + 6) % 7 // Lun = 0

  const calendarCells = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const dayNum = i - startDayOfWeek + 1
      if (dayNum < 1 || dayNum > daysInMonth) return null
      return dayNum
    })
  }, [startDayOfWeek, daysInMonth])

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Selected Day Items for Modal
  const selectedDayItems = useMemo(() => {
    if (!selectedDayModalISO) return []
    return filteredItems.filter((i) => i.date === selectedDayModalISO)
  }, [selectedDayModalISO, filteredItems])

  const isCurrentViewingMonthToday = viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth()

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      {/* ── CALENDARIO PRINCIPAL (Compacto max-w-xl) ── */}
      <Card className="p-3.5 sm:p-4 bg-white dark:bg-[#0e0d1d]/60 border border-slate-200 dark:border-purple-500/15 rounded-2xl backdrop-blur-xl shadow-sm">
        {/* Header: Pestañas interactivas de Mes / Año, Navegación y Botón Hoy */}
        <div className="flex items-center justify-between mb-3 px-0.5 relative">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-purple-500/15 dark:text-purple-400 shrink-0 border border-emerald-200 dark:border-purple-500/20">
              <CalendarIcon className="size-3.5" />
            </div>

            {/* ── PESTAÑA / BOTÓN DIRECTO DE MES ── */}
            <div className="relative" ref={monthRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMonthPickerOpen((v) => !v)
                  setIsYearPickerOpen(false)
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm',
                  isMonthPickerOpen
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-purple-500/20 dark:text-purple-300'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                )}
              >
                <span>{monthNames[viewMonth]}</span>
                <ChevronDown className={cn('size-3 text-slate-400 transition-transform duration-200', isMonthPickerOpen && 'rotate-180 text-emerald-600 dark:text-purple-400')} />
              </button>

              {/* Menú de Selección de Mes (12 meses) */}
              {isMonthPickerOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-56 rounded-2xl border border-slate-200 dark:border-purple-500/25 bg-white dark:bg-[#100e23] p-2 shadow-2xl backdrop-blur-xl grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95 duration-150">
                  {monthNames.map((mName, idx) => {
                    const isSelected = viewMonth === idx
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx)
                          setIsMonthPickerOpen(false)
                        }}
                        className={cn(
                          'rounded-xl px-2.5 py-1.5 text-xs text-left transition-all',
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-white'
                            : 'text-slate-900 hover:text-black hover:bg-slate-100 font-medium dark:text-slate-200 dark:hover:bg-white/10'
                        )}
                      >
                        {mName}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── PESTAÑA / BOTÓN DIRECTO DE AÑO (2024 - 2060) ── */}
            <div className="relative" ref={yearRef}>
              <button
                type="button"
                onClick={() => {
                  setIsYearPickerOpen((v) => !v)
                  setIsMonthPickerOpen(false)
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-sm',
                  isYearPickerOpen
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-purple-500/20 dark:text-purple-300'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                )}
              >
                <span className="tabular-nums">{viewYear}</span>
                <ChevronDown className={cn('size-3 text-slate-400 transition-transform duration-200', isYearPickerOpen && 'rotate-180 text-emerald-600 dark:text-purple-400')} />
              </button>

              {/* Menú de Selección de Año Consecutivo (2024 - 2060) */}
              {isYearPickerOpen && (
                <div
                  ref={yearListRef}
                  className="absolute left-0 top-full mt-1.5 z-50 w-44 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-purple-500/25 bg-white dark:bg-[#100e23] p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150 dropdown-scroll"
                >
                  {yearsList.map((y) => {
                    const isSelected = viewYear === y
                    return (
                      <button
                        key={y}
                        data-active-year={isSelected ? 'true' : undefined}
                        type="button"
                        onClick={() => {
                          setViewYear(y)
                          setIsYearPickerOpen(false)
                        }}
                        className={cn(
                          'w-full rounded-xl px-3 py-1.5 text-xs text-left transition-all flex items-center justify-between',
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-200 text-slate-900 font-bold dark:bg-purple-950/60 dark:border-purple-500/40 dark:text-white'
                            : 'text-slate-900 hover:text-black hover:bg-slate-100 font-medium dark:text-slate-200 dark:hover:bg-white/10'
                        )}
                      >
                        <span className="tabular-nums">{y}</span>
                        {isSelected && <Check className="size-3 text-emerald-600 dark:text-purple-400 stroke-[2.5]" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Flechas de Navegación y Botón Hoy */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevDay}
              disabled={selectedDateISO <= '2024-01-01'}
              className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Día anterior"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={handleGoToday}
              className={cn(
                'rounded-lg px-2 py-0.5 text-[11px] font-bold transition-all border',
                isCurrentViewingMonthToday && selectedDateISO === todayISO
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10'
              )}
            >
              Hoy
            </button>
            <button
              onClick={handleNextDay}
              disabled={selectedDateISO >= '2060-12-31'}
              className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Día siguiente"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayFullNames.map((d, idx) => (
            <div
              key={idx}
              className="py-0.5 text-[11px] text-slate-400 font-medium tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Cuadrícula de Días Mensual Compacta (h-10 md:h-11) */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={idx} className="h-10 md:h-11 rounded-lg opacity-0" />
            }

            const dateISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const isToday = dateISO === todayISO
            const isPast = dateISO < todayISO
            const isSelected = dateISO === selectedDateISO
            const dayItems = itemsByDate.get(dateISO) || []
            const hasActivities = dayItems.length > 0

            // Check activity types for colored dots
            const hasEvent = dayItems.some((it) => it.kind === 'event')
            const hasTask = dayItems.some((it) => it.kind === 'task')
            const hasReminder = dayItems.some((it) => it.kind === 'reminder')
            const hasMeal = dayItems.some((it) => it.kind === 'meal')

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDateISO(dateISO)
                  setSelectedDayModalISO(dateISO)
                }}
                className={cn(
                  'group relative h-10 md:h-11 w-full rounded-lg p-0.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 border text-center cursor-pointer',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20 shadow-sm ring-1 ring-emerald-500/40 active:scale-95'
                    : isToday
                    ? 'border-emerald-500/40 bg-emerald-500/10 active:scale-95'
                    : isPast
                    ? 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100 dark:hover:bg-white/[0.04] active:scale-95 opacity-80'
                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-emerald-500/30 active:scale-95'
                )}
              >
                {/* Número del día */}
                <span
                  className={cn(
                    'text-xs font-medium transition-all leading-none tabular-nums',
                    isToday
                      ? 'w-5 h-5 text-[11px] flex items-center justify-center rounded-full bg-emerald-400 font-black text-slate-950 shadow-sm'
                      : isSelected
                      ? 'font-black text-emerald-950 dark:text-emerald-300'
                      : isPast
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-purple-400'
                  )}
                >
                  {dayNum}
                </span>

                {/* Puntos de colores por tipo de actividad */}
                <div className="flex items-center justify-center gap-0.5 h-1">
                  {hasEvent && (
                    <span title="Evento" className="size-1 rounded-full bg-emerald-500" />
                  )}
                  {hasTask && (
                    <span title="Tarea" className="size-1 rounded-full bg-blue-500" />
                  )}
                  {hasReminder && (
                    <span title="Recordatorio" className="size-1 rounded-full bg-orange-500" />
                  )}
                  {hasMeal && (
                    <span title="Comida / Menú" className="size-1 rounded-full bg-teal-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── BARRA INFERIOR DE FILTROS POR CAPAS ── */}
      <Card className="p-2.5 sm:p-3 bg-white dark:bg-[#0e0d1d]/60 border border-slate-200 dark:border-purple-500/15 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-emerald-600 dark:text-purple-400" />
          <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
            Capas:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(kindConfig) as (keyof typeof layers)[]).map((kind) => {
            const cfg = kindConfig[kind]
            const isChecked = layers[kind]
            const count = allItems.filter((i) => i.kind === kind).length

            return (
              <button
                key={kind}
                type="button"
                onClick={() => toggleLayer(kind)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all border',
                  isChecked
                    ? 'border-purple-200 dark:border-white/20 bg-purple-50 dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm'
                    : 'border-slate-200 dark:border-white/5 bg-transparent text-slate-400 opacity-50 hover:opacity-75'
                )}
              >
                <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                <span>{cfg.label}</span>
                <span className="rounded bg-slate-200/60 dark:bg-white/[0.08] px-1 py-0.2 text-[9px] font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── MODAL DE DETALLE DEL DÍA SELECCIONADO ── */}
      {selectedDayModalISO && (
        <DayDetailModal
          dateISO={selectedDayModalISO}
          items={selectedDayItems}
          onClose={() => setSelectedDayModalISO(null)}
          getMember={getMemberById}
          currentMember={currentMember}
          onQuickAdd={(type) => {
            const dateToPass = selectedDayModalISO
            setSelectedDayModalISO(null)
            openQuickAdd(type as any, { hideTabs: true, defaultDate: dateToPass })
          }}
          onToggleTask={(taskId, title) => {
            const targetTask = tasks.find((t) => t.id === taskId)
            if (targetTask && currentMember) {
              const assignedIds = targetTask.assignedMemberIds && targetTask.assignedMemberIds.length > 0
                ? targetTask.assignedMemberIds
                : targetTask.assignedToMemberId
                ? [targetTask.assignedToMemberId]
                : []
              if (!assignedIds.includes(currentMember.id)) {
                toast('Solo la persona asignada a esta tarea puede marcarla como completada', '🔒')
                return
              }
            }
            const res = toggleTask(taskId)
            if (res.pointsAwarded > 0) {
              toast(`¡Tarea completada! +${res.pointsAwarded} pts`)
            }
          }}
          onDeleteTask={(id) => {
            deleteTask(id)
            toast('Tarea eliminada')
          }}
          onDeleteEvent={(id) => {
            deleteEvent(id)
            toast('Evento eliminado')
          }}
          onDeleteReminder={(id) => {
            deleteReminder(id)
            toast('Recordatorio eliminado')
          }}
        />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// ── MODAL DE DETALLE Y ACCIÓN DIRECTA DEL DÍA
// ──────────────────────────────────────────────────────────

function DayDetailModal({
  dateISO,
  items,
  onClose,
  getMember,
  currentMember,
  onQuickAdd,
  onToggleTask,
  onDeleteTask,
  onDeleteEvent,
  onDeleteReminder,
}: {
  dateISO: string
  items: CalendarItem[]
  onClose: () => void
  getMember: (id: string) => any
  currentMember?: Member | null
  onQuickAdd: (type: 'evento' | 'tarea' | 'recordatorio') => void
  onToggleTask: (taskId: string, title: string) => void
  onDeleteTask: (id: string) => void
  onDeleteEvent: (id: string) => void
  onDeleteReminder: (id: string) => void
}) {
  const today = getTodayISO()
  const isToday = dateISO === today
  const isPast = dateISO < today

  // Format date header (e.g. "Lunes, 24 de Agosto de 2026")
  const dateObj = new Date(dateISO + 'T00:00:00')
  const dateFormatted = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const dateCapitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0e0d1d] border border-slate-200 dark:border-purple-500/20 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-purple-500/20 dark:text-purple-400 border border-emerald-200 dark:border-purple-500/30">
              <CalendarIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {dateCapitalized}
                </h3>
                {isToday && (
                  <span className="rounded-full bg-emerald-100 dark:bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-purple-300 border border-emerald-300 dark:border-purple-500/30">
                    Hoy
                  </span>
                )}
                {isPast && (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-500/20 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30">
                    Pasado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {items.length === 0
                  ? 'Sin actividades registradas'
                  : `${items.length} ${items.length === 1 ? 'actividad' : 'actividades'} registradas`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Lista de actividades o estado vacío */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[140px] max-h-[360px]">
          {items.length === 0 ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center gap-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
              <CalendarDays className="size-8 text-purple-400/60" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Día sin actividades</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  No hay eventos, tareas ni recordatorios para esta fecha.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const cfg = kindConfig[item.kind]
                const Icon = cfg.icon
                const assigned = item.memberIds.map((id) => getMember(id)).filter(Boolean)

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Icono del tipo */}
                      <div
                        className={cn(
                          'flex size-8 items-center justify-center rounded-lg shrink-0 border',
                          cfg.bg,
                          cfg.border
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>

                      {/* Detalles */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-xs font-bold text-slate-900 dark:text-white truncate',
                            item.completed && 'line-through opacity-60'
                          )}
                        >
                          {item.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {item.time}
                          </span>
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.2 font-bold uppercase tracking-wider',
                              cfg.bg
                            )}
                          >
                            {cfg.label}
                          </span>
                          {item.location && (
                            <span className="text-slate-400 flex items-center gap-0.5 truncate">
                              <MapPin className="size-2.5" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones y Avatares */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {assigned.length > 0 && (
                        <div className="flex -space-x-1">
                          {assigned.slice(0, 2).map((m: any) => (
                            <MemberAvatar key={m.id} member={m} size="xs" ring />
                          ))}
                        </div>
                      )}

                      {/* Toggle completado si es tarea */}
                      {item.kind === 'task' && (() => {
                        const isAssigned = !currentMember || item.memberIds.length === 0 || item.memberIds.includes(currentMember.id)
                        return (
                          <button
                            disabled={item.completed || !isAssigned}
                            onClick={() => {
                              if (!isAssigned) {
                                return
                              }
                              onToggleTask(item.rawId, item.title)
                            }}
                            className={cn(
                              'flex size-6 items-center justify-center rounded-lg transition-all',
                              item.completed
                                ? 'bg-blue-500 text-white cursor-default'
                                : !isAssigned
                                ? 'bg-slate-200/50 dark:bg-white/[0.02] text-slate-400 opacity-40 cursor-not-allowed'
                                : 'bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer'
                            )}
                            title={
                              item.completed
                                ? 'Tarea completada'
                                : !isAssigned
                                ? 'Solo la persona asignada puede completarla'
                                : 'Completar tarea'
                            }
                          >
                            <Check className="size-3 stroke-[3]" />
                          </button>
                        )
                      })()}

                      {/* Botón eliminar */}
                      <button
                        onClick={() => {
                          if (item.kind === 'event') onDeleteEvent(item.rawId)
                          else if (item.kind === 'task') onDeleteTask(item.rawId)
                          else if (item.kind === 'reminder') onDeleteReminder(item.rawId)
                        }}
                        className="flex size-6 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-white/[0.04] text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Botones de acción rápida al pie */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Añadir a esta fecha:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQuickAdd('evento')}
              className="flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-purple-500/20 hover:bg-emerald-100 dark:hover:bg-purple-500/30 text-emerald-800 dark:text-purple-300 border border-emerald-200 dark:border-purple-500/30 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Plus className="size-3" />
              <span>Evento</span>
            </button>
            <button
              onClick={() => onQuickAdd('tarea')}
              className="flex items-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Plus className="size-3" />
              <span>Tarea</span>
            </button>
            <button
              onClick={() => onQuickAdd('recordatorio')}
              className="flex items-center gap-1 rounded-xl bg-orange-50 dark:bg-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <Plus className="size-3" />
              <span>Recordatorio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
