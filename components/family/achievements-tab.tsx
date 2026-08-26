'use client'

import { useState } from 'react'
import { Award, Lock, Sparkles, CheckCircle2, Trophy, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { useApp } from '@/components/app/app-context'
import type { FamilyAchievement } from '@/types'
import { cn } from '@/lib/utils'

export function AchievementsTab() {
  const { familyAchievements } = useApp()
  const [filter, setFilter] = useState<'todos' | 'desbloqueados' | 'bloqueados'>('todos')

  const total = familyAchievements.length
  const unlockedCount = familyAchievements.filter((a) => a.isUnlocked).length
  const completionPct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0

  const filteredAchievements = familyAchievements.filter((a) => {
    if (filter === 'desbloqueados') return a.isUnlocked
    if (filter === 'bloqueados') return !a.isUnlocked
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Banner de Progreso Global de Logros */}
      <Card className="relative overflow-hidden p-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-amber-500/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30 shadow-md">
              <Trophy className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground tracking-tight">
                Salón de Logros Familiares
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {unlockedCount} de {total} insignias desbloqueadas
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {completionPct}%
            </span>
          </div>
        </div>

        <ProgressBar
          value={unlockedCount}
          max={total}
          className="h-2 mt-3"
          barClassName="bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm"
        />
      </Card>

      {/* Filter Tabs */}
      <div className="flex rounded-2xl bg-secondary/60 p-1 border border-border self-start">
        <button
          onClick={() => setFilter('todos')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            filter === 'todos'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Todos ({total})
        </button>
        <button
          onClick={() => setFilter('desbloqueados')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            filter === 'desbloqueados'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Desbloqueados ({unlockedCount})
        </button>
        <button
          onClick={() => setFilter('bloqueados')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            filter === 'bloqueados'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Bloqueados ({total - unlockedCount})
        </button>
      </div>

      {/* Grid de Medallas e Insignias */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAchievements.map((ach) => {
          const isUnlocked = ach.isUnlocked
          const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100))

          return (
            <Card
              key={ach.id}
              className={cn(
                'relative flex flex-col justify-between p-4 transition-all',
                isUnlocked
                  ? 'border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'opacity-70 hover:opacity-100'
              )}
            >
              <div>
                {/* Badge Icon & State */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-2xl text-2xl shadow-inner border',
                      isUnlocked
                        ? 'bg-amber-500/20 border-amber-500/40 shadow-amber-500/20 scale-105'
                        : 'bg-secondary/60 border-border grayscale opacity-60'
                    )}
                  >
                    {ach.icon}
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                      <Sparkles className="size-3 fill-amber-500" />
                      ¡Conseguido!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                      <Lock className="size-3" />
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h4
                  className={cn(
                    'font-black text-base tracking-tight leading-snug',
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {ach.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="mt-3.5 pt-2.5 border-t border-border/40">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-muted-foreground">
                    Progreso: {ach.progress} / {ach.maxProgress}
                  </span>
                  <span className={cn(isUnlocked ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                    {pct}%
                  </span>
                </div>
                <ProgressBar
                  value={ach.progress}
                  max={ach.maxProgress}
                  className="h-1.5"
                  barClassName={
                    isUnlocked
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-primary/70'
                  }
                />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
