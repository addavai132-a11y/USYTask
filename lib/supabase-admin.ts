import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase Admin (service_role) — Bypassa RLS.
 *
 * SOLO para uso server-side en Route Handlers / cron jobs.
 * Necesario cuando una operación cross-user (ej: enviar push a otro usuario,
 * consultar suscripciones de otros, escribir en notification_log) requiere
 * acceso sin restricciones RLS.
 *
 * NUNCA importar esto en código cliente.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!serviceRoleKey) {
    console.warn('[supabase-admin] SUPABASE_SERVICE_ROLE_KEY no configurada — las operaciones admin fallarán.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
