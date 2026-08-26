'use client'

import {
  Calendar,
  AlertTriangle,
  Users,
  UserPlus,
  Star,
  Flame,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { EventRow } from '@/components/shared/event-row'
import { TaskRow } from '@/components/shared/task-row'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { FeedHeader } from './feed-header'
import { ActivityFeed } from './activity-feed'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

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
  const todayEvents = events
    .filter((e) => e.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))

  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 5)
  const topReminders = reminders.slice(0, 5)

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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      <FeedHeader />

      {/* ── BLOQUE DE MIEMBROS INTEGRADO EN LA COLUMNA PRINCIPAL (DARK GLASSMORPHISM) ── */}
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
          <EmptyState
            emoji="👥"
            title="Sin miembros en el grupo"
            description="Invita a los integrantes de tu hogar"
            action="Invitar miembro"
            onAction={() => openQuickAdd('miembro', { hideTabs: true })}
          />
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

      {/* Hoy */}
      <Card variant="emerald">
        <CardHeader
          title="Hoy"
          action="Ver calendario"
          onAction={() => setTab('organizar')}
          icon={<Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />}
        />
        {todayEvents.length === 0 ? (
          <EmptyState emoji="📅" title="Sin eventos programados para hoy" action="Añadir evento" onAction={() => setTab('organizar')} />
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {todayEvents.map((e) => (
              <EventRow key={e.id} event={e} member={getMemberById(e.assignedToMemberId)} onDelete={() => deleteEvent(e.id)} />
            ))}
          </div>
        )}
      </Card>

      <ActivityFeed compact />

      {/* Tareas pendientes */}
      <Card variant="mint">
        <CardHeader title="Tareas pendientes" action="Ver todas" onAction={() => setTab('organizar')} />
        {pendingTasks.length === 0 ? (
          <EmptyState emoji="✅" title="No hay tareas pendientes en este grupo" action="Añadir tarea" onAction={() => setTab('organizar')} />
        ) : (
          <div className="flex flex-col gap-1">
            {pendingTasks.map((t) => {
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
        )}
      </Card>

      {/* No olvidéis */}
      <Card variant="rose">
        <CardHeader title="No olvidéis" icon={<AlertTriangle className="size-5 text-rose-500" />} />
        {topReminders.length === 0 ? (
          <EmptyState emoji="🔔" title="Sin recordatorios activos" />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {topReminders.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 font-medium">{r.title}</span>
                <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                  {r.daysLeft > 6 ? `${r.daysLeft} días` : r.daysLeft <= 1 ? 'Muy pronto' : `en ${r.daysLeft} días`}
                </span>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-rose-500/10 hover:text-rose-500 shrink-0"
                  title="Eliminar recordatorio"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

