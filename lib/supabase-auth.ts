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
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return getStoredSession()
  }

  const meta = user.user_metadata || {}
  const dateOfBirth = meta.date_of_birth || meta.dateOfBirth || null
  const hasUsername = Boolean(meta.username && String(meta.username).trim().length > 0)
  const hasDateOfBirth = Boolean(dateOfBirth || meta.age)
  const profileCompleted = Boolean(meta.profile_completed) || (hasUsername && hasDateOfBirth)

  const computedAge = calculateAge(dateOfBirth) ?? (meta.age ? Number(meta.age) : null)

  const profile: UserProfile = {
    id: user.id,
    fullName: meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuario',
    username: meta.username || '',
    dateOfBirth,
    age: computedAge,
    email: user.email || '',
    avatarUrl: meta.avatar_url || meta.picture || '',
    authProvider: 'google',
    profileCompleted,
    createdAt: user.created_at || new Date().toISOString(),
  }

  setStoredSession(profile)
  return profile
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase.auth.updateUser({
      data: {
        username,
        date_of_birth: dateOfBirth,
        dateOfBirth: dateOfBirth,
        profile_completed: true,
      },
    })

    if (error) {
      console.error('Error updating user profile in Supabase:', error)
      return { success: false, profile: null, error: error.message }
    }

    const updatedUser = data.user || user
    const meta = updatedUser?.user_metadata || {}
    const dob = meta.date_of_birth || meta.dateOfBirth || dateOfBirth
    const computedAge = calculateAge(dob)

    const profile: UserProfile = {
      id: updatedUser?.id || 'usr_local',
      fullName: meta.full_name || meta.name || updatedUser?.email?.split('@')[0] || 'Usuario',
      username: meta.username || username,
      dateOfBirth: dob,
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

import { clearAllLocalData } from './cloud-sync'

/**
 * Logs out from Supabase Auth and clears local session and all cached space data.
 */
export async function handleLogout(): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Supabase signOut warning:', err)
  } finally {
    clearStoredSession()
    clearAllLocalData()
  }
}
