'use client'

import { useMemo, useState } from 'react'
import {
  Plus,
  RotateCw,
  Clock,
  X,
  Check,
  LayoutGrid,
  List,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  CalendarDays,
  Bell,
  Calendar,
  MapPin,
  Trash2,
  CheckCircle2,
  CalendarPlus,
} from 'lucide-react'
import { TaskRow } from '@/components/shared/task-row'
import { Card } from '@/components/ui/card'
import { PillTabs, type PillTabItem } from '@/components/ui/pill-tabs'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { cn } from '@/lib/utils'
import {
  getTaskMemberIds,
  getEventMemberIds,
  getReminderMemberIds,
  type TaskPriority,
  type Member,
  type CalendarEvent,
  type Reminder,
} from '@/types'

type ActivityKind = 'todas' | 'tareas' | 'eventos' | 'recordatorios'
type ViewMode = 'list' | 'kanban'

const priorityConfig: Record<
  TaskPriority,
  { icon: typeof ArrowUpCircle; label: string; color: string; bg: string }
> = {
  high: {
    icon: ArrowUpCircle,
    label: 'Alta',
    color: 'text-rose-500',
    bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  medium: {
    icon: ArrowRightCircle,
    label: 'Media',
    color: 'text-amber-500',
    bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  low: {
    icon: ArrowDownCircle,
    label: 'Baja',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
}

export function TasksSection({
  memberFilter = 'all',
  searchQuery = '',
}: {
  memberFilter?: string
  searchQuery?: string
} = {}) {
  const { toast } = useToast()
  const {
    tasks,
    events,
    reminders,
    archivedTasks,
    members,
    currentMember,
    taskCategories,
    addTaskCategory,
    deleteTaskCategory,
    toggleTask,
    deleteTask,
    deleteEvent,
    deleteReminder,
    getMemberById,
    openQuickAdd,
    confirmDelete,
  } = useApp()

  // Unified activity filter: 'todas' | 'tareas' | 'eventos' | 'recordatorios'
  const [activityKind, setActivityKind] = useState<ActivityKind>('todas')
  const [tab, setTab] = useState<string>('familia')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)

  // Create Category Modal state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)

  const allTabs: PillTabItem<string>[] = useMemo(() => {
    return taskCategories.map((c) => ({
      id: c.id,
      label: c.name,
      deletable: !c.isEssential && c.id !== 'mias' && c.id !== 'familia',
    }))
  }, [taskCategories])

  function handleToggle(taskId: string, title: string) {
    const result = toggleTask(taskId)
    if (result.pointsAwarded > 0) {
      toast(`¡+${result.pointsAwarded} puntos!`, '⭐')
    } else if (result.pointsAwarded < 0) {
      toast(`${result.pointsAwarded} puntos`, '📉')
    }
  }

  function handleOpenCreateModal() {
    setSelectedMemberIds(members.map((m) => m.id))
    setNewCatName('')
    setIsCreatingCategory(true)
  }

  function handleCreateCategory() {
    const name = newCatName.trim()
    if (!name) return
    addTaskCategory(name, selectedMemberIds)
    setNewCatName('')
    setIsCreatingCategory(false)
    toast(`Categoría "${name}" creada`, '📁')
  }

  function handlePromptDelete(catId: string) {
    const cat = taskCategories.find((c) => c.id === catId)
    if (!cat) return
    if (cat.isEssential || cat.id === 'mias' || cat.id === 'familia') {
      toast('Esta categoría está protegida y no se puede eliminar', '🔒')
      return
    }
    confirmDelete({
      title: '¿Eliminar categoría?',
      itemName: cat.name,
      description: 'Las tareas asignadas se desvincularán de esta categoría.',
      confirmText: 'Eliminar Categoría',
      onConfirm: () => {
        deleteTaskCategory(cat.id)
        if (tab === cat.id) {
          setTab('familia')
        }
        toast(`Categoría "${cat.name}" eliminada`, '🗑️')
      },
    })
  }

  // Filtered Tasks
  const baseTasksList = useMemo(() => {
    if (tab === 'recurrentes') return tasks.filter((t) => t.recurring)
    if (tab === 'mias') {
      return tasks.filter(
        (t) => t.section === 'mias' || (currentMember && t.assignedToMemberId === currentMember.id)
      )
    }
    return tasks.filter((t) => t.section === tab)
  }, [tab, tasks, currentMember])

  const filteredTasks = useMemo(() => {
    return baseTasksList.filter((t) => {
      if (memberFilter !== 'all') {
        const memberIds = getTaskMemberIds(t)
        if (!memberIds.includes(memberFilter)) return false
      }
      if (searchQuery) {
        if (!t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      }
      return true
    })
  }, [baseTasksList, memberFilter, searchQuery])

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (memberFilter !== 'all') {
          const memberIds = getEventMemberIds(e)
          if (!memberIds.includes(memberFilter)) return false
        }
        if (searchQuery) {
          if (!e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
  }, [events, memberFilter, searchQuery])

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return reminders
      .filter((r) => {
        if (memberFilter !== 'all') {
          const memberIds = getReminderMemberIds(r)
          if (memberIds.length > 0 && !memberIds.includes(memberFilter)) return false
        }
        if (searchQuery) {
          if (!r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [reminders, memberFilter, searchQuery])

  const doneCount = useMemo(() => {
    const allGroupTasks = [...tasks, ...archivedTasks]
    if (tab === 'mias') {
      return allGroupTasks.filter(
        (t) => t.completed && currentMember && t.assignedToMemberId === currentMember.id
      ).length
    }
    if (tab === 'familia') {
      return allGroupTasks.filter((t) => t.completed).length
    }
    return allGroupTasks.filter((t) => t.completed && t.section === tab).length
  }, [tab, tasks, archivedTasks, currentMember])

  // Combined Activities for "Todas"
  const allCombinedActivities = useMemo(() => {
    const items: Array<{
      id: string
      rawId: string
      title: string
      type: 'task' | 'event' | 'reminder'
      time?: string
      date?: string
      completed?: boolean
      priority?: TaskPriority
      memberIds: string[]
      location?: string
      daysLeft?: number
    }> = []

    filteredTasks.forEach((t) => {
      items.push({
        id: `tk-${t.id}`,
        rawId: t.id,
        title: t.title,
        type: 'task',
        completed: t.completed,
        priority: t.priority,
        memberIds: getTaskMemberIds(t),
      })
    })

    filteredEvents.forEach((e) => {
      items.push({
        id: `ev-${e.id}`,
        rawId: e.id,
        title: e.title,
        type: 'event',
        date: e.date,
        time: e.time,
        location: e.location,
        memberIds: getEventMemberIds(e),
      })
    })

    filteredReminders.forEach((r) => {
      items.push({
        id: `rm-${r.id}`,
        rawId: r.id,
        title: r.title,
        type: 'reminder',
        date: r.dueDate,
        daysLeft: r.daysLeft,
        memberIds: getReminderMemberIds(r),
      })
    })

    return items
  }, [filteredTasks, filteredEvents, filteredReminders])

  // Handle Quick Add based on active activity kind
  const handleDirectAdd = (kind?: 'tarea' | 'evento' | 'recordatorio') => {
    setIsAddMenuOpen(false)
    if (kind) {
      openQuickAdd(kind, { hideTabs: true })
      return
    }
    if (activityKind === 'tareas') openQuickAdd('tarea', { hideTabs: true, defaultSection: tab })
    else if (activityKind === 'eventos') openQuickAdd('evento', { hideTabs: true })
    else if (activityKind === 'recordatorios') openQuickAdd('recordatorio', { hideTabs: true })
    else setIsAddMenuOpen(true)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── BARRA SUPERIOR DE ACTIVIDADES (SELECTOR TIPO PÍLDORA UNIFICADO) ── */}
      <div className="w-full flex items-center justify-between p-2 px-3 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        {/* Selector de tipo de actividad */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActivityKind('todas')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              activityKind === 'todas'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Todas ({allCombinedActivities.length})
          </button>
          <button
            onClick={() => setActivityKind('tareas')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              activityKind === 'tareas'
                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <span className="size-2 rounded-full bg-blue-500" />
            <span>Tareas ({filteredTasks.length})</span>
          </button>
          <button
            onClick={() => setActivityKind('eventos')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              activityKind === 'eventos'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Eventos ({filteredEvents.length})</span>
          </button>
          <button
            onClick={() => setActivityKind('recordatorios')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              activityKind === 'recordatorios'
                ? 'bg-orange-500/25 text-orange-300 border border-orange-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <span className="size-2 rounded-full bg-orange-500" />
            <span>Recordatorios ({filteredReminders.length})</span>
          </button>
        </div>

        {/* Botón de Creación Rápida Inteligente */}
        <div className="relative shrink-0">
          <button
            onClick={() => handleDirectAdd()}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Añadir</span>
          </button>

          {/* Menú emergente de creación en caso de 'Todas' */}
          {isAddMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAddMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl bg-white dark:bg-[#131127]/95 border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                <button
                  onClick={() => handleDirectAdd('tarea')}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="size-2 rounded-full bg-blue-500" />
                  <span>🔵 Nueva Tarea</span>
                </button>
                <button
                  onClick={() => handleDirectAdd('evento')}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span>🟢 Nuevo Evento</span>
                </button>
                <button
                  onClick={() => handleDirectAdd('recordatorio')}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-left"
                >
                  <span className="size-2 rounded-full bg-orange-500" />
                  <span>🟠 Nuevo Recordatorio</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISTA: TODAS LAS ACTIVIDADES COMBINADAS */}
      {/* ========================================================================= */}
      {activityKind === 'todas' && (
        <div className="space-y-3">
          {allCombinedActivities.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-lg">
                ✨
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                No hay actividades pendientes en este momento.
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => openQuickAdd('tarea', { hideTabs: true })}
                  className="rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 text-xs font-bold hover:bg-blue-600/40 transition-all"
                >
                  + Tarea
                </button>
                <button
                  onClick={() => openQuickAdd('evento', { hideTabs: true })}
                  className="rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold hover:bg-emerald-600/40 transition-all"
                >
                  + Evento
                </button>
                <button
                  onClick={() => openQuickAdd('recordatorio', { hideTabs: true })}
                  className="rounded-xl bg-orange-600/30 text-orange-300 border border-orange-500/30 px-3 py-1.5 text-xs font-bold hover:bg-orange-600/40 transition-all"
                >
                  + Recordatorio
                </button>
              </div>
            </div>
          ) : (
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="flex flex-col divide-y divide-white/5">
                {allCombinedActivities.map((act) => {
                  const assigned = act.memberIds.map((id) => getMemberById(id)).filter(Boolean) as Member[]

                  return (
                    <div
                      key={act.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Tipo de actividad */}
                        {act.type === 'task' && (
                          <button
                            onClick={() => handleToggle(act.rawId, act.title)}
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
                              act.completed
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-blue-500/40 text-transparent hover:border-blue-500'
                            )}
                          >
                            <Check className="size-3 stroke-[3]" />
                          </button>
                        )}
                        {act.type === 'event' && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-purple-400">
                            <CalendarDays className="size-3.5" />
                          </div>
                        )}
                        {act.type === 'reminder' && (
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-orange-500/20 text-orange-400">
                            <Bell className="size-3.5" />
                          </div>
                        )}

                        {/* Título y detalles */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-xs sm:text-sm font-bold text-foreground truncate',
                              act.completed && 'line-through opacity-60'
                            )}
                          >
                            {act.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {act.type === 'event' && act.time && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="size-2.5" /> {act.date} · {act.time}
                              </span>
                            )}
                            {act.type === 'reminder' && act.date && (
                              <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-0.5">
                                <Clock className="size-2.5" /> {act.date}
                              </span>
                            )}
                            {act.location && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                                <MapPin className="size-2.5" /> {act.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Asignados y botón de eliminar */}
                      <div className="flex items-center gap-2 shrink-0">
                        {assigned.length > 0 && (
                          <div className="flex -space-x-1">
                            {assigned.slice(0, 2).map((m) => (
                              <MemberAvatar key={m.id} member={m} size="xs" ring />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const typeLabel = act.type === 'task' ? 'tarea' : act.type === 'event' ? 'evento' : 'recordatorio'
                            confirmDelete({
                              title: `¿Eliminar ${typeLabel}?`,
                              itemName: act.title,
                              confirmText: `Eliminar ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}`,
                              onConfirm: () => {
                                if (act.type === 'task') deleteTask(act.rawId)
                                else if (act.type === 'event') deleteEvent(act.rawId)
                                else if (act.type === 'reminder') deleteReminder(act.rawId)
                              },
                            })
                          }}
                          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={`Eliminar ${act.type === 'task' ? 'tarea' : act.type === 'event' ? 'evento' : 'recordatorio'}`}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: 🔵 TAREAS ESPECÍFICAS (CON CATEGORÍAS Y KANBAN) */}
      {/* ========================================================================= */}
      {activityKind === 'tareas' && (
        <div className="space-y-4">
          {/* Header Card Glassmorphism */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white tabular-nums">{doneCount}</span>
              <span className="text-xs text-slate-400">tareas completadas</span>
            </div>
            {/* Selector Lista / Kanban compacto */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                  viewMode === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                )}
              >
                <List className="size-3" />
                <span>Lista</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all',
                  viewMode === 'kanban' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                )}
              >
                <LayoutGrid className="size-3" />
                <span>Kanban</span>
              </button>
            </div>
          </div>

          {/* Tabs with Deletable pills + Add Category */}
          <PillTabs
            tabs={allTabs}
            value={tab}
            onChange={setTab}
            onDelete={handlePromptDelete}
            rightElement={
              <button
                onClick={handleOpenCreateModal}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-3 py-1.5 text-xs font-bold text-emerald-400 transition-all active:scale-95 hover:bg-white/[0.06]"
                title="Añadir categoría"
              >
                <Plus className="size-3" />
                <span>Añadir categoría</span>
              </button>
            }
          />

          {filteredTasks.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-lg">
                ✅
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay tareas en esta categoría.</p>
              <button
                onClick={() => openQuickAdd('tarea', { hideTabs: true, defaultSection: tab })}
                className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Añadir tarea
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="flex flex-col divide-y divide-white/5">
                {filteredTasks.map((t) => {
                  const prio = priorityConfig[t.priority]
                  const PrioIcon = prio.icon
                  return (
                    <div key={t.id} className="py-1.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-1">
                        <span className={cn('shrink-0 rounded-md px-1 py-0.5 text-[9px] font-bold leading-tight', prio.bg)}>
                          <PrioIcon className="inline size-2.5 mr-0.5" />
                          {prio.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <TaskRow
                            task={t}
                            member={getMemberById(t.assignedToMemberId)}
                            checked={t.completed}
                            onToggle={() => handleToggle(t.id, t.title)}
                            onDelete={() => {
                              confirmDelete({
                                title: '¿Eliminar tarea?',
                                itemName: t.title,
                                confirmText: 'Eliminar Tarea',
                                onConfirm: () => deleteTask(t.id),
                              })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400">
                    Pendientes ({filteredTasks.filter((t) => !t.completed).length})
                  </span>
                </div>
                {filteredTasks.filter((t) => !t.completed).map((t) => (
                  <Card key={t.id} className="p-3 bg-white/[0.02] border-white/10 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-foreground">{t.title}</p>
                      <button
                        onClick={() => handleToggle(t.id, t.title)}
                        className="size-5 rounded border border-white/20 flex items-center justify-center text-transparent hover:border-emerald-400"
                      >
                        <Check className="size-3" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400">
                    Completadas ({filteredTasks.filter((t) => t.completed).length})
                  </span>
                </div>
                {filteredTasks.filter((t) => t.completed).map((t) => (
                  <Card key={t.id} className="p-3 bg-white/[0.02] border-white/10 rounded-xl space-y-2 opacity-60">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-foreground line-through">{t.title}</p>
                      <button
                        onClick={() => handleToggle(t.id, t.title)}
                        className="size-5 rounded bg-emerald-500 text-white flex items-center justify-center"
                      >
                        <Check className="size-3" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA: 🟢 EVENTOS ESPECÍFICOS */}
      {/* ========================================================================= */}
      {activityKind === 'eventos' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-lg">
                📅
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay eventos programados en este grupo.</p>
              <button
                onClick={() => openQuickAdd('evento', { hideTabs: true })}
                className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Añadir evento
              </button>
            </div>
          ) : (
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="flex flex-col divide-y divide-white/5">
                {filteredEvents.map((e) => {
                  const assigned = getEventMemberIds(e).map((id) => getMemberById(id)).filter(Boolean) as Member[]

                  return (
                    <div
                      key={e.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CalendarDays className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate">{e.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="size-2.5" /> {e.date} · {e.time}
                            </span>
                            {e.location && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                                <MapPin className="size-2.5" /> {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {assigned.length > 0 && (
                          <div className="flex -space-x-1">
                            {assigned.slice(0, 2).map((m) => (
                              <MemberAvatar key={m.id} member={m} size="xs" ring />
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => deleteEvent(e.id)}
                          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VISTA: 🟠 RECORDATORIOS ESPECÍFICOS */}
      {/* ========================================================================= */}
      {activityKind === 'recordatorios' && (
        <div className="space-y-3">
          {filteredReminders.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 text-lg">
                🔔
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay recordatorios activos.</p>
              <button
                onClick={() => openQuickAdd('recordatorio', { hideTabs: true })}
                className="mt-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Añadir recordatorio
              </button>
            </div>
          ) : (
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="flex flex-col divide-y divide-white/5">
                {filteredReminders.map((r) => {
                  const assigned = getReminderMemberIds(r).map((id) => getMemberById(id)).filter(Boolean) as Member[]

                  return (
                    <div
                      key={r.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                          <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-orange-400 font-semibold flex items-center gap-0.5">
                              <Clock className="size-2.5" /> {r.dueDate}
                            </span>
                            {r.daysLeft <= 2 && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-black text-rose-300 uppercase">
                                Urgente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {assigned.length > 0 && (
                          <div className="flex -space-x-1">
                            {assigned.slice(0, 2).map((m) => (
                              <MemberAvatar key={m.id} member={m} size="xs" ring />
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => deleteReminder(r.id)}
                          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
