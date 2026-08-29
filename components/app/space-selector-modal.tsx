'use client'

import { X, Plus, Check, ChevronRight } from 'lucide-react'
import { useApp } from './app-context'
import { groupTypeLabels } from '@/types'
import { getMembersByGroup } from '@/lib/data-store'
import { useModalBackHandler } from '@/lib/use-modal-back-handler'

export function SpaceSelectorModal() {
  const {
    groupSelectorOpen,
    closeGroupSelector,
    activeGroup,
    groups,
    switchGroup,
    openCreateGroupModal,
  } = useApp()

  useModalBackHandler(groupSelectorOpen, closeGroupSelector)

  if (!groupSelectorOpen) return null

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
            onClick={closeGroupSelector}
            className="rounded-full bg-secondary p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2.5">
          {groups.map((group) => {
            const isActive = group.id === activeGroup?.id
            const typeMeta = groupTypeLabels[group.type] || groupTypeLabels.other
            const memberCount = getMembersByGroup(group.id).length

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => switchGroup(group.id)}
                className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-soft'
                    : 'border-border/80 bg-secondary/40 hover:border-primary/40 hover:bg-secondary/70'
                }`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card border border-border text-2xl shadow-xs">
                  {group.icon || typeMeta.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm truncate text-foreground">
                      {group.name}
                    </h3>
                    {group.isOwner && (
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

        {/* Footer Button: + Crear nuevo espacio y Cancelar */}
        <div className="pt-3 border-t border-border/60 flex items-center gap-2.5">
          <button
            type="button"
            onClick={closeGroupSelector}
            className="flex-1 rounded-2xl border border-border bg-secondary/60 hover:bg-secondary py-3 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={openCreateGroupModal}
            className="flex-1 sm:flex-[2] flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-xs sm:text-sm text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            <Plus className="size-4.5 stroke-[2.5]" />
            <span>Crear nuevo espacio</span>
          </button>
        </div>
      </div>
    </div>
  )
}
