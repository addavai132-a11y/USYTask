'use client'

import { useState } from 'react'
import { Trophy, Star, Flame, Award, Gift, Camera, Users, Sparkles } from 'lucide-react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { Card } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { useApp } from '@/components/app/app-context'
import { MembersTab } from './members-tab'
import { ChallengesTab } from './challenges-tab'
import { RewardsTab } from './rewards-tab'
import { AchievementsTab } from './achievements-tab'
import { MemoriesTab } from './memories-tab'
import { cn } from '@/lib/utils'

type Section = 'miembros' | 'retos' | 'recompensas' | 'logros' | 'recuerdos'

export function FamilyScreen() {
  const [section, setSection] = useState<Section>('miembros')
  const { members, familyChallenges, familyAchievements, familyRewards, familyMemories } = useApp()

  // Calculate high-level family gamification stats
  const totalPoints = members.reduce((acc, m) => acc + (m.points || 0), 0)
  const maxStreak = members.reduce((acc, m) => Math.max(acc, m.streak || m.streakDays || 0), 0)
  const activeChallengesCount = familyChallenges.filter((c) => c.status !== 'completado').length
  const unlockedAchievementsCount = familyAchievements.filter((a) => a.isUnlocked).length

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Familia"
        subtitle="Puntos, retos, recompensas y recuerdos compartidos"
      />

      {/* Overview Gamification Card */}
      <Card className="relative overflow-hidden p-3.5 sm:p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border-primary/20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total Points */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Star className="size-5 fill-amber-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">
                Puntos Totales
              </p>
              <p className="text-base sm:text-lg font-black text-foreground mt-0.5 tabular-nums">
                {totalPoints} pts
              </p>
            </div>
          </div>

          {/* Top Streak */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-500 shrink-0">
              <Flame className="size-5 fill-orange-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">
                Mejor Racha
              </p>
              <p className="text-base sm:text-lg font-black text-foreground mt-0.5 tabular-nums">
                {maxStreak} días
              </p>
            </div>
          </div>

          {/* Active Challenges */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500 shrink-0">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">
                Retos Activos
              </p>
              <p className="text-base sm:text-lg font-black text-foreground mt-0.5 tabular-nums">
                {activeChallengesCount}
              </p>
            </div>
          </div>

          {/* Unlocked Badges */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500 shrink-0">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-none">
                Logros
              </p>
              <p className="text-base sm:text-lg font-black text-foreground mt-0.5 tabular-nums">
                {unlockedAchievementsCount} / {familyAchievements.length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Suite Tabs */}
      <PillTabs<Section>
        value={section}
        onChange={setSection}
        tabs={[
          { id: 'miembros', label: 'Miembros' },
          { id: 'retos', label: 'Retos' },
          { id: 'recompensas', label: 'Recompensas' },
          { id: 'logros', label: 'Logros' },
          { id: 'recuerdos', label: 'Recuerdos' },
        ]}
      />

      {/* Tab Contents */}
      {section === 'miembros' && <MembersTab />}
      {section === 'retos' && <ChallengesTab />}
      {section === 'recompensas' && <RewardsTab />}
      {section === 'logros' && <AchievementsTab />}
      {section === 'recuerdos' && <MemoriesTab />}
    </div>
  )
}
