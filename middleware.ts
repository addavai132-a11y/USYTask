import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''

    // If Supabase environment variables are missing, proceed without breaking
    if (!supabaseUrl || !supabaseKey) {
      return supabaseResponse
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookieOptions: {
        maxAge: 31536000, // 1 año en segundos
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
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies?.set?.(name, value)
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              const maxAge = 31536000
              const expires = new Date(Date.now() + maxAge * 1000)
              const persistentOptions = {
                ...options,
                maxAge,
                expires,
                path: '/',
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
              }
              supabaseResponse.cookies?.set?.(name, value, persistentOptions)
            })
          } catch (cookieErr) {
            console.error('[Middleware] Error setting cookies:', cookieErr)
          }
        },
      },
    })

    // Refresh token automatically if needed (safely handled)
    let user = null
    try {
      const userResponse = await supabase.auth.getUser()
      user = userResponse?.data?.user || null
    } catch (authErr) {
      console.warn('[Middleware] Auth check fallback:', authErr)
      user = null
    }

    const pathname = request.nextUrl?.pathname || ''

    // If user is already authenticated and visits '/', '/login', or '/register', redirect automatically to /app
    if (user && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
      const nextTarget = request.nextUrl?.searchParams?.get?.('next') || '/app'
      const redirectUrl = new URL(nextTarget, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Middleware Critical Exception]', error)
    // Always return a valid NextResponse to prevent 500 MIDDLEWARE_INVOCATION_FAILED
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest, icons, service worker, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icon-.*|apple-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
