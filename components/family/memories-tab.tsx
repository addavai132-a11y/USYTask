'use client'

import { useState, useRef } from 'react'
import {
  Plus,
  Camera,
  Calendar,
  Trash2,
  Image as ImageIcon,
  X,
  UploadCloud,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { MemberMultiSelect } from '@/components/ui/member-multi-select'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'
import type { FamilyMemory } from '@/types'
import { getTodayISO } from '@/lib/date-utils'
import { uploadMemoryImage } from '@/lib/storage'
import { cn } from '@/lib/utils'

const GRADIENT_PRESETS = [
  { id: 'aurora', label: 'Aurora', bg: 'linear-gradient(135deg, rgba(88,28,135,0.7) 0%, rgba(49,46,129,0.7) 100%)' },
  { id: 'deep-slate', label: 'Pizarra', bg: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)' },
  { id: 'violet-night', label: 'Violeta', bg: 'linear-gradient(135deg, rgba(126,34,206,0.6) 0%, rgba(24,24,27,0.9) 100%)' },
  { id: 'indigo-glow', label: 'Índigo', bg: 'linear-gradient(135deg, rgba(67,56,202,0.6) 0%, rgba(17,24,39,0.9) 100%)' },
]

export function MemoriesTab() {
  const { toast } = useToast()
  const { familyMemories, members, currentMember, getMemberById, addFamilyMemory, deleteFamilyMemory, confirmDelete } = useApp()

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

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredMemories = familyMemories.filter((m) => {
    if (memberFilter === 'all') return true
    return m.taggedMemberIds?.includes(memberFilter)
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDate(getTodayISO())
    setGradient(GRADIENT_PRESETS[0].bg)
    setTagInput('')
    setTags(['Familia'])
    setTaggedMemberIds(members.map((m) => m.id))
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setIsDragging(false)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsCreating(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0])
    }
  }

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Por favor, selecciona un archivo de imagen válido.', '⚠️')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast('La imagen supera el límite de 10 MB.', '⚠️')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0])
    }
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

  const handleCreateMemory = async () => {
    if (!title.trim()) {
      toast('Por favor, introduce un título para el recuerdo', '⚠️')
      return
    }

    setIsUploading(true)
    let uploadedImageUrl: string | undefined = undefined

    try {
      // 1. Subir imagen a Supabase Storage si se seleccionó archivo
      if (selectedFile) {
        const uploadRes = await uploadMemoryImage(selectedFile, currentMember?.id || 'user')
        if (!uploadRes.success) {
          toast(uploadRes.error || 'Error al subir la imagen.', '❌')
          setIsUploading(false)
          return
        }
        uploadedImageUrl = uploadRes.publicUrl
      }

      // 2. Guardar recuerdo en el Store / Base de datos
      addFamilyMemory({
        title: title.trim(),
        description: description.trim(),
        date: date || getTodayISO(),
        imageUrl: uploadedImageUrl,
        imagePlaceholder: gradient,
        tags,
        taggedMemberIds,
      })

      toast('Recuerdo guardado en el álbum', '📸')
      setIsCreating(false)
      resetForm()
    } catch (err) {
      console.error('Error guardando recuerdo:', err)
      toast('Error inesperado al guardar el recuerdo', '❌')
    } finally {
      setIsUploading(false)
    }
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
      <div className="w-full flex items-center justify-between p-3.5 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm dark:bg-white/[0.03] dark:border-white/10">
        <div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Álbum de Recuerdos ({familyMemories.length})
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">Momentos y anécdotas compartidas</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm dark:bg-purple-600 dark:hover:bg-purple-500"
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
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm dark:bg-purple-600 dark:border-purple-500'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/10 dark:hover:text-white'
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
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-500/40'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/[0.03] dark:text-slate-400 dark:border-white/10 dark:hover:text-white'
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
          title="Aún no hay recuerdos guardados"
          description="Captura momentos especiales del hogar y guárdalos aquí."
          action="+ Añadir primer recuerdo"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredMemories.map((mem) => {
            const tagged = (mem.taggedMemberIds || []).map((id) => getMemberById(id)).filter(Boolean)
            return (
              <Card
                key={mem.id}
                className="overflow-hidden p-0 bg-white border border-slate-200 hover:border-emerald-500/40 dark:bg-white/[0.03] dark:border-white/10 dark:hover:border-purple-500/30 transition-all rounded-3xl flex flex-col justify-between shadow-sm group"
              >
                {/* Header Banner o Foto Subida */}
                {mem.imageUrl ? (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-white/10">
                    <img
                      src={mem.imageUrl}
                      alt={mem.title}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 p-3 flex items-start justify-between">
                      <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        <Calendar className="size-3" />
                        {new Date(mem.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>

                      <button
                        onClick={() => handleDelete(mem.id, mem.title)}
                        className="flex size-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:bg-rose-500 hover:text-white transition-all"
                        title="Eliminar recuerdo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative h-24 w-full p-3 flex items-start justify-between border-b border-slate-200 dark:border-white/10"
                    style={{ background: mem.imagePlaceholder || GRADIENT_PRESETS[0].bg }}
                  >
                    <span className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      <Calendar className="size-3" />
                      {new Date(mem.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>

                    <button
                      onClick={() => handleDelete(mem.id, mem.title)}
                      className="flex size-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:bg-rose-500 hover:text-white transition-all"
                      title="Eliminar recuerdo"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-4 flex flex-col justify-between gap-3 flex-1">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-snug">
                      {mem.title}
                    </h4>
                    {mem.description && (
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {mem.description}
                      </p>
                    )}
                  </div>

                  {/* Tags & Tagged Members */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {mem.tags?.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 dark:bg-white/[0.04] dark:border-white/5 dark:text-slate-400"
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

      {/* ── MODAL: CREAR RECUERDO CON SUBIDA DE FOTO ── */}
      <BottomSheet
        open={isCreating}
        onClose={() => !isUploading && setIsCreating(false)}
        title="Guardar nuevo recuerdo"
      >
        <div className="flex flex-col gap-3.5 text-xs">
          {/* Título */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Título del recuerdo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              disabled={isUploading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Cumpleaños de Sofía, Excursión a la sierra..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Descripción / Historia (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              disabled={isUploading}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué pasó? ¿Por qué fue un momento especial?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500 resize-none"
            />
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Fecha del evento</label>
            <input
              type="date"
              value={date}
              disabled={isUploading}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-purple-500"
            />
          </div>

          {/* Estilo de Fondo (Fallback o Cabecera) */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Estilo de fondo alternativo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isUploading}
                  onClick={() => setGradient(preset.bg)}
                  className={cn(
                    'h-9 rounded-xl border transition-all text-[11px] font-bold text-white flex items-center justify-center shadow-inner',
                    gradient === preset.bg ? 'ring-2 ring-emerald-500 dark:ring-purple-500 border-white' : 'border-slate-200 dark:border-white/10'
                  )}
                  style={{ background: preset.bg }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN NUEVA: IMAGEN DEL RECUERDO (DRAG & DROP / SELECTOR DE ARCHIVO)   */}
          {/* ========================================================================= */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Imagen del recuerdo</span>
              {previewUrl && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-purple-400">
                  Foto seleccionada
                </span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  'w-full flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 text-center',
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 dark:border-purple-500 dark:bg-purple-500/10 scale-[0.99]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 dark:border-white/15 dark:bg-white/[0.02] dark:hover:bg-white/[0.05] dark:hover:border-white/30'
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-purple-500/20 dark:text-purple-300 mb-2">
                  <Camera className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Sube una foto de este momento
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Haz clic para seleccionar o arrastra una imagen aquí
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                  PNG, JPG o WEBP (máx. 10 MB)
                </span>
              </div>
            ) : (
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-purple-500/30 bg-slate-900 group">
                <img
                  src={previewUrl}
                  alt="Vista previa del recuerdo"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={handleRemoveImage}
                      className="flex size-8 items-center justify-center rounded-full bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition-all shadow-md active:scale-95"
                      title="Quitar foto"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white truncate max-w-[200px]">
                      {selectedFile?.name || 'Foto adjunta'}
                    </span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-md transition-colors"
                    >
                      <RefreshCw className="size-3" />
                      <span>Cambiar foto</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Integrantes Protagonistas */}
          <MemberMultiSelect
            members={members}
            selectedIds={taggedMemberIds}
            onChange={setTaggedMemberIds}
            label="Integrantes protagonistas"
          />

          {/* Botones de Acción */}
          <div className="mt-2 flex gap-2 justify-end">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isUploading || !title.trim()}
              onClick={handleCreateMemory}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 dark:bg-purple-600 dark:hover:bg-purple-500"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Subiendo foto y guardando...</span>
                </>
              ) : (
                <span>Guardar recuerdo</span>
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

