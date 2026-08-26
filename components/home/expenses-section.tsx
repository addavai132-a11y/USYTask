'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Trash2, Edit2, X, Calendar, User, ShoppingCart, AlertCircle } from 'lucide-react'
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
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Por favor, introduce un importe válido', '❌')
      return
    }

    const memberIds = selectedMemberIds.length > 0 ? selectedMemberIds : [members[0]?.id || '']
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
      toast('Gasto registrado', '💸')
    }

    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalFilteredSum)}</span>
          <span className="text-xs text-slate-400">gastos del mes ({filtered.length})</span>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Registrar gasto</span>
        </button>
      </div>

      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar gasto por concepto..."
            className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2 px-3 pl-8 text-xs font-semibold text-white outline-none focus:border-purple-500"
          />
        </div>

        <CustomSelect<string>
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { id: 'all', label: 'Todas las categorías' },
            ...EXPENSE_CATEGORIES.map((c) => ({
              id: c,
              label: `${expenseCategoryMeta[c]?.icon || '📦'} ${c.charAt(0).toUpperCase() + c.slice(1)}`,
            })),
          ]}
          className="w-full sm:w-44"
        />

        <MemberFilterDropdown
          members={members}
          value={memberFilter}
          onChange={setMemberFilter}
          className="w-full sm:w-40"
        />
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <EmptyState
          emoji="💸"
          title="No hay gastos registrados"
          description="Añade los gastos diarios, compras del supermercado o compras variables."
          action="+ Registrar primer gasto"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((exp) => {
            const meta = expenseCategoryMeta[exp.category] || { label: exp.category, icon: '📦', color: 'gray' }
            const isCustom = exp.category === 'otros' && exp.customCategory
            const memberIds = getExpenseMemberIds(exp)
            const paidMembers = memberIds.map((id) => getMemberById(id)).filter(Boolean)

            return (
              <Card
                key={exp.id}
                className="p-3.5 flex flex-col gap-2 bg-white/[0.03] border-white/10 hover:border-purple-500/30 transition-all rounded-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shrink-0 text-base">
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                          {isCustom ? exp.customCategory : meta.label}
                        </span>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {exp.date}
                        </span>

                        {exp.isRecurring && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
                            Recurrente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-base font-black text-rose-400 tabular-nums">
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Associated Members & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[11px]">Pagado por:</span>
                    {paidMembers.length === 0 ? (
                      <span className="text-[11px] italic">General del hogar</span>
                    ) : (
                      <div className="flex items-center -space-x-1.5">
                        {paidMembers.map((m) => (
                          <div key={m!.id} className="relative group/m" title={m!.name}>
                            <MemberAvatar member={m!} size="sm" ring />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Editar gasto"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        confirmDelete({
                          title: '¿Eliminar este gasto?',
                          itemName: exp.title,
                          description: 'Se restará del balance total y desaparecerá del historial de gastos.',
                          confirmText: 'Eliminar Gasto',
                          onConfirm: () => {
                            deleteExpense(exp.id)
                            toast(`"${exp.title}" eliminado`, '🗑️')
                          },
                        })
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
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
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">
                {editingId ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Concepto / Título del Gasto <span className="text-red-500">*</span></label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Compra semanal Mercadona, Gasolina..."
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Importe (€) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Fecha del gasto</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Multi-Member Selector */}
              <MemberMultiSelect
                members={members}
                selectedIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
                label="Miembros pagadores / asociados"
              />

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground text-xs">Categoría</label>
                <CustomSelect<ExpenseCategory>
                  value={category}
                  onChange={setCategory}
                  options={EXPENSE_CATEGORIES.map((cat) => ({
                    value: cat,
                    label: expenseCategoryMeta[cat].label,
                    icon: expenseCategoryMeta[cat].icon,
                  }))}
                  className="w-full"
                />
              </div>

              {/* Custom Category Input if "Otros" */}
              {category === 'otros' && (
                <div className="flex flex-col gap-1 animate-fade-in">
                  <label className="font-bold text-muted-foreground">Especifica la categoría/concepto <span className="text-red-500">*</span></label>
                  <input
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Escribe la categoría personalizada..."
                    className="w-full rounded-2xl border border-border bg-card py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-bold text-muted-foreground text-xs">Marcar como gasto mensual recurrente</span>
              </label>

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
                  className="rounded-2xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-rose-600"
                >
                  Guardar gasto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
