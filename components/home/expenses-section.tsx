'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Trash2, Edit2, X, Calendar, User, ShoppingCart, Gauge, Scale } from 'lucide-react'
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
  type UtilityType,
  type ConsumptionData,
  type ExpenseFrequency,
  EXPENSE_CATEGORIES,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_CONFIG,
  expenseCategoryMeta,
  formatCurrency,
  getExpenseMemberIds,
  isExpenseDueInMonth,
} from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const UTILITY_CONFIG: Record<UtilityType, { unit: string; unitPriceLabel: string }> = {
  electricidad: { unit: 'kWh', unitPriceLabel: 'Precio medio (€/kWh)' },
  agua: { unit: 'm³', unitPriceLabel: 'Precio medio (€/m³)' },
  gas: { unit: 'kWh', unitPriceLabel: 'Precio medio (€/kWh)' },
  internet_telefonia: { unit: 'ud', unitPriceLabel: 'Coste (€/mes)' },
  combustible: { unit: 'L', unitPriceLabel: 'Precio medio (€/L)' },
  otro: { unit: 'ud', unitPriceLabel: 'Precio medio (€/ud)' },
}

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
  const [frequency, setFrequency] = useState<ExpenseFrequency>('puntual')
  const [billingDay, setBillingDay] = useState('1')

  // Optional consumption fields (suministros: luz, agua, gas, etc.)
  const [hasConsumption, setHasConsumption] = useState(false)
  const [utilityType, setUtilityType] = useState<UtilityType>('electricidad')
  const [customUtilityName, setCustomUtilityName] = useState('')
  const [customUtilityUnit, setCustomUtilityUnit] = useState('')
  const [consumptionValue, setConsumptionValue] = useState('')
  const [unitPrice, setUnitPrice] = useState('')

  const currentUtilityMeta = utilityType === 'otro'
    ? { unit: customUtilityUnit.trim() || 'ud', unitPriceLabel: `Precio medio (€/${customUtilityUnit.trim() || 'ud'})` }
    : (UTILITY_CONFIG[utilityType] || UTILITY_CONFIG.electricidad)

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
    setFrequency('puntual')
    setBillingDay(new Date().getDate().toString())
    setHasConsumption(false)
    setUtilityType('electricidad')
    setCustomUtilityName('')
    setCustomUtilityUnit('')
    setConsumptionValue('')
    setUnitPrice('')
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
    const initialFreq: ExpenseFrequency = exp.frequency || (exp.isRecurring ? 'mensual' : 'puntual')
    setFrequency(initialFreq)
    setBillingDay((exp.billingDay || (exp.date ? parseInt(exp.date.split('-')[2] || '1', 10) : 1)).toString())
    
    if (exp.consumption && (exp.consumption.consumptionValue !== undefined && exp.consumption.consumptionValue !== null)) {
      setHasConsumption(true)
      setUtilityType(exp.consumption.utilityType || 'electricidad')
      setCustomUtilityName(exp.consumption.customUtilityName || '')
      setCustomUtilityUnit(exp.consumption.customUtilityUnit || '')
      setConsumptionValue(exp.consumption.consumptionValue ? exp.consumption.consumptionValue.toString() : '')
      setUnitPrice(exp.consumption.unitPrice !== undefined ? exp.consumption.unitPrice.toString() : '')
    } else {
      setHasConsumption(false)
      setUtilityType('electricidad')
      setCustomUtilityName('')
      setCustomUtilityUnit('')
      setConsumptionValue('')
      setUnitPrice('')
    }

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
    const isRec = frequency !== 'puntual'
    const parsedBillingDay = isRec ? Math.min(31, Math.max(1, parseInt(billingDay, 10) || 1)) : undefined

    const parsedUnits = parseFloat(consumptionValue.replace(',', '.')) || 0
    const rawPrice = unitPrice.trim() ? parseFloat(unitPrice.replace(',', '.')) : NaN
    const parsedPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : undefined

    let consumptionData: ConsumptionData | undefined = undefined
    if (hasConsumption) {
      consumptionData = {
        utilityType,
        customUtilityName: utilityType === 'otro' ? customUtilityName.trim() : undefined,
        customUtilityUnit: utilityType === 'otro' ? (customUtilityUnit.trim() || 'ud') : undefined,
        consumptionValue: parsedUnits > 0 ? parsedUnits : undefined,
        consumptionUnit: currentUtilityMeta.unit,
        unitPrice: parsedPrice,
      }
    }

    if (editingId) {
      updateExpense({
        id: editingId,
        groupId: '',
        title: title.trim(),
        amount: numAmount,
        category,
        customCategory: customCat,
        note: customCat,
        date,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        isRecurring: isRec,
        frequency,
        billingDay: parsedBillingDay,
        consumption: consumptionData,
      })
      toast('Gasto actualizado', '✅')
    } else {
      addExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        customCategory: customCat,
        note: customCat,
        date,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        isRecurring: isRec,
        frequency,
        billingDay: parsedBillingDay,
        consumption: consumptionData,
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
          <span>Registrar gasto</span>
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
            const noteText = exp.note || exp.customCategory

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
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 text-[10px] font-semibold capitalize text-slate-600 dark:text-slate-400">
                        {meta.label}
                      </span>
                      {exp.category === 'otros' && noteText && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          📝 {noteText}
                        </span>
                      )}
                      {((exp.frequency && exp.frequency !== 'puntual') || exp.isRecurring) && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          🔄 {EXPENSE_FREQUENCY_CONFIG[exp.frequency || 'mensual']?.label || 'Recurrente'} {exp.billingDay ? `(Día ${exp.billingDay})` : ''}
                        </span>
                      )}
                      {exp.consumption && (exp.consumption.consumptionValue || exp.consumption.customUtilityName || exp.consumption.utilityType) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Gauge className="size-2.5 shrink-0" />
                          <span>
                            {exp.consumption.consumptionValue ? `${exp.consumption.consumptionValue} ${exp.consumption.consumptionUnit || 'ud'}` : (exp.consumption.customUtilityName || 'Suministro')}
                            {exp.consumption.consumptionValue && exp.consumption.customUtilityName ? ` (${exp.consumption.customUtilityName})` : ''}
                          </span>
                        </span>
                      )}
                    </div>
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
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
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
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-500 dark:text-slate-400">
                      Nota u observación <span className="text-[10px] text-slate-400">(opcional)</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-purple-400 font-medium">
                      Se agrupa en "Otros"
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Ej: Netflix, Regalo cumpleaños, Reparación..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Fecha del gasto</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Periodicidad</label>
                  <CustomSelect<ExpenseFrequency>
                    value={frequency}
                    onChange={(val) => setFrequency(val)}
                    options={EXPENSE_FREQUENCIES}
                  />
                </div>
              </div>

              {/* Selector dinámico de día de cobro si es periódico (Bimestral, Trimestral, Mensual, Anual) */}
              {frequency !== 'puntual' && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="min-w-0">
                    <span className="font-bold text-amber-800 dark:text-amber-300 text-xs block">
                      Día exacto de cobro del ciclo
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cobro el día {billingDay || '1'} · Periodicidad {EXPENSE_FREQUENCY_CONFIG[frequency]?.label.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-slate-500">Día</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={billingDay}
                      onChange={(e) => setBillingDay(e.target.value)}
                      className="w-16 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-black/40 py-1.5 px-2 font-mono font-bold text-center text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Bloque Opcional de Consumo / Suministros */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasConsumption}
                    onChange={(e) => setHasConsumption(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Registrar consumo de suministros (luz, agua, gas, etc.)</span>
                </label>

                {hasConsumption && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2.5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400 text-xs">Tipo de suministro</label>
                        <CustomSelect<UtilityType>
                          value={utilityType}
                          onChange={(val) => setUtilityType(val)}
                          options={[
                            { value: 'electricidad', label: 'Electricidad (kWh)' },
                            { value: 'agua', label: 'Agua (m³)' },
                            { value: 'gas', label: 'Gas (kWh)' },
                            { value: 'internet_telefonia', label: 'Internet / Telefonía' },
                            { value: 'combustible', label: 'Combustible (L)' },
                            { value: 'otro', label: 'Otros suministros' },
                          ]}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400 text-xs">
                          Consumo ({currentUtilityMeta.unit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={consumptionValue}
                          onChange={(e) => setConsumptionValue(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Especificación de suministro y unidad si es 'otro' */}
                    {utilityType === 'otro' && (
                      <div className="space-y-2 p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 animate-fade-in">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-semibold">Sugerencias rápidas:</span>
                          {[
                            { name: 'Luz', unit: 'kWh' },
                            { name: 'Agua', unit: 'm³' },
                            { name: 'Gas', unit: 'kWh' },
                            { name: 'Internet / Fibra', unit: 'mes' },
                          ].map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setCustomUtilityName(item.name)
                                setCustomUtilityUnit(item.unit)
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-white/5"
                            >
                              {item.name} ({item.unit})
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                              Especificar suministro
                            </label>
                            <input
                              type="text"
                              value={customUtilityName}
                              onChange={(e) => setCustomUtilityName(e.target.value)}
                              placeholder="Ej: Luz, Agua, Gas, Internet..."
                              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1 px-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                              Unidad de medida
                            </label>
                            <input
                              type="text"
                              value={customUtilityUnit}
                              onChange={(e) => setCustomUtilityUnit(e.target.value)}
                              placeholder="Ej: kWh, m³, mes, botellas..."
                              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1 px-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-400 text-xs">
                        {currentUtilityMeta.unitPriceLabel} (opcional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
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
