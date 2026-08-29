import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/app'

  // Resolve public baseUrl accurately considering reverse proxies
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin

  try {
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
              // Ignore cookie mutations from server component contexts
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
        const isProfileCompleted = hasUsername && hasDateOfBirth

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
          // Table might not exist yet
        }

        const hasFamily = hasCloudGroups || hasDbFamily

        if (next === '/reset-password' || next.startsWith('/reset-password')) {
          return NextResponse.redirect(new URL(next, baseUrl))
        }

        if (isProfileCompleted) {
          if (hasFamily) {
            return NextResponse.redirect(new URL(next || '/app', baseUrl))
          } else {
            return NextResponse.redirect(new URL('/onboarding', baseUrl))
          }
        } else {
          const afterProfileTarget = hasFamily ? (next || '/app') : '/onboarding'
          return NextResponse.redirect(
            new URL(`/complete-profile?next=${encodeURIComponent(afterProfileTarget)}`, baseUrl)
          )
        }
      }
    }

    // Fallback if exchange fails or no code
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', baseUrl))
  } catch (err) {
    console.error('Unhandled exception in auth callback:', err)
    return NextResponse.redirect(new URL('/login?error=auth_exception', baseUrl))
  }
}
