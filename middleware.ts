import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_MAX_AGE = 31536000
const GET_USER_TIMEOUT_MS = 3500

function passthrough(request: NextRequest) {
  return NextResponse.next({ request })
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}

function hasSupabaseAccessCookie(
  cookies: Array<{ name?: string }> | undefined | null
): boolean {
  if (!cookies || !Array.isArray(cookies)) return false
  return cookies.some((cookie) => {
    const name = cookie?.name || ''
    if (!name) return false
    const isAuthToken =
      name.includes('-auth-token') &&
      !name.includes('code-verifier') &&
      !name.includes('auth-token-code')
    return isAuthToken
  })
}

function persistentCookieOptions(options?: Record<string, unknown>) {
  const rest = { ...(options || {}) }
  delete rest.expires
  return {
    ...rest,
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

function copyCookies(from: NextResponse, to: NextResponse) {
  try {
    from.cookies?.getAll?.()?.forEach((cookie) => {
      if (!cookie?.name) return
      try {
        to.cookies.set(cookie.name, cookie.value, persistentCookieOptions())
      } catch {
        try {
          to.cookies.set(cookie.name, cookie.value)
        } catch (err) {
          console.error('[Middleware] Failed copying cookie', cookie.name, err)
        }
      }
    })
  } catch (err) {
    console.error('[Middleware] Failed copying cookies onto redirect:', err)
  }
}

async function getUserWithTimeout(
  getUser: () => Promise<{ data?: { user?: unknown } | null } | null>
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), GET_USER_TIMEOUT_MS)
    })
    const result = await Promise.race([Promise.resolve().then(getUser), timeout])
    return result
  } catch (err) {
    console.warn('[Middleware] Auth check fallback:', err)
    return null
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl?.pathname || ''

    // Never run session refresh on the OAuth callback or APIs:
    // PKCE/code-verifier cookies + getUser() is a common Vercel 500 for first logins.
    if (
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/signout') ||
      pathname.startsWith('/api/')
    ) {
      return passthrough(request)
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const supabaseKey = (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ).trim()

    if (!supabaseUrl || !supabaseKey) {
      return passthrough(request)
    }

    let incomingCookies: Array<{ name: string; value: string }> = []
    try {
      incomingCookies = request.cookies?.getAll?.() || []
    } catch (err) {
      console.warn('[Middleware] Could not read cookies:', err)
      incomingCookies = []
    }

    // First-time visitors have no session cookie. Skip the Auth network call
    // so a slow or failed getUser() cannot produce MIDDLEWARE_INVOCATION_FAILED.
    if (!hasSupabaseAccessCookie(incomingCookies)) {
      return passthrough(request)
    }

    let supabaseResponse = passthrough(request)

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookieOptions: {
        maxAge: SESSION_MAX_AGE,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
      cookies: {
        getAll() {
          try {
            return request.cookies?.getAll?.() || []
          } catch {
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet?.forEach?.((cookie) => {
              const name = cookie?.name
              const value = cookie?.value
              if (!name || typeof value !== 'string') return
              try {
                request.cookies?.set?.(name, value)
              } catch {
                // Request cookie bag may be immutable in some runtimes
              }
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet?.forEach?.((cookie) => {
              const name = cookie?.name
              const value = cookie?.value
              if (!name || typeof value !== 'string') return
              try {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  persistentCookieOptions(cookie.options as Record<string, unknown>)
                )
              } catch (cookieErr) {
                console.error('[Middleware] Error setting cookie', name, cookieErr)
              }
            })
          } catch (cookieErr) {
            console.error('[Middleware] Error setting cookies:', cookieErr)
          }
        },
      },
    })

    const userResponse = await getUserWithTimeout(() => supabase.auth.getUser())
    const user = (userResponse as { data?: { user?: { id?: string } | null } } | null)?.data
      ?.user || null

    if (
      user &&
      (pathname === '/' || pathname === '/login' || pathname === '/register')
    ) {
      const nextParam = request.nextUrl?.searchParams?.get?.('next') || '/app'
      const nextTarget = isSafeInternalPath(nextParam) ? nextParam : '/app'
      const redirectUrl = new URL(nextTarget, request.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)
      copyCookies(supabaseResponse, redirectResponse)
      return redirectResponse
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Middleware Critical Exception]', error)
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icon-.*|apple-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
