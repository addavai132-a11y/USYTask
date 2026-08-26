'use client'

import { useState } from 'react'
import { Card, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useApp } from '@/components/app/app-context'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { CheckCircle2, CalendarPlus, Bell, PlusCircle, X } from 'lucide-react'

// Helper to format relative time
function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} d`
}

export function ActivityFeed({ compact = false }: { compact?: boolean }) {
  const { activities, getMemberById } = useApp()
  const [isExpanded, setIsExpanded] = useState(false)

  const displayActivities = compact ? activities.slice(0, 5) : activities

  const renderFeed = (acts = displayActivities, isModal = false) => (
    <div className={`flex flex-col gap-4 py-2 relative ${isModal ? 'px-2' : ''}`}>
      {/* Vertical timeline line */}
      <div className="absolute left-[33px] top-4 bottom-4 w-px bg-border/60 z-0" />

      {acts.map((act) => {
        const member = getMemberById(act.memberId)
        let icon = null
        let iconColor = ''
        let verb = ''

        switch (act.type) {
          case 'task_created':
            icon = <PlusCircle className="size-3.5 text-white" />
            iconColor = 'bg-sky-500'
            verb = 'ha creado la tarea'
            break
          case 'event_created':
            icon = <CalendarPlus className="size-3.5 text-white" />
            iconColor = 'bg-purple-500'
            verb = 'ha añadido un evento'
            break
          case 'reminder_created':
            icon = <Bell className="size-3.5 text-white" />
            iconColor = 'bg-rose-500'
            verb = 'ha creado un recordatorio'
            break
          case 'task_completed':
            icon = <CheckCircle2 className="size-3.5 text-white" />
            iconColor = 'bg-emerald-500'
            verb = 'ha completado la tarea'
            break
        }

        return (
          <div key={act.id} className="flex gap-4 relative z-10 px-2 group">
            <div className="relative shrink-0 mt-0.5">
              {member ? (
                <MemberAvatar member={member} size={compact && !isModal ? 'sm' : 'md'} ring />
              ) : (
                <div className={`rounded-full bg-secondary ${compact && !isModal ? 'size-8' : 'size-11'}`} />
              )}
              <div
                className={`absolute -bottom-1 -right-1 flex ${compact && !isModal ? 'size-4' : 'size-5'} items-center justify-center rounded-full border-2 border-card ${iconColor} shadow-sm`}
              >
                {icon}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <p className={`${compact && !isModal ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground leading-tight`}>
                <strong className="text-foreground font-bold">{member?.name || 'Alguien'}</strong> {verb}
              </p>
              
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className={`${compact && !isModal ? 'text-xs' : 'text-sm'} font-black truncate text-foreground`}>
                  {act.title}
                </p>
                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0 bg-secondary/50 px-2 py-0.5 rounded-full">
                  {timeAgo(act.timestamp)}
                </span>
              </div>

              {act.details && act.type !== 'task_completed' && (
                <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                  {act.details}
                </p>
              )}
              {act.type === 'task_completed' && act.points && (
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 bg-amber-500/10 w-fit px-2 py-0.5 rounded-md border border-amber-500/20">
                  🎉 +{act.points} pts
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <Card className="flex flex-col gap-0">
        <CardHeader 
          title="Actividad reciente" 
          action={compact && activities.length > 5 ? 'Ver todo' : undefined}
          onAction={() => setIsExpanded(true)}
        />
        {activities.length === 0 ? (
          <div className="pb-4 pt-2">
            <EmptyState emoji="📋" title="Aún no hay actividad reciente en este grupo" />
          </div>
        ) : (
          renderFeed(displayActivities, false)
        )}
      </Card>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-250 flex flex-col h-[85vh] sm:h-[70vh]">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted sm:hidden shrink-0" />
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60 shrink-0">
              <div>
                <h2 className="text-xl font-black tracking-tight">Actividad completa</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Timeline de acciones en este grupo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {renderFeed(activities, true)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
