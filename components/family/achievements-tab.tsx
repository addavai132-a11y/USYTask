'use client'

import { useState } from 'react'
import { Award, Lock, Sparkles, Trophy, CheckCircle2 } from 'lucide-react'
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* ── Global Achievements Progress Banner ── */}
      <Card className="p-4 sm:p-5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Trophy className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Logros e Insignias del Hogar
              </h3>
              <p className="text-xs text-slate-400">
                {unlockedCount} de {total} insignias conseguidas
              </p>
            </div>
          </div>

          <span className="text-xl font-black text-purple-300 tabular-nums">
            {completionPct}%
          </span>
        </div>

        <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </Card>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setFilter('todos')}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black transition-all',
            filter === 'todos'
              ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Todos ({total})
        </button>
        <button
          onClick={() => setFilter('desbloqueados')}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black transition-all',
            filter === 'desbloqueados'
              ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Desbloqueados ({unlockedCount})
        </button>
        <button
          onClick={() => setFilter('bloqueados')}
          className={cn(
            'rounded-lg px-3 py-1 text-xs font-black transition-all',
            filter === 'bloqueados'
              ? 'bg-emerald-400 text-slate-950 font-black shadow-sm'
              : 'text-slate-400 hover:text-white'
          )}
        >
          Bloqueados ({total - unlockedCount})
        </button>
      </div>

      {/* ── Achievements Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredAchievements.map((ach) => {
          const isUnlocked = ach.isUnlocked
          const pct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100))

          return (
            <Card
              key={ach.id}
              className={cn(
                'p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm transition-all border',
                isUnlocked
                  ? 'bg-purple-500/[0.03] border-purple-500/30'
                  : 'bg-white/[0.02] border-white/10 opacity-60 hover:opacity-85'
              )}
            >
              <div>
                {/* Header: Icon & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={cn(
                      'flex size-9 items-center justify-center rounded-xl border',
                      isUnlocked
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                        : 'bg-white/[0.04] border-white/10 text-slate-500'
                    )}
                  >
                    <Award className="size-4" />
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                      <CheckCircle2 className="size-3" />
                      Conseguido
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-white/5">
                      <Lock className="size-2.5" />
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h4
                  className={cn(
                    'font-bold text-sm tracking-tight leading-snug',
                    isUnlocked ? 'text-white' : 'text-slate-400'
                  )}
                >
                  {ach.title}
                </h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress Footer */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                  <span>
                    Progreso: {ach.progress} / {ach.maxProgress}
                  </span>
                  <span className={cn(isUnlocked ? 'font-bold text-purple-300' : '')}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isUnlocked ? 'bg-purple-500' : 'bg-slate-600'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
