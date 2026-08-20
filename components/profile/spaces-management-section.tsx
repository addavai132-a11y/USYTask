'use client'

import { useState } from 'react'
import {
  Grid,
  Plus,
  Check,
  Trash2,
  Edit2,
  QrCode,
  LogOut,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useApp } from '@/components/app/app-context'
import {
  SpaceData,
  spaceTypeLabels,
  updateSpaceName,
  deleteSpace,
  leaveSpace,
} from '@/lib/spaces'
import { regenerateInvitation } from '@/lib/invitation'
import { useToast } from '@/components/ui/toast'

export function SpacesManagementSection() {
  const {
    activeSpace,
    spacesList,
    switchSpace,
    openCreateSpaceModal,
    refreshSpaces,
  } = useApp()
  const { toast } = useToast()

  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleStartEdit = (space: SpaceData) => {
    setEditingSpaceId(space.id)
    setEditingName(space.name)
  }

  const handleSaveRename = (spaceId: string) => {
    if (!editingName.trim()) return
    updateSpaceName(spaceId, editingName)
    toast('Nombre del espacio actualizado', '✏️')
    setEditingSpaceId(null)
    refreshSpaces()
  }

  const handleDeleteSpace = (spaceId: string, isOwner: boolean) => {
    if (isOwner) {
      deleteSpace(spaceId)
      toast('Espacio eliminado correctamente', '🗑️')
    } else {
      leaveSpace(spaceId)
      toast('Has abandonado el espacio', '👋')
    }
    setConfirmDeleteId(null)
    refreshSpaces()
  }

  const handleRegenerateInvite = (space: SpaceData) => {
    regenerateInvitation('never', space.name)
    toast(`Nueva invitación generada para "${space.name}"`, '🔄')
    refreshSpaces()
  }

  return (
    <>
      <Card variant="default" className="flex flex-col gap-4">
        <CardHeader
          title="Mis espacios"
          action="+ Crear nuevo"
          onAction={openCreateSpaceModal}
          icon={<Grid className="size-5 text-primary" />}
        />

        <div className="flex flex-col gap-3">
          {spacesList.map((space) => {
            const isActive = space.id === activeSpace.id
            const typeMeta = spaceTypeLabels[space.type] || spaceTypeLabels.other
            const memberCount = space.members.length
            const isEditing = editingSpaceId === space.id

            return (
              <div
                key={space.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-soft'
                    : 'border-border/80 bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-2xl shadow-xs">
                      {space.icon || typeMeta.icon}
                    </span>
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="rounded-xl border border-primary bg-background px-2.5 py-1 text-xs font-extrabold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(space.id)}
                            className="rounded-lg bg-primary p-1 text-primary-foreground"
                          >
                            <Check className="size-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-foreground">{space.name}</h3>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(space)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {typeMeta.label} · {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {space.isOwner ? (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        Owner
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        Miembro
                      </span>
                    )}

                    {isActive && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="size-3.5" />
                        Activo
                      </span>
                    )}
                  </div>
                </div>

                {/* ACCIONES DEL ESPACIO */}
                <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => switchSpace(space.id)}
                        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs active:scale-95"
                      >
                        Entrar al espacio
                      </button>
                    )}

                    {space.isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRegenerateInvite(space)}
                        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="size-3.5 text-primary" />
                        <span>Regenerar QR</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(space.id)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{space.isOwner ? 'Eliminar' : 'Abandonar'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* MODAL CONFIRMACIÓN ELIMINACIÓN */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-sm rounded-[32px] border border-rose-500/30 bg-card p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="size-7" />
            </div>

            <h3 className="text-xl font-black">¿Estás seguro?</h3>
            <p className="text-xs text-muted-foreground mt-1.5">
              Esta acción no se puede deshacer. Se eliminarán los datos de este espacio.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = spacesList.find((s) => s.id === confirmDeleteId)
                  if (target) handleDeleteSpace(target.id, target.isOwner)
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-xs font-bold text-white shadow-soft"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
