'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, ShoppingCart, Settings, Trash2, Sparkles, X, Apple, UtensilsCrossed, CheckCircle2, Flame, Scale, PieChart, Edit2, ChevronUp, ChevronDown, Zap, Activity, Check, Heart, User, Dumbbell, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { DailyMealLog, MealItem, MealType, NutritionGoal, MealSection, BodyMetric, DayOfWeek } from '@/types/fitness'
import { DEFAULT_MEAL_SECTIONS } from '@/types/fitness'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface NutritionTabProps {
  nutritionGoal: NutritionGoal
  mealLogs: DailyMealLog[]
  bodyMetrics?: BodyMetric[]
  onSaveGoal: (goal: NutritionGoal) => void
  onAddMealItem: (mealType: MealType, item: MealItem, dayOfWeek?: DayOfWeek) => void
  onDeleteMealItem: (mealType: MealType, itemId: string, dayOfWeek?: DayOfWeek) => void
  onSaveBodyMetric?: (metric: BodyMetric) => void
}

const DAYS_OF_WEEK: { id: DayOfWeek; label: string; short: string; icon: string }[] = [
  { id: 'lunes', label: 'Lunes', short: 'Lun', icon: '📅' },
  { id: 'martes', label: 'Martes', short: 'Mar', icon: '📅' },
  { id: 'miercoles', label: 'Miércoles', short: 'Mié', icon: '📅' },
  { id: 'jueves', label: 'Jueves', short: 'Jue', icon: '📅' },
  { id: 'viernes', label: 'Viernes', short: 'Vie', icon: '📅' },
  { id: 'sabado', label: 'Sábado', short: 'Sáb', icon: '🎉' },
  { id: 'domingo', label: 'Domingo', short: 'Dom', icon: '☀️' },
]

function getInitialDayOfWeek(): DayOfWeek {
  const dayIdx = new Date().getDay()
  const map: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return map[dayIdx] || 'lunes'
}

const COMMON_FOOD_PRESETS: { name: string; calories: number; protein: number; carbs: number; fats: number; quantity: string }[] = [
  { name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fats: 3.6, quantity: '100g' },
  { name: 'Arroz Blanco / Jazmín', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, quantity: '100g cocido' },
  { name: 'Huevos Enteros (x2)', calories: 140, protein: 12, carbs: 1, fats: 10, quantity: '2 unidades' },
  { name: 'Copos de Avena Integral', calories: 375, protein: 13, carbs: 60, fats: 7, quantity: '100g' },
  { name: 'Salmón Fresco', calories: 208, protein: 20, carbs: 0, fats: 13, quantity: '100g' },
  { name: 'Proteína Whey Isolate', calories: 110, protein: 25, carbs: 1, fats: 0.5, quantity: '1 cacito (30g)' },
  { name: 'Plátano Mediano', calories: 95, protein: 1.2, carbs: 23, fats: 0.3, quantity: '1 unidad' },
  { name: 'Nueces / Frutos Secos', calories: 185, protein: 4.3, carbs: 3.9, fats: 18.5, quantity: '30g' },
]

const SECTION_SUGGESTIONS = [
  { name: '2º Desayuno', icon: '🍳' },
  { name: 'Snack Media Mañana', icon: '🥪' },
  { name: 'Pre-Entreno', icon: '⚡' },
  { name: 'Post-Entreno', icon: '🥛' },
  { name: 'Merienda 2', icon: '🍎' },
  { name: 'Recena / Antes de dormir', icon: '🌙' },
  { name: 'Snack Saludable', icon: '🥑' },
]

const SECTION_ICONS = ['☕', '🥪', '🍎', '⚡', '🥑', '🥛', '🍳', '🥩', '🥗', '🍌', '🍗', '🥜', '🥣', '🍇', '🥐', '🌙']

const ACTIVITY_LEVELS = [
  {
    id: 'sedentario',
    label: 'Sedentario',
    factor: '× 1.20',
    description: 'Trabajo oficina / < 5.000 pasos',
    icon: '🪑',
  },
  {
    id: 'ligero',
    label: 'Actividad Ligera',
    factor: '× 1.375',
    description: '1-3 días entreno / 6k-8k pasos',
    icon: '🚶',
  },
  {
    id: 'moderado',
    label: 'Moderada',
    factor: '× 1.55',
    description: '3-5 días gym con cargas',
    icon: '🏋️‍♂️',
  },
  {
    id: 'alto',
    label: 'Alta / Muy Activa',
    factor: '× 1.725',
    description: '6-7 días intenso / doble sesión',
    icon: '⚡',
  },
]

