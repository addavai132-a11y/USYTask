'use client'

import { useState } from 'react'
import { Plus, Receipt, CheckCircle2, Clock, AlertTriangle, Trash2, Edit2, X, RefreshCw, Zap, Droplets, Flame, Fuel, Sparkles } from 'lucide-react'
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

interface UtilityMeta {
  unit: string
  unitPriceLabel: string
  unitPriceSuffix: string
}

const UTILITY_CONFIG: Record<UtilityType, UtilityMeta> = {
  electricidad: {
    unit: 'kWh',
    unitPriceLabel: 'Precio medio (€/kWh)',
    unitPriceSuffix: '€/kWh',
  },
  agua: {
    unit: 'm³',
    unitPriceLabel: 'Precio medio (€/m³)',
    unitPriceSuffix: '€/m³',
  },
  gas: {
    unit: 'kWh',
    unitPriceLabel: 'Precio medio (€/kWh)',
    unitPriceSuffix: '€/kWh',
  },
  combustible: {
    unit: 'L',
    unitPriceLabel: 'Precio medio (€/L)',
    unitPriceSuffix: '€/L',
  },
  otro: {
    unit: 'ud',
    unitPriceLabel: 'Precio medio (€/ud)',
    unitPriceSuffix: '€/ud',
  },
}

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

  const [category, setCategory] = useState<any>('hogar')
  const [customCategoryInput, setCustomCategoryInput] = useState('')

  // Optional consumption fields
  const [hasConsumption, setHasConsumption] = useState(false)
  const [utilityType, setUtilityType] = useState<UtilityType>('electricidad')
  const [customUtilityName, setCustomUtilityName] = useState('')
  const [customUtilityUnit, setCustomUtilityUnit] = useState('')
  const [consumptionValue, setConsumptionValue] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
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

  const getUtilityMeta = (type: UtilityType, customUnit?: string): UtilityMeta => {
    if (type === 'otro') {
      const u = customUnit?.trim() || 'ud'
      return {
        unit: u,
        unitPriceLabel: `Precio medio (€/${u})`,
        unitPriceSuffix: `€/${u}`,
      }
    }
    return UTILITY_CONFIG[type] || UTILITY_CONFIG.electricidad
  }

  const currentUtilityMeta = getUtilityMeta(utilityType, customUtilityUnit)
  const unitLabel = currentUtilityMeta.unit

  // ── MANEJADORES DE CÁLCULO BIDIRECCIONAL ──
  const handleAmountChange = (val: string) => {
    setAmount(val)
    const numAmt = parseFloat(val)
    const numCons = parseFloat(consumptionValue)
    if (!isNaN(numAmt) && !isNaN(numCons) && numCons > 0) {
      const calc = numAmt / numCons
      setUnitPrice(calc.toFixed(4).replace(/\.?0+$/, ''))
    }
  }

  const handleConsumptionChange = (val: string) => {
    setConsumptionValue(val)
    const numCons = parseFloat(val)
    const numPrice = parseFloat(unitPrice)
    const numAmt = parseFloat(amount)

    if (!isNaN(numCons) && numCons > 0) {
      if (!isNaN(numPrice) && numPrice > 0) {
        setAmount((numCons * numPrice).toFixed(2))
      } else if (!isNaN(numAmt) && numAmt > 0) {
        setUnitPrice((numAmt / numCons).toFixed(4).replace(/\.?0+$/, ''))
      }
    }
  }

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val)
    const numPrice = parseFloat(val)
    const numCons = parseFloat(consumptionValue)
    if (!isNaN(numPrice) && !isNaN(numCons) && numCons > 0) {
      setAmount((numCons * numPrice).toFixed(2))
    }
  }

  function handleOpenCreate() {
    setEditingId(null)
    setName('')
    setAmount('')
    setBillingCycle('mensual')
    setDueDay('1')
    setCategory('hogar')
    setCustomCategoryInput('')
    setHasConsumption(false)
    setUtilityType('electricidad')
    setCustomUtilityName('')
    setCustomUtilityUnit('')
    setConsumptionValue('')
    setUnitPrice('')
    setKilometers('')
    setIsModalOpen(true)
  }

  function handleOpenEdit(bill: BillSubscription) {
    setEditingId(bill.id)
    setName(bill.name)
    setAmount(bill.amount.toString())
    setBillingCycle(bill.billingCycle)
    setDueDay(bill.dueDay.toString())
    setCategory(bill.category || 'hogar')
    setCustomCategoryInput(bill.customCategory || '')

    if (bill.consumption && bill.consumption.consumptionValue) {
      setHasConsumption(true)
      const uType = bill.consumption.utilityType || 'electricidad'
      setUtilityType(uType)
      setCustomUtilityName(bill.consumption.customUtilityName || '')
      setCustomUtilityUnit(bill.consumption.customUtilityUnit || '')
      const consVal = bill.consumption.consumptionValue.toString()
      setConsumptionValue(consVal)
      
      const calcPrice = bill.consumption.unitPrice
        ? bill.consumption.unitPrice.toString()
        : bill.amount && bill.consumption.consumptionValue
        ? (bill.amount / bill.consumption.consumptionValue).toFixed(4).replace(/\.?0+$/, '')
        : ''
      setUnitPrice(calcPrice)
      setKilometers(bill.consumption.kilometers ? bill.consumption.kilometers.toString() : '')
    } else {
      setHasConsumption(false)
      setUtilityType('electricidad')
      setCustomUtilityName('')
      setCustomUtilityUnit('')
      setConsumptionValue('')
      setUnitPrice('')
      setKilometers('')
    }

    setIsModalOpen(true)
  }

  function handleSave() {
    if (!name.trim()) {
      toast('Introduce el nombre o servicio de la factura', '❌')
      return
    }
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Introduce un importe válido', '❌')
      return
    }

    const numDueDay = parseInt(dueDay, 10) || 1
    const parsedUnits = parseFloat(consumptionValue) || 0
    const parsedPrice = parseFloat(unitPrice) || (parsedUnits > 0 ? numAmount / parsedUnits : 0)
    const parsedKm = parseFloat(kilometers) || 0

    let consumptionData: ConsumptionData | undefined = undefined
    if (hasConsumption && parsedUnits > 0) {
      consumptionData = {
        utilityType,
        customUtilityName: utilityType === 'otro' ? customUtilityName.trim() : undefined,
        customUtilityUnit: utilityType === 'otro' ? (customUtilityUnit.trim() || 'ud') : undefined,
        consumptionValue: parsedUnits,
        consumptionUnit: unitLabel,
        unitPrice: parsedPrice,
        kilometers: utilityType === 'combustible' && parsedKm > 0 ? parsedKm : undefined,
      }
    }

    if (editingId) {
      updateBill({
        id: editingId,
        groupId: '',
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: numDueDay,
        autopay: false,
        category,
        customCategory: category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined,
        status: 'pendiente',
        consumption: consumptionData,
      })
      toast('Factura actualizada', '✅')
    } else {
      addBill({
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: numDueDay,
        autopay: false,
        category,
        customCategory: category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined,
        status: 'pendiente',
        consumption: consumptionData,
      })
      toast('Factura añadida', '✅')
    }

    setIsModalOpen(false)
  }

  const getUtilityIcon = (type?: UtilityType) => {
    switch (type) {
      case 'electricidad':
        return <Zap className="size-3.5 text-purple-400" />
      case 'agua':
        return <Droplets className="size-3.5 text-blue-400" />
      case 'gas':
        return <Flame className="size-3.5 text-orange-400" />
      case 'combustible':
        return <Fuel className="size-3.5 text-emerald-400" />
      case 'otro':
        return <Sparkles className="size-3.5 text-purple-400" />
      default:
        return <Receipt className="size-3.5 text-purple-400" />
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Sub-navegación Superior (Pestañas de Facturas / Consumos) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<BillsSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'listado', label: 'Listado de Facturas' },
            { id: 'consumos', label: 'Consumos y Tarifas' },
          ]}
        />
      </div>

      {subTab === 'consumos' ? (
        <ConsumptionComparison onOpenAddBill={handleOpenCreate} />
      ) : (
        <>
          {/* ── Barra Resumen Superior Glassmorphism ── */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalMonthlyBillsSum)}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total mensual ({bills.length} facturas)</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Plus className="size-3.5" />
              <span>+ Añadir factura</span>
            </button>
          </div>

          {/* ── Upcoming Due Bills Alert (Compact) ── */}
          {upcomingBills.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {upcomingBills.length} factura{upcomingBills.length > 1 ? 's' : ''} vence{upcomingBills.length > 1 ? 'n' : ''} pronto:
                </span>{' '}
                <span className="text-amber-800 dark:text-amber-300">
                  {upcomingBills.map((b) => `${b.name} (día ${b.dueDay})`).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Bills List */}
          {bills.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="Sin facturas ni suscripciones registradas."
              action="+ Añadir primera factura"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bills.map((bill) => {
                const isPaid = bill.status === 'pagado'

                return (
                  <Card
                    key={bill.id}
                    className={cn(
                      'p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl',
                      isPaid && 'opacity-70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 shrink-0 mt-0.5">
                          {bill.consumption ? getUtilityIcon(bill.consumption.utilityType) : <Receipt className="size-3.5 text-purple-600 dark:text-purple-400" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                            {bill.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>Día {bill.dueDay}</span>
                            <span>·</span>
                            <span className="capitalize">{bill.billingCycle}</span>
                            {bill.autopay && <span>· Domiciliado</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(bill)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            confirmDelete({
                              title: '¿Eliminar factura?',
                              itemName: bill.name,
                              confirmText: 'Eliminar Factura',
                              onConfirm: () => {
                                deleteBill(bill.id)
                                toast('Factura eliminada', '🗑️')
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
                      <button
                        onClick={() => {
                          toggleBillStatus(bill.id)
                          toast(`Estado cambiado a ${!isPaid ? 'Pagado' : 'Pendiente'}`, '✅')
                        }}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all text-xs',
                          isPaid
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200'
                        )}
                      >
                        {isPaid ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                        <span>{isPaid ? 'Pagado' : 'Pendiente'}</span>
                      </button>

                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(bill.amount)}
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
                {editingId ? 'Editar Factura' : 'Añadir Factura o Suscripción'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Servicio / Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Luz Endesa, Internet Fibra, Netflix..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Importe (€) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-500 dark:text-slate-400">Ciclo de cobro</label>
                  <CustomSelect<BillingCycle>
                    value={billingCycle}
                    onChange={(val) => setBillingCycle(val)}
                    options={[
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'anual', label: 'Anual' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-500 dark:text-slate-400">Día habitual de cobro (1 - 31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="1"
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Registro Opcional de Consumo */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={hasConsumption}
                    onChange={(e) => setHasConsumption(e.target.checked)}
                    className="rounded accent-purple-600 size-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Registrar consumo / contador ({unitLabel})
                  </span>
                </label>

                {hasConsumption && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-purple-950/20 border border-slate-200 dark:border-purple-500/25 space-y-2.5 animate-fade-in">
                    {/* Fila de 3 columnas: Tipo | Consumo | Precio medio */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">Tipo suministro</label>
                        <CustomSelect<UtilityType>
                          value={utilityType}
                          onChange={(val) => setUtilityType(val)}
                          options={[
                            { value: 'electricidad', label: 'Electricidad (kWh)' },
                            { value: 'agua', label: 'Agua (m³)' },
                            { value: 'gas', label: 'Gas (kWh)' },
                            { value: 'combustible', label: 'Combustible (L)' },
                            { value: 'otro', label: 'Otro (Personalizado)' },
                          ]}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                          Consumo ({currentUtilityMeta.unit})
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={consumptionValue}
                            onChange={(e) => handleConsumptionChange(e.target.value)}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 pl-3 pr-10 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-600 dark:text-purple-400 pointer-events-none">
                            {currentUtilityMeta.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 truncate" title={currentUtilityMeta.unitPriceLabel}>
                          {currentUtilityMeta.unitPriceLabel}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={unitPrice}
                            onChange={(e) => handleUnitPriceChange(e.target.value)}
                            placeholder="0.0000"
                            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 pl-3 pr-12 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-purple-600 dark:text-purple-400 pointer-events-none">
                            {currentUtilityMeta.unitPriceSuffix}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Campos adicionales para 'Otro (Personalizado)' */}
                    {utilityType === 'otro' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10 animate-fade-in">
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                            Nombre del suministro
                          </label>
                          <input
                            type="text"
                            value={customUtilityName}
                            onChange={(e) => setCustomUtilityName(e.target.value)}
                            placeholder="Ej: Pellets, Leña, Butano, Internet..."
                            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                            Unidad de medida
                          </label>
                          <input
                            type="text"
                            value={customUtilityUnit}
                            onChange={(e) => setCustomUtilityUnit(e.target.value)}
                            placeholder="Ej: kg, saco, botellas, GB..."
                            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Campo adicional para Combustible: Kilometraje */}
                    {utilityType === 'combustible' && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-200 dark:border-white/5 animate-fade-in">
                        <label className="font-semibold text-[11px] text-slate-500 dark:text-slate-400">
                          Kilómetros recorridos (opcional)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={kilometers}
                          onChange={(e) => setKilometers(e.target.value)}
                          placeholder="Ej: 650 km"
                          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
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
