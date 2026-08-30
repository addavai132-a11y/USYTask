import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o la anon/publishable key')
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    isSingleton: true,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    cookieOptions: {
      maxAge: 31536000, // 1 año en segundos
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
}
