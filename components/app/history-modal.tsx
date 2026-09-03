import { useState } from 'react'
import { X, CheckCircle2, CalendarPlus, Bell, Trophy, Receipt, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'
import { useApp } from './app-context'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import type { Task, CalendarEvent, Reminder, FamilyChallenge, ShoppingReceipt } from '@/types'

// Helper to sort mixed items
type HistoryItem = 
  | { type: 'task'; data: Task; dateObj: Date }
  | { type: 'event'; data: CalendarEvent; dateObj: Date }
  | { type: 'reminder'; data: Reminder; dateObj: Date }
  | { type: 'challenge'; data: FamilyChallenge; dateObj: Date }
  | { type: 'receipt'; data: ShoppingReceipt; dateObj: Date }

export function HistoryModal() {
  const {
    historyOpen,
    closeHistory,
    archivedTasks,
    archivedEvents,
    archivedReminders,
    archivedFamilyChallenges,
    shoppingReceipts,
    getMemberById,
  } = useApp()

  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null)

  if (!historyOpen) return null

  // Combine and sort
  const items: HistoryItem[] = [
    ...archivedTasks.map((t): HistoryItem => ({ type: 'task', data: t, dateObj: new Date(t.completedAt || 0) })),
    ...archivedEvents.map((e): HistoryItem => ({ type: 'event', data: e, dateObj: new Date(`${e.date}T${e.time || '12:00'}`) })),
    ...archivedReminders.map((r): HistoryItem => ({ type: 'reminder', data: r, dateObj: new Date(`${r.dueDate}T${r.time || '23:59:59'}`) })),
    ...archivedFamilyChallenges.map((c): HistoryItem => ({ type: 'challenge', data: c, dateObj: new Date(c.completedAt || 0) })),
    ...(shoppingReceipts || []).map((rec): HistoryItem => ({ type: 'receipt', data: rec, dateObj: new Date(rec.closedAt) }))
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
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-purple-500/20 dark:text-purple-300">
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
                      <p className="text-xs text-muted-foreground mt-1">Expiró el {r.dueDate}{r.time ? ` a las ${r.time}` : ''}</p>
                    </div>
                  </div>
                )
              }
              if (item.type === 'challenge') {
                const c = item.data as FamilyChallenge
                return (
                  <div key={`chal-${c.id}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-secondary/40 p-3 border border-border/50">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                      <Trophy className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Reto completado ({c.targetDays} días)</span>
                        <span className="text-[10px] font-bold text-amber-600">+{c.rewardPoints} pts</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                      {item.dateObj.toLocaleDateString()}
                    </span>
                  </div>
                )
              }
              if (item.type === 'receipt') {
                const rec = item.data as ShoppingReceipt
                const isExpanded = expandedReceiptId === rec.id
                return (
                  <div key={`receipt-${rec.id}-${idx}`} className="flex flex-col gap-2 rounded-2xl bg-emerald-500/5 dark:bg-white/[0.03] p-3 border border-emerald-500/20 dark:border-white/10">
                    <div
                      onClick={() => setExpandedReceiptId(isExpanded ? null : rec.id)}
                      className="flex items-start gap-3 cursor-pointer select-none"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                        <Receipt className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold truncate text-foreground">Ticket: {rec.listName}</p>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                            {rec.totalItems} {rec.totalItems === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1 text-xs text-muted-foreground">
                          <span>
                            {rec.totalPrice !== undefined
                              ? `Total: ${rec.totalPrice.toFixed(2).replace('.', ',')} €`
                              : 'Compra cerrada'}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                            <span>{isExpanded ? 'Ocultar ticket' : 'Ver ticket'}</span>
                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap pt-0.5">
                        {item.dateObj.toLocaleDateString()}
                      </span>
                    </div>

                    {/* Desglose desplegable del ticket */}
                    {isExpanded && (
                      <div className="mt-1 pt-2 border-t border-emerald-500/10 dark:border-white/5 space-y-1 animate-fade-in">
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {rec.items.map((it, itemIdx) => (
                            <div
                              key={`${it.id}-${itemIdx}`}
                              className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card/60 border border-border/40"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {it.quantity && it.quantity > 1 && (
                                  <span className="font-mono text-[10px] font-bold text-emerald-500">
                                    {it.quantity}x
                                  </span>
                                )}
                                <span className="font-medium text-foreground truncate">{it.name}</span>
                                {it.supermarket && (
                                  <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                    {it.supermarket}
                                  </span>
                                )}
                              </div>
                              {it.price !== undefined && (
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0 ml-2">
                                  {Number(it.price).toFixed(2).replace('.', ',')} €
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
