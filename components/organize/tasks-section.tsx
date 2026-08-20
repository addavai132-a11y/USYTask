'use client'

import { useMemo, useState } from 'react'
import { Plus, RotateCw, Clock } from 'lucide-react'
import { tasks as seed, members, getMember, type Task, type TaskSection } from '@/lib/mock-data'
import { TaskRow } from '@/components/shared/task-row'
import { Card } from '@/components/ui/card'
import { PillTabs } from '@/components/ui/pill-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'

const sectionTabs: { id: TaskSection; label: string }[] = [
  { id: 'mias', label: 'Mías' },
  { id: 'familia', label: 'Familia' },
  { id: 'casa', label: 'Casa' },
  { id: 'hijos', label: 'Hijos' },
  { id: 'recurrentes', label: 'Recurrentes' },
]

export function TasksSection() {
  const { toast } = useToast()
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(seed.filter((t) => t.done).map((t) => [t.id, true])),
  )
  const [tab, setTab] = useState<TaskSection>('familia')

  function toggle(t: Task) {
    setChecked((prev) => {
      const next = { ...prev, [t.id]: !prev[t.id] }
      if (next[t.id] && t.points) toast(`¡+${t.points} puntos!`, '⭐')
      return next
    })
  }

  const list = useMemo(() => {
    if (tab === 'recurrentes') return seed.filter((t) => t.recurring)
    return seed.filter((t) => t.section === tab)
  }, [tab])

  const doneCount = seed.filter((t) => checked[t.id]).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between bg-primary text-primary-foreground">
        <div>
          <p className="text-3xl font-extrabold tabular-nums">{doneCount}</p>
          <p className="text-sm opacity-90">tareas completadas</p>
        </div>
        <div className="flex -space-x-2">
          {members.map((m) => (
            <MemberAvatar key={m.id} member={m} size="sm" ring />
          ))}
        </div>
      </Card>

      <PillTabs<TaskSection> tabs={sectionTabs} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState emoji="✅" title="No hay tareas en esta sección." action="Añadir tarea" onAction={() => toast('Añade una tarea con el botón +', '➕')} />
      ) : (
        <Card>
          <div className="flex flex-col divide-y divide-border/60">
            {list.map((t) => (
              <div key={t.id} className="py-1.5 first:pt-0 last:pb-0">
                <TaskRow task={t} checked={!!checked[t.id]} onToggle={() => toggle(t)} />
                {(t.recurring || t.needsApproval) && (
                  <div className="ml-10 mt-1 flex flex-wrap gap-2">
                    {t.recurring && (
                      <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                        <RotateCw className="size-3" /> {t.recurring}
                      </span>
                    )}
                    {t.needsApproval && (
                      <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                        <Clock className="size-3" /> Requiere aprobación
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <button
        onClick={() => toast('Nueva tarea creada', '➕')}
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors active:bg-secondary"
      >
        <Plus className="size-4" /> Nueva tarea
      </button>
    </div>
  )
}
