'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  max,
  className,
  barClassName,
  style,
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
  style?: React.CSSProperties
}) {
  const [width, setWidth] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const pct = max && max > 0 ? (value / max) * 100 : value

  useEffect(() => {
    // animate on mount / when value changes
    const id = requestAnimationFrame(() => setWidth(Math.min(100, Math.max(0, pct))))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div
      ref={ref}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width] duration-700 ease-out', barClassName)}
        style={{ width: `${width}%`, ...style }}
      />
    </div>
  )
}
