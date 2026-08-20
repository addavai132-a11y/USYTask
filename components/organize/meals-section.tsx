'use client'

import { useState } from 'react'
import { ShoppingCart, Sun, Utensils, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { meals, weekDays, type Meal } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

const shortDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const slots: { key: keyof Meal; label: string; icon: typeof Sun }[] = [
  { key: 'breakfast', label: 'Desayuno', icon: Sun },
  { key: 'lunch', label: 'Comida', icon: Utensils },
  { key: 'dinner', label: 'Cena', icon: Moon },
]

export function MealsSection() {
  const { toast } = useToast()
  const todayIdx = (new Date().getDay() + 6) % 7
  const [day, setDay] = useState(todayIdx)
  const dayName = weekDays[day]
  const meal = meals[dayName]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d, i) => (
          <button
            key={d}
            onClick={() => setDay(i)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all active:scale-95',
              i === day ? 'bg-foreground text-background shadow-soft' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <span>{shortDays[i]}</span>
            {i === todayIdx && <span className={cn('size-1.5 rounded-full', i === day ? 'bg-background' : 'bg-primary')} />}
          </button>
        ))}
      </div>

      <p className="px-1 text-sm font-bold">{dayName}</p>

      <div className="flex flex-col gap-3">
        {slots.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="truncate font-semibold">{meal[key]}</p>
            </div>
            <button
              onClick={() => toast('Editar comida', '🍽')}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground active:scale-95"
            >
              Editar
            </button>
          </Card>
        ))}
      </div>

      <button
        onClick={() => toast('Ingredientes añadidos a la lista', '🛒')}
        className="flex items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 font-semibold text-accent-foreground transition-transform active:scale-[0.98]"
      >
        <ShoppingCart className="size-5" />
        Generar lista de la compra
      </button>
    </div>
  )
}
