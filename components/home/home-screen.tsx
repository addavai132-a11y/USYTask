'use client'

import { useState } from 'react'
import { Wallet, Receipt, Wrench, Car, Package, Plus } from 'lucide-react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { Card, CardHeader } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { ProgressBar } from '@/components/ui/progress-bar'
import { MemberAvatar } from '@/components/ui/member-avatar'
import {
  expenses,
  monthlyBudget,
  bills,
  maintenance,
  vehicles,
  inventory,
  expenseCategoryLabels,
  getMember,
} from '@/lib/mock-data'
import { useToast } from '@/components/ui/toast'

type Section = 'gastos' | 'facturas' | 'mantenimiento' | 'vehiculos' | 'inventario'

export function HomeScreen() {
  const [section, setSection] = useState<Section>('gastos')
  const { toast } = useToast()

  const spendingPercentage = Math.round((monthlyBudget.expenses / monthlyBudget.income) * 100)

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Hogar"
        subtitle="Finanzas, mantenimiento y activos del hogar"
      />

      <PillTabs<Section>
        value={section}
        onChange={setSection}
        tabs={[
          { id: 'gastos', label: 'Gastos' },
          { id: 'facturas', label: 'Facturas' },
          { id: 'mantenimiento', label: 'Mantenimiento' },
          { id: 'vehiculos', label: 'Vehículos' },
          { id: 'inventario', label: 'Inventario' },
        ]}
      />

      {/* GASTOS */}
      {section === 'gastos' && (
        <div className="flex flex-col gap-4">
          <Card variant="amber">
            <CardHeader
              title="Presupuesto mensual"
              icon={<Wallet className="size-5 text-amber-700 dark:text-amber-400" />}
            />
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/25 p-3 text-center">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Ingresos</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                  {monthlyBudget.income} €
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Gastos</p>
                <p className="text-base font-extrabold text-foreground">
                  {monthlyBudget.expenses} €
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">Ahorro</p>
                <p className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                  {monthlyBudget.savings} €
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Gasto vs Ingreso</span>
                <span>{spendingPercentage}% consumido</span>
              </div>
              <ProgressBar value={spendingPercentage} className="h-2.5" />
            </div>
          </Card>

          <Card variant="amber">
            <CardHeader title="Gastos por categoría" />
            <div className="flex flex-col gap-3">
              {monthlyBudget.byCategory.map((c) => {
                const pct = Math.round((c.amount / monthlyBudget.expenses) * 100)
                return (
                  <div key={c.category} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{expenseCategoryLabels[c.category]}</span>
                      <span className="tabular-nums font-bold">{c.amount} € ({pct}%)</span>
                    </div>
                    <ProgressBar value={pct} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </Card>

          <Card variant="amber">
            <CardHeader
              title="Últimos movimientos"
              action="Añadir"
              onAction={() => toast('Registrar nuevo gasto', '💸')}
            />
            <ul className="flex flex-col divide-y divide-border/60">
              {expenses.map((x) => (
                <li key={x.id} className="flex items-center gap-3 py-2.5">
                  <MemberAvatar member={getMember(x.member)} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{x.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {expenseCategoryLabels[x.category]} · {x.date}
                    </p>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums">
                    -{x.amount.toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* FACTURAS (Amarillo) */}
      {section === 'facturas' && (
        <div className="flex flex-col gap-3">
          {bills.map((b) => (
            <Card key={b.id} variant="yellow" className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-yellow-500/20 text-2xl">
                {b.emoji}
              </span>
              <div className="flex-1">
                <p className="font-bold">{b.name}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  En {b.daysLeft} días
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black">{b.amount.toFixed(2)} €</p>
                <span className="rounded-full bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-0.5 text-[11px] font-bold text-yellow-800 dark:text-yellow-300">
                  Pendiente
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MANTENIMIENTO / CASA (Oliva) */}
      {section === 'mantenimiento' && (
        <div className="flex flex-col gap-3">
          {maintenance.map((m) => {
            const statusConfig = {
              ok: { label: 'Correcto', cls: 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300' },
              soon: { label: 'Próximo', cls: 'bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300' },
              overdue: { label: 'Vencido', cls: 'bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300' },
            }[m.status]

            return (
              <Card key={m.id} variant="olive" className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-lime-500/20 text-2xl">
                  {m.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusConfig.cls}`}>
                  {statusConfig.label}
                </span>
              </Card>
            )
          })}
        </div>
      )}

      {/* VEHÍCULOS (Azul) */}
      {section === 'vehiculos' && (
        <div className="flex flex-col gap-4">
          {vehicles.map((v) => (
            <Card key={v.id} variant="blue">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl">
                  {v.emoji}
                </span>
                <div className="flex-1">
                  <h4 className="font-extrabold">{v.name}</h4>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Matrícula: {v.plate} · {v.km.toLocaleString()} km
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <div className="rounded-2xl bg-blue-500/15 border border-blue-500/25 p-2.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">Próxima ITV</p>
                  <p className="text-sm font-extrabold">{v.itvDaysLeft} días</p>
                </div>
                <div className="rounded-2xl bg-blue-500/15 border border-blue-500/25 p-2.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">Seguro</p>
                  <p className="text-sm font-extrabold">{v.insuranceDaysLeft} días</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* INVENTARIO (Azul cielo) */}
      {section === 'inventario' && (
        <div className="flex flex-col gap-3">
          {inventory.map((inv) => (
            <Card key={inv.id} variant="sky" className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl">
                {inv.emoji}
              </span>
              <div className="flex-1">
                <p className="font-bold">{inv.name}</p>
                <p className="text-xs text-muted-foreground">
                  Comprado en {inv.purchaseDate} · {inv.warranty}
                </p>
              </div>
              <p className="text-base font-extrabold">{inv.price} €</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
