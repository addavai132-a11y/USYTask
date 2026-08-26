'use client'

import { useMemo } from 'react'
import {
  Calendar,
  AlertTriangle,
  Users,
  UserPlus,
  Star,
  Flame,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Plus,
  Sparkles,
  ListTodo,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { EventRow } from '@/components/shared/event-row'
import { TaskRow } from '@/components/shared/task-row'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { FeedHeader } from './feed-header'
import { ActivityFeed } from './activity-feed'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'
import { getTodayISO } from '@/lib/date-utils'
import { getEventMemberIds, getReminderMemberIds, type CalendarEvent, type Reminder, type EventCategory } from '@/types'
import { cn } from '@/lib/utils'

interface UpcomingItem {
  id: string
  rawId: string
  type: 'event' | 'reminder'
  title: string
  date: string
  time?: string
  daysLeft: number
  category?: EventCategory
  location?: string
  memberIds: string[]
}

export function FeedScreen() {
  const {
    setTab,
    events,
    tasks,
    reminders,
    members,
    currentMember,
    toggleTask,
    getMemberById,
    deleteTask,
    deleteEvent,
    deleteReminder,
    openQuickAdd,
  } = useApp()
  const { toast } = useToast()

  const today = getTodayISO()

  // 1. Elementos de HOY
  const todayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === today)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
  }, [events, today])

  const todayReminders = useMemo(() => {
    return reminders
      .filter((r) => r.dueDate === today || r.daysLeft === 0)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [reminders, today])

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed)
  }, [tasks])

  // ¿Hay algo prioritario para HOY?
  const hasTodayItems = todayEvents.length > 0 || todayReminders.length > 0

  // 2. Elementos PRÓXIMOS (Días posteriores ordenados cronológicamente por la fecha más cercana)
  const upcomingItems = useMemo(() => {
    const list: UpcomingItem[] = []

    // Eventos futuros (posteriores a hoy)
    events
      .filter((e) => e.date > today)
      .forEach((e) => {
        const diffTime = new Date(`${e.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
        const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
        list.push({
          id: `ev-${e.id}`,
          rawId: e.id,
          type: 'event',
          title: e.title,
          date: e.date,
          time: e.time,
          daysLeft,
          category: e.category,
          location: e.location,
          memberIds: getEventMemberIds(e),
        })
      })

    // Recordatorios futuros (posteriores a hoy)
    reminders
      .filter((r) => r.dueDate > today || r.daysLeft > 0)
      .forEach((r) => {
        list.push({
          id: `rem-${r.id}`,
          rawId: r.id,
          type: 'reminder',
          title: r.title,
          date: r.dueDate,
          daysLeft: r.daysLeft > 0 ? r.daysLeft : 1,
          memberIds: getReminderMemberIds(r),
        })
      })

    // Ordenar cronológicamente: fecha más próxima primero
    return list.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date)
      if (dateDiff !== 0) return dateDiff
      return (a.time || '00:00').localeCompare(b.time || '00:00')
    })
  }, [events, reminders, today])

  // Leaderboard: members sorted by points
  const leaderboard = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))

  const handleToggle = (taskId: string, title: string) => {
    const result = toggleTask(taskId)
    if (result.pointsAwarded > 0) {
      toast(`¡+${result.pointsAwarded} ⭐ por "${title}"!`, '🎉')
    } else if (result.pointsAwarded < 0) {
      toast(`${result.pointsAwarded} ⭐ por desmarcar "${title}"`, '📉')
    } else {
      toast(`"${title}" actualizada`, '✅')
    }
  }

  // Formato relativo amigable de días restantes
  const formatDaysBadge = (days: number, dateStr: string) => {
    if (days === 1) return 'Mañana'
    if (days === 2) return 'Pasado mañana'
    if (days <= 7) return `En ${days} días`
    const [_, m, d] = dateStr.split('-')
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] || ''}`
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      <FeedHeader />

      {/* ========================================================================= */}
      {/* 1. SECCIÓN DE PRIORIDAD MÁXIMA PARA HOY (Solo si hay elementos hoy)        */}
      {/* ========================================================================= */}
      {hasTodayItems && (
        <Card className="p-4 sm:p-5 bg-gradient-to-b from-purple-950/40 to-[#121026]/90 border border-purple-500/30 rounded-3xl shadow-2xl backdrop-blur-xl space-y-3.5 ring-1 ring-purple-500/20">
          <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
                <Calendar className="size-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">Hoy en vuestro día</h3>
                  <span className="rounded-full bg-purple-500/25 border border-purple-500/40 px-2 py-0.5 text-[10px] font-black text-purple-300 uppercase tracking-wider">
                    {todayEvents.length + todayReminders.length} para hoy
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Prioridad para el día de hoy</p>
              </div>
            </div>

            <button
              onClick={() => setTab('organizar')}
              className="flex items-center gap-1 text-xs font-bold text-purple-300 hover:text-white transition-colors"
            >
              <span>Ver todo</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Eventos de hoy */}
            {todayEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-purple-500/20 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 shrink-0 text-xs font-mono font-bold">
                    {e.time || '📅'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">{e.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="rounded bg-purple-500/15 text-purple-300 px-1.5 py-0.2 font-semibold">
                        {e.category}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="size-2.5" />
                          {e.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getEventMemberIds(e).map((mId) => {
                    const m = getMemberById(mId)
                    return m ? <MemberAvatar key={m.id} member={m} size="xs" ring /> : null
                  })}
                  <button
                    onClick={() => deleteEvent(e.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-400"
                    title="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Recordatorios de hoy */}
            {todayReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/25 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-orange-200 truncate">{r.title}</p>
                    <span className="text-[10px] font-bold text-orange-400">Vence hoy</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteReminder(r.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-400"
                  title="Eliminar recordatorio"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── BLOQUE DE MIEMBROS DEL HOGAR (DARK GLASSMORPHISM) ── */}
      <Card className="p-4 sm:p-5 bg-[#121026]/90 border border-purple-500/20 rounded-3xl shadow-xl backdrop-blur-xl space-y-3.5">
        {/* Cabecera con Título y Botón Invitar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <Users className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Miembros del Hogar</h3>
              <p className="text-[11px] text-slate-400">Integrantes de tu espacio y balance de puntos</p>
            </div>
          </div>

          <button
            onClick={() => openQuickAdd('miembro', { hideTabs: true })}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 px-3 py-1.5 text-xs font-bold text-purple-200 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <UserPlus className="size-3.5" />
            <span>Invitar</span>
          </button>
        </div>

        {/* Lista de Miembros en Grid Responsivo */}
        {leaderboard.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No hay miembros registrados aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {leaderboard.map((m) => {
              const isAdult = m.role === 'adult' || m.role === 'adulto'
              const isChild = m.role === 'child' || m.role === 'hijo'
              const streak = m.streak || m.streakDays || 0
              const isCurrent = m.id === currentMember?.id

              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-all',
                    isCurrent
                      ? 'bg-purple-600/15 border-purple-500/40 shadow-sm ring-1 ring-purple-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-purple-500/20'
                  )}
                >
                  {/* Avatar y Datos del Miembro */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <MemberAvatar member={m} size="sm" ring />
                      {m.isOwner && (
                        <span
                          className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-purple-600 text-white ring-1 ring-[#121026]"
                          title="Propietario"
                        >
                          <ShieldCheck className="size-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{m.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded-full">
                            Tú
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            'text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md',
                            isAdult
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                              : isChild
                              ? 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          )}
                        >
                          {isAdult ? 'Adulto' : isChild ? 'Hijo/a' : 'Miembro'}
                        </span>

                        {streak > 0 && (
                          <span className="text-[10px] font-bold text-orange-400 flex items-center gap-0.5">
                            <Flame className="size-3 fill-orange-400" />
                            <span>{streak}d</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Puntos / Estrellas */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-300 font-mono">
                      {m.points || 0}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ── TIMELINE DE ACTIVIDAD RECIENTE ── */}
      <ActivityFeed compact />

      {/* ========================================================================= */}
      {/* 2. SECCIÓN DE PRÓXIMOS EVENTOS Y RECORDATORIOS (Cronológico y Compacto)   */}
      {/* ========================================================================= */}
      {upcomingItems.length > 0 && (
        <Card className="p-4 bg-[#121026]/90 border border-purple-500/20 rounded-3xl shadow-lg backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-purple-400" />
              <h3 className="text-xs sm:text-sm font-black text-white">Próximos eventos y recordatorios</h3>
            </div>
            <button
              onClick={() => setTab('organizar')}
              className="text-xs font-bold text-purple-300 hover:text-white transition-colors"
            >
              Ver calendario
            </button>
          </div>

          <div className="space-y-2">
            {upcomingItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      'flex size-7 items-center justify-center rounded-xl shrink-0',
                      item.type === 'event'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                        : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    )}
                  >
                    {item.type === 'event' ? <Calendar className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-semibold text-purple-300">
                        {formatDaysBadge(item.daysLeft, item.date)}
                      </span>
                      {item.time && <span>· {item.time}</span>}
                      {item.location && <span className="truncate">· {item.location}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.memberIds.map((mId) => {
                    const m = getMemberById(mId)
                    return m ? <MemberAvatar key={m.id} member={m} size="xs" ring /> : null
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. TAREAS PENDIENTES (Compacto)                                           */}
      {/* ========================================================================= */}
      {pendingTasks.length > 0 ? (
        <Card className="p-4 bg-[#121026]/90 border border-purple-500/20 rounded-3xl shadow-lg backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-black text-white">Tareas pendientes ({pendingTasks.length})</h3>
            </div>
            <button
              onClick={() => setTab('organizar')}
              className="text-xs font-bold text-purple-300 hover:text-white transition-colors"
            >
              Ver todas
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {pendingTasks.slice(0, 4).map((t) => {
              const canComplete = !currentMember || t.assignedToMemberId === currentMember.id || t.createdBy === currentMember.id
              return (
                <TaskRow
                  key={t.id}
                  task={t}
                  member={getMemberById(t.assignedToMemberId)}
                  checked={t.completed}
                  onToggle={() => handleToggle(t.id, t.title)}
                  onDelete={() => deleteTask(t.id)}
                  disabled={!canComplete}
                  onDisabledClick={() => toast('Solo la persona asignada o el creador pueden completarla', '🔒')}
                />
              )
            })}
          </div>
        </Card>
      ) : null}

      {/* ========================================================================= */}
      {/* 4. ESTADO DISCRETO CUANDO NO HAY NADA PENDIENTE NI PRÓXIMO                */}
      {/* ========================================================================= */}
      {!hasTodayItems && upcomingItems.length === 0 && pendingTasks.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-400 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <span>No tienes nada pendiente por ahora</span>
        </div>
      )}
    </div>
  )
}

