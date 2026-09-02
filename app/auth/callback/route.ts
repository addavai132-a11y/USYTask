import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Opciones mínimas de cookie para el callback de OAuth.
 *
 * Sin maxAge/expires personalizados: Supabase ya gestiona la duración del
 * token internamente. Forzar 1 año hacía que cada Set-Cookie pesara más y
 * que los fragmentos sb-*-auth-token acumularan datos en cabeceras → 494.
 *
 * sameSite:'lax' + path:'/' son los mínimos requeridos para iOS PWA.
 */
function minimalCookieOptions(options?: Record<string, unknown>) {
  // Extraemos solo lo que Supabase pasa (httpOnly, sameSite, secure…)
  // y sobreescribimos con valores seguros y livianos.
  const { maxAge: _maxAge, expires: _expires, ...rest } = (options || {}) as Record<string, unknown>
  return {
    ...rest,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextRaw = requestUrl.searchParams.get('next') ?? '/app'
  const next = isSafeInternalPath(nextRaw) ? nextRaw : '/app'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin

  // Cookies pendientes para el redirect (solo las que Supabase emite)
  const pendingCookies: Array<{
    name: string
    value: string
    options?: Record<string, unknown>
  }> = []

  /**
   * Construye la response de redirect y adjunta las cookies de sesión.
   * También purga cualquier fragmento extra (sb-*-auth-token.1, .2…)
   * para mantener las cabeceras por debajo del límite de Vercel.
   */
  const redirectWithCookies = (path: string) => {
    const res = NextResponse.redirect(new URL(path, baseUrl))

    // 1. Escribir las cookies nuevas de sesión
    const writtenBases = new Set<string>()
    pendingCookies.forEach(({ name, value, options }) => {
      if (!name || typeof value !== 'string') return
      try {
        res.cookies.set(name, value, minimalCookieOptions(options))
        // Registrar la base del cookie (sin sufijo numérico) para luego purgar extras
        const base = name.replace(/\.\d+$/, '')
        writtenBases.add(base)
      } catch (err) {
        console.error('[auth/callback] Failed setting cookie on redirect', name, err)
      }
    })

    // 2. Purgar fragmentos obsoletos de peticiones anteriores
    //    (sb-*-auth-token.1, .2, .3…) que ya no son necesarios.
    try {
      const incoming = new URL(request.url)
      const cookieHeader = request.headers.get('cookie') || ''
      cookieHeader.split(';').forEach((pair) => {
        const [rawName] = pair.split('=')
        const cookieName = rawName?.trim()
        if (!cookieName) return
        // Purgar fragmentos extra de auth-token (sufijo .1 o superior)
        if (cookieName.match(/^sb-.+-auth-token\.[1-9]\d*$/)) {
          res.cookies.set(cookieName, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        }
      })
    } catch {
      // Ignorar errores de purga — no afectan al flujo de auth
    }

    return res
  }

  try {
    if (code) {
      const cookieStore = await cookies()
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
      const supabaseKey = (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ''
      ).trim()

      if (!supabaseUrl || !supabaseKey) {
        console.error('[auth/callback] Missing Supabase env vars')
        return redirectWithCookies('/login?error=auth_misconfigured')
      }

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll() || []
            } catch {
              return []
            }
          },
          setAll(cookiesToSet) {
            cookiesToSet?.forEach?.(({ name, value, options }) => {
              if (!name || typeof value !== 'string') return
              pendingCookies.push({
                name,
                value,
                options: options as Record<string, unknown>,
              })
              try {
                cookieStore.set(name, value, minimalCookieOptions(options as Record<string, unknown>))
              } catch {
                // Cookie mutations can fail depending on Next response type
              }
            })
          },
        },
      })

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data?.user) {
        const user = data.user
        const metadata = user.user_metadata || {}

        const hasUsername = Boolean(metadata.username && String(metadata.username).trim().length > 0)
        const hasDateOfBirth = Boolean(
          metadata.date_of_birth || metadata.dateOfBirth || metadata.age
        )
        const isProfileCompleted = hasUsername && hasDateOfBirth

        const cloudBackup = metadata.usytask_cloud_backup
        const hasCloudGroups = Boolean(
          cloudBackup && Array.isArray(cloudBackup.groups) && cloudBackup.groups.length > 0
        )

        let hasDbFamily = false
        try {
          const { data: dbMembers, error: dbError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .limit(1)
          if (!dbError && dbMembers && dbMembers.length > 0) {
            hasDbFamily = true
          }
        } catch (familyErr) {
          console.warn('[auth/callback] group_members lookup skipped:', familyErr)
        }

        const hasFamily = hasCloudGroups || hasDbFamily

        if (next === '/reset-password' || next.startsWith('/reset-password')) {
          return redirectWithCookies(next)
        }

        if (isProfileCompleted) {
          if (hasFamily) {
            return redirectWithCookies(next || '/app')
          }
          return redirectWithCookies('/onboarding')
        }

        const afterProfileTarget = hasFamily ? (next || '/app') : '/onboarding'
        return redirectWithCookies(
          `/complete-profile?next=${encodeURIComponent(afterProfileTarget)}`
        )
      }

      if (error) {
        console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
      }
    }

    return redirectWithCookies('/login?error=auth_callback_failed')
  } catch (err) {
    console.error('Unhandled exception in auth callback:', err)
    return NextResponse.redirect(new URL('/login?error=auth_exception', baseUrl))
  }
}
