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
  { id: 'aurora', label: 'Aurora', bg: 'linear-gradient(135deg, rgba(88,28,135,0.7) 0%, rgba(49,46,129,0.7) 100%)' },
  { id: 'deep-slate', label: 'Pizarra', bg: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' },
  { id: 'violet-night', label: 'Violeta', bg: 'linear-gradient(135deg, rgba(126,34,206,0.6) 0%, rgba(24,24,27,0.9) 100%)' },
  { id: 'indigo-glow', label: 'Índigo', bg: 'linear-gradient(135deg, rgba(67,56,202,0.6) 0%, rgba(17,24,39,0.9) 100%)' },
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
    toast(`Recuerdo guardado en el álbum`, '✅')
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Top Header Controls ── */}
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <span className="text-sm font-bold text-white">Álbum de Recuerdos ({familyMemories.length})</span>
          <p className="text-xs text-slate-400">Momentos y anécdotas compartidas</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="size-3.5" />
          <span>+ Añadir recuerdo</span>
        </button>
      </div>

      {/* ── Member Filter Chips ── */}
      {members.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setMemberFilter('all')}
            className={cn(
              'px-3 py-1 text-xs font-bold rounded-xl border transition-all shrink-0',
              memberFilter === 'all'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
            )}
          >
            Todos
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberFilter(memberFilter === m.id ? 'all' : m.id)}
              className={cn(
                'flex items-center gap-1.5 pl-1.5 pr-3 py-1 text-xs font-semibold rounded-xl border transition-all shrink-0',
                memberFilter === m.id
                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
              )}
            >
              <MemberAvatar member={m} size="sm" />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Memories List ── */}
      {filteredMemories.length === 0 ? (
        <EmptyState
          emoji="📸"
          title="Sin recuerdos guardados aún."
          action="+ Añadir primer recuerdo"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredMemories.map((mem) => {
            const tagged = (mem.taggedMemberIds || []).map((id) => getMemberById(id)).filter(Boolean)
            return (
              <Card
                key={mem.id}
                className="overflow-hidden p-0 bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all rounded-2xl flex flex-col justify-between shadow-sm"
              >
                {/* Header Banner */}
                <div
                  className="relative h-20 w-full p-3 flex items-start justify-between border-b border-white/10"
                  style={{ background: mem.imagePlaceholder || GRADIENT_PRESETS[0].bg }}
                >
                  <span className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    <Calendar className="size-3" />
                    {new Date(mem.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <button
                    onClick={() => handleDelete(mem.id, mem.title)}
                    className="flex size-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/60 hover:text-white transition-all"
                    title="Eliminar recuerdo"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3.5 flex flex-col justify-between gap-3 flex-1">
                  <div>
                    <h4 className="font-bold text-sm text-white tracking-tight leading-snug">
                      {mem.title}
                    </h4>
                    {mem.description && (
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {mem.description}
                      </p>
                    )}
                  </div>

                  {/* Tags & Tagged Members */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {mem.tags?.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[10px] font-medium text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {tagged.length > 0 && (
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        {tagged.map((m) => (
                          <div key={m!.id} title={m!.name}>
                            <MemberAvatar member={m!} size="sm" ring />
                          </div>
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

      {/* ── MODAL: CREAR RECUERDO ── */}
      <BottomSheet
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Guardar nuevo recuerdo"
      >
        <div className="flex flex-col gap-3.5 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Título del recuerdo <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Cumpleaños de Sofía, Excursión a la sierra..."
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Descripción / Historia (opcional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué pasó? ¿Por qué fue un momento especial?"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Fecha del evento</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 px-3 text-xs font-medium text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-400">Estilo de fondo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setGradient(preset.bg)}
                  className={cn(
                    'h-10 rounded-xl border transition-all text-[11px] font-bold text-white flex items-center justify-center shadow-inner',
                    gradient === preset.bg ? 'ring-2 ring-purple-500 border-white' : 'border-white/10'
                  )}
                  style={{ background: preset.bg }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <MemberMultiSelect
            members={members}
            selectedIds={taggedMemberIds}
            onChange={setTaggedMemberIds}
            label="Integrantes protagonistas"
          />

          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateMemory}
              className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              Guardar recuerdo
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
