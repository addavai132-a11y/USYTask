'use client'

import { useState } from 'react'
import { Plus, Dumbbell, Play, Edit2, Trash2, Search, X, Sparkles, Clock, Check, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { WorkoutRoutine, Exercise, MuscleGroup, EquipmentType, RoutineCategory } from '@/types/fitness'
import {
  muscleGroupLabels,
  equipmentLabels,
  routineCategoryLabels,
} from '@/types/fitness'
import { PREDEFINED_EXERCISES } from '@/lib/fitness-store'
import { ROUTINE_TEMPLATES, type RoutineTemplateVariant } from '@/lib/fitness-templates'
import { cn } from '@/lib/utils'

interface RoutinesTabProps {
  routines: WorkoutRoutine[]
  onSaveRoutine: (routine: WorkoutRoutine) => void
  onDeleteRoutine: (id: string) => void
  onStartSessionWithRoutine: (routine: WorkoutRoutine) => void
}

export function RoutinesTab({
  routines,
  onSaveRoutine,
  onDeleteRoutine,
  onStartSessionWithRoutine,
}: RoutinesTabProps) {
  const { toast } = useToast()
  const { confirmDelete } = useApp()

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)

  // Form State
  const [routineName, setRoutineName] = useState('')
  const [routineDescription, setRoutineDescription] = useState('')
  const [routineCategory, setRoutineCategory] = useState<RoutineCategory>('push_pull_legs')
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  // Exercise Picker Modal
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState<string>('all')

  const filteredRoutines = routines.filter((r) => {
    if (categoryFilter === 'all') return true
    return r.category === categoryFilter
  })

  function handleOpenCreate() {
    setEditingRoutineId(null)
    setRoutineName('⚡ Empuje A (Pecho, Hombro, Tríceps)')
    setRoutineDescription('Enfoque en fuerza e hipertrofia de empuje con press de banca y militar.')
    setRoutineCategory('push_pull_legs')
    setSelectedVariantIndex(0)
    const initialTemplate = ROUTINE_TEMPLATES.push_pull_legs[0]
    setSelectedExercises(initialTemplate ? [...initialTemplate.exercises] : [PREDEFINED_EXERCISES[0], PREDEFINED_EXERCISES[1], PREDEFINED_EXERCISES[10]])
    setIsModalOpen(true)
  }

  function handleLoadTemplate(variant: RoutineTemplateVariant) {
    setRoutineName(variant.name)
    setRoutineDescription(variant.description)
    setSelectedExercises([...variant.exercises])
    toast(`✨ Plantilla "${variant.name}" cargada. Personaliza los ejercicios abajo.`, '🏋️')
  }

  function handleOpenEdit(routine: WorkoutRoutine) {
    setEditingRoutineId(routine.id)
    setRoutineName(routine.name)
    setRoutineDescription(routine.description || '')
    setRoutineCategory(routine.category)
    setSelectedExercises([...routine.exercises])
    setIsModalOpen(true)
  }

  function handleToggleExerciseInRoutine(ex: Exercise) {
    if (selectedExercises.some((e) => e.id === ex.id)) {
      setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id))
    } else {
      setSelectedExercises((prev) => [...prev, ex])
    }
  }

  function handleSave() {
    if (!routineName.trim()) {
      toast('Por favor, escribe un nombre para la rutina', '❌')
      return
    }
    if (selectedExercises.length === 0) {
      toast('Añade al menos un ejercicio a la rutina', '❌')
      return
    }

    const routine: WorkoutRoutine = {
      id: editingRoutineId || `routine_${Date.now()}`,
      groupId: 'default',
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      category: routineCategory,
      exercises: selectedExercises,
      createdAt: new Date().toISOString(),
    }

    onSaveRoutine(routine)
    toast(editingRoutineId ? 'Rutina actualizada con éxito' : 'Rutina creada con éxito', '🏋️')
    setIsModalOpen(false)
  }

  // Filter exercises in picker
  const filteredCatalog = PREDEFINED_EXERCISES.filter((ex) => {
    if (exerciseMuscleFilter !== 'all' && ex.muscleGroup !== exerciseMuscleFilter) return false
    if (exerciseSearch.trim()) {
      const q = exerciseSearch.toLowerCase()
      return ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* ── Barra Resumen Superior Glassmorphism ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tabular-nums">{routines.length}</span>
          <span className="text-xs text-slate-400">rutinas disponibles</span>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>Crear rutina</span>
        </button>
      </div>

      {/* ── Filtro de Categorías ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <CustomSelect<string>
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              { value: 'push_pull_legs', label: 'Push / Pull / Legs (PPL)' },
              { value: 'torso_pierna', label: 'Torso / Pierna' },
              { value: 'fullbody', label: 'Fullbody' },
              { value: 'hipertrofia', label: 'Hipertrofia Específica' },
              { value: 'fuerza', label: 'Fuerza / Powerlifting' },
              { value: 'cardio', label: 'Cardio / Resistencia' },
              { value: 'personalizada', label: 'Personalizada' },
            ]}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {/* ── Listado de Rutinas ── */}
      {filteredRoutines.length === 0 ? (
        <div className="w-full min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
            🏋️
          </div>
          <p className="text-xs text-slate-400 max-w-xs">No tienes rutinas en esta categoría. Crea tu primera sesión.</p>
          <button
            onClick={handleOpenCreate}
            className="mt-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            + Crear mi primera rutina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRoutines.map((routine) => {
            // Distinct muscle groups in routine
            const muscleGroups = Array.from(new Set(routine.exercises.map((e) => e.muscleGroup)))

            return (
              <Card
                key={routine.id}
                className="p-4 bg-[#121026]/80 border border-purple-500/20 rounded-2xl shadow-xl backdrop-blur-xl transition-all hover:border-purple-500/40 flex flex-col justify-between gap-3 group"
              >
                {/* Header: Title & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors truncate">
                        {routine.name}
                      </h4>
                      <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                        {routineCategoryLabels[routine.category] || routine.category}
                      </span>
                    </div>
                    {routine.description && (
                      <p className="text-xs text-slate-400 font-medium">
                        {routine.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(routine)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Editar rutina"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        confirmDelete({
                          title: '¿Eliminar rutina?',
                          itemName: routine.name,
                          description: 'Esta rutina y sus ejercicios configurados se eliminarán de tu catálogo.',
                          confirmText: 'Eliminar Rutina',
                          onConfirm: () => {
                            onDeleteRoutine(routine.id)
                            toast('Rutina eliminada', '🗑️')
                          },
                        })
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Muscle Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {muscleGroups.map((mg) => {
                    const meta = muscleGroupLabels[mg]
                    return (
                      <span
                        key={mg}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold',
                          meta.color
                        )}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                    )
                  })}
                </div>

                {/* Exercise List Preview */}
                <div className="pt-2 border-t border-purple-500/15 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {routine.exercises.length} Ejercicios planificados:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {routine.exercises.map((ex, idx) => (
                      <div
                        key={`${ex.id}_${idx}`}
                        className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/5 px-2.5 py-1.5 text-xs text-slate-300"
                      >
                        <span className="text-purple-400 font-bold text-[10px] size-4 flex items-center justify-center rounded-full bg-purple-500/20">
                          {idx + 1}
                        </span>
                        <span className="truncate font-medium">{ex.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action: Iniciar Sesión Live */}
                <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="size-3 text-purple-400" /> ~60-75 min sugeridos
                  </span>

                  <button
                    onClick={() => onStartSessionWithRoutine(routine)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-purple-950/50 transition-all active:scale-95"
                  >
                    <Play className="size-3.5 fill-current" />
                    <span>⚡ Iniciar Sesión</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── MODAL CONSTRUCTOR / EDITOR DE RUTINA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#100e23] shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Cabecera Fija */}
            <div className="p-4 pb-2.5 border-b border-purple-500/20 flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Dumbbell className="size-5 text-purple-400" />
                {editingRoutineId ? 'Editar Rutina' : 'Crear Nueva Rutina'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Cuerpo con Scroll Vertical Completo */}
            <div className="p-4 flex-1 overflow-y-auto pr-2 space-y-4 custom-fitness-scroll text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Nombre de la Rutina <span className="text-red-500">*</span></label>
                <input
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Ej: Empuje A - Hipertrofia Pecho y Hombro"
                  autoFocus
                  className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3.5 text-xs font-semibold text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Categoría / Enfoque</label>
                  <CustomSelect<RoutineCategory>
                    value={routineCategory}
                    onChange={(cat) => {
                      setRoutineCategory(cat)
                      setSelectedVariantIndex(0)
                    }}
                    options={[
                      { value: 'push_pull_legs', label: 'Push / Pull / Legs (PPL)' },
                      { value: 'torso_pierna', label: 'Torso / Pierna' },
                      { value: 'fullbody', label: 'Fullbody' },
                      { value: 'hipertrofia', label: 'Hipertrofia Específica' },
                      { value: 'fuerza', label: 'Fuerza / Powerlifting' },
                      { value: 'cardio', label: 'Cardio / Resistencia' },
                      { value: 'personalizada', label: 'Personalizada (Desde cero)' },
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Descripción / Objetivo (opcional)</label>
                  <input
                    value={routineDescription}
                    onChange={(e) => setRoutineDescription(e.target.value)}
                    placeholder="Ej. 4 series por ejercicio, descanso 90s"
                    className="w-full rounded-2xl border border-purple-500/20 bg-white/[0.04] py-2.5 px-3.5 text-xs font-semibold text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* ── SELECTOR DE PLANTILLAS Y VARIANTES VIRALES ── */}
              {routineCategory !== 'personalizada' && (
                (() => {
                  const currentTemplates = ROUTINE_TEMPLATES[routineCategory] || []
                  const activeTemplate = currentTemplates[selectedVariantIndex] || currentTemplates[0]

                  if (currentTemplates.length === 0) return null

                  return (
                    <div className="space-y-2 pt-1 border-t border-purple-500/15">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                          <Sparkles className="size-3 text-purple-400" />
                          Plantillas Populares / Variantes
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {currentTemplates.length} variantes disponibles
                        </span>
                      </div>

                      {/* Selector de píldoras [ Variante 1 ] [ Variante 2 ] [ Variante 3 ] */}
                      <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 overflow-x-auto no-scrollbar">
                        {currentTemplates.map((variant, vIdx) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSelectedVariantIndex(vIdx)}
                            className={cn(
                              'flex-1 min-w-[90px] py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center truncate flex items-center justify-center gap-1',
                              selectedVariantIndex === vIdx
                                ? 'bg-purple-950/70 border border-purple-500/50 text-purple-100 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                            )}
                          >
                            <span>Variante {vIdx + 1}</span>
                            <span className="text-[9px] opacity-75 font-medium hidden sm:inline">· {variant.badge}</span>
                          </button>
                        ))}
                      </div>

                      {/* Tarjeta de Vista Previa de la Variante */}
                      {activeTemplate && (
                        <div className="p-3.5 rounded-2xl bg-[#100e23]/90 border border-purple-500/25 shadow-sm space-y-2.5 animate-fade-in">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-extrabold text-white text-xs truncate">
                                  {activeTemplate.name}
                                </h5>
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[9px] font-black text-purple-300">
                                  {activeTemplate.badge}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                  <Clock className="size-2.5" /> {activeTemplate.suggestedDuration}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                {activeTemplate.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleLoadTemplate(activeTemplate)}
                              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                            >
                              <Sparkles className="size-3 fill-current" />
                              <span>Cargar esta Rutina</span>
                            </button>
                          </div>

                          {/* Lista compacta de ejercicios incluidos en la plantilla */}
                          <div className="pt-2 border-t border-purple-500/15">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Ejercicios incluidos ({activeTemplate.exercises.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {activeTemplate.exercises.map((ex, exI) => {
                                const meta = muscleGroupLabels[ex.muscleGroup]
                                return (
                                  <span
                                    key={`${ex.id}_${exI}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/10 text-[10px] text-slate-200"
                                  >
                                    <span>{meta?.icon || '⚡'}</span>
                                    <span className="font-medium">{ex.name}</span>
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}

              {/* Constructor de Ejercicios */}
              <div className="space-y-2 pt-2 border-t border-purple-500/15">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span>Ejercicios Seleccionados ({selectedExercises.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-200 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="size-3.5" />
                    <span>Añadir / Buscar Ejercicio</span>
                  </button>
                </div>

                {selectedExercises.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-purple-500/30 text-center text-xs text-slate-400">
                    No has añadido ejercicios aún. Pulsa el botón superior para explorar el catálogo.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-fitness-scroll p-1 pr-2">
                    {selectedExercises.map((ex, idx) => {
                      const meta = muscleGroupLabels[ex.muscleGroup]
                      return (
                        <div
                          key={`${ex.id}_${idx}`}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate">{ex.name}</p>
                              <span className="text-[10px] text-slate-400">
                                {meta.icon} {meta.label} · {equipmentLabels[ex.equipment]}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedExercises((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Eliminar ejercicio"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pie Fijo (Footer) */}
            <div className="p-4 pt-3 border-t border-purple-500/20 mt-auto flex gap-2 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95"
              >
                Guardar Rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXPLORADOR / BUSCADOR DE EJERCICIOS ── */}
      {isExercisePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/30 bg-[#100e23] p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col space-y-3">
            {/* Cabecera y Buscador (Fijos arriba) */}
            <div className="shrink-0 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
                <div>
                  <h3 className="text-base font-black text-white">Catálogo de Ejercicios</h3>
                  <p className="text-[11px] text-slate-400">Selecciona los ejercicios que formarán parte de tu rutina</p>
                </div>
                <button
                  onClick={() => setIsExercisePickerOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Búsqueda y Filtro de Músculo */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <input
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Buscar ejercicio (ej. Press banca, sentadilla...)"
                    className="w-full rounded-xl border border-purple-500/20 bg-white/[0.04] py-2 px-3 pl-8 text-xs font-medium text-white outline-none focus:border-purple-500"
                  />
                </div>

                <CustomSelect<string>
                  value={exerciseMuscleFilter}
                  onChange={setExerciseMuscleFilter}
                  options={[
                    { value: 'all', label: 'Todos los músculos' },
                    { value: 'pecho', label: '🏋️‍♂️ Pecho' },
                    { value: 'espalda', label: '🚣 Espalda' },
                    { value: 'hombro', label: '🎯 Hombro' },
                    { value: 'cuadriceps', label: '🦵 Cuádriceps' },
                    { value: 'isquios', label: '🏃 Isquios' },
                    { value: 'gluteo', label: '🍑 Glúteo' },
                    { value: 'biceps', label: '💪 Bíceps' },
                    { value: 'triceps', label: '⚡ Tríceps' },
                    { value: 'gemelo', label: '🦶 Gemelo' },
                    { value: 'core', label: '🛡️ Core' },
                    { value: 'cardio', label: '❤️‍🔥 Cardio' },
                  ]}
                  className="w-44"
                />
              </div>
            </div>

            {/* Listado de Ejercicios (Contenedor scrolleable con scrollbar personalizada) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 max-h-[50vh] md:max-h-[55vh] pb-2 custom-fitness-scroll">
              {filteredCatalog.map((ex) => {
                const isAdded = selectedExercises.some((e) => e.id === ex.id)
                const meta = muscleGroupLabels[ex.muscleGroup]

                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleToggleExerciseInRoutine(ex)}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-[0.99]',
                      isAdded
                        ? 'bg-purple-950/60 border-purple-500/50 text-white'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.06] text-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0">{meta.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate">{ex.name}</p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {meta.label} · {equipmentLabels[ex.equipment]} {ex.targetRpeRir ? `· ${ex.targetRpeRir}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className={cn(
                      'size-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors',
                      isAdded ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/20'
                    )}>
                      {isAdded && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pie de Modal (Fijo abajo) */}
            <div className="pt-3 border-t border-purple-500/20 mt-2 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsExercisePickerOpen(false)}
                className="rounded-2xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-soft transition-transform active:scale-95"
              >
                Listo ({selectedExercises.length} seleccionados)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
