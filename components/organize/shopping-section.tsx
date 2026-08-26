'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Check,
  Trash2,
  Edit2,
  ShoppingBag,
  X,
  Sparkles,
  Layers,
  Euro,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Store,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'

export type AisleCategory =
  | 'frutas_verduras'
  | 'carniceria_pescaderia'
  | 'lacteos_huevos'
  | 'despensa_bebidas'
  | 'limpieza_hogar'
  | 'otros'

export const SUPERMARKET_PRESETS = [
  'Mercadona',
  'Carrefour',
  'Lidl',
  'Dia',
  'Aldi',
  'Alcampo',
  'Otro',
]

const AISLES: { id: AisleCategory; label: string; icon: string; keywords: string[] }[] = [
  {
    id: 'frutas_verduras',
    label: 'Frutas y Verduras',
    icon: '🍎',
    keywords: ['manzana', 'platano', 'tomate', 'lechuga', 'cebolla', 'patata', 'aguacate', 'limon', 'zanahoria', 'fruta', 'verdura', 'fresas', 'naranja'],
  },
  {
    id: 'carniceria_pescaderia',
    label: 'Carnicería y Pescadería',
    icon: '🥩',
    keywords: ['pollo', 'carne', 'ternera', 'cerdo', 'salmon', 'pescado', 'merluza', 'jamon', 'pavo', 'hamburguesa', 'atun', 'filete'],
  },
  {
    id: 'lacteos_huevos',
    label: 'Lácteos y Huevos',
    icon: '🧀',
    keywords: ['leche', 'queso', 'yogur', 'huevo', 'mantequilla', 'nata', 'mozzarella', 'parmesano'],
  },
  {
    id: 'despensa_bebidas',
    label: 'Despensa y Bebidas',
    icon: '🥫',
    keywords: ['pan', 'arroz', 'pasta', 'aceite', 'cafe', 'te', 'cereal', 'galletas', 'azucar', 'sal', 'agua', 'zumo', 'cerveza', 'vino', 'conserva', 'tomate frito'],
  },
  {
    id: 'limpieza_hogar',
    label: 'Limpieza y Hogar',
    icon: '🧼',
    keywords: ['detergente', 'jabon', 'papel', 'fregasuelos', 'suavizante', 'lavavajillas', 'bolsas', 'lejia', 'estropajo', 'champu', 'dentifrico', 'toallitas'],
  },
  {
    id: 'otros',
    label: 'Otros Artículos',
    icon: '📦',
    keywords: [],
  },
]

function detectAisle(name: string): AisleCategory {
  const lower = name.toLowerCase()
  for (const aisle of AISLES) {
    if (aisle.keywords.some((k) => lower.includes(k))) {
      return aisle.id
    }
  }
  return 'otros'
}

