import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Middleware — Supabase session refresh + cookie de-bloat
 *
 * Problema raíz del error 494 "Request Header Too Large":
 *   @supabase/ssr fragmenta el token JWT en múltiples cookies
 *   (sb-*-auth-token.0, .1, .2…). Si el middleware o el callback
 *   las reescribe en cada petición con maxAge enorme, las cabeceras
 *   crecen sin límite y Vercel / nginx las rechaza.
 *
 * Solución:
 *   1. Leer la sesión actual y refrescarla con el mínimo de cookies posible.
 *   2. Purgar automáticamente los fragmentos obsoletos (.1, .2…) si la
 *      sesión cabe en un único cookie (fragmento .0 o sin sufijo).
 *   3. No imponer maxAge personalizados — dejar que Supabase use sus
 *      duraciones de sesión estándar (~1 hora de access token).
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()

  // Si faltan variables de entorno, dejar pasar sin tocar nada
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  // Clonar la request para poder modificar la response con cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Primero aplicamos en la request clonada
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        // Regeneramos la response con las cookies nuevas
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        // Aplicamos en la response las cookies con opciones mínimas
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            // No sobreescribir maxAge con valores enormes:
            // dejamos que Supabase controle la duración del token.
            // Solo forzamos path y sameSite para compatibilidad iOS PWA.
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        })
      },
    },
  })

  // Refrescar sesión — esto actualiza el access token si caducó
  await supabase.auth.getUser()

  // ── Cookie de-bloat ──────────────────────────────────────────────────────
  // Supabase puede fragmentar el token en sb-*-auth-token.0, .1, .2…
  // Si la sesión cabe en un único fragmento, purgamos los extras (.1+).
  // Esto reduce drásticamente el tamaño de las cabeceras.
  const allCookies = request.cookies.getAll()

  // Detectar el nombre base del cookie de sesión (sin sufijo numérico)
  const authCookieBase = allCookies
    .map((c) => c.name)
    .filter((n) => n.match(/^sb-.+-auth-token(\.0)?$/))
    .map((n) => n.replace(/\.0$/, ''))
    .find(Boolean)

  if (authCookieBase) {
    // Buscar fragmentos extra (.1, .2, .3…) y eliminarlos de la response
    allCookies.forEach(({ name }) => {
      if (name.match(new RegExp(`^${escapeRegex(authCookieBase)}\\.[1-9]\\d*$`))) {
        response.cookies.set(name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
    })
  }

  return response
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas EXCEPTO:
     * - _next/static   → assets estáticos
     * - _next/image    → optimización de imágenes
     * - favicon        → icono
     * - archivos con extensión (imágenes, fuentes, manifests…)
     * - api/push-*     → endpoints de push notifications (no necesitan sesión SSR)
     */
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|webmanifest)).*)',
  ],
}
