'use client'

import { useState } from 'react'
import {
  Utensils,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  ShoppingBag,
  Copy,
  Trash2,
  Edit2,
  X,
  ChevronRight,
  ChevronLeft,
  Folder,
  ChefHat,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PillTabs } from '@/components/ui/pill-tabs'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import {
  type DailyMenu,
  type WeeklyMenu,
  type MealItem,
  type MealType,
  type DayOfWeek,
  mealTypeLabels,
  dayNamesMap,
} from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const DAYS: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const MEAL_TYPES: MealType[] = ['desayuno', 'comida', 'merienda', 'cena']

function getSundayFromMonday(startDateISO: string): string {
  if (!startDateISO) return ''
  const d = new Date(startDateISO + 'T00:00:00')
  if (isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

function formatWeeklyRange(startDate?: string, endDate?: string): string {
  if (!startDate) return 'Semana sin fecha'
  const start = new Date(startDate + 'T00:00:00')
  if (isNaN(start.getTime())) return 'Semana sin fecha'

  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)

  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

  const startDay = start.getDate()
  const startMonth = monthNames[start.getMonth()]

  const endDay = end.getDate()
  const endMonth = monthNames[end.getMonth()]
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `Semana del ${startDay} al ${endDay} ${startMonth} ${year}`
  }
  return `Semana del ${startDay} ${startMonth} al ${endDay} ${endMonth} ${year}`
}

