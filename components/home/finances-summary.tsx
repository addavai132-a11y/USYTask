'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle, AlertCircle, PieChart, Users, X, Edit3, Plus, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useApp } from '@/components/app/app-context'
import { formatCurrency, EXPENSE_CATEGORIES, expenseCategoryMeta, formatMonthLabel, getPreviousMonthISO } from '@/types/finances'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function FinancesSummary() {
  const { toast } = useToast()
  const {
    incomes,
    expenses,
    bills,
    budgets,
    members,
    getMemberById,
    selectedMonthISO,
    initialPiggyBankBalance,
    saveInitialPiggyBankBalance,
  } = useApp()

  const [isHuchaModalOpen, setIsHuchaModalOpen] = useState(false)
  const [baseBalanceInput, setBaseBalanceInput] = useState(initialPiggyBankBalance.toString())

  // Helper to compute total incomes for a specific monthISO
  function getMonthIncomesSum(monthISO: string): number {
    return incomes.reduce((sum, inc) => {
      if (inc.frequency === 'mensual') return sum + inc.amount
      if (inc.frequency === 'quincenal') return sum + inc.amount * 2
      if (inc.frequency === 'puntual' && inc.date && inc.date.startsWith(monthISO)) return sum + inc.amount
      return sum
    }, 0)
  }

  // Helper to compute total expenses for a specific monthISO
  function getMonthExpensesSum(monthISO: string): number {
    const directExpensesSum = expenses.reduce((sum, e) => {
      if (e.isRecurring) return sum + e.amount
      if (!e.isRecurring && e.date && e.date.startsWith(monthISO)) return sum + e.amount
      return sum
    }, 0)

    const billsSum = bills.reduce((sum, b) => {
      if (b.billingCycle === 'mensual') return sum + b.amount
      return sum + b.amount / 12
    }, 0)

    return directExpensesSum + billsSum
  }

  // 1. Current Selected Month Calculations
  const totalIncomes = getMonthIncomesSum(selectedMonthISO)
  const totalExpenses = getMonthExpensesSum(selectedMonthISO)
  const netBalance = totalIncomes - totalExpenses
  const savingsRate = totalIncomes > 0 ? Math.max(0, (netBalance / totalIncomes) * 100) : 0

  // 2. Compute Cumulative Savings (Hucha) up to selectedMonthISO
  // Collect all months from earliest recorded item date up to selectedMonthISO
  const monthList: string[] = []
  let curr = selectedMonthISO
  for (let i = 0; i < 12; i++) {
    monthList.unshift(curr)
    curr = getPreviousMonthISO(curr)
  }

  const historyBreakdown = monthList.map((mISO) => {
    const incSum = getMonthIncomesSum(mISO)
    const expSum = getMonthExpensesSum(mISO)
    const net = incSum - expSum
    return { monthISO: mISO, incomes: incSum, expenses: expSum, net }
  })

  // Total Accumulated Piggy Bank Balance = Base + sum of net balances of past & current months
  const totalAccumulatedSavings = initialPiggyBankBalance + historyBreakdown.reduce((sum, item) => sum + item.net, 0)

  // 3. Category spent map for selectedMonthISO
  const categorySpentMap: Record<string, number> = {}
  EXPENSE_CATEGORIES.forEach((cat) => {
    categorySpentMap[cat] = 0
  })

  expenses.forEach((e) => {
    if (e.isRecurring || (e.date && e.date.startsWith(selectedMonthISO))) {
      categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + e.amount
    }
  })

  // 4. Member Breakdown for selectedMonthISO
  const memberStats = members.map((m) => {
    const memberInc = incomes.reduce((sum, i) => {
      const isForMember = i.memberIds && i.memberIds.length > 0 ? i.memberIds.includes(m.id) : i.memberId === m.id
      if (!isForMember) return sum
      if (i.frequency === 'mensual') return sum + i.amount
      if (i.frequency === 'quincenal') return sum + i.amount * 2
      if (i.frequency === 'puntual' && i.date && i.date.startsWith(selectedMonthISO)) return sum + i.amount
      return sum
    }, 0)

    const memberExp = expenses.reduce((sum, e) => {
      const isForMember = e.paidByMemberIds && e.paidByMemberIds.length > 0 ? e.paidByMemberIds.includes(m.id) : e.paidByMemberId === m.id
      if (!isForMember) return sum
      if (e.isRecurring || (e.date && e.date.startsWith(selectedMonthISO))) return sum + e.amount
      return sum
    }, 0)

    return { member: m, incomes: memberInc, expenses: memberExp }
  })

  function handleSaveBaseBalance() {
    const val = parseFloat(baseBalanceInput)
    if (isNaN(val)) {
      toast('Introduce un importe válido', '❌')
      return
    }
    saveInitialPiggyBankBalance(val)
    toast('Saldo base de la hucha guardado', '🐷')
    setIsHuchaModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Piggy Bank Highlighted Banner */}
      <Card
        onClick={() => {
          setBaseBalanceInput(initialPiggyBankBalance.toString())
          setIsHuchaModalOpen(true)
        }}
        className="p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-primary/10 border border-emerald-500/40 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white font-black text-2xl shadow-soft group-hover:scale-110 transition-transform">
              🐷
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                Ahorro Total Acumulado (Hucha Familiar) <Sparkles className="size-3.5" />
              </span>
              <p className="text-3xl font-black text-foreground tracking-tight">
                {formatCurrency(totalAccumulatedSavings)}
              </p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                Fondo base ({formatCurrency(initialPiggyBankBalance)}) + Acumulado histórico sobrante
              </p>
            </div>
          </div>

          <button className="flex items-center gap-1.5 rounded-2xl bg-card border border-border px-3.5 py-2 text-xs font-bold text-foreground shadow-soft group-hover:border-primary transition-colors">
            <Edit3 className="size-3.5 text-primary" />
            <span>Ver Hucha / Ajustar Saldo</span>
          </button>
        </div>
      </Card>

      {/* 4 Metric Cards for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ingresos */}
        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 border-emerald-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="size-4" /> Ingresos ({formatMonthLabel(selectedMonthISO)})
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600">
              💶
            </div>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {formatCurrency(totalIncomes)}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
            Fijos/Recurrentes + Puntuales de este mes
          </p>
        </Card>

        {/* Gastos */}
        <Card className="p-4 bg-gradient-to-br from-rose-500/10 via-background to-rose-500/5 border-rose-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <TrendingDown className="size-4" /> Gastos ({formatMonthLabel(selectedMonthISO)})
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600">
              💸
            </div>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
            Gastos fijos arrastrados + Puntuales del mes
          </p>
        </Card>

        {/* Balance Neto */}
        <Card className={cn(
          "p-4 bg-gradient-to-br via-background border transition-all",
          netBalance >= 0
            ? "from-primary/10 to-primary/5 border-primary/30"
            : "from-rose-500/15 to-rose-500/10 border-rose-500/40"
        )}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
              <Wallet className="size-4" /> Balance Neto Mes
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
              ⚖️
            </div>
          </div>
          <p className={cn("text-2xl font-black tracking-tight", netBalance < 0 && "text-rose-500")}>
            {formatCurrency(netBalance)}
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
            {netBalance >= 0 ? "Suma al ahorro de la hucha" : "Déficit mensual"}
          </p>
        </Card>

        {/* Tasa de Ahorro */}
        <Card className="p-4 bg-gradient-to-br from-indigo-500/10 via-background to-indigo-500/5 border-indigo-500/30">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <PiggyBank className="size-4" /> Tasa de Ahorro
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-600">
              📊
            </div>
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">
            {savingsRate.toFixed(1)}%
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-1">
            Porcentaje ahorrado del periodo
          </p>
        </Card>
      </div>

      {/* Grid: Progreso de Presupuesto & Distribución del Gasto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Progreso de Presupuesto */}
        <Card className="p-5 border border-border">
          <h4 className="text-base font-black tracking-tight text-foreground mb-1 flex items-center gap-2">
            <PiggyBank className="size-5 text-primary" />
            <span>Progreso de Presupuestos ({formatMonthLabel(selectedMonthISO)})</span>
          </h4>
          <p className="text-xs text-muted-foreground font-semibold mb-4">
            Monitoreo de techos de gasto asignados
          </p>

          {budgets.length === 0 ? (
            <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/80">
              <p className="text-xs font-bold text-muted-foreground">No has fijado techos de presupuesto aún.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {budgets.map((b) => {
                const meta = expenseCategoryMeta[b.category] || { icon: '✨', label: b.category }
                const spent = categorySpentMap[b.category] || 0
                const percent = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
                const isOverLimit = spent > b.monthlyLimit
                const isWarning = percent >= 85 && !isOverLimit

                return (
                  <div key={b.id} className="flex flex-col gap-1.5 bg-secondary/30 p-3 rounded-2xl border border-border/60">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <span>{meta.icon}</span>
                        <span className="capitalize">{meta.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(spent)} / {formatCurrency(b.monthlyLimit)}</span>
                        {isOverLimit && (
                          <span className="flex items-center gap-0.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-500">
                            <AlertCircle className="size-3" /> Excedido
                          </span>
                        )}
                        {isWarning && (
                          <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-500">
                            <AlertTriangle className="size-3" /> 85%+
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          isOverLimit ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary'
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
        <Card className="p-5 border border-border">
          <h4 className="text-base font-black tracking-tight text-foreground mb-1 flex items-center gap-2">
            <PieChart className="size-5 text-primary" />
            <span>Distribución del Gasto ({formatMonthLabel(selectedMonthISO)})</span>
          </h4>
          <p className="text-xs text-muted-foreground font-semibold mb-4">
            Desglose del consumo del mes seleccionado
          </p>

          {totalExpenses === 0 ? (
            <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/80">
              <p className="text-xs font-bold text-muted-foreground">Sin gastos en este mes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const spent = categorySpentMap[cat] || 0
                if (spent === 0) return null
                const meta = expenseCategoryMeta[cat]
                const sharePercent = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0

                return (
                  <div key={cat} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-secondary/30 border border-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-xs font-bold text-foreground capitalize truncate">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 bg-secondary rounded-full h-2 overflow-hidden hidden sm:block">
                        <div className="h-full bg-primary" style={{ width: `${sharePercent}%` }} />
                      </div>
                      <span className="text-xs font-black text-foreground">{formatCurrency(spent)}</span>
                      <span className="text-[10px] font-bold text-muted-foreground w-10 text-end">{sharePercent.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Desglose por Miembro */}
      <Card className="p-5 border border-border">
        <h4 className="text-base font-black tracking-tight text-foreground mb-1 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span>Aportaciones y Gastos por Miembro ({formatMonthLabel(selectedMonthISO)})</span>
        </h4>
        <p className="text-xs text-muted-foreground font-semibold mb-4">
          Comparativa de aportaciones e ingresos asignados vs gastos asumidos en este mes
        </p>

        {memberStats.length === 0 ? (
          <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/80">
            <p className="text-xs font-bold text-muted-foreground">Sin miembros registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberStats.map(({ member, incomes: inc, expenses: exp }) => (
              <div key={member.id} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="flex items-center gap-2.5">
                  <MemberAvatar member={member} size="sm" />
                  <div>
                    <h5 className="text-sm font-extrabold text-foreground">{member.name}</h5>
                    <p className="text-[10px] font-semibold text-muted-foreground">Miembro del grupo</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-border/40 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Ingresos</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(inc)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Gastos Pagados</span>
                    <span className="font-black text-rose-500">{formatCurrency(exp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Hucha / Ahorro Acumulado */}
      {isHuchaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐷</span>
                <h3 className="text-lg font-black tracking-tight">Fondo de Reserva / Hucha Familiar</h3>
              </div>
              <button onClick={() => setIsHuchaModalOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  Total Patrimonio Guardado
                </span>
                <span className="text-3xl font-black text-foreground">{formatCurrency(totalAccumulatedSavings)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Saldo Base Inicial / Aportación Base (€)</label>
                <input
                  type="number"
                  step="50"
                  value={baseBalanceInput}
                  onChange={(e) => setBaseBalanceInput(e.target.value)}
                  placeholder="Ej. 1000"
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Introduce el dinero acumulado previo o colchón financiero inicial.
                </p>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                <h5 className="font-black text-foreground text-xs">Histórico Reciente Mes a Mes</h5>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto p-0.5">
                  {historyBreakdown.map((item) => (
                    <div key={item.monthISO} className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                      <span className="font-bold text-foreground">{formatMonthLabel(item.monthISO)}</span>
                      <span className={cn('font-black', item.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                        {item.net >= 0 ? `+${formatCurrency(item.net)}` : formatCurrency(item.net)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsHuchaModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBaseBalance}
                  className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-emerald-600"
                >
                  Guardar saldo base
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
