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
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: 60 * 60 * 24 * 365,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                path: '/',
              })
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
      // Check if user already has a family/groups in cloud backup or DB
      const cloudBackup = metadata.usytask_cloud_backup
      const hasCloudGroups = Boolean(
        cloudBackup && Array.isArray(cloudBackup.groups) && cloudBackup.groups.length > 0
      )

      let hasDbFamily = false
      try {
        const { data: dbMembers } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)
        if (dbMembers && dbMembers.length > 0) {
          hasDbFamily = true
        }
      } catch {
        // Table not created yet
      }

      const hasFamily = hasCloudGroups || hasDbFamily

      if (next === '/reset-password' || next.startsWith('/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (isProfileCompleted) {
        if (hasFamily) {
          return NextResponse.redirect(`${origin}${next || '/app'}`)
        } else {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      } else {
        const afterProfileTarget = hasFamily ? (next || '/app') : '/onboarding'
        return NextResponse.redirect(`${origin}/complete-profile?next=${encodeURIComponent(afterProfileTarget)}`)
      }
    }
  }

  // Fallback if exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
