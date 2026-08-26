'use client'

import { useState } from 'react'
import { PiggyBank, Plus, Edit2, Trash2, X, AlertCircle, AlertTriangle } from 'lucide-react'
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
    toast(`Presupuesto para ${expenseCategoryMeta[selectedCategory].label} guardado`, '💰')
    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{budgets.length}</span>
          <span className="text-xs text-slate-400">presupuestos activos</span>
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
        <div className="w-full min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
            🎯
          </div>
          <p className="text-xs text-slate-400 max-w-xs">No has establecido ningún presupuesto aún.</p>
          <button
            onClick={() => handleOpenCreate()}
            className="mt-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            + Fijar presupuesto por categoría
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {budgets.map((b) => {
            const meta = expenseCategoryMeta[b.category] || { icon: '✨', label: b.category }
            const spent = categorySpentMap[b.category] || 0
            const remaining = b.monthlyLimit - spent
            const percent = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0
            const isOverLimit = spent > b.monthlyLimit
            const isWarning = percent >= 85 && !isOverLimit

            return (
              <Card
                key={b.id}
                className={cn(
                  'p-4 border transition-all flex flex-col justify-between gap-3 shadow-soft relative group',
                  isOverLimit
                    ? 'bg-rose-500/5 border-rose-500/40'
                    : isWarning
                    ? 'bg-amber-500/5 border-amber-500/40'
                    : 'bg-card border-border/80'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl">
                      {meta.icon}
                    </span>
                    <div>
                      <h4 className="text-base font-extrabold text-foreground capitalize">{meta.label}</h4>
                      <p className="text-xs text-muted-foreground font-semibold">
                        Límite: <strong className="text-foreground">{formatCurrency(b.monthlyLimit)}</strong> / mes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCreate(b.category)}
                      className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Editar presupuesto"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmDelete({
                          title: '¿Eliminar presupuesto?',
                          itemName: meta.label,
                          description: 'Se eliminará el techo mensual configurado para esta categoría.',
                          confirmText: 'Eliminar Presupuesto',
                          onConfirm: () => {
                            deleteBudget(b.id)
                            toast('Presupuesto eliminado', '🗑️')
                          },
                        })
                      }}
                      className="p-1.5 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Real-time Spent Metrics */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Gastado: {formatCurrency(spent)}</span>
                    <span className={cn(isOverLimit ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400')}>
                      {isOverLimit ? `Excedido por ${formatCurrency(Math.abs(remaining))}` : `Disponible: ${formatCurrency(remaining)}`}
                    </span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isOverLimit ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Creador / Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">Fijar Presupuesto Mensual</h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground text-xs">Categoría de Gasto</label>
                <CustomSelect<ExpenseCategory>
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={EXPENSE_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: expenseCategoryMeta[cat].label,
                    icon: expenseCategoryMeta[cat].icon,
                  }))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Techo Máximo Mensual (€) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="10"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Ej. 400"
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>

              <div className="mt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
                >
                  Guardar presupuesto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
