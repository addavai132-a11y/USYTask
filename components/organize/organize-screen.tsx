'use client'

import { useState } from 'react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { ScreenHeader } from '@/components/shared/screen-header'
import { CalendarSection } from './calendar-section'
import { TasksSection } from './tasks-section'
import { ShoppingSection } from './shopping-section'
import { MealsSection } from './meals-section'
import { HistorySection } from './history-section'

export type OrganizeSection =
  | 'calendario'
  | 'tareas'
  | 'compras'
  | 'comidas'
  | 'historial'

export function OrganizeScreen() {
  const [section, setSection] = useState<OrganizeSection>('calendario')

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      <ScreenHeader
        title="Centro de Control"
        subtitle="Organización integral, calendario multimodal y productividad del hogar"
        centered
      />

      {/* ── NAVEGACIÓN PRINCIPAL DE LA SUITE (5 Pestañas Autoajustadas Centradas) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<OrganizeSection>
          value={section}
          onChange={setSection}
          showScrollArrows={false}
          tabs={[
            { id: 'calendario', label: 'Calendario' },
            { id: 'tareas', label: 'Actividades' },
            { id: 'compras', label: 'Compras' },
            { id: 'comidas', label: 'Comidas' },
            { id: 'historial', label: 'Historial' },
          ]}
        />
      </div>

      {/* ── CONTENIDO DIRECTO DE LA SECCIÓN ACTIVA ── */}
      <div className="w-full transition-all duration-200">
        {section === 'calendario' && <CalendarSection />}
        {section === 'tareas' && <TasksSection memberFilter="all" searchQuery="" />}
        {section === 'compras' && <ShoppingSection memberFilter="all" searchQuery="" />}
        {section === 'comidas' && <MealsSection />}
        {section === 'historial' && <HistorySection memberFilter="all" searchQuery="" />}
      </div>
    </div>
  )
}
