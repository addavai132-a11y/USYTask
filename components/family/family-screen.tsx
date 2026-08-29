'use client'

import { useState } from 'react'
import { Trophy, Star, Flame, Award } from 'lucide-react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { Card } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { useApp } from '@/components/app/app-context'
import { MembersTab } from './members-tab'
import { ChallengesTab } from './challenges-tab'
import { RewardsTab } from './rewards-tab'
import { AchievementsTab } from './achievements-tab'
import { MemoriesTab } from './memories-tab'

type Section = 'miembros' | 'retos' | 'recompensas' | 'logros' | 'recuerdos'

export function FamilyScreen() {
  const [section, setSection] = useState<Section>('miembros')
  const { members, familyChallenges, familyAchievements } = useApp()

  // Calculate high-level family gamification stats
  const totalPoints = members.reduce((acc, m) => acc + (m.points || 0), 0)
  const maxStreak = members.reduce((acc, m) => Math.max(acc, m.streak || m.streakDays || 0), 0)
  const activeChallengesCount = familyChallenges.filter((c) => c.status !== 'completado').length
  const unlockedAchievementsCount = familyAchievements.filter((a) => a.isUnlocked).length

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      <ScreenHeader
        title="Familia"
        subtitle="Organización compartida, retos, recompensas y recuerdos del hogar"
        centered
      />

      {/* ── Overview Minimalist Stats Banner ── */}
      <Card className="p-4 sm:p-5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total Points */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0 border border-emerald-200 dark:border-purple-500/20">
              <Star className="size-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                Puntos Totales
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {totalPoints} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pts</span>
              </p>
            </div>
          </div>

          {/* Top Streak */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0 border border-amber-200 dark:border-purple-500/20">
              <Flame className="size-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                Mejor Racha
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {maxStreak} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">días</span>
              </p>
            </div>
          </div>

          {/* Active Challenges */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0 border border-emerald-200 dark:border-purple-500/20">
              <Trophy className="size-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                Retos Activos
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {activeChallengesCount}
              </p>
            </div>
          </div>

          {/* Unlocked Badges */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-purple-500/10 dark:text-purple-400 shrink-0 border border-emerald-200 dark:border-purple-500/20">
              <Award className="size-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
                Logros
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {unlockedAchievementsCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {familyAchievements.length}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Main Suite Navigation Tabs ── */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar sm:w-fit mx-auto flex items-center justify-start sm:justify-center p-1.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl backdrop-blur-xl shadow-sm">
        <PillTabs<Section>
          value={section}
          onChange={setSection}
          showScrollArrows={false}
          tabs={[
            { id: 'miembros', label: 'Miembros' },
            { id: 'retos', label: 'Retos' },
            { id: 'recompensas', label: 'Recompensas' },
            { id: 'logros', label: 'Logros' },
            { id: 'recuerdos', label: 'Recuerdos' },
          ]}
        />
      </div>

      {/* ── Tab Contents ── */}
      <div className="w-full transition-all duration-200">
        {section === 'miembros' && <MembersTab />}
        {section === 'retos' && <ChallengesTab />}
        {section === 'recompensas' && <RewardsTab />}
        {section === 'logros' && <AchievementsTab />}
        {section === 'recuerdos' && <MemoriesTab />}
      </div>
    </div>
  )
}
