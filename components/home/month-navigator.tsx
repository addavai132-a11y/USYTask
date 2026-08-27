'use client'

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useApp } from '@/components/app/app-context'
import { formatMonthLabel, getPreviousMonthISO, getNextMonthISO } from '@/types/finances'
import { getTodayISO } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

export function MonthNavigator() {
  const { selectedMonthISO, setSelectedMonthISO } = useApp()
  const todayMonthISO = getTodayISO().slice(0, 7)
  const isCurrentMonth = selectedMonthISO === todayMonthISO

  const handlePrev = () => {
    setSelectedMonthISO(getPreviousMonthISO(selectedMonthISO))
  }

  const handleNext = () => {
    setSelectedMonthISO(getNextMonthISO(selectedMonthISO))
  }

  const handleToday = () => {
    setSelectedMonthISO(todayMonthISO)
  }

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 px-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrev}
          className="flex size-7 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white transition-all active:scale-95 border border-slate-200 dark:border-white/10"
          title="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex items-center gap-2 px-2">
          <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white capitalize tracking-tight">
            {formatMonthLabel(selectedMonthISO)}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="flex size-7 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-white transition-all active:scale-95 border border-slate-200 dark:border-white/10"
          title="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          onClick={handleToday}
          className="rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 dark:bg-purple-600/25 dark:border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 dark:hover:bg-purple-600/35 transition-all active:scale-95 shadow-sm"
        >
          Mes Actual
        </button>
      )}
    </div>
  )
}
