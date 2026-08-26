'use client'

import { useState } from 'react'
import { Plus, Camera, Calendar, Tag, Trash2, Heart, Sparkles, Filter, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { FamilyMemory } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

const GRADIENT_PRESETS = [
  { id: 'emerald', label: 'Esmeralda', bg: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' },
  { id: 'purple', label: 'Púrpura Neón', bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)' },
  { id: 'sunset', label: 'Atardecer', bg: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #facc15 100%)' },
  { id: 'ocean', label: 'Océano', bg: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)' },
  { id: 'rose', label: 'Rosado', bg: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%)' },
]

export function MemoriesTab() {
  const { toast } = useToast()
  const { familyMemories, members, getMemberById, addFamilyMemory, deleteFamilyMemory, confirmDelete } = useApp()

  const [isCreating, setIsCreating] = useState(false)
  const [memberFilter, setMemberFilter] = useState<string>('all')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getTodayISO())
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].bg)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(['Familia', 'Recuerdo'])
  const [taggedMemberIds, setTaggedMemberIds] = useState<string[]>([])

  const filteredMemories = familyMemories.filter((m) => {
    if (memberFilter === 'all') return true
    return m.taggedMemberIds?.includes(memberFilter)
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleOpenCreateModal = () => {
    setTitle('')
    setDescription('')
    setDate(getTodayISO())
    setGradient(GRADIENT_PRESETS[0].bg)
    setTagInput('')
    setTags(['Familia'])
    setTaggedMemberIds(members.map((m) => m.id))
    setIsCreating(true)
  }

  const handleAddTag = () => {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleCreateMemory = () => {
    if (!title.trim()) return
    addFamilyMemory({
      title: title.trim(),
      description: description.trim(),
      date: date || getTodayISO(),
      imagePlaceholder: gradient,
      tags,
      taggedMemberIds,
    })
    toast(`Recuerdo "${title.trim()}" guardado en el álbum`, '📸')
    setIsCreating(false)
  }

  const handleDelete = (id: string, memoryTitle: string) => {
    confirmDelete({
      title: '¿Eliminar recuerdo?',
      itemName: memoryTitle,
      description: 'Este recuerdo se eliminará permanentemente del álbum familiar.',
      confirmText: 'Eliminar Recuerdo',
      onConfirm: () => {
        deleteFamilyMemory(id)
        toast(`Recuerdo "${memoryTitle}" eliminado`, '🗑️')
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls: Member Filter & Add Memory button */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-foreground">Álbum de Recuerdos</h3>
            <p className="text-xs text-muted-foreground font-medium">Momentos especiales, anécdotas y celebraciones</p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold shadow-soft transition-transform active:scale-95 hover:opacity-90 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 shrink-0"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Añadir recuerdo</span>
          </button>
        </div>

        {/* Member filter chips */}
        {members.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
            <button
              onClick={() => setMemberFilter('all')}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all border',
                memberFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
              )}
            >
              Todos los recuerdos
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setMemberFilter(memberFilter === m.id ? 'all' : m.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-xs font-bold transition-all border',
                  memberFilter === m.id
                    ? 'bg-primary/15 text-foreground border-primary/50 shadow-sm'
                    : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'
                )}
              >
                <MemberAvatar member={m} size="xs" />
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Memories Cards */}
      {filteredMemories.length === 0 ? (
        <EmptyState
          emoji="📸"
          title="Sin recuerdos guardados aún"
          description="Inmortaliza momentos felices, excursiones, cumpleaños o logros del hogar."
          action="+ Añadir primer recuerdo"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredMemories.map((mem) => {
            const tagged = (mem.taggedMemberIds || []).map((id) => getMemberById(id)).filter(Boolean)
            return (
              <Card
                key={mem.id}
                className="overflow-hidden p-0 transition-all hover:border-primary/40 flex flex-col justify-between"
              >
                {/* Visual Banner Placeholder */}
                <div
                  className="relative h-28 w-full p-3 flex flex-col justify-between text-white shadow-inner"
                  style={{ background: mem.imagePlaceholder || GRADIENT_PRESETS[0].bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <Calendar className="size-3" />
                      {new Date(mem.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    <button
                      onClick={() => handleDelete(mem.id, mem.title)}
                      className="flex size-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white/80 hover:text-white hover:bg-rose-600 transition-colors"
                      title="Eliminar recuerdo"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Camera className="size-4 opacity-80" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-base text-foreground tracking-tight leading-snug">
                      {mem.title}
                    </h4>
                    {mem.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        {mem.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                    {/* Tags */}
                    {mem.tags && mem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mem.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tagged Members */}
                    {tagged.length > 0 && (
                      <div className="flex -space-x-1.5 ml-auto">
                        {tagged.slice(0, 4).map((m: any) => (
                          <MemberAvatar key={m.id} member={m} size="xs" ring />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL: AÑADIR RECUERDO */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Guardar nuevo recuerdo familiar"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Título del momento</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Excursión a la montaña, Cumpleaños de Lucas..."
              autoFocus
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:bg-card"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Anécdota / Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Cuenta qué pasó, qué comisteis, qué fue lo más divertido..."
              className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-card resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Fecha del recuerdo</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:bg-card"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Estilo visual</label>
              <div className="flex gap-1.5 pt-1">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGradient(p.bg)}
                    className={cn(
                      'size-7 rounded-lg transition-transform',
                      gradient === p.bg ? 'ring-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
                    )}
                    style={{ background: p.bg }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Etiquetas</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Ej. Vacaciones, Comida, Playa..."
                className="flex-1 rounded-xl border border-border bg-secondary/50 py-2 px-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:bg-card"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground border border-border hover:bg-secondary/80"
              >
                + Añadir
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-2 py-0.5 text-xs font-bold text-foreground border border-border"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-muted-foreground hover:text-rose-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Member assignment */}
          <MemberMultiSelect
            members={members}
            selectedIds={taggedMemberIds}
            onChange={setTaggedMemberIds}
            label="Integrantes participantes"
          />

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateMemory}
              disabled={!title.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-50"
            >
              Guardar recuerdo
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
