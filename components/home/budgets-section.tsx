'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  type ExpenseCategory,
  EXPENSE_CATEGORIES,
  expenseCategoryMeta,
  formatCurrency,
  getEffectiveExpensesForMonth,
  getEffectiveBillsForMonth,
} from '@/types/finances'
import { cn } from '@/lib/utils'

export function BudgetsSection() {
  const { toast } = useToast()
  const {
    budgets,
    expenses,
    bills,
    selectedMonthISO,
    saveBudget,
    deleteBudget,
    confirmDelete,
  } = useApp()

  // Modal Techo de Presupuesto
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('alimentación')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [budgetNote, setBudgetNote] = useState('')

  const currentMonthISO = selectedMonthISO || new Date().toISOString().slice(0, 7)

  // Calculate spent per category (effective month expenses + unmaterialized effective bills)
  const effectiveExpenses = getEffectiveExpensesForMonth(expenses, currentMonthISO)
  const effectiveBills = getEffectiveBillsForMonth(bills || [], expenses, currentMonthISO)

  const categorySpentMap: Record<string, number> = {}
  effectiveExpenses.forEach((e) => {
    categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + (Number(e.amount) || 0)
  })
  effectiveBills.forEach((b) => {
    const cat = b.category || 'hogar'
    categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (Number(b.amount) || 0)
  })

  function handleOpenCreate(cat?: ExpenseCategory) {
    const targetCat = cat || 'alimentación'
    setSelectedCategory(targetCat)
    const existing = budgets.find((b) => b.category === targetCat)
    setMonthlyLimit(existing ? existing.monthlyLimit.toString() : '')
    setBudgetNote(existing?.note || '')
    setIsModalOpen(true)
  }

  function handleSave() {
    const sanitized = monthlyLimit.trim().replace(',', '.')
    const numLimit = parseFloat(sanitized)
    if (isNaN(numLimit) || numLimit <= 0) {
      toast('Por favor, indica un importe de presupuesto válido mayor a 0', '❌')
      return
    }

    const cleanNote = budgetNote.trim()
    saveBudget(selectedCategory, numLimit, cleanNote)
    toast('Presupuesto guardado correctamente', '✅')
    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <div>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {budgets.length}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Presupuestos y techos de gasto activos</p>
        </div>
        <div>
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>Fijar presupuesto</span>
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Sin techos de presupuesto fijados."
          action="+ Fijar presupuesto"
          onAction={() => handleOpenCreate()}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {budgets.map((b) => {
            const meta = expenseCategoryMeta[b.category] || { icon: '✨', label: b.category }
            const spent = categorySpentMap[b.category] || 0
            const remaining = b.monthlyLimit - spent
            const percent = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
            const isOverLimit = spent > b.monthlyLimit
            const displayName = b.note?.trim() || meta.label

            return (
              <Card
                key={b.id}
                className="p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                      {displayName}
                    </h4>
                    {b.note?.trim() && (
                      <span className="inline-block mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize">
                        {meta.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(b.monthlyLimit)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleOpenCreate(b.category)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Editar presupuesto"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          confirmDelete({
                            title: '¿Eliminar presupuesto?',
                            itemName: displayName,
                            confirmText: 'Eliminar Presupuesto',
                            onConfirm: () => {
                              deleteBudget(b.id)
                              toast('Presupuesto eliminado', '🗑️')
                            },
                          })
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-600 transition-colors"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Gastado: <strong className="text-slate-900 dark:text-white">{formatCurrency(spent)}</strong>
                    </span>
                    <span className={cn('font-bold tabular-nums', isOverLimit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white')}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isOverLimit ? 'bg-rose-500' : 'bg-emerald-500 dark:bg-purple-500'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{isOverLimit ? 'Presupuesto superado' : `Restan ${formatCurrency(remaining)}`}</span>
                    {isOverLimit && (
                      <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
                        <AlertCircle className="size-2.5" /> +{formatCurrency(Math.abs(remaining))}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL CREADOR / EDITOR DE TECHO DE PRESUPUESTO ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fijar Presupuesto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Categoría del gasto</label>
                <CustomSelect<ExpenseCategory>
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val)
                    const existing = budgets.find((b) => b.category === val)
                    if (existing) {
                      setMonthlyLimit(existing.monthlyLimit.toString())
                      setBudgetNote(existing.note || '')
                    } else {
                      setMonthlyLimit('')
                      setBudgetNote('')
                    }
                  }}
                  options={EXPENSE_CATEGORIES.map((c) => ({
                    value: c,
                    label: expenseCategoryMeta[c].label,
                  }))}
                />
              </div>

              {/* Nota personalizada o concepto */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>📝</span> Nota personalizada o concepto
                </label>
                <input
                  type="text"
                  value={budgetNote}
                  onChange={(e) => setBudgetNote(e.target.value)}
                  placeholder="Ej: Compra mensual, Ocio, Suministros..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">
                  Límite mensual (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
