'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ListTodo,
  Clock,
  Bell,
  CheckCircle2,
  Plus,
  Calendar,
  AlertTriangle,
  Sparkles,
  Flame,
  Home,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'
import { getTodayISO } from '@/lib/date-utils'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export type TabFilter = 'hoy' | 'todas' | 'recordatorios'

interface DisplayTaskItem {
  id: string
  rawId: string
  title: string
  type: 'task' | 'reminder' | 'habit'
  dueDate?: string
  dueTime?: string
  completed: boolean
  assignedToMemberId?: string
  createdBy?: string
  points?: number
  isUrgent?: boolean
}

export function TasksBoard() {
  const {
    tasks,
    reminders,
    events,
    members,
    currentMember,
    toggleTask,
    deleteReminder,
    openQuickAdd,
    getMemberById,
    setTab,
  } = useApp()
  const { toast } = useToast()

  const [activeFilter, setActiveFilter] = useState<TabFilter>('hoy')
  const today = getTodayISO()

  // Sincronización en tiempo real vía Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tasks-board-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          // Las mutaciones en tasks se reflejan en el contexto
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Adaptador de tareas y recordatorios unificados
  const allItems: DisplayTaskItem[] = useMemo(() => {
    const list: DisplayTaskItem[] = []

    // 1. Tareas regulares
    tasks.forEach((t) => {
      // Determinar si es tipo hábito o tarea regular
      const isHabit = t.title.toLowerCase().includes('lavar') ||
        t.title.toLowerCase().includes('ordenar') ||
        t.title.toLowerCase().includes('comprar') ||
        t.title.toLowerCase().includes('limpiar')

      list.push({
        id: `task-${t.id}`,
        rawId: t.id,
        title: t.title,
        type: isHabit ? 'habit' : 'task',
        dueDate: t.dueDate || today,
        dueTime: t.dueTime,
        completed: t.completed,
        assignedToMemberId: t.assignedToMemberId,
        createdBy: t.createdBy,
        points: t.points || 10,
        isUrgent: t.dueDate === today,
      })
    })

    // 2. Recordatorios
    reminders.forEach((r) => {
      list.push({
        id: `rem-${r.id}`,
        rawId: r.id,
        title: r.title,
        type: 'reminder',
        dueDate: r.dueDate || today,
        dueTime: r.daysLeft === 0 ? 'Hoy' : undefined,
        completed: false,
        assignedToMemberId: r.memberIds?.[0],
        isUrgent: r.dueDate === today || r.daysLeft === 0,
      })
    })

    return list
  }, [tasks, reminders, today])

  // Filtrado según la pestaña activa
  const filteredItems = useMemo(() => {
    if (activeFilter === 'hoy') {
      return allItems.filter(
        (item) => !item.completed && (item.dueDate === today || item.isUrgent)
      )
    }
    if (activeFilter === 'todas') {
      return allItems.filter((item) => !item.completed)
    }
    if (activeFilter === 'recordatorios') {
      return allItems.filter((item) => item.type === 'reminder')
    }
    return allItems
  }, [allItems, activeFilter, today])

  // Conteo para los badges de las pestañas
  const countToday = useMemo(
    () => allItems.filter((i) => !i.completed && (i.dueDate === today || i.isUrgent)).length,
    [allItems, today]
  )
  const countAll = useMemo(
    () => allItems.filter((i) => !i.completed).length,
    [allItems]
  )
  const countReminders = useMemo(
    () => allItems.filter((i) => i.type === 'reminder').length,
    [allItems]
  )

  const handleToggle = (item: DisplayTaskItem) => {
    if (item.type === 'reminder') {
      deleteReminder(item.rawId)
      toast(`Recordatorio "${item.title}" completado`, '⏰')
      return
    }

    const canComplete =
      !currentMember ||
      item.assignedToMemberId === currentMember.id ||
      item.createdBy === currentMember.id

    if (!canComplete) {
      toast('Solo la persona asignada o el creador pueden marcarla', '🔒')
      return
    }

    const result = toggleTask(item.rawId)
    if (result.pointsAwarded > 0) {
      toast(`¡+${result.pointsAwarded} ⭐ por "${item.title}"!`, '🎉')
    } else {
      toast(`"${item.title}" completada`, '✅')
    }
  }

  const formatDeadlineBadge = (dueDate?: string, dueTime?: string) => {
    if (!dueDate && !dueTime) return null

    if (dueDate === today) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
          <Clock className="size-3" />
          {dueTime ? `Hoy a las ${dueTime}` : 'Hoy'}
        </span>
      )
    }

    if (dueDate && dueDate > today) {
      const diffTime = new Date(`${dueDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
      const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      const label = daysLeft === 1 ? 'Mañana' : `En ${daysLeft} días`

      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 border border-slate-300 dark:bg-white/[0.06] dark:border-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="size-3" />
          {label} {dueTime ? `· ${dueTime}` : ''}
        </span>
      )
    }

    return null
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="size-4 text-orange-500" />
      case 'habit':
        return <Home className="size-4 text-teal-500 dark:text-teal-400" />
      default:
        return <ListTodo className="size-4 text-purple-600 dark:text-purple-400" />
    }
  }

  return (
    <Card className="p-4 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 dark:bg-[#110C24] dark:border-purple-900/40 dark:shadow-2xl">
      {/* Cabecera del Tablón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-purple-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 shrink-0">
            <ListTodo className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Tablón de Tareas y Recordatorios
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organización del día y pendientes del hogar
            </p>
          </div>
        </div>

        {/* Botón Acción Rápida */}
        <button
          onClick={() => openQuickAdd('tarea')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 transition-all active:scale-95 shadow-md shadow-purple-950/40 border border-purple-400/20"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Añadir tarea rápida</span>
        </button>
      </div>

      {/* Pestañas / Filtros Rápidos */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('hoy')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
            activeFilter === 'hoy'
              ? 'bg-purple-600 text-white shadow-sm dark:bg-purple-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <span>Para hoy</span>
          {countToday > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                activeFilter === 'hoy'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
              )}
            >
              {countToday}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('todas')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
            activeFilter === 'todas'
              ? 'bg-purple-600 text-white shadow-sm dark:bg-purple-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <span>Todas</span>
          {countAll > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                activeFilter === 'todas'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'
              )}
            >
              {countAll}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('recordatorios')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
            activeFilter === 'recordatorios'
              ? 'bg-purple-600 text-white shadow-sm dark:bg-purple-600 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          )}
        >
          <span>Recordatorios</span>
          {countReminders > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                activeFilter === 'recordatorios'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-500/20 text-orange-600 dark:text-orange-300'
              )}
            >
              {countReminders}
            </span>
          )}
        </button>
      </div>

      {/* Lista de Tareas con Interactividad */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          /* Empty State Amigable */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 animate-fade-in">
            <div className="flex size-14 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 mb-3 shadow-inner">
              <Sparkles className="size-7" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              🎉 ¡Todo al día!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              {activeFilter === 'hoy'
                ? 'No tienes tareas ni recordatorios pendientes para hoy.'
                : activeFilter === 'todas'
                ? 'No hay tareas pendientes en este grupo.'
                : 'No tienes recordatorios activos en este momento.'}
            </p>
            <button
              onClick={() => openQuickAdd('tarea')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-white"
            >
              <Plus className="size-3.5" />
              <span>Crear nueva tarea</span>
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const member = item.assignedToMemberId ? getMemberById(item.assignedToMemberId) : null
            const isCompleted = item.completed

            return (
              <div
                key={item.id}
                className={cn(
                  'group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200',
                  isCompleted
                    ? 'bg-slate-50/60 border-slate-200 opacity-60 dark:bg-white/[0.01] dark:border-white/5'
                    : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200/90 shadow-2xs hover:shadow-sm dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:border-purple-500/15'
                )}
              >
                {/* Checkbox y Título */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggle(item)}
                    className={cn(
                      'flex size-5.5 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90',
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-purple-400/40 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-black/40'
                    )}
                    title={isCompleted ? 'Marcar como pendiente' : 'Completar tarea'}
                  >
                    {isCompleted && <Check className="size-3.5 stroke-[3]" />}
                  </button>

                  {/* Icono de Tipo */}
                  <div className="flex size-7 items-center justify-center rounded-lg bg-slate-200/60 dark:bg-white/5 shrink-0">
                    {renderTypeIcon(item.type)}
                  </div>

                  {/* Título y Badges */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate transition-all',
                        isCompleted && 'line-through text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {item.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {formatDeadlineBadge(item.dueDate, item.dueTime)}

                      {item.points && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          ⭐ +{item.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Asignado */}
                <div className="flex items-center gap-2 shrink-0">
                  {member ? (
                    <div className="flex items-center gap-1.5" title={`Asignado a ${member.name}`}>
                      <MemberAvatar member={member} size="sm" ring />
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline truncate max-w-[80px]">
                        {member.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      Sin asignar
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer del Tablón */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-purple-500/10 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {filteredItems.length} {filteredItems.length === 1 ? 'elemento' : 'elementos'} en esta vista
        </span>
        <button
          onClick={() => setTab('organizar')}
          className="flex items-center gap-1 font-bold text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-white transition-colors"
        >
          <span>Ir al organizador</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </Card>
  )
}
