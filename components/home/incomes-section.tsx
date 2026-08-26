'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Trash2, Edit2, X, Calendar, User, Wallet } from 'lucide-react'
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
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Por favor, introduce un importe válido', '❌')
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
      toast('Ingreso registrado', '💶')
    }

    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Sub-navegación Superior (Pestañas de Listado / Comparativa) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<IncomesSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'historial', label: '💶 Historial de Ingresos' },
            { id: 'comparativa', label: '📈 Comparativa de Ingresos' },
          ]}
        />
      </div>

      {subTab === 'comparativa' ? (
        <IncomeComparison onOpenAddIncome={handleOpenCreate} />
      ) : (
        <>
          {/* ── Barra Resumen Superior Glassmorphism ── */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalMonthlyIncome)}</span>
              <span className="text-xs text-slate-400">ingresos mensuales ({incomes.length})</span>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Registrar ingreso</span>
            </button>
          </div>

          {/* Incomes List */}
          {incomes.length === 0 ? (
            <div className="w-full min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg">
                💶
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay ingresos ni nóminas registradas.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Registrar ingreso / nómina
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomes.map((inc) => {
                const memberIds = getIncomeMemberIds(inc)
                const memberList = memberIds.map((id) => getMemberById(id)).filter(Boolean)
                const displayCat = inc.category === 'otros' && inc.customCategory ? inc.customCategory : inc.category

                return (
                  <Card key={inc.id} className="p-4 border border-border/80 bg-card hover:bg-secondary/20 transition-all flex flex-col justify-between gap-3 shadow-soft group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {inc.title}
                        </h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold capitalize text-secondary-foreground">
                          {displayCat} · {inc.frequency}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(inc)}
                          className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
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
                          className="p-1.5 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        {memberList.length > 0 ? (
                          <div className="flex items-center -space-x-1.5">
                            {memberList.map((m) => (
                              <MemberAvatar key={m!.id} member={m!} size="sm" className="size-5 text-[10px]" />
                            ))}
                          </div>
                        ) : (
                          <User className="size-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground font-semibold">
                          {memberList.map((m) => m!.name).join(', ')}
                        </span>
                      </div>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
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

      {/* Modal Creador / Editor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">
                {editingId ? 'Editar Ingreso' : 'Registrar Ingreso / Nómina'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Concepto / Título <span className="text-red-500">*</span></label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Nómina Dav, Trabajo Extra..."
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
                  <label className="font-bold text-muted-foreground text-xs">Frecuencia</label>
                  <CustomSelect<IncomeFrequency>
                    value={frequency}
                    onChange={setFrequency}
                    options={[
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'quincenal', label: 'Quincenal' },
                      { value: 'puntual', label: 'Puntual' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Multi-Member Selection */}
              <MemberMultiSelect
                members={members}
                selectedIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
                label="Miembros perceptores"
              />

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground text-xs">Categoría</label>
                <CustomSelect<IncomeCategory>
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: 'nómina', label: 'Nómina' },
                    { value: 'inversiones', label: 'Inversiones' },
                    { value: 'alquiler', label: 'Alquiler' },
                    { value: 'otros', label: 'Otros' },
                  ]}
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

              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Fecha de cobro</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-2.5 px-3 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>

              <div className="mt-2 flex gap-2 justify-end">
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
                  className="rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-emerald-600"
                >
                  Guardar ingreso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
