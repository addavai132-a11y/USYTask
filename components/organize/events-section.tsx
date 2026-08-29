'use client'

import { useState } from 'react'
import { Plus, Vote, Check, Trash2, Calendar, MapPin, X, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { EmptyState } from '@/components/ui/empty-state'
import { EventRow } from '@/components/shared/event-row'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { PillTabs } from '@/components/ui/pill-tabs'
import { useApp } from '@/components/app/app-context'
import { getEventMemberIds, type Member, type EventCategory, EVENT_CATEGORIES, categoryLabels, type EventPoll } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
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
    deleteEventPoll,
  } = useApp()

  const [sectionTab, setSectionTab] = useState<'todos' | 'eventos' | 'encuestas'>('todos')

  // Create Poll Modal state
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [pollTitle, setPollTitle] = useState('')
  const [pollLocation, setPollLocation] = useState('')
  const [pollCategory, setPollCategory] = useState<EventCategory>('General')
  const [pollOptions, setPollOptions] = useState<{ title: string; date: string; time: string }[]>([])
  const [editingTimeIdx, setEditingTimeIdx] = useState<number | null>(null)
  const [pollParticipants, setPollParticipants] = useState<string[]>([])
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
    (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  )

  function handleOpenCreatePoll() {
    setPollTitle('')
    setPollLocation('')
    setPollCategory('General')
    setPollOptions([]) // Initialized blank []
    setEditingTimeIdx(null)
    setPollParticipants(members.map((m) => m.id))
    setShowPollErrors(false)
    setIsCreatingPoll(true)
  }

  function handleAddPollOption() {
    const newIdx = pollOptions.length
    setPollOptions((prev) => [...prev, { title: '', date: getTodayISO(), time: '18:00' }])
    setEditingTimeIdx(newIdx)
  }

  function handleRemovePollOption(index: number) {
    setPollOptions((prev) => prev.filter((_, i) => i !== index))
    if (editingTimeIdx === index) setEditingTimeIdx(null)
  }

  function handleSavePoll() {
    if (!pollTitle.trim() || pollParticipants.length === 0) {
      setShowPollErrors(true)
      return
    }
    const validOptions = pollOptions.filter((o) => o.title.trim() && o.date && o.time)
    if (validOptions.length < 2) {
      setShowPollErrors(true)
      return
    }

    addEventPoll(
      pollTitle.trim(),
      pollCategory,
      validOptions.map((o) => ({ ...o, title: o.title.trim() })),
      pollParticipants,
      pollLocation.trim() || undefined
    )
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
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-transform active:scale-95"
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
          Encuestas ({activePollsCount})
        </button>
      </div>

      {/* ── SPLIT VIEW (TODOS) ── */}
      {sectionTab === 'todos' && (
        <div className="flex flex-col gap-4">
          {/* Scheduled Events Feed */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-emerald-600" />
                Eventos Programados ({sortedEvents.length})
              </h4>
            </div>

            {sortedEvents.length === 0 ? (
              <div className="w-full min-h-[160px] p-6 flex flex-col items-center justify-center gap-2.5 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
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
                   {/* Active Polls Panel */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Vote className="size-3.5 text-amber-500" />
                Encuestas de Planes ({eventPolls.length})
              </h4>
            </div>

            {eventPolls.length === 0 ? (
              <div className="w-full min-h-[140px] p-5 flex flex-col items-center justify-center gap-2 bg-white/[0.02] border border-white/10 rounded-2xl text-center">
                <p className="text-xs text-slate-400">No hay encuestas activas para votar planes.</p>
                <button
                  onClick={handleOpenCreatePoll}
                  className="text-xs font-bold text-amber-400 hover:underline"
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
                    onDelete={() => deleteEventPoll(poll.id)}
                  />
                ))}
              </div>
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
              <p className="text-xs text-slate-400 max-w-xs">No hay encuestas activas de planes.</p>
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
                  onDelete={() => deleteEventPoll(poll.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Crear Encuesta de Evento */}
      {isCreatingPoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Vote className="size-4" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Nueva encuesta de planes</h3>
              </div>
              <button
                onClick={() => setIsCreatingPoll(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-muted-foreground">Título / Tema de la encuesta <span className="text-red-500">*</span></label>
                <input
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Ej: Plan de fin de semana, Qué hacemos el sábado..."
                  autoFocus
                  className={cn(
                    "w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-colors",
                    showPollErrors && !pollTitle.trim() && "border-red-500 bg-red-500/10"
                  )}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="font-bold text-muted-foreground text-xs">Categoría</label>
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
                    placeholder="Ej: Centro comercial..."
                    className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
                  />
                </div>
              </div>

              {/* Planes Múltiples a Votar */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-muted-foreground">Opciones de planes <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="flex items-center gap-1 font-bold text-primary hover:underline text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Añadir plan</span>
                  </button>
                </div>

                {pollOptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-5 text-center">
                    <Calendar className="size-7 text-muted-foreground mb-1.5" />
                    <p className="text-xs font-semibold text-muted-foreground mb-3">La lista de planes está vacía. Añade al menos 2 alternativas.</p>
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-soft transition-transform active:scale-95"
                    >
                      <Plus className="size-3.5" />
                      <span>+ Añadir primer plan</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex flex-col gap-2.5 bg-secondary/40 p-3.5 rounded-2xl border border-border/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px]">
                              {i + 1}
                            </span>
                            Plan {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(i)}
                            className="p-1 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Eliminar plan"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <input
                          value={opt.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, title: val } : o)))
                          }}
                          placeholder="Nombre del plan (ej: Jugar al fútbol, Ir al cine...)"
                          className={cn(
                            "w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-semibold outline-none focus:border-primary",
                            showPollErrors && !opt.title.trim() && "border-red-500 bg-red-500/10"
                          )}
                        />

                        {/* Botón Selector de Fecha / Hora */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTimeIdx(editingTimeIdx === i ? null : i)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 border",
                              editingTimeIdx === i
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-foreground hover:bg-secondary"
                            )}
                          >
                            <Calendar className="size-3.5" />
                            <span>{opt.date && opt.time ? `${opt.date} · ${opt.time}` : 'Editar fecha y hora'}</span>
                            <Clock className="size-3 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Selector desplegable de Fecha y Hora */}
                        {editingTimeIdx === i && (
                          <div className="flex gap-2 mt-1 pt-2 border-t border-border/40 animate-fade-in">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Fecha</label>
                              <input
                                type="date"
                                value={opt.date}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, date: val } : o)))
                                }}
                                className="w-full rounded-xl border border-border bg-card py-1.5 px-2 text-xs font-semibold outline-none"
                              />
                            </div>
                            <div className="w-28 flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Hora</label>
                              <input
                                type="time"
                                value={opt.time}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setPollOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, time: val } : o)))
                                }}
                                className="w-full rounded-xl border border-border bg-card py-1.5 px-2 text-xs font-semibold outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="size-4" />
                      <span>+ Añadir otra alternativa de plan</span>
                    </button>
                  </div>
                )}

                {showPollErrors && (
                  <p className="text-[11px] font-bold text-red-500 mt-1">Añade al menos 2 opciones de plan completas con nombre.</p>
                )}
              </div>

              {/* Participantes */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-muted-foreground">Participantes requeridos <span className="text-red-500">*</span></label>
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

              <div className="mt-3 flex gap-2 justify-end">
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
  onDelete,
}: {
  poll: EventPoll
  members: Member[]
  currentMember: Member | null
  getMemberById: (id: string) => Member | null
  onVote: (optionId: string) => void
  onDelete: () => void
}) {
  const totalParticipants = poll.participantMemberIds.length
  const votedMembersSet = new Set<string>()
  poll.options.forEach((opt) => opt.votes.forEach((id) => votedMembersSet.add(id)))
  const votedCount = votedMembersSet.size
  const isResolved = poll.status === 'resolved'
  const percentage = totalParticipants > 0 ? Math.round((votedCount / totalParticipants) * 100) : 0

  // Winning option if resolved
  const winningOption = isResolved
    ? [...poll.options].sort((a, b) => b.votes.length - a.votes.length)[0]
    : null

  return (
    <Card className={cn("p-4 border transition-all", isResolved ? "bg-emerald-500/5 border-emerald-500/30" : "border-border")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold tracking-tight">{poll.title}</h4>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {categoryLabels[poll.category] || poll.category}
            </span>
          </div>
          {poll.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="size-3" /> {poll.location}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 text-muted-foreground/60 hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors"
          title="Eliminar encuesta"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 bg-secondary/50 rounded-2xl p-3 border border-border/40">
        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
          <span className="flex items-center gap-1.5 text-foreground">
            {isResolved ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                <CheckCircle2 className="size-4" /> Votación completada (100%)
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
                <div key={mId} className={cn("relative transition-opacity", !hasVoted && "opacity-40 grayscale")}>
                  <MemberAvatar member={m} size="xs" ring />
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", isResolved ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {isResolved && winningOption && (
        <div className="mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-emerald-500" />
          <span>
            ¡Todos han votado! Plan ganador: <strong>"{winningOption.title || poll.title}"</strong> ({winningOption.date} · {winningOption.time}). Convertido en Evento Oficial en el calendario.
          </span>
        </div>
      )}

      {/* Voting options */}
      <div className="flex flex-col gap-2.5">
        {poll.options.map((opt) => {
          const hasVotedThisOpt = currentMember ? opt.votes.includes(currentMember.id) : false
          const voterMembers = opt.votes.map((id) => getMemberById(id)).filter(Boolean) as Member[]
          const isWinner = isResolved && winningOption?.id === opt.id

          return (
            <div
              key={opt.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all",
                isWinner
                  ? "border-emerald-500 bg-emerald-500/10 text-foreground font-bold"
                  : hasVotedThisOpt
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:bg-secondary/30"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "flex size-9 items-center justify-center rounded-xl shrink-0 font-extrabold text-xs",
                  isWinner ? "bg-emerald-500 text-white" : "bg-secondary text-foreground"
                )}>
                  <Calendar className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate">{opt.title || 'Plan alternativo'}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{opt.date} · {opt.time}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-bold text-muted-foreground">{opt.votes.length} votos</span>
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
                    "flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0",
                    hasVotedThisOpt
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
          )
        })}
      </div>
    </Card>
  )
}
