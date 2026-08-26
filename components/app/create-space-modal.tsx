'use client'

import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { useApp } from './app-context'
import { useToast } from '@/components/ui/toast'
import type { GroupType } from '@/types'
import { groupTypeLabels } from '@/types'
import { cn } from '@/lib/utils'

const groupTypes: GroupType[] = ['family', 'couple', 'roommates', 'personal', 'other']

export function CreateSpaceModal() {
  const { createGroupModalOpen, closeCreateGroupModal, createGroup } = useApp()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('family')

  if (!createGroupModalOpen) return null

  const handleCreate = () => {
    if (!name.trim()) return
    createGroup(name.trim(), type)
    toast(`Espacio "${name.trim()}" creado`, '✨')
    setName('')
    setType('family')
    closeCreateGroupModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-border bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-250">
        {/* Mobile handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-xl font-black tracking-tight">Crear nuevo espacio</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura tu nuevo espacio de organización
            </p>
          </div>
          <button
            type="button"
            onClick={closeCreateGroupModal}
            className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="py-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Nombre del espacio</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mi Familia"
              className="w-full rounded-2xl border border-border bg-secondary/50 py-3 px-4 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-colors"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground">Tipo de espacio</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {groupTypes.map((t) => {
                const meta = groupTypeLabels[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition-all active:scale-[0.98]',
                      type === t
                        ? 'border-primary bg-primary/10 text-foreground shadow-soft'
                        : 'border-border/80 bg-secondary/40 text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          Crear espacio
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  )
}
