'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { getTodayISO } from '@/lib/date-utils'
import {
  type Expense,
  type ExpenseCategory,
  type ExpenseFrequency,
  EXPENSE_CATEGORIES,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_CONFIG,
  expenseCategoryMeta,
  formatCurrency,
  getExpenseMemberIds,
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
    members,
    selectedMonthISO,
    saveBudget,
    deleteBudget,
    addExpense,
    updateExpense,
    deleteExpense,
    confirmDelete,
  } = useApp()

  // Modal Techo de Presupuesto
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('alimentación')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [budgetNote, setBudgetNote] = useState('')

  // Modal Registrar/Editar Gasto en "Otros"
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [expenseTitle, setExpenseTitle] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseNote, setExpenseNote] = useState('')
  const [expenseMemberIds, setExpenseMemberIds] = useState<string[]>([])
  const [expenseDate, setExpenseDate] = useState(getTodayISO())
  const [expenseFrequency, setExpenseFrequency] = useState<ExpenseFrequency>('puntual')
  const [expenseBillingDay, setExpenseBillingDay] = useState('1')

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
    setMonthlyLimit(existing ? existing.monthlyLimit.toString() : '300')
    setBudgetNote(existing?.note || '')
    setIsModalOpen(true)
  }

  function handleSave() {
    const numLimit = parseFloat(monthlyLimit)
    if (isNaN(numLimit) || numLimit <= 0) {
      toast('Por favor, indica un techo de presupuesto válido', '❌')
      return
    }

    const cleanNote = selectedCategory === 'otros' ? budgetNote.trim() || undefined : undefined
    saveBudget(selectedCategory, numLimit, cleanNote)
    toast(`Presupuesto para ${expenseCategoryMeta[selectedCategory].label} guardado`, '✅')
    setIsModalOpen(false)
  }

  function handleOpenAddExpenseOtros() {
    setEditingExpenseId(null)
    setExpenseTitle('')
    setExpenseAmount('')
    setExpenseNote('')
    setExpenseMemberIds(members[0]?.id ? [members[0].id] : [])
    setExpenseDate(getTodayISO())
    setExpenseFrequency('puntual')
    setExpenseBillingDay(new Date().getDate().toString())
    setIsExpenseModalOpen(true)
  }

  function handleOpenEditExpenseOtros(exp: Expense) {
    setEditingExpenseId(exp.id)
    setExpenseTitle(exp.title)
    setExpenseAmount(exp.amount.toString())
    setExpenseNote(exp.note || exp.customCategory || '')
    setExpenseMemberIds(getExpenseMemberIds(exp))
    setExpenseDate(exp.date || getTodayISO())
    const initialFreq: ExpenseFrequency = exp.frequency || (exp.isRecurring ? 'mensual' : 'puntual')
    setExpenseFrequency(initialFreq)
    setExpenseBillingDay((exp.billingDay || (exp.date ? parseInt(exp.date.split('-')[2] || '1', 10) : 1)).toString())
    setIsExpenseModalOpen(true)
  }

  function handleSaveExpenseOtros() {
    if (!expenseTitle.trim()) {
      toast('Por favor, indica un concepto o descripción para el gasto', '❌')
      return
    }
    const num = parseFloat(expenseAmount.trim().replace(',', '.'))
    if (isNaN(num) || num <= 0) {
      toast('Por favor, indica un importe válido mayor que 0', '❌')
      return
    }
    if (expenseMemberIds.length === 0) {
      toast('Selecciona al menos un integrante', '⚠️')
      return
    }

    const cleanNote = expenseNote.trim() || undefined
    const isRec = expenseFrequency !== 'puntual'
    const day = isRec ? Math.min(31, Math.max(1, parseInt(expenseBillingDay, 10) || 1)) : undefined

    if (editingExpenseId) {
      updateExpense({
        id: editingExpenseId,
        groupId: '',
        title: expenseTitle.trim(),
        amount: num,
        category: 'otros',
        customCategory: cleanNote,
        note: cleanNote,
        date: expenseDate,
        paidByMemberId: expenseMemberIds[0] || '',
        paidByMemberIds: expenseMemberIds,
        isRecurring: isRec,
        frequency: expenseFrequency,
        billingDay: day,
      })
      toast('Gasto de Otros actualizado', '✅')
    } else {
      addExpense({
        title: expenseTitle.trim(),
        amount: num,
        category: 'otros',
        customCategory: cleanNote,
        note: cleanNote,
        date: expenseDate,
        paidByMemberId: expenseMemberIds[0] || '',
        paidByMemberIds: expenseMemberIds,
        isRecurring: isRec,
        frequency: expenseFrequency,
        billingDay: day,
      })
      toast('Gasto registrado en Otros', '✅')
    }

    setIsExpenseModalOpen(false)
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddExpenseOtros()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Añadir gasto con nota en categoría Otros"
          >
            <Plus className="size-3.5 text-emerald-600 dark:text-purple-400" />
            <span>Gasto en Otros</span>
          </button>
          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
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
                className="p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug capitalize">
                      {meta.label}
                    </h4>
                    {b.note && (
                      <p className="text-xs text-emerald-600 dark:text-purple-400 font-medium mt-0.5 flex items-center gap-1">
                        <span className="text-[11px]">📝</span>
                        <span className="italic">{b.note}</span>
                      </p>
                    )}
                    <span className="inline-block mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Límite mensual: {formatCurrency(b.monthlyLimit)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {b.category === 'otros' && (
                      <button
                        type="button"
                        onClick={handleOpenAddExpenseOtros}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 text-[11px] font-bold transition-all active:scale-95"
                        title="Añadir gasto con nota en Otros"
                      >
                        <Plus className="size-3" />
                        <span>Gasto</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenCreate(b.category)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Editar presupuesto"
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
                      title="Eliminar presupuesto"
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
                    <span className={cn('font-bold', isOverLimit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white tabular-nums')}>
                      {percent.toFixed(0)}%
                    </span>
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

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{isOverLimit ? 'Presupuesto superado' : `Restan ${formatCurrency(remaining)}`}</span>
                    {isOverLimit && (
                      <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
                        <AlertCircle className="size-2.5" /> +{formatCurrency(Math.abs(remaining))}
                      </span>
                    )}
                  </div>

                  {/* Detalle de notas/gastos para la categoría Otros */}
                  {b.category === 'otros' && (
                    (() => {
                      const otrosExpenses = expenses.filter(
                        (e) => e.category === 'otros' && (!e.date || e.date.startsWith(currentMonthISO))
                      )
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Detalle ({otrosExpenses.length} {otrosExpenses.length === 1 ? 'gasto' : 'gastos'}):
                            </span>
                            <button
                              type="button"
                              onClick={handleOpenAddExpenseOtros}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="size-2.5" /> Añadir gasto
                            </button>
                          </div>
                          {otrosExpenses.length === 0 ? (
                            <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 text-center">
                              <p className="text-[11px] text-slate-400">Sin movimientos registrados este mes en Otros.</p>
                            </div>
                          ) : (
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                              {otrosExpenses.map((exp) => {
                                const noteVal = exp.note || exp.customCategory
                                return (
                                  <div
                                    key={exp.id}
                                    className="flex items-center justify-between text-[11px] p-1.5 px-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                        {exp.title}
                                      </span>
                                      {noteVal && (
                                        <span className="inline-block text-[10px] text-emerald-600 dark:text-purple-400 font-medium truncate max-w-full">
                                          🏷️ Nota: {noteVal}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                                        {formatCurrency(exp.amount)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditExpenseOtros(exp)}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                        title="Editar gasto"
                                      >
                                        <Edit2 className="size-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          confirmDelete({
                                            title: '¿Eliminar gasto de Otros?',
                                            itemName: exp.title,
                                            confirmText: 'Eliminar',
                                            onConfirm: () => {
                                              deleteExpense(exp.id)
                                              toast('Gasto eliminado', '🗑️')
                                            },
                                          })
                                        }}
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                                        title="Eliminar gasto"
                                      >
                                        <Trash2 className="size-3" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL CREADOR / EDITOR DE TECHO DE PRESUPUESTO ── */}
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
                  onChange={(val) => {
                    setSelectedCategory(val)
                    const existing = budgets.find((b) => b.category === val)
                    if (existing) {
                      setMonthlyLimit(existing.monthlyLimit.toString())
                      setBudgetNote(existing.note || '')
                    } else if (val === 'otros') {
                      setBudgetNote('')
                    }
                  }}
                  options={EXPENSE_CATEGORIES.map((c) => ({
                    value: c,
                    label: expenseCategoryMeta[c].label,
                  }))}
                />
              </div>

              {/* Campo dinámico para la categoría 'otros': nota descriptiva */}
              {selectedCategory === 'otros' && (
                <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>📝</span> Anotación o propósito del presupuesto
                  </label>
                  <input
                    type="text"
                    value={budgetNote}
                    onChange={(e) => setBudgetNote(e.target.value)}
                    placeholder="Ej: Suscripciones streaming, imprevistos, compras varias..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Indica el propósito o concepto de este presupuesto de Otros para identificarlo en la tarjeta.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Límite mensual (€) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="any"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="300.00"
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

      {/* ── MODAL REGISTRAR / EDITAR GASTO EN "OTROS" CON NOTA LIBRE ── */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingExpenseId ? 'Editar gasto en Otros' : 'Registrar gasto en Otros'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Categoría presupuestaria: <strong className="text-emerald-600 dark:text-purple-400">Otros</strong>
                </p>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Banner informativo de respeto estricto al presupuesto global de Otros */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-emerald-600 dark:text-purple-400 shrink-0" />
                Imputación en Presupuesto Global
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Este movimiento se contabilizará estrictamente dentro del presupuesto global de <strong>Otros</strong>. La nota es informativa para saber exactamente a qué se refiere, sin crear subcategorías obligatorias ni alterar el límite general.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">
                  Concepto / Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Ej: Suscripción streaming, Compra puntual..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">
                    Nota u observación aclaratoria <span className="text-[10px] text-slate-400">(opcional)</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-purple-400 font-medium">
                    Ej: Netflix
                  </span>
                </div>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="Ej: Netflix, HBO, Regalo de cumple, Farmacia..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">
                    Importe (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Fecha</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Pagado por</label>
                <MemberMultiSelect
                  members={members}
                  selectedIds={expenseMemberIds}
                  onChange={setExpenseMemberIds}
                />
              </div>

              {/* Periodicidad del Gasto */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">
                    Periodicidad del gasto
                  </label>
                  <CustomSelect<ExpenseFrequency>
                    value={expenseFrequency}
                    onChange={setExpenseFrequency}
                    options={EXPENSE_FREQUENCIES.map((freq) => ({
                      value: freq.value,
                      label: freq.label,
                      badge: freq.value !== 'puntual' ? 'Periódico' : undefined,
                      badgeVariant: (freq.value !== 'puntual' ? 'warning' : 'neutral') as 'warning' | 'neutral',
                    }))}
                  />
                </div>

                {/* Selector dinámico de día exacto de cobro */}
                {expenseFrequency !== 'puntual' && (
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <span className="font-bold text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5">
                        <span>📅</span> Día exacto de cobro
                      </span>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                        Cobro el día {expenseBillingDay || '1'} · Cada {EXPENSE_FREQUENCY_CONFIG[expenseFrequency].monthsInterval} {EXPENSE_FREQUENCY_CONFIG[expenseFrequency].monthsInterval === 1 ? 'mes' : 'meses'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Día</span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={expenseBillingDay}
                        onChange={(e) => setExpenseBillingDay(e.target.value)}
                        className="w-14 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-black/50 py-1 px-2 font-mono font-bold text-center text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpenseOtros}
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
