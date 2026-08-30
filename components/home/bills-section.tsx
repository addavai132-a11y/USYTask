'use client'

import { useState } from 'react'
import {
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Zap,
  Droplets,
  Flame,
  Fuel,
  Sparkles,
  Wifi,
  Play,
  Pause,
  Ban,
  RotateCcw,
  Calendar,
  Layers,
  Film,
  Music,
  Home,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { PillTabs } from '@/components/ui/pill-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { ConsumptionComparison } from './consumption-comparison'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  type BillSubscription,
  type BillingCycle,
  type BillStatus,
  type SubscriptionStatus,
  type ExpenseCategory,
  type UtilityType,
  type ConsumptionData,
  EXPENSE_CATEGORIES,
  expenseCategoryMeta,
  formatCurrency,
} from '@/types/finances'
import { cn } from '@/lib/utils'

type BillsSubTab = 'listado' | 'suscripciones' | 'consumos'
type SubscriptionsFilter = 'activas' | 'canceladas' | 'todas'

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
  internet_telefonia: {
    unit: 'ud',
    unitPriceLabel: 'Coste/mes (€/ud)',
    unitPriceSuffix: '€/ud',
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
  const {
    bills,
    members,
    getMemberById,
    addBill,
    updateBill,
    deleteBill,
    toggleBillStatus,
    cancelBillSubscription,
    reactivateBillSubscription,
    pauseBillSubscription,
    confirmDelete,
  } = useApp()

  const [subTab, setSubTab] = useState<BillsSubTab>('listado')
  const [subFilter, setSubFilter] = useState<SubscriptionsFilter>('activas')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('mensual')
  const [dueDay, setDueDay] = useState('1')
  const [autopay, setAutopay] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  const [category, setCategory] = useState<ExpenseCategory>('hogar')
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

  // Active vs Cancelled Subscriptions
  const activeBills = bills.filter((b) => b.subscriptionStatus !== 'cancelada' && b.subscriptionStatus !== 'pausada' && b.isActive !== false)
  const inactiveBills = bills.filter((b) => b.subscriptionStatus === 'cancelada' || b.subscriptionStatus === 'pausada' || b.isActive === false)

  // Calculate upcoming due bills in the next 5 days
  const upcomingBills = activeBills.filter((b) => {
    if (b.status === 'pagado') return false
    const diff = b.dueDay - currentDay
    return diff >= 0 && diff <= 5
  })

  const totalMonthlyBillsSum = activeBills.reduce((sum, b) => {
    if (b.billingCycle === 'mensual') return sum + b.amount
    return sum + b.amount / 12
  }, 0)

  const totalAnnualBillsSum = totalMonthlyBillsSum * 12

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

  function handleOpenCreate() {
    setEditingId(null)
    setName('')
    setAmount('')
    setBillingCycle('mensual')
    setDueDay(new Date().getDate().toString())
    setAutopay(false)
    setSelectedMemberIds([])
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
    setAutopay(bill.autopay || false)
    setSelectedMemberIds(bill.paidByMemberIds || (bill.paidByMemberId ? [bill.paidByMemberId] : []))
    setCategory(bill.category || 'hogar')
    setCustomCategoryInput(bill.customCategory || '')

    if (bill.consumption && (bill.consumption.consumptionValue !== undefined && bill.consumption.consumptionValue !== null)) {
      setHasConsumption(true)
      const uType = bill.consumption.utilityType || 'electricidad'
      setUtilityType(uType)
      setCustomUtilityName(bill.consumption.customUtilityName || '')
      setCustomUtilityUnit(bill.consumption.customUtilityUnit || '')
      const consVal = bill.consumption.consumptionValue ? bill.consumption.consumptionValue.toString() : ''
      setConsumptionValue(consVal)
      
      const savedPrice = bill.consumption.unitPrice !== undefined && bill.consumption.unitPrice !== null
        ? bill.consumption.unitPrice.toString()
        : ''
      setUnitPrice(savedPrice)
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
      toast('Introduce el nombre o servicio de la suscripción / factura', '❌')
      return
    }
    const numAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numAmount) || numAmount <= 0) {
      toast('Introduce un importe válido', '❌')
      return
    }

    const numDueDay = Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1))
    const parsedUnits = parseFloat(consumptionValue.replace(',', '.')) || 0
    const rawPrice = unitPrice.trim() ? parseFloat(unitPrice.replace(',', '.')) : NaN
    const parsedPrice = !isNaN(rawPrice) && rawPrice >= 0 ? rawPrice : undefined
    const parsedKm = parseFloat(kilometers.replace(',', '.')) || 0

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

    const memberIds = selectedMemberIds

    if (editingId) {
      const existing = bills.find((b) => b.id === editingId)
      updateBill({
        id: editingId,
        groupId: existing?.groupId || '',
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: numDueDay,
        autopay,
        category,
        customCategory: category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined,
        status: existing?.status || 'pendiente',
        subscriptionStatus: existing?.subscriptionStatus || 'activa',
        isActive: existing?.isActive !== undefined ? existing.isActive : true,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        consumption: consumptionData,
      })
      toast('Suscripción / Factura actualizada. Los meses futuros usarán el nuevo importe.', '✅')
    } else {
      addBill({
        name: name.trim(),
        amount: numAmount,
        billingCycle,
        dueDay: numDueDay,
        autopay,
        category,
        customCategory: category === 'otros' && customCategoryInput.trim() ? customCategoryInput.trim() : undefined,
        status: 'pendiente',
        subscriptionStatus: 'activa',
        isActive: true,
        paidByMemberId: memberIds[0] || '',
        paidByMemberIds: memberIds,
        consumption: consumptionData,
      })
      toast('Suscripción / Gasto recurrente añadido', '✅')
    }

    setIsModalOpen(false)
  }

  const handleCancelSubscription = (bill: BillSubscription) => {
    confirmDelete({
      title: '¿Dar de baja suscripción?',
      itemName: bill.name,
      description: 'Se pausará la generación automática de cobros en los meses siguientes. Podrás reactivarla cuando quieras desde la pestaña de Canceladas.',
      confirmText: 'Dar de Baja',
      onConfirm: () => {
        cancelBillSubscription(bill.id)
        toast(`Suscripción "${bill.name}" cancelada`, '⏸️')
      },
    })
  }

  const handleReactivateSubscription = (bill: BillSubscription) => {
    reactivateBillSubscription(bill.id)
    toast(`Suscripción "${bill.name}" reactivada con éxito`, '✅')
  }

  const handlePauseSubscription = (bill: BillSubscription) => {
    pauseBillSubscription(bill.id)
    toast(`Suscripción "${bill.name}" pausada`, '⏸️')
  }

  const handleDelete = (bill: BillSubscription) => {
    confirmDelete({
      title: '¿Eliminar suscripción / factura?',
      itemName: bill.name,
      description: 'Esta acción eliminará la suscripción permanentemente del sistema.',
      confirmText: 'Eliminar Definitivamente',
      onConfirm: () => {
        deleteBill(bill.id)
        toast(`"${bill.name}" eliminada`, '🗑️')
      },
    })
  }

  const getUtilityOrBrandIcon = (bill: BillSubscription) => {
    const nameLower = bill.name.toLowerCase()
    if (nameLower.includes('netflix') || nameLower.includes('hbo') || nameLower.includes('disney') || nameLower.includes('prime') || nameLower.includes('cine')) {
      return <Film className="size-4 text-rose-500" />
    }
    if (nameLower.includes('spotify') || nameLower.includes('apple music') || nameLower.includes('tidal') || nameLower.includes('musica')) {
      return <Music className="size-4 text-emerald-500" />
    }
    if (nameLower.includes('alquiler') || nameLower.includes('hipoteca') || nameLower.includes('comunidad')) {
      return <Home className="size-4 text-indigo-500" />
    }
    if (nameLower.includes('gym') || nameLower.includes('gimnasio') || nameLower.includes('fitness')) {
      return <Dumbbell className="size-4 text-cyan-500" />
    }
    if (nameLower.includes('seguro')) {
      return <ShieldCheck className="size-4 text-blue-500" />
    }

    switch (bill.consumption?.utilityType) {
      case 'electricidad':
        return <Zap className="size-4 text-amber-500" />
      case 'agua':
        return <Droplets className="size-4 text-blue-400" />
      case 'gas':
        return <Flame className="size-4 text-orange-400" />
      case 'internet_telefonia':
        return <Wifi className="size-4 text-sky-400" />
      case 'combustible':
        return <Fuel className="size-4 text-emerald-400" />
      default:
        return <Receipt className="size-4 text-slate-600 dark:text-purple-300" />
    }
  }

  // Filtered subscriptions list for the 'suscripciones' tab
  const displayedSubscriptions = bills.filter((b) => {
    if (subFilter === 'activas') return b.subscriptionStatus !== 'cancelada' && b.subscriptionStatus !== 'pausada' && b.isActive !== false
    if (subFilter === 'canceladas') return b.subscriptionStatus === 'cancelada' || b.subscriptionStatus === 'pausada' || b.isActive === false
    return true
  })

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Sub-navegación Superior (Pestañas de Facturas / Suscripciones / Consumos) ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<BillsSubTab>
          value={subTab}
          onChange={setSubTab}
          showScrollArrows={false}
          tabs={[
            { id: 'listado', label: 'Facturas del Mes' },
            { id: 'suscripciones', label: `Suscripciones / Recurrentes (${activeBills.length})` },
            { id: 'consumos', label: 'Consumos y Tarifas' },
          ]}
        />
      </div>

      {/* ── TAB 1: LISTADO DE FACTURAS Y PAGOS MENSUALES ── */}
      {subTab === 'listado' && (
        <>
          {/* Barra Resumen Superior */}
          <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {formatCurrency(totalMonthlyBillsSum)}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total activo del mes ({activeBills.length} conceptos)</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
            >
              <Plus className="size-3.5" />
              <span>+ Añadir Factura / Gasto</span>
            </button>
          </div>

          {/* Upcoming Due Bills Alert */}
          {upcomingBills.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {upcomingBills.length} pago{upcomingBills.length > 1 ? 's' : ''} vence{upcomingBills.length > 1 ? 'n' : ''} pronto:
                </span>{' '}
                <span className="text-amber-800 dark:text-amber-300">
                  {upcomingBills.map((b) => `${b.name} (día ${b.dueDay})`).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Bills List */}
          {activeBills.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="Sin facturas activas este mes."
              action="+ Añadir primera factura"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeBills.map((bill) => {
                const isPaid = bill.status === 'pagado'
                const memberList = (bill.paidByMemberIds || (bill.paidByMemberId ? [bill.paidByMemberId] : []))
                  .map((id) => getMemberById(id))
                  .filter(Boolean)

                return (
                  <Card
                    key={bill.id}
                    className={cn(
                      'p-3.5 sm:p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-500/30 dark:hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl',
                      isPaid && 'opacity-70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 shrink-0 mt-0.5">
                          {getUtilityOrBrandIcon(bill)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                            {bill.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Día {bill.dueDay} de cada mes
                            </span>
                            <span>·</span>
                            <span className="capitalize">{bill.billingCycle}</span>
                            {bill.autopay && (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                Domiciliado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(bill)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Editar factura"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bill)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-600 transition-colors"
                          title="Eliminar factura"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div className="flex items-center gap-1.5">
                        {memberList.length > 0 && (
                          <div className="flex items-center -space-x-1.5">
                            {memberList.map((m) => (
                              <MemberAvatar key={m!.id} member={m!} size="sm" />
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleBillStatus(bill.id)}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all text-xs active:scale-95',
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                          )}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Pagado</span>
                            </>
                          ) : (
                            <>
                              <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
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

      {/* ── TAB 2: SUSCRIPCIONES Y GASTOS RECURRENTES DEDICADOS ── */}
      {subTab === 'suscripciones' && (
        <div className="space-y-4">
          {/* Header Dashboard Suscripciones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3.5 bg-white dark:bg-[#121026] border border-slate-200 dark:border-purple-500/20 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gasto Mensual Fijo
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
                {formatCurrency(totalMonthlyBillsSum)}
              </p>
            </Card>

            <Card className="p-3.5 bg-white dark:bg-[#121026] border border-slate-200 dark:border-purple-500/20 rounded-2xl shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gasto Anual Estimado
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-300 tabular-nums mt-1">
                {formatCurrency(totalAnnualBillsSum)}
              </p>
            </Card>

            <Card className="col-span-2 sm:col-span-1 p-3.5 bg-white dark:bg-[#121026] border border-slate-200 dark:border-purple-500/20 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Suscripciones Activas
                </span>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  {activeBills.length} activas
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-2 text-xs font-bold transition-all shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
                title="Nueva suscripción"
              >
                <Plus className="size-4" />
              </button>
            </Card>
          </div>

          {/* Filtro de Estado: Activas / Canceladas / Todas */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSubFilter('activas')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  subFilter === 'activas'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-purple-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Activas ({activeBills.length})
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('canceladas')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                  subFilter === 'canceladas'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-purple-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Canceladas / Pausa ({inactiveBills.length})
              </button>
              <button
                type="button"
                onClick={() => setSubFilter('todas')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all hidden sm:inline-block',
                  subFilter === 'todas'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-purple-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                Todas ({bills.length})
              </button>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-purple-300 hover:underline px-2"
            >
              <Plus className="size-3" />
              <span>+ Añadir recurrente</span>
            </button>
          </div>

          {/* Listado de Suscripciones con controles de estado y edición */}
          {displayedSubscriptions.length === 0 ? (
            <EmptyState
              emoji="📺"
              title={subFilter === 'canceladas' ? 'No hay suscripciones canceladas.' : 'Sin suscripciones recurrentes activas.'}
              action="+ Añadir suscripción / recurrente"
              onAction={handleOpenCreate}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayedSubscriptions.map((bill) => {
                const isCancelled = bill.subscriptionStatus === 'cancelada' || bill.isActive === false
                const isPaused = bill.subscriptionStatus === 'pausada'
                const memberList = (bill.paidByMemberIds || (bill.paidByMemberId ? [bill.paidByMemberId] : []))
                  .map((id) => getMemberById(id))
                  .filter(Boolean)

                return (
                  <Card
                    key={bill.id}
                    className={cn(
                      'p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3 shadow-sm rounded-2xl',
                      isCancelled && 'opacity-65 bg-slate-50/70 dark:bg-white/[0.01]'
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 shrink-0">
                            {getUtilityOrBrandIcon(bill)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                              {bill.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Cobro el día <strong className="text-slate-700 dark:text-slate-200">{bill.dueDay}</strong> de cada mes
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(bill)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Editar importe / suscripción"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(bill)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-rose-600 transition-colors"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Estado y Perceptores */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/10 dark:text-slate-400 dark:border-white/10 text-[10px] font-bold flex items-center gap-1">
                            <Ban className="size-3 text-rose-500" />
                            <span>Cancelada / Inactiva</span>
                          </span>
                        ) : isPaused ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                            <Pause className="size-3" />
                            <span>En Pausa</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>Activa (Generación recurrente)</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold capitalize">
                          {bill.category || 'Hogar'}
                        </span>
                      </div>
                    </div>

                    {/* Fila Inferior: Botones de Cancelar / Reactivar e Importe */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div>
                        {isCancelled || isPaused ? (
                          <button
                            type="button"
                            onClick={() => handleReactivateSubscription(bill)}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
                          >
                            <RotateCcw className="size-3" />
                            <span>Reactivar</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCancelSubscription(bill)}
                              className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-xs transition-colors border border-rose-200 dark:border-rose-500/20"
                            >
                              Dar de baja
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePauseSubscription(bill)}
                              className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-xs transition-colors"
                            >
                              Pausar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(bill.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block -mt-0.5">/{bill.billingCycle === 'anual' ? 'año' : 'mes'}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: COMPARADOR DE CONSUMOS Y TARIFAS ── */}
      {subTab === 'consumos' && (
        <ConsumptionComparison onOpenAddBill={handleOpenCreate} />
      )}

      {/* ── MODAL: AÑADIR / EDITAR FACTURA O SUSCRIPCIÓN ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-[#0e0d1d] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Suscripción / Factura' : 'Nueva Suscripción / Gasto Fijo'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {/* Concepto / Nombre */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Concepto / Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Netflix, Internet Fibra, Luz Endesa, Alquiler, Gimnasio..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              {/* Importe y Ciclo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Importe (€) <span className="text-red-500">*</span>
                  </label>
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
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Frecuencia</label>
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

              {/* Día de cobro y Autopay */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Día de cobro/pago (1-31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autopay}
                      onChange={(e) => setAutopay(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cargo domiciliado</span>
                  </label>
                </div>
              </div>

              {/* Categoría */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Categoría</label>
                  <CustomSelect<ExpenseCategory>
                    value={category}
                    onChange={(val) => setCategory(val)}
                    options={EXPENSE_CATEGORIES.map((c) => ({
                      value: c,
                      label: expenseCategoryMeta[c].label,
                    }))}
                  />
                </div>

                {category === 'otros' && (
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Especificar</label>
                    <input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Ej: Streaming..."
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-2 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Asignación de integrantes */}
              <div>
                <MemberMultiSelect
                  members={members}
                  selectedIds={selectedMemberIds}
                  onChange={setSelectedMemberIds}
                  label="Integrantes asociados / pagadores"
                />
              </div>

              {/* Bloque Opcional de Consumo */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasConsumption}
                    onChange={(e) => setHasConsumption(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Registrar consumo de suministros (luz, agua, gas, etc.)</span>
                </label>

                {hasConsumption && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">Tipo de suministro</label>
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
                        <label className="font-semibold text-slate-600 dark:text-slate-400">
                          Consumo ({unitLabel})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={consumptionValue}
                          onChange={(e) => setConsumptionValue(e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-400">
                        {currentUtilityMeta.unitPriceLabel} (opcional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/[0.04] py-1.5 px-3 text-xs font-medium text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
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
                  disabled={!name.trim() || !amount.trim()}
                  onClick={handleSave}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Suscripción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
