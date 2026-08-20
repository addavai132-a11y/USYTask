'use client'

import { useState } from 'react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { CalendarSection } from './calendar-section'
import { TasksSection } from './tasks-section'
import { ShoppingSection } from './shopping-section'
import { MealsSection } from './meals-section'
import { PlansSection } from './plans-section'

type Section = 'calendario' | 'tareas' | 'compras' | 'comidas' | 'planes'

export function OrganizeScreen() {
  const [section, setSection] = useState<Section>('calendario')

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Organizar</h1>
        <p className="text-sm text-muted-foreground">El día a día, en orden</p>
      </header>

      <PillTabs<Section>
        className="mb-5"
        value={section}
        onChange={setSection}
        tabs={[
          { id: 'calendario', label: 'Calendario' },
          { id: 'tareas', label: 'Tareas' },
          { id: 'compras', label: 'Compras' },
          { id: 'comidas', label: 'Comidas' },
          { id: 'planes', label: 'Planes' },
        ]}
      />

      {section === 'calendario' && <CalendarSection />}
      {section === 'tareas' && <TasksSection />}
      {section === 'compras' && <ShoppingSection />}
      {section === 'comidas' && <MealsSection />}
      {section === 'planes' && <PlansSection />}
    </div>
  )
}
