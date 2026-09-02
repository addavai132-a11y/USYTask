import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * createClient — Cliente Supabase para Server Components / Route Handlers.
 *
 * Opciones de cookie intencionalmente minimalistas para evitar el error
 * "494: Request Header Too Large" en Vercel cuando la sesión se fragmenta:
 *
 *   - Sin maxAge personalizado: Supabase gestiona la duración del token
 *     internamente (access token ~1 h, refresh token ~semanas).
 *     Forzar maxAge=31536000 hacía que cada Set-Cookie pesara más y que
 *     los fragmentos sb-*-auth-token.0/.1/.2 se acumularan en cabeceras.
 *
 *   - path + sameSite mínimos para compatibilidad iOS PWA (standalone mode
 *     requiere cookies con path='/' y sameSite='lax').
 */
export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll?.() || []
        } catch (err) {
          console.error('[supabase-server] Error reading cookies:', err)
          return []
        }
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          })
        } catch {
          // Ignorado en Server Component context (solo lectura)
        }
      },
    },
  })
}