export function MealsSection() {
  const { toast } = useToast()
  const {
    dailyMenus,
    weeklyMenus,
    addDailyMenu,
    updateDailyMenu,
    deleteDailyMenu,
    duplicateDailyMenu,
    addWeeklyMenu,
    updateWeeklyMenu,
    deleteWeeklyMenu,
    duplicateWeeklyMenu,
    addIngredientsToShoppingList,
    confirmDelete,
  } = useApp()

  const [activeTab, setActiveTab] = useState<'diarios' | 'semanales'>('diarios')

  // Selected Detail View state
  const [selectedDailyMenu, setSelectedDailyMenu] = useState<DailyMenu | null>(null)
  const [selectedWeeklyMenu, setSelectedWeeklyMenu] = useState<WeeklyMenu | null>(null)
  const [activeWeeklyDay, setActiveWeeklyDay] = useState<DayOfWeek>('lunes')

  // Recipe Detail Modal state
  const [activeRecipe, setActiveRecipe] = useState<{ meal: MealItem; menuTitle: string } | null>(null)

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null)
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null)
  const [menuType, setMenuType] = useState<'daily' | 'weekly'>('daily')
  const [menuTitle, setMenuTitle] = useState('')
  const [menuDate, setMenuDate] = useState('')
  const [menuStartDate, setMenuStartDate] = useState('')
  const [menuEndDate, setMenuEndDate] = useState('')

  // Form State for Daily Menu
  const [dailyFormMeals, setDailyFormMeals] = useState<Record<MealType, { name: string; ingredients: string; recipe: string }>>({
    desayuno: { name: '', ingredients: '', recipe: '' },
    comida: { name: '', ingredients: '', recipe: '' },
    merienda: { name: '', ingredients: '', recipe: '' },
    cena: { name: '', ingredients: '', recipe: '' },
  })

  // Form State for Weekly Menu
  const [weeklyFormDayTab, setWeeklyFormDayTab] = useState<DayOfWeek>('lunes')
  const [weeklyFormDays, setWeeklyFormDays] = useState<
    Record<DayOfWeek, Record<MealType, { name: string; ingredients: string; recipe: string }>>
  >({
    lunes: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    martes: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    miercoles: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    jueves: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    viernes: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    sabado: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
    domingo: { desayuno: { name: '', ingredients: '', recipe: '' }, comida: { name: '', ingredients: '', recipe: '' }, merienda: { name: '', ingredients: '', recipe: '' }, cena: { name: '', ingredients: '', recipe: '' } },
  })

  // Open Creator Modal
  function handleOpenCreate(type: 'daily' | 'weekly' = 'daily') {
    const today = getTodayISO()
    setEditingDailyId(null)
    setEditingWeeklyId(null)
    setMenuType(type)
    setMenuTitle('')
    setMenuDate(today)
    setMenuStartDate(today)
    setMenuEndDate(getSundayFromMonday(today))
    setDailyFormMeals({
      desayuno: { name: '', ingredients: '', recipe: '' },
      comida: { name: '', ingredients: '', recipe: '' },
      merienda: { name: '', ingredients: '', recipe: '' },
      cena: { name: '', ingredients: '', recipe: '' },
    })
    const blankWeekly: any = {}
    DAYS.forEach((d) => {
      blankWeekly[d] = {
        desayuno: { name: '', ingredients: '', recipe: '' },
        comida: { name: '', ingredients: '', recipe: '' },
        merienda: { name: '', ingredients: '', recipe: '' },
        cena: { name: '', ingredients: '', recipe: '' },
      }
    })
    setWeeklyFormDays(blankWeekly)
    setWeeklyFormDayTab('lunes')
    setIsModalOpen(true)
  }

  // Open Edit Modal for Daily Menu
  function handleOpenEditDaily(menu: DailyMenu) {
    setEditingDailyId(menu.id)
    setEditingWeeklyId(null)
    setMenuType('daily')
    setMenuTitle(menu.title)
    setMenuDate(menu.date || getTodayISO())
    const formMeals: any = {}
    MEAL_TYPES.forEach((type) => {
      const item = menu.meals[type]
      formMeals[type] = {
        name: item?.name || '',
        ingredients: item?.ingredients?.join(', ') || '',
        recipe: item?.recipeInstructions || '',
      }
    })
    setDailyFormMeals(formMeals)
    setIsModalOpen(true)
  }

  // Open Edit Modal for Weekly Menu
  function handleOpenEditWeekly(menu: WeeklyMenu) {
    const start = menu.startDate || getTodayISO()
    const end = menu.endDate || getSundayFromMonday(start)
    setEditingWeeklyId(menu.id)
    setEditingDailyId(null)
    setMenuType('weekly')
    setMenuTitle(menu.title)
    setMenuStartDate(start)
    setMenuEndDate(end)
    const formDays: any = {}
    DAYS.forEach((day) => {
      const dayMeals = menu.days[day] || {}
      formDays[day] = {}
      MEAL_TYPES.forEach((type) => {
        const item = dayMeals[type]
        formDays[day][type] = {
          name: item?.name || '',
          ingredients: item?.ingredients?.join(', ') || '',
          recipe: item?.recipeInstructions || '',
        }
      })
    })
    setWeeklyFormDays(formDays)
    setWeeklyFormDayTab('lunes')
    setIsModalOpen(true)
  }

  // Save Menu Form
  function handleSaveMenu() {
    try {
      if (!menuTitle.trim()) {
        toast('Por favor, indica un nombre para el menú', '❌')
        return
      }

      if (menuType === 'daily') {
        const mealsMap: any = {}
        MEAL_TYPES.forEach((type) => {
          const data = dailyFormMeals[type]
          if (data && data.name && data.name.trim()) {
            const ings = (data.ingredients || '')
              .split(/,|\n/)
              .map((i) => i.trim())
              .filter(Boolean)
            mealsMap[type] = {
              id: `m_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: data.name.trim(),
              type,
              ingredients: ings.length > 0 ? ings : undefined,
              recipeInstructions: data.recipe?.trim() || undefined,
            }
          }
        })

        if (editingDailyId) {
          const updated = {
            id: editingDailyId,
            groupId: '',
            title: menuTitle.trim(),
            date: menuDate || getTodayISO(),
            meals: mealsMap,
          }
          updateDailyMenu(updated)
          setSelectedDailyMenu((current) => (current && current.id === editingDailyId ? updated : current))
          toast('Menú diario actualizado', '✅')
        } else {
          addDailyMenu({
            title: menuTitle.trim(),
            date: menuDate || getTodayISO(),
            meals: mealsMap,
          })
          toast('Menú diario creado', '🍳')
        }
      } else {
        const daysMap: any = {}
        DAYS.forEach((day) => {
          const dayData = weeklyFormDays[day]
          daysMap[day] = {}
          MEAL_TYPES.forEach((type) => {
            const data = dayData ? dayData[type] : null
            if (data && data.name && data.name.trim()) {
              const ings = (data.ingredients || '')
                .split(/,|\n/)
                .map((i) => i.trim())
                .filter(Boolean)
              daysMap[day][type] = {
                id: `w_${day}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: data.name.trim(),
                type,
                ingredients: ings.length > 0 ? ings : undefined,
                recipeInstructions: data.recipe?.trim() || undefined,
              }
            }
          })
        })

        if (editingWeeklyId) {
          const updated = {
            id: editingWeeklyId,
            groupId: '',
            title: menuTitle.trim(),
            startDate: menuStartDate || getTodayISO(),
            endDate: menuEndDate || getSundayFromMonday(menuStartDate || getTodayISO()),
            days: daysMap,
          }
          updateWeeklyMenu(updated)
          setSelectedWeeklyMenu((current) => (current && current.id === editingWeeklyId ? updated : current))
          toast('Menú semanal actualizado', '✅')
        } else {
          addWeeklyMenu({
            title: menuTitle.trim(),
            startDate: menuStartDate || getTodayISO(),
            endDate: menuEndDate || getSundayFromMonday(menuStartDate || getTodayISO()),
            days: daysMap,
          })
          toast('Menú semanal creado', '📅')
        }
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving meal menu in MealsSection:', err)
      toast('Error al guardar el menú. Inténtalo de nuevo.', '❌')
    }
  }

  // Transfer Ingredients to Shopping List
  function handleAddIngredients(ingredients?: string[], label: string = 'plato') {
    if (!ingredients || ingredients.length === 0) {
      toast('Este menú no tiene ingredientes desglosados', 'ℹ️')
      return
    }
    addIngredientsToShoppingList(ingredients)
    toast(`🛒 ${ingredients.length} ingredientes añadidos a la Lista de Compras`, '✅')
  }

  // Collect all ingredients from a Daily Menu
  function getDailyIngredients(menu: DailyMenu): string[] {
    const ings: string[] = []
    MEAL_TYPES.forEach((t) => {
      if (menu.meals[t]?.ingredients) {
        ings.push(...menu.meals[t]!.ingredients!)
      }
    })
    return ings
  }

  // Collect all ingredients from a Weekly Menu
  function getWeeklyIngredients(menu: WeeklyMenu): string[] {
    const ings: string[] = []
    DAYS.forEach((d) => {
      const dayMeals = menu.days[d]
      if (dayMeals) {
        MEAL_TYPES.forEach((t) => {
          if (dayMeals[t]?.ingredients) {
            ings.push(...dayMeals[t]!.ingredients!)
          }
        })
      }
    })
    return ings
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Card Glassmorphism Compacto */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">
            {activeTab === 'diarios' ? dailyMenus.length : weeklyMenus.length}
          </span>
          <span className="text-xs text-slate-400">
            {activeTab === 'diarios' ? 'menús diarios planificados' : 'menús semanales planificados'}
          </span>
        </div>
        <button
          onClick={() => handleOpenCreate(activeTab === 'diarios' ? 'daily' : 'weekly')}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>Crear menú</span>
        </button>
      </div>

      {/* Subtabs Filter Compactos */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/10 rounded-2xl w-fit">
        <button
          onClick={() => {
            setActiveTab('diarios')
            setSelectedDailyMenu(null)
            setSelectedWeeklyMenu(null)
          }}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            activeTab === 'diarios'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Menús Diarios ({dailyMenus.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('semanales')
            setSelectedDailyMenu(null)
            setSelectedWeeklyMenu(null)
          }}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            activeTab === 'semanales'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Menús Semanales ({weeklyMenus.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DETAIL VIEW: SELECTED DAILY MENU */}
      {/* ========================================================================= */}
      {selectedDailyMenu ? (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedDailyMenu(null)}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a Menús Diarios</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddIngredients(getDailyIngredients(selectedDailyMenu), selectedDailyMenu.title)}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                title="Añadir todos los ingredientes a la lista de compras"
              >
                <ShoppingBag className="size-3.5" />
                <span>Añadir a Compras</span>
              </button>
              <button
                onClick={() => handleOpenEditDaily(selectedDailyMenu)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Editar menú"
              >
                <Edit2 className="size-4" />
              </button>
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-primary/10 via-background to-secondary/30 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-soft">
                🍳
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">{selectedDailyMenu.title}</h3>
                {selectedDailyMenu.date && (
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="size-3" /> {selectedDailyMenu.date}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 4 Meal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEAL_TYPES.map((type) => {
              const meal = selectedDailyMenu.meals[type]
              const info = mealTypeLabels[type]
              return (
                <Card
                  key={type}
                  onClick={() => meal && setActiveRecipe({ meal, menuTitle: selectedDailyMenu.title })}
                  className={cn(
                    'p-4 transition-all cursor-pointer border hover:border-primary/50 group',
                    meal ? 'bg-card hover:shadow-soft' : 'bg-secondary/20 border-dashed opacity-70'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide uppercase text-muted-foreground">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">({info.time})</span>
                    </span>
                    {meal && (
                      <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5">
                        <span>Ver receta</span>
                        <ChevronRight className="size-3.5" />
                      </span>
                    )}
                  </div>

                  {meal ? (
                    <div>
                      <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                        {meal.name}
                      </h4>
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          🥗 {meal.ingredients.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground font-medium">Sin comida asignada</p>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : selectedWeeklyMenu ? (
        /* ========================================================================= */
        /* DETAIL VIEW: SELECTED WEEKLY MENU FOLDER */
        /* ========================================================================= */
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setSelectedWeeklyMenu(null)}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a Menús Semanales</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddIngredients(getWeeklyIngredients(selectedWeeklyMenu), selectedWeeklyMenu.title)}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                title="Añadir todos los ingredientes semanales a la lista de compras"
              >
                <ShoppingBag className="size-3.5" />
                <span>Añadir Toda la Semana a Compras</span>
              </button>
              <button
                onClick={() => handleOpenEditWeekly(selectedWeeklyMenu)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Editar menú semanal"
              >
                <Edit2 className="size-4" />
              </button>
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-amber-500/10 via-background to-orange-500/10 border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-xl shadow-soft">
                📅
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">{selectedWeeklyMenu.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="size-3 text-amber-500" />
                  <span>{formatWeeklyRange(selectedWeeklyMenu.startDate, selectedWeeklyMenu.endDate)}</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Days Tabs (Lunes to Domingo) */}
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 py-1">
            {DAYS.map((day) => {
              const hasMeals = selectedWeeklyMenu.days[day] && Object.keys(selectedWeeklyMenu.days[day]!).length > 0
              return (
                <button
                  key={day}
                  onClick={() => setActiveWeeklyDay(day)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all active:scale-95 border',
                    activeWeeklyDay === day
                      ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <span>{dayNamesMap[day]}</span>
                  {hasMeals && <span className="size-1.5 rounded-full bg-emerald-400" />}
                </button>
              )
            })}
          </div>

          {/* Active Day Meals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEAL_TYPES.map((type) => {
              const dayMeals = selectedWeeklyMenu.days[activeWeeklyDay] || {}
              const meal = dayMeals[type]
              const info = mealTypeLabels[type]
              return (
                <Card
                  key={type}
                  onClick={() => meal && setActiveRecipe({ meal, menuTitle: `${selectedWeeklyMenu.title} · ${dayNamesMap[activeWeeklyDay]}` })}
                  className={cn(
                    'p-4 transition-all cursor-pointer border hover:border-primary/50 group',
                    meal ? 'bg-card hover:shadow-soft' : 'bg-secondary/20 border-dashed opacity-70'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide uppercase text-muted-foreground">
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">({info.time})</span>
                    </span>
                    {meal && (
                      <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5">
                        <span>Ver receta</span>
                        <ChevronRight className="size-3.5" />
                      </span>
                    )}
                  </div>

                  {meal ? (
                    <div>
                      <h4 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                        {meal.name}
                      </h4>
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          🥗 {meal.ingredients.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs italic text-muted-foreground font-medium">Sin comida asignada para {dayNamesMap[activeWeeklyDay]}</p>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* LIST VIEWS: DAILY MENUS LIST OR WEEKLY MENUS LIST */
        /* ========================================================================= */
        <>
          {activeTab === 'diarios' && (
            <div className="flex flex-col gap-4">
              {dailyMenus.length === 0 ? (
                <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg">
                    🍽️
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">No hay menús diarios creados.</p>
                  <button
                    onClick={() => handleOpenCreate('daily')}
                    className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    Crear menú
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dailyMenus.map((menu) => {
                    const mealCount = Object.keys(menu.meals).length
                    return (
                      <Card
                        key={menu.id}
                        onClick={() => setSelectedDailyMenu(menu)}
                        className="p-4 border border-border bg-card hover:bg-secondary/20 transition-all cursor-pointer group shadow-soft hover:shadow-lg relative"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-base">
                              🍳
                            </span>
                            <div>
                              <h4 className="text-base font-extrabold tracking-tight group-hover:text-primary transition-colors">
                                {menu.title}
                              </h4>
                              {menu.date && (
                                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                  <Calendar className="size-3" /> {menu.date}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditDaily(menu)
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                              title="Editar menú diario"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateDailyMenu(menu.id)
                                toast('Menú diario duplicado', '📋')
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                              title="Duplicar menú"
                            >
                              <Copy className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDelete({
                                  title: '¿Eliminar menú diario?',
                                  itemName: menu.title,
                                  confirmText: 'Eliminar Menú',
                                  onConfirm: () => {
                                    deleteDailyMenu(menu.id)
                                    toast('Menú diario eliminado', '🗑️')
                                  },
                                })
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                              title="Eliminar menú"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Meals Summary Badges */}
                        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-border/50">
                          {MEAL_TYPES.map((type) => {
                            const meal = menu.meals[type]
                            const info = mealTypeLabels[type]
                            return (
                              <div
                                key={type}
                                className={cn(
                                   'flex items-center gap-1.5 p-1.5 rounded-xl text-xs font-semibold truncate border',
                                  meal ? 'bg-secondary/50 border-border text-foreground' : 'bg-secondary/20 border-dashed text-muted-foreground/60'
                                )}
                              >
                                <span>{info.icon}</span>
                                <span className="truncate">{meal ? meal.name : info.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'semanales' && (
            <div className="flex flex-col gap-4">
              {weeklyMenus.length === 0 ? (
                <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg">
                    📅
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">No hay menús semanales creados.</p>
                  <button
                    onClick={() => handleOpenCreate('weekly')}
                    className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    Crear menú semanal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {weeklyMenus.map((menu) => {
                    const daysCount = Object.keys(menu.days).length
                    return (
                      <Card
                        key={menu.id}
                        onClick={() => {
                          setSelectedWeeklyMenu(menu)
                          setActiveWeeklyDay('lunes')
                        }}
                        className="p-4 border border-border bg-card hover:bg-secondary/20 transition-all cursor-pointer group shadow-soft hover:shadow-lg relative"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 font-black text-lg">
                              <Folder className="size-5" />
                            </span>
                            <div>
                              <h4 className="text-base font-extrabold tracking-tight group-hover:text-primary transition-colors">
                                {menu.title}
                              </h4>
                              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                                <Calendar className="size-3 text-amber-500" />
                                <span>{formatWeeklyRange(menu.startDate, menu.endDate)}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEditWeekly(menu)
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                              title="Editar menú semanal"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                duplicateWeeklyMenu(menu.id)
                                toast('Menú semanal duplicado', '📋')
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                              title="Duplicar menú semanal"
                            >
                              <Copy className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDelete({
                                  title: '¿Eliminar menú semanal?',
                                  itemName: menu.title,
                                  confirmText: 'Eliminar Menú Semanal',
                                  onConfirm: () => {
                                    deleteWeeklyMenu(menu.id)
                                    toast('Menú semanal eliminado', '🗑️')
                                  },
                                })
                              }}
                              className="p-1.5 rounded-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                              title="Eliminar menú semanal"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {/* Days Preview Chips */}
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                          {DAYS.map((day) => {
                            const hasMeals = menu.days[day] && Object.keys(menu.days[day]!).length > 0
                            return (
                              <span
                                key={day}
                                className={cn(
                                  'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                                  hasMeals ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-secondary/40 text-muted-foreground/50'
                                )}
                              >
                                {day.slice(0, 3)}
                              </span>
                            )
                          })}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECIPE & INGREDIENTS DETAIL */}
      {/* ========================================================================= */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <span>{mealTypeLabels[activeRecipe.meal.type].icon}</span>
                <span>{mealTypeLabels[activeRecipe.meal.type].label}</span>
              </span>
              <button
                onClick={() => setActiveRecipe(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <h3 className="text-xl font-black tracking-tight text-foreground mb-1">
              {activeRecipe.meal.name}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mb-5">{activeRecipe.menuTitle}</p>

            {/* Ingredients Section */}
            <div className="flex flex-col gap-2.5 mb-5 bg-secondary/30 p-4 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ChefHat className="size-4 text-primary" />
                  <span>Ingredientes / Alimentos</span>
                </h4>
                {activeRecipe.meal.ingredients && activeRecipe.meal.ingredients.length > 0 && (
                  <button
                    onClick={() => handleAddIngredients(activeRecipe.meal.ingredients, activeRecipe.meal.name)}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>+ Añadir a Compras</span>
                  </button>
                )}
              </div>

              {activeRecipe.meal.ingredients && activeRecipe.meal.ingredients.length > 0 ? (
                <ul className="flex flex-col gap-1.5 mt-1">
                  {activeRecipe.meal.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-muted-foreground">Sin ingredientes especificados.</p>
              )}
            </div>

            {/* Recipe Instructions Section */}
            <div className="flex flex-col gap-2 bg-secondary/30 p-4 rounded-2xl border border-border/50">
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <BookOpen className="size-4 text-primary" />
                <span>Modo de Elaboración / Receta</span>
              </h4>
              {activeRecipe.meal.recipeInstructions ? (
                <p className="text-xs font-medium text-foreground leading-relaxed whitespace-pre-line mt-1">
                  {activeRecipe.meal.recipeInstructions}
                </p>
              ) : (
                <p className="text-xs italic text-muted-foreground">Sin instrucciones de preparación añadidas.</p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveRecipe(null)}
                className="rounded-2xl bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FULL CREATOR / EDITOR FOR DAILY & WEEKLY MENUS */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight">
                {editingDailyId || editingWeeklyId ? 'Editar Menú' : 'Nuevo Menú de Comidas'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Type Switcher (Only if creating new) */}
              {!editingDailyId && !editingWeeklyId && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-muted-foreground">Tipo de Menú</label>
                  <PillTabs<'daily' | 'weekly'>
                    tabs={[
                      { id: 'daily', label: 'Menú Diario' },
                      { id: 'weekly', label: 'Menú Semanal (Carpeta)' },
                    ]}
                    value={menuType}
                    onChange={setMenuType}
                  />
                </div>
              )}

              {/* Title & Dates */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Nombre / Título del Menú <span className="text-red-500">*</span></label>
                  <input
                    value={menuTitle}
                    onChange={(e) => setMenuTitle(e.target.value)}
                    placeholder={menuType === 'daily' ? 'Ej. Menú Alto en Proteínas, Menú Lunes...' : 'Ej. Semana 1 - Definición, Menú Agosto...'}
                    autoFocus
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
                  />
                </div>

                {menuType === 'daily' ? (
                  <div className="w-full sm:w-36 flex flex-col gap-1">
                    <label className="font-bold text-muted-foreground">Fecha</label>
                    <input
                      type="date"
                      value={menuDate}
                      onChange={(e) => setMenuDate(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-3 text-xs font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
                    />
                  </div>
                ) : (
                  <div className="flex gap-2 w-full sm:w-72">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="font-bold text-muted-foreground">Inicio (Lunes)</label>
                      <input
                        type="date"
                        value={menuStartDate}
                        onChange={(e) => {
                          const val = e.target.value
                          setMenuStartDate(val)
                          setMenuEndDate(getSundayFromMonday(val))
                        }}
                        className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-2 text-xs font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="font-bold text-muted-foreground">Fin (Domingo)</label>
                      <input
                        type="date"
                        value={menuEndDate}
                        onChange={(e) => setMenuEndDate(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-2 text-xs font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DAILY FORM FIELDS */}
              {/* ------------------------------------------------------------- */}
              {menuType === 'daily' && (
                <div className="flex flex-col gap-4 mt-2">
                  {MEAL_TYPES.map((type) => {
                    const info = mealTypeLabels[type]
                    const formMeal = dailyFormMeals[type]
                    return (
                      <div key={type} className="flex flex-col gap-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({info.time})</span>
                        </span>

                        <input
                          value={formMeal.name}
                          onChange={(e) =>
                            setDailyFormMeals((prev) => ({
                              ...prev,
                              [type]: { ...prev[type], name: e.target.value },
                            }))
                          }
                          placeholder={`Nombre del plato para ${info.label.toLowerCase()} (ej. Pollo con verduras)`}
                          className="w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                        />

                        <div className="flex gap-2">
                          <input
                            value={formMeal.ingredients}
                            onChange={(e) =>
                              setDailyFormMeals((prev) => ({
                                ...prev,
                                [type]: { ...prev[type], ingredients: e.target.value },
                              }))
                            }
                            placeholder="Ingredientes separados por comas (ej. Pollo 200g, Arroz, Brócoli)"
                            className="flex-1 rounded-xl border border-border bg-card py-1.5 px-3 text-[11px] font-medium outline-none focus:border-primary"
                          />
                        </div>

                        <textarea
                          value={formMeal.recipe}
                          onChange={(e) =>
                            setDailyFormMeals((prev) => ({
                              ...prev,
                              [type]: { ...prev[type], recipe: e.target.value },
                            }))
                          }
                          placeholder="Modo de elaboración paso a paso / Receta (opcional)..."
                          rows={2}
                          className="w-full rounded-xl border border-border bg-card py-1.5 px-3 text-[11px] font-medium outline-none focus:border-primary resize-none"
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* WEEKLY FORM FIELDS */}
              {/* ------------------------------------------------------------- */}
              {menuType === 'weekly' && (
                <div className="flex flex-col gap-3 mt-2">
                  {/* Selector y Navegación de Días (Lunes a Domingo) */}
                  <div className="flex flex-col gap-2 p-2 rounded-2xl bg-secondary/20 border border-border/60">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = DAYS.indexOf(weeklyFormDayTab)
                          if (currentIndex > 0) {
                            setWeeklyFormDayTab(DAYS[currentIndex - 1])
                          } else {
                            setWeeklyFormDayTab(DAYS[DAYS.length - 1])
                          }
                        }}
                        className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        title="Día anterior"
                      >
                        <ChevronLeft className="size-3.5" />
                        <span>Anterior</span>
                      </button>

                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Configurando: {dayNamesMap[weeklyFormDayTab]}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const currentIndex = DAYS.indexOf(weeklyFormDayTab)
                          if (currentIndex < DAYS.length - 1) {
                            setWeeklyFormDayTab(DAYS[currentIndex + 1])
                          } else {
                            setWeeklyFormDayTab(DAYS[0])
                          }
                        }}
                        className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                        title="Día siguiente"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {/* Chips de los 7 días de la semana */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 justify-start sm:justify-center">
                      {DAYS.map((day) => {
                        const dayMeals = weeklyFormDays[day]
                        const hasAny = dayMeals && Object.values(dayMeals).some((m) => m?.name?.trim())
                        const isCurrent = weeklyFormDayTab === day

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setWeeklyFormDayTab(day)}
                            className={cn(
                              'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border',
                              isCurrent
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-105'
                                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                            )}
                          >
                            <span>{dayNamesMap[day]}</span>
                            {hasAny && (
                              <span
                                className={cn(
                                  'size-1.5 rounded-full',
                                  isCurrent ? 'bg-white' : 'bg-emerald-500'
                                )}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Meals for active weekly form day */}
                  <div className="flex flex-col gap-3 p-1">
                    {MEAL_TYPES.map((type) => {
                      const info = mealTypeLabels[type]
                      const formMeal = weeklyFormDays[weeklyFormDayTab][type] || { name: '', ingredients: '', recipe: '' }
                      return (
                        <div key={type} className="flex flex-col gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/60">
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                            <span>{info.icon}</span>
                            <span>{info.label} ({dayNamesMap[weeklyFormDayTab]})</span>
                          </span>

                          <input
                            value={formMeal.name}
                            onChange={(e) => {
                              const val = e.target.value
                              setWeeklyFormDays((prev) => ({
                                ...prev,
                                [weeklyFormDayTab]: {
                                  ...prev[weeklyFormDayTab],
                                  [type]: { ...prev[weeklyFormDayTab][type], name: val },
                                },
                              }))
                            }}
                            placeholder={`Plato para ${info.label.toLowerCase()}`}
                            className="w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary"
                          />

                          <input
                            value={formMeal.ingredients}
                            onChange={(e) => {
                              const val = e.target.value
                              setWeeklyFormDays((prev) => ({
                                ...prev,
                                [weeklyFormDayTab]: {
                                  ...prev[weeklyFormDayTab],
                                  [type]: { ...prev[weeklyFormDayTab][type], ingredients: val },
                                },
                              }))
                            }}
                            placeholder="Ingredientes (separados por comas)"
                            className="w-full rounded-xl border border-border bg-card py-1.5 px-3 text-[11px] font-medium outline-none focus:border-primary"
                          />

                          <textarea
                            value={formMeal.recipe}
                            onChange={(e) => {
                              const val = e.target.value
                              setWeeklyFormDays((prev) => ({
                                ...prev,
                                [weeklyFormDayTab]: {
                                  ...prev[weeklyFormDayTab],
                                  [type]: { ...prev[weeklyFormDayTab][type], recipe: val },
                                },
                              }))
                            }}
                            placeholder="Instrucciones de elaboración (opcional)..."
                            rows={2}
                            className="w-full rounded-xl border border-border bg-card py-1.5 px-3 text-[11px] font-medium outline-none focus:border-primary resize-none"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMenu}
                  className="rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
                >
                  {editingDailyId || editingWeeklyId ? 'Guardar Cambios' : 'Crear Menú'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
