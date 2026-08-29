'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Trash2, Edit2, X, Calendar, User, ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { MemberFilterDropdown } from '@/components/shared/member-filter-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  type Expense,
  type ExpenseCategory,
  EXPENSE_CATEGORIES,
  expenseCategoryMeta,
  formatCurrency,
  getExpenseMemberIds,
} from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export function ExpensesSection() {
  const { toast } = useToast()
  const { expenses, members, getMemberById, addExpense, updateExpense, deleteExpense, confirmDelete } = useApp()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('alimentación')
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [date, setDate] = useState(getTodayISO())
  const [isRecurring, setIsRecurring] = useState(false)

  // Filtering
  const filtered = expenses.filter((exp) => {
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false
    const memberIds = getExpenseMemberIds(exp)
    if (memberFilter !== 'all' && !memberIds.includes(memberFilter)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const titleMatch = exp.title.toLowerCase().includes(q)
      const catMatch = exp.category.toLowerCase().includes(q)
      const customMatch = exp.customCategory?.toLowerCase().includes(q)
      if (!titleMatch && !catMatch && !customMatch) return false
    }
    return true
  })

  const totalFilteredSum = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleOpenCreate() {
    setEditingId(null)
    setTitle('')
    setAmount('')
    setCategory('alimentación')
    setCustomCategoryInput('')
    setSelectedMemberIds([])
    setDate(getTodayISO())
    setIsRecurring(false)
    setIsModalOpen(true)
  }

  function handleOpenEdit(exp: Expense) {
    setEditingId(exp.id)
    setTitle(exp.title)
    setAmount(exp.amount.toString())
    setCategory(exp.category)
    setCustomCategoryInput(exp.customCategory || '')
    setSelectedMemberIds(getExpenseMemberIds(exp))
    setDate(exp.date || getTodayISO())
    setIsRecurring(exp.isRecurring)
    setIsModalOpen(true)
  }

  function handleSave() {
    if (!title.trim()) {
      toast('Por favor, introduce un concepto para el gasto', '❌')
      return
    }
    const numAmount = parseFloat(amount.trim().replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Por favor, introduce un importe válido mayor que 0', '❌')
      return
    }

    if (selectedMemberIds.length === 0) {
      toast('Debes seleccionar al menos un integrante que asumió o pagó el gasto', '⚠️')
      return
    }

    const memberIds = selectedMemberIds
    const customCat = category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined

    if (editingId) {
      updateExpense({
        id: editingId,
        groupId: '',
        title: title.trim(),
        amount: numAmount,
        category,
        customCategory: customCat,
        date,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        isRecurring,
      })
      toast('Gasto actualizado', '✅')
    } else {
      addExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        customCategory: customCat,
        date,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        isRecurring,
      })
      toast('Gasto registrado', '✅')
    }

    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <div>
          <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalFilteredSum)}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total en {filtered.length} gastos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Registrar gasto</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por concepto o categoría..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] pl-9 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="w-40 shrink-0">
            <CustomSelect<string>
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'Categorías' },
                ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: expenseCategoryMeta[c].label })),
              ]}
            />
          </div>

          <div className="w-36 shrink-0">
            <MemberFilterDropdown
              members={members}
              value={memberFilter}
              onChange={(val) => setMemberFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="💳"
          title="Sin gastos registrados con este filtro."
          action="+ Registrar gasto"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((exp) => {
            const meta = expenseCategoryMeta[exp.category] || { icon: '✨', label: exp.category }
            const memberIds = getExpenseMemberIds(exp)
            const memberList = memberIds.map((id) => getMemberById(id)).filter(Boolean)
            const displayCat = exp.category === 'otros' && exp.customCategory ? exp.customCategory : meta.label

            return (
              <Card
                key={exp.id}
                className="p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                      {exp.title}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 text-[10px] font-semibold capitalize text-slate-600 dark:text-slate-400">
                      {displayCat} {exp.isRecurring && '· Fijo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmDelete({
                          title: '¿Eliminar gasto?',
                          itemName: exp.title,
                          confirmText: 'Eliminar Gasto',
                          onConfirm: () => {
                            deleteExpense(exp.id)
                            toast('Gasto eliminado', '🗑️')
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

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-1.5">
                    {memberList.length > 0 ? (
                      <div className="flex items-center -space-x-1.5">
                        {memberList.map((m) => (
                          <MemberAvatar key={m!.id} member={m!} size="sm" />
                        ))}
                      </div>
                    ) : (
                      <User className="size-3.5 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]">
                      {exp.date ? new Date(exp.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Mes actual'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL CREADOR / EDITOR ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Gasto' : 'Registrar Gasto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Concepto / Título <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Compra Mercadona, Gasolina..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Importe (€) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Categoría</label>
                  <CustomSelect<ExpenseCategory>
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={EXPENSE_CATEGORIES.map((c) => ({
                      value: c,
                      label: expenseCategoryMeta[c].label,
                    }))}
                  />
                </div>
              </div>

              {category === 'otros' && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Especificar categoría</label>
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Ej: Reparación caldera..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Fecha del gasto</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Gasto fijo mensual</span>
                  </label>
                </div>
              </div>

              <div>
                <MemberMultiSelect
                  members={members}
                  selectedIds={selectedMemberIds}
                  onChange={setSelectedMemberIds}
                  label="Pagado por (integrantes) *"
                />
                {selectedMemberIds.length === 0 && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1">
                    * Debes seleccionar al menos un integrante
                  </p>
                )}
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
                  disabled={!title.trim() || !amount.trim() || selectedMemberIds.length === 0}
                  onClick={handleSave}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
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
