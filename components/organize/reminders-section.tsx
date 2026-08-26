'use client'

import { useState, useMemo } from 'react'
import { Trash2, Bell, Home, Calendar, Plus, Clock, FileText, Stethoscope, Receipt, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import { getReminderMemberIds, type Member, type Reminder } from '@/types'
import { cn } from '@/lib/utils'

type ReminderTab = 'proximos' | 'itv_docs' | 'todos'

export function RemindersSection({
  memberFilter = 'all',
  searchQuery = '',
}: {
  memberFilter?: string
  searchQuery?: string
} = {}) {
  const { reminders, deleteReminder, getMemberById, openQuickAdd, confirmDelete } = useApp()
  const [tab, setTab] = useState<ReminderTab>('proximos')

  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => {
      if (memberFilter !== 'all') {
        const memberIds = getReminderMemberIds(r)
        if (memberIds.length > 0 && !memberIds.includes(memberFilter)) return false
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!r.title.toLowerCase().includes(q)) return false
      }
      if (tab === 'proximos') {
        return r.daysLeft <= 7
      }
      if (tab === 'itv_docs') {
        const titleLower = r.title.toLowerCase()
        return (
          r.type === 'itv' ||
          r.type === 'documento' ||
          r.type === 'factura' ||
          titleLower.includes('itv') ||
          titleLower.includes('seguro') ||
          titleLower.includes('dni') ||
          titleLower.includes('pasaporte') ||
          titleLower.includes('impuesto')
        )
      }
      return true
    })
  }, [reminders, memberFilter, searchQuery, tab])

  const sortedReminders = [...filteredReminders].sort((a, b) => a.daysLeft - b.daysLeft)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Card Glassmorphism Compacto */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{reminders.length}</span>
          <span className="text-xs text-slate-400">recordatorios activos</span>
        </div>

        <button
          onClick={() => openQuickAdd('recordatorio', { hideTabs: true })}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-transform active:scale-95"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>+ Nuevo recordatorio</span>
        </button>
      </div>

      {/* Subtabs Filter Compactos */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/10 rounded-2xl w-fit">
        <button
          onClick={() => setTab('proximos')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            tab === 'proximos'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Próximos 7 días
        </button>
        <button
          onClick={() => setTab('itv_docs')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            tab === 'itv_docs'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          ITV y Documentos
        </button>
        <button
          onClick={() => setTab('todos')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            tab === 'todos'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Todos ({reminders.length})
        </button>
      </div>

      {sortedReminders.length === 0 ? (
        <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 text-lg">
            🔔
          </div>
          <p className="text-xs text-slate-400 max-w-xs">No hay recordatorios en esta sección.</p>
          <button
            onClick={() => openQuickAdd('recordatorio', { hideTabs: true })}
            className="mt-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            + Añadir recordatorio
          </button>
        </div>
      ) : (
        <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
          <div className="flex flex-col divide-y divide-border/60">
            {sortedReminders.map((r) => {
              const memberIds = getReminderMemberIds(r)
              const assignedMembers = memberIds.map((id) => getMemberById(id)).filter(Boolean) as Member[]
              const isUrgent = r.daysLeft <= 2
              const isToday = r.daysLeft <= 0

              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-3 px-3 hover:bg-secondary/30 rounded-xl transition-colors"
                >
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl shrink-0 border',
                      isToday
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 animate-pulse'
                        : isUrgent
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-secondary text-muted-foreground border-border'
                    )}
                  >
                    <Bell className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{r.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                        <Calendar className="size-3" />
                        Vence: {r.dueDate}
                      </p>
                      {assignedMembers.length > 0 ? (
                        <div className="flex items-center gap-1.5 bg-secondary/80 rounded-full pl-1.5 pr-2.5 py-0.5 text-[10px] font-bold text-foreground border border-border">
                          <div className="flex -space-x-1">
                            {assignedMembers.map((m) => (
                              <MemberAvatar key={m.id} member={m} size="xs" ring />
                            ))}
                          </div>
                          <span>{assignedMembers.map((m) => m.name).join(', ')}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                          <Home className="size-3" />
                          <span>Hogar común</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-black shrink-0 border',
                      isToday
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
                        : isUrgent
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                        : 'bg-secondary text-muted-foreground border-border'
                    )}
                  >
                    {isToday ? '¡Hoy!' : r.daysLeft === 1 ? '¡Mañana!' : `${r.daysLeft}d restantes`}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      confirmDelete({
                        title: '¿Eliminar recordatorio?',
                        itemName: r.title,
                        confirmText: 'Eliminar Recordatorio',
                        onConfirm: () => deleteReminder(r.id),
                      })
                    }}
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-rose-500/10 hover:text-rose-500 shrink-0"
                    title="Eliminar recordatorio"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
