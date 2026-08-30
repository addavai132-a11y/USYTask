import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })

  try {
    const cookieStore = await cookies()
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const supabaseKey = (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ).trim()

    if (supabaseUrl && supabaseKey) {
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
              if (!name) return
              try {
                cookieStore.set(name, value, options)
              } catch {
                // ignore
              }
              try {
                response.cookies.set(name, value, options)
              } catch {
                // ignore
              }
            })
          },
        },
      })

      await supabase.auth.signOut()
    }

    const allCookies = cookieStore.getAll?.() || []
    allCookies.forEach((cookie) => {
      const name = cookie?.name || ''
      if (!name) return
      if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth-token')) {
        try {
          response.cookies.set(name, '', {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
          })
        } catch (err) {
          console.error('[signout] Failed clearing cookie', name, err)
        }
      }
    })
  } catch (err) {
    console.error('[signout] Error clearing server session:', err)
  }

  return response
}
