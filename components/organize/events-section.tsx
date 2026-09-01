'use client'

import { useState } from 'react'
import {
  Plus,
  Vote,
  Check,
  Trash2,
  Calendar,
  MapPin,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Trophy,
  Lock,
  FileText,
  HelpCircle,
  Users,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { EventRow } from '@/components/shared/event-row'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { useApp } from '@/components/app/app-context'
import {
  getEventMemberIds,
  type Member,
  type EventCategory,
  EVENT_CATEGORIES,
  categoryLabels,
  type EventPoll,
  type PollType,
} from '@/types'
import { getTodayISO, isPastDateTime } from '@/lib/date-utils'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function EventsSection({
  memberFilter = 'all',
  searchQuery = '',
}: {
  memberFilter?: string
  searchQuery?: string
}) {
  const {
    events,
    eventPolls,
    members,
    currentMember,
    getMemberById,
    deleteEvent,
    openQuickAdd,
    addEventPoll,
    voteEventPoll,
    closeEventPoll,
    deleteEventPoll,
  } = useApp()
  const { toast } = useToast()

  const [sectionTab, setSectionTab] = useState<'todos' | 'eventos' | 'encuestas'>('todos')

  // Create Poll Modal state
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [pollType, setPollType] = useState<PollType>('event')
  const [pollTitle, setPollTitle] = useState('')
  const [pollDescription, setPollDescription] = useState('')
  const [pollLocation, setPollLocation] = useState('')
  const [pollCategory, setPollCategory] = useState<EventCategory>('General')
  const [pollOptions, setPollOptions] = useState<{ title: string; date?: string; time?: string }[]>([])
  const [editingTimeIdx, setEditingTimeIdx] = useState<number | null>(null)
  const [pollParticipants, setPollParticipants] = useState<string[]>([])
  const [pollAllowMultipleVotes, setPollAllowMultipleVotes] = useState(false)
  const [pollCloseDate, setPollCloseDate] = useState('')
  const [showPollErrors, setShowPollErrors] = useState(false)

  const activePollsCount = eventPolls.filter((p) => p.status === 'active').length

  const filtered = events.filter((e) => {
    if (memberFilter !== 'all') {
      const memberIds = getEventMemberIds(e)
      if (!memberIds.includes(memberFilter)) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!e.title.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) return false
    }
    return true
  })
  const sortedEvents = [...filtered].sort(
    (a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime()
  )

  function handleOpenCreatePoll() {
    setPollType('event')
    setPollTitle('')
    setPollDescription('')
    setPollLocation('')
    setPollCategory('General')
    setPollOptions([
      { title: '', date: getTodayISO(), time: '18:00' },
      { title: '', date: getTodayISO(), time: '20:00' },
    ])
    setEditingTimeIdx(null)
    setPollParticipants(members.map((m) => m.id))
    setPollAllowMultipleVotes(false)
    setPollCloseDate('')
    setShowPollErrors(false)
    setIsCreatingPoll(true)
  }

  function handleAddPollOption() {
    const newIdx = pollOptions.length
    if (pollType === 'event') {
      setPollOptions((prev) => [...prev, { title: '', date: getTodayISO(), time: '18:00' }])
      setEditingTimeIdx(newIdx)
    } else {
      setPollOptions((prev) => [...prev, { title: '', date: '', time: '' }])
    }
  }

  function handleRemovePollOption(index: number) {
    setPollOptions((prev) => prev.filter((_, i) => i !== index))
    if (editingTimeIdx === index) setEditingTimeIdx(null)
  }

  function handleSavePoll() {
    if (!pollTitle.trim() || pollParticipants.length === 0) {
      setShowPollErrors(true)
      toast('Por favor, indica un título y al menos un participante', '⚠️')
      return
    }

    if (pollType === 'event') {
      const validOptions = pollOptions.filter((o) => o.title.trim() && o.date && o.time)
      if (validOptions.length < 2) {
        setShowPollErrors(true)
        toast('Añade al menos 2 alternativas completas con nombre, fecha y hora', '⚠️')
        return
      }

      const pastOption = validOptions.find((o) => isPastDateTime(o.date!, o.time!))
      if (pastOption) {
        toast('Las alternativas no pueden tener fechas u horas pasadas', '⚠️')
        return
      }

      if (pollCloseDate && isPastDateTime(pollCloseDate, '23:59')) {
        toast('La fecha de cierre de la votación no puede ser anterior a la actual', '⚠️')
        return
      }

      addEventPoll(
        pollTitle.trim(),
        pollCategory,
        validOptions.map((o) => ({ ...o, title: o.title.trim() })),
        pollParticipants,
        pollLocation.trim() || undefined,
        pollDescription.trim() || undefined,
        'event',
        pollAllowMultipleVotes,
        pollCloseDate || undefined
      )
    } else {
      const validOptions = pollOptions.filter((o) => o.title.trim())
      if (validOptions.length < 2) {
        setShowPollErrors(true)
        toast('Añade al menos 2 opciones de respuesta', '⚠️')
        return
      }

      const pastOption = validOptions.find((o) => o.date && isPastDateTime(o.date, o.time || '00:00'))
      if (pastOption) {
        toast('Las fechas no pueden ser anteriores a la actual', '⚠️')
        return
      }

      if (pollCloseDate && isPastDateTime(pollCloseDate, '23:59')) {
        toast('La fecha de cierre de la votación no puede ser anterior a la actual', '⚠️')
        return
      }

      addEventPoll(
        pollTitle.trim(),
        pollCategory,
        validOptions.map((o) => ({
          title: o.title.trim(),
          date: o.date || undefined,
          time: o.time || undefined,
        })),
        pollParticipants,
        pollLocation.trim() || undefined,
        pollDescription.trim() || undefined,
        'general',
        pollAllowMultipleVotes,
        pollCloseDate || undefined
      )
    }

    toast('Encuesta creada correctamente', '🗳️')
    setIsCreatingPoll(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Card Glassmorphism Compacto */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{sortedEvents.length}</span>
          <span className="text-xs text-neutral-500">eventos programados</span>
        </div>

        <button
          onClick={handleOpenCreatePoll}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-transform active:scale-95"
        >
          <Vote className="size-3.5" />
          <span>+ Crear encuesta</span>
        </button>
      </div>

      {/* Subtabs Filter Compactos */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/10 rounded-2xl w-fit">
        <button
          onClick={() => setSectionTab('todos')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            sectionTab === 'todos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          Todos ({sortedEvents.length + activePollsCount})
        </button>
        <button
          onClick={() => setSectionTab('eventos')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            sectionTab === 'eventos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          Eventos ({sortedEvents.length})
        </button>
        <button
          onClick={() => setSectionTab('encuestas')}
          className={cn(
            'rounded-xl px-3 py-1 text-xs font-bold transition-all',
            sectionTab === 'encuestas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          Encuestas ({eventPolls.length})
        </button>
      </div>

      {/* ── SPLIT VIEW (TODOS) ── */}
      {sectionTab === 'todos' && (
        <div className="flex flex-col gap-4">
          {/* Active Polls Panel */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Vote className="size-3.5 text-amber-500" />
                Encuestas y Votaciones ({eventPolls.length})
              </h4>
            </div>

            {eventPolls.length === 0 ? (
              <div className="w-full min-h-[120px] p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
                <p className="text-xs text-slate-400">No hay encuestas activas para votar planes u opiniones.</p>
                <button
                  onClick={handleOpenCreatePoll}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  + Crear primera encuesta
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {eventPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    members={members}
                    currentMember={currentMember}
                    getMemberById={getMemberById}
                    onVote={(optId) => voteEventPoll(poll.id, optId)}
                    onClosePoll={() => closeEventPoll(poll.id)}
                    onDelete={() => deleteEventPoll(poll.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Scheduled Events Feed */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-600" />
                Eventos Oficiales ({sortedEvents.length})
              </h4>
            </div>

            {sortedEvents.length === 0 ? (
              <div className="w-full min-h-[140px] p-6 flex flex-col items-center justify-center gap-2.5 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
                <p className="text-xs text-slate-400">No hay eventos programados en este grupo.</p>
                <button
                  onClick={() => openQuickAdd('evento', { hideTabs: true })}
                  className="text-xs font-bold text-emerald-700 hover:underline dark:text-purple-400"
                >
                  + Añadir evento
                </button>
              </div>
            ) : (
              <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
                <div className="flex flex-col divide-y divide-border/60">
                  {sortedEvents.map((e) => {
                    const assignedMembers = getEventMemberIds(e)
                      .map((id) => getMemberById(id))
                      .filter(Boolean) as Member[]
                    return (
                      <EventRow
                        key={e.id}
                        event={e}
                        members={assignedMembers}
                        onDelete={() => deleteEvent(e.id)}
                      />
                    )
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── EVENTS ONLY VIEW ── */}
      {sectionTab === 'eventos' && (
        <>
          {sortedEvents.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 text-lg">
                📅
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay eventos programados en este grupo.</p>
              <button
                onClick={() => openQuickAdd('evento', { hideTabs: true })}
                className="mt-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Añadir evento
              </button>
            </div>
          ) : (
            <Card className="p-2 bg-white/[0.02] border-white/10 rounded-2xl">
              <div className="flex flex-col divide-y divide-border/60">
                {sortedEvents.map((e) => {
                  const assignedMembers = getEventMemberIds(e)
                    .map((id) => getMemberById(id))
                    .filter(Boolean) as Member[]
                  return (
                    <EventRow
                      key={e.id}
                      event={e}
                      members={assignedMembers}
                      onDelete={() => deleteEvent(e.id)}
                    />
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── POLLS ONLY VIEW ── */}
      {sectionTab === 'encuestas' && (
        <div className="flex flex-col gap-4">
          {eventPolls.length === 0 ? (
            <div className="w-full min-h-[200px] sm:min-h-[220px] p-6 flex flex-col items-center justify-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-lg">
                🗳️
              </div>
              <p className="text-xs text-slate-400 max-w-xs">No hay encuestas creadas en este grupo.</p>
              <button
                onClick={handleOpenCreatePoll}
                className="mt-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                + Crear encuesta
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {eventPolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  members={members}
                  currentMember={currentMember}
                  getMemberById={getMemberById}
                  onVote={(optId) => voteEventPoll(poll.id, optId)}
                  onClosePoll={() => closeEventPoll(poll.id)}
                  onDelete={() => deleteEventPoll(poll.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear Encuesta */}
      {isCreatingPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Vote className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Crear nueva encuesta</h3>
                  <p className="text-[11px] text-muted-foreground">Define las opciones y decide en equipo</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingPoll(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Selector de Tipo de Encuesta */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-muted-foreground">Tipo de Encuesta <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPollType('event')
                      // Ensure options have default date/time
                      setPollOptions((prev) =>
                        prev.map((o) => ({
                          ...o,
                          date: o.date || getTodayISO(),
                          time: o.time || '18:00',
                        }))
                      )
                    }}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all active:scale-98',
                      pollType === 'event'
                        ? 'border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      <Calendar className="size-3.5" />
                      <span>Para definir Evento</span>
                    </div>
                    <p className="text-[10.5px] leading-tight opacity-80">
                      Al resolverse, la opción ganadora se publicará <strong>automáticamente como un Evento Oficial</strong> en el calendario.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPollType('general')}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all active:scale-98',
                      pollType === 'general'
                        ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500'
                        : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-600 dark:text-amber-400">
                      <HelpCircle className="size-3.5" />
                      <span>Encuesta General / Otra</span>
                    </div>
                    <p className="text-[10.5px] leading-tight opacity-80">
                      Para votar opiniones o cosas informales (ej: cena, películas). Fechas opcionales y <strong>no se publica</strong> en el calendario.
                    </p>
                  </button>
                </div>
              </div>

              {/* Título */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">
                  {pollType === 'event' ? 'Título del evento / plan a decidir' : 'Pregunta o tema a votar'} <span className="text-red-500">*</span>
                </label>
                <input
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder={
                    pollType === 'event'
                      ? 'Ej: Barbacoa familiar, Partido de pádel, Salida al cine...'
                      : 'Ej: ¿Qué cenamos esta noche?, ¿Qué película vemos?...'
                  }
                  autoFocus
                  className={cn(
                    'w-full rounded-2xl border border-border bg-secondary/50 py-2.5 px-3.5 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-colors',
                    showPollErrors && !pollTitle.trim() && 'border-red-500 bg-red-500/10'
                  )}
                />
              </div>

              {/* Descripción opcional */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Descripción o detalles (opcional)</label>
                <textarea
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  rows={2}
                  placeholder="Añade detalles, notas o instrucciones sobre la votación..."
                  className="w-full rounded-2xl border border-border bg-secondary/50 py-2 px-3 text-xs font-medium outline-none focus:border-primary focus:bg-card transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Categoría</label>
                  <CustomSelect<EventCategory>
                    value={pollCategory}
                    onChange={setPollCategory}
                    options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="font-bold text-muted-foreground">Ubicación (opcional)</label>
                  <input
                    value={pollLocation}
                    onChange={(e) => setPollLocation(e.target.value)}
                    placeholder="Ej: En casa de los abuelos, Restaurante..."
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-2 px-3 text-xs font-medium outline-none focus:border-primary focus:bg-card transition-colors"
                  />
                </div>
              </div>

              {/* Opciones de la encuesta */}
              <div className="flex flex-col gap-2 pt-1 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-muted-foreground flex items-center gap-1.5">
                    <span>{pollType === 'event' ? 'Alternativas de fechas / planes' : 'Opciones de respuesta'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Añadir opción</span>
                  </button>
                </div>

                {pollOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-5 text-center">
                    <Vote className="size-7 text-muted-foreground mb-1.5" />
                    <p className="text-xs font-semibold text-muted-foreground mb-3">Añade al menos 2 opciones para que los miembros puedan votar.</p>
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
                    >
                      <Plus className="size-3.5" />
                      <span>+ Añadir primera opción</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex flex-col gap-2 bg-secondary/40 p-3 rounded-2xl border border-border/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px]">
                              {i + 1}
                            </span>
                            Opción {i + 1}
                          </span>
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePollOption(i)}
                              className="p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors shrink-0"
                              title="Eliminar opción"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          value={opt.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, title: val } : o)))
                          }}
                          placeholder={
                            pollType === 'event'
                              ? 'Nombre o variante del plan (ej: Sábado por la tarde, Opción comida...)'
                              : 'Texto de la opción (ej: Pizza artesanal, Hamburguesas, Sushi...)'
                          }
                          className={cn(
                            'w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary',
                            showPollErrors && !opt.title.trim() && 'border-red-500 bg-red-500/10'
                          )}
                        />

                        {/* Campos de Fecha y Hora */}
                        {pollType === 'event' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-bold text-muted-foreground">Fecha del evento *</span>
                              <input
                                type="date"
                                min={getTodayISO()}
                                value={opt.date || getTodayISO()}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, date: val } : o)))
                                }}
                                className="w-full rounded-xl border border-border bg-card py-1.5 px-2.5 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10.5px] font-bold text-muted-foreground">Hora de inicio *</span>
                              <input
                                type="time"
                                value={opt.time || '18:00'}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, time: val } : o)))
                                }}
                                className="w-full rounded-xl border border-border bg-card py-1.5 px-2.5 text-xs font-semibold outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          // En encuesta general las fechas son totalmente opcionales
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setEditingTimeIdx(editingTimeIdx === i ? null : i)}
                                className="text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <Clock className="size-3" />
                                <span>{opt.date || opt.time ? `Fecha/Hora: ${opt.date || ''} ${opt.time || ''}` : '+ Añadir fecha u hora orientativa (opcional)'}</span>
                              </button>
                              {(opt.date || opt.time) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, date: '', time: '' } : o)))
                                  }}
                                  className="text-[10px] font-bold text-rose-500 hover:underline"
                                >
                                  Borrar
                                </button>
                              )}
                            </div>

                            {editingTimeIdx === i && (
                              <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-border/30 animate-fade-in">
                                <input
                                  type="date"
                                  min={getTodayISO()}
                                  value={opt.date || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, date: val } : o)))
                                  }}
                                  className="w-full rounded-xl border border-border bg-card py-1 px-2 text-xs font-semibold outline-none"
                                />
                                <input
                                  type="time"
                                  value={opt.time || ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, time: val } : o)))
                                  }}
                                  className="w-full rounded-xl border border-border bg-card py-1 px-2 text-xs font-semibold outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="size-4" />
                      <span>+ Añadir otra opción</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Opciones Adicionales de la Encuesta */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/60">
                <span className="font-bold text-muted-foreground text-xs">Ajustes adicionales</span>
                
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAllowMultipleVotes}
                    onChange={(e) => setPollAllowMultipleVotes(e.target.checked)}
                    className="size-4 rounded text-primary border-border focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-foreground">Permitir que cada persona vote más de una opción</span>
                </label>

                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Fecha límite para votar (opcional):</span>
                  <input
                    type="date"
                    min={getTodayISO()}
                    value={pollCloseDate}
                    onChange={(e) => setPollCloseDate(e.target.value)}
                    className="w-full sm:w-1/2 rounded-xl border border-border bg-card py-1.5 px-3 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              {/* Participantes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-muted-foreground">Participantes convocados <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => {
                      if (pollParticipants.length === members.length) {
                        setPollParticipants([])
                      } else {
                        setPollParticipants(members.map((m) => m.id))
                      }
                    }}
                    className="font-bold text-primary hover:underline text-[11px]"
                  >
                    {pollParticipants.length === members.length ? 'Desmarcar todos' : '+ Seleccionar todos'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (pollParticipants.length === members.length) {
                        setPollParticipants([])
                      } else {
                        setPollParticipants(members.map((m) => m.id))
                      }
                    }}
                    className={cn(
                      'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 border',
                      pollParticipants.length === members.length
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-dashed border-primary/50 bg-primary/5 text-primary hover:bg-primary/10'
                    )}
                  >
                    <span>{pollParticipants.length === members.length ? '✓ Todos' : '+ Todos'}</span>
                  </button>
                  {members.map((m) => {
                    const isSelected = pollParticipants.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPollParticipants((prev) =>
                            prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                          )
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 border',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary'
                        )}
                      >
                        <MemberAvatar member={m} size="xs" />
                        <span>{m.name}</span>
                        {isSelected && <Check className="size-3 text-primary stroke-[3]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 flex gap-2 justify-end pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsCreatingPoll(false)}
                  className="rounded-2xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePoll}
                  className="rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
                >
                  Crear encuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PollCard({
  poll,
  members,
  currentMember,
  getMemberById,
  onVote,
  onClosePoll,
  onDelete,
}: {
  poll: EventPoll
  members: Member[]
  currentMember: Member | null
  getMemberById: (id: string) => Member | null
  onVote: (optionId: string) => void
  onClosePoll: () => void
  onDelete: () => void
}) {
  const { toast } = useToast()
  const totalParticipants = poll.participantMemberIds.length
  const votedMembersSet = new Set<string>()
  poll.options.forEach((opt) => opt.votes.forEach((id) => votedMembersSet.add(id)))
  const votedCount = votedMembersSet.size
  const isResolved = poll.status === 'resolved'
  const isEventPoll = poll.pollType !== 'general'
  const percentage = totalParticipants > 0 ? Math.round((votedCount / totalParticipants) * 100) : 0

  // Total votes cast across all options
  const totalVotesCast = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)

  // Winning option
  const winningOption = isResolved
    ? poll.winningOptionId
      ? poll.options.find((o) => o.id === poll.winningOptionId)
      : [...poll.options].sort((a, b) => b.votes.length - a.votes.length)[0]
    : null

  return (
    <Card className={cn('p-4 border transition-all', isResolved ? 'bg-emerald-500/5 border-emerald-500/30' : 'border-border')}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10.5px] font-extrabold border',
                isEventPoll
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
              )}
            >
              {isEventPoll ? '📅 Encuesta de Evento' : '🗳️ Encuesta General'}
            </span>

            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {categoryLabels[poll.category] || poll.category}
            </span>

            {poll.allowMultipleVotes && (
              <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">
                Votos múltiples
              </span>
            )}
          </div>

          <h4 className="text-base font-extrabold tracking-tight text-foreground">{poll.title}</h4>

          {poll.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{poll.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
            {poll.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" /> {poll.location}
              </span>
            )}
            {poll.closeDate && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="size-3" /> Cierre: {poll.closeDate}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isResolved && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas cerrar la votación y resolver la opción ganadora ahora?')) {
                  onClosePoll()
                  toast('Encuesta finalizada y resuelta', '🔒')
                }
              }}
              className="flex items-center gap-1 rounded-xl bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground px-2.5 py-1 text-[11px] font-bold transition-all border border-border"
              title="Cerrar votación manualmente"
            >
              <Lock className="size-3" />
              <span>Cerrar</span>
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-muted-foreground/60 hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors"
            title="Eliminar encuesta"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Participants */}
      <div className="mb-3.5 bg-secondary/50 rounded-2xl p-3 border border-border/40">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="flex items-center gap-1.5 text-foreground">
            {isResolved ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                <CheckCircle2 className="size-4" /> Votación cerrada (100%)
              </span>
            ) : (
              <span>Votos: {votedCount} de {totalParticipants} miembros ({percentage}%)</span>
            )}
          </span>
          <div className="flex -space-x-1.5">
            {poll.participantMemberIds.map((mId) => {
              const m = getMemberById(mId)
              const hasVoted = votedMembersSet.has(mId)
              if (!m) return null
              return (
                <div key={mId} className={cn('relative transition-opacity', !hasVoted && 'opacity-40 grayscale')}>
                  <MemberAvatar member={m} size="xs" ring />
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', isResolved ? 'bg-emerald-500' : 'bg-primary')}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Resolving Banner */}
      {isResolved && winningOption && (
        <div
          className={cn(
            'mb-3.5 rounded-2xl p-3 text-xs font-bold flex items-start gap-2.5 border animate-fade-in',
            isEventPoll
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
          )}
        >
          {isEventPoll ? (
            <Sparkles className="size-4 shrink-0 text-emerald-500 mt-0.5" />
          ) : (
            <Trophy className="size-4 shrink-0 text-amber-500 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-extrabold">
              ¡Opción Ganadora: "{winningOption.title || poll.title}"! ({winningOption.votes.length} {winningOption.votes.length === 1 ? 'voto' : 'votos'})
            </p>
            <p className="text-[11px] opacity-90 mt-0.5">
              {isEventPoll
                ? `📅 Publicado automáticamente como Evento Oficial para el ${winningOption.date || 'día acordado'} ${winningOption.time ? `a las ${winningOption.time}` : ''}.`
                : `🗳️ Encuesta general completada exitosamente. No requiere programación en el calendario.`}
            </p>
          </div>
        </div>
      )}

      {/* Voting options */}
      <div className="flex flex-col gap-2.5">
        {poll.options.map((opt) => {
          const hasVotedThisOpt = currentMember ? opt.votes.includes(currentMember.id) : false
          const voterMembers = opt.votes.map((id) => getMemberById(id)).filter(Boolean) as Member[]
          const isWinner = isResolved && winningOption?.id === opt.id
          const optPercentage = totalVotesCast > 0 ? Math.round((opt.votes.length / totalVotesCast) * 100) : 0

          return (
            <div
              key={opt.id}
              className={cn(
                'relative overflow-hidden rounded-2xl border transition-all p-3',
                isWinner
                  ? 'border-emerald-500 bg-emerald-500/10 text-foreground font-bold'
                  : hasVotedThisOpt
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card hover:bg-secondary/30'
              )}
            >
              {/* Subtle background vote progress */}
              <div
                className={cn(
                  'absolute top-0 bottom-0 left-0 opacity-10 pointer-events-none transition-all duration-300',
                  isWinner ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${optPercentage}%` }}
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-xl shrink-0 font-extrabold text-xs',
                      isWinner
                        ? 'bg-emerald-500 text-white'
                        : hasVotedThisOpt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    )}
                  >
                    {isWinner ? <Trophy className="size-4" /> : isEventPoll ? <Calendar className="size-4" /> : <Vote className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black truncate">{opt.title || 'Opción'}</p>
                    {(opt.date || opt.time) && (
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {opt.date ? opt.date : ''} {opt.time ? `· ${opt.time}` : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {opt.votes.length} {opt.votes.length === 1 ? 'voto' : 'votos'} ({optPercentage}%)
                      </span>
                      {voterMembers.length > 0 && (
                        <div className="flex -space-x-1 ml-1">
                          {voterMembers.map((m) => (
                            <MemberAvatar key={m.id} member={m} size="xs" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!isResolved && currentMember && (
                  <button
                    onClick={() => onVote(opt.id)}
                    className={cn(
                      'flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0',
                      hasVotedThisOpt
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {hasVotedThisOpt ? (
                      <>
                        <Check className="size-3.5 stroke-[3]" />
                        <span>Tu voto</span>
                      </>
                    ) : (
                      <span>Votar</span>
                    )}
                  </button>
                )}

                {isWinner && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white shrink-0">
                    <CheckCircle2 className="size-3.5" /> Ganador
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
