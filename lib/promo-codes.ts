'use client'

import { createClient } from './supabase'
import { getStoredSession, setStoredSession, UserProfile } from './user-session'
import type { PromoCode, PromoPlanType, RedeemPromoResponse } from '@/types/promo-codes'

const LOCAL_PROMO_CODES_KEY = 'usytask_local_promo_codes'

// Códigos iniciales predeterminados para pruebas locales
const DEFAULT_DEV_CODES: PromoCode[] = [
  {
    id: 'promo_seed_1',
    code: 'USY-BETA-2026',
    is_used: false,
    plan_type: 'early_access',
    duration_days: null,
    description: 'Acceso Anticipado Beta Tester Vitalicio',
    created_at: new Date().toISOString(),
  },
  {
    id: 'promo_seed_2',
    code: 'USY-PRO-DEV',
    is_used: false,
    plan_type: 'lifetime',
    duration_days: null,
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
 * Obtiene los códigos almacenados localmente para pruebas en local/offline.
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
 * Actualiza la sesión local activa con el estatus Premium y emite evento global.
 */
function applyPremiumLocally(session?: UserProfile | null, planType: string = 'lifetime'): void {
  const current = session || getStoredSession()
  if (current) {
    const updated: UserProfile = {
      ...current,
      isPremium: true,
      premiumPlan: planType,
    }
    setStoredSession(updated)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('usytask_session_updated', { detail: updated })
      )
    }
  }
}

/**
 * Canjea un código promocional verificando en Supabase si el código existe en
 * promo_codes y no ha sido usado (is_used = false). Si es válido, actualiza el
 * campo is_premium del usuario a true en profiles y marca el código como usado.
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
  const localUserId = currentSession?.id || 'usr_local_user'

  // 1. Intentar validar y canjear en Supabase
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Consultar el código en la tabla promo_codes
    const { data: promoData, error: fetchErr } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', code)
      .maybeSingle()

    if (fetchErr) {
      console.warn('[redeemPromoCode] Consulta directa falló, intentando RPC:', fetchErr.message)
      // Si la consulta directa tiene conflicto de RLS, intentar función RPC si existe
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('redeem_promo_code', {
          input_code: code,
        })
        if (!rpcErr && rpcData?.success) {
          applyPremiumLocally(currentSession, rpcData.plan_type || 'early_access')
          return {
            success: true,
            message: rpcData.message || '¡Código canjeado con éxito! Tu cuenta ahora es Premium 👑',
          }
        }
      } catch {}
    } else if (promoData) {
      // El código fue encontrado en la tabla promo_codes
      if (promoData.is_used) {
        return {
          success: false,
          error: 'Este código promocional ya ha sido utilizado.',
        }
      }

      if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
        return {
          success: false,
          error: 'Este código promocional ha caducado.',
        }
      }

      // a) Actualizar el campo is_premium del usuario actual a true en profiles
      const targetUserId = user?.id || (currentSession?.id && !currentSession.id.startsWith('usr_demo_') ? currentSession.id : null)
      if (targetUserId) {
        const { error: profileUpdateErr } = await supabase
          .from('profiles')
          .update({
            is_premium: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId)

        if (profileUpdateErr) {
          console.warn('[redeemPromoCode] Aviso al actualizar profiles.is_premium:', profileUpdateErr.message)
        }
      }

      // b) Marcar el código como usado en la tabla promo_codes
      const updatePayload: Record<string, any> = {
        is_used: true,
      }
      if (user?.id) updatePayload.used_by = user.id
      updatePayload.used_at = new Date().toISOString()

      const { error: updateCodeErr } = await supabase
        .from('promo_codes')
        .update(updatePayload)
        .eq('id', promoData.id)

      if (updateCodeErr) {
        // Fallback en caso de que las columnas used_by/used_at no existan
        await supabase
          .from('promo_codes')
          .update({ is_used: true })
          .eq('id', promoData.id)
      }

      // Actualizar sesión local y emitir evento reactivo
      applyPremiumLocally(currentSession, promoData.plan_type || 'lifetime')

      return {
        success: true,
        message: '¡Código canjeado con éxito! Tu cuenta ahora es Premium 👑',
      }
    }
  } catch (err: any) {
    console.warn('[redeemPromoCode] Excepción conectando con Supabase:', err)
  }

  // 2. Fallback de códigos locales de prueba
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

    localCodes[foundIdx] = {
      ...targetCode,
      is_used: true,
      used_at: new Date().toISOString(),
      used_by: localUserId,
    }
    saveLocalPromoCodes(localCodes)
    applyPremiumLocally(currentSession, targetCode.plan_type)

    return {
      success: true,
      message: '¡Código activado con éxito! Ahora dispones de estatus Premium 👑',
    }
  }

  return {
    success: false,
    error: 'El código introducido no existe o no es válido.',
  }
}

/**
 * Genera un nuevo código aleatorio al vuelo y lo inserta directamente en la tabla
 * promo_codes de Supabase (y localmente para pruebas en localhost).
 */
