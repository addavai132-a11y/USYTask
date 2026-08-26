'use client'

import { Bell } from 'lucide-react'
import { useApp } from '@/components/app/app-context'
import { getGreeting, getTodayLabel } from '@/lib/date-utils'

export function FeedHeader() {
  const { setNotificationsOpen, userName, notifications } = useApp()

  return (
    <header className="mb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {getGreeting()}, {userName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-400">{getTodayLabel()}</p>
        </div>
        <button
          onClick={() => setNotificationsOpen(true)}
          aria-label="Notificaciones"
          className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white shadow-soft transition-all active:scale-90"
        >
          <Bell className="size-5" />
          {notifications.length > 0 && (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-[#100e23] bg-orange-500" />
          )}
        </button>
      </div>
    </header>
  )
}
