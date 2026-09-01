import { createBrowserClient } from '@supabase/ssr'

/**
 * createClient — Cliente Supabase para el navegador (browser-side).
 *
 * Usa `localStorage` como almacenamiento de sesión en lugar de cookies para:
 * - Evitar el error "494: Request Header Too Large" en Vercel cuando los
 *   tokens JWT de Supabase inflan las cabeceras HTTP más allá del límite.
 * - Garantizar compatibilidad con accesos directos PWA en móviles (donde
 *   los contextos de cookie pueden estar restringidos).
 *
 * `isSingleton: true` asegura que solo se crea una instancia del cliente
 * durante el ciclo de vida de la página, evitando múltiples subscripciones.
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      isSingleton: true,
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
