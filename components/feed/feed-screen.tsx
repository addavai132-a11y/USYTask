'use client'

import { useState } from 'react'
import {
  Calendar,
  ShoppingCart,
  AlertTriangle,
  Wallet,
  Gift,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import {
  events,
  tasks,
  shoppingLists,
  reminders,
  expenses,
  weeklyExpense,
  challenges,
  getMember,
} from '@/lib/mock-data'
import { Card, CardHeader } from '@/components/ui/card'
import { EventRow } from '@/components/shared/event-row'
import { TaskRow } from '@/components/shared/task-row'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { FeedHeader } from './feed-header'
import { ActivityFeed } from './activity-feed'
import { useApp } from '@/components/app/app-context'
import { useToast } from '@/components/ui/toast'

export function FeedScreen() {
  const { setTab, bump } = useApp()
  const { toast } = useToast()
  const todayEvents = events.filter((e) => e.dayOffset === 0)
  const pendingTasks = tasks.filter((t) => !t.done).slice(0, 3)
  const mercadona = shoppingLists[0]
  const pendingProducts = mercadona.items.filter((i) => !i.done)
  const challenge = challenges[0]
  const medals = ['🥇', '🥈', '🥉']

  const [done, setDone] = useState<Record<string, boolean>>({})
  const toggle = (id: string, title: string, points?: number) => {
    setDone((d) => {
      const next = !d[id]
      if (next) toast(points ? `¡+${points} ⭐ por "${title}"!` : `"${title}" completada`, '🎉')
      return { ...d, [id]: next }
    })
    bump()
  }

  return (
    <div className="flex flex-col gap-4">
      <FeedHeader />

      {/* Hoy */}
      <Card variant="emerald">
        <CardHeader
          title="Hoy"
          action="Ver calendario"
          onAction={() => setTab('organizar')}
          icon={<Calendar className="size-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <div className="flex flex-col divide-y divide-border/60">
          {todayEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      </Card>

      {/* Tareas pendientes */}
      <Card variant="mint">
        <CardHeader title="Tareas pendientes" action="Ver todas" onAction={() => setTab('organizar')} />
        <div className="flex flex-col gap-1">
          {pendingTasks.map((t) => (
            <TaskRow key={t.id} task={t} checked={!!done[t.id]} onToggle={() => toggle(t.id, t.title, t.points)} />
          ))}
        </div>
      </Card>

      {/* Lista de la compra */}
      <Card variant="orange">
        <button className="flex w-full items-center gap-3 text-left" onClick={() => setTab('organizar')}>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/20 text-xl">🛒</span>
          <div className="flex-1">
            <p className="font-bold">{mercadona.name}</p>
            <p className="text-xs text-muted-foreground">{pendingProducts.length} productos pendientes</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
        <div className="mt-3 flex flex-wrap gap-2">
          {pendingProducts.slice(0, 4).map((p) => (
            <span key={p.id} className="rounded-full bg-orange-500/15 border border-orange-500/25 px-3 py-1 text-xs font-bold text-orange-800 dark:text-orange-300">
              {p.name}
            </span>
          ))}
          {pendingProducts.length > 4 && (
            <span className="rounded-full bg-orange-500/15 border border-orange-500/25 px-3 py-1 text-xs font-bold text-muted-foreground">
              +{pendingProducts.length - 4}
            </span>
          )}
        </div>
      </Card>

      {/* No olvidéis */}
      <Card variant="rose">
        <CardHeader title="No olvidéis" icon={<AlertTriangle className="size-5 text-rose-500" />} />
        <ul className="flex flex-col gap-2.5">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 font-medium">{r.title}</span>
              <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-700 dark:text-rose-300">
                {r.daysLeft > 6 ? `${r.daysLeft} días` : r.daysLeft <= 1 ? 'Muy pronto' : `en ${r.daysLeft} días`}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Gastos */}
      <Card variant="yellow">
        <CardHeader
          title="Gastos"
          action="Ver más"
          onAction={() => setTab('hogar')}
          icon={<Wallet className="size-5 text-yellow-700 dark:text-yellow-400" />}
        />
        <div className="mb-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Gasto esta semana</p>
          <p className="text-2xl font-black">{weeklyExpense} €</p>
        </div>
        <ul className="flex flex-col gap-2">
          {expenses.slice(0, 3).map((x) => (
            <li key={x.id} className="flex items-center gap-3">
              <MemberAvatar member={getMember(x.member)} size="sm" />
              <span className="flex-1 text-sm font-medium">{x.title}</span>
              <span className="text-sm font-bold tabular-nums">{x.amount.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Próximamente */}
      <Card variant="sky">
        <CardHeader title="Próximamente" icon={<Gift className="size-5 text-sky-600 dark:text-sky-400" />} />
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl">🎂</span>
          <div className="flex-1">
            <p className="font-bold">Cumpleaños de la abuela</p>
            <p className="text-xs text-muted-foreground">Dentro de 8 días · 3 ideas de regalo guardadas</p>
          </div>
        </div>
      </Card>

      {/* Reto familiar */}
      <Card variant="violet">
        <CardHeader
          title="Reto familiar"
          action="Ver retos"
          onAction={() => setTab('familia')}
          icon={<Trophy className="size-5 text-purple-600 dark:text-purple-400" />}
        />
        <p className="mb-3 text-sm font-semibold">
          {challenge.emoji} {challenge.title} · quedan {challenge.daysLeft} días
        </p>
        <ol className="flex flex-col gap-2">
          {challenge.leaderboard.map((row, i) => {
            const m = getMember(row.member)
            return (
              <li key={row.member} className="flex items-center gap-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-500/20 px-3 py-2">
                <span className="text-lg" aria-hidden="true">{medals[i]}</span>
                <MemberAvatar member={m} size="sm" />
                <span className="flex-1 text-sm font-semibold">{m.name}</span>
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{row.points} pts</span>
              </li>
            )
          })}
        </ol>
      </Card>

      <ActivityFeed />
    </div>
  )
}
