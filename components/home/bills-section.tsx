'use client'

import { useState } from 'react'
import { Plus, Receipt, CheckCircle2, Clock, AlertTriangle, Trash2, Edit2, X, Sparkles, RefreshCw, Zap, Droplets, Flame, Fuel, Gauge } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { PillTabs } from '@/components/ui/pill-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { ConsumptionComparison } from './consumption-comparison'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  type BillSubscription,
  type BillingCycle,
  type BillStatus,
  type UtilityType,
  type ConsumptionData,
  formatCurrency,
} from '@/types/finances'
import { cn } from '@/lib/utils'

type BillsSubTab = 'listado' | 'consumos'

export function BillsSection() {
  const { toast } = useToast()
  const { bills, addBill, updateBill, deleteBill, toggleBillStatus, confirmDelete } = useApp()

  const [subTab, setSubTab] = useState<BillsSubTab>('listado')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('mensual')
  const [dueDay, setDueDay] = useState('1')
  const [autopay, setAutopay] = useState(false)

  const [category, setCategory] = useState<any>('hogar')
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  // Optional consumption fields
  const [hasConsumption, setHasConsumption] = useState(false)
  const [utilityType, setUtilityType] = useState<UtilityType>('electricidad')
  const [consumptionValue, setConsumptionValue] = useState('')
  const [kilometers, setKilometers] = useState('')

  // Current day of month
  const todayDate = new Date()
  const currentDay = todayDate.getDate()

  // Calculate upcoming due bills in the next 5 days
  const upcomingBills = bills.filter((b) => {
    if (b.status === 'pagado') return false
    const diff = b.dueDay - currentDay
    return diff >= 0 && diff <= 5
  })

  const totalMonthlyBillsSum = bills.reduce((sum, b) => {
    if (b.billingCycle === 'mensual') return sum + b.amount
    return sum + b.amount / 12
  }, 0)

  // Real-time calculated unit prices
  const parsedAmount = parseFloat(amount) || 0
  const parsedUnits = parseFloat(consumptionValue) || 0
  const parsedKm = parseFloat(kilometers) || 0

  const calculatedUnitPrice = parsedUnits > 0 ? parsedAmount / parsedUnits : 0
  const calculatedCostPer100Km = parsedKm > 0 ? (parsedAmount / parsedKm) * 100 : 0

  const unitLabel = utilityType === 'electricidad' || utilityType === 'gas' ? 'kWh' : utilityType === 'agua' ? 'm³' : 'L'

  function handleOpenCreate() {
    setEditingId(null)
    setName('')
    setAmount('')
    setBillingCycle('mensual')
    setDueDay('1')
    setAutopay(false)
    setCategory('hogar')
    setCustomCategoryInput('')
    setHasConsumption(false)
    setUtilityType('electricidad')
    setConsumptionValue('')
    setKilometers('')
    setIsModalOpen(true)
  }

  function handleOpenEdit(bill: BillSubscription) {
    setEditingId(bill.id)
    setName(bill.name)
    setAmount(bill.amount.toString())
    setBillingCycle(bill.billingCycle)
    setDueDay(bill.dueDay.toString())
    setAutopay(bill.autopay)
    setCategory(bill.category || 'hogar')
    setCustomCategoryInput(bill.customCategory || '')

    if (bill.consumption && bill.consumption.consumptionValue) {
      setHasConsumption(true)
      setUtilityType(bill.consumption.utilityType || 'electricidad')
      setConsumptionValue(bill.consumption.consumptionValue.toString())
      setKilometers(bill.consumption.kilometers ? bill.consumption.kilometers.toString() : '')
    } else {
      setHasConsumption(false)
      setUtilityType('electricidad')
      setConsumptionValue('')
      setKilometers('')
    }

    setIsModalOpen(true)
  }

  function handleSave() {
    if (!name.trim()) {
      toast('Por favor, introduce un nombre para la factura o servicio', '❌')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Por favor, introduce un importe válido', '❌')
      return
    }

    const dayNum = parseInt(dueDay, 10)
    const validDay = isNaN(dayNum) ? 1 : Math.max(1, Math.min(31, dayNum))
    const customCat = category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined

    let consumptionData: ConsumptionData | undefined = undefined
    if (hasConsumption && parsedUnits > 0) {
      consumptionData = {
        utilityType,
        consumptionUnit: unitLabel,
        consumptionValue: parsedUnits,
        kilometers: parsedKm > 0 ? parsedKm : undefined,
        unitPrice: calculatedUnitPrice,
      }
    }

    if (editingId) {
      const existing = bills.find((b) => b.id === editingId)
      updateBill({
        id: editingId,
        groupId: '',
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: validDay,
        autopay,
        category,
        customCategory: customCat,
        status: existing?.status || 'pendiente',
        lastPaidDate: existing?.lastPaidDate,
        consumption: consumptionData,
      })
      toast('Factura actualizada', '✅')
    } else {
      addBill({
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: validDay,
        autopay,
        category,
        customCategory: customCat,
        consumption: consumptionData,
      })
      toast('Factura / Suscripción guardada', '📄')
    }

    setIsModalOpen(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Sub-navegación: Facturas vs Comparativa de Consumos ── */}
      <div className="w-fit mx-auto flex items-center justify-center p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<BillsSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'listado', label: '📄 Facturas y Suscripciones' },
            { id: 'consumos', label: '📊 Comparativa de Consumos' },
          ]}
        />
      </div>

      {subTab === 'consumos' ? (
        <ConsumptionComparison onOpenAddBill={handleOpenCreate} />
      ) : (
        <>
          {/* ── Barra Resumen Superior Glassmorphism ── */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white tabular-nums">{formatCurrency(totalMonthlyBillsSum)}</span>
              <span className="text-xs text-slate-400">suministros y servicios ({bills.length})</span>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Añadir factura</span>
            </button>
          </div>

          {/* 5-day Upcoming Due Alert Banner */}
          {upcomingBills.length > 0 && (
            <div className="p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">
                  ¡Facturas con vencimiento próximo! ({upcomingBills.length})
                </h4>
                <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">
                  Suministros o servicios a cobrar en los próximos 5 días:{' '}
                  <strong>{upcomingBills.map((b) => `${b.name} (Día ${b.dueDay})`).join(', ')}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Bills List */}
          {bills.length === 0 ? (
            <div className="w-full min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
                📄
              </div>
              <p className="text-xs text-slate-400 max-w-xs">Sin facturas ni suscripciones registradas.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Añadir factura o suscripción
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bills.map((bill) => {
                const isPaid = bill.status === 'pagado'
                const daysLeft = bill.dueDay - currentDay
                const isDueSoon = !isPaid && daysLeft >= 0 && daysLeft <= 5

                return (
                  <Card
                    key={bill.id}
                    className={cn(
                      'p-4 border transition-all flex flex-col justify-between gap-3 shadow-soft relative group',
                      isPaid
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : isDueSoon
                        ? 'bg-amber-500/5 border-amber-500/40'
                        : 'bg-card border-border/80 hover:bg-secondary/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex size-10 items-center justify-center rounded-2xl font-black text-lg',
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : isDueSoon
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {bill.category === 'transporte' ? '🚗' : bill.name.toLowerCase().includes('luz') ? '⚡' : bill.name.toLowerCase().includes('agua') ? '💧' : bill.name.toLowerCase().includes('gas') ? '🔥' : '📄'}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-foreground">{bill.name}</h4>
                          <span className="inline-block mt-0.5 text-xs text-muted-foreground font-semibold capitalize">
                            Día {bill.dueDay} de cada mes · {bill.billingCycle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(bill)}
                          className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            confirmDelete({
                              title: '¿Eliminar factura / suscripción?',
                              itemName: bill.name,
                              confirmText: 'Eliminar Factura',
                              onConfirm: () => {
                                deleteBill(bill.id)
                                toast('Factura eliminada', '🗑️')
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

                    {/* Metric / Consumption badge if present */}
                    {bill.consumption && bill.consumption.consumptionValue ? (
                      <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                        <span>Consumo: <strong>{bill.consumption.consumptionValue} {bill.consumption.consumptionUnit}</strong></span>
                        {bill.consumption.unitPrice ? (
                          <span>Precio: <strong>{bill.consumption.unitPrice.toFixed(3)} €/{bill.consumption.consumptionUnit}</strong></span>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Amount & Status Action */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <div>
                        <p className="text-lg font-black text-foreground">
                          {formatCurrency(bill.amount)}
                        </p>
                        {bill.autopay && (
                          <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                            <RefreshCw className="size-2.5 text-primary" /> Domiciliado
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          toggleBillStatus(bill.id)
                          toast(
                            isPaid ? 'Factura marcada como pendiente' : 'Factura marcada como pagada',
                            isPaid ? '⏳' : '✅'
                          )
                        }}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs',
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : isDueSoon
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                        )}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="size-3.5" />
                            <span>Pagado</span>
                          </>
                        ) : isDueSoon ? (
                          <>
                            <AlertTriangle className="size-3.5" />
                            <span>¡Pagar hoy!</span>
                          </>
                        ) : (
                          <>
                            <Clock className="size-3.5" />
                            <span>Marcar pagado</span>
                          </>
                        )}
                      </button>
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
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">
                {editingId ? 'Editar Factura / Suscripción' : 'Añadir Factura o Suscripción'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Nombre del Servicio / Suministro <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Luz / Endesa, Agua, Gas, Gasolina Repsol, Netflix..."
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
                <div className="w-32 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Día de cobro (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-3 text-xs font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground text-xs">Ciclo de facturación</label>
                  <CustomSelect<BillingCycle>
                    value={billingCycle}
                    onChange={setBillingCycle}
                    options={[
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'anual', label: 'Anual' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground text-xs">Categoría</label>
                  <CustomSelect<string>
                    value={category}
                    onChange={(val) => setCategory(val as any)}
                    options={[
                      { value: 'hogar', label: 'Hogar', icon: '🛋️' },
                      { value: 'vivienda', label: 'Vivienda', icon: '🏠' },
                      { value: 'transporte', label: 'Transporte', icon: '🚗' },
                      { value: 'ocio', label: 'Ocio', icon: '🎬' },
                      { value: 'salud', label: 'Salud', icon: '💊' },
                      { value: 'educación', label: 'Educación', icon: '📚' },
                      { value: 'otros', label: 'Otros', icon: '✨' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

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

              {/* ── BLOQUE DE CONSUMO Y SUMINISTRO (OPCIONAL) ── */}
              <div className="pt-2 border-t border-border/40 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConsumption}
                    onChange={(e) => setHasConsumption(e.target.checked)}
                    className="size-4 rounded border-border text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1">
                    <Gauge className="size-3.5 text-purple-400" />
                    Registrar lectura / unidades de consumo (opcional)
                  </span>
                </label>

                {hasConsumption && (
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3 animate-fade-in">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-muted-foreground text-[11px]">Tipo de Suministro</label>
                      <CustomSelect<UtilityType>
                        value={utilityType}
                        onChange={setUtilityType}
                        options={[
                          { value: 'electricidad', label: '⚡ Electricidad (kWh)' },
                          { value: 'agua', label: '💧 Agua (m³)' },
                          { value: 'gas', label: '🔥 Gas Natural (kWh)' },
                          { value: 'combustible', label: '⛽ Gasolina / Diésel (Litros)' },
                        ]}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2.5">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="font-bold text-muted-foreground text-[11px]">
                          Consumo ({unitLabel})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={consumptionValue}
                          onChange={(e) => setConsumptionValue(e.target.value)}
                          placeholder={`Ej. ${utilityType === 'electricidad' ? '280' : utilityType === 'agua' ? '12' : utilityType === 'gas' ? '350' : '45'}`}
                          className="w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      {utilityType === 'combustible' && (
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="font-bold text-muted-foreground text-[11px]">
                            Kilómetros recorridos
                          </label>
                          <input
                            type="number"
                            value={kilometers}
                            onChange={(e) => setKilometers(e.target.value)}
                            placeholder="Ej. 650 km"
                            className="w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Precios calculados en tiempo real */}
                    {parsedUnits > 0 && parsedAmount > 0 && (
                      <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] font-bold text-purple-200 flex items-center justify-between">
                        <span>Coste unitario: <strong className="text-white">{calculatedUnitPrice.toFixed(3)} €/{unitLabel}</strong></span>
                        {utilityType === 'combustible' && parsedKm > 0 ? (
                          <span>Consumo: <strong className="text-white">{calculatedCostPer100Km.toFixed(2)} €/100km</strong></span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autopay}
                  onChange={(e) => setAutopay(e.target.checked)}
                  className="size-4 rounded border-border text-purple-600 focus:ring-purple-500"
                />
                <span className="font-bold text-muted-foreground text-xs">Pago automático (Domiciliado)</span>
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
                  className="rounded-2xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-purple-700"
                >
                  Guardar servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
