import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        )
      },
    },
  })

  // Obtener usuario autenticado en el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  // 1. Proteger ruta /join y sus subrutas (/join/[id])
  if (pathname.startsWith('/join')) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('next', `${pathname}${search}`)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 2. Si el usuario ya está autenticado e intenta ir a /login o /register
  if (user && (pathname === '/login' || pathname === '/register')) {
    const nextParam = request.nextUrl.searchParams.get('next')
    if (nextParam && nextParam.startsWith('/join')) {
      return NextResponse.redirect(new URL(nextParam, request.url))
    }
    if (nextParam && nextParam.startsWith('/')) {
      return NextResponse.redirect(new URL(nextParam, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (manifest.webmanifest, manifest.json, sw.js, icons, images)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
