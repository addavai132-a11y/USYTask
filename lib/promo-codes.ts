'use client'

import { createClient } from './supabase'
import { getStoredSession, setStoredSession, UserProfile } from './user-session'
import type { PromoCode, PromoPlanType, RedeemPromoResponse } from '@/types/promo-codes'

const LOCAL_PROMO_CODES_KEY = 'usytask_local_promo_codes'

// Códigos iniciales predeterminados para pruebas locales y modo desarrollo
const DEFAULT_DEV_CODES: PromoCode[] = [
  {
    id: 'promo_seed_1',
    code: 'USY-BETA-2026',
    is_used: false,
    plan_type: 'early_access',
    duration_days: null, // Vitalicio
    description: 'Acceso Anticipado Beta Tester Vitalicio',
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo_seed_2',
    code: 'USY-PRO-DEV',
    is_used: false,
    plan_type: 'lifetime',
    duration_days: null, // Vitalicio
    description: 'Licencia Premium Desarrollador Vitalicia',
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo_seed_3',
    code: 'USY-VIP-30D',
    is_used: false,
    plan_type: 'monthly',
    duration_days: 30,
    description: 'Pase Premium 30 Días de Prueba',
    created_at: new Date().toISOString(),
  },
]

/**
 * Obtiene los códigos almacenados localmente para pruebas en entorno local / offline.
 */
export function getLocalPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return DEFAULT_DEV_CODES
  try {
    const raw = localStorage.getItem(LOCAL_PROMO_CODES_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_PROMO_CODES_KEY, JSON.stringify(DEFAULT_DEV_CODES))
      return DEFAULT_DEV_CODES
    }
    return JSON.parse(raw)
  } catch {
    return DEFAULT_DEV_CODES
  }
}

/**
 * Guarda los códigos promocionales en localStorage.
 */
export function saveLocalPromoCodes(codes: PromoCode[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_PROMO_CODES_KEY, JSON.stringify(codes))
  } catch (err) {
    console.error('Error guardando códigos locales:', err)
  }
}

/**
 * Canjea un código promocional tanto contra Supabase como contra la base de datos local.
 */
export async function redeemPromoCode(
  rawCode: string,
  session?: UserProfile | null
): Promise<RedeemPromoResponse> {
  const code = (rawCode || '').trim().toUpperCase()

  if (!code) {
    return { success: false, error: 'Por favor, introduce un código de activación.' }
  }

  const currentSession = session || getStoredSession()
  const userId = currentSession?.id || 'usr_local_user'

  // 1. Intentar validar y canjear primero contra Supabase vía RPC atómica
  let supabaseErrorMsg: string | null = null
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('redeem_promo_code', { input_code: code })

    if (!error && data) {
      if (data.success) {
        // Actualizar sesión local activa
        if (currentSession) {
          const updatedSession: UserProfile = {
            ...currentSession,
            isPremium: true,
            premiumPlan: data.plan_type || 'early_access',
            premiumUntil: data.premium_until || null,
          }
          setStoredSession(updatedSession)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('usytask_session_updated', { detail: updatedSession })
            )
          }
        }
        return {
          success: true,
          message: data.message || '¡Código canjeado con éxito! Bienvenido a Usytask Premium 👑',
          plan_type: data.plan_type,
          premium_until: data.premium_until,
        }
      } else {
        supabaseErrorMsg = data.error || 'Código no válido.'
      }
    } else if (error) {
      supabaseErrorMsg = error.message
    }
  } catch (err: any) {
    console.warn('[redeemPromoCode] Supabase RPC falló o no está configurado, comprobando almacén local:', err)
    supabaseErrorMsg = err?.message || 'Error de red con Supabase.'
  }

  // 2. Fallback de pruebas locales / desarrollo offline
  const localCodes = getLocalPromoCodes()
  const foundIdx = localCodes.findIndex(
    (c) => c.code.toUpperCase().trim() === code
  )

  if (foundIdx >= 0) {
    const targetCode = localCodes[foundIdx]

    if (targetCode.is_used) {
      return {
        success: false,
        error: 'Este código promocional ya ha sido utilizado.',
      }
    }

    if (targetCode.expires_at && new Date(targetCode.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Este código promocional ha caducado.',
      }
    }

    // Calcular expiración si aplica
    let calculatedExpiry: string | null = null
    if (targetCode.duration_days && targetCode.duration_days > 0) {
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + targetCode.duration_days)
      calculatedExpiry = expDate.toISOString()
    }

    // Marcar como usado localmente
    localCodes[foundIdx] = {
      ...targetCode,
      is_used: true,
      used_at: new Date().toISOString(),
      used_by: userId,
    }
    saveLocalPromoCodes(localCodes)

    // Actualizar perfil del usuario activo
    if (currentSession) {
      const updatedSession: UserProfile = {
        ...currentSession,
        isPremium: true,
        premiumPlan: targetCode.plan_type,
        premiumUntil: calculatedExpiry,
      }
      setStoredSession(updatedSession)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('usytask_session_updated', { detail: updatedSession })
        )
      }
    }

    return {
      success: true,
      message: '¡Código activado con éxito! Ahora dispones de estatus Premium 👑',
      plan_type: targetCode.plan_type,
      premium_until: calculatedExpiry,
    }
  }

  return {
    success: false,
    error: supabaseErrorMsg || 'El código introducido no existe o no es válido.',
  }
}