export function ShoppingSection({
  memberFilter,
  searchQuery,
}: {
  memberFilter?: string
  searchQuery?: string
}) {
  const { toast } = useToast()
  const {
    shoppingLists,
    shoppingItems,
    dailyMenus,
    weeklyMenus,
    addShoppingList,
    updateShoppingList,
    deleteShoppingList,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    confirmDelete,
  } = useApp()

  const [activeListId, setActiveListId] = useState<string>('')
  const [draftItem, setDraftItem] = useState('')
  const [selectedAisle, setSelectedAisle] = useState<AisleCategory>('otros')
  const [draftPrice, setDraftPrice] = useState<string>('')
  const [draftSupermarket, setDraftSupermarket] = useState<string>('')
  const [showCompleted, setShowCompleted] = useState(true)

  // Modals
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editingListTitle, setEditingListTitle] = useState('')

  // Sync activeListId
  useEffect(() => {
    if (shoppingLists.length > 0) {
      if (!activeListId || !shoppingLists.some((l) => l.id === activeListId)) {
        setActiveListId(shoppingLists[0].id)
      }
    } else {
      setActiveListId('')
    }
  }, [shoppingLists, activeListId])

  const activeList = shoppingLists.find((l) => l.id === activeListId) || shoppingLists[0]

  // Filter items in current list
  const currentItems = useMemo(() => {
    if (!activeList) return []
    let items = shoppingItems.filter((i) => i.listId === activeList.id)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }
    return items
  }, [activeList, shoppingItems, searchQuery])

  const pendingItems = currentItems.filter((i) => !i.completed)
  const completedItems = currentItems.filter((i) => i.completed)
  const totalCount = currentItems.length
  const completedCount = completedItems.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Total Real Price Stats
  const priceStats = useMemo(() => {
    let totalPrice = 0
    let pendingPrice = 0
    let pricedCount = 0

    currentItems.forEach((it) => {
      const p = typeof it.price === 'number' ? it.price : parseFloat(it.price as any) || 0
      if (p > 0) {
        totalPrice += p
        pricedCount++
        if (!it.completed) {
          pendingPrice += p
        }
      }
    })

    return {
      totalPrice,
      pendingPrice,
      pricedCount,
      hasPrices: pricedCount > 0,
    }
  }, [currentItems])

  // Group pending items by aisle
  const pendingByAisle = useMemo(() => {
    const map = new Map<AisleCategory, typeof currentItems>()
    AISLES.forEach((a) => map.set(a.id, []))

    pendingItems.forEach((item) => {
      const aisle = detectAisle(item.name)
      const list = map.get(aisle) || []
      list.push(item)
      map.set(aisle, list)
    })

    return Array.from(map.entries()).filter(([_, items]) => items.length > 0)
  }, [pendingItems])

  // Add Item with optional price and supermarket
  function handleAddItem() {
    const name = draftItem.trim()
    if (!name || !activeList) return

    const parsedPrice = draftPrice.trim() ? parseFloat(draftPrice.replace(',', '.')) : undefined
    const validPrice = parsedPrice !== undefined && !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined
    const supermarket = draftSupermarket.trim() || undefined

    addShoppingItem(name, activeList.id, {
      price: validPrice,
      supermarket,
    })

    setDraftItem('')
    setDraftPrice('')
    setDraftSupermarket('')
    toast(`"${name}" añadido a ${activeList.name}`, '🛒')
  }

  // Create List
  function handleCreateList() {
    const name = newListTitle.trim()
    if (!name) return
    addShoppingList(name)
    setNewListTitle('')
    setIsCreatingList(false)
    toast(`Lista "${name}" creada`, '📁')
  }

  // Save Edit List
  function handleSaveEditList() {
    if (!editingListId) return
    const name = editingListTitle.trim()
    if (!name) return
    updateShoppingList(editingListId, name)
    setEditingListId(null)
    setEditingListTitle('')
    toast('Nombre de lista actualizado', '✏️')
  }

  // Import ingredients from meals
  function handleImportMealIngredients() {
    if (!activeList) return
    const allIngredients = new Set<string>()

    dailyMenus.forEach((dm) => {
      Object.values(dm.meals || {}).forEach((m) => {
        m?.ingredients?.forEach((ing) => allIngredients.add(ing))
      })
    })

    weeklyMenus.forEach((wm) => {
      Object.values(wm.days || {}).forEach((dayMeals) => {
        Object.values(dayMeals || {}).forEach((m) => {
          m?.ingredients?.forEach((ing) => allIngredients.add(ing))
        })
      })
    })

    if (allIngredients.size === 0) {
      toast('No hay ingredientes configurados en la pestaña de Comidas aún.', '🍽️')
      return
    }

    let added = 0
    allIngredients.forEach((ing) => {
      if (!currentItems.some((i) => i.name.toLowerCase() === ing.toLowerCase())) {
        addShoppingItem(ing, activeList.id)
        added++
      }
    })

    toast(`¡${added} ingredientes importados a la lista! 🥕`, '🛒')
  }

  if (shoppingLists.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* ── Barra Resumen Superior Glassmorphism ── */}
        <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-white tabular-nums">0</span>
            <span className="text-xs text-slate-400">listas de compras activas</span>
          </div>
          <button
            onClick={() => setIsCreatingList(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="size-4" />
            <span>Nueva lista</span>
          </button>
        </div>

        {/* Tarjeta Central de Estado Vacío */}
        <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
            🧺
          </div>
          <p className="text-xs text-slate-400 max-w-xs">No tienes ninguna lista de compras creada.</p>
          <button
            onClick={() => setIsCreatingList(true)}
            className="mt-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            + Crear mi primera lista
          </button>
        </div>

        <BottomSheet
          open={isCreatingList}
          onClose={() => setIsCreatingList(false)}
          title="Nueva lista de compras"
        >
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-muted-foreground">Nombre de la lista</label>
            <input
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateList()
              }}
              placeholder="Ej. Supermercado semanal, Farmacia, Hogar..."
              autoFocus
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
            />
            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateList}
                disabled={!newListTitle.trim()}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
              >
                Crear lista
              </button>
            </div>
          </div>
        </BottomSheet>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{shoppingLists.length}</span>
          <span className="text-xs text-slate-400">
            {shoppingLists.length === 1 ? 'lista de compras activa' : 'listas de compras activas'}
          </span>
        </div>
        <button
          onClick={() => setIsCreatingList(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
        >
          <Plus className="size-4" />
          <span>Nueva lista</span>
        </button>
      </div>

      {/* Lists Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {shoppingLists.map((list) => {
          const isActive = list.id === activeList?.id
          return (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 border',
                isActive
                  ? 'border-purple-500/50 bg-purple-600 text-white shadow-sm'
                  : 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <span>🛒</span>
              <span>{list.name}</span>
            </button>
          )
        })}
      </div>

      {/* ── Active List Header & Quick Actions ── */}
      {activeList && (
        <Card className="p-3.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
            {editingListId === activeList.id ? (
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  value={editingListTitle}
                  onChange={(e) => setEditingListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditList()
                    if (e.key === 'Escape') setEditingListId(null)
                  }}
                  autoFocus
                  className="flex-1 rounded-xl border border-primary bg-card px-3 py-1.5 text-xs font-bold outline-none"
                />
                <button
                  onClick={handleSaveEditList}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingListId(null)}
                  className="rounded-xl bg-secondary px-2.5 py-1.5 text-xs font-bold text-muted-foreground"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-foreground">{activeList.name}</h3>
                <button
                  onClick={() => {
                    setEditingListId(activeList.id)
                    setEditingListTitle(activeList.name)
                  }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="Renombrar lista"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDelete({
                      title: '¿Eliminar lista de compras?',
                      itemName: activeList.name,
                      description: 'Se eliminarán todos los artículos contenidos en esta lista.',
                      confirmText: 'Eliminar Lista',
                      onConfirm: () => {
                        deleteShoppingList(activeList.id)
                        toast(`Lista "${activeList.name}" eliminada`, '🗑️')
                      },
                    })
                  }}
                  className="rounded-lg p-1 text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  title="Eliminar lista"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {priceStats.hasPrices && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold font-mono">
                  <span>💰 Total: {priceStats.totalPrice.toFixed(2).replace('.', ',')} €</span>
                  {priceStats.pendingPrice < priceStats.totalPrice && (
                    <span className="text-emerald-400/70 text-[11px] font-normal">
                      (Pendiente: {priceStats.pendingPrice.toFixed(2).replace('.', ',')} €)
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={handleImportMealIngredients}
                className="flex items-center gap-1.5 rounded-xl bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition-all border border-border self-start sm:self-auto"
                title="Importar ingredientes configurados en Comidas"
              >
                <UtensilsCrossed className="size-3.5 text-primary" />
                <span>Importar de Comidas</span>
              </button>
            </div>
          </div>

          <ProgressBar value={completedCount} max={totalCount} className="h-1.5 mb-3" />

          {/* ── Formulario de Añadir Producto con Precio y Supermercado ── */}
          <div className="rounded-2xl bg-secondary/50 p-2.5 sm:p-3 border border-border/80 space-y-2.5 transition-all">
            {/* Fila Principal: Nombre del Producto y Botón Añadir */}
            <div className="flex items-center gap-2">
              <input
                value={draftItem}
                onChange={(e) => {
                  setDraftItem(e.target.value)
                  setSelectedAisle(detectAisle(e.target.value))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem()
                }}
                placeholder="Ej. Pechuga de pollo, Huevos, Avena..."
                className="flex-1 bg-card/60 rounded-xl border border-border/60 px-3 py-2 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/70 focus:bg-card"
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!draftItem.trim()}
                className="flex items-center gap-1 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50 shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </div>

            {/* Fila Secundaria: Precio (€) y Píldoras de Supermercados */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/40 text-xs">
              {/* Precio Estimado (€) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">Precio (€):</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddItem()
                    }}
                    placeholder="0.00"
                    className="w-24 rounded-xl border border-border/60 bg-card/60 py-1 px-2.5 text-xs font-mono font-bold text-emerald-400 placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:bg-card"
                  />
                  <span className="absolute right-2 text-xs font-bold text-emerald-400/80 pointer-events-none">€</span>
                </div>
              </div>

              {/* Selector / Píldoras Rápidas de Supermercado */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  <Store className="size-3 text-purple-400" /> Súper:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {SUPERMARKET_PRESETS.map((s) => {
                    const isSelected = draftSupermarket.toLowerCase() === s.toLowerCase()
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraftSupermarket(isSelected ? '' : s)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all',
                          isSelected
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-xs'
                            : 'bg-card/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-card'
                        )}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Categorized Aisles View (Pending Items) ── */}
      {currentItems.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="Esta lista está vacía"
          description="Escribe arriba para añadir productos organizados automáticamente por pasillos."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Pending items grouped by aisle */}
          {pendingByAisle.map(([aisleKey, items]) => {
            const aisleInfo = AISLES.find((a) => a.id === aisleKey) || AISLES[5]
            return (
              <div key={aisleKey} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm">{aisleInfo.icon}</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {aisleInfo.label} ({items.length})
                  </h4>
                </div>

                <Card className="p-1">
                  <div className="flex flex-col divide-y divide-border/50">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 flex items-center justify-between gap-3 hover:bg-secondary/30 rounded-xl transition-colors"
                      >
                        <button
                          onClick={() => toggleShoppingItem(it.id)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card transition-all hover:border-primary">
                            <Check className="size-3.5 text-transparent" />
                          </span>
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-foreground truncate">{it.name}</span>
                            {it.supermarket && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                <Store className="size-2.5 text-purple-400" />
                                <span>{it.supermarket}</span>
                              </span>
                            )}
                            {it.price !== undefined && it.price !== null && !isNaN(Number(it.price)) && (
                              <span className="inline-flex items-center font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                                {Number(it.price).toFixed(2).replace('.', ',')} €
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          onClick={() => deleteShoppingItem(it.id)}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                          title="Eliminar artículo"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}

          {/* Completed Items Collapsible Section */}
          {completedItems.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center justify-between px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span>Comprados ({completedItems.length})</span>
                </div>
                {showCompleted ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>

              {showCompleted && (
                <Card className="p-1 opacity-70">
                  <div className="flex flex-col divide-y divide-border/50">
                    {completedItems.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 flex items-center justify-between gap-3 hover:bg-secondary/30 rounded-xl transition-colors"
                      >
                        <button
                          onClick={() => toggleShoppingItem(it.id)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="text-xs font-semibold text-muted-foreground line-through truncate">
                              {it.name}
                            </span>
                            {it.supermarket && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300 opacity-75">
                                <Store className="size-2.5 text-purple-400" />
                                <span>{it.supermarket}</span>
                              </span>
                            )}
                            {it.price !== undefined && it.price !== null && !isNaN(Number(it.price)) && (
                              <span className="inline-flex items-center font-mono font-bold text-xs text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                                {Number(it.price).toFixed(2).replace('.', ',')} €
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          onClick={() => deleteShoppingItem(it.id)}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 hover:bg-rose-500/10 hover:text-rose-500 transition-colors shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Nueva Lista */}
      <BottomSheet
        open={isCreatingList}
        onClose={() => setIsCreatingList(false)}
        title="Nueva lista de compras"
      >
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-muted-foreground">Nombre de la lista</label>
          <input
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateList()
            }}
            placeholder="Ej. Supermercado semanal, Farmacia, Hogar..."
            autoFocus
            className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
          />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreatingList(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateList}
              disabled={!newListTitle.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
            >
              Crear lista
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
