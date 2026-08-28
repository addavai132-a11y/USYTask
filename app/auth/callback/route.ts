import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'

  if (code) {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const user = data.user
      const metadata = user.user_metadata || {}

      // Check if user has completed profile (username and date of birth set)
      const hasUsername = Boolean(metadata.username && String(metadata.username).trim().length > 0)
      const hasDateOfBirth = Boolean(
        metadata.date_of_birth || metadata.dateOfBirth || metadata.age
      )
      if (next === '/reset-password' || next.startsWith('/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (isProfileCompleted) {
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        return NextResponse.redirect(`${origin}/complete-profile?next=${encodeURIComponent(next)}`)
      }
    }
  }

  // Fallback if exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
