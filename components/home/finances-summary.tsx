'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle, PieChart, Edit3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useApp } from '@/components/app/app-context'
import { formatCurrency, EXPENSE_CATEGORIES, expenseCategoryMeta, formatMonthLabel } from '@/types/finances'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function FinancesSummary() {
  const { toast } = useToast()
  const {
    incomes,
    expenses,
    bills,
    budgets,
    selectedMonthISO,
    initialPiggyBankBalance,
    saveInitialPiggyBankBalance,
  } = useApp()

  const [isHuchaModalOpen, setIsHuchaModalOpen] = useState(false)
  const [baseBalanceInput, setBaseBalanceInput] = useState(initialPiggyBankBalance.toString())

  useEffect(() => {
    setBaseBalanceInput(initialPiggyBankBalance.toString())
  }, [initialPiggyBankBalance])

  // Helper to compute total incomes for a specific monthISO
  function getMonthIncomesSum(monthISO: string): number {
    return incomes.reduce((sum, inc) => {
      const amt = Number(inc.amount) || 0
      if (inc.frequency === 'mensual') return sum + amt
      if (inc.frequency === 'quincenal') return sum + amt * 2
      if (inc.frequency === 'puntual' && inc.date && inc.date.startsWith(monthISO)) return sum + amt
      return sum
    }, 0)
  }

  // Helper to compute total expenses for a specific monthISO
  function getMonthExpensesSum(monthISO: string): number {
    const directExpensesSum = expenses.reduce((sum, e) => {
      const amt = Number(e.amount) || 0
      if (e.isRecurring) return sum + amt
      if (!e.isRecurring && e.date && e.date.startsWith(monthISO)) return sum + amt
      return sum
    }, 0)

    const billsSum = bills.reduce((sum, b) => {
      const amt = Number(b.amount) || 0
      if (b.billingCycle === 'mensual') return sum + amt
      return sum + amt / 12
    }, 0)

    return directExpensesSum + billsSum
  }

  // 1. Current Selected Month Calculations
  const totalIncomes = getMonthIncomesSum(selectedMonthISO)
  const totalExpenses = getMonthExpensesSum(selectedMonthISO)
  const netBalance = totalIncomes - totalExpenses
  const savingsRate = totalIncomes > 0 ? Math.max(0, (netBalance / totalIncomes) * 100) : 0

  // 2. Compute Savings (Hucha): Fondo Base + Remanente / Balance Neto del Mes
  const totalAccumulatedSavings = initialPiggyBankBalance + netBalance

  // 3. Category spent map for selectedMonthISO
  const categorySpentMap: Record<string, number> = {}
  EXPENSE_CATEGORIES.forEach((cat) => {
    categorySpentMap[cat] = 0
  })

  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0
    if (e.isRecurring || (e.date && e.date.startsWith(selectedMonthISO))) {
      categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + amt
    }
  })

  function handleSaveBaseBalance() {
    const cleaned = baseBalanceInput.trim().replace(',', '.')
    const val = parseFloat(cleaned)
    if (isNaN(val) || val < 0) {
      toast('Introduce un importe válido mayor o igual a 0', '❌')
      return
    }
    saveInitialPiggyBankBalance(val)
    toast('Saldo base de la hucha guardado', '✅')
    setIsHuchaModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Piggy Bank Highlighted Banner (Minimalist & Compact) ── */}
      <Card
        onClick={() => {
          setBaseBalanceInput(initialPiggyBankBalance.toString())
          setIsHuchaModalOpen(true)
        }}
        className="p-4 sm:p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-purple-500/30 cursor-pointer transition-all rounded-2xl shadow-sm group"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200 shrink-0 border border-slate-200 dark:border-white/10">
              <PiggyBank className="size-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ahorro Total Acumulado
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5 tabular-nums">
                {formatCurrency(totalAccumulatedSavings)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Fondo base: {formatCurrency(initialPiggyBankBalance)} · Acumulado con sobrantes
              </p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shrink-0">
            <Edit3 className="size-3.5 text-slate-700 dark:text-slate-300" />
            <span>Ajustar fondo</span>
          </button>
        </div>
      </Card>

      {/* ── 4 Metric Cards for Selected Month (Clean, Balanced & Compact) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Ingresos */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ingresos</span>
            <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatCurrency(totalIncomes)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {formatMonthLabel(selectedMonthISO)}
            </p>
          </div>
        </Card>

        {/* 2. Gastos */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gastos</span>
            <TrendingDown className="size-3.5 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Fijos y variables
            </p>
          </div>
        </Card>

        {/* 3. Balance Neto Mes */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Balance Neto</span>
            <Wallet className="size-3.5 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatCurrency(netBalance)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {netBalance >= 0 ? 'Suma al ahorro' : 'Déficit mensual'}
            </p>
          </div>
        </Card>

        {/* 4. Tasa de Ahorro */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all rounded-2xl flex flex-col justify-between gap-2 shadow-sm">
          <div className="flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasa Ahorro</span>
            <PiggyBank className="size-3.5 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
              {savingsRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Del total ingresado
            </p>
          </div>
        </Card>
      </div>

      {/* ── Grid: Progreso de Presupuesto & Distribución del Gasto ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Progreso de Presupuesto */}
        <Card className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Presupuestos ({formatMonthLabel(selectedMonthISO)})
            </h4>
            <span className="text-[11px] text-slate-400">{budgets.length} límites</span>
          </div>

          {budgets.length === 0 ? (
            <div className="py-6 text-center bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5">
              <p className="text-xs text-slate-400">Sin techos de presupuesto fijados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {budgets.map((b) => {
                const meta = expenseCategoryMeta[b.category] || { icon: '✨', label: b.category }
                const spent = categorySpentMap[b.category] || 0
                const percent = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
                const isOverLimit = spent > b.monthlyLimit

                return (
                  <div key={b.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(spent)} / {formatCurrency(b.monthlyLimit)}
                        </span>
                        {isOverLimit && (
                          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                            Excedido
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Distribución del Gasto por Categoría */}
        <Card className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Distribución de Gasto
            </h4>
            <span className="text-[11px] text-slate-400">{formatMonthLabel(selectedMonthISO)}</span>
          </div>

          {totalExpenses === 0 ? (
            <div className="py-6 text-center bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/5">
              <p className="text-xs text-slate-400">Sin gastos registrados este mes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const spent = categorySpentMap[cat] || 0
                if (spent === 0) return null
                const meta = expenseCategoryMeta[cat]
                const sharePercent = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0

                return (
                  <div key={cat} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize truncate">
                      {meta.label}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 bg-slate-200 dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sharePercent}%` }} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums w-7 text-right">
                        {sharePercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── MODAL: AJUSTAR FONDO DE LA HUCHA ── */}
      {isHuchaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fondo Base de la Hucha
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configura el saldo inicial acumulado antes del seguimiento mensual.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Importe (€)</label>
              <input
                type="number"
                step="any"
                value={baseBalanceInput}
                onChange={(e) => setBaseBalanceInput(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHuchaModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBaseBalance}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
