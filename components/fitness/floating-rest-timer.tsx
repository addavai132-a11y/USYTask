'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Timer, X, Play, Pause, Plus, Minus, Volume2, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  getRestTimer,
  saveRestTimer,
  clearRestTimer,
  playTimerCompletionSound,
  triggerHapticFeedback,
  type RestTimerState,
} from '@/lib/fitness-store'
import { cn } from '@/lib/utils'

export function triggerRestTimer(seconds: number, exerciseName?: string) {
  const targetEndTime = Date.now() + seconds * 1000
  const state: RestTimerState = {
    targetEndTime,
    totalSeconds: seconds,
    isPaused: false,
    exerciseName,
  }
  saveRestTimer(state)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('usytask_rest_timer_updated'))
  }
}

export function FloatingRestTimer() {
  const { toast } = useToast()
  const [timerState, setTimerState] = useState<RestTimerState | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const hasAlertedRef = useRef(false)

  // Sync state from localStorage
  const syncStateFromStorage = useCallback(() => {
    const stored = getRestTimer()
    if (!stored) {
      setTimerState(null)
      setSecondsRemaining(null)
      hasAlertedRef.current = false
      return
    }

    setTimerState(stored)
    if (stored.isPaused) {
      setSecondsRemaining(stored.remainingSecondsWhenPaused || 0)
    } else {
      const remaining = Math.max(0, Math.ceil((stored.targetEndTime - Date.now()) / 1000))
      setSecondsRemaining(remaining)
    }
  }, [])

  // Listen to custom timer events and localStorage storage events
  useEffect(() => {
    syncStateFromStorage()

    const handleCustomEvent = () => syncStateFromStorage()
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'usytask_active_rest_timer' || e.key === null) {
        syncStateFromStorage()
      }
    }
    const handleVisibilityOrFocus = () => {
      syncStateFromStorage()
    }

    window.addEventListener('usytask_rest_timer_updated', handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)
    window.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    return () => {
      window.removeEventListener('usytask_rest_timer_updated', handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
  }, [syncStateFromStorage])

  // Active countdown loop (robust against mobile sleep/tab backgrounding)
  useEffect(() => {
    if (!timerState || timerState.isPaused) return

    const tick = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((timerState.targetEndTime - now) / 1000))
      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        if (!hasAlertedRef.current) {
          hasAlertedRef.current = true
          playTimerCompletionSound()
          triggerHapticFeedback()
          toast(
            timerState.exerciseName
              ? `⏰ ¡Descanso completado para ${timerState.exerciseName}! A por la siguiente serie 💪`
              : '⏰ ¡Tiempo de descanso completado! A por la siguiente serie 💪',
            '🔔'
          )
        }
        clearRestTimer()
        setTimerState(null)
        setSecondsRemaining(null)
        window.dispatchEvent(new CustomEvent('usytask_rest_timer_updated'))
      }
    }

    tick()
    const interval = setInterval(tick, 250) // Frequent check to ensure zero delay upon resume
    return () => clearInterval(interval)
  }, [timerState, toast])

  if (!timerState || secondsRemaining === null) {
    return null
  }

  const handlePauseToggle = () => {
    if (timerState.isPaused) {
      // Resume
      const remaining = timerState.remainingSecondsWhenPaused || secondsRemaining || 0
      const targetEndTime = Date.now() + remaining * 1000
      const updated: RestTimerState = {
        ...timerState,
        isPaused: false,
        targetEndTime,
        remainingSecondsWhenPaused: undefined,
      }
      saveRestTimer(updated)
      setTimerState(updated)
      hasAlertedRef.current = false
    } else {
      // Pause
      const remaining = Math.max(0, Math.ceil((timerState.targetEndTime - Date.now()) / 1000))
      const updated: RestTimerState = {
        ...timerState,
        isPaused: true,
        remainingSecondsWhenPaused: remaining,
      }
      saveRestTimer(updated)
      setTimerState(updated)
      setSecondsRemaining(remaining)
    }
    window.dispatchEvent(new CustomEvent('usytask_rest_timer_updated'))
  }

  const handleAdjustTime = (deltaSeconds: number) => {
    let newRemaining = (secondsRemaining || 0) + deltaSeconds
    if (newRemaining < 1) newRemaining = 1

    const newTotal = Math.max(timerState.totalSeconds, newRemaining)

    if (timerState.isPaused) {
      const updated: RestTimerState = {
        ...timerState,
        totalSeconds: newTotal,
        remainingSecondsWhenPaused: newRemaining,
      }
      saveRestTimer(updated)
      setTimerState(updated)
      setSecondsRemaining(newRemaining)
    } else {
      const targetEndTime = Date.now() + newRemaining * 1000
      const updated: RestTimerState = {
        ...timerState,
        totalSeconds: newTotal,
        targetEndTime,
      }
      saveRestTimer(updated)
      setTimerState(updated)
      setSecondsRemaining(newRemaining)
      hasAlertedRef.current = false
    }
    window.dispatchEvent(new CustomEvent('usytask_rest_timer_updated'))
  }

  const handleClose = () => {
    clearRestTimer()
    setTimerState(null)
    setSecondsRemaining(null)
    window.dispatchEvent(new CustomEvent('usytask_rest_timer_updated'))
  }

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsRemaining / (timerState.totalSeconds || 90)) * 100)
  )

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="rounded-2xl bg-[#100e23]/95 border border-purple-500/40 p-3.5 shadow-2xl backdrop-blur-2xl flex items-center gap-3.5 w-80 ring-1 ring-white/10">
        {/* Animated Countdown Circle / Badge */}
        <div
          className={cn(
            'size-12 rounded-xl flex flex-col items-center justify-center font-mono font-bold text-sm shrink-0 border transition-all duration-300',
            timerState.isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-md shadow-purple-950/50 animate-pulse'
          )}
        >
          <span className="text-base font-black tracking-tight leading-none">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-[9px] font-semibold opacity-75 mt-0.5">
            {timerState.isPaused ? 'PAUSA' : 'REST'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Timer className="size-3.5 text-purple-400 shrink-0" />
              <span className="text-white truncate">
                {timerState.exerciseName || 'Descanso'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar temporizador"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                timerState.isPaused
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-400 shadow-sm'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAdjustTime(-15)}
                className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/15 border border-white/10 active:scale-95 transition-all"
                title="Restar 15 segundos"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTime(30)}
                className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/15 border border-white/10 active:scale-95 transition-all"
                title="Añadir 30 segundos"
              >
                +30s
              </button>
            </div>

            <button
              type="button"
              onClick={handlePauseToggle}
              className={cn(
                'px-2.5 py-0.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95 border',
                timerState.isPaused
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/40'
                  : 'bg-purple-600/30 border-purple-500/40 text-purple-200 hover:bg-purple-600/40'
              )}
            >
              {timerState.isPaused ? (
                <>
                  <Play className="size-2.5 fill-current" />
                  <span>Reanudar</span>
                </>
              ) : (
                <>
                  <Pause className="size-2.5 fill-current" />
                  <span>Pausar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
