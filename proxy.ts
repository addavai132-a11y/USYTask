/**
 * proxy.ts — Next.js 16 (replaces middleware.ts)
 *
 * Runs in the Node.js runtime (default in Next.js 16).
 * Handles session-cookie refresh via @supabase/ssr so that auth tokens
 * stay alive on every page load without forcing a full re-login.
 *
 * Design decisions:
 * - All code is wrapped in try/catch so a Supabase network hiccup
 *   NEVER crashes the request with MIDDLEWARE_INVOCATION_FAILED.
 * - We skip the auth network call for anonymous visitors (no session cookie)
 *   to avoid latency and cold-start failures on Vercel edge nodes.
 * - Redirects (logged-in user hits /login, /) forward auth cookies so the
 *   destination page immediately receives the refreshed session.
 *
 * Anti-494 cookie de-bloat:
 * - @supabase/ssr fragments the JWT across multiple cookies
 *   (sb-*-auth-token.0, .1, .2…). Setting a year-long maxAge on every
 *   fragment causes Set-Cookie headers to balloon past Vercel's 8 KB limit.
 * - Fix: use minimal cookie options (no custom maxAge/expires) and actively
 *   purge stale fragments (.1+) from every response.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Constants ──────────────────────────────────────────────────────────────

/** Abort Supabase getUser() after this many ms to avoid Vercel function timeouts */
const GET_USER_TIMEOUT_MS = 4_000

const PRIVATE_ROUTES = ['/app', '/complete-profile', '/onboarding', '/dev/promo-codes']

// ── Helpers ────────────────────────────────────────────────────────────────

function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTES.some((route) => pathname.startsWith(route))
}

function isSafeInternalPath(path: string, origin: string): boolean {
  try {
    const url = new URL(path, origin)
    return url.origin === origin
  } catch {
    return false
  }
}

/**
 * Minimal cookie options — deliberately omits maxAge/expires overrides.
 */
