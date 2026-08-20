'use client'

import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { isDevEnvironment, isDevModeActive, toggleDevMode } from '@/lib/dev-mode'

export function DevModeSwitch() {
  const [isDevEnv, setIsDevEnv] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (isDevEnvironment()) {
      setIsDevEnv(true)
      setActive(isDevModeActive())
    }
  }, [])

  if (!isDevEnv) return null

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked
    setActive(val)
    toggleDevMode(val)
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-soft transition-all">
      <Zap className="size-3.5 fill-amber-500 text-amber-500" />
      <span>Modo desarrollo</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={active}
          onChange={handleToggle}
          className="peer sr-only"
        />
        <div className="peer h-4 w-7 rounded-full bg-amber-500/30 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-amber-600 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
      </label>
    </div>
  )
}
