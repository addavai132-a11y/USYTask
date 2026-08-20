'use client'

import {
  CalendarPlus,
  CheckCircle2,
  ShoppingCart,
  Wallet,
  Camera,
  Trophy,
  FileText,
  StickyNote,
} from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useApp } from './app-context'
import { useToast } from '@/components/ui/toast'

const actions = [
  { id: 'evento', label: 'Crear evento', icon: CalendarPlus, color: 'var(--member-marcos)', emoji: '📅' },
  { id: 'tarea', label: 'Crear tarea', icon: CheckCircle2, color: 'var(--primary)', emoji: '✅' },
  { id: 'producto', label: 'Añadir producto', icon: ShoppingCart, color: 'var(--member-adrian)', emoji: '🛒' },
  { id: 'gasto', label: 'Añadir gasto', icon: Wallet, color: 'var(--accent)', emoji: '💶' },
  { id: 'recuerdo', label: 'Añadir recuerdo', icon: Camera, color: 'var(--member-marieli)', emoji: '📸' },
  { id: 'reto', label: 'Crear reto', icon: Trophy, color: 'var(--warning)', emoji: '🏆' },
  { id: 'documento', label: 'Añadir documento', icon: FileText, color: 'var(--member-celia)', emoji: '📄' },
  { id: 'nota', label: 'Añadir nota', icon: StickyNote, color: 'var(--muted-foreground)', emoji: '📝' },
]

export function QuickAdd() {
  const { quickAddOpen, closeQuickAdd, bump } = useApp()
  const { toast } = useToast()

  return (
    <BottomSheet open={quickAddOpen} onClose={closeQuickAdd} title="¿Qué quieres añadir?">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              closeQuickAdd()
              bump()
              toast(`${a.label.replace('Crear ', '').replace('Añadir ', '')} — listo`, a.emoji)
            }}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left transition-transform active:scale-95"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: a.color }}
            >
              <a.icon className="size-5" />
            </span>
            <span className="text-sm font-semibold leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
