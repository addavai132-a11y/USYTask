import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      maxAge: 31536000, // 1 año en segundos
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // FORZAR PERSISTENCIA: 1 año en segundos
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

          request.cookies.set({ name, value, ...persistentOptions })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({ name, value, ...persistentOptions })
        })
      },
    },
  })

  // Refresh token automatically if needed (validates against Supabase Auth server)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // If user is already authenticated and visits '/', '/login', or '/register', redirect automatically to /app
  if (user && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    const nextTarget = request.nextUrl.searchParams.get('next') || '/app'
    const redirectUrl = new URL(nextTarget, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
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
