'use client'

import { useMemo } from 'react'
import {
  Users,
  UserPlus,
  Star,
  Flame,
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { FeedHeader } from './feed-header'
import { TasksBoard } from './tasks-board'
import { EventsBoard } from './events-board'
import { ActivityFeed } from './activity-feed'
import { useApp } from '@/components/app/app-context'
import { getTodayISO } from '@/lib/date-utils'
import { getEventMemberIds, getReminderMemberIds, type EventCategory } from '@/types'
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
    reminders,
    members,
    currentMember,
    getMemberById,
    openQuickAdd,
  } = useApp()

  const today = getTodayISO()

  // Elementos Próximos (Días posteriores ordenados cronológicamente)
  const upcomingItems = useMemo(() => {
    const list: UpcomingItem[] = []

    events
      .filter((e) => e.date > today)
      .forEach((e) => {
        const diffTime =
          new Date(`${e.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
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

    return list.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date)
      if (dateDiff !== 0) return dateDiff
      return (a.time || '00:00').localeCompare(b.time || '00:00')
    })
  }, [events, reminders, today])

  // Leaderboard ordenado por puntos
  const leaderboard = useMemo(
    () => [...members].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [members]
  )

  const formatDaysBadge = (days: number, dateStr: string) => {
    if (days === 1) return 'Mañana'
    if (days === 2) return 'Pasado mañana'
    if (days <= 7) return `En ${days} días`
    const parts = dateStr.split('-')
    const m = parts[1] || '01'
    const d = parts[2] || '01'
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1] || ''}`
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pb-8">
      {/* 1. Saludo Superior con Acceso a Notificaciones */}
      <FeedHeader />

      {/* 2. Tarjeta: Miembros del Hogar y Puntos */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3.5 dark:bg-[#121026]/90 dark:border-purple-500/20 dark:shadow-xl">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-400 shrink-0">
              <Users className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Miembros del Hogar</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Integrantes de tu espacio y balance de puntos</p>
            </div>
          </div>

          <button
            onClick={() => openQuickAdd('miembro', { hideTabs: true })}
            className="flex items-center gap-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 text-xs font-bold text-purple-800 transition-all active:scale-95 shadow-sm dark:bg-purple-600/20 dark:hover:bg-purple-600/35 dark:border-purple-500/30 dark:text-purple-200"
          >
            <UserPlus className="size-3.5" />
            <span>Invitar</span>
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No hay miembros registrados aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
                      ? 'bg-purple-50/80 border-purple-300 shadow-2xs dark:bg-purple-600/15 dark:border-purple-500/40 dark:ring-1 dark:ring-purple-500/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 dark:bg-white/[0.02] dark:border-white/5 dark:hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <MemberAvatar member={m} size="sm" ring />
                      {m.isOwner && (
                        <span
                          className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-purple-600 text-white ring-1 ring-white dark:bg-purple-600 dark:ring-[#121026]"
                          title="Propietario"
                        >
                          <ShieldCheck className="size-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.2 rounded-full dark:text-purple-300 dark:bg-purple-500/20">
                            Tú
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            'text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md',
                            isAdult
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20'
                              : isChild
                              ? 'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-500/20'
                              : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/20'
                          )}
                        >
                          {isAdult ? 'Adulto' : isChild ? 'Hijo/a' : 'Miembro'}
                        </span>

                        {streak > 0 && (
                          <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5">
                            <Flame className="size-3 fill-orange-500" />
                            <span>{streak}d</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 shrink-0 dark:bg-purple-500/10 dark:border-purple-500/20">
                    <Star className="size-3 fill-purple-500 text-purple-500" />
                    <span className="text-xs font-black text-purple-900 dark:text-purple-300 font-mono">
                      {m.points || 0}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 3. ESTRUCTURA DE 2 COLUMNAS (GRID RESPONSIVE)                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA PRINCIPAL / IZQUIERDA: Tablón de Tareas + Tablón de Eventos */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Sección 1: Tablón de Tareas y Recordatorios */}
          <TasksBoard />

          {/* Sección 2: Tablón de Eventos Próximos */}
          <EventsBoard />
        </div>

        {/* COLUMNA SECUNDARIA / DERECHA: Actividad Reciente */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-6">
          <ActivityFeed compact />
        </div>
      </div>
    </div>
  )
}