/**
 * Genera un nuevo código promocional y lo registra en Supabase y localmente.
 */
export async function generatePromoCode(options: {
  code?: string
  planType?: PromoPlanType
  durationDays?: number | null
  description?: string
}): Promise<{ success: boolean; promoCode: PromoCode; error?: string }> {
  const planType = options.planType || 'lifetime'
  const durationDays = options.durationDays ?? null
  const description = options.description || 'Código generado para pruebas de desarrollo'

  // Si no se proporcionó código, generar formato legible y elegante tipo: USY-VIP-7X9K
  const cleanCode =
    options.code?.trim().toUpperCase() ||
    `USY-${planType === 'early_access' ? 'BETA' : 'VIP'}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`

  const newCode: PromoCode = {
    id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: cleanCode,
    is_used: false,
    plan_type: planType,
    duration_days: durationDays,
    description,
    created_at: new Date().toISOString(),
  }

  // 1. Guardar en almacenamiento local
  const localCodes = getLocalPromoCodes()
  const exists = localCodes.some((c) => c.code.toUpperCase() === cleanCode)
  if (!exists) {
    localCodes.unshift(newCode)
    saveLocalPromoCodes(localCodes)
  }

  // 2. Intentar guardar en Supabase si está disponible
  try {
    const supabase = createClient()
    const { error } = await supabase.from('promo_codes').insert({
      code: cleanCode,
      plan_type: planType,
      duration_days: durationDays,
      description,
      is_used: false,
    })

    if (error) {
      console.warn('[generatePromoCode] Supabase insert warning (se mantendrá en local):', error.message)
    }
  } catch (err) {
    console.warn('[generatePromoCode] Supabase no alcanzable, código guardado en local.', err)
  }

  return { success: true, promoCode: newCode }
}

/**
 * Lista todos los códigos promocionales (combinando Supabase y local).
 */
export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const localCodes = getLocalPromoCodes()
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      // Unir evitando duplicados
      const mergedMap = new Map<string, PromoCode>()
      localCodes.forEach((c) => mergedMap.set(c.code.toUpperCase(), c))
      data.forEach((c: any) => mergedMap.set(c.code.toUpperCase(), c as PromoCode))
      return Array.from(mergedMap.values())
    }
  } catch {
    // Si falla Supabase, devolver local
  }
  return localCodes
}

/**
 * Utilidad de desarrollo: cambia o reinicia el estatus Premium del usuario para pruebas.
 */
export function toggleDevPremiumStatus(isPremium: boolean): void {
  const current = getStoredSession()
  if (!current) return
  const updated: UserProfile = {
    ...current,
    isPremium,
    premiumPlan: isPremium ? 'lifetime' : undefined,
    premiumUntil: isPremium ? null : undefined,
  }
  setStoredSession(updated)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('usytask_session_updated', { detail: updated })
    )
  }
}
