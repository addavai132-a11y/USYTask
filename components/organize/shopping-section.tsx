'use client'

import { useMemo, useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { shoppingLists, getMember, type ShoppingCategory } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'

export function ShoppingSection() {
  const { toast } = useToast()
  const [activeId, setActiveId] = useState(shoppingLists[0].id)
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(shoppingLists.flatMap((l) => l.items.filter((i) => i.done).map((i) => [i.id, true]))),
  )
  const [draft, setDraft] = useState('')
  const [extra, setExtra] = useState<Record<string, { id: string; name: string; addedBy: 'marcos' }[]>>({})

  const active = shoppingLists.find((l) => l.id === activeId)!
  const items = [...active.items, ...(extra[active.id] ?? []).map((e) => ({ ...e, category: 'otros' as ShoppingCategory, done: false }))]

  const grouped = useMemo(() => {
    const map = new Map<ShoppingCategory, typeof items>()
    for (const it of items) {
      const arr = map.get(it.category) ?? []
      arr.push(it)
      map.set(it.category, arr)
    }
    return [...map.entries()]
  }, [items])

  const pending = items.filter((i) => !checked[i.id]).length

  function add() {
    const name = draft.trim()
    if (!name) return
    setExtra((p) => ({ ...p, [active.id]: [...(p[active.id] ?? []), { id: `x-${Date.now()}`, name, addedBy: 'marcos' }] }))
    setDraft('')
    toast(`"${name}" añadido`, '🛒')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {shoppingLists.map((l) => {
          const count = l.items.filter((i) => !checked[i.id]).length + (extra[l.id]?.length ?? 0)
          return (
            <button
              key={l.id}
              onClick={() => setActiveId(l.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all active:scale-95',
                l.id === activeId ? 'bg-foreground text-background shadow-soft' : 'bg-secondary text-secondary-foreground',
              )}
            >
              <span aria-hidden="true">{l.emoji}</span>
              {l.name}
              {count > 0 && (
                <span className={cn('rounded-full px-1.5 text-[11px]', l.id === activeId ? 'bg-background/20' : 'bg-background/70')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-card p-2 shadow-soft ring-1 ring-border/60">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) add()
          }}
          placeholder={`Añadir a ${active.name}…`}
          className="flex-1 bg-transparent px-2 text-sm font-medium outline-none placeholder:text-muted-foreground"
        />
        <button onClick={add} aria-label="Añadir artículo" className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-90">
          <Plus className="size-5" />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState emoji="🧺" title={`${active.name} está vacía. Añade tu primer artículo.`} />
      ) : (
        <>
          <p className="px-1 text-xs font-semibold text-muted-foreground">
            {pending === 0 ? '¡Todo comprado!' : `${pending} pendientes`}
          </p>
          <div className="flex flex-col gap-3">
            {grouped.map(([cat, catItems]) => (
              <Card key={cat}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat}</p>
                <div className="flex flex-col divide-y divide-border/60">
                  {catItems.map((it) => {
                    const on = !!checked[it.id]
                    const m = getMember(it.addedBy)
                    return (
                      <button
                        key={it.id}
                        onClick={() => setChecked((p) => ({ ...p, [it.id]: !p[it.id] }))}
                        className="flex items-center gap-3 py-2 text-left"
                      >
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                            on ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                          )}
                        >
                          <Check className={cn('size-3.5 transition-transform', on ? 'scale-100' : 'scale-0')} strokeWidth={3} />
                        </span>
                        <span className={cn('flex-1 text-sm font-medium', on && 'text-muted-foreground line-through')}>{it.name}</span>
                        <MemberAvatar member={m} size="sm" />
                      </button>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