function minimalCookieOptions(options?: Record<string, unknown>) {
  const { maxAge: _maxAge, expires: _expires, ...rest } = (options || {}) as Record<string, unknown>
  return {
    ...rest,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

function purgeStaleTokenFragments(
  response: NextResponse,
  incomingCookies: Array<{ name: string; value: string }>,
  refreshedCookies: Set<string>
): void {
  try {
    incomingCookies.forEach(({ name }) => {
      if (name.match(/^sb-.+-auth-token\.[1-9]\d*$/)) {
        if (!refreshedCookies.has(name)) {
          response.cookies.set(name, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        }
      }
    })
  } catch {
    // Non-fatal — purge is best-effort
  }
}

function hasSupabaseAccessCookie(cookies: Array<{ name?: string }> | null | undefined): boolean {
  if (!Array.isArray(cookies)) return false
  return cookies.some((c) => {
    const name = c?.name ?? ''
    return (
      name.includes('-auth-token') &&
      !name.includes('code-verifier') &&
      !name.includes('auth-token-code')
    )
  })
}

async function getUserWithTimeout(
  getUser: () => Promise<{ data?: { user?: unknown } | null } | null>
): Promise<{ data?: { user?: { id?: string } | null } } | null> {
  let timerId: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<null>((resolve) => {
      timerId = setTimeout(() => resolve(null), GET_USER_TIMEOUT_MS)
    })
    const result = await Promise.race([getUser(), timeout])
    return result as { data?: { user?: { id?: string } | null } } | null
  } catch (err) {
    console.warn('[Proxy] Auth check timeout/error (non-fatal):', err)
    return null
  } finally {
    if (timerId !== undefined) clearTimeout(timerId)
  }
}

// ── Main proxy function ────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  try {
    const pathname = request.nextUrl?.pathname ?? ''

    // Nonce generation for CSP
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    
    // Create initial response with nonce header
    let supabaseResponse = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    })
    supabaseResponse.headers.set('x-nonce', nonce)
    
    // Set CSP Header with nonce
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https:;
      font-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app;
      object-src 'none';
      base-uri 'self';
      frame-src 'none';
      frame-ancestors 'none';
      form-action 'self';
      upgrade-insecure-requests;
      block-all-mixed-content;
    `.replace(/\s{2,}/g, ' ').trim()
    
    supabaseResponse.headers.set('Content-Security-Policy', cspHeader)

    // 1. Skip session refresh for OAuth callback, signout, and API routes.
    if (
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/signout') ||
      pathname.startsWith('/api/')
    ) {
      if (pathname.startsWith('/api/') && !pathname.startsWith('/api/promo-codes')) {
         supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0')
      }
      return supabaseResponse
    }

    const isPrivate = isPrivateRoute(pathname)

    // 2. Validate environment variables.
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const supabaseKey = (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      ''
    ).trim()

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Proxy] Missing Supabase environment variables')
      if (isPrivate) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return supabaseResponse
    }

    // 3. Read cookies safely.
    let incomingCookies: Array<{ name: string; value: string }> = []
    try {
      incomingCookies = request.cookies?.getAll?.() ?? []
    } catch {
      incomingCookies = []
    }

    // 4. Skip the network call for anonymous visitors (no session cookie).
    if (!hasSupabaseAccessCookie(incomingCookies)) {
      if (isPrivate) {
        return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url))
      }
      return supabaseResponse
    }

    let sessionRefreshed = false
    let refreshedCookies = new Set<string>()

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          try {
            return request.cookies?.getAll?.() ?? []
          } catch {
            return []
          }
        },
        setAll(cookiesToSet) {
          try {
            sessionRefreshed = true
            cookiesToSet?.forEach?.(({ name, value }) => {
              if (!name || typeof value !== 'string') return
              refreshedCookies.add(name)
              try {
                request.cookies.set(name, value)
              } catch {}
            })

            cookiesToSet?.forEach?.(({ name, value, options }) => {
              if (!name || typeof value !== 'string') return
              try {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  minimalCookieOptions(options as Record<string, unknown>)
                )
              } catch (err) {}
            })
          } catch (err) {}
        },
      },
    })

    // 6. Fetch the user (with timeout guard).
    const userResponse = await getUserWithTimeout(() => supabase.auth.getUser())
    const user =
      (userResponse as { data?: { user?: { id?: string } | null } } | null)?.data?.user ?? null

    // Fail-Closed for private routes
    if (!user && isPrivate) {
      const redirectUrl = new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // 7. Purge stale auth-token fragments
    if (sessionRefreshed) {
      purgeStaleTokenFragments(supabaseResponse, incomingCookies, refreshedCookies)
    }

    // 8. Redirect authenticated users away from public-only pages.
    if (user && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      const nextParam = request.nextUrl?.searchParams?.get?.('next') ?? '/app'
      const nextTarget = isSafeInternalPath(nextParam, request.nextUrl.origin) ? nextParam : '/app'
      const redirectUrl = new URL(nextTarget, request.url)
      
      const redirectResponse = NextResponse.redirect(redirectUrl)
      
      // Keep nonce and CSP on redirect response as well
      redirectResponse.headers.set('x-nonce', nonce)
      redirectResponse.headers.set('Content-Security-Policy', cspHeader)

      try {
        supabaseResponse.cookies.getAll?.()?.forEach((cookie) => {
          if (!cookie?.name) return
          try {
            // Unify options by pulling options from supabaseResponse if possible, or use minimal
            redirectResponse.cookies.set(
              cookie.name,
              cookie.value,
              minimalCookieOptions()
            )
          } catch {}
        })
      } catch (err) {}

      if (sessionRefreshed) {
        purgeStaleTokenFragments(redirectResponse, incomingCookies, refreshedCookies)
      }

      return redirectResponse
    }

    if (isPrivate) {
      supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0')
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Proxy] Critical unhandled exception:', error)
    // Fail-closed on error if it looks like a private route request
    if (request.nextUrl?.pathname?.startsWith('/app')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }
}

// ── Matcher ────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