export async function generatePromoCode(options?: {
  code?: string
  planType?: PromoPlanType
  durationDays?: number | null
  description?: string
}): Promise<{ success: boolean; promoCode: PromoCode; error?: string }> {
  // Generar código aleatorio en formato USY-XXXX-XXXX si no se proporciona uno
  const cleanCode =
    options?.code?.trim().toUpperCase() ||
    `USY-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`

  const newCodeObj: PromoCode = {
    id: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: cleanCode,
    is_used: false,
    plan_type: options?.planType || 'lifetime',
    duration_days: options?.durationDays ?? null,
    description: options?.description || 'Código generado en entorno de desarrollo',
    created_at: new Date().toISOString(),
  }

  // 1. Insertar directamente en la tabla promo_codes de Supabase
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Intentar inserción con metadata completa
    const { error: insertErr } = await supabase.from('promo_codes').insert({
      code: cleanCode,
      is_used: false,
      created_by: user?.id || null,
      plan_type: newCodeObj.plan_type,
      description: newCodeObj.description,
    })

    if (insertErr) {
      // Si la tabla solo contiene columnas básicas (code, is_used)
      const { error: basicInsertErr } = await supabase.from('promo_codes').insert({
        code: cleanCode,
        is_used: false,
      })
      if (basicInsertErr) {
        console.warn('[generatePromoCode] Error en Supabase insert:', basicInsertErr.message)
      } else {
        console.info('[generatePromoCode] Código insertado con éxito en tabla promo_codes de Supabase:', cleanCode)
      }
    } else {
      console.info('[generatePromoCode] Código insertado con éxito en tabla promo_codes de Supabase:', cleanCode)
    }
  } catch (err) {
    console.warn('[generatePromoCode] Supabase no alcanzable, guardado localmente:', err)
  }

  // 2. Guardar también en almacén local
  const localCodes = getLocalPromoCodes()
  if (!localCodes.some((c) => c.code.toUpperCase() === cleanCode)) {
    localCodes.unshift(newCodeObj)
    saveLocalPromoCodes(localCodes)
  }

  return { success: true, promoCode: newCodeObj }
}

/**
 * Consulta todos los códigos promocionales (combinando Supabase y almacén local).
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
      const mergedMap = new Map<string, PromoCode>()
      localCodes.forEach((c) => mergedMap.set(c.code.toUpperCase(), c))
      data.forEach((c: any) =>
        mergedMap.set(c.code.toUpperCase(), {
          id: c.id,
          code: c.code,
          is_used: Boolean(c.is_used),
          used_by: c.used_by,
          used_at: c.used_at,
          created_by: c.created_by,
          plan_type: c.plan_type || 'lifetime',
          duration_days: c.duration_days,
          description: c.description,
          expires_at: c.expires_at,
          created_at: c.created_at,
        })
      )
      return Array.from(mergedMap.values())
    }
  } catch {
    // Si falla Supabase, devolver local
  }
  return localCodes
}

/**
 * Alterna el estatus Premium en el almacenamiento local para pruebas rápidas en dev.
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
