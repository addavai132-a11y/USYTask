'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { activities, getMember, activityPoints, type Activity } from '@/lib/mock-data'
import { MemberAvatar } from '@/components/ui/member-avatar'
import { Card, CardHeader } from '@/components/ui/card'

const REACTIONS = ['❤️', '😂', '👏', '🔥']

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader title="Actividad familiar" />
      <ul className="flex flex-col gap-4">
        {activities.map((a) => (
          <ActivityItem key={a.id} activity={a} />
        ))}
      </ul>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const member = getMember(activity.member)
  const [reactions, setReactions] = useState<Record<string, number>>(() =>
    Object.fromEntries(activity.reactions.map((r) => [r.emoji, r.count])),
  )
  const [mine, setMine] = useState<Set<string>>(new Set())
  const [picker, setPicker] = useState(false)
  const points = activityPoints[activity.id]

  const react = (emoji: string) => {
    setReactions((prev) => {
      const next = { ...prev }
      if (mine.has(emoji)) {
        next[emoji] = (next[emoji] ?? 1) - 1
        if (next[emoji] <= 0) delete next[emoji]
      } else {
        next[emoji] = (next[emoji] ?? 0) + 1
      }
      return next
    })
    setMine((prev) => {
      const next = new Set(prev)
      next.has(emoji) ? next.delete(emoji) : next.add(emoji)
      return next
    })
    setPicker(false)
  }

  return (
    <li className="flex gap-3">
      <MemberAvatar member={member} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-bold">{member.name}</span> <span className="text-muted-foreground">{activity.text}</span>
          {points ? <span className="font-bold text-accent"> +{points} ⭐</span> : null}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{activity.time}</span>
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className={cn(
                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-transform active:scale-90',
                mine.has(emoji) ? 'border-primary bg-primary/10' : 'border-border bg-card',
              )}
            >
              <span>{emoji}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setPicker((p) => !p)}
              className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-transform active:scale-90"
              aria-label="Reaccionar"
            >
              +
            </button>
            {picker && (
              <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-soft-lg animate-pop">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => react(emoji)}
                    className="rounded-lg px-1.5 py-0.5 text-lg transition-transform hover:scale-125 active:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
