'use client'

import { useState } from 'react'
import { Trophy, Gift, Award, Flame, Heart, Star } from 'lucide-react'
import { PillTabs } from '@/components/ui/pill-tabs'
import { Card, CardHeader } from '@/components/ui/card'
import { ScreenHeader } from '@/components/shared/screen-header'
import { MemberAvatar } from '@/components/ui/member-avatar'
import {
  members,
  challenges,
  rewards,
  achievements,
  memories,
  wishlists,
  getMember,
} from '@/lib/mock-data'
import { useToast } from '@/components/ui/toast'
import { useApp } from '@/components/app/app-context'

type Section = 'miembros' | 'retos' | 'recompensas' | 'logros' | 'recuerdos'

export function FamilyScreen() {
  const [section, setSection] = useState<Section>('miembros')
  const { toast } = useToast()
  const { bump } = useApp()
  const medals = ['🥇', '🥈', '🥉']

  const redeem = (rewardTitle: string, cost: number) => {
    toast(`Has canjeado "${rewardTitle}" (-${cost} pts)`, '🎉')
    bump()
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Familia"
        subtitle="Puntos, retos, recompensas y recuerdos compartidos"
      />

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

      {/* MIEMBROS */}
      {section === 'miembros' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <Card key={m.id} variant="turquoise" className="flex items-center gap-4">
              <MemberAvatar member={m} size="lg" ring />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold">{m.name}</h4>
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:text-cyan-300 uppercase">
                    {m.role === 'adult' ? 'Padre/Madre' : 'Hijo/a'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    {m.points} pts
                  </span>
                  <span className="flex items-center gap-1 text-orange-500">
                    <Flame className="size-3.5 fill-orange-500 text-orange-500" />
                    {m.streak} días racha
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* RETOS */}
      {section === 'retos' && (
        <div className="flex flex-col gap-4">
          {challenges.map((c) => (
            <Card key={c.id} variant="violet">
              <CardHeader
                title={`${c.emoji} ${c.title}`}
                icon={<Trophy className="size-5 text-purple-600 dark:text-purple-400" />}
              />
              <p className="mb-3 text-xs font-semibold text-muted-foreground">
                Quedan {c.daysLeft} días de reto activo
              </p>
              <ol className="flex flex-col gap-2">
                {c.leaderboard.map((row, i) => {
                  const m = getMember(row.member)
                  return (
                    <li key={row.member} className="flex items-center gap-3 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-500/20 px-3 py-2">
                      <span className="text-base" aria-hidden="true">
                        {medals[i] || `${i + 1}º`}
                      </span>
                      <MemberAvatar member={m} size="sm" />
                      <span className="flex-1 text-sm font-semibold">{m.name}</span>
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">{row.points} pts</span>
                    </li>
                  )
                })}
              </ol>
            </Card>
          ))}
        </div>
      )}

      {/* RECOMPENSAS */}
      {section === 'recompensas' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rewards.map((r) => (
            <Card key={r.id} variant="gold" className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl">
                {r.emoji}
              </span>
              <div className="flex-1">
                <p className="font-bold">{r.title}</p>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{r.cost} pts</p>
              </div>
              <button
                onClick={() => redeem(r.title, r.cost)}
                className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform active:scale-95 shadow-soft"
              >
                Canjear
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* LOGROS */}
      {section === 'logros' && (
        <div className="flex flex-col gap-3">
          {achievements.map((a) => {
            const m = getMember(a.member)
            return (
              <Card key={a.id} variant="gold" className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl">
                  {a.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Conseguido por {m.name}</p>
                </div>
                <Award className="size-6 text-amber-600 dark:text-amber-400" />
              </Card>
            )
          })}
        </div>
      )}

      {/* RECUERDOS Y REGALOS */}
      {section === 'recuerdos' && (
        <div className="flex flex-col gap-4">
          <Card variant="sky">
            <CardHeader title="Álbumes de recuerdos" />
            <div className="grid grid-cols-2 gap-3">
              {memories.map((mem: any) => (
                <div
                  key={mem.id}
                  className={`flex flex-col justify-end rounded-2xl bg-gradient-to-br ${mem.cover} p-3 min-h-[100px] border border-border/40 shadow-sm`}
                >
                  <p className="font-bold text-gray-900">{mem.title}</p>
                  <p className="text-[11px] font-semibold text-gray-700">
                    {mem.photos} fotos {mem.location ? `· ${mem.location}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="orange">
            <CardHeader title="Listas de deseos" />
            <div className="flex flex-col gap-3">
              {wishlists.map((wl: any) => {
                const m = getMember(wl.member)
                return (
                  <div key={wl.member} className="rounded-2xl bg-secondary p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <MemberAvatar member={m} size="sm" />
                      <span className="font-bold text-sm">Lista de {m.name}</span>
                    </div>
                    <ul className="flex flex-col gap-1.5 pl-2">
                      {wl.gifts.map((g: any) => (
                        <li key={g.id} className="flex items-center justify-between text-xs font-semibold">
                          <span>🎁 {g.title} {g.price ? `(${g.price} €)` : ''}</span>
                          {g.reserved ? (
                            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] text-accent font-extrabold">
                              Reservado
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">Disponible</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
