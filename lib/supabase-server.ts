import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      maxAge: 31536000, // 1 año en segundos
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
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
            cookieStore.set(name, value, persistentOptions)
          })
        } catch {
          // Called from Server Component context
        }
      },
    },
  })
}
