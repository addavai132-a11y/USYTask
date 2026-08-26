import type { CSSProperties } from 'react'
import type { Member } from '@/types'

// Returns inline style vars so member colors work as background/text/border
// without needing dynamic Tailwind class names (which can't be purged safely).
export function memberStyle(member: Pick<Member, 'colorVar' | 'avatarColor'>): CSSProperties {
  // Prefer avatarColor (direct value) for inline override, fallback to CSS var
  if (member.avatarColor) {
    return { '--m': member.avatarColor } as CSSProperties
  }
  return { '--m': `var(--${member.colorVar})` } as CSSProperties
}
