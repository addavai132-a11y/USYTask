'use client'

import { X, Plus, Check, ShieldCheck, ChevronRight } from 'lucide-react'
import { useApp } from './app-context'
import { spaceTypeLabels } from '@/lib/spaces'

export function SpaceSelectorModal() {
  const {
    spaceSelectorOpen,
    closeSpaceSelector,
    activeSpace,
    spacesList,
    switchSpace,
    openCreateSpaceModal,
  } = useApp()

  if (!spaceSelectorOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-t-[36px] sm:rounded-[36px] border border-border bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-250 max-h-[90vh] flex flex-col">
        {/* Mobile handle indicator */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-xl font-black tracking-tight">Tus espacios</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cambia entre tus espacios o crea uno nuevo
            </p>
          </div>
          <button
            type="button"
            onClick={closeSpaceSelector}
            className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Spaces List */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2.5">
          {spacesList.map((space) => {
            const isActive = space.id === activeSpace.id
            const typeMeta = spaceTypeLabels[space.type] || spaceTypeLabels.other
            const memberCount = space.members.length

            return (
              <button
                key={space.id}
                type="button"
                onClick={() => switchSpace(space.id)}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-soft'
                    : 'border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/70'
                }`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card border border-border text-2xl shadow-xs">
                  {space.icon || typeMeta.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm truncate text-foreground">
                      {space.name}
                    </h3>
                    {space.isOwner && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeMeta.label} · {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                  </p>
                </div>

                {isActive ? (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4 stroke-[3]" />
                  </div>
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground/60" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer Button: + Crear nuevo espacio */}
        <div className="pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={openCreateSpaceModal}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            <Plus className="size-5 stroke-[2.5]" />
            <span>Crear nuevo espacio</span>
          </button>
        </div>
      </div>
    </div>
  )
}
