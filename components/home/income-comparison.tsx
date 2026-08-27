'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Scale, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { useApp } from '@/components/app/app-context'
import { formatCurrency, formatMonthLabel, getPreviousMonthISO, type IncomeCategory } from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export function IncomeComparison({ onOpenAddIncome }: { onOpenAddIncome?: () => void }) {
  const { incomes, selectedMonthISO } = useApp()

  // Available months for comparison (past 12 months)
  const monthOptions = useMemo(() => {
    const list: { value: string; label: string }[] = []
    let curr = getTodayISO().slice(0, 7)
    for (let i = 0; i < 12; i++) {
      list.push({
        value: curr,
        label: formatMonthLabel(curr),
      })
      curr = getPreviousMonthISO(curr)
    }
    return list
  }, [])

  const defaultMonthA = selectedMonthISO || monthOptions[0]?.value || '2026-08'
  const defaultMonthB = getPreviousMonthISO(defaultMonthA)

  const [monthA, setMonthA] = useState<string>(defaultMonthA)
  const [monthB, setMonthB] = useState<string>(defaultMonthB)

  // Helper to extract incomes data for a specific month
  const getIncomeDataForMonth = (monthISO: string) => {
    const monthlyList = incomes.filter((inc) => {
      if (inc.frequency === 'mensual') return true
      if (inc.frequency === 'quincenal') return true
      if (inc.frequency === 'puntual' && inc.date && inc.date.startsWith(monthISO)) return true
      return false
    })

    const byCategory: Record<IncomeCategory, number> = {
      nómina: 0,
      inversiones: 0,
      alquiler: 0,
      otros: 0,
    }

    let total = 0

    monthlyList.forEach((inc) => {
      let multiplier = 1
      if (inc.frequency === 'quincenal') multiplier = 2

      const val = inc.amount * multiplier
      total += val
      byCategory[inc.category] = (byCategory[inc.category] || 0) + val
    })

    return { total, byCategory, count: monthlyList.length }
  }

  const dataA = useMemo(() => getIncomeDataForMonth(monthA), [incomes, monthA])
  const dataB = useMemo(() => getIncomeDataForMonth(monthB), [incomes, monthB])

  const totalDiff = dataA.total - dataB.total
  const totalDiffPercent = dataB.total > 0 ? (totalDiff / dataB.total) * 100 : 0

  const categories: { key: IncomeCategory; label: string }[] = [
    { key: 'nómina', label: 'Nómina Principal' },
    { key: 'inversiones', label: 'Inversiones / Dividendos' },
    { key: 'alquiler', label: 'Alquileres Cobrados' },
    { key: 'otros', label: 'Otros / Extras' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── SELECTOR DE PERIODOS A COMPARAR ── */}
      <Card className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparativa de Ingresos</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analiza la evolución entre dos periodos</p>
          </div>

          {onOpenAddIncome && (
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Ingreso</span>
            </button>
          )}
        </div>

        {/* Dropdowns de Mes A y Mes B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="size-3 text-purple-600 dark:text-purple-400" />
              <span>Periodo Principal (A):</span>
            </label>
            <CustomSelect<string>
              value={monthA}
              onChange={setMonthA}
              options={monthOptions}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Scale className="size-3 text-purple-600 dark:text-purple-400" />
              <span>Comparar con (B):</span>
            </label>
            <CustomSelect<string>
              value={monthB}
              onChange={setMonthB}
              options={monthOptions}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* ── 3 TARJETAS DE COMPARACIÓN COMPACTAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Total Ingresos */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ingreso Total (A)
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(dataA.total)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {formatCurrency(dataB.total)} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold w-fit bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            {totalDiff >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            <span>
              {totalDiff >= 0 ? '+' : ''}{totalDiffPercent.toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* 2. Nóminas fijas */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Nómina Principal
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(dataA.byCategory.nómina)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {formatCurrency(dataB.byCategory.nómina)} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Diferencia: {formatCurrency(dataA.byCategory.nómina - dataB.byCategory.nómina)}
          </span>
        </Card>

        {/* 3. Fuentes secundarias */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Otros Ingresos
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(dataA.total - dataA.byCategory.nómina)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {formatCurrency(dataB.total - dataB.byCategory.nómina)} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Diferencia: {formatCurrency((dataA.total - dataA.byCategory.nómina) - (dataB.total - dataB.byCategory.nómina))}
          </span>
        </Card>
      </div>

      {/* ── DESGLOSE POR CATEGORÍAS ── */}
      <Card className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          Desglose por Categorías
        </h4>

        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const valA = dataA.byCategory[cat.key] || 0
            const valB = dataB.byCategory[cat.key] || 0
            const diff = valA - valB

            return (
              <div
                key={cat.key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{cat.label}</p>
                  <p className="text-[10px] text-slate-400">
                    A: {formatCurrency(valA)} · B: {formatCurrency(valB)}
                  </p>
                </div>

                <div className="text-right">
                  <span className={cn('font-bold tabular-nums', diff > 0 ? 'text-purple-700 dark:text-purple-300' : diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
