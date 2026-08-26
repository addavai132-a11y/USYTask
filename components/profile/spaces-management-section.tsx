'use client'

import { useState } from 'react'
import {
  Grid,
  Plus,
  Check,
  Trash2,
  Edit2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { useApp } from '@/components/app/app-context'
import { groupTypeLabels } from '@/types'
import { getMembersByGroup } from '@/lib/data-store'
import { useToast } from '@/components/ui/toast'

export function SpacesManagementSection() {
  const {
    activeGroup,
    groups,
    switchGroup,
    openCreateGroupModal,
    refreshData,
    updateGroupName: updateName,
    deleteGroup: deleteGrp,
    confirmDelete,
  } = useApp()
  const { toast } = useToast()

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleStartEdit = (groupId: string, name: string) => {
    setEditingGroupId(groupId)
    setEditingName(name)
  }

  const handleSaveRename = (groupId: string) => {
    if (!editingName.trim()) return
    updateName(groupId, editingName)
    toast('Nombre del espacio actualizado', '✏️')
    setEditingGroupId(null)
  }

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    confirmDelete({
      title: '¿Eliminar espacio / vivienda?',
      itemName: groupName,
      description: 'Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos, tareas y miembros de este espacio.',
      confirmText: 'Eliminar Espacio',
      onConfirm: () => {
        deleteGrp(groupId)
        toast('Espacio eliminado correctamente', '🗑️')
      },
    })
  }

  return (
    <>
      <Card variant="default" className="flex flex-col gap-4">
        <CardHeader
          title="Mis espacios"
          action="+ Crear nuevo"
          onAction={openCreateGroupModal}
          icon={<Grid className="size-5 text-primary" />}
        />

        <div className="flex flex-col divide-y divide-border/60">
          {groups.map((group) => {
            const isActive = group.id === activeGroup?.id
            const typeMeta = groupTypeLabels[group.type] || { label: 'Grupo', icon: '🏠' }
            const memberCount = getMembersByGroup(group.id).length
            const isEditing = editingGroupId === group.id

            return (
              <div key={group.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary/80 text-foreground font-black text-xl border border-border">
                      {group.icon || typeMeta.icon}
                    </div>

                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(group.id)
                              if (e.key === 'Escape') setEditingGroupId(null)
                            }}
                            autoFocus
                            className="rounded-xl border border-primary bg-card px-2.5 py-1 text-sm font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(group.id)}
                            className="rounded-lg bg-primary p-1 text-primary-foreground"
                          >
                            <Check className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-foreground">{group.name}</h3>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(group.id, group.name)}
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
                    {group.isOwner && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        Owner
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

                <div className="mt-3 pt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => switchGroup(group.id)}
                        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs active:scale-95"
                      >
                        Entrar al espacio
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
