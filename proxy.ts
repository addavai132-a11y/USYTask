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

// ── Helpers ────────────────────────────────────────────────────────────────

function passthrough(request: NextRequest): NextResponse {
  return NextResponse.next({ request })
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')
}

/**
 * Minimal cookie options — deliberately omits maxAge/expires overrides.
 *
 * Supabase manages token lifetimes internally (access token ~1h, refresh
 * token session-length). Overriding with 1 year caused cookies to accumulate
 * across fragments and bloat request headers beyond Vercel's 8 KB limit.
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Purge stale auth-token fragments (.1, .2, .3…) from a response.
 *
 * When the JWT fits in a single cookie (sb-*-auth-token or .0), any
 * leftover higher-numbered fragments from previous sessions inflate the
 * Cookie header unnecessarily. Expire them so they are cleared client-side.
 */
function purgeStaleTokenFragments(
  response: NextResponse,
  incomingCookies: Array<{ name: string; value: string }>
): void {
  try {
    incomingCookies.forEach(({ name }) => {
      if (name.match(/^sb-.+-auth-token\.[1-9]\d*$/)) {
        response.cookies.set(name, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(0),
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
    })
  } catch {
    // Non-fatal — purge is best-effort
  }
}

/**
 * Check whether the incoming cookies contain a Supabase session token.
 * Avoids the Supabase auth network round-trip for anonymous visitors.
 */
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

/**
 * Race Supabase getUser() against a timeout promise so a slow network or
 * cold Supabase instance cannot hang the proxy and trigger a 504 / 500.
 */
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

    // 1. Skip session refresh for OAuth callback, signout, and API routes.
    //    getUser() + PKCE code-verifier cookies is a frequent source of 500s.
    if (
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/signout') ||
      pathname.startsWith('/api/')
    ) {
      return passthrough(request)
    }

    // 2. Validate environment variables.
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
    const supabaseKey = (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      ''
    ).trim()

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Proxy] Missing Supabase environment variables — skipping auth check')
      return passthrough(request)
    }

    // 3. Read cookies safely.
    let incomingCookies: Array<{ name: string; value: string }> = []
    try {
      incomingCookies = request.cookies?.getAll?.() ?? []
    } catch {
      incomingCookies = []
    }

    // 4. Skip the network call for anonymous visitors (no session cookie).
    //    This is the single biggest source of MIDDLEWARE_INVOCATION_FAILED
    //    on first-time loads when the Edge network cold-starts.
    if (!hasSupabaseAccessCookie(incomingCookies)) {
      return passthrough(request)
    }

    // 5. Build the Supabase client with a mutable response object for cookies.
    let supabaseResponse = NextResponse.next({ request })

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
            // Mutate request cookie bag (Node.js runtime — mutable)
            cookiesToSet?.forEach?.(({ name, value }) => {
              if (!name || typeof value !== 'string') return
              try {
                request.cookies.set(name, value)
              } catch {
                // Ignore — response cookies are the authoritative path
              }
            })

            // Build a fresh response with updated cookies
            supabaseResponse = NextResponse.next({ request })

            // Apply minimal options — no year-long maxAge to avoid 494 bloat
            cookiesToSet?.forEach?.(({ name, value, options }) => {
              if (!name || typeof value !== 'string') return
              try {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  minimalCookieOptions(options as Record<string, unknown>)
                )
              } catch (err) {
                console.error('[Proxy] Cookie set error:', name, err)
              }
            })
          } catch (err) {
            console.error('[Proxy] setAll error:', err)
          }
        },
      },
    })

    // 6. Fetch the user (with timeout guard).
    const userResponse = await getUserWithTimeout(() => supabase.auth.getUser())
    const user =
      (userResponse as { data?: { user?: { id?: string } | null } } | null)?.data?.user ?? null

    // 7. Purge stale auth-token fragments to keep Cookie headers slim (anti-494).
    purgeStaleTokenFragments(supabaseResponse, incomingCookies)

    // 8. Redirect authenticated users away from public-only pages.
    if (user && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      const nextParam = request.nextUrl?.searchParams?.get?.('next') ?? '/app'
      const nextTarget = isSafeInternalPath(nextParam) ? nextParam : '/app'
      const redirectUrl = new URL(nextTarget, request.url)
      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Forward any refreshed session cookies to the redirect destination
      try {
        supabaseResponse.cookies.getAll?.()?.forEach((cookie) => {
          if (!cookie?.name) return
          try {
            redirectResponse.cookies.set(
              cookie.name,
              cookie.value,
              minimalCookieOptions()
            )
          } catch {
            // Non-fatal
          }
        })
      } catch (err) {
        console.error('[Proxy] Failed to copy cookies onto redirect:', err)
      }

      // Also purge stale fragments on the redirect response
      purgeStaleTokenFragments(redirectResponse, incomingCookies)

      return redirectResponse
    }

    return supabaseResponse
  } catch (error) {
    // Last-resort catch: never let the proxy crash the entire request.
    console.error('[Proxy] Critical unhandled exception:', error)
    return NextResponse.next({ request })
  }
}

// ── Matcher ────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static JS/CSS bundles)
     * - _next/image   (image optimisation)
     * - favicon.ico, manifest.webmanifest, service worker, icons, apple-touch
     * - Any static image/font extension
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icon-.*|apple-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}
