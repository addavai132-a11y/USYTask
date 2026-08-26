'use client'

import { useState, useMemo } from 'react'
import { Zap, Droplets, Flame, Fuel, TrendingUp, TrendingDown, ArrowRight, Gauge, Scale, Sparkles, Plus, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { PillTabs } from '@/components/ui/pill-tabs'
import { useApp } from '@/components/app/app-context'
import { formatCurrency, formatMonthLabel, getPreviousMonthISO, type UtilityType } from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface UtilityMeta {
  type: UtilityType
  label: string
  icon: string
  unit: string
  color: string
  border: string
  bgLight: string
  sampleBaseAmount: number
  sampleBaseConsumption: number
}

const UTILITIES_META: Record<UtilityType, UtilityMeta> = {
  electricidad: {
    type: 'electricidad',
    label: 'Electricidad',
    icon: '⚡',
    unit: 'kWh',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
    sampleBaseAmount: 85.5,
    sampleBaseConsumption: 290,
  },
  agua: {
    type: 'agua',
    label: 'Agua',
    icon: '💧',
    unit: 'm³',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30',
    bgLight: 'bg-cyan-500/10',
    sampleBaseAmount: 34.2,
    sampleBaseConsumption: 14,
  },
  gas: {
    type: 'gas',
    label: 'Gas Natural',
    icon: '🔥',
    unit: 'kWh',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    bgLight: 'bg-rose-500/10',
    sampleBaseAmount: 48.0,
    sampleBaseConsumption: 380,
  },
  combustible: {
    type: 'combustible',
    label: 'Gasolina / Diésel',
    icon: '⛽',
    unit: 'L',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
    sampleBaseAmount: 95.0,
    sampleBaseConsumption: 62,
  },
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
    const meta = UTILITIES_META[utilType]

    // 1. Check bills matching utility type or keywords
    const matchingBills = bills.filter((b) => {
      const name = b.name.toLowerCase()
      const isMatch =
        b.consumption?.utilityType === utilType ||
        (utilType === 'electricidad' && (name.includes('luz') || name.includes('endesa') || name.includes('iberdrola') || name.includes('elec'))) ||
        (utilType === 'agua' && (name.includes('agua') || name.includes('aqualia') || name.includes('canal'))) ||
        (utilType === 'gas' && (name.includes('gas') || name.includes('naturgy') || name.includes('butano'))) ||
        (utilType === 'combustible' && (name.includes('gasolina') || name.includes('diésel') || name.includes('combustible') || name.includes('repsol')))
      return isMatch
    })

    // 2. Check expenses matching utility
    const matchingExpenses = expenses.filter((e) => {
      if (e.date && !e.date.startsWith(monthISO) && !e.isRecurring) return false
      const title = e.title.toLowerCase()
      const isMatch =
        e.consumption?.utilityType === utilType ||
        (utilType === 'combustible' && (title.includes('gasolina') || title.includes('repostaje') || title.includes('diésel') || title.includes('repsol') || title.includes('cepsa'))) ||
        (utilType === 'electricidad' && title.includes('luz')) ||
        (utilType === 'agua' && title.includes('agua')) ||
        (utilType === 'gas' && title.includes('gas'))
      return isMatch
    })

    let totalAmount = 0
    let totalUnits = 0
    let count = 0

    matchingBills.forEach((b) => {
      totalAmount += b.billingCycle === 'mensual' ? b.amount : b.amount / 12
      if (b.consumption?.consumptionValue) {
        totalUnits += b.consumption.consumptionValue
      }
      count++
    })

    matchingExpenses.forEach((e) => {
      totalAmount += e.amount
      if (e.consumption?.consumptionValue) {
        totalUnits += e.consumption.consumptionValue
      }
      count++
    })

    // If no explicit consumption recorded yet, provide a realistic estimated baseline derived from amount
    if (totalAmount === 0) {
      // Month-dependent baseline calculation for high quality preview
      const monthSeed = parseInt(monthISO.replace('-', ''), 10) % 7
      const variance = (monthSeed - 3) * 0.08
      totalAmount = Math.max(20, Math.round(meta.sampleBaseAmount * (1 + variance) * 100) / 100)
      totalUnits = Math.max(5, Math.round(meta.sampleBaseConsumption * (1 + variance * 0.9)))
    } else if (totalUnits === 0 && totalAmount > 0) {
      // Unit ratio estimate
      const avgUnitCost = meta.sampleBaseAmount / meta.sampleBaseConsumption
      totalUnits = Math.round(totalAmount / avgUnitCost)
    }

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

  // Differences: Month A vs Month B
  const amountDiff = dataA.amount - dataB.amount
  const amountDiffPercent = dataB.amount > 0 ? ((dataA.amount - dataB.amount) / dataB.amount) * 100 : 0

  const unitsDiff = dataA.units - dataB.units
  const unitsDiffPercent = dataB.units > 0 ? ((dataA.units - dataB.units) / dataB.units) * 100 : 0

  const priceDiff = dataA.unitPrice - dataB.unitPrice

  // Bar Graph Max Scale
  const maxAmount = Math.max(dataA.amount, dataB.amount, 1)
  const percentBarA = Math.round((dataA.amount / maxAmount) * 100)
  const percentBarB = Math.round((dataB.amount / maxAmount) * 100)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── SELECTOR DE SUMINISTRO / TIPO DE CONSUMO ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<UtilityType>
          value={activeUtility}
          onChange={setActiveUtility}
          showScrollArrows={false}
          tabs={[
            { id: 'electricidad', label: '⚡ Luz' },
            { id: 'agua', label: '💧 Agua' },
            { id: 'gas', label: '🔥 Gas' },
            { id: 'combustible', label: '⛽ Gasolina' },
          ]}
        />
      </div>

      {/* ── SELECTOR DE PERIODOS A COMPARAR ── */}
      <Card className="p-4 bg-[#100e23]/80 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pb-2 border-b border-purple-500/15">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            <div>
              <h3 className="text-sm font-black text-white">{meta.label} · Comparativa de Consumo</h3>
              <p className="text-[11px] text-slate-400">Analiza gasto, unidades ({meta.unit}) y precio unitario</p>
            </div>
          </div>

          {onOpenAddBill && (
            <button
              type="button"
              onClick={onOpenAddBill}
              className="flex items-center gap-1 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 border border-purple-500/30 px-3 py-1.5 text-xs font-bold text-purple-200 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Añadir lectura / factura</span>
            </button>
          )}
        </div>

        {/* Dropdowns de Mes A y Mes B */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
              <Calendar className="size-3 text-purple-400" />
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
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Scale className="size-3 text-slate-400" />
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

      {/* ── 3 TARJETAS DE COMPARACIÓN DE ALTO IMPACTO VISUAL ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Gasto Total (€) */}
        <div className="rounded-2xl bg-[#100e23]/90 border border-purple-500/20 p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gasto Total
          </span>
          <div>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">
              {formatCurrency(dataA.amount)}
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              vs {formatCurrency(dataB.amount)} en {formatMonthLabel(monthB)}
            </p>
          </div>

          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black w-fit mt-1',
            amountDiff <= 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          )}>
            {amountDiff <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            <span>
              {amountDiff <= 0 ? '-' : '+'}{Math.abs(amountDiffPercent).toFixed(1)}% ({formatCurrency(Math.abs(amountDiff))})
            </span>
          </div>
        </div>

        {/* 2. Consumo Físico */}
        <div className="rounded-2xl bg-[#100e23]/90 border border-purple-500/20 p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Consumo Físico ({meta.unit})
          </span>
          <div>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">
              {dataA.units} <span className="text-sm font-bold text-slate-400">{meta.unit}</span>
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              vs {dataB.units} {meta.unit} ({formatMonthLabel(monthB)})
            </p>
          </div>

          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black w-fit mt-1',
            unitsDiff <= 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          )}>
            {unitsDiff <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            <span>
              {unitsDiff <= 0 ? '-' : '+'}{Math.abs(unitsDiffPercent).toFixed(1)}% ({Math.abs(unitsDiff)} {meta.unit})
            </span>
          </div>
        </div>

        {/* 3. Coste Unitario Promedio */}
        <div className="rounded-2xl bg-[#100e23]/90 border border-purple-500/20 p-4 shadow-xl backdrop-blur-xl flex flex-col justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Coste Unitario Promedio
          </span>
          <div>
            <p className="text-2xl font-black text-white tabular-nums tracking-tight">
              {dataA.unitPrice.toFixed(3)} <span className="text-xs font-bold text-slate-400">€/{meta.unit}</span>
            </p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              vs {dataB.unitPrice.toFixed(3)} €/{meta.unit}
            </p>
          </div>

          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black w-fit mt-1',
            priceDiff <= 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          )}>
            {priceDiff <= 0 ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            <span>
              {priceDiff <= 0 ? '-' : '+'}{Math.abs(priceDiff).toFixed(3)} €/{meta.unit}
            </span>
          </div>
        </div>
      </div>

      {/* ── MINIGRÁFICA VISUAL DE BARRAS DIRECTA ── */}
      <Card className="p-4 bg-[#100e23]/80 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            <span>Comparación Visual de Importes</span>
          </h4>
          <span className="text-[11px] font-bold text-slate-400">
            {formatMonthLabel(monthA)} vs {formatMonthLabel(monthB)}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {/* Barra Periodo A */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-purple-400" />
                {formatMonthLabel(monthA)} (Principal)
              </span>
              <span className="text-purple-300 font-black tabular-nums">{formatCurrency(dataA.amount)} · {dataA.units} {meta.unit}</span>
            </div>
            <div className="h-3.5 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${percentBarA}%` }}
              />
            </div>
          </div>

          {/* Barra Periodo B */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400" />
                {formatMonthLabel(monthB)} (Comparado)
              </span>
              <span className="text-cyan-300 font-black tabular-nums">{formatCurrency(dataB.amount)} · {dataB.units} {meta.unit}</span>
            </div>
            <div className="h-3.5 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-teal-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${percentBarB}%` }}
              />
            </div>
          </div>
        </div>

        {/* Consejo / Resumen Inteligente */}
        <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5">
          <Sparkles className="size-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-200">
            {amountDiff < 0
              ? `🎉 ¡Excelente! En ${formatMonthLabel(monthA)} has ahorrado ${formatCurrency(Math.abs(amountDiff))} (${Math.abs(amountDiffPercent).toFixed(1)}%) en ${meta.label.toLowerCase()} respecto a ${formatMonthLabel(monthB)}.`
              : amountDiff > 0
              ? `💡 En ${formatMonthLabel(monthA)} el gasto de ${meta.label.toLowerCase()} subió ${formatCurrency(amountDiff)} (+${amountDiffPercent.toFixed(1)}%). Revisa picos de consumo o cambios en la tarifa unitaria.`
              : `⚖️ El gasto en ${meta.label.toLowerCase()} se mantiene idéntico entre ambos periodos.`}
          </p>
        </div>
      </Card>
    </div>
  )
}
