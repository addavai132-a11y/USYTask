'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { CustomSelect } from '@/components/ui/custom-select'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { AddTab, EventCategory } from '@/types'
import { EVENT_CATEGORIES, MEMBER_COLORS } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export function QuickAdd() {
  const {
    quickAddOpen,
    quickAddTab,
    quickAddHideTabs,
    quickAddDefaultSection,
    quickAddDefaultDate,
    taskCategories,
    closeQuickAdd,
    members,
    addTask,
    addEvent,
    addReminder,
    addMember,
  } = useApp()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<AddTab>('tarea')
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    if (quickAddOpen) {
      setActiveTab(quickAddTab || 'tarea')
      if (quickAddDefaultDate) {
        setEventDate(quickAddDefaultDate)
        setReminderDate(quickAddDefaultDate)
      } else {
        setEventDate(getTodayISO())
        setReminderDate(getTodayISO())
      }
      // Auto-assign current member if none selected
      const defaultMemberId = currentMember?.id || members[0]?.id
      if (defaultMemberId) {
        setTaskMembers((prev) => (prev.length === 0 ? [defaultMemberId] : prev))
        setEventMembers((prev) => (prev.length === 0 ? [defaultMemberId] : prev))
        setReminderMembers((prev) => (prev.length === 0 ? [defaultMemberId] : prev))
      }
    }
  }, [quickAddOpen, quickAddTab, quickAddDefaultDate, currentMember?.id, members])

  // Filter members available for the selected category
  const activeCategory = taskCategories.find((c) => c.id === quickAddDefaultSection || c.name === quickAddDefaultSection)
  const availableTaskMembers = activeCategory && activeCategory.memberIds && activeCategory.memberIds.length > 0
    ? members.filter((m) => activeCategory.memberIds.includes(m.id))
    : members

  // Task form
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPoints, setTaskPoints] = useState('10')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskDueTime, setTaskDueTime] = useState('')
  const [taskMembers, setTaskMembers] = useState<string[]>([])

  // Event form
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventCategory, setEventCategory] = useState<EventCategory | 'Otros'>('General')
  const [eventCustomCategory, setEventCustomCategory] = useState('')
  const [eventMembers, setEventMembers] = useState<string[]>([])

  // Reminder form
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [reminderMembers, setReminderMembers] = useState<string[]>([])

  // Member form
  const [memberName, setMemberName] = useState('')
  const [memberColor, setMemberColor] = useState(0)

  const resetForms = () => {
    setTaskTitle('')
    setTaskPoints('10')
    setTaskDueDate('')
    setTaskDueTime('')
    setTaskMembers([])
    setEventTitle('')
    setEventDate('')
    setEventTime('')
    setEventLocation('')
    setEventCategory('General')
    setEventCustomCategory('')
    setEventMembers([])
    setReminderTitle('')
    setReminderDate('')
    setReminderTime('')
    setReminderMembers([])
    setMemberName('')
    setMemberColor(0)
    setShowErrors(false)
  }

  const handleSaveTask = () => {
    const title = taskTitle.trim()
    if (!title) {
      setShowErrors(true)
      toast('Por favor, introduce un título para la tarea', '❌')
      return
    }

    const assigned = taskMembers.length > 0
      ? taskMembers
      : [currentMember?.id || members[0]?.id || 'usr_default']

    addTask(
      title,
      parseInt(taskPoints) || 10,
      assigned[0],
      quickAddDefaultSection || 'familia',
      'medium',
      taskDueDate || undefined,
      taskDueTime || undefined,
      assigned
    )
    toast('Tarea creada correctamente', '✅')
    resetForms()
    closeQuickAdd()
  }

  const handleSaveEvent = () => {
    const title = eventTitle.trim()
    if (!title) {
      setShowErrors(true)
      toast('Por favor, introduce un título para el evento', '❌')
      return
    }

    const assigned = eventMembers.length > 0
      ? eventMembers
      : [currentMember?.id || members[0]?.id || 'usr_default']

    const finalCat = eventCategory === 'Otros' && eventCustomCategory.trim() ? (eventCustomCategory.trim() as EventCategory) : (eventCategory as EventCategory)
    addEvent(
      title,
      eventDate || getTodayISO(),
      eventTime || undefined,
      finalCat,
      assigned,
      eventLocation || undefined
    )
    toast('Evento creado correctamente', '📅')
    resetForms()
    closeQuickAdd()
  }

  const handleSaveReminder = () => {
    if (!reminderTitle.trim() || !reminderDate) {
      setShowErrors(true)
      toast('Por favor, rellena los campos obligatorios', '❌')
      return
    }
    addReminder(reminderTitle.trim(), reminderDate, reminderMembers, reminderTime || undefined)
    toast('Recordatorio creado correctamente', '🔔')
    resetForms()
    closeQuickAdd()
  }

  const handleSaveMember = () => {
    if (!memberName.trim()) {
      setShowErrors(true)
      toast('Por favor, introduce el nombre del miembro', '❌')
      return
    }
    addMember(memberName.trim(), memberColor)
    toast('Miembro añadido correctamente', '👤')
    resetForms()
    closeQuickAdd()
  }

  const tabs: { id: AddTab; label: string; emoji: string }[] = [
    { id: 'tarea', label: 'Tarea', emoji: '✅' },
    { id: 'evento', label: 'Evento', emoji: '📅' },
    { id: 'recordatorio', label: 'Recordatorio', emoji: '🔔' },
    { id: 'miembro', label: 'Miembro', emoji: '👤' },
  ]

  const inputClass = 'h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm font-medium focus:border-primary focus:outline-none transition-colors'
  const labelClass = 'text-xs font-bold text-muted-foreground'

  const getTitle = () => {
    switch (activeTab) {
      case 'tarea':
        return 'Añadir nueva tarea'
      case 'evento':
        return 'Añadir nuevo evento'
      case 'recordatorio':
        return 'Añadir nuevo recordatorio'
      case 'miembro':
        return 'Añadir nuevo miembro'
      default:
        return '¿Qué quieres añadir?'
    }
  }

  return (
    <BottomSheet
      open={quickAddOpen}
      onClose={() => {
        resetForms()
        closeQuickAdd()
      }}
      title={getTitle()}
    >
      {/* Tab selector */}
      {!quickAddHideTabs && (
        <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id)
                setShowErrors(false)
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all active:scale-95',
                activeTab === t.id
                  ? 'bg-foreground text-background shadow-soft'
                  : 'bg-secondary text-secondary-foreground',
              )}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* TASK FORM */}
      {activeTab === 'tarea' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Título de la tarea <span className="text-red-500">*</span></label>
            <input
              value={taskTitle}
              onChange={(e) => { setTaskTitle(e.target.value); setShowErrors(false) }}
              placeholder="Ej: Sacar la basura"
              className={cn(inputClass, showErrors && !taskTitle.trim() && 'border-red-500 bg-red-500/10')}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className={labelClass}>Fecha (opcional)</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Hora (opcional)</label>
                {taskDueTime && (
                  <button
                    type="button"
                    onClick={() => setTaskDueTime('')}
                    className="text-[10.5px] font-bold text-rose-500 hover:underline"
                  >
                    Borrar hora
                  </button>
                )}
              </div>
              <input
                type="time"
                value={taskDueTime}
                onChange={(e) => setTaskDueTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-32 flex flex-col gap-1">
              <label className={labelClass}>Puntos <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={taskPoints}
                onChange={(e) => { setTaskPoints(e.target.value); setShowErrors(false) }}
                className={cn(inputClass, showErrors && (!taskPoints.trim() || isNaN(parseInt(taskPoints))) && 'border-red-500 bg-red-500/10')}
                min="0"
              />
            </div>
            <div className="flex-1">
              <MemberMultiSelect
                members={availableTaskMembers}
                selectedIds={taskMembers}
                onChange={(ids) => { setTaskMembers(ids); setShowErrors(false) }}
                label="Asignar responsables"
                required
              />
            </div>
          </div>
          {showErrors && taskMembers.length === 0 && (
            <p className="text-[11px] font-bold text-red-500">Selecciona al menos un responsable</p>
          )}

          <div className="mt-3 flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                resetForms()
                closeQuickAdd()
              }}
              className="flex-1 sm:flex-initial rounded-2xl border border-border bg-secondary/60 hover:bg-secondary px-5 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveTask}
              className="flex-1 sm:flex-initial rounded-2xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              Crear tarea
            </button>
          </div>
        </div>
      )}

      {/* EVENT FORM */}
      {activeTab === 'evento' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Título del evento <span className="text-red-500">*</span></label>
            <input
              value={eventTitle}
              onChange={(e) => { setEventTitle(e.target.value); setShowErrors(false) }}
              placeholder="Ej: Reunión de equipo"
              className={cn(inputClass, showErrors && !eventTitle.trim() && 'border-red-500 bg-red-500/10')}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className={labelClass}>Fecha <span className="text-red-500">*</span></label>
              <input
                type="date"
                min={getTodayISO()}
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); setShowErrors(false) }}
                className={cn(inputClass, showErrors && !eventDate && 'border-red-500 bg-red-500/10')}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Hora (opcional)</label>
                {eventTime && (
                  <button
                    type="button"
                    onClick={() => setEventTime('')}
                    className="text-[10.5px] font-bold text-rose-500 hover:underline"
                  >
                    Borrar hora
                  </button>
                )}
              </div>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Ubicación (opcional)</label>
            <input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Ej: Oficina central"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Categoría <span className="text-red-500">*</span></label>
            <CustomSelect<string>
              value={eventCategory}
              onChange={(val) => { setEventCategory(val as any); setShowErrors(false) }}
              options={[
                ...EVENT_CATEGORIES.map((c) => ({ value: c, label: c })),
                { value: 'Otros', label: 'Otros' },
              ]}
              className="w-full"
            />
          </div>

          {eventCategory === 'Otros' && (
            <div className="flex flex-col gap-1 animate-fade-in">
              <label className={labelClass}>Especifica la categoría/concepto <span className="text-red-500">*</span></label>
              <input
                value={eventCustomCategory}
                onChange={(e) => setEventCustomCategory(e.target.value)}
                placeholder="Escribe la categoría personalizada..."
                className={inputClass}
              />
            </div>
          )}

          <MemberMultiSelect
            members={members}
            selectedIds={eventMembers}
            onChange={(ids) => { setEventMembers(ids); setShowErrors(false) }}
            label="Miembros asignados / asistentes"
            required
          />
          {showErrors && eventMembers.length === 0 && (
            <p className="text-[11px] font-bold text-red-500">Selecciona al menos un miembro</p>
          )}

          <div className="mt-3 flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                resetForms()
                closeQuickAdd()
              }}
              className="flex-1 sm:flex-initial rounded-2xl border border-border bg-secondary/60 hover:bg-secondary px-5 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveEvent}
              className="flex-1 sm:flex-initial rounded-2xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              Crear evento
            </button>
          </div>
        </div>
      )}

      {/* REMINDER FORM */}
      {activeTab === 'recordatorio' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Título del recordatorio <span className="text-red-500">*</span></label>
            <input
              value={reminderTitle}
              onChange={(e) => { setReminderTitle(e.target.value); setShowErrors(false) }}
              placeholder="Ej: ITV del coche"
              className={cn(inputClass, showErrors && !reminderTitle.trim() && 'border-red-500 bg-red-500/10')}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className={labelClass}>Fecha límite <span className="text-red-500">*</span></label>
              <input
                type="date"
                min={getTodayISO()}
                value={reminderDate}
                onChange={(e) => { setReminderDate(e.target.value); setShowErrors(false) }}
                className={cn(inputClass, showErrors && !reminderDate && 'border-red-500 bg-red-500/10')}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Hora (opcional)</label>
                {reminderTime && (
                  <button
                    type="button"
                    onClick={() => setReminderTime('')}
                    className="text-[10.5px] font-bold text-rose-500 hover:underline"
                  >
                    Borrar hora
                  </button>
                )}
              </div>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <MemberMultiSelect
            members={members}
            selectedIds={reminderMembers}
            onChange={setReminderMembers}
            label="Asignar miembros (opcional)"
          />

          <div className="mt-3 flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                resetForms()
                closeQuickAdd()
              }}
              className="flex-1 sm:flex-initial rounded-2xl border border-border bg-secondary/60 hover:bg-secondary px-5 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveReminder}
              className="flex-1 sm:flex-initial rounded-2xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              Crear recordatorio
            </button>
          </div>
        </div>
      )}

      {/* MEMBER FORM */}
      {activeTab === 'miembro' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nombre del miembro <span className="text-red-500">*</span></label>
            <input
              value={memberName}
              onChange={(e) => { setMemberName(e.target.value); setShowErrors(false) }}
              placeholder="Ej: Carlos"
              className={cn(inputClass, showErrors && !memberName.trim() && 'border-red-500 bg-red-500/10')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Color del avatar</label>
            <div className="flex gap-2 flex-wrap">
              {MEMBER_COLORS.map((c, i) => (
                <button
                  key={c.var}
                  onClick={() => setMemberColor(i)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full transition-all active:scale-90',
                    memberColor === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : '',
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => {
                resetForms()
                closeQuickAdd()
              }}
              className="flex-1 sm:flex-initial rounded-2xl border border-border bg-secondary/60 hover:bg-secondary px-5 py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMember}
              className="flex-1 sm:flex-initial rounded-2xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              Añadir miembro
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
