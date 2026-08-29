'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Scale, Plus, Zap, Droplets, Flame, Fuel } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { useApp } from '@/components/app/app-context'
import {
  type UtilityType,
  formatCurrency,
  formatMonthLabel,
  getPreviousMonthISO,
} from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const UTILITIES_META: Record<
  UtilityType,
  { label: string; unit: string; icon: any }
> = {
  electricidad: { label: 'Electricidad', unit: 'kWh', icon: Zap },
  agua: { label: 'Agua', unit: 'm³', icon: Droplets },
  gas: { label: 'Gas', unit: 'kWh', icon: Flame },
  combustible: { label: 'Combustible', unit: 'L', icon: Fuel },
  otro: { label: 'Otros suministros', unit: 'ud', icon: Scale },
}

export function ConsumptionComparison({ onOpenAddBill }: { onOpenAddBill?: () => void }) {
  const { bills, expenses, selectedMonthISO } = useApp()

  const [activeUtility, setActiveUtility] = useState<UtilityType>('electricidad')

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

  // Helper to extract data for a specific utility in a given month
  const getUtilityDataForMonth = (utilType: UtilityType, monthISO: string) => {
    const matchingBills = bills.filter((b) => {
      const name = b.name.toLowerCase()
      return (
        b.consumption?.utilityType === utilType ||
        (utilType === 'electricidad' && (name.includes('luz') || name.includes('endesa') || name.includes('iberdrola') || name.includes('elec'))) ||
        (utilType === 'agua' && (name.includes('agua') || name.includes('aqualia') || name.includes('canal'))) ||
        (utilType === 'gas' && (name.includes('gas') || name.includes('naturgy') || name.includes('butano'))) ||
        (utilType === 'combustible' && (name.includes('gasolina') || name.includes('diésel') || name.includes('combustible') || name.includes('repsol')))
      )
    })

    const matchingExpenses = expenses.filter((e) => {
      if (e.date && !e.date.startsWith(monthISO) && !e.isRecurring) return false
      const title = e.title.toLowerCase()
      return (
        e.consumption?.utilityType === utilType ||
        (utilType === 'combustible' && (title.includes('gasolina') || title.includes('repostaje') || title.includes('diésel') || title.includes('repsol') || title.includes('cepsa'))) ||
        (utilType === 'electricidad' && title.includes('luz')) ||
        (utilType === 'agua' && title.includes('agua')) ||
        (utilType === 'gas' && title.includes('gas'))
      )
    })

    let totalAmount = 0
    let totalUnits = 0
    let count = 0

    matchingBills.forEach((b) => {
      const amt = Number(b.amount) || 0
      totalAmount += b.billingCycle === 'mensual' ? amt : amt / 12
      if (b.consumption?.consumptionValue) {
        totalUnits += Number(b.consumption.consumptionValue) || 0
      }
      count++
    })

    matchingExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0
      totalAmount += amt
      if (e.consumption?.consumptionValue) {
        totalUnits += Number(e.consumption.consumptionValue) || 0
      }
      count++
    })

    const unitPrice = totalUnits > 0 ? totalAmount / totalUnits : 0

    return {
      amount: totalAmount,
      units: totalUnits,
      unitPrice,
      count,
    }
  }

  const dataA = useMemo(() => getUtilityDataForMonth(activeUtility, monthA), [activeUtility, monthA, bills, expenses])
  const dataB = useMemo(() => getUtilityDataForMonth(activeUtility, monthB), [activeUtility, monthB, bills, expenses])

  const meta = UTILITIES_META[activeUtility]

  const amountDiff = dataA.amount - dataB.amount
  const amountDiffPercent = dataB.amount > 0 ? ((dataA.amount - dataB.amount) / dataB.amount) * 100 : 0

  const unitsDiff = dataA.units - dataB.units
  const unitsDiffPercent = dataB.units > 0 ? ((dataA.units - dataB.units) / dataB.units) * 100 : 0

  const unitPriceDiff = dataA.unitPrice - dataB.unitPrice
  const unitPriceDiffPercent = dataB.unitPrice > 0 ? ((dataA.unitPrice - dataB.unitPrice) / dataB.unitPrice) * 100 : 0

  const utilityKeys: UtilityType[] = ['electricidad', 'agua', 'gas', 'combustible']

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── SELECTOR DE SUMINISTRO ── */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto no-scrollbar shadow-sm">
        {utilityKeys.map((uKey) => {
          const uMeta = UTILITIES_META[uKey]
          const Icon = uMeta.icon
          const isActive = activeUtility === uKey
          return (
            <button
              key={uKey}
              onClick={() => setActiveUtility(uKey)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all shrink-0',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              )}
            >
              <Icon className="size-3.5" />
              <span>{uMeta.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── SELECTOR DE MESES A COMPARAR ── */}
      <Card className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-3 relative z-20">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Comparativa de {meta.label}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gasto total, unidades consumidas y precio por {meta.unit}</p>
          </div>

          {onOpenAddBill && (
            <button
              type="button"
              onClick={onOpenAddBill}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Añadir factura</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="size-3 text-emerald-600 dark:text-purple-400" />
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
              <Scale className="size-3 text-emerald-600 dark:text-purple-400" />
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

      {/* ── 3 TARJETAS COMPARATIVAS COMPACTAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {/* 1. Importe Total */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Importe Facturado
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatCurrency(dataA.amount)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {formatCurrency(dataB.amount)} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold w-fit bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
            {amountDiff > 0 ? <TrendingUp className="size-3 text-rose-500" /> : <TrendingDown className="size-3 text-emerald-500" />}
            <span>
              {amountDiff > 0 ? '+' : ''}{amountDiffPercent.toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* 2. Consumo Real */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Consumo ({meta.unit})
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {dataA.units.toLocaleString('es-ES')} {meta.unit}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {dataB.units.toLocaleString('es-ES')} {meta.unit} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold w-fit bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
            {unitsDiff > 0 ? <TrendingUp className="size-3 text-rose-500" /> : <TrendingDown className="size-3 text-emerald-500" />}
            <span>
              {unitsDiff > 0 ? '+' : ''}{unitsDiffPercent.toFixed(1)}%
            </span>
          </div>
        </Card>

        {/* 3. Precio Unitario */}
        <Card className="p-3.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col justify-between gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Precio / {meta.unit}
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {dataA.unitPrice.toFixed(3)} €
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              vs {dataB.unitPrice.toFixed(3)} € ({formatMonthLabel(monthB)})
            </p>
          </div>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold w-fit bg-slate-100 dark:bg-white/[0.05] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
            {unitPriceDiff > 0 ? <TrendingUp className="size-3 text-rose-500" /> : <TrendingDown className="size-3 text-emerald-500" />}
            <span>
              {unitPriceDiff > 0 ? '+' : ''}{unitPriceDiffPercent.toFixed(1)}%
            </span>
          </div>
        </Card>
      </div>
    </div>
  )
}
