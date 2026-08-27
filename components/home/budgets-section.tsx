'use client'

import { useState } from 'react'
import { PiggyBank, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
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
} from '@/types/finances'
import { cn } from '@/lib/utils'

export function BudgetsSection() {
  const { toast } = useToast()
  const { budgets, expenses, saveBudget, deleteBudget, confirmDelete } = useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('alimentación')
  const [monthlyLimit, setMonthlyLimit] = useState('')

  const currentMonthISO = new Date().toISOString().slice(0, 7)

  // Calculate spent per category
  const categorySpentMap: Record<string, number> = {}
  expenses
    .filter((e) => !e.date || e.date.startsWith(currentMonthISO))
    .forEach((e) => {
      categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + e.amount
    })

  function handleOpenCreate(cat?: ExpenseCategory) {
    setSelectedCategory(cat || 'alimentación')
    const existing = budgets.find((b) => b.category === (cat || 'alimentación'))
    setMonthlyLimit(existing ? existing.monthlyLimit.toString() : '300')
    setIsModalOpen(true)
  }

  function handleSave() {
    const numLimit = parseFloat(monthlyLimit)
    if (isNaN(numLimit) || numLimit <= 0) {
      toast('Por favor, indica un techo de presupuesto válido', '❌')
      return
    }

    saveBudget(selectedCategory, numLimit)
    toast(`Presupuesto para ${expenseCategoryMeta[selectedCategory].label} guardado`, '✅')
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
        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Fijar presupuesto</span>
        </button>
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          emoji="📊"
          title="Sin techos de presupuesto fijados."
          action="+ Fijar presupuesto por categoría"
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

            return (
              <Card
                key={b.id}
                className="p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug capitalize">
                      {meta.label}
                    </h4>
                    <span className="inline-block mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Límite mensual: {formatCurrency(b.monthlyLimit)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCreate(b.category)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmDelete({
                          title: '¿Eliminar límite de presupuesto?',
                          itemName: meta.label,
                          confirmText: 'Eliminar Presupuesto',
                          onConfirm: () => {
                            deleteBudget(b.id)
                            toast('Presupuesto eliminado', '🗑️')
                          },
                        })
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Gastado: <strong className="text-slate-900 dark:text-white">{formatCurrency(spent)}</strong>
                    </span>
                    <span className={cn('font-bold', isOverLimit ? 'text-rose-600 dark:text-rose-400' : 'text-purple-700 dark:text-purple-300')}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isOverLimit ? 'bg-rose-500' : 'bg-purple-500'
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

      {/* ── MODAL CREADOR / EDITOR ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fijar Techo de Presupuesto
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Categoría del gasto</label>
                <CustomSelect<ExpenseCategory>
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  options={EXPENSE_CATEGORIES.map((c) => ({
                    value: c,
                    label: expenseCategoryMeta[c].label,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Límite mensual (€) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="any"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="300.00"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
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
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
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
