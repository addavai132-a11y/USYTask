import { cn } from '@/lib/utils'
import type { Member } from '@/lib/mock-data'
import { memberStyle } from '@/lib/member-color'

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
}

export function MemberAvatar({
  member,
  size = 'md',
  ring = false,
  className,
}: {
  member: Member
  size?: keyof typeof sizes
  ring?: boolean
  className?: string
}) {
  return (
    <span
      style={memberStyle(member)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        'bg-[var(--m)]',
        ring && 'ring-2 ring-background',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  )
}
