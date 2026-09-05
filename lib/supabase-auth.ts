import { createClient } from './supabase'
import {
  UserProfile,
  setStoredSession,
  clearStoredSession,
  getStoredSession,
  calculateAge,
} from './user-session'

/**
 * Initiates Google OAuth login via Supabase Auth.
 * Includes queryParams: { prompt: 'select_account' } to force account selection even if logged in.
 */
export async function handleGoogleAuth() {
  const supabase = createClient()
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const redirectUrl = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline',
      },
    },
  })

  if (error) {
    console.error('Supabase Google Auth Error:', error)
    throw error
  }

  return data
}

/**
 * Gets active Supabase session user and syncs with local session storage.
 */
export async function getActiveUserSession(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.warn('getActiveUserSession: Supabase getUser warning:', error.message)
    }

    if (!user) {
      return getStoredSession()
    }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata || {}
  const profile = profileData || {}

  const dateOfBirth = profile.date_of_birth || meta.date_of_birth || meta.dateOfBirth || null
  const username = profile.username || meta.username || ''
  const hasUsername = Boolean(username && String(username).trim().length > 0)
  const hasDateOfBirth = Boolean(dateOfBirth || meta.age)
  const profileCompleted = profile.profile_completed || Boolean(meta.profile_completed) || (hasUsername && hasDateOfBirth)

  const computedAge = calculateAge(dateOfBirth) ?? (meta.age ? Number(meta.age) : null)

  const isPremium = Boolean(profile.is_premium || meta.is_premium || false)
  const premiumUntil = profile.premium_until || meta.premium_until || null
  const premiumPlan = profile.premium_plan || meta.premium_plan || (isPremium ? 'lifetime' : null)

  const userProfile: UserProfile = {
    id: user.id,
    fullName: meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuario',
    username: username,
    dateOfBirth,
    age: computedAge,
    email: user.email || '',
    avatarUrl: meta.avatar_url || meta.picture || '',
    authProvider: 'google',
    profileCompleted,
    createdAt: user.created_at || new Date().toISOString(),
    points: typeof profile.points === 'number' ? profile.points : 0,
    isPremium,
    premiumUntil,
    premiumPlan,
  }

    setStoredSession(userProfile)
    return userProfile
  } catch (err) {
    console.error('getActiveUserSession failed:', err)
    return getStoredSession()
  }
}

/**
 * Updates profile data (username, date_of_birth) in Supabase user metadata and local session.
 */
export async function updateUserProfile(
  username: string,
  dateOfBirth: string
): Promise<{ success: boolean; profile: UserProfile | null; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, profile: null, error: 'No user session found' }
    }

    // 1. Upsert or update in public.profiles table
    let profileUpdateError: string | null = null
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username,
          date_of_birth: dateOfBirth,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (upsertErr) {
      console.warn('profiles upsert failed, attempting fallback update:', upsertErr.message)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          username,
          date_of_birth: dateOfBirth,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateErr) {
        console.error('profiles update also failed:', updateErr.message)
        profileUpdateError = upsertErr.message || updateErr.message
      }
    }

    // 2. Also update minimal user_metadata as best effort for session sync
    const { data } = await supabase.auth.updateUser({
      data: {
        username,
        date_of_birth: dateOfBirth,
        profile_completed: true,
      },
    }).catch(() => ({ data: null, error: null }))

    if (profileUpdateError) {
      console.error('Error saving user profile to profiles table:', profileUpdateError)
      return { success: false, profile: null, error: profileUpdateError }
    }

    const updatedUser = data?.user || user
    const meta = updatedUser?.user_metadata || {}
    const computedAge = calculateAge(dateOfBirth)

    const profile: UserProfile = {
      id: updatedUser?.id || 'usr_local',
      fullName: meta.full_name || meta.name || updatedUser?.email?.split('@')[0] || 'Usuario',
      username: username,
      dateOfBirth: dateOfBirth,
      age: computedAge,
      email: updatedUser?.email || '',
      avatarUrl: meta.avatar_url || meta.picture || '',
      authProvider: 'google',
      profileCompleted: true,
      createdAt: updatedUser?.created_at || new Date().toISOString(),
    }

    setStoredSession(profile)
    return { success: true, profile }
  } catch (err: any) {
    console.error('Failed to update user profile:', err)
    return { success: false, profile: null, error: err?.message || 'Error al actualizar perfil' }
  }
}

/**
 * Logs out from Supabase Auth and clears local session and all cached space data.
 */
export async function handleLogout(): Promise<void> {
  try {
    await fetch('/auth/signout', { method: 'POST', credentials: 'include' })
  } catch (err) {
    console.warn('Server signOut warning:', err)
  }

  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Supabase signOut warning:', err)
  }

  try {
    const { clearAllLocalData } = await import('./cloud-sync')
    clearAllLocalData()
  } catch (err) {
    console.warn('clearAllLocalData warning:', err)
  }

  clearStoredSession()

  try {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
  } catch (err) {
    console.error('Error clearing web storage on logout:', err)
  }

  try {
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=')
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()
        if (!name) return
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
      })
    }
  } catch (err) {
    console.error('Error clearing cookies on logout:', err)
  }

  // Force a full page reload to guarantee React Context state is cleared in memory.
  // This prevents data from a previous user from briefly appearing to the next user
  // who logs in on the same browser tab without a page refresh.
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}
