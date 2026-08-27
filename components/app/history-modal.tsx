'use client'

import { X, CheckCircle2, CalendarPlus, Bell } from 'lucide-react'
import { useApp } from './app-context'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import type { Task, CalendarEvent, Reminder } from '@/types'

// Helper to sort mixed items
type HistoryItem = 
  | { type: 'task'; data: Task; dateObj: Date }
  | { type: 'event'; data: CalendarEvent; dateObj: Date }
  | { type: 'reminder'; data: Reminder; dateObj: Date }

export function HistoryModal() {
  const {
    historyOpen,
    closeHistory,
    archivedTasks,
    archivedEvents,
    archivedReminders,
    getMemberById,
  } = useApp()

  if (!historyOpen) return null

  // Combine and sort
  const items: HistoryItem[] = [
    ...archivedTasks.map((t): HistoryItem => ({ type: 'task', data: t, dateObj: new Date(t.completedAt || 0) })),
    ...archivedEvents.map((e): HistoryItem => ({ type: 'event', data: e, dateObj: new Date(`${e.date}T${e.time}`) })),
    ...archivedReminders.map((r): HistoryItem => ({ type: 'reminder', data: r, dateObj: new Date(`${r.dueDate}T23:59:59`) }))
  ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-250 flex flex-col h-[85vh] sm:h-[70vh]">
        {/* Mobile handle */}
        <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">Historial</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Elementos completados y pasados
            </p>
          </div>
          <button
            type="button"
            onClick={closeHistory}
            className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {items.length === 0 ? (
            <EmptyState emoji="🕰️" title="El historial está vacío" />
          ) : (
            items.map((item, idx) => {
              if (item.type === 'task') {
                const t = item.data as Task
                const m = getMemberById(t.assignedToMemberId)
                return (
                  <div key={`task-${t.id}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3 border border-border/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {m && <MemberAvatar member={m} size="sm" />}
                        <p className="text-xs text-muted-foreground">{m?.name || 'Alguien'}</p>
                        {t.points > 0 && <span className="text-[10px] font-bold text-amber-600">+{t.points} pts</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                      {item.dateObj.toLocaleDateString()}
                    </span>
                  </div>
                )
              }
              if (item.type === 'event') {
                const e = item.data as CalendarEvent
                const m = e.assignedToMemberId ? getMemberById(e.assignedToMemberId) : null
                return (
                  <div key={`event-${e.id}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3 border border-border/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-600">
                      <CalendarPlus className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{e.date} {e.time}</span>
                        {m && <span>· {m.name}</span>}
                      </div>
                    </div>
                  </div>
                )
              }
              if (item.type === 'reminder') {
                const r = item.data as Reminder
                return (
                  <div key={`rem-${r.id}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3 border border-border/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-600">
                      <Bell className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Expiró el {r.dueDate}</p>
                    </div>
                  </div>
                )
              }
              return null
            })
          )}
        </div>
      </div>
    </div>
  )
}
