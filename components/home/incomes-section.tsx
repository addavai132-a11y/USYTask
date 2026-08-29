'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, X, Wallet, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { PillTabs } from '@/components/ui/pill-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { IncomeComparison } from './income-comparison'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import { type Income, type IncomeCategory, type IncomeFrequency, formatCurrency, getIncomeMemberIds } from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type IncomesSubTab = 'historial' | 'comparativa'

export function IncomesSection() {
  const { toast } = useToast()
  const { incomes, members, getMemberById, addIncome, updateIncome, deleteIncome, confirmDelete } = useApp()

  const [subTab, setSubTab] = useState<IncomesSubTab>('historial')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [frequency, setFrequency] = useState<IncomeFrequency>('mensual')
  const [category, setCategory] = useState<IncomeCategory>('nómina')
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [date, setDate] = useState(getTodayISO())

  const totalMonthlyIncome = incomes.reduce((sum, inc) => {
    if (inc.frequency === 'mensual') return sum + inc.amount
    if (inc.frequency === 'quincenal') return sum + inc.amount * 2
    return sum
  }, 0)

  function handleOpenCreate() {
    setEditingId(null)
    setTitle('')
    setAmount('')
    setSelectedMemberIds([])
    setFrequency('mensual')
    setCategory('nómina')
    setCustomCategoryInput('')
    setDate(getTodayISO())
    setIsModalOpen(true)
  }

  function handleOpenEdit(inc: Income) {
    setEditingId(inc.id)
    setTitle(inc.title)
    setAmount(inc.amount.toString())
    setSelectedMemberIds(getIncomeMemberIds(inc))
    setFrequency(inc.frequency)
    setCategory(inc.category)
    setCustomCategoryInput(inc.customCategory || '')
    setDate(inc.date || getTodayISO())
    setIsModalOpen(true)
  }

  function handleSave() {
    if (!title.trim()) {
      toast('Por favor, introduce un concepto para el ingreso', '❌')
      return
    }
    const numAmount = parseFloat(amount.trim().replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Por favor, introduce un importe válido mayor que 0', '❌')
      return
    }

    const memberIds = selectedMemberIds.length > 0 ? selectedMemberIds : [members[0]?.id || '']
    const customCat = category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined

    if (editingId) {
      updateIncome({
        id: editingId,
        groupId: '',
        title: title.trim(),
        amount: numAmount,
        memberId: memberIds[0] || '',
        memberIds,
        frequency,
        category,
        customCategory: customCat,
        date,
      })
      toast('Ingreso actualizado', '✅')
    } else {
      addIncome({
        title: title.trim(),
        amount: numAmount,
        memberId: memberIds[0] || '',
        memberIds,
        frequency,
        category,
        customCategory: customCat,
        date,
      })
      toast('Ingreso registrado', '✅')
    }

    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Sub-navegación Superior (Pestañas de Listado / Comparativa) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<IncomesSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'historial', label: 'Historial de Ingresos' },
            { id: 'comparativa', label: 'Comparativa' },
          ]}
        />
      </div>

      {subTab === 'comparativa' ? (
        <IncomeComparison onOpenAddIncome={handleOpenCreate} />
      ) : (
        <>
          {/* ── Barra Resumen Superior Glassmorphism ── */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalMonthlyIncome)}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total mensual ({incomes.length} ingresos)</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Registrar ingreso</span>
            </button>
          </div>

          {/* Incomes List */}
          {incomes.length === 0 ? (
            <EmptyState
              emoji="💼"
              title="Sin ingresos ni nóminas registradas."
              action="+ Registrar ingreso / nómina"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomes.map((inc) => {
                const memberIds = getIncomeMemberIds(inc)
                const memberList = memberIds.map((id) => getMemberById(id)).filter(Boolean)
                const displayCat = inc.category === 'otros' && inc.customCategory ? inc.customCategory : inc.category

                return (
                  <Card
                    key={inc.id}
                    className="p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                          {inc.title}
                        </h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 text-[10px] font-semibold capitalize text-slate-600 dark:text-slate-400">
                          {displayCat} · {inc.frequency}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            confirmDelete({
                              title: '¿Eliminar ingreso?',
                              itemName: inc.title,
                              confirmText: 'Eliminar Ingreso',
                              onConfirm: () => {
                                deleteIncome(inc.id)
                                toast('Ingreso eliminado', '🗑️')
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
                          {memberList.map((m) => m!.name).join(', ') || 'General'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(inc.amount)}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── MODAL CREADOR / EDITOR ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Ingreso' : 'Registrar Ingreso / Nómina'}
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
                  placeholder="Ej: Nómina Adrian, Extra freelance..."
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
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Frecuencia</label>
                  <CustomSelect<IncomeFrequency>
                    value={frequency}
                    onChange={(val) => setFrequency(val)}
                    options={[
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'quincenal', label: 'Quincenal' },
                      { value: 'puntual', label: 'Puntual' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Categoría</label>
                  <CustomSelect<IncomeCategory>
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={[
                      { value: 'nómina', label: 'Nómina' },
                      { value: 'inversiones', label: 'Inversiones' },
                      { value: 'alquiler', label: 'Alquiler' },
                      { value: 'otros', label: 'Otros' },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Fecha de cobro</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
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
                    placeholder="Ej: Beca, Reembolso..."
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                  />
                </div>
              )}

              <MemberMultiSelect
                members={members}
                selectedIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
                label="Asignar integrantes perceptores"
              />

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