export function NutritionTab({
  nutritionGoal,
  mealLogs,
  bodyMetrics = [],
  onSaveGoal,
  onAddMealItem,
  onDeleteMealItem,
  onSaveBodyMetric,
}: NutritionTabProps) {
  const { toast } = useToast()
  const { shoppingLists, addShoppingItem, addShoppingList, confirmDelete } = useApp()

  // ── ESTADO DEL DÍA DE LA SEMANA ACTIVO (LUNES A DOMINGO) ──
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => getInitialDayOfWeek())
  const todayDayOfWeek = getInitialDayOfWeek()

  // Logs filtrados exclusivamente para el día seleccionado
  const currentDayLogs = useMemo(() => {
    return mealLogs.filter((log) => {
      if (log.dayOfWeek) {
        return log.dayOfWeek === selectedDay
      }
      if (log.date) {
        const d = new Date(log.date + 'T00:00:00')
        if (!isNaN(d.getTime())) {
          const map: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
          return map[d.getDay()] === selectedDay
        }
      }
      return false
    })
  }, [mealLogs, selectedDay])

  // Conteo de alimentos por día para los badges del selector
  const itemsCountByDay = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      lunes: 0,
      martes: 0,
      miercoles: 0,
      jueves: 0,
      viernes: 0,
      sabado: 0,
      domingo: 0,
    }
    mealLogs.forEach((log) => {
      let dKey: DayOfWeek | null = log.dayOfWeek || null
      if (!dKey && log.date) {
        const d = new Date(log.date + 'T00:00:00')
        if (!isNaN(d.getTime())) {
          const map: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
          dKey = map[d.getDay()] || null
        }
      }
      if (dKey && counts[dKey] !== undefined && Array.isArray(log.items)) {
        counts[dKey] += log.items.length
      }
    })
    return counts
  }, [mealLogs])

  // ── SECCIONES DE COMIDAS PERSONALIZADAS Y DINÁMICAS ──
  const [mealSections, setMealSections] = useState<MealSection[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitness_custom_meal_sections')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch {}
      }
    }
    return DEFAULT_MEAL_SECTIONS
  })

  const saveSections = (newSections: MealSection[]) => {
    setMealSections(newSections)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitness_custom_meal_sections', JSON.stringify(newSections))
    }
  }

  // ── MODAL NUEVA/EDITAR TOMA STATE ──
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [sectionIcon, setSectionIcon] = useState('🥪')

  function handleOpenAddSection() {
    setEditingSectionId(null)
    setSectionName('')
    setSectionIcon('🥪')
    setIsSectionModalOpen(true)
  }

  function handleOpenEditSection(section: MealSection) {
    setEditingSectionId(section.id)
    setSectionName(section.name)
    setSectionIcon(section.icon)
    setIsSectionModalOpen(true)
  }

  function handleSaveSection() {
    if (!sectionName.trim()) {
      toast('Introduce un nombre para la toma o comida', '⚠️')
      return
    }

    if (editingSectionId) {
      const updated = mealSections.map((s) =>
        s.id === editingSectionId ? { ...s, name: sectionName.trim(), icon: sectionIcon } : s
      )
      saveSections(updated)
      toast(`Toma "${sectionName.trim()}" actualizada`, '✏️')
    } else {
      const newId = `custom_meal_${Date.now()}`
      const newSection: MealSection = {
        id: newId,
        name: sectionName.trim(),
        icon: sectionIcon,
        isDefault: false,
      }
      const updated = [...mealSections, newSection]
      saveSections(updated)
      toast(`Nueva toma "${sectionName.trim()}" añadida`, '🍽️')
    }
    setIsSectionModalOpen(false)
  }

  function handleDeleteSection(section: MealSection) {
    confirmDelete({
      title: '¿Eliminar toma de comida?',
      itemName: section.name,
      description: 'Se eliminará esta sección de tus comidas habituales.',
      confirmText: 'Eliminar Toma',
      onConfirm: () => {
        const updated = mealSections.filter((s) => s.id !== section.id)
        saveSections(updated)
        toast(`Toma "${section.name}" eliminada`, '🗑️')
      },
    })
  }

  function handleMoveSection(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= mealSections.length) return
    const copy = [...mealSections]
    const [removed] = copy.splice(index, 1)
    copy.splice(targetIndex, 0, removed)
    saveSections(copy)
    toast('Orden de comidas actualizado', '↕️')
  }

  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false)
  const [targetMealType, setTargetMealType] = useState<MealType>('almuerzo')
  const [targetMealLabel, setTargetMealLabel] = useState('Almuerzo')
  const [foodName, setFoodName] = useState('')
  const [foodQuantity, setFoodQuantity] = useState('') // alias: foodServing in JSX
  const [foodCalories, setFoodCalories] = useState('') // kept as string for controlled input
  const [foodProtein, setFoodProtein] = useState('')
  const [foodCarbs, setFoodCarbs] = useState('')
  const [foodFats, setFoodFats] = useState('')

  // ── MODAL SETTINGS (INTELLIGENT CALCULATOR & GOALS) STATE ──
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [activeGoalTab, setActiveGoalTab] = useState<'calculator' | 'manual'>('calculator')

  // Datos base
  const [calcWeight, setCalcWeight] = useState('80')
  const [calcHeight, setCalcHeight] = useState('178')
  const [calcAge, setCalcAge] = useState('26')
  const [calcGender, setCalcGender] = useState<'hombre' | 'mujer'>('hombre')
  const [calcActivity, setCalcActivity] = useState<'sedentario' | 'ligero' | 'moderado' | 'alto'>('moderado')
  const [calcGoalPhase, setCalcGoalPhase] = useState<'definicion' | 'volumen' | 'mantenimiento'>('volumen')
  const [calcPace, setCalcPace] = useState<'conservador' | 'moderado' | 'agresivo' | 'limpio' | 'estandar'>('limpio')
  const [calcTargetWeight, setCalcTargetWeight] = useState('83')
  const [calcSaveWeightToProfile, setCalcSaveWeightToProfile] = useState(false)

  // Manual fields
  const [manualCalories, setManualCalories] = useState(nutritionGoal.targetCalories.toString())
  const [manualProtein, setManualProtein] = useState(nutritionGoal.targetProtein.toString())
  const [manualCarbs, setManualCarbs] = useState(nutritionGoal.targetCarbs.toString())
  const [manualFats, setManualFats] = useState(nutritionGoal.targetFats.toString())

  // ── ESTADO DIRECTO DE FASE Y PESO EN LA TARJETA PRINCIPAL ──
  const currentWeight = bodyMetrics?.[0]?.weightKg || nutritionGoal.weightKg || 80
  const activePhase = (nutritionGoal.goalPhase || 'volumen') as 'volumen' | 'definicion' | 'mantenimiento'
  const [directTargetWeight, setDirectTargetWeight] = useState(() => {
    return (nutritionGoal.targetWeightKg || (activePhase === 'volumen' ? currentWeight + 3 : currentWeight - 4)).toString()
  })

  useEffect(() => {
    if (nutritionGoal.targetWeightKg) {
      setDirectTargetWeight(nutritionGoal.targetWeightKg.toString())
    }
  }, [nutritionGoal.targetWeightKg])

  function handleDirectPhaseChange(newPhase: 'volumen' | 'definicion' | 'mantenimiento') {
    const weight = currentWeight
    const height = nutritionGoal.heightCm || 178
    const age = nutritionGoal.age || 26
    const gender = nutritionGoal.gender || 'hombre'
    const activity = nutritionGoal.activityLevel || 'moderado'

    const activityMultipliers: Record<string, number> = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      alto: 1.725,
    }
    const pal = activityMultipliers[activity] || 1.55

    let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'hombre' ? 5 : -161)
    bmr = Math.max(800, Math.round(bmr))
    const tdee = Math.round(bmr * pal)

    let calories = tdee
    let pace = nutritionGoal.goalPace || (newPhase === 'definicion' ? 'moderado' : 'limpio')
    if (newPhase === 'definicion') {
      calories = Math.max(1200, tdee - 400)
    } else if (newPhase === 'volumen') {
      calories = tdee + 300
    }

    const proteinFactor = newPhase === 'definicion' ? 2.2 : 2.0
    const protein = Math.round(weight * proteinFactor)
    const fats = Math.round(weight * 0.9)
    const remainingKcal = Math.max(0, calories - (protein * 4 + fats * 9))
    const carbs = Math.max(20, Math.round(remainingKcal / 4))

    let newTargetWeight = parseFloat(directTargetWeight)
    if (!newTargetWeight || isNaN(newTargetWeight)) {
      newTargetWeight = newPhase === 'volumen' ? weight + 3 : newPhase === 'definicion' ? weight - 4 : weight
    } else if (newPhase === 'volumen' && newTargetWeight <= weight) {
      newTargetWeight = weight + 3
    } else if (newPhase === 'definicion' && newTargetWeight >= weight) {
      newTargetWeight = weight - 4
    }

    setDirectTargetWeight(newTargetWeight.toString())

    onSaveGoal({
      ...nutritionGoal,
      targetCalories: calories,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFats: fats,
      weightKg: weight,
      goalPhase: newPhase,
      goalPace: pace,
      targetWeightKg: newTargetWeight,
    })

    const phaseLabels = {
      volumen: '📈 Volumen (+300 kcal)',
      definicion: '🔥 Definición (-400 kcal)',
      mantenimiento: '⚖️ Mantenimiento (TDEE)',
    }
    toast(`Fase actualizada: ${phaseLabels[newPhase]} · ${calories} kcal`, '🎯')
  }

  function handleDirectTargetWeightChange(val: string) {
    setDirectTargetWeight(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) {
      onSaveGoal({
        ...nutritionGoal,
        targetWeightKg: num,
      })
    }
  }

  // ── CÁLCULO METABÓLICO INTELIGENTE EN TIEMPO REAL (MIFFLIN-ST JEOR & TDEE) ──
  const metabolicResults = useMemo(() => {
    const weight = parseFloat(calcWeight) || 75
    const height = parseFloat(calcHeight) || 175
    const age = parseFloat(calcAge) || 25

    // 1. TMB / BMR - Mifflin-St Jeor
    let bmr = 10 * weight + 6.25 * height - 5 * age
    if (calcGender === 'hombre') {
      bmr += 5
    } else {
      bmr -= 161
    }
    bmr = Math.max(800, Math.round(bmr))

    // 2. PAL Multiplier
    const activityMultipliers: Record<string, number> = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      alto: 1.725,
    }
    const pal = activityMultipliers[calcActivity] || 1.55
    const tdee = Math.round(bmr * pal)

    // 3. Goal Adjustment
    let calories = tdee
    let adjustment = 0
    if (calcGoalPhase === 'definicion') {
      const deficits: Record<string, number> = {
        conservador: 300,
        moderado: 500,
        agresivo: 700,
      }
      adjustment = -(deficits[calcPace] || 500)
      calories = Math.max(1200, tdee + adjustment)
    } else if (calcGoalPhase === 'volumen') {
      const surpluses: Record<string, number> = {
        limpio: 250,
        estandar: 400,
      }
      adjustment = surpluses[calcPace] || 250
      calories = tdee + adjustment
    }

    // 4. Macro recommendations
    // Protein: 2.2 g/kg in definition, 2.0 g/kg in bulk/maintenance
    const proteinFactor = calcGoalPhase === 'definicion' ? 2.2 : 2.0
    const protein = Math.round(weight * proteinFactor)
    const proteinKcal = protein * 4

    // Fats: 0.9 g/kg
    const fatsFactor = 0.9
    const fats = Math.round(weight * fatsFactor)
    const fatsKcal = fats * 9

    // Carbs: remaining kcal
    const remainingKcal = Math.max(0, calories - (proteinKcal + fatsKcal))
    const carbs = Math.max(20, Math.round(remainingKcal / 4))
    const carbsKcal = carbs * 4

    return {
      bmr,
      tdee,
      adjustment,
      calories,
      protein,
      carbs,
      fats,
      proteinKcal,
      fatsKcal,
      carbsKcal,
      proteinPct: Math.round((proteinKcal / calories) * 100),
      fatsPct: Math.round((fatsKcal / calories) * 100),
      carbsPct: Math.round((carbsKcal / calories) * 100),
      proteinFactor,
      fatsFactor,
    }
  }, [calcWeight, calcHeight, calcAge, calcGender, calcActivity, calcGoalPhase, calcPace])

  // ── CONSUMED MACROS TOTALS (Filtrados por el día seleccionado) ──
  const totals = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0

    currentDayLogs.forEach((log) => {
      if (Array.isArray(log?.items)) {
        log.items.forEach((item) => {
          if (item) {
            calories += Number(item.calories) || 0
            protein += Number(item.protein) || 0
            carbs += Number(item.carbs) || 0
            fats += Number(item.fats) || 0
          }
        })
      }
    })

    return { calories, protein, carbs, fats }
  }, [currentDayLogs])

  const calPercent = Math.min(100, Math.round((totals.calories / (nutritionGoal.targetCalories || 1)) * 100))
  const proPercent = Math.min(100, Math.round((totals.protein / (nutritionGoal.targetProtein || 1)) * 100))
  const carbPercent = Math.min(100, Math.round((totals.carbs / (nutritionGoal.targetCarbs || 1)) * 100))
  const fatPercent = Math.min(100, Math.round((totals.fats / (nutritionGoal.targetFats || 1)) * 100))

  function handleOpenGoalModal() {
    const latestW = bodyMetrics?.[0]?.weightKg || nutritionGoal.weightKg || 80
    setCalcWeight(latestW.toString())
    setCalcHeight((nutritionGoal.heightCm || 178).toString())
    setCalcAge((nutritionGoal.age || 26).toString())
    setCalcGender(nutritionGoal.gender || 'hombre')
    setCalcActivity(nutritionGoal.activityLevel || 'moderado')
    setCalcGoalPhase(nutritionGoal.goalPhase || 'volumen')
    setCalcPace(nutritionGoal.goalPace || (nutritionGoal.goalPhase === 'definicion' ? 'moderado' : 'limpio'))
    setCalcTargetWeight((nutritionGoal.targetWeightKg || (nutritionGoal.goalPhase === 'definicion' ? latestW - 4 : latestW + 4)).toString())
    setManualCalories(nutritionGoal.targetCalories.toString())
    setManualProtein(nutritionGoal.targetProtein.toString())
    setManualCarbs(nutritionGoal.targetCarbs.toString())
    setManualFats(nutritionGoal.targetFats.toString())
    setActiveGoalTab('calculator')
    setIsGoalModalOpen(true)
  }

  function handleOpenAddFood(mealType: MealType, mealLabel: string) {
    setTargetMealType(mealType)
    setTargetMealLabel(mealLabel)
    setFoodName('')
    setFoodQuantity('')
    setFoodCalories('')
    setFoodProtein('')
    setFoodCarbs('')
    setFoodFats('')
    setIsAddFoodModalOpen(true)
  }

  function handleSelectPreset(preset: typeof COMMON_FOOD_PRESETS[0]) {
    setFoodName(preset.name)
    setFoodQuantity(preset.quantity)
    setFoodCalories(preset.calories.toString())
    setFoodProtein(preset.protein.toString())
    setFoodCarbs(preset.carbs.toString())
    setFoodFats(preset.fats.toString())
  }

  function handleSaveFood() {
    try {
      const trimmedName = (foodName || '').trim()
      if (!trimmedName) {
        toast('Escribe el nombre del alimento u opción', '❌')
        return
      }
      const cals = parseFloat(String(foodCalories)) || 0
      const p = parseFloat(String(foodProtein)) || 0
      const c = parseFloat(String(foodCarbs)) || 0
      const f = parseFloat(String(foodFats)) || 0

      const item: MealItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: trimmedName,
        calories: Math.max(0, Math.round(cals)),
        protein: Math.max(0, Math.round(p * 10) / 10),
        carbs: Math.max(0, Math.round(c * 10) / 10),
        fats: Math.max(0, Math.round(f * 10) / 10),
        quantity: (foodQuantity || '').trim() || undefined,
      }

      onAddMealItem(targetMealType, item, selectedDay)
      const dayLabel = DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.label || selectedDay
      toast(`🥗 "${item.name}" añadido a ${targetMealLabel} (${dayLabel})`, '✅')
      setIsAddFoodModalOpen(false)
    } catch (err) {
      console.error('Error in handleSaveFood:', err)
      toast('Hubo un error al guardar el alimento. Inténtalo de nuevo.', '❌')
    }
  }

  function handleSaveGoals() {
    let finalCals = 2500
    let finalP = 160
    let finalC = 300
    let finalF = 70

    if (activeGoalTab === 'manual') {
      finalCals = parseInt(manualCalories, 10) || 2500
      finalP = parseInt(manualProtein, 10) || 160
      finalC = parseInt(manualCarbs, 10) || 300
      finalF = parseInt(manualFats, 10) || 70
    } else {
      finalCals = metabolicResults.calories
      finalP = metabolicResults.protein
      finalC = metabolicResults.carbs
      finalF = metabolicResults.fats
    }

    const wKg = parseFloat(calcWeight) || 80

    onSaveGoal({
      targetCalories: finalCals,
      targetProtein: finalP,
      targetCarbs: finalC,
      targetFats: finalF,
      weightKg: wKg,
      heightCm: parseFloat(calcHeight) || 178,
      age: parseInt(calcAge, 10) || 26,
      gender: calcGender,
      activityLevel: calcActivity,
      goalPhase: calcGoalPhase,
      goalPace: calcPace,
      targetWeightKg: parseFloat(calcTargetWeight) || undefined,
    })

    if (calcSaveWeightToProfile && onSaveBodyMetric && wKg > 0) {
      onSaveBodyMetric({
        id: `bm_${Date.now()}`,
        groupId: 'default',
        date: getTodayISO(),
        weightKg: wKg,
        notes: 'Sincronizado desde Calculadora Nutricional',
      })
    }

    toast('🎯 Objetivos nutricionales calculados y guardados', '✨')
    setIsGoalModalOpen(false)
  }

  // Synchronize meal ingredients to shopping list
  function handleSyncToShoppingList(items: MealItem[], mealLabel: string) {
    if (items.length === 0) {
      toast('No hay ingredientes para añadir', '⚠️')
      return
    }

    let targetListId = shoppingLists[0]?.id
    if (!targetListId) {
      addShoppingList('🛒 Supermercado / Fitness')
      toast('Se creó una lista de compras para tus ingredientes', '📝')
    }

    items.forEach((item) => {
      addShoppingItem(item.quantity ? `${item.name} (${item.quantity})` : item.name, targetListId || 'default')
    })

    toast(`🛒 ${items.length} ingredientes de ${mealLabel} añadidos a tu Lista de Compras`, '✅')
  }

  const mealTypes: MealType[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'pre_post']

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── BARRA RESUMEN DE MACROS Y CALORÍAS CON GLASSMORPHISM ── */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 dark:bg-[#121026]/90 dark:border-purple-500/20 dark:shadow-xl">
        {/* Cabecera con Título y Botón de Ajustes */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-purple-500/15">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Objetivos Nutricionales Diarios</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Balance de calorías y distribución de macronutrientes</p>
            </div>
          </div>

          <button
            onClick={handleOpenGoalModal}
            className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 font-medium px-4 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-95 shadow-xs shrink-0 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            <Settings className="size-4 text-slate-700 dark:text-slate-300" />
            <span>Calculadora / Ajustes</span>
          </button>
        </div>

        {/* ── SELECTOR DIRECTO DE FASE (VOLUMEN / DEFINICIÓN / MANTENIMIENTO) ── */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold dark:bg-white/[0.03] dark:border-white/10">
            <button
              type="button"
              onClick={() => handleDirectPhaseChange('volumen')}
              className={cn(
                'py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold',
                activePhase === 'volumen'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 dark:bg-purple-600 dark:ring-purple-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
              )}
            >
              <span>📈</span>
              <span>Volumen</span>
            </button>

            <button
              type="button"
              onClick={() => handleDirectPhaseChange('definicion')}
              className={cn(
                'py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold',
                activePhase === 'definicion'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 dark:bg-purple-600 dark:ring-purple-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
              )}
            >
              <span>🔥</span>
              <span>Definición</span>
            </button>

            <button
              type="button"
              onClick={() => handleDirectPhaseChange('mantenimiento')}
              className={cn(
                'py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold',
                activePhase === 'mantenimiento'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 dark:bg-purple-600 dark:ring-purple-400'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
              )}
            >
              <span>⚖️</span>
              <span>Mantenimiento</span>
            </button>
          </div>

          {/* Fila Compacta de Peso Actual y Peso Objetivo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs dark:bg-white/[0.02] dark:border-purple-500/15">
            {/* Peso Actual */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peso Actual:</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                {currentWeight} kg
              </span>
              {bodyMetrics[0]?.weightKg && (
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                  Registrado
                </span>
              )}
            </div>

            {/* Peso Objetivo */}
            <div className="flex items-center gap-2">
              {activePhase === 'mantenimiento' ? (
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-purple-300 flex items-center gap-1">
                  <span>⚖️</span>
                  <span>Mantener peso actual ({currentWeight} kg)</span>
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Meta de peso:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={directTargetWeight}
                      onChange={(e) => handleDirectTargetWeightChange(e.target.value)}
                      placeholder={activePhase === 'volumen' ? (currentWeight + 3).toString() : (currentWeight - 4).toString()}
                      className="w-16 rounded-lg border border-slate-200 bg-white py-1 px-2 font-mono font-bold text-slate-900 text-center text-xs outline-none focus:border-emerald-500 dark:border-purple-500/30 dark:bg-purple-950/40 dark:text-white"
                    />
                    <span className="font-bold text-slate-500 dark:text-slate-400">kg</span>
                  </div>
                  {parseFloat(directTargetWeight) > 0 && !isNaN(parseFloat(directTargetWeight)) && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono ml-1">
                      ({activePhase === 'volumen' && (parseFloat(directTargetWeight) - currentWeight) > 0 ? '+' : ''}
                      {(parseFloat(directTargetWeight) - currentWeight).toFixed(1)} kg)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Calorías Principal */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totals.calories}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ {nutritionGoal.targetCalories} kcal</span>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
              <strong className="text-slate-900 dark:text-white font-bold">{calPercent}%</strong> ({Math.max(0, nutritionGoal.targetCalories - totals.calories)} kcal restantes)
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:bg-white/[0.05] dark:border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-600 dark:from-amber-500 dark:via-purple-500 dark:to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${calPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Barras de Macronutrientes (Proteínas, Carbos, Grasas) */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1">
          {/* Proteína */}
          <div className="p-2 sm:p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5 min-w-0 dark:bg-rose-500/10 dark:border-rose-500/20">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-rose-700 dark:text-rose-300 truncate">Proteína</span>
              <span className="text-rose-700 dark:text-rose-400 font-mono text-[9px] sm:text-[11px] shrink-0">{totals.protein}g / {nutritionGoal.targetProtein}g</span>
            </div>
            <div className="h-1.5 w-full bg-rose-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 dark:bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${proPercent}%` }} />
            </div>
          </div>

          {/* Carbohidratos */}
          <div className="p-2 sm:p-3 rounded-2xl bg-cyan-50 border border-cyan-200 space-y-1.5 min-w-0 dark:bg-cyan-500/10 dark:border-cyan-500/20">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-cyan-700 dark:text-cyan-300 truncate">Carbos</span>
              <span className="text-cyan-700 dark:text-cyan-400 font-mono text-[9px] sm:text-[11px] shrink-0">{totals.carbs}g / {nutritionGoal.targetCarbs}g</span>
            </div>
            <div className="h-1.5 w-full bg-cyan-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${carbPercent}%` }} />
            </div>
          </div>

          {/* Grasas */}
          <div className="p-2 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 min-w-0 dark:bg-amber-500/10 dark:border-amber-500/20">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-amber-700 dark:text-amber-300 truncate">Grasas</span>
              <span className="text-amber-700 dark:text-amber-400 font-mono text-[9px] sm:text-[11px] shrink-0">{totals.fats}g / {nutritionGoal.targetFats}g</span>
            </div>
            <div className="h-1.5 w-full bg-amber-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── SELECTOR SEMANAL COMPLETO (LUNES A DOMINGO) ── */}
      <div className="w-full flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar dark:bg-white/[0.03] dark:border-white/10">
        {DAYS_OF_WEEK.map((d) => {
          const isSelected = selectedDay === d.id
          const isToday = todayDayOfWeek === d.id
          const count = itemsCountByDay[d.id] || 0

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDay(d.id)}
              className={cn(
                'flex-1 min-w-[76px] py-2 px-2 rounded-xl flex flex-col items-center justify-center transition-all text-xs relative select-none',
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 font-black dark:bg-purple-600 dark:ring-purple-400'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 font-semibold'
              )}
            >
              <div className="flex items-center gap-1">
                <span>{d.short}</span>
                {isToday && (
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isSelected ? 'bg-amber-300' : 'bg-emerald-500 dark:bg-purple-400'
                    )}
                    title="Hoy"
                  />
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-mono mt-0.5',
                  isSelected ? 'text-emerald-100 dark:text-purple-200' : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {count > 0 ? `${count} alim.` : '0 alim.'}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── BOTONES SUPERIORES PARA AÑADIR ALIMENTO O CREAR NUEVA TOMA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleOpenAddFood(mealSections[0]?.id || 'desayuno', mealSections[0]?.name || 'Desayuno')}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-xs sm:text-sm active:scale-[0.99]"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>+ Añadir Alimento</span>
        </button>

        <button
          type="button"
          onClick={handleOpenAddSection}
          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-xs sm:text-sm active:scale-[0.99] dark:bg-white/[0.04] dark:hover:bg-white/10 dark:text-white dark:border-white/10"
        >
          <Plus className="size-4 text-emerald-600 stroke-[2.5]" />
          <span>+ Nueva Toma / Comida</span>
        </button>
      </div>

      {/* ── BLOQUES DE COMIDAS DIARIAS (PREDETERMINADAS + PERSONALIZADAS) ── */}
      <div className="space-y-3">
        {mealSections.map((section, idx) => {
          const log = currentDayLogs.find((l) => l.mealType === section.id)
          const items = Array.isArray(log?.items) ? log.items : []

          const mealCalories = items.reduce((sum, i) => sum + (Number(i.calories) || 0), 0)
          const mealProtein = items.reduce((sum, i) => sum + (Number(i.protein) || 0), 0)
          const mealCarbs = items.reduce((sum, i) => sum + (Number(i.carbs) || 0), 0)
          const mealFats = items.reduce((sum, i) => sum + (Number(i.fats) || 0), 0)

          return (
            <Card
              key={section.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 dark:bg-[#121026]/85 dark:border-purple-500/20 dark:shadow-xl"
            >
              {/* Header de Comida */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-purple-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{section.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{section.name}</h4>
                    <span className="text-[11px] text-emerald-800 dark:text-purple-300 font-mono font-bold block sm:inline">
                      {mealCalories} kcal · P: {mealProtein}g · C: {mealCarbs}g · G: {mealFats}g
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reordenar posición */}
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 dark:bg-white/[0.03] dark:border-white/5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors dark:text-slate-400 dark:hover:text-white"
                      title="Mover arriba"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === mealSections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors dark:text-slate-400 dark:hover:text-white"
                      title="Mover abajo"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSyncToShoppingList(items, section.name)}
                      className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all text-xs flex items-center gap-1 dark:bg-purple-600/20 dark:hover:bg-purple-600/40 dark:text-purple-300 dark:border-purple-500/30"
                      title="Añadir ingredientes a Lista de Compras"
                    >
                      <ShoppingCart className="size-3.5" />
                      <span className="hidden sm:inline text-[11px] font-bold">A compras</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenAddFood(section.id, section.name)}
                    className="flex items-center gap-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-xs font-bold transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
                  >
                    <Plus className="size-3" />
                    <span>Añadir</span>
                  </button>

                  {/* Renombrar / Editar */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditSection(section)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:hover:text-purple-300 dark:hover:bg-white/5"
                    title="Renombrar toma"
                  >
                    <Edit2 className="size-3.5" />
                  </button>

                  {/* Eliminar (Secciones creadas por el usuario) */}
                  {!section.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(section)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors dark:hover:text-rose-400 dark:hover:bg-rose-500/10"
                      title="Eliminar toma"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Alimentos */}
              {items.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-1">Sin alimentos registrados para este día.</p>
              ) : (
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs dark:bg-white/[0.02] dark:border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.quantity ? `${item.quantity} · ` : ''}
                          <span className="text-emerald-800 dark:text-purple-300 font-semibold">{item.calories} kcal</span> (P: {item.protein}g · C: {item.carbs}g · G: {item.fats}g)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMealItem(section.id, item.id, selectedDay)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors dark:hover:text-rose-400"
                        title="Eliminar alimento"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* ── MODAL AÑADIR ALIMENTO CON PRESETS ── */}
      {isAddFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar dark:border-purple-500/30 dark:bg-[#100e23]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-purple-500/15">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-emerald-600 dark:text-emerald-400" />
                Añadir Alimento
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFoodModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Selector de Toma / Comida de Destino */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Toma de Destino</label>
              <select
                value={targetMealType}
                onChange={(e) => {
                  const sId = e.target.value
                  setTargetMealType(sId)
                  const found = mealSections.find((s) => s.id === sId)
                  setTargetMealLabel(found ? found.name : sId)
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 dark:border-purple-500/20 dark:bg-white/[0.04] py-2 px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500 cursor-pointer"
              >
                {mealSections.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#100e23] text-slate-900 dark:text-white">
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atajos rápidos:</span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar">
                {COMMON_FOOD_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-[11px] font-bold text-slate-800 hover:text-emerald-900 transition-colors dark:bg-white/[0.04] dark:hover:bg-emerald-600/30 dark:border-white/10 dark:text-slate-200 dark:hover:text-white"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario de alimento manual */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveFood(); }} className="space-y-3 text-xs pt-2 border-t border-slate-200 dark:border-purple-500/15">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nombre del Alimento <span className="text-red-500">*</span></label>
                <input
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Ej: Pechuga de pollo, Avena, Yogur..."
                  autoFocus
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 dark:border-purple-500/20 dark:bg-white/[0.04] py-2.5 px-3 font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-purple-500"
                />
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Calorías (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={foodCalories}
                    onChange={(e) => setFoodCalories(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-purple-500/20 dark:bg-white/[0.04] py-2 px-2 text-center font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-600 dark:text-rose-400">Proteína (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={foodProtein}
                    onChange={(e) => setFoodProtein(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-950/20 py-2 px-2 text-center font-mono font-bold text-rose-700 dark:text-rose-300 outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-cyan-600 dark:text-cyan-400">Carbos (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={foodCarbs}
                    onChange={(e) => setFoodCarbs(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-cyan-200 bg-cyan-50/50 dark:border-cyan-500/20 dark:bg-cyan-950/20 py-2 px-2 text-center font-mono font-bold text-cyan-700 dark:text-cyan-300 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400">Grasas (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={foodFats}
                    onChange={(e) => setFoodFats(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-950/20 py-2 px-2 text-center font-mono font-bold text-amber-700 dark:text-amber-300 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cantidad / Porción */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Cantidad / Porción (opcional)</label>
                <input
                  value={foodQuantity}
                  onChange={(e) => setFoodQuantity(e.target.value)}
                  placeholder="Ej: 150g, 1 taza, 2 huevos..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 dark:border-purple-500/20 dark:bg-white/[0.04] py-2 px-3 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-purple-500/15 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddFoodModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95"
                >
                  Añadir al Plato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL AJUSTAR METAS (CALCULADORA METABÓLICA INTELIGENTE & MANUAL) ── */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] overflow-hidden dark:border-purple-500/30 dark:bg-[#100e23]">
            {/* Cabecera Fija */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-purple-500/15 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 shrink-0">
                  <Flame className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Calculadora de Calorías & Macros</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ajuste metabólico conectado dinámicamente con tu peso</p>
                </div>
              </div>

              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:hover:text-white dark:hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Selector de Modo (Calculadora Inteligente vs Ajuste Manual) */}
            <div className="pt-3 shrink-0">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold dark:bg-white/[0.03] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveGoalTab('calculator')}
                  className={cn(
                    'py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all',
                    activeGoalTab === 'calculator'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  <Zap className="size-3.5" />
                  <span>Calculadora Inteligente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGoalTab('manual')}
                  className={cn(
                    'py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all',
                    activeGoalTab === 'manual'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  <Settings className="size-3.5" />
                  <span>Ajuste Manual</span>
                </button>
              </div>
            </div>

            {/* Cuerpo Scrolleable */}
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 pt-3 text-xs custom-fitness-scroll">
              {activeGoalTab === 'calculator' ? (
                <>
                  {/* ── 1. DATOS BIOLÓGICOS Y SINCRONIZACIÓN DE PESO ── */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 dark:bg-white/[0.02] dark:border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                        <User className="size-3.5" /> 1. Datos Base & Peso Actual
                      </span>
                      {bodyMetrics[0]?.weightKg && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                          <CheckCircle2 className="size-3" /> Sincronizado: {bodyMetrics[0].weightKg} kg
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-400">Género</label>
                        <div className="grid grid-cols-2 gap-1 bg-white dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => setCalcGender('hombre')}
                            className={cn(
                              'py-1.5 rounded-lg text-center text-[11px] transition-all',
                              calcGender === 'hombre'
                                ? 'bg-emerald-50/70 border border-emerald-500 text-slate-900 font-bold shadow-xs dark:bg-emerald-600 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-white'
                            )}
                          >
                            Hombre
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalcGender('mujer')}
                            className={cn(
                              'py-1.5 rounded-lg text-center text-[11px] transition-all',
                              calcGender === 'mujer'
                                ? 'bg-emerald-50/70 border border-emerald-500 text-slate-900 font-bold shadow-xs dark:bg-emerald-600 dark:text-white'
                                : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-white'
                            )}
                          >
                            Mujer
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-400">Edad</label>
                        <input
                          type="number"
                          value={calcAge}
                          onChange={(e) => setCalcAge(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white font-mono font-bold text-center outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-400">Altura (cm)</label>
                        <input
                          type="number"
                          value={calcHeight}
                          onChange={(e) => setCalcHeight(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white font-mono font-bold text-center outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-400">Peso Base (kg)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={calcWeight}
                            onChange={(e) => setCalcWeight(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white font-mono font-bold text-center outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Checkbox para guardar peso modificado */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={calcSaveWeightToProfile}
                        onChange={(e) => setCalcSaveWeightToProfile(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 size-3.5 bg-white dark:border-purple-500/30 dark:bg-white/5"
                      />
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Guardar también este peso como pesaje de hoy en mi historial de progreso
                      </span>
                    </label>
                  </div>

                  {/* ── 2. NIVEL DE ACTIVIDAD DIARIA ── */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                      <Activity className="size-3.5 text-emerald-600" /> 2. Nivel de Actividad Diaria & Deporte
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ACTIVITY_LEVELS.map((act) => {
                        const isSelected = calcActivity === act.id
                        return (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setCalcActivity(act.id as any)}
                            className={cn(
                              'p-2.5 rounded-2xl text-left transition-all flex items-start gap-2.5',
                              isSelected
                                ? 'bg-emerald-50/60 border-2 border-emerald-500 shadow-sm dark:bg-emerald-600/25 dark:border-emerald-400'
                                : 'bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/[0.02] dark:border-white/10 dark:hover:bg-white/[0.05]'
                            )}
                          >
                            <span className="text-xl shrink-0 p-1 rounded-xl bg-slate-100 dark:bg-white/5 shadow-2xs">{act.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                  {act.label}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold">x {act.factor}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{act.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── 3. OBJETIVO / FASE ACTUAL & RITMO ── */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 dark:bg-white/[0.02] dark:border-purple-500/20">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                      <Flame className="size-3.5 text-emerald-600" /> 3. Objetivo & Fase Actual
                    </label>

                    {/* Selector de 3 Fases */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcGoalPhase('definicion')
                          setCalcPace('moderado')
                        }}
                        className={cn(
                          'py-2.5 px-2 rounded-2xl text-xs transition-all text-center flex flex-col items-center gap-1',
                          calcGoalPhase === 'definicion'
                            ? 'bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 font-semibold shadow-sm dark:bg-rose-500/30 dark:border-rose-400 dark:text-rose-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium dark:bg-white/[0.02] dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                        )}
                      >
                        <span className="text-lg">🔥</span>
                        <span>Definición</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCalcGoalPhase('volumen')
                          setCalcPace('limpio')
                        }}
                        className={cn(
                          'py-2.5 px-2 rounded-2xl text-xs transition-all text-center flex flex-col items-center gap-1',
                          calcGoalPhase === 'volumen'
                            ? 'bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 font-semibold shadow-sm dark:bg-emerald-500/30 dark:border-emerald-400 dark:text-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium dark:bg-white/[0.02] dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                        )}
                      >
                        <span className="text-lg">💪</span>
                        <span>Volumen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCalcGoalPhase('mantenimiento')
                          setCalcPace('estandar')
                        }}
                        className={cn(
                          'py-2.5 px-2 rounded-2xl text-xs transition-all text-center flex flex-col items-center gap-1',
                          calcGoalPhase === 'mantenimiento'
                            ? 'bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 font-semibold shadow-sm dark:bg-emerald-600/30 dark:border-emerald-400 dark:text-emerald-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium dark:bg-white/[0.02] dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                        )}
                      >
                        <span className="text-lg">⚖️</span>
                        <span>Mantenimiento</span>
                      </button>
                    </div>

                    {/* Opciones dinámicas según la fase */}
                    {calcGoalPhase === 'definicion' && (
                      <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span>Ritmo de Pérdida de Grasa:</span>
                          <span className="text-emerald-700 dark:text-rose-400 font-mono font-bold">
                            {calcPace === 'conservador' ? '-300 kcal' : calcPace === 'agresivo' ? '-700 kcal' : '-500 kcal'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'conservador', label: 'Conservador', kcal: '-300' },
                            { id: 'moderado', label: 'Moderado', kcal: '-500' },
                            { id: 'agresivo', label: 'Agresivo', kcal: '-700' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setCalcPace(p.id as any)}
                              className={cn(
                                'py-2 px-1 rounded-xl text-[11px] transition-all text-center',
                                calcPace === p.id
                                  ? 'bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 font-semibold shadow-xs dark:bg-rose-500/30 dark:border-rose-400 dark:text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium dark:bg-white/[0.03] dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                              )}
                            >
                              <div className="text-slate-900 dark:text-white font-semibold">{p.label}</div>
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-rose-300 font-bold">{p.kcal} kcal</span>
                            </button>
                          ))}
                        </div>

                        <div className="pt-1.5 flex items-center justify-between gap-3">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Peso objetivo a bajar (kg):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={calcTargetWeight}
                            onChange={(e) => setCalcTargetWeight(e.target.value)}
                            placeholder="75"
                            className="w-28 rounded-xl border border-slate-200 bg-white py-1.5 px-3 font-mono font-bold text-slate-900 text-center outline-none focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {calcGoalPhase === 'volumen' && (
                      <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span>Ritmo de Ganancia Muscular:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                            {calcPace === 'limpio' ? '+250 kcal (Lean Bulk)' : '+400 kcal (Estándar)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'limpio', label: 'Volumen Limpio', desc: '+250 kcal · Mínima grasa' },
                            { id: 'estandar', label: 'Superávit Estándar', desc: '+400 kcal · Máxima fuerza' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setCalcPace(p.id as any)}
                              className={cn(
                                'py-2 px-2 rounded-xl text-[11px] transition-all text-left',
                                calcPace === p.id
                                  ? 'bg-emerald-50/60 border-2 border-emerald-500 text-slate-900 font-semibold shadow-xs dark:bg-emerald-500/30 dark:border-emerald-400 dark:text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium dark:bg-white/[0.03] dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                              )}
                            >
                              <div className="font-semibold text-slate-900 dark:text-white">{p.label}</div>
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold block">{p.desc}</span>
                            </button>
                          ))}
                        </div>

                        <div className="pt-1.5 flex items-center justify-between gap-3">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Peso objetivo a subir (kg):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={calcTargetWeight}
                            onChange={(e) => setCalcTargetWeight(e.target.value)}
                            placeholder="84"
                            className="w-28 rounded-xl border border-slate-200 bg-white py-1.5 px-3 font-mono font-bold text-slate-900 text-center outline-none focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {calcGoalPhase === 'mantenimiento' && (
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-slate-200">
                        ⚖️ Tu ingesta calórica se fijará exactamente en tu gasto metabólico diario (TDEE: {metabolicResults.tdee} kcal) para mantener tu peso corporal y rendimiento atlético estables.
                      </div>
                    )}
                  </div>

                  {/* ── 4. RESUMEN Y DESGLOSE EN TIEMPO REAL ── */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 dark:bg-gradient-to-br dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-900/20 dark:border-purple-500/40 dark:shadow-xl">
                    <div className="flex items-baseline justify-between border-b border-slate-200 dark:border-purple-500/20 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Meta Calórica Diaria Calculada
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{metabolicResults.calories}</span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">kcal / día</span>
                        </div>
                      </div>

                      <div className="text-right text-[10px] font-mono space-y-0.5 text-slate-500 dark:text-slate-400">
                        <div>TMB: <span className="text-slate-900 dark:text-slate-200 font-bold">{metabolicResults.bmr} kcal</span></div>
                        <div>TDEE: <span className="text-slate-900 dark:text-slate-200 font-bold">{metabolicResults.tdee} kcal</span></div>
                      </div>
                    </div>

                    {/* Barra Segmentada de Distribución de Macros */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-rose-600 dark:text-rose-400">Proteína ({metabolicResults.proteinPct}%)</span>
                        <span className="text-cyan-600 dark:text-cyan-400">Carbos ({metabolicResults.carbsPct}%)</span>
                        <span className="text-amber-600 dark:text-amber-400">Grasas ({metabolicResults.fatsPct}%)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden flex">
                        <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${metabolicResults.proteinPct}%` }} />
                        <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${metabolicResults.carbsPct}%` }} />
                        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${metabolicResults.fatsPct}%` }} />
                      </div>
                    </div>

                    {/* 3 Tarjetas de Macronutrientes */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {/* Proteína */}
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center dark:bg-rose-500/10 dark:border-rose-500/20">
                        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block">Proteína</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{metabolicResults.protein}g</p>
                        <span className="text-[10px] text-rose-600 dark:text-rose-300/80 block">{metabolicResults.proteinFactor} g/kg</span>
                      </div>

                      {/* Carbohidratos */}
                      <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-center dark:bg-cyan-500/10 dark:border-cyan-500/20">
                        <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase block">Carbos</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{metabolicResults.carbs}g</p>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-300/80 block">Energía</span>
                      </div>

                      {/* Grasas */}
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center dark:bg-amber-500/10 dark:border-amber-500/20">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">Grasas</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{metabolicResults.fats}g</p>
                        <span className="text-[10px] text-amber-600 dark:text-amber-300/80 block">{metabolicResults.fatsFactor} g/kg</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ── MODO AJUSTE MANUAL ── */
                <div className="space-y-4 p-2">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 dark:bg-slate-800/40 dark:border-white/10 dark:text-slate-300">
                    ✏️ Modo Manual: Introduce los valores exactos de calorías y macronutrientes que desees establecer para tu día.
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Calorías Diarias Objetivo (kcal)</label>
                    <input
                      type="number"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value)}
                      placeholder="2500"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 px-3 font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-rose-600 dark:text-rose-300 text-[11px]">Proteína (g)</label>
                      <input
                        type="number"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(e.target.value)}
                        placeholder="160"
                        className="w-full rounded-xl border border-rose-200 bg-rose-50/50 py-2 px-2 font-mono font-bold text-rose-700 text-center outline-none focus:border-rose-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-cyan-600 dark:text-cyan-300 text-[11px]">Carbos (g)</label>
                      <input
                        type="number"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(e.target.value)}
                        placeholder="300"
                        className="w-full rounded-xl border border-cyan-200 bg-cyan-50/50 py-2 px-2 font-mono font-bold text-cyan-700 text-center outline-none focus:border-cyan-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-amber-600 dark:text-amber-300 text-[11px]">Grasas (g)</label>
                      <input
                        type="number"
                        value={manualFats}
                        onChange={(e) => setManualFats(e.target.value)}
                        placeholder="70"
                        className="w-full rounded-xl border border-amber-200 bg-amber-50/50 py-2 px-2 font-mono font-bold text-amber-700 text-center outline-none focus:border-amber-500 dark:border-purple-500/20 dark:bg-white/[0.04] dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie Fijo con Botones de Acción */}
            <div className="pt-3 border-t border-slate-200 dark:border-purple-500/15 flex gap-2 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGoals}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-soft transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Guardar Objetivos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR TOMA PERSONALIZADA ── */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-emerald-400" />
                {editingSectionId ? 'Editar Toma / Comida' : 'Añadir Nueva Toma / Comida'}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Sugerencias Rápidas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugerencias rápidas:</span>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => {
                      setSectionName(sug.name)
                      setSectionIcon(sug.icon)
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all',
                      sectionName === sug.name
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-xs'
                        : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    <span>{sug.icon} {sug.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2 border-t border-purple-500/15">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nombre de la Comida / Toma <span className="text-red-500">*</span></label>
                <input
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="Ej: Snack Media Mañana, Post-Entreno..."
                  autoFocus
                  className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3 font-semibold text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Selector de Emoji / Icono */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Icono representativo</label>
                <div className="grid grid-cols-8 gap-1.5 p-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  {SECTION_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setSectionIcon(ico)}
                      className={cn(
                        'size-9 rounded-xl flex items-center justify-center text-lg transition-all',
                        sectionIcon === ico
                          ? 'bg-emerald-600/50 border border-emerald-400 scale-110 shadow-sm'
                          : 'hover:bg-white/10'
                      )}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-500/15 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSection}
                  disabled={!sectionName.trim()}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-50"
                >
                  {editingSectionId ? 'Guardar Cambios' : 'Crear Toma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
