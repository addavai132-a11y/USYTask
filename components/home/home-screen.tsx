'use client'

import { useState } from 'react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { ScreenHeader } from '@/components/shared/screen-header'
import { MonthNavigator } from './month-navigator'
import { FinancesSummary } from './finances-summary'
import { IncomesSection } from './incomes-section'
import { ExpensesSection } from './expenses-section'
import { BillsSection } from './bills-section'
import { BudgetsSection } from './budgets-section'

type Section = 'resumen' | 'ingresos' | 'gastos' | 'facturas' | 'presupuestos'

export function HomeScreen() {
  const [section, setSection] = useState<Section>('resumen')

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      {/* ── CABECERA CENTRALIZADA Y LIMPIA ── */}
      <ScreenHeader
        title="Hogar"
        subtitle="Finanzas integrales, nóminas, facturas y productividad del hogar"
        centered
      />

      {/* ── NAVEGADOR DE MES CENTRADO ── */}
      <div className="w-full max-w-xl mx-auto">
        <MonthNavigator />
      </div>

      {/* ── BARRA DE PESTAÑAS COMPACTA Y AUTOAJUSTADA (w-fit mx-auto) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<Section>
          value={section}
          onChange={setSection}
          showScrollArrows={false}
          tabs={[
            { id: 'resumen', label: 'Resumen' },
            { id: 'ingresos', label: 'Ingresos / Nóminas' },
            { id: 'gastos', label: 'Gastos' },
            { id: 'facturas', label: 'Facturas / Suscripciones' },
            { id: 'presupuestos', label: 'Presupuestos' },
          ]}
        />
      </div>

      {/* ── CONTENIDO DE LA SECCIÓN ACTIVA ── */}
      <div className="w-full transition-all duration-200">
        {section === 'resumen' && <FinancesSummary />}
        {section === 'ingresos' && <IncomesSection />}
        {section === 'gastos' && <ExpensesSection />}
        {section === 'facturas' && <BillsSection />}
        {section === 'presupuestos' && <BudgetsSection />}
      </div>
    </div>
  )
}
