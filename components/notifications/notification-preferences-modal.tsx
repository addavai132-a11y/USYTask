'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  X,
  Calendar,
  Dumbbell,
  PiggyBank,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '@/types/notifications'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { useModalBackHandler } from '@/lib/use-modal-back-handler'

interface NotificationPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPreferencesModal({
  isOpen,
  onClose,
}: NotificationPreferencesModalProps) {
  useModalBackHandler(isOpen, onClose)
  const { toast } = useToast()
  const {
    isSupported,
    permission,
    isSubscribed,
    loading: pushLoading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    activateAndTest,
  } = usePushNotifications()

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null)

  // Cargar preferencias del usuario
  useEffect(() => {
    if (!isOpen) return

    let mounted = true
    async function loadPreferences() {
      setLoadingPrefs(true)
      try {
        const res = await fetch('/api/push/preferences')
        if (res.ok && mounted) {
          const data = await res.json()
          if (data.preferences) {
            setPreferences(data.preferences)
          }
        }
      } catch (err) {
        console.error('Error cargando preferencias de notificación:', err)
      } finally {
        if (mounted) setLoadingPrefs(false)
      }
    }

    loadPreferences()
    return () => { mounted = false }
  }, [isOpen])

  // Actualizar un toggle individual y sincronizar con la base de datos
  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (permission === 'denied') {
      toast('Permiso bloqueado. Habilita las notificaciones en el navegador.', '🔒')
      return
    }
    if (permission === 'default' || !isSubscribed) {
      toast('Activa las notificaciones en la parte superior primero.', '⚠️')
      return
    }
    if (savingKey) return

    const newValue = !preferences[key]
    const updated = {
      ...preferences,
      [key]: newValue,
    }
    setPreferences(updated)
    setSavingKey(key)

    try {
      const res = await fetch('/api/push/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updated }),
      })

      if (res.ok) {
        toast('Preferencias guardadas', '💾')
      } else {
        setPreferences(preferences) // Revert on error
        toast('Error guardando en el servidor', '⚠️')
      }
    } catch (err) {
      console.error('Error guardando preferencias:', err)
      setPreferences(preferences) // Revert on error
      toast('Error de conexión', '❌')
    } finally {
      setSavingKey(null)
    }
  }

  // Activar notificaciones y enviar prueba en un solo paso
  const handleActivateAndTest = async () => {
    const res = await activateAndTest()
    if (res.success) {
      toast('¡Notificación de prueba enviada con éxito! Revisa tu pantalla.', '🚀')
    } else {
      toast(res.error || 'Aviso en notificación', '🔔')
    }
  }

  if (!isOpen) return null

  const isFullyEnabled = isSubscribed && permission === 'granted'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden dark:border-purple-500/30 dark:bg-[#100e23]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-purple-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300 shrink-0">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Centro de Notificaciones Push
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza las alertas que deseas recibir en tus dispositivos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1 sm:pr-2 text-xs custom-fitness-scroll">
          {/* 1. Tarjeta de Estado del Dispositivo */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-white/[0.03] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-purple-400" />
                  Estado del Dispositivo
                </span>
                {isSubscribed ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center gap-1 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300">
                    <CheckCircle2 className="size-3" /> Activo
                  </span>
                ) : permission === 'denied' ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px] flex items-center gap-1 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300">
                    <AlertTriangle className="size-3" /> Bloqueado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px] flex items-center gap-1 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300">
                    Inactivo
                  </span>
                )}
              </div>

              {/* Botón Acción Dispositivo: Siempre llamado 'Activar notificaciones' y siempre visible */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleActivateAndTest}
                  disabled={pushLoading || !isSupported}
                  className="px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 active:scale-95 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-50"
                  title="Gestionar suscripción y enviar notificación de prueba"
                >
                  {pushLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Bell className="size-3.5" />
                  )}
                  <span>Activar notificaciones</span>
                </button>
              </div>
            </div>

            {!isSupported && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Tu navegador actual no admite notificaciones Web Push o estás en modo incógnito.
              </p>
            )}
            {permission === 'denied' && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Has bloqueado las notificaciones en los ajustes del navegador. Para recibirlas, permite las notificaciones en el icono de candado de la barra de direcciones.
              </p>
            )}
          </div>

          {/* 2. Categorías de Preferencias */}
          {loadingPrefs ? (
            <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="size-5 animate-spin text-emerald-600 dark:text-purple-400" />
              <span>Cargando tus preferencias...</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* SECTOR ORGANIZACIÓN */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs dark:bg-white/[0.02] dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5 text-slate-900 dark:text-white font-bold">
                  <Calendar className="size-4 text-emerald-600 dark:text-purple-400" />
                  <span>Organización & Centro de Control</span>
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleItem
                    label="Eventos y reuniones programadas"
                    description="Aviso con 15 minutos de antelación para citas y calendarios"
                    checked={isFullyEnabled && preferences.organizacion_events}
                    onChange={() => handleToggle('organizacion_events')}
                    disabled={!!savingKey}
                    loading={savingKey === 'organizacion_events'}
                  />
                  <ToggleItem
                    label="Lista de compras del hogar"
                    description="Avisar cuando un miembro añada productos urgentes o actualice la lista"
                    checked={isFullyEnabled && preferences.organizacion_shopping}
                    onChange={() => handleToggle('organizacion_shopping')}
                    disabled={!!savingKey}
                    loading={savingKey === 'organizacion_shopping'}
                  />
                  <ToggleItem
                    label="Planificador de comidas y menús"
                    description="Recordatorio de la comida o receta planificada para el día"
                    checked={isFullyEnabled && preferences.organizacion_meals}
                    onChange={() => handleToggle('organizacion_meals')}
                    disabled={!!savingKey}
                    loading={savingKey === 'organizacion_meals'}
                  />
                </div>
              </div>

              {/* SECTOR FITNESS */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs dark:bg-white/[0.02] dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5 text-slate-900 dark:text-white font-bold">
                  <Dumbbell className="size-4 text-emerald-600 dark:text-purple-400" />
                  <span>Salud & Fitness</span>
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleItem
                    label="Recordatorio de entrenamiento diario"
                    description="Alerta vespertina si aún no has iniciado tu sesión programada"
                    checked={isFullyEnabled && preferences.fitness_workout}
                    onChange={() => handleToggle('fitness_workout')}
                    disabled={!!savingKey}
                    loading={savingKey === 'fitness_workout'}
                  />
                  <ToggleItem
                    label="Nuevos récords personales (PRs)"
                    description="Celebración cuando tú o un miembro superéis vuestras marcas"
                    checked={isFullyEnabled && preferences.fitness_records}
                    onChange={() => handleToggle('fitness_records')}
                    disabled={!!savingKey}
                    loading={savingKey === 'fitness_records'}
                  />
                  <ToggleItem
                    label="Registro nutricional y calorías"
                    description="Aviso para registrar comidas y no perder el balance de macros"
                    checked={isFullyEnabled && preferences.fitness_nutrition}
                    onChange={() => handleToggle('fitness_nutrition')}
                    disabled={!!savingKey}
                    loading={savingKey === 'fitness_nutrition'}
                  />
                </div>
              </div>

              {/* SECTOR FINANZAS */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs dark:bg-white/[0.02] dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5 text-slate-900 dark:text-white font-bold">
                  <PiggyBank className="size-4 text-emerald-600 dark:text-purple-400" />
                  <span>Finanzas & Hucha Familiar</span>
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleItem
                    label="Vencimiento de facturas y recibos"
                    description="Aviso preventivo 2 días antes del cobro de una factura fija"
                    checked={isFullyEnabled && preferences.finanzas_bills}
                    onChange={() => handleToggle('finanzas_bills')}
                    disabled={!!savingKey}
                    loading={savingKey === 'finanzas_bills'}
                  />
                  <ToggleItem
                    label="Alertas de techo presupuestario"
                    description="Notificar cuando una categoría supere el 85% o el 100% mensual"
                    checked={isFullyEnabled && preferences.finanzas_budgets}
                    onChange={() => handleToggle('finanzas_budgets')}
                    disabled={!!savingKey}
                    loading={savingKey === 'finanzas_budgets'}
                  />
                  <ToggleItem
                    label="Aportes a la Hucha Compartida"
                    description="Aviso al grupo cuando alguien realiza un nuevo ingreso de ahorro"
                    checked={isFullyEnabled && preferences.finanzas_piggy}
                    onChange={() => handleToggle('finanzas_piggy')}
                    disabled={!!savingKey}
                    loading={savingKey === 'finanzas_piggy'}
                  />
                </div>
              </div>

              {/* SECTOR FAMILIA */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs dark:bg-white/[0.02] dark:border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-white/5 text-slate-900 dark:text-white font-bold">
                  <Users className="size-4 text-emerald-600 dark:text-purple-400" />
                  <span>Familia & Gamificación</span>
                </div>

                <div className="space-y-2 pt-1">
                  <ToggleItem
                    label="Retos y misiones del hogar"
                    description="Avisar cuando te asignen un nuevo reto o tarea con puntos"
                    checked={isFullyEnabled && preferences.familia_challenges}
                    onChange={() => handleToggle('familia_challenges')}
                    disabled={!!savingKey}
                    loading={savingKey === 'familia_challenges'}
                  />
                  <ToggleItem
                    label="Rachas activas y subida de nivel"
                    description="Celebrar logros de racha continuada (7, 14, 30 días) y puntos"
                    checked={isFullyEnabled && preferences.familia_streaks}
                    onChange={() => handleToggle('familia_streaks')}
                    disabled={!!savingKey}
                    loading={savingKey === 'familia_streaks'}
                  />
                  <ToggleItem
                    label="Recuerdos y momentos compartidos"
                    description="Alerta cuando se añadan fotos o notas al baúl de recuerdos"
                    checked={isFullyEnabled && preferences.familia_memories}
                    onChange={() => handleToggle('familia_memories')}
                    disabled={!!savingKey}
                    loading={savingKey === 'familia_memories'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-purple-500/20 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="size-3 text-emerald-600 dark:text-purple-400" />
            {savingKey ? 'Guardando cambios...' : 'Cambios guardados en tu perfil'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors dark:bg-purple-600 dark:hover:bg-purple-500"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
  disabled,
  loading
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          checked
            ? 'bg-emerald-600 dark:bg-purple-600'
            : 'bg-slate-300 dark:bg-white/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        >
          {loading && <Loader2 className="size-2.5 animate-spin text-slate-400" />}
        </span>
      </button>
    </div>
  )
}
