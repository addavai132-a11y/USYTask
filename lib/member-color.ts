import type { CSSProperties } from 'react'
import type { Member } from './mock-data'

// Returns inline style vars so member colors work as background/text/border
// without needing dynamic Tailwind class names (which can't be purged safely).
export function memberStyle(member: Pick<Member, 'colorVar'>): CSSProperties {
  return { '--m': `var(--${member.colorVar})` } as CSSProperties
}
