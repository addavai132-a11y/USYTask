'use client'

import { Palette, Check, Sparkles, Box, Layers } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useTheme, type AppTheme } from '@/components/ui/theme-context'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export function ThemeSelectorSection() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme)
    const label =
      newTheme === 'bento-minimal'
        ? 'Minimalismo & Bento UI'
        : newTheme === 'dark-glass'
        ? 'Dark Modern & Glassmorphism'
        : 'Neumorfismo Suave & Soft UI'
    toast(`Estilo visual cambiado a: ${label}`, '🎨')
  }

  return (
    <Card className="p-5 border border-border">
      <div className="flex items-center gap-2 mb-1">
        <Palette className="size-5 text-primary" />
        <h3 className="text-base font-extrabold text-foreground tracking-tight">
          Apariencia y Estilo Visual
        </h3>
      </div>
      <p className="text-xs text-muted-foreground font-semibold mb-4">
        Selecciona la dirección de diseño que prefieres para tu aplicación
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Minimalismo & Bento UI (Por defecto) */}
        <div
          onClick={() => handleSelectTheme('bento-minimal')}
          className={cn(
            'flex flex-col justify-between gap-3 rounded-2xl p-4 border transition-all cursor-pointer active:scale-98 relative group',
            theme === 'bento-minimal'
              ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-600/40 shadow-soft'
              : 'border-border bg-secondary/30 hover:bg-secondary/50'
          )}
        >
          {/* Mini Visual Preview Thumbnail */}
          <div className="w-full h-24 rounded-xl bg-[#f8fafc] border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-emerald-600" />
                <div className="h-1.5 w-10 rounded-full bg-slate-300" />
              </div>
              <div className="h-1.5 w-5 rounded-full bg-emerald-600/30" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-9 rounded-lg bg-white border border-slate-200 p-1 flex flex-col justify-between shadow-xs">
                <div className="size-2 rounded bg-slate-300" />
                <div className="h-1 w-full rounded bg-slate-200" />
              </div>
              <div className="h-9 rounded-lg bg-white border border-slate-200 p-1 flex flex-col justify-between shadow-xs">
                <div className="size-2 rounded bg-emerald-600" />
                <div className="h-1 w-full rounded bg-slate-200" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-foreground">Bento UI</h4>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  Por defecto
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Claro, limpio y modular con sombras planas
              </p>
            </div>

            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-0.5',
                theme === 'bento-minimal'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-border bg-secondary text-transparent'
              )}
            >
              <Check className="size-3 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 2. Dark Modern & Glassmorphism */}
        <div
          onClick={() => handleSelectTheme('dark-glass')}
          className={cn(
            'flex flex-col justify-between gap-3 rounded-2xl p-4 border transition-all cursor-pointer active:scale-98 relative group',
            theme === 'dark-glass'
              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-soft'
              : 'border-border bg-secondary/30 hover:bg-secondary/50'
          )}
        >
          {/* Mini Visual Preview Thumbnail */}
          <div className="w-full h-24 rounded-xl bg-[#0b0f17] border border-white/10 p-2.5 flex flex-col justify-between overflow-hidden shadow-md relative">
            <div className="pointer-events-none absolute top-0 right-0 size-14 bg-emerald-500/15 blur-md" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-emerald-400" />
                <div className="h-1.5 w-10 rounded-full bg-slate-700" />
              </div>
              <div className="h-1.5 w-5 rounded-full bg-indigo-500/40" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-9 rounded-lg bg-slate-900/80 border border-white/10 p-1 flex flex-col justify-between">
                <div className="size-2 rounded bg-slate-700" />
                <div className="h-1 w-full rounded bg-slate-700" />
              </div>
              <div className="h-9 rounded-lg bg-slate-900/80 border border-white/10 p-1 flex flex-col justify-between">
                <div className="size-2 rounded bg-emerald-400" />
                <div className="h-1 w-full rounded bg-slate-700" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-foreground">Dark Glass</h4>
                <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-400 flex items-center gap-0.5">
                  <Sparkles className="size-2.5" /> Oscuro
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Oscuro con cristal traslúcido y neón
              </p>
            </div>

            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-0.5',
                theme === 'dark-glass'
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-border bg-secondary text-transparent'
              )}
            >
              <Check className="size-3 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 3. Neumorfismo Suave & Soft UI */}
        <div
          onClick={() => handleSelectTheme('neumorphism-soft')}
          className={cn(
            'flex flex-col justify-between gap-3 rounded-2xl p-4 border transition-all cursor-pointer active:scale-98 relative group',
            theme === 'neumorphism-soft'
              ? 'border-emerald-600 bg-emerald-500/10 ring-2 ring-emerald-600/40 shadow-soft'
              : 'border-border bg-secondary/30 hover:bg-secondary/50'
          )}
        >
          {/* Mini Visual Preview Thumbnail */}
          <div className="w-full h-24 rounded-xl bg-[#e9ecef] p-2.5 flex flex-col justify-between overflow-hidden shadow-[inset_2px_2px_4px_#c5c9ce,inset_-2px_-2px_4px_#ffffff]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-emerald-600" />
                <div className="h-1.5 w-10 rounded-full bg-slate-400" />
              </div>
              <div className="h-1.5 w-5 rounded-full bg-slate-300" />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-9 rounded-lg bg-[#e9ecef] shadow-[3px_3px_6px_#c5c9ce,-3px_-3px_6px_#ffffff] p-1 flex flex-col justify-between">
                <div className="size-2 rounded bg-slate-400" />
                <div className="h-1 w-full rounded bg-slate-300" />
              </div>
              <div className="h-9 rounded-lg bg-[#e9ecef] shadow-[inset_2px_2px_4px_#c5c9ce,inset_-2px_-2px_4px_#ffffff] p-1 flex flex-col justify-between">
                <div className="size-2 rounded bg-emerald-600" />
                <div className="h-1 w-full rounded bg-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-black text-foreground">Soft UI</h4>
                <span className="rounded-full bg-slate-400/20 border border-slate-400/30 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                  <Layers className="size-2.5" /> Extruido
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                Efectos extruidos y cóncavos táctiles suaves
              </p>
            </div>

            <div
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-all mt-0.5',
                theme === 'neumorphism-soft'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-border bg-secondary text-transparent'
              )}
            >
              <Check className="size-3 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
