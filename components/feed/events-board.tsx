'use client'

import { useMemo, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  MapPin,
  ChevronRight,
  Sparkles,
  Dumbbell,
  Home,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Cake,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'
import { getTodayISO } from '@/lib/date-utils'
import { createClient } from '@/lib/supabase'
import { getEventMemberIds, type CalendarEvent, type EventCategory } from '@/types'
import { cn } from '@/lib/utils'

export function EventsBoard() {
  const { events, getMemberById, openQuickAdd, deleteEvent, setTab } = useApp()
  const { toast } = useToast()
  const today = getTodayISO()

  // Sincronización en tiempo real vía Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('events-board-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          // Actualizaciones en tiempo real
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Eventos de hoy en adelante, ordenados cronológicamente
  const upcomingEvents = useMemo(() => {
    return (events ?? [])
      .filter((e) => e?.date && e.date >= today)
      .sort((a, b) => {
        const dateDiff = (a.date || '').localeCompare(b.date || '')
        if (dateDiff !== 0) return dateDiff
        return (a.time || '00:00').localeCompare(b.time || '00:00')
      })
  }, [events, today])

  // Formato del Badge de Fecha Lateral
  const formatEventDateBadge = (dateStr: string) => {
    if (dateStr === today) {
      return { main: 'HOY', sub: 'Prioridad', isToday: true, isTomorrow: false }
    }

    const diffTime = new Date(`${dateStr}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    if (daysLeft === 1) {
      return { main: 'MAÑANA', sub: 'Próximo', isToday: false, isTomorrow: true }
    }

    const [year, month, day] = dateStr.split('-')
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
    const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dateObj).toUpperCase().replace('.', '')
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(dateObj).toUpperCase().replace('.', '')

    return {
      main: `${day} ${monthName}`,
      sub: dayName,
      isToday: false,
      isTomorrow: false,
    }
  }

  // Icono según la categoría del evento
  const getCategoryIcon = (category?: EventCategory) => {
    switch (category) {
      case 'Deporte':
        return <Dumbbell className="size-3.5" />
      case 'Casa':
        return <Home className="size-3.5" />
      case 'Trabajo':
        return <Briefcase className="size-3.5" />
      case 'Estudio':
      case 'Colegio':
        return <GraduationCap className="size-3.5" />
      case 'Médico':
        return <HeartPulse className="size-3.5" />
      case 'Cumpleaños':
        return <Cake className="size-3.5" />
      default:
        return <Calendar className="size-3.5" />
    }
  }

  const getCategoryColor = (category?: EventCategory) => {
    switch (category) {
      case 'Deporte':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
      case 'Médico':
        return 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300'
      case 'Trabajo':
        return 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300'
      case 'Cumpleaños':
        return 'bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-300'
      case 'Casa':
        return 'bg-teal-500/15 text-teal-700 border-teal-500/30 dark:text-teal-300'
      default:
        return 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300'
    }
  }

  return (
    <Card className="p-4 sm:p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4 dark:bg-[#110C24] dark:border-purple-900/40 dark:shadow-2xl">
      {/* Cabecera del Tablón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-purple-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 shrink-0">
            <Calendar className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Próximos Eventos
              </h3>
              {upcomingEvents.length > 0 && (
                <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider dark:bg-purple-500/25 dark:border-purple-500/40 dark:text-purple-300">
                  {upcomingEvents.length} {upcomingEvents.length === 1 ? 'evento' : 'eventos'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reuniones, entrenamientos y compromisos del hogar
            </p>
          </div>
        </div>

        {/* Botón Nuevo Evento */}
        <button
          onClick={() => openQuickAdd('evento')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 transition-all active:scale-95 shadow-md shadow-emerald-950/20 border border-emerald-500/30 dark:bg-purple-600 dark:hover:bg-purple-500 dark:shadow-purple-950/40 dark:border-purple-400/20"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Nuevo evento</span>
        </button>
      </div>

      {/* Listado de Eventos */}
      <div className="space-y-2.5">
        {upcomingEvents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 animate-fade-in">
            <div className="flex size-14 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 mb-3 shadow-inner">
              <Sparkles className="size-7" />
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              Calendario despejado
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              No hay eventos programados para los próximos días. ¡Añade uno nuevo para coordinar con tu grupo!
            </p>
            <button
              onClick={() => openQuickAdd('evento')}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-purple-300 dark:hover:text-white"
            >
              <Plus className="size-3.5" />
              <span>Crear nuevo evento</span>
            </button>
          </div>
        ) : (
          upcomingEvents.slice(0, 5).map((e) => {
            const dateBadge = formatEventDateBadge(e.date)
            const memberIds = getEventMemberIds(e)
            const timeRange = e.endTime ? `${e.time || 'Todo el día'} - ${e.endTime}` : (e.time || 'Todo el día')

            return (
              <div
                key={e.id}
                className={cn(
                  'group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200',
                  dateBadge.isToday
                    ? 'bg-emerald-50/70 border-emerald-200 dark:bg-purple-950/25 dark:border-purple-500/30 dark:shadow-md'
                    : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:border-white/5'
                )}
              >
                {/* Lado Izquierdo: Badge de Fecha + Detalles */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Badge de Fecha Destacado */}
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center size-12 rounded-xl border text-center shrink-0 shadow-xs leading-none p-1',
                      dateBadge.isToday
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30 dark:bg-purple-600 dark:border-purple-500'
                        : dateBadge.isTomorrow
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-200/80 text-slate-800 border-slate-300 dark:bg-white/[0.06] dark:text-slate-200 dark:border-white/10'
                    )}
                  >
                    <span className="text-[11px] font-black tracking-tight">{dateBadge.main}</span>
                    <span className="text-[9px] font-bold opacity-80 mt-0.5">{dateBadge.sub}</span>
                  </div>

                  {/* Título, Horario, Ubicación y Categoría */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {e.title}
                      </p>
                      {e.category && (
                        <span
                          className={cn(
                            'hidden sm:inline-flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider',
                            getCategoryColor(e.category)
                          )}
                        >
                          {getCategoryIcon(e.category)}
                          <span>{e.category}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="size-3 text-emerald-600 dark:text-purple-400" />
                        {timeRange}
                      </span>

                      {e.location && (
                        <span className="inline-flex items-center gap-0.5 truncate text-slate-500 dark:text-slate-400">
                          <MapPin className="size-3 text-slate-400" />
                          {e.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Participantes & Acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  {memberIds.length > 0 && (
                    <div className="flex -space-x-1.5 items-center">
                      {memberIds.map((mId) => {
                        const m = getMemberById(mId)
                        return m ? <MemberAvatar key={m.id} member={m} size="sm" ring /> : null
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      deleteEvent(e.id)
                      toast('Evento eliminado', '🗑️')
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 dark:hover:text-rose-400"
                    title="Eliminar evento"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer del Tablón */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-purple-500/10 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          Mostrando {Math.min(5, upcomingEvents.length)} de {upcomingEvents.length} eventos
        </span>
        <button
          onClick={() => setTab('organizar')}
          className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 dark:text-purple-300 dark:hover:text-white transition-colors"
        >
          <span>Abrir calendario completo</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </Card>
  )
}
